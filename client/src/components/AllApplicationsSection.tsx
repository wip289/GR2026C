import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const vs = {
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.25rem", marginBottom: "1rem" } as React.CSSProperties,
  label: { display: "block", fontSize: "0.7rem", color: "#64748b", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  input: { padding: "0.45rem 0.7rem", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#e2e8f0", fontSize: "0.85rem" } as React.CSSProperties,
  th: { textAlign: "left" as const, padding: "0.6rem 0.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: 0.5, whiteSpace: "nowrap" as const },
  td: { padding: "0.6rem 0.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.82rem", verticalAlign: "top" as const },
  badge: (color: string): React.CSSProperties => ({ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: "0.7rem", fontWeight: 700, color, background: `${color}22`, border: `1px solid ${color}55` }),
  btn: (variant: "gold" | "ghost" | "danger" | "success", disabled?: boolean): React.CSSProperties => ({
    padding: "0.4rem 0.8rem",
    borderRadius: 6,
    fontSize: "0.78rem",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    background: variant === "gold" ? "#D4A017" : variant === "danger" ? "rgba(248,113,113,0.15)" : variant === "success" ? "rgba(74,222,128,0.15)" : "transparent",
    color: variant === "gold" ? "#0f172a" : variant === "danger" ? "#f87171" : variant === "success" ? "#4ade80" : "#e2e8f0",
    border: variant === "gold" ? "none" : variant === "danger" ? "1px solid rgba(248,113,113,0.4)" : variant === "success" ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(255,255,255,0.15)",
  }),
};

const STATUS_COLOR: Record<string, string> = {
  new: "#60a5fa",
  viewed: "#a78bfa",
  contacted: "#34d399",
  not_relevant: "#94a3b8",
  deleted: "#f87171",
};
const STATUS_LABEL: Record<string, string> = {
  new: "Baru",
  viewed: "Dilihat",
  contacted: "Dihubungi",
  not_relevant: "Tidak Relevan",
  deleted: "Terhapus",
};

const MECH_COLOR: Record<string, string> = { A: "#34d399", B: "#60a5fa", C: "#fbbf24" };

interface EmployerOption {
  bookingId: string;
  companyName: string;
}

export default function AllApplicationsSection({ employerOptions }: { employerOptions: EmployerOption[] }) {
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [fEmployer, setFEmployer] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fMech, setFMech] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const utils = trpc.useUtils();
  const queryInput = {
    includeDeleted,
    employerBookingId: fEmployer || undefined,
    status: (fStatus || undefined) as any,
    mechanism: (fMech || undefined) as any,
  };
  const { data: rows, isLoading, refetch } = trpc.event.getAllVirtualApplications.useQuery(queryInput);

  const bulkMut = trpc.event.bulkUpdateVirtualApplicationStatus.useMutation({
    onSuccess: (d) => {
      toast.success(`${d.count} lamaran diperbarui`);
      setSelected(new Set());
      refetch();
      utils.event.getAllEmployerVirtualConfigs.invalidate();
      utils.event.getVirtualGallery.invalidate();
    },
    onError: (e) => toast.error(e.message || "Gagal memperbarui"),
  });

  const allIds = useMemo(() => (rows ?? []).map(r => r.id), [rows]);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  };
  const toggleOne = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const doBulkDelete = () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Hapus ${selected.size} lamaran terpilih? (Soft-delete — bisa direstore.)`)) return;
    bulkMut.mutate({ applicationIds: Array.from(selected), status: "deleted" });
  };
  const doBulkRestore = () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Restore ${selected.size} lamaran terpilih? Statusnya akan diset ke "Baru".`)) return;
    bulkMut.mutate({ applicationIds: Array.from(selected), status: "new" });
  };

  const exportCSV = () => {
    if (!rows || rows.length === 0) { toast.error("Tidak ada data untuk export"); return; }
    const header = ["ID", "Tanggal", "Jobseeker", "RegistrationID", "Email", "WhatsApp", "Institusi", "Jurusan", "Tahun Lulus", "Perusahaan", "Posisi", "Mekanisme", "Status"];
    const rowsCsv = rows.map(r => [
      r.id,
      r.createdAt ? new Date(r.createdAt).toLocaleString("id-ID") : "",
      r.namaLengkap ?? "",
      r.jobseekerRegId ?? "",
      r.email ?? "",
      r.whatsapp ?? "",
      r.institusi ?? "",
      r.jurusan ?? "",
      r.tahunLulus ?? "",
      r.companyName ?? r.employerBookingId,
      r.positionName ?? "",
      r.mechanism ?? "",
      r.status ?? "",
    ]);
    const escape = (v: any) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [header.map(escape).join(","), ...rowsCsv.map(row => row.map(escape).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lamaran-virtual-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${rows.length} baris diekspor`);
  };

  const counts = useMemo(() => {
    if (!rows) return { total: 0, aktif: 0, terhapus: 0 };
    return {
      total: rows.length,
      aktif: rows.filter(r => r.status !== "deleted").length,
      terhapus: rows.filter(r => r.status === "deleted").length,
    };
  }, [rows]);

  return (
    <div style={vs.card}>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>📋 Semua Lamaran (Lintas Employer)</h3>
      <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0 0 1rem" }}>
        Pandangan agregat semua lamaran masuk dari ketiga mekanisme. Soft-delete bisa direstore.
      </p>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "1rem" }}>
        <div>
          <label style={vs.label}>Employer</label>
          <select value={fEmployer} onChange={e => setFEmployer(e.target.value)} style={{ ...vs.input, minWidth: 200 }}>
            <option value="">— Semua Employer —</option>
            {employerOptions.map(e => (
              <option key={e.bookingId} value={e.bookingId}>{e.companyName}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={vs.label}>Status</label>
          <select value={fStatus} onChange={e => setFStatus(e.target.value)} style={vs.input}>
            <option value="">— Semua —</option>
            <option value="new">Baru</option>
            <option value="viewed">Dilihat</option>
            <option value="contacted">Dihubungi</option>
            <option value="not_relevant">Tidak Relevan</option>
            <option value="deleted">Terhapus</option>
          </select>
        </div>
        <div>
          <label style={vs.label}>Mekanisme</label>
          <select value={fMech} onChange={e => setFMech(e.target.value)} style={vs.input}>
            <option value="">— Semua —</option>
            <option value="A">A — Dashboard</option>
            <option value="B">B — WhatsApp</option>
            <option value="C">C — Link</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 8 }}>
          <input type="checkbox" id="incDeleted" checked={includeDeleted} onChange={e => setIncludeDeleted(e.target.checked)} />
          <label htmlFor="incDeleted" style={{ fontSize: "0.8rem", color: "#cbd5e1", cursor: "pointer" }}>Tampilkan terhapus</label>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.4rem" }}>
          <button onClick={() => refetch()} style={vs.btn("ghost")} title="Refresh">🔄 Refresh</button>
          <button onClick={exportCSV} style={vs.btn("ghost")} disabled={!rows || rows.length === 0}>⬇ Export CSV</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "0.6rem", marginBottom: "0.75rem", fontSize: "0.78rem" }}>
        <span style={{ color: "#94a3b8" }}>Total: <strong style={{ color: "#e2e8f0" }}>{counts.total}</strong></span>
        <span style={{ color: "#94a3b8" }}>· Aktif: <strong style={{ color: "#4ade80" }}>{counts.aktif}</strong></span>
        <span style={{ color: "#94a3b8" }}>· Terhapus: <strong style={{ color: "#f87171" }}>{counts.terhapus}</strong></span>
        {someSelected && <span style={{ marginLeft: "auto", color: "#D4A017" }}>{selected.size} dipilih</span>}
      </div>

      {/* Bulk actions */}
      {someSelected && (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem", padding: "0.5rem 0.75rem", background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.25)", borderRadius: 8 }}>
          <button onClick={doBulkDelete} style={vs.btn("danger", bulkMut.isPending)} disabled={bulkMut.isPending}>🗑 Hapus Terpilih ({selected.size})</button>
          <button onClick={doBulkRestore} style={vs.btn("success", bulkMut.isPending)} disabled={bulkMut.isPending}>↩ Restore Terpilih ({selected.size})</button>
          <button onClick={() => setSelected(new Set())} style={vs.btn("ghost")}>Batal</button>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Memuat...</p>
      ) : !rows || rows.length === 0 ? (
        <p style={{ color: "#64748b", fontSize: "0.85rem", padding: "1rem", textAlign: "center" }}>Tidak ada lamaran sesuai filter.</p>
      ) : (
        <div style={{ overflowX: "auto", maxHeight: 600, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, background: "#0f172a", zIndex: 1 }}>
              <tr>
                <th style={vs.th}><input type="checkbox" checked={allSelected} onChange={toggleAll} title="Pilih semua" /></th>
                <th style={vs.th}>Tanggal</th>
                <th style={vs.th}>Jobseeker</th>
                <th style={vs.th}>Employer</th>
                <th style={vs.th}>Posisi</th>
                <th style={vs.th}>Mech</th>
                <th style={vs.th}>Status</th>
                <th style={vs.th}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const isDeleted = r.status === "deleted";
                const isSelected = selected.has(r.id);
                return (
                  <tr key={r.id} style={{ background: isSelected ? "rgba(212,160,23,0.08)" : isDeleted ? "rgba(248,113,113,0.04)" : "transparent" }}>
                    <td style={vs.td}><input type="checkbox" checked={isSelected} onChange={() => toggleOne(r.id)} /></td>
                    <td style={{ ...vs.td, fontSize: "0.75rem", color: "#94a3b8", whiteSpace: "nowrap" }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-"}
                    </td>
                    <td style={vs.td}>
                      <div style={{ fontWeight: 600 }}>{r.namaLengkap}</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{r.jobseekerRegId}</div>
                      {r.cvUrl && <a href={r.cvUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.72rem", color: "#60a5fa" }}>📄 Lihat CV</a>}
                    </td>
                    <td style={vs.td}>{r.companyName ?? r.employerBookingId}</td>
                    <td style={{ ...vs.td, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.positionName ?? ""}>{r.positionName ?? "-"}</td>
                    <td style={vs.td}>{r.mechanism && <span style={vs.badge(MECH_COLOR[r.mechanism] ?? "#94a3b8")}>{r.mechanism}</span>}</td>
                    <td style={vs.td}><span style={vs.badge(STATUS_COLOR[r.status ?? ""] ?? "#94a3b8")}>{STATUS_LABEL[r.status ?? ""] ?? r.status}</span></td>
                    <td style={vs.td}>
                      {isDeleted
                        ? <button onClick={() => { if (window.confirm("Restore lamaran ini ke status Baru?")) bulkMut.mutate({ applicationIds: [r.id], status: "new" }); }} style={vs.btn("success", bulkMut.isPending)} disabled={bulkMut.isPending}>↩ Restore</button>
                        : <button onClick={() => { if (window.confirm("Hapus lamaran ini? (Soft-delete — bisa direstore.)")) bulkMut.mutate({ applicationIds: [r.id], status: "deleted" }); }} style={vs.btn("danger", bulkMut.isPending)} disabled={bulkMut.isPending}>🗑 Hapus</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
