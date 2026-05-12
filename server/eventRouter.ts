import { z } from "zod";
import { getDb } from "./db";
import { jobseekers, sponsors, employerProspects, employerBookings } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createEvent,
  getEventConfig,
  setEventConfig,
  getEventById,
  getEventsByUser,
  addCoordinator,
  getCoordinatorsByEvent,
  getCoordinatorRole,
  getAllEmployers,
  getEmployersByEvent,
  getAllVenues,
  getUserByEmail,
  createEmployerBooking,
  getEmployerBookingById,
  getEmployerBookingByIdAndEmail,
  getAllEmployerBookings,
  updateEmployerBookingStatus,
  updateEmployerBuktiPayment,
  approveEmployerPembayaran,
  updateEmployerJobVacancies,
  createJobseeker,
  getJobseekerByIdAndEmail,
  getAllJobseekers,
  createInterviewBooking,
  getInterviewBookingsByEmployer,
  getAllInterviewBookings,
  deleteInterviewBooking,
  incrementRescheduleCount,
} from "./db";
import { hasPermission, hasAnyPermission } from "./rbac";
import type { CoordinatorRole } from "./rbac";

export const eventRouter = router({
  /**
   * Create a new event (Project Manager only)
   */
  createEvent: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        clientName: z.string().min(1),
        university: z.string().min(1),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        eventDate: z.string().optional(),
        expectedEmployers: z.number().optional(),
        expectedAttendees: z.number().optional(),
        budget: z.string().optional(),
        venueId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      try {
        const result = await createEvent({
          name: input.name,
          clientName: input.clientName,
          university: input.university,
          contactEmail: input.contactEmail || null,
          contactPhone: input.contactPhone || null,
          eventDate: input.eventDate ? new Date(input.eventDate) : null,
          expectedEmployers: input.expectedEmployers || 0,
          expectedAttendees: input.expectedAttendees || 0,
          budget: input.budget ? parseFloat(input.budget).toString() : null,
          venueId: input.venueId || null,
          createdBy: ctx.user.id,
        });

        return { success: true, message: "Event created successfully" };
      } catch (error) {
        console.error("[Event Creation Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create event",
        });
      }
    }),

  /**
   * Look up a user by email address (for coordinator invite)
   */
  getUserByEmail: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const user = await getUserByEmail(input.email);
      if (!user) return null;
      // Only return safe public fields
      return { id: user.id, name: user.name, email: user.email };
    }),

  // ── Employer Booking endpoints ────────────────────────────

  createEmployerBooking: publicProcedure
    .input(z.object({
      bookingId: z.string(),
      eventId: z.number().optional(),
      companyName: z.string(),
      industry: z.string().optional(),
      city: z.string().optional(),
      website: z.string().optional(),
      pic1Name: z.string(),
      pic1Title: z.string().optional(),
      pic1Email: z.string().email(),
      pic1Whatsapp: z.string(),
      pic2Name: z.string().optional(),
      pic2Title: z.string().optional(),
      pic2Email: z.string().optional(),
      pic2Whatsapp: z.string().optional(),
      booths: z.array(z.object({ id: z.string(), label: z.string(), type: z.string(), price: z.number() })),
      totalAmount: z.number(),
      positions: z.array(z.any()).optional(),
      needsBoothDesign: z.boolean().optional(),
      specialRequest: z.string().optional(),
      facilities: z.string().optional(),
      exhibitorOrder: z.string().optional(),
      logoUrl: z.string().optional(),
      jobVacanciesUrl: z.array(z.object({ url: z.string(), name: z.string() })).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // ── Validasi duplikat email ──
        const existingByEmail = await getEmployerBookingByIdAndEmail("", input.pic1Email);
        const allBookings = await getAllEmployerBookings();
        const emailExists = allBookings.some((b: any) => 
          b.pic1Email?.toLowerCase() === input.pic1Email.toLowerCase() &&
          b.status !== "rejected"
        );
        if (emailExists) {
          throw new TRPCError({ 
            code: "CONFLICT", 
            message: "Email ini sudah terdaftar. Gunakan email lain atau login dengan Booking ID yang sudah ada." 
          });
        }

        // ── Validasi booth sudah dipesan ──
        const bookedBooths: string[] = [];
        for (const booking of allBookings) {
          if (booking.status === "rejected") continue;
          const booths = Array.isArray(booking.booths) ? booking.booths : [];
          for (const b of booths as any[]) {
            bookedBooths.push(b.id || b.label);
          }
        }
        const conflictBooths = input.booths.filter(b => bookedBooths.includes(b.id) || bookedBooths.includes(b.label));
        if (conflictBooths.length > 0) {
          throw new TRPCError({ 
            code: "CONFLICT", 
            message: `Booth ${conflictBooths.map(b => b.label).join(", ")} sudah dipesan perusahaan lain. Silakan pilih booth lain.` 
          });
        }

        await createEmployerBooking({
          bookingId: input.bookingId,
          eventId: input.eventId || null,
          companyName: input.companyName,
          industry: input.industry || null,
          city: input.city || null,
          website: input.website || null,
          pic1Name: input.pic1Name,
          pic1Title: input.pic1Title || null,
          pic1Email: input.pic1Email,
          pic1Whatsapp: input.pic1Whatsapp,
          pic2Name: input.pic2Name || null,
          pic2Title: input.pic2Title || null,
          pic2Email: input.pic2Email || null,
          pic2Whatsapp: input.pic2Whatsapp || null,
          booths: input.booths,
          totalAmount: input.totalAmount.toString(),
          positions: input.positions || null,
          needsBoothDesign: input.needsBoothDesign || false,
          specialRequest: input.specialRequest || null,
          facilities: input.facilities || null,
          exhibitorOrder: input.exhibitorOrder || null,
          logoUrl: input.logoUrl || null,
          jobVacanciesUrl: input.jobVacanciesUrl || null,
          status: "pending",
          paymentDeadline: new Date("2026-06-01"),
        });
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[createEmployerBooking]", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Gagal menyimpan booking" });
      }
    }),

  loginEmployer: publicProcedure
    .input(z.object({ bookingId: z.string(), email: z.string().email() }))
    .query(async ({ input }) => {
      const booking = await getEmployerBookingByIdAndEmail(input.bookingId, input.email);
      if (!booking) return null;
      return {
        bookingId: booking.bookingId,
        companyName: booking.companyName,
        industry: booking.industry,
        city: booking.city,
        pic1Name: booking.pic1Name,
        pic1Whatsapp: booking.pic1Whatsapp,
        booths: booking.booths,
        totalAmount: booking.totalAmount,
        status: booking.status,
        needsBoothDesign: booking.needsBoothDesign,
        specialRequest: booking.specialRequest,
        positions: booking.positions,
        pic1Email: booking.pic1Email,
        pic1Title: booking.pic1Title,
        pic2Name: booking.pic2Name,
        pic2Title: booking.pic2Title,
        pic2Email: booking.pic2Email,
        pic2Whatsapp: booking.pic2Whatsapp,
        website: booking.website,
        industry: booking.industry,
        city: booking.city,
        createdAt: booking.createdAt,
        logoUrl: (booking as any).logoUrl,
        buktiPaymentUrl: (booking as any).buktiPaymentUrl,
        kwitansiApproved: (booking as any).kwitansiApproved,
        jobVacanciesUrl: (booking as any).jobVacanciesUrl,
        rescheduleCount: (booking as any).rescheduleCount ?? 0,
      };
    }),

  getAllEmployerBookings: publicProcedure
    .query(async () => {
      return await getAllEmployerBookings();
    }),

  updateEmployerBookingStatus: publicProcedure
    .input(z.object({
      bookingId: z.string(),
      status: z.enum(["pending", "confirmed", "rejected"]),
    }))
    .mutation(async ({ input }) => {
      await updateEmployerBookingStatus(input.bookingId, input.status);
      return { success: true };
    }),

  updateEmployerBooth: publicProcedure
    .input(z.object({
      bookingId: z.string(),
      selectedBooths: z.array(z.string()),
      boothType: z.string().optional(),
      totalAmount: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(employerBookings)
        .set({
          booths: JSON.stringify(input.selectedBooths.map(id => ({
            id,
            label: id,
            type: input.boothType || "standard",
            price: 0,
          }))),
          updatedAt: new Date(),
        })
        .where(eq(employerBookings.bookingId, input.bookingId));
      return { success: true };
    }),

  updateBuktiPayment: publicProcedure
    .input(z.object({ bookingId: z.string(), url: z.string() }))
    .mutation(async ({ input }) => {
      await updateEmployerBuktiPayment(input.bookingId, input.url);
      return { success: true };
    }),

  approvePembayaran: publicProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ input }) => {
      await approveEmployerPembayaran(input.bookingId);
      return { success: true };
    }),

  updateJobVacancies: publicProcedure
    .input(z.object({ bookingId: z.string(), urls: z.array(z.object({ url: z.string(), name: z.string() })) }))
    .mutation(async ({ input }) => {
      await updateEmployerJobVacancies(input.bookingId, input.urls);
      return { success: true };
    }),

  deleteEmployerBooking: publicProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(employerBookings).where(eq(employerBookings.bookingId, input.bookingId));
      return { success: true };
    }),

  deleteAllEmployerBookings: publicProcedure
    .mutation(async () => {
      const db = await getDb();
      await db.delete(employerBookings);
      return { success: true };
    }),

  deleteJobseeker: publicProcedure
    .input(z.object({ registrationId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(jobseekers).where(eq(jobseekers.registrationId, input.registrationId));
      return { success: true };
    }),

  deleteAllJobseekers: publicProcedure
    .mutation(async () => {
      const db = await getDb();
      await db.delete(jobseekers);
      return { success: true };
    }),

  // ── Jobseeker endpoints ────────────────────────────────

  createJobseeker: publicProcedure
    .input(z.object({
      registrationId: z.string(),
      eventId: z.number().optional(),
      namaLengkap: z.string(),
      nik: z.string().optional(),
      tempatLahir: z.string().optional(),
      tanggalLahir: z.string().optional(),
      jenisKelamin: z.enum(["Laki-laki", "Perempuan"]).optional(),
      whatsapp: z.string().optional(),
      email: z.string().email(),
      kota: z.string().optional(),
      status: z.enum(["mahasiswa", "fresh_graduate", "alumni_nhi", "umum"]).optional(),
      institusi: z.string().optional(),
      jurusan: z.string().optional(),
      tahunLulus: z.string().optional(),
      bidangMinat: z.string().optional(),
      phone: z.string().optional(),
      minatKerja: z.enum(["dalam_negeri", "luar_negeri", "keduanya"]).optional(),
      statusKerja: z.enum(["belum_bekerja", "sedang_bekerja", "pernah_bekerja"]).optional(),
      sumberInfo: z.string().optional(),
      igUsername: z.string().optional(),
      consent1: z.boolean(),
      consent2: z.boolean(),
      fotoUrl: z.string().optional(),
      cvUrl: z.string().optional(),
      ktmUrl: z.string().optional(),
      sertifikatUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Ambil eventId aktif dari config jika tidak dikirim dari form
        let resolvedEventId = input.eventId || null;
        if (!resolvedEventId) {
          const cfg = await getEventConfig() as any;
          resolvedEventId = cfg?.eventId || cfg?.id || null;
        }
        await createJobseeker({
          registrationId: input.registrationId,
          eventId: resolvedEventId,
          namaLengkap: input.namaLengkap,
          nik: input.nik || "",
          tempatLahir: input.tempatLahir || null,
          tanggalLahir: input.tanggalLahir ? new Date(input.tanggalLahir) : null,
          jenisKelamin: input.jenisKelamin || null,
          whatsapp: input.whatsapp || "",
          email: input.email,
          kota: input.kota || null,
          status: input.statusKerja || input.status || null,
          institusi: input.institusi || null,
          jurusan: input.jurusan || null,
          tahunLulus: input.tahunLulus || null,
          bidangMinat:  input.bidangMinat  || null,
          phone:        input.phone        || null,
          minatKerja:   input.minatKerja   || null,
          statusKerja:  input.statusKerja  || null,
          sumberInfo:   input.sumberInfo   || null,
          igUsername:   input.igUsername   || null,
          fotoUrl: input.fotoUrl || null,
          cvUrl: input.cvUrl || null,
          ktmUrl: input.ktmUrl || null,
          sertifikatUrl: input.sertifikatUrl || null,
          consent1: input.consent1,
          consent2: input.consent2,
          consent1At: input.consent1 ? new Date() : null,
          consent2At: input.consent2 ? new Date() : null,
        });
        return { success: true };
      } catch (error: any) {
        console.error("[createJobseeker] DETAIL:", error?.message, error?.code, JSON.stringify(error));
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Gagal menyimpan: ${error?.message || error}` });
      }
    }),

  loginJobseeker: publicProcedure
    .input(z.object({ registrationId: z.string(), email: z.string().email() }))
    .query(async ({ input }) => {
      const js = await getJobseekerByIdAndEmail(input.registrationId, input.email);
      if (!js) return null;
      return {
        registrationId: js.registrationId,
        namaLengkap: js.namaLengkap,
        email: js.email,
        whatsapp: js.whatsapp,
        status: js.status,
        kota: js.kota,
        institusi: js.institusi,
        jurusan: js.jurusan,
        bidangMinat: js.bidangMinat,
        fotoUrl: js.fotoUrl,
        cvUrl: js.cvUrl,
        ktmUrl: js.ktmUrl,
        sertifikatUrl: js.sertifikatUrl,
        consent1: js.consent1,
        consent2: js.consent2,
      };
    }),

  getAllJobseekers: publicProcedure
    .query(async () => {
      return await getAllJobseekers();
    }),

  // ── Interview Booking endpoints ────────────────────────

  createInterviewBooking: publicProcedure
    .input(z.object({
      eventId: z.number().optional(),
      employerBookingId: z.string(),
      boothId: z.string(),
      day: z.number(),
      slotIndex: z.number(),
      companyName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await createInterviewBooking({
        eventId: input.eventId || null,
        employerBookingId: input.employerBookingId,
        boothId: input.boothId,
        day: input.day,
        slotIndex: input.slotIndex,
        companyName: input.companyName || null,
        status: "active",
      });
      return { success: true };
    }),

  getMyInterviewBookings: publicProcedure
    .input(z.object({ employerBookingId: z.string() }))
    .query(async ({ input }) => {
      return await getInterviewBookingsByEmployer(input.employerBookingId);
    }),

  getAllInterviewBookings: publicProcedure
    .query(async () => {
      return await getAllInterviewBookings();
    }),

  cancelInterviewBooking: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteInterviewBooking(input.id);
      return { success: true };
    }),

  incrementRescheduleCount: publicProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ input }) => {
      await incrementRescheduleCount(input.bookingId);
      return { success: true };
    }),

  /**
   * Get all events for the current user
   */
  getMyEvents: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

    try {
      const events = await getEventsByUser(ctx.user.id);
      return events;
    } catch (error) {
      console.error("[Get Events Error]", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch events",
      });
    }
  }),

  /**
   * Get event details with role-based access
   */
  getEvent: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      try {
        const event = await getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }

        // Check if user has access to this event
        const userRole = await getCoordinatorRole(ctx.user.id, input.eventId);
        if (!userRole && event.createdBy !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this event",
          });
        }

        return event;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Get Event Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch event",
        });
      }
    }),

  /**
   * Add a coordinator to an event (Project Manager only)
   */
  addCoordinator: protectedProcedure
    .input(
      z.object({
        eventId: z.number(),
        userId: z.number(),
        coordinatorRole: z.enum([
          "project_manager",
          "finance",
          "sponsorship",
          "admin",
          "logistics",
          "marketing",
        ] as const),
        email: z.string().email().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      try {
        // Verify user is project manager or event creator
        const event = await getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }

        if (event.createdBy !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the event creator can add coordinators",
          });
        }

        const result = await addCoordinator({
          eventId: input.eventId,
          userId: input.userId,
          coordinatorRole: input.coordinatorRole as CoordinatorRole,
          email: input.email || null,
          phone: input.phone || null,
        });

        return { success: true, message: "Coordinator added successfully" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Add Coordinator Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add coordinator",
        });
      }
    }),

  /**
   * Get coordinators for an event
   */
  getCoordinators: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      try {
        const coordinators = await getCoordinatorsByEvent(input.eventId);
        return coordinators;
      } catch (error) {
        console.error("[Get Coordinators Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch coordinators",
        });
      }
    }),

  /**
   * Get user's role in an event
   */
  getMyRole: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      try {
        const role = await getCoordinatorRole(ctx.user.id, input.eventId);
        return { role };
      } catch (error) {
        console.error("[Get Role Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch role",
        });
      }
    }),

  /**
   * Get all employers (with role-based filtering)
   */
  getEmployers: protectedProcedure
    .input(z.object({ eventId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      try {
        // Check if user has permission to view employers
        if (input.eventId) {
          const userRole = await getCoordinatorRole(ctx.user.id, input.eventId);
          if (!userRole) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You don't have access to this event's employers",
            });
          }

          if (!hasPermission(userRole, "view_employers")) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Your role doesn't have permission to view employers",
            });
          }

          const employers = await getEmployersByEvent(input.eventId);
          return employers;
        }

        // Get all employers for sponsorship/marketing roles
        const employers = await getAllEmployers();
        return employers;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Get Employers Error]", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch employers",
        });
      }
    }),

  /**
   * Get all venues
   */
  getVenues: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

    try {
      const venues = await getAllVenues();
      return venues;
    } catch (error) {
      console.error("[Get Venues Error]", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch venues",
      });
    }
  }),

  // ── Superadmin Config ────────────────────────────────────────
  getEventConfig: publicProcedure
    .query(async () => {
      return await getEventConfig();
    }),

  saveEventConfig: publicProcedure
    .input(z.record(z.string(), z.string()))
    .mutation(async ({ input }) => {
      await setEventConfig(input);
      return { success: true };
    }),

  // ── Sponsor endpoints ────────────────────────────────────────

  getAllSponsors: publicProcedure
    .query(async () => {
      const db = await getDb();
      return db.select().from(sponsors);
    }),

  createSponsor: publicProcedure
    .input(z.object({
      companyName: z.string().min(1),
      industry: z.string().optional(),
      picName: z.string().optional(),
      picPhone: z.string().optional(),
      picEmail: z.string().optional(),
      package: z.enum(["platinum","gold","silver","custom","inkind"]),
      boothType: z.enum(["with_booth","supporting_only"]),
      amount: z.number().optional(),
      inkindDesc: z.string().optional(),
      inkindValue: z.number().optional(),
      status: z.enum(["prospek","dikontak","tertarik","konfirmasi","lunas"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.insert(sponsors).values({
        companyName: input.companyName,
        industry: input.industry || null,
        picName: input.picName || null,
        picPhone: input.picPhone || null,
        picEmail: input.picEmail || null,
        package: input.package,
        boothType: input.boothType,
        amount: (input.amount ?? 0).toString(),
        inkindDesc: input.inkindDesc || null,
        inkindValue: (input.inkindValue ?? 0).toString(),
        status: input.status,
        notes: input.notes || null,
      });
      return { success: true };
    }),

  updateSponsor: publicProcedure
    .input(z.object({
      id: z.number(),
      companyName: z.string().min(1).optional(),
      industry: z.string().optional(),
      picName: z.string().optional(),
      picPhone: z.string().optional(),
      picEmail: z.string().optional(),
      package: z.enum(["platinum","gold","silver","custom","inkind"]).optional(),
      boothType: z.enum(["with_booth","supporting_only"]).optional(),
      amount: z.number().optional(),
      inkindDesc: z.string().optional(),
      inkindValue: z.number().optional(),
      status: z.enum(["prospek","dikontak","tertarik","konfirmasi","lunas"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, amount, inkindValue, ...rest } = input;
      await db.update(sponsors)
        .set({
          ...rest,
          ...(amount !== undefined && { amount: amount.toString() }),
          ...(inkindValue !== undefined && { inkindValue: inkindValue.toString() }),
          updatedAt: new Date(),
        })
        .where(eq(sponsors.id, id));
      return { success: true };
    }),

  deleteSponsor: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(sponsors).where(eq(sponsors.id, input.id));
      return { success: true };
    }),

  // ── Employer Prospect endpoints ───────────────────────────────

  getAllProspects: publicProcedure
    .query(async () => {
      const db = await getDb();
      return db.select().from(employerProspects);
    }),

  createProspect: publicProcedure
    .input(z.object({
      companyName: z.string().min(1),
      industry: z.string().optional(),
      picName: z.string().optional(),
      picPhone: z.string().optional(),
      status: z.enum(["potensial","dikontak","tertarik","konfirmasi","hadir"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.insert(employerProspects).values({
        companyName: input.companyName,
        industry: input.industry || null,
        picName: input.picName || null,
        picPhone: input.picPhone || null,
        status: input.status,
        notes: input.notes || null,
      });
      return { success: true };
    }),

  updateProspectStatus: publicProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["potensial","dikontak","tertarik","konfirmasi","hadir"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(employerProspects)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(employerProspects.id, input.id));
      return { success: true };
    }),

  deleteProspect: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(employerProspects).where(eq(employerProspects.id, input.id));
      return { success: true };
    }),

  updateJobseeker: publicProcedure
    .input(z.object({
      registrationId: z.string(),
      institusi:    z.string().optional(),
      jurusan:      z.string().optional(),
      bidangMinat:  z.string().optional(),
      kota:         z.string().optional(),
      whatsapp:     z.string().optional(),
      phone:        z.string().optional(),
      minatKerja:   z.enum(["dalam_negeri","luar_negeri","keduanya"]).optional(),
      statusKerja:  z.enum(["belum_bekerja","sedang_bekerja","pernah_bekerja"]).optional(),
      sumberInfo:   z.string().optional(),
      igUsername:   z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { registrationId, ...updates } = input;
      const db = await getDb();
      await db.update(jobseekers)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(jobseekers.registrationId, registrationId));
      return { success: true };
    }),

  deleteJobseekerDocument: publicProcedure
    .input(z.object({
      registrationId: z.string(),
      type: z.enum(["foto","cv","ktm","sertifikat"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const fieldMap: Record<string, any> = {
        foto:       { fotoUrl: null },
        cv:         { cvUrl: null },
        ktm:        { ktmUrl: null },
        sertifikat: { sertifikatUrl: null },
      };
      await db.update(jobseekers)
        .set({ ...fieldMap[input.type], updatedAt: new Date() })
        .where(eq(jobseekers.registrationId, input.registrationId));
      return { success: true };
    }),

  getClosedBooths: publicProcedure.query(async () => {
    const cfg = await getEventConfig() as any;
    const raw = cfg?.closedBooths;
    if (!raw) return [] as string[];
    try {
      return JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw)) as string[];
    } catch {
      return [] as string[];
    }
  }),

  saveClosedBooths: publicProcedure
    .input(z.object({ closedBooths: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      const cfg = await getEventConfig() as any || {};
      await setEventConfig({
        ...cfg,
        closedBooths: JSON.stringify(input.closedBooths)
      });
      return { success: true };
    }),
});
