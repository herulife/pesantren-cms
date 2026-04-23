---
name: mobile-design
description: Menghasilkan antarmuka seluler tingkat produksi yang khas untuk Flutter dan React Native. Memprioritaskan pola asli (native) dari platform, tata letak adaptif, dan animasi yang mulus. Gunakan saat membuat aplikasi, layar, widget antarmuka seluler, atau saat pengguna meminta untuk mendekorasi maupun membuat UI seluler yang mencolok secara visual.
---

# Keahlian Mobile Design

Keahlian ini memandu penciptaan antarmuka seluler tingkat produksi yang otentik dan serasa menyatu dengan platform aslinya, sembari mempertahankan identitas estetika yang unik. Terapkan kode berjalan yang sebenarnya, dengan menaruh perhatian luar biasa pada sistem standar platformnya dan sentuhan kreatif pengambilan gayanya.

Pengguna memberikan spesifikasi UI seluler: layar, widget, fitur, atau antarmuka aplikasi berskala penuh. Mereka bisa mencantumkan rincian konteks seputar platformnya (iOS/Android), kelas audiens (pengguna), maupun batasan teknis (constraint).

## Proses Desain (Design Thinking)

Sebelum memulai rekayasa skrip, pahami sepenuhnya konteksnya dan ambil sikap mutlak demi menjalankan satu arah estetika bermodal kepekaan platform (platform-aware):
- **Platform**: iOS (Cupertino), Android (Material 3), atau lintas-platform lintas batas? Keduanya hadir dengan set nilai ekspektasi yang amat berbeda.
- **Nada/Gaya**: Pilih satu arahan — keakraban kemewahan kelas satu (refined luxury), dunia bersemangat dan riang (playful/energetic), tepat guna ber-efisiensi super tinggi (utilitarian/efficient), panggung prioritas konten dan media (editorial/content-first), sapuan organik pembawa suhu hangat (organic/warm), corak tajam tanpa kompromi berhias blok geometri (bold/geometric), dunia selembut kapas (soft/pastel), dan seterusnya.
- **Keterbatasan (Constraints)**: Permeforma di perangkat lawas (low-end), sistem jalan tanpa jaringan internet (offline capability), kemudahan membaur (accessibility).
- **Pembedaaan**: Apa yang membuat rancangan aplikasi ini tak mudah lekang dari pikiran pemakai? Apa jurus interaksi andalannya?

**PENTING (CRITICAL)**: Para pemakai ponsel bergantung pada memori otot jarinya (muscle memory). Hormati standar mutlak operasional platform (pola letak menu kendali, areal navigasi jemari (swipe/gesture), UI dari sistem operasi), tetapi suntikkan kuat-kuat semburat kepribadian (personality) melalui pengolahan Typografi, Warna, Pergerakan animasi (Motion), hingga format komposisi spasial tatanan utamanya.

## Panduan Desain Mobile

### Konvensi Standar Platform
- **iOS**: Baris Menu Bawah (Bottom tab bar), judul layar tebal membesar (large title navigation), Usap untuk kembali mundur (swipe-to-go-back), Set perlengkapan alat UI Cupertino.
- **Android**: Desain bahasa khas Material 3, Bilah / panel pinggir kiri kendali (navigation rail/drawer), tombol peluru aksi mengapung (FAB), baris utama aplikasi pucuk atas (top app bar).
- **Cross-platform**: Gunakan jajaran Widget paling cerdik untuk membaca mesin demi mencetak UI yang beradaptasi tepat sesuai di mana pun dia dipasang.

### Tipografi
- Pilih font khas yang masih sangat mudah dibaca pada ukuran sekecil standar telepon (Min ukuran teks Body diangka 16px+)
- Hormati sistem pelarasan ukuran huruf bawaan mesin pengguna seluler (dynamic type / font scaling) — jangan pernah me-matikan angka ukur kaku di semua titik
- Gunakan `TextTheme` jika merakit Flutter, jaga keteraturan hirarki dimensi huruf yang kokoh
- Padukan font tampilan Display yang eksentrik nan bernyawa dipasangkan berdampingan bersama font tubuh teks (Body Font) tingkat keterbacaan kelas dewata

### Warna & Tema
- Dukung **kedua pengaturan tema terang dan gelap** — selamanya, wajib hukumnya
- Gunkan skema warna-warni `ColorScheme` / `ThemeData` demi keteraturan terpadu
- Pastikan angka standar perbandingan batas serapan cahaya / kontras terdukung amat mumpuni untuk diterjemahkan layar bersensor mesin OLED (pure black/ hitam absolut) berkesesuaian di atas pancaran LCD lama
- Manfaatkan sapuan ragam pewarnaan demi arti khusus semata — aksi panggilan bertugas primer (primary actions), simbol sinyal status indikator, hingga balutan perpaduan utama sebagai brand identity perusahaan

### Animasi Pengiring Gerak Tubuh
- Sampaikan pertunjukan **gerak penuh makna sejati** — pergerakan-pergerakan hidup itu selayaknya hadir mengabari peralihan raga transisi sang mesin, bukan menjadi penghias jalan raya yang riuh.
- Kekang durasi durasi interaksi ke dalam batasan di bawah detik 300ms, serta pertukaran arena layar hingga porsi 500ms
- Hadirkan animasi jenis `Hero` untuk perpindahan elegan antar ragam tontonan layar (shared element transitions)
- Tumpuk kemunculan layar rincian (stagger list item animations) demi keajaiban kilat tatapan memikat
- Selalu patuhi batas aturan larangan pemutaran sirkus visual dari sistem pemakai (reduceMotion / accessibility settings) — mutlak sedia umpan tata ruang benda diam / non gerak

### Tata Letak & Spasi (Layout & Spacing)
- Rancangan difokuskan sepenuhnya menuruti hasrat ergonomis **pakai sebelah tangan (one-handed use)** — deretan pemacu aksi terpenting mesti menapak aman bertengger dalam kuasa penuh genggaman sang jempol ibu jari (kawasannya berada pada zona 60% letak ke bawah pada area layar).
- Pasangkan aman perlindungan (safe area insets) — jangan sampai serampangan memindih UI milik kekuasaan murni di tingkat sistem (poni sensor muka/notch, palang indikator rumah/home indicator, hingga atap penanda status/status bar)
- Desain untuk beragam ukuran layar — telepon, tablet, dan perangkat lipat (foldables)
- Konfigurasikan peka ukuran dengan rentang-rentang pemisah sakti (responsive breakpoints): Menciut/compact (<600dp), Tengah/medium (600-840dp), Melebar riuh/expanded (>840dp)
- Bebaskan derma areal tangkapan sentuh (Generous touch targets): sekurang-kurangnya area 48x48dp

### Performa
- Jangan boros merombak membongkar-pasang formasi jaring komponen berat (expensive widget trees) — sebisa mungkin paten pergunakan senjata andalan formasi `const`
- Panggil gulungan isi layar antrian daftar perlahan (Lazy-load lists) menggendong muatan kargo semacam `ListView.builder` (jangan sudi menampung formasi daftar membabi-buta via `ListView` saja jika menghantarkan jumlah muatan list berkapasitas besar)
- Tempa Gambar secakap-cakapnya — padukan librari-librari tangkas layaknya `cached_network_image`, panggil varian spesifik besaran piksel pendamping.
- Raba dan nilai prestasi bukan sebatas berselancar maya via emulator simulasi namun harus bertarung turun gunung memantau napas aplikasi lewat alat ukur nyata sungguhan.

## Pola Khusus-Flutter (Flutter-Specific Patterns)

```dart
// ✅ Baik: Komponen widget adaptif yang menghormati habitat asli platform perangkat
Widget buildButton(BuildContext context) {
  return Platform.isIOS
    ? CupertinoButton(child: text, onPressed: onTap)
    : ElevatedButton(child: text, onPressed: onTap);
}

// ✅ Baik: Tata letak responsif bertameng tiang rentang ukuran (breakpoints)
Widget build(BuildContext context) {
  final width = MediaQuery.of(context).size.width;
  if (width >= 840) return _expandedLayout();
  if (width >= 600) return _mediumLayout();
  return _compactLayout();
}

// ❌ Buruk: Mematok paksa mati rincian ukuran seragam yang justru merempukkan tatanan saat dikunjungi via rupa-rupa perangkat lain
Container(width: 375, height: 812) // Hanya pantas buat iPhone X!
```

## Kepatuhan Aturan
Sebelum diimplementasikan, pastikan kesesuaian di rel kompas ini:
- Struktur Proyek @project-structure.md (kerangka tatanan sarang penyimpanan letak rincian bagian fitur komponen Mobile/Flutter)
- Strategi Pengujian @testing-strategy.md (pemeriksaan widget level tes, hingga penyatuan/integrasi tes)
- Prinsip Keamanan @security-principles.md (penanganan sarang lindung data sensitif kerahasiaan & pengendalian lalu lintas kunci API/API key)
- Prinsip Aksesibilitas @accessibility-principles.md (ketentuan raba baca layaran, angka huruf melenting dinamis, serta kekuatan jurus pemandu rasio tangkapan penglihatan tingkat warna batas pembalut rona)
- Pola Arsitektur @architectural-pattern.md (BLoC/Cubit, hingga pola pemangku amanat/repository pattern)

**PERINGATAN (IMPORTANT)**: Ponsel melesat sembari memanggul batasan-batasan ganjilnya sendiri — usia hidup napas daya tampung baterainya, rentan terhempas kelesuan sinyal kelap-kelip aliran listrik data maya, disusul situasi ganjil manuver raga panggung interaksi asli di alam liar keseharian manusianya (cuma satu bilah telapak tangan terangkat sewaktu pemakainya tergopoh buru berlarian di lorong bus kota). Segala keputusan luhur seni rupa selayaknya wajib menghormati fakta batasan keniscayaan semua tersebut tadi. Menyajikan tatanan rupa dewi dari kahyangan tapi meminum darah daya batere sang ponsel setebal tebal lumpur sampai nyendat ketika jari sekadar diusap turun menelusuri gulungan halaman, adalah sebuah KEKALAHAN TELAK tak ada ampun mutlaknya.

Ingatlah selalu: Seni aplikasi gawai bergerak sekelas dewata terasa layaknya dibangun sangat serasi persis sesuai ukuran untuk khusus menetap bahagia menghuni raga benda mati segenggaman telapak di urat nadi sela-sela sang pemakai. Buat perwujudan satu tarikan nafas dan kedipan mata tiada terluput terlintas terselip tak luput tak terlupakan pada interaksi yang terbangun melampaui segala perhitungan demi setiap percikan piksel debunya.
