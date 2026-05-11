═══════════════════════════════════════════════════
  GR2026 — Task 9: Dark Mode + Mobile Responsiveness
  Urutan pengerjaan (4 file, ~15 menit total)
═══════════════════════════════════════════════════

────────────────────────────────────────────────────
STEP 1 — Tambah dark mode ke index.css
────────────────────────────────────────────────────
File: client/src/index.css

1. Buka file
2. Cari blok:  :root {
   Tunggu sampai ketemu kurung tutupnya:  }
3. SETELAH baris } itu, paste seluruh isi file PATCH_1_index_dark.css

Setelah selesai, struktur index.css jadi:
  :root { ... }        ← sudah ada (jangan diubah)
  .dark { ... }        ← BARU kamu tambahkan


────────────────────────────────────────────────────
STEP 2 — Setup ThemeProvider di main.tsx
────────────────────────────────────────────────────
File: client/src/main.tsx

Baca PATCH_2_main_tsx_setup.txt — ada 2 langkah:
  a) Tambah import ThemeProvider
  b) Wrap <App /> dengan <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>

Setelah ini, saat browser OS dark mode → app ikut gelap otomatis.
Toggle manual bisa pakai useTheme() dari "next-themes" di komponen mana pun.


────────────────────────────────────────────────────
STEP 3 — Perbaiki LandingPage.tsx (mobile + bug fix)
────────────────────────────────────────────────────
File: client/src/pages/LandingPage.tsx

Baca PATCH_3_LandingPage_mobile.txt — ada 5 perubahan:
  1. Tambah state showMobileMenu
  2. Ganti blok nav kanan jadi responsive (tambah className="desktop-nav")
  3. Sisipkan mobile menu overlay sebelum {/* ── HERO ── */}
  4. Fix warna footer (dari #1e293b → #475569)
  5. Ganti blok <style> dengan media query yang benar

PENTING: Kamu juga perlu tambah className ke 2 elemen:
  a) Blok stats di hero (cari "display: 'flex', gap: '2.5rem'"):
     Tambah: className="hero-stats"

  b) Setiap div timeline row (cari "position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr'"):
     Tambah: className="timeline-row"
     (ada 3 baris ini, satu per step di steps.map)


────────────────────────────────────────────────────
STEP 4 — Cek hasilnya di browser
────────────────────────────────────────────────────
Jalankan:
  pnpm dev

Lalu buka http://localhost:3000

Test mobile:
  Chrome DevTools → Ctrl+Shift+M → pilih iPhone 12 (390px)
  Cek: nav harus tampil hamburger ☰
  Cek: timeline harus jadi 1 kolom
  Cek: teks footer harus terbaca

Test dark mode:
  Buka DevTools → More tools → Rendering → Emulate CSS media: prefers-color-scheme dark
  Cek: dashboard pages (bg-background) harus jadi gelap
  Catatan: LandingPage tetap gelap (hardcoded) — ini by design


────────────────────────────────────────────────────
LANGKAH SELANJUTNYA (Step 5, butuh file tambahan)
────────────────────────────────────────────────────
Untuk audit dashboard pages (EmployerDashboard, JobseekerDashboard, BossPanel),
kirimkan file-file itu ke Claude agar bisa dicek dan difix.

Yang perlu dicek di dashboard:
  - Apakah pakai bg-background / text-foreground Tailwind? (good)
  - Apakah ada hardcoded warna seperti bg-white atau text-gray-900? (perlu fix)
  - Layout di mobile: apakah grid/flex sudah responsive?


────────────────────────────────────────────────────
PENJELASAN KONSEP (buat belajar)
────────────────────────────────────────────────────

CSS VARIABLES + DARK MODE
  index.css punya :root {} dengan variabel warna (--background, --foreground, dll).
  Tailwind classes seperti bg-background MEMBACA variabel ini.
  Saat kita tambah .dark {}, kita OVERRIDE variabel itu dengan nilai gelap.
  next-themes menambahkan class "dark" ke <html> tag → otomatis semua berubah.

MOBILE RESPONSIVENESS
  Dua strategi yang dipakai:
  1. className + CSS media query → untuk toggle show/hide elemen (hamburger nav)
  2. clamp() + flexWrap + minmax() → untuk ukuran yang otomatis mengecil
  LandingPage sudah pakai strategi 2 dengan baik, tapi nav belum → kita fix.
