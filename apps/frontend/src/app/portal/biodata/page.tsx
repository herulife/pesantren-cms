'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, PencilLine, RefreshCw, Save } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/components/AuthProvider';
import { getMyPSBRegistration, saveMyPSBRegistration } from '@/lib/api';

type BiodataForm = {
  full_name: string;
  nickname: string;
  gender: string;
  nik: string;
  birth_place: string;
  birth_date: string;
  address: string;
  school_origin: string;
  program_choice: string;
  jenjang: string;
  category: string;
  father_name: string;
  father_job: string;
  father_phone: string;
  mother_name: string;
  mother_job: string;
  mother_phone: string;
};

const initialForm: BiodataForm = {
  full_name: '',
  nickname: '',
  gender: '',
  nik: '',
  birth_place: '',
  birth_date: '',
  address: '',
  school_origin: '',
  program_choice: '',
  jenjang: '',
  category: 'reguler',
  father_name: '',
  father_job: '',
  father_phone: '',
  mother_name: '',
  mother_job: '',
  mother_phone: '',
};

const dataDiriFields: Array<keyof BiodataForm> = [
  'full_name',
  'gender',
  'nik',
  'birth_place',
  'birth_date',
  'address',
  'school_origin',
];

const dataOrangTuaFields: Array<keyof BiodataForm> = [
  'father_name',
  'father_job',
  'father_phone',
  'mother_name',
  'mother_job',
  'mother_phone',
];

function isFilled(value: string) {
  return Boolean(value.trim());
}

function isDataDiriComplete(formData: BiodataForm) {
  return dataDiriFields.every((field) => isFilled(formData[field]));
}

function isDataOrangTuaComplete(formData: BiodataForm) {
  return dataOrangTuaFields.every((field) => isFilled(formData[field]));
}

function isBiodataComplete(formData: BiodataForm) {
  return isDataDiriComplete(formData) && isDataOrangTuaComplete(formData);
}

function validateDataDiri(form: BiodataForm): Partial<Record<keyof BiodataForm, string>> {
  const e: Partial<Record<keyof BiodataForm, string>> = {};
  if (!isFilled(form.full_name)) e.full_name = 'Nama lengkap wajib diisi';
  if (!isFilled(form.gender)) e.gender = 'Pilih jenis kelamin';
  if (!/^[0-9]{16}$/.test(form.nik.trim())) e.nik = 'NIK harus 16 digit angka';
  if (!isFilled(form.birth_place)) e.birth_place = 'Tempat lahir wajib diisi';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.birth_date.trim())) e.birth_date = 'Tanggal lahir wajib YYYY-MM-DD';
  if (!isFilled(form.address)) e.address = 'Alamat wajib diisi';
  if (!isFilled(form.school_origin)) e.school_origin = 'Asal sekolah wajib diisi';
  return e;
}

function validateDataOrangTua(form: BiodataForm): Partial<Record<keyof BiodataForm, string>> {
  const e: Partial<Record<keyof BiodataForm, string>> = {};
  if (!isFilled(form.father_name)) e.father_name = 'Nama ayah wajib diisi';
  if (!isFilled(form.mother_name)) e.mother_name = 'Nama ibu wajib diisi';
  const phoneRe = /^[0-9+\-\s]{8,15}$/;
  const clean = (v: string) => v.replace(/[\s\-]/g, '').replace(/^\+/, '');
  if (!phoneRe.test(form.father_phone.trim()) || clean(form.father_phone).length < 8) e.father_phone = 'No HP ayah 8-15 digit';
  if (!phoneRe.test(form.mother_phone.trim()) || clean(form.mother_phone).length < 8) e.mother_phone = 'No HP ibu 8-15 digit';
  return e;
}

export default function BiodataPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-10">
          <RefreshCw className="animate-spin text-sky-600" />
        </div>
      }
    >
      <BiodataPageContent />
    </Suspense>
  );
}

function BiodataPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partParam = searchParams.get('part');
  const { showToast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<BiodataForm>(initialForm);
  const [isEditMode, setIsEditMode] = useState(true);
  const [hasSavedBiodata, setHasSavedBiodata] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof BiodataForm, string>>>({});
  const [part, setPart] = useState<1 | 2>(1);

  useEffect(() => {
    if (partParam === '2') setPart(2);
    else if (partParam === '1') setPart(1);
  }, [partParam]);

  useEffect(() => {
    const fetchRegistration = async () => {
      setIsLoading(true);
      try {
        const data = await getMyPSBRegistration();
        const nextForm = {
          full_name: data?.full_name || user?.name || '',
          nickname: data?.nickname || '',
          gender: data?.gender || '',
          nik: data?.nik || '',
          birth_place: data?.birth_place || '',
          birth_date: data?.birth_date || '',
          address: data?.address || '',
          school_origin: data?.school_origin || '',
          program_choice: (data?.program_choice || '').trim().toLowerCase(),
          jenjang: (data?.jenjang || '').trim().toLowerCase(),
          category: data?.category || 'reguler',
          father_name: data?.father_name || data?.parent_name || '',
          father_job: data?.father_job || '',
          father_phone: data?.father_phone || data?.parent_phone || '',
          mother_name: data?.mother_name || '',
          mother_job: data?.mother_job || '',
          mother_phone: data?.mother_phone || '',
        };
        const hasExistingRegistration = Boolean(data?.id);
        const completed = isBiodataComplete(nextForm);
        const diriDone = isDataDiriComplete(nextForm);

        let initialPart: 1 | 2 = diriDone ? 2 : 1;
        if (partParam === '2') initialPart = 2;
        else if (partParam === '1') initialPart = 1;

        setFormData(nextForm);
        setHasSavedBiodata(hasExistingRegistration);
        setIsEditMode(!hasExistingRegistration || !completed);
        setPart(initialPart);
        setSavedMessage(
          hasExistingRegistration && completed
            ? 'Biodata sudah tersimpan dengan baik. Form kami lipat dulu supaya kamu tidak perlu mengecek ulang semuanya terus-menerus.'
            : '',
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchRegistration();
  }, [user?.name]);

  const handleChange = (key: keyof BiodataForm, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const submitPart = (targetPart: 1 | 2) => {
    setErrors((prev) => {
      const next = { ...prev };
      const keys: Array<keyof BiodataForm> = targetPart === 1 ? [...dataDiriFields, 'nickname'] : dataOrangTuaFields;
      keys.forEach((key) => {
        delete next[key];
      });
      return next;
    });
    if (targetPart === 2) {
      router.replace('/portal/biodata?part=2', { scroll: false });
    } else {
      router.replace('/portal/biodata?part=1', { scroll: false });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nativeEvent = e.nativeEvent as SubmitEvent;
    const submitter = nativeEvent.submitter as HTMLButtonElement | null;
    const shouldContinue = submitter?.value === 'continue';

    const validation = part === 1 ? validateDataDiri(formData) : validateDataOrangTua(formData);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      showToast('error', 'Periksa kembali isian yang ditandai merah');
      requestAnimationFrame(() => {
        const firstInvalid = document.querySelector('[aria-invalid="true"]') as HTMLElement | null;
        firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid?.focus({ preventScroll: true });
      });
      return;
    }
    setErrors({});
    setIsSaving(true);

    try {
      await saveMyPSBRegistration(formData);
      setHasSavedBiodata(true);
      setIsEditMode(false);
      if (shouldContinue && part === 1) {
        showToast('success', 'Data diri berhasil disimpan. Lanjut ke data orang tua.');
        router.replace('/portal/biodata?part=2', { scroll: false });
        return;
      }
      if (shouldContinue && part === 2) {
        showToast('success', 'Biodata berhasil disimpan. Lanjut memilih program & jenjang.');
        router.push('/portal/program');
        return;
      }
      setSavedMessage('Biodata berhasil disimpan. Kamu bisa lanjut ke langkah berikutnya atau kembali edit kalau ada yang perlu diperbaiki.');
      showToast('success', 'Biodata PSB berhasil disimpan.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan biodata PSB.';
      showToast('error', message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <RefreshCw className="animate-spin text-sky-600" />
      </div>
    );
  }

  const diriDoneNow = isDataDiriComplete(formData);
  const ortuDoneNow = isDataOrangTuaComplete(formData);

  return (
    <>
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-outfit text-2xl font-black uppercase tracking-tight text-slate-900 lg:text-3xl">
            {part === 1 ? 'Data Siswa Calon Santri' : 'Data Orang Tua / Wali'}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            {part === 1
              ? 'Isi identitas calon santri dengan benar sesuai dokumen resmi.'
              : 'Lengkapi data ayah dan ibu agar panitia bisa menghubungi wali santri.'}
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">
          Langkah 1 dari 2 {part === 1 ? '— Data Siswa' : '— Data Orang Tua'}
        </span>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => submitPart(1)}
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
            part === 1
              ? 'border-sky-200 bg-sky-50 text-sky-700'
              : diriDoneNow
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
          }`}
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
              part === 1
                ? 'bg-sky-600 text-white'
                : diriDoneNow
                  ? 'bg-emerald-500 text-white'
                  : 'border border-slate-200 bg-white text-slate-400'
            }`}
          >
            {diriDoneNow && part !== 1 ? <CheckCircle2 size={16} /> : 1}
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-black uppercase tracking-widest">Data Siswa</span>
            <span className={`block truncate text-[11px] font-medium ${diriDoneNow || part === 1 ? 'opacity-80' : 'opacity-60'}`}>
              {diriDoneNow ? 'Selesai diisi' : 'Identitas calon santri'}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => submitPart(2)}
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
            part === 2
              ? 'border-sky-200 bg-sky-50 text-sky-700'
              : ortuDoneNow
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
          }`}
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
              part === 2
                ? 'bg-sky-600 text-white'
                : ortuDoneNow
                  ? 'bg-emerald-500 text-white'
                  : 'border border-slate-200 bg-white text-slate-400'
            }`}
          >
            {ortuDoneNow && part !== 2 ? <CheckCircle2 size={16} /> : 2}
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-black uppercase tracking-widest">Data Orang Tua</span>
            <span className={`block truncate text-[11px] font-medium ${ortuDoneNow || part === 2 ? 'opacity-80' : 'opacity-60'}`}>
              {ortuDoneNow ? 'Selesai diisi' : 'Data ayah & ibu'}
            </span>
          </span>
        </button>
      </div>

      {hasSavedBiodata ? (
        <div className="mb-8 rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
          <p className="text-sm font-semibold leading-relaxed">
            Kamu sedang melengkapi biodata yang sudah tersimpan sebagian. Setelah selesai, simpan lagi agar ringkasan dan data panitia ikut diperbarui.
          </p>
        </div>
      ) : null}

      {!isEditMode && hasSavedBiodata && isBiodataComplete(formData) ? (
        <div className="space-y-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="rounded-[2rem] border border-sky-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-sky-100 p-3 text-sky-600">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-600">Biodata Tersimpan</p>
                  <h4 className="mt-2 font-outfit text-2xl font-black uppercase tracking-tight text-slate-900">
                    Form Tidak Perlu Aktif Terus
                  </h4>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                    {savedMessage || 'Biodata kamu sudah masuk ke database. Supaya tidak membingungkan dan tidak berubah tanpa sengaja, halaman ini sekarang tampil sebagai ringkasan dulu.'}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Kalau ada data yang perlu diperbaiki, tinggal tekan <span className="font-bold text-slate-700">Edit Biodata</span>. Kalau sudah benar, lanjutkan memilih program & jenjang.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Langkah Berikutnya</p>
              <h4 className="mt-2 font-outfit text-xl font-black uppercase tracking-tight text-slate-900">
                Lanjut ke Program & Jenjang
              </h4>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Setelah biodata aman, pilih jenjang (SMP/SMK) dan program unggulan (Tahfidz atau Bahasa) agar panitia bisa menempatkan santri di kelas yang tepat.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/portal/program"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-500"
                >
                  Pilih Program & Jenjang <ArrowRight size={16} />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsEditMode(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <PencilLine size={16} /> Edit Biodata
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className={`inline-flex rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] border-sky-100 bg-sky-50 text-sky-700`}>
                Data Calon Santri
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Nama Lengkap', value: formData.full_name || '-' },
                  { label: 'Nama Panggilan', value: formData.nickname || '-' },
                  { label: 'Jenis Kelamin', value: formData.gender === 'L' ? 'Laki-laki' : formData.gender === 'P' ? 'Perempuan' : '-' },
                  { label: 'NIK', value: formData.nik || '-' },
                  { label: 'Tempat, Tanggal Lahir', value: [formData.birth_place, formData.birth_date].filter(Boolean).join(', ') || '-' },
                  { label: 'Asal Sekolah', value: formData.school_origin || '-' },
                  { label: 'Alamat Lengkap', value: formData.address || '-' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">{item.label}</p>
                    <p className={`mt-2 text-sm font-bold leading-6 ${item.value === '-' ? 'text-slate-400' : 'text-slate-800'}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className={`inline-flex rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] border-sky-100 bg-sky-50 text-sky-700`}>
                Data Orang Tua
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Nama Ayah', value: formData.father_name || '-' },
                  { label: 'Pekerjaan Ayah', value: formData.father_job || '-' },
                  { label: 'No. HP Ayah', value: formData.father_phone || '-' },
                  { label: 'Nama Ibu', value: formData.mother_name || '-' },
                  { label: 'Pekerjaan Ibu', value: formData.mother_job || '-' },
                  { label: 'No. HP Ibu', value: formData.mother_phone || '-' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">{item.label}</p>
                    <p className={`mt-2 text-sm font-bold leading-6 ${item.value === '-' ? 'text-slate-400' : 'text-slate-800'}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {(isEditMode || !hasSavedBiodata || !isBiodataComplete(formData)) ? (
        <form onSubmit={handleSubmit} className="space-y-8">
          {part === 1 ? (
            <div className="space-y-6">
              <div className="mb-4 flex gap-4 rounded-3xl border border-sky-100 bg-sky-50 p-6 text-sky-800">
                <AlertCircle className="mt-1 shrink-0 text-sky-500" />
                <p className="text-sm font-medium leading-relaxed">
                  Nama lengkap akan otomatis mengikuti akun portal saat biodata pertama kali dibuat, tetapi tetap bisa disesuaikan di formulir ini jika perlu mengikuti dokumen resmi.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-700">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    autoComplete="name"
                    aria-invalid={!!errors.full_name}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-700">Nama Panggilan</label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => handleChange('nickname', e.target.value)}
                    aria-invalid={!!errors.nickname}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                    placeholder="Contoh: Ahmad"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-700">Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                    required
                  >
                    <option value="">Pilih jenis kelamin</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-700">NIK <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={formData.nik}
                    onChange={(e) => handleChange('nik', e.target.value)}
                    aria-invalid={!!errors.nik}
                    aria-describedby={errors.nik ? 'err-nik' : undefined}
                    className={`w-full rounded-2xl border px-5 py-4 font-bold outline-none transition-all focus:ring-4 ${errors.nik ? 'border-rose-300 bg-rose-50 text-rose-900 focus:border-rose-400 focus:ring-rose-500/10' : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-sky-500 focus:ring-sky-500/10'}`}
                    placeholder="16 digit NIK"
                    maxLength={16}
                    required
                  />
                  {errors.nik ? <p id="err-nik" className="mt-1 text-xs font-bold text-rose-600">{errors.nik}</p> : null}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-700">Tempat Lahir</label>
                  <input
                    type="text"
                    value={formData.birth_place}
                    onChange={(e) => handleChange('birth_place', e.target.value)}
                    aria-invalid={!!errors.birth_place}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-700">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => handleChange('birth_date', e.target.value)}
                    autoComplete="bday"
                    aria-invalid={!!errors.birth_date}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-700">Asal Sekolah</label>
                  <input
                    type="text"
                    value={formData.school_origin}
                    onChange={(e) => handleChange('school_origin', e.target.value)}
                    aria-invalid={!!errors.school_origin}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-700">Alamat Lengkap</label>
                  <textarea
                    rows={3}
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    autoComplete="street-address"
                    aria-invalid={!!errors.address}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800 outline-none transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                    required
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                  <h5 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-500">Informasi Ayah</h5>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input type="text" value={formData.father_name} onChange={(e) => handleChange('father_name', e.target.value)}
                    autoComplete="name"
                    aria-invalid={!!errors.father_name} placeholder="Nama Lengkap Ayah" className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold text-slate-800 outline-none" required />
                    <input type="text" value={formData.father_job} onChange={(e) => handleChange('father_job', e.target.value)}
                    aria-invalid={!!errors.father_job} placeholder="Pekerjaan Ayah" className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold text-slate-800 outline-none" required />
                    <input type="tel" value={formData.father_phone} onChange={(e) => handleChange('father_phone', e.target.value)}
                    autoComplete="tel"
                    aria-invalid={!!errors.father_phone} placeholder="No. HP / WhatsApp Ayah" className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold text-slate-800 outline-none md:col-span-2" required />
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                  <h5 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-500">Informasi Ibu</h5>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input type="text" value={formData.mother_name} onChange={(e) => handleChange('mother_name', e.target.value)}
                    autoComplete="name"
                    aria-invalid={!!errors.mother_name} placeholder="Nama Lengkap Ibu" className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold text-slate-800 outline-none" required />
                    <input type="text" value={formData.mother_job} onChange={(e) => handleChange('mother_job', e.target.value)}
                    aria-invalid={!!errors.mother_job} placeholder="Pekerjaan Ibu" className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold text-slate-800 outline-none" required />
                    <input type="tel" value={formData.mother_phone} onChange={(e) => handleChange('mother_phone', e.target.value)}
                    autoComplete="tel"
                    aria-invalid={!!errors.mother_phone} placeholder="No. HP / WhatsApp Ibu" className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold text-slate-800 outline-none md:col-span-2" required />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 pt-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {part === 2 ? (
                <button
                  type="button"
                  onClick={() => submitPart(1)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 md:w-auto"
                >
                  <ArrowLeft size={18} /> Kembali ke Data Siswa
                </button>
              ) : (
                <span className="hidden md:block" />
              )}

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
                <button
                  type="submit"
                  value="save"
                  disabled={isSaving}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-sky-200 bg-white px-6 py-4 text-xs font-black uppercase tracking-widest text-sky-700 transition hover:border-sky-300 hover:bg-sky-50 disabled:opacity-70 md:w-auto"
                >
                  {isSaving ? 'Menyimpan...' : <><Save size={18} /> Simpan</>}
                </button>
                <button
                  type="submit"
                  value="continue"
                  disabled={isSaving}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 px-10 py-5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-sky-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-sky-600/35 disabled:opacity-70 md:w-auto"
                >
                  {isSaving
                    ? 'Menyimpan...'
                    : part === 1
                      ? <>Simpan & Lanjut ke Data Orang Tua <ArrowRight size={18} /></>
                      : <>Simpan & Lanjut ke Program & Jenjang <ArrowRight size={18} /></>}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : null}
    </>
  );
}