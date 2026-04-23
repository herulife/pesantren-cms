---
description: Fase integrasi - menguji adapter dengan infrastruktur nyata
---

# Fase 3: Integrasi

## Tujuan
Menguji implementasi adapter (database, API eksternal) dengan infrastruktur nyata menggunakan Testcontainers.

## Prasyarat
- Fase 2 (Implementasi) selesai
- Unit test lulus

## Berlaku (Default: WAJIB)
Fase ini WAJIB secara default. Anda HANYA boleh melewatinya jika SEMUA kondisi berikut benar:
- [ ] Tidak ada file storage/repositori yang dimodifikasi atau dibuat
- [ ] Tidak ada file klien API eksternal yang dimodifikasi atau dibuat
- [ ] Tidak ada query atau skema database yang diubah
- [ ] Tidak ada kode message queue, cache, atau adapter I/O yang disentuh

Jika ADA adapter yang dimodifikasi, Anda HARUS menulis test integrasi.

## Jika Fase Ini Gagal
Jika test integrasi gagal:
1. Periksa log container untuk error
2. Verifikasi skema sesuai ekspektasi
3. Perbaiki implementasi adapter
4. Jalankan ulang test sebelum melanjutkan

## Langkah-langkah

### 1. Siapkan Testcontainers

**Contoh Go:**
```go
func TestPostgresStorage_Integration(t *testing.T) {
    if testing.Short() {
        t.Skip("melewati test integrasi")
    }
    
    ctx := context.Background()
    
    // Jalankan container PostgreSQL
    postgres, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
        ContainerRequest: testcontainers.ContainerRequest{
            Image:        "postgres:16-alpine",
            ExposedPorts: []string{"5432/tcp"},
            Env: map[string]string{
                "POSTGRES_USER":     "test",
                "POSTGRES_PASSWORD": "test",
                "POSTGRES_DB":       "test",
            },
            WaitingFor: wait.ForListeningPort("5432/tcp"),
        },
        Started: true,
    })
    require.NoError(t, err)
    defer postgres.Terminate(ctx)
    
    // Dapatkan string koneksi dan jalankan test
}
```

### 2. Tulis Test Integrasi
Penamaan file test: `*_integration_test.go` atau `*.integration.spec.ts`

```go
func TestPostgresStorage_CreateTask(t *testing.T) {
    // Menggunakan PostgreSQL nyata dari Testcontainers
    storage := NewPostgresStorage(pool)
    
    task, err := storage.Create(ctx, userID, req)
    
    require.NoError(t, err)
    assert.NotEqual(t, uuid.Nil, task.ID)
}
```

### 3. Jalankan Test Integrasi
```bash
# Go - jalankan semua test termasuk integrasi
go test -v ./...
```

### 4. Pemeriksaan Manual (Opsional)
- Jika melibatkan UI, buka browser untuk memverifikasi alur dasar.
- Jika melibatkan API, gunakan `curl` atau `client` untuk mengakses endpoint.

## Kriteria Penyelesaian
- [ ] Test integrasi ditulis untuk semua adapter
- [ ] Test lulus dengan infrastruktur nyata (Testcontainers)
- [ ] Query database diverifikasi terhadap PostgreSQL nyata

## Fase Berikutnya
Lanjutkan ke **Fase 4: Verifikasi** (`/4-verify`)