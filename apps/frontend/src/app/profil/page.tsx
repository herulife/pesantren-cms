'use client';

import React from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { ArrowRight, Building2, CheckCircle2, Landmark, MapPin, PhoneCall, ShieldCheck, Sparkles } from 'lucide-react';

const institutionFacts = [
  { label: 'Nama Yayasan', value: 'Tunas Muda Qurani', icon: <Building2 size={18} /> },
  { label: 'NSPP', value: '510032011292', icon: <ShieldCheck size={18} /> },
  { label: 'Notaris', value: 'Dr. Aidir Amin Daud, DFM', icon: <Landmark size={18} /> },
  { label: 'SK Kemenkumham', value: 'AHU-038333.50.80.2014', icon: <CheckCircle2 size={18} /> },
];

const missionPoints = [
  'Mengembangkan potensi intelektual santri secara terarah dan seimbang.',
  'Menjadikan Al-Quran sebagai media utama dalam proses pembelajaran.',
  'Membentuk akhlak karimah sebagai dasar kepribadian santri.',
  'Menjadi mediator kaderisasi umat yang siap hadir di tengah masyarakat.',
  'Meningkatkan kreativitas, kemandirian, dan daya juang santri.',
  'Berorientasi pada sistem manajemen terpadu yang tertib dan profesional.',
  'Menumbuhkan jiwa patriot dan cinta tanah air sejak dini.',
];

const profileHighlights = [
  { value: '2009', label: 'Tahun Berdiri' },
  { value: 'Qurani', label: 'Arah Pembinaan' },
  { value: 'Bogor', label: 'Basis Pondok' },
];

export default function ProfilPage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden border-b border-emerald-900/80 bg-slate-950 py-24 text-white lg:py-28">
        <div className="absolute inset-0 bg-[url('/assets/img/gedung.webp')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-emerald-950/75" />
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-emerald-100">
                <Sparkles size={14} />
                Profil Pesantren
              </p>
              <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
                Pondok Pesantren Tahfidz Al Quran Darussunnah Parung
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-emerald-50/90">
                Mengenal lembaga, arah pembinaan, visi-misi, dan identitas resmi Darussunnah sebagai
                pondok yang menyiapkan generasi muslim berkualitas melalui pendekatan Al-Quran dan
                manajemen terpadu.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {profileHighlights.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.6rem] border border-white/10 bg-white/8 px-5 py-5 shadow-[0_20px_45px_-30px_rgba(0,0,0,0.45)] backdrop-blur-sm"
                >
                  <p className="text-3xl font-black text-white">{item.value}</p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/82">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fbfcfa_0%,#f6f7f4_100%)] py-16 md:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.08),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(15,118,110,0.06),_transparent_24%)]" />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">Tentang Darussunnah</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
              Pondok yang tumbuh dari semangat pembinaan Qurani dan kaderisasi umat.
            </h2>
            <p className="mt-6 text-base leading-8 text-slate-600 md:text-lg">
              Pondok Pesantren Tahfidz Al Quran Darussunnah didirikan oleh Yayasan Tunas Muda Qurani
              pada tahun 2009 di Kp. Lengkong Barang RT.01/02, Ds. Iwul, Kec. Parung, Bogor.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-600 md:text-lg">
              Saat ini Darussunnah juga tengah membangun fasilitas belajar santri putra termasuk
              masjid di Kp. Muara Jaya RT.01/05, Ciaureuten Ilir, Bogor sebagai lokasi Pondok
              Pesantren Putra.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white">
                <MapPin size={16} className="text-emerald-300" />
                Parung, Bogor 16330
              </span>
              <a
                href="tel:081382410582"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
              >
                <PhoneCall size={16} className="text-emerald-500" />
                0813 8241 0582
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-emerald-100 bg-white/90 p-8 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.18)] backdrop-blur-sm">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">Identitas Lembaga</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {institutionFacts.map((fact) => (
                <div key={fact.label} className="rounded-[1.5rem] border border-white bg-white p-5">
                  <div className="mb-3 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                    {fact.icon}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{fact.label}</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-800">{fact.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[1.5rem] bg-slate-900 p-5 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">Alamat Pondok</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                Kp. Lengkong Barang RT.01/02, Ds. Iwul, Kec. Parung, Bogor 16330
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#0f172a_0%,#10251d_100%)] py-16 text-white md:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">Visi</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Arah utama pembinaan Darussunnah</h2>
            <p className="mt-6 text-lg leading-8 text-slate-100">
              Menjadi lembaga yang menyiapkan generasi muslim yang berkualitas, melalui pendekatan
              Al-Quran dan manajemen terpadu.
            </p>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">Misi</p>
            <div className="mt-6 grid gap-4">
              {missionPoints.map((mission) => (
                <div key={mission} className="flex gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-300">
                    <CheckCircle2 size={18} />
                  </div>
                  <p className="text-sm leading-7 text-slate-200">{mission}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white py-16 md:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.05),_transparent_24%)]" />
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-8 shadow-[0_28px_65px_-38px_rgba(15,23,42,0.18)] backdrop-blur-sm md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">Langkah Berikutnya</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
              Lanjutkan mengenal program dan fasilitas pondok
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Setelah memahami identitas dan arah pembinaan Darussunnah, lanjutkan ke program dan fasilitas untuk melihat gambaran pondok secara lebih utuh.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/program"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
              >
                Lihat halaman program <ArrowRight size={16} />
              </Link>
              <Link
                href="/facilities"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
              >
                Lihat fasilitas pondok <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
