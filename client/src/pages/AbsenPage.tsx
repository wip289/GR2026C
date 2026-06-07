import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

function formatTime(d: Date | string) {
  const dt = new Date(d);
  return dt.toLocaleString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta"
  }) + " WIB";
}

export default function AbsenPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || "";

  const [done,    setDone]    = useState(false);
  const [result,  setResult]  = useState<any>(null);
  const [error,   setError]   = useState("");

  const checkIn = trpc.event.checkInJobseeker.useMutation({
    onSuccess: (data) => { setResult(data); setDone(true); },
    onError:   (e)    => { setError(e.message === "NOT_FOUND" ? "ID tidak ditemukan" : e.message); setDone(true); },
  });

  useEffect(() => {
    if (!id) { setError("ID tidak ditemukan di URL"); setDone(true); return; }
    checkIn.mutate({ registrationId: id });
  }, []);

  const s = {
    page: {
      minHeight: "100vh", background: "#0a1628",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1.5rem", fontFamily: "Arial, sans-serif",
    } as React.CSSProperties,
    card: {
      background: "#fff", borderRadius: 20, padding: "2rem 1.75rem",
      maxWidth: 380, width: "100%", textAlign: "center" as const,
      boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
    },
    logo: { fontSize: "0.75rem", color: "#94a3b8", marginBottom: "1.25rem", letterSpacing: "0.06em" },
    foto: {
      width: 100, height: 100, borderRadius: "50%",
      objectFit: "cover" as const, objectPosition: "center 15%",
      border: "3px solid #1A7A6E", margin: "0 auto 1rem",
      display: "block",
    },
    fotoPlaceholder: {
      width: 100, height: 100, borderRadius: "50%",
      background: "#f1f5f9", border: "3px solid #1A7A6E",
      margin: "0 auto 1rem", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontSize: 36,
    } as React.CSSProperties,
    nama: { fontSize: "1.3rem", fontWeight: 800, color: "#0a1628", marginBottom: "0.25rem" },
    institusi: { fontSize: "0.88rem", color: "#64748b", marginBottom: "0.25rem" },
    regId: { fontSize: "0.72rem", color: "#94a3b8", fontFamily: "monospace", marginBottom: "1.5rem" },
    badgeLunas: {
      display: "inline-block", background: "#dcfce7",
      color: "#166534", borderRadius: 10, padding: "0.6rem 1.25rem",
      fontWeight: 800, fontSize: "1.05rem", marginBottom: "0.75rem",
    },
    badgeSudah: {
      display: "inline-block", background: "#fef9c3",
      color: "#854d0e", borderRadius: 10, padding: "0.6rem 1.25rem",
      fontWeight: 800, fontSize: "1.05rem", marginBottom: "0.75rem",
    },
    time: { fontSize: "0.78rem", color: "#64748b", lineHeight: 1.6 },
    errBox: {
      background: "#fef2f2", border: "1px solid #fca5a5",
      borderRadius: 12, padding: "1.25rem", color: "#991b1b",
      fontWeight: 700, fontSize: "0.95rem",
    },
    spinner: {
      width: 44, height: 44, border: "4px solid #e2e8f0",
      borderTopColor: "#1A7A6E", borderRadius: "50%",
      animation: "spin 0.8s linear infinite", margin: "2rem auto",
    } as React.CSSProperties,
    footer: { marginTop: "1.75rem", fontSize: "0.68rem", color: "#cbd5e1" },
  };

  if (!done) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={s.logo}>GRAND RECRUITMENT 2026</div>
          <div style={s.spinner} />
          <div style={{ color: "#64748b", fontSize: "0.88rem" }}>Memproses absensi...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.logo}>GRAND RECRUITMENT 2026</div>
          <div style={{ fontSize: 48, marginBottom: "1rem" }}>⚠️</div>
          <div style={s.errBox}>{error}</div>
          <div style={s.footer}>Grand Recruitment 2026 · NHI Bandung</div>
        </div>
      </div>
    );
  }

  const { jobseeker, alreadyCheckedIn, checkedInAt, day } = result;

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>GRAND RECRUITMENT 2026</div>

        {/* Foto */}
        {jobseeker.fotoUrl
          ? <img src={jobseeker.fotoUrl} alt="foto" style={s.foto} />
          : <div style={s.fotoPlaceholder}>👤</div>
        }

        {/* Info */}
        <div style={s.nama}>{jobseeker.namaLengkap}</div>
        <div style={s.institusi}>{jobseeker.institusi || "—"}</div>
        <div style={s.regId}>{jobseeker.registrationId}</div>

        {/* Status */}
        <div style={{ fontSize: "0.75rem", color: "#1A7A6E", fontWeight: 700, marginBottom: "0.5rem", background: "rgba(26,122,110,0.08)", borderRadius: 6, padding: "0.25rem 0.75rem", display: "inline-block" }}>
          Hari {day} · {day === 1 ? "Senin, 8 Juni 2026" : "Selasa, 9 Juni 2026"}
        </div>
        {alreadyCheckedIn ? (
          <>
            <div style={s.badgeSudah}>⚠️ Sudah Absen Hari {day}</div>
            <div style={s.time}>
              Tercatat hadir pada:<br />
              <strong>{formatTime(checkedInAt)}</strong>
            </div>
          </>
        ) : (
          <>
            <div style={s.badgeLunas}>✅ Absen Hari {day} Berhasil!</div>
            <div style={s.time}>
              Waktu masuk:<br />
              <strong>{formatTime(checkedInAt)}</strong>
            </div>
          </>
        )}

        <div style={s.footer}>
          Grand Recruitment 2026 · Gedung Dome NHI Bandung<br />
          8–9 Juni 2026
        </div>
      </div>
    </div>
  );
}
