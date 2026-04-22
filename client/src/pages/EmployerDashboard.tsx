import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { openInvoiceForPrint, generateBookingId, getPaymentDeadline } from "@/lib/invoiceGenerator";

const DAYS = ["Senin, 8 Juni 2026", "Selasa, 9 Juni 2026"];
const SLOTS = ["09.00 – 10.00", "10.00 – 11.00", "11.00 – 12.00", "13.00 – 14.00", "14.00 – 15.00", "15.00 – 16.00"];
const INTERVIEW_BOOTHS = ["E1","E2","E3","E4","E5","E6","E7","E8","E9","E10"];

// Simulasi slot yang sudah dibooking orang lain
const TAKEN_SLOTS: Record<string, string> = {
  "E1-0-0": "PT Garuda Food", "E1-0-1": "PT Santika Hotels",
  "E2-0-0": "PT Aston Group",  "E3-0-2": "PT Accor Hotels",
  "E4-1-0": "PT Hyatt",        "E5-1-1": "PT Marriott",
  "E6-0-3": "PT MNC Hotels",   "E7-0-4": "PT TAUZIA",
};

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

type TabId = "status" | "booth" | "interview" | "idcard";

export default function EmployerDashboard() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>("status");
  const [booking, setBooking] = useState<typeof MOCK_BOOKINGS[string] | null>(null);
  const [bookingId, setBookingId] = useState("");
  const [mySlots, setMySlots] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);

  const [sessionData, setSessionData] = useState<{bookingId: string; email: string} | null>(null);

  // ── ID Card Staff state ──────────────────────────────────────
  type StaffMember = { nama: string; posisi: string };
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [staffForm, setStaffForm] = useState<StaffMember>({ nama: "", posisi: "" });
  const [staffSaved, setStaffSaved] = useState(false);

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

  useEffect(() => {
    if (loginQuery.data) {
      setBooking(loginQuery.data as any);
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
      totalAmount: parseFloat(b.totalAmount || "0"),
      paymentDeadline: getPaymentDeadline(),
    });
  };

  if (!booking) return (
    <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#64748b" }}>Loading...</p>
    </div>
  );

  // Max interview slots based on booth types
  const booths = Array.isArray(booking.booths) ? booking.booths : [];
  const mainCount = booths.filter((b: any) => b.type === "main").length;
  const stdCount  = booths.filter((b: any) => b.type === "standard").length;
  const maxSlots  = (mainCount * 2) + (stdCount * 1);
  const maxStaff  = (mainCount * 4) + (stdCount * 2);
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
    if (TAKEN_SLOTS[key]) {
      toast.error("Slot ini sudah dibooking perusahaan lain");
      return;
    }
    setMySlots(prev => [...prev, key]);
    toast.success("Slot berhasil ditambahkan!");
  };

  const statusColor = booking.status === "confirmed" ? "#14b8a6" : booking.status === "rejected" ? "#ef4444" : "#f97316";
  const statusLabel = booking.status === "confirmed" ? "✅ Pembayaran Dikonfirmasi" : booking.status === "rejected" ? "❌ Ditolak" : "⏳ Menunggu Konfirmasi Pembayaran";

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

        {/* Status bar */}
        <div style={{ background: `${statusColor}15`, border: `1px solid ${statusColor}40`, borderRadius: 12, padding: "1rem 1.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status Booking</div>
            <div style={{ fontWeight: 700, color: statusColor, fontSize: "1rem" }}>{statusLabel}</div>
          </div>
          {booking.status === "pending" && (
            <div style={{ fontSize: "0.82rem", color: "#fed7aa", background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 8, padding: "0.6rem 1rem" }}>
              ⏰ Segera lakukan transfer · Batas: <strong>1 Juni 2026</strong>
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
          ]).map(tab => (
            <button key={tab.id} style={s.tab(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: STATUS ── */}
        {activeTab === "status" && (
          <div>
            {/* Booking summary */}
            <div style={s.teal}>
              <div style={s.secHd}>📋 Ringkasan Booking</div>
              {booths.map((b: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid rgba(20,184,166,0.1)", fontSize: "0.9rem" }}>
                  <span style={{ color: "#cbd5e1" }}>
                    Booth <strong style={{ color: "#14b8a6" }}>{b.label}</strong> · {(b.type === "main") ? "Main Booth 5×5m" : "Standard Booth 3×3m"}
                  </span>
                  <span style={{ color: "#D4A017", fontWeight: 700 }}>{fmt(b.price || 0)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", fontWeight: 800, fontSize: "1.05rem" }}>
                <span>Total</span>
                <span style={{ color: "#D4A017" }}>{fmt(totalAmount)}</span>
              </div>
            </div>

            {/* Payment instruction if pending */}
            {booking.status === "pending" && (
              <div style={s.gold}>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#D4A017", marginBottom: "1rem" }}>🏦 Instruksi Pembayaran</div>
                {[
                  { label: "Bank", val: "Bank BNI" },
                  { label: "No. Rekening", val: "0123-456-789" },
                  { label: "Atas Nama", val: "Koperasi Poltekpar NHI Bandung" },
                  { label: "Nominal", val: fmt(totalAmount) },
                  { label: "Berita Transfer", val: bookingId },
                  { label: "Batas Bayar", val: "1 Juni 2026 (H-7 sebelum acara)" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", gap: "1rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.82rem", color: "#64748b", minWidth: 130 }}>{item.label}</span>
                    <span style={{ fontWeight: 700, color: item.label === "Nominal" || item.label === "Batas Bayar" ? "#D4A017" : "#f1f5f9", fontSize: "0.9rem" }}>{item.val}</span>
                  </div>
                ))}
                <div style={{ marginTop: "1rem", padding: "0.85rem 1rem", background: "rgba(212,160,23,0.08)", borderRadius: 8, fontSize: "0.82rem", color: "#fde68a" }}>
                  Setelah transfer, kirim bukti pembayaran ke WhatsApp panitia: <strong>0812-xxxx-xxxx</strong> dengan format: <em>{bookingId} - [Nama Perusahaan]</em>
                </div>
              </div>
            )}

            {/* Download Invoice */}
            <div style={{ background: "rgba(212,160,23,0.05)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ fontWeight: 700, color: "#D4A017", marginBottom: "0.25rem" }}>📄 Invoice Booking</div>
                <div style={{ fontSize: "0.82rem", color: "#64748b" }}>Download ulang invoice untuk keperluan administrasi atau pembayaran</div>
              </div>
              <button onClick={handleDownloadInvoice}
                style={{ background: "linear-gradient(135deg,#D4A017,#B8860B)", border: "none", color: "#fff", borderRadius: 10, padding: "0.65rem 1.25rem", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const }}>
                📥 Download Invoice
              </button>
            </div>

            {/* Contact & Info */}
            <div style={s.card}>
              <div style={s.secHd}>📞 Kontak Panitia</div>
              <div style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.8 }}>
                <div>WhatsApp: <strong style={{ color: "#f1f5f9" }}>0812-xxxx-xxxx</strong></div>
                <div>Email: <strong style={{ color: "#f1f5f9" }}>grandrecruitment@nhi.ac.id</strong></div>
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
                          <div style={{ color: "#64748b", fontSize: "0.85rem" }}>{b.type === "main" ? "Main Booth · 5×5 meter" : "Standard Booth · 3×3 meter"}</div>
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
                          <div style={{ color: "#64748b", fontSize: "0.85rem" }}>{b.type === "main" ? "Main Booth · 5×5 meter" : "Standard Booth · 3×3 meter"}</div>
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
            {booking.status === "confirmed" ? (
              <>
                {/* Slot info */}
                <div style={s.teal}>
                  <div style={s.secHd}>📅 Booking Interview Booth</div>
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
                        {booking.booths.map(b => b.type === "main" ? "Main Booth = 2 slot" : "Standard Booth = 1 slot").join(" · ")}
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
                          {SLOTS.map(slot => (
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
                            {SLOTS.map((_, slotIdx) => {
                              const key = `${booth}-${selectedDay}-${slotIdx}`;
                              const isMine = mySlots.includes(key);
                              const isTaken = !!TAKEN_SLOTS[key];
                              const bg = isMine ? "#065f46" : isTaken ? "#7f1d1d" : "rgba(20,184,166,0.08)";
                              const border = isMine ? "1px solid #10b981" : isTaken ? "1px solid #ef4444" : "1px solid rgba(20,184,166,0.15)";
                              const label = isMine ? "✓ Saya" : isTaken ? "✗" : "•";
                              const color = isMine ? "#10b981" : isTaken ? "#f87171" : "#14b8a6";
                              return (
                                <td key={slotIdx} style={{ padding: "0.4rem", borderBottom: "1px solid rgba(255,255,255,0.04)", textAlign: "center" }}>
                                  <div
                                    onClick={() => !isTaken && handleBookSlot(key)}
                                    title={isTaken ? TAKEN_SLOTS[key] : isMine ? "Klik untuk batalkan" : "Klik untuk booking"}
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
                          <span>Booth <strong style={{ color: "#60a5fa" }}>{booth}</strong> · {DAYS[parseInt(day)].split(",")[0]} · {SLOTS[parseInt(slot)]}</span>
                          <button onClick={() => setMySlots(prev => prev.filter(s => s !== key))}
                            style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "1rem" }}>×</button>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => { toast.success("Booking interview booth berhasil dikonfirmasi!", { description: "Detail akan dikirim via WhatsApp H-3 sebelum acara" }); }}
                      style={{ marginTop: "1rem", background: "linear-gradient(135deg,#0d9488,#14b8a6)", border: "none", color: "#fff", borderRadius: 10, padding: "0.75rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", width: "100%" }}>
                      Konfirmasi Booking Interview Booth ✓
                    </button>
                  </div>
                )}
              </>
            ) : (
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

                {/* Form tambah staff */}
                {staffList.length < maxStaff && !staffSaved && (
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

                    {/* Simpan */}
                    {!staffSaved ? (
                      <button
                        onClick={() => {
                          if (staffList.length === 0) { toast.error("Tambah minimal 1 staff"); return; }
                          // TODO: kirim ke backend
                          setStaffSaved(true);
                          toast.success("Daftar staff berhasil disimpan!", { description: "Panitia akan memproses pencetakan ID Card Anda" });
                        }}
                        style={{ marginTop: "1.25rem", width: "100%", background: "linear-gradient(135deg,#0d9488,#14b8a6)", border: "none", color: "#fff", borderRadius: 10, padding: "0.8rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer" }}>
                        ✅ Simpan & Kirim ke Panitia
                      </button>
                    ) : (
                      <div style={{ marginTop: "1.25rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 10, padding: "1rem", textAlign: "center" }}>
                        <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>✅</div>
                        <div style={{ fontWeight: 700, color: "#10b981", marginBottom: "0.25rem" }}>Daftar staff sudah dikirim ke panitia</div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>ID Card akan dicetak oleh vendor dan diserahkan saat hari H</div>
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
      </div>
    </div>
  );
}
