import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { generateJobseekerId, generateIdCardHTML, openIdCardForPrint } from "@/lib/invoiceGenerator";

// ── Constants ────────────────────────────────────────────────
const BIDANG = [
  "Perhotelan & Akomodasi","Food & Beverage","Tour & Travel","MICE & Event",
  "Cruise & Transportasi","Spa & Wellness","Airline & Aviation","Hospitality Management",
  "Culinary Arts","Pariwisata & Destinasi","Digital Marketing & PR",
  "Accounting & Finance","Human Resources","Lainnya",
];

const STATUS_OPTIONS = [
  { value: "mahasiswa", label: "Mahasiswa Aktif", desc: "Sedang menempuh pendidikan D3/D4/S1", icon: "📚" },
  { value: "fresh_graduate", label: "Fresh Graduate", desc: "Lulus dalam 2 tahun terakhir", icon: "🎓" },
  { value: "alumni_nhi", label: "Alumni NHI Bandung", desc: "Lulusan Politeknik Pariwisata NHI Bandung", icon: "🏫" },
  { value: "umum", label: "Pencari Kerja Umum", desc: "Berpengalaman atau pindah karir", icon: "💼" },
];

const LEVELS = [
  { level: 1, name: "Pejuang Baru",    icon: "🌱", color: "#64748b", xp: 100 },
  { level: 2, name: "Petualang",       icon: "🎓", color: "#14b8a6", xp: 200 },
  { level: 3, name: "Pejuang Sejati",  icon: "📄", color: "#D4A017", xp: 350 },
  { level: 4, name: "Penantang",       icon: "🔒", color: "#818cf8", xp: 450 },
  { level: 5, name: "Siap Interview!", icon: "🏆", color: "#f59e0b", xp: 500 },
];

// ── Styles ───────────────────────────────────────────────────
const s = {
  page:   { minHeight: "100vh", background: "#0a1628", fontFamily: "system-ui, sans-serif", color: "#f1f5f9", paddingBottom: "4rem" } as React.CSSProperties,
  nav:    { background: "rgba(10,22,40,0.97)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(212,160,23,0.15)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky" as const, top: 0, zIndex: 50 },
  wrap:   { maxWidth: 680, margin: "0 auto", padding: "2rem 1.25rem" },
  card:   { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.75rem", marginBottom: "1.5rem" },
  gold:   { background: "rgba(212,160,23,0.04)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 16, padding: "1.75rem", marginBottom: "1.5rem" },
  label:  { display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.4rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  input:  { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "0.7rem 1rem", fontSize: "0.95rem", color: "#f1f5f9", outline: "none" },
  select: { width: "100%", background: "#0d1f35", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "0.7rem 1rem", fontSize: "0.95rem", color: "#f1f5f9", outline: "none" },
  row2:   { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" },
  secHd:  { fontSize: "1.05rem", fontWeight: 700, color: "#D4A017", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" },
  hint:   { fontSize: "0.78rem", color: "#475569", marginTop: "0.35rem", lineHeight: 1.5 },
  btnPri: { background: "linear-gradient(135deg, #D4A017, #B8860B)", border: "none", color: "#fff", borderRadius: 12, padding: "0.9rem 2rem", fontSize: "1rem", fontWeight: 700, cursor: "pointer", width: "100%" },
  btnOut: { background: "transparent", border: "1px solid rgba(212,160,23,0.4)", color: "#D4A017", borderRadius: 10, padding: "0.6rem 1.2rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" },
};

interface FormData {
  namaLengkap: string; nik: string; idType: "ktp" | "sim" | "passport";
  tempatLahir: string; tanggalLahir: string; jenisKelamin: string;
  whatsapp: string; email: string; kota: string;
  status: string; institusi: string; jurusan: string; tahunLulus: string; bidangMinat: string;
  foto: File | null; cv: File | null; ktm: File | null; sertifikat: File | null;
  consent1: boolean; consent2: boolean;
}

const initForm: FormData = {
  namaLengkap: "", nik: "", idType: "ktp", tempatLahir: "", tanggalLahir: "",
  jenisKelamin: "", whatsapp: "", email: "", kota: "",
  status: "", institusi: "", jurusan: "", tahunLulus: "", bidangMinat: "",
  foto: null, cv: null, ktm: null, sertifikat: null,
  consent1: false, consent2: false,
};

// ── Upload helper ────────────────────────────────────────────
async function uploadFile(file: File, type: "foto" | "cv" | "ktm" | "sertifikat", registrationId: string): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/upload?type=${type}&registrationId=${registrationId}`, { method: "POST", body: formData });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url || null;
  } catch { return null; }
}

// ── FileUpload component ─────────────────────────────────────
function FileUpload({ label, hint, accept, file, onChange, required }: {
  label: string; hint: string; accept: string;
  file: File | null; onChange: (f: File | null) => void; required?: boolean;
}) {
  return (
    <div>
      <label style={s.label}>{label} {required && <span style={{ color: "#ef4444" }}>*</span>}</label>
      <div onClick={() => document.getElementById(`file-${label}`)?.click()} style={{
        border: `2px dashed ${file ? "#D4A017" : "rgba(255,255,255,0.15)"}`,
        borderRadius: 12, padding: "1.25rem", textAlign: "center", cursor: "pointer",
        background: file ? "rgba(212,160,23,0.05)" : "transparent", transition: "all 0.2s"
      }}>
        {file ? (
          <>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>✅</div>
            <div style={{ color: "#D4A017", fontWeight: 600, fontSize: "0.9rem" }}>{file.name}</div>
            <div style={{ color: "#475569", fontSize: "0.75rem" }}>{(file.size / 1024).toFixed(0)} KB · Klik untuk ganti</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>📎</div>
            <div style={{ color: "#64748b", fontSize: "0.85rem" }}>Klik untuk upload</div>
          </>
        )}
      </div>
      <p style={s.hint}>{hint}</p>
      <input id={`file-${label}`} type="file" accept={accept} style={{ display: "none" }}
        onChange={e => onChange(e.target.files?.[0] || null)} />
    </div>
  );
}

// ── Level HUD Component ──────────────────────────────────────
function LevelHUD({ step }: { step: number }) {
  const current = LEVELS[step] || LEVELS[LEVELS.length - 1];
  const progress = step === 0 ? 15 : step === 1 ? 35 : step === 2 ? 65 : step === 3 ? 85 : 100;

  return (
    <div style={{
      background: `linear-gradient(135deg, ${current.color}12, ${current.color}05)`,
      border: `1px solid ${current.color}30`,
      borderRadius: 16, padding: "1.25rem 1.5rem",
      marginBottom: "2rem",
      display: "flex", alignItems: "center", gap: "1.25rem",
      flexWrap: "wrap"
    }}>
      {/* Level badge */}
      <div style={{
        width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
        background: `radial-gradient(circle at 35% 35%, ${current.color}40, ${current.color}15)`,
        border: `2px solid ${current.color}`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        boxShadow: `0 0 20px ${current.color}30`
      }}>
        <div style={{ fontSize: "1.4rem", lineHeight: 1 }}>{current.icon}</div>
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
          <div>
            <span style={{ fontSize: "0.65rem", color: current.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Level {current.level}</span>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f1f5f9", marginLeft: "0.5rem" }}>{current.name}</span>
          </div>
          <span style={{ fontSize: "0.75rem", color: current.color, fontWeight: 700 }}>{progress}%</span>
        </div>
        {/* XP Bar */}
        <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 3,
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${current.color}90, ${current.color})`,
            transition: "width 0.5s ease",
            boxShadow: `0 0 8px ${current.color}60`
          }} />
        </div>
        <div style={{ fontSize: "0.7rem", color: "#475569", marginTop: "0.3rem" }}>
          {step < 4 ? `Selesaikan langkah ini untuk naik ke Level ${step + 2} 🚀` : "✨ Profil kamu siap! Employer bisa menemukanmu."}
        </div>
      </div>
    </div>
  );
}

// ── Step Mini Map ────────────────────────────────────────────
function StepMap({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: "2rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
      {LEVELS.map((lv, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: i < step ? "1rem" : "0.85rem",
              background: i < step ? lv.color : i === step ? `${lv.color}30` : "rgba(255,255,255,0.05)",
              color: i <= step ? "#fff" : "#334155",
              border: i === step ? `2px solid ${lv.color}` : "none",
              boxShadow: i === step ? `0 0 12px ${lv.color}50` : "none",
              transition: "all 0.3s",
              fontWeight: 700
            }}>
              {i < step ? "✓" : lv.icon}
            </div>
            <span style={{ fontSize: "0.62rem", color: i === step ? lv.color : "#334155", whiteSpace: "nowrap", fontWeight: i === step ? 700 : 400 }}>
              {lv.name}
            </span>
          </div>
          {i < LEVELS.length - 1 && (
            <div style={{
              height: 2, width: "clamp(12px,3vw,36px)",
              background: i < step ? LEVELS[i].color : "rgba(255,255,255,0.05)",
              margin: "0 0.2rem", marginBottom: "1.4rem", flexShrink: 0,
              transition: "background 0.3s"
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function JobseekerRegister() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initForm);
  const [submitted, setSubmitted] = useState(false);
  const [finalId, setFinalId] = useState<string | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ nik?: string; email?: string; whatsapp?: string }>({});
  const [checking, setChecking] = useState<{ nik?: boolean; email?: boolean; whatsapp?: boolean }>({});

  const [registrationId] = useState(() => "JS-TEMP-" + Date.now().toString().slice(-4));

  const createJobseekerMutation = trpc.event.createJobseeker.useMutation({
    onSuccess: () => {
      toast.success("Pendaftaran berhasil!", { description: "Selamat datang di GR2026!" });
      setSubmitted(true);
    },
    onError: (err) => {
      toast.error("Gagal mendaftar", { description: err.message || "Coba lagi atau hubungi panitia." });
    },
  });

  const allJobseekersQuery = trpc.event.getAllJobseekers.useQuery(undefined, { enabled: false });

  const checkField = async (field: "nik" | "email" | "whatsapp", value: string) => {
    if (!value) return;
    setChecking(c => ({ ...c, [field]: true }));
    setFieldErrors(e => ({ ...e, [field]: undefined }));
    try {
      const result = await allJobseekersQuery.refetch();
      const list = result.data || [];
      let isDuplicate = false;
      if (field === "nik") isDuplicate = list.some((j: any) => j.nik === value);
      if (field === "email") isDuplicate = list.some((j: any) => j.email?.toLowerCase() === value.toLowerCase());
      if (field === "whatsapp") isDuplicate = list.some((j: any) => j.whatsapp === value);
      if (isDuplicate) {
        const messages: Record<string, string> = {
          nik: "Nomor identitas ini sudah terdaftar.",
          email: "Email ini sudah digunakan. Gunakan email lain.",
          whatsapp: "Nomor WhatsApp ini sudah terdaftar.",
        };
        setFieldErrors(e => ({ ...e, [field]: messages[field] }));
      }
    } catch {}
    setChecking(c => ({ ...c, [field]: false }));
  };

  const upd = (key: keyof FormData, val: any) => {
    if (key === "idType") {
      setForm(f => ({ ...f, idType: val as "ktp" | "sim" | "passport", nik: "" }));
      setFieldErrors(e => ({ ...e, nik: undefined }));
    } else {
      setForm(f => ({ ...f, [key]: val }));
      if (key === "nik" || key === "email" || key === "whatsapp") {
        setFieldErrors(e => ({ ...e, [key]: undefined }));
      }
    }
  };

  const canNext = () => {
    if (step === 0) {
      const hasErrors = !!(fieldErrors.nik || fieldErrors.email || fieldErrors.whatsapp);
      const isChecking = !!(checking.nik || checking.email || checking.whatsapp);
      return !!(form.namaLengkap && form.nik && form.tanggalLahir && form.jenisKelamin && form.whatsapp && form.email && form.kota) && !hasErrors && !isChecking;
    }
    if (step === 1) return !!(form.status && form.institusi && form.jurusan && form.bidangMinat);
    if (step === 2) return !!(form.foto && form.cv);
    if (step === 3) return true;
    return true;
  };

  const nextStep = () => {
    if (!canNext()) return;
    setShowLevelUp(true);
    setTimeout(() => {
      setShowLevelUp(false);
      setStep(s => s + 1);
    }, 1400);
  };

  const handleSubmit = async () => {
    if (uploading) return;
    setUploading(true);
    const properId = generateJobseekerId({ namaLengkap: form.namaLengkap, institusi: form.institusi, tahunLulus: form.tahunLulus, isAlumniNHI: form.status === "alumni_nhi" });
    setFinalId(properId);
    toast.loading("Mengupload dokumen...", { id: "upload" });
    const [fotoUrl, cvUrl, ktmUrl, sertifikatUrl] = await Promise.all([
      form.foto       ? uploadFile(form.foto,       "foto",       properId) : Promise.resolve(null),
      form.cv         ? uploadFile(form.cv,         "cv",         properId) : Promise.resolve(null),
      form.ktm        ? uploadFile(form.ktm,        "ktm",        properId) : Promise.resolve(null),
      form.sertifikat ? uploadFile(form.sertifikat, "sertifikat", properId) : Promise.resolve(null),
    ]);
    toast.dismiss("upload");
    setUploading(false);
    if (!fotoUrl || !cvUrl) {
      toast.error("Gagal mengupload dokumen wajib", { description: "Coba lagi atau hubungi panitia" });
      return;
    }
    createJobseekerMutation.mutate({
      registrationId: properId, namaLengkap: form.namaLengkap, nik: form.nik,
      tempatLahir: form.tempatLahir || undefined, tanggalLahir: form.tanggalLahir || undefined,
      jenisKelamin: form.jenisKelamin as "Laki-laki" | "Perempuan",
      whatsapp: form.whatsapp, email: form.email, kota: form.kota || undefined,
      status: form.status as "mahasiswa" | "fresh_graduate" | "alumni_nhi" | "umum",
      institusi: form.institusi || undefined, jurusan: form.jurusan || undefined,
      tahunLulus: form.tahunLulus || undefined, bidangMinat: form.bidangMinat || undefined,
      consent1: form.consent1, consent2: form.consent2,
      fotoUrl: fotoUrl || undefined, cvUrl: cvUrl || undefined,
      ktmUrl: ktmUrl || undefined, sertifikatUrl: sertifikatUrl || undefined,
    });
  };

  // ── Level Up Overlay ─────────────────────────────────────
  if (showLevelUp) {
    const nextLevel = LEVELS[step + 1] || LEVELS[LEVELS.length - 1];
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{ fontSize: "5rem", animation: "bounce 0.6s ease infinite alternate", marginBottom: "1rem" }}>
            {nextLevel.icon}
          </div>
          <div style={{ fontSize: "0.8rem", color: nextLevel.color, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            LEVEL UP!
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#f1f5f9", marginBottom: "0.5rem" }}>
            Level {nextLevel.level}
          </div>
          <div style={{ fontSize: "1.2rem", color: nextLevel.color, fontWeight: 700 }}>
            {nextLevel.name}
          </div>
          <div style={{ marginTop: "1.5rem", fontSize: "0.85rem", color: "#475569" }}>
            +{nextLevel.xp} XP diperoleh ✨
          </div>
          <div style={{ width: 120, height: 4, background: `${nextLevel.color}30`, borderRadius: 2, margin: "1rem auto 0", overflow: "hidden" }}>
            <div style={{ height: "100%", background: nextLevel.color, borderRadius: 2, animation: "fillBar 1.2s ease forwards" }} />
          </div>
        </div>
        <style>{`
          @keyframes bounce { from { transform: scale(1) rotate(-5deg); } to { transform: scale(1.15) rotate(5deg); } }
          @keyframes fillBar { from { width: 0; } to { width: 100%; } }
        `}</style>
      </div>
    );
  }

  // ── Success Screen ───────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: 500, padding: "2rem" }}>
          {/* Trophy */}
          <div style={{ fontSize: "5rem", marginBottom: "0.5rem" }}>🏆</div>
          <div style={{ fontSize: "0.8rem", color: "#f59e0b", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            MAX LEVEL REACHED!
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>Siap Interview! 🎉</h1>

          {/* XP summary */}
          <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", margin: "1.5rem 0", flexWrap: "wrap" }}>
            {LEVELS.map(lv => (
              <div key={lv.level} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.25rem" }}>{lv.icon}</div>
                <div style={{ fontSize: "0.65rem", color: lv.color, fontWeight: 700 }}>+{lv.xp} XP</div>
              </div>
            ))}
          </div>
          <div style={{
            background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 10, padding: "0.75rem", marginBottom: "1.5rem",
            fontSize: "0.85rem", color: "#f59e0b", fontWeight: 700
          }}>
            Total: 1,600 XP · Level 5 · Profil Terverifikasi ✨
          </div>

          <p style={{ color: "#64748b", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            Selamat, <strong style={{ color: "#f1f5f9" }}>{form.namaLengkap}</strong>!<br/>
            Kamu sudah terdaftar sebagai jobseeker GR2026.
          </p>

          <div style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 12, padding: "1.25rem", marginBottom: "1rem", textAlign: "left" }}>
            <div style={{ fontSize: "0.75rem", color: "#D4A017", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>ID Pendaftaran</div>
            <div style={{ fontWeight: 800, color: "#D4A017", fontSize: "1.2rem", fontFamily: "monospace", marginBottom: "0.5rem" }}>{finalId || registrationId}</div>
            <div style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.7 }}>
              Simpan ID ini untuk check-in di hari H.<br/>
              Konfirmasi dikirim ke <strong style={{ color: "#f1f5f9" }}>{form.email}</strong>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", padding: "0.6rem 1rem 0.2rem", textAlign: "center", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              ID Card GR2026
            </div>
            <iframe
              srcDoc={generateIdCardHTML({ registrationId: finalId || registrationId, namaLengkap: form.namaLengkap, institusi: form.institusi || undefined, jurusan: form.jurusan || undefined, bidangMinat: form.bidangMinat || undefined, status: form.status || undefined }).replace(/<script[\s\S]*?<\/script>/g, "")}
              style={{ width: "100%", height: 260, border: "none", display: "block" }}
              title="ID Card Preview"
            />
          </div>

          <button onClick={() => openIdCardForPrint({ registrationId: finalId || registrationId, namaLengkap: form.namaLengkap, institusi: form.institusi || undefined, jurusan: form.jurusan || undefined, bidangMinat: form.bidangMinat || undefined, status: form.status || undefined })}
            style={{ ...s.btnPri, background: "linear-gradient(135deg, #0d9488, #0f766e)", marginBottom: "1rem" }}>
            📥 Download ID Card
          </button>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem", textAlign: "left" }}>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>Status Consent Data</div>
            <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "0.4rem" }}>{form.consent1 ? "✅" : "❌"} Profil dapat dilihat employer offline GR2026</div>
            <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{form.consent2 ? "✅" : "⬜"} Profil dapat dibagikan ke employer online</div>
            <p style={{ fontSize: "0.75rem", color: "#334155", marginTop: "0.75rem", lineHeight: 1.5 }}>Kamu dapat mengubah consent kapan saja melalui portal jobseeker.</p>
          </div>

          <button onClick={() => navigate("/")} style={s.btnPri}>Kembali ke Beranda</button>
        </div>
      </div>
    );
  }

  // ── Main Form ────────────────────────────────────────────
  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#D4A017", cursor: "pointer", fontSize: "0.9rem" }}>← Kembali</button>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 32 }} />
        </div>
        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Pendaftaran Jobseeker · Gratis</div>
      </nav>

      <div style={s.wrap}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.2rem)", fontWeight: 800, marginBottom: "0.5rem" }}>
            Mulai <span style={{ color: "#D4A017" }}>Petualanganmu</span>
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>GR2026 · June 8–9 · Dome NHI Bandung · <strong style={{ color: "#14b8a6" }}>GRATIS</strong></p>
        </div>

        {/* Level HUD */}
        <LevelHUD step={step} />

        {/* Step Map */}
        <StepMap step={step} />

        {/* ── STEP 0: Data Diri (Level 1) ── */}
        {step === 0 && (
          <div style={s.card}>
            <div style={s.secHd}>👤 Data Diri</div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={s.label}>Nama Lengkap <span style={{ color: "#ef4444" }}>*</span></label>
              <input style={s.input} value={form.namaLengkap} onChange={e => upd("namaLengkap", e.target.value)} placeholder="Sesuai KTP, contoh: Budi Santoso"/>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={s.label}>Jenis Identitas <span style={{ color: "#ef4444" }}>*</span></label>
              <select style={s.select} value={form.idType} onChange={e => upd("idType", e.target.value)}>
                <option value="ktp">KTP (NIK)</option>
                <option value="sim">SIM</option>
                <option value="passport">Passport</option>
              </select>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={s.label}>Nomor Identitas <span style={{ color: "#ef4444" }}>*</span></label>
              <input
                style={{...s.input, borderColor: fieldErrors.nik ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.12)"}}
                value={form.nik}
                onChange={e => upd("nik", e.target.value)}
                onBlur={e => checkField("nik", e.target.value)}
                placeholder={form.idType === "ktp" ? "16 digit NIK" : form.idType === "sim" ? "Nomor SIM" : "Nomor Passport"}
                maxLength={form.idType === "ktp" ? 16 : 20}/>
              {checking.nik && <p style={{...s.hint, color: "#14b8a6"}}>⏳ Memeriksa...</p>}
              {fieldErrors.nik && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "0.65rem 1rem", marginTop: "0.4rem" }}><p style={{ fontSize: "0.8rem", color: "#f87171", margin: 0 }}>⚠️ {fieldErrors.nik}</p></div>}
            </div>

            <div style={s.row2}>
              <div>
                <label style={s.label}>Tempat Lahir</label>
                <input style={s.input} value={form.tempatLahir} onChange={e => upd("tempatLahir", e.target.value)} placeholder="Contoh: Bandung"/>
              </div>
              <div>
                <label style={s.label}>Tanggal Lahir <span style={{ color: "#ef4444" }}>*</span></label>
                <input style={s.input} type="date" value={form.tanggalLahir} onChange={e => upd("tanggalLahir", e.target.value)}/>
              </div>
            </div>

            <div style={{ margin: "1rem 0" }}>
              <label style={s.label}>Jenis Kelamin <span style={{ color: "#ef4444" }}>*</span></label>
              <div style={{ display: "flex", gap: "1rem" }}>
                {["Laki-laki", "Perempuan"].map(g => (
                  <div key={g} onClick={() => upd("jenisKelamin", g)}
                    style={{ flex: 1, border: `2px solid ${form.jenisKelamin === g ? "#D4A017" : "rgba(255,255,255,0.1)"}`, borderRadius: 10, padding: "0.75rem", textAlign: "center", cursor: "pointer", background: form.jenisKelamin === g ? "rgba(212,160,23,0.08)" : "transparent", color: form.jenisKelamin === g ? "#D4A017" : "#64748b", fontWeight: form.jenisKelamin === g ? 700 : 400, fontSize: "0.9rem", transition: "all 0.2s" }}>
                    {g === "Laki-laki" ? "👨 " : "👩 "}{g}
                  </div>
                ))}
              </div>
            </div>

            <div style={s.row2}>
              <div>
                <label style={s.label}>No. WhatsApp <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  style={{...s.input, borderColor: fieldErrors.whatsapp ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.12)"}}
                  value={form.whatsapp} onChange={e => upd("whatsapp", e.target.value)}
                  onBlur={e => checkField("whatsapp", e.target.value)}
                  placeholder="08123456789"/>
                {checking.whatsapp && <p style={{...s.hint, color: "#14b8a6"}}>⏳ Memeriksa...</p>}
                {fieldErrors.whatsapp && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "0.65rem 1rem", marginTop: "0.4rem" }}><p style={{ fontSize: "0.8rem", color: "#f87171", margin: 0 }}>⚠️ {fieldErrors.whatsapp}</p></div>}
              </div>
              <div>
                <label style={s.label}>Email <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  style={{...s.input, borderColor: fieldErrors.email ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.12)"}}
                  type="email" value={form.email} onChange={e => upd("email", e.target.value)}
                  onBlur={e => checkField("email", e.target.value)}
                  placeholder="contoh@email.com"/>
                {checking.email && <p style={{...s.hint, color: "#14b8a6"}}>⏳ Memeriksa...</p>}
                {fieldErrors.email && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "0.65rem 1rem", marginTop: "0.4rem" }}><p style={{ fontSize: "0.8rem", color: "#f87171", margin: 0 }}>⚠️ {fieldErrors.email}</p></div>}
              </div>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <label style={s.label}>Kota Domisili <span style={{ color: "#ef4444" }}>*</span></label>
              <input style={s.input} value={form.kota} onChange={e => upd("kota", e.target.value)} placeholder="Contoh: Bandung, Jawa Barat"/>
            </div>
          </div>
        )}

        {/* ── STEP 1: Latar Belakang (Level 2) ── */}
        {step === 1 && (
          <div style={s.card}>
            <div style={s.secHd}>🎓 Latar Belakang Pendidikan</div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={s.label}>Status <span style={{ color: "#ef4444" }}>*</span></label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,200px),1fr))", gap: "0.75rem" }}>
                {STATUS_OPTIONS.map(opt => (
                  <div key={opt.value} onClick={() => upd("status", opt.value)}
                    style={{ border: `2px solid ${form.status === opt.value ? "#D4A017" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, padding: "1rem", cursor: "pointer", background: form.status === opt.value ? "rgba(212,160,23,0.08)" : "rgba(255,255,255,0.02)", transition: "all 0.2s" }}>
                    <div style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>{opt.icon}</div>
                    <div style={{ fontWeight: 700, color: form.status === opt.value ? "#D4A017" : "#f1f5f9", fontSize: "0.9rem", marginBottom: "0.25rem" }}>{opt.label}</div>
                    <div style={{ fontSize: "0.78rem", color: "#475569" }}>{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={s.label}>Institusi / Universitas <span style={{ color: "#ef4444" }}>*</span></label>
              <input style={s.input} value={form.institusi} onChange={e => upd("institusi", e.target.value)}
                placeholder={form.status === "alumni_nhi" ? "Politeknik Pariwisata NHI Bandung" : "Nama institusi pendidikan"}/>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={s.label}>Program Studi / Jurusan <span style={{ color: "#ef4444" }}>*</span></label>
              <input style={s.input} value={form.jurusan} onChange={e => upd("jurusan", e.target.value)}
                placeholder="Contoh: D4 Manajemen Perhotelan"/>
            </div>

            <div style={s.row2}>
              <div>
                <label style={s.label}>Tahun Lulus</label>
                <select style={s.select} value={form.tahunLulus} onChange={e => upd("tahunLulus", e.target.value)}>
                  <option value="">-- Pilih tahun --</option>
                  {Array.from({ length: 10 }, (_, i) => 2026 - i).map(y => <option key={y} value={y}>{y}</option>)}
                  <option value="sebelum_2016">Sebelum 2016</option>
                </select>
              </div>
              <div>
                <label style={s.label}>Bidang Minat <span style={{ color: "#ef4444" }}>*</span></label>
                <select style={s.select} value={form.bidangMinat} onChange={e => upd("bidangMinat", e.target.value)}>
                  <option value="">-- Pilih bidang --</option>
                  {BIDANG.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Dokumen (Level 3) ── */}
        {step === 2 && (
          <div style={s.card}>
            <div style={s.secHd}>📄 Upload Dokumen</div>
            <div style={{ background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 10, padding: "0.85rem 1.1rem", marginBottom: "1.5rem", fontSize: "0.83rem", color: "#D4A017" }}>
              ⚡ Langkah ini penting! Profil dengan foto & CV lengkap 3x lebih sering dilihat employer.
            </div>
            <div style={{ display: "grid", gap: "1.25rem" }}>
              <FileUpload label="Pas Foto Terbaru" hint="Format JPG/PNG · Maks 2MB · Foto formal, wajah jelas." accept="image/*" file={form.foto} onChange={f => upd("foto", f)} required/>
              <FileUpload label="CV / Resume" hint="Format PDF · Maks 5MB · CV terbaru, maksimal 2 halaman." accept=".pdf" file={form.cv} onChange={f => upd("cv", f)} required/>
              <FileUpload label="KTP atau Kartu Mahasiswa (Opsional)" hint="Format JPG/PNG/PDF · Maks 2MB" accept="image/*,.pdf" file={form.ktm} onChange={f => upd("ktm", f)}/>
              <FileUpload label="Sertifikat Pendukung (Opsional)" hint="Format PDF/JPG · Maks 5MB · Gabungkan jadi satu file jika lebih dari satu." accept=".pdf,image/*" file={form.sertifikat} onChange={f => upd("sertifikat", f)}/>
            </div>
          </div>
        )}

        {/* ── STEP 3: Consent (Level 4) ── */}
        {step === 3 && (
          <div>
            <div style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ fontWeight: 700, color: "#14b8a6", marginBottom: "0.5rem", fontSize: "0.9rem" }}>🔒 Perlindungan Data Pribadi</div>
              <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.7, margin: 0 }}>
                Data kamu dilindungi sesuai <strong style={{ color: "#f1f5f9" }}>UU No. 27 Tahun 2022 (UU PDP)</strong>. Kamu berhak mengakses, mengoreksi, dan menarik persetujuan kapan saja.
              </p>
            </div>

            <div style={s.gold}>
              <div style={{ fontSize: "0.75rem", color: "#D4A017", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
                Consent Layer 1 — Employer Offline GR2026
              </div>
              <label style={{ display: "flex", gap: "1rem", cursor: "pointer", alignItems: "flex-start" }}>
                <input type="checkbox" checked={form.consent1} onChange={e => upd("consent1", e.target.checked)}
                  style={{ width: 20, height: 20, marginTop: 2, accentColor: "#D4A017", flexShrink: 0 }}/>
                <div>
                  <div style={{ fontWeight: 700, color: "#f1f5f9", marginBottom: "0.5rem", fontSize: "0.95rem" }}>
                    Saya setuju profil saya dapat dilihat oleh perusahaan peserta GR2026 <span style={{ color: "#ef4444" }}>*</span>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.7 }}>
                    Data dan CV kamu dapat diakses oleh employer resmi yang hadir di Grand Recruitment 2026.
                  </div>
                </div>
              </label>
              {!form.consent1 && (
                <div style={{ marginTop: "0.75rem", padding: "0.75rem 1rem", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 8, fontSize: "0.8rem", color: "#fdba74" }}>
                  ⚠️ Tanpa consent ini kamu tetap bisa hadir, namun harus bawa CV hardcopy ke booth employer.
                </div>
              )}
            </div>

            <div style={s.card}>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
                Consent Layer 2 — Employer Online (Opsional)
              </div>
              <label style={{ display: "flex", gap: "1rem", cursor: "pointer", alignItems: "flex-start" }}>
                <input type="checkbox" checked={form.consent2} onChange={e => upd("consent2", e.target.checked)}
                  style={{ width: 20, height: 20, marginTop: 2, accentColor: "#818cf8", flexShrink: 0 }}/>
                <div>
                  <div style={{ fontWeight: 700, color: "#f1f5f9", marginBottom: "0.5rem", fontSize: "0.95rem" }}>
                    Saya setuju profil dibagikan ke employer virtual/online
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.7 }}>
                    Membuka peluang lebih luas dari perusahaan yang tidak hadir fisik.
                  </div>
                </div>
              </label>
            </div>

            {/* Rights */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontWeight: 700, color: "#94a3b8", marginBottom: "0.75rem", fontSize: "0.85rem" }}>Hak-hak kamu:</div>
              {["✓ Akses & koreksi data kapan saja","✓ Tarik persetujuan via portal jobseeker","✓ Minta penghapusan data pasca event","✓ Data tidak dijual ke pihak ketiga"].map(r => (
                <div key={r} style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "0.4rem" }}>{r}</div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 4: Review (Level 5) ── */}
        {step === 4 && (
          <div style={s.gold}>
            <div style={s.secHd}>📋 Ringkasan — Final Check!</div>
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Setelah submit, profilmu langsung aktif dan bisa ditemukan employer. 🎯</p>

            {[
              { label: "Nama Lengkap", val: form.namaLengkap },
              { label: "Nomor Identitas", val: `(${form.idType.toUpperCase()}) ${form.nik}` },
              { label: "Tanggal Lahir", val: `${form.tempatLahir ? form.tempatLahir + ", " : ""}${form.tanggalLahir}` },
              { label: "Jenis Kelamin", val: form.jenisKelamin },
              { label: "WhatsApp", val: form.whatsapp },
              { label: "Email", val: form.email },
              { label: "Kota", val: form.kota },
              { label: "Status", val: STATUS_OPTIONS.find(s => s.value === form.status)?.label || form.status },
              { label: "Institusi", val: form.institusi },
              { label: "Program Studi", val: form.jurusan },
              { label: "Bidang Minat", val: form.bidangMinat },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", gap: "1rem", marginBottom: "0.6rem", flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: "0.6rem" }}>
                <span style={{ fontSize: "0.8rem", color: "#64748b", minWidth: 140 }}>{item.label}</span>
                <span style={{ fontWeight: 600, color: "#f1f5f9", fontSize: "0.9rem" }}>{item.val || "—"}</span>
              </div>
            ))}

            <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(212,160,23,0.05)", borderRadius: 10 }}>
              <div style={{ fontSize: "0.8rem", color: "#D4A017", fontWeight: 700, marginBottom: "0.5rem" }}>Dokumen</div>
              <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                {form.foto ? "✅" : "❌"} Foto &nbsp;·&nbsp; {form.cv ? "✅" : "❌"} CV &nbsp;·&nbsp; {form.ktm ? "✅" : "❌"} KTP/KTM &nbsp;·&nbsp; {form.sertifikat ? "✅" : "⬜"} Sertifikat
              </div>
            </div>
            <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: 10 }}>
              <div style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 700, marginBottom: "0.5rem" }}>Consent</div>
              <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                {form.consent1 ? "✅" : "❌"} Employer offline &nbsp;·&nbsp; {form.consent2 ? "✅" : "⬜"} Employer online
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          {step > 0 && (
            <button style={{ ...s.btnOut, flex: 1 }} onClick={() => setStep(s => s - 1)}>← Kembali</button>
          )}
          {step < 4 ? (
            <button
              style={{ ...s.btnPri, flex: 2, opacity: canNext() ? 1 : 0.4, cursor: canNext() ? "pointer" : "not-allowed" }}
              onClick={nextStep}>
              {canNext() ? `Naik Level ${step + 2} →` : "Lengkapi data dulu"}
            </button>
          ) : (
            <button
              style={{ ...s.btnPri, flex: 2, opacity: !uploading ? 1 : 0.4, cursor: !uploading ? "pointer" : "not-allowed", background: "linear-gradient(135deg, #f59e0b, #D4A017)" }}
              onClick={() => !uploading && handleSubmit()}>
              {uploading ? "⏳ Mengupload..." : "🏆 Selesaikan & Dapatkan ID Card!"}
            </button>
          )}
        </div>

        <style>{`
          @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
          * { box-sizing: border-box; }
        `}</style>
      </div>
    </div>
  );
}
