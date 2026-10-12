# ERAPOR_SYNC_PLAN.md — Rancangan Integrasi Alma ↔ E-Rapor (Kemenag)

Tanggal: 7 Okt 2026
Status: Draf rancangan (belum diimplementasi)

## 1. Latar & Kesimpulan

Alma sudah punya modul eRapor internal: backend `apps/backend/internal/features/raport/`
(hitung mapel/project/kesantrian, lock/unlock, tabel `raports`, `grades`), halaman
`/admin/raport`, dan PDF via `export.ts:exportERaportPDF`.

**Bisa digabung dengan E-Rapor Madrasah (RDM, Kemenag), tapi dengan batasan resmi:**
RDM tidak punya API tulis publik untuk sistem ketiga. Sinkronisasi resmi hanya lewat:
1. **Tarik data siswa dari EMIS** (EMIS = sumber data pokok).
2. **Import/export file** (Excel/JSON sesuai template RDM).

Jadi "sinkron" = export/import file + (opsional) pull EMIS — **bukan realtime 2 arah**.

## 2. Celah data alma (hasil pemetaan schema `db.go`)

| Kebutuhan E-Rapor/EMIS | Kondisi alma |
|---|---|
| NISN siswa | ❌ belum ada kolom `santri.nisn` |
| NPSN madrasah | ❌ belum ada (settings hanya nama/alamat/telepon/logo) |
| Rombel/kelas resmi | ⚠️ `santri.class` string bebas + tabel `classes` (tanpa kode rombel) |
| Predikat Kemenag (A/B/C/D per KKM) | ⚠️ hanya `PredikatKKM` internal (`platform/weight/engine.go`) |
| Semester `1`/`2` + TA `YYYY/YYYY+1` | ✅ sudah kanonik (`validators.NormalizeSemester`) |
| Identitas lengkap (NIK, TTL, ortu) | ✅ ada (`nik`, `birth_place/date`, `father_/mother_name`… ) |
| Nilai per mapel | ✅ `grades` (UTS/UAS/Tugas/UH + bobot per mapel) |
| Rapor tersimpan per santri/semester | ✅ `raports` (status draft/ready/locked) |

Catatan: `grades`/`raports` FK ke `users.id`, dipasangkan ke santri via `santri.user_id`
(tidak unik sejak Jilid 76) — resolusi sync harus `users.id → santri.id → NIS/NISN`.

## 3. Strategi 3 fase

### Fase 1 — Persiapan data pokok
- Migration: `ALTER TABLE santri ADD COLUMN nisn TEXT` + index (opsional unik bila sudah ada verval).
- Settings baru `npsn`, `nama_madrasah`, `jenjang_madrasah` masuk allowlist `settings/handler.go`.
- Mapping kelas → rombel: kolom `class_code` (atau isi `classes.code` sudah ada — perlu konsisten dipakai santri).
- `PredikatKemenag()` terpisah di `weight/engine.go` untuk rapor versi resmi.

### Fase 2 — Jalur sinkronisasi
**A. Data pokok (siswa/rombel/mapel):** alma ekspor ke template RDM/EMIS → operator impor ke
RDM (atau RDM tarik dari EMIS lalu alma dipasangkan via NISN). Endpoint baru:
`GET /api/erapor/export/siswa?semester=&academic_year=`.

**B. Nilai/rapor:** alma ekspor nilai per semester ke template nilai RDM → RDM hitung nilai akhir
resmi + cetak rapor resmi. PDF eRapor internal alma tetap untuk wali.

**C. Monitoring di web alma:** tabel `erapor_sync`
(`id, student_id, sync_type(data_pokok|nilai), status(draft|exported|imported|failed),
nisn, semester, academic_year, exported_at, imported_at, error`) + endpoint
`POST /api/erapor/export`, `GET /api/erapor/sync-status`.

### Fase 3 — Otomasi (setelah fase 1–2 stabil)
- Jadwal ekspor file ke `data/exports/erapor/`.
- Alert `sys_notifications`: santri baru tanpa NISN, rapor belum lengkap dekat akhir semester.
- Jika EMIS web service tersedia: pull terjadwal + deteksi selisih.

## 4. Monitoring di web alma (`/admin/erapor` atau tab `/admin/raport`)

1. **Kelengkapan identitas**: daftar santri belum punya NISN/NIK/alamat lengkap.
2. **Keselarasan nilai**: santri belum lengkap per kelas/semester (pakai `raport.Missing`).
3. **Log sinkron**: file terakhir diexport/import, jumlah baris, error per baris.
4. **Selisih vs EMIS** (jika pull tersedia): ada di alma tapi tidak di EMIS, dan sebaliknya.

## 5. Urutan implementasi (jilid)

| Jilid | Isi |
|---|---|
| 84 | Data pokok siap EMIS: `santri.nisn` + settings `npsn`/`jenjang` + field NISN di form admin/PSB + tampilan kelengkapan data |
| 85 | Export data pokok & nilai ke format RDM (endpoint + download Excel/JSON + preview validasi sebelum impor) |
| 86 | Monitoring sinkron: tabel `erapor_sync` + halaman `/admin/erapor` (status, log, selisih) |

## 6. Prasyarat sebelum Jilid 85

- Ambil 1–2 **file template/contoh resmi RDM versi terbaru** dari aplikasi RDM madrasah
  (mintakan ke operator atau unduh dari portal Kemenag) — generator ekspor wajib mengikuti
  format itu persis.
- Pastikan jenjang madrasah (MI/MTs/MA) & jenjang alma cocok; jika eRapor yang dimaksud
  versi Kemdikbud (SMA/SMK), sumbernya Dapodik — prinsip sama, template berbeda.

## 7. File rujukan

| Concern | File |
|---|---|
| Schema lengkap | `apps/backend/internal/platform/database/db.go` |
| Santri struct/input | `apps/backend/internal/features/santri/handler.go` |
| Hitung rapor | `apps/backend/internal/features/raport/repository.go` |
| Weight/predikat | `apps/backend/internal/platform/weight/engine.go` |
| PDF eRapor | `apps/frontend/src/lib/export.ts` (exportERaportPDF) |
| Halaman admin rapor | `apps/frontend/src/app/admin/raport/page.tsx` |
| Settings allowlist | `apps/backend/internal/features/settings/handler.go` |
| Kelas kanonik | `apps/frontend/src/lib/kelas.ts` |
