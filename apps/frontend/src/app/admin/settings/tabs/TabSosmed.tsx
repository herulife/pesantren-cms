'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { getSettings, updateSetting } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { Save, RefreshCw, Share2, Globe, Camera, Video, Music2, AtSign, ExternalLink } from 'lucide-react';

const FIELDS = [
  { key: 'social_facebook', label: 'Laman Facebook', placeholder: 'https://facebook.com/...', icon: <Globe size={12} /> },
  { key: 'social_instagram', label: 'Akun Instagram', placeholder: 'https://instagram.com/...', icon: <Camera size={12} /> },
  { key: 'social_youtube', label: 'Channel YouTube', placeholder: 'https://youtube.com/@...', icon: <Video size={12} /> },
  { key: 'social_tiktok', label: 'Akun TikTok', placeholder: 'https://tiktok.com/@...', icon: <Music2 size={12} /> },
  { key: 'social_twitter', label: 'Akun X (Twitter)', placeholder: 'https://x.com/...', icon: <AtSign size={12} /> },
];

const KEYS = FIELDS.map((f) => f.key);

function normalizeUrl(raw: string): string {
  const v = (raw || '').trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

export default function TabSosmed() {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    const sData = await getSettings();
    const initialValues: Record<string, string> = {};
    sData.forEach(s => { initialValues[s.key] = s.value; });
    setFormValues(initialValues);
    setIsLoading(false);
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchData();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const handleChange = (k: string, v: string) => setFormValues(p => ({ ...p, [k]: v }));

  const filledCount = useMemo(
    () => KEYS.filter((k) => (formValues[k] || '').trim()).length,
    [formValues]
  );

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await Promise.all(
        KEYS.map((k) => updateSetting(k, normalizeUrl(formValues[k] || '')))
      );
      // refresh tampilan dengan URL ternormalisasi
      setFormValues((prev) => {
        const next = { ...prev };
        KEYS.forEach((k) => { next[k] = normalizeUrl(prev[k] || ''); });
        return next;
      });
      showToast('success', 'Media Sosial berhasil disimpan');
    } catch {
      showToast('error', 'Gagal menyimpan pengaturan');
    }
    setIsSaving(false);
  };

  if (isLoading) return <div className="p-10 flex justify-center"><RefreshCw className="animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
       <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between gap-4">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                   <Share2 size={24} />
                </div>
                <div>
                   <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight font-outfit">Media Sosial</h2>
                   <p className="mt-1 text-xs font-medium text-slate-500">
                      Tampil otomatis di <span className="font-bold text-emerald-700">topbar atas</span> &amp; <span className="font-bold text-emerald-700">footer</span> website. {filledCount} dari {KEYS.length} terisi.
                   </p>
                </div>
             </div>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
             {FIELDS.map((field) => {
               const normalized = normalizeUrl(formValues[field.key] || '');
               return (
                 <div key={field.key} className="space-y-4">
                    <label className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] flex items-center gap-2">
                      {field.icon} {field.label}
                    </label>
                    <div className="flex items-center gap-2">
                       <input
                          value={formValues[field.key] || ''}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          inputMode="url"
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                       />
                       {normalized ? (
                         <a
                           href={normalized}
                           target="_blank"
                           rel="noopener noreferrer"
                           title={`Buka ${field.label}`}
                           className="shrink-0 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                         >
                           <ExternalLink size={16} />
                         </a>
                       ) : null}
                    </div>
                 </div>
               );
             })}
          </div>
          <div className="px-8 pb-8">
             <p className="text-xs font-medium leading-6 text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
                • Isi lengkap dengan <span className="font-bold">https://</span> (otomatis ditambahkan bila lupa).<br />
                • <span className="font-bold">Kosongkan untuk menyembunyikan</span> ikon dari website.<br />
                • Perubahan langsung tampil di topbar &amp; footer tanpa perlu edit kode.
             </p>
          </div>
       </section>

       <div className="flex justify-end pt-4">
          <button
             onClick={handleSaveAll}
             disabled={isSaving}
             className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition flex items-center gap-3 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
             {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
             SIMPAN SOSMED
          </button>
       </div>
    </div>
  );
}
