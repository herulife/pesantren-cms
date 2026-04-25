'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import PublicSectionIntro from '@/components/PublicSectionIntro';
import { PublicEmptyState, PublicGridSkeleton } from '@/components/PublicState';
import {
  getGallery,
  GalleryItem,
  resolveDisplayImageUrl,
  formatGalleryAlbumTitle,
  getGallerySortTimestamp,
  slugifyContentKey,
} from '@/lib/api';
import { ArrowLeft, CalendarDays, ImageIcon } from 'lucide-react';

type AlbumView = {
  key: string;
  title: string;
  category: string;
  eventDate: string;
  cover: GalleryItem;
  items: GalleryItem[];
};

export default function GaleriDetailPage() {
  const params = useParams();
  const slugParam = Array.isArray(params?.slug) ? params?.slug[0] : params?.slug;
  const slug = String(slugParam || '');
  const [album, setAlbum] = useState<AlbumView | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    async function fetchAlbum() {
      try {
        const res = await getGallery({ limit: 200, offset: 0 });
        const items = Array.isArray(res.data) ? res.data : [];

        const grouped = new Map<string, GalleryItem[]>();
        for (const photo of items) {
          const key =
            photo.album_slug ||
            slugifyContentKey(photo.album_name || '') ||
            `single-${photo.id}`;
          const current = grouped.get(key) || [];
          current.push(photo);
          grouped.set(key, current);
        }

        let selectedKey = '';
        if (grouped.has(slug)) {
          selectedKey = slug;
        } else {
          for (const [key, value] of grouped.entries()) {
            if (value.some((item) => String(item.id) === slug || item.album_slug === slug)) {
              selectedKey = key;
              break;
            }
          }
        }

        const selectedItems = selectedKey ? grouped.get(selectedKey) || [] : [];
        if (!selectedItems.length) {
          if (isActive) setAlbum(null);
          return;
        }

        const sorted = [...selectedItems].sort((a, b) => Number(b.is_album_cover) - Number(a.is_album_cover));
        const cover = sorted[0];
        if (isActive) {
          setAlbum({
            key: selectedKey,
            title: formatGalleryAlbumTitle(cover.album_name || cover.title),
            category: cover.category,
            eventDate: cover.event_date || '',
            cover,
            items: sorted,
          });
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    fetchAlbum();
    return () => {
      isActive = false;
    };
  }, [slug]);

  const sortedItems = useMemo(() => {
    if (!album) return [];
    const restItems = album.items.length > 1
      ? album.items.filter((item) => item.id !== album.cover.id)
      : album.items;
    return [...restItems].sort((a, b) => getGallerySortTimestamp(b.event_date, b.created_at) - getGallerySortTimestamp(a.event_date, a.created_at));
  }, [album]);

  return (
    <PublicLayout>
      <section className="relative overflow-hidden border-b border-emerald-900/40 bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.22),_transparent_42%),linear-gradient(135deg,_#052e2b_0%,_#064e3b_52%,_#022c22_100%)] py-20 text-white">
        <div className="container relative z-10 mx-auto max-w-6xl px-4">
          <Link href="/galeri" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-100/80 hover:text-white">
            <ArrowLeft size={14} />
            Kembali ke Galeri
          </Link>
          <div className="mt-8">
            <PublicSectionIntro
              eyebrow="Album Kegiatan"
              title={album?.title || 'Dokumentasi Kegiatan'}
              description="Koleksi foto kegiatan santri yang tersusun dalam satu album."
              theme="dark"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#f6f4ee] py-12">
        <div className="container mx-auto max-w-6xl px-4">
          {isLoading ? (
            <PublicGridSkeleton count={8} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" itemClassName="h-[260px] rounded-[2rem]" />
          ) : album ? (
            <>
              <div className="mb-8 flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                <span className="rounded-full bg-white px-4 py-2 shadow-sm">{album.category || 'Kegiatan'}</span>
                {album.eventDate && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
                    <CalendarDays size={14} className="text-emerald-600" />
                    {album.eventDate}
                  </span>
                )}
                <span className="rounded-full bg-white px-4 py-2 shadow-sm">{album.items.length} foto</span>
              </div>
              <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.28)]">
                <img
                  src={resolveDisplayImageUrl(album.cover.image_url)}
                  alt={album.cover.title}
                  className="h-[360px] w-full object-cover"
                />
                <div className="px-6 py-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-600">Cover Album</p>
                  <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">{album.cover.title}</h3>
                </div>
              </div>
              <div className="columns-1 gap-6 md:columns-2 xl:columns-3">
                {sortedItems.map((photo) => (
                  <div key={photo.id} className="mb-6 break-inside-avoid overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.25)]">
                    <img
                      src={resolveDisplayImageUrl(photo.image_url)}
                      alt={photo.title}
                      className="w-full object-cover"
                    />
                    <div className="px-6 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-600">{photo.category}</p>
                      <h3 className="mt-2 text-lg font-black uppercase tracking-tight text-slate-900">{photo.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <PublicEmptyState
              icon={ImageIcon}
              title="Album tidak ditemukan"
              description="Album ini belum tersedia atau sudah dihapus. Coba kembali ke galeri utama."
              className="border-[#d8cfbf]"
            />
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
