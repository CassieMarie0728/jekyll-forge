CREATE TABLE `repurposed_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`siteId` int NOT NULL,
	`postId` int NOT NULL,
	`postTitle` varchar(512),
	`postSlug` varchar(256),
	`format` enum('twitter','linkedin','tiktok','youtube','newsletter','email','podcast','slides') NOT NULL,
	`content` text NOT NULL,
	`metadata` json,
	`isCustomized` boolean DEFAULT false,
	`status` enum('generated','approved','published','archived') DEFAULT 'generated',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `repurposed_content_id` PRIMARY KEY(`id`)
);
