'use client';
import React, { useState, useEffect } from 'react';
import { getSettings, updateSetting } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { Save, RefreshCw, MessageCircle, Settings2, Info } from 'lucide-react';

export default function TabNotifikasiWA() {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const KEYS = [
    'wa_discipline_violation_template',
    'wa_discipline_summary_template'
  ];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const sData = await getSettings();
      const initialValues: Record<string, string> = {};
      sData.forEach(s => { initialValues[s.key] = s.value; });
      setFormValues(initialValues);
    } catch (e) {
      showToast('error', 'Gagal memuat pengaturan WA');
    }
    setIsLoading(false);
  };

  const handleChange = (k: string, v: string) => setFormValues(p => ({ ...p, [k]: v }));

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await Promise.all(KEYS.map(k => updateSetting(k, formValues[k] || '')));
      showToast('success', 'Template pesan WA berhasil disimpan');
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
                   <MessageCircle size={24} />
                </div>
                <div>
                   <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight font-outfit">Template Notifikasi Pelanggaran</h2>
                   <p className="text-sm text-slate-500 font-medium">Format pesan saat santri melakukan pelanggaran poin.</p>
                </div>
             </div>
          </div>
          <div className="p-8 space-y-6">
             <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 flex gap-4">
                <Info className="text-amber-600 shrink-0" size={20} />
                <div className="text-sm text-amber-800 leading-relaxed">
                   <p className="font-bold mb-1">Variabel yang tersedia:</p>
                   <ul className="list-disc list-inside space-y-1 opacity-90">
                      <li><code className="bg-amber-200/50 px-1 rounded text-xs font-bold">{"{{nama}}"}</code> : Nama Lengkap Santri</li>
                      <li><code className="bg-amber-200/50 px-1 rounded text-xs font-bold">{"{{kategori}}"}</code> : Kategori Pelanggaran</li>
                      <li><code className="bg-amber-200/50 px-1 rounded text-xs font-bold">{"{{detail}}"}</code> : Detail Kejadian</li>
                      <li><code className="bg-amber-200/50 px-1 rounded text-xs font-bold">{"{{poin}}"}</code> : Poin yang dikurangi</li>
                      <li><code className="bg-amber-200/50 px-1 rounded text-xs font-bold">{"{{sanksi}}"}</code> : Tindakan / Sanksi</li>
                   </ul>
                </div>
             </div>
             <div className="space-y-4">
                <textarea 
                  rows={8}
                  placeholder="Contoh: Menginformasikan pelanggaran santri {{nama}}..."
                  value={formValues['wa_discipline_violation_template'] || ''}
                  onChange={(e) => handleChange('wa_discipline_violation_template', e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-800 leading-relaxed"
                />
             </div>
          </div>
       </section>

       <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                   <Settings2 size={24} />
                </div>
                <div>
                   <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight font-outfit">Template Rekapitulasi Poin</h2>
                   <p className="text-sm text-slate-500 font-medium">Format pesan ringkasan sisa poin santri.</p>
                </div>
             </div>
          </div>
          <div className="p-8 space-y-6">
             <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex gap-4">
                <Info className="text-blue-600 shrink-0" size={20} />
                <div className="text-sm text-blue-800 leading-relaxed">
                   <p className="font-bold mb-1">Variabel yang tersedia:</p>
                   <ul className="list-disc list-inside space-y-1 opacity-90">
                      <li><code className="bg-blue-200/50 px-1 rounded text-xs font-bold">{"{{nama}}"}</code> : Nama Lengkap Santri</li>
                      <li><code className="bg-blue-200/50 px-1 rounded text-xs font-bold">{"{{sisa}}"}</code> : Sisa Poin Saat Ini</li>
                      <li><code className="bg-blue-200/50 px-1 rounded text-xs font-bold">{"{{status}}"}</code> : Status Sanksi (Aman, SP1, dsb)</li>
                   </ul>
                </div>
             </div>
             <div className="space-y-4">
                <textarea 
                  rows={6}
                  placeholder="Contoh: Rekap poin santri {{nama}} sisa {{sisa}}..."
                  value={formValues['wa_discipline_summary_template'] || ''}
                  onChange={(e) => handleChange('wa_discipline_summary_template', e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-800 leading-relaxed"
                />
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
             SIMPAN TEMPLATE NOTIFIKASI
          </button>
       </div>
    </div>
  );
}
