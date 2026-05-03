import { useState } from "react";
import { useLocation } from "wouter";

// Props untuk mode panitia (opsional — kalau tidak diisi, tampil mode employer biasa)
interface PanitiaProps {
  bookingData?: Record<string, { company: string; status: string }>;
  closedBooths?: Set<string>;
  onToggleClose?: (id: string) => void;
  panitiaMode?: boolean;
}

type BoothStatus = "available" | "reserved" | "booked" | "staff" | "interview" | "area";

interface Booth {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  status: BoothStatus;
  type: "main" | "standard" | "interview" | "area";
  price?: number;
}

const COLORS: Record<BoothStatus, { fill: string; stroke: string; text: string }> = {
  available: { fill: "#0f766e", stroke: "#14b8a6", text: "#ccfbf1" },
  reserved:  { fill: "#c2410c", stroke: "#f97316", text: "#ffedd5" },
  booked:    { fill: "#991b1b", stroke: "#ef4444", text: "#fee2e2" },
  staff:     { fill: "#1e3a5f", stroke: "#3b82f6", text: "#bfdbfe" },
  interview: { fill: "#1e40af", stroke: "#60a5fa", text: "#dbeafe" },
  area:      { fill: "#1a2e44", stroke: "#D4A017", text: "#fde68a" },
};

// Exact layout from the PDF
const BOOTHS: Booth[] = [
  // ── AREAS ──
  { id: "stage",    label: "STAGE",    x: 130, y: 12,  w: 300, h: 40,  status: "area",      type: "area" },
  { id: "lounge",   label: "LOUNGE",   x: 12,  y: 12,  w: 100, h: 40,  status: "area",      type: "area" },
  { id: "entrance", label: "ENTRANCE", x: 200, y: 590, w: 160, h: 28,  status: "area",      type: "area" },

  // ── STANDARD BOOTHS — Row 1 top (S36, S35, S34 | S33, S32 | S31) ──
  { id: "S36", label: "S36", x: 12,  y: 72,  w: 50, h: 44, status: "booked",    type: "standard", price: 7500000 },
  { id: "S35", label: "S35", x: 130, y: 72,  w: 50, h: 44, status: "booked",    type: "standard", price: 7500000 },
  { id: "S34", label: "S34", x: 186, y: 72,  w: 50, h: 44, status: "reserved",  type: "standard", price: 7500000 },
  { id: "S33", label: "S33", x: 310, y: 72,  w: 50, h: 44, status: "reserved",  type: "standard", price: 7500000 },
  { id: "S32", label: "S32", x: 366, y: 72,  w: 50, h: 44, status: "booked",    type: "standard", price: 7500000 },
  { id: "S31", label: "S31", x: 498, y: 72,  w: 50, h: 44, status: "available", type: "standard", price: 7500000 },

  // ── Row 2 (S25, S26, S27 | S28, S29 | S30) ──
  { id: "S25", label: "S25", x: 12,  y: 120, w: 50, h: 44, status: "booked",    type: "standard", price: 7500000 },
  { id: "S26", label: "S26", x: 130, y: 120, w: 50, h: 44, status: "reserved",  type: "standard", price: 7500000 },
  { id: "S27", label: "S27", x: 186, y: 120, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },
  { id: "S28", label: "S28", x: 310, y: 120, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },
  { id: "S29", label: "S29", x: 366, y: 120, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },
  { id: "S30", label: "S30", x: 498, y: 120, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },

  // ── S37, S38 — panitia ──
  { id: "S37", label: "S37", x: 444, y: 72,  w: 50, h: 44, status: "staff",     type: "standard" },
  { id: "S38", label: "S38", x: 498, y: 72,  w: 50, h: 44, status: "staff",     type: "standard" },

  // ── Row 3 (S24, S23, S22 | S21, S20 | S19) ──
  { id: "S24", label: "S24", x: 12,  y: 178, w: 50, h: 44, status: "booked",    type: "standard", price: 7500000 },
  { id: "S23", label: "S23", x: 130, y: 178, w: 50, h: 44, status: "reserved",  type: "standard", price: 7500000 },
  { id: "S22", label: "S22", x: 186, y: 178, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },
  { id: "S21", label: "S21", x: 310, y: 178, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },
  { id: "S20", label: "S20", x: 366, y: 178, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },
  { id: "S19", label: "S19", x: 498, y: 178, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },

  // ── Row 4 (S13, S14, S15 | S16, S17 | S18) ──
  { id: "S13", label: "S13", x: 12,  y: 226, w: 50, h: 44, status: "reserved",  type: "standard", price: 7500000 },
  { id: "S14", label: "S14", x: 130, y: 226, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },
  { id: "S15", label: "S15", x: 186, y: 226, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },
  { id: "S16", label: "S16", x: 310, y: 226, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },
  { id: "S17", label: "S17", x: 366, y: 226, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },
  { id: "S18", label: "S18", x: 498, y: 226, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },

  // ── Row 5 (S12, S11, S10 | S9, S8 | S7) ──
  { id: "S12", label: "S12", x: 12,  y: 284, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },
  { id: "S11", label: "S11", x: 130, y: 284, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },
  { id: "S10", label: "S10", x: 186, y: 284, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },
  { id: "S9",  label: "S9",  x: 310, y: 284, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },
  { id: "S8",  label: "S8",  x: 366, y: 284, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },
  { id: "S7",  label: "S7",  x: 498, y: 284, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },

  // ── Row 6 bottom standard (S1, S2, S3 | S4, S5 | S6) ──
  { id: "S1",  label: "S1",  x: 12,  y: 332, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },
  { id: "S2",  label: "S2",  x: 130, y: 332, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },
  { id: "S3",  label: "S3",  x: 186, y: 332, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },
  { id: "S4",  label: "S4",  x: 310, y: 332, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },
  { id: "S5",  label: "S5",  x: 366, y: 332, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },
  { id: "S6",  label: "S6",  x: 498, y: 332, w: 50, h: 44, status: "available", type: "standard", price: 7500000 },

  // ── MAIN BOOTHS ──
  { id: "M9",  label: "M9",  x: 130, y: 392, w: 90, h: 72, status: "booked",    type: "main", price: 10000000 },
  { id: "M10", label: "M10", x: 228, y: 392, w: 90, h: 72, status: "reserved",  type: "main", price: 10000000 },
  { id: "M11", label: "M11", x: 342, y: 392, w: 90, h: 72, status: "available", type: "main", price: 10000000 },
  { id: "M12", label: "M12", x: 440, y: 392, w: 90, h: 72, status: "available", type: "main", price: 10000000 },
  { id: "M5",  label: "M5",  x: 130, y: 474, w: 90, h: 72, status: "booked",    type: "main", price: 10000000 },
  { id: "M6",  label: "M6",  x: 228, y: 474, w: 90, h: 72, status: "available", type: "main", price: 10000000 },
  { id: "M7",  label: "M7",  x: 342, y: 474, w: 90, h: 72, status: "available", type: "main", price: 10000000 },
  { id: "M8",  label: "M8",  x: 440, y: 474, w: 90, h: 72, status: "available", type: "main", price: 10000000 },
  { id: "M1",  label: "M1",  x: 130, y: 552, w: 90, h: 72, status: "available", type: "main", price: 10000000 },
  { id: "M2",  label: "M2",  x: 228, y: 552, w: 90, h: 72, status: "available", type: "main", price: 10000000 },
  { id: "M3",  label: "M3",  x: 342, y: 552, w: 90, h: 72, status: "available", type: "main", price: 10000000 },
  { id: "M4",  label: "M4",  x: 440, y: 552, w: 90, h: 72, status: "available", type: "main", price: 10000000 },

  // ── INTERVIEW BOOTHS — left (E1-E5) ──
  { id: "E1",  label: "E1",  x: 560, y: 400, w: 36, h: 36, status: "interview", type: "interview" },
  { id: "E2",  label: "E2",  x: 560, y: 440, w: 36, h: 36, status: "interview", type: "interview" },
  { id: "E3",  label: "E3",  x: 560, y: 480, w: 36, h: 36, status: "interview", type: "interview" },
  { id: "E4",  label: "E4",  x: 560, y: 520, w: 36, h: 36, status: "interview", type: "interview" },
  { id: "E5",  label: "E5",  x: 560, y: 560, w: 36, h: 36, status: "interview", type: "interview" },

  // ── INTERVIEW BOOTHS — right (E6-E10) ──
  { id: "E6",  label: "E6",  x: 12,  y: 560, w: 36, h: 36, status: "interview", type: "interview" },
  { id: "E7",  label: "E7",  x: 12,  y: 520, w: 36, h: 36, status: "interview", type: "interview" },
  { id: "E8",  label: "E8",  x: 12,  y: 480, w: 36, h: 36, status: "interview", type: "interview" },
  { id: "E9",  label: "E9",  x: 12,  y: 440, w: 36, h: 36, status: "interview", type: "interview" },
  { id: "E10", label: "E10", x: 12,  y: 400, w: 36, h: 36, status: "interview", type: "interview" },
];

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

const availableCount = BOOTHS.filter(b => b.status === "available" && b.type !== "area").length;
const bookedCount    = BOOTHS.filter(b => b.status === "booked").length;
const reservedCount  = BOOTHS.filter(b => b.status === "reserved").length;

export default function BoothMap({ bookingData, closedBooths, onToggleClose, panitiaMode }: PanitiaProps = {}) {
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState<Booth | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Resolve booth status: panitia mode pakai data real dari DB
  const getBoothStatus = (booth: Booth): BoothStatus => {
    if (closedBooths?.has(booth.id)) return "staff"; // abu-abu = ditutup
    if (bookingData?.[booth.id]) {
      const s = bookingData[booth.id].status;
      if (s === "confirmed" || s === "active") return "booked";
      if (s === "pending") return "reserved";
    }
    return booth.status;
  };

  const getCompanyName = (id: string): string | null => {
    if (!bookingData?.[id]) return null;
    return bookingData[id].company
      .replace(/^(PT|CV|UD|PD)\s*/i, "")
      .split(" ").slice(0, 2).join(" ");
  };
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleClick = (booth: Booth) => {
    if (booth.type === "area") return;
    setSelected(booth);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a1628", fontFamily: "system-ui, sans-serif", color: "#f1f5f9" }}>

      {/* Nav */}
      <nav style={{ background: "rgba(10,22,40,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(20,184,166,0.2)", padding: "0 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#14b8a6", cursor: "pointer", fontSize: "0.9rem" }}>← Kembali</button>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 32 }} />
        </div>
        <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Denah Booth — Grand Recruitment 2026</div>
      </nav>

      {/* FOMO bar */}
      <div style={{ background: "linear-gradient(90deg, rgba(239,68,68,0.15), rgba(249,115,22,0.15))", borderBottom: "1px solid rgba(239,68,68,0.2)", padding: "0.6rem 2rem", display: "flex", gap: "2rem", justifyContent: "center", flexWrap: "wrap", fontSize: "0.85rem" }}>
        <span style={{ color: "#fca5a5" }}>🔴 <strong>{bookedCount} booth</strong> sudah dipesan</span>
        <span style={{ color: "#fed7aa" }}>🟠 <strong>{reservedCount} booth</strong> dalam proses</span>
        <span style={{ color: "#6ee7b7" }}>🟢 <strong>{availableCount} booth</strong> masih tersedia</span>
        <span style={{ color: "#fde68a", fontWeight: 700 }}>⚡ Segera amankan booth Anda!</span>
      </div>

      <div style={{ display: "flex", gap: "2rem", padding: "2rem", alignItems: "flex-start", maxWidth: 1200, margin: "0 auto", flexWrap: "wrap" }}>

        {/* SVG MAP */}
        <div style={{ flex: "1 1 560px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(20,184,166,0.15)", borderRadius: 16, padding: "1.5rem", overflow: "auto" }}>
          <svg viewBox="0 0 620 640" style={{ width: "100%", maxWidth: 620, display: "block", margin: "0 auto" }}>
            {/* Background */}
            <rect x="0" y="0" width="620" height="640" fill="#0a1628" rx="8"/>

            {/* Venue outline */}
            <rect x="4" y="4" width="612" height="622" rx="6" fill="none" stroke="rgba(20,184,166,0.2)" strokeWidth="1" strokeDasharray="4 3"/>

            {/* Grid lines subtle */}
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(20,184,166,0.04)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="620" height="640" fill="url(#grid)" rx="8"/>

            {/* Render all booths */}
            {BOOTHS.map(booth => {
              const resolvedStatus = getBoothStatus(booth);
              const c = COLORS[resolvedStatus];
              const isClosed = closedBooths?.has(booth.id);
              const companyName = getCompanyName(booth.id);
              const isHovered = hoveredId === booth.id;
              const isSelected = selected?.id === booth.id;
              const clickable = booth.type !== "area";

              return (
                <g key={booth.id}
                  onClick={() => handleClick(booth)}
                  onMouseEnter={() => clickable && setHoveredId(booth.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ cursor: clickable ? "pointer" : "default" }}
                >
                  <rect
                    x={booth.x} y={booth.y} width={booth.w} height={booth.h} rx="3"
                    opacity={isClosed ? 0.5 : 1}
                    fill={c.fill}
                    stroke={isSelected ? "#fff" : isHovered ? c.stroke : c.stroke}
                    strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
                    opacity={isHovered ? 1 : 0.9}
                  />
                  {/* Label */}
                  <text
                    x={booth.x + booth.w / 2}
                    y={booth.y + booth.h / 2 + (booth.h > 50 ? -6 : 1)}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={c.text}
                    fontSize={booth.w > 70 ? 13 : booth.w > 40 ? 10 : 8}
                    fontWeight="700"
                  >
                    {booth.label}
                  </text>
                  {/* Company name in panitia mode */}
                  {panitiaMode && companyName && (
                    <text
                      x={booth.x + booth.w / 2}
                      y={booth.y + booth.h / 2 + 12}
                      textAnchor="middle"
                      fill={c.text}
                      fontSize={booth.w > 70 ? 8 : 6}
                      opacity="0.9"
                    >{companyName}</text>
                  )}
                  {/* Closed indicator */}
                  {isClosed && (
                    <text x={booth.x + booth.w / 2} y={booth.y + booth.h / 2 + 12}
                      textAnchor="middle" fill="#ef4444" fontSize="7" opacity="0.9">🔒</text>
                  )}
                  {/* Close/open toggle button in panitia mode */}
                  {panitiaMode && booth.type !== "area" && onToggleClose && (
                    <g onClick={(e) => { e.stopPropagation(); onToggleClose(booth.id); }} style={{ cursor: "pointer" }}>
                      <circle cx={booth.x + booth.w - 6} cy={booth.y + 6} r="6"
                        fill={isClosed ? "#ef4444" : "rgba(100,116,139,0.7)"}
                        stroke={isClosed ? "#fca5a5" : "#64748b"} strokeWidth="0.5"/>
                      <text x={booth.x + booth.w - 6} y={booth.y + 9}
                        textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">
                        {isClosed ? "+" : "×"}
                      </text>
                    </g>
                  )}
                  {/* Price for main booths */}
                  {booth.type === "main" && booth.price && (
                    <text
                      x={booth.x + booth.w / 2}
                      y={booth.y + booth.h / 2 + 10}
                      textAnchor="middle"
                      fill={c.text}
                      fontSize="8"
                      opacity="0.8"
                    >
                      {booth.status === "available" ? "Rp 10jt" : booth.status === "booked" ? "BOOKED" : "RESERVED"}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Separator line between standard and main areas */}
            <line x1="80" y1="378" x2="555" y2="378" stroke="rgba(212,160,23,0.3)" strokeWidth="1" strokeDasharray="6 3"/>
          </svg>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ flex: "0 0 280px", display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Legend */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>Keterangan</div>
            {[
              { status: "available" as BoothStatus, label: "Tersedia — bisa dipesan" },
              { status: "reserved"  as BoothStatus, label: "Reserved — sedang diproses" },
              { status: "booked"    as BoothStatus, label: "Booked — sudah dipesan" },
              { status: "interview" as BoothStatus, label: "Interview booth — gratis*" },
              { status: "staff"     as BoothStatus, label: "Panitia & Sekretariat" },
              { status: "area"      as BoothStatus, label: "Area khusus (Stage/Lounge)" },
            ].map(l => (
              <div key={l.status} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.6rem" }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: COLORS[l.status].fill, border: `1px solid ${COLORS[l.status].stroke}`, flexShrink: 0 }} />
                <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{l.label}</span>
              </div>
            ))}
            <p style={{ fontSize: "0.72rem", color: "#475569", marginTop: "0.75rem", lineHeight: 1.5 }}>
              *Interview booth gratis untuk employer yang sudah memesan booth S atau M. Booking via dashboard employer.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {[
              { label: "Tersedia", val: availableCount, color: "#14b8a6" },
              { label: "Dipesan", val: bookedCount + reservedCount, color: "#f97316" },
              { label: "Main Booth", val: 12, color: "#D4A017" },
              { label: "Standard", val: 36, color: "#94a3b8" },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "0.85rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: "0.7rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Selected booth detail */}
          {selected ? (
            <div style={{ background: selected.status === "available" ? "rgba(20,184,166,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${COLORS[selected.status].stroke}`, borderRadius: 12, padding: "1.5rem" }}>
              <div style={{ fontWeight: 800, fontSize: "1.3rem", marginBottom: "0.5rem", color: COLORS[selected.status].text }}>
                Booth {selected.label}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "1rem" }}>
                {selected.type === "main" ? "Main Booth · 5×5 meter" : selected.type === "standard" ? "Standard Booth · 3×3 meter" : selected.type === "interview" ? "Interview Booth" : ""}
              </div>

              {selected.price && (
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#D4A017", marginBottom: "1rem" }}>
                  {fmt(selected.price)}
                </div>
              )}

              <div style={{ marginBottom: "1rem" }}>
                <div style={{ display: "inline-block", padding: "0.3rem 0.85rem", borderRadius: 20, fontSize: "0.8rem", fontWeight: 700, background: COLORS[selected.status].fill, color: COLORS[selected.status].text, border: `1px solid ${COLORS[selected.status].stroke}` }}>
                  {selected.status === "available" ? "✓ Tersedia" : selected.status === "reserved" ? "⏳ Reserved" : selected.status === "booked" ? "✗ Sudah Dipesan" : selected.status === "interview" ? "Gratis untuk Employer" : "Panitia"}
                </div>
              </div>

              {panitiaMode && onToggleClose && (
                <button onClick={() => onToggleClose(selected.id)}
                  style={{ width: "100%", background: closedBooths?.has(selected.id) ? "rgba(20,184,166,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${closedBooths?.has(selected.id) ? "#14b8a6" : "#ef4444"}`, color: closedBooths?.has(selected.id) ? "#14b8a6" : "#ef4444", borderRadius: 10, padding: "0.75rem", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", marginBottom: "0.5rem" }}>
                  {closedBooths?.has(selected.id) ? "🔓 Buka Kembali" : "🔒 Tutup Booth (Tidak Dijual)"}
                </button>
              )}
              {!panitiaMode && selected.status === "available" && selected.price && (
                <button
                  onClick={() => navigate("/employer/register")}
                  style={{ width: "100%", background: "linear-gradient(135deg, #0d9488, #14b8a6)", border: "none", color: "#fff", borderRadius: 10, padding: "0.85rem", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer" }}
                >
                  Pesan Booth Ini →
                </button>
              )}
              {selected.status === "reserved" && (
                <p style={{ fontSize: "0.8rem", color: "#94a3b8", textAlign: "center" }}>Booth ini sedang dalam proses pembayaran oleh employer lain.</p>
              )}
              {selected.status === "booked" && (
                <p style={{ fontSize: "0.8rem", color: "#94a3b8", textAlign: "center" }}>Booth ini sudah dipesan. Pilih booth lain yang masih tersedia.</p>
              )}
              {selected.status === "interview" && (
                <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Booth interview tersedia gratis untuk employer yang sudah memesan booth S atau M. Booking jadwal via dashboard employer setelah pendaftaran.</p>
              )}
              {selected.status === "staff" && (
                <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Area panitia dan sekretariat. Tidak tersedia untuk umum.</p>
              )}
            </div>
          ) : (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "1.5rem", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👆</div>
              <p style={{ color: "#475569", fontSize: "0.85rem", lineHeight: 1.6 }}>Klik booth mana saja untuk melihat detail dan harga</p>
            </div>
          )}

          {/* CTA - only show in employer mode */}
          {!panitiaMode && (
            <button
              onClick={() => navigate("/employer/register")}
              style={{ background: "linear-gradient(135deg, #D4A017, #B8860B)", border: "none", color: "#fff", borderRadius: 12, padding: "1rem", fontSize: "1rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 0 20px rgba(212,160,23,0.3)" }}
            >
              Daftar sebagai Employer →
            </button>
          )}
        </div>
      </div>

      <style>{`button:hover { opacity: 0.9; } * { box-sizing: border-box; }`}</style>
    </div>
  );
}
