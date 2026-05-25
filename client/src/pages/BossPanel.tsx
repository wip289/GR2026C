import React, { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { openInvoiceForPrint, openKwitansiForPrint, getPaymentDeadline } from "@/lib/invoiceGenerator";
import { openCustomInvoice } from "@/lib/customInvoice";
import type { CustomInvoiceData } from "@/lib/customInvoice";
import { exportJobseekersCSV, exportEmployersCSV } from '@/lib/exportUtils';

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");
const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—";

type TabId = "overview" | "employer" | "jobseeker" | "interview" | "invoice";

const s = {
  page:  { minHeight: "100vh", background: "#0a1628", fontFamily: "system-ui, sans-serif", color: "#f1f5f9" } as React.CSSProperties,
  nav:   { background: "rgba(10,22,40,0.98)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(212,160,23,0.3)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky" as const, top: 0, zIndex: 50 },
  wrap:  { maxWidth: 1200, margin: "0 auto", padding: "2rem 1.25rem" },
  card:  { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" },
  tab:   (active: boolean) => ({ padding: "0.6rem 1.25rem", borderRadius: 8, border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, background: active ? "#D4A017" : "transparent", color: active ? "#fff" : "#64748b", transition: "all 0.2s", whiteSpace: "nowrap" as const }),
  badge: (color: string) => ({ display: "inline-block", padding: "0.2rem 0.65rem", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, background: `${color}20`, color, border: `1px solid ${color}40` }),
  th:    { padding: "0.75rem 1rem", textAlign: "left" as const, fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" as const },
  td:    { padding: "0.85rem 1rem", fontSize: "0.85rem", borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle" as const },
};

const SLOTS = ["08.00–09.00", "09.00–10.00", "10.00–11.00", "11.00–12.00", "13.00–14.00", "14.00–15.00", "15.00–16.00"];
const DAYS  = ["Rabu, 10 Juni", "Kamis, 11 Juni"];
// Hari pertama (day 0) dimulai jam 10.00 — skip slot idx 0 & 1
const getVisibleSlots = (day: number) =>
  SLOTS.map((label, idx) => ({ label, idx })).filter(s => day !== 0 || s.idx >= 2);
const INTERVIEW_BOOTHS = ["E1","E2","E3","E4","E5","E6","E7","E8","E9","E10","E11","E12","E13","E14"];


// ── Invoice Custom Tab ────────────────────────────────────────
function InvoiceCustomTab({ employers, openCustomInvoice }: {
  employers: any[];
  openCustomInvoice: (data: any) => void;
}) {
  const [mode, setMode] = React.useState<"select" | "manual">("select");
  const [selectedEmpId, setSelectedEmpId] = React.useState("");
  const [manualName, setManualName] = React.useState("");
  const [manualPic, setManualPic] = React.useState("");
  const [manualEmail, setManualEmail] = React.useState("");
  const [manualCity, setManualCity] = React.useState("");
  const [items, setItems] = React.useState([
    { description: "", qty: 1, unit: "paket", unitPrice: 0 }
  ]);
  const [discountAmount, setDiscountAmount] = React.useState("");
  const [discountNote, setDiscountNote] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [invoiceNo, setInvoiceNo] = React.useState(() => {
    const now = new Date();
    return "INV-GR26-" + String(now.getMonth()+1).padStart(2,"0") + String(now.getDate()).padStart(2,"0") + "-" + String(now.getHours()).padStart(2,"0") + String(now.getMinutes()).padStart(2,"0");
  });

  const selEmp = employers.find((e: any) => e.bookingId === selectedEmpId);
  const companyName = mode === "select" ? (selEmp?.companyName || "") : manualName;
  const picName     = mode === "select" ? (selEmp?.pic1Name || "") : manualPic;
  const picEmail    = mode === "select" ? (selEmp?.pic1Email || "") : manualEmail;
  const city        = mode === "select" ? (selEmp?.city || "") : manualCity;

  const addItem = () => setItems(prev => [...prev, { description: "", qty: 1, unit: "paket", unitPrice: 0 }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, val: string | number) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const disc = parseFloat(discountAmount) || 0;
  const grandTotal = subtotal - disc;
  const fmtRp = (n: number) => "Rp " + n.toLocaleString("id-ID");
  const canGenerate = companyName && picName && items.some(i => i.description && i.unitPrice > 0);

  const inp: React.CSSProperties = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 7, padding: "0.45rem 0.7rem", fontSize: "0.85rem", color: "#f1f5f9", outline: "none" };
  const lbl: React.CSSProperties = { fontSize: "0.72rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "0.3rem", display: "block" };
  const card: React.CSSProperties = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.25rem", marginBottom: "1rem" };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "0.25rem" }}>📝 Invoice Custom</div>
        <div style={{ fontSize: "0.82rem", color: "#64748b" }}>Buat invoice manual untuk kebutuhan di luar sistem — custom booth, sponsorship, dll.</div>
      </div>

      {/* No Invoice */}
      <div style={card}>
        <div style={{ fontSize: "0.72rem", color: "#14b8a6", fontWeight: 700, textTransform: "uppercase" as const, marginBottom: "1rem" }}>Nomor Invoice</div>
        <label style={lbl}>No. Invoice</label>
        <input style={inp} value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
      </div>

      {/* Perusahaan */}
      <div style={card}>
        <div style={{ fontSize: "0.72rem", color: "#14b8a6", fontWeight: 700, textTransform: "uppercase" as const, marginBottom: "1rem" }}>Data Perusahaan</div>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          {(["select", "manual"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ flex: 1, padding: "0.5rem", borderRadius: 8, border: "1px solid " + (mode === m ? "#14b8a6" : "rgba(255,255,255,0.1)"), background: mode === m ? "rgba(20,184,166,0.15)" : "transparent", color: mode === m ? "#14b8a6" : "#64748b", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
              {m === "select" ? "📋 Pilih dari daftar" : "✏️ Ketik manual"}
            </button>
          ))}
        </div>
        {mode === "select" ? (
          <div>
            <label style={lbl}>Pilih Employer</label>
            <select style={{ ...inp, appearance: "none" as const }} value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)}>
              <option value="">-- Pilih perusahaan --</option>
              {employers.map((e: any) => (
                <option key={e.bookingId} value={e.bookingId}>{e.companyName} ({e.bookingId})</option>
              ))}
            </select>
            {selEmp && (
              <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "rgba(20,184,166,0.05)", borderRadius: 8, fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.7 }}>
                PIC: <strong style={{ color: "#f1f5f9" }}>{selEmp.pic1Name}</strong> · {selEmp.pic1Email}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>Nama Perusahaan *</label>
              <input style={inp} value={manualName} onChange={e => setManualName(e.target.value)} placeholder="PT. Nama Perusahaan" />
            </div>
            <div><label style={lbl}>Nama PIC *</label><input style={inp} value={manualPic} onChange={e => setManualPic(e.target.value)} placeholder="Nama PIC" /></div>
            <div><label style={lbl}>Email PIC</label><input style={inp} value={manualEmail} onChange={e => setManualEmail(e.target.value)} placeholder="email@co.com" /></div>
            <div style={{ gridColumn: "1/-1" }}><label style={lbl}>Kota</label><input style={inp} value={manualCity} onChange={e => setManualCity(e.target.value)} placeholder="Bandung" /></div>
          </div>
        )}
      </div>

      {/* Items */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.72rem", color: "#14b8a6", fontWeight: 700, textTransform: "uppercase" as const }}>Item Invoice</div>
          <button onClick={addItem} style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.4)", color: "#14b8a6", borderRadius: 8, padding: "0.35rem 0.85rem", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>+ Tambah Baris</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 70px 110px 28px", gap: "0.4rem", marginBottom: "0.4rem" }}>
          {["Deskripsi Item", "Qty", "Satuan", "Harga Satuan", ""].map((h, i) => (
            <div key={i} style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" as const }}>{h}</div>
          ))}
        </div>
        {items.map((item, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 60px 70px 110px 28px", gap: "0.4rem", marginBottom: "0.4rem", alignItems: "center" }}>
            <input style={inp} value={item.description} onChange={e => updateItem(i, "description", e.target.value)} placeholder="Nama item / layanan" />
            <input style={{ ...inp, textAlign: "center" }} type="number" min="1" value={item.qty} onChange={e => updateItem(i, "qty", parseInt(e.target.value) || 1)} />
            <input style={inp} value={item.unit} onChange={e => updateItem(i, "unit", e.target.value)} placeholder="pkt" />
            <input style={{ ...inp, textAlign: "right" }} type="number" min="0" value={item.unitPrice || ""} onChange={e => updateItem(i, "unitPrice", parseInt(e.target.value) || 0)} placeholder="0" />
            <button onClick={() => removeItem(i)} disabled={items.length === 1}
              style={{ background: "none", border: "none", color: items.length === 1 ? "#334155" : "#f87171", cursor: items.length === 1 ? "default" : "pointer", fontSize: "1rem", padding: 0 }}>×</button>
          </div>
        ))}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "0.75rem", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1rem" }}>
          <span>Grand Total</span>
          <span style={{ color: "#D4A017" }}>{fmtRp(grandTotal)}</span>
        </div>
      </div>

      {/* Diskon & Catatan */}
      <div style={card}>
        <div style={{ fontSize: "0.72rem", color: "#14b8a6", fontWeight: 700, textTransform: "uppercase" as const, marginBottom: "1rem" }}>Diskon & Catatan</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div><label style={lbl}>Diskon (Rp)</label><input style={inp} type="number" min="0" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} placeholder="0" /></div>
          <div><label style={lbl}>Keterangan Diskon</label><input style={inp} value={discountNote} onChange={e => setDiscountNote(e.target.value)} placeholder="contoh: kontrak mitra" /></div>
        </div>
        <div><label style={lbl}>Catatan Tambahan</label>
          <textarea style={{ ...inp, minHeight: 64, resize: "vertical" as const }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan khusus yang akan muncul di invoice..." />
        </div>
      </div>

      {/* Generate */}
      <button onClick={() => canGenerate && openCustomInvoice({
        invoiceNo,
        invoiceDate: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
        companyName, picName, picEmail, city,
        items: items.filter(i => i.description && i.unitPrice > 0),
        discountAmount: disc > 0 ? disc : undefined,
        discountNote: discountNote || undefined,
        notes: notes || undefined,
      })}
        style={{ width: "100%", background: canGenerate ? "linear-gradient(135deg,#D4A017,#B8860B)" : "rgba(100,116,139,0.3)", border: "none", color: canGenerate ? "#fff" : "#64748b", borderRadius: 12, padding: "0.9rem", fontSize: "0.95rem", fontWeight: 800, cursor: canGenerate ? "pointer" : "not-allowed", marginBottom: "0.5rem" }}>
        📄 Generate & Download Invoice
      </button>
      {!canGenerate && <div style={{ fontSize: "0.75rem", color: "#64748b", textAlign: "center" as const }}>Lengkapi nama perusahaan, PIC, dan minimal 1 item dengan harga</div>}
    </div>
  );
}

export default function BossPanel() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedEmployer, setSelectedEmployer] = useState<string | null>(null);
  const [selectedJobseeker, setSelectedJobseeker] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [discountInput, setDiscountInput] = useState<Record<string, string>>({});
  const [discountNoteInput, setDiscountNoteInput] = useState<Record<string, string>>({});

  // ── Password gate ─────────────────────────────────────────────
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("panitia_auth") === "1");
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);

  // ── Real data from DB ──
  const { data: employerData, refetch: refetchEmployers } = trpc.event.getAllEmployerBookings.useQuery();
  const { data: jobseekerData } = trpc.event.getAllJobseekers.useQuery();
  const { data: interviewRaw, refetch: refetchInterview } = trpc.event.getAllInterviewBookings.useQuery();
  const updateStatusMutation = trpc.event.updateEmployerBookingStatus.useMutation({
    onSuccess: () => refetchEmployers(),
  });

  const approvePembayaranMutation = trpc.event.approvePembayaran.useMutation({
    onSuccess: () => {
      refetchEmployers();
      toast.success("Pembayaran diapprove! Kwitansi LUNAS tersedia di dashboard employer.");
    },
    onError: (e) => toast.error("Gagal approve: " + e.message),
  });

  const cancelSlotMutation = trpc.event.cancelInterviewBooking.useMutation({
    onSuccess: () => { toast.success("Slot berhasil dibatalkan"); refetchInterview(); },
    onError: (e) => toast.error("Gagal batalkan: " + e.message),
  });

  // ── Password gate render ──────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a1628", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(212,160,23,0.25)", borderRadius: 16, padding: "2.5rem 2rem", width: "100%", maxWidth: 380, textAlign: "center" }}>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 56, marginBottom: "1.25rem", objectFit: "contain" }} />
          <div style={{ color: "#D4A017", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.25rem" }}>Grand Recruitment 2026</div>
          <div style={{ color: "#94a3b8", fontSize: "0.82rem", marginBottom: "1.75rem" }}>Portal Panitia — akses terbatas</div>
          <input
            type="password"
            placeholder="Password panitia"
            value={pwInput}
            onChange={e => { setPwInput(e.target.value); setPwError(false); }}
            onKeyDown={e => { if (e.key === "Enter") { if (pwInput === "GR2026@Panitia") { sessionStorage.setItem("panitia_auth", "1"); setAuthed(true); } else { setPwError(true); } } }}
            style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${pwError ? "#f43f5e" : "rgba(255,255,255,0.12)"}`, borderRadius: 8, padding: "0.65rem 0.9rem", fontSize: "0.9rem", color: "#f1f5f9", outline: "none", boxSizing: "border-box" as const, marginBottom: "0.5rem" }}
          />
          {pwError && <div style={{ color: "#f43f5e", fontSize: "0.8rem", marginBottom: "0.75rem" }}>Password salah. Coba lagi.</div>}
          <button
            onClick={() => { if (pwInput === "GR2026@Panitia") { sessionStorage.setItem("panitia_auth", "1"); setAuthed(true); } else { setPwError(true); } }}
            style={{ width: "100%", background: "linear-gradient(135deg,#D4A017,#B8860B)", border: "none", color: "#fff", borderRadius: 8, padding: "0.65rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", marginTop: pwError ? 0 : "0.5rem" }}
          >
            Masuk
          </button>
        </div>
      </div>
    );
  }

  const employers = employerData || [];
  const jobseekers = jobseekerData || [];

  const totalRevenue = employers.filter((e: any) => e.status === "confirmed")
    .reduce((s: number, e: any) => s + parseFloat(e.totalAmount || 0), 0);
  const pendingRevenue = employers.filter((e: any) => e.status === "pending")
    .reduce((s: number, e: any) => s + parseFloat(e.totalAmount || 0), 0);
  const totalBooths = employers.reduce((s: number, e: any) => s + (Array.isArray(e.booths) ? e.booths.length : 0), 0);
  const bookedSlots = ((interviewRaw || []) as any[]).filter((b: any) => b.status === "active").length;

  const handleApprove = (bookingId: string) => {
    updateStatusMutation.mutate({ bookingId, status: "confirmed" });
    toast.success("Pembayaran dikonfirmasi!", { description: `Booking ${bookingId} sudah disetujui` });
  };
  const handleReject = (bookingId: string) => {
    updateStatusMutation.mutate({ bookingId, status: "rejected" });
    toast.error("Booking ditolak", { description: `Booking ${bookingId} telah ditolak` });
  };

  // Build real taken slots from DB
  const realTakenSlots: Record<string, string> = {};
  const realTakenIds: Record<string, number> = {};
  ((interviewRaw || []) as any[]).forEach((b: any) => {
    if (b.status === "active") {
      const key = `${b.boothId}-${b.day}-${b.slotIndex}`;
      realTakenSlots[key] = b.companyName || b.employerBookingId;
      realTakenIds[key] = b.id;
    }
  });

  const selEmp = selectedEmployer ? employers.find((e: any) => e.bookingId === selectedEmployer) : null;
  const selJS  = selectedJobseeker ? jobseekers.find((j: any) => j.registrationId === selectedJobseeker) : null;

  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={s.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 32 }} />
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: "1rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#D4A017" }}>Panel Panitia</div>
            <div style={{ fontSize: "0.7rem", color: "#475569" }}>Grand Recruitment 2026</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button onClick={() => navigate("/planner")} style={{ background: "linear-gradient(135deg,#D4A017,#B8860B)", border: "none", color: "#fff", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 0 12px rgba(212,160,23,0.3)" }}>
            📊 Financial Planner
          </button>
          <button onClick={() => navigate("/phase1")} style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.3)", color: "#14b8a6", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
            🏗️ Phase 1
          </button>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.82rem", cursor: "pointer" }}>
            🏠 Beranda
          </button>
        </div>
      </nav>

      <div style={s.wrap}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, marginBottom: "0.25rem" }}>Panel Panitia GR2026</h1>
          <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Kelola employer, jobseeker, dan operasional event</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "0.5rem", marginBottom: "1.5rem", overflowX: "auto" }}>
          {([
            { id: "overview" as TabId, label: "📊 Overview" },
            { id: "employer" as TabId, label: `🏢 Employer (${employers.length})` },
            { id: "jobseeker" as TabId, label: `🎓 Jobseeker (${jobseekers.length})` },
            { id: "interview" as TabId, label: "📅 Interview Slots" },
            { id: "invoice" as TabId, label: "📝 Invoice Custom" },
          ]).map(tab => (
            <button key={tab.id} style={s.tab(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div>
            {/* KPI */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,200px),1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              {[
                { label: "Revenue Confirmed", val: fmt(totalRevenue), color: "#14b8a6", icon: "💰" },
                { label: "Revenue Pending", val: fmt(pendingRevenue), color: "#f97316", icon: "⏳" },
                { label: "Total Employer", val: employers.length, color: "#D4A017", icon: "🏢" },
                { label: "Jobseeker Terdaftar", val: jobseekers.length, color: "#818cf8", icon: "🎓" },
                { label: "Booth Terjual", val: totalBooths, color: "#10b981", icon: "📦" },
                { label: "Slot Interview Terisi", val: bookedSlots, color: "#60a5fa", icon: "📅" },
              ].map(kpi => (
                <div key={kpi.label} style={{ background: `${kpi.color}08`, border: `1px solid ${kpi.color}25`, borderRadius: 14, padding: "1.25rem" }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{kpi.icon}</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: kpi.color }}>{kpi.val}</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.25rem" }}>{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Quick Access */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,200px),1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {[
                { icon: "✅", label: "Check-in & Counter", desc: "Hari H · Scan QR jobseeker & employer", link: "/checkin", color: "#60a5fa" },
                { icon: "🗺️", label: "Booth Management", desc: "Denah, rekap, special request", link: "/booth-management", color: "#D4A017" },
                { icon: "👥", label: "Manajemen Panitia", desc: "Struktur organisasi & divisi", link: "/panitia", color: "#818cf8" },
                { icon: "📋", label: "Generate Proposal", desc: "Proposal employer & sponsor", link: "/proposal", color: "#f97316" },
              ].map(item => (
                <div key={item.label} onClick={() => navigate(item.link)}
                  style={{ background: `${item.color}08`, border: `1px solid ${item.color}25`, borderRadius: 12, padding: "1rem", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = `${item.color}15`)}
                  onMouseLeave={e => (e.currentTarget.style.background = `${item.color}08`)}>
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, color: item.color, fontSize: "0.88rem" }}>{item.label}</div>
                  <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.2rem" }}>{item.desc}</div>
                </div>
              ))}
            </div>

            {/* Pending approvals */}
            <div style={s.card}>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#f97316", marginBottom: "1rem" }}>⏳ Menunggu Approval Pembayaran ({employers.filter(e => e.status === "pending").length})</div>
              {employers.filter(e => e.status === "pending").length === 0 ? (
                <p style={{ color: "#475569", fontSize: "0.85rem" }}>Tidak ada pembayaran yang menunggu approval.</p>
              ) : (
                employers.filter((e: any) => e.status === "pending").map((emp: any) => (
                  <div key={emp.bookingId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: 10, marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "#f1f5f9" }}>{emp.companyName}</div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b", fontFamily: "monospace" }}>{emp.bookingId}</div>
                      <div style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                        {Array.isArray(emp.booths) ? emp.booths.map((b: any) => `${b.label} (${b.type})`).join(", ") : "—"} · {fmt(parseFloat(emp.totalAmount || 0))}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => handleApprove(emp.bookingId)}
                        style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)", border: "none", color: "#fff", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                        ✅ Approve
                      </button>
                      <button onClick={() => handleReject(emp.bookingId)}
                        style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
                        ❌ Tolak
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,300px),1fr))", gap: "1rem" }}>
              <div style={s.card}>
                <div style={{ fontWeight: 700, color: "#14b8a6", marginBottom: "1rem", fontSize: "0.9rem" }}>Status Employer</div>
                {[
                  { label: "Confirmed", count: employers.filter((e:any)=>e.status==="confirmed").length, color: "#14b8a6" },
                  { label: "Pending", count: employers.filter((e:any)=>e.status==="pending").length, color: "#f97316" },
                  { label: "Rejected", count: employers.filter((e:any)=>e.status==="rejected").length, color: "#ef4444" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.85rem" }}>
                    <span style={{ color: "#94a3b8" }}>{item.label}</span>
                    <span style={{ fontWeight: 700, color: item.color }}>{item.count}</span>
                  </div>
                ))}
              </div>
              <div style={s.card}>
                <div style={{ fontWeight: 700, color: "#D4A017", marginBottom: "1rem", fontSize: "0.9rem" }}>Status Dokumen Jobseeker</div>
                {[
                  { label: "Dokumen Lengkap", count: jobseekers.filter((j:any)=>j.cvUrl&&j.fotoUrl&&j.ktmUrl).length, color: "#14b8a6" },
                  { label: "Dokumen Kurang", count: jobseekers.filter((j:any)=>!(j.cvUrl&&j.fotoUrl&&j.ktmUrl)).length, color: "#f97316" },
                  { label: "Consent Layer 2", count: jobseekers.filter((j:any)=>j.consent2).length, color: "#818cf8" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.85rem" }}>
                    <span style={{ color: "#94a3b8" }}>{item.label}</span>
                    <span style={{ fontWeight: 700, color: item.color }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rekap Staff ID Card */}
            {(() => {
              const allStaff = employers
                .filter((e: any) => e.status === "confirmed")
                .flatMap((e: any) => {
                  const members = Array.isArray(e.staffMembers) ? e.staffMembers as {nama:string;posisi:string}[] : [];
                  return members.map(st => ({ ...st, company: e.companyName, bookingId: e.bookingId }));
                });
              const confirmedWithBooth = employers.filter((e: any) => e.status === "confirmed");
              const totalQuota = confirmedWithBooth.reduce((sum: number, e: any) => {
                const booths = Array.isArray(e.booths) ? e.booths : [];
                const main = booths.filter((b: any) => b.type === "main").length;
                const std  = booths.filter((b: any) => b.type === "standard" || b.type === "extra").length;
                return sum + main * 4 + std * 2;
              }, 0);

              return (
                <div style={{ ...s.card, marginTop: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div style={{ fontWeight: 700, color: "#818cf8", fontSize: "0.9rem" }}>
                      🪪 Rekap Staff ID Card
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.8rem" }}>
                      <span style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)", borderRadius: 6, padding: "0.2rem 0.65rem", color: "#818cf8", fontWeight: 700 }}>
                        {allStaff.length} / {totalQuota} terdaftar
                      </span>
                      {allStaff.length > 0 && (
                        <button
                          onClick={() => {
                            const rows = allStaff.map((st, i) => `${i+1}\t${st.company}\t${st.nama}\t${st.posisi}`).join("\n");
                            const blob = new Blob([`No\tPerusahaan\tNama\tJabatan\n${rows}`], { type: "text/plain" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a"); a.href = url; a.download = "staff-idcard-gr2026.txt"; a.click();
                          }}
                          style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.3)", color: "#14b8a6", borderRadius: 6, padding: "0.2rem 0.75rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                          ⬇ Export
                        </button>
                      )}
                    </div>
                  </div>

                  {allStaff.length === 0 ? (
                    <p style={{ color: "#475569", fontSize: "0.85rem" }}>Belum ada employer yang mengisi data staff.</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
                        <thead>
                          <tr>
                            {["No", "Perusahaan", "Nama Staff", "Jabatan"].map(h => (
                              <th key={h} style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontSize: "0.72rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {allStaff.map((st, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              <td style={{ padding: "0.5rem 0.75rem", color: "#475569", width: "32px" }}>{i + 1}</td>
                              <td style={{ padding: "0.5rem 0.75rem", color: "#94a3b8", fontWeight: 600 }}>{st.company}</td>
                              <td style={{ padding: "0.5rem 0.75rem", color: "#f1f5f9", fontWeight: 700 }}>{st.nama}</td>
                              <td style={{ padding: "0.5rem 0.75rem", color: "#64748b" }}>{st.posisi}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Mini Denah Booth */}
            {(() => {
              // Koordinat dari BoothMapPicker (CorelDraw presisi)
              const SW=51,SH=36,MW=90,MH=75;
              const cA=148,cB=241,cC=295,cD=452,cE=505,cF=598;
              const r1=328,r2=367,r3=423,r4=462,r5=517,r6=556;
              const mA=202,mB=295,mC=412,mD=505;
              const mr1=622,mr2=739,mr3=816;
              const pLx=91,pRx=651,PW=50;

              const HIDDEN = new Set(["S26","S27","S28","S29","S32","S33","S34","S35","M9","M12"]);
              const SPONSOR: Record<string,string> = { M10:"Sponsor", M11:"Sponsor", S25:"Sponsor", S30:"Sponsor", S31:"Sponsor", S36:"Sponsor" };

              // Build assignment map dari DB
              const asgn: Record<string,{company:string;status:string}> = {};
              Object.entries(SPONSOR).forEach(([id,c]) => { asgn[id] = { company:c, status:"sponsor" }; });
              employers
                .filter((e:any) => e.status === "confirmed")
                .forEach((e:any) => {
                  const booths = Array.isArray(e.booths) ? e.booths : (() => { try { return JSON.parse(e.booths||"[]"); } catch { return []; } })();
                  booths.forEach((b:any) => {
                    asgn[b.id || b] = { company: e.companyName, status: "booked" };
                  });
                });

              const BOOTHS = [
                {id:"stage",  x:241,y:205,w:316,h:60, type:"area"},
                {id:"lounge", x:146,y:247,w:93, h:41, type:"area"},
                {id:"S37",x:560,y:267,w:36,h:36,type:"staff"},{id:"S38",x:600,y:267,w:49,h:36,type:"staff"},
                {id:"S36",x:cA,y:r1,w:SW,h:SH,type:"s"},{id:"S35",x:cB,y:r1,w:SW,h:SH,type:"s"},{id:"S34",x:cC,y:r1,w:SW,h:SH,type:"s"},{id:"S33",x:cD,y:r1,w:SW,h:SH,type:"s"},{id:"S32",x:cE,y:r1,w:SW,h:SH,type:"s"},{id:"S31",x:cF,y:r1,w:SW,h:SH,type:"s"},
                {id:"S25",x:cA,y:r2,w:SW,h:SH,type:"s"},{id:"S26",x:cB,y:r2,w:SW,h:SH,type:"s"},{id:"S27",x:cC,y:r2,w:SW,h:SH,type:"s"},{id:"S28",x:cD,y:r2,w:SW,h:SH,type:"s"},{id:"S29",x:cE,y:r2,w:SW,h:SH,type:"s"},{id:"S30",x:cF,y:r2,w:SW,h:SH,type:"s"},
                {id:"S24",x:cA,y:r3,w:SW,h:SH,type:"s"},{id:"S23",x:cB,y:r3,w:SW,h:SH,type:"s"},{id:"S22",x:cC,y:r3,w:SW,h:SH,type:"s"},{id:"S21",x:cD,y:r3,w:SW,h:SH,type:"s"},{id:"S20",x:cE,y:r3,w:SW,h:SH,type:"s"},{id:"S19",x:cF,y:r3,w:SW,h:SH,type:"s"},
                {id:"S13",x:cA,y:r4,w:SW,h:SH,type:"s"},{id:"S14",x:cB,y:r4,w:SW,h:SH,type:"s"},{id:"S15",x:cC,y:r4,w:SW,h:SH,type:"s"},{id:"S16",x:cD,y:r4,w:SW,h:SH,type:"s"},{id:"S17",x:cE,y:r4,w:SW,h:SH,type:"s"},{id:"S18",x:cF,y:r4,w:SW,h:SH,type:"s"},
                {id:"S12",x:cA,y:r5,w:SW,h:SH,type:"s"},{id:"S11",x:cB,y:r5,w:SW,h:SH,type:"s"},{id:"S10",x:cC,y:r5,w:SW,h:SH,type:"s"},{id:"S9",x:cD,y:r5,w:SW,h:SH,type:"s"},{id:"S8",x:cE,y:r5,w:SW,h:SH,type:"s"},{id:"S7",x:cF,y:r5,w:SW,h:SH,type:"s"},
                {id:"S1",x:cA,y:r6,w:SW,h:SH,type:"s"},{id:"S2",x:cB,y:r6,w:SW,h:SH,type:"s"},{id:"S3",x:cC,y:r6,w:SW,h:SH,type:"s"},{id:"S4",x:cD,y:r6,w:SW,h:SH,type:"s"},{id:"S5",x:cE,y:r6,w:SW,h:SH,type:"s"},{id:"S6",x:cF,y:r6,w:SW,h:SH,type:"s"},
                {id:"M9",x:mA,y:mr1,w:MW,h:MH,type:"m"},{id:"M10",x:mB,y:mr1,w:MW,h:MH,type:"m"},{id:"M11",x:mC,y:mr1,w:MW,h:MH,type:"m"},{id:"M12",x:mD,y:mr1,w:MW,h:MH,type:"m"},
                {id:"M5",x:mA,y:mr2,w:MW,h:MH,type:"m"},{id:"M6",x:mB,y:mr2,w:MW,h:MH,type:"m"},{id:"M7",x:mC,y:mr2,w:MW,h:MH,type:"m"},{id:"M8",x:mD,y:mr2,w:MW,h:MH,type:"m"},
                {id:"M1",x:mA,y:mr3,w:MW,h:MH,type:"m"},{id:"M2",x:mB,y:mr3,w:MW,h:MH,type:"m"},{id:"M3",x:mC,y:mr3,w:MW,h:MH,type:"m"},{id:"M4",x:mD,y:mr3,w:MW,h:MH,type:"m"},
                {id:"E2",x:pLx,y:661,w:PW,h:90,type:"e"},{id:"E1",x:pLx,y:753,w:PW,h:138,type:"e"},
                {id:"E4",x:pRx,y:661,w:PW,h:90,type:"e"},{id:"E3",x:pRx,y:753,w:PW,h:138,type:"e"},
              ];

              const getFill = (id:string, type:string) => {
                if(type==="area") return "#c9a84c";
                if(type==="staff") return "#2a3a52";
                const a = asgn[id];
                if(!a) return type==="m"||type==="e" ? "#1a2d45" : "#152235";
                return a.status==="booked" ? "#16a34a" : "#3b82f6";
              };
              const getStroke = (id:string, type:string) => {
                if(type==="area") return "#9a7b2e";
                if(type==="staff") return "#334155";
                const a = asgn[id];
                if(!a) return type==="m"||type==="e" ? "#1e3a5f" : "#1a3050";
                return a.status==="booked" ? "#4ade80" : "#93c5fd";
              };

              return (
                <div style={{ ...s.card, marginTop: "1rem" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem", flexWrap:"wrap", gap:"0.5rem" }}>
                    <div style={{ fontWeight:700, color:"#D4A017", fontSize:"0.9rem" }}>🗺️ Denah Booth — Realtime</div>
                    <button onClick={() => navigate("/boss/denah")}
                      style={{ background:"rgba(212,160,23,0.1)", border:"1px solid rgba(212,160,23,0.3)", color:"#D4A017", borderRadius:6, padding:"0.25rem 0.85rem", fontSize:"0.8rem", fontWeight:600, cursor:"pointer" }}>
                      🖨 Buka Full Report →
                    </button>
                  </div>

                  {/* Legend mini */}
                  <div style={{ display:"flex", gap:"1rem", marginBottom:"0.75rem", fontSize:"0.75rem", flexWrap:"wrap" }}>
                    {[{c:"#4ade80",l:"Terisi"},{c:"#3b82f6",l:"Sponsor"},{c:"#1a2d45",l:"Tersedia"},{c:"#c9a84c",l:"Stage/Lounge"}].map(lg=>(
                      <div key={lg.l} style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                        <div style={{ width:10, height:10, borderRadius:2, background:lg.c }}/>
                        <span style={{ color:"#64748b" }}>{lg.l}</span>
                      </div>
                    ))}
                  </div>

                  <svg viewBox="0 0 800 990" style={{ width:"100%", maxWidth:680, height:"auto", display:"block", margin:"0 auto" }}>
                    <rect width="800" height="990" fill="#0d1f35" rx="6"/>
                    {BOOTHS.filter(b=>!HIDDEN.has(b.id)).map(b => {
                      const a = asgn[b.id];
                      const cx = b.x + b.w/2, cy = b.y + b.h/2;
                      const isLarge = b.type==="m"||b.type==="e";
                      const words = a ? a.company.split(" ") : [];
                      const half = Math.ceil(words.length/2);
                      const lines = words.length>2 ? [words.slice(0,half).join(" "), words.slice(half).join(" ")] : words.length>0 ? [a!.company] : [];
                      const fs = isLarge ? 8 : 6.5;
                      const lh = isLarge ? 10 : 8;
                      const startY = cy - (lines.length*lh)/2 + lh/2;
                      return (
                        <g key={b.id}>
                          <rect x={b.x} y={b.y} width={b.w} height={b.h}
                            fill={getFill(b.id,b.type)} stroke={getStroke(b.id,b.type)}
                            strokeWidth={isLarge?1.5:1} rx="3"/>
                          {b.type==="area" ? (
                            <text x={cx} y={cy+4} textAnchor="middle" fontSize={b.h>50?12:9} fill="#fff" fontWeight="bold">{b.id.toUpperCase()}</text>
                          ) : b.type==="staff" ? (
                            <text x={cx} y={cy+4} textAnchor="middle" fontSize="7" fill="#475569">{b.id}</text>
                          ) : lines.length>0 ? (
                            <g>
                              <text x={cx} y={startY-lh} textAnchor="middle" fontSize="5.5" fill="rgba(255,255,255,0.5)">{b.id}</text>
                              {lines.map((ln,i)=>(
                                <text key={i} x={cx} y={startY+i*lh} textAnchor="middle" fontSize={fs} fill="#fff" fontWeight="bold">{ln}</text>
                              ))}
                            </g>
                          ) : (
                            <text x={cx} y={cy+4} textAnchor="middle" fontSize={isLarge?11:8} fill="#2a4a6a" fontWeight="600">{b.id}</text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── EMPLOYER ── */}
        {activeTab === "employer" && (
          <div style={{ display: "grid", gridTemplateColumns: selEmp ? "1fr 380px" : "1fr", gap: "1.5rem" }}>
            <div style={s.card}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
                  <button
                    onClick={() => exportEmployersCSV(employers)}
                    style={{
                      padding: "0.4rem 1rem",
                      background: "#16a34a",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                    }}
                  >
                    ⬇ Export Excel
                  </button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Perusahaan", "Booking ID", "Booth", "Total", "Bukti Bayar", "Status", "Aksi"].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {employers.map((emp: any) => (
                      <tr key={emp.bookingId} onClick={() => setSelectedEmployer(emp.bookingId === selectedEmployer ? null : emp.bookingId)}
                        style={{ cursor: "pointer", background: selectedEmployer === emp.bookingId ? "rgba(212,160,23,0.05)" : "transparent", transition: "background 0.15s" }}>
                        <td style={s.td}>
                          <div style={{ fontWeight: 700 }}>{emp.companyName}</div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{emp.pic1Name} · {emp.pic1Whatsapp}</div>
                        </td>
                        <td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.78rem", color: "#14b8a6" }}>{emp.bookingId}</td>
                        <td style={s.td}>
                          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                            {Array.isArray(emp.booths) ? emp.booths.map((b: any) => (
                              <span key={b.id} style={s.badge(b.type === "main" ? "#D4A017" : b.type === "extra" ? "#a78bfa" : "#14b8a6")}>{b.label}</span>
                            )) : (typeof emp.booths === "string" ? JSON.parse(emp.booths) : []).map((b: any) => (
                              <span key={b.id} style={s.badge(b.type === "main" ? "#D4A017" : b.type === "extra" ? "#a78bfa" : "#14b8a6")}>{b.label}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{ ...s.td, fontWeight: 700, color: "#D4A017" }}>{fmt(parseFloat(emp.totalAmount || 0))}</td>
                        <td style={s.td}>
                          {emp.buktiPaymentUrl ? (
                            <a href={emp.buktiPaymentUrl} target="_blank" rel="noreferrer"
                              style={{ fontSize: "0.75rem", color: "#14b8a6", textDecoration: "none", fontWeight: 700 }}>✅ Ada</a>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>— Belum</span>
                          )}
                        </td>
                        <td style={s.td}>
                          <span style={s.badge(emp.status === "confirmed" ? "#14b8a6" : emp.status === "rejected" ? "#ef4444" : "#f97316")}>
                            {emp.status === "confirmed" ? "Confirmed" : emp.status === "rejected" ? "Rejected" : "Pending"}
                          </span>
                        </td>
                        <td style={s.td}>
                          {emp.status === "pending" && (
                            <div style={{ display: "flex", gap: "0.4rem" }}>
                              <button onClick={e => { e.stopPropagation(); handleApprove(emp.bookingId); }}
                                style={{ background: "#0d9488", border: "none", color: "#fff", borderRadius: 6, padding: "0.3rem 0.65rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>✅</button>
                              <button onClick={e => { e.stopPropagation(); handleReject(emp.bookingId); }}
                                style={{ background: "transparent", border: "1px solid #ef444460", color: "#f87171", borderRadius: 6, padding: "0.3rem 0.65rem", fontSize: "0.75rem", cursor: "pointer" }}>❌</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detail panel */}
            {selEmp && (
              <div style={{ ...s.card, position: "sticky" as const, top: 76, alignSelf: "start" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <div style={{ fontWeight: 700, color: "#D4A017" }}>Detail Employer</div>
                  <button onClick={() => setSelectedEmployer(null)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1.2rem" }}>×</button>
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.25rem" }}>{selEmp.companyName}</div>
                <div style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#14b8a6", marginBottom: "1rem" }}>{selEmp.bookingId}</div>

                {[
                  { label: "PIC", val: `${selEmp.pic1Name} · ${selEmp.pic1Whatsapp}` },
                  { label: "Email", val: selEmp.pic1Email },
                  { label: "Industri", val: selEmp.industry || "—" },
                  { label: "Kota", val: selEmp.city || "—" },
                  { label: "Status", val: selEmp.status },
                  { label: "Terdaftar", val: fmtDate(selEmp.createdAt) },
                ].map(item => (
                  <div key={item.label} style={{ marginBottom: "0.6rem" }}>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</div>
                    <div style={{ fontSize: "0.88rem", color: "#f1f5f9", fontWeight: 600 }}>{item.val}</div>
                  </div>
                ))}

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", marginTop: "0.5rem" }}>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Booth</div>
                  {Array.isArray(selEmp.booths) && selEmp.booths.map((b: any) => (
                    <div key={b.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                      <span style={{ color: "#94a3b8" }}>Booth {b.label} ({b.type === "main" ? "Main" : "Standard"})</span>
                      <span style={{ color: "#D4A017", fontWeight: 700 }}>{fmt(b.price || 0)}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.75rem", marginTop: "0.5rem", fontWeight: 800 }}>
                    <span>Total</span>
                    <span style={{ color: "#D4A017" }}>{fmt(parseFloat(selEmp.totalAmount || 0))}</span>
                  </div>
                </div>

                {/* Bukti bayar info */}
                <div style={{ marginTop: "1rem", padding: "0.75rem", background: "rgba(255,255,255,0.02)", borderRadius: 8, fontSize: "0.82rem" }}>
                  <div style={{ color: "#64748b", marginBottom: "0.25rem" }}>Bukti Pembayaran</div>
                  {selEmp.buktiPaymentUrl ? (
                    <a href={selEmp.buktiPaymentUrl} target="_blank" rel="noreferrer" style={{ color: "#14b8a6", fontWeight: 700 }}>✅ Sudah upload → Lihat file</a>
                  ) : (
                    <span style={{ color: "#f97316" }}>⏳ Belum upload</span>
                  )}
                </div>

                {/* Staff ID Card */}
                <div style={{ marginTop: "1rem", padding: "0.75rem", background: "rgba(129,140,248,0.04)", border: "1px solid rgba(129,140,248,0.15)", borderRadius: 8 }}>
                  <div style={{ fontSize: "0.72rem", color: "#818cf8", textTransform: "uppercase" as const, letterSpacing: "0.05em", fontWeight: 700, marginBottom: "0.5rem" }}>
                    🪪 Staff ID Card
                  </div>
                  {(() => {
                    const staff = Array.isArray(selEmp.staffMembers) ? selEmp.staffMembers as {nama:string;posisi:string}[] : [];
                    if (staff.length === 0) return <div style={{ fontSize: "0.8rem", color: "#475569" }}>Belum ada data staff</div>;
                    return staff.map((st, i) => (
                      <div key={i} style={{ fontSize: "0.82rem", padding: "0.3rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{st.nama}</span>
                        <span style={{ color: "#64748b", marginLeft: "0.5rem" }}>— {st.posisi}</span>
                      </div>
                    ));
                  })()}
                </div>

                {selEmp.status === "pending" && (
                  <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column" as const, gap: "0.5rem" }}>
                    <button
                      onClick={() => { approvePembayaranMutation.mutate({ bookingId: selEmp.bookingId }); }}
                      style={{ background: "linear-gradient(135deg,#059669,#10b981)", border: "none", color: "#fff", borderRadius: 10, padding: "0.75rem", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer" }}>
                      🏅 Approve Pembayaran + Kwitansi LUNAS
                    </button>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => handleApprove(selEmp.bookingId)}
                        style={{ flex: 1, background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.4)", color: "#14b8a6", borderRadius: 10, padding: "0.65rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
                        ✅ Approve (tanpa kwitansi)
                      </button>
                      <button onClick={() => handleReject(selEmp.bookingId)}
                        style={{ flex: 1, background: "transparent", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", borderRadius: 10, padding: "0.65rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
                        ❌ Tolak
                      </button>
                    </div>
                  </div>
                )}

                {selEmp.status === "confirmed" && (() => {
                  const booths = Array.isArray(selEmp.booths) ? selEmp.booths : [];
                  const boothSubtotal = booths.reduce((s: number, b: any) => s + (b.price || 0), 0);
                  const dbTotal = parseFloat(selEmp.totalAmount || "0");
                  const facilityTotal = Math.max(0, dbTotal - boothSubtotal);
                  const disc = parseFloat(discountInput[selEmp.bookingId] || "0") || 0;
                  const discNote = discountNoteInput[selEmp.bookingId] || "";
                  const bookingDataBase = {
                    bookingId: selEmp.bookingId,
                    bookingDate: fmtDate(selEmp.createdAt),
                    companyName: selEmp.companyName,
                    industry: selEmp.industry || "",
                    city: selEmp.city || "",
                    pic1: { name: selEmp.pic1Name || "", title: selEmp.pic1Title || "", email: selEmp.pic1Email || "", whatsapp: selEmp.pic1Whatsapp || "" },
                    positions: Array.isArray(selEmp.positions) ? selEmp.positions : [],
                    booths: booths.map((b: any) => ({ boothId: b.id, label: b.label, type: b.type, price: b.price || 0 })),
                    needsBoothDesign: selEmp.needsBoothDesign || false,
                    specialRequest: selEmp.specialRequest || "",
                    totalAmount: boothSubtotal,
                    facilityTotal: facilityTotal > 0 ? facilityTotal : undefined,
                    exhibitorOrder: selEmp.exhibitorOrder || undefined,
                    paymentDeadline: getPaymentDeadline(),
                    discountAmount: disc > 0 ? disc : undefined,
                    discountNote: discNote || undefined,
                    lunasStamp: true,
                    lunasDate: fmtDate(selEmp.updatedAt),
                  };
                  return (
                    <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column" as const, gap: "0.5rem" }}>

                      {/* Diskon input */}
                      <div style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 8, padding: "0.75rem" }}>
                        <div style={{ fontSize: "0.72rem", color: "#14b8a6", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                          🏷️ Diskon (opsional)
                        </div>
                        <input
                          type="number"
                          placeholder="Nominal diskon (Rp)"
                          value={discountInput[selEmp.bookingId] || ""}
                          onChange={e => setDiscountInput(prev => ({ ...prev, [selEmp.bookingId]: e.target.value }))}
                          style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, padding: "0.45rem 0.7rem", fontSize: "0.85rem", color: "#f1f5f9", outline: "none", marginBottom: "0.4rem" }}
                        />
                        <input
                          type="text"
                          placeholder="Keterangan diskon (contoh: kontrak mitra)"
                          value={discountNoteInput[selEmp.bookingId] || ""}
                          onChange={e => setDiscountNoteInput(prev => ({ ...prev, [selEmp.bookingId]: e.target.value }))}
                          style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, padding: "0.45rem 0.7rem", fontSize: "0.85rem", color: "#f1f5f9", outline: "none" }}
                        />
                      </div>

                      {/* Download Invoice */}
                      <button
                        onClick={() => openInvoiceForPrint(bookingDataBase)}
                        style={{ width: "100%", background: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.4)", color: "#D4A017", borderRadius: 10, padding: "0.7rem", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>
                        📄 Download Invoice (LUNAS)
                      </button>

                      {/* Download Kwitansi */}
                      <button
                        onClick={() => openKwitansiForPrint(bookingDataBase)}
                        style={{ width: "100%", background: "linear-gradient(135deg,#059669,#10b981)", border: "none", color: "#fff", borderRadius: 10, padding: "0.7rem", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>
                        🧾 Download Kwitansi Pembayaran
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── JOBSEEKER ── */}
        {activeTab === "jobseeker" && (
          <div style={{ display: "grid", gridTemplateColumns: selJS ? "1fr 360px" : "1fr", gap: "1.5rem" }}>
            <div style={s.card}>
  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
    <button
      onClick={() => exportJobseekersCSV(jobseekers)}
      style={{
        padding: "0.4rem 1rem",
        background: "#16a34a",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "0.85rem",
        fontWeight: 600,
      }}
    >
      ⬇ Export Excel
    </button>
  </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Nama", "ID", "Status", "Institusi", "Dokumen", "Consent"].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jobseekers.map((js: any) => {
                      const docsOk = js.fotoUrl && js.cvUrl && js.ktmUrl;
                      return (
                        <tr key={js.registrationId} onClick={() => setSelectedJobseeker(js.registrationId === selectedJobseeker ? null : js.registrationId)}
                          style={{ cursor: "pointer", background: selectedJobseeker === js.id ? "rgba(212,160,23,0.05)" : "transparent", transition: "background 0.15s" }}>
                          <td style={s.td}>
                            <div style={{ fontWeight: 700 }}>{js.namaLengkap}</div>
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{js.whatsapp}</div>
                          </td>
                          <td style={{ ...s.td, fontFamily: "monospace", fontSize: "0.78rem", color: "#D4A017" }}>{js.registrationId}</td>
                          <td style={s.td}>
                            <span style={s.badge(js.status === "alumni_nhi" ? "#14b8a6" : js.status === "mahasiswa" ? "#818cf8" : js.status === "fresh_graduate" ? "#10b981" : "#94a3b8")}>
                              {js.status === "alumni_nhi" ? "Alumni NHI" : js.status === "mahasiswa" ? "Mahasiswa" : js.status === "fresh_graduate" ? "Fresh Grad" : "Umum"}
                            </span>
                          </td>
                          <td style={{ ...s.td, fontSize: "0.8rem", color: "#94a3b8", maxWidth: 160 }}>{js.institusi}</td>
                          <td style={s.td}>
                            <span style={s.badge(docsOk ? "#14b8a6" : "#f97316")}>
                              {docsOk ? "✓ Lengkap" : "⚠ Kurang"}
                            </span>
                          </td>
                          <td style={s.td}>
                            <div style={{ fontSize: "0.78rem" }}>
                              <span style={{ color: js.consent1 ? "#14b8a6" : "#ef4444" }}>{js.consent1 ? "✓" : "✗"} L1 </span>
                              <span style={{ color: js.consent2 ? "#818cf8" : "#64748b" }}>{js.consent2 ? "✓" : "—"} L2</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Jobseeker detail */}
            {selJS && (
              <div style={{ ...s.card, position: "sticky" as const, top: 76, alignSelf: "start" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <div style={{ fontWeight: 700, color: "#D4A017" }}>Detail Jobseeker</div>
                  <button onClick={() => setSelectedJobseeker(null)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1.2rem" }}>×</button>
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.25rem" }}>{selJS.namaLengkap}</div>
                <div style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#D4A017", marginBottom: "1rem" }}>{selJS.registrationId}</div>

                {[
                  { label: "Email", val: selJS.email },
                  { label: "WhatsApp", val: selJS.whatsapp },
                  { label: "Status", val: selJS.status },
                  { label: "Institusi", val: selJS.institusi },
                  { label: "Jurusan", val: selJS.jurusan },
                  { label: "Bidang Minat", val: selJS.bidangMinat },
                  { label: "Terdaftar", val: fmtDate(selJS.createdAt) },
                ].map(item => (
                  <div key={item.label} style={{ marginBottom: "0.6rem" }}>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</div>
                    <div style={{ fontSize: "0.88rem", color: "#f1f5f9", fontWeight: 600 }}>{item.val}</div>
                  </div>
                ))}

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", marginTop: "0.5rem" }}>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Dokumen</div>
                  {[
                    { label: "Pas Foto",   url: selJS.fotoUrl },
                    { label: "CV",         url: selJS.cvUrl },
                    { label: "KTP/KTM",   url: selJS.ktmUrl },
                    { label: "Sertifikat", url: selJS.sertifikatUrl },
                  ].map(doc => (
                    <div key={doc.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem", marginBottom: "0.5rem" }}>
                      <span style={{ color: "#94a3b8" }}>{doc.label}</span>
                      {doc.url ? (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer"
                          style={{ color: "#14b8a6", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          👁️ Lihat →
                        </a>
                      ) : (
                        <span style={{ color: "#334155" }}>— Belum</span>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", marginTop: "0.5rem" }}>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Consent (UU PDP)</div>
                  <div style={{ fontSize: "0.85rem", marginBottom: "0.35rem", color: selJS.consent1 ? "#14b8a6" : "#ef4444" }}>
                    {selJS.consent1 ? "✅" : "❌"} Layer 1 — Employer offline
                  </div>
                  <div style={{ fontSize: "0.85rem", color: selJS.consent2 ? "#818cf8" : "#475569" }}>
                    {selJS.consent2 ? "✅" : "⬜"} Layer 2 — Employer online
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── INTERVIEW SLOTS ── */}
        {activeTab === "interview" && (
          <div style={s.card}>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#60a5fa", marginBottom: "1rem" }}>📅 Rekapitulasi Slot Interview</div>

            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
              {DAYS.map((day, i) => (
                <button key={i} onClick={() => setSelectedDay(i)}
                  style={{ padding: "0.6rem 1.25rem", borderRadius: 10, border: `2px solid ${selectedDay === i ? "#60a5fa" : "rgba(255,255,255,0.08)"}`, background: selectedDay === i ? "rgba(96,165,250,0.1)" : "transparent", color: selectedDay === i ? "#60a5fa" : "#64748b", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
                  {day}
                </button>
              ))}
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={s.th}>Booth</th>
                    {getVisibleSlots(selectedDay).map(sl => <th key={sl.label} style={{ ...s.th, textAlign: "center" }}>{sl.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {INTERVIEW_BOOTHS.map(booth => (
                    <tr key={booth}>
                      <td style={{ ...s.td, fontWeight: 700, color: "#60a5fa" }}>{booth}</td>
                      {getVisibleSlots(selectedDay).map(sl => {
                        const slotIdx = sl.idx;
                        const key = `${booth}-${selectedDay}-${slotIdx}`;
                        const company = realTakenSlots[key];
                        const bookingId = realTakenIds[key];
                        return (
                          <td key={slotIdx} style={{ ...s.td, textAlign: "center" }}>
                            {company ? (
                              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "0.2rem 0.35rem", fontSize: "0.65rem", color: "#fca5a5", lineHeight: 1.3, display: "flex", alignItems: "center", gap: "0.2rem", minWidth: 0 }}>
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                                  {company.replace(/^(PT|CV|UD)\s*/i, "").substring(0, 10)}
                                </span>
                                <button
                                  onClick={() => {
                                    if (!bookingId) return;
                                    if (!window.confirm(`Batalkan slot ${company}?`)) return;
                                    cancelSlotMutation.mutate({ id: bookingId });
                                  }}
                                  title={`Batalkan: ${company}`}
                                  style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "0.85rem", padding: 0, lineHeight: 1, flexShrink: 0, fontWeight: 700 }}>
                                  ×
                                </button>
                              </div>
                            ) : (
                              <div style={{ color: "#1e3a5f", fontSize: "1rem" }}>·</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "#64748b" }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }} />
                Terisi ({Object.keys(realTakenSlots).filter(k => {
                  const parts = k.split("-");
                  const slotIdx = parseInt(parts[parts.length - 1]);
                  return k.includes(`-${selectedDay}-`) && getVisibleSlots(selectedDay).some(s => s.idx === slotIdx);
                }).length} slot)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "#64748b" }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: "#1e3a5f" }} />
                Kosong ({INTERVIEW_BOOTHS.length * getVisibleSlots(selectedDay).length - Object.keys(realTakenSlots).filter(k => {
                  const parts = k.split("-");
                  const slotIdx = parseInt(parts[parts.length - 1]);
                  return k.includes(`-${selectedDay}-`) && getVisibleSlots(selectedDay).some(s => s.idx === slotIdx);
                }).length} slot)
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: INVOICE CUSTOM ── */}
        {activeTab === "invoice" && (
          <InvoiceCustomTab employers={employers} openCustomInvoice={openCustomInvoice} />
        )}
      </div>
    </div>
  );
}
