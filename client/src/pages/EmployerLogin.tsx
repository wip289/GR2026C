import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const s = {
  page:  { minHeight: "100vh", background: "#0a1628", fontFamily: "system-ui, sans-serif", color: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" } as React.CSSProperties,
  card:  { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 20, padding: "2.5rem", maxWidth: 520, width: "100%" },
  label: { display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.4rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  input: { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "0.75rem 1rem", fontSize: "0.95rem", color: "#f1f5f9", outline: "none" },
  btn:   { background: "linear-gradient(135deg, #0d9488, #14b8a6)", border: "none", color: "#fff", borderRadius: 12, padding: "0.9rem", fontSize: "1rem", fontWeight: 700, cursor: "pointer", width: "100%" },
  hint:  { fontSize: "0.78rem", color: "#475569", marginTop: "0.35rem", lineHeight: 1.5 },
  hintOk: { fontSize: "0.78rem", color: "#10b981", marginTop: "0.35rem", lineHeight: 1.5 },
  hintErr: { fontSize: "0.78rem", color: "#ef4444", marginTop: "0.35rem", lineHeight: 1.5 },
  divider: { borderTop: "1px solid rgba(255,255,255,0.08)", margin: "1.75rem 0" },
  sectionTitle: { fontSize: "0.95rem", fontWeight: 700, color: "#14b8a6", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" } as React.CSSProperties,
};

type LogoStatus = "idle" | "checking" | "ok" | "error";

export default function EmployerLogin() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<"login" | "upload">("login");

  // Step 1 — Login
  const [bookingId, setBookingId] = useState("");
  const [email, setEmail]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [companyName, setCompanyName] = useState("");

  // Step 2 — Logo & print name
  const [namaCetak, setNamaCetak]   = useState("");
  const [logoFile, setLogoFile]     = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoStatus, setLogoStatus] = useState<LogoStatus>("idle");
  const [logoMsg, setLogoMsg]       = useState("");
  const [uploading, setUploading]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loginQuery = trpc.event.loginEmployer.useQuery(
    { bookingId: bookingId.trim().toUpperCase(), email: email.trim().toLowerCase() },
    { enabled: false, retry: false }
  );

  // ── Step 1: Login ──────────────────────────────────────────────
  const handleLogin = async () => {
    if (!bookingId.trim() || !email.trim()) {
      toast.error("Isi Booking ID dan Email terlebih dahulu");
      return;
    }
    setLoading(true);
    try {
      const result = await loginQuery.refetch();
      if (!result.data) {
        toast.error("Booking ID atau Email tidak sesuai", {
          description: "Pastikan Booking ID dan email sama dengan saat pendaftaran"
        });
        setLoading(false);
        return;
      }
      const data = result.data as any;
      setCompanyName(data.companyName || "");
      setNamaCetak(data.printName || data.companyName || "");

      // Langsung ke dashboard (upload logo ada di dashboard)
      localStorage.setItem("employer_session", JSON.stringify({
        bookingId: bookingId.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
      }));
      toast.success(`Selamat datang, ${data.companyName}!`);
      navigate("/employer/dashboard");
    } catch {
      toast.error("Terjadi kesalahan, coba lagi");
    }
    setLoading(false);
  };

  // ── Logo validation ────────────────────────────────────────────
  const handleLogoChange = async (file: File) => {
    setLogoFile(file);
    setLogoStatus("checking");
    setLogoMsg("Memeriksa file...");

    const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setLogoStatus("error");
      setLogoMsg("❌ Format tidak didukung. Gunakan PNG, JPG, atau PDF.");
      return;
    }

    // PDF — skip resolusi check
    if (file.type === "application/pdf") {
      const preview = URL.createObjectURL(file);
      setLogoPreview(null);
      setLogoStatus("ok");
      setLogoMsg("✅ File PDF diterima. Pastikan logo resolusi tinggi di dalam PDF.");
      return;
    }

    // PNG/JPG — terima semua resolusi
    const previewUrl = URL.createObjectURL(file);
    setLogoStatus("ok");
    setLogoMsg("✅ Logo diterima. Mohon kirimkan logo dengan resolusi yang cukup untuk kebutuhan cetak dan display.");
    setLogoPreview(previewUrl);
  };

  // ── Step 2: Upload logo & simpan nama cetak ───────────────────
  const handleSubmitUpload = async () => {
    if (!namaCetak.trim()) {
      toast.error("Nama perusahaan untuk cetak wajib diisi");
      return;
    }
    if (!logoFile) {
      toast.error("Logo wajib diupload");
      return;
    }
    if (logoStatus !== "ok") {
      toast.error("Perbaiki logo terlebih dahulu");
      return;
    }

    setUploading(true);
    try {
      // Upload logo
      const formData = new FormData();
      formData.append("file", logoFile);
      formData.append("bookingId", bookingId.trim().toUpperCase());
      formData.append("type", "logo");

      const res = await fetch("/api/upload/employer-logo", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload gagal");
      const { url: logoUrl } = await res.json();

      // Simpan nama cetak
      await fetch("/api/upload/employer-print-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingId.trim().toUpperCase(),
          printName: namaCetak.trim(),
          logoUrl,
        }),
      });

      localStorage.setItem("employer_session", JSON.stringify({
        bookingId: bookingId.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
      }));

      toast.success("Logo & nama perusahaan berhasil disimpan!");
      navigate("/employer/dashboard");
    } catch {
      toast.error("Upload gagal, coba lagi");
    }
    setUploading(false);
  };

  // ── Skip upload (isi nanti) ────────────────────────────────────
  const handleSkip = () => {
    localStorage.setItem("employer_session", JSON.stringify({
      bookingId: bookingId.trim().toUpperCase(),
      email: email.trim().toLowerCase(),
    }));
    toast.success(`Selamat datang, ${companyName}!`);
    navigate("/employer/dashboard");
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER — STEP 1: LOGIN
  // ═══════════════════════════════════════════════════════════════
  if (step === "login") return (
    <div style={s.page}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 48, marginBottom: "1rem" }} />
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            Login <span style={{ color: "#14b8a6" }}>Employer</span>
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
            Masuk untuk melihat status booking dan dashboard Anda
          </p>
        </div>

        <div style={s.card}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={s.label}>Booking ID <span style={{ color: "#ef4444" }}>*</span></label>
            <input style={s.input} value={bookingId}
              onChange={e => setBookingId(e.target.value)}
              placeholder="Contoh: GR2026-260407-WAN7"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
            <p style={s.hint}>Booking ID ada di invoice yang Anda download saat pendaftaran</p>
          </div>

          <div style={{ marginBottom: "1.75rem" }}>
            <label style={s.label}>Email <span style={{ color: "#ef4444" }}>*</span></label>
            <input style={s.input} type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email PIC yang digunakan saat mendaftar"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
            <p style={s.hint}>Gunakan email PIC 1 yang sama dengan saat pendaftaran</p>
          </div>

          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
            {loading ? "Memverifikasi..." : "Masuk ke Dashboard →"}
          </button>

          <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.15)", borderRadius: 10 }}>
            <p style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.6 }}>
              💡 <strong style={{ color: "#f1f5f9" }}>Belum punya Booking ID?</strong><br/>
              Daftarkan perusahaan Anda terlebih dahulu dan download invoice untuk mendapatkan Booking ID.
            </p>
            <button onClick={() => navigate("/employer/register")}
              style={{ marginTop: "0.75rem", background: "transparent", border: "1px solid rgba(20,184,166,0.3)", color: "#14b8a6", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
              Daftar Sekarang →
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "0.85rem" }}>
            ← Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // RENDER — STEP 2: UPLOAD LOGO & NAMA CETAK
  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={s.page}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 48, marginBottom: "1rem" }} />
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.4rem" }}>
            Kelengkapan <span style={{ color: "#14b8a6" }}>Data Booth</span>
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
            Data ini digunakan untuk keperluan <strong style={{ color: "#f1f5f9" }}>pencetakan backdrop booth</strong> dan materi promosi GR2026
          </p>
        </div>

        <div style={s.card}>

          {/* Info banner */}
          <div style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.25)", borderRadius: 10, padding: "0.9rem 1.1rem", marginBottom: "1.75rem" }}>
            <p style={{ fontSize: "0.82rem", color: "#D4A017", fontWeight: 700, marginBottom: "0.25rem" }}>⚠️ Perhatian</p>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.6 }}>
              Logo dan nama perusahaan yang Anda submit akan langsung digunakan oleh vendor untuk mencetak backdrop booth. Pastikan data sudah benar sebelum submit.
            </p>
          </div>

          {/* Nama perusahaan untuk cetak */}
          <div style={s.sectionTitle}>🏢 Nama Perusahaan untuk Cetak</div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={s.label}>Nama Resmi <span style={{ color: "#ef4444" }}>*</span></label>
            <input style={s.input} value={namaCetak}
              onChange={e => setNamaCetak(e.target.value)}
              placeholder="Contoh: PT Santika Indonesia Hotels & Resorts"
            />
            <p style={s.hint}>
              Nama ini akan dicetak di backdrop booth Anda. Gunakan nama resmi lengkap perusahaan.<br/>
              <span style={{ color: "#64748b" }}>Nama saat daftar: <strong style={{ color: "#94a3b8" }}>{companyName}</strong></span>
            </p>
          </div>

          <div style={s.divider} />

          {/* Upload logo */}
          <div style={s.sectionTitle}>🎨 Logo Perusahaan</div>

          <div style={{ marginBottom: "1rem" }}>
            <div style={{
              border: `2px dashed ${logoStatus === "ok" ? "rgba(16,185,129,0.5)" : logoStatus === "error" ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.15)"}`,
              borderRadius: 12, padding: "1.5rem", textAlign: "center", cursor: "pointer",
              background: logoStatus === "ok" ? "rgba(16,185,129,0.04)" : logoStatus === "error" ? "rgba(239,68,68,0.04)" : "rgba(255,255,255,0.02)",
              transition: "all 0.2s",
            }} onClick={() => fileRef.current?.click()}>
              {logoPreview ? (
                <img src={logoPreview} alt="Preview" style={{ maxHeight: 100, maxWidth: "100%", objectFit: "contain", marginBottom: "0.75rem" }} />
              ) : (
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🖼️</div>
              )}
              <p style={{ fontSize: "0.88rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                {logoFile ? logoFile.name : "Klik untuk pilih file logo"}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#64748b" }}>PNG / JPG / PDF</p>
            </div>
            <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.pdf"
              style={{ display: "none" }}
              onChange={e => e.target.files?.[0] && handleLogoChange(e.target.files[0])}
            />

            {logoMsg && (
              <p style={logoStatus === "ok" ? s.hintOk : logoStatus === "error" ? s.hintErr : s.hint}>
                {logoMsg}
              </p>
            )}
            {logoStatus === "error" && (
              <p style={{ ...s.hint, marginTop: "0.5rem" }}>
                💡 Mohon kirimkan logo dengan resolusi yang cukup untuk kebutuhan cetak dan display.
              </p>
            )}
          </div>

          <div style={s.divider} />

          {/* Actions */}
          <button
            style={{ ...s.btn, opacity: uploading || logoStatus === "error" || logoStatus === "checking" ? 0.7 : 1, marginBottom: "0.75rem" }}
            onClick={handleSubmitUpload}
            disabled={uploading || logoStatus === "error" || logoStatus === "checking"}
          >
            {uploading ? "Mengupload..." : "✅ Simpan & Masuk ke Dashboard →"}
          </button>

          <button onClick={handleSkip}
            style={{ width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", borderRadius: 12, padding: "0.75rem", fontSize: "0.88rem", cursor: "pointer" }}>
            Lewati dulu, isi nanti →
          </button>

          <p style={{ ...s.hint, textAlign: "center", marginTop: "0.75rem" }}>
            ⚠️ Data logo dan nama cetak wajib dilengkapi sebelum <strong>1 Juni 2026</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
