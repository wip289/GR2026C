import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { generateJobseekerId, generateIdCardHTML, openIdCardForPrint } from "@/lib/invoiceGenerator";
import { supabase, BUCKET } from "@/lib/supabase";

// ── Constants ─────────────────────────────────────────────────
const SUMBER_OPTIONS = [
  { val: "instagram",  label: "📸 Instagram",   hasIG: true  },
  { val: "tiktok",     label: "🎵 TikTok",       hasIG: false },
  { val: "teman",      label: "👥 Teman/Keluarga",hasIG: false },
  { val: "kampus",     label: "🏫 Kampus/Dosen", hasIG: false },
  { val: "poster",     label: "🪧 Poster/Brosur", hasIG: false },
  { val: "website",    label: "🌐 Website",       hasIG: false },
  { val: "lainnya",    label: "💬 Lainnya",       hasIG: false },
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

// ── Styles ────────────────────────────────────────────────────
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

// ── Main ──────────────────────────────────────────────────────
export default function JobseekerRegister() {
  const [, navigate] = useLocation();
  const fotoInputRef = useRef<HTMLInputElement>(null);

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

  // UI state
  const [emailErr,   setEmailErr]   = useState("");
  const [checking,   setChecking]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [finalId,    setFinalId]    = useState("");

  // Foto upload state (setelah submit)
  const [showFotoStep, setShowFotoStep] = useState(false);
  const [fotoFile,     setFotoFile]     = useState<File | null>(null);
  const [fotoPreview,  setFotoPreview]  = useState<string | null>(null);
  const [uploadingFoto,setUploadingFoto]= useState(false);
  const [fotoUrl,      setFotoUrl]      = useState<string | null>(null);

  const allJobseekersQuery = trpc.event.getAllJobseekers.useQuery(undefined, { enabled: false });

  const createMutation = trpc.event.createJobseeker.useMutation({
    onSuccess: () => {
      setSubmitting(false);
      setSubmitted(true);
      setShowFotoStep(true); // langsung tanya foto
    },
    onError: (err) => {
      toast.error("Gagal mendaftar", { description: err.message });
      setSubmitting(false);
    },
  });

  const checkEmail = async (val: string) => {
    if (!val || !val.includes("@")) return;
    setChecking(true); setEmailErr("");
    try {
      const res = await allJobseekersQuery.refetch();
      const dup = (res.data || []).some((j: any) => j.email?.toLowerCase() === val.toLowerCase());
      if (dup) setEmailErr("Email ini sudah terdaftar. Silakan login.");
    } catch {}
    setChecking(false);
  };

  const canSubmit = nama.trim().length > 1
    && email.includes("@") && !emailErr && !checking
    && minat && statusKerja && tahunLulus && jurusan && sumber
    && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const id = generateJobseekerId({
      namaLengkap: nama, institusi: institusi || "",
      tahunLulus, isAlumniNHI: institusi.toLowerCase().includes("nhi"),
    });
    setFinalId(id);
    createMutation.mutate({
      registrationId: id, namaLengkap: nama, email,
      phone:    phone    || undefined,
      whatsapp: phone    || undefined,
      kota:     kota     || undefined,
      institusi: institusi || undefined,
      jurusan,
      tahunLulus,
      minatKerja: minat as any,
      statusKerja: statusKerja as any,
      sumberInfo: sumber || undefined,
      igUsername: igUser || undefined,
      consent1: true, consent2: false,
    });
  };

  // Upload foto ke server
  const handleFotoUpload = async (skip = false) => {
    if (skip) { setShowFotoStep(false); return; }
    if (!fotoFile) return;
    setUploadingFoto(true);
    toast.loading("Mengupload foto...", { id: "foto" });
    try {
      const ext  = fotoFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `jobseeker/${finalId}/foto.${ext}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, fotoFile, { upsert: true, contentType: fotoFile.type });

      if (error) throw new Error(error.message);

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const url = data.publicUrl;
      setFotoUrl(url);

      // Simpan URL ke DB
      await fetch("/api/upload/update-doc", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: finalId, type: "foto", url }),
      });
      toast.success("Foto berhasil diupload!", { id: "foto" });
    } catch (err: any) {
      console.error("[foto upload]", err);
      toast.error("Upload gagal: " + err.message, { id: "foto" });
    }
    setUploadingFoto(false);
    setShowFotoStep(false);
  };

  const sumberHasIG = SUMBER_OPTIONS.find(s => s.val === sumber)?.hasIG;

  // ── FOTO STEP ─────────────────────────────────────────────────
  if (submitted && showFotoStep) {
    return (
      <div style={{ ...css.page, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.25rem" }}>
        <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>📸</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>Tambah Foto Profil</h2>
          <p style={{ color: "#64748b", fontSize: "0.85rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            ID Card dengan foto terlihat lebih profesional di mata employer.<br/>
            <span style={{ color: "#D4A017" }}>Opsional</span> — bisa diupload nanti lewat portal.
          </p>

          {/* Preview area */}
          <div onClick={() => fotoInputRef.current?.click()} style={{
            width: 140, height: 140, borderRadius: "50%", margin: "0 auto 1.5rem",
            border: `2px dashed ${fotoFile ? "#D4A017" : "rgba(255,255,255,0.2)"}`,
            background: fotoFile ? "transparent" : "rgba(255,255,255,0.03)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", overflow: "hidden", transition: "all 0.2s",
          }}>
            {fotoPreview
              ? <img src={fotoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
              : <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "2rem" }}>📷</div>
                  <div style={{ fontSize: "0.7rem", color: "#475569", marginTop: "0.25rem" }}>Klik untuk pilih</div>
                </div>
            }
          </div>
          <input ref={fotoInputRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => {
              const f = e.target.files?.[0];
              if (!f) return;
              setFotoFile(f);
              setFotoPreview(URL.createObjectURL(f));
            }}/>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button onClick={() => handleFotoUpload(false)}
              disabled={!fotoFile || uploadingFoto}
              style={{ ...css.btnPri, opacity: fotoFile && !uploadingFoto ? 1 : 0.4 }}>
              {uploadingFoto ? "⏳ Mengupload..." : "📤 Upload Foto & Lanjut"}
            </button>
            <button onClick={() => handleFotoUpload(true)}
              style={{ ...css.btnPri, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "#64748b" }}>
              Lewati — upload nanti
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── SUCCESS SCREEN ────────────────────────────────────────────
  if (submitted && !showFotoStep) {
    const idCardParams = { registrationId: finalId, namaLengkap: nama, institusi: institusi || undefined, jurusan: jurusan || undefined, status: "Jobseeker", fotoUrl: fotoUrl || undefined };
    return (
      <div style={{ ...css.page, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.25rem" }}>
        <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "0.25rem" }}>🎉</div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0 0 0.4rem" }}>Pendaftaran Berhasil!</h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            Selamat, <strong style={{ color: "#f1f5f9" }}>{nama}</strong>!<br/>
            Kamu sudah terdaftar di GR2026.
          </p>

          {/* Banner dokumen */}
          <div style={{ background: "rgba(212,160,23,0.07)", border: "1px solid rgba(212,160,23,0.3)", borderRadius: 12, padding: "0.9rem 1.1rem", marginBottom: "1.25rem", textAlign: "left", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>💡</span>
            <div>
              <div style={{ fontWeight: 700, color: "#D4A017", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Tahukah kamu?</div>
              <div style={{ fontSize: "0.8rem", color: "#cbd5e1", lineHeight: 1.75 }}>
                HRD menyukai kandidat yang melengkapi dokumen dirinya sendiri saat registrasi dan melamar kerja. Jangan lupa lengkapi dokumen kamu di dashboard ya!
              </div>
            </div>
          </div>

          {/* ID Card preview */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.65rem", color: "#475569", padding: "0.5rem 1rem 0.1rem", textAlign: "center", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>ID Card GR2026</div>
            <iframe
              srcDoc={generateIdCardHTML(idCardParams).replace(/<script[\s\S]*?<\/script>/g, "")}
              style={{ width: "100%", height: 290, border: "none", display: "block" }}
              title="ID Card"
            />
          </div>

          {/* Registration ID */}
          <div style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.25)", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1.25rem", textAlign: "left" }}>
            <div style={{ fontSize: "0.68rem", color: "#D4A017", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.3rem" }}>Registration ID</div>
            <div style={{ fontWeight: 800, color: "#D4A017", fontSize: "1.2rem", fontFamily: "monospace" }}>{finalId}</div>
            <div style={{ marginTop: "0.75rem", background: "rgba(212,160,23,0.1)", borderRadius: 8, padding: "0.6rem 0.85rem" }}>
              <div style={{ fontSize: "0.82rem", color: "#fde68a", fontWeight: 700, marginBottom: "0.25rem" }}>
                🔑 Cara Login ke Dashboard
              </div>
              <div style={{ fontSize: "0.82rem", color: "#f1f5f9", lineHeight: 1.7 }}>
                Gunakan <strong style={{ color: "#D4A017" }}>Registration ID</strong> di atas<br/>
                + email <strong style={{ color: "#D4A017" }}>{email}</strong><br/>
                untuk masuk ke dashboard jobseeker Anda.
              </div>
            </div>
          </div>

          <button onClick={() => openIdCardForPrint(idCardParams)}
            style={{ ...css.btnPri, background: "linear-gradient(135deg,#0d9488,#0f766e)", marginBottom: "0.75rem" }}>
            📥 Download & Print ID Card
          </button>
          <button onClick={() => navigate("/jobseeker/login")}
            style={{ ...css.btnPri, marginBottom: "0.75rem" }}>
            Login ke Portal →
          </button>
          <button onClick={() => navigate("/")}
            style={{ ...css.btnPri, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b" }}>
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
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#D4A017", cursor: "pointer", fontSize: "0.88rem" }}>← Kembali</button>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 30 }}/>
        </div>
        <div style={{ fontSize: "0.75rem", color: "#334155" }}>Pendaftaran Jobseeker · GRATIS</div>
      </nav>

      <div style={css.wrap}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "clamp(1.5rem,4vw,1.9rem)", fontWeight: 800, marginBottom: "0.4rem" }}>
            Daftar sebagai <span style={{ color: "#D4A017" }}>Jobseeker</span>
          </h1>
          <p style={{ color: "#475569", fontSize: "0.83rem" }}>
            GR2026 · June 8–9 · Dome NHI Bandung · <strong style={{ color: "#14b8a6" }}>GRATIS</strong>
          </p>
        </div>

        <div style={css.card}>
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
              <p style={css.hint}>📲 Untuk info jadwal interview & pengumuman saat event</p>
            </div>
          </div>

          {/* ── Kota ── */}
          <div style={{ marginBottom: "1.1rem" }}>
            <label style={css.label}>Kota / Asal Daerah</label>
            <input style={css.input} value={kota} onChange={e => setKota(e.target.value)}
              placeholder="Contoh: Bandung, Jawa Barat"/>
          </div>

          {/* divider */}
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

          {/* ── Tahun Lulus + Program Studi ── */}
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

          {/* divider */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "1.25rem 0" }}/>

          {/* ── Sumber Info ── */}
          <div style={{ marginBottom: sumberHasIG ? "0.75rem" : "1.5rem" }}>
            <label style={css.label}>Tahu GR2026 dari mana? <span style={css.req}>*</span></label>
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

          {/* ── Consent ── */}
          <div style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.15)", borderRadius: 10, padding: "0.85rem 1rem", marginBottom: "1.5rem", fontSize: "0.75rem", color: "#475569", lineHeight: 1.7 }}>
            🔒 Dengan mendaftar, data kamu dapat dilihat oleh employer resmi GR2026 sesuai <strong style={{ color: "#94a3b8" }}>UU PDP No. 27/2022</strong>. Dapat ditarik kapan saja via portal.
          </div>

          {/* ── Submit ── */}
          <button style={{ ...css.btnPri, opacity: canSubmit ? 1 : 0.4 }}
            onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? "⏳ Mendaftarkan..." : "Daftar & Dapatkan ID Card 🎉"}
          </button>

          {!canSubmit && nama && email && (
            <p style={{ textAlign: "center", fontSize: "0.72rem", color: "#ef4444", marginTop: "0.75rem" }}>
              Lengkapi field wajib: {[
                !minat && "Minat Kerja",
                !statusKerja && "Status",
                !tahunLulus && "Tahun Lulus",
                !jurusan && "Program Studi",
                !sumber && "Sumber Info",
              ].filter(Boolean).join(", ")}
            </p>
          )}

          <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
            <span style={{ fontSize: "0.82rem", color: "#334155" }}>Sudah pernah daftar? </span>
            <button onClick={() => navigate("/jobseeker/login")}
              style={{ background: "none", border: "none", color: "#D4A017", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem", textDecoration: "underline" }}>
              Login ke portal →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
