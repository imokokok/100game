ALTER TABLE `participants` ADD `last_active_at` integer;
ALTER TABLE `participants` ADD `activity_count` integer NOT NULL DEFAULT 0;
CREATE TABLE `activity_events` (`id` text PRIMARY KEY NOT NULL, `participant_id` text NOT NULL, `kind` text NOT NULL, `surface` text NOT NULL, `duration_seconds` integer NOT NULL DEFAULT 0, `created_at` integer NOT NULL);
CREATE INDEX `idx_activity_participant_created` ON `activity_events` (`participant_id`,`created_at`);
CREATE INDEX `idx_activity_created` ON `activity_events` (`created_at`);
CREATE TABLE `contribution_entries` (`id` text PRIMARY KEY NOT NULL, `participant_id` text NOT NULL, `points` integer NOT NULL, `reason` text NOT NULL, `recorded_by` text NOT NULL, `created_at` integer NOT NULL);
CREATE INDEX `idx_contribution_participant_created` ON `contribution_entries` (`participant_id`,`created_at`);
PRAGMA optimize;
