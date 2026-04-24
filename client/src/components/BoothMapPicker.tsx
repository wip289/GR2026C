import { useState } from "react";

export type BoothStatus = "available" | "reserved" | "booked" | "staff" | "interview" | "area";

export interface BoothDef {
  id: string; label: string;
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

// ─────────────────────────────────────────────────────────────
// GRID CONSTANTS — diukur presisi dari gambar floor plan asli
// Canvas SVG: 760 × 820
// ─────────────────────────────────────────────────────────────

// Standard booth size
const SW = 64, SH = 44;

// Standard booth — Column X origins
const cA  = 12;   // Kiri luar  : S36, S25, S24, S13, S12, S1
const cB  = 100;  // Kiri dalam-1: S35, S26, S23, S14, S11, S2
const cC  = 172;  // Kiri dalam-2: S34, S27, S22, S15, S10, S3
//                  AISLE (236→316)
const cD  = 322;  // Kanan dalam-1: S33, S28, S21, S16, S9, S4
const cE  = 394;  // Kanan dalam-2: S32, S29, S20, S17, S8, S5
//                  GAP (458→520)
const cF  = 526;  // Kanan luar : S31, S30, S19, S18, S7, S6
// S37/S38 — pojok kanan atas
const s37x = 598, s38x = 666;

// Standard booth — Row Y origins (pair per 2 rows, gap antar pair)
const r1 = 120, r2 = 172;   // Pair 1: S36/S25, S35/S26, ...
const r3 = 244, r4 = 296;   // Pair 2: S24/S13, S23/S14, ...
const r5 = 368, r6 = 420;   // Pair 3: S12/S1,  S11/S2,  ...

// Main booth size
const MW = 118, MH = 88;

// Main booth — Column X origins
const mA = 100, mB = 226;   // Kiri cluster (M9/M10, M5/M6, M1/M2)
//                             AISLE (344→362)
const mC = 368, mD = 494;   // Kanan cluster (M11/M12, M7/M8, M3/M4)

// Main booth — Row Y origins
const mr1 = 484;  // Row 1: M9, M10, M11, M12
const mr2 = 582;  // Row 2: M5, M6,  M7,  M8
const mr3 = 680;  // Row 3: M1, M2,  M3,  M4

// P (Panel/Interview) booths — vertikal, kiri & kanan
// P2 kiri atas (1 baris), P1 kiri bawah (2 baris)
// P4 kanan atas (1 baris), P3 kanan bawah (2 baris)
const pLx = 12, pRx = 626, PW = 80;
const P2h = MH;              // setinggi 1 main row
const P1h = MH * 2 + 10;    // setinggi 2 main rows + gap

export const ALL_BOOTHS: BoothDef[] = [

  // ── AREA LABELS ────────────────────────────────────────────
  { id:"stage",    label:"STAGE",    x:182, y:14,  w:360, h:44, status:"area", type:"area", price:0 },
  { id:"lounge",   label:"LOUNGE",   x:12,  y:14,  w:82,  h:44, status:"area", type:"area", price:0 },
  { id:"entrance", label:"ENTRANCE", x:250, y:778, w:200, h:30, status:"area", type:"area", price:0 },

  // ── S37, S38 — staff area kanan atas ───────────────────────
  { id:"S37", label:"S37", x:s37x, y:70,  w:SW, h:SH, status:"staff",    type:"standard", price:0 },
  { id:"S38", label:"S38", x:s38x, y:70,  w:SW, h:SH, status:"staff",    type:"standard", price:0 },

  // ── STANDARD BOOTHS ────────────────────────────────────────
  // Pair 1-2 (S36 group / S35-S34 group / S33-S32 group / S31 group)
  { id:"S36", label:"S36", x:cA, y:r1, w:SW, h:SH, status:"booked",    type:"standard", price:7500000 },
  { id:"S25", label:"S25", x:cA, y:r2, w:SW, h:SH, status:"booked",    type:"standard", price:7500000 },
  { id:"S35", label:"S35", x:cB, y:r1, w:SW, h:SH, status:"booked",    type:"standard", price:7500000 },
  { id:"S34", label:"S34", x:cC, y:r1, w:SW, h:SH, status:"reserved",  type:"standard", price:7500000 },
  { id:"S26", label:"S26", x:cB, y:r2, w:SW, h:SH, status:"reserved",  type:"standard", price:7500000 },
  { id:"S27", label:"S27", x:cC, y:r2, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S33", label:"S33", x:cD, y:r1, w:SW, h:SH, status:"reserved",  type:"standard", price:7500000 },
  { id:"S32", label:"S32", x:cE, y:r1, w:SW, h:SH, status:"booked",    type:"standard", price:7500000 },
  { id:"S28", label:"S28", x:cD, y:r2, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S29", label:"S29", x:cE, y:r2, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S31", label:"S31", x:cF, y:r1, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S30", label:"S30", x:cF, y:r2, w:SW, h:SH, status:"available", type:"standard", price:7500000 },

  // Pair 3-4
  { id:"S24", label:"S24", x:cA, y:r3, w:SW, h:SH, status:"booked",    type:"standard", price:7500000 },
  { id:"S13", label:"S13", x:cA, y:r4, w:SW, h:SH, status:"reserved",  type:"standard", price:7500000 },
  { id:"S23", label:"S23", x:cB, y:r3, w:SW, h:SH, status:"reserved",  type:"standard", price:7500000 },
  { id:"S22", label:"S22", x:cC, y:r3, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S14", label:"S14", x:cB, y:r4, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S15", label:"S15", x:cC, y:r4, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S21", label:"S21", x:cD, y:r3, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S20", label:"S20", x:cE, y:r3, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S16", label:"S16", x:cD, y:r4, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S17", label:"S17", x:cE, y:r4, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S19", label:"S19", x:cF, y:r3, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S18", label:"S18", x:cF, y:r4, w:SW, h:SH, status:"available", type:"standard", price:7500000 },

  // Pair 5-6
  { id:"S12", label:"S12", x:cA, y:r5, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S1",  label:"S1",  x:cA, y:r6, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S11", label:"S11", x:cB, y:r5, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S10", label:"S10", x:cC, y:r5, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S2",  label:"S2",  x:cB, y:r6, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S3",  label:"S3",  x:cC, y:r6, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S9",  label:"S9",  x:cD, y:r5, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S8",  label:"S8",  x:cE, y:r5, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S4",  label:"S4",  x:cD, y:r6, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S5",  label:"S5",  x:cE, y:r6, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S7",  label:"S7",  x:cF, y:r5, w:SW, h:SH, status:"available", type:"standard", price:7500000 },
  { id:"S6",  label:"S6",  x:cF, y:r6, w:SW, h:SH, status:"available", type:"standard", price:7500000 },

  // ── MAIN BOOTHS ────────────────────────────────────────────
  // Row 1 — M9,M10 (kiri) | M11,M12 (kanan)
  { id:"M9",  label:"M9",  x:mA, y:mr1, w:MW, h:MH, status:"booked",    type:"main", price:10000000 },
  { id:"M10", label:"M10", x:mB, y:mr1, w:MW, h:MH, status:"reserved",  type:"main", price:10000000 },
  { id:"M11", label:"M11", x:mC, y:mr1, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  { id:"M12", label:"M12", x:mD, y:mr1, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  // Row 2 — M5,M6 | M7,M8
  { id:"M5",  label:"M5",  x:mA, y:mr2, w:MW, h:MH, status:"booked",    type:"main", price:10000000 },
  { id:"M6",  label:"M6",  x:mB, y:mr2, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  { id:"M7",  label:"M7",  x:mC, y:mr2, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  { id:"M8",  label:"M8",  x:mD, y:mr2, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  // Row 3 — M1,M2 | M3,M4
  { id:"M1",  label:"M1",  x:mA, y:mr3, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  { id:"M2",  label:"M2",  x:mB, y:mr3, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  { id:"M3",  label:"M3",  x:mC, y:mr3, w:MW, h:MH, status:"available", type:"main", price:10000000 },
  { id:"M4",  label:"M4",  x:mD, y:mr3, w:MW, h:MH, status:"available", type:"main", price:10000000 },

  // ── P BOOTHS — 4 buah, vertikal memanjang ──────────────────
  // KIRI: P2 (atas, sejajar M9 row) | P1 (bawah, sejajar M5+M1)
  { id:"P2", label:"P2", x:pLx, y:mr1,  w:PW, h:P2h, status:"interview", type:"interview", price:0 },
  { id:"P1", label:"P1", x:pLx, y:mr2,  w:PW, h:P1h, status:"interview", type:"interview", price:0 },
  // KANAN: P4 (atas, sejajar M12 row) | P3 (bawah, sejajar M8+M4)
  { id:"P4", label:"P4", x:pRx, y:mr1,  w:PW, h:P2h, status:"interview", type:"interview", price:0 },
  { id:"P3", label:"P3", x:pRx, y:mr2,  w:PW, h:P1h, status:"interview", type:"interview", price:0 },
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

  return (
    <div>
      {/* Hint */}
      <div style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 10, padding: "0.7rem 1rem", marginBottom: "1rem", fontSize: "0.8rem", color: "#94a3b8", display: "flex", gap: "0.5rem" }}>
        <span>💡</span>
        <span>Klik booth <strong style={{ color: "#14b8a6" }}>hijau</strong> untuk memilih. Klik lagi untuk membatalkan.</span>
      </div>

      {/* SVG MAP */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(20,184,166,0.15)", borderRadius: 12, padding: "0.75rem", overflowX: "auto" }}>
        <svg viewBox="0 0 760 820" style={{ width: "100%", minWidth: 380, display: "block" }}>

          {/* BG */}
          <rect width="760" height="820" fill="#0a1628" rx="8"/>
          <defs>
            <pattern id="g" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M30 0L0 0 0 30" fill="none" stroke="rgba(20,184,166,0.04)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="760" height="820" fill="url(#g)" rx="8"/>

          {/* Outer venue wall */}
          <rect x="6" y="66" width="748" height="738" fill="none"
            stroke="rgba(212,160,23,0.25)" strokeWidth="1.5" rx="4"/>

          {/* Separator line: standard zone vs main zone */}
          <line x1="6" y1="464" x2="754" y2="464"
            stroke="rgba(212,160,23,0.4)" strokeWidth="1" strokeDasharray="8 5"/>
          <text x="380" y="460" textAnchor="middle"
            fill="rgba(212,160,23,0.45)" fontSize="9" fontWeight="600">
            ─── MAIN BOOTH AREA ───
          </text>

          {/* Aisle shading — standard zone */}
          {/* Center aisle (between left inner and right inner) */}
          <rect x={cC+SW+2} y={r1-8} width={cD-(cC+SW)-4} height={r6+SH-(r1-8)+8}
            fill="rgba(255,255,255,0.015)" rx="2"/>
          {/* Right gap (between right inner and right outer) */}
          <rect x={cE+SW+2} y={r1-8} width={cF-(cE+SW)-4} height={r6+SH-(r1-8)+8}
            fill="rgba(255,255,255,0.015)" rx="2"/>

          {/* Main zone center aisle */}
          <rect x={mB+MW+2} y={mr1-8} width={mC-(mB+MW)-4} height={mr3+MH-(mr1-8)+8}
            fill="rgba(255,255,255,0.015)" rx="2"/>

          {/* All booths */}
          {booths.map(booth => {
            const isSel  = selectedIds.includes(booth.id);
            const isHov  = hoveredId === booth.id;
            const click  = booth.type !== "area" && booth.type !== "interview"
              && (booth.status === "available" || isSel);

            let fill   = COLORS[booth.status].fill;
            let stroke = COLORS[booth.status].stroke;
            let sw     = 1;

            if (isSel)            { fill = "#064e3b"; stroke = "#10b981"; sw = 2.5; }
            else if (isHov&&click){ fill = "#0d9488"; stroke = "#5eead4"; sw = 2; }

            const fs = booth.w >= 100 ? 13 : booth.w >= 64 ? 10 : 9;

            return (
              <g key={booth.id}
                onClick={() => handleClick(booth)}
                onMouseEnter={() => click && setHoveredId(booth.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ cursor: click ? "pointer" : "default" }}>
                <rect x={booth.x} y={booth.y} width={booth.w} height={booth.h}
                  rx="3" fill={fill} stroke={stroke} strokeWidth={sw} opacity={0.93}/>
                {isSel && (
                  <text x={booth.x+booth.w/2} y={booth.y+13}
                    textAnchor="middle" fill="#6ee7b7" fontSize="10" fontWeight="900">✓</text>
                )}
                <text
                  x={booth.x+booth.w/2}
                  y={booth.y+booth.h/2+(isSel?4:0)}
                  textAnchor="middle" dominantBaseline="central"
                  fill={COLORS[booth.status].text}
                  fontSize={fs} fontWeight="700">
                  {booth.label}
                </text>
              </g>
            );
          })}

          {/* ENTRANCE arrow */}
          <polygon
            points={`380,812 368,796 392,796`}
            fill="rgba(212,160,23,0.6)"/>

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
        ].map(l => (
          <div key={l.label} style={{ display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.73rem", color:"#94a3b8" }}>
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
