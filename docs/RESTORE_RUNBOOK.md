# RESTORE_RUNBOOK.md — ALMAPARUNG (PHASE 1)

## Kapan dipakai

- Migrasi gagal / data korup / salah hapus / rollback phase.
- Prinsip: STOP backend dulu, restore, verifikasi, baru START.

## Prosedur restore database

```bash
cd ~/alma-parung
# 1. Hentikan backend (hindari tulis saat restore)
docker stop alma-parung-backend
# 2. Amankan kondisi rusak (jangan ditimpa)
mv data/alma-parung.db data/alma-parung.db.broken-$(date +%Y%m%d-%H%M%S)
# 3. Restore dari backup WAL-safe
cp backups/alma-parung-<TS>.db data/alma-parung.db
rm -f data/alma-parung.db-shm data/alma-parung.db-wal
# 4. Verifikasi SEBELUM start
python3 -c "import sqlite3;c=sqlite3.connect('file:data/alma-parung.db?mode=ro',uri=True);print(c.execute('PRAGMA integrity_check').fetchone()[0])"
# 5. Start + smoke: /health, login, dashboard, 1 transaksi baca
docker start alma-parung-backend
```

WA session: prosedur sama untuk `data/wagate/wa_session.db`
(jangan restore WA + DB beda generasi tanpa catat — catat di laporan phase).
Uploads/config: `tar -xzf backups/uploads-<TS>.tar.gz` /
`tar -xzf backups/config-<TS>.tar.gz` (cek diff `.env` sebelum timpa).

## Rollback migrasi

- Setiap phase bermigrasi WAJIB mencatat: commit pre-phase + file backup yang
  dipakai + migration up/down. Bila migration irreversible: staged plan di
  laporan phase, rollback = restore backup pre-phase (prosedur di atas).
- Kriteria abort: integrity gagal / test concurrency gagal / security test
  gagal / smoke test gagal -> rollback, JANGAN force.

## Drill tercatat

- 2026-09-14: restore drill ke /tmp/restore-drill.db — integrity ok,
  50 tabel, users 4 sesuai live. PASS.
