# Code Review: Wallet Feature (Backend)
Tanggal: 2026-04-21
Reviewer: Agen AI

## Ringkasan
- **File ditinjau:** 2 file (`handler.go`, `repository.go`)
- **Masalah ditemukan:** 4 (1 kritis, 2 mayor, 1 minor)

## Masalah Kritis
- [ ] **[DATA]** Potensi Database Syntax Error pada Konkurensi — [`apps/backend/internal/features/wallet/repository.go:91`](file:///d:/KERJAAN%20DARUSSUNNAH/darussunnah/apps/backend/internal/features/wallet/repository.go#L91)
  Query `SELECT id, balance FROM user_wallets WHERE user_id = ? FOR UPDATE` menggunakan klausa `FOR UPDATE`. Mengingat database yang digunakan adalah SQLite (berdasarkan keberadaan `darussunnah.db`), SQLite tidak mendukung lock level baris (`FOR UPDATE`). Ini berpotensi menyebabkan error SQL syntax parser saat fitur transaksional dijalankan.

## Masalah Mayor
- [ ] **[OBS]** Tidak Ada Logging Observabilitas di Handler — [`apps/backend/internal/features/wallet/handler.go`](file:///d:/KERJAAN%20DARUSSUNNAH/darussunnah/apps/backend/internal/features/wallet/handler.go)
  Terjadi pelanggaran pada "[Mandat Logging & Observabilitas]". Modul `wallet` di handler sama sekali tidak memanggil `logger.Warn` atau `logger.Error` saat kegagalan transaksi, set PIN, maupun top-up. 
- [ ] **[TEST]** Kurangnya Abstraksi/Interface pada Handler — [`apps/backend/internal/features/wallet/handler.go:12`](file:///d:/KERJAAN%20DARUSSUNNAH/darussunnah/apps/backend/internal/features/wallet/handler.go#L12)
  Sama seperti `auth`, `Handler` bergantung langsung pada `*Repository`. Harus dibuatkan Interface (seperti `IWalletRepository`) untuk kemudahan unit testing handler.

## Masalah Minor
- [ ] **[PAT]** Tidak Menggunakan Correlation ID — [`apps/backend/internal/features/wallet/handler.go`](file:///d:/KERJAAN%20DARUSSUNNAH/darussunnah/apps/backend/internal/features/wallet/handler.go)
  `wallet` handler memanggil custom respon yaitu `writeJSONResponse` yang sama sekali tidak meneruskan atau memanfaatkan `X-Correlation-ID` pada response headers maupun dalam logic, sehingga mempersulit tracing request.

## Aturan yang Diterapkan
- Integritas Data & Konkurensi (Konflik dukungan standar fitur driver SQLite)
- Mandat Logging & Observabilitas
- Desain Testabilitas.
