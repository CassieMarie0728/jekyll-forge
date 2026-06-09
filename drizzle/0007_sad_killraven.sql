CREATE TABLE `ab_test_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`postId` int NOT NULL,
	`variationIndex` int NOT NULL,
	`platform` enum('twitter','linkedin','facebook','instagram','email','direct') NOT NULL,
	`externalPostId` varchar(256),
	`impressions` int DEFAULT 0,
	`engagements` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`shares` int DEFAULT 0,
	`likes` int DEFAULT 0,
	`replies` int DEFAULT 0,
	`engagementRate` decimal(5,2) DEFAULT '0',
	`status` enum('active','completed','paused') NOT NULL DEFAULT 'active',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ab_test_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ab_test_summary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`postId` int NOT NULL,
	`winningVariationIndex` int,
	`totalVariations` int NOT NULL,
	`testDurationDays` int DEFAULT 7,
	`winningMetric` varchar(64),
	`status` enum('running','completed','archived') NOT NULL DEFAULT 'running',
	`insights` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ab_test_summary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_variations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`postId` int NOT NULL,
	`variationIndex` int NOT NULL,
	`headline` text NOT NULL,
	`content` text NOT NULL,
	`tone` varchar(64),
	`angle` varchar(256),
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_variations_id` PRIMARY KEY(`id`)
);
