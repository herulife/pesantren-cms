'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  CreditCard,
  FileText,
  GraduationCap,
  RefreshCw,
  User,
  Users,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { getMyPSBRegistration, type Registration } from '@/lib/api';

function isFilled(value?: string | null) {
  return Boolean(value && value.trim());
}

const programLabel = (p?: string) => (p === 'bahasa' ? 'Bahasa Arab' : p === 'tahfidz' ? "Tahfidz Al-Qur'an" : '-');
const jenjangLabel = (j?: string) => (j === 'smk' ? 'SMK' : j === 'smp' ? 'SMP' : '-');
const categoryLabel = (c?: string) => (c === 'yatim' ? 'Yatim (Beasiswa)' : c === 'dhuafa' ? 'Dhuafa (Beasiswa)' : 'Reguler');
const genderLabel = (g?: string) => (g === 'L' ? 'Laki-laki' : g === 'P' ? 'Perempuan' : '-');

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-10">
          <RefreshCw className="animate-spin text-sky-600" />
        </div>
      }
    >
      <ReviewPageContent />
    </Suspense>
  );
}

function ReviewPageContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [registration, setRegistration] = useState<Registration | null>(null);

  useEffect(() => {
    const fetchRegistration = async () => {
      setIsLoading(true);
      try {
        const data = await getMyPSBRegistration();
        setRegistration(data);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchRegistration();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <RefreshCw className="animate-spin text-sky-600" />
      </div>
    );
  }

  const reg = registration as Registration | null;

  const requiredDocs = [
    { key: 'kk', label: 'Kartu Keluarga', url: reg?.kk_url },
    { key: 'ijazah', label: 'Ijazah / Raport Terakhir', url: reg?.ijazah_url },
    { key: 'pasfoto', label: 'Pas Foto 3x4', url: reg?.pasfoto_url },
    ...(reg?.category === 'yatim' ? [{ key: 'yatim', label: 'Surat Keterangan Yatim', url: reg?.yatim_doc_url }] : []),
    ...(reg?.category === 'dhuafa' ? [{ key: 'sktm', label: 'SKTM', url: reg?.sktm_doc_url }] : []),
  ];

  const siswaDone = [reg?.full_name, reg?.gender, reg?.nik, reg?.birth_place, reg?.birth_date, reg?.address, reg?.school_origin].every(isFilled);
  const ortuDone = [reg?.father_name, reg?.father_job, reg?.father_phone, reg?.mother_name, reg?.mother_job, reg?.mother_phone].every(isFilled);
  const programDone = [reg?.jenjang].every(isFilled);
  const docsDone = requiredDocs.every((doc) => isFilled(doc.url));
  const allComplete = siswaDone && ortuDone && programDone && docsDone;

  const sections = [
    {
      icon: <User size={18} />,
      title: 'Data Siswa',
      done: siswaDone,
      href: '/portal/biodata',
      fields: [
        { label: 'Nama Lengkap', value: reg?.full_name || '-' },
        { label: 'Jenis Kelamin', value: genderLabel(reg?.gender) },
        { label: 'NIK', value: reg?.nik || '-' },
        { label: 'Tempat, Tgl Lahir', value: [reg?.birth_place, reg?.birth_date].filter(Boolean).join(', ') || '-' },
        { label: 'Asal Sekolah', value: reg?.school_origin || '-' },
        { label: 'Alamat', value: reg?.address || '-' },
      ],
    },
    {
      icon: <Users size={18} />,
      title: 'Data Orang Tua',
      done: ortuDone,
      href: '/portal/biodata?part=2',
      fields: [
        { label: 'Nama Ayah', value: reg?.father_name || '-' },
        { label: 'Pekerjaan Ayah', value: reg?.father_job || '-' },
        { label: 'No. HP Ayah', value: reg?.father_phone || '-' },
        { label: 'Nama Ibu', value: reg?.mother_name || '-' },
        { label: 'Pekerjaan Ibu', value: reg?.mother_job || '-' },
        { label: 'No. HP Ibu', value: reg?.mother_phone || '-' },
      ],
    },
    {
      icon: <BookOpenCheck size={18} />,
      title: 'Jenjang',
      done: programDone,
      href: '/portal/program',
      fields: [
        { label: 'Jenjang', value: jenjangLabel(reg?.jenjang) },
        { label: 'Kategori', value: categoryLabel(reg?.category) },
      ],
    },
    {
      icon: <FileText size={18} />,
      title: 'Dokumen',
      done: docsDone,
      href: '/portal/documents',
      fields: requiredDocs.map((doc) => ({ label: doc.label, value: isFilled(doc.url) ? 'Sudah diunggah' : 'Belum diunggah' })),
    },
  ];

  return (
    <div className="space-y-8">
      {allComplete ? (
        <div className="flex items-start gap-4 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6">
          <div className="rounded-2xl bg-emerald-500 p-3 text-white">
            <CheckCircle2 size={26} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">Semua Berkas Lengkap</p>
            <h4 className="mt-1 font-outfit text-xl font-black uppercase tracking-tight text-emerald-950">
              Siap Konfirmasi & Pembayaran
            </h4>
            <p className="mt-2 text-sm leading-7 text-emerald-900/80">
              Semua data dan dokumen sudah lengkap. Klik tombol di bawah untuk mengonfirmasi dan melanjutkan ke pembayaran biaya pendaftaran.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-4 rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
          <div className="rounded-2xl bg-amber-500 p-3 text-white">
            <AlertCircle size={26} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-700">Masih Ada yang Perlu Dilengkapi</p>
            <h4 className="mt-1 font-outfit text-xl font-black uppercase tracking-tight text-amber-950">
              Periksa Kembali Sebelum Konfirmasi
            </h4>
            <p className="mt-2 text-sm leading-7 text-amber-900/80">
              Pastikan semua bagian berikut sudah selesai sebelum melanjutkan ke pembayaran pendaftaran.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    section.done ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {section.icon}
                </span>
                <div>
                  <h5 className="text-sm font-black uppercase tracking-widest text-slate-900">{section.title}</h5>
                  <p className={`mt-0.5 text-[11px] font-bold ${section.done ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {section.done ? 'Lengkap' : 'Belum lengkap'}
                  </p>
                </div>
              </div>
              <Link
                href={section.href}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-sky-700 transition hover:border-sky-300 hover:bg-sky-50"
              >
                {section.done ? 'Periksa Ulang' : 'Lengkapi'} <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 lg:p-6">
              {section.fields.map((field) => (
                <div key={field.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">{field.label}</p>
                  <p className={`mt-2 text-sm font-bold leading-6 ${field.value === '-' || field.value === 'Belum diunggah' ? 'text-slate-400' : 'text-slate-800'}`}>
                    {field.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-sky-600 p-3 text-white">
              <CreditCard size={22} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-700">Tahap Akhir — Pembayaran</p>
              <h4 className="mt-1 font-outfit text-xl font-black uppercase tracking-tight text-slate-900">
                Konfirmasi & Lanjut ke Pembayaran
              </h4>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                {allComplete
                  ? 'Setelah konfirmasi, kamu akan diarahkan ke halaman pembayaran untuk transfer biaya pendaftaran dan mengunggah buktinya.'
                  : 'Lengkapi semua bagian di atas terlebih dahulu agar tombol konfirmasi aktif dan proses pembayaran bisa dibuka.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={!allComplete}
            onClick={() => {
              if (!allComplete) return;
              showToast('success', 'Data sudah dikonfirmasi. Lanjut ke pembayaran pendaftaran.');
              router.push('/portal/payment');
            }}
            className={`inline-flex shrink-0 items-center justify-center gap-3 rounded-full px-10 py-5 text-xs font-black uppercase tracking-widest shadow-xl transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              allComplete
                ? 'bg-sky-600 text-white shadow-sky-600/20 hover:bg-sky-700'
                : 'bg-slate-300 text-slate-600'
            }`}
          >
            {allComplete ? (
              <>
                <Check size={18} /> Konfirmasi & Pembayaran
              </>
            ) : (
              <>
                <AlertCircle size={18} /> Belum Lengkap
              </>
            )}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}