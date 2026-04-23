---
name: code-review
description: Protokol code review terstruktur untuk menginspeksi kualitas kode terhadap seluruh set aturan. Gunakan ketika mengaudit kode yang ditulis oleh Anda sendiri atau agen lain, selama alur kerja /audit, atau ketika pengguna meminta ulasan kode.
---

# Keahlian Code Review

## Tujuan
Secara sistematis mengulas kode terhadap seluruh set aturan antigravity. Menangkap masalah yang terlewatkan oleh linter: pelanggaran arsitektural, kurangnya observabilitas, kesalahan logika bisnis, dan ketidakkonsistenan pola.

## Kapan Harus Dipanggil
- Selama alur kerja `/audit` (Fase 1: Code Review)
- Ketika pengguna meminta ulasan kode (code review) di luar alur kerja apa pun
- **Praktik terbaik:** Panggil dalam sesi percakapan baru (bukan percakapan yang sama yang menulis kode tersebut) untuk menghindari bias konfirmasi

## Proses Review

### 1. Tentukan Cakupan Review
Identifikasi file/fitur yang akan ditinjau. Tentukan cakupan review:
- **Review fitur** — semua file dalam direktori fitur
- **Review PR** — hanya file yang diubah
- **Audit codebase penuh** — semua fitur

### 2. Muat Set Aturan
Baca semua aturan yang berlaku dari `.agent/rules/`. Gunakan `rule-priority.md` untuk klasifikasi keparahan (severity).

### 3. Kategori Review (Berdasarkan Prioritas)

Tinjau setiap file/fitur terhadap kategori berikut, secara berurutan dari yang ada di `rule-priority.md`:

#### Kritis (Must Fix)
- **Keamanan** — injeksi, secret yang di-hardcode, autentikasi yang rusak
- **Kehilangan data** — penanganan error yang hilang pada penulisan, tidak ada batasan transaksi
- **Kebocoran sumber daya** — koneksi yang tidak ditutup, kurangnya pembersihan (cleanup)

#### Mayor (Should Fix)
- **Testabilitas** — I/O tidak berada di belakang interface, jalur error tidak teruji
- **Observabilitas** — kurangnya logging pada pemrosesan, tidak ada correlation ID
- **Penanganan error** — blok catch kosong, error yang ditelan (swallowed)
- **Arsitektur** — dependensi sirkuler, akses layer yang salah

#### Minor (Nice to Fix)
- **Konsistensi pola** — penyimpangan dari pola codebase yang sudah ada
- **Penamaan** — nama variabel/fungsi yang tidak jelas
- **Organisasi kode** — fungsi terlalu panjang, tanggung jawab bercampur

#### Nit (Opsional)
- **Gaya (Style)** — masalah pemformatan yang akan ditangkap oleh linter
- **Dokumentasi** — kurangnya komentar pada logika yang kompleks

### 4. Hasilkan Temuan

Keluarkan dokumen temuan yang terstruktur:

```markdown
# Code Review: {Nama Fitur/Modul}
Tanggal: {tanggal}
Reviewer: Agen AI (konteks segar)

## Ringkasan
- **File ditinjau:** N
- **Masalah ditemukan:** N (X kritis, Y mayor, Z minor, W nit)

## Masalah Kritis
- [ ] **[SEC]** {deskripsi} — [{file}:{line}](file:///path)
- [ ] **[DATA]** {deskripsi} — [{file}:{line}](file:///path)

## Masalah Mayor
- [ ] **[TEST]** {deskripsi} — [{file}:{line}](file:///path)
- [ ] **[OBS]** {deskripsi} — [{file}:{line}](file:///path)

## Masalah Minor
- [ ] **[PAT]** {deskripsi} — [{file}:{line}](file:///path)

## Nit
- [ ] {deskripsi} — [{file}:{line}](file:///path)

## Aturan yang Diterapkan
Daftar aturan yang dirujuk selama tinjauan ini.
```

### 5. Simpan Laporan

Ketika dipanggil melalui alur kerja `/audit`, Anda **HARUS** mempertahankan temuan tersebut ke dalam repositori:

**Path:** `docs/audits/review-findings-{fitur}-{YYYY-MM-DD}-{HHmm}.md`

1. Buat direktori `docs/audits/` jika belum ada
2. Tulis dokumen temuan ke path tersebut
3. Hal ini membuat laporan dapat diakses dari percakapan dan agen lain

Ketika dipanggil sebagai ulasan mandiri (bukan melalui `/audit`), menyimpan ke `docs/audits/` disarankan tetapi bersifat opsional.

### 6. Tag Keparahan (Severity Tags)

| Tag      | Kategori            | Sumber Aturan                                      |
| -------- | ------------------- | -------------------------------------------------- |
| `[SEC]`  | Keamanan            | `security-principles.md`                           |
| `[DATA]` | Integritas data     | `error-handling-principles.md`                     |
| `[RES]`  | Kebocoran sumber daya | `resources-and-memory-management-principles.md`    |
| `[TEST]` | Testabilitas        | `architectural-pattern.md`, `testing-strategy.md`  |
| `[OBS]`  | Observabilitas      | `logging-and-observability-mandate.md`             |
| `[ERR]`  | Penanganan error    | `error-handling-principles.md`                     |
| `[ARCH]` | Arsitektur          | `architectural-pattern.md`, `project-structure.md` |
| `[PAT]`  | Konsistensi pola    | `code-organization-principles.md`                  |

## Kepatuhan Aturan
Keahlian ini menegakkan semua aturan di dalam `.agent/rules/`. Referensi penting:
- Prioritas Aturan @rule-priority.md (klasifikasi keparahan)
- Prinsip Keamanan @security-principles.md
- Pola Arsitektur @architectural-pattern.md
- Strategi Pengujian @testing-strategy.md
- Mandat Logging & Observabilitas @logging-and-observability-mandate.md
- Prinsip Penanganan Error @error-handling-principles.md
