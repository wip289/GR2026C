import { useState } from "react";

export type BoothStatus = "available" | "reserved" | "booked" | "staff" | "interview" | "area";

export interface BoothDef {
  id: string;
  label: string;
  x: number; y: number; w: number; h: number;
  status: BoothStatus;
  type: "main" | "standard" | "interview" | "area";
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

// ─── LAYOUT CONSTANTS ────────────────────────────────────────
// SVG canvas: 720 × 780
// Standard booth: 56w × 44h  |  gap: 8
// Main booth: 110w × 88h     |  gap: 10
// P booths: 44w × 210h (vertikal)
//
// Column X anchors (standard):
//   colA = 68   (kiri luar: S36 group)
//   colB = 148  (kiri dalam col1: S35/S26...)
//   colC = 212  (kiri dalam col2: S34/S27...)
//   [aisle ~270..340]
//   colD = 348  (kanan dalam col1: S33/S28...)
//   colE = 412  (kanan dalam col2: S32/S29...)
//   [aisle ~468..530]
//   colF = 538  (kanan luar: S31/S30...)
//
// Row Y anchors (standard, pair rows):
//   row1 = 132  (S36/S35/S34 ... S33/S32/S31)
//   row2 = 184  (S25/S26/S27 ... S28/S29/S30)
//   gap24 = 240
//   row3 = 248  (S24/S23/S22 ... S21/S20/S19)
//   row4 = 300  (S13/S14/S15 ... S16/S17/S18)
//   gap5 = 356
//   row5 = 364  (S12/S11/S10 ... S9/S8/S7)
//   row6 = 416  (S1/S2/S3   ... S4/S5/S6)
//
// Main section starts Y = 476
//   mainRow1 = 484  (M9,M10,M11,M12)
//   mainRow2 = 582  (M5,M6,M7,M8)
//   mainRow3 = 680  (M1,M2,M3,M4)
//
// Main col X:
//   mColA = 148  M9,M5,M1
//   mColB = 266  M10,M6,M2
//   [gap]
//   mColC = 388  M11,M7,M3
//   mColD = 506  M12,M8,M4
//
// P booths (kiri x=8, kanan x=668)
//   P2: y=484, h=88
//   P1: y=582, h=176 (covers M5 row + M1 row)

const SW = 56, SH = 44; // standard booth
const MW = 110, MH = 88; // main booth
const PW = 44;           // panel booth width

// Column X
const cA = 68, cB = 148, cC = 212;
const cD = 348, cE = 412;
const cF = 538;

// Row Y standard
const r1 = 132, r2 = 184;
const r3 = 248, r4 = 300;
const r5 = 364, r6 = 416;

// Main col X
const mA = 148, mB = 266, mC = 388, mD = 506;
// Main row Y
const mr1 = 484, mr2 = 582, mr3 = 680;

// P booths X
const pLx = 8, pRx = 624;

export const ALL_BOOTHS: BoothDef[] = [

  // ── AREA LABELS ──────────────────────────────────────────
  { id:"stage",    label:"STAGE",    x:180, y:16,  w:340, h:44,  status:"area", type:"area", price:0 },
  { id:"lounge",   label:"LOUNGE",   x:8,   y:16,  w:110, h:44,  status:"area", type:"area", price:0 },
  { id:"entrance", label:"ENTRANCE", x:240, y:740, w:200, h:30,  status:"area", type:"area", price:0 },

  // ── S37, S38 — kanan atas (pojok, staff area) ─────────────
  { id:"S37", label:"S37", x:538, y:72,  w:SW, h:SH, status:"staff",    type:"standard", price:0 },
  { id:"S38", label:"S38", x:602, y:72,  w:SW, h:SH, status:"staff",    type:"standard", price:0 },

  // ── STANDARD BOOTHS ──────────────────────────────────────
  // --- Baris 1 & 2 (S36,S25 / S35,S34,S26,S27 / S33,S32,S28,S29 / S31,S30) ---
  // Kiri luar
  { id:"S36", label:"S36", x:cA, y:r1, w:SW, h:SH, status:"booked",    type:"standard", price:7500000 },
  { id:"S25", label:"S25", x:cA, y:r2, w:SW, h:SH, status:"booked",    type:"standard", price:7500000 },

  // Kiri dalam col B+C
  { id:"S35", label:"S35", x:cB, y:r1, w:SW, h:SH, status:"booked",    type:"standard", price:7500000 },
  { id:"S34", label:"S34", x:cC, y:r1, w:SW, h:SH, status:"reserved",  type:"standard", price:7500000 },
  { id:"S26", label:"S26", x:cB, y:r2, w:SW, h:SH, status:"reserved",  type:"standard", price:7500000 },
  { id:"S27", label:"S27", x:cC, y:r2, w:SW, h:SH, status:"available", type:"standard", price:7500000 },

  // Kanan dalam col D+E
  { id:"S33", label:"S33", x:cD, y:r1, w:SW, h:SH, status:"reserved",  type:"standard", price:7500000 },
  { id:"S32", label:"S32", x:cE, y:r1, w:SW, h:SH, status:"booked",    type:"standard", price:7500000 },
  { id:"S28", label:"S28", x:cD, y:r2, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S29", label:"S29", x:cE, y:r2, w:SW, h:SH, status:"available", type:"standard", price:7500000 },

  // Kanan luar col F
  { id:"S31", label:"S31", x:cF, y:r1, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S30", label:"S30", x:cF, y:r2, w:SW, h:SH, status:"available", type:"standard", price:7500000 },

  // --- Baris 3 & 4 (S24,S13 / S23,S22,S14,S15 / S21,S20,S16,S17 / S19,S18) ---
  // Kiri luar
  { id:"S24", label:"S24", x:cA, y:r3, w:SW, h:SH, status:"booked",    type:"standard", price:7500000 },
  { id:"S13", label:"S13", x:cA, y:r4, w:SW, h:SH, status:"reserved",  type:"standard", price:7500000 },

  // Kiri dalam
  { id:"S23", label:"S23", x:cB, y:r3, w:SW, h:SH, status:"reserved",  type:"standard", price:7500000 },
  { id:"S22", label:"S22", x:cC, y:r3, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S14", label:"S14", x:cB, y:r4, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S15", label:"S15", x:cC, y:r4, w:SW, h:SH, status:"available", type:"standard", price:7500000 },

  // Kanan dalam
  { id:"S21", label:"S21", x:cD, y:r3, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S20", label:"S20", x:cE, y:r3, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S16", label:"S16", x:cD, y:r4, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S17", label:"S17", x:cE, y:r4, w:SW, h:SH, status:"available", type:"standard", price:7500000 },

  // Kanan luar
  { id:"S19", label:"S19", x:cF, y:r3, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S18", label:"S18", x:cF, y:r4, w:SW, h:SH, status:"available", type:"standard", price:7500000 },

  // --- Baris 5 & 6 (S12,S1 / S11,S10,S2,S3 / S9,S8,S4,S5 / S7,S6) ---
  // Kiri luar
  { id:"S12", label:"S12", x:cA, y:r5, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S1",  label:"S1",  x:cA, y:r6, w:SW, h:SH, status:"available", type:"standard", price:7500000 },

  // Kiri dalam
  { id:"S11", label:"S11", x:cB, y:r5, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S10", label:"S10", x:cC, y:r5, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S2",  label:"S2",  x:cB, y:r6, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S3",  label:"S3",  x:cC, y:r6, w:SW, h:SH, status:"available", type:"standard", price:7500000 },

  // Kanan dalam
  { id:"S9",  label:"S9",  x:cD, y:r5, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S8",  label:"S8",  x:cE, y:r5, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S4",  label:"S4",  x:cD, y:r6, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S5",  label:"S5",  x:cE, y:r6, w:SW, h:SH, status:"available", type:"standard", price:7500000 },

  // Kanan luar
  { id:"S7",  label:"S7",  x:cF, y:r5, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S6",  label:"S6",  x:cF, y:r6, w:SW, h:SH, status:"available", type:"standard", price:7500000 },

  // ── MAIN BOOTHS ──────────────────────────────────────────
  // Row 1: M9, M10 (kiri grup) | M11, M12 (kanan grup)
  { id:"M9",  label:"M9",  x:mA, y:mr1, w:MW, h:MH, status:"booked",    type:"main", price:10000000 },
  { id:"M10", label:"M10", x:mB, y:mr1, w:MW, h:MH, status:"reserved",  type:"main", price:10000000 },
  { id:"M11", label:"M11", x:mC, y:mr1, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  { id:"M12", label:"M12", x:mD, y:mr1, w:MW, h:MH, status:"available", type:"main", price:10000000 },

  // Row 2: M5, M6 | M7, M8
  { id:"M5",  label:"M5",  x:mA, y:mr2, w:MW, h:MH, status:"booked",    type:"main", price:10000000 },
  { id:"M6",  label:"M6",  x:mB, y:mr2, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  { id:"M7",  label:"M7",  x:mC, y:mr2, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  { id:"M8",  label:"M8",  x:mD, y:mr2, w:MW, h:MH, status:"available", type:"main", price:10000000 },

  // Row 3: M1, M2 | M3, M4
  { id:"M1",  label:"M1",  x:mA, y:mr3, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  { id:"M2",  label:"M2",  x:mB, y:mr3, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  { id:"M3",  label:"M3",  x:mC, y:mr3, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  { id:"M4",  label:"M4",  x:mD, y:mr3, w:MW, h:MH, status:"available", type:"main", price:10000000 },

  // ── P BOOTHS — vertikal, kiri & kanan area main ──────────
  // P2 kiri atas (sejajar M9 row), P1 kiri bawah (sejajar M5+M1)
  { id:"P2", label:"P2", x:pLx, y:mr1,       w:PW, h:MH,       status:"interview", type:"interview", price:0 },
  { id:"P1", label:"P1", x:pLx, y:mr2,        w:PW, h:MH*2+10, status:"interview", type:"interview", price:0 },
  // P4 kanan atas (sejajar M12 row), P3 kanan bawah
  { id:"P4", label:"P4", x:pRx, y:mr1,        w:PW, h:MH,       status:"interview", type:"interview", price:0 },
  { id:"P3", label:"P3", x:pRx, y:mr2,        w:PW, h:MH*2+10, status:"interview", type:"interview", price:0 },
];

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

interface BoothMapPickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  booths?: BoothDef[];
}

export default function BoothMapPicker({ selectedIds, onChange, booths: boothsProp }: BoothMapPickerProps) {
  const booths = boothsProp || ALL_BOOTHS;
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleClick = (booth: BoothDef) => {
    if (booth.type === "area" || booth.type === "interview") return;
    if (booth.status !== "available" && !selectedIds.includes(booth.id)) return;
    if (selectedIds.includes(booth.id)) {
      onChange(selectedIds.filter(id => id !== booth.id));
    } else {
      onChange([...selectedIds, booth.id]);
    }
  };

  const selectedBooths = booths.filter(b => selectedIds.includes(b.id));
  const total = selectedBooths.reduce((s, b) => s + b.price, 0);

  // Canvas: 720 wide × 790 tall
  const VW = 720, VH = 790;

  return (
    <div>
      <div style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 10, padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.82rem", color: "#94a3b8", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
        <span style={{ flexShrink: 0 }}>💡</span>
        <span>Klik booth <strong style={{ color: "#14b8a6" }}>hijau</strong> untuk memilih. Klik lagi untuk membatalkan.</span>
      </div>

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(20,184,166,0.15)", borderRadius: 12, padding: "0.75rem", overflowX: "auto" }}>
        <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", minWidth: 360, display: "block" }}>

          {/* Background */}
          <rect width={VW} height={VH} fill="#0a1628" rx="8"/>
          <defs>
            <pattern id="grid2" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(20,184,166,0.04)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width={VW} height={VH} fill="url(#grid2)" rx="8"/>

          {/* Outer border wall */}
          <rect x="4" y="70" width={VW-8} height={VH-80} fill="none" stroke="rgba(212,160,23,0.2)" strokeWidth="1.5" rx="4"/>

          {/* Separator line: standard area vs main area */}
          <line x1="8" y1="460" x2={VW-8} y2="460" stroke="rgba(212,160,23,0.35)" strokeWidth="1" strokeDasharray="8 4"/>
          <text x={VW/2} y="456" textAnchor="middle" fill="rgba(212,160,23,0.4)" fontSize="8">— MAIN BOOTH AREA —</text>

          {/* Aisle lines (vertical gaps between booth clusters) */}
          {/* Left aisle ~col C+8 to col D */}
          <line x1="276" y1="120" x2="276" y2="460" stroke="rgba(255,255,255,0.04)" strokeWidth="8"/>
          {/* Right aisle */}
          <line x1="476" y1="120" x2="476" y2="460" stroke="rgba(255,255,255,0.04)" strokeWidth="8"/>

          {/* Main area aisles */}
          <line x1="276" y1="470" x2="276" y2={VH-40} stroke="rgba(255,255,255,0.04)" strokeWidth="20"/>
          <line x1="476" y1="470" x2="476" y2={VH-40} stroke="rgba(255,255,255,0.04)" strokeWidth="20"/>

          {/* All booths */}
          {booths.map(booth => {
            const isSelected = selectedIds.includes(booth.id);
            const isHovered  = hoveredId === booth.id;
            const clickable  = booth.type !== "area" && booth.type !== "interview"
              && (booth.status === "available" || isSelected);

            let fill    = COLORS[booth.status].fill;
            let stroke  = COLORS[booth.status].stroke;
            let strokeW = 1;

            if (isSelected)              { fill = "#064e3b"; stroke = "#10b981"; strokeW = 2; }
            else if (isHovered && clickable) { fill = "#0d9488"; stroke = "#5eead4"; strokeW = 2; }

            const fontSize = booth.w >= 100 ? 13
              : booth.w >= 56 ? 10
              : booth.w >= 44 ? 9
              : 8;

            return (
              <g key={booth.id}
                onClick={() => handleClick(booth)}
                onMouseEnter={() => clickable && setHoveredId(booth.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ cursor: clickable ? "pointer" : "default" }}
              >
                <rect
                  x={booth.x} y={booth.y}
                  width={booth.w} height={booth.h}
                  rx="3" fill={fill} stroke={stroke}
                  strokeWidth={strokeW} opacity={0.93}
                />
                {isSelected && (
                  <text x={booth.x + booth.w/2} y={booth.y + 13}
                    textAnchor="middle" fill="#6ee7b7" fontSize="10" fontWeight="900">✓</text>
                )}
                <text
                  x={booth.x + booth.w/2}
                  y={booth.y + booth.h/2 + (isSelected ? 4 : 0)}
                  textAnchor="middle" dominantBaseline="central"
                  fill={COLORS[booth.status].text}
                  fontSize={fontSize} fontWeight="700"
                >
                  {booth.label}
                </text>
              </g>
            );
          })}

          {/* ENTRANCE arrow */}
          <polygon points={`${VW/2},${VH-8} ${VW/2-12},${VH-24} ${VW/2+12},${VH-24}`} fill="rgba(212,160,23,0.5)"/>

        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
        {[
          { fill: "#0f766e", stroke: "#14b8a6", label: "Tersedia" },
          { fill: "#064e3b", stroke: "#10b981", label: "Dipilih ✓" },
          { fill: "#c2410c", stroke: "#f97316", label: "Reserved" },
          { fill: "#991b1b", stroke: "#ef4444", label: "Booked" },
          { fill: "#1e3a8a", stroke: "#60a5fa", label: "Interview / Panel" },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#94a3b8" }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: l.fill, border: `1px solid ${l.stroke}` }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Selected summary */}
      {selectedBooths.length > 0 && (
        <div style={{ marginTop: "1rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 10, padding: "1rem" }}>
          <div style={{ fontSize: "0.78rem", color: "#6ee7b7", fontWeight: 600, marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Booth Dipilih ({selectedBooths.length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
            {selectedBooths.map(b => (
              <div key={b.id} style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, padding: "0.3rem 0.75rem", fontSize: "0.82rem", color: "#6ee7b7", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontWeight: 700 }}>{b.label}</span>
                <span style={{ color: "#D4A017", fontWeight: 700 }}>{fmt(b.price)}</span>
                <button onClick={() => onChange(selectedIds.filter(id => id !== b.id))}
                  style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "0.9rem", padding: 0, lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(16,185,129,0.2)", paddingTop: "0.75rem" }}>
            <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Total</span>
            <span style={{ color: "#D4A017", fontWeight: 800, fontSize: "1.1rem" }}>{fmt(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
