CREATE TABLE `questionnaire_responses` (
  `id` text PRIMARY KEY NOT NULL,
  `wechat_name` text NOT NULL,
  `locale` text NOT NULL DEFAULT 'zh',
  `payload` text NOT NULL,
  `submitted_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_questionnaire_wechat_name` ON `questionnaire_responses` (`wechat_name`);
--> statement-breakpoint
CREATE INDEX `idx_questionnaire_submitted_at` ON `questionnaire_responses` (`submitted_at`);
