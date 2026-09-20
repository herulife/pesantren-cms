'use client';

import React, { useState } from 'react';
import PublicLayout from '@/components/PublicLayout';
import { Search, ShieldAlert, CheckCircle, GraduationCap, XCircle, Loader2, Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';
import { getPSBPengumuman, type PSBPengumuman } from '@/lib/api';

export default function PsbStatusPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PSBPengumuman | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setResult(null);
    setNotFound(false);
    setApiError('');

    const raw = searchQuery.trim();
    const numeric = raw.replace(/\D/g, '');

    try {
      const res = await getPSBPengumuman(numeric || raw);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        // API menanggapi dengan success=false (nomor tidak ditemukan / tidak valid)
        setNotFound(true);
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memeriksa data. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const statusTone =
    result?.status === 'accepted' || result?.status === 're_registration'
      ? { box: 'bg-sky-50 border-sky-100', icon: 'text-sky-500', title: 'text-sky-800', body: 'text-sky-700' }
      : result?.status === 'tes'
        ? { box: 'bg-indigo-50 border-indigo-100', icon: 'text-indigo-500', title: 'text-indigo-800', body: 'text-indigo-700' }
        : result?.status === 'rejected'
          ? { box: 'bg-rose-50 border-rose-100', icon: 'text-rose-500', title: 'text-rose-800', body: 'text-rose-700' }
          : { box: 'bg-amber-50 border-amber-100', icon: 'text-amber-500', title: 'text-amber-800', body: 'text-amber-700' };

  return (
    <PublicLayout>
      <section className="py-20 bg-slate-50 min-h-screen">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-sky-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-sky-200 text-sky-600">
              <GraduationCap size={40} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-4 font-outfit uppercase tracking-tight">Pengumuman Kelulusan</h1>
            <p className="text-slate-500 text-lg">Masukkan Nomor Pendaftaran (contoh: PSB-0001 atau angka 1) untuk melihat hasil seleksi Penerimaan Santri Baru.</p>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
            <form onSubmit={handleSearch} className="mb-8">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Nomor Pendaftaran</label>
              <div className="flex gap-4">
                <div className="relative flex-1 group">
                  <input
                    type="text"
                    placeholder="Contoh: PSB-0001"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium"
                  />
                  <Search className="absolute left-4 top-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={20} />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !searchQuery.trim()}
                  className="px-8 py-4 bg-sky-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-sky-700 transition-all shadow-lg shadow-sky-600/20 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                >
                  {isLoading ? 'Mencari...' : 'Cari'}
                </button>
              </div>
            </form>

            {hasSearched && isLoading ? (
              <div className="py-10 flex justify-center">
                <Loader2 size={32} className="animate-spin text-sky-500" />
              </div>
            ) : null}

            {hasSearched && !isLoading && apiError ? (
              <div className="p-6 rounded-[1.5rem] border border-rose-100 bg-rose-50 text-center">
                <p className="text-sm font-bold text-rose-700">{apiError}</p>
              </div>
            ) : null}

            {hasSearched && !isLoading && notFound && !apiError ? (
              <div className="p-8 rounded-[2rem] border border-amber-100 bg-amber-50 text-center">
                <ShieldAlert size={32} className="mx-auto mb-3 text-amber-500" />
                <h4 className="text-xl font-black uppercase tracking-tight text-amber-800">Nomor Tidak Ditemukan</h4>
                <p className="mt-2 text-sm font-medium text-amber-700">
                  Pastikan nomor pendaftaran yang kamu masukkan sudah benar. Hubungi panitia jika masih kesulitan.
                </p>
              </div>
            ) : null}

            {hasSearched && !isLoading && result ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="h-px bg-slate-100 w-full mb-8"></div>

                <h3 className="text-xl font-black text-slate-900 mb-6 font-outfit uppercase tracking-tight">Hasil Pencarian</h3>

                <div className={`p-8 rounded-[2rem] border ${statusTone.box}`}>
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 bg-white p-2 rounded-full shadow-sm ${statusTone.icon}`}>
                      {result.status === 'accepted' || result.status === 're_registration' ? (
                        <CheckCircle size={24} />
                      ) : result.status === 'rejected' ? (
                        <XCircle size={24} />
                      ) : (
                        <ShieldAlert size={24} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-500 mb-1 uppercase tracking-widest">
                        {result.no} • {result.full_name}
                      </p>
                      <h4 className={`text-2xl font-black uppercase tracking-tight mb-2 ${statusTone.title}`}>{result.status_label}</h4>
                      {result.program_choice ? (
                        <p className={`text-sm font-medium ${statusTone.body}`}>Jenjang: {(result.jenjang || '-').toUpperCase()} | Program: {result.program_choice}</p>
                      ) : null}
                      {result.status === 'tes' && result.test_date ? (
                        <p className={`mt-3 flex items-start gap-2 text-sm font-medium ${statusTone.body}`}>
                          <Calendar size={16} className="mt-0.5 shrink-0" />
                          Jadwal tes: {result.test_date}
                        </p>
                      ) : null}
                      {result.status === 'rejected' && result.rejection_note ? (
                        <p className={`mt-3 text-sm font-medium leading-6 ${statusTone.body}`}>
                          Catatan panitia: {result.rejection_note}
                        </p>
                      ) : null}
                      {(result.status === 'accepted' || result.status === 're_registration') ? (
                        <p className={`mt-3 flex items-start gap-2 text-sm font-medium leading-6 ${statusTone.body}`}>
                          <MapPin size={16} className="mt-0.5 shrink-0" />
                          Selamat! Silakan selesaikan daftar ulang melalui Portal Wali Santri sebelum batas waktu yang ditetapkan panitia.
                        </p>
                      ) : null}
                      {result.status === 'tes' ? (
                        <p className="mt-3 text-xs font-semibold text-slate-500">
                          Detail lengkap jadwal dan lokasi tersedia di dashboard Portal Wali Santri.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <Link href="/psb" className="text-sky-600 text-sm font-bold hover:underline">
                    Kembali ke Informasi Pendaftaran
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}