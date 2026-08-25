CREATE TABLE `youtube_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`refreshTokenCiphertext` text NOT NULL,
	`connectedAt` timestamp NOT NULL DEFAULT (now()),
	`lastAuthorizedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `youtube_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `youtube_connections_owner_open_id_idx` UNIQUE(`ownerOpenId`)
);
