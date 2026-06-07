CREATE TABLE `ai_prompt_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`category` varchar(64),
	`template` text NOT NULL,
	`variables` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_prompt_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enabled` boolean DEFAULT true,
	`provider` varchar(64) DEFAULT 'built-in',
	`model` varchar(128),
	`temperature` int DEFAULT 70,
	`maxTokens` int DEFAULT 2048,
	`systemPrompt` text,
	`brandVoicePrompt` text,
	`safetyPrompt` text,
	`streaming` boolean DEFAULT true,
	`defaultLanguage` varchar(16) DEFAULT 'en',
	`budgetLimitCents` int,
	`totalRequestCount` int DEFAULT 0,
	`totalInputTokens` bigint DEFAULT 0,
	`totalOutputTokens` bigint DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `ai_voice_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`tone` varchar(64),
	`formality` varchar(64),
	`humorLevel` varchar(32),
	`readingLevel` varchar(64),
	`forbiddenPhrases` json,
	`requiredPhrases` json,
	`brandRules` text,
	`exampleSamples` text,
	`systemPrompt` text,
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_voice_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`siteId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`path` varchar(512) NOT NULL,
	`storageKey` varchar(512),
	`storageUrl` text,
	`mimeType` varchar(128),
	`size` bigint,
	`width` int,
	`height` int,
	`alt` text,
	`sha` varchar(64),
	`hash` varchar(64),
	`optimized` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `front_matter_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`siteId` int,
	`name` varchar(128) NOT NULL,
	`template` json NOT NULL,
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `front_matter_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`siteId` int NOT NULL,
	`path` varchar(512) NOT NULL,
	`filename` varchar(256),
	`slug` varchar(256),
	`title` text,
	`status` enum('draft','published','modified','new','scheduled','archived') DEFAULT 'new',
	`frontMatter` json,
	`markdown` text,
	`sha` varchar(64),
	`scheduledAt` timestamp,
	`publishedAt` timestamp,
	`lastAutosaveAt` timestamp,
	`autosaveContent` text,
	`autosaveFrontMatter` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reusable_blocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`category` varchar(64),
	`content` text NOT NULL,
	`contentType` enum('markdown','html','liquid') DEFAULT 'markdown',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reusable_blocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduled_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`siteId` int NOT NULL,
	`postId` int,
	`draftPath` varchar(512) NOT NULL,
	`targetPath` varchar(512) NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`timezone` varchar(64) DEFAULT 'UTC',
	`status` enum('pending','processing','published','failed','cancelled') DEFAULT 'pending',
	`commitMessage` text,
	`errorMessage` text,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduled_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`owner` varchar(128) NOT NULL,
	`repo` varchar(256) NOT NULL,
	`defaultBranch` varchar(128) DEFAULT 'main',
	`selectedBranch` varchar(128) DEFAULT 'main',
	`rootPath` varchar(256) DEFAULT '/',
	`isJekyll` boolean DEFAULT false,
	`isFavorite` boolean DEFAULT false,
	`timezone` varchar(64) DEFAULT 'UTC',
	`defaultLayout` varchar(128) DEFAULT 'post',
	`defaultAssetPath` varchar(256) DEFAULT '/assets/images',
	`aiVoiceProfile` varchar(64) DEFAULT 'default',
	`settings` json,
	`lastAccessedAt` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`siteId` int NOT NULL,
	`postId` int,
	`postPath` varchar(512),
	`label` varchar(256) NOT NULL,
	`reason` enum('manual','autosave','before-ai','before-publish','before-theme','before-plugin') DEFAULT 'manual',
	`markdown` text,
	`frontMatter` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `githubToken` text;--> statement-breakpoint
ALTER TABLE `users` ADD `githubLogin` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `githubAvatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `githubId` varchar(64);