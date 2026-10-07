# AGENTS.md — Alma Parung (almaparung.com)

Panduan operasi untuk AI agent (opencode/CLI) yang mengerjakan repo ini.
Bacalah sebelum mengubah kode. Bahasa: Indonesia.

## 1. Arsitektur & lokasi

- Monorepo di `~/alma-parung` (VPS prod, user `heru`):
  - `apps/backend` — Go (chi, `module almaparung-api`), SQLite. Lihat `apps/backend/internal/{features,platform,validators}`, entry `apps/backend/cmd/api/main.go`.
  - `apps/frontend` — Next.js 16 + React 19 + Tailwind 4. Lihat `apps/frontend/src/{app,components,lib}`.
- Database prod: `/home/heru/alma-parung/data/alma-parung.db`, di-mount ke container sebagai `/data` (`DB_PATH=/data/alma-parung.db`). Uploads: `data/uploads` → `/app/apps/backend/public/uploads`.
- Container (**per 7 Okt 2026; JANGAN percaya angka lama di file ini — tag image berubah tiap jilid,
  selalu `docker ps` untuk memastikan**): `alma-parung-backend-j83` (image `alma-parung-backend:j84-kelola-wali`, `-p 8090:8080`, `--restart always`) dan **`alma-parung-frontend-j83`** (image `alma-parung-frontend:j84b-prd-adjust`, `-p 3002:3000`, `--restart unless-stopped` — fitur Jilid 84 kelola akun wali + halaman `/prd` dengan roadmap E-Rapor Jilid 85–87). Container rollback frontend: `alma-parung-frontend-pre-j84b` (image `j84-kelola-wali`) + `alma-parung-frontend-pre-j84` (image `prd-preview`) + `alma-parung-frontend-pre-prd` (image `j83-notif-expand`) + `alma-parung-frontend-pre-j83` (image `j82-sysnotif`); rollback backend: `alma-parung-backend-pre-j84` (image `j83-notif-expand`) + `alma-parung-backend-pre-j83` (image `j82-sysnotif`) — semua di-stop, jangan `docker rm`, hanya `stop` + `rename`. Sumber kebenaran live: `RINGKASAN.md` §2.
- Env backend aktual HANYA di dalam container (`docker inspect alma-parung-backend`). Jangan print secret (JWT_SECRET/password) ke chat/log. Template publik: `.env.example`.

- **`student_id` di fitur `disciplines` = `users.id`, bukan `santri.id`.** `POST /api/disciplines/violations`
  menolak akun non-Santri dengan **422** (`ErrNotSantri`); form WAJIB pakai dropdown (filter `user_id`
  non-null). Jangan menambah endpoint yang menerima `student_id` mentah tanpa cek ke tabel `santri`.
- **Login pakai cookie HttpOnly, bukan header Bearer.** `POST /api/login` mengembalikan
  `{success, user}` (BUKAN `token`), token dikirim lewat `Set-Cookie: alma_token=...`.
  Untuk smoke test WAJIB pakai `curl -c <jar>` lalu `curl -b <jar>`; kalau pakai
  `Authorization: Bearer` akan selalu gagal walau password benar. Response endpoint
  bisa berupa object `{data: [...]}` - jangan langsung `len()`.
- **Jilid 76: satu akun wali boleh dipakai BEBAS SANTRI.** Index unik
  `idx_santri_user_unique` di `santri(user_id)` sudah di-DROP (migration
  `santri_user_unique_drop`). Jangan pernah bikin ulang `CREATE UNIQUE INDEX` di
  `santri(user_id)` — itu akan membuat satu keluarga tidak bisa berbagi 1 login.
  `LinkUserExclusive` (route/frontend) sekarang SIBLING-SAFE; `FindByUserID`,
  `/my-santri`, `my-bills`, `my-ledger` sudah multi-Santri.
  **PENTING saat rollback:** image <= j75 akan recreate index itu saat start.
  Setelah rollback harus `DROP INDEX IF EXISTS idx_santri_user_unique`.
- **Jilid 78: `GET /api/santri/export` untuk export Excel/PDF — endpoint tanpa
  paginasi.** Kalau menambah endpoint static di `chi`, daftarkan SEBELUM
  `r.Get("/{id}")` (route param akan menelannya). Role `wali_kelas` dibatasi
  kelasnya lewat `scope.Resolve`, dan **fail-closed**: `restrictClasses=true`
  dengan daftar kelas kosong menghasilkan 0 baris, BUKAN semua data. Jangan
  memakai `len(classes) == 0` sebagai arti "semua" — 3 akun wali_kelas di DB
  punya `classes.wali_user_id = NULL` dan akan dapat seluruh data.

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
- **Jilid 84 — Kelola akun wali (superadmin/bendahara, `features/walisantri`):**
  - `POST /api/wali-santri` body `{name,email,whatsapp?,password,santri_ids?}` → 201 `{user_id}`. Duplikat email 409; santri dipilih tidak ada 404; wajib STRICT JSON. `whatsapp` opsional pakai `ValidatePhone`.
  - `PUT /api/wali-santri/{id}` body `{name,email,whatsapp?}` → edit data akun wali (termasuk whatsapp yang dulu tidak bisa diisi).
  - `POST /api/wali-santri/{id}/reset-password` body `{password}` (min 8) → 200; `token_version+1` = semua sesi lama akun itu otomatis dicabut (wali harus login ulang). Akun `role != "user"` → 400; id tidak ada → 404.
  - Daftar `GET /api/wali-santri` menaruh akun tanpa tautan santri di grup `orphans` (bukan `accounts`); field `whatsapp` hanya diekspos untuk `accounts`. Reset/modif password wali tetap taat aturan §"Password awal" di bawah.
- **Password awal akun wali (7 Okt 2026) = deterministik `Alma` + NIS santri pertama (id terkecil) di akun itu.** Kredensial: `/home/heru/KREDENSIAL-WALI-20261007.csv` (**di luar repo**, jangan commit). Backup hash lama: `/home/heru/backup-hash-wali-20261007.json` (rollback = restore dari JSON). Jangan reset manual selain lewat skema ini tanpa izin user.
- RBAC: `auth.RequireRole(...)`, `superadmin` bypass semua. Notifikasi: `superadmin,bendahara`. SPP/iuran: `bendahara`.
- NIK unik di layer repo (`ErrDuplicateNIK` → 409), bukan index global (daftar-ulang lintas periode).
- Status PSB guarded: `psbStatusTransitions` + conditional UPDATE → 422 bila ilegal; `accepted/re_registration` wajib `payment_status=paid`. Portal tak bisa edit biodata saat `review/tes/accepted/re_registration` (`ErrEditLocked` → 403); `pending`/`rejected` boleh.
- Pembayaran: `paid` terminal + idempotent; ledger `psb_payments` satu baris per registrasi; nomor `KWI-yyyy/seq` via `finance.NextReceiptNo` dalam transaksi.
- OTP (`features/otp`): 6 digit, hash SHA-256, TTL 10 mnt, cooldown 60 dtk, maks 5x coba; kirim via `whatsapp.SendMessage`. Endpoint publik rate-limited: `POST /api/otp/request|verify`.
- Invoice (`features/invoices`): provider-agnostik; webhook `POST /api/invoices/webhook` verifikasi HMAC-SHA256 header `X-Signature` (`INVOICE_WEBHOOK_SECRET`); idempoten via `gateway_tx_id` (replay→200, konflik→409).
- WhatsApp (`platform/whatsapp/sender.go`): teks saja via antrean `wagate`; template pakai `PortalBaseURL()` (dari `APP_URL`) — jangan hardcode domain. Status: `GET /api/notifications/wa/status` (butuh login). Gateway konek sebagai 081932506078.
- **Kas/Laba Rugi: angka Laba Rugi WAJIB dari `/api/kas/audit`** (Jilid 80). Jangan
  menjumlahkan ulang transaksi di frontend. `expense_groups` sengaja memakai filter
  (`expWhere/expArgs`) yang sama dengan `Audit.Expense` supaya penjumlahannya selalu balance;
  kalau nanti filter-nya dipisah, cek dulu invariant ini. Selalu init `[]AuditExpenseGroup{}`
  supaya JSON bukan `null`.
- **Filter "Jenis" di halaman Kas**: pakai client-side (`txsView`/`catsView`), jangan kirim
  sebagai param request. Kalau dikirim ke server, dropdown kategori di form ikut terfilter
  dan kategori yang tidak cocok lenyap dari pilihan.
- **Donasi: DTO publik JANGAN dipakai untuk endpoint admin** (fix Jilid 79). Dua
  handler, dua aturan berbeda:
  - `GET /api/donations` (publik, `main.go:549`) -> `GetDonations` -> `toPublicList`:
    hanya `verified`, tanpa PII.
  - `GET /api/donations/list` (admin, di balik `auth.RequireRole("superadmin","bendahara")`)
    -> `GetDonationsAdmin` -> `toAdminList`: pending + verified, boleh `donor_phone`,
    `payment_method`, `notes`, `donor_id`; tetap TIDAK `proof_url`/`verified_by`
    (bukti lewat route berauth `/uploads/proofs/{file}`).
  - Rumus: field yang DTO buang = field yang form edit tidak boleh kirim balik.
    `Repository.UpdateDonation` memakai `proof_url = CASE WHEN ? = '' THEN proof_url
    ELSE ? END` supaya edit tidak menghapus bukti transfer.
- **Jilid 81 — Batalkan Verifikasi donasi:**
  - `PUT /api/donations/unverify/{id}` (admin superadmin/bendahara): transaksi `verified`
    → `pending`, `verified_at`/`verified_by` di-NULL-kan, `donation_campaigns.collected_amount`
    dikurangi, `donations.wa_sent` TETAP (tidak di-reset). 422 jika belum `verified`.
  - `donations.wa_sent` = penanda "WA donasi sudah pernah dikirim". Hanya verify
    **pertama** yang mengirim WA; unverify→verify ulang TIDAK mengirim (keputusan user
    6 Okt 2026). Backfill saat migrasi menandai semua baris `verified` sebagai `wa_sent=1`
    — jangan pernah me-reset kolom ini.
  - Kas/Laba Rugi mengambil donasi dari `donations WHERE status='verified'`, jadi unverify
    otomatis menurunkan angka kas tanpa baris jurnal tambahan.
  - **Fix pre-existing 401 (perlu kamu tahu):** `GET /api/donations` publik sempat balas
    401 karena chi `Mount("/donations", ...)` (grup bendahara, kini `main.go:417`) menulis
    handler mALL di node PERSIS "/donations" — rute publik `/donations` yang didaftarkan
    SEBELUM mount jadi tertimpa. Solusi: rute publik (`/donations`, `/donations/campaigns`,
    `/donations/stats`) didaftarkan DI BAWAH mount, di level router `/api`, setelah semua
    grup ber-auth ditutup (`main.go:548-550`); `/campaigns` & `/stats` adalah leaf statis
    sehingga tetap menang atas wildcard `/donations/*` mount.**Aturan: rute publik yang
    path awalnya bertabrakan dengan mount Wajib didaftarkan SETELAH mount.**
- **Jilid 82 — Notifikasi sistem (lonceng admin):**
  - Broadcast untuk SEMUA role admin: `/api/snotif` di belakang `RequireRole("superadmin","bendahara","panitia_psb","admin","pimpinan","wali_kelas","guru","ustadz")`. Tabel `sys_notifications` + `sys_notification_reads` (read per-user). API: `GET /api/snotif` (50 terbaru + `unread_count`), `GET /api/snotif/unread`, `POST /api/snotif/read/{id}`, `POST /api/snotif/read-all`.
  - Menambah event notifikasi baru = panggil `sysnotif.Emit(ctx, database.DB, type, title, message, link)` di titik event handler. **WAJIB import dari `internal/platform/sysnotif`** (leaf) — JANGAN dari `internal/features/sysnotif` supaya tidak import-cycle dengan `auth`. `link` harus path admin (`/admin/...`). Gagal emit = `logger.Warn` saja.
  - Emit yang sudah terpasang: `messages.Create` (pesan_kontak), `donations.CreateDonation` (donasi), `auth.Register` (user_baru), `psb.SaveMine` (psb_pendaftar, hanya saat registrasi BARU via pre-check `FindByUserID`+`sql.ErrNoRows`), `psb.SaveMyPayment` + `spp.SubmitProof` + `iuran.SubmitProof` (pembayaran).
- **Jilid 83 — Perluas event notifikasi (7 Okt 2026, LIVE):**
  - Emit baru: `donations.VerifyDonation` (`donasi`, "Donasi terverifikasi", link `/admin/donations`), `invoices.Webhook` (`pembayaran`, "Pembayaran invoice masuk", link `/admin/psb`, hanya saat `status=="paid"` && `!res.Replay`), `autobilling.RunOnce` (`tagihan`, "Tagihan SPP otomatis dibuat", link `/admin/spp`, hanya saat `created>0`). Frontend `NotificationBell.tsx` + icon `tagihan: '🧾'` di `TYPE_ICON`.
  - Catatan: `INVOICE_WEBHOOK_SECRET` belum ada di env prod (provider masih ditentukan, `docs/PLANNING_INSTALL_PPDB.md` Fase 2) → emit invoice tidak aktif sampai webhook dikonfigurasi. `spp_auto_enabled=false` di prod → emit autobilling juga tidak aktif sampai admin menyalakannya. Keduanya aman (akan otomatis nyala saat dikonfigurasi/diaktifkan).
  - **Fix rute publik `/contact` (bug lama):** group Panitia PSB me-`Mount("/contact", messages.Routes())` (menimpa handler mALL), sehingga `POST /api/contact` publik yang didaftarkan SEBELUM mount balas 401/403. Solusi sama seperti `/donations`: rute publik didaftarkan SETELAH mount, di level router `/api` (dekat rute publik donasi). Mount tetap melayani `GET/{id}/PATCH/DELETE` pesan oleh panitia.
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
  - ~~Image frontend terkunci: `fix-psb-current` (= `fix-psb-upload-nopicker`)~~
    **SUDAH DIHAPUS 5 Okt 2026** (bersih-bersih storage, lihat §4 RINGKASAN).
    Jangan menulis rujukan image itu lagi. Yang benar sekarang:
    **frontend live = `j80-laba-rugi`**,
    dan memuat kode tanpa picker. Kalau perlu image lama, build ulang dari
    `git log` — bukan `docker pull`.
  - Verifikasi (29 Sep 2026): `/portal/program` tanpa Program Unggulan, upload dokumen tetap
    201/200 end-to-end.
## 5. Riwayat perubahan penting sesi ini (Sep 2026)

- NIK 409 verified; edit-lock 403 verified.
- Paket baru: `features/otp`, `features/invoices`; tabel `otp_codes`, `invoices`.
- Template WA ber-link dashboard (`/portal/payment-spp`, `/portal/payment`).
- `KwitansiModal` baru (logo Navbar, print A4, unduh PDF `Kwitansi-{kode}.pdf`).
- Settings admin: tab "No. Rekening" (Donasi/PSB/SPP); key dummy bertanda `(DUMMY)` — ganti via UI.
