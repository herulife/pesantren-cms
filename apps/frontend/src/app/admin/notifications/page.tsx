'use client';

import React, { useState, useEffect } from 'react';
import { getNotificationStatus, sendWhatsApp, broadcastTagihan, broadcastNilai, broadcastPSB, getLogs } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { 
  Bell, 
  Send, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  History,
  Zap,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Check
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function NotificationsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [status, setStatus] = useState({ success: false, configured: false });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [broadcastingTagihan, setBroadcastingTagihan] = useState(false);
  const [broadcastingNilai, setBroadcastingNilai] = useState(false);
  const [broadcastingPSB, setBroadcastingPSB] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  
  // Form states
  const [target, setTarget] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, [user?.role]);

  const fetchData = async () => {
    setLoading(true);
    const [statusData, logsData] = await Promise.all([
      getNotificationStatus(),
      user?.role === 'superadmin' ? getLogs('SEND_WA') : Promise.resolve([])
    ]);
    setStatus(statusData);
    setLogs(logsData);
    setLoading(false);
  };

  const handleSendManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target || !message) { showToast('error', 'Lengkapi nomor dan pesan'); return; }
    
    setSending(true);
    try {
      const res = await sendWhatsApp(target, message);
      if (res.success) {
        showToast('success', 'Pesan WhatsApp terkirim!');
        setTarget('');
        setMessage('');
        fetchData();
      }
    } catch (e: any) {
      showToast('error', e.message || 'Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  const handleBroadcastTagihan = async () => {
    if (!status.configured) { showToast('error', 'API Key Fonnte belum dikonfigurasi'); return; }
    if (!confirm('Kirim pengingat tagihan SPP ke semua santri yang menunggak?')) return;

    setBroadcastingTagihan(true);
    try {
      const res = await broadcastTagihan();
      if (res.success) {
        showToast('success', `${res.count} pesan broadcast tagihan berhasil dikirim!`);
        fetchData();
      }
    } catch (e: any) {
      showToast('error', e.message || 'Gagal mengirim broadcast');
    } finally {
      setBroadcastingTagihan(false);
    }
  };

  const handleBroadcastNilai = async () => {
    if (!status.configured) { showToast('error', 'API Key Fonnte belum dikonfigurasi'); return; }
    if (!confirm('Kirim notifikasi nilai raport ke wali santri yang memiliki nomor WA?')) return;

    setBroadcastingNilai(true);
    try {
      const res = await broadcastNilai();
      if (res.success) {
        showToast('success', `${res.count} pesan broadcast nilai berhasil dikirim!`);
        fetchData();
      }
    } catch (e: any) {
      showToast('error', e.message || 'Gagal mengirim broadcast nilai');
    } finally {
      setBroadcastingNilai(false);
    }
  };

  const handleBroadcastPSB = async () => {
    if (!status.configured) { showToast('error', 'API Key Fonnte belum dikonfigurasi'); return; }
    if (!confirm('Kirim status pendaftaran PSB ke semua wali calon santri?')) return;

    setBroadcastingPSB(true);
    try {
      const res = await broadcastPSB();
      if (res.success) {
        showToast('success', `${res.count} pesan broadcast PSB berhasil dikirim!`);
        fetchData();
      }
    } catch (e: any) {
      showToast('error', e.message || 'Gagal mengirim broadcast PSB');
    } finally {
      setBroadcastingPSB(false);
    }
  };

  const broadcastCards = [
    {
      title: 'Broadcast Tagihan SPP',
      desc: 'Kirim pengingat SPP otomatis ke seluruh wali santri yang memiliki status',
      badge: 'pending',
      icon: Users,
      color: 'blue',
      loading: broadcastingTagihan,
      onClick: handleBroadcastTagihan,
    },
    {
      title: 'Broadcast Nilai Raport',
      desc: 'Kirim notifikasi nilai raport semester terbaru ke wali santri yang terdaftar.',
      badge: null,
      icon: BookOpen,
      color: 'emerald',
      loading: broadcastingNilai,
      onClick: handleBroadcastNilai,
    },
    {
      title: 'Broadcast Status PSB',
      desc: 'Kirim update status pendaftaran santri baru ke nomor wali yang terdaftar.',
      badge: null,
      icon: ClipboardList,
      color: 'purple',
      loading: broadcastingPSB,
      onClick: handleBroadcastPSB,
    },
  ];

  const colorMap: Record<string, { btn: string; shadow: string; bg: string }> = {
    blue: { btn: 'bg-blue-600 text-white shadow-xl shadow-blue-200', shadow: 'bg-blue-50', bg: 'bg-blue-50' },
    emerald: { btn: 'bg-emerald-600 text-white shadow-xl shadow-emerald-200', shadow: 'bg-emerald-50', bg: 'bg-emerald-50' },
    purple: { btn: 'bg-purple-600 text-white shadow-xl shadow-purple-200', shadow: 'bg-purple-50', bg: 'bg-purple-50' },
  };

  return (
    <div className="pb-10 font-outfit">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
          <Bell className="text-blue-600" size={32} />
          WhatsApp Gateway
        </h2>
        <p className="text-slate-500 mt-1">Sistem notifikasi otomatis dan broadcast pesan WhatsApp.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Configuration & Broadcasts */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Status Card */}
          <div className={`p-6 rounded-[2rem] border-2 transition-all ${
            status.configured 
              ? 'bg-emerald-50 border-emerald-100' 
              : 'bg-rose-50 border-rose-100'
          }`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-2xl ${
                status.configured ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white shadow-lg shadow-rose-200'
              }`}>
                <Zap size={24} />
              </div>
              <div>
                <h4 className="font-black uppercase tracking-tight text-slate-800">Status Gateway</h4>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${
                  status.configured ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {status.configured ? 'Terhubung (Fonnte API)' : 'Belum Konfigurasi'}
                </p>
              </div>
            </div>
            {!status.configured && (
              <p className="text-xs text-rose-500 leading-relaxed bg-white/50 p-3 rounded-xl border border-rose-100">
                Lengkapi <code className="bg-rose-100 px-1 rounded">FONNTE_API_KEY</code> di file .env untuk mengaktifkan fitur ini.
              </p>
            )}
            {status.configured && (
              <div className="flex items-center gap-2 text-emerald-700 bg-white/50 p-3 rounded-xl border border-emerald-100">
                <CheckCircle2 size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Sistem Siap Digunakan</span>
              </div>
            )}
          </div>

          {/* Broadcast Cards */}
          {broadcastCards.map((card, i) => {
            const Icon = card.icon;
            const colors = colorMap[card.color];
            return (
              <div key={i} className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-32 h-32 ${colors.shadow} rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110`}></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-xl ${colors.bg}`}>
                      <Icon size={20} className={`text-${card.color}-600`} />
                    </div>
                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">{card.title}</h4>
                  </div>
                  <p className="text-slate-500 text-sm mb-5 leading-relaxed">
                    {card.desc}
                    {card.badge && (
                      <> <span className="text-blue-600 font-bold uppercase tracking-widest text-[10px]">{card.badge}</span>.</>
                    )}
                  </p>
                  
                  <button 
                    onClick={card.onClick}
                    disabled={card.loading || !status.configured}
                    className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                      card.loading 
                        ? 'bg-slate-100 text-slate-400' 
                        : `${colors.btn} hover:scale-[1.02] active:scale-95 disabled:bg-slate-100 disabled:shadow-none disabled:text-slate-400`
                    }`}
                  >
                    {card.loading ? (
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin"></div>
                    ) : (
                      <Icon size={16} />
                    )}
                    Jalankan Broadcast
                  </button>
                </div>
              </div>
            );
          })}

        </div>

        {/* Right: Manual Form & Logs */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Manual Send Form */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20">
             <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-3">
               <MessageSquare size={22} className="text-blue-600" />
               Kirim Pesan Manual
             </h4>
             
             <form onSubmit={handleSendManual} className="space-y-5">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nomor WhatsApp</label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="6281234567890"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="w-full pl-11 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-sm transition-all outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-end mb-1">
                    <p className="text-[11px] text-slate-400 italic">Gunakan format 628xxx tanpa simbol &apos;+&apos; atau &apos;-&apos;</p>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Isi Pesan</label>
                  <textarea 
                    rows={4}
                    placeholder="Tulis pesan Anda disini..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-sm transition-all outline-none resize-none"
                  ></textarea>
               </div>

               <button 
                 type="submit"
                 disabled={sending}
                 className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-2 hover:translate-x-1"
               >
                 {sending ? 'Mengirim...' : 'Kirim Sekarang'}
                 <Send size={16} />
               </button>
             </form>
          </div>

          {/* History Logs */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
             <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                  <History size={20} className="text-slate-400" />
                  Riwayat Pengiriman
                </h4>
             </div>
             {user?.role !== 'superadmin' ? (
               <div className="p-8">
                 <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                   Riwayat log pengiriman hanya ditampilkan untuk superadmin. Bendahara tetap bisa memakai seluruh fitur broadcast dan kirim pesan manual dari halaman ini.
                 </div>
               </div>
             ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Waktu</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Aksi</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {logs.length > 0 ? logs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5 text-xs text-slate-500 font-mono">
                          {new Date(log.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'short' })}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                            log.action?.includes('NILAI') 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : log.action?.includes('PSB')
                              ? 'bg-purple-50 text-purple-600 border-purple-100'
                              : 'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-xs text-slate-600 font-medium">
                          {log.details}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className="py-16 text-center text-slate-400">
                          <History size={32} className="mx-auto mb-2 text-slate-200" />
                          Belum ada riwayat pengiriman
                        </td>
                      </tr>
                    )}
                  </tbody>
               </table>
             </div>
             )}
          </div>

        </div>

      </div>
    </div>
  );
}
