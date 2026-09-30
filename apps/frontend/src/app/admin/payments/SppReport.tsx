'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getCombinedReport, getSppSantri, CombinedRow, SppSantri } from '@/lib/api';
import { exportToPDF, exportToExcel } from '@/lib/export';
import { useToast } from '@/components/Toast';
import { Search, FileDown, FileSpreadsheet, Receipt, Wallet, Calendar } from 'lucide-react';

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function statusBadge(status: string) {
  if (status === 'paid') return 'bg-emerald-100 text-emerald-700';
  if (status === 'partial') return 'bg-amber-100 text-amber-700';
  if (status === 'unpaid') return 'bg-rose-100 text-rose-700';
  return 'bg-slate-100 text-slate-500';
}

function statusLabel(status: string) {
  if (status === 'paid') return 'Lunas';
  if (status === 'partial') return 'Sebagian';
  if (status === 'unpaid') return 'Belum Lunas';
  return 'Belum Ada Tagihan';
}

export default function SppReport() {
  const { showToast } = useToast();
  const [start, setStart] = useState(currentPeriod());
  const [end, setEnd] = useState(currentPeriod());
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [rows, setRows] = useState<CombinedRow[]>([]);
  const [santriList, setSantriList] = useState<SppSantri[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (s: string, e: string, cls: string) => {
    setIsLoading(true);
    try {
      const [rData, santri] = await Promise.all([
        getCombinedReport({ period_start: s, period_end: e, class: cls === 'all' ? undefined : cls }),
        getSppSantri(),
      ]);
      setRows(rData);
      setSantriList(santri);
    } catch {
      showToast('error', 'Gagal memuat laporan.');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (start && end) void fetchData(start, end, classFilter);
  }, [start, end, classFilter, fetchData]);

  const classes = Array.from(new Set(santriList.map((s) => s.class).filter(Boolean))).sort();

  const filtered = rows.filter((r) => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      r.name.toLowerCase().includes(q) ||
      (r.nis || '').toLowerCase().includes(q) ||
      (r.class || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const totalBilled = filtered.reduce((sum, r) => sum + r.billed, 0);
  const totalCollected = filtered.reduce((sum, r) => sum + r.collected, 0);
  const totalOutstanding = filtered.reduce((sum, r) => sum + r.outstanding, 0);

  const exportColumns = ['No Induk', 'Nama', 'Kelas', 'Tagihan SPP', 'Tagihan Iuran', 'Total Tagihan', 'Sudah Dibayar', 'Sisa', 'Status'];
  const exportRows = () =>
    filtered.map((r) => [r.nis || '-', r.name, r.class || '-', r.spp_billed, r.iuran_billed, r.billed, r.collected, r.outstanding, statusLabel(r.status)]);

  const handleExportPDF = async () => {
    await exportToPDF(`Laporan Tagihan ${start} s/d ${end}`, exportColumns, exportRows().map((row) =>
      row.map((v, i) => (i >= 3 && i <= 7 ? `Rp ${Number(v).toLocaleString('id-ID')}` : String(v)))
    ), 'laporan_tagihan');
  };

  const handleExportExcel = async () => {
    await exportToExcel(`Laporan Tagihan ${start} s/d ${end}`, exportColumns, exportRows(), 'laporan_tagihan');
  };

  const selectCls = 'px-5 py-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold text-slate-700 cursor-pointer';

  return (
    <div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Periode Awal</label>
            <input type="month" value={start} onChange={(e) => e.target.value && setStart(e.target.value)} className={`w-full ${selectCls}`} />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Periode Akhir</label>
            <input type="month" value={end} onChange={(e) => e.target.value && setEnd(e.target.value)} className={`w-full ${selectCls}`} />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Kelas</label>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className={`w-full ${selectCls}`}>
              <option value="all">Semua Kelas</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`w-full ${selectCls}`}>
              <option value="all">Semua Status</option>
              <option value="paid">Lunas</option>
              <option value="partial">Sebagian</option>
              <option value="unpaid">Belum Lunas</option>
              <option value="none">Belum Ada Tagihan</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search size={20} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari nama, NIS, atau kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-medium"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportPDF} className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-bold hover:bg-rose-100 transition-all shadow-sm">
              <FileDown size={18} /><span className="hidden sm:block">PDF</span>
            </button>
            <button onClick={handleExportExcel} className="flex items-center gap-2 px-6 py-3 bg-sky-50 text-sky-600 border border-sky-100 rounded-xl font-bold hover:bg-sky-100 transition-all shadow-sm">
              <FileSpreadsheet size={18} /><span className="hidden sm:block">Excel</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500 shrink-0 shadow-inner">
            <Receipt size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Tagihan</p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Rp {totalBilled.toLocaleString('id-ID')}</h3>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 shadow-inner">
            <Wallet size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Sudah Dibayar</p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Rp {totalCollected.toLocaleString('id-ID')}</h3>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0 shadow-inner">
            <Calendar size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Sisa Tunggakan</p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Rp {totalOutstanding.toLocaleString('id-ID')}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">No. Induk</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kelas</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tagihan SPP</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tagihan Iuran</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tagihan</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sudah Dibayar</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sisa</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {filtered.map((r) => (
                  <tr key={r.santri_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-8 py-5 font-mono text-slate-500">{r.nis || '-'}</td>
                    <td className="px-8 py-5 font-bold text-slate-800">{r.name}</td>
                    <td className="px-8 py-5 text-slate-600">{r.class || '-'}</td>
                    <td className="px-8 py-5 font-bold text-slate-800">Rp {r.spp_billed.toLocaleString('id-ID')}</td>
                    <td className="px-8 py-5 font-bold text-slate-800">Rp {r.iuran_billed.toLocaleString('id-ID')}</td>
                    <td className="px-8 py-5 font-black text-slate-900">Rp {r.billed.toLocaleString('id-ID')}</td>
                    <td className="px-8 py-5 font-bold text-emerald-700">Rp {r.collected.toLocaleString('id-ID')}</td>
                    <td className="px-8 py-5 font-bold text-rose-700">Rp {r.outstanding.toLocaleString('id-ID')}</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusBadge(r.status)}`}>
                        {statusLabel(r.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Receipt className="text-slate-200" size={40} />
            </div>
            <p className="text-slate-400 font-medium">Tidak ada data pada filter ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}
