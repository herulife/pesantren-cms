# Audit Kode: Aplikasi Darussunnah
Tanggal: 2026-04-22 14:28

## Ringkasan
- **File yang di-review:** 11 file inti backend/frontend + aturan di `persona/.agent`
- **Masalah ditemukan:** 5 (1 kritis, 3 utama, 1 minor)
- **Cakupan test:** Tidak dapat diverifikasi; file test backend sangat terbatas dan tidak ditemukan test frontend

## Masalah Kritis
- [ ] **[SEC]** Endpoint upload menerima ekstensi apa pun dari nama file asli lalu langsung menyimpannya ke folder publik tanpa validasi MIME, allowlist tipe, atau sanitasi konten. Karena route `/api/upload` dapat diakses oleh semua user terautentikasi dan file dilayani dari `/uploads/*`, user biasa bisa mengunggah file aktif seperti `.html`/`.svg`/scriptable content dan menyajikannya publik. — `apps/backend/internal/features/upload/handler.go:23-70`, `apps/backend/cmd/api/main.go:249-255`, `apps/backend/cmd/api/main.go:333-335`

## Masalah Utama
- [ ] **[DATA]** Fitur wallet tidak menjamin wallet row ada sebelum `SetPIN` dan `ProcessTransaction` dipanggil. `SetPIN` melakukan `UPDATE` tanpa mengecek `RowsAffected`, sehingga request pertama bisa sukses palsu saat wallet belum pernah dibuat. `TopUp` juga langsung memanggil `ProcessTransaction`, yang akan gagal `sql.ErrNoRows` untuk user yang belum pernah membuka wallet. — `apps/backend/internal/features/wallet/handler.go:57-77`, `apps/backend/internal/features/wallet/handler.go:80-104`, `apps/backend/internal/features/wallet/repository.go:62-68`, `apps/backend/internal/features/wallet/repository.go:81-94`
- [ ] **[SEC]** Rate limiter mengandalkan `X-Forwarded-For`/`X-Real-IP` mentah tanpa validasi trusted proxy, sehingga client bisa spoof IP untuk melewati limit login/register/contact. Konfigurasinya juga jauh lebih longgar dari aturan persona untuk endpoint auth (`/login` = 100/minute, `/register` = 3/hour) dan `/auth/google` sama sekali tidak dibatasi. — `apps/backend/internal/platform/middleware/ratelimit.go:64-76`, `apps/backend/cmd/api/main.go:140-155`
- [ ] **[OBS]** Banyak operation entry point tidak memenuhi mandat observability persona: handler wallet, payments, dan upload tidak memiliki log start/success/failure dengan correlation ID, sehingga insiden finansial atau penyalahgunaan upload akan sulit ditelusuri. — `apps/backend/internal/features/wallet/handler.go:19-143`, `apps/backend/internal/features/payments/handler.go:42-110`, `apps/backend/internal/features/upload/handler.go:23-70`

## Masalah Minor
- [ ] **[TEST]** Cakupan pengujian belum memadai untuk area kritis. Backend hanya memiliki sedikit test yang terlihat (`auth/repository`, `videos/handler`, `validators` dan beberapa benchmark), sementara saya tidak menemukan test frontend sama sekali. Area sensitif seperti upload, middleware auth/rate-limit, wallet, dan payments belum tampak terlindungi test regresi. — `apps/backend/internal/features/auth/repository_test.go`, `apps/backend/internal/features/videos/handler_test.go`, `apps/backend/internal/validators/validators_test.go`

## Hasil Verifikasi
- Lint: GAGAL diverifikasi (perintah `npm run lint` timeout >120s)
- Test: GAGAL diverifikasi (perintah `go test ./...` timeout >120s)
- Build: GAGAL diverifikasi (perintah `npm run build` timeout >120s)
- Cakupan: Tidak tersedia

## Aturan Persona yang Diterapkan
- `persona/.agent/rules/rule-priority.md`
- `persona/.agent/rules/security-principles.md`
- `persona/.agent/rules/error-handling-principles.md`
- `persona/.agent/rules/logging-and-observability-mandate.md`
- `persona/.agent/rules/testing-strategy.md`
