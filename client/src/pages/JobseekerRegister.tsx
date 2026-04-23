import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { generateJobseekerId, generateIdCardHTML, openIdCardForPrint } from "@/lib/invoiceGenerator";

// ── Level definitions ─────────────────────────────────────────
const LEVELS = [
  { level: 1, name: "Pejuang Baru",    icon: "🌱", color: "#64748b", xp: 200 },
  { level: 2, name: "Petualang",       icon: "📄", color: "#D4A017", xp: 300 },
  { level: 3, name: "Siap Interview!", icon: "🏆", color: "#f59e0b", xp: 500 },
];

// ── Styles ────────────────────────────────────────────────────
const s = {
  page:   { minHeight: "100vh", background: "#0a1628", fontFamily: "system-ui, sans-serif", color: "#f1f5f9" } as React.CSSProperties,
  nav:    { background: "rgba(10,22,40,0.97)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(212,160,23,0.15)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky" as const, top: 0, zIndex: 50 },
  wrap:   { maxWidth: 540, margin: "0 auto", padding: "2.5rem 1.25rem 4rem" },
  label:  { display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.4rem", textTransform: "uppercase" as const, letterSpacing: "0.06em" },
  input:  { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "0.85rem 1rem", fontSize: "1rem", color: "#f1f5f9", outline: "none", boxSizing: "border-box" as const },
  btnPri: { background: "linear-gradient(135deg, #D4A017, #B8860B)", border: "none", color: "#fff", borderRadius: 12, padding: "1rem 2rem", fontSize: "1rem", fontWeight: 700, cursor: "pointer", width: "100%" } as React.CSSProperties,
};

// ── Upload helper ─────────────────────────────────────────────
async function uploadFile(file: File, type: "foto" | "cv" | "ktm" | "sertifikat", id: string): Promise<string | null> {
  try {
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch(`/api/upload?type=${type}&registrationId=${id}`, { method: "POST", body: fd });
    if (!res.ok) return null;
    const data = await res.json(); return data.url || null;
  } catch { return null; }
}

// ── FileUpload mini ───────────────────────────────────────────
function FileUpload({ label, hint, accept, file, onChange, required }: {
  label: string; hint: string; accept: string;
  file: File | null; onChange: (f: File | null) => void; required?: boolean;
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={s.label}>{label} {required && <span style={{ color: "#ef4444" }}>*</span>}</label>
      <div onClick={() => document.getElementById(`fu-${label}`)?.click()} style={{
        border: `2px dashed ${file ? "#D4A017" : "rgba(255,255,255,0.15)"}`,
        borderRadius: 12, padding: "1rem", textAlign: "center", cursor: "pointer",
        background: file ? "rgba(212,160,23,0.05)" : "transparent", transition: "all 0.2s"
      }}>
        {file ? (
          <><div style={{ fontSize: "1.25rem" }}>✅</div><div style={{ color: "#D4A017", fontWeight: 600, fontSize: "0.85rem" }}>{file.name}</div><div style={{ color: "#475569", fontSize: "0.72rem" }}>{(file.size/1024).toFixed(0)} KB · Klik ganti</div></>
        ) : (
          <><div style={{ fontSize: "1.25rem" }}>📎</div><div style={{ color: "#64748b", fontSize: "0.82rem" }}>Klik untuk upload</div></>
        )}
      </div>
      {hint && <p style={{ fontSize: "0.72rem", color: "#334155", marginTop: "0.3rem" }}>{hint}</p>}
      <input id={`fu-${label}`} type="file" accept={accept} style={{ display: "none" }} onChange={e => onChange(e.target.files?.[0] || null)} />
    </div>
  );
}

// ── Level HUD ─────────────────────────────────────────────────
function LevelHUD({ level }: { level: number }) {
  const lv = LEVELS[level - 1] || LEVELS[0];
  const pct = level === 1 ? 40 : level === 2 ? 75 : 100;
  return (
    <div style={{ background: `linear-gradient(135deg, ${lv.color}14, ${lv.color}06)`, border: `1px solid ${lv.color}30`, borderRadius: 16, padding: "1.1rem 1.4rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1.1rem" }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", flexShrink: 0, background: `radial-gradient(circle at 35% 35%, ${lv.color}40, ${lv.color}10)`, border: `2px solid ${lv.color}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: `0 0 18px ${lv.color}30` }}>
        <div style={{ fontSize: "1.3rem", lineHeight: 1 }}>{lv.icon}</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
          <div><span style={{ fontSize: "0.62rem", color: lv.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Level {lv.level}</span><span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#f1f5f9", marginLeft: "0.5rem" }}>{lv.name}</span></div>
          <span style={{ fontSize: "0.72rem", color: lv.color, fontWeight: 700 }}>{pct}%</span>
        </div>
        <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: `linear-gradient(90deg, ${lv.color}80, ${lv.color})`, transition: "width 0.5s ease", boxShadow: `0 0 6px ${lv.color}50` }} />
        </div>
        <div style={{ fontSize: "0.68rem", color: "#334155", marginTop: "0.28rem" }}>
          {level < 3 ? `Selesaikan ini untuk naik Level ${level + 1} 🚀` : "✨ Profil siap! Employer bisa menemukanmu."}
        </div>
      </div>
    </div>
  );
}

// ── Level Up Splash ───────────────────────────────────────────
function LevelUpSplash({ level, onDone }: { level: number; onDone: () => void }) {
  const lv = LEVELS[level - 1] || LEVELS[LEVELS.length - 1];
  return (
    <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <div style={{ fontSize: "5rem", animation: "lvBounce 0.5s ease infinite alternate", marginBottom: "1rem" }}>{lv.icon}</div>
        <div style={{ fontSize: "0.75rem", color: lv.color, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" }}>LEVEL UP!</div>
        <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#f1f5f9", margin: "0.4rem 0" }}>Level {lv.level}</div>
        <div style={{ fontSize: "1.25rem", color: lv.color, fontWeight: 700 }}>{lv.name}</div>
        <div style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#475569" }}>+{lv.xp} XP diperoleh ✨</div>
        <div style={{ width: 120, height: 4, background: `${lv.color}25`, borderRadius: 2, margin: "1rem auto 1.5rem", overflow: "hidden" }}>
          <div style={{ height: "100%", background: lv.color, borderRadius: 2, animation: "fillBar 1s ease forwards" }} />
        </div>
        <button onClick={onDone} style={{ ...s.btnPri, width: "auto", padding: "0.75rem 2rem" }}>Lanjutkan →</button>
      </div>
      <style>{`@keyframes lvBounce{from{transform:scale(1) rotate(-6deg);}to{transform:scale(1.18) rotate(6deg);}} @keyframes fillBar{from{width:0;}to{width:100%;}}`}</style>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function JobseekerRegister() {
  const [, navigate] = useLocation();

  // State
  const [namaLengkap, setNama] = useState("");
  const [email, setEmail]      = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [checking, setChecking] = useState(false);

  // Step: 0=basic, 1=dokumen choice, 2=upload (optional), 3=submit & success
  const [step, setStep]            = useState(0);
  const [dokChoice, setDokChoice]  = useState<"sekarang" | "nanti" | "">("");
  const [foto, setFoto]            = useState<File | null>(null);
  const [cv, setCv]                = useState<File | null>(null);
  const [uploading, setUploading]  = useState(false);
  const [submitted, setSubmitted]  = useState(false);
  const [finalId, setFinalId]      = useState("");
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpTo, setLevelUpTo]  = useState(2);

  const allJobseekersQuery = trpc.event.getAllJobseekers.useQuery(undefined, { enabled: false });

  const createMutation = trpc.event.createJobseeker.useMutation({
    onSuccess: () => { toast.success("Pendaftaran berhasil!"); setSubmitted(true); },
    onError: (err) => { toast.error("Gagal mendaftar", { description: err.message }); setUploading(false); },
  });

  // Check email duplicate
  const checkEmail = async (val: string) => {
    if (!val) return;
    setChecking(true); setEmailErr("");
    try {
      const res = await allJobseekersQuery.refetch();
      const dup = (res.data || []).some((j: any) => j.email?.toLowerCase() === val.toLowerCase());
      if (dup) setEmailErr("Email ini sudah terdaftar. Gunakan email lain.");
    } catch {}
    setChecking(false);
  };

  // Level up helper
  const triggerLevelUp = (toLv: number, then: () => void) => {
    setLevelUpTo(toLv);
    setShowLevelUp(true);
    setTimeout(() => { setShowLevelUp(false); then(); }, 2200);
  };

  // Current level based on step
  const currentLevel = step === 0 ? 1 : step === 1 ? 2 : 3;

  // Submit
  const handleSubmit = async () => {
    if (uploading) return;
    setUploading(true);
    const id = generateJobseekerId({ namaLengkap, institusi: "", tahunLulus: "", isAlumniNHI: false });
    setFinalId(id);
    let fotoUrl: string | null = null;
    let cvUrl: string | null = null;
    if (dokChoice === "sekarang") {
      toast.loading("Mengupload dokumen...", { id: "ul" });
      [fotoUrl, cvUrl] = await Promise.all([
        foto ? uploadFile(foto, "foto", id) : Promise.resolve(null),
        cv   ? uploadFile(cv,   "cv",   id) : Promise.resolve(null),
      ]);
      toast.dismiss("ul");
      if (foto && !fotoUrl) { toast.error("Gagal upload foto"); setUploading(false); return; }
      if (cv && !cvUrl)     { toast.error("Gagal upload CV");   setUploading(false); return; }
    }
    createMutation.mutate({
      registrationId: id, namaLengkap, email,
      consent1: true, consent2: false,
      jenisKelamin: "Laki-laki",
      fotoUrl: fotoUrl || undefined,
      cvUrl:   cvUrl   || undefined,
    });
  };

  // ── LEVEL UP SPLASH ──
  if (showLevelUp) return <LevelUpSplash level={levelUpTo} onDone={() => setShowLevelUp(false)} />;

  // ── SUCCESS ──
  if (submitted) {
    const lv = LEVELS[dokChoice === "sekarang" && (foto || cv) ? 2 : 0];
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.25rem" }}>
        <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
          {/* Trophy */}
          <div style={{ fontSize: "4rem", marginBottom: "0.5rem" }}>🏆</div>
          <div style={{ fontSize: "0.7rem", color: lv.color, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            {dokChoice === "sekarang" ? "Level 3 — Siap Interview!" : "Level 1 — Pejuang Baru"}
          </div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0.5rem 0" }}>Berhasil Mendaftar! 🎉</h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            Selamat, <strong style={{ color: "#f1f5f9" }}>{namaLengkap}</strong>!<br />
            Kamu sudah terdaftar sebagai jobseeker GR2026.
          </p>

          {/* ID Card portrait */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.68rem", color: "#94a3b8", padding: "0.5rem 1rem 0.1rem", textAlign: "center", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>ID Card GR2026</div>
            <iframe
              srcDoc={generateIdCardHTML({ registrationId: finalId, namaLengkap, status: "Jobseeker" }).replace(/<script[\s\S]*?<\/script>/g, "")}
              style={{ width: "100%", height: 280, border: "none", display: "block" }}
              title="ID Card"
            />
          </div>

          {/* Level badge */}
          <div style={{ background: `${lv.color}12`, border: `1px solid ${lv.color}30`, borderRadius: 12, padding: "0.9rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ fontSize: "1.5rem" }}>{lv.icon}</div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "0.68rem", color: lv.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Level {lv.level} tercapai</div>
              <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: "0.88rem" }}>{lv.name}</div>
              {dokChoice === "nanti" && <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.15rem" }}>Upload dokumen nanti via portal untuk naik ke Level 3 🚀</div>}
            </div>
          </div>

          {/* Registration ID */}
          <div style={{ background: "rgba(212,160,23,0.07)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 12, padding: "1rem", marginBottom: "1.25rem", textAlign: "left" }}>
            <div style={{ fontSize: "0.7rem", color: "#D4A017", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem" }}>ID Pendaftaran</div>
            <div style={{ fontWeight: 800, color: "#D4A017", fontSize: "1.15rem", fontFamily: "monospace" }}>{finalId}</div>
            <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.4rem" }}>Simpan untuk check-in hari H · Konfirmasi ke <strong style={{ color: "#f1f5f9" }}>{email}</strong></div>
          </div>

          <button onClick={() => openIdCardForPrint({ registrationId: finalId, namaLengkap, status: "Jobseeker" })}
            style={{ ...s.btnPri, background: "linear-gradient(135deg, #0d9488, #0f766e)", marginBottom: "0.75rem" }}>
            📥 Download ID Card
          </button>
          <button onClick={() => navigate("/")} style={{ ...s.btnPri, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // ── FORM ──
  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#D4A017", cursor: "pointer", fontSize: "0.88rem" }}>← Kembali</button>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 30 }} />
        </div>
        <div style={{ fontSize: "0.78rem", color: "#334155" }}>Pendaftaran Jobseeker · GRATIS</div>
      </nav>

      <div style={s.wrap}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.1rem)", fontWeight: 800, marginBottom: "0.4rem" }}>
            Mulai <span style={{ color: "#D4A017" }}>Petualanganmu</span>
          </h1>
          <p style={{ color: "#475569", fontSize: "0.85rem" }}>GR2026 · June 8–9 · Dome NHI Bandung · <strong style={{ color: "#14b8a6" }}>GRATIS</strong></p>
        </div>

        {/* Level HUD */}
        <LevelHUD level={currentLevel} />

        {/* ── STEP 0: Nama + Email ── */}
        {step === 0 && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.75rem" }}>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#D4A017", marginBottom: "1.5rem" }}>🌱 Mulai dari sini</div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={s.label}>Nama Lengkap <span style={{ color: "#ef4444" }}>*</span></label>
              <input style={s.input} value={namaLengkap} onChange={e => setNama(e.target.value)} placeholder="Nama sesuai KTP / Kartu Mahasiswa" />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={s.label}>Email Aktif <span style={{ color: "#ef4444" }}>*</span></label>
              <input
                style={{ ...s.input, borderColor: emailErr ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.12)" }}
                type="email" value={email}
                onChange={e => { setEmail(e.target.value); setEmailErr(""); }}
                onBlur={e => checkEmail(e.target.value)}
                placeholder="contoh@email.com"
              />
              {checking && <p style={{ fontSize: "0.72rem", color: "#14b8a6", marginTop: "0.3rem" }}>⏳ Memeriksa email...</p>}
              {emailErr  && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "0.6rem 0.9rem", marginTop: "0.4rem" }}><p style={{ fontSize: "0.78rem", color: "#f87171", margin: 0 }}>⚠️ {emailErr}</p></div>}
              <p style={{ fontSize: "0.72rem", color: "#334155", marginTop: "0.35rem" }}>Konfirmasi & ID pendaftaran dikirim ke email ini</p>
            </div>

            <button
              style={{ ...s.btnPri, opacity: (namaLengkap.trim().length > 1 && email.includes("@") && !emailErr && !checking) ? 1 : 0.4 }}
              onClick={() => {
                if (!namaLengkap.trim() || !email.includes("@") || emailErr || checking) return;
                triggerLevelUp(2, () => setStep(1));
              }}>
              Lanjut — Naik Level 2 →
            </button>

            <p style={{ textAlign: "center", fontSize: "0.72rem", color: "#334155", marginTop: "1rem" }}>
              Data dilindungi UU PDP · Tidak ada spam
            </p>
          </div>
        )}

        {/* ── STEP 1: Pilihan Dokumen ── */}
        {step === 1 && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.75rem" }}>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#D4A017", marginBottom: "0.5rem" }}>📄 Dokumen Pendukung</div>
            <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.7, marginBottom: "1.75rem" }}>
              Profil dengan foto & CV lebih mudah ditemukan employer. Pilih kapan kamu mau upload:
            </p>

            <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
              {[
                { val: "sekarang" as const, icon: "⚡", title: "Upload Sekarang", desc: "Langsung naik Level 3 — Siap Interview! Foto & CV lebih menarik di mata employer.", color: "#D4A017" },
                { val: "nanti"    as const, icon: "⏰", title: "Upload Nanti",    desc: "Selesaikan dulu, upload lewat portal jobseeker kapan saja.", color: "#14b8a6" },
              ].map(opt => (
                <div key={opt.val} onClick={() => setDokChoice(opt.val)} style={{
                  border: `2px solid ${dokChoice === opt.val ? opt.color : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 14, padding: "1.25rem", cursor: "pointer",
                  background: dokChoice === opt.val ? `${opt.color}0c` : "rgba(255,255,255,0.02)",
                  transition: "all 0.2s"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "1.4rem" }}>{opt.icon}</span>
                    <span style={{ fontWeight: 700, color: dokChoice === opt.val ? opt.color : "#f1f5f9", fontSize: "0.95rem" }}>{opt.title}</span>
                    {dokChoice === opt.val && <span style={{ marginLeft: "auto", fontSize: "1rem" }}>✓</span>}
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0, lineHeight: 1.6, paddingLeft: "2.15rem" }}>{opt.desc}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setStep(0)} style={{ flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", borderRadius: 10, padding: "0.85rem", fontSize: "0.9rem", cursor: "pointer" }}>← Kembali</button>
              <button
                style={{ flex: 2, ...s.btnPri, opacity: dokChoice ? 1 : 0.4 }}
                onClick={() => {
                  if (!dokChoice) return;
                  if (dokChoice === "sekarang") { setStep(2); }
                  else { triggerLevelUp(3, () => setStep(3)); }
                }}>
                {dokChoice === "sekarang" ? "Upload Sekarang →" : dokChoice === "nanti" ? "Selesaikan Pendaftaran →" : "Pilih salah satu"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Upload Dokumen ── */}
        {step === 2 && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.75rem" }}>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#D4A017", marginBottom: "0.5rem" }}>📎 Upload Dokumen</div>
            <div style={{ background: "rgba(212,160,23,0.07)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 10, padding: "0.8rem 1rem", marginBottom: "1.5rem", fontSize: "0.8rem", color: "#D4A017" }}>
              ⚡ Upload foto & CV → langsung naik Level 3: Siap Interview!
            </div>

            <FileUpload label="Pas Foto Terbaru" hint="JPG/PNG · Maks 2MB · Foto formal" accept="image/*" file={foto} onChange={setFoto} required />
            <FileUpload label="CV / Resume (PDF)" hint="PDF · Maks 5MB · Maks 2 halaman" accept=".pdf" file={cv} onChange={setCv} required />

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", borderRadius: 10, padding: "0.85rem", fontSize: "0.9rem", cursor: "pointer" }}>← Kembali</button>
              <button
                style={{ flex: 2, ...s.btnPri, opacity: (foto && cv) ? 1 : 0.4 }}
                onClick={() => { if (!foto || !cv) return; triggerLevelUp(3, () => setStep(3)); }}>
                Lanjut — Naik Level 3 🏆
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Review & Submit ── */}
        {step === 3 && (
          <div style={{ background: "rgba(212,160,23,0.04)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 16, padding: "1.75rem" }}>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#D4A017", marginBottom: "1.25rem" }}>🏆 Final Check — Siap Submit!</div>

            {[{ label: "Nama Lengkap", val: namaLengkap }, { label: "Email", val: email }, { label: "Dokumen", val: dokChoice === "sekarang" ? `Foto: ${foto?.name || "—"} · CV: ${cv?.name || "—"}` : "Upload nanti via portal" }].map(row => (
              <div key={row.label} style={{ display: "flex", gap: "1rem", marginBottom: "0.65rem", paddingBottom: "0.65rem", borderBottom: "1px solid rgba(255,255,255,0.04)", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.78rem", color: "#64748b", minWidth: 120 }}>{row.label}</span>
                <span style={{ fontWeight: 600, color: "#f1f5f9", fontSize: "0.88rem" }}>{row.val}</span>
              </div>
            ))}

            {/* Consent mini */}
            <div style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 10, padding: "0.9rem", marginTop: "1rem", marginBottom: "1.5rem", fontSize: "0.78rem", color: "#64748b", lineHeight: 1.7 }}>
              🔒 Dengan mendaftar, kamu menyetujui profil dapat dilihat oleh employer resmi GR2026 sesuai <strong style={{ color: "#f1f5f9" }}>UU PDP No. 27/2022</strong>. Dapat ditarik kapan saja.
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setStep(dokChoice === "sekarang" ? 2 : 1)} style={{ flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", borderRadius: 10, padding: "0.85rem", fontSize: "0.9rem", cursor: "pointer" }}>← Kembali</button>
              <button style={{ flex: 2, ...s.btnPri, background: "linear-gradient(135deg, #f59e0b, #D4A017)", opacity: uploading ? 0.5 : 1 }} onClick={handleSubmit}>
                {uploading ? "⏳ Memproses..." : "🎉 Daftar Sekarang!"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
