'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Download, Eye, FileText, Printer, RefreshCw, Sparkles, Target, TrendingUp } from 'lucide-react';
import { getMyAcademicGrades, getMyAttendanceSummary, getMyTahfidz, type Grade, type TahfidzProgress } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { downloadStudentReportPDF, previewStudentReportPDF } from '@/lib/export';

function formatDateLabel(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatScore(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return value.toFixed(1);
}

function getLatestAcademicMeta(grades: Grade[]) {
  if (!grades.length) {
    return { semester: '-', academicYear: '-' };
  }

  return {
    semester: grades[0]?.semester || '-',
    academicYear: grades[0]?.academic_year || '-',
  };
}

function getLetterPredicate(letter?: string | null) {
  switch ((letter || '').toUpperCase()) {
    case 'A':
      return 'Sangat Baik';
    case 'B':
      return 'Baik';
    case 'C':
      return 'Cukup';
    case 'D':
      return 'Perlu Bimbingan';
    default:
      return '-';
  }
}

export default function PortalRaportPage() {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<Record<string, number>>({});
  const [tahfidz, setTahfidz] = useState<TahfidzProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAcademicData = async () => {
      setIsLoading(true);
      try {
        const [gradesData, attendanceData, tahfidzData] = await Promise.all([
          getMyAcademicGrades(),
          getMyAttendanceSummary(),
          getMyTahfidz(),
        ]);

        setGrades(gradesData);
        setAttendanceSummary(attendanceData);
        setTahfidz(tahfidzData);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAcademicData();
  }, []);

  const reportSummary = useMemo(() => {
    const totalGrades = grades.length;
    const averageScore = totalGrades
      ? grades.reduce((sum, item) => sum + (item.final_score || 0), 0) / totalGrades
      : 0;
    const bestScore = totalGrades ? Math.max(...grades.map((item) => item.final_score || 0)) : 0;
    const completedTahfidz = tahfidz.filter((item) => item.status === 'lulus' || item.status === 'setor').length;
    const latestTahfidz = tahfidz[0] || null;
    const latestMeta = getLatestAcademicMeta(grades);

    return {
      totalGrades,
      averageScore,
      bestScore,
      completedTahfidz,
      latestTahfidz,
      latestMeta,
      hadir: attendanceSummary.hadir || 0,
      sakit: attendanceSummary.sakit || 0,
      izin: attendanceSummary.izin || 0,
      alpha: attendanceSummary.alpha || 0,
    };
  }, [attendanceSummary, grades, tahfidz]);

  const reportPayload = useMemo(
    () => ({
      studentName: user?.name || 'Santri Darussunnah',
      studentIdentity: user?.email || '-',
      averageScore: formatScore(reportSummary.averageScore),
      hadir: reportSummary.hadir,
      izinSakit: reportSummary.izin + reportSummary.sakit,
      alpha: reportSummary.alpha,
      scores: grades.map((item) => ({
        subject: item.subject_name || '-',
        semester: item.semester || '-',
        academicYear: item.academic_year || '-',
        finalScore: formatScore(item.final_score),
        gradeLetter: item.grade_letter || '-',
      })),
      tahfidz: tahfidz.map((item) => ({
        surahName: item.surah_name || '-',
        juz: item.juz || '-',
        ayatRange: `${item.start_ayat || '-'}-${item.end_ayat || '-'}`,
        status: item.status || '-',
        evaluationDate: formatDateLabel(item.evaluation_date),
      })),
      filename: `raport-${(user?.name || 'santri').toLowerCase().replace(/\s+/g, '-')}`,
    }),
    [grades, reportSummary.alpha, reportSummary.averageScore, reportSummary.hadir, reportSummary.izin, reportSummary.sakit, tahfidz, user?.email, user?.name]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <RefreshCw className="animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Navigasi Cepat</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Setelah selesai membaca raport, kamu bisa kembali ke dashboard atau pindah ke menu akademik lain tanpa bingung.
          </p>
        </div>
        <Link
          href="/portal"
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Kembali ke Dashboard Portal
        </Link>
      </div>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm print:shadow-none">
        <div className="flex flex-col gap-5 border-b border-slate-100 px-5 py-5 lg:flex-row lg:items-start lg:justify-between lg:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Portal Wali Santri</p>
            <h1 className="mt-2 font-outfit text-2xl font-black tracking-tight text-slate-900 lg:text-3xl">
              Raport Akademik Santri
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              Nilai, kehadiran, dan progres tahfidz ditampilkan dalam format yang lebih rapi dan mudah dibaca.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 print:hidden sm:grid-cols-3 lg:w-auto">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Printer size={16} />
              Cetak
            </button>
            <button
              type="button"
              onClick={() => previewStudentReportPDF(reportPayload)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Eye size={16} />
              Preview
            </button>
            <button
              type="button"
              onClick={() => downloadStudentReportPDF(reportPayload)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Download size={16} />
              Download
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2 xl:grid-cols-4 lg:px-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Nama Santri</p>
            <p className="mt-2 break-words text-sm font-semibold text-slate-900">{user?.name || 'Santri Darussunnah'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Semester Aktif</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{reportSummary.latestMeta.semester}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Tahun Akademik</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{reportSummary.latestMeta.academicYear}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Tanggal Cetak</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateLabel(new Date().toISOString())}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Rata-rata Nilai',
            value: formatScore(reportSummary.averageScore),
            icon: <TrendingUp size={18} />,
            accent: 'text-emerald-700 bg-emerald-50 border-emerald-100',
          },
          {
            label: 'Nilai Tertinggi',
            value: formatScore(reportSummary.bestScore),
            icon: <Target size={18} />,
            accent: 'text-sky-700 bg-sky-50 border-sky-100',
          },
          {
            label: 'Total Mapel Dinilai',
            value: String(reportSummary.totalGrades),
            icon: <BookOpen size={18} />,
            accent: 'text-amber-700 bg-amber-50 border-amber-100',
          },
          {
            label: 'Setoran Tahfidz',
            value: String(reportSummary.completedTahfidz),
            icon: <Sparkles size={18} />,
            accent: 'text-fuchsia-700 bg-fuchsia-50 border-fuchsia-100',
          },
        ].map((item) => (
          <div key={item.label} className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${item.accent}`}>
              {item.icon}
            </div>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <section className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Raport Nilai</p>
              <h2 className="mt-2 font-outfit text-2xl font-black tracking-tight text-slate-900">Performa Akademik</h2>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
              {reportSummary.totalGrades} data nilai tercatat
            </div>
          </div>

          <div className="px-5 py-5 lg:px-6">
          {grades.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm font-medium text-slate-500">
              Nilai akademik belum tersedia. Nanti setelah guru atau admin menginput nilai, raport akan tampil di sini.
            </div>
          ) : (
            <div className="space-y-4">
              {grades.map((item) => (
                <div key={item.id} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <p className="break-words text-lg font-semibold text-slate-900">{item.subject_name || '-'}</p>
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{`${item.semester || '-'} - ${item.academic_year || '-'}`}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 md:text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Nilai Akhir</p>
                      <p className="mt-1 text-2xl font-black text-emerald-700">{formatScore(item.final_score)}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">UTS</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">{formatScore(item.uts_score)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">UAS</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">{formatScore(item.uas_score)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Tugas</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">{formatScore(item.task_score)}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[0.75fr_1.25fr]">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Predikat</p>
                      <p className="mt-1 text-sm font-black leading-6 text-slate-900">{item.grade_letter || '-'} - {getLetterPredicate(item.grade_letter)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Deskripsi</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.notes || 'Menunjukkan perkembangan belajar yang baik dan stabil.'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 lg:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Rekap Kehadiran</p>
            <h2 className="mt-2 font-outfit text-2xl font-black tracking-tight text-slate-900">Presensi</h2>
          </div>
          <div className="px-5 py-5 lg:px-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { label: 'Hadir', value: reportSummary.hadir, accent: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                { label: 'Sakit', value: reportSummary.sakit, accent: 'bg-sky-50 text-sky-700 border-sky-100' },
                { label: 'Izin', value: reportSummary.izin, accent: 'bg-amber-50 text-amber-700 border-amber-100' },
                { label: 'Alpha', value: reportSummary.alpha, accent: 'bg-rose-50 text-rose-700 border-rose-100' },
              ].map((item) => (
                <div key={item.label} className={`rounded-xl border p-4 ${item.accent}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">{item.label}</p>
                  <p className="mt-2 text-2xl font-black lg:text-3xl">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 lg:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tahfidz</p>
            <h2 className="mt-2 font-outfit text-2xl font-black tracking-tight text-slate-900">Progres Hafalan</h2>
          </div>
          <div className="px-5 py-5 lg:px-6">

            {tahfidz.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm font-medium text-slate-500">
                Data tahfidz belum tersedia.
              </div>
            ) : (
              <div className="space-y-4">
                {tahfidz.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-slate-900">{item.surah_name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {`Juz ${item.juz || '-'} - Ayat ${item.start_ayat || '-'}-${item.end_ayat || '-'}`}
                        </p>
                      </div>
                      <span className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{item.musyrif_notes || 'Belum ada catatan musyrif.'}</p>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Evaluasi: {formatDateLabel(item.evaluation_date)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start gap-4 border-b border-slate-100 px-5 py-5 lg:px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <FileText size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Catatan Raport</p>
            <h2 className="mt-2 font-outfit text-2xl font-black tracking-tight text-slate-900">Ringkasan Wali Murid</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-2 lg:px-6">
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Akademik</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {grades.length === 0
                ? 'Belum ada data nilai yang bisa ditinjau saat ini.'
                : `Santri telah memiliki ${reportSummary.totalGrades} data nilai dengan rata-rata ${formatScore(reportSummary.averageScore)} dan nilai tertinggi ${formatScore(reportSummary.bestScore)}.`}
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Tahfidz & Kehadiran</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {tahfidz.length === 0
                ? 'Progres tahfidz belum diinput. Rekap kehadiran tetap bisa dipantau dari kartu presensi di atas.'
                : `Terdapat ${reportSummary.completedTahfidz} setoran/progres penting. Update terakhir pada surah ${reportSummary.latestTahfidz?.surah_name || '-'} tanggal ${formatDateLabel(reportSummary.latestTahfidz?.evaluation_date)}.`}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
