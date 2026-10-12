# BACKUP_RUNBOOK.md — ALMAPARUNG (PHASE 1)

## Aturan emas

- JANGAN `cp data/*.db` — database berjalan dalam mode WAL; copy mentah bisa
  korup/tidak konsisten. WAJIB via SQLite backup API (`scripts/backup.sh`).
- Backup mencakup: `alma-parung.db`, `wa_session.db`, `data/uploads/`, config
  (`.env`, compose, Dockerfiles, `.dockerignore`).
- `.env`/backup MENGANDUNG SECRET — JANGAN commit ke git (di-cover `.gitignore`:
  `*.db`, `data/`, `backups/*.tar.gz`).

## Manual

```bash
cd ~/alma-parung
scripts/backup.sh manual   # atau daily / weekly
```

Output: `backups/<nama>-YYYYMMDD-HHMMSS.*` + verifikasi `integrity_check=ok`
otomatis. Script abort bila integrity gagal.

## Jadwal (cron, terpasang di VPS)

```text
0 2 * * *  cd ~/alma-parung && ./scripts/backup.sh daily  >>/tmp/backup-daily.log 2>&1
0 3 * * 0  cd ~/alma-parung && ./scripts/backup.sh weekly >>/tmp/backup-weekly.log 2>&1
```

Retensi: daily 7, weekly 4 (file `-weekly`). Cek log bila curiga gagal.

## Off-host copy

- Baseline 2026-09-14 tersimpan off-host (DB + WA + uploads + config).
- Rutin: salin file backup terbaru ke mesin off-host minimal mingguan:
  `scp -P 2480 heru@103.107.206.5:~/alma-parung/backups/<file> <offhost>/`
- Drill restore wajib tiap ada phase bermigrasi (lihat RESTORE_RUNBOOK.md).
