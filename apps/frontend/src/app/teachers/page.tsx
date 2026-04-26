'use client';

import React, { useEffect, useState } from 'react';
import { getTeachers, Teacher, resolveDisplayImageUrl } from '@/lib/api';
import PublicLayout from '@/components/PublicLayout';
import { UserCheck, Sparkles, Send, Quote } from 'lucide-react';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTeachers() {
      try {
        const data = await getTeachers();
        setTeachers(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Error fetching teachers:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTeachers();
  }, []);

  return (
    <PublicLayout>
      <section className="relative overflow-hidden border-b border-emerald-800 bg-slate-950 px-8 py-28 text-center text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-emerald-950/70" />
        <div className="absolute top-0 right-0 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-emerald-900 blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-amber-400/10 blur-3xl opacity-30" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
            <Sparkles size={14} />
            Dewan Pengajar Darussunnah
          </div>
          <h1 className="mb-6 text-5xl font-black uppercase tracking-tight md:text-7xl">Profil Pengajar</h1>
          <p className="mx-auto max-w-3xl text-lg font-medium text-emerald-100/85 leading-8">
            Dibimbing oleh asatidz dan pengajar berpengalaman yang berkomitmen dalam mendidik dengan penuh amanah dan integritas.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-8 py-24">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">Asatidz</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">Pembimbing yang membersamai perjalanan santri</h2>
          <p className="mt-4 text-base leading-8 text-slate-600">
            Para pengajar hadir bukan hanya untuk menyampaikan materi, tetapi juga menjadi teladan
            dalam adab, kedisiplinan, dan semangat menuntut ilmu.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-[400px] bg-slate-50 rounded-[2.5rem] animate-pulse"></div>
            ))}
          </div>
        ) : teachers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="group relative">
                <div className="relative mb-6 aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-slate-100 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl">
                  {resolveDisplayImageUrl(teacher.image_url) ? (
                    <img 
                      src={resolveDisplayImageUrl(teacher.image_url)} 
                      alt={teacher.name}
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-emerald-50">
                      <UserCheck size={64} className="mb-4 opacity-20" />
                      <span className="font-black text-[10px] uppercase tracking-widest">Wajah Pengajar</span>
                    </div>
                  )}
                  <div className="absolute inset-x-4 bottom-4 translate-y-4 rounded-2xl bg-white/90 p-4 text-center opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">{teacher.subject}</p>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="mb-1 text-xl font-bold text-slate-900 transition-colors group-hover:text-emerald-600">{teacher.name}</h3>
                  <p className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">{teacher.subject}</p>
                  <p className="text-slate-500 text-sm font-medium line-clamp-2 italic px-4">
                    "{teacher.bio || 'Pengajar tetap di Darussunnah.'}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-[3rem] py-32 text-center border-2 border-dashed border-slate-200">
            <UserCheck className="mx-auto text-slate-200 mb-6" size={48} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Informasi pengajar belum tersedia</p>
          </div>
          )}
      </section>

      <section className="mx-4 mb-24 rounded-[4rem] bg-[linear-gradient(to_bottom,_#ecfdf5,_#f8fafc)] px-8 py-24 md:mx-12">
        <div className="max-w-4xl mx-auto text-center">
          <Quote className="mx-auto text-emerald-200 mb-8" size={64} />
          <h2 className="text-3xl font-black text-emerald-900 uppercase tracking-tight mb-8">
            "Mendidik dengan hati, Mengajar dengan keteladanan."
          </h2>
          <p className="text-lg text-emerald-700 font-medium leading-relaxed">
            Di Darussunnah, kami percaya bahwa kunci keberhasilan pendidikan karakter terletak pada keteladanan (qudwah) sang guru. Setiap pengajar tidak hanya menyampaikan materi, tetapi juga menjadi cerminan adab dan akhlak bagi para santri.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
