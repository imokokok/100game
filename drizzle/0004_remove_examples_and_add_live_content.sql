ALTER TABLE `journal_entries` ADD `participant_id` text;
ALTER TABLE `journal_entries` ADD `content_type` text;
ALTER TABLE `journal_entries` ADD `file_name` text;
CREATE TABLE `survey_forms` (
  `id` text PRIMARY KEY NOT NULL,
  `title_zh` text NOT NULL,
  `title_en` text NOT NULL,
  `question_zh` text NOT NULL,
  `question_en` text NOT NULL,
  `status` text NOT NULL,
  `created_at` integer NOT NULL
);
CREATE TABLE `participant_sessions` (
  `token_hash` text PRIMARY KEY NOT NULL,
  `participant_id` text NOT NULL,
  `created_at` integer NOT NULL,
  `expires_at` integer NOT NULL
);
CREATE INDEX `idx_participant_sessions_participant` ON `participant_sessions` (`participant_id`,`expires_at`);
CREATE INDEX `idx_survey_forms_status_created` ON `survey_forms` (`status`,`created_at`);
CREATE INDEX `idx_game_links_published` ON `game_links` (`published_at`);
CREATE INDEX `idx_journal_entries_occurred` ON `journal_entries` (`occurred_at`);
DELETE FROM `tasks` WHERE `id` = 'task-rule';
DELETE FROM `invitations` WHERE `id` = 'invite-042';
DELETE FROM `participants` WHERE `id` = 'participant-042'
  AND NOT EXISTS (SELECT 1 FROM `submissions` WHERE `participant_id` = 'participant-042')
  AND NOT EXISTS (SELECT 1 FROM `survey_responses` WHERE `participant_id` = 'participant-042')
  AND NOT EXISTS (SELECT 1 FROM `uploaded_files` WHERE `participant_id` = 'participant-042')
  AND NOT EXISTS (SELECT 1 FROM `activity_events` WHERE `participant_id` = 'participant-042')
  AND NOT EXISTS (SELECT 1 FROM `contribution_entries` WHERE `participant_id` = 'participant-042');
DELETE FROM `participants` WHERE `id` LIKE 'anon-%'
  AND NOT EXISTS (SELECT 1 FROM `submissions` WHERE `participant_id` = `participants`.`id`)
  AND NOT EXISTS (SELECT 1 FROM `survey_responses` WHERE `participant_id` = `participants`.`id`)
  AND NOT EXISTS (SELECT 1 FROM `uploaded_files` WHERE `participant_id` = `participants`.`id`)
  AND NOT EXISTS (SELECT 1 FROM `contribution_entries` WHERE `participant_id` = `participants`.`id`);
PRAGMA optimize;
