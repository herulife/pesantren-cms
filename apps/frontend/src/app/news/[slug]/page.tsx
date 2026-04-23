'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getNewsBySlug, News, resolveDisplayImageUrl } from '@/lib/api';
import PublicLayout from '@/components/PublicLayout';
import { Calendar, Tag, Share2, ArrowLeft, Loader2, Newspaper } from 'lucide-react';
import Link from 'next/link';

export default function NewsDetail() {
  const params = useParams();
  const slug = params?.slug as string;
  
  const [news, setNews] = useState<News | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      getNewsBySlug(slug).then(data => {
        setNews(data);
        setIsLoading(false);
      });
    }
  }, [slug]);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Memuat Berita...</p>
        </div>
      </PublicLayout>
    );
  }

  if (!news) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-8 text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl mb-8">
            <Newspaper className="text-slate-200" size={48} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tight">Berita Tidak Ditemukan</h1>
          <p className="text-slate-500 mb-8 max-w-md mx-auto font-medium">Maaf, berita yang Anda cari mungkin telah dihapus atau tautannya tidak valid.</p>
          <Link 
            href="/news" 
            className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Kembali ke Berita
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const publishedAt = news.created_at 
    ? new Date(news.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Baru saja';
  const categoryName =
    typeof news.category_name === 'string'
      ? news.category_name
      : news.category_name?.Valid
        ? news.category_name.String
        : '';
  const imageUrl = news.image_url?.Valid && news.image_url.String
    ? resolveDisplayImageUrl(news.image_url.String)
    : '';

  return (
    <PublicLayout>
      {/* Article Header */}
      <section className="bg-white pt-32 pb-20 px-8">
        <div className="max-w-4xl mx-auto">
          <Link 
            href="/news" 
            className="inline-flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest mb-12 hover:gap-3 transition-all"
          >
            <ArrowLeft size={16} /> Kembali ke Halaman Berita
          </Link>

          <div className="flex flex-wrap items-center gap-6 mb-8">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>{publishedAt}</span>
            </div>
            {categoryName && (
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                <Tag className="w-4 h-4 text-emerald-500" />
                <span>{categoryName}</span>
              </div>
            )}
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] mb-12">
            {news.title}
          </h1>

          {/* Hero Image */}
          {imageUrl && (
            <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden shadow-2xl mb-16 relative group">
              <Image 
                src={imageUrl} 
                alt={news.title}
                fill
                unoptimized
                sizes="100vw"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          )}

          {/* Article Content */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-16">
            <article 
              className="prose prose-slate prose-xl max-w-none 
                prose-headings:font-black prose-headings:text-slate-900 
                prose-p:text-slate-600 prose-p:leading-relaxed
                prose-img:rounded-3xl prose-img:shadow-lg
                prose-strong:text-emerald-700 prose-strong:font-black"
              dangerouslySetInnerHTML={{ __html: news.content }}
            />

            {/* Sticky Sidebar */}
            <aside className="relative">
              <div className="sticky top-32 space-y-12">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Bagikan</h4>
                  <div className="flex flex-col gap-3">
                    <button className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                      <Share2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Footer Banner */}
      <section className="bg-slate-50 py-24 px-8 border-t border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-emerald-600/20">
            <Newspaper size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-6 uppercase tracking-tight">Tetap Terhubung</h2>
          <p className="text-slate-500 font-medium mb-10 max-w-lg mx-auto">Dapatkan informasi terbaru seputar kegiatan dan perkembangan Pondok Pesantren Darussunnah langsung di email Anda.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/news" 
              className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all shadow-sm"
            >
              Berita Lainnya
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
