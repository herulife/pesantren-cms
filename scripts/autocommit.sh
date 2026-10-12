#!/usr/bin/env bash
set -u
REPO=/home/heru/alma-parung
INTERVAL=${INTERVAL:-20}
LOG=$REPO/scripts/autocommit.log
LOCK=/tmp/alma-autocommit.lock

exec 9>"$LOCK"
flock -n 9 || { echo "$(date "+%F %T") sudah berjalan, keluar" >> "$LOG"; exit 0; }

log(){ echo "$(date "+%F %T") $*" >> "$LOG"; }

while true; do
  cd "$REPO" || { log "repo tidak ditemukan"; sleep 30; continue; }
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
  [ -z "$BRANCH" ] && BRANCH=main

  if ! git status --porcelain | grep -q .; then
    sleep "$INTERVAL"
    continue
  fi

  git add -A
  if git diff --cached --quiet; then
    sleep "$INTERVAL"
    continue
  fi

  FILES=$(git diff --cached --name-only)
  N=$(printf "%s\n" "$FILES" | grep -c .)
  LIST=$(printf "%s\n" "$FILES" | head -4 | paste -sd, -)
  [ "$N" -gt 4 ] && LIST="${LIST}, +$((N-4)) lainnya"
  [ -z "$LIST" ] && LIST="perubahan"

  log "commit $N file -> $LIST"
  git commit -m "auto: $LIST" -m "autocommit.sh $(date -u "+%Y-%m-%dT%H:%M:%SZ")" >> "$LOG" 2>&1 \
    && git push origin "$BRANCH" >> "$LOG" 2>&1 \
    && log "push OK -> origin/$BRANCH"
  sleep "$INTERVAL"
done
