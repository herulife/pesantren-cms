#!/usr/bin/env bash
set -e
echo "== before =="
df -h / | tail -1

# hanya hapus image alma-parung-* yang BUKAN dipakai container jalan
in_use=$(docker ps -aq | xargs -r docker inspect -f '{{.Image}}' | sort -u)
to_rm=()
for img in $(docker images --format "{{.Repository}}:{{.Tag}}" | grep '^alma-parung-'); do
  if echo "$in_use" | grep -qx "$img"; then
    echo "KEEP  $img"; continue
  fi
  # khusus tag jilid/jenjang/autospp/notesA/psbcat/psb di frontend+backend (bukan latest)
  case "$img" in
    alma-parung-frontend:latest|alma-parung-backend:latest) echo "KEEP  $img"; continue;;
  esac
  to_rm+=("$img")
done
echo "== akan dihapus (${#to_rm[@]} image) =="
printf '%s\n' "${to_rm[@]}"
for img in "${to_rm[@]}"; do docker rmi "$img" >/dev/null 2>&1 || echo "  (skip gagal: $img)"; done

echo "== prune build cache + dangling =="
docker builder prune -af >/dev/null 2>&1
docker image prune -f >/dev/null 2>&1

echo "== after =="
df -h / | tail -1
docker system df
