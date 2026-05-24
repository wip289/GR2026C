import { Fragment } from "react";
import { trpc } from "@/lib/trpc";

// ── KOORDINAT PRESISI DARI BoothMapPicker.tsx (CorelDraw asli) ──
const SW = 51, SH = 36;
const cA=148, cB=241, cC=295, cD=452, cE=505, cF=598;
const r1=328, r2=367, r3=423, r4=462, r5=517, r6=556;
const MW=90, MH=75;
const mA=202, mB=295, mC=412, mD=505;
const mr1=622, mr2=739, mr3=816;
const pLx=91, pRx=651, PW=50;
const VW=800, VH=990;

const ALL_BOOTHS = [
  { id:"stage",    label:"STAGE",    x:241, y:205, w:316, h:60,  type:"area" },
  { id:"lounge",   label:"LOUNGE",   x:146, y:247, w:93,  h:41,  type:"area" },
  { id:"entrance", label:"ENTRANCE", x:294, y:932, w:211, h:44,  type:"area" },
  { id:"S37", label:"S37", x:560, y:267, w:36, h:36, type:"staff" },
  { id:"S38", label:"S38", x:600, y:267, w:49, h:36, type:"staff" },
  { id:"S36",label:"S36",x:cA,y:r1,w:SW,h:SH,type:"standard" },
  { id:"S35",label:"S35",x:cB,y:r1,w:SW,h:SH,type:"standard" },
  { id:"S34",label:"S34",x:cC,y:r1,w:SW,h:SH,type:"standard" },
  { id:"S33",label:"S33",x:cD,y:r1,w:SW,h:SH,type:"standard" },
  { id:"S32",label:"S32",x:cE,y:r1,w:SW,h:SH,type:"standard" },
  { id:"S31",label:"S31",x:cF,y:r1,w:SW,h:SH,type:"standard" },
  { id:"S25",label:"S25",x:cA,y:r2,w:SW,h:SH,type:"standard" },
  { id:"S26",label:"S26",x:cB,y:r2,w:SW,h:SH,type:"standard" },
  { id:"S27",label:"S27",x:cC,y:r2,w:SW,h:SH,type:"standard" },
  { id:"S28",label:"S28",x:cD,y:r2,w:SW,h:SH,type:"standard" },
  { id:"S29",label:"S29",x:cE,y:r2,w:SW,h:SH,type:"standard" },
  { id:"S30",label:"S30",x:cF,y:r2,w:SW,h:SH,type:"standard" },
  { id:"S24",label:"S24",x:cA,y:r3,w:SW,h:SH,type:"standard" },
  { id:"S23",label:"S23",x:cB,y:r3,w:SW,h:SH,type:"standard" },
  { id:"S22",label:"S22",x:cC,y:r3,w:SW,h:SH,type:"standard" },
  { id:"S21",label:"S21",x:cD,y:r3,w:SW,h:SH,type:"standard" },
  { id:"S20",label:"S20",x:cE,y:r3,w:SW,h:SH,type:"standard" },
  { id:"S19",label:"S19",x:cF,y:r3,w:SW,h:SH,type:"standard" },
  { id:"S13",label:"S13",x:cA,y:r4,w:SW,h:SH,type:"standard" },
  { id:"S14",label:"S14",x:cB,y:r4,w:SW,h:SH,type:"standard" },
  { id:"S15",label:"S15",x:cC,y:r4,w:SW,h:SH,type:"standard" },
  { id:"S16",label:"S16",x:cD,y:r4,w:SW,h:SH,type:"standard" },
  { id:"S17",label:"S17",x:cE,y:r4,w:SW,h:SH,type:"standard" },
  { id:"S18",label:"S18",x:cF,y:r4,w:SW,h:SH,type:"standard" },
  { id:"S12",label:"S12",x:cA,y:r5,w:SW,h:SH,type:"standard" },
  { id:"S11",label:"S11",x:cB,y:r5,w:SW,h:SH,type:"standard" },
  { id:"S10",label:"S10",x:cC,y:r5,w:SW,h:SH,type:"standard" },
  { id:"S9", label:"S9", x:cD,y:r5,w:SW,h:SH,type:"standard" },
  { id:"S8", label:"S8", x:cE,y:r5,w:SW,h:SH,type:"standard" },
  { id:"S7", label:"S7", x:cF,y:r5,w:SW,h:SH,type:"standard" },
  { id:"S1", label:"S1", x:cA,y:r6,w:SW,h:SH,type:"standard" },
  { id:"S2", label:"S2", x:cB,y:r6,w:SW,h:SH,type:"standard" },
  { id:"S3", label:"S3", x:cC,y:r6,w:SW,h:SH,type:"standard" },
  { id:"S4", label:"S4", x:cD,y:r6,w:SW,h:SH,type:"standard" },
  { id:"S5", label:"S5", x:cE,y:r6,w:SW,h:SH,type:"standard" },
  { id:"S6", label:"S6", x:cF,y:r6,w:SW,h:SH,type:"standard" },
  { id:"M9", label:"M9", x:mA,y:mr1,w:MW,h:MH,type:"main" },
  { id:"M10",label:"M10",x:mB,y:mr1,w:MW,h:MH,type:"main" },
  { id:"M11",label:"M11",x:mC,y:mr1,w:MW,h:MH,type:"main" },
  { id:"M12",label:"M12",x:mD,y:mr1,w:MW,h:MH,type:"main" },
  { id:"M5", label:"M5", x:mA,y:mr2,w:MW,h:MH,type:"main" },
  { id:"M6", label:"M6", x:mB,y:mr2,w:MW,h:MH,type:"main" },
  { id:"M7", label:"M7", x:mC,y:mr2,w:MW,h:MH,type:"main" },
  { id:"M8", label:"M8", x:mD,y:mr2,w:MW,h:MH,type:"main" },
  { id:"M1", label:"M1", x:mA,y:mr3,w:MW,h:MH,type:"main" },
  { id:"M2", label:"M2", x:mB,y:mr3,w:MW,h:MH,type:"main" },
  { id:"M3", label:"M3", x:mC,y:mr3,w:MW,h:MH,type:"main" },
  { id:"M4", label:"M4", x:mD,y:mr3,w:MW,h:MH,type:"main" },
  { id:"E2",label:"E2",x:pLx,y:661,w:PW,h:90, type:"extra" },
  { id:"E1",label:"E1",x:pLx,y:753,w:PW,h:138,type:"extra" },
  { id:"E4",label:"E4",x:pRx,y:661,w:PW,h:90, type:"extra" },
  { id:"E3",label:"E3",x:pRx,y:753,w:PW,h:138,type:"extra" },
];

// Booth disembunyikan sementara
const HIDDEN_BOOTHS = new Set(["S26","S27","S28","S29","S32","S33","S34","S35","M9","M12"]);

// Booth sponsor tetap (tidak dari DB)
const SPONSOR_BOOTHS: Record<string, string> = {
  M10: "Booth Sponsor",
  M11: "Booth Sponsor",
  S25: "Booth Sponsor",
  S30: "Booth Sponsor",
  S31: "Booth Sponsor",
  S36: "Booth Sponsor",
};

const TABLE_SECTIONS = [
  { label: "MAIN BOOTH — 5 × 5 m",     rows: Array.from({length:12},(_,i)=>({ no:i+1, id:`M${i+1}` })) },
  { label: "STANDARD BOOTH — 3 × 3 m", rows: Array.from({length:36},(_,i)=>({ no:i+1, id:`S${i+1}` })) },
  { label: "EXTRA BOOTH — 4 × 2 m",    rows: [{no:1,id:"E1"},{no:2,id:"E2"},{no:3,id:"E3"},{no:4,id:"E4"}] },
];

type Assignment = { company: string; status: "booked" | "sponsor" };
type AssignmentMap = Record<string, Assignment>;

function boothFill(id: string, type: string, asgn: AssignmentMap) {
  if (type==="area")  return { fill:"#c9a84c", stroke:"#9a7b2e" };
  if (type==="staff") return { fill:"#e2e8f0", stroke:"#94a3b8" };
  const a = asgn[id];
  if (!a) {
    if (type==="main" || type==="extra") return { fill:"#f0f4f8", stroke:"#94a3b8" };
    return { fill:"#f8fafc", stroke:"#cbd5e1" };
  }
  if (a.status==="booked")  return { fill:"#4ade80", stroke:"#16a34a" };
  if (a.status==="sponsor") return { fill:"#93c5fd", stroke:"#3b82f6" };
  return { fill:"#f8fafc", stroke:"#cbd5e1" };
}

function BoothLabel({ b, asgn }: { b: typeof ALL_BOOTHS[0]; asgn: AssignmentMap }) {
  const cx = b.x + b.w/2, cy = b.y + b.h/2;
  const a = asgn[b.id];

  if (b.type==="area")  return <text x={cx} y={cy+4} textAnchor="middle" fontSize={b.h>50?14:10} fill="#fff" fontWeight="bold">{b.label}</text>;
  if (b.type==="staff") return <text x={cx} y={cy+4} textAnchor="middle" fontSize="8" fill="#64748b">{b.label}</text>;

  const isLarge = b.type==="main" || b.type==="extra";
  if (!a) return <text x={cx} y={cy+4} textAnchor="middle" fontSize={isLarge?12:9} fill="#334155" fontWeight="600">{b.label}</text>;

  const words = a.company.split(" ");
  const half = Math.ceil(words.length/2);
  const lines = words.length>2 ? [words.slice(0,half).join(" "), words.slice(half).join(" ")] : [a.company];
  const fs = isLarge ? 8.5 : 7;
  const lh = isLarge ? 10 : 9;
  const totalH = lines.length * lh;
  const startY = cy - totalH/2 + lh/2;

  return (
    <g>
      <text x={cx} y={startY-lh} textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.7)">{b.label}</text>
      {lines.map((ln,i)=>(
        <text key={i} x={cx} y={startY+i*lh} textAnchor="middle" fontSize={fs} fill="#fff" fontWeight="bold">{ln}</text>
      ))}
    </g>
  );
}

export default function BoothMapReport() {
  // ── Ambil data dari DB ──
  const { data: employers = [], isLoading } = trpc.getAllEmployerBookings.useQuery();

  // ── Bangun assignment map dari data DB + sponsor tetap ──
  const asgn: AssignmentMap = { ...Object.fromEntries(
    Object.entries(SPONSOR_BOOTHS).map(([id, company]) => [id, { company, status: "sponsor" as const }])
  )};

  employers
    .filter((e: any) => e.status === "confirmed")
    .forEach((e: any) => {
      const booths: string[] = Array.isArray(e.selectedBooths)
        ? e.selectedBooths
        : (() => { try { return JSON.parse(e.selectedBooths || "[]"); } catch { return []; } })();
      booths.forEach((boothId: string) => {
        asgn[boothId] = { company: e.companyName, status: "booked" };
      });
    });

  const bookedN  = Object.values(asgn).filter(a=>a.status==="booked").length;
  const sponsorN = Object.values(asgn).filter(a=>a.status==="sponsor").length;
  const totalN   = 52 - HIDDEN_BOOTHS.size;
  const availN   = totalN - bookedN - sponsorN;
  const pct      = Math.round(((bookedN+sponsorN)/totalN)*100);
  const today    = new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"});

  if (isLoading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",fontFamily:"system-ui",color:"#64748b",fontSize:"14px"}}>
      Memuat data booth...
    </div>
  );

  return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",padding:"12px",background:"#f8fafc",minHeight:"100vh"}}>
      <style>{`
        @media print {
          .np{display:none!important}
          body,html{background:#fff!important;margin:0;padding:0}
          @page{size:A3 landscape;margin:7mm}
        }
        .tr:hover td{background:#dbeafe!important}
      `}</style>

      {/* HEADER */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"10px",paddingBottom:"8px",borderBottom:"3px solid #1d4ed8"}}>
        <div>
          <div style={{fontSize:"9px",letterSpacing:"2px",color:"#6b7280",marginBottom:"2px"}}>POLITEKNIK PARIWISATA NHI BANDUNG</div>
          <div style={{fontSize:"19px",fontWeight:"800",color:"#1e3a8a"}}>BOOTH GRAND RECRUITMENT 2026</div>
          <div style={{fontSize:"11px",color:"#64748b",marginTop:"1px"}}>Gedung Dome, NHI Bandung &nbsp;·&nbsp; 8–9 Juni 2026 &nbsp;·&nbsp; Data per {today}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          {[
            {l:"Terisi",  v:bookedN,  bg:"#dcfce7",c:"#166534"},
            {l:"Sponsor", v:sponsorN, bg:"#dbeafe", c:"#1e40af"},
            {l:"Kosong",  v:availN,   bg:"#f1f5f9", c:"#475569"},
            {l:"Terisi",  v:pct+"%",  bg:"#fef3c7", c:"#92400e"},
          ].map(s=>(
            <div key={s.l+s.v} style={{background:s.bg,borderRadius:"7px",padding:"4px 10px",textAlign:"center",minWidth:"50px"}}>
              <div style={{fontSize:"16px",fontWeight:"800",color:s.c,lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:"9px",color:s.c,opacity:.8,marginTop:"1px"}}>{s.l}</div>
            </div>
          ))}
          <button className="np" onClick={()=>window.print()}
            style={{background:"#1e3a8a",color:"#fff",border:"none",padding:"9px 16px",borderRadius:"7px",cursor:"pointer",fontSize:"13px",fontWeight:"700",marginLeft:"4px"}}>
            🖨 Print / PDF
          </button>
        </div>
      </div>

      {/* LEGEND */}
      <div className="np" style={{display:"flex",gap:"18px",marginBottom:"8px",fontSize:"10.5px"}}>
        {[
          {fill:"#4ade80",stroke:"#16a34a",label:"Terisi (confirmed)"},
          {fill:"#93c5fd",stroke:"#3b82f6",label:"Sponsor"},
          {fill:"#f8fafc",stroke:"#cbd5e1",label:"Tersedia"},
          {fill:"#c9a84c",stroke:"#9a7b2e",label:"Stage / Lounge"},
          {fill:"#e2e8f0",stroke:"#94a3b8",label:"Area Panitia"},
        ].map(l=>(
          <div key={l.label} style={{display:"flex",alignItems:"center",gap:"5px"}}>
            <svg width="13" height="13"><rect x="1" y="1" width="11" height="11" fill={l.fill} stroke={l.stroke} strokeWidth="1" rx="2"/></svg>
            <span style={{color:"#374151"}}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* MAIN LAYOUT */}
      <div style={{display:"flex",gap:"12px",alignItems:"flex-start"}}>

        {/* FLOOR PLAN */}
        <div style={{flex:"0 0 52%",background:"#fff",border:"1px solid #e2e8f0",borderRadius:"8px",padding:"8px"}}>
          <svg viewBox={`0 0 ${VW} ${VH}`} style={{width:"100%",height:"auto",display:"block"}}>
            <rect width={VW} height={VH} fill="#eef2f7" rx="4"/>
            <line x1="399" y1={r1-4} x2="399" y2={r6+SH+4} stroke="#c5cedb" strokeWidth="1.5" strokeDasharray="5 4"/>
            <text x="399" y={r3+SH/2+4} textAnchor="middle" fontSize="7" fill="#9aa8bb" fontStyle="italic">AISLE</text>
            <line x1="399" y1={mr1-4} x2="399" y2={mr3+MH+4} stroke="#c5cedb" strokeWidth="1.5" strokeDasharray="5 4"/>

            {ALL_BOOTHS.filter(b=>!HIDDEN_BOOTHS.has(b.id)).map(b=>{
              const c = boothFill(b.id, b.type, asgn);
              return (
                <g key={b.id}>
                  <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={c.fill} stroke={c.stroke}
                    strokeWidth={b.type==="main"||b.type==="extra"?1.5:1} rx="3"/>
                  <BoothLabel b={b} asgn={asgn}/>
                </g>
              );
            })}
            <polygon points={`399,${VH-6} 389,${VH-20} 409,${VH-20}`} fill="rgba(180,140,20,0.5)"/>
            <text x="692" y="14" textAnchor="end" fontSize="8" fill="#94a3b8">↑ N</text>
          </svg>
        </div>

        {/* TABLE */}
        <div style={{flex:1,background:"#fff",border:"1px solid #e2e8f0",borderRadius:"8px",overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:"10px"}}>
            <thead>
              <tr style={{background:"#1e3a8a"}}>
                {["No","Booth","Perusahaan","Ket."].map(h=>(
                  <th key={h} style={{padding:"6px 7px",color:"#fff",textAlign:"left",fontWeight:"700",fontSize:"10px",letterSpacing:".5px"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TABLE_SECTIONS.map(sec=>(
                <Fragment key={sec.label}>
                  <tr>
                    <td colSpan={4} style={{padding:"4px 7px",background:"#dbeafe",fontWeight:"700",fontSize:"9.5px",color:"#1e40af",letterSpacing:".3px"}}>
                      {sec.label}
                    </td>
                  </tr>
                  {sec.rows.filter(row=>!HIDDEN_BOOTHS.has(row.id)).map((row,idx)=>{
                    const a = asgn[row.id];
                    const isSpon = a?.status==="sponsor";
                    const rowBg = a?.status==="booked"?"#f0fdf4":isSpon?"#eff6ff":idx%2===0?"#fff":"#f9fafb";
                    return (
                      <tr key={row.id} className="tr" style={{background:rowBg}}>
                        <td style={{padding:"2.5px 7px",borderBottom:"1px solid #f1f5f9",color:"#94a3b8",width:"20px"}}>{row.no}</td>
                        <td style={{padding:"2.5px 7px",borderBottom:"1px solid #f1f5f9",fontWeight:"700",width:"34px",
                          color:isSpon?"#3b82f6":a?.status==="booked"?"#15803d":"#1e293b"}}>{row.id}</td>
                        <td style={{padding:"2.5px 7px",borderBottom:"1px solid #f1f5f9",
                          color:a?"#15803d":"#475569",fontWeight:a?"500":"400"}}>
                          {a ? a.company : ""}
                        </td>
                        <td style={{padding:"2.5px 7px",borderBottom:"1px solid #f1f5f9",
                          color:"#3b82f6",fontStyle:"italic",fontSize:"9px",whiteSpace:"nowrap"}}>
                          {isSpon ? "Booth untuk sponsor" : ""}
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
          <div style={{padding:"6px 8px",background:"#f8fafc",borderTop:"1px solid #e2e8f0",display:"flex",justifyContent:"space-between",fontSize:"9px",color:"#94a3b8"}}>
            <span>{bookedN+sponsorN} dari {totalN} booth terisi ({pct}%)</span>
            <span>Grand Recruitment 2026 · grandrecruitment.id</span>
          </div>
        </div>
      </div>
    </div>
  );
}
