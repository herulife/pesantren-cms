'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CompactUser, createPayment, getPaymentUsers } from '@/lib/api';
import { ArrowLeft, Calendar, CreditCard, Loader2, Receipt, Save, User } from 'lucide-react';
import { useToast } from '@/components/Toast';

function createInitialForm() {
  return {
    user_id: '',
    amount: '',
    description: '',
    method: 'manual',
    status: 'success',
    payment_date: new Date().toISOString().split('T')[0],
  };
}

export default function PaymentFormPage() {
  return (
    <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>}>
      <PaymentFormContent />
    </Suspense>
  );
}

function PaymentFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [users, setUsers] = useState<CompactUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(createInitialForm());

  useEffect(() => {
    const loadUsers = async () => {
      const result = await getPaymentUsers();
      setUsers(result);
      setIsLoading(false);
    };
    loadUsers();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.user_id || !formData.amount || !formData.description) {
      showToast('error', 'Harap isi semua field wajib.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await createPayment({
        user_id: parseInt(formData.user_id, 10),
        amount: parseInt(formData.amount, 10),
        description: formData.description,
        method: formData.method,
        status: formData.status,
        payment_date: `${formData.payment_date} 00:00:00`,
      });

      if (res.success) {
        showToast('success', 'Pembayaran berhasil dicatat.');
        router.push('/admin/payments');
      } else {
        showToast('error', res.message || 'Gagal menyimpan data.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
      showToast('error', message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl pb-20">
      <div className="mb-10 flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push('/admin/payments')}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-emerald-200 hover:text-emerald-600"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Form Pembayaran</p>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 font-outfit">Tambah Pembayaran</h1>
          <p className="text-sm font-medium text-slate-500">Catat transaksi dalam halaman penuh supaya input lebih nyaman ditinjau.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-3 md:col-span-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <User size={12} /> Pilih Santri / User
              </label>
              <select
                value={formData.user_id}
                onChange={(event) => setFormData((prev) => ({ ...prev, user_id: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              >
                <option value="">-- Pilih User --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Receipt size={12} /> Jumlah
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(event) => setFormData((prev) => ({ ...prev, amount: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                placeholder="500000"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Calendar size={12} /> Tanggal Bayar
              </label>
              <input
                type="date"
                value={formData.payment_date}
                onChange={(event) => setFormData((prev) => ({ ...prev, payment_date: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Keterangan</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-medium text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                placeholder="Contoh: Pembayaran SPP Bulan April 2026"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <CreditCard size={12} /> Metode
              </label>
              <select
                value={formData.method}
                onChange={(event) => setFormData((prev) => ({ ...prev, method: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              >
                <option value="manual">Tunai / Manual</option>
                <option value="transfer">Transfer Bank</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</label>
              <select
                value={formData.status}
                onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              >
                <option value="success">Sukses (Lunas)</option>
                <option value="pending">Pending</option>
                <option value="failed">Gagal</option>
              </select>
            </div>
          </div>
        </div>

        <div className="sticky bottom-8 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push('/admin/payments')}
            className="rounded-lg border border-slate-200 bg-white px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-3 rounded-lg bg-slate-900 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Simpan Transaksi
          </button>
        </div>
      </form>
    </div>
  );
}
