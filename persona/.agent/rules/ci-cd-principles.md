---
trigger: model_decision
description: Saat mengkonfigurasi pipeline CI/CD, proses deployment, strategi rilis, atau konfigurasi build
---

## Prinsip CI/CD

> **Cakupan agen:** Aturan ini paling berguna saat menulis manifes CI/CD
> (Dockerfile, docker-compose, GitHub Actions, GitLab CI, dll.).
> Gunakan prinsip-prinsip ini untuk menghasilkan konfigurasi pipeline yang benar dan berkualitas produksi.

### Desain Pipeline

**Tahapan Pipeline (berurutan):**
1. **Lint** — analisis statis, pemeriksaan format
2. **Build** — kompilasi, bundel, hasilkan artefak
3. **Unit Test** — test cepat dengan dependensi yang di-mock
4. **Test Integrasi** — test terhadap dependensi nyata (Testcontainers)
5. **Pemindaian Keamanan** — audit dependensi, SAST, deteksi secret
6. **Deploy** — push ke lingkungan target

**Aturan:**
- **Gagal cepat** — jalankan pemeriksaan termurah terlebih dahulu (lint sebelum build, build sebelum test)
- **Pipeline harus deterministik** — input yang sama = output yang sama, setiap saat
- **Pertahankan pipeline di bawah 15 menit** — optimalkan tahapan yang lambat
- **Jangan pernah melewati langkah yang gagal** — perbaiki pipeline, jangan melewatinya

### Pola Manifes

#### Dockerfile (Multi-Stage Build)
```dockerfile
# Tahap 1: Build
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download               # Cache dependensi
COPY . .
RUN CGO_ENABLED=0 go build -o /bin/api ./cmd/api

# Tahap 2: Runtime (image minimal)
FROM gcr.io/distroless/static-debian12
COPY --from=builder /bin/api /bin/api
EXPOSE 8080
CMD ["/bin/api"]
```

**Aturan:**
- Selalu gunakan multi-stage build (build → runtime)
- Kunci versi base image (jangan pernah gunakan `:latest`)
- Salin file dependensi terlebih dahulu, kemudian source (caching layer)
- Gunakan image runtime minimal (distroless, alpine, scratch)
- Jangan pernah menyalin `.env`, secret, atau `.git` ke dalam image

#### Docker Compose (Development Lokal)
```yaml
services:
  backend:
    build:
      context: ./apps/backend      # Path sesuai project-structure.md
    ports:
      - "8080:8080"
    env_file: .env                  # Konfigurasi lingkungan
    depends_on:
      postgres:
        condition: service_healthy
  
  postgres:
    image: postgres:16-alpine      # Kunci versi
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

**Aturan:**
- Selalu definisikan health check untuk dependensi
- Gunakan `depends_on` dengan `condition: service_healthy`
- Kunci semua versi image
- Gunakan volume untuk data persisten
- Jangan pernah hardcode kredensial — gunakan env_file atau variabel lingkungan

#### GitHub Actions
```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version-file: go.mod   # Kunci melalui go.mod
          cache: true               # Cache dependensi
      - run: gofumpt -l -e -d .
      - run: go vet ./...
      - run: staticcheck ./...

  test:
    needs: lint                     # Gagal cepat: lint sebelum test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version-file: go.mod
          cache: true
      - run: go test -race -cover ./...

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t app:${{ github.sha }} .
```

**Aturan:**
- Kunci versi action (`@v4`, bukan `@latest` atau `@main`)
- Gunakan `needs:` untuk menegakkan urutan tahapan
- Cache dependensi (`cache: true` di setup action)
- Gunakan `go-version-file` / `node-version-file` daripada hardcode versi
- Jangan pernah menaruh secret di file workflow — gunakan `${{ secrets.NAME }}`

### Promosi Lingkungan

```
dev → staging → production
```

- **Dev:** Di-deploy setiap push ke branch fitur
- **Staging:** Di-deploy saat merge ke main/develop
- **Production:** Di-deploy melalui persetujuan manual atau rilis otomatis

**Aturan:**
- Artefak yang sama dipromosikan melalui lingkungan (build sekali, deploy berkali-kali)
- Konfigurasi spesifik lingkungan melalui variabel lingkungan, bukan flag build
- Jangan pernah deploy langsung ke produksi tanpa validasi staging

### Daftar Periksa CI/CD

- [ ] Tahapan pipeline berjalan dalam urutan yang benar (lint → build → test → deploy)?
- [ ] Semua versi dikunci (base image, CI action, versi alat)?
- [ ] Caching dependensi diaktifkan?
- [ ] Multi-stage Docker build digunakan?
- [ ] Tidak ada secret di file konfigurasi (gunakan env var atau secrets manager)?
- [ ] Health check didefinisikan untuk semua dependensi?
- [ ] Pipeline selesai dalam waktu di bawah 15 menit?

### Prinsip Terkait
- Mandat Kelengkapan Kode @code-completion-mandate.md (validasi sebelum kirim)
- Mandat Keamanan @security-mandate.md (manajemen secret)
- Prinsip Alur Kerja Git @git-workflow-principles.md (strategi branch)
- Struktur Proyek @project-structure.md (path layanan)
