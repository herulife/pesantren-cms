---
trigger: always_on
---

## Mandat Kelengkapan Kode

### Persyaratan Universal

**Sebelum menandai tugas kode apapun sebagai selesai, Anda HARUS menjalankan pemeriksaan kualitas otomatis dan memperbaiki semua masalah.**

Ini TIDAK OPSIONAL. Mengirimkan kode tanpa validasi melanggar Manifesto Perangkat Lunak Tangguh @rugged-software-manifesto.

### Daftar Periksa Penyelesaian

Setiap tugas pembuatan kode mengikuti alur kerja ini:

1. **Hasilkan** - Tulis kode berdasarkan kebutuhan
2. **Validasi** - Jalankan pemeriksaan kualitas yang sesuai bahasa
3. **Perbaiki** - Perbaiki semua masalah yang terdeteksi
4. **Verifikasi** - Jalankan ulang pemeriksaan untuk mengonfirmasi perbaikan
5. **Kirim** - Tandai tugas selesai hanya setelah semua pemeriksaan lulus

**Jangan pernah melewati validasi "untuk menghemat waktu." Validasi ADALAH pekerjaannya.**

### Perintah Kualitas Spesifik Bahasa

Saat Anda menyelesaikan kode, jalankan perintah-perintah ini berdasarkan bahasanya:

#### Go
```bash
# Format
gofumpt -l -w .

# Analisis Statis
go vet ./...
staticcheck ./...

# Keamanan
gosec -quiet ./...

# Test
go test -race ./...
```

**Jika ada perintah yang gagal:**

1. Baca output error
2. Perbaiki masalah yang teridentifikasi dalam kode
3. Jalankan ulang perintah
4. Jangan lanjutkan sampai semua lulus

#### TypeScript/Vue
```bash
# Format & Lint
pnpm run lint --fix

# Pemeriksaan Tipe
npx vue-tsc --noEmit

# Test
pnpm run test
```

**Jika ada perintah yang gagal:**

1. Baca output error
2. Perbaiki masalah yang teridentifikasi
3. Jalankan ulang perintah
4. Jangan lanjutkan sampai semua lulus