# Rencana Aksi (Refactoring Plan) Darussunnah Backend

Berdasarkan audit komprehensif pada struktur modul di `/apps/backend/internal/features/` menggunakan aturan **Awesome AGV Persona**, dokumen ini menjabarkan rencana langkah demi langkah untuk menyelesaikan temuan-temuan sistematis (Critical, Major, dan Minor) yang ada di codebase.

## Ringkasan Masalah Utama (Global Findings)

1. **[TEST] Ketergantungan Kaku (Hard Dependency)**
   Hingga saat ini, semua struct `Handler` bergantung pada implementasi `struct *Repository` secara langsung, bukan melalui Interface. Hal ini menyulitkan Mocking dan Unit Testing.
2. **[OBS] Ketidakadaan Observabilitas (Poor Logging)**
   Sebagian besar fitur menggunakan log standar (`log.Printf`) tanpa format terstruktur dan tanpa menyertakan context request seperti Correlation-ID.
3. **[SEC] Kerentanan Decode Input JSON**
   Banyak handler langsung menerima payload JSON lewat `json.NewDecoder(r.Body)` tanpa perlindungan dari over-payload (misal pembatasan stream 1MB) maupun tipe data yang sangat spesifik, sehingga rawan terkena issue injection atau DoS.
4. **[ERR] Deklarasi Tipe yang Berisiko (Risk Type Assertion)**
   Banyak handler mencoba mengekstrak user/admin ID dari konteks menggunakan type assertion konkrit ke alias map yang rawan panic/gagal secara mendadak (silent fail).
5. **[DATA] Konflik Driver Sqlite**
   Penggunaan instruksi `FOR UPDATE` yang sebetulnya tidak kompatibel dengan dialect SQLite di beberapa modul transaksional (seperti dompet dan PSB).

---

## Tahapan Refactoring

### Tahap 1: Persiapan Utilitas & Platform (Shared Core)
Pada tahap ini, kita membenahi utilitas umum yang akan dipakai oleh seluruh modul sebelum module-module tersebut disesuaikan.
- **Logger:** Menyesuaikan package `internal/platform/logger` agar menyertakan parameter `context.Context` untuk tracing `X-Correlation-ID`.
- **Validators:** Membuat wrapper decoding payload yang seragam di `internal/validators`, yang membatasi ukuran request dan mengeksekusi strict validation.
- **Auth Context:** Membenahi Middleware autentikasi untuk memastikan `jwt.MapClaims` ditangani secara konsisten dan anti-panic.

### Tahap 2: Menerapkan Segregasi Interface (Dependency Inversion)
Tahap ini difokuskan untuk memenuhi Mandat *Testability*.
- Di setiap modul fitur (seperti `academics`, `teachers`, `attendance`, dll), kita akan mendeklarasikan `Interface` pada `handler.go` (contoh: `AcademicsRepository interface { ... }`).
- Mengubah fungsi inisialisasi `NewHandler(...)` untuk menerima Interface tersebut, bukan struct Repository konkritnya.

### Tahap 3: Pembaruan Keamanan Input & Observabilitas 
Pada tahap ini kita akan masuk secara masif ke banyak modul untuk memperbaiki HTTP Handler-nya:
- **Refactor Logger:** Membuang semua referensi impor `log` / `log.Printf` di tiap-tiap handler menjadi `logger.Error(ctx, ...)` atau `logger.Info(ctx, ...)`.
- **Refactor Dekoder JSON:** Mengganti semua instruksi `json.NewDecoder(r.Body).Decode(...)` menjadi `validators.DecodeJSON(w, r, ...)`.
- **Cleanups:** Membuang custom logic seperti `os.Exit(1)` dalam runtime HTTP dan membersihkan perulangan kode yang repetitif.

### Tahap 4: Memperbaiki Stabilitas Database
- Mencari setiap string sql berbunyi `FOR UPDATE` di dalam package `features\*\repository.go` dan menulis ulangnya menjadi transaksi eksklusif biasa jika itu di SQLite. (Menggunakan `BEGIN IMMEDIATE`).

---

## Verifikasi Pascakerja

1. **Uji Kompilasi Penuh:** Menggunakan command `go build ./...` di aplikasi backend. Target utama adalah **zero error build**.
2. **Uji Integrasi / Unit Test Berjalan:** Memastikan pengujian lama setelah penggunaan file `Interface` masih tetap pass.
3. **Uji Coba Fungsional:** Menggunakan CLI/Browser untuk memanggil endpoint guna memastikan Middleware `Correlation-ID` ikut masuk dalam header/log dan payload rusak terpental oleh validator.

---

## ✅ Status Eksekusi (Selesai: 21 April 2026)

Seluruh tahapan refactoring telah **dieksekusi dan diverifikasi**.

### Hasil Verifikasi Final

| Pemeriksaan | Hasil |
|-------------|-------|
| `go build ./internal/...` | ✅ PASS |
| `go vet ./internal/...` | ✅ PASS |
| Sisa `log.Printf` di features | **0** ✅ |
| Sisa `json.NewDecoder` di features | **0** ✅ |
| Sisa `os.Exit` di internal | **0** ✅ |
| Sisa `FOR UPDATE` di internal | **0** ✅ |
| Handler masih pakai `*Repository` konkrit | **0** ✅ |

### Modul yang Di-refactor (21 modul + 2 platform)

`academics` · `agendas` · `attendance` · `auth` · `disciplines` · `donations` · `exams` · `facilities` · `faqs` · `gallery` · `logs` · `messages` · `news` · `notifications` · `payments` · `programs` · `psb` · `settings` · `teachers` · `videos` · `wallet` · `platform/ai` · `platform/logger`
