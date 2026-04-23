'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getLogs, ActivityLog } from '@/lib/api';
import { exportToPDF, exportToExcel } from '@/lib/export';
import { 
  ScrollText, 
  Search, 
  User, 
  Clock, 
  Terminal, 
  Globe, 
  Monitor, 
  Info, 
  FileDown, 
  FileSpreadsheet, 
  Filter, 
  ShieldAlert,
  ArrowRightCircle,
  Hash
} from 'lucide-react';

export default function LogsAdminPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // State for search debouncing
  const [serverSearch, setServerSearch] = useState('');

  const fetchLogs = useCallback(async (searchQuery = serverSearch) => {
    setIsLoading(true);
    try {
      const data = await getLogs(searchQuery);
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setIsLoading(false);
    }
  }, [serverSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setServerSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExportPDF = () => {
    const columns = ['Waktu', 'User', 'Aksi', 'Detail', 'IP Address'];
    const rows = logs.map(l => [
      l.created_at,
      l.user_name || 'System',
      l.action,
      l.details,
      l.ip_address
    ]);
    exportToPDF('Audit Log Aktivitas Sistem', columns, rows, 'audit_logs');
  };

  const handleExportExcel = () => {
    const columns = ['Waktu', 'User', 'Aksi', 'Detail', 'IP Address', 'User Agent'];
    const rows = logs.map(l => [
      l.created_at,
      l.user_name || 'System',
      l.action,
      l.details,
      l.ip_address,
      l.user_agent
    ]);
    exportToExcel('Audit Log Aktivitas Sistem', columns, rows, 'audit_logs');
  };

  return (
    <div className="pb-10 font-outfit">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight flex items-center gap-3">
             <ScrollText className="text-amber-500" size={32} />
             Jejak Digital Sistem
          </h1>
          <p className="text-slate-500 text-sm font-medium">Monitoring transparansi operasional dan audit keamanan akses pengurus.</p>
        </div>
        
        <div className="flex gap-3 shrink-0 w-full md:w-auto">
            <button 
              onClick={handleExportPDF}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all shadow-sm"
            >
              <FileDown size={16} /> PDF Report
            </button>
            <button 
              onClick={handleExportExcel}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all shadow-sm"
            >
              <FileSpreadsheet size={16} /> Excel Sync
            </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-10 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 relative group w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Cari berdasarkan aksi (LOGIN, UPDATE), nama user, atau detail spesifik..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-16 pr-8 py-4 bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-500 rounded-xl text-sm font-bold transition-all outline-none shadow-inner"
            />
          </div>
          
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 px-6 py-4 rounded-xl shadow-inner text-slate-400">
             <Filter size={18} />
             <span className="text-xs font-black uppercase tracking-widest text-slate-500">{logs.length} Entri Tercatat</span>
          </div>
      </div>

      {/* Main Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl shadow-slate-200/40 overflow-hidden mb-12 relative">
        {isLoading && logs.length === 0 ? (
          <div className="py-40 flex flex-col items-center justify-center animate-pulse">
            <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mb-6">
                <Terminal className="text-slate-200" size={40} />
            </div>
            <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-xs font-outfit">Membaca Memori Sistem...</p>
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto min-h-[500px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="pl-10 pr-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Metadata Audit</th>
                  <th className="px-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Subjek & Waktu</th>
                  <th className="px-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Akses & Aksi</th>
                  <th className="pr-10 pl-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Detail Perubahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log) => (
                  <tr key={log.id} className="group hover:bg-amber-50/30 transition-all duration-500">
                    <td className="pl-10 pr-6 py-8">
                       <span className="flex items-center gap-1.5 text-[10px] font-black font-mono text-slate-300 group-hover:text-amber-500 transition-colors">
                         <Hash size={12} /> {log.id}
                       </span>
                    </td>
                    <td className="px-6 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-white border-2 border-slate-100 flex items-center justify-center text-slate-400 shadow-sm group-hover:border-amber-200 group-hover:text-amber-500 transition-all duration-500">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 uppercase tracking-tight text-base leading-none mb-2">{log.user_name || 'Autopilot System'}</p>
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            <Clock size={12} /> {log.created_at}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-8">
                       <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                             <span className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100">
                                {log.action}
                             </span>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className="flex items-center gap-1 text-[10px] font-black font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                <Globe size={10} /> {log.ip_address || 'Internal'}
                             </span>
                             <span className="flex items-center gap-1 text-[10px] font-black font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 truncate max-w-[120px]" title={log.user_agent}>
                                <Monitor size={10} /> {log.user_agent?.split(' ')[0] || 'Unknown'}
                             </span>
                          </div>
                       </div>
                    </td>
                    <td className="pr-10 pl-6 py-8">
                          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 group-hover:bg-white group-hover:shadow-inner transition-all duration-500">
                          <p className="text-slate-600 text-xs font-bold leading-relaxed">{log.details}</p>
                          <div className="flex justify-end mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                             <ArrowRightCircle size={16} className="text-amber-200" />
                          </div>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-40 text-center">
             <div className="w-24 h-24 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                <ShieldAlert className="text-slate-200" size={48} />
             </div>
             <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight font-outfit">Sistem Terkalibrasi</h3>
             <p className="text-slate-400 max-w-sm mx-auto text-sm font-medium">Tidak ada anomali atau aktivitas yang tercatat sesuai dengan kriteria pencarian Anda.</p>
          </div>
        )}
      </div>

      {/* Security Footer Note */}
      <div className="bg-slate-900 p-12 rounded-xl text-white overflow-hidden relative group">
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full -ml-32 -mb-32 blur-3xl transition-all group-hover:bg-amber-500/20"></div>
        <div className="relative flex flex-col md:flex-row items-center gap-10">
           <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center text-amber-500 border border-white/10 shrink-0">
              <Info size={32} />
           </div>
           <div>
              <h4 className="text-2xl font-black uppercase tracking-tight mb-3 font-outfit">Protokol Integritas Audit</h4>
              <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-3xl">
                Setiap perubahan pada basis data Darussunnah dicatat secara permanen untuk mematuhi standar audit keamanan cyber. Data ini bersifat <strong>Read-Only</strong> dan tidak dapat dianulir atau dihapus oleh pihak manapun guna menjamin validitas historis platform.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
