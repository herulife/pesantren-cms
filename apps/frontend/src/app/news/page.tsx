'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, MapPin, Newspaper, Search } from 'lucide-react';
import { getAgendas, getNews, type Agenda, type News } from '@/lib/api';
import PublicLayout from '@/components/PublicLayout';
import { PublicEmptyState } from '@/components/PublicState';
import Link from 'next/link';
import PublicSectionIntro from '@/components/PublicSectionIntro';
import NewsCard from '@/components/NewsCard';

export default function NewsPortal() {
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [agendas, setAgendas] = useState<Agenda[]>([]);

  useEffect(() => {
    async function fetchNews() {
      try {
        const data = await getNews();
        setNews(Array.isArray(data) ? data.slice(0, 12) : []);
      } catch {
        setNews([]);
      }
      try {
        const agendaData = await getAgendas();
        setAgendas(Array.isArray(agendaData) ? agendaData.slice(0, 6) : []);
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.10),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.06),_transparent_22%)]" />
        <div className="mx-auto flex max-w-6xl flex-col gap-8 relative z-10">
          <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
            <PublicSectionIntro
              eyebrow="Berita"
              title="Kabar Darussunnah"
              description="Ikuti kabar kegiatan, pengumuman, dan perkembangan terbaru dari lingkungan Darussunnah."
            />

            <div className="rounded-[1.8rem] border border-white/80 bg-white/88 p-5 shadow-[0_22px_50px_-36px_rgba(250,204,21,0.16)] backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-600">Pencarian Berita</p>
              <div className="relative mt-4 w-full">
                <input
                  type="text"
                  placeholder="Cari judul atau ringkasan berita..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 py-4 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
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
                  <div className="h-px flex-1 bg-gradient-to-r from-sky-200 via-sky-100 to-transparent" />
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-700">
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

      {agendas.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-600">Agenda</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Agenda Mendatang</h2>
            </div>
            <Link href="/agendas" className="text-xs font-black uppercase tracking-[0.2em] text-sky-600 hover:text-sky-800">
              Lihat agenda lengkap →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {agendas.map((agenda) => (
              <article key={agenda.id} className="flex h-full flex-col rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_20px_42px_-32px_rgba(250,204,21,0.16)]">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-[1.35rem] bg-sky-500 text-white shadow-lg shadow-sky-200/70">
                    <span className="text-[9px] font-black uppercase tracking-[0.18em]">
                      {agenda.start_date ? new Date(agenda.start_date).toLocaleDateString('id-ID', { month: 'short' }) : '-'}
                    </span>
                    <span className="mt-1 text-xl font-black leading-none">
                      {agenda.start_date ? new Date(agenda.start_date).getDate() : '-'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-700">
                      {agenda.category || 'Agenda'}
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-lg font-black tracking-tight text-slate-900">
                      {agenda.title}
                    </h3>
                  </div>
                </div>
                {agenda.description ? (
                  <p className="mt-4 line-clamp-3 text-sm font-medium leading-6 text-slate-600">
                    {agenda.description}
                  </p>
                ) : null}
                <div className="mt-5 space-y-2 text-sm text-slate-500">
                  <div className="flex items-start gap-2">
                    <CalendarDays size={15} className="mt-0.5 shrink-0 text-sky-500" />
                    <span>{agenda.time_info || (agenda.start_date ? new Date(agenda.start_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={15} className="mt-0.5 shrink-0 text-sky-500" />
                    <span>{agenda.location || 'Kompleks Darussunnah Parung'}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </PublicLayout>
  );
}
