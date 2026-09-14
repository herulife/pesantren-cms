# TEST_MATRIX.md — ALMAPARUNG

| ID | Feature | Scenario | Expected | Status |
|----|---------|----------|----------|--------|
| AUTH-01 | login | kredensial benar | 200 + cookie + audit LOGIN | PASS (repo test) |
| AUTH-02 | sesi | logout lalu pakai token lama | 401 sesi diakhiri | MANUAL |
| AUTH-03 | sesi | reset password lalu token lama | 401 | MANUAL |
| AUTH-04 | sesi | token pra-deploy (tanpa versi) | 401 login ulang | MANUAL |
| RBAC-01 | faq/agenda | user biasa POST | 403 | MANUAL |
| RBAC-02 | hr | panitia_psb akses /hr | 403 | MANUAL |
| PII-01 | donasi publik | GET /donations | tanpa phone/proof, hanya verified | MANUAL |
| PII-02 | guru publik | GET /teachers | tanpa email/WA | MANUAL |
| PII-03 | proofs | anonim GET /uploads/proofs/x | 401; pemilik 200 | MANUAL |
| FIN-01 | double pay | 100 konkuren lunas 1 tagihan | 1 sukses, 99 konflik, ledger 1 | PASS (TestConcurrentPaySingleWinner) |
| FIN-02 | idempoten | retry key sama | replay aman, ledger 1 | PASS (TestIdempotentReplay) |
| FIN-03 | cancel | pay lalu cancel | reversal 1, receipt 0, bill unpaid | PASS (TestCancelReversal) |
| FIN-04 | verify vs pay | approve + pay bersamaan | satu menang, lain konflik | MANUAL |
| FIN-05 | overpay | bayar > sisa | 422 | PASS (TestPayPartialThenFull) |
| PPDB-01 | re-upload | unggah saat paid | 400 locked | MANUAL |
| PPDB-02 | transisi | accepted→pending | 422 | MANUAL |
| ACAD-01 | predikat | 0/25/50/75/82.58/100 | Perlu/Cukup/Baik/Baik/Baik/S.Baik | PASS (TestPredikat100) |
| CBT-01 | sync | finish 2x | 409 kedua | MANUAL |
| CBT-02 | jawab | submit lintas ujian | 403 | MANUAL |
| EXAM-01 | soal | user tanpa sesi GET questions | 403 | MANUAL |
| WAL-01 | PIN | ganti tanpa PIN lama (sudah ada) | 403 | MANUAL |
| UPL-01 | upload | 1x1 / non-image / proof_url jahat | 400 | PASS (upload test) |
| KAS-01 | void | hapus transaksi | void, summary tak hitung | MANUAL |
| DON-01 | campaign | hapus ada transaksi | 409 | MANUAL |

MANUAL = smoke pasca go-live (PHASE 26). E2E browser: UAT manual tercatat.
