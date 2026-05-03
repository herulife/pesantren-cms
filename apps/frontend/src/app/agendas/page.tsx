'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAgendas, Agenda } from '@/lib/api';
import PublicLayout from '@/components/PublicLayout';
import { Calendar, Clock, MapPin, Bell, ChevronRight, Sparkles } from 'lucide-react';

const agendaHighlights = [
  { value: 'Kajian', label: 'Agenda Pembinaan' },
  { value: 'Santri', label: 'Kegiatan Internal' },
  { value: 'Wali', label: 'Informasi Kunjungan' },
];

export default function AgendasPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAgendas() {
      try {
        const data = await getAgendas();
        const sortedData = data.sort(
          (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );
        setAgendas(sortedData);
      } catch (e) {
        console.error('Error fetching agendas:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAgendas();
  }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });

  const getMonthYear = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
  };

  const getDay = (dateStr: string) => new Date(dateStr).getDate();

  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-slate-950 px-4 pb-16 pt-24 text-white sm:px-6 lg:px-8 lg:pb-24 lg:pt-32">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/88 to-emerald-950/72" />
        <div className="absolute right-0 top-0 h-72 w-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 -translate-x-1/3 translate-y-1/3 rounded-full bg-emerald-700/25 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200">
                <Sparkles size={14} />
                Agenda Darussunnah
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
                Jadwal kegiatan pondok, kajian, dan momen pembinaan santri.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-emerald-100/82 sm:text-base sm:leading-8">
                Ikuti informasi kegiatan terdekat di lingkungan Darussunnah, mulai dari agenda
                pembinaan, kegiatan santri, hingga program dakwah yang terbuka untuk masyarakat.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {agendaHighlights.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.6rem] border border-white/10 bg-white/8 px-5 py-5 shadow-[0_18px_42px_-28px_rgba(0,0,0,0.45)] backdrop-blur-sm"
                >
                  <p className="text-2xl font-black text-white">{item.value}</p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/82">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-[linear-gradient(to_bottom,_#f8fafc,_#ffffff)] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-4 sm:mb-12 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700">
                Kegiatan Terjadwal
              </p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
                Agenda yang dapat diikuti santri, wali, dan masyarakat.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              Setiap kegiatan dirancang untuk menguatkan hafalan, adab, ilmu, dan kebersamaan
              dalam suasana pondok yang terarah.
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-5">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-[1.5rem] border border-slate-100 bg-white shadow-sm"
                />
              ))}
            </div>
          ) : agendas.length > 0 ? (
            <div className="grid gap-5">
              {agendas.map((agenda, index) => (
                <article
                  key={agenda.id}
                  className={`group rounded-[1.75rem] border p-5 transition-all duration-300 hover:-translate-y-1 sm:p-6 ${
                    index === 0
                      ? 'border-emerald-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] shadow-[0_28px_60px_-38px_rgba(16,185,129,0.24)]'
                      : 'border-slate-200/80 bg-white shadow-sm hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/8'
                  }`}
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start">
                    <div className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-[1.35rem] text-emerald-900 ${
                      index === 0 ? 'border border-emerald-300 bg-emerald-500 text-white shadow-lg shadow-emerald-200/80' : 'border border-emerald-200 bg-emerald-50'
                    }`}>
                      <span className="text-2xl font-black leading-none">{getDay(agenda.start_date)}</span>
                      <span className={`mt-1 text-[10px] font-black uppercase tracking-[0.18em] ${index === 0 ? 'text-emerald-50/90' : 'text-emerald-700/70'}`}>
                        {getMonthYear(agenda.start_date)}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                          index === 0 ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {agenda.category || 'Agenda Pondok'}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          <Clock size={14} className="text-emerald-500" />
                          {agenda.time_info || '08:00 - Selesai'}
                        </div>
                      </div>

                      <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-emerald-700 sm:text-2xl">
                        {agenda.title}
                      </h3>

                      <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-emerald-600" />
                          {formatDate(agenda.start_date)}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-rose-500" />
                          {agenda.location || 'Kompleks Darussunnah Parung'}
                        </div>
                      </div>

                      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                        {agenda.description ||
                          'Agenda ini menjadi bagian dari pembinaan rutin untuk memperkuat ilmu, adab, dan kebersamaan di lingkungan Darussunnah.'}
                      </p>
                    </div>

                    <div className="hidden self-center md:flex">
                      <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-slate-100 text-slate-400 transition-all group-hover:bg-emerald-600 group-hover:text-white">
                        <Bell size={18} />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.9rem] border border-dashed border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
              <Calendar className="mx-auto mb-5 text-slate-200" size={52} />
              <h3 className="text-xl font-bold tracking-tight text-slate-900">Agenda terdekat akan diumumkan di sini.</h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                Silakan cek kembali dalam waktu dekat atau hubungi pihak pondok untuk informasi
                kegiatan, kunjungan, dan agenda pembinaan berikutnya.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-emerald-950 px-6 py-10 text-white shadow-[0_30px_80px_-30px_rgba(6,78,59,0.5)] sm:px-8 sm:py-12 lg:px-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-200/80">
                Informasi Kegiatan
              </p>
              <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                Ingin menanyakan agenda kunjungan, kajian, atau kegiatan pondok?
              </h3>
              <p className="mt-4 text-sm leading-7 text-emerald-100/82 sm:text-base">
                Tim Darussunnah siap membantu informasi kegiatan dan kebutuhan komunikasi wali,
                calon santri, maupun mitra dakwah.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/kontak"
                className="inline-flex items-center justify-center gap-2 rounded-[1rem] bg-white px-5 py-3 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50"
              >
                Hubungi Pondok <ChevronRight size={16} />
              </Link>
              <Link
                href="/psb"
                className="inline-flex items-center justify-center gap-2 rounded-[1rem] border border-white/16 bg-white/8 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/12"
              >
                Lihat Pendaftaran <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
