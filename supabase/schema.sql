-- ============================================================================
-- WHAT 100 PEOPLE DO TO A GAME — Supabase / Postgres schema
-- Run this once in the Supabase SQL editor (or `psql`) before deploying.
-- Ported from the original Cloudflare D1 migrations. All times are epoch ms
-- stored as integer. IDs are text (UUIDs generated in app code).
-- ============================================================================

CREATE TABLE IF NOT EXISTS "users" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "name" text,
  "role" text NOT NULL,
  "created_at" bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS "participants" (
  "id" text PRIMARY KEY NOT NULL,
  "display_code" text NOT NULL,
  "locale" text DEFAULT 'zh' NOT NULL,
  "created_at" bigint NOT NULL,
  "last_active_at" bigint,
  "activity_count" integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "idx_participants_display_code" ON "participants" ("display_code");

CREATE TABLE IF NOT EXISTS "invitations" (
  "id" text PRIMARY KEY NOT NULL,
  "token_hash" text NOT NULL,
  "participant_id" text NOT NULL,
  "label" text,
  "token_hint" text,
  "reusable" integer NOT NULL DEFAULT 0,
  "created_at" bigint NOT NULL DEFAULT 0,
  "created_by" text,
  "expires_at" bigint,
  "revoked_at" bigint
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_invitation_token" ON "invitations" ("token_hash");

CREATE TABLE IF NOT EXISTS "participant_sessions" (
  "token_hash" text PRIMARY KEY NOT NULL,
  "participant_id" text NOT NULL,
  "created_at" bigint NOT NULL,
  "expires_at" bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_participant_sessions_participant" ON "participant_sessions" ("participant_id", "expires_at");

CREATE TABLE IF NOT EXISTS "tasks" (
  "id" text PRIMARY KEY NOT NULL,
  "title_zh" text NOT NULL,
  "title_en" text NOT NULL,
  "status" text NOT NULL,
  "sort_order" integer NOT NULL,
  "week" integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "submissions" (
  "id" text PRIMARY KEY NOT NULL,
  "participant_id" text NOT NULL,
  "task_id" text NOT NULL,
  "kind" text NOT NULL,
  "body" text,
  "file_key" text,
  "status" text NOT NULL,
  "updated_at" bigint NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_submissions_participant_task_unique" ON "submissions" ("participant_id", "task_id");
CREATE INDEX IF NOT EXISTS "idx_submissions_participant" ON "submissions" ("participant_id");

CREATE TABLE IF NOT EXISTS "survey_responses" (
  "id" text PRIMARY KEY NOT NULL,
  "participant_id" text NOT NULL,
  "survey_id" text NOT NULL,
  "payload" text NOT NULL,
  "updated_at" bigint NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_survey_participant_unique" ON "survey_responses" ("participant_id", "survey_id");

CREATE TABLE IF NOT EXISTS "survey_forms" (
  "id" text PRIMARY KEY NOT NULL,
  "title_zh" text NOT NULL,
  "title_en" text NOT NULL,
  "question_zh" text NOT NULL,
  "question_en" text NOT NULL,
  "status" text NOT NULL,
  "created_at" bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_survey_forms_status_created" ON "survey_forms" ("status", "created_at");

CREATE TABLE IF NOT EXISTS "game_links" (
  "id" text PRIMARY KEY NOT NULL,
  "version" text NOT NULL,
  "url" text NOT NULL,
  "notes_zh" text,
  "notes_en" text,
  "published_at" bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_game_links_published" ON "game_links" ("published_at");

CREATE TABLE IF NOT EXISTS "journal_entries" (
  "id" text PRIMARY KEY NOT NULL,
  "title_zh" text NOT NULL,
  "title_en" text NOT NULL,
  "body_zh" text NOT NULL DEFAULT '',
  "body_en" text NOT NULL DEFAULT '',
  "stage" text NOT NULL DEFAULT 'week-0',
  "tags" text NOT NULL DEFAULT '',
  "file_key" text NOT NULL,
  "participant_id" text,
  "content_type" text,
  "file_name" text,
  "occurred_at" bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_journal_entries_occurred" ON "journal_entries" ("occurred_at");
CREATE INDEX IF NOT EXISTS "idx_journal_entries_stage_occurred" ON "journal_entries" ("stage", "occurred_at");

CREATE TABLE IF NOT EXISTS "groups" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "created_by" text NOT NULL,
  "created_at" bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS "group_members" (
  "group_id" text NOT NULL,
  "participant_id" text NOT NULL,
  "joined_at" bigint NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_group_member" ON "group_members" ("group_id", "participant_id");

CREATE TABLE IF NOT EXISTS "group_channels" (
  "id" text PRIMARY KEY NOT NULL,
  "group_id" text NOT NULL,
  "name" text NOT NULL,
  "kind" text NOT NULL,
  "position" integer NOT NULL,
  "created_at" bigint NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_group_channels_name" ON "group_channels" ("group_id", "name");
CREATE INDEX IF NOT EXISTS "idx_group_channels_position" ON "group_channels" ("group_id", "position");

CREATE TABLE IF NOT EXISTS "messages" (
  "id" text PRIMARY KEY NOT NULL,
  "group_id" text NOT NULL,
  "channel_id" text,
  "participant_id" text NOT NULL,
  "body" text NOT NULL,
  "file_key" text,
  "created_at" bigint NOT NULL,
  "edited_at" bigint
);
CREATE INDEX IF NOT EXISTS "idx_messages_group_created" ON "messages" ("group_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_messages_channel_created" ON "messages" ("channel_id", "created_at");

CREATE TABLE IF NOT EXISTS "message_reactions" (
  "message_id" text NOT NULL,
  "participant_id" text NOT NULL,
  "emoji" text NOT NULL,
  "created_at" bigint NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_message_reactions_unique" ON "message_reactions" ("message_id", "participant_id", "emoji");

CREATE TABLE IF NOT EXISTS "designers" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "role" text NOT NULL,
  "discipline" text NOT NULL DEFAULT '',
  "division" text NOT NULL DEFAULT '',
  "bio" text NOT NULL DEFAULT '',
  "profile_link" text NOT NULL DEFAULT '',
  "contribution" integer NOT NULL DEFAULT 0,
  "sort_order" integer NOT NULL,
  "updated_at" bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_designers_rank" ON "designers" ("contribution", "sort_order");

CREATE TABLE IF NOT EXISTS "activity_events" (
  "id" text PRIMARY KEY NOT NULL,
  "participant_id" text NOT NULL,
  "kind" text NOT NULL,
  "surface" text NOT NULL,
  "duration_seconds" integer NOT NULL DEFAULT 0,
  "created_at" bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_activity_participant_created" ON "activity_events" ("participant_id", "created_at");

CREATE TABLE IF NOT EXISTS "contribution_entries" (
  "id" text PRIMARY KEY NOT NULL,
  "participant_id" text NOT NULL,
  "points" integer NOT NULL,
  "reason" text NOT NULL,
  "recorded_by" text NOT NULL,
  "created_at" bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS "content_overrides" (
  "locale" text NOT NULL,
  "content_key" text NOT NULL,
  "value" text NOT NULL,
  "updated_at" bigint NOT NULL,
  "updated_by" text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_content_override_locale_key" ON "content_overrides" ("locale", "content_key");

CREATE TABLE IF NOT EXISTS "uploaded_files" (
  "id" text PRIMARY KEY NOT NULL,
  "participant_id" text NOT NULL,
  "group_id" text,
  "task_id" text,
  "category" text NOT NULL DEFAULT 'draft',
  "object_key" text NOT NULL,
  "name" text NOT NULL,
  "content_type" text NOT NULL,
  "size" integer NOT NULL,
  "created_at" bigint NOT NULL,
  "week" integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "idx_uploaded_files_participant_created" ON "uploaded_files" ("participant_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_uploaded_files_group_created" ON "uploaded_files" ("group_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_uploaded_files_category_created" ON "uploaded_files" ("category", "created_at");
CREATE INDEX IF NOT EXISTS "idx_uploaded_files_week_category_created" ON "uploaded_files" ("week", "category", "created_at");

CREATE TABLE IF NOT EXISTS "questionnaire_responses" (
  "id" text PRIMARY KEY NOT NULL,
  "wechat_name" text NOT NULL,
  "locale" text NOT NULL DEFAULT 'zh',
  "payload" text NOT NULL,
  "submitted_at" bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_questionnaire_wechat_name" ON "questionnaire_responses" ("wechat_name");
CREATE INDEX IF NOT EXISTS "idx_questionnaire_submitted_at" ON "questionnaire_responses" ("submitted_at");

CREATE TABLE IF NOT EXISTS "site_traffic_daily" (
  "day" text PRIMARY KEY NOT NULL,
  "visits" integer NOT NULL DEFAULT 0,
  "updated_at" bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS "lead_login_attempts" (
  "id" text PRIMARY KEY NOT NULL,
  "client_key" text NOT NULL,
  "attempted_at" bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_lead_login_attempts_client_time" ON "lead_login_attempts" ("client_key", "attempted_at");
CREATE INDEX IF NOT EXISTS "idx_lead_login_attempts_time" ON "lead_login_attempts" ("attempted_at");

-- ============================================================================
-- Seed data (idempotent). Mirrors the original D1 seed; the designer list was
-- regenerated cleanly here because the upstream migration file was corrupted.
-- ============================================================================

INSERT INTO "designers" ("id", "name", "role", "discipline", "division", "bio", "profile_link", "contribution", "sort_order", "updated_at")
VALUES ('lead-huiechen', 'HuieChen', '总策划 / Project Lead', 'planning', '项目构想、艺术方向、规则框架、参与者协作', '《WHAT 100 PEOPLE DO TO A GAME》的发起人与总策划，负责建立项目概念、整体结构与协作原则，并持续协调一百位参与者共同改变作品的过程。', '', 100, 0, 1787184000000)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "designers" ("id", "name", "role", "contribution", "sort_order", "updated_at")
SELECT 'designer-' || lpad(g.n::text, 3, '0'), '设计师' || g.n::text, '设计师', 0, g.n, 1787184000000
FROM generate_series(1, 100) AS g(n)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "tasks" ("id", "title_zh", "title_en", "status", "sort_order", "week")
VALUES ('week0-top-five-games', 'Top 5 Games（等待主策划整理上传）', 'Top 5 Games (Awaiting Lead Designer upload)', 'owner_pending', 1, 0)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "tasks" ("id", "title_zh", "title_en", "status", "sort_order", "week")
VALUES ('week0-digital-proposal', 'Digital Proposal（可选）', 'Digital Proposal (Optional)', 'active', 2, 0)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "tasks" ("id", "title_zh", "title_en", "status", "sort_order", "week")
VALUES ('week0-participant-survey', '填写参与者信息问卷', 'Complete the participant survey', 'active', 3, 0)
ON CONFLICT ("id") DO NOTHING;
