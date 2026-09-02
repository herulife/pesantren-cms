import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { HomeSection } from '@/lib/website-builder';
import { getYouTubeThumbnailUrl, resolveDisplayImageUrl } from '@/lib/api';
import PublicSectionIntro from '@/components/PublicSectionIntro';
import { PublicEmptyState, PublicGridSkeleton } from '@/components/PublicState';
import { VideoSeriesSummary } from '../HomePageRenderer';
import { getArray, getNumber, getString } from './helpers';

export default function VideoBlock({ section, series, isLoading }: { section: HomeSection; series: VideoSeriesSummary[]; isLoading: boolean }) {
  const eyebrow = getString(section, 'eyebrow', 'Video');
  const title = getString(section, 'title', 'Video Pondok');
  const subtitle = getString(section, 'subtitle', 'Rekaman kegiatan, kajian, dan dokumentasi video Darussunnah.');
  const buttonLabel = getString(section, 'button_label', 'Lihat video');
  const buttonUrl = getString(section, 'button_url', '/videos');
  const limit = Math.max(1, getNumber(section, 'limit', 3));
  const source = getString(section, 'source', 'latest');
  const manualIds = getArray<string>(section, 'manual_ids').map((item) => String(item));
  const sourceItems =
    source === 'manual' && manualIds.length > 0
      ? manualIds
          .map((id) => series.find((item) => item.slug === id || item.key === id))
          .filter((item): item is VideoSeriesSummary => Boolean(item))
      : series;
  const items = sourceItems.slice(0, limit);

  return (
    <section className="bg-slate-950 py-16 md:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <PublicSectionIntro eyebrow={eyebrow} title={title} description={subtitle} actionHref={buttonUrl} actionLabel={buttonLabel} theme="dark" />
        {isLoading ? (
          <PublicGridSkeleton count={limit} className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3" itemClassName="h-56 rounded-[1.75rem] bg-white/10" />
        ) : items.length > 0 ? (
          <div className={`mt-8 grid gap-5 ${section.variant === 'spotlight' ? 'lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]' : 'md:grid-cols-3'}`}>
            {items.map((item, index) => {
              const thumbnail = item.lead.thumbnail || getYouTubeThumbnailUrl(item.lead.url);
              return (
                <Link key={item.key} href={`/videos/${item.slug}`} className={`group overflow-hidden rounded-[1.7rem] border border-white/10 bg-white/8 shadow-[0_28px_70px_-42px_rgba(0,0,0,0.6)] transition-all duration-500 hover:border-emerald-400/30 hover:bg-white/12 hover:shadow-[0_35px_80px_-35px_rgba(52,211,153,0.15)] ${section.variant === 'spotlight' && index === 0 ? 'lg:row-span-2' : ''}`}>
                  <div className={`relative overflow-hidden bg-slate-900 ${section.variant === 'spotlight' && index === 0 ? 'h-72 lg:h-full' : 'h-52'}`}>
                    {thumbnail ? (
                      <Image src={resolveDisplayImageUrl(thumbnail)} alt={item.title} fill unoptimized className="object-cover transition-all duration-700 group-hover:scale-110" />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="absolute left-5 top-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/90 text-white shadow-lg backdrop-blur-sm transition-all duration-500 group-hover:scale-110 group-hover:bg-emerald-400 group-hover:shadow-[0_0_30px_rgba(52,211,153,0.3)]">
                      <PlayCircle size={22} />
                    </div>
                    <div className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold text-white/90 backdrop-blur-md">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg>
                      {item.count} Video
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-black leading-tight text-white transition-colors duration-300 group-hover:text-emerald-300 line-clamp-2">{item.title}</h3>
                    <div className="mt-4 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200/80 transition-all duration-300 group-hover:gap-3 group-hover:text-emerald-300">
                      Tonton
                      <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-8">
            <PublicEmptyState
              icon={PlayCircle}
              title="Belum Ada Video"
              description="Video yang sudah dipublish akan muncul di sini."
              className="border-white/10 bg-white/5"
              iconClassName="text-slate-600"
              titleClassName="text-white"
              descriptionClassName="text-slate-400"
            />
          </div>
        )}
      </div>
    </section>
  );
}
