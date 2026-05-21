// client/src/lib/exportUtils.ts

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCSV(rows: string[][], filename: string) {
  const content = rows.map(row => row.map(escapeCSV).join(',')).join('\n');
  const BOM = '\uFEFF'; // agar Excel baca UTF-8 dengan benar
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── JOBSEEKER EXPORT ────────────────────────────────────────────
export function exportJobseekersCSV(jobseekers: any[]) {
  const headers = [
    'No',
    'Registration ID',
    'Nama Lengkap',
    'Email',
    'WhatsApp',
    'Status Kerja',
    'Minat Kerja',
    'Institusi',
    'Jurusan',
    'Tahun Lulus',
    'Foto',
    'CV',
    'KTM',
    'Sertifikat',
    'Consent 1',
    'Consent 2',
  ];

  const STATUS_LABEL: Record<string, string> = {
    belum_bekerja: 'Belum Bekerja',
    sedang_bekerja: 'Sedang Bekerja',
    pernah_bekerja: 'Pernah Bekerja',
  };

  const MINAT_LABEL: Record<string, string> = {
    dalam_negeri: 'Dalam Negeri',
    luar_negeri: 'Luar Negeri',
    keduanya: 'Keduanya',
  };

  const rows = jobseekers.map((js, i) => {
    const statusKerja = js.statusKerja || js.status || '';
    const minatKerja = js.minatKerja || js.bidangMinat || '';
    return [
      String(i + 1),
      js.registrationId || '',
      js.namaLengkap || '',
      js.email || '',
      js.whatsapp || '',
      STATUS_LABEL[statusKerja] || statusKerja,
      MINAT_LABEL[minatKerja] || minatKerja,
      js.institusi || '',
      js.jurusan || '',
      js.tahunLulus || '',
      js.fotoUrl || '',       // URL Supabase — bisa diklik di Excel
      js.cvUrl || '',
      js.ktmUrl || '',
      js.sertifikatUrl || '',
      js.consent1 ? 'Ya' : 'Tidak',
      js.consent2 ? 'Ya' : 'Tidak',
    ];
  });

  const today = new Date().toISOString().slice(0, 10);
  downloadCSV([headers, ...rows], `GR2026_Jobseeker_${today}.csv`);
}

// ─── EMPLOYER EXPORT ─────────────────────────────────────────────
export function exportEmployersCSV(employers: any[]) {
  const headers = [
    'No',
    'Booking ID',
    'Nama Perusahaan',
    'Industri',
    'Kota',
    'PIC 1 — Nama',
    'PIC 1 — Jabatan',
    'PIC 1 — Email',
    'PIC 1 — WhatsApp',
    'PIC 2 — Nama',
    'PIC 2 — Email',
    'Booth Dipilih',
    'Tipe Booth',
    'Total Tagihan',
    'Status Pembayaran',
    'Lowongan (Nama File)',
    'Lowongan (URL)',
    'Special Request',
  ];

  const STATUS_LABEL: Record<string, string> = {
    pending: 'Menunggu Pembayaran',
    confirmed: 'Lunas',
    rejected: 'Ditolak',
  };

  const rows = employers.map((emp, i) => {
    // Parse booths
    let booths: string[] = [];
    try {
      const parsed = typeof emp.selectedBooths === 'string'
        ? JSON.parse(emp.selectedBooths)
        : emp.selectedBooths;
      booths = Array.isArray(parsed) ? parsed : [];
    } catch { booths = []; }

    // Parse job vacancies
    let vacancyNames = '';
    let vacancyUrls = '';
    try {
      const parsed = typeof emp.jobVacanciesUrl === 'string'
        ? JSON.parse(emp.jobVacanciesUrl)
        : emp.jobVacanciesUrl;
      if (Array.isArray(parsed) && parsed.length > 0) {
        vacancyNames = parsed.map((v: any) => v.name || '').join(' | ');
        vacancyUrls = parsed.map((v: any) => v.url || '').join(' | ');
      }
    } catch { /* kosong */ }

    return [
      String(i + 1),
      emp.bookingId || '',
      emp.companyName || '',
      emp.industry || '',
      emp.city || '',
      emp.pic1Name || '',
      emp.pic1Title || '',
      emp.pic1Email || '',
      emp.pic1Whatsapp || '',
      emp.pic2Name || '',
      emp.pic2Email || '',
      booths.join(', '),
      emp.boothType || '',
      emp.totalAmount ? `Rp ${Number(emp.totalAmount).toLocaleString('id-ID')}` : '',
      STATUS_LABEL[emp.status] || emp.status || '',
      vacancyNames,
      vacancyUrls,
      emp.specialRequest || '',
    ];
  });

  const today = new Date().toISOString().slice(0, 10);
  downloadCSV([headers, ...rows], `GR2026_Employer_${today}.csv`);
}