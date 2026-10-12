import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://darussunnahparung.com';
  const now = new Date();
  const routes = ['', '/profil', '/program', '/psb', '/kontak', '/galeri', '/news', '/video-youtube'];
  return routes.map((p) => ({
    url: `${base}${p || '/'}`,
    lastModified: now,
    changeFrequency: p === '' ? 'daily' : 'weekly',
    priority: p === '' ? 1 : p.startsWith('/psb') ? 0.9 : 0.7,
  }));
}
