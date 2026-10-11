'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import SelectField, { type SelectOption } from '@/components/SelectField';
import { createSantri, getSantriByID, updateSantri, getSchoolClasses } from '@/lib/api';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

const genderOptions = [
  { value: '', label: 'Pilih Jenis Kelamin' },
  { value: 'l', label: 'Laki-laki' },
  { value: 'p', label: 'Perempuan' },
];

const statusOptions = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'lulus', label: 'Lulus' },
  { value: 'pindah', label: 'Pindah' },
  { value: 'cuti', label: 'Cuti' },
];

const categoryOptions = [
  { value: 'reguler', label: 'Reguler' },
  { value: 'yatim', label: 'Yatim' },
  { value: 'dhuafa', label: 'Duafa' },
];

type FormErrors = Record<string, string>;

const initialForm = {
  nis: '',
  name: '',
  nickname: '',
  gender: '',
  birth_place: '',
  birth_date: '',
  address: '',
  class: '',
  jenjang: '',
  angkatan: '',
  status: 'aktif',
  category: 'reguler',
  parent_name: '',
  parent_phone: '',
  father_name: '',
  father_phone: '',
  mother_name: '',
  mother_phone: '',
  father_occupation: '',
  mother_occupation: '',
  nik: '',
  photo_url: '',
};

export default function SantriFormPage() {
  return (
    <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-sky-500" size={40} /></div>}>
      <SantriFormContent />
    </Suspense>
  );
}

function SantriFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const id = searchParams.get('id');
  const isEdit = !!id;

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [classOptions, setClassOptions] = useState<SelectOption[]>([{ value: '', label: '-- Pilih Kelas --' }]);

  useEffect(() => {
    getSchoolClasses({ active_only: true }).then((classes) => {
      const opts = classes.map(c => ({ value: c.name, label: c.name }));
      setClassOptions([{ value: '', label: '-- Pilih Kelas --' }, ...opts]);
    });
  }, []);

  useEffect(() => {
    if (id) {
      getSantriByID(Number(id)).then((s) => {
        if (s) {
          setForm({
            nis: s.nis || '',
            name: s.name || '',
            nickname: s.nickname || '',
            gender: s.gender || '',
            birth_place: s.birth_place || '',
            birth_date: s.birth_date || '',
            address: s.address || '',
            class: s.class || '',
            jenjang: s.jenjang || '',
            angkatan: s.angkatan || '',
            status: s.status || 'aktif',
            category: s.category || 'reguler',
            parent_name: s.parent_name || '',
            parent_phone: s.parent_phone || '',
            father_name: s.father_name || '',
            father_phone: s.father_phone || '',
            mother_name: s.mother_name || '',
            mother_phone: s.mother_phone || '',
            father_occupation: s.father_occupation || '',
            mother_occupation: s.mother_occupation || '',
            nik: s.nik || '',
            photo_url: s.photo_url || '',
          });
        } else {
          showToast('error', 'Santri tidak ditemukan.');
          router.push('/admin/kesantrian');
        }
        setLoading(false);
      });
    }
  }, [id]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };
    let res;
    if (isEdit && id) {
      res = await updateSantri(Number(id), payload as any);
    } else {
      res = await createSantri(payload as any);
    }
    if (res.ok) {
      showToast('success', isEdit ? 'Santri berhasil diperbarui' : 'Santri berhasil ditambahkan');
      router.push('/admin/kesantrian');
    } else {
      if (res.errors) setErrors(res.errors);
      showToast('error', res.message || 'Gagal menyimpan data santri');
    }
    setSaving(false);
  };

  const inputClass = (hasError?: string) =>
    `mt-1 w-full rounded-xl border ${hasError ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'} px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-400/10`;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-sky-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => router.push('/admin/kesantrian')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-sky-600">
        <ArrowLeft size={16} /> Kembali ke Data Santri
      </button>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">{isEdit ? 'Edit Santri' : 'Tambah Santri'}</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-bold text-slate-700">NIS <span className="text-rose-500">*</span></label>
              <input value={form.nis} onChange={(e) => handleChange('nis', e.target.value)} className={inputClass(errors.nis)} required />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700">Nama Lengkap <span className="text-rose-500">*</span></label>
              <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className={inputClass(errors.name)} required />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700">Nama Panggilan</label>
              <input value={form.nickname} onChange={(e) => handleChange('nickname', e.target.value)} className={inputClass(errors.nickname)} />
            </div>
            <SelectField id="gender" label="Jenis Kelamin" className="" value={form.gender} onChange={(v: any) => handleChange('gender', String(v))} options={genderOptions} required error={errors.gender} />
            <div>
              <label className="text-sm font-bold text-slate-700">Tempat Lahir</label>
              <input value={form.birth_place} onChange={(e) => handleChange('birth_place', e.target.value)} className={inputClass(errors.birth_place)} />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700">Tanggal Lahir</label>
              <input type="date" value={form.birth_date} onChange={(e) => handleChange('birth_date', e.target.value)} className={inputClass(errors.birth_date)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-bold text-slate-700">Alamat</label>
              <textarea value={form.address} onChange={(e) => handleChange('address', e.target.value)} rows={3} className={inputClass(errors.address)} />
            </div>
            <SelectField id="class" label="Kelas" className="" value={form.class} onChange={(v: any) => handleChange('class', String(v))} options={classOptions} required error={errors.class} />
            <div>
              <label className="text-sm font-bold text-slate-700">Jenjang</label>
              <input value={form.jenjang} onChange={(e) => handleChange('jenjang', e.target.value)} className={inputClass(errors.jenjang)} />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700">Angkatan</label>
              <input value={form.angkatan} onChange={(e) => handleChange('angkatan', e.target.value)} className={inputClass(errors.angkatan)} />
            </div>
            <SelectField id="status" label="Status" className="" value={form.status} onChange={(v: any) => handleChange('status', String(v))} options={statusOptions} required error={errors.status} />
            <SelectField id="category" label="Kategori" className="" value={form.category} onChange={(v: any) => handleChange('category', String(v))} options={categoryOptions} error={errors.category} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Data Wali</h2>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-700">Nama Wali</label>
                <input value={form.parent_name} onChange={(e) => handleChange('parent_name', e.target.value)} className={inputClass(errors.parent_name)} />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">No. HP Wali</label>
                <input value={form.parent_phone} onChange={(e) => handleChange('parent_phone', e.target.value)} className={inputClass(errors.parent_phone)} />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Nama Ayah</label>
                <input value={form.father_name} onChange={(e) => handleChange('father_name', e.target.value)} className={inputClass(errors.father_name)} />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">No. HP Ayah</label>
                <input value={form.father_phone} onChange={(e) => handleChange('father_phone', e.target.value)} className={inputClass(errors.father_phone)} />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Nama Ibu</label>
                <input value={form.mother_name} onChange={(e) => handleChange('mother_name', e.target.value)} className={inputClass(errors.mother_name)} />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">No. HP Ibu</label>
                <input value={form.mother_phone} onChange={(e) => handleChange('mother_phone', e.target.value)} className={inputClass(errors.mother_phone)} />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Pekerjaan Ayah</label>
                <input value={form.father_occupation} onChange={(e) => handleChange('father_occupation', e.target.value)} className={inputClass(errors.father_occupation)} />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Pekerjaan Ibu</label>
                <input value={form.mother_occupation} onChange={(e) => handleChange('mother_occupation', e.target.value)} className={inputClass(errors.mother_occupation)} />
              </div>
            </div>
          </div>
          <div className="flex justify-end border-t border-slate-100 pt-6">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-black uppercase tracking-wider text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60">
              <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
