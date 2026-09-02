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
  { value: 'all', label: 'Semua' },
  { value: 'Kajian', label: 'Kajian' },
  { value: 'Santri', label: 'Santri' },
  { value: 'Video', label: 'Dokumentasi' },
];

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

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
    let result = seriesList;

    if (activeCategory !== 'all') {
      result = result.filter((series) =>
        series.lead.series_name?.toLowerCase().includes(activeCategory.toLowerCase()) ||
        series.lead.title?.toLowerCase().includes(activeCategory.toLowerCase())
      );
    }

    if (q) {
      result = result.filter((series) => series.title.toLowerCase().includes(q));
    }

    return result;
  }, [seriesList, searchQuery, activeCategory]);

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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {videoHighlights.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setActiveCategory(item.value)}
                  className={`rounded-[1.4rem] border px-5 py-4 text-left transition-all duration-300 ${
                    activeCategory === item.value
                      ? 'border-emerald-400/60 bg-emerald-400/15 shadow-[0_0_30px_rgba(52,211,153,0.15)]'
                      : 'border-white/10 bg-white/8 hover:bg-white/12 hover:border-white/20'
                  }`}
                >
                  <p className={`text-lg font-black transition-colors ${
                    activeCategory === item.value ? 'text-emerald-300' : 'text-white'
                  }`}>{item.label}</p>
                  {item.value !== 'all' && (
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/60">
                      {item.value === 'Kajian' ? 'Seri Utama' : item.value === 'Santri' ? 'Kegiatan Pondok' : 'Dokumentasi Berkala'}
                    </p>
                  )}
                </button>
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
                <Link key={series.key} href={`/videos/${series.slug}`} className="group overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.18)] transition-all duration-500 hover:shadow-[0_25px_60px_-20px_rgba(16,185,129,0.2)] hover:-translate-y-1 hover:border-emerald-200/60">
                  <div className="relative aspect-video overflow-hidden bg-slate-900">
                    {thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt={series.title}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover opacity-80 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-900 to-slate-900 text-emerald-300">
                        <VideoIcon size={40} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md border border-white/25 transition-all duration-500 group-hover:scale-125 group-hover:bg-emerald-500/40 group-hover:border-emerald-300/50 group-hover:shadow-[0_0_40px_rgba(52,211,153,0.3)]">
                        <PlayCircle size={34} />
                      </div>
                    </div>
                    <div className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md">
                      <PlayCircle size={12} />
                      {series.count} video
                    </div>
                  </div>
                  <div className="p-6">
                    <h2 className="text-xl font-black tracking-tight text-slate-900 transition-colors duration-300 group-hover:text-emerald-700 line-clamp-2">{series.title}</h2>
                    {series.eventDate && (
                      <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-slate-400">
                        <CalendarDays size={13} className="text-emerald-500" />
                        {series.eventDate}
                      </p>
                    )}
                    <div className="mt-4 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 transition-all duration-300 group-hover:gap-3">
                      Tonton Sekarang
                      <svg className="transition-transform duration-300 group-hover:translate-x-1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </div>
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
