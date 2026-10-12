'use client';

// Ubah pegawai — route tersendiri ala /admin/news/edit/[id].
// Backend belum punya GET satuan, jadi data diambil dari daftar
// lalu dicari berdasarkan kode.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { getEmployees, updateEmployee } from '@/lib/api';
import { useToast } from '@/components/Toast';
import EmployeeForm, {
  EmployeeFormData, EmployeeFormErrors, validateEmployeeForm,
} from '../../employee-form';

const initialForm: EmployeeFormData = {
  code: '',
  name: '',
  gender: 'Laki-laki',
  phone: '',
  email: '',
  kind: 'Guru',
  photo_url: '',
};

export default function EditEmployeePage() {
  const params = useParams();
  const code = decodeURIComponent((params?.code as string) || '');
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState<EmployeeFormData>(initialForm);
  const [errors, setErrors] = useState<EmployeeFormErrors>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchRow = async () => {
      setLoading(true);
      try {
        const rows = await getEmployees('');
        const row = rows.find((r) => r.code === code);
        if (!cancelled) {
          if (row) {
            setForm({
              code: row.code,
              name: row.name,
              gender: row.gender || 'Laki-laki',
              phone: row.phone || '',
              email: row.email || '',
              kind: row.kind || 'Guru',
              photo_url: row.photo_url || '',
            });
          } else {
            setNotFound(true);
          }
        }
      } catch {
        if (!cancelled) showToast('error', 'Gagal memuat data pegawai.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (code) void fetchRow();
    else setLoading(false);
    return () => {
      cancelled = true;
    };
  }, [code, showToast]);

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
      const res = await updateEmployee(code, {
        name: form.name.trim(),
        gender: form.gender,
        phone: form.phone.trim(),
        email: form.email.trim(),
        kind: form.kind,
        photo_url: form.photo_url.trim(),
      });
      if (res.success) {
        showToast('success', 'Pegawai berhasil diubah.');
        router.push('/admin/employees');
      } else {
        showToast('error', res.message || 'Gagal mengubah pegawai.');
      }
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Gagal mengubah pegawai.');
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
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Ubah Pegawai</h1>
        <p className="mt-1 text-sm text-slate-500">
          Perbarui data pegawai <span className="font-mono font-bold text-slate-700">{code || '-'}</span>.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center rounded-2xl border border-slate-200 bg-white p-16">
          <span className="inline-flex items-center gap-2 text-sm text-slate-400">
            <RefreshCw size={18} className="animate-spin text-emerald-500" />
            Memuat data pegawai…
          </span>
        </div>
      ) : notFound ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="text-base font-black text-amber-900">Pegawai tidak ditemukan</p>
          <p className="mt-1 text-sm text-amber-700">
            Data dengan kode “{code}” tidak ada atau sudah dihapus.
          </p>
          <Link
            href="/admin/employees"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white transition hover:bg-amber-400"
          >
            Kembali ke Data Pegawai
          </Link>
        </div>
      ) : (
        <EmployeeForm
          form={form}
          errors={errors}
          saving={saving}
          isEdit
          submitLabel="Simpan Perubahan"
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
