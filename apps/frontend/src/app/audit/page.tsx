import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle, ArrowRight, CheckCircle2, Database, Download, ExternalLink,
  FileCheck2, Lock, Search, ShieldCheck, XCircle, ArrowLeft, FileText, RefreshCcw,
} from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';

type Item = {
  id: string;
  label: string;
  s: 'PASS' | 'FAIL' | 'N/A';
  why: string;
  fix?: string;
};

type Cat = { id: string; title: string; score: string; denomination: number; denominator: number; items: Item[] };

const FULL: Cat[] = [
  {
    id: '1',
    title: 'Visual Design & Frontend',
    score: '5/5',
    denomination: 5,
    denominator: 5,
    items: [
      { id: '1.1', label: 'Hirarki Tipografi', s: 'PASS', why: 'Hierarki heading (font-outfit) vs body (Inter) jelas; maksimal 2 keluarga font (globals.css:19).', fix: 'Daftarkan utility font-outfit di buatnya Tailwind config (minor, register/page.tsx:69).' },
      { id: '1.2', label: 'Sistem Warna', s: 'PASS', why: 'Token CSS terpusat: primary sky #0ea5e9, success emerald #10b981, warning amber #facc15, slate (globals.css:3-9).' },
      { id: '1.3', label: 'Layout & Komposisi', s: 'PASS', why: 'Homepage ber-section dengan grid/asimetri, hero above the fold; spacing konsisten (page.tsx).' },
      { id: '1.4', label: 'Kedalaman & Surface', s: 'PASS', why: 'shadow-sm pada kartu, border, elevasi konsisten di public & admin baru.' },
      { id: '1.5', label: 'Motion & Interaksi', s: 'PASS', why: 'Hover/focus states ada; prefers-reduced-motion dihormati (globals.css:332-339).' },
    ],
  },
  {
    id: '2',
    title: 'User Flow & UX',
    score: '4/5',
    denomination: 4,
    denominator: 5,
    items: [
      { id: '2.1', label: 'Hero & Kesan Pertama', s: 'PASS', why: 'Value proposition + CTA "Lihat PSB"/"Jelajahi profil" di atas fold + bagian alur (page.tsx:469,1065-1078).' },
      { id: '2.2', label: 'Navigasi & IA', s: 'PASS', why: '5 item utama (Beranda, Profil, Program, PSB, Kontak) + dropdown; active state konsisten (PublicLayout.tsx:193-282).' },
      { id: '2.3', label: 'CTA & Konversi', s: 'PASS', why: 'CTA outcome-driven ("Daftar Sekarang", "Simpan & Lanjut ke Data Orang Tua"); primary vs sekunder jelas.' },
      { id: '2.4', label: 'Kelengkapan Journey', s: 'PASS', why: 'Loading (tombol disabled) + success toast + error bahasa Indonesia di semua form utama (login, register, kontak, PSB, wallet).' },
      { id: '2.5', label: 'Trust & Social Proof', s: 'FAIL', why: '"500+ Donatur" & "Lembaga Amal Terpercaya" HARDCODED tanpa sumber data; TIDAK ada testimonial asli (donations/page.tsx:91,121).', fix: 'Baca jumlah donatur dari API (COUNT transactions), tambah 2-3 testimonial asli dengan nama & izin.' },
    ],
  },
  {
    id: '3',
    title: 'Responsive & Mobile',
    score: '4/5',
    denomination: 4,
    denominator: 5,
    items: [
      { id: '3.1', label: 'Breakpoint', s: 'PASS', why: 'Grid md:grid-cols-X adaptif di semua halaman; tidak ada horizontal scroll.' },
      { id: '3.2', label: 'Touch Target', s: 'FAIL', why: 'Item navigasi mobile py-2 (< 40px) — di bawah standar 44px (PublicLayout.tsx:399).', fix: 'Perbesar padding touch area item menu mobile ke 44px.' },
      { id: '3.3', label: 'Tipografi Mobile', s: 'PASS', why: 'Body text ≥14px; terbaca tanpa zoom.' },
      { id: '3.4', label: 'Navigasi Mobile', s: 'PASS', why: 'Hamburger + tutup click-outside (PublicLayout.tsx:389-452); portal bottom-tab 5 item (portal/layout.tsx:896-947).' },
      { id: '3.5', label: 'Kinerja Mobile', s: 'PASS', why: 'Switchablebanner, FAB, lazy; gambar publik dikompres.' },
    ],
  },
  {
    id: '4',
    title: 'Performance & Web Vitals',
    score: '4/5',
    denomination: 4,
    denominator: 5,
    items: [
      { id: '4.1', label: 'LCP', s: 'PASS', why: 'Prerendering + x-nextjs-cache HIT; CSS critical inline; Cloudflare.' },
      { id: '4.2', label: 'INP', s: 'PASS', why: 'Tidak ada komputasi sinkron berat saat aksi; komponen kecil.' },
      { id: '4.3', label: 'CLS', s: 'PASS', why: 'Gambar dengan dimensi / preview loading; prerender statis.' },
      { id: '4.4', label: 'Optimasi Aset', s: 'FAIL', why: 'Ada PNG tutorial 1.05MB; banyak gambar remote Unsplash tanpa parameter optimasi (width/q) (public/).', fix: 'Optimasi gambar lokal (webp+resize) dan remote srcset.' },
      { id: '4.5', label: 'Caching & CDN', s: 'PASS', why: 'Cloudflare + cache-control s-maxage=31536000 + x-nextjs-cache HIT.' },
    ],
  },
  {
    id: '5',
    title: 'Aksesibilitas',
    score: '4/5',
    denomination: 4,
    denominator: 5,
    items: [
      { id: '5.1', label: 'HTML Semantik', s: 'PASS', why: 'header/nav/main/footer, section/article; role aria-current aktif.' },
      { id: '5.2', label: 'Navigasi Keyboard', s: 'PASS', why: 'Semua kontrol bisa di-Tab; :focus-visible style ada; tombol native.' },
      { id: '5.3', label: 'Screen Reader', s: 'FAIL', why: 'Label form di register tanpa htmlFor/id (register/page.tsx:100-102); icon-only <i> tanpa aria-label di admin-bs (AdminBsShell.tsx:196).', fix: 'Tautkan label→input + beri aria-label pada icon buttons.' },
      { id: '5.4', label: 'Kontras Warna', s: 'PASS', why: 'Kontras teks vs latar memenuhi WCAG AA; informasi tak hanya via warna.' },
      { id: '5.5', label: 'Motion & Kognitif', s: 'PASS', why: 'prefers-reduced-motion active (globals.css:332); tidak ada media auto-play.' },
    ],
  },
  {
    id: '6',
    title: 'Keamanan',
    score: '7/10',
    denomination: 7,
    denominator: 10,
    items: [
      { id: '6.1', label: 'Manajemen Secret', s: 'FAIL', why: 'JWT_SECRET + AI key plaintext di .env:2 & deploy/backend_env_notes.txt:2; backup arsip menyertakan .env + wa_session.db (scripts/backup.sh:31-33).', fix: 'Rotasi JWT_SECRET & key AI; pindahkan ke env server saja; exclude .env & wa_session dari backup publik.' },
      { id: '6.2', label: 'Eksposur Secret Klien', s: 'PASS', why: 'Tidak ada NEXT_PUBLIC_ rahasia; hanya base URL (api.ts:1-34); JWT hanya cookie HttpOnly, localStorage menyimpan role/name (auth-storage.ts:9-10).' },
      { id: '6.3', label: 'Validasi & Sanitasi Input', s: 'PASS', why: 'Sanitasi XSS berlapis saat simpan & baca berita whitelist tag (news/sanitize.go:76-175); DecodeStrictJSON + DisallowUnknownFields.' },
      { id: '6.4', label: 'Paywall Server-Side', s: 'PASS', why: 'Status diterima/daftar ulang WAJIB payment_status paid (psb/handler.go:668-678); AcceptToSantri tolak yang belum lunas (handler.go:754); kwitansi 404 sebelum lunas.' },
      { id: '6.5', label: 'Anti-Replay Pembayaran', s: 'PASS', why: 'UNIQUE idempotency di payment_transactions/receipts/kas/donations (db.go:1032-1045); conditional UPDATE + RowsAffected + FindLedgerByKey (finance.go:103-116).' },
      { id: '6.6', label: 'Keamanan Database', s: 'PASS', why: 'SQLite lokal dengan UNIQUE constraints ketat (email, spp_bills santri+period, invoice code, dll); CHECK role (db.go:85-909).' },
      { id: '6.7', label: 'Security Headers', s: 'FAIL', why: 'X-Content-Type-Options, X-Frame-Options, HSTS, Referrer-Policy ada TAPI Content-Security-Policy TIDAK (verified live handle); admin-bs load CDN tanpa SRI.', fix: 'Tambahkan CSP + gunakan `frame-ancestors "none"` (sudah di middleware), pindah ke header proxy.' },
      { id: '6.8', label: 'Proteksi API & Rate Limit', s: 'FAIL', why: 'Rate limit IP+path merata (ratelimit.go) & upload 30/jam, OTP 10-30/jam, notes 60/jam; TAPI /uploads/* FileServer masih publik (main.go:510-511) dan endpoint generate AI (news/generate) tanpa rate-limit khusus.', fix: 'Batasi akses /uploads/proofs/ (owner-only), tambahkan rate-limit untuk /news/generate.' },
      { id: '6.9', label: 'Webhook Security', s: 'PASS', why: 'Invoices HMAC-SHA256 + hmac.Equal (invoices/handler.go:82-98); webhook Telegram via X-Telegram-Bot-Api-Secret-Token + whitelist chat (notifications:268-294).' },
      { id: '6.10', label: 'Console Production', s: 'PASS', why: 'Log tidak berisi data sensitif; OTP hanya hash SHA-256 (otp.go:48-51,125-130); hanya login/email/nama-file/IP dicatat.' },
    ],
  },
  {
    id: '7',
    title: 'Backend & API Quality',
    score: '3/5',
    denomination: 3,
    denominator: 5,
    items: [
      { id: '7.1', label: 'Desain API', s: 'PASS', why: 'REST konsisten, status code tepat (422 transisi illegal, 401 sesi revoke, 409 duplikat).' },
      { id: '7.2', label: 'Rate Limit Operasi Mahal', s: 'FAIL', why: 'Endpoint AI (news/generate, chat) dan upload hanya dibatasi role, tanpa rate-limit per IP khusus.', fix: 'Terapkan rate-limit terpisah untuk /news/generate & /api/project (mis. 10/jam/IP).' },
      { id: '7.3', label: 'Penanganan Error', s: 'FAIL', why: 'Error provider AI diteruskan mentah ke client (news/handler.go:350, ai/gemini.go:134) — bisa bocorkan detail internal ke admin media.', fix: 'Log detail di server, kirim pesan generik ke client.' },
      { id: '7.4', label: 'Penanganan Data', s: 'PASS', why: 'Body 1MB cap, upload decode+re-encode + dimensi 100-5000px (upload/handler.go:217-225); NIK/HP divalidasi.' },
      { id: '7.5', label: 'Timeout', s: 'PASS', why: 'http.Client 85s, per-model 70s, total artikel 280s, Gemini 30s, gambar 15s (platform/ai).' },
    ],
  },
  {
    id: '8',
    title: 'SEO & Discoverability',
    score: '3/5',
    denomination: 3,
    denominator: 5,
    items: [
      { id: '8.1', label: 'Meta & OpenGraph', s: 'FAIL', why: 'Hanya layout global (layout.tsx:4-37); per-slug ([slug]) TIDAK ada generateMetadata → semua berita/donasi nama judul global.', fix: 'Tambah generateMetadata + canonical di news/[slug], donations/[slug], galeri/[slug], videos/[slug].' },
      { id: '8.2', label: 'Structured Data', s: 'PASS', why: 'JSON-LD EducationalOrganization di global (layout.tsx:58-77); belum ada artikel/event schema (minor).' },
      { id: '8.3', label: 'SEO Teknis', s: 'PASS', why: 'robots.ts disallow admin/portal/api; sitemap.ts 9 route (sitemap.xml 200); lang="id". Canonical per-slug belum ada (minor).' },
      { id: '8.4', label: 'Struktur Heading', s: 'PASS', why: 'Satu H1 per halaman (78 h1 ditinjau); hierarki logis.' },
      { id: '8.5', label: 'Kehadiran Sosial', s: 'PASS', why: 'Footer menampilkan IG, FB, YT, TikTok (PublicLayout:93-100).' },
    ],
  },
  {
    id: '9',
    title: 'Privasi, Legal & Compliance',
    score: '2/4',
    denomination: 2,
    denominator: 4,
    items: [
      { id: '9.1', label: 'Cookie Consent', s: 'PASS', why: 'CookieBanner dengan localStorage alma-cookie-consent; GA4 hanya aktif bila accept (AnalyticsLoader.tsx:33-36).' },
      { id: '9.2', label: 'Halaman Legal', s: 'PASS', why: '/privasi dan /syarat berisi konten asli, terhubung dari footer (200 live).' },
      { id: '9.3', label: 'Data Minimisation & Hapus Data', s: 'FAIL', why: 'Formumumnya minimal, TAPI mekanisme hapus data user (right-to-erasure) tidak ditemukan (tidak ada endpoint/UI penghapusan akun).', fix: 'Sediakan endpoint hapus akun & contps (permintaan via admin sudah ada untuk data operasional).' },
      { id: '9.4', label: 'Audit Script Pihak Ketiga', s: 'FAIL', why: 'Google Fonts (manual <link>), GA4, dan AdminLTE/Bootstrap via CDN jsdelivr TANPA Subresource Integrity (layout.tsx:56, AdminBsShell.tsx:8-11).', fix: 'Tambah integrity SRI atau self-host bundle.' },
      { id: '9.5', label: 'Registrasi Perlindungan Data', s: 'N/A', why: 'Pengguna utama di Indonesia (non-EU/UK), skala kecil — tidak wajib NDPC/EU threshold.' },
    ],
  },
  {
    id: '10',
    title: 'Infrastruktur & Polish',
    score: '2/4',
    denomination: 2,
    denominator: 4,
    items: [
      { id: '10.1', label: 'Error Pages', s: 'PASS', why: 'Custom not-found.tsx + error.tsx (404 "Halaman tidak ditemukan" live, 200-ok); 54 empty-state ditangani.' },
      { id: '10.2', label: 'Favicon & Manifest', s: 'PASS', why: 'favicon.ico + manifest.webmanifest 200 + theme_color #0284c7 (manifest.ts).' },
      { id: '10.3', label: 'Dark Mode', s: 'N/A', why: 'Single theme (light); tidak ada flash dark.' },
      { id: '10.4', label: 'Analytics & Monitoring', s: 'FAIL', why: 'GA4 terpasang tapi hanya config pageviews; TIDAK ada event konversi & TIDAK ada error monitoring (Sentry dll).', fix: 'Tambah event register/payment/wallet; pasang error boundary reporter.' },
      { id: '10.5', label: 'Kualitas Konten', s: 'FAIL', why: 'Foto pimpinan & profil memakai foto stock Unsplash; angka donasi sintetis (Math.max(floor(progress/8)+5) = donatur palsu, donations:187,233).', fix: 'Jadwalkan konten default; hitung donatur asli dari DB.' },
    ],
  },
];

const UX: Cat[] = [
  {
    id: 'UX1',
    title: 'System Status & Feedback',
    score: '4/5',
    denomination: 4,
    denominator: 5,
    items: [
      { id: 'U1.1', label: 'Loading States', s: 'PASS', why: 'Semua async (login, kirim, biodata, payment) pakai isLoading/isSaving + disabled (login:129-136, biodata:626-641).' },
      { id: 'U1.2', label: 'Sukses Konfirmasi', s: 'PASS', why: 'Toast global auto-dismiss 4s + bisa tutup manual (Toast.tsx:35-61).' },
      { id: 'U1.3', label: 'Komunikasi Error', s: 'PASS', why: 'Bahasa Indonesia + recovery (donations:174 "Coba Lagi", psb/status:99-111).' },
      { id: 'U1.4', label: 'Progress Indicator', s: 'PASS', why: 'Wizard PSB stepper 5 langkah sticky + mini 3-langkah (portal/layout:528-575,811-851).' },
      { id: 'U1.5', label: 'Feedback Real-Time', s: 'FAIL', why: 'Validasi hanya saat submit, tidak onBlur/per-keystroke (biodata:219-229).', fix: 'Tambahkan validasi per-field saat blur untuk NIK, email, HP.' },
    ],
  },
  {
    id: 'UX2',
    title: 'Navigasi & IA',
    score: '3/5',
    denomination: 3,
    denominator: 5,
    items: [
      { id: 'U2.1', label: 'Navigasi Primer', s: 'PASS', why: 'Active state via aria-current + bar kiri (Sidebar:184-210) & highlight (portal/layout:751-780).' },
      { id: 'U2.2', label: 'Navigasi Mobile', s: 'PASS', why: 'Hamburger grid (PublicLayout:376-462), overlay admin (DashboardLayout:16-33), bottom-tab portal.' },
      { id: 'U2.3', label: 'Search', s: 'FAIL', why: 'TIDAK ada pencarian global meski 10+ item konten (news, galeri, videos, program, guru).', fix: 'Tambahkan search bar navbar yang query /api/search lintas konten.' },
      { id: 'U2.4', label: 'Breadcrumb', s: 'FAIL', why: 'Tidak ada breadcrumb di public & admin baru (hanya admin-bs teks statis).', fix: 'Tambahkan komponen breadcrumb untuk halaman 2+ level (admin & detail konten).' },
      { id: 'U2.5', label: 'Footer', s: 'PASS', why: 'Kontak, sosmed, link legal /privasi /syarat lengkap (PublicLayout:472-558).' },
    ],
  },
  {
    id: 'UX3',
    title: 'User Control & Freedom',
    score: '1/4',
    denomination: 1,
    denominator: 4,
    items: [
      { id: 'U3.1', label: 'Undo & Reversibility', s: 'FAIL', why: 'Dua sistem confirm: ConfirmDialog custom 52x (bagus) TAPI window.confirm native 19x di admin-bs/note/exams/notif — tidak seragam & tanpa konsekuensi jelas.', fix: 'Konsolidasi semua hapus ke ConfirmDialog; sebutkan nama barang.' },
      { id: 'U3.2', label: 'Preservasi Form', s: 'FAIL', why: 'Wizard PSB tanpa beforeunload/autosave (hanya exams memiliki), data bisa hilang saat pindah tab.', fix: 'Tambah beforeunload + simpan draft di localStorage wizard.' },
      { id: 'U3.3', label: 'Escape Hatches', s: 'PASS', why: 'Modal tertutup via X + backdrop (ConfirmDialog:47,58); FAB Escape (FloatingQuickMenu:35-37).' },
      { id: 'U3.4', label: 'Persistensi Pengaturan', s: 'N/A', why: 'Sedikit pengaturan user; preferensi minor via localStorage.' },
      { id: 'U3.5', label: 'Logout & Sesi', s: 'FAIL', why: 'Sesi expired diarahkan senyap tanpa toast "sesi berakhir" (AuthProvider:65-74).', fix: 'Tampilkan toast/notice saat 401 redirect.' },
    ],
  },
  {
    id: 'UX4',
    title: 'Konsistensi & Standar',
    score: '4/5',
    denomination: 4,
    denominator: 5,
    items: [
      { id: 'U4.1', label: 'Konsistensi Visual', s: 'PASS', why: 'Sky/emerald konsisten di public & admin baru (admin-bs Bootstrap terpisah — minor).' },
      { id: 'U4.2', label: 'Konsistensi Bahasa', s: 'PASS', why: 'PSB, SPP, "Portal Wali Santri" konsisten; label tidak variatif.' },
      { id: 'U4.3', label: 'Konvensi Platform', s: 'PASS', why: 'Focus states & border jelas; external link sebagian tandai ↗ (donations:290).' },
      { id: 'U4.4', label: 'Penggunaan Icon', s: 'PASS', why: 'lucide-react konsisten; ikon ada label teks (admin-bs <i> generic — minor).' },
      { id: 'U4.5', label: 'Konsistensi Responsif', s: 'PASS', why: 'Bottom-tab portal, hamburger admin — fitur desktop tetap di mobile.' },
    ],
  },
  {
    id: 'UX5',
    title: 'Error Prevention & Forms',
    score: '5/5',
    denomination: 5,
    denominator: 5,
    items: [
      { id: 'U5.1', label: 'Input Constraints', s: 'PASS', why: 'type=email/tel/number, dropdown utk pilihan, maxLength (kontak:234, biodata:585, payment:741).' },
      { id: 'U5.2', label: 'Timing Validasi', s: 'PASS', why: 'Validasi saat submit + scroll-to-first-error via [aria-invalid] (biodata:223-227).' },
      { id: 'U5.3', label: 'Error Recovery', s: 'PASS', why: 'Semua error tampil & field kosong ditandai; tidak ate firewall.' },
      { id: 'U5.4', label: 'Cegah Aksi Destruktif', s: 'PASS', why: 'Konfirmasi + tombol hapus merah (bg-rose-500, ConfirmDialog:90).' },
      { id: 'U5.5', label: 'Smart Default & Autofill', s: 'PASS', why: 'autocomplete lengkap (login, register, biodata); default category reguler.' },
    ],
  },
  {
    id: 'UX6',
    title: 'Empty States & Onboarding',
    score: '5/5',
    denomination: 5,
    denominator: 5,
    items: [
      { id: 'U6.1', label: 'Pengalaman Pertama', s: 'PASS', why: 'PublicEmptyState + langkah jelas; tidak ada layar kosong.' },
      { id: 'U6.2', label: 'Empty Data States', s: 'PASS', why: 'Tabel admin "Belum ada data" + EmptyState admin-bs (ui.tsx:55).' },
      { id: 'U6.3', label: 'Zero-Data Dashboard', s: 'N/A', why: 'Dashboard admin = quick-links (aman), tidak ada grafik koyak.' },
      { id: 'U6.4', label: 'Onboarding', s: 'PASS', why: 'Wizard stepper 5 langkah dengan info-card (biodata:348-354).' },
      { id: 'U6.5', label: 'Akses Bantuan', s: 'PASS', why: 'Halaman /kontak + tombol bantuan di beberapa titik.' },
    ],
  },
  {
    id: 'UX7',
    title: 'Microcopy & Content UX',
    score: '4/5',
    denomination: 4,
    denominator: 5,
    items: [
      { id: 'U7.1', label: 'Kejelasan CTA', s: 'PASS', why: '"Daftar Sekarang", "Simpan & Lanjut ke Data Orang Tua" — outcome-driven (biodata:640).' },
      { id: 'U7.2', label: 'Label vs Placeholder', s: 'PASS', why: 'Label persistent konsisten; placeholder pelengkap.' },
      { id: 'U7.3', label: 'Kualitas Pesan Error', s: 'PASS', why: 'Spesifik per-field ("NIK harus 16 digit angka", "No HP tidak valid").' },
      { id: 'U7.4', label: 'Consequence Copy', s: 'PASS', why: 'Dialog menyebut konsekuensi ("Data yang dihapus tidak bisa dikembalikan" — kas:122).' },
      { id: 'U7.5', label: 'Konsistensi Microcopy', s: 'PASS', why: 'Istilah satu-per-konsep; nada konsisten.' },
    ],
  },
  {
    id: 'UX8',
    title: 'Trust & Credibility',
    score: '1/4',
    denomination: 1,
    denominator: 4,
    items: [
      { id: 'U8.1', label: 'Social Proof', s: 'FAIL', why: 'NOL testimonial; angka donatur palsu (Math.max(...) di donations:233).', fix: 'Testimonial asli + SPT counter dari DB.' },
      { id: 'U8.2', label: 'Transparansi', s: 'PASS', why: 'Profil pidato & identitas pondok; pricing PSB via jadwal gelombang (psb:48-57).' },
      { id: 'U8.3', label: 'Security Signals', s: 'FAIL', why: 'Tidak ada badge enkripsi/SSL di titik pembayaran (hanya klaim "Aman & Transparan" donations:309).', fix: 'Tampilkan badge "Transaksi Terenkripsi SSL" di payment/wallet.' },
      { id: 'U8.4', label: 'Professional Polish', s: 'FAIL', why: 'Banner internal "Login Google belum dikonfigurasi di server" tampil ke publik (login:159-161); foto pimpinan stock.', fix: 'Sembunyikan pesan dev saat production.' },
      { id: 'U8.5', label: 'Konsistensi Brand', s: 'PASS', why: 'Logo, palet, tone konsisten lintas halaman.' },
    ],
  },
];

const FULLSCORE = { ok: 38, denom: 48 };
const UXSCORE = { ok: 28, denom: 39 };

const CRIT = [
  { id: '6.1', t: 'JWT_SECRET & AI key produksi plaintext di repo (.env, deploy/backend_env_notes.txt) + backup arsip menyertakan .env & wa_session.db' },
  { id: '6.8', t: 'FileServer publik /uploads/* masih menyajikan folder proofs (bukti pembayaran & dokumen PSB) bila route tak tertutup' },
];
const HIGH = [
  { id: '6.7', t: 'Tidak ada Content-Security-Policy di header live; CDN (AdminLTE/GA/GFonts) tanpa SRI' },
  { id: '7.2', t: 'Endpoint AI (/news/generate) tanpa rate-limit khusus — risiko biaya API & spam' },
  { id: '8.1', t: 'Meta/description identik untuk SEMUA berita/donasi (per-slug metadata tidak ada)' },
  { id: '2.5', t: 'Klaim "500+ Donatur" & jumlah donatur sintetis di /donations — data tidak dari DB (risiko hukum/kredibilitas)' },
];
const MED = [
  { id: 'U3.2', t: 'Wizard PSB tanpa beforeunload/autosave — isian bisa hilang' },
  { id: 'U3.5', t: 'Sesi expired redirect senyap tanpa notice' },
  { id: 'U1.5', t: 'Validasi hanya saat submit, tidak onBlur' },
  { id: '5.3', t: 'Label form tanpa htmlFor; icon button tanpa aria-label (admin-bs)' },
  { id: '7.3', t: 'Raw error AI bocor ke klien (news/generate, chat)' },
  { id: '9.3', t: 'Belum ada mekanisme hapus akun (right to erasure)' },
  { id: '3.2', t: 'Touch target item menu mobile <44px' },
  { id: '10.4', t: 'GA4 tanpa event konversi & tanpa error monitoring' },
  { id: 'U3.1', t: 'Dua sistem konfirmasi hapus (custom vs window.confirm 19x)' },
];

const TOP5 = [
  'Rotasi & pindahkan JWT_SECRET + AI key keluar repo; kecualikan .env & wa_session.db dari backup.',
  'Pagar /uploads/proofs/ (owner-only) + tutup listing publik; tambah rate-limit khusus endpoint AI.',
  'Pasang Content-Security-Policy di header + SRI untuk semua CDN (AdminLTE, GA4, Google Fonts).',
  'Jadikan angka donatur & testimoni asli dari database (hapus sintetis + hardcode).',
  'Tambah per-slug SEO metadata (generateMetadata + canonical) untuk news/donasi/galeri/videos.',
];

function statusChip(s: Item['s']) {
  if (s === 'PASS') return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-black text-emerald-700"><CheckCircle2 size={12} /> PASS</span>;
  if (s === 'FAIL') return <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-black text-rose-700"><XCircle size={12} /> FAIL</span>;
  return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-black text-slate-500">N/A</span>;
}

function CatCard({ cat }: { cat: Cat }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-black uppercase tracking-widest text-emerald-700">
          K{cat.id} · {cat.title}
        </h2>
        <span className="text-sm font-black text-slate-900">{cat.score}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-500"
          style={{ width: `${(cat.denomination / cat.denominator) * 100}%` }}
        />
      </div>
      <ul className="mt-4 divide-y divide-slate-100">
        {cat.items.map((it) => (
          <li key={it.id} className="py-2.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-slate-800">
                <span className="font-mono text-xs text-slate-400">{it.id}</span> · {it.label}
              </p>
              {statusChip(it.s)}
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500">{it.why}</p>
            {it.fix && (
              <p className="mt-1 flex items-start gap-1.5 text-xs font-medium leading-5 text-amber-700">
                <RefreshCcw size={12} className="mt-0.5 shrink-0" /> {it.fix}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AuditPage() {
  const combined = FULLSCORE.ok + UXSCORE.ok;
  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <ShieldCheck size={30} className="text-emerald-600" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-600">Full-Stack Audit</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Audit Menyeluruh 90 Checkpoint</h1>
            <p className="mt-1 text-sm text-slate-500">
              24 September 2026 · jilid 36 · ditarik dari kode & pengujian live (bukan klaim) · menggantikan halaman audit 19 September.
            </p>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:border-emerald-300">
            <ArrowLeft size={14} /> Beranda
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Full-Stack</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{FULLSCORE.ok}<span className="text-lg text-slate-400">/{FULLSCORE.denom}</span></p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(FULLSCORE.ok / FULLSCORE.denom) * 100}%` }} />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">UX</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{UXSCORE.ok}<span className="text-lg text-slate-400">/{UXSCORE.denom}</span></p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(UXSCORE.ok / UXSCORE.denom) * 100}%` }} />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Gabungan</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{combined}<span className="text-lg text-slate-400">/{FULLSCORE.denom + UXSCORE.denom}</span></p>
            <p className="mt-1 text-xs font-bold text-slate-500">{Math.round((combined / (FULLSCORE.denom + UXSCORE.denom)) * 100)}% — layak produksi, sisa perbaikan prioritas.{' '}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-red-700"><AlertTriangle size={16} /> Kritis ({CRIT.length})</h2>
            <ul className="mt-3 space-y-2">
              {CRIT.map((c) => (
                <li key={c.id} className="text-xs leading-5 text-slate-700"><b className="font-mono">{c.id}</b> · {c.t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-amber-700"><Database size={16} /> Tinggi ({HIGH.length})</h2>
            <ul className="mt-3 space-y-2">
              {HIGH.map((c) => (
                <li key={c.id} className="text-xs leading-5 text-slate-700"><b className="font-mono">{c.id}</b> · {c.t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500"><FileText size={16} /> Sedang ({MED.length})</h2>
            <ul className="mt-3 space-y-2">
              {MED.map((c) => (
                <li key={c.id} className="text-xs leading-5 text-slate-700"><b className="font-mono">{c.id}</b> · {c.t}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-emerald-700"><ArrowRight size={16} /> Top 5 Prioritas</h2>
          <ol className="mt-3 space-y-2">
            {TOP5.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-black text-white">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-10">
          <h1 className="flex items-center gap-2 text-xl font-black text-slate-900"><Lock size={20} className="text-emerald-600" /> Full-Stack Audit · {FULLSCORE.ok}/{FULLSCORE.denom} ({FULLSCORE.denom} item, 2 N/A)</h1>
          <p className="mt-1 text-sm text-slate-500">10 kategori · 50 checkpoint (48 dinilai). Diuji dari kode backend Go & frontend Next.js + header/login live.</p>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {FULL.map((c) => <CatCard key={c.id} cat={c} />)}
          </div>
        </div>

        <div className="mt-10">
          <h1 className="flex items-center gap-2 text-xl font-black text-slate-900"><FileCheck2 size={20} className="text-emerald-600" /> UX Audit · {UXSCORE.ok}/{UXSCORE.denom}</h1>
          <p className="mt-1 text-sm text-slate-500">8 kategori · 40 checkpoint (39 dinilai). Fokus pengalaman nyata wali santri & admin.</p>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {UX.map((c) => <CatCard key={c.id} cat={c} />)}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-600"><Download size={16} /> Catatan Metodologi</h2>
          <ul className="mt-3 space-y-1.5 text-xs leading-5 text-slate-500">
            <li>· Skor didasarkan kode repo (apps/backend + apps/frontend) dengan bukti path:line, bukan hanya klaim.</li>
            <li>· Header HTTP, robots, sitemap, manifest, 404, & halaman legal diverifikasi langsung via live situs (24 Sep 2026).</li>
            <li>· Checkpoint N/A (9.5 perlindungan data, 10.3 dark mode, U3.4/U6.3) tidak dimasukkan penyebut — sifat aplikasi memang tidak butuh.</li>
            <li>· Item PASS bisa menyertakan catatan minor non-blokir dalam teks penjelasan.</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/psb" className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow transition hover:bg-emerald-700">
            <ExternalLink size={16} /> Info PSB
          </Link>
          <Link href="/portal" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-300">
            <Search size={16} /> Buka Portal Wali
          </Link>
          <Link href="/donations" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-300">
            <AlertTriangle size={16} /> Halaman Donasi
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}