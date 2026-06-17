import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import ApplyConfirmDialog from "@/components/VirtualPhase/ApplyConfirmDialog";

// ─── Session helper (sama dengan pola JobseekerLogin/Dashboard) ───
type JsSession = { registrationId: string; email: string };

function readSession(): JsSession | null {
  try {
    const raw = localStorage.getItem("jobseeker_session");
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s?.registrationId && s?.email) return s;
    return null;
  } catch {
    return null;
  }
}

// ─── Styles ───
const GOLD = "#D4A017";
const s = {
  page: { minHeight: "100vh", background: "#0a1628", fontFamily: "system-ui, sans-serif", color: "#f1f5f9" } as React.CSSProperties,
  container: { maxWidth: 1100, margin: "0 auto", padding: "1.5rem 1rem 4rem" } as React.CSSProperties,
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,160,23,0.18)", borderRadius: 16, overflow: "hidden" } as React.CSSProperties,
  input: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "0.65rem 0.9rem", fontSize: "0.9rem", color: "#f1f5f9", outline: "none" } as React.CSSProperties,
  btnGold: { background: `linear-gradient(135deg, ${GOLD}, #B8860B)`, border: "none", color: "#fff", borderRadius: 10, padding: "0.6rem 1.1rem", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer" } as React.CSSProperties,
  btnGhost: { background: "transparent", border: "1px solid rgba(212,160,23,0.35)", color: GOLD, borderRadius: 10, padding: "0.55rem 1rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
  btnDisabled: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", borderRadius: 10, padding: "0.6rem 1.1rem", fontSize: "0.88rem", fontWeight: 600, cursor: "not-allowed" } as React.CSSProperties,
  label: { display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.35rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
};

export default function VirtualGallery() {
  const [, navigate] = useLocation();
  const [session, setSession] = useState<JsSession | null>(() => readSession());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ emp: any; pos: any } | null>(null);

  // ─── Data ───
  const statusQ = trpc.event.getVirtualPhaseStatus.useQuery(undefined, { refetchOnWindowFocus: false });
  const galleryQ = trpc.event.getVirtualGallery.useQuery(undefined, { refetchOnWindowFocus: false });

  const profileQ = trpc.event.loginJobseeker.useQuery(
    session ?? { registrationId: "", email: "" },
    { enabled: !!session, retry: false, refetchOnWindowFocus: false }
  );
  const profile = session ? profileQ.data ?? null : null;

  const myAppsQ = trpc.event.getMyVirtualApplications.useQuery(
    session ?? { registrationId: "", email: "" },
    { enabled: !!session && !!profile, retry: false, refetchOnWindowFocus: false }
  );
  const appliedPositionIds = useMemo(
    () => new Set((myAppsQ.data ?? []).map((a: any) => a.positionId).filter(Boolean)),
    [myAppsQ.data]
  );

  const applyMut = trpc.event.createVirtualApplication.useMutation();

  // ─── Phase status ───
  const status = statusQ.data;
  const ended = useMemo(() => {
    if (!status?.endDate) return false;
    return Date.now() > new Date(status.endDate + "T23:59:59+07:00").getTime();
  }, [status]);
  const phaseActive = !!status?.isActive;

  // Tier: 0 = tidak ada foto, 1 = foto saja, 2 = foto + CV (boleh kirim CV)
  const tier = !profile ? 0 : profile.fotoUrl ? (profile.cvUrl ? 2 : 1) : 1;

  // ─── Filter options & filtered list ───
  const gallery = galleryQ.data ?? [];
  const industries = useMemo(
    () => Array.from(new Set(gallery.map((e: any) => e.industry).filter(Boolean))).sort(),
    [gallery]
  );
  const cities = useMemo(
    () => Array.from(new Set(gallery.map((e: any) => e.city).filter(Boolean))).sort(),
    [gallery]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return gallery.filter((emp: any) => {
      if (industryFilter && emp.industry !== industryFilter) return false;
      if (cityFilter && emp.city !== cityFilter) return false;
      if (!q) return true;
      const inCompany = (emp.companyName ?? "").toLowerCase().includes(q);
      const inPosition = (emp.positions ?? []).some((p: any) => (p.positionName ?? "").toLowerCase().includes(q));
      return inCompany || inPosition;
    });
  }, [gallery, search, industryFilter, cityFilter]);

  // ─── Logout ───
  const handleLogout = () => {
    localStorage.removeItem("jobseeker_session");
    setSession(null);
    toast.success("Berhasil keluar");
  };

  // ─── Apply ───
  const handleApply = async (emp: any, pos: any) => {
    if (!session || !profile) {
      setShowLogin(true);
      return;
    }
    if (tier < 2) {
      toast.error("Upload CV terlebih dahulu untuk melamar", {
        description: "Lengkapi CV kamu di dashboard, lalu kembali ke halaman ini.",
        action: { label: "Ke Dashboard", onClick: () => navigate("/jobseeker/dashboard") },
      });
      return;
    }
    setApplyingId(pos.id);
    try {
      const result = await applyMut.mutateAsync({
        registrationId: session.registrationId,
        email: session.email,
        positionId: pos.id,
        employerBookingId: emp.bookingId,
      });

      if (result.mechanism === "B" && result.virtualPicWhatsapp) {
        let wa = String(result.virtualPicWhatsapp).replace(/\D/g, "");
        if (wa.startsWith("0")) wa = "62" + wa.slice(1);
        const msg = encodeURIComponent(
          `Halo ${result.virtualPicName ?? "Tim HR"}, saya ${profile.namaLengkap}, ` +
          `lulusan ${profile.institusi ?? "-"} jurusan ${profile.jurusan ?? "-"}. ` +
          `Saya tertarik dengan posisi ${result.positionName} di ${emp.companyName} ` +
          `melalui Grand Recruitment 2026 Virtual Phase.`
        );
        window.open(`https://wa.me/${wa}?text=${msg}`, "_blank");
        toast.success("CV terkirim! Lanjutkan percakapan di WhatsApp.");
      } else if (result.mechanism === "C" && result.externalUrl) {
        window.open(result.externalUrl, "_blank");
        toast.success("CV terkirim! Lengkapi lamaran di halaman perusahaan.");
      } else {
        toast.success(`CV terkirim ke ${emp.companyName}!`, {
          description: "Perusahaan akan melihat profil dan CV kamu.",
        });
      }
      myAppsQ.refetch();
      galleryQ.refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Gagal mengirim lamaran, coba lagi.");
    }
    setApplyingId(null);
    setConfirmTarget(null);
  };

  // ─── Apply button per posisi ───
  const renderApplyButton = (emp: any, pos: any) => {
    if (!phaseActive) {
      return <button style={s.btnDisabled} disabled>{ended ? "Periode Berakhir" : "Segera Dibuka"}</button>;
    }
    if (appliedPositionIds.has(pos.id)) {
      return (
        <button style={{ ...s.btnDisabled, color: "#4ade80", borderColor: "rgba(74,222,128,0.3)" }} disabled>
          ✓ Sudah Kirim CV
        </button>
      );
    }
    if (emp.isAcceptingApplications === false) {
      return (
        <button style={{ ...s.btnDisabled, color: "#f87171", borderColor: "rgba(248,113,113,0.3)" }} disabled>
          Tidak Menerima Lamaran
        </button>
      );
    }
    if (!session || !profile) {
      return <button style={s.btnGhost} onClick={() => setShowLogin(true)}>Masuk untuk Kirim CV</button>;
    }
    if (tier < 2) {
      return (
        <button style={s.btnGhost} onClick={() => navigate("/jobseeker/dashboard")}>
          Upload CV Dulu
        </button>
      );
    }
    return (
      <button style={{ ...s.btnGold, opacity: applyingId === pos.id ? 0.6 : 1 }}
        disabled={applyingId === pos.id}
        onClick={() => setConfirmTarget({ emp, pos })}>
        {applyingId === pos.id ? "Mengirim..." : "Kirim CV"}
      </button>
    );
  };

  return (
    <div style={s.page}>
      {/* ─── Header ─── */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(10,22,40,0.95)", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ ...s.container, padding: "0.9rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }} onClick={() => navigate("/")}>
            <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 34 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", lineHeight: 1.2 }}>
                GR2026 <span style={{ color: GOLD }}>Virtual</span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Online Job Fair</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {profile ? (
              <>
                <span style={{ fontSize: "0.82rem", color: "#94a3b8", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  👋 {profile.namaLengkap}
                </span>
                <button style={{ ...s.btnGhost, padding: "0.4rem 0.8rem", fontSize: "0.78rem" }} onClick={() => navigate("/jobseeker/dashboard")}>Dashboard Saya</button>
                <button style={{ ...s.btnGhost, padding: "0.4rem 0.8rem", fontSize: "0.78rem" }} onClick={handleLogout}>Keluar</button>
              </>
            ) : (
              <button style={{ ...s.btnGhost, padding: "0.45rem 0.9rem" }} onClick={() => setShowLogin(true)}>Masuk</button>
            )}
          </div>
        </div>
      </div>

      <div style={s.container}>
        {/* ─── Hero + countdown banner ─── */}
        <div style={{ textAlign: "center", margin: "1.5rem 0 1.75rem" }}>
          <h1 style={{ fontSize: "1.7rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            Cari Kerja di <span style={{ color: GOLD }}>Grand Recruitment 2026</span>
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.92rem", maxWidth: 560, margin: "0 auto" }}>
            Lowongan dari perusahaan hospitality & pariwisata peserta GR2026 — kirim CV langsung secara online.
          </p>
        </div>

        {statusQ.isLoading ? null : phaseActive ? (
          <div style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", borderRadius: 12, padding: "0.8rem 1.2rem", textAlign: "center", marginBottom: "1.5rem", fontSize: "0.88rem" }}>
            ⏳ Periode lamaran berakhir dalam <strong style={{ color: GOLD }}>{status?.daysLeft} hari</strong>
            {status?.endDate ? <span style={{ color: "#94a3b8" }}> (s.d. {status.endDate})</span> : null}
          </div>
        ) : ended ? (
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "0.8rem 1.2rem", textAlign: "center", marginBottom: "1.5rem", fontSize: "0.88rem", color: "#94a3b8" }}>
            Periode lamaran telah berakhir{status?.endDate ? ` pada ${status.endDate}` : ""}. Lowongan masih bisa dilihat.
          </div>
        ) : (
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 12, padding: "0.8rem 1.2rem", textAlign: "center", marginBottom: "1.5rem", fontSize: "0.88rem", color: "#94a3b8" }}>
            🔜 Virtual Phase <strong style={{ color: GOLD }}>segera dibuka</strong> — pantau halaman ini ya!
          </div>
        )}

        {/* ─── Filter bar ─── */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginBottom: "1.5rem" }}>
          <input style={{ ...s.input, flex: "2 1 220px" }} placeholder="Cari perusahaan atau posisi..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <select style={{ ...s.input, flex: "1 1 150px" }} value={industryFilter} onChange={e => setIndustryFilter(e.target.value)}>
            <option value="">Semua Industri</option>
            {industries.map((i: any) => <option key={i} value={i}>{i}</option>)}
          </select>
          <select style={{ ...s.input, flex: "1 1 150px" }} value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
            <option value="">Semua Kota</option>
            {cities.map((c: any) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* ─── Gallery ─── */}
        {galleryQ.isLoading ? (
          <p style={{ textAlign: "center", color: "#64748b", padding: "3rem 0" }}>Memuat daftar perusahaan...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: "#64748b", padding: "3rem 1rem" }}>
            {gallery.length === 0
              ? "Daftar perusahaan akan segera tampil di sini. Nantikan ya!"
              : "Tidak ada perusahaan yang cocok dengan pencarian kamu."}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))", gap: "1rem" }}>
            {filtered.map((emp: any) => {
              const isOpen = expanded === emp.bookingId;
              return (
                <div key={emp.bookingId} style={{ ...s.card, gridColumn: isOpen ? "1 / -1" : undefined }}>
                  {/* Card header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", padding: "1.1rem", cursor: "pointer" }}
                    onClick={() => setExpanded(isOpen ? null : emp.bookingId)}>
                    <div style={{ width: 52, height: 52, borderRadius: 12, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                      {emp.logoUrl
                        ? <img src={emp.logoUrl} alt={emp.companyName} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        : <span style={{ fontSize: "1.3rem" }}>🏢</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.3 }}>{emp.companyName}</div>
                      <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                        {[emp.industry, emp.city].filter(Boolean).join(" · ") || "—"}
                      </div>
                      <div style={{ fontSize: "0.76rem", color: GOLD, marginTop: 2 }}>
                        {(() => {
                          const positions = emp.positions ?? [];
                          const normalCount = positions.filter((p: any) => !p.isPlaceholder).length;
                          const hasPlaceholder = positions.some((p: any) => p.isPlaceholder);
                          if (normalCount > 0) return `${normalCount} posisi dibuka`;
                          if (hasPlaceholder) return "Lamar via website resmi";
                          return "Belum ada posisi";
                        })()}
                      </div>
                      {emp.isAcceptingApplications === false && (
                        <div style={{ fontSize: "0.72rem", color: "#f87171", marginTop: 4, padding: "3px 8px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 6, display: "inline-block" }}>
                          🔴 Lowongan Ditutup Sementara, silahkan cek kembali nanti
                        </div>
                      )}
                    </div>
                    <span style={{ color: "#64748b", fontSize: "0.85rem" }}>{isOpen ? "▲" : "▼"}</span>
                  </div>

                  {/* Positions */}
                  {isOpen && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                      {(emp.positions ?? []).length === 0 ? (
                        <p style={{ padding: "1rem 1.1rem", color: "#64748b", fontSize: "0.85rem" }}>Belum ada posisi terdaftar.</p>
                      ) : emp.positions.map((pos: any) => (
                        pos.isPlaceholder ? (
                          <div key={pos.id} style={{ padding: "1.25rem 1.1rem", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(212,160,23,0.03)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.5rem" }}>
                              <span style={{ fontSize: "1.1rem" }}>🔗</span>
                              <div style={{ fontWeight: 700, fontSize: "0.92rem", color: GOLD }}>{pos.positionName}</div>
                            </div>
                            {pos.requirements && (
                              <div style={{ fontSize: "0.82rem", color: "#cbd5e1", marginBottom: "0.85rem", lineHeight: 1.55 }}>
                                {pos.requirements}
                              </div>
                            )}
                            <div>{renderApplyButton(emp, pos)}</div>
                          </div>
                        ) : (
                          <div key={pos.id} style={{ padding: "1rem 1.1rem", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>{pos.positionName}</div>
                              <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 2 }}>
                                Butuh {pos.headcount} orang · 📍 {pos.location}
                                {pos.applicantCount > 0 && <span style={{ color: GOLD }}> · {pos.applicantCount} pelamar</span>}
                              </div>
                              {pos.requirements && (
                                <div style={{ fontSize: "0.8rem", color: "#cbd5e1", marginTop: "0.4rem", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                                  {pos.requirements}
                                </div>
                              )}
                            </div>
                            <div style={{ flexShrink: 0 }}>{renderApplyButton(emp, pos)}</div>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Info pendaftaran baru ─── */}
        <div style={{ textAlign: "center", marginTop: "2.5rem", padding: "1.2rem", background: "rgba(212,160,23,0.05)", border: "1px solid rgba(212,160,23,0.15)", borderRadius: 14 }}>
          <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.6 }}>
            <strong style={{ color: "#f1f5f9" }}>Sudah terdaftar di GR2026?</strong> Klik tombol <strong style={{ color: GOLD }}>Masuk</strong> dan langsung kirim CV.<br />
            {phaseActive
              ? <>Belum punya akun? <button onClick={() => navigate("/virtual/register")} style={{ background: "none", border: "none", color: GOLD, cursor: "pointer", fontWeight: 700, fontSize: "0.85rem", textDecoration: "underline", padding: 0 }}>Daftar baru di sini →</button></>
              : <>Belum punya akun? Pendaftaran baru <strong style={{ color: GOLD }}>segera dibuka</strong> di halaman ini.</>}
          </p>
        </div>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "0.85rem" }}>
            ← Kembali ke Beranda
          </button>
        </div>
      </div>

      {/* ─── Login modal ─── */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={(sess) => {
            localStorage.setItem("jobseeker_session", JSON.stringify(sess));
            setSession(sess);
            setShowLogin(false);
          }}
        />
      )}

      {/* ─── Konfirmasi kirim lamaran ─── */}
      <ApplyConfirmDialog
        open={!!confirmTarget}
        positionName={confirmTarget?.pos?.positionName ?? ""}
        companyName={confirmTarget?.emp?.companyName ?? ""}
        mechanism={confirmTarget?.emp?.mechanism ?? null}
        isPending={applyingId !== null}
        onCancel={() => { if (applyingId === null) setConfirmTarget(null); }}
        onConfirm={() => confirmTarget && handleApply(confirmTarget.emp, confirmTarget.pos)}
      />
    </div>
  );
}

// ─── Login modal: pola sama dengan JobseekerLogin ───
function LoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (s: JsSession) => void }) {
  const [registrationId, setRegistrationId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const loginQuery = trpc.event.loginJobseeker.useQuery(
    { registrationId: registrationId.trim().toUpperCase(), email: email.trim().toLowerCase() },
    { enabled: false, retry: false }
  );

  const handleLogin = async () => {
    if (!registrationId.trim() || !email.trim()) {
      toast.error("Isi Registration ID dan Email terlebih dahulu");
      return;
    }
    setLoading(true);
    try {
      const result = await loginQuery.refetch();
      if (!result.data) {
        toast.error("Registration ID atau Email tidak sesuai", {
          description: "Pastikan ID dan email sama dengan saat pendaftaran",
        });
        setLoading(false);
        return;
      }
      toast.success(`Selamat datang, ${result.data.namaLengkap}!`);
      onSuccess({
        registrationId: registrationId.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
      });
    } catch {
      toast.error("Terjadi kesalahan, coba lagi");
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={onClose}>
      <div style={{ background: "#0f1d33", border: "1px solid rgba(212,160,23,0.25)", borderRadius: 18, padding: "1.8rem", maxWidth: 420, width: "100%" }}
        onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "0.35rem" }}>
          Masuk untuk <span style={{ color: GOLD }}>Kirim CV</span>
        </h2>
        <p style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "1.25rem" }}>
          Gunakan Registration ID & email yang sama dengan saat kamu mendaftar GR2026.
        </p>

        <div style={{ marginBottom: "1rem" }}>
          <label style={s.label}>Registration ID</label>
          <input style={{ ...s.input, width: "100%" }} value={registrationId}
            onChange={e => setRegistrationId(e.target.value)}
            placeholder="Contoh: JS55050533"
            onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        <div style={{ marginBottom: "1.4rem" }}>
          <label style={s.label}>Email</label>
          <input style={{ ...s.input, width: "100%" }} type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email saat mendaftar"
            onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>

        <button style={{ ...s.btnGold, width: "100%", padding: "0.8rem", opacity: loading ? 0.7 : 1 }}
          onClick={handleLogin} disabled={loading}>
          {loading ? "Memverifikasi..." : "Masuk →"}
        </button>

        <p style={{ fontSize: "0.76rem", color: "#64748b", marginTop: "1rem", textAlign: "center", lineHeight: 1.5 }}>
          Belum punya akun?{" "}
          <a href="/virtual/register" style={{ color: GOLD, fontWeight: 700, textDecoration: "underline" }}>Daftar baru di sini →</a>
        </p>

        <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "0.8rem" }}>
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
