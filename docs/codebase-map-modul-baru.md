# Codebase Map Untuk Modul Baru

Dokumen ini merangkum cara kerja aplikasi Al-Maa agar penambahan modul baru mengikuti pola yang sudah ada.

## 1. Gambaran Umum

- Repo ini adalah monorepo dengan 2 aplikasi utama:
  - `apps/frontend`: Next.js App Router + React + TypeScript + Tailwind CSS
  - `apps/backend`: Go + Chi Router + SQLite
- Deploy production menggunakan Docker Compose di:
  - `deploy/almaparung/docker-compose.yml`
- Database utama memakai SQLite dengan mode WAL.

## 2. Struktur Penting

### Frontend

- `apps/frontend/src/app`
  - route publik dan admin berbasis App Router
- `apps/frontend/src/components`
  - komponen UI bersama, auth provider, layout, modal, dsb
- `apps/frontend/src/lib/api.ts`
  - pintu utama semua request HTTP ke backend
- `apps/frontend/src/middleware.ts`
  - proteksi awal route `/admin` dan `/portal` via cookie

### Backend

- `apps/backend/cmd/api/main.go`
  - entrypoint server, mount semua route, middleware global
- `apps/backend/internal/features/*`
  - domain per fitur
- `apps/backend/internal/platform/*`
  - database, middleware, logger, AI helper
- `apps/backend/internal/validators/*`
  - validasi payload request

### Deploy

- `deploy/almaparung/docker-compose.yml`
  - service frontend dan backend
- `deploy/almaparung/.env`
  - environment production
- `deploy/almaparung/data/`
  - SQLite db + uploads

## 3. Pola Arsitektur Backend

Setiap fitur backend umumnya mengikuti pola:

1. `repository.go`
   - model struct
   - query SQL
   - operasi CRUD
2. `handler.go`
   - parsing request
   - validasi
   - otorisasi berbasis middleware
   - response JSON
3. optional file tambahan
   - `sanitize.go`
   - test/benchmark

Contoh representatif:
- `apps/backend/internal/features/news/handler.go`
- `apps/backend/internal/features/news/repository.go`

### Cara route backend dipasang

Semua route utama dirakit di:
- `apps/backend/cmd/api/main.go`

Pola umumnya:
- public read route
- authenticated route
- role-based route
- route yang ikut `RequireLicense`

### Middleware yang aktif

- request ID
- logger
- recoverer
- CORS
- auth JWT via cookie `alma_token`
- role check
- rate limiter
- license gate

## 4. Pola Data dan Database

Schema tabel dibuat di:
- `apps/backend/internal/platform/database/db.go`

Poin penting:
- tabel dibuat dengan `CREATE TABLE IF NOT EXISTS`
- migrasi lanjutan dijalankan lewat `runMigrations()`
- SQLite dipakai dengan:
  - `journal_mode=WAL`
  - `busy_timeout=5000`
  - `SetMaxOpenConns(1)`

Artinya, modul baru yang butuh tabel baru idealnya:

1. tambah definisi tabel dasar di `createTables()`
2. kalau ada perubahan schema pada data existing, tambahkan migration yang aman di `runMigrations()`

## 5. Pola Auth dan Akses

### Frontend

- `apps/frontend/src/middleware.ts`
  - hanya cek ada/tidaknya cookie untuk buka `/admin` dan `/portal`
- `apps/frontend/src/components/AuthProvider.tsx`
  - cek sesi aktual ke `/api/me`
  - simpan user aktif di state context
  - redirect berdasarkan role

### Backend

- login set cookie JWT `alma_token`
- sumber role ada di tabel `users`
- role utama yang dipakai:
  - `superadmin`
  - `bendahara`
  - `panitia_psb`
  - `tim_media`
  - `admin`
  - `user`

## 6. Pola Frontend

Frontend tidak memecah client API per fitur. Hampir semua request dikumpulkan dalam satu file:
- `apps/frontend/src/lib/api.ts`

Jadi kalau bikin modul baru, pola yang konsisten adalah:

1. tambah endpoint helper di `api.ts`
2. buat page admin/public di `src/app/...`
3. gunakan komponen reusable di `src/components`
4. pakai `useToast` untuk feedback
5. pakai `useAuth` bila butuh user/role

### Pola halaman admin

Umumnya:
- page client component
- fetch data via `lib/api.ts`
- state lokal memakai `useState`, `useEffect`, `useCallback`
- toast untuk sukses/gagal
- redirect memakai `router.push` atau `router.replace`

Contoh:
- `apps/frontend/src/app/admin/users/page.tsx`
- `apps/frontend/src/app/admin/news/add/page.tsx`

## 7. Pola Modul Baru

Kalau kita ingin menambah modul baru, checklist amannya biasanya begini:

### Backend

1. buat folder baru di `apps/backend/internal/features/<nama-modul>`
2. buat `repository.go`
3. buat `handler.go`
4. tambah validator bila perlu di `apps/backend/internal/validators`
5. tambah tabel/migrasi di `internal/platform/database/db.go`
6. mount route di `apps/backend/cmd/api/main.go`
7. pasang middleware yang sesuai:
   - public
   - auth
   - role
   - license

### Frontend

1. tambah helper API di `apps/frontend/src/lib/api.ts`
2. buat halaman admin/public baru di `apps/frontend/src/app/...`
3. sambungkan ke layout/menu bila memang harus muncul di navigasi
4. pakai pola feedback yang sudah ada:
   - `useToast`
   - loading state
   - empty state
   - confirm dialog bila destructive

## 8. Aturan Praktis Saat Nambah Modul

- Jangan membuat client API baru terpisah kalau belum ada alasan kuat; ikuti pola `src/lib/api.ts`.
- Jangan mount route backend tersebar; tetap pusatkan di `cmd/api/main.go`.
- Jangan menambah tabel tanpa mempertimbangkan migrasi untuk environment yang sudah punya data.
- Jangan bypass auth/role di frontend saja; proteksi utama tetap harus di backend.
- Untuk modul admin, selalu pikirkan:
  - role mana yang boleh akses
  - apakah modul ini ikut gate lisensi
  - apakah butuh activity log
  - apakah ada upload file

## 9. Modul Representatif Sebagai Referensi

- CRUD konten:
  - `news`
  - `programs`
  - `teachers`
  - `videos`
- data operasional:
  - `payments`
  - `messages`
  - `agendas`
- alur role/user:
  - `auth`
  - `users`
  - `portal`
  - `psb`

## 10. Kesimpulan

Kalau ingin menambah modul baru dengan aman, anggap repo ini memakai pola:

- backend feature-per-folder
- frontend route-per-page + shared API client
- auth dan role di backend
- session berbasis cookie JWT
- database SQLite dengan migrasi manual-terkontrol
- deploy lewat Docker Compose

Dengan pola itu, modul baru sebaiknya dibangun end-to-end: schema, repository, handler, route mount, helper API frontend, halaman UI, lalu role/access rule-nya.
