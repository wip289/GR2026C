// ── Invoice Generator for GR2026 Employer Booking ──────────────

// ── Exhibitor Order Catalog (tanpa gambar, untuk invoice) ──────
const EO_CATALOG: Record<string, { label: string; harga: number; unit: string; per: "hari" | "event" }> = {
  eo_kursi:       { label: "Kursi + cover hitam",                                          harga: 25000,   unit: "buah",  per: "hari"  },
  eo_meja:        { label: "Meja + cover hitam",                                           harga: 125000,  unit: "buah",  per: "hari"  },
  eo_barstool_h:  { label: "Hidrolik barstool hitam",                                      harga: 150000,  unit: "buah",  per: "hari"  },
  eo_barstool_m:  { label: "Melinda barstool putih",                                       harga: 150000,  unit: "buah",  per: "hari"  },
  eo_bartable:    { label: "Bartable lingkaran Ø75×100cm putih",                           harga: 100000,  unit: "buah",  per: "hari"  },
  eo_meja_kaca:   { label: "Meja kaca Ø80×75cm",                                          harga: 150000,  unit: "buah",  per: "hari"  },
  eo_sofa:        { label: "Kursi sofa single hitam",                                      harga: 300000,  unit: "buah",  per: "hari"  },
  eo_tv42:        { label: "TV 42 Inch + standing + rangka",                               harga: 750000,  unit: "unit",  per: "hari"  },
  eo_tv55:        { label: "TV 55 Inch + standing + rangka",                               harga: 1500000, unit: "unit",  per: "hari"  },
  eo_listrik2a:   { label: "Listrik tambahan 2 Ampere",                                    harga: 250000,  unit: "titik", per: "hari"  },
  eo_listrik4a:   { label: "Listrik tambahan 4 Ampere",                                    harga: 400000,  unit: "titik", per: "hari"  },
  eo_kabel:       { label: "Perpanjangan Kabel + Socket 3 lubang",                        harga: 250000,  unit: "buah",  per: "hari"  },
  eo_zigzag:      { label: "Zigzag standing brochure rack",                                harga: 450000,  unit: "buah",  per: "hari"  },
  eo_acrylic:     { label: "Acrylic display brosur A5 3 susun",                           harga: 150000,  unit: "buah",  per: "event" },
  eo_tripod:      { label: "Tripod banner (base polyfoam + printing A3 by client)",       harga: 175000,  unit: "buah",  per: "hari"  },
  eo_xbanner:     { label: "X Banner 60×160cm + rangka X (design by client)",             harga: 175000,  unit: "buah",  per: "event" },
  eo_rollbanner:  { label: "Roll Banner 80×200cm + rangka roll (design by client)",       harga: 425000,  unit: "buah",  per: "event" },
  eo_displaybox:  { label: "Display Box Medium 50×50×70cm (bahan partisi)",               harga: 757000,  unit: "buah",  per: "hari"  },
  eo_floor33:     { label: "Flooring panel 3×3, tinggi 10cm + karpet + pasang bongkar",  harga: 1575000, unit: "paket", per: "event" },
  eo_floor55:     { label: "Flooring panel 5×5, tinggi 10cm + karpet + pasang bongkar",  harga: 4375000, unit: "paket", per: "event" },
  eo_floor42:     { label: "Flooring panel 4×2, tinggi 10cm + karpet + pasang bongkar",  harga: 1400000, unit: "paket", per: "event" },
  eo_backdrop33:  { label: "Backdrop panel 3×2, tinggi 2.5m + printing (design by client)", harga: 2250000, unit: "paket", per: "event" },
  eo_backdrop52:  { label: "Backdrop panel 5×2, tinggi 2.5m + printing (design by client)", harga: 5000000, unit: "paket", per: "event" },
  eo_backdrop42:  { label: "Backdrop panel 4×2, tinggi 2.5m + printing (design by client)", harga: 4687500, unit: "paket", per: "event" },
  eo_wall33:      { label: "Wall sticker 3×2.5m + print + pasang (Booth 3×3)",           harga: 2812500, unit: "sisi",  per: "event" },
  eo_wall55:      { label: "Wall sticker 5×2.5m + print + pasang (Booth 5×5)",           harga: 2187500, unit: "sisi",  per: "event" },
  eo_wall42:      { label: "Wall sticker 4×2.5m + print + pasang (Booth 4×2)",           harga: 1750000, unit: "sisi",  per: "event" },
  eo_bunga_meja:  { label: "Rangkaian bunga meja",                                        harga: 350000,  unit: "buah",  per: "event" },
  eo_anggrek:     { label: "Bunga meja Anggrek 1 tangkai",                                harga: 250000,  unit: "buah",  per: "event" },
  eo_bunga_tinggi:{ label: "Rangkaian bunga tinggi 80cm",                                 harga: 500000,  unit: "buah",  per: "event" },
  eo_rope:        { label: "Rope Barrier – QLine tinggi 90cm (per tiang)",               harga: 100000,  unit: "tiang", per: "hari"  },
  eo_sampah:      { label: "Tempat sampah Ø28×28cm",                                     harga: 75000,   unit: "buah",  per: "event" },
  eo_kain:        { label: "Kain hitam polos per meter",                                  harga: 125000,  unit: "meter", per: "event" },
};

export interface FacilityItem {
  label: string;
  qty: number;
  unit: string;
  pricePerDay: number;
  days: number;
}

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
  totalAmount: number;        // booth subtotal only
  paymentDeadline: string;
  lunasStamp?: boolean;
  lunasDate?: string;
  discountAmount?: number;    // diskon dalam Rupiah
  discountNote?: string;      // keterangan diskon (opsional)
  // Fasilitas & Paket tambahan
  facilities?: FacilityItem[];
  paketBooth?: { nama: string; harga: number; spesifikasi: string } | null;
  facilityTotal?: number;
  // Raw exhibitor order JSON — diparse otomatis di invoice jika facilities kosong
  exhibitorOrder?: Record<string, number> | string;
}

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

// ── Terbilang (angka → huruf Bahasa Indonesia) ────────────────
function terbilang(n: number): string {
  const satuan = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan",
    "sepuluh", "sebelas", "dua belas", "tiga belas", "empat belas", "lima belas", "enam belas",
    "tujuh belas", "delapan belas", "sembilan belas"];
  function eja(x: number): string {
    if (x < 20) return satuan[x];
    if (x < 100) return satuan[Math.floor(x / 10)] + " puluh" + (x % 10 ? " " + satuan[x % 10] : "");
    if (x < 200) return "seratus" + (x % 100 ? " " + eja(x % 100) : "");
    if (x < 1000) return satuan[Math.floor(x / 100)] + " ratus" + (x % 100 ? " " + eja(x % 100) : "");
    if (x < 2000) return "seribu" + (x % 1000 ? " " + eja(x % 1000) : "");
    if (x < 1_000_000) return eja(Math.floor(x / 1000)) + " ribu" + (x % 1000 ? " " + eja(x % 1000) : "");
    if (x < 1_000_000_000) return eja(Math.floor(x / 1_000_000)) + " juta" + (x % 1_000_000 ? " " + eja(x % 1_000_000) : "");
    return eja(Math.floor(x / 1_000_000_000)) + " miliar" + (x % 1_000_000_000 ? " " + eja(x % 1_000_000_000) : "");
  }
  const result = eja(Math.round(n));
  return result.charAt(0).toUpperCase() + result.slice(1) + " Rupiah";
}

// ── Grand total helper ────────────────────────────────────────
function calcGrandTotal(data: BookingData): number {
  const subtotalBooth = data.totalAmount;
  const facTotal = data.facilityTotal || 0;
  const disc = data.discountAmount || 0;
  return subtotalBooth + facTotal - disc;
}

// ── Shared CSS ────────────────────────────────────────────────
const BASE_CSS = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; color: #1a1a1a; background: #fff; font-size: 10pt; }
  @page { margin: 12mm 14mm; size: A4 portrait; }
  @media print {
    body { font-size: 9.5pt; }
    .no-print { display: none !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }

  /* Header */
  .doc-header {
    background: #0a1628; color: #fff;
    padding: 14px 20px;
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 18px;
  }
  .brand-title { font-size: 13px; font-weight: 700; color: #14b8a6; letter-spacing: 0.3px; }
  .brand-sub { font-size: 8.5px; color: #94a3b8; line-height: 1.6; margin-top: 2px; }
  .doc-meta { text-align: right; }
  .doc-meta-label { font-size: 20px; font-weight: 700; color: #fff; letter-spacing: 2px; }
  .doc-meta-id { font-size: 10px; color: #14b8a6; font-family: monospace; margin-top: 3px; }
  .doc-meta-date { font-size: 9px; color: #94a3b8; margin-top: 2px; }

  /* Parties */
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 0.5px solid #e2e8f0; }
  .p-label { font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 5px; }
  .p-name { font-size: 11px; font-weight: 700; color: #0a1628; margin-bottom: 2px; }
  .p-detail { font-size: 9px; color: #64748b; line-height: 1.7; }

  /* Table */
  table { width: 100%; border-collapse: collapse; margin-bottom: 14px; table-layout: fixed; }
  thead tr { background: #0a1628; }
  thead th { padding: 7px 8px; text-align: left; font-size: 8px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap; }
  thead th.r { text-align: right; }
  tbody td { padding: 7px 8px; font-size: 9.5px; color: #1a1a1a; border-bottom: 0.5px solid #f0f0f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  tbody td.wrap { white-space: normal; }
  tbody td.r { text-align: right; }
  tbody tr.cat td { background: #f1f5f9; font-size: 8px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; padding: 5px 8px; }
  .td-sub { font-size: 8.5px; color: #94a3b8; margin-top: 2px; white-space: normal; }

  /* Totals */
  .totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 14px; }
  .totals-box { width: 230px; }
  .t-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 9.5px; color: #64748b; border-bottom: 0.5px solid #f0f0f0; white-space: nowrap; }
  .t-row span:last-child { color: #1a1a1a; }
  .t-row.disc span:last-child { color: #0d9488; font-weight: 700; }
  .t-grand { display: flex; justify-content: space-between; padding: 9px 11px; background: #0a1628; border-radius: 6px; margin-top: 6px; }
  .t-grand span:first-child { font-size: 10px; font-weight: 700; color: #94a3b8; }
  .t-grand span:last-child { font-size: 12px; font-weight: 700; color: #D4A017; }

  /* Payment box */
  .pay-box { background: #f0fdfb; border: 1px solid #0d9488; border-radius: 7px; padding: 12px 16px; margin-bottom: 12px; }
  .pay-title { font-size: 8px; font-weight: 700; color: #0d9488; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; }
  .pay-row { display: flex; gap: 10px; margin-bottom: 5px; font-size: 9.5px; }
  .pay-lbl { color: #64748b; width: 110px; flex-shrink: 0; }
  .pay-val { font-weight: 700; color: #1a1a1a; }
  .pay-val.gold { color: #B8860B; font-size: 12px; }

  /* Deadline */
  .deadline { background: #fff7ed; border: 1px solid #f97316; border-radius: 7px; padding: 9px 13px; font-size: 9px; color: #9a3412; line-height: 1.6; margin-bottom: 14px; }

  /* Footer */
  .doc-footer { margin-top: 16px; padding-top: 10px; border-top: 0.5px solid #e2e8f0; text-align: center; font-size: 8px; color: #94a3b8; line-height: 1.6; }

  /* Print button */
  .print-btn { position: fixed; bottom: 20px; right: 20px; z-index: 999; background: #0d9488; color: #fff; border: none; border-radius: 9px; padding: 11px 22px; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(13,148,136,0.4); }
`;

// ── Invoice HTML ───────────────────────────────────────────────
export function generateInvoiceHTML(data: BookingData): string {
  const boothSubtotal = data.totalAmount;
  const facTotal = data.facilityTotal || 0;
  const paketHarga = data.paketBooth?.harga || 0;
  const exhibitorOnly = facTotal - paketHarga;
  const disc = data.discountAmount || 0;
  const grandTotal = calcGrandTotal(data);

  // Booth rows
  let rowNum = 1;
  const boothRows = data.booths.map(b => `
    <tr>
      <td style="width:26px">${rowNum++}</td>
      <td class="wrap">${b.type === "main" ? "Main Booth (5×5m)" : b.type === "extra" ? "Extra Booth (4×2m)" : "Standard Booth (3×3m)"} — <strong>${b.label}</strong>
        <div class="td-sub">Fascia nama, meja, kursi, listrik 4A, karpet, 2 slot interview</div>
      </td>
      <td>1</td>
      <td class="r">${fmt(b.price)}</td>
      <td class="r">${fmt(b.price)}</td>
    </tr>`).join("");

  // Paket row
  const paketRow = data.paketBooth ? `
    <tr class="cat"><td colspan="5">Paket Booth Khusus</td></tr>
    <tr>
      <td>${rowNum++}</td>
      <td class="wrap"><strong>${data.paketBooth.nama}</strong>
        <div class="td-sub">${data.paketBooth.spesifikasi}</div>
      </td>
      <td>1</td>
      <td class="r">${fmt(data.paketBooth.harga)}</td>
      <td class="r">${fmt(data.paketBooth.harga)}</td>
    </tr>` : "";

  // Facility rows
  const facilityRows = (data.facilities || []).filter(f => f.qty > 0).map(f => `
    <tr>
      <td>${rowNum++}</td>
      <td>${f.label}</td>
      <td>${f.qty} ${f.unit}${f.days > 1 ? ` × ${f.days} hari` : ""}</td>
      <td class="r">${fmt(f.pricePerDay)}${f.days > 1 ? "/hari" : ""}</td>
      <td class="r">${fmt(f.qty * f.pricePerDay * f.days)}</td>
    </tr>`).join("");

  // Exhibitor Order rows — parse dari exhibitorOrder JSON jika facilities kosong
  const resolvedEO: { label: string; qty: number; unit: string; harga: number; per: "hari" | "event" }[] = [];
  if ((data.facilities || []).length === 0 && data.exhibitorOrder) {
    const eoRaw = typeof data.exhibitorOrder === "string"
      ? JSON.parse(data.exhibitorOrder) as Record<string, number>
      : data.exhibitorOrder;
    for (const [key, qty] of Object.entries(eoRaw)) {
      if (qty > 0 && EO_CATALOG[key]) {
        resolvedEO.push({ ...EO_CATALOG[key], qty });
      }
    }
  }

  const exhibitorDetailRows = resolvedEO.map(item => {
    const days = item.per === "hari" ? 2 : 1;
    const subtotal = item.qty * item.harga * days;
    const qtyLabel = item.per === "hari" ? `${item.qty} ${item.unit} × 2 hari` : `${item.qty} ${item.unit}`;
    return `
    <tr>
      <td>${rowNum++}</td>
      <td class="wrap">${item.label}</td>
      <td>${qtyLabel}</td>
      <td class="r">${fmt(item.harga)}/${item.unit}/${item.per}</td>
      <td class="r">${fmt(subtotal)}</td>
    </tr>`;
  }).join("");

  // Fallback: jika tidak ada EO detail sama sekali tapi ada total
  const exhibitorRow = exhibitorOnly > 0 && (data.facilities || []).length === 0 && resolvedEO.length === 0 ? `
    <tr>
      <td>${rowNum++}</td>
      <td>Fasilitas Tambahan (Exhibitor Order)</td>
      <td>1</td>
      <td class="r">—</td>
      <td class="r">${fmt(exhibitorOnly)}</td>
    </tr>` : "";

  const designRow = data.needsBoothDesign ? `
    <tr>
      <td>${rowNum++}</td>
      <td>Booth Design & Dekorasi <em style="font-size:8px;color:#94a3b8">(ditagih terpisah oleh vendor)</em></td>
      <td>1</td>
      <td class="r">—</td>
      <td class="r">—</td>
    </tr>` : "";

  const facilitySection = (paketRow || facilityRows || exhibitorDetailRows || exhibitorRow) ? `
    <tr class="cat"><td colspan="5">Fasilitas Tambahan${data.paketBooth ? " (Exhibitor Order)" : ""}</td></tr>
    ${facilityRows}${exhibitorDetailRows}${exhibitorRow}${designRow}` : designRow ? `<tr class="cat"><td colspan="5">Layanan Tambahan</td></tr>${designRow}` : "";

  // Totals
  const subtotalRows = [
    `<div class="t-row"><span>Subtotal Booth</span><span>${fmt(boothSubtotal)}</span></div>`,
    data.paketBooth ? `<div class="t-row"><span>Paket Booth Khusus</span><span>${fmt(paketHarga)}</span></div>` : "",
    (exhibitorOnly > 0 || (data.facilities || []).filter(f => f.qty > 0).length > 0)
      ? `<div class="t-row"><span>Fasilitas Tambahan</span><span>${fmt(exhibitorOnly > 0 ? exhibitorOnly : (data.facilities || []).reduce((s, f) => s + f.qty * f.pricePerDay * f.days, 0))}</span></div>` : "",
    disc > 0 ? `<div class="t-row disc"><span>Diskon${data.discountNote ? ` (${data.discountNote})` : ""}</span><span>− ${fmt(disc)}</span></div>` : "",
    `<div class="t-row"><span>PPN (0%)</span><span>Rp 0</span></div>`,
  ].filter(Boolean).join("");

  const specialNote = data.specialRequest ? `
    <div style="margin-top:10px;padding:9px 13px;background:#f8fafc;border-radius:6px;font-size:9px;color:#475569">
      <strong>Special Request:</strong> ${data.specialRequest}
    </div>` : "";

  const lunasStamp = data.lunasStamp ? `
    <div style="position:fixed;top:42%;left:50%;transform:translate(-50%,-50%) rotate(-28deg);pointer-events:none;z-index:100;text-align:center;">
      <div style="font-size:80px;font-weight:900;color:#dc2626;border:10px solid #dc2626;border-radius:12px;padding:4px 24px;line-height:1;letter-spacing:6px;font-family:Arial,sans-serif;opacity:0.22;">LUNAS</div>
    </div>
    <div style="position:fixed;top:42%;left:50%;transform:translate(-50%,-50%) rotate(-28deg);pointer-events:none;z-index:101;text-align:center;">
      <div style="font-size:80px;font-weight:900;color:transparent;border:10px solid #dc2626;border-radius:12px;padding:4px 24px;line-height:1;letter-spacing:6px;font-family:Arial,sans-serif;-webkit-text-stroke:3px #dc2626;opacity:0.85;">LUNAS</div>
      ${data.lunasDate ? `<div style="font-size:14px;color:#dc2626;font-weight:700;margin-top:6px;letter-spacing:2px;opacity:0.85;">${data.lunasDate}</div>` : ""}
    </div>` : "";

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<title>Invoice — ${data.bookingId}</title>
<style>${BASE_CSS}</style>
</head>
<body>

<div class="doc-header">
  <div>
    <div class="brand-title">GRAND RECRUITMENT 2026</div>
    <div class="brand-sub">The International Hospitality &amp; Tourism Job Fair &nbsp;·&nbsp; 8–9 Juni 2026 · Gedung Dome NHI Bandung &nbsp;·&nbsp; Politeknik Pariwisata NHI Bandung</div>
  </div>
  <div class="doc-meta">
    <div class="doc-meta-label">INVOICE</div>
    <div class="doc-meta-id">${data.bookingId}</div>
    <div class="doc-meta-date">${data.bookingDate}</div>
  </div>
</div>

<div class="parties">
  <div>
    <div class="p-label">Ditagihkan kepada</div>
    <div class="p-name">${data.companyName}</div>
    <div class="p-detail">
      ${data.industry} · ${data.city}${data.website ? ` · ${data.website}` : ""}<br/>
      PIC: ${data.pic1.name}${data.pic1.title ? ` · ${data.pic1.title}` : ""}<br/>
      ${data.pic1.email} · ${data.pic1.whatsapp}
      ${data.pic2 ? `<br/>PIC 2: ${data.pic2.name} · ${data.pic2.email}` : ""}
    </div>
  </div>
  <div>
    <div class="p-label">Dari</div>
    <div class="p-name">Koperasi Konsumen PPNHI Bandung</div>
    <div class="p-detail">
      Politeknik Pariwisata NHI Bandung<br/>
      Jl. Dr. Setiabudi No. 186, Bandung<br/>
      contact@grandrecruitment.id
    </div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th style="width:26px">No.</th>
      <th>Deskripsi</th>
      <th style="width:80px">Qty</th>
      <th class="r" style="width:100px">Harga Satuan</th>
      <th class="r" style="width:90px">Subtotal</th>
    </tr>
  </thead>
  <tbody>
    <tr class="cat"><td colspan="5">Sewa Booth</td></tr>
    ${boothRows}
    ${paketRow}
    ${facilitySection}
  </tbody>
</table>

<div class="totals-wrap">
  <div class="totals-box">
    ${subtotalRows}
    <div class="t-grand"><span>TOTAL PEMBAYARAN</span><span>${fmt(grandTotal)}</span></div>
  </div>
</div>

<div class="pay-box">
  <div class="pay-title">🏦 Instruksi Pembayaran</div>
  <div class="pay-row"><span class="pay-lbl">Bank</span><span class="pay-val">Bank BTN</span></div>
  <div class="pay-row"><span class="pay-lbl">No. Rekening</span><span class="pay-val">0095 01 30 00000 38</span></div>
  <div class="pay-row"><span class="pay-lbl">Atas Nama</span><span class="pay-val">Kopensi STP Bandung</span></div>
  <div class="pay-row"><span class="pay-lbl">Nominal</span><span class="pay-val gold">${fmt(grandTotal)}</span></div>
  <div class="pay-row"><span class="pay-lbl">Berita Transfer</span><span class="pay-val" style="font-family:monospace;font-size:9px">${data.bookingId}</span></div>
</div>

<div class="deadline">
  ⏰ Harap lakukan pembayaran paling lambat <strong>${data.paymentDeadline}</strong>.
  Booking yang belum dikonfirmasi akan otomatis dibatalkan dan booth dilepas ke publik.
  Setelah transfer, kirim bukti ke WhatsApp panitia.
</div>

${specialNote}

<div class="doc-footer">
  Invoice ini dibuat otomatis oleh sistem Grand Recruitment 2026 &nbsp;·&nbsp; contact@grandrecruitment.id &nbsp;·&nbsp; 8–9 Juni 2026
</div>

${lunasStamp}
<button class="print-btn no-print" onclick="window.print()">🖨️ Print / Save PDF</button>
</body></html>`;
}

// ── Kwitansi HTML (muncul setelah panitia approve) ───────────
export function generateKwitansiHTML(data: BookingData): string {
  const grandTotal = calcGrandTotal(data);
  const boothLabels = data.booths.map(b => `Booth ${b.label}`).join(", ");
  const approvedDate = data.lunasDate || data.bookingDate;

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<title>Kwitansi — ${data.bookingId}</title>
<style>${BASE_CSS}
  .kwit-row { display:flex; margin-bottom:12px; padding-bottom:12px; border-bottom:0.5px solid #e2e8f0; align-items:flex-start; }
  .kwit-lbl { font-size:10px; color:#64748b; width:150px; flex-shrink:0; padding-top:1px; }
  .kwit-val { font-size:11px; color:#0a1628; font-weight:700; line-height:1.4; }
  .kwit-sub { font-size:9px; color:#64748b; font-weight:400; margin-top:2px; }
  .amt-box { background:#0a1628; border-radius:7px; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; position:relative; overflow:visible; }
  .amt-lbl { font-size:10px; color:#94a3b8; }
  .amt-val { font-size:18px; font-weight:700; color:#D4A017; }
  .stamp { position:absolute; right:55px; top:50%; transform:translateY(-50%) rotate(-16deg); border:2.5px solid #dc2626; border-radius:5px; padding:3px 11px; color:#dc2626; font-size:16px; font-weight:700; letter-spacing:3px; opacity:0.88; background:#fff; text-align:center; line-height:1.2; }
  .stamp-date { font-size:7.5px; letter-spacing:1px; color:#dc2626; }
  .sig { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:10px; }
  .sig-box { text-align:center; }
  .sig-lbl { font-size:9px; color:#64748b; margin-bottom:44px; line-height:1.5; }
  .sig-line { border-top:0.5px solid #e2e8f0; padding-top:6px; font-size:10px; font-weight:700; color:#0a1628; }
  .sig-title { font-size:9px; color:#64748b; margin-top:1px; }
  .kwit-note { font-size:9px; color:#64748b; background:#f8fafc; border-radius:6px; padding:9px 13px; margin-bottom:16px; line-height:1.6; }
</style>
</head>
<body>

<div class="doc-header">
  <div>
    <div class="brand-title">GRAND RECRUITMENT 2026</div>
    <div class="brand-sub">The International Hospitality &amp; Tourism Job Fair &nbsp;·&nbsp; 8–9 Juni 2026 · Gedung Dome NHI Bandung</div>
  </div>
  <div class="doc-meta">
    <div class="doc-meta-label">KWITANSI</div>
    <div class="doc-meta-id">KWT-${data.bookingId}</div>
    <div class="doc-meta-date">${approvedDate}</div>
  </div>
</div>

<div style="margin-bottom:18px; padding-bottom:14px; border-bottom:0.5px solid #e2e8f0;">
  <div class="kwit-row">
    <div class="kwit-lbl">Telah diterima dari</div>
    <div class="kwit-val">${data.companyName}
      <div class="kwit-sub">PIC: ${data.pic1.name} · ${data.pic1.email} · ${data.pic1.whatsapp}</div>
    </div>
  </div>
  <div class="kwit-row">
    <div class="kwit-lbl">Uang sejumlah</div>
    <div class="kwit-val">${terbilang(grandTotal)}
      <div class="kwit-sub">( ${fmt(grandTotal)} )</div>
    </div>
  </div>
  <div class="kwit-row">
    <div class="kwit-lbl">Untuk pembayaran</div>
    <div class="kwit-val">Sewa booth &amp; fasilitas Grand Recruitment 2026
      <div class="kwit-sub">Booking ID: ${data.bookingId} · ${boothLabels} · 8–9 Juni 2026</div>
    </div>
  </div>
  <div class="kwit-row" style="border-bottom:none; margin-bottom:0; padding-bottom:0;">
    <div class="kwit-lbl">Diterima oleh</div>
    <div class="kwit-val">Koperasi Konsumen PPNHI Bandung
      <div class="kwit-sub">Politeknik Pariwisata NHI Bandung · contact@grandrecruitment.id</div>
    </div>
  </div>
</div>

<div class="amt-box">
  <div>
    <div class="amt-lbl">Total Diterima</div>
    <div class="amt-val">${fmt(grandTotal)}</div>
  </div>
  <div class="stamp">
    LUNAS
    <div class="stamp-date">${(data.lunasDate || "").toUpperCase()}</div>
  </div>
</div>

<div class="kwit-note">
  Kwitansi ini merupakan bukti pembayaran yang sah atas partisipasi dalam Grand Recruitment 2026.
  Harap simpan dokumen ini untuk keperluan administrasi perusahaan Anda.
</div>

<div class="sig">
  <div class="sig-box">
    <div class="sig-lbl">Bandung, ${approvedDate}<br/>Penerima,</div>
    <div class="sig-line">&nbsp;</div>
    <div class="sig-title">Ketua Umum</div>
    <div class="sig-title">Koperasi Konsumen PPNHI Bandung</div>
  </div>
  <div class="sig-box">
    <div class="sig-lbl">Bandung, ${approvedDate}<br/>Penyetor,</div>
    <div class="sig-line">&nbsp;</div>
    <div class="sig-title">${data.pic1.title || "PIC"}</div>
    <div class="sig-title">${data.companyName}</div>
  </div>
</div>

<div class="doc-footer">
  Kwitansi ini dibuat otomatis oleh sistem Grand Recruitment 2026 &nbsp;·&nbsp; contact@grandrecruitment.id
</div>

<button class="print-btn no-print" onclick="window.print()">🖨️ Print / Save PDF</button>
</body></html>`;
}

// ── Open helpers ───────────────────────────────────────────────
function openHTML(html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

export function openInvoiceForPrint(data: BookingData) {
  openHTML(generateInvoiceHTML(data));
}

export function openKwitansiForPrint(data: BookingData) {
  openHTML(generateKwitansiHTML(data));
}

// Legacy — kept for backward compat, sekarang buka invoice baru
export function openCombinedInvoice(data: BookingData) {
  openHTML(generateInvoiceHTML(data));
}
export function openFacilityInvoice(data: BookingData) {
  openHTML(generateInvoiceHTML(data));
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
  // H-7 before June 8, 2026 = June 1, 2026
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
  const absenUrl  = encodeURIComponent(`https://grandrecruitment.id/absen?id=${data.registrationId}`);
  const qrUrl     = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${absenUrl}&margin=6`;

  const statusLabel: Record<string, string> = {
    mahasiswa: "Mahasiswa", fresh_graduate: "Fresh Graduate",
    alumni_nhi: "Alumni NHI Bandung", umum: "Pencari Kerja",
    belum_bekerja: "Belum Bekerja", pernah_bekerja: "Pernah Bekerja", sedang_bekerja: "Sedang Bekerja",
  };

  const fotoSection = data.fotoUrl
    ? `<img src="${data.fotoUrl}" style="width:100%;height:100%;object-fit:cover;object-position:center 15%;display:block;" />`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:60px;background:#1A7A6E;">👤</div>`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
<title>ID Card — ${data.namaLengkap}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body {
    height: 100%;
    font-family: 'Arial', sans-serif;
    background: #0a1628;
    color: #fff;
    overflow-x: hidden;
  }
  .screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 0;
  }

  /* Header */
  .header {
    width: 100%;
    background: linear-gradient(135deg, #0a1628, #0d4f47);
    padding: 1.25rem 1rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
  }
  .header-title {
    font-size: 1.05rem; font-weight: 900;
    color: #D4A017; letter-spacing: 0.04em; text-align: center;
  }
  .header-sub {
    font-size: 0.72rem; color: rgba(255,255,255,0.55);
    text-align: center; letter-spacing: 0.03em;
  }
  .badge {
    background: #0d9488; color: #fff;
    font-size: 0.68rem; font-weight: 700;
    padding: 0.25rem 0.85rem; border-radius: 20px;
    text-transform: uppercase; letter-spacing: 0.06em;
    margin-top: 0.2rem;
  }

  /* Foto */
  .foto-wrap {
    width: 130px; height: 130px;
    border-radius: 50%;
    overflow: hidden;
    border: 4px solid #D4A017;
    margin: 1.5rem auto 1rem;
    flex-shrink: 0;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  }

  /* Info */
  .info-section {
    width: 100%; max-width: 420px;
    padding: 0 1.5rem;
    text-align: center;
    flex: 1;
  }
  .name {
    font-size: 1.5rem; font-weight: 900;
    color: #fff; line-height: 1.2;
    margin-bottom: 0.75rem;
  }
  .info-line {
    font-size: 0.88rem; color: rgba(255,255,255,0.7);
    line-height: 2; display: flex;
    align-items: center; justify-content: center; gap: 0.4rem;
  }

  /* Divider */
  .divider {
    width: calc(100% - 3rem); max-width: 360px;
    height: 1px; background: rgba(255,255,255,0.1);
    margin: 1.25rem auto;
  }

  /* Registration ID */
  .reg-id {
    font-family: monospace;
    font-size: 0.75rem; font-weight: 700;
    color: #0d9488; letter-spacing: 0.05em;
    background: rgba(13,148,136,0.12);
    border: 1px solid rgba(13,148,136,0.3);
    padding: 0.4rem 1rem; border-radius: 6px;
    margin-bottom: 1.25rem;
    display: inline-block;
    word-break: break-all; text-align: center;
  }

  /* QR */
  .qr-section {
    display: flex; flex-direction: column;
    align-items: center; gap: 0.6rem;
    margin-bottom: 0.75rem;
  }
  .qr-img {
    width: min(55vw, 200px);
    height: min(55vw, 200px);
    display: block;
    border-radius: 8px;
    background: #fff;
    padding: 6px;
  }
  .qr-label {
    font-size: 0.72rem; color: rgba(255,255,255,0.45);
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .event-date {
    font-size: 0.78rem; color: rgba(255,255,255,0.4);
    text-align: center; margin-bottom: 2rem;
  }

  /* Close button */
  .btn-close {
    display: block; width: calc(100% - 3rem); max-width: 360px;
    margin: 0 auto 2rem;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.6);
    border-radius: 10px; padding: 0.75rem;
    font-size: 0.88rem; cursor: pointer;
    text-align: center;
  }
</style>
</head>
<body>
<div class="screen">

  <!-- Header -->
  <div class="header">
    <div class="header-title">GRAND RECRUITMENT 2026</div>
    <div class="header-sub">Politeknik Pariwisata NHI Bandung</div>
    <div class="badge">Jobseeker</div>
  </div>

  <!-- Foto -->
  <div class="foto-wrap">${fotoSection}</div>

  <!-- Info -->
  <div class="info-section">
    <div class="name">${data.namaLengkap}</div>
    ${data.institusi   ? `<div class="info-line">🎓 ${data.institusi}</div>` : ''}
    ${data.jurusan     ? `<div class="info-line">📚 ${data.jurusan}</div>` : ''}
    ${data.status      ? `<div class="info-line">👤 ${statusLabel[data.status] || data.status}</div>` : ''}
  </div>

  <div class="divider"></div>

  <!-- Registration ID -->
  <div class="reg-id">${data.registrationId}</div>

  <!-- QR Code -->
  <div class="qr-section">
    <img class="qr-img" src="${qrUrl}" alt="QR Absen"
      onerror="this.style.background='#1e293b';this.style.display='flex';"/>
    <div class="qr-label">📷 Tunjukkan ke panitia untuk absen</div>
  </div>

  <div class="event-date">8 – 9 Juni 2026  ·  Gedung Dome NHI Bandung</div>

  <button class="btn-close" onclick="window.close()">✕ Tutup</button>

</div>
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
  const win = window.open(url, "_blank", "width=420,height=860");
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
