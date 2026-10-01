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
  glossary?: Array<{
    term: string;
    meaning: string;
  }>;
  examples?: Array<{
    title: string;
    lines: string[];
  }>;
  reference?: {
    title: string;
    note?: string;
    columns: string[];
    rows: string[][];
  };
  faq?: Array<{
    question: string;
    answer: string;
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
    id: 'faqs',
    title: 'FAQ',
    category: 'Isi Website',
    href: '/admin/faqs',
    summary: 'Kelola pertanyaan dan jawaban yang sering dicari pengunjung website.',
    audience: ['Pimpinan', 'Tim Media'],
    quickActions: [
      'Tambah pertanyaan baru beserta jawabannya.',
      'Ubah isi FAQ yang sudah tidak sesuai.',
      'Atur status tampil dan urutan FAQ.',
    ],
    workflows: [
      {
        title: 'Cara manages FAQ',
        steps: [
          'Buka menu FAQ.',
          'Klik tambah atau edit FAQ yang sudah ada.',
          'Isi pertanyaan dan jawaban, lalu simpan.',
          'Periksa urutan dan status tampil di website.',
        ],
      },
    ],
    tips: [
      'Gunakan pertanyaan yang sama dengan cara pengunjung menanyakannya.',
      'Jawab singkat dan arahkan ke informasi yang mudah ditemukan.',
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
    id: 'santri-data',
    title: 'Data Santri & Import Massal',
    category: 'Santri',
    href: '/admin/kesantrian',
    summary:
      'Daftar semua santri aktif. Dari sini Anda bisa menambah satu santri, mengubah data, atau memasukkan banyak santri sekaligus dari file Excel (import massal).',
    audience: ['Pimpinan', 'Admin', 'Panitia PSB'],
    quickActions: [
      'Melihat dan mencari daftar santri aktif.',
      'Menambah santri baru satu per satu lewat tombol Tambah Santri.',
      'Mengisi banyak santri sekaligus lewat tombol Import Massal.',
      'Mengubah atau menghapus data santri yang sudah ada.',
    ],
    workflows: [
      {
        title: 'Cara menambah satu santri',
        steps: [
          'Klik menu Data Santri Aktif di sebelah kiri.',
          'Klik tombol Tambah Santri.',
          'Isi NIS, nama, kelas, dan data lain yang diketahui. NIS dan kelas wajib diisi.',
          'Klik Simpan. Kalau NIS sudah dipakai, sistem akan menolak dan meminta NIS lain.',
        ],
      },
      {
        title: 'Cara import massal dari file Excel',
        steps: [
          'Klik menu Data Santri Aktif, lalu klik tombol Import Massal.',
          'Klik Unduh Template untuk mengambil file Excel berisi satu baris contoh.',
          'Isi baris di bawah contoh. Jangan ubah baris pertama karena dipakai sebagai nama kolom.',
          'Hapus baris contoh supaya tidak ikut terimport, lalu simpan file.',
          'Unggah kembali file itu di halaman Import Massal.',
          'Periksa pratinjau. Kalau ada tulisan merah, perbaiki dulu di Excel lalu unggah lagi.',
          'Kalau pratinjau sudah bersih, klik tombol Import.',
        ],
      },
    ],
    tips: [
      'NIS harus unik. Sebelum import, pastikan tidak ada NIS yang sama dengan santri yang sudah ada.',
      'Isi satu baris contoh dulu, cek berhasil, baru isi banyak.',
      'Kolom yang tidak diisi boleh dikosongkan, kecuali NIS dan Kelas yang wajib.',
    ],
    glossary: [
      { term: 'NIS', meaning: 'Nomor Induk Santri, nomor unik milik tiap santri. Wajib diisi dan tidak boleh sama.' },
      { term: 'NIK', meaning: 'Nomor Induk Kependudukan 16 digit dari KTP atau KK. Opsional.' },
      { term: 'Angkatan', meaning: 'Tahun santri masuk, contoh 2026.' },
      { term: 'Status', meaning: 'Keadaan santri: aktif, lulus, pindah, atau cuti.' },
      { term: 'Import Massal', meaning: 'Memasukkan banyak santri sekaligus dari satu file Excel.' },
    ],
    reference: {
      title: 'Arti kolom di file Excel',
      note:
        'Nama kolom tidak harus persis sama (misalnya No HP Wali tetap dikenali). Kolom No. HP Wali, Tempat/Tanggal Lahir, dan NIK boleh dikosongkan. Kolom Kelas wajib diisi.',
      columns: ['Kolom', 'Wajib?', 'Keterangan'],
      rows: [
        ['NIS', 'Wajib', 'Nomor induk santri, unik, 4-20 karakter.'],
        ['Nama', 'Wajib', 'Nama lengkap santri.'],
        ['Panggilan', 'Opsional', 'Nama panggilan sehari-hari.'],
        ['Kelamin', 'Wajib', 'L atau P.'],
        ['Tempat Lahir', 'Opsional', 'Kota atau kabupaten tempat lahir.'],
        ['Tanggal Lahir', 'Opsional', 'Format YYYY-MM-DD, contoh: 2010-01-01.'],
        ['Alamat', 'Opsional', 'Alamat tempat tinggal santri.'],
        ['Kelas', 'Wajib', 'Contoh: VII atau VII-A.'],
        ['Angkatan', 'Opsional', 'Tahun masuk, contoh: 2026.'],
        ['Status', 'Opsional', 'aktif / lulus / pindah / cuti. Kosongkan jika aktif.'],
        ['NIK', 'Opsional', 'NIK 16 digit, bila NIS sudah dipakai sebagai identitas.'],
        ['Nama Wali', 'Opsional', 'Nama wali atau orang tua.'],
        ['No. HP Wali', 'Opsional', 'Nomor WhatsApp wali, dipakai untuk kirim pengumuman.'],
      ],
    },
    faq: [
      { question: 'File harus format apa?', answer: 'Hanya .xlsx. Kalau memakai .xls atau .csv, file akan ditolak.' },
      { question: 'Kenapa tombol Import tidak bisa diklik?', answer: 'Biasanya karena belum ada data terbaca atau masih ada error di pratinjau. Perbaiki dulu error merahnya.' },
      { question: 'Kalau NIS ganda bagaimana?', answer: 'Baris dengan NIS ganda akan gagal. Ganti NIS-nya atau hapus baris itu sebelum import.' },
      { question: 'Apakah data yang salah bisa diperbaiki setelah import?', answer: 'Bisa. Buka Data Santri Aktif, cari santrinya, lalu edit.' },
    ],
  },
  {
    id: 'academics',
    title: 'Nilai & Raport (eRapor)',
    category: 'Santri',
    href: '/admin/academics',
    image: { src: '/assets/tutorials/admin-academics.png', alt: 'Tampilan Dashboard eRapor beserta ringkasan angka di dalamnya' },
    summary:
      'Tempat mengatur bobot nilai, mengisi nilai, mencatat kehadiran dan hafalan, lalu mencetak raport. Halaman ini punya 7 tab: Dashboard, Nilai, Presensi, Tahfidz, Rekap Nilai, Cetak Raport, dan Mata Pelajaran. Apa pun yang disimpan di sini langsung bisa dilihat wali di HP-nya.',
    audience: ['Admin / Pimpinan', 'Guru & Ustadz', 'Wali Kelas', 'Operator Nilai'],
    quickActions: [
      'Menentukan bobot tiap komponen nilai (UTS, UAS, Tugas, UH) untuk setiap mata pelajaran.',
      'Mengatur KKM, yaitu angka batas minimum nilai agar dianggap lulus.',
      'Mengisi nilai satu per satu, atau sekaligus banyak santri lewat Input Massal.',
      'Memperbaiki nilai yang keliru tanpa mengetik ulang dari awal, lewat Edit Massal.',
      'Mencatat kehadiran: Hadir, Izin, Sakit, atau Alpha. Alpha bisa langsung diberi tahu ke wali via WhatsApp.',
      'Mencatat progres hafalan: surah, juz, ayat, dan tanggal evaluasi.',
      'Melihat ranking dan rekap nilai per mata pelajaran.',
      'Mencetak raport untuk satu santri atau untuk beberapa santri sekaligus.',
      'Mengekspor data nilai dan presensi ke PDF atau Excel.',
    ],
    glossary: [
      { term: 'UTS', meaning: 'Ujian Tengah Semester, yaitu ujian di tengah semester.' },
      { term: 'UAS', meaning: 'Ujian Akhir Semester, yaitu ujian di akhir semester.' },
      { term: 'Tugas', meaning: 'Nilai pekerjaan, PR, atau kuis yang dikumpulkan selama pelajaran.' },
      { term: 'UH', meaning: 'Ulangan Harian, yaitu test kecil saat jam pelajaran. Sekarang ada 4 komponen nilai: UTS, UAS, Tugas, dan UH.' },
      { term: 'Bobot', meaning: 'Porsi tiap komponen dalam nilai akhir, ditulis dalam persen. Contoh: UTS 25 persen artinya UTS menyumbang seperempat dari nilai akhir.' },
      { term: 'Nilai akhir', meaning: 'Angka hasil hitungan gabungan semua komponen sesuai bobot. Ini yang muncul di kolom Akhir.' },
      { term: 'Grade', meaning: 'Huruf A sampai E yang dibuat otomatis dari nilai akhir.' },
      { term: 'KKM', meaning: 'Kriteria Ketuntasan Minimal, yaitu angka batas nilai agar sudah dianggap menguasai pelajaran tersebut.' },
      { term: 'Predikat', meaning: 'Keterangan kalimat dari nilai, misalnya Sangat Baik, Baik, Cukup, atau Perlu Perbaikan.' },
      { term: 'Semester 1 dan Semester 2', meaning: 'Dua periode belajar dalam satu tahun ajaran. Nilai semester 1 dan semester 2 disimpan terpisah.' },
      { term: 'Tahun Ajaran', meaning: 'Periode sekolah selama satu tahun, ditulis seperti 2025/2026.' },
      { term: 'Raport', meaning: 'Laporan nilai resmi yang dicetak dan dibagikan ke wali.' },
    ],
    workflows: [
      {
        title: 'LANGKAH 1 (WAJIB DULUAN) - Mengatur bobot nilai per mata pelajaran',
        steps: [
          'Buka menu eRapor. Di deretan tab, klik tab "Mata Pelajaran" yang paling kanan.',
          'Di bawah daftar mata pelajaran ada kotak biru berjudul "Bobot Komponen Nilai per Mapel".',
          'Di dalam kotak itu ada satu baris per mata pelajaran, dengan 4 kolom angka: UTS, UAS, Tugas, dan UH.',
          'Klik kotak angkanya lalu ketik persentasenya. Contoh untuk Matematika: UTS 25, UAS 30, Tugas 25, UH 20.',
          'Lihat kolom Total di ujung kanan. Kalau hijau, totalnya sudah benar (100 persen). Kalau merah, totalnya belum tepat.',
          'Perbaiki angka yang salah sampai kolom Total hijau. Ulangi untuk setiap mata pelajaran yang bobotnya berbeda.',
          'Kalau semua sudah hijau, klik tombol "Simpan Bobot" di kanan atas kotak itu.',
          'Selesai. Mulai sekarang nilai akhir setiap mapel dihitung memakai bobot ini.',
        ],
      },
      {
        title: 'LANGKAH 2 - Mengatur KKM (ambang ketuntasan)',
        steps: [
          'Kembali ke tab "Dashboard".',
          'Di paling atas ada kartu biru "Ambang Ketuntasan (KKM)". Angka KKM yang dipakai ada di kotak putih.',
          'Kalau perlu diubah, ketik angka baru antara 1 sampai 99, lalu klik "Simpan KKM".',
          'Angka KKM yang wajar biasanya antara 70 sampai 80. Tidak diubah juga tidak apa-apa.',
        ],
      },
      {
        title: 'LANGKAH 3 - Mengisi nilai satu per satu',
        steps: [
          'Klik tab "Nilai".',
          'Pilih Semester dan Tahun Ajaran dulu di bagian atas. Salah pilih berarti nilai masuk tempat yang salah.',
          'Di baris tombol, klik "Tambah Data" untuk menambah satu nilai. Halaman form akan terbuka.',
          'Pilih Santri, lalu pilih Mata Pelajaran.',
          'Isi 4 kotak nilai: Nilai UTS, Nilai UAS, Nilai Tugas, dan Nilai Ulangan Harian. Semuanya wajib diisi, rentang 0 sampai 100.',
          'Isi kolom Catatan kalau perlu, untuk deskripsi capaian atau arahan tindak lanjut.',
          'Klik Simpan. Nilai akhir dan Grade terhitung sendiri, tidak perlu dihitung manual.',
          'Kembali ke tab Nilai, lalu periksa baris yang baru muncul. Pastikan kolom Akhir dan Grade sudah terisi.',
        ],
      },
      {
        title: 'LANGKAH 4 - Mengisi nilai banyak santri sekaligus (Input Massal)',
        steps: [
          'Di tab "Nilai", klik tombol "Input Massal". Ini cara tercepat untuk satu kelas.',
          'Di bagian atas, pilih Mata Pelajaran, Semester, dan Tahun Ajaran. Pengaturan ini berlaku untuk semua baris di tabel.',
          'Di tabel "Daftar Nilai Santri", isi kolom UTS, UAS, Tugas, dan UH untuk setiap santri.',
          'Baris yang tidak mau diisi boleh dikosongkan. Baris kosong otomatis dilewati, jadi aman.',
          'Klik Simpan. Semua baris yang terisi langsung tersimpan.',
        ],
      },
      {
        title: 'LANGKAH 5 - Memperbaiki nilai yang salah (Edit Massal)',
        steps: [
          'Kalau nilai sudah tersimpan dan mau dibetulkan, tidak perlu dihapus satu per satu.',
          'Di tab "Nilai", klik tombol "Edit Massal".',
          'Tabel yang muncul hanya berisi nilai yang sudah ada, jadi yang salah bisa langsung dicari.',
          'Perbaiki angkanya, lalu klik Simpan.',
        ],
      },
      {
        title: 'LANGKAH 6 - Mencatat kehadiran (presensi)',
        steps: [
          'Klik tab "Presensi".',
          'Pilih tanggal di kotak tanggal. Untuk mengoreksi hari sebelumnya, tinggal ganti tanggalnya.',
          'Klik "Tambah Data", pilih Santri, lalu pilih status: Hadir, Izin, Sakit, atau Alpha.',
          'Klik Simpan. Ulangi untuk santri berikutnya.',
          'Untuk status Alpha, ada tombol pesan WhatsApp di tabel supaya wali langsung diberi tahu.',
        ],
      },
      {
        title: 'LANGKAH 7 - Mencatat progres hafalan (tahfidz)',
        steps: [
          'Klik tab "Tahfidz".',
          'Klik "Tambah Data", lalu pilih Santri.',
          'Isi Surah, Juz, Ayat mulai, Ayat selesai, Status, dan Tanggal Evaluasi.',
          'Klik Simpan.',
        ],
      },
      {
        title: 'LANGKAH 8 - Melihat rekap dan ranking',
        steps: [
          'Klik tab "Rekap Nilai".',
          'Empat kotak di atas berisi angka: Santri Terekap, Mapel Aktif, Ketuntasan, dan Perlu Pendampingan.',
          'Di bawahnya ada tabel ranking. Nomor 1 ada di paling atas.',
          'Santri yang rata-ratanya di bawah KKM ditandai "Perlu Pendampingan".',
          'Klik "EXPORT REKAP" untuk mengunduh rekapnya ke Excel.',
        ],
      },
      {
        title: 'LANGKAH 9 - Mencetak raport untuk wali',
        steps: [
          'Klik tab "Cetak Raport", lalu pilih Semester dan Tahun Ajaran.',
          'Untuk satu santri: di kotak "Raport Individual", pilih nama santri dari dropdown.',
          'Klik "PREVIEW PDF" untuk melihat dulu tampilnya di layar.',
          'Kalau sudah benar, klik CETAK untuk langsung mencetak, atau DOWNLOAD PDF untuk menyimpan berkas.',
          'Untuk beberapa santri sekaligus: di kotak "Raport Massal", centang santri yang mau dicetak. Ada tombol "Pilih Semua" dan "Kosongkan".',
          'Pastikan nilai, presensi, dan hafalan sudah lengkap sebelum dicetak.',
        ],
      },
    ],
    examples: [
      {
        title: 'Contoh hitung nilai akhir (Matematika, bobot UTS 25 / UAS 30 / Tugas 25 / UH 20)',
        lines: [
          'Nilai santinya: UTS 80, UAS 90, Tugas 85, UH 70',
          '',
          'UTS    80 x 25 persen = 20,00',
          'UAS    90 x 30 persen = 27,00',
          'Tugas  85 x 25 persen = 21,25',
          'UH     70 x 20 persen = 14,00',
          '                    ---------',
          'Nilai akhir     = 82,25   (dibulatkan jadi 82.25)',
          '',
          'Grade: dengan KKM 75, angka 82.25 masuk huruf B, karena batas minimal B = 80.',
        ],
      },
      {
        title: 'Kenapa nilai bisa terasa turun setelah diedit?',
        lines: [
          'Bobot lama (tanpa komponen UH): UTS 25, UAS 40, Tugas 35',
          'Nilai akhir = 80x25% + 90x40% + 85x35% = 86,25',
          '',
          'Bobot baru: UTS 25, UAS 30, Tugas 25, UH 20',
          'Nilai akhir = 80x25% + 90x30% + 85x25% + 70x20% = 82,25',
          '',
          'Kalau kolom UH belum diisi, nilainya dianggap 0, sehingga hasil hitungan',
          'justru lebih kecil dari perhitungan lama yang tidak memotong UH.',
          'Solusinya: isi kolom UH dengan nilai yang benar. Bobot UH tidak boleh 0,',
          'jadi kalau mapel ini memang tidak ada ulangan hariannya, minta bantuan',
          'admin menyesuaikan bobot mapel ini.',
        ],
      },
    ],
    reference: {
      title: 'Tabel Referensi - Arti Grade berdasarkan KKM',
      note: 'Grade dibuat otomatis dari nilai akhir dan angka KKM. Kalau KKM diubah, semua baris ikut berubah. KKM bawaan sistem adalah 75.',
      columns: ['Grade', 'Artinya', 'KKM 75', 'KKM 80', 'KKM 70'],
      rows: [
        ['A', 'Sangat Baik', 'minimal 90', 'minimal 95', 'minimal 85'],
        ['B', 'Baik', '80 sampai 89', '85 sampai 94', '75 sampai 84'],
        ['C', 'Cukup, sudah tuntas', '75 sampai 79', '80 sampai 84', '70 sampai 74'],
        ['D', 'Perlu pendampingan', '60 sampai 74', '65 sampai 79', '55 sampai 69'],
        ['E', 'Perlu perbaikan', 'di bawah 60', 'di bawah 65', 'di bawah 55'],
      ],
    },
    faq: [
      {
        question: 'Kenapa nilai akhir terasa turun setelah nilai diedit?',
        answer: 'Penyebabnya biasanya kolom UH belum diisi, sehingga nilainya dianggap 0, sementara bobot UH sudah 20 persen. Isi kolom UH dengan nilai yang benar. Bobot UH tidak boleh diisi 0 karena sistem mewajibkan tiap bobot lebih dari 0, jadi kalau mapel ini memang tidak ada ulangan hariannya, minta admin menyesuaikan bobot mapel ini.',
      },
      {
        question: 'Total bobot saya merah dan tidak bisa disimpan. Kenapa?',
        answer: 'Totalnya harus tepat 100 persen, dan tiap bobot harus lebih besar dari 0. Contoh salah: 25 + 30 + 25 + 10 = 90 persen. Perbaiki sampai kolom Total hijau, lalu klik Simpan Bobot.',
      },
      {
        question: 'Bobot sudah saya ubah, tapi nilai akhir yang lama tidak ikut berubah. Kenapa?',
        answer: 'Nilai yang sudah tersimpan tidak dihitung ulang secara otomatis. Nilai akhir memakai bobot baru kalau nilai itu disimpan ulang, yaitu diedit lalu disimpan. Kalau perlu semua nilai dihitung ulang sekaligus, minta bantuan admin.',
      },
      {
        question: 'Apakah wali bisa mengubah nilai?',
        answer: 'Tidak. Wali hanya bisa membaca. Yang bisa mengubah nilai adalah admin dan guru yang mengampu mata pelajaran tersebut.',
      },
      {
        question: 'Saya guru, tapi mata pelajaran saya tidak muncul. Kenapa?',
        answer: 'Cek dulu di tab Mata Pelajaran apakah mapel Anda terdaftar. Kalau tidak ada, minta admin untuk menambahkannya dan mengaitkan nama Anda sebagai pengampu.',
      },
      {
        question: 'Di mana wali melihat hasil nilai ini?',
        answer: 'Wali melihat raportnya di HP lewat menu Portal, bagian Raport. Di sana terlihat nilai UTS, UAS, Tugas, UH, nilai akhir, dan grade. Karena itu, periksa dulu dengan PREVIEW PDF sebelum mencetak.',
      },
      {
        question: 'Kenapa pilihan semester dan tahun ajaran perlu diperhatikan sekali lagi?',
        answer: 'Nilai disimpan terpisah untuk tiap semester dan tiap tahun ajaran. Salah memilih berarti nilai tidak akan muncul di raport yang sedang disusun. Periksa dua kali sebelum klik Simpan.',
      },
    ],
    visualSteps: [
      {
        title: 'Mata Pelajaran - tempat mengatur bobot nilai',
        description: 'Klik tab "Mata Pelajaran". Di bawah daftar mapel ada kotak biru "Bobot Komponen Nilai per Mapel". Di sanalah Anda mengetik bobot UTS, UAS, Tugas, dan UH tiap mapel. Perhatikan kolom Total, harus hijau artinya sudah 100 persen.',
        image: '/assets/tutorials/acad-03-bobot.png',
        alt: 'Tab Mata Pelajaran eRapor: daftar mapel dan kartu Bobot Komponen Nilai per Mapel dengan kolom UTS, UAS, Tugas, UH, dan Total',
      },
      {
        title: 'Dashboard - melihat angka KKM',
        description: 'Kartu biru "Ambang Ketuntasan (KKM)" ada di paling atas tab Dashboard. Di situ terlihat angka KKM yang sedang dipakai, dan admin bisa mengubahnya.',
        image: '/assets/tutorials/acad-01-dashboard.png',
        alt: 'Tab Dashboard eRapor: kartu Ambang Ketuntasan KKM, rekap nilai siswa, dan rata-rata per mata pelajaran',
      },
      {
        title: 'Nilai - daftar semua nilai yang sudah masuk',
        description: 'Tab "Nilai" menampilkan semua nilai dalam bentuk tabel: Santri, Mapel, UTS, UAS, Tugas, UH, Akhir, dan Grade. Di atasnya ada pilihan Semester dan Tahun Ajaran. Tombol Input Massal dan Edit Massal juga ada di sini.',
        image: '/assets/tutorials/acad-02-nilai.png',
        alt: 'Tab Nilai eRapor: tabel daftar nilai dengan kolom UTS, UAS, Tugas, UH, Akhir, dan Grade',
      },
      {
        title: 'Formulir tambah nilai untuk satu santri',
        description: 'Halaman form ini muncul setelah klik "Tambah Data". Ada 4 kotak nilai: UTS, UAS, Tugas, dan Ulangan Harian. Semuanya wajib diisi. Nilai akhir dihitung otomatis, tidak perlu dihitung manual.',
        image: '/assets/tutorials/acad-04-form-nilai.png',
        alt: 'Form tambah nilai Santri: pilih Santri, Mata Pelajaran, Semester, Tahun Ajaran, dan kolom Nilai UTS, UAS, Tugas, Ulangan Harian',
      },
      {
        title: 'Input Massal - isi banyak santri sekaligus',
        description: 'Cara cepat: pilih mata pelajaran, semester, dan tahun ajaran sekali saja, lalu isi semua baris di tabel. Baris yang dikosongkan otomatis dilewati.',
        image: '/assets/tutorials/acad-05-input-massal.png',
        alt: 'Halaman Input Nilai Massal: metadata mapel dan tabel daftar nilai Santri dengan kolom UTS, UAS, Tugas, UH, dan Catatan',
      },
      {
        title: 'Presensi - mencatat kehadiran santri',
        description: 'Tab "Presensi" berisi catatan kehadiran santri. Buka tab ini untuk mengecek data kehadiran yang sudah masuk, dan klik "Tambah Data" bila perlu menambah catatan baru.',
        image: '/assets/tutorials/acad-08-presensi.png',
        alt: 'Tab Presensi eRapor: daftar catatan kehadiran santri beserta tombol Tambah Data',
      },
      {
        title: 'Tahfidz - catatan hafalan',
        description: 'Tab "Tahfidz" dipakai untuk mencatat hasil hafalan santri. Buka tab ini untuk mengecek data hafalan yang sudah masuk, dan klik "Tambah Data" bila perlu menambah catatan baru.',
        image: '/assets/tutorials/acad-09-tahfidz.png',
        alt: 'Tab Tahfidz eRapor: daftar catatan hafalan santri beserta tombol Tambah Data',
      },
      {
        title: 'Cetak Raport - individual dan massal',
        description: 'Tab "Cetak Raport" punya dua bagian. "Raport Individual" untuk satu santri: pilih nama, lalu PREVIEW PDF, CETAK, atau DOWNLOAD PDF. "Raport Massal" untuk beberapa santri sekaligus: centang yang mau dicetak, atau klik "Pilih Semua".',
        image: '/assets/tutorials/acad-06-cetak.png',
        alt: 'Tab Cetak Raport: bagian Raport Individual dengan tombol CETAK, PREVIEW PDF, DOWNLOAD PDF, dan bagian Raport Massal',
      },
      {
        title: 'Rekap Nilai - melihat ranking dan ketuntasan',
        description: 'Empat kotak angka di atas: Santri Terekap, Mapel Aktif, Ketuntasan, Perlu Pendampingan. Di bawahnya tabel ranking. Santri yang rata-ratanya di bawah KKM ditandai Perlu Pendampingan.',
        image: '/assets/tutorials/acad-07-rekap.png',
        alt: 'Tab Rekap Nilai: kotak statistik Santri Terekap, Mapel Aktif, Ketuntasan, Perlu Pendampingan, dan tabel ranking',
      },
    ],
    tips: [
      'Atur bobot harus dilakukan sebelum mengisi nilai. Kalau bobot diubah belakangan, nilai akhir yang sudah tersimpan tidak ikut berubah dengan sendirinya.',
      'Semua kolom bobot harus lebih besar dari 0 dan totalnya harus tepat 100 persen. Kalau tidak, Simpan akan ditolak.',
      'Jangan lupa mengisi kolom UH. Kalau UH kosong atau bernilai 0 sementara bobot UH 20 persen, nilai akhir bisa turun jauh.',
      'Salah pilih Semester atau Tahun Ajaran berarti nilai masuk tempat yang salah dan tidak muncul di raport. Cek dua kali sebelum klik Simpan.',
      'Semua yang disimpan di sini langsung bisa dilihat wali di HP. Teliti dulu baru simpan.',
      'Buka PREVIEW PDF raport sebelum mencetak. Lebih baik menemukan kesalahan sekarang daripada setelah raport keluar.',
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
  {
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
      'Pilih santri lewat kolom cari — ketik nama santri, nama wali, atau nomor WA.',
      'Badge Lunas = sudah bayar, Badge Tagihan = belum bayar.',
      'Tombol Pakai Tagihan / Pakai Lunas mengisi pesan secara otomatis.',
    ],
    workflows: [
      {
        title: 'Cara kirim WA ke 1 wali/santri (pakai kwitansi)',
        steps: [
          'Klik menu Notifikasi WA.',
          'Ketik nama santri, nama wali, atau nomor WA di kolom pencarian, lalu pilih santrinya.',
          'Periksa badge di daftar: Lunas (sudah bayar) atau Tagihan (belum bayar).',
          'Kalau sudah bayar klik "Pakai Lunas"; kalau belum bayar klik "Pakai Tagihan" — pesannya langsung terisi otomatis.',
          'Pilih nomor tujuannya (Wali / Ayah / Ibu) dan cek kembali isi pesannya (boleh diedit dulu).',
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
      'Nomor WA wali diambil otomatis dari data santri (parent/father/mother phone).',
      'Kwitansi Tagihan: untuk santri yang masih punya sisa tagihan.',
      'Kwitansi Lunas: untuk santri yang sudah membayar.',
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
      'Daftar akun staf yang boleh masuk halaman admin. Akun wali/santri (role user) dikelola terpisah dan tidak tampil di sini.',
    audience: ['Superadmin', 'Bendahara'],
    quickActions: [
      'Bikin akun baru untuk petugas baru.',
      'Superadmin dapat mengatur hak akses menu dan menghapus akun.',
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
    module: 'Berita, Program, Galeri, Video, Pengajar, Fasilitas, FAQ, Agenda',
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
    module: 'Project',
    superadmin: 'Ya',
    tim_media: 'Ya',
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
    module: 'Akun Petugas',
    superadmin: 'Ya',
    tim_media: 'Tidak',
    bendahara: 'Ya',
    panitia_psb: 'Tidak',
    user: 'Tidak',
  },
  {
    module: 'Riwayat, Pengaturan',
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
