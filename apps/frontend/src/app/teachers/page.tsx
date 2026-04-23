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
        setTeachers(data);
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
      {/* Header */}
      <section className="bg-emerald-950 py-32 px-8 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-900 rounded-full -mr-48 -mt-48 blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/10 rounded-full -ml-32 -mb-32 blur-3xl opacity-30"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-900/50 text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-emerald-800">
            <Sparkles size={14} />
            Dewan Pengajar Darussunnah
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 uppercase tracking-tight">Profil Pengajar</h1>
          <p className="text-emerald-200 font-medium max-w-2xl mx-auto text-lg">
            Dibimbing oleh asatidz dan pengajar berpengalaman yang berkomitmen dalam mendidik dengan penuh amanah dan integritas.
          </p>
        </div>
      </section>

      {/* Teachers Grid */}
      <section className="max-w-7xl mx-auto px-8 py-24">
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
                <div className="aspect-[4/5] bg-slate-100 rounded-[2.5rem] overflow-hidden mb-6 relative group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-500">
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
                  <div className="absolute inset-x-4 bottom-4 p-4 bg-white/90 backdrop-blur-md rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0 text-center">
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">{teacher.subject}</p>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">{teacher.name}</h3>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{teacher.subject}</p>
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

      {/* Philosophy Section */}
      <section className="bg-emerald-50 py-24 px-8 rounded-[4rem] mx-4 md:mx-12 mb-24">
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
