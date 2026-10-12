# FINDINGS_REGISTER.md — ALMAPARUNG (dari audit 2026-09-14, status awal OPEN)

| ID | Severity | Module | Finding | Root Cause | File | Line | Fix | Test | Status |
|---|---|---|---|---|---|---|---|---|---|
| C1 | HIGH | Donasi/API | GET /donations = PII donatur publik | return model mentah | donations handler | - | DonorPublicDTO + auth | sec-anon | OPEN |
| C2 | HIGH | Donasi | adminID:=1 hardcoded | tanpa auth context | donations/handler.go | 228 | helper auth tunggal | sec | OPEN |
| C3 | MED | Auth | role admin zombie | migrasi vs CHECK/route/menu | db.go:778-781, main.go:348 | - | finalisasi admin | rbac | OPEN |
| C5/R5 | HIGH | Receipt | MAX()+1 tanpa retry | read-then-insert | spp repo:648-654 | - | sequence-safe | conc-100 | OPEN |
| C6/R3 | HIGH | Payment | cancel tanpa reversal -> drift permanen | tanpa reversal rows | spp/iuran/payments | - | cancel reversal | conc | OPEN |
| C7 | MED | PPDB | re-upload reset paid | unconditional update | psb/repo:278 | - | state machine + tolak-bila-paid | e2e | OPEN |
| C8 | MED | PPDB | route /psb/me ganda | dua grup role | main.go:356+376 | - | satu route + guard | api | OPEN |
| C9 | MED | Data | hapus tanpa guard | tanpa pre-check | santri:147-150, hr | - | guard 409 + soft-delete | api | OPEN |
| C10/B2 | HIGH | Absensi | WA ke nomor santri | users.whatsapp | attendance:75-88 | - | ResolveParentPhone | unit | OPEN |
| C11 | HIGH | Raport | predikat skala salah (82.58="Sangat Baik") | skala vs formula | raport engine | - | Predikat100 + test 0/25/50/75/82.58/100 | unit | OPEN |
| S-N1 | HIGH | SPP | proof_url bebas | tanpa ValidateMediaURL | spp/handler:464-476 | - | validasi+allowlist | sec | OPEN |
| S-N3 | HIGH | Data | /uploads proofs publik | FileServer tanpa auth | main.go uploads | - | authed serve | sec-anon | OPEN |
| S-N5 | HIGH | Auth | tanpa revokasi (logout/password/role/hapus) | sig+exp saja | auth middleware:29-77 | - | token_version | sec-revoked | OPEN |
| S-N8 | MED | Data | mass assignment | decode ke model | santri:173-195 | - | DTO whitelist | sec-mass | OPEN |
| S-N9 | HIGH | RateLimit | salah IP di balik nginx | RemoteAddr mentah | ratelimit.go:97-101 | - | trusted proxy+XFF | sec | OPEN |
| S-N11 | MED | Wallet | PIN in-memory (reset saat restart) | tanpa persist | wallet | - | PIN persisten + PIN-lama | sec | OPEN |
| S-N13 | HIGH | Uang | verifikasi tanpa audit log | tanpa VERIFY_* | spp/iuran/kas | - | audit wajib | audit | OPEN |
| S-N15 | HIGH | Uang | atribusi actor=0 | assert MapClaims salah | kas/spp/payments | - | helper tunggal | sec | OPEN |
| API#1 | HIGH | FAQ/Agenda | tulis oleh user mana pun | RequireAuth saja | main.go:200-215 | - | RequireRole | sec-role | OPEN |
| M-N2/R1-R4 | HIGH | Uang | double pay/verify race | check-then-act | spp/iuran/payments | - | IMMEDIATE+cond-update+idempoten | conc-100 | OPEN |
| P-N* | MED | PPDB | state/error-swallow | tanpa state machine | psb | - | SG state + err explisit | e2e | OPEN |
| A3/A4 | HIGH | Raport | preview vs save beda; lock tak dienforce | dua formula; upsert tanpa cek | raport handler/repo | - | engine tunggal + lock | unit | OPEN |
| W1 | HIGH | WA | broadcast salah/spam | sumber legacy + tanpa agregat | notifications/repo:43-119 | - | sumber baru + agregat | e2e | OPEN |
| U* | MED | Upload | webp mentah, nama prediktabel | tanpa re-encode/acakan | upload | - | re-encode + acak | sec | OPEN |
| DEP* | MED | Deploy | DB ganda, .env di image, health statis, tanpa shutdown | config | compose/Dockerfile | - | PHASE 22 | deploy | OPEN |

Aturan bug baru: ID NEW-001... (severity/modul/file/line/root-cause/impact/fix/test/status).
