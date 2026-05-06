import {
  HomeBuilderLayout,
  WebsiteBuilderPages,
  WebsiteBuilderShell,
  WebsiteBuilderTheme,
} from './types';

export const defaultWebsiteBuilderTheme: WebsiteBuilderTheme = {
  version: 1,
  palette: {
    primary: 'emerald',
    accent: 'amber',
    surface: 'slate',
    tone: 'fresh',
  },
  typography: {
    heading: 'outfit',
    body: 'plus-jakarta',
    scale: 'normal',
  },
  shape: {
    radius: 'rounded',
    shadow: 'soft',
  },
  background: {
    pattern: 'soft-blobs',
    public_page: 'warm-white',
  },
};

export const defaultWebsiteBuilderShell: WebsiteBuilderShell = {
  version: 1,
  navbar: {
    enabled: true,
    variant: 'classic',
    position: 'sticky',
    logo_url: '',
    show_school_name: true,
    school_name_override: '',
    menu_items: [
      { label: 'Beranda', url: '/' },
      { label: 'Profil', url: '/profil' },
      { label: 'Program', url: '/program' },
      { label: 'Berita', url: '/news' },
      { label: 'Kontak', url: '/kontak' },
    ],
    cta: { label: 'Daftar PSB', url: '/psb', style: 'primary' },
    show_login_link: true,
    mobile: {
      variant: 'drawer',
      show_cta: true,
    },
  },
  floating: {
    whatsapp: {
      enabled: true,
      position: 'bottom-right',
      mobile_offset: 'default',
      label: 'WhatsApp',
      url: '',
    },
    back_to_top: {
      enabled: true,
      position: 'above-whatsapp',
    },
  },
  footer: {
    enabled: true,
    variant: 'contact-columns',
    logo_url: '',
    description:
      'Pondok Pesantren Tahfidz Al Quran Darussunnah Parung membina santri melalui hafalan, adab, dan ilmu.',
    quick_links: [
      { label: 'Profil', url: '/profil' },
      { label: 'Program', url: '/program' },
      { label: 'PSB', url: '/psb' },
      { label: 'Kontak', url: '/kontak' },
    ],
    contact_items: [],
    show_logo: true,
    show_socials: true,
    show_map_link: true,
    show_address: true,
    copyright_text: '',
    background: 'emerald-dark',
  },
};

export const defaultHomeBuilderLayout: HomeBuilderLayout = {
  version: 1,
  page: 'home',
  updated_at: new Date(0).toISOString(),
  sections: [
    {
      id: 'home-hero',
      type: 'hero',
      enabled: true,
      variant: 'slider',
      settings: {
        kicker: 'Darussunnah Parung',
        title: 'Tahfidz, Adab, dan Ilmu dalam Satu Pembinaan',
        subtitle:
          'Darussunnah Parung membina santri melalui hafalan Al-Quran, adab, dan pembelajaran terpadu.',
        overlay: 'medium',
        text_position: 'left-top',
        mobile_height: 'compact',
        buttons: [
          { label: 'Lihat Info PSB', url: '/psb', style: 'primary' },
          { label: 'Lihat Program', url: '/program', style: 'secondary' },
        ],
        slides: [
          {
            title: 'Tahfidz, Adab, dan Ilmu dalam Satu Pembinaan',
            subtitle:
              'Darussunnah Parung membina santri melalui hafalan Al-Quran, adab, dan pembelajaran terpadu.',
            image_url: '/assets/img/gedung.webp',
          },
        ],
      },
    },
    {
      id: 'home-info-cards',
      type: 'info-cards',
      enabled: true,
      variant: 'floating',
      settings: {
        columns: 4,
        position: 'overlap-hero',
      },
    },
    {
      id: 'home-profile',
      type: 'profile',
      enabled: true,
      variant: 'text-left',
      settings: {
        title: 'Profil Singkat',
        button_label: 'Lihat profil lengkap',
        button_url: '/profil',
      },
    },
    {
      id: 'home-programs',
      type: 'programs',
      enabled: true,
      variant: 'featured-grid',
      settings: {
        title: 'Program Inti',
        source: 'dynamic',
        limit: 4,
        button_label: 'Buka halaman program',
        button_url: '/program',
      },
    },
    {
      id: 'home-extracurriculars',
      type: 'extracurriculars',
      enabled: true,
      variant: 'image-cards',
      settings: {
        title: 'Ekstrakurikuler',
        source: 'manual',
        limit: 4,
      },
    },
    {
      id: 'home-gallery',
      type: 'gallery',
      enabled: true,
      variant: 'featured-grid',
      settings: {
        title: 'Galeri Kegiatan',
        limit: 5,
        button_label: 'Lihat galeri',
        button_url: '/galeri',
      },
    },
    {
      id: 'home-videos',
      type: 'videos',
      enabled: true,
      variant: 'cards',
      settings: {
        title: 'Video Pondok',
        limit: 3,
        button_label: 'Lihat video',
        button_url: '/videos',
      },
    },
    {
      id: 'home-news',
      type: 'news',
      enabled: true,
      variant: 'featured-side',
      settings: {
        title: 'Berita Pondok',
        limit: 3,
        featured_first: true,
        button_label: 'Baca semua berita',
        button_url: '/news',
      },
    },
    {
      id: 'home-agendas',
      type: 'agendas',
      enabled: true,
      variant: 'featured-card',
      settings: {
        title: 'Agenda Terdekat',
        limit: 3,
        show_location: true,
        show_date: true,
      },
    },
    {
      id: 'home-cta',
      type: 'cta',
      enabled: true,
      variant: 'gradient',
      settings: {
        title: 'Siap mengenal Darussunnah lebih jauh?',
        subtitle:
          'Mulai dari profil pondok, program, dan fasilitas, lalu lanjutkan ke halaman pendaftaran saat sudah siap.',
        button_label: 'Lihat Info PSB',
        button_url: '/psb',
        secondary_button_label: 'Hubungi Admin',
        secondary_button_url: '/kontak',
      },
    },
  ],
};

export const defaultWebsiteBuilderPages: WebsiteBuilderPages = {
  version: 1,
  profil: {
    version: 1,
    hero: {
      eyebrow: 'Profil Pesantren',
      title: 'Pondok Pesantren Tahfidz Al Quran Darussunnah Parung',
      subtitle:
        'Mengenal lembaga, arah pembinaan, visi-misi, dan identitas resmi Darussunnah sebagai pondok yang menyiapkan generasi muslim berkualitas melalui pendekatan Al-Quran dan manajemen terpadu.',
      background_image_url: '/assets/img/gedung.webp',
      highlights: [
        { value: '2009', label: 'Tahun Berdiri' },
        { value: 'Qurani', label: 'Arah Pembinaan' },
        { value: 'Bogor', label: 'Basis Pondok' },
      ],
    },
    about: {
      eyebrow: 'Tentang Darussunnah',
      title: 'Pondok yang tumbuh dari semangat pembinaan Qurani dan kaderisasi umat.',
      paragraphs: [
        'Pondok Pesantren Tahfidz Al Quran Darussunnah didirikan oleh Yayasan Tunas Muda Qurani pada tahun 2009 di Kp. Lengkong Barang RT.01/02, Ds. Iwul, Kec. Parung, Bogor.',
        'Saat ini Darussunnah juga tengah membangun fasilitas belajar santri putra termasuk masjid di Kp. Muara Jaya RT.01/05, Ciaureuten Ilir, Bogor sebagai lokasi Pondok Pesantren Putra.',
      ],
      location_chip: 'Parung, Bogor 16330',
      phone_chip: '0813 8241 0582',
      institution_facts: [
        { label: 'Nama Yayasan', value: 'Tunas Muda Qurani' },
        { label: 'NSPP', value: '510032011292' },
        { label: 'Notaris', value: 'Dr. Aidir Amin Daud, DFM' },
        { label: 'SK Kemenkumham', value: 'AHU-038333.50.80.2014' },
      ],
      address_title: 'Alamat Pondok',
      address_text: 'Kp. Lengkong Barang RT.01/02, Ds. Iwul, Kec. Parung, Bogor 16330',
    },
    vision: {
      eyebrow: 'Visi',
      title: 'Arah utama pembinaan Darussunnah',
      description:
        'Menjadi lembaga yang menyiapkan generasi muslim yang berkualitas, melalui pendekatan Al-Quran dan manajemen terpadu.',
    },
    mission: {
      eyebrow: 'Misi',
      items: [
        'Mengembangkan potensi intelektual santri secara terarah dan seimbang.',
        'Menjadikan Al-Quran sebagai media utama dalam proses pembelajaran.',
        'Membentuk akhlak karimah sebagai dasar kepribadian santri.',
        'Menjadi mediator kaderisasi umat yang siap hadir di tengah masyarakat.',
        'Meningkatkan kreativitas, kemandirian, dan daya juang santri.',
        'Berorientasi pada sistem manajemen terpadu yang tertib dan profesional.',
        'Menumbuhkan jiwa patriot dan cinta tanah air sejak dini.',
      ],
    },
    cta: {
      eyebrow: 'Langkah Berikutnya',
      title: 'Lanjutkan mengenal program dan fasilitas pondok',
      subtitle:
        'Setelah memahami identitas dan arah pembinaan Darussunnah, lanjutkan ke program dan fasilitas untuk melihat gambaran pondok secara lebih utuh.',
      primary_button: { label: 'Lihat halaman program', url: '/program', style: 'primary' },
      secondary_button: { label: 'Lihat fasilitas pondok', url: '/facilities', style: 'secondary' },
    },
  },
  program: {
    version: 1,
    hero: {
      eyebrow: 'Program Pendidikan',
      title: 'Sistem pembinaan Darussunnah dirancang menyeluruh, bukan hanya kuat di hafalan.',
      subtitle:
        'Kenali program unggulan, kurikulum, pembiasaan santri, dan kegiatan penunjang yang membentuk karakter serta kesiapan hidup mereka.',
      background_image_url: '/assets/img/khalaqoh.jpg',
      tags: ['Tahfidz', 'Adab', 'Tsaqofah Islamiyah', 'Life Skill'],
      highlights: [
        { value: '6', label: 'Program Inti' },
        { value: '3', label: 'Kurikulum Utama' },
        { value: '9', label: 'Ekskul Pilihan' },
      ],
    },
    featured: {
      eyebrow: 'Program Unggulan',
      title: 'Arah pembinaan inti Darussunnah',
      subtitle:
        'Enam pilar pembinaan ini menjadi fondasi ritme belajar, ibadah, akhlak, dan kesiapan hidup santri.',
      cards: [
        {
          title: 'Tarbiyah Aqidah',
          description:
            'Pembinaan fondasi iman agar santri bertumbuh dengan arah ibadah, akhlak, dan keyakinan yang kokoh.',
          image_url: '/assets/img/khalaqoh.jpg',
        },
        {
          title: 'Tsaqofah Islamiyah',
          description:
            'Bekal wawasan Islam yang luas untuk membentuk nalar, adab berpikir, dan kesiapan berdakwah.',
          image_url: '/assets/img/belajar-kitab.jpg',
        },
        {
          title: 'Akselerasi Tahfidz 30 Juz',
          description:
            'Program inti pesantren yang menargetkan hafalan Al-Quran yang kuat, terjaga, dan terus dibina.',
          image_url: '/assets/img/tahfidz.jpg',
        },
        {
          title: 'Tahfidz Hadits',
          description:
            'Penguatan hafalan hadits sebagai pelengkap pembinaan ilmu, adab, dan orientasi belajar santri.',
          image_url: '/assets/img/tasmi.jpg',
        },
        {
          title: 'Mahasantri Bahasa Arab',
          description:
            'Pendalaman bahasa Arab untuk memperkuat akses santri ke literatur Islam dan komunikasi akademik.',
          image_url: '/assets/img/tahfidz1.jpg',
        },
        {
          title: 'Life Skill',
          description:
            'Pembekalan keterampilan hidup agar santri tumbuh mandiri, kreatif, dan siap berkontribusi nyata.',
          image_url: '/assets/img/masak.jpg',
        },
      ],
    },
    curriculum: {
      eyebrow: 'Kurikulum',
      title: 'Kurikulum berlapis untuk menjaga keseimbangan ilmu.',
      subtitle:
        'Struktur belajar santri disusun agar pembinaan diniyah, akademik, dan tahfidz berjalan seimbang.',
      tracks: ['Kurikulum Pondok', 'Kurikulum DIKNAS', 'Kurikulum Tahfidz'],
    },
    extracurricular: {
      eyebrow: 'Ekstrakurikuler',
      title: 'Ruang tumbuh yang melatih keterampilan, disiplin, dan percaya diri santri.',
      subtitle:
        'Kegiatan penunjang ini membantu santri berkembang aktif, terampil, dan lebih siap menghadapi kehidupan nyata.',
      tags: [
        'Teknik Otomotif',
        'Teknik Listrik',
        'Tata Boga',
        'Futsal',
        'Karate',
        'Beladiri Tifan',
        'Bahasa',
        'Panahan',
        'Basket',
      ],
    },
    listing: {
      eyebrow: 'Program Lainnya',
      title: 'Program tambahan di Darussunnah',
      subtitle:
        'Daftar berikut melengkapi pembinaan utama Darussunnah dan menampilkan program-program yang tersedia untuk mendukung perkembangan santri.',
      empty_state: 'Program tambahan akan ditampilkan di sini saat tersedia.',
      card_badge: 'Program Pondok',
    },
    cta: {
      eyebrow: 'Selanjutnya',
      title: 'Lanjutkan melihat fasilitas dan proses pendaftaran',
      subtitle:
        'Setelah memahami program pembinaan, lanjutkan ke fasilitas pondok dan informasi PSB agar gambaran Darussunnah makin utuh.',
      primary_button: { label: 'Lihat fasilitas pondok', url: '/facilities', style: 'primary' },
      secondary_button: { label: 'Buka info PSB', url: '/psb', style: 'secondary' },
    },
  },
  psb: {
    version: 1,
    hero: {
      eyebrow: 'Pendaftaran Santri Baru',
      title: 'Penerimaan santri baru Darussunnah untuk tahun pelajaran 2026/2027.',
      subtitle:
        'Kenali persyaratan, jadwal gelombang, dan langkah awal pendaftaran untuk bergabung bersama keluarga besar penghafal Al-Quran di Darussunnah.',
      background_image_url: '/assets/img/psb-banner.png',
    },
    requirements: {
      eyebrow: 'Persyaratan',
      title: 'Dokumen yang perlu disiapkan',
      items: [
        'Fotokopi Akta Kelahiran (3 lembar)',
        'Fotokopi Kartu Keluarga (3 lembar)',
        'Pas Foto 3x4 Background Merah (4 lembar)',
        'Raport Terakhir / Ijazah Terakhir',
        'Surat Keterangan Sehat dari Dokter',
      ],
    },
    schedule: {
      eyebrow: 'Gelombang Pendaftaran',
      title: 'Jadwal pendaftaran yang sedang dibuka',
      waves: [
        { label: 'Gelombang I', date_text: '1 Januari - 31 Maret 2026', active: true },
        { label: 'Gelombang II', date_text: '1 April - 30 Juni 2026 (Opsional)', active: false },
      ],
    },
    location: {
      eyebrow: 'Lokasi Pendaftaran',
      title: 'Datang atau hubungi panitia untuk arahan berikutnya',
      subtitle:
        'Hubungi panitia pendaftaran untuk petunjuk lokasi, jadwal kunjungan, dan informasi survei pondok.',
      address_text: 'Kp. Lengkong Barang RT.01/02, Ds. Iwul, Kec. Parung, Bogor 16330',
      image_url: '/assets/img/info-pendaftaran.jpg',
    },
    cta: {
      eyebrow: 'Langkah Berikutnya',
      title: 'Siap menjadi penghafal Al-Quran?',
      subtitle:
        'Buka formulir pendaftaran online atau hubungi panitia PSB untuk pertanyaan seputar jadwal, syarat, dan pembayaran.',
      primary_button: { label: 'Daftar Online Sekarang', url: '/psb-daftar', style: 'primary' },
      secondary_button: { label: 'Hubungi Panitia (WhatsApp)', url: 'https://wa.me/6281413241748', style: 'secondary' },
    },
  },
  kontak: {
    version: 1,
    hero: {
      eyebrow: 'Hubungi Kami',
      title: 'Hubungi Pondok Darussunnah',
      subtitle:
        'Jika ingin bertanya tentang program pondok, pendaftaran, atau kebutuhan informasi lainnya, silakan kirim pesan kepada kami.',
    },
    summary: {
      address_title: 'Alamat',
      address_supporting: 'Kami siap menerima kunjungan sesuai arahan panitia atau admin.',
      contact_title: 'Kontak Utama',
      contact_supporting: 'Gunakan WhatsApp atau email aktif agar balasan lebih cepat sampai.',
      hours_title: 'Layanan',
      hours_supporting: 'Senin - Sabtu, 08:00 - 16:00 WIB',
    },
    info_cards: {
      address_title: 'Alamat Pondok',
      contact_title: 'Telepon / WhatsApp',
      hours_title: 'Jam Operasional',
    },
    form: {
      title: 'Kirim Pesan',
      subtitle:
        'Isi form di bawah ini. Insya Allah kami akan membalas melalui WhatsApp atau email yang Anda cantumkan.',
      success_title: 'Pesan Terkirim!',
      success_message:
        'Terima kasih. Pesan Anda sudah kami terima dan akan kami tindak lanjuti secepatnya.',
      submit_label: 'KIRIM PESAN',
      submitting_label: 'MENGIRIM...',
      reset_label: 'Kirim Pesan Lagi',
    },
    map: {
      eyebrow: 'Lokasi Pondok',
      title: 'Peta Lokasi',
      subtitle:
        'Gunakan peta ini untuk menemukan jalur menuju Pondok Pesantren Tahfidz Al-Quran Darussunnah di Parung, Bogor.',
      button_label: 'Buka di Google Maps',
      button_url: 'https://maps.google.com/?q=Pondok%20Pesantren%20Darussunnah%20Parung',
      embed_url:
        'https://maps.google.com/maps?q=Pondok%20Pesantren%20Darussunnah%20Parung&t=&z=15&ie=UTF8&iwloc=&output=embed',
    },
  },
};
