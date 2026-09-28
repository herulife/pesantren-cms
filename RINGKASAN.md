# RINGKASAN PROYEK ALMA-PARUNG — Handoff Antar Agen
> Terakhir diperbarui: 2026-09-28 (dropdown kustom Kelas+Status Kesantrian; RBAC `/school` read). Baca seluruh file ini SEBELUM menyentuh apa pun.

## 0. ATURAN WAJIB UNTUK AGEN PENERUS (baca dulu!)
1. **Jangan timpa kerja agen lain.** Cek file `.bak-*` dan `git status` sebelum edit. Ada beberapa agen aktif di repo yang sama.
2. **Skema kerja "jilid":** tulis patch `apply_jilidNN.py` → `scp` ke server → dry-run di `/tmp/jNN_test` → cocok → apply → `tsc` (frontend) → `docker build` → deploy ganti container → verifikasi.
3. **Jangan pernah re-run patch script yang sudah di-apply** (tidak idempoten — anchor hilang, bisa duplikat kode). Selalu `--dry` dulu.
4. **Backup dulu** untuk perubahan destruktif (DB: copy `data/alma-parung.db` + catat; kode: catat git HEAD).
5. **WAJIB MENCATAT**: setiap selesai kerja, tambahkan entri baru di bagian **## RIWAYAT** di bawah (format sudah ada) + update **## STATUS LIVE** bila berubah. Agen yang tidak mencatat = kerjanya dianggap tidak ada.
6. Jangan commit/push/pull tanpa perintah user. Jangan ubah `.env`, password, atau secret.
7. Verifikasi via eksekusi (curl ke `https://almaparung.com`, cek `docker logs`, baca DB), bukan asumsi.

## 1. AKSES SERVER
- SSH: `SSHPASS='H3ru@2026' sshpass -e ssh -p 2480 heru@103.107.206.5` (password SSH **belum dirotasi** — TODO lama)
- SCP: `SSHPASS='H3ru@2026' sshpass -e scp -P 2480 <lokal> heru@103.107.206.5:<remote>`
- Repo: `~/alma-parung` (git). DB live: `/home/heru/alma-parung/data/alma-parung.db` (sqlite; **tidak ada** binary `sqlite3`/`go` → pakai `python3`, build via docker).
- Backup terakhir: `~/alma-parung/backups/pre-role-20260926-211855.db` (titik restore sebelum perombakan peran).

## 2. STATUS LIVE
| Layanan | Container | Image | Keterangan |
|---|---|---|---|
| Backend | `alma-parung-backend` | `alma-parung-backend:jilid43` (`a5508e379eae`) | Dropdown Kelas Kesantrian untuk wali_kelas/pimpinan (RBAC `/school` read), healthy, image sebelumnya `bobot` (bobot nilai + UH) tetap ada untuk rollback, **WAJIB `-p 8090:8080`** (nginx proxy /api/ ke 8090) |
| Frontend | `alma-parung-frontend-bobot` | `alma-parung-frontend:jilid45` (`9d21ec2ed640`, alias `tutorial`) | Dropdown kustom field Kelas & Status form Kesantrian (popup `<select>` native bermasalah di Android/Chrome), **masih terisi** kartu bobot nilai + kolom UH, plus tutorial `/admin/help` seksi Nilai & Raport (eRapor) yang lengkap (glosarium, contoh hitung, tabel grade, FAQ, 9 screenshot), healthy, `-p 3002:3000`. Bonus jilid45: `src/middleware.ts` kini menolak akses anonim ke `/assets/tutorials/*` (307 ke `/login`) karena screenshot memakai data sistem. Image `jilid44` (`e603cd08a19e`) & `bobot` (`9854105e2313`) untuk rollback. **Nama container berubah** dari `alma-parung-frontend-kkm` (per 28 Sep); image `kkm` tetap ada untuk rollback. |
| Store | `alma-store` | `latest` | terpisah, jangan sentuh |
| Rollback tersedia | — | backend `bobot`+`kkm`+`roleB2`+`skala`+`jilid51`+`jilid48`; frontend `jilid44`+`bobot`+`kkm`+`skala`+`jilid54`+`jilid53` | — |
| DB | — | — | users 6, santri 1 (per 28 Sep; cek ulang) |

Deploy backend (catatan: JWT dari `.env`, DAHL key tetap):
```
cd ~/alma-parung && NEWJWT=$(grep "^JWT_SECRET=" .env|head -1|cut -d= -f2-) && docker stop alma-parung-backend && docker rm alma-parung-backend && docker run -d --name alma-parung-backend --restart always -p 8090:8080 -e DB_PATH=/data/alma-parung.db -e JWT_SECRET="$NEWJWT" -e API_PORT=8080 -e DAHL_API_KEY=dahl_LWJ8L7SpgoHbzHAB4j4DPtoc9s1jbebVn -e DAHL_API_URL=https://inference.dahl.global/v1 -v /home/heru/alma-parung/data:/data -v /home/heru/alma-parung/data/uploads:/app/apps/backend/public/uploads alma-parung-backend:<TAG>
```

## 2.1 CATATAN SINGKAT UNTUK AGEN PENERUS (state 28 Sep 2026)
**Tiga pekerjaan terakhir — semuanya sudah live, sudah diverifikasi, sudah penuh di §4:**
1. Bobot nilai per mapel + kolom UH → image `bobot` (backend & frontend).
2. **Jilid 43** — RBAC: `GET /api/school/classes` + `/years` dibuka ke `wali_kelas` & `pimpinan` (dulu 403 → dropdown **Kelas** kosong di form Kesantrian). Image backend `jilid43`.
3. **Jilid 44** — field **Kelas** & **Status** di `/admin/kesantrian/form` diganti dropdown kustom (`SelectField`), bukan `<select>` native. Image frontend `jilid44`.

**Yang perlu dipantau:**
- Tunggu konfirmasi user di Android/Chrome untuk jilid 44 (TODO 8).
- Akun `wali_kelas`/`pimpinan` belum ada (Jilid C masih terblokir awaiting user) → bug RBAC kelas hanya terlihat setelah role itu dibuat; uji role cukup lewat container uji.
- Bobot UH: nilai lama tidak dihitung ulang (TODO 5 & 6).

**Peringatan operasional:**
- Nama container frontend masih `alma-parung-frontend-bobot` (nama tidak ikut tag image `jilid44`). Script deploy lama di lokal (`/tmp/opencode/bobot/deploy_frontend.sh`) menunjuk `alma-parung-frontend-kkm` yang sudah dihapus → akan gagal. Pakai `/tmp/deploy_front44.sh` (server) atau tulis ulang:
  `docker stop alma-parung-frontend-bobot && docker rm alma-parung-frontend-bobot && docker run -d --name alma-parung-frontend-bobot --restart unless-stopped -p 3002:3000 alma-parung-frontend:<TAG>`
- Backend WAJIB tetap `-p 8090:8080` (nginx proxy `/api/`), frontend WAJIB `-p 3002:3000`. Jangan ubah nama container/port tanpa cek nginx.
- `/admin/*` butuh sesi; tanpa cookie balas 307 ke `/login` (bukan error).

**Pola verifikasi cepat (dipakai jilid 43/44, tidak menyentuh produksi):**
- Build image → container uji di port cadangan + salinan DB → uji → baru ganti container produksi. Backend: `docker run -d --name j43test -p 8099:8080 --env-file /tmp/env-alma-backend.txt -v /tmp/j43data:/data alma-parung-backend:<TAG>`. Frontend: `docker run -d --name j44test -p 3003:3000 alma-parung-frontend:<TAG>` (rewrite `/api` di `next.config.ts` otomatis mengarah ke `https://almaparung.com`, jadi API tetap hidup tanpa konfigurasi tambahan).
- Uji API per-role: JWT HS256 buatan sendiri, claims `{id,email,role,token_version,iat,jti,exp}`; `role` + `token_version` WAJIB sama dengan DB (`validateSession`) → untuk role tanpa akun, buat user uji di DB **salinan**, jangan di DB produksi.
- Uji UI/DOM: playwright-core + chromium headless di server — binary `/home/heru/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell`, wajib `LD_LIBRARY_PATH=/tmp/chromelibs/usr/lib/x86_64-linux-gnu`, contoh skrip di `/tmp/pgl/`. Login diinjeksi lewat cookie `alma_token`.

## 3. STRUKTUR PERAN (pekerjaan berjalan — baca ini!)
Keputusan user (final): `PIMPINAN (read-only) > ADMIN > WALI KELAS (kelasnya) / GURU (mapelnya) / USTADZ (tahfidz+kesantrian)`.
- **Jilid A (SELESAI, live):** backend + migrasi `users_role_check_v2`, `platform/scope`, guard nilai/rapor/kesantrian/tahfidz/project/exam/santri, grup route baru, CBT pindah ke grup guru. Uji 16/16 lolos. Dampak: `tim_media`/`bendahara` kini 403 di akademik.
- **Jilid B (SELESAI, live):** frontend per-role (roleMenus+guru picker+wali_user_id di school/kelas/mapel, tombol Kunci rapor disembunyikan utk pimpinan, default tab ustadz=kesantrian).
- **Jilid C (BELUM, butuh input user):** akun perdana + assignment. **BLOKIR: tunggu daftar nama+email+peran dari user.**
- File kunci: `platform/scope/scope.go`, migrasi di `platform/database/db.go`, guard di handler academics/raport/project/exams/santri. Detail lengkap: `CATATAN-JILID42.md` §25.

## 4. RIWAYAT (tambahkan entri baru di bawah, JANGAN hapus yang lama)
Format entri: `## Jilid NN — JUDUL (tanggal, status)` + apa diubah (file+fungsi) + cara verifikasi + dampak.
- Jilid 30–39: fondasi, donasi jujur, JWT, font/SRI/rate-limit (detail: CATATAN-JILID42.md §1–4).
- Jilid 40: AutoSPP 4 bug (WIB, per-santri, guard due-date, WA queue) — live.
- Jilid 41: santri manual auto-akun users + backfill — live.
- Jilid 42: CBT formula 30/40/30, normalisasi semester, AY aktif — live (image jilid42 gagal 1x: signature basi, sudah rebuild).
- Jilid 43: tombol Hapus Total santri (purge transaksional, superadmin) — live.
- Jilid 44: fix list 500 (COALESCE occupation) — live.
- Jilid 45: field jenjang end-to-end — live.
- Jilid 46: kelas jadi dropdown master — live.
- Jilid 47: satu santri satu akun + reset password — live.
- Jilid 48: nilai kosong=null, bobot dihapus, predikat KKM, input project — live.
- Jilid 49: hapus Program Unggulan di PSB — live.
- Jilid 50: status `santri` diakui portal — live.
- Jilid 51: upload PDF + tombol Lihat — live.
- Kop PDF + TTD (jilid52–54), mapel Hadis Arbain, bersih storage §23, hapus Putra/Putri kelas.
- Jilid A peran (backend, image roleB2): lihat §3 di atas.
- Jilid B peran (frontend, image roleB): roleMenus + guru picker + wali_user_id — lihat §3.
- Skala nilai seragam 0-100 (grade+CBT selaras, kesantrian tampil 0-100) — live backend+frontend `skala`.
- **KKM dinamis**: setting `academic_kkm` (default 75, disimpan di tabel settings), GET `/academics/kkm` (semua role akademik) + PUT (admin), grade-letter mapel (Create+Update) & CBT pakai `weight.GradeLetter100` berbasis KKM (pita: A≥KKM+15, B≥KKM+5, C=KKM, D=KKM-15), predikat rapor bawaan weight mengikuti KKM. Frontend: KKM card di tab Dashboard `/admin/academics` (edit admin [superadmin/admin], info pita untuk semua). Verifikasi API: KKM 84→D (kk 90), →B (kk 70), →B (kk 75); tsc lolos; DB integrity ok. Live image `kkm` (backend 7815d3fb1d59, frontend a3738ef614b1). CATATAN: nilai lama tak dihitung ulang (berlaku utk yg di-edit/dibuat setelahnya). File: `platform/weight/engine.go`, `academics/repository.go`+`handler.go`, `exams/repository.go`, `cmd/api/main.go` (loadKKMFromDB), `lib/api.ts`, `admin/academics/page.tsx`.

- **Bobot komponen nilai per mapel + kolom UH (28 Sep 2026, live, image `bobot`)**: nilai akhir mapel TIDAK lagi hardcode 30/40/30 — komponen jadi 4 (UTS, UAS, Tugas, **UH/Ulangan Harian**) dengan bobot per mapel. Default `UTS 25 / UAS 30 / Tugas 25 / UH 20` (`weight.DefaultGradeWeights`), disimpan di tabel baru `subject_grade_weights` (satu baris per `subject_id`, migration `subject_grade_weights_table`); kolom baru `grades.uh_score` (migration `grades_uh_score_column`, idempoten, backfill 0). API: `GET /api/academics/grade-weights` (semua role akademik) + `PUT` (hanya `superadmin`/`admin` via `weight.IsFullAccessRole`, tolak bobot yang bukan total 100). `CreateGrade`/`UpdateGrade`/CBT `FinishSession` semua lewat `weight.CalculateGradeFinal(uts,uas,task,uh,weights)`; `GetSubjectWeights` selalu fallback ke default bila tabel/baris belum ada (input guru tidak pernah gagal karena bobot belum diset) dan `UpsertSubjectWeights` satu transaksi. Frontend: kolom UH di form nilai (single/bulk create/bulk edit) + tabel nilai + ekspor PDF/Excel, kartu "Bobot Komponen Nilai per Mapel" di tab **Mapel** `/admin/academics` (input 4 bobot + indikator total, badge hijau/merah), kartu "Ulangan Harian" di `/portal/raport`. Verifikasi: `go build`/`go vet`/`go test weight`/`tsc --noEmit` lolos; `/api/ready` 200; `GET /api/academics/grade-weights` 401 tanpa token (rute hidup, bukan 404); migrasi terpasang di DB prod (`uh_score`+`subject_grade_weights` ada, `integrity_check` ok); asset frontend live memuat "Bobot Komponen Nilai per Mapel"/"Ulangan Harian"/"grade-weights". Backup DB sebelum deploy: `data/alma-parung.db.bak-bobot-20260928-005332`. **CATATAN PENTING**: bobot default BERUBAH dari 30/40/30 → 25/30/25/20, jadi nilai yang diisi ulang akan turun bila UH belum diisi (UH default 0). Nilai lama TIDAK dihitung ulang otomatis. File: `platform/weight/engine.go`, `platform/database/db.go`, `academics/repository.go`+`handler.go`, `academics/scoped.go`, `exams/repository.go`, `lib/api.ts`, `admin/academics/page.tsx`+`form/page.tsx`, `portal/raport/page.tsx`.
- **Dropdown "Kelas" form Kesantrian kosong untuk wali_kelas/pimpinan (28 Sep 2026, live, image `jilid43`)**: keluhan user 27 Sep ("dropdown di `/admin/kesantrian/form` field kelas dan field status bermasalah") ter-park tanpa fix; investigasi DOM headless waktu itu membuktikan sebagai superadmin semua select normal. Akar masalah: `getClasses(true)` → `GET /api/school/classes` hanya boleh `superadmin,bendahara,panitia_psb,admin` (grup `r.Mount("/school")`), sedangkan grup `/santri` mengizinkan `superadmin,panitia_psb,wali_kelas,pimpinan` → wali_kelas/pimpinan kena 403 → `classOptions` kosong → dropdown Kelas cuma berisi "-- Pilih Kelas --" dan wali kelas tidak bisa memilih kelas sama sekali. Fix: `cmd/api/main.go` — `/school` dipecah jadi `r.Route("/school")`: grup READ (`GET /classes` + `GET /years`) untuk `superadmin,bendahara,panitia_psb,admin,wali_kelas,pimpinan`, grup WRITE (mount penuh `schoolHandler.Routes()`) tetap 4 role awal. Verifikasi: 13/13 uji RBAC lolos di container uji (copy DB + user uji `wali_kelas`/`pimpinan`, port 8099, lalu dibuang) — read 200 untuk wali_kelas & pimpinan, 403 untuk `user` & `tim_media`, write 403 untuk wali_kelas & pimpinan, write superadmin tetap jalan (POST/PUT/DELETE classes + activate years bukan 405, jadi tidak tertimpa routing chi); `gofmt` bersih pada baris yang diubah; live: backend `jilid43` healthy, `/api/ready` 200, publik `/`+`/login`+`/api/ready` 200, `GET /api/school/classes?active_only=true` live → `['IX','VII','VIII','X','XI','XII']`. Backup DB: `data/alma-parung.db.bak-jilid43-20260928-020508`. **Dropdown Status BELUM ada fixnya**: kode frontend (`statusOptions` = aktif/lulus/pindah/cuti, `apps/frontend/src/app/admin/kesantrian/form/page.tsx:15`) identik dengan validasi backend `validStatus` (`internal/features/santri/handler.go:201`) dan data produksi hanya berisi `aktif` → tidak ada bug terverifikasi, perlu klarifikasi user.
- **Field Kelas & Status form Kesantrian: `<select>` native diganti dropdown kustom (28 Sep 2026, live, image frontend `jilid44`)**: laporan user (Android/Chrome): "dropdown di `/admin/kesantrian/form` field kelas dan field status, ketika diklik langsung nutup tidak menampilkan dropdown, tapi kalau di scrol bisa" — hanya Kelas & Status; Jenis Kelamin & Jenjang normal. Investigasi headless (Chromium 393x851 `hasTouch` + UA Android, instrumentation event): urutan event bersih (`pointerdown→touchstart/end→mousedown→focus→click`), tidak ada blur/re-render/mutasi/scroll yang menutup popup, hit-testing aman, tidak ada ancestor transform/filter, 4 select terisi benar, tanpa error console → penyebab ada di popup `<select>` native sisi Chromium Android, bukan logika React; app juga tidak punya komponen dropdown kustom reusable. Fix: komponen `SelectField` (button `role="combobox"` + `ul role="listbox"`, tutup saat klik luar/Escape, panah+Enter/Space untuk keyboard) dipakai untuk field **Kelas** dan **Status**; `<select>` native field lain (Jenis Kelamin, Jenjang) dibiarkan. Logika opsi Kelas dipertahankan persis (placeholder `-- Pilih Kelas --` + `classOptions` + opsi `__custom__` "X (saat ini)"), state & payload submit tidak berubah (`form.class`/`form.status`). Styling pakai `inputClass()` yang sama → terukur identik dengan select native (lebar 311px, padding 10/14, font 14px/500, border 1px + radius sama; beda 1px tinggi). Verifikasi: `tsc --noEmit --incremental false` 0 error; 17/17 uji DOM di container uji port 3003 (langsung dibuang) dan 17/17 ulang di domain publik `https://almaparung.com` — tap buka listbox (opsi Kelas 7, Status 4), pilih "VII"/"Cuti" masuk dan tidak reset, tutup setelah pilih, tutup klik luar & Escape, keyboard jalan, tanpa error console. Image frontend `jilid44` (`e603cd08a19e`); image `bobot` (`9854105e2313`) untuk rollback.

- **Tutorial `/admin/help` seksi Nilai & Raport (eRapor) (28 Sep 2026, live, image frontend `jilid45`)**: user minta tutorial di-in-app diperjelas, terutama soal bobot nilai per mapel. `apps/frontend/src/lib/adminDocs.ts` — interface `AdminDocSection` ditambah field opsional `glossary`, `examples`, `reference`, `faq` (semua opsional, 20 section lama tidak berubah); seksi `academics` ditulis ulang supaya ramah pemula: urutan "Atur bobot -> isi KKM -> input nilai -> presensi/tahfidz -> rekap -> cetak", 10 `visualSteps` (makai 9 screenshot `/assets/tutorials/acad-*.png`), 3 blok contoh hitungan (termasuk kasus "nilai lama turun setelah diedit" karena UH kosong), tabel referensi grade A-E untuk KKM 70/75/80, 8 FAQ, 12 tips. `apps/frontend/src/app/admin/help/page.tsx` — renderer baru untuk keempat field itu (glosarium setelah audience; contoh + tabel + FAQ setelah `visualSteps`) dan keempat field ikut masukkan ke `haystack` pencarian (cari "bobot"/"tahfidz" menemukan seksi). **Koreksi isi penting**: validasi `weight.ValidateGradeWeights` menolak bobot 0 maupun total != 100, jadi draft yang menyarankan "set bobot UH = 0" DIHAPUS dari 3 tempat; teks final advises "isi kolom UH, atau minta admin menyesuaikan bobot mapel ini". Verifikasi: `tsc --noEmit --incremental false` 0 error; `docker build` sukses; 17/17 uji DOM di container uji port 3005 (image `tutorial`, lalu dibuang) dan 17/17 ulang di `https://almaparung.com` (semua PASS, 0 console error, 0 HTTP 4xx/5xx) — termasuk 9/9 gambar termuat, tabel 5 baris, FAQ bisa dibuka, section `dashboard/psb/donations/settings/teachers` tidak rusak.

- **Screenshot tutorial disamarkan + diamankan (28 Sep 2026, live, ikut image `jilid45`)**: 9 screenshot sebelumnya diambil dari data produksi dan ada di `public/` — Next melayani `/assets/*` **tanpa auth**, jadi siapa pun bisa membukanya (dibuktikan `curl` anonim = 200 sebelum fix, produksi lama = 404 karena file belum ada). Dua lapis fix: (1) semua nama/email Santri diambil dari `GET /api/academics/students` lalu diganti `"Santri (disamarkan)"` + nomor HP/angka >=6 digit jadi `"nomor disamarkan"` **di DOM sebelum screenshot** (`/tmp/oshot/shot_redact.js`, 9/9 berhasil, 0 console error); (2) `src/middleware.ts` tambah guard `pathname.startsWith('/assets/tutorials') && !token` -> redirect `/login`, jadi aset baru 307 untuk anonim dan 200 untuk admin. Datenya sudah tidak bocor, tapi nilai yang tampil (80/85/90) tetap dari data asli.

- **Pembersihan storage (28 Sep 2026, tanpa deploy)**: disk `/` turun dari **89% ke 47%** (105G -> 55G terpakai, 63G bebas). Yang DIBERSIHKAN (semua cache/file yatim, tidak ada data): (1) `docker image prune -f` -> 95 image gantung (tanpa tag, sisa build lama) hilang, `/var/lib/containerd` 72G -> 31G, docker-reported reclaim 9.2GB; (2) 251 file `.so` yatim di `/tmp` (2.1G, jeweils 5.5MB, berasal dari exec yang gagal); (3) cache npm `/home/alma/.npm` 6.0G -> 12M dan `/root/.npm` 337M -> 76K; (4) `journalctl --vacuum-size=100M` 320M -> 66M; (5) `/tmp/go-build*` 24M + sisa kerja `/tmp/oshot`, `/tmp/opencode-ap` 18M. **Efek samping yang perlu tahu**: cache layer build Docker sudah habis, jadi build frontend/backend berikutnya akan lebih lambat (tidak bisa `--cache-from` layer lama). Yang SENGAJA TIDAK disentuh: cache Go (~5.1G: repo `.gocache` 1.5G, `.gomodcache` 1.3G, `~/.cache/go-build` 428M, `~/.gocache` 255M, `~/go/pkg` 1.3G, `/tmp/gocache-heru` 306M), `/home/heru/.npm` 792M, `/tmp/j28` 775M, 38 tag image lama + 11 container exited (3.2G, sebagian memang container rollback), `mcr.microsoft.com/playwright:v1.49.0-jammy` 3.32G, 9x `data/alma-parung.db.bak-*`, dan `/home/alma/{eraport-clone,vibe-coding-repos}`. User memutuskan berhenti di titik ini. Census `/tmp`: 1.096 entri basi (>3 hari) -> 1.4G tersisa, sebagian besar folder kerja `j*full` milik agen lain. Verifikasi setelah bersih: `alma-parung-frontend-bobot` (jilid45) & `alma-parung-backend` (jilid43) healthy, `/`=200, `/admin/help`=307, `/assets/tutorials/*`=307, `/api/academics/kkm`=401 (semua sesuai).

## 5. TODO AKTIF
1. [ ] Jilid C: akun perdana (tunggu daftar nama+email+peran dari user).
2. [ ] Rotasi password SSH `H3ru@2026`.
3. [ ] Update skor halaman `/audit`.
4. [ ] (Opsional) KKM dinamis utk tampilan CBT & PDF predikat ikut KKM (sudah selaras via weight; cek halaman ekslusif CBT).
5. [ ] (Baru) Isi UH untuk nilai yang sudah ada — kalau tidak, nilai lama turun saat di-edit ulang. **Catatan 28 Sep: opsi "set bobot UH = 0" TIDAK bisa dipakai** — `weight.ValidateGradeWeights` menolak bobot 0, jadi mapel tanpa ulangan harian perlu bobot redistributed (mis. 30/30/20/20) atau backend diubah agar bobot 0 boleh.
6. [ ] (Baru) Bobot yang tersimpan tidak memengaruhi `grades` yang sudah ada; perlu tombol/endpoint "hitung ulang nilai" bila ditanyakan user.
7. [ ] Jangan hapus: `backups/*.gz|*.db`, image/tag + container agen lain (`pekerjaan-*`, `userdel-*`, `kopraport-*`, `role-separation-*`, `ai-fix*`, `santrifilter-*`), volume `clinic-os-*`, `/tmp/j28` (milik UID lain).
8. [ ] (Baru) Minta user cek di Android/Chrome: field **Kelas** & **Status** di `/admin/kesantrian/form` kini dropdown kustom (image frontend `jilid44`) — pastikan tidak lagi "langsung nutup". Bila `<select>` native di halaman lain (mis. `/admin/school`, `/admin-bs`) juga bermasalah di Android, pola `SelectField` di `app/admin/kesantrian/form/page.tsx` bisa dipakai ulang.
9. [ ] (Baru) `CATATAN-JILID42.md` belum diupdate untuk pekerjaan bobot / jilid43 / jilid44 — detail lengkap ada di §4 RINGKASAN. Lengkapi atau tandai usang agar agen lain tidak mencari detail yang tidak ada di sana.
10. [ ] (Baru) File `/tmp/pgl/inspect10.js` (milik agen lain) berisi `JWT_SECRET` hardcode — Credential ada di disk server. Sudah dilaporkan ke user; JANGAN dihapus tanpa izin karena mungkin masih dipakai agen lain.
11. [ ] (Baru) 2 screenshot tutorial (`acad-08-presensi.png`, `acad-09-tahfidz.png`) sudah dipakai di `visualSteps` (langkah 6-7). Kalau nanti ditambah section tutorial lain, pakai pattern yang sama: redactor DOM + guard middleware, jangan asal taruh PNG ke `public/`.
12. [ ] (Baru) 3 file `.bak-tutorial-20260928-064738` (adminDocs/help-page/middleware) sudah dihapus setelah deploy; contoh aslinya ada di riwayat git (`c125ef9`, `5a36b0d`), tidak perlu backup terpisah.
10. [ ] (Baru) `apps/frontend/tsconfig.tsbuildinfo` dimiliki root → `tsc` selalu gagal `TS5033` untuk user `heru`. Minta owner `chown heru` file itu, atau nonaktifkan `incremental` di `tsconfig.json`.

## 6. PELAJARAN TEKNIS (jangan ulangi)
- SQLite `modernc` + `_txlock=immediate`: tulis saat `rows` terbuka = DEADLOCK. Kumpulkan dulu, tutup, baru tulis.
- PRAGMA `foreign_keys` tak bisa diubah di dalam transaksi.
- Placeholder `?` vs argumen Go dicek saat runtime, bukan compile — hitung manual (kasus jenjang: INSERT 25=25, UPDATE 23+id).
- Patch anchor dari copy basi = MISS; selalu dry-run di server. File `.bak-*` = agen lain sedang kerja.
- Build lama (backend ~10 mnt, frontend ~15 mnt, konteks 2,2 GB) — pakai `nohup` + polling, jangan blokir 1 call.
- `pgrep -f "docker build"` bisa false-positive dari perintah ssh sendiri.
- Tool `bash` merusak `$()`/backtick dalam perintah remote — pakai file script + scp.

- Skala nilai seragam KKM 0-100 (grade+CBT+predikat selaras; kesantrian tampil 0-100). Live: backend+frontend `skala`.
- **chi**: memecah grup terproteksi jadi `r.Route(path, func(r chi.Router){ ... })` dengan grup READ rute spesifik + grup WRITE `r.Mount("/", h.Routes())` aman — rute spesifik menang untuk method-nya, sisanya tetap masuk mount (POST/PUT/DELETE **bukan** 405, sudah diuji 13/13). Tetap wajib uji ulang endpoint WRITE setiap kali melakukan pemecahan seperti ini.
- **Android/Chrome**: popup `<select>` native bisa "terbuka lalu langsung nutup". Headless tidak bisa menirukan popup, dan instrumentasi (urutan event, blur, mutasi DOM, scroll, transform/filter ancestor) bisa bersih total → jangan disalahkan logika React; ganti ke combobox kustom (lihat `SelectField`).
- `tsc --noEmit` gagal `TS5033` kalau `tsconfig.tsbuildinfo` dimiliki root → tambah `--incremental false`.
- DB live mode WAL (ada `-wal`/`-shm`); salinan konsisten pakai `python3` `src.backup(dst)`, bukan `cp`.
- Berkas root-owned di `/tmp`/folder ter-mount tidak bisa dihapus oleh `heru` → `docker run --rm -v DIR:/x alpine sh -c "rm -rf /x/*"`.
- `sudo -S` tanpa `-p ''` mencetak prompt tanpa newline, jadi `console.log`/echo PERTAMA ikut menempel di baris prompt lalu ikut terhapus `grep -v '^\[sudo'` — awas thinks "baris hilang". Pakai `sudo -S -p ''`.
- Screenshot tutorial: `public/` = aset publik tanpa auth. Selalu (1) redaksi data di DOM sebelum `screenshot()` dengan sumber nama dari API, (2) guard path di `src/middleware.ts`. Validasi dengan `curl` **tanpa cookie** (harus 307, bukan 200).
- `<img loading="lazy"` di bawah fold: `naturalWidth` = 0 saat dicek → false "gambar rusak". Paksa scroll sampai bawah + tunggu, baru cek `naturalWidth`; `HTTP 4xx/5xx = 0` adalah bukti paling andal.
- Build: jalankan `nohup ... > log 2>&1 &` + file penanda `.done`; jangan `pgrep -f <cmd>` lewat ssh (self-match → loop nyangkut & broken pipe). Pesan "Install the buildx component" dari `docker build` = warning legacy builder, bukan error.
