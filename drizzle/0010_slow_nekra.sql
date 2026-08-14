CREATE TABLE `user_ai_providers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` enum('openrouter','gemini','groq','mistral') NOT NULL,
	`encryptedApiKey` text NOT NULL,
	`selectedModel` varchar(160) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_ai_providers_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_ai_providers_user_provider_unique` UNIQUE(`userId`,`provider`)
);
