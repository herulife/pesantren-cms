import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { HomeSection } from '@/lib/website-builder';
import { getYouTubeThumbnailUrl, resolveDisplayImageUrl } from '@/lib/api';
import PublicSectionIntro from '@/components/PublicSectionIntro';
import { PublicEmptyState, PublicGridSkeleton } from '@/components/PublicState';
import { VideoSeriesSummary } from '../HomePageRenderer';
import { getString } from './helpers';

export default function VideoBlock({ section, series, isLoading }: { section: HomeSection; series: VideoSeriesSummary[]; isLoading: boolean }) {
  const title = getString(section, 'title', 'Video Pondok');
  const subtitle = getString(section, 'subtitle', 'Rekaman kegiatan, kajian, dan dokumentasi video Darussunnah.');
  const buttonLabel = getString(section, 'button_label', 'Lihat video');
  const buttonUrl = getString(section, 'button_url', '/videos');

  return (
    <section className="bg-slate-950 py-16 md:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <PublicSectionIntro eyebrow="Video" title={title} description={subtitle} actionHref={buttonUrl} actionLabel={buttonLabel} theme="dark" />
        {isLoading ? (
          <PublicGridSkeleton count={3} className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3" itemClassName="h-56 rounded-[1.75rem] bg-white/10" />
        ) : series.length > 0 ? (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {series.slice(0, 3).map((item) => {
              const thumbnail = item.lead.thumbnail || getYouTubeThumbnailUrl(item.lead.url);
              return (
                <Link key={item.key} href={`/videos/${item.slug}`} className="group overflow-hidden rounded-[1.9rem] border border-white/10 bg-white/8 shadow-[0_28px_70px_-42px_rgba(0,0,0,0.6)]">
                  <div className="relative h-52 overflow-hidden bg-slate-900">
                    {thumbnail ? (
                      <Image src={resolveDisplayImageUrl(thumbnail)} alt={item.title} fill unoptimized className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/88 via-slate-950/20 to-transparent" />
                    <div className="absolute left-5 top-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                      <PlayCircle size={24} />
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">{item.count} Video</p>
                    <h3 className="mt-2 text-xl font-black leading-tight text-white">{item.title}</h3>
                    <div className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
                      Tonton <ArrowRight size={14} />
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
