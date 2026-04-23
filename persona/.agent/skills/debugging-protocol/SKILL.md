---
name: debugging-protocol
description: Protokol komprehensif untuk memvalidasi akar penyebab masalah perangkat lunak. Gunakan saat Anda perlu men-debug bug yang kompleks, pengujian yang tidak stabil (flaky test), atau perilaku sistem yang tidak diketahui secara sistematis dengan membentuk hipotesis dan memvalidasinya menggunakan tugas khusus.
---

# Protokol Debugging

## Ringkasan

Keahlian ini menyediakan kerangka kerja yang ketat untuk men-debug masalah perangkat lunak yang kompleks. Ini bergerak melampaui pemecahan masalah ad-hoc menuju proses pembuatan dan validasi hipotesis yang terstruktur.

Gunakan keahlian ini untuk:
1. Memformalkan sesi debugging.
2. Secara sistematis mengeliminasi potensi akar penyebab.
3. Mendokumentasikan temuan untuk referensi masa depan atau komunikasi tim.

## Alur Kerja Protokol

Untuk menjalankan sesi debugging terstruktur, ikuti langkah-langkah berikut:

### 1. Inisialisasi Sesi
Buat dokumen debugging baru menggunakan template yang disediakan. Ini berfungsi sebagai "sumber kebenaran" (source of truth) untuk investigasi.

**Lokasi template:** `assets/debugging-session-template.md`

**Simpan ke:** `docs/debugging/{nama-masalah}-{YYYY-MM-DD}-{HHmm}.md`

1. Buat direktori `docs/debugging/` jika belum ada
2. Salin template dan isi detail masalah
3. Hal ini membuat sesi dapat diakses dari percakapan dan agen lain (misalnya, saat menyerahkan pekerjaan ke alur kerja `/quick-fix` atau `/orchestrator`)

### 2. Definisikan Masalah
Artikulasikan dengan jelas **Konteks Sistem (System Context)** dan **Pernyataan Masalah (Problem Statement)**.
* **Gejala (Symptom)**: Apa perilaku yang dapat diamati? Bagaimana perbedaannya dengan perilaku yang diharapkan?
* **Cakupan (Scope)**: Komponen apa saja yang terlibat?

### 3. Rumuskan Hipotesis
Buat daftar hipotesis yang berbeda dan dapat diuji.
* Hindari tebakan yang samar.
* Bedakan antar lapisan (mis., "Hipotesis Frontend" vs "Hipotesis Backend").
* Contoh: "Race condition pada pembaruan state UI" vs "Kesalahan konfigurasi skema database".

### 4. Rancang Tugas Validasi
Untuk setiap hipotesis, rancang tugas validasi tertentu.
* **Tujuan (Objective)**: Apa yang ingin Anda buktikan atau bantah?
* **Langkah-langkah (Steps)**: Tindakan yang presisi dan dapat direproduksi.
* **Pola Kode (Code Pattern)**: Berikan kode atau perintah yang tepat untuk dijalankan (mis., query SQL tertentu, skrip Python yang menggunakan library klien, perintah `curl`).
* **Kriteria Keberhasilan (Success Criteria)**: Nyatakan secara eksplisit output apa yang mengonfirmasi hipotesis.

### 5. Eksekusi dan Dokumentasikan
Jalankan tugas-tugas secara berurutan. Untuk setiap tugas, catat:
* **Status**: ✅ VALIDATED (Terdivalidasi), ❌ FAILED (Gagal), atau ⚠️ INCONCLUSIVE (Tidak Menyimpulkan).
* **Temuan (Findings)**: Pengamatan utama dan bukti mentah (log, tangkapan layar).
* **Kesimpulan (Conclusion)**: Apakah ini mendukung atau membantah hipotesis?

### 6. Tentukan Akar Penyebab
Sintesis semua temuan menjadi sebuah **Analisis Akar Penyebab (Root Cause Analysis)**.
* Identifikasi Akar Penyebab Utama.
* Tetapkan Tingkat Keyakinan (Confidence Level).
* Usulkan perbaikan spesifik.

## Praktik Terbaik

* **Spesifik**: Jangan hanya mengatakan "periksa log." Katakan "grep 'Error 500' di `/var/log/nginx/access.log`".
* **Isolasi Variabel**: Ubah satu hal dalam satu waktu.
* **Validasi Asumsi**: Verifikasi konfigurasi dan versi terlebih dahulu (mis., "Tugas 1: Validasi Skema Saat Ini").
* **Pertahankan Bukti**: Simpan trace ID tertentu, stempel waktu (timestamp) log, atau skrip reproduksi.

## Modul Spesifik Bahasa

Direktori `languages/` berisi **panduan debugging modular yang spesifik untuk bahasa pemrograman**. Saat men-debug suatu proyek, muat modul bahasa yang relevan untuk memperkuat protokol ini dengan alat-alat khusus bahasa, kategori hipotesis, dan strategi validasi.

**Konvensi:** Setiap modul adalah file markdown mandiri di `languages/{bahasa}.md`.

**Cara menggunakan:**
1. Identifikasi bahasa utama dari codebase yang sedang di-debug
2. Muat modul terkait dari `languages/`
3. Integrasikan rangkaian alat (toolchain), kategori hipotesis, dan tugas validasinya ke dalam sesi debugging Anda

**Modul yang tersedia:**

| Modul | Bahasa/Runtime |
|---|---|
| [Rust](languages/rust.md) | Rust (cargo, rustc, tokio) |

> **Menyumbangkan modul baru:** Untuk menambahkan dukungan bagi bahasa baru, buat `languages/{bahasa}.md` mengikuti struktur modul yang sudah ada. Setiap modul harus mencakup: tabel referensi toolchain, kategori hipotesis khusus bahasa, pola tugas validasi, dan referensi cepat tindakan-pertama-berdasarkan-jenis-error.

## Kepatuhan Aturan
Saat melakukan debugging, verifikasi terhadap:
- Prinsip Penanganan Error @error-handling-principles.md (propagasi error yang tepat)
- Prinsip Logging dan Observabilitas @logging-and-observability-principles.md (logging terstruktur untuk diagnostik)
- Strategi Pengujian @testing-strategy.md (uji regresi untuk perbaikan)
