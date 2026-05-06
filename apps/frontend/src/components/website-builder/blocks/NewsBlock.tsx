import React from 'react';
import { Newspaper } from 'lucide-react';
import { News } from '@/lib/api';
import { HomeSection } from '@/lib/website-builder';
import NewsCard from '@/components/NewsCard';
import PublicSectionIntro from '@/components/PublicSectionIntro';
import { PublicEmptyState, PublicGridSkeleton } from '@/components/PublicState';
import { getString } from './helpers';

export default function NewsBlock({ section, news, isLoading }: { section: HomeSection; news: News[]; isLoading: boolean }) {
  const title = getString(section, 'title', 'Berita Pondok');
  const subtitle = getString(section, 'subtitle', 'Kabar terbaru dari kegiatan dan informasi Darussunnah.');
  const buttonLabel = getString(section, 'button_label', 'Baca semua berita');
  const buttonUrl = getString(section, 'button_url', '/news');

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <PublicSectionIntro eyebrow="Berita Pondok" title={title} description={subtitle} actionHref={buttonUrl} actionLabel={buttonLabel} />
        {isLoading ? (
          <PublicGridSkeleton count={3} className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3" itemClassName="h-72 rounded-[1.7rem]" />
        ) : news.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.14fr)_minmax(0,0.86fr)] xl:items-stretch xl:gap-8">
            <NewsCard news={news[0]} featured />
            <div className="grid gap-6 md:grid-cols-2 md:auto-rows-fr xl:grid-cols-1">
              {news.slice(1, 3).map((item) => (
                <NewsCard key={item.id} news={item} />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <PublicEmptyState icon={Newspaper} title="Belum Ada Berita" description="Berita yang sudah dipublish akan muncul di sini." />
          </div>
        )}
      </div>
    </section>
  );
}
