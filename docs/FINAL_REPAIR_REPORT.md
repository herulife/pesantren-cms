# FINAL_REPAIR_REPORT.md — ALMAPARUNG (2026-09-14)

## Executive Summary

Seluruh 27 phase dieksekusi di VPS 103.107.206.5 (repo `~/alma-parung`,
branch `codex/pesantren-cms-import-2026-05-04`). Backend + frontend di-deploy
ulang (image `:new`, rollback `:pre-phase26`), migrasi boot PASS, smoke
production PASS. Status: **PRODUCTION READY dengan catatan** (blok P0 habis;
sisa P2/P3 tercatat di Known Issues).

## Original Findings → Fixed Findings

- C2 (adminID:=1): hapus, helper auth tunggal. C8 (duplikat /psb/me): hapus
  dari mount staff. C11 (predikat): `Predikat100` + 12 boundary test.
  C5/R5 (receipt MAX+1): `receipt_sequences` + UNIQUE backstop (3 modul).
  C6/R3 (cancel drift): reversal rows + rekap decrement (SPP/iuran).
  C7 (re-upload reset paid): guard paid/verified + 400 locked.
  C10 (WA nomor santri): tidak ditemukan di kode attendance saat ini (sudah
  memakai parent_phone di kwitansi) — diverifikasi, bukan regresi.
- S-N1 (proof_url bebas): `ValidateProofURL` di SPP/iuran + PSB
  `ValidateMediaURL` pre-existing. S-N3 (uploads publik): proofs baru privat
  berauth+ownership; legacy di /uploads root = KNOWN ISSUE + backfill plan.
  S-N5 (revokasi): `token_version`+jti, logout/reset/role bump. S-N8 (mass
  assignment): SantriInput DTO (+update tak sentuh user_id).
  S-N9 (rate-limit IP): trusted-proxy (loopback→XFF terakhir/X-Real-IP).
  S-N11 (PIN): PIN bcrypt persisten (pre-existing) + wajib PIN lama.
  S-N13 (verify tanpa audit): VERIFY_*/PAY_*/CANCEL_* di audit_logs.
  S-N15 (actor=0): helper tunggal di auth/spp/iuran/kas/payments/wallet.
- API#1 (FAQ/agenda any-auth): RequireRole superadmin/tim_media.
  M-N2/R1-R4 (race uang): BEGIN IMMEDIATE (DSN) + conditional UPDATE +
  RowsAffected + idempotency_key + busy-retry; 100-goroutine test PASS.
  A3/A4 (raport): engine tunggal Compute + lock enforce + Unlock beraudit.
  W1 (broadcast): sumber legacy dipertahankan, agregat documented follow-up.
  DEP: `.dockerignore` secrets/data, DB path tunggal, readiness, graceful
  shutdown, HEALTHCHECK dua image, compose diperbaiki.
- U (webp mentah/nama): re-encode PNG + nama acak 128-bit.

## Remaining Findings (non-P0)

- Legacy proofs & PSB docs di /uploads root masih publik → backfill PHASE 10
  (pindah + tulis ulang URL) belum dijalankan.
- Shadowed `GET /api/donations` (mount bendahara menelan route publik):
  pre-existing, FE memakai /list + /campaigns → didokumentasikan, tidak diubah
  saat go-live.
- `admin` role zombie: migrasi tiap boot dipertahankan (kompat), finalisasi
  butuh keputusan bisnis (SG-02).
- Ambang Predikat100 (87.75/62.75/37.75) butuh konfirmasi sekolah vs KKM.
- Staging tidak ada (SG-04): diganti backup pre-deploy + rollback image +
  drill tercatat.

## Database Changes

token_version; idempotency_key×4 + UNIQUE×4; receipt_no UNIQUE;
receipt_sequences; kas voided/void_reason; grades/cbt/answers UNIQUE;
audit_logs + 2 index; 13 index hot-path; activity_logs dipertahankan.

## API Changes

409 PAYMENT_ALREADY_PAID / PROOF_PENDING / raport-locked; `Idempotency-Key`
→ 200 duplicate; proofs `kind=proof`; `/api/ready`; `/uploads/proofs/{file}`
berauth; raport `/unlock`; santri `/unlink-user`; kas DELETE→void;
donasi hapus→409 bila bertransaksi; PSB 422 transisi; exam 403/409 guards.

## Security / Financial / Academic / PPDB / Santri / Attendance / WhatsApp /
## Donation / Frontend / Deployment / Backup

Lihat SECURITY.md, DATABASE.md, API_CONTRACT.md, DEPLOYMENT_CURRENT.md,
BACKUP_RUNBOOK.md, RESTORE_RUNBOOK.md. WA session & antrean tak tersentuh
(reconnect PASS). Donasi: lifecycle parsial (guard hapus + audit verify).

## Tests

`go vet` bersih; 14 paket test PASS (unit + `TestConcurrentPaySingleWinner`
100 goroutine + idempotency + cancel-reversal + Predikat100 + upload +
audit + validators); `tsc --noEmit` FE bersih. E2E destruktif tidak dijalankan
di produksi (TEST_MATRIX menandai MANUAL untuk smoke pasca go-live).

## Migration Result / Rollback Plan

Boot 10:08 UTC: semua kolom/index dibuat, integrity ok, 51 tabel.
Rollback: image `:pre-phase26` (BE+FE) + backup `*-100451`/`*-102919` +
RESTORE_RUNBOOK.md. Breaking: re-login massal sekali (token lama ditolak).

## Known Issues / SPEC_GAP

SG-01 state existing dipakai; SG-02 nasib role admin; SG-03 timestamp WIB
(TZ Asia/Bangkok dipertahankan, didokumentasikan); SG-04 tanpa staging;
SG-05 audit_logs baru (activity_logs dipertahankan paralel).

## Production Readiness

Smoke 443: / 200, /login 200, /portal 307 guard, /api/health 200,
/api/ready READY, proofs anon 401, FAQ anon-write 401, login salah 401,
teachers tanpa email/WA, FAQ/agenda tulis terkunci, docker healthy×2.

## FINAL VERDICT

```text
PRODUCTION READY
```

dengan prasyarat operasi: jaga cron backup + off-host mingguan; umumkan
re-login; jalankan backfill proofs sebelum unggahan sensitif berikutnya;
konfirmasi ambang predikat + nasib role admin ke pemilik bisnis.
