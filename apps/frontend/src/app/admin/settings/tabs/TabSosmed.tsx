'use client';
import React, { useState, useEffect } from 'react';
import { getSettings, updateSetting } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { Save, RefreshCw, Share2, Globe, Camera, Video } from 'lucide-react';

export default function TabSosmed() {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const KEYS = ['social_facebook', 'social_instagram', 'social_youtube'];

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
      showToast('success', 'Media Sosial berhasil disimpan');
    } catch (e) {
      showToast('error', 'Gagal menyimpan pengaturan');
    }
    setIsSaving(false);
  };

  if (isLoading) return <div className="p-10 flex justify-center"><RefreshCw className="animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
       <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <Share2 size={24} />
             </div>
             <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight font-outfit">Media Sosial</h2>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="space-y-4">
                <label className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Globe size={12} /> Laman Facebook
                </label>
                <input 
                   value={formValues['social_facebook'] || ''}
                   onChange={(e) => handleChange('social_facebook', e.target.value)}
                   placeholder="https://facebook.com/..."
                   className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-800"
                />
             </div>
             <div className="space-y-4">
                <label className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Camera size={12} /> Akun Instagram
                </label>
                <input 
                   value={formValues['social_instagram'] || ''}
                   onChange={(e) => handleChange('social_instagram', e.target.value)}
                   placeholder="https://instagram.com/..."
                   className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-800"
                />
             </div>
             <div className="space-y-4">
                <label className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Video size={12} /> Channel YouTube
                </label>
                <input 
                   value={formValues['social_youtube'] || ''}
                   onChange={(e) => handleChange('social_youtube', e.target.value)}
                   placeholder="https://youtube.com/c/..."
                   className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-800"
                />
             </div>
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
