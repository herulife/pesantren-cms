'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import PublicSectionIntro from '@/components/PublicSectionIntro';
import { PublicEmptyState, PublicGridSkeleton } from '@/components/PublicState';
import {
  getVideos,
  Video,
  formatGalleryAlbumTitle,
  getGallerySortTimestamp,
  getYouTubeThumbnailUrl,
  extractYouTubeVideoId,
  slugifyContentKey,
} from '@/lib/api';
import { ArrowLeft, CalendarDays, PlayCircle, Video as VideoIcon } from 'lucide-react';

type SeriesView = {
  key: string;
  title: string;
  eventDate: string;
  items: Video[];
};

export default function VideoSeriesPage() {
  const params = useParams();
  const slugParam = Array.isArray(params?.slug) ? params?.slug[0] : params?.slug;
  const slug = String(slugParam || '');
  const [series, setSeries] = useState<SeriesView | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    async function fetchSeries() {
      try {
        const res = await getVideos({ limit: 200, offset: 0 });
        const items = Array.isArray(res.data) ? res.data : [];
        const grouped = new Map<string, Video[]>();

        for (const video of items) {
          const key =
            video.series_slug ||
            slugifyContentKey(video.series_name || '') ||
            String(video.id);
          const current = grouped.get(key) || [];
          current.push(video);
          grouped.set(key, current);
        }

        let selectedKey = '';
        if (grouped.has(slug)) {
          selectedKey = slug;
        } else {
          for (const [key, value] of grouped.entries()) {
            if (value.some((item) => String(item.id) === slug || item.series_slug === slug)) {
              selectedKey = key;
              break;
            }
          }
        }

        const selectedItems = selectedKey ? grouped.get(selectedKey) || [] : [];
        if (!selectedItems.length) {
          if (isActive) setSeries(null);
          return;
        }

        const sorted = [...selectedItems].sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
        const lead = sorted[0];
        if (isActive) {
          setSeries({
            key: selectedKey,
            title: formatGalleryAlbumTitle(lead.series_name || lead.title),
            eventDate: lead.event_date,
            items: sorted,
          });
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    fetchSeries();
    return () => {
      isActive = false;
    };
  }, [slug]);

  const sortedItems = useMemo(() => {
    if (!series) return [];
    return [...series.items].sort((a, b) => getGallerySortTimestamp(b.event_date, b.created_at) - getGallerySortTimestamp(a.event_date, a.created_at));
  }, [series]);

  const leadVideo = sortedItems[0];
  const leadVideoId = leadVideo ? extractYouTubeVideoId(leadVideo.url) : '';

  return (
    <PublicLayout>
      <section className="relative overflow-hidden border-b border-emerald-900/40 bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.22),_transparent_42%),linear-gradient(135deg,_#052e2b_0%,_#064e3b_52%,_#022c22_100%)] py-20 text-white">
        <div className="container relative z-10 mx-auto max-w-6xl px-4">
          <Link href="/videos" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-100/80 hover:text-white">
            <ArrowLeft size={14} />
            Kembali ke Video
          </Link>
          <div className="mt-8">
            <PublicSectionIntro
              eyebrow="Seri Video Pondok"
              title={series?.title || 'Dokumentasi Video'}
              description="Kumpulan video kegiatan atau kajian yang tersusun dalam satu seri."
              theme="dark"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#f6f4ee] py-12">
        <div className="container mx-auto max-w-6xl px-4">
          {isLoading ? (
            <PublicGridSkeleton count={6} className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3" itemClassName="h-[240px] rounded-[2rem]" />
          ) : series ? (
            <>
              <div className="mb-10 flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                {series.eventDate && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
                    <CalendarDays size={14} className="text-emerald-600" />
                    {series.eventDate}
                  </span>
                )}
                <span className="rounded-full bg-white px-4 py-2 shadow-sm">{series.items.length} video</span>
              </div>

              {leadVideoId ? (
                <div className="mb-12 overflow-hidden rounded-[2.5rem] border border-white/80 bg-white shadow-[0_25px_60px_-35px_rgba(15,23,42,0.3)]">
                  <div className="aspect-video">
                    <iframe
                      title={series.title}
                      src={`https://www.youtube.com/embed/${leadVideoId}`}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <div className="px-6 py-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Video Utama</p>
                    <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">{leadVideo.title}</h2>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {sortedItems.map((video) => {
                  const thumbnail = video.thumbnail || getYouTubeThumbnailUrl(video.url);
                  return (
                    <a key={video.id} href={video.url} target="_blank" rel="noopener noreferrer" className="group overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.25)]">
                      <div className="relative aspect-video overflow-hidden bg-slate-900">
                        {thumbnail ? (
                          <img src={thumbnail} alt={video.title} className="h-full w-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-500">
                            <VideoIcon size={40} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                            <PlayCircle size={30} />
                          </div>
                        </div>
                      </div>
                      <div className="px-5 py-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-600">Video</p>
                        <h3 className="mt-2 text-lg font-black uppercase tracking-tight text-slate-900 line-clamp-2">{video.title}</h3>
                      </div>
                    </a>
                  );
                })}
              </div>
            </>
          ) : (
            <PublicEmptyState
              icon={VideoIcon}
              title="Seri video tidak ditemukan"
              description="Seri video ini belum tersedia. Coba kembali ke halaman utama video."
              className="border-[#d8cfbf]"
            />
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
