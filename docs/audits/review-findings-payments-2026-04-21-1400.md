# Code Review: Payments Feature (Backend)
Tanggal: 2026-04-21
Reviewer: Agen AI

## Ringkasan
- **File ditinjau:** 2 file (`handler.go`, `repository.go`)
- **Masalah ditemukan:** 4 (1 kritis, 2 mayor, 1 minor)

## Masalah Kritis
- [ ] **[SEC/DATA]** Kurangnya Validasi Input pada Endpoint Create — [`apps/backend/internal/features/payments/handler.go:63`](file:///d:/KERJAAN%20DARUSSUNNAH/darussunnah/apps/backend/internal/features/payments/handler.go#L63)
  Fungsi `Create` menerima payload JSON tanpa divalidasi. Tidak ada pengecekan untuk `Amount` (bisa negatif atau 0) maupun `Status` dan `Method`. Ini rentan terhadap manipulasi nilai pembayaran. Seharusnya memigrasikan decoding dan validasi menggunakan package `validators`.

## Masalah Mayor
- [ ] **[ERR]** Kegagalan Type Assertion untuk mendapatkan Admin ID (Selalu bernilai 0) — [`apps/backend/internal/features/payments/handler.go:78`](file:///d:/KERJAAN%20DARUSSUNNAH/darussunnah/apps/backend/internal/features/payments/handler.go#L78)
  Pengambilan konteks admin dilakukan dengan `claims, ok := r.Context().Value(auth.UserContextKey).(map[string]interface{})`. Hal ini akan GAGAL (ok = false) karena tipe asli dari JWT claims adalah tipe deklaratif `jwt.MapClaims`, bukan sekadar alias `map[string]interface{}`. Seharusnya menggunakan `.(jwt.MapClaims)`.
- [ ] **[OBS]** Tidak Menggunakan Logger Terstruktur — [`apps/backend/internal/features/payments/handler.go:45`](file:///d:/KERJAAN%20DARUSSUNNAH/darussunnah/apps/backend/internal/features/payments/handler.go#L45)
  Alih-alih menggunakan logger platform terstruktur (`logger.Error`, dll.) yang mendukung atribut dan `correlation_id`, modul ini menggunakan log standar golang (`log.Printf`). Ini melanggar Mandat Observabilitas.

## Masalah Minor
- [ ] **[TEST]** Kurangnya Abstraksi/Interface pada Handler — [`apps/backend/internal/features/payments/handler.go:15`](file:///d:/KERJAAN%20DARUSSUNNAH/darussunnah/apps/backend/internal/features/payments/handler.go#L15)
  Sama halnya dengan modul-modul lainnya, `Handler` bergantung pada konkrit implementasi `*Repository`. Seharusnya melalui interface `IPaymentRepository` untuk mempermudah unit testing.

## Aturan yang Diterapkan
- Mandat Keamanan (Validasi pada batas I/O)
- Penanganan Error (Menghindari Type Assertion salah yang diam-diam gagal)
- Mandat Logging & Observabilitas (Harus menggunakan structured logging)
- Desain Testabilitas.
