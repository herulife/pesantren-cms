'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Newspaper, Search } from 'lucide-react';
import { getNews, News } from '@/lib/api';
import PublicLayout from '@/components/PublicLayout';
import { PublicEmptyState } from '@/components/PublicState';
import PublicSectionIntro from '@/components/PublicSectionIntro';
import NewsCard from '@/components/NewsCard';

export default function NewsPortal() {
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchNews() {
      try {
        const data = await getNews();
        setNews(Array.isArray(data) ? data.slice(0, 12) : []);
      } catch (error) {
        console.error('Error fetching news:', error);
        setNews([]);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchNews();
  }, []);

  const filteredNews = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return news;
    }

    return news.filter((item) => {
      const title = item.title?.toLowerCase?.() || '';
      const excerpt = item.excerpt?.toLowerCase?.() || '';
      return title.includes(keyword) || excerpt.includes(keyword);
    });
  }, [news, searchTerm]);

  return (
    <PublicLayout>
      <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(180deg,#fbfcfa_0%,#f3f7f3_100%)] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.10),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(15,118,110,0.06),_transparent_22%)]" />
        <div className="mx-auto flex max-w-6xl flex-col gap-8 relative z-10">
          <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
            <PublicSectionIntro
              eyebrow="Berita"
              title="Kabar Darussunnah"
              description="Ikuti kabar kegiatan, pengumuman, dan perkembangan terbaru dari lingkungan Darussunnah."
            />

            <div className="rounded-[1.8rem] border border-white/80 bg-white/88 p-5 shadow-[0_22px_50px_-36px_rgba(15,23,42,0.16)] backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Pencarian Berita</p>
              <div className="relative mt-4 w-full">
                <input
                  type="text"
                  placeholder="Cari judul atau ringkasan berita..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 py-4 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              </div>
              <p className="mt-3 text-sm text-slate-500">
                Temukan pengumuman, kegiatan santri, dan kabar terbaru pondok dengan lebih cepat.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {isLoading ? (
          <div className="grid gap-6">
            <div className="h-64 animate-pulse rounded-[2rem] bg-slate-100" />
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-[360px] animate-pulse rounded-[2rem] bg-slate-100" />
              ))}
            </div>
          </div>
        ) : filteredNews.length > 0 ? (
          <div className="space-y-8">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.16fr)_minmax(0,0.84fr)] xl:items-stretch">
              <NewsCard news={filteredNews[0]} featured />
              <div className="grid gap-6 md:grid-cols-2 md:auto-rows-fr xl:grid-cols-1">
                {filteredNews.slice(1, 3).map((item) => (
                  <NewsCard key={item.id} news={item} />
                ))}
              </div>
            </div>

            {filteredNews.length > 3 ? (
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-emerald-200 via-emerald-100 to-transparent" />
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-700">
                    Arsip Berita
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {filteredNews.slice(3).map((item) => (
                    <NewsCard key={item.id} news={item} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <PublicEmptyState
            icon={Newspaper}
            title="Berita belum ditemukan"
            description="Coba gunakan kata kunci lain atau tunggu sampai berita terbaru dipublikasikan."
            className="rounded-[2.5rem] py-20"
          />
        )}
      </section>
    </PublicLayout>
  );
}
