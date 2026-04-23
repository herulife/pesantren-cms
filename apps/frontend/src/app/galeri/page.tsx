'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { PublicEmptyState, PublicGridSkeleton } from '@/components/PublicState';
import PublicSectionIntro from '@/components/PublicSectionIntro';
import { getGallery, GalleryItem, resolveDisplayImageUrl, formatGalleryAlbumTitle, getGallerySortTimestamp } from '@/lib/api';
import { ArrowRight, CalendarDays, ImageIcon, MapPinned, Search, X } from 'lucide-react';

const ALL_CATEGORY = 'Semua';

type GalleryAlbum = {
  key: string;
  title: string;
  category: string;
  eventDate: string;
  cover: GalleryItem;
  items: GalleryItem[];
};

export default function GaleriPage() {
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);

  useEffect(() => {
    async function fetchGalleryData() {
      try {
        const res = await getGallery({ limit: 80, offset: 0 });
        setPhotos(res.data || []);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGalleryData();
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(photos.map((photo) => photo.category).filter(Boolean)));
    return [ALL_CATEGORY, ...unique];
  }, [photos]);

  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) => {
      const matchCategory = selectedCategory === ALL_CATEGORY || photo.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q || photo.title.toLowerCase().includes(q) || photo.category.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [photos, searchQuery, selectedCategory]);

  const albums = useMemo<GalleryAlbum[]>(() => {
    const grouped = new Map<string, GalleryItem[]>();

    for (const photo of filteredPhotos) {
      const key = photo.album_slug || photo.album_name || `single-${photo.id}`;
      const current = grouped.get(key) || [];
      current.push(photo);
      grouped.set(key, current);
    }

    return Array.from(grouped.entries()).map(([key, items]) => {
      const sorted = [...items].sort((a, b) => Number(b.is_album_cover) - Number(a.is_album_cover));
      const cover = sorted[0];
      return {
        key,
        title: formatGalleryAlbumTitle(cover.album_name || cover.title),
        category: cover.category,
        eventDate: cover.event_date || '',
        cover,
        items,
      };
    }).sort((a, b) => getGallerySortTimestamp(b.eventDate, b.cover.created_at) - getGallerySortTimestamp(a.eventDate, a.cover.created_at));
  }, [filteredPhotos]);

  const featuredPhoto = albums[0]?.cover || null;
  const supportingPhotos = albums.slice(1, 5).map((album) => album.cover);
  const galleryPhotos = albums.slice(5);
  const heroImage = featuredPhoto ? resolveDisplayImageUrl(featuredPhoto.image_url) : '/assets/img/gedung.webp';

  return (
    <PublicLayout>
      <section className="relative overflow-hidden border-b border-emerald-900/50 bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.28),_transparent_38%),linear-gradient(135deg,_#052e2b_0%,_#064e3b_52%,_#022c22_100%)] py-24 text-white">
        <div className="absolute inset-0 bg-cover bg-center opacity-15" style={{ backgroundImage: `url('${heroImage}')` }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,_rgba(2,6,23,0.75),_rgba(2,6,23,0.1))]" />
        <div className="container relative z-10 mx-auto max-w-6xl px-4">
          <PublicSectionIntro
            eyebrow="Galeri Kegiatan Pondok"
            title="Potret Kehidupan Darussunnah"
            description="Dokumentasi belajar, ibadah, pembinaan, dan keseharian santri dalam suasana pondok yang tertib dan hangat."
            theme="dark"
          />
        </div>
      </section>

      <section className="bg-[#f6f4ee] py-10">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="rounded-[2rem] border border-[#e8e0d1] bg-white/90 p-4 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.2)] md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kegiatan, album, atau kategori..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
                      selectedCategory === category
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                        : 'border border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:text-emerald-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f6f4ee] pb-20">
        <div className="container mx-auto max-w-6xl px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <PublicGridSkeleton count={1} className="lg:col-span-7" itemClassName="h-[420px] rounded-[2.5rem]" />
              <PublicGridSkeleton count={4} className="grid gap-6 sm:grid-cols-2 lg:col-span-5" itemClassName="h-[196px] rounded-[2rem]" />
            </div>
          ) : featuredPhoto ? (
            <>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <Link
                  href={`/galeri/${featuredPhoto.album_slug || featuredPhoto.id}`}
                  className="group relative overflow-hidden rounded-[2.75rem] border border-white/70 bg-white text-left shadow-[0_30px_70px_-35px_rgba(15,23,42,0.35)] lg:col-span-7"
                >
                  <img src={resolveDisplayImageUrl(featuredPhoto.image_url)} alt={featuredPhoto.title} className="h-[420px] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-8 text-white">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.35em] text-emerald-200">{featuredPhoto.category}</p>
                    <h2 className="max-w-xl text-3xl font-black uppercase tracking-tight">{featuredPhoto.album_name || featuredPhoto.title}</h2>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur-sm">
                      Buka Album
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>

                <div className="grid gap-6 sm:grid-cols-2 lg:col-span-5">
                  {supportingPhotos.map((photo) => (
                    <Link
                      key={photo.id}
                      href={`/galeri/${photo.album_slug || photo.id}`}
                      className="group relative overflow-hidden rounded-[2rem] border border-white/70 bg-white text-left shadow-[0_20px_50px_-30px_rgba(15,23,42,0.25)]"
                    >
                      <img src={resolveDisplayImageUrl(photo.image_url)} alt={photo.title} className="h-[196px] w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                        <p className="mb-2 text-[9px] font-black uppercase tracking-[0.28em] text-emerald-200">{photo.category}</p>
                        <h3 className="line-clamp-2 text-sm font-black uppercase tracking-tight">{photo.album_name || photo.title}</h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-12 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700">Album Terbaru</p>
                  <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-slate-900">Jejak Kegiatan Santri</h2>
                </div>
                <div className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-500 shadow-sm md:flex">
                  <CalendarDays size={14} className="text-emerald-600" />
                  {albums.length} album ditampilkan
                </div>
              </div>

              <div className="mt-8 columns-1 gap-6 md:columns-2 xl:columns-3">
                {galleryPhotos.map((album, index) => (
                  <Link
                    key={album.key}
                    href={`/galeri/${album.cover.album_slug || album.cover.id}`}
                    className="group relative mb-6 block w-full break-inside-avoid overflow-hidden rounded-[2rem] border border-white/70 bg-white text-left shadow-[0_18px_50px_-30px_rgba(15,23,42,0.28)]"
                  >
                    <img
                      src={resolveDisplayImageUrl(album.cover.image_url)}
                      alt={album.title}
                      className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${index % 3 === 0 ? 'h-[340px]' : index % 3 === 1 ? 'h-[260px]' : 'h-[300px]'}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="absolute inset-x-0 bottom-0 translate-y-4 p-6 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <p className="mb-2 text-[9px] font-black uppercase tracking-[0.28em] text-emerald-200">{album.category}</p>
                      <h3 className="text-lg font-black uppercase tracking-tight">{album.title}</h3>
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-200">{album.items.length} foto</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <PublicEmptyState
              icon={ImageIcon}
              title="Album belum ditemukan"
              description="Coba ganti kategori atau kata kunci untuk melihat dokumentasi kegiatan lainnya."
              className="border-[#d8cfbf]"
            />
          )}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="rounded-[2.5rem] border border-emerald-100 bg-[linear-gradient(135deg,_#ecfdf5_0%,_#f8fafc_100%)] px-8 py-10 text-center shadow-[0_25px_60px_-35px_rgba(16,185,129,0.25)]">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-700">Kehidupan Pesantren</p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-slate-900">Ingin Menjadi Bagian Dari Pondok Ini?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-600">
              Lihat suasana belajar, ibadah, dan pembinaan santri Darussunnah, lalu lanjutkan ke informasi pendaftaran.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a href="/psb" className="rounded-full bg-emerald-600 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-emerald-600/20 transition-all hover:bg-emerald-500">
                Daftar PSB
              </a>
              <a href="/kontak" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-slate-700 transition-all hover:border-emerald-200 hover:text-emerald-700">
                <MapPinned size={16} />
                Hubungi Pondok
              </a>
            </div>
          </div>
        </div>
      </section>

      {selectedPhoto && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={() => setSelectedPhoto(null)} />
          <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute right-4 top-4 z-20 rounded-full border border-white/10 bg-white/10 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              <X size={18} />
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr]">
              <div className="bg-black">
                <img src={resolveDisplayImageUrl(selectedPhoto.image_url)} alt={selectedPhoto.title} className="h-full max-h-[78vh] w-full object-contain" />
              </div>
              <div className="flex flex-col justify-end bg-[linear-gradient(180deg,_rgba(5,46,43,0.96),_rgba(15,23,42,0.98))] p-8 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-200">{selectedPhoto.category}</p>
                <h3 className="mt-4 text-3xl font-black uppercase tracking-tight">{selectedPhoto.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  Dokumentasi kegiatan dan kehidupan santri Darussunnah yang menampilkan suasana belajar, pembinaan, dan kebersamaan di lingkungan pondok.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  );
}
