import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import BoothMapPicker, { ALL_BOOTHS } from "@/components/BoothMapPicker";
import { generateBookingId, getPaymentDeadline, openInvoiceForPrint, type BookingData } from "@/lib/invoiceGenerator";
import { trpc } from "@/lib/trpc";

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
    if (step === 2) return positions.some(p => p.position || p.customPosition);
    if (step === 3) return selectedBooths.length > 0;
    return true;
  };

  // Booking mutation
  const createBookingMutation = trpc.event.createEmployerBooking.useMutation({
    onSuccess: (_data, variables) => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
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
        booths: selectedBoothDefs.map(b => ({ boothId: b.id, label: b.label, type: b.type as "main" | "standard", price: b.price })),
        needsBoothDesign: needsDesign,
        specialRequest,
        totalAmount,
        paymentDeadline: getPaymentDeadline(),
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
            <div style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.7 }}>
              Gunakan <strong style={{ color: "#f1f5f9" }}>Booking ID</strong> + <strong style={{ color: "#f1f5f9" }}>{bookingData.pic1.email}</strong> untuk login dan pantau status booth Anda.
            </div>
          </div>

          {/* Payment deadline */}
          <div style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1.5rem", textAlign: "left" }}>
            <div style={{ fontSize: "0.85rem", color: "#fed7aa", lineHeight: 1.7 }}>
              ⏰ <strong>Batas pembayaran: {bookingData.paymentDeadline}</strong><br />
              Transfer sesuai invoice → kirim bukti ke WhatsApp panitia → booth dikonfirmasi.
            </div>
          </div>

          {/* Actions */}
          <button onClick={() => openInvoiceForPrint(bookingData)}
            style={{ ...css.btnPri, background: "linear-gradient(135deg, #D4A017, #B8860B)", marginBottom: "0.75rem", boxShadow: "0 0 20px rgba(212,160,23,0.3)" }}>
            📄 Download Invoice PDF
          </button>
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
            Grand Recruitment 2026 · June 8–9 · Gedung Dome NHI Bandung
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
                      <span style={{ fontSize: "0.78rem", color: "#64748b", marginLeft: "0.5rem" }}>{b.type === "main" ? "Main 5×5m" : "Standard 3×3m"}</span>
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

            {/* Special request */}
            <div style={css.card}>
              <div style={css.secHd}>✨ Permintaan Khusus</div>

              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer", marginBottom: "1.25rem" }}>
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

              <div>
                <label style={css.label}>Catatan / Permintaan Lain <span style={{ fontSize: "0.7rem", color: "#334155", fontWeight: 400 }}>(opsional)</span></label>
                <textarea
                  style={{ ...css.input, minHeight: 80, resize: "vertical" as const }}
                  value={specialRequest}
                  onChange={e => setSpecialRequest(e.target.value)}
                  placeholder="Contoh: posisi dekat entrance, butuh stop kontak tambahan, dll."
                />
              </div>
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
                  <span>Total</span>
                  <span style={{ color: "#D4A017" }}>{fmt(totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Payment info */}
            <div style={css.card}>
              <div style={css.secHd}>🏦 Informasi Pembayaran</div>
              <div style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.15)", borderRadius: 10, padding: "1.25rem", marginBottom: "1rem" }}>
                {[
                  { label: "Bank",        val: "Bank BNI" },
                  { label: "No. Rekening",val: "0123-456-789" },
                  { label: "Atas Nama",   val: "Koperasi Poltekpar NHI Bandung" },
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
