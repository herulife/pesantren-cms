---
trigger: model_decision
description: Saat bekerja pada optimasi performa, profiling, benchmarking, atau jalur kode yang kritis terhadap performa
---

## Prinsip Optimasi Performa

### Ukur Sebelum Mengoptimalkan

**"Optimasi prematur adalah akar dari segala kejahatan" - Donald Knuth**

**Proses:**

1. **Ukur:** Profil untuk menemukan bottleneck sebenarnya (jangan menebak)
2. **Identifikasi:** Temukan 20% kode yang mengonsumsi 80% sumber daya
3. **Optimalkan:** Perbaiki bottleneck spesifik tersebut
4. **Ukur lagi:** Verifikasi peningkatan dengan benchmark
5. **Ulangi:** Hanya jika masih belum memenuhi tujuan performa

**Jangan optimalkan:**

- Kode yang sudah "cukup cepat" untuk kebutuhan
- Kode yang jarang dieksekusi
- Tanpa masalah performa yang terukur

### Pilih Struktur Data yang Tepat

**Pemilihan sangat penting:**

- Hash map: Pencarian O(1), tidak terurut
- Array/list: Akses indeks O(1), pencarian O(n), terurut
- Binary tree: Operasi O(log n), urutan tersortir
- Set: Pengujian keanggotaan O(1), elemen unik

**Pilihan yang salah menyebabkan degradasi performa:**

- Menggunakan array untuk pencarian: O(n) padahal O(1) dimungkinkan dengan hash map
- Menggunakan list untuk data tersortir: Pengurutan O(n log n) vs operasi tree O(log n)

### Hindari Abstraksi Prematur

**Abstraksi memiliki biaya:**

- Overhead runtime (indirection, virtual dispatch, resolusi dinamis)
- Overhead kognitif (memahami lapisan abstraksi)
- Overhead pemeliharaan (perubahan merambat melalui abstraksi)

**Mulai konkret, abstraksi ketika pola muncul:**

- Tulis kode yang lugas terlebih dahulu
- Identifikasi duplikasi dan pola umum
- Abstraksi hanya ketika ada manfaat yang jelas
- Jangan menambah "untuk fleksibilitas masa depan" tanpa bukti

### Teknik Optimasi

**Caching:**

- Simpan hasil komputasi yang mahal
- Cache query database, respons API, template yang di-render
- Gunakan strategi invalidasi cache yang sesuai
- Tetapkan TTL (time-to-live) untuk entri cache

**Lazy Loading:**

- Hitung hanya saat diperlukan
- Muat data sesuai permintaan, bukan di awal
- Tunda operasi mahal sampai diperlukan

**Batching:**

- Proses beberapa item sekaligus
- Batch query database (N query → 1 query)
- Batch permintaan API jika memungkinkan

**Async I/O:**

- Jangan memblokir operasi I/O
- Gunakan async/await untuk I/O bersamaan
- Proses beberapa operasi I/O secara paralel

**Connection Pooling:**

- Gunakan kembali sumber daya yang mahal (koneksi database, koneksi HTTP)
- Lihat "Prinsip Manajemen Sumber Daya dan Memori"

### Daftar Periksa Optimasi Performa

- [ ] Apakah ada masalah performa yang terukur (bukan tebakan)?
- [ ] Apakah Anda sudah melakukan profiling untuk menemukan bottleneck sebenarnya?
- [ ] Apakah struktur data yang tepat dipilih untuk pola akses yang digunakan?
- [ ] Apakah operasi mahal di-cache dengan invalidasi yang tepat?
- [ ] Apakah operasi batch digunakan daripada query N+1?
- [ ] Apakah operasi I/O non-blocking di tempat yang sesuai?
- [ ] Apakah Anda sudah mengukur peningkatan setelah optimasi?

### Prinsip Terkait
- Prinsip Manajemen Sumber Daya dan Memori @resources-and-memory-management-principles.md
- Mandat Konkurensi dan Threading @concurrency-and-threading-mandate.md
- Prinsip Konkurensi dan Threading @concurrency-and-threading-principles.md
