CREATE TABLE `group_channels` (
  `id` text PRIMARY KEY NOT NULL,
  `group_id` text NOT NULL,
  `name` text NOT NULL,
  `kind` text NOT NULL,
  `position` integer NOT NULL,
  `created_at` integer NOT NULL
);
CREATE UNIQUE INDEX `idx_group_channels_name` ON `group_channels` (`group_id`,`name`);
CREATE INDEX `idx_group_channels_position` ON `group_channels` (`group_id`,`position`);
ALTER TABLE `messages` ADD `channel_id` text;
ALTER TABLE `messages` ADD `edited_at` integer;
CREATE TABLE `message_reactions` (
  `message_id` text NOT NULL,
  `participant_id` text NOT NULL,
  `emoji` text NOT NULL,
  `created_at` integer NOT NULL
);
CREATE UNIQUE INDEX `idx_message_reactions_unique` ON `message_reactions` (`message_id`,`participant_id`,`emoji`);
CREATE INDEX `idx_message_reactions_message` ON `message_reactions` (`message_id`,`created_at`);
INSERT OR IGNORE INTO `group_channels` (`id`,`group_id`,`name`,`kind`,`position`,`created_at`)
SELECT 'default-' || `id`, `id`, 'general', 'text', 0, `created_at` FROM `groups`;
UPDATE `messages` SET `channel_id` = 'default-' || `group_id` WHERE `channel_id` IS NULL;
PRAGMA optimize;
