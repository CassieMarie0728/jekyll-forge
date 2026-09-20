CREATE TABLE `ab_test_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`postId` integer NOT NULL,
	`variationIndex` integer NOT NULL,
	`platform` text NOT NULL,
	`externalPostId` text,
	`impressions` integer DEFAULT 0,
	`engagements` integer DEFAULT 0,
	`clicks` integer DEFAULT 0,
	`shares` integer DEFAULT 0,
	`likes` integer DEFAULT 0,
	`replies` integer DEFAULT 0,
	`engagementRate` text DEFAULT '0',
	`status` text DEFAULT 'active' NOT NULL,
	`startedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`endedAt` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ab_test_summary` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`postId` integer NOT NULL,
	`winningVariationIndex` integer,
	`totalVariations` integer NOT NULL,
	`testDurationDays` integer DEFAULT 7,
	`winningMetric` text,
	`status` text DEFAULT 'running' NOT NULL,
	`insights` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ai_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`enabled` integer DEFAULT true,
	`provider` text DEFAULT 'built-in',
	`model` text,
	`temperature` integer DEFAULT 70,
	`maxTokens` integer DEFAULT 2048,
	`systemPrompt` text,
	`brandVoicePrompt` text,
	`safetyPrompt` text,
	`streaming` integer DEFAULT true,
	`defaultLanguage` text DEFAULT 'en',
	`budgetLimitCents` integer,
	`totalRequestCount` integer DEFAULT 0,
	`totalInputTokens` integer DEFAULT 0,
	`totalOutputTokens` integer DEFAULT 0,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ai_settings_userId_unique` ON `ai_settings` (`userId`);--> statement-breakpoint
CREATE TABLE `assets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`siteId` integer NOT NULL,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`storageKey` text,
	`storageUrl` text,
	`mimeType` text,
	`size` integer,
	`width` integer,
	`height` integer,
	`alt` text,
	`sha` text,
	`hash` text,
	`optimized` integer DEFAULT false,
	`variants` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `content_analytics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`repurposedContentId` integer NOT NULL,
	`platform` text NOT NULL,
	`externalPostId` text,
	`externalUrl` text,
	`impressions` integer DEFAULT 0,
	`engagements` integer DEFAULT 0,
	`clicks` integer DEFAULT 0,
	`shares` integer DEFAULT 0,
	`likes` integer DEFAULT 0,
	`replies` integer DEFAULT 0,
	`retweets` integer DEFAULT 0,
	`rawMetrics` text,
	`lastSyncedAt` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `content_variations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`postId` integer NOT NULL,
	`variationIndex` integer NOT NULL,
	`headline` text NOT NULL,
	`content` text NOT NULL,
	`tone` text,
	`angle` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `front_matter_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`siteId` integer,
	`name` text NOT NULL,
	`template` text NOT NULL,
	`isDefault` integer DEFAULT false,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mobile_auth_codes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`codeHash` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`usedAt` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mobile_auth_codes_codeHash_unique` ON `mobile_auth_codes` (`codeHash`);--> statement-breakpoint
CREATE TABLE `mobile_device_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`token` text NOT NULL,
	`platform` text DEFAULT 'android' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mobile_device_tokens_token_unique` ON `mobile_device_tokens` (`token`);--> statement-breakpoint
CREATE TABLE `operator_notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`siteId` integer NOT NULL,
	`path` text NOT NULL,
	`filename` text,
	`slug` text,
	`title` text,
	`status` text DEFAULT 'new',
	`frontMatter` text,
	`markdown` text,
	`sha` text,
	`scheduledAt` integer,
	`publishedAt` integer,
	`lastAutosaveAt` integer,
	`autosaveContent` text,
	`autosaveFrontMatter` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rate_windows` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expiresAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rate_windows_expiry` ON `rate_windows` (`expiresAt`);--> statement-breakpoint
CREATE TABLE `repurposed_content` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`siteId` integer NOT NULL,
	`postId` integer NOT NULL,
	`postTitle` text,
	`postSlug` text,
	`format` text NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`isCustomized` integer DEFAULT false,
	`status` text DEFAULT 'generated',
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reusable_blocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`name` text NOT NULL,
	`category` text,
	`content` text NOT NULL,
	`contentType` text DEFAULT 'markdown',
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `scheduled_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`siteId` integer NOT NULL,
	`postId` integer,
	`draftPath` text NOT NULL,
	`targetPath` text NOT NULL,
	`branch` text,
	`scheduledAt` integer NOT NULL,
	`timezone` text DEFAULT 'UTC',
	`status` text DEFAULT 'pending',
	`commitMessage` text,
	`errorMessage` text,
	`publishedAt` integer,
	`scheduleCronTaskUid` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `scheduled_social_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`repurposedContentId` integer NOT NULL,
	`socialMediaAccountId` integer NOT NULL,
	`platform` text NOT NULL,
	`content` text NOT NULL,
	`scheduledAt` integer NOT NULL,
	`timezone` text DEFAULT 'UTC',
	`status` text DEFAULT 'pending',
	`externalPostId` text,
	`externalUrl` text,
	`errorMessage` text,
	`retryCount` integer DEFAULT 0,
	`maxRetries` integer DEFAULT 3,
	`lastRetryAt` integer,
	`publishedAt` integer,
	`scheduleCronTaskUid` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`owner` text NOT NULL,
	`repo` text NOT NULL,
	`defaultBranch` text DEFAULT 'main',
	`selectedBranch` text DEFAULT 'main',
	`rootPath` text DEFAULT '/',
	`isJekyll` integer DEFAULT false,
	`isFavorite` integer DEFAULT false,
	`timezone` text DEFAULT 'UTC',
	`defaultLayout` text DEFAULT 'post',
	`defaultAssetPath` text DEFAULT '/assets/images',
	`aiVoiceProfile` text DEFAULT 'default',
	`settings` text,
	`lastAccessedAt` integer DEFAULT (unixepoch()),
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`siteId` integer NOT NULL,
	`postId` integer,
	`postPath` text,
	`label` text NOT NULL,
	`reason` text DEFAULT 'manual',
	`markdown` text,
	`frontMatter` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `social_media_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`platform` text NOT NULL,
	`accountId` text NOT NULL,
	`username` text,
	`displayName` text,
	`profileImageUrl` text,
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`expiresAt` integer,
	`isConnected` integer DEFAULT true,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_ai_providers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`provider` text NOT NULL,
	`encryptedApiKey` text NOT NULL,
	`selectedModel` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_ai_providers_user_provider_unique` ON `user_ai_providers` (`userId`,`provider`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`githubToken` text,
	`githubLogin` text,
	`githubAvatarUrl` text,
	`githubId` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`lastSignedIn` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);