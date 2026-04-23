# Code Review: Auth Feature (Backend)
Tanggal: 2026-04-21
Reviewer: Agen AI

## Ringkasan
- **File ditinjau:** 4 file (`handler.go`, `middleware.go`, `repository.go`, `service.go`)
- **Masalah ditemukan:** 4 (1 kritis, 2 mayor, 1 minor)

## Masalah Kritis
- [ ] **[SEC/RES]** Potensi Web Server Crash (Denial of Service) — [`apps/backend/internal/features/auth/handler.go:27`](file:///d:/KERJAAN%20DARUSSUNNAH/darussunnah/apps/backend/internal/features/auth/handler.go#L27)
  Fungsi `GetJWTSecret()` memanggil `os.Exit(1)` jika `JWT_SECRET` tidak ada. Fungsi ini dipanggil di setiap request saat login dan juga di `AuthMiddleware`. Jika environment variable ini hilang saat runtime, seluruh server API akan crash. Seharusnya kegagalan divalidasi saat startup (early fail), bukan di-invoke per request dengan `os.Exit()`.

## Masalah Mayor
- [ ] **[TEST]** Kurangnya Abstraksi/Interface pada Handler — [`apps/backend/internal/features/auth/handler.go:33`](file:///d:/KERJAAN%20DARUSSUNNAH/darussunnah/apps/backend/internal/features/auth/handler.go#L33)
  `Handler` bergantung langsung pada concrete struct `*Repository`, bukan pada Interface. Ini bertentangan dengan prinsip "Desain yang Mengutamakan Testabilitas", menyulitkan pembuatan mock repository saat melakukan unit test pada handler.
- [ ] **[TEST]** Penggunaan SQL DB Secara Langsung di Middleware — [`apps/backend/internal/features/auth/middleware.go:82`](file:///d:/KERJAAN%20DARUSSUNNAH/darussunnah/apps/backend/internal/features/auth/middleware.go#L82)
  `RequireLicense(db *sql.DB)` menerima koneksi db secara langsung untuk diteruskan ke `CheckLicense(db)`. Hal ini juga membatasi testabilitas middleware karena membutuhkan database secara langsung, sebaiknya menggunakan interface/service abstraksi untuk lisensi.

## Masalah Minor
- [ ] **[PAT]** Penyimpanan dan Eksekusi Fallback Chi Router — [`apps/backend/internal/features/auth/handler.go:399`](file:///d:/KERJAAN%20DARUSSUNNAH/darussunnah/apps/backend/internal/features/auth/handler.go#L399)
  Pengambilan parameter ID (`idStr := r.PathValue("id"); if idStr == "" { idStr = chi.URLParam(r, "id") }`) bisa diadopsi ke dalam satu file utilitas middleware (Helper) bila sering digunakan, untuk mematuhi prinsip DRY.

## Aturan yang Diterapkan
- Mandat Keamanan & Keandalan (Penanganan Error tanpa crash/os.Exit di runtime HTTP)
- Desain yang Mengutamakan Testabilitas (Penggunaan Interface pada dependensi handler)
- Prinsip Keandalan (Cegah Denial of Service).
