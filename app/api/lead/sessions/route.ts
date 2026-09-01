import { NextResponse } from "next/server";
import { adminTokenHash, clearAdminSession, currentAdmin, d1, recordAudit } from "../../_shared";

export type AdminSessionView = {
  id: string;
  createdAt: number;
  lastSeenAt: number;
  expiresAt: number;
  ip: string | null;
  userAgent: string | null;
  current: boolean;
};

export type AdminAuditView = {
  action: string;
  detail: string | null;
  ip: string | null;
  createdAt: number;
};

/**
 * Lists the caller's own live sessions and recent account activity.
 *
 * Only the caller's rows are returned: one administrator must not be able to
 * read another's device list or IP addresses.
 */
export async function GET(req: Request) {
  const admin = await currentAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Lead access required" }, { status: 401, headers: { "cache-control": "no-store" } });
  }
  const now = Date.now();
  const current = adminTokenHash(req);
  const [sessions, audit] = await Promise.all([
    d1()
      .prepare(
        "SELECT token_hash, created_at, last_seen_at, expires_at, ip, user_agent FROM admin_sessions WHERE admin_id = ? AND revoked_at IS NULL AND expires_at > ? ORDER BY last_seen_at DESC LIMIT 50",
      )
      .bind(admin.id, now)
      .all<{
        token_hash: string;
        created_at: number;
        last_seen_at: number;
        expires_at: number;
        ip: string | null;
        user_agent: string | null;
      }>(),
    d1()
      .prepare("SELECT action, detail, ip, created_at FROM admin_audit_log WHERE admin_id = ? ORDER BY created_at DESC LIMIT 30")
      .bind(admin.id)
      .all<{ action: string; detail: string | null; ip: string | null; created_at: number }>(),
  ]);
  return NextResponse.json(
    {
      username: admin.username,
      sessions: sessions.results.map((row) => ({
        id: row.token_hash,
        createdAt: Number(row.created_at),
        lastSeenAt: Number(row.last_seen_at),
        expiresAt: Number(row.expires_at),
        ip: row.ip,
        userAgent: row.user_agent,
        current: row.token_hash === current,
      })) satisfies AdminSessionView[],
      audit: audit.results.map((row) => ({
        action: row.action,
        detail: row.detail,
        ip: row.ip,
        createdAt: Number(row.created_at),
      })) satisfies AdminAuditView[],
    },
    { headers: { "cache-control": "no-store" } },
  );
}

/**
 * Revokes one session (`{ id }`) or every session for the account (`{ all: true }`).
 * Only the caller's own sessions are ever affected.
 */
export async function DELETE(req: Request) {
  const admin = await currentAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Lead access required" }, { status: 401, headers: { "cache-control": "no-store" } });
  }
  const body = (await req.json().catch(() => ({}))) as { id?: string; all?: boolean };
  const now = Date.now();
  const current = adminTokenHash(req);

  if (body.all) {
    await d1()
      .prepare("UPDATE admin_sessions SET revoked_at = ? WHERE admin_id = ? AND revoked_at IS NULL")
      .bind(now, admin.id)
      .run();
    await recordAudit(admin.id, "revoke_all_sessions", null, req);
    const res = NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
    clearAdminSession(res);
    return res;
  }

  const id = String(body.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "Session id required" }, { status: 400, headers: { "cache-control": "no-store" } });
  }
  await d1()
    .prepare("UPDATE admin_sessions SET revoked_at = ? WHERE token_hash = ? AND admin_id = ? AND revoked_at IS NULL")
    .bind(now, id, admin.id)
    .run();
  await recordAudit(admin.id, "revoke_session", id.slice(0, 12), req);
  const res = NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  // Revoking the session in use must end it immediately rather than waiting
  // for the cached lookup to expire.
  if (id === current) clearAdminSession(res);
  return res;
}
