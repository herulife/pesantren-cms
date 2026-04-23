---
trigger: model_decision
description: Saat bekerja pada proyek backend Go, menyiapkan struktur proyek Go, atau mengorganisir layanan dan API Go
---

## Tata Letak Go Backend

Gunakan struktur ini untuk aplikasi backend Go. Prinsip irisan vertikal berlaku — fitur adalah paket, bukan layer.

```
  apps/
    backend/                          # Kode sumber aplikasi backend
      cmd/
        api/
          main.go                     # Titik masuk: Menghubungkan dependensi, router, memulai server
    internal/                         # Kode aplikasi privat
      platform/                       # Kebutuhan teknis dasar (bagian "Framework")
        database/                     # Logika koneksi DB
        server/                       # Pengaturan server HTTP (Router, Middleware)
        logger/                       # Pengaturan logging terstruktur
      features/                       # Fitur Bisnis (Irisan Vertikal)
        task/                         # Manajemen tugas
          # --- Definisi Interface ---
          service.go                  # API publik fitur ini (struct Service)

          # --- Delivery (HTTP) ---
          handler.go                  # Handler HTTP
          handler_test.go             # Test komponen (httptest + mock service)

          # --- Domain (Logika Bisnis) ---
          logic.go                    # Metode logika bisnis inti
          logic_test.go               # Unit test (Fungsi murni + mock storage)
          models.go                   # Struct domain (Task, NewTaskRequest)
          errors.go                   # Error spesifik fitur

          # --- Storage (Akses Data) ---
          storage.go                  # Definisi interface Storage
          storage_pg.go               # Implementasi Postgres
          postgres_integration_test.go # Test integrasi (DB Nyata/Testcontainers)
          storage_mock.go             # Implementasi mock
          ...
        order/                        # Manajemen pesanan
          handler.go
          logic.go
          storage.go
        ...
```

**Konvensi utama Go:**
- `cmd/` untuk titik masuk — setiap subdirektori adalah binary terpisah
- `internal/` untuk paket privat — ditegakkan oleh kompiler Go (tidak dapat diimpor secara eksternal)
- `platform/` untuk kebutuhan dasar (database, server, logger)
- `features/` untuk irisan bisnis vertikal — setiap fitur mandiri
- Test ditempatkan bersama kode yang diuji (sufiks `_test.go`)
- `go.mod` di root — modul tunggal untuk seluruh aplikasi

### Aturan Terkait
- Struktur Proyek @project-structure.md (filosofi inti)
