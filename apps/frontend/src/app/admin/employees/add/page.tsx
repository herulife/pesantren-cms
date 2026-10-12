'use client';

// Tambah pegawai — route tersendiri ala /admin/news/add.

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createEmployee } from '@/lib/api';
import { useToast } from '@/components/Toast';
import EmployeeForm, {
  EmployeeFormData, EmployeeFormErrors, validateEmployeeForm,
} from '../employee-form';

const initialForm: EmployeeFormData = {
  code: '',
  name: '',
  gender: 'Laki-laki',
  phone: '',
  email: '',
  kind: 'Guru',
  photo_url: '',
};

export default function AddEmployeePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState<EmployeeFormData>(initialForm);
  const [errors, setErrors] = useState<EmployeeFormErrors>({});
  const [saving, setSaving] = useState(false);

  const handleChange = (key: keyof EmployeeFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateEmployeeForm(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      showToast('error', 'Periksa kembali isian yang ditandai.');
      return;
    }
    setSaving(true);
    try {
      const res = await createEmployee({
        code: form.code.trim(),
        name: form.name.trim(),
        gender: form.gender,
        phone: form.phone.trim(),
        email: form.email.trim(),
        kind: form.kind,
        photo_url: form.photo_url.trim(),
      });
      if (res.success) {
        showToast('success', 'Pegawai berhasil ditambahkan.');
        router.push('/admin/employees');
      } else {
        showToast('error', res.message || 'Gagal menambah pegawai.');
      }
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Gagal menambah pegawai.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <Link
        href="/admin/employees"
        className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 shadow-sm transition hover:bg-slate-50"
      >
        <ArrowLeft size={15} /> Kembali ke Data Pegawai
      </Link>
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Tambah Pegawai</h1>
        <p className="mt-1 text-sm text-slate-500">
          Lengkapi data di bawah ini. Kode pegawai tidak dapat diubah setelah disimpan.
        </p>
      </div>
      <EmployeeForm
        form={form}
        errors={errors}
        saving={saving}
        isEdit={false}
        submitLabel="Tambah Pegawai"
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
