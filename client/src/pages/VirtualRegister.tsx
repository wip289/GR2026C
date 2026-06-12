import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { generateJobseekerId } from "@/lib/invoiceGenerator";
import { supabase, BUCKET } from "@/lib/supabase";

// ── Konstanta ─────────────────────────────────────────────────
// URL template CV (file di Supabase assets). Kosongkan kalau belum ada → link otomatis disembunyikan.
const CV_TEMPLATE_URL = "";

const SUMBER_OPTIONS = [
  { val: "instagram",  label: "📸 Instagram",     hasIG: true  },
  { val: "tiktok",     label: "🎵 TikTok",         hasIG: false },
  { val: "teman",      label: "👥 Teman/Keluarga", hasIG: false },
  { val: "kampus",     label: "🏫 Kampus/Dosen",   hasIG: false },
  { val: "poster",     label: "🪧 Poster/Brosur",  hasIG: false },
  { val: "website",    label: "🌐 Website",         hasIG: false },
  { val: "lainnya",    label: "💬 Lainnya",         hasIG: false },
];

const MINAT_OPTIONS = [
  { val: "dalam_negeri", label: "🇮🇩 Dalam Negeri" },
  { val: "luar_negeri",  label: "✈️ Luar Negeri"  },
  { val: "keduanya",     label: "🌏 Keduanya"      },
];

const STATUS_OPTIONS = [
  { val: "belum_bekerja",  label: "🔍 Belum Bekerja"  },
  { val: "sedang_bekerja", label: "💼 Sedang Bekerja"  },
  { val: "pernah_bekerja", label: "📋 Pernah Bekerja" },
];

const YEARS = Array.from({ length: 15 }, (_, i) => String(2026 - i));

// ── Styles (konsisten dengan JobseekerRegister) ───────────────
const css = {
  page:  { minHeight: "100vh", background: "#0a1628", fontFamily: "system-ui, sans-serif", color: "#f1f5f9" } as React.CSSProperties,
  nav:   { background: "rgba(10,22,40,0.97)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(212,160,23,0.15)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky" as const, top: 0, zIndex: 50 },
  wrap:  { maxWidth: 560, margin: "0 auto", padding: "2rem 1.25rem 5rem" },
  label: { display: "block", fontSize: "0.73rem", fontWeight: 600, color: "#64748b", marginBottom: "0.4rem", textTransform: "uppercase" as const, letterSpacing: "0.07em" },
  input: { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0.8rem 1rem", fontSize: "0.95rem", color: "#f1f5f9", outline: "none", boxSizing: "border-box" as const },
  select:{ width: "100%", background: "#0c1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0.8rem 1rem", fontSize: "0.95rem", color: "#f1f5f9", outline: "none" },
  row2:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" } as React.CSSProperties,
  hint:  { fontSize: "0.7rem", color: "#334155", marginTop: "0.3rem" },
  btnPri:{ background: "linear-gradient(135deg, #D4A017, #B8860B)", border: "none", color: "#fff", borderRadius: 12, padding: "0.95rem 2rem", fontSize: "1rem", fontWeight: 700, cursor: "pointer", width: "100%" } as React.CSSProperties,
  btnGhost:{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "#64748b", borderRadius: 12, padding: "0.95rem 2rem", fontSize: "1rem", fontWeight: 700, cursor: "pointer", width: "100%" } as React.CSSProperties,
  req:   { color: "#ef4444" },
  card:  { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.75rem", marginBottom: "1.25rem" },
};

// ── Chip selector ─────────────────────────────────────────────
function ChipGroup({ options, value, onChange, color = "#D4A017" }: {
  options: { val: string; label: string }[];
  value: string; onChange: (v: string) => void; color?: string;
}) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      {options.map(o => (
        <button key={o.val} type="button" onClick={() => onChange(o.val)} style={{
          padding: "0.5rem 1rem", borderRadius: 20, fontSize: "0.82rem", fontWeight: 600,
          border: `1.5px solid ${value === o.val ? color : "rgba(255,255,255,0.1)"}`,
          background: value === o.val ? `${color}18` : "transparent",
          color: value === o.val ? color : "#64748b", cursor: "pointer", transition: "all 0.15s",
        }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Kompresi foto (standar platform: JPEG 82%, max 800px) ────
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        const scale = MAX / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas tidak tersedia"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        b => (b ? resolve(b) : reject(new Error("Kompresi gagal"))),
        "image/jpeg", 0.82
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("File bukan gambar valid")); };
    img.src = url;
  });
}

// ── Main ──────────────────────────────────────────────────────
export default function VirtualRegister() {
  const [, navigate] = useLocation();
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef   = useRef<HTMLInputElement>(null);

  // ── Gate: status virtual phase ──
  const phaseQuery = trpc.event.getVirtualPhaseStatus.useQuery();
  const phase = phaseQuery.data;
  const phaseEnded = !!phase && !phase.isActive && !!phase.endDate &&
    new Date() > new Date(phase.endDate + "T23:59:59+07:00");

  // ── Step: form → cv → done ──
  const [step, setStep] = useState<"form" | "cv" | "done">("form");

  // Form state
  const [nama,        setNama]        = useState("");
  const [email,       setEmail]       = useState("");
  const [phone,       setPhone]       = useState("");
  const [kota,        setKota]        = useState("");
  const [minat,       setMinat]       = useState("");
  const [statusKerja, setStatusKerja] = useState("");
  const [tahunLulus,  setTahunLulus]  = useState("");
  const [jurusan,     setJurusan]     = useState("");
  const [institusi,   setInstitusi]   = useState("");
  const [sumber,      setSumber]      = useState("");
  const [igUser,      setIgUser]      = useState("");
  const [consent,     setConsent]     = useState(false);

  // Foto (WAJIB sebelum submit)
  const [fotoFile,    setFotoFile]    = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  // UI state
  const [emailErr,   setEmailErr]   = useState("");
  const [checking,   setChecking]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finalId,    setFinalId]    = useState("");
  const [fotoOk,     setFotoOk]     = useState(false);   // foto sudah terupload ke server?
  const [retryFoto,  setRetryFoto]  = useState(false);   // upload foto gagal → tawarkan ulang

  // CV step
  const [cvFile,      setCvFile]      = useState<File | null>(null);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [cvOk,        setCvOk]        = useState(false);
  const [showSkipCv,  setShowSkipCv]  = useState(false); // modal "yakin ga mau upload CV?"

  // ── Cek email (aman: server hanya jawab ada/tidak) ──
  const emailCheckQuery = trpc.event.checkVirtualEmail.useQuery(
    { email }, { enabled: false, retry: false }
  );
  const checkEmail = async (val: string) => {
    if (!val || !val.includes("@")) return;
    setChecking(true); setEmailErr("");
    try {
      const res = await emailCheckQuery.refetch();
      if (res.data?.exists) setEmailErr("Email ini sudah terdaftar di GR2026. Langsung Masuk saja di halaman lowongan.");
    } catch {}
    setChecking(false);
  };

  const createMutation = trpc.event.createVirtualJobseeker.useMutation();

  const canSubmit = nama.trim().length > 1
    && email.includes("@") && !emailErr && !checking
    && minat && statusKerja && tahunLulus && jurusan && sumber
    && !!fotoFile && consent
    && !submitting;

  // ── Upload foto ke Supabase + simpan URL ──
  const uploadFoto = async (registrationId: string): Promise<boolean> => {
    if (!fotoFile) return false;
    try {
      const compressed = await compressImage(fotoFile);
      const path = `jobseeker/${registrationId}/foto.jpg`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, compressed, { upsert: true, contentType: "image/jpeg" });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      await fetch("/api/upload/update-doc", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, type: "foto", url: data.publicUrl }),
      });
      return true;
    } catch (err: any) {
      console.error("[foto upload]", err);
      return false;
    }
  };

  // ── Upload CV ke Supabase + simpan URL ──
  const uploadCv = async (): Promise<boolean> => {
    if (!cvFile || !finalId) return false;
    try {
      const path = `jobseeker/${finalId}/cv.pdf`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, cvFile, { upsert: true, contentType: "application/pdf" });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      await fetch("/api/upload/update-doc", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: finalId, type: "cv", url: data.publicUrl }),
      });
      return true;
    } catch (err: any) {
      console.error("[cv upload]", err);
      return false;
    }
  };

  // ── Submit utama ──
  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const id = generateJobseekerId({
      namaLengkap: nama, institusi: institusi || "",
      tahunLulus, isAlumniNHI: institusi.toLowerCase().includes("nhi"),
    });
    try {
      await createMutation.mutateAsync({
        registrationId: id, namaLengkap: nama, email,
        whatsapp: phone || undefined,
        phone:    phone || undefined,
        kota:     kota  || undefined,
        institusi: institusi || undefined,
        jurusan, tahunLulus,
        minatKerja:  minat as any,
        statusKerja: statusKerja as any,
        sumberInfo:  sumber || undefined,
        igUsername:  igUser || undefined,
        consent1: true,
      });
    } catch (err: any) {
      const msg = err?.message === "VP_CLOSED"
        ? "Periode pendaftaran Virtual Phase sudah ditutup."
        : err?.message || "Coba lagi sebentar lagi.";
      toast.error("Gagal mendaftar", { description: msg });
      setSubmitting(false);
      return;
    }

    setFinalId(id);
    // Auto-login: simpan session supaya langsung bisa Kirim CV di gallery
    try { localStorage.setItem("jobseeker_session", JSON.stringify({ registrationId: id, email })); } catch {}

    toast.loading("Mengupload foto...", { id: "foto" });
    const ok = await uploadFoto(id);
    if (ok) {
      setFotoOk(true);
      toast.success("Foto berhasil diupload!", { id: "foto" });
      setStep("cv");
    } else {
      toast.error("Pendaftaran berhasil, tapi upload foto gagal. Coba upload ulang ya.", { id: "foto" });
      setRetryFoto(true);
    }
    setSubmitting(false);
  };

  // ── Retry foto (kalau upload pertama gagal) ──
  const handleRetryFoto = async () => {
    setSubmitting(true);
    toast.loading("Mengupload foto...", { id: "foto" });
    const ok = await uploadFoto(finalId);
    if (ok) {
      setFotoOk(true); setRetryFoto(false);
      toast.success("Foto berhasil diupload!", { id: "foto" });
      setStep("cv");
    } else {
      toast.error("Masih gagal. Cek koneksi internet kamu, lalu coba lagi.", { id: "foto" });
    }
    setSubmitting(false);
  };

  // ── CV step actions ──
  const handleUploadCv = async () => {
    if (!cvFile) return;
    setUploadingCv(true);
    toast.loading("Mengupload CV...", { id: "cv" });
    const ok = await uploadCv();
    if (ok) {
      setCvOk(true);
      toast.success("CV berhasil diupload! Kamu sudah bisa melamar 🎉", { id: "cv" });
      setStep("done");
    } else {
      toast.error("Upload CV gagal. Coba lagi, atau lewati dulu — bisa diupload nanti.", { id: "cv" });
    }
    setUploadingCv(false);
  };

  const sumberHasIG = SUMBER_OPTIONS.find(s => s.val === sumber)?.hasIG;

  // ── GATE: virtual phase belum aktif / sudah berakhir ──────────
  if (phase && !phase.isActive && step === "form") {
    return (
      <div style={{ ...css.page, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.25rem" }}>
        <div style={{ maxWidth: 460, width: "100%", textAlign: "center" }}>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 44, marginBottom: "1.5rem" }}/>
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>{phaseEnded ? "🙏" : "⏳"}</div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: "0 0 0.75rem" }}>
            {phaseEnded ? "Periode Pendaftaran Telah Berakhir" : "Pendaftaran Segera Dibuka"}
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.8, marginBottom: "1.5rem" }}>
            {phaseEnded
              ? <>Virtual Phase GR2026 telah berakhir pada <strong style={{ color: "#f1f5f9" }}>{phase.endDate}</strong>. Terima kasih atas antusiasme kamu — sampai jumpa di event berikutnya! 👋</>
              : <>Pendaftaran <strong style={{ color: "#D4A017" }}>GR2026 Virtual Phase</strong> belum dibuka. Pantau terus halaman ini dan media sosial kami ya!</>}
          </p>
          <button onClick={() => navigate("/virtual")} style={css.btnPri}>Lihat Daftar Lowongan →</button>
        </div>
      </div>
    );
  }

  // ── RETRY FOTO ────────────────────────────────────────────────
  if (retryFoto) {
    return (
      <div style={{ ...css.page, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.25rem" }}>
        <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>📸</div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.5rem" }}>Upload Foto Belum Berhasil</h2>
          <p style={{ color: "#64748b", fontSize: "0.85rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            Pendaftaran kamu <strong style={{ color: "#4ade80" }}>sudah tersimpan</strong> (ID: <strong style={{ color: "#D4A017", fontFamily: "monospace" }}>{finalId}</strong>),
            tapi fotonya belum masuk. Foto wajib ada supaya profil kamu tampil ke employer.
          </p>
          {fotoPreview && <img src={fotoPreview} alt="foto" style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", margin: "0 auto 1.5rem", display: "block", border: "2px solid #D4A017" }}/>}
          <button onClick={handleRetryFoto} disabled={submitting} style={{ ...css.btnPri, opacity: submitting ? 0.6 : 1 }}>
            {submitting ? "⏳ Mengupload..." : "🔄 Coba Upload Lagi"}
          </button>
        </div>
      </div>
    );
  }

  // ── CV STEP ───────────────────────────────────────────────────
  if (step === "cv") {
    return (
      <div style={{ ...css.page, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.25rem" }}>
        <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>📄</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>Satu Langkah Lagi: Upload CV</h2>
          <p style={{ color: "#94a3b8", fontSize: "0.86rem", lineHeight: 1.75, marginBottom: "1.5rem" }}>
            Tanpa CV kamu hanya bisa <strong style={{ color: "#f1f5f9" }}>melihat-lihat</strong> lowongan.<br/>
            Dengan CV, kamu langsung bisa <strong style={{ color: "#D4A017" }}>melamar ke 28 perusahaan</strong>. Format PDF.
          </p>

          <div onClick={() => cvInputRef.current?.click()} style={{
            border: `2px dashed ${cvFile ? "#D4A017" : "rgba(255,255,255,0.2)"}`,
            background: cvFile ? "rgba(212,160,23,0.06)" : "rgba(255,255,255,0.03)",
            borderRadius: 14, padding: "1.5rem", marginBottom: "1.25rem", cursor: "pointer",
          }}>
            {cvFile
              ? <><div style={{ fontSize: "1.5rem" }}>✅</div><div style={{ fontSize: "0.85rem", color: "#D4A017", fontWeight: 600, marginTop: "0.25rem", wordBreak: "break-all" }}>{cvFile.name}</div></>
              : <><div style={{ fontSize: "1.5rem" }}>📎</div><div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "0.25rem" }}>Klik untuk pilih file CV (PDF)</div></>}
          </div>
          <input ref={cvInputRef} type="file" accept="application/pdf" style={{ display: "none" }}
            onChange={e => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (f.type !== "application/pdf") { toast.error("CV harus berformat PDF ya."); return; }
              if (f.size > 5 * 1024 * 1024) { toast.error("Ukuran CV maksimal 5 MB."); return; }
              setCvFile(f);
            }}/>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button onClick={handleUploadCv} disabled={!cvFile || uploadingCv}
              style={{ ...css.btnPri, opacity: cvFile && !uploadingCv ? 1 : 0.4 }}>
              {uploadingCv ? "⏳ Mengupload..." : "📤 Upload CV & Selesai"}
            </button>
            <button onClick={() => setShowSkipCv(true)} style={css.btnGhost}>
              Lewati dulu
            </button>
          </div>

          {/* ── Modal konfirmasi skip CV ── */}
          {showSkipCv && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem", zIndex: 100 }}>
              <div style={{ ...css.card, maxWidth: 380, width: "100%", textAlign: "center", marginBottom: 0 }}>
                <div style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>🤔</div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "0.5rem" }}>Yakin belum mau upload CV?</h3>
                <p style={{ color: "#94a3b8", fontSize: "0.83rem", lineHeight: 1.7, marginBottom: "1.25rem" }}>
                  Tanpa CV, kamu <strong style={{ color: "#f87171" }}>belum bisa melamar</strong> ke posisi manapun —
                  hanya bisa melihat-lihat. Employer juga lebih cepat merespons kandidat yang profilnya lengkap.
                </p>
                {CV_TEMPLATE_URL && (
                  <a href={CV_TEMPLATE_URL} target="_blank" rel="noreferrer"
                    style={{ display: "block", fontSize: "0.82rem", color: "#D4A017", fontWeight: 700, marginBottom: "1.25rem", textDecoration: "underline" }}>
                    📝 Belum punya CV? Download template gratis di sini
                  </a>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <button onClick={() => setShowSkipCv(false)} style={css.btnPri}>
                    ⬅️ Oke deh, upload sekarang
                  </button>
                  <button onClick={() => { setShowSkipCv(false); setStep("done"); }} style={css.btnGhost}>
                    Tetap lewati — upload nanti
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── DONE ──────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div style={{ ...css.page, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.25rem" }}>
        <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "0.25rem" }}>🎉</div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0 0 0.4rem" }}>Pendaftaran Berhasil!</h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem", lineHeight: 1.7, marginBottom: "1.25rem" }}>
            Selamat, <strong style={{ color: "#f1f5f9" }}>{nama}</strong>! Kamu sudah terdaftar di GR2026 Virtual Phase.
          </p>

          {/* Status kelengkapan */}
          <div style={{
            background: cvOk ? "rgba(74,222,128,0.06)" : "rgba(212,160,23,0.07)",
            border: `1px solid ${cvOk ? "rgba(74,222,128,0.3)" : "rgba(212,160,23,0.3)"}`,
            borderRadius: 12, padding: "0.9rem 1.1rem", marginBottom: "1.25rem", textAlign: "left",
          }}>
            <div style={{ fontSize: "0.83rem", color: "#cbd5e1", lineHeight: 1.8 }}>
              ✅ Foto profil terpasang<br/>
              {cvOk
                ? <>✅ CV terupload — <strong style={{ color: "#4ade80" }}>kamu sudah bisa melamar!</strong></>
                : <>⚠️ CV belum ada — <strong style={{ color: "#D4A017" }}>upload dulu sebelum bisa melamar</strong> (bisa dari halaman lowongan)</>}
            </div>
          </div>

          {/* Registration ID + cara login */}
          <div style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.25)", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1.25rem", textAlign: "left" }}>
            <div style={{ fontSize: "0.68rem", color: "#D4A017", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.3rem" }}>Registration ID</div>
            <div style={{ fontWeight: 800, color: "#D4A017", fontSize: "1.2rem", fontFamily: "monospace" }}>{finalId}</div>
            <div style={{ marginTop: "0.6rem", fontSize: "0.78rem", color: "#94a3b8", lineHeight: 1.7 }}>
              📌 <strong style={{ color: "#f1f5f9" }}>Catat / screenshot ID ini.</strong> Untuk masuk lagi nanti, gunakan ID di atas + email <strong style={{ color: "#D4A017" }}>{email}</strong>.
            </div>
          </div>

          <button onClick={() => navigate("/virtual")} style={{ ...css.btnPri, marginBottom: "0.75rem" }}>
            🔎 Lihat Lowongan &amp; Mulai Melamar →
          </button>
          <button onClick={() => navigate("/")} style={css.btnGhost}>
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // ── FORM ──────────────────────────────────────────────────────
  return (
    <div style={css.page}>
      <nav style={css.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={() => navigate("/virtual")} style={{ background: "none", border: "none", color: "#D4A017", cursor: "pointer", fontSize: "0.88rem" }}>← Lowongan</button>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 30 }}/>
        </div>
        <div style={{ fontSize: "0.75rem", color: "#334155" }}>Virtual Phase · GRATIS</div>
      </nav>

      <div style={css.wrap}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "clamp(1.5rem,4vw,1.9rem)", fontWeight: 800, marginBottom: "0.4rem" }}>
            Daftar <span style={{ color: "#D4A017" }}>Virtual Phase</span>
          </h1>
          <p style={{ color: "#475569", fontSize: "0.83rem" }}>
            Melamar online ke <strong style={{ color: "#14b8a6" }}>28 perusahaan hospitality</strong> GR2026
            {phase?.daysLeft != null && phase.daysLeft > 0 && <> · tersisa <strong style={{ color: "#D4A017" }}>{phase.daysLeft} hari</strong></>}
          </p>
        </div>

        <div style={css.card}>
          {/* ── Foto (WAJIB) ── */}
          <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
            <label style={css.label}>Foto Profil <span style={css.req}>*</span></label>
            <div onClick={() => fotoInputRef.current?.click()} style={{
              width: 110, height: 110, borderRadius: "50%", margin: "0.25rem auto 0.5rem",
              border: `2px dashed ${fotoFile ? "#D4A017" : "rgba(255,255,255,0.2)"}`,
              background: fotoFile ? "transparent" : "rgba(255,255,255,0.03)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", overflow: "hidden", transition: "all 0.2s",
            }}>
              {fotoPreview
                ? <img src={fotoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                : <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1.6rem" }}>📷</div>
                    <div style={{ fontSize: "0.65rem", color: "#475569", marginTop: "0.2rem" }}>Klik untuk pilih</div>
                  </div>}
            </div>
            <p style={css.hint}>Wajib — foto kamu tampil ke employer saat melamar. Foto rapi/formal lebih dilirik HRD 😉</p>
            <input ref={fotoInputRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => {
                const f = e.target.files?.[0];
                if (!f) return;
                setFotoFile(f);
                setFotoPreview(URL.createObjectURL(f));
              }}/>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "1.25rem 0" }}/>

          {/* ── Nama ── */}
          <div style={{ marginBottom: "1.1rem" }}>
            <label style={css.label}>Nama Lengkap <span style={css.req}>*</span></label>
            <input style={css.input} value={nama} onChange={e => setNama(e.target.value)}
              placeholder="Sesuai KTP / Kartu Mahasiswa" autoComplete="name"/>
          </div>

          {/* ── Email + Phone ── */}
          <div style={{ ...css.row2, marginBottom: "1.1rem" }}>
            <div>
              <label style={css.label}>Email <span style={css.req}>*</span></label>
              <input style={{ ...css.input, borderColor: emailErr ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)" }}
                type="email" value={email}
                onChange={e => { setEmail(e.target.value); setEmailErr(""); }}
                onBlur={e => checkEmail(e.target.value)}
                placeholder="contoh@email.com"/>
              {checking && <p style={{ ...css.hint, color: "#14b8a6" }}>⏳ Memeriksa...</p>}
              {emailErr && <p style={{ ...css.hint, color: "#f87171" }}>⚠️ {emailErr}</p>}
            </div>
            <div>
              <label style={css.label}>No. WhatsApp Aktif</label>
              <input style={css.input} value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="08xx-xxxx-xxxx" type="tel"/>
              <p style={css.hint}>📲 Employer menghubungi kandidat via WA</p>
            </div>
          </div>

          {/* ── Kota ── */}
          <div style={{ marginBottom: "1.1rem" }}>
            <label style={css.label}>Kota / Asal Daerah</label>
            <input style={css.input} value={kota} onChange={e => setKota(e.target.value)}
              placeholder="Contoh: Bandung, Jawa Barat"/>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "1.25rem 0" }}/>

          {/* ── Minat Kerja ── */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={css.label}>Minat Kerja <span style={css.req}>*</span></label>
            <ChipGroup options={MINAT_OPTIONS} value={minat} onChange={setMinat}/>
          </div>

          {/* ── Status Kerja ── */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={css.label}>Status Saat Ini <span style={css.req}>*</span></label>
            <ChipGroup options={STATUS_OPTIONS} value={statusKerja} onChange={setStatusKerja} color="#14b8a6"/>
          </div>

          {/* ── Tahun Lulus + Institusi ── */}
          <div style={{ ...css.row2, marginBottom: "1.1rem" }}>
            <div>
              <label style={css.label}>Tahun Lulus <span style={css.req}>*</span></label>
              <select style={css.select} value={tahunLulus} onChange={e => setTahunLulus(e.target.value)}>
                <option value="">-- Pilih --</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                <option value="sebelum_2011">Sebelum 2011</option>
              </select>
            </div>
            <div>
              <label style={css.label}>Institusi</label>
              <input style={css.input} value={institusi} onChange={e => setInstitusi(e.target.value)}
                placeholder="Nama kampus"/>
            </div>
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={css.label}>Program Studi <span style={css.req}>*</span></label>
            <input style={css.input} value={jurusan} onChange={e => setJurusan(e.target.value)}
              placeholder="Contoh: D4 Manajemen Perhotelan"/>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "1.25rem 0" }}/>

          {/* ── Sumber Info ── */}
          <div style={{ marginBottom: sumberHasIG ? "0.75rem" : "1.5rem" }}>
            <label style={css.label}>Tahu Virtual Phase dari mana? <span style={css.req}>*</span></label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {SUMBER_OPTIONS.map(o => (
                <button key={o.val} type="button" onClick={() => { setSumber(o.val); if (!o.hasIG) setIgUser(""); }} style={{
                  padding: "0.5rem 1rem", borderRadius: 20, fontSize: "0.82rem", fontWeight: 600,
                  border: `1.5px solid ${sumber === o.val ? "#818cf8" : "rgba(255,255,255,0.1)"}`,
                  background: sumber === o.val ? "rgba(129,140,248,0.15)" : "transparent",
                  color: sumber === o.val ? "#818cf8" : "#64748b", cursor: "pointer", transition: "all 0.15s",
                }}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Instagram username (conditional) ── */}
          {sumberHasIG && (
            <div style={{ marginBottom: "1.5rem", background: "rgba(129,140,248,0.06)", border: "1px solid rgba(129,140,248,0.2)", borderRadius: 10, padding: "1rem" }}>
              <label style={{ ...css.label, color: "#818cf8" }}>Username Instagram <span style={{ color: "#64748b", fontWeight: 400, textTransform: "none" }}>(opsional)</span></label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: "#818cf8", fontWeight: 700, fontSize: "1.1rem" }}>@</span>
                <input style={{ ...css.input, flex: 1 }} value={igUser} onChange={e => setIgUser(e.target.value.replace("@", ""))}
                  placeholder="username_kamu"/>
              </div>
            </div>
          )}

          {/* ── Consent BARU (checkbox wajib) ── */}
          <label style={{
            display: "flex", gap: "0.7rem", alignItems: "flex-start", cursor: "pointer",
            background: consent ? "rgba(20,184,166,0.08)" : "rgba(20,184,166,0.04)",
            border: `1px solid ${consent ? "rgba(20,184,166,0.4)" : "rgba(20,184,166,0.15)"}`,
            borderRadius: 10, padding: "0.85rem 1rem", marginBottom: "1.5rem",
          }}>
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
              style={{ marginTop: 2, width: 16, height: 16, accentColor: "#14b8a6", flexShrink: 0 }}/>
            <span style={{ fontSize: "0.76rem", color: "#94a3b8", lineHeight: 1.7 }}>
              Saya setuju data saya (termasuk foto dan CV) <strong style={{ color: "#f1f5f9" }}>dapat dilihat oleh 28 employer peserta Grand Recruitment 2026</strong> untuk
              keperluan rekrutmen, sesuai <strong style={{ color: "#94a3b8" }}>UU PDP No. 27/2022</strong>. Persetujuan dapat ditarik kapan saja via portal. <span style={css.req}>*</span>
            </span>
          </label>

          {/* ── Submit ── */}
          <button style={{ ...css.btnPri, opacity: canSubmit ? 1 : 0.4 }}
            onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? "⏳ Mendaftarkan..." : "Daftar & Mulai Melamar 🚀"}
          </button>

          {!canSubmit && nama && email && (
            <p style={{ textAlign: "center", fontSize: "0.72rem", color: "#ef4444", marginTop: "0.75rem" }}>
              Lengkapi dulu: {[
                !fotoFile && "Foto Profil",
                !minat && "Minat Kerja",
                !statusKerja && "Status",
                !tahunLulus && "Tahun Lulus",
                !jurusan && "Program Studi",
                !sumber && "Sumber Info",
                !consent && "Persetujuan Data",
              ].filter(Boolean).join(", ")}
            </p>
          )}

          <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
            <span style={{ fontSize: "0.82rem", color: "#334155" }}>Sudah terdaftar di GR2026? </span>
            <button onClick={() => navigate("/virtual")}
              style={{ background: "none", border: "none", color: "#D4A017", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem", textDecoration: "underline" }}>
              Masuk di halaman lowongan →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
