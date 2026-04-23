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

  useEffect(() => {
    const t = setInterval(() => setActiveStory(s => (s + 1) % 3), 4500);
    return () => clearInterval(t);
  }, []);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  const stories = [
    { icon: "🎓", role: "Jobseeker", color: "#D4A017", quote: "Ini momen besar. Banyak peluang kerja terkumpul di satu tempat — dan saya siap.", sub: "Memulai perjalanan" },
    { icon: "🏢", role: "Employer",  color: "#14b8a6", quote: "Ini panggung rekrutmen yang serius. Bukan sekadar open recruitment kecil.",        sub: "Membuka pintu" },
    { icon: "🌟", role: "Sponsor",   color: "#818cf8", quote: "Ini flagship event rekrutmen. Dan saya berkomitmen memberi yang terbaik untuk ekosistem ini.", sub: "Menopang ekosistem" },
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
        <img src="/logo-gr2026.png" alt="GR2026" style={{ height: "38px", objectFit: "contain" }} />
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => scrollTo(employerRef)} style={navBtn}>Employer</button>
          <button onClick={() => scrollTo(jobseekerRef)} style={navBtn}>Jobseeker</button>
          <button onClick={() => scrollTo(sponsorRef)} style={{ ...navBtn, borderColor: "rgba(129,140,248,0.4)", color: "#818cf8" }}>Sponsor</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center",
        padding: "7rem 1.5rem 4rem",
        background: "radial-gradient(ellipse at 50% 0%, rgba(20,184,166,0.13) 0%, transparent 65%), radial-gradient(ellipse at 80% 90%, rgba(180,130,20,0.09) 0%, transparent 55%), #0a1628",
        position: "relative", overflow: "hidden"
      }}>
        {/* Grid */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: "linear-gradient(rgba(20,184,166,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px" }} />

        {/* Rings — only background decoration, no parallax */}
        {[320, 540, 760].map((size, i) => (
          <div key={i} style={{
            position: "absolute", width: size, height: size, borderRadius: "50%",
            border: "1px solid rgba(20,184,166,0.08)",
            top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            animation: `ringPulse ${4 + i * 1.5}s ease-in-out infinite alternate`,
            pointerEvents: "none"
          }} />
        ))}

        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 820 }}>

          {/* ── LOGO — no parallax, no movement ── */}
          <img
            src="/logo-gr2026.png"
            alt="Grand Recruitment 2026"
            style={{
              width: "min(660px, 90vw)",
              display: "block", margin: "0 auto 0.6rem",
              filter: "drop-shadow(0 0 32px rgba(20,184,166,0.35))",
            }}
          />

          {/* Subtitle — clean single line */}
          <p style={{ color: "#475569", fontSize: "0.88rem", margin: "0 0 3rem", letterSpacing: "0.05em" }}>
            <span style={{ color: "#14b8a6", fontWeight: 600 }}>June 8–9, 2026</span>
            <span style={{ margin: "0 0.6rem", color: "#1e3a5f" }}>·</span>
            Gedung Dome NHI Bandung
          </p>

          {/* ── THREE ORBS ── */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2rem" }}>
              {stories.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  <div onClick={() => setActiveStory(i)} style={{
                    width: activeStory === i ? 108 : 74, height: activeStory === i ? 108 : 74,
                    borderRadius: "50%",
                    border: `2px solid ${activeStory === i ? s.color : "rgba(255,255,255,0.1)"}`,
                    background: activeStory === i
                      ? `radial-gradient(circle at 35% 35%, ${s.color}45, ${s.color}12)`
                      : "rgba(255,255,255,0.03)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", flexShrink: 0,
                    transition: "width 0.45s cubic-bezier(0.34,1.56,0.64,1), height 0.45s cubic-bezier(0.34,1.56,0.64,1), border-color 0.35s, background 0.35s, box-shadow 0.35s",
                    boxShadow: activeStory === i ? `0 0 36px ${s.color}45, 0 0 72px ${s.color}18` : "none",
                  }}>
                    <div style={{ fontSize: activeStory === i ? "2.2rem" : "1.5rem", lineHeight: 1, transition: "font-size 0.4s ease" }}>{s.icon}</div>
                    <div style={{ fontSize: "0.58rem", color: activeStory === i ? s.color : "#334155", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4, transition: "color 0.3s" }}>{s.role}</div>
                  </div>
                  {i < 2 && (
                    <div style={{ width: 54, height: 2, flexShrink: 0, background: `linear-gradient(90deg, ${stories[i].color}45, ${stories[i+1].color}45)`, position: "relative" }}>
                      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 6, height: 6, borderRadius: "50%", background: "#14b8a6", boxShadow: "0 0 8px #14b8a6", animation: "dotPulse 2s ease-in-out infinite" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Slider card */}
            <div style={{ overflow: "hidden", borderRadius: 18 }}>
              <div style={{ display: "flex", transform: `translateX(-${activeStory * 100}%)`, transition: "transform 0.58s cubic-bezier(0.77,0,0.18,1)" }}>
                {stories.map((s, i) => (
                  <div key={i} style={{
                    minWidth: "100%", boxSizing: "border-box",
                    background: `linear-gradient(135deg, ${s.color}0e, ${s.color}04)`,
                    border: `1px solid ${s.color}28`, borderRadius: 18,
                    padding: "1.75rem 2.25rem", textAlign: "left",
                  }}>
                    <div style={{ fontSize: "0.68rem", color: s.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "0.65rem" }}>{s.sub}</div>
                    <p style={{ color: "#dde4ef", fontSize: "1rem", lineHeight: 1.85, margin: "0 0 0.85rem", fontStyle: "italic" }}>"{s.quote}"</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ width: 24, height: 2, background: s.color, borderRadius: 1 }} />
                      <span style={{ fontSize: "0.72rem", color: s.color, fontWeight: 600 }}>{s.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: "0.55rem", marginTop: "1.1rem" }}>
              {stories.map((s, i) => (
                <div key={i} onClick={() => setActiveStory(i)} style={{
                  width: i === activeStory ? 26 : 6, height: 6, borderRadius: 3,
                  background: i === activeStory ? stories[i].color : "rgba(255,255,255,0.12)",
                  cursor: "pointer",
                  transition: "width 0.35s cubic-bezier(0.34,1.56,0.64,1), background 0.3s",
                  boxShadow: i === activeStory ? `0 0 7px ${stories[i].color}70` : "none"
                }} />
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "3.5rem" }}>
            <button onClick={() => scrollTo(employerRef)} style={heroBtnTeal}>Daftar sebagai Employer</button>
            <button onClick={() => scrollTo(jobseekerRef)} style={heroBtnGold}>Daftar sebagai Jobseeker</button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: "2.5rem", justifyContent: "center", flexWrap: "wrap" }}>
            {[{ num: "50+", label: "Perusahaan" }, { num: "3,000+", label: "Jobseeker" }, { num: "2 Hari", label: "Pelaksanaan" }, { num: "38+", label: "Booth" }].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#D4A017" }}>{s.num}</div>
                <div style={{ fontSize: "0.75rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: "1.75rem", left: "50%", transform: "translateX(-50%)", animation: "bounce 2s infinite" }}>
          <div style={{ width: 22, height: 38, border: "2px solid rgba(20,184,166,0.35)", borderRadius: 11, display: "flex", justifyContent: "center", paddingTop: 5 }}>
            <div style={{ width: 3, height: 7, background: "#14b8a6", borderRadius: 2, animation: "scrollDot 2s infinite" }} />
          </div>
        </div>
      </section>

      {/* ── EMPLOYER SECTION ── */}
      <div ref={employerRef} />
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "clamp(3rem,8vw,6rem) clamp(1rem,4vw,2rem)", background: "linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1628 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: "-200px", top: "50%", transform: "translateY(-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(20,184,166,0.07) 0%, transparent 70%)" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,460px),1fr))", gap: "3rem", alignItems: "center" }}>
          <div>
            <div style={badge("#14b8a6")}>Untuk Perusahaan</div>
            <p style={{ fontSize: "0.83rem", color: "#334155", fontStyle: "italic", margin: "0.75rem 0 0.5rem", lineHeight: 1.6 }}>"Dulu saya berdiri di sisi sana, mencari peluang. Sekarang giliran saya membuka pintu untuk mereka."</p>
            <h2 style={sectionH2}>Panggung Rekrutmen<br /><span style={{ color: "#14b8a6" }}>yang Serius & Terlihat</span></h2>
            <p style={sectionP}>Akses langsung ke {">"} 3,000 jobseeker berkualitas dari bidang hospitality, tourism, MICE, kuliner, dan manajemen perhotelan. Booth tersedia terbatas.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2.5rem" }}>
              {[{ icon: "🏢", title: "Main Booth", desc: "5×5m — area premium", price: "Rp 10jt" }, { icon: "📦", title: "Standard Booth", desc: "3×3m — area strategis", price: "Rp 7.5jt" }].map(b => (
                <div key={b.title} style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 12, padding: "1.25rem" }}>
                  <div style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>{b.icon}</div>
                  <div style={{ fontWeight: 700, color: "#f1f5f9", marginBottom: "0.2rem" }}>{b.title}</div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "0.5rem" }}>{b.desc}</div>
                  <div style={{ fontWeight: 700, color: "#D4A017" }}>{b.price}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <button onClick={() => navigate("/employer/register")} style={heroBtnTeal}>Daftar Booth Sekarang</button>
              <button onClick={() => navigate("/employer/booth-map")} style={heroBtnOutline}>Lihat Denah Booth</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1rem" }}>
              <span style={{ fontSize: "0.83rem", color: "#334155" }}>Sudah punya Booking ID?</span>
              <button onClick={() => navigate("/employer/login")} style={{ background: "transparent", border: "1px solid rgba(20,184,166,0.4)", color: "#14b8a6", borderRadius: 8, padding: "0.45rem 1.1rem", fontSize: "0.83rem", fontWeight: 600, cursor: "pointer" }}>Login Employer →</button>
            </div>
          </div>

          {/* Mini booth map */}
          <div style={{ background: "rgba(20,184,166,0.03)", border: "1px solid rgba(20,184,166,0.15)", borderRadius: 16, padding: "2rem", textAlign: "center" }}>
            <div style={{ fontSize: "0.72rem", color: "#14b8a6", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1rem" }}>Preview Denah Event</div>
            <svg viewBox="0 0 300 380" style={{ width: "100%", maxWidth: 280, margin: "0 auto", display: "block" }}>
              <rect x="60" y="10" width="180" height="30" rx="4" fill="#D4A017" opacity="0.8"/>
              <text x="150" y="30" textAnchor="middle" fill="#0a1628" fontSize="11" fontWeight="700">STAGE</text>
              <rect x="10" y="50" width="55" height="25" rx="3" fill="#1e3a5f" stroke="#14b8a6" strokeWidth="0.5"/>
              <text x="37" y="67" textAnchor="middle" fill="#14b8a6" fontSize="8">LOUNGE</text>
              {[[10,85],[75,85],[100,85],[175,85],[200,85],[245,85],[265,85],[10,110],[75,110],[100,110],[175,110],[200,110],[245,110],[265,110],[10,140],[75,140],[100,140],[175,140],[200,140],[245,140],[10,165],[75,165],[100,165],[175,165],[200,165],[245,165],[10,195],[75,195],[100,195],[175,195],[200,195],[245,195],[10,220],[75,220],[100,220],[175,220],[200,220],[245,220]].map(([x,y],i)=>(<rect key={i} x={x} y={y} width="22" height="22" rx="2" fill={i<5?"#ef4444":i<15?"#f97316":"#14b8a6"} opacity="0.85" stroke="#0a1628" strokeWidth="0.5"/>))}
              {[[75,255],[135,255],[185,255],[245,255],[75,295],[135,295],[185,295],[245,295],[75,335],[135,335],[185,335],[245,335]].map(([x,y],i)=>(<rect key={i} x={x} y={y} width="45" height="38" rx="3" fill={i<2?"#ef4444":i<5?"#f97316":"#14b8a6"} opacity="0.85" stroke="#0a1628" strokeWidth="0.5"/>))}
              <rect x="100" y="370" width="100" height="8" rx="2" fill="#D4A017" opacity="0.6"/>
              <text x="150" y="368" textAnchor="middle" fill="#D4A017" fontSize="9">ENTRANCE</text>
            </svg>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1rem", flexWrap: "wrap" }}>
              {[{color:"#14b8a6",label:"Tersedia"},{color:"#f97316",label:"Reserved"},{color:"#ef4444",label:"Booked"}].map(l=>(
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem", color: "#94a3b8" }}>
                  <div style={{ width: 9, height: 9, borderRadius: 2, background: l.color }} />{l.label}
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1.25rem", padding: "0.7rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, fontSize: "0.83rem", color: "#fca5a5" }}>
              🔴 <strong>12 booth</strong> sudah dipesan · <strong>26 tersisa</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ── JOBSEEKER SECTION ── */}
      <div ref={jobseekerRef} />
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "clamp(3rem,8vw,6rem) clamp(1rem,4vw,2rem)", background: "linear-gradient(135deg, #081220 0%, #0a1628 50%, #0d1f35 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: "-200px", top: "50%", transform: "translateY(-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,160,23,0.06) 0%, transparent 70%)" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,460px),1fr))", gap: "3rem", alignItems: "center" }}>

          {/* Level preview card */}
          <div style={{ background: "rgba(212,160,23,0.03)", border: "1px solid rgba(212,160,23,0.15)", borderRadius: 20, padding: "2.5rem" }}>
            <div style={{ fontSize: "0.72rem", color: "#D4A017", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1.5rem" }}>⚔️ Sistem Level Jobseeker</div>
            {[
              { level:1, name:"Pejuang Baru",   icon:"🌱", desc:"Nama & email",          xp:200, prog:100 },
              { level:2, name:"Petualang",       icon:"📄", desc:"Upload dokumen",        xp:300, prog:0  },
              { level:3, name:"Siap Interview!", icon:"🏆", desc:"Profil aktif & siap",   xp:500, prog:0  },
            ].map((lv,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1rem", opacity: lv.prog===100?1:lv.level===2?0.7:0.4 }}>
                <div style={{ width:42, height:42, borderRadius:"50%", flexShrink:0, background: lv.prog===100?"rgba(212,160,23,0.2)":"rgba(255,255,255,0.04)", border:`2px solid ${lv.prog===100?"#D4A017":"rgba(255,255,255,0.08)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem" }}>
                  {lv.prog===100?"✓":lv.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontWeight:700, fontSize:"0.85rem", color: lv.prog===100?"#D4A017":"#475569" }}>Lv.{lv.level} {lv.name}</span>
                    <span style={{ fontSize:"0.7rem", color:"#334155" }}>+{lv.xp} XP</span>
                  </div>
                  <div style={{ fontSize:"0.75rem", color:"#475569", marginTop:"0.15rem" }}>{lv.desc}</div>
                  <div style={{ height:3, background:"rgba(255,255,255,0.06)", borderRadius:2, marginTop:"0.3rem" }}>
                    <div style={{ height:"100%", borderRadius:2, width:`${lv.prog}%`, background:"#D4A017" }} />
                  </div>
                </div>
              </div>
            ))}
            <div style={{ marginTop:"1.25rem", padding:"0.9rem", background:"rgba(20,184,166,0.06)", border:"1px solid rgba(20,184,166,0.2)", borderRadius:10, textAlign:"center" }}>
              <div style={{ fontSize:"0.75rem", color:"#14b8a6", fontWeight:700 }}>Daftar dalam 60 detik 🚀</div>
              <div style={{ fontSize:"0.7rem", color:"#334155", marginTop:"0.2rem" }}>Hanya nama & email untuk mulai</div>
            </div>
          </div>

          {/* Right CTA */}
          <div>
            <div style={badge("#D4A017")}>Untuk Jobseeker</div>
            <p style={{ fontSize:"0.83rem", color:"#334155", fontStyle:"italic", margin:"0.75rem 0 0.5rem", lineHeight:1.6 }}>"Semua orang memulai dari sini. Ini bukan akhir — ini awal dari segalanya."</p>
            <h2 style={sectionH2}>Ini Momen Besarmu.<br /><span style={{ color:"#D4A017" }}>Ambil Peluangnya.</span></h2>
            <p style={sectionP}>Daftar <strong style={{ color:"#f1f5f9" }}>gratis</strong> — cukup nama & email untuk mulai. Upload dokumen bisa nanti. Semakin lengkap profilmu, semakin tinggi levelmu di mata employer.</p>
            <div style={{ display:"grid", gap:"0.65rem", marginBottom:"2rem" }}>
              {[{n:"01",t:"Isi nama & email (60 detik)"},{n:"02",t:"Pilih: upload dokumen sekarang atau nanti"},{n:"03",t:"Terima ID Card & mulai perjalananmu 🎉"}].map(s=>(
                <div key={s.n} style={{ display:"flex", gap:"1rem", alignItems:"center" }}>
                  <div style={{ width:30, height:30, borderRadius:"50%", flexShrink:0, background:"rgba(212,160,23,0.1)", border:"1px solid rgba(212,160,23,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.68rem", fontWeight:800, color:"#D4A017" }}>{s.n}</div>
                  <span style={{ color:"#94a3b8", fontSize:"0.88rem" }}>{s.t}</span>
                </div>
              ))}
            </div>
            <button onClick={()=>navigate("/jobseeker/register")} style={heroBtnGold}>Mulai Perjalananmu →</button>
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginTop:"1rem" }}>
              <span style={{ fontSize:"0.83rem", color:"#334155" }}>Sudah punya Registration ID?</span>
              <button onClick={()=>navigate("/jobseeker/login")} style={{ background:"transparent", border:"1px solid rgba(212,160,23,0.4)", color:"#D4A017", borderRadius:8, padding:"0.45rem 1.1rem", fontSize:"0.83rem", fontWeight:600, cursor:"pointer" }}>Login →</button>
            </div>
            <p style={{ color:"#334155", fontSize:"0.73rem", marginTop:"0.75rem" }}>Pendaftaran gratis · Data dilindungi UU PDP · Dapat ditarik kapan saja</p>
          </div>
        </div>
      </section>

      {/* ── SPONSOR SECTION ── */}
      <div ref={sponsorRef} />
      <section style={{ minHeight:"100vh", display:"flex", alignItems:"center", padding:"clamp(3rem,8vw,6rem) clamp(1rem,4vw,2rem)", background:"linear-gradient(135deg, #080f1f 0%, #0c1535 50%, #080f1f 100%)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle, rgba(129,140,248,0.07) 0%, transparent 70%)", pointerEvents:"none" }} />
        <div style={{ maxWidth:1100, margin:"0 auto", width:"100%", position:"relative", zIndex:1 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%,480px),1fr))", gap:"4rem", alignItems:"center" }}>
            <div>
              <div style={badge("#818cf8")}>Untuk Sponsor & Kampus</div>
              <p style={{ fontSize:"0.83rem", color:"#334155", fontStyle:"italic", margin:"0.75rem 0 0.5rem", lineHeight:1.6 }}>"Saya melihat jobseeker datang dan employer membuka pintu — dan saya berjanji memberi yang terbaik untuk ekosistem ini."</p>
              <h2 style={sectionH2}>Flagship Event<br /><span style={{ color:"#818cf8" }}>Rekrutmen Pariwisata</span><br /><span style={{ fontSize:"clamp(1.2rem,2.5vw,2rem)", color:"#94a3b8" }}>Indonesia</span></h2>
              <p style={sectionP}>Bukan event kecil harian. GR2026 adalah <strong style={{ color:"#f1f5f9" }}>Grand Recruitment tahunan</strong> yang mempertemukan ribuan talenta terbaik hospitality & tourism dengan industri.</p>
              <div style={{ display:"grid", gap:"1rem", marginBottom:"2.5rem" }}>
                {[{tier:"🥇 Gold Sponsor",color:"#D4A017",perks:["Logo semua materi","Booth premium","Speaking slot","Database jobseeker"]},{tier:"🥈 Silver Sponsor",color:"#94a3b8",perks:["Logo banner & backdrop","Booth strategis","Mention sosmed"]},{tier:"🥉 Bronze / Media Partner",color:"#c2773a",perks:["Logo digital","Branding venue","Laporan pasca event"]}].map((t,i)=>(
                  <div key={i} style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${t.color}25`, borderRadius:12, padding:"1.1rem", borderLeft:`3px solid ${t.color}` }}>
                    <div style={{ fontWeight:700, color:t.color, marginBottom:"0.5rem", fontSize:"0.88rem" }}>{t.tier}</div>
                    <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                      {t.perks.map(p=>(<span key={p} style={{ fontSize:"0.72rem", color:"#64748b", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:5, padding:"0.18rem 0.55rem" }}>{p}</span>))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap" }}>
                <button onClick={()=>window.location.href="mailto:sponsorship@gr2026.id"} style={{ ...heroBtnTeal, background:"linear-gradient(135deg, #6366f1, #818cf8)", boxShadow:"0 0 28px rgba(129,140,248,0.3)" }}>Hubungi Tim Sponsorship</button>
                <button style={heroBtnOutline}>Download Proposal</button>
              </div>
            </div>
            <div>
              <div style={{ background:"rgba(129,140,248,0.04)", border:"1px solid rgba(129,140,248,0.15)", borderRadius:20, padding:"2.5rem" }}>
                <div style={{ fontSize:"0.72rem", color:"#818cf8", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"2rem" }}>Dampak yang Anda Dukung</div>
                {[{num:"3,000+",label:"Jobseeker yang hadir",icon:"🎓"},{num:"50+",label:"Perusahaan rekrutmen aktif",icon:"🏢"},{num:"2 Hari",label:"Event intensif full coverage",icon:"📅"},{num:"60+",label:"Tahun alumni NHI Bandung",icon:"🌟"},{num:"10K+",label:"Reach media sosial & digital",icon:"📱"}].map((item,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:"1.25rem", padding:"0.9rem 0", borderBottom:i<4?"1px solid rgba(255,255,255,0.05)":"none" }}>
                    <div style={{ fontSize:"1.6rem", flexShrink:0 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize:"1.6rem", fontWeight:800, color:"#818cf8", lineHeight:1 }}>{item.num}</div>
                      <div style={{ fontSize:"0.8rem", color:"#475569", marginTop:"0.15rem" }}>{item.label}</div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop:"1.25rem", padding:"0.9rem 1rem", background:"rgba(129,140,248,0.08)", border:"1px solid rgba(129,140,248,0.2)", borderRadius:8, fontSize:"0.8rem", color:"#a5b4fc", lineHeight:1.7 }}>
                  🎯 Slot terbatas. Hubungi panitia sebelum <strong>1 Mei 2026</strong> untuk early bird pricing.
                </div>
              </div>
              <div style={{ marginTop:"1.5rem", background:"rgba(20,184,166,0.04)", border:"1px solid rgba(20,184,166,0.15)", borderRadius:16, padding:"1.5rem" }}>
                <div style={{ fontWeight:700, color:"#14b8a6", marginBottom:"0.5rem" }}>🏫 Untuk Institusi Pendidikan</div>
                <p style={{ fontSize:"0.83rem", color:"#64748b", lineHeight:1.7, margin:"0 0 1rem" }}>Kirimkan mahasiswa & alumni Anda. Jadikan GR2026 jembatan antara kampus dan industri pariwisata nyata.</p>
                <button onClick={()=>window.location.href="mailto:kampus@gr2026.id"} style={{ background:"rgba(20,184,166,0.1)", border:"1px solid rgba(20,184,166,0.3)", color:"#14b8a6", borderRadius:8, padding:"0.55rem 1.1rem", fontSize:"0.83rem", fontWeight:600, cursor:"pointer" }}>Kerjasama Kampus →</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:"#050d1a", borderTop:"1px solid rgba(20,184,166,0.1)", padding:"2.5rem 2rem", textAlign:"center" }}>
        <img src="/logo-gr2026.png" alt="GR2026" style={{ height:"32px", marginBottom:"1.25rem", opacity:0.7 }} />
        <p style={{ color:"#1e3a5f", fontSize:"0.82rem" }}>
          The International Tourism & Hospitality Grand Recruitment 2026<br />
          Politeknik Pariwisata NHI Bandung · Gedung Dome · June 8–9, 2026
        </p>
        <div style={{ marginTop:"1.25rem", display:"flex", gap:"2rem", justifyContent:"center", flexWrap:"wrap" }}>
          <a href="/employer/register" style={{ color:"#14b8a6", fontSize:"0.82rem", textDecoration:"none" }}>Daftar Employer</a>
          <a href="/jobseeker/register" style={{ color:"#D4A017", fontSize:"0.82rem", textDecoration:"none" }}>Daftar Jobseeker</a>
          <a href="#sponsor" style={{ color:"#818cf8", fontSize:"0.82rem", textDecoration:"none" }}>Sponsorship</a>
          <a href="/boss" style={{ color:"#1e3a5f", fontSize:"0.82rem", textDecoration:"none" }}>Panitia</a>
        </div>
        <p style={{ color:"#1e293b", fontSize:"0.7rem", marginTop:"1rem" }}>Data dilindungi UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi</p>
      </footer>

      <style>{`
        @keyframes ringPulse { from { opacity:0.25; transform:translate(-50%,-50%) scale(0.97); } to { opacity:0.7; transform:translate(-50%,-50%) scale(1.03); } }
        @keyframes dotPulse  { 0%,100% { opacity:1; transform:translate(-50%,-50%) scale(1); } 50% { opacity:0.4; transform:translate(-50%,-50%) scale(1.4); } }
        @keyframes bounce    { 0%,100% { transform:translateX(-50%) translateY(0); } 50% { transform:translateX(-50%) translateY(7px); } }
        @keyframes scrollDot { 0% { opacity:1; transform:translateY(0); } 100% { opacity:0; transform:translateY(11px); } }
        * { box-sizing:border-box; }
        button { transition: all 0.2s ease; }
        button:hover { opacity:0.88; transform:translateY(-1px); }
      `}</style>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────
const badge = (color: string): React.CSSProperties => ({
  display:"inline-block", fontSize:"0.72rem", fontWeight:700,
  letterSpacing:"0.12em", textTransform:"uppercase",
  padding:"0.32rem 1rem", borderRadius:20,
  background:`${color}18`, color, border:`1px solid ${color}40`,
  marginBottom:"0.25rem"
});

const sectionH2: React.CSSProperties = {
  fontSize:"clamp(1.9rem,4vw,3.2rem)", fontWeight:800, color:"#f1f5f9",
  lineHeight:1.12, margin:"0.9rem 0 1.25rem"
};

const sectionP: React.CSSProperties = {
  color:"#94a3b8", lineHeight:1.8, marginBottom:"2rem", fontSize:"1rem"
};

const navBtn: React.CSSProperties = {
  background:"transparent", border:"1px solid rgba(20,184,166,0.3)",
  color:"#94a3b8", borderRadius:8, padding:"0.38rem 0.9rem",
  fontSize:"0.83rem", cursor:"pointer"
};

const heroBtnTeal: React.CSSProperties = {
  background:"linear-gradient(135deg, #0d9488, #14b8a6)", border:"none",
  color:"#fff", borderRadius:10, padding:"0.8rem 1.9rem",
  fontSize:"0.97rem", fontWeight:700, cursor:"pointer",
  boxShadow:"0 0 28px rgba(20,184,166,0.38)"
};

const heroBtnGold: React.CSSProperties = {
  background:"linear-gradient(135deg, #D4A017, #B8860B)", border:"none",
  color:"#fff", borderRadius:10, padding:"0.8rem 1.9rem",
  fontSize:"0.97rem", fontWeight:700, cursor:"pointer",
  boxShadow:"0 0 28px rgba(212,160,23,0.38)"
};

const heroBtnOutline: React.CSSProperties = {
  background:"transparent", border:"1px solid rgba(20,184,166,0.4)",
  color:"#14b8a6", borderRadius:10, padding:"0.8rem 1.9rem",
  fontSize:"0.97rem", fontWeight:600, cursor:"pointer"
};
