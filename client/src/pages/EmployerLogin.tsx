import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const s = {
  page:  { minHeight: "100vh", background: "#0a1628", fontFamily: "system-ui, sans-serif", color: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" } as React.CSSProperties,
  card:  { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 20, padding: "2.5rem", maxWidth: 460, width: "100%" },
  label: { display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.4rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  input: { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "0.75rem 1rem", fontSize: "0.95rem", color: "#f1f5f9", outline: "none" },
  btn:   { background: "linear-gradient(135deg, #0d9488, #14b8a6)", border: "none", color: "#fff", borderRadius: 12, padding: "0.9rem", fontSize: "1rem", fontWeight: 700, cursor: "pointer", width: "100%" },
  hint:  { fontSize: "0.78rem", color: "#475569", marginTop: "0.35rem", lineHeight: 1.5 },
};

export default function EmployerLogin() {
  const [, navigate] = useLocation();
  const [bookingId, setBookingId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const loginQuery = trpc.event.loginEmployer.useQuery(
    { bookingId: bookingId.trim().toUpperCase(), email: email.trim().toLowerCase() },
    { enabled: false, retry: false }
  );

  const handleLogin = async () => {
    if (!bookingId.trim() || !email.trim()) {
      toast.error("Isi Booking ID dan Email terlebih dahulu");
      return;
    }
    setLoading(true);
    try {
      const result = await loginQuery.refetch();
      if (!result.data) {
        toast.error("Booking ID atau Email tidak sesuai", {
          description: "Pastikan Booking ID dan email sama dengan saat pendaftaran"
        });
        setLoading(false);
        return;
      }
      localStorage.setItem("employer_session", JSON.stringify({
        bookingId: bookingId.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
      }));
      toast.success(`Selamat datang, ${result.data.companyName}!`);
      navigate("/employer/dashboard");
    } catch (err) {
      toast.error("Terjadi kesalahan, coba lagi");
    }
    setLoading(false);
  };

  return (
    <div style={s.page}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 48, marginBottom: "1rem" }} />
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            Login <span style={{ color: "#14b8a6" }}>Employer</span>
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
            Masuk untuk melihat status booking dan dashboard Anda
          </p>
        </div>

        <div style={s.card}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={s.label}>Booking ID <span style={{ color: "#ef4444" }}>*</span></label>
            <input style={s.input} value={bookingId}
              onChange={e => setBookingId(e.target.value)}
              placeholder="Contoh: GR2026-260407-WAN7"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
            <p style={s.hint}>Booking ID ada di invoice yang Anda download saat pendaftaran</p>
          </div>

          <div style={{ marginBottom: "1.75rem" }}>
            <label style={s.label}>Email <span style={{ color: "#ef4444" }}>*</span></label>
            <input style={s.input} type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email PIC yang digunakan saat mendaftar"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
            <p style={s.hint}>Gunakan email PIC 1 yang sama dengan saat pendaftaran</p>
          </div>

          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
            {loading ? "Memverifikasi..." : "Masuk ke Dashboard →"}
          </button>

          <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.15)", borderRadius: 10 }}>
            <p style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.6 }}>
              💡 <strong style={{ color: "#f1f5f9" }}>Belum punya Booking ID?</strong><br/>
              Daftarkan perusahaan Anda terlebih dahulu dan download invoice untuk mendapatkan Booking ID.
            </p>
            <button onClick={() => navigate("/employer/register")}
              style={{ marginTop: "0.75rem", background: "transparent", border: "1px solid rgba(20,184,166,0.3)", color: "#14b8a6", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
              Daftar Sekarang →
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "0.85rem" }}>
            ← Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}
