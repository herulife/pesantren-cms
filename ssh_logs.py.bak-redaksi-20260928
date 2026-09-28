import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("103.107.206.10", port=2480, username="ubuntu24", password="Ubuntu@2025")

stdin, stdout, stderr = client.exec_command("echo 'Ubuntu@2025' | sudo -S docker logs --tail 20 web-sekolah")
print(stdout.read().decode('utf-8'))
print(stderr.read().decode('utf-8'))

# also check if nginx has error logs related to upload
stdin, stdout, stderr = client.exec_command("echo 'Ubuntu@2025' | sudo -S docker exec web-sekolah cat /var/log/nginx/error.log")
nginx_logs = stdout.read().decode('utf-8')
if "413" in nginx_logs or "too large" in nginx_logs:
    print("NGINX ERROR:", nginx_logs)

client.close()
