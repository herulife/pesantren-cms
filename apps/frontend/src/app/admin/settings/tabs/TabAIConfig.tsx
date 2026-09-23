'use client';
import React, { useState, useEffect } from 'react';
import { getSettings, updateSetting } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { Save, RefreshCw, Bot, Key } from 'lucide-react';

export default function TabAIConfig() {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const KEYS = ['ai_openai_key', 'ai_model', 'ai_temperature', 'ai_api_url'];

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
      showToast('success', 'Konfigurasi AI berhasil disimpan');
    } catch {
      showToast('error', 'Gagal menyimpan pengaturan');
    }
    setIsSaving(false);
  };

  if (isLoading) return <div className="p-10 flex justify-center"><RefreshCw className="animate-spin text-sky-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
       <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600">
                <Bot size={24} />
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight font-outfit">Konfigurasi Kecerdasan Buatan (AI)</h2>
                <p className="text-slate-500 text-xs font-medium">Atur API Key untuk generator berita otomatis dan asisten bot.</p>
             </div>
          </div>
          
          <div className="p-8 space-y-8">
             <div className="space-y-4">
                <label className="text-[10px] font-black text-sky-700 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Key size={12} /> AI API Key (Dahl dahl_... / OpenAI sk-...)
                </label>
                <input 
                   type="password"
                   value={formValues['ai_openai_key'] || ''}
                   onChange={(e) => handleChange('ai_openai_key', e.target.value)}
                   className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm tracking-widest text-slate-800"
                   placeholder="dahl_... atau sk-..."
                />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-sky-700 uppercase tracking-[0.2em]">Model Preferensi</label>
                   <select 
                      value={formValues['ai_model'] || 'deepseek-ai/DeepSeek-V4-Flash-0731'}
                      onChange={(e) => handleChange('ai_model', e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm"
                   >
                     <option value="deepseek-ai/DeepSeek-V4-Flash-0731">DeepSeek V4 Flash (Free)</option>
                     <option value="MiniMaxAI/MiniMax-M2.7">MiniMax M2.7 (Free)</option>
                     <option value="zai-org/GLM-5.3-Flash">GLM 5.3 Flash (Free)</option>
                   </select>
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-sky-700 uppercase tracking-[0.2em]">Level Kreativitas (Temperature 0-1)</label>
                   <input 
                      type="number" step="0.1" min="0" max="1"
                      value={formValues['ai_temperature'] || '0.7'}
                      onChange={(e) => handleChange('ai_temperature', e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm"
                   />
                </div>
             </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-sky-700 uppercase tracking-[0.2em]">API URL (OpenAI-compatible Dahl)</label>
                 <input 
                    type="text"
                    value={formValues['ai_api_url'] || ''}
                    onChange={(e) => handleChange('ai_api_url', e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-800"
                    placeholder="https://inference.dahl.global/v1"
                 />
              </div>
          </div>
       </section>

       <div className="flex justify-end pt-4">
          <button 
             onClick={handleSaveAll}
             disabled={isSaving}
             className="px-8 py-4 bg-sky-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-sky-700 transition flex items-center gap-3 shadow-lg shadow-sky-600/20 disabled:opacity-50"
          >
             {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
             SIMPAN KONFIGURASI AI
          </button>
       </div>
    </div>
  );
}
