import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  decimal,
  json,
  boolean,
  date
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Events table — stores job fair events
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  university: varchar("university", { length: 255 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  eventDate: date("eventDate"),
  expectedEmployers: int("expectedEmployers").default(0),
  expectedAttendees: int("expectedAttendees").default(0),
  budget: decimal("budget", { precision: 15, scale: 2 }),
  venueId: int("venueId"),
  status: mysqlEnum("status", ["planning", "approved", "in_progress", "completed", "cancelled"]).default("planning"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Venues table — stores venue information
 */
export const venues = mysqlTable("venues", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  capacity: int("capacity"),
  totalArea: decimal("totalArea", { precision: 10, scale: 2 }),
  costPerDay: decimal("costPerDay", { precision: 15, scale: 2 }),
  isFree: boolean("isFree").default(false),
  amenities: json("amenities"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Venue = typeof venues.$inferSelect;
export type InsertVenue = typeof venues.$inferInsert;

/**
 * Coordinators table — stores event coordinators and their roles
 */
export const coordinators = mysqlTable("coordinators", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  userId: int("userId").notNull(),
  coordinatorRole: mysqlEnum("coordinatorRole", [
    "project_manager",
    "finance",
    "sponsorship",
    "admin",
    "logistics",
    "marketing"
  ]).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  status: mysqlEnum("status", ["active", "inactive"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Coordinator = typeof coordinators.$inferSelect;
export type InsertCoordinator = typeof coordinators.$inferInsert;

/**
 * Employers table — stores employer/company information
 */
export const employers = mysqlTable("employers", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId"),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  contactPerson: varchar("contactPerson", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  boothType: mysqlEnum("boothType", ["main", "standard", "economy", "special"]),
  boothSize: varchar("boothSize", { length: 50 }),
  boothPrice: decimal("boothPrice", { precision: 15, scale: 2 }),
  sponsorshipTier: mysqlEnum("sponsorshipTier", ["platinum", "gold", "silver", "none"]).default("none"),
  sponsorshipPrice: decimal("sponsorshipPrice", { precision: 15, scale: 2 }),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "partial", "paid", "cancelled"]).default("pending"),
  notes: text("notes"),
  previousParticipation: int("previousParticipation").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Employer = typeof employers.$inferSelect;
export type InsertEmployer = typeof employers.$inferInsert;

/**
 * Booth Layouts table — stores booth layout configurations
 */
export const boothLayouts = mysqlTable("boothLayouts", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  boothType: varchar("boothType", { length: 50 }).notNull(),
  quantity: int("quantity").notNull(),
  widthM: decimal("widthM", { precision: 5, scale: 2 }),
  heightM: decimal("heightM", { precision: 5, scale: 2 }),
  costPerM2: decimal("costPerM2", { precision: 10, scale: 2 }),
  sellingPrice: decimal("sellingPrice", { precision: 15, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BoothLayout = typeof boothLayouts.$inferSelect;
export type InsertBoothLayout = typeof boothLayouts.$inferInsert;

/**
 * Event Expenses table — stores event expenses
 */
export const eventExpenses = mysqlTable("eventExpenses", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["planned", "committed", "paid"]).default("planned"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EventExpense = typeof eventExpenses.$inferSelect;
export type InsertEventExpense = typeof eventExpenses.$inferInsert;

/**
 * Notifications table — stores notifications for coordinators
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  coordinatorId: int("coordinatorId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  type: mysqlEnum("type", ["info", "warning", "success", "error"]).default("info"),
  channel: mysqlEnum("channel", ["email", "whatsapp", "telegram", "line"]).default("email"),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
/**
 * Employer Bookings table — data booking booth dari form pendaftaran employer
 */
export const employerBookings = mysqlTable("employerBookings", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: varchar("bookingId", { length: 50 }).notNull().unique(),
  eventId: int("eventId"),
  // Perusahaan
  companyName: varchar("companyName", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  city: varchar("city", { length: 100 }),
  website: varchar("website", { length: 255 }),
  // PIC 1
  pic1Name: varchar("pic1Name", { length: 255 }).notNull(),
  pic1Title: varchar("pic1Title", { length: 100 }),
  pic1Email: varchar("pic1Email", { length: 320 }).notNull(),
  pic1Whatsapp: varchar("pic1Whatsapp", { length: 20 }).notNull(),
  // PIC 2 (opsional)
  pic2Name: varchar("pic2Name", { length: 255 }),
  pic2Title: varchar("pic2Title", { length: 100 }),
  pic2Email: varchar("pic2Email", { length: 320 }),
  pic2Whatsapp: varchar("pic2Whatsapp", { length: 20 }),
  // Booth
  booths: json("booths").notNull(), // [{id, label, type, price}]
  totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }).notNull(),
  // Rekrutmen
  positions: json("positions"), // [{position, customPosition, count}]
  // Special request
  needsBoothDesign: boolean("needsBoothDesign").default(false),
  specialRequest: text("specialRequest"),
  // Status
  status: mysqlEnum("status", ["pending", "confirmed", "rejected"]).default("pending").notNull(),
  paymentDeadline: date("paymentDeadline"),
  confirmedAt: timestamp("confirmedAt"),
  confirmedBy: int("confirmedBy"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmployerBooking = typeof employerBookings.$inferSelect;
export type InsertEmployerBooking = typeof employerBookings.$inferInsert;

/**
 * Jobseekers table — data pendaftar jobseeker
 */
export const jobseekers = mysqlTable("jobseekers", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: varchar("registrationId", { length: 20 }).notNull().unique(),
  eventId: int("eventId"),
  // Data diri
  namaLengkap: varchar("namaLengkap", { length: 255 }).notNull(),
  nik: varchar("nik", { length: 20 }).notNull(),
  tempatLahir: varchar("tempatLahir", { length: 100 }),
  tanggalLahir: date("tanggalLahir"),
  jenisKelamin: mysqlEnum("jenisKelamin", ["Laki-laki", "Perempuan"]).notNull(),
  whatsapp: varchar("whatsapp", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  kota: varchar("kota", { length: 100 }),
  // Latar belakang
  status: mysqlEnum("status", ["mahasiswa", "fresh_graduate", "alumni_nhi", "umum"]).notNull(),
  institusi: varchar("institusi", { length: 255 }),
  jurusan: varchar("jurusan", { length: 255 }),
  tahunLulus: varchar("tahunLulus", { length: 10 }),
  bidangMinat: varchar("bidangMinat", { length: 100 }),
  // Dokumen (path/URL file)
  fotoUrl: varchar("fotoUrl", { length: 500 }),
  cvUrl: varchar("cvUrl", { length: 500 }),
  ktmUrl: varchar("ktmUrl", { length: 500 }),
  sertifikatUrl: varchar("sertifikatUrl", { length: 500 }),
  // Consent UU PDP
  consent1: boolean("consent1").default(false).notNull(),
  consent2: boolean("consent2").default(false),
  consent1At: timestamp("consent1At"),
  consent2At: timestamp("consent2At"),
  // Status verifikasi
  verified: boolean("verified").default(false),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Jobseeker = typeof jobseekers.$inferSelect;
export type InsertJobseeker = typeof jobseekers.$inferInsert;

/**
 * Interview Bookings table — booking slot interview booth
 */
export const interviewBookings = mysqlTable("interviewBookings", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId"),
  employerBookingId: varchar("employerBookingId", { length: 50 }).notNull(),
  boothId: varchar("boothId", { length: 10 }).notNull(), // E1-E10
  day: int("day").notNull(), // 0 = hari 1, 1 = hari 2
  slotIndex: int("slotIndex").notNull(), // 0-5 (6 slot per hari)
  companyName: varchar("companyName", { length: 255 }),
  status: mysqlEnum("status", ["active", "cancelled"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InterviewBooking = typeof interviewBookings.$inferSelect;
export type InsertInterviewBooking = typeof interviewBookings.$inferInsert;

// ── Event Config table — superadmin settings ─────────────────
export const eventConfig = mysqlTable("eventConfig", {
  id:        int("id").autoincrement().primaryKey(),
  configKey: varchar("configKey", { length: 100 }).notNull().unique(),
  value:     text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EventConfig = typeof eventConfig.$inferSelect;

export const sponsors = mysqlTable("sponsors", {
  id:           int("id").autoincrement().primaryKey(),
  eventId:      int("eventId"),
  companyName:  varchar("companyName", { length: 255 }).notNull(),
  industry:     varchar("industry", { length: 100 }),
  picName:      varchar("picName", { length: 255 }),
  picPhone:     varchar("picPhone", { length: 50 }),
  picEmail:     varchar("picEmail", { length: 255 }),
  package:      mysqlEnum("package", ["platinum","gold","silver","custom","inkind"]).notNull().default("silver"),
  boothType:    mysqlEnum("boothType", ["with_booth","supporting_only"]).notNull().default("supporting_only"),
  amount:       decimal("amount", { precision: 15, scale: 2 }).default("0"),
  inkindDesc:   text("inkindDesc"),
  inkindValue:  decimal("inkindValue", { precision: 15, scale: 2 }).default("0"),
  status:       mysqlEnum("status", ["prospek","dikontak","tertarik","konfirmasi","lunas"]).default("prospek").notNull(),
  notes:        text("notes"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const employerProspects = mysqlTable("employerProspects", {
  id:           int("id").autoincrement().primaryKey(),
  eventId:      int("eventId"),
  companyName:  varchar("companyName", { length: 255 }).notNull(),
  industry:     varchar("industry", { length: 100 }),
  picName:      varchar("picName", { length: 255 }),
  picPhone:     varchar("picPhone", { length: 50 }),
  picEmail:     varchar("picEmail", { length: 255 }),
  status:       mysqlEnum("status", ["potensial","dikontak","tertarik","konfirmasi","hadir"]).default("potensial").notNull(),
  notes:        text("notes"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
