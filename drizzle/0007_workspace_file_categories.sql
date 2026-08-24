ALTER TABLE `uploaded_files` ADD `category` text NOT NULL DEFAULT 'draft';
CREATE INDEX IF NOT EXISTS `idx_uploaded_files_category_created` ON `uploaded_files` (`category`, `created_at`);
PRAGMA optimize;
