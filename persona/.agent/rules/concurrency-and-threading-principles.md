---
trigger: model_decision
description: Saat mengimplementasikan kode konkurensi, paralel, atau multi-thread (async/await, thread, goroutine, aktor)
---

## Prinsip Implementasi Konkurensi

**1. Hindari Race Condition**

**Apa itu race condition:**

- Beberapa thread mengakses data bersama secara bersamaan
- Setidaknya satu thread menulis/memodifikasi data
- Tidak ada mekanisme sinkronisasi yang diterapkan
- Hasil bergantung pada waktu eksekusi thread yang tidak dapat diprediksi

**Strategi pencegahan:**

- Sinkronisasi: Lock, mutex, semaphore
- Imutabilitas: Data yang tidak dapat diubah aman untuk thread secara default
- Pengiriman pesan (message passing): Kirim data antar thread daripada berbagi
- Penyimpanan lokal thread (thread-local storage): Setiap thread memiliki salinannya sendiri

**Deteksi:**

- Go: Jalankan dengan flag `-race` (detektor race)
- Rust: Alat Miri untuk deteksi perilaku tidak terdefinisi
- C/C++: ThreadSanitizer (TSan)
- Java: JCStress, FindBugs

**2. Cegah Deadlock**

**Apa itu deadlock:**

- Dua atau lebih thread saling menunggu tanpa batas
- Contoh: Thread A memegang Lock 1, menunggu Lock 2; Thread B memegang Lock 2, menunggu Lock 1

**Empat kondisi (SEMUA harus benar untuk deadlock):**

1. Pengecualian mutual (mutual exclusion): Sumber daya dipegang secara eksklusif (lock)
2. Pegang dan tunggu (hold and wait): Memegang satu sumber daya sambil menunggu yang lain
3. Tanpa preemption: Tidak bisa memaksa membuka kunci
4. Tunggu melingkar (circular wait): A menunggu B, B menunggu A

**Pencegahan (putuskan salah satu kondisi):**

- Urutan penguncian: Selalu peroleh lock dalam urutan yang sama
- Timeout: Gunakan try_lock dengan timeout, mundur dan coba lagi
- Hindari lock bersarang: Jangan memegang beberapa lock secara bersamaan
- Gunakan struktur data bebas-lock (lock-free) jika memungkinkan

**3. Utamakan Imutabilitas**

- Data yang tidak dapat diubah = aman untuk thread secara default (tidak perlu sinkronisasi)
- Bagikan data yang tidak dapat diubah secara bebas antar thread
- Gunakan struktur data yang tidak dapat diubah jika memungkinkan (default Rust, bahasa fungsional)
- Jika data harus berubah, gunakan pengiriman pesan daripada status bersama yang dapat diubah

**4. Pengiriman Pesan Lebih Baik dari Memori Bersama**

- "Jangan berkomunikasi dengan berbagi memori; bagikan memori dengan berkomunikasi" (pepatah Go)
- Kirim data melalui channel/antrian daripada mengakses memori bersama
- Mengurangi kebutuhan lock dan sinkronisasi
- Lebih mudah untuk dipahami dan diuji

**5. Degradasi yang Halus**

- Tangani error konkurensi dengan halus (timeout, percobaan ulang, circuit breaker)
- Jangan menghentikan seluruh aplikasi karena satu kegagalan thread
- Gunakan supervisor/monitor untuk toleransi kesalahan (model aktor Erlang/Elixir)
- Implementasikan tekanan balik (backpressure) untuk skenario produser-konsumer

### Model Konkurensi Berdasarkan Kasus Penggunaan

- **Terikat I/O (I/O-bound):** async/await, event loop, coroutine, green thread
- **Terikat CPU (CPU-bound):** Thread OS, kumpulan thread (thread pool), pemrosesan paralel
- **Model aktor:** Aktor Erlang/Elixir, Akka (pengiriman pesan, status terisolasi)
- **CSP (Communicating Sequential Processes):** Channel Go, channel Rust

### Pengujian Kode Konkurensi

- Tulis unit test dengan konkurensi yang terkontrol (eksekusi deterministik)
- Uji skenario timeout dan kehabisan sumber daya
- Uji skenario kumpulan thread penuh, antrian penuh

### Prinsip Terkait
- Prinsip Manajemen Sumber Daya dan Memori @resources-and-memory-management-principles.md
- Prinsip Penanganan Error @error-handling-principles.md
- Strategi Pengujian @testing-strategy.md