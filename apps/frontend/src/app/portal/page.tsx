'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, AlertCircle, CheckCircle2, ChevronRight, CreditCard, FileText, Upload, User, GraduationCap, Wallet, BookOpen } from 'lucide-react';
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
    actionLabel: 'Buka Raport',
    actionHref: '/portal/raport',
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

  const registrationStatus = registration?.status || 'pending';
  const hasStudentAccess = registrationStatus === 'accepted';

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
    const paymentStatus = registration?.payment_status || 'unpaid';
    const paymentNote = registration?.payment_note?.trim() || '';
    const paymentSubmitted = isFilled(registration?.payment_proof_url) && Number(registration?.payment_amount || 0) > 0;
    const paymentRejected = paymentStatus === 'rejected';
    const paymentCompleted = paymentStatus === 'paid';
    const paymentNeedsAttention = !paymentCompleted && (paymentRejected || Boolean(paymentNote));
    const completedSteps = 1 + (biodataCompleted ? 1 : 0) + (documentsCompleted ? 1 : 0) + (paymentCompleted ? 1 : 0);
    const progress = Math.round((completedSteps / 4) * 100);
    const status = normalizeStatus(registration?.status);
    const meta = statusMeta[status];

    const actionHref = !biodataCompleted ? '/portal/biodata' : !documentsCompleted ? '/portal/documents' : !paymentCompleted ? '/portal/payment' : meta.actionHref;
    const actionLabel = !biodataCompleted
      ? 'Lengkapi Biodata'
      : !documentsCompleted
        ? 'Unggah Dokumen'
        : !paymentCompleted
          ? paymentSubmitted
            ? paymentNeedsAttention || paymentRejected
              ? 'Upload Ulang Bukti'
              : 'Cek Pembayaran'
            : 'Bayar Pendaftaran'
          : meta.actionLabel;
    const actionCopy = !biodataCompleted
      ? 'Masih ada biodata inti yang perlu dilengkapi agar panitia bisa memeriksa pendaftaran kamu.'
      : !documentsCompleted
        ? 'Dokumen PSB belum lengkap. Unggah semua berkas agar proses review bisa dimulai.'
        : !paymentCompleted
          ? paymentNeedsAttention || paymentRejected
            ? 'Ada catatan panitia yang perlu ditindaklanjuti. Upload ulang bukti transfer bila diminta.'
            : paymentSubmitted
              ? 'Bukti pembayaran sudah dikirim dan sedang menunggu verifikasi panitia.'
              : 'Kirim bukti transfer biaya pendaftaran agar panitia bisa melanjutkan verifikasi.'
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
        href: '/portal/payment',
        title: 'Bayar Pendaftaran',
        description: paymentCompleted
          ? 'Pembayaran pendaftaran sudah diverifikasi dan dinyatakan lunas.'
          : paymentNeedsAttention || paymentRejected
            ? paymentNote
              ? `Catatan panitia: ${paymentNote}`
              : 'Bukti pembayaran perlu diupload ulang.'
          : paymentSubmitted
            ? 'Bukti pembayaran sudah masuk dan menunggu verifikasi panitia.'
            : 'Isi nominal transfer dan unggah bukti pembayaran pendaftaran.',
        completed: paymentCompleted,
        icon: <CreditCard size={24} />,
      },
    ];

    if (status === 'accepted') {
      checklist.push({
        href: '/portal/exams',
        title: 'Ujian Daring (CBT)',
        description: 'Akses ujian semester, kuis, dan tes akademik secara online.',
        completed: false,
        icon: <GraduationCap size={24} />,
      });
    }

    return {
      status,
      meta,
      biodataCompleted,
      documentsCompleted,
      paymentSubmitted,
      paymentRejected,
      paymentNeedsAttention,
      paymentNote,
      paymentCompleted,
      progress,
      actionHref,
      actionLabel,
      actionCopy,
      checklist,
    };
  }, [registration]);

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

  const studentQuickMenus = [
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
    {
      href: '/portal/exams',
      title: 'CBT & Ujian',
      description: 'Buka ujian online dan tes akademik.',
      icon: <GraduationCap size={20} />,
      accent: 'border-violet-100 bg-violet-50 text-violet-700',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="h-5 w-32 animate-pulse rounded-full bg-slate-100" />
          <div className="h-12 w-3/4 animate-pulse rounded-3xl bg-slate-100" />
          <div className="h-5 w-full animate-pulse rounded-full bg-slate-100" />
          <div className="h-5 w-5/6 animate-pulse rounded-full bg-slate-100" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:col-span-2">
            <div className="h-4 w-32 animate-pulse rounded-full bg-slate-100" />
            <div className="mt-5 h-10 w-4/5 animate-pulse rounded-3xl bg-slate-100" />
            <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-slate-100" />
            <div className="mt-2 h-4 w-3/4 animate-pulse rounded-full bg-slate-100" />
            <div className="mt-8 h-3 w-full animate-pulse rounded-full bg-slate-100" />
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="h-14 w-14 animate-pulse rounded-2xl bg-slate-100" />
            <div className="mt-6 h-6 w-2/3 animate-pulse rounded-full bg-slate-100" />
            <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-slate-100" />
            <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-slate-100" />
            <div className="mt-8 h-12 w-full animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-4 w-24 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-4 h-8 w-2/3 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-slate-100" />
          <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={`loading-card-${index}`} className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
                <div className="h-12 w-12 animate-pulse rounded-2xl bg-white" />
                <div className="mt-4 h-5 w-1/2 animate-pulse rounded-full bg-white" />
                <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-white" />
                <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-white" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h3 className="mb-2 font-outfit text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl">
          Ahlan Wa Sahlan, <br /> <span className="text-blue-600">{user?.name || registration?.full_name || 'Calon Santri'}</span>
        </h3>
        <p className="text-lg text-slate-500">
          {hasStudentAccess
            ? 'Akunmu sudah masuk tahap santri aktif. Gunakan portal ini untuk memantau layanan harian dan data akademik.'
            : 'Pantau progres pendaftaran PSB dan pastikan semua data kamu sudah lengkap.'}
        </p>
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

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {portalState.checklist.slice(0, 4).map((item) => {
                const isAttentionPaymentStep = item.title === 'Bayar Pendaftaran' && portalState.paymentNeedsAttention;
                return (
                  <div
                    key={`status-progress-${item.title}`}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur ${
                      item.completed
                        ? 'border-white/30 bg-white/20'
                        : isAttentionPaymentStep
                          ? 'border-rose-200 bg-white text-rose-800 shadow-lg shadow-rose-950/20'
                          : 'border-white/15 bg-slate-950/15'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        item.completed
                          ? 'bg-white text-emerald-600'
                          : isAttentionPaymentStep
                            ? 'bg-rose-600 text-white'
                            : 'bg-white/10 text-white/80'
                      }`}
                    >
                      {item.completed ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
                    </span>
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-black leading-tight ${isAttentionPaymentStep ? 'text-rose-950' : 'text-white'}`}>{item.title}</p>
                      <p className={`mt-0.5 text-[10px] font-black uppercase tracking-[0.16em] ${isAttentionPaymentStep ? 'text-rose-600' : 'text-white/70'}`}>
                        {item.completed ? 'Selesai' : isAttentionPaymentStep ? 'Perlu diperbaiki' : 'Belum selesai'}
                      </p>
                    </div>
                  </div>
                );
              })}
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
          {portalState.paymentNeedsAttention && portalState.paymentNote ? (
            <div className="mb-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-rose-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 shrink-0 text-rose-600" size={18} />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-600">Catatan Panitia</p>
                  <p className="mt-1 text-sm font-black leading-6 text-rose-950">{portalState.paymentNote}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-rose-700">
                    Upload ulang bukti transfer agar panitia bisa memverifikasi pembayaran.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <Link
            href={portalState.actionHref}
            className="w-full rounded-xl border-2 border-amber-200 bg-white py-4 text-center text-xs font-bold uppercase tracking-widest text-amber-700 transition-colors hover:border-amber-300 hover:bg-amber-50"
          >
            {portalState.actionLabel}
          </Link>
        </div>

        {hasStudentAccess ? (
          <div className="md:col-span-3 rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50/70 to-blue-50/40 p-5 shadow-sm md:p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">Akses Santri</p>
                <h4 className="mt-2 font-outfit text-2xl font-black uppercase tracking-tight text-slate-900">
                  Presensi & Dompet
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
        ) : null}
      </div>

      {hasStudentAccess ? (
        <div className="mb-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Akses Santri</p>
              <h4 className="mt-2 font-outfit text-2xl font-black uppercase tracking-tight text-slate-900">
                Raport, Dompet, dan Ujian
              </h4>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Pilih layanan yang ingin dibuka dari portal santri aktif.
              </p>
            </div>
            <div className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Santri aktif
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {studentQuickMenus.map((item) => (
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
      ) : null}

      {!hasStudentAccess ? (
      <div className="mb-10">
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

      </div>
      ) : null}

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
