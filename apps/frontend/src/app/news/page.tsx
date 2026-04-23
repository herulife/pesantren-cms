'use client';

import React, { useEffect, useState } from 'react';
import { getNews, News } from '@/lib/api';
import PublicLayout from '@/components/PublicLayout';
import NewsCard from '@/components/NewsCard';
import { PublicEmptyState, PublicGridSkeleton } from '@/components/PublicState';
import PublicSectionIntro from '@/components/PublicSectionIntro';
import { Newspaper, Search } from 'lucide-react';

export default function NewsPortal() {
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchNews() {
      try {
        const data = await getNews();
        setNews(data);
      } catch (e) {
        console.error('Error fetching news:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchNews();
  }, []);

  const filteredNews = news.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PublicLayout>
      {/* Header */}
      <section className="border-b border-slate-200 bg-slate-50 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:gap-8">
          <PublicSectionIntro
            eyebrow="Berita"
            title="Berita"
            description="Ikuti berita terbaru dan informasi resmi dari Pondok Pesantren Darussunnah."
          />
          
          <div className="flex w-full flex-col gap-4 sm:flex-row md:w-auto">
            <div className="relative group w-full md:w-80">
              <input 
                type="text" 
                placeholder="Cari berita atau judul..." 
                className="w-full px-12 py-4 bg-white border border-slate-200 rounded-2xl font-medium focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500" size={20} />
            </div>
          </div>
        </div>
      </section>

      {/* News Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        {isLoading ? (
          <PublicGridSkeleton count={6} className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3" itemClassName="h-[450px] rounded-[2.5rem]" />
        ) : filteredNews.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {filteredNews.map((item) => (
              <NewsCard key={item.id} news={item} />
            ))}
          </div>
        ) : (
          <PublicEmptyState
            icon={Newspaper}
            title="Berita belum ditemukan"
            description="Coba gunakan kata kunci lain atau buka kembali halaman ini nanti."
            className="rounded-[3rem] py-24"
          />
        )}
      </section>
    </PublicLayout>
  );
}
