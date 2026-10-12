'use client';

import React, { useEffect, useState } from 'react';
import { getSettings, updateSetting } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { Building2, Hash, RefreshCw, Save, UserRound, Wallet } from 'lucide-react';

const KEYS = [
  'spp_bank_name',
  'spp_account_number',
  'spp_account_holder',
];

export default function TabRekeningSPP() {
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
      showToast('success', 'Pengaturan rekening SPP berhasil disimpan');
    } catch {
      showToast('error', 'Gagal menyimpan pengaturan rekening SPP');
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-100 p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <Wallet size={24} />
          </div>
          <div>
            <h2 className="font-outfit text-xl font-black uppercase tracking-tight text-slate-900">Rekening SPP</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Tujuan transfer pembayaran SPP / iuran santri di portal wali.</p>
          </div>
        </div>

        <div className="grid gap-8 p-8 md:grid-cols-2">
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-sky-700">
              <Building2 size={12} /> Nama Bank
            </label>
            <input
              value={formValues.spp_bank_name || ''}
              onChange={(event) => handleChange('spp_bank_name', event.target.value)}
              placeholder="Contoh: Bank Syariah Indonesia"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800"
            />
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-sky-700">
              <Hash size={12} /> Nomor Rekening
            </label>
            <input
              value={formValues.spp_account_number || ''}
              onChange={(event) => handleChange('spp_account_number', event.target.value)}
              placeholder="Contoh: 4381567120"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-mono text-sm font-black tracking-wider text-slate-800"
            />
          </div>

          <div className="space-y-4 md:col-span-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-sky-700">
              <UserRound size={12} /> Atas Nama
            </label>
            <input
              value={formValues.spp_account_holder || ''}
              onChange={(event) => handleChange('spp_account_holder', event.target.value)}
              placeholder="Contoh: Yayasan Darussunnah Parung"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800"
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="flex items-center gap-3 rounded-lg bg-sky-600 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:opacity-50"
        >
          {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          Simpan SPP
        </button>
      </div>
    </div>
  );
}
