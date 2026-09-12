import {
  HomeBuilderLayout,
  WebsiteBuilderPages,
  WebsiteBuilderShell,
  WebsiteBuilderTheme,
} from './types';

export const defaultWebsiteBuilderTheme: WebsiteBuilderTheme = {
  version: 1,
  palette: {
    primary: 'blue',
    accent: 'sky',
    surface: 'slate',
    tone: 'calm',
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
    public_page: 'clean-white',
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
      url: 'https://wa.me/6287784423282',
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
      'Pondok Pesantren Tahfidzul Qur’an Al-Maa Parung membina santri melalui tahfidz, adab, dan ilmu syar’i dalam suasana belajar yang tertib dan hangat.',
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
    background: 'slate-dark',
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
        kicker: 'Al-Maa Parung',
        title: 'Tahfidz, Adab, dan Ilmu dalam Satu Ritme Pembinaan',
        subtitle:
          'Pondok Pesantren Tahfidzul Qur’an Al-Maa Parung membina santri melalui hafalan Al-Qur’an, adab, dan pembelajaran terpadu.',
        overlay: 'medium',
        text_position: 'left-top',
        mobile_height: 'compact',
        buttons: [
          { label: 'Lihat Info PSB', url: '/psb', style: 'primary' },
          { label: 'Lihat Program', url: '/program', style: 'secondary' },
        ],
        slides: [
          {
            title: 'Tahfidz, Adab, dan Ilmu dalam Satu Ritme Pembinaan',
            subtitle:
              'Al-Maa Parung menghadirkan lingkungan belajar yang menjaga hafalan, akhlak, dan semangat tumbuh bersama.',
            image_url: 'https://images.unsplash.com/photo-1768152859503-084ed0e5507d?auto=format&fit=crop&w=1700&q=80',
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
        title: 'Siap mengenal Al-Maa lebih jauh?',
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
      title: 'Pondok Pesantren Tahfidzul Qur’an Al-Maa Parung',
      subtitle:
        'Mengenal lembaga, arah pembinaan, visi-misi, dan identitas resmi Al-Maa sebagai pondok yang menumbuhkan generasi Qurani melalui tahfidz, adab, dan pembinaan terpadu.',
      background_image_url: 'https://images.unsplash.com/photo-1768152859503-084ed0e5507d?auto=format&fit=crop&w=1700&q=80',
      highlights: [
        { value: 'Parung', label: 'Lokasi Pondok' },
        { value: '20 Juz', label: 'Target Hafalan' },
        { value: 'SMP - SMK', label: 'Jenjang Pendidikan' },
      ],
    },
    about: {
      eyebrow: 'Tentang Al-Maa',
      title: 'Pondok yang menumbuhkan hafalan, adab, dan semangat belajar dalam suasana Qurani.',
      paragraphs: [
        'Pondok Pesantren Tahfidzul Qur’an Al-Maa berlokasi di Parung, Bogor, dan dikenal sebagai ma’had yang menekankan pembinaan tahfidz, ilmu syar’i, serta akhlak santri secara bertahap dan terarah.',
        'Melalui suasana belajar yang hangat, Al-Maa menguatkan hafalan, kedisiplinan, serta kesiapan santri untuk tumbuh menjadi pribadi yang mandiri dan bermanfaat.',
      ],
      location_chip: 'Parung, Bogor 16330',
      phone_chip: '0857 7694 8779',
      institution_facts: [
        { label: 'Nama Lembaga', value: 'PPTQ Al-Maa / Ma’had Al Maa' },
        { label: 'Jenjang', value: 'SMP - SMK' },
        { label: 'Kuota PSB', value: '30 Ikhwan / 30 Akhwat' },
        { label: 'Fokus', value: 'Tahfidz, Adab, Ilmu Syar’i' },
      ],
      address_title: 'Alamat Pondok',
      address_text:
        'Jl. H. Mawi, Gg. Omega, Kp. Jati Waru, RT 003/RW 002, Waru, Kec. Parung, Kab. Bogor, Jawa Barat 16330',
    },
    vision: {
      eyebrow: 'Visi',
      title: 'Arah utama pembinaan Al-Maa',
      description:
        'Membina generasi Qurani yang kuat dalam hafalan, baik dalam adab, dan siap tumbuh sebagai pribadi muslim yang bermanfaat bagi umat.',
    },
    mission: {
      eyebrow: 'Misi',
      items: [
        'Menjadikan Al-Qur’an sebagai pusat pembinaan hafalan, akhlak, dan semangat belajar.',
        'Menyelenggarakan pendidikan yang menjaga keseimbangan ilmu syar’i, akademik, dan kedisiplinan hidup.',
        'Menumbuhkan karakter mandiri, tertib, dan bertanggung jawab dalam kehidupan santri sehari-hari.',
        'Membangun suasana ma’had yang hangat, aman, dan mendukung perkembangan santri secara utuh.',
        'Menghadirkan pembinaan yang relevan bagi santri yatim, dhuafa, dan keluarga muslim yang ingin pendidikan Qurani.',
      ],
    },
    cta: {
      eyebrow: 'Langkah Berikutnya',
      title: 'Lanjutkan mengenal program dan alur pendaftaran pondok',
      subtitle:
        'Setelah memahami identitas dan arah pembinaan Al-Maa, lanjutkan ke program pendidikan dan informasi PSB untuk melihat gambaran pondok secara lebih utuh.',
      primary_button: { label: 'Lihat halaman program', url: '/program', style: 'primary' },
      secondary_button: { label: 'Buka info PSB', url: '/psb', style: 'secondary' },
    },
  },
  program: {
    version: 1,
    hero: {
      eyebrow: 'Program Pendidikan',
      title: 'Pembinaan Al-Maa dirancang seimbang antara tahfidz, ilmu, dan pembentukan karakter.',
      subtitle:
        'Kenali program unggulan, ritme belajar, pembiasaan santri, dan kegiatan penunjang yang membentuk hafalan sekaligus kemandirian mereka.',
      background_image_url: 'https://images.unsplash.com/photo-1753947127898-a11f139e9a67?auto=format&fit=crop&w=1700&q=80',
      tags: ['Tahfidz', 'Adab', 'Bahasa Arab', 'Ilmu Syar’i'],
      highlights: [
        { value: '20 Juz', label: 'Target Hafalan' },
        { value: 'SMP - SMK', label: 'Jenjang' },
        { value: '2', label: 'Kuota Kelas Besar' },
      ],
    },
    featured: {
      eyebrow: 'Program Unggulan',
      title: 'Arah pembinaan inti Al-Maa',
      subtitle:
        'Program-program ini menjadi fondasi ritme belajar, ibadah, akhlak, dan kesiapan hidup santri sehari-hari.',
      source: 'auto',
      cards: [
        {
          title: 'Tahfidz Al-Qur’an',
          description:
            'Program inti pondok dengan target hafalan bertahap, setoran rutin, dan murajaah yang dijaga konsisten.',
          image_url: 'https://images.unsplash.com/photo-1768152859503-084ed0e5507d?auto=format&fit=crop&w=1700&q=80',
        },
        {
          title: 'Pembinaan Adab',
          description:
            'Pembiasaan akhlak, disiplin, dan tanggung jawab sebagai fondasi karakter santri dalam keseharian.',
          image_url: 'https://images.unsplash.com/photo-1753947127898-a11f139e9a67?auto=format&fit=crop&w=1700&q=80',
        },
        {
          title: 'Bahasa Arab',
          description:
            'Penguatan dasar bahasa Arab untuk membantu santri memahami ilmu dan teks Islam dengan lebih baik.',
          image_url: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1700&q=80',
        },
        {
          title: 'Ilmu Syar’i Dasar',
          description:
            'Pembelajaran diniyah yang menolong santri mengenal aqidah, ibadah, dan adab secara terarah.',
          image_url: 'https://images.unsplash.com/photo-1774191441801-95b99c8abd3f?auto=format&fit=crop&w=1700&q=80',
        },
      ],
    },
    curriculum: {
      eyebrow: 'Kurikulum',
      title: 'Struktur belajar yang menjaga hafalan dan pembentukan diri.',
      subtitle:
        'Pembelajaran disusun agar tahfidz, ilmu agama, pembiasaan adab, dan pendidikan formal berjalan seimbang.',
      tracks: ['Tahfidz Harian', 'Ilmu Syar’i Dasar', 'Pendidikan Menengah SMP - SMK'],
    },
    extracurricular: {
      eyebrow: 'Ekstrakurikuler',
      title: 'Ruang tumbuh yang menambah keterampilan, disiplin, dan kepercayaan diri santri.',
      subtitle:
        'Kegiatan penunjang membantu santri berkembang lebih aktif, terampil, dan siap menghadapi kehidupan nyata.',
      source: 'auto',
      tags: ['Olahraga', 'Life Skill', 'Kebersihan', 'Kedisiplinan', 'Kebersamaan', 'Kepemimpinan'],
    },
    listing: {
      eyebrow: 'Program Lainnya',
      title: 'Program tambahan di Al-Maa',
      subtitle:
        'Daftar berikut melengkapi pembinaan utama Al-Maa dan menampilkan program yang mendukung perkembangan santri.',
      empty_state: 'Program tambahan akan ditampilkan di sini saat tersedia.',
      card_badge: 'Program Pondok',
    },
    cta: {
      eyebrow: 'Selanjutnya',
      title: 'Lanjutkan melihat informasi pendaftaran pondok',
      subtitle:
        'Setelah memahami arah pembinaan, lanjutkan ke info PSB untuk melihat syarat, kuota, dan jalur komunikasi dengan panitia.',
      primary_button: { label: 'Buka info PSB', url: '/psb', style: 'primary' },
      secondary_button: { label: 'Hubungi admin', url: '/kontak', style: 'secondary' },
    },
  },
  psb: {
    version: 1,
    hero: {
      eyebrow: 'Pendaftaran Santri Baru',
      title: 'Penerimaan santri baru Al-Maa untuk jenjang SMP sampai SMK.',
      subtitle:
        'Kenali persyaratan, kuota, biaya pendaftaran, dan langkah awal untuk bergabung bersama keluarga besar penghafal Al-Qur’an di Al-Maa Parung.',
      background_image_url: 'https://images.unsplash.com/photo-1566747675140-317e7484b10d?auto=format&fit=crop&w=1700&q=80',
    },
    requirements: {
      eyebrow: 'Persyaratan',
      title: 'Dokumen yang perlu disiapkan',
      items: [
        'Fotokopi status aktif kelas 6 atau kelas 9',
        'Fotokopi NISN',
        'Fotokopi akta kelahiran',
        'Fotokopi kartu keluarga',
        'Fotokopi KTP kedua orang tua',
        'Ijazah, transkrip, atau legalisir jika sudah tersedia',
        'Untuk yatim atau dhuafa: surat pendukung sesuai ketentuan pondok',
      ],
    },
    schedule: {
      eyebrow: 'Informasi Pendaftaran',
      title: 'Ringkasan kuota dan biaya awal pendaftaran',
      waves: [
        { label: 'Kuota Ikhwan', date_text: '30 santri', active: true },
        { label: 'Kuota Akhwat', date_text: '30 santri', active: true },
        { label: 'Biaya Formulir', date_text: 'Rp 200.000', active: true },
      ],
    },
    location: {
      eyebrow: 'Pendaftaran',
      title: 'Datang atau hubungi panitia untuk arahan berikutnya',
      subtitle:
        'Hubungi panitia pendaftaran untuk petunjuk kunjungan, tanya program, dan memastikan alur pendaftaran terbaru.',
      address_text:
        'Jl. H. Mawi, Gg. Omega, Kp. Jati Waru, RT 003/RW 002, Waru, Kec. Parung, Kab. Bogor, Jawa Barat 16330',
      image_url: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1700&q=80',
    },
    cta: {
      eyebrow: 'Langkah Berikutnya',
      title: 'Siap bergabung di Al-Maa?',
      subtitle:
        'Hubungi panitia PSB untuk pertanyaan seputar syarat, jadwal, biaya, dan kesiapan pendaftaran santri baru.',
      primary_button: { label: 'Daftar Online Sekarang', url: '/portal/biodata', style: 'primary' },
      secondary_button: { label: 'Hubungi Panitia', url: 'https://wa.me/6287784423282', style: 'secondary' },
    },
  },
  kontak: {
    version: 1,
    hero: {
      eyebrow: 'Hubungi Kami',
      title: 'Hubungi Pondok Pesantren Al-Maa',
      subtitle:
        'Jika ingin bertanya tentang program pondok, pendaftaran, atau kebutuhan informasi lainnya, silakan kirim pesan kepada kami.',
    },
    summary: {
      address_title: 'Alamat',
      address_supporting: 'Kami siap menerima kunjungan sesuai arahan panitia atau admin.',
      contact_title: 'Kontak Utama',
      contact_supporting: 'Gunakan WhatsApp aktif agar balasan lebih cepat sampai.',
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
        'Gunakan peta ini untuk menemukan jalur menuju Pondok Pesantren Tahfidzul Qur’an Al-Maa di Parung, Bogor.',
      button_label: 'Buka di Google Maps',
      button_url:
        'https://maps.google.com/?q=Jl.%20H.%20Mawi%20Gg.%20Omega%20Kp.%20Jati%20Waru%20Parung%20Bogor',
      embed_url:
        'https://maps.google.com/maps?q=Jl.%20H.%20Mawi%20Gg.%20Omega%20Kp.%20Jati%20Waru%20Parung%20Bogor&t=&z=15&ie=UTF8&iwloc=&output=embed',
    },
  },
};
