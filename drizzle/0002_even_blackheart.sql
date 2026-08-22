CREATE TABLE `operation_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` varchar(64) NOT NULL,
	`operationType` varchar(96) NOT NULL,
	`operationStatus` enum('started','succeeded','failed') NOT NULL,
	`entityType` varchar(64),
	`entityId` varchar(128),
	`safeDetails` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `operation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `operation_logs_request_idx` ON `operation_logs` (`requestId`);--> statement-breakpoint
CREATE INDEX `operation_logs_created_at_idx` ON `operation_logs` (`createdAt`);