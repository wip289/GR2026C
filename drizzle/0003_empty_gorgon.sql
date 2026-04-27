ALTER TABLE `jobseekers` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `jobseekers` ADD `minatKerja` enum('dalam_negeri','luar_negeri','keduanya');--> statement-breakpoint
ALTER TABLE `jobseekers` ADD `statusKerja` enum('belum_bekerja','sedang_bekerja','pernah_bekerja');--> statement-breakpoint
ALTER TABLE `jobseekers` ADD `sumberInfo` varchar(100);--> statement-breakpoint
ALTER TABLE `jobseekers` ADD `igUsername` varchar(100);