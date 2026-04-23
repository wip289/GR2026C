import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [scrollY, setScrollY] = useState(0);
  const employerRef = useRef<HTMLDivElement>(null);
  const jobseekerRef = useRef<HTMLDivElement>(null);
  const sponsorRef = useRef<HTMLDivElement>(null);
  const [activeStory, setActiveStory] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-rotate story
  useEffect(() => {
    const t = setInterval(() => setActiveStory(s => (s + 1) % 3), 4000);
    return () => clearInterval(t);
  }, []);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  const stories = [
    {
      icon: "🎓",
      role: "Jobseeker",
      color: "#D4A017",
      quote: "Ini momen besar. Banyak peluang kerja terkumpul di satu tempat — dan saya siap.",
      sub: "Memulai perjalanan",
    },
    {
      icon: "🏢",
      role: "Employer",
      color: "#14b8a6",
      quote: "Ini panggung rekrutmen yang serius. Bukan sekadar open recruitment kecil.",
      sub: "Membuka pintu",
    },
    {
      icon: "🌟",
      role: "Sponsor",
      color: "#818cf8",
      quote: "Ini flagship event rekrutmen. Dan saya berkomitmen memberi yang terbaik untuk ekosistem ini.",
      sub: "Menopang ekosistem",
    },
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#0a1628", minHeight: "100vh" }}>

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrollY > 50 ? "rgba(10,22,40,0.97)" : "transparent",
        backdropFilter: scrollY > 50 ? "blur(16px)" : "none",
        borderBottom: scrollY > 50 ? "1px solid rgba(20,184,166,0.15)" : "none",
        transition: "all 0.3s ease",
        padding: "0 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px"
      }}>
        <img src="/logo-gr2026.png" alt="GR2026" style={{ height: "40px", objectFit: "contain" }} />
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={() => scrollTo(employerRef)} style={navBtn}>Employer</button>
          <button onClick={() => scrollTo(jobseekerRef)} style={navBtn}>Jobseeker</button>
          <button onClick={() => scrollTo(sponsorRef)} style={{ ...navBtn, borderColor: "rgba(129,140,248,0.4)", color: "#818cf8" }}>Sponsor</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center",
        padding: "6rem 2rem 4rem",
        background: "radial-gradient(ellipse at 50% 0%, rgba(20,184,166,0.15) 0%, transparent 70%), radial-gradient(ellipse at 80% 80%, rgba(180,130,20,0.1) 0%, transparent 60%), #0a1628",
        position: "relative", overflow: "hidden"
      }}>
        {/* Grid pattern */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.05,
          backgroundImage: "linear-gradient(rgba(20,184,166,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />

        {/* Animated rings */}
        {[300, 500, 700].map((size, i) => (
          <div key={i} style={{
            position: "absolute", width: size, height: size,
            borderRadius: "50%", border: "1px solid rgba(20,184,166,0.1)",
            top: "50%", left: "50%",
            transform: `translate(-50%, -50%) translateY(${scrollY * (0.1 + i * 0.05)}px)`,
            transition: "transform 0.1s",
            animation: `pulse ${3 + i}s ease-in-out infinite alternate`
          }} />
        ))}

        <div style={{ position: "relative", zIndex: 1 }}>
          <img
            src="/logo-gr2026.png"
            alt="Grand Recruitment 2026"
            style={{
              width: "min(700px, 90vw)", marginBottom: "2rem",
              filter: "drop-shadow(0 0 40px rgba(20,184,166,0.4))",
              transform: `translateY(${-scrollY * 0.1}px)`,
              transition: "transform 0.1s"
            }}
          />

          <p style={{ color: "#94a3b8", fontSize: "1.1rem", marginBottom: "3rem", maxWidth: "560px", lineHeight: 1.7 }}>
            The International Tourism & Hospitality Grand Recruitment.<br />
            <span style={{ color: "#14b8a6" }}>June 8–9, 2026</span> · Gedung Dome NHI Bandung
          </p>

          {/* ── THREE CIRCLES STORYTELLING ── */}
          <div style={{ marginBottom: "3.5rem", maxWidth: 780, margin: "0 auto 3.5rem" }}>
            {/* Three orbs connected */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0", marginBottom: "2.5rem" }}>
              {stories.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  <div
                    onClick={() => setActiveStory(i)}
                    style={{
                      width: activeStory === i ? 110 : 76,
                      height: activeStory === i ? 110 : 76,
                      borderRadius: "50%",
                      border: `2px solid ${activeStory === i ? s.color : "rgba(255,255,255,0.12)"}`,
                      background: activeStory === i
                        ? `radial-gradient(circle at 35% 35%, ${s.color}50, ${s.color}15)`
                        : "rgba(255,255,255,0.04)",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      cursor: "pointer",
                      transition: "width 0.45s cubic-bezier(0.34,1.56,0.64,1), height 0.45s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease, border-color 0.4s ease, background 0.4s ease",
                      boxShadow: activeStory === i ? `0 0 40px ${s.color}50, 0 0 80px ${s.color}20` : "none",
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ fontSize: activeStory === i ? "2.4rem" : "1.6rem", transition: "font-size 0.4s ease", lineHeight: 1 }}>{s.icon}</div>
                    <div style={{ fontSize: "0.6rem", color: activeStory === i ? s.color : "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4, transition: "color 0.3s" }}>{s.role}</div>
                  </div>
                  {i < stories.length - 1 && (
                    <div style={{
                      width: 56, height: 2, flexShrink: 0,
                      background: `linear-gradient(90deg, ${stories[i].color}50, ${stories[i + 1].color}50)`,
                      position: "relative"
                    }}>
                      <div style={{
                        position: "absolute", top: "50%", left: "50%",
                        transform: "translate(-50%,-50%)",
                        width: 7, height: 7, borderRadius: "50%",
                        background: "#14b8a6",
                        boxShadow: "0 0 10px #14b8a6",
                        animation: "pulse 2s infinite"
                      }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Story slider — slides left/right */}
            <div style={{ overflow: "hidden", borderRadius: 20, position: "relative" }}>
              <div style={{
                display: "flex",
                transform: `translateX(-${activeStory * 100}%)`,
                transition: "transform 0.55s cubic-bezier(0.77,0,0.18,1)",
              }}>
                {stories.map((s, i) => (
                  <div key={i} style={{
                    minWidth: "100%",
                    background: `linear-gradient(135deg, ${s.color}10, ${s.color}04)`,
                    border: `1px solid ${s.color}30`,
                    borderRadius: 20,
                    padding: "2rem 2.5rem",
                    textAlign: "left",
                    boxSizing: "border-box",
                  }}>
                    <div style={{ fontSize: "0.7rem", color: s.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "0.75rem" }}>
                      {s.sub}
                    </div>
                    <p style={{ color: "#e2e8f0", fontSize: "1.05rem", lineHeight: 1.8, margin: 0, fontStyle: "italic" }}>
                      "{s.quote}"
                    </p>
                    <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ width: 28, height: 2, background: s.color, borderRadius: 1 }} />
                      <span style={{ fontSize: "0.75rem", color: s.color, fontWeight: 600 }}>{s.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dot indicators */}
            <div style={{ display: "flex", justifyContent: "center", gap: "0.6rem", marginTop: "1.25rem" }}>
              {stories.map((s, i) => (
                <div key={i} onClick={() => setActiveStory(i)} style={{
                  width: i === activeStory ? 28 : 7, height: 7, borderRadius: 4,
                  background: i === activeStory ? stories[i].color : "rgba(255,255,255,0.15)",
                  cursor: "pointer",
                  transition: "width 0.35s cubic-bezier(0.34,1.56,0.64,1), background 0.3s ease",
                  boxShadow: i === activeStory ? `0 0 8px ${stories[i].color}80` : "none"
                }} />
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", padding: "0 1rem" }}>
            <button onClick={() => scrollTo(employerRef)} style={heroBtnPrimary}>
              Daftar sebagai Employer
            </button>
            <button onClick={() => scrollTo(jobseekerRef)} style={{ ...heroBtnPrimary, background: "linear-gradient(135deg, #D4A017, #B8860B)", boxShadow: "0 0 30px rgba(212,160,23,0.4)" }}>
              Daftar sebagai Jobseeker
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: "3rem", marginTop: "4rem", justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { num: "50+", label: "Perusahaan" },
              { num: "3,000+", label: "Jobseeker" },
              { num: "2 Hari", label: "Pelaksanaan" },
              { num: "38+", label: "Booth" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#D4A017", letterSpacing: "-0.02em" }}>{s.num}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: "2rem", left: "50%", transform: "translateX(-50%)", animation: "bounce 2s infinite" }}>
          <div style={{ width: 24, height: 40, border: "2px solid rgba(20,184,166,0.4)", borderRadius: 12, display: "flex", justifyContent: "center", paddingTop: 6 }}>
            <div style={{ width: 4, height: 8, background: "#14b8a6", borderRadius: 2, animation: "scrollDot 2s infinite" }} />
          </div>
        </div>
      </section>

      {/* ── EMPLOYER SECTION ── */}
      <div ref={employerRef} />
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        padding: "clamp(3rem, 8vw, 6rem) clamp(1rem, 4vw, 2rem)",
        background: "linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1628 100%)",
        position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", right: "-200px", top: "50%", transform: "translateY(-50%)",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)"
        }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", minWidth: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))", gap: "3rem", alignItems: "center" }}>
          {/* Left */}
          <div>
            <div style={{ ...sectionBadge, background: "rgba(20,184,166,0.1)", color: "#14b8a6", borderColor: "rgba(20,184,166,0.3)" }}>
              Untuk Perusahaan
            </div>
            {/* Storytelling employer */}
            <p style={{ fontSize: "0.85rem", color: "#475569", fontStyle: "italic", margin: "0.75rem 0 0.25rem", lineHeight: 1.6 }}>
              "Dulu saya berdiri di sisi sana, mencari peluang. Sekarang giliran saya membuka pintu untuk mereka."
            </p>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 800, color: "#f1f5f9", lineHeight: 1.1, margin: "1rem 0 1.5rem" }}>
              Panggung Rekrutmen<br />
              <span style={{ color: "#14b8a6" }}>yang Serius & Terlihat</span>
            </h2>
            <p style={{ color: "#94a3b8", lineHeight: 1.8, marginBottom: "2rem", fontSize: "1.05rem" }}>
              Akses langsung ke {">"}3,000 jobseeker berkualitas dari bidang hospitality, tourism, MICE, kuliner, dan manajemen perhotelan. Booth tersedia terbatas — pilih posisi strategis Anda sekarang.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
              {[
                { icon: "🏢", title: "Main Booth", desc: "5×5m — area premium", price: "Rp 10jt" },
                { icon: "📦", title: "Standard Booth", desc: "3×3m — area strategis", price: "Rp 7.5jt" },
              ].map(b => (
                <div key={b.title} style={{
                  background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.2)",
                  borderRadius: 12, padding: "1.25rem"
                }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{b.icon}</div>
                  <div style={{ fontWeight: 700, color: "#f1f5f9", marginBottom: "0.25rem" }}>{b.title}</div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" }}>{b.desc}</div>
                  <div style={{ fontWeight: 700, color: "#D4A017", fontSize: "1.1rem" }}>{b.price}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <button onClick={() => navigate("/employer/register")} style={heroBtnPrimary}>
                Daftar Booth Sekarang
              </button>
              <button onClick={() => navigate("/employer/booth-map")} style={heroBtnSecondary}>
                Lihat Denah Booth
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1rem" }}>
              <span style={{ fontSize: "0.85rem", color: "#475569" }}>Sudah punya Booking ID?</span>
              <button onClick={() => navigate("/employer/login")}
                style={{ background: "transparent", border: "1px solid rgba(20,184,166,0.4)", color: "#14b8a6", borderRadius: 8, padding: "0.5rem 1.25rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                Login Employer →
              </button>
            </div>
          </div>

          {/* Right — mini booth map preview */}
          <div style={{ position: "relative" }}>
            <div style={{
              background: "rgba(20,184,166,0.03)", border: "1px solid rgba(20,184,166,0.15)",
              borderRadius: 16, padding: "2rem", textAlign: "center"
            }}>
              <div style={{ fontSize: "0.75rem", color: "#14b8a6", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1rem" }}>
                Preview Denah Event
              </div>
              <svg viewBox="0 0 300 380" style={{ width: "100%", maxWidth: 300, margin: "0 auto", display: "block" }}>
                <rect x="60" y="10" width="180" height="30" rx="4" fill="#D4A017" opacity="0.8"/>
                <text x="150" y="30" textAnchor="middle" fill="#0a1628" fontSize="11" fontWeight="700">STAGE</text>
                <rect x="10" y="50" width="55" height="25" rx="3" fill="#1e3a5f" stroke="#14b8a6" strokeWidth="0.5"/>
                <text x="37" y="67" textAnchor="middle" fill="#14b8a6" fontSize="8">LOUNGE</text>
                {[
                  [10,85],[75,85],[100,85],[175,85],[200,85],[245,85],[265,85],
                  [10,110],[75,110],[100,110],[175,110],[200,110],[245,110],[265,110],
                  [10,140],[75,140],[100,140],[175,140],[200,140],[245,140],
                  [10,165],[75,165],[100,165],[175,165],[200,165],[245,165],
                  [10,195],[75,195],[100,195],[175,195],[200,195],[245,195],
                  [10,220],[75,220],[100,220],[175,220],[200,220],[245,220],
                ].map(([x, y], i) => (
                  <rect key={i} x={x} y={y} width="22" height="22" rx="2"
                    fill={i < 5 ? "#ef4444" : i < 15 ? "#f97316" : "#14b8a6"}
                    opacity="0.85" stroke="#0a1628" strokeWidth="0.5"/>
                ))}
                {[[75,255],[135,255],[185,255],[245,255],[75,295],[135,295],[185,295],[245,295],[75,335],[135,335],[185,335],[245,335]].map(([x,y],i) => (
                  <rect key={i} x={x} y={y} width="45" height="38" rx="3"
                    fill={i < 2 ? "#ef4444" : i < 5 ? "#f97316" : "#14b8a6"}
                    opacity="0.85" stroke="#0a1628" strokeWidth="0.5"/>
                ))}
                {[255,278,301,324,347].map((y,i) => (
                  <rect key={i} x="5" y={y} width="18" height="18" rx="2" fill="#3b82f6" opacity="0.7" stroke="#0a1628" strokeWidth="0.5"/>
                ))}
                <rect x="100" y="370" width="100" height="8" rx="2" fill="#D4A017" opacity="0.6"/>
                <text x="150" y="368" textAnchor="middle" fill="#D4A017" fontSize="9">ENTRANCE</text>
              </svg>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1rem", flexWrap: "wrap" }}>
                {[
                  { color: "#14b8a6", label: "Tersedia" },
                  { color: "#f97316", label: "Reserved" },
                  { color: "#ef4444", label: "Booked" },
                ].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#94a3b8" }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: "1.5rem", padding: "0.75rem 1rem",
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8, fontSize: "0.85rem", color: "#fca5a5"
              }}>
                🔴 <strong>12 booth</strong> sudah dipesan · <strong>26 tersisa</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── JOBSEEKER SECTION ── */}
      <div ref={jobseekerRef} />
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        padding: "clamp(3rem, 8vw, 6rem) clamp(1rem, 4vw, 2rem)",
        background: "linear-gradient(135deg, #081220 0%, #0a1628 50%, #0d1f35 100%)",
        position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", left: "-200px", top: "50%", transform: "translateY(-50%)",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,160,23,0.06) 0%, transparent 70%)"
        }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", minWidth: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))", gap: "3rem", alignItems: "center" }}>
          {/* Left — gamification preview */}
          <div style={{
            background: "rgba(212,160,23,0.03)", border: "1px solid rgba(212,160,23,0.15)",
            borderRadius: 20, padding: "2.5rem"
          }}>
            <div style={{ fontSize: "0.75rem", color: "#D4A017", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1.5rem" }}>
              ⚔️ Sistem Level Jobseeker
            </div>

            {/* Level progression preview */}
            {[
              { level: 1, name: "Pejuang Baru", icon: "🌱", desc: "Data diri & kontak", done: true, xp: 100 },
              { level: 2, name: "Petualang", icon: "🎓", desc: "Latar belakang & jurusan", done: true, xp: 200 },
              { level: 3, name: "Pejuang Sejati", icon: "📄", desc: "Upload CV & foto", done: false, xp: 350 },
              { level: 4, name: "Penantang", icon: "🔒", desc: "Pilih consent data", done: false, xp: 450 },
              { level: 5, name: "✨ Siap Interview", icon: "🏆", desc: "Profil lengkap & terverifikasi", done: false, xp: 500 },
            ].map((lv, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.85rem",
                opacity: lv.done ? 1 : lv.level === 3 ? 0.9 : 0.45,
              }}>
                {/* Icon circle */}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  background: lv.done ? "rgba(212,160,23,0.2)" : lv.level === 3 ? "rgba(20,184,166,0.15)" : "rgba(255,255,255,0.04)",
                  border: `2px solid ${lv.done ? "#D4A017" : lv.level === 3 ? "#14b8a6" : "rgba(255,255,255,0.08)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.1rem"
                }}>
                  {lv.done ? "✓" : lv.icon}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.85rem", color: lv.done ? "#D4A017" : lv.level === 3 ? "#14b8a6" : "#475569" }}>
                      Lv.{lv.level} {lv.name}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#334155" }}>+{lv.xp} XP</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.15rem" }}>{lv.desc}</div>
                  {/* Progress bar */}
                  <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: "0.35rem" }}>
                    <div style={{
                      height: "100%", borderRadius: 2,
                      width: lv.done ? "100%" : lv.level === 3 ? "30%" : "0%",
                      background: lv.done ? "#D4A017" : "#14b8a6",
                      transition: "width 0.5s ease"
                    }} />
                  </div>
                </div>
              </div>
            ))}

            <div style={{
              marginTop: "1.5rem", padding: "1rem",
              background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)",
              borderRadius: 10, textAlign: "center"
            }}>
              <div style={{ fontSize: "0.75rem", color: "#14b8a6", fontWeight: 700, marginBottom: "0.25rem" }}>
                Level up = rasa percaya diri naik 🚀
              </div>
              <div style={{ fontSize: "0.72rem", color: "#334155" }}>Profil lengkap terlihat lebih menarik di mata employer</div>
            </div>
          </div>

          {/* Right */}
          <div>
            <div style={{ ...sectionBadge, background: "rgba(212,160,23,0.1)", color: "#D4A017", borderColor: "rgba(212,160,23,0.3)" }}>
              Untuk Jobseeker
            </div>
            {/* Storytelling jobseeker */}
            <p style={{ fontSize: "0.85rem", color: "#475569", fontStyle: "italic", margin: "0.75rem 0 0.25rem", lineHeight: 1.6 }}>
              "Semua orang memulai dari sini. Ini bukan akhir perjalanan — ini awal dari segalanya."
            </p>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 800, color: "#f1f5f9", lineHeight: 1.1, margin: "1rem 0 1.5rem" }}>
              Ini Momen Besarmu.<br />
              <span style={{ color: "#D4A017" }}>Ambil Peluangnya.</span>
            </h2>
            <p style={{ color: "#94a3b8", lineHeight: 1.8, marginBottom: "2rem", fontSize: "1.05rem" }}>
              Daftar <strong style={{ color: "#f1f5f9" }}>gratis</strong> dalam 4 langkah mudah. Setiap langkah menaikkan <strong style={{ color: "#D4A017" }}>level kepercayaan dirimu</strong> — dan membuat profilmu makin kuat di mata employer.
            </p>

            {/* Quick steps */}
            <div style={{ display: "grid", gap: "0.75rem", marginBottom: "2rem" }}>
              {[
                { step: "01", text: "Isi data diri (2 menit)" },
                { step: "02", text: "Tambah latar belakang pendidikan" },
                { step: "03", text: "Upload foto & CV" },
                { step: "04", text: "Pilih consent & selesai 🎉" },
              ].map(s => (
                <div key={s.step} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.7rem", fontWeight: 800, color: "#D4A017"
                  }}>{s.step}</div>
                  <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>{s.text}</span>
                </div>
              ))}
            </div>

            <button onClick={() => navigate("/jobseeker/register")} style={{ ...heroBtnPrimary, background: "linear-gradient(135deg, #D4A017, #B8860B)", boxShadow: "0 0 30px rgba(212,160,23,0.3)" }}>
              Mulai Perjalananmu →
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1rem" }}>
              <span style={{ fontSize: "0.85rem", color: "#475569" }}>Sudah punya Registration ID?</span>
              <button onClick={() => navigate("/jobseeker/login")}
                style={{ background: "transparent", border: "1px solid rgba(212,160,23,0.4)", color: "#D4A017", borderRadius: 8, padding: "0.5rem 1.25rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                Login →
              </button>
            </div>

            <p style={{ color: "#475569", fontSize: "0.75rem", marginTop: "0.75rem" }}>
              Pendaftaran gratis · Data dilindungi UU PDP · Dapat ditarik kapan saja
            </p>
          </div>
        </div>
      </section>

      {/* ── SPONSOR / KAMPUS SECTION ── */}
      <div ref={sponsorRef} />
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        padding: "clamp(3rem, 8vw, 6rem) clamp(1rem, 4vw, 2rem)",
        background: "linear-gradient(135deg, #080f1f 0%, #0c1535 50%, #080f1f 100%)",
        position: "relative", overflow: "hidden"
      }}>
        {/* Radial glow */}
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(129,140,248,0.07) 0%, transparent 70%)",
          pointerEvents: "none"
        }} />
        {/* Subtle star pattern */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.03,
          backgroundImage: "radial-gradient(circle, #818cf8 1px, transparent 1px)",
          backgroundSize: "50px 50px"
        }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,480px),1fr))", gap: "4rem", alignItems: "center" }}>
            {/* Left */}
            <div>
              <div style={{ ...sectionBadge, background: "rgba(129,140,248,0.1)", color: "#818cf8", borderColor: "rgba(129,140,248,0.3)" }}>
                Untuk Sponsor & Kampus
              </div>
              {/* Storytelling sponsor */}
              <p style={{ fontSize: "0.85rem", color: "#475569", fontStyle: "italic", margin: "0.75rem 0 0.25rem", lineHeight: 1.6 }}>
                "Saya melihat jobseeker datang dan employer membuka pintu — dan saya berjanji: saya akan memastikan ekosistem ini terus berkembang."
              </p>
              <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 800, color: "#f1f5f9", lineHeight: 1.1, margin: "1rem 0 1.5rem" }}>
                Flagship Event<br />
                <span style={{ color: "#818cf8" }}>Rekrutmen Pariwisata</span><br />
                <span style={{ fontSize: "clamp(1.2rem, 2.5vw, 2rem)", color: "#94a3b8" }}>Indonesia</span>
              </h2>
              <p style={{ color: "#94a3b8", lineHeight: 1.8, marginBottom: "2.5rem", fontSize: "1.05rem" }}>
                Bukan event kecil harian. GR2026 adalah <strong style={{ color: "#f1f5f9" }}>Grand Recruitment tahunan</strong> yang mempertemukan ribuan talenta terbaik hospitality & tourism dengan industri. Jadikan nama Anda bagian dari sejarah event ini.
              </p>

              {/* Sponsor tiers */}
              <div style={{ display: "grid", gap: "1rem", marginBottom: "2.5rem" }}>
                {[
                  { tier: "🥇 Gold Sponsor", color: "#D4A017", perks: ["Logo di semua materi promosi", "Booth eksklusif area premium", "Speaking slot di opening ceremony", "Database jobseeker"] },
                  { tier: "🥈 Silver Sponsor", color: "#94a3b8", perks: ["Logo di banner & backdrop", "Booth area strategis", "Mention di semua media sosial"] },
                  { tier: "🥉 Bronze / Media Partner", color: "#c2773a", perks: ["Logo di digital materials", "Branding di venue", "Laporan pasca event"] },
                ].map((t, i) => (
                  <div key={i} style={{
                    background: `rgba(255,255,255,0.02)`, border: `1px solid ${t.color}30`,
                    borderRadius: 12, padding: "1.25rem",
                    borderLeft: `3px solid ${t.color}`
                  }}>
                    <div style={{ fontWeight: 700, color: t.color, marginBottom: "0.6rem", fontSize: "0.9rem" }}>{t.tier}</div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {t.perks.map(p => (
                        <span key={p} style={{ fontSize: "0.75rem", color: "#64748b", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "0.2rem 0.6rem" }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <button
                  onClick={() => window.location.href = "mailto:sponsorship@gr2026.id"}
                  style={{ ...heroBtnPrimary, background: "linear-gradient(135deg, #6366f1, #818cf8)", boxShadow: "0 0 30px rgba(129,140,248,0.3)" }}>
                  Hubungi Tim Sponsorship
                </button>
                <button onClick={() => navigate("/employer/register")} style={heroBtnSecondary}>
                  Download Proposal
                </button>
              </div>
            </div>

            {/* Right — impact numbers */}
            <div>
              <div style={{
                background: "rgba(129,140,248,0.04)", border: "1px solid rgba(129,140,248,0.15)",
                borderRadius: 20, padding: "2.5rem"
              }}>
                <div style={{ fontSize: "0.75rem", color: "#818cf8", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "2rem" }}>
                  Dampak yang Anda Dukung
                </div>

                {[
                  { num: "3,000+", label: "Jobseeker yang hadir", icon: "🎓" },
                  { num: "50+", label: "Perusahaan rekrutmen aktif", icon: "🏢" },
                  { num: "2 Hari", label: "Event intensif full coverage", icon: "📅" },
                  { num: "60+", label: "Tahun alumni NHI Bandung", icon: "🌟" },
                  { num: "10K+", label: "Reach media sosial & digital", icon: "📱" },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "1.25rem",
                    padding: "1rem 0",
                    borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.05)" : "none"
                  }}>
                    <div style={{ fontSize: "1.75rem", flexShrink: 0 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#818cf8", lineHeight: 1 }}>{item.num}</div>
                      <div style={{ fontSize: "0.82rem", color: "#475569", marginTop: "0.2rem" }}>{item.label}</div>
                    </div>
                  </div>
                ))}

                <div style={{
                  marginTop: "1.5rem", padding: "1rem",
                  background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.2)",
                  borderRadius: 10, fontSize: "0.82rem", color: "#a5b4fc", lineHeight: 1.7
                }}>
                  🎯 Slot sponsorship terbatas. Hubungi panitia sebelum <strong>1 Mei 2026</strong> untuk early bird pricing.
                </div>
              </div>

              {/* Kampus callout */}
              <div style={{
                marginTop: "1.5rem",
                background: "rgba(20,184,166,0.04)", border: "1px solid rgba(20,184,166,0.15)",
                borderRadius: 16, padding: "1.5rem"
              }}>
                <div style={{ fontWeight: 700, color: "#14b8a6", marginBottom: "0.5rem" }}>🏫 Untuk Institusi Pendidikan</div>
                <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.7, margin: "0 0 1rem" }}>
                  Kirimkan mahasiswa & alumni Anda. Jadikan GR2026 sebagai jembatan antara kampus dan industri pariwisata nyata.
                </p>
                <button
                  onClick={() => window.location.href = "mailto:kampus@gr2026.id"}
                  style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.3)", color: "#14b8a6", borderRadius: 8, padding: "0.6rem 1.25rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                  Kerjasama Kampus →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: "#050d1a", borderTop: "1px solid rgba(20,184,166,0.1)",
        padding: "3rem 2rem", textAlign: "center"
      }}>
        <img src="/logo-gr2026.png" alt="GR2026" style={{ height: "36px", marginBottom: "1.5rem", opacity: 0.8 }} />
        <p style={{ color: "#334155", fontSize: "0.85rem" }}>
          The International Tourism & Hospitality Grand Recruitment 2026<br />
          Politeknik Pariwisata NHI Bandung · Gedung Dome · June 8–9, 2026
        </p>
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "2rem", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/employer/register" style={{ color: "#14b8a6", fontSize: "0.85rem", textDecoration: "none" }}>Daftar Employer</a>
          <a href="/jobseeker/register" style={{ color: "#D4A017", fontSize: "0.85rem", textDecoration: "none" }}>Daftar Jobseeker</a>
          <a href="#sponsor" style={{ color: "#818cf8", fontSize: "0.85rem", textDecoration: "none" }}>Sponsorship</a>
          <a href="/boss" style={{ color: "#1e3a5f", fontSize: "0.85rem", textDecoration: "none" }}>Panitia</a>
        </div>
        <p style={{ color: "#1e3a5f", fontSize: "0.75rem", marginTop: "1.5rem" }}>
          Data dilindungi UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi
        </p>
      </footer>

      <style>{`
        @media (max-width: 640px) { h2 { word-break: break-word; } }
        @keyframes pulse { from { opacity: 0.3; transform: translate(-50%,-50%) scale(0.98); } to { opacity: 0.8; transform: translate(-50%,-50%) scale(1.02); } }
        @keyframes bounce { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(8px); } }
        @keyframes scrollDot { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(12px); } }
        * { box-sizing: border-box; }
        button:hover { opacity: 0.9; transform: translateY(-1px); }
        button { transition: all 0.2s ease; }
      `}</style>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  background: "transparent", border: "1px solid rgba(20,184,166,0.3)",
  color: "#94a3b8", borderRadius: 8, padding: "0.4rem 1rem",
  fontSize: "0.85rem", cursor: "pointer"
};

const heroBtnPrimary: React.CSSProperties = {
  background: "linear-gradient(135deg, #0d9488, #14b8a6)",
  border: "none", color: "#fff", borderRadius: 10,
  padding: "0.85rem 2rem", fontSize: "1rem", fontWeight: 700,
  cursor: "pointer", boxShadow: "0 0 30px rgba(20,184,166,0.4)"
};

const heroBtnSecondary: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(20,184,166,0.4)",
  color: "#14b8a6", borderRadius: 10,
  padding: "0.85rem 2rem", fontSize: "1rem", fontWeight: 600,
  cursor: "pointer"
};

const sectionBadge: React.CSSProperties = {
  display: "inline-block", fontSize: "0.75rem", fontWeight: 600,
  letterSpacing: "0.1em", textTransform: "uppercase",
  padding: "0.35rem 1rem", borderRadius: 20,
  border: "1px solid", marginBottom: "0.5rem"
};
