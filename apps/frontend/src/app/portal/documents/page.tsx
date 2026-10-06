'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, FileText, RefreshCw, ShieldCheck, UploadCloud } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { getMyPSBRegistration, saveMyPSBDocuments, uploadPrivateDocument } from '@/lib/api';

type DocumentKey = 'kk_url' | 'ijazah_url' | 'pasfoto_url';
type DocumentStatus = 'idle' | 'uploading' | 'success' | 'error';

export default function DocumentsPage() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState<DocumentKey | ''>('');
  const [isBiodataReady, setIsBiodataReady] = useState(false);
  const [documents, setDocuments] = useState<Record<DocumentKey, string>>({
    kk_url: '',
    ijazah_url: '',
    pasfoto_url: '',
  });
  const [documentStatus, setDocumentStatus] = useState<Record<DocumentKey, DocumentStatus>>({
    kk_url: 'idle',
    ijazah_url: 'idle',
    pasfoto_url: 'idle',
  });
  const [documentNotes, setDocumentNotes] = useState<Record<DocumentKey, string>>({
    kk_url: '',
    ijazah_url: '',
    pasfoto_url: '',
  });

  useEffect(() => {
    const fetchRegistration = async () => {
      setIsLoading(true);
      try {
        const data = await getMyPSBRegistration();
        const requiredBiodataFields = [
          data?.full_name,
          data?.gender,
          data?.nik,
          data?.birth_place,
          data?.birth_date,
          data?.address,
          data?.school_origin,
          data?.program_choice,
          data?.father_name,
          data?.father_job,
          data?.father_phone,
          data?.mother_name,
          data?.mother_job,
          data?.mother_phone,
        ];

        setIsBiodataReady(requiredBiodataFields.every((value) => Boolean(value && String(value).trim())));
        setDocuments({
          kk_url: data?.kk_url || '',
          ijazah_url: data?.ijazah_url || '',
          pasfoto_url: data?.pasfoto_url || '',
        });
        setDocumentStatus({
          kk_url: data?.kk_url ? 'success' : 'idle',
          ijazah_url: data?.ijazah_url ? 'success' : 'idle',
          pasfoto_url: data?.pasfoto_url ? 'success' : 'idle',
        });
        setDocumentNotes({
          kk_url: data?.kk_url ? 'Dokumen sudah tersimpan di server.' : '',
          ijazah_url: data?.ijazah_url ? 'Dokumen sudah tersimpan di server.' : '',
          pasfoto_url: data?.pasfoto_url ? 'Dokumen sudah tersimpan di server.' : '',
        });
      } finally {
        setIsLoading(false);
      }
    };

    void fetchRegistration();
  }, []);

  const handleUpload = async (type: DocumentKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isBiodataReady) {
      showToast('error', 'Lengkapi biodata PSB terlebih dahulu sebelum unggah dokumen.');
      e.target.value = '';
      return;
    }

    setIsUploading(type);
    setDocumentStatus((prev) => ({ ...prev, [type]: 'uploading' }));
    setDocumentNotes((prev) => ({ ...prev, [type]: `Sedang mengunggah ${file.name}...` }));
    try {
      const uploadResult = await uploadPrivateDocument(file);
      const url = uploadResult?.url || uploadResult?.data?.url || '';
      if (!url) {
        throw new Error('URL dokumen tidak ditemukan setelah upload.');
      }

      const nextDocuments = { ...documents, [type]: url };
      await saveMyPSBDocuments(nextDocuments);
      setDocuments(nextDocuments);
      setDocumentStatus((prev) => ({ ...prev, [type]: 'success' }));
      setDocumentNotes((prev) => ({ ...prev, [type]: `${file.name} berhasil disimpan.` }));
      showToast('success', 'Dokumen berhasil diunggah.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengunggah dokumen.';
      setDocumentStatus((prev) => ({ ...prev, [type]: 'error' }));
      setDocumentNotes((prev) => ({ ...prev, [type]: message }));
      showToast('error', message);
    } finally {
      setIsUploading('');
      e.target.value = '';
    }
  };

  const docItems = [
    { id: 'kk_url', title: 'Kartu Keluarga (KK)', desc: 'Scan asli berwarna, ukuran maksimal 2MB (JPG/PNG/PDF).' },
    { id: 'ijazah_url', title: 'Ijazah / Raport Terakhir', desc: 'Scan asli ijazah, SKL, atau raport terbaru.' },
    { id: 'pasfoto_url', title: 'Pas Foto 3x4', desc: 'Latar belakang merah, ukuran maksimal 1MB.' },
  ] as const;
  const uploadedCount = docItems.filter((doc) => Boolean(documents[doc.id])).length;
  const allDocumentsUploaded = uploadedCount === docItems.length;

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
        <h3 className="lte-page-title">Unggah Dokumen</h3>
        <p className="lte-page-subtitle">
          Unggah dokumen persyaratan PSB. Dokumen yang sudah masuk akan langsung terhubung ke akun pendaftaran kamu.
        </p>
      </div>

      <div className="lte-alert lte-alert-success mb-4 flex items-start gap-3">
        <ShieldCheck className="mt-0.5 shrink-0" />
        <p className="text-sm font-medium leading-relaxed">
          Pastikan biodata sudah tersimpan sebelum mengunggah dokumen. File akan dikirim ke server dan dibaca panitia dari dashboard PSB.
        </p>
      </div>

      {!isBiodataReady ? (
        <div className="lte-alert lte-alert-warning mb-4">
          <p className="text-sm font-semibold leading-relaxed">
            Biodata PSB kamu belum lengkap, jadi dokumen belum bisa diunggah. Lengkapi biodata dulu agar sistem bisa menyimpan dokumen ke akun pendaftaran yang benar.
          </p>
          <Link
            href="/portal/biodata"
            className="lte-btn lte-btn-warning"
          >
            Lengkapi Biodata
          </Link>
        </div>
      ) : null}

      <div className="space-y-6">
        {docItems.map((doc) => {
          const isUploaded = Boolean(documents[doc.id]);
          const isBusy = isUploading === doc.id;
          const status = documentStatus[doc.id];
          const statusText =
            status === 'uploading'
              ? 'Sedang mengunggah'
              : status === 'success'
                ? 'Sudah tersimpan'
                : status === 'error'
                  ? 'Upload bermasalah'
                  : 'Belum diunggah';
          const statusClass =
            status === 'uploading'
              ? 'lte-badge-soft-info'
              : status === 'success'
                ? 'lte-badge-soft-success'
                : status === 'error'
                  ? 'lte-badge-soft-danger'
                  : 'lte-badge-light';

          return (
            <div
              key={doc.id}
              className={`lte-card gap-6 md:flex-row md:items-center md:justify-between ${
                isUploaded ? 'lte-card-outline-success' : ''
              }`}
            >
              <div className="flex items-start gap-4 p-4">
                <div className={`mt-1 inline-flex rounded-lg p-2.5 ${isUploaded ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                  {isUploaded ? <CheckCircle2 size={22} /> : <FileText size={22} />}
                </div>
                <div>
                  <h5 className="mb-1 font-bold text-slate-900">{doc.title}</h5>
                  <p className="max-w-sm text-xs leading-relaxed text-slate-500">{doc.desc}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`lte-badge ${statusClass}`}>
                      {statusText}
                    </span>
                    {isUploaded ? (
                      <span className="lte-badge lte-badge-soft-success">
                        Dokumen sudah masuk
                      </span>
                    ) : null}
                  </div>
                  {documentNotes[doc.id] ? (
                    <p className={`mt-2 text-xs font-medium ${
                      status === 'error'
                        ? 'text-rose-600'
                        : status === 'uploading'
                          ? 'text-blue-600'
                          : 'text-slate-500'
                    }`}>
                      {documentNotes[doc.id]}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex w-full items-center justify-end gap-3 p-4 md:w-auto">
                <div className="relative">
                  <input
                    type="file"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => void handleUpload(doc.id, e)}
                    disabled={Boolean(isUploading) || !isBiodataReady}
                  />
                  <button
                    className={`lte-btn pointer-events-none ${
                      !isBiodataReady ? 'lte-btn-secondary' : 'lte-btn-outline-secondary'
                    }`}
                  >
                    {isBusy ? <RefreshCw size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                    {!isBiodataReady ? 'Lengkapi Biodata Dulu' : isBusy ? 'Mengunggah...' : isUploaded ? 'Ganti File' : 'Pilih File'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="lte-card mt-8">
        <div className="lte-card-header">
          <div className="min-w-0">
            <p className="lte-card-subtitle">Progress Dokumen</p>
            <h4 className="lte-card-title">
              <span className="lte-badge lte-badge-primary mr-2">{uploadedCount}/{docItems.length}</span>
              dokumen sudah tersimpan
            </h4>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              Setiap file yang kamu pilih langsung tersimpan otomatis. Jika ada dokumen yang salah, cukup unggah ulang file baru pada jenis dokumen yang sama.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <span
              className={`lte-badge w-fit ${
                allDocumentsUploaded ? 'lte-badge-soft-success' : 'lte-badge-soft-warning'
              }`}
            >
              {allDocumentsUploaded ? 'Dokumen Lengkap' : 'Masih Ada Yang Kurang'}
            </span>
            <Link
              href="/portal"
              className={`lte-btn w-fit ${
                allDocumentsUploaded ? 'lte-btn-success' : 'lte-btn-secondary'
              }`}
            >
              Simpan & Lanjutkan <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="lte-card-body border-t-0 pt-3 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Kalau dokumen belum muncul di dashboard panitia, pastikan biodata sudah tersimpan lebih dulu.
          </p>
        </div>
      </div>
    </>
  );
}
