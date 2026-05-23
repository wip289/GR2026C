-- MySQL dump 10.13  Distrib 9.7.0, for Win64 (x86_64)
--
-- Host: shinkansen.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `__drizzle_migrations`
--

DROP TABLE IF EXISTS `__drizzle_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `__drizzle_migrations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hash` text NOT NULL,
  `created_at` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `__drizzle_migrations`
--

LOCK TABLES `__drizzle_migrations` WRITE;
/*!40000 ALTER TABLE `__drizzle_migrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `__drizzle_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `boothLayouts`
--

DROP TABLE IF EXISTS `boothLayouts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `boothLayouts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eventId` int NOT NULL,
  `boothType` varchar(50) NOT NULL,
  `quantity` int NOT NULL,
  `widthM` decimal(5,2) DEFAULT NULL,
  `heightM` decimal(5,2) DEFAULT NULL,
  `costPerM2` decimal(10,2) DEFAULT NULL,
  `sellingPrice` decimal(15,2) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `boothLayouts`
--

LOCK TABLES `boothLayouts` WRITE;
/*!40000 ALTER TABLE `boothLayouts` DISABLE KEYS */;
/*!40000 ALTER TABLE `boothLayouts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coordinators`
--

DROP TABLE IF EXISTS `coordinators`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coordinators` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eventId` int NOT NULL,
  `userId` int NOT NULL,
  `coordinatorRole` enum('project_manager','finance','sponsorship','admin','logistics','marketing') NOT NULL,
  `email` varchar(320) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coordinators`
--

LOCK TABLES `coordinators` WRITE;
/*!40000 ALTER TABLE `coordinators` DISABLE KEYS */;
/*!40000 ALTER TABLE `coordinators` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employerBookings`
--

DROP TABLE IF EXISTS `employerBookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employerBookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bookingId` varchar(50) NOT NULL,
  `eventId` int DEFAULT NULL,
  `companyName` varchar(255) NOT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `pic1Name` varchar(255) NOT NULL,
  `pic1Title` varchar(100) DEFAULT NULL,
  `pic1Email` varchar(320) NOT NULL,
  `pic1Whatsapp` varchar(20) NOT NULL,
  `pic2Name` varchar(255) DEFAULT NULL,
  `pic2Title` varchar(100) DEFAULT NULL,
  `pic2Email` varchar(320) DEFAULT NULL,
  `pic2Whatsapp` varchar(20) DEFAULT NULL,
  `booths` json NOT NULL,
  `totalAmount` decimal(15,2) NOT NULL,
  `positions` json DEFAULT NULL,
  `needsBoothDesign` tinyint(1) DEFAULT '0',
  `specialRequest` text,
  `status` enum('pending','confirmed','rejected') NOT NULL DEFAULT 'pending',
  `paymentDeadline` date DEFAULT NULL,
  `confirmedAt` timestamp NULL DEFAULT NULL,
  `confirmedBy` int DEFAULT NULL,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `logoUrl` varchar(500) DEFAULT NULL,
  `buktiPaymentUrl` varchar(500) DEFAULT NULL,
  `kwitansiApproved` tinyint(1) DEFAULT '0',
  `jobVacanciesUrl` json DEFAULT NULL,
  `rescheduleCount` int DEFAULT '0',
  `facilities` text,
  `exhibitorOrder` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employerBookings_bookingId_unique` (`bookingId`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employerBookings`
--

LOCK TABLES `employerBookings` WRITE;
/*!40000 ALTER TABLE `employerBookings` DISABLE KEYS */;
INSERT INTO `employerBookings` VALUES (18,'E-ALITS-LAI-26-0019',NULL,'Pt. indosamudera service management','Lainnya','Bandung','www.indosamudera.com','Alit Budi Sastrawan','Managing Director','alit.sastrawan@issbali.com','08123856404',NULL,NULL,NULL,NULL,'[{\"id\": \"M2\", \"type\": \"main\", \"label\": \"M2\", \"price\": 10000000}]',10000000.00,'[{\"count\": 1, \"position\": \"\", \"customPosition\": \"all position\"}]',1,NULL,'confirmed','2026-06-01',NULL,NULL,NULL,'2026-05-05 03:37:16','2026-05-16 11:57:24',NULL,NULL,0,'[{\"url\": \"https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/employer/E-ALITS-LAI-26-0019/vacancies/jobvacancy-1778595697311-01.pdf\", \"name\": \"jobvacancy-1778595697311-01.pdf\"}]',0,NULL,NULL),(50,'E-YOELB-HTL-26-0032',NULL,'PT. Archipelago Intern','Hotel & Resort','Jakarta Selatan',': https://www.archipelagohotels.com/','Yoel Suranta TN Bangun','Corporate Assistant Talent Acquisition Manager','yoel.s@archipelagohotels.com','082120506291',NULL,NULL,'corporaterecruitment@archipelagohotels.com',NULL,'[{\"id\": \"M8\", \"type\": \"main\", \"label\": \"M8\", \"price\": 10000000}]',10000000.00,'[{\"count\": 1, \"position\": \"\", \"customPosition\": \"\"}]',1,'[FASCIA] PT. ARCHIPELAGO INTERN | Koordinasi dengan Vendor, Harga TBA','pending','2026-06-01',NULL,NULL,NULL,'2026-05-19 09:19:11','2026-05-19 09:19:11',NULL,NULL,0,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `employerBookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employerProspects`
--

DROP TABLE IF EXISTS `employerProspects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employerProspects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eventId` int DEFAULT NULL,
  `companyName` varchar(255) NOT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `picName` varchar(255) DEFAULT NULL,
  `picPhone` varchar(50) DEFAULT NULL,
  `picEmail` varchar(255) DEFAULT NULL,
  `status` enum('potensial','dikontak','tertarik','konfirmasi','hadir') NOT NULL DEFAULT 'potensial',
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employerProspects`
--

LOCK TABLES `employerProspects` WRITE;
/*!40000 ALTER TABLE `employerProspects` DISABLE KEYS */;
/*!40000 ALTER TABLE `employerProspects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employers`
--

DROP TABLE IF EXISTS `employers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eventId` int DEFAULT NULL,
  `companyName` varchar(255) NOT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `contactPerson` varchar(255) DEFAULT NULL,
  `email` varchar(320) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `boothType` enum('main','standard','economy','special') DEFAULT NULL,
  `boothSize` varchar(50) DEFAULT NULL,
  `boothPrice` decimal(15,2) DEFAULT NULL,
  `sponsorshipTier` enum('platinum','gold','silver','none') DEFAULT 'none',
  `sponsorshipPrice` decimal(15,2) DEFAULT NULL,
  `paymentStatus` enum('pending','partial','paid','cancelled') DEFAULT 'pending',
  `notes` text,
  `previousParticipation` int DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employers`
--

LOCK TABLES `employers` WRITE;
/*!40000 ALTER TABLE `employers` DISABLE KEYS */;
/*!40000 ALTER TABLE `employers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventConfig`
--

DROP TABLE IF EXISTS `eventConfig`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventConfig` (
  `id` int NOT NULL AUTO_INCREMENT,
  `configKey` varchar(100) NOT NULL,
  `value` text NOT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `eventConfig_configKey_unique` (`configKey`)
) ENGINE=InnoDB AUTO_INCREMENT=5445 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventConfig`
--

LOCK TABLES `eventConfig` WRITE;
/*!40000 ALTER TABLE `eventConfig` DISABLE KEYS */;
INSERT INTO `eventConfig` VALUES (1,'eventName','Grand Recruitment 2026','2026-04-24 11:26:39'),(2,'eventSubtitle','The International Hospitality and Tourism Job Fair','2026-04-24 11:26:39'),(3,'eventDate1','2026-06-08','2026-05-11 15:37:36'),(4,'eventDate2','2026-06-09','2026-05-11 15:37:36'),(5,'eventYear','2026','2026-04-24 11:26:39'),(6,'locationName','Gedung Graha I Gde Ardika Poltekpar NHI Bandung DOME ','2026-04-26 02:18:10'),(7,'locationAddress','Politeknik Pariwisata NHI Bandung, Jl. Dr. Setiabudi No. 186, Bandung','2026-04-24 11:26:39'),(8,'openTime','08.00','2026-04-24 11:26:39'),(9,'closeTime','17.00','2026-04-24 11:26:39'),(10,'logoUrl','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/system/logo.png','2026-04-26 13:53:43'),(11,'venueName','Gedung Graha I Gde Ardika Poltekpar NHI Bandung (DOME) ','2026-04-26 02:18:32'),(12,'venueAddress','Jl. Dr. Setiabudi No. 186','2026-04-24 11:26:39'),(13,'venueCity','Bandung, Jawa Barat','2026-04-24 11:26:39'),(14,'venueCapacity','3000','2026-04-24 11:26:39'),(15,'venueArea','2500','2026-04-24 11:26:39'),(16,'venueFacilities','AC, Sound System, Lighting, WiFi, Parkir, Musholla, Toilet','2026-04-24 11:26:39'),(17,'mainBoothPrice','10000000','2026-04-24 11:26:39'),(18,'mainBoothSize','5x5','2026-04-24 11:26:39'),(19,'mainBoothCount','12','2026-04-24 11:26:39'),(20,'stdBoothPrice','7500000','2026-04-24 11:26:39'),(21,'stdBoothSize','3x3','2026-04-24 11:26:39'),(22,'stdBoothCount','38','2026-04-24 11:26:39'),(23,'interviewBoothCount','14','2026-04-26 01:46:57'),(24,'paymentDeadlineDays','6','2026-05-06 12:45:04'),(25,'bankName','Bank BTN','2026-04-24 11:26:39'),(26,'bankAccount',' 0095 01 30 00000 38','2026-04-26 04:59:44'),(27,'bankAccountName','Bank BTN Kopensi STP Bandung','2026-04-26 04:59:44'),(28,'whatsappNumber','62817200289','2026-05-06 12:25:55'),(29,'email','contact@grandrecruitment.id','2026-04-26 05:00:16'),(30,'registrationOpenDate','2026-03-01','2026-04-24 11:26:39'),(31,'registrationCloseDate','2026-05-31','2026-04-24 11:26:39'),(32,'employerRegOpenDate','2026-03-01','2026-04-24 11:26:39'),(33,'employerRegCloseDate','2026-06-03','2026-05-06 12:45:55'),(34,'jobseekerRegOpenDate','2026-03-01','2026-04-24 11:26:39'),(35,'jobseekerRegCloseDate','2026-06-11','2026-05-06 12:45:55'),(36,'allowWalkIn','true','2026-04-24 11:26:39'),(145,'panitia_structure','[{\"id\":\"finance\",\"name\":\"Finance\",\"color\":\"#14b8a6\",\"icon\":\"💰\",\"members\":[{\"name\":\"Susiono\",\"email\":\"\",\"phone\":\"+62 813-2013-6234\",\"role\":\"Bendahara\",\"id\":\"m-1778140173709\"}]},{\"id\":\"sponsorship\",\"name\":\"Sponsorship\",\"color\":\"#818cf8\",\"icon\":\"🤝\",\"members\":[{\"name\":\"Wip\",\"email\":\"\",\"phone\":\"0817200289\",\"role\":\"oke\",\"id\":\"m-1778140286577\"}]},{\"id\":\"admin\",\"name\":\"Admin & Sekretariat\",\"color\":\"#f97316\",\"icon\":\"📋\",\"members\":[]},{\"id\":\"logistics\",\"name\":\"Logistik\",\"color\":\"#10b981\",\"icon\":\"🚚\",\"members\":[{\"name\":\"anggi s\",\"email\":\"\",\"phone\":\"087806753033\",\"role\":\"venue dan perlengkapan\",\"id\":\"m-1777082042352\"}]},{\"id\":\"marketing\",\"name\":\"Marketing & Publikasi\",\"color\":\"#ec4899\",\"icon\":\"📣\",\"members\":[{\"name\":\"Fitra Sujawoto\",\"email\":\"\",\"phone\":\"+62 856-2172-006\",\"role\":\"SocMed expert\",\"id\":\"m-1778140127246\"}]},{\"id\":\"registration\",\"name\":\"Registration\",\"color\":\"#60a5fa\",\"icon\":\"✅\",\"members\":[{\"name\":\"Ronal Adrianto\",\"email\":\"\",\"phone\":\"+62 815-7344-7446\",\"role\":\"Registrasi dan booking\",\"id\":\"m-1778140233024\"}]},{\"id\":\"operation\",\"name\":\"Operasional\",\"color\":\"#f43f5e\",\"icon\":\"⚡\",\"members\":[]},{\"id\":\"div-1778140473492\",\"name\":\"Project Manager\",\"color\":\"#D4A017\",\"icon\":\"👑\",\"members\":[]}]','2026-05-07 07:54:34'),(183,'paymentDeadlineDate','2026-05-31','2026-04-26 01:46:34'),(946,'closedBooths','[\"S35\",\"S34\",\"S33\",\"S32\",\"S27\",\"S26\",\"S37\",\"S38\",\"S28\",\"S29\",\"M12\",\"M9\"]','2026-05-13 03:55:23'),(4764,'interviewSlotsPerDay','6','2026-05-11 23:32:42');
/*!40000 ALTER TABLE `eventConfig` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eventExpenses`
--

DROP TABLE IF EXISTS `eventExpenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventExpenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eventId` int NOT NULL,
  `category` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `status` enum('planned','committed','paid') DEFAULT 'planned',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventExpenses`
--

LOCK TABLES `eventExpenses` WRITE;
/*!40000 ALTER TABLE `eventExpenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `eventExpenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `clientName` varchar(255) NOT NULL,
  `university` varchar(255) NOT NULL,
  `contactEmail` varchar(320) DEFAULT NULL,
  `contactPhone` varchar(20) DEFAULT NULL,
  `eventDate` date DEFAULT NULL,
  `expectedEmployers` int DEFAULT '0',
  `expectedAttendees` int DEFAULT '0',
  `budget` decimal(15,2) DEFAULT NULL,
  `venueId` int DEFAULT NULL,
  `status` enum('planning','approved','in_progress','completed','cancelled') DEFAULT 'planning',
  `createdBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `interviewBookings`
--

DROP TABLE IF EXISTS `interviewBookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `interviewBookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eventId` int DEFAULT NULL,
  `employerBookingId` varchar(50) NOT NULL,
  `boothId` varchar(10) NOT NULL,
  `day` int NOT NULL,
  `slotIndex` int NOT NULL,
  `companyName` varchar(255) DEFAULT NULL,
  `status` enum('active','cancelled') NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `interviewBookings`
--

LOCK TABLES `interviewBookings` WRITE;
/*!40000 ALTER TABLE `interviewBookings` DISABLE KEYS */;
/*!40000 ALTER TABLE `interviewBookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobseekers`
--

DROP TABLE IF EXISTS `jobseekers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobseekers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `registrationId` varchar(50) NOT NULL,
  `eventId` int DEFAULT NULL,
  `namaLengkap` varchar(255) NOT NULL,
  `nik` varchar(20) DEFAULT '',
  `tempatLahir` varchar(100) DEFAULT NULL,
  `tanggalLahir` date DEFAULT NULL,
  `jenisKelamin` varchar(20) DEFAULT NULL,
  `whatsapp` varchar(20) DEFAULT '',
  `email` varchar(320) NOT NULL,
  `kota` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `institusi` varchar(255) DEFAULT NULL,
  `jurusan` varchar(255) DEFAULT NULL,
  `tahunLulus` varchar(50) DEFAULT NULL,
  `bidangMinat` varchar(100) DEFAULT NULL,
  `fotoUrl` varchar(500) DEFAULT NULL,
  `cvUrl` varchar(500) DEFAULT NULL,
  `ktmUrl` varchar(500) DEFAULT NULL,
  `sertifikatUrl` varchar(500) DEFAULT NULL,
  `consent1` tinyint(1) NOT NULL DEFAULT '0',
  `consent2` tinyint(1) DEFAULT '0',
  `consent1At` timestamp NULL DEFAULT NULL,
  `consent2At` timestamp NULL DEFAULT NULL,
  `verified` tinyint(1) DEFAULT '0',
  `verifiedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `phone` varchar(20) DEFAULT NULL,
  `minatKerja` varchar(50) DEFAULT NULL,
  `statusKerja` varchar(50) DEFAULT NULL,
  `sumberInfo` varchar(100) DEFAULT NULL,
  `igUsername` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `jobseekers_registrationId_unique` (`registrationId`)
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobseekers`
--

LOCK TABLES `jobseekers` WRITE;
/*!40000 ALTER TABLE `jobseekers` DISABLE KEYS */;
INSERT INTO `jobseekers` VALUES (32,'JS-HILMAN-UNI-11-26-001',NULL,'HILMAN ADIMIHARJA','',NULL,NULL,NULL,'081931433399','menarasatu23@gmail.com','BANDUNG','sedang_bekerja',NULL,'S1 TEKNIK KOMPUTER','sebelum_2011',NULL,NULL,NULL,NULL,NULL,1,0,'2026-05-05 09:45:23',NULL,0,NULL,'2026-05-05 09:45:23','2026-05-05 09:45:23','081931433399','luar_negeri','sedang_bekerja','instagram',NULL),(33,'JS-NABEEL-STP-21-26-021',NULL,'Nabeel Sanie  Nawfal Putra','',NULL,NULL,NULL,'0878945622','crossnsp@gmail.com','bandung','belum_bekerja','stpb','s1 pariwisata','2021',NULL,'https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-NABEEL-STP-21-26-021/foto.jpeg',NULL,NULL,NULL,1,0,'2026-05-06 06:56:02',NULL,0,NULL,'2026-05-06 06:56:01','2026-05-06 06:56:16','0878945622','dalam_negeri','belum_bekerja','kampus',NULL),(35,'JS-RUSNAD-ENH-11-26-022',NULL,'Rusnadi','',NULL,NULL,NULL,'08235587121','kopensi186@gmail.com','Bandung','sedang_bekerja','enhaii','d4 hotel ','sebelum_2011',NULL,'https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-RUSNAD-ENH-11-26-022/foto.jpg','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-RUSNAD-ENH-11-26-022/cv.pdf',NULL,NULL,1,0,'2026-05-09 01:02:48',NULL,0,NULL,'2026-05-09 01:02:47','2026-05-09 01:03:37','08235587121','keduanya','sedang_bekerja','instagram',NULL),(36,'JS-ISMAIL-NHI-11-26-001',NULL,'Ismail Fajar Septiana','',NULL,NULL,NULL,'082320380871','ismail.fajarseptiana@gmail.com','Garut','sedang_bekerja','Poltekpar NHI Bandung','D4 Manajemen Bisnis Perjalanan','sebelum_2011',NULL,'https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-ISMAIL-NHI-11-26-001/foto.jpg',NULL,NULL,NULL,1,0,'2026-05-11 02:20:23',NULL,0,NULL,'2026-05-11 02:20:23','2026-05-11 02:21:10','082320380871','keduanya','sedang_bekerja','kampus',NULL),(37,'JS-TASYA-NHI-26-26-001',NULL,'Tasya Jilan Fakhar','',NULL,NULL,NULL,'087850223388','tasyajil5@gmail.com','Cibubur','belum_bekerja','Poltekpar NHI Bandung','D4 Pengelolaan Konvensi dan Acara','2026',NULL,NULL,NULL,NULL,NULL,1,0,'2026-05-11 06:05:56',NULL,0,NULL,'2026-05-11 06:05:55','2026-05-11 06:05:55','087850223388','dalam_negeri','belum_bekerja','instagram','cestjilan'),(38,'JS-RAYI-NHI-25-26-001',NULL,'Rayi Andita Muhammad Shafwan','',NULL,NULL,NULL,'082299656069','rayiandita02@gmail.com','Purwakarta, Jawa Barat','belum_bekerja','Politeknik Pariwisata NHI Bandung','D4 Pengelolaan Konvensi & Acara','2025',NULL,'https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-RAYI-NHI-25-26-001/foto.jpeg','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-RAYI-NHI-25-26-001/cv.pdf','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-RAYI-NHI-25-26-001/ktm.pdf',NULL,1,0,'2026-05-13 06:41:36',NULL,0,NULL,'2026-05-13 06:41:36','2026-05-13 06:54:45','082299656069','keduanya','belum_bekerja','kampus',NULL),(40,'JS-330709-NHI-21-26-001',NULL,'3307091801030005','',NULL,NULL,NULL,'081335552894','farhanajib25@gmail.com','Kota Bandung, Jawa Barat','sedang_bekerja','Politeknik Pariwisata NHI Bandung','D4 Pengelolaan Konvensi dan Acara','2021',NULL,NULL,NULL,NULL,NULL,1,0,'2026-05-13 07:53:31',NULL,0,NULL,'2026-05-13 07:53:30','2026-05-13 07:53:30','081335552894','keduanya','sedang_bekerja','kampus',NULL),(41,'JS-SYAFIR-NHI-25-26-001',NULL,'Syafira Maulida Ramadhani','',NULL,NULL,NULL,'081286109307','syafiramaulida12@gmail.com','Kota Bandung, Jawa Barat','sedang_bekerja','Politeknik Pariwisata NHI Bandung','D4 Pengelolaan Konvensi dan Acara','2025',NULL,NULL,NULL,NULL,NULL,1,0,'2026-05-13 07:53:31',NULL,0,NULL,'2026-05-13 07:53:31','2026-05-13 07:53:31','081286109307','keduanya','sedang_bekerja','kampus',NULL),(42,'JS-130602-NHI-25-26-001',NULL,'1306022607010003','',NULL,NULL,NULL,'082210155541','hammadridwan2001@gmail.com','KAB. PURWAKARTA','belum_bekerja','Politeknik Pariwisata NHI Bandung','D4 Pengelolaan Konvensi & Acara','2025',NULL,NULL,NULL,NULL,NULL,1,0,'2026-05-13 12:50:07',NULL,0,NULL,'2026-05-13 12:50:07','2026-05-13 12:50:07','082210155541','dalam_negeri','belum_bekerja','kampus',NULL),(43,'JS-GHAISA-NHI-26-26-001',NULL,'Ghaisani Nazira Putri Wardhana','',NULL,NULL,NULL,'081808507204','ghaisanipwr@gmail.com','Bandung, Jawa Barat','belum_bekerja','Poltekpar NHI','D4 Event Management','2026',NULL,NULL,NULL,NULL,NULL,1,0,'2026-05-13 14:29:05',NULL,0,NULL,'2026-05-13 14:29:04','2026-05-13 14:29:04','081808507204','dalam_negeri','belum_bekerja','kampus',NULL),(44,'JS-NABILA-POL-24-26-001',NULL,'Nabila Putri Auliyah ','',NULL,NULL,NULL,'082199177496','nabilaa.putrialyh@gmail.com','Makassar ','pernah_bekerja','Politeknik Pariwisata Makassar ','D4 Pengelolaan Konvensi dan Acara ','2024',NULL,NULL,NULL,NULL,NULL,1,0,'2026-05-15 09:12:19',NULL,0,NULL,'2026-05-15 09:12:19','2026-05-15 09:12:19','082199177496','keduanya','pernah_bekerja','kampus',NULL),(45,'JS-MUHAMM-NHI-25-26-001',NULL,'Muhammad Ridwan','',NULL,NULL,NULL,'082210155541','hammadridwan2001@gmail.com','KAB. PURWAKARTA','belum_bekerja','POLITEKNIK PARIWISATA NHI BANDUNG','D4 PENGELOLAAN KONVENSI & ACARA','2025','Event dan Tour & Travel','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-MUHAMM-NHI-25-26-001/foto.png','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-MUHAMM-NHI-25-26-001/cv.pdf','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-MUHAMM-NHI-25-26-001/ktm.pdf','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-MUHAMM-NHI-25-26-001/sertifikat.pdf',1,0,'2026-05-18 23:41:43',NULL,0,NULL,'2026-05-18 23:41:43','2026-05-19 00:01:35','082210155541','dalam_negeri','belum_bekerja','kampus',NULL),(46,'JS-330709-NHI-21-26-002',NULL,'3307091801030005','',NULL,NULL,NULL,'081335552894','tugasahan5@gmail.com','Kota Bandung, Jawa Barat','sedang_bekerja','Poltekpar NHI Bandung','D4 Event Management','2021','Event Organizer','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-330709-NHI-21-26-002/foto.png',NULL,NULL,NULL,1,0,'2026-05-19 07:24:29',NULL,0,NULL,'2026-05-19 07:24:28','2026-05-19 07:27:34','081335552894','keduanya','sedang_bekerja','kampus',NULL),(48,'JS-SYAFIR-NHI-25-26-002',NULL,'Syafira Maulida Ramadhani','',NULL,NULL,NULL,'081286109307','syafira.aldena@gmail.com','Bandung, Jawa Barat','sedang_bekerja','Politeknik Pariwisata NHI Bandung','D4 Event Management','2025',NULL,NULL,NULL,NULL,NULL,1,0,'2026-05-19 07:28:10',NULL,0,NULL,'2026-05-19 07:28:10','2026-05-19 08:06:02','081286109307','keduanya','sedang_bekerja','kampus',NULL),(49,'JS-FARHAN-NHI-25-26-001',NULL,'Farhan Najib Hibatullah','',NULL,NULL,NULL,'081335552894','farhanhibatullah81@sma.belajar.id','Bandung, Jawa Barat','sedang_bekerja','Politeknik Pariwisata NHI Bandung','D4 Event Management','2025',NULL,'https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-FARHAN-NHI-25-26-001/foto.jpeg',NULL,NULL,NULL,1,0,'2026-05-19 08:08:46',NULL,0,NULL,'2026-05-19 08:08:45','2026-05-19 08:09:11','081335552894','keduanya','sedang_bekerja','kampus',NULL),(50,'JS-ACHMAD-NHI-26-26-001',NULL,'Achmad Quraysh Syach Anwar','',NULL,NULL,NULL,'082144344545','achmadquraysh@gmail.com','Bandung, Jawa Barat','sedang_bekerja','Poltekpar NHI Bandung','D4 Pengelolaan Usaha Rekreasi','2026',NULL,NULL,NULL,NULL,NULL,1,0,'2026-05-20 23:09:46',NULL,0,NULL,'2026-05-20 23:09:45','2026-05-20 23:09:45','082144344545','keduanya','sedang_bekerja','kampus',NULL),(51,'JS-IVON-NHI-26-26-001',NULL,'Ivon Generasi Pratama Zega','',NULL,NULL,NULL,'081289382264','ivongpratamazega@gmail.com',NULL,'belum_bekerja','Politeknik Pariwisata NHI Bandung ','D4 Pengelolaan Perhotelan ','2026',NULL,'https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-IVON-NHI-26-26-001/foto.jpeg',NULL,NULL,NULL,1,0,'2026-05-20 23:59:26',NULL,0,NULL,'2026-05-20 23:59:26','2026-05-21 00:00:33','081289382264','luar_negeri','belum_bekerja','instagram',NULL),(52,'JS-MOCHAM-NHI-16-26-001',NULL,'Mochammad Reza','',NULL,NULL,NULL,'082217252188','mocreza32@gmail.com','Bandung, Jawa Barat','pernah_bekerja','Politeknik Pariwisata Bandung (STP NHI)','S1 Studi Industri Perjalanan ','2016',NULL,'https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-MOCHAM-NHI-16-26-001/foto.jpg','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-MOCHAM-NHI-16-26-001/cv.pdf','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-MOCHAM-NHI-16-26-001/ktm.pdf',NULL,1,0,'2026-05-21 02:41:37',NULL,0,NULL,'2026-05-21 02:41:36','2026-05-21 02:46:38','082217252188','keduanya','pernah_bekerja','instagram','moreza32'),(53,'JS-TENGKU-NHI-25-26-001',NULL,'Tengku Arvin','',NULL,NULL,NULL,'085343607119','tengkuarvin103@gmail.com','Bandung, Jawa Barat','sedang_bekerja','Politeknik Pariwisata NHI Bandung','D4 Destinasi Pariwisata','2025',NULL,'https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-TENGKU-NHI-25-26-001/foto.jpg',NULL,NULL,NULL,1,0,'2026-05-21 03:01:17',NULL,0,NULL,'2026-05-21 03:01:17','2026-05-21 03:02:43','085343607119','keduanya','sedang_bekerja','instagram','tengkuumaulana'),(54,'JS-TENGKU-NHI-25-26-002',NULL,'Tengku Arvin','',NULL,NULL,NULL,'085343607119','tengkuarvin103@gmail.com','Bandung, Jawa Barat','sedang_bekerja','Politeknik Pariwisata NHI Bandung','D4 Destinasi Pariwisata','2025',NULL,NULL,NULL,NULL,NULL,1,0,'2026-05-21 03:04:58',NULL,0,NULL,'2026-05-21 03:04:58','2026-05-21 03:04:58','085343607119','keduanya','sedang_bekerja','instagram','tengkuumaulana'),(55,'JS-SHOFIA-NHI-25-26-001',NULL,'Shofia Nadiya Putri Turganda','',NULL,NULL,NULL,'081586587998','shofiaturganda@gmail.com','Jakarta Selatan, DKI Jakarta','belum_bekerja','Politeknik Pariwisata NHI Bandung','D4 Pengelolaan Usaha Rekreasi','2025',NULL,NULL,NULL,NULL,NULL,1,0,'2026-05-21 03:41:19',NULL,0,NULL,'2026-05-21 03:41:18','2026-05-21 03:41:18','081586587998','keduanya','belum_bekerja','instagram',NULL),(56,'JS-SHOFIA-NHI-25-26-002',NULL,'Shofia Nadiya Putri Turganda','',NULL,NULL,NULL,'081586587998','shofianadiyaa@gmail.com','Jakarta Selatan, DKI Jakarta','belum_bekerja','Politeknik Pariwisata NHI Bandung','D4 Pengelolaan Usaha Rekreasi','2025','Travel, Event (EO/WO), Hotel, Restaurant','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-SHOFIA-NHI-25-26-002/foto.jpg',NULL,NULL,'https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-SHOFIA-NHI-25-26-002/sertifikat.pdf',1,0,'2026-05-21 03:47:08',NULL,0,NULL,'2026-05-21 03:47:08','2026-05-21 03:52:25','081586587998','keduanya','belum_bekerja','instagram',NULL),(57,'JS-CHESTA-NHI-25-26-001',NULL,'Chesta Adabi','',NULL,NULL,NULL,'0895391641002','chestaa1214@gmail.com','bandung jawa barat','pernah_bekerja','POLTEKPAR NHI BANDUNG','D3 MANAJEMEN TATA BOGA','2025','F&B hotel dan lain lain','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-CHESTA-NHI-25-26-001/foto.jpeg','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-CHESTA-NHI-25-26-001/cv.pdf','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-CHESTA-NHI-25-26-001/ktm.jpg',NULL,1,0,'2026-05-21 03:57:36',NULL,0,NULL,'2026-05-21 03:57:36','2026-05-21 04:02:51','0895391641002','keduanya','pernah_bekerja','kampus',NULL),(58,'JS-AKMAL-UNI-26-26-001',NULL,'Akmal Muhammad Fauzi','',NULL,NULL,NULL,'085285829473','akmalmuhammadfauzi2@gmail.com','Ciamis','belum_bekerja','Universsitas Pendidikan Indonesia','S1 Pendidikan Tata Boga','2026',NULL,NULL,NULL,NULL,NULL,1,0,'2026-05-21 04:00:17',NULL,0,NULL,'2026-05-21 04:00:17','2026-05-21 04:00:17','085285829473','keduanya','belum_bekerja','instagram','akmalmf_'),(59,'JS-AKMAL-UNI-26-26-002',NULL,'Akmal Muhammad Fauzi','',NULL,NULL,NULL,'085285829473','aangakmal@gmail.com','Ciamis','belum_bekerja','Universitas Pendidikan Indonesia','S1 Pendidikan Tata Boga','2026',NULL,NULL,NULL,NULL,NULL,1,0,'2026-05-21 04:04:22',NULL,0,NULL,'2026-05-21 04:04:21','2026-05-21 04:04:21','085285829473','keduanya','belum_bekerja','instagram','akmalmf_'),(60,'JS-RR-STP-17-26-001',NULL,'RR BINOCI SEKAR ASMARA PRINITA ','',NULL,NULL,NULL,'081382495058','Binocisekar@gmail.com','Jakarta,DKI Jakarta ','belum_bekerja','STP BANDUNG ','D3 MANAJEMEN TATA BOGA ','2017','KITCHEN ','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-RR-STP-17-26-001/foto.jpg','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-RR-STP-17-26-001/cv.pdf','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-RR-STP-17-26-001/ktm.jpg',NULL,1,0,'2026-05-21 08:26:43',NULL,0,NULL,'2026-05-21 08:26:42','2026-05-21 09:51:29','081382495058','keduanya','belum_bekerja','instagram',NULL),(61,'JS-CAROLI-STP-17-26-001',NULL,'Carolin Cecillia','',NULL,NULL,NULL,'+6289523560545','carolincecillia@gmail.com','Bandung','pernah_bekerja','STPB','D4 Administrasi Hotel','2017','','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-CAROLI-STP-17-26-001/foto.jpeg','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-CAROLI-STP-17-26-001/cv.pdf','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-CAROLI-STP-17-26-001/ktm.jpg','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-CAROLI-STP-17-26-001/sertifikat.pdf',1,0,'2026-05-21 08:43:36',NULL,0,NULL,'2026-05-21 08:43:35','2026-05-21 09:00:43','+6289523560545','luar_negeri','pernah_bekerja','teman',NULL),(62,'JS-RR-STP-17-26-002',NULL,'RR BINOCI SEKAR ASMARA PRINITA ','',NULL,NULL,NULL,'081382495058','sekarbinoci@outlook.com','JAKARTA ','belum_bekerja','STP BANDUNG','D3 MANAJEMEN TATA BOGA','2017','KITCHEN ','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-RR-STP-17-26-002/foto.jpg','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-RR-STP-17-26-002/cv.pdf','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-RR-STP-17-26-002/ktm.jpg','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-RR-STP-17-26-002/sertifikat.pdf',1,0,'2026-05-21 08:51:04',NULL,0,NULL,'2026-05-21 08:51:03','2026-05-21 09:38:13','081382495058','keduanya','belum_bekerja','instagram',NULL),(63,'JS-CAROLI-STP-17-26-002',NULL,'Carolin Cecillia','',NULL,NULL,NULL,'+6289523560545','cecilliacarolin@hotmail.com','Bandung','pernah_bekerja','STPB','D4 Administrasi Hotel','2017',NULL,NULL,NULL,NULL,NULL,1,0,'2026-05-21 08:51:22',NULL,0,NULL,'2026-05-21 08:51:22','2026-05-21 08:51:22','+6289523560545','luar_negeri','pernah_bekerja','teman',NULL),(64,'JS-SABILA-UNI-26-26-001',NULL,'Sabila Nurfajriah','',NULL,NULL,NULL,'082127073567','sabilanurfajr04@gmail.com','Bandung, Jawa barat','belum_bekerja','Universitas Ekuitas Indonesia','S1 Manajemen','2026','Hotel, Travel, dll','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-SABILA-UNI-26-26-001/foto.jpeg','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-SABILA-UNI-26-26-001/cv.pdf','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-SABILA-UNI-26-26-001/ktm.jpg','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-SABILA-UNI-26-26-001/sertifikat.pdf',1,0,'2026-05-21 08:52:34',NULL,0,NULL,'2026-05-21 08:52:34','2026-05-21 09:10:01','082127073567','dalam_negeri','belum_bekerja','teman',NULL),(65,'JS-SABILA-UNI-26-26-002',NULL,'Sabila Nurfajriah','',NULL,NULL,NULL,'082127073567','sabilanurfajr2004@gmail.com','Bandung, Jawa Barat','belum_bekerja','Universitas Ekuitas Indonesia','S1 Manajemen','2026','Hotel','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-SABILA-UNI-26-26-002/foto.jpeg',NULL,NULL,NULL,1,0,'2026-05-21 09:01:16',NULL,0,NULL,'2026-05-21 09:01:15','2026-05-21 09:03:32','082127073567','dalam_negeri','belum_bekerja','teman',NULL),(66,'JS-SABILA-UNI-26-26-003',NULL,'Sabila Nurfajriah','',NULL,NULL,NULL,'082127073567','Alfatihmuntaz8@gmail.com','Bandung, Jawa Barat','belum_bekerja','Universitas Ekuitas Indonesia','S1 Manajemen','2026',NULL,'https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-SABILA-UNI-26-26-003/foto.jpeg',NULL,NULL,NULL,1,0,'2026-05-21 09:07:05',NULL,0,NULL,'2026-05-21 09:07:05','2026-05-21 09:07:20','082127073567','dalam_negeri','belum_bekerja','teman',NULL),(67,'JS-DIANDR-NHI-21-26-001',NULL,'Diandra Ratnasari','',NULL,NULL,NULL,'085624675279','diandrarr11@gmail.com','Bandung, JawaBarat','sedang_bekerja','STP NHI BANDUNG','D3 MANAGEMENT DIVISI KAMAR','2021','','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-DIANDR-NHI-21-26-001/foto.jpeg','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-DIANDR-NHI-21-26-001/cv.pdf','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-DIANDR-NHI-21-26-001/ktm.jpeg','https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-DIANDR-NHI-21-26-001/sertifikat.pdf',1,0,'2026-05-21 09:23:51',NULL,0,NULL,'2026-05-21 09:23:51','2026-05-21 09:49:04','085624675279','keduanya','sedang_bekerja','kampus',NULL),(68,'JS-WILLY-ARI-11-26-001',NULL,'Willy Pratama','',NULL,NULL,NULL,'085136683102','willy.tama91@gmail.com','Bandung, Jawa Barat','pernah_bekerja','Ariyanti','D1, Perhotelan','sebelum_2011',NULL,'https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-WILLY-ARI-11-26-001/foto.jpg',NULL,NULL,NULL,1,0,'2026-05-21 09:30:20',NULL,0,NULL,'2026-05-21 09:30:19','2026-05-21 09:30:40','085136683102','dalam_negeri','pernah_bekerja','instagram','Willy.pratama25'),(69,'JS-WILLY-ARI-11-26-002',NULL,'Willy Pratama','',NULL,NULL,NULL,'','willy.pratama25@gmail.com','KAB. BANDUNG','pernah_bekerja','Ariyanti','D1, Perhotelan','sebelum_2011',NULL,'https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-WILLY-ARI-11-26-002/foto.jpg',NULL,NULL,NULL,1,0,'2026-05-21 09:35:00',NULL,0,NULL,'2026-05-21 09:35:00','2026-05-21 09:35:11',NULL,'dalam_negeri','pernah_bekerja','instagram',NULL),(70,'JS-YAPVIV-SEK-22-26-001',NULL,'Yapvivi Natalia','',NULL,NULL,NULL,'082227789989','yapvivinatalia@gmail.com','Bekasi, Jawa Barat','sedang_bekerja','Sekolah Tinggi Pariwisata Bandung','D3 Manajemen Tata Boga','2022',NULL,'https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-YAPVIV-SEK-22-26-001/foto.jpg',NULL,NULL,NULL,1,0,'2026-05-21 10:12:31',NULL,0,NULL,'2026-05-21 10:12:30','2026-05-21 10:19:00','082227789989','luar_negeri','sedang_bekerja','instagram','natalia.yapvivi'),(71,'JS-WISNU-BPL-11-26-033',NULL,'wisnu Prahadianto','',NULL,NULL,NULL,'085220010889','wip@poltekpar-nhi.ac.id','Bandung','sedang_bekerja','BPLP','Tours and Travel','sebelum_2011',NULL,'https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-WISNU-BPL-11-26-033/foto.avif',NULL,NULL,NULL,1,0,'2026-05-21 11:54:16',NULL,0,NULL,'2026-05-21 11:54:16','2026-05-21 11:54:27','085220010889','keduanya','sedang_bekerja','lainnya',NULL),(72,'JS-+62-NHI-23-26-001',NULL,'+62 813-1895-2753','',NULL,NULL,NULL,'+62 813-1895-2753','intan.virtually@gmail.com','Bandung, Indonesia','sedang_bekerja','Politeknik Pariwisata NHI Bandung','D4 Usaha Perjalanan Wisata','2023',NULL,'https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/jobseeker/JS-+62-NHI-23-26-001/foto.jpg',NULL,NULL,NULL,1,0,'2026-05-21 12:01:18',NULL,0,NULL,'2026-05-21 12:01:17','2026-05-21 12:04:59','+62 813-1895-2753','keduanya','sedang_bekerja','instagram','Dewiintan_k'),(73,'JS-STIVE-NHI-26-26-001',NULL,'Stive David Tombeng','',NULL,NULL,NULL,'085157866373','hello.stevedavid@gmail.com','Bandung, Jawa Barat','belum_bekerja','Poltekpar NHI Bandung','D3 Divisi Kamar','2026',NULL,NULL,NULL,NULL,NULL,1,0,'2026-05-21 12:12:10',NULL,0,NULL,'2026-05-21 12:12:10','2026-05-21 12:12:10','085157866373','keduanya','belum_bekerja','instagram','steveedavid'),(74,'JS-WISNU-BPL-11-26-077',NULL,'wisnu Prahadianto','',NULL,NULL,NULL,'0817200289','wip@poltekpar-nhi.ac.id','Bandung','sedang_bekerja','BPLP','Travel','sebelum_2011',NULL,NULL,NULL,NULL,NULL,1,0,'2026-05-21 14:37:46',NULL,0,NULL,'2026-05-21 14:37:45','2026-05-21 14:37:45','0817200289','keduanya','sedang_bekerja','lainnya',NULL);
/*!40000 ALTER TABLE `jobseekers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eventId` int NOT NULL,
  `coordinatorId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text,
  `type` enum('info','warning','success','error') DEFAULT 'info',
  `channel` enum('email','whatsapp','telegram','line') DEFAULT 'email',
  `status` enum('pending','sent','failed') DEFAULT 'pending',
  `sentAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sponsors`
--

DROP TABLE IF EXISTS `sponsors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sponsors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `eventId` int DEFAULT NULL,
  `companyName` varchar(255) NOT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `picName` varchar(255) DEFAULT NULL,
  `picPhone` varchar(50) DEFAULT NULL,
  `picEmail` varchar(255) DEFAULT NULL,
  `package` enum('platinum','gold','silver','custom','inkind') NOT NULL DEFAULT 'silver',
  `boothType` enum('with_booth','supporting_only') NOT NULL DEFAULT 'supporting_only',
  `amount` decimal(15,2) DEFAULT '0.00',
  `inkindDesc` text,
  `inkindValue` decimal(15,2) DEFAULT '0.00',
  `status` enum('prospek','dikontak','tertarik','konfirmasi','lunas') NOT NULL DEFAULT 'prospek',
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sponsors`
--

LOCK TABLES `sponsors` WRITE;
/*!40000 ALTER TABLE `sponsors` DISABLE KEYS */;
/*!40000 ALTER TABLE `sponsors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `openId` varchar(64) NOT NULL,
  `name` text,
  `email` varchar(320) DEFAULT NULL,
  `loginMethod` varchar(64) DEFAULT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_openId_unique` (`openId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `venues`
--

DROP TABLE IF EXISTS `venues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `venues` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `totalArea` decimal(10,2) DEFAULT NULL,
  `costPerDay` decimal(15,2) DEFAULT NULL,
  `isFree` tinyint(1) DEFAULT '0',
  `amenities` json DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `venues`
--

LOCK TABLES `venues` WRITE;
/*!40000 ALTER TABLE `venues` DISABLE KEYS */;
/*!40000 ALTER TABLE `venues` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-21 22:15:07
