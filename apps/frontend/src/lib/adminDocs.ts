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
    summary: 'Ringkasan angka penting. Mulai kerja dari sini tiap hari.',
    audience: ['Semua petugas'],
    quickActions: [
      'Lihat angka ringkasan.',
      'Klik angka untuk lompat ke halamannya.',
    ],
    workflows: [
      {
        title: 'Mulai kerja tiap pagi',
        steps: [
          'Masuk ke halaman admin.',
          'Lihat angka di atas, cari yang perlu perhatian.',
          'Klik angkanya untuk mengerjakan.',
        ],
      },
    ],
    tips: [
      'Dashboard hanya ringkasan, edit tetap di menunya.',
      'Angka aneh? Klik dan cek langsung.',
    ],
  },
  {
    id: 'news',
    title: 'Berita',
    category: 'Isi Website',
    href: '/admin/news',
    summary: 'Tulis berita pondok supaya website hidup.',
    audience: ['Pimpinan', 'Tim Media'],
    quickActions: [
      'Tulis berita baru lalu tayangkan.',
      'Simpan sebagai simpanan bila belum siap.',
      'Edit/hapus berita lama.',
    ],
    workflows: [
      {
        title: 'Posting berita baru',
        steps: [
          'Klik Berita, lalu Tambah.',
          'Isi judul yang jelas dan tulis isinya.',
          'Pasang foto landscape (maks 5MB).',
          'Pilih Tayang atau Simpanan, lalu Simpan.',
          'Buka halaman berita di website untuk cek.',
        ],
      },
    ],
    tips: [
      'Contoh judul jelas: "Santri Al-Maa Juara Tahfidz".',
      'Tayang = langsung terlihat. Simpanan = hanya admin.',
    ],
  },
  {
    id: 'programs',
    title: 'Program Pondok',
    category: 'Isi Website',
    href: '/admin/programs',
    summary: 'Daftar program di halaman Program website.',
    audience: ['Pimpinan', 'Tim Media'],
    quickActions: [
      'Tambah program baru + foto.',
      'Ganti foto program lama.',
      'Atur urutan tampil.',
    ],
    workflows: [
      {
        title: 'Tambah program baru',
        steps: [
          'Klik Program Pondok, pilih tab (Unggulan/Ekstrakurikuler).',
          'Klik Tambah, isi judul dan kategori yang sama.',
          'Pasang foto JPG/PNG (maks 5MB, bukan HEIC).',
          'Isi nomor urut dan penjelasan, lalu Simpan.',
          'Cek di halaman Program website.',
        ],
      },
      {
        title: 'Ganti foto program lama',
        steps: [
          'Cari kartunya, klik Edit (pensil).',
          'Ganti gambarnya, pastikan sudah berubah.',
          'Klik Simpan.',
        ],
      },
    ],
    tips: [
      'Jangan bikin judul kembar.',
      'Pakai foto kegiatan asli pondok.',
    ],
  },
  {
    id: 'agendas',
    title: 'Agenda Kegiatan',
    category: 'Isi Website',
    href: '/admin/agendas',
    summary: 'Jadwal acara pondok di website.',
    audience: ['Semua petugas'],
    quickActions: [
      'Tambah acara baru.',
      'Ubah tanggal/tempat.',
      'Hapus acara yang batal.',
    ],
    workflows: [
      {
        title: 'Tambah agenda baru',
        steps: [
          'Klik Agenda, lalu Tambah.',
          'Isi nama, tanggal, tempat, dan penjelasan singkat.',
          'Klik Simpan, lalu cek di website.',
        ],
      },
    ],
    tips: [
      'Acara berubah? Ubah datanya, jangan bikin baru.',
    ],
  },
  {
    id: 'gallery',
    title: 'Galeri Foto',
    category: 'Isi Website',
    href: '/admin/gallery',
    summary: 'Foto kegiatan. Satu acara = satu album.',
    audience: ['Pimpinan', 'Tim Media'],
    quickActions: [
      'Bikin album baru per acara.',
      'Upload banyak foto sekaligus.',
      'Pilih 1 foto sampul.',
    ],
    workflows: [
      {
        title: 'Bikin album foto',
        steps: [
          'Klik Galeri, lalu Album Baru.',
          'Isi nama album sesuai acaranya.',
          'Upload foto terbaik (maks 5MB per foto).',
          'Pilih 1 sampul, klik Simpan, cek di website.',
        ],
      },
    ],
    tips: [
      'Pilih foto terang dan tidak blur.',
      'Jangan campur beda acara dalam 1 album.',
    ],
  },
  {
    id: 'videos',
    title: 'Video Kegiatan',
    category: 'Isi Website',
    href: '/admin/videos',
    summary: 'Tempel link YouTube supaya tampil di website.',
    audience: ['Pimpinan', 'Tim Media'],
    quickActions: [
      'Tempel link YouTube + judul.',
      'Tandai video unggulan.',
    ],
    workflows: [
      {
        title: 'Nambah video baru',
        steps: [
          'Di YouTube: Bagikan → Salin Link.',
          'Klik Video, Tambah, tempel link + isi judul.',
          'Simpan, buka halaman video dan tekan Play.',
        ],
      },
    ],
    tips: [
      'Video harus Publik, bukan Pribadi.',
    ],
  },
  {
    id: 'psb',
    title: 'Pendaftar Baru (PSB)',
    category: 'Santri',
    href: '/admin/psb',
    summary: 'Periksa data pendaftar dan tentukan diterima/tidak.',
    audience: ['Pimpinan', 'Panitia PSB'],
    quickActions: [
      'Lihat daftar + status pendaftar.',
      'Periksa biodata dan dokumen.',
      'Ubah status pendaftar.',
    ],
    workflows: [
      {
        title: 'Memeriksa pendaftar baru',
        steps: [
          'Klik PSB, cari yang status Baru/Pending.',
          'Klik namanya, periksa biodata + semua dokumen.',
          'Kalau lengkap, naikkan statusnya.',
          'Keputusan akhir: Diterima atau Ditolak.',
        ],
      },
    ],
    tips: [
      'Pastikan nomor WA wali benar.',
      'Dokumen kurang? Hubungi wali dulu, jangan langsung tolak.',
    ],
  },
  {
    id: 'academics',
    title: 'Nilai & Raport (eRapor)',
    category: 'Santri',
    href: '/admin/academics',
    summary: 'Isi nilai, absen, hafalan. Langsung terlihat wali.',
    audience: ['Pimpinan', 'Bendahara'],
    quickActions: [
      'Isi nilai per pelajaran.',
      'Catat absen dan hafalan.',
      'Susun dan cetak raport.',
    ],
    workflows: [
      {
        title: 'Mengisi nilai',
        steps: [
          'Buka eRapor → Nilai.',
          'Pilih semester + tahun ajaran yang benar.',
          'Pilih kelas + pelajaran, isi nilai, Simpan.',
          'Cek ringkasan, pastikan tidak ada yang kosong.',
        ],
      },
      {
        title: 'Menyiapkan raport',
        steps: [
          'Pastikan nilai, absen, hafalan sudah terisi.',
          'Buka Raport, klik Lihat Dulu dan baca baik-baik.',
          'Kalau benar, baru cetak/bagikan.',
        ],
      },
    ],
    tips: [
      'Salah semester = nilai nyasar. Cek 2 kali.',
      'Teliti dulu baru simpan, wali langsung melihat.',
    ],
  },
  {
    id: 'teachers',
    title: 'Data Pengajar',
    category: 'Santri',
    href: '/admin/teachers',
    summary: 'Daftar pengajar yang tampil di website.',
    audience: ['Pimpinan', 'Tim Media'],
    quickActions: [
      'Tambah pengajar + foto.',
      'Ubah jabatan/keterangan.',
    ],
    workflows: [
      {
        title: 'Nambah pengajar',
        steps: [
          'Klik Pengajar, Tambah.',
          'Isi nama, jabatan, keterangan singkat.',
          'Upload foto, Simpan, cek di website.',
        ],
      },
    ],
    tips: [
      'Foto gaya sama supaya rapi.',
      'Nama tampil ke publik, eja dengan benar.',
    ],
  },
  {
    id: 'disciplines',
    title: 'Catatan Kedisiplinan',
    category: 'Santri',
    href: '/admin/disciplines',
    summary: 'Poin santri. Melanggar = poin berkurang.',
    audience: ['Pimpinan', 'Panitia PSB'],
    quickActions: [
      'Lihat sisa poin semua santri.',
      'Catat pelanggaran baru.',
      'Awasi poin yang kritis.',
    ],
    workflows: [
      {
        title: 'Mencatat pelanggaran',
        steps: [
          'Klik Kedisiplinan → Catat Pelanggaran.',
          'Pilih santri, jenis pelanggaran, tulis kejadiannya.',
          'Isi poin yang dikurangi, Simpan.',
          'Pastikan sisa poin berubah.',
        ],
      },
      {
        title: 'Mengawasi poin kritis',
        steps: [
          'Buka rekap poin, cari yang merah/kritis.',
          'Klik namanya, baca riwayatnya dulu.',
          'Baru panggil santri/wali.',
        ],
      },
    ],
    tips: [
      'Tulis kejadian jelas dan jujur.',
      'Jangan asal kurang poin.',
    ],
  },
  {
    id: 'donations',
    title: 'Donasi',
    category: 'Keuangan',
    href: '/admin/donations',
    summary: 'Bikin halaman donasi, pantau masuk, setujui tiap donasi.',
    audience: ['Pimpinan', 'Bendahara'],
    quickActions: [
      'Bikin halaman donasi baru.',
      'Lihat donasi masuk + status.',
      'Setujui donasi yang sudah transfer.',
    ],
    workflows: [
      {
        title: 'Bikin halaman donasi',
        steps: [
          'Klik Donasi → Tambah.',
          'Isi judul, target uang, tanggal berakhir, penjelasan.',
          'Pasang poster, Simpan, cek di website.',
        ],
      },
      {
        title: 'Menyetujui donasi',
        steps: [
          'Buka tab Transaksi, cari status Pending.',
          'Cocokkan nama, jumlah, bukti dengan mutasi.',
          'Kalau cocok, klik Setujui. Total otomatis nambah.',
        ],
      },
    ],
    tips: [
      'Jangan setujui sebelum uang benar-benar masuk.',
    ],
    visualSteps: [
      {
        title: 'Buka menu Donasi, lalu bikin baru',
        description: 'Klik menu Donasi, tekan Buat Baru.',
        image: '/assets/tutorials/donations-step-1.png',
        alt: 'Membuka menu donasi dan formulir baru',
      },
      {
        title: 'Isi judul dan penjelasan',
        description: 'Tulis judul dan penjelasan supaya donatur paham.',
        image: '/assets/tutorials/donations-step-2.png',
        alt: 'Mengisi judul dan penjelasan donasi',
      },
      {
        title: 'Isi target, tanggal, poster',
        description: 'Isi target, tanggal, poster, lalu Simpan/Tayangkan.',
        image: '/assets/tutorials/donations-step-3.png',
        alt: 'Mengisi target dan menayangkan donasi',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Pembayaran Santri (SPP)',
    category: 'Keuangan',
    href: '/admin/payments',
    summary: 'Catat bayar manual dan pantau siapa sudah/belum bayar.',
    audience: ['Pimpinan', 'Bendahara'],
    quickActions: [
      'Catat bayar tunai/transfer.',
      'Cari transaksi.',
      'Lihat riwayat bayar santri.',
    ],
    workflows: [
      {
        title: 'Mencatat bayar manual',
        steps: [
          'Klik Pembayaran → Tambah.',
          'Pilih santri, ketik jumlah (cek 2 kali!).',
          'Pilih jenis + cara bayar, tulis catatan.',
          'Simpan, pastikan muncul dengan status benar.',
        ],
      },
    ],
    tips: [
      'Salah nol = laporan berantakan. Cek 2 kali.',
      'Catatan rapi = laporan akhir bulan gampang.',
    ],
  },
  {
    id: 'facilities',
    title: 'Fasilitas Pondok',
    category: 'Isi Website',
    href: '/admin/facilities',
    summary: 'Daftar fasilitas di website.',
    audience: ['Pimpinan', 'Tim Media'],
    quickActions: [
      'Tambah fasilitas + foto.',
      'Perbarui keterangan.',
    ],
    workflows: [
      {
        title: 'Nambah fasilitas',
        steps: [
          'Klik Fasilitas → Tambah.',
          'Isi nama + keterangan 1-2 kalimat.',
          'Upload foto asli, Simpan, cek di website.',
        ],
      },
    ],
    tips: [
      'Pakai foto terbaru, keterangan pendek.',
    ],
  },
  {
    id: 'messages',
    title: 'Pesan Masuk',
    category: 'Layanan',
    href: '/admin/messages',
    summary: 'Surat dari formulir Kontak website.',
    audience: ['Pimpinan', 'Panitia PSB'],
    quickActions: [
      'Baca pesan baru.',
      'Tandai sudah dibaca.',
      'Balas via WA.',
    ],
    workflows: [
      {
        title: 'Menangani pesan baru',
        steps: [
          'Klik Pesan Masuk, buka yang belum dibaca.',
          'Baca isi + nomor pengirim.',
          'Balas via WA bila perlu, tandai sudah dibaca.',
        ],
      },
    ],
    tips: [
      'Balas di hari yang sama.',
      'Jangan hapus pesan penting.',
    ],
  },
  {
    id: 'notifications',
    title: 'Kirim WA (Notifikasi)',
    category: 'Sistem',
    href: '/admin/notifications',
    summary: 'Kirim WA ke 1 orang atau banyak sekaligus.',
    audience: ['Pimpinan', 'Bendahara'],
    quickActions: [
      'Cek status WA tersambung.',
      'Kirim ke 1 nomor.',
      'Kirim massal (tagihan/nilai).',
    ],
    workflows: [
      {
        title: 'Kirim ke 1 orang',
        steps: [
          'Klik Notifikasi WA.',
          'Ketik nomor diawali 62 (bukan 08).',
          'Tulis pesan, Kirim, lihat statusnya.',
        ],
      },
      {
        title: 'Kirim massal',
        steps: [
          'Pastikan WA tersambung dan data benar.',
          'Pilih jenis kiriman, klik kirim.',
          'Tunggu sampai selesai, jangan tutup halaman.',
        ],
      },
    ],
    tips: [
      'Nomor 08 tidak terkirim. Selalu 62.',
      'Kirim jam kerja. Cek isi sebelum kirim massal.',
    ],
  },
  {
    id: 'users',
    title: 'Akun Petugas',
    category: 'Sistem',
    href: '/admin/users',
    summary: 'Atur siapa boleh masuk halaman admin. Khusus pimpinan.',
    audience: ['Pimpinan'],
    quickActions: [
      'Bikin akun petugas baru.',
      'Atur hak akses secukupnya.',
      'Ganti password / hapus akun.',
    ],
    workflows: [
      {
        title: 'Bikin akun baru',
        steps: [
          'Klik Akun Petugas → Tambah.',
          'Isi nama, email, password awal.',
          'Centang akses sesuai tugasnya saja, Simpan.',
          'Kirim email + password lewat jalur aman.',
        ],
      },
      {
        title: 'Ganti password lupa',
        steps: [
          'Cari namanya, klik Ganti Password.',
          'Ketik password baru 2 kali, Simpan.',
        ],
      },
    ],
    tips: [
      'Akses secukupnya. Akun yang sudah keluar segera hapus.',
    ],
  },
  {
    id: 'logs',
    title: 'Riwayat Aktivitas (Log)',
    category: 'Sistem',
    href: '/admin/logs',
    summary: 'Catatan otomatis siapa mengubah apa dan kapan.',
    audience: ['Pimpinan'],
    quickActions: [
      'Cari aktivitas (nama/menu).',
      'Lihat siapa mengubah apa.',
    ],
    workflows: [
      {
        title: 'Melacak data berubah',
        steps: [
          'Klik Riwayat Aktivitas.',
          'Ketik nama menu/orang di kolom cari.',
          'Baca: kapan, siapa, ngapain.',
        ],
      },
    ],
    tips: [
      'Halaman ini untuk melacak, bukan kerja harian.',
    ],
  },
  {
    id: 'settings',
    title: 'Pengaturan Website',
    category: 'Sistem',
    href: '/admin/settings',
    summary: 'Pengaturan besar website. Yang diubah langsung terlihat pengunjung.',
    audience: ['Pimpinan'],
    quickActions: [
      'Ganti nama, logo, alamat, WA.',
      'Ubah tampilan depan.',
    ],
    workflows: [
      {
        title: 'Ganti tulisan/gambar depan',
        steps: [
          'Klik Pengaturan → Website Builder/Slider.',
          'Ubah satu-satu, Simpan.',
          'Cek di tab samaran (incognito).',
        ],
      },
      {
        title: 'Ganti nomor WA/alamat',
        steps: [
          'Klik Pengaturan → Umum/Kontak.',
          'Ganti (WA pakai 62), Simpan, cek footer website.',
        ],
      },
    ],
    tips: [
      'Ubah sedikit-sedikit, simpan, cek. Jangan sekaligus.',
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
