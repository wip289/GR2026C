/**
 * FinanceDashboard — Panitia View
 * Menampilkan RAB yang sudah dikunci SuperAdmin
 * + checklist status per item + P&L real dari bookings
 */
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────
type ItemStatus = "ok" | "pending" | "delay" | "cancel" | "urgent" | "advise";

interface ChecklistItem {
  catId: string;
  itemId: string;
  status: ItemStatus;
  note: string;
}

const STATUS_CONFIG: Record<ItemStatus, { label: string; color: string; bg: string; emoji: string }> = {
  ok:      { label: "✓ OK",         color: "#14b8a6", bg: "rgba(20,184,166,0.12)",  emoji: "✅" },
  pending: { label: "Pending",       color: "#94a3b8", bg: "rgba(148,163,184,0.1)",  emoji: "⏳" },
  delay:   { label: "Delay",         color: "#f97316", bg: "rgba(249,115,22,0.12)",  emoji: "🟠" },
  cancel:  { label: "Cancel",        color: "#ef4444", bg: "rgba(239,68,68,0.12)",   emoji: "❌" },
  urgent:  { label: "URGENT!",       color: "#dc2626", bg: "rgba(220,38,38,0.15)",   emoji: "🚨" },
  advise:  { label: "Need Advise",   color: "#818cf8", bg: "rgba(129,140,248,0.12)", emoji: "💬" },
};

const fmt  = (n: number) => "Rp " + n.toLocaleString("id-ID");
const fmtS = (n: number) => {
  if (Math.abs(n) >= 1_000_000_000) return "Rp " + (n/1_000_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000_000)     return "Rp " + (n/1_000_000).toFixed(0) + "jt";
  return "Rp " + n.toLocaleString("id-ID");
};

// ── Helper ────────────────────────────────────────────────────
function catTotal(cat: any): number {
  return (cat.items || []).reduce((s: number, it: any) => s + (it.quantity||0)*(it.unitCost||0)*(it.frequency||1), 0);
}

// ── Status Badge ──────────────────────────────────────────────
function StatusBadge({ status, onClick }: { status: ItemStatus; onClick?: () => void }) {
  const c = STATUS_CONFIG[status];
  return (
    <button onClick={onClick} style={{
      background: c.bg, border: `1px solid ${c.color}50`,
      color: c.color, borderRadius: 20, padding: "0.22rem 0.7rem",
      fontSize: "0.72rem", fontWeight: 700, cursor: onClick ? "pointer" : "default",
      whiteSpace: "nowrap",
    }}>
      {c.emoji} {c.label}
    </button>
  );
}

// ── Status Picker ─────────────────────────────────────────────
function StatusPicker({ current, onChange, onClose }: {
  current: ItemStatus; onChange: (s: ItemStatus) => void; onClose: () => void;
}) {
  return (
    <div style={{ position: "absolute", zIndex: 50, top: "100%", right: 0, background: "#0d1f35", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.35rem", minWidth: 160, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
      {(Object.keys(STATUS_CONFIG) as ItemStatus[]).map(s => {
        const c = STATUS_CONFIG[s];
        return (
          <button key={s} onClick={() => { onChange(s); onClose(); }}
            style={{ background: current === s ? c.bg : "transparent", border: `1px solid ${current === s ? c.color + "50" : "transparent"}`, color: c.color, borderRadius: 8, padding: "0.4rem 0.85rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", textAlign: "left" }}>
            {c.emoji} {c.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function FinanceDashboard() {
  const [, navigate] = useLocation();
  const [tab, setTab]       = useState<"rab" | "pl" | "summary">("rab");
  const [picker, setPicker] = useState<string | null>(null); // "catId-itemId"
  const [checklist, setChecklist] = useState<Record<string, ChecklistItem>>({});
  const [notes, setNotes]   = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const configQuery    = trpc.event.getEventConfig.useQuery();
  const bookingsQuery  = trpc.event.getAllEmployerBookings.useQuery();
  const saveMutation   = trpc.event.saveEventConfig.useMutation({
    onSuccess: () => { setSaving(false); toast.success("Checklist disimpan!"); },
    onError:   () => { setSaving(false); toast.error("Gagal menyimpan"); },
  });

  // Parse RAB dari config
  const rab = useMemo(() => {
    const raw = (configQuery.data as any)?.rab_locked;
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }, [configQuery.data]);

  // Parse checklist dari config
  useMemo(() => {
    const raw = (configQuery.data as any)?.rab_checklist;
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setChecklist(parsed.items || {});
      setNotes(parsed.notes || {});
    } catch {}
  }, [configQuery.data]);

  // P&L real dari actual bookings
  const actualRevenue = useMemo(() => {
    const bookings = (bookingsQuery.data || []) as any[];
    const confirmed = bookings.filter(b => b.status === "confirmed");
    return confirmed.reduce((s, b) => s + parseFloat(b.totalAmount || "0"), 0);
  }, [bookingsQuery.data]);

  const totalBudget = useMemo(() => {
    if (!rab) return 0;
    const venueC = rab.venueIsFree ? 0 : (rab.venueCost || 0);
    const expC   = (rab.expenses || []).reduce((s: number, cat: any) => s + catTotal(cat), 0);
    const cont   = (expC + venueC) * ((rab.contingency || 0) / 100);
    return expC + venueC + cont;
  }, [rab]);

  const maxRevenue = useMemo(() => {
    if (!rab) return 0;
    const booth   = (rab.boothTypes || []).reduce((s: number, b: any) => s + b.quantity * b.sellingPrice, 0);
    const sponsor = (rab.sponsorTiers || []).reduce((s: number, t: any) => s + t.pricePerSponsor * t.expectedCount, 0);
    return booth + sponsor;
  }, [rab]);

  // Update checklist item
  const updateStatus = (catId: string, itemId: string, status: ItemStatus) => {
    const key = `${catId}-${itemId}`;
    const next = { ...checklist, [key]: { catId, itemId, status, note: notes[key] || "" } };
    setChecklist(next);
    // Auto-save
    setSaving(true);
    saveMutation.mutate({
      rab_checklist: JSON.stringify({ items: next, notes })
    });
  };

  const updateNote = (catId: string, itemId: string, note: string) => {
    const key = `${catId}-${itemId}`;
    setNotes(prev => ({ ...prev, [key]: note }));
  };

  const saveNotes = () => {
    setSaving(true);
    saveMutation.mutate({ rab_checklist: JSON.stringify({ items: checklist, notes }) });
  };

  const getStatus = (catId: string, itemId: string): ItemStatus =>
    checklist[`${catId}-${itemId}`]?.status || "pending";

  // Status summary count
  const statusCounts = useMemo(() => {
    const counts: Record<ItemStatus, number> = { ok:0, pending:0, delay:0, cancel:0, urgent:0, advise:0 };
    Object.values(checklist).forEach(c => counts[c.status] = (counts[c.status]||0)+1);
    return counts;
  }, [checklist]);

  // Style helpers
  const s = {
    page:  { minHeight:"100vh", background:"#0a1628", fontFamily:"system-ui, sans-serif", color:"#f1f5f9" } as React.CSSProperties,
    nav:   { background:"rgba(10,22,40,0.98)", backdropFilter:"blur(12px)", borderBottom:"1px solid rgba(20,184,166,0.2)", padding:"0 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", height:60, position:"sticky" as const, top:0, zIndex:50 },
    wrap:  { maxWidth:1100, margin:"0 auto", padding:"2rem 1.25rem" },
    card:  { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"1.5rem", marginBottom:"1.5rem" },
    tabBtn:(active:boolean, color?:string) => ({ padding:"0.55rem 1.25rem", borderRadius:8, border:"none", fontSize:"0.85rem", fontWeight:600, cursor:"pointer", background:active?(color||"#14b8a6"):"transparent", color:active?"#fff":"#64748b", transition:"all 0.2s" }) as React.CSSProperties,
  };

  if (configQuery.isLoading) return (
    <div style={{ ...s.page, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", color:"#475569" }}>
        <div style={{ fontSize:"2.5rem", marginBottom:"1rem" }}>⏳</div>
        <div>Memuat data keuangan...</div>
      </div>
    </div>
  );

  if (!rab) return (
    <div style={{ ...s.page, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", maxWidth:420, padding:"2rem" }}>
        <div style={{ fontSize:"3.5rem", marginBottom:"1rem" }}>🔓</div>
        <h2 style={{ fontSize:"1.5rem", fontWeight:800, marginBottom:"0.75rem", color:"#f1f5f9" }}>RAB Belum Dikunci</h2>
        <p style={{ color:"#64748b", lineHeight:1.7, marginBottom:"1.5rem" }}>
          SuperAdmin atau PM belum mengunci RAB dari Financial Planner. Setelah dikunci, laporan keuangan akan tampil di sini.
        </p>
        <div style={{ background:"rgba(212,160,23,0.08)", border:"1px solid rgba(212,160,23,0.2)", borderRadius:12, padding:"1rem", fontSize:"0.82rem", color:"#D4A017" }}>
          📍 Cara mengunci: Financial Planner → Dashboard → klik tombol <strong>"🔒 Kunci & Publikasi RAB"</strong>
        </div>
        <button onClick={() => navigate("/boss")} style={{ marginTop:"1.5rem", background:"transparent", border:"1px solid rgba(255,255,255,0.15)", color:"#64748b", borderRadius:8, padding:"0.6rem 1.25rem", fontSize:"0.85rem", cursor:"pointer" }}>
          ← Kembali ke Panel
        </button>
      </div>
    </div>
  );

  const lockedAt = rab.lockedAt ? new Date(rab.lockedAt).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";
  const pnl        = actualRevenue - totalBudget;
  const hasUrgent  = statusCounts.urgent > 0;

  return (
    <div style={s.page} onClick={() => picker && setPicker(null)}>
      {/* NAV */}
      <nav style={s.nav}>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height:32 }} />
          <div style={{ borderLeft:"1px solid rgba(255,255,255,0.1)", paddingLeft:"1rem" }}>
            <div style={{ fontSize:"0.85rem", fontWeight:700, color:"#14b8a6" }}>Dashboard Keuangan</div>
            <div style={{ fontSize:"0.7rem", color:"#475569" }}>{rab.eventName} · RAB dikunci {lockedAt}</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:"0.75rem", alignItems:"center" }}>
          {saving && <span style={{ fontSize:"0.75rem", color:"#14b8a6" }}>⏳ Menyimpan...</span>}
          {hasUrgent && (
            <div style={{ background:"rgba(220,38,38,0.15)", border:"1px solid rgba(220,38,38,0.4)", borderRadius:8, padding:"0.35rem 0.85rem", fontSize:"0.78rem", color:"#f87171", fontWeight:700, animation:"pulse 1.5s infinite" }}>
              🚨 {statusCounts.urgent} URGENT!
            </div>
          )}
          <button onClick={() => navigate("/boss")} style={{ background:"rgba(20,184,166,0.1)", border:"1px solid rgba(20,184,166,0.3)", color:"#14b8a6", borderRadius:8, padding:"0.4rem 0.9rem", fontSize:"0.8rem", fontWeight:600, cursor:"pointer" }}>
            ← Panel
          </button>
        </div>
      </nav>

      <div style={s.wrap}>
        {/* KPI Row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:"1rem", marginBottom:"2rem" }}>
          {[
            { label:"Total Anggaran (RAB)",  val:fmtS(totalBudget),    color:"#f97316", icon:"📋" },
            { label:"Pendapatan Actual",      val:fmtS(actualRevenue),  color:"#14b8a6", icon:"💰" },
            { label:"Max Revenue (100%)",     val:fmtS(maxRevenue),     color:"#818cf8", icon:"🎯" },
            { label:pnl>=0?"Surplus":"Defisit", val:fmtS(Math.abs(pnl)), color:pnl>=0?"#10b981":"#ef4444", icon:pnl>=0?"✅":"⚠️" },
          ].map(kpi => (
            <div key={kpi.label} style={{ background:`${kpi.color}08`, border:`1px solid ${kpi.color}25`, borderRadius:14, padding:"1.1rem 1.25rem" }}>
              <div style={{ fontSize:"1.1rem", marginBottom:"0.4rem" }}>{kpi.icon}</div>
              <div style={{ fontSize:"1.4rem", fontWeight:800, color:kpi.color, lineHeight:1 }}>{kpi.val}</div>
              <div style={{ fontSize:"0.72rem", color:"#64748b", marginTop:"0.3rem" }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Status overview */}
        <div style={s.card}>
          <div style={{ fontSize:"0.85rem", fontWeight:700, color:"#94a3b8", marginBottom:"1rem" }}>Ringkasan Status Checklist</div>
          <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap" }}>
            {(Object.keys(STATUS_CONFIG) as ItemStatus[]).map(st => {
              const c = STATUS_CONFIG[st];
              const cnt = statusCounts[st] || 0;
              return (
                <div key={st} style={{ background:c.bg, border:`1px solid ${c.color}40`, borderRadius:8, padding:"0.4rem 0.9rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
                  <span style={{ fontSize:"0.9rem" }}>{c.emoji}</span>
                  <span style={{ fontSize:"0.78rem", color:c.color, fontWeight:700 }}>{c.label}</span>
                  <span style={{ fontSize:"0.78rem", color:"#64748b", fontWeight:800 }}>{cnt}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tab navigation */}
        <div style={{ display:"flex", gap:"0.5rem", background:"rgba(255,255,255,0.03)", borderRadius:12, padding:"0.4rem", marginBottom:"1.75rem" }}>
          <button style={s.tabBtn(tab==="rab","#14b8a6")} onClick={() => setTab("rab")}>📋 RAB & Checklist</button>
          <button style={s.tabBtn(tab==="pl","#D4A017")}  onClick={() => setTab("pl")}>💰 P&L Aktual</button>
          <button style={s.tabBtn(tab==="summary","#818cf8")} onClick={() => setTab("summary")}>📊 Laporan</button>
        </div>

        {/* ── TAB: RAB & Checklist ── */}
        {tab === "rab" && (
          <div>
            <div style={{ background:"rgba(20,184,166,0.05)", border:"1px solid rgba(20,184,166,0.2)", borderRadius:12, padding:"1rem 1.25rem", marginBottom:"1.5rem", fontSize:"0.82rem", color:"#64748b", display:"flex", gap:"1rem", alignItems:"center", flexWrap:"wrap" }}>
              <span>🔒 RAB dikunci oleh <strong style={{ color:"#f1f5f9" }}>{rab.lockedBy || "SuperAdmin"}</strong> pada {lockedAt}</span>
              <span style={{ color:"#1e3a5f" }}>·</span>
              <span>Klik status per item untuk update. Perubahan tersimpan otomatis.</span>
            </div>

            {(rab.expenses || []).map((cat: any) => {
              const total = catTotal(cat);
              if (total === 0 && (!cat.items || cat.items.length === 0)) return null;
              return (
                <div key={cat.id} style={{ ...s.card, marginBottom:"1rem" }}>
                  {/* Category header */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem", paddingBottom:"0.75rem", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                    <div style={{ fontWeight:700, color:"#f1f5f9", fontSize:"0.95rem" }}>{cat.name}</div>
                    <div style={{ fontWeight:800, color:"#D4A017", fontSize:"1rem" }}>{fmt(total)}</div>
                  </div>

                  {/* Items */}
                  {(cat.items || []).map((item: any) => {
                    const sub = (item.quantity||0) * (item.unitCost||0) * (item.frequency||1);
                    const key = `${cat.id}-${item.id}`;
                    const st  = getStatus(cat.id, item.id);
                    const note = notes[key] || "";

                    return (
                      <div key={item.id} style={{ display:"flex", gap:"1rem", alignItems:"flex-start", padding:"0.75rem 0", borderBottom:"1px solid rgba(255,255,255,0.04)", flexWrap:"wrap" }}>
                        {/* Item info */}
                        <div style={{ flex:1, minWidth:180 }}>
                          <div style={{ fontWeight:600, color:"#cbd5e1", fontSize:"0.88rem" }}>{item.name}</div>
                          <div style={{ fontSize:"0.73rem", color:"#475569", marginTop:"0.15rem" }}>
                            {item.quantity} {item.unit} × {fmt(item.unitCost)}
                            {item.frequencyUnit === "day" ? ` × ${item.frequency} hari` : ""}
                            {" = "}<strong style={{ color:"#94a3b8" }}>{fmt(sub)}</strong>
                          </div>
                          {/* Note input */}
                          <input
                            value={note}
                            onChange={e => updateNote(cat.id, item.id, e.target.value)}
                            onBlur={saveNotes}
                            placeholder="Catatan... (opsional)"
                            style={{ marginTop:"0.4rem", width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:"0.3rem 0.6rem", fontSize:"0.72rem", color:"#94a3b8", outline:"none" }}
                          />
                        </div>

                        {/* Status picker */}
                        <div style={{ position:"relative", flexShrink:0 }} onClick={e => e.stopPropagation()}>
                          <StatusBadge status={st} onClick={() => setPicker(picker === key ? null : key)} />
                          {picker === key && (
                            <StatusPicker current={st} onChange={s => updateStatus(cat.id, item.id, s)} onClose={() => setPicker(null)} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Venue */}
            {!rab.venueIsFree && rab.venueCost > 0 && (
              <div style={s.card}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontWeight:700, color:"#f1f5f9" }}>Sewa Venue</div>
                    <div style={{ fontSize:"0.78rem", color:"#64748b", marginTop:"0.2rem" }}>Biaya sewa gedung/venue</div>
                  </div>
                  <div style={{ fontWeight:800, color:"#D4A017" }}>{fmt(rab.venueCost)}</div>
                </div>
              </div>
            )}

            {/* Total */}
            <div style={{ background:"rgba(212,160,23,0.06)", border:"1px solid rgba(212,160,23,0.2)", borderRadius:14, padding:"1.25rem 1.5rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:"0.75rem", color:"#D4A017", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em" }}>Total Anggaran (RAB)</div>
                <div style={{ fontSize:"0.73rem", color:"#64748b", marginTop:"0.2rem" }}>Termasuk kontingensi {rab.contingency}%</div>
              </div>
              <div style={{ fontSize:"1.75rem", fontWeight:800, color:"#D4A017" }}>{fmt(totalBudget)}</div>
            </div>
          </div>
        )}

        {/* ── TAB: P&L Aktual ── */}
        {tab === "pl" && (
          <div>
            {/* Revenue from confirmed bookings */}
            <div style={s.card}>
              <div style={{ fontSize:"0.95rem", fontWeight:700, color:"#14b8a6", marginBottom:"1.25rem" }}>💰 Pendapatan Booth (Confirmed)</div>
              {(bookingsQuery.data || []).filter((b:any) => b.status === "confirmed").length === 0 ? (
                <div style={{ textAlign:"center", padding:"2rem", color:"#334155", fontSize:"0.85rem" }}>Belum ada booking yang dikonfirmasi</div>
              ) : (
                <div>
                  {(bookingsQuery.data || []).filter((b:any) => b.status === "confirmed").map((b:any) => {
                    const booths = (() => { try { return typeof b.booths === "string" ? JSON.parse(b.booths) : (b.booths || []); } catch { return []; } })();
                    return (
                      <div key={b.bookingId} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.85rem 0", borderBottom:"1px solid rgba(255,255,255,0.05)", flexWrap:"wrap", gap:"0.5rem" }}>
                        <div>
                          <div style={{ fontWeight:700, color:"#f1f5f9", fontSize:"0.88rem" }}>{b.companyName}</div>
                          <div style={{ fontSize:"0.73rem", color:"#64748b" }}>
                            {b.bookingId} · {booths.map((bt:any) => bt.label).join(", ")}
                          </div>
                        </div>
                        <div style={{ fontWeight:800, color:"#14b8a6", fontSize:"1rem" }}>{fmt(parseFloat(b.totalAmount||"0"))}</div>
                      </div>
                    );
                  })}
                  <div style={{ display:"flex", justifyContent:"space-between", paddingTop:"0.85rem", fontWeight:800, fontSize:"1.05rem" }}>
                    <span>Total Pendapatan Actual</span>
                    <span style={{ color:"#14b8a6" }}>{fmt(actualRevenue)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Pending */}
            {(bookingsQuery.data || []).filter((b:any) => b.status === "pending").length > 0 && (
              <div style={{ ...s.card, borderColor:"rgba(249,115,22,0.25)" }}>
                <div style={{ fontSize:"0.88rem", fontWeight:700, color:"#f97316", marginBottom:"1rem" }}>⏳ Menunggu Konfirmasi Pembayaran</div>
                {(bookingsQuery.data || []).filter((b:any) => b.status === "pending").map((b:any) => (
                  <div key={b.bookingId} style={{ display:"flex", justifyContent:"space-between", padding:"0.65rem 0", borderBottom:"1px solid rgba(255,255,255,0.04)", flexWrap:"wrap", gap:"0.5rem" }}>
                    <div>
                      <div style={{ fontWeight:600, color:"#cbd5e1", fontSize:"0.85rem" }}>{b.companyName}</div>
                      <div style={{ fontSize:"0.72rem", color:"#64748b" }}>{b.bookingId}</div>
                    </div>
                    <div style={{ color:"#f97316", fontWeight:700 }}>{fmt(parseFloat(b.totalAmount||"0"))}</div>
                  </div>
                ))}
              </div>
            )}

            {/* P&L Box */}
            <div style={{ background: pnl >= 0 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border:`1px solid ${pnl>=0?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}`, borderRadius:16, padding:"1.5rem", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"1rem" }}>
              <div>
                <div style={{ fontSize:"0.75rem", color:pnl>=0?"#6ee7b7":"#f87171", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.3rem" }}>
                  {pnl >= 0 ? "Surplus Saat Ini" : "Defisit Saat Ini"}
                </div>
                <div style={{ fontSize:"2rem", fontWeight:800, color:pnl>=0?"#10b981":"#ef4444" }}>{fmtS(Math.abs(pnl))}</div>
                <div style={{ fontSize:"0.78rem", color:"#64748b", marginTop:"0.3rem" }}>Pendapatan actual vs total anggaran RAB</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:"0.75rem", color:"#64748b", marginBottom:"0.25rem" }}>Persentase coverage</div>
                <div style={{ fontSize:"1.5rem", fontWeight:800, color: actualRevenue/totalBudget >= 1 ? "#10b981" : "#f97316" }}>
                  {totalBudget > 0 ? ((actualRevenue/totalBudget)*100).toFixed(1) : 0}%
                </div>
                <div style={{ fontSize:"0.72rem", color:"#64748b" }}>dari total anggaran</div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Laporan ── */}
        {tab === "summary" && (
          <div>
            <div style={s.card}>
              <div style={{ fontSize:"0.95rem", fontWeight:700, color:"#818cf8", marginBottom:"1.5rem" }}>📊 Ringkasan Laporan Keuangan</div>

              {/* Progress bar anggaran */}
              <div style={{ marginBottom:"1.75rem" }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.82rem", color:"#64748b", marginBottom:"0.5rem" }}>
                  <span>Realisasi Pendapatan</span>
                  <span style={{ color:"#14b8a6", fontWeight:700 }}>{fmtS(actualRevenue)} / {fmtS(totalBudget)}</span>
                </div>
                <div style={{ height:12, background:"rgba(255,255,255,0.06)", borderRadius:6, overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:6, width:`${Math.min((actualRevenue/totalBudget)*100, 100)}%`, background:"linear-gradient(90deg,#0d9488,#14b8a6)", transition:"width 0.5s ease" }} />
                </div>
                <div style={{ fontSize:"0.72rem", color:"#475569", marginTop:"0.3rem" }}>
                  {totalBudget > 0 ? ((actualRevenue/totalBudget)*100).toFixed(1) : 0}% anggaran tercoverage dari pendapatan actual
                </div>
              </div>

              {/* Items dengan status bermasalah */}
              {statusCounts.urgent > 0 || statusCounts.delay > 0 || statusCounts.advise > 0 ? (
                <div>
                  <div style={{ fontSize:"0.82rem", fontWeight:700, color:"#f87171", marginBottom:"0.75rem" }}>⚠️ Item yang Perlu Perhatian</div>
                  {(rab.expenses || []).map((cat: any) =>
                    (cat.items || []).map((item: any) => {
                      const st = getStatus(cat.id, item.id);
                      if (!["urgent","delay","advise","cancel"].includes(st)) return null;
                      const note = notes[`${cat.id}-${item.id}`];
                      return (
                        <div key={item.id} style={{ display:"flex", gap:"1rem", alignItems:"center", padding:"0.65rem 0", borderBottom:"1px solid rgba(255,255,255,0.04)", flexWrap:"wrap" }}>
                          <StatusBadge status={st} />
                          <div style={{ flex:1 }}>
                            <span style={{ fontWeight:600, color:"#cbd5e1", fontSize:"0.85rem" }}>{item.name}</span>
                            <span style={{ fontSize:"0.72rem", color:"#475569", marginLeft:"0.5rem" }}>({cat.name})</span>
                            {note && <div style={{ fontSize:"0.72rem", color:"#64748b", marginTop:"0.15rem" }}>{note}</div>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div style={{ textAlign:"center", padding:"1.5rem", background:"rgba(16,185,129,0.06)", borderRadius:12 }}>
                  <div style={{ fontSize:"2rem", marginBottom:"0.5rem" }}>✅</div>
                  <div style={{ color:"#6ee7b7", fontWeight:700 }}>Tidak ada item bermasalah</div>
                </div>
              )}
            </div>

            {/* Kategori total */}
            <div style={s.card}>
              <div style={{ fontSize:"0.88rem", fontWeight:700, color:"#94a3b8", marginBottom:"1rem" }}>Anggaran per Kategori</div>
              {(rab.expenses || []).map((cat: any) => {
                const total = catTotal(cat);
                const pct   = totalBudget > 0 ? (total/totalBudget)*100 : 0;
                return (
                  <div key={cat.id} style={{ marginBottom:"0.85rem" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.82rem", color:"#cbd5e1", marginBottom:"0.3rem" }}>
                      <span>{cat.name}</span>
                      <span style={{ color:"#D4A017", fontWeight:700 }}>{fmtS(total)} <span style={{ color:"#475569", fontWeight:400 }}>({pct.toFixed(1)}%)</span></span>
                    </div>
                    <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ height:"100%", borderRadius:3, width:`${pct}%`, background:"linear-gradient(90deg,#D4A01760,#D4A017)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.6;}}`}</style>
    </div>
  );
}
