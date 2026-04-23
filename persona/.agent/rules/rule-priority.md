## Prioritas Aturan (Ketika Aturan Bertentangan)

Ketika dua aturan saling bertentangan, gunakan prioritas ini untuk memutuskan:

### Urutan Prioritas (Tertinggi ke Terendah)

1. **Mandat Keamanan** — selalu menang. Jangan pernah mengorbankan keamanan demi kecepatan, kesederhanaan, atau kemudahan.
2. **Konstitusi Perangkat Lunak Tangguh** — filosofi dasar. Kode harus dapat dipertahankan.
3. **Mandat Kelengkapan Kode** — validasi tidak bisa ditawar. Jangan pernah mengirim kode yang belum divalidasi.
4. **Desain yang Mengutamakan Testabilitas** — kemampuan pemeliharaan memungkinkan peningkatan di masa depan.
5. **Prinsip khusus fitur** — panduan yang bergantung pada konteks untuk tugas yang dikerjakan.
6. **YAGNI / KISS** — hanya ketika tidak ada pertukaran (trade-off) keamanan, keandalan, atau kemampuan pemeliharaan.

### Resolusi Konflik Umum

| Konflik | Resolusi |
|---------|----------|
| YAGNI vs Keamanan ("jangan tambah validasi input, belum diperlukan") | **Keamanan menang.** Validasi input selalu diperlukan. |
| KISS vs Testabilitas ("menambah interface membuatnya lebih kompleks") | **Testabilitas menang.** Interface memungkinkan pengujian, yang memungkinkan pemeliharaan. |
| Performa vs YAGNI ("haruskah saya mengoptimalkan ini sekarang?") | **Ukur dulu.** Hanya optimalkan setelah profiling menunjukkan bottleneck yang nyata. |
| DRY vs Kejelasan ("haruskah saya mengabstraksikan ini menjadi utilitas bersama?") | **Kejelasan menang** sampai duplikasi mencapai 3+ kali (Aturan Tiga). |
| Kecepatan vs Logging ("lewatkan logging agar lebih cepat rilis") | **Logging menang.** Kegagalan yang diam-diam adalah musuh. |

### Prinsip Panduan

Jika ragu, tanyakan: *"Pilihan mana yang membuat kode lebih dapat dipertahankan dan dipelihara?"*

Jika kedua opsi sama-sama dapat dipertahankan, pilih yang lebih sederhana (KISS).
