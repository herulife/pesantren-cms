'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Eye,
  Receipt,
  Landmark,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import KwitansiModal, { type KwitansiTx } from '@/components/KwitansiModal';
import ProofImage, { openProofInNewTab } from '@/components/ProofImage';
import {
  getMyPSBRegistration,
  getMyPSBReceipt,
  getPublicSettingsMap,
  resolveDisplayImageUrl,
  saveMyPSBPayment,
  uploadImage,
  type Registration,
  type SettingsMap,
} from '@/lib/api';

type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'rejected';

function isFilled(value?: string | null) {
  return Boolean(value && value.trim());
}

function normalizePaymentStatus(status?: string | null): PaymentStatus {
  if (status === 'pending' || status === 'paid' || status === 'rejected') return status;
  return 'unpaid';
}

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

const paymentStatusMeta: Record<PaymentStatus, { label: string; title: string; description: string; className: string }> = {
  unpaid: {
    label: 'Belum Bayar',
    title: 'Upload Bukti Pembayaran Pendaftaran',
    description: 'Lengkapi nominal, tanggal transfer, lalu unggah bukti pembayaran agar panitia bisa melakukan verifikasi.',
    className: 'border-slate-200 bg-slate-50 text-slate-700',
  },
  pending: {
    label: 'Menunggu Verifikasi',
    title: 'Bukti Pembayaran Sedang Dicek',
    description: 'Bukti pembayaran sudah masuk. Panitia akan memeriksa nominal dan bukti transfer yang kamu kirim.',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  paid: {
    label: 'Lunas',
    title: 'Pembayaran Sudah Diverifikasi',
    description: 'Pembayaran pendaftaran sudah dinyatakan lunas. Kamu bisa memantau status pendaftaran dari dashboard portal.',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  rejected: {
    label: 'Perlu Upload Ulang',
    title: 'Bukti Pembayaran Perlu Diperbaiki',
    description: 'Panitia belum bisa memverifikasi bukti pembayaran. Periksa catatan, lalu upload ulang bukti yang benar.',
    className: 'border-rose-100 bg-rose-50 text-rose-700',
  },
};

export default function PortalPaymentPage() {
  const { showToast } = useToast();
  const hasShownRejectedNotice = useRef(false);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('success', `${label} disalin.`);
    } catch {
      showToast('error', 'Gagal menyalin otomatis. Salin manual dari teks di atas.');
    }
  };
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayDate());
  const [proofUrl, setProofUrl] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [settings, setSettings] = useState<SettingsMap>({});
  const [selectedProofFile, setSelectedProofFile] = useState<File | null>(null);
  const [receipt, setReceipt] = useState<KwitansiTx | null>(null);
  const [showKwitansi, setShowKwitansi] = useState(false);

  const toKwitansiTx = (r: {
    code: string;
    paid_at: string;
    santri_name?: string | null;
    amount: number;
    method: string;
  }): KwitansiTx => ({
    code: r.code,
    date: r.paid_at,
    santri_name: r.santri_name || registration?.full_name,
    description: 'Biaya Pendaftaran PSB',
    amount: r.amount,
    method: r.method,
  });

  const loadReceipt = async () => {
    try {
      const r = await getMyPSBReceipt();
      if (!r) {
        showToast('error', 'Kwitansi belum tersedia.');
        return;
      }
      setReceipt(toKwitansiTx(r));
      setShowKwitansi(true);
    } catch {
      showToast('error', 'Gagal memuat kwitansi.');
    }
  };

  useEffect(() => {
    const fetchRegistration = async () => {
      setIsLoading(true);
      try {
        const [data, publicSettings] = await Promise.all([getMyPSBRegistration(), getPublicSettingsMap()]);
        const configuredAmount = Number(publicSettings.psb_payment_amount || 0);
        setRegistration(data);
        setSettings(publicSettings);
        setAmount(data?.payment_amount ? String(data.payment_amount) : configuredAmount > 0 ? String(configuredAmount) : '');
        setPaymentDate(data?.payment_date || getTodayDate());
        setProofUrl(data?.payment_proof_url || '');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchRegistration();
  }, []);

  const biodataCompleted = [
    registration?.full_name,
    registration?.gender,
    registration?.nik,
    registration?.birth_place,
    registration?.birth_date,
    registration?.address,
    registration?.school_origin,
    registration?.father_name,
    registration?.father_job,
    registration?.father_phone,
    registration?.mother_name,
    registration?.mother_job,
    registration?.mother_phone,
  ].every(isFilled);
  const requiredDocs = [
    registration?.kk_url, registration?.ijazah_url, registration?.pasfoto_url,
    ...(registration?.category === 'yatim' ? [registration?.yatim_doc_url] : []),
    ...(registration?.category === 'dhuafa' ? [registration?.sktm_doc_url] : []),
  ];
  const documentsCompleted = requiredDocs.every(isFilled);
  const canUploadPayment = biodataCompleted && documentsCompleted;
  const paymentStatus = normalizePaymentStatus(registration?.payment_status);
  const statusMeta = paymentStatusMeta[paymentStatus];
  const proofDisplayUrl = resolveDisplayImageUrl(proofUrl);
  const isLocked = paymentStatus === 'paid';
  const isPaymentRejected = paymentStatus === 'rejected';
  const paymentNote = registration?.payment_note?.trim() || '';
  const hasPaymentWarning = !isLocked && (isPaymentRejected || Boolean(paymentNote));
  const visibleStatusMeta = hasPaymentWarning
      ? {
          label: 'Perlu Tindakan',
          title: 'Catatan Panitia Perlu Ditindaklanjuti',
          description: 'Periksa catatan panitia di bawah ini, lalu upload ulang bukti transfer bila diminta.',
        className: 'border-amber-200 bg-amber-50 text-amber-900',
      }
    : statusMeta;
  const configuredBankName = settings.psb_payment_bank_name?.trim() || '';
  const configuredAccountNumber = settings.psb_payment_account_number?.trim() || '';
  const configuredAccountName = settings.psb_payment_account_name?.trim() || '';
  const configuredPaymentNote = settings.psb_payment_note?.trim() || '';
  const configuredWaHref = settings.psb_page_wa?.trim() || '';
  const configuredInstructions = settings.psb_payment_instructions?.trim() || '';
  const configuredAmount = Number(settings.psb_payment_amount || 0);
  const hasBankInfo = Boolean(configuredBankName || configuredAccountNumber || configuredAccountName || configuredAmount > 0);
  const parsedAmount = Number(amount);
  const amountAndDateCompleted = Number.isFinite(parsedAmount) && parsedAmount > 0 && Boolean(paymentDate);
  const proofReady = Boolean(selectedProofFile || proofUrl);
  const proofSent = Boolean(proofUrl) && !selectedProofFile && (paymentStatus === 'pending' || paymentStatus === 'paid') && !hasPaymentWarning;
  const canSubmitPayment =
    canUploadPayment &&
    !isLocked &&
    amountAndDateCompleted &&
    Boolean(selectedProofFile || (proofUrl && !hasPaymentWarning));
  const paymentSteps = [
    {
      title: 'Biodata',
      description: biodataCompleted ? 'Biodata sudah lengkap.' : 'Lengkapi biodata calon santri.',
      completed: biodataCompleted,
    },
    {
      title: 'Dokumen',
      description: documentsCompleted ? 'Dokumen wajib sudah lengkap.' : 'Unggah dokumen wajib terlebih dahulu.',
      completed: documentsCompleted,
    },
    {
      title: 'Nominal & Tanggal',
      description: amountAndDateCompleted ? 'Nominal dan tanggal transfer sudah diisi.' : 'Isi nominal dan tanggal transfer.',
      completed: amountAndDateCompleted,
    },
    {
      title: 'Bukti Transfer',
      description: selectedProofFile ? 'Bukti baru sudah dipilih.' : proofUrl ? 'Bukti transfer sudah tersimpan.' : 'Pilih foto bukti transfer.',
      completed: proofReady,
    },
    {
      title: 'Kirim ke Panitia',
      description: proofSent ? 'Bukti sedang menunggu verifikasi panitia.' : 'Klik tombol kirim setelah bukti dipilih.',
      completed: proofSent || paymentStatus === 'paid',
    },
  ];

  useEffect(() => {
    if (paymentStatus !== 'pending') return;
    const id = window.setInterval(() => {
      void getMyPSBRegistration()
        .then((data) => setRegistration(data))
        .catch(() => undefined);
    }, 30000);
    return () => window.clearInterval(id);
  }, [paymentStatus]);

  useEffect(() => {
    if (hasPaymentWarning && paymentNote && !hasShownRejectedNotice.current) {
      hasShownRejectedNotice.current = true;
      showToast('error', `Catatan panitia: ${paymentNote}`);
    }
  }, [hasPaymentWarning, paymentNote, showToast]);

  const handleProofSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSuccessMessage('');
    if (!canUploadPayment) {
      showToast('error', 'Lengkapi biodata dan dokumen terlebih dahulu.');
      event.target.value = '';
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      showToast('error', 'Isi nominal pembayaran terlebih dahulu.');
      event.target.value = '';
      return;
    }
    if (!paymentDate) {
      showToast('error', 'Isi tanggal pembayaran terlebih dahulu.');
      event.target.value = '';
      return;
    }

    setSelectedProofFile(file);
    showToast('info', 'Bukti transfer sudah dipilih. Klik Kirim Bukti Pembayaran untuk mengirim ke panitia.');
    event.target.value = '';
  };

  const handleSubmitPayment = async () => {
    setSuccessMessage('');
    if (!canUploadPayment) {
      showToast('error', 'Lengkapi biodata dan dokumen terlebih dahulu.');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      showToast('error', 'Isi nominal pembayaran terlebih dahulu.');
      return;
    }
    if (!paymentDate) {
      showToast('error', 'Isi tanggal pembayaran terlebih dahulu.');
      return;
    }
    if (!selectedProofFile && (!proofUrl || hasPaymentWarning)) {
      showToast('error', 'Pilih foto bukti transfer terlebih dahulu.');
      return;
    }

    setIsUploading(true);
    try {
      let nextProofUrl = proofUrl;
      if (selectedProofFile) {
        const uploadResult = await uploadImage(selectedProofFile, 'proof');
        nextProofUrl = uploadResult?.url || uploadResult?.data?.url || '';
        if (!nextProofUrl) {
          throw new Error('URL bukti pembayaran tidak ditemukan setelah upload.');
        }
      }

      const result = await saveMyPSBPayment({
        payment_proof_url: nextProofUrl,
        payment_amount: parsedAmount,
        payment_date: paymentDate,
      });
      const nextRegistration = (result.data || null) as Registration | null;
      setRegistration(nextRegistration);
      setProofUrl(nextRegistration?.payment_proof_url || nextProofUrl);
      setAmount(nextRegistration?.payment_amount ? String(nextRegistration.payment_amount) : String(parsedAmount));
      setPaymentDate(nextRegistration?.payment_date || paymentDate);
      setSelectedProofFile(null);
      const message = 'Bukti pembayaran berhasil dikirim. Status pembayaran sekarang menunggu verifikasi panitia.';
      setSuccessMessage(message);
      showToast('success', message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengunggah bukti pembayaran.';
      showToast('error', message);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (paymentStatus !== 'pending' && paymentStatus !== 'paid') return;
    let alive = true;
    getMyPSBReceipt()
      .then((r) => {
        if (alive && r) {
          setReceipt({
            code: r.code,
            date: r.paid_at,
            santri_name: r.santri_name || registration?.full_name,
            description: 'Biaya Pendaftaran PSB',
            amount: r.amount,
            method: r.method,
          });
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [paymentStatus, registration?.full_name]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <RefreshCw className="animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <>
      <h3 className="mb-2 font-outfit text-3xl font-black uppercase tracking-tight text-slate-900">Bayar Pendaftaran</h3>
      <p className="mb-10 max-w-2xl text-sm leading-relaxed text-slate-500">
        Kirim bukti transfer biaya pendaftaran dari portal. Panitia akan memverifikasi pembayaran sebelum pendaftaran bisa dinyatakan diterima.
      </p>

      <div className={`mb-8 rounded-[2rem] border p-6 shadow-sm ${visibleStatusMeta.className}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white/80 p-3">
              {paymentStatus === 'paid' ? <CheckCircle2 size={24} /> : hasPaymentWarning ? <AlertCircle size={24} /> : <CreditCard size={24} />}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">{visibleStatusMeta.label}</p>
              <h4 className="mt-2 font-outfit text-2xl font-black uppercase tracking-tight">{visibleStatusMeta.title}</h4>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-7 opacity-80">{visibleStatusMeta.description}</p>
              {paymentNote ? (
                <div
                  className={`mt-4 rounded-2xl px-4 py-4 shadow-sm ${
                    hasPaymentWarning
                      ? 'border border-amber-200 bg-white text-amber-950 shadow-amber-900/5'
                      : 'border border-white/70 bg-white/80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        hasPaymentWarning ? 'bg-amber-100 text-amber-700' : 'bg-white text-current'
                      }`}
                    >
                      <AlertCircle size={18} />
                    </div>
                    <div>
                      <p
                        className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                          hasPaymentWarning ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        Catatan Panitia
                      </p>
                      <p
                        className={`mt-2 rounded-2xl px-4 py-3 text-sm font-black leading-6 ${
                          hasPaymentWarning
                            ? 'border border-amber-200 bg-amber-50 text-amber-950'
                            : 'bg-slate-50 text-slate-800'
                        }`}
                      >
                        {paymentNote}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <span className="inline-flex w-fit rounded-full bg-white/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em]">
              {proofUrl ? 'Bukti sudah ada' : 'Belum ada bukti'}
            </span>
          </div>
        </div>
      </div>

      {paymentStatus === 'pending' ? (
        <div className="mb-8 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white p-3 text-emerald-600 shadow-sm">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Yang Perlu Kamu Tahu</p>
              <h4 className="mt-2 font-outfit text-xl font-black uppercase tracking-tight text-emerald-950">
                Bukti Diterima, Verifikasi Sedang Berjalan
              </h4>
              <ul className="mt-4 space-y-2 text-sm font-semibold leading-6 text-emerald-900/80">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-1 shrink-0 text-emerald-600" />
                  Bukti transfer kamu sudah masuk ke panitia.
                </li>
                <li className="flex items-start gap-2">
                  <Clock size={16} className="mt-1 shrink-0 text-emerald-600" />
                  Verifikasi biasanya selesai dalam 1–2 hari kerja.
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck size={16} className="mt-1 shrink-0 text-emerald-600" />
                  Jangan upload ulang / kirim ganda — kecuali ada catatan panitia.
                </li>
                <li className="flex items-start gap-2">
                  <RefreshCw size={16} className="mt-1 shrink-0 text-emerald-600" />
                  Status di halaman ini diperbarui otomatis.
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      {(paymentStatus === 'pending' || paymentStatus === 'paid') && Boolean(proofUrl) ? (
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                <Receipt size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Kwitansi Pembayaran</p>
                <h4 className="font-outfit text-lg font-black uppercase tracking-tight text-slate-900">
                  {paymentStatus === 'paid' ? 'Pembayaran Dinyatakan Lunas' : 'Kwitansi Sementara'}
                </h4>
              </div>
            </div>
            <span
              className={`inline-flex w-fit rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${
                paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {paymentStatus === 'paid' ? 'Lunas' : 'Menunggu Verifikasi'}
            </span>
          </div>
          <div className="grid gap-5 px-6 py-5 md:grid-cols-2">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="font-semibold text-slate-500">Kode Kwitansi</dt>
                <dd className="font-black tracking-wide text-emerald-900">{receipt?.code || 'KWI-...'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="font-semibold text-slate-500">Atas Nama</dt>
                <dd className="max-w-[62%] truncate font-black text-slate-900">{registration?.full_name || '-'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="font-semibold text-slate-500">Nominal</dt>
                <dd className="font-black text-emerald-900">{formatCurrency(registration?.payment_amount)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="font-semibold text-slate-500">Tanggal Transfer</dt>
                <dd className="font-black text-slate-900">{paymentDate || '-'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="font-semibold text-slate-500">Metode</dt>
                <dd className="font-black text-slate-900">Transfer Bank</dd>
              </div>
            </dl>
            <div className="flex flex-col gap-4">
              {proofDisplayUrl ? (
                <button
                  type="button"
                  onClick={() => void openProofInNewTab(proofDisplayUrl, (m) => showToast('error', m))}
                  className="group relative block w-full cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-left"
                >
                  <ProofImage
                    src={proofDisplayUrl}
                    alt="Bukti transfer"
                    className="h-36 w-full object-cover transition group-hover:scale-[1.02]"
                  />
                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/70 to-transparent px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
                    <Eye size={14} /> Lihat Bukti Transfer
                  </span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void loadReceipt()}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-indigo-600 px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-600/35 active:translate-y-0"
              >
                <Banknote size={15} className="transition-transform group-hover:scale-110" /> Buka / Unduh Kwitansi
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Checklist Pembayaran</p>
            <h4 className="font-outfit text-xl font-black uppercase tracking-tight text-slate-900">Langkah Yang Sudah Dilalui</h4>
          </div>
          <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            {paymentSteps.filter((step) => step.completed).length}/{paymentSteps.length} selesai
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          {paymentSteps.map((step) => (
            <div
              key={step.title}
              className={`rounded-2xl border px-4 py-4 ${
                step.completed
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-900'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}
            >
              <div
                className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${
                  step.completed ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400'
                }`}
              >
                {step.completed ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              </div>
              <p className="text-sm font-black leading-tight">{step.title}</p>
              <p className="mt-2 text-xs font-semibold leading-5 opacity-75">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {successMessage ? (
        <div className="mb-8 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Upload Berhasil</p>
              <h4 className="mt-2 font-outfit text-xl font-black uppercase tracking-tight">Bukti Pembayaran Terkirim</h4>
              <p className="mt-2 text-sm font-semibold leading-7">{successMessage}</p>
            </div>
          </div>
        </div>
      ) : null}

      {hasPaymentWarning && paymentNote ? (
        <div className="relative mb-8 overflow-hidden rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 text-amber-950 shadow-lg shadow-amber-900/5">
          <div className="absolute inset-y-0 left-0 w-2 bg-amber-400" />
          <div className="flex items-start gap-4 pl-2">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <AlertCircle size={28} />
            </div>
            <div>
              <p className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-800">
                Peringatan Panitia
              </p>
              <h4 className="mt-2 font-outfit text-xl font-black uppercase tracking-tight">Upload Ulang Bukti Transfer</h4>
              <p className="mt-3 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-black leading-7 text-amber-950 shadow-sm">
                Catatan panitia: {paymentNote}
              </p>
              <p className="mt-3 text-sm font-semibold leading-7 text-amber-800">
                Silakan pilih foto bukti transfer yang benar pada form di bawah. Setelah upload ulang, status akan kembali menunggu verifikasi.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {!canUploadPayment ? (
        <div className="mb-8 rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-1 shrink-0" size={20} />
            <div>
              <h4 className="font-bold">Selesaikan data pendaftaran dulu</h4>
              <p className="mt-2 text-sm leading-7">
                Pembayaran baru bisa dikirim setelah biodata dan dokumen wajib lengkap, supaya bukti transfer tersambung ke data pendaftar yang benar.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {!biodataCompleted ? (
                  <Link href="/portal/biodata" className="rounded-full bg-amber-500 px-5 py-3 text-xs font-black uppercase tracking-widest text-white">
                    Lengkapi Biodata
                  </Link>
                ) : null}
                {!documentsCompleted ? (
                  <Link href="/portal/documents" className="rounded-full border border-amber-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-amber-800">
                    Unggah Dokumen
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Instruksi Transfer</p>
              <h4 className="font-outfit text-xl font-black uppercase tracking-tight text-slate-900">Pembayaran Manual</h4>
            </div>
          </div>
          <div className="space-y-4 text-sm leading-7 text-slate-600">
            <p>
              Silakan transfer biaya pendaftaran ke rekening berikut. Setelah transfer, isi nominal dan tanggal bayar, pilih foto bukti transfer,
              lalu klik tombol kirim.
            </p>

            {hasBankInfo ? (
              <div className="grid gap-3">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                    <Landmark size={13} /> Bank Tujuan
                  </p>
                  <p className="mt-2 text-lg font-black text-emerald-950">{configuredBankName || '-'}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Nomor Rekening
                      {configuredAccountNumber ? (
                        <button
                          type="button"
                          onClick={() => void handleCopy(configuredAccountNumber, 'Nomor rekening')}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-black text-white shadow-sm transition hover:bg-emerald-700"
                        >
                          <Copy size={11} /> Salin
                        </button>
                      ) : null}
                    </p>
                    <p className="mt-2 break-all font-mono text-xl font-black tracking-wide text-slate-900">{configuredAccountNumber || '-'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Atas Nama
                      {configuredAccountName ? (
                        <button
                          type="button"
                          onClick={() => void handleCopy(configuredAccountName, 'Atas nama rekening')}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-black text-white shadow-sm transition hover:bg-emerald-700"
                        >
                          <Copy size={11} /> Salin
                        </button>
                      ) : null}
                    </p>
                    <p className="mt-2 text-sm font-black leading-6 text-slate-900">{configuredAccountName || '-'}</p>
                  </div>
                </div>
                {configuredAmount > 0 ? (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
                      <Banknote size={13} /> Nominal Pendaftaran
                    </p>
                    <p className="mt-2 text-xl font-black text-amber-950">{formatCurrency(configuredAmount)}</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 font-semibold text-amber-900">
                Nomor rekening belum diatur oleh admin. Silakan hubungi panitia PSB sebelum transfer.
              </p>
            )}

            {configuredPaymentNote ? (
              <p className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 font-semibold text-emerald-900">
                {configuredPaymentNote}
              </p>
            ) : null}

            {configuredInstructions ? (
              <p className="whitespace-pre-line rounded-2xl border border-slate-200 bg-slate-50 p-4 font-semibold text-slate-700">
                {configuredInstructions}
              </p>
            ) : null}

            {configuredWaHref ? (
              <a
                href={configuredWaHref}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/35"
              >
                <MessageCircle size={16} className="transition-transform group-hover:scale-110" />
                Butuh bantuan? Chat Panitia PSB di WhatsApp
              </a>
            ) : null}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nominal Transfer</label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={isLocked}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 disabled:text-slate-400"
                placeholder="Contoh: 250000"
              />
              {!isLocked && configuredAmount > 0 && parsedAmount > 0 && parsedAmount !== configuredAmount ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-amber-800">
                  Nominal diharapkan {formatCurrency(configuredAmount)} — pastikan sesuai bukti transfer.
                </p>
              ) : !isLocked && configuredAmount > 0 ? (
                <p className="text-[11px] font-semibold leading-5 text-slate-400">
                  {amount.trim() === ''
                    ? `Nominal diharapkan: ${formatCurrency(configuredAmount)}. Isi sesuai yang kamu transfer.`
                    : `Nominal diharapkan: ${formatCurrency(configuredAmount)}.`}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal Transfer</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
                disabled={isLocked}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 disabled:text-slate-400"
              />
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-6 sm:p-8">
            <div className="mx-auto flex max-w-xl flex-col items-center text-center">
              <div className="relative">
                <div
                  className={`absolute inset-0 animate-pulse rounded-3xl opacity-60 blur-lg ${
                    selectedProofFile || proofUrl ? 'bg-emerald-400' : 'bg-emerald-500'
                  }`}
                />
                <div
                  className={`relative flex h-16 w-16 items-center justify-center rounded-3xl text-white shadow-xl ${
                    isUploading
                      ? 'bg-slate-400'
                      : selectedProofFile || proofUrl
                        ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/40'
                        : 'bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-600/40'
                  }`}
                >
                  {isUploading ? (
                    <RefreshCw size={26} className="animate-spin" />
                  ) : selectedProofFile || proofUrl ? (
                    <CheckCircle2 size={26} />
                  ) : (
                    <UploadCloud size={26} />
                  )}
                </div>
              </div>

              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">Bukti Transfer</p>
              <h5 className="mt-2 font-outfit text-xl font-black uppercase tracking-tight text-slate-900">
                {isUploading
                  ? 'Mengunggah Bukti...'
                  : selectedProofFile
                    ? 'Bukti Siap Dikirim'
                    : proofUrl
                      ? 'Bukti Sudah Tersimpan'
                      : 'Unggah Bukti Pembayaran'}
              </h5>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {selectedProofFile ? (
                  <>
                    File dipilih: <span className="font-black text-emerald-700">{selectedProofFile.name}</span>
                  </>
                ) : proofUrl ? (
                  'Bukti sebelumnya sudah tersimpan. Ganti bila perlu, lalu kirim ulang ke panitia.'
                ) : (
                  'Pilih foto bukti transfer, lalu klik tombol kirim agar status berubah menjadi menunggu verifikasi panitia.'
                )}
              </p>
              <p className="mt-2 text-[11px] font-semibold text-slate-400">Format: JPG, PNG, GIF, WEBP • Maksimal 5MB</p>
              {registration?.payment_amount ? (
                <p className="mt-3 text-[11px] font-black uppercase tracking-widest text-slate-500">
                  Nominal tersimpan: {formatCurrency(registration.payment_amount)}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {proofDisplayUrl ? (
                  <button
                    type="button"
                    onClick={() => void openProofInNewTab(proofDisplayUrl, (m) => showToast('error', m))}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-700 backdrop-blur transition hover:border-emerald-200 hover:bg-white hover:text-emerald-700"
                  >
                    <Eye size={16} />
                    Preview
                  </button>
                ) : null}
                <div className="relative">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp"
                    disabled={!canUploadPayment || isUploading || isLocked}
                    onChange={handleProofSelect}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    className={`pointer-events-none inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-xs font-black uppercase tracking-widest text-white transition-all duration-300 ${
                      !canUploadPayment || isLocked
                        ? 'bg-slate-300 text-slate-500 shadow-none'
                        : hasPaymentWarning
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-xl shadow-amber-500/30'
                          : 'bg-gradient-to-r from-emerald-600 via-emerald-600 to-indigo-600 shadow-xl shadow-emerald-600/30'
                    }`}
                  >
                    <UploadCloud size={16} />
                    {selectedProofFile ? 'Ganti Bukti' : proofUrl ? 'Ganti Bukti' : 'Pilih Bukti Sekarang'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-semibold leading-6 text-slate-600">
              Setelah bukti dipilih, klik tombol kirim agar status berubah menjadi menunggu verifikasi panitia.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => void handleSubmitPayment()}
                disabled={!canSubmitPayment || isUploading}
                className={`inline-flex items-center justify-center gap-3 rounded-full px-8 py-4 text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                  !canSubmitPayment || isUploading
                    ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                    : 'bg-gradient-to-r from-emerald-600 via-emerald-600 to-indigo-600 text-white shadow-xl shadow-emerald-600/30 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-emerald-600/40 active:translate-y-0 active:scale-[0.98]'
                }`}
              >
                {isUploading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Mengirim
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    {parsedAmount > 0 ? `Kirim Bukti ${formatCurrency(parsedAmount)}` : 'Kirim Bukti Pembayaran'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
              {paymentStatus === 'paid' ? (
                <Link
                  href="/portal"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-7 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-emerald-500/40"
                >
                  Pantau Status di Dasbor <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : paymentStatus === 'pending' ? (
                <span className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-50 px-5 py-3 text-xs font-black uppercase tracking-widest text-emerald-700">
                  <RefreshCw size={16} className="animate-spin" /> Menunggu Verifikasi Panitia
                </span>
              ) : (
                <Link
                  href="/portal/documents"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <ArrowLeft size={16} /> Kembali ke Dokumen
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {showKwitansi && receipt ? (
        <KwitansiModal
          data={receipt}
          schoolName={settings.school_name}
          schoolAddress={settings.school_address}
          schoolPhone={settings.school_phone}
          logoUrl={resolveDisplayImageUrl(settings.web_logo_url || "/assets/img/logo.jpg")}
          petugas="Panitia PSB"
          onClose={() => setShowKwitansi(false)}
        />
      ) : null}
    </>
  );
}
