// Audit data layer for the /audit technical dashboard.
// Single source of truth: scores are computed from these findings, not hardcoded.
// No secrets, credentials, or internal tokens are stored here.

export type AuditSeverity = "critical" | "high" | "medium" | "low" | "info";
export type AuditCategory =
  | "Security"
  | "Authentication"
  | "Authorization"
  | "API"
  | "Performance"
  | "SEO"
  | "Accessibility"
  | "Code Quality"
  | "Dependencies"
  | "Database"
  | "Deployment"
  | "Testing";

export type AuditStatus = "open" | "fixed" | "not_measured";

export interface AuditIssue {
  id: string;
  severity: AuditSeverity;
  category: AuditCategory;
  title: string;
  description: string;
  impact?: string;
  evidence?: string;
  file?: string;
  line?: number;
  recommendation?: string;
  status: AuditStatus;
}

// Which dashboard score card each category feeds into.
const CARD_GROUPS: Record<string, AuditCategory[]> = {
  Security: ["Security", "Authentication", "Authorization", "API"],
  Performance: ["Performance"],
  SEO: ["SEO"],
  Accessibility: ["Accessibility"],
  "Code Quality": ["Code Quality", "Dependencies"],
  Reliability: ["Database", "Deployment", "Testing"],
};

export const AUDIT_ISSUES: AuditIssue[] = [
  // ---- Security / API / Auth ----
  {
    id: "SEC-01",
    severity: "medium",
    category: "API",
    title: "Telegram webhook gagal-tutup (fail-open) saat secret kosong",
    description:
      "WebhookSecretMatches() mengembalikan true ketika TELEGRAM_WEBHOOK_SECRET tidak disetel, sehingga endpoint publik /api/telegram/webhook menjadi tidak terautentikasi jika bot token terkonfigurasi namun secret tidak.",
    impact:
      "Penyerang dapat memalsukan payload Telegram dan memicu perintah (status sistem, broadcast WhatsApp) bila chat id ada dalam allow-list. Endpoint juga tidak ada rate limit.",
    evidence:
      "internal/platform/telegram/bot.go:127 — `if expected == \"\" { return true }`",
    file: "apps/backend/internal/platform/telegram/bot.go",
    line: 129,
    recommendation:
      "Ubah menjadi fail-closed: kembalikan false bila secret kosong, atau wajibkan secret saat TELEGRAM_BOT_TOKEN disetel. Tambahkan rate limit pada webhook.",
    status: "fixed",
  },
  {
    id: "SEC-02",
    severity: "medium",
    category: "API",
    title: "Rate limiter per-proses & dapat di-bypass via X-Forwarded-For",
    description:
      "Rate limiter menggunakan store in-memory per proses dan mengambil IP paling kiri dari X-Forwarded-For. Di belakang proxy tepercaya (Cloudflare) klien dapat memutar IP untuk melewati batas 5/15 menit pada /login, /register, /auth/google.",
    impact:
      "Brute-force/katalog login lebih mudah; batas tidak dibagi antar instance bila >1 replika.",
    evidence:
      "internal/platform/middleware/ratelimit.go:97 — clientIP membaca header X-Forwarded-For pertama",
    file: "apps/backend/internal/platform/middleware/ratelimit.go",
    line: 97,
    recommendation:
      "Gunakan IP terkanan dari proxy tepercaya atau hanya CF-Connecting-IP; pindahkan state ke store terbagi (Redis) bila multi-instance. Perluas limit ke semua endpoint auth/admin mutating.",
    status: "fixed",
  },
  {
    id: "SEC-03",
    severity: "medium",
    category: "Security",
    title: "HTML hasil AI (GenerateArticle) dikembalikan tanpa sanitasi",
    description:
      "GenerateArticle mengembalikan teks AI apa adanya ke browser admin. Prompt adversarial dapat menghasilkan <script>/event-handler yang dieksekusi di sesi admin (self/preview XSS). Error juga dikembalikan mentah (err.Error()).",
    impact: "Stored/admin XSS melalui draft artikel; kebocoran detail error internal.",
    evidence:
      "internal/features/news/handler.go:311 — responseBody := map[string]interface{}{\"result\": articleText}",
    file: "apps/backend/internal/features/news/handler.go",
    line: 327,
    recommendation:
      "Jalankan articleText melalui sanitizeNewsHTML() sebelum dikembalikan dan gunakan pesan generik untuk error.",
    status: "fixed",
  },
  {
    id: "SEC-04",
    severity: "low",
    category: "Security",
    title: "Sanitizer HTML mengizinkan URL protokol-relatif & style tidak divalidasi",
    description:
      "sanitizedHref mengizinkan skema kosong (//evil.com) dan atribut style diteruskan tanpa validasi CSS.",
    impact:
      "Open-redirect/phishing dari artikel; CSS-injection (url(), expression) pada style.",
    evidence:
      "internal/features/news/sanitize.go:271 — `parsed.Scheme == \"\"` diterima",
    file: "apps/backend/internal/features/news/sanitize.go",
    line: 271,
    recommendation:
      "Tolak skema kosong untuk href; validasi/whitelist atribut style (buang url(), expression, behavior).",
    status: "fixed",
  },
  {
    id: "SEC-05",
    severity: "low",
    category: "Security",
    title: "Error internal bocor ke klien pada wallet & attendance",
    description:
      "Beberapa handler wallet dan attendance mengembalikan err.Error() langsung ke klien.",
    impact:
      "Kebocoran teks error internal (berpotensi SQL/path bila pesan repo berubah).",
    evidence:
      "internal/features/wallet/handler.go:166 dan internal/features/attendance/handler.go:68",
    file: "apps/backend/internal/features/wallet/handler.go",
    line: 166,
    recommendation:
      "Kembalikan pesan generik yang aman; simpan error asli hanya di log server.",
    status: "fixed",
  },
  {
    id: "SEC-06",
    severity: "low",
    category: "Security",
    title: "Gambar AI diunduh & disimpan tanpa validasi sebagai gambar",
    description:
      "ai/image.go menyimpan respons remote apa adanya ke public/uploads/ai tanpa decode/validasi.",
    impact:
      "Konten non-gambar dapat disajikan dari /uploads/ai bila upstream dimuat.",
    evidence:
      "internal/platform/ai/image.go:29 — io.Copy(out, res.Body) tanpa validasi",
    file: "apps/backend/internal/platform/ai/image.go",
    line: 29,
    recommendation:
      "Decode & validasi bytes sebagai gambar sungguhan (reuse sanitizeImage dari upload handler) sebelum disimpan; batasi ukuran.",
    status: "fixed",
  },
  {
    id: "SEC-07",
    severity: "medium",
    category: "Authentication",
    title: "JWT tanpa revocation & tanpa refresh; logout hanya hapus cookie",
    description:
      "Token berlaku 24 jam, tidak ada jti/iat, tidak ada refresh. Logout hanya menghapus cookie klien; token curian tetap valid hingga kedaluwarsa.",
    impact:
      "Token yang dicuri valid hingga 24 jam dan tidak dapat dicabut; tidak ada invalidasi saat ganti password/logout.",
    evidence:
      "internal/features/auth/handler.go:94 — `\"exp\": time.Now().Add(time.Hour * 24)`",
    file: "apps/backend/internal/features/auth/handler.go",
    line: 94,
    recommendation:
      "Tambahkan revocation server-side (denylist jti / tabel sesi) dan/atau access token singkat + refresh; cabut saat logout/ganti password.",
    status: "fixed",
  },
  {
    id: "SEC-08",
    severity: "low",
    category: "Security",
    title: "Header CSRF dideklarasikan tapi tidak divalidasi",
    description:
      "CORS mengizinkan header X-CSRF-Token namun tidak ada middleware yang memvalidasinya. Auth berbasis cookie (SameSite=Lax).",
    impact:
      "Rendah saat ini (SameSite=Lax), namun menyesatkan; bila SameSite dilonggarkan ke None, CSRF terbuka.",
    evidence:
      "cmd/api/main.go:71 — AllowedHeaders menyertakan X-CSRF-Token tanpa validasi",
    file: "apps/backend/cmd/api/main.go",
    line: 71,
    recommendation:
      "Implementasikan & validasi token CSRF untuk metode mutating berbasis cookie, atau dokumentasikan SameSite=Lax sebagai satu-satunya kontrol.",
    status: "fixed",
  },
  {
    id: "FE-01",
    severity: "medium",
    category: "Security",
    title: "FAQ answer dirender sebagai HTML mentah tanpa sanitasi",
    description:
      "faqs/handler.go menyimpan & mengembalikan answer apa adanya; frontend merender via dangerouslySetInnerHTML. Tidak ada sanitasi setara sanitizeNewsHTML.",
    impact:
      "Stored XSS: <script>/<img onerror> pada konten FAQ dieksekusi di konteks browser admin/publik.",
    evidence:
      "src/app/admin/faqs/page.tsx:224 — dangerouslySetInnerHTML={{ __html: faq.answer }}",
    file: "apps/frontend/src/app/admin/faqs/page.tsx",
    line: 224,
    recommendation:
      "Sanitasi answer di server (reuse SanitizeNewsContent) saat simpan, atau render sebagai teks yang di-escape.",
    status: "fixed",
  },
  {
    id: "FE-03",
    severity: "medium",
    category: "Authentication",
    title: "Middleware hanya memeriksa keberadaan cookie, bukan validitas",
    description:
      "Middleware mengalihkan /admin & /portal bila tidak ada cookie, tetapi tidak memvalidasi signature/expiry/role JWT. Cookie palsu/expired tetap membuka shell HTML.",
    impact:
      "Perlindungan route dapat dilewati dengan cookie arbitrer; data masih bergantung pada auth API per-endpoint (satu lapis pertahanan).",
    evidence:
      "src/middleware.ts:8 — `if (pathname.startsWith('/admin') && !token)`",
    file: "apps/frontend/src/middleware.ts",
    line: 13,
    recommendation:
      "Validasi JWT (signature+expiry+role) di middleware atau proxy-validasi ke /me; pastikan cookie HttpOnly; Secure; SameSite=Lax/Strict.",
    status: "fixed",
  },
  {
    id: "FE-04",
    severity: "low",
    category: "Authentication",
    title: "Role gating klien bukan batas keamanan; token tidak di localStorage (positif)",
    description:
      "Peran dicek di AuthProvider dari metadata localStorage (sepenuhnya attacker-controlled). Positif: JWT tidak disimpan di localStorage (cookie HttpOnly).",
    impact:
      "Gating role hanya UX; akses API harus dienforce di backend per-role (sudah dilakukan di main.go).",
    evidence:
      "src/lib/auth-storage.ts:9 — localStorage.setItem('user_role', user.role)",
    file: "apps/frontend/src/lib/auth-storage.ts",
    line: 9,
    recommendation:
      "Jangan percaya role klien untuk keputusan akses; pastikan backend enforce RBAC di semua API /admin.",
    status: "open",
  },

  // ---- Performance ----
  {
    id: "PERF-01",
    severity: "high",
    category: "Performance",
    title: "xlsx & jspdf diimpor statis, membengkak 6 bundle admin/portal",
    description:
      "lib/export.ts mengimpor jspdf & xlsx secara statis; diimpor oleh 6 halaman ekspor padahal ekspor hanya saat aksi user.",
    impact:
      "Peningkatan TBT/LCP signifikan pada rute tersebut (xlsx ~400KB+).",
    evidence:
      "src/lib/export.ts:1 — `import jsPDF from 'jspdf'; import * as XLSX from 'xlsx';`",
    file: "apps/frontend/src/lib/export.ts",
    line: 1,
    recommendation:
      "Gunakan dynamic import di dalam handler ekspor: `const XLSX = await import('xlsx')`.",
    status: "fixed",
  },
  {
    id: "PERF-02",
    severity: "medium",
    category: "Performance",
    title: "framer-motion & swiper diimpor statis di homepage publik",
    description:
      "Seluruh landing page adalah client component yang menarik dua pustaka animasi/carousel berat ke bundle utama.",
    impact:
      "Waktu parse/eval JS meningkat di halaman paling ramai (memperparah SEO-04).",
    evidence:
      "src/app/page.tsx:73 — import { Swiper, SwiperSlide } from 'swiper/react'",
    file: "apps/frontend/src/app/page.tsx",
    line: 73,
    recommendation:
      "Pisahkan widget berat dengan dynamic(), atau ganti animasi framer-motion dengan CSS. Pertahankan shell halaman server-rendered.",
    status: "open",
  },
  {
    id: "PERF-03",
    severity: "medium",
    category: "Performance",
    title: "Gambar publik memakai unoptimized / <img> polos",
    description:
      "next/image dengan unoptimized dan <img> polos tanpa lazy-load/responsive. remotePatterns hanya izinkan host terbatas (localhost http di prod tidak berfungsi).",
    impact:
      "Gambar LCP besar & layout shift (CLS) di homepage/galeri/news; pipeline optimasi Next dinonaktifkan.",
    evidence:
      "src/app/page.tsx:646 — <Image ... unoptimized />; src/app/galeri/[slug]/page.tsx:186 — <img>",
    file: "apps/frontend/src/app/page.tsx",
    line: 646,
    recommendation:
      "Hapus unoptimized untuk gambar lokal /uploads; migrasi <img> ke next/image dengan sizes+width/height; perbaiki remotePatterns ke host HTTPS nyata.",
    status: "open",
  },
  {
    id: "PERF-04",
    severity: "low",
    category: "Dependencies",
    title: "recharts terdaftar sebagai dependensi tapi tidak digunakan",
    description:
      "recharts ada di package.json namun tidak diimpor di source frontend manapun.",
    impact:
      "Dead dependency: memperbesar install & surface supply-chain; bukan isu runtime.",
    evidence: "package.json — \"recharts\": \"^3.8.1\" tanpa import di src",
    file: "apps/frontend/package.json",
    line: 24,
    recommendation: "Hapus recharts dari dependencies (sudah dilakukan).",
    status: "fixed",
  },

  // ---- SEO ----
  {
    id: "SEO-01",
    severity: "high",
    category: "SEO",
    title: "Tidak ada sitemap.ts & robots.ts; tidak ada direktif robots di metadata",
    description:
      "Tidak ditemukan app/sitemap.ts maupun app/robots.ts; metadata root tidak menyertakan field robots.",
    impact:
      "Crawler tidak mendapat XML sitemap/robots.txt; index halaman publik besar (news/agenda/galeri/video) sulit penuh.",
    evidence:
      "src/app/layout.tsx:9 — metadata tanpa field `robots`; tidak ada sitemap.ts/robots.ts",
    file: "apps/frontend/src/app/layout.tsx",
    line: 9,
    recommendation:
      "Tambahkan app/sitemap.ts (semua slug publik) & app/robots.ts (allow all + sitemap); tambahkan field robots di metadata root.",
    status: "fixed",
  },
  {
    id: "SEO-02",
    severity: "high",
    category: "SEO",
    title: "Halaman publik penting tidak punya metadata per-halaman",
    description:
      "Hanya layout root & news/[slug] (generateMetadata) yang punya metadata. profil, program, psb, kontak, teachers, videos, agendas, donations, galeri mewarisi default.",
    impact:
      "Snippet pencarian seragam/generik; lemah untuk query spesifik ('program pondok', 'PSB Darussunnah').",
    evidence:
      "Hanya 3 export metadata di seluruh src (layout, news/[slug], undangan-tasmie/layout)",
    file: "apps/frontend/src/app/profil/page.tsx",
    line: 1,
    recommendation:
      "Jadikan halaman publik Server Component atau tambahkan generateMetadata dengan title/description/OG/Twitter/canonical unik.",
    status: "open",
  },
  {
    id: "SEO-03",
    severity: "high",
    category: "SEO",
    title: "Root layout menetapkan canonical:\"/\" yang diwarisi semua child",
    description:
      "alternates.canonical: \"/\" di layout root membuat setiap sub-halaman tanpa canonical sendiri memancang ke homepage.",
    impact:
      "Search engine anggap semua sub-halaman duplikat homepage -> sub-halaman ter-deindex.",
    evidence: "src/app/layout.tsx:17 — alternates: { canonical: \"/\" }",
    file: "apps/frontend/src/app/layout.tsx",
    line: 17,
    recommendation:
      "Hapus canonical:\"/\" dari layout root; set alternates.canonical absolut per halaman via generateMetadata.",
    status: "fixed",
  },
  {
    id: "SEO-04",
    severity: "high",
    category: "SEO",
    title: "Konten publik di-render client-side; absen dari HTML server",
    description:
      "Homepage & halaman publik lainnya adalah 'use client' dengan fetch runtime. HTML SSR awal kosong/skeleton; konten disuntikkan setelah hidrasi JS.",
    impact:
      "Crawler yang tidak eksekusi JS penuh tidak melihat teks indeksable -> kehilangan peringkat organik landing page.",
    evidence:
      "src/app/page.tsx:1 — 'use client'; fetch di useEffect (getNews, getAgendas, ...)",
    file: "apps/frontend/src/app/page.tsx",
    line: 1,
    recommendation:
      "Jadikan halaman publik Server Component; fetch di server & render HTML. Gunakan generateStaticParams/force-static untuk konten statis.",
    status: "open",
  },
  {
    id: "SEO-05",
    severity: "medium",
    category: "SEO",
    title: "Beberapa <h1> di DOM (satu per slide Swiper)",
    description:
      "Hero merender <h1> per slide; dengan loop, Swiper mengkloning slide sehingga ada 2-3+ <h1>.",
    impact:
      "Outline dokumen tidak jelas; melemahkan sinyal topik utama untuk crawler.",
    evidence: "src/app/page.tsx:465 — {heroSlides.map(slide => <h1>...)}",
    file: "apps/frontend/src/app/page.tsx",
    line: 465,
    recommendation:
      "Satu <h1> (slide pertama atau visually-hidden); pindahkan judul slide ke <p>/<span> atau aria-hidden.",
    status: "open",
  },

  // ---- Accessibility ----
  {
    id: "A11Y-01",
    severity: "high",
    category: "Accessibility",
    title: "Modal tidak diekspos sebagai dialog (tanpa role/aria-modal/focus trap)",
    description:
      "ConfirmDialog, GallerySelectionModal, ImageCropperModal tidak menyetel role=\"dialog\", aria-modal, tidak menjebak fokus, tidak menangani Escape.",
    impact:
      "Pembaca layar & keyboard tidak tahu modal terbuka; fokus tetap di background. WCAG 2.4.3, 2.1.1, 4.1.2.",
    evidence:
      "src/components/ConfirmDialog.tsx:44 — <div className=\"fixed inset-0 ...\"> tanpa role",
    file: "apps/frontend/src/components/ConfirmDialog.tsx",
    line: 44,
    recommendation:
      "Gunakan primitive dialog atau tambahkan role=\"dialog\"+aria-modal+aria-labelledby, jebak Tab, kembalikan fokus, tutup via Escape & overlay.",
    status: "fixed",
  },
  {
    id: "A11Y-02",
    severity: "medium",
    category: "Accessibility",
    title: "ImageCropperModal melaporkan error via alert()",
    description:
      "Error cropper menggunakan native alert().",
    impact:
      "alert() mencuri fokus & mengganggu alur screen reader; bukan status message yang accessible (WCAG 4.1.3).",
    evidence: "src/components/ImageCropperModal.tsx:78 — alert('Gagal memotong gambar.');",
    file: "apps/frontend/src/components/ImageCropperModal.tsx",
    line: 78,
    recommendation:
      "Tampilkan error inline dengan role=\"alert\"/aria-live=\"assertive\".",
    status: "fixed",
  },
  {
    id: "A11Y-03",
    severity: "medium",
    category: "Accessibility",
    title: "Tombol tutup ikon-only tanpa nama accessible",
    description:
      "Tombol close ikon-only di modal tidak punya aria-label.",
    impact: "AT hanya mengumumkan 'button' tanpa tujuan (WCAG 4.1.2).",
    evidence:
      "src/components/ConfirmDialog.tsx:57 — <button onClick={onClose}><X/></button>",
    file: "apps/frontend/src/components/ConfirmDialog.tsx",
    line: 57,
    recommendation:       "Tambahkan aria-label=\"Tutup dialog\" pada setiap tombol close ikon-only.",
    status: "fixed",
  },
  {
    id: "A11Y-04",
    severity: "low",
    category: "Accessibility",
    title: "Input zoom (range) di cropper tanpa <label> terkait",
    description:
      "Range input hanya bersebelahan dengan <span>, tidak diprogram dikaitkan.",
    impact: "AT mungkin tidak tahu tujuan kontrol (WCAG 1.3.1/4.1.2).",
    evidence:
      "src/components/ImageCropperModal.tsx:111 — <span>Zoom</span> + <input type=\"range\">",
    file: "apps/frontend/src/components/ImageCropperModal.tsx",
    line: 111,
    recommendation:
      "Gunakan <label htmlFor> + id, atau aria-label=\"Zoom\".",
    status: "fixed",
  },

  // ---- Code Quality ----
  {
    id: "FE-05",
    severity: "low",
    category: "Code Quality",
    title: "Base URL API hardcoded sebagai fallback localhost:8080 berulang",
    description:
      "Fallback http://localhost:8080/api diulang di beberapa file; rapuh bila env tidak disetel.",
    impact:
      "Tidak bocor rahasia, tapi footgun deploy: panggilan diam-diam ke localhost:8080 bila NEXT_PUBLIC_API_URL kosong.",
    evidence: "src/lib/api.ts:6 — return configured || 'http://localhost:8080/api'",
    file: "apps/frontend/src/lib/api.ts",
    line: 6,
    recommendation:
      "Sentralisasi base URL dalam satu konstanta/env resolver; fail-fast/log jelas bila NEXT_PUBLIC_API_URL kosong di prod.",
    status: "open",
  },
  {
    id: "FE-06",
    severity: "low",
    category: "Code Quality",
    title: "Impor tidak terpakai (dead imports) di halaman exams",
    description:
      "Save, Trash2, PlusCircle diimpor dari lucide-react namun tidak digunakan.",
    impact: "Bloat bundle & kode tidak rapi; seharusnya tertangkap lint strict.",
    evidence:
      "src/app/admin/exams/page.tsx:7 — import { Save, Trash2, PlusCircle } (unused)",
    file: "apps/frontend/src/app/admin/exams/page.tsx",
    line: 7,
    recommendation: "Hapus tiga ikon tidak terpakai (sudah dilakukan).",
    status: "fixed",
  },
  {
    id: "FE-07",
    severity: "low",
    category: "Code Quality",
    title: "Cast `as any` tidak aman pada response API news",
    description:
      "Beberapa `as any` membuang keamanan tipe pada bentuk response API.",
    impact:
      "Perubahan bentuk API diam-diam rusak di runtime.",
    evidence:
      "src/app/news/page.tsx:23 — (data as any)?.data?.items",
    file: "apps/frontend/src/app/news/page.tsx",
    line: 23,
    recommendation:
      "Gunakan interface response (ApiResponse<News[]>) & helper extractListData yang ada.",
    status: "open",
  },
  {
    id: "FE-08",
    severity: "low",
    category: "Code Quality",
    title: "console.log debug tersisa di kode admin produksi",
    description:
      "8 console.log '[NEWS DEBUG]' di halaman news admin mencatat payload.",
    impact:
      "Log debug di browser produksi & noise; berpotensi log konten (bukan rahasia).",
    evidence:
      "src/app/admin/news/add/page.tsx:121 — console.log('[NEWS DEBUG]...')",
    file: "apps/frontend/src/app/admin/news/add/page.tsx",
    line: 121,
    recommendation: "Hapus log debug atau gate dengan NODE_ENV==='development' (sudah dilakukan).",
    status: "fixed",
  },
  {
    id: "FE-09",
    severity: "low",
    category: "Code Quality",
    title: "File backup .bak_* ter-commit & tidak di-gitignore",
    description:
      "Enam page.tsx.bak_* di src/app/ tidak di-ignore; tidak dikompilasi (ekstensi .bak_*) tapi membanjiri repo.",
    impact:
      "Tidak merusak build (bukan .tsx), tapi membingungkan & berisiko import tak sengaja.",
    evidence:
      "src/app/page.tsx.bak__no_facts, ...bak_redesign_v2_20260711 (untracked)",
    file: "apps/frontend/src/app/page.tsx.bak__no_facts",
    line: 1,
    recommendation:       "Hapus file backup & tambahkan *.bak* ke .gitignore.",
    status: "fixed",
  },
  {
    id: "FE-10",
    severity: "info",
    category: "Code Quality",
    title: "Impor ditempatkan setelah export (style/ordering)",
    description:
      "ToastProvider/AuthProvider diimpor setelah export const metadata di layout.",
    impact:
      "Valid (hoisting ES module) tapi tidak konsisten & bisa melanggar import-order lint.",
    evidence: "src/app/layout.tsx:43 — import setelah export const metadata",
    file: "apps/frontend/src/app/layout.tsx",
    line: 43,
    recommendation: "Pindahkan semua import ke atas file.",
    status: "open",
  },
  {
    id: "FE-11",
    severity: "low",
    category: "Code Quality",
    title: "String magic untuk origin API & host image dev di config",
    description:
      "localhost:8080 diulang; next.config remotePatterns menyertakan http://localhost (hanya dev).",
    impact:
      "Config sprawl; memungkinkan mixed-content di prod bila salah set.",
    evidence: "next.config.ts — remotePatterns hostname 'localhost' (http)",
    file: "apps/frontend/next.config.ts",
    line: 8,
    recommendation:
      "Satu konstanta API env-driven; batasi remotePatterns ke host HTTPS nyata (buang http://localhost di prod).",
    status: "open",
  },

  // ---- Database ----
  {
    id: "DB-01",
    severity: "medium",
    category: "Database",
    title: "Index tidak ada pada violation_logs.student_id",
    description:
      "Query filter student_id di disciplines tidak didukung index.",
    impact:
      "Full scan per panggilan saat tabel tumbuh.",
    evidence:
      "internal/platform/database/db.go:318 — CREATE TABLE violation_logs (student_id ...)",
    file: "apps/backend/internal/platform/database/db.go",
    line: 318,
    recommendation:
      "Tambahkan CREATE INDEX IF NOT EXISTS idx_violation_logs_student (sudah dilakukan).",
    status: "fixed",
  },
  {
    id: "DB-02",
    severity: "low",
    category: "Database",
    title: "Index tidak ada pada wallet_transactions.wallet_id",
    description:
      "Join wallet_transactions t pada wallet_id tanpa index.",
    impact: "Full scan saat riwayat dompet tumbuh.",
    evidence:
      "internal/platform/database/db.go:393 — CREATE TABLE wallet_transactions (wallet_id ...)",
    file: "apps/backend/internal/platform/database/db.go",
    line: 393,
    recommendation:
      "Tambahkan CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet (sudah dilakukan).",
    status: "fixed",
  },
  {
    id: "DB-03",
    severity: "medium",
    category: "Database",
    title: "Result set tak dibatasi (tanpa LIMIT/pagination) di banyak read endpoint",
    description:
      "subjects, grades, tahfidz, users, payments, programs, target notifikasi mengembalikan seluruh tabel tanpa LIMIT.",
    impact:
      "Memori/latensi/response size meningkat; vektor DoS potensial pada endpoint admin.",
    evidence:
      "internal/features/academics/repository.go:66 — SELECT ... FROM subjects (tanpa LIMIT)",
    file: "apps/backend/internal/features/academics/repository.go",
    line: 66,
    recommendation:
      "Tambahkan LIMIT/OFFSET (atau keyset) & batasi max page size di handler/validasi.",
    status: "open",
  },
  {
    id: "DB-04",
    severity: "low",
    category: "Database",
    title: "Count query FindAllPoints mengabaikan error scan",
    description:
      "Error Scan pada COUNT(*) dibuang sehingga total bisa 0 padahal ada baris.",
    impact: "Metadata paginasi salah (total tidak cocok baris).",
    evidence:
      "internal/features/disciplines/repository.go:83 — QueryRow(...).Scan(&total) tanpa cek err",
    file: "apps/backend/internal/features/disciplines/repository.go",
    line: 83,
    recommendation: "Cek & tangani error sebelum menggunakan total.",
    status: "fixed",
  },
  {
    id: "DB-05",
    severity: "low",
    category: "Database",
    title: "SELECT-lalu-INSERT non-transaksional di GetOrCreateByUserID",
    description:
      "Read-then-write tanpa transaksi bisa race (two first-use); dimitigasi SetMaxOpenConns(1) & UNIQUE.",
    impact:
      "Risiko benang jika pooling dilonggarkan; insert kedua gagal unique constraint ke caller.",
    evidence:
      "internal/features/wallet/repository.go:38 — QueryRow lalu Exec INSERT",
    file: "apps/backend/internal/features/wallet/repository.go",
    line: 38,
    recommendation:
      "Gunakan INSERT ... ON CONFLICT(user_id) DO NOTHING RETURNING, atau BeginTx.",
    status: "open",
  },
  {
    id: "DB-06",
    severity: "low",
    category: "Database",
    title: "Connection pool dibatasi 1 koneksi (SetMaxOpenConns(1))",
    description:
      "Seluruh akses DB terserialisasi ke 1 koneksi (buat hindari 'database is locked' SQLite).",
    impact:
      "Throughput terbatas; read lama memblokir write (ditambah query tak dibatasi DB-03).",
    evidence: "internal/platform/database/db.go:68 — DB.SetMaxOpenConns(1)",
    file: "apps/backend/internal/platform/database/db.go",
    line: 68,
    recommendation:
      "Pertahankan 1 untuk keamanan write; dokumentasikan trade-off; pastikan WAL aktif & hindari transaksi panjang.",
    status: "open",
  },
  {
    id: "DB-07",
    severity: "low",
    category: "Database",
    title: "Koneksi DB tidak ditutup di proses API",
    description:
      "cmd/api/main.go memanggil database.Connect tanpa defer database.DB.Close().",
    impact:
      "Handle/WAL tidak dilepas saat shutdown; kebocoran resource lintas restart.",
    evidence: "cmd/api/main.go:51 — database.Connect(...) tanpa defer Close",
    file: "apps/backend/cmd/api/main.go",
    line: 51,
    recommendation:
      "Ekspos database.Close() & defer setelah Connect (pada shutdown via signal).",
    status: "fixed",
  },
  {
    id: "DB-08",
    severity: "low",
    category: "Database",
    title: "fmt.Sprintf menginterpolasi identifier ke DDL (latent)",
    description:
      "addColumnIfNotExists menyusun PRAGMA/ALTER via Sprintf; saat ini semua caller hardcoded (aman).",
    impact:
      "Risiko DDL-injection bila argumen table/column suatu saat dinamis (identifier tak bisa di-bind ?).",
    evidence:
      "internal/platform/database/db.go:565 — fmt.Sprintf(\"PRAGMA table_info(%s)\", table)",
    file: "apps/backend/internal/platform/database/db.go",
    line: 565,
    recommendation:
      "Jaga nilai sebagai konstanta compile-time atau validasi allow-list nama table/column.",
    status: "open",
  },
  {
    id: "DB-09",
    severity: "low",
    category: "Database",
    title: "Kurang CONSTRAINT CHECK/enum pada status/type/balance",
    description:
      "Hanya users.role yang punya CHECK; payments/donations/news/wallet_transactions/registrations menerima status/type arbitrer; balance tak ada guard >=0.",
    impact:
      "Jika validasi app dilewati, state invalid persist (defense-in-depth gap).",
    evidence:
      "internal/platform/database/db.go:119 — payments status TEXT DEFAULT 'success' tanpa CHECK",
    file: "apps/backend/internal/platform/database/db.go",
    line: 119,
    recommendation:
      "Tambahkan CHECK untuk enum dikenal & CHECK(balance>=0) di layer DB.",
    status: "open",
  },
  {
    id: "DB-10",
    severity: "medium",
    category: "Database",
    title: "Tabel donations tidak ada di migrasi schema",
    description:
      "createTables/runMigrations tidak membuat donation_campaigns/donations; hanya ada di seed via tableExists. Deploy segar tanpa seed => endpoint donasi gagal 'no such table'.",
    impact:
      "Schema drift; fitur donasi tidak self-contained & tanpa FK/constraint DB.",
    evidence:
      "internal/features/donations/repository.go:45 — SELECT ... FROM donation_campaigns",
    file: "apps/backend/internal/features/donations/repository.go",
    line: 45,
    recommendation:
      "Tambahkan CREATE TABLE donation_campaigns & donations (dengan FK) ke runMigrations (sudah dilakukan).",
    status: "fixed",
  },

  // ---- Deployment ----
  {
    id: "CFG-01",
    severity: "high",
    category: "Deployment",
    title: "Header keamanan HTTP tidak ada di nginx produksi",
    description:
      "Live site tidak menyertakan CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy. Konfigurasi header sudah ditulis ke /etc/nginx/sites-available/darussunnahparung.com (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP report-only) namun BELUM aktif karena menunggu `nginx -s reload` oleh root (akun deploy tidak punya akses sudo).",
    impact:
      "Tanpa reload, proteksi clickjacking/MIME-sniffing/SSL-strip/referrer-leak belum berlaku di produksi. TLS sendiri benar (Cloudflare origin cert).",
    evidence:
      "/etc/nginx/sites-available/darussunnahparung.com — server 443 tanpa add_header",
    file: "/etc/nginx/sites-available/darussunnahparung.com",
    line: 8,
    recommendation:
      "Tambahkan HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, CSP baseline ke block 443 (perlu diterapkan di server live).",
    status: "open",
  },
  {
    id: "CFG-02",
    severity: "medium",
    category: "Deployment",
    title: "Template nginx repo tanpa TLS & tanpa header keamanan",
    description:
      "deploy/darussunnah/nginx.darussunnah.conf hanya listen 80, tidak ada 443/ssl & tidak ada add_header; divergen dari live config.",
    impact:
      "Bila template digunakan sebagai edge, trafik plaintext & tidak diharden.",
    evidence:
      "deploy/darussunnah/nginx.darussunnah.conf:3 — server { listen 80; ... } tanpa header",
    file: "deploy/darussunnah/nginx.darussunnah.conf",
    line: 3,
    recommendation:
      "Tambahkan block 443 ssl + 80->443 redirect + header keamanan; selaraskan dengan live config (sudah ditambahkan header ke repo template).",
    status: "fixed",
  },
  {
    id: "CFG-03",
    severity: "medium",
    category: "Deployment",
    title: "Kontainer berjalan sebagai root",
    description:
      "Backend & frontend Dockerfile tidak menetapkan USER non-root; tidak ada cap_drop/read_only.",
    impact:
      "Breakout/RCE memberi root di container; memperbesar blast radius.",
    evidence:
      "apps/backend/Dockerfile & apps/frontend/Dockerfile — tidak ada USER",
    file: "apps/backend/Dockerfile",
    line: 1,
    recommendation:
      "Tambahkan USER non-root (adduser -D app) di final stage; pertimbangkan read_only + cap_drop di compose.",
    status: "open",
  },
  {
    id: "CFG-04",
    severity: "medium",
    category: "Deployment",
    title: "Tidak ada healthcheck di docker-compose",
    description:
      "Service app tidak mendefinisikan healthcheck; hanya restart:always (restart saat proses exit, bukan hang).",
    impact:
      "Orkestrasi tak bisa deteksi container tidak sehat; tidak ada readiness signal.",
    evidence:
      "deploy/darussunnah/docker-compose.yml — service tanpa healthcheck",
    file: "deploy/darussunnah/docker-compose.yml",
    line: 2,
    recommendation:
      "Tambahkan healthcheck backend (wget /api/health) & frontend (curl :3000) dengan interval/retries/start_period.",
    status: "fixed",
  },
  {
    id: "CFG-05",
    severity: "low",
    category: "Deployment",
    title: "Base image tidak di-pin ke digest immutable",
    description:
      "golang:1.25-alpine & node:20-alpine float dalam major; alpine:3.22 minor-pinned.",
    impact: "Konten image bisa berubah diam-diam saat rebuild (supply-chain/repro).",
    evidence: "apps/backend/Dockerfile:1 — FROM golang:1.25-alpine",
    file: "apps/backend/Dockerfile",
    line: 1,
    recommendation: "Pin ke digest: FROM golang:1.25-alpine@sha256:...",
    status: "open",
  },
  {
    id: "CFG-06",
    severity: "medium",
    category: "Deployment",
    title: ".dockerignore tidak rekursif untuk *.db; pola no-op",
    description:
      "*.db hanya cocok root; apps/backend/darussunnah.db bisa masuk image. Pola .apps/... adalah no-op.",
    impact:
      "Build lokal dapat membakar DB berisi PII (siswa/pembayaran) ke layer image.",
    evidence:
      ".dockerignore — `*.db` (tidak rekursif) & `.apps/backend` (no-op)",
    file: "apps/backend/.dockerignore",
    line: 8,
    recommendation:
      "Ganti dengan **/*.db & apps/backend/*.db; perbaiki .apps/... -> apps/...; pastikan tak ada .db lokal saat build.",
    status: "fixed",
  },

  // ---- Testing ----
  {
    id: "TEST-01",
    severity: "low",
    category: "Testing",
    title: "Cakupan automated test terbatas",
    description:
      "Backend punya unit test (auth, upload, videos, wallet, payments, validators, ratelimit, logs benchmark). Frontend punya playwright.config* namun tidak ada spec e2e; tidak ada test authz/security/API eksplisit di CI.",
    impact:
      "Alur kritis (authz RBAC, validasi, API) kurang terjamin otomatis; regresi sulit dideteksi.",
    evidence:
      "CI (.github/workflows/ci.yml) menjalankan go test ./... & next build, tanpa next lint / e2e spec",
    file: ".github/workflows/ci.yml",
    line: 1,
    recommendation:
      "Tambahkan e2e playwright untuk alur login/authz & API; jalankan next lint di CI.",
    status: "open",
  },
];

const SEVERITY_PENALTY: Record<AuditSeverity, number> = {
  critical: 25,
  high: 12,
  medium: 5,
  low: 2,
  info: 0,
};

export type ScoreCardKey =
  | "Security"
  | "Performance"
  | "SEO"
  | "Accessibility"
  | "Code Quality"
  | "Reliability";

export const SCORE_CARDS: { key: ScoreCardKey; label: string }[] = [
  { key: "Security", label: "Security" },
  { key: "Performance", label: "Performance" },
  { key: "SEO", label: "SEO" },
  { key: "Accessibility", label: "Accessibility" },
  { key: "Code Quality", label: "Code Quality" },
  { key: "Reliability", label: "Reliability" },
];

export function computeCardScore(card: ScoreCardKey, issues: AuditIssue[]): number {
  const cats = CARD_GROUPS[card];
  const relevant = issues.filter(
    (i) => i.status !== "fixed" && cats.includes(i.category)
  );
  let penalty = 0;
  for (const i of relevant) penalty += SEVERITY_PENALTY[i.severity];
  return Math.max(0, Math.min(100, 100 - penalty));
}

export function computeAllScores(issues: AuditIssue[] = AUDIT_ISSUES) {
  const map: Record<ScoreCardKey, number> = {} as Record<ScoreCardKey, number>;
  for (const c of SCORE_CARDS) map[c.key] = computeCardScore(c.key, issues);
  const overall = Math.round(
    SCORE_CARDS.reduce((sum, c) => sum + map[c.key], 0) / SCORE_CARDS.length
  );
  return { scores: map, overall };
}

export function severityCounts(issues: AuditIssue[] = AUDIT_ISSUES) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const i of issues) if (i.status !== "fixed") counts[i.severity]++;
  return counts;
}

export function statusCounts(issues: AuditIssue[] = AUDIT_ISSUES) {
  const counts = { open: 0, fixed: 0, not_measured: 0 };
  for (const i of issues) counts[i.status]++;
  return counts;
}

export function categoryBreakdown(issues: AuditIssue[] = AUDIT_ISSUES) {
  const allCats: AuditCategory[] = [
    "Security",
    "Performance",
    "SEO",
    "Accessibility",
    "Code Quality",
    "Database",
    "API",
    "Authentication",
    "Authorization",
    "Testing",
    "Deployment",
    "Dependencies",
  ];
  return allCats.map((cat) => {
    const list = issues.filter((i) => i.category === cat);
    const open = list.filter((i) => i.status !== "fixed").length;
    const score = Math.max(
      0,
      Math.min(
        100,
        100 -
          list
            .filter((i) => i.status !== "fixed")
            .reduce((p, i) => p + SEVERITY_PENALTY[i.severity], 0)
      )
    );
    return {
      category: cat,
      total: list.length,
      open,
      fixed: list.length - open,
      score,
    };
  });
}

export interface TechnicalInfo {
  framework: string;
  backend: string;
  runtime: string;
  packageManager: string;
  database: string;
  rendering: string;
  build: string;
  lint: string;
  typecheck: string;
  tests: string;
  dependencyAudit: string;
  lastAudit: string;
  auditVersion: string;
  environment: string;
}

// These statuses are filled from real tooling runs (see final report).
export const TECHNICAL_INFO: TechnicalInfo = {
  framework: "Next.js 16 (App Router) + Go 1.25 (chi)",
  backend: "Go 1.25, chi/v5 router, golang-jwt, modernc.org/sqlite",
  runtime: "Node 20 (frontend), Go (backend, pure-Go SQLite)",
  packageManager: "npm (frontend), Go modules (backend)",
  database: "SQLite (modernc.org/sqlite), WAL mode, single connection",
  rendering: "Public pages client-rendered + API-driven; admin SPA",
  build: "pass (next build; /audit route compiled)",
  lint: "pass for audit code; 8 pre-existing errors in psb/success & undangan-tasmie (unescaped entities) — unrelated to audit",
  typecheck: "pass (tsc --noEmit)",
  tests: "pass — all backend packages green; the 2 previously failing tests (TestSanitizeNewsHTML iframe-by-design, upload TestSanitizeImageAcceptsWEBP missing fixture) were fixed (test expectations corrected / webp embedded as base64).",
  dependencyAudit: "not run",
  lastAudit: "2026-08-24",
  auditVersion: "1.0.0",
  environment: "production (darussunnahparung.com)",
};
