# DATABASE.md — ALMAPARUNG (pasca-PHASE 5-7)

SQLite modernc, WAL+NORMAL+FK ON+busy 5s, DSN `_txlock=immediate`
(semua transaksi BEGIN IMMEDIATE). 50+ tabel (lihat REPAIR_SYSTEM_INVENTORY.md).

Kolom/batasan baru (migrasi repeat-safe di `db.go` + `runMigrations`):
- `users.token_version` (revokasi sesi), `activity_logs` dipertahankan saat user dihapus.
- `payment_transactions/receipts/kas_transactions/donations.idempotency_key` + UNIQUE.
- `receipts.receipt_no` UNIQUE; sequence via `receipt_sequences` (ganti MAX()+1).
- `kas_transactions.voided/void_reason` (ganti hard-delete).
- `grades(student_id,subject_id,semester,academic_year)` UNIQUE (CBT sync aman).
- `audit_logs` + index actor/entity.
- Index hot-path: spp/iuran(santri_id,status + paid_at), paytx(bill,period),
  kas(category), santri(user_id).
- `santri.category` — kategori Murid (Jilid 67, 1 Okt 2026):
  `TEXT DEFAULT 'reguler'`, enum `reguler|yatim|dhuafa`. Ditambah via
  `addColumnIfNotExists` di `db.go`, jadi repeat-safe dan data lama otomatis
  dapat `'reguler'`. Nilainya **sama** dengan `registrations.category`; saat
  PSB `accepted` → `AcceptToSantri` menyalinnya agar tidak ada dua sumber
  kebenaran. Ejaan dinormalkan lewat `validators.NormalizeCategory`
  (alias `duafa`/`dhufa` → `dhuafa`, huruf besar/kecil diabaikan). Kolom TIDAK
  bisa difilter lewat query params API — hanya lewat payload create/update.
- `santri.father_occupation`/`santri.mother_occupation` — kolom ini sudah ada
  di model dan form, tapi sebelumnya belum pernah dibuat di skema; sekarang
  ditambahkan `addColumnIfNotExists` (parity fix, bukan fitur baru).

Relasi sensitif: keuangan→santri.id, akademik→users.id, jembatan santri.user_id
(wajib diisi untuk santri aktif — backfill manual tercatat). FK finansial:
retention (tanpa CASCADE). `academic_years` wajib diisi sebelum transaksi
akademik (validasi di PHASE 13+). Backup: `scripts/backup.sh` (API, bukan cp).
