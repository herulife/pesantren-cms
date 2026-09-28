# RINGKASAN PROYEK ALMA-PARUNG — Handoff Antar Agen
> Terakhir diperbarui: 2026-09-27 (KKM dinamis live). Baca seluruh file ini SEBELUM menyentuh apa pun.

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
| Backend | `alma-parung-backend` | `alma-parung-backend:bobot` (`f07449c6a25c`) | Bobot nilai per mapel + kolom UH, healthy, **WAJIB `-p 8090:8080`** (nginx proxy /api/ ke 8090) |
| Frontend | `alma-parung-frontend-bobot` | `alma-parung-frontend:bobot` (`9854105e2313`) | Kartu "Bobot Komponen Nilai per Mapel" (tab Mapel) + kolom UH, healthy, `-p 3002:3000`. **Nama container berubah** dari `alma-parung-frontend-kkm` (per 28 Sep); image `kkm` tetap ada untuk rollback. |
| Store | `alma-store` | `latest` | terpisah, jangan sentuh |
| Rollback tersedia | — | backend `kkm`+`roleB2`+`skala`+`jilid51`+`jilid48`; frontend `kkm`+`skala`+`jilid54`+`jilid53` | — |
| DB | — | — | users 6, santri 1 (per 28 Sep; cek ulang) |

Deploy backend (catatan: JWT dari `.env`, DAHL key tetap):
```
cd ~/alma-parung && NEWJWT=$(grep "^JWT_SECRET=" .env|head -1|cut -d= -f2-) && docker stop alma-parung-backend && docker rm alma-parung-backend && docker run -d --name alma-parung-backend --restart always -p 8090:8080 -e DB_PATH=/data/alma-parung.db -e JWT_SECRET="$NEWJWT" -e API_PORT=8080 -e DAHL_API_KEY=dahl_LWJ8L7SpgoHbzHAB4j4DPtoc9s1jbebVn -e DAHL_API_URL=https://inference.dahl.global/v1 -v /home/heru/alma-parung/data:/data -v /home/heru/alma-parung/data/uploads:/app/apps/backend/public/uploads alma-parung-backend:<TAG>
```

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

## 5. TODO AKTIF
1. [ ] Jilid C: akun perdana (tunggu daftar nama+email+peran dari user).
2. [ ] Rotasi password SSH `H3ru@2026`.
3. [ ] Update skor halaman `/audit`.
4. [ ] (Opsional) KKM dinamis utk tampilan CBT & PDF predikat ikut KKM (sudah selaras via weight; cek halaman ekslusif CBT).
5. [ ] (Baru) Isi UH untuk nilai yang sudah ada, atau set bobot UH mapel = 0 bila mapel tsb tidak memakai UH — kalau tidak, nilai lama turun saat di-edit ulang.
6. [ ] (Baru) Bobot yang tersimpan tidak memengaruhi `grades` yang sudah ada; perlu tombol/endpoint "hitung ulang nilai" bila ditanyakan user.
7. [ ] Jangan hapus: `backups/*.gz|*.db`, image/tag + container agen lain (`pekerjaan-*`, `userdel-*`, `kopraport-*`, `role-separation-*`, `ai-fix*`, `santrifilter-*`), volume `clinic-os-*`, `/tmp/j28` (milik UID lain).

## 6. PELAJARAN TEKNIS (jangan ulangi)
- SQLite `modernc` + `_txlock=immediate`: tulis saat `rows` terbuka = DEADLOCK. Kumpulkan dulu, tutup, baru tulis.
- PRAGMA `foreign_keys` tak bisa diubah di dalam transaksi.
- Placeholder `?` vs argumen Go dicek saat runtime, bukan compile — hitung manual (kasus jenjang: INSERT 25=25, UPDATE 23+id).
- Patch anchor dari copy basi = MISS; selalu dry-run di server. File `.bak-*` = agen lain sedang kerja.
- Build lama (backend ~10 mnt, frontend ~15 mnt, konteks 2,2 GB) — pakai `nohup` + polling, jangan blokir 1 call.
- `pgrep -f "docker build"` bisa false-positive dari perintah ssh sendiri.
- Tool `bash` merusak `$()`/backtick dalam perintah remote — pakai file script + scp.

- Skala nilai seragam KKM 0-100 (grade+CBT+predikat selaras; kesantrian tampil 0-100). Live: backend+frontend `skala`.
