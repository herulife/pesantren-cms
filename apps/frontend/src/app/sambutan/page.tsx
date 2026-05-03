'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getSettingsMap, resolveDisplayImageUrl, SettingsMap } from '@/lib/api';
import PublicLayout from '@/components/PublicLayout';
import { GraduationCap, Quote, Clock, Share2, Printer, ChevronRight } from 'lucide-react';

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

  const fallbackText =
    "Selamat datang di Pondok Pesantren Tahfidz Darussunnah. Kami berkomitmen untuk melahirkan generasi Robbani yang hafal Al-Qur'an, memiliki kedalaman ilmu syar'i, serta berakhlak mulia sesuai sunnah Nabi Muhammad SAW. Melalui kurikulum yang terintegrasi, kami membangun kemandirian dan integritas santri untuk siap mengabdi di tengah umat.";

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto flex flex-col items-center px-4 py-24">
          <div className="mb-8 h-40 w-40 animate-pulse rounded-[1.75rem] bg-slate-100" />
          <div className="mb-4 h-8 w-64 animate-pulse bg-slate-100" />
          <div className="w-full max-w-2xl space-y-4">
            <div className="h-4 animate-pulse bg-slate-100" />
            <div className="h-4 animate-pulse bg-slate-100" />
            <div className="h-4 w-3/4 animate-pulse bg-slate-100" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-slate-950 px-4 pb-16 pt-24 text-white sm:px-6 lg:px-8 lg:pb-24 lg:pt-32">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/88 to-emerald-950/72" />
        <div className="absolute right-0 top-0 h-72 w-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-emerald-700/25 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 -translate-x-1/3 translate-y-1/3 rounded-full bg-amber-300/16 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <span className="inline-flex rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200">
              Pesan dari Pimpinan
            </span>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-6xl">
              Sambutan yang menegaskan arah pendidikan Darussunnah.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-emerald-100/82 sm:text-base sm:leading-8">
              Visi, harapan, dan ajakan untuk menumbuhkan generasi yang dekat dengan Al-Qur&apos;an,
              beradab, dan siap berkontribusi untuk umat.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="relative bg-[linear-gradient(to_bottom,_#f8fafc,_#ffffff)] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.18)]">
          <div className="grid lg:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="border-b border-slate-100 bg-slate-50/70 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
              <div className="relative mx-auto h-64 w-full max-w-[250px] overflow-hidden rounded-[1.75rem] border border-white bg-white shadow-lg">
                <Image
                  src={resolveDisplayImageUrl(image)}
                  alt={name}
                  fill
                  priority
                  unoptimized
                  className="object-cover"
                />
              </div>

              <div className="mt-6 text-center lg:text-left">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700">
                  Pimpinan Pondok
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{name}</h2>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
                  <GraduationCap size={14} />
                  {role}
                </div>
              </div>

              <div className="mt-8 border-t border-slate-200 pt-6">
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <button className="inline-flex items-center justify-center gap-2 rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700">
                    <Share2 size={16} />
                    Bagikan
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center justify-center gap-2 rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
                  >
                    <Printer size={16} />
                    Cetak
                  </button>
                </div>
              </div>
            </aside>

            <div className="p-6 sm:p-8 lg:p-12">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                <Clock size={14} className="text-emerald-600" />
                Waktu baca sekitar 2 menit
              </div>

              <div className="relative mt-6">
                <Quote className="absolute -top-4 right-0 text-emerald-100" size={72} />
                <div className="relative z-10 space-y-6 text-base leading-8 text-slate-700 sm:text-[17px]">
                  {paragraphs.length > 0 ? (
                    paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
                  ) : (
                    <p>{fallbackText}</p>
                  )}
                </div>
              </div>

              <div className="mt-10 border-t border-slate-100 pt-6">
                <p className="text-sm italic leading-7 text-slate-500">
                  &quot;Pendidikan bukan hanya mengisi pikiran, tetapi juga menumbuhkan iman,
                  tanggung jawab, dan keberanian untuk memberi manfaat.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-emerald-100 bg-[linear-gradient(to_bottom,_#ecfdf5,_#f8fafc)] px-6 py-12 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-emerald-950 md:text-3xl">
              Kenali lebih dekat program pembinaan dan jalur pendaftaran santri.
            </h2>
            <p className="mt-4 text-sm leading-7 text-emerald-800/85 sm:text-base sm:leading-8">
              Setelah membaca sambutan pimpinan, Anda dapat melanjutkan ke informasi program,
              fasilitas, dan pendaftaran untuk melihat gambaran pembinaan di Darussunnah.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/program"
                className="inline-flex items-center justify-center gap-2 rounded-[1rem] bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
              >
                Lihat Program <ChevronRight size={16} />
              </Link>
              <Link
                href="/psb"
                className="inline-flex items-center justify-center gap-2 rounded-[1rem] border border-emerald-200 bg-white px-5 py-3 text-sm font-bold text-emerald-800 transition hover:border-emerald-300"
              >
                Buka Informasi PSB <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
