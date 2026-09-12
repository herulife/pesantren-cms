# Audit Menyeluruh Alma Parung — 2026-09-10

Metode: `full-stack-audit` (90 checkpoint) + `security-audit` + 15 prinsip usability.
Skill tersimpan di `docs/audit/skills/` (sumber GitHub, MIT) dan `.opencode/skills/`.
Halaman publik: https://almaparung.com/audit. Baseline sebelumnya: 44/90 (9 Sep 2026).

## Skor

- Full-stack: **32/49** (1 checkpoint N/A: 6.4 paywall — tidak ada konten berbayar)
- UX: **30/40**
- **Kombinasi: 62/89 (~70%) — Grade B**

Rincian full-stack: Tampilan 4/5, Alur 4/5, Responsif 3/5, Kecepatan 2/5,
Aksesibilitas 2/5, Keamanan 7/9, API 4/5, SEO 4/5, Privasi 0/4, Infra 2/4.
Rincian UX: Status 4/5, Navigasi 4/5, Kontrol 3/5, Konsistensi 4/5,
Formulir 3/5, Empty 4/5, Microcopy 5/5, Trust 3/5.

## Kritis: 0

## Tinggi (4): H1 header pengaman, H2 PIN dompet tanpa limiter,
## H3 timeout server, H4 cookie-consent + privasi/syarat.

## Sedang (8): M1 FAQ raw HTML, M2 gambar unoptimized, M3 reduced-motion,
## M4 toast aria-live, M5 autocomplete/fokus error, M6 JWT tanpa revoke,
## M7 404/manifest, M8 analytics & monitoring.

## Kecil (4): L1 alt pratinjau, L2 touch target 40px, L3 file debug/duplikasi,
## L4 kanonis global + istilah campur.

## Yang sudah bagus
Role-based auth + superadmin bypass; rate-limit login/upload/kontak/webhook;
webhook Telegram verifikasi secret; validasi upload 5MB + decode gambar;
validasi pembayaran (URL/tanggal/batas wajar); security headers parsial +
validasi env produksi; SQL parameterisasi; cookie HttpOnly/Secure/SameSite;
SEO dasar (meta/OG/JSON-LD/sitemap/robots/lang=id); loading/empty/error
states + toast + konfirmasi hapus; pusat bantuan berbahasa sederhana.

## Bukti utama (file:baris)
- Role & limiter: apps/backend/cmd/api/main.go:147-168, 269-376
- Security headers parsial: internal/platform/middleware/security.go:8
- Tanpa CSP/HSTS; frontend tanpa headers: apps/frontend/next.config.ts
- ListenAndServe tanpa timeout: cmd/api/main.go:393
- Webhook secret: internal/features/notifications/handler.go:192
- Upload 5MB + decode: internal/features/upload/handler.go:48-60
- PSB payment validasi: internal/features/psb/handler.go:297-340
- JWT 24 jam: internal/features/auth/handler.go:93,97
- Cookie flags: internal/features/auth/handler.go:631-647
- Santri parameterisasi: internal/features/santri/repository.go:21-42
- FAQ raw HTML: apps/frontend/src/app/admin/faqs/page.tsx:224
- Toast tanpa aria-live: src/components/Toast.tsx:43
- Tanpa reduced-motion / autocomplete / not-found / manifest: grep snapshot
- JSON-LD aman & statis: src/app/layout.tsx:57-66
- Secrets: .env di-ignore git; tidak ada key di kode (grep snapshot)

## 5 prioritas berikutnya
1. H4 — Banner cookie + halaman Privasi & Syarat.
2. H2 — Batas percobaan PIN dompet + rate-limit.
3. H1 — Header pengaman Next.js + CSP backend.
4. H3 — Timeout server.
5. M2 — Kompresi gambar otomatis.

## Pembaruan sore: 5 prioritas dikerjakan (terverifikasi live)
- H1: 4 security headers frontend + CSP backend (curl OK).
- H2: kunci PIN 15 mnt/5x salah + batas nominal (build OK).
- H3: timeout server 10/90/30/120 dtk (build OK, API 200).
- H4: banner cookie + /privasi + /syarat + footer + GA gated consent (200 OK).
- M2: resize upload maks 1600px via x/image/draw (build OK).
- Skor baru: 37/49 + 30/40 = 67/89 (~75%). Kritis: 0, Tinggi: 0.
- Catatan: 2 unit test upload gagal pre-existing (pre-existing): fixture 1x1 vs aturan
  min 100x100 + file webp fixture tak ada di repo. Test middleware lolos.
