---
trigger: model_decision
description: Saat bekerja dengan sumber daya yang memerlukan pembersihan (file, koneksi database, soket jaringan, lock) atau mengimplementasikan kumpulan sumber daya (resource pool)
---

## Prinsip Manajemen Sumber Daya dan Memori

### Aturan Manajemen Sumber Daya Universal

**1. Selalu Bersihkan Sumber Daya**

**Sumber daya yang memerlukan pembersihan:**

- File, koneksi jaringan, koneksi database
- Lock, semaphore, mutex
- Alokasi memori (dalam bahasa dengan manajemen memori manual)
- Handle OS, sumber daya GPU

**Bersihkan di SEMUA jalur:**

- Jalur sukses: Penyelesaian normal
- Jalur error: Exception dilempar, error dikembalikan
- Jalur return awal: Guard clause, kegagalan validasi

**Gunakan pola yang sesuai bahasa:**

- Go: Pernyataan defer
- Rust: Trait Drop (RAII)
- Python: Context manager (pernyataan with)
- TypeScript: try/finally
- Java: try-with-resources

**2. Timeout Semua Operasi I/O**

**Mengapa timeout:**

- Permintaan jaringan bisa menggantung tanpa batas
- Mencegah kehabisan sumber daya (koneksi, thread)
- Memberikan perilaku kegagalan yang dapat diprediksi

**Rekomendasi timeout:**

- Permintaan jaringan: Default 30 detik, lebih pendek (5-10 detik) untuk interaktif
- Query database: Default 10 detik, konfigurasikan per kompleksitas query
- Operasi file: Biasanya cepat, tetapi timeout pada filesystem jaringan
- Operasi message queue: Dapat dikonfigurasi, hindari pemblokiran tanpa batas

**3. Pooling Sumber Daya yang Mahal**

**Sumber daya untuk di-pool:**

- Koneksi database: Ukuran pool 5-20 per instance aplikasi
- Koneksi HTTP: Gunakan kembali dengan keep-alive
- Kumpulan thread: Ukuran berdasarkan jumlah CPU (terikat CPU) atau waktu tunggu I/O (terikat I/O)

**Manfaat:**

- Mengurangi latensi (tidak ada overhead pengaturan koneksi)
- Membatasi konsumsi sumber daya (batas maksimal koneksi)
- Meningkatkan throughput (gunakan kembali vs buat baru)

**Praktik Terbaik Connection Pool:**

- Koneksi minimum: 5 (memastikan pool tetap hangat)
- Koneksi maksimum: 20-50 (mencegah membanjiri database)
- Timeout idle: Tutup koneksi yang idle >5-10 menit
- Validasi: Uji koneksi sebelum digunakan (hindari koneksi rusak)
- Monitoring: Lacak pemanfaatan, waktu tunggu, tingkat timeout

**4. Hindari Kebocoran Sumber Daya**

**Apa itu kebocoran:**

- Memperoleh sumber daya (buka file, alokasi memori, dapatkan koneksi)
- Tidak pernah melepaskannya (lupa menutup, exception mencegah pembersihan)
- Akhirnya menghabiskan sumber daya sistem (OOM, koneksi maksimal, file descriptor)

**Deteksi:**

- Monitor file descriptor yang terbuka, jumlah koneksi, penggunaan memori dari waktu ke waktu
- Jalankan pengujian durasi panjang, verifikasi jumlah sumber daya tetap stabil
- Gunakan alat deteksi kebocoran (valgrind, ASan, heap profiler)

**Pencegahan:**

- Gunakan pola bahasa yang menjamin pembersihan (RAII, defer, context manager)
- Jangan pernah mengandalkan pembersihan manual saja (gunakan fitur bahasa)

**5. Tangani Tekanan Balik (Backpressure)**

**Masalah:** Produser lebih cepat dari konsumer

- Antrian tumbuh tanpa batas → kehabisan memori
- Sistem menjadi tidak responsif di bawah beban

**Solusi:**

- Antrian terbatas (bounded queue): Ukuran tetap, blokir atau tolak saat penuh
- Pembatasan laju (rate limiting): Batasi laju permintaan masuk
- Kontrol aliran (flow control): Konsumer memberi sinyal produser untuk melambat
- Circuit breaker: Berhenti menerima permintaan saat kewalahan
- Drop/tolak: Gagal cepat saat kelebihan beban (lebih baik daripada crash)

### Manajemen Memori Berdasarkan Tipe Bahasa

**Garbage Collected (Go, Java, Python, JavaScript, C#):**

- Memori secara otomatis dibebaskan oleh GC
- Tetap harus melepaskan sumber daya non-memori (file, koneksi, lock)
- Waspadai jeda GC dalam aplikasi yang sensitif terhadap latensi
- Profil penggunaan memori untuk menemukan kebocoran (referensi yang dipertahankan mencegah GC)

**Manajemen Memori Manual (C, C++):**

- Eksplisit malloc/free atau new/delete
- Gunakan pola RAII di C++ (Resource Acquisition Is Initialization)
- Hindari manajemen manual di C++ modern (gunakan smart pointer: unique_ptr, shared_ptr)

**Berbasis Kepemilikan (Rust):**

- Kompiler menegakkan keamanan memori pada waktu kompilasi
- Tidak ada jeda GC, tidak ada manajemen manual
- Aturan kepemilikan mencegah kebocoran dan use-after-free secara otomatis
- Gunakan reference counting (Arc, Rc) untuk kepemilikan bersama

### Prinsip Terkait
- Mandat Konkurensi dan Threading @concurrency-and-threading-mandate.md
- Prinsip Implementasi Konkurensi dan Threading @concurrency-and-threading-principles.md
- Prinsip Penanganan Error @error-handling-principles.md - Pembersihan sumber daya di jalur error
