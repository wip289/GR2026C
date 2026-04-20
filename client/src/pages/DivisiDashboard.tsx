import { useState, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// ── Types ─────────────────────────────────────────────────────
interface Task {
  id: string;
  task: string;
  pic: string;
  deadline: string;
  status: "pending" | "in_progress" | "done";
  notes: string;
  category: string;
}

// ── Default checklists per division ──────────────────────────
const DEFAULT_TASKS: Record<string, Task[]> = {
  finance: [
    { id: "f1", task: "Buat RAB (Rencana Anggaran Biaya)", pic: "", deadline: "", status: "pending", notes: "", category: "Perencanaan" },
    { id: "f2", task: "Buka rekening event / koordinasi koperasi", pic: "", deadline: "", status: "pending", notes: "", category: "Perencanaan" },
    { id: "f3", task: "Kirim invoice ke employer yang sudah booking", pic: "", deadline: "", status: "pending", notes: "", category: "Penagihan" },
    { id: "f4", task: "Kirim invoice ke sponsor", pic: "", deadline: "", status: "pending", notes: "", category: "Penagihan" },
    { id: "f5", task: "Rekap pembayaran employer masuk", pic: "", deadline: "", status: "pending", notes: "", category: "Monitoring" },
    { id: "f6", task: "Rekap pembayaran sponsor masuk", pic: "", deadline: "", status: "pending", notes: "", category: "Monitoring" },
    { id: "f7", task: "Laporan keuangan interim (H-14)", pic: "", deadline: "", status: "pending", notes: "", category: "Pelaporan" },
    { id: "f8", task: "Laporan keuangan final pasca event", pic: "", deadline: "", status: "pending", notes: "", category: "Pelaporan" },
  ],
  logistics: [
    { id: "l1", task: "Survey dan booking venue (Dome NHI)", pic: "", deadline: "", status: "pending", notes: "", category: "Venue" },
    { id: "l2", task: "Koordinasi layout denah booth", pic: "", deadline: "", status: "pending", notes: "", category: "Venue" },
    { id: "l3", task: "Booking vendor dekorasi & backdrop", pic: "", deadline: "", status: "pending", notes: "", category: "Dekorasi" },
    { id: "l4", task: "Sewa meja, kursi, partisi booth", pic: "", deadline: "", status: "pending", notes: "", category: "Perlengkapan" },
    { id: "l5", task: "Koordinasi loading in H-1", pic: "", deadline: "", status: "pending", notes: "", category: "H-Day" },
    { id: "l6", task: "Koordinasi loading out pasca event", pic: "", deadline: "", status: "pending", notes: "", category: "H-Day" },
    { id: "l7", task: "Persiapan konsumsi panitia & VIP", pic: "", deadline: "", status: "pending", notes: "", category: "Konsumsi" },
    { id: "l8", task: "Koordinasi parkir & keamanan", pic: "", deadline: "", status: "pending", notes: "", category: "Keamanan" },
  ],
  marketing: [
    { id: "m1", task: "Buat logo dan identitas visual GR2026", pic: "", deadline: "", status: "done", notes: "", category: "Desain" },
    { id: "m2", task: "Desain flyer announcement (tanpa reg link)", pic: "", deadline: "", status: "done", notes: "", category: "Desain" },
    { id: "m3", task: "Desain flyer dengan link registrasi", pic: "", deadline: "", status: "done", notes: "", category: "Desain" },
    { id: "m4", task: "Digital advertising universitas pariwisata se-Indonesia", pic: "", deadline: "", status: "in_progress", notes: "", category: "Publikasi" },
    { id: "m5", task: "Koordinasi publikasi di Instagram GR", pic: "", deadline: "", status: "in_progress", notes: "", category: "Sosmed" },
    { id: "m6", task: "Koordinasi Kemenaker (naik IG Kemenaker)", pic: "", deadline: "", status: "in_progress", notes: "", category: "Publikasi" },
    { id: "m7", task: "Iklan radio (Ardan, Gen FM)", pic: "", deadline: "", status: "pending", notes: "", category: "Publikasi" },
    { id: "m8", task: "Koordinasi media (press release)", pic: "", deadline: "", status: "pending", notes: "", category: "Media" },
  ],
  sponsorship: [
    { id: "s1", task: "Buat proposal sponsorship", pic: "", deadline: "", status: "done", notes: "", category: "Proposal" },
    { id: "s2", task: "Identifikasi dan approach calon sponsor", pic: "", deadline: "", status: "in_progress", notes: "", category: "Prospek" },
    { id: "s3", task: "Follow up konfirmasi sponsor", pic: "", deadline: "", status: "pending", notes: "", category: "Prospek" },
    { id: "s4", task: "Buat Berita Acara Serah Terima Sponsor", pic: "", deadline: "", status: "pending", notes: "", category: "Administrasi" },
    { id: "s5", task: "Koordinasi branding sponsor di venue", pic: "", deadline: "", status: "pending", notes: "", category: "H-Day" },
  ],
  admin: [
    { id: "a1", task: "Surat pembuatan SK dari KoMen ke PPNHIB", pic: "dde", deadline: "2026-03-17", status: "done", notes: "", category: "Surat-Menyurat" },
    { id: "a2", task: "Surat ijin keramaian ke Polsek Cidadap", pic: "", deadline: "", status: "in_progress", notes: "", category: "Legal" },
    { id: "a3", task: "Surat peminjaman Gedung Dome & Convention", pic: "dde", deadline: "2026-03-17", status: "done", notes: "", category: "Surat-Menyurat" },
    { id: "a4", task: "Surat permintaan penggunaan akun Instagram GR", pic: "dde", deadline: "2026-03-17", status: "done", notes: "", category: "Surat-Menyurat" },
    { id: "a5", task: "Surat permintaan penggunaan Megatron Kampus", pic: "", deadline: "", status: "pending", notes: "", category: "Surat-Menyurat" },
    { id: "a6", task: "Notulensi rapat koordinasi rutin", pic: "", deadline: "", status: "pending", notes: "", category: "Administrasi" },
    { id: "a7", task: "Dokumen loading in/out daily (TTD PIC)", pic: "", deadline: "", status: "pending", notes: "", category: "H-Day" },
  ],
  registration: [
    { id: "r1",  task: "Setup sistem check-in (tablet/HP panitia)", pic: "", deadline: "", status: "pending", notes: "", category: "Persiapan" },
    { id: "r2",  task: "Cetak daftar nama jobseeker (backup manual)", pic: "", deadline: "", status: "pending", notes: "", category: "Persiapan" },
    { id: "r3",  task: "Cetak daftar employer & nomor booth", pic: "", deadline: "", status: "pending", notes: "", category: "Persiapan" },
    { id: "r4",  task: "Setup meja registrasi di pintu masuk", pic: "", deadline: "", status: "pending", notes: "", category: "Persiapan" },
    { id: "r5",  task: "Briefing tim registrasi alur check-in", pic: "", deadline: "", status: "pending", notes: "", category: "H-Day" },
    { id: "r6",  task: "Check-in jobseeker Hari 1", pic: "", deadline: "2026-06-08", status: "pending", notes: "Jam 07.30 - 17.00", category: "H-Day" },
    { id: "r7",  task: "Check-in employer Hari 1", pic: "", deadline: "2026-06-08", status: "pending", notes: "Jam 07.00", category: "H-Day" },
    { id: "r8",  task: "Check-in jobseeker Hari 2", pic: "", deadline: "2026-06-09", status: "pending", notes: "Jam 07.30 - 17.00", category: "H-Day" },
    { id: "r9",  task: "Check-in employer Hari 2", pic: "", deadline: "2026-06-09", status: "pending", notes: "Jam 07.00", category: "H-Day" },
    { id: "r10", task: "Rekap jumlah pengunjung per hari", pic: "", deadline: "", status: "pending", notes: "", category: "Pelaporan" },
    { id: "r11", task: "Laporan final total pengunjung 2 hari", pic: "", deadline: "", status: "pending", notes: "", category: "Pelaporan" },
  ],
  operation: [
    { id: "o1",  task: "Buat rundown acara detail Hari 1 & 2", pic: "", deadline: "", status: "pending", notes: "", category: "Persiapan" },
    { id: "o2",  task: "Briefing seluruh panitia H-1", pic: "", deadline: "2026-06-07", status: "pending", notes: "", category: "Persiapan" },
    { id: "o3",  task: "Koordinasi loading in venue H-1", pic: "", deadline: "2026-06-07", status: "pending", notes: "", category: "Persiapan" },
    { id: "o4",  task: "Pastikan semua booth siap Hari 1", pic: "", deadline: "2026-06-08", status: "pending", notes: "Cek 07.00", category: "H-Day" },
    { id: "o5",  task: "Opening ceremony koordinasi", pic: "", deadline: "2026-06-08", status: "pending", notes: "Jam 08.30", category: "H-Day" },
    { id: "o6",  task: "Monitoring kondisi venue sepanjang hari", pic: "", deadline: "", status: "pending", notes: "Rotasi tim", category: "H-Day" },
    { id: "o7",  task: "Koordinasi konsumsi panitia & VIP", pic: "", deadline: "", status: "pending", notes: "", category: "H-Day" },
    { id: "o8",  task: "Incident report — catat semua kejadian", pic: "", deadline: "", status: "pending", notes: "", category: "H-Day" },
    { id: "o9",  task: "Closing & loading out Hari 1", pic: "", deadline: "2026-06-08", status: "pending", notes: "Setelah jam 17.00", category: "H-Day" },
    { id: "o10", task: "Closing & loading out Hari 2 (final)", pic: "", deadline: "2026-06-09", status: "pending", notes: "Setelah jam 17.00", category: "H-Day" },
    { id: "o11", task: "Rapat evaluasi pasca event", pic: "", deadline: "", status: "pending", notes: "H+1 atau H+2", category: "Post Event" },
  ],
  pm: [
    { id: "p1", task: "Briefing awal seluruh panitia", pic: "", deadline: "", status: "pending", notes: "", category: "Koordinasi" },
    { id: "p2", task: "Buat job description per divisi", pic: "", deadline: "", status: "pending", notes: "", category: "Koordinasi" },
    { id: "p3", task: "Rapat koordinasi mingguan", pic: "", deadline: "", status: "pending", notes: "", category: "Koordinasi" },
    { id: "p4", task: "Review progress semua divisi (H-30)", pic: "", deadline: "", status: "pending", notes: "", category: "Monitoring" },
    { id: "p5", task: "Final briefing H-3", pic: "", deadline: "", status: "pending", notes: "", category: "H-Day" },
    { id: "p6", task: "Evaluasi pasca event", pic: "", deadline: "", status: "pending", notes: "", category: "Evaluasi" },
  ],
};

const DIV_INFO: Record<string, { name: string; color: string; icon: string }> = {
  pm:           { name: "Project Manager",      color: "#D4A017", icon: "👑" },
  finance:      { name: "Finance",              color: "#14b8a6", icon: "💰" },
  sponsorship:  { name: "Sponsorship",          color: "#818cf8", icon: "🤝" },
  admin:        { name: "Admin & Sekretariat",  color: "#f97316", icon: "📋" },
  logistics:    { name: "Logistik",             color: "#10b981", icon: "🚚" },
  marketing:    { name: "Marketing & Publikasi",color: "#ec4899", icon: "📣" },
  registration: { name: "Registration",         color: "#60a5fa", icon: "✅" },
  operation:    { name: "Operasional",          color: "#f43f5e", icon: "⚡" },
};

const STATUS_CONFIG = {
  pending:     { label: "Belum", color: "#64748b", bg: "rgba(100,116,139,0.15)" },
  in_progress: { label: "Proses", color: "#f97316", bg: "rgba(249,115,22,0.15)" },
  done:        { label: "Selesai", color: "#14b8a6", bg: "rgba(20,184,166,0.15)" },
};

const s = {
  page:  { minHeight: "100vh", background: "#0a1628", fontFamily: "system-ui, sans-serif", color: "#f1f5f9" } as React.CSSProperties,
  nav:   { background: "rgba(10,22,40,0.98)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky" as const, top: 0, zIndex: 50 },
  wrap:  { maxWidth: 1100, margin: "0 auto", padding: "2rem 1.25rem" },
  card:  { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" },
  input: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, padding: "0.4rem 0.7rem", fontSize: "0.82rem", color: "#f1f5f9", outline: "none" },
};

export default function DivisiDashboard() {
  const [, navigate] = useLocation();
  const params = useParams();
  const divId = (params as any).divisi || "pm";
  const divInfo = DIV_INFO[divId] || { name: "Divisi", color: "#818cf8", icon: "📋" };

  const [tasks, setTasks] = useState<Task[]>(
    DEFAULT_TASKS[divId] || []
  );
  const [filterCat, setFilterCat] = useState("Semua");
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ task: "", pic: "", deadline: "", notes: "", category: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const categories = ["Semua", ...Array.from(new Set(tasks.map(t => t.category).filter(Boolean)))];
  const filtered = filterCat === "Semua" ? tasks : tasks.filter(t => t.category === filterCat);

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === "done").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    pending: tasks.filter(t => t.status === "pending").length,
    pct: tasks.length ? Math.round((tasks.filter(t => t.status === "done").length / tasks.length) * 100) : 0,
  };

  const updateStatus = (id: string, status: Task["status"]) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    toast.success("Task dihapus");
  };

  const addTask = () => {
    if (!newTask.task.trim()) { toast.error("Nama task wajib diisi"); return; }
    const task: Task = { ...newTask, id: Date.now().toString(), status: "pending" };
    setTasks(prev => [...prev, task]);
    setNewTask({ task: "", pic: "", deadline: "", notes: "", category: "" });
    setShowAddTask(false);
    toast.success("Task ditambahkan!");
  };

  // ── Import from Excel ────────────────────────────────────────
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Find header row
        let headerRow = -1;
        let colMap: Record<string, number> = {};
        const headerKeywords = { task: ["task","tugas","kegiatan","deskripsi","description","aktivitas"], pic: ["pic","penanggung","person"], deadline: ["deadline","batas","tanggal","date"], status: ["status","checker","done"], notes: ["notes","catatan","keterangan"], category: ["category","kategori","divisi","jenis"] };

        for (let i = 0; i < Math.min(rows.length, 10); i++) {
          const row = rows[i];
          if (!row) continue;
          const rowStr = row.map(c => String(c || "").toLowerCase());
          const matched = Object.entries(headerKeywords).filter(([, kws]) =>
            kws.some(kw => rowStr.some(cell => cell.includes(kw)))
          );
          if (matched.length >= 2) {
            headerRow = i;
            matched.forEach(([field, kws]) => {
              const idx = rowStr.findIndex(cell => kws.some(kw => cell.includes(kw)));
              if (idx >= 0) colMap[field] = idx;
            });
            break;
          }
        }

        if (headerRow < 0) {
          // No header found — assume columns: task, status, notes, pic
          colMap = { task: 1, status: 2, notes: 3, pic: 4 };
          headerRow = 3; // skip first few rows
        }

        const imported: Task[] = [];
        for (let i = headerRow + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row) continue;
          const taskText = String(row[colMap.task] || "").trim();
          if (!taskText || taskText.length < 3) continue;

          const statusRaw = String(row[colMap.status] || "").toLowerCase();
          let status: Task["status"] = "pending";
          if (statusRaw.includes("done") || statusRaw.includes("selesai") || statusRaw.includes("✓")) status = "done";
          else if (statusRaw.includes("progress") || statusRaw.includes("proses") || statusRaw.includes("ongoing")) status = "in_progress";

          // Clean up task text (remove leading dashes/dots)
          const cleanTask = taskText.replace(/^[-•⁠\s]+/, "").trim();
          if (!cleanTask) continue;

          imported.push({
            id: `import-${i}-${Date.now()}`,
            task: cleanTask,
            pic: String(row[colMap.pic] || "").trim(),
            deadline: colMap.deadline !== undefined ? String(row[colMap.deadline] || "").trim() : "",
            status,
            notes: colMap.notes !== undefined ? String(row[colMap.notes] || "").trim() : "",
            category: colMap.category !== undefined ? String(row[colMap.category] || "").trim() : "Import",
          });
        }

        if (imported.length === 0) {
          toast.error("Tidak ada data yang bisa diimport", { description: "Pastikan file Excel memiliki kolom task/tugas/kegiatan" });
          return;
        }

        setTasks(prev => [...prev, ...imported]);
        toast.success(`${imported.length} task berhasil diimport dari Excel!`);
      } catch (err) {
        toast.error("Gagal membaca file Excel", { description: "Pastikan format file benar (.xlsx atau .xls)" });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 32 }} />
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: "1rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: divInfo.color }}>
              {divInfo.icon} {divInfo.name}
            </div>
            <div style={{ fontSize: "0.7rem", color: "#475569" }}>Dashboard Divisi · GR2026</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => navigate("/panitia")}
            style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.3)", color: "#818cf8", borderRadius: 8, padding: "0.4rem 0.9rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
            ← Org. Panitia
          </button>
          <button onClick={() => navigate("/boss")}
            style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", color: "#D4A017", borderRadius: 8, padding: "0.4rem 0.9rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
            Panel Panitia
          </button>
        </div>
      </nav>

      <div style={s.wrap}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, marginBottom: "0.25rem" }}>
            Dashboard {divInfo.name}
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Checklist & Timeline Progress · Grand Recruitment 2026</p>
        </div>

        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Total Task", val: stats.total, color: "#94a3b8" },
            { label: "Selesai", val: stats.done, color: "#14b8a6" },
            { label: "Proses", val: stats.inProgress, color: "#f97316" },
            { label: "Belum", val: stats.pending, color: "#64748b" },
          ].map(k => (
            <div key={k.label} style={{ background: `${k.color}10`, border: `1px solid ${k.color}25`, borderRadius: 12, padding: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: k.color }}>{k.val}</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ ...s.card, padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", fontSize: "0.85rem" }}>
            <span style={{ color: "#94a3b8", fontWeight: 600 }}>Progress Keseluruhan</span>
            <span style={{ color: divInfo.color, fontWeight: 800 }}>{stats.pct}%</span>
          </div>
          <div style={{ height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${stats.pct}%`, background: `linear-gradient(90deg, ${divInfo.color}80, ${divInfo.color})`, borderRadius: 99, transition: "width 0.5s" }}/>
          </div>
        </div>

        {/* Actions bar */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {/* Filter by category */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", flex: 1 }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilterCat(cat)}
                style={{ padding: "0.4rem 0.9rem", borderRadius: 20, border: `1px solid ${filterCat === cat ? divInfo.color : "rgba(255,255,255,0.1)"}`, background: filterCat === cat ? `${divInfo.color}20` : "transparent", color: filterCat === cat ? divInfo.color : "#64748b", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                {cat}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input type="file" ref={fileRef} accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleExcelImport}/>
            <button onClick={() => fileRef.current?.click()}
              style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.3)", color: "#14b8a6", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
              📥 Import Excel
            </button>
            <button onClick={() => setShowAddTask(true)}
              style={{ background: `linear-gradient(135deg, ${divInfo.color}, ${divInfo.color}cc)`, border: "none", color: "#fff", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
              + Task Manual
            </button>
          </div>
        </div>

        {/* Add task form */}
        {showAddTask && (
          <div style={{ ...s.card, border: `1px solid ${divInfo.color}30`, background: `${divInfo.color}06`, marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: divInfo.color, marginBottom: "1rem" }}>➕ Task Baru</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <input style={{ ...s.input, width: "100%", padding: "0.6rem 0.9rem" }} placeholder="Nama task / kegiatan *"
                  value={newTask.task} onChange={e => setNewTask(p => ({ ...p, task: e.target.value }))} autoFocus/>
              </div>
              <input style={s.input} placeholder="Kategori" value={newTask.category} onChange={e => setNewTask(p => ({ ...p, category: e.target.value }))}/>
              <input style={s.input} placeholder="PIC / penanggung jawab" value={newTask.pic} onChange={e => setNewTask(p => ({ ...p, pic: e.target.value }))}/>
              <input style={s.input} type="date" value={newTask.deadline} onChange={e => setNewTask(p => ({ ...p, deadline: e.target.value }))}/>
              <input style={s.input} placeholder="Catatan" value={newTask.notes} onChange={e => setNewTask(p => ({ ...p, notes: e.target.value }))}/>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={addTask} style={{ background: `linear-gradient(135deg, ${divInfo.color}, ${divInfo.color}cc)`, border: "none", color: "#fff", borderRadius: 8, padding: "0.6rem 1.25rem", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>Tambah Task</button>
              <button onClick={() => setShowAddTask(false)} style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.3)", color: "#64748b", borderRadius: 8, padding: "0.6rem 1rem", fontSize: "0.85rem", cursor: "pointer" }}>Batal</button>
            </div>
          </div>
        )}

        {/* Task list */}
        <div style={s.card}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#334155" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📋</div>
              <div>Belum ada task. Tambah manual atau import dari Excel!</div>
            </div>
          ) : (
            <div>
              {/* Group by category */}
              {Array.from(new Set(filtered.map(t => t.category || "Lainnya"))).map(cat => (
                <div key={cat} style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "0.75rem", color: divInfo.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: `1px solid ${divInfo.color}20` }}>
                    {cat}
                  </div>
                  {filtered.filter(t => (t.category || "Lainnya") === cat).map(task => (
                    <div key={task.id} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      {/* Status toggle */}
                      <button onClick={() => {
                        const next: Task["status"][] = ["pending", "in_progress", "done"];
                        const idx = next.indexOf(task.status);
                        updateStatus(task.id, next[(idx + 1) % 3]);
                      }} style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", border: `2px solid ${STATUS_CONFIG[task.status].color}`, background: task.status === "done" ? STATUS_CONFIG.done.color : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", color: task.status === "done" ? "#fff" : STATUS_CONFIG[task.status].color, transition: "all 0.2s" }}>
                        {task.status === "done" ? "✓" : task.status === "in_progress" ? "⟳" : ""}
                      </button>

                      {/* Task content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.88rem", color: task.status === "done" ? "#475569" : "#f1f5f9", textDecoration: task.status === "done" ? "line-through" : "none", fontWeight: task.status === "done" ? 400 : 600 }}>
                            {task.task}
                          </span>
                          <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.6rem", borderRadius: 20, background: STATUS_CONFIG[task.status].bg, color: STATUS_CONFIG[task.status].color, fontWeight: 700 }}>
                            {STATUS_CONFIG[task.status].label}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "1rem", marginTop: "0.3rem", flexWrap: "wrap" }}>
                          {task.pic && <span style={{ fontSize: "0.73rem", color: "#64748b" }}>👤 {task.pic}</span>}
                          {task.deadline && <span style={{ fontSize: "0.73rem", color: "#f97316" }}>📅 {task.deadline}</span>}
                          {task.notes && <span style={{ fontSize: "0.73rem", color: "#475569", fontStyle: "italic" }}>💬 {task.notes}</span>}
                        </div>
                      </div>

                      {/* Actions */}
                      <button onClick={() => deleteTask(task.id)} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: "0.85rem", padding: "0.2rem", flexShrink: 0 }}>🗑️</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Import hint */}
        <div style={{ padding: "1rem 1.25rem", background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.15)", borderRadius: 10, fontSize: "0.8rem", color: "#64748b", lineHeight: 1.7 }}>
          💡 <strong style={{ color: "#f1f5f9" }}>Import dari Excel:</strong> Format kolom yang dikenali: <code style={{ color: "#14b8a6" }}>Task/Tugas/Kegiatan | Status/Checker | PIC | Deadline | Notes/Catatan | Kategori</code>. Sistem akan otomatis mendeteksi kolom yang ada.
        </div>
      </div>
    </div>
  );
}
