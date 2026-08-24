ALTER TABLE `journal_entries` ADD `body_zh` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `journal_entries` ADD `body_en` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `journal_entries` ADD `stage` text NOT NULL DEFAULT 'week-0';
--> statement-breakpoint
ALTER TABLE `journal_entries` ADD `tags` text NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_journal_entries_stage_occurred`
ON `journal_entries` (`stage`, `occurred_at`);
--> statement-breakpoint
PRAGMA optimize;
