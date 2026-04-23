'use client';

import React, { useState } from 'react';
import PublicLayout from '@/components/PublicLayout';
import { Search, ShieldAlert, CheckCircle, GraduationCap, XCircle } from 'lucide-react';
import Link from 'next/link';

// Using mock status for the public page, you can wire this up to getRegistrations later
export default function PsbStatusPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<null | { name: string, status: string, notes: string }>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setIsLoading(true);
    setHasSearched(true);
    
    // Mock simulation
    setTimeout(() => {
      // Fake logic: if query contains 'lulus', status success, else pending or failed
      const query = searchQuery.toLowerCase();
      if (query.includes('lulus')) {
        setResult({ name: 'Fulan bin Fulan', status: 'Diterima', notes: 'Silahkan melakukan daftar ulang sebelum tanggal 15 Agustus.' });
      } else if (query.includes('gagal')) {
        setResult({ name: 'Fulan bin Fulan', status: 'Tidak Diterima', notes: 'Mohon maaf, Anda belum memenuhi standar kelulusan.' });
      } else {
        setResult({ name: 'Fulan bin Fulan', status: 'Pending', notes: 'Dokumen sedang diproses, silakan cek berkala.' });
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <PublicLayout>
      <section className="py-20 bg-slate-50 min-h-screen">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-200 text-blue-600">
               <GraduationCap size={40} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-4 font-outfit uppercase tracking-tight">Cek Status PSB</h1>
            <p className="text-slate-500 text-lg">Masukkan Nomor Pendaftaran atau NISN untuk melihat hasil seleksi Penerimaan Santri Baru.</p>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
            <form onSubmit={handleSearch} className="mb-8">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">ID Pendaftaran / NISN</label>
              <div className="flex gap-4">
                 <div className="relative flex-1 group">
                    <input 
                      type="text" 
                      placeholder="Contoh: PSB20260405" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium"
                    />
                    <Search className="absolute left-4 top-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                 </div>
                 <button 
                   type="submit"
                   disabled={isLoading}
                   className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                 >
                   {isLoading ? 'Mencari...' : 'Cari'}
                 </button>
              </div>
            </form>

            {hasSearched && !isLoading && result && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="h-px bg-slate-100 w-full mb-8"></div>
                
                <h3 className="text-xl font-black text-slate-900 mb-6 font-outfit uppercase tracking-tight">Hasil Pencarian</h3>
                
                <div className={`p-8 rounded-[2rem] border ${
                  result.status === 'Diterima' ? 'bg-emerald-50 border-emerald-100' :
                  result.status === 'Tidak Diterima' ? 'bg-rose-50 border-rose-100' :
                  'bg-amber-50 border-amber-100'
                }`}>
                  <div className="flex items-start gap-4">
                     <div className={`mt-1 bg-white p-2 rounded-full shadow-sm ${
                        result.status === 'Diterima' ? 'text-emerald-500' :
                        result.status === 'Tidak Diterima' ? 'text-rose-500' :
                        'text-amber-500'
                     }`}>
                        {result.status === 'Diterima' ? <CheckCircle size={24} /> :
                         result.status === 'Tidak Diterima' ? <XCircle size={24} /> :
                         <ShieldAlert size={24} />}
                     </div>
                     <div>
                        <p className="text-sm font-bold text-slate-500 mb-1 uppercase tracking-widest">{result.name}</p>
                        <h4 className={`text-2xl font-black uppercase tracking-tight mb-3 ${
                           result.status === 'Diterima' ? 'text-emerald-800' :
                           result.status === 'Tidak Diterima' ? 'text-rose-800' :
                           'text-amber-800'
                        }`}>{result.status}</h4>
                        <p className={`text-sm font-medium leading-relaxed ${
                           result.status === 'Diterima' ? 'text-emerald-700' :
                           result.status === 'Tidak Diterima' ? 'text-rose-700' :
                           'text-amber-700'
                        }`}>{result.notes}</p>
                     </div>
                  </div>
                </div>

                <div className="mt-8 text-center">
                   <Link href="/psb" className="text-blue-600 text-sm font-bold hover:underline">
                      Kembali ke Informasi Pendaftaran
                   </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
