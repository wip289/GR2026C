import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const s = {
  page:  { minHeight: "100vh", background: "#0a1628", fontFamily: "system-ui, sans-serif", color: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" } as React.CSSProperties,
  card:  { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 20, padding: "2.5rem", maxWidth: 460, width: "100%" },
  label: { display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.4rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  input: { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "0.75rem 1rem", fontSize: "0.95rem", color: "#f1f5f9", outline: "none" },
  btn:   { background: "linear-gradient(135deg, #D4A017, #B8860B)", border: "none", color: "#fff", borderRadius: 12, padding: "0.9rem", fontSize: "1rem", fontWeight: 700, cursor: "pointer", width: "100%" },
  hint:  { fontSize: "0.78rem", color: "#475569", marginTop: "0.35rem", lineHeight: 1.5 },
};

export default function JobseekerLogin() {
  const [, navigate] = useLocation();
  const [registrationId, setRegistrationId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const loginQuery = trpc.event.loginJobseeker.useQuery(
    { registrationId: registrationId.trim().toUpperCase(), email: email.trim().toLowerCase() },
    { enabled: false, retry: false }
  );

  const handleLogin = async () => {
    if (!registrationId.trim() || !email.trim()) {
      toast.error("Isi Registration ID dan Email terlebih dahulu");
      return;
    }
    setLoading(true);
    try {
      const result = await loginQuery.refetch();
      if (!result.data) {
        toast.error("Registration ID atau Email tidak sesuai", {
          description: "Pastikan ID dan email sama dengan saat pendaftaran"
        });
        setLoading(false);
        return;
      }
      localStorage.setItem("jobseeker_session", JSON.stringify({
        registrationId: registrationId.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
      }));
      toast.success(`Selamat datang, ${result.data.namaLengkap}!`);
      navigate("/jobseeker/dashboard");
    } catch {
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
            Login <span style={{ color: "#D4A017" }}>Jobseeker</span>
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
            Masuk untuk melihat status pendaftaran dan profil Anda
          </p>
        </div>

        <div style={s.card}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={s.label}>Registration ID <span style={{ color: "#ef4444" }}>*</span></label>
            <input style={s.input} value={registrationId}
              onChange={e => setRegistrationId(e.target.value)}
              placeholder="Contoh: JS55050533"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
            <p style={s.hint}>Registration ID ada di halaman konfirmasi saat kamu mendaftar</p>
          </div>

          <div style={{ marginBottom: "1.75rem" }}>
            <label style={s.label}>Email <span style={{ color: "#ef4444" }}>*</span></label>
            <input style={s.input} type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email yang digunakan saat mendaftar"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
            <p style={s.hint}>Gunakan email yang sama dengan saat pendaftaran</p>
          </div>

          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
            {loading ? "Memverifikasi..." : "Masuk ke Dashboard →"}
          </button>

          <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(212,160,23,0.05)", border: "1px solid rgba(212,160,23,0.15)", borderRadius: 10 }}>
            <p style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.6 }}>
              💡 <strong style={{ color: "#f1f5f9" }}>Belum punya Registration ID?</strong><br/>
              Daftarkan diri Anda terlebih dahulu — pendaftaran <strong style={{ color: "#D4A017" }}>GRATIS!</strong>
            </p>
            <button onClick={() => navigate("/jobseeker/register")}
              style={{ marginTop: "0.75rem", background: "transparent", border: "1px solid rgba(212,160,23,0.3)", color: "#D4A017", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
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
