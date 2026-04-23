---
description: Alur kerja audit kode - review kode terstruktur dan verifikasi kualitas
---

# Alur Kerja Audit

## Tujuan
Memeriksa kualitas kode yang ada dan menghasilkan temuan terstruktur. Alur kerja ini tidak menulis fitur baru — ia mengidentifikasi masalah untuk alur kerja perbaikan selanjutnya.

## Kapan Digunakan
- Setelah fitur agen lain di-commit (review lintas-agen)
- Gerbang kualitas periodik pada codebase
- Sebelum rilis atau deployment
- Ketika pengguna ingin jaminan tanpa menulis kode baru
- Setelah menangani temuan review, untuk memverifikasi perbaikan

## Kapan TIDAK Digunakan
- Saat menulis fitur baru (gunakan `/orchestrator`)
- Saat memperbaiki bug yang diketahui (gunakan `/quick-fix`)
- Saat merestrukturisasi kode (gunakan `/refactor`)

## Daftar Periksa Pra-Audit
Sebelum memulai, Anda HARUS:
1. Pindai direktori `.agent/rules/` — ini membentuk kriteria review
2. Baca `rule-priority.md` untuk resolusi konflik
3. Identifikasi cakupan audit (fitur spesifik, modul, atau seluruh codebase)

## Fase-fase

### Fase 1: Review Kode
**Atur Mode:** Gunakan `task_boundary` untuk mengatur mode ke **PLANNING**

Aktifkan **Skill Review Kode** terhadap file/fitur yang ditentukan.

Review berdasarkan kategori-kategori ini (dalam urutan prioritas dari `rule-priority.md`):

#### 1. Keamanan
- Validasi input pada semua batas
- Tidak ada secret atau kredensial yang di-hardcode
- Query berparameter (tidak ada SQL injection)
- Pemeriksaan autentikasi/otorisasi yang tepat

#### 2. Keandalan
- Penanganan error pada semua operasi I/O (tidak ada blok catch kosong)
- Semua sumber daya dibersihkan (koneksi, file, lock)
- Timeout pada panggilan eksternal
- Pola degradasi yang halus

#### 3. Testabilitas
- Operasi I/O di balik interface/abstraksi
- Logika bisnis murni (tanpa efek samping)
- Dependensi diinjeksi, tidak di-hardcode
- Cakupan test pada jalur kritis

#### 4. Observabilitas
- Semua titik masuk operasi di-log (mulai/sukses/gagal)
- Logging terstruktur dengan ID korelasi
- Level log yang sesuai

#### 5. Kualitas Kode
- Mengikuti pola codebase yang ada (konsistensi >80%)
- Fungsi terfokus dan kecil (10-50 baris)
- Penamaan jelas yang mengungkapkan maksud
- Tidak ada duplikasi kode (DRY)

### Fase 2: Verifikasi Otomatis
**Atur Mode:** Gunakan `task_boundary` untuk mengatur mode ke **VERIFICATION**

Jalankan rangkaian validasi lengkap (sama seperti `/4-verify`):
1. Linter dan analisis statis
2. Rangkaian test lengkap
3. Pemeriksaan build
4. Laporan cakupan

### Fase 3: Laporan Temuan

**Lokasi output:** `docs/audits/review-findings-{fitur}-{YYYY-MM-DD}-{HHmm}.md`

Anda HARUS menyimpan laporan ke repositori (bukan hanya sebagai artefak percakapan) agar dapat:
- Direferensikan dari percakapan/agen lain
- Dilacak dalam version control
- Diberikan sebagai konteks ke alur kerja perbaikan

**Langkah-langkah:**
1. Buat direktori `docs/audits/` jika belum ada
2. Tulis laporan temuan ke `docs/audits/review-findings-{fitur}-{YYYY-MM-DD}-{HHmm}.md`
3. Gunakan template di bawah

```markdown
# Audit Kode: {Nama Fitur/Modul}
Tanggal: {tanggal}

## Ringkasan
- **File yang di-review:** N
- **Masalah ditemukan:** N (X kritis, Y utama, Z minor)
- **Cakupan test:** N%

## Masalah Kritis
Masalah yang harus diperbaiki sebelum deployment.
- [ ] {deskripsi} — {file}:{baris}

## Masalah Utama
Masalah yang harus diperbaiki dalam waktu dekat.
- [ ] {deskripsi} — {file}:{baris}

## Masalah Minor
Gaya, penamaan, atau peningkatan kecil.
- [ ] {deskripsi} — {file}:{baris}

## Hasil Verifikasi
- Lint: LULUS/GAGAL
- Test: LULUS/GAGAL (N lulus, N gagal)
- Build: LULUS/GAGAL
- Cakupan: N%
```

## Umpan Balik
Setelah audit menghasilkan temuan, pilih alur kerja yang tepat berdasarkan tipe temuan:

| Tipe Temuan                                                                         | Contoh                               | Alur Kerja                            |
| ----------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------- |
| **Nit / minor** (penamaan, format, komentar yang hilang)                            | "Ganti nama `x` ke `userCount`"      | Perbaiki di percakapan ini langsung   |
| **Perbaikan kecil terisolasi** (log yang hilang, penanganan error, validasi)        | "Tambah validasi input pada handler" | `/quick-fix` di percakapan baru       |
| **Perubahan struktural** (abstraksi salah, interface hilang, inkonsistensi pola)    | "Storage tidak di balik interface"   | `/refactor` di percakapan baru        |
| **Kemampuan yang hilang** (endpoint baru, fitur, pemeriksaan auth)                  | "Tidak ada middleware auth di rute admin" | `/orchestrator` di percakapan baru |

### Menggunakan Temuan di Konteks Lain
Saat memulai alur kerja perbaikan di percakapan baru, referensikan laporan yang tersimpan:

> "Perbaiki masalah kritis di `docs/audits/review-findings-gatekeeper-2026-02-16-1430.md`"

Agen di konteks baru dapat membaca file langsung dari repositori — tidak perlu menyalin-tempel temuan.

## Kriteria Penyelesaian
- [ ] Semua file/fitur yang ditentukan telah di-review
- [ ] Rangkaian verifikasi lengkap dijalankan
- [ ] Dokumen temuan disimpan ke `docs/audits/` di repositori
