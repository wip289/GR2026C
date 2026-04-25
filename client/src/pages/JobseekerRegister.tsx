import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { generateJobseekerId, generateIdCardHTML, openIdCardForPrint } from "@/lib/invoiceGenerator";
import { uploadToSupabase } from "@/lib/supabase";

// ── Styles ────────────────────────────────────────────────────
const css = {
  page:  { minHeight: "100vh", background: "#0a1628", fontFamily: "system-ui, sans-serif", color: "#f1f5f9" } as React.CSSProperties,
  nav:   { background: "rgba(10,22,40,0.97)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(212,160,23,0.15)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky" as const, top: 0, zIndex: 50 },
  wrap:  { maxWidth: 520, margin: "0 auto", padding: "2.5rem 1.25rem 5rem" },
  label: { display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#64748b", marginBottom: "0.4rem", textTransform: "uppercase" as const, letterSpacing: "0.07em" },
  input: { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "0.9rem 1rem", fontSize: "0.97rem", color: "#f1f5f9", outline: "none", boxSizing: "border-box" as const, transition: "border-color 0.2s" },
  row2:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" } as React.CSSProperties,
  hint:  { fontSize: "0.7rem", color: "#334155", marginTop: "0.3rem", lineHeight: 1.5 },
  btnPri:{ background: "linear-gradient(135deg, #D4A017, #B8860B)", border: "none", color: "#fff", borderRadius: 12, padding: "1rem 2rem", fontSize: "1rem", fontWeight: 700, cursor: "pointer", width: "100%", transition: "opacity 0.2s, transform 0.2s" } as React.CSSProperties,
};

export default function JobseekerRegister() {
  const [, navigate] = useLocation();

  // Form fields
  const [namaLengkap, setNama]     = useState("");
  const [email, setEmail]          = useState("");
  const [institusi, setInstitusi]  = useState("");
  const [jurusan, setJurusan]      = useState("");
  const [kota, setKota]            = useState("");

  // State
  const [emailErr, setEmailErr]    = useState("");
  const [checking, setChecking]    = useState(false);
  const [submitting, setSubmitting]= useState(false);
  const [submitted, setSubmitted]  = useState(false);
  const [finalId, setFinalId]      = useState("");

  const allJobseekersQuery = trpc.event.getAllJobseekers.useQuery(undefined, { enabled: false });

  const createMutation = trpc.event.createJobseeker.useMutation({
    onSuccess: () => {
      setSubmitting(false);
      setSubmitted(true);
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

  const canSubmit = namaLengkap.trim().length > 1
    && email.includes("@")
    && !emailErr
    && !checking
    && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const id = generateJobseekerId({
      namaLengkap,
      institusi: institusi || "",
      tahunLulus: "",
      isAlumniNHI: institusi.toLowerCase().includes("nhi"),
    });
    setFinalId(id);
    createMutation.mutate({
      registrationId: id,
      namaLengkap,
      email,
      institusi:  institusi  || undefined,
      jurusan:    jurusan    || undefined,
      kota:       kota       || undefined,
      consent1: true,
      consent2: false,
    });
  };

  // ── SUCCESS SCREEN ───────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ ...css.page, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.25rem" }}>
        <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>

          {/* Celebration */}
          <div style={{ fontSize: "3.5rem", marginBottom: "0.25rem" }}>🎉</div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0 0 0.4rem" }}>Pendaftaran Berhasil!</h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem", lineHeight: 1.7, marginBottom: "1.75rem" }}>
            Selamat, <strong style={{ color: "#f1f5f9" }}>{namaLengkap}</strong>!<br />
            Kamu sudah terdaftar di GR2026. Simpan ID & gunakan email untuk login kapan saja.
          </p>

          {/* ID Card */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.65rem", color: "#475569", padding: "0.5rem 1rem 0.1rem", textAlign: "center", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              ID Card GR2026
            </div>
            <iframe
              srcDoc={generateIdCardHTML({
                registrationId: finalId,
                namaLengkap,
                institusi:  institusi  || undefined,
                jurusan:    jurusan    || undefined,
                status:     "Jobseeker",
              }).replace(/<script[\s\S]*?<\/script>/g, "")}
              style={{ width: "100%", height: 290, border: "none", display: "block" }}
              title="ID Card"
            />
          </div>

          {/* Registration ID box */}
          <div style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.25)", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1.25rem", textAlign: "left" }}>
            <div style={{ fontSize: "0.68rem", color: "#D4A017", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.3rem" }}>Registration ID</div>
            <div style={{ fontWeight: 800, color: "#D4A017", fontSize: "1.2rem", fontFamily: "monospace", letterSpacing: "0.05em" }}>{finalId}</div>
            <div style={{ fontSize: "0.73rem", color: "#475569", marginTop: "0.4rem", lineHeight: 1.6 }}>
              Gunakan <strong style={{ color: "#f1f5f9" }}>{email}</strong> + ID ini untuk login.<br />
              Upload CV, foto, dan dokumen lain kapan saja kamu siap — tidak wajib sekarang.
            </div>
          </div>

          {/* Level badge */}
          <div style={{ background: "rgba(100,116,139,0.1)", border: "1px solid rgba(100,116,139,0.2)", borderRadius: 10, padding: "0.85rem 1.1rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem", textAlign: "left" }}>
            <div style={{ fontSize: "1.5rem" }}>🌱</div>
            <div>
              <div style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Level 1 · Pejuang Baru</div>
              <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.15rem" }}>
                Login & upload CV/foto untuk naik ke Level 3 — <span style={{ color: "#D4A017" }}>Siap Interview</span> 🏆
              </div>
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={() => openIdCardForPrint({ registrationId: finalId, namaLengkap, institusi: institusi || undefined, jurusan: jurusan || undefined, status: "Jobseeker" })}
            style={{ ...css.btnPri, background: "linear-gradient(135deg, #0d9488, #0f766e)", marginBottom: "0.75rem" }}>
            📥 Download ID Card
          </button>
          <button
            onClick={() => navigate("/jobseeker/login")}
            style={{ ...css.btnPri, marginBottom: "0.75rem" }}>
            Login ke Portal Jobseeker →
          </button>
          <button
            onClick={() => navigate("/")}
            style={{ ...css.btnPri, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b" }}>
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // ── FORM ─────────────────────────────────────────────────────
  return (
    <div style={css.page}>
      <nav style={css.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#D4A017", cursor: "pointer", fontSize: "0.88rem" }}>← Kembali</button>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 30 }} />
        </div>
        <div style={{ fontSize: "0.75rem", color: "#334155" }}>Pendaftaran Jobseeker · GRATIS</div>
      </nav>

      <div style={css.wrap}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "clamp(1.6rem,4vw,2rem)", fontWeight: 800, marginBottom: "0.4rem" }}>
            Daftar sebagai <span style={{ color: "#D4A017" }}>Jobseeker</span>
          </h1>
          <p style={{ color: "#475569", fontSize: "0.85rem" }}>
            GR2026 · June 8–9 · Dome NHI Bandung ·{" "}
            <strong style={{ color: "#14b8a6" }}>GRATIS</strong>
          </p>
        </div>

        {/* Form card */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "2rem" }}>

          {/* Nama */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={css.label}>Nama Lengkap <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              style={css.input}
              value={namaLengkap}
              onChange={e => setNama(e.target.value)}
              placeholder="Nama sesuai KTP / Kartu Mahasiswa"
              autoComplete="name"
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={css.label}>Email Aktif <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              style={{ ...css.input, borderColor: emailErr ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)" }}
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailErr(""); }}
              onBlur={e => checkEmail(e.target.value)}
              placeholder="contoh@email.com"
              autoComplete="email"
            />
            {checking && <p style={{ ...css.hint, color: "#14b8a6" }}>⏳ Memeriksa email...</p>}
            {emailErr && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "0.6rem 0.9rem", marginTop: "0.4rem" }}>
                <p style={{ fontSize: "0.78rem", color: "#f87171", margin: 0 }}>⚠️ {emailErr}
                  {emailErr.includes("login") && (
                    <button onClick={() => navigate("/jobseeker/login")} style={{ marginLeft: "0.5rem", background: "none", border: "none", color: "#D4A017", cursor: "pointer", fontWeight: 700, fontSize: "0.78rem", textDecoration: "underline" }}>Login →</button>
                  )}
                </p>
              </div>
            )}
            <p style={css.hint}>Dipakai untuk login ke portal jobseeker</p>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "1.5rem 0", position: "relative" }}>
            <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#0d1f35", padding: "0 0.75rem", fontSize: "0.7rem", color: "#334155", textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
              Opsional — isi jika mau
            </span>
          </div>

          {/* Institusi + Jurusan */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={css.label}>Asal Institusi / Universitas</label>
            <input
              style={css.input}
              value={institusi}
              onChange={e => setInstitusi(e.target.value)}
              placeholder="Contoh: Politeknik Pariwisata NHI Bandung"
            />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={css.label}>Program Studi / Jurusan</label>
            <input
              style={css.input}
              value={jurusan}
              onChange={e => setJurusan(e.target.value)}
              placeholder="Contoh: D4 Manajemen Perhotelan"
            />
          </div>

          {/* Kota */}
          <div style={{ marginBottom: "2rem" }}>
            <label style={css.label}>Kota / Asal Daerah</label>
            <input
              style={css.input}
              value={kota}
              onChange={e => setKota(e.target.value)}
              placeholder="Contoh: Bandung, Jawa Barat"
            />
          </div>

          {/* Info consent mini */}
          <div style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.15)", borderRadius: 10, padding: "0.85rem 1rem", marginBottom: "1.5rem", fontSize: "0.75rem", color: "#475569", lineHeight: 1.7 }}>
            🔒 Dengan mendaftar, kamu menyetujui data dapat dilihat oleh employer resmi GR2026 sesuai{" "}
            <strong style={{ color: "#94a3b8" }}>UU PDP No. 27/2022</strong>.
            Dapat ditarik kapan saja via portal.
          </div>

          {/* Submit */}
          <button
            style={{ ...css.btnPri, opacity: canSubmit ? 1 : 0.4, transform: canSubmit ? "none" : "none" }}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? "⏳ Mendaftarkan..." : "Daftar & Dapatkan ID Card 🎉"}
          </button>

          {/* Login link */}
          <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
            <span style={{ fontSize: "0.82rem", color: "#334155" }}>Sudah pernah daftar? </span>
            <button onClick={() => navigate("/jobseeker/login")} style={{ background: "none", border: "none", color: "#D4A017", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem", textDecoration: "underline" }}>
              Login ke portal →
            </button>
          </div>
        </div>

        {/* Bottom note */}
        <p style={{ textAlign: "center", fontSize: "0.72rem", color: "#1e3a5f", marginTop: "1.5rem", lineHeight: 1.6 }}>
          Upload CV, foto, dan dokumen lain bisa dilakukan kapan saja setelah login.<br />
          Tidak ada yang diwajibkan — semua bisa dilengkapi di waktu yang tepat untukmu.
        </p>

      </div>
    </div>
  );
}

