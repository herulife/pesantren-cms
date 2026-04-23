---
layout: default
title: Adaptasi
nav_order: 8
---

# Mengadaptasi Pengaturan
{: .no_toc }

Sesuaikan pengaturan dengan tipe proyek, bahasa pemrograman, dan tim Anda.
{: .fs-6 .fw-300 }

<details open markdown="block">
  <summary>Daftar isi</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## Adaptasi Tipe Proyek

Pengaturan ini mendukung berbagai struktur proyek secara langsung. Untuk menyesuaikannya, **cukup ubah `project-structure.md`** — file itu adalah satu-satunya sumber validitas (single source of truth) pengaturan direktori.

| Tipe Proyek | Apa yang Harus Diubah |
|-------------|-----------------------|
| **Monorepo** (bawaan) | Gunakan bawaannya — `apps/backend/`, `apps/frontend/`, `apps/mobile/` |
| **Backend tunggal** | Ratakan ke root: `cmd/`, `internal/` berada di root proyek (tanpa folder `apps/`) |
| **Frontend tunggal** | Ratakan ke root: `src/` berada di root proyek (tanpa folder `apps/`) |
| **Mobile tunggal** | Ratakan ke root: `lib/` berada di root proyek (tanpa folder `apps/`) |
| **Microservices** | Satu direktori per layanan diletakkan di bawah `apps/` |
| **Full-stack + mobile** | Gunakan ketiga bagian pengaturan di bawah folder `apps/` |

---

## Tata Letak Monorepo

Tata letak bawaan untuk aplikasi full-stack:

```
apps/
  backend/                      # Server API (Go)
    cmd/api/main.go             # Titik masuk program (Entry point)
    internal/
      platform/                 # Kerangka kerja (database, server, logger)
      features/                 # Fitur bisnis (potongan vertikal)
        task/
          service.go            # API Publik
          handler.go            # Penangan (handlers) HTTP
          logic.go              # Logika bisnis
          models.go             # Struct domain
          storage.go            # Antarmuka (Interface) penyimpanan
          storage_pg.go         # Implementasi Postgres
          storage_mock.go       # Implementasi Mock
  frontend/                     # Aplikasi Vue/React
    src/
      features/                 # Fitur bisnis (potongan vertikal)
        task/
          components/           # Komponen spesifik fitur
          store/                # Pinia/Redux store
          api/                  # Antarmuka + Implementasi API
          services/             # Logika bisnis
      components/               # Komponen UI bersama (shared)
      views/                    # Entry points perutean (view)
      layouts/                  # Kerangka cangkang aplikasi (App shell)
infra/                          # Docker, K8s, Terraform
e2e/                            # Kumpulan tes End-to-end (E2E)
```

---

## Backend Tunggal

Untuk proyek khusus backend, ratakan susunannya langsung ke root:

```
cmd/
  api/main.go                   # Titik masuk HTTP server
  cli/main.go                   # Tool CLI (opsional)
  worker/main.go                # Background worker (opsional)
internal/
  platform/
    database/
    server/
    logger/
  features/
    task/
      service.go
      handler.go
      logic.go
      storage.go
```

**Langkah adaptasi:**
1. Edit file `project-structure.md` — hapus awalan nama folder `apps/backend/`
2. Edit file `4-verify.md` — perbarui rute tujuan (paths) pada perintah validasinya
3. Hapus aturan terkait frontend jika tidak dibutuhkan

---

## Frontend Tunggal

Untuk proyek khusus frontend, ratakan susunannya langsung ke root:

```
src/
  features/
    task/
      components/
      store/
      api/
      services/
  components/
  views/
  layouts/
  router/
  plugins/
  App.vue
  main.ts
```

**Langkah adaptasi:**
1. Edit `project-structure.md` — hapus awalan nama folder `apps/frontend/`
2. Edit `4-verify.md` — hilangkan perintah validasi milik backend
3. Hapus aturan spesifik backend jika tidak dibutuhkan (desain basis data, dll.)

---

## Mobile (Flutter / React Native)

```
lib/
  core/                         # Framework dasar (DI, network, theme, router)
    di/injection.dart
    network/api_client.dart
    theme/app_theme.dart
    router/app_router.dart
  features/                     # Fitur bisnis (vertical slices)
    task/
      screens/                  # Layar penuh (route targets)
      widgets/                  # Widget khusus fitur
      state/                    # Manajemen state (BLoC/Cubit/Riverpod)
      models/                   # Model-model domain
      logic/                    # Murni logika bisnis
      repository/               # Abstraksi akses data
      api/                      # Panggilan REST API
  shared/                       # Widget UI global, utility, models
test/                           # Pengujian unit dan widget tests
integration_test/               # E2E tests untuk Mobile
```

**Perbedaan utama dibandingkan frontend web:**
- `screens/` menggantikan direktori `views/`
- `widgets/` menggantikan direktori `components/`
- `state/` menggantikan direktori `store/`
- `repository/` menggantikan `api/` (mobile sering melakukan cache data secara lokal)
- `core/di/` menangani proses injeksi dependensi

---

## Layanan Mikro (Microservices)

Setiap layanan berada di direktorinya sendiri di bawah folder `apps/`:

```
apps/
  user-service/
    cmd/api/main.go
    internal/features/...
    go.mod
    Dockerfile
  order-service/
    cmd/api/main.go
    internal/features/...
    go.mod
    Dockerfile
shared/                         # Kontrak lintas layanan (protobuf, properti tipe data bersama)
infra/
  docker-compose.yml
```

**Aturan kunci:**
- Tiap layanan mempunyai `go.mod` dan file `Dockerfile`-nya masing-masing
- Tiap layanan mematuhi susunan tata-letak file internal yang sama
- Direktori `shared/` disiapkan untuk menyimpan kontrak/perjanjian lintas layanan — jaga folder ini agar tetap sekecil mungkin
- Berbagai layanan saling berkomunikasi via panggilan API (API calls) atau antrean pesan (message queues), dilarang meng-import (direct imports) skrip layanan lain secara langsung!

---

## Adaptasi Spesifik Bahasa Pemrograman

### Go (Default Backend)

Sebagian besar aturan sudah sangat dioptimalkan untuk bahasa Go. Tidak perlu perombakan apapun untuk proyek Go.

**Perintah Verifikasi:**
```bash
gofumpt -l -e -w .
go vet ./...
staticcheck ./...
gosec -quiet ./...
go test -race ./...
```

### TypeScript / Vue (Default Frontend)

Sistem telah mendukung erat ekosistem TypeScript/Vue secara bawaan. Tidak perlu diubah.

**Perintah Verifikasi:**
```bash
pnpm run lint --fix
npx vue-tsc --noEmit
pnpm run test
```

### Python

Tambahkan perintah verifikasi khusus Python ke dalam file `4-verify.md`:

```bash
# Format
black .
isort .

# Linter
ruff check .
mypy .

# Security
bandit -r . -x tests

# Tests
pytest --cov=.
```

### Rust

Tambahkan perintah verifikasi khusus Rust ke dalam file `4-verify.md`:

```bash
# Format
cargo fmt -- --check

# Linter
cargo clippy -- -D warnings

# Tests
cargo test

# Security
cargo audit
```

---

## Adaptasi Ukuran Tim

### Developer Solo (Satu Orang)

Seluruh sistem dapat langsung dipakai dengan sangat baik oleh developer solo. Pertimbangkan:
- Gunakan perintah `/quick-fix` untuk sebagian besar perubahan wajar sehari-hari (jauh lebih cepat dibandingkan `/orchestrator` utuh)
- Boleh melewati E2E tes kecuali Anda sedang membangun fitur front-end untuk sisi pengunjung (user-facing)
- Jalankan pengecekan `/audit` secara berkala saja ketimbang menjalankannya di setiap aksi komit kode (commit) kecil.

### Tim Skala Kecil (2-5 Orang)

- Gunakan `/orchestrator` untuk penggarapan setiap fitur baru
- Gunakan alat `/audit` khusus untuk tinjauan antar silang regu tim (karya salah seorang anggota tim diperiksa oleh agen pada komputer tim lainnya)
- ADR (Architecture Decision Records) sangatlah penting karena hal ini mendokumentasikan serpihan kesepakatan pijakan antasesama kepala penanggung jawab di tim tersebut.
- Arsip riwayat riset terbukti membendung terjadinya pengulangan riset sia-sia ganda atas topik yang nyatanya sudah dicari telisik oleh sesama anggota tim lainnya beberapa hari yang lalu.

### Tim Besar (6+ Orang)

- Setiap unit sub-tim boleh menyesuaikan dengan bebas nilai ambang batasan peraturannya masing-masing dalam wilayah kekuasaan pengerjaan layanannya tersendiri
- Pemakaian pendekatan basis microservices diiringi modifikasi pengecualian pada sekat pembatas aturan tiap layanan
- Paksa kewajiban pengerahan `/audit` setiap ada sesi pertarikan penggabungan kode sumber (merges/PRs to main)
- Pakai pedoman persekriptan aturan pada Pipeline (CI/CD DevOps) agar otomatis tertegakkan dalam pipa (pipeline) yang melaju terprogram setiap hari

---

## Membuang Aturan yang Tidak Diperlukan

Jika terdapat aturan yang benar-benar tidak dibutuhkan untuk garapan proyek Anda, Anda bebas untuk menghapusnya demi meringkas waktu kerja dan memperingan bacaan sistem agen AI Anda:

| Jika Proyek Anda... | Anda Boleh Menghapus |
|-------|----------------|
| Tidak memiliki frontend | `accessibility-principles.md` |
| Tidak memakai database | `database-design-principles.md` |
| Tidak memakai CI/CD | `ci-cd-principles.md` |
| Bukan monorepo | Modifikasi `project-structure.md` (tapi jangan pernah menghapusnya) |

**Jangan pernah menghapus aturan dasar ini:**
- `rugged-software-constitution.md`
- `security-mandate.md`
- `code-completion-mandate.md`
- `rule-priority.md`

Keempat file aturan ini membentuk fondasi utuh sistem agar tetap bisa bekerja tegak secara menyeluruh.

---

## File Apa Saja yang Diedit

Saat melakukan adaptasi skema proyek, berikut ini adalah deretan nama file inti tempat Anda paling sering untuk merombak parameter pengaturannya secara sadar menyesuaikan format gaya ekosistem baru pengerjaan. 

| Nama File | Apa yang harus diedit |
|------|-------------|
| `project-structure.md` | Tata letak susunan rumah direktori rak folder sistem beserta navigasi tumpuan alamat (*app paths*) |
| `4-verify.md` | Kalimat-kalimat instruksi perintah validasi linter eksekusi milik bahasa pemrograman di terminal ekosistem tim Anda |
| `code-completion-mandate.md` | Skrip standar kualitas akhir milik serangkaian *stack* perkakas kerja tumpuan anda |
| Tambah/hapus file aturan rules | Merombak aturan untuk menyelaraskannya guna menyokong target gaya rancangan proyek yang diidamkan |
