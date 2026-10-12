'use client';

import React, { useEffect, useState } from 'react';
import { getSettings, updateSetting } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { Banknote, Building2, Hash, RefreshCw, Save, UserRound, Heart, MessageCircle } from 'lucide-react';

const KEYS = [
  'donation_bank_name',
  'donation_account_number',
  'donation_account_holder',
  'donation_whatsapp',
];

export default function TabDonasi() {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    const settings = await getSettings();
    const initialValues: Record<string, string> = {};
    settings.forEach((setting) => {
      initialValues[setting.key] = setting.value;
    });
    setFormValues(initialValues);
    setIsLoading(false);
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchData();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const handleChange = (key: string, value: string) => {
    setFormValues((previous) => ({ ...previous, [key]: value }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await Promise.all(KEYS.map((key) => updateSetting(key, formValues[key] || '')));
      showToast('success', 'Pengaturan donasi berhasil disimpan');
    } catch {
      showToast('error', 'Gagal menyimpan pengaturan donasi');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <RefreshCw className="animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-100 p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Heart size={24} />
          </div>
          <div>
            <h2 className="font-outfit text-xl font-black uppercase tracking-tight text-slate-900">Rekening Donasi</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Informasi ini tampil di halaman donasi publik dan banner home.</p>
          </div>
        </div>

        <div className="grid gap-8 p-8 md:grid-cols-2">
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
              <Building2 size={12} /> Nama Bank
            </label>
            <input
              value={formValues.donation_bank_name || ''}
              onChange={(event) => handleChange('donation_bank_name', event.target.value)}
              placeholder="Contoh: Bank Syariah Indonesia"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800"
            />
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
              <Hash size={12} /> Nomor Rekening
            </label>
            <input
              value={formValues.donation_account_number || ''}
              onChange={(event) => handleChange('donation_account_number', event.target.value)}
              placeholder="Contoh: 4381567120"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-mono text-sm font-black tracking-wider text-slate-800"
            />
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
              <UserRound size={12} /> Atas Nama
            </label>
            <input
              value={formValues.donation_account_holder || ''}
              onChange={(event) => handleChange('donation_account_holder', event.target.value)}
              placeholder="Contoh: Yayasan Darussunnah Parung"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800"
            />
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
              <MessageCircle size={12} /> WhatsApp Konfirmasi
            </label>
            <input
              value={formValues.donation_whatsapp || ''}
              onChange={(event) => handleChange('donation_whatsapp', event.target.value)}
              placeholder="Contoh: 6281932506078"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800"
            />
            <p className="text-xs text-slate-500">Nomor WA tanpa + , dipakai untuk tombol Konfirmasi WA di halaman donasi.</p>
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="flex items-center gap-3 rounded-lg bg-emerald-600 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          Simpan Donasi
        </button>
      </div>
    </div>
  );
}
