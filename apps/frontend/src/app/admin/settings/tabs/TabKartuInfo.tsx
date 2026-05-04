'use client';
import React, { useState, useEffect } from 'react';
import { getSettings, updateSetting } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { Save, RefreshCw, LayoutTemplate } from 'lucide-react';

export default function TabKartuInfo() {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const KEYS = [
    'card_info_1_title', 'card_info_1_desc',
    'card_info_2_title', 'card_info_2_desc',
    'card_info_3_title', 'card_info_3_desc'
  ];

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

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await Promise.all(KEYS.map(k => updateSetting(k, formValues[k] || '')));
      showToast('success', 'Kartu Info berhasil disimpan');
    } catch {
      showToast('error', 'Gagal menyimpan pengaturan');
    }
    setIsSaving(false);
  };

  if (isLoading) return <div className="p-10 flex justify-center"><RefreshCw className="animate-spin text-fuchsia-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
       <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-fuchsia-50 rounded-xl flex items-center justify-center text-fuchsia-600">
                <LayoutTemplate size={24} />
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight font-outfit">Kartu Info Beranda</h2>
                <p className="text-slate-500 text-xs font-medium">Pengaturan 3 kartu sorotan utama yang muncul setelah slider beranda.</p>
             </div>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
             {/* Kartu 1 */}
             <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="font-black text-fuchsia-700 uppercase tracking-widest text-xs mb-4">Kartu Sorotan 1</h3>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">Judul Singkat</label>
                   <input 
                      value={formValues['card_info_1_title'] || ''}
                      onChange={(e) => handleChange('card_info_1_title', e.target.value)}
                      placeholder="Program Tahfidz..."
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800"
                   />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">Deskripsi Pendek</label>
                   <textarea 
                      rows={3}
                      value={formValues['card_info_1_desc'] || ''}
                      onChange={(e) => handleChange('card_info_1_desc', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-xs text-slate-800"
                   />
                </div>
             </div>

             {/* Kartu 2 */}
             <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="font-black text-fuchsia-700 uppercase tracking-widest text-xs mb-4">Kartu Sorotan 2</h3>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">Judul Singkat</label>
                   <input 
                      value={formValues['card_info_2_title'] || ''}
                      onChange={(e) => handleChange('card_info_2_title', e.target.value)}
                      placeholder="Fasilitas..."
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800"
                   />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">Deskripsi Pendek</label>
                   <textarea 
                      rows={3}
                      value={formValues['card_info_2_desc'] || ''}
                      onChange={(e) => handleChange('card_info_2_desc', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-xs text-slate-800"
                   />
                </div>
             </div>

             {/* Kartu 3 */}
             <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="font-black text-fuchsia-700 uppercase tracking-widest text-xs mb-4">Kartu Sorotan 3</h3>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">Judul Singkat</label>
                   <input 
                      value={formValues['card_info_3_title'] || ''}
                      onChange={(e) => handleChange('card_info_3_title', e.target.value)}
                      placeholder="Pendaftaran..."
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800"
                   />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">Deskripsi Pendek</label>
                   <textarea 
                      rows={3}
                      value={formValues['card_info_3_desc'] || ''}
                      onChange={(e) => handleChange('card_info_3_desc', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-xs text-slate-800"
                   />
                </div>
             </div>
          </div>
       </section>

       <div className="flex justify-end pt-4">
          <button 
             onClick={handleSaveAll}
             disabled={isSaving}
             className="px-8 py-4 bg-fuchsia-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-fuchsia-700 transition flex items-center gap-3 shadow-lg shadow-fuchsia-600/20 disabled:opacity-50"
          >
             {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
             SIMPAN KARTU INFO
          </button>
       </div>
    </div>
  );
}
