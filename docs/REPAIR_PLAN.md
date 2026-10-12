# REPAIR_PLAN.md — ALMAPARUNG FULL REPAIR (Baseline 2026-09-14)

Sumber kebenaran (urutan): repo actual > DB/schema actual > runtime config actual >
audit production 2026-09-14 > business logic existing > UI existing > prompt ini.
Konflik didokumentasikan sebagai SPEC_GAP/DECISION_REQUIRED, tidak dikarang.

## 0. Baseline hasil discovery (aktual, diverifikasi di VPS 103.107.206.5)

- Backend: Go 1.26, module `almaparung-api`, chi/v5, `cmd/api/main.go` (522 baris),
  30 paket fitur di `internal/features`, platform: ai/database/logger/middleware/
  telegram/wagate/weight/whatsapp, validators terpisah. `go vet`/test parsial ada.
- Auth: JWT HS256 `jwt.MapClaims`, claim `id` float64, cookie `alma_token` ~24 jam.
  TIDAK ada `token_version`, TIDAK ada revokasi (logout = hapus cookie).
  `RequireRole` + superadmin bypass. Role zombie `admin` masih dipakai di route
  tapi dimigrasi ke superadmin tiap boot (`db.go`, tanpa audit).
- Hardcoded identity: `internal/features/donations/handler.go:228 adminID := 1` (C2).
- Atribusi actor: klaim dibaca manual per-handler (`claims["id"].(float64)`);
  kas/spp/payments gagal assert ke MapClaims -> actor=0 (S-N15). Belum ada helper tunggal.
- Rate limit: hanya `r.RemoteAddr`, tanpa trusted-proxy/XFF (S-N9) — di belakang
  nginx/docker semua IP bisa terbaca sebagai IP proxy.
- FAQ/agenda tulis: `RequireAuth` saja, user mana pun bisa tulis (API#1) —
  `main.go:198-216`.
- Duplikat route `/psb/me` (mount psb router + grup user eksplisit, C8) —
  `main.go:356` vs `376-379`.
- Static `/uploads/*` TANPA AUTH (FileServer langsung).
- DB: SQLite modernc, 50 tabel (incl `sqlite_sequence`), live
  `data/alma-parung.db` ~1.1MB + WAL ~4MB, 6 file `.bak-*` manual di `data/`
  (backup via `cp`, TIDAK WAL-safe). Migrasi: SATU file `db.go`
  (~111 marker CREATE TABLE/addColumnIfNotExists), rewrite admin->superadmin tiap boot.
  `academic_years` KOSONG. `santri.user_id` NULL semua (portal wali buta).
  Index aktual 37, hot-path (spp/iuran/paytx/kas/santri/receipt-seq) belum ada.
- Transaksi uang: pola check-then-act tanpa BEGIN IMMEDIATE, receipt `MAX()+1`
  tanpa retry/sequence, tanpa `idempotency_key`, cancel tanpa reversal rows,
  CBT sync `ON CONFLICT` tanpa unique index (gagal diam-diam).
- Frontend: Next.js 16.2.2 + React 19, 108 `page.tsx`. Konsolidasi audit sedang
  berjalan (uncommitted): hapus `audit/`, `audit-donasi/`, `audit-spp/` ->
  `audit-full/`, `audit-gpt/` (laporan audit 2026-09-14).
- Deploy: container `alma-parung-frontend` (3002->3000) + `alma-parung-backend`
  (8090->8080) UP. Satu compose (`deploy/darussunnah/docker-compose.yml`).
  `.dockerignore` baru (untracked). Risiko DB ganda compose (`/data/alma.db` vs
  runtime `/data/alma-parung.db`). Health statis tanpa sentuh DB. Tanpa graceful shutdown.
- Test: 10 file `_test.go` (ratelimit, weight engine, validators, repo
  auth/spp/wallet/donations/payments/news). Belum ada concurrency/security/E2E test.
- Git: branch `codex/pesantren-cms-import-2026-05-04`, 73 commit ahead of origin,
  unpushed. Commit terakhir 04:00 "portal kwitansi per transaksi".

## 1. Urutan eksekusi (wajib bertahap, sesuai prompt #95)

PHASE 0 discovery -> 1 backup/recovery -> 2 auth/session -> 3 RBAC ->
4 PII/upload/public-API -> 5 DB integrity/migrasi -> 6 financial engine ->
7 audit log -> 8 santri/identity -> 9 PPDB -> 10 SPP/iuran -> 11 kas/ledger ->
12 donasi -> 13 akademik -> 14 raport -> 15 exam/CBT -> 16 attendance ->
17 WA/notif -> 18 wallet -> 19 API standard -> 20 frontend/RBAC-UI -> 21 UX ->
22 deploy hardening -> 23 testing full -> 24 staging -> 25 final audit ->
26 go-live. Phase 1+ butuh backup lolos dulu.

## 2. Dependency graph (ringkas)

```
PHASE 1 (backup/restore) ── prasyarat SEMUA phase bermigrasi
PHASE 2 (token_version+revokasi) ──> PHASE 3 (RBAC/ownership) ──> PHASE 4 (PII/upload)
PHASE 5 (migrasi/index/unique) ──> PHASE 6 (financial atomic+idempoten) ──> PHASE 7 (audit)
PHASE 6 ──> PHASE 10/11/12 (spp/iuran/kas/donasi = konsumen engine)
PHASE 8 (identity/link-user) ──> PHASE 9 (PPDB) ──> PHASE 13/14 (akademik/raport)
PHASE 19 (error/reqid/contract) menopang 20/21 (frontend/UX)
PHASE 22 (deploy) + 23 (tests) ──> 24 (staging) ──> 25 (final audit) ──> 26 (go-live)
```

## 3. Urutan migrasi DB (prinsip: additive dulu, constraint belakangan)

1. `users.token_version INTEGER DEFAULT 0` + backfill (PHASE 2).
2. Index hot-path: spp/iuran `(santri_id),(status),(paid_at)`,
   `payment_transactions(bill_type,bill_id),(bill_period)`,
   `kas_transactions(category_id)`, `santri(user_id)` (PHASE 5).
3. `idempotency_key UNIQUE` di payment_transactions/receipts/kas (PHASE 6).
4. `receipt_sequence` aman (ganti MAX()+1) (PHASE 6).
5. Kolom audit (`created_by/verified_by/cancelled_by` + tabel `audit_logs`
   bila belum ada sebagai tabel khusus — `activity_logs` dievaluasi dulu) (PHASE 7).
6. UNIQUE akademik (grades/attendance/tahfidz) + KKM/semester/year-kanonik,
   isi `academic_years` (PHASE 13/14).
7. State machine PPDB/santri bila kolom status perlu (PHASE 8/9).
8. Legacy `payments`: freeze -> backfill -> dual-read -> deprecate (PHASE 6/11).
Semua migrasi: file migrasi + up + verifikasi + backfill + index/constraint +
rollback strategy. Tanpa edit manual production.

## 4. Perubahan security (non-exhaustive, detail di FINDINGS_REGISTER)

P0: token_version+revokasi; helper auth tunggal + hapus adminID:=1 +
perbaiki assert actor; RequireRole FAQ/agenda; DTO publik PII
(donations/teachers); serve /uploads proofs authed; BEGIN IMMEDIATE +
conditional update + RowsAffected + idempotency; receipt sequence;
cancel reversal; backup WAL-safe + off-host + drill; XFF tepercaya + limit_req.

## 5. Perubahan financial/akademik/frontend/deployment

Financial: state machine UNPAID->PENDING->VERIFIED->PAID (sesuaikan existing,
jangan karang state bila existing cukup); 409 ALREADY_PAID/idempotent replay;
verify/pay/cancel mutually exclusive; kas+ledger atomik satu transaksi.
Akademik: satu grading engine (preview=save), Predikat100, lock enforce +
unlock beraudit, UNIQUE+index, CBT sync tanpa swallow.
Frontend: API abstraction + permission model selaras backend (backend authority);
form/table/confirmation standard; tanpa redesign besar sebelum security stabil.
Deploy: .dockerignore final, satu DB path source-of-truth, secrets keluar image,
health liveness/readiness (readiness sentuh DB), graceful shutdown, header+CSP,
TLS, log JSON ber-request_id.

## 6. Breaking changes potensial

- Token lama invalid setelah token_version (butuh re-login) — dijadwalkan + diumumkan.
- /uploads proofs jadi authed (link publik lama mati) — masa transisi signed-URL bila perlu.
- FAQ/agenda tulis dibatasi role (user biasa ditolak) — komunikasikan.
- academic_years wajib + UNIQUE akademik (data duplikat lama bisa gagal migrasi —
  butuh cleansing tercatat).
- Role `admin` difinalisasi (pilih: hapus total atau alias permanen).

## 7. Rollback strategy (per phase)

Setiap phase: catat commit + backup pre-phase + migration up/down (atau dokumen
irreversible + staged plan) + flag dual-accept/dual-read bila ada + kriteria
abort (test/concurrency/security gagal -> rollback, jangan force).

## 8. SPEC_GAP awal

- SG-01: state machine payment existing vs contoh prompt — pakai existing bila cukup.
- SG-02: nasib role `admin` (hapus vs alias) — butuh keputusan bisnis.
- SG-03: storage UTC vs display WIB — rekomendasikan UTC simpan + WIB bisnis,
  butuh konfirmasi.
- SG-04: staging environment tidak ada — backup+rollback diperketat + didokumentasikan.
- SG-05: tabel audit: perluas `activity_logs` vs tabel `audit_logs` baru.
