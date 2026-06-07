import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────
type CheckInType = "jobseeker" | "employer";
type DayId = 1 | 2;

interface CheckInRecord {
  id: string;
  name: string;
  type: CheckInType;
  time: string;
  day: DayId;
  detail: string;
}

const s = {
  page:  { minHeight: "100vh", background: "#080e1a", fontFamily: "system-ui, sans-serif", color: "#f1f5f9" } as React.CSSProperties,
  nav:   { background: "rgba(8,14,26,0.98)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(96,165,250,0.3)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky" as const, top: 0, zIndex: 50 },
  card:  { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" },
  input: { width: "100%", background: "rgba(255,255,255,0.06)", border: "2px solid rgba(96,165,250,0.3)", borderRadius: 12, padding: "1rem 1.25rem", fontSize: "1.1rem", color: "#f1f5f9", outline: "none", letterSpacing: "0.05em", fontFamily: "monospace" },
};

const STORAGE_KEY_JS = "gr2026_checkin_jobseeker";
const STORAGE_KEY_EB = "gr2026_checkin_employer";

function getCheckinStorage(type: CheckInType): Record<string, { day1: string; day2: string }> {
  try {
    const key = type === "jobseeker" ? STORAGE_KEY_JS : STORAGE_KEY_EB;
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch { return {}; }
}

function saveCheckin(type: CheckInType, id: string, day: DayId) {
  const key = type === "jobseeker" ? STORAGE_KEY_JS : STORAGE_KEY_EB;
  const store = getCheckinStorage(type);
  if (!store[id]) store[id] = { day1: "", day2: "" };
  const time = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  store[id][`day${day}` as "day1" | "day2"] = time;
  localStorage.setItem(key, JSON.stringify(store));
  return time;
}

export default function CheckIn() {
  const [, navigate] = useLocation();
  const [activeDay, setActiveDay] = useState<DayId>(1);
  const [checkInType, setCheckInType] = useState<CheckInType>("jobseeker");
  const [inputId, setInputId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [found, setFound] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [alreadyIn, setAlreadyIn] = useState<string | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<CheckInRecord[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // tRPC queries
  const { data: jobseekersRaw, refetch: refetchJS } = trpc.event.getAllJobseekers.useQuery();
  const { data: employersRaw } = trpc.event.getAllEmployerBookings.useQuery();
  const { data: attendanceData, refetch: refetchStats } = trpc.event.getAttendanceStats.useQuery(undefined, { refetchInterval: 10000 });
  const jobseekers = (jobseekersRaw || []) as any[];
  const employers  = (employersRaw  || []) as any[];

  const checkInMutation = trpc.event.checkInJobseeker.useMutation({
    onSuccess: (data) => {
      refetchJS();
      refetchStats();
      if (data.alreadyCheckedIn) {
        const timeStr = new Date(data.checkedInAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
        setAlreadyIn(timeStr);
        return;
      }
      const timeStr = new Date(data.checkedInAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
      const record: CheckInRecord = {
        id: data.jobseeker.registrationId,
        name: data.jobseeker.namaLengkap,
        type: "jobseeker",
        time: timeStr,
        day: activeDay,
        detail: data.jobseeker.institusi || "",
      };
      setRecentCheckins(prev => [record, ...prev.slice(0, 19)]);
      toast.success("✅ Check-in berhasil!", { description: `${data.jobseeker.namaLengkap} · Hari ${activeDay} · ${timeStr}` });
      setFound(null);
      setInputId("");
      setAlreadyIn(null);
      inputRef.current?.focus();
    },
    onError: (e) => toast.error("Gagal check-in: " + e.message),
  });

  // Stats — jobseeker dari DB, employer dari localStorage
  const ebStore = getCheckinStorage("employer");
  const jsDay1 = attendanceData?.day1 ?? 0;
  const jsDay2 = attendanceData?.day2 ?? 0;
  const ebDay1 = Object.values(ebStore).filter(v => v.day1).length;
  const ebDay2 = Object.values(ebStore).filter(v => v.day2).length;

  // Focus input on load
  useEffect(() => { inputRef.current?.focus(); }, [checkInType]);

  const handleSearch = () => {
    const id = inputId.trim().toUpperCase();
    if (!id) return;

    setFound(null);
    setNotFound(false);
    setAlreadyIn(null);

    if (checkInType === "jobseeker") {
      const js = jobseekers.find((j: any) =>
        j.registrationId?.toUpperCase() === id ||
        j.namaLengkap?.toUpperCase().includes(id)
      );
      if (!js) { setNotFound(true); return; }

      // Check DB field langsung
      const checkedAt = activeDay === 1 ? js.checkedInDay1At : js.checkedInDay2At;
      if (checkedAt) {
        const timeStr = new Date(checkedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
        setAlreadyIn(timeStr);
      }
      setFound(js);
    } else {
      const eb = employers.find((e: any) =>
        e.bookingId?.toUpperCase() === id ||
        e.companyName?.toUpperCase().includes(id)
      );
      if (!eb) { setNotFound(true); return; }

      const store = getCheckinStorage("employer");
      const existing = store[eb.bookingId]?.[`day${activeDay}`];
      if (existing) { setAlreadyIn(existing); setFound(eb); return; }

      setFound(eb);
    }
  };

  const handleConfirmCheckIn = () => {
    if (!found) return;
    if (checkInType === "jobseeker") {
      // Pakai DB mutation
      checkInMutation.mutate({ registrationId: found.registrationId, day: activeDay });
    } else {
      // Employer tetap pakai localStorage
      const id = found.bookingId;
      const time = saveCheckin("employer", id, activeDay);
      const booths = (() => { try { return JSON.parse(typeof found.booths === "string" ? found.booths : "[]").map((b: any) => b.label).join(", "); } catch { return ""; } })();
      const record: CheckInRecord = { id, name: found.companyName, type: "employer", time, day: activeDay, detail: booths };
      setRecentCheckins(prev => [record, ...prev.slice(0, 19)]);
      toast.success("✅ Check-in berhasil!", { description: `${found.companyName} · Hari ${activeDay} · ${time}` });
      setFound(null); setInputId(""); setAlreadyIn(null); inputRef.current?.focus();
    }
  };

  const handleCancel = () => {
    setFound(null);
    setNotFound(false);
    setAlreadyIn(null);
    setInputId("");
    inputRef.current?.focus();
  };

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 32 }}/>
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: "1rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#60a5fa" }}>✅ Check-in & Live Counter</div>
            <div style={{ fontSize: "0.7rem", color: "#475569" }}>Grand Recruitment 2026 · Divisi Registration</div>
          </div>
        </div>
        <button onClick={() => navigate("/boss")}
          style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", color: "#D4A017", borderRadius: 8, padding: "0.4rem 0.9rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
          ← Panel Panitia
        </button>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem 1.25rem" }}>

        {/* ── LIVE COUNTER ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Jobseeker Hari 1", val: jsDay1, total: jobseekers.length, color: "#60a5fa" },
            { label: "Jobseeker Hari 2", val: jsDay2, total: jobseekers.length, color: "#818cf8" },
            { label: "Employer Hari 1",  val: ebDay1, total: employers.length,  color: "#14b8a6" },
            { label: "Employer Hari 2",  val: ebDay2, total: employers.length,  color: "#D4A017" },
          ].map(k => (
            <div key={k.label} style={{ background: `${k.color}10`, border: `1px solid ${k.color}25`, borderRadius: 12, padding: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.val}</div>
              <div style={{ fontSize: "0.62rem", color: "#64748b", marginTop: "0.25rem" }}>/ {k.total} terdaftar</div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, margin: "0.5rem 0 0.25rem" }}>
                <div style={{ height: "100%", width: `${k.total ? (k.val/k.total)*100 : 0}%`, background: k.color, borderRadius: 99, transition: "width 0.5s" }}/>
              </div>
              <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* ── DAY SELECTOR ── */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
          {([1, 2] as DayId[]).map(day => (
            <button key={day} onClick={() => setActiveDay(day)}
              style={{ flex: 1, padding: "0.85rem", borderRadius: 12, border: `2px solid ${activeDay === day ? "#60a5fa" : "rgba(255,255,255,0.08)"}`, background: activeDay === day ? "rgba(96,165,250,0.1)" : "transparent", color: activeDay === day ? "#60a5fa" : "#64748b", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", transition: "all 0.15s" }}>
              {day === 1 ? "📅 Hari 1 — Senin 8 Juni" : "📅 Hari 2 — Selasa 9 Juni"}
            </button>
          ))}
        </div>

        {/* ── TYPE SELECTOR ── */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {([
            { id: "jobseeker" as CheckInType, label: "🎓 Jobseeker", color: "#60a5fa" },
            { id: "employer"  as CheckInType, label: "🏢 Employer",  color: "#14b8a6" },
          ]).map(t => (
            <button key={t.id} onClick={() => { setCheckInType(t.id); handleCancel(); }}
              style={{ flex: 1, padding: "0.75rem", borderRadius: 10, border: `2px solid ${checkInType === t.id ? t.color : "rgba(255,255,255,0.08)"}`, background: checkInType === t.id ? `${t.color}15` : "transparent", color: checkInType === t.id ? t.color : "#64748b", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── SEARCH / INPUT ── */}
        <div style={s.card}>
          <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.75rem" }}>
            Masukkan Registration ID atau ketik nama {checkInType === "jobseeker" ? "jobseeker" : "perusahaan"}:
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <input ref={inputRef} style={s.input} value={inputId}
              onChange={e => { setInputId(e.target.value.toUpperCase()); setNotFound(false); setFound(null); setAlreadyIn(null); }}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder={checkInType === "jobseeker" ? "JS-WISNU-NHI-24-26-001 atau nama..." : "E-WISNUP-HTL-26-0001 atau nama..."}
              autoComplete="off"/>
            <button onClick={handleSearch}
              style={{ background: "linear-gradient(135deg,#3b82f6,#60a5fa)", border: "none", color: "#fff", borderRadius: 12, padding: "0 1.5rem", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const }}>
              🔍 Cari
            </button>
          </div>

          {/* QR Scanner hint */}
          <div style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "#334155" }}>
            📷 Arahkan scanner QR ke ID card untuk mengisi otomatis, lalu tekan Enter
          </div>

          {/* Not found */}
          {notFound && (
            <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, color: "#fca5a5", fontSize: "0.88rem" }}>
              ❌ ID atau nama tidak ditemukan. Pastikan ejaan benar atau hubungi panitia.
            </div>
          )}

          {/* Found result */}
          {found && (
            <div style={{ marginTop: "1rem", padding: "1.25rem", background: alreadyIn ? "rgba(249,115,22,0.08)" : "rgba(20,184,166,0.08)", border: `1px solid ${alreadyIn ? "rgba(249,115,22,0.3)" : "rgba(20,184,166,0.3)"}`, borderRadius: 12 }}>
              {checkInType === "jobseeker" ? (
                <div>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 10, background: "rgba(96,165,250,0.15)", border: "2px solid rgba(96,165,250,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>🎓</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#f1f5f9" }}>{found.namaLengkap}</div>
                      <div style={{ fontSize: "0.78rem", color: "#60a5fa", fontFamily: "monospace" }}>{found.registrationId}</div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{found.institusi} · {found.bidangMinat}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 10, background: "rgba(20,184,166,0.15)", border: "2px solid rgba(20,184,166,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>🏢</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#f1f5f9" }}>{found.companyName}</div>
                      <div style={{ fontSize: "0.78rem", color: "#14b8a6", fontFamily: "monospace" }}>{found.bookingId}</div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{found.industry} · PIC: {found.pic1Name}</div>
                    </div>
                  </div>
                </div>
              )}

              {alreadyIn ? (
                <div style={{ background: "rgba(249,115,22,0.1)", borderRadius: 8, padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#fed7aa" }}>
                  ⚠️ Sudah check-in Hari {activeDay} pukul <strong>{alreadyIn}</strong>
                  <div style={{ marginTop: "0.5rem" }}>
                    <button onClick={handleCancel} style={{ background: "transparent", border: "1px solid rgba(249,115,22,0.4)", color: "#f97316", borderRadius: 8, padding: "0.4rem 1rem", fontSize: "0.82rem", cursor: "pointer" }}>
                      OK, Tutup
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button onClick={handleConfirmCheckIn}
                    style={{ background: "linear-gradient(135deg,#14b8a6,#0d9488)", border: "none", color: "#fff", borderRadius: 10, padding: "0.75rem 2rem", fontSize: "0.95rem", fontWeight: 800, cursor: "pointer", flex: 1 }}>
                    ✅ Konfirmasi Check-in Hari {activeDay}
                  </button>
                  <button onClick={handleCancel}
                    style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", borderRadius: 10, padding: "0.75rem 1.25rem", cursor: "pointer" }}>
                    Batal
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RECENT CHECK-INS ── */}
        {recentCheckins.length > 0 && (
          <div style={s.card}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#60a5fa", marginBottom: "1rem" }}>
              🕐 Check-in Terbaru (sesi ini)
            </div>
            {recentCheckins.map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>{r.type === "jobseeker" ? "🎓" : "🏢"}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>{r.name}</div>
                    <div style={{ fontSize: "0.7rem", color: "#475569", fontFamily: "monospace" }}>{r.id}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "0.82rem", color: "#14b8a6", fontWeight: 700 }}>{r.time}</div>
                  <div style={{ fontSize: "0.7rem", color: "#475569" }}>Hari {r.day}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
