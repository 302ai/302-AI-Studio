CREATE TABLE `threads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`thread_id` text NOT NULL,
	`title` text NOT NULL,
	`provider_id` text NOT NULL,
	`model_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`is_collected` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `threads_thread_id_unique` ON `threads` (`thread_id`);