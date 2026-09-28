"""Skrip inspeksi log server lain via SSH.

Kredensial WAJIB lewat environment (JANGAN di-hardcode di file ini):
    export SSH_HOST=... SSH_PORT=... SSH_USER=... SSH_PASS=...
    python3 ssh_logs.py

Kalau SSH_PASS tidak di-set, skrip memintanya interaktif (getpass).
Password tidak pernah ditulis ke file, tidak masuk argumen perintah,
dan tidak dicetak — dikirim lewat stdin ke `sudo -S`.
"""
import getpass
import os
import sys

try:
    import paramiko
except ImportError:
    sys.exit("butuh: pip install paramiko")

HOST = os.environ.get("SSH_HOST", "")
PORT = int(os.environ.get("SSH_PORT", "22"))
USER = os.environ.get("SSH_USER", "")
PASS = os.environ.get("SSH_PASS") or getpass.getpass("SSH password: ")
CONTAINER = os.environ.get("SSH_CONTAINER", "web-sekolah")

if not (HOST and USER):
    sys.exit("set SSH_HOST dan SSH_USER dulu (lihat docstring)")


def run(client, cmd):
    """Jalankan `sudo -S <cmd>`, kirim password lewat stdin."""
    stdin, stdout, stderr = client.exec_command("sudo -S " + cmd, timeout=30)
    stdin.write(PASS + "\n")
    stdin.flush()
    return stdout.read().decode("utf-8", "replace"), stderr.read().decode("utf-8", "replace")


client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
except Exception as e:
    sys.exit(f"gagal konek: {type(e).__name__}: {e}")

# 1) docker logs
out, err = run(client, f"docker logs --tail 20 {CONTAINER}")
print(out)
if err.strip():
    print("[stderr]", err.strip(), file=sys.stderr)

# 2) cari error nginx terkait upload (413 / too large)
out, err = run(client, f"docker exec {CONTAINER} cat /var/log/nginx/error.log")
if "413" in out or "too large" in out:
    print("NGINX ERROR:", out)
else:
    print("nginx error.log: tidak ada 413 / too large")

client.close()
