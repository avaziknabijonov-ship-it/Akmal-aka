CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `leads` ADD `request_id` text;--> statement-breakpoint
ALTER TABLE `leads` ADD `telegram_status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `telegram_attempts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `telegram_error` text;--> statement-breakpoint
ALTER TABLE `leads` ADD `telegram_message_id` text;--> statement-breakpoint
ALTER TABLE `leads` ADD `telegram_updated_at` text;--> statement-breakpoint
CREATE UNIQUE INDEX `leads_request_id` ON `leads` (`request_id`);