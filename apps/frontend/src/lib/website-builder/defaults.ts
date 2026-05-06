import {
  HomeBuilderLayout,
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
