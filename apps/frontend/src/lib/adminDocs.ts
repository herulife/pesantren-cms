export interface AdminDocSection {
  id: string;
  title: string;
  category: string;
  href: string;
  summary: string;
  image?: {
    src: string;
    alt: string;
  };
  audience: string[];
  quickActions: string[];
  workflows: Array<{
    title: string;
    steps: string[];
  }>;
  tips: string[];
  visualSteps?: Array<{
    title: string;
    description: string;
    image: string;
    alt: string;
  }>;
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
    title: 'Halaman Depan (Dashboard)',
    category: 'Mulai dari sini',
    href: '/admin',
    image: { src: '/assets/tutorials/admin-dashboard.png', alt: 'Tampilan halaman depan admin berisi ringkasan menu dan pintasan cepat' },
    summary:
      'Halaman pertama setelah masuk. Isinya ringkasan angka-angka penting supaya tahu apa yang harus dikerjakan hari ini.',
    audience: ['Semua petugas'],
    quickActions: [
      'Lihat angka ringkasan (pesaftar baru, pembayaran, pesan masuk) tanpa buka menu satu-satu.',
      'Klik angka atau tombol pintasan untuk langsung lompat ke halaman kerjanya.',
      'Jadikan halaman ini tempat mulai kerja setiap hari.',
    ],
    workflows: [
      {
        title: 'Cara mulai kerja tiap pagi',
        steps: [
          'Masuk (login) ke halaman admin.',
          'Lihat kotak-kotak angka di bagian atas. Cari yang perlu perhatian (misalnya pendaftar baru).',
          'Klik angka atau menu di sebelah kiri untuk mengerjakannya.',
        ],
      },
    ],
    tips: [
      'Dashboard hanya untuk melihat ringkasan, mengeditnya tetap di menu masing-masing.',
      'Kalau ada angka yang aneh, klik dan cek langsung ke halamannya.',
    ],
  },
  {
    id: 'news',
    title: 'Berita',
    category: 'Isi Website',
    href: '/admin/news',
    image: { src: '/assets/tutorials/admin-news.png', alt: 'Tampilan menu Berita dengan tombol Tulis Berita dan daftar berita' },
    summary:
      'Tempat menulis berita pondok supaya website terlihat hidup. Contoh: kegiatan santri, pengumuman, prestasi.',
    audience: ['Pimpinan', 'Tim Media'],
    quickActions: [
      'Tulis berita baru: judul, isi, foto, lalu tayangkan.',
      'Simpan dulu sebagai simpanan kalau belum siap tayang.',
      'Edit atau hapus berita lama yang sudah tidak berlaku.',
    ],
    workflows: [
      {
        title: 'Cara posting berita baru',
        steps: [
          'Klik menu Berita di sebelah kiri, lalu klik tombol Tambah.',
          'Isi judul berita dengan kalimat yang jelas.',
          'Tulis isi berita. Boleh dibantu AI dulu, lalu baca ulang dan rapikan.',
          'Klik Upload untuk pasang foto. Foto miring (landscape) hasilnya paling bagus.',
          'Pilih Tayang kalau sudah siap dilihat orang, atau Simpanan kalau masih mau diedit nanti.',
          'Klik Simpan, lalu buka halaman berita di website untuk memastikan tampil.',
        ],
      },
    ],
    tips: [
      'Judul yang jelas contohnya: "Santri Al-Maa Juara Tahfidz". Hindari judul singkatan.',
      'Foto maksimal 5MB. Foto HP biasanya kebesaran, kecilkan dulu atau pilih yang kecil.',
      'Tombol Tayang = langsung terlihat pengunjung. Tombol Simpanan = hanya admin yang tahu.',
    ],
  },
  {
    id: 'programs',
    title: 'Program Pondok',
    category: 'Isi Website',
    href: '/admin/programs',
    image: { src: '/assets/tutorials/admin-programs.png', alt: 'Tampilan menu Program Pondok: tab Program Unggulan dan Ekstrakurikuler' },
    summary:
      'Daftar program yang tampil di halaman Program website. Contoh: Tahfidz, Bahasa Arab, Ekstrakurikuler. Ada 2 jenis: Program Unggulan dan Ekstrakurikuler.',
    audience: ['Pimpinan', 'Tim Media'],
    quickActions: [
      'Tambah program baru lengkap dengan foto dan penjelasan.',
      'Ganti foto program: bisa Upload dari HP, pilih dari Galeri, atau tempel link.',
      'Atur Nomor Urut Tampil supaya urutan kartu di website rapi.',
      'Pisahkan jenisnya: Program Unggulan atau Ekstrakurikuler (pilih di kolom Kategori).',
    ],
    workflows: [
      {
        title: 'Cara tambah program baru',
        steps: [
          'Klik menu Program Pondok di sebelah kiri.',
          'Pilih tabnya dulu: Program Unggulan atau Ekstrakurikuler.',
          'Klik tombol Tambah, lalu isi judul. Kolom kode (slug) terisi sendiri.',
          'Pilih Kategori yang sama dengan tab tadi.',
          'Isi foto: klik Upload untuk ambil dari HP, klik Galeri untuk pakai foto yang sudah ada, atau tempel link di kolomnya.',
          'Foto maksimal 5MB dan format JPG/PNG. Foto iPhone (HEIC) tidak bisa, simpan dulu sebagai JPG.',
          'Isi Nomor Urut Tampil (1 tampil paling atas), lalu isi penjelasan singkat dan lengkap.',
          'Klik Simpan Program, lalu buka halaman Program di website untuk memastikan tampil.',
        ],
      },
      {
        title: 'Cara ganti foto program lama',
        steps: [
          'Buka menu Program Pondok, cari kartunya, klik ikon pensil (Edit).',
          'Di bagian Gambar Utama, klik Upload atau Galeri, pilih foto baru.',
          'Pastikan kolom gambar sudah berganti ke foto baru (bukan yang lama).',
          'Klik Simpan Program.',
        ],
      },
    ],
    tips: [
      'Satu program = satu kartu di website. Jangan bikin judul kembar.',
      'Penjelasan singkat cukup 1-2 kalimat yang menyebut manfaatnya.',
      'Pakai foto kegiatan asli pondok supaya pengunjung percaya.',
    ],
  },
  {
    id: 'agendas',
    title: 'Agenda Kegiatan',
    category: 'Isi Website',
    href: '/admin/agendas',
    image: { src: '/assets/tutorials/admin-agendas.png', alt: 'Tampilan menu Agenda Kegiatan' },
    summary:
      'Jadwal acara pondok yang tampil di website. Contoh: kajian, lomba, libur santri, penerimaan tamu.',
    audience: ['Semua petugas'],
    quickActions: [
      'Tambah acara baru: nama, tanggal, tempat.',
      'Ubah tanggal atau tempat kalau acara diundur atau pindah.',
      'Hapus acara yang batal supaya pengunjung tidak salah datang.',
    ],
    workflows: [
      {
        title: 'Cara tambah agenda baru',
        steps: [
          'Klik menu Agenda di sebelah kiri, lalu klik Tambah.',
          'Isi nama acara, tanggal mulai (dan tanggal selesai kalau lebih dari sehari), dan tempatnya.',
          'Tulis penjelasan singkat acaranya tentang apa.',
          'Klik Simpan, lalu cek di halaman agenda website.',
        ],
      },
    ],
    tips: [
      'Tulis nama acara apa adanya, contoh: "Kajian Rutin Ahad Pagi".',
      'Kalau acara berubah, ubah datanya (jangan bikin baru) supaya tidak dobel.',
    ],
  },
  {
    id: 'gallery',
    title: 'Galeri Foto',
    category: 'Isi Website',
    href: '/admin/gallery',
    image: { src: '/assets/tutorials/admin-gallery.png', alt: 'Tampilan Galeri Foto: daftar album kegiatan' },
    summary:
      'Kumpulan foto kegiatan pondok. Foto-foto di sini juga bisa dipakai ulang untuk berita dan program.',
    audience: ['Pimpinan', 'Tim Media'],
    quickActions: [
      'Bikin album baru untuk tiap acara (satu acara = satu album).',
      'Masukkan banyak foto sekaligus ke dalam album.',
      'Pilih 1 foto paling bagus jadi sampul (cover) album.',
    ],
    workflows: [
      {
        title: 'Cara bikin album foto acara',
        steps: [
          'Klik menu Galeri di sebelah kiri, lalu klik Tambah/Album Baru.',
          'Isi nama album sesuai nama acaranya.',
          'Klik Upload lalu pilih foto-foto terbaik dari HP atau komputer (bisa banyak sekaligus).',
          'Tunggu sampai semua foto selesai terunggah.',
          'Pilih 1 foto jadi sampul album.',
          'Klik Simpan, lalu cek di halaman galeri website.',
        ],
      },
    ],
    tips: [
      'Pilih foto yang terang dan tidak blur.',
      'Foto maksimal 5MB per foto. Kalau gagal upload, biasanya karena kebesaran.',
      'Jangan campur foto beda acara dalam satu album.',
    ],
  },
  {
    id: 'videos',
    title: 'Video Kegiatan',
    category: 'Isi Website',
    href: '/admin/videos',
    image: { src: '/assets/tutorials/admin-videos.png', alt: 'Tampilan Pustaka Video: daftar seri video' },
    summary:
      'Daftar video YouTube pondok yang tampil di website. Videonya tetap di YouTube, di sini cuma ditempel link-nya.',
    audience: ['Pimpinan', 'Tim Media'],
    quickActions: [
      'Tempel link YouTube untuk nambah video baru.',
      'Beri judul yang sama gayanya supaya rapi (misal diawali nama acaranya).',
      'Tandai video penting sebagai unggulan.',
    ],
    workflows: [
      {
        title: 'Cara nambah video baru',
        steps: [
          'Buka video di YouTube, klik Bagikan, lalu Salin Link.',
          'Klik menu Video di halaman admin, lalu klik Tambah.',
          'Tempel link-nya di kolom yang tersedia, isi judulnya.',
          'Klik Simpan, lalu buka halaman video website dan tekan Play untuk memastikan bisa diputar.',
        ],
      },
    ],
    tips: [
      'Video di YouTube harus Publik, kalau Pribadi tidak bisa diputar di website.',
      'Pakai link biasa, bukan link Shorts yang aneh-aneh kalau bisa.',
    ],
  },
  {
    id: 'psb',
    title: 'Pendaftar Baru (PSB)',
    category: 'Santri',
    href: '/admin/psb',
    image: { src: '/assets/tutorials/admin-psb.png', alt: 'Tampilan Pendaftar Baru (PSB): daftar calon santri' },
    summary:
      'Daftar anak yang mendaftar jadi santri. Di sini panitia memeriksa data, melihat dokumen, dan menentukan diterima atau tidak.',
    audience: ['Pimpinan', 'Panitia PSB'],
    quickActions: [
      'Lihat daftar pendaftar dan statusnya (baru, diproses, diterima, ditolak).',
      'Buka data pendaftar untuk memeriksa biodata dan foto dokumen.',
      'Ubah status pendaftar sesuai hasil pemeriksaan.',
    ],
    workflows: [
      {
        title: 'Cara memeriksa pendaftar baru',
        steps: [
          'Klik menu PSB di sebelah kiri.',
          'Cari pendaftar yang statusnya Baru atau Pending (bisa pakai kolom cari).',
          'Klik namanya untuk membuka datanya. Periksa biodata dan buka satu-satu dokumennya (KK, raport, foto).',
          'Kalau lengkap, ubah statusnya ke tahap berikutnya sesuai aturan panitia.',
          'Kalau sudah keputusan akhir, ubah statusnya jadi Diterima atau Ditolak.',
        ],
      },
    ],
    tips: [
      'Pastikan nomor WA wali benar, karena pengumuman dikirim ke nomor itu.',
      'Jangan buru-buru menolak. Kalau dokumen kurang, hubungi walinya dulu.',
    ],
  },
  {
    id: 'academics',
    title: 'Nilai & Raport (eRapor)',
    category: 'Santri',
    href: '/admin/academics',
    image: { src: '/assets/tutorials/admin-academics.png', alt: 'Tampilan Dashboard eRapor: rekap nilai santri' },
    summary:
      'Tempat mengisi nilai, absen, hafalan, dan menyusun raport. Apa yang diisi di sini akan dilihat wali di HP-nya.',
    audience: ['Pimpinan', 'Bendahara'],
    quickActions: [
      'Isi nilai santri per mata pelajaran.',
      'Catat hadir/izin/sakit/alpha santri.',
      'Catat progres hafalan (tahfidz).',
      'Susun dan cetak raport.',
    ],
    workflows: [
      {
        title: 'Cara mengisi nilai santri',
        steps: [
          'Klik menu eRapor, buka bagian Nilai.',
          'Pilih dulu semester dan tahun ajarannya. Pastikan tidak salah pilih!',
          'Pilih kelas dan mata pelajaran.',
          'Isi nilainya satu-satu, lalu klik Simpan.',
          'Lihat ringkasannya untuk memastikan tidak ada yang kosong atau salah ketik.',
        ],
      },
      {
        title: 'Cara menyiapkan raport untuk wali',
        steps: [
          'Pastikan nilai, absen, dan hafalan semuanya sudah terisi.',
          'Buka bagian Raport/Rekap.',
          'Klik Lihat Dulu (preview) dan baca baik-baik.',
          'Kalau sudah benar, baru cetak atau bagikan.',
        ],
      },
    ],
    tips: [
      'Salah pilih semester = nilai masuk tempat yang salah. Cek 2 kali sebelum simpan.',
      'Semua yang disimpan di sini langsung bisa dilihat wali. Jadi teliti dulu baru simpan.',
    ],
  },
  {
    id: 'teachers',
    title: 'Data Pengajar',
    category: 'Santri',
    href: '/admin/settings?tab=Staf%20Mengajar',
    image: { src: '/assets/tutorials/admin-teachers.png', alt: 'Tampilan Data Pengajar di tab Staf Mengajar' },
    summary:
      'Daftar ustadz, ustadzah, dan guru yang tampil di website. Supaya pengunjung tahu siapa yang mengajar.',
    audience: ['Pimpinan', 'Tim Media'],
    quickActions: [
      'Tambah pengajar baru beserta fotonya.',
      'Ubah jabatan atau keterangan kalau ada yang berubah.',
      'Nonaktifkan pengajar yang sudah tidak mengajar (jangan dihapus kalau masih ada riwayatnya).',
    ],
    workflows: [
      {
        title: 'Cara nambah data pengajar',
        steps: [
          'Klik menu Pengajar, lalu klik Tambah.',
          'Isi nama lengkap (tulis gelar dengan cara yang sama untuk semua orang).',
          'Isi jabatan/bidang yang diajar dan keterangan singkat.',
          'Klik Upload untuk pasang foto, lalu klik Simpan.',
          'Cek di halaman pengajar website.',
        ],
      },
    ],
    tips: [
      'Foto semua pengajar sebaiknya gaya yang sama (misal semua formal) supaya rapi.',
      'Tulis nama dengan ejaan yang benar, karena tampil ke publik.',
    ],
  },
  {
    id: 'disciplines',
    title: 'Catatan Kedisiplinan',
    category: 'Santri',
    href: '/admin/disciplines',
    image: { src: '/assets/tutorials/admin-disciplines.png', alt: 'Tampilan Manajemen Kedisiplinan: rekapitulasi poin santri' },
    summary:
      'Catatan poin kedisiplinan santri. Tiap santri punya poin, kalau melanggar aturan poinnya berkurang.',
    audience: ['Pimpinan', 'Panitia PSB'],
    quickActions: [
      'Lihat sisa poin semua santri dalam satu tabel.',
      'Catat pelanggaran baru (poin otomatis berkurang).',
      'Awasi santri yang poinnya tinggal sedikit.',
    ],
    workflows: [
      {
        title: 'Cara mencatat pelanggaran',
        steps: [
          'Klik menu Kedisiplinan, lalu klik Catat Pelanggaran.',
          'Pilih nama santrinya (ketik namanya di kolom cari).',
          'Pilih jenis pelanggarannya dan tulis kejadian singkatnya (kapan, di mana, apa yang terjadi).',
          'Isi jumlah poin yang dikurangi, lalu klik Simpan.',
          'Pastikan sisa poin santri di tabel ikut berubah.',
        ],
      },
      {
        title: 'Cara mengawasi santri yang poinnya kritis',
        steps: [
          'Buka tabel rekap poin, cari yang warnanya merah/kritis.',
          'Klik namanya untuk melihat riwayat pelanggarannya.',
          'Baca polanya dulu (sering terlambat? sering izin?) sebelum memanggil santri/wali.',
        ],
      },
    ],
    tips: [
      'Tulis kejadian dengan jelas dan jujur, karena ini arsip pembinaan.',
      'Jangan asal kurang poin. Salah catat susah dilacak.',
    ],
  },
  {
    id: 'donations',
    title: 'Donasi',
    category: 'Keuangan',
    href: '/admin/donations',
    image: { src: '/assets/tutorials/admin-donations.png', alt: 'Tampilan menu Donasi: kampanye aktif dan agregat dana' },
    summary:
      'Kelola penggalangan dana (misal: bangun masjid, wakaf). Bikin halamannya, pantau uang masuk, dan setujui (verifikasi) tiap donasi.',
    audience: ['Pimpinan', 'Bendahara'],
    quickActions: [
      'Bikin halaman donasi baru: judul, target uang, poster.',
      'Lihat donasi yang masuk dan statusnya.',
      'Setujui donasi yang sudah ditransfer (verifikasi) supaya totalnya nambah.',
    ],
    workflows: [
      {
        title: 'Cara bikin halaman donasi baru',
        steps: [
          'Klik menu Donasi, lalu klik Tambah/Buat Baru.',
          'Isi judulnya yang jelas, contoh: "Wakaf Cat Tembok Asrama".',
          'Isi target uangnya (misal Rp 10.000.000, ketik angkanya saja).',
          'Isi tanggal berakhirnya kalau ada batas waktu.',
          'Tulis penjelasan: uangnya untuk apa, kenapa penting.',
          'Klik Upload untuk pasang poster/gambar, lalu klik Simpan.',
          'Buka halaman donasinya di website untuk memastikan tampil dan tombol donasinya bisa diklik.',
        ],
      },
      {
        title: 'Cara menyetujui donasi masuk',
        steps: [
          'Buka menu Donasi, pindah ke tab Transaksi/Donasi Masuk.',
          'Cari yang statusnya Pending (belum disetujui).',
          'Klik untuk melihat detailnya: nama, jumlah, bukti transfer.',
          'Cocokkan dengan mutasi/rekening. Kalau cocok, klik Setujui/Verifikasi.',
          'Total donasi di halaman publik akan otomatis bertambah.',
        ],
      },
    ],
    tips: [
      'Jangan setujui donasi sebelum uangnya benar-benar masuk.',
      'Poster yang jelas (judul besar, foto asli) bikin orang lebih percaya.',
    ],
    visualSteps: [
      {
        title: 'Buka menu Donasi, lihat kampanye aktif',
        description:
          'Klik menu Donasi di sebelah kiri. Halaman menampilkan kampanye yang berjalan beserta ringkasan dana. Klik Buat Kampanye untuk membuat halaman donasi baru.',
        image: '/assets/tutorials/admin-donations.png',
        alt: 'Screenshot asli menu Donasi berisi daftar kampanye aktif',
      },
      {
        title: 'Isi formulir kampanye donasi',
        description:
          'Isi judul yang jelas, tulis penjelasan uangnya untuk apa, isi target uang (cukup angkanya saja), tanggal berakhir kalau ada, lalu pasang poster/gambar kampanye.',
        image: '/assets/tutorials/admin-donations-add.png',
        alt: 'Screenshot asli formulir membuat kampanye donasi',
      },
      {
        title: 'Periksa dan verifikasi donasi masuk',
        description:
          'Buka tab Log Transaksi untuk melihat donasi yang sudah masuk. Buka detailnya, cocokkan dengan bukti transfer, lalu klik Setujui. Total dana di halaman publik otomatis bertambah.',
        image: '/assets/tutorials/admin-donations-log.png',
        alt: 'Screenshot asli tab Log Transaksi donasi',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Pembayaran Santri (SPP)',
    category: 'Keuangan',
    href: '/admin/payments',
    image: { src: '/assets/tutorials/admin-payments.png', alt: 'Tampilan Manajemen Pembayaran: tagihan SPP dan pembayaran manual' },
    summary:
      'Catatan uang masuk dari santri (SPP, daftar ulang, dll). Di sini mencatat bayar manual, memantau siapa yang sudah/belum bayar, dan melihat tagihan bulan berjalan.',
    audience: ['Pimpinan', 'Bendahara'],
    quickActions: [
      'Catat pembayaran yang diterima tunai/transfer secara manual.',
      'Cari transaksi pakai kolom cari (nama, status).',
      'Lihat riwayat bayar tiap santri.',
      'Mau tagihan dibuat otomatis tiap bulan? Lihat panduan Tagihan SPP Otomatis di bawah.',
    ],
    workflows: [
      {
        title: 'Cara mencatat bayar manual',
        steps: [
          'Klik menu Pembayaran, lalu klik Tambah.',
          'Pilih nama santri/penggunanya (ketik namanya).',
          'Ketik jumlah uangnya. Cek 2 kali, jangan sampai salah nol!',
          'Pilih jenisnya (SPP, daftar ulang, lainnya) dan cara bayarnya (tunai/transfer).',
          'Tulis catatan kalau perlu (misal: "SPP Januari, transfer BCA").',
          'Klik Simpan, lalu pastikan muncul di daftar dengan status yang benar.',
        ],
      },
    ],
    tips: [
      'Uang itu sensitif. Salah ketik nominal bikin laporan berantakan, jadi cek 2 kali.',
      'Tulis catatan yang rapi supaya akhir bulan gampang bikin laporan.',
    ],
  },
  {
  {
    id: 'spp-auto',
    title: 'Tagihan SPP Otomatis',
    category: 'Keuangan',
    href: '/admin-bs/tagihan-spp',
    image: { src: '/assets/tutorials/admin-spp.png', alt: 'Tampilan menu Tagihan SPP: form Generate dan kartu Tagihan Otomatis' },
    summary:
      'Biar tagihan SPP tiap bulan dibuat sendiri oleh sistem. Aktifkan sekali, sistem membuatkan tagihan bulan berjalan untuk semua santri aktif tanpa perlu klik Generate manual.',
    audience: ['Pimpinan', 'Bendahara'],
    quickActions: [
      'Aktifkan tagihan otomatis lewat satu saklar (toggle).',
      'Atur besar SPP dan tanggal jatuh tempo yang dipakai sistem.',
      'Opsional: kirim pengingat otomatis ke WhatsApp wali setiap tagihan dibuat.',
      'Lihat hasilnya di menu yang sama: tagihan bulan berjalan dibuat untuk semua santri aktif.',
    ],
    workflows: [
      {
        title: 'Cara mengaktifkan tagihan otomatis',
        steps: [
          'Klik menu Tagihan SPP (mode Classic, di grup Operasional).',
          'Cari kartu "Tagihan Otomatis" (tepat di bawah form Generate Tagihan).',
          'Aktifkan saklar "Aktifkan tagihan otomatis".',
          'Isi Besar SPP (nominal per santri per bulan) dan Jatuh Tempo (tanggal, contoh: 10).',
          'Kalau wali mau dikirim pengingat otomatis, aktifkan juga "Kirim WA ke wali" (pastikan status WhatsApp Gateway sudah tersambung).',
          'Klik Simpan Pengaturan.',
        ],
      },
      {
        title: 'Cara kerja tagihan otomatis',
        steps: [
          'Begitu disimpan, sistem langsung membuat tagihan bulan berjalan untuk semua santri aktif.',
          'Kalau bulan itu sudah punya tagihan, sistem TIDAK membuat dobel (aman dari duplikat).',
          'Setiap server di-restart, sistem mengecek lagi lalu membuat tagihan untuk bulan yang belum punya tagihan.',
          'Nominal dan jatuh tempo mengikuti pengaturan ini, bukan dari form Generate biasa.',
        ],
      },
    ],
    tips: [
      'Pilih SATU cara: manual (Generate Tagihan) atau otomatis. Kalau memakai otomatis, jangan klik Generate manual untuk bulan yang sama.',
      'Nomor WA wali diambil otomatis dari data santri (parent/father/mother phone) dan harus dalam format 62.',
      'Kalau nominal SPP naik, ubah pengaturannya lalu simpan lagi. Bulan berikutnya ikut nominal baru.',
    ],
  },
    id: 'facilities',
    title: 'Fasilitas Pondok',
    category: 'Isi Website',
    href: '/admin/facilities',
    image: { src: '/assets/tutorials/admin-facilities.png', alt: 'Tampilan Fasilitas Pondok' },
    summary:
      'Daftar fasilitas yang tampil di website. Contoh: masjid, asrama, kelas, lapangan, kantin.',
    audience: ['Pimpinan', 'Tim Media'],
    quickActions: [
      'Tambah fasilitas baru beserta fotonya.',
      'Perbarui keterangan kalau kondisinya berubah.',
      'Susun supaya yang paling bagus tampil duluan.',
    ],
    workflows: [
      {
        title: 'Cara nambah fasilitas baru',
        steps: [
          'Klik menu Fasilitas, lalu klik Tambah.',
          'Isi namanya (contoh: "Asrama Putra").',
          'Tulis keterangan singkat 1-2 kalimat.',
          'Klik Upload untuk pasang foto aslinya, lalu klik Simpan.',
          'Cek di halaman fasilitas website.',
        ],
      },
    ],
    tips: [
      'Pakai foto asli dan terbaru, jangan foto lama kalau bangunannya sudah berubah.',
      'Keterangan pendek lebih enak dibaca daripada panjang.',
    ],
  },
  {
    id: 'messages',
    title: 'Pesan Masuk',
    category: 'Layanan',
    href: '/admin/messages',
    image: { src: '/assets/tutorials/admin-messages.png', alt: 'Tampilan Kotak Masuk Publik: daftar pesan pengunjung' },
    summary:
      'Kotak surat dari website. Kalau ada pengunjung mengisi formulir Kontak, pesannya masuk ke sini.',
    audience: ['Pimpinan', 'Panitia PSB'],
    quickActions: [
      'Baca pesan baru yang masuk.',
      'Tandai sudah dibaca supaya tidak dobel dibalas.',
      'Balas cepat lewat WA kalau ada nomornya.',
    ],
    workflows: [
      {
        title: 'Cara menangani pesan baru',
        steps: [
          'Klik menu Pesan Masuk. Yang belum dibaca biasanya ada tandanya.',
          'Klik pesannya untuk membaca isi, nama, dan nomor pengirim.',
          'Kalau perlu jawaban cepat, klik tombol WA untuk membalas lewat WhatsApp.',
          'Kalau sudah beres, tandai sudah dibaca. Hapus hanya kalau benar-benar sampah.',
        ],
      },
    ],
    tips: [
      'Balas di hari yang sama. Pesan yang didiamkan bikin citra pondok jelek.',
      'Jangan hapus pesan penting, siapa tahu perlu bukti nanti.',
    ],
  },
  {
    id: 'notifications',
    title: 'Kirim WA (Notifikasi)',
    category: 'Sistem',
    href: '/admin/notifications',
    image: { src: '/assets/tutorials/admin-notifications.png', alt: 'Tampilan WhatsApp Gateway: status dan tombol broadcast' },
    summary:
      'Kirim pesan WhatsApp ke wali/santri langsung dari sini. Bisa kirim 1 orang atau sekaligus banyak (broadcast). Contoh: tagihan, nilai, pengumuman lulus.',
    audience: ['Pimpinan', 'Bendahara'],
    quickActions: [
      'Cek dulu: status WA harus Tersambung/Configured.',
      'Kirim pesan ke 1 nomor.',
      'Kirim ke banyak nomor sekaligus (misal semua yang nunggak).',
    ],
    workflows: [
      {
        title: 'Cara kirim pesan ke 1 orang',
        steps: [
          'Klik menu Notifikasi WA.',
          'Ketik nomornya diawali 62 (contoh: 62812xxxx, bukan 0812xxxx).',
          'Tulis pesannya dengan sopan dan jelas.',
          'Klik Kirim, lalu lihat statusnya: terkirim atau gagal.',
        ],
      },
      {
        title: 'Cara kirim ke banyak orang sekaligus',
        steps: [
          'Pastikan dulu status WA Tersambung/Configured.',
          'Pastikan datanya benar (tagihan/nilai yang mau dikirim sudah betul).',
          'Pilih jenis kirimannya (misal: tagihan).',
          'Klik kirim, lalu tunggu sampai prosesnya selesai. Jangan tutup halaman.',
        ],
      },
    ],
    tips: [
      'Nomor selalu diawali 62. Nomor 08 tidak akan terkirim.',
      'Jangan broadcast tengah malam. Kirim jam kerja.',
      'Cek isi pesannya dulu sebelum kirim massal, salah kirim tidak bisa ditarik.',
    ],
  },
  {
    id: 'users',
    title: 'Akun Petugas',
    category: 'Sistem',
    href: '/admin/users',
    image: { src: '/assets/tutorials/admin-users.png', alt: 'Tampilan Manajemen Pengguna: daftar akun dan hak akses' },
    summary:
      'Daftar akun orang-orang yang boleh masuk halaman admin. Hanya pimpinan yang boleh atur ini.',
    audience: ['Pimpinan'],
    quickActions: [
      'Bikin akun baru untuk petugas baru.',
      'Atur hak aksesnya (bagian apa saja yang boleh dibuka).',
      'Ganti password yang lupa. Hapus akun yang sudah tidak dipakai.',
    ],
    workflows: [
      {
        title: 'Cara bikin akun petugas baru',
        steps: [
          'Klik menu Akun Petugas, lalu klik Tambah.',
          'Isi nama, email, dan password awal (nanti disuruh ganti sendiri).',
          'Pilih hak aksesnya sesuai tugasnya saja, jangan semua dicentang.',
          'Klik Simpan, lalu kasih tahu email + password awalnya ke orangnya lewat jalur aman (jangan di grup umum).',
        ],
      },
      {
        title: 'Cara ganti password yang lupa',
        steps: [
          'Cari namanya di daftar akun.',
          'Klik Ganti Password, ketik password baru 2 kali.',
          'Klik Simpan, lalu kasih tahu password barunya ke orangnya.',
        ],
      },
    ],
    tips: [
      'Kasih akses secukupnya saja. Tukang input nilai tidak perlu bisa buka keuangan.',
      'Akun orang yang sudah keluar, segera hapus/nonaktifkan.',
    ],
  },
  {
    id: 'logs',
    title: 'Riwayat Aktivitas (Log)',
    category: 'Sistem',
    href: '/admin/logs',
    image: { src: '/assets/tutorials/admin-logs.png', alt: 'Tampilan Riwayat Aktivitas: daftar jejak log' },
    summary:
      'Catatan otomatis: siapa membuka apa, mengubah apa, dan kapan. Gunanya untuk melacak kalau ada data yang aneh/berubah sendiri.',
    audience: ['Pimpinan'],
    quickActions: [
      'Cari aktivitas pakai kolom cari (nama orang, nama menu).',
      'Lihat siapa mengubah data dan kapan.',
      'Unduh rekapnya ke Excel/PDF kalau perlu laporan.',
    ],
    workflows: [
      {
        title: 'Cara melacak data yang berubah',
        steps: [
          'Klik menu Riwayat Aktivitas.',
          'Ketik di kolom cari: nama menu atau nama orangnya (contoh: "berita" atau "budi").',
          'Baca barisnya: kapan, siapa, ngapain (tambah/ubah/hapus/masuk).',
        ],
      },
    ],
    tips: [
      'Halaman ini untuk melacak, bukan untuk kerja sehari-hari.',
      'Kalau ada yang mengaku "tidak mengubah apa-apa", cek di sini.',
    ],
  },
  {
    id: 'settings',
    title: 'Pengaturan Website',
    category: 'Sistem',
    href: '/admin/settings',
    image: { src: '/assets/tutorials/admin-settings.png', alt: 'Tampilan Pengaturan Website beserta tab-tabnya' },
    summary:
      'Pengaturan besar website: nama pondok, logo, alamat, nomor WA, tampilan depan (homepage), dan lain-lain. Hati-hati, yang diubah di sini langsung terlihat pengunjung.',
    audience: ['Pimpinan'],
    quickActions: [
      'Ganti nama, logo, alamat, nomor WA, medsos pondok.',
      'Ubah tampilan depan website (gambar besar, tulisan, urutan bagian).',
      'Atur hal-hal lanjutan (AI, pembayaran PSB). Kalau ragu, jangan diutak-atik.',
    ],
    workflows: [
      {
        title: 'Cara ganti tulisan/gambar depan website',
        steps: [
          'Klik menu Pengaturan, buka bagian Website Builder atau Slider Depan.',
          'Ubah tulisan atau gambarnya satu-satu.',
          'Klik Simpan.',
          'Buka website di tab baru (mode samaran/incognito lebih akurat) untuk memastikan tampilannya benar.',
        ],
      },
      {
        title: 'Cara ganti nomor WA / alamat',
        steps: [
          'Klik menu Pengaturan, buka bagian Umum atau Kontak.',
          'Ganti nomor/alamatnya. Nomor WA pakai format 62 (contoh: 62812xxxx).',
          'Klik Simpan, lalu cek di bagian bawah website (footer).',
        ],
      },
    ],
    tips: [
      'Ubah sedikit-sedikit, simpan, cek hasilnya. Jangan sekaligus banyak.',
      'Kalau habis ubah tampilan tapi website tidak berubah, coba buka mode samaran (cache HP kadang bandel).',
    ],
  },
];

export const roleAccessMatrix: RoleAccessRow[] = [
  {
    module: 'Halaman Depan',
    superadmin: 'Ya',
    tim_media: 'Ya',
    bendahara: 'Ya',
    panitia_psb: 'Ya',
    user: 'Tidak',
  },
  {
    module: 'Berita, Program, Galeri, Video, Pengajar, Fasilitas',
    superadmin: 'Ya',
    tim_media: 'Ya',
    bendahara: 'Tidak',
    panitia_psb: 'Tidak',
    user: 'Tidak',
  },
  {
    module: 'PSB dan Pesan Masuk',
    superadmin: 'Ya',
    tim_media: 'Tidak',
    bendahara: 'Tidak',
    panitia_psb: 'Ya',
    user: 'Tidak',
  },
  {
    module: 'Nilai & Raport, Donasi, Pembayaran, Kirim WA',
    superadmin: 'Ya',
    tim_media: 'Tidak',
    bendahara: 'Ya',
    panitia_psb: 'Tidak',
    user: 'Tidak',
  },
  {
    module: 'Kedisiplinan',
    superadmin: 'Ya',
    tim_media: 'Tidak',
    bendahara: 'Tidak',
    panitia_psb: 'Ya',
    user: 'Tidak',
  },
  {
    module: 'Akun Petugas, Riwayat, Pengaturan',
    superadmin: 'Ya',
    tim_media: 'Tidak',
    bendahara: 'Tidak',
    panitia_psb: 'Tidak',
    user: 'Tidak',
  },
];

export function getAdminDocById(id: string | null | undefined) {
  if (!id) {
    return adminDocSections[0];
  }

  return (
    adminDocSections.find((section) => section.id === id || section.href === id) ||
    adminDocSections.find(
      (section) => id.includes(section.id) || id.includes(section.href.replace('/admin/', ''))
    ) ||
    adminDocSections[0]
  );
}
