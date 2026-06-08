import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { openIdCardForPrint } from "@/lib/invoiceGenerator";
import { supabase, BUCKET } from "@/lib/supabase";

// ── Upload langsung ke Supabase dari browser (bypass server) ──
async function uploadFile(file: File, type: "foto" | "cv" | "ktm" | "sertifikat", registrationId: string): Promise<string | null> {
  try {
    const ext  = file.name.split(".").pop()?.toLowerCase() || "jpg";
    // Sanitasi path: ganti karakter non-ASCII agar Supabase tidak reject
    const CHAR_MAP: Record<string, string> = {
      'İ':'I','ı':'i','Ğ':'G','ğ':'g','Ş':'S','ş':'s',
      'Ü':'U','ü':'u','Ö':'O','ö':'o','Ç':'C','ç':'c',
    };
    const safeId = registrationId.split('').map(c => CHAR_MAP[c] ?? c).join('').replace(/[^a-zA-Z0-9\-_.]/g, '_');
    const path = `jobseeker/${safeId}/${type}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) {
      console.error("[Supabase upload error]", error.message);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error("[upload exception]", err);
    return null;
  }
}

const fmt = (d: any) => d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—";

const s = {
  page:  { minHeight: "100vh", background: "#0a1628", fontFamily: "system-ui, sans-serif", color: "#f1f5f9" } as React.CSSProperties,
  nav:   { background: "rgba(10,22,40,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(212,160,23,0.2)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky" as const, top: 0, zIndex: 50 },
  wrap:  { maxWidth: 900, margin: "0 auto", padding: "2rem 1.25rem" },
  card:  { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" },
  gold:  { background: "rgba(212,160,23,0.04)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" },
  secHd: { fontSize: "1rem", fontWeight: 700, color: "#D4A017", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" } as React.CSSProperties,
  label: { fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "0.25rem" },
  tab:   (active: boolean) => ({ padding: "0.6rem 1.25rem", borderRadius: 8, border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, background: active ? "#D4A017" : "transparent", color: active ? "#fff" : "#64748b", transition: "all 0.2s", whiteSpace: "nowrap" as const }),
};

type TabId = "profil" | "consent" | "dokumen" | "lowongan";

export default function JobseekerDashboard() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>("profil");
  const [sessionData, setSessionData] = useState<{ registrationId: string; email: string } | null>(null);
  const [jobseeker, setJobseeker] = useState<any>(null);
  const [consent2, setConsent2] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem("jobseeker_session");
    if (!session) { navigate("/jobseeker/login"); return; }
    setSessionData(JSON.parse(session));
  }, []);

  const loginQuery = trpc.event.loginJobseeker.useQuery(
    { registrationId: sessionData?.registrationId || "", email: sessionData?.email || "" },
    { enabled: !!sessionData, retry: false }
  );

  const vacanciesQuery = trpc.event.getVacanciesForJobseeker.useQuery(
    { registrationId: sessionData?.registrationId || "" },
    { enabled: !!sessionData?.registrationId && activeTab === "lowongan", retry: false }
  );

  useEffect(() => {
    if (loginQuery.data) {
      setJobseeker(loginQuery.data);
      setConsent2(loginQuery.data.consent2 || false);
    } else if (loginQuery.isFetched && !loginQuery.data) {
      navigate("/jobseeker/login");
    }
  }, [loginQuery.data, loginQuery.isFetched]);

  const handleLogout = () => {
    localStorage.removeItem("jobseeker_session");
    toast.success("Berhasil logout");
    navigate("/jobseeker/login");
  };

  const handlePrintIdCard = async () => {
    if (!jobseeker) return;
    // Convert foto URL to base64 so it works in blob popup window
    let fotoBase64: string | undefined = undefined;
    if (jobseeker.fotoUrl) {
      try {
        const res = await fetch(jobseeker.fotoUrl);
        const blob = await res.blob();
        fotoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch {}
    }
    openIdCardForPrint({
      registrationId: sessionData?.registrationId || "",
      namaLengkap: jobseeker.namaLengkap,
      institusi: jobseeker.institusi,
      jurusan: jobseeker.jurusan,
      bidangMinat: jobseeker.minatKerja || jobseeker.bidangMinat,
      status: jobseeker.statusKerja || jobseeker.status,
      fotoUrl: fotoBase64,
    });
  };

  const [docUploading, setDocUploading] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    namaLengkap: "", nik: "", whatsapp: "", kota: "",
    institusi: "", jurusan: "", tahunLulus: "",
    minatKerja: "", statusKerja: "",
  });

  const updateMutation = trpc.event.updateJobseeker.useMutation({
    onSuccess: () => {
      setJobseeker((prev: any) => ({ ...prev, ...editForm, phone: editForm.whatsapp }));
      setEditMode(false);
      toast.success("Data diri berhasil diperbarui!");
    },
    onError: () => toast.error("Gagal menyimpan perubahan"),
  });

  const deleteDocMutation = trpc.event.deleteJobseekerDocument.useMutation({
    onSuccess: (_, vars) => {
      setJobseeker((prev: any) => ({ ...prev, [`${vars.type}Url`]: null }));
      toast.success("Dokumen dihapus!");
    },
    onError: () => toast.error("Gagal menghapus dokumen"),
  });

  const handleEdit = () => {
    setEditForm({
      namaLengkap: jobseeker?.namaLengkap  || "",
      nik:         jobseeker?.nik          || "",
      whatsapp:    jobseeker?.whatsapp     || jobseeker?.phone || "",
      kota:        jobseeker?.kota         || "",
      institusi:   jobseeker?.institusi    || "",
      jurusan:     jobseeker?.jurusan      || "",
      tahunLulus:  jobseeker?.tahunLulus   || "",
      minatKerja:  jobseeker?.minatKerja   || jobseeker?.bidangMinat || "",
      statusKerja: jobseeker?.statusKerja  || jobseeker?.status || "",
    });
    setEditMode(true);
  };

  const handleSaveEdit = () => {
    if (!sessionData?.registrationId) return;
    // Simpan whatsapp ke keduanya
    updateMutation.mutate({
      registrationId: sessionData.registrationId,
      namaLengkap: editForm.namaLengkap || undefined,
      nik:         editForm.nik         || undefined,
      whatsapp:    editForm.whatsapp    || undefined,
      phone:       editForm.whatsapp    || undefined,
      kota:        editForm.kota        || undefined,
      institusi:   editForm.institusi   || undefined,
      jurusan:     editForm.jurusan     || undefined,
      tahunLulus:  editForm.tahunLulus  || undefined,
      minatKerja:  (editForm.minatKerja as any)  || undefined,
      statusKerja: (editForm.statusKerja as any) || undefined,
    });
  };
  const uploadingRef = useRef(false);

  const handleDocUpload = async (
    file: File,
    type: "foto" | "cv" | "ktm" | "sertifikat"
  ) => {
    if (uploadingRef.current) return; // prevent concurrent uploads
    console.log("[upload] start type=" + type + " regId=" + sessionData?.registrationId);
    uploadingRef.current = true;
    setDocUploading(type);
    toast.loading(`Mengupload ${type}...`, { id: `upload-${type}` });
    const url = await uploadFile(file, type, sessionData?.registrationId || "");
    console.log("[upload] result url=" + url);
    toast.dismiss(`upload-${type}`);
    if (!url) {
      toast.error("Upload gagal", { description: "Format harus JPG, PNG, WEBP, atau PDF. Maks 20MB." });
      setDocUploading(null);
      uploadingRef.current = false;
      return;
    }
    // Update jobseeker doc URL in DB
    try {
      const res = await fetch("/api/upload/update-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: sessionData?.registrationId, type, url }),
      });
      const json = await res.json().catch(() => ({ success: false }));
      if (!json.success) throw new Error("DB update gagal");
    } catch {
      toast.error("Upload berhasil tapi gagal disimpan ke database. Coba lagi.");
      setDocUploading(null);
      uploadingRef.current = false;
      return;
    }
    // Update local state
    setJobseeker((prev: any) => ({ ...prev, [`${type}Url`]: url }));
    toast.success(`${type === "foto" ? "Foto" : type === "cv" ? "CV" : type === "ktm" ? "KTP/KTM" : "Sertifikat"} berhasil diupload!`);
    setDocUploading(null);
    uploadingRef.current = false;
  };

  if (!jobseeker) return (
    <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#64748b" }}>Memuat data...</p>
    </div>
  );

  const statusLabel: Record<string, string> = {
    belum_bekerja: "Baru Lulus",
    sedang_bekerja: "Sedang Bekerja",
    pernah_bekerja: "Pernah Bekerja",
    mahasiswa: "Mahasiswa Aktif",
    fresh_graduate: "Fresh Graduate",
    alumni_nhi: "Alumni NHI Bandung",
    umum: "Pencari Kerja Umum",
  };

  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={s.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 32 }} />
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: "1rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{jobseeker.namaLengkap}</div>
            <div style={{ fontSize: "0.72rem", color: "#64748b", fontFamily: "monospace" }}>{sessionData?.registrationId}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", borderRadius: 8, padding: "0.4rem 1rem", fontSize: "0.82rem", cursor: "pointer" }}>
          Logout
        </button>
      </nav>

      <div style={s.wrap}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, marginBottom: "0.25rem" }}>
            Dashboard Jobseeker
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Grand Recruitment 2026 · 8–9 Juni · Dome NHI Bandung</p>
        </div>

        {/* Registration ID card */}
        <div style={{ background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.25)", borderRadius: 12, padding: "1rem 1.5rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.72rem", color: "#D4A017", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>ID Pendaftaran</div>
            <div style={{ fontWeight: 800, color: "#D4A017", fontSize: "1.3rem", fontFamily: "monospace" }}>{sessionData?.registrationId}</div>
            <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "0.2rem" }}>Simpan ID ini untuk check-in di hari H</div>
          </div>
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
            <div style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.3)", borderRadius: 8, padding: "0.4rem 1rem", color: "#14b8a6", fontWeight: 700, fontSize: "0.85rem" }}>
              ✅ Terdaftar
            </div>
            <button onClick={handlePrintIdCard}
              style={{ background: "linear-gradient(135deg,#D4A017,#B8860B)", border: "none", color: "#fff", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const }}>
              🪪 Cetak ID Card
            </button>
          </div>
        </div>

        {/* Banner Dokumen */}
        {(() => {
          const missingDocs = [
            !jobseeker.cvUrl,
            !jobseeker.ktmUrl,
          ].filter(Boolean).length;
          if (missingDocs === 0) return null;
          return (
            <div style={{ background: "rgba(212,160,23,0.07)", border: "1px solid rgba(212,160,23,0.3)", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
              <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>💡</span>
              <div>
                <div style={{ fontWeight: 700, color: "#D4A017", fontSize: "0.9rem", marginBottom: "0.3rem" }}>
                  Tahukah kamu?
                </div>
                <div style={{ fontSize: "0.83rem", color: "#cbd5e1", lineHeight: 1.75 }}>
                  HRD menyukai kandidat yang melengkapi dokumen dirinya sendiri saat registrasi dan melamar kerja. Jangan lupa lengkapi dokumen kamu ya!{" "}
                  <span
                    onClick={() => setActiveTab("dokumen")}
                    style={{ color: "#D4A017", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
                    Lengkapi sekarang →
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "0.5rem", marginBottom: "1.5rem", overflowX: "auto" }}>
          {([
            { id: "profil" as TabId, label: "👤 Profil Saya" },
            { id: "consent" as TabId, label: "🔒 Consent Data" },
            { id: "dokumen" as TabId, label: "📎 Dokumen" },
            { id: "lowongan" as TabId, label: "💼 Lowongan" },
          ]).map(tab => (
            <button key={tab.id} style={s.tab(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: PROFIL ── */}
        {activeTab === "profil" && (
          <div>
            {/* ── Notifikasi Interview Banner ── */}
            <div style={{ background: "rgba(37,211,102,0.07)", border: "1px solid rgba(37,211,102,0.25)", borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
              <div style={{ fontSize: "1.5rem", flexShrink: 0 }}>📲</div>
              <div>
                <div style={{ fontWeight: 700, color: "#25d366", fontSize: "0.88rem", marginBottom: "0.3rem" }}>Notifikasi Panggilan Interview via WhatsApp</div>
                <div style={{ fontSize: "0.78rem", color: "#64748b", lineHeight: 1.7 }}>
                  Jika employer memanggil kamu untuk interview pada hari H, kamu akan mendapat notifikasi langsung ke WhatsApp.
                  Pastikan nomor WhatsApp di profil kamu <strong style={{ color: "#f1f5f9" }}>aktif dan benar</strong>.
                </div>
                {!jobseeker?.whatsapp && (
                  <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#f97316", fontWeight: 600 }}>
                    ⚠️ Nomor WhatsApp belum diisi — klik Edit Data untuk menambahkan.
                  </div>
                )}
              </div>
            </div>
            <div style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div style={s.secHd}>👤 Data Diri</div>
                {!editMode && (
                  <button onClick={handleEdit}
                    style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.3)", color: "#14b8a6", borderRadius: 8, padding: "0.4rem 0.9rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                    ✏️ Edit Data
                  </button>
                )}
              </div>

              {editMode ? (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                    {/* Email — tidak bisa diubah */}
                    <div>
                      <div style={s.label}>Email <span style={{ color: "#334155", fontSize: "0.65rem" }}>(tidak bisa diubah)</span></div>
                      <div style={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem" }}>{jobseeker.email}</div>
                    </div>
                  </div>

                  {/* Text fields */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "1rem", marginBottom: "1rem" }}>
                    {[
                      { label: "Nama Lengkap", key: "namaLengkap", placeholder: "Nama sesuai KTP" },
                      { label: "NIK / No. Identitas", key: "nik", placeholder: "16 digit NIK" },
                      { label: "No. WhatsApp", key: "whatsapp", placeholder: "08xx-xxxx-xxxx" },
                      { label: "Kota", key: "kota", placeholder: "Bandung" },
                      { label: "Institusi", key: "institusi", placeholder: "Nama universitas/sekolah" },
                      { label: "Program Studi", key: "jurusan", placeholder: "Nama jurusan" },
                      { label: "Tahun Lulus", key: "tahunLulus", placeholder: "2024" },
                    ].map(field => (
                      <div key={field.key}>
                        <div style={s.label}>{field.label}</div>
                        <input
                          style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(20,184,166,0.3)", borderRadius: 8, padding: "0.6rem 0.9rem", fontSize: "0.88rem", color: "#f1f5f9", outline: "none", boxSizing: "border-box" }}
                          value={(editForm as any)[field.key]}
                          onChange={e => setEditForm(p => ({ ...p, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Select fields */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                    <div>
                      <div style={s.label}>Status Kerja</div>
                      <select value={editForm.statusKerja}
                        onChange={e => setEditForm(p => ({ ...p, statusKerja: e.target.value }))}
                        style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(20,184,166,0.3)", borderRadius: 8, padding: "0.6rem 0.9rem", fontSize: "0.88rem", color: "#f1f5f9", outline: "none" }}>
                        <option value="">— Pilih status —</option>
                        <option value="belum_bekerja">Belum Bekerja</option>
                        <option value="pernah_bekerja">Pernah Bekerja</option>
                        <option value="sedang_bekerja">Sedang Bekerja</option>
                      </select>
                    </div>
                    <div>
                      <div style={s.label}>Minat Kerja</div>
                      <select value={editForm.minatKerja}
                        onChange={e => setEditForm(p => ({ ...p, minatKerja: e.target.value }))}
                        style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(20,184,166,0.3)", borderRadius: 8, padding: "0.6rem 0.9rem", fontSize: "0.88rem", color: "#f1f5f9", outline: "none" }}>
                        <option value="">— Pilih minat —</option>
                        <option value="dalam_negeri">Dalam Negeri</option>
                        <option value="luar_negeri">Luar Negeri</option>
                        <option value="keduanya">Keduanya</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button onClick={handleSaveEdit} disabled={updateMutation.isPending}
                      style={{ background: "linear-gradient(135deg,#14b8a6,#0d9488)", border: "none", color: "#fff", borderRadius: 8, padding: "0.65rem 1.5rem", fontSize: "0.88rem", fontWeight: 700, cursor: updateMutation.isPending ? "not-allowed" : "pointer", opacity: updateMutation.isPending ? 0.7 : 1 }}>
                      {updateMutation.isPending ? "⏳ Menyimpan..." : "💾 Simpan Perubahan"}
                    </button>
                    <button onClick={() => setEditMode(false)}
                      style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", borderRadius: 8, padding: "0.65rem 1.25rem", fontSize: "0.88rem", cursor: "pointer" }}>
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
                  {[
                    { label: "Nama Lengkap", val: jobseeker.namaLengkap },
                    { label: "Email", val: jobseeker.email },
                    { label: "No. WhatsApp / HP", val: jobseeker.whatsapp || jobseeker.phone },
                    { label: "Status", val: statusLabel[jobseeker.statusKerja || jobseeker.status] || jobseeker.statusKerja || jobseeker.status },
                    { label: "Kota", val: jobseeker.kota || "—" },
                    { label: "Institusi", val: jobseeker.institusi || "—" },
                    { label: "Program Studi", val: jobseeker.jurusan || "—" },
                    { label: "Bidang Minat", val: jobseeker.minatKerja || jobseeker.bidangMinat || "—" },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={s.label}>{item.label}</div>
                      <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: "0.9rem" }}>{item.val}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Event info */}
            <div style={s.gold}>
              <div style={s.secHd}>📅 Informasi Event</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", fontSize: "0.88rem" }}>
                {[
                  { label: "Nama Event", val: "Grand Recruitment 2026" },
                  { label: "Tanggal", val: "8–9 Juni 2026" },
                  { label: "Lokasi", val: "Gedung Dome NHI Bandung" },
                  { label: "Jam Buka", val: "08.00 – 17.00 WIB" },
                  { label: "Dress Code", val: "Formal / Business Casual" },
                  { label: "Biaya Masuk", val: "GRATIS" },
                ].map(item => (
                  <div key={item.label}>
                    <div style={s.label}>{item.label}</div>
                    <div style={{ fontWeight: 600, color: item.label === "Biaya Masuk" ? "#14b8a6" : "#f1f5f9" }}>{item.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "1rem", padding: "0.85rem 1rem", background: "rgba(212,160,23,0.08)", borderRadius: 8, fontSize: "0.82rem", color: "#fde68a", lineHeight: 1.7 }}>
                📌 Tunjukkan <strong>Registration ID</strong> kamu saat check-in di pintu masuk. Konfirmasi pendaftaran sudah dikirim ke email <strong>{jobseeker.email}</strong>.
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: CONSENT ── */}
        {activeTab === "consent" && (
          <div>
            {/* UU PDP info */}
            <div style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ fontWeight: 700, color: "#14b8a6", marginBottom: "0.5rem" }}>🔒 Hak Anda atas Data Pribadi</div>
              <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.7 }}>
                Sesuai <strong style={{ color: "#f1f5f9" }}>UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi</strong>, Anda berhak mengubah persetujuan penggunaan data Anda kapan saja.
              </p>
            </div>

            {/* Layer 1 */}
            <div style={s.gold}>
              <div style={{ fontSize: "0.75rem", color: "#D4A017", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
                Consent Layer 1 — Employer Offline GR2026
              </div>
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: jobseeker.consent1 ? "#D4A017" : "rgba(255,255,255,0.1)", border: `2px solid ${jobseeker.consent1 ? "#D4A017" : "rgba(255,255,255,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                  {jobseeker.consent1 && <span style={{ color: "#fff", fontSize: "0.75rem", fontWeight: 700 }}>✓</span>}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#f1f5f9", marginBottom: "0.4rem" }}>Profil dapat dilihat employer offline GR2026</div>
                  <div style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.7 }}>
                    Persetujuan ini <strong style={{ color: "#f97316" }}>wajib</strong> untuk mengikuti GR2026. Tidak dapat diubah setelah pendaftaran dikonfirmasi.
                  </div>
                </div>
              </div>
            </div>

            {/* Layer 2 */}
            <div style={s.card}>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
                Consent Layer 2 — Employer Online (Opsional)
              </div>
              <label style={{ display: "flex", gap: "1rem", cursor: "pointer", alignItems: "flex-start" }}>
                <input type="checkbox" checked={consent2} onChange={e => setConsent2(e.target.checked)}
                  style={{ width: 20, height: 20, marginTop: 2, accentColor: "#818cf8", flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, color: "#f1f5f9", marginBottom: "0.4rem" }}>
                    Profil dapat dibagikan ke employer online
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.7 }}>
                    Izinkan profil Anda diakses oleh perusahaan yang berpartisipasi secara virtual. Anda bisa mengubah pilihan ini kapan saja.
                  </div>
                </div>
              </label>

              {consent2 !== jobseeker.consent2 && (
                <button
                  onClick={() => {
                    toast.success(consent2 ? "Consent Layer 2 diaktifkan" : "Consent Layer 2 dinonaktifkan");
                    // TODO: save to DB when endpoint ready
                  }}
                  style={{ marginTop: "1.25rem", background: "linear-gradient(135deg,#818cf8,#6366f1)", border: "none", color: "#fff", borderRadius: 10, padding: "0.75rem 1.5rem", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer" }}>
                  Simpan Perubahan Consent
                </button>
              )}

              <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.2)", borderRadius: 8, fontSize: "0.8rem", color: "#a5b4fc" }}>
                🚧 Fitur Employer Online sedang dalam pengembangan.
              </div>
            </div>

            {/* Rights */}
            <div style={s.card}>
              <div style={{ fontWeight: 700, color: "#94a3b8", marginBottom: "0.75rem", fontSize: "0.85rem" }}>Hak-hak Anda sebagai Subjek Data (UU PDP):</div>
              {[
                "✓ Hak mengakses data pribadi yang kami simpan",
                "✓ Hak mengoreksi data yang tidak akurat",
                "✓ Hak menarik persetujuan kapan saja melalui dashboard ini",
                "✓ Hak meminta penghapusan data setelah event selesai",
                "✓ Data tidak akan dijual atau dibagikan ke pihak ketiga di luar event",
              ].map(r => (
                <div key={r} style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "0.4rem" }}>{r}</div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: DOKUMEN ── */}
        {activeTab === "dokumen" && (
          <div style={s.card}>
            <div style={s.secHd}>📎 Dokumen Saya</div>

            {/* Info consent dokumen */}
            <div style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 12, padding: "1.1rem 1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ fontWeight: 700, color: "#14b8a6", marginBottom: "0.5rem", fontSize: "0.88rem" }}>📄 Informasi Penyimpanan Dokumen</div>
              <p style={{ fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.75, margin: 0 }}>
                Dokumen yang kamu upload akan digunakan untuk proses rekrutmen di GR2026.
                Jika kamu <strong style={{ color: "#f1f5f9" }}>tidak keberatan</strong> dokumen kamu disimpan dan dihubungi apabila ada lowongan kerja baru, silakan klik <strong style={{ color: "#14b8a6" }}>Simpan Dokumen</strong>.<br/>
                Jika kamu <strong style={{ color: "#f1f5f9" }}>keberatan</strong>, silakan klik <strong style={{ color: "#f87171" }}>Hapus Dokumen</strong> kapan saja — data kamu akan dihapus sepenuhnya.
              </p>
            </div>

            <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1.5rem", lineHeight: 1.7 }}>
              Upload atau ganti dokumen di sini. Format yang diterima: <strong style={{ color: "#f1f5f9" }}>JPG, PNG, WEBP, PDF</strong> · Maks 20MB per file.
            </p>

            {([
              { label: "Pas Foto Terbaru", field: "fotoUrl", type: "foto" as const, required: true, hint: "Foto formal · JPG/PNG/WEBP · Maks 20MB", accept: "image/*", isImg: true },
              { label: "CV / Resume", field: "cvUrl", type: "cv" as const, required: true, hint: "Maks 5 halaman · PDF · Maks 20MB", accept: ".pdf", isImg: false },
              { label: "KTP / Kartu Mahasiswa", field: "ktmUrl", type: "ktm" as const, required: true, hint: "Scan atau foto jelas · JPG/PNG/PDF", accept: "image/*,.pdf", isImg: false },
              { label: "Sertifikat Pendukung", field: "sertifikatUrl", type: "sertifikat" as const, required: false, hint: "Opsional · PDF/JPG", accept: "image/*,.pdf", isImg: false },
            ] as any[]).map((doc: any) => {
              const fileUrl: string | null = jobseeker ? (jobseeker as any)[doc.field] : null;
              const uploaded = !!fileUrl;
              const isUploading = docUploading === doc.type;
              const isImgFile = fileUrl ? /\.(jpg|jpeg|png|webp)$/i.test(fileUrl) : false;
              return (
                <div key={doc.label} style={{ padding: "1rem 1.25rem", background: uploaded ? "rgba(20,184,166,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${uploaded ? "rgba(20,184,166,0.2)" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", flexWrap: "wrap" as const }}>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flex: 1, minWidth: 0 }}>
                      {uploaded ? (
                        isImgFile ? (
                          <a href={fileUrl!} target="_blank" rel="noopener noreferrer">
                            <img src={fileUrl!} alt={doc.label}
                              style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover" as const, border: "2px solid rgba(20,184,166,0.4)", flexShrink: 0, cursor: "pointer" }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}/>
                          </a>
                        ) : (
                          <a href={fileUrl!} target="_blank" rel="noopener noreferrer"
                            style={{ width: 52, height: 52, borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.3)", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", flexShrink: 0, textDecoration: "none" }}>
                            <span style={{ fontSize: "1.4rem" }}>📄</span>
                            <span style={{ fontSize: "0.55rem", color: "#fca5a5", fontWeight: 700 }}>FILE</span>
                          </a>
                        )
                      ) : (
                        <div style={{ width: 52, height: 52, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "2px dashed rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1.4rem" }}>
                          {doc.isImg ? "🖼️" : "📄"}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: "0.9rem" }}>
                          {doc.label}{doc.required && <span style={{ color: "#ef4444", fontSize: "0.75rem" }}> *</span>}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.15rem" }}>{doc.hint}</div>
                        {uploaded && (
                          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.3rem", alignItems: "center" }}>
                            <span style={{ fontSize: "0.72rem", color: "#14b8a6", fontWeight: 700 }}>✅ Terupload</span>
                            <a href={fileUrl!} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: "0.72rem", color: "#60a5fa", textDecoration: "none", fontWeight: 600 }}>👁️ Lihat →</a>
                            <button
                              onClick={() => { if (confirm(`Hapus ${doc.label}? Dokumen tidak bisa dikembalikan.`)) deleteDocMutation.mutate({ registrationId: sessionData?.registrationId || "", type: doc.type }); }}
                              style={{ fontSize: "0.72rem", color: "#f87171", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 6, cursor: "pointer", fontWeight: 700, padding: "0.15rem 0.5rem" }}>
                              Hapus Dokumen
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <label style={{ background: uploaded ? "transparent" : "linear-gradient(135deg,#0d9488,#14b8a6)", border: uploaded ? "1px solid rgba(20,184,166,0.4)" : "none", color: uploaded ? "#14b8a6" : "#fff", borderRadius: 8, padding: "0.45rem 1rem", fontSize: "0.78rem", fontWeight: 700, cursor: isUploading ? "not-allowed" : "pointer", opacity: isUploading ? 0.6 : 1, whiteSpace: "nowrap" as const, flexShrink: 0, alignSelf: "center" as const }}>
                      {isUploading ? "⏳ Uploading..." : uploaded ? "🔄 Ganti" : "Simpan Dokumen"}
                      <input type="file" accept={doc.accept} style={{ display: "none" }} disabled={!!docUploading}
                        onChange={(e) => { if (docUploading) return; const file = e.target.files?.[0]; if (file) handleDocUpload(file, doc.type); e.target.value = ""; }}/>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "lowongan" && (
          <div>
            <div style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div style={s.secHd}>💼 Lowongan Tersedia</div>
                {vacanciesQuery.data && (
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{vacanciesQuery.data.length} perusahaan</span>
                )}
              </div>
              <div style={{ background: "rgba(212,160,23,0.04)", border: "1px solid rgba(212,160,23,0.15)", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.7 }}>
                ℹ️ Daftar lowongan dari perusahaan yang telah terkonfirmasi hadir di GR2026. Kunjungi booth mereka langsung di event untuk melamar.
              </div>

              {vacanciesQuery.isLoading && (
                <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>⏳ Memuat lowongan...</p>
              )}

              {vacanciesQuery.error && (() => {
                const msg = (vacanciesQuery.error as any)?.message;
                const label = msg === "ACCESS_NOT_OPEN" ? "Akses lowongan belum dibuka. Cek kembali menjelang hari event."
                  : msg === "ACCESS_CLOSED" ? "Akses lowongan sudah ditutup."
                  : "Gagal memuat lowongan. Coba refresh halaman.";
                return <p style={{ color: "#f87171", textAlign: "center", padding: "2rem" }}>🔒 {label}</p>;
              })()}

              {vacanciesQuery.data && vacanciesQuery.data.length === 0 && (
                <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>Belum ada lowongan yang dipublikasikan.</p>
              )}

              {vacanciesQuery.data && vacanciesQuery.data.map((emp: any) => {
                const positions = Array.isArray(emp.positions) ? emp.positions
                  : (typeof emp.positions === "string" ? (() => { try { return JSON.parse(emp.positions); } catch { return []; } })() : []);
                const vacFiles = Array.isArray(emp.jobVacanciesUrl) ? emp.jobVacanciesUrl
                  : (typeof emp.jobVacanciesUrl === "string" ? (() => { try { return JSON.parse(emp.jobVacanciesUrl); } catch { return []; } })() : []);
                const validPos = (positions as any[]).filter((p: any) => p.posisi?.trim());

                return (
                  <div key={emp.bookingId} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "1.25rem", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "0.85rem" }}>
                      {emp.logoUrl
                        ? <img src={emp.logoUrl} alt="" style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 8, background: "#fff", padding: 4, flexShrink: 0 }} />
                        : <div style={{ width: 48, height: 48, borderRadius: 8, background: "rgba(212,160,23,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>🏢</div>
                      }
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#f1f5f9" }}>{emp.companyName}</div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          {emp.industry}{emp.city ? ` · ${emp.city}` : ""}
                        </div>
                        {emp.website && (
                          <a href={emp.website.startsWith("http") ? emp.website : `https://${emp.website}`}
                            target="_blank" rel="noreferrer"
                            style={{ fontSize: "0.75rem", color: "#14b8a6", textDecoration: "none" }}>
                            🌐 {emp.website}
                          </a>
                        )}
                      </div>
                    </div>

                    {validPos.length > 0 && (
                      <div style={{ marginBottom: "0.85rem" }}>
                        <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Posisi yang dibuka</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                          {validPos.map((p: any, i: number) => (
                            <span key={i} style={{ fontSize: "0.8rem", background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.2)", color: "#D4A017", borderRadius: 20, padding: "0.25rem 0.75rem" }}>
                              {p.posisi} {p.jumlah ? `(${p.jumlah} orang)` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(vacFiles as any[]).length > 0 && (
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {(vacFiles as any[]).map((f: any, i: number) => (
                          <a key={i} href={f.url} target="_blank" rel="noreferrer"
                            style={{ fontSize: "0.78rem", color: "#94a3b8", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "0.3rem 0.7rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            📄 {f.name || `Lowongan ${i + 1}`}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
