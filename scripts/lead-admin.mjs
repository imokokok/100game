#!/usr/bin/env node
// Administrator account CLI.
//
//   node scripts/lead-admin.mjs create hera --password 080911
//   node scripts/lead-admin.mjs set-password hera          # prints a new random password
//   node scripts/lead-admin.mjs list
//   node scripts/lead-admin.mjs disable hera | enable hera
//   node scripts/lead-admin.mjs sessions hera
//   node scripts/lead-admin.mjs revoke hera --all
//   node scripts/lead-admin.mjs audit hera
//
// Password hashing lives in db/admin-crypto.mjs, the same module the
// application uses, so a password written here always verifies there.

import { existsSync, readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import postgres from "postgres";
import { hashPassword } from "../db/admin-crypto.mjs";

loadEnv();

const [command, ...rest] = process.argv.slice(2);

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) continue;
      let value = match[2].trim();
      if (/^(".*"|'.*')$/s.test(value)) value = value.slice(1, -1);
      if (process.env[match[1]] === undefined) process.env[match[1]] = value;
    }
  }
}

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--all") flags.all = true;
    else if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) flags[key] = true;
      else {
        flags[key] = next;
        i++;
      }
    } else positional.push(token);
  }
  return { positional, flags };
}

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Add it to .env.local or export it first.");
    process.exit(1);
  }
  return postgres(url, { prepare: false, max: 1 });
}

async function ensureTables(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS admins (
      id text PRIMARY KEY NOT NULL,
      username text NOT NULL,
      display_name text NOT NULL,
      password_hash text NOT NULL,
      password_salt text NOT NULL,
      created_at bigint NOT NULL,
      last_login_at bigint,
      disabled_at bigint
    )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_username ON admins (lower(username))`;
  await sql`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token_hash text PRIMARY KEY NOT NULL,
      admin_id text NOT NULL,
      created_at bigint NOT NULL,
      expires_at bigint NOT NULL,
      last_seen_at bigint NOT NULL,
      ip text,
      user_agent text,
      revoked_at bigint
    )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin ON admin_sessions (admin_id, expires_at)`;
  await sql`
    CREATE TABLE IF NOT EXISTS admin_audit_log (
      id text PRIMARY KEY NOT NULL,
      admin_id text,
      action text NOT NULL,
      detail text,
      ip text,
      created_at bigint NOT NULL
    )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log (created_at)`;
}

async function findAdmin(sql, username) {
  const rows = await sql`SELECT id, username, display_name, created_at, last_login_at, disabled_at
    FROM admins WHERE lower(username) = lower(${username})`;
  return rows[0] ?? null;
}

function randomPassword() {
  return randomBytes(24).toString("base64url");
}

function strengthWarning(password) {
  if (password.length < 12) {
    return `Warning: this password is only ${password.length} characters. 16 or more is recommended.`;
  }
  return null;
}

function showPassword(password) {
  console.log("");
  console.log(`  Password: ${password}`);
  console.log("");
}

async function create({ positional, flags }) {
  const username = positional[0];
  if (!username) fail("Usage: lead-admin.mjs create <username> [--password <password>] [--name \"Display name\"]");
  const sql = db();
  await ensureTables(sql);
  if (await findAdmin(sql, username)) fail(`Administrator "${username}" already exists. Use set-password to change its password.`);
  const password = typeof flags.password === "string" ? flags.password : randomPassword();
  const { salt, hash } = await hashPassword(password);
  await sql`INSERT INTO admins (id, username, display_name, password_hash, password_salt, created_at, last_login_at, disabled_at)
    VALUES (${crypto.randomUUID()}, ${username}, ${typeof flags.name === "string" ? flags.name : username}, ${hash}, ${salt}, ${Date.now()}, NULL, NULL)`;
  console.log(`Created administrator "${username}".`);
  if (typeof flags.password === "string") {
    const warning = strengthWarning(password);
    if (warning) console.log(warning);
  } else {
    console.log("Save this password now — it is not stored in recoverable form and cannot be shown again.");
    showPassword(password);
  }
  await sql.end();
}

async function setPassword({ positional, flags }) {
  const username = positional[0];
  if (!username) fail("Usage: lead-admin.mjs set-password <username> [--password <password>] [--keep-sessions]");
  const sql = db();
  await ensureTables(sql);
  const admin = await findAdmin(sql, username);
  if (!admin) fail(`No administrator named "${username}".`);
  const password = typeof flags.password === "string" ? flags.password : randomPassword();
  const { salt, hash } = await hashPassword(password);
  await sql`UPDATE admins SET password_hash = ${hash}, password_salt = ${salt} WHERE id = ${admin.id}`;
  console.log(`Updated the password for "${username}".`);
  if (flags["keep-sessions"]) {
    console.log("Existing sessions stay signed in.");
  } else {
    const now = Date.now();
    await sql`UPDATE admin_sessions SET revoked_at = ${now} WHERE admin_id = ${admin.id} AND revoked_at IS NULL`;
    await sql`INSERT INTO admin_audit_log (id, admin_id, action, detail, ip, created_at)
      VALUES (${crypto.randomUUID()}, ${admin.id}, 'password_reset', 'cli', NULL, ${now})`;
    console.log("Every existing session for this account was signed out.");
  }
  if (typeof flags.password === "string") {
    const warning = strengthWarning(password);
    if (warning) console.log(warning);
  } else {
    console.log("Save this password now — it is not stored in recoverable form and cannot be shown again.");
    showPassword(password);
  }
  await sql.end();
}

async function list() {
  const sql = db();
  await ensureTables(sql);
  const rows = await sql`SELECT username, display_name, created_at, last_login_at, disabled_at FROM admins ORDER BY created_at`;
  if (!rows.length) {
    console.log("No administrator accounts yet. Create one with:");
    console.log("  node scripts/lead-admin.mjs create <username>");
    await sql.end();
    return;
  }
  for (const row of rows) {
    const state = row.disabled_at ? "disabled" : "active";
    const last = row.last_login_at ? new Date(Number(row.last_login_at)).toISOString() : "never";
    console.log(`${row.username.padEnd(20)} ${state.padEnd(9)} last login ${last}   display: ${row.display_name}`);
  }
  await sql.end();
}

async function setDisabled(username, disabled) {
  if (!username) fail("Usage: lead-admin.mjs disable|enable <username>");
  const sql = db();
  await ensureTables(sql);
  const admin = await findAdmin(sql, username);
  if (!admin) fail(`No administrator named "${username}".`);
  const now = disabled ? Date.now() : null;
  await sql`UPDATE admins SET disabled_at = ${now} WHERE id = ${admin.id}`;
  if (disabled) {
    await sql`UPDATE admin_sessions SET revoked_at = ${Date.now()} WHERE admin_id = ${admin.id} AND revoked_at IS NULL`;
    console.log(`Disabled "${username}" and signed out every session.`);
  } else {
    console.log(`Enabled "${username}".`);
  }
  await sql.end();
}

async function sessions({ positional }) {
  const username = positional[0];
  if (!username) fail("Usage: lead-admin.mjs sessions <username>");
  const sql = db();
  await ensureTables(sql);
  const admin = await findAdmin(sql, username);
  if (!admin) fail(`No administrator named "${username}".`);
  const rows = await sql`SELECT token_hash, created_at, last_seen_at, expires_at, ip, user_agent
    FROM admin_sessions WHERE admin_id = ${admin.id} AND revoked_at IS NULL AND expires_at > ${Date.now()}
    ORDER BY last_seen_at DESC LIMIT 50`;
  if (!rows.length) {
    console.log("No live sessions.");
    await sql.end();
    return;
  }
  for (const row of rows) {
    const ago = Math.round((Date.now() - Number(row.last_seen_at)) / 60000);
    console.log(`${row.token_hash.slice(0, 12)}  ${ago}m ago  ${row.ip ?? "?"}  ${(row.user_agent ?? "").slice(0, 60)}`);
  }
  await sql.end();
}

async function revoke({ positional, flags }) {
  const username = positional[0];
  if (!username) fail("Usage: lead-admin.mjs revoke <username> [--all]");
  const sql = db();
  await ensureTables(sql);
  const admin = await findAdmin(sql, username);
  if (!admin) fail(`No administrator named "${username}".`);
  if (!flags.all) {
    console.log("Refusing to revoke: pass --all to sign out every session for this account.");
    await sql.end();
    return;
  }
  await sql`UPDATE admin_sessions SET revoked_at = ${Date.now()} WHERE admin_id = ${admin.id} AND revoked_at IS NULL`;
  console.log(`Signed out every session for "${username}".`);
  await sql.end();
}

async function audit({ positional, flags }) {
  const username = positional[0];
  const limit = Math.min(Number(flags.limit ?? 40) || 40, 500);
  const sql = db();
  await ensureTables(sql);
  const adminId = username ? (await findAdmin(sql, username))?.id ?? null : null;
  if (username && !adminId) fail(`No administrator named "${username}".`);
  const rows = adminId
    ? await sql`SELECT action, detail, ip, created_at FROM admin_audit_log WHERE admin_id = ${adminId} ORDER BY created_at DESC LIMIT ${limit}`
    : await sql`SELECT action, detail, ip, created_at FROM admin_audit_log ORDER BY created_at DESC LIMIT ${limit}`;
  for (const row of rows) {
    console.log(`${new Date(Number(row.created_at)).toISOString()}  ${row.action.padEnd(20)} ${row.detail ?? ""}  ${row.ip ?? ""}`);
  }
  if (!rows.length) console.log("No audit entries.");
  await sql.end();
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const { positional, flags } = parseArgs(rest);
const commands = { create, "set-password": setPassword, list, sessions, revoke, audit };

try {
  if (command === "disable") await setDisabled(positional[0], true);
  else if (command === "enable") await setDisabled(positional[0], false);
  else if (commands[command]) await commands[command]({ positional, flags });
  else {
    console.log("Unknown or missing command.\n");
    console.log("  create <username> [--password <pw>] [--name <display>]");
    console.log("  set-password <username> [--password <pw>] [--keep-sessions]");
    console.log("  list | disable <username> | enable <username>");
    console.log("  sessions <username> | revoke <username> --all | audit [username]");
    process.exit(1);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
