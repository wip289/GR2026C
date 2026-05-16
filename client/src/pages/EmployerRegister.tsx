import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import BoothMapPicker, { ALL_BOOTHS } from "@/components/BoothMapPicker";
import { generateBookingId, getPaymentDeadline, openCombinedInvoice, type BookingData, type FacilityItem } from "@/lib/invoiceGenerator";
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

const STEPS = ["Perusahaan & PIC", "Rekrutmen", "Booth & Fasilitas", "Konfirmasi"];

// ── Exhibitor Order Catalog (33 item) ──────────────────────────
const GD = (id: string) => `https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/facilities/${id}.jpg`;
const EXHIBITOR_CATALOG = [
  // FURNITURE
  { key: "eo_kursi",       cat: "Furniture",             label: "Kursi + cover hitam",                                    harga: 25000,   unit: "buah", per: "hari", boothSize: null, img: GD("1") },
  { key: "eo_meja",        cat: "Furniture",             label: "Meja + cover hitam",                                     harga: 125000,  unit: "buah", per: "hari", boothSize: null, img: GD("2") },
  { key: "eo_barstool_h",  cat: "Furniture",             label: "Hidrolik barstool hitam",                                harga: 150000,  unit: "buah", per: "hari", boothSize: null, img: GD("3") },
  { key: "eo_barstool_m",  cat: "Furniture",             label: "Melinda barstool putih",                                 harga: 150000,  unit: "buah", per: "hari", boothSize: null, img: GD("4") },
  { key: "eo_bartable",    cat: "Furniture",             label: "Bartable lingkaran Ø75×100cm putih",                     harga: 100000,  unit: "buah", per: "hari", boothSize: null, img: GD("5") },
  { key: "eo_meja_kaca",   cat: "Furniture",             label: "Meja kaca Ø80×75cm",                                    harga: 150000,  unit: "buah", per: "hari", boothSize: null, img: GD("6") },
  { key: "eo_sofa",        cat: "Furniture",             label: "Kursi sofa single hitam",                                harga: 300000,  unit: "buah", per: "hari", boothSize: null, img: GD("7") },
  // ELEKTRONIK & LISTRIK
  { key: "eo_tv42",        cat: "Elektronik & Listrik",  label: "TV 42 Inch + standing + rangka",                        harga: 750000,  unit: "unit", per: "hari", boothSize: null, img: GD("8") },
  { key: "eo_tv55",        cat: "Elektronik & Listrik",  label: "TV 55 Inch + standing + rangka",                        harga: 1500000, unit: "unit", per: "hari", boothSize: null, img: GD("9") },
  { key: "eo_listrik2a",   cat: "Elektronik & Listrik",  label: "Listrik tambahan 2 Ampere",                             harga: 250000,  unit: "titik", per: "hari", boothSize: null, img: GD("10") },
  { key: "eo_listrik4a",   cat: "Elektronik & Listrik",  label: "Listrik tambahan 4 Ampere",                             harga: 400000,  unit: "titik", per: "hari", boothSize: null, img: GD("11") },
  { key: "eo_kabel",       cat: "Elektronik & Listrik",  label: "Perpanjangan Kabel + Socket 3 lubang",                  harga: 250000,  unit: "buah", per: "hari", boothSize: null, img: GD("12") },
  // DISPLAY & BANNER
  { key: "eo_zigzag",      cat: "Display & Banner",      label: "Zigzag standing brochure rack",                         harga: 450000,  unit: "buah", per: "hari", boothSize: null, img: GD("13") },
  { key: "eo_acrylic",     cat: "Display & Banner",      label: "Acrylic display brosur A5 3 susun",                     harga: 150000,  unit: "buah", per: "event", boothSize: null, img: GD("14") },
  { key: "eo_tripod",      cat: "Display & Banner",      label: "Tripod banner (base polyfoam + printing A3 by client)", harga: 175000,  unit: "buah", per: "hari", boothSize: null, img: GD("15") },
  { key: "eo_xbanner",     cat: "Display & Banner",      label: "X Banner 60×160cm + rangka X (design by client)",       harga: 175000,  unit: "buah", per: "event", boothSize: null, img: GD("16") },
  { key: "eo_rollbanner",  cat: "Display & Banner",      label: "Roll Banner 80×200cm + rangka roll (design by client)", harga: 425000,  unit: "buah", per: "event", boothSize: null, img: GD("17") },
  { key: "eo_displaybox",  cat: "Display & Banner",      label: "Display Box Medium 50×50×70cm (bahan partisi)",          harga: 757000,  unit: "buah", per: "hari", boothSize: null, img: GD("18") },
  // FLOORING (booth size specific)
  { key: "eo_floor33",     cat: "Flooring & Backdrop",   label: "Flooring panel 3×3, tinggi 10cm + karpet + pasang bongkar", harga: 1575000, unit: "paket", per: "event", boothSize: "standard", img: GD("19") },
  { key: "eo_floor55",     cat: "Flooring & Backdrop",   label: "Flooring panel 5×5, tinggi 10cm + karpet + pasang bongkar", harga: 4375000, unit: "paket", per: "event", boothSize: "main",     img: GD("20") },
  { key: "eo_floor42",     cat: "Flooring & Backdrop",   label: "Flooring panel 4×2, tinggi 10cm + karpet + pasang bongkar", harga: 1400000, unit: "paket", per: "event", boothSize: "extra",    img: GD("21") },
  { key: "eo_backdrop33",  cat: "Flooring & Backdrop",   label: "Backdrop panel 3×2, tinggi 2.5m + printing (design by client)", harga: 2250000, unit: "paket", per: "event", boothSize: "standard", img: GD("22") },
  { key: "eo_backdrop52",  cat: "Flooring & Backdrop",   label: "Backdrop panel 5×2, tinggi 2.5m + printing (design by client)", harga: 5000000, unit: "paket", per: "event", boothSize: "main",     img: GD("23") },
  { key: "eo_backdrop42",  cat: "Flooring & Backdrop",   label: "Backdrop panel 4×2, tinggi 2.5m + printing (design by client)", harga: 4687500, unit: "paket", per: "event", boothSize: "extra",    img: GD("24") },
  { key: "eo_wall33",      cat: "Flooring & Backdrop",   label: "Wall sticker 3×2.5m + print + pasang (Booth 3×3, design by client)", harga: 2812500, unit: "sisi", per: "event", boothSize: "standard", img: GD("25") },
  { key: "eo_wall55",      cat: "Flooring & Backdrop",   label: "Wall sticker 5×2.5m + print + pasang (Booth 5×5, design by client)", harga: 2187500, unit: "sisi", per: "event", boothSize: "main",     img: GD("26") },
  { key: "eo_wall42",      cat: "Flooring & Backdrop",   label: "Wall sticker 4×2.5m + print + pasang (Booth 4×2, design by client)", harga: 1750000, unit: "sisi", per: "event", boothSize: "extra",    img: GD("27") },
  // DEKORASI & AKSESORI
  { key: "eo_bunga_meja",  cat: "Dekorasi & Aksesori",   label: "Rangkaian bunga meja",                                  harga: 350000,  unit: "buah", per: "event", boothSize: null, img: GD("28") },
  { key: "eo_anggrek",     cat: "Dekorasi & Aksesori",   label: "Bunga meja Anggrek 1 tangkai",                          harga: 250000,  unit: "buah", per: "event", boothSize: null, img: GD("29") },
  { key: "eo_bunga_tinggi",cat: "Dekorasi & Aksesori",   label: "Rangkaian bunga tinggi 80cm",                           harga: 500000,  unit: "buah", per: "event", boothSize: null, img: GD("30") },
  { key: "eo_rope",        cat: "Dekorasi & Aksesori",   label: "Rope Barrier – QLIne tinggi 90cm (per tiang)",          harga: 100000,  unit: "tiang", per: "hari", boothSize: null, img: GD("31") },
  { key: "eo_sampah",      cat: "Dekorasi & Aksesori",   label: "Tempat sampah Ø28×28cm",                               harga: 75000,   unit: "buah", per: "event", boothSize: null, img: GD("32") },
  { key: "eo_kain",        cat: "Dekorasi & Aksesori",   label: "Kain hitam polos per meter",                            harga: 125000,  unit: "meter", per: "event", boothSize: null, img: GD("33") },
];
const EO_CATS = ["Furniture", "Elektronik & Listrik", "Display & Banner", "Flooring & Backdrop", "Dekorasi & Aksesori"];
const EO_CAT_ICONS: Record<string, string> = {
  "Furniture": "🪑",
  "Elektronik & Listrik": "📺",
  "Display & Banner": "🪧",
  "Flooring & Backdrop": "🖼️",
  "Dekorasi & Aksesori": "🌸",
};


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
  const [fasciaName, setFasciaName]         = useState("");
  const [companyAddress, setCompanyAddress] = useState("");

  const [facilities, setFacilities] = useState<Record<string, number>>({
    facilityChair: 0,
    facilityTable: 0,
    facilityTV42: 0,
    facilityTV55: 0,
    facilityPower2A: 0,
    facilityPower4A: 0,
    facilityCable: 0,
  });

  const [facilityDays, setFacilityDays] = useState<Record<string, number>>({
    facilityChair: 2, facilityTable: 2, facilityTV42: 2, facilityTV55: 2,
    facilityPower2A: 2, facilityPower4A: 2, facilityCable: 2,
  });

  const [selectedPaket, setSelectedPaket] = useState<number | null>(null);
  const [exhibitorOrder, setExhibitorOrder] = useState<Record<string, number>>({});
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const DRAFT_KEY = "gr2026_employer_draft";

  // ── Restore draft dari localStorage saat pertama load ──────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.company)        setCompany(d.company);
      if (d.pic1)           setPic1(d.pic1);
      if (d.pic2)           setPic2(d.pic2);
      if (d.showPic2)       setShowPic2(d.showPic2);
      if (d.positions)      setPositions(d.positions);
      if (d.selectedBooths) setSelectedBooths(d.selectedBooths);
      if (d.needsDesign !== undefined) setNeedsDesign(d.needsDesign);
      if (d.specialRequest) setSpecialRequest(d.specialRequest);
      if (d.fasciaName)     setFasciaName(d.fasciaName);
      if (d.exhibitorOrder) setExhibitorOrder(d.exhibitorOrder);
      if (d.companyAddress) setCompanyAddress(d.companyAddress);
      if (d.facilities)     setFacilities(d.facilities);
      if (d.facilityDays)   setFacilityDays(d.facilityDays);
      if (d.selectedPaket !== undefined) setSelectedPaket(d.selectedPaket);
      if (d.step !== undefined) setStep(d.step);
      toast.info("Draft ditemukan", { description: "Isian sebelumnya berhasil dipulihkan." });
    } catch { /* abaikan error parse */ }
  }, []);

  // ── Autosave ke localStorage setiap ada perubahan ──────────────
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        company, pic1, pic2, showPic2, positions,
        selectedBooths, needsDesign, specialRequest,
        fasciaName,
        exhibitorOrder, companyAddress, facilities, facilityDays,
        selectedPaket, step,
      }));
    } catch { /* abaikan error storage penuh */ }
  }, [company, pic1, pic2, showPic2, positions, selectedBooths,
      needsDesign, specialRequest, fasciaName, companyAddress,
      facilities, facilityDays, selectedPaket, step]);

  const BASE_URL = "https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/assets/booths";

  const PAKET_BOOTH_BY_SIZE: Record<string, { no: number; nama: string; img: string; harga: number; spesifikasi: string }[]> = {
    standard: [ // 3×3m
      { no: 1, nama: "Paket Booth 1", img: `${BASE_URL}/booth-3x3-paket1.jpg`, harga: 21600000,
        spesifikasi: "Booth custom 3×3m, backdrop custom, 3 kursi, 1 meja dealing, 1 TV, 1 meja custom, 3 modul materi perusahaan." },
      { no: 2, nama: "Paket Booth 2", img: `${BASE_URL}/booth-3x3-paket2.jpg`, harga: 5400000,
        spesifikasi: "Partisi R8 3×3m, materi sticker di belakang, stan terbuka 2 sisi, fascia nama & logo perusahaan." },
      { no: 3, nama: "Paket Booth 3", img: `${BASE_URL}/booth-3x3-paket3.jpg`, harga: 14500000,
        spesifikasi: "Booth 3×3m dengan backdrop custom dan 2 meja custom. Cocok untuk kebutuhan presentasi." },
    ],
    main: [ // 5×5m
      { no: 1, nama: "Paket Booth 1", img: `${BASE_URL}/booth-5x5-paket1.png`, harga: 57500000,
        spesifikasi: "Booth custom 5×5m, backdrop custom, 4 kursi, 2 meja dealing, 1 TV, 3 modul materi perusahaan, logo custom." },
      { no: 2, nama: "Paket Booth 2", img: `${BASE_URL}/booth-5x5-paket2.jpg`, harga: 12700000,
        spesifikasi: "Partisi R8 5×5m, materi sticker di belakang, stan terbuka 2 sisi, fascia nama & logo perusahaan." },
      { no: 3, nama: "Paket Booth 3", img: `${BASE_URL}/booth-5x5-paket3.png`, harga: 37500000,
        spesifikasi: "Booth 5×5m dengan backdrop custom, kursi sofa, dan meja custom. Nuansa premium." },
    ],
    extra: [ // 4×2m
      { no: 1, nama: "Paket Booth 1", img: `${BASE_URL}/booth-4x2-paket1.jpg`, harga: 32000000,
        spesifikasi: "Booth custom 4×2m, backdrop custom, kursi, 1 meja dealing, 1 TV, 1 meja custom, 3 modul materi perusahaan." },
      { no: 2, nama: "Paket Booth 2", img: `${BASE_URL}/booth-4x2-paket2.jpg`, harga: 22000000,
        spesifikasi: "Panel backdrop custom 4×2m, materi sticker di belakang, stan terbuka 3 sisi, fascia nama & logo perusahaan." },
    ],
  };

  const SIZE_LABEL: Record<string, string> = {
    main: "5×5m", extra: "4×2m", standard: "3×3m",
  };


  const exhibitorTotal = EXHIBITOR_CATALOG.reduce((sum, f) => {
    const qty = exhibitorOrder[f.key] || 0;
    if (qty === 0) return sum;
    const days = f.per === "hari" ? 2 : 1;
    return sum + qty * f.harga * days;
  }, 0);
  const facilityTotal = 0; // removed - now using exhibitorTotal
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

  // Deteksi ukuran booth dominan: main(5×5) > extra(4×2) > standard(3×3)
  const hasMainBooth     = selectedBoothDefs.some(b => b.type === "main");
  const hasStandardBooth = selectedBoothDefs.some(b => b.type === "standard");
  const hasExtraBooth    = selectedBoothDefs.some(b => b.type === "extra");
  const activeSizeType = selectedBoothDefs.some(b => b.type === "main") ? "main" 
    : selectedBoothDefs.some(b => b.type === "extra") ? "extra"
    : "standard";
  const PAKET_BOOTH = PAKET_BOOTH_BY_SIZE[activeSizeType];
  const paketTotal = selectedPaket !== null ? PAKET_BOOTH[selectedPaket - 1].harga : 0;
  const grandTotal = (totalAmount: number) => totalAmount + paketTotal + exhibitorTotal;

  // Reset paket jika ukuran booth berubah — HARUS di sini, setelah selectedBoothDefs & liveBooths siap
  const handleBoothChange = (newIds: string[]) => {
    const newDefs = liveBooths.filter(b => newIds.includes(b.id));
    const newSize = newDefs.some(b => b.type === "main") ? "main"
      : newDefs.some(b => b.type === "extra") ? "extra"
      : "standard";
    const oldSize = selectedBoothDefs.some(b => b.type === "main") ? "main"
      : selectedBoothDefs.some(b => b.type === "extra") ? "extra"
      : "standard";
    if (newSize !== oldSize) setSelectedPaket(null);
    setSelectedBooths(newIds);
  };

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
    if (step === 0) return !!(company.name && company.industry && company.city && pic1.name && pic1.email && pic1.whatsapp) && !emailErr && !checkingEmail;
    if (step === 1) return true; // Posisi & job vacancies opsional
    if (step === 2) return selectedBooths.length > 0;
    return true;
  };

  // Booking mutation
  const createBookingMutation = trpc.event.createEmployerBooking.useMutation({
    onSuccess: (_data, variables) => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      // Build facility items untuk invoice

      const paketData = selectedPaket !== null ? PAKET_BOOTH[selectedPaket - 1] : null;
      const facTotal = exhibitorTotal + (paketData ? paketData.harga : 0);
      const fullTotal = variables.totalAmount + facTotal;
      // Populate facility items dari exhibitor order
      const facilityItems: FacilityItem[] = EXHIBITOR_CATALOG
        .filter(f => (exhibitorOrder[f.key] || 0) > 0)
        .map(f => ({
          label: f.label,
          qty: exhibitorOrder[f.key],
          unit: f.unit,
          pricePerDay: f.harga,
          days: f.per === "hari" ? 2 : 1,
        }));

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
        facilityTotal: facTotal, // exhibitorTotal + paket
      };
      setBookingData(data);
      toast.success("Booking berhasil!", { description: "Invoice siap didownload." });
      localStorage.removeItem(DRAFT_KEY);
      setStep(4);
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
      totalAmount: grandTotal(totalAmount), // simpan grand total ke DB (booth + paket + fasilitas)
      positions,
      needsBoothDesign: needsDesign,
      specialRequest: [
        fasciaName ? `[FASCIA] ${fasciaName}` : "",
        companyAddress ? `[ALAMAT] ${companyAddress}` : "",
        specialRequest || "",
      ].filter(Boolean).join(" | ") || undefined,
      exhibitorOrder: exhibitorTotal > 0 ? JSON.stringify(exhibitorOrder) : undefined,
      paketBooth: selectedPaket !== null ? String(selectedPaket) : undefined,

      jobVacanciesUrl: jobVacanciesUrls.length > 0 ? jobVacanciesUrls : undefined,
    });
  };

  // ── SUCCESS SCREEN ────────────────────────────────────────────
  if (step === 4 && bookingData) {
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
                <span>Booth {b.label} · {b.type === "main" ? "Main 5×5m" : b.type === "extra" ? "Extra 4×2m" : "Standard 3×3m"}</span>
                <span style={{ color: "#D4A017", fontWeight: 700 }}>{fmt(b.price)}</span>
              </div>
            ))}

            {bookingData.paketBooth && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#cbd5e1", marginBottom: "0.4rem" }}>
                <span>🎨 {bookingData.paketBooth.nama}</span>
                <span style={{ color: "#fbbf24", fontWeight: 700 }}>{fmt(bookingData.paketBooth.harga)}</span>
              </div>
            )}

            {(bookingData.facilityTotal || 0) - (bookingData.paketBooth?.harga || 0) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#cbd5e1", marginBottom: "0.4rem" }}>
                <span>🛒 Fasilitas Tambahan</span>
                <span style={{ color: "#fbbf24", fontWeight: 700 }}>{fmt((bookingData.facilityTotal || 0) - (bookingData.paketBooth?.harga || 0))}</span>
              </div>
            )}

            <div style={{ borderTop: "1px solid rgba(20,184,166,0.2)", paddingTop: "0.75rem", marginTop: "0.75rem", display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.1rem" }}>
              <span>Grand Total</span>
              <span style={{ color: "#D4A017" }}>{fmt(bookingData.totalAmount + (bookingData.facilityTotal || 0))}</span>
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

          {/* Actions — Invoice button */}
          <button onClick={() => openCombinedInvoice(bookingData)}
            style={{ ...css.btnPri, background: "linear-gradient(135deg, #D4A017, #B8860B)", marginBottom: "0.75rem", boxShadow: "0 0 20px rgba(212,160,23,0.3)" }}>
            📋 Download Invoice Lengkap
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
          <p style={{ marginTop: "0.5rem", fontSize: "0.82rem", color: "#64748b" }}>
            Sudah terdaftar?{" "}
            <button onClick={() => navigate("/employer/login")} style={{ background: "none", border: "none", color: "#14b8a6", cursor: "pointer", fontWeight: 700, textDecoration: "underline", fontSize: "0.82rem" }}>
              Login →
            </button>
          </p>
          {localStorage.getItem(DRAFT_KEY) && (
            <div style={{ marginTop: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 10, padding: "0.4rem 0.9rem" }}>
              <span style={{ fontSize: "0.78rem", color: "#5eead4" }}>📝 Draft tersimpan</span>
              <button
                onClick={() => {
                  if (confirm("Hapus draft dan mulai dari awal?")) {
                    localStorage.removeItem(DRAFT_KEY);
                    window.location.reload();
                  }
                }}
                style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700, textDecoration: "underline" }}>
                Hapus draft
              </button>
            </div>
          )}
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

        {/* ── STEP 0: Perusahaan & PIC ── */}
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

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "1.5rem 0" }} />
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

        {/* ── STEP 1: Rekrutmen ── */}
        {step === 1 && (
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

        {/* ── STEP 2: Booth & Fasilitas ── */}
        {step === 2 && (
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
                onChange={handleBoothChange}
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
                <div style={{ marginTop: "0.75rem", background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 8, padding: "0.55rem 0.9rem", fontSize: "0.78rem", color: "#94a3b8" }}>
                  💡 Booth ukuran <strong style={{ color: "#D4A017" }}>{SIZE_LABEL[activeSizeType]}</strong> — Paket booth & harga di bawah sudah disesuaikan otomatis.
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
                    Kami akan menghubungkan Anda dengan vendor rekanan. Biaya .
                  </div>
                </div>
              </label>

              {/* Divider */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginBottom: "1.5rem" }}/>

              {/* 2. Paket Booth Khusus */}
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#D4A017", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.5rem" }}>
                🎨 Paket Booth Khusus
                <span style={{ marginLeft: "0.5rem", background: "rgba(212,160,23,0.15)", border: "1px solid rgba(212,160,23,0.4)", color: "#D4A017", borderRadius: 6, padding: "0.1rem 0.5rem", fontSize: "0.7rem", fontWeight: 700 }}>
                  {SIZE_LABEL[activeSizeType]}
                </span>
                <span style={{ color: "#334155", fontWeight: 400, marginLeft: "0.4rem" }}>(opsional)</span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "1rem", lineHeight: 1.6 }}>
                Pilih paket booth jika ingin tampilan lebih menarik. Harga belum termasuk sewa booth utama — .
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

            {/* ── Fascia Booth ── */}
            <div style={{ background: "rgba(249,115,22,0.06)", border: "1.5px solid rgba(249,115,22,0.3)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fb923c", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                🏷️ Nama Fascia Booth
                <span style={{ fontSize: "0.68rem", fontWeight: 500, color: "#64748b", padding: "0.15rem 0.5rem", background: "rgba(255,255,255,0.04)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }}>Maks. 24 karakter</span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "1rem", lineHeight: 1.6 }}>
                Teks yang akan dicetak di papan nama atas booth Anda (sticker). Gunakan huruf kapital.
              </div>
              <div style={{ position: "relative" }}>
                <input
                  style={{ ...css.input, border: `1.5px solid ${fasciaName.length > 24 ? "#ef4444" : fasciaName.length > 0 ? "rgba(249,115,22,0.6)" : "rgba(255,255,255,0.1)"}`, fontSize: "1.05rem", fontWeight: 700, letterSpacing: "0.08em", paddingRight: "4.5rem", textTransform: "uppercase", background: fasciaName.length > 0 ? "rgba(249,115,22,0.05)" : "rgba(255,255,255,0.05)" }}
                  value={fasciaName}
                  onChange={e => setFasciaName(e.target.value.toUpperCase())}
                  placeholder="NAMA PERUSAHAAN"
                  maxLength={30}
                />
                <div style={{ position: "absolute", right: "0.9rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", fontWeight: 700, color: fasciaName.length > 24 ? "#ef4444" : fasciaName.length >= 20 ? "#f97316" : "#475569" }}>
                  {fasciaName.length}/24
                </div>
              </div>
              {fasciaName.length > 0 && fasciaName.length <= 24 && (
                <div style={{ marginTop: "0.9rem", background: "rgba(249,115,22,0.08)", border: "1px dashed rgba(249,115,22,0.4)", borderRadius: 8, padding: "0.65rem 1rem" }}>
                  <div style={{ fontSize: "0.68rem", color: "#64748b", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Preview Fascia</div>
                  <div style={{ fontWeight: 900, fontSize: "1rem", color: "#fff", letterSpacing: "0.1em", textTransform: "uppercase" }}>{fasciaName}</div>
                </div>
              )}
            </div>

            {/* ── Exhibitor Order Catalog ── */}
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fbbf24", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                🛒 Pesan Fasilitas Tambahan
                <span style={{ fontSize: "0.68rem", fontWeight: 500, color: "#64748b", padding: "0.15rem 0.5rem", background: "rgba(255,255,255,0.04)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }}>Opsional</span>
              </div>
              {EO_CATS.map(cat => {
                const items = EXHIBITOR_CATALOG.filter(f => {
                  if (f.cat !== cat) return false;
                  if (!f.boothSize) return true;
                  if (f.boothSize === "main")     return hasMainBooth;
                  if (f.boothSize === "standard") return hasStandardBooth;
                  if (f.boothSize === "extra")    return hasExtraBooth;
                  return true;
                });
                if (items.length === 0) return null;
                return (
                  <div key={cat} style={{ marginBottom: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "1.25rem" }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {EO_CAT_ICONS[cat]} {cat}
                      {cat === "Flooring & Backdrop" && (
                        <span style={{ fontSize: "0.68rem", fontWeight: 500, color: "#60a5fa", padding: "0.1rem 0.4rem", background: "rgba(96,165,250,0.1)", borderRadius: 6, border: "1px solid rgba(96,165,250,0.25)" }}>
                          disesuaikan dengan ukuran booth Anda
                        </span>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 180px), 1fr))", gap: "0.75rem" }}>
                      {items.map(f => {
                        const qty = exhibitorOrder[f.key] || 0;
                        const days = f.per === "hari" ? 2 : 1;
                        const subtotal = qty * f.harga * days;
                        return (
                          <div key={f.key} style={{ background: qty > 0 ? "rgba(251,191,36,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${qty > 0 ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: 10, overflow: "hidden", transition: "border-color 0.2s" }}>
                            <img src={f.img} alt={f.label} style={{ width: "100%", height: 160, objectFit: "cover", display: "block", background: "#0c1a2e" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            <div style={{ padding: "0.65rem 0.75rem" }}>
                              <div style={{ fontSize: "0.75rem", color: "#e2e8f0", fontWeight: 600, marginBottom: "0.2rem", lineHeight: 1.4 }}>{f.label}</div>
                              <div style={{ fontSize: "0.68rem", color: "#64748b", marginBottom: "0.6rem" }}>
                                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(f.harga)}/{f.unit}/{f.per}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: qty > 0 ? "0.5rem" : 0 }}>
                                <button onClick={() => setExhibitorOrder(prev => ({ ...prev, [f.key]: Math.max(0, (prev[f.key] || 0) - 1) }))}
                                  style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#f1f5f9", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                                <span style={{ fontSize: "0.95rem", fontWeight: 700, color: qty > 0 ? "#fbbf24" : "#475569", minWidth: 20, textAlign: "center" }}>{qty}</span>
                                <button onClick={() => setExhibitorOrder(prev => ({ ...prev, [f.key]: (prev[f.key] || 0) + 1 }))}
                                  style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#f1f5f9", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                              </div>
                              {qty > 0 && (
                                <div style={{ background: "rgba(251,191,36,0.08)", borderRadius: 6, padding: "0.35rem 0.6rem", fontSize: "0.7rem", color: "#94a3b8" }}>
                                  {qty} {f.unit} × {f.per === "hari" ? "2 hari" : "1 event"} × {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(f.harga)}
                                  <span style={{ color: "#fbbf24", fontWeight: 700, marginLeft: "0.4rem" }}>= {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(subtotal)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {exhibitorTotal > 0 && (
                <div style={{ background: "rgba(251,191,36,0.06)", border: "1.5px solid rgba(251,191,36,0.3)", borderRadius: 12, padding: "0.85rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.82rem", color: "#94a3b8" }}>Estimasi total order fasilitas:</span>
                  <span style={{ fontSize: "1rem", fontWeight: 800, color: "#fbbf24" }}>
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(exhibitorTotal)}
                  </span>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── STEP 3: Konfirmasi ── */}
        {step === 3 && (
          <div>
            {/* ── RINGKASAN HARGA: Booth → Paket → Fasilitas → Grand Total ── */}
            <div style={css.teal}>
              <div style={css.secHd}>💰 Ringkasan Pesanan</div>

              {/* 1. Booth yang dipesan */}
              <div style={{ marginBottom: "1.25rem", paddingBottom: "1.25rem", borderBottom: "1px solid rgba(20,184,166,0.12)" }}>
                <div style={{ fontSize: "0.7rem", color: "#14b8a6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>Booth yang Dipesan</div>
                {selectedBoothDefs.map((b, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#cbd5e1", marginBottom: "0.35rem" }}>
                    <span>Booth {b.label} · {b.type === "main" ? "Main 5×5m" : b.type === "extra" ? "Extra 4×2m" : "Standard 3×3m"}</span>
                    <span style={{ color: "#D4A017", fontWeight: 700 }}>{fmt(b.price)}</span>
                  </div>
                ))}
                {fasciaName && <div style={{ fontSize: "0.78rem", color: "#fb923c", marginTop: "0.3rem" }}>🏷️ Fascia: <strong>{fasciaName}</strong></div>}
                {needsDesign && <div style={{ fontSize: "0.78rem", color: "#D4A017", marginTop: "0.3rem" }}>📐 Desain & Dekorasi Booth <em style={{ fontWeight: 400, color: "#64748b" }}>(biaya dikonfirmasi vendor)</em></div>}
                {specialRequest && <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "0.3rem" }}>📝 {specialRequest}</div>}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.95rem", paddingTop: "0.6rem", marginTop: "0.6rem", borderTop: "1px solid rgba(20,184,166,0.15)" }}>
                  <span>Subtotal Booth</span>
                  <span style={{ color: "#D4A017" }}>{fmt(totalAmount)}</span>
                </div>
              </div>

              {/* 2. Paket Booth Khusus (jika dipilih) */}
              {selectedPaket !== null && (
                <div style={{ marginBottom: "1.25rem", paddingBottom: "1.25rem", borderBottom: "1px solid rgba(20,184,166,0.12)" }}>
                  <div style={{ fontSize: "0.7rem", color: "#D4A017", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>Paket Booth Khusus</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#cbd5e1", marginBottom: "0.25rem" }}>
                    <span>🎨 {PAKET_BOOTH[selectedPaket - 1].nama}</span>
                    <span style={{ color: "#fbbf24", fontWeight: 700 }}>{fmt(PAKET_BOOTH[selectedPaket - 1].harga)}</span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", lineHeight: 1.5 }}>{PAKET_BOOTH[selectedPaket - 1].spesifikasi}</div>
                </div>
              )}

              {/* 3. Fasilitas Tambahan / Exhibitor Order (jika ada) */}
              {exhibitorTotal > 0 && (
                <div style={{ marginBottom: "1.25rem", paddingBottom: "1.25rem", borderBottom: "1px solid rgba(20,184,166,0.12)" }}>
                  <div style={{ fontSize: "0.7rem", color: "#fbbf24", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>🛒 Fasilitas Tambahan</div>
                  {EXHIBITOR_CATALOG.filter(f => (exhibitorOrder[f.key] || 0) > 0).map(f => {
                    const qty = exhibitorOrder[f.key];
                    const days = f.per === "hari" ? 2 : 1;
                    return (
                      <div key={f.key} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                        <span>{f.label} × {qty}{f.per === "hari" ? " × 2 hari" : ""}</span>
                        <span style={{ color: "#fbbf24", fontWeight: 600 }}>
                          {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(qty * f.harga * days)}
                        </span>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.88rem", paddingTop: "0.5rem", marginTop: "0.4rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ color: "#94a3b8" }}>Subtotal Fasilitas</span>
                    <span style={{ color: "#fbbf24" }}>{fmt(exhibitorTotal)}</span>
                  </div>
                </div>
              )}

              {/* 4. Grand Total */}
              <div style={{ background: "rgba(212,160,23,0.12)", border: "1.5px solid rgba(212,160,23,0.3)", borderRadius: 10, padding: "0.9rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800, fontSize: "1.2rem" }}>
                <span>Grand Total</span>
                <span style={{ color: "#D4A017", fontSize: "1.25rem" }}>{fmt(grandTotal(totalAmount))}</span>
              </div>
            </div>

            {/* ── DATA BOOKING ── */}
            <div style={css.card}>
              <div style={css.secHd}>📋 Data Booking</div>

              {/* Company */}
              <div style={{ marginBottom: "1.25rem", paddingBottom: "1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "0.7rem", color: "#14b8a6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Perusahaan</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9" }}>{company.name}</div>
                {companyAddress && <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.35rem" }}>📍 {companyAddress}</div>}
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{company.industry} · {company.city}{company.website ? ` · ${company.website}` : ""}</div>
              </div>

              {/* PIC */}
              <div style={{ marginBottom: "1.25rem", paddingBottom: "1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "0.7rem", color: "#14b8a6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Person in Charge</div>
                <div style={{ fontSize: "0.9rem", color: "#cbd5e1" }}>{pic1.name}{pic1.title ? ` · ${pic1.title}` : ""}</div>
                <div style={{ fontSize: "0.82rem", color: "#64748b" }}>{pic1.email} · {pic1.whatsapp}</div>
                {showPic2 && pic2.name && <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.25rem" }}>PIC 2: {pic2.name} · {pic2.email}</div>}
              </div>

              {/* Positions */}
              {positions.filter(p => p.position || p.customPosition).length > 0 && (
                <div style={{ marginBottom: "1.25rem", paddingBottom: "1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "0.7rem", color: "#14b8a6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Kebutuhan Rekrutmen</div>
                  {positions.filter(p => p.position || p.customPosition).map((p, i) => (
                    <div key={i} style={{ fontSize: "0.88rem", color: "#cbd5e1", marginBottom: "0.25rem" }}>
                      • {p.position || p.customPosition} — {p.count} kandidat
                    </div>
                  ))}
                </div>
              )}

              {/* Job Vacancies */}
              {jobVacanciesUrls.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.7rem", color: "#14b8a6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>File Job Vacancies</div>
                  {jobVacanciesUrls.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: "#cbd5e1", marginBottom: "0.3rem" }}>
                      <span>📄</span>
                      <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>{f.name}</a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── INFORMASI PEMBAYARAN ── */}
            <div style={css.card}>
              <div style={css.secHd}>🏦 Informasi Pembayaran</div>
              <div style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.15)", borderRadius: 10, padding: "1.25rem", marginBottom: "1rem" }}>
                {[
                  { label: "Bank",         val: "Bank BTN" },
                  { label: "No. Rekening", val: "0095 01 30 00000 38" },
                  { label: "Atas Nama",    val: "Kopensi STP Bandung" },
                  { label: "Nominal",      val: fmt(grandTotal(totalAmount)) },
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
    {/* ── Lightbox ── */}
    {lightboxImg && (
      <div
        onClick={() => setLightboxImg(null)}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out", padding: "1rem" }}>
        <img src={lightboxImg} alt="preview"
          style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 12, boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }} />
        <button onClick={() => setLightboxImg(null)}
          style={{ position: "absolute", top: "1.25rem", right: "1.25rem", width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ✕
        </button>
      </div>
    )}
    </div>
  );
}
