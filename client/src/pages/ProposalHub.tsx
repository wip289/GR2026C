import { useLocation } from "wouter";

const s = {
  page: { minHeight: "100vh", background: "#0a1628", fontFamily: "system-ui, sans-serif", color: "#f1f5f9" } as React.CSSProperties,
  nav:  { background: "rgba(10,22,40,0.98)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(249,115,22,0.3)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky" as const, top: 0, zIndex: 50 },
  wrap: { maxWidth: 900, margin: "0 auto", padding: "3rem 1.25rem" },
};

const PROPOSALS = [
  {
    icon: "🏢",
    title: "Proposal Employer",
    desc: "Proposal penawaran booth untuk perusahaan. Berisi info event, tipe booth, harga, dan fasilitas. Print-to-PDF langsung.",
    color: "#0a1628",
    accent: "#14b8a6",
    link: "/phase1/proposal-customize",
    status: "Tersedia",
  },
  {
    icon: "🤝",
    title: "Proposal Sponsor",
    desc: "Proposal penawaran paket sponsorship (Platinum, Gold, Silver). Berisi benefit, branding, dan harga paket.",
    color: "#0a1628",
    accent: "#818cf8",
    link: "/phase1/proposal-customize",
    status: "Tersedia",
  },
  {
    icon: "📜",
    title: "Surat Undangan VIP",
    desc: "Surat undangan formal untuk pejabat dan tamu VIP. Import daftar tamu dari Excel, generate per tamu.",
    color: "#0a1628",
    accent: "#D4A017",
    link: "/boss",
    status: "Coming Soon",
  },
];

export default function ProposalHub() {
  const [, navigate] = useLocation();

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 32 }}/>
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: "1rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f97316" }}>Generate Proposal</div>
            <div style={{ fontSize: "0.7rem", color: "#475569" }}>Grand Recruitment 2026</div>
          </div>
        </div>
        <button onClick={() => navigate("/boss")}
          style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", color: "#D4A017", borderRadius: 8, padding: "0.4rem 0.9rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
          ← Panel Panitia
        </button>
      </nav>

      <div style={s.wrap}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.5rem)", fontWeight: 800, marginBottom: "0.75rem" }}>
            Generate Proposal & Undangan
          </h1>
          <p style={{ color: "#64748b", fontSize: "1rem", maxWidth: 520, margin: "0 auto" }}>
            Buat proposal employer, proposal sponsor, atau surat undangan VIP langsung dari sini. Siap cetak dan kirim.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,260px),1fr))", gap: "1.5rem" }}>
          {PROPOSALS.map(p => (
            <div key={p.title}
              onClick={() => p.status !== "Coming Soon" && navigate(p.link)}
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${p.accent}30`, borderRadius: 16, padding: "2rem", cursor: p.status === "Coming Soon" ? "default" : "pointer", transition: "all 0.2s", opacity: p.status === "Coming Soon" ? 0.6 : 1, position: "relative" as const }}
              onMouseEnter={e => { if (p.status !== "Coming Soon") (e.currentTarget as HTMLElement).style.background = `${p.accent}08`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}>

              {p.status === "Coming Soon" && (
                <div style={{ position: "absolute" as const, top: 12, right: 12, background: "rgba(100,116,139,0.2)", border: "1px solid rgba(100,116,139,0.3)", color: "#64748b", borderRadius: 20, padding: "0.2rem 0.65rem", fontSize: "0.7rem", fontWeight: 700 }}>
                  Coming Soon
                </div>
              )}

              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>{p.icon}</div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: p.accent, marginBottom: "0.75rem" }}>{p.title}</h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.7, marginBottom: "1.5rem" }}>{p.desc}</p>

              {p.status !== "Coming Soon" && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: p.accent, fontSize: "0.85rem", fontWeight: 700 }}>
                  Buat Sekarang →
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick access */}
        <div style={{ marginTop: "3rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "1.5rem" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#94a3b8", marginBottom: "1rem" }}>🔗 Akses Cepat</div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {[
              { label: "Financial Planner", link: "/planner", color: "#14b8a6" },
              { label: "Booth Management", link: "/booth-management", color: "#D4A017" },
              { label: "Manajemen Panitia", link: "/panitia", color: "#818cf8" },
              { label: "Boss Panel", link: "/boss", color: "#f97316" },
            ].map(a => (
              <button key={a.label} onClick={() => navigate(a.link)}
                style={{ background: `${a.color}10`, border: `1px solid ${a.color}30`, color: a.color, borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
