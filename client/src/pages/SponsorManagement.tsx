import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// ── Types ─────────────────────────────────────────────────────
interface Sponsor {
  id: number;
  companyName: string;
  industry: string;
  picName: string;
  picPhone: string;
  picEmail: string;
  package: "platinum" | "gold" | "silver" | "custom" | "inkind";
  boothType: "with_booth" | "supporting_only";
  amount: number;
  inkindDesc: string;
  inkindValue: number;
  status: "prospek" | "dikontak" | "tertarik" | "konfirmasi" | "lunas";
  notes: string;
}

interface Prospect {
  id: number;
  companyName: string;
  industry: string;
  picName: string;
  picPhone: string;
  status: "potensial" | "dikontak" | "tertarik" | "konfirmasi" | "hadir";
  notes: string;
}

// ── Constants ─────────────────────────────────────────────────
const PKG_CONFIG = {
  platinum: { label: "Platinum", color: "#B8860B", bg: "#fffbeb", border: "#D4A017", price: 25000000, desc: "Main Sponsor" },
  gold:     { label: "Gold",     color: "#D97706", bg: "#fff7ed", border: "#F59E0B", price: 15000000, desc: "Premium Sponsor" },
  silver:   { label: "Silver",   color: "#64748b", bg: "#f8fafc", border: "#94a3b8", price: 7500000,  desc: "Supporting Sponsor" },
  custom:   { label: "Custom",   color: "#5b21b6", bg: "#f5f3ff", border: "#818cf8", price: 0,        desc: "Customized Package" },
  inkind:   { label: "In-Kind",  color: "#0d9488", bg: "#f0fdfa", border: "#14b8a6", price: 0,        desc: "Non-financial" },
};

const STATUS_SPONSOR = {
  prospek:    { label: "Prospek",    color: "#64748b", bg: "#f8fafc",  border: "#cbd5e1" },
  dikontak:   { label: "Dikontak",   color: "#2563eb", bg: "#eff6ff",  border: "#93c5fd" },
  tertarik:   { label: "Tertarik",   color: "#c2410c", bg: "#fff7ed",  border: "#fdba74" },
  konfirmasi: { label: "Konfirmasi", color: "#6d28d9", bg: "#f5f3ff",  border: "#c4b5fd" },
  lunas:      { label: "Lunas ✓",    color: "#0d9488", bg: "#f0fdfa",  border: "#5eead4" },
};

const STATUS_PROSPECT = {
  potensial:  { label: "Potensial",  color: "#64748b" },
  dikontak:   { label: "Dikontak",   color: "#2563eb" },
  tertarik:   { label: "Tertarik",   color: "#c2410c" },
  konfirmasi: { label: "Konfirmasi", color: "#6d28d9" },
  hadir:      { label: "Hadir ✓",    color: "#0d9488" },
};

const INDUSTRIES = ["Hotel & Resort","Restaurant & F&B","Travel & Tour","MICE","Cruise","Spa & Wellness","Airline","Education","Technology","Banking","Others"];

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

type TabId = "sponsor" | "prospek" | "summary";

const EMPTY_SPONSOR: Omit<Sponsor, "id"> = {
  companyName: "", industry: "", picName: "", picPhone: "", picEmail: "",
  package: "gold", boothType: "supporting_only", amount: 0,
  inkindDesc: "", inkindValue: 0, status: "prospek", notes: "",
};

const EMPTY_PROSPECT: Omit<Prospect, "id"> = {
  companyName: "", industry: "", picName: "", picPhone: "",
  status: "potensial", notes: "",
};

function toSponsor(raw: any): Sponsor {
  return {
    id: raw.id,
    companyName: raw.companyName ?? "",
    industry: raw.industry ?? "",
    picName: raw.picName ?? "",
    picPhone: raw.picPhone ?? "",
    picEmail: raw.picEmail ?? "",
    package: raw.package ?? "silver",
    boothType: raw.boothType ?? "supporting_only",
    amount: parseFloat(raw.amount ?? "0"),
    inkindDesc: raw.inkindDesc ?? "",
    inkindValue: parseFloat(raw.inkindValue ?? "0"),
    status: raw.status ?? "prospek",
    notes: raw.notes ?? "",
  };
}

function toProspect(raw: any): Prospect {
  return {
    id: raw.id,
    companyName: raw.companyName ?? "",
    industry: raw.industry ?? "",
    picName: raw.picName ?? "",
    picPhone: raw.picPhone ?? "",
    status: raw.status ?? "potensial",
    notes: raw.notes ?? "",
  };
}

export default function SponsorManagement() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<TabId>("sponsor");
  const [showAddSponsor, setShowAddSponsor] = useState(false);
  const [showAddProspect, setShowAddProspect] = useState(false);
  const [editSponsor, setEditSponsor] = useState<Sponsor | null>(null);
  const [form, setForm] = useState<Omit<Sponsor,"id">>(EMPTY_SPONSOR);
  const [proForm, setProForm] = useState<Omit<Prospect,"id">>(EMPTY_PROSPECT);

  // ── Queries ──────────────────────────────────────────────────
  const { data: sponsorsRaw = [] } = trpc.event.getAllSponsors.useQuery();
  const { data: prospectsRaw = [] } = trpc.event.getAllProspects.useQuery();
  const sponsors: Sponsor[] = (sponsorsRaw as any[]).map(toSponsor);
  const prospects: Prospect[] = (prospectsRaw as any[]).map(toProspect);

  // ── Mutations ────────────────────────────────────────────────
  const createSponsorMut = trpc.event.createSponsor.useMutation({
    onSuccess: () => { utils.event.getAllSponsors.invalidate(); toast.success("Sponsor berhasil ditambahkan!"); },
    onError: () => toast.error("Gagal menyimpan sponsor"),
  });
  const updateSponsorMut = trpc.event.updateSponsor.useMutation({
    onSuccess: () => { utils.event.getAllSponsors.invalidate(); toast.success("Data sponsor diperbarui!"); },
    onError: () => toast.error("Gagal memperbarui sponsor"),
  });
  const deleteSponsorMut = trpc.event.deleteSponsor.useMutation({
    onSuccess: () => { utils.event.getAllSponsors.invalidate(); toast.success("Sponsor dihapus"); },
  });
  const createProspectMut = trpc.event.createProspect.useMutation({
    onSuccess: () => { utils.event.getAllProspects.invalidate(); toast.success("Prospek employer ditambahkan!"); },
    onError: () => toast.error("Gagal menyimpan prospek"),
  });
  const updateProspectStatusMut = trpc.event.updateProspectStatus.useMutation({
    onSuccess: () => utils.event.getAllProspects.invalidate(),
  });
  const deleteProspectMut = trpc.event.deleteProspect.useMutation({
    onSuccess: () => { utils.event.getAllProspects.invalidate(); toast.success("Dihapus"); },
  });

  const upd  = (k: keyof typeof form,    v: any) => setForm(p => ({ ...p, [k]: v }));
  const updP = (k: keyof typeof proForm, v: any) => setProForm(p => ({ ...p, [k]: v }));

  // ── Calculations ─────────────────────────────────────────────
  const confirmed    = sponsors.filter(sp => sp.status === "konfirmasi" || sp.status === "lunas");
  const totalCash    = confirmed.reduce((s, sp) => s + (sp.amount || 0), 0);
  const totalInkind  = confirmed.reduce((s, sp) => s + (sp.inkindValue || 0), 0);
  const totalValue   = totalCash + totalInkind;
  const targetTotal  = 25000000 + 15000000 + 7500000;
  const progress     = targetTotal ? Math.min(100, (totalValue / targetTotal) * 100) : 0;

  const saveSponsor = () => {
    if (!form.companyName) { toast.error("Nama perusahaan wajib diisi"); return; }
    if (editSponsor) {
      updateSponsorMut.mutate({ id: editSponsor.id, ...form });
      setEditSponsor(null);
    } else {
      createSponsorMut.mutate(form);
    }
    setForm(EMPTY_SPONSOR);
    setShowAddSponsor(false);
  };

  const saveProspect = () => {
    if (!proForm.companyName) { toast.error("Nama perusahaan wajib diisi"); return; }
    createProspectMut.mutate(proForm);
    setProForm(EMPTY_PROSPECT);
    setShowAddProspect(false);
  };

  // ── Shared field styles (light theme) ────────────────────────
  const inp: React.CSSProperties = {
    width: "100%", background: "#f8fafc", border: "1.5px solid #e2e8f0",
    borderRadius: 8, padding: "0.65rem 1rem", fontSize: "0.88rem",
    color: "#1e293b", outline: "none", fontFamily: "inherit",
  };
  const sel: React.CSSProperties = {
    ...inp, cursor: "pointer", appearance: "none" as any,
  };
  const lbl: React.CSSProperties = {
    display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#64748b",
    marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.07em",
  };
  const card: React.CSSProperties = {
    background: "#fff", border: "1px solid #e8edf2", borderRadius: 14,
    padding: "1.5rem", marginBottom: "1.25rem",
    boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
  };

  // ── Sponsor form (reused for add & edit) ─────────────────────
  const SponsorForm = () => (
    <div style={{ ...card, borderTop: "3px solid #0d9488", marginBottom: "1.5rem", background: "#fafffe" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(13,148,136,0.1)", border: "1.5px solid rgba(13,148,136,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
          {editSponsor ? "✏️" : "➕"}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: "#0d9488", fontSize: "0.95rem" }}>
            {editSponsor ? "Edit Data Sponsor" : "Tambah Sponsor Baru"}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 1 }}>
            Isi informasi sponsor dan detail kontribusi
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "1rem", marginBottom: "1rem" }}>
        <div>
          <label style={lbl}>Nama Perusahaan *</label>
          <input style={inp} value={form.companyName} onChange={e => upd("companyName", e.target.value)} placeholder="PT Santika Hotels"/>
        </div>
        <div>
          <label style={lbl}>Bidang Bisnis</label>
          <select style={sel} value={form.industry} onChange={e => upd("industry", e.target.value)}>
            <option value="">— Pilih —</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Paket Sponsorship *</label>
          <select style={sel} value={form.package} onChange={e => upd("package", e.target.value as any)}>
            {Object.entries(PKG_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label} — {v.desc}{v.price > 0 ? ` (${fmt(v.price)})` : ""}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={lbl}>Tipe Kehadiran *</label>
          <select style={sel} value={form.boothType} onChange={e => upd("boothType", e.target.value as any)}>
            <option value="with_booth">Dengan Booth (hadir fisik)</option>
            <option value="supporting_only">Supporting Only (tidak hadir)</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Nilai Kontribusi (Rp)</label>
          <input style={inp} type="number" value={form.amount || ""} onChange={e => upd("amount", parseFloat(e.target.value) || 0)} placeholder="25000000"/>
          {form.amount > 0 && (
            <div style={{ fontSize: "0.72rem", color: "#0d9488", marginTop: "0.3rem", fontWeight: 700 }}>{fmt(form.amount)}</div>
          )}
        </div>
        <div>
          <label style={lbl}>Status Pipeline</label>
          <select style={sel} value={form.status} onChange={e => upd("status", e.target.value as any)}>
            {Object.entries(STATUS_SPONSOR).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Nama PIC</label>
          <input style={inp} value={form.picName} onChange={e => upd("picName", e.target.value)} placeholder="Budi Santoso"/>
        </div>
        <div>
          <label style={lbl}>No. HP / WhatsApp</label>
          <input style={inp} value={form.picPhone} onChange={e => upd("picPhone", e.target.value)} placeholder="0812-xxx-xxxx"/>
        </div>
      </div>

      {form.package === "inkind" && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem", padding: "1rem", background: "rgba(13,148,136,0.04)", borderRadius: 10, border: "1px solid rgba(13,148,136,0.12)" }}>
          <div>
            <label style={lbl}>Deskripsi In-Kind</label>
            <input style={inp} value={form.inkindDesc} onChange={e => upd("inkindDesc", e.target.value)} placeholder="Konsumsi 200 pax, goodie bag, dll"/>
          </div>
          <div>
            <label style={lbl}>Estimasi Nilai (Rp)</label>
            <input style={inp} type="number" value={form.inkindValue || ""} onChange={e => upd("inkindValue", parseFloat(e.target.value) || 0)}/>
          </div>
        </div>
      )}

      <div style={{ marginBottom: "1.25rem" }}>
        <label style={lbl}>Catatan Internal</label>
        <input style={inp} value={form.notes} onChange={e => upd("notes", e.target.value)} placeholder="Sudah kirim proposal, menunggu balasan..."/>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
        <button onClick={saveSponsor}
          style={{ background: "linear-gradient(135deg,#0d9488,#0f766e)", border: "none", color: "#fff", borderRadius: 8, padding: "0.65rem 1.75rem", fontWeight: 700, cursor: "pointer", fontSize: "0.88rem", boxShadow: "0 2px 8px rgba(13,148,136,0.28)" }}>
          {editSponsor ? "Simpan Perubahan" : "Tambah Sponsor"}
        </button>
        <button onClick={() => { setShowAddSponsor(false); setEditSponsor(null); setForm(EMPTY_SPONSOR); }}
          style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#64748b", borderRadius: 8, padding: "0.65rem 1.25rem", cursor: "pointer", fontWeight: 600, fontSize: "0.88rem" }}>
          Batal
        </button>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Inter', system-ui, sans-serif", color: "#1e293b" }}>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav style={{ background: "#0a1628", borderBottom: "3px solid #D4A017", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky" as const, top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 32 }}/>
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.12)", paddingLeft: "1rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#D4A017", letterSpacing: "0.02em" }}>Manajemen Sponsorship</div>
            <div style={{ fontSize: "0.65rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>Grand Recruitment 2026</div>
          </div>
        </div>
        <button onClick={() => navigate("/boss")}
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#94a3b8", borderRadius: 8, padding: "0.45rem 1rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
          ← Panel Panitia
        </button>
      </nav>

      {/* ── HERO HEADER ─────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #0a1628 0%, #0a2a26 100%)", padding: "2rem 1.5rem 1.75rem", borderBottom: "1px solid rgba(13,148,136,0.18)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem", marginBottom: "1.5rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(212,160,23,0.12)", border: "1.5px solid rgba(212,160,23,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>🤝</div>
                <div>
                  <h1 style={{ fontSize: "clamp(1.3rem,2.5vw,1.75rem)", fontWeight: 800, color: "#f1f5f9", margin: 0, letterSpacing: "-0.02em" }}>
                    Manajemen Sponsorship
                  </h1>
                  <p style={{ color: "#475569", fontSize: "0.8rem", margin: "3px 0 0", fontWeight: 400 }}>
                    Kelola sponsor &amp; prospek employer · Grand Recruitment 2026
                  </p>
                </div>
              </div>
            </div>
            {/* Headline stats */}
            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              {[
                { label: "Total Sponsor",  val: sponsors.length,       color: "#D4A017" },
                { label: "Confirmed",      val: confirmed.length,      color: "#14b8a6" },
                { label: "Total Nilai",    val: fmt(totalValue),        color: "#f1f5f9" },
              ].map(k => (
                <div key={k.label} style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.val}</div>
                  <div style={{ fontSize: "0.63rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 3 }}>{k.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.45rem" }}>
              <span style={{ color: "#475569", fontWeight: 500 }}>Progress vs Target Sponsorship</span>
              <span style={{ color: "#D4A017", fontWeight: 700 }}>{fmt(totalValue)} / {fmt(targetTotal)} · {Math.round(progress)}%</span>
            </div>
            <div style={{ height: 7, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #0d9488, #D4A017)", borderRadius: 99, transition: "width 0.6s ease" }}/>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.75rem 1.25rem" }}>

        {/* ── KPI CARDS ────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(165px,1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
          {[
            { label: "Total Sponsor",   val: sponsors.length,   sub: `${sponsors.filter(s => s.status === "lunas").length} lunas`,                color: "#D4A017", icon: "🤝" },
            { label: "Konfirmasi",      val: confirmed.length,  sub: "konfirmasi + lunas",                                                       color: "#0d9488", icon: "✅" },
            { label: "Revenue Cash",    val: fmt(totalCash),    sub: "dari sponsor confirmed",                                                    color: "#0f766e", icon: "💰" },
            { label: "In-Kind Value",   val: fmt(totalInkind),  sub: "estimasi nilai in-kind",                                                   color: "#B8860B", icon: "📦" },
            { label: "Prospek Employer",val: prospects.length,  sub: `${prospects.filter(p => p.status === "hadir").length} hadir`,              color: "#2563eb", icon: "🎯" },
          ].map(k => (
            <div key={k.label} style={{ ...card, borderTop: `3px solid ${k.color}`, padding: "1.2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1.3 }}>{k.label}</div>
                <span style={{ fontSize: "1rem" }}>{k.icon}</span>
              </div>
              <div style={{ fontSize: typeof k.val === "number" ? "2rem" : "1rem", fontWeight: 800, color: k.color, lineHeight: 1.1, marginBottom: "0.3rem" }}>{k.val}</div>
              <div style={{ fontSize: "0.67rem", color: "#94a3b8" }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ── TABS ─────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: "0.25rem", background: "#fff", border: "1px solid #e8edf2", borderRadius: 12, padding: "0.35rem", marginBottom: "1.75rem", width: "fit-content", boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}>
          {([
            { id: "sponsor" as TabId,  label: "🤝 Sponsor",          count: sponsors.length },
            { id: "prospek" as TabId,  label: "🎯 Prospek Employer", count: prospects.length },
            { id: "summary" as TabId,  label: "📊 Ringkasan",        count: null },
          ]).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ padding: "0.55rem 1.15rem", borderRadius: 8, border: "none", cursor: "pointer", fontSize: "0.84rem", fontWeight: 600, whiteSpace: "nowrap" as const, transition: "all 0.15s", background: activeTab === t.id ? "#0d9488" : "transparent", color: activeTab === t.id ? "#fff" : "#64748b" }}>
              {t.label}
              {t.count !== null && (
                <span style={{ marginLeft: 6, fontSize: "0.7rem", background: activeTab === t.id ? "rgba(255,255,255,0.2)" : "#f1f5f9", color: activeTab === t.id ? "#fff" : "#64748b", borderRadius: 20, padding: "0.1rem 0.45rem", fontWeight: 700 }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB: SPONSOR ─────────────────────────────────── */}
        {activeTab === "sponsor" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
              <button onClick={() => { setShowAddSponsor(true); setEditSponsor(null); setForm(EMPTY_SPONSOR); }}
                style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)", border: "none", color: "#fff", borderRadius: 9, padding: "0.65rem 1.5rem", fontWeight: 700, cursor: "pointer", fontSize: "0.88rem", boxShadow: "0 2px 10px rgba(13,148,136,0.3)" }}>
                + Tambah Sponsor
              </button>
            </div>

            {(showAddSponsor && !editSponsor) && <SponsorForm/>}
            {editSponsor && <SponsorForm/>}

            {sponsors.length === 0 ? (
              <div style={{ ...card, textAlign: "center", padding: "4rem 2rem" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🤝</div>
                <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "1rem", marginBottom: "0.4rem" }}>Belum ada sponsor</div>
                <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Klik "+ Tambah Sponsor" untuk mulai mengelola sponsorship</div>
              </div>
            ) : sponsors.map(sp => {
              const pkg = PKG_CONFIG[sp.package];
              const sts = STATUS_SPONSOR[sp.status];
              return (
                <div key={sp.id} style={{ ...card, borderLeft: `4px solid ${pkg.border}`, padding: "1.25rem 1.5rem", marginBottom: "0.875rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>

                    {/* Company block */}
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center", flex: 1, minWidth: 200 }}>
                      <div style={{ width: 50, height: 50, borderRadius: 12, background: pkg.bg, border: `1.5px solid ${pkg.border}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: "0.62rem", fontWeight: 900, color: pkg.color, textTransform: "uppercase" as const, letterSpacing: "0.04em", textAlign: "center" as const, lineHeight: 1.3 }}>
                          {pkg.label}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a", marginBottom: 2 }}>{sp.companyName}</div>
                        <div style={{ fontSize: "0.77rem", color: "#64748b", display: "flex", gap: "0.5rem", flexWrap: "wrap" as const }}>
                          {sp.industry && <span>{sp.industry}</span>}
                          {sp.industry && <span style={{ color: "#d1d5db" }}>·</span>}
                          <span style={{ color: sp.boothType === "with_booth" ? "#0d9488" : "#94a3b8", fontWeight: 500 }}>
                            {sp.boothType === "with_booth" ? "Dengan Booth" : "Supporting Only"}
                          </span>
                        </div>
                        {sp.picName && (
                          <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 2 }}>
                            PIC: {sp.picName}{sp.picPhone && ` · ${sp.picPhone}`}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions block */}
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" as const }}>
                      {sp.amount > 0 && (
                        <div style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.22)", borderRadius: 8, padding: "0.3rem 0.8rem", fontSize: "0.82rem", fontWeight: 800, color: "#B8860B" }}>
                          {fmt(sp.amount)}
                        </div>
                      )}
                      <select value={sp.status}
                        onChange={e => updateSponsorMut.mutate({ id: sp.id, status: e.target.value as Sponsor["status"] })}
                        style={{ background: sts.bg, border: `1.5px solid ${sts.border}`, color: sts.color, borderRadius: 20, padding: "0.3rem 0.75rem", fontSize: "0.74rem", fontWeight: 700, cursor: "pointer", outline: "none", fontFamily: "inherit" }}>
                        {Object.entries(STATUS_SPONSOR).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                      <button
                        onClick={() => {
                          setEditSponsor(sp);
                          setForm({ companyName: sp.companyName, industry: sp.industry, picName: sp.picName, picPhone: sp.picPhone, picEmail: sp.picEmail, package: sp.package, boothType: sp.boothType, amount: sp.amount, inkindDesc: sp.inkindDesc, inkindValue: sp.inkindValue, status: sp.status, notes: sp.notes });
                          setShowAddSponsor(false);
                        }}
                        style={{ width: 34, height: 34, borderRadius: 8, background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#64748b", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        ✏️
                      </button>
                      <button onClick={() => deleteSponsorMut.mutate({ id: sp.id })}
                        style={{ width: 34, height: 34, borderRadius: 8, background: "#fff5f5", border: "1.5px solid #fecaca", color: "#ef4444", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        🗑️
                      </button>
                    </div>
                  </div>

                  {(sp.notes || (sp.package === "inkind" && sp.inkindDesc)) && (
                    <div style={{ marginTop: "0.85rem", paddingTop: "0.75rem", borderTop: "1px solid #f1f5f9", display: "flex", gap: "1.5rem", flexWrap: "wrap" as const, fontSize: "0.79rem" }}>
                      {sp.package === "inkind" && sp.inkindDesc && (
                        <span style={{ color: "#0d9488" }}>📦 {sp.inkindDesc}{sp.inkindValue > 0 && ` · ${fmt(sp.inkindValue)}`}</span>
                      )}
                      {sp.notes && <span style={{ color: "#94a3b8", fontStyle: "italic" }}>💬 {sp.notes}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── TAB: PROSPEK ─────────────────────────────────── */}
        {activeTab === "prospek" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
              <button onClick={() => setShowAddProspect(true)}
                style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)", border: "none", color: "#fff", borderRadius: 9, padding: "0.65rem 1.5rem", fontWeight: 700, cursor: "pointer", fontSize: "0.88rem", boxShadow: "0 2px 10px rgba(37,99,235,0.25)" }}>
                + Tambah Prospek
              </button>
            </div>

            {showAddProspect && (
              <div style={{ ...card, borderTop: "3px solid #2563eb", marginBottom: "1.5rem", background: "#fafbff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(37,99,235,0.08)", border: "1.5px solid rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>🎯</div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#2563eb", fontSize: "0.95rem" }}>Prospek Employer Baru</div>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 1 }}>Tambahkan perusahaan yang sedang atau sudah dikontak</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div>
                    <label style={lbl}>Nama Perusahaan *</label>
                    <input style={inp} value={proForm.companyName} onChange={e => updP("companyName", e.target.value)} placeholder="PT Hyatt Indonesia"/>
                  </div>
                  <div>
                    <label style={lbl}>Industri</label>
                    <select style={sel} value={proForm.industry} onChange={e => updP("industry", e.target.value)}>
                      <option value="">— Pilih —</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Nama PIC</label>
                    <input style={inp} value={proForm.picName} onChange={e => updP("picName", e.target.value)}/>
                  </div>
                  <div>
                    <label style={lbl}>No. HP</label>
                    <input style={inp} value={proForm.picPhone} onChange={e => updP("picPhone", e.target.value)}/>
                  </div>
                  <div>
                    <label style={lbl}>Status</label>
                    <select style={sel} value={proForm.status} onChange={e => updP("status", e.target.value as any)}>
                      {Object.entries(STATUS_PROSPECT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Catatan</label>
                    <input style={inp} value={proForm.notes} onChange={e => updP("notes", e.target.value)} placeholder="Sudah kirim proposal..."/>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button onClick={saveProspect}
                    style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)", border: "none", color: "#fff", borderRadius: 8, padding: "0.65rem 1.5rem", fontWeight: 700, cursor: "pointer", fontSize: "0.88rem" }}>
                    Tambah Prospek
                  </button>
                  <button onClick={() => setShowAddProspect(false)}
                    style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#64748b", borderRadius: 8, padding: "0.65rem 1.25rem", cursor: "pointer", fontWeight: 600, fontSize: "0.88rem" }}>
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Pipeline overview */}
            <div style={{ ...card, marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "1.1rem" }}>
                Pipeline Overview
              </div>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" as const, alignItems: "center" }}>
                {Object.entries(STATUS_PROSPECT).map(([k, v], i, arr) => {
                  const count = prospects.filter(p => p.status === k).length;
                  return (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ background: `${v.color}0d`, border: `1.5px solid ${v.color}30`, borderRadius: 10, padding: "0.75rem 1.1rem", textAlign: "center" as const, minWidth: 88 }}>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: v.color, lineHeight: 1 }}>{count}</div>
                        <div style={{ fontSize: "0.63rem", color: "#94a3b8", marginTop: 3, fontWeight: 600 }}>{v.label}</div>
                      </div>
                      {i < arr.length - 1 && <span style={{ color: "#cbd5e1", fontSize: "1.1rem" }}>›</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {prospects.length === 0 ? (
              <div style={{ ...card, textAlign: "center", padding: "3.5rem 2rem" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🎯</div>
                <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>Belum ada prospek</div>
                <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Tambahkan perusahaan yang sudah dikontak untuk employer</div>
              </div>
            ) : prospects.map(p => {
              const sts = STATUS_PROSPECT[p.status];
              return (
                <div key={p.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: "0.75rem", padding: "1rem 1.5rem", marginBottom: "0.75rem" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{p.companyName}</div>
                    <div style={{ fontSize: "0.77rem", color: "#64748b" }}>
                      {[p.industry, p.picName, p.picPhone].filter(Boolean).join(" · ")}
                    </div>
                    {p.notes && <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontStyle: "italic", marginTop: 2 }}>{p.notes}</div>}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <select value={p.status}
                      onChange={e => updateProspectStatusMut.mutate({ id: p.id, status: e.target.value as Prospect["status"] })}
                      style={{ background: `${sts.color}0d`, border: `1.5px solid ${sts.color}35`, color: sts.color, borderRadius: 20, padding: "0.3rem 0.75rem", fontSize: "0.74rem", fontWeight: 700, cursor: "pointer", outline: "none", fontFamily: "inherit" }}>
                      {Object.entries(STATUS_PROSPECT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <button onClick={() => deleteProspectMut.mutate({ id: p.id })}
                      style={{ width: 34, height: 34, borderRadius: 8, background: "#fff5f5", border: "1.5px solid #fecaca", color: "#ef4444", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TAB: SUMMARY ─────────────────────────────────── */}
        {activeTab === "summary" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,460px),1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>

              {/* Realisasi per paket */}
              <div style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(212,160,23,0.1)", border: "1.5px solid rgba(212,160,23,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>💰</div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>Realisasi Sponsorship</div>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 1 }}>Per paket · sponsor konfirmasi &amp; lunas</div>
                  </div>
                </div>

                {Object.entries(PKG_CONFIG).map(([k, v]) => {
                  const pkgSponsors = confirmed.filter(sp => sp.package === k);
                  const pkgTotal = pkgSponsors.reduce((sum, sp) => sum + (sp.amount || 0) + (sp.inkindValue || 0), 0);
                  if (pkgSponsors.length === 0) return null;
                  return (
                    <div key={k} style={{ padding: "1rem", background: v.bg, border: `1.5px solid ${v.border}30`, borderRadius: 10, marginBottom: "0.85rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ background: v.color, color: "#fff", borderRadius: 5, padding: "0.15rem 0.55rem", fontSize: "0.62rem", fontWeight: 900, letterSpacing: "0.06em" }}>{v.label.toUpperCase()}</span>
                          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{v.desc}</span>
                        </div>
                        <div style={{ fontWeight: 800, color: "#0f172a" }}>{fmt(pkgTotal)}</div>
                      </div>
                      {pkgSponsors.map(sp => (
                        <div key={sp.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", padding: "0.3rem 0", borderTop: `1px dashed ${v.border}25` }}>
                          <span style={{ color: "#64748b" }}>{sp.companyName} <span style={{ color: "#d1d5db" }}>{sp.boothType === "with_booth" ? "🏢" : "💰"}</span></span>
                          <span style={{ fontWeight: 600, color: "#475569" }}>{fmt((sp.amount || 0) + (sp.inkindValue || 0))}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}

                {confirmed.length === 0 && (
                  <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "#94a3b8", fontSize: "0.85rem" }}>
                    Belum ada sponsor yang konfirmasi atau lunas.
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", padding: "1rem 1.25rem", background: "rgba(13,148,136,0.05)", border: "1.5px solid rgba(13,148,136,0.15)", borderRadius: 10, marginTop: "0.5rem" }}>
                  <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>TOTAL SPONSORSHIP</span>
                  <span style={{ fontWeight: 800, color: "#D4A017", fontSize: "1.1rem" }}>{fmt(totalValue)}</span>
                </div>

                <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "rgba(13,148,136,0.04)", border: "1px solid rgba(13,148,136,0.1)", borderRadius: 8, fontSize: "0.77rem", color: "#0d9488", lineHeight: 1.6 }}>
                  📌 Nilai ini terhubung ke Financial Planner — sponsor confirmed otomatis masuk ke kalkulasi P&amp;L.
                </div>
              </div>

              {/* Pipeline employer */}
              <div style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(37,99,235,0.08)", border: "1.5px solid rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>🎯</div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>Pipeline Employer</div>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 1 }}>Konversi prospek menjadi peserta</div>
                  </div>
                </div>

                {Object.entries(STATUS_PROSPECT).map(([k, v]) => {
                  const items = prospects.filter(p => p.status === k);
                  const pct = prospects.length ? (items.length / prospects.length) * 100 : 0;
                  return (
                    <div key={k} style={{ marginBottom: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.35rem" }}>
                        <span style={{ fontWeight: 600, color: "#475569" }}>{v.label}</span>
                        <span style={{ fontWeight: 700, color: v.color }}>{items.length} perusahaan</span>
                      </div>
                      <div style={{ height: 7, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: v.color, borderRadius: 99, transition: "width 0.4s ease" }}/>
                      </div>
                    </div>
                  );
                })}

                <div style={{ marginTop: "1.25rem", padding: "1rem 1.25rem", background: "#f8fafc", borderRadius: 10, border: "1px solid #e8edf2" }}>
                  {[
                    { label: "Total Dikontak",    val: prospects.length },
                    { label: "Tertarik / Konfirmasi", val: prospects.filter(p => p.status === "tertarik" || p.status === "konfirmasi").length },
                    { label: "Sudah Hadir",       val: prospects.filter(p => p.status === "hadir").length },
                  ].map(row => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", padding: "0.3rem 0", borderBottom: "1px solid #f1f5f9" }}>
                      <span style={{ color: "#64748b" }}>{row.label}</span>
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tier distribution — full width */}
            <div style={card}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "1.25rem" }}>
                Distribusi Paket Sponsorship
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "1rem" }}>
                {Object.entries(PKG_CONFIG).map(([k, v]) => {
                  const count = sponsors.filter(s => s.package === k).length;
                  return (
                    <div key={k} style={{ padding: "1.1rem", background: v.bg, border: `1.5px solid ${v.border}30`, borderRadius: 12, textAlign: "center" as const }}>
                      <div style={{ display: "inline-block", background: v.color, color: "#fff", borderRadius: 5, padding: "0.15rem 0.55rem", fontSize: "0.6rem", fontWeight: 900, letterSpacing: "0.07em", marginBottom: "0.6rem" }}>
                        {v.label.toUpperCase()}
                      </div>
                      <div style={{ fontSize: "2.2rem", fontWeight: 800, color: v.color, lineHeight: 1 }}>{count}</div>
                      <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: "0.35rem" }}>{v.desc}</div>
                      {v.price > 0 && (
                        <div style={{ fontSize: "0.67rem", color: "#64748b", marginTop: "0.2rem", fontWeight: 500 }}>{fmt(v.price)} / sponsor</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
