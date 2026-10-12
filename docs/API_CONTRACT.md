# API_CONTRACT.md — ALMAPARUNG (kontrak dibekukan pasca-PHASE 19)

Envelope sukses: `{"success":true,"message":"...","data":...}` (+ `X-Correlation-ID`).
Envelope gagal: `{"success":false,"message":"<aman>","correlation_id":"..."}` (+ opsional
`details` validasi / `data: {"code"}` untuk konflik). Internal error TIDAK bocor
(`err.Error()` hanya di log).

Status: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized,
403 Forbidden, 404 Not Found, **409 Conflict** (ALREADY_PAID → `PAYMENT_ALREADY_PAID`,
proof pending → `PROOF_PENDING`, locked → 409 raport/kas-void), 422 validasi,
429 rate-limit, 500 internal.

Aturan: auth via cookie `alma_token`/Bearer; portal user JWT-scoped (ownership
di repo + pre-check handler); staff via RequireRole (superadmin bypass);
mutasi finansial idempoten via header `Idempotency-Key` (replay → 200
`{"duplicate":true}`); upload proof baru `kind=proof` → `/uploads/proofs/*`
(authed: pemilik/bendahara/superadmin); halaman error FE generik.

Side-effect/transaksi/audit per endpoint: lihat ROUTE_INVENTORY.md (otorisasi),
FINDINGS_REGISTER.md (risiko), dan audit_logs (aksi beraudit: LOGIN/LOGOUT/
CREATE_USER/RESET_PASSWORD/UPDATE_ROLE/DELETE_USER, PAY_*/VERIFY_*/CANCEL_*,
PROOF_SUBMIT_*, WALLET_TOPUP, VERIFY_DONATION, *_SANTRI, LINK/UNLOCK_RAPORT,
CREATE/VOID_KAS, PSB_*_STATUS, SET_PIN).
