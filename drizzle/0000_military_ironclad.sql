CREATE TABLE `blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`blocked` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `block_once` ON `blocks` (`owner`,`blocked`);--> statement-breakpoint
CREATE TABLE `interests` (
	`id` text PRIMARY KEY NOT NULL,
	`job` text NOT NULL,
	`worker` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`job`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `interest_once` ON `interests` (`job`,`worker`);--> statement-breakpoint
CREATE INDEX `interests_worker` ON `interests` (`worker`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`location` text NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`price` integer NOT NULL,
	`negotiable` integer DEFAULT 0 NOT NULL,
	`expires` text NOT NULL,
	`status` text DEFAULT 'PUBLICADA' NOT NULL,
	`selected` text,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `jobs_owner` ON `jobs` (`owner`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`interest` text NOT NULL,
	`sender` text NOT NULL,
	`content` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`interest`) REFERENCES `interests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `messages_interest` ON `messages` (`interest`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`bio` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter` text NOT NULL,
	`target` text NOT NULL,
	`reason` text NOT NULL,
	`created` text NOT NULL
);
