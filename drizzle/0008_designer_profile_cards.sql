ALTER TABLE `designers` ADD `division` text NOT NULL DEFAULT '';
ALTER TABLE `designers` ADD `bio` text NOT NULL DEFAULT '';
ALTER TABLE `designers` ADD `profile_link` text NOT NULL DEFAULT '';
UPDATE `designers`
SET
  `role` = '总策划 / Project Lead',
  `division` = '项目构想、艺术方向、规则框架、参与者协作',
  `bio` = '《WHAT 100 PEOPLE DO TO A GAME》的发起人与总策划，负责建立项目概念、整体结构与协作原则，并持续协调一百位参与者共同改变作品的过程。',
  `updated_at` = 1787187600000
WHERE `id` = 'lead-huiechen';
