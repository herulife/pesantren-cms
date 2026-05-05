'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, AlertCircle, CheckCircle2, ChevronRight, FileText, RefreshCw, Upload, User, GraduationCap, Wallet, BookOpen } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import StudentQRCard from '@/components/StudentQRCard';
import WalletCard from '@/components/WalletCard';
import { getMyPSBRegistration, type Registration } from '@/lib/api';

type ChecklistItem = {
  href?: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ReactNode;
};

const statusMeta: Record<string, { title: string; description: string; accent: string; actionLabel: string; actionHref: string }> = {
  pending: {
    title: 'Pendaftaran Sedang Disiapkan',
    description: 'Lengkapi biodata dan dokumen agar panitia bisa mulai memeriksa berkas pendaftaran kamu.',
    accent: 'from-amber-500 to-orange-600',
    actionLabel: 'Lengkapi Sekarang',
    actionHref: '/portal/biodata',
  },
  review: {
    title: 'Berkas Sedang Direview',
    description: 'Panitia sedang memeriksa biodata dan dokumen yang sudah kamu kirim. Pantau portal secara berkala.',
    accent: 'from-blue-600 to-cyan-600',
    actionLabel: 'Lihat Dokumen',
    actionHref: '/portal/documents',
  },
  accepted: {
    title: 'Pendaftaran Diterima',
    description: 'Selamat, berkas kamu sudah dinyatakan diterima. Ikuti arahan panitia untuk langkah berikutnya.',
    accent: 'from-emerald-600 to-green-600',
    actionLabel: 'Lihat Biodata',
    actionHref: '/portal/biodata',
  },
  rejected: {
    title: 'Perlu Perbaikan Berkas',
    description: 'Pendaftaran belum bisa dilanjutkan. Silakan periksa kembali data dan dokumen lalu hubungi panitia bila perlu.',
    accent: 'from-rose-600 to-red-600',
    actionLabel: 'Periksa Biodata',
    actionHref: '/portal/biodata',
  },
};

function isFilled(value?: string | null) {
  return Boolean(value && value.trim());
}

function normalizeStatus(status?: string | null) {
  if (!status) return 'pending';
  if (statusMeta[status]) return status;
  return 'pending';
}

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

export default function PortalDashboard() {
  const { user } = useAuth();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const portalState = useMemo(() => {
    const biodataFields = [
      registration?.full_name,
      registration?.gender,
      registration?.nik,
      registration?.birth_place,
      registration?.birth_date,
      registration?.address,
      registration?.school_origin,
      registration?.program_choice,
      registration?.father_name,
      registration?.father_job,
      registration?.father_phone,
      registration?.mother_name,
      registration?.mother_job,
      registration?.mother_phone,
    ];

    const documentFields = [registration?.kk_url, registration?.ijazah_url, registration?.pasfoto_url];

    const biodataCompleted = biodataFields.every(isFilled);
    const documentsCompleted = documentFields.every(isFilled);
    const completedSteps = 1 + (biodataCompleted ? 1 : 0) + (documentsCompleted ? 1 : 0);
    const progress = Math.round((completedSteps / 3) * 100);
    const status = normalizeStatus(registration?.status);
    const meta = statusMeta[status];

    const actionHref = !biodataCompleted ? '/portal/biodata' : !documentsCompleted ? '/portal/documents' : meta.actionHref;
    const actionLabel = !biodataCompleted ? 'Lengkapi Biodata' : !documentsCompleted ? 'Unggah Dokumen' : meta.actionLabel;
    const actionCopy = !biodataCompleted
      ? 'Masih ada biodata inti yang perlu dilengkapi agar panitia bisa memeriksa pendaftaran kamu.'
      : !documentsCompleted
        ? 'Dokumen PSB belum lengkap. Unggah semua berkas agar proses review bisa dimulai.'
        : meta.description;

    const checklist: ChecklistItem[] = [
      {
        title: 'Pembuatan Akun Portal',
        description: 'Akun portal sudah aktif dan siap dipakai untuk mengelola pendaftaran PSB.',
        completed: true,
        icon: <CheckCircle2 size={24} />,
      },
      {
        href: '/portal/biodata',
        title: 'Kelengkapan Biodata',
        description: biodataCompleted
          ? 'Biodata calon santri dan orang tua sudah tersimpan dengan baik.'
          : 'Lengkapi data calon santri dan data orang tua agar pendaftaran bisa diproses.',
        completed: biodataCompleted,
        icon: <User size={24} />,
      },
      {
        href: '/portal/documents',
        title: 'Unggah Dokumen',
        description: documentsCompleted
          ? 'Dokumen KK, ijazah/raport, dan pas foto sudah tersimpan.'
          : 'Unggah KK, ijazah atau raport terakhir, dan pas foto terbaru.',
        completed: documentsCompleted,
        icon: <Upload size={24} />,
      },
      {
        href: '/portal/exams',
        title: 'Ujian Daring (CBT)',
        description: 'Akses ujian semester, kuis, dan tes akademik secara online.',
        completed: false, // Always show as actionable
        icon: <GraduationCap size={24} />,
      },
    ];

    return {
      status,
      meta,
      biodataCompleted,
      documentsCompleted,
      progress,
      actionHref,
      actionLabel,
      actionCopy,
      checklist,
    };
  }, [registration]);

  const missingBiodataItems = [
    !isFilled(registration?.full_name) ? 'Nama lengkap calon santri' : null,
    !isFilled(registration?.gender) ? 'Jenis kelamin' : null,
    !isFilled(registration?.nik) ? 'NIK calon santri' : null,
    !isFilled(registration?.birth_place) ? 'Tempat lahir' : null,
    !isFilled(registration?.birth_date) ? 'Tanggal lahir' : null,
    !isFilled(registration?.address) ? 'Alamat lengkap' : null,
    !isFilled(registration?.school_origin) ? 'Asal sekolah' : null,
    !isFilled(registration?.program_choice) ? 'Pilihan program' : null,
    !isFilled(registration?.father_name) ? 'Nama ayah' : null,
    !isFilled(registration?.father_job) ? 'Pekerjaan ayah' : null,
    !isFilled(registration?.father_phone) ? 'No. HP ayah' : null,
    !isFilled(registration?.mother_name) ? 'Nama ibu' : null,
    !isFilled(registration?.mother_job) ? 'Pekerjaan ibu' : null,
    !isFilled(registration?.mother_phone) ? 'No. HP ibu' : null,
  ].filter(Boolean) as string[];

  const missingDocumentItems = [
    !isFilled(registration?.kk_url) ? 'Kartu Keluarga (KK)' : null,
    !isFilled(registration?.ijazah_url) ? 'Ijazah / raport terakhir' : null,
    !isFilled(registration?.pasfoto_url) ? 'Pas foto 3x4' : null,
  ].filter(Boolean) as string[];

  const completedItems = [
    'Akun portal sudah aktif',
    ...(portalState.biodataCompleted ? ['Biodata PSB sudah lengkap'] : []),
    ...(portalState.documentsCompleted ? ['Dokumen persyaratan sudah lengkap'] : []),
    ...(portalState.status === 'review' ? ['Berkas sedang direview panitia'] : []),
    ...(portalState.status === 'accepted' ? ['Pendaftaran sudah diterima'] : []),
  ];

  const biodataSummary = [
    { label: 'Nama Lengkap', value: registration?.full_name || user?.name || '-' },
    { label: 'NIK', value: registration?.nik || '-' },
    { label: 'Program Pilihan', value: registration?.program_choice || '-' },
    { label: 'Asal Sekolah', value: registration?.school_origin || '-' },
    { label: 'Ayah', value: registration?.father_name || '-' },
    { label: 'Ibu', value: registration?.mother_name || '-' },
  ];

  const documentSummary = [
    { label: 'Kartu Keluarga', uploaded: isFilled(registration?.kk_url) },
    { label: 'Ijazah / Raport', uploaded: isFilled(registration?.ijazah_url) },
    { label: 'Pas Foto', uploaded: isFilled(registration?.pasfoto_url) },
  ];

  const quickMenus = [
    {
      href: '/portal/biodata',
      title: 'Lengkapi Biodata',
      description: 'Isi data calon santri dan orang tua.',
      icon: <User size={20} />,
      accent: 'border-blue-100 bg-blue-50 text-blue-700',
    },
    {
      href: '/portal/documents',
      title: 'Unggah Dokumen',
      description: 'Kirim KK, ijazah, raport, dan pas foto.',
      icon: <Upload size={20} />,
      accent: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    },
    {
      href: '/portal/raport',
      title: 'Raport Akademik',
      description: 'Cek nilai, tahfidz, dan kehadiran.',
      icon: <BookOpen size={20} />,
      accent: 'border-amber-100 bg-amber-50 text-amber-700',
    },
    {
      href: '/portal/wallet',
      title: 'Darussunnah Pay',
      description: 'Pantau saldo dan mutasi dompet santri.',
      icon: <Wallet size={20} />,
      accent: 'border-slate-200 bg-slate-100 text-slate-700',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <RefreshCw className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h3 className="mb-2 font-outfit text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl">
          Ahlan Wa Sahlan, <br /> <span className="text-blue-600">{user?.name || registration?.full_name || 'Calon Santri'}</span>
        </h3>
        <p className="text-lg text-slate-500">Pantau progres pendaftaran PSB dan pastikan semua data kamu sudah lengkap.</p>
      </div>

      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${portalState.meta.accent} p-8 text-white shadow-xl md:col-span-2`}>
          <div className="absolute right-0 top-0 h-64 w-64 -mr-20 -mt-20 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                <Activity size={12} /> Status Pendaftaran
              </span>
              <h4 className="mb-2 text-2xl font-black uppercase tracking-tight">{portalState.meta.title}</h4>
              <p className="max-w-sm text-sm leading-relaxed text-white/80">{portalState.meta.description}</p>
            </div>

            <div className="mt-8">
              <div className="mb-2 flex items-end justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-white/70">Progress Penyelesaian</span>
                <span className="text-2xl font-black">{portalState.progress}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full border border-white/20 bg-slate-950/20">
                <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${portalState.progress}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-sm">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <AlertCircle size={28} />
          </div>
          <h4 className="mb-2 font-outfit text-lg font-black uppercase tracking-tight text-slate-800">Tindakan Berikutnya</h4>
          <p className="mb-6 flex-1 text-sm text-slate-500">{portalState.actionCopy}</p>

          <Link
            href={portalState.actionHref}
            className="w-full rounded-xl border-2 border-amber-200 bg-white py-4 text-center text-xs font-bold uppercase tracking-widest text-amber-700 transition-colors hover:border-amber-300 hover:bg-amber-50"
          >
            {portalState.actionLabel}
          </Link>
        </div>

        <div className="md:col-span-3 rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50/70 to-blue-50/40 p-5 shadow-sm md:p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">Akses Cepat</p>
              <h4 className="mt-2 font-outfit text-2xl font-black uppercase tracking-tight text-slate-900">
                Presensi & Dompet Santri
              </h4>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Gunakan QR presensi untuk scan kehadiran dan pantau saldo Darussunnah Pay dari satu area yang lebih ringkas.
              </p>
            </div>
            <div className="inline-flex w-fit rounded-full border border-blue-100 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 shadow-sm">
              Live tools untuk akses harian
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 md:items-start xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:items-stretch">
            <StudentQRCard />
            <div className="md:h-full">
              <WalletCard />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Menu Cepat</p>
            <h4 className="mt-2 font-outfit text-2xl font-black uppercase tracking-tight text-slate-900">
              Pilih Tujuan Dengan Cepat
            </h4>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Supaya tidak bingung, gunakan blok ini untuk langsung masuk ke menu utama yang paling sering dipakai.
            </p>
          </div>
          <div className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            Shortcut portal
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickMenus.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
            >
              <div className={`inline-flex rounded-2xl border px-3 py-3 ${item.accent}`}>
                {item.icon}
              </div>
              <h5 className="mt-4 font-bold text-slate-900 transition-colors group-hover:text-blue-700">{item.title}</h5>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors group-hover:text-blue-600">
                Buka Menu
                <ChevronRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <h4 className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 text-sm font-bold uppercase tracking-widest text-slate-800">
        <FileText className="text-slate-400" size={18} />
        Daftar Tugas
      </h4>

      <div className="mb-10 space-y-4">
        {portalState.checklist.map((item, index) => {
          const cardClasses = item.completed
            ? 'border-emerald-100 bg-white shadow-sm'
            : 'border-slate-200 bg-white shadow-sm hover:border-blue-300';
          const iconClasses = item.completed
            ? 'bg-emerald-50 text-emerald-500'
            : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500';

          const content = (
            <>
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${iconClasses}`}>
                  {item.icon}
                </div>
                <div>
                  <h5 className={`font-bold transition-colors ${item.completed ? 'text-slate-900' : 'text-slate-900 group-hover:text-blue-700'}`}>
                    {item.title}
                  </h5>
                  <p className="mt-1 max-w-sm text-xs text-slate-500">{item.description}</p>
                </div>
              </div>

              {item.completed ? (
                <span className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                  Selesai
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="hidden text-[10px] font-black uppercase tracking-widest text-slate-400 md:inline">
                    Langkah {index + 1}
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all group-hover:bg-blue-600 group-hover:text-white">
                    <ChevronRight size={20} />
                  </span>
                </div>
              )}
            </>
          );

          if (item.href && !item.completed) {
            return (
              <Link
                key={item.title}
                href={item.href}
                className={`group flex items-center justify-between gap-5 rounded-[1.5rem] border p-6 transition-colors ${cardClasses}`}
              >
                {content}
              </Link>
            );
          }

          return (
            <div key={item.title} className={`flex items-center justify-between gap-5 rounded-[1.5rem] border p-6 ${cardClasses}`}>
              {content}
            </div>
          );
        })}
      </div>

      <div className="mb-10 grid grid-cols-1 gap-6">
        <div className="rounded-[2rem] border border-emerald-100 bg-white p-8 shadow-sm">
          <div className="mb-5">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-600">Yang Sudah Selesai</p>
            <h4 className="mt-2 font-outfit text-xl font-black uppercase tracking-tight text-slate-900">Progress Pendaftaran</h4>
          </div>
          <div className="space-y-3">
            {completedItems.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-900">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-amber-100 bg-white p-8 shadow-sm">
          <div className="mb-5">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-600">Yang Masih Kurang</p>
            <h4 className="mt-2 font-outfit text-xl font-black uppercase tracking-tight text-slate-900">Checklist Yang Perlu Dilengkapi</h4>
          </div>

          {missingBiodataItems.length === 0 && missingDocumentItems.length === 0 ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-900">
              Semua data inti dan dokumen utama sudah lengkap. Tinggal menunggu proses panitia.
            </div>
          ) : (
            <div className="space-y-5">
              {missingBiodataItems.length > 0 ? (
                <div>
                  <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Biodata</div>
                  <div className="space-y-2">
                    {missingBiodataItems.map((item) => (
                      <div key={item} className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {missingDocumentItems.length > 0 ? (
                <div>
                  <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Dokumen</div>
                  <div className="space-y-2">
                    {missingDocumentItems.map((item) => (
                      <div key={item} className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h4 className="font-outfit text-xl font-black uppercase tracking-tight text-slate-900">Ringkasan Biodata</h4>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                Cek kembali data inti calon santri dan orang tua sebelum panitia menyelesaikan proses verifikasi.
              </p>
            </div>
            <Link
              href="/portal/biodata"
              className="inline-flex w-full items-center justify-center rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-blue-700 transition-colors hover:bg-blue-100 md:w-auto md:shrink-0"
            >
              Edit Biodata
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {biodataSummary.map((item) => (
              <div key={item.label} className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                <p
                  className={`min-h-[3rem] break-words text-sm font-bold leading-relaxed ${
                    item.value === '-' ? 'text-slate-400' : 'text-slate-800'
                  }`}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-xs font-medium text-slate-500">
            Terakhir diperbarui: <span className="font-bold text-slate-700">{formatDateLabel(registration?.updated_at)}</span>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h4 className="font-outfit text-xl font-black uppercase tracking-tight text-slate-900">Ringkasan Dokumen</h4>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                Pastikan semua dokumen penting sudah terunggah agar proses review berjalan lancar.
              </p>
            </div>
            <Link
              href="/portal/documents"
              className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-700 transition-colors hover:bg-emerald-100 md:w-auto md:shrink-0"
            >
              Kelola Dokumen
            </Link>
          </div>

          <div className="space-y-4">
            {documentSummary.map((item) => (
              <div key={item.label} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.uploaded ? 'Dokumen sudah tersimpan di akun PSB kamu.' : 'Dokumen ini masih perlu diunggah.'}
                  </p>
                </div>
                <span
                  className={`inline-flex w-fit rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest ${
                    item.uploaded
                      ? 'border border-emerald-100 bg-emerald-50 text-emerald-600'
                      : 'border border-amber-100 bg-amber-50 text-amber-600'
                  }`}
                >
                  {item.uploaded ? 'Sudah Ada' : 'Belum Ada'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
