import { z } from "zod";
import { getDb } from "./db";
import { jobseekers, sponsors, employerProspects, employerBookings, virtualPhaseEmployerConfig, virtualPhasePositions, virtualPhaseApplications } from "../drizzle/schema";
import { eq, and, inArray, desc, gte, lte, sql, ne } from "drizzle-orm";
import { protectedProcedure, publicProcedure, panitiaProcedure, router } from "./_core/trpc";
import { verifyPassword, issueToken, setPassword } from "./panitiaAuth";
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
        // ── Registration gate: tolak jika sudah lewat tanggal tutup (SuperAdmin config) ──
        const gateCfg = await getEventConfig() as any;
        if (gateCfg?.employerRegCloseDate) {
          const closeAt = new Date(`${gateCfg.employerRegCloseDate}T23:59:59+07:00`);
          if (new Date() > closeAt) {
            throw new TRPCError({ code: "FORBIDDEN", message: "REG_CLOSED" });
          }
        }

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
        exhibitorOrder: (booking as any).exhibitorOrder ?? null,
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

  // ── Staff ID Card ──────────────────────────────────────────────
  saveStaffList: publicProcedure
    .input(z.object({
      bookingId: z.string(),
      staffMembers: z.array(z.object({ nama: z.string(), posisi: z.string() })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(employerBookings)
        .set({ staffMembers: input.staffMembers })
        .where(eq(employerBookings.bookingId, input.bookingId));
      return { success: true };
    }),

  getStaffList: publicProcedure
    .input(z.object({ bookingId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [row] = await db.select({ staffMembers: employerBookings.staffMembers })
        .from(employerBookings)
        .where(eq(employerBookings.bookingId, input.bookingId));
      return { staffMembers: (row?.staffMembers as {nama:string;posisi:string}[] | null) ?? [] };
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
        // ── Registration gate: tolak jika sudah lewat tanggal tutup (SuperAdmin config) ──
        const gateCfg = await getEventConfig() as any;
        if (gateCfg?.jobseekerRegCloseDate) {
          const closeAt = new Date(`${gateCfg.jobseekerRegCloseDate}T23:59:59+07:00`);
          if (new Date() > closeAt) {
            throw new TRPCError({ code: "FORBIDDEN", message: "REG_CLOSED" });
          }
        }

        // Ambil eventId aktif dari config jika tidak dikirim dari form
        let resolvedEventId = input.eventId || null;
        if (!resolvedEventId) {
          const cfg = await getEventConfig() as any;
          resolvedEventId = cfg?.eventId || cfg?.id || null;
        }

        const db = await getDb();

        if (input.nik) {
          const existingNik = await db.select().from(jobseekers).where(eq(jobseekers.nik, input.nik));
          if (existingNik.length > 0) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "NIK kamu sudah terdaftar di sistem. Kemungkinan kamu sudah pernah mendaftar sebelumnya. Silakan login menggunakan Registration ID dan email yang kamu gunakan saat mendaftar. Butuh bantuan? Hubungi panitia GR2026 via WhatsApp.",
            });
          }
        }

        if (input.whatsapp) {
          const existingWa = await db.select().from(jobseekers).where(eq(jobseekers.whatsapp, input.whatsapp));
          if (existingWa.length > 0) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Nomor WhatsApp kamu sudah terdaftar di sistem. Kemungkinan kamu sudah pernah mendaftar sebelumnya. Silakan login menggunakan Registration ID dan email yang kamu gunakan saat mendaftar. Butuh bantuan? Hubungi panitia GR2026 via WhatsApp.",
            });
          }
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
        if (error instanceof TRPCError) throw error;
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

  // ── Absensi Check-In ─────────────────────────────────────────
  getJobseekerForAbsen: publicProcedure
    .input(z.object({ registrationId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [js] = await db.select().from(jobseekers).where(eq(jobseekers.registrationId, input.registrationId));
      if (!js) throw new TRPCError({ code: "NOT_FOUND", message: "Jobseeker tidak ditemukan" });
      return {
        registrationId:  js.registrationId,
        namaLengkap:     js.namaLengkap,
        institusi:       js.institusi || "",
        jurusan:         js.jurusan   || "",
        fotoUrl:         js.fotoUrl   || "",
        checkedInAt:     js.checkedInAt     ?? null,
        checkedInDay1At: js.checkedInDay1At ?? null,
        checkedInDay2At: js.checkedInDay2At ?? null,
      };
    }),

  checkInJobseeker: publicProcedure
    .input(z.object({ registrationId: z.string(), day: z.number().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [js] = await db.select().from(jobseekers).where(eq(jobseekers.registrationId, input.registrationId));
      if (!js) throw new TRPCError({ code: "NOT_FOUND", message: "Jobseeker tidak ditemukan" });

      // Gunakan day dari input jika ada, jika tidak auto-detect dari tanggal Jakarta
      let dayNum: number;
      if (input.day === 1 || input.day === 2) {
        dayNum = input.day;
      } else {
        const now2 = new Date();
        const jkt = new Date(now2.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
        dayNum = (jkt.getMonth() + 1 === 6 && jkt.getDate() === 9) ? 2 : 1;
      }

      const now = new Date();
      const jsData = { registrationId: js.registrationId, namaLengkap: js.namaLengkap, institusi: js.institusi || "", fotoUrl: js.fotoUrl || "" };

      if (dayNum === 1) {
        if (js.checkedInDay1At) return { alreadyCheckedIn: true, day: 1, checkedInAt: js.checkedInDay1At, jobseeker: jsData };
        await db.update(jobseekers).set({ checkedInDay1At: now }).where(eq(jobseekers.registrationId, input.registrationId));
        return { alreadyCheckedIn: false, day: 1, checkedInAt: now, jobseeker: jsData };
      } else {
        if (js.checkedInDay2At) return { alreadyCheckedIn: true, day: 2, checkedInAt: js.checkedInDay2At, jobseeker: jsData };
        await db.update(jobseekers).set({ checkedInDay2At: now }).where(eq(jobseekers.registrationId, input.registrationId));
        return { alreadyCheckedIn: false, day: 2, checkedInAt: now, jobseeker: jsData };
      }
    }),

  getAttendanceStats: publicProcedure
    .query(async () => {
      const db  = await getDb();
      const all = await db.select().from(jobseekers);
      const day1    = all.filter(j => j.checkedInDay1At).length;
      const day2    = all.filter(j => j.checkedInDay2At).length;
      const keduanya = all.filter(j => j.checkedInDay1At && j.checkedInDay2At).length;
      return { total: all.length, day1, day2, keduanya };
    }),

  resetAttendance: publicProcedure
    .mutation(async () => {
      const db = await getDb();
      await db.update(jobseekers).set({ checkedInDay1At: null, checkedInDay2At: null });
      return { success: true };
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
      const cfg = await getEventConfig();
      return Object.fromEntries(Object.entries(cfg).filter(([k]) => !k.startsWith("secret_")));
    }),

  saveEventConfig: publicProcedure
    .input(z.record(z.string(), z.string()))
    .mutation(async ({ input }) => {
      if (Object.keys(input).some(k => k.startsWith("secret_"))) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Key secret_* tidak bisa diubah lewat endpoint ini." });
      }
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
      namaLengkap:  z.string().optional(),
      nik:          z.string().optional(),
      institusi:    z.string().optional(),
      jurusan:      z.string().optional(),
      tahunLulus:   z.string().optional(),
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
      try {
        const { registrationId, ...updates } = input;
        const db = await getDb();

        if (input.whatsapp) {
          const existingWa = await db.select().from(jobseekers).where(eq(jobseekers.whatsapp, input.whatsapp));
          const conflict = existingWa.find(js => js.registrationId !== registrationId);
          if (conflict) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Nomor WhatsApp ini sudah digunakan oleh pendaftar lain. Silakan gunakan nomor WhatsApp yang berbeda atau hubungi panitia GR2026 via WhatsApp jika ada kendala.",
            });
          }
        }

        await db.update(jobseekers)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(jobseekers.registrationId, registrationId));
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Gagal memperbarui data jobseeker." });
      }
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
      await setEventConfig({
        closedBooths: JSON.stringify(input.closedBooths)
      });
      return { success: true };
    }),

  // ── Update Employer Profile ───────────────────────────────────
  updateEmployerProfile: publicProcedure
    .input(z.object({
      bookingId:     z.string(),
      companyName:   z.string().optional(),
      industry:      z.string().optional(),
      city:          z.string().optional(),
      website:       z.string().optional(),
      description:   z.string().optional(),
      pic1Name:      z.string().optional(),
      pic1Title:     z.string().optional(),
      pic1Whatsapp:  z.string().optional(),
      pic2Name:      z.string().optional(),
      pic2Title:     z.string().optional(),
      pic2Email:     z.string().optional(),
      pic2Whatsapp:  z.string().optional(),
      specialRequest: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { bookingId, ...updates } = input;
      await db.update(employerBookings)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(employerBookings.bookingId, bookingId));
      return { success: true };
    }),

  // ── Recruitment Positions ─────────────────────────────────────
  savePositions: publicProcedure
    .input(z.object({
      bookingId: z.string(),
      positions: z.array(z.object({
        posisi: z.string(),
        jumlah: z.string(),
        status: z.string(),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(employerBookings)
        .set({ positions: input.positions, updatedAt: new Date() })
        .where(eq(employerBookings.bookingId, input.bookingId));
      return { success: true };
    }),

  // ── Employer → lihat Jobseeker ────────────────────────────────
  getJobseekersForEmployer: publicProcedure
    .input(z.object({ bookingId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();

      const [employer] = await db.select()
        .from(employerBookings)
        .where(eq(employerBookings.bookingId, input.bookingId));

      if (!employer) throw new TRPCError({ code: "NOT_FOUND", message: "Booking tidak ditemukan" });

      // Layer 1: harus confirmed
      if (employer.status !== "confirmed") {
        throw new TRPCError({ code: "FORBIDDEN", message: "STATUS_NOT_CONFIRMED" });
      }

      // Layer 2: cek window akses
      const cfg = await getEventConfig() as any;
      const startStr = cfg?.jobseekerAccessStart;
      const endStr   = cfg?.jobseekerAccessEnd;
      if (startStr && endStr) {
        const now   = new Date();
        const start = new Date(startStr);
        const end   = new Date(endStr);
        if (now < start) throw new TRPCError({ code: "FORBIDDEN", message: "ACCESS_NOT_OPEN" });
        if (now > end)   throw new TRPCError({ code: "FORBIDDEN", message: "ACCESS_CLOSED" });
      }

      // Return jobseeker ber-consent1, tanpa field sensitif
      return db.select({
        registrationId: jobseekers.registrationId,
        namaLengkap:    jobseekers.namaLengkap,
        institusi:      jobseekers.institusi,
        jurusan:        jobseekers.jurusan,
        tahunLulus:     jobseekers.tahunLulus,
        kota:           jobseekers.kota,
        minatKerja:     jobseekers.minatKerja,
        bidangMinat:    jobseekers.bidangMinat,
        statusKerja:    jobseekers.statusKerja,
        status:         jobseekers.status,
        fotoUrl:        jobseekers.fotoUrl,
        cvUrl:          jobseekers.cvUrl,
      })
      .from(jobseekers)
      .where(eq(jobseekers.consent1, true));
    }),

  // ── Jobseeker → lihat Lowongan Employer ──────────────────────
  getVacanciesForJobseeker: publicProcedure
    .input(z.object({ registrationId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();

      const [js] = await db.select({ consent1: jobseekers.consent1 })
        .from(jobseekers)
        .where(eq(jobseekers.registrationId, input.registrationId));

      if (!js) throw new TRPCError({ code: "NOT_FOUND" });

      // Cek toggle lowongan dari SuperAdmin
      const cfg = await getEventConfig() as any;
      if (cfg?.lowonganOpen === "false") {
        throw new TRPCError({ code: "FORBIDDEN", message: "ACCESS_CLOSED" });
      }

      // Ambil employer confirmed yang sudah isi posisi & vacancies
      const employers = await db.select({
        bookingId:      employerBookings.bookingId,
        companyName:    employerBookings.companyName,
        industry:       employerBookings.industry,
        city:           employerBookings.city,
        website:        employerBookings.website,
        logoUrl:        employerBookings.logoUrl,
        positions:      employerBookings.positions,
        jobVacanciesUrl: employerBookings.jobVacanciesUrl,
      })
      .from(employerBookings)
      .where(eq(employerBookings.status, "confirmed"));

      // Filter: harus punya minimal 1 file vacancies (posisi tidak wajib untuk tampil ke jobseeker)
      return employers.filter(e => {
        const vac = Array.isArray(e.jobVacanciesUrl) ? e.jobVacanciesUrl
          : (typeof e.jobVacanciesUrl === "string" ? (() => { try { return JSON.parse(e.jobVacanciesUrl as string); } catch { return []; } })() : []);
        return (vac as any[]).length > 0;
      });
    }),

  // ─── PANITIA AUTH ────────────────────────────────────────────
  // Login panitia/admin: cek password di server, kasih token 12 jam.
  // Token dipakai via header x-panitia-token (lihat panitiaProcedure).

  verifyPanitiaPassword: publicProcedure
    .input(z.object({
      role: z.enum(["panitia", "admin"]),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const ok = await verifyPassword(input.role, input.password);
      if (!ok) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Password salah." });
      }
      const token = await issueToken(input.role);
      return { token, role: input.role };
    }),

  // Ganti password — hanya admin (SuperAdmin) yang boleh.
  setPanitiaPassword: panitiaProcedure
    .input(z.object({
      role: z.enum(["panitia", "admin"]),
      newPassword: z.string().min(8, "Password minimal 8 karakter"),
    }))
    .mutation(async ({ ctx, input }) => {
      if ((ctx as any).panitiaRole !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Hanya SuperAdmin yang bisa mengganti password." });
      }
      await setPassword(input.role, input.newPassword);
      return { success: true };
    }),

  // ─── VIRTUAL PHASE ───────────────────────────────────────────

  // Status periode virtual phase (publik — untuk banner countdown)
  getVirtualPhaseStatus: publicProcedure.query(async () => {
    const cfg = await getEventConfig();
    const now = new Date();
    const end = cfg.virtualPhaseEnd ? new Date(cfg.virtualPhaseEnd + "T23:59:59+07:00") : null;
    const expired = end ? now.getTime() > end.getTime() : false;
    return {
      isActive: cfg.virtualPhaseActive === "true" && !expired,
      startDate: cfg.virtualPhaseStart ?? null,
      endDate: cfg.virtualPhaseEnd ?? null,
      daysLeft: end ? Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000)) : null,
    };
  }),

  // Gallery publik: employer participating + posisi aktif + counter pelamar
  getVirtualGallery: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const configs = await db.select().from(virtualPhaseEmployerConfig)
      .where(eq(virtualPhaseEmployerConfig.isParticipating, true));
    const bookingIds = configs.map(c => c.employerBookingId);
    if (bookingIds.length === 0) return [];

    const employers = await db.select().from(employerBookings)
      .where(inArray(employerBookings.bookingId, bookingIds));

    const positions = await db.select().from(virtualPhasePositions)
      .where(and(
        inArray(virtualPhasePositions.employerBookingId, bookingIds),
        eq(virtualPhasePositions.isActive, true),
      ));

    const appCounts = await db.select({
      positionId: virtualPhaseApplications.positionId,
      count: sql<number>`count(*)`.as("count"),
    }).from(virtualPhaseApplications).groupBy(virtualPhaseApplications.positionId);
    const countMap = Object.fromEntries(appCounts.map(a => [a.positionId, Number(a.count)]));

    return employers.map(emp => {
      const cfg = configs.find(c => c.employerBookingId === emp.bookingId)!;
      return {
        bookingId: emp.bookingId,
        companyName: emp.companyName,
        industry: emp.industry,
        city: emp.city,
        logoUrl: emp.logoUrl,
        mechanism: cfg.mechanism,
        externalUrl: cfg.externalUrl,
        virtualPicName: cfg.virtualPicName,
        virtualPicWhatsapp: cfg.virtualPicWhatsapp,
        positions: positions
          .filter(p => p.employerBookingId === emp.bookingId)
          .map(p => ({
            id: p.id,
            positionName: p.positionName,
            headcount: p.headcount,
            location: p.location,
            requirements: p.requirements,
            applicantCount: countMap[p.id] ?? 0,
          })),
      };
    });
  }),

  // Jobseeker apply — identitas diverifikasi via registrationId + email (pola login existing)
  createVirtualApplication: publicProcedure
    .input(z.object({
      registrationId: z.string(),
      email: z.string().email(),
      positionId: z.number(),
      employerBookingId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // 1. Verifikasi identitas jobseeker (server-side, sama dengan login)
      const js = await getJobseekerByIdAndEmail(input.registrationId, input.email);
      if (!js) throw new TRPCError({ code: "UNAUTHORIZED", message: "Identitas tidak valid. Silakan login ulang." });

      // 2. Tier check dari DB, bukan dari frontend
      if (!js.fotoUrl || !js.cvUrl) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Upload CV terlebih dahulu untuk melamar." });
      }

      // 3. Cek periode masih aktif (toggle + end date)
      const cfg = await getEventConfig();
      const end = cfg.virtualPhaseEnd ? new Date(cfg.virtualPhaseEnd + "T23:59:59+07:00") : null;
      const expired = end ? Date.now() > end.getTime() : false;
      if (cfg.virtualPhaseActive !== "true" || expired) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Periode pendaftaran sudah berakhir." });
      }

      // 4. Posisi harus ada & aktif
      const [position] = await db.select().from(virtualPhasePositions)
        .where(and(
          eq(virtualPhasePositions.id, input.positionId),
          eq(virtualPhasePositions.isActive, true),
        )).limit(1);
      if (!position) throw new TRPCError({ code: "NOT_FOUND", message: "Posisi tidak ditemukan." });

      // 5. Mekanisme employer
      const [empCfg] = await db.select().from(virtualPhaseEmployerConfig)
        .where(eq(virtualPhaseEmployerConfig.employerBookingId, input.employerBookingId)).limit(1);

      // 6. Insert — unique constraint (jobseekerId, positionId) cegah double apply
      try {
        await db.insert(virtualPhaseApplications).values({
          jobseekerId: js.id,
          jobseekerRegId: js.registrationId,
          employerBookingId: input.employerBookingId,
          positionId: input.positionId,
          positionName: position.positionName,
          mechanism: empCfg?.mechanism ?? "A",
          status: "new",
        });
      } catch (e: any) {
        if (e?.code === "ER_DUP_ENTRY" || e?.cause?.code === "ER_DUP_ENTRY") {
          throw new TRPCError({ code: "CONFLICT", message: "Kamu sudah melamar posisi ini." });
        }
        throw e;
      }

      return {
        mechanism: empCfg?.mechanism ?? "A",
        externalUrl: empCfg?.externalUrl ?? null,
        virtualPicName: empCfg?.virtualPicName ?? null,
        virtualPicWhatsapp: empCfg?.virtualPicWhatsapp ?? null,
        positionName: position.positionName,
      };
    }),

  // Lamaran milik jobseeker (untuk dashboard jobseeker)
  getMyVirtualApplications: publicProcedure
    .input(z.object({ registrationId: z.string(), email: z.string().email() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const js = await getJobseekerByIdAndEmail(input.registrationId, input.email);
      if (!js) throw new TRPCError({ code: "UNAUTHORIZED", message: "Identitas tidak valid." });
      return db.select({
        id: virtualPhaseApplications.id,
        positionId: virtualPhaseApplications.positionId,
        positionName: virtualPhaseApplications.positionName,
        employerBookingId: virtualPhaseApplications.employerBookingId,
        mechanism: virtualPhaseApplications.mechanism,
        status: virtualPhaseApplications.status,
        createdAt: virtualPhaseApplications.createdAt,
      }).from(virtualPhaseApplications)
        .where(eq(virtualPhaseApplications.jobseekerId, js.id))
        .orderBy(desc(virtualPhaseApplications.createdAt));
    }),

  // Lamaran masuk per employer — identitas diverifikasi via bookingId + email
  getVirtualApplicationsByEmployer: publicProcedure
    .input(z.object({ bookingId: z.string(), email: z.string().email() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const emp = await getEmployerBookingByIdAndEmail(input.bookingId, input.email);
      if (!emp) throw new TRPCError({ code: "UNAUTHORIZED", message: "Identitas tidak valid." });
      return db.select({
        id: virtualPhaseApplications.id,
        positionId: virtualPhaseApplications.positionId,
        positionName: virtualPhaseApplications.positionName,
        status: virtualPhaseApplications.status,
        createdAt: virtualPhaseApplications.createdAt,
        namaLengkap: jobseekers.namaLengkap,
        institusi: jobseekers.institusi,
        jurusan: jobseekers.jurusan,
        tahunLulus: jobseekers.tahunLulus,
        kota: jobseekers.kota,
        whatsapp: jobseekers.whatsapp,
        fotoUrl: jobseekers.fotoUrl,
        cvUrl: jobseekers.cvUrl,
        minatKerja: jobseekers.minatKerja,
        bidangMinat: jobseekers.bidangMinat,
      }).from(virtualPhaseApplications)
        .innerJoin(jobseekers, eq(virtualPhaseApplications.jobseekerId, jobseekers.id))
        .where(and(
          eq(virtualPhaseApplications.employerBookingId, emp.bookingId),
          ne(virtualPhaseApplications.status, "deleted"), // disembunyikan dari employer, tetap tercatat untuk panitia
        ))
        .orderBy(desc(virtualPhaseApplications.createdAt));
    }),

  // Employer update status lamaran (new/viewed/contacted/not_relevant)
  updateVirtualApplicationStatus: publicProcedure
    .input(z.object({
      bookingId: z.string(),
      email: z.string().email(),
      applicationId: z.number(),
      status: z.enum(["new", "viewed", "contacted", "not_relevant", "deleted"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const emp = await getEmployerBookingByIdAndEmail(input.bookingId, input.email);
      if (!emp) throw new TRPCError({ code: "UNAUTHORIZED", message: "Identitas tidak valid." });
      await db.update(virtualPhaseApplications)
        .set({ status: input.status })
        .where(and(
          eq(virtualPhaseApplications.id, input.applicationId),
          eq(virtualPhaseApplications.employerBookingId, emp.bookingId),
        ));
      return { success: true };
    }),

  // Employer: config virtual phase milik sendiri (penentu tab "Lamaran Masuk" muncul/tidak)
  getMyVirtualConfig: publicProcedure
    .input(z.object({ bookingId: z.string(), email: z.string().email() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const emp = await getEmployerBookingByIdAndEmail(input.bookingId, input.email);
      if (!emp) throw new TRPCError({ code: "UNAUTHORIZED", message: "Identitas tidak valid." });
      const [cfg] = await db.select().from(virtualPhaseEmployerConfig)
        .where(eq(virtualPhaseEmployerConfig.employerBookingId, emp.bookingId)).limit(1);
      return {
        isParticipating: cfg?.isParticipating ?? false,
        mechanism: cfg?.mechanism ?? null,
      };
    }),

  // ── Panitia: kontrol global virtual phase (BUTUH TOKEN) ──────
  setVirtualPhaseConfig: panitiaProcedure
    .input(z.object({
      isActive: z.boolean(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }))
    .mutation(async ({ input }) => {
      const data: Record<string, string> = { virtualPhaseActive: String(input.isActive) };
      if (input.startDate) data.virtualPhaseStart = input.startDate;
      if (input.endDate) data.virtualPhaseEnd = input.endDate;
      await setEventConfig(data);
      return { success: true };
    }),

  // Panitia: config per employer (ikut/tidak, mekanisme, PIC)
  // Kosong ("") berarti HAPUS nilai di DB, bukan "jangan diubah".
  // Nomor WA dinormalisasi ke format internasional (08xx -> 628xx) agar link wa.me valid.
  setEmployerVirtualConfig: panitiaProcedure
    .input(z.object({
      employerBookingId: z.string(),
      isParticipating: z.boolean(),
      mechanism: z.enum(["A", "B", "C"]).or(z.literal("")).optional(),
      externalUrl: z.string().optional(),
      virtualPicName: z.string().optional(),
      virtualPicEmail: z.string().optional(),
      virtualPicWhatsapp: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const clean = (v?: string) => { const t = (v ?? "").trim(); return t === "" ? null : t; };
      const normalizeWa = (v?: string) => {
        let t = (v ?? "").replace(/[^\d+]/g, "");
        if (t.startsWith("+")) t = t.slice(1);
        if (t.startsWith("0")) t = "62" + t.slice(1);
        return t === "" ? null : t;
      };
      const vals = {
        isParticipating: input.isParticipating,
        mechanism: input.mechanism ? input.mechanism : null,
        externalUrl: clean(input.externalUrl),
        virtualPicName: clean(input.virtualPicName),
        virtualPicEmail: clean(input.virtualPicEmail),
        virtualPicWhatsapp: normalizeWa(input.virtualPicWhatsapp),
      };
      await db.insert(virtualPhaseEmployerConfig)
        .values({ employerBookingId: input.employerBookingId, ...vals })
        .onDuplicateKeyUpdate({ set: vals });
      return { success: true };
    }),

  // Panitia: replace semua posisi employer (soft-delete lama, insert baru)
  upsertVirtualPositions: panitiaProcedure
    .input(z.object({
      employerBookingId: z.string(),
      positions: z.array(z.object({
        positionName: z.string().min(1),
        headcount: z.number().min(1),
        location: z.string().min(1),
        requirements: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      await db.update(virtualPhasePositions)
        .set({ isActive: false })
        .where(eq(virtualPhasePositions.employerBookingId, input.employerBookingId));
      if (input.positions.length > 0) {
        await db.insert(virtualPhasePositions).values(
          input.positions.map(p => ({
            employerBookingId: input.employerBookingId,
            positionName: p.positionName,
            headcount: p.headcount,
            location: p.location,
            requirements: p.requirements ?? null,
            isActive: true,
          })),
        );
      }
      return { success: true };
    }),

  // Panitia: ambil posisi aktif satu employer (untuk panel edit — wajib load dulu sebelum upsert)
  getVirtualPositionsByEmployer: panitiaProcedure
    .input(z.object({ employerBookingId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      return db.select({
        id: virtualPhasePositions.id,
        positionName: virtualPhasePositions.positionName,
        headcount: virtualPhasePositions.headcount,
        location: virtualPhasePositions.location,
        requirements: virtualPhasePositions.requirements,
      }).from(virtualPhasePositions)
        .where(and(
          eq(virtualPhasePositions.employerBookingId, input.employerBookingId),
          eq(virtualPhasePositions.isActive, true),
        ));
    }),

  // Panitia: overview semua employer + status virtual phase
  getAllEmployerVirtualConfigs: panitiaProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const employers = await db.select({
      bookingId: employerBookings.bookingId,
      companyName: employerBookings.companyName,
      logoUrl: employerBookings.logoUrl,
    }).from(employerBookings).where(eq(employerBookings.status, "confirmed"));

    const configs = await db.select().from(virtualPhaseEmployerConfig);
    const positions = await db.select().from(virtualPhasePositions)
      .where(eq(virtualPhasePositions.isActive, true));
    const appStats = await db.select({
      employerBookingId: virtualPhaseApplications.employerBookingId,
      count: sql<number>`count(*)`.as("count"),
      newCount: sql<number>`SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END)`.as("newCount"),
    }).from(virtualPhaseApplications).groupBy(virtualPhaseApplications.employerBookingId);

    return employers.map(emp => {
      const cfg = configs.find(c => c.employerBookingId === emp.bookingId);
      const stats = appStats.find(a => a.employerBookingId === emp.bookingId);
      return {
        bookingId: emp.bookingId,
        companyName: emp.companyName,
        logoUrl: emp.logoUrl,
        isParticipating: cfg?.isParticipating ?? false,
        mechanism: cfg?.mechanism ?? null,
        virtualPicName: cfg?.virtualPicName ?? null,
        virtualPicEmail: cfg?.virtualPicEmail ?? null,
        virtualPicWhatsapp: cfg?.virtualPicWhatsapp ?? null,
        externalUrl: cfg?.externalUrl ?? null,
        positionCount: positions.filter(p => p.employerBookingId === emp.bookingId).length,
        totalApplicants: Number(stats?.count ?? 0),
        newApplicants: Number(stats?.newCount ?? 0),
      };
    });
  }),

  // Panitia: daily report (manual trigger). Resend belum dipasang — log dulu.
  triggerDailyReport: panitiaProcedure
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const targetDate = input.date ?? new Date(Date.now() + 7 * 3600000).toISOString().split("T")[0]; // WIB
      const startOfDay = new Date(targetDate + "T00:00:00+07:00");
      const endOfDay = new Date(targetDate + "T23:59:59+07:00");

      const todayApps = await db.select({
        employerBookingId: virtualPhaseApplications.employerBookingId,
        positionName: virtualPhaseApplications.positionName,
        namaLengkap: jobseekers.namaLengkap,
        institusi: jobseekers.institusi,
      }).from(virtualPhaseApplications)
        .innerJoin(jobseekers, eq(virtualPhaseApplications.jobseekerId, jobseekers.id))
        .where(and(
          gte(virtualPhaseApplications.createdAt, startOfDay),
          lte(virtualPhaseApplications.createdAt, endOfDay),
        ));
      if (todayApps.length === 0) return { sent: 0, totalApps: 0, message: "Tidak ada lamaran di tanggal ini." };

      const grouped: Record<string, typeof todayApps> = {};
      for (const a of todayApps) (grouped[a.employerBookingId] ??= []).push(a);

      const configs = await db.select().from(virtualPhaseEmployerConfig)
        .where(and(
          inArray(virtualPhaseEmployerConfig.employerBookingId, Object.keys(grouped)),
          eq(virtualPhaseEmployerConfig.mechanism, "A"),
          eq(virtualPhaseEmployerConfig.isParticipating, true),
        ));

      let sentCount = 0;
      for (const cfg of configs) {
        if (!cfg.virtualPicEmail) continue;
        const apps = grouped[cfg.employerBookingId] ?? [];
        if (apps.length === 0) continue;
        // TODO Fase 7: ganti console.log dengan Resend API call
        console.log(`[Daily Report ${targetDate}] -> ${cfg.virtualPicEmail}: ${apps.length} lamaran`);
        sentCount++;
      }
      return { sent: sentCount, totalApps: todayApps.length };
    }),


  // ─── VIRTUAL PHASE: REGISTRASI JOBSEEKER BARU (Fase 5) ─────────
  // Cek email terdaftar — ringan & aman: hanya jawab ada/tidak,
  // TIDAK menarik data jobseeker ke browser (pengganti pola getAllJobseekers di form lama).
  checkVirtualEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const rows = await db.select({ id: jobseekers.id }).from(jobseekers)
        .where(eq(jobseekers.email, input.email)).limit(1);
      return { exists: rows.length > 0 };
    }),

  // Pintu pendaftaran TERPISAH dari createJobseeker (yang sudah digembok REG_CLOSED pasca-event).
  // Gembok pintu ini: periode Virtual Phase (virtualPhaseActive + virtualPhaseEnd).
  createVirtualJobseeker: publicProcedure
    .input(z.object({
      registrationId: z.string(),
      namaLengkap: z.string().min(2),
      email: z.string().email(),
      whatsapp: z.string().optional(),
      phone: z.string().optional(),
      kota: z.string().optional(),
      institusi: z.string().optional(),
      jurusan: z.string().min(1),
      tahunLulus: z.string().min(1),
      minatKerja: z.enum(["dalam_negeri", "luar_negeri", "keduanya"]),
      statusKerja: z.enum(["belum_bekerja", "sedang_bekerja", "pernah_bekerja"]),
      sumberInfo: z.string().optional(),
      igUsername: z.string().optional(),
      consent1: z.literal(true), // wajib true — consent baru virtual phase
    }))
    .mutation(async ({ input }) => {
      try {
        // Gate: hanya saat virtual phase aktif & belum lewat tanggal tutup
        const cfg = await getEventConfig() as any;
        const now = new Date();
        const end = cfg?.virtualPhaseEnd ? new Date(cfg.virtualPhaseEnd + "T23:59:59+07:00") : null;
        const expired = end ? now.getTime() > end.getTime() : false;
        if (cfg?.virtualPhaseActive !== "true" || expired) {
          throw new TRPCError({ code: "FORBIDDEN", message: "VP_CLOSED" });
        }

        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const dupEmail = await db.select({ id: jobseekers.id }).from(jobseekers)
          .where(eq(jobseekers.email, input.email)).limit(1);
        if (dupEmail.length > 0) {
          throw new TRPCError({ code: "CONFLICT", message: "Email kamu sudah terdaftar di GR2026. Silakan langsung Masuk di halaman lowongan — tidak perlu daftar ulang." });
        }
        if (input.whatsapp) {
          const dupWa = await db.select({ id: jobseekers.id }).from(jobseekers)
            .where(eq(jobseekers.whatsapp, input.whatsapp)).limit(1);
          if (dupWa.length > 0) {
            throw new TRPCError({ code: "CONFLICT", message: "Nomor WhatsApp kamu sudah terdaftar di GR2026. Silakan langsung Masuk di halaman lowongan." });
          }
        }

        await createJobseeker({
          registrationId: input.registrationId,
          eventId: cfg?.eventId || cfg?.id || null,
          namaLengkap: input.namaLengkap,
          nik: "",
          whatsapp: input.whatsapp || "",
          email: input.email,
          kota: input.kota || null,
          status: input.statusKerja,
          institusi: input.institusi || null,
          jurusan: input.jurusan,
          tahunLulus: input.tahunLulus,
          phone: input.phone || null,
          minatKerja: input.minatKerja,
          statusKerja: input.statusKerja,
          sumberInfo: input.sumberInfo || null,
          igUsername: input.igUsername || null,
          consent1: true,
          consent2: false,
          consent1At: new Date(),
          consent2At: null,
          registrationSource: "virtual_phase",
        });
        return { success: true };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        console.error("[createVirtualJobseeker] DETAIL:", error?.message, error?.code);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Gagal menyimpan: ${error?.message || error}` });
      }
    }),

});
