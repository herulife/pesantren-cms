'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { getTeachers, Teacher, resolveDisplayImageUrl } from '@/lib/api';
import PublicLayout from '@/components/PublicLayout';
import Link from 'next/link';
import { UserCheck, Sparkles, Quote, ChevronRight } from 'lucide-react';

const teacherHighlights = [
  { value: 'Asatidz', label: 'Pendamping Santri' },
  { value: 'Adab', label: 'Keteladanan Harian' },
  { value: 'Ilmu', label: 'Pembinaan Terarah' },
];

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTeachers() {
      try {
        const data = await getTeachers();
        setTeachers(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Error fetching teachers:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTeachers();
  }, []);

  return (
    <PublicLayout>
      <section className="relative overflow-hidden border-b border-emerald-800 bg-slate-950 px-4 py-24 text-white sm:px-6 lg:px-8 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-emerald-950/70" />
        <div className="absolute top-0 right-0 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-emerald-900 blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-amber-400/10 blur-3xl opacity-30" />

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="max-w-4xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
                <Sparkles size={14} />
                Dewan Pengajar Darussunnah
              </div>
              <h1 className="mb-6 text-4xl font-black tracking-tight md:text-6xl">
                Asatidz yang membersamai pembinaan santri.
              </h1>
              <p className="max-w-3xl text-sm font-medium leading-7 text-emerald-100/85 sm:text-base sm:leading-8">
                Darussunnah dibimbing oleh para pengajar yang hadir bukan hanya menyampaikan materi,
                tetapi juga menanamkan adab, kedisiplinan, dan semangat menuntut ilmu.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {teacherHighlights.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.6rem] border border-white/10 bg-white/8 px-5 py-5 shadow-[0_20px_42px_-30px_rgba(0,0,0,0.45)] backdrop-blur-sm"
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

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">Asatidz</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            Pembimbing yang membersamai perjalanan santri
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600">
            Para pengajar hadir bukan hanya untuk menyampaikan materi, tetapi juga menjadi teladan
            dalam adab, kedisiplinan, dan semangat menuntut ilmu.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-[400px] rounded-[1.75rem] bg-slate-50 animate-pulse"></div>
            ))}
          </div>
        ) : teachers.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-4">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="group relative">
                <div className="relative mb-5 aspect-[4/5] overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-slate-100 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl">
                  {resolveDisplayImageUrl(teacher.image_url) ? (
                    <Image
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      src={resolveDisplayImageUrl(teacher.image_url)}
                      alt={teacher.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-emerald-50 text-slate-300">
                      <UserCheck size={64} className="mb-4 opacity-20" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Wajah Pengajar</span>
                    </div>
                  )}
                  <div className="absolute inset-x-4 bottom-4 translate-y-4 rounded-[1rem] bg-white/92 p-4 text-center opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">{teacher.subject}</p>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="mb-1 text-xl font-bold text-slate-900 transition-colors group-hover:text-emerald-600">
                    {teacher.name}
                  </h3>
                  <p className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">{teacher.subject}</p>
                  <p className="px-4 text-sm font-medium italic text-slate-500 line-clamp-2">
                    &quot;{teacher.bio || 'Pengajar tetap di Darussunnah.'}&quot;
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.9rem] border-2 border-dashed border-slate-200 bg-slate-50 py-24 text-center">
            <UserCheck className="mx-auto mb-6 text-slate-200" size={48} />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Profil pengajar akan segera ditampilkan
            </p>
          </div>
        )}
      </section>

      <section className="mx-4 mb-16 rounded-[2rem] border border-emerald-100 bg-[linear-gradient(to_bottom,_#ecfdf5,_#f8fafc)] px-6 py-14 md:mx-12 md:mb-24 md:px-8 md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <Quote className="mx-auto mb-6 text-emerald-200" size={56} />
          <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-emerald-950 md:text-3xl">
            &quot;Mendidik dengan hati, mengajar dengan keteladanan.&quot;
          </h2>
          <p className="text-base font-medium leading-8 text-emerald-800/85 md:text-lg">
            Di Darussunnah, kehadiran guru adalah qudwah. Para pengajar tidak hanya menyampaikan
            materi, tetapi juga menjadi teladan dalam adab, keteguhan ibadah, dan semangat belajar.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/program"
              className="inline-flex items-center justify-center gap-2 rounded-[1rem] bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
            >
              Lihat Program Pendidikan <ChevronRight size={16} />
            </Link>
            <Link
              href="/psb"
              className="inline-flex items-center justify-center gap-2 rounded-[1rem] border border-emerald-200 bg-white px-5 py-3 text-sm font-bold text-emerald-800 transition hover:border-emerald-300"
            >
              Informasi Pendaftaran <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
