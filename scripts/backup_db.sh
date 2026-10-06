#!/bin/bash
# Backup rutin darussunnah: database + dokumen privat, retensi 14 hari.
set -euo pipefail

DB_DIR="/home/ubuntu24/my-docker-apps/apps/darussunnah/deploy/darussunnah/data"
BACKUP_DIR="/home/ubuntu24/my-docker-apps/apps/darussunnah/backups/db"
TS=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

# Backup berisi data siswa. Semua file dibuat 0600 dan milik user yang
# menjalankan skrip ini, supaya retensi tetap bisa bekerja: file milik root hasil
# `docker cp` tidak bisa dihapus oleh ubuntu24, jadibackup lama menumpuk tanpa
# batas dan isinya terbaca user lain di host.
HOST_UID=$(id -u)
HOST_GID=$(id -g)

secure_file() {
  [ -e "$1" ] || return 0
  chown "$HOST_UID:$HOST_GID" "$1" 2>/dev/null || \
    echo "[WARN] $(date) tidak bisa chown $1 (root-owned, retention bisa macet)"
  chmod 600 "$1" 2>/dev/null || true
}

prune() {
  # $1 = pola file, $2 = jumlah yang dipertahankan
  local pattern="$1" keep="$2"
  ls -1 "$BACKUP_DIR"/$pattern 2>/dev/null \
    | head -"$keep" | tail -n +$((keep + 1)) \
    | while read -r old; do rm -f "$old" || echo "[WARN] $(date) gagal hapus $old"; done
}

DB_FILE="$BACKUP_DIR/darussunnah_$TS.db"
if docker exec darussunnah-backend sqlite3 /data/darussunnah.db ".backup /tmp/db_backup.sqlite" 2>/dev/null; then
  docker cp darussunnah-backend:/tmp/db_backup.sqlite "$DB_FILE" >/dev/null 2>&1
  docker exec darussunnah-backend rm -f /tmp/db_backup.sqlite
else
  # fallback: kopi langsung saat DB idle
  sqlite3 "$DB_DIR/darussunnah.db" ".backup '$DB_FILE'" 2>/dev/null
fi

if [ -f "$DB_FILE" ]; then
  secure_file "$DB_FILE"
  echo "[OK] $(date) backup: $DB_FILE"
else
  echo "[WARN] $(date) backup database gagal: $DB_FILE tidak ada"
fi
prune "darussunnah_*.db" 14

# Dokumen siswa (dokumen PSB & bukti pembayaran) hidup di volume privat yang
# tidak ikut tercakup backup .db. Tanpa baris di bawah ini, restore DB tanpa
# volume privat akan menyisakan dokumen yang hilang.
#
# Volume itu milik root, jadi tar harus lewat container. Archive ditulis ke
# /backup lewat file sementara supaya file final tidak pernah ada dalam keadaan
# world-readable.
DOC_BACKUP="$BACKUP_DIR/private-uploads_$TS.tar.gz"
# File harus dibuat dengan UID/GID host dari dalam container: `docker cp` dan
# bind-mount sama-sama menghasilkan file root-owned, dan ubuntu24 tidak bisa
# chown-nya sendiri. Akibatnya retensi diam-diam gagal dan arsip tetap 0644.
docker run --rm \
  -e TS="$TS" -e HOST_UID="$HOST_UID" -e HOST_GID="$HOST_GID" \
  -v "$DB_DIR:/data:ro" \
  -v "$BACKUP_DIR:/backup" \
  alpine sh -c 'cd /data && tar -czf "/backup/private-uploads_$TS.tar.gz.tmp" private-uploads && mv "/backup/private-uploads_$TS.tar.gz.tmp" "/backup/private-uploads_$TS.tar.gz" && chown "$HOST_UID:$HOST_GID" "/backup/private-uploads_$TS.tar.gz" && chmod 600 "/backup/private-uploads_$TS.tar.gz"' \
  >/dev/null 2>&1 || echo "[WARN] $(date) backup private-uploads gagal"

if [ -f "$DOC_BACKUP" ]; then
  secure_file "$DOC_BACKUP"
  echo "[OK] $(date) backup: $DOC_BACKUP"
fi
prune "private-uploads_*.tar.gz" 14

# File lama dari versi skrip sebelumnya masih root-owned, jadi ubuntu24 tak
# bisa chown/prune sendiri. Rapikan sekali lewat container.
docker run --rm \
  -e HOST_UID="$HOST_UID" -e HOST_GID="$HOST_GID" \
  -v "$BACKUP_DIR:/backup" \
  alpine sh -c 'chown -R "$HOST_UID:$HOST_GID" /backup && find /backup -type f -exec chmod 600 {} +' \
  >/dev/null 2>&1 || echo "[WARN] $(date) rapikan ownership backup gagal"