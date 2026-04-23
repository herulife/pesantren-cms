export interface AdminDocSection {
  id: string;
  title: string;
  category: string;
  href: string;
  summary: string;
  audience: string[];
  quickActions: string[];
  workflows: Array<{
    title: string;
    steps: string[];
  }>;
  tips: string[];
}

export interface RoleAccessRow {
  module: string;
  superadmin: string;
  tim_media: string;
  bendahara: string;
  panitia_psb: string;
  user: string;
}

export const adminDocSections: AdminDocSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard Utama',
    category: 'Utama',
    href: '/admin',
    summary: 'Ringkasan cepat kondisi sistem dan akses cepat ke modul yang paling sering dipakai, dengan isi panel yang menyesuaikan role admin yang sedang login.',
    audience: ['Semua staf admin'],
    quickActions: [
      'Lihat ringkasan data penting tanpa membuka setiap modul satu per satu.',
      'Pantau panel yang relevan untuk role Anda, misalnya pesan masuk, log aktivitas, konten, atau donasi.',
      'Gunakan kartu ringkasan sebagai titik awal pekerjaan harian.',
    ],
    workflows: [
      {
        title: 'Rutinitas cek harian',
        steps: [
          'Buka dashboard admin dan lihat kartu statistik utama.',
          'Periksa pesan masuk, log terbaru, dan status modul yang paling mendesak.',
          'Lanjutkan ke modul terkait dari shortcut atau sidebar.',
        ],
      },
    ],
    tips: [
      'Gunakan dashboard sebagai halaman orientasi, bukan tempat edit data.',
      'Isi dashboard bisa berbeda antar role, jadi fokuskan pada kartu dan panel yang memang tersedia untuk tugas Anda.',
      'Kalau ada angka yang terasa janggal, verifikasi dari modul sumbernya.',
    ],
  },
  {
    id: 'news',
    title: 'Berita & Pengumuman',
    category: 'Konten & Publikasi',
    href: '/admin/news',
    summary: 'Pusat pengelolaan artikel berita, pengumuman lembaga, dan konten edukasi. Dilengkapi dengan asisten AI untuk pembuatan draft otomatis.',
    audience: ['Superadmin', 'Tim Media'],
    quickActions: [
      'Buat berita baru dengan editor teks kaya (Rich Text).',
      'Gunakan Generator AI untuk membuat draf berita dari poin-poin singkat.',
      'Kelola status publikasi (Draft agar tidak tampil, Published agar tayang).',
      'Atur kategori berita (Kegiatan, Prestasi, Informasi) dan gambar unggulan.',
    ],
    workflows: [
      {
        title: 'Menerbitkan berita dengan asisten AI',
        steps: [
          'Klik "Tambah Berita" di halaman daftar berita.',
          'Ketik poin-poin inti berita di kolom AI Generator.',
          'Klik "Generate" dan biarkan sistem membuat draf lengkap.',
          'Lakukan revisi pada teks, tambahkan gambar utama, dan set kategori.',
          'Ubah status menjadi "Published" dan simpan.',
        ],
      },
    ],
    tips: [
      'Gunakan asisten AI untuk menghemat waktu penulisan draf awal.',
      'Pastikan gambar utama memiliki rasio lebar (landscape) agar tampil proporsional di halaman depan.',
      'Gunakan status "Draft" jika berita masih perlu ditinjau oleh pimpinan sebelum tayang.',
    ],
  },
  {
    id: 'programs',
    title: 'Program Unggulan',
    category: 'Konten & Publikasi',
    href: '/admin/programs',
    summary: 'Mengelola informasi program pendidikan dan keunggulan pondok yang ditampilkan di landing page untuk calon wali santri.',
    audience: ['Superadmin', 'Tim Media'],
    quickActions: [
      'Tambah program baru lengkap dengan ikon dan deskripsi menarik.',
      'Edit urutan atau konten program yang sudah ada.',
      'Unggah foto kegiatan program untuk memberikan gambaran nyata kepada publik.',
    ],
    workflows: [
      {
        title: 'Menambah program baru',
        steps: [
          'Masuk ke halaman Program, klik "Tambah Program".',
          'Isi judul program (contoh: Tahfidz Intensif) dan deskripsi singkat.',
          'Pilih atau unggah gambar yang merepresentasikan program tersebut.',
          'Simpan dan verifikasi tampilannya di halaman depan website.',
        ],
      },
    ],
    tips: [
      'Gunakan bahasa yang persuasif tapi tetap informatif.',
      'Pilih gambar berkualitas tinggi karena ini adalah "etalase" utama lembaga Anda.',
    ],
  },
  {
    id: 'agendas',
    title: 'Kalender Agenda',
    category: 'Konten & Publikasi',
    href: '/admin/agendas',
    summary: 'Manajemen kalender kegiatan pondok. Menginformasikan jadwal kajian, libur santri, hingga acara besar kepada wali santri dan publik.',
    audience: ['Semua staf admin'],
    quickActions: [
      'Tambah agenda baru dengan lokasi dan koordinat Google Maps.',
      'Atur kategori agenda (Akademik, Umum, Ibadah).',
      'Update status agenda jika ada pembatalan atau perubahan jadwal.',
    ],
    workflows: [
      {
        title: 'Mempublikasikan agenda baru',
        steps: [
          'Klik "Tambah Agenda" di halaman daftar agenda.',
          'Isi judul kegiatan dan pilih tanggal pelaksanaan.',
          'Ketik lokasi acara (ruangan atau alamat lengkap).',
          'Tambahkan deskripsi singkat mengenai isi acara tersebut.',
          'Simpan dan pastikan muncul di kalender halaman publik.',
        ],
      },
    ],
    tips: [
      'Gunakan judul yang singkat namun informatif.',
      'Jika acara rutin, Anda bisa mencantumkan frekuensi acara di kolom deskripsi.',
    ],
  },
  {
    id: 'gallery',
    title: 'Galeri Visual (Foto)',
    category: 'Konten & Publikasi',
    href: '/admin/gallery',
    summary: 'Kumpulan dokumentasi foto kegiatan harian dan acara besar. Media utama untuk menunjukkan transparansi kegiatan kepada orang tua.',
    audience: ['Superadmin', 'Tim Media'],
    quickActions: [
      'Buat Album Baru untuk mengelompokkan foto per kegiatan.',
      'Unggah banyak foto sekaligus (Bulk Upload) ke dalam album.',
      'Pilih satu foto terbaik sebagai Sampul Album (Cover).',
    ],
    workflows: [
      {
        title: 'Membuat dokumentasi album baru',
        steps: [
          'Masuk ke menu Galeri Foto, klik "Buat Album".',
          'Beri nama album yang deskriptif (contoh: Wisuda Tahfidz 2026).',
          'Unggah koleksi foto hasil jepretan kegiatan tersebut.',
          'Klik pada salah satu foto dan pilih "Jadikan Sampul".',
          'Publish album agar dapat dilihat oleh wali santri.',
        ],
      },
    ],
    tips: [
      'Sortir foto terlebih dahulu, hindari mengunggah foto yang buram atau duplikat.',
      'Album dengan jumlah foto yang cukup (10-20 foto) lebih menarik daripada album yang terlalu sedikit.',
    ],
  },
  {
    id: 'videos',
    title: 'Galeri Video (YouTube)',
    category: 'Konten & Publikasi',
    href: '/admin/videos',
    summary: 'Integrasi video kegiatan pondok dari channel YouTube resmi. Mempermudah pemutaran video langsung di website tanpa berpindah aplikasi.',
    audience: ['Superadmin', 'Tim Media'],
    quickActions: [
      'Tambah video baru hanya dengan menempelkan (copy-paste) URL YouTube.',
      'Kelola seri video (Playlist) agar penonton mudah mencari video terkait.',
      'Tampilkan video khusus di halaman utama (Video Unggulan).',
    ],
    workflows: [
      {
        title: 'Menambah konten video baru',
        steps: [
          'Buka video di YouTube, copy URL browsernya.',
          'Kembali ke Dashboard Admin, klik "Tambah Video".',
          'Paste URL di kolom yang tersedia; sistem akan otomatis mengambil data thumbnail.',
          'Berikan judul dan simpan.',
        ],
      },
    ],
    tips: [
      'Pastikan video di YouTube disetel sebagai "Public" agar bisa diputar di website.',
      'Gunakan metadata yang baik di YouTube agar pencarian lebih optimal.',
    ],
  },
  {
    id: 'psb',
    title: 'Pendaftaran (PSB)',
    category: 'Kesantrian',
    href: '/admin/psb',
    summary: 'Manajemen database pendaftaran calon santri baru. Memungkinkan verifikasi berkas, wawancara, dan pengambilan keputusan kelulusan.',
    audience: ['Superadmin', 'Panitia PSB'],
    quickActions: [
      'Pantau statistik pendaftar (Baru, Review, Lulus, Ditolak).',
      'Lihat detail biodata lengkap dan unggahan dokumen calon santri.',
      'Ubah status pendaftaran secara kolektif atau individual.',
      'Hapus data pendaftaran yang dianggap sampah atau duplikat.',
    ],
    workflows: [
      {
        title: 'Proses seleksi pendaftar',
        steps: [
          'Buka daftar pendaftar di menu PSB.',
          'Gunakan filter status "Pending" untuk melihat pendaftar baru.',
          'Klik "Detail" untuk meninjau kelengkapan berkas pendaftar.',
          'Ubah status ke "Review" jika sedang dalam proses wawancara/tes.',
          'Set status ke "Accepted" jika lulus, atau "Rejected" jika tidak memenuhi syarat.',
        ],
      },
    ],
    tips: [
      'Status "Review" sangat berguna untuk menandai santri yang sudah menyerahkan berkas tapi belum tes.',
      'Data santri yang sudah "Accepted" biasanya akan diproses lebih lanjut untuk modul Akademik/eRapor.',
    ],
  },
  {
    id: 'academics',
    title: 'eRapor (Akademik)',
    category: 'Kesantrian',
    href: '/admin/academics',
    summary: 'Pusat pengelolaan nilai, presensi, tahfidz, rekap akademik, dan pencetakan raport santri. Data ini juga tampil di portal wali santri.',
    audience: ['Superadmin', 'Bendahara'],
    quickActions: [
      'Input nilai UTS, UAS, dan tugas santri per mata pelajaran.',
      'Catat kehadiran harian santri (hadir, izin, sakit, alpha).',
      'Catat progres tahfidz (surah, juz, ayat, status lulus/proses).',
      'Lihat rekap peringkat kelas dan cetak raport individu atau massal.',
      'Kelola daftar mata pelajaran beserta kategorinya.',
    ],
    workflows: [
      {
        title: 'Input nilai santri',
        steps: [
          'Buka tab Nilai, pilih semester dan tahun ajaran yang sesuai.',
          'Klik Tambah Data atau Input Massal untuk mengisi nilai beberapa santri sekaligus.',
          'Isi skor UTS, UAS, dan Tugas. Nilai akhir dan huruf grade dihitung otomatis oleh sistem.',
          'Simpan dan cek di tab Dashboard untuk melihat ringkasan.',
        ],
      },
      {
        title: 'Cetak raport santri',
        steps: [
          'Buka tab Cetak Raport, pilih semester dan tahun ajaran.',
          'Untuk raport individu: pilih santri dari dropdown, lalu klik Preview atau Download PDF.',
          'Untuk raport massal: centang santri yang diinginkan, lalu klik Download Raport Massal.',
        ],
      },
    ],
    tips: [
      'Tab Dashboard menampilkan ringkasan rata-rata kelas dan peringkat santri secara otomatis.',
      'Jika ada santri yang alpha, sistem bisa langsung mengirim notifikasi WhatsApp ke wali.',
      'Gunakan fitur Edit Massal untuk memperbarui banyak nilai sekaligus.',
      'Data eRapor akan otomatis tampil di Portal Wali Santri setelah disimpan.',
    ],
  },
  {
    id: 'teachers',
    title: 'Staf Pengajar (Asatidzah)',
    category: 'Kesantrian',
    href: '/admin/teachers',
    summary: 'Manajemen profil tenaga pendidik dan staf kependidikan. Informasi ini ditampilkan di halaman "Profil Pengajar" pada website publik.',
    audience: ['Superadmin', 'Tim Media'],
    quickActions: [
      'Tambah pengajar baru lengkap dengan foto, gelar, dan riwayat singkat.',
      'Edit profil pengajar jika ada perubahan amanah atau jabatan.',
      'Urutkan tampilan pengajar agar sesuai dengan hierarki struktural pondok.',
      'Nonaktifkan pengajar yang sudah tidak bertugas agar tidak tampil di publik.',
    ],
    workflows: [
      {
        title: 'Manajemen profil pengajar',
        steps: [
          'Masuk ke menu Staf Pengajar, klik "Tambah Pengajar".',
          'Isi nama lengkap beserta gelar akademik/keagamaan.',
          'Pilih kategori atau bidang (contoh: Pengajar Tahfidz, Bahasa Arab).',
          'Unggah foto profil resmi dengan latar belakang yang seragam (rekomendasi).',
          'Simpan dan cek pembaruannya di halaman profil website publik.',
        ],
      },
    ],
    tips: [
      'Gunakan foto dengan resolusi tinggi dan pencahayaan yang baik untuk kesan profesional.',
      'Konsistensi penulisan gelar sangat penting untuk kerapian data.',
      'Gunakan kolom deskripsi untuk menonjolkan keahlian khusus pengajar.',
    ],
  },
  {
    id: 'disciplines',
    title: 'Kedisiplinan Santri',
    category: 'Kesantrian',
    href: '/admin/disciplines',
    summary: 'Memantau sisa poin kedisiplinan santri dan mencatat setiap pelanggaran berdasarkan tata tertib pesantren. Setiap santri dimulai dengan 100 poin di awal tahun ajaran.',
    audience: ['Superadmin', 'Panitia PSB'],
    quickActions: [
      'Lihat sisa poin seluruh santri dalam satu tabel dengan indikator warna.',
      'Catat pelanggaran baru dan kurangi poin santri secara otomatis.',
      'Pantau riwayat seluruh pelanggaran yang pernah terjadi.',
      'Identifikasi santri yang poinnya sudah kritis dan perlu tindak lanjut.',
    ],
    workflows: [
      {
        title: 'Mencatat pelanggaran santri',
        steps: [
          'Klik tombol "+ Catat Pelanggaran" di pojok kanan atas.',
          'Isi ID santri yang melanggar.',
          'Pilih kategori pelanggaran dari dropdown (Ibadah, Akhlaq, Keamanan, dll).',
          'Tulis detail spesifik pelanggaran yang dilakukan.',
          'Masukkan jumlah poin yang dikurangi sesuai tata tertib.',
          'Isi nama ustadz/musyrif pelapor dan sanksi yang diberikan.',
          'Klik Simpan. Poin santri akan otomatis berkurang.',
        ],
      },
      {
        title: 'Memantau santri bermasalah',
        steps: [
          'Buka tab Rekapitulasi Poin untuk melihat semua santri.',
          'Perhatikan kartu statistik: "Perlu Perhatian" (poin 56-85) dan "Kritis" (poin ≤ 55).',
          'Santri dengan status SP1, SP2, atau SP3 perlu segera ditindaklanjuti sesuai prosedur pesantren.',
          'Buka tab Riwayat Pelanggaran untuk melihat detail kronologis pelanggaran santri tertentu.',
        ],
      },
    ],
    tips: [
      'Status sanksi otomatis berubah sesuai sisa poin: Aman (>85) → Teguran (≤85) → Pemanggilan Ortu (≤75) → SP1 (≤55) → SP2 (≤25) → SP3 (≤1).',
      'Warna di tabel berubah secara dinamis: hijau untuk aman, kuning untuk perlu perhatian, dan merah untuk kritis.',
      'Pelapor tidak harus memiliki akun di sistem — cukup tulis namanya.',
      'Setiap pelanggaran tercatat permanen di riwayat dan tidak bisa dihapus, jadi pastikan data sudah benar sebelum menyimpan.',
      'Rujukan lengkap poin pelanggaran ada di dokumen aturan_santri.docx.',
    ],
  },
  {
    id: 'donations',
    title: 'Program Donasi & Wakaf',
    category: 'Keuangan',
    href: '/admin/donations',
    summary: 'Mengelola inisiatif penggalangan dana untuk pembangunan, beasiswa, atau kegiatan sosial. Terintegrasi dengan pelaporan transparansi dana.',
    audience: ['Superadmin', 'Bendahara'],
    quickActions: [
      'Buat kampanye donasi baru dengan target dana dan batas waktu.',
      'Update status kampanye (Aktif, Selesai, atau Ditangguhkan).',
      'Tampilkan persentase pencapaian dana secara real-time di landing page.',
      'Kelola daftar donatur dan ucapan terima kasih.',
    ],
    workflows: [
      {
        title: 'Meluncurkan kampanye donasi baru',
        steps: [
          'Klik "Tambah Program Donasi".',
          'Isi nama program yang menggugah (contoh: Wakaf Pembangunan Masjid).',
          'Tentukan target nominal dana dan unggah poster/gambar campaign.',
          'Tulis deskripsi rinci mengenai urgensi dan manfaat donasi tersebut.',
          'Klik Simpan. Program akan otomatis muncul di menu Donasi website.',
        ],
      },
    ],
    tips: [
      'Update progres pencapaian dana secara berkala untuk meningkatkan kepercayaan donatur.',
      'Tampilkan foto perkembangan proyek (misal: progres bangunan) untuk laporan transparansi.',
    ],
  },
  {
    id: 'payments',
    title: 'Pembayaran SPP & Biaya',
    category: 'Keuangan',
    href: '/admin/payments',
    summary: 'Sistem pencatatan administrasi keuangan santri, mulai dari uang pangkal, SPP bulanan, hingga biaya kegiatan lainnya.',
    audience: ['Superadmin', 'Bendahara'],
    quickActions: [
      'Input setoran pembayaran santri secara manual.',
      'Lihat riwayat transaksi keuangan lengkap berdasarkan rentang waktu.',
      'Verifikasi status pembayaran (Pending, Success, Failed).',
      'Pantau tunggakan SPP yang belum terbayar.',
    ],
    workflows: [
      {
        title: 'Mencatat setoran SPP offline',
        steps: [
          'Cari nama santri di kotak pencarian modul Pembayaran.',
          'Klik "Tambah Pembayaran".',
          'Isi kategori biaya (contoh: Syahriah/SPP), nominal, dan metode bayar (Tunai/Transfer).',
          'Tulis catatan jika perlu (contoh: SPP Bulan Februari).',
          'Simpan data dan berikan kuitansi jika diperlukan.',
        ],
      },
    ],
    tips: [
      'Gunakan deskripsi yang baku seperti "SPP - [Bulan]" agar laporan keuangan bulanan rapi.',
      'Setiap pembayaran yang berhasil akan otomatis muncul di Portal Wali Santri.',
    ],
  },
  {
    id: 'facilities',
    title: 'Sarana & Fasilitas',
    category: 'Layanan',
    href: '/admin/facilities',
    summary: 'Katalog visual fasilitas penunjang pendidikan dan kehidupan di pondok. Menampilkan kenyamanan lingkungan belajar kepada masyarakat.',
    audience: ['Superadmin', 'Tim Media'],
    quickActions: [
      'Kelola foto-foto gedung, asrama, masjid, dan laboratorium.',
      'Berikan deskripsi spesifik mengenai kapasitas atau keunggulan tiap fasilitas.',
      'Atur urutan tampilan fasilitas di halaman "Fasilitas" website.',
    ],
    workflows: [
      {
        title: 'Mendokumentasikan fasilitas baru',
        steps: [
          'Siapkan foto bangunan atau sarana dalam kualitas terbaik.',
          'Masuk ke menu Fasilitas Publik, klik "Tambah Fasilitas".',
          'Tulis nama fasilitas (contoh: Perpustakaan Digital) dan deskripsi singkat.',
          'Unggah gambar dan simpan.',
        ],
      },
    ],
    tips: [
      'Gunakan foto sudut lebar (wide) untuk area bangunan agar terlihat megah.',
      'Deskripsi yang menonjolkan "Kenyamanan" dan "Kebersihan" sangat menarik bagi calon wali santri.',
    ],
  },
  {
    id: 'messages',
    title: 'Pesan Masuk (Inbox)',
    category: 'Layanan',
    href: '/admin/messages',
    summary: 'Manajemen komunikasi dari pengunjung website. Pesan yang masuk via formulir kontak dapat segera dibalas atau ditindaklanjuti.',
    audience: ['Superadmin', 'Panitia PSB'],
    quickActions: [
      'Baca pesan dari tamu atau calon wali santri di Inbox.',
      'Gunakan fitur Balas Cepat via WhatsApp untuk respon instan.',
      'Tandai pesan sebagai "Sudah Dibaca" atau "Arsip" untuk kerapian.',
      'Filter pesan berdasarkan status tindak lanjut.',
    ],
    workflows: [
      {
        title: 'Merespon pesan pengunjung',
        steps: [
          'Buka menu Pesan & Inbox.',
          'Pilih pesan yang belum dibaca (bertanda khusus).',
          'Klik pada detail pesan untuk melihat identitas pengirim.',
          'Jika pengirim mencantumkan nomor WA, klik ikon WhatsApp untuk membalas langsung.',
          'Setelah selesai, tandai pesan sebagai "Tindak Lanjut Selesai".',
        ],
      },
    ],
    tips: [
      'Respon yang cepat (di bawah 24 jam) memberikan kesan profesionalisme lembaga.',
      'Pastikan untuk selalu mengarsip pesan lama agar inbox tidak menumpuk.',
    ],
  },
  {
    id: 'notifications',
    title: 'Log Notifikasi WA',
    category: 'Sistem',
    href: '/admin/notifications',
    summary: 'Memantau pengiriman pesan otomatis (SPP, Info Pendaftaran, Alpha) yang terkirim melalui sistem gateway WhatsApp.',
    audience: ['Superadmin', 'Bendahara'],
    quickActions: [
      'Cek apakah notifikasi SPP atau Alpha berhasil terkirim ke wali santri.',
      'Identifikasi kegagalan pengiriman karena nomor tidak valid atau masalah server.',
      'Kirim ulang notifikasi yang gagal (bila diperlukan).',
    ],
    workflows: [
      {
        title: 'Mengecek kegagalan pengiriman',
        steps: [
          'Masuk ke menu Notifikasi WA.',
          'Gunakan filter status "Failed" atau "Error".',
          'Lihat pada kolom detail untuk mengetahui alasan kegagalan.',
          'Jika masalah ada pada API, laporkan ke tim IT sistem.',
        ],
      },
    ],
    tips: [
      'Notifikasi WA sangat bergantung pada masa aktif API Gateway Anda.',
      'Pastikan nomor HP santri di database menggunakan format internasional (contoh: 62812...) agar sukses terkirim.',
    ],
  },
  {
    id: 'users',
    title: 'Hak Akses & Pengguna',
    category: 'Sistem',
    href: '/admin/users',
    summary: 'Manajemen akun staf pengelola sistem. Mengatur siapa yang bisa melihat data keuangan, mengedit berita, atau mengelola santri.',
    audience: ['Superadmin'],
    quickActions: [
      'Tambah pengguna baru (staf) dan tentukan perannya (Role).',
      'Ubah kata sandi atau email staf jika diperlukan.',
      'Monitor siapa saja yang sedang aktif memiliki akses ke sistem.',
      'Nonaktifkan akses staf yang sudah tidak bertugas kembali.',
    ],
    workflows: [
      {
        title: 'Menambah admin baru',
        steps: [
          'Di halaman Manajemen Pengguna, klik "Tambah Pengguna".',
          'Isi nama, email resmi, dan password awal.',
          'Pilih salah satu Role (contoh: Bendahara untuk akses keuangan saja).',
          'Berikan informasi login kepada staf terkait secara aman.',
        ],
      },
    ],
    tips: [
      'Gunakan email lembaga atau email aktif untuk staf agar pemulihan akun mudah.',
      'Jangan memberikan akses "Superadmin" kecuali benar-benar diperlukan untuk keamanan data tertinggi.',
    ],
  },
  {
    id: 'logs',
    title: 'Log Aktivitas (Audit)',
    category: 'Sistem',
    href: '/admin/logs',
    summary: 'Catatan rekam jejak digital segala aktivitas perubahan data di sistem. Esensial untuk transparansi dan keamanan.',
    audience: ['Superadmin'],
    quickActions: [
      'Lacak siapa yang mengubah data santri atau menghapus berita.',
      'Cek kapan tindakan tertentu dilakukan (timestamp).',
      'Filter log berdasarkan nama pengguna atau jenis tindakan (Create, Update, Delete).',
    ],
    workflows: [
      {
        title: 'Investigasi perubahan data',
        steps: [
          'Buka menu Log Sistem.',
          'Cari berdasarkan nama santri atau modul (misal: "Kedisiplinan").',
          'Lihat detail log untuk mengetahui "Siapa" melakukan "Apa" dan "Kapan".',
        ],
      },
    ],
    tips: [
      'Gunakan log sistem untuk membuktikan validitas data jika terjadi perselisihan informasi.',
      'Log adalah data "Read-Only" yang tidak bisa dihapus oleh siapapun kecuali database admin.',
    ],
  },
  {
    id: 'settings',
    title: 'Pengaturan Konfigurasi',
    category: 'Sistem',
    href: '/admin/settings',
    summary: 'Pusat kendali ekosistem digital Darussunnah. Mengatur identitas lembaga, konfigurasi website, asisten AI, hingga integrasi sistem.',
    audience: ['Superadmin'],
    quickActions: [
      'Ubah Logo, Nama Lembaga, dan Alamat di tab Identitas.',
      'Atur Slider Beranda, Sambutan Pimpinan, dan Kartu Info depan.',
      'Konfigurasi Kunci API Meta/Llama untuk fitur AI Generator.',
      'Kelola tautan Sosial Media dan Nomor WhatsApp Admin.',
    ],
    workflows: [
      {
        title: 'Mengubah struktur halaman depan (Landing Page)',
        steps: [
          'Buka menu Pengaturan. Masuk ke tab "Halaman Beranda".',
          'Ubah teks judul besar (Hero Title) atau deskripsi pondok.',
          'Atur urutan slider atau hapus gambar slider yang sudah usang.',
          'Klik "Simpan Semua" dan refresh halaman depan website untuk melihat efeknya.',
        ],
      },
    ],
    tips: [
      'Tab "AI & Lisensi" sebaiknya hanya diakses oleh administrator it karena berisi kunci akses teknis.',
      'Selalu cek hasil perubahan di website publik menggunakan mode Incognito/Private agar tidak terkena cache browser.',
    ],
  },
];

export const roleAccessMatrix: RoleAccessRow[] = [
  {
    module: 'Dashboard Admin',
    superadmin: 'Ya',
    tim_media: 'Ya',
    bendahara: 'Ya',
    panitia_psb: 'Ya',
    user: 'Tidak',
  },
  {
    module: 'Berita, Program, Galeri, Video, Guru, Fasilitas',
    superadmin: 'Ya',
    tim_media: 'Ya',
    bendahara: 'Tidak',
    panitia_psb: 'Tidak',
    user: 'Tidak',
  },
  {
    module: 'Agenda dan FAQ',
    superadmin: 'Ya',
    tim_media: 'Ya',
    bendahara: 'Ya',
    panitia_psb: 'Ya',
    user: 'Tidak',
  },
  {
    module: 'PSB Admin dan Inbox',
    superadmin: 'Ya',
    tim_media: 'Tidak',
    bendahara: 'Tidak',
    panitia_psb: 'Ya',
    user: 'Tidak',
  },
  {
    module: 'Kedisiplinan Santri',
    superadmin: 'Ya',
    tim_media: 'Tidak',
    bendahara: 'Tidak',
    panitia_psb: 'Ya',
    user: 'Tidak',
  },
  {
    module: 'Pembayaran, Donasi, Notifikasi, Akademik',
    superadmin: 'Ya',
    tim_media: 'Tidak',
    bendahara: 'Ya',
    panitia_psb: 'Tidak',
    user: 'Tidak',
  },
  {
    module: 'Users, Logs, Settings',
    superadmin: 'Ya',
    tim_media: 'Tidak',
    bendahara: 'Tidak',
    panitia_psb: 'Tidak',
    user: 'Tidak',
  },
  {
    module: 'Portal PSB pribadi',
    superadmin: 'Bukan flow utama',
    tim_media: 'Tidak',
    bendahara: 'Tidak',
    panitia_psb: 'Tidak',
    user: 'Ya',
  },
];

export function getAdminDocById(id: string | null | undefined) {
  if (!id) {
    return adminDocSections[0];
  }

  return (
    adminDocSections.find((section) => section.id === id || section.href === id) ||
    adminDocSections.find((section) => id.includes(section.id) || id.includes(section.href.replace('/admin/', ''))) ||
    adminDocSections[0]
  );
}
