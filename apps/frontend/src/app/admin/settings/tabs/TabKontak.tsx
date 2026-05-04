'use client';
import React, { useState, useEffect } from 'react';
import { getSettings, updateSetting } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { Save, RefreshCw, MapPin, Phone, Mail, Globe, MessageCircle } from 'lucide-react';

export default function TabKontak() {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const KEYS = ['school_address', 'school_phone', 'school_email', 'school_website', 'whatsapp_admin_numbers'];

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
      showToast('success', 'Informasi Kontak berhasil disimpan');
    } catch {
      showToast('error', 'Gagal menyimpan pengaturan');
    }
    setIsSaving(false);
  };

  if (isLoading) return <div className="p-10 flex justify-center"><RefreshCw className="animate-spin text-rose-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
       <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600">
                <MapPin size={24} />
             </div>
             <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight font-outfit">Informasi Kontak</h2>
          </div>
          <div className="p-8 space-y-8">
             <div className="space-y-4">
                <label className="text-[10px] font-black text-rose-700 uppercase tracking-[0.2em] flex items-center gap-2">
                  <MapPin size={12} /> Alamat Lengkap
                </label>
                <textarea 
                   rows={3}
                   value={formValues['school_address'] || ''}
                   onChange={(e) => handleChange('school_address', e.target.value)}
                   className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-rose-700 uppercase tracking-[0.2em] flex items-center gap-2">
                     <Phone size={12} /> No. Telepon / WA
                   </label>
                   <input 
                      value={formValues['school_phone'] || ''}
                      onChange={(e) => handleChange('school_phone', e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                   />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-rose-700 uppercase tracking-[0.2em] flex items-center gap-2">
                     <Mail size={12} /> Email Resmi
                   </label>
                   <input 
                      value={formValues['school_email'] || ''}
                      onChange={(e) => handleChange('school_email', e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                   />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-rose-700 uppercase tracking-[0.2em] flex items-center gap-2">
                     <Globe size={12} /> Website Utama
                   </label>
                   <input 
                      value={formValues['school_website'] || ''}
                      onChange={(e) => handleChange('school_website', e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                   />
                </div>
             </div>
             <div className="space-y-4">
                <label className="text-[10px] font-black text-rose-700 uppercase tracking-[0.2em] flex items-center gap-2">
                  <MessageCircle size={12} /> Nomor Admin WhatsApp
                </label>
                <textarea
                   rows={4}
                   value={formValues['whatsapp_admin_numbers'] || ''}
                   onChange={(e) => handleChange('whatsapp_admin_numbers', e.target.value)}
                   placeholder={'Contoh:\n6281234567890\n6289876543210'}
                   className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
                <p className="text-xs font-medium text-slate-500">
                  Isi satu nomor per baris. Nomor ini akan dipakai untuk tombol chat admin di halaman kontak publik.
                </p>
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
             SIMPAN KONTAK
          </button>
       </div>
    </div>
  );
}
