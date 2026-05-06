import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import BoothMapPicker, { ALL_BOOTHS } from "@/components/BoothMapPicker";
import { generateBookingId, getPaymentDeadline, openInvoiceForPrint, openFacilityInvoice, type BookingData, type FacilityItem } from "@/lib/invoiceGenerator";
import { trpc } from "@/lib/trpc";
import { uploadToSupabase } from "@/lib/supabase";

// ── Constants ─────────────────────────────────────────────────
const INDUSTRIES = [
  "Hotel & Resort","Cruise Line","Tour & Travel","MICE & Event",
  "Food & Beverage","Spa & Wellness","Airline","Tourism Board",
  "Hospitality Education","Lainnya",
];

const POSITIONS = [
  "Front Office","Housekeeping","F&B Service","F&B Production / Kitchen",
  "Sales & Marketing","Human Resources","Accounting & Finance",
  "Engineering & Maintenance","Event Coordinator","Tour Guide",
  "Cruise Staff","Spa Therapist","Butler","Lainnya",
];

const STEPS = ["Perusahaan", "PIC", "Rekrutmen", "Booth", "Konfirmasi"];

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

// ── Styles ────────────────────────────────────────────────────
const css = {
  page:   { minHeight: "100vh", background: "#0a1628", fontFamily: "system-ui, sans-serif", color: "#f1f5f9", paddingBottom: "4rem" } as React.CSSProperties,
  nav:    { background: "rgba(10,22,40,0.97)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(20,184,166,0.15)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky" as const, top: 0, zIndex: 50 },
  wrap:   { maxWidth: 860, margin: "0 auto", padding: "2rem 1.25rem" },
  card:   { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.75rem", marginBottom: "1.5rem" },
  teal:   { background: "rgba(20,184,166,0.04)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 16, padding: "1.75rem", marginBottom: "1.5rem" },
  label:  { display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#64748b", marginBottom: "0.4rem", textTransform: "uppercase" as const, letterSpacing: "0.07em" },
  input:  { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0.75rem 1rem", fontSize: "0.95rem", color: "#f1f5f9", outline: "none", boxSizing: "border-box" as const },
  select: { width: "100%", background: "#0c1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0.75rem 1rem", fontSize: "0.95rem", color: "#f1f5f9", outline: "none" },
  row2:   { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: "1rem" } as React.CSSProperties,
  secHd:  { fontSize: "1rem", fontWeight: 700, color: "#14b8a6", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" },
  btnPri: { background: "linear-gradient(135deg, #0d9488, #14b8a6)", border: "none", color: "#fff", borderRadius: 12, padding: "0.9rem 2rem", fontSize: "1rem", fontWeight: 700, cursor: "pointer", width: "100%" } as React.CSSProperties,
  btnOut: { background: "transparent", border: "1px solid rgba(20,184,166,0.4)", color: "#14b8a6", borderRadius: 10, padding: "0.6rem 1.2rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
  btnDel: { background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", borderRadius: 8, padding: "0.35rem 0.75rem", fontSize: "0.78rem", cursor: "pointer" } as React.CSSProperties,
};

// ── Types ─────────────────────────────────────────────────────
interface PIC { name: string; title: string; email: string; whatsapp: string; }
interface PositionNeed { position: string; customPosition: string; count: number; }

// ── PIC Sub-form ──────────────────────────────────────────────
function PICForm({ pic, onChange, title, optional, onEmailBlur }: {
  pic: PIC; onChange: (p: PIC) => void;
  title: string; optional?: boolean;
  onEmailBlur?: (email: string) => void;
}) {
  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#cbd5e1", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {title}
        {optional && <span style={{ fontSize: "0.68rem", padding: "0.15rem 0.55rem", borderRadius: 20, background: "rgba(20,184,166,0.12)", color: "#14b8a6", border: "1px solid rgba(20,184,166,0.3)" }}>Opsional</span>}
      </div>
      <div style={css.row2}>
        <div>
          <label style={css.label}>Nama Lengkap {!optional && <span style={{ color: "#ef4444" }}>*</span>}</label>
          <input style={css.input} value={pic.name} onChange={e => onChange({ ...pic, name: e.target.value })} placeholder="John Doe" />
        </div>
        <div>
          <label style={css.label}>Jabatan</label>
          <input style={css.input} value={pic.title} onChange={e => onChange({ ...pic, title: e.target.value })} placeholder="HR Manager" />
        </div>
        <div>
          <label style={css.label}>Email {!optional && <span style={{ color: "#ef4444" }}>*</span>}</label>
          <input style={css.input} type="email" value={pic.email}
            onChange={e => onChange({ ...pic, email: e.target.value })}
            onBlur={e => onEmailBlur?.(e.target.value)}
            placeholder="hr@perusahaan.com" />
        </div>
        <div>
          <label style={css.label}>WhatsApp {!optional && <span style={{ color: "#ef4444" }}>*</span>}</label>
          <input style={css.input} value={pic.whatsapp} onChange={e => onChange({ ...pic, whatsapp: e.target.value })} placeholder="08xx-xxxx-xxxx" />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function EmployerRegister() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);

  // Form state
  const [company, setCompany]     = useState({ name: "", industry: "", website: "", city: "" });
  const [pic1, setPic1]           = useState<PIC>({ name: "", title: "", email: "", whatsapp: "" });
  const [pic2, setPic2]           = useState<PIC>({ name: "", title: "", email: "", whatsapp: "" });
  const [showPic2, setShowPic2]   = useState(false);
  const [positions, setPositions] = useState<PositionNeed[]>([{ position: "", customPosition: "", count: 1 }]);
  const [selectedBooths, setSelectedBooths] = useState<string[]>([]);
  const [needsDesign, setNeedsDesign]       = useState(false);
  const [specialRequest, setSpecialRequest] = useState("");
  const [facilities, setFacilities] = useState<Record<string, number>>({
    facilityChair: 0,
    facilityTable: 0,
    facilityTV42: 0,
    facilityTV55: 0,
    facilityPower2A: 0,
    facilityPower4A: 0,
    facilityCable: 0,
  });

  const [selectedPaket, setSelectedPaket] = useState<number | null>(null);

  const PAKET_BOOTH = [
    {
      no: 1,
      nama: "Paket Booth 1",
      img: "https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/assets/booths/booth_1.jpeg",
      harga: 21600000,
      spesifikasi: "Booth custom dengan backdrop custom, termasuk 3 kursi, 1 meja dealing, 1 TV, 1 meja custom, 3 modul materi perusahaan.",
    },
    {
      no: 2,
      nama: "Paket Booth 2",
      img: "https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/assets/booths/booth_3.jpeg",
      harga: 5400000,
      spesifikasi: "Partisi R8, materi perusahaan sticker di belakang, stan terbuka 2 sisi, fascia nama & logo perusahaan.",
    },
    {
      no: 3,
      nama: "Paket Booth 3",
      img: "https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/assets/booths/booth_2.jpeg",
      harga: 14500000,
      spesifikasi: "Booth dengan backdrop custom dan 2 meja custom. Cocok untuk kebutuhan presentasi.",
    },
  ];

  const FACILITY_LIST = [
    { key: "facilityChair",  label: "Kursi + cover hitam",  unit: "buah", price: 25000 },
    { key: "facilityTable",  label: "Meja + cover hitam",   unit: "buah", price: 125000 },
    { key: "facilityTV42",   label: "TV 42 Inch",           unit: "unit", price: 750000 },
    { key: "facilityTV55",   label: "TV 55 Inch",           unit: "unit", price: 1500000 },
    { key: "facilityPower2A",label: "Listrik tambahan 2A",  unit: "titik", price: 250000 },
    { key: "facilityPower4A",label: "Listrik tambahan 4A",  unit: "titik", price: 400000 },
    { key: "facilityCable",  label: "Perpanjangan Kabel",   unit: "buah", price: 250000 },
  ];

  const facilityTotal = FACILITY_LIST.reduce((sum, f) => sum + (facilities[f.key] || 0) * f.price, 0);
  // Logo diupload di dashboard
  const [jobVacanciesUrls, setJobVacanciesUrls] = useState<{ url: string; name: string }[]>([]);
  const [vacanciesUploading, setVacanciesUploading] = useState(false);

  // UI state
  const [emailErr, setEmailErr]     = useState("");
  const [checkingEmail, setChecking]= useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);

  // Fetch existing bookings to check booth availability & email dupe
  const bookingsQuery = trpc.event.getAllEmployerBookings.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  // Compute booths already taken from DB
  const bookedBoothIds = new Set<string>();
  (bookingsQuery.data || []).forEach((b: any) => {
    if (b.status !== "rejected") {
      try {
        const booths = typeof b.booths === "string" ? JSON.parse(b.booths) : (b.booths || []);
        booths.forEach((bt: any) => bookedBoothIds.add(bt.id));
      } catch {}
    }
  });

  // Merge static map with real DB status
  const liveBooths = ALL_BOOTHS.map(b => ({
    ...b,
    status: bookedBoothIds.has(b.id) && b.type !== "area"
      ? ("booked" as const)
      : b.status,
  }));

  const selectedBoothDefs = liveBooths.filter(b => selectedBooths.includes(b.id));
  const totalAmount = selectedBoothDefs.reduce((sum, b) => sum + b.price, 0);

  // Positions helpers
  const addPos = () => setPositions(p => [...p, { position: "", customPosition: "", count: 1 }]);
  const delPos = (i: number) => setPositions(p => p.filter((_, idx) => idx !== i));
  const updPos = (i: number, v: Partial<PositionNeed>) => setPositions(p => p.map((x, idx) => idx === i ? { ...x, ...v } : x));

  // Email duplicate check
  const checkEmail = async (email: string) => {
    if (!email || !email.includes("@")) return;
    setChecking(true); setEmailErr("");
    try {
      const res = await bookingsQuery.refetch();
      const dup = (res.data || []).some((b: any) =>
        b.pic1Email?.toLowerCase() === email.toLowerCase() && b.status !== "rejected"
      );
      if (dup) setEmailErr("Email ini sudah terdaftar. Silakan login dengan Booking ID yang ada.");
    } catch {}
    setChecking(false);
  };

  // Step validation
  const canNext = () => {
    if (step === 0) return !!(company.name && company.industry && company.city);
    if (step === 1) return !!(pic1.name && pic1.email && pic1.whatsapp) && !emailErr && !checkingEmail;
    if (step === 2) return true; // Posisi & job vacancies opsional
    if (step === 3) return selectedBooths.length > 0;
    return true;
  };

  // Booking mutation
  const createBookingMutation = trpc.event.createEmployerBooking.useMutation({
    onSuccess: (_data, variables) => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      // Build facility items untuk invoice
      const FACILITY_LABELS: Record<string, { label: string; unit: string; price: number }> = {
        facilityChair:   { label: "Kursi + cover hitam",  unit: "buah", price: 25000 },
        facilityTable:   { label: "Meja + cover hitam",   unit: "buah", price: 125000 },
        facilityTV42:    { label: "TV 42 Inch",           unit: "unit", price: 750000 },
        facilityTV55:    { label: "TV 55 Inch",           unit: "unit", price: 1500000 },
        facilityPower2A: { label: "Listrik tambahan 2A",  unit: "titik", price: 250000 },
        facilityPower4A: { label: "Listrik tambahan 4A",  unit: "titik", price: 400000 },
        facilityCable:   { label: "Perpanjangan Kabel",   unit: "buah", price: 250000 },
      };
      const facilityItems: FacilityItem[] = Object.entries(facilities)
        .filter(([, qty]) => qty > 0)
        .map(([key, qty]) => ({ ...FACILITY_LABELS[key], qty, days: 2, pricePerDay: FACILITY_LABELS[key].price }));
      const paketData = selectedPaket !== null ? PAKET_BOOTH[selectedPaket - 1] : null;
      const facTotal = facilityItems.reduce((s, f) => s + f.qty * f.pricePerDay * f.days, 0)
        + (paketData ? paketData.harga : 0);

      const data: BookingData = {
        bookingId: variables.bookingId,
        bookingDate: dateStr,
        companyName: company.name,
        industry: company.industry,
        city: company.city,
        website: company.website,
        pic1,
        pic2: showPic2 && pic2.name ? pic2 : undefined,
        positions,
        booths: selectedBoothDefs.map(b => ({ boothId: b.id, label: b.label, type: b.type as "main" | "standard" | "extra", price: b.price })),
        needsBoothDesign: needsDesign,
        specialRequest,
        totalAmount,
        paymentDeadline: getPaymentDeadline(),
        facilities: facilityItems,
        paketBooth: paketData ? { nama: paketData.nama, harga: paketData.harga, spesifikasi: paketData.spesifikasi } : null,
        facilityTotal: facTotal,
      };
      setBookingData(data);
      toast.success("Booking berhasil!", { description: "Invoice siap didownload." });
      setStep(5);
      setSubmitting(false);
      bookingsQuery.refetch();
    },
    onError: (err) => {
      setSubmitting(false);
      if (err.message.includes("sudah dipesan") || err.message.includes("booth")) {
        toast.error("Booth sudah dipesan!", {
          description: "Pilih booth lain. Halaman denah akan diperbarui.",
        });
        bookingsQuery.refetch();
        setStep(3);
      } else if (err.message.includes("email") || err.message.includes("Email")) {
        toast.error("Email sudah terdaftar!", {
          description: "Gunakan email lain atau login dengan Booking ID.",
        });
        setStep(1);
      } else {
        toast.error("Terjadi kesalahan", { description: err.message || "Coba lagi atau hubungi panitia." });
      }
    },
  });

  const handleConfirm = () => {
    if (submitting || !canNext()) return;
    setSubmitting(true);
    const id = generateBookingId(pic1.name, company.industry);
    createBookingMutation.mutate({
      bookingId: id,
      companyName: company.name,
      industry: company.industry || undefined,
      city: company.city || undefined,
      website: company.website || undefined,
      pic1Name: pic1.name,
      pic1Title: pic1.title || undefined,
      pic1Email: pic1.email,
      pic1Whatsapp: pic1.whatsapp,
      pic2Name: showPic2 && pic2.name ? pic2.name : undefined,
      pic2Title: showPic2 && pic2.title ? pic2.title : undefined,
      pic2Email: showPic2 && pic2.email ? pic2.email : undefined,
      pic2Whatsapp: showPic2 && pic2.whatsapp ? pic2.whatsapp : undefined,
      booths: selectedBoothDefs.map(b => ({ id: b.id, label: b.label, type: b.type, price: b.price })),
      totalAmount,
      positions,
      needsBoothDesign: needsDesign,
      specialRequest: specialRequest || undefined,
      facilities: facilityTotal > 0 ? JSON.stringify(facilities) : undefined,
      paketBooth: selectedPaket !== null ? String(selectedPaket) : undefined,

      jobVacanciesUrl: jobVacanciesUrls.length > 0 ? jobVacanciesUrls : undefined,
    });
  };

  // ── SUCCESS SCREEN ────────────────────────────────────────────
  if (step === 5 && bookingData) {
    return (
      <div style={css.page}>
        <nav style={css.nav}>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 32 }} />
          <div style={{ fontSize: "0.78rem", color: "#334155" }}>Booking Confirmed</div>
        </nav>
        <div style={{ ...css.wrap, maxWidth: 620, textAlign: "center" }}>
          <div style={{ fontSize: "4rem", margin: "2rem 0 1rem" }}>🎉</div>
          <h1 style={{ fontSize: "clamp(1.5rem,4vw,2rem)", fontWeight: 800, marginBottom: "0.5rem" }}>Booking Dikonfirmasi!</h1>
          <p style={{ color: "#64748b", lineHeight: 1.7, marginBottom: "1.75rem" }}>
            Terima kasih, <strong style={{ color: "#f1f5f9" }}>{bookingData.companyName}</strong>!<br />
            Detail booking dan invoice ada di bawah.
          </p>

          {/* Booking summary */}
          <div style={{ ...css.teal, textAlign: "left" }}>
            <div style={{ fontSize: "0.72rem", color: "#14b8a6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>Ringkasan Booking</div>

            <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "0.2rem" }}>Booking ID</div>
            <div style={{ fontWeight: 800, color: "#14b8a6", fontSize: "1.15rem", marginBottom: "1.25rem", fontFamily: "monospace" }}>{bookingData.bookingId}</div>

            {bookingData.booths.map((b, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#cbd5e1", marginBottom: "0.4rem" }}>
                <span>Booth {b.label} · {b.type === "main" ? "Main 5×5m" : "Standard 3×3m"}</span>
                <span style={{ color: "#D4A017", fontWeight: 700 }}>{fmt(b.price)}</span>
              </div>
            ))}

            <div style={{ borderTop: "1px solid rgba(20,184,166,0.2)", paddingTop: "0.75rem", marginTop: "0.75rem", display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.05rem" }}>
              <span>Total</span>
              <span style={{ color: "#D4A017" }}>{fmt(bookingData.totalAmount)}</span>
            </div>
          </div>

          {/* Login info */}
          <div style={{ ...css.card, textAlign: "left" }}>
            <div style={{ fontSize: "0.72rem", color: "#14b8a6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Login ke Portal Employer</div>
            <div style={{ background: "rgba(20,184,166,0.1)", borderRadius: 8, padding: "0.75rem 1rem" }}>
              <div style={{ fontSize: "0.88rem", color: "#fde68a", fontWeight: 700, marginBottom: "0.4rem" }}>
                🔑 Cara Login ke Dashboard Employer
              </div>
              <div style={{ fontSize: "0.85rem", color: "#f1f5f9", lineHeight: 1.8 }}>
                Gunakan <strong style={{ color: "#14b8a6" }}>Booking ID</strong>:<br/>
                <span style={{ fontFamily: "monospace", color: "#14b8a6", fontWeight: 800, fontSize: "0.95rem" }}>{bookingData.bookingId}</span><br/>
                + email <strong style={{ color: "#14b8a6" }}>{bookingData.pic1.email}</strong><br/>
                untuk login dan pantau status booth Anda.
              </div>
            </div>
          </div>

          {/* Payment deadline */}
          <div style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1.5rem", textAlign: "left" }}>
            <div style={{ fontSize: "0.85rem", color: "#fed7aa", lineHeight: 1.7 }}>
              ⏰ <strong>Batas pembayaran: {bookingData.paymentDeadline}</strong><br />
              Transfer sesuai invoice → kirim bukti ke WhatsApp panitia → booth dikonfirmasi.
            </div>
          </div>

          {/* Actions — Invoice buttons */}
          <button onClick={() => openInvoiceForPrint(bookingData)}
            style={{ ...css.btnPri, background: "linear-gradient(135deg, #D4A017, #B8860B)", marginBottom: "0.5rem", boxShadow: "0 0 20px rgba(212,160,23,0.3)" }}>
            📄 Invoice Booth
          </button>
          {(bookingData.facilities?.some(f => f.qty > 0) || bookingData.paketBooth || bookingData.needsBoothDesign) && (
            <button onClick={() => openFacilityInvoice(bookingData)}
              style={{ ...css.btnPri, background: "linear-gradient(135deg, #fbbf24, #d97706)", marginBottom: "0.5rem" }}>
              🛠️ Invoice Fasilitas & Paket Tambahan
            </button>
          )}
          {(bookingData.facilities?.some(f => f.qty > 0) || bookingData.paketBooth || bookingData.needsBoothDesign) && (
            <button onClick={() => { openInvoiceForPrint(bookingData); setTimeout(() => openFacilityInvoice(bookingData), 800); }}
              style={{ ...css.btnPri, background: "linear-gradient(135deg, #0d9488, #14b8a6)", marginBottom: "0.75rem" }}>
              📋 Download Semua Invoice Sekaligus
            </button>
          )}
          <button onClick={() => navigate("/employer/login")}
            style={{ ...css.btnPri, marginBottom: "0.75rem" }}>
            Login ke Portal Employer →
          </button>
          <button onClick={() => navigate("/")}
            style={{ ...css.btnOut, width: "100%", textAlign: "center" as const }}>
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // ── FORM ──────────────────────────────────────────────────────
  return (
    <div style={css.page}>
      <nav style={css.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#14b8a6", cursor: "pointer", fontSize: "0.88rem" }}>← Kembali</button>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 32 }} />
        </div>
        <div style={{ fontSize: "0.78rem", color: "#334155" }}>Pendaftaran Employer · GR2026</div>
      </nav>

      <div style={css.wrap}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.1rem)", fontWeight: 800, marginBottom: "0.4rem" }}>
            Daftar sebagai <span style={{ color: "#14b8a6" }}>Employer</span>
          </h1>
          <p style={{ color: "#475569", fontSize: "0.85rem" }}>
            Grand Recruitment 2026 · June 10–11 · Gedung Dome NHI Bandung
          </p>
          <p style={{ marginTop: "0.5rem", fontSize: "0.82rem", color: "#64748b" }}>
            Sudah terdaftar?{" "}
            <button onClick={() => navigate("/employer/login")} style={{ background: "none", border: "none", color: "#14b8a6", cursor: "pointer", fontWeight: 700, textDecoration: "underline", fontSize: "0.82rem" }}>
              Login →
            </button>
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "2.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: "0.82rem",
                  background: i < step ? "#0d9488" : i === step ? "#14b8a6" : "rgba(255,255,255,0.05)",
                  color: i <= step ? "#fff" : "#334155",
                  border: i === step ? "2px solid #5eead4" : "none",
                  transition: "all 0.3s",
                }}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: "0.65rem", color: i === step ? "#14b8a6" : "#334155", whiteSpace: "nowrap" }}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ height: 2, width: "clamp(14px,3vw,40px)", background: i < step ? "#0d9488" : "rgba(255,255,255,0.05)", margin: "0 0.2rem", marginBottom: "1.3rem", flexShrink: 0, transition: "background 0.3s" }} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 0: Perusahaan ── */}
        {step === 0 && (
          <div style={css.card}>
            <div style={css.secHd}>🏢 Informasi Perusahaan</div>
            <div style={{ marginBottom: "1.1rem" }}>
              <label style={css.label}>Nama Perusahaan <span style={{ color: "#ef4444" }}>*</span></label>
              <input style={css.input} value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })} placeholder="PT. Hotel Indonesia Tbk" />
            </div>
            <div style={css.row2}>
              <div>
                <label style={css.label}>Industri <span style={{ color: "#ef4444" }}>*</span></label>
                <select style={css.select} value={company.industry} onChange={e => setCompany({ ...company, industry: e.target.value })}>
                  <option value="">-- Pilih Industri --</option>
                  {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>
              <div>
                <label style={css.label}>Kota / Domisili <span style={{ color: "#ef4444" }}>*</span></label>
                <input style={css.input} value={company.city} onChange={e => setCompany({ ...company, city: e.target.value })} placeholder="Jakarta" />
              </div>
            </div>
            <div style={{ marginTop: "1.1rem" }}>
              <label style={css.label}>Website <span style={{ fontSize: "0.7rem", color: "#334155", fontWeight: 400 }}>(opsional)</span></label>
              <input style={css.input} value={company.website} onChange={e => setCompany({ ...company, website: e.target.value })} placeholder="https://www.perusahaan.com" />
            </div>
            <div style={{ marginTop: "1.1rem" }}>
              <div style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.15)", borderRadius: 8, padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#64748b" }}>
                🖼️ Upload logo perusahaan tersedia di <strong style={{ color: "#14b8a6" }}>Dashboard Employer</strong> setelah booking selesai.
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 1: PIC ── */}
        {step === 1 && (
          <div style={css.card}>
            <div style={css.secHd}>👤 Person in Charge (PIC)</div>
            <PICForm
              pic={pic1}
              onChange={p => { setPic1(p); if (emailErr) setEmailErr(""); }}
              title="PIC Utama"
              onEmailBlur={checkEmail}
            />
            {checkingEmail && <p style={{ fontSize: "0.75rem", color: "#14b8a6", marginTop: "0.25rem" }}>⏳ Memeriksa email...</p>}
            {emailErr && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "1rem 1.25rem", margin: "0.75rem 0" }}>
                <div style={{ fontWeight: 700, color: "#f87171", marginBottom: "0.3rem", fontSize: "0.88rem" }}>⚠️ Email sudah terdaftar</div>
                <div style={{ fontSize: "0.8rem", color: "#fca5a5", lineHeight: 1.6 }}>Gunakan email lain, atau{" "}
                  <button onClick={() => navigate("/employer/login")} style={{ background: "none", border: "none", color: "#D4A017", cursor: "pointer", fontWeight: 700, textDecoration: "underline", fontSize: "0.8rem" }}>login dengan Booking ID →</button>
                </div>
              </div>
            )}

            {showPic2 ? (
              <>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "1.5rem 0" }} />
                <PICForm pic={pic2} onChange={setPic2} title="PIC Kedua" optional />
                <button style={css.btnDel} onClick={() => { setShowPic2(false); setPic2({ name: "", title: "", email: "", whatsapp: "" }); }}>
                  Hapus PIC Kedua
                </button>
              </>
            ) : (
              <button style={{ ...css.btnOut, marginTop: "0.75rem" }} onClick={() => setShowPic2(true)}>
                + Tambah PIC Kedua (Opsional)
              </button>
            )}
          </div>
        )}

        {/* ── STEP 2: Rekrutmen ── */}
        {step === 2 && (
          <div style={css.card}>
            <div style={css.secHd}>🎯 Kebutuhan Rekrutmen</div>
            <p style={{ color: "#64748b", fontSize: "0.83rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              Posisi apa yang ingin direkrut? Pilih dari daftar atau isi bebas. Bisa lebih dari satu posisi.
            </p>
            {positions.map((pos, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "1.25rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 600 }}>Posisi {i + 1}</span>
                  {positions.length > 1 && <button style={css.btnDel} onClick={() => delPos(i)}>Hapus</button>}
                </div>
                <div style={css.row2}>
                  <div>
                    <label style={css.label}>Dari daftar</label>
                    <select style={css.select} value={pos.position} onChange={e => updPos(i, { position: e.target.value, customPosition: "" })}>
                      <option value="">-- Pilih posisi --</option>
                      {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={css.label}>Atau tulis bebas</label>
                    <input style={css.input} value={pos.customPosition} onChange={e => updPos(i, { customPosition: e.target.value, position: "" })} placeholder="Contoh: Digital Marketing" />
                  </div>
                </div>
                <div style={{ marginTop: "1rem", maxWidth: 180 }}>
                  <label style={css.label}>Jumlah Kandidat</label>
                  <input style={css.input} type="number" min={1} value={pos.count} onChange={e => updPos(i, { count: parseInt(e.target.value) || 1 })} />
                </div>
              </div>
            ))}
            <button style={css.btnOut} onClick={addPos}>+ Tambah Posisi Lain</button>

            {/* Job Vacancies Upload */}
            <div style={{ marginTop: "1.75rem", padding: "1.25rem", background: "rgba(212,160,23,0.04)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 12 }}>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#D4A017", marginBottom: "0.75rem" }}>📄 Upload Job Vacancies <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 400 }}>(opsional – PDF, Word, Excel, JPG)</span></div>
              {jobVacanciesUrls.length > 0 && (
                <div style={{ marginBottom: "0.75rem" }}>
                  {jobVacanciesUrls.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "0.4rem 0.75rem", marginBottom: "0.4rem", fontSize: "0.8rem" }}>
                      <a href={f.url} target="_blank" rel="noreferrer" style={{ color: "#D4A017", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>{f.name}</a>
                      <button onClick={() => setJobVacanciesUrls(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "0.85rem", flexShrink: 0 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <label style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(212,160,23,0.08)", border: "1px dashed rgba(212,160,23,0.4)", borderRadius: 8, padding: "0.6rem 1rem", cursor: vacanciesUploading ? "not-allowed" : "pointer", fontSize: "0.82rem", color: "#D4A017" }}>
                {vacanciesUploading ? "⏳ Uploading..." : "📤 Upload File"}
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.doc,.docx,.xlsx" style={{ display: "none" }} disabled={vacanciesUploading}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) return;
                    setVacanciesUploading(true);
                    try {
                      const results: { url: string; name: string }[] = [];
                      for (const file of files) {
                        const url = await uploadToSupabase(file, "employer", `vacancies/${Date.now()}-${file.name}`);
                        results.push({ url, name: file.name });
                      }
                      setJobVacanciesUrls(prev => [...prev, ...results]);
                      toast.success(`${results.length} file berhasil diupload!`);
                    } catch (err: any) { toast.error("Upload gagal: " + err.message); }
                    setVacanciesUploading(false);
                    e.target.value = "";
                  }} />
              </label>
            </div>
          </div>
        )}

        {/* ── STEP 3: Booth ── */}
        {step === 3 && (
          <div>
            {/* Availability summary */}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
              {[
                { color: "#14b8a6", label: "Tersedia", count: liveBooths.filter(b => b.status === "available" && b.type !== "area").length },
                { color: "#f97316", label: "Reserved", count: liveBooths.filter(b => b.status === "reserved").length },
                { color: "#ef4444", label: "Booked",   count: liveBooths.filter(b => b.status === "booked"   && b.type !== "area").length },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "0.5rem 1rem" }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{s.label}</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f1f5f9" }}>{s.count}</span>
                </div>
              ))}
              {bookingsQuery.isLoading && <span style={{ fontSize: "0.75rem", color: "#14b8a6", alignSelf: "center" }}>⏳ Memuat status booth...</span>}
            </div>

            <div style={css.teal}>
              <div style={css.secHd}>🗺️ Pilih Booth dari Denah</div>
              <p style={{ color: "#64748b", fontSize: "0.83rem", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                Klik booth <strong style={{ color: "#14b8a6" }}>hijau (tersedia)</strong> untuk memilih. Klik lagi untuk membatalkan. Bisa pilih lebih dari satu.
              </p>
              <BoothMapPicker
                selectedIds={selectedBooths}
                onChange={setSelectedBooths}
                booths={liveBooths}
              />
            </div>

            {/* Selected booths summary */}
            {selectedBooths.length > 0 && (
              <div style={css.card}>
                <div style={{ fontSize: "0.75rem", color: "#14b8a6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
                  Booth Dipilih ({selectedBooths.length})
                </div>
                {selectedBoothDefs.map((b, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: i < selectedBoothDefs.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <div>
                      <span style={{ fontWeight: 700, color: "#f1f5f9" }}>Booth {b.label}</span>
                      <span style={{ fontSize: "0.78rem", color: "#64748b", marginLeft: "0.5rem" }}>{b.type === "main" ? "Main 5×5m" : b.type === "extra" ? "Extra Booth" : "Standard 3×3m"}</span>
                    </div>
                    <span style={{ color: "#D4A017", fontWeight: 700 }}>{fmt(b.price)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.05rem", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(20,184,166,0.2)" }}>
                  <span>Total</span>
                  <span style={{ color: "#D4A017" }}>{fmt(totalAmount)}</span>
                </div>
              </div>
            )}

            {/* ── SATU KOTAK: Special Request + Paket + Fasilitas ── */}
            <div style={css.card}>
              <div style={css.secHd}>✨ Special Request & Fasilitas Booth</div>

              {/* 1. Desain booth */}
              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer", marginBottom: "1.5rem" }}>
                <input type="checkbox" checked={needsDesign} onChange={e => setNeedsDesign(e.target.checked)}
                  style={{ width: 18, height: 18, marginTop: 2, accentColor: "#D4A017", flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, color: "#f1f5f9", marginBottom: "0.2rem", fontSize: "0.9rem" }}>
                    📐 Butuh layanan desain & dekorasi booth
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.5 }}>
                    Kami akan menghubungkan Anda dengan vendor rekanan. Biaya ditagih terpisah oleh vendor.
                  </div>
                </div>
              </label>

              {/* Divider */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginBottom: "1.5rem" }}/>

              {/* 2. Paket Booth Khusus */}
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#D4A017", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.5rem" }}>🎨 Paket Booth Khusus <span style={{ color: "#334155", fontWeight: 400 }}>(opsional)</span></div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "1rem", lineHeight: 1.6 }}>
                Pilih paket booth jika ingin tampilan lebih menarik. Harga belum termasuk sewa booth utama — ditagih terpisah oleh vendor.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px,1fr))", gap: "0.85rem", marginBottom: "1rem" }}>
                {PAKET_BOOTH.map(p => (
                  <div key={p.no} onClick={() => setSelectedPaket(selectedPaket === p.no ? null : p.no)}
                    style={{ borderRadius: 12, border: `2px solid ${selectedPaket === p.no ? "#D4A017" : "rgba(255,255,255,0.08)"}`, background: selectedPaket === p.no ? "rgba(212,160,23,0.07)" : "rgba(255,255,255,0.02)", cursor: "pointer", overflow: "hidden", transition: "all 0.2s" }}>
                    <img src={p.img} alt={p.nama} style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}/>
                    <div style={{ padding: "0.75rem" }}>
                      <div style={{ fontWeight: 800, fontSize: "0.88rem", color: selectedPaket === p.no ? "#D4A017" : "#f1f5f9", marginBottom: "0.25rem" }}>{p.nama}</div>
                      <div style={{ fontSize: "0.68rem", color: "#64748b", lineHeight: 1.5, marginBottom: "0.4rem" }}>{p.spesifikasi}</div>
                      <div style={{ fontWeight: 700, color: "#D4A017", fontSize: "0.85rem", marginBottom: "0.4rem" }}>{fmt(p.harga)}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: selectedPaket === p.no ? "#D4A017" : "#475569", fontWeight: 600 }}>
                        <div style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${selectedPaket === p.no ? "#D4A017" : "#475569"}`, background: selectedPaket === p.no ? "#D4A017" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {selectedPaket === p.no && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#0a1628" }}/>}
                        </div>
                        {selectedPaket === p.no ? "✓ Dipilih" : "Pilih paket ini"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {selectedPaket !== null && (
                <div style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.25)", borderRadius: 10, padding: "0.65rem 1rem", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "1rem" }}>
                  ✅ <strong style={{ color: "#D4A017" }}>{PAKET_BOOTH[selectedPaket-1].nama}</strong> dipilih — panitia akan menghubungi untuk konfirmasi vendor.
                </div>
              )}

              {/* Divider */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginBottom: "1.5rem" }}/>

              {/* 3. Fasilitas Tambahan */}
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.5rem" }}>🛠️ Fasilitas Tambahan <span style={{ color: "#334155", fontWeight: 400 }}>(ditagih terpisah vendor)</span></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: "0.6rem", marginBottom: "0.85rem" }}>
                {FACILITY_LIST.map(f => (
                  <div key={f.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "0.65rem 0.85rem", border: `1px solid ${facilities[f.key] > 0 ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.06)"}` }}>
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: facilities[f.key] > 0 ? "#fbbf24" : "#f1f5f9" }}>{f.label}</div>
                      <div style={{ fontSize: "0.68rem", color: "#475569" }}>
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(f.price)}/{f.unit}/hari
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <button onClick={() => setFacilities(p => ({ ...p, [f.key]: Math.max(0, (p[f.key]||0) - 1) }))}
                        style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                      <span style={{ width: 22, textAlign: "center", fontWeight: 700, fontSize: "0.9rem", color: facilities[f.key] > 0 ? "#fbbf24" : "#64748b" }}>{facilities[f.key] || 0}</span>
                      <button onClick={() => setFacilities(p => ({ ...p, [f.key]: (p[f.key]||0) + 1 }))}
                        style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              {facilityTotal > 0 && (
                <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 10, padding: "0.65rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.82rem", color: "#94a3b8" }}>Estimasi biaya fasilitas tambahan (ditagih vendor):</span>
                  <span style={{ fontWeight: 800, color: "#fbbf24" }}>~{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(facilityTotal)}/hari</span>
                </div>
              )}

              {/* Divider */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginBottom: "1.5rem" }}/>

              {/* 4. Open text box */}
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.5rem" }}>📝 Ada permintaan lain?</div>
              <textarea
                style={{ ...css.input, minHeight: 80, resize: "vertical" as const }}
                value={specialRequest}
                onChange={e => setSpecialRequest(e.target.value)}
                placeholder="Tulis di sini jika ada kebutuhan yang tidak ada dalam daftar di atas. Contoh: posisi dekat entrance, kebutuhan internet, dll."
              />
            </div>
          </div>
        )}

        {/* ── STEP 4: Konfirmasi ── */}
        {step === 4 && (
          <div>
            <div style={css.teal}>
              <div style={css.secHd}>📋 Review Booking</div>

              {/* Company */}
              <div style={{ marginBottom: "1.25rem", paddingBottom: "1.25rem", borderBottom: "1px solid rgba(20,184,166,0.12)" }}>
                <div style={{ fontSize: "0.7rem", color: "#14b8a6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Perusahaan</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9" }}>{company.name}</div>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{company.industry} · {company.city}{company.website ? ` · ${company.website}` : ""}</div>
              </div>

              {/* PIC */}
              <div style={{ marginBottom: "1.25rem", paddingBottom: "1.25rem", borderBottom: "1px solid rgba(20,184,166,0.12)" }}>
                <div style={{ fontSize: "0.7rem", color: "#14b8a6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Person in Charge</div>
                <div style={{ fontSize: "0.9rem", color: "#cbd5e1" }}>{pic1.name}{pic1.title ? ` · ${pic1.title}` : ""}</div>
                <div style={{ fontSize: "0.82rem", color: "#64748b" }}>{pic1.email} · {pic1.whatsapp}</div>
                {showPic2 && pic2.name && <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.25rem" }}>PIC 2: {pic2.name} · {pic2.email}</div>}
              </div>

              {/* Positions */}
              <div style={{ marginBottom: "1.25rem", paddingBottom: "1.25rem", borderBottom: "1px solid rgba(20,184,166,0.12)" }}>
                <div style={{ fontSize: "0.7rem", color: "#14b8a6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Kebutuhan Rekrutmen</div>
                {positions.filter(p => p.position || p.customPosition).map((p, i) => (
                  <div key={i} style={{ fontSize: "0.88rem", color: "#cbd5e1", marginBottom: "0.25rem" }}>
                    • {p.position || p.customPosition} — {p.count} kandidat
                  </div>
                ))}
              </div>

              {/* Job Vacancies */}
              {jobVacanciesUrls.length > 0 && (
                <div style={{ marginBottom: "1.25rem", paddingBottom: "1.25rem", borderBottom: "1px solid rgba(20,184,166,0.12)" }}>
                  <div style={{ fontSize: "0.7rem", color: "#14b8a6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>File Job Vacancies</div>
                  {jobVacanciesUrls.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                      <span>📄</span>
                      <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>{f.name}</a>
                    </div>
                  ))}
                </div>
              )}

              {/* Booths */}
              <div>
                <div style={{ fontSize: "0.7rem", color: "#14b8a6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Booth yang Dipesan</div>
                {selectedBoothDefs.map((b, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#cbd5e1", marginBottom: "0.35rem" }}>
                    <span>Booth {b.label} · {b.type === "main" ? "Main 5×5m" : "Standard 3×3m"}</span>
                    <span style={{ color: "#D4A017", fontWeight: 700 }}>{fmt(b.price)}</span>
                  </div>
                ))}
                {needsDesign && <div style={{ fontSize: "0.82rem", color: "#D4A017", marginTop: "0.5rem" }}>📐 + Desain booth (ditagih terpisah oleh vendor)</div>}
                {specialRequest && <div style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "0.5rem" }}>📝 {specialRequest}</div>}
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(20,184,166,0.2)", paddingTop: "0.75rem", marginTop: "0.75rem", fontWeight: 800, fontSize: "1.1rem" }}>
                  <span>Subtotal Booth</span>
                  <span style={{ color: "#D4A017" }}>{fmt(totalAmount)}</span>
                </div>

                {/* Fasilitas & Paket tambahan */}
                {(selectedPaket !== null || Object.values(facilities).some(v => v > 0) || needsDesign) && (
                  <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(212,160,23,0.2)" }}>
                    <div style={{ fontSize: "0.7rem", color: "#fbbf24", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Fasilitas & Paket Tambahan (ditagih terpisah)</div>
                    {needsDesign && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                        <span>📐 Desain & Dekorasi Booth</span>
                        <span style={{ color: "#fbbf24", fontSize: "0.78rem", fontStyle: "italic" }}>Harga dikonfirmasi vendor</span>
                      </div>
                    )}
                    {selectedPaket !== null && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                        <span>🎨 {PAKET_BOOTH[selectedPaket-1].nama}</span>
                        <span style={{ color: "#fbbf24", fontWeight: 700 }}>{fmt(PAKET_BOOTH[selectedPaket-1].harga)}</span>
                      </div>
                    )}
                    {Object.entries(facilities).filter(([,v]) => v > 0).map(([key, qty]) => {
                      const labels: Record<string,{label:string;price:number}> = {
                        facilityChair:{label:"Kursi",price:25000}, facilityTable:{label:"Meja",price:125000},
                        facilityTV42:{label:"TV 42 Inch",price:750000}, facilityTV55:{label:"TV 55 Inch",price:1500000},
                        facilityPower2A:{label:"Listrik 2A",price:250000}, facilityPower4A:{label:"Listrik 4A",price:400000},
                        facilityCable:{label:"Kabel",price:250000},
                      };
                      return (
                        <div key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.25rem" }}>
                          <span>🛠️ {labels[key].label} × {qty} × 2 hari</span>
                          <span style={{ color: "#fbbf24", fontWeight: 700 }}>{fmt(qty * labels[key].price * 2)}</span>
                        </div>
                      );
                    })}
                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(251,191,36,0.2)", paddingTop: "0.5rem", marginTop: "0.5rem", fontWeight: 800, fontSize: "0.95rem" }}>
                      <span style={{ color: "#fbbf24" }}>Subtotal Fasilitas</span>
                      <span style={{ color: "#fbbf24" }}>{fmt(
                        (selectedPaket !== null ? PAKET_BOOTH[selectedPaket-1].harga : 0) +
                        Object.entries(facilities).filter(([,v])=>v>0).reduce((s,[k,v])=>{
                          const p:{[key:string]:number}={facilityChair:25000,facilityTable:125000,facilityTV42:750000,facilityTV55:1500000,facilityPower2A:250000,facilityPower4A:400000,facilityCable:250000};
                          return s + v * (p[k]||0) * 2;
                        },0)
                      )}</span>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(212,160,23,0.1)", borderRadius: 8, padding: "0.75rem 0.85rem", marginTop: "0.75rem", fontWeight: 800, fontSize: "1.15rem" }}>
                  <span>Grand Total</span>
                  <span style={{ color: "#D4A017" }}>{fmt(totalAmount + (selectedPaket !== null ? PAKET_BOOTH[selectedPaket-1].harga : 0) + Object.entries(facilities).filter(([,v])=>v>0).reduce((s,[k,v])=>{const p:{[key:string]:number}={facilityChair:25000,facilityTable:125000,facilityTV42:750000,facilityTV55:1500000,facilityPower2A:250000,facilityPower4A:400000,facilityCable:250000};return s+v*(p[k]||0)*2;},0))}</span>
                </div>
              </div>
            </div>

            {/* Payment info */}
            <div style={css.card}>
              <div style={css.secHd}>🏦 Informasi Pembayaran</div>
              <div style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.15)", borderRadius: 10, padding: "1.25rem", marginBottom: "1rem" }}>
                {[
                  { label: "Bank",        val: "Bank BTN" },
                  { label: "No. Rekening",val: "0095 01 30 00000 38" },
                  { label: "Atas Nama",   val: "Koperasi STP Bandung" },
                  { label: "Nominal",     val: fmt(totalAmount) },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", gap: "1rem", marginBottom: "0.55rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.8rem", color: "#64748b", minWidth: 130 }}>{row.label}</span>
                    <span style={{ fontWeight: 700, color: row.label === "Nominal" ? "#D4A017" : "#f1f5f9", fontSize: "0.92rem" }}>{row.val}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 10, padding: "1rem", fontSize: "0.82rem", color: "#fed7aa", lineHeight: 1.7 }}>
                ⏰ Setelah booking dikonfirmasi, Anda menerima <strong>invoice PDF</strong> yang bisa langsung didownload.<br />
                Lakukan pembayaran paling lambat <strong>{getPaymentDeadline()}</strong> dan kirim bukti ke WhatsApp panitia.
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          {step > 0 && (
            <button style={{ ...css.btnOut, flex: 1 }} onClick={() => setStep(s => s - 1)}>← Kembali</button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              style={{ ...css.btnPri, flex: 2, opacity: canNext() ? 1 : 0.4, cursor: canNext() ? "pointer" : "not-allowed" }}
              onClick={() => canNext() && setStep(s => s + 1)}>
              Lanjut →
            </button>
          ) : (
            <button
              style={{ ...css.btnPri, flex: 2, background: "linear-gradient(135deg, #D4A017, #B8860B)", opacity: (canNext() && !submitting) ? 1 : 0.4, cursor: (canNext() && !submitting) ? "pointer" : "not-allowed" }}
              onClick={handleConfirm}>
              {submitting ? "⏳ Memproses..." : "Konfirmasi Booking 🎉"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
