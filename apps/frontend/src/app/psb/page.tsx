'use client';

import React from 'react';
import PublicLayout from '@/components/PublicLayout';
import { ClipboardCheck, FileText, Calendar, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PSBPage() {
  const requirements = [
    "Fotokopi Akta Kelahiran (3 lembar)",
    "Fotokopi Kartu Keluarga (3 lembar)",
    "Pas Foto 3x4 Background Merah (4 lembar)",
    "Raport Terakhir / Ijazah Terakhir",
    "Surat Keterangan Sehat dari Dokter"
  ];

  return (
    <PublicLayout>
      {/* Hero Header */}
      <section className="relative py-20 bg-emerald-900 border-b border-emerald-800 overflow-hidden text-center">
        <div className="absolute inset-0 bg-[url('/assets/img/psb-banner.png')] bg-cover bg-center opacity-30 blur-sm" />
        <div className="container mx-auto px-4 relative z-10">
          <span className="inline-block px-4 py-1 rounded-full bg-amber-400 text-emerald-950 font-black text-xs uppercase tracking-widest mb-6">Pendaftaran Dibuka</span>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 font-outfit uppercase tracking-tight leading-tight">Penerimaan Santri Baru<br />TP 2026/2027</h1>
          <p className="text-emerald-100 text-lg max-w-2xl mx-auto opacity-90">Mari bergabung bersama keluarga penghafal Al-Qur'an di Darussunnah.</p>
        </div>
      </section>

      {/* Info Sections */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Persyaratan */}
            <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden relative group">
              <div className="absolute -top-10 -right-10 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <FileText size={200} />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-8 font-outfit flex items-center gap-4">
                <ClipboardCheck className="text-emerald-600" /> Persyaratan
              </h2>
              <ul className="space-y-4 relative z-10">
                {requirements.map((req, i) => (
                  <li key={i} className="flex gap-4 items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <p className="text-slate-700 font-medium">{req}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Jadwal & Lokasi */}
            <div className="space-y-8">
              <div className="p-10 bg-emerald-50 rounded-[3rem] border border-emerald-100">
                <h2 className="text-2xl font-extrabold text-emerald-950 mb-6 font-outfit flex items-center gap-4">
                  <Calendar className="text-emerald-600" /> Gelombang Pendaftaran
                </h2>
                <div className="space-y-4">
                  <div className="p-5 bg-white rounded-2xl border border-emerald-100 shadow-sm">
                    <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">Gelombang I</p>
                    <p className="text-lg font-bold text-slate-800">1 Januari - 31 Maret 2026</p>
                  </div>
                  <div className="p-5 bg-white/50 rounded-2xl border border-dashed border-emerald-200">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Gelombang II</p>
                    <p className="text-lg font-bold text-slate-400">1 April - 30 Juni 2026 (Opsional)</p>
                  </div>
                </div>
              </div>

              <div className="p-10 bg-sky-50 rounded-[3rem] border border-sky-100">
                <h2 className="text-2xl font-extrabold text-sky-950 mb-6 font-outfit flex items-center gap-4">
                  <MapPin className="text-sky-600" /> Lokasi Pendaftaran
                </h2>
                <p className="text-slate-700 font-medium mb-4">Jl. Raya Parung No. 123, Kabupaten Bogor, Jawa Barat</p>
                <div className="w-full h-48 bg-white rounded-2xl border border-sky-100 overflow-hidden relative shadow-sm">
                   <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-widest">Peta Lokasi Placeholder</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-emerald-900 to-teal-900 border-t border-emerald-800">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tight font-outfit">SIAP MENJADI PENGHAFAL AL-QUR'AN?</h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/psb-daftar" className="px-10 py-5 bg-white text-emerald-900 font-black rounded-full hover:bg-emerald-50 hover:-translate-y-1 transition-all shadow-xl shadow-white/10 text-lg flex items-center gap-2">
              Daftar Online Sekarang <ArrowRight />
            </Link>
            <a href="https://wa.me/6281413241748" className="px-10 py-5 bg-white/10 backdrop-blur-md border border-white/20 text-white font-black rounded-full hover:bg-white/20 transition-all text-lg">
              Hubungi Panitia (WhatsApp)
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
