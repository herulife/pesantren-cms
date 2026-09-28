// Audit data. Server-only: this file carries file paths, configuration detail
// and forensic findings, so it must never reach the client bundle. The page
// passes rendered values to the client component as props.
import "server-only";

import { SEVERITY_META } from "@/lib/audit-full-types";
import type {
  AuditScore,
  Domain,
  Finding,
  ForensicFact,
  Measurement,
  MethodStep,
  PageAuditRow,
  Severity,
  TimelineEntry,
} from "@/lib/audit-full-types";

export const FINDINGS: Finding[] = [
  {
    id: "SEC-01",
    severity: "critical",
    domain: "Keamanan",
    title: "Rate limiter login bisa dilewati dengan memalsukan X-Forwarded-For",
    impact:
      "Penyerang bisa mencoba ribuan kombinasi password tanpa pernah kena limit, karena aplikasi mempercayai header X-Forwarded-For yang dikirim klien. Impact-nya langsung membuka jalur brute force ke akun admin.",
    evidence: [
      "internal/platform/middleware/ratelimit.go:97-128 — clientIP() memakai X-Forwarded-First sebagai kunci limit",
      "Origin Nginx tidak dibatasi ke CIDR Cloudflare, jadi request bisa langsung bypass Cloudflare dan menuju origin",
      "Dikonfirmasi: 60 request beruntun dari spoofed XFF tidak pernah menghasilkan HTTP 429",
    ],
    fix: "Hanya percayai X-Forwarded-For jika request benar-benar datang dari IP Cloudflare. Ambil IP dari \$remote_addr di Nginx, set real_ip_header, dan whitelist CIDR Cloudflare di level origin.",
    effort: "kecil",
  },
  {
    id: "FUN-01",
    severity: "critical",
    domain: "Fungsional",
    title: "Halaman donasi publik selalu kosong karena endpoint di balik RBAC bendahara",
    impact:
      "Bagian 'Program Aktif' di /donations tidak pernah menampilkan satu pun program. Pengunjung melihat pesan 'Program donasi akan ditampilkan di sini' secara permanen, padahal database sudah berisi data kampanye. Ini fitur donasi yang mati_total di sisi publik.",
    evidence: [
      "cmd/api/main.go:331-333 — r.Mount(\"/donations\", ...) berada di dalam r.Use(auth.RequireRole(\"bendahara\"))",
      "internal/features/donations/handler.go:155 — r.Get(\"/campaigns\", h.GetCampaigns) ikut terlindungi",
      "src/lib/api.ts:876 — frontend publik memanggil /donations/campaigns tanpa kredensial",
      "Diverifikasi live: GET /api/donations/campaigns → HTTP 401 \"Sesi login tidak ditemukan\"",
      "Diverifikasi di browser: 0 kartu kampanye, 0 nilai Rupiah yang ter-render",
    ],
    fix: "Pisahkan endpoint baca publik dari endpoint tulis. Mount GET /campaigns ke router publik dengan filter is_active, dan biarkan POST/DELETE tetap di balik RequireRole(\"bendahara\").",
    effort: "kecil",
  },
  {
    id: "SEC-02",
    severity: "high",
    domain: "Keamanan",
    title: "Tidak ada account lockout dan tidak ada MFA untuk akun admin",
    impact:
      "Selain batas password yang hanya 8 karakter, satu-satunya pertahanan login adalah UI. Password yang berhasil ditebak memberi akses admin penuh ke data ultrasantri, nilai donasi, dan sistem akademik.",
    evidence: [
      "internal/validators/auth.go:39,57,76,99 — batas password hanya 8 karakter, tanpa kamus kata lemah",
      "Tidak ada handler lockout atau MFA di seluruh internal/features/auth/",
      "Reset password dan aktivasi 2FA dikirim lewat WhatsApp tanpa verifikasi identitas tambahan",
    ],
    fix: "Tambahkan exponential backoff + lockout sementara per akun dan per IP, naikkan batas password minimal 12 karakter dengan cek daftar kata lemah, lalu sediakan TOTP untuk peran admin.",
    effort: "besar",
  },
  {
    id: "SEC-03",
    severity: "high",
    domain: "Keamanan",
    title: "Semua activity log mencatat IP gateway Docker, bukan IP klien",
    impact:
      "Jejak audit tidak bisa dipakai untuk investigating insiden. Semua attacker terlihat datang dari IP internal yang sama, sehingga log tidak punya nilai forensik.",
    evidence: [
      "Setiap entri activity_logs memiliki IP identik 172.18.0.x",
      "Nginx sudah meneruskan \$remote_addr dengan benar, jadi data ada di hulu tetapi dibuang di aplikasi",
      "Berkas log aplikasi juga bisa dihapus tanpa batas retensi",
    ],
    fix: "Teruskan IP asli dari header yang sudah diset Nginx dan ambil hanya dari situ. Tambahkan retensi minimal 90 hari plus ekspor harian ke penyimpanan yang tidak bisa ditulis oleh container yang sama.",
    effort: "kecil",
  },
  {
    id: "SEC-04",
    severity: "high",
    domain: "Keamanan",
    title: "Origin Nginx dapat diakses langsung tanpa melewati Cloudflare",
    impact:
      "Semua proteksi edge Cloudflare — WAF, rate limiting, dan challenge bot — bisa dilewati total dengan الأربعi IP server. Rate limiter bocor via XFF (SEC-01) baru berbahaya karena celah ini ada.",
    evidence: [
      "IP origin 103.107.206.10 menjawab HTTP langsung tanpa melewati Cloudflare",
      "/etc/nginx/sites-available/darussunnahparung.com tidak memiliki allow/deny berbasis CIDR",
    ],
    fix: "Batasi Nginx agar hanya menerima trafik dari rentang IP Cloudflare, atau tutup port 80/443 di firewall danroxexcept dari Cloudflare.",
    effort: "kecil",
  },
  {
    id: "SEC-05",
    severity: "high",
    domain: "Keamanan",
    title: "Halaman laporan insiden publik membocorkan detail post-mortem",
    impact:
      "/audit-hacked/jsendangera buka tanpa autentikasi dan memuat kronologi, endpoint yang diserang, serta sidik jari perangkat penyerang. Ini memberi attacker peta gratis untuk percobaan ulang.",
    evidence: [
      "src/app/audit-hacked/page.tsx dapat diakses anonim, HTTP 200",
      "robots.txt hanya memblokir /audit dan /audit-hasil, bukan /audit-hacked",
      "Next.js middleware tidak memverifikasi sesi pada route tersebut",
    ],
    fix: "Tambahkan pemeriksaan sesi admin di route, atau pindahkan laporan ke lokasi privat. Pastikan robots.txt memblokir /audit-hacked juga.",
    effort: "kecil",
  },
  {
    id: "SEC-06",
    severity: "high",
    domain: "Operasional",
    title: "SSH menerima autentikasi password dengan kredensial yang sudah terekspos",
    impact:
      "Password SSH sudah pernah muncul di beberapa audit internal. Login SSH berarti root shell penuh, membuat SEC-01 sampai SEC-05 tidak berarti apa-apa.",
    evidence: [
      "sshd menerima PasswordAuthentication, root login diizinkan",
      "Tidak ada fail2ban atau rate limit di lapisan SSH",
      "Kredensial yang sama dipakai ulang untuk context database dan aplikasi",
    ],
    fix: "Matikan PasswordAuthentication dan PermitRootLogin, pasang fail2ban, gunakan hanya kunci SSH. Rotasi password yang pernah muncul di log atau laporan.",
    effort: "kecil",
  },
  {
    id: "OPS-01",
    severity: "high",
    domain: "Operasional",
    title: "Secret placeholder masih aktif dan tidak ada backup off-site",
    impact:
      "JWT_SECRET dan kredensial database masih memakai nilai contoh dari template. Kalau nilainya singkat, token sesi bisa ditebak. Backup juga hanya residing di disk yang sama — ransomware atau salah hapus menghapus situs dan backup sekaligus.",
    evidence: [
      "JWT_SECRET, DATABASE_URL, dan APP_KEY masih bernilai placeholder di environment",
      "Backup SQLite hanya di /home/ubuntu24/backup lokal, tidak ada salinan ke storage terpisah",
      "Belum pernah ada uji restore",
    ],
    fix: "Generate secret acak 32 byte untuk setiap environment, masukkan ke secret manager, lalu salin backup harian ke object storage berbeda dan jalankan restore drill berkala.",
    effort: "sedang",
  },
  {
    id: "OPS-02",
    severity: "high",
    domain: "Operasional",
    title: "94 perubahan uncommitted belum pernah di-commit",
    impact:
      "Seluruh pekerjaan redesign dan fitur terbaru hanya ada di working tree. Satu perintah salah, rsync salah, atau disk penuh berarti kehilangan semuanya tanpa riwayat.",
    evidence: [
      "git status melaporkan 94 file berubah di branch feat/redesign-home",
      "Commit terakhir 3b651f2 2 Sep 2026 — semua perubahan setelah itu tidak terlindungi",
      "Tidak ada remote push ke feat/redesign-home",
    ],
    fix: "Commit perubahan secara bertahap dengan pesan jelas, lalu push ke branch terpisah dan buka PR agar ada review sebelum merge ke main.",
    effort: "kecil",
  },
  {
    id: "SEC-07",
    severity: "medium",
    domain: "Keamanan",
    title: "Content Security Policy bertentangan dengan aset yang benar-benar dipakai situs",
    impact:
      "CSP sekarang hanya report-only karena tidak sesuai dengan kebutuhan situs, tapi tetap|Issue 15+ pelanggaran di setiap muat halaman. jokedCSP ini bom waktu: begitu diaktifkan, peta Google, video Drive, dan font langsung rusak.",
    evidence: [
      "default-src 'self' memblokir maps.google.com, drive.google.com, fonts.gstatic.com, static.cloudflareinsights.com",
      "15+ pelanggaran CSP tercatat per halaman, dikonfirmasi lewat Playwright",
      "Halaman /kontak memuat peta dalam iframe yang ikut ter-flag",
    ],
    fix: "Tulis CSP yang sesuai: frame-src untuk drive.google.com dan maps.google.com, font-src untuk fonts.gstatic.com, style-src untuk fonts.googleapis.com, script-src untuk Cloudflare beacon. Uji dengan report-only, baru ubah menjadi enforcing.",
    effort: "sedang",
  },
  {
    id: "SEC-08",
    severity: "medium",
    domain: "Keamanan",
    title: "Header x-powered-by membocorkan framework dan direktori upload world-writable",
    impact:
      "x-powered-by memudahkan fingerprinting stack. Direktori upload 0777 berarti proses lain di host yang salah konfigurasi bisa menimpa berkas gambar yang ditampilkan pengguna.",
    evidence: [
      "Respons HTTP memuat header x-powered-by: Next.js",
      "internal/platform/ai/image.go:19 — upload disimpan dengan permission 0777",
      "Backend container berjalan sebagai root",
    ],
    fix: "Matikan x-powered-by di next.config, ubah permission upload ke 0755 atau 0644, dan jalankan container sebagai user non-root.",
    effort: "kecil",
  },
  {
    id: "PERF-01",
    severity: "medium",
    domain: "Performa",
    title: "Gambar dimuat sebagai CSS background sehingga kehilangan optimasi Next.js",
    impact:
      "Semua gambar hero dan kartu dimuat sebagai background-image di CSS, jadi next/image tidak pernah dipakai. Tidak ada srcset, tidak ada format modern, dan tidak ada resize untuk layar kecil. Total 3.01 MB ter-decode untuk satu halaman beranda.",
    evidence: [
      "initiatorType 'css' untuk 8 gambar terberat — bypass pipeline optimasi",
      "khalaqoh.jpg 345 KB, tasmi.jpg 301 KB, tahfidz.jpg 258 KB, manasik.jpg 166 KB",
      "Total 3.01 MB decoded dari 77 resource di beranda",
      "Format masih JPEG/png — tidak ada WebP/AVIF untuk gambar dari CSS",
    ],
    fix: "Ganti background-image dengan elemen <Image> dari next/image memakai layout fill, tambahkan sizes yang benar, dan jalankan pengoptimalan aset lewat build step.",
    effort: "besar",
  },
  {
    id: "PERF-02",
    severity: "medium",
    domain: "Performa",
    title: "Tiga iframe video 630px dimuat bersamaan saat halaman pertama dibuka",
    impact:
      "Halaman beranda memuat tiga video Drive sekaligus pada viewport 1120x630, plus peta. Embed pihak ketiga adalah sumber scripting terbesar dan menahan event load hingga 3 detik.",
    evidence: [
      "3 iframe drive.google.com dengan clientHeight 630 dimuat eager, loading=\"auto\"",
      "Tidak ada title pada keempat iframe — masalah aksesibilitas sekaligus",
      "Load complete 3051 ms dibanding DOMContentLoaded 311 ms",
    ],
    fix: "Ganti iframe dengan thumbnail YouTube yang diklik untuk memutar, sehingga tidak ada skrip pihak ketiga yang berjalan sebelum pengguna meminta. Tambahkan title deskriptif pada setiap iframe yang dipertahankan.",
    effort: "sedang",
  },
  {
    id: "PERF-03",
    severity: "low",
    domain: "Performa",
    title: "Dua keluarga font dimuat dari Google Fonts sebagai blocking dependency",
    impact:
      "Inter dan Plus Jakarta Sans diambil dari host pihak ketiga, menambah koneksi blocking dan mengirim data pengunjung ke Google pada setiap muat halaman. Untuk situs sekolah, ini juga polypropylene privasi.",
    evidence: [
      "fonts.googleapis.com dan fonts.gstatic.com menjadi dependency render-critical",
      "Host font.gstatic.com tidak ada di allow-list CSP saat ini",
      "Body memakai Plus Jakarta Sans dengan fallback Inter",
    ],
    fix: "Self-host kedua font dengan next/font, subset ke karakter yang dipakai, dan preload hanya weight yang benar-benar dipakai.",
    effort: "sedang",
  },
  {
    id: "A11Y-01",
    severity: "medium",
    domain: "Aksesibilitas",
    title: "Tombol navigasi dan carousel tidak punya accessible name",
    impact:
      "Pembaca layar announce tombol sebagai 'button' tanpa keterangan. Pengguna buta tidak bisa membuka menu atauheer slider hero.",
    evidence: [
      "Beranda: 3 tombol tanpa teks dan tanpa aria-label (menu mobile, hero-prev, hero-next)",
      "Hampir setiap halaman punya 1 tombol tanpa label",
      "Link logo menuju /login juga tanpa teks aksesibel",
    ],
    fix: "Tambahkan aria-label deskriptif, misalnya 'Buka menu navigasi', 'Slide sebelumnya', 'Slide berikutnya', dan 'Masuk ke dasbor'.",
    effort: "kecil",
  },
  {
    id: "A11Y-02",
    severity: "medium",
    domain: "Aksesibilitas",
    title: "Sembilan dari dua belas gambar tanpa dimensi dan tidak ada skip link",
    impact:
      "Gambar tanpa width/height menyebabkan layout bergeser saat konten termuat. Tanpa skip link, pengguna keyboard harus menembus puluhan elemen navigasi untuk mencapai konten utama.",
    evidence: [
      "9 dari 12 gambar di beranda tidak punya atribut width/height",
      "0 dari 10 halaman yang diuji memiliki skip link",
      "Halaman /login tidak memakai landmark <main> sama sekali",
    ],
    fix: "Tambahkan width/height atau aspect-ratio pada setiap gambar, sisipkan skip link 'Lewati ke konten utama' sebagai elemen pertama, dan bungkus halaman login dengan <main>.",
    effort: "kecil",
  },
  {
    id: "A11Y-03",
    severity: "low",
    domain: "Aksesibilitas",
    title: "Link eksternal target=_blank tanpa rel=noopener",
    impact:
      "Tab baru yang dibuka mempertahankan referensi window opener. Pada browser lama ini jadi celah tabnabbing, dan pengguna kehilangan konteks bahwa mereka pindah tab.",
    evidence: [
      "2 link di /kontak membuka tab baru tanpa rel=noopener",
      "Focus ring default browser terlihat, jadi keyboard focus tidak hilang total",
    ],
    fix: "Tambahkan rel=\"noopener noreferrer\" pada setiap link yang memakai target=\"_blank\".",
    effort: "kecil",
  },
  {
    id: "SEO-01",
    severity: "medium",
    domain: "SEO",
    title: "Empat h1 di beranda, dua halaman tanpa h1 sama sekali",
    impact:
      "Empat h1SATU di halaman beranda membuat hierarki dokumen ambigu, sedangkan /news dan /galeri tidak punya h1 — sinyal utama topik halaman hilang tepat di dua halaman yang paling bergantung pada mesin pencari.",
    evidence: [
      "Beranda: 4 elemen h1 ('Menghafal Al-Quran...', 'Tahfidz dan Kurikulum...', 'Belajar, Beribadah...', 'Pondok Pesantren Tahfidz Darussunnah Parung')",
      "/news: h1 count 0",
      "/galeri: h1 count 0",
    ],
    fix: "Jadikan hanya satu h1 per halaman, biasanya judul section utama. Ubah h1 card carousel menjadi h2 atau h3 dengan hierarki yang benar.",
    effort: "kecil",
  },
  {
    id: "SEO-02",
    severity: "low",
    domain: "SEO",
    title: "Tidak ada structured data di seluruh situs",
    impact:
      "Situs sekolah tanpa JSON-LD kehilangan peluang rich result:OPE Publishing, event, dan FAQ tidak akan pernah muncul sebagai hasil kaya.",
    evidence: [
      "0 script application/ld+json di beranda",
      "Metadata OG lengkap (10 tag) dan canonical sudah ada — fondasinya sudah siap",
    ],
    fix: "Tambahkan JSON-LD Organization untuk Avoiding, FAQPage untuk seksi FAQ yang sudah ada, dan Event untuk agenda.",
    effort: "sedang",
  },
  {
    id: "API-01",
    severity: "medium",
    domain: "Kualitas Kode",
    title: "Setiap halaman publik memicu 401 sehingga console penuh error",
    impact:
      "Frontend memanggil /api/me dan /api/donations/campaigns di halaman yang memang publik, dan keduanya menjawab 401. Akibatnya console browser kosong dari error, sulit dipakai untuk debugging, dan/CDN log Rammed noisy.",
    evidence: [
      "10 halaman diuji, 4 respons 401 tercatat hanya dari navigasi normal",
      "Diverifikasi: GET /api/me dan /api/donations/campaigns → 401 'Sesi login tidak ditemukan'",
    ],
    fix: "Hentikan pemanggilan /api/me di route publik, atau perlakukan 401 sebagai kondisi normal tanpa log error. Perbaiki FUN-01 untuk endpoint kampanye.",
    effort: "kecil",
  },
  {
    id: "QA-01",
    severity: "high",
    domain: "Kualitas Kode",
    title: "Frontend tanpa satu pun test, dengan beberapa file ribuan baris",
    impact:
      "42.581 baris TypeScript tanpa test file. Perubahan pada auth, donasi, atau upload tidak punya jaring pengaman, dan regresi baru ketahuan setelah deploy ke produksi.",
    evidence: [
      "0 file *.test.* atau *.spec.* di seluruh apps/frontend",
      "Backend punya 12 file _test.go untuk 17.858 baris Go",
      "TabWebsiteBuilder.tsx 2.431 baris, api.ts 2.307 baris, PageBuilderEditor.tsx 1.406 baris",
      "src/app/page.tsx 1.152 baris untuk satu halaman beranda",
    ],
    fix: "Tambahkan test untuk jalur kritis lebih dulu — login, rate limit, dan endpoint donasi. Pecah api.ts per domain dan TabWebsiteBuilder per tab.",
    effort: "besar",
  },
  {
    id: "OPS-03",
    severity: "low",
    domain: "Operasional",
    title: "Build image 2.43 GB dan Docker build cache 19.1 GB",
    impact:
      "Deploy lambat dan boros ruang disk. Image sebesar itu memperlambat setiap build dan rebuild, dan image besar juga memperbesar permukaan serang bila base image punya CVE.",
    evidence: [
      "Image darussunnah-frontend berukuran 2.43 GB",
      "Docker build cache 19.1 GB di host yang sama",
      "Dockerfile dan .dockerignore sudah masuk daftar perbaikan",
    ],
    fix: "Gunakan multi-stage build, salin hanya .next standalone, dan jalankan docker image prune berkala untuk cache.",
    effort: "sedang",
  },
];

export const SEVERITY_COUNT: Record<Severity, number> = FINDINGS.reduce(
  (acc, f) => {
    acc[f.severity] += 1;
    return acc;
  },
  { critical: 0, high: 0, medium: 0, low: 0 } as Record<Severity, number>
);

export const FINDING_TOTAL = FINDINGS.length;

export const HEADLINE_METRICS: Measurement[] = [
  {
    label: "Temuan",
    value: String(FINDING_TOTAL),
    note: `${SEVERITY_COUNT.critical} kritis, ${SEVERITY_COUNT.high} tinggi, ${SEVERITY_COUNT.medium} sedang, ${SEVERITY_COUNT.low} rendah`,
    tone: "bad",
  },
  {
    label: "TTFB beranda",
    value: "264 ms",
    note: "Asal: 279 ms lewat Cloudflare",
    tone: "good",
  },
  {
    label: "Berat muat beranda",
    value: "3.01 MB",
    note: "77 resource, tanpa optimasi gambar",
    tone: "bad",
  },
  {
    label: "Load complete",
    value: "3.05 s",
    note: "DOMContentLoaded hanya 311 ms",
    tone: "warn",
  },
  {
    label: "Halaman diuji",
    value: "10",
    note: "3 breakpoint, 390 px sampai 1440 px",
    tone: "good",
  },
  {
    label: "Test otomatis",
    value: "0",
    note: "Frontend tanpa test, backend 12 file",
    tone: "bad",
  },
];

export const DOMAIN_SUMMARY: { domain: Domain; count: number; worst: Severity }[] = (
  Object.entries(
    FINDINGS.reduce<Record<string, number>>((acc, f) => {
      acc[f.domain] = (acc[f.domain] ?? 0) + 1;
      return acc;
    }, {})
  ) as [Domain, number][]
)
  .map(([domain, count]) => ({
    domain,
    count,
    worst: FINDINGS.filter((f) => f.domain === domain)
      .map((f) => f.severity)
      .sort(
        (a, b) => SEVERITY_META[a].rank - SEVERITY_META[b].rank
      )[0],
  }))
  .sort((a, b) => b.count - a.count);

export const PAGE_AUDIT: PageAuditRow[] = [
  {
    path: "/",
    label: "Beranda",
    status: 200,
    ms: 5240,
    h1: 4,
    img: 12,
    imgNoDims: 9,
    btnNoLabel: 3,
    note: "4 iframe pihak ketiga, tanpa JSON-LD",
  },
  {
    path: "/profil",
    label: "Profil",
    status: 200,
    ms: 2854,
    h1: 1,
    img: 2,
    imgNoDims: 0,
    btnNoLabel: 1,
    note: "Struktur heading bersih",
  },
  {
    path: "/program",
    label: "Program",
    status: 200,
    ms: 3090,
    h1: 1,
    img: 8,
    imgNoDims: 6,
    btnNoLabel: 1,
    note: "6 gambar tanpa dimensi",
  },
  {
    path: "/news",
    label: "Berita",
    status: 200,
    ms: 3055,
    h1: 0,
    img: 5,
    imgNoDims: 3,
    btnNoLabel: 1,
    note: "Tidak ada h1 sama sekali",
  },
  {
    path: "/galeri",
    label: "Galeri",
    status: 200,
    ms: 3088,
    h1: 0,
    img: 2,
    imgNoDims: 0,
    btnNoLabel: 1,
    note: "Tidak ada h1 sama sekali",
  },
  {
    path: "/donations",
    label: "Donasi",
    status: 200,
    ms: 3039,
    h1: 1,
    img: 2,
    imgNoDims: 0,
    btnNoLabel: 1,
    note: "Kampanye tidak pernah termuat (FUN-01)",
  },
  {
    path: "/kontak",
    label: "Kontak",
    status: 200,
    ms: 3307,
    h1: 1,
    img: 2,
    imgNoDims: 0,
    btnNoLabel: 1,
    note: "2 link _blank tanpa noopener",
  },
  {
    path: "/login",
    label: "Login",
    status: 200,
    ms: 2871,
    h1: 1,
    img: 0,
    imgNoDims: 0,
    btnNoLabel: 0,
    note: "Tanpa landmark main",
  },
  {
    path: "/agendas",
    label: "Agenda",
    status: 200,
    ms: 2832,
    h1: 1,
    img: 2,
    imgNoDims: 0,
    btnNoLabel: 1,
    note: "Bersih",
  },
  {
    path: "/facilities",
    label: "Fasilitas",
    status: 200,
    ms: 3056,
    h1: 1,
    img: 4,
    imgNoDims: 2,
    btnNoLabel: 1,
    note: "2 gambar tanpa dimensi",
  },
];

export const FORENSIC_TIMELINE: TimelineEntry[] = [
  {
    time: "17:52:53",
    event: "Percobaan login pertama tercatat,respons 401",
    tone: "warn" as const,
  },
  {
    time: "17:52:59",
    event: "Percobaan kedua, respons 200 — sesi berhasil dibuka",
    tone: "bad" as const,
  },
  {
    time: "19:49:55",
    event: "Aktivitas dimulai dari satu fingerprint, 409 request dalam 21 menit",
    tone: "bad" as const,
  },
  {
    time: "20:11:01",
    event: "Aktivitas berhenti, total 409 request",
    tone: "warn" as const,
  },
];

export const FORENSIC_FACTS: ForensicFact[] = [
  {
    label: "Tanggal insiden",
    value: "21 September 2026",
    note: "Bukan 22 September seperti sempat disimpulkan sebelumnya",
  },
  {
    label: "Fingerprint perangkat",
    value: "Infinix X6837 — Android 13, WebView",
    note: "Satu user agent konsisten sepanjang insiden",
  },
  {
    label: "Jumlah request",
    value: "409 dalam 21 menit",
    note: "19:49:55 sampai 20:11:01 WIB",
  },
  {
    label: "Metode akses",
    value: "Kredensial, bukan brute force",
    note: "Dua percobaan, langsung berhasil di percobaan kedua",
  },
  {
    label: "Akses SSH",
    value: "Tidak terbukti",
    note: "Tidak ada anomali pada log sshd di rentang insiden",
  },
  {
    label: "IP asli",
    value: "Tidak dapat ditentukan",
    note: "Log lokal hanya menyimpan IP edge Cloudflare dan gateway Docker",
  },
];

export const FORENSIC_GAPS: string[] = [
  "Token Cloudflare di ~/.cf_token.sh ditolak sebagai 'Invalid API Token', sehingga log edge tidak dapat diambil ulang",
  "Log aplikasi dapat dihapus tanpa batas retensi, jadi rantai bukti tidak tamper-resistant",
  "Correlation ID dihapus saat payload error, menyulitkan penelusuran lintas request",
];

export const METHOD: MethodStep[] = [
  {
    step: "01",
    title: "Kode dan infrastruktur",
    body: "Pembacaan source frontend dan backend, konfigurasi Docker Compose, Dockerfile, Nginx, serta environment di host.",
  },
  {
    step: "02",
    title: "Runtime produksi",
    body: "Diverifikasi langsung terhadap darussunnahparung.com: status HTTP, header respons, dan register di container yang berjalan.",
  },
  {
    step: "03",
    title: "Peramban sungguhan",
    body: "Playwright Chromium headless pada 10 halaman dan 3 breakpoint, mengukur console, jaringan, landmark, label aksesibel, dan overflow.",
  },
  {
    step: "04",
    title: "Bukti terukur",
    body: "Setiap temuan memuat file:baris atau angka pengukuran, bukan opini. Bug rate limiter dan bug donasi dibuktikan ulang langsung.",
  },
];

export const SCORE: AuditScore = {
  security: 38,
  performance: 62,
  accessibility: 55,
  seo: 60,
  reliability: 58,
  overall: 54,
} as const;
