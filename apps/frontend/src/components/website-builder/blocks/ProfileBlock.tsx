import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Building2, CheckCircle2, GraduationCap, School } from 'lucide-react';
import { HomeSection } from '@/lib/website-builder';
import { getString } from './helpers';

const highlights = [
  { value: '2009', label: 'Tahun Berdiri', icon: <School size={18} /> },
  { value: '6', label: 'Program Unggulan', icon: <BookOpen size={18} /> },
  { value: '3', label: 'Kurikulum Inti', icon: <GraduationCap size={18} /> },
  { value: '11', label: 'Fasilitas Utama', icon: <Building2 size={18} /> },
];

export default function ProfileBlock({ section }: { section: HomeSection }) {
  const title = getString(
    section,
    'title',
    'Darussunnah hadir sebagai ruang pembinaan Qurani yang serius, hangat, dan terarah.'
  );
  const body = getString(
    section,
    'body',
    'Pondok Pesantren Tahfidz Al Quran Darussunnah berdiri sejak 2009 di Parung, Bogor. Pondok berikhtiar membina hafalan, adab, ilmu, dan kemandirian santri melalui ritme pendidikan terpadu.'
  );
  const buttonLabel = getString(section, 'button_label', 'Lihat profil lengkap');
  const buttonUrl = getString(section, 'button_url', '/profil');

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f5f7f3_0%,#ffffff_28%,#ffffff_100%)] py-16 md:py-24">
      <div className="pointer-events-none absolute left-1/2 top-10 h-28 w-28 -translate-x-1/2 rounded-full bg-emerald-100/70 blur-3xl" />
      <div className="container relative mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-emerald-700">Profil Singkat</p>
          <h2 className="mt-5 text-[2.45rem] font-black leading-[1.02] tracking-[-0.03em] text-slate-900 md:text-[3.05rem]">
            {title}
          </h2>
          <p className="mt-5 text-[15px] leading-8 text-slate-600 md:text-lg">{body}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-bold text-white md:px-5">
              <CheckCircle2 size={16} className="text-emerald-300" />
              Pembinaan Tahfidz
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 md:px-5">
              <CheckCircle2 size={16} />
              Kurikulum Terpadu
            </span>
          </div>
          <Link
            href={buttonUrl}
            className="mt-8 inline-flex items-center gap-3 rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-black text-emerald-800 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700"
          >
            {buttonLabel} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {highlights.map((item) => (
            <div key={item.label} className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_22px_54px_-38px_rgba(15,23,42,0.22)]">
              <div className="mb-8 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600">{item.icon}</div>
              <p className="text-3xl font-black tracking-tight text-slate-900">{item.value}</p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
