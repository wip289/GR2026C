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
  // Akses window jobseeker ↔ employer
  jobseekerAccessStart: string;
  jobseekerAccessEnd: string;
  lowonganOpen: string;
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
  jobseekerAccessStart: "2026-06-07T00:00",
  jobseekerAccessEnd: "2026-06-13T23:59",
  lowonganOpen: "true",
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

  const deleteBooking     = trpc.event.deleteEmployerBooking.useMutation({
    onSuccess: () => { toast.success("Booking dihapus"); bookingsQuery.refetch(); },
    onError: (e) => toast.error("Gagal hapus booking: " + e.message),
  });
  const deleteAllBookings = trpc.event.deleteAllEmployerBookings.useMutation({
    onSuccess: () => { toast.success("Semua booking dihapus!"); bookingsQuery.refetch(); setConfirmAction(null); },
    onError: (e) => { toast.error("Gagal hapus semua booking: " + e.message); setConfirmAction(null); },
  });
  const deleteJS          = trpc.event.deleteJobseeker.useMutation({
    onSuccess: () => { toast.success("Jobseeker dihapus"); jobseekersQuery.refetch(); },
    onError: (e) => toast.error("Gagal hapus jobseeker: " + e.message),
  });
  const deleteAllJS       = trpc.event.deleteAllJobseekers.useMutation({
    onSuccess: () => { toast.success("Semua data jobseeker dihapus!"); jobseekersQuery.refetch(); setConfirmAction(null); },
    onError: (e) => { toast.error("Gagal hapus semua jobseeker: " + e.message); setConfirmAction(null); },
  });
  const updateStatus      = trpc.event.updateEmployerBookingStatus.useMutation({
    onSuccess: () => bookingsQuery.refetch(),
    onError: (e) => toast.error("Gagal update status: " + e.message),
  });

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
              {jsList.map((j: any) => {
                const minatLabel: Record<string,string> = { dalam_negeri:"🇮🇩 Dalam Negeri", luar_negeri:"✈️ Luar Negeri", keduanya:"🌏 Keduanya" };
                const statusLabel: Record<string,string> = { belum_bekerja:"🔍 Belum Bekerja", sedang_bekerja:"💼 Sedang Bekerja", pernah_bekerja:"📋 Pernah Bekerja" };
                const sumberLabel: Record<string,string> = { instagram:"📸 Instagram", tiktok:"🎵 TikTok", teman:"👥 Teman/Keluarga", kampus:"🏫 Kampus", poster:"🪧 Poster", website:"🌐 Website", lainnya:"💬 Lainnya" };
                return (
                  <div key={j.registrationId} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"1rem 1.1rem", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"0.5rem" }}>
                    <div style={{ flex:1, minWidth:200 }}>
                      {/* Row 1: nama + ID */}
                      <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", flexWrap:"wrap", marginBottom:"0.35rem" }}>
                        <div style={{ fontWeight:700, color:"#f1f5f9", fontSize:"0.9rem" }}>{j.namaLengkap}</div>
                        <div style={{ fontSize:"0.68rem", color:"#D4A017", fontFamily:"monospace", background:"rgba(212,160,23,0.1)", padding:"0.1rem 0.5rem", borderRadius:4 }}>{j.registrationId}</div>
                      </div>
                      {/* Row 2: email + phone */}
                      <div style={{ fontSize:"0.75rem", color:"#64748b", marginBottom:"0.3rem" }}>
                        📧 {j.email}
                        {(j.whatsapp || j.phone) && <span style={{ marginLeft:"0.75rem" }}>📱 {j.whatsapp || j.phone}</span>}
                      </div>
                      {/* Row 3: institusi + jurusan + tahun */}
                      {(j.institusi || j.jurusan) && (
                        <div style={{ fontSize:"0.72rem", color:"#475569", marginBottom:"0.3rem" }}>
                          🎓 {[j.jurusan, j.institusi, j.tahunLulus].filter(Boolean).join(" · ")}
                        </div>
                      )}
                      {/* Row 4: minat + status + sumber */}
                      <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", marginTop:"0.25rem" }}>
                        {j.minatKerja && <span style={{ fontSize:"0.68rem", background:"rgba(20,184,166,0.1)", color:"#14b8a6", border:"1px solid rgba(20,184,166,0.2)", borderRadius:20, padding:"0.1rem 0.55rem" }}>{minatLabel[j.minatKerja] || j.minatKerja}</span>}
                        {j.statusKerja && <span style={{ fontSize:"0.68rem", background:"rgba(212,160,23,0.1)", color:"#D4A017", border:"1px solid rgba(212,160,23,0.2)", borderRadius:20, padding:"0.1rem 0.55rem" }}>{statusLabel[j.statusKerja] || j.statusKerja}</span>}
                        {j.sumberInfo && <span style={{ fontSize:"0.68rem", background:"rgba(129,140,248,0.1)", color:"#818cf8", border:"1px solid rgba(129,140,248,0.2)", borderRadius:20, padding:"0.1rem 0.55rem" }}>{sumberLabel[j.sumberInfo] || j.sumberInfo}</span>}
                        {j.igUsername && <span style={{ fontSize:"0.68rem", color:"#c084fc" }}>@{j.igUsername}</span>}
                        {j.kota && <span style={{ fontSize:"0.68rem", color:"#475569" }}>📍 {j.kota}</span>}
                      </div>
                      {/* Row 5: dokumen */}
                      <div style={{ display:"flex", gap:"0.4rem", marginTop:"0.35rem" }}>
                        {[{key:"fotoUrl",label:"Foto"},{key:"cvUrl",label:"CV"},{key:"ktmUrl",label:"KTM"},{key:"sertifikatUrl",label:"Sertifikat"}].map(d => (
                          j[d.key] ? (
                            <a key={d.key} href={j[d.key]} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize:"0.68rem", color:"#60a5fa", background:"rgba(96,165,250,0.1)", border:"1px solid rgba(96,165,250,0.2)", borderRadius:20, padding:"0.1rem 0.55rem", textDecoration:"none" }}>
                              📎 {d.label}
                            </a>
                          ) : null
                        ))}
                      </div>
                    </div>
                    <button onClick={() => deleteJS.mutate({ registrationId:j.registrationId })}
                      style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", color:"#f87171", borderRadius:6, padding:"0.25rem 0.65rem", fontSize:"0.75rem", cursor:"pointer", fontWeight:700, flexShrink:0 }}>
                      ✕ Hapus
                    </button>
                  </div>
                );
              })}
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
  const [editingFin,  setEditingFin]  = useState<string | null>(null);
  const [finForm,     setFinForm]     = useState({ sewaOverride: "", additionalPrice: "", additionalNote: "", amountReceived: "", paymentDate: "", notes: "", pajakType: "", pajakPersen: "", pajakAmount: "" });
  const [finUploading, setFinUploading] = useState(false);

  // Load config from DB
  const { data: dbConfig, refetch: refetchCfg } = trpc.event.getEventConfig.useQuery(undefined, { enabled: authed });
  const { data: allBookingsRaw } = trpc.event.getAllEmployerBookings.useQuery(undefined, { enabled: authed });
  const saveFinMutation = trpc.event.saveEventConfig.useMutation({
    onSuccess: () => { toast.success("Data keuangan disimpan!"); refetchCfg(); },
    onError:   () => toast.error("Gagal menyimpan data keuangan"),
  });

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
    { id: "keuangan", label: "💰 Keuangan",          color: "#22c55e" },
  ];

  // ── Supabase upload bukti bayar keuangan ───────────────────
  const uploadBuktiFin = async (file: File, bookingId: string): Promise<string | null> => {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const sb = createClient(
        (import.meta as any).env.VITE_SUPABASE_URL,
        (import.meta as any).env.VITE_SUPABASE_ANON_KEY
      );
      const ext  = file.name.split(".").pop() || "jpg";
      const path = `employer/${bookingId}/finance/bukti-${Date.now()}.${ext}`;
      const { error } = await sb.storage.from("gr2026c").upload(path, file, { upsert: true, contentType: file.type });
      if (error) { toast.error("Gagal upload: " + error.message); return null; }
      return sb.storage.from("gr2026c").getPublicUrl(path).data.publicUrl;
    } catch (e) { toast.error("Upload error"); return null; }
  };

  // ── Save financial record ────────────────────────────────────
  const saveFinRecord = async (bookingId: string, extra: Record<string, string> = {}) => {
    const cfg = dbConfig as any || {};
    const existing: Record<string, any> = (() => { try { return JSON.parse(cfg.financialRecords || "{}"); } catch { return {}; } })();
    const updated = { ...existing, [bookingId]: { ...(existing[bookingId] || {}), ...finForm, ...extra } };
    await saveFinMutation.mutateAsync({ financialRecords: JSON.stringify(updated) });
  };

  const fmtRp = (n: number | string) => {
    const num = typeof n === "string" ? parseFloat(n.replace(/[^0-9.]/g, "")) : n;
    return isNaN(num) ? "Rp 0" : "Rp " + Math.round(num).toLocaleString("id-ID");
  };

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

            {/* Extra Booth */}
            <div style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#a78bfa", marginBottom: "1rem" }}>⭐ Extra Booth</div>
              <div style={s.row3}>
                <div>
                  <label style={s.label}>Harga (Rp)</label>
                  <input style={s.input} type="number" value={config.extraBoothPrice || "8500000"} onChange={e => upd("extraBoothPrice", e.target.value)}/>
                  <div style={{ fontSize: "0.75rem", color: "#a78bfa", marginTop: "0.25rem" }}>{fmt(config.extraBoothPrice || "8500000")}</div>
                </div>
                <div>
                  <label style={s.label}>Ukuran (m)</label>
                  <input style={s.input} value={config.extraBoothSize || "4x2"} onChange={e => upd("extraBoothSize", e.target.value)} placeholder="4x2"/>
                </div>
                <div>
                  <label style={s.label}>Jumlah Unit</label>
                  <input style={s.input} type="number" value={config.extraBoothCount || "4"} onChange={e => upd("extraBoothCount", e.target.value)}/>
                </div>
              </div>
              <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "#64748b" }}>
                📍 Posisi: E1-E4 di kanan dan kiri area Main Booth (sesuai denah)
              </div>
            </div>

            {/* Interview Booth */}
            <div style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#60a5fa", marginBottom: "1rem" }}>🎤 Interview Booth (Gratis untuk Employer)</div>
              <div style={s.row3}>
                <div style={{ maxWidth: 200 }}>
                  <label style={s.label}>Jumlah Room</label>
                  <input style={s.input} type="number" value={config.interviewBoothCount} onChange={e => upd("interviewBoothCount", e.target.value)}/>
                  <div style={{ fontSize: "0.73rem", color: "#475569", marginTop: "0.25rem" }}>Saat ini: 14 room (E1-E14)</div>
                </div>
                <div style={{ maxWidth: 200 }}>
                  <label style={s.label}>Slot per Hari</label>
                  <input style={s.input} type="number" value={config.interviewSlotsPerDay || "7"} onChange={e => upd("interviewSlotsPerDay", e.target.value)}/>
                  <div style={{ fontSize: "0.73rem", color: "#475569", marginTop: "0.25rem" }}>08.00–16.00, 7 slot/hari</div>
                </div>
              </div>
              <div style={{ marginTop: "1rem" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#60a5fa", marginBottom: "0.75rem" }}>🎯 Jatah Slot Interview per Perusahaan (total 2 hari)</div>
                <div style={s.row3}>
                  <div>
                    <label style={s.label}>Main Booth (slot)</label>
                    <input style={s.input} type="number" min="1" max="14" value={config.mainBoothSlots || "4"} onChange={e => upd("mainBoothSlots", e.target.value)}/>
                    <div style={{ fontSize: "0.73rem", color: "#D4A017", marginTop: "0.25rem" }}>Default: 4 slot</div>
                  </div>
                  <div>
                    <label style={s.label}>Standard Booth (slot)</label>
                    <input style={s.input} type="number" min="1" max="14" value={config.stdBoothSlots || "2"} onChange={e => upd("stdBoothSlots", e.target.value)}/>
                    <div style={{ fontSize: "0.73rem", color: "#14b8a6", marginTop: "0.25rem" }}>Default: 2 slot</div>
                  </div>
                  <div>
                    <label style={s.label}>Extra Booth (slot)</label>
                    <input style={s.input} type="number" min="1" max="14" value={config.extraBoothSlots || "3"} onChange={e => upd("extraBoothSlots", e.target.value)}/>
                    <div style={{ fontSize: "0.73rem", color: "#a78bfa", marginTop: "0.25rem" }}>Default: 3 slot</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fasilitas Tambahan */}
            <div style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fbbf24", marginBottom: "1rem" }}>🛠️ Fasilitas Tambahan (Exhibitor Order)</div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "1rem" }}>
                Item berikut dapat dipesan employer sebagai fasilitas tambahan (ditagih terpisah oleh vendor).
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {[
                  { key: "facilityChair", label: "Kursi + cover hitam", default: "25000" },
                  { key: "facilityTable", label: "Meja + cover hitam", default: "125000" },
                  { key: "facilityTV42", label: "TV 42 Inch", default: "750000" },
                  { key: "facilityTV55", label: "TV 55 Inch", default: "1500000" },
                  { key: "facilityPower2A", label: "Listrik tambahan 2A", default: "250000" },
                  { key: "facilityPower4A", label: "Listrik tambahan 4A", default: "400000" },
                  { key: "facilityCable", label: "Perpanjangan Kabel", default: "250000" },
                ].map(f => (
                  <div key={f.key} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ flex: 1, fontSize: "0.8rem", color: "#94a3b8" }}>{f.label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Rp</span>
                      <input style={{ ...s.input, width: 100, padding: "0.4rem 0.6rem", fontSize: "0.78rem" }}
                        type="number" value={config[f.key] || f.default}
                        onChange={e => upd(f.key, e.target.value)}/>
                    </div>
                  </div>
                ))}
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

            {/* QRIS */}
            <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "1.25rem", marginTop: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#10b981", marginBottom: "0.75rem" }}>📱 QRIS (Opsional)</div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "0.75rem" }}>
                Upload gambar QR Code QRIS untuk ditampilkan di invoice dan dashboard employer sebagai opsi pembayaran alternatif.
              </div>
              {config.qrisImageUrl ? (
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
                  <img src={config.qrisImageUrl} alt="QRIS" style={{ width: 120, height: 120, objectFit: "contain", background: "#fff", borderRadius: 8, padding: "0.35rem", border: "1px solid rgba(16,185,129,0.3)" }}/>
                  <div>
                    <div style={{ fontSize: "0.82rem", color: "#10b981", fontWeight: 600, marginBottom: "0.5rem" }}>✅ QRIS terupload</div>
                    <button onClick={() => upd("qrisImageUrl", "")} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", borderRadius: 8, padding: "0.35rem 0.75rem", fontSize: "0.75rem", cursor: "pointer" }}>Hapus</button>
                  </div>
                </div>
              ) : (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "2px dashed rgba(16,185,129,0.3)", borderRadius: 8, padding: "1.5rem", textAlign: "center", marginBottom: "0.75rem" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📱</div>
                  <div style={{ fontSize: "0.82rem", color: "#475569" }}>Belum ada QRIS — upload gambar QR Code di sini</div>
                </div>
              )}
              <div>
                <label style={s.label}>URL Gambar QRIS</label>
                <input style={s.input} value={config.qrisImageUrl || ""} onChange={e => upd("qrisImageUrl", e.target.value)} placeholder="https://... atau upload ke Supabase dulu"/>
              </div>
              <div style={{ marginTop: "0.75rem" }}>
                <label style={s.label}>Nama Akun QRIS (opsional)</label>
                <input style={s.input} value={config.qrisAccountName || ""} onChange={e => upd("qrisAccountName", e.target.value)} placeholder="Koperasi STP Bandung"/>
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

            {/* Kontak Utama */}
            <div style={{ background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f97316", marginBottom: "1rem" }}>📌 Kontak Utama (Tampil di Invoice & Dashboard)</div>
              <div style={s.row2}>
                <div>
                  <label style={s.label}>No. WhatsApp *</label>
                  <input style={s.input} value={config.whatsappNumber} onChange={e => upd("whatsappNumber", e.target.value)} placeholder="0812-xxxx-xxxx"/>
                  <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.3rem" }}>Format: 08xx atau 628xx</div>
                </div>
                <div>
                  <label style={s.label}>Email *</label>
                  <input style={s.input} type="email" value={config.email} onChange={e => upd("email", e.target.value)} placeholder="grandrecruitment@nhi.ac.id"/>
                  <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.3rem" }}>Tampil di invoice dan proposal</div>
                </div>
              </div>
            </div>

            {/* Kontak Tambahan */}
            <div style={{ background: "rgba(249,115,22,0.03)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f97316", marginBottom: "0.5rem" }}>👥 Kontak Panitia Tambahan</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "1rem" }}>Kontak tambahan untuk ditampilkan di halaman informasi panitia (opsional).</div>
              {(JSON.parse(config.additionalContacts || "[]") as any[]).map((c: any, i: number) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "0.5rem", marginBottom: "0.75rem", alignItems: "end" }}>
                  <div>
                    {i === 0 && <label style={s.label}>Nama</label>}
                    <input style={s.input} value={c.nama} placeholder="Nama panitia"
                      onChange={e => { const arr = JSON.parse(config.additionalContacts || "[]"); arr[i].nama = e.target.value; upd("additionalContacts", JSON.stringify(arr)); }}/>
                  </div>
                  <div>
                    {i === 0 && <label style={s.label}>Jabatan/Divisi</label>}
                    <input style={s.input} value={c.jabatan} placeholder="Koordinator Booth"
                      onChange={e => { const arr = JSON.parse(config.additionalContacts || "[]"); arr[i].jabatan = e.target.value; upd("additionalContacts", JSON.stringify(arr)); }}/>
                  </div>
                  <div>
                    {i === 0 && <label style={s.label}>WhatsApp</label>}
                    <input style={s.input} value={c.whatsapp} placeholder="0812-xxxx-xxxx"
                      onChange={e => { const arr = JSON.parse(config.additionalContacts || "[]"); arr[i].whatsapp = e.target.value; upd("additionalContacts", JSON.stringify(arr)); }}/>
                  </div>
                  <button onClick={() => { const arr = JSON.parse(config.additionalContacts || "[]"); arr.splice(i,1); upd("additionalContacts", JSON.stringify(arr)); }}
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", borderRadius: 8, padding: "0.5rem 0.75rem", cursor: "pointer", fontSize: "0.85rem" }}>✕</button>
                </div>
              ))}
              <button onClick={() => { const arr = JSON.parse(config.additionalContacts || "[]"); arr.push({ nama: "", jabatan: "", whatsapp: "" }); upd("additionalContacts", JSON.stringify(arr)); }}
                style={{ background: "transparent", border: "1px dashed rgba(249,115,22,0.4)", color: "#f97316", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>
                + Tambah Kontak
              </button>
            </div>

            {/* Keterangan tambahan */}
            <div style={{ background: "rgba(249,115,22,0.03)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f97316", marginBottom: "0.5rem" }}>📝 Keterangan / Info Tambahan</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.75rem" }}>Informasi tambahan yang ditampilkan di halaman kontak (jam operasional, lokasi sekretariat, dll).</div>
              <textarea
                value={config.contactNotes || ""}
                onChange={e => upd("contactNotes", e.target.value)}
                placeholder="Contoh: Sekretariat GR2026 berada di Gedung A Lt.2. Jam operasional: Senin–Jumat 08.00–17.00 WIB."
                style={{ ...s.input, height: 100, resize: "vertical" as const, width: "100%", fontFamily: "inherit" }}
              />
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

            {/* Akses Lowongan — toggle */}
            <div style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#14b8a6", marginBottom: "0.5rem" }}>💼 Lowongan (Jobseeker lihat Employer)</div>
              <div style={{ fontSize: "0.78rem", color: "#475569", marginBottom: "1rem", lineHeight: 1.6 }}>
                Kontrol apakah jobseeker bisa melihat daftar lowongan dari employer yang sudah confirmed.
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                  <div
                    onClick={() => upd("lowonganOpen", config.lowonganOpen === "true" ? "false" : "true")}
                    style={{
                      width: 48, height: 26, borderRadius: 13, cursor: "pointer", transition: "background 0.2s",
                      background: config.lowonganOpen === "true" ? "#14b8a6" : "#334155",
                      position: "relative", flexShrink: 0,
                    }}>
                    <div style={{
                      position: "absolute", top: 3, left: config.lowonganOpen === "true" ? 25 : 3,
                      width: 20, height: 20, borderRadius: "50%", background: "#fff",
                      transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    }} />
                  </div>
                  <span style={{ fontSize: "0.88rem", color: "#f1f5f9", fontWeight: 600 }}>
                    {config.lowonganOpen === "true" ? "🟢 Lowongan TERBUKA" : "🔴 Lowongan DITUTUP"}
                  </span>
                </label>
              </div>
            </div>

            {/* Akses Kandidat — datetime window */}
            <div style={{ background: "rgba(212,160,23,0.04)", border: "1px solid rgba(212,160,23,0.15)", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#D4A017", marginBottom: "0.5rem" }}>👥 Kandidat (Employer lihat Jobseeker)</div>
              <div style={{ fontSize: "0.78rem", color: "#475569", marginBottom: "1rem", lineHeight: 1.6 }}>
                Periode employer bisa melihat data kandidat jobseeker. Lebih sensitif — rekomendasi H-3 s/d H+2.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>Mulai Akses</div>
                  <input style={s.input} type="datetime-local" value={config.jobseekerAccessStart}
                    onChange={e => upd("jobseekerAccessStart", e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>Tutup Akses</div>
                  <input style={s.input} type="datetime-local" value={config.jobseekerAccessEnd}
                    onChange={e => upd("jobseekerAccessEnd", e.target.value)} />
                </div>
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

        {activeSection === "keuangan" && (() => {
          const bookings = ((allBookingsRaw || []) as any[]).filter(b => b.status === "confirmed");
          const cfg = dbConfig as any || {};
          const finRec: Record<string, any> = (() => { try { return JSON.parse(cfg.financialRecords || "{}"); } catch { return {}; } })();

          const getBoothPrice = (b: any): number => {
            // Check manual override first
            const override = parseFloat(finRec[b.bookingId]?.sewaOverride || "0");
            if (override > 0) return override;
            try {
              const booths = typeof b.selectedBooths === "string" ? JSON.parse(b.selectedBooths) : (b.selectedBooths || []);
              const total = (booths as any[]).reduce((s: number, bt: any) => s + (parseFloat(bt.price) || 0), 0);
              return total > 0 ? total : parseFloat(b.totalAmount || 0);
            } catch { return parseFloat(b.totalAmount || 0); }
          };

          const totalSewa       = bookings.reduce((s, b) => s + getBoothPrice(b), 0);
          const totalAdditional = bookings.reduce((s, b) => s + parseFloat(finRec[b.bookingId]?.additionalPrice || 0), 0);
          const totalGrand      = totalSewa + totalAdditional;
          const totalDiterima   = bookings.reduce((s, b) => s + parseFloat(finRec[b.bookingId]?.amountReceived || 0), 0);
          const totalSelisih    = totalGrand - totalDiterima;

          const editBkg = editingFin ? bookings.find(b => b.bookingId === editingFin) : null;

          const printReport = () => {
            const rows = bookings.map((b, i) => {
              const rec       = finRec[b.bookingId] || {};
              const sewa      = getBoothPrice(b);
              const add       = parseFloat(rec.additionalPrice || 0);
              const grand     = sewa + add;
              const pajakAmt  = parseFloat(rec.pajakAmount || 0);
              const isPPh     = rec.pajakType === "pph";
              const isPPN     = rec.pajakType === "ppn";
              const threshold = isPPh ? grand - pajakAmt : isPPN ? grand + pajakAmt : grand;
              const trm       = parseFloat(rec.amountReceived || 0);
              const sel       = threshold - trm;
              const status    = trm === 0 ? "Belum" : trm >= threshold ? "Lunas" : "Kurang";
              const pajakLabel= pajakAmt > 0 ? (rec.pajakType?.toUpperCase() + " Rp " + Math.round(pajakAmt).toLocaleString("id-ID")) : "—";
              const booths = (() => { try { const bs = typeof b.selectedBooths==="string" ? JSON.parse(b.selectedBooths) : (b.selectedBooths||[]); return bs.join(", "); } catch { return "-"; } })();
              return `<tr style="border-bottom:1px solid #e5e7eb">
                <td style="padding:8px 6px;text-align:center">${i+1}</td>
                <td style="padding:8px 6px;font-weight:600">${b.companyName}</td>
                <td style="padding:8px 6px">${booths}</td>
                <td style="padding:8px 6px;text-align:right">Rp ${sewa.toLocaleString("id-ID")}</td>
                <td style="padding:8px 6px;text-align:right">${add > 0 ? "Rp " + add.toLocaleString("id-ID") : "—"}</td>
                <td style="padding:8px 6px;text-align:right;font-weight:700">Rp ${grand.toLocaleString("id-ID")}</td>
                <td style="padding:8px 6px;text-align:right">${trm > 0 ? "Rp " + trm.toLocaleString("id-ID") : "—"}</td>
                <td style="padding:8px 6px;text-align:right;color:${sel > 0 ? "#dc2626" : sel < 0 ? "#059669" : "#374151"};font-weight:600">
                  ${sel === 0 ? "✓" : sel > 0 ? "-Rp " + sel.toLocaleString("id-ID") : "+Rp " + Math.abs(sel).toLocaleString("id-ID")}
                </td>
                <td style="padding:8px 6px;text-align:center">${rec.paymentDate || "—"}</td>
                <td style="padding:8px 6px;text-align:center;color:${status==="Lunas"?"#059669":status==="Kurang"?"#d97706":"#6b7280"};font-weight:700">${status}</td>
                <td style="padding:8px 6px;font-size:0.78rem;color:#6b7280">${pajakLabel}</td>
                ${rec.notes ? `<td style="padding:8px 6px;font-size:0.78rem;color:#6b7280">${rec.notes}</td>` : "<td></td>"}
              </tr>`;
            }).join("");
            const html = `<!DOCTYPE html><html><head><title>Laporan Keuangan GR2026</title>
            <style>body{font-family:Arial,sans-serif;font-size:13px;color:#111;padding:24px}
            h1{font-size:20px;margin-bottom:4px}h2{font-size:14px;color:#555;font-weight:400;margin:0 0 20px}
            table{width:100%;border-collapse:collapse}th{background:#0a1628;color:#fff;padding:8px 6px;text-align:left;font-size:12px}
            .summary{display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap}
            .sum-card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;min-width:140px}
            .sum-label{font-size:11px;color:#6b7280;margin-bottom:4px}
            .sum-val{font-size:16px;font-weight:700}
            @media print{body{padding:0}}</style></head><body>
            <h1>Laporan Keuangan — Grand Recruitment 2026</h1>
            <h2>Dicetak: ${new Date().toLocaleDateString("id-ID",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</h2>
            <div class="summary">
              <div class="sum-card"><div class="sum-label">Total Tagihan Sewa</div><div class="sum-val">Rp ${totalSewa.toLocaleString("id-ID")}</div></div>
              <div class="sum-card"><div class="sum-label">Total Biaya Additional</div><div class="sum-val">Rp ${totalAdditional.toLocaleString("id-ID")}</div></div>
              <div class="sum-card"><div class="sum-label">Grand Total Tagihan</div><div class="sum-val" style="color:#0a1628">Rp ${totalGrand.toLocaleString("id-ID")}</div></div>
              <div class="sum-card"><div class="sum-label">Total Diterima</div><div class="sum-val" style="color:#059669">Rp ${totalDiterima.toLocaleString("id-ID")}</div></div>
              <div class="sum-card"><div class="sum-label">Selisih</div><div class="sum-val" style="color:${totalSelisih>0?"#dc2626":totalSelisih<0?"#059669":"#374151"}">
                ${totalSelisih===0?"✓ Lunas":totalSelisih>0?"-Rp "+totalSelisih.toLocaleString("id-ID"):"+Rp "+Math.abs(totalSelisih).toLocaleString("id-ID")}</div></div>
              <div class="sum-card"><div class="sum-label">Jumlah Employer</div><div class="sum-val">${bookings.length}</div></div>
            </div>
            <table><thead><tr>
              <th>#</th><th>Perusahaan</th><th>Booth</th><th>Tagihan Sewa</th><th>Additional</th>
              <th>Grand Total</th><th>Jml Diterima</th><th>Selisih</th><th>Tgl Bayar</th><th>Status</th><th>Pajak</th><th>Catatan</th>
            </tr></thead><tbody>${rows}</tbody></table>
            <p style="margin-top:32px;font-size:11px;color:#9ca3af">Grand Recruitment 2026 · Politeknik Pariwisata NHI Bandung · www.grandrecruitment.id</p>
            </body></html>`;
            const w = window.open("", "_blank");
            if (w) { w.document.write(html); w.document.close(); w.print(); }
          };

          return (
            <div style={{ display: "grid", gridTemplateColumns: editingFin ? "1fr 380px" : "1fr", gap: "1.5rem", alignItems: "start" }}>
              <div>
                {/* Summary cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                  {[
                    { label: "Tagihan Sewa",    val: fmtRp(totalSewa),       color: "#818cf8" },
                    { label: "Biaya Additional", val: fmtRp(totalAdditional), color: "#f97316" },
                    { label: "Grand Tagihan",   val: fmtRp(totalGrand),      color: "#D4A017" },
                    { label: "Total Diterima",  val: fmtRp(totalDiterima),   color: "#22c55e" },
                    { label: "Selisih",          val: fmtRp(Math.abs(totalSelisih)) + (totalSelisih > 0 ? " ⚠" : totalSelisih < 0 ? " +" : " ✓"), color: totalSelisih > 0 ? "#ef4444" : totalSelisih < 0 ? "#22c55e" : "#14b8a6" },
                  ].map(c => (
                    <div key={c.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "1rem 1.25rem" }}>
                      <div style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.35rem" }}>{c.label}</div>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: c.color }}>{c.val}</div>
                    </div>
                  ))}
                </div>

                {/* Toolbar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" as const, gap: "0.5rem" }}>
                  <div style={{ fontSize: "0.83rem", color: "#64748b" }}>{bookings.length} employer confirmed · klik baris untuk edit</div>
                  <button onClick={printReport}
                    style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)", border: "none", color: "#fff", borderRadius: 8, padding: "0.45rem 1.1rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                    🖨️ Print / Export Laporan
                  </button>
                </div>

                {/* Table */}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                    <thead>
                      <tr>
                        {["No","Perusahaan","Booth","Tagihan Sewa","Biaya Additional","Grand Total","Jml Diterima","Selisih","Tgl Bayar","Status"].map(h => (
                          <th key={h} style={{ ...s.th, whiteSpace: "nowrap" as const }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.length === 0 ? (
                        <tr><td colSpan={10} style={{ ...s.td, textAlign: "center", color: "#64748b", padding: "2rem" }}>Belum ada employer confirmed.</td></tr>
                      ) : bookings.map((b: any, i: number) => {
                        const rec       = finRec[b.bookingId] || {};
                        const sewa      = getBoothPrice(b);
                        const add       = parseFloat(rec.additionalPrice || 0);
                        const grand     = sewa + add;
                        const pajakAmt  = parseFloat(rec.pajakAmount || 0);
                        const isPPh     = rec.pajakType === "pph";
                        const isPPN     = rec.pajakType === "ppn";
                        const threshold = isPPh ? grand - pajakAmt : isPPN ? grand + pajakAmt : grand;
                        const trm       = parseFloat(rec.amountReceived || 0);
                        const sel       = threshold - trm;
                        const status    = trm === 0 ? "— Belum" : trm >= threshold ? "✅ Lunas" : "⚠ Kurang";
                        const booths = (() => { try { const bs = typeof b.selectedBooths==="string"?JSON.parse(b.selectedBooths):(b.selectedBooths||[]); return bs.join(", "); } catch { return "-"; } })();
                        const isEditing = editingFin === b.bookingId;
                        return (
                          <tr key={b.bookingId} onClick={() => {
                            if (isEditing) { setEditingFin(null); }
                            else {
                              setEditingFin(b.bookingId);
                              setFinForm({ sewaOverride: rec.sewaOverride || "", additionalPrice: rec.additionalPrice || "", additionalNote: rec.additionalNote || "", amountReceived: rec.amountReceived || "", paymentDate: rec.paymentDate || "", notes: rec.notes || "", pajakType: rec.pajakType || "", pajakPersen: rec.pajakPersen || "", pajakAmount: rec.pajakAmount || "" });
                            }
                          }} style={{ cursor: "pointer", background: isEditing ? "rgba(212,160,23,0.06)" : "transparent", transition: "background 0.1s", borderLeft: isEditing ? "3px solid #D4A017" : "3px solid transparent" }}>
                            <td style={{ ...s.td, textAlign: "center" as const, color: "#64748b" }}>{i+1}</td>
                            <td style={s.td}><div style={{ fontWeight: 700 }}>{b.companyName}</div><div style={{ fontSize: "0.72rem", color: "#64748b" }}>{b.bookingId}</div></td>
                            <td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.78rem", color: "#D4A017" }}>{booths}</td>
                            <td style={{ ...s.td, textAlign: "right" as const }}>{fmtRp(sewa)}</td>
                            <td style={{ ...s.td, textAlign: "right" as const, color: add > 0 ? "#f97316" : "#64748b" }}>{add > 0 ? fmtRp(add) : "—"}</td>
                            <td style={{ ...s.td, textAlign: "right" as const, fontWeight: 700 }}>{fmtRp(grand)}</td>
                            <td style={{ ...s.td, textAlign: "right" as const, color: "#22c55e" }}>{trm > 0 ? fmtRp(trm) : "—"}</td>
                            <td style={{ ...s.td, textAlign: "right" as const, color: sel > 0 ? "#ef4444" : sel < 0 ? "#22c55e" : "#14b8a6", fontWeight: 700 }}>
                              {sel === 0 ? "✓" : sel > 0 ? "-"+fmtRp(sel) : "+"+fmtRp(Math.abs(sel))}
                            </td>
                            <td style={{ ...s.td, fontSize: "0.78rem", color: "#94a3b8" }}>{rec.paymentDate || "—"}</td>
                            <td style={{ ...s.td, fontWeight: 700, color: trm===0?"#64748b":trm>=grand?"#22c55e":"#f97316", fontSize: "0.78rem", whiteSpace: "nowrap" as const }}>{status}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Edit Panel */}
              {editingFin && editBkg && (
                <div style={{ ...s.card, position: "sticky" as const, top: 76, alignSelf: "start" as const }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <div style={{ fontWeight: 700, color: "#D4A017", fontSize: "0.9rem" }}>✏️ Edit Data Keuangan</div>
                    <button onClick={() => setEditingFin(null)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1.2rem" }}>×</button>
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>{editBkg.companyName}</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "1.25rem", fontFamily: "monospace" }}>{editBkg.bookingId}</div>

                  {/* Base price info */}
                  <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "0.75rem", marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: "0.25rem" }}>Harga Booth (referensi sistem)</div>
                    <div style={{ fontWeight: 700, color: "#818cf8" }}>{fmtRp(getBoothPrice(editBkg))}</div>
                    {getBoothPrice(editBkg) !== parseFloat(editBkg.totalAmount || 0) && (
                      <div style={{ fontSize: "0.68rem", color: "#475569", marginTop: "0.2rem" }}>
                        Total tagihan sistem: {fmtRp(parseFloat(editBkg.totalAmount || 0))} (termasuk fasilitas)
                      </div>
                    )}
                  </div>

                  {[
                    { label: "Tagihan Sewa Override (Rp)", key: "sewaOverride", type: "number", placeholder: "Kosongkan untuk pakai harga sistem", hint: "Isi bila harga sistem tidak sesuai (misal setelah negosiasi)" },
                    { label: "Biaya Additional (Rp)", key: "additionalPrice", type: "number", placeholder: "0", hint: "Biaya booth custom, dll" },
                    { label: "Keterangan Additional", key: "additionalNote", type: "text", placeholder: "Contoh: Booth custom LED", hint: "" },
                    { label: "Jumlah Diterima (Rp)", key: "amountReceived", type: "number", placeholder: "0", hint: "Sesuai yang benar-benar diterima" },
                    { label: "Tanggal Pembayaran", key: "paymentDate", type: "date", placeholder: "", hint: "" },
                    { label: "Catatan", key: "notes", type: "text", placeholder: "Catatan tambahan...", hint: "" },
                  ].map(field => (
                    <div key={field.key} style={{ marginBottom: "0.85rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#94a3b8", display: "block", marginBottom: "0.3rem" }}>{field.label}</label>
                      <input
                        type={field.type}
                        value={(finForm as any)[field.key]}
                        onChange={e => setFinForm(f => ({ ...f, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        style={{ width: "100%", boxSizing: "border-box" as const, background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 0.75rem", fontSize: "0.83rem", color: "#f1f5f9", outline: "none" }}
                      />
                      {field.hint && <div style={{ fontSize: "0.68rem", color: "#475569", marginTop: "0.2rem" }}>{field.hint}</div>}
                    </div>
                  ))}

                  {/* Pajak */}
                  <div style={{ marginBottom: "0.85rem" }}>
                    <label style={{ fontSize: "0.75rem", color: "#94a3b8", display: "block", marginBottom: "0.4rem" }}>Jenis Pajak</label>
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      {(["", "pph", "ppn"] as const).map(t => (
                        <button key={t} onClick={() => setFinForm(f => ({ ...f, pajakType: t, pajakPersen: "", pajakAmount: "" }))}
                          style={{ padding: "0.35rem 0.75rem", borderRadius: 7, border: `1px solid ${finForm.pajakType === t ? "#D4A017" : "rgba(255,255,255,0.1)"}`, background: finForm.pajakType === t ? "rgba(212,160,23,0.12)" : "transparent", color: finForm.pajakType === t ? "#D4A017" : "#64748b", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
                          {t === "" ? "Tidak Ada" : t === "pph" ? "PPh" : "PPN"}
                        </button>
                      ))}
                    </div>
                    {finForm.pajakType && (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "0.7rem", color: "#475569", marginBottom: "0.25rem" }}>Persentase (%) — opsional</div>
                          <input type="number" value={finForm.pajakPersen}
                            onChange={e => {
                              const pct   = e.target.value;
                              const sewa  = getBoothPrice(editBkg!);
                              const add   = parseFloat(finForm.additionalPrice || finRec[editingFin!]?.additionalPrice || 0);
                              const grand = sewa + add;
                              const auto  = pct ? String(Math.round(grand * parseFloat(pct) / 100)) : "";
                              setFinForm(f => ({ ...f, pajakPersen: pct, pajakAmount: auto }));
                            }}
                            placeholder="2"
                            style={{ width: "100%", boxSizing: "border-box" as const, background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 0.75rem", fontSize: "0.83rem", color: "#f1f5f9", outline: "none" }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "0.7rem", color: "#D4A017", marginBottom: "0.25rem" }}>Jumlah Pajak (Rp) — bisa manual</div>
                          <input type="number" value={finForm.pajakAmount}
                            onChange={e => setFinForm(f => ({ ...f, pajakAmount: e.target.value, pajakPersen: "" }))}
                            placeholder="187000"
                            style={{ width: "100%", boxSizing: "border-box" as const, background: "#0f172a", border: "1px solid rgba(212,160,23,0.3)", borderRadius: 8, padding: "0.5rem 0.75rem", fontSize: "0.83rem", color: "#f1f5f9", outline: "none" }}
                          />
                        </div>
                      </div>
                    )}
                    {finForm.pajakType && parseFloat(finForm.pajakAmount || "0") > 0 && (() => {
                      const sewa  = getBoothPrice(editBkg!);
                      const add   = parseFloat(finForm.additionalPrice || finRec[editingFin!]?.additionalPrice || 0);
                      const grand = sewa + add;
                      const amt   = parseFloat(finForm.pajakAmount);
                      const net   = finForm.pajakType === "pph" ? grand - amt : grand + amt;
                      return (
                        <div style={{ marginTop: "0.5rem", padding: "0.5rem 0.75rem", background: "rgba(212,160,23,0.06)", borderRadius: 7, fontSize: "0.78rem" }}>
                          <span style={{ color: "#64748b" }}>{finForm.pajakType === "pph" ? "PPh" : "PPN"} = </span>
                          <span style={{ color: "#D4A017", fontWeight: 700 }}>{fmtRp(amt)}</span>
                          <div style={{ marginTop: "0.25rem", color: "#94a3b8" }}>
                            {finForm.pajakType === "pph" ? "Bersih yang seharusnya diterima: " : "Total yang harus dibayar: "}
                            <strong style={{ color: "#22c55e" }}>{fmtRp(net)}</strong>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Upload bukti bayar */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", color: "#94a3b8", display: "block", marginBottom: "0.3rem" }}>Upload Bukti Bayar</label>
                    {(() => {
                      const rec = finRec[editingFin] || {};
                      return rec.buktiPaymentUrl ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                          <a href={rec.buktiPaymentUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.78rem", color: "#7dd3fc", textDecoration: "none" }}>📎 Lihat bukti saat ini</a>
                        </div>
                      ) : null;
                    })()}
                    <input type="file" accept="image/*,.pdf" disabled={finUploading}
                      onChange={async e => {
                        const file = e.target.files?.[0]; if (!file) return;
                        setFinUploading(true);
                        toast.loading("Mengupload bukti bayar...", { id: "fin-upload" });
                        const url = await uploadBuktiFin(file, editingFin!);
                        toast.dismiss("fin-upload");
                        if (url) {
                          const cfg = dbConfig as any || {};
                          const existing: Record<string, any> = (() => { try { return JSON.parse(cfg.financialRecords || "{}"); } catch { return {}; } })();
                          const updated = { ...existing, [editingFin!]: { ...(existing[editingFin!] || {}), ...finForm, buktiPaymentUrl: url } };
                          await saveFinMutation.mutateAsync({ financialRecords: JSON.stringify(updated) });
                          toast.success("Bukti bayar berhasil diupload!");
                        }
                        setFinUploading(false);
                        e.target.value = "";
                      }}
                      style={{ width: "100%", boxSizing: "border-box" as const, background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.45rem", fontSize: "0.78rem", color: "#94a3b8", cursor: "pointer" }}
                    />
                  </div>

                  <button
                    onClick={async () => { await saveFinRecord(editingFin!); }}
                    disabled={saveFinMutation.isPending}
                    style={{ width: "100%", background: "linear-gradient(135deg,#D4A017,#b8860b)", border: "none", color: "#fff", borderRadius: 8, padding: "0.65rem", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>
                    {saveFinMutation.isPending ? "⏳ Menyimpan..." : "💾 Simpan Data Keuangan"}
                  </button>
                </div>
              )}
            </div>
          );
        })()}

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
