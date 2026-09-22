'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getNotificationStatus, getWARecipients, generateWAMessage, sendWhatsApp, broadcastTagihan, broadcastNilai, broadcastPSB, getLogs, type ActivityLog, type WARecipient } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { 
  Bell, 
  Send, 
  Smartphone, 
  CheckCircle2, 
  MessageSquare, 
  History,
  Zap,
  Users,
  BookOpen,
  ClipboardList,
  Settings2,
  Search,
  User,
  Sparkles,
  ReceiptText,
  ChevronDown,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import WASettingsPanel from '@/components/WASettingsPanel';

export default function NotificationsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [status, setStatus] = useState<{ success?: boolean; configured: boolean; whatsapp_configured: boolean; whatsapp_phone?: string; telegram_configured?: boolean }>({ success: false, configured: false, whatsapp_configured: false, telegram_configured: false });
  const [sending, setSending] = useState(false);
  const [broadcastingTagihan, setBroadcastingTagihan] = useState(false);
  const [broadcastingNilai, setBroadcastingNilai] = useState(false);
  const [broadcastingPSB, setBroadcastingPSB] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  
  // Form states
  const [target, setTarget] = useState('');
  const [message, setMessage] = useState('');
  const [recipients, setRecipients] = useState<WARecipient[]>([]);
  const [q, setQ] = useState('');
  const [showQ, setShowQ] = useState(false);
  const [sel, setSel] = useState<WARecipient | null>(null);
  const [aiTujuan, setAiTujuan] = useState('');
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    const [statusData, logsData] = await Promise.all([
      getNotificationStatus(),
      user?.role === 'superadmin' ? getLogs('SEND_WA') : Promise.resolve([])
    ]);
    setStatus(statusData);
    setLogs(logsData);
  }, [user?.role]);

  useEffect(() => {
    void fetchData();
    const t = window.setInterval(() => { void fetchData(); }, 15000);
    return () => window.clearInterval(t);
  }, [fetchData]);

  useEffect(() => {
    void getWARecipients().then(setRecipients);
  }, []);

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
        void fetchData();
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Gagal mengirim pesan';
      showToast('error', message);
    setSending(false);
  };

  const selectRecipient = (r: WARecipient) => {
    setSel(r);
    setShowQ(false);
    setQ(r.name);
    setTarget(r.parent_phone || r.father_phone || r.mother_phone || '');
  };

  const formatMoney = (n: number) => new Intl.NumberFormat('id-ID').format(n || 0);

  const kwitansiObj = sel?.receipt_no
    ? { receipt_no: sel.receipt_no, period: sel.period, total: sel.receipt_total || 0, method: sel.method || '' }
    : null;

  const useKwitansi = () => {
    if (!sel || !kwitansiObj) return;
    setMessage(
      "Assalamu'alaikum Wr. Wb.\n\n" +
      `Yth. Wali Santri *${sel.name}*,\n` +
      `Alhamdulillah, pembayaran periode *${kwitansiObj.period}* telah kami terima dengan rincian:\n\n` +
      `No. Kwitansi: *${kwitansiObj.receipt_no}*\n` +
      `Total: *Rp ${formatMoney(kwitansiObj.total)}*\n\n` +
      "Kwitansi rekap dapat dilihat/diunduh di dashboard pembayaran:\nhttps://almaparung.com/portal/payment-spp\n\n" +
      "Jazakumullahu khairan.\n_Bendahara Al-Maa_"
    );
  };

  const handleAIGenerate = async () => {
    if (!sel) return;
    setGenerating(true);
    try {
      const msg = await generateWAMessage({
        nama: sel.name,
        wali: sel.parent_name || sel.father_name || sel.mother_name || '',
        phone: target,
        tujuan: aiTujuan,
        kwitansi: kwitansiObj
      });
      if (msg) setMessage(msg);
      else showToast('error', 'AI belum menghasilkan pesan. Isi API Key di Pengaturan → AI Config.');
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Gagal membuat pesan AI');
    } finally {
      setGenerating(false);
    }
  };

  const filtered = recipients.filter(r => {
    const hay = [r.name, r.nickname, r.parent_name, r.parent_phone, r.father_phone, r.mother_phone].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q.toLowerCase().trim());
  });

  const phoneOptions = (() => {
    if (!sel) return [] as { label: string; phone: string }[];
    const opts: { label: string; phone: string }[] = [];
    if (sel.parent_phone) opts.push({ label: `Wali (utama) · ${sel.parent_phone}`, phone: sel.parent_phone });
    if (sel.father_phone && sel.father_phone !== sel.parent_phone) opts.push({ label: `Ayah · ${sel.father_phone}`, phone: sel.father_phone });
    if (sel.mother_phone && sel.mother_phone !== sel.parent_phone && sel.mother_phone !== sel.father_phone) opts.push({ label: `Ibu · ${sel.mother_phone}`, phone: sel.mother_phone });
    if (opts.length === 0) opts.push({ label: 'Belum ada nomor WA', phone: '' });
    return opts;
  })();

  const handleBroadcastTagihan = async () => {
    if (!status.configured) { showToast('error', 'WhatsApp Gateway belum tersambung. Minta Superadmin menautkan nomor HP pondok.'); return; }
    if (!confirm('Kirim pengingat tagihan SPP ke semua santri yang menunggak?')) return;

    setBroadcastingTagihan(true);
    try {
      const res = await broadcastTagihan();
      if (res.success) {
        showToast('success', `${res.count} pesan broadcast tagihan berhasil dikirim!`);
        void fetchData();
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Gagal mengirim broadcast';
      showToast('error', message);
    } finally {
      setBroadcastingTagihan(false);
    }
  };

  const handleBroadcastNilai = async () => {
    if (!status.configured) { showToast('error', 'WhatsApp Gateway belum tersambung. Minta Superadmin menautkan nomor HP pondok.'); return; }
    if (!confirm('Kirim notifikasi nilai raport ke wali santri yang memiliki nomor WA?')) return;

    setBroadcastingNilai(true);
    try {
      const res = await broadcastNilai();
      if (res.success) {
        showToast('success', `${res.count} pesan broadcast nilai berhasil dikirim!`);
        void fetchData();
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Gagal mengirim broadcast nilai';
      showToast('error', message);
    } finally {
      setBroadcastingNilai(false);
    }
  };

  const handleBroadcastPSB = async () => {
    if (!status.configured) { showToast('error', 'WhatsApp Gateway belum tersambung. Minta Superadmin menautkan nomor HP pondok.'); return; }
    if (!confirm('Kirim status pendaftaran PSB ke semua wali calon santri?')) return;

    setBroadcastingPSB(true);
    try {
      const res = await broadcastPSB();
      if (res.success) {
        showToast('success', `${res.count} pesan broadcast PSB berhasil dikirim!`);
        void fetchData();
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Gagal mengirim broadcast PSB';
      showToast('error', message);
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
    blue: { btn: 'bg-sky-600 text-white shadow-xl shadow-sky-200', shadow: 'bg-sky-50', bg: 'bg-sky-50' },
    emerald: { btn: 'bg-sky-600 text-white shadow-xl shadow-sky-200', shadow: 'bg-sky-50', bg: 'bg-sky-50' },
    purple: { btn: 'bg-purple-600 text-white shadow-xl shadow-purple-200', shadow: 'bg-purple-50', bg: 'bg-purple-50' },
  };

  return (
    <div className="pb-10 font-outfit">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
          <Bell className="text-sky-600" size={32} />
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
              ? 'bg-sky-50 border-sky-100' 
              : 'bg-rose-50 border-rose-100'
          }`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-2xl ${
                status.configured ? 'bg-sky-500 text-white' : 'bg-rose-500 text-white shadow-lg shadow-rose-200'
              }`}>
                <Zap size={24} />
              </div>
              <div>
                <h4 className="font-black uppercase tracking-tight text-slate-800">Status Gateway</h4>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${
                  status.configured ? 'text-sky-600' : 'text-rose-600'
                }`}>
                  {status.configured ? 'Terhubung (Gateway Sendiri)' : 'Belum Konfigurasi'}
                </p>
              </div>
            </div>
            {!status.configured && (
              <p className="text-xs text-rose-500 leading-relaxed bg-white/50 p-3 rounded-xl border border-rose-100">
                Nomor HP pondok belum ditautkan. Minta Superadmin menautkan lewat panel <b className="font-bold">Konfigurasi &amp; Template</b> di halaman ini (Scan QR / Kode 8 digit) untuk mengaktifkan semua fitur.
              </p>
            )}
            {status.configured && (
              <div className="flex items-center gap-2 text-sky-700 bg-white/50 p-3 rounded-xl border border-sky-100">
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
                      <> <span className="text-sky-600 font-bold uppercase tracking-widest text-[10px]">{card.badge}</span>.</>
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
               <MessageSquare size={22} className="text-sky-600" />
               Kirim Pesan Manual
             </h4>
             
             <form onSubmit={handleSendManual} className="space-y-5">
               {/* Pilih penerima: santri/wali otomatis */}
               <div className="space-y-2 relative">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                   Pilih Penerima (Santri / Wali)
                 </label>
                 <div className="relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input
                     type="text"
                     placeholder="Ketik nama santri, nama wali, atau nomor WA..."
                     value={q}
                     onChange={(e) => { setQ(e.target.value); setShowQ(true); if (e.target.value.trim() === '') setSel(null); }}
                     onFocus={() => setShowQ(true)}
                     className="w-full pl-11 pr-10 py-4 bg-slate-50 border-2 border-transparent focus:border-sky-500 focus:bg-white rounded-2xl text-sm transition-all outline-none"
                   />
                   <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 </div>

                 {showQ && (
                   <>
                     <div className="absolute z-30 left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl max-h-72 overflow-y-auto">
                       {recipients.length === 0 ? (
                         <div className="p-4 text-xs text-slate-400">Memuat data santri...</div>
                       ) : filtered.length === 0 ? (
                         <div className="p-4 text-xs text-slate-400">Tidak ada hasil</div>
                       ) : filtered.slice(0, 12).map(r => (
                         <button
                           type="button"
                           key={r.santri_id}
                           onClick={() => selectRecipient(r)}
                           className="w-full text-left px-4 py-3 hover:bg-sky-50/60 transition-colors border-b border-slate-50 last:border-0"
                         >
                           <div className="flex items-center justify-between gap-3">
                             <div className="min-w-0">
                               <p className="text-sm font-bold text-slate-800 truncate">
                                 {r.name} <span className="text-slate-400 font-medium text-[11px]">({r.class || 'Kelas -'})</span>
                               </p>
                               <p className="text-[11px] text-slate-500 truncate">
                                 Wali: {r.parent_name || '-'} · {r.parent_phone || r.father_phone || r.mother_phone || '-'}
                               </p>
                             </div>
                             {r.receipt_no && (
                               <span className="shrink-0 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                                 Kwitansi
                               </span>
                             )}
                           </div>
                         </button>
                       ))}
                     </div>
                     <div className="h-2" onClick={() => setShowQ(false)}></div>
                   </>
                 )}
               </div>

               {sel && (
                 <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4 space-y-3">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-sky-600 text-white rounded-xl flex items-center justify-center">
                       <User size={18} />
                     </div>
                     <div className="min-w-0">
                       <p className="text-sm font-black text-slate-800 truncate">{sel.name}</p>
                       <p className="text-[11px] text-slate-500 truncate">
                         Wali: {sel.parent_name || '-'} · Status: {sel.status || '-'}
                       </p>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nomor WA Tujuan</label>
                       <select
                         value={target}
                         onChange={(e) => setTarget(e.target.value)}
                         className="w-full px-4 py-2.5 bg-white border-2 border-transparent focus:border-sky-500 rounded-xl text-sm outline-none"
                       >
                         {phoneOptions.map((o, i) => (
                           <option key={i} value={o.phone}>{o.label}</option>
                         ))}
                       </select>
                       <input
                         type="text"
                         value={target}
                         onChange={(e) => setTarget(e.target.value)}
                         className="w-full px-4 py-2.5 bg-white border-2 border-transparent focus:border-sky-500 rounded-xl text-sm outline-none font-mono"
                         placeholder="Edit nomor jika perlu (628xxx)"
                       />
                     </div>
                     <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Konteks Pesan (untuk AI)</label>
                       <input
                         type="text"
                         value={aiTujuan}
                         onChange={(e) => setAiTujuan(e.target.value)}
                         placeholder="cth: mengingatkan SPP bulan depan"
                         className="w-full px-4 py-2.5 bg-white border-2 border-transparent focus:border-sky-500 rounded-xl text-sm outline-none"
                       />
                       <p className="text-[10px] text-slate-400 italic">Kosongkan untuk pesan umum yang sopan.</p>
                     </div>
                   </div>

                   {kwitansiObj && (
                     <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                       <div className="flex items-start justify-between gap-3">
                         <div className="min-w-0">
                           <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1 flex items-center gap-1.5">
                             <ReceiptText size={13} /> Kwitansi Terakhir Siap Kirim
                           </p>
                           <p className="text-sm font-bold text-slate-800 truncate">No. {kwitansiObj.receipt_no}</p>
                           <p className="text-xs text-slate-500 truncate">
                             Periode {kwitansiObj.period} · Total Rp {formatMoney(kwitansiObj.total)} · {kwitansiObj.method || '-'}
                           </p>
                         </div>
                         <button
                           type="button"
                           onClick={useKwitansi}
                           className="shrink-0 px-3 py-2 text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                         >
                           Pakai Kwitansi
                         </button>
                       </div>
                     </div>
                   )}
                 </div>
               )}

               {!sel && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Atau isi nomor manual</label>
                     <div className="relative">
                       <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <input
                         type="text"
                         placeholder="6281234567890"
                         value={target}
                         onChange={(e) => setTarget(e.target.value)}
                         className="w-full pl-11 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-sky-500 focus:bg-white rounded-2xl text-sm transition-all outline-none"
                       />
                     </div>
                   </div>
                   <div className="flex items-end mb-1">
                     <p className="text-[11px] text-slate-400 italic">Gunakan format 628xxx tanpa simbol &apos;+&apos; atau &apos;-&apos;</p>
                   </div>
                 </div>
               )}

               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Isi Pesan</label>
                 <textarea
                   rows={4}
                   placeholder="Tulis pesan Anda disini, atau klik 'Buat Pesan AI'..."
                   value={message}
                   onChange={(e) => setMessage(e.target.value)}
                   className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-sky-500 focus:bg-white rounded-2xl text-sm transition-all outline-none resize-none"
                 ></textarea>
               </div>

               <div className="flex flex-wrap items-center gap-3">
                 <button
                   type="button"
                   onClick={handleAIGenerate}
                   disabled={generating || !sel}
                   className="px-5 py-3.5 bg-gradient-to-r from-violet-600 to-sky-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-violet-600/20 hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
                 >
                   {generating ? (
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                   ) : (
                     <Sparkles size={15} />
                   )}
                   {generating ? 'Menulis...' : 'Buat Pesan AI'}
                 </button>
                 <button
                   type="submit"
                   disabled={sending || !target.trim() || !message.trim()}
                   className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-2 hover:translate-x-1 disabled:opacity-50 disabled:shadow-none"
                 >
                   {sending ? 'Mengirim...' : 'Kirim Sekarang'}
                   <Send size={16} />
                 </button>
               </div>
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
             <div className="ap-table-wrap overflow-x-auto">
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
                              ? 'bg-sky-50 text-sky-600 border-sky-100'
                              : log.action?.includes('PSB')
                              ? 'bg-purple-50 text-purple-600 border-purple-100'
                              : 'bg-sky-50 text-sky-600 border-sky-100'
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

      {user?.role === 'superadmin' && (
        <div className="mt-12">
          <div className="mb-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
              <Settings2 size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight font-outfit">Konfigurasi &amp; Template</h3>
              <p className="text-slate-500 mt-1 text-sm font-medium">Pairing nomor HP pondok, kwitansi otomatis, dan template pesan — satu tempat.</p>
            </div>
          </div>
          <WASettingsPanel />
        </div>
      )}
    </div>
  );
}
