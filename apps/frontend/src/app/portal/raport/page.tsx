'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Download, Eye, FileText, Info, Printer, RefreshCw, ScrollText, Sparkles, Target, TrendingUp, X } from 'lucide-react';
import { getMyAcademicGrades, getMyArbain, getMyAttendanceSummary, getMyTahfidz, getMyRaport, getActiveAcademicYear, currentSemester, type ArbainProgress, type Grade, type TahfidzProgress, type ComputedRaport } from '@/lib/api';
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
  const [arbain, setArbain] = useState<ArbainProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [eraport, setEraport] = useState<ComputedRaport | null>(null);
  const [showFormula, setShowFormula] = useState(false);

  useEffect(() => {
    if (!showFormula) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowFormula(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showFormula]);

  useEffect(() => {
    const fetchAcademicData = async () => {
      setIsLoading(true);
      try {
        const [activeYear, activeSemester] = await Promise.all([
          getActiveAcademicYear(),
          Promise.resolve(currentSemester()),
        ]);
        const [gradesData, attendanceData, tahfidzData, eraData, arbainData] = await Promise.all([
          getMyAcademicGrades(),
          getMyAttendanceSummary(),
          getMyTahfidz(),
          getMyRaport(activeSemester, activeYear),
          getMyArbain().catch(() => ({ progress: [], summary: { total: 0, status: {} } })),
        ]);

        setGrades(gradesData);
        setAttendanceSummary(attendanceData);
        setTahfidz(tahfidzData);
        setEraport(eraData);
        setArbain(arbainData.progress || []);
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

      {eraport && !eraport.is_complete && (
        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-800">
          Rapor semester ini belum lengkap — menunggu penilaian: {((eraport as { missing?: string[] }).missing || []).join(', ')}. Nilai akhir muncul setelah semua dinilai.
        </div>
      )}

      {eraport && (
        <section className="overflow-hidden rounded-[1.5rem] border border-emerald-200 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 shadow-lg shadow-emerald-700/20 print:shadow-none">
          <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-100">Nilai Akhir LMS · DARUSSUNNAH</p>
              <h2 className="mt-1 font-outfit text-lg font-black tracking-tight text-white">
                E-Raport {eraport.semester === '1' ? 'Semester Ganjil' : 'Semester Genap'} · TA {eraport.academic_year}
              </h2>
              <button
                type="button"
                onClick={() => setShowFormula(true)}
                aria-label="Lihat cara hitung Nilai Akhir"
                aria-haspopup="dialog"
                className="mt-2 inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <Info size={14} /> Cara hitung nilai?
              </button>
            </div>
            <div className="rounded-2xl bg-white/10 px-5 py-3 text-center ring-1 ring-white/20">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100">Nilai Akhir</p>
              <p className="text-2xl font-black text-white">{eraport.is_complete ? eraport.final_score?.toFixed(2) : '\u2013'}</p>
              <span className="mt-1 inline-block rounded-full bg-white px-2.5 py-0.5 text-[11px] font-black text-emerald-800">{eraport.is_complete ? eraport.predikat : 'Belum lengkap'}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 border-t border-white/10 px-5 py-4 sm:grid-cols-3 lg:px-6">
            {[
              { label: 'Mata Pelajaran', value: eraport.mapel_score, missing: ((eraport as { missing?: string[] }).missing || []).some(m => m.toLowerCase().includes('mapel')) },
              { label: 'Project (QNS)', value: eraport.project_score, missing: ((eraport as { missing?: string[] }).missing || []).some(m => m.toLowerCase().includes('project')) },
              { label: 'Kesantrian', value: eraport.kesantrian_score, missing: ((eraport as { missing?: string[] }).missing || []).some(m => m.toLowerCase().includes('kesantrian')) },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">{item.label}</p>
                <p className="mt-0.5 text-lg font-black text-white">{item.missing ? '\u2013' : Number(item.value || 0).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {showFormula && eraport && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setShowFormula(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="formula-title"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">Penjelasan untuk Wali</p>
                <h3 id="formula-title" className="mt-1 font-outfit text-xl font-black tracking-tight text-slate-900">
                  Dari mana Nilai Akhir berasal?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFormula(false)}
                aria-label="Tutup penjelasan"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Nilai Akhir putra/putri Bapak/Ibu adalah <strong className="text-slate-900">gabungan 3 nilai</strong> berikut ini:
            </p>
            <ul className="mt-4 space-y-3">
              {[
                { name: 'Mata Pelajaran', desc: 'Rata-rata nilai semua mapel semester ini.', tint: 'bg-emerald-50 text-emerald-700' },
                { name: 'Project', desc: 'Rata-rata nilai kegiatan project yang sudah dinilai.', tint: 'bg-emerald-50 text-emerald-700' },
                { name: 'Kesantrian', desc: 'Rata-rata aspek adab, ibadah, disiplin, dan kemandirian yang sudah dinilai.', tint: 'bg-amber-50 text-amber-700' },
              ].map((row) => (
                <li key={row.name} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5">
                  <span>
                    <span className="block text-sm font-bold text-slate-900">{row.name}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-500">{row.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-600">Contoh hitung semester ini</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">
                ({Number(eraport.mapel_score || 0).toFixed(1)} + {Number(eraport.project_score || 0).toFixed(1)} + {Number(eraport.kesantrian_score || 0).toFixed(1)}) ÷ 3
                {' = '}{eraport.is_complete ? eraport.final_score?.toFixed(2) : 'belum lengkap'}
                <span className="mt-1 block text-xs font-normal text-slate-500">Predikat ikut KKM 75: A ≥ 90, B 80-89, C 75-79, D &lt; 75. Komponen yang belum dinilai tidak ikut dihitung.</span>
              </p>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              Bobot tiap bagian sudah ditentukan oleh sekolah. Predikat kelulusan: {eraport.predikat}.
            </p>
            <button
              type="button"
              onClick={() => setShowFormula(false)}
              className="mt-5 min-h-[44px] w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

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
            accent: 'text-emerald-700 bg-emerald-50 border-emerald-100',
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

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Ulangan Harian</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">{formatScore(item.uh_score)}</p>
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
                { label: 'Sakit', value: reportSummary.sakit, accent: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
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
                      {item.academic_year && <> · Semester {item.semester === '1' ? 'Ganjil' : 'Genap'} TA {item.academic_year}</>}
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
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <ScrollText size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Hadis Arbain</p>
            <h2 className="mt-2 font-outfit text-2xl font-black tracking-tight text-slate-900">Setoran 42 Hadis Imam Nawawi</h2>
          </div>
        </div>
        <div className="px-5 py-5 lg:px-6">
          {arbain.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm font-medium text-slate-500">
              Setoran Hadis Arbain belum diinput oleh ustadz.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { label: 'Total Setoran', value: arbain.length, tone: 'border-slate-200 bg-slate-50 text-slate-900' },
                  { label: 'Lulus', value: arbain.filter((i) => i.status === 'lulus').length, tone: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
                  { label: 'Setor', value: arbain.filter((i) => i.status === 'setor').length, tone: 'border-amber-100 bg-amber-50 text-amber-700' },
                  { label: 'Proses', value: arbain.filter((i) => i.status === 'proses').length, tone: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
                ].map((card) => (
                  <div key={card.label} className={`rounded-xl border p-4 ${card.tone}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">{card.label}</p>
                    <p className="mt-2 text-2xl font-black">{card.value}</p>
                  </div>
                ))}
              </div>
              {arbain.map((item) => (
                <div key={item.id} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-slate-900">{item.hadith_number}. {item.hadith_title || 'Hadis Arbain'}</p>
                      {item.translation && <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.translation}</p>}
                      {item.notes && <p className="mt-2 text-sm italic text-slate-500">Catatan ustadz: {item.notes}</p>}
                      {item.source && <p className="mt-2 text-[11px] font-semibold text-slate-400">{item.source}</p>}
                    </div>
                    <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                      <span className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                        {item.status}
                      </span>
                      <span className="text-sm font-black text-slate-700">Nilai {item.nilai ?? 0}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Evaluasi: {formatDateLabel(item.evaluation_date)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

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

