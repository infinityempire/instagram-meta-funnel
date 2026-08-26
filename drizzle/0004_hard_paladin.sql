CREATE TABLE `youtube_metric_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`youtubeVideoRowId` int NOT NULL,
	`observedAt` timestamp NOT NULL DEFAULT (now()),
	`views` int NOT NULL DEFAULT 0,
	`likes` int NOT NULL DEFAULT 0,
	`estimatedMinutesWatched` int NOT NULL DEFAULT 0,
	`averageViewDurationSeconds` int NOT NULL DEFAULT 0,
	`averageViewPercentageBasisPoints` int NOT NULL DEFAULT 0,
	`subscribersGained` int NOT NULL DEFAULT 0,
	`estimatedRevenueMicros` bigint NOT NULL DEFAULT 0,
	CONSTRAINT `youtube_metric_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `youtube_monitoring_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`enabled` boolean NOT NULL DEFAULT false,
	`lastRunAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `youtube_monitoring_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `youtube_monitoring_configs_owner_idx` UNIQUE(`ownerOpenId`)
);
--> statement-breakpoint
CREATE TABLE `youtube_videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`youtubeVideoId` varchar(32) NOT NULL,
	`sourceFilename` varchar(255) NOT NULL,
	`title` varchar(100) NOT NULL,
	`storyWorld` varchar(80) NOT NULL,
	`visibility` enum('private','unlisted','public') NOT NULL DEFAULT 'private',
	`madeForKids` boolean NOT NULL DEFAULT true,
	`containsSyntheticMedia` boolean NOT NULL DEFAULT true,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`publicAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `youtube_videos_id` PRIMARY KEY(`id`),
	CONSTRAINT `youtube_videos_video_id_idx` UNIQUE(`youtubeVideoId`)
);
--> statement-breakpoint
CREATE INDEX `youtube_metric_snapshots_video_observed_idx` ON `youtube_metric_snapshots` (`youtubeVideoRowId`,`observedAt`);--> statement-breakpoint
CREATE INDEX `youtube_videos_owner_visibility_idx` ON `youtube_videos` (`ownerOpenId`,`visibility`);