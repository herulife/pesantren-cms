'use client';
import React, { useState, useEffect } from 'react';
import { getLicenseStatus, updateSetting, LicenseStatus } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { Save, RefreshCw, Key, ShieldCheck } from 'lucide-react';

export default function TabLisensi() {
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingLicense, setIsSavingLicense] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchLicense();
  }, []);

  const fetchLicense = async () => {
    setIsLoading(true);
    const lData = await getLicenseStatus();
    setLicense(lData);
    setIsLoading(false);
  };

  const handleUpdateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKeyInput) return;
    
    setIsSavingLicense(true);
    const res = await updateSetting('system_license_key', licenseKeyInput);
    if (res.success) {
      showToast('success', 'Kode Lisensi diperbarui. Memverifikasi...');
      setTimeout(() => window.location.reload(), 1500);
    } else {
      showToast('error', 'Gagal memperbarui lisensi.');
    }
    setIsSavingLicense(false);
  };

  if (isLoading) return <div className="p-10 flex justify-center"><RefreshCw className="animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <section className="bg-emerald-950 p-10 rounded-xl border border-emerald-900 shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-800/80 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
              <div className="flex flex-col gap-8 items-center text-center">
                 <div className="w-20 h-20 bg-emerald-900 rounded-xl flex items-center justify-center text-amber-400 border border-emerald-800 shadow-xl shrink-0">
                    <ShieldCheck size={40} />
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tight font-outfit">Sistem Terenkripsi</h2>
                    <p className="text-emerald-400/80 text-sm font-medium leading-relaxed">
                      Sistem pengaturan terhubung langsung dengan backend RSA. Pastikan validasi lisensi tetap aktif.
                    </p>
                 </div>
                 <div className="w-full bg-emerald-900/50 px-8 py-5 rounded-xl border border-emerald-800">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Status Lisensi</p>
                    <p className={`font-black text-2xl tracking-widest ${license?.is_valid ? 'text-amber-400' : 'text-rose-500 underline'}`}>
                      {license?.is_valid ? 'AKTIF' : 'EXPIRED'}
                    </p>
                 </div>
              </div>
           </section>

           <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 border border-rose-100">
                    <Key size={20} />
                 </div>
                 <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight font-outfit">Perbarui Lisensi</h2>
              </div>

              <form onSubmit={handleUpdateLicense} className="space-y-6">
                 <p className="text-xs text-slate-500 font-medium leading-relaxed italic border-l-4 border-rose-400 pl-4">
                   Masukkan kode lisensi tahunan yang baru untuk memperpanjang masa aktif dashboard.
                 </p>
                 
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kode Lisensi Premium</label>
                    <textarea 
                      rows={4}
                      value={licenseKeyInput}
                      onChange={(e) => setLicenseKeyInput(e.target.value)}
                      className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-mono text-xs leading-relaxed"
                      placeholder="Paste your license key here..."
                    />
                 </div>

                 <button 
                   type="submit"
                   disabled={isSavingLicense}
                   className="w-full mt-4 py-5 bg-slate-900 text-white rounded-xl font-black uppercase tracking-[0.2em] text-xs hover:bg-emerald-950 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 group disabled:opacity-50"
                 >
                    {isSavingLicense ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} className="group-hover:scale-125 transition-transform" />}
                    SIMPAN LISENSI
                 </button>
              </form>
           </section>
       </div>
    </div>
  );
}
