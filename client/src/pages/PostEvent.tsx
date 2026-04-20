import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

const s = {
  page:  { minHeight: "100vh", background: "#0a1628", fontFamily: "system-ui, sans-serif", color: "#f1f5f9" } as React.CSSProperties,
  nav:   { background: "rgba(10,22,40,0.98)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(16,185,129,0.3)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky" as const, top: 0, zIndex: 50 },
  wrap:  { maxWidth: 1100, margin: "0 auto", padding: "2rem 1.25rem" },
  card:  { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" },
  secHd: (color: string) => ({ fontSize: "0.9rem", fontWeight: 700, color, marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: `1px solid ${color}25` }),
  row:   { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.85rem" } as React.CSSProperties,
};

export default function PostEvent() {
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState("overview");

  // Real data from DB
  const { data: jobseekersRaw } = trpc.event.getAllJobseekers.useQuery();
  const { data: employersRaw }  = trpc.event.getAllEmployerBookings.useQuery();
  const { data: interviewRaw }  = trpc.event.getAllInterviewBookings.useQuery();

  const jobseekers = (jobseekersRaw || []) as any[];
  const employers  = (employersRaw  || []) as any[];
  const interviews = (interviewRaw  || []) as any[];

  // Check-in data from localStorage
  const getCheckin = (type: "jobseeker" | "employer") => {
    try { return JSON.parse(localStorage.getItem(`gr2026_checkin_${type}`) || "{}"); } catch { return {}; }
  };
  const jsCheckin = getCheckin("jobseeker");
  const ebCheckin = getCheckin("employer");

  const jsDay1 = Object.values(jsCheckin).filter((v: any) => v.day1).length;
  const jsDay2 = Object.values(jsCheckin).filter((v: any) => v.day2).length;
  const ebDay1 = Object.values(ebCheckin).filter((v: any) => v.day1).length;
  const ebDay2 = Object.values(ebCheckin).filter((v: any) => v.day2).length;

  // Jobseeker breakdown
  const byStatus: Record<string, number> = {};
  const byInstitusi: Record<string, number> = {};
  const byMinat: Record<string, number> = {};
  jobseekers.forEach((j: any) => {
    byStatus[j.status || "unknown"] = (byStatus[j.status || "unknown"] || 0) + 1;
    const inst = j.institusi || "Tidak diisi";
    byInstitusi[inst] = (byInstitusi[inst] || 0) + 1;
    const minat = j.bidangMinat || "Tidak diisi";
    byMinat[minat] = (byMinat[minat] || 0) + 1;
  });

  // Employer breakdown
  const confirmedEb = employers.filter((e: any) => e.status === "confirmed");
  const totalRevenue = confirmedEb.reduce((sum: number, e: any) => {
    const booths = typeof e.booths === "string" ? JSON.parse(e.booths || "[]") : (e.booths || []);
    return sum + booths.reduce((bs: number, b: any) => bs + (b.price || 0), 0);
  }, 0);

  // By industry
  const byIndustry: Record<string, number> = {};
  employers.forEach((e: any) => {
    byIndustry[e.industry || "Others"] = (byIndustry[e.industry || "Others"] || 0) + 1;
  });

  // Interview stats
  const activeInterviews = interviews.filter((i: any) => i.status === "active");
  const byBooth: Record<string, number> = {};
  activeInterviews.forEach((i: any) => {
    byBooth[i.boothId] = (byBooth[i.boothId] || 0) + 1;
  });

  const statusLabel: Record<string, string> = {
    mahasiswa: "Mahasiswa Aktif", fresh_graduate: "Fresh Graduate",
    alumni_nhi: "Alumni NHI Bandung", umum: "Umum",
  };

  const sections = [
    { id: "overview",    label: "📊 Overview",        color: "#10b981" },
    { id: "jobseeker",   label: "🎓 Jobseeker",        color: "#60a5fa" },
    { id: "employer",    label: "🏢 Employer",          color: "#14b8a6" },
    { id: "interview",   label: "🎤 Interview",         color: "#818cf8" },
    { id: "keuangan",    label: "💰 Keuangan",          color: "#D4A017" },
  ];

  const handlePrint = () => window.print();

  return (
    <div style={s.page}>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <nav style={{ ...s.nav }} className="no-print">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 32 }}/>
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: "1rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#10b981" }}>📊 Post Event Report</div>
            <div style={{ fontSize: "0.7rem", color: "#475569" }}>Grand Recruitment 2026</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={handlePrint}
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", borderRadius: 8, padding: "0.4rem 0.9rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
            🖨️ Export PDF
          </button>
          <button onClick={() => navigate("/boss")}
            style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", color: "#D4A017", borderRadius: 8, padding: "0.4rem 0.9rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
            ← Panel Panitia
          </button>
        </div>
      </nav>

      <div style={s.wrap}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800 }}>Laporan Post Event</h1>
          <p style={{ color: "#64748b" }}>Grand Recruitment 2026 · 8–9 Juni 2026 · Dome NHI Bandung</p>
        </div>

        {/* Section nav */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }} className="no-print">
          {sections.map(sec => (
            <button key={sec.id} onClick={() => setActiveSection(sec.id)}
              style={{ padding: "0.5rem 1rem", borderRadius: 8, border: `1px solid ${activeSection === sec.id ? sec.color : "rgba(255,255,255,0.1)"}`, background: activeSection === sec.id ? `${sec.color}15` : "transparent", color: activeSection === sec.id ? sec.color : "#64748b", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
              {sec.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeSection === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              {[
                { label: "Total Jobseeker", val: jobseekers.length, color: "#60a5fa", icon: "🎓" },
                { label: "Hadir Hari 1", val: jsDay1, color: "#10b981", icon: "✅" },
                { label: "Hadir Hari 2", val: jsDay2, color: "#10b981", icon: "✅" },
                { label: "Total Employer", val: employers.length, color: "#14b8a6", icon: "🏢" },
                { label: "Employer Hadir H1", val: ebDay1, color: "#D4A017", icon: "✅" },
                { label: "Total Interview", val: activeInterviews.length, color: "#818cf8", icon: "🎤" },
                { label: "Total Revenue", val: fmt(totalRevenue), color: "#D4A017", icon: "💰" },
              ].map(k => (
                <div key={k.label} style={{ background: `${k.color}08`, border: `1px solid ${k.color}25`, borderRadius: 12, padding: "1rem", textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{k.icon}</div>
                  <div style={{ fontSize: typeof k.val === "number" && k.val > 999 ? "1rem" : "1.6rem", fontWeight: 800, color: k.color, lineHeight: 1.2 }}>{k.val}</div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.2rem" }}>{k.label}</div>
                </div>
              ))}
            </div>

            {/* Highlight box */}
            <div style={{ ...s.card, background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <div style={s.secHd("#10b981")}>🏆 Highlights GR2026</div>
              {[
                { label: "Total Jobseeker Terdaftar", val: `${jobseekers.length} orang` },
                { label: "Total Kehadiran 2 Hari", val: `${jsDay1 + jsDay2} kunjungan` },
                { label: "Employer Konfirmasi", val: `${confirmedEb.length} perusahaan` },
                { label: "Total Interview Slot Terisi", val: `${activeInterviews.length} slot` },
                { label: "Total Pendapatan Booth", val: fmt(totalRevenue) },
              ].map(item => (
                <div key={item.label} style={s.row}>
                  <span style={{ color: "#94a3b8" }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: "#f1f5f9" }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── JOBSEEKER ── */}
        {activeSection === "jobseeker" && (
          <div>
            <div style={s.card}>
              <div style={s.secHd("#60a5fa")}>🎓 Statistik Jobseeker</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Check-in per Hari</div>
                  {[
                    { label: "Hari 1 (8 Juni)", val: jsDay1, pct: jobseekers.length ? Math.round((jsDay1/jobseekers.length)*100) : 0 },
                    { label: "Hari 2 (9 Juni)", val: jsDay2, pct: jobseekers.length ? Math.round((jsDay2/jobseekers.length)*100) : 0 },
                  ].map(item => (
                    <div key={item.label} style={{ marginBottom: "0.75rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                        <span style={{ color: "#94a3b8" }}>{item.label}</span>
                        <span style={{ fontWeight: 700, color: "#60a5fa" }}>{item.val} ({item.pct}%)</span>
                      </div>
                      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
                        <div style={{ height: "100%", width: `${item.pct}%`, background: "#60a5fa", borderRadius: 99 }}/>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Breakdown per Status</div>
                  {Object.entries(byStatus).map(([k, v]) => (
                    <div key={k} style={s.row}>
                      <span style={{ color: "#94a3b8" }}>{statusLabel[k] || k}</span>
                      <span style={{ fontWeight: 700, color: "#f1f5f9" }}>{v} orang</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={s.card}>
              <div style={s.secHd("#60a5fa")}>🏫 Top Institusi</div>
              {Object.entries(byInstitusi).sort(([,a],[,b]) => b-a).slice(0,10).map(([k,v]) => (
                <div key={k} style={s.row}>
                  <span style={{ color: "#94a3b8" }}>{k}</span>
                  <span style={{ fontWeight: 700, color: "#f1f5f9" }}>{v} orang</span>
                </div>
              ))}
            </div>

            <div style={s.card}>
              <div style={s.secHd("#60a5fa")}>💼 Bidang Minat Terpopuler</div>
              {Object.entries(byMinat).sort(([,a],[,b]) => b-a).map(([k,v]) => (
                <div key={k} style={s.row}>
                  <span style={{ color: "#94a3b8" }}>{k}</span>
                  <span style={{ fontWeight: 700, color: "#f1f5f9" }}>{v} orang</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EMPLOYER ── */}
        {activeSection === "employer" && (
          <div>
            <div style={s.card}>
              <div style={s.secHd("#14b8a6")}>🏢 Realisasi Employer</div>
              {[
                { label: "Total Booking (Potensial + Tertarik + Hadir)", val: `${employers.length} perusahaan` },
                { label: "Confirmed & Lunas", val: `${confirmedEb.length} perusahaan` },
                { label: "Hadir Hari 1", val: `${ebDay1} perusahaan` },
                { label: "Hadir Hari 2", val: `${ebDay2} perusahaan` },
              ].map(item => (
                <div key={item.label} style={s.row}>
                  <span style={{ color: "#94a3b8" }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: "#14b8a6" }}>{item.val}</span>
                </div>
              ))}
            </div>

            <div style={s.card}>
              <div style={s.secHd("#14b8a6")}>🏭 Breakdown per Industri</div>
              {Object.entries(byIndustry).sort(([,a],[,b]) => b-a).map(([k,v]) => (
                <div key={k} style={s.row}>
                  <span style={{ color: "#94a3b8" }}>{k}</span>
                  <span style={{ fontWeight: 700, color: "#f1f5f9" }}>{v} perusahaan</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── INTERVIEW ── */}
        {activeSection === "interview" && (
          <div style={s.card}>
            <div style={s.secHd("#818cf8")}>🎤 Statistik Interview</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div>
                {[
                  { label: "Total Slot Tersedia (2 hari)", val: `${10 * 6 * 2} slot` },
                  { label: "Slot Terisi", val: `${activeInterviews.length} slot` },
                  { label: "Tingkat Penggunaan", val: `${Math.round((activeInterviews.length / (10*6*2))*100)}%` },
                ].map(item => (
                  <div key={item.label} style={s.row}>
                    <span style={{ color: "#94a3b8" }}>{item.label}</span>
                    <span style={{ fontWeight: 700, color: "#818cf8" }}>{item.val}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Slot per Booth</div>
                {Object.entries(byBooth).sort(([,a],[,b]) => b-a).map(([k,v]) => (
                  <div key={k} style={s.row}>
                    <span style={{ color: "#94a3b8" }}>Booth {k}</span>
                    <span style={{ fontWeight: 700, color: "#818cf8" }}>{v} slot</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── KEUANGAN ── */}
        {activeSection === "keuangan" && (
          <div>
            <div style={s.card}>
              <div style={s.secHd("#D4A017")}>💰 Laporan Keuangan Final</div>
              {[
                { label: "Pendapatan Booth (Confirmed)", val: fmt(totalRevenue), color: "#14b8a6" },
                { label: "Pendapatan Sponsor (input di Sponsorship)", val: "— Lihat halaman Sponsorship", color: "#818cf8" },
                { label: "Total Employer Pending (belum bayar)", val: `${employers.filter((e:any) => e.status === "pending").length} perusahaan`, color: "#f97316" },
              ].map(item => (
                <div key={item.label} style={s.row}>
                  <span style={{ color: "#94a3b8" }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: item.color }}>{item.val}</span>
                </div>
              ))}
              <div style={{ marginTop: "1rem", padding: "0.85rem 1rem", background: "rgba(212,160,23,0.06)", borderRadius: 8, fontSize: "0.82rem", color: "#D4A017" }}>
                💡 Untuk laporan keuangan lengkap termasuk pengeluaran dan P&L, buka <button onClick={() => navigate("/planner")} style={{ background: "none", border: "none", color: "#D4A017", cursor: "pointer", fontWeight: 700, textDecoration: "underline" }}>Financial Planner →</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
