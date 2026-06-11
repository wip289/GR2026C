import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// ── Styles (senada dengan BossPanel) ─────────────────────────
const vs = {
  card:  { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" } as React.CSSProperties,
  th:    { padding: "0.75rem 1rem", textAlign: "left" as const, fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" as const },
  td:    { padding: "0.85rem 1rem", fontSize: "0.85rem", borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle" as const },
  badge: (color: string) => ({ display: "inline-block", padding: "0.2rem 0.65rem", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, background: `${color}20`, color, border: `1px solid ${color}40` }),
  input: { width: "100%", background: "#0d1f35", border: "1px solid rgba(255,255,255,0.15)", color: "#f1f5f9", borderRadius: 8, padding: "0.55rem 0.8rem", fontSize: "0.85rem", boxSizing: "border-box" as const },
  label: { fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: "0.3rem" },
  btn:   (variant: "gold" | "ghost" | "danger" = "gold", disabled = false) => ({
    background: disabled ? "rgba(255,255,255,0.06)" : variant === "gold" ? "linear-gradient(135deg,#D4A017,#B8860B)" : variant === "danger" ? "rgba(220,38,38,0.15)" : "rgba(255,255,255,0.06)",
    border: variant === "danger" ? "1px solid rgba(220,38,38,0.4)" : "none",
    color: disabled ? "#475569" : variant === "danger" ? "#f87171" : variant === "gold" ? "#fff" : "#cbd5e1",
    borderRadius: 8, padding: "0.55rem 1.1rem", fontSize: "0.82rem", fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer", whiteSpace: "nowrap" as const,
  }),
  kpi: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1rem 1.25rem", flex: "1 1 140px" } as React.CSSProperties,
};

const MECH_LABEL: Record<string, string> = { A: "A — Dashboard", B: "B — WhatsApp", C: "C — Link Eksternal" };
const MECH_COLOR: Record<string, string> = { A: "#34d399", B: "#60a5fa", C: "#fbbf24" };

type PositionForm = { positionName: string; headcount: number; location: string; requirements: string };
const emptyPosition = (): PositionForm => ({ positionName: "", headcount: 1, location: "", requirements: "" });

export default function VirtualPhaseTab() {
  const utils = trpc.useUtils();

  // ── Data ──
  const { data: phase, refetch: refetchPhase } = trpc.event.getVirtualPhaseStatus.useQuery();
  const { data: employers, refetch: refetchEmployers } = trpc.event.getAllEmployerVirtualConfigs.useQuery();

  // ── Section A: kontrol global ──
  const [globalActive, setGlobalActive] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  useEffect(() => {
    if (phase) {
      setGlobalActive(phase.isActive);
      setStartDate(phase.startDate ?? "");
      setEndDate(phase.endDate ?? "");
    }
  }, [phase]);

  const setConfigMutation = trpc.event.setVirtualPhaseConfig.useMutation({
    onSuccess: () => { toast.success("Konfigurasi virtual phase tersimpan"); refetchPhase(); },
    onError: (e) => toast.error(e.message || "Gagal menyimpan konfigurasi"),
  });

  // ── Section B: edit per employer ──
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = employers?.find(e => e.bookingId === editingId) ?? null;

  const { data: editingPositions, isFetching: loadingPositions } = trpc.event.getVirtualPositionsByEmployer.useQuery(
    { employerBookingId: editingId ?? "" },
    { enabled: !!editingId },
  );

  const [fIkut, setFIkut] = useState(true);
  const [fMech, setFMech] = useState<"A" | "B" | "C" | "">("");
  const [fPicName, setFPicName] = useState("");
  const [fPicEmail, setFPicEmail] = useState("");
  const [fPicWa, setFPicWa] = useState("");
  const [fUrl, setFUrl] = useState("");
  const [fPositions, setFPositions] = useState<PositionForm[]>([]);
  const [positionsLoaded, setPositionsLoaded] = useState(false);

  useEffect(() => {
    if (editing) {
      setFIkut(editing.isParticipating);
      setFMech((editing.mechanism as any) ?? "");
      setFPicName(editing.virtualPicName ?? "");
      setFPicEmail(editing.virtualPicEmail ?? "");
      setFPicWa(editing.virtualPicWhatsapp ?? "");
      setFUrl(editing.externalUrl ?? "");
      setPositionsLoaded(false);
      setFPositions([]);
    }
  }, [editingId]);

  useEffect(() => {
    if (editingId && editingPositions && !loadingPositions) {
      setFPositions(editingPositions.map(p => ({
        positionName: p.positionName,
        headcount: p.headcount,
        location: p.location,
        requirements: p.requirements ?? "",
      })));
      setPositionsLoaded(true);
    }
  }, [editingId, editingPositions, loadingPositions]);

  const setEmpConfigMutation = trpc.event.setEmployerVirtualConfig.useMutation();
  const upsertPositionsMutation = trpc.event.upsertVirtualPositions.useMutation();
  const [saving, setSaving] = useState(false);

  const validPositions = fPositions.filter(p => p.positionName.trim() && p.location.trim());

  const saveEmployer = async () => {
    if (!editingId) return;
    if (fIkut && !fMech) { toast.error("Pilih mekanisme apply dulu (A/B/C)"); return; }
    if (fMech === "A" && !fPicEmail.trim()) { toast.error("Opsi A butuh email PIC untuk daily report"); return; }
    if (fMech === "B" && !fPicWa.trim()) { toast.error("Opsi B butuh nomor WhatsApp PIC"); return; }
    if (fMech === "C" && !fUrl.trim()) { toast.error("Opsi C butuh link eksternal"); return; }
    if (!positionsLoaded) { toast.error("Posisi belum selesai dimuat — tunggu sebentar"); return; }
    const dropped = fPositions.length - validPositions.length;
    if (dropped > 0 && !window.confirm(`${dropped} baris posisi belum lengkap (nama/lokasi kosong) dan TIDAK akan disimpan. Lanjut?`)) return;

    setSaving(true);
    try {
      await setEmpConfigMutation.mutateAsync({
        employerBookingId: editingId,
        isParticipating: fIkut,
        mechanism: fMech || undefined,
        externalUrl: fUrl.trim() || undefined,
        virtualPicName: fPicName.trim() || undefined,
        virtualPicEmail: fPicEmail.trim() || undefined,
        virtualPicWhatsapp: fPicWa.trim() || undefined,
      });
      await upsertPositionsMutation.mutateAsync({
        employerBookingId: editingId,
        positions: validPositions.map(p => ({
          positionName: p.positionName.trim(),
          headcount: p.headcount,
          location: p.location.trim(),
          requirements: p.requirements.trim() || undefined,
        })),
      });
      toast.success("Data employer tersimpan");
      setEditingId(null);
      refetchEmployers();
      utils.event.getVirtualPositionsByEmployer.invalidate();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  // ── Section C: daily report ──
  const todayWIB = new Date(Date.now() + 7 * 3600000).toISOString().split("T")[0];
  const [reportDate, setReportDate] = useState(todayWIB);
  const [lastReport, setLastReport] = useState<string | null>(null);
  const reportMutation = trpc.event.triggerDailyReport.useMutation({
    onSuccess: (d) => {
      const msg = d.totalApps === 0
        ? "Tidak ada lamaran di tanggal ini"
        : `${d.sent} email (Opsi A) · ${d.totalApps} lamaran total`;
      setLastReport(`${new Date().toLocaleString("id-ID")} — ${msg}`);
      toast.success(`Daily report: ${msg}`);
    },
    onError: (e) => toast.error(e.message || "Gagal trigger daily report"),
  });

  // ── Stats agregat ──
  const stats = {
    ikut: employers?.filter(e => e.isParticipating).length ?? 0,
    posisi: employers?.reduce((a, e) => a + e.positionCount, 0) ?? 0,
    lamaran: employers?.reduce((a, e) => a + e.totalApplicants, 0) ?? 0,
    baru: employers?.reduce((a, e) => a + e.newApplicants, 0) ?? 0,
  };

  return (
    <div>
      {/* ── SECTION A: KONTROL GLOBAL ── */}
      <div style={vs.card}>
        <h3 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>🌐 Kontrol Virtual Phase</h3>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          <div style={vs.kpi}><div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#D4A017" }}>{stats.ikut}<span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}> / {employers?.length ?? 0}</span></div><div style={{ fontSize: "0.72rem", color: "#64748b" }}>Employer Ikut</div></div>
          <div style={vs.kpi}><div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#34d399" }}>{stats.posisi}</div><div style={{ fontSize: "0.72rem", color: "#64748b" }}>Posisi Dibuka</div></div>
          <div style={vs.kpi}><div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#60a5fa" }}>{stats.lamaran}</div><div style={{ fontSize: "0.72rem", color: "#64748b" }}>Total Lamaran</div></div>
          <div style={vs.kpi}><div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f87171" }}>{stats.baru}</div><div style={{ fontSize: "0.72rem", color: "#64748b" }}>Lamaran Baru</div></div>
        </div>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={vs.label}>Status</label>
            <button onClick={() => setGlobalActive(v => !v)} style={{ ...vs.btn(globalActive ? "gold" : "ghost"), minWidth: 110 }}>
              {globalActive ? "🟢 AKTIF" : "⚪ NONAKTIF"}
            </button>
          </div>
          <div><label style={vs.label}>Tanggal Mulai</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ ...vs.input, width: 170 }} /></div>
          <div><label style={vs.label}>Tanggal Selesai</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ ...vs.input, width: 170 }} /></div>
          <button
            disabled={setConfigMutation.isPending}
            onClick={() => {
              if (globalActive && (!startDate || !endDate)) { toast.error("Isi tanggal mulai & selesai dulu sebelum mengaktifkan"); return; }
              if (startDate && endDate && startDate > endDate) { toast.error("Tanggal mulai tidak boleh setelah tanggal selesai"); return; }
              setConfigMutation.mutate({ isActive: globalActive, startDate: startDate || undefined, endDate: endDate || undefined });
            }}
            style={vs.btn("gold", setConfigMutation.isPending)}>
            💾 Simpan Konfigurasi
          </button>
        </div>
        {phase?.isActive && phase.daysLeft !== null && (
          <div style={{ marginTop: "0.85rem", fontSize: "0.8rem", color: "#34d399" }}>
            Virtual phase berjalan — berakhir dalam {phase.daysLeft} hari ({phase.endDate})
          </div>
        )}
      </div>

      {/* ── SECTION B: PER-EMPLOYER ── */}
      <div style={vs.card}>
        <h3 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>🏢 Konfigurasi Per Employer</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={vs.th}>Perusahaan</th><th style={vs.th}>Ikut</th><th style={vs.th}>Mekanisme</th>
              <th style={vs.th}>Posisi</th><th style={vs.th}>Lamaran</th><th style={vs.th}></th>
            </tr></thead>
            <tbody>
              {(employers ?? []).map(emp => (
                <tr key={emp.bookingId}>
                  <td style={vs.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      {emp.logoUrl
                        ? <img src={emp.logoUrl} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "contain", background: "#fff" }} />
                        : <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800 }}>{emp.companyName.charAt(0)}</div>}
                      <span style={{ fontWeight: 600 }}>{emp.companyName}</span>
                    </div>
                  </td>
                  <td style={vs.td}>{emp.isParticipating ? <span style={vs.badge("#34d399")}>✓ Ikut</span> : <span style={vs.badge("#64748b")}>—</span>}</td>
                  <td style={vs.td}>{emp.mechanism ? <span style={vs.badge(MECH_COLOR[emp.mechanism])}>{MECH_LABEL[emp.mechanism]}</span> : <span style={{ color: "#475569" }}>belum diset</span>}</td>
                  <td style={vs.td}>{emp.positionCount}</td>
                  <td style={vs.td}>{emp.totalApplicants}{emp.newApplicants > 0 && <span style={{ ...vs.badge("#f87171"), marginLeft: 6 }}>{emp.newApplicants} baru</span>}</td>
                  <td style={vs.td}><button onClick={() => setEditingId(editingId === emp.bookingId ? null : emp.bookingId)} style={vs.btn(editingId === emp.bookingId ? "ghost" : "gold")}>{editingId === emp.bookingId ? "Tutup" : "Edit"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Panel edit */}
        {editing && (
          <div style={{ marginTop: "1.25rem", border: "1px solid rgba(212,160,23,0.35)", borderRadius: 12, padding: "1.25rem", background: "rgba(212,160,23,0.04)" }}>
            <h4 style={{ margin: "0 0 1rem", fontSize: "0.95rem" }}>✏️ {editing.companyName}</h4>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem", marginBottom: "1rem" }}>
              <div>
                <label style={vs.label}>Ikut Virtual Phase</label>
                <button onClick={() => setFIkut(v => !v)} style={{ ...vs.btn(fIkut ? "gold" : "ghost"), width: "100%" }}>{fIkut ? "✓ Ikut" : "Tidak Ikut"}</button>
              </div>
              <div>
                <label style={vs.label}>Mekanisme Apply</label>
                <select value={fMech} onChange={e => setFMech(e.target.value as any)} style={vs.input}>
                  <option value="">— pilih —</option>
                  <option value="A">A — Dashboard + email harian</option>
                  <option value="B">B — WhatsApp langsung</option>
                  <option value="C">C — Link eksternal</option>
                </select>
              </div>
              <div><label style={vs.label}>Nama PIC</label><input value={fPicName} onChange={e => setFPicName(e.target.value)} style={vs.input} placeholder="cth: Budi" /></div>
              <div><label style={vs.label}>Email PIC {fMech === "A" && <span style={{ color: "#f87171" }}>*wajib</span>}</label><input value={fPicEmail} onChange={e => setFPicEmail(e.target.value)} style={vs.input} placeholder="hr@perusahaan.com" /></div>
              <div><label style={vs.label}>WhatsApp PIC {fMech === "B" && <span style={{ color: "#f87171" }}>*wajib</span>}</label><input value={fPicWa} onChange={e => setFPicWa(e.target.value)} style={vs.input} placeholder="628xxx" /></div>
              {fMech === "C" && <div><label style={vs.label}>Link Eksternal <span style={{ color: "#f87171" }}>*wajib</span></label><input value={fUrl} onChange={e => setFUrl(e.target.value)} style={vs.input} placeholder="https://..." /></div>}
            </div>

            <label style={vs.label}>Posisi yang Dibuka {loadingPositions && <span style={{ color: "#D4A017" }}>(memuat...)</span>}</label>
            {editing.totalApplicants > 0 && (
              <div style={{ fontSize: "0.75rem", color: "#fbbf24", marginBottom: "0.6rem" }}>
                ⚠️ Employer ini sudah punya {editing.totalApplicants} lamaran. Menyimpan ulang posisi akan me-reset counter pelamar per posisi di gallery. Lamaran tetap aman.
              </div>
            )}
            {fPositions.map((p, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 70px 1.4fr 2fr auto", gap: "0.5rem", marginBottom: "0.5rem", alignItems: "center" }}>
                <input value={p.positionName} onChange={e => setFPositions(arr => arr.map((x, j) => j === i ? { ...x, positionName: e.target.value } : x))} style={vs.input} placeholder="Nama posisi" />
                <input type="number" min={1} value={p.headcount} onChange={e => setFPositions(arr => arr.map((x, j) => j === i ? { ...x, headcount: Math.max(1, Number(e.target.value) || 1) } : x))} style={vs.input} title="Jumlah" />
                <input value={p.location} onChange={e => setFPositions(arr => arr.map((x, j) => j === i ? { ...x, location: e.target.value } : x))} style={vs.input} placeholder="Lokasi" />
                <input value={p.requirements} onChange={e => setFPositions(arr => arr.map((x, j) => j === i ? { ...x, requirements: e.target.value } : x))} style={vs.input} placeholder="Syarat singkat (opsional)" />
                <button onClick={() => setFPositions(arr => arr.filter((_, j) => j !== i))} style={vs.btn("danger")}>✕</button>
              </div>
            ))}
            <button onClick={() => setFPositions(arr => [...arr, emptyPosition()])} style={{ ...vs.btn("ghost"), marginBottom: "1rem" }} disabled={!positionsLoaded}>+ Tambah Posisi</button>

            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
              <button onClick={() => setEditingId(null)} style={vs.btn("ghost")}>Batal</button>
              <button onClick={saveEmployer} disabled={saving || !positionsLoaded} style={vs.btn("gold", saving || !positionsLoaded)}>
                {saving ? "Menyimpan..." : "💾 Simpan"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION C: DAILY REPORT ── */}
      <div style={vs.card}>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>📧 Daily Report</h3>
        <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 1rem" }}>
          Kirim rekap lamaran harian ke PIC employer Opsi A. <em>Catatan: email belum benar-benar terkirim sampai Resend dipasang (Fase 7) — saat ini server hanya mencatat di log.</em>
        </p>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div><label style={vs.label}>Tanggal</label><input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} max={todayWIB} style={{ ...vs.input, width: 170 }} /></div>
          <button disabled={reportMutation.isPending} onClick={() => reportMutation.mutate({ date: reportDate })} style={vs.btn("gold", reportMutation.isPending)}>
            {reportMutation.isPending ? "Memproses..." : "📨 Kirim Daily Report"}
          </button>
        </div>
        {lastReport && <div style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "#64748b" }}>Terakhir: {lastReport}</div>}
      </div>
    </div>
  );
}
