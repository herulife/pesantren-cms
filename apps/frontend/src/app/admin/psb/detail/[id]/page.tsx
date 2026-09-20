'use client';

import React, { useState, useEffect } from 'react';
import { getRegistrations, updatePSBPaymentStatus, updatePSBStatus, acceptPSBToSantri, getPublicSettingsMap, Registration, resolveDisplayImageUrl } from '@/lib/api';
import { useToast } from '@/components/Toast';
import ProofImage, { openProofInNewTab } from '@/components/ProofImage';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  MapPin, 
  GraduationCap, 
  Phone,
  ArrowLeft,
  Loader2,
  FileText,
  Eye,
  Download,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';

export default function PSBDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [paymentNote, setPaymentNote] = useState('');
  const [rejectionNote, setRejectionNote] = useState('');
  const [expectedAmount, setExpectedAmount] = useState(0);
  const [isAccepting, setIsAccepting] = useState(false);
  const [testDate, setTestDate] = useState('');
  const [testLocation, setTestLocation] = useState('');
  const [testScore, setTestScore] = useState<string>('');
  const [testNote, setTestNote] = useState('');
  const [reRegDeadline, setReRegDeadline] = useState('');
  const [isSavingTest, setIsSavingTest] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const fetchRegistration = async () => {
        setIsLoading(true);
        const [data, publicSettings] = await Promise.all([getRegistrations(), getPublicSettingsMap()]);
        const found = data.find((r: Registration) => r.id === Number(id));
        setRegistration(found || null);
        setPaymentNote(found?.payment_note || '');
        setRejectionNote(found?.rejection_note || '');
        setExpectedAmount(Number(publicSettings.psb_payment_amount || 0));
        setTestDate(found?.test_date || '');
        setTestLocation(found?.test_location || '');
        setTestScore(found?.test_score != null ? String(found.test_score) : '');
        setTestNote(found?.test_note || '');
        setReRegDeadline(found?.re_registration_deadline || '');
        setIsLoading(false);
      };

      void fetchRegistration();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!registration) return;

    if (registration.status === newStatus || isUpdatingStatus) return;
    if ((newStatus === 'accepted' || newStatus === 're_registration') && registration.payment_status !== 'paid') {
      showToast('error', 'Tandai pembayaran pendaftaran sebagai lunas terlebih dahulu.');
      return;
    }
    if (newStatus === 'tes' && !testDate.trim()) {
      showToast('error', 'Isi jadwal tes seleksi terlebih dahulu agar wali menerima info yang jelas.');
      return;
    }
    if (newStatus === 're_registration' && !reRegDeadline.trim()) {
      showToast('error', 'Isi batas waktu daftar ulang terlebih dahulu.');
      return;
    }
    if (newStatus === 'rejected' && !rejectionNote.trim()) {
      showToast('error', 'Isi alasan penolakan terlebih dahulu agar wali memahami alasannya.');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const res = await updatePSBStatus(registration.id, {
        status: newStatus,
        note: newStatus === 'rejected' ? rejectionNote : '',
        test_date: testDate,
        test_location: testLocation,
        test_score: testScore.trim() ? Number(testScore) : undefined,
        test_note: testNote,
        re_registration_deadline: newStatus === 're_registration' ? reRegDeadline : undefined,
      });
      if (res.success) {
        showToast('success', `Status pendaftaran berhasil diubah ${registration.status.toUpperCase()} → ${newStatus.toUpperCase()}`);
        setRegistration({ ...registration, status: newStatus });
        return;
      }

      showToast('error', 'Gagal memperbarui status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveTestInfo = async () => {
    if (!registration || isSavingTest) return;
    setIsSavingTest(true);
    try {
      const res = await updatePSBStatus(registration.id, {
        status: registration.status,
        test_date: testDate,
        test_location: testLocation,
        test_score: testScore.trim() ? Number(testScore) : undefined,
        test_note: testNote,
        re_registration_deadline: reRegDeadline,
      });
      if (res.success) {
        showToast('success', 'Detail tes seleksi dan daftar ulang berhasil disimpan.');
        setRegistration({
          ...registration,
          test_date: testDate,
          test_location: testLocation,
          test_score: testScore.trim() ? Number(testScore) : undefined,
          test_note: testNote,
          re_registration_deadline: reRegDeadline,
        });
        return;
      }
      showToast('error', res.message || 'Gagal menyimpan detail.');
    } finally {
      setIsSavingTest(false);
    }
  };

  const handleAcceptToSantri = async () => {
    if (!registration || isAccepting) return;
    setIsAccepting(true);
    try {
      const res = await acceptPSBToSantri(registration.id);
      if (res.success) {
        showToast('success', 'Pendaftar berhasil dipindahkan menjadi santri. Memuat ulang…');
        window.setTimeout(() => window.location.reload(), 1200);
        return;
      }
      showToast('error', res.message || 'Gagal memindahkan ke santri.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handlePaymentStatusUpdate = async (newStatus: string) => {
    if (!registration) return;

    if (registration.payment_status === newStatus && (registration.payment_note || '') === paymentNote) return;

    setIsUpdatingPayment(true);
    try {
      const res = await updatePSBPaymentStatus(registration.id, {
        payment_status: newStatus,
        payment_note: paymentNote,
      });
      if (res.success) {
        showToast('success', `Status pembayaran berhasil diubah.`);
        setRegistration({ ...registration, payment_status: newStatus, payment_note: paymentNote });
        return;
      }

      showToast('error', 'Gagal memperbarui status pembayaran.');
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const getDocumentUrl = (value?: string | null) => {
    const trimmed = (value ?? '').trim();
    if (!trimmed) return '';
    return resolveDisplayImageUrl(trimmed);
  };

  const getDocumentName = (value?: string | null) => {
    const trimmed = (value ?? '').trim();
    if (!trimmed) return 'Belum ada berkas';
    const rawName = trimmed.split('?')[0].split('/').pop() || trimmed;
    try {
      return decodeURIComponent(rawName);
    } catch {
      return rawName;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted': return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'review': return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'tes': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 're_registration': return 'bg-violet-100 text-violet-700 border-violet-200';
      case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const getPaymentStatusStyle = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'paid': return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'pending': return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const formatCurrency = (value?: number | null) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);

  if (isLoading) {
     return (
        <>
           <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 size={40} className="animate-spin text-sky-500 mb-4" />
              <p className="font-bold text-slate-400">Memuat Data Pendaftar...</p>
           </div>
        </>
     );
  }

  if (!registration) {
     return (
        <>
           <div className="py-20 flex flex-col items-center justify-center">
              <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-widest">Data Tidak Ditemukan</h2>
              <Link href="/admin/psb" className="text-sky-600 font-bold hover:underline">Kembali ke Daftar</Link>
           </div>
        </>
     );
  }

  const guardianName = registration.father_name || registration.parent_name || '-';
  const guardianPhone = registration.father_phone || registration.parent_phone || '-';

  const statusLabel = registration.status === 'accepted'
    ? 'Diterima'
    : registration.status === 'review'
      ? 'Direview'
      : registration.status === 'tes'
        ? 'Tes Seleksi'
        : registration.status === 're_registration'
          ? 'Daftar Ulang'
          : registration.status === 'rejected'
            ? 'Ditolak'
            : 'Menunggu';

  const statusOptions = [
    {
      value: 'pending',
      label: 'Menunggu',
      description: 'Data masuk dan belum mulai diperiksa.',
      icon: <Clock size={18} />,
      selectedClass: 'border-amber-300 bg-amber-50 text-amber-700',
      radioClass: 'border-amber-500 text-amber-500',
    },
    {
      value: 'review',
      label: 'Review Berkas',
      description: 'Berkas sedang dicek oleh admin PSB.',
      icon: <Clock size={18} />,
      selectedClass: 'border-sky-300 bg-sky-50 text-sky-700',
      radioClass: 'border-sky-500 text-sky-500',
    },
    {
      value: 'tes',
      label: 'Tes Seleksi',
      description: 'Undang calon santri mengikuti tes seleksi.',
      icon: <GraduationCap size={18} />,
      selectedClass: 'border-indigo-300 bg-indigo-50 text-indigo-700',
      radioClass: 'border-indigo-500 text-indigo-500',
    },
    {
      value: 'accepted',
      label: 'Diterima',
      description: 'Calon santri dinyatakan lulus seleksi.',
      icon: <CheckCircle size={18} />,
      selectedClass: 'border-sky-300 bg-sky-50 text-sky-700',
      radioClass: 'border-sky-500 text-sky-500',
    },
    {
      value: 're_registration',
      label: 'Daftar Ulang',
      description: 'Undang wali melakukan daftar ulang resmi.',
      icon: <CheckCircle size={18} />,
      selectedClass: 'border-violet-300 bg-violet-50 text-violet-700',
      radioClass: 'border-violet-500 text-violet-500',
    },
    {
      value: 'rejected',
      label: 'Ditolak',
      description: 'Pendaftaran belum dapat diterima.',
      icon: <XCircle size={18} />,
      selectedClass: 'border-rose-300 bg-rose-50 text-rose-700',
      radioClass: 'border-rose-500 text-rose-500',
    },
  ];

  const paymentStatus = registration.payment_status || 'unpaid';
  const paymentStatusLabel = paymentStatus === 'paid'
    ? 'Lunas'
    : paymentStatus === 'pending'
      ? 'Menunggu Verifikasi'
      : paymentStatus === 'rejected'
        ? 'Ditolak'
        : 'Belum Bayar';
  const paymentProofUrl = getDocumentUrl(registration.payment_proof_url);

  const paymentOptions = [
    {
      value: 'unpaid',
      label: 'Belum Bayar',
      description: 'Belum ada pembayaran yang bisa diverifikasi.',
      icon: <Clock size={18} />,
      selectedClass: 'border-amber-300 bg-amber-50 text-amber-700 shadow-[0_18px_44px_-32px_rgba(250,204,21,0.7)]',
      radioClass: 'border-amber-500 text-amber-500',
    },
    {
      value: 'pending',
      label: 'Menunggu',
      description: 'Bukti transfer sudah masuk dan perlu dicek.',
      icon: <Clock size={18} />,
      selectedClass: 'border-sky-300 bg-sky-50 text-sky-700 shadow-[0_18px_44px_-32px_rgba(59,130,246,0.7)]',
      radioClass: 'border-sky-500 text-sky-500',
    },
    {
      value: 'rejected',
      label: 'Tolak Bukti',
      description: 'Bukti belum valid dan perlu upload ulang.',
      icon: <XCircle size={18} />,
      selectedClass: 'border-rose-300 bg-rose-50 text-rose-700 shadow-[0_18px_44px_-32px_rgba(244,63,94,0.7)]',
      radioClass: 'border-rose-500 text-rose-500',
    },
    {
      value: 'paid',
      label: 'Lunas',
      description: 'Pembayaran pendaftaran sudah terverifikasi.',
      icon: <CheckCircle size={18} />,
      selectedClass: 'border-sky-300 bg-sky-50 text-sky-700 shadow-[0_18px_44px_-32px_rgba(14,165,233,0.7)]',
      radioClass: 'border-sky-500 text-sky-500',
    },
  ];

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
         <Link href="/admin/psb" className="flex items-center gap-2 text-slate-500 hover:text-sky-700 transition-colors font-bold uppercase tracking-widest text-xs">
            <ArrowLeft size={16} /> Kembali ke Daftar Registrasi
         </Link>
      </div>

      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight">Detail Pendaftar Calon Santri</h1>
        <p className="text-slate-500 text-sm">Verifikasi data berkas dan ubah status kelolosan penerimaan santri baru.</p>
      </div>

      <div className="bg-white p-8 lg:p-12 border border-slate-200 rounded-xl shadow-sm max-w-4xl">
         <div className="flex items-center gap-6 mb-12">
            <div className="w-24 h-24 bg-sky-50 rounded-xl flex items-center justify-center text-4xl font-black text-sky-600 shadow-inner">
               {registration.full_name.charAt(0)}
            </div>
            <div>
               <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{registration.full_name}</h2>
               <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-lg">ID: #PSB-{registration.id.toString().padStart(4, '0')}</span>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-lg">Gender: {registration.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}</span>
                  <span className="text-xs font-black uppercase tracking-widest bg-sky-50 px-4 py-2 rounded-lg text-sky-700">Kategori: {registration.category === 'yatim' ? 'Yatim' : registration.category === 'dhuafa' ? 'Dhuafa' : 'Reguler'}</span>
                  <span className="text-xs font-black uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-lg text-slate-500">Jenjang {(registration.jenjang || '-').toUpperCase()} | Program: {registration.program_choice === 'bahasa' ? 'Bahasa Arab' : 'Tahfidz'}</span>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
            <div className="space-y-8">
               <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                     <MapPin size={24} />
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-sky-600 uppercase tracking-[0.2em] mb-2">Tempat, Tgl Lahir</label>
                     <p className="font-bold text-slate-900 text-lg">{registration.birth_place}, {registration.birth_date}</p>
                  </div>
               </div>
               
               <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                     <GraduationCap size={24} />
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-sky-600 uppercase tracking-[0.2em] mb-2">Asal Sekolah & Program</label>
                     <p className="font-bold text-slate-900 text-lg">{registration.school_origin}</p>
                     <p className="mt-1 text-sm font-semibold text-slate-500">{(registration.jenjang || '-').toUpperCase()} / {registration.program_choice || '-'}</p>
                  </div>
               </div>
            </div>

            <div className="space-y-8">
               <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                     <User size={24} />
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-sky-600 uppercase tracking-[0.2em] mb-2">Kontak Utama Wali</label>
                     <p className="font-bold text-slate-900 text-lg">{guardianName}</p>
                     <p className="mt-1 text-sm font-semibold text-slate-500">{registration.father_job || 'Wali utama pendaftaran'}</p>
                  </div>
               </div>
               
               <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-sky-50 rounded-lg flex items-center justify-center text-sky-600 shrink-0 border border-sky-100">
                     <Phone size={24} />
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-sky-600 uppercase tracking-[0.2em] mb-2">WhatsApp Kontak</label>
                     <p className="font-black text-sky-700 text-lg">{guardianPhone}</p>
                  </div>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-12">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-6">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Informasi Ayah</label>
              <div className="space-y-2 text-sm">
                <p className="font-bold text-slate-900">{registration.father_name || '-'}</p>
                <p className="text-slate-600">Pekerjaan: {registration.father_job || '-'}</p>
                <p className="text-slate-600">No. HP: {registration.father_phone || '-'}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-6">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Informasi Ibu</label>
              <div className="space-y-2 text-sm">
                <p className="font-bold text-slate-900">{registration.mother_name || '-'}</p>
                <p className="text-slate-600">Pekerjaan: {registration.mother_job || '-'}</p>
                <p className="text-slate-600">No. HP: {registration.mother_phone || '-'}</p>
              </div>
            </div>
         </div>

         <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm mb-10">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <CreditCard size={16} />
                Pembayaran Pendaftaran
              </label>

              <div className={`inline-flex items-center gap-2 self-start px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.18em] border shadow-sm ${getPaymentStatusStyle(paymentStatus)}`}>
                {isUpdatingPayment ? <Loader2 size={15} className="animate-spin" /> : null}
                Status bayar: {paymentStatusLabel}
              </div>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nominal</p>
                <p className="mt-2 text-lg font-black text-slate-900">{formatCurrency(registration.payment_amount)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal Bayar</p>
                <p className="mt-2 text-lg font-black text-slate-900">{registration.payment_date || '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bukti Transfer</p>
                {paymentProofUrl ? (
                  <button
                    type="button"
                    onClick={() => void openProofInNewTab(paymentProofUrl, (m) => showToast('error', m))}
                    className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-sky-700 ring-1 ring-sky-100 transition hover:bg-sky-50"
                  >
                    <Eye size={14} /> Preview
                  </button>
                ) : (
                  <p className="mt-2 text-sm font-bold text-slate-400">Belum ada bukti</p>
                )}
              </div>
            </div>

            {expectedAmount > 0 && Number(registration.payment_amount) !== expectedAmount ? (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Perhatian: Nominal Tidak Sesuai</p>
                <p className="mt-1 text-sm font-semibold leading-6">
                  Biaya pendaftaran yang diatur saat ini adalah {formatCurrency(expectedAmount)}, sedangkan wali melaporkan{' '}
                  {formatCurrency(Number(registration.payment_amount) || 0)}. Verifikasi bukti transfer dengan teliti.
                </p>
              </div>
            ) : null}

            <fieldset className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" disabled={isUpdatingPayment}>
              <legend className="sr-only">Pilih status pembayaran pendaftaran</legend>
              {paymentOptions.map((option) => {
                const isSelected = paymentStatus === option.value;

                return (
                  <label
                    key={option.value}
                    className={`relative flex cursor-pointer items-start gap-4 rounded-2xl border p-5 pr-16 transition-all ${
                      isSelected
                        ? option.selectedClass
                        : 'border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50'
                    } ${isUpdatingPayment ? 'pointer-events-none opacity-70' : ''}`}
                  >
                    <input
                      type="radio"
                      name="registration-payment-status"
                      value={option.value}
                      checked={isSelected}
                      disabled={isUpdatingPayment}
                      onChange={() => handlePaymentStatusUpdate(option.value)}
                      className="sr-only"
                    />
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 bg-white ${
                        isSelected ? option.radioClass : 'border-slate-300 text-transparent'
                      }`}
                    >
                      {isSelected ? <span className="h-2.5 w-2.5 rounded-full bg-current" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em]">
                        {option.icon}
                        {option.label}
                      </span>
                      <span className="mt-2 block text-xs font-semibold leading-5 text-slate-500">{option.description}</span>
                    </span>
                    {isSelected ? (
                      <span className="absolute right-4 top-4 rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-current">
                        Aktif
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </fieldset>

            <div className="mt-5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Catatan untuk wali</label>
              <textarea
                rows={3}
                value={paymentNote}
                onChange={(event) => setPaymentNote(event.target.value)}
                placeholder="Contoh: Bukti transfer kurang jelas, mohon upload ulang."
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
              />
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Catatan ikut tersimpan saat status pembayaran dipilih. Gunakan terutama jika bukti ditolak.
              </p>
              <button
                type="button"
                onClick={() => handlePaymentStatusUpdate(paymentStatus)}
                disabled={isUpdatingPayment}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-sky-600 disabled:opacity-50"
              >
                {isUpdatingPayment ? <Loader2 size={14} className="animate-spin" /> : null}
                Simpan Catatan
              </button>
            </div>
         </div>

         <div className="bg-slate-50 p-8 rounded-xl border border-slate-100">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
               <Clock size={16} />
               Manajemen Status Pendaftaran
              </label>

              <div className={`inline-flex items-center gap-2 self-start px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.18em] border shadow-sm ${getStatusStyle(registration.status)}`}>
                {isUpdatingStatus ? <Loader2 size={15} className="animate-spin" /> : null}
                Status saat ini: {statusLabel}
              </div>
            </div>

            <fieldset className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" disabled={isUpdatingStatus}>
              <legend className="sr-only">Pilih status pendaftaran santri</legend>
              {statusOptions.map((option) => {
                const isSelected = registration.status === option.value;
                const isOptionDisabled =
                  isUpdatingStatus ||
                  ((option.value === 'accepted' || option.value === 're_registration') && paymentStatus !== 'paid') ||
                  (option.value === 'tes' && !testDate.trim()) ||
                  (option.value === 're_registration' && !reRegDeadline.trim());

                return (
                  <label
                    key={option.value}
                    className={`relative flex cursor-pointer items-start gap-4 rounded-2xl border p-5 pr-16 transition-all ${
                      isSelected
                        ? option.selectedClass
                        : 'border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50'
                    } ${isOptionDisabled ? 'pointer-events-none opacity-55' : ''}`}
                  >
                    <input
                      type="radio"
                      name="registration-status"
                      value={option.value}
                      checked={isSelected}
                      disabled={isOptionDisabled}
                      onChange={() => handleStatusUpdate(option.value)}
                      className="sr-only"
                    />
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 bg-white ${
                        isSelected ? option.radioClass : 'border-slate-300 text-transparent'
                      }`}
                    >
                      {isSelected ? <span className="h-2.5 w-2.5 rounded-full bg-current" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em]">
                        {option.icon}
                        {option.label}
                      </span>
                      <span className="mt-2 block text-xs font-semibold leading-5 text-slate-500">{option.description}</span>
                      {(option.value === 'accepted' || option.value === 're_registration') && paymentStatus !== 'paid' ? (
                        <span className="mt-2 block text-[11px] font-black uppercase tracking-widest text-rose-500">
                          Lunasi pembayaran dulu
                        </span>
                      ) : null}
                      {option.value === 'tes' && !testDate.trim() ? (
                        <span className="mt-2 block text-[11px] font-black uppercase tracking-widest text-indigo-500">
                          Isi jadwal tes dulu
                        </span>
                      ) : null}
                      {option.value === 're_registration' && !reRegDeadline.trim() ? (
                        <span className="mt-2 block text-[11px] font-black uppercase tracking-widest text-violet-500">
                          Isi batas waktu dulu
                        </span>
                      ) : null}
                    </span>
                    {isSelected ? (
                      <span className="absolute right-4 top-4 rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-current">
                        Aktif
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </fieldset>

            <div className="mt-8 rounded-2xl border border-indigo-100 bg-white p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700">Detail Tes Seleksi & Daftar Ulang</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                    Jadwal, lokasi, nilai, dan batas daftar ulang. Info ini tampil di portal wali & dikirim lewat WA saat status dipilih.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleSaveTestInfo()}
                  disabled={isSavingTest}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isSavingTest ? <Loader2 size={14} className="animate-spin" /> : null}
                  Simpan Detail
                </button>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Jadwal Tes</label>
                  <input
                    type="datetime-local"
                    value={testDate}
                    onChange={(event) => setTestDate(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Lokasi Tes</label>
                  <input
                    type="text"
                    value={testLocation}
                    onChange={(event) => setTestLocation(event.target.value)}
                    placeholder="Contoh: Aula Pesantren Al-Maa"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Nilai Tes (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={testScore}
                    onChange={(event) => setTestScore(event.target.value)}
                    placeholder="Diisi setelah tes berjalan"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Batas Daftar Ulang</label>
                  <input
                    type="datetime-local"
                    value={reRegDeadline}
                    onChange={(event) => setReRegDeadline(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Catatan Tes</label>
                  <textarea
                    rows={2}
                    value={testNote}
                    onChange={(event) => setTestNote(event.target.value)}
                    placeholder="Contoh: Bawa alat tulis & dokumen asli. Hubungi panitia jika berhalangan."
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs font-semibold leading-6 text-slate-500">
              Pilih salah satu status. Perubahan akan tersimpan otomatis setelah pilihan diganti.
            </p>

            <div className="mt-6 rounded-2xl border border-rose-100 bg-white p-5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Alasan Penolakan (wajib saat menolak, dikirim ke wali)
              </label>
              <textarea
                rows={3}
                value={rejectionNote}
                onChange={(event) => setRejectionNote(event.target.value)}
                placeholder="Contoh: Berkas ijazah tidak sesuai persyaratan, mohon lengkapi."
                aria-label="Alasan penolakan pendaftaran"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10"
              />
              {rejectionNote.trim() && registration.status !== 'rejected' ? (
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Alasan ini akan terkirim begitu status Ditolak dipilih.
                </p>
              ) : null}
              {registration.status === 'rejected' ? (
                <p className="mt-2 text-xs font-bold text-rose-600">
                  Alasan terakhir terkirim: {registration.rejection_note?.trim() || 'Belum ada catatan penolakan.'}
                </p>
              ) : null}
            </div>

            {['re_registration', 'accepted'].includes(registration.status) && paymentStatus === 'paid' ? (
              <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">Langkah Akhir</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-sky-900">
                      {registration.status === 'accepted' ? 'Calon santri dinyatakan lulus dan pembayaran lunas. Pindahkan ke data santri untuk mengelola presensi, SPP & iuran.' : 'Daftar ulang selesai. Pindahkan pendaftar ke data santri untuk mengelola presensi, SPP & iuran.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleAcceptToSantri()}
                    disabled={isAccepting}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:opacity-60"
                  >
                    {isAccepting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                    {isAccepting ? 'Memindahkan...' : 'Terima & Pindahkan ke Santri'}
                  </button>
                </div>
              </div>
            ) : null}
         </div>

         <div className="mt-10 bg-white border border-slate-200 rounded-xl p-8">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <FileText size={16} />
              Berkas & Dokumen Pendaftar
            </label>
            <div className="space-y-4">
              {[
                { label: 'Kartu Keluarga', value: registration.kk_url },
                { label: 'Ijazah/Surat Kelulusan', value: registration.ijazah_url },
                { label: 'Pas Foto', value: registration.pasfoto_url },
                ...(registration.category === 'yatim' ? [{ label: 'Surat Keterangan Kematian', value: registration.yatim_doc_url }] : []),
                ...(registration.category === 'dhuafa' ? [{ label: 'SKTM', value: registration.sktm_doc_url }] : []),
              ].map((doc) => {
                const url = getDocumentUrl(doc.value);
                const hasFile = Boolean(url);
                return (
                  <div key={doc.label} className="rounded-xl border border-slate-100 bg-slate-50 px-6 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-sky-600 shadow-sm shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{doc.label}</p>
                        <p className={`text-sm font-bold ${hasFile ? 'text-slate-900' : 'text-slate-400'}`}>
                          {getDocumentName(doc.value)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {hasFile ? (
                        <>
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest hover:border-sky-300 hover:text-sky-700 transition-colors"
                          >
                            <Eye size={14} /> Preview
                          </a>
                          <a
                            href={url}
                            download
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-black uppercase tracking-widest hover:bg-sky-700 transition-colors"
                          >
                            <Download size={14} /> Unduh
                          </a>
                        </>
                      ) : (
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400 px-4 py-2 rounded-xl bg-white border border-dashed border-slate-200">
                          Tidak Ada
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
         </div>
      </div>
    </>
  );
}
