---
description: Fase implementasi - siklus TDD untuk menulis kode
---

# Fase 2: Implementasi

## Tujuan
Menulis kode produksi mengikuti Test-Driven Development (TDD).

## Prasyarat
- Fase 1 (Riset) selesai
- Log riset ada di `docs/research_logs/{nama_fitur}.md`
- Tandai tugas sebagai `[/]` di task.md

## Langkah-langkah

**Atur Mode:** Gunakan `task_boundary` untuk mengatur mode ke **EXECUTION**.

### 1. Buat File Test
Tempatkan bersama implementasi:
- Go: `*_test.go`
- TypeScript: `*.spec.ts`

### 2. Tulis Test yang Gagal (Merah)
```go
func TestCreateTask_Success(t *testing.T) {
    // Siapkan
    mockStore := NewMockStorage()
    service := NewService(mockStore, logger)
    
    // Jalankan
    task, err := service.Create(ctx, userID, req)
    
    // Verifikasi
    require.NoError(t, err)
    assert.Equal(t, "Test Task", task.Title)
}
```

Jalankan test untuk memastikan gagal:
```bash
# Go
go test -v ./internal/features/{fitur}/...

# Frontend
pnpm run test -- --watch
```

### 3. Tulis Kode Minimal (Hijau)
Tulis HANYA cukup kode untuk membuat test lulus.

Jalankan test untuk memastikan lulus:
```bash
go test -v ./internal/features/{fitur}/...
```

### 4. Refaktor (Biru)
Tingkatkan kode sambil mempertahankan test tetap hijau:
- Tingkatkan penamaan dan struktur
- Hapus duplikasi
- **Ikuti aturan agen yang telah ditentukan** (baca `.agent/rules/*.md` yang berlaku)
- **Tangani error** sesuai Prinsip Penanganan Error
- **Tambahkan logging** sesuai Mandat Logging dan Observabilitas
- Jika refactoring kompleks, aktifkan skill **Sequential Thinking**
- Jika debugging test yang gagal, aktifkan skill **Protokol Debugging**
- Pastikan test masih lulus

### 5. Ulangi
Lanjutkan Merah-Hijau-Refaktor untuk setiap perilaku.

## Persyaratan Unit Test
- Mock semua dependensi (interface)
- Uji jalur bahagia, jalur error DAN kasus tepi
- Target cakupan >85% pada logika domain

## Perintah Development
```bash
# Jalankan test spesifik
go test -v -run TestCreateTask ./internal/features/task/...

# Jalankan dengan cakupan
go test -cover ./internal/features/task/...

# Test frontend
pnpm run test
pnpm run test -- --coverage
```

## Kriteria Penyelesaian
- [ ] Unit test ditulis dan lulus
- [ ] Implementasi selesai
- [ ] Penanganan error mengikuti prinsip
- [ ] Logging ditambahkan ke operasi
- [ ] Kode mengikuti pola proyek
- [ ] Daftar semua adapter I/O yang dimodifikasi atau dibuat (file storage, klien API eksternal)
- [ ] Jika adapter dimodifikasi: Fase 3 WAJIB — jangan lewati



## Fase Berikutnya
Lanjutkan ke **Fase 3: Integrasi** (`/3-integrate`)