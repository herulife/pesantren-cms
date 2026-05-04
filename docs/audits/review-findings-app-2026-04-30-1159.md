# Audit Kode: aplikasi darussunnah
Tanggal: 2026-04-30 11:59 (Asia/Bangkok)

## Ringkasan
- **File yang di-review:** 203
- **Masalah ditemukan:** 3 (0 kritis, 2 utama, 1 minor)
- **Cakupan audit:** aplikasi `apps/backend` dan `apps/frontend/src` menggunakan panduan `persona/.agent/skills/code-review/SKILL.md` dan `persona/.agent/workflows/audit.md`

## Status Tindak Lanjut
- [x] **[ERR]** Crash helper URL aset di frontend sudah ditangani di `apps/frontend/src/lib/api.ts` dengan fallback origin yang aman untuk browser dan server.
- [x] **[RES]** Kebocoran key pada rate limiter sudah ditangani di `apps/backend/internal/platform/middleware/ratelimit.go` dan dilindungi oleh test regresi.
- [x] **[TEST]** Lint penuh frontend sekarang sudah lulus. Noise dari file vendor dan script util tetap diabaikan, error source aplikasi sudah dibersihkan, dan yang tersisa saat ini hanya warning backlog non-blocking.

## Masalah Kritis
Tidak ada temuan kritis yang tervalidasi pada codepath utama yang sedang aktif.

## Masalah Utama
- [x] **[ERR]** `normalizeApiAssetUrl()` membangun `new URL(API_BASE_URL).origin` walaupun pada browser `API_BASE_URL` bernilai relatif `"/api"`. Di lingkungan browser ini melempar `TypeError: Invalid URL` sebelum fungsi masuk ke blok `try/catch`, sehingga render aset bisa crash di homepage, galeri, fasilitas, guru, program, dan beberapa halaman admin yang memanggil `resolveDisplayImageUrl()` atau `normalizeApiAssetUrl()` secara langsung. Status: **sudah diperbaiki** di `apps/frontend/src/lib/api.ts`. - `apps/frontend/src/lib/api.ts:167`, dipakai luas misalnya `apps/frontend/src/app/page.tsx:257`
- [x] **[RES]** `RateLimiter` menyimpan entri `clients` untuk setiap kombinasi IP dan path tanpa mekanisme eviction global. Slice timestamp memang dibersihkan, tetapi key lama tidak pernah dihapus dari map, sehingga traffic dari banyak IP acak akan membuat memori proses tumbuh terus selama server hidup. Status: **sudah diperbaiki** dengan cleanup berkala dan test regresi. - `apps/backend/internal/platform/middleware/ratelimit.go:12-16`, `apps/backend/internal/platform/middleware/ratelimit.go:30-58`

## Masalah Minor
- [x] **[TEST]** Verifikasi otomatis penuh backend dan frontend kini sama-sama lulus. Setelah ignore untuk file vendor/script util ditambahkan dan batch perbaikan source diselesaikan, hasil lint frontend turun dari **409 problem (74 error, 335 warning)** menjadi **78 warning tanpa error**. Warning yang tersisa didominasi `@next/next/no-img-element`, `@typescript-eslint/no-unused-vars`, dan beberapa `react-hooks/exhaustive-deps`. - `apps/frontend`

## Hasil Verifikasi
- Lint: LULUS DENGAN WARNING (`npm run lint` di `apps/frontend`, 78 warning dan 0 error)
- Test: LULUS (`go test ./...` di `apps/backend`)
- Build: TIDAK DIJALANKAN
- Cakupan: Tidak tersedia

## Aturan yang Diterapkan
- `persona/.agent/rules/rule-priority.md`
- `persona/.agent/rules/security-principles.md`
- `persona/.agent/rules/logging-and-observability-mandate.md`
- `persona/.agent/skills/code-review/SKILL.md`
- `persona/.agent/workflows/audit.md`
