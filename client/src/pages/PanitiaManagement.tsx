import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// ── Types ─────────────────────────────────────────────────────
interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface Division {
  id: string;
  name: string;
  color: string;
  icon: string;
  members: Member[];
}

const DEFAULT_DIVISIONS: Division[] = [
  { id: "pm",          name: "Project Manager",       color: "#D4A017", icon: "👑", members: [] },
  { id: "finance",     name: "Finance",               color: "#14b8a6", icon: "💰", members: [] },
  { id: "sponsorship", name: "Sponsorship",           color: "#818cf8", icon: "🤝", members: [] },
  { id: "admin",       name: "Admin & Sekretariat",   color: "#f97316", icon: "📋", members: [] },
  { id: "logistics",   name: "Logistik",              color: "#10b981", icon: "🚚", members: [] },
  { id: "marketing",   name: "Marketing & Publikasi", color: "#ec4899", icon: "📣", members: [] },
  { id: "registration",name: "Registration",          color: "#60a5fa", icon: "✅", members: [] },
  { id: "operation",   name: "Operasional",           color: "#f43f5e", icon: "⚡", members: [] },
];

const COLORS = ["#D4A017","#14b8a6","#818cf8","#f97316","#10b981","#ec4899","#60a5fa","#f43f5e","#a78bfa","#34d399"];
const ICONS  = ["👑","💰","🤝","📋","🚚","📣","✅","⚡","🎯","🔑","📦","🌟","💡","🔧","📌"];

const s = {
  page:   { minHeight: "100vh", background: "#0a1628", fontFamily: "system-ui, sans-serif", color: "#f1f5f9" } as React.CSSProperties,
  nav:    { background: "rgba(10,22,40,0.98)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(212,160,23,0.3)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky" as const, top: 0, zIndex: 50 },
  wrap:   { maxWidth: 1400, margin: "0 auto", padding: "2rem 1.25rem" },
  input:  { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "0.6rem 0.9rem", fontSize: "0.88rem", color: "#f1f5f9", outline: "none", boxSizing: "border-box" as const },
  label:  { display: "block", fontSize: "0.72rem", color: "#64748b", marginBottom: "0.3rem", textTransform: "uppercase" as const, letterSpacing: "0.06em" },
  btnPri: { background: "linear-gradient(135deg,#D4A017,#B8860B)", border: "none", color: "#fff", borderRadius: 8, padding: "0.6rem 1.25rem", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" } as React.CSSProperties,
};

// ── Member Form Modal ─────────────────────────────────────────
function MemberModal({ onSave, onCancel, initial, divColor }: {
  onSave: (m: Omit<Member, "id">) => void;
  onCancel: () => void;
  initial?: Member;
  divColor: string;
}) {
  const [name,  setName]  = useState(initial?.name  || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [role,  setRole]  = useState(initial?.role  || "");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "#0d1f35", border: `1px solid ${divColor}40`, borderRadius: 16, padding: "2rem", width: "100%", maxWidth: 480 }}>
        <h3 style={{ fontWeight: 800, marginBottom: "1.5rem", color: divColor }}>
          {initial ? "✏️ Edit Anggota" : "➕ Tambah Anggota"}
        </h3>
        <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
          <div>
            <label style={s.label}>Nama Lengkap *</label>
            <input style={s.input} value={name} onChange={e => setName(e.target.value)} placeholder="Nama anggota" autoFocus/>
          </div>
          <div>
            <label style={s.label}>Jabatan / Role *</label>
            <input style={s.input} value={role} onChange={e => setRole(e.target.value)} placeholder="Contoh: Koordinator, Anggota, Wakil"/>
          </div>
          <div>
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@domain.com"/>
          </div>
          <div>
            <label style={s.label}>No. HP / WhatsApp</label>
            <input style={s.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="08xx-xxxx-xxxx"/>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button style={s.btnPri} onClick={() => {
            if (!name.trim() || !role.trim()) { toast.error("Nama dan jabatan wajib diisi"); return; }
            onSave({ name: name.trim(), email, phone, role: role.trim() });
          }}>
            {initial ? "Simpan" : "Tambah"}
          </button>
          <button style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#64748b", borderRadius: 8, padding: "0.6rem 1.25rem", fontSize: "0.85rem", cursor: "pointer", fontWeight: 600 }} onClick={onCancel}>
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Org Chart Node ────────────────────────────────────────────
function OrgNode({ member, color, isHead, onEdit, onDelete }: {
  member: Member; color: string; isHead?: boolean;
  onEdit: () => void; onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{
        background: isHead ? `linear-gradient(135deg, ${color}30, ${color}10)` : "rgba(255,255,255,0.04)",
        border: `${isHead ? 2 : 1.5}px solid ${color}${isHead ? "80" : "35"}`,
        borderRadius: 12,
        padding: "0.85rem 1rem",
        minWidth: 130, maxWidth: 170,
        textAlign: "center",
        boxShadow: isHead ? `0 0 20px ${color}25` : "none",
        transition: "all 0.2s",
        transform: hovered ? "translateY(-2px)" : "none",
      }}>
        {/* Avatar */}
        <div style={{
          width: isHead ? 44 : 36, height: isHead ? 44 : 36,
          borderRadius: "50%", margin: "0 auto 0.5rem",
          background: `${color}25`, border: `2px solid ${color}60`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: isHead ? "1.1rem" : "0.9rem", fontWeight: 800, color,
        }}>
          {member.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#f1f5f9", marginBottom: "0.2rem", lineHeight: 1.3 }}>
          {member.name}
        </div>
        <div style={{ fontSize: "0.7rem", color, fontWeight: 600 }}>{member.role}</div>
        {member.email && (
          <div style={{ fontSize: "0.65rem", color: "#475569", marginTop: "0.25rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
            {member.email}
          </div>
        )}

        {/* Action buttons on hover */}
        {hovered && (
          <div style={{ position: "absolute", top: -12, right: -8, display: "flex", gap: "0.3rem" }}>
            <button onClick={e => { e.stopPropagation(); onEdit(); }}
              style={{ width: 24, height: 24, borderRadius: "50%", background: "#1e3a5f", border: "1px solid rgba(255,255,255,0.2)", color: "#94a3b8", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ✏️
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete(); }}
              style={{ width: 24, height: 24, borderRadius: "50%", background: "#3f1212", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Division Column ───────────────────────────────────────────
function DivisionColumn({ div, onAddMember, onEditMember, onDeleteMember, onEditDiv, onDeleteDiv, navigate }: {
  div: Division;
  onAddMember: () => void;
  onEditMember: (id: string) => void;
  onDeleteMember: (id: string) => void;
  onEditDiv: () => void;
  onDeleteDiv: () => void;
  navigate: (path: string) => void;
}) {
  const isTopLevel = div.id === "pm";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 180, maxWidth: 200 }}>
      {/* Division header */}
      <div style={{
        background: `${div.color}18`, border: `1.5px solid ${div.color}50`,
        borderRadius: 10, padding: "0.6rem 0.85rem",
        display: "flex", alignItems: "center", gap: "0.5rem",
        marginBottom: div.members.length > 0 ? "0" : "0.5rem",
        width: "100%", justifyContent: "center", position: "relative",
      }}>
        <span style={{ fontSize: "1rem" }}>{div.icon}</span>
        <span style={{ fontWeight: 700, fontSize: "0.78rem", color: div.color }}>{div.name}</span>
        <div style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", display: "flex", gap: "0.2rem" }}>
          <button onClick={onEditDiv} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "0.7rem", padding: "0.15rem" }}>✏️</button>
          <button onClick={onDeleteDiv} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.7rem", padding: "0.15rem" }}>🗑️</button>
        </div>
      </div>

      {/* Connector to members */}
      {div.members.length > 0 && (
        <div style={{ width: 2, height: 16, background: `${div.color}40` }} />
      )}

      {/* Members */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0" }}>
        {div.members.map((member, i) => (
          <div key={member.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {i > 0 && <div style={{ width: 2, height: 10, background: `${div.color}30` }} />}
            <OrgNode
              member={member}
              color={div.color}
              isHead={i === 0}
              onEdit={() => onEditMember(member.id)}
              onDelete={() => onDeleteMember(member.id)}
            />
          </div>
        ))}
      </div>

      {/* Add member button */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: div.members.length > 0 ? 8 : 0 }}>
        {div.members.length > 0 && <div style={{ width: 2, height: 10, background: `${div.color}30` }} />}
        <button onClick={onAddMember} style={{
          background: "transparent", border: `1.5px dashed ${div.color}50`,
          color: div.color, borderRadius: 8, padding: "0.35rem 0.75rem",
          fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", gap: "0.3rem",
          transition: "all 0.2s",
        }}>
          + Anggota
        </button>
      </div>

      {/* Dashboard link */}
      <button onClick={() => navigate(`/divisi/${div.id}`)} style={{
        marginTop: "0.75rem", background: `${div.color}10`,
        border: `1px solid ${div.color}30`, color: div.color,
        borderRadius: 6, padding: "0.3rem 0.75rem", fontSize: "0.68rem",
        fontWeight: 600, cursor: "pointer",
      }}>
        Dashboard →
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function PanitiaManagement() {
  const [, navigate] = useLocation();

  // ── Password gate ─────────────────────────────────────────────
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("panitia_auth") === "1");
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);

  const [divisions, setDivisions] = useState<Division[]>(DEFAULT_DIVISIONS);
  const [loaded, setLoaded] = useState(false);

  // Modal state
  const [addingMember, setAddingMember]   = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<{ divId: string; memberId: string } | null>(null);
  const [editingDiv, setEditingDiv]       = useState<string | null>(null);
  const [editDivName, setEditDivName]     = useState("");
  const [editDivIcon, setEditDivIcon]     = useState("");
  const [showAddDiv, setShowAddDiv]       = useState(false);
  const [newDivName, setNewDivName]       = useState("");
  const [newDivColor, setNewDivColor]     = useState(COLORS[0]);
  const [newDivIcon, setNewDivIcon]       = useState(ICONS[0]);
  const [saving, setSaving]               = useState(false);
  const [viewMode, setViewMode]           = useState<"org" | "list">("org");

  // tRPC
  const configQuery   = trpc.event.getEventConfig.useQuery();
  const setConfigMutation = trpc.event.saveEventConfig.useMutation({
    onSuccess: () => { toast.success("Struktur panitia disimpan! ✅"); setSaving(false); },
    onError:   () => { toast.error("Gagal menyimpan"); setSaving(false); },
  });

  // Load dari DB
  useEffect(() => {
    if (configQuery.data && !loaded) {
      const raw = (configQuery.data as any).panitia_structure;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDivisions(parsed);
          }
        } catch {}
      }
      setLoaded(true);
    }
  }, [configQuery.data]);

  // ── Password gate render ──────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a1628", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(212,160,23,0.25)", borderRadius: 16, padding: "2.5rem 2rem", width: "100%", maxWidth: 380, textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔑</div>
          <div style={{ color: "#D4A017", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.25rem" }}>Grand Recruitment 2026</div>
          <div style={{ color: "#94a3b8", fontSize: "0.82rem", marginBottom: "1.75rem" }}>Portal Panitia — akses terbatas</div>
          <input
            type="password"
            placeholder="Password panitia"
            value={pwInput}
            onChange={e => { setPwInput(e.target.value); setPwError(false); }}
            onKeyDown={e => { if (e.key === "Enter") { if (pwInput === "GR2026@Panitia") { sessionStorage.setItem("panitia_auth", "1"); setAuthed(true); } else { setPwError(true); } } }}
            style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${pwError ? "#f43f5e" : "rgba(255,255,255,0.12)"}`, borderRadius: 8, padding: "0.65rem 0.9rem", fontSize: "0.9rem", color: "#f1f5f9", outline: "none", boxSizing: "border-box", marginBottom: "0.5rem" }}
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

  // Save ke DB
  const save = (divs: Division[]) => {
    setSaving(true);
    setConfigMutation.mutate({ panitia_structure: JSON.stringify(divs) });
  };

  const updateAndSave = (newDivs: Division[]) => {
    setDivisions(newDivs);
    save(newDivs);
  };

  // ── CRUD Helpers ────────────────────────────────────────────
  const addMember = (divId: string, member: Omit<Member, "id">) => {
    const id = `m-${Date.now()}`;
    const next = divisions.map(d => d.id === divId
      ? { ...d, members: [...d.members, { ...member, id }] } : d);
    updateAndSave(next);
    setAddingMember(null);
    toast.success("Anggota ditambahkan!");
  };

  const updateMember = (divId: string, memberId: string, member: Omit<Member, "id">) => {
    const next = divisions.map(d => d.id === divId
      ? { ...d, members: d.members.map(m => m.id === memberId ? { ...member, id: memberId } : m) } : d);
    updateAndSave(next);
    setEditingMember(null);
    toast.success("Data diperbarui!");
  };

  const deleteMember = (divId: string, memberId: string) => {
    if (!confirm("Hapus anggota ini?")) return;
    const next = divisions.map(d => d.id === divId
      ? { ...d, members: d.members.filter(m => m.id !== memberId) } : d);
    updateAndSave(next);
  };

  const updateDivName = (divId: string) => {
    if (!editDivName.trim()) return;
    const next = divisions.map(d => d.id === divId
      ? { ...d, name: editDivName.trim(), icon: editDivIcon || d.icon } : d);
    updateAndSave(next);
    setEditingDiv(null);
  };

  const deleteDiv = (divId: string) => {
    if (!confirm("Hapus divisi ini beserta semua anggotanya?")) return;
    updateAndSave(divisions.filter(d => d.id !== divId));
  };

  const addDivision = () => {
    if (!newDivName.trim()) { toast.error("Nama divisi wajib diisi"); return; }
    const next = [...divisions, {
      id: `div-${Date.now()}`,
      name: newDivName.trim(),
      color: newDivColor,
      icon: newDivIcon,
      members: [],
    }];
    updateAndSave(next);
    setNewDivName(""); setShowAddDiv(false);
    toast.success("Divisi ditambahkan!");
  };

  const totalMembers = divisions.reduce((s, d) => s + d.members.length, 0);
  const pmDiv        = divisions.find(d => d.id === "pm");
  const otherDivs    = divisions.filter(d => d.id !== "pm");
  const editingDivObj = editingDiv ? divisions.find(d => d.id === editingDiv) : null;

  return (
    <div style={s.page}>
      {/* Modals */}
      {addingMember && (
        <MemberModal
          divColor={divisions.find(d => d.id === addingMember)?.color || "#14b8a6"}
          onSave={m => addMember(addingMember, m)}
          onCancel={() => setAddingMember(null)}
        />
      )}
      {editingMember && (() => {
        const div = divisions.find(d => d.id === editingMember.divId);
        const member = div?.members.find(m => m.id === editingMember.memberId);
        if (!div || !member) return null;
        return (
          <MemberModal
            divColor={div.color}
            initial={member}
            onSave={m => updateMember(editingMember.divId, editingMember.memberId, m)}
            onCancel={() => setEditingMember(null)}
          />
        );
      })()}

      {/* Edit div modal */}
      {editingDiv && editingDivObj && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#0d1f35", border: `1px solid ${editingDivObj.color}40`, borderRadius: 16, padding: "2rem", width: "100%", maxWidth: 420 }}>
            <h3 style={{ fontWeight: 800, marginBottom: "1.5rem", color: editingDivObj.color }}>✏️ Edit Divisi</h3>
            <div style={{ marginBottom: "1rem" }}>
              <label style={s.label}>Nama Divisi</label>
              <input style={s.input} value={editDivName} onChange={e => setEditDivName(e.target.value)} autoFocus/>
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={s.label}>Icon</label>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {ICONS.map(ic => (
                  <button key={ic} onClick={() => setEditDivIcon(ic)}
                    style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${editDivIcon === ic ? editingDivObj.color : "rgba(255,255,255,0.1)"}`, background: editDivIcon === ic ? `${editingDivObj.color}20` : "transparent", fontSize: "1.1rem", cursor: "pointer" }}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button style={s.btnPri} onClick={() => updateDivName(editingDiv)}>Simpan</button>
              <button style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#64748b", borderRadius: 8, padding: "0.6rem 1.25rem", fontSize: "0.85rem", cursor: "pointer" }} onClick={() => setEditingDiv(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={s.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 32 }} />
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: "1rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#818cf8" }}>Struktur Organisasi Panitia</div>
            <div style={{ fontSize: "0.7rem", color: "#475569" }}>{divisions.length} divisi · {totalMembers} anggota</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {/* View toggle */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "0.25rem" }}>
            <button onClick={() => setViewMode("org")}
              style={{ padding: "0.3rem 0.75rem", borderRadius: 6, border: "none", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", background: viewMode === "org" ? "#818cf8" : "transparent", color: viewMode === "org" ? "#fff" : "#64748b" }}>
              🏢 Org Chart
            </button>
            <button onClick={() => setViewMode("list")}
              style={{ padding: "0.3rem 0.75rem", borderRadius: 6, border: "none", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", background: viewMode === "list" ? "#818cf8" : "transparent", color: viewMode === "list" ? "#fff" : "#64748b" }}>
              📋 List
            </button>
          </div>
          <button onClick={() => setShowAddDiv(true)} style={s.btnPri}>+ Divisi Baru</button>
          {saving && <span style={{ fontSize: "0.78rem", color: "#14b8a6" }}>⏳ Menyimpan...</span>}
          <button onClick={() => navigate("/boss")}
            style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", color: "#D4A017", borderRadius: 8, padding: "0.4rem 0.9rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
            ← Panel
          </button>
        </div>
      </nav>

      <div style={s.wrap}>
        {/* Add division form */}
        {showAddDiv && (
          <div style={{ background: "rgba(129,140,248,0.05)", border: "1px solid rgba(129,140,248,0.3)", borderRadius: 16, padding: "1.5rem", marginBottom: "2rem" }}>
            <div style={{ fontWeight: 700, color: "#818cf8", marginBottom: "1rem" }}>➕ Divisi Baru</div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={s.label}>Nama Divisi *</label>
                <input style={s.input} value={newDivName} onChange={e => setNewDivName(e.target.value)}
                  placeholder="Contoh: Divisi Konsumsi" autoFocus onKeyDown={e => e.key === "Enter" && addDivision()}/>
              </div>
              <div>
                <label style={s.label}>Icon</label>
                <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", maxWidth: 220 }}>
                  {ICONS.map(ic => (
                    <button key={ic} onClick={() => setNewDivIcon(ic)}
                      style={{ width: 32, height: 32, borderRadius: 6, border: `2px solid ${newDivIcon === ic ? "#818cf8" : "rgba(255,255,255,0.1)"}`, background: newDivIcon === ic ? "rgba(129,140,248,0.2)" : "transparent", fontSize: "1rem", cursor: "pointer" }}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={s.label}>Warna</label>
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", maxWidth: 160 }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => setNewDivColor(c)}
                      style={{ width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer", border: newDivColor === c ? "3px solid white" : "2px solid transparent" }}/>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                <button style={s.btnPri} onClick={addDivision}>Tambah</button>
                <button style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#64748b", borderRadius: 8, padding: "0.6rem 1rem", fontSize: "0.85rem", cursor: "pointer" }} onClick={() => setShowAddDiv(false)}>Batal</button>
              </div>
            </div>
          </div>
        )}

        {configQuery.isLoading ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#475569" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
            <div>Memuat struktur organisasi...</div>
          </div>
        ) : viewMode === "org" ? (

          /* ── ORG CHART VIEW ── */
          <div style={{ overflowX: "auto", paddingBottom: "2rem" }}>
            {/* Event name at top */}
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{ display: "inline-block", background: "rgba(212,160,23,0.1)", border: "1.5px solid rgba(212,160,23,0.4)", borderRadius: 12, padding: "0.75rem 2rem" }}>
                <div style={{ fontSize: "0.7rem", color: "#D4A017", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "0.2rem" }}>Panitia Pelaksana</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f1f5f9" }}>Grand Recruitment 2026</div>
                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Politeknik Pariwisata NHI Bandung</div>
              </div>
            </div>

            {/* Vertical connector from top box */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: 2, height: 24, background: "rgba(212,160,23,0.4)" }} />
            </div>

            {/* PM Division (center top) */}
            {pmDiv && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "0" }}>
                <DivisionColumn
                  div={pmDiv}
                  navigate={navigate}
                  onAddMember={() => setAddingMember(pmDiv.id)}
                  onEditMember={id => setEditingMember({ divId: pmDiv.id, memberId: id })}
                  onDeleteMember={id => deleteMember(pmDiv.id, id)}
                  onEditDiv={() => { setEditingDiv(pmDiv.id); setEditDivName(pmDiv.name); setEditDivIcon(pmDiv.icon); }}
                  onDeleteDiv={() => deleteDiv(pmDiv.id)}
                />
              </div>
            )}

            {/* Horizontal connector line */}
            {otherDivs.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 2, height: 24, background: "rgba(255,255,255,0.1)" }} />
                {/* Horizontal bar */}
                <div style={{ position: "relative", width: "100%", maxWidth: Math.min(otherDivs.length * 200, 1300) }}>
                  <div style={{ height: 2, background: "rgba(255,255,255,0.1)", width: "100%" }} />
                  {/* Vertical drops */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-around" }}>
                    {otherDivs.map(d => (
                      <div key={d.id} style={{ width: 2, height: 24, background: `${d.color}40` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Other divisions in a row */}
            <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "nowrap", overflowX: "auto", paddingTop: "1.5rem", paddingBottom: "1rem" }}>
              {otherDivs.map(div => (
                <DivisionColumn
                  key={div.id}
                  div={div}
                  navigate={navigate}
                  onAddMember={() => setAddingMember(div.id)}
                  onEditMember={id => setEditingMember({ divId: div.id, memberId: id })}
                  onDeleteMember={id => deleteMember(div.id, id)}
                  onEditDiv={() => { setEditingDiv(div.id); setEditDivName(div.name); setEditDivIcon(div.icon); }}
                  onDeleteDiv={() => deleteDiv(div.id)}
                />
              ))}
            </div>
          </div>

        ) : (

          /* ── LIST VIEW ── */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%,480px),1fr))", gap: "1.5rem" }}>
            {divisions.map(div => (
              <div key={div.id} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${div.color}30`, borderRadius: 16, overflow: "hidden" }}>
                <div style={{ background: `${div.color}12`, borderBottom: `1px solid ${div.color}25`, padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.4rem" }}>{div.icon}</span>
                    <div>
                      <div style={{ fontWeight: 800, color: div.color, fontSize: "0.95rem" }}>{div.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "#475569" }}>{div.members.length} anggota</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button onClick={() => navigate(`/divisi/${div.id}`)}
                      style={{ background: `${div.color}15`, border: `1px solid ${div.color}40`, color: div.color, borderRadius: 6, padding: "0.3rem 0.65rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
                      Dashboard →
                    </button>
                    <button onClick={() => { setEditingDiv(div.id); setEditDivName(div.name); setEditDivIcon(div.icon); }}
                      style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "0.3rem" }}>✏️</button>
                    <button onClick={() => deleteDiv(div.id)}
                      style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", padding: "0.3rem" }}>🗑️</button>
                  </div>
                </div>
                <div style={{ padding: "1rem 1.25rem" }}>
                  {div.members.length === 0 && (
                    <div style={{ textAlign: "center", padding: "0.75rem", color: "#334155", fontSize: "0.82rem" }}>Belum ada anggota</div>
                  )}
                  {div.members.map(m => (
                    <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.65rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${div.color}20`, border: `1.5px solid ${div.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: div.color, fontSize: "0.82rem" }}>
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{m.name}</div>
                          <div style={{ fontSize: "0.72rem", color: div.color }}>{m.role}</div>
                          {m.email && <div style={{ fontSize: "0.68rem", color: "#475569" }}>{m.email}</div>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.3rem" }}>
                        <button onClick={() => setEditingMember({ divId: div.id, memberId: m.id })}
                          style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "0.3rem" }}>✏️</button>
                        <button onClick={() => deleteMember(div.id, m.id)}
                          style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", padding: "0.3rem" }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setAddingMember(div.id)}
                    style={{ marginTop: "0.75rem", background: "transparent", border: `1px dashed ${div.color}50`, color: div.color, borderRadius: 8, padding: "0.5rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", width: "100%" }}>
                    + Tambah Anggota
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {totalMembers > 0 && (
          <div style={{ marginTop: "2.5rem", background: "rgba(129,140,248,0.04)", border: "1px solid rgba(129,140,248,0.15)", borderRadius: 16, padding: "1.5rem" }}>
            <div style={{ fontWeight: 700, color: "#818cf8", marginBottom: "1rem", fontSize: "0.95rem" }}>📊 Ringkasan — {totalMembers} Anggota Terdaftar</div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {divisions.filter(d => d.members.length > 0).map(div => (
                <div key={div.id} style={{ background: `${div.color}10`, border: `1px solid ${div.color}30`, borderRadius: 8, padding: "0.5rem 0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>{div.icon}</span>
                  <span style={{ fontSize: "0.8rem", color: div.color, fontWeight: 700 }}>{div.name}</span>
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>({div.members.length})</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1rem", fontSize: "0.78rem", color: "#334155", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#14b8a6" }}>✅ Tersimpan otomatis ke database</span>
              <span style={{ color: "#1e3a5f" }}>·</span>
              <span>Data tidak hilang meski browser ditutup</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
