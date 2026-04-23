# Contoh Pemikiran Berurutan (Sequential Thinking)

## Contoh 1: Persoalan Matematika Sederhana

**Masalah:** Jika sebuah kereta menempuh jarak 120 km dalam 2 jam, lalu 180 km dalam 3 jam berikutnya, berapakah kecepatan rata-ratanya?

**Thought 1/5:** Membedah masalah - kita memiliki dua segmen perjalanan dengan jarak dan waktu yang berbeda. Perlu menghitung total jarak dan total waktu terlebih dahulu.

**Thought 2/5:** Segmen pertama: 120 km dalam 2 jam. Segmen kedua: 180 km dalam 3 jam. Total jarak = 120 + 180 = 300 km. Total waktu = 2 + 3 = 5 jam.

**Thought 3/5:** Rumus kecepatan rata-rata = Total jarak / Total waktu = 300 km / 5 jam = 60 km/jam.

**Thought 4/5:** Memverifikasi: Apakah ini masuk akal? Kecepatan segmen pertama = 60 km/jam, segmen kedua = 60 km/jam. Tunggu, sepertinya ada yang tidak beres.

**Thought 5/6 (Revisi pada Thought 4):** Biar saya hitung ulang kecepatan per segmen. Pertama: 120/2 = 60 km/jam. Kedua: 180/3 = 60 km/jam. Ternyata benar, kedua segmen berada pada kecepatan 60 km/jam, jadi rata-ratanya memang 60 km/jam. Kecurigaan saya tidak beralasan.

**Solusi:** Kecepatan rata-ratanya adalah 60 km/jam.

## Contoh 2: Keputusan Desain yang Kompleks dengan Pencabangan (Branching)

**Masalah:** Rancang strategi caching untuk API bertrafik tinggi yang memiliki data spesifik-pengguna maupun data global.

**Thought 1/8:** Analisis awal - perlu mempertimbangkan rasio cache hit, penggunaan memori, kompleksitas invalidasi, dan kebutuhan latensi. Terdapat dua tipe data yang mengisyaratkan pendekatan multi-lapis.

**Thought 2/8:** Hipotesis: Gunakan Redis dengan namespace kunci terpisah untuk data spesifik-pengguna (user:*) dan data global (global:*). Data pengguna bisa menggunakan TTL (Time-To-Live) yang lebih singkat karena adanya personalisasi.

**Thought 3/8:** Mempertimbangkan strategi TTL - data global jarang berubah, bisa menggunakan TTL 1 jam. Data spesifik-pengguna butuh TTL 5-15 menit agar tetap segar.

**Thought 4/8:** Tunggu, saya harus memikirkan invalidasinya. Apa yang terjadi ketika data global diupdate? Penyiaran (broadcasting) invalidasi ke semua instance bisa jadi sangat mahal.

**Thought 5/10 (Pencabangan dari Thought 4):** Pendekatan alternatif - gunakan pembuatan versi cache (cache versioning). Sertakan nomor versi pada kunci cache global. Ketika data diupdate, naikkan versinya. Entri cache lama akan kedaluwarsa secara alami.

**Thought 6/10:** Pendekatan versi ini menambah kompleksitas namun mengeliminasi invalidasi broadcast. Trade-off: akan ada sedikit data basi sampai TTL berakhir dibandingkan mengorbankan kompleksitas sistem.

**Thought 7/10:** Untuk data spesifik-pengguna, TTL sederhana sudah cukup karena data setiap pengguna berdiri sendiri. Tidak diperlukan pembatalan (invalidation) lintas pengguna.

**Thought 8/10:** Verifikasi hipotesis - cache global berversi + cache pengguna berbasis TTL memberikan keseimbangan yang baik. Menguji penggunaan memori: asumsikan 100K pengguna, 10KB cache per pengguna, 50MB global = total ~1GB. Masih bisa diterima.

**Thought 9/10:** Pertimbangan tepi (edge case) - bagaimana jika versi mengulang kembali (wrap around)? Gunakan versioning berbasis stempel waktu (YYYYMMDDHHMMSS) untuk mencegah tabrakan (collusion).

**Thought 10/10:** Desain akhir tervalidasi. Cache global dengan verioning stempel waktu, cache pengguna dengan TTL 10 menit. Melakukan pemantauan pada rasio cache hit dan penggunaan memori pasca-penerapan (post-deployment).

**Solusi:** Implementasikan strategi caching Redis dua tingkat dengan kunci berversi-stempel-waktu (timestamp-versioned) untuk data global (TTL 1 jam) dan key-value sederhana dengan TTL 10 menit untuk data spesifik-pengguna. Pantau rasio hit dan penggunaan memori setelah fase deployment.

## Contoh 3: Debugging dengan Berbagai Revisi

**Masalah:** API terkadang melempar error 500, log menunjukkan adanya timeout pada database.

**Thought 1/6:** Hipotesis awal - kehabisan pool koneksi (connection pool exhaustion) database. Periksa ukuran pool saat ini dan jumlah koneksi aktif.

**Thought 2/6:** Ukuran pool = 20, monitoring menunjukkan ada lonjakan penggunaan hingga 18 koneksi. Tidak habis. Harus mencari penyebab di tempat lain.

**Thought 3/7 (Perkiraan Direvisi):** Masalah performa query? Periksa log query yang lambat. Ditemukan beberapa query yang memakan waktu 5-10 detik selama periode terjadinya error.

**Thought 4/7:** Semua query yang lambat melibatkan *join* pada tabel berukuran masif tanpa indeks yang tepat. Hipotesis: kurangnya indeks yang menyebabkan table scan.

**Thought 5/7:** Tunggu, kueri-kueri ini masih berjalan lancar minggu lalu. Apa yang berubah? Mengecek riwayat penerapan (deployment)... tidak ada perubahan skema, tidak ada query baru.

**Thought 6/8 (Revisi dari Thought 4):** Kueri itu sendiri belum berubah, melainkan hanya volume datanya. Tabel tumbuh 300% minggu lalu akibat kampanye pemasaran. Indeksnya ada tetapi log statistiknya sudah usang.

**Thought 7/8:** Hipotesis: Statistik query planner yang usang menyebabkan perencanaan jalannya query jadi buruk. Solusi: Jalankan ANALYZE pada tabel yang terdampak untuk mengupdate statistik.

**Thought 8/8:** Terverifikasi - setelah ANALYZE, query plan meningkat drastis dan waktu eksekusi turun menjadi <500ms. Akar penyebabnya adalah statistik yang usang, bukan karena ketidakadaan indeks.

**Solusi:** Jalankan ANALYZE pada tabel database yang terpengaruh untuk memperbarui data statistik query planner. Implementasikan job ANALYZE otomatis untuk berjalan setiap kali selesai melakukan impor data massal untuk mencegah kejadian serupa di masa mendatang.
