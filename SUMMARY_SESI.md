# VPS AlmaParung (PSB) — Ringkasan Sesi (mode: heru-vps)

## Objective
- Selesaikan bug/kesenjangan aplikasi PSB AlmaParung di VPS prod agar sesuai PRD §55 (NIK unik), §36/§52 (status machine), §10-27 (invoice+gateway), §6-7/37 (OTP) dan redesign visual mengikuti design tokens mockup.
- Prioritas user (dijawab di sesi): mulai dari **NIK duplikat + status machine (Recommended)**, diikuti OTP (kanal WA) dan Invoice+Gateway (butuh provider). User terakhir: "selesaikan sampai tuntas" lalu memilih **mulai sesi baru** untuk verifikasi yang benar.

## Important Details
- **VPS:** user `heru`, SSH `-p 2480`, host `103.107.206.5`, pass `H3ru@2026`. Jangan pernah menampilkan JWT_SECRET/email/password asli — hanya "tes" yang boleh tampil. Path deploy: `~/alma-parung/apps/backend` & `~/alma-parung/apps/frontend`.
- **DB production:** `/home/heru/alma-parung/data/alma-parung.db` = mount `/data` (DB_PATH=/data/alma-parung.db). DB uji/hari ini sudah LIWS (0 NIK duplikat, 0 baris nik kosong, hanya 1 baris psb_payments → tono). Backfill kwitansi sudah pernah dibuat lewat `backfill_kwitansi.py` (tabel `receipt_sequences`).
- **Container:** `alma-parung-backend` → image `alma-parung-backend:nikfix`, `-p 8090:8080`, restart always, mounts `/home/heru/alma-parung/data:/data` & `.../data/uploads:/app/apps/backend/public/uploads`, env APP_URL=https://almaparung.com. `alma-parung-frontend` → image `alma-parung-frontend:wizard`, `-p 3002:3000`.
- **Route auth:** `POST /api/auth/register`, `POST /api/auth/login` (cookie jar pakai `-c`/`-b`). Biodata PSB: `PUT /api/psb/me`, dokumen `PUT /api/psb/me/documents`, payment `PUT /api/psb/me/payment`. Health `GET /api/ready` → 200.
- **PENTING (pelajaran):** smoke test API harus dijalankan **di dalam VPS** (curl ke `127.0.0.1:8090`), bukan dari runner — runner hanya melihat `000`. Jalankan via `sshpass ... ssh -p 2480 heru@... 'bash /tmp/smoke.sh'` dengan skrip di-scp dulu.
- Sqlite via python3 di VPS (python sudah ada; go hanya di container). Ganti file backend dengan: scp file baru → `docker build -t alma-parung-backend:nikfix -f apps/backend/Dockerfile .` → `docker rm -f alma-parung-backend` → `docker run ... --env-file /tmp/be_env.txt` dengan env yang SAMA (jangan ekstrak/dump secret ke chat).
- Dynamic prompt mengikuti Design Tokens PRD (mockup): Primary `#1769E0` hover `#1258C7` light `#EAF2FF` soft `#F3F7FF`, navy `#123B68`/dark navy `#111C34`(PRD admin), bg `#F7F9FC`; font Inter+Outfit/Inter; radius 6-16px (bukan rounded-full kecuali badge/avatar); shadow subtle; tombol 40-44px; kartu gelombang/program; alur 6 langkah; FAQ accordion; footer CTA navy; + §36 status machine (lifecycle & respons kunci user) + §55 NIK+NIK duplicate + §52 invoice mahasiswa.

## Work State
### Completed
- **Kwitansi (kwitansi tono)**: backfill baris ledger pending untuk tono (KWI-2026/000002), recreate backend+frontend, container Up & health 200. Kwitansi tampil utk status pending & paid; GetMyReceipt membaca pending. (VERIFIED via smoke DB di VPS.)
- **Audit DB & schema**: registrations punya kolom `nik` (TEXT); tidak ada index UNIQUE di DB → di-handle di layer repo (bukan index global agar tidak memblokir daftar-ulang lintas periode, sesuai PRD §55 NIK+periode). 0 NIK duplikat & 0 NIK kosong existing → aman.
- **Patch NIK duplikat (SEBAGIAN VERIFIED? TIDAK — lihat Active)**: `repo_local.go` (di-scp balik ke VPS sbg `repository.go`) menambahkan `ErrDuplicateNIK` + method `CountByNIK(ctx, nik, excludeUserID)` + cek di `SaveByUserID` → return `ErrDuplicateNIK`; `handler_local.go` menambahkan mapping `errors.Is(err, ErrDuplicateNIK)` → `409` + pesan ramah "NIK sudah terdaftar..." di `SaveMyBiodata`. **Image `alma-parung-backend:nikfix` TELAH dibuild & container recreate & Up healthy 200.** ⚠️ Namun **smoke API tidak lolos di sesi ini karena salah run di runner (000)** — jangan diklaim verified.

### Active (harus diselesaikan di sesi baru)
- **Verifikasi NIK 409 end-to-end di dalam VPS**: skrip `smoke_nik.py` polos: register 2 user (A biodata PUT 200; B PUT dgn NIK sama → harapkan 409 + pesan), verifikasi DB count nik==1, cleanup. Jalankan `python3 smoke/…` via scp → run di VPS. (Ini BLOCKER — belum selesai.)
- Status machine hardening (PRD §36/§52): mapping status ↔ payment (pending/review/tes/accepted/re_registration/rejected & unpaid/pending/paid), audit log transisi, blokir edit setelah submit, revisi→review ulang.

### Blocked (butuh keputusan user)
- OTP (PRD §6-7,37): perlu memilih kanal delivery (WA existing OptIn? WA Business? Email/SMS?) + tabel `otp_codes` + rate-limit. Scaffold bisa dibuat tanpa kanal final.
- Invoice + Payment Gateway (PRD §10-27,§52): perlu memilih provider (midtrans/xendit/qris statis?) + webhook + idempotency + invoice number scheme (KWI-2026/000002 sudah ADA di receipt_sequences). Scaffold bisa dibuat provider-agnostik.
- Redesign visual ke token mockup (`#1769E0` dll.) — besar, harus bertahap; tidak satu-sesi.

## Next Move
1. Buka sesi baru (konteks bersih ~full). Jalankan smoke NIK di VPS (python via scp) → buktikan 409 & count==1 di DB. Kalau lolos, tandai NIK COMPLETE.
2. Kerjakan status machine hardening (repo+handler) → build `:nikfix`+ → deploy ulang → smoke manual di VPS.
3. Scaffold OTP (tabel+generate/verify/resend+cooldown) tanpa aktivasi kanal; lalu kerangka Invoice+Gateway provider-agnostik (webhook-signature + idempotency + state), hanya aktifkan saat channel/provider diputuskan.
4. Setiap deploy: rebuild image backend `:nikfix`, recreate container pakai `--env-file /tmp/be_env.txt` (env existing) lalu `curl /api/ready` & smoke terverifikasi di VPS sebelum lanjut.

## Relevant Files
- `apps/backend/internal/features/psb/repository.go` (ErrDuplicateNIK ~L366, CountByNIK ~L219, psbStatusTransitions ~L398, UpdatePaymentByUserID ~L345)
- `apps/backend/internal/features/psb/handler.go` (SaveMine ~L232, mapping ErrDuplicateNIK ~L274)
- `apps/backend/cmd/api/main.go` (routes PSB ~L403-407)
- `apps/frontend/src/app/portal/payment/page.tsx` (kwitansi modal: `loadReceipt`, `showKwitansi`, tolak URL javascript dalam `toKwitansi`)
- `backfill_kwitansi.py` (skrip backfill kwitansi; pakai argumen apply)
- Smoke harness: selama ini pola "scp → bash di VPS" lebih andal daripada heredoc dalam SSH.
