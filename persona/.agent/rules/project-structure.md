---
trigger: always_on
---

> **File ini adalah SUMBER KEBENARAN TUNGGAL untuk organisasi proyek.**
> Semua aturan dan alur kerja lain yang mereferensikan path harus mengacu pada file ini.
> Untuk mengadaptasi pengaturan ke tipe proyek yang berbeda, edit file ini saja.

## Struktur Proyek

**Filosofi Struktur Proyek:**

- **Organisasi berdasarkan FITUR, bukan berdasarkan layer teknis**
- Setiap fitur adalah irisan vertikal
- Memungkinkan pertumbuhan modular, batasan yang jelas, dan kemampuan deploy yang independen

**Aturan Universal: Konteks → Fitur → Layer**

**1. Level 1: Cakupan Repositori:** Root berisi `apps/` yang mengelompokkan aplikasi-aplikasi berbeda (misalnya, `apps/backend`, `apps/frontend`, `apps/mobile`).

**2. Level 2: Organisasi Fitur**
   - **Aturan:** Bagi aplikasi menjadi irisan bisnis vertikal (misalnya, `user/`, `order/`, `payment/`).
   - **Anti-Pola:** JANGAN organisasi berdasarkan layer teknis (misalnya, `controllers/`, `models/`, `services/`) di level teratas.

### Tata Letak Spesifik Bahasa

Setiap tata letak mengikuti filosofi universal di atas. Muat tata letak yang relevan saat bekerja dengan bahasa atau framework tertentu:

| Tata Letak | File | Kapan Digunakan |
|---|---|---|
| Go Backend | @project-structure-go-backend.md | Layanan Go, API, alat CLI |
| Vue/React Frontend | @project-structure-vue-frontend.md | Frontend web (Vue, React, Svelte) |
| Flutter/Mobile | @project-structure-flutter-mobile.md | Aplikasi mobile (Flutter, React Native) |
| Rust/Cargo | @project-structure-rust-cargo.md | Binary, pustaka, workspace Rust |

> Struktur Fitur/Domain/UI/API ini tidak bergantung pada framework. Berlaku sama untuk bahasa atau framework apapun. File tata letak menyediakan konvensi spesifik bahasa (penamaan file, sistem modul, lokasi test) sambil mempertahankan arsitektur irisan vertikal.

### Adaptasi untuk Tipe Proyek Berbeda

| Tipe Proyek | Apa yang Diubah |
|-------------|-----------------|
| **Monorepo** (default) | Gunakan apa adanya — `apps/backend/`, `apps/frontend/`, `apps/mobile/` |
| **Backend tunggal** | Ratakan ke root: `cmd/`, `internal/` (Go) atau `src/` (Rust) di root proyek |
| **Frontend tunggal** | Ratakan ke root: `src/` di root proyek (tanpa pembungkus `apps/`) |
| **Mobile tunggal** | Ratakan ke root: `lib/` di root proyek (tanpa pembungkus `apps/`) |
| **Binary Rust tunggal** | Ratakan ke root: `src/`, `tests/`, `benches/` di root proyek dengan `Cargo.toml` |
| **Library Rust** | Ratakan ke root: `src/`, `examples/`, `tests/` di root proyek dengan `Cargo.toml` (target lib) |
| **Workspace Rust** | `crates/` di root dengan workspace `Cargo.toml` — setiap crate mengikuti tata letak crate tunggal secara internal |
| **Microservices** | Satu direktori per layanan di bawah `apps/` (masing-masing dengan `go.mod`/`Cargo.toml`/`Dockerfile` sendiri) |
| **Full-stack + mobile** | Gunakan semua file tata letak yang relevan di bawah `apps/` |

**Proyek aplikasi tunggal** tidak memerlukan direktori `apps/` — letakkan direktori root spesifik bahasa langsung di root proyek. Struktur internal (fitur, platform, dll.) tetap sama.

**Beberapa titik masuk (CLI, worker, dll.):**

Go:
```
cmd/
  api/main.go         # Titik masuk server HTTP
  cli/main.go         # Titik masuk alat CLI
  worker/main.go      # Titik masuk worker latar belakang
```

Rust:
```
src/
  bin/
    api.rs            # Titik masuk server HTTP
    cli.rs            # Titik masuk alat CLI
    worker.rs         # Titik masuk worker latar belakang
  lib.rs              # Kode pustaka bersama
```

**Catatan microservices:**
- Setiap layanan adalah direktorinya sendiri di bawah `apps/` dengan `go.mod`/`Cargo.toml` dan `Dockerfile` sendiri
- Setiap layanan mengikuti tata letak yang sama secara internal (lihat file spesifik bahasa)
- Tambahkan `shared/` di root untuk kontrak lintas-layanan (protobuf, tipe bersama) — pertahankan ini minimal
- Layanan berkomunikasi melalui panggilan API atau message queue, tidak pernah impor langsung
