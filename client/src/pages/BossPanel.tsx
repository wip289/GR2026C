import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");
const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—";

type TabId = "overview" | "employer" | "jobseeker" | "interview";

const s = {
  page:  { minHeight: "100vh", background: "#0a1628", fontFamily: "system-ui, sans-serif", color: "#f1f5f9" } as React.CSSProperties,
  nav:   { background: "rgba(10,22,40,0.98)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(212,160,23,0.3)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky" as const, top: 0, zIndex: 50 },
  wrap:  { maxWidth: 1200, margin: "0 auto", padding: "2rem 1.25rem" },
  card:  { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" },
  tab:   (active: boolean) => ({ padding: "0.6rem 1.25rem", borderRadius: 8, border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, background: active ? "#D4A017" : "transparent", color: active ? "#fff" : "#64748b", transition: "all 0.2s", whiteSpace: "nowrap" as const }),
  badge: (color: string) => ({ display: "inline-block", padding: "0.2rem 0.65rem", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, background: `${color}20`, color, border: `1px solid ${color}40` }),
  th:    { padding: "0.75rem 1rem", textAlign: "left" as const, fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" as const },
  td:    { padding: "0.85rem 1rem", fontSize: "0.85rem", borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle" as const },
};

const SLOTS = ["09.00–10.00", "10.00–11.00", "11.00–12.00", "13.00–14.00", "14.00–15.00", "15.00–16.00"];
const DAYS  = ["Senin 8 Jun", "Selasa 9 Jun"];
const INTERVIEW_BOOTHS = ["E1","E2","E3","E4","E5","E6","E7","E8","E9","E10"];
const TAKEN_SLOTS: Record<string, string> = {};  // Will be built from real DB data

export default function BossPanel() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedEmployer, setSelectedEmployer] = useState<string | null>(null);
  const [selectedJobseeker, setSelectedJobseeker] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);

  // ── Real data from DB ──
  const { data: employerData, refetch: refetchEmployers } = trpc.event.getAllEmployerBookings.useQuery();
  const { data: jobseekerData } = trpc.event.getAllJobseekers.useQuery();
  const { data: interviewRaw } = trpc.event.getAllInterviewBookings.useQuery();
  const updateStatusMutation = trpc.event.updateEmployerBookingStatus.useMutation({
    onSuccess: () => refetchEmployers(),
  });

  const employers = employerData || [];
  const jobseekers = jobseekerData || [];

  const totalRevenue = employers.filter((e: any) => e.status === "confirmed")
    .reduce((s: number, e: any) => s + (Array.isArray(e.booths) ? e.booths.reduce((bs: number, b: any) => bs + (b.price || 0), 0) : 0), 0);
  const pendingRevenue = employers.filter((e: any) => e.status === "pending")
    .reduce((s: number, e: any) => s + (Array.isArray(e.booths) ? e.booths.reduce((bs: number, b: any) => bs + (b.price || 0), 0) : 0), 0);
  const totalBooths = employers.reduce((s: number, e: any) => s + (Array.isArray(e.booths) ? e.booths.length : 0), 0);
  const bookedSlots = Object.keys(TAKEN_SLOTS).length;

  const handleApprove = (bookingId: string) => {
    updateStatusMutation.mutate({ bookingId, status: "confirmed" });
    toast.success("Pembayaran dikonfirmasi!", { description: `Booking ${bookingId} sudah disetujui` });
  };
  const handleReject = (bookingId: string) => {
    updateStatusMutation.mutate({ bookingId, status: "rejected" });
    toast.error("Booking ditolak", { description: `Booking ${bookingId} telah ditolak` });
  };

  // Build real taken slots from DB
  const realTakenSlots: Record<string, string> = {};
  ((interviewRaw || []) as any[]).forEach((b: any) => {
    if (b.status === "active") {
      const key = `${b.boothId}-${b.day}-${b.slotIndex}`;
      realTakenSlots[key] = b.companyName || b.employerBookingId;
    }
  });

  const selEmp = selectedEmployer ? employers.find((e: any) => e.bookingId === selectedEmployer) : null;
  const selJS  = selectedJobseeker ? jobseekers.find((j: any) => j.registrationId === selectedJobseeker) : null;

  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={s.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 32 }} />
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: "1rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#D4A017" }}>Panel Panitia</div>
            <div style={{ fontSize: "0.7rem", color: "#475569" }}>Grand Recruitment 2026</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button onClick={() => navigate("/planner")} style={{ background: "linear-gradient(135deg,#D4A017,#B8860B)", border: "none", color: "#fff", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 0 12px rgba(212,160,23,0.3)" }}>
            📊 Financial Planner
          </button>
          <button onClick={() => navigate("/phase1")} style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.3)", color: "#14b8a6", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
            🏗️ Phase 1
          </button>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.82rem", cursor: "pointer" }}>
            🏠 Beranda
          </button>
        </div>
      </nav>

      <div style={s.wrap}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, marginBottom: "0.25rem" }}>Panel Panitia GR2026</h1>
          <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Kelola employer, jobseeker, dan operasional event</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "0.5rem", marginBottom: "1.5rem", overflowX: "auto" }}>
          {([
            { id: "overview" as TabId, label: "📊 Overview" },
            { id: "employer" as TabId, label: `🏢 Employer (${employers.length})` },
            { id: "jobseeker" as TabId, label: `🎓 Jobseeker (${jobseekers.length})` },
            { id: "interview" as TabId, label: "📅 Interview Slots" },
          ]).map(tab => (
            <button key={tab.id} style={s.tab(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div>
            {/* KPI */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,200px),1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              {[
                { label: "Revenue Confirmed", val: fmt(totalRevenue), color: "#14b8a6", icon: "💰" },
                { label: "Revenue Pending", val: fmt(pendingRevenue), color: "#f97316", icon: "⏳" },
                { label: "Total Employer", val: employers.length, color: "#D4A017", icon: "🏢" },
                { label: "Jobseeker Terdaftar", val: jobseekers.length, color: "#818cf8", icon: "🎓" },
                { label: "Booth Terjual", val: totalBooths, color: "#10b981", icon: "📦" },
                { label: "Slot Interview Terisi", val: bookedSlots, color: "#60a5fa", icon: "📅" },
              ].map(kpi => (
                <div key={kpi.label} style={{ background: `${kpi.color}08`, border: `1px solid ${kpi.color}25`, borderRadius: 14, padding: "1.25rem" }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{kpi.icon}</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: kpi.color }}>{kpi.val}</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.25rem" }}>{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Quick Access */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,200px),1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {[
                { icon: "✅", label: "Check-in & Counter", desc: "Hari H · Scan QR jobseeker & employer", link: "/checkin", color: "#60a5fa" },
                { icon: "🗺️", label: "Booth Management", desc: "Denah, rekap, special request", link: "/booth-management", color: "#D4A017" },
                { icon: "👥", label: "Manajemen Panitia", desc: "Struktur organisasi & divisi", link: "/panitia", color: "#818cf8" },
                { icon: "📋", label: "Generate Proposal", desc: "Proposal employer & sponsor", link: "/proposal", color: "#f97316" },
              ].map(item => (
                <div key={item.label} onClick={() => navigate(item.link)}
                  style={{ background: `${item.color}08`, border: `1px solid ${item.color}25`, borderRadius: 12, padding: "1rem", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = `${item.color}15`)}
                  onMouseLeave={e => (e.currentTarget.style.background = `${item.color}08`)}>
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, color: item.color, fontSize: "0.88rem" }}>{item.label}</div>
                  <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.2rem" }}>{item.desc}</div>
                </div>
              ))}
            </div>

            {/* Pending approvals */}
            <div style={s.card}>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#f97316", marginBottom: "1rem" }}>⏳ Menunggu Approval Pembayaran ({employers.filter(e => e.status === "pending").length})</div>
              {employers.filter(e => e.status === "pending").length === 0 ? (
                <p style={{ color: "#475569", fontSize: "0.85rem" }}>Tidak ada pembayaran yang menunggu approval.</p>
              ) : (
                employers.filter((e: any) => e.status === "pending").map((emp: any) => (
                  <div key={emp.bookingId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 10, marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "#f1f5f9" }}>{emp.companyName}</div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b", fontFamily: "monospace" }}>{emp.bookingId}</div>
                      <div style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                        {Array.isArray(emp.booths) ? emp.booths.map((b: any) => `${b.label} (${b.type})`).join(", ") : "—"} · {fmt(parseFloat(emp.totalAmount || 0))}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => handleApprove(emp.bookingId)}
                        style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)", border: "none", color: "#fff", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                        ✅ Approve
                      </button>
                      <button onClick={() => handleReject(emp.bookingId)}
                        style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
                        ❌ Tolak
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,300px),1fr))", gap: "1rem" }}>
              <div style={s.card}>
                <div style={{ fontWeight: 700, color: "#14b8a6", marginBottom: "1rem", fontSize: "0.9rem" }}>Status Employer</div>
                {[
                  { label: "Confirmed", count: employers.filter((e:any)=>e.status==="confirmed").length, color: "#14b8a6" },
                  { label: "Pending", count: employers.filter((e:any)=>e.status==="pending").length, color: "#f97316" },
                  { label: "Rejected", count: employers.filter((e:any)=>e.status==="rejected").length, color: "#ef4444" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.85rem" }}>
                    <span style={{ color: "#94a3b8" }}>{item.label}</span>
                    <span style={{ fontWeight: 700, color: item.color }}>{item.count}</span>
                  </div>
                ))}
              </div>
              <div style={s.card}>
                <div style={{ fontWeight: 700, color: "#D4A017", marginBottom: "1rem", fontSize: "0.9rem" }}>Status Dokumen Jobseeker</div>
                {[
                  { label: "Dokumen Lengkap", count: jobseekers.filter((j:any)=>j.cvUrl&&j.fotoUrl&&j.ktmUrl).length, color: "#14b8a6" },
                  { label: "Dokumen Kurang", count: jobseekers.filter((j:any)=>!(j.cvUrl&&j.fotoUrl&&j.ktmUrl)).length, color: "#f97316" },
                  { label: "Consent Layer 2", count: jobseekers.filter((j:any)=>j.consent2).length, color: "#818cf8" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.85rem" }}>
                    <span style={{ color: "#94a3b8" }}>{item.label}</span>
                    <span style={{ fontWeight: 700, color: item.color }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── EMPLOYER ── */}
        {activeTab === "employer" && (
          <div style={{ display: "grid", gridTemplateColumns: selEmp ? "1fr 380px" : "1fr", gap: "1.5rem" }}>
            <div style={s.card}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Perusahaan", "Booking ID", "Booth", "Total", "Status", "Aksi"].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {employers.map((emp: any) => (
                      <tr key={emp.bookingId} onClick={() => setSelectedEmployer(emp.bookingId === selectedEmployer ? null : emp.bookingId)}
                        style={{ cursor: "pointer", background: selectedEmployer === emp.id ? "rgba(212,160,23,0.05)" : "transparent", transition: "background 0.15s" }}>
                        <td style={s.td}>
                          <div style={{ fontWeight: 700 }}>{emp.companyName}</div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{emp.pic1Name} · {emp.pic1Whatsapp}</div>
                        </td>
                        <td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.78rem", color: "#14b8a6" }}>{emp.bookingId}</td>
                        <td style={s.td}>
                          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                            {Array.isArray(emp.booths) && emp.booths.map((b: any) => (
                              <span key={b.id} style={s.badge(b.type === "main" ? "#D4A017" : "#14b8a6")}>{b.label}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{ ...s.td, fontWeight: 700, color: "#D4A017" }}>{fmt(parseFloat(emp.totalAmount || 0))}</td>
                        <td style={s.td}>
                          <span style={s.badge(emp.status === "confirmed" ? "#14b8a6" : emp.status === "rejected" ? "#ef4444" : "#f97316")}>
                            {emp.status === "confirmed" ? "Confirmed" : emp.status === "rejected" ? "Rejected" : "Pending"}
                          </span>
                        </td>
                        <td style={s.td}>
                          {emp.status === "pending" && (
                            <div style={{ display: "flex", gap: "0.4rem" }}>
                              <button onClick={e => { e.stopPropagation(); handleApprove(emp.bookingId); }}
                                style={{ background: "#0d9488", border: "none", color: "#fff", borderRadius: 6, padding: "0.3rem 0.65rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>✅</button>
                              <button onClick={e => { e.stopPropagation(); handleReject(emp.bookingId); }}
                                style={{ background: "transparent", border: "1px solid #ef444460", color: "#f87171", borderRadius: 6, padding: "0.3rem 0.65rem", fontSize: "0.75rem", cursor: "pointer" }}>❌</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detail panel */}
            {selEmp && (
              <div style={{ ...s.card, position: "sticky" as const, top: 76, alignSelf: "start" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <div style={{ fontWeight: 700, color: "#D4A017" }}>Detail Employer</div>
                  <button onClick={() => setSelectedEmployer(null)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1.2rem" }}>×</button>
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.25rem" }}>{selEmp.companyName}</div>
                <div style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#14b8a6", marginBottom: "1rem" }}>{selEmp.bookingId}</div>

                {[
                  { label: "PIC", val: `${selEmp.pic1Name} · ${selEmp.pic1Whatsapp}` },
                  { label: "Email", val: selEmp.pic1Email },
                  { label: "Industri", val: selEmp.industry || "—" },
                  { label: "Kota", val: selEmp.city || "—" },
                  { label: "Status", val: selEmp.status },
                  { label: "Terdaftar", val: fmtDate(selEmp.createdAt) },
                ].map(item => (
                  <div key={item.label} style={{ marginBottom: "0.6rem" }}>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</div>
                    <div style={{ fontSize: "0.88rem", color: "#f1f5f9", fontWeight: 600 }}>{item.val}</div>
                  </div>
                ))}

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", marginTop: "0.5rem" }}>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Booth</div>
                  {Array.isArray(selEmp.booths) && selEmp.booths.map((b: any) => (
                    <div key={b.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                      <span style={{ color: "#94a3b8" }}>Booth {b.label} ({b.type === "main" ? "Main" : "Standard"})</span>
                      <span style={{ color: "#D4A017", fontWeight: 700 }}>{fmt(b.price || 0)}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.75rem", marginTop: "0.5rem", fontWeight: 800 }}>
                    <span>Total</span>
                    <span style={{ color: "#D4A017" }}>{fmt(parseFloat(selEmp.totalAmount || 0))}</span>
                  </div>
                </div>

                {selEmp.status === "pending" && (
                  <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => handleApprove(selEmp.bookingId)}
                      style={{ flex: 1, background: "linear-gradient(135deg,#0d9488,#14b8a6)", border: "none", color: "#fff", borderRadius: 10, padding: "0.75rem", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer" }}>
                      ✅ Approve
                    </button>
                    <button onClick={() => handleReject(selEmp.bookingId)}
                      style={{ flex: 1, background: "transparent", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", borderRadius: 10, padding: "0.75rem", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" }}>
                      ❌ Tolak
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── JOBSEEKER ── */}
        {activeTab === "jobseeker" && (
          <div style={{ display: "grid", gridTemplateColumns: selJS ? "1fr 360px" : "1fr", gap: "1.5rem" }}>
            <div style={s.card}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Nama", "ID", "Status", "Institusi", "Dokumen", "Consent"].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jobseekers.map((js: any) => {
                      const docsOk = js.fotoUrl && js.cvUrl && js.ktmUrl;
                      return (
                        <tr key={js.registrationId} onClick={() => setSelectedJobseeker(js.registrationId === selectedJobseeker ? null : js.registrationId)}
                          style={{ cursor: "pointer", background: selectedJobseeker === js.id ? "rgba(212,160,23,0.05)" : "transparent", transition: "background 0.15s" }}>
                          <td style={s.td}>
                            <div style={{ fontWeight: 700 }}>{js.namaLengkap}</div>
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{js.whatsapp}</div>
                          </td>
                          <td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.78rem", color: "#D4A017" }}>{js.registrationId}</td>
                          <td style={s.td}>
                            <span style={s.badge(js.status === "alumni_nhi" ? "#14b8a6" : js.status === "mahasiswa" ? "#818cf8" : js.status === "fresh_graduate" ? "#10b981" : "#94a3b8")}>
                              {js.status === "alumni_nhi" ? "Alumni NHI" : js.status === "mahasiswa" ? "Mahasiswa" : js.status === "fresh_graduate" ? "Fresh Grad" : "Umum"}
                            </span>
                          </td>
                          <td style={{ ...s.td, fontSize: "0.8rem", color: "#94a3b8", maxWidth: 160 }}>{js.institusi}</td>
                          <td style={s.td}>
                            <span style={s.badge(docsOk ? "#14b8a6" : "#f97316")}>
                              {docsOk ? "✓ Lengkap" : "⚠ Kurang"}
                            </span>
                          </td>
                          <td style={s.td}>
                            <div style={{ fontSize: "0.78rem" }}>
                              <span style={{ color: js.consent1 ? "#14b8a6" : "#ef4444" }}>{js.consent1 ? "✓" : "✗"} L1 </span>
                              <span style={{ color: js.consent2 ? "#818cf8" : "#64748b" }}>{js.consent2 ? "✓" : "—"} L2</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Jobseeker detail */}
            {selJS && (
              <div style={{ ...s.card, position: "sticky" as const, top: 76, alignSelf: "start" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <div style={{ fontWeight: 700, color: "#D4A017" }}>Detail Jobseeker</div>
                  <button onClick={() => setSelectedJobseeker(null)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1.2rem" }}>×</button>
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.25rem" }}>{selJS.namaLengkap}</div>
                <div style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#D4A017", marginBottom: "1rem" }}>{selJS.registrationId}</div>

                {[
                  { label: "Email", val: selJS.email },
                  { label: "WhatsApp", val: selJS.whatsapp },
                  { label: "Status", val: selJS.status },
                  { label: "Institusi", val: selJS.institusi },
                  { label: "Jurusan", val: selJS.jurusan },
                  { label: "Bidang Minat", val: selJS.bidangMinat },
                  { label: "Terdaftar", val: fmtDate(selJS.createdAt) },
                ].map(item => (
                  <div key={item.label} style={{ marginBottom: "0.6rem" }}>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</div>
                    <div style={{ fontSize: "0.88rem", color: "#f1f5f9", fontWeight: 600 }}>{item.val}</div>
                  </div>
                ))}

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", marginTop: "0.5rem" }}>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Dokumen</div>
                  {[
                    { label: "Pas Foto",   url: selJS.fotoUrl },
                    { label: "CV",         url: selJS.cvUrl },
                    { label: "KTP/KTM",   url: selJS.ktmUrl },
                    { label: "Sertifikat", url: selJS.sertifikatUrl },
                  ].map(doc => (
                    <div key={doc.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem", marginBottom: "0.5rem" }}>
                      <span style={{ color: "#94a3b8" }}>{doc.label}</span>
                      {doc.url ? (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer"
                          style={{ color: "#14b8a6", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          👁️ Lihat →
                        </a>
                      ) : (
                        <span style={{ color: "#334155" }}>— Belum</span>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", marginTop: "0.5rem" }}>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Consent (UU PDP)</div>
                  <div style={{ fontSize: "0.85rem", marginBottom: "0.35rem", color: selJS.consent1 ? "#14b8a6" : "#ef4444" }}>
                    {selJS.consent1 ? "✅" : "❌"} Layer 1 — Employer offline
                  </div>
                  <div style={{ fontSize: "0.85rem", color: selJS.consent2 ? "#818cf8" : "#475569" }}>
                    {selJS.consent2 ? "✅" : "⬜"} Layer 2 — Employer online
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── INTERVIEW SLOTS ── */}
        {activeTab === "interview" && (
          <div style={s.card}>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#60a5fa", marginBottom: "1rem" }}>📅 Rekapitulasi Slot Interview</div>

            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
              {DAYS.map((day, i) => (
                <button key={i} onClick={() => setSelectedDay(i)}
                  style={{ padding: "0.6rem 1.25rem", borderRadius: 10, border: `2px solid ${selectedDay === i ? "#60a5fa" : "rgba(255,255,255,0.08)"}`, background: selectedDay === i ? "rgba(96,165,250,0.1)" : "transparent", color: selectedDay === i ? "#60a5fa" : "#64748b", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
                  {day}
                </button>
              ))}
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={s.th}>Booth</th>
                    {SLOTS.map(slot => <th key={slot} style={{ ...s.th, textAlign: "center" }}>{slot}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {INTERVIEW_BOOTHS.map(booth => (
                    <tr key={booth}>
                      <td style={{ ...s.td, fontWeight: 700, color: "#60a5fa" }}>{booth}</td>
                      {SLOTS.map((_, slotIdx) => {
                        const key = `${booth}-${selectedDay}-${slotIdx}`;
                        const company = realTakenSlots[key];
                        return (
                          <td key={slotIdx} style={{ ...s.td, textAlign: "center" }}>
                            {company ? (
                              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "0.3rem 0.4rem", fontSize: "0.68rem", color: "#fca5a5", lineHeight: 1.3 }}>
                                {company.replace("PT ", "").substring(0, 12)}
                              </div>
                            ) : (
                              <div style={{ color: "#1e3a5f", fontSize: "1rem" }}>·</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "#64748b" }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }} />
                Terisi ({Object.keys(realTakenSlots).filter(k => k.includes(`-${selectedDay}-`)).length} slot)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "#64748b" }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: "#1e3a5f" }} />
                Kosong ({INTERVIEW_BOOTHS.length * SLOTS.length - Object.keys(realTakenSlots).filter(k => k.includes(`-${selectedDay}-`)).length} slot)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
