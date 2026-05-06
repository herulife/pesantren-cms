import React from 'react';
import { Newspaper } from 'lucide-react';
import { News } from '@/lib/api';
import { HomeSection } from '@/lib/website-builder';
import NewsCard from '@/components/NewsCard';
import PublicSectionIntro from '@/components/PublicSectionIntro';
import { PublicEmptyState, PublicGridSkeleton } from '@/components/PublicState';
import { getArray, getBoolean, getNumber, getString } from './helpers';

export default function NewsBlock({ section, news, isLoading }: { section: HomeSection; news: News[]; isLoading: boolean }) {
  const eyebrow = getString(section, 'eyebrow', 'Berita Pondok');
  const title = getString(section, 'title', 'Berita Pondok');
  const subtitle = getString(section, 'subtitle', 'Kabar terbaru dari kegiatan dan informasi Darussunnah.');
  const buttonLabel = getString(section, 'button_label', 'Baca semua berita');
  const buttonUrl = getString(section, 'button_url', '/news');
  const limit = Math.max(1, getNumber(section, 'limit', 3));
  const featuredFirst = getBoolean(section, 'featured_first', true);
  const source = getString(section, 'source', 'latest');
  const manualIds = getArray<string>(section, 'manual_ids').map((item) => String(item));
  const sourceItems =
    source === 'manual' && manualIds.length > 0
      ? manualIds
          .map((id) => news.find((item) => String(item.id) === id))
          .filter((item): item is News => Boolean(item))
      : news;
  const items = sourceItems.slice(0, limit);
  const primaryItem = featuredFirst ? items[0] : null;
  const secondaryItems = featuredFirst ? items.slice(1) : items;
  const useFeaturedLayout = section.variant === 'featured-side' && featuredFirst && items.length > 1;

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <PublicSectionIntro eyebrow={eyebrow} title={title} description={subtitle} actionHref={buttonUrl} actionLabel={buttonLabel} />
        {isLoading ? (
          <PublicGridSkeleton count={limit} className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3" itemClassName="h-72 rounded-[1.7rem]" />
        ) : items.length > 0 ? (
          section.variant === 'grid' ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item, index) => (
                <NewsCard key={item.id} news={item} featured={featuredFirst && index === 0 && items.length > 1} />
              ))}
            </div>
          ) : section.variant === 'list' ? (
            <div className="mt-8 grid gap-6">
              {items.map((item, index) => (
                <NewsCard key={item.id} news={item} featured={featuredFirst && index === 0} />
              ))}
            </div>
          ) : useFeaturedLayout ? (
            <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.14fr)_minmax(0,0.86fr)] xl:items-stretch xl:gap-8">
              {primaryItem ? <NewsCard news={primaryItem} featured /> : null}
              <div className="grid gap-6 md:grid-cols-2 md:auto-rows-fr xl:grid-cols-1">
                {secondaryItems.slice(0, 2).map((item) => (
                  <NewsCard key={item.id} news={item} />
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <NewsCard key={item.id} news={item} />
              ))}
            </div>
          )
        ) : (
          <div className="mt-8">
            <PublicEmptyState icon={Newspaper} title="Belum Ada Berita" description="Berita yang sudah dipublish akan muncul di sini." />
          </div>
        )}
      </div>
    </section>
  );
}
