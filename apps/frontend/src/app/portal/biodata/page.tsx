'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, Save } from 'lucide-react';
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
  father_name: '',
  father_job: '',
  father_phone: '',
  mother_name: '',
  mother_job: '',
  mother_phone: '',
};

export default function BiodataPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<BiodataForm>(initialForm);

  useEffect(() => {
    const fetchRegistration = async () => {
      setIsLoading(true);
      try {
        const data = await getMyPSBRegistration();
        setFormData({
          full_name: data?.full_name || user?.name || '',
          nickname: data?.nickname || '',
          gender: data?.gender || '',
          nik: data?.nik || '',
          birth_place: data?.birth_place || '',
          birth_date: data?.birth_date || '',
          address: data?.address || '',
          school_origin: data?.school_origin || '',
          program_choice: data?.program_choice || '',
          father_name: data?.father_name || data?.parent_name || '',
          father_job: data?.father_job || '',
          father_phone: data?.father_phone || data?.parent_phone || '',
          mother_name: data?.mother_name || '',
          mother_job: data?.mother_job || '',
          mother_phone: data?.mother_phone || '',
        });
      } finally {
        setIsLoading(false);
      }
    };

    void fetchRegistration();
  }, [user?.name]);

  const handleChange = (key: keyof BiodataForm, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await saveMyPSBRegistration(formData);
      showToast('success', 'Biodata PSB berhasil disimpan.');
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
        <RefreshCw className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <h3 className="mb-2 font-outfit text-3xl font-black uppercase tracking-tight text-slate-900">Biodata Calon Santri</h3>
      <p className="mb-10 max-w-xl text-sm leading-relaxed text-slate-500">
        Lengkapi data calon santri dan data orang tua. Biodata ini akan dibaca langsung oleh panitia PSB saat proses verifikasi.
      </p>

      <div className="mb-10 flex gap-4 rounded-3xl border border-blue-100 bg-blue-50 p-6 text-blue-800">
        <AlertCircle className="mt-1 shrink-0 text-blue-500" />
        <p className="text-sm font-medium leading-relaxed">
          Nama lengkap akan otomatis mengikuti akun portal saat biodata pertama kali dibuat, tetapi tetap bisa disesuaikan di formulir ini jika perlu mengikuti dokumen resmi.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <h4 className="flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-slate-800">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">1</span>
            Data Calon Santri
          </h4>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Nama Lengkap</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Nama Panggilan</label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => handleChange('nickname', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                placeholder="Contoh: Ahmad"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Jenis Kelamin</label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                required
              >
                <option value="">Pilih jenis kelamin</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">NIK</label>
              <input
                type="text"
                value={formData.nik}
                onChange={(e) => handleChange('nik', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                placeholder="16 digit NIK"
                maxLength={16}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Tempat Lahir</label>
              <input
                type="text"
                value={formData.birth_place}
                onChange={(e) => handleChange('birth_place', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Tanggal Lahir</label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleChange('birth_date', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Asal Sekolah</label>
              <input
                type="text"
                value={formData.school_origin}
                onChange={(e) => handleChange('school_origin', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Pilihan Program</label>
              <input
                type="text"
                value={formData.program_choice}
                onChange={(e) => handleChange('program_choice', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                placeholder="Contoh: Tahfidz Reguler"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Alamat Lengkap</label>
              <textarea
                rows={3}
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="flex items-center gap-2 border-b border-slate-100 pb-2 font-bold text-slate-800">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">2</span>
            Data Orang Tua
          </h4>

          <div className="grid grid-cols-1 gap-6">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
              <h5 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-500">Informasi Ayah</h5>
              <div className="grid gap-4 md:grid-cols-2">
                <input type="text" value={formData.father_name} onChange={(e) => handleChange('father_name', e.target.value)} placeholder="Nama Lengkap Ayah" className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold text-slate-800 outline-none" required />
                <input type="text" value={formData.father_job} onChange={(e) => handleChange('father_job', e.target.value)} placeholder="Pekerjaan Ayah" className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold text-slate-800 outline-none" required />
                <input type="tel" value={formData.father_phone} onChange={(e) => handleChange('father_phone', e.target.value)} placeholder="No. HP / WhatsApp Ayah" className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold text-slate-800 outline-none md:col-span-2" required />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
              <h5 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-500">Informasi Ibu</h5>
              <div className="grid gap-4 md:grid-cols-2">
                <input type="text" value={formData.mother_name} onChange={(e) => handleChange('mother_name', e.target.value)} placeholder="Nama Lengkap Ibu" className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold text-slate-800 outline-none" required />
                <input type="text" value={formData.mother_job} onChange={(e) => handleChange('mother_job', e.target.value)} placeholder="Pekerjaan Ibu" className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold text-slate-800 outline-none" required />
                <input type="tel" value={formData.mother_phone} onChange={(e) => handleChange('mother_phone', e.target.value)} placeholder="No. HP / WhatsApp Ibu" className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold text-slate-800 outline-none md:col-span-2" required />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <button
            type="submit"
            disabled={isSaving}
            className="ml-auto flex w-full items-center justify-center gap-3 rounded-full bg-blue-600 px-10 py-5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:opacity-70 md:w-auto"
          >
            {isSaving ? 'Menyimpan...' : <><Save size={18} /> Simpan Biodata</>}
          </button>
        </div>
      </form>
    </>
  );
}
