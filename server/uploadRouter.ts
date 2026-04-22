import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { getDb } from "./db";
import { jobseekers, employerBookings } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Upload directory ──────────────────────────────────────────
const UPLOAD_DIR = path.resolve(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Multer storage — per jobseeker folder ─────────────────────
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const regId = (req.query.registrationId as string) || "unknown";
    const safeId = regId.replace(/[^a-zA-Z0-9-]/g, "");
    const dest = path.join(UPLOAD_DIR, safeId);
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const type = (_req.query.type as string) || "file";
    const ext  = path.extname(file.originalname).toLowerCase();
    cb(null, `${type}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg", "image/png", "image/jpg",
      "image/webp", "application/pdf",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Format tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF."));
    }
  },
});

// ── Router ────────────────────────────────────────────────────
export const uploadRouter = express.Router();

// Serve uploaded files statically
uploadRouter.use("/files", express.static(UPLOAD_DIR));

// Handle multer errors (file too large, wrong format)
function handleUpload(req: any, res: any, next: any) {
  upload.single("file")(req, res, (err: any) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "File terlalu besar. Maksimal 20MB." });
      } else {
        res.status(400).json({ error: err.message || "Upload gagal" });
      }
      return;
    }
    next();
  });
}

// POST /api/upload?registrationId=JS-WISNU-NHI-24-26-001&type=foto
uploadRouter.post("/", handleUpload, (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Tidak ada file yang diupload" });
    return;
  }

  const regId   = (req.query.registrationId as string) || "unknown";
  const safeId  = regId.replace(/[^a-zA-Z0-9-]/g, "");
  const type    = (req.query.type as string) || "file";
  const ext     = path.extname(req.file.originalname).toLowerCase();
  const filename = `${type}${ext}`;
  const fileUrl  = `/api/upload/files/${safeId}/${filename}`;

  res.json({
    success: true,
    url: fileUrl,
    filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

// POST /api/upload/update-doc — save doc URL to DB
uploadRouter.post("/update-doc", express.json(), async (req, res) => {
  const { registrationId, type, url } = req.body;

  if (!registrationId || !type || !url) {
    res.json({ success: false, error: "Missing fields" });
    return;
  }

  const fieldMap: Record<string, Record<string, string>> = {
    foto:       { fotoUrl: url },
    cv:         { cvUrl: url },
    ktm:        { ktmUrl: url },
    sertifikat: { sertifikatUrl: url },
  };

  const updateData = fieldMap[type];
  if (!updateData) {
    res.json({ success: false, error: "Invalid type" });
    return;
  }

  try {
    const db = await getDb();
    await db.update(jobseekers)
      .set(updateData)
      .where(eq(jobseekers.registrationId, registrationId));
    res.json({ success: true });
  } catch (err) {
    console.error("[update-doc] Error:", err);
    res.json({ success: false });
  }
});

// DELETE /api/upload/files/:regId/:filename
uploadRouter.delete("/files/:regId/:filename", (req, res) => {
  const { regId, filename } = req.params;
  const filePath = path.join(UPLOAD_DIR, regId, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "File tidak ditemukan" });
  }
});

// ── Employer Logo Storage ─────────────────────────────────────
const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dest = path.join(UPLOAD_DIR, "employer-logos");
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const bookingId = (req.body.bookingId as string || "unknown").replace(/[^a-zA-Z0-9-]/g, "");
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${bookingId}-logo${ext}`);
  },
});

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for high-res logos
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Format tidak didukung. Gunakan PNG, JPG, atau PDF."));
    }
  },
});

// POST /api/upload/employer-logo
uploadRouter.post("/employer-logo", (req, res, next) => {
  uploadLogo.single("file")(req, res, (err: any) => {
    if (err) {
      res.status(400).json({ error: err.message || "Upload gagal" });
      return;
    }
    next();
  });
}, (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Tidak ada file yang diupload" });
    return;
  }
  const bookingId = (req.body.bookingId as string || "unknown").replace(/[^a-zA-Z0-9-]/g, "");
  const ext = path.extname(req.file.originalname).toLowerCase();
  const filename = `${bookingId}-logo${ext}`;
  const fileUrl = `/api/upload/files/employer-logos/${filename}`;

  res.json({ success: true, url: fileUrl });
});

// POST /api/employer/update-print-info — save printName & logoUrl to DB
uploadRouter.post("/employer-print-info", express.json(), async (req, res) => {
  const { bookingId, printName, logoUrl } = req.body;

  if (!bookingId || !printName) {
    res.status(400).json({ error: "bookingId dan printName wajib diisi" });
    return;
  }

  try {
    const db = await getDb();
    await db.update(employerBookings)
      .set({
        printName: printName,
        logoUrl: logoUrl || null,
      } as any)
      .where(eq(employerBookings.bookingId, bookingId));
    res.json({ success: true });
  } catch (err) {
    console.error("[update-print-info] Error:", err);
    res.status(500).json({ error: "Gagal menyimpan data" });
  }
});
