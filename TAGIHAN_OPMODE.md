# TAGIHAN OPMODE LANJUT — jalankan DI VPS (heru@103.107.206.5:2480)

Konteks utuh ada di ~/alma-parung/SUMMARY_SESI.md (sudah di-copy ke VPS di sesi ini).
Bacalah file itu DULU. Ringkasan eksekusi di bawah ini.

## STATE SAAT INI (sudah verified dari sisi image/DB)
- Backend image: alma-parung-backend:nikfix — built OK di VPS, container alma-parung-backend Up (healthy), /api/ready=200, port 8090->8080.
- Patch NIK duplikat (PRD55) SUDAH di binary build (strings mengandung ErrDuplicateNIK).
- DB: 0 NIK duplikat existing (aman aktifkan unique-check).
- Rute benar: register=/api/register, login=/api/login, biodata=PUT /api/psb/me.

## YANG BELUM TERBUKTI (wajib dibuktikan di VPS, bukan dari remote shell)
1. Smoke end-to-end NIK 409 — file siap: ~/alma-parung/scripts/smoke_nik_final.py
   Jalankan di VPS (bukan via ssh runner, harus lokal):
     cd ~/alma-parung && python3 scripts/smoke_nik_final.py
   Harapan: register A=200, biodata A nik X=200, register B=200, biodata B nik SAMA=409 (ErrDuplicateNIK),
   count DB nik=X == 1. Script membersihkan data uji otomatis.

2. OTP (PRD6-7,37): belum dibuat. Keputusan kanal (WA/email/SMS) belum dijawab user — tanyakan dulu,
   jangan bangun tanpa keputusan. Scaffold: tabel otp_codes + endpoint /api/otp/request + /api/otp/verify
   dengan cooldown 60s + max 5 percobaan + TTL 10m.

3. Invoice + Payment Gateway (PRD10-27): belum dibuat. Keputusan provider (VA/QRIS/e-wallet; kanal) belum
   dijawab. Scaffold: tabel invoices (registration_id, code KWI-yyyy/seq, amount, due_at, status, gateway_tx_id,
   webhook_received_at) + endpoint webhook dengan signature check + idempotency (unique gateway_tx_id).

4. Status machine hardening (PRD36/52): psbStatusTransitions sudah ada di repository.go (cek ulang & rapatkan,
   blokir edit biodata setelah status review/tes/accepted; audit log transisi status & payment sudah ada — awasi).

5. Desain visual PRD (mockup #1769E0, kartu gelombang, dll): scaffold token di globals.css + halaman utama portal
   — kerjakan bertahap, verifikasi tiap build.

## PROTOKOL DEPLOY (dari VPS, jangan dari runner sandbox)
  cd ~/alma-parung
  docker build -t alma-parung-backend:nikfix -f apps/backend/Dockerfile .   # ~menit
  docker run -d --name alma-parung-backend --restart always \
    --env-file <env_backend_yang_sama_dengan_sekarang> \
    -v /home/heru/alma-parung/data:/data \
    -v /home/heru/alma-parung/data/uploads:/app/apps/backend/public/uploads \
    -p 8090:8080 alma-parung-backend:nikfix
  curl -s http://127.0.0.1:8090/api/ready   # harap 200
Frontend analog: image alma-parung-frontend:wizard, port 3002:3000, mount sama.

## CATATAN PENTING
- JANGAN commit/print secret ke git/log. JWT_SECRET & db path ada di env container inspect — buat --env-file pribadi.
- Backend Go tidak punya CLI sqlite; pakai python3 + sqlite3 (sudah ada di VPS).
- Setelah deploy, ALWAYS smoke di dalam VPS (127.0.0.1), bukan dari runner.
- Lanjutkan prioritas user: (1) NIK verified, (2) OTP setelah keputusan kanal, (3) invoice/gateway setelah
  keputusan provider, (4) status machine, (5) desain token.
