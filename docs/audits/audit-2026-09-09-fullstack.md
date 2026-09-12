# Audit Menyeluruh Alma Parung — 2026-09-09

Metode: `full-stack-audit` (90 checkpoint), `security-audit` (ldatb/opencode-setup),
`pesantren-ops`, skill lokal (`audit`, `cms`, `ux-heuristics`, `frontend-design`).
Skill tersimpan di `.opencode/skills/`: `full-stack-audit`, `pesantren-ops`, `security-audit`.
Pelaksana: 3 sub-agen paralel (backend Go, frontend Next.js, CMS/builder+programs) + verifikasi manual.

Fokus khusus: kejanggalan **"ada di home tapi tidak ada di admin"** (SUP-01).

## Temuan SUP — home vs admin (sudah diverifikasi + sebagian diperbaiki)

- SUP-01 — Tabel `programs` kosong (0 baris, user hapus) tapi home tetap penuh:
  3 lapis fallback (`ProgramsBlock` hardcoded → `page.tsx` fallback → builder cards)
  yang isinya identik dengan data seed. termed: PHANTOM DATA (HIGH).
- SUP-02 — Kategori tanpa CHECK/whitelist: `NULL`/`typo` tampil sebagai program di
  sebagian halaman, hilang di lainnya (HIGH). DIPERBAIKI: whitelist validator
  `program|ekskul` + default `program` (`validators/content.go`).
- SUP-03 — `normalize` diam-diam membuang field (source fallback `'auto'`,
  `normalizeImageCards` butuh description, array kosong → fallback) (HIGH).
- SUP-04 — Dead input: `manual_ids` tanpa UI, `is_featured` tak dibaca publik,
  `limit` dipotong diam-diam, tombol ekskul default ke `/program` (MEDIUM).
- SUP-05 — Validasi FE lebih ketat dari BE untuk field opsional (MEDIUM).
- SUP-06 — Dual editor draft/publish vs langsung-live membingungkan (MEDIUM).
- SUP-07 — Pagination `offset` diabaikan bila data ≤ limit (LOW).
- SUP-08 — CTA home flat-vs-nested + tanpa editor home-section (LOW).

## Skor (N/A menyesuaikan denominator; * = estimasi butuh verifikasi visual)

FULL-STACK: 21/50 — Visual 3/5, Flow 3/5, Responsive 4/5*, Performance 1/5,
A11y 2/5, Security 3/8, Backend 2/5, SEO 2/5, Privacy 0/4, Infra 1/4.
UX: 23/40 — Status 3/5, Navigasi 2/5, Kontrol 4/4, Konsistensi 3/5, Form 4/5,
Empty 2/3, Microcopy 4/5, Trust 1/5.
KOMBINASI: 44/90.

Detail 90 checkpoint + bukti file:line ada di laporan sesi (sub-agen backend,
frontend, cms/programs) — ringkas di bawah per prioritas.

## CRITICAL (1) — DIPERBAIKI + deploy 2026-09-09
- SEC-6.1: login password ke akun OAuth via `oauth_dummy_secret` konstan
  (`auth/repository.go:76`, `auth/handler.go:41-79`). Fix: dummy acak 256-bit
  per user (`randomDummyPasswordHash`). Tidak ada lagi secret bersama.

## HIGH — diperbaiki (2): validator kategori (SUP-02); tersisa di bawah
- SEC-6.8: `POST /api/upload` tanpa role + tanpa rate-limit; webhook Telegram
  tanpa secret = bypass; public read tanpa limiter; IP key abaikan X-Forwarded-For.
- SEC-6.7/6.9: tanpa security headers; webhook tanpa verifikasi signature.
- SEC-6.10: `console.log` payload berita/respons API di produksi.
- PSB payment tanpa validasi URL/tanggal/max; `CreateQuestion` tanpa validasi;
  wallet PIN 4-digit tanpa limiter + amount tanpa max; raport bobot negatif;
  error `err.Error()` ke klien (raport/wallet/santri).
- JWT 24 jam tanpa revoke; cookie tanpa CSRF.
- Phantom data (SUP-01); normalize buang field (SUP-03).
- Donasi: banner + rekening hardcoded (`lib/donations.ts`) tampil permanen.
- Ikon generik berlabel brand; 3 nomor WA berbeda; rute video/donasi ganda.

## MEDIUM/LOW
- Duplikasi base-URL ×4, sort/filter program ×3, wrapper normalize ganda.
- SEO: tanpa meta per-halaman, kanonis global `/`, sitemap basi.
- A11y: peta non-interaktif, kontras di atas foto, focus tak merata.
- Iklan: tanpa cookie-consent, tanpa privacy/terms, tanpa analytics/monitoring,
  tanpa 404 kustom (verifikasi), tanpa reduced-motion.
- Dead code: skrip `*_test/debug/reset_password.go` di root backend ikut image;
  modal program mati ~170 baris; helper ganda.

## TOP 5 prioritas berikutnya
1. Rate-limit + role untuk `/upload` & webhook Telegram (HIGH).
2. Security headers + webhook signature (HIGH).
3. Hapus `console.log` debug produksi (MEDIUM, cepat).
4. Validasi PSB payment & `CreateQuestion` (HIGH).
5. Bereskan phantom data: empty-state jujur ganti kartu kembaran (MEDIUM).

## Changelog sesi
- Backend: dummy OAuth acak; whitelist kategori program.
- Skill: `full-stack-audit`, `pesantren-ops`, `security-audit` → `.opencode/skills/`.
- Deploy: backend image baru live, API sehat (`/api/news` 200).
