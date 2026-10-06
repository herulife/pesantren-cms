#!/usr/bin/env bash
# Mengambil log container via SSH.
#
# Credential tidak boleh disimpan di repo. Pakai environment variable:
#   export VPS_HOST=... VPS_PORT=... VPS_USER=... VPS_PASS=... [CONTAINER=...]
#   ./ssh_logs.sh
#
# Versi python yang sebelumnya menyimpan password dan IP VPS langsung di dalam
# file sudah dihapus demi alasan itu.
set -euo pipefail

: "${VPS_HOST:?set VPS_HOST}"
: "${VPS_PORT:?set VPS_PORT}"
: "${VPS_USER:?set VPS_USER}"
: "${VPS_PASS:?set VPS_PASS}"

CONTAINER="${CONTAINER:-}"

if [ -n "$CONTAINER" ]; then
  sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=accept-new -p "$VPS_PORT" \
    "$VPS_USER@$VPS_HOST" \
    "echo '$VPS_PASS' | sudo -S docker logs --tail 20 '$CONTAINER'"
else
  sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=accept-new -p "$VPS_PORT" \
    "$VPS_USER@$VPS_HOST" \
    "echo '$VPS_PASS' | sudo -S docker ps --format 'table {{.Names}}\t{{.Status}}'"
fi