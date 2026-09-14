# SECURITY.md — ALMAPARUNG (pasca-PHASE 2-4, 6-7)

- Auth: JWT HS256 24 jam + `token_version`+`jti`; middleware validasi
  user-ada + role-cocok + versi-cocok; logout/reset-password/ganti-role
  me-revoke; token lama tanpa versi ditolak (re-login massal sekali).
- Helper tunggal `auth.GetAuthenticatedUser{,ID,Role}` — adminID:=1 dihapus,
  actor=0 diperbaiki (kecuali event sistem).
- RBAC: FAQ/agenda tulis = superadmin/tim_media; HR = superadmin/bendahara;
  duplikat /psb/me dihapus; backend authority, FE hanya UX.
- PII: `/donations` publik = DTO verified-only tanpa phone/proof;
  teachers publik tanpa email/WA; proofs baru privat (`/uploads/proofs/*`
  + ownership); upload: magic+dimensi+re-encode (termasuk webp→png),
  nama acak, `ValidateProofURL` di SPP/iuran.
- Finansial: BEGIN IMMEDIATE + conditional UPDATE + RowsAffected +
  idempotency + receipt sequence + reversal cancel + busy-retry; 409 codes.
- Audit: `audit_logs` (actor/aksi/entitas/before-after) untuk semua mutasi
  kritis; tidak dihapus saat user dihapus.
- Rate-limit: per-endpoint; CATATAN: masih baca RemoteAddr (127.0.0.1 di balik
  nginx) — trusted-proxy di PHASE 22.
- Cookie: HttpOnly+SameSiteLax (+Secure di prod); CORS allowlist tanpa localhost
  di prod; DEV_MODE=false di prod (fail-closed saat boot).
- Insiden: revoke via role/password-reset; rollback via RESTORE_RUNBOOK.md.
