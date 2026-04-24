import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// ── Types ─────────────────────────────────────────────────────
interface EventConfig {
  // Info Event
  eventName: string;
  eventSubtitle: string;
  eventDate1: string;
  eventDate2: string;
  eventYear: string;
  locationName: string;
  locationAddress: string;
  openTime: string;
  closeTime: string;
  logoUrl: string;
  // Venue
  venueName: string;
  venueAddress: string;
  venueCity: string;
  venueCapacity: string;
  venueArea: string;
  venueFacilities: string;
  // Booth
  mainBoothPrice: string;
  mainBoothSize: string;
  mainBoothCount: string;
  stdBoothPrice: string;
  stdBoothSize: string;
  stdBoothCount: string;
  interviewBoothCount: string;
  // Payment
  paymentDeadlineDays: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  // Contact
  whatsappNumber: string;
  email: string;
  // Dates
  registrationOpenDate: string;
  registrationCloseDate: string;
  employerRegOpenDate: string;
  employerRegCloseDate: string;
  jobseekerRegOpenDate: string;
  jobseekerRegCloseDate: string;
  paymentDeadlineDate: string;
  allowWalkIn: string;
}

const DEFAULT_CONFIG: EventConfig = {
  eventName: "Grand Recruitment 2026",
  eventSubtitle: "The International Hospitality and Tourism Job Fair",
  eventDate1: "2026-06-08",
  eventDate2: "2026-06-09",
  eventYear: "2026",
  locationName: "Gedung Dome NHI Bandung",
  locationAddress: "Politeknik Pariwisata NHI Bandung, Jl. Dr. Setiabudi No. 186, Bandung",
  openTime: "08.00",
  closeTime: "17.00",
  logoUrl: "/logo-gr2026.png",
  venueName: "Gedung Dome Poltekpar NHI Bandung",
  venueAddress: "Jl. Dr. Setiabudi No. 186",
  venueCity: "Bandung, Jawa Barat",
  venueCapacity: "3000",
  venueArea: "2500",
  venueFacilities: "AC, Sound System, Lighting, WiFi, Parkir, Musholla, Toilet",
  mainBoothPrice: "10000000",
  mainBoothSize: "5x5",
  mainBoothCount: "12",
  stdBoothPrice: "7500000",
  stdBoothSize: "3x3",
  stdBoothCount: "38",
  interviewBoothCount: "10",
  paymentDeadlineDays: "7",
  bankName: "Bank BNI",
  bankAccount: "0123-456-789",
  bankAccountName: "Koperasi Poltekpar NHI Bandung",
  whatsappNumber: "0812-xxxx-xxxx",
  email: "grandrecruitment@nhi.ac.id",
  registrationOpenDate: "2026-03-01",
  registrationCloseDate: "2026-05-31",
  employerRegOpenDate: "2026-03-01",
  employerRegCloseDate: "2026-05-31",
  jobseekerRegOpenDate: "2026-03-01",
  jobseekerRegCloseDate: "2026-06-07",
  paymentDeadlineDate: "2026-05-31",
  allowWalkIn: "true",
};

const STORAGE_KEY = "gr2026_superadmin_config";

const loadConfig = (): EventConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_CONFIG;
};

// Convert flat config record to EventConfig
const recordToConfig = (record: Record<string, string>): EventConfig => {
  return { ...DEFAULT_CONFIG, ...record } as EventConfig;
};

// ── Styles ─────────────────────────────────────────────────────
const s = {
  page:   { minHeight: "100vh", background: "#080e1a", fontFamily: "system-ui, sans-serif", color: "#f1f5f9" } as React.CSSProperties,
  nav:    { background: "rgba(8,14,26,0.98)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(239,68,68,0.3)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky" as const, top: 0, zIndex: 50 },
  wrap:   { maxWidth: 1000, margin: "0 auto", padding: "2rem 1.25rem" },
  card:   { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" },
  secHd:  (color: string) => ({ fontSize: "0.9rem", fontWeight: 700, color, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem", paddingBottom: "0.75rem", borderBottom: `1px solid ${color}25` }),
  label:  { display: "block", fontSize: "0.75rem", color: "#64748b", marginBottom: "0.3rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  input:  { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "0.65rem 1rem", fontSize: "0.9rem", color: "#f1f5f9", outline: "none" },
  row2:   { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,280px),1fr))", gap: "1rem", marginBottom: "1rem" },
  row3:   { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,180px),1fr))", gap: "1rem", marginBottom: "1rem" },
};

// ── Login screen ───────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [, navigate] = useLocation();
  const [pw, setPw] = useState("");
  const ADMIN_PW = "GR2026@Admin"; // Change this in production

  const handleLogin = () => {
    if (pw === ADMIN_PW) {
      sessionStorage.setItem("sa_auth", "1");
      onLogin();
    } else {
      toast.error("Password salah");
    }
  };

  return (
    <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 400, padding: "2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔐</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ef4444", marginBottom: "0.25rem" }}>Superadmin</h1>
          <p style={{ color: "#475569", fontSize: "0.85rem" }}>Grand Recruitment 2026 — Platform Config</p>
        </div>
        <div style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: "2rem" }}>
          <label style={s.label}>Password</label>
          <input style={{ ...s.input, marginBottom: "1.25rem" }} type="password" value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="Masukkan password superadmin" autoFocus/>
          <button onClick={handleLogin}
            style={{ width: "100%", background: "linear-gradient(135deg,#dc2626,#b91c1c)", border: "none", color: "#fff", borderRadius: 10, padding: "0.85rem", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer" }}>
            Masuk →
          </button>
          <button onClick={() => navigate("/")}
            style={{ width: "100%", background: "transparent", border: "none", color: "#475569", padding: "0.6rem", fontSize: "0.82rem", cursor: "pointer", marginTop: "0.5rem" }}>
            ← Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Data Management Component ────────────────────────────────
function DataManagement() {
  const [tab, setTab] = useState<"employer" | "jobseeker">("employer");
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const bookingsQuery   = trpc.event.getAllEmployerBookings.useQuery();
  const jobseekersQuery = trpc.event.getAllJobseekers.useQuery();

  const deleteBooking     = trpc.event.deleteEmployerBooking.useMutation({ onSuccess: () => { toast.success("Booking dihapus"); bookingsQuery.refetch(); } });
  const deleteAllBookings = trpc.event.deleteAllEmployerBookings.useMutation({ onSuccess: () => { toast.success("Semua booking dihapus — semua booth tersedia kembali!"); bookingsQuery.refetch(); setConfirmAction(null); } });
  const deleteJS          = trpc.event.deleteJobseeker.useMutation({ onSuccess: () => { toast.success("Jobseeker dihapus"); jobseekersQuery.refetch(); } });
  const deleteAllJS       = trpc.event.deleteAllJobseekers.useMutation({ onSuccess: () => { toast.success("Semua data jobseeker dihapus!"); jobseekersQuery.refetch(); setConfirmAction(null); } });
  const updateStatus      = trpc.event.updateEmployerBookingStatus.useMutation({ onSuccess: () => bookingsQuery.refetch() });

  const bookings   = (bookingsQuery.data   || []) as any[];
  const jsList     = (jobseekersQuery.data  || []) as any[];

  const statusColor: Record<string, string> = { pending:"#f97316", confirmed:"#14b8a6", rejected:"#ef4444" };
  const statusLabel: Record<string, string> = { pending:"Menunggu", confirmed:"Confirmed", rejected:"Ditolak" };

  return (
    <div>
      {/* Confirm dialog */}
      {confirmAction && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
          <div style={{ background:"#0d1f35", border:"1px solid rgba(239,68,68,0.4)", borderRadius:16, padding:"2rem", maxWidth:420, width:"100%", textAlign:"center" }}>
            <div style={{ fontSize:"2.5rem", marginBottom:"0.5rem" }}>⚠️</div>
            <h3 style={{ color:"#ef4444", marginBottom:"0.75rem" }}>Konfirmasi Hapus</h3>
            <p style={{ color:"#94a3b8", fontSize:"0.88rem", lineHeight:1.7, marginBottom:"1.5rem" }}>
              {confirmAction === "all-bookings"
                ? "Hapus SEMUA data pemesanan booth? Semua booth akan kembali tersedia. Tindakan ini tidak bisa dibatalkan."
                : "Hapus SEMUA data jobseeker? Tindakan ini tidak bisa dibatalkan."}
            </p>
            <div style={{ display:"flex", gap:"0.75rem", justifyContent:"center" }}>
              <button onClick={() => setConfirmAction(null)}
                style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.15)", color:"#64748b", borderRadius:8, padding:"0.6rem 1.5rem", cursor:"pointer", fontWeight:600 }}>
                Batal
              </button>
              <button onClick={() => confirmAction === "all-bookings" ? deleteAllBookings.mutate() : deleteAllJS.mutate()}
                style={{ background:"linear-gradient(135deg,#dc2626,#b91c1c)", border:"none", color:"#fff", borderRadius:8, padding:"0.6rem 1.5rem", cursor:"pointer", fontWeight:700 }}>
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.5rem" }}>
        <button onClick={() => setTab("employer")}
          style={{ padding:"0.5rem 1.25rem", borderRadius:8, border:`1px solid ${tab==="employer"?"#14b8a6":"rgba(255,255,255,0.1)"}`, background:tab==="employer"?"rgba(20,184,166,0.12)":"transparent", color:tab==="employer"?"#14b8a6":"#64748b", fontWeight:600, fontSize:"0.85rem", cursor:"pointer" }}>
          🏢 Employer Bookings ({bookings.length})
        </button>
        <button onClick={() => setTab("jobseeker")}
          style={{ padding:"0.5rem 1.25rem", borderRadius:8, border:`1px solid ${tab==="jobseeker"?"#D4A017":"rgba(255,255,255,0.1)"}`, background:tab==="jobseeker"?"rgba(212,160,23,0.12)":"transparent", color:tab==="jobseeker"?"#D4A017":"#64748b", fontWeight:600, fontSize:"0.85rem", cursor:"pointer" }}>
          🎓 Jobseeker ({jsList.length})
        </button>
      </div>

      {/* ── EMPLOYER BOOKINGS ── */}
      {tab === "employer" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap", gap:"0.75rem" }}>
            <div>
              <div style={{ fontSize:"0.95rem", fontWeight:700, color:"#f1f5f9" }}>Data Pemesanan Booth</div>
              <div style={{ fontSize:"0.78rem", color:"#475569", marginTop:"0.15rem" }}>
                {bookings.filter((b:any)=>b.status!=="rejected").length} aktif · {bookings.filter((b:any)=>b.status==="confirmed").length} confirmed · {bookings.filter((b:any)=>b.status==="pending").length} pending
              </div>
            </div>
            <button onClick={() => setConfirmAction("all-bookings")}
              style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#f87171", borderRadius:8, padding:"0.5rem 1rem", fontSize:"0.82rem", fontWeight:700, cursor:"pointer" }}>
              🗑️ Hapus Semua Booking (Reset Booth)
            </button>
          </div>

          {bookingsQuery.isLoading ? (
            <div style={{ textAlign:"center", color:"#475569", padding:"2rem" }}>Memuat data...</div>
          ) : bookings.length === 0 ? (
            <div style={{ textAlign:"center", padding:"3rem", background:"rgba(255,255,255,0.02)", borderRadius:12, color:"#475569" }}>
              ✅ Tidak ada booking — semua booth tersedia
            </div>
          ) : (
            <div style={{ display:"grid", gap:"0.75rem" }}>
              {bookings.map((b: any) => (
                <div key={b.bookingId} style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${statusColor[b.status] || "rgba(255,255,255,0.08)"}25`, borderRadius:12, padding:"1rem 1.25rem", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"0.75rem" }}>
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ fontWeight:700, color:"#f1f5f9", fontSize:"0.9rem" }}>{b.companyName}</div>
                    <div style={{ fontSize:"0.78rem", color:"#64748b", marginTop:"0.2rem" }}>
                      {b.bookingId} · {b.pic1Email}
                    </div>
                    <div style={{ fontSize:"0.75rem", color:"#475569", marginTop:"0.15rem" }}>
                      {(() => { try { const booths = typeof b.booths==="string" ? JSON.parse(b.booths) : (b.booths||[]); return booths.map((bt:any)=>bt.label||bt.id).join(", "); } catch { return "-"; } })()}
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
                    <span style={{ fontSize:"0.72rem", fontWeight:700, color:statusColor[b.status]||"#64748b", background:`${statusColor[b.status]||"#64748b"}18`, border:`1px solid ${statusColor[b.status]||"#64748b"}35`, borderRadius:20, padding:"0.2rem 0.7rem" }}>
                      {statusLabel[b.status] || b.status}
                    </span>
                    <select value={b.status}
                      onChange={e => updateStatus.mutate({ bookingId:b.bookingId, status:e.target.value as any })}
                      style={{ background:"#0d1f35", border:"1px solid rgba(255,255,255,0.15)", color:"#94a3b8", borderRadius:6, padding:"0.25rem 0.5rem", fontSize:"0.75rem", cursor:"pointer" }}>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <button onClick={() => deleteBooking.mutate({ bookingId:b.bookingId })}
                      style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", color:"#f87171", borderRadius:6, padding:"0.25rem 0.6rem", fontSize:"0.75rem", cursor:"pointer", fontWeight:700 }}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── JOBSEEKER ── */}
      {tab === "jobseeker" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap", gap:"0.75rem" }}>
            <div>
              <div style={{ fontSize:"0.95rem", fontWeight:700, color:"#f1f5f9" }}>Data Jobseeker Terdaftar</div>
              <div style={{ fontSize:"0.78rem", color:"#475569", marginTop:"0.15rem" }}>{jsList.length} jobseeker terdaftar</div>
            </div>
            <button onClick={() => setConfirmAction("all-jobseekers")}
              style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#f87171", borderRadius:8, padding:"0.5rem 1rem", fontSize:"0.82rem", fontWeight:700, cursor:"pointer" }}>
              🗑️ Hapus Semua Data Jobseeker
            </button>
          </div>

          {jobseekersQuery.isLoading ? (
            <div style={{ textAlign:"center", color:"#475569", padding:"2rem" }}>Memuat data...</div>
          ) : jsList.length === 0 ? (
            <div style={{ textAlign:"center", padding:"3rem", background:"rgba(255,255,255,0.02)", borderRadius:12, color:"#475569" }}>
              Belum ada jobseeker terdaftar
            </div>
          ) : (
            <div style={{ display:"grid", gap:"0.6rem" }}>
              {jsList.map((j: any) => (
                <div key={j.registrationId} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"0.85rem 1.1rem", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"0.5rem" }}>
                  <div style={{ flex:1, minWidth:180 }}>
                    <div style={{ fontWeight:700, color:"#f1f5f9", fontSize:"0.88rem" }}>{j.namaLengkap}</div>
                    <div style={{ fontSize:"0.75rem", color:"#64748b", marginTop:"0.15rem" }}>{j.registrationId} · {j.email}</div>
                    {j.institusi && <div style={{ fontSize:"0.72rem", color:"#475569" }}>{j.institusi}</div>}
                  </div>
                  <button onClick={() => deleteJS.mutate({ registrationId:j.registrationId })}
                    style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", color:"#f87171", borderRadius:6, padding:"0.25rem 0.65rem", fontSize:"0.75rem", cursor:"pointer", fontWeight:700 }}>
                    ✕ Hapus
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default function SuperAdmin() {
  const [, navigate] = useLocation();
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("sa_auth") === "1");
  const [config, setConfig] = useState<EventConfig>(loadConfig);
  const [activeSection, setActiveSection] = useState("event");
  const [saving, setSaving] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  // Load config from DB
  const { data: dbConfig } = trpc.event.getEventConfig.useQuery(undefined, { enabled: authed });
  const saveConfigMutation = trpc.event.saveEventConfig.useMutation({
    onSuccess: () => {
      toast.success("Konfigurasi disimpan!", { description: "Tersimpan di database — aktif di semua device." });
      setSaving(false);
    },
    onError: () => {
      toast.error("Gagal menyimpan ke database");
      setSaving(false);
    },
  });

  // Sync DB config to local state
  useEffect(() => {
    if (dbConfig && Object.keys(dbConfig).length > 0) {
      setConfig(recordToConfig(dbConfig));
      // Also update localStorage as cache
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dbConfig));
    }
  }, [dbConfig]);

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  const upd = (key: keyof EventConfig, val: string) => setConfig(c => ({ ...c, [key]: val }));

  const handleSave = () => {
    setSaving(true);
    // Save to DB via tRPC
    const configRecord: Record<string, string> = {};
    Object.entries(config).forEach(([k, v]) => { configRecord[k] = String(v); });
    saveConfigMutation.mutate(configRecord);
    // Also save to localStorage as cache
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configRecord));
  };

  const handleReset = () => {
    if (!confirm("Reset ke konfigurasi default? Semua perubahan akan hilang.")) return;
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem(STORAGE_KEY);
    const defaultRecord: Record<string, string> = {};
    Object.entries(DEFAULT_CONFIG).forEach(([k, v]) => { defaultRecord[k] = String(v); });
    saveConfigMutation.mutate(defaultRecord);
    toast.success("Konfigurasi direset ke default");
  };

  const handleLogoUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload?type=logo&registrationId=system", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        upd("logoUrl", data.url);
        toast.success("Logo berhasil diupload!");
      }
    } catch {
      // Fallback: use object URL for preview
      upd("logoUrl", URL.createObjectURL(file));
      toast.success("Logo diupload (preview saja — simpan untuk menyimpan)");
    }
  };

  const sections = [
    { id: "event",   label: "📅 Info Event",      color: "#D4A017" },
    { id: "venue",   label: "🏛️ Venue",            color: "#14b8a6" },
    { id: "booth",   label: "📦 Booth & Harga",    color: "#818cf8" },
    { id: "payment", label: "🏦 Pembayaran",       color: "#10b981" },
    { id: "contact", label: "📞 Kontak",            color: "#f97316" },
    { id: "dates",   label: "🗓️ Jadwal Registrasi", color: "#ec4899" },
    { id: "data",    label: "🗄️ Kelola Data",       color: "#ef4444" },
  ];

  const fmt = (n: string) => {
    const num = parseInt(n.replace(/\D/g, ""));
    return isNaN(num) ? n : "Rp " + num.toLocaleString("id-ID");
  };

  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={s.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>🔐</div>
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ef4444" }}>Superadmin Panel</div>
            <div style={{ fontSize: "0.7rem", color: "#475569" }}>Platform Configuration · GR2026</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={handleReset} style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", borderRadius: 8, padding: "0.4rem 0.9rem", fontSize: "0.8rem", cursor: "pointer" }}>
            Reset Default
          </button>
          <button onClick={() => { sessionStorage.removeItem("sa_auth"); setAuthed(false); }}
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", borderRadius: 8, padding: "0.4rem 0.9rem", fontSize: "0.8rem", cursor: "pointer" }}>
            Logout
          </button>
          <button onClick={() => navigate("/")}
            style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", color: "#D4A017", borderRadius: 8, padding: "0.4rem 0.9rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
            🏠 Beranda
          </button>
        </div>
      </nav>

      <div style={s.wrap}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, marginBottom: "0.25rem" }}>
            Konfigurasi Platform
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Edit semua pengaturan event GR2026 — perubahan langsung aktif setelah disimpan</p>
        </div>

        {/* Section nav */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          {sections.map(sec => (
            <button key={sec.id} onClick={() => setActiveSection(sec.id)}
              style={{ padding: "0.5rem 1rem", borderRadius: 8, border: `1px solid ${activeSection === sec.id ? sec.color : "rgba(255,255,255,0.1)"}`, background: activeSection === sec.id ? `${sec.color}15` : "transparent", color: activeSection === sec.id ? sec.color : "#64748b", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
              {sec.label}
            </button>
          ))}
        </div>

        {/* ── INFO EVENT ── */}
        {activeSection === "event" && (
          <div style={s.card}>
            <div style={s.secHd("#D4A017")}>📅 Informasi Event</div>

            <div style={s.row2}>
              <div>
                <label style={s.label}>Nama Event *</label>
                <input style={s.input} value={config.eventName} onChange={e => upd("eventName", e.target.value)} placeholder="Grand Recruitment 2026"/>
              </div>
              <div>
                <label style={s.label}>Tahun</label>
                <input style={s.input} value={config.eventYear} onChange={e => upd("eventYear", e.target.value)} placeholder="2026"/>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={s.label}>Subtitle / Tagline</label>
              <input style={s.input} value={config.eventSubtitle} onChange={e => upd("eventSubtitle", e.target.value)} placeholder="The International Hospitality and Tourism Job Fair"/>
            </div>

            <div style={s.row3}>
              <div>
                <label style={s.label}>Tanggal Mulai *</label>
                <input style={s.input} type="date" value={config.eventDate1} onChange={e => upd("eventDate1", e.target.value)}/>
              </div>
              <div>
                <label style={s.label}>Tanggal Selesai *</label>
                <input style={s.input} type="date" value={config.eventDate2} onChange={e => upd("eventDate2", e.target.value)}/>
              </div>
              <div>
                <label style={s.label}>Jam Buka</label>
                <input style={s.input} value={config.openTime} onChange={e => upd("openTime", e.target.value)} placeholder="08.00"/>
              </div>
              <div>
                <label style={s.label}>Jam Tutup</label>
                <input style={s.input} value={config.closeTime} onChange={e => upd("closeTime", e.target.value)} placeholder="17.00"/>
              </div>
            </div>

            <div style={s.row2}>
              <div>
                <label style={s.label}>Nama Lokasi *</label>
                <input style={s.input} value={config.locationName} onChange={e => upd("locationName", e.target.value)} placeholder="Gedung Dome NHI Bandung"/>
              </div>
              <div>
                <label style={s.label}>Alamat Lengkap</label>
                <input style={s.input} value={config.locationAddress} onChange={e => upd("locationAddress", e.target.value)}/>
              </div>
            </div>

            {/* Logo upload */}
            <div style={{ marginTop: "1rem" }}>
              <label style={s.label}>Logo Event</label>
              <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ width: 80, height: 80, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {config.logoUrl ? (
                    <img src={config.logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }}/>
                  ) : (
                    <span style={{ color: "#334155", fontSize: "2rem" }}>🖼️</span>
                  )}
                </div>
                <div>
                  <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }}/>
                  <button onClick={() => logoRef.current?.click()}
                    style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", color: "#D4A017", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", display: "block", marginBottom: "0.5rem" }}>
                    📁 Upload Logo Baru
                  </button>
                  <div style={{ fontSize: "0.75rem", color: "#475569" }}>PNG/JPG/SVG · Rekomendasi 200×200px</div>
                  <input style={{ ...s.input, marginTop: "0.5rem", fontSize: "0.8rem" }} value={config.logoUrl}
                    onChange={e => upd("logoUrl", e.target.value)} placeholder="/logo-gr2026.png"/>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── VENUE ── */}
        {activeSection === "venue" && (
          <div style={s.card}>
            <div style={s.secHd("#14b8a6")}>🏛️ Informasi Venue</div>

            <div style={s.row2}>
              <div>
                <label style={s.label}>Nama Venue *</label>
                <input style={s.input} value={config.venueName} onChange={e => upd("venueName", e.target.value)}/>
              </div>
              <div>
                <label style={s.label}>Kota</label>
                <input style={s.input} value={config.venueCity} onChange={e => upd("venueCity", e.target.value)}/>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={s.label}>Alamat Venue</label>
              <input style={s.input} value={config.venueAddress} onChange={e => upd("venueAddress", e.target.value)}/>
            </div>

            <div style={s.row3}>
              <div>
                <label style={s.label}>Kapasitas (orang)</label>
                <input style={s.input} type="number" value={config.venueCapacity} onChange={e => upd("venueCapacity", e.target.value)} placeholder="3000"/>
              </div>
              <div>
                <label style={s.label}>Luas Area (m²)</label>
                <input style={s.input} type="number" value={config.venueArea} onChange={e => upd("venueArea", e.target.value)} placeholder="2500"/>
              </div>
            </div>

            <div>
              <label style={s.label}>Fasilitas (pisahkan dengan koma)</label>
              <input style={s.input} value={config.venueFacilities} onChange={e => upd("venueFacilities", e.target.value)} placeholder="AC, Sound System, WiFi, Parkir, Musholla"/>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                {config.venueFacilities.split(",").map(f => f.trim()).filter(Boolean).map(f => (
                  <span key={f} style={{ display: "inline-block", padding: "0.2rem 0.65rem", borderRadius: 20, fontSize: "0.75rem", background: "rgba(20,184,166,0.1)", color: "#14b8a6", border: "1px solid rgba(20,184,166,0.2)" }}>{f}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── BOOTH & HARGA ── */}
        {activeSection === "booth" && (
          <div style={s.card}>
            <div style={s.secHd("#818cf8")}>📦 Konfigurasi Booth & Harga</div>

            {/* Main Booth */}
            <div style={{ background: "rgba(212,160,23,0.05)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#D4A017", marginBottom: "1rem" }}>🏆 Main Booth</div>
              <div style={s.row3}>
                <div>
                  <label style={s.label}>Harga (Rp)</label>
                  <input style={s.input} type="number" value={config.mainBoothPrice} onChange={e => upd("mainBoothPrice", e.target.value)}/>
                  <div style={{ fontSize: "0.75rem", color: "#D4A017", marginTop: "0.25rem" }}>{fmt(config.mainBoothPrice)}</div>
                </div>
                <div>
                  <label style={s.label}>Ukuran (m)</label>
                  <input style={s.input} value={config.mainBoothSize} onChange={e => upd("mainBoothSize", e.target.value)} placeholder="5x5"/>
                </div>
                <div>
                  <label style={s.label}>Jumlah Unit</label>
                  <input style={s.input} type="number" value={config.mainBoothCount} onChange={e => upd("mainBoothCount", e.target.value)}/>
                </div>
              </div>
            </div>

            {/* Standard Booth */}
            <div style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#14b8a6", marginBottom: "1rem" }}>📦 Standard Booth</div>
              <div style={s.row3}>
                <div>
                  <label style={s.label}>Harga (Rp)</label>
                  <input style={s.input} type="number" value={config.stdBoothPrice} onChange={e => upd("stdBoothPrice", e.target.value)}/>
                  <div style={{ fontSize: "0.75rem", color: "#14b8a6", marginTop: "0.25rem" }}>{fmt(config.stdBoothPrice)}</div>
                </div>
                <div>
                  <label style={s.label}>Ukuran (m)</label>
                  <input style={s.input} value={config.stdBoothSize} onChange={e => upd("stdBoothSize", e.target.value)} placeholder="3x3"/>
                </div>
                <div>
                  <label style={s.label}>Jumlah Unit</label>
                  <input style={s.input} type="number" value={config.stdBoothCount} onChange={e => upd("stdBoothCount", e.target.value)}/>
                </div>
              </div>
            </div>

            {/* Interview Booth */}
            <div style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#60a5fa", marginBottom: "1rem" }}>🎤 Interview Booth</div>
              <div style={{ maxWidth: 200 }}>
                <label style={s.label}>Jumlah Unit</label>
                <input style={s.input} type="number" value={config.interviewBoothCount} onChange={e => upd("interviewBoothCount", e.target.value)}/>
              </div>
            </div>
          </div>
        )}

        {/* ── PEMBAYARAN ── */}
        {activeSection === "payment" && (
          <div style={s.card}>
            <div style={s.secHd("#10b981")}>🏦 Informasi Pembayaran</div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={s.label}>Deadline Pembayaran (hari sebelum event)</label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <input style={{ ...s.input, maxWidth: 100 }} type="number" value={config.paymentDeadlineDays} onChange={e => upd("paymentDeadlineDays", e.target.value)}/>
                <span style={{ color: "#64748b", fontSize: "0.85rem" }}>hari sebelum event (H-{config.paymentDeadlineDays})</span>
              </div>
            </div>

            <div style={s.row3}>
              <div>
                <label style={s.label}>Nama Bank *</label>
                <input style={s.input} value={config.bankName} onChange={e => upd("bankName", e.target.value)} placeholder="Bank BNI"/>
              </div>
              <div>
                <label style={s.label}>No. Rekening *</label>
                <input style={s.input} value={config.bankAccount} onChange={e => upd("bankAccount", e.target.value)} placeholder="0123-456-789"/>
              </div>
              <div>
                <label style={s.label}>Atas Nama *</label>
                <input style={s.input} value={config.bankAccountName} onChange={e => upd("bankAccountName", e.target.value)} placeholder="Koperasi Poltekpar NHI"/>
              </div>
            </div>

            {/* Preview */}
            <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "1rem", marginTop: "1rem" }}>
              <div style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 700, marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Preview Tampilan di Invoice</div>
              {[
                { label: "Bank", val: config.bankName },
                { label: "No. Rekening", val: config.bankAccount },
                { label: "Atas Nama", val: config.bankAccountName },
                { label: "Batas Bayar", val: `H-${config.paymentDeadlineDays} sebelum event` },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", gap: "1rem", marginBottom: "0.4rem", fontSize: "0.85rem" }}>
                  <span style={{ color: "#64748b", minWidth: 120 }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: "#f1f5f9" }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── KONTAK ── */}
        {activeSection === "contact" && (
          <div style={s.card}>
            <div style={s.secHd("#f97316")}>📞 Kontak Panitia</div>
            <div style={s.row2}>
              <div>
                <label style={s.label}>No. WhatsApp *</label>
                <input style={s.input} value={config.whatsappNumber} onChange={e => upd("whatsappNumber", e.target.value)} placeholder="0812-xxxx-xxxx"/>
                <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.3rem" }}>Tampil di halaman employer dan invoice</div>
              </div>
              <div>
                <label style={s.label}>Email *</label>
                <input style={s.input} type="email" value={config.email} onChange={e => upd("email", e.target.value)} placeholder="grandrecruitment@nhi.ac.id"/>
                <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.3rem" }}>Tampil di invoice dan proposal</div>
              </div>
            </div>
          </div>
        )}

        {/* ── JADWAL REGISTRASI ── */}
        {activeSection === "dates" && (
          <div style={s.card}>
            <div style={s.secHd("#ec4899")}>🗓️ Jadwal Registrasi</div>

            {/* Employer */}
            <div style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#14b8a6", marginBottom: "1rem" }}>🏢 Pendaftaran Employer (Booking Booth)</div>
              <div style={s.row2}>
                <div>
                  <label style={s.label}>Dibuka</label>
                  <input style={s.input} type="date" value={config.employerRegOpenDate} onChange={e => upd("employerRegOpenDate", e.target.value)}/>
                </div>
                <div>
                  <label style={s.label}>Ditutup / Batas Booking</label>
                  <input style={s.input} type="date" value={config.employerRegCloseDate} onChange={e => upd("employerRegCloseDate", e.target.value)}/>
                </div>
              </div>
              <div style={{ fontSize: "0.78rem", color: "#475569", marginTop: "0.25rem" }}>
                Setelah tanggal tutup, form pendaftaran employer akan dikunci otomatis.
              </div>
            </div>

            {/* Payment Deadline */}
            <div style={{ background: "rgba(212,160,23,0.05)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#D4A017", marginBottom: "1rem" }}>💰 Batas Pembayaran Booth</div>
              <div style={s.row2}>
                <div>
                  <label style={s.label}>Tanggal Deadline Absolut *</label>
                  <input style={s.input} type="date" value={config.paymentDeadlineDate} onChange={e => upd("paymentDeadlineDate", e.target.value)}/>
                  <div style={{ fontSize: "0.75rem", color: "#D4A017", marginTop: "0.3rem" }}>
                    ⚠️ Booking PENDING yang melewati tanggal ini otomatis EXPIRED
                  </div>
                </div>
                <div>
                  <label style={s.label}>Atau H-X sebelum event</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <input style={{ ...s.input, maxWidth: 80 }} type="number" value={config.paymentDeadlineDays} onChange={e => upd("paymentDeadlineDays", e.target.value)}/>
                    <span style={{ color: "#64748b", fontSize: "0.82rem" }}>hari (H-{config.paymentDeadlineDays})</span>
                  </div>
                  <div style={{ fontSize: "0.73rem", color: "#475569", marginTop: "0.3rem" }}>Dipakai di invoice jika tanggal absolut kosong</div>
                </div>
              </div>
            </div>

            {/* Jobseeker */}
            <div style={{ background: "rgba(212,160,23,0.05)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#D4A017", marginBottom: "1rem" }}>🎓 Pendaftaran Jobseeker</div>
              <div style={s.row2}>
                <div>
                  <label style={s.label}>Dibuka</label>
                  <input style={s.input} type="date" value={config.jobseekerRegOpenDate} onChange={e => upd("jobseekerRegOpenDate", e.target.value)}/>
                </div>
                <div>
                  <label style={s.label}>Ditutup</label>
                  <input style={s.input} type="date" value={config.jobseekerRegCloseDate} onChange={e => upd("jobseekerRegCloseDate", e.target.value)}/>
                </div>
              </div>
              <div style={{ fontSize: "0.78rem", color: "#475569", marginTop: "0.25rem" }}>
                Setelah tanggal tutup, form pendaftaran jobseeker akan dikunci otomatis.
              </div>
            </div>

            {/* Walk-in */}
            <div style={{ background: "rgba(129,140,248,0.05)", border: "1px solid rgba(129,140,248,0.2)", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#818cf8", marginBottom: "1rem" }}>🚶 Walk-in Jobseeker (Hari H)</div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.88rem", color: "#f1f5f9" }}>
                  <input type="checkbox" checked={config.allowWalkIn === "true"}
                    onChange={e => upd("allowWalkIn", e.target.checked ? "true" : "false")}
                    style={{ accentColor: "#818cf8", width: 16, height: 16 }}/>
                  Izinkan walk-in jobseeker (daftar di hari H)
                </label>
              </div>
              <div style={{ fontSize: "0.78rem", color: "#475569", marginTop: "0.5rem" }}>
                Kalau diaktifkan, jobseeker yang belum daftar online tetap bisa masuk dan daftar langsung di venue.
              </div>
            </div>
          </div>
        )}

        {/* ── KELOLA DATA ── */}
        {activeSection === "data" && (
          <DataManagement />
        )}

        {/* Save button */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
          <button onClick={() => navigate("/boss")}
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", borderRadius: 10, padding: "0.75rem 1.5rem", fontSize: "0.9rem", cursor: "pointer" }}>
            Panel Panitia
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ background: saving ? "rgba(239,68,68,0.5)" : "linear-gradient(135deg,#dc2626,#b91c1c)", border: "none", color: "#fff", borderRadius: 10, padding: "0.75rem 2rem", fontSize: "0.9rem", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "⏳ Menyimpan..." : "💾 Simpan Semua Perubahan"}
          </button>
        </div>

        {/* Config preview */}
        <details style={{ marginTop: "2rem" }}>
          <summary style={{ color: "#334155", fontSize: "0.8rem", cursor: "pointer" }}>🔧 Lihat konfigurasi JSON (untuk developer)</summary>
          <pre style={{ marginTop: "0.75rem", padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: 8, fontSize: "0.72rem", color: "#475569", overflow: "auto", maxHeight: 300 }}>
            {JSON.stringify(config, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
