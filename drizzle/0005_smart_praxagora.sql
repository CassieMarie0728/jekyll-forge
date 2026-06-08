CREATE TABLE `content_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`repurposedContentId` int NOT NULL,
	`platform` enum('twitter','linkedin') NOT NULL,
	`externalPostId` varchar(256),
	`externalUrl` text,
	`impressions` int DEFAULT 0,
	`engagements` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`shares` int DEFAULT 0,
	`likes` int DEFAULT 0,
	`replies` int DEFAULT 0,
	`retweets` int DEFAULT 0,
	`rawMetrics` json,
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_media_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('twitter','linkedin') NOT NULL,
	`accountId` varchar(256) NOT NULL,
	`username` varchar(256),
	`displayName` varchar(256),
	`profileImageUrl` text,
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`expiresAt` timestamp,
	`isConnected` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_media_accounts_id` PRIMARY KEY(`id`)
);
