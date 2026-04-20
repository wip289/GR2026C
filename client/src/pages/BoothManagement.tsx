import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

// ── Booth definitions (same as BoothMap) ─────────────────────
const MAIN_BOOTHS = [
  "M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12"
];
const STD_BOOTHS = Array.from({ length: 38 }, (_, i) => `S${i + 1}`);
const INTERVIEW_BOOTHS = Array.from({ length: 10 }, (_, i) => `E${i + 1}`);

const s = {
  page:  { minHeight: "100vh", background: "#0a1628", fontFamily: "system-ui, sans-serif", color: "#f1f5f9" } as React.CSSProperties,
  nav:   { background: "rgba(10,22,40,0.98)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(212,160,23,0.3)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky" as const, top: 0, zIndex: 50 },
  wrap:  { maxWidth: 1200, margin: "0 auto", padding: "2rem 1.25rem" },
  card:  { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" },
  badge: (color: string) => ({ display: "inline-block", padding: "0.2rem 0.65rem", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, background: `${color}20`, color, border: `1px solid ${color}40` }),
  tab:   (active: boolean) => ({ padding: "0.6rem 1.25rem", borderRadius: 8, border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, background: active ? "#D4A017" : "transparent", color: active ? "#fff" : "#64748b", transition: "all 0.2s", whiteSpace: "nowrap" as const }),
};

type TabId = "denah" | "rekap" | "special" | "interview";

// Helper to get booth label from various possible field names
function getBoothLabel(bt: any): string {
  return bt.label || bt.boothLabel || bt.id || bt.boothId || bt.name || "?";
}
function getBoothType(bt: any): string {
  return bt.type || bt.boothType || "standard";
}

export default function BoothManagement() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>("denah");
  const [selectedBooth, setSelectedBooth] = useState<string | null>(null);

  // Get real booking data from DB
  const { data: bookingsRaw } = trpc.event.getAllEmployerBookings.useQuery();
  const { data: interviewRaw } = trpc.event.getAllInterviewBookings.useQuery();
  const bookings = (bookingsRaw || []) as any[];



  // Helper: parse booths (can be string or array)
  const parseBooths = (raw: any): any[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch { return []; }
    }
    return [];
  };

  // Build booth map
  const boothMap: Record<string, any> = {};
  bookings.forEach(b => {
    const booths = parseBooths(b.booths);
    booths.forEach((booth: any) => {
      boothMap[booth.id || booth.label] = {
        company: b.companyName,
        status: b.status,
        bookingId: b.bookingId,
        pic: b.pic1Name,
        whatsapp: b.pic1Whatsapp,
        specialRequest: b.specialRequest,
        needsBoothDesign: b.needsBoothDesign,
        totalAmount: b.totalAmount,
        boothType: booth.type,
        boothLabel: booth.label,
      };
    });
  });

  // Interview constants
  const SLOTS = ["08.00–09.00","09.00–10.00","10.00–11.00","11.00–12.00","13.00–14.00","14.00–15.00"];
  const DAYS  = ["Senin, 8 Jun 2026","Selasa, 9 Jun 2026"];
  const INT_BOOTHS = ["E1","E2","E3","E4","E5","E6","E7","E8","E9","E10"];

  // Build taken slots from DB
  const takenSlots: Record<string, string> = {};
  ((interviewRaw || []) as any[]).forEach((b: any) => {
    if (b.status === "active") {
      const key = `${b.boothId}-${b.day}-${b.slotIndex}`;
      takenSlots[key] = b.companyName || b.employerBookingId;
    }
  });

  const [selectedDay, setSelectedDay] = useState(0);
  const totalSlots = INT_BOOTHS.length * SLOTS.length;
  const takenToday = Object.keys(takenSlots).filter(k => k.includes(`-${selectedDay}-`)).length;

  // Stats
  const totalMain = MAIN_BOOTHS.length;
  const totalStd  = STD_BOOTHS.length;
  const bookedMain = MAIN_BOOTHS.filter(b => boothMap[b]).length;
  const bookedStd  = STD_BOOTHS.filter(b => boothMap[b]).length;
  const specialRequests = bookings.filter(b => b.specialRequest || b.needsBoothDesign);

  // Booth color
  const boothColor = (id: string) => {
    const b = boothMap[id];
    if (!b) return { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)", text: "#334155" };
    if (b.status === "confirmed") return { bg: "rgba(20,184,166,0.15)", border: "#14b8a6", text: "#14b8a6" };
    if (b.status === "pending")   return { bg: "rgba(249,115,22,0.15)", border: "#f97316", text: "#f97316" };
    if (b.status === "rejected")  return { bg: "rgba(239,68,68,0.1)",   border: "#ef4444", text: "#ef4444" };
    return { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)", text: "#334155" };
  };

  const selectedData = selectedBooth ? boothMap[selectedBooth] : null;

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 32 }} />
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: "1rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#D4A017" }}>Manajemen Booth</div>
            <div style={{ fontSize: "0.7rem", color: "#475569" }}>Grand Recruitment 2026</div>
          </div>
        </div>
        <button onClick={() => navigate("/boss")}
          style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", color: "#D4A017", borderRadius: 8, padding: "0.4rem 0.9rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
          ← Panel Panitia
        </button>
      </nav>

      <div style={s.wrap}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, marginBottom: "0.25rem" }}>Manajemen Booth</h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Status terkini booth · Rekap booking · Special request employer</p>
        </div>

        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Main Booth", val: `${bookedMain}/${totalMain}`, color: "#D4A017", sub: "terjual" },
            { label: "Standard Booth", val: `${bookedStd}/${totalStd}`, color: "#14b8a6", sub: "terjual" },
            { label: "Confirmed", val: bookings.filter(b=>b.status==="confirmed").length, color: "#10b981", sub: "employer" },
            { label: "Pending", val: bookings.filter(b=>b.status==="pending").length, color: "#f97316", sub: "menunggu" },
            { label: "Special Request", val: specialRequests.length, color: "#818cf8", sub: "employer" },
            { label: "Slot Interview", val: `${Object.keys(takenSlots).length}/${INT_BOOTHS.length * SLOTS.length * 2}`, color: "#60a5fa", sub: "terisi" },
          ].map(k => (
            <div key={k.label} style={{ background: `${k.color}08`, border: `1px solid ${k.color}25`, borderRadius: 12, padding: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: k.color }}>{k.val}</div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{k.label}</div>
              <div style={{ fontSize: "0.68rem", color: "#475569" }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "0.5rem", marginBottom: "1.5rem" }}>
          {([
            { id: "denah" as TabId, label: "🗺️ Denah Booth" },
            { id: "rekap" as TabId, label: "📋 Rekap Booking" },
            { id: "special" as TabId, label: `⚡ Special Request (${specialRequests.length})` },
          { id: "interview" as TabId, label: "🎤 Interview Slots" },
          ]).map(tab => (
            <button key={tab.id} style={s.tab(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: DENAH ── */}
        {activeTab === "denah" && (
          <div style={{ display: "grid", gridTemplateColumns: selectedBooth ? "1fr 320px" : "1fr", gap: "1.5rem" }}>
            <div style={s.card}>
              {/* Legend */}
              <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                {[
                  { color: "#14b8a6", label: "Confirmed" },
                  { color: "#f97316", label: "Pending" },
                  { color: "#ef4444", label: "Rejected" },
                  { color: "#334155", label: "Tersedia" },
                ].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: "#64748b" }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, background: `${l.color}25`, border: `1px solid ${l.color}` }}/>
                    {l.label}
                  </div>
                ))}
              </div>

              {/* Main Booths */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#D4A017", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
                  Main Booth (5×5m) — {bookedMain}/{totalMain} terjual
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {MAIN_BOOTHS.map(id => {
                    const c = boothColor(id);
                    const isSelected = selectedBooth === id;
                    return (
                      <div key={id} onClick={() => setSelectedBooth(isSelected ? null : id)}
                        style={{ width: 64, height: 54, borderRadius: 8, border: `2px solid ${isSelected ? "#fff" : c.border}`, background: c.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s", transform: isSelected ? "scale(1.05)" : "scale(1)", position: "relative" as const }}>
                        <div style={{ fontSize: "0.72rem", fontWeight: 800, color: c.text }}>{id}</div>
                        {boothMap[id] ? (
                          <>
                            <div style={{ fontSize: "0.52rem", color: c.text, opacity: 0.85, textAlign: "center", padding: "0 3px", lineHeight: 1.2, maxWidth: 58, overflow: "hidden" }}>
                              {boothMap[id].company.replace(/^(PT|CV|UD|PD)\s*/i, "").split(" ").slice(0,2).join(" ")}
                            </div>
                            <div style={{ position: "absolute" as const, top: 2, right: 3, width: 6, height: 6, borderRadius: "50%", background: c.border }}/>
                          </>
                        ) : (
                          <div style={{ fontSize: "0.5rem", color: "#1e3a5f" }}>kosong</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Standard Booths */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#14b8a6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
                  Standard Booth (3×3m) — {bookedStd}/{totalStd} terjual
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {STD_BOOTHS.map(id => {
                    const c = boothColor(id);
                    const isSelected = selectedBooth === id;
                    return (
                      <div key={id} onClick={() => setSelectedBooth(isSelected ? null : id)}
                        style={{ width: 48, height: 40, borderRadius: 6, border: `1.5px solid ${isSelected ? "#fff" : c.border}`, background: c.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s", transform: isSelected ? "scale(1.05)" : "scale(1)" }}>
                        <div style={{ fontSize: "0.65rem", fontWeight: 700, color: c.text }}>{id}</div>
                        {boothMap[id] && <div style={{ fontSize: "0.5rem", color: c.text, opacity: 0.8 }}>•</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interview Booths */}
              <div>
                <div style={{ fontSize: "0.75rem", color: "#60a5fa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
                  Interview Booth — {INTERVIEW_BOOTHS.length} unit
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {INTERVIEW_BOOTHS.map(id => (
                    <div key={id} style={{ width: 44, height: 36, borderRadius: 6, border: "1px solid rgba(96,165,250,0.3)", background: "rgba(96,165,250,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#60a5fa" }}>{id}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Detail panel */}
            {selectedBooth && (
              <div style={{ ...s.card, position: "sticky" as const, top: 76, alignSelf: "start" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <div style={{ fontWeight: 800, fontSize: "1.5rem", color: selectedData ? boothColor(selectedBooth).text : "#475569" }}>
                    Booth {selectedBooth}
                  </div>
                  <button onClick={() => setSelectedBooth(null)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1.2rem" }}>×</button>
                </div>

                {selectedData ? (
                  <>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <span style={s.badge(boothColor(selectedBooth).text)}>
                        {selectedData.status === "confirmed" ? "✅ Confirmed" : selectedData.status === "pending" ? "⏳ Pending" : "❌ Rejected"}
                      </span>
                      <span style={{ ...s.badge("#94a3b8"), marginLeft: "0.4rem" }}>
                        {selectedData.boothType === "main" ? "Main 5×5m" : "Standard 3×3m"}
                      </span>
                    </div>

                    {[
                      { label: "Perusahaan", val: selectedData.company },
                      { label: "Booking ID", val: selectedData.bookingId },
                      { label: "PIC", val: selectedData.pic },
                      { label: "WhatsApp", val: selectedData.whatsapp },
                      { label: "Total", val: fmt(parseFloat(selectedData.totalAmount || "0")) },
                    ].map(item => (
                      <div key={item.label} style={{ marginBottom: "0.75rem" }}>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</div>
                        <div style={{ fontSize: "0.88rem", color: "#f1f5f9", fontWeight: 600 }}>{item.val}</div>
                      </div>
                    ))}

                    {selectedData.needsBoothDesign && (
                      <div style={{ padding: "0.75rem", background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.3)", borderRadius: 8, marginBottom: "0.75rem", fontSize: "0.82rem", color: "#818cf8" }}>
                        📐 Meminta layanan desain booth interior
                      </div>
                    )}

                    {selectedData.specialRequest && (
                      <div style={{ padding: "0.75rem", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 8, fontSize: "0.82rem", color: "#fed7aa" }}>
                        <div style={{ fontWeight: 700, color: "#f97316", marginBottom: "0.35rem" }}>⚡ Special Request:</div>
                        {selectedData.specialRequest}
                      </div>
                    )}

                    {!selectedData.specialRequest && !selectedData.needsBoothDesign && (
                      <div style={{ fontSize: "0.82rem", color: "#334155", fontStyle: "italic" }}>Tidak ada special request</div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "1.5rem", color: "#334155" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✅</div>
                    <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Booth Tersedia</div>
                    <div style={{ fontSize: "0.82rem" }}>Belum ada booking untuk booth ini</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: REKAP ── */}
        {activeTab === "rekap" && (
          <div style={s.card}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Perusahaan","Booking ID","Booth","Total","Status","Special Request"].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#334155" }}>Belum ada booking</td></tr>
                  ) : bookings.map((b: any) => {
                    const booths = parseBooths(b.booths);
                    const hasSpecial = !!(b.specialRequest || b.needsBoothDesign);
                    const statusColor = b.status === "confirmed" ? "#14b8a6" : b.status === "pending" ? "#f97316" : "#ef4444";
                    return (
                      <tr key={b.bookingId} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>{b.companyName}</div>
                          <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{b.pic1Name}</div>
                        </td>
                        <td style={{ padding: "0.85rem 1rem", fontFamily: "monospace", fontSize: "0.78rem", color: "#14b8a6" }}>{b.bookingId}</td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                            {booths.length === 0 ? (
                              <span style={{ fontSize: "0.75rem", color: "#334155" }}>—</span>
                            ) : booths.map((bt: any) => (
                              <div key={bt.id || bt.label} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <span style={{ display: "inline-block", padding: "0.2rem 0.65rem", borderRadius: 6, fontSize: "0.75rem", fontWeight: 800, background: getBoothType(bt) === "main" ? "rgba(212,160,23,0.2)" : "rgba(20,184,166,0.2)", color: getBoothType(bt) === "main" ? "#D4A017" : "#14b8a6", border: `1px solid ${getBoothType(bt) === "main" ? "rgba(212,160,23,0.4)" : "rgba(20,184,166,0.4)"}` }}>
                                  {getBoothLabel(bt)}
                                </span>
                                <span style={{ fontSize: "0.65rem", color: "#475569", marginTop: "0.2rem" }}>
                                  {getBoothType(bt) === "main" ? "Main" : "Std"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#D4A017", fontSize: "0.85rem" }}>
                          {fmt(parseFloat(b.totalAmount || "0"))}
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <span style={{ display: "inline-block", padding: "0.2rem 0.65rem", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}>
                            {b.status === "confirmed" ? "Confirmed" : b.status === "pending" ? "Pending" : "Rejected"}
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          {hasSpecial ? (
                            <span style={{ display: "inline-block", padding: "0.2rem 0.65rem", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, background: "rgba(129,140,248,0.15)", color: "#818cf8", border: "1px solid rgba(129,140,248,0.3)" }}>
                              ⚡ Ada request
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "#334155" }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB: SPECIAL REQUEST ── */}
        {activeTab === "special" && (
          <div>
            {specialRequests.length === 0 ? (
              <div style={{ ...s.card, textAlign: "center", padding: "3rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
                <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Tidak ada special request</div>
                <div style={{ color: "#64748b", fontSize: "0.85rem" }}>Semua employer tidak memiliki permintaan khusus</div>
              </div>
            ) : specialRequests.map((b: any) => {
              const booths = parseBooths(b.booths);
              return (
                <div key={b.bookingId} style={{ ...s.card, border: "1px solid rgba(129,140,248,0.2)", background: "rgba(129,140,248,0.03)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "0.2rem" }}>{b.companyName}</div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b", fontFamily: "monospace" }}>{b.bookingId}</div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "0.2rem" }}>
                        PIC: {b.pic1Name} · {b.pic1Whatsapp}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", color: "#64748b", marginRight: "0.25rem" }}>Booth:</span>
                      {booths.map((bt: any) => (
                        <span key={bt.id || bt.label} style={{ display: "inline-block", padding: "0.2rem 0.65rem", borderRadius: 20, fontSize: "0.75rem", fontWeight: 800, background: getBoothType(bt) === "main" ? "rgba(212,160,23,0.2)" : "rgba(20,184,166,0.2)", color: getBoothType(bt) === "main" ? "#D4A017" : "#14b8a6", border: `1px solid ${getBoothType(bt) === "main" ? "rgba(212,160,23,0.4)" : "rgba(20,184,166,0.4)"}` }}>
                          {getBoothLabel(bt)} · {getBoothType(bt) === "main" ? "Main 5×5m" : "Standard 3×3m"}
                        </span>
                      ))}
                      <span style={{ display: "inline-block", padding: "0.2rem 0.65rem", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, background: b.status === "confirmed" ? "rgba(20,184,166,0.15)" : "rgba(249,115,22,0.15)", color: b.status === "confirmed" ? "#14b8a6" : "#f97316" }}>
                        {b.status}
                      </span>
                    </div>
                  </div>

                  {b.needsBoothDesign && (
                    <div style={{ padding: "0.85rem 1rem", background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.2)", borderRadius: 10, marginBottom: "0.75rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                      <div style={{ fontSize: "1.25rem", flexShrink: 0 }}>📐</div>
                      <div>
                        <div style={{ fontWeight: 700, color: "#818cf8", fontSize: "0.85rem", marginBottom: "0.2rem" }}>Meminta Layanan Desain Booth Interior</div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Perlu koordinasi dengan vendor dekorasi. Hubungi PIC untuk detail kebutuhan desain.</div>
                      </div>
                    </div>
                  )}

                  {b.specialRequest && (
                    <div style={{ padding: "0.85rem 1rem", background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 10, display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                      <div style={{ fontSize: "1.25rem", flexShrink: 0 }}>⚡</div>
                      <div>
                        <div style={{ fontWeight: 700, color: "#f97316", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Catatan / Special Request:</div>
                        <div style={{ fontSize: "0.85rem", color: "#fed7aa", lineHeight: 1.7 }}>{b.specialRequest}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── TAB: INTERVIEW ── */}
        {activeTab === "interview" && (
          <div style={s.card}>
            {/* Day selector */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {DAYS.map((day, i) => (
                  <button key={i} onClick={() => setSelectedDay(i)}
                    style={{ padding: "0.5rem 1.25rem", borderRadius: 10, border: `2px solid ${selectedDay === i ? "#60a5fa" : "rgba(255,255,255,0.08)"}`, background: selectedDay === i ? "rgba(96,165,250,0.1)" : "transparent", color: selectedDay === i ? "#60a5fa" : "#64748b", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
                    {day}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                <span style={{ color: "#60a5fa", fontWeight: 700 }}>{takenToday}</span> / {totalSlots} slot terisi hari ini
              </div>
            </div>

            {/* Grid */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={{ padding: "0.65rem 1rem", textAlign: "left", fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" as const }}>Booth</th>
                    {SLOTS.map(slot => (
                      <th key={slot} style={{ padding: "0.65rem 0.5rem", textAlign: "center", fontSize: "0.7rem", color: "#64748b", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" as const }}>{slot}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INT_BOOTHS.map(booth => (
                    <tr key={booth} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "0.65rem 1rem", fontWeight: 700, color: "#60a5fa", fontSize: "0.88rem" }}>{booth}</td>
                      {SLOTS.map((_, slotIdx) => {
                        const key = `${booth}-${selectedDay}-${slotIdx}`;
                        const company = takenSlots[key];
                        return (
                          <td key={slotIdx} style={{ padding: "0.4rem", textAlign: "center" }}>
                            {company ? (
                              <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "0.3rem 0.4rem", fontSize: "0.68rem", color: "#fca5a5", lineHeight: 1.3, maxWidth: 90 }}>
                                {company.replace(/^(PT|CV|UD)\s*/i, "").substring(0, 14)}
                              </div>
                            ) : (
                              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.2)", margin: "0 auto" }}/>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div style={{ marginTop: "1.25rem", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "#64748b" }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}/>
                Terisi ({takenToday} slot)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "#64748b" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.2)" }}/>
                Kosong ({totalSlots - takenToday} slot)
              </div>
              <div style={{ fontSize: "0.78rem", color: "#475569" }}>
                Total 2 hari: {Object.keys(takenSlots).length} / {totalSlots * 2} slot terisi
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
