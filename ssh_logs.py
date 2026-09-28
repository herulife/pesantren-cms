"""Skrip inspeksi log server lain via SSH.
Kredensial WAJIB lewat env (jangan di-hardcode):
    export SSH_HOST=... SSH_PORT=... SSH_USER=... SSH_PASS=...
"""
import getpass, os, sys

import paramiko

HOST = os.environ.get("SSH_HOST", "")
PORT = int(os.environ.get("SSH_PORT", "22"))
USER = os.environ.get("SSH_USER", "")
PASS = os.environ.get("SSH_PASS") or getpass.getpass("SSH password: ")
if not (HOST and USER):
    sys.exit("set SSH_HOST dan SSH_USER (lihat docstring)")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)

stdin, stdout, stderr = client.exec_command("echo "$PASS" | sudo -S docker logs --tail 20 web-sekolah")
print(stdout.read().decode('utf-8'))
print(stderr.read().decode('utf-8'))

# also check if nginx has error logs related to upload
stdin, stdout, stderr = client.exec_command("echo "$PASS" | sudo -S docker exec web-sekolah cat /var/log/nginx/error.log")
nginx_logs = stdout.read().decode('utf-8')
if "413" in nginx_logs or "too large" in nginx_logs:
    print("NGINX ERROR:", nginx_logs)

client.close()
