ALTER TABLE `uploaded_files` ADD `week` integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS `idx_uploaded_files_week_category_created` ON `uploaded_files` (`week`, `category`, `created_at`);
PRAGMA optimize;
