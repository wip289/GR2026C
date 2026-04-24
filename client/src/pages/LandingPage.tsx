import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [scrollY, setScrollY] = useState(0);
  const employerRef  = useRef<HTMLDivElement>(null);
  const jobseekerRef = useRef<HTMLDivElement>(null);
  const sponsorRef   = useRef<HTMLDivElement>(null);
  const [activeStory, setActiveStory] = useState(0);
  const [hoveredOrb,  setHoveredOrb]  = useState<number | null>(null);

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveStory(s => (s + 1) % 3), 4500);
    return () => clearInterval(t);
  }, []);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) =>
    ref.current?.scrollIntoView({ behavior: "smooth" });

  const stories = [
    { icon:"🎓", role:"Jobseeker", color:"#D4A017",
      quote:"Ini momen besar. Banyak peluang kerja terkumpul di satu tempat — dan saya siap.",
      sub:"Memulai perjalanan", url:"/jobseeker/register", cta:"Daftar Gratis" },
    { icon:"🏢", role:"Employer",  color:"#14b8a6",
      quote:"Ini panggung rekrutmen yang serius. Bukan sekadar open recruitment kecil.",
      sub:"Membuka pintu",     url:"/employer/register",  cta:"Daftar Booth" },
    { icon:"🌟", role:"Sponsor",   color:"#818cf8",
      quote:"Ini flagship event rekrutmen. Dan saya berkomitmen memberi yang terbaik untuk ekosistem ini.",
      sub:"Menopang ekosistem",url:"/sponsor",             cta:"Jadi Sponsor" },
  ];

  return (
    <div style={{ fontFamily:"'Segoe UI', system-ui, sans-serif", background:"#0a1628", minHeight:"100vh" }}>

      {/* ── NAV ── */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100,
        background: scrollY > 50 ? "rgba(10,22,40,0.97)" : "transparent",
        backdropFilter: scrollY > 50 ? "blur(16px)" : "none",
        borderBottom: scrollY > 50 ? "1px solid rgba(20,184,166,0.15)" : "none",
        transition:"all 0.3s ease", padding:"0 1.25rem",
        display:"flex", alignItems:"center", justifyContent:"space-between", height:60,
      }}>
        <img src="/logo-gr2026.png" alt="GR2026" style={{ height:34, objectFit:"contain", flexShrink:0 }} />
        <div style={{ display:"flex", gap:"0.35rem" }}>
          <button onClick={() => scrollTo(employerRef)}  style={navBtn}>Employer</button>
          <button onClick={() => scrollTo(jobseekerRef)} style={navBtn}>Jobseeker</button>
          <button onClick={() => scrollTo(sponsorRef)}   style={{ ...navBtn, borderColor:"rgba(129,140,248,0.4)", color:"#818cf8" }}>Sponsor</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight:"100vh", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", textAlign:"center",
        padding:"6rem 1.25rem 3rem",
        background:"radial-gradient(ellipse at 50% 0%, rgba(20,184,166,0.13) 0%, transparent 65%), radial-gradient(ellipse at 80% 90%, rgba(180,130,20,0.09) 0%, transparent 55%), #0a1628",
        position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", inset:0, opacity:0.04,
          backgroundImage:"linear-gradient(rgba(20,184,166,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.5) 1px, transparent 1px)",
          backgroundSize:"60px 60px" }} />
        {[320, 540, 760].map((size, i) => (
          <div key={i} style={{ position:"absolute", width:size, height:size, borderRadius:"50%",
            border:"1px solid rgba(20,184,166,0.08)", top:"50%", left:"50%",
            transform:"translate(-50%, -50%)", pointerEvents:"none",
            animation:`ringPulse ${4+i*1.5}s ease-in-out infinite alternate` }} />
        ))}

        <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:820 }}>
          <img src="/logo-gr2026.png" alt="Grand Recruitment 2026"
            style={{ width:"min(640px, 88vw)", display:"block", margin:"0 auto 0.75rem",
              filter:"drop-shadow(0 0 32px rgba(20,184,166,0.35))" }} />

          {/* ✅ FIX: subtitle lebih terang & readable */}
          <p style={{ margin:"0 0 2.75rem", letterSpacing:"0.04em", lineHeight:1.6 }}>
            <span style={{ color:"#14b8a6", fontWeight:600, fontSize:"1rem" }}>June 8–9, 2026</span>
            <span style={{ margin:"0 0.5rem", color:"#334155" }}>·</span>
            <span style={{ color:"#94a3b8", fontSize:"0.9rem" }}>Gedung Dome NHI Bandung</span>
          </p>

          {/* ── THREE ORBS ── */}
          <div style={{ marginBottom:"1.75rem" }}>

            {/* ✅ FIX MOBILE: setiap orb punya wrapper fixed 130×130 agar tidak loncat */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"2.5rem" }}>
              {stories.map((s, i) => {
                const isActive  = activeStory === i;
                const isHov     = hoveredOrb === i;
                const lit       = isActive || isHov;
                const orbSize   = isActive ? 110 : isHov ? 94 : 76;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center" }}>
                    {/* Fixed 130×130 wrapper — prevents layout shift on mobile */}
                    <div style={{ width:130, height:130, position:"relative", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}
                      onMouseEnter={() => setHoveredOrb(i)}
                      onMouseLeave={() => setHoveredOrb(null)}>

                      {/* Backlight — scoped to this orb only */}
                      <div style={{
                        position:"absolute", borderRadius:"50%", pointerEvents:"none",
                        width: lit ? 170 : 80, height: lit ? 170 : 80,
                        background:`radial-gradient(circle, ${s.color}${lit?"38":"0a"} 0%, transparent 70%)`,
                        transition:"all 0.5s ease",
                      }} />

                      {/* Orb button */}
                      <button
                        onClick={() => { setActiveStory(i); navigate(s.url); }}
                        style={{
                          width: orbSize, height: orbSize, borderRadius:"50%",
                          border:`2px solid ${lit ? s.color : "rgba(255,255,255,0.12)"}`,
                          background: lit
                            ? `radial-gradient(circle at 35% 35%, ${s.color}55, ${s.color}15)`
                            : "rgba(255,255,255,0.04)",
                          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                          cursor:"pointer", outline:"none", flexShrink:0,
                          transition:"width 0.4s cubic-bezier(0.34,1.56,0.64,1), height 0.4s cubic-bezier(0.34,1.56,0.64,1), border-color 0.3s, background 0.3s, box-shadow 0.3s",
                          boxShadow: isActive ? `0 0 30px ${s.color}55, 0 0 60px ${s.color}20` : isHov ? `0 0 18px ${s.color}35` : "none",
                          position:"relative", zIndex:1,
                        }}>
                        <span style={{ fontSize: isActive ? "2rem" : "1.35rem", lineHeight:1, transition:"font-size 0.35s ease" }}>{s.icon}</span>
                        <span style={{ fontSize:"0.58rem", color: lit ? s.color : "#475569", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginTop:3, transition:"color 0.3s" }}>{s.role}</span>
                      </button>

                      {/* CTA tooltip */}
                      <div style={{
                        position:"absolute", bottom:2, left:"50%", transform:"translateX(-50%)",
                        fontSize:"0.6rem", color:s.color, fontWeight:700, whiteSpace:"nowrap",
                        background:`${s.color}18`, border:`1px solid ${s.color}35`,
                        borderRadius:20, padding:"0.12rem 0.6rem",
                        opacity: isHov ? 1 : 0, transition:"opacity 0.25s",
                        pointerEvents:"none", zIndex:2,
                      }}>{s.cta} →</div>
                    </div>

                    {/* Connector line — perfectly centered because wrapper is fixed */}
                    {i < 2 && (
                      <div style={{ width:"clamp(20px,5vw,48px)", height:2, flexShrink:0,
                        background:`linear-gradient(90deg, ${stories[i].color}45, ${stories[i+1].color}45)`, position:"relative" }}>
                        <div style={{ position:"absolute", top:"50%", left:"50%",
                          transform:"translate(-50%,-50%)", width:5, height:5, borderRadius:"50%",
                          background:"#14b8a6", boxShadow:"0 0 7px #14b8a6",
                          animation:"dotPulse 2s ease-in-out infinite" }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Slider card */}
            <div style={{ overflow:"hidden", borderRadius:16 }}>
              <div style={{ display:"flex", transform:`translateX(-${activeStory*100}%)`, transition:"transform 0.55s cubic-bezier(0.77,0,0.18,1)" }}>
                {stories.map((s, i) => (
                  <div key={i} style={{ minWidth:"100%", boxSizing:"border-box",
                    background:`linear-gradient(135deg, ${s.color}0e, ${s.color}04)`,
                    border:`1px solid ${s.color}28`, borderRadius:16, padding:"1.5rem 1.75rem", textAlign:"left" }}>
                    <div style={{ fontSize:"0.66rem", color:s.color, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.2em", marginBottom:"0.6rem" }}>{s.sub}</div>
                    <p style={{ color:"#dde4ef", fontSize:"0.95rem", lineHeight:1.8, margin:"0 0 0.9rem", fontStyle:"italic" }}>"{s.quote}"</p>
                    <button onClick={() => navigate(s.url)} style={{ background:`${s.color}20`, border:`1px solid ${s.color}50`, color:s.color, borderRadius:8, padding:"0.4rem 1rem", fontSize:"0.8rem", fontWeight:700, cursor:"pointer" }}>
                      {s.cta} →
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots */}
            <div style={{ display:"flex", justifyContent:"center", gap:"0.55rem", marginTop:"1rem" }}>
              {stories.map((s, i) => (
                <div key={i} onClick={() => setActiveStory(i)} style={{
                  width: i===activeStory ? 24 : 6, height:6, borderRadius:3,
                  background: i===activeStory ? stories[i].color : "rgba(255,255,255,0.12)",
                  cursor:"pointer", transition:"width 0.35s cubic-bezier(0.34,1.56,0.64,1), background 0.3s",
                  boxShadow: i===activeStory ? `0 0 7px ${stories[i].color}70` : "none" }} />
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div style={{ display:"flex", gap:"0.75rem", justifyContent:"center", flexWrap:"wrap", marginBottom:"3rem" }}>
            <button onClick={() => scrollTo(employerRef)}  style={heroBtnTeal}>Daftar sebagai Employer</button>
            <button onClick={() => scrollTo(jobseekerRef)} style={heroBtnGold}>Daftar sebagai Jobseeker</button>
          </div>

          {/* Stats */}
          <div style={{ display:"flex", gap:"2rem", justifyContent:"center", flexWrap:"wrap" }}>
            {[{num:"50+",label:"Perusahaan"},{num:"3,000+",label:"Jobseeker"},{num:"2 Hari",label:"Pelaksanaan"},{num:"38+",label:"Booth"}].map(s=>(
              <div key={s.label} style={{ textAlign:"center" }}>
                <div style={{ fontSize:"1.75rem", fontWeight:800, color:"#D4A017" }}>{s.num}</div>
                <div style={{ fontSize:"0.72rem", color:"#64748b", textTransform:"uppercase", letterSpacing:"0.1em", marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position:"absolute", bottom:"1.5rem", left:"50%", transform:"translateX(-50%)", animation:"bounce 2s infinite" }}>
          <div style={{ width:20, height:34, border:"2px solid rgba(20,184,166,0.35)", borderRadius:10, display:"flex", justifyContent:"center", paddingTop:4 }}>
            <div style={{ width:3, height:6, background:"#14b8a6", borderRadius:2, animation:"scrollDot 2s infinite" }} />
          </div>
        </div>
      </section>

      {/* ── EMPLOYER SECTION ── */}
      <div ref={employerRef} />
      <section style={{ minHeight:"100vh", display:"flex", alignItems:"center", padding:"clamp(3rem,8vw,6rem) clamp(1rem,4vw,2rem)", background:"linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1628 100%)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:"-200px", top:"50%", transform:"translateY(-50%)", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle, rgba(20,184,166,0.07) 0%, transparent 70%)" }} />
        <div style={{ maxWidth:1100, margin:"0 auto", width:"100%", display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%,460px),1fr))", gap:"3rem", alignItems:"center" }}>
          <div>
            <div style={badge("#14b8a6")}>Untuk Perusahaan</div>
            <p style={{ fontSize:"0.83rem", color:"#475569", fontStyle:"italic", margin:"0.75rem 0 0.5rem", lineHeight:1.6 }}>"Dulu saya berdiri di sisi sana, mencari peluang. Sekarang giliran saya membuka pintu untuk mereka."</p>
            <h2 style={sectionH2}>Panggung Rekrutmen<br /><span style={{ color:"#14b8a6" }}>yang Serius & Terlihat</span></h2>
            <p style={sectionP}>Akses langsung ke {">"} 3,000 jobseeker berkualitas dari bidang hospitality, tourism, MICE, kuliner, dan manajemen perhotelan. Booth tersedia terbatas.</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"2.5rem" }}>
              {[{icon:"🏢",title:"Main Booth",desc:"5×5m — area premium",price:"Rp 10jt"},{icon:"📦",title:"Standard Booth",desc:"3×3m — area strategis",price:"Rp 7.5jt"}].map(b=>(
                <div key={b.title} style={{ background:"rgba(20,184,166,0.05)", border:"1px solid rgba(20,184,166,0.2)", borderRadius:12, padding:"1.25rem" }}>
                  <div style={{ fontSize:"1.4rem", marginBottom:"0.5rem" }}>{b.icon}</div>
                  <div style={{ fontWeight:700, color:"#f1f5f9", marginBottom:"0.2rem" }}>{b.title}</div>
                  <div style={{ fontSize:"0.78rem", color:"#64748b", marginBottom:"0.5rem" }}>{b.desc}</div>
                  <div style={{ fontWeight:700, color:"#D4A017" }}>{b.price}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap" }}>
              <button onClick={() => navigate("/employer/register")} style={heroBtnTeal}>Daftar Booth Sekarang</button>
              <button onClick={() => navigate("/employer/booth-map")} style={heroBtnOutline}>Lihat Denah Booth</button>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginTop:"1rem" }}>
              <span style={{ fontSize:"0.83rem", color:"#475569" }}>Sudah punya Booking ID?</span>
              <button onClick={() => navigate("/employer/login")} style={{ background:"transparent", border:"1px solid rgba(20,184,166,0.4)", color:"#14b8a6", borderRadius:8, padding:"0.45rem 1.1rem", fontSize:"0.83rem", fontWeight:600, cursor:"pointer" }}>Login Employer →</button>
            </div>
          </div>

          {/* ✅ FIX: Mini booth map akurat sesuai layout CorelDraw */}
          <div style={{ background:"rgba(20,184,166,0.03)", border:"1px solid rgba(20,184,166,0.15)", borderRadius:16, padding:"1.5rem", textAlign:"center" }}>
            <div style={{ fontSize:"0.72rem", color:"#14b8a6", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"1rem" }}>Preview Denah Event</div>
            <MiniBoothMap />
            <div style={{ marginTop:"1rem", padding:"0.65rem 1rem", background:"rgba(20,184,166,0.06)", border:"1px solid rgba(20,184,166,0.2)", borderRadius:8, fontSize:"0.8rem", color:"#14b8a6" }}>
              ✅ Semua booth tersedia — pesan sekarang!
            </div>
          </div>
        </div>
      </section>

      {/* ── JOBSEEKER SECTION ── */}
      <div ref={jobseekerRef} />
      <section style={{ minHeight:"100vh", display:"flex", alignItems:"center", padding:"clamp(3rem,8vw,6rem) clamp(1rem,4vw,2rem)", background:"linear-gradient(135deg, #081220 0%, #0a1628 50%, #0d1f35 100%)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", left:"-200px", top:"50%", transform:"translateY(-50%)", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle, rgba(212,160,23,0.06) 0%, transparent 70%)" }} />
        <div style={{ maxWidth:1100, margin:"0 auto", width:"100%", display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%,460px),1fr))", gap:"3rem", alignItems:"center" }}>
          <div style={{ background:"rgba(212,160,23,0.03)", border:"1px solid rgba(212,160,23,0.15)", borderRadius:20, padding:"2.5rem" }}>
            <div style={{ fontSize:"0.72rem", color:"#D4A017", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"1.5rem" }}>⚔️ Sistem Level Jobseeker</div>
            {[{level:1,name:"Pejuang Baru",icon:"🌱",desc:"Nama & email",xp:200,prog:100},{level:2,name:"Petualang",icon:"📄",desc:"Upload dokumen",xp:300,prog:0},{level:3,name:"Siap Interview!",icon:"🏆",desc:"Profil aktif & siap",xp:500,prog:0}].map((lv,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1rem", opacity:lv.prog===100?1:lv.level===2?0.7:0.4 }}>
                <div style={{ width:42, height:42, borderRadius:"50%", flexShrink:0, background:lv.prog===100?"rgba(212,160,23,0.2)":"rgba(255,255,255,0.04)", border:`2px solid ${lv.prog===100?"#D4A017":"rgba(255,255,255,0.08)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem" }}>
                  {lv.prog===100?"✓":lv.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontWeight:700, fontSize:"0.85rem", color:lv.prog===100?"#D4A017":"#475569" }}>Lv.{lv.level} {lv.name}</span>
                    <span style={{ fontSize:"0.7rem", color:"#475569" }}>+{lv.xp} XP</span>
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
              <div style={{ fontSize:"0.7rem", color:"#64748b", marginTop:"0.2rem" }}>Hanya nama & email untuk mulai</div>
            </div>
          </div>
          <div>
            <div style={badge("#D4A017")}>Untuk Jobseeker</div>
            <p style={{ fontSize:"0.83rem", color:"#475569", fontStyle:"italic", margin:"0.75rem 0 0.5rem", lineHeight:1.6 }}>"Semua orang memulai dari sini. Ini bukan akhir — ini awal dari segalanya."</p>
            <h2 style={sectionH2}>Ini Momen Besarmu.<br /><span style={{ color:"#D4A017" }}>Ambil Peluangnya.</span></h2>
            <p style={sectionP}>Daftar <strong style={{ color:"#f1f5f9" }}>gratis</strong> — cukup nama & email untuk mulai. Upload dokumen bisa nanti. Semakin lengkap profilmu, semakin tinggi levelmu di mata employer.</p>
            <button onClick={() => navigate("/jobseeker/register")} style={heroBtnGold}>Mulai Perjalananmu →</button>
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginTop:"1rem" }}>
              <span style={{ fontSize:"0.83rem", color:"#475569" }}>Sudah punya Registration ID?</span>
              <button onClick={() => navigate("/jobseeker/login")} style={{ background:"transparent", border:"1px solid rgba(212,160,23,0.4)", color:"#D4A017", borderRadius:8, padding:"0.45rem 1.1rem", fontSize:"0.83rem", fontWeight:600, cursor:"pointer" }}>Login →</button>
            </div>
            <p style={{ color:"#475569", fontSize:"0.73rem", marginTop:"0.75rem" }}>Pendaftaran gratis · Data dilindungi UU PDP · Dapat ditarik kapan saja</p>
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
              <p style={{ fontSize:"0.83rem", color:"#475569", fontStyle:"italic", margin:"0.75rem 0 0.5rem", lineHeight:1.6 }}>"Saya melihat jobseeker datang dan employer membuka pintu — dan saya berjanji memberi yang terbaik."</p>
              <h2 style={sectionH2}>Flagship Event<br /><span style={{ color:"#818cf8" }}>Rekrutmen Pariwisata</span><br /><span style={{ fontSize:"clamp(1.2rem,2.5vw,2rem)", color:"#94a3b8" }}>Indonesia</span></h2>
              <p style={sectionP}>Bukan event kecil harian. GR2026 adalah <strong style={{ color:"#f1f5f9" }}>Grand Recruitment tahunan</strong> yang mempertemukan ribuan talenta hospitality & tourism dengan industri.</p>
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
                <button onClick={() => window.location.href="mailto:sponsorship@gr2026.id"} style={{ ...heroBtnTeal, background:"linear-gradient(135deg, #6366f1, #818cf8)", boxShadow:"0 0 28px rgba(129,140,248,0.3)" }}>Hubungi Tim Sponsorship</button>
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
                      <div style={{ fontSize:"0.8rem", color:"#64748b", marginTop:"0.15rem" }}>{item.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:"1.5rem", background:"rgba(20,184,166,0.04)", border:"1px solid rgba(20,184,166,0.15)", borderRadius:16, padding:"1.5rem" }}>
                <div style={{ fontWeight:700, color:"#14b8a6", marginBottom:"0.5rem" }}>🏫 Untuk Institusi Pendidikan</div>
                <p style={{ fontSize:"0.83rem", color:"#64748b", lineHeight:1.7, margin:"0 0 1rem" }}>Kirimkan mahasiswa & alumni Anda. Jadikan GR2026 jembatan antara kampus dan industri pariwisata nyata.</p>
                <button onClick={() => window.location.href="mailto:kampus@gr2026.id"} style={{ background:"rgba(20,184,166,0.1)", border:"1px solid rgba(20,184,166,0.3)", color:"#14b8a6", borderRadius:8, padding:"0.55rem 1.1rem", fontSize:"0.83rem", fontWeight:600, cursor:"pointer" }}>Kerjasama Kampus →</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      {/* ✅ FIX: teks footer lebih cerah */}
      <footer style={{ background:"#050d1a", borderTop:"1px solid rgba(20,184,166,0.1)", padding:"2.5rem 1.5rem", textAlign:"center" }}>
        <img src="/logo-gr2026.png" alt="GR2026" style={{ height:32, marginBottom:"1.25rem", opacity:0.75 }} />
        <p style={{ color:"#64748b", fontSize:"0.83rem", lineHeight:1.7, marginBottom:0 }}>
          The International Tourism & Hospitality Grand Recruitment 2026<br />
          <span style={{ color:"#475569" }}>Politeknik Pariwisata NHI Bandung · Gedung Dome · June 8–9, 2026</span>
        </p>
        <div style={{ marginTop:"1.25rem", display:"flex", gap:"2rem", justifyContent:"center", flexWrap:"wrap" }}>
          <a href="/employer/register"  style={{ color:"#14b8a6", fontSize:"0.85rem", textDecoration:"none" }}>Daftar Employer</a>
          <a href="/jobseeker/register" style={{ color:"#D4A017",  fontSize:"0.85rem", textDecoration:"none" }}>Daftar Jobseeker</a>
          <a href="/sponsor"            style={{ color:"#818cf8",  fontSize:"0.85rem", textDecoration:"none" }}>Sponsorship</a>
          <a href="/boss"               style={{ color:"#475569",  fontSize:"0.85rem", textDecoration:"none" }}>Panitia</a>
        </div>
        <p style={{ color:"#334155", fontSize:"0.72rem", marginTop:"1.25rem" }}>
          Data dilindungi UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi
        </p>
      </footer>

      <style>{`
        @keyframes ringPulse { from{opacity:0.25;transform:translate(-50%,-50%) scale(0.97);}to{opacity:0.7;transform:translate(-50%,-50%) scale(1.03);} }
        @keyframes dotPulse  { 0%,100%{opacity:1;transform:translate(-50%,-50%) scale(1);}50%{opacity:0.4;transform:translate(-50%,-50%) scale(1.4);} }
        @keyframes bounce    { 0%,100%{transform:translateX(-50%) translateY(0);}50%{transform:translateX(-50%) translateY(7px);} }
        @keyframes scrollDot { 0%{opacity:1;transform:translateY(0);}100%{opacity:0;transform:translateY(11px);} }
        * { box-sizing:border-box; }
        button { transition: all 0.2s ease; }
        button:hover { opacity:0.9; }
        a:hover { opacity:0.75; }
      `}</style>
    </div>
  );
}

// ── Mini Booth Map — presisi sesuai CorelDraw floor plan ──────
// Koordinat diturunkan dari hasil ekstraksi SVG CorelDraw (scale ≈ 0.42)
function MiniBoothMap() {
  // Grid constants (mini scale)
  const SW=17, SH=13;
  const cA=20, cB=64, cC=85, cD=140, cE=161, cF=202;
  const r1=70, r2=85, r3=103, r4=118, r5=136, r6=151;
  const MW=35, MH=26;
  const mA=60, mB=96, mC=138, mD=174;
  const mr1=178, mr2=208, mr3=238;

  return (
    <svg viewBox="0 0 240 285" style={{ width:"100%", maxWidth:260, margin:"0 auto", display:"block" }}>
      <rect width="240" height="285" fill="#081220" rx="6"/>

      {/* STAGE */}
      <rect x="60" y="8" width="120" height="20" rx="3" fill="#D4A017" opacity="0.85"/>
      <text x="120" y="21" textAnchor="middle" fill="#0a1628" fontSize="8" fontWeight="700">STAGE</text>

      {/* LOUNGE */}
      <rect x="6" y="34" width="42" height="16" rx="2" fill="#1e3a5f" stroke="#14b8a6" strokeWidth="0.5"/>
      <text x="27" y="45" textAnchor="middle" fill="#14b8a6" fontSize="6">LOUNGE</text>

      {/* S37, S38 — pojok kanan atas */}
      <rect x="188" y="34" width="13" height="13" rx="1" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="0.5"/>
      <text x="194" y="43" textAnchor="middle" fill="#bfdbfe" fontSize="5" fontWeight="600">37</text>
      <rect x="203" y="34" width="13" height="13" rx="1" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="0.5"/>
      <text x="209" y="43" textAnchor="middle" fill="#bfdbfe" fontSize="5" fontWeight="600">38</text>

      {/* Standard booths — Pasang 1 */}
      {[
        [cA,r1],[cB,r1],[cC,r1],[cD,r1],[cE,r1],[cF,r1],
        [cA,r2],[cB,r2],[cC,r2],[cD,r2],[cE,r2],[cF,r2],
      ].map(([x,y],i)=>(
        <rect key={`s1${i}`} x={x} y={y} width={SW} height={SH} rx="1.5"
          fill="#0f766e" stroke="#14b8a6" strokeWidth="0.4" opacity="0.9"/>
      ))}

      {/* Standard booths — Pasang 2 */}
      {[
        [cA,r3],[cB,r3],[cC,r3],[cD,r3],[cE,r3],[cF,r3],
        [cA,r4],[cB,r4],[cC,r4],[cD,r4],[cE,r4],[cF,r4],
      ].map(([x,y],i)=>(
        <rect key={`s2${i}`} x={x} y={y} width={SW} height={SH} rx="1.5"
          fill="#0f766e" stroke="#14b8a6" strokeWidth="0.4" opacity="0.9"/>
      ))}

      {/* Standard booths — Pasang 3 */}
      {[
        [cA,r5],[cB,r5],[cC,r5],[cD,r5],[cE,r5],[cF,r5],
        [cA,r6],[cB,r6],[cC,r6],[cD,r6],[cE,r6],[cF,r6],
      ].map(([x,y],i)=>(
        <rect key={`s3${i}`} x={x} y={y} width={SW} height={SH} rx="1.5"
          fill="#0f766e" stroke="#14b8a6" strokeWidth="0.4" opacity="0.9"/>
      ))}

      {/* Separator line */}
      <line x1="6" y1="170" x2="234" y2="170" stroke="rgba(212,160,23,0.35)" strokeWidth="0.8" strokeDasharray="5 3"/>

      {/* P2 kiri (atas) */}
      <rect x="6" y="178" width="16" height="26" rx="1.5" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="0.5"/>
      <text x="14" y="194" textAnchor="middle" fill="#bfdbfe" fontSize="6" fontWeight="700">P2</text>
      {/* P1 kiri (bawah) */}
      <rect x="6" y="207" width="16" height="52" rx="1.5" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="0.5"/>
      <text x="14" y="236" textAnchor="middle" fill="#bfdbfe" fontSize="6" fontWeight="700">P1</text>

      {/* P4 kanan (atas) */}
      <rect x="218" y="178" width="16" height="26" rx="1.5" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="0.5"/>
      <text x="226" y="194" textAnchor="middle" fill="#bfdbfe" fontSize="6" fontWeight="700">P4</text>
      {/* P3 kanan (bawah) */}
      <rect x="218" y="207" width="16" height="52" rx="1.5" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="0.5"/>
      <text x="226" y="236" textAnchor="middle" fill="#bfdbfe" fontSize="6" fontWeight="700">P3</text>

      {/* Main booths Row 1: M9,M10 | M11,M12 */}
      {[[mA,mr1,"M9"],[mB,mr1,"M10"],[mC,mr1,"M11"],[mD,mr1,"M12"]].map(([x,y,l])=>(
        <g key={l as string}>
          <rect x={x as number} y={y as number} width={MW} height={MH} rx="2"
            fill="#0f766e" stroke="#14b8a6" strokeWidth="0.5" opacity="0.95"/>
          <text x={(x as number)+MW/2} y={(y as number)+MH/2+1} textAnchor="middle" dominantBaseline="central"
            fill="#ccfbf1" fontSize="8" fontWeight="700">{l}</text>
        </g>
      ))}
      {/* Main booths Row 2: M5,M6 | M7,M8 */}
      {[[mA,mr2,"M5"],[mB,mr2,"M6"],[mC,mr2,"M7"],[mD,mr2,"M8"]].map(([x,y,l])=>(
        <g key={l as string}>
          <rect x={x as number} y={y as number} width={MW} height={MH} rx="2"
            fill="#0f766e" stroke="#14b8a6" strokeWidth="0.5" opacity="0.95"/>
          <text x={(x as number)+MW/2} y={(y as number)+MH/2+1} textAnchor="middle" dominantBaseline="central"
            fill="#ccfbf1" fontSize="8" fontWeight="700">{l}</text>
        </g>
      ))}
      {/* Main booths Row 3: M1,M2 | M3,M4 */}
      {[[mA,mr3,"M1"],[mB,mr3,"M2"],[mC,mr3,"M3"],[mD,mr3,"M4"]].map(([x,y,l])=>(
        <g key={l as string}>
          <rect x={x as number} y={y as number} width={MW} height={MH} rx="2"
            fill="#0f766e" stroke="#14b8a6" strokeWidth="0.5" opacity="0.95"/>
          <text x={(x as number)+MW/2} y={(y as number)+MH/2+1} textAnchor="middle" dominantBaseline="central"
            fill="#ccfbf1" fontSize="8" fontWeight="700">{l}</text>
        </g>
      ))}

      {/* ENTRANCE */}
      <rect x="80" y="270" width="80" height="10" rx="2" fill="#D4A017" opacity="0.65"/>
      <text x="120" y="278" textAnchor="middle" fill="#0a1628" fontSize="6" fontWeight="700">ENTRANCE</text>
      <polygon points="120,268 114,276 126,276" fill="rgba(212,160,23,0.7)"/>
    </svg>
  );
}

// ── Style helpers ─────────────────────────────────────────────
const badge = (color: string): React.CSSProperties => ({
  display:"inline-block", fontSize:"0.72rem", fontWeight:700,
  letterSpacing:"0.12em", textTransform:"uppercase",
  padding:"0.32rem 1rem", borderRadius:20,
  background:`${color}18`, color, border:`1px solid ${color}40`, marginBottom:"0.25rem",
});
const sectionH2: React.CSSProperties = { fontSize:"clamp(1.9rem,4vw,3.2rem)", fontWeight:800, color:"#f1f5f9", lineHeight:1.12, margin:"0.9rem 0 1.25rem" };
const sectionP:  React.CSSProperties = { color:"#94a3b8", lineHeight:1.8, marginBottom:"2rem", fontSize:"1rem" };
const navBtn:    React.CSSProperties = { background:"transparent", border:"1px solid rgba(20,184,166,0.3)", color:"#94a3b8", borderRadius:8, padding:"0.35rem 0.8rem", fontSize:"0.78rem", cursor:"pointer" };
const heroBtnTeal:    React.CSSProperties = { background:"linear-gradient(135deg, #0d9488, #14b8a6)", border:"none", color:"#fff", borderRadius:10, padding:"0.75rem 1.6rem", fontSize:"0.95rem", fontWeight:700, cursor:"pointer", boxShadow:"0 0 24px rgba(20,184,166,0.35)" };
const heroBtnGold:    React.CSSProperties = { background:"linear-gradient(135deg, #D4A017, #B8860B)", border:"none", color:"#fff", borderRadius:10, padding:"0.75rem 1.6rem", fontSize:"0.95rem", fontWeight:700, cursor:"pointer", boxShadow:"0 0 24px rgba(212,160,23,0.35)" };
const heroBtnOutline: React.CSSProperties = { background:"transparent", border:"1px solid rgba(20,184,166,0.4)", color:"#14b8a6", borderRadius:10, padding:"0.75rem 1.6rem", fontSize:"0.95rem", fontWeight:600, cursor:"pointer" };
