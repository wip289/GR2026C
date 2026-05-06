import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import BoothMapPicker from "@/components/BoothMapPicker";

// ── Bilingual content ─────────────────────────────────────────
const content = {
  id: {
    navJourney: "Perjalanan",
    navBooth: "Denah Booth",
    navBond: "Ikatan",
    navJoin: "Bergabung",
    badgeText: "10 – 11 Juni 2026 · Dome NHI Bandung",
    heroTitle: "Di Sinilah Mimpi Bertemu Peluang",
    heroSub: "Grand Recruitment 2026 adalah ruang di mana pejuang karier, pembuka pintu, dan penopang ekosistem bertemu — dan saling menggerakkan.",
    ctaPrimary: "Daftar sebagai Jobseeker",
    ctaSecondary: "Buka Booth Employer",
    journeyTitle: "Satu Perjalanan, Tiga Sudut Pandang",
    journeySub: "Mereka datang dengan peran berbeda, namun terhubung oleh satu hal yang sangat manusiawi: masing-masing pernah harus memulai dari suatu titik.",
    // Jobseeker
    jobLabel: "Si Pemimpi",
    jobRole: "Jobseeker",
    jobHeadline: "Aku datang mencari peluang, tapi pulang membawa keyakinan yang lebih besar.",
    jobBody: "Bagi aku, ini bukan sekadar soal menyerahkan CV. Ini tentang datang dengan harapan, bertemu orang-orang yang pernah berdiri di titik yang sama, dan mulai percaya bahwa masa depan benar-benar bisa aku raih. Di sini, langkah pertama terasa lebih dekat, lebih nyata, dan lebih menyambut.",
    jobPoint1: "Datang dengan harapan, keberanian, dan mimpi yang masih terbentuk.",
    jobPoint2: "Melihat employer bukan hanya sebagai perekrut, tapi sebagai gambaran masa depan.",
    jobPoint3: "Pulang dengan motivasi baru: suatu hari, aku ingin membuka pintu bagi orang lain.",
    // Employer
    employerLabel: "Si Pencapaian",
    employerRole: "Employer",
    employerHeadline: "Kami datang untuk merekrut, tapi juga untuk mengingat dari mana semuanya dimulai.",
    employerBody: "Bagi kami, ini lebih dari sekadar proses rekrutmen. Ini kesempatan untuk bertemu generasi baru yang sedang mempersiapkan langkah berikutnya. Saat kami melihat jobseeker datang dengan semangat, ambisi, dan harapan, kami sering melihat bayangan diri kami sendiri di awal perjalanan. Itulah mengapa rekrutmen menjadi lebih dari sekadar proses bisnis — ia menjadi cara bermakna untuk memberi ruang bagi pertumbuhan.",
    employerPoint1: "Melihat potensi, bukan hanya pengalaman di atas kertas.",
    employerPoint2: "Membangun tim dengan empati, kualitas, dan visi jangka panjang.",
    employerPoint3: "Menjadi kehadiran profesional yang dulu kami sendiri pernah butuhkan.",
    // Sponsor
    sponsorLabel: "Si Pemberi",
    sponsorRole: "Sponsor",
    sponsorHeadline: "Saya datang untuk mendukung, karena kemajuan yang bermakna harus dirasakan bersama.",
    sponsorBody: "Bagi saya, dukungan bukan hanya soal visibilitas atau kehadiran. Ini adalah pilihan untuk memperkuat ekosistem yang lebih sehat, lebih siap, dan lebih berdampak. Saat saya melihat jobseeker melangkah maju dan employer membuka pintu, satu keyakinan semakin jelas: kemajuan terbaik adalah yang ikut mengangkat orang lain.",
    sponsorPoint1: "Melihat potensi lasting dalam momen yang tampak sederhana namun sangat berarti.",
    sponsorPoint2: "Memperkuat koneksi antara talenta, industri, dan peluang masa depan.",
    sponsorPoint3: "Berinvestasi dalam pertumbuhan yang menciptakan nilai jauh melampaui satu event.",
    // Bond
    bondTitle: "Ikatan yang Terbentuk dari Awal yang Sama",
    bondSub: "Mereka datang dengan peran berbeda, namun terhubung oleh sesuatu yang sangat manusiawi: masing-masing pernah harus memulai dari suatu titik.",
    bondCard1Title: "Siklus Pertumbuhan",
    bondCard1Body: "Jobseeker hari ini bisa menjadi employer esok hari. Employer hari ini bisa menjadi sponsor dampak yang lebih luas. Perjalanan terus bergerak maju.",
    bondCard2Title: "Pemahaman Bersama",
    bondCard2Body: "Ketika orang-orang pernah berdiri di tempat yang serupa, empati, rasa hormat, dan hubungan profesional yang lebih hangat tumbuh secara alami.",
    bondCard3Title: "Dampak yang Berlanjut",
    bondCard3Body: "Setiap peluang yang dibuka hari ini bisa menjadi alasan seseorang bertumbuh — dan suatu hari membuka peluang yang sama bagi orang lain.",
    boothSectionTitle: "Denah Booth — Grand Recruitment 2026",
    boothSectionSub: "Lihat posisi booth yang tersedia, sudah dipesan, dan yang masih terbuka. Pilih booth terbaikmu sebelum kehabisan.",
    boothAvailable: "Tersedia",
    boothPending: "Proses Pembayaran",
    boothConfirmed: "Terisi",
    boothClosed: "Ditutup",
    boothCta: "Daftar & Pilih Booth →",
    // CTA
    ctaTitle: "Di mana posisimu dalam cerita ini hari ini?",
    ctaBody: "Apakah kamu sedang mencari peluang, membukanya, atau membantu peluang itu bertumbuh? Apapun peranmu, Grand Recruitment 2026 adalah ruang untuk bertemu, terhubung, dan bergerak maju bersama.",
    ctaBtn1: "Daftar sebagai Jobseeker",
    ctaBtn2: "Buka Booth Employer",
    ctaBtn3: "Jadi Sponsor",
    footerTagline: "Di sinilah mimpi bertemu peluang, dan peluang bertumbuh menjadi dampak.",
  },
  en: {
    navJourney: "The Journey",
    navBooth: "Booth Map",
    navBond: "The Bond",
    navJoin: "Join",
    badgeText: "June 10 – 11, 2026 · Dome NHI Bandung",
    heroTitle: "Where Dreams Meet Opportunity",
    heroSub: "Grand Recruitment 2026 is a space where career seekers, door openers, and ecosystem builders meet — and move each other forward.",
    ctaPrimary: "Register as Jobseeker",
    ctaSecondary: "Open Employer Booth",
    journeyTitle: "One Journey, Three Perspectives",
    journeySub: "They arrive with different roles, yet connected by something deeply human: each of them once had to start somewhere.",
    jobLabel: "The Dreamer",
    jobRole: "Jobseeker",
    jobHeadline: "I came looking for an opportunity, but I left with renewed belief.",
    jobBody: "For a jobseeker, this is not only about handing over a CV. It is about arriving with hope, meeting people who once stood at the very same starting point, and beginning to believe that the future is truly within reach. Here, the first step feels closer, more real, and more welcoming.",
    jobPoint1: "Arriving with hope, courage, and a dream still taking shape.",
    jobPoint2: "Seeing employers not only as recruiters, but as a picture of what the future could become.",
    jobPoint3: "Leaving with fresh motivation: one day, I want to open doors for others too.",
    employerLabel: "The Achiever",
    employerRole: "Employer",
    employerHeadline: "We came to recruit, but also to remember where it all began.",
    employerBody: "For employers, this is more than a hiring process. It is a chance to meet a new generation preparing for its next step. When employers see jobseekers arrive with nervous energy, ambition, and hope, they often see a reflection of their own beginning. That is why recruitment becomes more than a business process — it becomes a meaningful way to create room for growth.",
    employerPoint1: "Seeing potential, not only experience on paper.",
    employerPoint2: "Building teams with empathy, quality, and long-term vision.",
    employerPoint3: "Becoming the kind of professional presence they once needed themselves.",
    sponsorLabel: "The Giver",
    sponsorRole: "Sponsor",
    sponsorHeadline: "I came to support, because meaningful progress should be shared.",
    sponsorBody: "For sponsors, support is not only about visibility or presence. It is a choice to strengthen an ecosystem that is healthier, more prepared, and more impactful. When sponsors see jobseekers stepping forward and employers opening doors, one belief becomes clearer: the best kind of progress is the kind that lifts others too.",
    sponsorPoint1: "Seeing lasting potential in moments that may look simple, yet matter deeply.",
    sponsorPoint2: "Strengthening the connection between talent, industry, and future opportunity.",
    sponsorPoint3: "Investing in growth that creates value far beyond a single event.",
    bondTitle: "A Bond Shaped by Shared Beginnings",
    bondSub: "They arrive with different roles, yet connected by something deeply human: each of them once had to start somewhere.",
    bondCard1Title: "A Cycle of Growth",
    bondCard1Body: "Today's jobseeker can become tomorrow's employer. Today's employer can become tomorrow's sponsor of wider impact. The journey keeps moving forward.",
    bondCard2Title: "A Shared Understanding",
    bondCard2Body: "When people have once stood in similar places, empathy, respect, and warmer professional relationships naturally grow.",
    bondCard3Title: "Impact That Continues",
    bondCard3Body: "Every opportunity opened today can become the reason someone grows — and one day opens the same opportunity for others.",
    boothSectionTitle: "Booth Map — Grand Recruitment 2026",
    boothSectionSub: "See which booths are available, reserved, or already taken. Choose your spot before it's gone.",
    boothAvailable: "Available",
    boothPending: "Payment Pending",
    boothConfirmed: "Booked",
    boothClosed: "Closed",
    boothCta: "Register & Choose Booth →",
    ctaTitle: "Where do you stand in this story today?",
    ctaBody: "Are you seeking an opportunity, opening one, or helping that opportunity grow? Whatever your role may be, Grand Recruitment 2026 is a space to meet, connect, and move forward together.",
    ctaBtn1: "Register as Jobseeker",
    ctaBtn2: "Open Employer Booth",
    ctaBtn3: "Become a Sponsor",
    footerTagline: "Where dreams meet opportunity, and opportunity grows into impact.",
  },
};

type Lang = "id" | "en";

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [lang, setLang] = useState<Lang>("id");
  const [scrollY, setScrollY] = useState(0);
  const [activeOrb, setActiveOrb] = useState<number | null>(null);
  const [hoveredOrb, setHoveredOrb] = useState<number | null>(null);
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const journeyRef = useRef<HTMLDivElement>(null);
  const boothRef   = useRef<HTMLDivElement>(null);
  const bondRef    = useRef<HTMLDivElement>(null);
  const joinRef    = useRef<HTMLDivElement>(null);

  const t = content[lang];

  // Fetch event config for dynamic date
  const configQuery = trpc.event.getEventConfig.useQuery();
  const cfg = configQuery.data as any || {};
  const eventDate = cfg.eventDateDisplay || t.badgeText;
  const eventVenue = cfg.venueName || "Dome NHI Bandung";

  // Fetch booth data for map section
  const allBookingsQuery  = trpc.event.getAllEmployerBookings.useQuery();

  const bookedBoothMap = useMemo(() => {
    const map: Record<string, { company: string; status: string }> = {};
    for (const b of (allBookingsQuery.data as any[] | null) || []) {
      if (b.status === "rejected") continue;
      for (const booth of (b.booths as any[] || [])) {
        map[booth.id] = { company: b.companyName, status: b.status };
      }
    }
    return map;
  }, [allBookingsQuery.data]);


  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) =>
    ref.current?.scrollIntoView({ behavior: "smooth" });

  const orbs = [
    { icon: "🎓", role: t.jobRole,      color: "#D4A017", url: "/jobseeker/register", cta: t.ctaBtn1 },
    { icon: "🏢", role: t.employerRole, color: "#14b8a6", url: "/employer/register",  cta: t.ctaBtn2 },
    { icon: "🌟", role: t.sponsorRole,  color: "#818cf8", url: "/sponsor",            cta: t.ctaBtn3 },
  ];

  const steps = [
    {
      color: "#D4A017",
      label: t.jobLabel, role: t.jobRole, headline: t.jobHeadline, body: t.jobBody,
      points: [t.jobPoint1, t.jobPoint2, t.jobPoint3],
      url: "/jobseeker/register", cta: t.ctaBtn1,
    },
    {
      color: "#14b8a6",
      label: t.employerLabel, role: t.employerRole, headline: t.employerHeadline, body: t.employerBody,
      points: [t.employerPoint1, t.employerPoint2, t.employerPoint3],
      url: "/employer/register", cta: t.ctaBtn2,
    },
    {
      color: "#818cf8",
      label: t.sponsorLabel, role: t.sponsorRole, headline: t.sponsorHeadline, body: t.sponsorBody,
      points: [t.sponsorPoint1, t.sponsorPoint2, t.sponsorPoint3],
      url: "/sponsor", cta: t.ctaBtn3,
    },
  ];

  const bondCards = [
    { title: t.bondCard1Title, body: t.bondCard1Body, color: "#D4A017", icon: "🔄" },
    { title: t.bondCard2Title, body: t.bondCard2Body, color: "#14b8a6", icon: "🤝" },
    { title: t.bondCard3Title, body: t.bondCard3Body, color: "#818cf8", icon: "✨" },
  ];

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: "#0a1628", minHeight: "100vh", color: "#f1f5f9" }}>

      {/* ── NAV ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: scrollY > 50 ? "rgba(10,22,40,0.97)" : "transparent",
        backdropFilter: scrollY > 50 ? "blur(16px)" : "none",
        borderBottom: scrollY > 50 ? "1px solid rgba(20,184,166,0.15)" : "none",
        transition: "all 0.3s ease",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Left: logos */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <img src="/logo-gr2026.png" alt="GR2026" style={{ height: 36, objectFit: "contain" }} />
            <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.1)" }} />
            <img src="/logo-poltekpar.png" alt="Poltekpar NHI" style={{ height: 32, objectFit: "contain" }} />
            <img src="/logo-koperasi.png" alt="Koperasi NHI" style={{ height: 32, objectFit: "contain" }} />
          </div>
          {/* Right: nav + lang */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <nav style={{ display: "flex", gap: "0.4rem" }}>
              {[
                { label: t.navJourney, ref: journeyRef },
                { label: t.navBooth,   ref: boothRef },
                { label: t.navBond,    ref: bondRef },
                { label: t.navJoin,    ref: joinRef },
              ].map(n => (
                <button key={n.label} onClick={() => scrollTo(n.ref)}
                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: 99, padding: "0.35rem 0.85rem", fontSize: "0.8rem", cursor: "pointer" }}>
                  {n.label}
                </button>
              ))}
            </nav>
            {/* Login dropdown */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowLoginMenu(v => !v)}
                style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.3)", color: "#14b8a6", borderRadius: 99, padding: "0.35rem 0.85rem", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}>
                Masuk ▾
              </button>
              {showLoginMenu && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "rgba(10,22,40,0.98)", border: "1px solid rgba(20,184,166,0.25)", borderRadius: 10, padding: "0.4rem", minWidth: 170, zIndex: 200, backdropFilter: "blur(12px)" }}>
                  {[
                    { label: "🏢 Employer",    href: "/employer/login",  color: "#14b8a6" },
                    { label: "🎓 Jobseeker",   href: "/jobseeker/login", color: "#D4A017" },
                    { label: "🌟 Sponsorship", href: "/sponsor/login",   color: "#818cf8" },
                  ].map(item => (
                    <a key={item.label} href={item.href}
                      onClick={() => setShowLoginMenu(false)}
                      style={{ display: "block", padding: "0.55rem 0.9rem", borderRadius: 7, color: item.color, fontSize: "0.82rem", fontWeight: 600, textDecoration: "none", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = `${item.color}15`)}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      {item.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
            {/* Lang toggle */}
            <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 99, padding: "0.2rem" }}>
              {(["id","en"] as Lang[]).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  style={{ padding: "0.3rem 0.75rem", borderRadius: 99, border: "none", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s", background: lang === l ? "#14b8a6" : "transparent", color: lang === l ? "#fff" : "#64748b" }}>
                  {l === "id" ? "🇮🇩 ID" : "🇬🇧 EN"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "5rem 1.25rem 3rem", position: "relative", overflow: "hidden",
        background: "radial-gradient(ellipse at 50% 0%, rgba(20,184,166,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 90%, rgba(212,160,23,0.08) 0%, transparent 55%), #0a1628",
      }}>
        {/* Grid bg */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.035,
          backgroundImage: "linear-gradient(rgba(20,184,166,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(20,184,166,0.5) 1px,transparent 1px)",
          backgroundSize: "60px 60px" }} />
        {/* Rings */}
        {[300,520,740].map((sz,i)=>(
          <div key={i} style={{ position:"absolute", width:sz, height:sz, borderRadius:"50%",
            border:"1px solid rgba(20,184,166,0.07)", top:"50%", left:"50%",
            transform:"translate(-50%,-50%)", pointerEvents:"none",
            animation:`ringPulse ${3.5+i*1.5}s ease-in-out infinite alternate` }} />
        ))}

        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 860 }}>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.55rem 1.25rem",
            borderRadius: 99, background: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.3)",
            color: "#D4A017", fontSize: "clamp(0.85rem, 2.5vw, 1rem)", fontWeight: 700, letterSpacing: "0.04em", marginBottom: "1.5rem",
            textAlign: "center" as const }}>
            📅 {eventDate}
          </div>

          {/* Banner GR2026 */}
          <img src="/logo-gr2026-banner.png" alt="Grand Recruitment 2026"
            style={{ width: "min(700px, 90vw)", display: "block", margin: "0 auto 1.25rem",
              filter: "drop-shadow(0 0 40px rgba(20,184,166,0.3))" }} />

          <p style={{ color: "#94a3b8", fontSize: "clamp(1rem,2vw,1.2rem)", lineHeight: 1.75, maxWidth: 580, margin: "0 auto 2.5rem" }}>
            {t.heroSub}
          </p>

          {/* ── THREE ORBS ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0", marginBottom: "2.5rem" }}>
            {orbs.map((orb, i) => {
              const isHov = hoveredOrb === i;
              const isAct = activeOrb === i;
              const lit = isHov || isAct;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  {/* Fixed wrapper 140×140 prevents layout shift */}
                  <div style={{ width: "clamp(90px, 28vw, 140px)", height: "clamp(90px, 28vw, 140px)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                    onMouseEnter={() => setHoveredOrb(i)} onMouseLeave={() => setHoveredOrb(null)}>
                    {/* Backlight */}
                    <div style={{
                      position: "absolute", borderRadius: "50%", pointerEvents: "none", zIndex: 0,
                      width: lit ? 180 : 80, height: lit ? 180 : 80,
                      background: `radial-gradient(circle, ${orb.color}${lit?"40":"0c"} 0%, transparent 70%)`,
                      transition: "all 0.5s ease",
                    }} />
                    {/* Orb button */}
                    <button onClick={() => { setActiveOrb(i); navigate(orb.url); }}
                      style={{
                        position: "relative", zIndex: 1,
                        width: isAct ? "min(116px,26vw)" : isHov ? "min(100px,23vw)" : "min(80px,20vw)",
                        height: isAct ? "min(116px,26vw)" : isHov ? "min(100px,23vw)" : "min(80px,20vw)",
                        borderRadius: "50%",
                        border: `2px solid ${lit ? orb.color : "rgba(255,255,255,0.1)"}`,
                        background: lit ? `radial-gradient(circle at 35% 35%, ${orb.color}55, ${orb.color}18)` : "rgba(255,255,255,0.04)",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", outline: "none",
                        transition: "width 0.4s cubic-bezier(0.34,1.56,0.64,1), height 0.4s cubic-bezier(0.34,1.56,0.64,1), all 0.3s ease",
                        boxShadow: isAct ? `0 0 32px ${orb.color}55, 0 0 64px ${orb.color}20` : isHov ? `0 0 20px ${orb.color}35` : "none",
                      }}>
                      <span style={{ fontSize: isAct ? "clamp(1.4rem,5vw,2.1rem)" : "clamp(1rem,3.5vw,1.4rem)", lineHeight: 1, transition: "font-size 0.35s ease" }}>{orb.icon}</span>
                      <span style={{ fontSize: "clamp(0.55rem,1.8vw,0.7rem)", color: lit ? orb.color : "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4, transition: "color 0.3s" }}>{orb.role}</span>
                    </button>
                    {/* CTA tooltip */}
                    <div style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", fontSize: "0.6rem", color: orb.color, fontWeight: 700, whiteSpace: "nowrap",
                      background: `${orb.color}18`, border: `1px solid ${orb.color}35`, borderRadius: 20, padding: "0.12rem 0.6rem",
                      opacity: isHov ? 1 : 0, transition: "opacity 0.25s", pointerEvents: "none", zIndex: 2 }}>
                      {orb.cta} →
                    </div>
                  </div>
                  {i < 2 && (
                    <div style={{ width: "clamp(16px,4vw,44px)", height: 2, flexShrink: 0,
                      background: `linear-gradient(90deg, ${orbs[i].color}45, ${orbs[i+1].color}45)`, position: "relative" }}>
                      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 5, height: 5, borderRadius: "50%", background: "#14b8a6", boxShadow: "0 0 7px #14b8a6", animation: "dotPulse 2s ease-in-out infinite" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "3rem" }}>
            <button onClick={() => navigate("/jobseeker/register")}
              style={{ background: "linear-gradient(135deg,#D4A017,#B8860B)", border: "none", color: "#fff", borderRadius: 99, padding: "0.85rem 2rem", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 0 24px rgba(212,160,23,0.35)" }}>
              {t.ctaPrimary}
            </button>
            <button onClick={() => navigate("/employer/register")}
              style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)", border: "none", color: "#fff", borderRadius: 99, padding: "0.85rem 2rem", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 0 24px rgba(20,184,166,0.35)" }}>
              {t.ctaSecondary}
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: "2.5rem", justifyContent: "center", flexWrap: "wrap" }}>
            {[{num:"50+",lbl:"Perusahaan"},{num:"3.000+",lbl:"Jobseeker"},{num:"2 Hari",lbl:"Pelaksanaan"},{num:"38+",lbl:"Booth"}].map(s=>(
              <div key={s.lbl} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#D4A017" }}>{s.num}</div>
                <div style={{ fontSize: "0.7rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 2 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", animation: "bounce 2s infinite" }}>
          <div style={{ width: 20, height: 34, border: "2px solid rgba(20,184,166,0.3)", borderRadius: 10, display: "flex", justifyContent: "center", paddingTop: 5 }}>
            <div style={{ width: 3, height: 6, background: "#14b8a6", borderRadius: 2, animation: "scrollDot 2s infinite" }} />
          </div>
        </div>
      </section>

      {/* ── JOURNEY TIMELINE ── */}
      <div ref={journeyRef} />
      <section style={{ padding: "clamp(4rem,8vw,7rem) 1.25rem", background: "#0a1628" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2 style={{ fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 800, marginBottom: "1rem" }}>{t.journeyTitle}</h2>
            <p style={{ color: "#64748b", fontSize: "1.05rem", maxWidth: 580, margin: "0 auto" }}>{t.journeySub}</p>
          </div>

          {/* Timeline */}
          <div style={{ position: "relative" }}>
            {/* Vertical line */}
            <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2,
              background: "linear-gradient(180deg, #D4A017, #14b8a6, #818cf8)",
              transform: "translateX(-50%)", opacity: 0.4 }} className="timeline-line" />

            {steps.map((step, i) => {
              const isEven = i % 2 === 0;
              return (
                <div key={i} style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center", marginBottom: "5rem" }}>
                  {/* Timeline dot */}
                  <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 20, height: 20, borderRadius: "50%",
                    background: "#0a1628", border: `3px solid ${step.color}`, zIndex: 2,
                    boxShadow: `0 0 16px ${step.color}60` }} />

                  {/* Visual card */}
                  <div style={{ order: isEven ? 1 : 2 }}>
                    <div style={{ background: `linear-gradient(135deg, ${step.color}15, ${step.color}06)`,
                      border: `1px solid ${step.color}25`, borderRadius: 20, padding: "2.5rem 2rem", textAlign: "center" }}>
                      <div style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 1.25rem",
                        background: `${step.color}20`, border: `2px solid ${step.color}40`,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>
                        {step.role === t.jobRole ? "🎓" : step.role === t.employerRole ? "🏢" : "🌟"}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: step.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "0.5rem" }}>{step.label}</div>
                      <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: "1.1rem", marginBottom: "1.25rem" }}>{step.role}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                        {step.points.map((pt, j) => (
                          <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem", padding: "0.65rem 0.9rem",
                            background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", textAlign: "left" }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: step.color, flexShrink: 0, marginTop: 4 }} />
                            <span style={{ fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.6 }}>{pt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ order: isEven ? 2 : 1, textAlign: isEven ? "left" : "right" }}>
                    <div style={{ display: "inline-block", fontSize: "0.7rem", color: step.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em",
                      background: `${step.color}12`, border: `1px solid ${step.color}30`, borderRadius: 99, padding: "0.3rem 0.9rem", marginBottom: "1rem" }}>
                      {step.role}
                    </div>
                    <h3 style={{ fontSize: "clamp(1.3rem,2.5vw,1.75rem)", fontWeight: 800, color: "#f1f5f9", marginBottom: "1rem", lineHeight: 1.25 }}>{step.headline}</h3>
                    <p style={{ color: "#64748b", lineHeight: 1.8, marginBottom: "1.5rem", fontSize: "0.95rem" }}>{step.body}</p>
                    <button onClick={() => navigate(step.url)}
                      style={{ background: `${step.color}18`, border: `1px solid ${step.color}45`, color: step.color, borderRadius: 99, padding: "0.65rem 1.5rem", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>
                      {step.cta} →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── DENAH BOOTH ── */}
      <div ref={boothRef} />
      <section style={{ padding: "clamp(4rem,8vw,7rem) 1.25rem", background: "#060f1e" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 800, marginBottom: "1rem" }}>{t.boothSectionTitle}</h2>
            <p style={{ color: "#64748b", fontSize: "1.05rem", maxWidth: 560, margin: "0 auto" }}>{t.boothSectionSub}</p>
          </div>

          {/* Booth Map — read-only, panitiaMode tanpa toggle */}
          <BoothMapPicker
            selectedIds={[]}
            onChange={() => {}}
            bookingData={bookedBoothMap}
          />

          {/* CTA */}
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <button onClick={() => navigate("/employer/register")}
              style={{ background: "linear-gradient(135deg, #0d9488, #14b8a6)", border: "none", color: "#fff", borderRadius: 99, padding: "0.85rem 2rem", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 0 24px rgba(20,184,166,0.3)" }}>
              🏢 {t.boothCta}
            </button>
          </div>
        </div>
      </section>

      {/* ── THE BOND ── */}
      <div ref={bondRef} />
      <section style={{ padding: "clamp(4rem,8vw,7rem) 1.25rem",
        background: "linear-gradient(135deg, rgba(212,160,23,0.06), rgba(20,184,166,0.06), rgba(129,140,248,0.06)), #0a1628" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "clamp(1.8rem,4vw,3rem)", fontWeight: 800, marginBottom: "1rem" }}>{t.bondTitle}</h2>
            <p style={{ color: "#64748b", fontSize: "1.05rem", maxWidth: 600, margin: "0 auto" }}>{t.bondSub}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,300px), 1fr))", gap: "1.5rem" }}>
            {bondCards.map((card, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${card.color}20`,
                borderRadius: 20, padding: "2rem", textAlign: "center", transition: "transform 0.25s ease" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-6px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", margin: "0 auto 1.25rem",
                  background: `${card.color}18`, border: `2px solid ${card.color}35`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                  {card.icon}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "#f1f5f9", marginBottom: "0.75rem" }}>{card.title}</h3>
                <p style={{ color: "#64748b", fontSize: "0.88rem", lineHeight: 1.75 }}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA JOIN ── */}
      <div ref={joinRef} />
      <section style={{ padding: "clamp(4rem,8vw,7rem) 1.25rem", textAlign: "center" }}>
        <div style={{ maxWidth: 820, margin: "0 auto",
          background: "linear-gradient(135deg, #D4A01720, #14b8a620, #818cf820)", border: "1px solid rgba(20,184,166,0.2)",
          borderRadius: 24, padding: "clamp(2.5rem,6vw,4.5rem) 2rem" }}>
          <h2 style={{ fontSize: "clamp(1.6rem,4vw,2.5rem)", fontWeight: 800, marginBottom: "1rem" }}>{t.ctaTitle}</h2>
          <p style={{ color: "#64748b", fontSize: "1rem", lineHeight: 1.8, marginBottom: "2.5rem", maxWidth: 560, margin: "0 auto 2.5rem" }}>{t.ctaBody}</p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/jobseeker/register")}
              style={{ background: "linear-gradient(135deg,#D4A017,#B8860B)", border: "none", color: "#fff", borderRadius: 99, padding: "0.85rem 1.75rem", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 0 20px rgba(212,160,23,0.3)" }}>
              🎓 {t.ctaBtn1}
            </button>
            <button onClick={() => navigate("/employer/register")}
              style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)", border: "none", color: "#fff", borderRadius: 99, padding: "0.85rem 1.75rem", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 0 20px rgba(20,184,166,0.3)" }}>
              🏢 {t.ctaBtn2}
            </button>
            <button onClick={() => navigate("/sponsor")}
              style={{ background: "linear-gradient(135deg,#6366f1,#818cf8)", border: "none", color: "#fff", borderRadius: 99, padding: "0.85rem 1.75rem", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 0 20px rgba(129,140,248,0.3)" }}>
              🌟 {t.ctaBtn3}
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(20,184,166,0.1)", padding: "3rem 1.5rem 2rem", textAlign: "center", background: "#050d1a" }}>
        {/* Logos row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "2rem", flexWrap: "wrap", marginBottom: "1.75rem" }}>
          <img src="/logo-gr2026.png"      alt="GR2026"         style={{ height: 36, objectFit: "contain", opacity: 0.85 }} />
          <img src="/logo-poltekpar.png"   alt="Poltekpar NHI"  style={{ height: 36, objectFit: "contain", opacity: 0.85 }} />
          <img src="/logo-koperasi.png"    alt="Koperasi NHI"   style={{ height: 36, objectFit: "contain", opacity: 0.85 }} />
          <img src="/logo-ikan-alumni.png" alt="Alumni NHI"     style={{ height: 36, objectFit: "contain", opacity: 0.85 }} />
        </div>

        <p style={{ color: "#64748b", fontSize: "0.85rem", lineHeight: 1.7, marginBottom: "0.5rem" }}>
          The International Tourism & Hospitality Grand Recruitment 2026<br/>
          <span style={{ color: "#475569" }}>Politeknik Pariwisata NHI Bandung · Gedung Dome · 10–11 Juni 2026</span>
        </p>

        <div style={{ display: "flex", gap: "2rem", justifyContent: "center", flexWrap: "wrap", margin: "1.25rem 0" }}>
          <a href="/employer/register"  style={{ color: "#14b8a6", fontSize: "0.82rem", textDecoration: "none" }}>Daftar Employer</a>
          <a href="/jobseeker/register" style={{ color: "#D4A017",  fontSize: "0.82rem", textDecoration: "none" }}>Daftar Jobseeker</a>
          <a href="/sponsor"            style={{ color: "#818cf8",  fontSize: "0.82rem", textDecoration: "none" }}>Sponsorship</a>
        </div>

        <p style={{ color: "#1e293b", fontSize: "0.72rem" }}>
          © 2026 Grand Recruitment · Powered by wip289 & Claude
        </p>
        <p style={{ color: "#1e3a5f", fontSize: "0.68rem", marginTop: "0.25rem" }}>
          Data dilindungi UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi
        </p>
      </footer>

      <style>{`
        @keyframes ringPulse { from{opacity:0.2;transform:translate(-50%,-50%) scale(0.97);}to{opacity:0.6;transform:translate(-50%,-50%) scale(1.03);} }
        @keyframes dotPulse  { 0%,100%{opacity:1;transform:translate(-50%,-50%) scale(1);}50%{opacity:0.4;transform:translate(-50%,-50%) scale(1.5);} }
        @keyframes bounce    { 0%,100%{transform:translateX(-50%) translateY(0);}50%{transform:translateX(-50%) translateY(8px);} }
        @keyframes scrollDot { 0%{opacity:1;transform:translateY(0);}100%{opacity:0;transform:translateY(12px);} }
        * { box-sizing:border-box; }
        @media(max-width:768px){
          .timeline-line { display:none; }
          section [style*="grid-template-columns: 1fr 1fr"] { grid-template-columns:1fr!important; }
          section [style*="order: 1"], section [style*="order: 2"] { order:initial!important; text-align:left!important; }
        }
      `}</style>
    </div>
  );
}
