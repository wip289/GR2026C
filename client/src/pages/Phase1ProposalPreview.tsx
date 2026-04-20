import { useState } from 'react';
import { usePhase1 } from '@/contexts/Phase1Context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ChevronLeft, Download, FileText, Eye, Building2, Handshake } from 'lucide-react';
import { useLocation } from 'wouter';
import type { ProposalCustomization } from '@/lib/phase1Types';

function generateEmployerHTML(c: ProposalCustomization, venueName: string): string {
  const boothRows = c.boothPackages.map((b) => `
    <div class="booth-card">
      <div class="booth-header">
        <div><div class="booth-name">${b.name}</div><div class="booth-dim">${b.dimensions} | ${b.quantity} unit tersedia</div></div>
        <div class="booth-price">Rp ${b.price.toLocaleString('id-ID')}</div>
      </div>
      <ul class="booth-features">${b.features.map((f) => `<li>${f}</li>`).join('')}</ul>
    </div>`).join('');

  const programs = c.mainProgram.map((p) => `<li>${p}</li>`).join('');
  const supporting = c.supportingProgram.map((p) => `<li>${p}</li>`).join('');
  const industries = c.industryTargets.map((i) => `<span class="tag">${i}</span>`).join('');
  const segments = c.audienceSegments.map((s) => `<span class="tag">${s}</span>`).join('');

  return `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"/>
<title>Proposal Employer - ${c.eventName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Georgia,serif;color:#1a1a1a;background:#fff}
@page{margin:20mm 18mm;size:A4}
@media print{body{font-size:11pt}}
.cover{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;background:#1a2e44;color:white;text-align:center;padding:60px 40px;page-break-after:always}
.cover-badge{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C4A664;margin-bottom:24px}
.cover-title{font-size:48px;font-weight:bold;line-height:1.1;margin-bottom:16px}
.cover-sub{font-size:18px;color:#a0b4c8;margin-bottom:40px}
.cover-meta{border-top:1px solid rgba(255,255,255,0.2);padding-top:32px;display:grid;grid-template-columns:repeat(3,1fr);gap:24px;width:100%;max-width:560px}
.cover-meta-item label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#7a9ab5;display:block;margin-bottom:4px}
.cover-meta-item span{font-size:15px;font-weight:600}
.page{padding:48px 56px;page-break-before:always}
.section{margin-bottom:40px}
.section-label{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#C4553A;font-family:sans-serif;margin-bottom:8px}
h2{font-size:26px;color:#1a2e44;margin-bottom:20px;border-bottom:2px solid #C4553A;padding-bottom:10px}
h3{font-size:17px;color:#1a2e44;margin-bottom:12px}
p{font-size:13px;line-height:1.8;color:#444;margin-bottom:12px}
ul{padding-left:20px;margin-bottom:12px}
li{font-size:13px;line-height:1.8;color:#444;margin-bottom:4px}
.stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px}
.stat-box{text-align:center;background:#f8f4f0;border-radius:10px;padding:20px}
.stat-number{font-size:32px;font-weight:bold;color:#C4553A;font-family:sans-serif}
.stat-label{font-size:11px;color:#888;font-family:sans-serif;letter-spacing:1px;text-transform:uppercase;margin-top:4px}
.booth-card{border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin-bottom:16px;page-break-inside:avoid}
.booth-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}
.booth-name{font-size:17px;font-weight:bold;color:#1a2e44}
.booth-dim{font-size:12px;color:#888;margin-top:3px;font-family:sans-serif}
.booth-price{font-size:22px;font-weight:bold;color:#C4553A;font-family:sans-serif}
.booth-features{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px}
.booth-features li{font-size:12px;color:#555}
.tag{display:inline-block;background:#f0f4f8;color:#1a2e44;font-size:11px;font-family:sans-serif;padding:4px 12px;border-radius:20px;margin:3px}
.highlight-box{background:#f8f4f0;border-left:4px solid #C4553A;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:16px}
.highlight-box p{margin:0;font-size:13px}
.contact-box{background:#1a2e44;color:white;border-radius:10px;padding:24px 28px;margin-top:32px}
.contact-box h3{color:#C4A664;margin-bottom:12px}
.contact-box p{color:#a0b4c8;font-size:13px;margin:4px 0}
.contact-box strong{color:white}
.footer{text-align:center;font-size:11px;color:#999;font-family:sans-serif;margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb}
</style></head><body>
<div class="cover">
  <div class="cover-badge">Proposal Resmi - Employer</div>
  <div class="cover-title">${c.eventName}</div>
  <div class="cover-sub">Invitation to Participate as Employer</div>
  <div class="cover-meta">
    <div class="cover-meta-item"><label>Tanggal</label><span>${c.eventDate}</span></div>
    <div class="cover-meta-item"><label>Durasi</label><span>${c.eventDuration} Hari</span></div>
    <div class="cover-meta-item"><label>Venue</label><span>${venueName || c.venueLocation}</span></div>
  </div>
</div>
<div class="page">
  <div class="section">
    <div class="section-label">Tentang Event</div>
    <h2>Gambaran Umum</h2>
    <p><strong>${c.eventName}</strong> adalah job fair bergengsi yang diselenggarakan oleh <strong>${c.clientName}</strong> bersama <strong>${c.universityName}</strong>. Event ini menghubungkan perusahaan terkemuka dengan <strong>${parseInt(c.expectedAttendees).toLocaleString('id-ID')} jobseeker</strong> berkualitas dari berbagai latar belakang.</p>
    <div class="highlight-box"><p>Event terbuka untuk perusahaan dari berbagai sektor yang ingin menjangkau calon karyawan terbaik — mahasiswa aktif, fresh graduate, alumni, dan pencari kerja umum.</p></div>
  </div>
  <div class="section">
    <div class="stats-row">
      <div class="stat-box"><div class="stat-number">${parseInt(c.expectedAttendees).toLocaleString('id-ID')}</div><div class="stat-label">Peserta Jobseeker</div></div>
      <div class="stat-box"><div class="stat-number">${c.boothPackages.reduce((s,b)=>s+b.quantity,0)}</div><div class="stat-label">Total Booth</div></div>
      <div class="stat-box"><div class="stat-number">${c.eventDuration}</div><div class="stat-label">Hari Pelaksanaan</div></div>
    </div>
  </div>
  <div class="section">
    <div class="section-label">Program</div>
    <h2>Program Utama &amp; Pendukung</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <div><h3>Program Utama</h3><ul>${programs}</ul></div>
      <div><h3>Program Pendukung</h3><ul>${supporting}</ul></div>
    </div>
  </div>
  <div class="section">
    <h2>Segmen &amp; Target Industri</h2>
    <h3>Segmen Peserta</h3><div>${segments}</div>
    <div style="height:16px"></div>
    <h3>Target Industri</h3><div>${industries}</div>
  </div>
</div>
<div class="page">
  <div class="section">
    <div class="section-label">Paket Booth</div>
    <h2>Pilihan Paket Booth</h2>
    <p>Booth tersedia dengan sistem <strong>first come, first serve</strong>. Posisi booth dapat dipilih setelah pembayaran dikonfirmasi.</p>
    ${boothRows}
  </div>
  <div class="section">
    <div class="section-label">Cara Mendaftar</div>
    <h2>Langkah Pendaftaran</h2>
    <ol style="padding-left:20px">
      <li style="margin-bottom:12px;font-size:13px;line-height:1.7;color:#444"><strong>Isi Formulir Pendaftaran</strong><br/>Kunjungi platform kami dan isi data perusahaan secara lengkap</li>
      <li style="margin-bottom:12px;font-size:13px;line-height:1.7;color:#444"><strong>Konfirmasi &amp; Pembayaran</strong><br/>Pilih paket booth dan lakukan pembayaran</li>
      <li style="margin-bottom:12px;font-size:13px;line-height:1.7;color:#444"><strong>Pilih Posisi Booth</strong><br/>Akses denah interaktif dan pilih posisi booth setelah pembayaran terkonfirmasi</li>
      <li style="margin-bottom:12px;font-size:13px;line-height:1.7;color:#444"><strong>Hadir di Event</strong><br/>Tim kami akan menghubungi Anda untuk briefing teknis sebelum hari H</li>
    </ol>
  </div>
  <div class="contact-box">
    <h3>Hubungi Kami</h3>
    <p><strong>${c.clientName}</strong> — ${c.universityName}</p>
    ${c.contactEmail ? `<p>Email: <strong>${c.contactEmail}</strong></p>` : ''}
    ${c.contactPhone ? `<p>WhatsApp: <strong>${c.contactPhone}</strong></p>` : ''}
  </div>
  <div class="footer">${c.eventName} | ${c.clientName} | ${c.universityName}</div>
</div>
</body></html>`;
}

function generateSponsorHTML(c: ProposalCustomization, venueName: string): string {
  const tierCards = c.sponsorTiers.map((t) => `
    <div class="tier-card" style="border-color:${t.color}">
      <div class="tier-header" style="background:${t.color}">
        <div class="tier-name">${t.name}</div>
        <div class="tier-price">Rp ${t.price.toLocaleString('id-ID')}</div>
      </div>
      <ul class="tier-benefits">
        ${Array.isArray(t.benefits) ? t.benefits.map((b: string) => `<li>${b}</li>`).join('') : `<li>${t.benefits}</li>`}
      </ul>
    </div>`).join('');

  const industries = c.industryTargets.map((i) => `<span class="tag">${i}</span>`).join('');
  const fields = c.fieldsOfExpertise.map((f) => `<span class="tag">${f}</span>`).join('');

  return `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"/>
<title>Proposal Sponsor - ${c.eventName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Georgia,serif;color:#1a1a1a;background:#fff}
@page{margin:20mm 18mm;size:A4}
@media print{body{font-size:11pt}}
.cover{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;background:#2D1B4E;color:white;text-align:center;padding:60px 40px;page-break-after:always}
.cover-badge{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C4A664;margin-bottom:24px}
.cover-title{font-size:48px;font-weight:bold;line-height:1.1;margin-bottom:16px}
.cover-sub{font-size:18px;color:#b8a4d4;margin-bottom:40px}
.cover-meta{border-top:1px solid rgba(255,255,255,0.2);padding-top:32px;display:grid;grid-template-columns:repeat(3,1fr);gap:24px;width:100%;max-width:560px}
.cover-meta-item label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9880c0;display:block;margin-bottom:4px}
.cover-meta-item span{font-size:15px;font-weight:600}
.page{padding:48px 56px;page-break-before:always}
.section{margin-bottom:40px}
.section-label{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#7c3aed;font-family:sans-serif;margin-bottom:8px}
h2{font-size:26px;color:#2D1B4E;margin-bottom:20px;border-bottom:2px solid #7c3aed;padding-bottom:10px}
h3{font-size:17px;color:#2D1B4E;margin-bottom:12px}
p{font-size:13px;line-height:1.8;color:#444;margin-bottom:12px}
ul{padding-left:20px;margin-bottom:12px}
li{font-size:13px;line-height:1.8;color:#444;margin-bottom:4px}
.stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px}
.stat-box{text-align:center;background:#f5f0ff;border-radius:10px;padding:20px}
.stat-number{font-size:32px;font-weight:bold;color:#7c3aed;font-family:sans-serif}
.stat-label{font-size:11px;color:#888;font-family:sans-serif;letter-spacing:1px;text-transform:uppercase;margin-top:4px}
.tier-card{border:2px solid #ddd;border-radius:12px;overflow:hidden;margin-bottom:20px;page-break-inside:avoid}
.tier-header{padding:16px 20px;display:flex;justify-content:space-between;align-items:center;color:white}
.tier-name{font-size:18px;font-weight:bold}
.tier-price{font-size:22px;font-weight:bold;font-family:sans-serif}
.tier-benefits{padding:16px 20px;display:grid;grid-template-columns:1fr 1fr;gap:4px 16px}
.tier-benefits li{font-size:12px;color:#444}
.tag{display:inline-block;background:#f0ebff;color:#2D1B4E;font-size:11px;font-family:sans-serif;padding:4px 12px;border-radius:20px;margin:3px}
.highlight-box{background:#f5f0ff;border-left:4px solid #7c3aed;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:16px}
.highlight-box p{margin:0;font-size:13px}
.why-box{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
.why-item{background:#f8f5ff;border-radius:10px;padding:16px}
.why-item h4{font-size:13px;font-weight:bold;color:#2D1B4E;margin-bottom:6px}
.why-item p{font-size:12px;color:#666;margin:0}
.contact-box{background:#2D1B4E;color:white;border-radius:10px;padding:24px 28px;margin-top:32px}
.contact-box h3{color:#C4A664;margin-bottom:12px}
.contact-box p{color:#b8a4d4;font-size:13px;margin:4px 0}
.contact-box strong{color:white}
.footer{text-align:center;font-size:11px;color:#999;font-family:sans-serif;margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb}
</style></head><body>
<div class="cover">
  <div class="cover-badge">Proposal Resmi - Sponsorship</div>
  <div class="cover-title">${c.eventName}</div>
  <div class="cover-sub">Sponsorship Partnership Proposal</div>
  <div class="cover-meta">
    <div class="cover-meta-item"><label>Tanggal</label><span>${c.eventDate}</span></div>
    <div class="cover-meta-item"><label>Durasi</label><span>${c.eventDuration} Hari</span></div>
    <div class="cover-meta-item"><label>Venue</label><span>${venueName || c.venueLocation}</span></div>
  </div>
</div>
<div class="page">
  <div class="section">
    <div class="section-label">Tentang Event</div>
    <h2>Mengapa Menjadi Sponsor?</h2>
    <p><strong>${c.eventName}</strong> adalah platform rekrutmen terbesar yang diselenggarakan oleh <strong>${c.clientName}</strong> bersama <strong>${c.universityName}</strong>. Dengan <strong>${parseInt(c.expectedAttendees).toLocaleString('id-ID')} peserta</strong> berkualitas, ini adalah kesempatan strategis untuk menempatkan brand Anda di hadapan generasi profesional terbaik.</p>
    <div class="highlight-box"><p>Sponsorship bukan sekadar donasi — ini investasi branding yang terukur dengan eksposur langsung kepada ribuan calon karyawan, akademisi, dan pelaku industri.</p></div>
  </div>
  <div class="section">
    <div class="stats-row">
      <div class="stat-box"><div class="stat-number">${parseInt(c.expectedAttendees).toLocaleString('id-ID')}</div><div class="stat-label">Peserta Jobseeker</div></div>
      <div class="stat-box"><div class="stat-number">${c.boothPackages.reduce((s,b)=>s+b.quantity,0)}+</div><div class="stat-label">Perusahaan Employer</div></div>
      <div class="stat-box"><div class="stat-number">${c.eventDuration}</div><div class="stat-label">Hari Eksposur</div></div>
    </div>
  </div>
  <div class="section">
    <div class="section-label">Keuntungan</div>
    <h2>Apa yang Anda Dapatkan</h2>
    <div class="why-box">
      <div class="why-item"><h4>Brand Visibility</h4><p>Logo dan nama brand tampil di seluruh media promosi event — offline dan online</p></div>
      <div class="why-item"><h4>Direct Talent Access</h4><p>Akses ke ${parseInt(c.expectedAttendees).toLocaleString('id-ID')} jobseeker berkualitas dari industri pilihan</p></div>
      <div class="why-item"><h4>Industry Networking</h4><p>Networking eksklusif dengan akademisi, pelaku industri, dan pemimpin perusahaan</p></div>
      <div class="why-item"><h4>Content &amp; Media</h4><p>Dokumentasi profesional dan penyebutan brand di seluruh platform media sosial panitia</p></div>
    </div>
  </div>
  <div class="section">
    <h2>Bidang Keahlian &amp; Target Industri</h2>
    <h3>Bidang Keahlian Peserta</h3><div>${fields}</div>
    <div style="height:16px"></div>
    <h3>Target Industri</h3><div>${industries}</div>
  </div>
</div>
<div class="page">
  <div class="section">
    <div class="section-label">Paket Sponsorship</div>
    <h2>Pilihan Tier Sponsorship</h2>
    <p>Setiap tier dirancang untuk memberikan nilai maksimal sesuai skala investasi Anda. Slot terbatas — konfirmasi segera.</p>
    ${tierCards}
  </div>
  <div class="section">
    <div class="section-label">Cara Bergabung</div>
    <h2>Langkah Konfirmasi</h2>
    <ol style="padding-left:20px">
      <li style="margin-bottom:12px;font-size:13px;line-height:1.7;color:#444"><strong>Hubungi Tim Sponsorship</strong><br/>Sampaikan minat dan tier yang diminati</li>
      <li style="margin-bottom:12px;font-size:13px;line-height:1.7;color:#444"><strong>Tanda Tangani MOU</strong><br/>Perjanjian kerjasama dan konfirmasi benefit</li>
      <li style="margin-bottom:12px;font-size:13px;line-height:1.7;color:#444"><strong>Transfer Investasi</strong><br/>Pembayaran sesuai tier yang dipilih</li>
      <li style="margin-bottom:12px;font-size:13px;line-height:1.7;color:#444"><strong>Submit Materi Branding</strong><br/>Kirimkan logo dan materi promosi sesuai brief dari panitia</li>
    </ol>
  </div>
  <div class="contact-box">
    <h3>Hubungi Tim Sponsorship</h3>
    <p><strong>${c.clientName}</strong> — ${c.universityName}</p>
    ${c.contactEmail ? `<p>Email: <strong>${c.contactEmail}</strong></p>` : ''}
    ${c.contactPhone ? `<p>WhatsApp: <strong>${c.contactPhone}</strong></p>` : ''}
  </div>
  <div class="footer">${c.eventName} | ${c.clientName} | ${c.universityName}</div>
</div>
</body></html>`;
}

function openForPrint(html: string, filename: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.addEventListener('load', () => setTimeout(() => URL.revokeObjectURL(url), 5000));
  } else {
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export default function Phase1ProposalPreview() {
  const { state, dispatch } = usePhase1();
  const [, setLocation] = useLocation();
  const { proposalCustomization, clientIntake, selectedVenue } = state;
  const [activeTab, setActiveTab] = useState<'employer' | 'sponsor'>('employer');

  if (!proposalCustomization || !clientIntake) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8"><p className="text-muted-foreground">Loading proposal...</p></Card>
      </div>
    );
  }

  const venueName = selectedVenue?.name ?? '';

  const handleOpenEmployer = () => {
    openForPrint(generateEmployerHTML(proposalCustomization, venueName), `Proposal-Employer-${proposalCustomization.eventName}.html`);
    toast.success('Proposal Employer dibuka di tab baru', { description: 'Ctrl+P → Save as PDF' });
  };

  const handleOpenSponsor = () => {
    openForPrint(generateSponsorHTML(proposalCustomization, venueName), `Proposal-Sponsor-${proposalCustomization.eventName}.html`);
    toast.success('Proposal Sponsor dibuka di tab baru', { description: 'Ctrl+P → Save as PDF' });
  };

  const handleBack = () => { dispatch({ type: 'SET_STEP', payload: 'proposal-customize' }); setLocation('/phase1/proposal-customize'); };
  const handleComplete = () => { dispatch({ type: 'SET_STEP', payload: 'complete' }); setLocation('/phase1/complete'); toast.success('Event setup complete!'); };

  const employerChecklist = ['Cover page dengan info event', 'Statistik peserta & event', 'Program utama & pendukung', 'Paket booth + harga + fasilitas', 'Target industri & segmen peserta', 'Langkah pendaftaran', 'Kontak panitia'];
  const sponsorChecklist = ['Cover page sponsorship', 'Statistik reach & peserta', 'Keuntungan menjadi sponsor', 'Tier sponsorship + benefit lengkap', 'Target industri & bidang keahlian', 'Langkah konfirmasi sponsorship', 'Kontak tim sponsorship'];

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">Preview Proposal</h1>
          <p className="text-lg text-muted-foreground">Review dan download proposal untuk <strong>{clientIntake.eventName}</strong></p>
        </div>

        <Card className="p-6 mb-8 border border-border bg-secondary/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><div className="text-sm text-muted-foreground">Event</div><div className="font-semibold">{proposalCustomization.eventName}</div></div>
            <div><div className="text-sm text-muted-foreground">Tanggal</div><div className="font-semibold">{proposalCustomization.eventDate}</div></div>
            <div><div className="text-sm text-muted-foreground">Venue</div><div className="font-semibold">{venueName || proposalCustomization.venueLocation}</div></div>
            <div><div className="text-sm text-muted-foreground">Peserta</div><div className="font-semibold">{parseInt(proposalCustomization.expectedAttendees).toLocaleString('id-ID')}</div></div>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'employer' | 'sponsor')} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="employer" className="gap-2"><Building2 className="w-4 h-4" /> Proposal Employer</TabsTrigger>
            <TabsTrigger value="sponsor" className="gap-2"><Handshake className="w-4 h-4" /> Proposal Sponsor</TabsTrigger>
          </TabsList>

          <TabsContent value="employer" className="mt-6">
            <Card className="p-8 border border-border">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-display font-bold mb-1">Proposal Employer</h2>
                  <p className="text-muted-foreground text-sm">Untuk perusahaan yang ingin membeli booth dan hadir di event</p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">{proposalCustomization.boothPackages.length} paket booth</span>
              </div>
              <div className="bg-secondary/40 rounded-xl p-6 mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Isi Dokumen (3 halaman)</p>
                <div className="grid grid-cols-2 gap-2">
                  {employerChecklist.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="text-green-500 font-bold">✓</span> {item}
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3 mt-4">
                  <p className="text-xs text-muted-foreground">Paket: {proposalCustomization.boothPackages.map(b => `${b.name} (${b.dimensions}) Rp ${b.price.toLocaleString('id-ID')}`).join(' · ')}</p>
                </div>
              </div>
              <Button onClick={handleOpenEmployer} size="lg" className="w-full gap-2 bg-terracotta hover:bg-terracotta/90 text-white">
                <Eye className="w-4 h-4" /> Buka Preview &amp; Download PDF
              </Button>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Tab baru terbuka → tekan <kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">Ctrl+P</kbd> → pilih <strong>Save as PDF</strong>
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="sponsor" className="mt-6">
            <Card className="p-8 border border-border">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-display font-bold mb-1">Proposal Sponsor</h2>
                  <p className="text-muted-foreground text-sm">Untuk brand/perusahaan yang ingin mendanai event tanpa booth rekrutmen</p>
                </div>
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-3 py-1 rounded-full">{proposalCustomization.sponsorTiers.length} tier</span>
              </div>
              <div className="bg-secondary/40 rounded-xl p-6 mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Isi Dokumen (3 halaman)</p>
                <div className="grid grid-cols-2 gap-2">
                  {sponsorChecklist.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="text-green-500 font-bold">✓</span> {item}
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3 mt-4">
                  <p className="text-xs text-muted-foreground">Tier: {proposalCustomization.sponsorTiers.map(t => `${t.name} Rp ${t.price.toLocaleString('id-ID')}`).join(' · ')}</p>
                </div>
              </div>
              <Button onClick={handleOpenSponsor} size="lg" className="w-full gap-2 bg-purple-700 hover:bg-purple-800 text-white">
                <Eye className="w-4 h-4" /> Buka Preview &amp; Download PDF
              </Button>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Tab baru terbuka → tekan <kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">Ctrl+P</kbd> → pilih <strong>Save as PDF</strong>
              </p>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="p-5 border border-border mb-8 bg-secondary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Download Keduanya Sekaligus</p>
              <p className="text-xs text-muted-foreground">Buka kedua proposal dalam tab terpisah</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => { handleOpenEmployer(); setTimeout(handleOpenSponsor, 600); }}>
              <Download className="w-4 h-4" /> Buka Keduanya
            </Button>
          </div>
        </Card>

        <div className="flex gap-4 justify-between">
          <Button variant="outline" onClick={handleBack} className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Kembali
          </Button>
          <Button onClick={handleComplete} size="lg" className="gap-2">
            <FileText className="w-4 h-4" /> Selesai — Lanjut ke Financial Planner
          </Button>
        </div>
      </div>
    </div>
  );
}
