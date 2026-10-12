'use client';

// Form bersama tambah & ubah pegawai (jilid 4 + field foto jilid 5):
// label asosiatif, validasi inline + aria-invalid, upload foto 5MB.

import React, { useState } from 'react';
import { Camera, RefreshCw, Save, Trash2 } from 'lucide-react';
import { resolveDisplayImageUrl, uploadImage } from '@/lib/api';
import { useToast } from '@/components/Toast';

export type EmployeeFormData = {
  code: string;
  name: string;
  gender: string;
  phone: string;
  email: string;
  kind: string;
  photo_url: string;
};

export type EmployeeFormErrors = Partial<Record<keyof EmployeeFormData, string>>;

export const genderOptions = ['Laki-laki', 'Perempuan'];
export const kindOptions = ['Guru', 'Staf'];

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function validateEmployeeForm(data: EmployeeFormData): EmployeeFormErrors {
  const e: EmployeeFormErrors = {};
  if (!data.code.trim()) e.code = 'Kode pegawai wajib diisi (contoh: PGW-001).';
  if (!data.name.trim()) e.name = 'Nama lengkap wajib diisi.';
  if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    e.email = 'Format email tidak valid.';
  }
  if (data.phone.trim() && !/^[0-9+\-\s]{8,16}$/.test(data.phone.trim())) {
    e.phone = 'Nomor HP 8–16 digit angka.';
  }
  return e;
}

type Props = {
  form: EmployeeFormData;
  errors: EmployeeFormErrors;
  saving: boolean;
  isEdit: boolean;
  submitLabel: string;
  onChange: (key: keyof EmployeeFormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function EmployeeForm({
  form, errors, saving, isEdit, submitLabel, onChange, onSubmit,
}: Props) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const photoDisplayUrl = resolveDisplayImageUrl(form.photo_url);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('error', 'File harus berupa gambar (JPG, PNG, atau WEBP).');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      showToast('error', 'Ukuran foto maksimal 5MB.');
      return;
    }
    setUploading(true);
    try {
      const up = await uploadImage(file);
      const url = up?.url || '';
      if (!url) throw new Error('URL foto tidak ditemukan setelah upload.');
      onChange('photo_url', url);
      showToast('success', 'Foto berhasil diunggah.');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Gagal mengunggah foto.');
    } finally {
      setUploading(false);
    }
  };

  const inputClass = (hasError?: string) =>
    `w-full rounded-xl border px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:ring-4 ${
      hasError
        ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-500/10'
        : 'border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500/10'
    }`;

  const err = (key: keyof EmployeeFormData) =>
    errors[key] ? (
      <p className="mt-1.5 text-xs font-bold text-rose-600" role="alert">{errors[key]}</p>
    ) : null;

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {photoDisplayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoDisplayUrl} alt={`Foto ${form.name || 'pegawai'}`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <Camera size={32} />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <RefreshCw size={22} className="animate-spin text-emerald-600" />
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-700">Foto Pegawai</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Opsional. JPG, PNG, atau WEBP, maksimal 5MB.</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700">
              <Camera size={14} />
              {photoDisplayUrl ? 'Ganti Foto' : 'Pilih Foto'}
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={handlePhotoSelect}
                className="sr-only"
              />
            </label>
            {photoDisplayUrl ? (
              <button
                type="button"
                onClick={() => onChange('photo_url', '')}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-widest text-rose-600 shadow-sm transition hover:bg-rose-50"
              >
                <Trash2 size={14} /> Hapus
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="emp-code" className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-700">
            Kode Pegawai <span className="text-rose-500">*</span>
          </label>
          <input
            id="emp-code"
            value={form.code}
            onChange={(e) => onChange('code', e.target.value)}
            disabled={isEdit}
            placeholder="Contoh: PGW-001"
            aria-invalid={!!errors.code}
            className={`${inputClass(errors.code)} disabled:bg-slate-100 disabled:text-slate-400`}
          />
          {isEdit
            ? <p className="mt-1.5 text-xs text-slate-400">Kode tidak dapat diubah.</p>
            : err('code')}
        </div>

        <div>
          <label htmlFor="emp-name" className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-700">
            Nama Lengkap <span className="text-rose-500">*</span>
          </label>
          <input
            id="emp-name"
            value={form.name}
            onChange={(e) => onChange('name', e.target.value)}
            autoComplete="name"
            placeholder="Nama lengkap pegawai"
            aria-invalid={!!errors.name}
            className={inputClass(errors.name)}
          />
          {err('name')}
        </div>

        <div>
          <label htmlFor="emp-gender" className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-700">
            Jenis Kelamin
          </label>
          <select id="emp-gender" value={form.gender} onChange={(e) => onChange('gender', e.target.value)} className={inputClass()}>
            {genderOptions.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="emp-kind" className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-700">
            Jenis
          </label>
          <select id="emp-kind" value={form.kind} onChange={(e) => onChange('kind', e.target.value)} className={inputClass()}>
            {kindOptions.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-slate-400">Guru = mengajar; Staf = non-pengajar (TU, dapur, keamanan, dsb). Profil publik pengajar dikelola di menu Pengajar.</p>
        </div>

        <div>
          <label htmlFor="emp-phone" className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-700">
            No. HP
          </label>
          <input
            id="emp-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            autoComplete="tel"
            inputMode="tel"
            placeholder="Contoh: 081234567890"
            aria-invalid={!!errors.phone}
            className={inputClass(errors.phone)}
          />
          {err('phone')}
        </div>

        <div>
          <label htmlFor="emp-email" className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-700">
            Email
          </label>
          <input
            id="emp-email"
            type="email"
            value={form.email}
            onChange={(e) => onChange('email', e.target.value)}
            autoComplete="email"
            placeholder="nama@email.com"
            aria-invalid={!!errors.email}
            className={inputClass(errors.email)}
          />
          {err('email')}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
        <button
          type="submit"
          disabled={saving || uploading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Menyimpan…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
