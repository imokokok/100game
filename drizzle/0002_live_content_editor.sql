CREATE TABLE `content_overrides` (
  `locale` text NOT NULL,
  `content_key` text NOT NULL,
  `value` text NOT NULL,
  `updated_at` integer NOT NULL,
  `updated_by` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_content_override_locale_key` ON `content_overrides` (`locale`,`content_key`);
