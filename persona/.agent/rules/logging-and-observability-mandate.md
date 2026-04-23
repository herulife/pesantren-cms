---
trigger: always_on
---

## Mandat Logging dan Observabilitas

### Persyaratan Universal: Semua Operasi Harus Di-log

**Setiap titik masuk operasi HARUS menyertakan logging. Tanpa pengecualian.**

**Apa yang termasuk "operasi" (logging wajib):**
- Endpoint API dan handler permintaan
- Pekerjaan latar belakang dan worker antrian
- Event handler dan konsumer pesan
- Tugas terjadwal dan cron job
- Perintah CLI
- Panggilan layanan eksternal (ke API pihak ketiga)
- Transaksi database

**Apa yang BUKAN operasi (tanpa logging langsung):**
- Fungsi logika bisnis murni (dipanggil di dalam operasi)
- Fungsi utilitas dan helper
- Transformasi data dan validator

**Persyaratan logging minimum (3 titik):**
1. **Mulai operasi:** Log di titik masuk dengan konteks (correlationId, userId, nama operasi)
2. **Sukses operasi:** Log penyelesaian dengan durasi dan identifier hasil
3. **Kegagalan operasi:** Log error dengan konteks lengkap (correlationId, detail error, stack trace)

**Konteks wajib di semua log:**
- `correlationId`: UUID untuk pelacakan lintas layanan
- `operation`: Nama operasi yang jelas (misalnya, "create_order", "process_payment")
- `duration`: Waktu eksekusi dalam milidetik
- `userId`: Aktor yang memicu operasi (jika berlaku)
- `error`: Konteks error lengkap saat gagal

**Strategi penegakan:**
Utamakan middleware, dekorator, atau interceptor framework untuk logging operasi otomatis daripada logging manual di setiap handler. Ini memastikan cakupan tanpa duplikasi kode.

**Saat mengimplementasikan titik masuk operasi apapun, Anda HARUS menambahkan logging sebelum melanjutkan dengan implementasi.**

### Panduan Implementasi

Untuk pola implementasi yang detail, lihat:
- **Prinsip Logging dan Observabilitas @logging-and-observability-principles.md** - Panduan implementasi lengkap termasuk:
  - Level log dan kapan menggunakannya
  - Pola logging terstruktur
  - Implementasi spesifik bahasa (Go, TypeScript, Python)
  - Pertimbangan keamanan (apa yang tidak boleh di-log)
  - Praktik terbaik performa
  - Pola log berdasarkan tipe operasi
  - Integrasi pengujian dan monitoring

### Prinsip Terkait
- Prinsip Logging dan Observabilitas @logging-and-observability-principles.md
- Prinsip Penanganan Error @error-handling-principles.md
- Prinsip Desain API @api-design-principles.md