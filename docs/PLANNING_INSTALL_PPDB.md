# PLANNING PEMASANGAN PSB ALMA PARUNG (SMP/SMK) — mengikuti alur PPDB

Dokumen ini adalah rencana pemasangan/lanjutan aplikasi PSB `alma-parung`
(Next.js 16 + Go chi + SQLite) di VPS prod, dengan alur yang mengacu pada
proyek PPDB open-source yang sudah diteliti. Dibuat 2026-09-20.

Status kode saat dokumen ini dibuat: repo berisi fitur `jenjang` (SMP/SMK),
`category` (reguler/yatim/dhuafa), kuota per jenjang, auto-accept santri,
paket `otp` dan `invoices` — SEMUANYA BELUM TER-DEPLOY (uncommitted, image
live `psbcat` 06:44 dibangun sebelum kode 07:16+). 6 kondisi test `psb` gagal.

---

## 1. Hasil riset PPDB open-source (referensi)

### 1.1 PMBM MTsN 1 Pandeglang — `ZEDLABS-TEKNOLOGI-INDONESIA/ppdb` (acuan utama)
Stack: Laravel 12, Filament v3.3, MariaDB 11, Redis 8, Octane+FrankenPHP,
Sanctum+Spatie, DomPDF, WhatsApp Gateway.

Alur lengkap (urutan resmi):
```
Registrasi → Verifikasi OTP (WA, TTL 5m, cooldown 60s)
→ Isi Formulir → Upload Berkas (10KB–1MB)
→ Verifikasi Panitia → Cetak Formulir → Kartu Tes
→ Tes Akademik & Praktik → Pengumuman → Daftar Ulang
```

Fitur penting yang relevan untuk Alma:
- **Multi-jalur**: Prestasi, Reguler, Afirmasi, Zonasi, Mutasi.
- **Isolasi data per tahun pendaftaran** via Global Scope (admin lintas tahun
  hanya dengan `withoutGlobalScopes`), buka/tutup otomatis dari tanggal.
- **Nomor pendaftaran** `PMBM-{TAHUN}-{6 digit}` dengan `lockForUpdate()`
  (anti race condition) — adalah dasar untuk format NIS/No.PSBM Alma.
- **Enkripsi field sensitif** (nik, kk, semua telepon) via cast encrypted.
- **Tes seleksi**: input nilai akademik & praktik, total berbobot.
- **PDF**: formulir pendaftaran, kartu tes, SKL/pengumuman, daftar ulang.
- **Export/Import bulk** calon siswa via Excel/CSV.
- **RBAC 5 role**: super_admin, admin, verifikator, panitia, calon_siswa.
- **Notifikasi WA otomatis** tiap milestone, delayed 5–30 detik (anti rate-limit).

### 1.2 RoataP — `smantriplw/roatap-ppdb` (SMAN 3 Palu)
Laravel. Fitur yang relevan:
- Konfigurasi tanggal buka/tutup PPDB.
- **Anti double-data** pendaftar (satu siswa hanya boleh daftar sekali).
- **Pendataan ulang data periodik** setelah lulus seleksi.

### 1.3 `nafbeckh/ppdb`
Laravel + **Midtrans** payment, webhook `/api/midtrans-callback` + idempotency
melalui ngrok saat dev. Memberi contoh pola webhook invoice yang bisa
ditiru untuk paket `invoices` Alma.

### 1.4 Lainnya
- `ClaraMarsya057/web-ppdb-sekolah` — Laravel sederhana, tidak banyak nilai
  tambah.

---

## 2. Pemetaan alur PPDB → PSB Alma Parung (sudah ada vs perlu ditambah)

| # | Tahap PPDB | Kondisi di Alma Parung | Catatan |
|---|-----------|------------------------|---------|
| 1 | Registrasi akun | ✅ Ada | `/api/register`, JWT HttpOnly cookie |
| 2 | Verifikasi OTP | 🟡 Scaffold ada | Paket `otp/` baru; kanal (WA/email) belum diputuskan |
| 3 | Isi formulir/biodata | 🟡 Ada + jenjang | `PUT /api/psb/me`; `jenjang` SMP/SMK + kelas otomatis VII/X |
| 4 | Upload berkas | 🟡 Ada + kategori | KK/ijazah/pasfoto + yatim_doc/sktm_doc untuk kategori |
| 5 | Verifikasi panitia | ✅ Ada | status machine pending→review→tes→accepted |
| 6 | Cetak formulir | ❌ Belum | butuh PDF |
| 7 | Kartu tes / jadwal tes | 🟡 Kolom ada | `test_date`,`test_location`,`test_score` ada, UI belum |
| 8 | Tes akademik/praktik | ❌ Belum | input nilai + bobot mengikuti PMBM |
| 9 | Pengumuman | ✅ Ada | `GET /api/psb/pengumuman`; perlu filter jenjang |
| 10 | Daftar ulang | 🟡 Ada | status `re_registration` + deadline; **auto-accept → santri** sudah |
| 11 | Isolasi per tahun | ❌ Belum | Alma pakai NIK unik per periode di layer repo |
| 12 | Anti double-data | ✅ Ada | `ErrDuplicateNIK` (NIK + user) |
| 13 | Payment gateway | 🟡 Scaffold ada | Paket `invoices/` + receipt; provider belum aktif |
| 14 | RBAC panitia | 🟡 Role ada | `panitia_psb`, `bendahara`, `superadmin` |
| 15 | Notifikasi WA/telegram | 🟡 Ada dasar | whatsapp sender + telegram; notif milestone belum |
| 16 | Export/import Excel | ❌ Belum | opsional |
| 17 | Enkripsi field sensitif | ❌ Belum | opsional, rekomendasi |

---

## 3. PRASYARAT — fix kode yang HANYA ada 2 INSERT kurang placeholder

Verifikasi `go test ./internal/features/psb/...` di VPS (via image golang)
menemukan akar masalah pada 6 kondisi gagal (13 assertion):

1. **`repository.go` INSERT `registrations`** (baris ~418):
   Kolom = 21, VALUES hanya 19 placeholder + `'pending'` = 20 nilai
   → error `20 values for 21 columns`.
   **Fix**: tambah 1 placeholder `?` → 20 placeholder + `'pending'`.
2. **`repository.go` INSERT `santri`** (baris ~948):
   Kolom = 23, VALUES = 19 placeholder + `'aktif'` + 2×CURRENT_TIMESTAMP
   = 22 nilai → error `22 values for 23 columns`.
   **Fix**: tambah 1 placeholder `?` → 20 placeholder.
   (Efek: `TestAutoAcceptOnAcceptedPaid` santri=0, `TestAutoAcceptDuplicateGuard`,
   `TestYatimQuotaFull`, `TestCategoryProgramValidation`,
   `TestAcceptRequiresYatimDoc`.)
3. **`gender_validation_test.go`**: test lama tidak mengirim `jenjang`;
   validator kini WAJIB jenjang SMP/SMK. **Fix**: update test — tambahkan
   `Jenjang: "smp"` pada request (dan tambah kasus jenjang invalid).

Prioritas: Fase 0 di bawah tanpa bypass; semua harus `go test` hijau.

---

## 4. Rencana pemasangan bertahap (di VPS, protokol deploy §6)

### Fase 0 — Fix test + deploy fitur yang sudah ditulis
1. Perbaiki 2 INSERT di `apps/backend/internal/features/psb/repository.go`.
2. Update `gender_validation_test.go` (jenjang pada request uji).
3. Jalankan `go test ./internal/features/psb/...` sampai HIJAU.
4. Buat + jalankan skrip backfill DB prod:
   - `ALTER TABLE registrations ADD COLUMN jenjang TEXT DEFAULT ''` dst.
   - Isi `jenjang` default untuk data lama (mis. `smp`), default kategori
     `reguler`, default kuota `psb_quota_smp`/`psb_quota_smk` bila belum ada.
   - Backup DB dulu (`backups/`).
5. Build image backend `alma-parung-backend:psbcat` (tag tetap) + frontend
   `alma-parung-frontend:psbcat`, recreate container, smoke di VPS
   (127.0.0.1:8090 → /api/ready + jalur PSB lengkap + jenjang terbaca).
6. Commit hanya jika diminta user.

### Fase 1 — Alur tes + pengumuman + daftar ulang (mengikuti PMBM §1.1)
- UI admin input nilai tes (`test_score`, lokasi/waktu dari `test_date`/`test_location`),
  format bobot akademik+praktik.
- Halaman pengumuman per jenjang + halaman santri hasil (daftar ulang & deadline).
- Kartu tes & formulir (PDF awal → `gofpdf`/`pdf` package Go).

### Fase 2 — OTP + notifikasi + invoice (aktifkan bertahap)
- Pilih kanal OTP (WA existing Fonnte? / Telegram / email) — butuh keputusan user.
- Aktifkan webhook invoice provider-agnostik (paket `invoices/`) + idempotency
  (unique gateway_tx_id) seperti patokan `nafbeckh/ppdb` §1.3.
- Notifikasi WA tiap milestone dengan delay acak 5–30s (mengikuti PMBM).
- Verifikasi `INVOICE_WEBHOOK_SECRET` di env container (jangan pernah print).

### Fase 3 — Opsional mengikuti best-practice PPDB
- Isolasi per tahun pendaftaran aktif (global scope analog) + nomor
  `PSBM-{TAHUN}-{6digit}` dgn lockForUpdate.
- Enkripsi NIK/telepon (cast setara `encrypted` Laravel).
- Export/import calon siswa Excel/CSV.
- Pendataan ulang periodik pasca-lulus (RoataP §1.2).

---

## 5. Keputusan yang dibutuhkan user (blocker sebelum Fase 1-2)
1. Kanal verifikasi OTP: WhatsApp (Fonnte existing) / WhatsApp BAP / SMS / email?
2. Provider payment: Midtrans / Xendit / QRIS statis? (webhook + idempotency).
3. Apakah butuh isolasi per tahun pendaftaran (ada periode bertahun-tahun)?
4. Prioritas berikutnya setelah `go test` hijau: tes/Pengumuman (F1) atau OTP (F2)?

---

## 6. Protokol deploy (harus dari VPS, bukan runner sandbox)
```bash
cd ~/alma-parung
# backup DB dulu
cp data/alma-parung.db backups/alma-parung.db.$(date +%Y%m%d_%H%M%S)
docker build -t alma-parung-backend:psbcat -f apps/backend/Dockerfile .
docker build -t alma-parung-frontend:psbcat -f apps/frontend/Dockerfile .
# recreate container memakai --env-file yang SAMA dgn sekarang
docker rm -f alma-parung-backend alma-parung-frontend
docker run -d --name alma-parung-backend --restart always \
  --env-file <env_backend_yang_sama> \
  -v /home/heru/alma-parung/data:/data \
  -v /home/heru/alma-parung/data/uploads:/app/apps/backend/public/uploads \
  -p 8090:8080 alma-parung-backend:psbcat
# frontend analog, port 3002:3000
curl -s http://127.0.0.1:8090/api/ready   # 200
# smoke end-to-end DI DALAM VPS (python3), bukan dari runner.
```
Larangan: jangan print/commit JWT_SECRET/password/env. Jangan git commit
tanpa instruksi user.

---

## 7. Risiko & mitigasi
- **DB prod live**: selalu backup sebelum migrasi; backfill `jenjang` harus
  ditentukan datanya (tidak ada data jenjang lama → default, konfirmasi user
  untuk pengisian SMP/SMK lama).
- **Tes masih merah** → jangan deploy ke produksi sebelum hijau.
- **Auto-accept sudah aktif**: registrasi accepted+paid boleh langsung jadi
  santri (idempotent); pastikan kategori/kuota/usia sesuai.
- **NIS counter global** (bukan per-jenjang/per-tahun) — review jika 2 jenjang
  dipakai bersamaan agar tidak bentrok.