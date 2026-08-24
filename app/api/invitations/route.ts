import { NextRequest, NextResponse } from "next/server";
import { d1, isOwner } from "../_shared";

async function hash(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, "0")).join("");
}

function makeToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const raw = [...bytes].map(x => x.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `W100-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

export async function GET(req: NextRequest) {
  if (!isOwner(req)) return NextResponse.json({ error: "Owner sign-in required" }, { status: 401 });
  const rows = await d1().prepare(`
    SELECT i.id, i.label, i.token_hint, i.created_at, i.expires_at, i.revoked_at,
      p.id AS participant_id, COALESCE(p.display_code, 'SHARED') AS display_code, p.last_active_at, p.activity_count
    FROM invitations i LEFT JOIN participants p ON p.id = i.participant_id
    ORDER BY i.created_at DESC LIMIT 200
  `).all();
  return NextResponse.json({ invitations: rows.results });
}

export async function POST(req: NextRequest) {
  if (!isOwner(req)) return NextResponse.json({ error: "Only the Owner can create invitations" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const label = String(body.label ?? "New participant").trim().slice(0, 80) || "New participant";
  const days = Math.max(1, Math.min(365, Math.trunc(Number(body.expiresInDays) || 90)));
  const token = makeToken();
  const participantId = crypto.randomUUID();
  const invitationId = crypto.randomUUID();
  const displayCode = `P-${token.slice(-4)}`;
  const now = Date.now();
  const owner = req.headers.get("oai-authenticated-user-id") ?? "owner";
  await d1().batch([
    d1().prepare("INSERT INTO participants (id, display_code, locale, created_at, last_active_at, activity_count) VALUES (?, ?, 'zh', ?, NULL, 0)").bind(participantId, displayCode, now),
    d1().prepare("INSERT INTO invitations (id, token_hash, participant_id, label, token_hint, created_at, created_by, expires_at, revoked_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)").bind(invitationId, await hash(token), participantId, label, `…${token.slice(-4)}`, now, owner, now + days * 86400000),
  ]);
  return NextResponse.json({ invitation: { id: invitationId, token, label, displayCode, expiresAt: now + days * 86400000 } }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!isOwner(req)) return NextResponse.json({ error: "Only the Owner can revoke invitations" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "Invitation id required" }, { status: 400 });
  await d1().prepare("UPDATE invitations SET revoked_at = ? WHERE id = ?").bind(Date.now(), id).run();
  return NextResponse.json({ ok: true });
}
