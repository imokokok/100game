CREATE TABLE IF NOT EXISTS `site_traffic_daily` (
  `day` text PRIMARY KEY NOT NULL,
  `visits` integer NOT NULL DEFAULT 0,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
PRAGMA optimize;
