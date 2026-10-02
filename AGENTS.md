# AGENTS.md — Alma Parung (almaparung.com)

Panduan operasi untuk AI agent (opencode/CLI) yang mengerjakan repo ini.
Bacalah sebelum mengubah kode. Bahasa: Indonesia.

## 1. Arsitektur & lokasi

- Monorepo di `~/alma-parung` (VPS prod, user `heru`):
  - `apps/backend` — Go (chi, `module almaparung-api`), SQLite. Lihat `apps/backend/internal/{features,platform,validators}`, entry `apps/backend/cmd/api/main.go`.
  - `apps/frontend` — Next.js 16 + React 19 + Tailwind 4. Lihat `apps/frontend/src/{app,components,lib}`.
- Database prod: `/home/heru/alma-parung/data/alma-parung.db`, di-mount ke container sebagai `/data` (`DB_PATH=/data/alma-parung.db`). Uploads: `data/uploads` → `/app/apps/backend/public/uploads`.
- Container (**per 1 Okt 2026; JANGAN percaya angka lama di file ini — tag image berubah tiap jilid,
  selalu `docker ps` untuk memastikan**): `alma-parung-backend` (image `alma-parung-backend:j74-kelas-panel`, `-p 8090:8080`, `--restart always`) dan **`alma-parung-frontend-bobot`** (image `alma-parung-frontend:j74-kelas-panel`, `-p 3002:3000`, `--restart unless-stopped`). Container rollback versi sebelumnya: `alma-parung-backend-pre-j74` (image `j69-avatar`) + `alma-parung-frontend-bobot-pre-j74` (image `j72-login-center`) - jangan `docker rm`, hanya `stop` + `rename`. Sumber kebenaran live: `RINGKASAN.md` §2.
- Env backend aktual HANYA di dalam container (`docker inspect alma-parung-backend`). Jangan print secret (JWT_SECRET/password) ke chat/log. Template publik: `.env.example`.

- **`student_id` di fitur `disciplines` = `users.id`, bukan `santri.id`.** `POST /api/disciplines/violations`
  menolak akun non-Santri dengan **422** (`ErrNotSantri`); form WAJIB pakai dropdown (filter `user_id`
  non-null). Jangan menambah endpoint yang menerima `student_id` mentah tanpa cek ke tabel `santri`.
## 2. Dokumen yang wajib dibaca dulu

- `SUMMARY_SESI.md` — memori sesi (status verified vs belum, pelajaran penting).
- `HANDOFF.md` — **serah terima + daftar kerja terbuka** (28 Sep 2026): apa yang sudah selesai, 8 pekerjaan yang masih terbuka, dan resep eksekusinya. Baca ini kalau mau lanjut.
- `RINGKASAN.md` — status live (§2), riwayat (§4), TODO aktif (§5), pelajaran teknis (§6).
- `TAGIHAN_OPMODE.md` — daftar kerja + protokol deploy.
- `docs/` — `API_CONTRACT.md`, `DATABASE.md`, `RBAC_MATRIX.md`, `SECURITY.md`, `TEST_MATRIX.md`, `REPAIR_PLAN.md`, `FINDINGS_REGISTER.md`, `*_CURRENT.md`, `*_RUNBOOK.md`.

## 3. Kontrak API & pola kode (jangan dilanggar)

- Auth: `POST /api/register` body `{name,email,password}` (STRICT JSON — unknown field = 400), `POST /api/login` body `{email,password}`. Cookie `alma_token` ber-flag `Secure` → **tidak terkirim via HTTP polos**; untuk smoke/curl pakai `Authorization: Bearer <token dari Set-Cookie>`.
- Semua decode JSON backend memakai `validators.DecodeStrictJSON` (unknown field ditolak).
- Portal wali (role `user`): `GET/PUT /api/psb/me`, `PUT /api/psb/me/documents`, `PUT /api/psb/me/payment`, `GET /api/psb/me/receipt`, `/api/my-bills`, `/api/my-receipt` (lihat grup "Portal PSB" di `main.go`).
- RBAC: `auth.RequireRole(...)`, `superadmin` bypass semua. Notifikasi: `superadmin,bendahara`. SPP/iuran: `bendahara`.
- NIK unik di layer repo (`ErrDuplicateNIK` → 409), bukan index global (daftar-ulang lintas periode).
- Status PSB guarded: `psbStatusTransitions` + conditional UPDATE → 422 bila ilegal; `accepted/re_registration` wajib `payment_status=paid`. Portal tak bisa edit biodata saat `review/tes/accepted/re_registration` (`ErrEditLocked` → 403); `pending`/`rejected` boleh.
- Pembayaran: `paid` terminal + idempotent; ledger `psb_payments` satu baris per registrasi; nomor `KWI-yyyy/seq` via `finance.NextReceiptNo` dalam transaksi.
- OTP (`features/otp`): 6 digit, hash SHA-256, TTL 10 mnt, cooldown 60 dtk, maks 5x coba; kirim via `whatsapp.SendMessage`. Endpoint publik rate-limited: `POST /api/otp/request|verify`.
- Invoice (`features/invoices`): provider-agnostik; webhook `POST /api/invoices/webhook` verifikasi HMAC-SHA256 header `X-Signature` (`INVOICE_WEBHOOK_SECRET`); idempoten via `gateway_tx_id` (replay→200, konflik→409).
- WhatsApp (`platform/whatsapp/sender.go`): teks saja via antrean `wagate`; template pakai `PortalBaseURL()` (dari `APP_URL`) — jangan hardcode domain. Status: `GET /api/notifications/wa/status` (butuh login). Gateway konek sebagai 081932506078.
- Settings: key-value; endpoint publik difilter allowlist di `settings/handler.go GetPublic` — **key baru untuk portal HARUS masuk allowlist**. Key rekening: `donation_*`, `psb_payment_*`, `spp_*`.
- Kwitansi frontend: `src/components/KwitansiModal.tsx` (`KwitansiTx`, `terbilang`, `downloadKwitansiPDF` via jsPDF). Logo = `settings.web_logo_url` fallback `/assets/img/logo-alama.jpg` (sama seperti Navbar). Dipakai 5+ halaman — jaga kompatibilitas props.
- Skrip `scripts/smoke_nik_final.py` masih versi lama (rute/payload lama) — perbaiki dulu sebelum dipakai.

## 4. Cara kerja yang aman di VPS ini

- Smoke test API **harus dari dalam VPS** (`http://127.0.0.1:8090`), bukan dari runner (akan `000`).
- Go toolchain hanya di container build; di host pakai `python3` + sqlite untuk inspeksi DB. Tulis ke DB prod hanya untuk data uji — selalu cleanup.
- Akses docker: user `heru` (grup `docker`); user lain (mis. `alma`) butuh `sudo`. Build backend: `docker build -t alma-parung-backend:<TAG> -f apps/backend/Dockerfile .`. Recreate pakai `--env-file` dari env container berjalan (lihat `TAGIHAN_OPMODE.md`), jangan susun env manual.
- Frontend: `npm run build --prefix apps/frontend` harus sukses; deploy = build image `alma-parung-frontend:<TAG>` + recreate container `-p 3002:3000` (tanpa mount/env khusus).
- `tsc` di host: `apps/frontend/tsconfig.tsbuildinfo` dimiliki root → selalu pakai `npx tsc --noEmit --incremental false`.
- Setelah deploy: `curl /api/ready` (harap 200) + smoke terverifikasi sebelum klaim selesai.
- Build lambat (backend ~10 mnt, frontend ~11-15 mnt): jalankan `nohup ... > log 2>&1 &` + file penanda `.done`, jangan blokir satu panggilan ssh. Detail & gotcha lain ada di `HANDOFF.md` §5.
- JANGAN reset password prod tanpa izin user. Bila diizinkan: backup `password_hash`, set bcrypt sementara, kembalikan + verifikasi setelahnya.
- Nomor WA uji: gateway (081932506078) untuk pesan sistem; 082114752228 hanya bila user meminta. Jangan kirim ke nomor fiktif (server WA menolak: `no LID found`).
- Jangan commit secret. Jangan tampilkan JWT_SECRET/password di output.

## 5b. KUNCI / LOCK (29 Sep 2026) — do NOT revert without user order

- **Program Unggulan di `/portal/program` DIHAPUS selamanya (perintah user 29 Sep 2026).**
  - Frontend `apps/frontend/src/app/portal/program/page.tsx` setara commit `0fd6a92`
    (tanpa picker Tahfidz/Bahasa; `program_choice` disimpan sebagai string kosong).
  - `program_choice` TIDAK lagi menjadi syarat "biodata lengkap" di
    `apps/frontend/src/app/portal/documents/page.tsx`, `apps/frontend/src/app/portal/page.tsx`,
    dan `apps/frontend/src/app/portal/payment/page.tsx` (agar upload dokumen & pembayaran tetap bisa).
  - JANGAN mengembalikan pemilih "Program Unggulan" / jangan jadikan `program_choice` wajib lagi.
  - Image frontend terkunci: `alma-parung-frontend:fix-psb-current`
    (= `fix-psb-upload-nopicker`). Image lama yang mengandung picker (`fix-psb-upload`,
    frontend `disc-wa`) sudah dihapus dari mesin.
  - Verifikasi (29 Sep 2026): `/portal/program` tanpa Program Unggulan, upload dokumen tetap
    201/200 end-to-end.
## 5. Riwayat perubahan penting sesi ini (Sep 2026)

- NIK 409 verified; edit-lock 403 verified.
- Paket baru: `features/otp`, `features/invoices`; tabel `otp_codes`, `invoices`.
- Template WA ber-link dashboard (`/portal/payment-spp`, `/portal/payment`).
- `KwitansiModal` baru (logo Navbar, print A4, unduh PDF `Kwitansi-{kode}.pdf`).
- Settings admin: tab "No. Rekening" (Donasi/PSB/SPP); key dummy bertanda `(DUMMY)` — ganti via UI.
