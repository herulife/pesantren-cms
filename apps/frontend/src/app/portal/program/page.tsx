'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, GraduationCap, RefreshCw, Save, Users } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { getMyPSBRegistration, saveMyPSBRegistration, type Registration } from '@/lib/api';

type Jenjang = 'smp' | 'smk';
type Category = 'reguler' | 'yatim' | 'dhuafa';

const jenjangOptions: Array<{ value: Jenjang; title: string; desc: string; note: string }> = [
  { value: 'smp', title: 'SMP', desc: 'Sekolah Menengah Pertama', note: 'Dari SD/MI • Kelas awal VII' },
  { value: 'smk', title: 'SMK', desc: 'Sekolah Menengah Kejuruan', note: 'Dari SMP/MTs • Kelas awal X' },
];

const categoryOptions: Array<{ value: Category; title: string; desc: string }> = [
  { value: 'reguler', title: 'Reguler', desc: 'Pendaftaran umum tanpa beasiswa.' },
  { value: 'yatim', title: 'Yatim', desc: 'Beasiswa yatim, kuota terbatas (5). Wajib unggah surat keterangan.' },
  { value: 'dhuafa', title: 'Dhuafa', desc: 'Beasiswa dhuafa. Wajib unggah SKTM.' },
];

function clean(v: string) {
  return v.trim().toLowerCase();
}

export default function ProgramPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-10">
          <RefreshCw className="animate-spin text-emerald-600" />
        </div>
      }
    >
      <ProgramPageContent />
    </Suspense>
  );
}

function ProgramPageContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [jenjang, setJenjang] = useState<'' | Jenjang>('');
  const [category, setCategory] = useState<Category>('reguler');
  const [errors, setErrors] = useState<{ jenjang?: string }>({});

  useEffect(() => {
    const fetchRegistration = async () => {
      setIsLoading(true);
      try {
        const data = await getMyPSBRegistration();
        setRegistration(data);
        setJenjang(clean(data?.jenjang || '') as '' | Jenjang);
        setCategory((clean(data?.category || '') || 'reguler') as Category);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchRegistration();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { jenjang?: string } = {};
    if (jenjang !== 'smp' && jenjang !== 'smk') nextErrors.jenjang = 'Pilih jenjang SMP atau SMK';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showToast('error', 'Periksa kembali pilihan jenjang.');
      return;
    }
    setIsSaving(true);
    try {
      await saveMyPSBRegistration({
        full_name: registration?.full_name || '',
        nickname: registration?.nickname || '',
        gender: registration?.gender || '',
        nik: registration?.nik || '',
        birth_place: registration?.birth_place || '',
        birth_date: registration?.birth_date || '',
        address: registration?.address || '',
        school_origin: registration?.school_origin || '',
        father_name: registration?.father_name || '',
        father_job: registration?.father_job || '',
        father_phone: registration?.father_phone || '',
        mother_name: registration?.mother_name || '',
        mother_job: registration?.mother_job || '',
        mother_phone: registration?.mother_phone || '',
        program_choice: '',
        jenjang,
        category,
      });
      showToast('success', 'Jenjang berhasil disimpan. Lanjut unggah dokumen.');
      router.push('/portal/documents');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan jenjang.';
      showToast('error', message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <RefreshCw className="animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <GraduationCap size={20} />
            </span>
            <div>
              <h5 className="text-xs font-black uppercase tracking-widest text-slate-900">Jenjang Pendidikan</h5>
              <p className="mt-1 text-xs text-slate-500">Pilih jenjang yang akan ditempuh calon santri.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {jenjangOptions.map((opt) => {
              const selected = jenjang === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setJenjang(opt.value)}
                  aria-pressed={selected}
                  className={`flex flex-col gap-1 rounded-2xl border p-5 text-left transition ${
                    selected
                      ? 'border-emerald-300 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : errors.jenjang
                        ? 'border-rose-300 bg-white hover:border-rose-400'
                        : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  <span className={`text-lg font-black ${selected ? 'text-white' : 'text-slate-900'}`}>{opt.title}</span>
                  <span className={`text-xs font-semibold ${selected ? 'text-emerald-100' : 'text-slate-600'}`}>{opt.desc}</span>
                  <span className={`mt-1 text-[11px] font-medium ${selected ? 'text-emerald-200' : 'text-slate-400'}`}>{opt.note}</span>
                </button>
              );
            })}
          </div>
          {errors.jenjang ? <p className="mt-2 text-xs font-bold text-rose-600">{errors.jenjang}</p> : null}
        </div>

        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <Users size={20} />
            </span>
            <div>
              <h5 className="text-xs font-black uppercase tracking-widest text-slate-900">Kategori Pendaftar</h5>
              <p className="mt-1 text-xs text-slate-500">Pilih kategori sesuai kondisi calon santri.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {categoryOptions.map((opt) => {
              const selected = category === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCategory(opt.value)}
                  aria-pressed={selected}
                  className={`flex flex-col gap-1 rounded-2xl border p-5 text-left transition ${
                    selected
                      ? 'border-emerald-300 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  <span className={`text-sm font-black ${selected ? 'text-white' : 'text-slate-900'}`}>{opt.title}</span>
                  <span className={`mt-1 text-[11px] leading-relaxed ${selected ? 'text-emerald-100' : 'text-slate-500'}`}>{opt.desc}</span>
                </button>
              );
            })}
          </div>
          {category === 'yatim' ? (
            <p className="mt-3 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
              <AlertCircle size={14} className="shrink-0" /> Kategori Yatim memerlukan surat keterangan yatim/piatu saat langkah unggah dokumen.
            </p>
          ) : null}
          {category === 'dhuafa' ? (
            <p className="mt-3 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
              <AlertCircle size={14} className="shrink-0" /> Kategori Dhuafa memerlukan SKTM saat langkah unggah dokumen.
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 md:flex-row md:items-center md:justify-between">
        <p className="text-xs font-medium text-slate-500">Jenjang bisa disesuaikan kembali sebelum panitia memproses berkas.</p>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
          <button
            type="submit"
            value="save"
            disabled={isSaving}
            className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-emerald-200 bg-white px-6 py-4 text-xs font-black uppercase tracking-widest text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-70 md:w-auto"
          >
            {isSaving ? 'Menyimpan...' : (
              <>
                <Save size={18} /> Simpan
              </>
            )}
          </button>
          <button
            type="submit"
            value="continue"
            disabled={isSaving}
            className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-emerald-600 px-10 py-5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:opacity-70 md:w-auto"
          >
            {isSaving ? 'Menyimpan...' : (
              <>
                Simpan & Lanjut ke Dokumen <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}