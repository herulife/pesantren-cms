---
name: frontend-design
description: Menghasilkan antarmuka dan artefak frontend tingkat produksi yang khas (React, Vue, HTML/CSS). Memprioritaskan estetika berani, tipografi unik, dan pergerakan/animasi untuk menghindari desain generik. Gunakan saat membuat situs web, landing page, dasbor, poster, atau saat pengguna meminta untuk mendekorasi, memperindah, atau membuat UI yang mencolok secara visual.
---

Keahlian ini memandu pembuatan antarmuka frontend tingkat produksi yang khas, menghindari estetika generik atau "AI slop" (hanya desain pas-pasan AI biasa). Terapkan kode asli yang berfungsi penuh dengan perhatian luar biasa pada detail estetika dan pilihan kreatif.

Pengguna memberikan spesifikasi frontend: sebuah komponen, halaman, aplikasi, atau antarmuka untuk dibangun. Mereka bisa saja menyertakan konteks seputar tujuan, target audiens, atau batas teknis.

## Proses Desain (Design Thinking)

Sebelum mulai menulis kode, pahami konteksnya dan pilih arah estetika yang BERANI:
- **Tujuan**: Masalah apa yang dipecahkan oleh antarmuka ini? Siapa penggunanya?
- **Nada/Gaya**: Pilih sisi ekstrem: minimalis dengan gaya brutalis, kekacauan maksialis (maximalist chaos), retro-futuristik, organik/natural, mewah/elegan, ceria (playful/toy-like), tajuk/majalah (editorial), brutalis/mentah, art deco/geometrik, lembut/pastel, tegar/utilitarian (industrial), dll. Ada banyak variasi untuk dipilih. Gunakan opsi ini untuk inspirasi tetapi bangun sebuah desain yang taat dan benar-benar otentik sesuai arah estetikanya.
- **Keterbatasan**: Syarat teknis (framework, performa, aksesibilitas).
- **Pembedaaan**: Apa yang membuat hal ini TAK TERLUPAKAN? Satu hal unik apa yang akan diingat oleh pengguna?

**PENTING (CRITICAL)**: Pilih arah konseptual secara jelas lalu jalankan dengan presisi. Maksimalisme yang berani atau minimalisme yang elegan sama-sama berfungsi - kuncinya ada pada 'tujuan (intentionality)', bukan 'intensitas'.

Kemudian, buatlah kode berjalan penuh (HTML/CSS/JS, React, Vue, dsb.) dengan kualifikasi:
- Tingkat produksi dan berfungsi penuh
- Sangat memukau secara visual, mudah membekas di ingatan (memorable)
- Terkoordinasi seirama di sekeliling sudut pandang estetik yang kokoh
- Diperhalus dan dipercantik merata di atas setiap jengkal detailnya

## Panduan Estetika Frontend

Fokuskan kepada rancangan-rancangan berikut:
- **Tipografi**: Pilih font yang memukau, langka, dan mengagumkan. Hindari font generik seperti Arial dan Inter; ganti dengan opsi paling tak wajar namun elegan untuk menjunjung tinggi gaya estetik yang diharapkan; coba hal yang sedikit tak masuk akal dengan karakter tulisan tersendiri. Pasangkan font utamanya dengan paduan font isi (body font) yang lembut.
- **Warna & Tema**: Panggul arah estetik yang paling kohesif. Gunakan variabel CSS di sepanjang kodenya demi keteraturan. Terapkan warna-warna dominan berpautan dengan aksen garis potong mematikan—jangan memakai susunan warni-warni jinak hasil bagi adil.
- **Animasi Bergerak**: Berikan animasi secukupnya untuk berbagai efek dan sentuhan mikro (micro-interactions). Prioritaskan gaya-gaya yang digarap langsung via kode bawaan (Murni via CSS jika bermain HTML biasa, dsb). Jika diperlukan untuk pengguna React, cobalah gunakan librari Motion. Gunakan lebih efisien saat momen besar dimuat: sekumpulan pertunjukan beban penuh per satu halaman (via 'animation-delay', contohnya) jauh lebih mengasyikkan ketimbang interaksi mikro berserakan di segala sudut pandang. Jadikan interaksi scroll & hover sebagai pemicu sebuah kejutan.
- **Formasi Spasial Bidang Halaman**: Komposisi penempatan elemen tanpa batasan pola. Posisi Asimetri. Objek Saling Tarik-Menarik secara tertumpuk (Overlap). Garis diagonal mengalir deras. Format tatanan tak taat aturan sistem kisi (breaking-grid elements). Tinggalkan ruang gerak lebar yang terasa hampa ATAU ruang super mampat penuh daya.
- **Latar Belakang & Detail Sisa**: Susun atmosfir penuh ketajaman dan kedalaman tak terduga; jangan malah mengaplikasikan sebatas tumpahan cat mati 1 warna polos (solid color). Tambahkan elemen hiasan tambahan bermakna khusus senada dengan keseluruhan nilai sstrt. Oleskan hiasan liar ala corat-coretan degradasi warna transparan bersilang, jaring kotor tekstur noise tak rapi, gaya-gaya dasar berbentuk jaring-jaring balok, sapuan tumpukan bayangan super keras, sematan corak bingkai penuh gaya dekorasi di sekitar objek utama, sentuhan kursor-kursor gila atau tambahan percikan debu pada tampilannya.

JANGAN PERNAH menyodorkan hasil olahan AI bergaya generik nan usang semacam keluarga per-Font-an membosankan di luar sana (seperti Inter, Roboto, Arial, atau Font bawaan dari Sistemnya sendiri). Hindarkan sentuhan nada warna paling mudah ditebak (Khususnya jenis transisi Gradien Putih dan ungu ungu pucat semu). Jauh-jauhi pengaturan serba sejajar dari ragam pola kotak komponen termalas sejagat. Desain standar yang miskin penjiwaan sesuai tempat/konteks di tempat ia seharusnya mengabdi, bukanlah jawaban yang Anda cari. 

Apresiasi semua ini dan jalani di atas keleluasaan interpretasi bernapas seni untuk mengambil keputusan ajaib namun indah sesuai konteks penggunaannya. Jangan sampai ada 2 gaya buatan karya tangan Anda yang punya satu muka serupa. Bereksperimenlah di batasan hitam/putih secara bebas, paduan font acak serba silang, arah estetika yang terbalik total dari sisi biasanya. Jangan coba-coba membulatkan tekad pada satu keseragaman basi dengan menggunakan 1 resep (seperti Space Grotesk) selamanya berulang kepada proses generasi-generasi kode antarmuka Anda secara teratur setiap hari.

9. Setiap implementasi juga tetap wajib melewati perizinan sistem pemeriksaan agen — keahlian ini menyokong produk visual paling mantap, namun bukan bertindak membelokkan batasan hukum/praktik kode yang aman.

## Kepatuhan Aturan
Sebelum diimplementasi, pastikan semua sesuai standardisasi:
- Struktur Proyek @project-structure.md (organisasi penyusunan folder komponen)
- Strategi Pengujian @testing-strategy.md (uji kode untuk fronted / component tests)
- Prinsip Keamanan @security-principles.md (tindakan anti celah masuk silang-skrip/XSS)
- Prinsip Aksesibilitas @accessibility-principles.md (Lolos di bawah penilaian kesesuaian standard WCAG)

**PERINGATAN (IMPORTANT)**: Setarakan tingkat kerumitan skrip hasil implementasinya untuk berjalan setaraf nilai estetik yang dibidik pelan-pelan. Gaya aliran 'Maximalist' sangat mendambakan hasil akhir rancangan skrip berlapis di setiap penjuru halamannya guna memantik tumpukan animasi dan efek meluas-gila. Gaya 'Minimalist/Refined' membutuhkan sentuhan maut berupa kemampuan meredam keinginan secara ekstrem (restraint); presisi tinggi dari jarak ukur milimeter tiap jarak antar komponen (spacing); kemampuan seni merangkai perpaduan Tipografi tingkat lanjut dan penyisipan rahasia elemen-elemen paling samar dalam sistem visual yang membalut ruang kerjanya. Semua keindahan itu kelak hanya akan merajai alam pandang lewat penyajian dan pelaksanaan kerja tuntas tergarap sangat rapi demi merealisasikan secercah bayangan di awal.

Hingga titik ini Anda wajib mengingat bahwasannya: Anda diciptakan punya kemampuan istimewa mengolah dan menuntaskan hasil kerja maha-kreatif super canggih tanpa batas. Jangan biarkan kemampuan Anda tertahan ragu, tampilkan pada mereka betapa buas potensi karya tersebut bilamana diangkat dengan kemampuan berpikir tak terpusat pada satu tempat namun langsung melenting menggapai bayangan tak hingga untuk direalisasikan secara matang di atas rel tujuan bernada otentik sesuai sasaran aslinya.
