'use client';

import React, { useState, useEffect } from 'react';
import { getRegistrations, updatePSBStatus, Registration, resolveDisplayImageUrl } from '@/lib/api';
import { useToast } from '@/components/Toast';
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
  Download
} from 'lucide-react';
import Link from 'next/link';

export default function PSBDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const fetchRegistration = async () => {
        setIsLoading(true);
        const data = await getRegistrations();
        const found = data.find((r: Registration) => r.id === Number(id));
        setRegistration(found || null);
        setIsLoading(false);
      };

      void fetchRegistration();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!registration) return;

    if (registration.status === newStatus || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      const res = await updatePSBStatus(registration.id, newStatus);
      if (res.success) {
        showToast('success', `Status pendaftaran berhasil diubah ke ${newStatus.toUpperCase()}`);
        setRegistration({ ...registration, status: newStatus });
        return;
      }

      showToast('error', 'Gagal memperbarui status.');
    } finally {
      setIsUpdatingStatus(false);
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
      case 'accepted': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'review': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  if (isLoading) {
     return (
        <>
           <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 size={40} className="animate-spin text-emerald-500 mb-4" />
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
              <Link href="/admin/psb" className="text-emerald-600 font-bold hover:underline">Kembali ke Daftar</Link>
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
      : registration.status === 'rejected'
        ? 'Ditolak'
        : 'Menunggu';

  const statusOptions = [
    {
      value: 'pending',
      label: 'Menunggu',
      description: 'Data masuk dan belum mulai diperiksa.',
      icon: <Clock size={18} />,
      selectedClass: 'border-amber-300 bg-amber-50 text-amber-700 shadow-[0_18px_44px_-32px_rgba(245,158,11,0.7)]',
      radioClass: 'border-amber-500 text-amber-500',
    },
    {
      value: 'review',
      label: 'Review Berkas',
      description: 'Berkas sedang dicek oleh admin PSB.',
      icon: <Clock size={18} />,
      selectedClass: 'border-blue-300 bg-blue-50 text-blue-700 shadow-[0_18px_44px_-32px_rgba(59,130,246,0.7)]',
      radioClass: 'border-blue-500 text-blue-500',
    },
    {
      value: 'rejected',
      label: 'Ditolak',
      description: 'Pendaftaran belum dapat diterima.',
      icon: <XCircle size={18} />,
      selectedClass: 'border-rose-300 bg-rose-50 text-rose-700 shadow-[0_18px_44px_-32px_rgba(244,63,94,0.7)]',
      radioClass: 'border-rose-500 text-rose-500',
    },
    {
      value: 'accepted',
      label: 'Diterima',
      description: 'Calon santri dinyatakan diterima.',
      icon: <CheckCircle size={18} />,
      selectedClass: 'border-emerald-300 bg-emerald-50 text-emerald-700 shadow-[0_18px_44px_-32px_rgba(16,185,129,0.7)]',
      radioClass: 'border-emerald-500 text-emerald-500',
    },
  ];

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
         <Link href="/admin/psb" className="flex items-center gap-2 text-slate-500 hover:text-emerald-700 transition-colors font-bold uppercase tracking-widest text-xs">
            <ArrowLeft size={16} /> Kembali ke Daftar Registrasi
         </Link>
      </div>

      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight">Detail Pendaftar Calon Santri</h1>
        <p className="text-slate-500 text-sm">Verifikasi data berkas dan ubah status kelolosan penerimaan santri baru.</p>
      </div>

      <div className="bg-white p-8 lg:p-12 border border-slate-200 rounded-xl shadow-sm max-w-4xl">
         <div className="flex items-center gap-6 mb-12">
            <div className="w-24 h-24 bg-emerald-50 rounded-xl flex items-center justify-center text-4xl font-black text-emerald-600 shadow-inner">
               {registration.full_name.charAt(0)}
            </div>
            <div>
               <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{registration.full_name}</h2>
               <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-lg">ID: #PSB-{registration.id.toString().padStart(4, '0')}</span>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-lg">Gender: {registration.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}</span>
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
                     <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">Tempat, Tgl Lahir</label>
                     <p className="font-bold text-slate-900 text-lg">{registration.birth_place}, {registration.birth_date}</p>
                  </div>
               </div>
               
               <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                     <GraduationCap size={24} />
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">Asal Sekolah & Program</label>
                     <p className="font-bold text-slate-900 text-lg">{registration.school_origin}</p>
                     <p className="mt-1 text-sm font-semibold text-slate-500">{registration.program_choice || '-'}</p>
                  </div>
               </div>
            </div>

            <div className="space-y-8">
               <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                     <User size={24} />
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">Kontak Utama Wali</label>
                     <p className="font-bold text-slate-900 text-lg">{guardianName}</p>
                     <p className="mt-1 text-sm font-semibold text-slate-500">{registration.father_job || 'Wali utama pendaftaran'}</p>
                  </div>
               </div>
               
               <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">
                     <Phone size={24} />
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">WhatsApp Kontak</label>
                     <p className="font-black text-emerald-700 text-lg">{guardianPhone}</p>
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

            <fieldset className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" disabled={isUpdatingStatus}>
              <legend className="sr-only">Pilih status pendaftaran santri</legend>
              {statusOptions.map((option) => {
                const isSelected = registration.status === option.value;

                return (
                  <label
                    key={option.value}
                    className={`relative flex cursor-pointer items-start gap-4 rounded-2xl border p-5 pr-16 transition-all ${
                      isSelected
                        ? option.selectedClass
                        : 'border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50'
                    } ${isUpdatingStatus ? 'pointer-events-none opacity-70' : ''}`}
                  >
                    <input
                      type="radio"
                      name="registration-status"
                      value={option.value}
                      checked={isSelected}
                      disabled={isUpdatingStatus}
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

            <p className="mt-4 text-xs font-semibold leading-6 text-slate-500">
              Pilih salah satu status. Perubahan akan tersimpan otomatis setelah pilihan diganti.
            </p>
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
              ].map((doc) => {
                const url = getDocumentUrl(doc.value);
                const hasFile = Boolean(url);
                return (
                  <div key={doc.label} className="rounded-xl border border-slate-100 bg-slate-50 px-6 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
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
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest hover:border-emerald-300 hover:text-emerald-700 transition-colors"
                          >
                            <Eye size={14} /> Preview
                          </a>
                          <a
                            href={url}
                            download
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors"
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
