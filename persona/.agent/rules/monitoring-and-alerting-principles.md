---
trigger: model_decision
description: Saat mengimplementasikan health check, instrumentasi metrik, integrasi pelacakan error, atau kode observabilitas produksi
---

## Prinsip Monitoring dan Alerting

> **Cakupan:** Aturan ini mencakup apa yang agen **implementasikan dalam kode**. Urusan
> organisasional (definisi SLO/SLI, rotasi on-call, eskalasi alert) berada di luar cakupan —
> hal-hal tersebut adalah keputusan tim/organisasi, bukan urusan pembuatan kode.

### Health Check

**Setiap layanan harus mengekspos endpoint health check:**

- **`/health` (Liveness)** — "Apakah prosesnya hidup?"
  - Mengembalikan 200 jika proses berjalan
  - Tidak ada pemeriksaan dependensi (database, cache, dll.)
  - Digunakan oleh orkestrator untuk memutuskan apakah perlu restart

- **`/ready` (Readiness)** — "Bisakah layanan menerima lalu lintas?"
  - Memeriksa semua dependensi kritis (database, cache, message queue)
  - Mengembalikan 503 jika ada dependensi yang tidak tersedia
  - Digunakan oleh load balancer untuk merutekan lalu lintas

**Aturan:**
- Health check harus cepat (< 1 detik)
- Health check tidak boleh memiliki efek samping
- Pisahkan liveness dari readiness — keduanya melayani tujuan yang berbeda

### Instrumentasi Metrik

**Instrumentasi kode menggunakan metode RED untuk layanan:**
- **Rate** — permintaan per detik
- **Errors** — jumlah/tingkat error
- **Duration** — latensi permintaan (gunakan histogram, bukan rata-rata)

**Instrumentasi kode menggunakan metode USE untuk sumber daya:**
- **Utilization** — seberapa banyak sumber daya yang digunakan
- **Saturation** — seberapa banyak pekerjaan yang diantrekan
- **Errors** — jumlah error untuk sumber daya

**Aturan:**
- Gunakan counter untuk hal-hal yang hanya naik (permintaan, error)
- Gunakan gauge untuk hal-hal yang naik dan turun (koneksi, kedalaman antrian)
- Gunakan histogram untuk distribusi (latensi, ukuran respons)
- Labeli metrik secara konsisten (service, method, status_code)
- Jangan membuat label dengan kardinalitas tinggi (jangan gunakan ID pengguna sebagai label)

### Integrasi Pelacakan Error

- **Tangkap exception yang tidak tertangani** dengan stack trace lengkap
- **Sertakan konteks** — ID pengguna, ID permintaan, ID korelasi
- **Kelompokkan error** berdasarkan penyebab akar, bukan berdasarkan instance
- **Tetapkan tingkat keparahan** berdasarkan dampak terhadap pengguna

### Degradasi yang Halus

- **Circuit breaker** untuk dependensi eksternal — berhenti memanggil layanan yang gagal
- **Fallback** untuk fitur non-kritis — sajikan data yang di-cache, tampilkan UI yang dikurangi
- **Timeout** pada semua panggilan eksternal — jangan pernah menunggu tanpa batas
- **Coba ulang dengan backoff** untuk kegagalan sementara — exponential backoff dengan jitter

### Catatan Implementasi

Aturan ini tidak bergantung pada alat tertentu. Apakah proyek menggunakan Datadog, stack LGTM, Sentry,
New Relic, atau CloudWatch — pola kodenya (health check, metrik, pelacakan error)
tetap sama. Pustaka klien spesifik masuk dalam konfigurasi tingkat proyek.

### Daftar Periksa Monitoring

- [ ] Endpoint health check diimplementasikan (/health dan /ready)?
- [ ] Probe liveness tidak memiliki pemeriksaan dependensi?
- [ ] Probe readiness memeriksa semua dependensi kritis?
- [ ] Operasi kunci diinstrumentasi dengan metrik RED/USE?
- [ ] Tidak ada label metrik dengan kardinalitas tinggi?
- [ ] Exception yang tidak tertangani ditangkap dengan konteks?
- [ ] Circuit breaker pada dependensi eksternal?
- [ ] Timeout pada semua panggilan eksternal?

### Prinsip Terkait
- Mandat Logging dan Observabilitas @logging-and-observability-mandate.md
- Prinsip Logging dan Observabilitas @logging-and-observability-principles.md
- Prinsip Penanganan Error @error-handling-principles.md
- Prinsip Manajemen Sumber Daya dan Memori @resources-and-memory-management-principles.md
