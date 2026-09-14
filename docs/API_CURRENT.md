# API_CURRENT.md — ALMAPARUNG (aktual)

- Contract: belum ada `docs/API_CONTRACT.md`. Error: `err.Error()` bocor ke user
  di banyak handler; HTTP 200 untuk operasi gagal di beberapa path; belum ada
  error code standard (`PAYMENT_ALREADY_PAID` dkk).
- Request ID: ada middleware RequestID tapi belum konsisten di log
  (route+method+status+duration+actor). Response belum mengembalikan request_id.
- Pagination/search/filter/sort per-modul tidak konsisten; validasi tanggal/
  amount/enum/ID/phone/email/URL longgar (tanggal invalid lolos di beberapa path).
- Mass assignment: decode langsung ke model DB di banyak handler
  (contoh: santri create/update) — belum DTO whitelist.
- Ownership: portal JWT-scoped OK untuk psb/me, my-santri/bills/ledger/receipt;
  TAPI exams questions tanpa enrollment check, santri/akademik GET arbitrary id
  (staff ok, user dilarang — perlu test IDOR), proof submit ownership hanya di
  repo tanpa pre-check handler, wallet spend tanpa verifikasi PIN lama.
- State: PPDB/payment/raport/exam tanpa validasi transisi eksplisit
  (PUT status bebas). Duplikat `/psb/me` dua grup role.
- Notifikasi: broadcast synchronous, sumber legacy payments, tanpa agregat/
  dedup/rate-limit/delivery-status/audit.
- Target (PHASE 19): `docs/API_CONTRACT.md` per endpoint (method/route/auth/role/
  request/validasi/response/error/side-effect/transaksi/audit/notifikasi);
  error contract tunggal + request_id; status code konsisten
  (200/201/204/400/401/403/404/409/422/429/500); DTO create/update per modul;
  ownership test IDOR; state machine eksplisit; broadcast via outbox/event.
