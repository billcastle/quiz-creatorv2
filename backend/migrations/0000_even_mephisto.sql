CREATE TABLE `answers` (
	`id` text PRIMARY KEY NOT NULL,
	`response_id` text NOT NULL,
	`question_id` text NOT NULL,
	`value` text NOT NULL,
	`auto_grade` text,
	`manual_grade` text,
	FOREIGN KEY (`response_id`) REFERENCES `responses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `answers_response_id_idx` ON `answers` (`response_id`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`position` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `likes` (
	`user_id` text NOT NULL,
	`questionnaire_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `questionnaire_id`),
	FOREIGN KEY (`questionnaire_id`) REFERENCES `questionnaires`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `likes_questionnaire_id_idx` ON `likes` (`questionnaire_id`);--> statement-breakpoint
CREATE TABLE `questionnaire_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`questionnaire_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`type` text NOT NULL,
	`snapshot` text NOT NULL,
	`published_at` integer,
	`created_by` text NOT NULL,
	FOREIGN KEY (`questionnaire_id`) REFERENCES `questionnaires`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `questionnaire_versions_questionnaire_id_version_number_unique` ON `questionnaire_versions` (`questionnaire_id`,`version_number`);--> statement-breakpoint
CREATE INDEX `questionnaire_versions_questionnaire_id_idx` ON `questionnaire_versions` (`questionnaire_id`);--> statement-breakpoint
CREATE TABLE `questionnaires` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`visibility` text NOT NULL,
	`status` text NOT NULL,
	`private_link_token` text,
	`current_version_id` text,
	`draft_snapshot` text,
	`like_count` integer DEFAULT 0 NOT NULL,
	`category_id` text,
	`subcategory_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`current_version_id`) REFERENCES `questionnaire_versions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `questionnaires_owner_id_idx` ON `questionnaires` (`owner_id`);--> statement-breakpoint
CREATE INDEX `questionnaires_status_visibility_idx` ON `questionnaires` (`status`,`visibility`);--> statement-breakpoint
CREATE INDEX `questionnaires_like_count_idx` ON `questionnaires` (`like_count`);--> statement-breakpoint
CREATE INDEX `questionnaires_category_id_idx` ON `questionnaires` (`category_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `questionnaires_private_link_token_unique` ON `questionnaires` (`private_link_token`);--> statement-breakpoint
CREATE TABLE `responses` (
	`id` text PRIMARY KEY NOT NULL,
	`questionnaire_id` text NOT NULL,
	`version_id` text NOT NULL,
	`respondent_user_id` text,
	`submitted_at` integer,
	`grading_status` text NOT NULL,
	`score` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`questionnaire_id`) REFERENCES `questionnaires`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`version_id`) REFERENCES `questionnaire_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `responses_questionnaire_id_idx` ON `responses` (`questionnaire_id`);--> statement-breakpoint
CREATE INDEX `responses_version_id_idx` ON `responses` (`version_id`);--> statement-breakpoint
CREATE INDEX `responses_respondent_user_id_idx` ON `responses` (`respondent_user_id`);--> statement-breakpoint
CREATE TABLE `subcategories` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`position` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `subcategories_category_id_idx` ON `subcategories` (`category_id`);