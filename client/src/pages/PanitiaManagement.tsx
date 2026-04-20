import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

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

// ── Default divisions (can be customized) ─────────────────────
const DEFAULT_DIVISIONS: Division[] = [
  { id: "pm",           name: "Project Manager",      color: "#D4A017", icon: "👑", members: [] },
  { id: "finance",      name: "Finance",              color: "#14b8a6", icon: "💰", members: [] },
  { id: "sponsorship",  name: "Sponsorship",          color: "#818cf8", icon: "🤝", members: [] },
  { id: "admin",        name: "Admin & Sekretariat",  color: "#f97316", icon: "📋", members: [] },
  { id: "logistics",    name: "Logistik",             color: "#10b981", icon: "🚚", members: [] },
  { id: "marketing",    name: "Marketing & Publikasi",color: "#ec4899", icon: "📣", members: [] },
  { id: "registration", name: "Registration",         color: "#60a5fa", icon: "✅", members: [] },
  { id: "operation",    name: "Operasional",          color: "#f43f5e", icon: "⚡", members: [] },
];

const COLORS = ["#D4A017","#14b8a6","#818cf8","#f97316","#10b981","#ec4899","#60a5fa","#f43f5e","#a78bfa","#34d399"];

const s = {
  page:  { minHeight: "100vh", background: "#0a1628", fontFamily: "system-ui, sans-serif", color: "#f1f5f9" } as React.CSSProperties,
  nav:   { background: "rgba(10,22,40,0.98)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(212,160,23,0.3)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky" as const, top: 0, zIndex: 50 },
  wrap:  { maxWidth: 1200, margin: "0 auto", padding: "2rem 1.25rem" },
  card:  { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" },
  input: { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "0.6rem 0.9rem", fontSize: "0.88rem", color: "#f1f5f9", outline: "none" },
  label: { display: "block", fontSize: "0.75rem", color: "#64748b", marginBottom: "0.3rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  btnPri: { background: "linear-gradient(135deg,#D4A017,#B8860B)", border: "none", color: "#fff", borderRadius: 8, padding: "0.6rem 1.25rem", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" },
  btnOut: (color: string) => ({ background: "transparent", border: `1px solid ${color}40`, color, borderRadius: 8, padding: "0.4rem 0.9rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }),
};

function MemberForm({ onSave, onCancel, initial }: {
  onSave: (m: Omit<Member, "id">) => void;
  onCancel: () => void;
  initial?: Member;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [role, setRole] = useState(initial?.role || "");

  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "1.25rem", marginTop: "0.75rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <div>
          <label style={s.label}>Nama Lengkap *</label>
          <input style={s.input} value={name} onChange={e => setName(e.target.value)} placeholder="Nama anggota"/>
        </div>
        <div>
          <label style={s.label}>Jabatan / Role *</label>
          <input style={s.input} value={role} onChange={e => setRole(e.target.value)} placeholder="Contoh: Koordinator, Anggota"/>
        </div>
        <div>
          <label style={s.label}>Email</label>
          <input style={s.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="email@domain.com"/>
        </div>
        <div>
          <label style={s.label}>No. HP / WhatsApp</label>
          <input style={s.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="08xx-xxxx-xxxx"/>
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button style={s.btnPri} onClick={() => {
          if (!name || !role) { toast.error("Nama dan jabatan wajib diisi"); return; }
          onSave({ name, email, phone, role });
        }}>
          {initial ? "Simpan Perubahan" : "Tambah Anggota"}
        </button>
        <button style={{ ...s.btnOut("#94a3b8"), padding: "0.6rem 1rem" }} onClick={onCancel}>Batal</button>
      </div>
    </div>
  );
}

export default function PanitiaManagement() {
  const [, navigate] = useLocation();
  const [divisions, setDivisions] = useState<Division[]>(DEFAULT_DIVISIONS);
  const [addingMember, setAddingMember] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<{ divId: string; memberId: string } | null>(null);
  const [editingDiv, setEditingDiv] = useState<string | null>(null);
  const [editDivName, setEditDivName] = useState("");
  const [showAddDiv, setShowAddDiv] = useState(false);
  const [newDivName, setNewDivName] = useState("");
  const [newDivColor, setNewDivColor] = useState(COLORS[6]);

  const addMember = (divId: string, member: Omit<Member, "id">) => {
    const id = Date.now().toString();
    setDivisions(prev => prev.map(d => d.id === divId
      ? { ...d, members: [...d.members, { ...member, id }] }
      : d
    ));
    setAddingMember(null);
    toast.success("Anggota berhasil ditambahkan!");
  };

  const updateMember = (divId: string, memberId: string, member: Omit<Member, "id">) => {
    setDivisions(prev => prev.map(d => d.id === divId
      ? { ...d, members: d.members.map(m => m.id === memberId ? { ...member, id: memberId } : m) }
      : d
    ));
    setEditingMember(null);
    toast.success("Data anggota diperbarui!");
  };

  const deleteMember = (divId: string, memberId: string) => {
    setDivisions(prev => prev.map(d => d.id === divId
      ? { ...d, members: d.members.filter(m => m.id !== memberId) }
      : d
    ));
    toast.success("Anggota dihapus");
  };

  const updateDivName = (divId: string) => {
    if (!editDivName.trim()) return;
    setDivisions(prev => prev.map(d => d.id === divId ? { ...d, name: editDivName } : d));
    setEditingDiv(null);
    toast.success("Nama divisi diperbarui!");
  };

  const deleteDiv = (divId: string) => {
    setDivisions(prev => prev.filter(d => d.id !== divId));
    toast.success("Divisi dihapus");
  };

  const addDivision = () => {
    if (!newDivName.trim()) { toast.error("Nama divisi wajib diisi"); return; }
    const icons = ["🔧","📌","🎯","⚡","🌟","💡","🔑","📦"];
    const icon = icons[Math.floor(Math.random() * icons.length)];
    setDivisions(prev => [...prev, {
      id: Date.now().toString(),
      name: newDivName,
      color: newDivColor,
      icon,
      members: [],
    }]);
    setNewDivName("");
    setShowAddDiv(false);
    toast.success("Divisi baru ditambahkan!");
  };

  const totalMembers = divisions.reduce((s, d) => s + d.members.length, 0);

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 32 }} />
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: "1rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#818cf8" }}>Manajemen Panitia</div>
            <div style={{ fontSize: "0.7rem", color: "#475569" }}>Grand Recruitment 2026</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => navigate("/boss")}
            style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", color: "#D4A017", borderRadius: 8, padding: "0.4rem 0.9rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
            ← Panel Panitia
          </button>
        </div>
      </nav>

      <div style={s.wrap}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, marginBottom: "0.25rem" }}>
              Struktur Organisasi Panitia
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
              {divisions.length} divisi · {totalMembers} anggota terdaftar
            </p>
          </div>
          <button onClick={() => setShowAddDiv(true)} style={s.btnPri}>
            + Tambah Divisi
          </button>
        </div>

        {/* Add division form */}
        {showAddDiv && (
          <div style={{ ...s.card, border: "1px solid rgba(129,140,248,0.3)", background: "rgba(129,140,248,0.04)" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#818cf8", marginBottom: "1rem" }}>➕ Divisi Baru</div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={s.label}>Nama Divisi *</label>
                <input style={s.input} value={newDivName} onChange={e => setNewDivName(e.target.value)}
                  placeholder="Contoh: Divisi Konsumsi, Divisi Dekorasi"
                  onKeyDown={e => e.key === "Enter" && addDivision()} autoFocus/>
              </div>
              <div>
                <label style={s.label}>Warna</label>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => setNewDivColor(c)}
                      style={{ width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer", border: newDivColor === c ? "3px solid white" : "2px solid transparent", transition: "all 0.15s" }}/>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button style={s.btnPri} onClick={addDivision}>Tambah</button>
                <button style={{ ...s.btnOut("#94a3b8"), padding: "0.6rem 1rem" }} onClick={() => setShowAddDiv(false)}>Batal</button>
              </div>
            </div>
          </div>
        )}

        {/* Division cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 520px), 1fr))", gap: "1.5rem" }}>
          {divisions.map(div => (
            <div key={div.id} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${div.color}30`, borderRadius: 16, overflow: "hidden" }}>
              {/* Division header */}
              <div style={{ background: `${div.color}12`, borderBottom: `1px solid ${div.color}25`, padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {editingDiv === div.id ? (
                  <div style={{ display: "flex", gap: "0.5rem", flex: 1, marginRight: "1rem" }}>
                    <input style={{ ...s.input, padding: "0.4rem 0.75rem" }} value={editDivName}
                      onChange={e => setEditDivName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") updateDivName(div.id); if (e.key === "Escape") setEditingDiv(null); }}
                      autoFocus/>
                    <button style={s.btnPri} onClick={() => updateDivName(div.id)}>✓</button>
                    <button style={{ ...s.btnOut("#94a3b8"), padding: "0.4rem 0.75rem" }} onClick={() => setEditingDiv(null)}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.4rem" }}>{div.icon}</span>
                    <div>
                      <div style={{ fontWeight: 800, color: div.color, fontSize: "0.95rem" }}>{div.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#475569" }}>{div.members.length} anggota</div>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                  <button onClick={() => navigate(`/divisi/${div.id}`)}
                    style={{ background: `${div.color}15`, border: `1px solid ${div.color}40`, color: div.color, borderRadius: 6, padding: "0.3rem 0.65rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
                    Dashboard →
                  </button>
                  <button onClick={() => { setEditingDiv(div.id); setEditDivName(div.name); }}
                    style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "0.85rem", padding: "0.3rem 0.5rem" }}>✏️</button>
                  <button onClick={() => deleteDiv(div.id)}
                    style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "0.85rem", padding: "0.3rem 0.5rem" }}>🗑️</button>
                </div>
              </div>

              {/* Members list */}
              <div style={{ padding: "1rem 1.25rem" }}>
                {div.members.length === 0 && (
                  <div style={{ textAlign: "center", padding: "1rem", color: "#334155", fontSize: "0.82rem" }}>
                    Belum ada anggota — tambahkan di bawah
                  </div>
                )}

                {div.members.map(member => (
                  <div key={member.id}>
                    {editingMember?.divId === div.id && editingMember?.memberId === member.id ? (
                      <MemberForm
                        initial={member}
                        onSave={m => updateMember(div.id, member.id, m)}
                        onCancel={() => setEditingMember(null)}
                      />
                    ) : (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)", gap: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${div.color}20`, border: `1.5px solid ${div.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 700, color: div.color, flexShrink: 0 }}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: "0.88rem" }}>{member.name}</div>
                            <div style={{ fontSize: "0.75rem", color: div.color, fontWeight: 600 }}>{member.role}</div>
                            {(member.email || member.phone) && (
                              <div style={{ fontSize: "0.72rem", color: "#475569", marginTop: "0.15rem" }}>
                                {member.email}{member.email && member.phone ? " · " : ""}{member.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0 }}>
                          <button onClick={() => setEditingMember({ divId: div.id, memberId: member.id })}
                            style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "0.3rem" }}>✏️</button>
                          <button onClick={() => deleteMember(div.id, member.id)}
                            style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", padding: "0.3rem" }}>🗑️</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add member form */}
                {addingMember === div.id ? (
                  <MemberForm
                    onSave={m => addMember(div.id, m)}
                    onCancel={() => setAddingMember(null)}
                  />
                ) : (
                  <button onClick={() => { setAddingMember(div.id); setEditingMember(null); }}
                    style={{ marginTop: "0.75rem", background: "transparent", border: `1px dashed ${div.color}50`, color: div.color, borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", width: "100%", transition: "all 0.2s" }}>
                    + Tambah Anggota
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Org chart summary */}
        {totalMembers > 0 && (
          <div style={{ ...s.card, marginTop: "2rem" }}>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#818cf8", marginBottom: "1.25rem" }}>📊 Ringkasan Struktur Organisasi</div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {divisions.filter(d => d.members.length > 0).map(div => (
                <div key={div.id} style={{ background: `${div.color}10`, border: `1px solid ${div.color}30`, borderRadius: 10, padding: "0.6rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1rem" }}>{div.icon}</span>
                  <span style={{ fontSize: "0.82rem", color: div.color, fontWeight: 700 }}>{div.name}</span>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>({div.members.length})</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1rem", padding: "0.85rem 1rem", background: "rgba(129,140,248,0.06)", borderRadius: 8, fontSize: "0.82rem", color: "#818cf8" }}>
              💡 Data struktur organisasi ini terhubung ke Dashboard Divisi masing-masing. Setiap anggota bisa mengakses checklist dan timeline divisinya.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
