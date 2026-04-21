import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import BoothMapPicker, { ALL_BOOTHS } from "@/components/BoothMapPicker";
import { generateBookingId, generateJobseekerId, getPaymentDeadline, openInvoiceForPrint, type BookingData } from "@/lib/invoiceGenerator";
import { trpc } from "@/lib/trpc";

const INDUSTRIES = ["Hotel & Resort","Cruise Line","Tour & Travel","MICE & Event","Food & Beverage","Spa & Wellness","Airline","Tourism Board","Hospitality Education","Lainnya"];
const POSITIONS  = ["Front Office","Housekeeping","F&B Service","F&B Production / Kitchen","Sales & Marketing","Human Resources","Accounting & Finance","Engineering & Maintenance","Event Coordinator","Tour Guide","Cruise Staff","Spa Therapist","Butler","Lainnya"];
const STEPS      = ["Perusahaan","PIC","Rekrutmen","Booth","Konfirmasi"];

interface PIC { name:string; title:string; email:string; whatsapp:string; }
interface PositionNeed { position:string; customPosition:string; count:number; }

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

const s = {
  page:   { minHeight:"100vh", background:"#0a1628", fontFamily:"system-ui, sans-serif", color:"#f1f5f9", paddingBottom:"4rem" } as React.CSSProperties,
  nav:    { background:"rgba(10,22,40,0.95)", backdropFilter:"blur(12px)", borderBottom:"1px solid rgba(20,184,166,0.2)", padding:"0 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", height:60, position:"sticky" as const, top:0, zIndex:50 },
  wrap:   { maxWidth:820, margin:"0 auto", padding:"2rem 1.25rem" },
  card:   { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"1.75rem", marginBottom:"1.5rem" },
  teal:   { background:"rgba(20,184,166,0.04)", border:"1px solid rgba(20,184,166,0.2)", borderRadius:16, padding:"1.75rem", marginBottom:"1.5rem" },
  label:  { display:"block", fontSize:"0.8rem", fontWeight:600, color:"#94a3b8", marginBottom:"0.4rem", textTransform:"uppercase" as const, letterSpacing:"0.05em" },
  input:  { width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, padding:"0.7rem 1rem", fontSize:"0.95rem", color:"#f1f5f9", outline:"none" },
  select: { width:"100%", background:"#0d1f35", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, padding:"0.7rem 1rem", fontSize:"0.95rem", color:"#f1f5f9", outline:"none" },
  row2:   { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap:"1rem" },
  secHd:  { fontSize:"1.05rem", fontWeight:700, color:"#14b8a6", marginBottom:"1.25rem", display:"flex", alignItems:"center", gap:"0.5rem" },
  btnPri: { background:"linear-gradient(135deg,#0d9488,#14b8a6)", border:"none", color:"#fff", borderRadius:12, padding:"0.9rem 2rem", fontSize:"1rem", fontWeight:700, cursor:"pointer", width:"100%" },
  btnOut: { background:"transparent", border:"1px solid rgba(20,184,166,0.4)", color:"#14b8a6", borderRadius:10, padding:"0.6rem 1.2rem", fontSize:"0.85rem", fontWeight:600, cursor:"pointer" },
  btnDel: { background:"transparent", border:"1px solid rgba(239,68,68,0.3)", color:"#f87171", borderRadius:8, padding:"0.35rem 0.75rem", fontSize:"0.78rem", cursor:"pointer" },
};

function PICForm({ pic, onChange, title, optional, onEmailBlur }: { pic:PIC; onChange:(p:PIC)=>void; title:string; optional?:boolean; onEmailBlur?:(email:string)=>void }) {
  const badge = optional ? <span style={{ display:"inline-block", fontSize:"0.68rem", fontWeight:600, padding:"0.15rem 0.5rem", borderRadius:20, background:"rgba(20,184,166,0.15)", color:"#14b8a6", border:"1px solid rgba(20,184,166,0.3)", marginLeft:"0.5rem" }}>Opsional</span> : null;
  return (
    <div style={{ marginBottom:"1rem" }}>
      <div style={{ fontSize:"0.9rem", fontWeight:700, color:"#cbd5e1", marginBottom:"1rem" }}>{title}{badge}</div>
      <div style={s.row2}>
        <div><label style={s.label}>Nama Lengkap</label><input style={s.input} value={pic.name} onChange={e=>onChange({...pic,name:e.target.value})} placeholder="John Doe"/></div>
        <div><label style={s.label}>Jabatan</label><input style={s.input} value={pic.title} onChange={e=>onChange({...pic,title:e.target.value})} placeholder="HR Manager"/></div>
        <div>
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" value={pic.email}
            onChange={e=>onChange({...pic,email:e.target.value})}
            onBlur={e => onEmailBlur?.(e.target.value)}
            placeholder="hr@perusahaan.com"/>
        </div>
        <div><label style={s.label}>WhatsApp</label><input style={s.input} value={pic.whatsapp} onChange={e=>onChange({...pic,whatsapp:e.target.value})} placeholder="08xx-xxxx-xxxx"/></div>
      </div>
    </div>
  );
}

export default function EmployerRegister() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);

  const [company, setCompany]       = useState({ name:"", industry:"", website:"", city:"" });
  const [pic1, setPic1]             = useState<PIC>({ name:"", title:"", email:"", whatsapp:"" });
  const [pic2, setPic2]             = useState<PIC>({ name:"", title:"", email:"", whatsapp:"" });
  const [showPic2, setShowPic2]     = useState(false);
  const [positions, setPositions]   = useState<PositionNeed[]>([{ position:"", customPosition:"", count:1 }]);
  const [selectedBooths, setSelectedBooths] = useState<string[]>([]);
  const [needsDesign, setNeedsDesign]       = useState(false);
  const [specialRequest, setSpecialRequest] = useState("");
  const [bookingData, setBookingData]       = useState<BookingData | null>(null);
  const [submitting, setSubmitting]         = useState(false);
  const [emailError, setEmailError]         = useState("");
  const [checkingEmail, setCheckingEmail]   = useState(false);

  const addPos = () => setPositions(p=>[...p,{position:"",customPosition:"",count:1}]);
  const delPos = (i:number) => setPositions(p=>p.filter((_,idx)=>idx!==i));
  const updPos = (i:number, v:Partial<PositionNeed>) => setPositions(p=>p.map((x,idx)=>idx===i?{...x,...v}:x));

  const emailCheckQuery = trpc.event.getAllEmployerBookings.useQuery(undefined, { enabled: false });

  const checkEmailDuplicate = async (email: string) => {
    if (!email || !email.includes("@")) return;
    setCheckingEmail(true);
    setEmailError("");
    try {
      const result = await emailCheckQuery.refetch();
      const bookings = result.data || [];
      const isDuplicate = bookings.some((b: any) =>
        b.pic1Email?.toLowerCase() === email.toLowerCase() && b.status !== "rejected"
      );
      if (isDuplicate) {
        setEmailError("Email ini sudah digunakan. Silakan ganti dengan email lain.");
      }
    } catch {}
    setCheckingEmail(false);
  };

  const selectedBoothDefs = ALL_BOOTHS.filter(b => selectedBooths.includes(b.id));
  const totalAmount = selectedBoothDefs.reduce((s,b)=>s+b.price,0);

  const canNext = () => {
    if (step===0) return !!(company.name && company.industry && company.city);
    if (step===1) return !!(pic1.name && pic1.email && pic1.whatsapp) && !emailError && !checkingEmail;
    if (step===2) return positions.some(p=>p.position||p.customPosition);
    if (step===3) return selectedBooths.length > 0;
    return true;
  };

  const createBookingMutation = trpc.event.createEmployerBooking.useMutation({
    onSuccess: (_data, variables) => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"});
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
        booths: selectedBoothDefs.map(b=>({ boothId:b.id, label:b.label, type:b.type as "main"|"standard", price:b.price })),
        needsBoothDesign: needsDesign,
        specialRequest,
        totalAmount,
        paymentDeadline: getPaymentDeadline(),
      };
      setBookingData(data);
      toast.success("Booking berhasil!", { description: "Invoice siap untuk didownload." });
      setStep(5);
      setSubmitting(false);
    },
    onError: (err) => {
      setSubmitting(false);
      if (err.message.includes("Email ini sudah terdaftar")) {
        toast.error("Email sudah terdaftar!", { 
          description: "Email PIC ini sudah digunakan untuk booking lain. Silakan login dengan Booking ID yang sudah ada." 
        });
      } else if (err.message.includes("sudah dipesan")) {
        toast.error("Booth sudah dipesan!", { 
          description: err.message + " Silakan kembali dan pilih booth lain." 
        });
      } else {
        toast.error("Terjadi kesalahan", { description: "Coba lagi atau hubungi panitia." });
      }
    },
  });

  const handleConfirm = () => {
    if (submitting) return;
    const id = generateBookingId(pic1.name, company.industry);
    setSubmitting(true);
    createBookingMutation.mutate({
      bookingId: id,
      companyName: company.name,
      industry: company.industry,
      city: company.city,
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
      totalAmount,
      positions,
      needsBoothDesign: needsDesign,
      specialRequest: specialRequest || undefined,
    });
  };

  // ── Success screen ──
  if (step === 5 && bookingData) {
    return (
      <div style={s.page}>
        <nav style={s.nav}>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height:32 }}/>
        </nav>
        <div style={{ ...s.wrap, textAlign:"center", maxWidth:600 }}>
          <div style={{ fontSize:"4rem", margin:"2rem 0 1rem" }}>🎉</div>
          <h1 style={{ fontSize:"clamp(1.6rem,4vw,2.2rem)", fontWeight:800, marginBottom:"0.75rem" }}>Booking Dikonfirmasi!</h1>
          <p style={{ color:"#64748b", lineHeight:1.7, marginBottom:"0.5rem" }}>
            Terima kasih, <strong style={{ color:"#f1f5f9" }}>{bookingData.companyName}</strong>!<br/>
            Booking Anda telah kami terima.
          </p>
          <div style={{ background:"rgba(20,184,166,0.08)", border:"1px solid rgba(20,184,166,0.2)", borderRadius:12, padding:"1.25rem 1.5rem", margin:"1.5rem 0", textAlign:"left" }}>
            <div style={{ fontSize:"0.75rem", color:"#14b8a6", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"1rem" }}>Ringkasan Booking</div>
            <div style={{ fontSize:"0.82rem", color:"#64748b", marginBottom:"0.4rem" }}>Booking ID</div>
            <div style={{ fontWeight:800, color:"#14b8a6", fontSize:"1.1rem", marginBottom:"1rem", fontFamily:"monospace" }}>{bookingData.bookingId}</div>
            {bookingData.booths.map((b,i)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:"0.9rem", color:"#cbd5e1", marginBottom:"0.4rem" }}>
                <span>Booth {b.label} ({b.type==="main"?"Main 5×5m":"Standard 3×3m"})</span>
                <span style={{ color:"#D4A017", fontWeight:700 }}>{fmt(b.price)}</span>
              </div>
            ))}
            <div style={{ borderTop:"1px solid rgba(20,184,166,0.2)", paddingTop:"0.75rem", marginTop:"0.75rem", display:"flex", justifyContent:"space-between", fontWeight:800, fontSize:"1.05rem" }}>
              <span>Total</span>
              <span style={{ color:"#D4A017" }}>{fmt(bookingData.totalAmount)}</span>
            </div>
          </div>

          {/* Payment deadline warning */}
          <div style={{ background:"rgba(249,115,22,0.08)", border:"1px solid rgba(249,115,22,0.25)", borderRadius:12, padding:"1rem 1.25rem", marginBottom:"1.5rem", textAlign:"left" }}>
            <div style={{ fontSize:"0.85rem", color:"#fed7aa", lineHeight:1.7 }}>
              ⏰ <strong>Batas pembayaran: {bookingData.paymentDeadline}</strong><br/>
              Lakukan transfer sesuai invoice dan hubungi panitia untuk konfirmasi. Booth akan dilepas jika tidak ada konfirmasi pembayaran sampai batas waktu.
            </div>
          </div>

          {/* Download invoice */}
          <button
            onClick={() => openInvoiceForPrint(bookingData)}
            style={{ ...s.btnPri, marginBottom:"1rem", background:"linear-gradient(135deg,#D4A017,#B8860B)", boxShadow:"0 0 20px rgba(212,160,23,0.3)" }}
          >
            📄 Download Invoice PDF
          </button>
          <p style={{ color:"#475569", fontSize:"0.78rem", marginBottom:"1.5rem" }}>
            Invoice terbuka di tab baru → Ctrl+P → Save as PDF
          </p>

          <button onClick={()=>navigate("/")} style={{ ...s.btnOut, width:"100%" }}>
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          <button onClick={()=>navigate("/")} style={{ background:"none", border:"none", color:"#14b8a6", cursor:"pointer", fontSize:"0.9rem" }}>← Kembali</button>
          <img src="/logo-gr2026.png" alt="GR2026" style={{ height:32 }}/>
        </div>
        <div style={{ fontSize:"0.8rem", color:"#64748b" }}>Pendaftaran Employer</div>
      </nav>

      <div style={s.wrap}>
        <div style={{ textAlign:"center", marginBottom:"2.5rem" }}>
          <h1 style={{ fontSize:"clamp(1.6rem,4vw,2.2rem)", fontWeight:800, marginBottom:"0.5rem" }}>
            Daftar sebagai <span style={{ color:"#14b8a6" }}>Employer</span>
          </h1>
          <p style={{ color:"#64748b", fontSize:"0.9rem" }}>Grand Recruitment 2026 · June 8–9 · Dome NHI Bandung</p>
        </div>

        {/* Steps */}
        <div style={{ display:"flex", alignItems:"center", marginBottom:"2.5rem", overflowX:"auto", paddingBottom:"0.5rem" }}>
          {STEPS.map((label,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", flexShrink:0 }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"0.35rem" }}>
                <div style={{ width:34,height:34,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:"0.85rem",background:i<step?"#0d9488":i===step?"#14b8a6":"rgba(255,255,255,0.06)",color:i<=step?"#fff":"#475569",border:i===step?"2px solid #5eead4":"none" }}>
                  {i<step?"✓":i+1}
                </div>
                <span style={{ fontSize:"0.68rem", color:i===step?"#14b8a6":"#475569", whiteSpace:"nowrap" }}>{label}</span>
              </div>
              {i<STEPS.length-1&&<div style={{ height:2,width:"clamp(16px,4vw,44px)",background:i<step?"#0d9488":"rgba(255,255,255,0.06)",margin:"0 0.25rem",marginBottom:"1.3rem",flexShrink:0 }}/>}
            </div>
          ))}
        </div>

        {/* ── STEP 0: Perusahaan ── */}
        {step===0&&(
          <div style={s.card}>
            <div style={s.secHd}>🏢 Informasi Perusahaan</div>
            <div style={{ marginBottom:"1rem" }}>
              <label style={s.label}>Nama Perusahaan *</label>
              <input style={s.input} value={company.name} onChange={e=>setCompany({...company,name:e.target.value})} placeholder="PT. Hotel Indonesia Tbk"/>
            </div>
            <div style={s.row2}>
              <div>
                <label style={s.label}>Industri *</label>
                <select style={s.select} value={company.industry} onChange={e=>setCompany({...company,industry:e.target.value})}>
                  <option value="">-- Pilih Industri --</option>
                  {INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Kota / Domisili *</label>
                <input style={s.input} value={company.city} onChange={e=>setCompany({...company,city:e.target.value})} placeholder="Jakarta"/>
              </div>
            </div>
            <div style={{ marginTop:"1rem" }}>
              <label style={s.label}>Website <span style={{ color:"#475569",fontWeight:400 }}>(opsional)</span></label>
              <input style={s.input} value={company.website} onChange={e=>setCompany({...company,website:e.target.value})} placeholder="https://www.perusahaan.com"/>
            </div>
          </div>
        )}

        {/* ── STEP 1: PIC ── */}
        {step===1&&(
          <div style={s.card}>
            <div style={s.secHd}>👤 Person in Charge</div>
            <PICForm pic={pic1} onChange={(v) => { setPic1(v); if (emailError) setEmailError(""); }} title="PIC Utama" onEmailBlur={(email) => checkEmailDuplicate(email)}/>
            {checkingEmail && (
              <div style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 8, padding: "0.75rem 1rem", marginTop: "0.5rem", fontSize: "0.82rem", color: "#14b8a6" }}>
                ⏳ Memeriksa email...
              </div>
            )}
            {emailError && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "1rem 1.25rem", marginTop: "0.75rem" }}>
                <div style={{ fontWeight: 700, color: "#f87171", marginBottom: "0.4rem", fontSize: "0.9rem" }}>⚠️ Email sudah terdaftar</div>
                <div style={{ fontSize: "0.82rem", color: "#fca5a5", lineHeight: 1.6 }}>
                  Email ini sudah digunakan untuk booking lain. Silakan ganti dengan email lain untuk melanjutkan.
                </div>
                <div style={{ marginTop: "0.6rem", fontSize: "0.8rem", color: "#94a3b8" }}>
                  Sudah punya Booking ID? Buka tab baru dan kunjungi <span style={{ color: "#f87171" }}>/employer/login</span>
                </div>
              </div>
            )}
            {showPic2?(
              <>
                <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)",margin:"1.5rem 0" }}/>
                <PICForm pic={pic2} onChange={setPic2} title="PIC Kedua" optional/>
                <button style={s.btnDel} onClick={()=>{setShowPic2(false);setPic2({name:"",title:"",email:"",whatsapp:""});}}>Hapus PIC Kedua</button>
              </>
            ):(
              <button style={s.btnOut} onClick={()=>setShowPic2(true)}>+ Tambah PIC Kedua (Opsional)</button>
            )}
          </div>
        )}

        {/* ── STEP 2: Rekrutmen ── */}
        {step===2&&(
          <div style={s.card}>
            <div style={s.secHd}>🎯 Kebutuhan Rekrutmen</div>
            <p style={{ color:"#64748b",fontSize:"0.85rem",marginBottom:"1.5rem" }}>Pilih dari daftar atau isi nama posisi secara bebas. Bisa tambah lebih dari satu.</p>
            {positions.map((pos,i)=>(
              <div key={i} style={{ background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"1.25rem",marginBottom:"1rem" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem" }}>
                  <span style={{ fontSize:"0.82rem",color:"#94a3b8",fontWeight:600 }}>Posisi {i+1}</span>
                  {positions.length>1&&<button style={s.btnDel} onClick={()=>delPos(i)}>Hapus</button>}
                </div>
                <div style={s.row2}>
                  <div>
                    <label style={s.label}>Pilih dari daftar</label>
                    <select style={s.select} value={pos.position} onChange={e=>updPos(i,{position:e.target.value,customPosition:""})}>
                      <option value="">-- Pilih posisi --</option>
                      {POSITIONS.map(p=><option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>Atau isi nama posisi</label>
                    <input style={s.input} value={pos.customPosition} onChange={e=>updPos(i,{customPosition:e.target.value,position:""})} placeholder="Contoh: Digital Marketing"/>
                  </div>
                </div>
                <div style={{ marginTop:"1rem",maxWidth:200 }}>
                  <label style={s.label}>Jumlah Kandidat</label>
                  <input style={s.input} type="number" min={1} value={pos.count} onChange={e=>updPos(i,{count:parseInt(e.target.value)||1})}/>
                </div>
              </div>
            ))}
            <button style={s.btnOut} onClick={addPos}>+ Tambah Posisi</button>
          </div>
        )}

        {/* ── STEP 3: Booth ── */}
        {step===3&&(
          <div>
            <div style={s.teal}>
              <div style={s.secHd}>🗺️ Pilih Booth dari Denah</div>
              <p style={{ color:"#64748b",fontSize:"0.85rem",marginBottom:"1.25rem" }}>
                Klik booth <strong style={{ color:"#14b8a6" }}>hijau</strong> untuk memilih. Posisi yang dipilih langsung masuk ke pesanan. Klik lagi untuk membatalkan.
              </p>
              <BoothMapPicker selectedIds={selectedBooths} onChange={setSelectedBooths}/>
            </div>

            {/* Special Request */}
            <div style={s.card}>
              <div style={s.secHd}>✨ Special Request</div>

              {/* Booth design */}
              <div style={{ background:"rgba(212,160,23,0.05)",border:"1px solid rgba(212,160,23,0.2)",borderRadius:12,padding:"1.25rem",marginBottom:"1.25rem" }}>
                <label style={{ display:"flex",alignItems:"flex-start",gap:"0.75rem",cursor:"pointer" }}>
                  <input type="checkbox" checked={needsDesign} onChange={e=>setNeedsDesign(e.target.checked)}
                    style={{ width:18,height:18,marginTop:2,accentColor:"#D4A017",flexShrink:0 }}/>
                  <div>
                    <div style={{ fontWeight:700,color:"#f1f5f9",marginBottom:"0.25rem" }}>
                      📐 Saya membutuhkan layanan desain booth interior
                    </div>
                    <div style={{ fontSize:"0.82rem",color:"#64748b",lineHeight:1.5 }}>
                      Tim kami akan menghubungkan Anda dengan vendor dekorasi rekanan. Biaya desain akan ditagih terpisah oleh vendor setelah konsultasi.
                    </div>
                  </div>
                </label>
                {needsDesign&&(
                  <div style={{ marginTop:"1rem",padding:"0.85rem 1rem",background:"rgba(212,160,23,0.08)",borderRadius:8,fontSize:"0.82rem",color:"#fde68a" }}>
                    ✅ Kami akan mengirimkan form desain booth ke email Anda setelah pendaftaran dikonfirmasi.
                  </div>
                )}
              </div>

              {/* Free text */}
              <div>
                <label style={s.label}>Catatan / Permintaan Khusus Lainnya <span style={{ color:"#475569",fontWeight:400 }}>(opsional)</span></label>
                <textarea
                  style={{ ...s.input,minHeight:80,resize:"vertical" as const }}
                  value={specialRequest}
                  onChange={e=>setSpecialRequest(e.target.value)}
                  placeholder="Contoh: Mohon ditempatkan di dekat entrance, butuh stop kontak tambahan, dll."
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Konfirmasi ── */}
        {step===4&&(
          <div>
            <div style={s.teal}>
              <div style={s.secHd}>📋 Konfirmasi Booking</div>
              <p style={{ color:"#64748b",fontSize:"0.85rem",marginBottom:"1.5rem" }}>
                Periksa kembali data Anda sebelum menyelesaikan booking.
              </p>

              {/* Company */}
              <div style={{ marginBottom:"1.25rem" }}>
                <div style={{ fontSize:"0.75rem",color:"#14b8a6",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.75rem" }}>Perusahaan</div>
                <div style={{ fontSize:"0.95rem",color:"#f1f5f9",fontWeight:700 }}>{company.name}</div>
                <div style={{ fontSize:"0.85rem",color:"#64748b" }}>{company.industry} · {company.city}</div>
              </div>

              {/* PIC */}
              <div style={{ marginBottom:"1.25rem" }}>
                <div style={{ fontSize:"0.75rem",color:"#14b8a6",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.75rem" }}>PIC</div>
                <div style={{ fontSize:"0.9rem",color:"#cbd5e1" }}>{pic1.name} · {pic1.title} · {pic1.whatsapp}</div>
                {showPic2&&pic2.name&&<div style={{ fontSize:"0.9rem",color:"#94a3b8",marginTop:"0.25rem" }}>{pic2.name} · {pic2.title}</div>}
              </div>

              {/* Positions */}
              <div style={{ marginBottom:"1.25rem" }}>
                <div style={{ fontSize:"0.75rem",color:"#14b8a6",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.75rem" }}>Rekrutmen</div>
                {positions.filter(p=>p.position||p.customPosition).map((p,i)=>(
                  <div key={i} style={{ fontSize:"0.88rem",color:"#cbd5e1",marginBottom:"0.3rem" }}>• {p.position||p.customPosition} — {p.count} kandidat</div>
                ))}
              </div>

              {/* Booths */}
              <div style={{ borderTop:"1px solid rgba(20,184,166,0.15)",paddingTop:"1.25rem" }}>
                <div style={{ fontSize:"0.75rem",color:"#14b8a6",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.75rem" }}>Booth yang Dipesan</div>
                {selectedBoothDefs.map((b,i)=>(
                  <div key={i} style={{ display:"flex",justifyContent:"space-between",fontSize:"0.9rem",color:"#cbd5e1",marginBottom:"0.4rem" }}>
                    <span>Booth {b.label} · {b.type==="main"?"Main Booth 5×5m":"Standard Booth 3×3m"}</span>
                    <span style={{ color:"#D4A017",fontWeight:700 }}>{fmt(b.price)}</span>
                  </div>
                ))}
                <div style={{ display:"flex",justifyContent:"space-between",borderTop:"1px solid rgba(20,184,166,0.2)",paddingTop:"0.75rem",marginTop:"0.75rem",fontWeight:800,fontSize:"1.1rem" }}>
                  <span>Total</span>
                  <span style={{ color:"#D4A017" }}>{fmt(totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Payment info */}
            <div style={s.card}>
              <div style={s.secHd}>🏦 Cara Pembayaran</div>
              <div style={{ background:"rgba(20,184,166,0.05)",border:"1px solid rgba(20,184,166,0.15)",borderRadius:10,padding:"1.25rem",marginBottom:"1rem" }}>
                {[
                  { label:"Bank",       val:"Bank BNI" },
                  { label:"No. Rekening",val:"0123-456-789" },
                  { label:"Atas Nama",  val:"Koperasi Poltekpar NHI Bandung" },
                  { label:"Nominal",    val:fmt(totalAmount) },
                ].map(item=>(
                  <div key={item.label} style={{ display:"flex",gap:"1rem",marginBottom:"0.6rem",flexWrap:"wrap" }}>
                    <span style={{ fontSize:"0.82rem",color:"#64748b",minWidth:130 }}>{item.label}</span>
                    <span style={{ fontWeight:700,color:item.label==="Nominal"?"#D4A017":"#f1f5f9",fontSize:"0.95rem" }}>{item.val}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:"rgba(249,115,22,0.08)",border:"1px solid rgba(249,115,22,0.2)",borderRadius:10,padding:"1rem",fontSize:"0.82rem",color:"#fed7aa",lineHeight:1.7 }}>
                ⏰ Setelah booking dikonfirmasi, Anda akan menerima <strong>invoice PDF</strong> yang bisa langsung didownload.
                Lakukan pembayaran paling lambat <strong>{getPaymentDeadline()}</strong> dan kirim bukti ke WhatsApp panitia.
              </div>
            </div>
          </div>
        )}

        {/* Bottom nav */}
        <div style={{ display:"flex",gap:"1rem",marginTop:"1rem" }}>
          {step>0&&<button style={{ ...s.btnOut,flex:1 }} onClick={()=>setStep(s=>s-1)}>← Kembali</button>}
          {step<STEPS.length-1?(
            <button style={{ ...s.btnPri,flex:2,opacity:canNext()?1:0.4,cursor:canNext()?"pointer":"not-allowed" }} onClick={()=>canNext()&&setStep(s=>s+1)}>
              Lanjut →
            </button>
          ):(
            <button style={{ ...s.btnPri,flex:2,background:"linear-gradient(135deg,#D4A017,#B8860B)",opacity:canNext()?1:0.4,cursor:canNext()?"pointer":"not-allowed" }} onClick={()=>canNext()&&handleConfirm()}>
              Konfirmasi Booking 🎉
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
