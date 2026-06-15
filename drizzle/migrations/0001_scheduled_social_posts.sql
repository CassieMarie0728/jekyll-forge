-- Create scheduled_social_posts table
CREATE TABLE `scheduled_social_posts` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `repurposedContentId` int NOT NULL,
  `socialMediaAccountId` int NOT NULL,
  `platform` enum('twitter','linkedin','facebook','instagram') NOT NULL,
  `content` text NOT NULL,
  `scheduledAt` timestamp NOT NULL,
  `timezone` varchar(64) DEFAULT 'UTC',
  `status` enum('pending','processing','published','failed','cancelled') DEFAULT 'pending',
  `externalPostId` varchar(256),
  `externalUrl` text,
  `errorMessage` text,
  `retryCount` int DEFAULT 0,
  `maxRetries` int DEFAULT 3,
  `lastRetryAt` timestamp,
  `publishedAt` timestamp,
  `scheduleCronTaskUid` varchar(65),
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX `idx_userId_status` ON `scheduled_social_posts` (`userId`, `status`);
CREATE INDEX `idx_scheduledAt_status` ON `scheduled_social_posts` (`scheduledAt`, `status`);
CREATE INDEX `idx_repurposedContentId` ON `scheduled_social_posts` (`repurposedContentId`);
CREATE INDEX `idx_socialMediaAccountId` ON `scheduled_social_posts` (`socialMediaAccountId`);
