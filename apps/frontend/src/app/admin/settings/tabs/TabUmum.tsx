'use client';
import React, { useState, useEffect } from 'react';
import { getSettings, updateSetting } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { Save, RefreshCw, School, Database, ImageIcon, Type, Search } from 'lucide-react';

export default function TabUmum() {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const KEYS = [
    'school_name', 
    'web_logo_url', 
    'web_welcome_text', 
    'seo_meta_description', 
    'seo_meta_keywords', 
    'seo_google_analytics'
  ];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const sData = await getSettings();
    const initialValues: Record<string, string> = {};
    sData.forEach(s => { initialValues[s.key] = s.value; });
    setFormValues(initialValues);
    setIsLoading(false);
  };

  const handleChange = (k: string, v: string) => setFormValues(p => ({ ...p, [k]: v }));

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await Promise.all(KEYS.map(k => updateSetting(k, formValues[k] || '')));
      showToast('success', 'Pengaturan Umum berhasil disimpan');
    } catch (e) {
      showToast('error', 'Gagal menyimpan pengaturan');
    }
    setIsSaving(false);
  };

  if (isLoading) return <div className="p-10 flex justify-center"><RefreshCw className="animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
       
       <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                   <School size={24} />
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight font-outfit">Profil Lembaga Dasar</h2>
             </div>
          </div>
          <div className="p-8">
             <div className="space-y-4">
                <label className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Database size={12} /> Nama Institusi / Yayasan
                </label>
                <input 
                  value={formValues['school_name'] || ''}
                  onChange={(e) => handleChange('school_name', e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-slate-800"
                />
             </div>
          </div>
       </section>

       <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                <ImageIcon size={24} />
             </div>
             <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight font-outfit">Identitas Tampilan</h2>
          </div>
          <div className="p-8 grid grid-cols-2 gap-8">
             <div className="space-y-4">
                <label className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] flex items-center gap-2">
                   <ImageIcon size={12} /> URL Logo Header
                </label>
                <input 
                   value={formValues['web_logo_url'] || ''}
                   onChange={(e) => handleChange('web_logo_url', e.target.value)}
                   className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
             </div>
             <div className="space-y-4">
                <label className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] flex items-center gap-2">
                   <Type size={12} /> Slogan / Tagline Top Bar
                </label>
                <input 
                   value={formValues['web_welcome_text'] || ''}
                   onChange={(e) => handleChange('web_welcome_text', e.target.value)}
                   className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
             </div>
          </div>
       </section>
       
       <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                <Search size={24} />
             </div>
             <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight font-outfit">SEO & Meta Konfigurasi</h2>
          </div>
          <div className="p-8 space-y-8">
             <div className="space-y-4">
                <label className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Deskripsi Meta Website</label>
                <textarea 
                   rows={3}
                   value={formValues['seo_meta_description'] || ''}
                   onChange={(e) => handleChange('seo_meta_description', e.target.value)}
                   className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm text-slate-800"
                />
             </div>
             <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Katakunci / Keywords</label>
                   <input 
                      value={formValues['seo_meta_keywords'] || ''}
                      onChange={(e) => handleChange('seo_meta_keywords', e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-800"
                   />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Google Analytics ID</label>
                   <input 
                      value={formValues['seo_google_analytics'] || ''}
                      onChange={(e) => handleChange('seo_google_analytics', e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-800"
                   />
                </div>
             </div>
          </div>
       </section>

       <div className="flex justify-end pt-4">
          <button 
             onClick={handleSaveAll}
             disabled={isSaving}
             className="px-8 py-4 bg-emerald-600 text-white rounded-lg font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition flex items-center gap-3 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
             {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
             SIMPAN PENGATURAN UMUM
          </button>
       </div>
    </div>
  );
}
