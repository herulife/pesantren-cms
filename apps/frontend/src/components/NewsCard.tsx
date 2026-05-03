import { Calendar, ChevronRight, Newspaper } from 'lucide-react';
import { News, resolveDisplayImageUrl } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

type NewsCardProps = {
  news: News;
  featured?: boolean;
};

export default function NewsCard({ news, featured = false }: NewsCardProps) {
  const publishedAt = news.created_at 
    ? new Date(news.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Baru saja';
  const imageUrl = news.image_url?.Valid && news.image_url.String
    ? resolveDisplayImageUrl(news.image_url.String)
    : '';

  return (
    <article className={`group overflow-hidden rounded-[1.7rem] border border-slate-200/80 bg-white shadow-[0_22px_48px_-34px_rgba(15,23,42,0.16)] transition-all duration-500 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_26px_60px_-34px_rgba(15,23,42,0.22)] ${featured ? 'md:rounded-[1.9rem]' : 'h-full'}`}>
      <Link href={`/news/${news.slug}`} className={`block ${featured ? '' : 'h-full'}`}>
        <div className={`relative overflow-hidden bg-slate-100 ${featured ? 'h-[260px] md:h-[320px]' : 'h-[220px] md:h-52'}`}>
          {imageUrl ? (
            <Image
              fill
              unoptimized
              sizes={featured ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
              src={imageUrl}
              alt={news.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50/50 text-slate-300">
               <Newspaper size={40} className="mb-2 opacity-20" />
               <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Tanpa Gambar</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/88 via-slate-950/18 to-transparent" />
          <div className="absolute left-4 top-4 sm:left-5 sm:top-5">
            <span className={`rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] backdrop-blur-md shadow-lg ${
              news.status === 'published' ? 'bg-emerald-600/90 text-white shadow-emerald-600/20' : 'bg-amber-500/90 text-white shadow-amber-500/20'
            }`}>
              {news.status === 'published' ? 'Published' : news.status}
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/90">
              <Calendar className="h-3.5 w-3.5 text-emerald-200" />
              <span>{publishedAt}</span>
            </div>
            <h3 className={`mt-3 font-black leading-tight text-white ${featured ? 'max-w-xl text-2xl sm:text-3xl' : 'line-clamp-2 text-xl'}`}>
              {news.title}
            </h3>
          </div>
        </div>
        
        <div className={`border-t border-slate-100/90 bg-white ${featured ? 'p-6 md:p-7' : 'flex h-full flex-col p-5 md:p-6'}`}>
          <p className={`font-medium leading-relaxed text-slate-600 ${featured ? 'line-clamp-3 text-[15px]' : 'line-clamp-2 text-sm'}`}>
            {news.excerpt || 'Klik untuk membaca selengkapnya...'}
          </p>
          
          <div className="group/btn mt-6 flex cursor-pointer items-center text-xs font-black uppercase tracking-[0.2em] text-emerald-600 md:mt-auto md:pt-6">
            Selengkapnya
            <div className="ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 transition-all group-hover/btn:bg-emerald-600 group-hover/btn:text-white">
              <ChevronRight size={16} className="transition-transform group-hover/btn:translate-x-0.5" />
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
