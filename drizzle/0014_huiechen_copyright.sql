UPDATE `content_overrides`
SET `value` = replace(`value`, 'Huie Chen', 'HuieChen')
WHERE `content_key` = 'copyright' AND `value` LIKE '%Huie Chen%';
--> statement-breakpoint
UPDATE `designers`
SET `name` = 'HuieChen', `updated_at` = 1787360400000
WHERE `id` = 'lead-huiechen';
