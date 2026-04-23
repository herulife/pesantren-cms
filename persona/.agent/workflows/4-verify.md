---
description: Fase verifikasi - menjalankan rangkaian validasi lengkap
---

# Fase 4: Verifikasi

## Tujuan
Menjalankan semua linter, analisis statis, dan test untuk memastikan kualitas kode.

> **Catatan:** Path di bawah mengikuti struktur proyek yang didefinisikan di `project-structure.md`.
> Sesuaikan path agar cocok dengan tata letak proyek yang sebenarnya (misalnya `apps/backend`, `apps/frontend`).

### Gerbang Fase 3
- [ ] Apakah ada file adapter storage/database yang dimodifikasi? Daftarkan: ___
- [ ] Apakah ada adapter API eksternal yang dimodifikasi? Daftarkan: ___
- [ ] Jika YA untuk salah satu: apakah test integrasi ditulis dan lulus?
- [ ] Jika TIDAK untuk keduanya: nyatakan mengapa Fase 3 dilewati

> KRITIS: Jika Anda memodifikasi `*_pg.go`, `*_integration*.go`, atau query SQL apapun, Fase 3 WAJIB. Jangan lanjutkan tanpa test integrasi.

### Gerbang Fase 3.5
- [ ] Apakah ada perubahan UI yang dimodifikasi? Daftarkan: ___
- [ ] Jika YA: apakah test E2E ditulis dan lulus?
- [ ] Jika TIDAK untuk keduanya: nyatakan mengapa Fase 3.5 dilewati

> KRITIS: Jika Anda memodifikasi `frontend/*` atau komponen frontend dan titik integrasi apapun, Fase 3.5 WAJIB. Jangan lanjutkan tanpa test E2E.

## Jika Fase Ini Gagal
Jika lint/test/build gagal:
1. **Jangan lanjutkan** ke Kirim
2. Perbaiki masalahnya (kembali ke Fase 2 atau 3 sesuai kebutuhan)
3. Jalankan ulang verifikasi lengkap
4. Hanya lanjutkan ketika SEMUA pemeriksaan lulus

## Langkah-langkah

**Atur Mode:** Gunakan `task_boundary` untuk mengatur mode ke **VERIFICATION**.

### 1. Validasi Backend
Jalankan rangkaian validasi LENGKAP untuk path backend seperti yang didefinisikan di `project-structure.md`:

```bash
# // turbo
# Sesuaikan path sesuai project-structure.md (default: apps/backend)
cd apps/backend && gofumpt -l -e -w . && go vet ./... && staticcheck ./... && gosec -quiet ./... && go test -race ./...
```

### 2. Validasi Frontend
```bash
# // turbo
# Sesuaikan path sesuai project-structure.md (default: apps/frontend)
cd apps/frontend && pnpm run lint --fix && npx vue-tsc --noEmit && pnpm run test
```

### 3. Pemeriksaan Build
```bash
# Backend (path sesuai project-structure.md)
cd apps/backend && go build ./...

# Frontend (path sesuai project-structure.md)
cd apps/frontend && pnpm run build
```

### 4. Periksa Cakupan
Laporkan cakupan aktual dalam ringkasan tugas.

**Go:**
```bash
go test -cover ./internal/features/...
```

**Frontend:**
```bash
pnpm run test -- --coverage
```

## Kriteria Penyelesaian
- [ ] Semua pemeriksaan lint lulus
- [ ] Semua test lulus
- [ ] Build berhasil
- [ ] Cakupan dilaporkan (target >85% pada logika domain)

## Saat Sukses
Tandai tugas sebagai `[x]` di task.md (verifikasi lulus = tugas selesai).

## Fase Berikutnya
Lanjutkan ke **Fase 5: Kirim** (`/5-commit`)