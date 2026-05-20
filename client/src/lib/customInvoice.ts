// ── Custom Invoice Generator (Panitia Manual) ─────────────────
// File terpisah dari invoiceGenerator.ts agar tidak mengganggu sistem utama

export interface CustomInvoiceItem {
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
}

export interface CustomInvoiceData {
  invoiceNo: string;
  invoiceDate: string;
  companyName: string;
  picName: string;
  picEmail: string;
  city: string;
  items: CustomInvoiceItem[];
  discountAmount?: number;
  discountNote?: string;
  notes?: string;
}

function fmtRp(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

const LOGO_URL = "https://ftsiyczjqjnlqsrslfwi.supabase.co/storage/v1/object/public/gr2026c/Logo%20%26%20Layout%20Grand%20Recruitment%202026%20NHI.png";

export function generateCustomInvoiceHTML(data: CustomInvoiceData): string {
  const subtotal = data.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const disc = data.discountAmount || 0;
  const grandTotal = subtotal - disc;

  let rowNum = 1;
  const rows = data.items
    .filter(i => i.description && i.unitPrice > 0)
    .map(item => {
      const total = item.qty * item.unitPrice;
      return (
        "<tr>" +
        "<td style='padding:7px 8px;border-bottom:1px solid #f0f0f0;width:26px'>" + (rowNum++) + "</td>" +
        "<td style='padding:7px 8px;border-bottom:1px solid #f0f0f0'>" + item.description + "</td>" +
        "<td style='padding:7px 8px;border-bottom:1px solid #f0f0f0'>" + item.qty + " " + item.unit + "</td>" +
        "<td style='padding:7px 8px;border-bottom:1px solid #f0f0f0;text-align:right'>" + fmtRp(item.unitPrice) + "</td>" +
        "<td style='padding:7px 8px;border-bottom:1px solid #f0f0f0;text-align:right'>" + fmtRp(total) + "</td>" +
        "</tr>"
      );
    }).join("");

  const discRow = disc > 0
    ? "<tr><td colspan='4' style='padding:6px 8px;text-align:right;color:#0d9488'>Diskon" +
      (data.discountNote ? " (" + data.discountNote + ")" : "") + "</td>" +
      "<td style='padding:6px 8px;text-align:right;color:#0d9488;font-weight:700'>- " + fmtRp(disc) + "</td></tr>"
    : "";

  const notesHtml = data.notes
    ? "<div style='margin-top:12px;padding:10px 14px;background:#f8fafc;border-radius:6px;font-size:9pt;color:#475569'>" +
      "<strong>Catatan:</strong> " + data.notes + "</div>"
    : "";

  return "<!DOCTYPE html>" +
    "<html lang='id'><head><meta charset='UTF-8'/>" +
    "<title>Invoice " + data.invoiceNo + "</title>" +
    "<style>" +
    "* { margin:0; padding:0; box-sizing:border-box; }" +
    "body { font-family:Arial,sans-serif; color:#1a1a1a; background:#fff; font-size:10pt; padding:20px; }" +
    "@media print { body { padding:0; } .no-print { display:none !important; } * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; } }" +
    "</style></head><body>" +
    "<div style='background:#0a1628;color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px'>" +
    "<div style='display:flex;align-items:center;gap:12px'>" +
    "<img src='" + LOGO_URL + "' alt='GR2026' style='height:48px;object-fit:contain' onerror='this.style.display=\"none\"'/>" +
    "<div><div style='font-size:13px;font-weight:700;color:#14b8a6'>GRAND RECRUITMENT 2026</div>" +
    "<div style='font-size:8px;color:#94a3b8;margin-top:2px'>The International Hospitality &amp; Tourism Job Fair &nbsp;&middot;&nbsp; 8&ndash;9 Juni 2026 &middot; Gedung Dome NHI Bandung</div></div>" +
    "</div>" +
    "<div style='text-align:right'>" +
    "<div style='font-size:20px;font-weight:700;letter-spacing:2px'>INVOICE</div>" +
    "<div style='font-size:10px;color:#14b8a6;font-family:monospace;margin-top:3px'>" + data.invoiceNo + "</div>" +
    "<div style='font-size:9px;color:#94a3b8;margin-top:2px'>" + data.invoiceDate + "</div>" +
    "</div></div>" +
    "<div style='display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid #e2e8f0'>" +
    "<div><div style='font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:5px'>Ditagihkan kepada</div>" +
    "<div style='font-size:11px;font-weight:700;color:#0a1628;margin-bottom:2px'>" + data.companyName + "</div>" +
    "<div style='font-size:9px;color:#64748b;line-height:1.7'>" +
    (data.city ? data.city + "<br/>" : "") +
    "PIC: " + data.picName + "<br/>" + data.picEmail + "</div></div>" +
    "<div><div style='font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:5px'>Dari</div>" +
    "<div style='font-size:11px;font-weight:700;color:#0a1628;margin-bottom:2px'>Koperasi Konsumen PPNHI Bandung</div>" +
    "<div style='font-size:9px;color:#64748b;line-height:1.7'>Politeknik Pariwisata NHI Bandung<br/>Jl. Dr. Setiabudi No. 186, Bandung<br/>contact@grandrecruitment.id</div></div>" +
    "</div>" +
    "<table style='width:100%;border-collapse:collapse;margin-bottom:14px'>" +
    "<thead><tr style='background:#0a1628'>" +
    "<th style='padding:7px 8px;text-align:left;font-size:8px;font-weight:700;color:#fff;text-transform:uppercase;width:26px'>No.</th>" +
    "<th style='padding:7px 8px;text-align:left;font-size:8px;font-weight:700;color:#fff;text-transform:uppercase'>Deskripsi</th>" +
    "<th style='padding:7px 8px;text-align:left;font-size:8px;font-weight:700;color:#fff;text-transform:uppercase;width:80px'>Qty</th>" +
    "<th style='padding:7px 8px;text-align:right;font-size:8px;font-weight:700;color:#fff;text-transform:uppercase;width:110px'>Harga Satuan</th>" +
    "<th style='padding:7px 8px;text-align:right;font-size:8px;font-weight:700;color:#fff;text-transform:uppercase;width:100px'>Subtotal</th>" +
    "</tr></thead>" +
    "<tbody>" + rows + discRow + "</tbody>" +
    "</table>" +
    "<div style='display:flex;justify-content:flex-end;margin-bottom:14px'>" +
    "<div style='width:240px'>" +
    "<div style='display:flex;justify-content:space-between;padding:4px 0;font-size:9.5px;color:#64748b;border-bottom:1px solid #f0f0f0'><span>Subtotal</span><span style='color:#1a1a1a'>" + fmtRp(subtotal) + "</span></div>" +
    "<div style='display:flex;justify-content:space-between;padding:4px 0;font-size:9.5px;color:#64748b;border-bottom:1px solid #f0f0f0'><span>PPN (0%)</span><span style='color:#1a1a1a'>Rp 0</span></div>" +
    "<div style='display:flex;justify-content:space-between;padding:9px 11px;background:#0a1628;border-radius:6px;margin-top:6px'>" +
    "<span style='font-size:10px;font-weight:700;color:#94a3b8'>TOTAL PEMBAYARAN</span>" +
    "<span style='font-size:12px;font-weight:700;color:#D4A017'>" + fmtRp(grandTotal) + "</span>" +
    "</div></div></div>" +
    "<div style='background:#f0fdfb;border:1px solid #0d9488;border-radius:7px;padding:12px 16px;margin-bottom:12px'>" +
    "<div style='font-size:8px;font-weight:700;color:#0d9488;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:8px'>Instruksi Pembayaran</div>" +
    "<div style='display:flex;gap:10px;margin-bottom:5px;font-size:9.5px'><span style='color:#64748b;width:110px'>Bank</span><span style='font-weight:700'>Bank BTN</span></div>" +
    "<div style='display:flex;gap:10px;margin-bottom:5px;font-size:9.5px'><span style='color:#64748b;width:110px'>No. Rekening</span><span style='font-weight:700'>0095 01 30 00000 38</span></div>" +
    "<div style='display:flex;gap:10px;margin-bottom:5px;font-size:9.5px'><span style='color:#64748b;width:110px'>Atas Nama</span><span style='font-weight:700'>Kopensi STP Bandung</span></div>" +
    "<div style='display:flex;gap:10px;margin-bottom:5px;font-size:9.5px'><span style='color:#64748b;width:110px'>Nominal</span><span style='font-weight:700;color:#B8860B;font-size:12px'>" + fmtRp(grandTotal) + "</span></div>" +
    "<div style='display:flex;gap:10px;font-size:9.5px'><span style='color:#64748b;width:110px'>Berita Transfer</span><span style='font-weight:700;font-family:monospace;font-size:9px'>" + data.invoiceNo + "</span></div>" +
    "</div>" +
    notesHtml +
    "<div style='margin-top:16px;padding-top:10px;border-top:1px solid #e2e8f0;text-align:center;font-size:8px;color:#94a3b8'>" +
    "Invoice ini dibuat oleh Panitia Grand Recruitment 2026 &nbsp;&middot;&nbsp; contact@grandrecruitment.id &nbsp;&middot;&nbsp; 8&ndash;9 Juni 2026" +
    "</div>" +
    "<button class='no-print' onclick='window.print()' style='position:fixed;bottom:20px;right:20px;background:#0d9488;color:#fff;border:none;border-radius:9px;padding:11px 22px;font-size:13px;font-weight:700;cursor:pointer'>Print / Save PDF</button>" +
    "</body></html>";
}

export function openCustomInvoice(data: CustomInvoiceData): void {
  const html = generateCustomInvoiceHTML(data);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}
