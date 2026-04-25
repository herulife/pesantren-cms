'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Calendar, Loader2, Newspaper, Tag } from 'lucide-react';
import { getNewsBySlug, News } from '@/lib/api';
import PublicLayout from '@/components/PublicLayout';

function formatPublishedDate(value: string) {
  if (!value) {
    return 'Baru saja';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Baru saja';
  }

  return parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function extractParagraphs(html: string) {
  if (!html) {
    return [];
  }

  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .split(/\n+/)
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

export default function NewsDetail() {
  const params = useParams();
  const slug = params?.slug as string;

  const [news, setNews] = useState<News | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDetail() {
      if (!slug) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getNewsBySlug(slug);
        setNews(data);
      } catch (error) {
        console.error('Error fetching news detail:', error);
        setNews(null);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchDetail();
  }, [slug]);

  const contentParagraphs = useMemo(() => extractParagraphs(news?.content || ''), [news?.content]);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-emerald-500" />
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
            Memuat berita
          </p>
        </div>
      </PublicLayout>
    );
  }

  if (!news) {
    return (
      <PublicLayout>
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
            <Newspaper className="text-slate-300" size={36} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Berita tidak ditemukan
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-500">
            Berita yang Anda buka mungkin sudah dihapus atau tautannya tidak valid.
          </p>
          <Link
            href="/news"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <ArrowLeft size={16} />
            Kembali ke Berita
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const categoryName =
    typeof news.category_name === 'string'
      ? news.category_name
      : news.category_name?.Valid
        ? news.category_name.String
        : '';

  return (
    <PublicLayout>
      <section className="bg-white px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-700 transition hover:text-emerald-800"
          >
            <ArrowLeft size={16} />
            Kembali ke Halaman Berita
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-5 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-emerald-600" />
              <span>{formatPublishedDate(news.created_at)}</span>
            </div>
            {categoryName ? (
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-emerald-600" />
                <span>{categoryName}</span>
              </div>
            ) : null}
          </div>

          <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl">
            {news.title}
          </h1>

          {news.excerpt ? (
            <p className="mt-6 rounded-3xl border border-emerald-100 bg-emerald-50 px-6 py-5 text-base leading-8 text-slate-700">
              {news.excerpt}
            </p>
          ) : null}

          <article className="mt-10 space-y-5 rounded-[2rem] border border-slate-200 bg-slate-50 p-6 sm:p-8">
            {contentParagraphs.length > 0 ? (
              contentParagraphs.map((paragraph, index) => (
                <p key={index} className="text-base leading-8 text-slate-700">
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="text-base leading-8 text-slate-500">
                Konten berita belum tersedia.
              </p>
            )}
          </article>
        </div>
      </section>
    </PublicLayout>
  );
}
