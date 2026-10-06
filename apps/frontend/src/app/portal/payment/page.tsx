'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  Eye,
  Landmark,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import {
  getMyPSBRegistration,
  getPublicSettingsMap,
  resolveDisplayImageUrl,
  saveMyPSBPayment,
  uploadPrivateDocument,
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
    className: 'lte-alert-warning',
  },
  pending: {
    label: 'Menunggu Verifikasi',
    title: 'Bukti Pembayaran Sedang Dicek',
    description: 'Bukti pembayaran sudah masuk. Panitia akan memeriksa nominal dan bukti transfer yang kamu kirim.',
    className: 'lte-alert-primary',
  },
  paid: {
    label: 'Lunas',
    title: 'Pembayaran Sudah Diverifikasi',
    description: 'Pembayaran pendaftaran sudah dinyatakan lunas. Kamu bisa memantau status pendaftaran dari dashboard portal.',
    className: 'lte-alert-success',
  },
  rejected: {
    label: 'Perlu Upload Ulang',
    title: 'Bukti Pembayaran Perlu Diperbaiki',
    description: 'Panitia belum bisa memverifikasi bukti pembayaran. Periksa catatan, lalu upload ulang bukti yang benar.',
    className: 'lte-alert-danger',
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
  const [settings, setSettings] = useState<SettingsMap>({});
  const [selectedProofFile, setSelectedProofFile] = useState<File | null>(null);

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
        className: 'lte-alert-warning',
      }
    : statusMeta;
  const configuredBankName = settings.psb_payment_bank_name?.trim() || '';
  const configuredAccountNumber = settings.psb_payment_account_number?.trim() || '';
  const configuredAccountName = settings.psb_payment_account_name?.trim() || '';
  const configuredPaymentNote = settings.psb_payment_note?.trim() || '';
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
        const uploadResult = await uploadPrivateDocument(selectedProofFile);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengunggah bukti pembayaran.';
      showToast('error', message);
    } finally {
      setIsUploading(false);
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
      <div className="lte-content-header">
        <h3 className="lte-page-title">Bayar Pendaftaran</h3>
        <p className="lte-page-subtitle">
          Kirim bukti transfer biaya pendaftaran dari portal. Panitia akan memverifikasi pembayaran sebelum pendaftaran bisa dinyatakan diterima.
        </p>
      </div>

      <div className={`lte-alert mb-8 ${visibleStatusMeta.className}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded bg-white/85 p-2.5">
              {paymentStatus === 'paid' ? <CheckCircle2 size={24} /> : hasPaymentWarning ? <AlertCircle size={24} /> : <CreditCard size={24} />}
            </div>
            <div>
              <p className="lte-card-subtitle">{visibleStatusMeta.label}</p>
              <h4 className="lte-alert-title mt-1">{visibleStatusMeta.title}</h4>
              <p className="mt-1 max-w-2xl text-sm leading-7">{visibleStatusMeta.description}</p>
              {paymentNote ? (
                <div
                  className={`mt-4 rounded px-4 py-4 shadow-sm ${
                    hasPaymentWarning
                      ? 'border border-amber-200 bg-white text-amber-950'
                      : 'border border-white/70 bg-white/80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded ${
                        hasPaymentWarning ? 'bg-amber-100 text-amber-700' : 'bg-white text-current'
                      }`}
                    >
                      <AlertCircle size={18} />
                    </div>
                    <div>
                      <p
                        className={`lte-badge ${
                          hasPaymentWarning ? 'lte-badge-soft-warning' : 'lte-badge-light'
                        }`}
                      >
                        Catatan Panitia
                      </p>
                      <p
                        className={`mt-2 rounded px-4 py-3 text-sm font-bold leading-6 ${
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
          <span className="lte-badge lte-badge-light w-fit">
            {proofUrl ? 'Bukti sudah ada' : 'Belum ada bukti'}
          </span>
        </div>
      </div>

      <div className="lte-card mb-8">
        <div className="lte-card-header">
          <div>
            <p className="lte-card-subtitle">Checklist Pembayaran</p>
            <h4 className="lte-card-title">Langkah Yang Sudah Dilalui</h4>
          </div>
          <span className="lte-badge lte-badge-primary">
            {paymentSteps.filter((step) => step.completed).length}/{paymentSteps.length} selesai
          </span>
        </div>

        <div className="lte-card-body">
          <div className="grid gap-3 md:grid-cols-5">
            {paymentSteps.map((step) => (
              <div
                key={step.title}
                className={`lte-step-item ${step.completed ? 'done' : ''}`}
              >
                <div
                  className={`mb-3 flex h-9 w-9 items-center justify-center rounded ${
                    step.completed ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  {step.completed ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                </div>
                <p className="lte-step-title">{step.title}</p>
                <p className={`lte-step-desc ${step.completed ? 'text-emerald-800' : 'text-slate-500'}`}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {successMessage ? (
        <div className="lte-alert lte-alert-success mb-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="lte-card-subtitle">Upload Berhasil</p>
              <h4 className="lte-alert-title mt-1">Bukti Pembayaran Terkirim</h4>
              <p className="mt-1 text-sm font-semibold leading-7">{successMessage}</p>
            </div>
          </div>
        </div>
      ) : null}

      {hasPaymentWarning && paymentNote ? (
        <div className="lte-alert lte-alert-warning relative mb-8 pl-8">
          <div className="absolute inset-y-0 left-0 w-2 bg-amber-400" />
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-amber-100 text-amber-700">
              <AlertCircle size={28} />
            </div>
            <div>
              <p className="lte-badge lte-badge-warning w-fit">
                Peringatan Panitia
              </p>
              <h4 className="lte-alert-title mt-2">Upload Ulang Bukti Transfer</h4>
              <p className="mt-3 rounded border border-amber-200 bg-white px-4 py-3 text-sm font-bold leading-7 shadow-sm">
                Catatan panitia: {paymentNote}
              </p>
              <p className="mt-3 text-sm leading-7">
                Silakan pilih foto bukti transfer yang benar pada form di bawah. Setelah upload ulang, status akan kembali menunggu verifikasi.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {!canUploadPayment ? (
        <div className="lte-alert lte-alert-warning mb-8 flex items-start gap-3">
          <AlertCircle className="mt-1 shrink-0" size={20} />
          <div>
            <p className="lte-alert-title">Selesaikan data pendaftaran dulu</p>
            <p className="mt-2 text-sm leading-7">
              Pembayaran baru bisa dikirim setelah biodata dan dokumen wajib lengkap, supaya bukti transfer tersambung ke data pendaftar yang benar.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {!biodataCompleted ? (
                <Link href="/portal/biodata" className="lte-btn lte-btn-warning">
                  Lengkapi Biodata
                </Link>
              ) : null}
              {!documentsCompleted ? (
                <Link href="/portal/documents" className="lte-btn lte-btn-outline-secondary">
                  Unggah Dokumen
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="lte-card">
          <div className="lte-card-header justify-start gap-3">
            <div className="rounded bg-emerald-50 p-2.5 text-emerald-600">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="lte-card-subtitle">Instruksi Transfer</p>
              <h4 className="lte-card-title">Pembayaran Manual</h4>
            </div>
          </div>
          <div className="lte-card-body space-y-4 text-sm leading-7 text-slate-600">
            <p>
              Silakan transfer biaya pendaftaran ke rekening berikut. Setelah transfer, isi nominal dan tanggal bayar, pilih foto bukti transfer,
              lalu klik tombol kirim.
            </p>

            {hasBankInfo ? (
              <div className="grid gap-3">
                <div className="rounded border border-emerald-100 bg-emerald-50 p-4">
                  <p className="lte-card-subtitle flex items-center gap-2">
                    <Landmark size={13} /> Bank Tujuan
                  </p>
                  <p className="mt-2 text-lg font-bold text-emerald-950">{configuredBankName || '-'}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded border border-slate-200 bg-slate-50 p-4">
                    <p className="lte-card-subtitle">Nomor Rekening</p>
                    <p className="mt-2 break-all font-mono text-xl font-bold tracking-wide text-slate-900">{configuredAccountNumber || '-'}</p>
                  </div>
                  <div className="rounded border border-slate-200 bg-slate-50 p-4">
                    <p className="lte-card-subtitle">Atas Nama</p>
                    <p className="mt-2 text-sm font-bold leading-6 text-slate-900">{configuredAccountName || '-'}</p>
                  </div>
                </div>
                {configuredAmount > 0 ? (
                  <div className="rounded border border-amber-100 bg-amber-50 p-4">
                    <p className="lte-card-subtitle flex items-center gap-2">
                      <Banknote size={13} /> Nominal Pendaftaran
                    </p>
                    <p className="mt-2 text-xl font-bold text-amber-950">{formatCurrency(configuredAmount)}</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="lte-alert lte-alert-warning">
                Nomor rekening belum diatur oleh admin. Silakan hubungi panitia PSB sebelum transfer.
              </p>
            )}

            {configuredPaymentNote ? (
              <p className="lte-alert lte-alert-primary">
                {configuredPaymentNote}
              </p>
            ) : null}

            {configuredInstructions ? (
              <p className="rounded border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-700">
                {configuredInstructions}
              </p>
            ) : null}
          </div>
        </div>

        <div className="lte-card">
          <div className="lte-card-body">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="lte-form-label">Nominal Transfer</label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  disabled={isLocked}
                  className="lte-form-control w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 disabled:text-slate-400"
                  placeholder="Contoh: 250000"
                />
              </div>

              <div className="space-y-2">
                <label className="lte-form-label">Tanggal Transfer</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                  disabled={isLocked}
                  className="lte-form-control w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 disabled:text-slate-400"
                />
              </div>
            </div>

            <div className="mt-6 rounded border border-dashed border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="lte-card-subtitle">Bukti Transfer</p>
                  <h5 className="lte-card-title mt-1">
                    {selectedProofFile ? 'Bukti baru siap dikirim' : proofUrl ? 'Bukti pembayaran sudah tersimpan' : 'Pilih foto bukti pembayaran'}
                  </h5>
                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    Pilih file dulu, lalu klik Kirim Bukti Pembayaran. Format: JPG, JPEG, PNG, GIF, atau WEBP. Maksimal 5MB.
                  </p>
                  {selectedProofFile ? (
                    <p className="lte-alert lte-alert-success mt-3 px-4 py-3 font-bold uppercase tracking-widest">
                      File dipilih: {selectedProofFile.name}
                    </p>
                  ) : null}
                  {registration?.payment_amount ? (
                    <p className="lte-card-subtitle mt-3">
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
                      className="lte-btn lte-btn-outline-secondary lte-btn-sm"
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
                      onChange={handleProofSelect}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      className={`lte-btn pointer-events-none lte-btn-sm ${
                        !canUploadPayment || isLocked
                          ? 'lte-btn-outline-secondary'
                          : hasPaymentWarning
                            ? 'lte-btn-warning'
                            : 'lte-btn-success'
                      }`}
                    >
                      <UploadCloud size={16} />
                      {selectedProofFile ? 'Ganti Bukti' : proofUrl ? 'Ganti Bukti' : 'Pilih Bukti'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 rounded border border-slate-100 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
              <p className="text-sm font-semibold leading-6 text-slate-600">
                Setelah bukti dipilih, klik tombol kirim agar status berubah menjadi menunggu verifikasi panitia.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => void handleSubmitPayment()}
                  disabled={!canSubmitPayment || isUploading}
                  className="lte-btn lte-btn-success"
                >
                  {isUploading ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {isUploading ? 'Mengirim' : 'Kirim Bukti Pembayaran'}
                </button>
                <Link
                  href="/portal"
                  className="lte-btn lte-btn-dark"
                >
                  Kembali ke Dasbor <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}