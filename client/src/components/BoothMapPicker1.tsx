import { useState } from "react";

export type BoothStatus = "available" | "reserved" | "booked" | "staff" | "interview" | "area";

export interface BoothDef {
  id: string; label: string;
  x: number; y: number; w: number; h: number;
  status: BoothStatus;
  type: "main" | "standard" | "extra" | "interview" | "area";
  price: number;
}

const COLORS: Record<BoothStatus, { fill: string; stroke: string; text: string }> = {
  available: { fill: "#0f766e", stroke: "#14b8a6", text: "#ccfbf1" },
  reserved:  { fill: "#c2410c", stroke: "#f97316", text: "#ffedd5" },
  booked:    { fill: "#991b1b", stroke: "#ef4444", text: "#fee2e2" },
  staff:     { fill: "#1e3a5f", stroke: "#3b82f6", text: "#bfdbfe" },
  interview: { fill: "#1e3a8a", stroke: "#60a5fa", text: "#bfdbfe" },
  area:      { fill: "#1a2e44", stroke: "#D4A017", text: "#fde68a" },
};

// ─────────────────────────────────────────────────────────────────
// KOORDINAT DIUKUR PRESISI DARI FILE CorelDRAW ASLI
// Original viewBox: 0 0 40000 55000 → scale 0.02 → canvas 800×1100
// ─────────────────────────────────────────────────────────────────

// Standard booth dimensions
const SW = 51, SH = 36;

// Standard booth column X (dari CorelDraw)
const cA = 148;  // kiri luar  (S36, S25, S24, S13, S12, S1)
const cB = 241;  // kiri dalam-1
const cC = 295;  // kiri dalam-2
const cD = 452;  // kanan dalam-1
const cE = 505;  // kanan dalam-2
const cF = 598;  // kanan luar

// Standard booth row Y — 3 pasang dengan gap antar pasang
const r1 = 328; const r2 = 367;   // pasang 1
const r3 = 423; const r4 = 462;   // pasang 2
const r5 = 517; const r6 = 556;   // pasang 3

// Main booth dimensions & positions (dari CorelDraw)
const MW = 90, MH = 75;
const mA = 202;  // cluster kiri col-1
const mB = 295;  // cluster kiri col-2
const mC = 412;  // cluster kanan col-1
const mD = 505;  // cluster kanan col-2
const mr1 = 622; // row M9-M12
const mr2 = 739; // row M5-M8
const mr3 = 816; // row M1-M4

// P Booth (panel/interview) dimensions (dari CorelDraw)
const pLx = 91;   // X kiri
const pRx = 651;  // X kanan
const PW  = 50;   // lebar P booth

export const ALL_BOOTHS: BoothDef[] = [

  // ── AREA LABELS (dari CorelDraw) ─────────────────────────
  { id:"stage",    label:"STAGE",    x:241, y:205, w:316, h:60,  status:"area", type:"area", price:0 },
  { id:"lounge",   label:"LOUNGE",   x:146, y:247, w:93,  h:41,  status:"area", type:"area", price:0 },
  { id:"entrance", label:"ENTRANCE", x:294, y:932, w:211, h:44,  status:"area", type:"area", price:0 },

  // ── S37, S38 — pojok kanan atas (staff) ──────────────────
  { id:"S37", label:"S37", x:560, y:267, w:36, h:36, status:"staff", type:"standard", price:0 },
  { id:"S38", label:"S38", x:600, y:267, w:49, h:36, status:"staff", type:"standard", price:0 },

  // ── STANDARD BOOTHS ─ Pasang 1 (r1=328, r2=367) ─────────
  { id:"S36", label:"S36", x:cA, y:r1, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S35", label:"S35", x:cB, y:r1, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S34", label:"S34", x:cC, y:r1, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S33", label:"S33", x:cD, y:r1, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S32", label:"S32", x:cE, y:r1, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S31", label:"S31", x:cF, y:r1, w:SW, h:SH, status:"available", type:"standard", price:7500000 },

  { id:"S25", label:"S25", x:cA, y:r2, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S26", label:"S26", x:cB, y:r2, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S27", label:"S27", x:cC, y:r2, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S28", label:"S28", x:cD, y:r2, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S29", label:"S29", x:cE, y:r2, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S30", label:"S30", x:cF, y:r2, w:SW, h:SH, status:"available", type:"standard", price:7500000 },

  // ── STANDARD BOOTHS ─ Pasang 2 (r3=423, r4=462) ─────────
  { id:"S24", label:"S24", x:cA, y:r3, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S23", label:"S23", x:cB, y:r3, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S22", label:"S22", x:cC, y:r3, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S21", label:"S21", x:cD, y:r3, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S20", label:"S20", x:cE, y:r3, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S19", label:"S19", x:cF, y:r3, w:SW, h:SH, status:"available", type:"standard", price:7500000 },

  { id:"S13", label:"S13", x:cA, y:r4, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S14", label:"S14", x:cB, y:r4, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S15", label:"S15", x:cC, y:r4, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S16", label:"S16", x:cD, y:r4, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S17", label:"S17", x:cE, y:r4, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S18", label:"S18", x:cF, y:r4, w:SW, h:SH, status:"available", type:"standard", price:7500000 },

  // ── STANDARD BOOTHS ─ Pasang 3 (r5=517, r6=556) ─────────
  { id:"S12", label:"S12", x:cA, y:r5, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S11", label:"S11", x:cB, y:r5, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S10", label:"S10", x:cC, y:r5, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S9",  label:"S9",  x:cD, y:r5, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S8",  label:"S8",  x:cE, y:r5, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S7",  label:"S7",  x:cF, y:r5, w:SW, h:SH, status:"available", type:"standard", price:7500000 },

  { id:"S1",  label:"S1",  x:cA, y:r6, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S2",  label:"S2",  x:cB, y:r6, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S3",  label:"S3",  x:cC, y:r6, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S4",  label:"S4",  x:cD, y:r6, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S5",  label:"S5",  x:cE, y:r6, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S6",  label:"S6",  x:cF, y:r6, w:SW, h:SH, status:"available", type:"standard", price:7500000 },

  // ── MAIN BOOTHS (dari CorelDraw) ─────────────────────────
  // Row mr1=622: M9, M10 (kiri) | M11, M12 (kanan)
  { id:"M9",  label:"M9",  x:mA, y:mr1, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  { id:"M10", label:"M10", x:mB, y:mr1, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  { id:"M11", label:"M11", x:mC, y:mr1, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  { id:"M12", label:"M12", x:mD, y:mr1, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  // Row mr2=739: M5, M6 | M7, M8
  { id:"M5",  label:"M5",  x:mA, y:mr2, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  { id:"M6",  label:"M6",  x:mB, y:mr2, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  { id:"M7",  label:"M7",  x:mC, y:mr2, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  { id:"M8",  label:"M8",  x:mD, y:mr2, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  // Row mr3=816: M1, M2 | M3, M4
  { id:"M1",  label:"M1",  x:mA, y:mr3, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  { id:"M2",  label:"M2",  x:mB, y:mr3, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  { id:"M3",  label:"M3",  x:mC, y:mr3, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  { id:"M4",  label:"M4",  x:mD, y:mr3, w:MW, h:MH, status:"available", type:"main", price:10000000 },

  // ── E BOOTHS — Extra booth (vertikal memanjang, dari CorelDraw) ───
  // Kiri: E2 atas (y=661, h=90), E1 bawah (y=753, h=138)
  { id:"E2", label:"E2", x:pLx, y:661, w:PW, h:90,  status:"available", type:"extra", price:8500000 },
  { id:"E1", label:"E1", x:pLx, y:753, w:PW, h:138, status:"available", type:"extra", price:8500000 },
  // Kanan: E4 atas (y=661, h=90), E3 bawah (y=753, h=138)
  { id:"E4", label:"E4", x:pRx, y:661, w:PW, h:90,  status:"available", type:"extra", price:8500000 },
  { id:"E3", label:"E3", x:pRx, y:753, w:PW, h:138, status:"available", type:"extra", price:8500000 },
];

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

interface BoothMapPickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  booths?: BoothDef[];
  // Panitia mode props
  panitiaMode?: boolean;
  bookingData?: Record<string, { company: string; status: string }>;
  closedBooths?: Set<string>;
  onToggleClose?: (id: string) => void;
}

export default function BoothMapPicker({ selectedIds, onChange, booths: boothsProp, panitiaMode, bookingData, closedBooths, onToggleClose }: BoothMapPickerProps) {
  const booths = boothsProp || ALL_BOOTHS;
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleClick = (booth: BoothDef) => {
    if (booth.type === "area") return;
    if (booth.status !== "available" && !selectedIds.includes(booth.id)) return;
    if (selectedIds.includes(booth.id)) {
      onChange(selectedIds.filter(id => id !== booth.id));
    } else {
      onChange([...selectedIds, booth.id]);
    }
  };

  const selectedBooths = booths.filter(b => selectedIds.includes(b.id));

  // Panitia mode: resolve status dari DB
  const getBoothStatus = (booth: BoothDef): BoothStatus => {
    if (!panitiaMode) return booth.status;
    if (closedBooths?.has(booth.id)) return "staff";
    if (bookingData?.[booth.id]) {
      const s = bookingData[booth.id].status;
      if (s === "confirmed" || s === "active") return "booked";
      if (s === "pending") return "reserved";
    }
    return booth.status;
  };
  const getCompany = (id: string) => bookingData?.[id]?.company || null;
  const total = selectedBooths.reduce((s, b) => s + b.price, 0);

  // Canvas derived from CorelDraw scale: viewBox 800×990
  const VW = 800, VH = 990;

  return (
    <div>
      <div style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 10, padding: "0.7rem 1rem", marginBottom: "1rem", fontSize: "0.8rem", color: "#94a3b8", display: "flex", gap: "0.5rem" }}>
        <span>💡</span>
        <span>Klik booth <strong style={{ color: "#14b8a6" }}>hijau</strong> untuk memilih. Klik lagi untuk membatalkan. Booth merah/oranye sudah dipesan.</span>
      </div>

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(20,184,166,0.15)", borderRadius: 12, padding: "0.75rem", overflowX: "auto" }}>
        <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", minWidth: 360, display: "block" }}>
          {/* Background */}
          <rect width={VW} height={VH} fill="#0a1628" rx="6"/>
          <defs>
            <pattern id="g3" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M30 0L0 0 0 30" fill="none" stroke="rgba(20,184,166,0.035)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width={VW} height={VH} fill="url(#g3)" rx="6"/>

          {/* Outer venue wall */}
          <rect x="6" y="190" width={VW-12} height={VH-200}
            fill="none" stroke="rgba(212,160,23,0.2)" strokeWidth="1.5" rx="4"/>

          {/* Aisle: center vertical gap standard zone */}
          <rect x={cC+SW+2} y={r1-10} width={cD-(cC+SW)-4} height={r6+SH+10-(r1-10)}
            fill="rgba(255,255,255,0.012)" rx="2"/>
          {/* Aisle: right gap standard zone */}
          <rect x={cE+SW+2} y={r1-10} width={cF-(cE+SW)-4} height={r6+SH+10-(r1-10)}
            fill="rgba(255,255,255,0.012)" rx="2"/>
          {/* Separator line */}
          <line x1="6" y1={mr1-14} x2={VW-6} y2={mr1-14}
            stroke="rgba(212,160,23,0.35)" strokeWidth="1" strokeDasharray="8 5"/>
          <text x={VW/2} y={mr1-17} textAnchor="middle"
            fill="rgba(212,160,23,0.4)" fontSize="8" fontWeight="600">── MAIN BOOTH AREA ──</text>
          {/* Aisle: center vertical gap main zone */}
          <rect x={mB+MW+4} y={mr1-10} width={mC-(mB+MW)-8} height={mr3+MH+10-(mr1-10)}
            fill="rgba(255,255,255,0.012)" rx="2"/>

          {/* All booths */}
          {booths.map(booth => {
            const resolvedStatus = getBoothStatus(booth);
            const isClosed = closedBooths?.has(booth.id);
            const company  = getCompany(booth.id);
            const isSel    = selectedIds.includes(booth.id);
            const isHov    = hoveredId === booth.id;
            const click    = !panitiaMode && booth.type !== "area"
                          && (booth.status === "available" || isSel);

            let fill   = COLORS[resolvedStatus].fill;
            let stroke = COLORS[resolvedStatus].stroke;
            let sw     = 1;

            if (isSel)             { fill = "#064e3b"; stroke = "#10b981"; sw = 2.5; }
            else if (isHov&&click) { fill = "#0d9488"; stroke = "#5eead4"; sw = 2; }

            const fs = booth.w >= 80 ? 11 : booth.w >= 51 ? 9 : 8;

            return (
              <g key={booth.id}
                onClick={() => panitiaMode ? setHoveredId(booth.id) : handleClick(booth)}
                onMouseEnter={() => (click || panitiaMode) && setHoveredId(booth.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ cursor: (click || panitiaMode) ? "pointer" : "default" }}>
                <rect x={booth.x} y={booth.y} width={booth.w} height={booth.h}
                  rx="2" fill={fill} stroke={stroke} strokeWidth={sw}
                  opacity={isClosed ? 0.5 : 0.93}/>
                {isSel && (
                  <text x={booth.x+booth.w/2} y={booth.y+12}
                    textAnchor="middle" fill="#6ee7b7" fontSize="9" fontWeight="900">✓</text>
                )}
                {/* Label booth */}
                <text x={booth.x+booth.w/2} y={booth.y+booth.h/2+(isSel||company?-4:0)}
                  textAnchor="middle" dominantBaseline="central"
                  fill={COLORS[resolvedStatus].text} fontSize={fs} fontWeight="700">
                  {booth.label}
                </text>
                {/* Nama perusahaan di map (panitia mode) */}
                {panitiaMode && company && (
                  <text x={booth.x+booth.w/2} y={booth.y+booth.h-6}
                    textAnchor="middle" fill={COLORS[resolvedStatus].text}
                    fontSize={booth.w >= 80 ? 8 : 6} opacity="0.95" fontStyle="italic">
                    {company.replace(/^(PT|CV|UD|PD)\s*/i,"").split(" ").slice(0,2).join(" ")}
                  </text>
                )}
                {/* Closed indicator */}
                {isClosed && (
                  <text x={booth.x+booth.w/2} y={booth.y+booth.h-6}
                    textAnchor="middle" fill="#ef4444" fontSize="8">🔒</text>
                )}
                {/* Close toggle button (panitia mode) */}
                {panitiaMode && booth.type !== "area" && onToggleClose && (
                  <g onClick={(e) => { e.stopPropagation(); onToggleClose(booth.id); }} style={{ cursor:"pointer" }}>
                    <circle cx={booth.x+booth.w-7} cy={booth.y+7} r="7"
                      fill={isClosed ? "#ef4444" : "rgba(100,116,139,0.75)"}
                      stroke={isClosed ? "#fca5a5" : "#64748b"} strokeWidth="0.5"/>
                    <text x={booth.x+booth.w-7} y={booth.y+10}
                      textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
                      {isClosed ? "+" : "×"}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Entrance arrow */}
          <polygon points={`${VW/2},${VH-6} ${VW/2-10},${VH-20} ${VW/2+10},${VH-20}`}
            fill="rgba(212,160,23,0.55)"/>
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
        {[
          { fill:"#0f766e", stroke:"#14b8a6", label:"Tersedia" },
          { fill:"#064e3b", stroke:"#10b981", label:"Dipilih ✓" },
          { fill:"#c2410c", stroke:"#f97316", label:"Reserved" },
          { fill:"#991b1b", stroke:"#ef4444", label:"Booked" },
          { fill:"#1e3a8a", stroke:"#60a5fa", label:"Panel / Interview" },
          { fill:"#1e3a5f", stroke:"#3b82f6", label:"Staff / Panitia" },
        ].map(l => (
          <div key={l.label} style={{ display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.72rem", color:"#94a3b8" }}>
            <div style={{ width:11, height:11, borderRadius:2, background:l.fill, border:`1px solid ${l.stroke}` }}/>
            {l.label}
          </div>
        ))}
      </div>

      {/* Selected summary */}
      {selectedBooths.length > 0 && (
        <div style={{ marginTop:"1rem", background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.25)", borderRadius:10, padding:"1rem" }}>
          <div style={{ fontSize:"0.75rem", color:"#6ee7b7", fontWeight:600, marginBottom:"0.75rem", textTransform:"uppercase", letterSpacing:"0.05em" }}>
            Booth Dipilih ({selectedBooths.length})
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem", marginBottom:"0.75rem" }}>
            {selectedBooths.map(b => (
              <div key={b.id} style={{ background:"rgba(16,185,129,0.15)", border:"1px solid rgba(16,185,129,0.3)", borderRadius:8, padding:"0.3rem 0.75rem", fontSize:"0.8rem", color:"#6ee7b7", display:"flex", alignItems:"center", gap:"0.5rem" }}>
                <span style={{ fontWeight:700 }}>{b.label}</span>
                <span style={{ color:"#D4A017", fontWeight:700 }}>{fmt(b.price)}</span>
                <button onClick={() => onChange(selectedIds.filter(id => id !== b.id))}
                  style={{ background:"none", border:"none", color:"#f87171", cursor:"pointer", fontSize:"0.9rem", padding:0, lineHeight:1 }}>×</button>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", borderTop:"1px solid rgba(16,185,129,0.2)", paddingTop:"0.75rem" }}>
            <span style={{ color:"#94a3b8", fontSize:"0.85rem" }}>Total</span>
            <span style={{ color:"#D4A017", fontWeight:800, fontSize:"1.1rem" }}>{fmt(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
