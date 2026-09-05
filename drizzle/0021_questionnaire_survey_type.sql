ALTER TABLE `questionnaire_responses` ADD COLUMN `survey_type` text NOT NULL DEFAULT 'participant-portrait';
--> statement-breakpoint
CREATE INDEX `idx_questionnaire_survey_type` ON `questionnaire_responses` (`survey_type`);
