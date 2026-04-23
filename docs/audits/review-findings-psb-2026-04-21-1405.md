# Code Review: PSB Feature (Backend)
Tanggal: 2026-04-21
Reviewer: Agen AI

## Ringkasan
- **File ditinjau:** 4 file (`handler.go`, `logger.go`, `repository.go`, `response.go`)
- **Masalah ditemukan:** 4 (1 kritis, 1 mayor, 2 minor)

## Masalah Kritis
- [ ] **[SEC]** Kurangnya Validasi Payload pada SaveMine dan SaveMyDocuments — [`apps/backend/internal/features/psb/handler.go:177`](file:///d:/KERJAAN%20DARUSSUNNAH/darussunnah/apps/backend/internal/features/psb/handler.go#L177)
  Kedua fungsi ini hanya melakukan `json.Unmarshal(body, &req)` secara langsung tanpa melalui `validators` package. Hal ini rentan karena tidak ada validasi tipe, batas panjang karakter, maupun data loss verification sebelum di-pass ke repository. Berbeda dengan `UpdateStatus` yang sudah mengimplementasikan `validators.DecodeStrictJSON`.

## Masalah Mayor
- [ ] **[PAT/OBS]** Duplikasi Modul Logger Kustom yang Tidak Standar — [`apps/backend/internal/features/psb/logger.go:12`](file:///d:/KERJAAN%20DARUSSUNNAH/darussunnah/apps/backend/internal/features/psb/logger.go#L12)
  Modul PSB merapkan custom logger (`RequestLogger`) secara mandiri alih-alih menggunakan modul tersentralisasi `darussunnah-api/internal/platform/logger`. Ini melanggar prinsip "Organisasi Kode" (DRY) serta menurunkan Observabilitas karena tidak mensinkronisasi `X-Correlation-ID` dengan standar log aplikasi utama secara mulus.

## Masalah Minor
- [ ] **[OBS]** Log Header Correlation ID Tidak Dikembalikan pada Response — [`apps/backend/internal/features/psb/response.go:17`](file:///d:/KERJAAN%20DARUSSUNNAH/darussunnah/apps/backend/internal/features/psb/response.go#L17)
  Berbeda dengan model response di modul (seperti auth), fungsi response milik `psb` tidak menyertakan response header `X-Correlation-ID` maupun `X-Request-ID`, sehingga pengguna API tidak bisa melacak error jika terjadi.
- [ ] **[DATA]** Potensi Race Condition pada Upsert Tanpa Transaksi — [`apps/backend/internal/features/psb/repository.go:168`](file:///d:/KERJAAN%20DARUSSUNNAH/darussunnah/apps/backend/internal/features/psb/repository.go#L168)
  Operasi `SaveByUserID` melakukan pengecekan `existing, err := r.FindByUserID` terlebih dahulu kemudian melakukan `INSERT` atau `UPDATE`. Pola ini adalah (read-modify-write) tanpa dibungkus SQL Transaction. Pada trafik tinggi, hal ini bisa mengakibatkan duplikasi row atau konflik SQLite lock jika tidak ada constraint `UNIQUE(user_id)`.

## Pujian (Good Practice)
- [ ] **[TEST]** Penggunaan Repository Interface!
  Modul `psb` telah menerapkan `type PSBRepository interface` pada dependensi `Handler`, sangat bagus untuk Unit Testing! Sesuai dengan "Desain Testabilitas"!

## Aturan yang Diterapkan
- Mandat Keamanan (Validasi Data Input)
- Konsistensi Pola (DRY pada komponen logger)
- Mandat Observabilitas (Konsistensi penanganan sistem log)
- Integritas Data (Penanganan konkurensi pada logic upsert).
