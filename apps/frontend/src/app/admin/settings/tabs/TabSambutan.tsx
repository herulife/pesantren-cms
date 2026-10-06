'use client';
import React, { useState, useEffect } from 'react';
import { getSettings, updateSettingsBatch } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { Save, RefreshCw, MessageSquareQuote, Image as ImageIcon, UploadCloud } from 'lucide-react';

export default function TabSambutan() {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const KEYS = [
    'welcome_speech_name', 
    'welcome_speech_role',
    'welcome_speech_text', 
    'welcome_speech_image'
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
      const payload = KEYS.map(k => ({ key: k, value: formValues[k] || '' }));
      await updateSettingsBatch(payload);
      showToast('success', 'Sambutan berhasil disimpan');
    } catch {
      showToast('error', 'Gagal menyimpan pengaturan');
    }
    setIsSaving(false);
  };

  if (isLoading) return <div className="p-10 flex justify-center"><RefreshCw className="animate-spin text-orange-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
       <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                <MessageSquareQuote size={24} />
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight font-outfit">Sambutan Pimpinan</h2>
                <p className="text-slate-500 text-xs font-medium">Teks sambutan dari kepala yayasan / mudir pondok yang tampil di beranda.</p>
             </div>
          </div>
          
          <div className="p-8 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-orange-700 uppercase tracking-[0.2em] flex items-center gap-2">Nama Pimpinan</label>
                   <input 
                      value={formValues['welcome_speech_name'] || ''}
                      onChange={(e) => handleChange('welcome_speech_name', e.target.value)}
                      placeholder="Ustadz Fulan, Lc., M.A."
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm"
                   />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-orange-700 uppercase tracking-[0.2em] flex items-center gap-2">Jabatan (Role)</label>
                   <input 
                      value={formValues['welcome_speech_role'] || ''}
                      onChange={(e) => handleChange('welcome_speech_role', e.target.value)}
                      placeholder="Mudir Pondok Pesantren"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm"
                   />
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black text-orange-700 uppercase tracking-[0.2em] flex items-center gap-2">
                  <ImageIcon size={12} /> URL Foto Pimpinan
                </label>
                <div className="flex gap-4 items-start">
                   {formValues['welcome_speech_image'] ? (
                     <div className="shrink-0 w-24 h-24 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 relative">
                        <img 
                          src={formValues['welcome_speech_image'].startsWith('http') ? formValues['welcome_speech_image'] : `https://darussunnahparung.com${formValues['welcome_speech_image']}`} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/kepsek.png'; }}
                        />
                     </div>
                   ) : (
                     <div className="shrink-0 w-24 h-24 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400">
                        <ImageIcon size={24} />
                     </div>
                   )}
                   <div className="flex-1 space-y-3">
                      <input 
                         value={formValues['welcome_speech_image'] || ''}
                         onChange={(e) => handleChange('welcome_speech_image', e.target.value)}
                         placeholder="/uploads/foto-pimpinan.jpg"
                         className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                      />
                      <div className="relative">
                         <input 
                            type="file" 
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={async (e) => {
                               const file = e.target.files?.[0];
                               if (!file) return;
                               showToast('success', 'Mengunggah gambar...');
                               try {
                                  const { uploadImage } = await import('@/lib/api');
                                  const res = await uploadImage(file);
                                  if (res.success && res.url) {
                                     handleChange('welcome_speech_image', res.url);
                                     showToast('success', 'Gambar berhasil diunggah');
                                  } else {
                                     showToast('error', 'Gagal mengunggah gambar');
                                  }
                               } catch (err) {
                                  showToast('error', 'Terjadi kesalahan saat mengunggah');
                               }
                            }}
                         />
                         <button type="button" className="text-xs font-bold bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 hover:text-orange-600 transition-colors flex items-center gap-2">
                            <UploadCloud size={14} /> Unggah Foto Baru
                         </button>
                      </div>
                   </div>
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <label className="text-[10px] font-black text-orange-700 uppercase tracking-[0.2em]">Pesan Sambutan Lengkap</label>
                   <span className="text-[10px] font-bold text-slate-400">Gunakan Enter untuk baris baru</span>
                </div>
                <textarea 
                   rows={6}
                   value={formValues['welcome_speech_text'] || ''}
                   onChange={(e) => handleChange('welcome_speech_text', e.target.value)}
                   placeholder="Assalamualaikum Warahmatullahi Wabarakatuh..."
                   className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm text-slate-800 leading-relaxed focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                />
             </div>
          </div>
       </section>

       <div className="flex justify-end pt-4">
          <button 
             onClick={handleSaveAll}
             disabled={isSaving}
             className="px-8 py-4 bg-orange-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-orange-700 transition flex items-center gap-3 shadow-lg shadow-orange-600/20 disabled:opacity-50"
          >
             {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
             SIMPAN SAMBUTAN
          </button>
       </div>
    </div>
  );
}
