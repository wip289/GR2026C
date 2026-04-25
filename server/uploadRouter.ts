import express from "express";
import multer from "multer";
import path from "path";
import { getDb } from "./db";
import { jobseekers, employerBookings } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";

// ── Supabase client (server-side) ─────────────────────────────
const SUPABASE_URL      = process.env.SUPABASE_URL      || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const BUCKET            = "gr2026c";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

// ── Multer — simpan di memori, lalu upload ke Supabase ────────
const memStorage = multer.memoryStorage();

const upload = multer({
  storage: memStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg","image/png","image/jpg","image/webp","application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Format tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF."));
  },
});

const uploadLogo = multer({
  storage: memStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg","image/png","image/jpg","image/webp","application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Format tidak didukung. Gunakan PNG, JPG, atau PDF."));
  },
});

// ── Helper: upload buffer ke Supabase ─────────────────────────
async function uploadToSupabase(
  buffer: Buffer,
  folder: string,
  filename: string,
  mimetype: string
): Promise<string> {
  const filePath = `${folder}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      upsert:      true,
      contentType: mimetype,
    });

  if (error) throw new Error(`Supabase upload gagal: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

// ── Router ────────────────────────────────────────────────────
export const uploadRouter = express.Router();

function handleUpload(req: any, res: any, next: any) {
  upload.single("file")(req, res, (err: any) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE")
        res.status(400).json({ error: "File terlalu besar. Maksimal 20MB." });
      else
        res.status(400).json({ error: err.message || "Upload gagal" });
      return;
    }
    next();
  });
}

// POST /api/upload?registrationId=JS-xxx&type=foto
uploadRouter.post("/", handleUpload, async (req, res) => {
  if (!req.file) { res.status(400).json({ error: "Tidak ada file" }); return; }

  const regId    = (req.query.registrationId as string || "unknown").replace(/[^a-zA-Z0-9-]/g, "");
  const type     = (req.query.type as string) || "file";
  const ext      = path.extname(req.file.originalname).toLowerCase();
  const filename = `${type}${ext}`;

  try {
    const url = await uploadToSupabase(
      req.file.buffer,
      `jobseeker/${regId}`,
      filename,
      req.file.mimetype
    );
    res.json({ success: true, url, filename, size: req.file.size });
  } catch (err: any) {
    console.error("[upload] Supabase error:", err);
    res.status(500).json({ error: err.message || "Upload gagal" });
  }
});

// POST /api/upload/update-doc — simpan URL ke DB jobseeker
uploadRouter.post("/update-doc", express.json(), async (req, res) => {
  const { registrationId, type, url } = req.body;
  if (!registrationId || !type || !url) {
    res.json({ success: false, error: "Missing fields" }); return;
  }

  const fieldMap: Record<string, any> = {
    foto:       { fotoUrl: url },
    cv:         { cvUrl: url },
    ktm:        { ktmUrl: url },
    sertifikat: { sertifikatUrl: url },
  };

  if (!fieldMap[type]) { res.json({ success: false, error: "Invalid type" }); return; }

  try {
    const db = await getDb();
    await db.update(jobseekers).set(fieldMap[type]).where(eq(jobseekers.registrationId, registrationId));
    res.json({ success: true });
  } catch (err) {
    console.error("[update-doc]", err);
    res.json({ success: false });
  }
});

// POST /api/upload/employer-logo
uploadRouter.post("/employer-logo", (req, res, next) => {
  uploadLogo.single("file")(req, res, (err: any) => {
    if (err) { res.status(400).json({ error: err.message || "Upload gagal" }); return; }
    next();
  });
}, async (req, res) => {
  if (!req.file) { res.status(400).json({ error: "Tidak ada file" }); return; }

  const bookingId = (req.body.bookingId as string || "unknown").replace(/[^a-zA-Z0-9-]/g, "");
  const ext       = path.extname(req.file.originalname).toLowerCase();
  const filename  = `${bookingId}-logo${ext}`;

  try {
    const url = await uploadToSupabase(
      req.file.buffer,
      "employer-logos",
      filename,
      req.file.mimetype
    );
    res.json({ success: true, url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/upload/brand-logo — untuk Brand Template System
uploadRouter.post("/brand-logo", (req, res, next) => {
  uploadLogo.single("file")(req, res, (err: any) => {
    if (err) { res.status(400).json({ error: err.message }); return; }
    next();
  });
}, async (req, res) => {
  if (!req.file) { res.status(400).json({ error: "Tidak ada file" }); return; }

  const name    = (req.query.name as string || "logo").replace(/[^a-zA-Z0-9-]/g, "");
  const ext     = path.extname(req.file.originalname).toLowerCase();
  const filename = `${name}${ext}`;

  try {
    const url = await uploadToSupabase(
      req.file.buffer,
      "brand",
      filename,
      req.file.mimetype
    );
    res.json({ success: true, url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/upload/employer-print-info
uploadRouter.post("/employer-print-info", express.json(), async (req, res) => {
  const { bookingId, printName, logoUrl } = req.body;
  if (!bookingId || !printName) {
    res.status(400).json({ error: "bookingId dan printName wajib diisi" }); return;
  }
  try {
    const db = await getDb();
    await db.update(employerBookings)
      .set({ printName, logoUrl: logoUrl || null } as any)
      .where(eq(employerBookings.bookingId, bookingId));
    res.json({ success: true });
  } catch (err) {
    console.error("[employer-print-info]", err);
    res.status(500).json({ error: "Gagal menyimpan" });
  }
});




