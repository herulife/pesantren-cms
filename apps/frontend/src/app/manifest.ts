import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pondok Pesantren Tahfidzul Qur'an Darussunnah Parung",
    short_name: 'Darussunnah Parung',
    description: 'Website resmi Pondok Pesantren Tahfidzul Qur’an Darussunnah Parung: profil, program, PSB, berita, dan donasi.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0284c7',
    lang: 'id',
    icons: [
      {
        src: '/assets/img/logo.jpg',
        sizes: 'any',
        type: 'image/jpeg',
        purpose: 'any',
      },
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
