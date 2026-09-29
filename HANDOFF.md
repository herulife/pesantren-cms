# HANDOFF.md — serah terima & daftar kerja terbuka (28 Sep 2026)

Dokumen ini untuk **AI agent penerus** yang lanjut mengerjakan repo ini. Tujuannya: tidak mengulang
pekerjaan yang sudah selesai, dan bisa langsung eksekusi pekerjaan yang masih terbuka.

> Baca juga: `AGENTS.md` (aturan), `RINGKASAN.md` (§2 status live, §4 riwayat, §5 TODO), `SUMMARY_SESI.md`.
> Kalau ada konflik, **live reality menang** — `AGENTS.md` §1/§4 masih menyebut image lama (`nikfix`, `wizard`)
> dan nama container `alma-parung-frontend` yang sudah tidak dipakai. Copy yang benar ada di bawah.

---

## 1. Kenapa file ini ada

Sesi 28 Sep 2026 menutup 2 pekerjaan (tutorial eRapor + pembersihan storage) dan menyisakan 6 pekerjaan
yang **tidak bisa diselesaikan tanpa keputusan/aksi user**. Semua dicatat di `RINGKASAN.md` §5, tapi item
di situ terlalu singkat untuk langsung dieksekusi. File ini berisi detail eksekusinya.

---

## 2. Live reality (verifikasi ulang sebelum deploy apa pun)

| Layanan | Container | Image | Port | Restart | Catatan |
|---|---|---|---|---|---|
| Frontend | `alma-parung-frontend-bobot` | `alma-parung-frontend:disiplinfix` | healthy |
| Backend | `alma-parung-backend` | `alma-parung-backend:disiplinfix` | healthy |
| Store | `alma-store` | `latest` | — | — | terpisah, jangan sentuh |
| Clinic OS | `clinic-os-{postgres,redis,mailpit,minio}-1` | — | — | — | proyek lain, jangan sentuh |

Rollback tersedia: container `alma-parung-backend-rollback-135939` (backend `jilid43`) & `alma-parung-frontend-bobot-rollback-135947` (frontend `jilid45`); tag lama frontend `jilid44`+`bobot`+`kkm`+`skala`+`jilid53`+`jilid54`, backend `bobot`+`kkm`+`roleB2`+`skala`+`jilid51`+`jilid48`.

Command recreate frontend (pola yang dipakai 28 Sep, berhasil):

```bash
docker stop alma-parung-frontend-bobot && docker rm alma-parung-frontend-bobot \
  && docker run -d --name alma-parung-frontend-bobot --restart unless-stopped \
     -p 3002:3000 alma-parung-frontend:<TAG>
```

Pola verifikasi cepat (tidak menyentuh produksi): build image → `docker run -d --name <prefix>test -p 3005:3000 <TAG>` → uji DOM → baru recreate container produksi. Rewrite `/api` di `next.config.ts` mengarah ke `https://almaparung.com`, jadi API tetap hidup tanpa konfigurasi tambahan. **Jangan pakai port 3003/3004** — dipakai container uji agen lain (`j47test`, `j44cmp`).

---

## 3. Sudah selesai — jangan diulang

1. **Bobot nilai per mapel + kolom UH** (image `bobot`, backend+frontend). Default `UTS 25 / UAS 30 / Tugas 25 / UH 20`.
   `subject_grade_weights` ada tapi **kosong** di DB prod → semua mapel pakai default.
2. **Jilid 43** — RBAC: `GET /api/school/classes` + `/years` dibuka ke `wali_kelas` & `pimpinan` (dulu 403 → dropdown Kelas kosong). Image backend `jilid43`.
3. **Jilid 44** — field **Kelas** & **Status** di `/admin/kesantrian/form` diganti dropdown kustom (`SelectField`), bukan `<select>` native. Image frontend `jilid44`.
4. **Jilid 45** — tutorial `/admin/help` seksi *Nilai & Raport (eRapor)* lengkap (glosarium, contoh hitung, tabel grade, FAQ, 10 `visualSteps`). Image frontend `jilid45` (alias `tutorial`).
5. **Pembersihan storage 28 Sep** — disk 89% → 47% (105G → 55G terpakai). Cache layer Docker ikut habis, jadi **build berikutnya lebih lambat** (tidak bisa reuse layer lama).

Semua terverifikasi: `tsc --noEmit --incremental false` 0 error, `docker build` sukses, 17/17 uji DOM di container uji **dan** 17/17 di `https://almaparung.com` (0 console error, 0 HTTP 4xx/5xx).

6. **Jilid 55 (28 Sep)** — **Tagihan Otomatis SPP** di `/admin/payments`: dua bug yang menumpuk.
   (a) `getSppAutoConfig()` mengembalikan envelope tapi `SppBills.tsx` menyuapkannya langsung ke
   `setAutoCfg` → UI selalu "Nonaktif" + Simpan gagal **"Payload permintaan tidak valid"**
   (backend pakai `DisallowUnknownFields`). (b) `min="1" step="1000"` → `stepMismatch` memblokir
   submit di browser. **Penting:** `getSppAutoConfig()` punya 2 consumer berbeda ekspektasi —
   `admin-bs/tagihan-spp` sudah benar, jadi jangan diubah jadi `return .data`; perbaiki
   consumer-nya. `parseResponse()` return `any` sehingga `tsc` tak pernah menangkapnya.
   (c) P2: `GET /api/settings` 465 KB → **45,8 KB** dengan memangkas `website_builder_revisions`
   (91% payload, 0 consumer) + endpoint baru `GET /api/settings/revisions` (data tetap utuh).
   Image `alma-parung-backend:sppautofix` + `alma-parung-frontend:sppautofix` (live). Rollback:
   image `disiplinfix`. Detail + cara verifikasi: `RINGKASAN.md` §4 "Jilid 55".
   **Jebakan build:** Turbopack Next 16 bisa gagal *flaky* dengan
   `next/font/google queries have exactly one entry` (layout.tsx import Inter+Outfit) —
   bukan regresi, **retry build** dan berhasil. `go` perlu `export PATH=$PATH:/usr/local/go/bin`.

7. **Jilid 56 (28 Sep)** — **bug kolom "Kontak" kosong** di `/admin/disciplines`:
   query ambil nomor wali dari tabel `registrations` yang **0 baris** (data sudah di
   `santri`), jadi `COALESCE` menyembunyikannya jadi `''` dan tombol WA nonaktif.
   Diperbaiki ke `santri.parent_phone` + fallback `father_phone`/`mother_phone`.
   Isolated di `disciplines` saja; fitur lain sudah benar. Image `disc-fix` (backend).
   Detail: `RINGKASAN.md` §4 "Jilid 56".

---

## 4. Pekerjaan terbuka (urutan prioritas)

### A. [BLOCKED - butuh user] Akun `wali_kelas` & `pimpinan` (Jilid C)

- **Konteks**: RBAC sudah live (jilid43) tapi belum ada akun dengan role itu, jadi belum pernah diuji sungguhan.
  Bug RBAC kelas hanya terlihat setelah role dibuat.
- **Butuh dari user**: daftar nama + email + peran (belum ada — jangan mengarang).
- **Setelah dapat**: buat user dengan role persis tersebut, lalu uji `/admin/kesantrian/form` dan endpoint
  `/api/school/classes`, `/api/school/years` memakai JWT dengan `role` + `token_version` yang **sama dengan DB**
  (`validateSession` menolak kalau beda).
- **Peringatan**: jangan buat akun uji di DB **produksi**. Salin DB dulu, ubah di salinan.
- **Verifikasi**: login nyata di browser pada dua role, pastikan dropdown Kelas terisi dan bukan 403/empty.
- Lihat `docs/RBAC_MATRIX.md`.

### B. [BUTUH KEPUTUSAN USER] Nilai lama vs bobot UH

- **Masalah**: bobot default sudah memakai UH 20%, tapi banyak nilai lama kolom UH-nya kosong (dianggap 0).
  Kalau nilai lama diedit ulang, nilai akhirnya turun drastis — user sempat mengeluh ini.
- **Yang sudah diverifikasi**: `weight.ValidateGradeWeights` **menolak bobot 0** dan total ≠ 100.
  Jadi opsi "set bobot UH = 0" **tidak bisa dipakai** (dokumentasi tutorial sudah dikoreksi agar tidak menyarankan itu).
- **Opsi yang tersedia**:
  1. Isi kolom UH untuk nilai yang sudah ada (backfill) — perlu keputusan nilai apa yang dipakai.
  2. Redistribusi bobot per mapel supaya tetap 4 komponen > 0, mis. `30/30/20/20`.
  3. Ubah backend agar bobot 0 boleh **hanya** untuk komponen yang tidak dipakai — perubahan kontrak, perlu
     dipikirkan efeknya ke CBT/PDF.
- **File kunci**: `apps/backend/internal/platform/weight/engine.go` (`ValidateGradeWeights`, `CalculateGradeFinal`,
  `GradeLetter100`), `apps/backend/internal/features/academics/repository.go`,
  `apps/frontend/src/app/admin/academics/page.tsx` (tab Mata Pelajaran + KKM).
- **Verifikasi**: `GET/PUT /api/academics/grade-weights` (butuh auth), lalu cek tabel `grades` tidak berubah
  hanya karena bobot diubah.

### C. [BARU] Endpoint "hitung ulang nilai"

- Belum ada. Kalau user minta, endpoint ini berguna untuk item B opsi 1/2 supaya tidak dikerjakan manual.
- Saran: endpoint baru di feature `academics`, superadmin-only, iterasi `grades` dan tulis ulang
  `nilai_akhir` + `grade` memakai bobot terkini.
- Wajib: backup DB sebelum, dan jangan jalankan tanpa konfirmasi user (menulis data produksi).

### D. [BUTUH USER] Cek Android/Chrome untuk jilid 44

- Minta user membuka `/admin/kesantrian/form` di Android/Chrome, memastikan dropdown **Kelas** & **Status**
  tidak lagi "terbuka lalu langsung nutup".
- Kalau `<select>` native di halaman lain (mis. `/admin/school`, `/admin-bs`) bermasalah juga, pola `SelectField`
  di `apps/frontend/src/app/admin/kesantrian/form/page.tsx` bisa dipakai ulang.

### E. [KEAMANAN] Credential

- **[28 Sep] Audit + redaksi 3 kebocoran nyata SELESAI**: API key DAHL di `RINGKASAN.md` -> `"$DAHLKEY"`; password SSH server lain di `ssh_logs.py` -> env `SSH_PASS` + `getpass` (dikirim via stdin ke `sudo -S`); `JWT_SECRET` contoh di `docs/deploy-alma-vercel-vps.md` -> placeholder. Sisa temuan sudah diverifikasi false positive.
- Password SSH `heru` masih yang lama — sudah masuk TODO rotasi, **tidak boleh diganti tanpa izin user**.
- `/tmp/pgl/inspect10.js` berisi `JWT_SECRET` hardcode (file agen lain, **jangan dihapus tanpa izin**).
  Kalau bisa, sarankan rotasi `JWT_SECRET` (efek: semua sesi invalid, harus deploy ulang container backend
  dengan env baru).
- `/tmp/oshot`, `/tmp/opencode-ap`, dan skrip `.sh` yang pernah berisi password sudah dihapus 28 Sep.

### F. [SELESAI 28 Sep] `tsconfig.tsbuildinfo` dimiliki root

- `apps/frontend/tsconfig.tsbuildinfo` dimiliki root → `tsc` selalu gagal `TS5033` untuk user `heru`.
- Solusi: owner repo `chown heru` file itu, atau nonaktifkan `incremental` di `apps/frontend/tsconfig.json`.
- **SUDAH DIPERBAIKI**: 24.080 file root-owned di-`chown heru:heru` -> sisa 0; `tsc --noEmit` jalan normal.
  JANGAN `sudo` build Go (cache jadi root-owned). Untuk `tsc` sebagai user `alma` masih perlu
  `--incremental false` atau `su heru`, karena file tsbuildinfo milik `heru`.

### G. [SELESAI 28 Sep] `CATATAN-JILID42.md` usang

- Isinya tidak mencakup pekerjaan bobot / jilid43 / jilid44 / jilid45. Entah diupdate atau ditandai usang
  supaya agen lain tidak mencari detail yang tidak ada. Detail lengkap ada di `RINGKASAN.md` §4.

### H. [OPSIONAL] Storage — kandidat belum dihapus (28 Sep, atas izin user berhenti)

Semua **regenerable**, tapi ditahan untuk keputusan karena dipakai agen lain:

| Kandidat | Ukuran | Catatan |
|---|---|---|
| Cache Go: repo `.gocache` 1.5G, `.gomodcache` 1.3G, `~/.cache/go-build` 428M, `~/.gocache` 255M, `~/go/pkg` 1.3G, `/tmp/gocache-heru` 306M | 5.1G | build berikutnya jauh lebih lambat |
| 38 tag image lama (19 frontend 1.34G, 19 backend 86M) | docker: 13.75GB reclaimable | aturan: jangan hapus tag/image agen lain |
| 11 container exited | 3.2G | sebagian memang container rollback yang disengaja |
| `mcr.microsoft.com/playwright:v1.49.0-jammy` (22 bulan, tak dipakai) | 3.32G | bisa di-pull ulang |
| `/home/heru/.npm` | 792M | cache npm agen lain |
| `/tmp/j28` | 775M | **aturan RINGKASAN: jangan hapus** |
| 9x `data/alma-parung.db.bak-*` | 10M | cadangan rollback |

Disk saat ini 47% (63G bebas) — tidak mendesak.

---

## 5. Pelajaran teknis (sudah ternoda, jangan diulang)

- `sudo -S` **tanpa** `-p ''` mencetak prompt tanpa newline → `console.log`/echo pertama ikut menempel di baris
  prompt lalu ikut hilang kalau di-filter `grep -v '^\[sudo'`. Gejalanya: "baris output pertama mysteriously hilang".
  Pakai `sudo -S -p ''`.
- `pgrep -f "<cmd>"` lewat ssh = **self-match** → polling nyangkut & broken pipe. Pakai `nohup ... &` + file
  penanda `.done`, lalu poll existence-nya.
- Tool `bash` merusak `$()`/backtick di dalam perintah remote → tulis **file script** lalu `scp`, jangan inline.
- Build lambat: backend ~10 mnt, frontend ~11-15 mnt, konteks ~2,2 GB. Selalu `nohup` + polling, jangan blokir 1 call.
- `docker builder du` tidak ada di legacy builder; pesan "Install the buildx component" cuma warning, bukan error.
- Aset di `frontend/public/` **terbuka tanpa auth** (middleware cuma redirect path `/admin` & `/portal`).
  Screenshot/data produksi di `public/` harus (1) disamarkan di DOM sebelum `screenshot()`, (2) digate di
  `apps/frontend/src/middleware.ts`. Sudah dilakukan untuk `/assets/tutorials` (jlid45) — pola ini wajib diulang
  kalau menambah screenshot tutorial.
- `<img loading="lazy">` di bawah fold: `naturalWidth` = 0 saat dicek → false "gambar rusak". Paksa scroll sampai
  bawah + tunggu dulu; `HTTP 4xx/5xx = 0` bukti paling andal.
- Auto-commit: ada watcher yang **otomatis commit** perubahan di repo ini (`docs/AUTOCOMMIT.md`), jadi working
  tree bisa bersih padahal kamu tidak commit. Tenang, itu normal.
- File `.bak-*` di repo = tanda agen lain sedang kerja. Jangan dihapus.
- DB prod SQLite mode WAL (ada `-wal`/`-shm`); salin konsisten pakai `python3` `src.backup(dst)`, bukan `cp`.
- `psql` tidak ada untuk DB alma-parung (itu SQLite). Container `postgres:16-alpine` milik **clinic-os**, jangan
  dipakai untuk alma-parung.
- Smoke test API harus dari dalam VPS (`http://127.0.0.1:8090`), dari runner akan `000`.
- Cookie auth `alma_token` ada flag `Secure` → tidak terkirim via HTTP polos; untuk smoke/curl pakai
  `Authorization: Bearer <token>`.

### Resep uji DOM (dipakai & berhasil 28 Sep)

- Binary chromium: `/home/heru/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell`
- Wajib `LD_LIBRARY_PATH=/tmp/chromelibs/usr/lib/x86_64-linux-gnu` ( jangan hapus `/tmp/chromelibs`).
- Injeksi login: bikin cookie `alma_token` = JWT HS256 buatan sendiri, claims `{id,email,role,token_version,iat,jti,exp}`.
  Ambil `JWT_SECRET` via `docker inspect alma-parung-backend` **tanpa** mencetaknya.
- Contoh skrip pernah ada di `/tmp/oshot/` (dihapus setelah dipakai) dan `/tmp/pgl/` (agen lain).

---

## 6. Kalau Mau Mulai

1. `cd /home/heru/alma-parung && git status && git log --oneline -5` — pastikan bersih & tahu HEAD.
2. Baca `RINGKASAN.md` §2 (live) dan §4 (riwayat) — jangan mengulang yang sudah live.
3. Pilih satu item dari §4 di atas. Untuk item B/C/H, **tanyakan dulu ke user** sebelum mengubah data produksi
   atau menghapus image/container/tag.
4. Kalau perlu backend: build + recreate **dengan** env dari container yang sedang jalan
   (`--env-file` dari `docker inspect`, `TAGIHAN_OPMODE.md`), port wajib `8090:8080`.
5. Kalau perlu frontend: `npx tsc --noEmit --incremental false` → `docker build -f apps/frontend/Dockerfile .` →
   container uji port 3005 → uji DOM → baru recreate produksi.
6. Setelah selesai: update `RINGKASAN.md` §4 (riwayat) + §5 (TODO) dan hapus item yang sudah beres dari §4 file ini.
