'use client';

import React, { useEffect, useState } from 'react';
import { getSettings, updateSetting } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { FileText, RefreshCw, Save, Users, WalletCards, MapPin, MessageCircle, Type } from 'lucide-react';

const KEYS = [
  'psb_page_hero_title',
  'psb_page_hero_subtitle',
  'psb_page_requirements',
  'psb_page_quota_ikhwan',
  'psb_page_quota_akhwat',
  'psb_page_fee',
  'psb_page_address',
  'psb_page_wa',
];

const LABELS: Record<string, string> = {
  psb_page_hero_title: 'Judul besar halaman',
  psb_page_hero_subtitle: 'Sub-judul halaman',
  psb_page_requirements: 'Syarat dokumen (satu baris = satu syarat)',
  psb_page_quota_ikhwan: 'Kuota Ikhwan (misal: 30 santri)',
  psb_page_quota_akhwat: 'Kuota Akhwat (misal: 30 santri)',
  psb_page_fee: 'Biaya formulir (misal: Rp 200.000)',
  psb_page_address: 'Alamat pendaftaran',
  psb_page_wa: 'Link WA panitia (misal: https://wa.me/62812xxxx)',
};

const ICONS: Record<string, React.ReactNode> = {
  psb_page_hero_title: <Type size={16} />,
  psb_page_hero_subtitle: <Type size={16} />,
  psb_page_requirements: <FileText size={16} />,
  psb_page_quota_ikhwan: <Users size={16} />,
  psb_page_quota_akhwat: <Users size={16} />,
  psb_page_fee: <WalletCards size={16} />,
  psb_page_address: <MapPin size={16} />,
  psb_page_wa: <MessageCircle size={16} />,
};

const MULTILINE = new Set(['psb_page_hero_subtitle', 'psb_page_requirements', 'psb_page_address']);

export default function TabHalamanPSB() {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const settings = await getSettings();
      const initialValues: Record<string, string> = {};
      settings.forEach((setting) => {
        initialValues[setting.key] = setting.value;
      });
      setFormValues(initialValues);
    } catch {
      showToast('error', 'Gagal memuat pengaturan halaman PSB');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchData();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await Promise.all(KEYS.map((key) => updateSetting(key, formValues[key] || '')));
      showToast('success', 'Halaman PSB berhasil disimpan');
    } catch {
      showToast('error', 'Gagal menyimpan halaman PSB');
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
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Isi halaman PSB (/psb)</h2>
        <p className="mt-1 text-sm text-slate-500">
          Kosongkan kolom untuk memakai bawaan. Syarat dokumen: tulis satu syarat per baris.
        </p>
        <div className="mt-5 space-y-4">
          {KEYS.map((key) => (
            <div key={key}>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <span className="text-sky-600">{ICONS[key]}</span>
                {LABELS[key]}
              </label>
              {MULTILINE.has(key) ? (
                <textarea
                  value={formValues[key] || ''}
                  onChange={(e) => setFormValues((p) => ({ ...p, [key]: e.target.value }))}
                  rows={key === 'psb_page_requirements' ? 7 : 3}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-sky-500"
                />
              ) : (
                <input
                  value={formValues[key] || ''}
                  onChange={(e) => setFormValues((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-sky-500"
                />
              )}
            </div>
          ))}
        </div>
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          <Save size={16} /> {isSaving ? 'Menyimpan…' : 'Simpan halaman PSB'}
        </button>
      </div>
    </div>
  );
}
