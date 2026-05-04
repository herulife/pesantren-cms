'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, FileText, GraduationCap, PlayCircle, RefreshCw, Calendar, Sparkles } from 'lucide-react';
import { getAvailableExams, type Exam } from '@/lib/api';

export default function AvailableExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      setIsLoading(true);
      const data = await getAvailableExams();
      setExams(data);
      setIsLoading(false);
    };
    fetchExams();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 shadow-inner">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
        <p className="font-outfit text-sm font-black uppercase tracking-widest text-slate-400">Memuat Ujian...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl pb-20">
      {/* Header Breadcrumb */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/portal" className="inline-flex items-center gap-2 w-fit rounded-xl bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 border border-slate-200">
          <ArrowLeft size={16} /> Kembali ke Portal
        </Link>
        <div className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 w-fit">
          <GraduationCap size={16} /> Computer Based Test
        </div>
      </div>

      {/* Hero Title */}
      <div className="mb-12 relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-10 text-white shadow-2xl">
        <div className="absolute right-0 top-0 h-64 w-64 -mr-20 -mt-20 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-64 w-64 -ml-20 -mb-20 rounded-full bg-purple-500/20 blur-3xl" />
        
        <div className="relative z-10">
          <h1 className="font-outfit text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-4">Ujian Tersedia</h1>
          <p className="text-lg text-white/70 max-w-xl">Kerjakan ujian dengan jujur dan sungguh-sungguh. Pastikan koneksi intenet Anda stabil sebelum menekan tombol mulai.</p>
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-slate-200 bg-white py-24 px-6 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-slate-300 ring-8 ring-slate-50/50">
            <Sparkles size={40} />
          </div>
          <h3 className="font-outfit text-2xl font-black uppercase tracking-tight text-slate-900">Belum Ada Ujian Aktif</h3>
          <p className="mt-3 max-w-md text-sm text-slate-500">Saat ini tidak ada sesi ujian atau kuis yang dijadwalkan untuk Anda. Silakan istirahat atau pelajari materi berikutnya.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam, index) => {
            // Pick a color theme based on index for variety
            const colors = [
              "from-blue-500 to-blue-700",
              "from-purple-500 to-purple-700",
              "from-emerald-500 to-emerald-700",
              "from-amber-500 to-amber-700"
            ];
            const bgGradient = colors[index % colors.length];

            return (
              <div key={exam.id} className="group relative flex flex-col overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-2xl hover:shadow-slate-200/50 hover:ring-blue-300">
                
                {/* Card Header (Subject Cover) */}
                <div className={`relative h-40 w-full bg-gradient-to-br ${bgGradient} p-6 flex flex-col justify-between overflow-hidden`}>
                  <div className="absolute right-0 top-0 h-32 w-32 -mr-10 -mt-10 rounded-full bg-white/10 blur-2xl transition-transform duration-700 group-hover:scale-150" />
                  
                  <div className="relative z-10 flex w-full justify-between items-start">
                    <span className="rounded-xl bg-white/20 backdrop-blur-md px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-sm border border-white/20">
                      {exam.semester} • {exam.academic_year}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-900 shadow-md">
                      <FileText size={20} />
                    </div>
                  </div>

                  <h3 className="relative z-10 font-outfit text-xl font-black tracking-tight text-white line-clamp-2 mt-auto">
                    {exam.title}
                  </h3>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-6 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-500">Mata Pelajaran</span>
                      <span className="font-black text-slate-900">{exam.subject_name}</span>
                    </div>
                    <div className="w-full border-t border-dashed border-slate-200" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-bold text-slate-500"><Clock size={16} /> Durasi Ujian</span>
                      <span className="rounded-lg bg-slate-100 px-3 py-1 font-black text-slate-900">{exam.duration_minutes} Menit</span>
                    </div>
                  </div>

                  {/* Action Button pushes to bottom */}
                  <div className="mt-auto pt-4">
                    <Link
                      href={`/portal/exams/${exam.id}`}
                      className="group/btn flex w-full items-center justify-center gap-3 rounded-[1.25rem] bg-slate-900 py-4 text-xs font-black uppercase tracking-widest text-white transition-all shadow-lg hover:bg-blue-600 hover:shadow-blue-600/30 active:scale-95"
                    >
                      Mulai Mengerjakan
                      <PlayCircle size={18} className="transition-transform group-hover/btn:scale-110" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modern Info Banner */}
      <div className="mt-16 flex flex-col md:flex-row items-center gap-6 rounded-[2rem] bg-gradient-to-r from-amber-50 to-orange-50 p-8 border border-amber-100/50 shadow-inner">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 ring-8 ring-white">
          <Calendar size={28} />
        </div>
        <div>
          <h4 className="font-outfit text-lg font-black uppercase tracking-tight text-amber-900 mb-2">Panduan CBT</h4>
          <ul className="grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm text-amber-800/80 font-medium list-disc ml-4">
            <li>Pastikan koneksi internet stabil sebelum akses ujian.</li>
            <li>Dilarang membuka tab/aplikasi lain selama ujian.</li>
            <li>Jawaban otomatis tersimpan ke server secara real-time.</li>
            <li>Waktu ujian dihitung dari saat tombol &apos;Mulai Mengerjakan&apos; ditekan.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
