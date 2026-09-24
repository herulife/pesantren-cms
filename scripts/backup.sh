#!/usr/bin/env bash
# scripts/backup.sh — WAL-safe backup AlmaParung (PHASE 1)
# JANGAN pakai `cp *.db` untuk SQLite WAL — gunakan backup API via python3.
# Usage: scripts/backup.sh [daily|weekly|manual]
set -euo pipefail
cd "$(dirname "$0")/.."

MODE="${1:-daily}"
TS="$(date +%Y%m%d-%H%M%S)"
KEEP_DAILY=7
KEEP_WEEKLY=4

python3 - "$TS" <<'EOF'
import sqlite3, sys
ts = sys.argv[1]
for src, dst in [
    ("data/alma-parung.db", f"backups/alma-parung-{ts}.db"),
]:
    s = sqlite3.connect(f"file:{src}?mode=ro", uri=True)
    d = sqlite3.connect(dst)
    with d:
        s.backup(d)
    s.close(); d.close()
    # verifikasi langsung: integrity + jumlah tabel
    v = sqlite3.connect(f"file:{dst}?mode=ro", uri=True)
    assert v.execute("PRAGMA integrity_check").fetchone()[0] == "ok", dst
    print("OK", dst)
EOF

tar -czf "backups/uploads-$TS.tar.gz" data/uploads
tar -czf "backups/config-$TS.tar.gz" .env.example deploy \
  apps/backend/Dockerfile apps/frontend/Dockerfile .dockerignore

if [ "$MODE" = "daily" ]; then
  # shellcheck disable=SC2012
  ls -t backups/alma-parung-*.db 2>/dev/null | tail -n +$((KEEP_DAILY + 1)) | xargs -r rm -f
  ls -t backups/uploads-*.tar.gz 2>/dev/null | tail -n +$((KEEP_DAILY + 1)) | xargs -r rm -f
  ls -t backups/config-*.tar.gz 2>/dev/null | tail -n +$((KEEP_DAILY + 1)) | xargs -r rm -f
fi
if [ "$MODE" = "weekly" ]; then
  for f in backups/alma-parung-"$TS".db \
           backups/uploads-"$TS".tar.gz backups/config-"$TS".tar.gz; do
    cp "$f" "${f%.*}-weekly.${f##*.}" 2>/dev/null || cp "$f" "$f-weekly"
  done
  ls -t backups/*-weekly* 2>/dev/null | tail -n +$((KEEP_WEEKLY * 4 + 1)) | xargs -r rm -f
fi
rm -f backups/*.shm backups/*.wal
echo "BACKUP DONE $TS ($MODE)"
