import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pondok Pesantren Tahfidzul Qur'an Al-Maa Parung",
    short_name: 'Al-Maa Parung',
    description: 'Website resmi Pondok Pesantren Tahfidzul Qur’an Al-Maa Parung: profil, program, PSB, berita, dan donasi.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0284c7',
    lang: 'id',
    icons: [
      {
        src: '/assets/img/logo-alama.jpg',
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
