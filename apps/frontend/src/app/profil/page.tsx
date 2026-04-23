'use client';

import React from 'react';
import PublicLayout from '@/components/PublicLayout';
import { Shield, Target, Users, BookOpen } from 'lucide-react';

export default function ProfilPage() {
  return (
    <PublicLayout>
      {/* Hero Header */}
      <section className="relative py-20 bg-emerald-900 border-b border-emerald-800 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/assets/img/gedung.webp')] bg-cover bg-center opacity-20" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 font-outfit uppercase tracking-tight">Profil Pesantren</h1>
          <p className="text-emerald-100 text-lg max-w-2xl mx-auto">Mengenal lebih dekat Pondok Pesantren Tahfidz Al-Qur'an Darussunnah Parung.</p>
        </div>
      </section>

      {/* Visi & Misi */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-6 font-outfit">Visi Kami</h2>
              <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Target size={120} />
                </div>
                <p className="text-xl text-emerald-900 font-medium leading-relaxed relative z-10 italic">
                  "Menjadi lembaga pendidikan Al-Qur'an terkemuka yang mencetak generasi huffazh yang beraqidah lurus, berakhlak mulia, dan kompeten dalam ilmu syar'i."
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-6 font-outfit">Misi Kami</h2>
              <ul className="space-y-4">
                {[
                  "Menyelenggarakan program tahfidz Al-Qur'an yang intensif dan mutqin.",
                  "Membekali santri dengan pemahaman dinul Islam sesuai manhaj salafus shalih.",
                  "Membentuk karakter santri yang mandiri, disiplin, dan berjiwa dakwah.",
                  "Mengembangkan potensi life skills dan kepemimpinan santri."
                ].map((misi, i) => (
                  <li key={i} className="flex gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">{i+1}</div>
                    <p className="text-slate-600 font-medium">{misi}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Nilai-Nilai */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4 font-outfit">Nilai Dasar (Core Values)</h2>
            <div className="h-1.5 w-20 mx-auto rounded-full bg-emerald-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { title: "Ikhlas", desc: "Beramal semata-mata mengharap ridha Allah SWT.", icon: <Shield /> },
              { title: "Disiplin", desc: "Menghargai waktu dan taat pada aturan pesantren.", icon: <Target /> },
              { title: "Sabar", desc: "Teguh dalam menghadapi tantangan menuntut ilmu.", icon: <Users /> },
              { title: "Amanah", desc: "Bertanggung jawab atas setiap tugas dan hafalan.", icon: <BookOpen /> }
            ].map((v, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl text-center border border-slate-100 shadow-sm hover:-translate-y-2 transition-all">
                <div className="w-16 h-16 mx-auto bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">{v.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{v.title}</h3>
                <p className="text-slate-500 text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
