'use client';

import React, { useEffect, useState } from 'react';
import PublicLayout from '@/components/PublicLayout';
import { BookOpen, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getPrograms, Program, resolveDisplayImageUrl } from '@/lib/api';

export default function ProgramPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    async function fetchPrograms() {
      try {
        const data = await getPrograms();
        if (!isActive) return;
        const sorted = [...data].sort((a, b) => {
          const orderA = a.order_index ?? 0;
          const orderB = b.order_index ?? 0;
          if (orderA !== orderB) return orderA - orderB;
          return a.title.localeCompare(b.title);
        });
        setPrograms(sorted);
      } catch (e) {
        console.error('Error fetching programs:', e);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }
    fetchPrograms();
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <PublicLayout>
      {/* Hero Header */}
      <section className="relative py-20 bg-emerald-900 border-b border-emerald-800 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/assets/img/khalaqoh.jpg')] bg-cover bg-center opacity-20" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 font-outfit uppercase tracking-tight">Program Pendidikan</h1>
          <p className="text-emerald-100 text-lg max-w-2xl mx-auto">Kurikulum terpadu untuk mencetak generasi hafizh yang kompeten.</p>
        </div>
      </section>

      {/* Program Details */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-[320px] bg-slate-50 rounded-[3rem] animate-pulse" />
              ))}
            </div>
          ) : programs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {programs.map((program) => {
                const imageUrl = resolveDisplayImageUrl(program.image_url);
                const description = program.excerpt || program.content || 'Program unggulan untuk membentuk karakter dan kompetensi santri.';
                return (
                  <div key={program.id} className="group relative bg-white rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden">
                    <div className="relative h-56 bg-slate-50 overflow-hidden">
                      {imageUrl ? (
                        <img src={imageUrl} alt={program.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-emerald-300">
                          <BookOpen size={56} className="mb-3 opacity-60" />
                          <span className="font-black text-[10px] uppercase tracking-widest text-emerald-400">Program Pondok</span>
                        </div>
                      )}
                      <div className="absolute top-5 left-5 flex flex-wrap gap-2">
                        {program.category && (
                          <span className="px-3 py-1 rounded-full bg-white/90 text-emerald-700 text-[10px] font-black uppercase tracking-widest shadow-sm">
                            {program.category}
                          </span>
                        )}
                        {program.is_featured && (
                          <span className="px-3 py-1 rounded-full bg-amber-400/90 text-emerald-950 text-[10px] font-black uppercase tracking-widest shadow-sm">
                            Unggulan
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-10">
                      <h2 className="text-2xl font-black text-slate-900 font-outfit uppercase tracking-tight mb-4">
                        {program.title}
                      </h2>
                      <p className="text-slate-600 leading-relaxed text-lg mb-8 line-clamp-3">{description}</p>
                      <Link href="/psb" className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:gap-4 transition-all">
                        Pelajari Lebih Lanjut <ArrowRight size={18} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-[3rem] py-24 text-center border-2 border-dashed border-slate-200">
              <BookOpen className="mx-auto text-slate-200 mb-6" size={48} />
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs mb-4">Program pondok belum tersedia</p>
              <Link href="/psb" className="inline-flex items-center gap-2 text-emerald-600 font-bold">
                Lihat Informasi PSB <ArrowRight size={18} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Target Output */}
      <section className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-6 font-outfit">Target Lulusan (Output)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              "Hafizh 30 Juz Mutqin",
              "Mampu Berdakwah",
              "Berakhlak Karimah"
            ].map((target, i) => (
              <div key={i} className="p-6 bg-white rounded-3xl border border-emerald-100 shadow-sm font-bold text-lg text-emerald-800">
                {target}
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
