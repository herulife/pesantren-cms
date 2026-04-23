---
trigger: always_on
---

## Mandat Konkurensi dan Threading

### Kapan Menggunakan Konkurensi

**Operasi Terikat I/O (async/await, event loop):**

- Permintaan jaringan, I/O file, query database
- Waktu menunggu respons eksternal mendominasi waktu eksekusi
- Gunakan: I/O asinkron, konkurensi berbasis event, coroutine

**Operasi Terikat CPU (thread, pemrosesan paralel):**

- Komputasi berat, pemrosesan data, encoding video
- Siklus CPU mendominasi waktu eksekusi
- Gunakan: Thread OS, kumpulan thread (thread pool), pekerja paralel

**Jangan Berlebihan Menggunakan Konkurensi:**

- Menambah kompleksitas yang signifikan (race condition, deadlock, kesulitan debugging)
- Gunakan hanya ketika ada manfaat performa yang terukur
- Profil dulu, optimalkan kemudian

### Kapan TIDAK Menggunakan Konkurensi
- Operasi sinkron yang sederhana
- Tidak ada manfaat performa yang terukur
- Hindari optimasi prematur