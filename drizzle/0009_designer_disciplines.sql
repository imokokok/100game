ALTER TABLE `designers` ADD `discipline` text NOT NULL DEFAULT '';
UPDATE `designers` SET `discipline` = 'planning', `updated_at` = 1787191200000 WHERE `id` = 'lead-huiechen';
