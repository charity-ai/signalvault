CREATE TABLE `referenceChannels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`normalizedUrl` varchar(1024) NOT NULL,
	`youtubeChannelId` varchar(128) NOT NULL,
	`title` varchar(512) NOT NULL,
	`channelUrl` varchar(1024) NOT NULL,
	`handle` varchar(256),
	`description` text NOT NULL,
	`tagsJson` text NOT NULL,
	`subscriberCount` bigint,
	`totalViews` bigint,
	`isSaved` boolean NOT NULL DEFAULT false,
	`sourceClass` enum('public_metadata') NOT NULL DEFAULT 'public_metadata',
	`lastSyncedAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referenceChannels_id` PRIMARY KEY(`id`),
	CONSTRAINT `reference_channels_normalized_url_unique` UNIQUE(`normalizedUrl`)
);
--> statement-breakpoint
CREATE TABLE `referenceChunks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referenceChannelId` int NOT NULL,
	`referenceVideoId` int,
	`sourceType` enum('channel_metadata','video_metadata') NOT NULL,
	`chunkIndex` int NOT NULL,
	`chunkText` text NOT NULL,
	`normalizedText` text NOT NULL,
	`tokenEstimate` int NOT NULL DEFAULT 0,
	`contentHash` varchar(64) NOT NULL,
	`embeddingState` enum('not_configured','pending','ready','failed') NOT NULL DEFAULT 'not_configured',
	`vectorRecordId` varchar(128),
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referenceChunks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referenceVideos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referenceChannelId` int NOT NULL,
	`youtubeVideoId` varchar(128) NOT NULL,
	`title` varchar(768) NOT NULL,
	`description` text NOT NULL,
	`sourceUrl` varchar(1024) NOT NULL,
	`publishedAt` timestamp,
	`publishedLabel` varchar(128) NOT NULL,
	`durationSeconds` int NOT NULL DEFAULT 0,
	`viewCount` bigint,
	`format` enum('video','short','live') NOT NULL DEFAULT 'video',
	`metadataCapturedAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referenceVideos_id` PRIMARY KEY(`id`),
	CONSTRAINT `reference_videos_channel_video_unique` UNIQUE(`referenceChannelId`,`youtubeVideoId`)
);
--> statement-breakpoint
ALTER TABLE `referenceChunks` ADD CONSTRAINT `referenceChunks_referenceChannelId_referenceChannels_id_fk` FOREIGN KEY (`referenceChannelId`) REFERENCES `referenceChannels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referenceChunks` ADD CONSTRAINT `referenceChunks_referenceVideoId_referenceVideos_id_fk` FOREIGN KEY (`referenceVideoId`) REFERENCES `referenceVideos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referenceVideos` ADD CONSTRAINT `referenceVideos_referenceChannelId_referenceChannels_id_fk` FOREIGN KEY (`referenceChannelId`) REFERENCES `referenceChannels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `reference_channels_youtube_id_idx` ON `referenceChannels` (`youtubeChannelId`);--> statement-breakpoint
CREATE INDEX `reference_channels_expires_at_idx` ON `referenceChannels` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `reference_chunks_channel_expiry_idx` ON `referenceChunks` (`referenceChannelId`,`expiresAt`);--> statement-breakpoint
CREATE INDEX `reference_chunks_video_idx` ON `referenceChunks` (`referenceVideoId`);--> statement-breakpoint
CREATE INDEX `reference_chunks_hash_idx` ON `referenceChunks` (`contentHash`);--> statement-breakpoint
CREATE INDEX `reference_videos_channel_published_idx` ON `referenceVideos` (`referenceChannelId`,`publishedAt`);