'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { getSettingsMap, resolveDisplayImageUrl, SettingsMap } from '@/lib/api';
import PublicLayout from '@/components/PublicLayout';
import { GraduationCap, Quote, Clock, Share2, Printer } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SambutanPage() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const settingsData = await getSettingsMap({ silentUnauthorized: true });
        setSettings(settingsData || {});
      } catch (e) {
        console.error('Error fetching settings:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const name = settings.welcome_speech_name || 'Ust. Rusdi';
  const role = settings.welcome_speech_role || 'Pimpinan Pondok';
  const image = settings.welcome_speech_image || '/assets/img/kepsek.png';
  const text = settings.welcome_speech_text || '';
  
  const paragraphs = text
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const fallbackText = "Selamat datang di Pondok Pesantren Tahfidz Darussunnah. Kami berkomitmen untuk melahirkan generasi Robbani yang hafal Al-Qur'an, memiliki kedalaman ilmu syar'i, serta berakhlak mulia sesuai sunnah Nabi Muhammad SAW. Melalui kurikulum yang terintegrasi, kami membangun kemandirian dan integritas santri untuk siap mengabdi di tengah umat.";

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-24 flex flex-col items-center">
          <div className="w-40 h-40 rounded-full bg-slate-100 animate-pulse mb-8" />
          <div className="w-64 h-8 bg-slate-100 animate-pulse mb-4" />
          <div className="w-full max-w-2xl space-y-4">
            <div className="h-4 bg-slate-100 animate-pulse" />
            <div className="h-4 bg-slate-100 animate-pulse" />
            <div className="h-4 bg-slate-100 animate-pulse w-3/4" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* 🏛️ HEADER SECTION */}
      <section className="relative overflow-hidden bg-slate-900 pt-24 pb-48 lg:pt-32 lg:pb-64">
        <div className="absolute inset-0 bg-[url('/assets/img/pattern.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.3em] mb-6">
              Pesan dari Pimpinan
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight mb-4">
              Sambutan Pimpinan
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl font-medium">
              Visi dan harapan besar dalam membina generasi penghafal Al-Qur&apos;an di Darussunnah.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 📜 CONTENT SECTION */}
      <section className="relative -mt-32 lg:-mt-48 pb-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="bg-white rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              
              {/* Profile Sidebar */}
              <div className="lg:col-span-4 bg-slate-50/50 p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col items-center">
                <div className="relative group mb-8">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative w-48 h-48 lg:w-56 lg:h-56 rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl transition-transform duration-500 group-hover:-translate-y-2">
                    <Image 
                      src={resolveDisplayImageUrl(image)} 
                      alt={name} 
                      fill 
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{name}</h2>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
                    <GraduationCap size={14} />
                    {role}
                  </div>
                </div>

                <div className="mt-12 w-full pt-8 border-t border-slate-200">
                   <div className="flex flex-col gap-4">
                      <button className="flex items-center justify-center gap-3 w-full py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-white hover:shadow-md transition-all">
                        <Share2 size={16} /> Bagikan
                      </button>
                      <button onClick={() => window.print()} className="flex items-center justify-center gap-3 w-full py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-white hover:shadow-md transition-all">
                        <Printer size={16} /> Cetak Pesan
                      </button>
                   </div>
                </div>
              </div>

              {/* Speech Body */}
              <div className="lg:col-span-8 p-8 lg:p-16 relative">
                <Quote className="absolute top-10 right-10 text-emerald-500/5 sm:text-emerald-500/10" size={120} />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 text-slate-400 text-sm font-bold uppercase tracking-widest mb-8">
                    <Clock size={16} className="text-emerald-500" />
                    Waktu Baca: 2 Menit
                  </div>

                  <div className="prose prose-slate prose-lg max-w-none">
                    <div className="space-y-6 text-slate-700 leading-relaxed font-outfit font-medium text-lg lg:text-xl italic">
                      {paragraphs.length > 0 ? (
                        paragraphs.map((p, i) => (
                          <p key={i}>{p}</p>
                        ))
                      ) : (
                        <p>{fallbackText}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-16 pt-8 border-t border-slate-100">
                    <p className="text-slate-500 text-sm italic">
                      &quot;Pendidikan bukan hanya tentang mengisi wadah, melainkan tentang menyalakan api perjuangan untuk agama dan bangsa.&quot;
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 🚀 CTA SECTION */}
      <section className="pb-24 pt-12">
        <div className="container mx-auto px-4 max-w-5xl text-center">
           <div className="bg-emerald-600 rounded-[2.5rem] p-12 lg:p-16 relative overflow-hidden shadow-2xl shadow-emerald-900/20">
              <div className="absolute inset-0 bg-[url('/assets/img/pattern.svg')] opacity-10" />
              <div className="relative z-10">
                 <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Mulai Perjalanan Spiritual Santri</h2>
                 <p className="text-emerald-100 text-lg mb-10 max-w-2xl mx-auto">
                    Bergabunglah bersama keluarga besar Darussunnah dan wujudkan cita-cita menjadi penghafal Al-Qur&apos;an yang mandiri.
                 </p>
                 <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="/psb" className="bg-white text-emerald-800 px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform shadow-xl">Daftar Sekarang</a>
                    <a href="/program" className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-400 transition-colors">Lihat Program Unggulan</a>
                 </div>
              </div>
           </div>
        </div>
      </section>
    </PublicLayout>
  );
}
