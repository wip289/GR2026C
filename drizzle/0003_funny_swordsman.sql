ALTER TABLE `employerBookings` ADD `logoUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `employerBookings` ADD `buktiPaymentUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `employerBookings` ADD `kwitansiApproved` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `employerBookings` ADD `jobVacanciesUrl` json;