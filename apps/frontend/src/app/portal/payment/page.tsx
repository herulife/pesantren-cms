'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Eye,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { getMyPSBRegistration, resolveDisplayImageUrl, saveMyPSBPayment, uploadImage, type Registration } from '@/lib/api';

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
    className: 'border-amber-100 bg-amber-50 text-amber-700',
  },
  pending: {
    label: 'Menunggu Verifikasi',
    title: 'Bukti Pembayaran Sedang Dicek',
    description: 'Bukti pembayaran sudah masuk. Panitia akan memeriksa nominal dan bukti transfer yang kamu kirim.',
    className: 'border-blue-100 bg-blue-50 text-blue-700',
  },
  paid: {
    label: 'Lunas',
    title: 'Pembayaran Sudah Diverifikasi',
    description: 'Pembayaran pendaftaran sudah dinyatakan lunas. Kamu bisa memantau status pendaftaran dari dashboard portal.',
    className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
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
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayDate());
  const [proofUrl, setProofUrl] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchRegistration = async () => {
      setIsLoading(true);
      try {
        const data = await getMyPSBRegistration();
        setRegistration(data);
        setAmount(data?.payment_amount ? String(data.payment_amount) : '');
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
    registration?.program_choice,
    registration?.father_name,
    registration?.father_job,
    registration?.father_phone,
    registration?.mother_name,
    registration?.mother_job,
    registration?.mother_phone,
  ].every(isFilled);
  const documentsCompleted = [registration?.kk_url, registration?.ijazah_url, registration?.pasfoto_url].every(isFilled);
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

  useEffect(() => {
    if (hasPaymentWarning && paymentNote && !hasShownRejectedNotice.current) {
      hasShownRejectedNotice.current = true;
      showToast('error', `Catatan panitia: ${paymentNote}`);
    }
  }, [hasPaymentWarning, paymentNote, showToast]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSuccessMessage('');
    const parsedAmount = Number(amount);
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

    setIsUploading(true);
    try {
      const uploadResult = await uploadImage(file);
      const url = uploadResult?.url || uploadResult?.data?.url || '';
      if (!url) {
        throw new Error('URL bukti pembayaran tidak ditemukan setelah upload.');
      }

      const result = await saveMyPSBPayment({
        payment_proof_url: url,
        payment_amount: parsedAmount,
        payment_date: paymentDate,
      });
      const nextRegistration = (result.data || null) as Registration | null;
      setRegistration(nextRegistration);
      setProofUrl(nextRegistration?.payment_proof_url || url);
      setAmount(nextRegistration?.payment_amount ? String(nextRegistration.payment_amount) : String(parsedAmount));
      setPaymentDate(nextRegistration?.payment_date || paymentDate);
      const message = 'Bukti pembayaran berhasil dikirim. Status pembayaran sekarang menunggu verifikasi panitia.';
      setSuccessMessage(message);
      showToast('success', message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengunggah bukti pembayaran.';
      showToast('error', message);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <RefreshCw className="animate-spin text-blue-600" />
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
          <span className="inline-flex w-fit rounded-full bg-white/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em]">
            {proofUrl ? 'Bukti sudah ada' : 'Belum ada bukti'}
          </span>
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
              Silakan transfer biaya pendaftaran sesuai arahan panitia PSB. Setelah transfer, isi nominal dan tanggal bayar di form sebelah kanan,
              lalu unggah foto bukti transfer.
            </p>
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 font-semibold text-slate-700">
              Jika rekening atau nominal belum tampil di sini, gunakan informasi yang diberikan panitia melalui WhatsApp atau brosur PSB.
            </p>
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

          <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Bukti Transfer</p>
                <h5 className="mt-2 font-bold text-slate-900">
                  {proofUrl ? 'Bukti pembayaran sudah tersimpan' : 'Unggah foto bukti pembayaran'}
                </h5>
                <p className="mt-2 text-xs leading-6 text-slate-500">
                  Format yang didukung: JPG, JPEG, PNG, GIF, atau WEBP. Maksimal 5MB.
                </p>
                {registration?.payment_amount ? (
                  <p className="mt-3 text-xs font-black uppercase tracking-widest text-slate-400">
                    Nominal tersimpan: {formatCurrency(registration.payment_amount)}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                {proofDisplayUrl ? (
                  <a
                    href={proofDisplayUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
                  >
                    <Eye size={16} />
                    Preview
                  </a>
                ) : null}
                <div className="relative">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp"
                    disabled={!canUploadPayment || isUploading || isLocked}
                    onChange={(event) => void handleUpload(event)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    className={`pointer-events-none inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-widest transition ${
                      !canUploadPayment || isLocked
                        ? 'bg-slate-200 text-slate-400'
                        : hasPaymentWarning
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                          : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    }`}
                  >
                    {isUploading ? <RefreshCw size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                    {isUploading ? 'Mengunggah' : proofUrl ? 'Upload Ulang' : 'Upload Bukti'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-semibold leading-6 text-slate-600">
              Setelah bukti dikirim, status akan berubah menjadi menunggu verifikasi panitia.
            </p>
            <Link
              href="/portal"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-emerald-600"
            >
              Kembali ke Dasbor <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
