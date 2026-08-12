CREATE TABLE `mobile_device_tokens` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `token` varchar(512) NOT NULL,
  `platform` enum('android') NOT NULL DEFAULT 'android',
  `enabled` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `mobile_device_tokens_id` PRIMARY KEY(`id`),
  CONSTRAINT `mobile_device_tokens_token_unique` UNIQUE(`token`)
);
