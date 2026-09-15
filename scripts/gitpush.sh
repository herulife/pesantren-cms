#!/usr/bin/env bash
# gitpush.sh — commit & push semua perubahan ke GitHub, lalu keluar.
# Cara pakai:
#   ./scripts/gitpush.sh                 (pakai pesan otomatis)
#   ./scripts/gitpush.sh "pesan commit"
set -u
REPO=${REPO:-/home/heru/alma-parung}
cd "$REPO" || { echo "Repo tidak ditemukan: $REPO"; exit 1; }

MSG="${1:-}"
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
[ -z "$BRANCH" ] && BRANCH=main

git add -A

if git diff --cached --quiet; then
  echo "Tidak ada perubahan lokal untuk di-commit."
else
  if [ -z "$MSG" ]; then
    FILES=$(git diff --cached --name-only)
    N=$(printf "%s\n" "$FILES" | grep -c .)
    LIST=$(printf "%s\n" "$FILES" | head -4 | paste -sd, -)
    [ "$N" -gt 4 ] && LIST="${LIST}, +$((N-4)) lainnya"
    [ -z "$LIST" ] && LIST="perubahan"
    MSG="sync: $LIST"
  fi
  git commit -m "$MSG" -m "gitpush.sh $(date -u '+%Y-%m-%dT%H:%M:%SZ')" || { echo "Commit gagal."; exit 1; }
  echo "Committed: $MSG"
fi

if ! git push origin "$BRANCH" 2>"$REPO/scripts/gitpush.err"; then
  echo "Push ditolak, tarik ulang lalu push lagi..."
  git pull --rebase origin "$BRANCH" || { echo "Konflik saat rebase — tangani manual, lalu git push."; exit 1; }
  git push origin "$BRANCH"
fi
rm -f "$REPO/scripts/gitpush.err"
echo "Sinkron: origin/$BRANCH = $(git rev-parse --short HEAD)"