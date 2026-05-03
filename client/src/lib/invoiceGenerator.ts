// ── Invoice Generator for GR2026 Employer Booking ──────────────

export interface BookingData {
  bookingId: string;
  bookingDate: string;
  companyName: string;
  industry: string;
  city: string;
  website?: string;
  pic1: { name: string; title: string; email: string; whatsapp: string };
  pic2?: { name: string; title: string; email: string; whatsapp: string };
  positions: { position: string; customPosition: string; count: number }[];
  booths: { boothId: string; label: string; type: "main" | "standard" | "extra"; price: number }[];
  needsBoothDesign: boolean;
  specialRequest: string;
  totalAmount: number;
  paymentDeadline: string; // H-7 before event
  lunasStamp?: boolean;   // show LUNAS watermark
  lunasDate?: string;     // date of payment approval
}

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

export function generateInvoiceHTML(data: BookingData): string {
  const boothRows = data.booths.map((b, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${b.type === "main" ? "Main Booth (5×5m)" : b.type === "extra" ? "Extra Booth" : "Standard Booth (3×3m)"} — ${b.label}</td>
      <td style="text-align:center">1</td>
      <td style="text-align:right">${fmt(b.price)}</td>
      <td style="text-align:right">${fmt(b.price)}</td>
    </tr>`).join("");

  const positionList = data.positions
    .filter(p => p.position || p.customPosition)
    .map(p => `<li>${p.position || p.customPosition} — ${p.count} kandidat</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<title>Invoice Booking — ${data.bookingId}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; color: #1a1a1a; background: #fff; font-size: 11pt; }
  @page { margin: 15mm; size: A4 portrait; }
  @media print {
    body { font-size: 10pt; }
    .no-print { display: none !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }

  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #0d9488; }
  .logo-area h1 { font-size: 22px; color: #0d9488; font-weight: 900; letter-spacing: -0.5px; }
  .logo-area p { font-size: 10px; color: #666; margin-top: 3px; }
  .invoice-meta { text-align: right; }
  .invoice-meta .inv-label { font-size: 28px; font-weight: 900; color: #0a1628; letter-spacing: -1px; }
  .invoice-meta .inv-id { font-size: 13px; color: #0d9488; font-weight: 700; margin-top: 4px; }
  .invoice-meta .inv-date { font-size: 11px; color: #666; margin-top: 2px; }

  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .info-box h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #666; margin-bottom: 10px; }
  .info-box p { font-size: 11px; line-height: 1.7; color: #333; }
  .info-box strong { color: #1a1a1a; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead tr { background: #0a1628; color: white; }
  thead th { padding: 10px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  tbody tr { border-bottom: 1px solid #f0f0f0; }
  tbody tr:nth-child(even) { background: #f8fffe; }
  tbody td { padding: 10px 12px; font-size: 11px; }

  .total-section { margin-left: auto; width: 280px; }
  .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 11px; border-bottom: 1px solid #f0f0f0; }
  .total-final { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; font-weight: 900; color: #0d9488; border-top: 2px solid #0d9488; margin-top: 4px; }

  .payment-box { background: #f0fdfb; border: 1.5px solid #0d9488; border-radius: 10px; padding: 18px; margin-top: 24px; }
  .payment-box h3 { color: #0d9488; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
  .pay-row { display: flex; gap: 16px; margin-bottom: 8px; font-size: 11px; }
  .pay-label { color: #666; width: 130px; flex-shrink: 0; }
  .pay-value { font-weight: 700; color: #1a1a1a; }
  .pay-value.amount { color: #B8860B; font-size: 14px; }

  .deadline-box { background: #fff7ed; border: 1.5px solid #f97316; border-radius: 10px; padding: 14px 18px; margin-top: 16px; display: flex; align-items: center; gap: 12px; }
  .deadline-box .icon { font-size: 20px; flex-shrink: 0; }
  .deadline-box p { font-size: 11px; color: #9a3412; line-height: 1.6; }
  .deadline-box strong { color: #c2410c; }

  .positions-box { background: #f8f9fa; border-radius: 8px; padding: 14px 18px; margin-top: 20px; }
  .positions-box h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 10px; }
  .positions-box ul { padding-left: 18px; }
  .positions-box li { font-size: 11px; color: #333; margin-bottom: 4px; }

  .design-note { background: #fef9ec; border: 1px solid #D4A017; border-radius: 8px; padding: 12px 16px; margin-top: 16px; font-size: 11px; color: #7c5a00; }

  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 9px; color: #999; line-height: 1.6; }
</style>
</head>
<body>

<div class="header">
  <div class="logo-area">
    <h1>GRAND RECRUITMENT 2026</h1>
    <p>The International Hospitality and Tourism Job Fair</p>
    <p>10–11 Juni 2026 · Gedung Dome NHI Bandung</p>
    <p style="margin-top:6px;font-size:10px;color:#666">Politeknik Pariwisata NHI Bandung</p>
  </div>
  <div class="invoice-meta">
    <div class="inv-label">INVOICE</div>
    <div class="inv-id">${data.bookingId}</div>
    <div class="inv-date">Tanggal: ${data.bookingDate}</div>
  </div>
</div>

<div class="info-grid">
  <div class="info-box">
    <h3>Ditagihkan Kepada</h3>
    <p>
      <strong>${data.companyName}</strong><br/>
      ${data.industry}<br/>
      ${data.city}${data.website ? `<br/>${data.website}` : ""}
    </p>
    <p style="margin-top:10px">
      <strong>PIC:</strong> ${data.pic1.name}<br/>
      ${data.pic1.title}<br/>
      ${data.pic1.email}<br/>
      WhatsApp: ${data.pic1.whatsapp}
    </p>
  </div>
  <div class="info-box">
    <h3>Dari</h3>
    <p>
      <strong>Koperasi Poltekpar NHI Bandung</strong><br/>
      Politeknik Pariwisata NHI Bandung<br/>
      Jl. Dr. Setiabudi No. 186, Bandung<br/>
      grandrecruitment@nhi.ac.id
    </p>
    <p style="margin-top:10px">
      <strong>Status Booking:</strong> <span style="color:#f97316;font-weight:700">Menunggu Pembayaran</span><br/>
      <strong>Batas Bayar:</strong> <span style="color:#c2410c;font-weight:700">${data.paymentDeadline}</span>
    </p>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th style="width:40px">No.</th>
      <th>Deskripsi</th>
      <th style="text-align:center;width:60px">Qty</th>
      <th style="text-align:right;width:130px">Harga Satuan</th>
      <th style="text-align:right;width:130px">Subtotal</th>
    </tr>
  </thead>
  <tbody>
    ${boothRows}
    ${data.needsBoothDesign ? `<tr><td>${data.booths.length + 1}</td><td>Booth Design Service <em style="color:#666;font-size:10px">(estimasi dari vendor — ditagih terpisah)</em></td><td style="text-align:center">1</td><td style="text-align:right">—</td><td style="text-align:right">—</td></tr>` : ""}
  </tbody>
</table>

<div class="total-section">
  <div class="total-row"><span>Subtotal Booth</span><span>${fmt(data.totalAmount)}</span></div>
  <div class="total-row"><span>PPN (0%)</span><span>Rp 0</span></div>
  <div class="total-final"><span>TOTAL PEMBAYARAN</span><span>${fmt(data.totalAmount)}</span></div>
</div>

<div class="payment-box">
  <h3>🏦 Instruksi Pembayaran</h3>
  <div class="pay-row"><span class="pay-label">Bank</span><span class="pay-value">Bank BTN</span></div>
  <div class="pay-row"><span class="pay-label">No. Rekening</span><span class="pay-value">0095 01 30 00000 38</span></div>
  <div class="pay-row"><span class="pay-label">Atas Nama</span><span class="pay-value">Koperasi STP Bandung</span></div>
  <div class="pay-row"><span class="pay-label">Nominal</span><span class="pay-value amount">${fmt(data.totalAmount)}</span></div>
  <div class="pay-row"><span class="pay-label">Berita Transfer</span><span class="pay-value">${data.bookingId}</span></div>
</div>

<div class="deadline-box">
  <div class="icon">⏰</div>
  <p>
    Harap lakukan pembayaran paling lambat <strong>${data.paymentDeadline}</strong> (H-7 sebelum acara).<br/>
    Booking yang belum dikonfirmasi pembayarannya akan otomatis dibatalkan dan booth akan dilepas ke publik.
    Setelah pembayaran, kirim bukti transfer ke WhatsApp panitia atau email di atas.
  </p>
</div>

${positionList ? `
<div class="positions-box">
  <h3>Posisi Rekrutmen yang Dibuka</h3>
  <ul>${positionList}</ul>
</div>` : ""}

${data.needsBoothDesign ? `
<div class="design-note">
  <strong>📐 Booth Design Request:</strong> Anda telah meminta layanan desain booth interior.
  Tim kami akan mengirimkan form desain dan menghubungkan Anda dengan vendor dekorasi rekanan.
  Biaya desain akan ditagih terpisah oleh vendor.
</div>` : ""}

${data.specialRequest ? `
<div style="margin-top:16px;padding:12px 16px;background:#f8f9fa;border-radius:8px;font-size:11px;color:#333">
  <strong>Catatan / Special Request:</strong><br/>${data.specialRequest}
</div>` : ""}

<div class="footer">
  Invoice ini dibuat secara otomatis oleh sistem Grand Recruitment 2026.<br/>
  Pertanyaan? Hubungi kami di grandrecruitment@nhi.ac.id | WhatsApp: 0812-xxxx-xxxx<br/>
  Grand Recruitment 2026 · Politeknik Pariwisata NHI Bandung · 10–11 Juni 2026
</div>

${data.lunasStamp ? `
<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);pointer-events:none;z-index:100;text-align:center;opacity:0.18">
  <div style="font-size:120px;font-weight:900;color:#dc2626;border:12px solid #dc2626;border-radius:16px;padding:8px 32px;line-height:1;letter-spacing:8px;font-family:Arial,sans-serif;">LUNAS</div>
  ${data.lunasDate ? `<div style="font-size:18px;color:#dc2626;font-weight:700;margin-top:8px;letter-spacing:2px;">${data.lunasDate}</div>` : ""}
</div>
<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);pointer-events:none;z-index:100;text-align:center;">
  <div style="font-size:120px;font-weight:900;color:transparent;border:12px solid #dc2626;border-radius:16px;padding:8px 32px;line-height:1;letter-spacing:8px;font-family:Arial,sans-serif;-webkit-text-stroke:4px #dc2626;">LUNAS</div>
  ${data.lunasDate ? `<div style="font-size:18px;color:#dc2626;font-weight:700;margin-top:8px;letter-spacing:2px;">${data.lunasDate}</div>` : ""}
</div>
` : ""}
</body></html>`;
}

export function openInvoiceForPrint(data: BookingData) {
  const html = generateInvoiceHTML(data);
  // Tambah tombol Print/Save PDF di pojok kanan bawah (tanpa auto-print)
  const printableHtml = html.replace(
    "</body></html>",
    `<div style="position:fixed;bottom:24px;right:24px;z-index:999;display:flex;gap:10px">
      <button onclick="window.print()" style="background:#0d9488;color:#fff;border:none;border-radius:10px;padding:12px 24px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(13,148,136,0.4)">
        🖨️ Print / Save PDF
      </button>
    </div>
    </body></html>`
  );
  const blob = new Blob([printableHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  // Buka di tab baru (bukan popup)
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}


// ── ID Generators ─────────────────────────────────────────────
const INDUSTRY_CODES: Record<string, string> = {
  "Hotel & Resort":       "HTL",
  "Restaurant & F&B":    "FNB",
  "Travel & Tour":       "TRV",
  "Event Organizer":     "EVT",
  "Spa & Wellness":      "SPA",
  "Cruise":              "CRS",
  "Airline":             "AIR",
  "Education":           "EDU",
  "Others":              "OTH",
};

function getIndustryCode(industry: string): string {
  return INDUSTRY_CODES[industry] || industry.slice(0, 3).toUpperCase();
}

function nameCode(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] || "";
  const lastInit = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + lastInit).toUpperCase().slice(0, 8);
}

function getCounter(): string {
  const key = "gr2026_id_counter";
  const current = parseInt(localStorage.getItem(key) || "0") + 1;
  localStorage.setItem(key, String(current));
  return String(current).padStart(4, "0");
}

export function generateBookingId(picName?: string, industry?: string): string {
  const yr = "26";
  const nc = picName ? nameCode(picName) : "EMP";
  const ic = industry ? getIndustryCode(industry) : "OTH";
  const no = getCounter();
  return `E-${nc}-${ic}-${yr}-${no}`;
}

export function generateJobseekerId(params: {
  namaLengkap: string;
  institusi?: string;
  tahunLulus?: string;
  isAlumniNHI?: boolean;
}): string {
  const { namaLengkap, institusi, tahunLulus, isAlumniNHI } = params;
  const firstName = namaLengkap.trim().split(/\s+/)[0].toUpperCase().slice(0, 6);
  
  // Institution code: NHI for alumni, first 3 chars of institusi for others
  let instCode = "UNI";
  if (isAlumniNHI) {
    instCode = "NHI";
  } else if (institusi) {
    instCode = institusi.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "UNI";
  }

  // Graduation year (2 digits)
  const lulusYr = tahunLulus ? String(tahunLulus).slice(-2) : "00";
  const yr = "26"; // event year
  const no = getCounter();

  return `JS-${firstName}-${instCode}-${lulusYr}-${yr}-${String(parseInt(no)).padStart(3,"0")}`;
}

export function getPaymentDeadline(): string {
  // H-7 before June 10, 2026 = June 3, 2026
  return "1 Juni 2026";
}


// ── ID Card Generator for GR2026 Jobseeker ──────────────────
export function generateIdCardHTML(data: {
  registrationId: string;
  namaLengkap: string;
  institusi?: string;
  jurusan?: string;
  bidangMinat?: string;
  status?: string;
  fotoUrl?: string;
}): string {
  const qrData = encodeURIComponent(`GR2026|${data.registrationId}|${data.namaLengkap}`);
  const qrUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${qrData}&choe=UTF-8&chld=M|1`;

  const statusLabel: Record<string, string> = {
    mahasiswa: "Mahasiswa", fresh_graduate: "Fresh Graduate",
    alumni_nhi: "Alumni NHI Bandung", umum: "Pencari Kerja",
  };

  const fotoSection = data.fotoUrl
    ? `<img src="${data.fotoUrl}" style="width:100%;height:100%;object-fit:cover;object-position:center 15%;display:block;" />`
    : `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2mm;">
        <div style="width:14mm;height:14mm;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:14px;">👤</div>
        <div style="font-size:4px;color:rgba(255,255,255,0.4);text-align:center;line-height:1.5;">Tempel<br/>foto<br/>3×4 cm</div>
      </div>`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<title>ID Card GR2026 — ${data.registrationId}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background: #cbd5e1;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: 100vh;
    font-family: 'Arial', sans-serif;
    padding: 2rem;
  }
  @page { size: 54mm 90mm portrait; margin: 0; }
  @media print {
    body { background: white; padding: 0; margin: 0; display: block; }
    .no-print { display: none !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }

  /* ── CARD 54x90mm portrait ── */
  .card {
    width: 54mm;
    height: 90mm;
    background: white;
    border-radius: 3mm;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  }

  /* Header bar */
  .header-bar {
    background: linear-gradient(135deg, #0a1628, #0d4f47);
    padding: 3mm 3mm 2mm 3mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1mm;
    flex-shrink: 0;
    max-height: 18mm;
    overflow: hidden;
  }
  .logo-img, .header-bar img {
    height: 8mm; width: auto; object-fit: contain;
  }
  .logo-row { display: flex; align-items: center; gap: 1.5mm; }
  .logo-dot {
    width: 6mm; height: 6mm;
    border-radius: 50%;
    background: #D4A017;
    display: flex; align-items: center; justify-content: center;
    font-size: 5px; font-weight: 900; color: #0a1628;
  }
  .logo-words .l1 { font-size: 5.5px; font-weight: 900; color: #D4A017; text-transform: uppercase; letter-spacing: 0.3px; }
  .logo-words .l2 { font-size: 3.5px; color: rgba(255,255,255,0.6); text-transform: uppercase; }
  .badge-js {
    background: #0d9488;
    color: white; font-size: 4.5px; font-weight: 700;
    padding: 0.8mm 2mm; border-radius: 1mm;
    text-transform: uppercase; letter-spacing: 0.5px;
  }

  /* Foto area */
  .foto-area {
    width: 100%;
    height: 38mm;
    background: #0a1628;
    overflow: hidden;
    flex-shrink: 0;
  }

  /* Info area */
  .info-area {
    flex: 1;
    padding: 3mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: white;
  }
  .name {
    font-size: 13px; font-weight: 900;
    color: #0a1628; line-height: 1.2;
    margin-bottom: 2mm;
    word-break: break-word;
    text-align: center;
  }
  .info-line {
    font-size: 7.5px; color: #4b5563;
    line-height: 1.8;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  /* Bottom */
  .bottom-strip {
    background: #f8fafc;
    border-top: 0.5px solid #e2e8f0;
    padding: 2mm 3mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5mm;
  }
  .reg-pill {
    font-family: monospace;
    font-size: 6px; font-weight: 700;
    color: #0d9488;
    background: rgba(13,148,136,0.08);
    border: 0.5px solid rgba(13,148,136,0.3);
    padding: 1mm 2mm; border-radius: 1mm;
    letter-spacing: 0.3px;
  }
  .qr-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1mm;
  }
  .qr-img { width: 14mm; height: 14mm; display: block; }
  .qr-label {
    font-size: 3.5px; color: #94a3b8;
    text-align: center; line-height: 1.4;
    text-transform: uppercase; letter-spacing: 0.3px;
  }
  .event-info {
    font-size: 4px; color: #94a3b8;
    text-align: center; line-height: 1.6;
  }

  /* Print UI */
  .preview-label { font-size: 13px; color: #555; margin-bottom: 16px; text-align: center; font-weight: 600; }
  .btn-group { display: flex; gap: 12px; margin-top: 20px; }
  .btn { padding: 10px 24px; border-radius: 8px; border: none; font-size: 14px; font-weight: 700; cursor: pointer; }
  .btn-print { background: #0d9488; color: white; box-shadow: 0 4px 12px rgba(13,148,136,0.3); }
  .btn-close  { background: #f1f5f9; color: #334155; }
  .hint { margin-top: 12px; font-size: 11px; color: #888; text-align: center; max-width: 360px; line-height: 1.7; }
</style>
</head>
<body>

<div class="preview-label no-print">Preview ID Card GR2026 &nbsp;·&nbsp; Ukuran cetak: 5.4 × 9 cm</div>

<div class="card">

  <!-- Header -->
  <div class="header-bar">
    <img src="/logo-gr2026.png" alt="Grand Recruitment 2026"
      style="height:9mm;width:auto;object-fit:contain;max-width:48mm;"
      onerror="this.style.display='none';document.getElementById('logo-fallback').style.display='flex'"/>
    <div id="logo-fallback" style="display:none;align-items:center;gap:1.5mm;">
      <div class="logo-dot">GR</div>
      <div class="logo-words">
        <div class="l1">Grand Recruitment 2026</div>
        <div class="l2">Politeknik Pariwisata NHI Bandung</div>
      </div>
    </div>
    <div class="badge-js">Jobseeker</div>
  </div>

  <!-- Foto -->
  <div class="foto-area">${fotoSection}</div>

  <!-- Info -->
  <div class="info-area">
    <div>
      <div class="name">${data.namaLengkap}</div>
      ${data.institusi   ? `<div class="info-line">🎓 ${data.institusi}</div>` : ''}
      ${data.jurusan     ? `<div class="info-line">📚 ${data.jurusan}</div>` : ''}
      ${data.bidangMinat ? `<div class="info-line">💼 ${data.bidangMinat}</div>` : ''}
      ${data.status      ? `<div class="info-line">👤 ${statusLabel[data.status] || data.status}</div>` : ''}
    </div>

    <div class="bottom-strip">
      <div class="reg-pill">${data.registrationId}</div>
      <div class="qr-wrap">
        <img class="qr-img" src="${qrUrl}" alt="QR Code"
          onerror="this.outerHTML='<div style=\'width:14mm;height:14mm;background:#f1f5f9;border:1px dashed #cbd5e1;border-radius:1mm;display:flex;align-items:center;justify-content:center;font-size:8px;color:#94a3b8\'>QR</div>'"/>
        <div class="qr-label">Scan untuk verifikasi</div>
      </div>
      <div class="event-info">10–11 Juni 2026 · Dome NHI Bandung</div>
    </div>
  </div>

</div>

<div class="btn-group no-print">
  <button class="btn btn-print" onclick="window.print()">🖨️ Print / Save PDF</button>
  <button class="btn btn-close"  onclick="window.close()">✕ Tutup</button>
</div>
<p class="hint no-print">
  💡 Saat print pilih <strong>Save as PDF</strong> · Cetak di kertas foto atau karton 260gsm · Laminasi agar tahan lama
</p>

<script>
  window.addEventListener("load", function() {
    setTimeout(function() { window.print(); }, 900);
  });
</script>
</body>
</html>`;
}

export interface IdCardData {
  registrationId: string;
  namaLengkap: string;
  institusi?: string;
  jurusan?: string;
  bidangMinat?: string;
  status?: string;
  fotoUrl?: string;
}

export function openIdCardForPrint(data: IdCardData): void {
  const html = generateIdCardHTML(data);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank", "width=420,height=660");
  if (win) {
    win.addEventListener("load", () => setTimeout(() => URL.revokeObjectURL(url), 15000));
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = `IDCard-GR2026-${data.registrationId}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
