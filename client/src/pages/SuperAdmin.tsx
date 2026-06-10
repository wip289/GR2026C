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
  const verifyPwMutation = trpc.event.verifyPanitiaPassword.useMutation({
    onSuccess: d => { sessionStorage.setItem("panitia_token", d.token); sessionStorage.setItem("sa_auth", "1"); onLogin(); },
    onError: () => toast.error("Password salah"),
  });

  const handleLogin = () => { if (pw.trim()) verifyPwMutation.mutate({ role: "admin", password: pw }); };

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
  const [tab, setTab] = useState<"employer" | "jobseeker" | "security">("employer");
  const [newPwPanitia, setNewPwPanitia] = useState("");
  const [newPwAdmin, setNewPwAdmin]     = useState("");
  const setPwMutation = trpc.event.setPanitiaPassword.useMutation({
    onSuccess: () => { toast.success("Password berhasil diganti"); setNewPwPanitia(""); setNewPwAdmin(""); },
    onError: e => toast.error("Gagal: " + e.message),
  });
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
  const [jsSearchSA, setJsSearchSA] = useState("");
  const [jsPageSA,   setJsPageSA]   = useState(1);
  const JS_SA_PAGE = 25;

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
        <button onClick={() => setTab("security")}
          style={{ padding:"0.5rem 1.25rem", borderRadius:8, border:`1px solid ${tab==="security"?"#ef4444":"rgba(255,255,255,0.1)"}`, background:tab==="security"?"rgba(239,68,68,0.12)":"transparent", color:tab==="security"?"#ef4444":"#64748b", fontWeight:600, fontSize:"0.85rem", cursor:"pointer" }}>
          🔐 Keamanan
        </button>
      </div>

      {/* ── KEAMANAN: GANTI PASSWORD ── */}
      {tab === "security" && (
        <div>
          <div style={{ fontSize:"0.95rem", fontWeight:700, color:"#f1f5f9", marginBottom:"0.25rem" }}>Ganti Password Akses</div>
          <div style={{ fontSize:"0.78rem", color:"#475569", marginBottom:"1.25rem" }}>
            Password disimpan terenkripsi di database dan dicek di server. Setelah diganti, password lama langsung tidak berlaku.
            Panitia yang sedang login tetap aktif sampai sesinya habis (maks. 12 jam).
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%,300px),1fr))", gap:"1rem" }}>
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(212,160,23,0.25)", borderRadius:16, padding:"1.5rem" }}>
              <div style={{ fontWeight:700, color:"#D4A017", fontSize:"0.9rem", marginBottom:"0.25rem" }}>Password Panitia</div>
              <div style={{ fontSize:"0.75rem", color:"#64748b", marginBottom:"0.85rem" }}>Untuk akses Boss Panel (/boss). Ganti setiap pergantian tim panitia.</div>
              <input type="password" value={newPwPanitia} onChange={e => setNewPwPanitia(e.target.value)}
                placeholder="Password baru (min. 8 karakter)"
                style={{ width:"100%", background:"#0d1f35", border:"1px solid rgba(255,255,255,0.15)", color:"#f1f5f9", borderRadius:8, padding:"0.6rem 0.9rem", fontSize:"0.85rem", boxSizing:"border-box" as const, marginBottom:"0.75rem" }} />
              <button disabled={newPwPanitia.length < 8 || setPwMutation.isPending}
                onClick={() => { if (window.confirm("Ganti password panitia? Password lama langsung tidak berlaku.")) setPwMutation.mutate({ role: "panitia", newPassword: newPwPanitia }); }}
                style={{ width:"100%", background: newPwPanitia.length >= 8 ? "linear-gradient(135deg,#D4A017,#B8860B)" : "rgba(255,255,255,0.06)", border:"none", color: newPwPanitia.length >= 8 ? "#fff" : "#475569", borderRadius:8, padding:"0.6rem", fontSize:"0.85rem", fontWeight:700, cursor: newPwPanitia.length >= 8 ? "pointer" : "not-allowed" }}>
                Ganti Password Panitia
              </button>
            </div>
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:16, padding:"1.5rem" }}>
              <div style={{ fontWeight:700, color:"#ef4444", fontSize:"0.9rem", marginBottom:"0.25rem" }}>Password SuperAdmin</div>
              <div style={{ fontSize:"0.75rem", color:"#64748b", marginBottom:"0.85rem" }}>Untuk akses halaman ini (/superadmin). Jangan dibagikan ke panitia.</div>
              <input type="password" value={newPwAdmin} onChange={e => setNewPwAdmin(e.target.value)}
                placeholder="Password baru (min. 8 karakter)"
                style={{ width:"100%", background:"#0d1f35", border:"1px solid rgba(255,255,255,0.15)", color:"#f1f5f9", borderRadius:8, padding:"0.6rem 0.9rem", fontSize:"0.85rem", boxSizing:"border-box" as const, marginBottom:"0.75rem" }} />
              <button disabled={newPwAdmin.length < 8 || setPwMutation.isPending}
                onClick={() => { if (window.confirm("Ganti password SuperAdmin? Pastikan kamu mencatat password barunya — tidak ada fitur lupa password.")) setPwMutation.mutate({ role: "admin", newPassword: newPwAdmin }); }}
                style={{ width:"100%", background: newPwAdmin.length >= 8 ? "linear-gradient(135deg,#dc2626,#b91c1c)" : "rgba(255,255,255,0.06)", border:"none", color: newPwAdmin.length >= 8 ? "#fff" : "#475569", borderRadius:8, padding:"0.6rem", fontSize:"0.85rem", fontWeight:700, cursor: newPwAdmin.length >= 8 ? "pointer" : "not-allowed" }}>
                Ganti Password SuperAdmin
              </button>
            </div>
          </div>
        </div>
      )}

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

          {/* Search + pagination */}
          {(() => {
            const jsFiltered = jsList.filter((j: any) =>
              !jsSearchSA.trim() || j.namaLengkap?.toLowerCase().includes(jsSearchSA.trim().toLowerCase()) || j.registrationId?.toLowerCase().includes(jsSearchSA.trim().toLowerCase())
            );
            const totalPages = Math.max(1, Math.ceil(jsFiltered.length / JS_SA_PAGE));
            const safePage   = Math.min(jsPageSA, totalPages);
            const paginated  = jsFiltered.slice((safePage - 1) * JS_SA_PAGE, safePage * JS_SA_PAGE);

            return (
              <>
                {/* Search bar */}
                <div style={{ display:"flex", gap:"0.6rem", alignItems:"center", marginBottom:"1rem", flexWrap:"wrap" as const }}>
                  <input value={jsSearchSA} onChange={e => { setJsSearchSA(e.target.value); setJsPageSA(1); }}
                    placeholder="🔍 Cari nama atau Registration ID..."
                    style={{ flex:1, minWidth:200, background:"#0f172a", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, padding:"0.45rem 0.85rem", fontSize:"0.83rem", color:"#f1f5f9", outline:"none" }}
                  />
                  {jsSearchSA && <button onClick={() => { setJsSearchSA(""); setJsPageSA(1); }} style={{ background:"none", border:"1px solid rgba(248,113,113,0.35)", color:"#f87171", borderRadius:7, padding:"0.4rem 0.75rem", fontSize:"0.78rem", cursor:"pointer" }}>✕ Reset</button>}
                  <span style={{ fontSize:"0.78rem", color:"#64748b", whiteSpace:"nowrap" as const }}>
                    {jsSearchSA ? `${jsFiltered.length} hasil` : `${jsList.length} total`}
                  </span>
                </div>

                {jobseekersQuery.isLoading ? (
                  <div style={{ textAlign:"center", color:"#475569", padding:"2rem" }}>Memuat data...</div>
                ) : paginated.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"3rem", background:"rgba(255,255,255,0.02)", borderRadius:12, color:"#475569" }}>
                    {jsSearchSA ? `Tidak ada hasil untuk "${jsSearchSA}"` : "Belum ada jobseeker terdaftar"}
                  </div>
                ) : (
                  <div style={{ display:"grid", gap:"0.6rem" }}>
                    {paginated.map((j: any) => {
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"1rem", flexWrap:"wrap" as const, gap:"0.5rem" }}>
                    <span style={{ fontSize:"0.78rem", color:"#64748b" }}>
                      Menampilkan {(safePage-1)*JS_SA_PAGE+1}–{Math.min(safePage*JS_SA_PAGE, jsFiltered.length)} dari {jsFiltered.length}
                    </span>
                    <div style={{ display:"flex", gap:"0.4rem", alignItems:"center" }}>
                      <button onClick={() => setJsPageSA(1)} disabled={safePage===1} style={{ padding:"0.3rem 0.6rem", background:safePage===1?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", color:safePage===1?"#475569":"#f1f5f9", borderRadius:6, cursor:safePage===1?"default":"pointer", fontSize:"0.8rem" }}>«</button>
                      <button onClick={() => setJsPageSA(p => Math.max(1,p-1))} disabled={safePage===1} style={{ padding:"0.3rem 0.7rem", background:safePage===1?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", color:safePage===1?"#475569":"#f1f5f9", borderRadius:6, cursor:safePage===1?"default":"pointer", fontSize:"0.8rem" }}>‹ Prev</button>
                      <span style={{ fontSize:"0.8rem", color:"#D4A017", fontWeight:700, padding:"0 0.5rem" }}>{safePage} / {totalPages}</span>
                      <button onClick={() => setJsPageSA(p => Math.min(totalPages,p+1))} disabled={safePage===totalPages} style={{ padding:"0.3rem 0.7rem", background:safePage===totalPages?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", color:safePage===totalPages?"#475569":"#f1f5f9", borderRadius:6, cursor:safePage===totalPages?"default":"pointer", fontSize:"0.8rem" }}>Next ›</button>
                      <button onClick={() => setJsPageSA(totalPages)} disabled={safePage===totalPages} style={{ padding:"0.3rem 0.6rem", background:safePage===totalPages?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", color:safePage===totalPages?"#475569":"#f1f5f9", borderRadius:6, cursor:safePage===totalPages?"default":"pointer", fontSize:"0.8rem" }}>»</button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
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
            // Pre-compute per-row data
            const rowData = bookings.map((b, i) => {
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
              const booths    = (() => { try { const bs = typeof b.selectedBooths==="string" ? JSON.parse(b.selectedBooths) : (b.selectedBooths||[]); return Array.isArray(bs) ? bs.map((x:any)=>x.id||x).join(", ") : "-"; } catch { return "-"; } })();
              return { i, b, rec, sewa, add, grand, pajakAmt, threshold, trm, sel, status, pajakLabel, booths };
            });

            // Totals for footer
            const sumSewa      = rowData.reduce((s,r) => s + r.sewa, 0);
            const sumAdd       = rowData.reduce((s,r) => s + r.add, 0);
            const sumGrand     = rowData.reduce((s,r) => s + r.grand, 0);
            const sumPajak     = rowData.reduce((s,r) => s + r.pajakAmt, 0);
            const sumDiterima  = rowData.reduce((s,r) => s + r.trm, 0);
            const sumSelisih   = rowData.reduce((s,r) => s + r.sel, 0);
            const rp = (n:number) => n > 0 ? "Rp " + Math.round(n).toLocaleString("id-ID") : (n < 0 ? "-Rp " + Math.round(Math.abs(n)).toLocaleString("id-ID") : "—");

            const rows = rowData.map(({i,b,rec,sewa,add,grand,pajakAmt,trm,sel,status,pajakLabel,booths}) => {
              const rowBg  = i % 2 === 0 ? "#ffffff" : "#f8fafc";
              const selClr = sel > 0 ? "#dc2626" : sel < 0 ? "#059669" : "#374151";
              const stsClr = status==="Lunas" ? "#059669" : status==="Kurang" ? "#d97706" : "#94a3b8";
              return `<tr style="background:${rowBg};border-bottom:1px solid #e5e7eb">
                <td style="padding:9px 8px;text-align:center;color:#94a3b8;font-size:11px">${i+1}</td>
                <td style="padding:9px 8px">
                  <div style="font-weight:700;font-size:13px">${b.companyName}</div>
                  <div style="font-size:10px;color:#94a3b8;margin-top:2px">${b.bookingId}</div>
                </td>
                <td style="padding:9px 8px;font-size:12px;color:#475569">${booths}</td>
                <td style="padding:9px 8px;text-align:right;font-size:12px">${rp(sewa)}</td>
                <td style="padding:9px 8px;text-align:right;font-size:12px;color:${add>0?"#d97706":"#94a3b8"}">${add>0?rp(add):"—"}</td>
                <td style="padding:9px 8px;text-align:right;font-weight:700">${rp(grand)}</td>
                <td style="padding:9px 8px;text-align:right;font-size:12px;color:#059669">${trm>0?rp(trm):"—"}</td>
                <td style="padding:9px 8px;text-align:right;font-weight:700;color:${selClr}">${sel===0?"✓ Lunas":rp(sel)}</td>
                <td style="padding:9px 8px;text-align:center;font-size:11px;color:#64748b">${rec.paymentDate||"—"}</td>
                <td style="padding:9px 8px;text-align:center;font-weight:700;color:${stsClr}">${status}</td>
                <td style="padding:9px 8px;font-size:11px;color:#64748b">${pajakLabel}</td>
                <td style="padding:9px 8px;font-size:11px;color:#94a3b8">${rec.notes||"—"}</td>
              </tr>`;
            }).join("");

            const totalRow = `
              <tr style="background:#0a1628;border-top:2px solid #D4A017">
                <td colspan="3" style="padding:11px 8px;color:#D4A017;font-weight:800;font-size:13px">TOTAL (${rowData.length} Employer)</td>
                <td style="padding:11px 8px;text-align:right;color:#fff;font-weight:700">${rp(sumSewa)}</td>
                <td style="padding:11px 8px;text-align:right;color:#f97316;font-weight:700">${sumAdd>0?rp(sumAdd):"—"}</td>
                <td style="padding:11px 8px;text-align:right;color:#D4A017;font-weight:800;font-size:14px">${rp(sumGrand)}</td>
                <td style="padding:11px 8px;text-align:right;color:#4ade80;font-weight:700">${rp(sumDiterima)}</td>
                <td style="padding:11px 8px;text-align:right;font-weight:800;color:${sumSelisih>0?"#f87171":sumSelisih<0?"#4ade80":"#4ade80"}">${sumSelisih===0?"✓ Lunas":rp(sumSelisih)}</td>
                <td colspan="3" style="padding:11px 8px;color:#64748b;font-size:11px">${sumPajak>0?"Total pajak: "+rp(sumPajak):""}</td>
                <td></td>
              </tr>`;

            const lunas  = rowData.filter(r => r.status === "Lunas").length;
            const kurang = rowData.filter(r => r.status === "Kurang").length;
            const belum  = rowData.filter(r => r.status === "Belum").length;

            const html = `<!DOCTYPE html>
<html lang="id"><head>
<meta charset="UTF-8">
<title>Laporan Keuangan GR2026</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1e293b; background: #fff; padding: 28px 32px; }
  .header { border-bottom: 3px solid #0a1628; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
  .header-left h1 { font-size: 22px; font-weight: 800; color: #0a1628; letter-spacing: -0.3px; }
  .header-left h2 { font-size: 13px; color: #64748b; font-weight: 400; margin-top: 4px; }
  .header-right { text-align: right; font-size: 11px; color: #94a3b8; line-height: 1.6; }
  .summary-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 24px; }
  .sum-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; background: #f8fafc; }
  .sum-card.accent { background: #0a1628; border-color: #0a1628; }
  .sum-card.green  { background: #f0fdf4; border-color: #86efac; }
  .sum-card.red    { background: #fef2f2; border-color: #fca5a5; }
  .sum-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; font-weight: 600; }
  .sum-card.accent .sum-label { color: #94a3b8; }
  .sum-val  { font-size: 15px; font-weight: 800; color: #0a1628; }
  .sum-card.accent .sum-val { color: #D4A017; }
  .sum-card.green  .sum-val { color: #16a34a; }
  .sum-card.red    .sum-val { color: #dc2626; }
  .status-bar { display: flex; gap: 12px; margin-bottom: 16px; font-size: 12px; }
  .status-pill { padding: 4px 12px; border-radius: 20px; font-weight: 700; }
  .pill-lunas  { background: #dcfce7; color: #16a34a; }
  .pill-kurang { background: #fef9c3; color: #b45309; }
  .pill-belum  { background: #f1f5f9; color: #64748b; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px; }
  thead th { background: #0a1628; color: #fff; padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
  thead th.right { text-align: right; }
  thead th.center { text-align: center; }
  tbody tr:hover { background: #f0f9ff; }
  tfoot td { border-top: 2px solid #D4A017; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
  @media print {
    body { padding: 16px 20px; font-size: 11px; }
    .header { padding-bottom: 10px; margin-bottom: 14px; }
    .summary-grid { margin-bottom: 16px; gap: 8px; }
    .sum-val { font-size: 13px; }
    thead th { font-size: 10px; padding: 7px 6px; }
    table { font-size: 11px; }
    @page { margin: 1.5cm; size: A4 landscape; }
  }
</style>
</head><body>
<div class="header">
  <div class="header-left">
    <h1>Laporan Keuangan — Grand Recruitment 2026</h1>
    <h2>Politeknik Pariwisata NHI Bandung · www.grandrecruitment.id</h2>
  </div>
  <div class="header-right">
    Dicetak: ${new Date().toLocaleDateString("id-ID",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}<br>
    Total Employer Confirmed: ${rowData.length}
  </div>
</div>

<div class="summary-grid">
  <div class="sum-card"><div class="sum-label">Tagihan Sewa</div><div class="sum-val">Rp ${Math.round(sumSewa).toLocaleString("id-ID")}</div></div>
  <div class="sum-card"><div class="sum-label">Biaya Additional</div><div class="sum-val">Rp ${Math.round(sumAdd).toLocaleString("id-ID")}</div></div>
  <div class="sum-card accent"><div class="sum-label">Grand Total Tagihan</div><div class="sum-val">Rp ${Math.round(sumGrand).toLocaleString("id-ID")}</div></div>
  <div class="sum-card green"><div class="sum-label">Total Diterima</div><div class="sum-val">Rp ${Math.round(sumDiterima).toLocaleString("id-ID")}</div></div>
  <div class="sum-card ${sumSelisih>0?"red":"green"}"><div class="sum-label">Selisih</div><div class="sum-val">${sumSelisih===0?"✓ Lunas":(sumSelisih>0?"-":"+")+"Rp "+Math.round(Math.abs(sumSelisih)).toLocaleString("id-ID")}</div></div>
  <div class="sum-card"><div class="sum-label">Total Pajak</div><div class="sum-val">${sumPajak>0?"Rp "+Math.round(sumPajak).toLocaleString("id-ID"):"—"}</div></div>
</div>

<div class="status-bar">
  <span>Status pembayaran:</span>
  <span class="status-pill pill-lunas">✅ Lunas: ${lunas}</span>
  <span class="status-pill pill-kurang">⚠ Kurang: ${kurang}</span>
  <span class="status-pill pill-belum">— Belum: ${belum}</span>
</div>

<table>
  <thead>
    <tr>
      <th class="center" style="width:32px">#</th>
      <th>Perusahaan</th>
      <th>Booth</th>
      <th class="right">Tagihan Sewa</th>
      <th class="right">Additional</th>
      <th class="right">Grand Total</th>
      <th class="right">Jml Diterima</th>
      <th class="right">Selisih</th>
      <th class="center">Tgl Bayar</th>
      <th class="center">Status</th>
      <th>Pajak</th>
      <th>Catatan</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
  <tfoot>${totalRow}</tfoot>
</table>

<div class="footer">
  <span>Grand Recruitment 2026 · IKA NHI Bandung · Politeknik Pariwisata NHI Bandung</span>
  <span>Dokumen ini digenerate otomatis dari sistem www.grandrecruitment.id</span>
</div>
</body></html>`;
            const w = window.open("", "_blank");
            if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400); }
          };

          const exportCSV = () => {
            const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
            const rp  = (n: number) => Math.round(n);

            const headers = ["No","Perusahaan","Booking ID","Booth","Tagihan Sewa","Biaya Additional","Grand Total","Jml Diterima","Selisih","Tgl Bayar","Status","Pajak (Rp)","Jenis Pajak","Catatan"];

            let sumSewa = 0, sumAdd = 0, sumGrand = 0, sumDiterima = 0, sumSelisih = 0, sumPajak = 0;

            const dataRows = bookings.map((b: any, i: number) => {
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
              const booths    = (() => { try { const bs = typeof b.selectedBooths==="string"?JSON.parse(b.selectedBooths):(b.selectedBooths||[]); return Array.isArray(bs)?bs.map((x:any)=>x.id||x).join(" "):"-"; } catch { return "-"; } })();
              sumSewa += sewa; sumAdd += add; sumGrand += grand;
              sumDiterima += trm; sumSelisih += sel; sumPajak += pajakAmt;
              return [i+1, b.companyName, b.bookingId, booths, rp(sewa), rp(add), rp(grand), rp(trm), rp(sel), rec.paymentDate||"", status, rp(pajakAmt), rec.pajakType?.toUpperCase()||"", rec.notes||""].map(esc).join(",");
            });

            const totalRow = ["","TOTAL","","",rp(sumSewa),rp(sumAdd),rp(sumGrand),rp(sumDiterima),rp(sumSelisih),"","",rp(sumPajak),"",""].map(esc).join(",");

            const csv = [headers.map(esc).join(","), ...dataRows, "", totalRow].join(String.fromCharCode(10));

            const bom  = "﻿"; // UTF-8 BOM agar Excel baca karakter Indonesia dengan benar
            const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement("a");
            a.href     = url;
            a.download = `Laporan_Keuangan_GR2026_${new Date().toISOString().slice(0,10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
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
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={exportCSV}
                      style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", color: "#fff", borderRadius: 8, padding: "0.45rem 1.1rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                      📊 Export CSV
                    </button>
                    <button onClick={printReport}
                      style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)", border: "none", color: "#fff", borderRadius: 8, padding: "0.45rem 1.1rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                      🖨️ Print / PDF
                    </button>
                  </div>
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
