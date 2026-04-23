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
  interview: { fill: "#1e40af", stroke: "#60a5fa", text: "#dbeafe" },
  area:      { fill: "#1a2e44", stroke: "#D4A017", text: "#fde68a" },
};

export const ALL_BOOTHS: BoothDef[] = [
  // Areas
  { id:"stage",    label:"STAGE",    x:130,y:12, w:300,h:40, status:"area",      type:"area",      price:0 },
  { id:"lounge",   label:"LOUNGE",   x:12, y:12, w:100,h:40, status:"area",      type:"area",      price:0 },
  { id:"entrance", label:"ENTRANCE", x:200,y:590,w:160,h:28, status:"area",      type:"area",      price:0 },
  // Standard — Row 1
  { id:"S36",label:"S36",x:12, y:72, w:50,h:44,status:"booked",   type:"standard",price:7500000 },
  { id:"S35",label:"S35",x:130,y:72, w:50,h:44,status:"booked",   type:"standard",price:7500000 },
  { id:"S34",label:"S34",x:186,y:72, w:50,h:44,status:"reserved", type:"standard",price:7500000 },
  { id:"S33",label:"S33",x:310,y:72, w:50,h:44,status:"reserved", type:"standard",price:7500000 },
  { id:"S32",label:"S32",x:366,y:72, w:50,h:44,status:"booked",   type:"standard",price:7500000 },
  { id:"S31",label:"S31",x:498,y:72, w:50,h:44,status:"available",type:"standard",price:7500000 },
  { id:"S37",label:"S37",x:444,y:72, w:50,h:44,status:"staff",    type:"standard",price:0 },
  { id:"S38",label:"S38",x:498,y:72, w:50,h:44,status:"staff",    type:"standard",price:0 },
  // Row 2
  { id:"S25",label:"S25",x:12, y:120,w:50,h:44,status:"booked",   type:"standard",price:7500000 },
  { id:"S26",label:"S26",x:130,y:120,w:50,h:44,status:"reserved", type:"standard",price:7500000 },
  { id:"S27",label:"S27",x:186,y:120,w:50,h:44,status:"available",type:"standard",price:7500000 },
  { id:"S28",label:"S28",x:310,y:120,w:50,h:44,status:"available",type:"standard",price:7500000 },
  { id:"S29",label:"S29",x:366,y:120,w:50,h:44,status:"available",type:"standard",price:7500000 },
  { id:"S30",label:"S30",x:498,y:120,w:50,h:44,status:"available",type:"standard",price:7500000 },
  // Row 3
  { id:"S24",label:"S24",x:12, y:178,w:50,h:44,status:"booked",   type:"standard",price:7500000 },
  { id:"S23",label:"S23",x:130,y:178,w:50,h:44,status:"reserved", type:"standard",price:7500000 },
  { id:"S22",label:"S22",x:186,y:178,w:50,h:44,status:"available",type:"standard",price:7500000 },
  { id:"S21",label:"S21",x:310,y:178,w:50,h:44,status:"available",type:"standard",price:7500000 },
  { id:"S20",label:"S20",x:366,y:178,w:50,h:44,status:"available",type:"standard",price:7500000 },
  { id:"S19",label:"S19",x:498,y:178,w:50,h:44,status:"available",type:"standard",price:7500000 },
  // Row 4
  { id:"S13",label:"S13",x:12, y:226,w:50,h:44,status:"reserved", type:"standard",price:7500000 },
  { id:"S14",label:"S14",x:130,y:226,w:50,h:44,status:"available",type:"standard",price:7500000 },
  { id:"S15",label:"S15",x:186,y:226,w:50,h:44,status:"available",type:"standard",price:7500000 },
  { id:"S16",label:"S16",x:310,y:226,w:50,h:44,status:"available",type:"standard",price:7500000 },
  { id:"S17",label:"S17",x:366,y:226,w:50,h:44,status:"available",type:"standard",price:7500000 },
  { id:"S18",label:"S18",x:498,y:226,w:50,h:44,status:"available",type:"standard",price:7500000 },
  // Row 5
  { id:"S12",label:"S12",x:12, y:284,w:50,h:44,status:"available",type:"standard",price:7500000 },
  { id:"S11",label:"S11",x:130,y:284,w:50,h:44,status:"available",type:"standard",price:7500000 },
  { id:"S10",label:"S10",x:186,y:284,w:50,h:44,status:"available",type:"standard",price:7500000 },
  { id:"S9", label:"S9", x:310,y:284,w:50,h:44,status:"available",type:"standard",price:7500000 },
  { id:"S8", label:"S8", x:366,y:284,w:50,h:44,status:"available",type:"standard",price:7500000 },
  { id:"S7", label:"S7", x:498,y:284,w:50,h:44,status:"available",type:"standard",price:7500000 },
  // Row 6
  { id:"S1", label:"S1", x:12, y:332,w:50,h:44,status:"available",type:"standard",price:7500000 },
  { id:"S2", label:"S2", x:130,y:332,w:50,h:44,status:"available",type:"standard",price:7500000 },
  { id:"S3", label:"S3", x:186,y:332,w:50,h:44,status:"available",type:"standard",price:7500000 },
  { id:"S4", label:"S4", x:310,y:332,w:50,h:44,status:"available",type:"standard",price:7500000 },
  { id:"S5", label:"S5", x:366,y:332,w:50,h:44,status:"available",type:"standard",price:7500000 },
  { id:"S6", label:"S6", x:498,y:332,w:50,h:44,status:"available",type:"standard",price:7500000 },
  // Main booths
  { id:"M9", label:"M9", x:130,y:392,w:90,h:72,status:"booked",   type:"main",    price:10000000 },
  { id:"M10",label:"M10",x:228,y:392,w:90,h:72,status:"reserved", type:"main",    price:10000000 },
  { id:"M11",label:"M11",x:342,y:392,w:90,h:72,status:"available",type:"main",    price:10000000 },
  { id:"M12",label:"M12",x:440,y:392,w:90,h:72,status:"available",type:"main",    price:10000000 },
  { id:"M5", label:"M5", x:130,y:474,w:90,h:72,status:"booked",   type:"main",    price:10000000 },
  { id:"M6", label:"M6", x:228,y:474,w:90,h:72,status:"available",type:"main",    price:10000000 },
  { id:"M7", label:"M7", x:342,y:474,w:90,h:72,status:"available",type:"main",    price:10000000 },
  { id:"M8", label:"M8", x:440,y:474,w:90,h:72,status:"available",type:"main",    price:10000000 },
  { id:"M1", label:"M1", x:130,y:552,w:90,h:72,status:"available",type:"main",    price:10000000 },
  { id:"M2", label:"M2", x:228,y:552,w:90,h:72,status:"available",type:"main",    price:10000000 },
  { id:"M3", label:"M3", x:342,y:552,w:90,h:72,status:"available",type:"main",    price:10000000 },
  { id:"M4", label:"M4", x:440,y:552,w:90,h:72,status:"available",type:"main",    price:10000000 },
  // Interview/Panel booths — P1-P4, memanjang VERTIKAL (2x4m real)
  // Kiri: P2 atas, P1 bawah
  { id:"P2",label:"P2",x:12,y:392,w:54,h:108,status:"interview",type:"interview",price:0 },
  { id:"P1",label:"P1",x:12,y:510,w:54,h:108,status:"interview",type:"interview",price:0 },
  // Kanan: P4 atas, P3 bawah
  { id:"P4",label:"P4",x:596,y:392,w:54,h:108,status:"interview",type:"interview",price:0 },
  { id:"P3",label:"P3",x:596,y:510,w:54,h:108,status:"interview",type:"interview",price:0 },
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
  const [tooltip, setTooltip] = useState<{ booth: BoothDef; x: number; y: number } | null>(null);

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
      {/* Instructions */}
      <div style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 10, padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.82rem", color: "#94a3b8", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
        <span style={{ flexShrink: 0 }}>💡</span>
        <span>Klik booth <strong style={{ color: "#14b8a6" }}>hijau</strong> untuk memilih. Klik lagi untuk membatalkan. Booth merah/oranye sudah dipesan.</span>
      </div>

      {/* SVG Map */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(20,184,166,0.15)", borderRadius: 12, padding: "1rem", overflow: "auto", position: "relative" }}>
        <svg viewBox="0 0 662 640" style={{ width: "100%", minWidth: 340, display: "block" }}>
          <rect x="0" y="0" width="662" height="640" fill="#0a1628" rx="8"/>
          <defs>
            <pattern id="grid2" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(20,184,166,0.04)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="662" height="640" fill="url(#grid2)" rx="8"/>

          {booths.map(booth => {
            const isSelected = selectedIds.includes(booth.id);
            const isHovered = hoveredId === booth.id;
            const clickable = booth.type !== "area" && booth.type !== "interview" &&
              (booth.status === "available" || isSelected);

            let fill = COLORS[booth.status].fill;
            let stroke = COLORS[booth.status].stroke;
            let strokeW = 1;

            if (isSelected) { fill = "#065f46"; stroke = "#10b981"; strokeW = 2.5; }
            else if (isHovered && clickable) { fill = "#0d9488"; stroke = "#5eead4"; strokeW = 2; }

            return (
              <g key={booth.id}
                onClick={() => handleClick(booth)}
                onMouseEnter={() => { if (clickable) setHoveredId(booth.id); }}
                onMouseLeave={() => { setHoveredId(null); }}
                style={{ cursor: clickable ? "pointer" : "default" }}
              >
                <rect x={booth.x} y={booth.y} width={booth.w} height={booth.h} rx="3"
                  fill={fill} stroke={stroke} strokeWidth={strokeW} opacity={0.92}/>

                {/* Selected checkmark */}
                {isSelected && (
                  <text x={booth.x + booth.w/2} y={booth.y + 14}
                    textAnchor="middle" fill="#10b981" fontSize="10" fontWeight="900">✓</text>
                )}

                <text x={booth.x + booth.w/2} y={booth.y + booth.h/2 + (isSelected ? 4 : 0)}
                  textAnchor="middle" dominantBaseline="central"
                  fill={COLORS[booth.status].text}
                  fontSize={booth.w > 70 ? 12 : booth.w > 40 ? 9 : 8}
                  fontWeight="700">
                  {booth.label}
                </text>
              </g>
            );
          })}

          {/* Separator: standard booths vs main booths */}
          <line x1="12" y1="378" x2="650" y2="378" stroke="rgba(212,160,23,0.3)" strokeWidth="1" strokeDasharray="6 3"/>
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
        {[
          { color: "#0f766e", border: "#14b8a6", label: "Tersedia" },
          { color: "#065f46", border: "#10b981", label: "Dipilih ✓" },
          { color: "#c2410c", border: "#f97316", label: "Reserved" },
          { color: "#991b1b", border: "#ef4444", label: "Booked" },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#94a3b8" }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: l.color, border: `1px solid ${l.border}` }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Selected summary */}
      {selectedBooths.length > 0 && (
        <div style={{ marginTop: "1rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 10, padding: "1rem" }}>
          <div style={{ fontSize: "0.8rem", color: "#6ee7b7", fontWeight: 600, marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Booth yang Dipilih ({selectedBooths.length} booth)
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
