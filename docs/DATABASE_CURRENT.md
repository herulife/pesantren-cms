# DATABASE_CURRENT.md — ALMAPARUNG (actual 2026-09-14)

- Engine: SQLite modernc v1.48, `database/sql`, var DB global, WAL+NORMAL+FK ON+
  busy 5s, MaxOpenConns(1). File live `data/alma-parung.db` ~1.1MB + shm/wal
  (~4MB WAL saat discovery). WA session `data/wagate/wa_session.db` ~4.5MB.
- Migrasi: `internal/platform/database/db.go` tunggal (createTables + ~60
  addColumnIfNotExists + runMigrations + rewrite admin->superadmin TIAP BOOT
  tanpa audit, irreversible). 6 backup `.bak-*` manual (cp, tidak WAL-safe).
- 50 tabel (lihat SYSTEM_INVENTORY). Kritis: users (4), santri (3, user_id NULL
  semua), registrations (0), teachers (1), employees (0), spp_bills (2 unpaid),
  iuran/paytx/receipts/kas_tx/payments/donations/donors (0), grades (8),
  raports (1 locked 82.58 "Sangat Baik" = bug C11), academic_years (KOSONG),
  settings (42), activity_logs (161), classes (8), news (12), gallery (22),
  videos (19). Orphan 0, duplikat 0 (data kecil — risiko struktural).
- Split identitas: akademik -> users.id; keuangan -> santri.id; jembatan
  santri.user_id NULL semua. `santri.class` free-text (ada 'v' kecil campur
  'VII-A'); `santri` TANPA kolom nik (NIK hanya di registrations);
  `grades` TANPA kolom uts/uas/tugas (nama kolom berbeda, formula 30/40/30 di kode).
- FK ~30 entri mayoritas NO ACTION; hanya santri.user_id SET NULL &
  donations.campaign SET NULL (+CASCADE di project).
- Index aktual 37. HILANG di hot-path: spp/iuran (santri_id),(status),(paid_at);
  paytx (bill_type,bill_id),(bill_period); kas_tx (category_id);
  santri (user_id); receipts year-expression MAX(). Bukti: audit 2026-09-14.
- Financial anti-pattern: check-then-act tanpa IMMEDIATE; receipt MAX()+1;
  tanpa idempotency_key; cancel tanpa reversal; CBT ON CONFLICT tanpa unique index.
- Sensitif: donors/donations (PII+proof), teachers (email+WA), users, wallet/pin,
  receipts/proofs, registrations (NIK). Semua currently over-exposed via public API/serve.

Target (PHASE 5): migrasi berversion (additive->index->constraint), index
hot-path + EXPLAIN QUERY PLAN, UNIQUE bisnis (grades/attendance/tahfidz,
idempotency_key, receipt sequence), FK review (keuangan = retention, bukan
CASCADE), isi academic_years + backfill link-user, backup `.backup` terjadwal +
off-host + drill, SATU DB path source-of-truth.
