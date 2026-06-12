import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { openInvoiceForPrint, getPaymentDeadline } from "@/lib/invoiceGenerator";
import { uploadToSupabase } from "@/lib/supabase";

const DAYS = ["Senin, 8 Juni 2026", "Selasa, 9 Juni 2026"];
const SLOTS_BY_DAY = [
  ["10.00–11.00", "11.00–12.00", "13.00–14.00", "14.00–15.00", "15.00–16.00"],
  ["08.00–09.00", "09.00–10.00", "10.00–11.00", "11.00–12.00", "13.00–14.00", "14.00–15.00", "15.00–16.00"],
];
const INTERVIEW_BOOTHS = ["E1","E2","E3","E4","E5","E6","E7","E8","E9","E10","E11","E12","E13","E14"];


const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

const s = {
  page:    { minHeight: "100vh", background: "#0a1628", fontFamily: "system-ui, sans-serif", color: "#f1f5f9" } as React.CSSProperties,
  nav:     { background: "rgba(10,22,40,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(20,184,166,0.2)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky" as const, top: 0, zIndex: 50 },
  wrap:    { maxWidth: 1000, margin: "0 auto", padding: "2rem 1.25rem" },
  card:    { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" },
  teal:    { background: "rgba(20,184,166,0.04)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" },
  gold:    { background: "rgba(212,160,23,0.04)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" },
  secHd:   { fontSize: "1rem", fontWeight: 700, color: "#14b8a6", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" },
  tab:     (active: boolean) => ({ padding: "0.6rem 1.25rem", borderRadius: 8, border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, background: active ? "#14b8a6" : "transparent", color: active ? "#fff" : "#64748b", transition: "all 0.2s" }) as React.CSSProperties,
};

type TabId = "status" | "booth" | "interview" | "idcard" | "rekrutmen" | "lamaran" | "kandidat" | "editprofil";

export default function EmployerDashboard() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>("status");
  const [booking, setBooking] = useState<any | null>(null);
  const [bookingId, setBookingId] = useState("");
  const [mySlots, setMySlots] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [hasBooked, setHasBooked] = useState(false); // hard lock setelah konfirmasi
  const [confirmedSlots, setConfirmedSlots] = useState<{boothId:string;day:number;slotIndex:number}[]>([]); // backup display

  const [sessionData, setSessionData] = useState<{bookingId: string; email: string} | null>(null);

  // ── ID Card Staff state ──────────────────────────────────────
  type StaffMember = { nama: string; posisi: string };
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [staffForm, setStaffForm] = useState<StaffMember>({ nama: "", posisi: "" });
  const [staffSaved, setStaffSaved] = useState(false);

  const staffQuery = trpc.event.getStaffList.useQuery(
    { bookingId: bookingId || "" },
    { enabled: !!bookingId, onSuccess: (data: any) => {
      if (data.staffMembers.length > 0) {
        setStaffList(data.staffMembers);
        setStaffSaved(true);
      }
    }}
  );
  const saveStaffMutation = trpc.event.saveStaffList.useMutation({
    onSuccess: () => {
      setStaffSaved(true);
      toast.success("Daftar staff berhasil disimpan!", { description: "Panitia akan memproses pencetakan ID Card Anda" });
    },
    onError: () => toast.error("Gagal menyimpan daftar staff"),
  });

  // ── Logo upload state ───────────────────────────────────────────
  const [logoUploading, setLogoUploading] = useState(false);
  const updateLogoMutation = trpc.event.updateEmployerLogo?.useMutation?.({
    onSuccess: () => { toast.success("Logo berhasil disimpan!"); loginQuery.refetch(); },
    onError: () => toast.error("Gagal menyimpan logo"),
  });

  // ── Bukti bayar upload state ─────────────────────────────────
  const [buktiUploading, setBuktiUploading] = useState(false);

  // ── Job vacancies upload state ───────────────────────────────
  // ── Kondisi rekrutmen state ──────────────────────────────────
  const [rekrutmenRows, setRekrutmenRows] = useState<{ posisi: string; jumlah: string; status: string }[]>([
    { posisi: "", jumlah: "", status: "" }
  ]);
  const [savingRekrutmen, setSavingRekrutmen] = useState(false);

  // ── Kandidat table state ──────────────────────────────────────
  const [kdSearch,      setKdSearch]      = useState("");
  const [kdFilterMinat, setKdFilterMinat] = useState("");
  const [kdFilterStatus,setKdFilterStatus]= useState("");
  const [kdFilterInst,  setKdFilterInst]  = useState("");
  const [kdSortCol,     setKdSortCol]     = useState<"namaLengkap"|"institusi"|"tahunLulus">("namaLengkap");
  const [kdSortDir,     setKdSortDir]     = useState<"asc"|"desc">("asc");
  const [kdPage,        setKdPage]        = useState(1);
  const [selectedKandidats, setSelectedKandidats] = useState<Set<string>>(new Set());
  const KD_PAGE_SIZE = 25;

  const [vacUploading, setVacUploading] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem("employer_session");
    if (!session) { navigate("/employer/login"); return; }
    const parsed = JSON.parse(session);
    setSessionData(parsed);
    setBookingId(parsed.bookingId);
  }, []);

  const loginQuery = trpc.event.loginEmployer.useQuery(
    { bookingId: sessionData?.bookingId || "", email: sessionData?.email || "" },
    { enabled: !!sessionData, retry: false }
  );

  // Fetch event config untuk WA number & payment deadline
  const configQuery = trpc.event.getEventConfig.useQuery();
  const eventConfig = configQuery.data || {};

  const updateBuktiMutation = trpc.event.updateBuktiPayment.useMutation({
    onSuccess: () => { toast.success("Bukti bayar berhasil diupload!"); loginQuery.refetch(); },
    onError:   (e) => toast.error("Gagal simpan: " + e.message),
  });

  const updateVacanciesMutation = trpc.event.updateJobVacancies.useMutation({
    onSuccess: () => { toast.success("Job vacancies berhasil disimpan!"); loginQuery.refetch(); },
    onError:   (e) => toast.error("Gagal simpan: " + e.message),
  });

  const savePositionsMutation = trpc.event.savePositions.useMutation({
    onSuccess: () => { toast.success("Posisi rekrutmen berhasil disimpan!"); loginQuery.refetch(); },
    onError:   (e) => toast.error("Gagal simpan posisi: " + e.message),
  });

  const updateProfilMutation = trpc.event.updateEmployerProfile.useMutation({
    onSuccess: () => { toast.success("Profil berhasil diperbarui!"); loginQuery.refetch(); setEditProfilMode(false); },
    onError:   (e) => toast.error("Gagal simpan: " + e.message),
  });

  const [editProfilMode, setEditProfilMode] = useState(false);
  const [editProfilForm, setEditProfilForm] = useState({
    companyName: "", industry: "", city: "", website: "", description: "",
    pic1Name: "", pic1Title: "", pic1Whatsapp: "",
    pic2Name: "", pic2Title: "", pic2Email: "", pic2Whatsapp: "",
    specialRequest: "",
  });

  const { data: takenRaw, refetch: refetchTaken } = trpc.event.getInterviewBookingsByEmployer.useQuery(
    { employerBookingId: sessionData?.bookingId || "" },
    { enabled: !!sessionData?.bookingId }
  );
  const { data: allInterviewRaw, refetch: refetchAllTaken } = trpc.event.getAllInterviewBookings.useQuery();
  const takenSlots: Record<string, string> = {};
  const blockedByOthers: Record<string, string> = {};
  ((allInterviewRaw || []) as any[]).forEach((b: any) => {
    const key = `${b.boothId}-${b.day}-${b.slotIndex}`;
    takenSlots[key] = b.companyName || b.employerBookingId;
    if (b.employerBookingId !== sessionData?.bookingId) {
      blockedByOthers[key] = b.companyName || b.employerBookingId;
    }
  });

  const cancelInterviewMutation = trpc.event.cancelInterviewBooking.useMutation();
  const incrementRescheduleMutation = trpc.event.incrementRescheduleCount.useMutation();
  const confirmInterviewMutation = trpc.event.createInterviewBooking.useMutation({
    onSuccess: () => {
      // Simpan slot ke confirmedSlots sebelum clear mySlots
      const parsed = mySlots.map(key => {
        const parts = key.split("-");
        const slotIndex = parseInt(parts[parts.length - 1]);
        const day = parseInt(parts[parts.length - 2]);
        const boothId = parts.slice(0, parts.length - 2).join("-");
        return { boothId, day, slotIndex };
      });
      setConfirmedSlots(prev => [...prev, ...parsed]);
      setMySlots([]);
      setIsRescheduling(false);
      setHasBooked(true);
      refetchTaken();
      refetchAllTaken();
      toast.success("Booking interview berhasil dikonfirmasi!");
    },
    onError: (err) => toast.error("Gagal: " + err.message),
  });

  const waNumber  = ((eventConfig as any).whatsappNumber || "628120000000").replace(/[^0-9]/g, "");
  const deadlineDate = (eventConfig as any).paymentDeadlineDate || "";

  // Helper: apakah sudah expired?
  const isExpired = (bookingStatus: string): boolean => {
    if (bookingStatus !== "pending") return false;
    if (!deadlineDate) return false;
    const now = new Date();
    const deadline = new Date(deadlineDate);
    deadline.setHours(23, 59, 59, 999);
    return now > deadline;
  };

  // Helper: format tanggal deadline untuk tampilan
  const deadlineLabel = deadlineDate
    ? new Date(deadlineDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : getPaymentDeadline();

  // Helper: buka WhatsApp dengan pesan otomatis
  const openWhatsApp = (bId: string, companyName: string, amount: number) => {
    const msg = encodeURIComponent(
      `Halo Panitia GR2026 👋\n\n` +
      `Saya ingin mengirimkan bukti pembayaran booth:\n` +
      `• Booking ID: ${bId}\n` +
      `• Perusahaan: ${companyName}\n` +
      `• Nominal: Rp ${amount.toLocaleString("id-ID")}\n\n` +
      `Terlampir bukti transfer. Mohon dikonfirmasi. Terima kasih! 🙏`
    );
    window.open(`https://wa.me/${waNumber}?text=${msg}`, "_blank");
  };

  useEffect(() => {
    if (loginQuery.data) {
      setBooking(loginQuery.data as any);
      // Load posisi rekrutmen yang sudah tersimpan ke dalam form
      const existingPos = Array.isArray((loginQuery.data as any).positions)
        ? (loginQuery.data as any).positions : [];
      if (existingPos.length > 0) {
        setRekrutmenRows(existingPos.map((p: any) => ({
          posisi: p.posisi || "",
          jumlah:  String(p.jumlah || ""),
          status:  p.status || "",
        })));
      }
    } else if (loginQuery.isFetched && !loginQuery.data) {
      navigate("/employer/login");
    }
  }, [loginQuery.data, loginQuery.isFetched]);

  const handleLogout = () => {
    localStorage.removeItem("employer_session");
    toast.success("Berhasil logout");
    navigate("/employer/login");
  };

  const handleDownloadInvoice = () => {
    if (!booking) return;
    const b = booking as any;
    const booths = Array.isArray(b.booths) ? b.booths : [];
    const boothSubtotal = booths.reduce((sum: number, bt: any) => sum + (bt.price || 0), 0);
    const dbTotal = parseFloat(b.totalAmount || "0");
    const facilityTotal = Math.max(0, dbTotal - boothSubtotal);
    openInvoiceForPrint({
      bookingId: b.bookingId || bookingId,
      bookingDate: b.createdAt ? new Date(b.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : new Date().toLocaleDateString("id-ID"),
      companyName: b.companyName,
      industry: b.industry || "",
      city: b.city || "",
      website: b.website || "",
      pic1: { name: b.pic1Name || "", title: b.pic1Title || "", email: b.pic1Email || "", whatsapp: b.pic1Whatsapp || "" },
      pic2: b.pic2Name ? { name: b.pic2Name, title: b.pic2Title || "", email: b.pic2Email || "", whatsapp: b.pic2Whatsapp || "" } : undefined,
      positions: Array.isArray(b.positions) ? b.positions : [],
      booths: booths.map((bt: any) => ({ boothId: bt.id, label: bt.label, type: bt.type, price: bt.price || 0 })),
      needsBoothDesign: b.needsBoothDesign || false,
      specialRequest: b.specialRequest || "",
      totalAmount: boothSubtotal,
      facilityTotal: facilityTotal > 0 ? facilityTotal : undefined,
      exhibitorOrder: b.exhibitorOrder || undefined,
      paymentDeadline: getPaymentDeadline(),
    });
  };

  // ── Kandidat (Jobseeker) query ────────────────────────────────
  const kandidatQuery = trpc.event.getJobseekersForEmployer.useQuery(
    { bookingId: sessionData?.bookingId || "" },
    { enabled: !!sessionData?.bookingId && activeTab === "kandidat", retry: false }
  );

  // ── Lamaran Masuk (Virtual Phase) ─────────────────────────────
  const [lmFilterPos,    setLmFilterPos]    = useState("");
  const [lmFilterStatus, setLmFilterStatus] = useState("");
  const [lmExpandedId,   setLmExpandedId]   = useState<number | null>(null);

  const myVirtualCfgQuery = trpc.event.getMyVirtualConfig.useQuery(
    { bookingId: sessionData?.bookingId || "", email: sessionData?.email || "" },
    { enabled: !!sessionData, retry: false }
  );
  const isMechanismA = !!myVirtualCfgQuery.data?.isParticipating && myVirtualCfgQuery.data?.mechanism === "A";

  const lamaranQuery = trpc.event.getVirtualApplicationsByEmployer.useQuery(
    { bookingId: sessionData?.bookingId || "", email: sessionData?.email || "" },
    { enabled: !!sessionData && isMechanismA, retry: false, refetchInterval: 60000 }
  );
  const updateAppStatusMutation = trpc.event.updateVirtualApplicationStatus.useMutation({
    onSuccess: () => lamaranQuery.refetch(),
    onError:   (e: any) => toast.error("Gagal update status: " + e.message),
  });
  const lamaranList: any[] = (lamaranQuery.data as any[]) || [];
  const lamaranNewCount = lamaranList.filter(a => a.status === "new").length;

  if (!booking) return (
    <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#64748b" }}>Loading...</p>
    </div>
  );

  // Max interview slots based on booth types (configurable via SuperAdmin)
  const booths = Array.isArray(booking.booths) ? booking.booths : [];
  const mainCount  = booths.filter((b: any) => b.type === "main").length;
  const stdCount   = booths.filter((b: any) => b.type === "standard").length;
  const extraCount = booths.filter((b: any) => b.type === "extra").length;
  const mainSlotPerBooth  = parseInt((eventConfig as any).mainBoothSlots  || "4");
  const stdSlotPerBooth   = parseInt((eventConfig as any).stdBoothSlots   || "2");
  const extraSlotPerBooth = parseInt((eventConfig as any).extraBoothSlots || "3");
  const maxSlots = (mainCount * mainSlotPerBooth) + (stdCount * stdSlotPerBooth) + (extraCount * extraSlotPerBooth);
  const maxStaff   = (mainCount * 4) + (stdCount * 2) + (extraCount * 2);
  const totalAmount = parseFloat((booking as any).totalAmount || "0");

  const handleBookSlot = (key: string) => {
    if (mySlots.includes(key)) {
      setMySlots(prev => prev.filter(s => s !== key));
      toast.success("Slot dibatalkan");
      return;
    }
    if (mySlots.length >= maxSlots) {
      toast.error(`Maksimal ${maxSlots} slot interview untuk paket booth Anda`);
      return;
    }
    const blocked = isRescheduling ? blockedByOthers : takenSlots;
    if (blocked[key]) {
      toast.error("Slot ini sudah dibooking perusahaan lain");
      return;
    }
    setMySlots(prev => [...prev, key]);
    toast.success("Slot berhasil ditambahkan!");
  };

  const expired       = isExpired(booking.status);
  const effectiveStatus = expired ? "expired" : booking.status;
  const statusColor = effectiveStatus === "confirmed" ? "#14b8a6" : effectiveStatus === "rejected" || effectiveStatus === "expired" ? "#ef4444" : "#f97316";
  const statusLabel = effectiveStatus === "confirmed" ? "✅ Pembayaran Dikonfirmasi" : effectiveStatus === "rejected" ? "❌ Ditolak" : effectiveStatus === "expired" ? "⏰ Expired — Batas Bayar Terlewat" : "⏳ Menunggu Konfirmasi Pembayaran";

  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={s.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 32 }} />
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: "1rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{booking.companyName}</div>
            <div style={{ fontSize: "0.72rem", color: "#64748b", fontFamily: "monospace" }}>{bookingId}</div>
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
            Dashboard Employer
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Grand Recruitment 2026 · June 8–9 · Dome NHI Bandung</p>
        </div>

        {/* Post-event banner: Virtual Phase */}
        <div style={{ background: "rgba(26,122,110,0.12)", border: "1px solid rgba(26,122,110,0.45)", borderRadius: 12, padding: "1rem 1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ fontWeight: 700, color: "#5eead4", fontSize: "0.95rem", marginBottom: "0.3rem" }}>
            🎉 Grand Recruitment 2026 telah selesai — terima kasih atas partisipasi Anda!
          </div>
          <p style={{ color: "#94a3b8", fontSize: "0.84rem", lineHeight: 1.7, margin: 0 }}>
            Tim kami akan <strong style={{ color: "#cbd5e1" }}>segera menghubungi Anda</strong> mengenai{" "}
            <strong style={{ color: "#5eead4" }}>Virtual Phase</strong> — program lanjutan job fair online GR2026
            agar perusahaan Anda tetap mendapat kandidat. Dashboard Anda tetap dapat diakses seperti biasa.
          </p>
        </div>

        {/* Status bar */}
        <div style={{ background: `${statusColor}15`, border: `1px solid ${statusColor}40`, borderRadius: 12, padding: "1rem 1.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status Booking</div>
            <div style={{ fontWeight: 700, color: statusColor, fontSize: "1rem" }}>{statusLabel}</div>
          </div>
          {booking.status === "pending" && !expired && (
            <div style={{ fontSize: "0.82rem", color: "#fed7aa", background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 8, padding: "0.6rem 1rem" }}>
              ⏰ Batas pembayaran: <strong>{deadlineLabel}</strong>
            </div>
          )}
          {expired && (
            <div style={{ fontSize: "0.82rem", color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "0.6rem 1rem" }}>
              ⏰ Expired — {deadlineLabel} sudah terlewat
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "0.5rem", marginBottom: "1.5rem" }}>
          {([
            { id: "status" as TabId, label: "📋 Status & Booking" },
            { id: "booth" as TabId, label: "🗺️ Posisi Booth" },
            { id: "interview" as TabId, label: "📅 Interview Booth" },
            { id: "idcard" as TabId, label: "🪪 ID Card Staff" },
            { id: "rekrutmen" as TabId, label: "📄 Rekrutmen" },
            ...(isMechanismA && booking.status === "confirmed"
              ? [{ id: "lamaran" as TabId, label: lamaranNewCount > 0 ? `📨 Lamaran Masuk (${lamaranNewCount})` : "📨 Lamaran Masuk" }]
              : []),
            { id: "kandidat" as TabId, label: (() => {
              const b = booking as any;
              const unlocked = b.status === "confirmed";
              return unlocked ? "👥 Kandidat" : "🔒 Kandidat";
            })() },
            { id: "editprofil" as TabId, label: "✏️ Edit Profil" },
          ]).map(tab => (
            <button key={tab.id} style={s.tab(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: STATUS ── */}
        {activeTab === "status" && (
          <div>
            {/* Identitas Perusahaan */}
            <div style={s.card}>
              <div style={s.secHd}>🏢 Identitas Perusahaan</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "1rem" }}>
                {[
                  { label: "Nama Perusahaan", val: (booking as any).companyName },
                  { label: "Industri", val: (booking as any).industry },
                  { label: "Kota", val: (booking as any).city },
                  { label: "Website", val: (booking as any).website || "—" },
                  { label: "Deskripsi", val: (booking as any).description || "—" },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: "0.7rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.25rem" }}>{item.label}</div>
                    <div style={{ fontSize: "0.88rem", color: "#f1f5f9", fontWeight: item.label === "Nama Perusahaan" ? 700 : 400 }}>{item.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Identitas Pemesan (PIC) */}
            <div style={s.card}>
              <div style={s.secHd}>👤 Identitas Pemesan</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "1rem", marginBottom: (booking as any).pic2Name ? "1rem" : 0 }}>
                {[
                  { label: "Nama", val: (booking as any).pic1Name },
                  { label: "Jabatan", val: (booking as any).pic1Title },
                  { label: "Email", val: (booking as any).pic1Email },
                  { label: "Telp / WhatsApp", val: (booking as any).pic1Whatsapp },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: "0.7rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.25rem" }}>{item.label}</div>
                    <div style={{ fontSize: "0.88rem", color: "#f1f5f9" }}>{item.val || "—"}</div>
                  </div>
                ))}
              </div>
              {(booking as any).pic2Name && (
                <>
                  <div style={{ fontSize: "0.75rem", color: "#475569", margin: "0.75rem 0 0.5rem", fontWeight: 600 }}>PIC 2</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "1rem" }}>
                    {[
                      { label: "Nama", val: (booking as any).pic2Name },
                      { label: "Jabatan", val: (booking as any).pic2Title },
                      { label: "Email", val: (booking as any).pic2Email },
                      { label: "Telp / WhatsApp", val: (booking as any).pic2Whatsapp },
                    ].map(item => (
                      <div key={item.label}>
                        <div style={{ fontSize: "0.7rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.25rem" }}>{item.label}</div>
                        <div style={{ fontSize: "0.88rem", color: "#f1f5f9" }}>{item.val || "—"}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Booking summary */}
            <div style={s.teal}>
              <div style={s.secHd}>📋 Ringkasan Booking</div>

              {/* Booth breakdown */}
              {booths.map((b: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid rgba(20,184,166,0.08)", fontSize: "0.9rem" }}>
                  <span style={{ color: "#cbd5e1" }}>
                    Booth <strong style={{ color: "#14b8a6" }}>{b.label}</strong> · {b.type === "main" ? "Main Booth 5×5m" : b.type === "extra" ? "Extra Booth 4×2m" : "Standard Booth 3×3m"}
                  </span>
                  <span style={{ color: "#D4A017", fontWeight: 700 }}>{fmt(b.price || 0)}</span>
                </div>
              ))}

              {/* Subtotal booth */}
              {(() => {
                const boothSubtotal = booths.reduce((sum: number, b: any) => sum + (b.price || 0), 0);
                const facilityTotal = Math.max(0, totalAmount - boothSubtotal);
                return (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", fontWeight: 700, fontSize: "0.95rem", borderBottom: facilityTotal > 0 ? "1px solid rgba(20,184,166,0.1)" : "none" }}>
                      <span>{facilityTotal > 0 ? "Subtotal Booth" : "Total"}</span>
                      <span style={{ color: "#D4A017" }}>{fmt(boothSubtotal)}</span>
                    </div>
                    {facilityTotal > 0 && (() => {
                      const EO_CATALOG: Record<string, { label: string; harga: number; unit: string; per: string }> = {
                        eo_kursi: { label: "Kursi + cover hitam", harga: 25000, unit: "buah", per: "hari" },
                        eo_meja: { label: "Meja + cover hitam", harga: 125000, unit: "buah", per: "hari" },
                        eo_barstool_h: { label: "Hidrolik barstool hitam", harga: 150000, unit: "buah", per: "hari" },
                        eo_barstool_m: { label: "Melinda barstool putih", harga: 150000, unit: "buah", per: "hari" },
                        eo_bartable: { label: "Bartable lingkaran Ø75×100cm", harga: 100000, unit: "buah", per: "hari" },
                        eo_meja_kaca: { label: "Meja kaca Ø80×75cm", harga: 150000, unit: "buah", per: "hari" },
                        eo_sofa: { label: "Kursi sofa single hitam", harga: 300000, unit: "buah", per: "hari" },
                        eo_tv42: { label: "TV 42 Inch + standing", harga: 750000, unit: "unit", per: "hari" },
                        eo_tv55: { label: "TV 55 Inch + standing", harga: 1500000, unit: "unit", per: "hari" },
                        eo_listrik2a: { label: "Listrik tambahan 2A", harga: 250000, unit: "titik", per: "hari" },
                        eo_listrik4a: { label: "Listrik tambahan 4A", harga: 400000, unit: "titik", per: "hari" },
                        eo_kabel: { label: "Kabel + Socket 3 lubang", harga: 250000, unit: "buah", per: "hari" },
                        eo_zigzag: { label: "Zigzag brochure rack", harga: 450000, unit: "buah", per: "hari" },
                        eo_acrylic: { label: "Acrylic display brosur A5", harga: 150000, unit: "buah", per: "event" },
                        eo_tripod: { label: "Tripod banner", harga: 175000, unit: "buah", per: "hari" },
                        eo_xbanner: { label: "X Banner 60×160cm", harga: 175000, unit: "buah", per: "event" },
                        eo_rollbanner: { label: "Roll Banner 80×200cm", harga: 425000, unit: "buah", per: "event" },
                        eo_displaybox: { label: "Display Box Medium", harga: 757000, unit: "buah", per: "hari" },
                        eo_floor33: { label: "Flooring 3×3", harga: 1575000, unit: "paket", per: "event" },
                        eo_floor55: { label: "Flooring 5×5", harga: 4375000, unit: "paket", per: "event" },
                        eo_floor42: { label: "Flooring 4×2", harga: 1400000, unit: "paket", per: "event" },
                        eo_backdrop33: { label: "Backdrop 3×2", harga: 2250000, unit: "paket", per: "event" },
                        eo_backdrop52: { label: "Backdrop 5×2", harga: 5000000, unit: "paket", per: "event" },
                        eo_backdrop42: { label: "Backdrop 4×2", harga: 4687500, unit: "paket", per: "event" },
                        eo_wall33: { label: "Wall sticker 3×2.5m", harga: 2812500, unit: "sisi", per: "event" },
                        eo_wall55: { label: "Wall sticker 5×2.5m", harga: 2187500, unit: "sisi", per: "event" },
                        eo_wall42: { label: "Wall sticker 4×2.5m", harga: 1750000, unit: "sisi", per: "event" },
                        eo_bunga_meja: { label: "Rangkaian bunga meja", harga: 350000, unit: "buah", per: "event" },
                        eo_anggrek: { label: "Bunga Anggrek 1 tangkai", harga: 250000, unit: "buah", per: "event" },
                        eo_bunga_tinggi: { label: "Rangkaian bunga tinggi", harga: 500000, unit: "buah", per: "event" },
                        eo_rope: { label: "Rope Barrier (per tiang)", harga: 100000, unit: "tiang", per: "hari" },
                        eo_sampah: { label: "Tempat sampah", harga: 75000, unit: "buah", per: "event" },
                        eo_kain: { label: "Kain hitam per meter", harga: 125000, unit: "meter", per: "event" },
                      };
                      const eoRaw = (booking as any).exhibitorOrder;
                      const eoItems = eoRaw ? (() => {
                        try {
                          const parsed = typeof eoRaw === "string" ? JSON.parse(eoRaw) : eoRaw;
                          return Object.entries(parsed as Record<string, number>)
                          .filter(([key, qty]) => qty > 0 && EO_CATALOG[key])
                            .map(([key, qty]) => {
                              const item = EO_CATALOG[key];
                              const days = item.per === "hari" ? 2 : 1;
                              return { ...item, qty, subtotal: item.harga * qty * days };
                            });
                        } catch { return []; }
                      })() : [];

                      return (
                        <>
                          {eoItems.length > 0 ? (
                            <>
                              <div style={{ padding: "0.4rem 0 0.2rem", fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Fasilitas Tambahan (Exhibitor Order)
                              </div>
                              {eoItems.map((item, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0", fontSize: "0.85rem", borderBottom: "1px solid rgba(20,184,166,0.06)", color: "#cbd5e1" }}>
                                  <span>{item.qty}× {item.label} <span style={{ color: "#64748b", fontSize: "0.78rem" }}>({item.per === "hari" ? "2 hari" : "1 event"})</span></span>
                                  <span style={{ color: "#fbbf24", fontWeight: 600 }}>{fmt(item.subtotal)}</span>
                                </div>
                              ))}
                            </>
                          ) : (
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", fontSize: "0.9rem", borderBottom: "1px solid rgba(20,184,166,0.08)", color: "#cbd5e1" }}>
                              <span>Paket & Fasilitas Tambahan</span>
                              <span style={{ color: "#fbbf24", fontWeight: 700 }}>{fmt(facilityTotal)}</span>
                            </div>
                          )}
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", fontWeight: 800, fontSize: "1.05rem" }}>
                            <span>Grand Total</span>
                            <span style={{ color: "#D4A017" }}>{fmt(totalAmount)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </>
                );
              })()}

              {(booking as any).needsBoothDesign && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0", fontSize: "0.82rem", color: "#94a3b8" }}>
                  <span>📐</span><span>Layanan desain & dekorasi booth: <strong style={{ color: "#D4A017" }}>Requested</strong></span>
                </div>
              )}
              {(booking as any).specialRequest && (
                <div style={{ padding: "0.5rem 0", fontSize: "0.82rem", color: "#94a3b8" }}>
                  <span>📝 {(booking as any).specialRequest}</span>
                </div>
              )}

              {/* Posisi Rekrutmen */}
              {Array.isArray((booking as any).positions) && (booking as any).positions.filter((p: any) => p.position || p.customPosition).length > 0 && (
                <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(20,184,166,0.1)" }}>
                  <div style={{ fontSize: "0.7rem", color: "#14b8a6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Kebutuhan Rekrutmen</div>
                  {(booking as any).positions.filter((p: any) => p.position || p.customPosition).map((p: any, i: number) => (
                    <div key={i} style={{ fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.2rem" }}>
                      • {p.position || p.customPosition} — {p.count} kandidat
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Logo Perusahaan */}
            <div style={s.card}>
              <div style={s.secHd}>🖼️ Logo Perusahaan</div>
              {(booking as any).logoUrl ? (
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                  <img src={(booking as any).logoUrl} alt="Logo"
                    style={{ height: 60, maxWidth: 160, objectFit: "contain", background: "#fff", borderRadius: 8, padding: "0.35rem", border: "1px solid rgba(20,184,166,0.3)" }} />
                  <span style={{ fontSize: "0.82rem", color: "#14b8a6", fontWeight: 600 }}>✅ Logo terupload</span>
                </div>
              ) : (
                <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "1rem" }}>
                  Belum ada logo. Upload logo perusahaan untuk ditampilkan di booth dan materi event.
                </p>
              )}
              <div style={{ fontSize: "0.75rem", color: "#475569", marginBottom: "0.75rem" }}>
                💡 Mohon kirimkan logo dengan resolusi yang cukup untuk kebutuhan cetak dan display.
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(20,184,166,0.08)", border: "1px dashed rgba(20,184,166,0.4)", borderRadius: 8, padding: "0.6rem 1rem", cursor: logoUploading ? "not-allowed" : "pointer", fontSize: "0.82rem", color: "#14b8a6", fontWeight: 600 }}>
                {logoUploading ? "⏳ Uploading..." : (booking as any).logoUrl ? "🔄 Ganti Logo" : "📎 Upload Logo"}
                <input type="file" accept="image/*,.pdf" style={{ display: "none" }} disabled={logoUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    setLogoUploading(true);
                    try {
                      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
                      const safeName = `logo-${Date.now()}.${ext}`;
                      const url = await uploadToSupabase(file, "employer", `${sessionData?.bookingId}/logo/${safeName}`);
                      await fetch("/api/upload/update-doc", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ registrationId: sessionData?.bookingId, type: "logo", url }),
                      });
                      loginQuery.refetch();
                      toast.success("Logo berhasil diupload!");
                    } catch (err: any) { toast.error("Upload gagal: " + err.message); }
                    setLogoUploading(false);
                    e.target.value = "";
                  }} />
              </label>
            </div>

            {/* Payment instruction if pending */}
            {booking.status === "pending" && !expired && (
              <div style={s.gold}>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#D4A017", marginBottom: "1rem" }}>🏦 Instruksi Pembayaran</div>
                {[
                  { label: "Bank",          val: (eventConfig as any).bankName || "Bank BNI" },
                  { label: "No. Rekening",  val: (eventConfig as any).bankAccount || "0123-456-789" },
                  { label: "Atas Nama",     val: (eventConfig as any).bankAccountName || "Koperasi Poltekpar NHI Bandung" },
                  { label: "Nominal",       val: fmt(totalAmount) },
                  { label: "Berita Transfer",val: bookingId },
                  { label: "Batas Bayar",   val: deadlineLabel },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", gap: "1rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.82rem", color: "#64748b", minWidth: 130 }}>{item.label}</span>
                    <span style={{ fontWeight: 700, color: item.label === "Nominal" || item.label === "Batas Bayar" ? "#D4A017" : "#f1f5f9", fontSize: "0.9rem" }}>{item.val}</span>
                  </div>
                ))}

                {/* Upload Bukti Bayar */}
                <div style={{ marginTop: "1.25rem", padding: "1rem", background: "rgba(129,140,248,0.06)", border: "1px solid rgba(129,140,248,0.25)", borderRadius: 12 }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#818cf8", marginBottom: "0.5rem" }}>📤 Upload Bukti Bayar</div>
                  {(booking as any).buktiPaymentUrl ? (
                    <div style={{ fontSize: "0.82rem", color: "#6ee7b7", marginBottom: "0.75rem" }}>
                      ✅ Bukti sudah diupload.{" "}
                      <a href={(booking as any).buktiPaymentUrl} target="_blank" rel="noreferrer" style={{ color: "#818cf8" }}>Lihat file →</a>
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: "0.75rem" }}>Upload bukti transfer langsung ke sistem. Panitia akan memverifikasi dan mengonfirmasi pembayaran Anda.</div>
                  )}
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(129,140,248,0.12)", border: "1px dashed rgba(129,140,248,0.4)", borderRadius: 8, padding: "0.6rem 1.25rem", cursor: buktiUploading ? "not-allowed" : "pointer", fontSize: "0.88rem", color: "#818cf8", fontWeight: 600 }}>
                    {buktiUploading ? "⏳ Uploading..." : (booking as any).buktiPaymentUrl ? "🔄 Ganti File" : "📎 Pilih File"}
                    <input type="file" style={{ display: "none" }} disabled={buktiUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        setBuktiUploading(true);
                        try {
                          const url = await uploadToSupabase(file, "employer", `${sessionData?.bookingId}/bukti-bayar/${Date.now()}-${file.name}`);
                          updateBuktiMutation.mutate({ bookingId: sessionData?.bookingId || "", url });
                        } catch (err: any) { toast.error("Upload gagal: " + err.message); }
                        setBuktiUploading(false);
                        e.target.value = "";
                      }} />
                  </label>
                </div>

                {/* Tombol WA kirim bukti */}
                <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.25)", borderRadius: 12 }}>
                  <div style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: "0.75rem", lineHeight: 1.6 }}>
                    Atau kirim bukti pembayaran via WhatsApp. Klik tombol di bawah — pesan akan terisi otomatis.
                  </div>
                  <button
                    onClick={() => openWhatsApp(bookingId, (booking as any).companyName, totalAmount)}
                    style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "linear-gradient(135deg,#25d366,#128c7e)", border: "none", color: "#fff", borderRadius: 10, padding: "0.8rem 1.5rem", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", width: "100%", justifyContent: "center" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Kirim Bukti Bayar via WhatsApp
                  </button>
                </div>
              </div>
            )}

            {/* Expired banner */}
            {expired && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" }}>
                <div style={{ fontWeight: 700, color: "#f87171", marginBottom: "0.5rem" }}>⏰ Batas Pembayaran Terlewat</div>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.7, margin: "0 0 1rem" }}>
                  Batas pembayaran <strong style={{ color: "#f1f5f9" }}>{deadlineLabel}</strong> sudah terlewat.
                  Booth pilihan Anda sudah dilepas kembali ke pasar.
                </p>
                <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0 }}>
                  Jika ingin mendaftar kembali, silakan hubungi panitia via WhatsApp.
                </p>
                <button
                  onClick={() => window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo Panitia GR2026, booking saya ${bookingId} sudah expired. Apakah saya bisa mendaftar kembali? Terima kasih 🙏`)}`, "_blank")}
                  style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.6rem", background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.3)", color: "#25d366", borderRadius: 8, padding: "0.6rem 1.25rem", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>
                  💬 Hubungi Panitia via WhatsApp
                </button>
              </div>
            )}

            {/* Download Invoice */}
            <div style={{ background: "rgba(212,160,23,0.05)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 12, padding: "1.25rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ fontWeight: 700, color: "#D4A017", marginBottom: "0.25rem" }}>📄 Invoice Booking</div>
                <div style={{ fontSize: "0.82rem", color: "#64748b" }}>Download ulang invoice untuk keperluan administrasi atau pembayaran</div>
              </div>
              <button onClick={handleDownloadInvoice}
                style={{ background: "linear-gradient(135deg,#D4A017,#B8860B)", border: "none", color: "#fff", borderRadius: 10, padding: "0.65rem 1.25rem", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const }}>
                📥 Download Invoice
              </button>
            </div>

            {/* Download Kwitansi LUNAS — hanya jika sudah di-approve */}
            {(booking as any).kwitansiApproved && (
              <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#10b981", marginBottom: "0.25rem" }}>✅ Kwitansi Pembayaran LUNAS</div>
                  <div style={{ fontSize: "0.82rem", color: "#64748b" }}>Pembayaran Anda telah dikonfirmasi. Download kwitansi resmi dengan cap LUNAS.</div>
                </div>
                <button onClick={handleDownloadInvoice}
                  style={{ background: "linear-gradient(135deg,#059669,#10b981)", border: "none", color: "#fff", borderRadius: 10, padding: "0.65rem 1.25rem", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const }}>
                  🏅 Download Kwitansi
                </button>
              </div>
            )}

            {/* Contact & Info */}
            <div style={s.card}>
              <div style={s.secHd}>📞 Kontak Panitia</div>
              <div style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.8 }}>
                <div>WhatsApp: <strong style={{ color: "#f1f5f9" }}>{(eventConfig as any).whatsappDisplay || (eventConfig as any).whatsappNumber || "0812-xxxx-xxxx"}</strong></div>
                <div>Email: <strong style={{ color: "#f1f5f9" }}>{(eventConfig as any).contactEmail || "contact@grandrecruitment.id"}</strong></div>
                <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#475569" }}>
                  Jam operasional: Senin–Jumat 08.00–17.00 WIB
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: POSISI BOOTH ── */}
        {activeTab === "booth" && (
          <div>
            <div style={s.card}>
              <div style={s.secHd}>🗺️ Posisi Booth Anda</div>
              {booking.status === "confirmed" ? (
                <>
                  <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                    Pembayaran sudah dikonfirmasi. Booth Anda sudah terkunci di posisi berikut:
                  </p>
                  {booths.map((b: any, i: number) => (
                    <div key={i} style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.25)", borderRadius: 12, padding: "1.25rem", marginBottom: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: "1.5rem", color: "#14b8a6" }}>Booth {b.label}</div>
                          <div style={{ color: "#64748b", fontSize: "0.85rem" }}>{b.type === "main" ? "Main Booth · 5×5 meter" : b.type === "extra" ? "Extra Booth" : "Standard Booth · 3×3 meter"}</div>
                        </div>
                        <div style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.3)", borderRadius: 8, padding: "0.4rem 1rem", fontSize: "0.82rem", color: "#14b8a6", fontWeight: 700 }}>
                          ✅ Confirmed
                        </div>
                      </div>
                    </div>
                  ))}
                  <div style={{ padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: 10, fontSize: "0.82rem", color: "#64748b", lineHeight: 1.7 }}>
                    📌 Informasi teknis setup booth akan dikirimkan H-3 sebelum acara via WhatsApp dan email yang terdaftar.
                  </div>
                </>
              ) : (
                <div style={{ padding: "0.5rem 0" }}>
                  {/* Warning banner */}
                  <div style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    <div style={{ fontSize: "1.5rem", flexShrink: 0 }}>⚠️</div>
                    <div>
                      <div style={{ fontWeight: 700, color: "#fed7aa", marginBottom: "0.4rem" }}>Booth belum dikunci atas nama Anda</div>
                      <p style={{ fontSize: "0.82rem", color: "#9a3412", lineHeight: 1.7 }}>
                        Booth di bawah ini adalah pilihan Anda saat pendaftaran. Namun selama pembayaran belum dikonfirmasi,
                        booth ini <strong style={{ color: "#f97316" }}>masih bisa dipesan oleh perusahaan lain</strong>.
                        Segera lakukan pembayaran untuk mengunci posisi booth Anda.
                      </p>
                    </div>
                  </div>

                  {/* Booth list */}
                  {booths.map((b: any, i: number) => (
                    <div key={i} style={{ background: "rgba(249,115,22,0.05)", border: "1px dashed rgba(249,115,22,0.35)", borderRadius: 12, padding: "1.25rem", marginBottom: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: "1.5rem", color: "#f97316" }}>Booth {b.label}</div>
                          <div style={{ color: "#64748b", fontSize: "0.85rem" }}>{b.type === "main" ? "Main Booth · 5×5 meter" : b.type === "extra" ? "Extra Booth" : "Standard Booth · 3×3 meter"}</div>
                        </div>
                        <div style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 8, padding: "0.4rem 1rem", fontSize: "0.82rem", color: "#f97316", fontWeight: 700 }}>
                          ⏳ Belum Dikunci
                        </div>
                      </div>
                    </div>
                  ))}

                  <div style={{ padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: 10, fontSize: "0.82rem", color: "#64748b", lineHeight: 1.7, marginTop: "0.5rem" }}>
                    📌 Layout denah venue dan posisi booth tepat akan dikirimkan H-3 sebelum acara <strong style={{ color: "#f1f5f9" }}>setelah pembayaran dikonfirmasi</strong>.
                  </div>

                  <button onClick={() => setActiveTab("status")}
                    style={{ marginTop: "1.25rem", background: "linear-gradient(135deg,#D4A017,#B8860B)", border: "none", color: "#fff", borderRadius: 10, padding: "0.75rem 1.5rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", width: "100%" }}>
                    Lihat Instruksi Pembayaran & Segera Bayar →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: INTERVIEW BOOTH ── */}
        {activeTab === "interview" && (
          <div>
            {booking.status === "confirmed" ? (() => {
              const hasExistingBooking = hasBooked || (takenRaw || []).some(
                (b: any) => b.employerBookingId === sessionData?.bookingId
              );
              const rescheduleCount = (booking as any).rescheduleCount ?? 0;
              const canReschedule = rescheduleCount < 1;

              // ── State: sudah booking, tidak sedang reschedule ──
              if (hasExistingBooking && !isRescheduling) return (
                <>
                  <div style={s.teal}>
                    <div style={s.secHd}>✅ Slot Interview Terdaftar</div>
                    {(() => {
                      // Pakai takenRaw kalau sudah ada, fallback ke confirmedSlots
                      const displaySlots = (takenRaw && takenRaw.length > 0)
                        ? (takenRaw as any[]).map(b => ({ boothId: b.boothId, day: b.day, slotIndex: b.slotIndex, id: b.id }))
                        : confirmedSlots.map((s, i) => ({ ...s, id: i }));
                      return displaySlots.length === 0
                        ? <div style={{ color: "#64748b", fontSize: "0.85rem" }}>⏳ Memuat data slot...</div>
                        : displaySlots.map((b: any) => (
                          <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid rgba(20,184,166,0.1)", fontSize: "0.9rem", color: "#cbd5e1" }}>
                            <span>Booth <strong style={{ color: "#60a5fa" }}>{b.boothId}</strong></span>
                            <span>{DAYS[b.day]?.split(",")[0]} · {SLOTS_BY_DAY[b.day]?.[b.slotIndex]}</span>
                            <span style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 6, padding: "0.15rem 0.6rem", fontSize: "0.75rem", color: "#6ee7b7" }}>✓ Terkonfirmasi</span>
                          </div>
                        ));
                    })()}
                  </div>
                  <div style={{ marginTop: "0.5rem" }}>
                    {canReschedule ? (
                      <button
                        onClick={() => { setIsRescheduling(true); setMySlots([]); setHasBooked(false); setConfirmedSlots([]); }}
                        style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", color: "#D4A017", borderRadius: 10, padding: "0.75rem 1.5rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer" }}>
                        🔄 Ubah Jadwal (1x)
                      </button>
                    ) : (
                      <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "1rem", color: "#fca5a5", fontSize: "0.85rem" }}>
                        ⚠️ Anda sudah menggunakan kesempatan ubah jadwal.
                      </div>
                    )}
                  </div>
                </>
              );

              // ── State: belum booking atau sedang reschedule ──
              return (
              <>
                {/* Slot info */}
                <div style={s.teal}>
                  <div style={s.secHd}>📅 {isRescheduling ? "Pilih Jadwal Baru" : "Booking Interview Booth"}</div>
                  {isRescheduling && (
                    <div style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.25)", borderRadius: 8, padding: "0.65rem 1rem", marginBottom: "1rem", fontSize: "0.83rem", color: "#fde68a" }}>
                      ⚠️ Jadwal lama akan dihapus dan diganti. Pilih slot baru lalu klik Konfirmasi.
                    </div>
                  )}
                  <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1rem", lineHeight: 1.7 }}>
                    Interview booth tersedia <strong style={{ color: "#f1f5f9" }}>gratis</strong> untuk employer yang sudah memesan booth.
                    Pilih booth dan slot waktu yang tersedia.
                  </p>
                  <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                    <div style={{ background: "rgba(20,184,166,0.1)", borderRadius: 10, padding: "0.75rem 1.25rem", textAlign: "center" }}>
                      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#14b8a6" }}>{mySlots.length}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Slot Dipilih</div>
                    </div>
                    <div style={{ background: "rgba(212,160,23,0.1)", borderRadius: 10, padding: "0.75rem 1.25rem", textAlign: "center" }}>
                      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#D4A017" }}>{maxSlots}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Maks Slot</div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "0.75rem 1.25rem" }}>
                      <div style={{ fontSize: "0.78rem", color: "#64748b", lineHeight: 1.6 }}>
                        {[
                          mainCount > 0  && `Main × ${mainCount} = ${mainCount * mainSlotPerBooth} slot`,
                          stdCount > 0   && `Standard × ${stdCount} = ${stdCount * stdSlotPerBooth} slot`,
                          extraCount > 0 && `Extra × ${extraCount} = ${extraCount * extraSlotPerBooth} slot`,
                        ].filter(Boolean).join(" · ")}
                        <br/><span style={{ color: "#94a3b8" }}>Total selama 2 hari event</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Day selector */}
                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  {DAYS.map((day, i) => (
                    <button key={i} onClick={() => setSelectedDay(i)}
                      style={{ flex: 1, padding: "0.75rem", borderRadius: 10, border: `2px solid ${selectedDay === i ? "#14b8a6" : "rgba(255,255,255,0.08)"}`, background: selectedDay === i ? "rgba(20,184,166,0.1)" : "transparent", color: selectedDay === i ? "#14b8a6" : "#64748b", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
                      {day}
                    </button>
                  ))}
                </div>

                {/* Slot grid */}
                <div style={s.card}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                      <thead>
                        <tr>
                          <th style={{ padding: "0.6rem 0.75rem", textAlign: "left", fontSize: "0.78rem", color: "#64748b", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            Booth \ Waktu
                          </th>
                          {SLOTS_BY_DAY[selectedDay].map(slot => (
                            <th key={slot} style={{ padding: "0.6rem 0.5rem", textAlign: "center", fontSize: "0.72rem", color: "#64748b", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" }}>
                              {slot}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {INTERVIEW_BOOTHS.map(booth => (
                          <tr key={booth}>
                            <td style={{ padding: "0.5rem 0.75rem", fontWeight: 700, color: "#60a5fa", fontSize: "0.85rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              {booth}
                            </td>
                            {SLOTS_BY_DAY[selectedDay].map((_, slotIdx) => {
                              const key = `${booth}-${selectedDay}-${slotIdx}`;
                              const isMine = mySlots.includes(key);
                              const isTaken = !!(isRescheduling ? blockedByOthers[key] : takenSlots[key]);
                              const bg = isMine ? "#065f46" : isTaken ? "#7f1d1d" : "rgba(20,184,166,0.08)";
                              const border = isMine ? "1px solid #10b981" : isTaken ? "1px solid #ef4444" : "1px solid rgba(20,184,166,0.15)";
                              const label = isMine ? "✓ Saya" : isTaken ? "✗" : "•";
                              const color = isMine ? "#10b981" : isTaken ? "#f87171" : "#14b8a6";
                              return (
                                <td key={slotIdx} style={{ padding: "0.4rem", borderBottom: "1px solid rgba(255,255,255,0.04)", textAlign: "center" }}>
                                  <div
                                    onClick={() => !isTaken && handleBookSlot(key)}
                                    title={isTaken ? takenSlots[key] : isMine ? "Klik untuk batalkan" : "Klik untuk booking"}
                                    style={{ background: bg, border, borderRadius: 6, padding: "0.4rem 0.2rem", fontSize: "0.72rem", color, fontWeight: 700, cursor: isTaken ? "not-allowed" : "pointer", minWidth: 40, transition: "all 0.15s" }}>
                                    {label}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Legend */}
                  <div style={{ display: "flex", gap: "1.25rem", marginTop: "1rem", flexWrap: "wrap" }}>
                    {[
                      { color: "#14b8a6", bg: "rgba(20,184,166,0.08)", label: "Tersedia" },
                      { color: "#10b981", bg: "#065f46", label: "Dipilih (saya)" },
                      { color: "#f87171", bg: "#7f1d1d", label: "Sudah dipesan" },
                    ].map(l => (
                      <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "#64748b" }}>
                        <div style={{ width: 16, height: 16, borderRadius: 3, background: l.bg, border: `1px solid ${l.color}` }} />
                        {l.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected slots summary */}
                {mySlots.length > 0 && (
                  <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 12, padding: "1.25rem", marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.82rem", color: "#6ee7b7", fontWeight: 700, marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Slot yang Dipilih ({mySlots.length}/{maxSlots})
                    </div>
                    {mySlots.map(key => {
                      const [booth, day, slot] = key.split("-");
                      return (
                        <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.4rem" }}>
                          <span>Booth <strong style={{ color: "#60a5fa" }}>{booth}</strong> · {DAYS[parseInt(day)].split(",")[0]} · {SLOTS_BY_DAY[parseInt(day)]?.[parseInt(slot)]}</span>
                          <button onClick={() => setMySlots(prev => prev.filter(s => s !== key))}
                            style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "1rem" }}>×</button>
                        </div>
                      );
                    })}
                    <button
                      onClick={async () => {
                        try {
                          for (const b of (takenRaw || []) as any[]) {
                            await cancelInterviewMutation.mutateAsync({ id: b.id });
                          }
                          for (const key of mySlots) {
                            const [boothId, dayStr, slotStr] = key.split("-");
                            await confirmInterviewMutation.mutateAsync({
                              employerBookingId: sessionData?.bookingId || "",
                              boothId,
                              day: parseInt(dayStr),
                              slotIndex: parseInt(slotStr),
                              companyName: (booking as any)?.companyName || "",
                            });
                          }
                          if (isRescheduling) {
                            await incrementRescheduleMutation.mutateAsync({ bookingId: sessionData?.bookingId || "" });
                            setIsRescheduling(false);
                          }
                          toast.success("Booking interview booth berhasil!");
                          setMySlots([]);
                          refetchTaken();
                          refetchAllTaken();
                        } catch (err: any) {
                          toast.error("Gagal: " + err.message);
                        }
                      }}
                      disabled={confirmInterviewMutation.isPending || cancelInterviewMutation.isPending}
                      style={{ marginTop: "1rem", background: "linear-gradient(135deg,#0d9488,#14b8a6)", border: "none", color: "#fff", borderRadius: 10, padding: "0.75rem", fontSize: "0.9rem", fontWeight: 700, cursor: (confirmInterviewMutation.isPending || cancelInterviewMutation.isPending) ? "not-allowed" : "pointer", width: "100%", opacity: (confirmInterviewMutation.isPending || cancelInterviewMutation.isPending) ? 0.7 : 1 }}>
                      {(confirmInterviewMutation.isPending || cancelInterviewMutation.isPending) ? "⏳ Menyimpan..." : "Konfirmasi Booking Interview Booth ✓"}
                    </button>
                  </div>
                )}
              </>
            ); })() : (
              <div style={s.card}>
                <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔒</div>
                  <h3 style={{ fontWeight: 700, marginBottom: "0.75rem" }}>Fitur Terkunci</h3>
                  <p style={{ color: "#64748b", fontSize: "0.85rem", lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
                    Booking interview booth hanya tersedia setelah pembayaran booth dikonfirmasi oleh panitia.
                  </p>
                  <button onClick={() => setActiveTab("status")}
                    style={{ marginTop: "1.5rem", background: "linear-gradient(135deg,#D4A017,#B8860B)", border: "none", color: "#fff", borderRadius: 10, padding: "0.75rem 1.5rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer" }}>
                    Lihat Instruksi Pembayaran →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: ID CARD STAFF ── */}
        {activeTab === "idcard" && (
          <div>
            {booking.status === "confirmed" ? (
              <>
                {/* Info kuota */}
                <div style={{ background: "rgba(129,140,248,0.06)", border: "1px solid rgba(129,140,248,0.2)", borderRadius: 12, padding: "1rem 1.5rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Kuota ID Card Staff</div>
                    <div style={{ fontWeight: 800, fontSize: "1.3rem", color: "#818cf8" }}>{staffList.length} <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#64748b" }}>/ {maxStaff} orang</span></div>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.7 }}>
                    {mainCount > 0 && <div>Main Booth ({mainCount}×) → {mainCount * 4} ID Card</div>}
                    {stdCount > 0  && <div>Standard Booth ({stdCount}×) → {stdCount * 2} ID Card</div>}
                    <div style={{ color: "#94a3b8", fontSize: "0.75rem", marginTop: "0.25rem" }}>ID Card akan dicetak oleh vendor panitia</div>
                  </div>
                </div>

                {/* Info banner */}
                <div style={{ background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 10, padding: "0.9rem 1.25rem", marginBottom: "1.5rem" }}>
                  <p style={{ fontSize: "0.82rem", color: "#D4A017", fontWeight: 700, marginBottom: "0.25rem" }}>ℹ️ Informasi</p>
                  <p style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.6 }}>
                    Daftar nama dan posisi staff di bawah akan dikirimkan ke panitia untuk dicetak pada ID Card. Pastikan nama dan posisi sudah benar sebelum menyimpan.
                  </p>
                </div>

                {/* Form tambah staff — tampil selama kuota belum penuh */}
                {staffList.length < maxStaff && (
                  <div style={{ ...s.card, border: "1px solid rgba(129,140,248,0.2)" }}>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#818cf8", marginBottom: "1rem" }}>➕ Tambah Staff</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>Nama Lengkap *</div>
                        <input
                          style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(129,140,248,0.3)", borderRadius: 8, padding: "0.65rem 0.9rem", fontSize: "0.88rem", color: "#f1f5f9", outline: "none" }}
                          value={staffForm.nama}
                          onChange={e => setStaffForm(p => ({ ...p, nama: e.target.value }))}
                          placeholder="Contoh: Budi Santoso"
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>Posisi / Jabatan *</div>
                        <input
                          style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(129,140,248,0.3)", borderRadius: 8, padding: "0.65rem 0.9rem", fontSize: "0.88rem", color: "#f1f5f9", outline: "none" }}
                          value={staffForm.posisi}
                          onChange={e => setStaffForm(p => ({ ...p, posisi: e.target.value }))}
                          placeholder="Contoh: HRD Manager"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (!staffForm.nama.trim() || !staffForm.posisi.trim()) {
                          toast.error("Nama dan posisi wajib diisi");
                          return;
                        }
                        setStaffList(prev => [...prev, { ...staffForm }]);
                        setStaffForm({ nama: "", posisi: "" });
                        setStaffSaved(false); // reset saved state saat ada perubahan
                        toast.success("Staff ditambahkan!");
                      }}
                      style={{ background: "linear-gradient(135deg,#6366f1,#818cf8)", border: "none", color: "#fff", borderRadius: 8, padding: "0.65rem 1.5rem", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer" }}>
                      + Tambah
                    </button>
                  </div>
                )}

                {/* Daftar staff */}
                {staffList.length > 0 && (
                  <div style={s.card}>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#818cf8", marginBottom: "1rem" }}>
                      🪪 Daftar Staff ({staffList.length}/{maxStaff})
                    </div>
                    {staffList.map((staff, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#f1f5f9" }}>{staff.nama}</div>
                          <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "0.15rem" }}>{staff.posisi}</div>
                        </div>
                        {!staffSaved && (
                          <button
                            onClick={() => setStaffList(prev => prev.filter((_, idx) => idx !== i))}
                            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", borderRadius: 6, padding: "0.3rem 0.75rem", fontSize: "0.8rem", cursor: "pointer" }}>
                            Hapus
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Simpan / Edit */}
                    {!staffSaved ? (
                      <button
                        onClick={() => {
                          if (staffList.length === 0) { toast.error("Tambah minimal 1 staff"); return; }
                          saveStaffMutation.mutate({ bookingId, staffMembers: staffList });
                        }}
                        disabled={saveStaffMutation.isLoading}
                        style={{ marginTop: "1.25rem", width: "100%", background: "linear-gradient(135deg,#0d9488,#14b8a6)", border: "none", color: "#fff", borderRadius: 10, padding: "0.8rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", opacity: saveStaffMutation.isLoading ? 0.7 : 1 }}>
                        {saveStaffMutation.isLoading ? "Menyimpan..." : "✅ Simpan & Kirim ke Panitia"}
                      </button>
                    ) : (
                      <div style={{ marginTop: "1.25rem" }}>
                        <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 10, padding: "1rem", textAlign: "center", marginBottom: "0.75rem" }}>
                          <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>✅</div>
                          <div style={{ fontWeight: 700, color: "#10b981", marginBottom: "0.25rem" }}>Daftar staff sudah dikirim ke panitia</div>
                          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>ID Card akan dicetak oleh vendor dan diserahkan saat hari H</div>
                        </div>
                        <button
                          onClick={() => setStaffSaved(false)}
                          style={{ width: "100%", background: "transparent", border: "1px solid rgba(129,140,248,0.3)", color: "#818cf8", borderRadius: 10, padding: "0.65rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                          ✏️ Edit Daftar Staff
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {staffList.length === 0 && (
                  <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748b" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🪪</div>
                    <p style={{ fontSize: "0.9rem" }}>Belum ada staff yang ditambahkan.<br/>Tambahkan nama dan posisi staff yang akan hadir di booth.</p>
                  </div>
                )}
              </>
            ) : (
              <div style={s.card}>
                <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔒</div>
                  <h3 style={{ fontWeight: 700, marginBottom: "0.75rem" }}>Fitur Terkunci</h3>
                  <p style={{ color: "#64748b", fontSize: "0.85rem", lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
                    Pengisian data ID Card Staff hanya tersedia setelah pembayaran booth dikonfirmasi oleh panitia.
                  </p>
                  <button onClick={() => setActiveTab("status")}
                    style={{ marginTop: "1.5rem", background: "linear-gradient(135deg,#D4A017,#B8860B)", border: "none", color: "#fff", borderRadius: 10, padding: "0.75rem 1.5rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer" }}>
                    Lihat Instruksi Pembayaran →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: REKRUTMEN ── */}
        {activeTab === "rekrutmen" && (
          <div>
            <div style={s.card}>
              <div style={s.secHd}>📄 Job Vacancies</div>
              <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1.25rem", lineHeight: 1.7 }}>
                Upload daftar lowongan kerja yang akan dibuka di GR2026. File akan ditampilkan kepada jobseeker yang berminat.
              </p>

              {/* Existing files */}
              {Array.isArray((booking as any).jobVacanciesUrl) && (booking as any).jobVacanciesUrl.length > 0 && (
                <div style={{ marginBottom: "1.25rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>File Terupload</div>
                  {((booking as any).jobVacanciesUrl as { url: string; name: string }[]).map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(212,160,23,0.04)", border: "1px solid rgba(212,160,23,0.15)", borderRadius: 8, padding: "0.5rem 0.9rem", marginBottom: "0.4rem" }}>
                      <a href={f.url} target="_blank" rel="noreferrer" style={{ color: "#D4A017", fontSize: "0.85rem", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</a>
                      <span style={{ fontSize: "0.75rem", color: "#14b8a6", flexShrink: 0, marginLeft: "0.5rem" }}>✅</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload new files */}
              <label style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(212,160,23,0.08)", border: "1px dashed rgba(212,160,23,0.4)", borderRadius: 8, padding: "0.7rem 1.25rem", cursor: vacUploading ? "not-allowed" : "pointer", fontSize: "0.88rem", color: "#D4A017", fontWeight: 600 }}>
                {vacUploading ? "⏳ Uploading..." : "📤 Upload Job Vacancies"}
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.doc,.docx,.xlsx" style={{ display: "none" }} disabled={vacUploading}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) return;
                    setVacUploading(true);
                    try {
                      const existing: { url: string; name: string }[] = Array.isArray((booking as any).jobVacanciesUrl) ? (booking as any).jobVacanciesUrl : [];
                      const results: { url: string; name: string }[] = [];
                      const ts = Date.now();
                      for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
                        const seq = String(existing.length + i + 1).padStart(2, "0");
                        const safeName = `jobvacancy-${ts}-${seq}.${ext}`;
                        const url = await uploadToSupabase(file, "employer", `${sessionData?.bookingId}/vacancies/${safeName}`);
                        results.push({ url, name: safeName });
                      }
                      updateVacanciesMutation.mutate({ bookingId: sessionData?.bookingId || "", urls: [...existing, ...results] });
                    } catch (err: any) { toast.error("Upload gagal: " + err.message); }
                    setVacUploading(false);
                    e.target.value = "";
                  }} />
              </label>
              <div style={{ marginTop: "0.6rem", fontSize: "0.75rem", color: "#475569" }}>Format: PDF, JPG, DOC, DOCX, XLSX · Multiple files diizinkan</div>
            </div>
            {/* Kondisi Rekrutmen */}
            <div style={s.card}>
              <div style={s.secHd}>📊 Kondisi Rekrutmen</div>
              <div style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 10, padding: "0.85rem 1rem", marginBottom: "1.25rem" }}>
                <p style={{ fontSize: "0.83rem", color: "#94a3b8", lineHeight: 1.75, margin: 0 }}>
                  ℹ️ Silakan update kondisi rekrutmen Anda di event ini. Dengan mengisi form ini, Anda membantu kami membuat event yang lebih sesuai kebutuhan Anda di masa depan.
                </p>
              </div>

              {rekrutmenRows.map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 1fr auto", gap: "0.75rem", alignItems: "center", marginBottom: "0.75rem" }}>
                  <input
                    placeholder="Posisi (contoh: Waiter)"
                    value={row.posisi}
                    onChange={e => setRekrutmenRows(prev => prev.map((r, idx) => idx === i ? { ...r, posisi: e.target.value } : r))}
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.6rem 0.85rem", fontSize: "0.85rem", color: "#f1f5f9", outline: "none" }}
                  />
                  <input
                    placeholder="Jumlah"
                    type="number"
                    min={1}
                    value={row.jumlah}
                    onChange={e => setRekrutmenRows(prev => prev.map((r, idx) => idx === i ? { ...r, jumlah: e.target.value } : r))}
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.6rem 0.85rem", fontSize: "0.85rem", color: "#f1f5f9", outline: "none", width: "100%" }}
                  />
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    {["Terpenuhi", "Tidak Terpenuhi"].map(opt => (
                      <label key={opt} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", color: row.status === opt ? "#14b8a6" : "#64748b", cursor: "pointer", fontWeight: row.status === opt ? 700 : 400 }}>
                        <input type="radio" name={`status-${i}`} value={opt} checked={row.status === opt}
                          onChange={() => setRekrutmenRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: opt } : r))}
                          style={{ accentColor: "#14b8a6" }} />
                        {opt}
                      </label>
                    ))}
                  </div>
                  <button onClick={() => setRekrutmenRows(prev => prev.filter((_, idx) => idx !== i))}
                    style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "1rem", padding: "0.25rem" }}>✕</button>
                </div>
              ))}

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                <button onClick={() => setRekrutmenRows(prev => [...prev, { posisi: "", jumlah: "", status: "" }])}
                  style={{ background: "transparent", border: "1px dashed rgba(20,184,166,0.4)", color: "#14b8a6", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.82rem", cursor: "pointer", fontWeight: 600 }}>
                  + Tambah Posisi
                </button>
                <button
                  onClick={async () => {
                    const validRows = rekrutmenRows.filter(r => r.posisi.trim());
                    if (validRows.length < 2) {
                      toast.error("Isi minimal 2 posisi rekrutmen");
                      return;
                    }
                    setSavingRekrutmen(true);
                    savePositionsMutation.mutate(
                      { bookingId: sessionData?.bookingId || "", positions: validRows },
                      { onSettled: () => setSavingRekrutmen(false) }
                    );
                  }}
                  disabled={savingRekrutmen}
                  style={{ background: "linear-gradient(135deg,#14b8a6,#0d9488)", border: "none", color: "#fff", borderRadius: 8, padding: "0.5rem 1.25rem", fontSize: "0.82rem", fontWeight: 700, cursor: savingRekrutmen ? "not-allowed" : "pointer", opacity: savingRekrutmen ? 0.7 : 1 }}>
                  {savingRekrutmen ? "⏳ Menyimpan..." : "💾 Simpan"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ── TAB: LAMARAN MASUK (VIRTUAL PHASE — Opsi A) ── */}
        {activeTab === "lamaran" && (() => {
          const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
            new:          { label: "🔵 Baru",          color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
            viewed:       { label: "👁 Sudah Dilihat",  color: "#D4A017", bg: "rgba(212,160,23,0.12)"  },
            contacted:    { label: "✅ Dihubungi",      color: "#10b981", bg: "rgba(16,185,129,0.12)"  },
            not_relevant: { label: "➖ Tidak Relevan",  color: "#64748b", bg: "rgba(100,116,139,0.12)" },
          };
          const posOptions = Array.from(new Set(lamaranList.map((a: any) => a.positionName).filter(Boolean))).sort() as string[];
          const filtered = lamaranList.filter((a: any) => {
            if (lmFilterPos && a.positionName !== lmFilterPos) return false;
            if (lmFilterStatus && a.status !== lmFilterStatus) return false;
            return true;
          });

          const setStatus = (app: any, status: "viewed" | "contacted" | "not_relevant") => {
            updateAppStatusMutation.mutate({
              bookingId: sessionData?.bookingId || "",
              email: sessionData?.email || "",
              applicationId: app.id,
              status,
            });
          };

          const handleExpand = (app: any) => {
            const next = lmExpandedId === app.id ? null : app.id;
            setLmExpandedId(next);
            // Auto: "Baru" → "Sudah Dilihat" saat detail dibuka
            if (next !== null && app.status === "new") setStatus(app, "viewed");
          };

          const downloadCv = async (app: any) => {
            try {
              const res = await fetch(app.cvUrl);
              if (!res.ok) throw new Error("fetch failed");
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const ext = ((app.cvUrl.split("?")[0].split(".").pop() || "pdf")).toLowerCase();
              const a = document.createElement("a");
              a.href = url;
              a.download = `CV_${(app.namaLengkap || "kandidat").replace(/[^a-zA-Z0-9 \-_.]/g, "").trim().replace(/\s+/g, "_")}.${ext}`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            } catch {
              // Fallback: buka di tab baru kalau download langsung gagal
              window.open(app.cvUrl, "_blank");
            }
          };

          const exportCsv = () => {
            const statusLabel: Record<string, string> = { new: "Baru", viewed: "Sudah Dilihat", contacted: "Dihubungi", not_relevant: "Tidak Relevan" };
            const rows: (string | number)[][] = [
              ["Nama", "Institusi", "Jurusan", "Tahun Lulus", "Kota", "WhatsApp", "Posisi", "Status", "Tanggal Masuk", "Link CV"],
              ...filtered.map((a: any) => [
                a.namaLengkap ?? "", a.institusi ?? "", a.jurusan ?? "", a.tahunLulus ?? "", a.kota ?? "",
                a.whatsapp ?? "", a.positionName ?? "", statusLabel[a.status] ?? a.status ?? "",
                a.createdAt ? new Date(a.createdAt).toLocaleDateString("id-ID") : "", a.cvUrl ?? "",
              ]),
            ];
            // BOM + delimiter titik-koma supaya langsung rapi dibuka di Excel (locale Indonesia)
            const csv = "\uFEFF" + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Lamaran_${sessionData?.bookingId || "GR2026"}_${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          };

          const sel = { background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "0.5rem 0.75rem", fontSize: "0.82rem", color: "#f1f5f9", outline: "none" } as React.CSSProperties;
          const optStyle = { background: "#0f172a", color: "#f1f5f9" };

          return (
            <div>
              <div style={s.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div style={s.secHd}>📨 Lamaran Masuk — Virtual Phase</div>
                  {lamaranList.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        {filtered.length} dari {lamaranList.length} lamaran{lamaranNewCount > 0 ? ` · ${lamaranNewCount} baru` : ""}
                      </span>
                      <button onClick={exportCsv}
                        style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", color: "#D4A017", borderRadius: 8, padding: "0.45rem 0.85rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>
                        ⬇ Export CSV
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.15)", borderRadius: 8, padding: "0.65rem 1rem", marginBottom: "1.25rem", fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.6 }}>
                  ℹ️ Kandidat di bawah ini menyatakan minat ke lowongan Anda melalui GR2026 Virtual Phase. Klik kartu untuk melihat detail — status otomatis berubah menjadi "Sudah Dilihat".
                </div>

                {/* Filter */}
                {lamaranList.length > 0 && (
                  <div style={{ display: "flex", gap: "0.65rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                    <select value={lmFilterPos} onChange={e => setLmFilterPos(e.target.value)} style={sel}>
                      <option value="" style={optStyle}>Semua Posisi</option>
                      {posOptions.map(p => <option key={p} value={p} style={optStyle}>{p}</option>)}
                    </select>
                    <select value={lmFilterStatus} onChange={e => setLmFilterStatus(e.target.value)} style={sel}>
                      <option value="" style={optStyle}>Semua Status</option>
                      <option value="new" style={optStyle}>Baru</option>
                      <option value="viewed" style={optStyle}>Sudah Dilihat</option>
                      <option value="contacted" style={optStyle}>Dihubungi</option>
                      <option value="not_relevant" style={optStyle}>Tidak Relevan</option>
                    </select>
                    {(lmFilterPos || lmFilterStatus) && (
                      <button onClick={() => { setLmFilterPos(""); setLmFilterStatus(""); }}
                        style={{ background: "none", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", borderRadius: 8, padding: "0.5rem 0.75rem", fontSize: "0.78rem", cursor: "pointer" }}>
                        ✕ Reset
                      </button>
                    )}
                  </div>
                )}

                {lamaranQuery.isLoading && <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>⏳ Memuat lamaran...</p>}

                {!lamaranQuery.isLoading && lamaranList.length === 0 && (
                  <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748b" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
                    <p style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>Belum ada lamaran masuk.<br/>Kandidat yang menyatakan minat ke lowongan Anda akan muncul di sini.</p>
                  </div>
                )}

                {!lamaranQuery.isLoading && lamaranList.length > 0 && filtered.length === 0 && (
                  <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>Tidak ada lamaran yang sesuai filter.</p>
                )}

                {/* Card list */}
                {filtered.map((app: any) => {
                  const meta = STATUS_META[app.status] || STATUS_META.new;
                  const isOpen = lmExpandedId === app.id;
                  const waClean = (app.whatsapp || "").replace(/[^0-9]/g, "");
                  return (
                    <div key={app.id}
                      style={{ background: app.status === "new" ? "rgba(96,165,250,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${isOpen ? "rgba(20,184,166,0.35)" : app.status === "new" ? "rgba(96,165,250,0.25)" : "rgba(255,255,255,0.07)"}`, borderRadius: 12, marginBottom: "0.75rem", overflow: "hidden", transition: "border 0.15s" }}>

                      {/* Header kartu — klik untuk expand */}
                      <div onClick={() => handleExpand(app)}
                        style={{ display: "flex", alignItems: "center", gap: "0.9rem", padding: "0.9rem 1.1rem", cursor: "pointer" }}>
                        {app.fotoUrl
                          ? <img src={app.fotoUrl} alt="" style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                          : <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(212,160,23,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>👤</div>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.namaLengkap}</div>
                          <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "0.15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            Posisi: <span style={{ color: "#14b8a6", fontWeight: 600 }}>{app.positionName}</span>
                            {app.institusi ? <span> · {app.institusi}</span> : null}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem", flexShrink: 0 }}>
                          <span style={{ fontSize: "0.72rem", background: meta.bg, color: meta.color, borderRadius: 12, padding: "0.2rem 0.6rem", fontWeight: 700, whiteSpace: "nowrap" }}>{meta.label}</span>
                          <span style={{ fontSize: "0.7rem", color: "#475569" }}>
                            {app.createdAt ? new Date(app.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : ""}
                          </span>
                        </div>
                        <span style={{ color: "#475569", fontSize: "0.8rem", flexShrink: 0 }}>{isOpen ? "▲" : "▼"}</span>
                      </div>

                      {/* Detail expanded */}
                      {isOpen && (
                        <div style={{ padding: "0 1.1rem 1.1rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: "0.85rem", padding: "1rem 0" }}>
                            {[
                              { label: "Institusi",   val: app.institusi  || "—" },
                              { label: "Jurusan",     val: app.jurusan    || "—" },
                              { label: "Tahun Lulus", val: app.tahunLulus || "—" },
                              { label: "Kota",        val: app.kota       || "—" },
                              { label: "Minat Kerja", val: (app.minatKerja || app.bidangMinat || "—").replace(/_/g, " ") },
                            ].map(item => (
                              <div key={item.label}>
                                <div style={{ fontSize: "0.68rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.2rem" }}>{item.label}</div>
                                <div style={{ fontSize: "0.85rem", color: "#f1f5f9", fontWeight: 600 }}>{item.val}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                            {app.cvUrl ? (
                              <button onClick={() => downloadCv(app)}
                                style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", color: "#D4A017", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                                ⬇ Download CV
                              </button>
                            ) : (
                              <span style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#475569", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.82rem" }}>CV tidak tersedia</span>
                            )}
                            {waClean && (
                              <a href={`https://wa.me/${waClean}`} target="_blank" rel="noreferrer"
                                style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.3)", color: "#25d366", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 700, textDecoration: "none" }}>
                                💬 Hubungi via WA
                              </a>
                            )}
                            {app.status !== "contacted" && (
                              <button onClick={() => setStatus(app, "contacted")} disabled={updateAppStatusMutation.isPending}
                                style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                                ✅ Tandai Dihubungi
                              </button>
                            )}
                            {app.status !== "not_relevant" && (
                              <button onClick={() => setStatus(app, "not_relevant")} disabled={updateAppStatusMutation.isPending}
                                style={{ background: "none", border: "1px solid rgba(100,116,139,0.3)", color: "#64748b", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.82rem", cursor: "pointer" }}>
                                ➖ Tidak Relevan
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {activeTab === "kandidat" && (() => {
          const b = booking as any;
          const isConfirmed = b.status === "confirmed";

          if (!isConfirmed) {
            return (
              <div style={s.card}>
                <div style={s.secHd}>🔒 Akses Kandidat Terkunci</div>
                <p style={{ color: "#64748b", fontSize: "0.88rem", lineHeight: 1.7 }}>
                  Akses daftar kandidat akan tersedia setelah pembayaran booth dikonfirmasi oleh panitia.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.7rem 0", marginTop: "1rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>{isConfirmed ? "✅" : "⬜"}</span>
                  <span style={{ fontSize: "0.88rem", color: isConfirmed ? "#94a3b8" : "#f1f5f9" }}>Pembayaran sudah dikonfirmasi panitia</span>
                </div>
              </div>
            );
          }

          const errMsg = (kandidatQuery.error as any)?.message;
          const accessError = errMsg === "ACCESS_NOT_OPEN" ? "Akses kandidat belum dibuka oleh panitia."
            : errMsg === "ACCESS_CLOSED" ? "Akses kandidat sudah ditutup."
            : errMsg ? `Gagal memuat: ${errMsg}` : null;

          const raw: any[] = kandidatQuery.data || [];
          const institusiOptions = Array.from(new Set(raw.map((j: any) => j.institusi).filter(Boolean))).sort() as string[];

          const filtered = raw
            .filter((j: any) => {
              const nama = (j.namaLengkap || "").toLowerCase();
              const inst = (j.institusi || "").toLowerCase();
              if (kdSearch && !nama.includes(kdSearch.toLowerCase()) && !inst.includes(kdSearch.toLowerCase())) return false;
              if (kdFilterMinat) { const m = j.minatKerja || j.bidangMinat || ""; if (!m.toLowerCase().includes(kdFilterMinat.toLowerCase())) return false; }
              if (kdFilterStatus) { const st = j.statusKerja || j.status || ""; if (!st.toLowerCase().includes(kdFilterStatus.toLowerCase())) return false; }
              if (kdFilterInst && (j.institusi || "") !== kdFilterInst) return false;
              return true;
            })
            .sort((a: any, b: any) => {
              const av = (a[kdSortCol] || "").toString().toLowerCase();
              const bv = (b[kdSortCol] || "").toString().toLowerCase();
              return kdSortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
            });

          const totalPages = Math.max(1, Math.ceil(filtered.length / KD_PAGE_SIZE));
          const safePage   = Math.min(kdPage, totalPages);
          const paginated  = filtered.slice((safePage - 1) * KD_PAGE_SIZE, safePage * KD_PAGE_SIZE);

          const thSort = (col: typeof kdSortCol) => {
            if (kdSortCol === col) setKdSortDir(d => d === "asc" ? "desc" : "asc");
            else { setKdSortCol(col); setKdSortDir("asc"); }
            setKdPage(1);
          };
          const sortIcon = (col: typeof kdSortCol) => kdSortCol !== col ? " ↕" : kdSortDir === "asc" ? " ↑" : " ↓";

          const isAllSelected = filtered.length > 0 && filtered.every((j: any) => selectedKandidats.has(j.registrationId));
          const toggleAll = () => {
            if (isAllSelected) {
              setSelectedKandidats(new Set());
            } else {
              setSelectedKandidats(new Set(filtered.map((j: any) => j.registrationId)));
            }
          };
          const toggleOne = (id: string) => {
            setSelectedKandidats(prev => {
              const next = new Set(prev);
              next.has(id) ? next.delete(id) : next.add(id);
              return next;
            });
          };

          const downloadCSV = () => {
            const toDownload = filtered.filter((j: any) => selectedKandidats.has(j.registrationId));
            if (toDownload.length === 0) return;
            const headers = ["Nama Lengkap","Institusi","Jurusan","Tahun Lulus","Status Kerja","Minat Kerja","Kota","WhatsApp","URL Foto","URL CV"];
            const rows = toDownload.map((j: any) => [
              j.namaLengkap || "",
              j.institusi || "",
              j.jurusan || "",
              j.tahunLulus || "",
              (j.statusKerja || j.status || "").replace(/_/g," "),
              (j.minatKerja || j.bidangMinat || "").replace(/_/g," "),
              j.kota || "",
              j.fotoUrl || "",
              j.cvUrl || "",
            ].map((v: any) => `"${String(v).replace(/"/g,'""')}"`).join(","));
            const csv = [headers.join(","), ...rows].join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement("a");
            a.href = url; a.download = `kandidat-gr2026-${new Date().toISOString().slice(0,10)}.csv`;
            a.click(); URL.revokeObjectURL(url);
          };

          const sel = { background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "0.5rem 0.75rem", fontSize: "0.82rem", color: "#f1f5f9", outline: "none" } as React.CSSProperties;
          const optStyle = { background: "#0f172a", color: "#f1f5f9" };
          const th  = { padding: "0.65rem 0.75rem", fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.08)", whiteSpace: "nowrap" as const, userSelect: "none" as const };
          const td  = { padding: "0.6rem 0.75rem", fontSize: "0.83rem", color: "#f1f5f9", borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle" as const };

          return (
            <div>
              <div style={s.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div style={s.secHd}>👥 Daftar Kandidat Jobseeker</div>
                  {raw.length > 0 && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{filtered.length} dari {raw.length} kandidat</span>}
                </div>

                <div style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.15)", borderRadius: 8, padding: "0.65rem 1rem", marginBottom: "1.25rem", fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.6 }}>
                  ℹ️ Data ditampilkan sesuai UU PDP. NIK dan email tidak ditampilkan. Hubungi kandidat langsung di booth atau via WhatsApp yang tertera.
                </div>

                {kandidatQuery.isLoading && <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>⏳ Memuat kandidat...</p>}
                {accessError && <p style={{ color: "#f87171", textAlign: "center", padding: "2rem" }}>🔒 {accessError}</p>}

                {raw.length > 0 && (
                  <>
                    <div style={{ display: "flex", gap: "0.65rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                      <input placeholder="🔍 Cari nama / institusi..." value={kdSearch}
                        onChange={e => { setKdSearch(e.target.value); setKdPage(1); }}
                        style={{ ...sel, flex: "1 1 200px", minWidth: 160 }} />
                      <select value={kdFilterMinat} onChange={e => { setKdFilterMinat(e.target.value); setKdPage(1); }} style={sel}>
                        <option value="" style={optStyle}>Semua Minat</option>
                        <option value="dalam_negeri" style={optStyle}>Dalam Negeri</option>
                        <option value="luar_negeri" style={optStyle}>Luar Negeri</option>
                        <option value="keduanya" style={optStyle}>Keduanya</option>
                      </select>
                      <select value={kdFilterStatus} onChange={e => { setKdFilterStatus(e.target.value); setKdPage(1); }} style={sel}>
                        <option value="" style={optStyle}>Semua Status</option>
                        <option value="belum_bekerja" style={optStyle}>Belum Bekerja</option>
                        <option value="pernah_bekerja" style={optStyle}>Pernah Bekerja</option>
                        <option value="sedang_bekerja" style={optStyle}>Sedang Bekerja</option>
                      </select>
                      <select value={kdFilterInst} onChange={e => { setKdFilterInst(e.target.value); setKdPage(1); }} style={{ ...sel, maxWidth: 200 }}>
                        <option value="" style={optStyle}>Semua Institusi</option>
                        {institusiOptions.map(inst => <option key={inst} value={inst} style={optStyle}>{inst}</option>)}
                      </select>
                      {(kdSearch || kdFilterMinat || kdFilterStatus || kdFilterInst) && (
                        <button onClick={() => { setKdSearch(""); setKdFilterMinat(""); setKdFilterStatus(""); setKdFilterInst(""); setKdPage(1); }}
                          style={{ background: "none", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", borderRadius: 8, padding: "0.5rem 0.75rem", fontSize: "0.78rem", cursor: "pointer" }}>
                          ✕ Reset
                        </button>
                      )}
                    </div>

                    {selectedKandidats.size > 0 && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.25)", borderRadius: 8, padding: "0.6rem 1rem", marginBottom: "0.75rem" }}>
                        <span style={{ fontSize: "0.83rem", color: "#D4A017", fontWeight: 600 }}>✔ {selectedKandidats.size} kandidat dipilih</span>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button onClick={() => setSelectedKandidats(new Set())}
                            style={{ background: "none", border: "1px solid rgba(248,113,113,0.35)", color: "#f87171", borderRadius: 7, padding: "0.35rem 0.75rem", fontSize: "0.78rem", cursor: "pointer" }}>
                            ✕ Batal Pilih
                          </button>
                          <button onClick={downloadCSV}
                            style={{ background: "linear-gradient(135deg,#D4A017,#b8860b)", border: "none", color: "#fff", borderRadius: 7, padding: "0.35rem 0.9rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>
                            ⬇ Download CSV ({selectedKandidats.size})
                          </button>
                        </div>
                      </div>
                    )}

                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 750 }}>
                        <thead>
                          <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                            <th style={{ ...th, width: 36, textAlign: "center" }}>
                              <input type="checkbox" checked={isAllSelected} onChange={toggleAll}
                                title={isAllSelected ? "Batal pilih semua" : "Pilih semua hasil filter"}
                                style={{ cursor: "pointer", width: 15, height: 15 }} />
                            </th>
                            <th style={{ ...th, width: 44 }}>Foto</th>
                            <th style={{ ...th, cursor: "pointer" }} onClick={() => thSort("namaLengkap")}>Nama{sortIcon("namaLengkap")}</th>
                            <th style={{ ...th, cursor: "pointer" }} onClick={() => thSort("institusi")}>Institusi{sortIcon("institusi")}</th>
                            <th style={th}>Jurusan</th>
                            <th style={{ ...th, cursor: "pointer", textAlign: "center" }} onClick={() => thSort("tahunLulus")}>Lulus{sortIcon("tahunLulus")}</th>
                            <th style={th}>Status Kerja</th>
                            <th style={th}>Minat</th>
                            <th style={th}>Kota</th>
                            <th style={th}>WhatsApp</th>
                            <th style={{ ...th, textAlign: "center" }}>CV</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginated.length === 0 ? (
                            <tr><td colSpan={11} style={{ ...td, textAlign: "center", color: "#64748b", padding: "2rem" }}>Tidak ada kandidat yang sesuai filter.</td></tr>
                          ) : paginated.map((js: any) => (
                            <tr key={js.registrationId}
                              style={{ background: selectedKandidats.has(js.registrationId) ? "rgba(212,160,23,0.05)" : "transparent", transition: "background 0.1s" }}
                              onMouseEnter={e => { if (!selectedKandidats.has(js.registrationId)) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                              onMouseLeave={e => { if (!selectedKandidats.has(js.registrationId)) e.currentTarget.style.background = "transparent"; }}>
                              <td style={{ ...td, textAlign: "center" }}>
                                <input type="checkbox" checked={selectedKandidats.has(js.registrationId)} onChange={() => toggleOne(js.registrationId)}
                                  style={{ cursor: "pointer", width: 15, height: 15 }} />
                              </td>
                              <td style={td}>
                                {js.fotoUrl
                                  ? <img src={js.fotoUrl} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", display: "block" }} />
                                  : <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(212,160,23,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>👤</div>
                                }
                              </td>
                              <td style={{ ...td, fontWeight: 600 }}>{js.namaLengkap}</td>
                              <td style={{ ...td, color: "#94a3b8" }}>{js.institusi || "—"}</td>
                              <td style={{ ...td, color: "#64748b", fontSize: "0.78rem" }}>{js.jurusan || "—"}</td>
                              <td style={{ ...td, color: "#94a3b8", textAlign: "center" }}>{js.tahunLulus || "—"}</td>
                              <td style={td}>
                                <span style={{ fontSize: "0.75rem", background: "rgba(212,160,23,0.08)", color: "#D4A017", borderRadius: 12, padding: "0.2rem 0.5rem", whiteSpace: "nowrap" }}>
                                  {(js.statusKerja || js.status || "—").replace(/_/g, " ")}
                                </span>
                              </td>
                              <td style={td}>
                                <span style={{ fontSize: "0.75rem", background: "rgba(20,184,166,0.08)", color: "#14b8a6", borderRadius: 12, padding: "0.2rem 0.5rem", whiteSpace: "nowrap" }}>
                                  {(js.minatKerja || js.bidangMinat || "—").replace(/_/g, " ")}
                                </span>
                              </td>
                              <td style={{ ...td, color: "#64748b", fontSize: "0.78rem" }}>{js.kota || "—"}</td>
                              <td style={{ ...td, fontSize: "0.78rem" }}>
                                {js.whatsapp
                                  ? <a href={`https://wa.me/${js.whatsapp.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer"
                                      style={{ color: "#22c55e", textDecoration: "none", fontWeight: 600 }}>
                                      📱 {js.whatsapp}
                                    </a>
                                  : <span style={{ color: "#334155" }}>—</span>
                                }
                              </td>
                              <td style={{ ...td, textAlign: "center" }}>
                                {js.cvUrl
                                  ? <a href={js.cvUrl} target="_blank" rel="noreferrer" style={{ color: "#D4A017", fontSize: "1rem", textDecoration: "none" }} title="Lihat CV">📄</a>
                                  : <span style={{ color: "#334155" }}>—</span>
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Halaman {safePage} dari {totalPages} · {filtered.length} kandidat</span>
                        <div style={{ display: "flex", gap: "0.35rem" }}>
                          <button onClick={() => setKdPage(1)} disabled={safePage === 1}
                            style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: safePage === 1 ? "#334155" : "#94a3b8", borderRadius: 6, padding: "0.3rem 0.6rem", fontSize: "0.78rem", cursor: safePage === 1 ? "not-allowed" : "pointer" }}>«</button>
                          <button onClick={() => setKdPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                            style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: safePage === 1 ? "#334155" : "#94a3b8", borderRadius: 6, padding: "0.3rem 0.6rem", fontSize: "0.78rem", cursor: safePage === 1 ? "not-allowed" : "pointer" }}>‹</button>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pg = i + 1;
                            if (totalPages > 5) {
                              if (safePage <= 3) pg = i + 1;
                              else if (safePage >= totalPages - 2) pg = totalPages - 4 + i;
                              else pg = safePage - 2 + i;
                            }
                            return (
                              <button key={pg} onClick={() => setKdPage(pg)}
                                style={{ background: pg === safePage ? "#D4A017" : "none", border: `1px solid ${pg === safePage ? "#D4A017" : "rgba(255,255,255,0.1)"}`, color: pg === safePage ? "#fff" : "#94a3b8", borderRadius: 6, padding: "0.3rem 0.6rem", fontSize: "0.78rem", cursor: "pointer", minWidth: 30 }}>
                                {pg}
                              </button>
                            );
                          })}
                          <button onClick={() => setKdPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                            style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: safePage === totalPages ? "#334155" : "#94a3b8", borderRadius: 6, padding: "0.3rem 0.6rem", fontSize: "0.78rem", cursor: safePage === totalPages ? "not-allowed" : "pointer" }}>›</button>
                          <button onClick={() => setKdPage(totalPages)} disabled={safePage === totalPages}
                            style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: safePage === totalPages ? "#334155" : "#94a3b8", borderRadius: 6, padding: "0.3rem 0.6rem", fontSize: "0.78rem", cursor: safePage === totalPages ? "not-allowed" : "pointer" }}>»</button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {!kandidatQuery.isLoading && !accessError && raw.length === 0 && (
                  <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>Belum ada kandidat terdaftar.</p>
                )}
              </div>
            </div>
          );
        })()}
        {activeTab === "editprofil" && (() => {
          const b = booking as any;
          const inp = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "0.6rem 0.9rem", fontSize: "0.88rem", color: "#f1f5f9", outline: "none", boxSizing: "border-box" } as React.CSSProperties;
          const inpFocus = { ...inp, border: "1px solid rgba(212,160,23,0.4)" };

          const handleEdit = () => {
            setEditProfilForm({
              companyName:   b.companyName   || "",
              industry:      b.industry      || "",
              city:          b.city          || "",
              website:       b.website       || "",
              description:   b.description   || "",
              pic1Name:      b.pic1Name      || "",
              pic1Title:     b.pic1Title     || "",
              pic1Whatsapp:  b.pic1Whatsapp  || "",
              pic2Name:      b.pic2Name      || "",
              pic2Title:     b.pic2Title     || "",
              pic2Email:     b.pic2Email     || "",
              pic2Whatsapp:  b.pic2Whatsapp  || "",
              specialRequest: b.specialRequest || "",
            });
            setEditProfilMode(true);
          };

          const handleSave = () => {
            updateProfilMutation.mutate({ bookingId: sessionData?.bookingId || "", ...editProfilForm });
          };

          const upd = (key: string, val: string) => setEditProfilForm(p => ({ ...p, [key]: val }));

          return (
            <div>
              {/* Info perusahaan */}
              <div style={s.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <div style={s.secHd}>🏢 Profil Perusahaan</div>
                  {!editProfilMode && (
                    <button onClick={handleEdit}
                      style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", color: "#D4A017", borderRadius: 8, padding: "0.4rem 0.9rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                      ✏️ Edit Data
                    </button>
                  )}
                </div>

                <div style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 8, padding: "0.65rem 1rem", marginBottom: "1.25rem", fontSize: "0.8rem", color: "#fca5a5", lineHeight: 1.6 }}>
                  ⚠️ Email PIC 1 (<strong>{b.pic1Email}</strong>) dan Booking ID tidak bisa diubah karena digunakan untuk login. Hubungi panitia jika ada perubahan email.
                </div>

                {editProfilMode ? (
                  <div>
                    {/* Perusahaan */}
                    <div style={{ fontSize: "0.75rem", color: "#D4A017", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem", marginTop: "0.5rem" }}>Data Perusahaan</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                      {[
                        { label: "Nama Perusahaan", key: "companyName", placeholder: "PT. Contoh Indonesia" },
                        { label: "Industri", key: "industry", placeholder: "Hotel, Airlines, dll" },
                        { label: "Kota", key: "city", placeholder: "Jakarta" },
                        { label: "Website", key: "website", placeholder: "www.perusahaan.com" },
                      ].map(f => (
                        <div key={f.key}>
                          <div style={s.label}>{f.label}</div>
                          <input style={inp} value={(editProfilForm as any)[f.key]} onChange={e => upd(f.key, e.target.value)} placeholder={f.placeholder} />
                        </div>
                      ))}
                      <div style={{ gridColumn: "1 / -1" }}>
                        <div style={s.label}>Deskripsi Singkat Perusahaan</div>
                        <textarea style={{ ...inp, resize: "vertical", minHeight: 80 } as React.CSSProperties}
                          value={editProfilForm.description} onChange={e => upd("description", e.target.value)}
                          placeholder="Deskripsi singkat perusahaan Anda..." />
                      </div>
                    </div>

                    {/* PIC 1 */}
                    <div style={{ fontSize: "0.75rem", color: "#D4A017", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>PIC Utama (PIC 1)</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                      <div>
                        <div style={s.label}>Email PIC 1 <span style={{ color: "#334155", fontSize: "0.65rem" }}>(tidak bisa diubah)</span></div>
                        <div style={{ fontWeight: 600, color: "#475569", fontSize: "0.88rem", padding: "0.6rem 0" }}>{b.pic1Email}</div>
                      </div>
                      {[
                        { label: "Nama PIC 1", key: "pic1Name", placeholder: "Nama lengkap" },
                        { label: "Jabatan PIC 1", key: "pic1Title", placeholder: "HR Manager" },
                        { label: "WhatsApp PIC 1", key: "pic1Whatsapp", placeholder: "08xx-xxxx-xxxx" },
                      ].map(f => (
                        <div key={f.key}>
                          <div style={s.label}>{f.label}</div>
                          <input style={inp} value={(editProfilForm as any)[f.key]} onChange={e => upd(f.key, e.target.value)} placeholder={f.placeholder} />
                        </div>
                      ))}
                    </div>

                    {/* PIC 2 */}
                    <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>PIC Kedua (Opsional)</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                      {[
                        { label: "Nama PIC 2", key: "pic2Name", placeholder: "Nama lengkap" },
                        { label: "Jabatan PIC 2", key: "pic2Title", placeholder: "Recruitment Staff" },
                        { label: "Email PIC 2", key: "pic2Email", placeholder: "email@perusahaan.com" },
                        { label: "WhatsApp PIC 2", key: "pic2Whatsapp", placeholder: "08xx-xxxx-xxxx" },
                      ].map(f => (
                        <div key={f.key}>
                          <div style={s.label}>{f.label}</div>
                          <input style={inp} value={(editProfilForm as any)[f.key]} onChange={e => upd(f.key, e.target.value)} placeholder={f.placeholder} />
                        </div>
                      ))}
                    </div>

                    {/* Special request */}
                    <div style={{ marginBottom: "1.25rem" }}>
                      <div style={s.label}>Special Request / Catatan</div>
                      <textarea style={{ ...inp, resize: "vertical", minHeight: 80 } as React.CSSProperties}
                        value={editProfilForm.specialRequest} onChange={e => upd("specialRequest", e.target.value)}
                        placeholder="Kebutuhan khusus untuk booth, dll..." />
                    </div>

                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <button onClick={handleSave} disabled={updateProfilMutation.isPending}
                        style={{ background: "linear-gradient(135deg,#D4A017,#b8860b)", border: "none", color: "#fff", borderRadius: 8, padding: "0.65rem 1.5rem", fontSize: "0.88rem", fontWeight: 700, cursor: updateProfilMutation.isPending ? "not-allowed" : "pointer", opacity: updateProfilMutation.isPending ? 0.7 : 1 }}>
                        {updateProfilMutation.isPending ? "⏳ Menyimpan..." : "💾 Simpan Perubahan"}
                      </button>
                      <button onClick={() => setEditProfilMode(false)}
                        style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", borderRadius: 8, padding: "0.65rem 1.25rem", fontSize: "0.88rem", cursor: "pointer" }}>
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode — clean sectioned layout */
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                    {/* Perusahaan */}
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "#D4A017", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.85rem", fontWeight: 700 }}>Perusahaan</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: "1rem" }}>
                        {[
                          { label: "Nama Perusahaan", val: b.companyName    },
                          { label: "Industri",         val: b.industry  || "—" },
                          { label: "Kota",             val: b.city      || "—" },
                          { label: "Website",          val: b.website   || "—" },
                        ].map(item => (
                          <div key={item.label}>
                            <div style={s.label}>{item.label}</div>
                            <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: "0.9rem", overflowWrap: "break-word", wordBreak: "break-word" }}>{item.val}</div>
                          </div>
                        ))}
                      </div>
                      {b.description && (
                        <div style={{ marginTop: "1rem" }}>
                          <div style={s.label}>Deskripsi</div>
                          <div style={{ fontSize: "0.88rem", color: "#94a3b8", lineHeight: 1.75, overflowWrap: "break-word" }}>{b.description}</div>
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

                    {/* PIC Utama */}
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "#D4A017", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.85rem", fontWeight: 700 }}>PIC Utama</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: "1rem" }}>
                        {[
                          { label: "Nama",     val: b.pic1Name     || "—" },
                          { label: "Jabatan",  val: b.pic1Title    || "—" },
                          { label: "Email",    val: b.pic1Email    || "—" },
                          { label: "WhatsApp", val: b.pic1Whatsapp || "—" },
                        ].map(item => (
                          <div key={item.label}>
                            <div style={s.label}>{item.label}</div>
                            <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: "0.9rem", overflowWrap: "break-word", wordBreak: "break-word" }}>{item.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* PIC Kedua */}
                    {b.pic2Name && (
                      <>
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />
                        <div>
                          <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.85rem", fontWeight: 700 }}>PIC Kedua</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: "1rem" }}>
                            {[
                              { label: "Nama",     val: b.pic2Name     || "—" },
                              { label: "Jabatan",  val: b.pic2Title    || "—" },
                              { label: "Email",    val: b.pic2Email    || "—" },
                              { label: "WhatsApp", val: b.pic2Whatsapp || "—" },
                            ].map(item => (
                              <div key={item.label}>
                                <div style={s.label}>{item.label}</div>
                                <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: "0.9rem", overflowWrap: "break-word", wordBreak: "break-word" }}>{item.val}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Special Request */}
                    {b.specialRequest && (
                      <>
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />
                        <div>
                          <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem", fontWeight: 700 }}>Special Request</div>
                          <div style={{ fontSize: "0.88rem", color: "#94a3b8", lineHeight: 1.75, overflowWrap: "break-word" }}>{b.specialRequest}</div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
