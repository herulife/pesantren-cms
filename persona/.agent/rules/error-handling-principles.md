---
trigger: model_decision
description: Saat mengimplementasikan penanganan error, bekerja dengan tipe error, atau merancang strategi pemulihan error (error validasi, pelanggaran aturan bisnis, kegagalan infrastruktur, pembersihan sumber daya)
---

## Prinsip Penanganan Error

**1. Jangan Pernah Gagal Secara Diam-diam:**

- Semua error harus ditangani secara eksplisit (tidak ada blok catch yang kosong)
- Jika Anda menangkap error, lakukan sesuatu dengannya (log, kembalikan, transformasi, coba ulang)

**2. Gagal Cepat:**

- Deteksi dan laporkan error sedini mungkin
- Validasi di batas sistem sebelum diproses
- Jangan memproses data yang tidak valid dengan harapan semua akan baik-baik saja

**3. Berikan Konteks:**

- Sertakan kode error, ID korelasi, pesan yang dapat ditindaklanjuti
- Informasi yang cukup untuk debugging tanpa mengekspos detail sensitif
- Contoh: "Query database gagal (correlation-id: abc-123)" bukan "SELECT * FROM users WHERE..."

**4. Pisahkan Tanggung Jawab:**

- Penangan berbeda untuk tipe error yang berbeda
- Error bisnis ≠ error teknis ≠ error keamanan

**5. Pembersihan Sumber Daya:**

- Selalu bersihkan sumber daya dalam skenario error (tutup file, lepaskan koneksi, buka kunci sumber daya)
- Gunakan pola yang sesuai bahasa (defer, finally, RAII, context manager)

**6. Tidak Ada Kebocoran Informasi:**

- Sanitasi pesan error untuk konsumsi eksternal
- Jangan mengekspos stack trace, query SQL, path file, struktur internal kepada pengguna
- Log detail lengkap secara internal, tampilkan pesan generik secara eksternal

### Format Objek Error Aplikasi (Internal/Log)
```
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Pesan error yang ramah pengguna",
  "correlationId": "uuid-untuk-pelacakan",
  "details": {
    "field": "email",
    "issue": "Format email tidak valid",
    "provided": "email-tidak-valid",
    "expected": "format email yang valid (pengguna@contoh.com)"
  }
}
```

### Daftar Periksa Penanganan Error

- [ ] Apakah semua jalur error ditangani secara eksplisit (tidak ada blok catch yang kosong)?
- [ ] Apakah error menyertakan ID korelasi untuk debugging?
- [ ] Apakah detail sensitif disanitasi sebelum dikembalikan ke klien?
- [ ] Apakah sumber daya dibersihkan di semua skenario error?
- [ ] Apakah error di-log pada level yang sesuai (warn untuk 4xx, error untuk 5xx)?
- [ ] Apakah pengujian error ditulis (kasus pengujian negatif)?
- [ ] Apakah penanganan error konsisten di seluruh aplikasi?

### Prinsip Terkait
- Prinsip Desain API @api-design-principles.md - Bagian Format Respons Error API
- Mandat Logging dan Observabilitas @logging-and-observability-mandate.md
- Prinsip Logging dan Observabilitas @logging-and-observability-principles.md
- Mandat Keamanan @security-mandate.md
- Prinsip Keamanan @security-principles.md
- Strategi Pengujian @testing-strategy.md
- Mandat Konkurensi dan Threading @concurrency-and-threading-mandate.md
- Prinsip Implementasi Konkurensi dan Threading @concurrency-and-threading-principles.md
