'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PublicLayout from '@/components/PublicLayout';
import { PublicEmptyState, PublicGridSkeleton } from '@/components/PublicState';
import PublicSectionIntro from '@/components/PublicSectionIntro';
import { getVideos, Video, formatGalleryAlbumTitle, getGallerySortTimestamp, getYouTubeThumbnailUrl } from '@/lib/api';
import { CalendarDays, PlayCircle, Search, Video as VideoIcon } from 'lucide-react';

type VideoSeries = {
  key: string;
  title: string;
  slug: string;
  eventDate: string;
  count: number;
  lead: Video;
};

const videoHighlights = [
  { value: 'Kajian', label: 'Seri Utama' },
  { value: 'Santri', label: 'Kegiatan Pondok' },
  { value: 'Video', label: 'Dokumentasi Berkala' },
];

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchVideosData() {
      try {
        const res = await getVideos({ limit: 200, offset: 0 });
        setVideos(Array.isArray(res.data) ? res.data : []);
      } finally {
        setIsLoading(false);
      }
    }

    fetchVideosData();
  }, []);

  const seriesList = useMemo<VideoSeries[]>(() => {
    const grouped = new Map<string, Video[]>();
    for (const video of videos) {
      const key = video.series_slug || video.series_name || `single-${video.id}`;
      const current = grouped.get(key) || [];
      current.push(video);
      grouped.set(key, current);
    }

    return Array.from(grouped.entries())
      .map(([key, items]) => {
        const sorted = [...items].sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
        const lead = sorted[0];
        return {
          key,
          title: formatGalleryAlbumTitle(lead.series_name || lead.title),
          slug: lead.series_slug || String(lead.id),
          eventDate: lead.event_date,
          count: items.length,
          lead,
        };
      })
      .sort((a, b) => getGallerySortTimestamp(b.eventDate, b.lead.created_at) - getGallerySortTimestamp(a.eventDate, a.lead.created_at));
  }, [videos]);

  const filteredSeries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return seriesList;
    }
    return seriesList.filter((series) => series.title.toLowerCase().includes(q));
  }, [seriesList, searchQuery]);

  return (
    <PublicLayout>
      <section className="relative overflow-hidden border-b border-emerald-900/40 bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.28),_transparent_38%),linear-gradient(135deg,_#052e2b_0%,_#064e3b_52%,_#022c22_100%)] py-24 text-white lg:py-28">
        <div className="container relative z-10 mx-auto max-w-6xl px-4">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <PublicSectionIntro
              eyebrow="Video Kegiatan & Kajian"
              title="Pustaka Video Darussunnah"
              description="Kumpulan video kegiatan, kajian, dan momen penting pondok yang tersusun per seri atau kegiatan."
              theme="dark"
            />
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {videoHighlights.map((item) => (
                <div key={item.label} className="rounded-[1.6rem] border border-white/10 bg-white/8 px-5 py-5 shadow-[0_20px_42px_-30px_rgba(0,0,0,0.45)] backdrop-blur-sm">
                  <p className="text-2xl font-black text-white">{item.value}</p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/82">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f6f4ee] py-10">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="rounded-[1.5rem] border border-[#e8e0d1] bg-white/90 p-4 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.2)] md:p-5">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari seri, kajian, atau kegiatan..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f6f4ee] pb-20">
        <div className="container mx-auto max-w-6xl px-4">
          {isLoading ? (
            <PublicGridSkeleton count={6} className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3" />
          ) : filteredSeries.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredSeries.map((series) => {
                const thumbnail = series.lead.thumbnail || getYouTubeThumbnailUrl(series.lead.url);
                return (
                <Link key={series.key} href={`/videos/${series.slug}`} className="group overflow-hidden rounded-[1.5rem] border border-white/70 bg-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.25)]">
                  <div className="relative aspect-video overflow-hidden bg-slate-900">
                    {thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt={series.title}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover opacity-75 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-90"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-600">
                        <VideoIcon size={40} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                        <PlayCircle size={34} />
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">{series.count} video</p>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">{series.title}</h2>
                    {series.eventDate && (
                      <p className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-slate-500">
                        <CalendarDays size={14} className="text-emerald-600" />
                        {series.eventDate}
                      </p>
                    )}
                  </div>
                </Link>
              )})}
            </div>
          ) : (
            <PublicEmptyState
              icon={VideoIcon}
              title="Seri video belum ditemukan"
              description="Coba gunakan kata kunci lain atau kunjungi lagi saat dokumentasi video pondok telah diperbarui."
              className="border-[#d8cfbf]"
            />
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
