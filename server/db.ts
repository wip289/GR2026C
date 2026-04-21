import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  events,
  coordinators,
  employers,
  venues,
  boothLayouts,
  eventExpenses,
  notifications,
  employerBookings,
  jobseekers,
  interviewBookings,
  eventConfig,
  type Event,
  type Coordinator,
  type Employer,
  type Venue,
  type BoothLayout,
  type EventExpense,
  type Notification,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Event queries
export async function createEvent(eventData: typeof events.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(events).values(eventData);
  return result;
}

export async function getEventById(eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getEventsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(events).where(eq(events.createdBy, userId));
}

// Coordinator queries
export async function addCoordinator(coordinatorData: typeof coordinators.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(coordinators).values(coordinatorData);
}

export async function getCoordinatorsByEvent(eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(coordinators).where(eq(coordinators.eventId, eventId));
}

export async function getCoordinatorRole(userId: number, eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(coordinators)
    .where(and(eq(coordinators.userId, userId), eq(coordinators.eventId, eventId)))
    .limit(1);
  
  return result.length > 0 ? result[0].coordinatorRole : null;
}

// Employer queries
export async function addEmployer(employerData: typeof employers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(employers).values(employerData);
}

export async function getEmployersByEvent(eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(employers).where(eq(employers.eventId, eventId));
}

export async function getAllEmployers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(employers);
}

// Venue queries
export async function getVenueById(venueId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(venues).where(eq(venues.id, venueId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllVenues() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(venues);
}

// Booth Layout queries
export async function getBoothLayoutsByEvent(eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(boothLayouts).where(eq(boothLayouts.eventId, eventId));
}

// Event Expense queries
export async function getExpensesByEvent(eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(eventExpenses).where(eq(eventExpenses.eventId, eventId));
}

export async function addExpense(expenseData: typeof eventExpenses.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(eventExpenses).values(expenseData);
}

// Notification queries
export async function createNotification(notificationData: typeof notifications.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(notifications).values(notificationData);
}

export async function getNotificationsByCoordinator(coordinatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(notifications).where(eq(notifications.coordinatorId, coordinatorId));
}

// ── Employer Booking queries ──────────────────────────────
export async function createEmployerBooking(data: typeof employerBookings.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(employerBookings).values(data);
}

export async function getEmployerBookingById(bookingId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(employerBookings).where(eq(employerBookings.bookingId, bookingId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getEmployerBookingByIdAndEmail(bookingId: string, email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(employerBookings)
    .where(and(eq(employerBookings.bookingId, bookingId), eq(employerBookings.pic1Email, email)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllEmployerBookings(eventId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (eventId) {
    return await db.select().from(employerBookings).where(eq(employerBookings.eventId, eventId));
  }
  return await db.select().from(employerBookings);
}

export async function updateEmployerBookingStatus(bookingId: string, status: "pending" | "confirmed" | "rejected") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(employerBookings)
    .set({ status, updatedAt: new Date() })
    .where(eq(employerBookings.bookingId, bookingId));
}

// ── Jobseeker queries ─────────────────────────────────────
export async function createJobseeker(data: typeof jobseekers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(jobseekers).values(data);
}

export async function getJobseekerByRegistrationId(registrationId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(jobseekers).where(eq(jobseekers.registrationId, registrationId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getJobseekerByIdAndEmail(registrationId: string, email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(jobseekers)
    .where(and(eq(jobseekers.registrationId, registrationId), eq(jobseekers.email, email)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllJobseekers(eventId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (eventId) {
    return await db.select().from(jobseekers).where(eq(jobseekers.eventId, eventId));
  }
  return await db.select().from(jobseekers);
}

// ── Interview Booking queries ─────────────────────────────
export async function createInterviewBooking(data: typeof interviewBookings.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(interviewBookings).values(data);
}

export async function getInterviewBookingsByEmployer(employerBookingId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(interviewBookings).where(eq(interviewBookings.employerBookingId, employerBookingId));
}

export async function getAllInterviewBookings(eventId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (eventId) {
    return await db.select().from(interviewBookings).where(eq(interviewBookings.eventId, eventId));
  }
  return await db.select().from(interviewBookings);
}

export async function deleteInterviewBooking(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(interviewBookings).where(eq(interviewBookings.id, id));
}

// ── Event Config ──────────────────────────────────────────────
export async function getEventConfig(): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(eventConfig);
  const result: Record<string, string> = {};
  rows.forEach(r => { result[r.configKey] = r.value; });
  return result;
}

export async function setEventConfig(data: Record<string, string>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  for (const [key, value] of Object.entries(data)) {
    await db.insert(eventConfig)
      .values({ configKey: key, value })
      .onDuplicateKeyUpdate({ set: { value } });
  }
}

export async function getConfigValue(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(eventConfig).where(eq(eventConfig.configKey, key));
  return rows[0]?.value ?? null;
}
