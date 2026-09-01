-- ============================================================================
-- WHAT 100 PEOPLE DO TO A GAME — administrator accounts
-- ============================================================================
-- Replaces the hard-coded lead name plus single shared access code with real
-- administrator accounts: hashed passwords, revocable server-side sessions,
-- and an audit trail.
--
-- This file only ever adds tables. No existing table, column, or row is
-- modified, so running it against a live database cannot lose project data.
--
-- The application also creates these tables on first use, so deploying this
-- file is optional. Run it when you prefer to create schema explicitly, or
-- when the runtime database role is not allowed to run DDL.
-- ============================================================================

CREATE TABLE IF NOT EXISTS "admins" (
  "id" text PRIMARY KEY NOT NULL,
  "username" text NOT NULL,
  "display_name" text NOT NULL,
  "password_hash" text NOT NULL,
  "password_salt" text NOT NULL,
  "created_at" bigint NOT NULL,
  "last_login_at" bigint,
  "disabled_at" bigint
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_admins_username" ON "admins" (lower("username"));

CREATE TABLE IF NOT EXISTS "admin_sessions" (
  "token_hash" text PRIMARY KEY NOT NULL,
  "admin_id" text NOT NULL,
  "created_at" bigint NOT NULL,
  "expires_at" bigint NOT NULL,
  "last_seen_at" bigint NOT NULL,
  "ip" text,
  "user_agent" text,
  "revoked_at" bigint
);
CREATE INDEX IF NOT EXISTS "idx_admin_sessions_admin" ON "admin_sessions" ("admin_id", "expires_at");

CREATE TABLE IF NOT EXISTS "admin_audit_log" (
  "id" text PRIMARY KEY NOT NULL,
  "admin_id" text,
  "action" text NOT NULL,
  "detail" text,
  "ip" text,
  "created_at" bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_admin_audit_created" ON "admin_audit_log" ("created_at");

-- Verifies the three tables exist. This script creates nothing else.
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('admins', 'admin_sessions', 'admin_audit_log')
ORDER BY table_name;
