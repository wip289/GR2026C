CREATE TABLE `boothLayouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`boothType` varchar(50) NOT NULL,
	`quantity` int NOT NULL,
	`widthM` decimal(5,2),
	`heightM` decimal(5,2),
	`costPerM2` decimal(10,2),
	`sellingPrice` decimal(15,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boothLayouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coordinators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`userId` int NOT NULL,
	`coordinatorRole` enum('project_manager','finance','sponsorship','admin','logistics','marketing') NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`status` enum('active','inactive') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coordinators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int,
	`companyName` varchar(255) NOT NULL,
	`industry` varchar(100),
	`contactPerson` varchar(255),
	`email` varchar(320),
	`phone` varchar(20),
	`boothType` enum('main','standard','economy','special'),
	`boothSize` varchar(50),
	`boothPrice` decimal(15,2),
	`sponsorshipTier` enum('platinum','gold','silver','none') DEFAULT 'none',
	`sponsorshipPrice` decimal(15,2),
	`paymentStatus` enum('pending','partial','paid','cancelled') DEFAULT 'pending',
	`notes` text,
	`previousParticipation` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `eventExpenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` varchar(255),
	`amount` decimal(15,2) NOT NULL,
	`status` enum('planned','committed','paid') DEFAULT 'planned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `eventExpenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`university` varchar(255) NOT NULL,
	`contactEmail` varchar(320),
	`contactPhone` varchar(20),
	`eventDate` date,
	`expectedEmployers` int DEFAULT 0,
	`expectedAttendees` int DEFAULT 0,
	`budget` decimal(15,2),
	`venueId` int,
	`status` enum('planning','approved','in_progress','completed','cancelled') DEFAULT 'planning',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`coordinatorId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text,
	`type` enum('info','warning','success','error') DEFAULT 'info',
	`channel` enum('email','whatsapp','telegram','line') DEFAULT 'email',
	`status` enum('pending','sent','failed') DEFAULT 'pending',
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `venues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text,
	`city` varchar(100),
	`capacity` int,
	`totalArea` decimal(10,2),
	`costPerDay` decimal(15,2),
	`isFree` boolean DEFAULT false,
	`amenities` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `venues_id` PRIMARY KEY(`id`)
);
