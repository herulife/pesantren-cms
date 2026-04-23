'use client';

import React from 'react';
import PublicLayout from '@/components/PublicLayout';
import { CheckCircle2, FileText, Upload, ArrowRight, User } from 'lucide-react';
import Link from 'next/link';

export default function PsbSuccessPage() {
  return (
    <PublicLayout>
      <section className="py-20 bg-slate-50 min-h-screen">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white p-8 md:p-14 rounded-[3rem] border border-slate-100 shadow-2xl shadow-blue-900/5 text-center relative overflow-hidden">
             
             {/* Decorative Background */}
             <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-50 to-white opacity-50 pointer-events-none"></div>

             <div className="relative z-10">
               <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-100">
                  <CheckCircle2 className="text-emerald-500" size={48} />
               </div>
               
               <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 font-outfit uppercase tracking-tight leading-tight">Pendaftaran <span className="text-emerald-600 block sm:inline">Berhasil!</span></h1>
               <p className="text-slate-600 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                 Alhamdulillah, data awal pendaftaran calon santri telah kami terima. Silahkan lengkapi biodata dan unggah dokumen persyaratan di Portal Wali Santri.
               </p>

               <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8 mb-10 text-left">
                  <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-amber-600" />
                    Langkah Selanjutnya:
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">1</div>
                      <p className="text-amber-800 text-sm">Simpan Nomor Identitas (NISN) dan Email yang Anda daftarkan.</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">2</div>
                      <p className="text-amber-800 text-sm">Masuk ke Portal Wali Santri untuk melengkapi biodata orang tua dan wali.</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">3</div>
                      <p className="text-amber-800 text-sm">Unggah scan Kartu Keluarga dan Ijazah terakhir.</p>
                    </li>
                  </ul>
               </div>

               <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    href="/portal/biodata" 
                    className="px-8 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-3"
                  >
                    <User size={18} />
                    Lengkapi Biodata
                  </Link>
                  <Link 
                    href="/portal/documents" 
                    className="px-8 py-5 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3"
                  >
                    <Upload size={18} />
                    Unggah Dokumen
                  </Link>
               </div>
             </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
