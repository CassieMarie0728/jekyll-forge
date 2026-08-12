CREATE TABLE `mobile_auth_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`codeHash` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mobile_auth_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `mobile_auth_codes_codeHash_unique` UNIQUE(`codeHash`)
);
