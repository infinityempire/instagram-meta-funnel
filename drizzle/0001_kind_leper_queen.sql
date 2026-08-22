CREATE TABLE `insight_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publishedMediaId` int NOT NULL,
	`reach` int,
	`engagement` int,
	`impressions` int,
	`likes` int,
	`comments` int,
	`saves` int,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `insight_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `keyword_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keyword` varchar(160) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `keyword_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `keyword_rules_keyword_idx` UNIQUE(`keyword`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`webhookEventId` int,
	`instagramScopedUserId` varchar(128) NOT NULL,
	`triggerKeyword` varchar(160) NOT NULL,
	`deliveryStatus` enum('pending','delivered','failed') NOT NULL DEFAULT 'pending',
	`deliveryAttempts` int NOT NULL DEFAULT 0,
	`responseStatus` int,
	`safeErrorMessage` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`deliveredAt` timestamp,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `published_media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientRequestId` varchar(64) NOT NULL,
	`mediaContainerId` varchar(128),
	`metaMediaId` varchar(128),
	`mediaType` enum('REELS','IMAGE','STORIES','CAROUSEL') NOT NULL,
	`sourceUrl` text NOT NULL,
	`caption` text,
	`isAiGenerated` boolean NOT NULL DEFAULT false,
	`publishStatus` enum('draft','creating_container','processing','ready','published','failed') NOT NULL DEFAULT 'draft',
	`safeErrorMessage` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`publishedAt` timestamp,
	`lastInsightAt` timestamp,
	CONSTRAINT `published_media_id` PRIMARY KEY(`id`),
	CONSTRAINT `published_media_client_request_idx` UNIQUE(`clientRequestId`)
);
--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dedupeKey` varchar(128) NOT NULL,
	`objectType` varchar(64) NOT NULL,
	`eventType` varchar(96) NOT NULL,
	`status` enum('received','processed','ignored','failed') NOT NULL DEFAULT 'received',
	`signatureValid` boolean NOT NULL,
	`safeSummary` text,
	`errorMessage` varchar(512),
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `webhook_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `webhook_events_dedupe_key_idx` UNIQUE(`dedupeKey`)
);
--> statement-breakpoint
CREATE INDEX `insight_snapshots_media_recorded_idx` ON `insight_snapshots` (`publishedMediaId`,`recordedAt`);--> statement-breakpoint
CREATE INDEX `leads_delivery_status_idx` ON `leads` (`deliveryStatus`);--> statement-breakpoint
CREATE INDEX `leads_created_at_idx` ON `leads` (`createdAt`);--> statement-breakpoint
CREATE INDEX `published_media_meta_media_idx` ON `published_media` (`metaMediaId`);--> statement-breakpoint
CREATE INDEX `published_media_publish_status_idx` ON `published_media` (`publishStatus`);--> statement-breakpoint
CREATE INDEX `webhook_events_received_at_idx` ON `webhook_events` (`receivedAt`);