ALTER TABLE `invitations` ADD `label` text;
ALTER TABLE `invitations` ADD `token_hint` text;
ALTER TABLE `invitations` ADD `created_at` integer NOT NULL DEFAULT 0;
ALTER TABLE `invitations` ADD `created_by` text;
CREATE UNIQUE INDEX `idx_submissions_participant_task_unique` ON `submissions` (`participant_id`,`task_id`);
CREATE UNIQUE INDEX `idx_survey_participant_unique` ON `survey_responses` (`participant_id`,`survey_id`);
CREATE TABLE `uploaded_files` (
  `id` text PRIMARY KEY NOT NULL,
  `participant_id` text NOT NULL,
  `group_id` text,
  `task_id` text,
  `object_key` text NOT NULL,
  `name` text NOT NULL,
  `content_type` text NOT NULL,
  `size` integer NOT NULL,
  `created_at` integer NOT NULL
);
CREATE INDEX `idx_uploaded_files_participant_created` ON `uploaded_files` (`participant_id`,`created_at`);
CREATE INDEX `idx_uploaded_files_group_created` ON `uploaded_files` (`group_id`,`created_at`);
INSERT OR IGNORE INTO `participants` (`id`,`display_code`,`locale`,`created_at`,`last_active_at`,`activity_count`) VALUES ('participant-042','P-042','zh',1786838400000,NULL,0);
-- Invitation seed intentionally omitted from the portable source export.
-- Create a fresh invitation through the authorized administration flow after deployment.
INSERT OR IGNORE INTO `tasks` (`id`,`title_zh`,`title_en`,`status`,`sort_order`) VALUES ('task-rule','为陌生人设计一条规则','Design a rule for a stranger','active',1);
PRAGMA optimize;
