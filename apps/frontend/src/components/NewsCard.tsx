import { Calendar, ChevronRight, Newspaper } from 'lucide-react';
import { News, resolveDisplayImageUrl } from '@/lib/api';
import Link from 'next/link';

export default function NewsCard({ news }: { news: News }) {
  const publishedAt = news.created_at 
    ? new Date(news.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Baru saja';
  const imageUrl = news.image_url?.Valid && news.image_url.String
    ? resolveDisplayImageUrl(news.image_url.String)
    : '';

  return (
    <div className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
      <Link href={`/news/${news.slug}`} className="block">
        <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={news.title}
              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50/50">
               <Newspaper size={40} className="mb-2 opacity-20" />
               <span className="font-black tracking-widest text-[9px] uppercase opacity-40">Tanpa Gambar</span>
            </div>
          )}
          <div className="absolute top-6 left-6">
            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg ${
              news.status === 'published' ? 'bg-emerald-600/90 text-white shadow-emerald-600/20' : 'bg-amber-500/90 text-white shadow-amber-500/20'
            }`}>
              {news.status}
            </span>
          </div>
        </div>
        
        <div className="p-8">
          <div className="flex items-center gap-3 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
            <span>{publishedAt}</span>
          </div>
          
          <h3 className="font-black text-2xl text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 min-h-[4rem] leading-tight">
            {news.title}
          </h3>
          
          <p className="text-slate-500 text-sm mt-4 line-clamp-3 font-medium leading-relaxed">
            {news.excerpt || 'Klik untuk membaca selengkapnya...'}
          </p>
          
          <div className="mt-8 flex items-center text-emerald-600 font-black text-xs uppercase tracking-[0.2em] group/btn cursor-pointer">
            Selengkapnya
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center ml-3 group-hover/btn:bg-emerald-600 group-hover/btn:text-white transition-all">
              <ChevronRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
