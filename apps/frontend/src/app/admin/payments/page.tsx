'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPayments, deletePayment, Payment } from '@/lib/api';
import SppBills from './SppBills';
import SppReport from './SppReport';
import IuranBills from './IuranBills';
import IuranReport from './IuranReport';
import PayTransactions from './PayTransactions';
import Kasir from './Kasir';
import { exportToPDF, exportToExcel } from '@/lib/export';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { Plus, Trash2, CreditCard, User, Calendar, Receipt, Search, FileDown, FileSpreadsheet } from 'lucide-react';

export default function PaymentsAdminPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState<'bills' | 'manual' | 'report' | 'iuran' | 'iuran-report' | 'kasir' | 'transaksi'>('bills');
  const { showToast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    const pData = await getPayments();
    setPayments(pData);
    setIsLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      const pData = await getPayments();
      if (cancelled) {
        return;
      }
      setPayments(pData);
      setIsLoading(false);
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      const res = await deletePayment(selectedId);
      if (res.success) {
        showToast('success', 'Data pembayaran berhasil dihapus.');
        fetchData();
      } else {
        showToast('error', res.message || 'Gagal menghapus data.');
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Terjadi kesalahan sistem.';
      showToast('error', message);
    }
  };

  const handleExportPDF = () => {
    const columns = ['Nama Santri', 'Keterangan', 'Jumlah', 'Metode', 'Status', 'Tanggal'];
    const rows = filteredPayments.map(p => [
      p.user_name || 'User #' + p.user_id,
      p.description,
      `Rp ${p.amount.toLocaleString('id-ID')}`,
      p.method,
      p.status,
      p.payment_date.split(' ')[0]
    ]);
    exportToPDF('Laporan Pembayaran SPP', columns, rows, 'laporan_pembayaran');
  };

  const handleExportExcel = () => {
    const columns = ['Nama Santri', 'Keterangan', 'Jumlah', 'Metode', 'Status', 'Tanggal'];
    const rows = filteredPayments.map(p => [
      p.user_name || 'User #' + p.user_id,
      p.description,
      p.amount,
      p.method,
      p.status,
      p.payment_date.split(' ')[0]
    ]);
    exportToExcel('Laporan Pembayaran SPP', columns, rows, 'laporan_pembayaran');
  };

  const filteredPayments = payments.filter((p) => {
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = 
      (p.user_name || '').toLowerCase().includes(searchLower) ||
      (p.description || '').toLowerCase().includes(searchLower) ||
      (p.method || '').toLowerCase().includes(searchLower);
    return matchStatus && matchSearch;
  });

  const totalRevenue = payments.filter(p => p.status === 'success').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight flex items-center gap-3">
             <CreditCard className="text-sky-600" size={32} />
             Manajemen Pembayaran
          </h1>
          <p className="text-slate-500 text-sm">Catat dan kelola transaksi pembayaran SPP atau administrasi santri.</p>
        </div>
        {activeTab === 'manual' && (
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-bold hover:bg-rose-100 transition-all shadow-sm"
          >
            <FileDown size={18} />
            <span className="hidden sm:block">PDF</span>
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-6 py-3 bg-sky-50 text-sky-600 border border-sky-100 rounded-xl font-bold hover:bg-sky-100 transition-all shadow-sm"
          >
            <FileSpreadsheet size={18} />
            <span className="hidden sm:block">Excel</span>
          </button>
          <Link 
            href="/admin/payments/form"
            className="flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition-all shadow-lg shadow-sky-600/20 active:scale-95"
          >
            <Plus size={20} />
            <span>Tambah Pembayaran</span>
          </Link>
        </div>
        )}
      </div>

      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setActiveTab('bills')}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'bills' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
          Tagihan SPP
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'manual' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
          Pembayaran
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'report' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
          Laporan Tagihan
        </button>
        <button
          onClick={() => setActiveTab('iuran')}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'iuran' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
          Tagihan Iuran
        </button>
        <button
          onClick={() => setActiveTab('iuran-report')}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'iuran-report' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
          Laporan Iuran
        </button>
        <button
          onClick={() => setActiveTab('kasir')}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'kasir' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
          Kasir
        </button>
        <button
          onClick={() => setActiveTab('transaksi')}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'transaksi' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
          Lap. Transaksi
        </button>
      </div>

      <p className="-mt-6 mb-8 text-xs font-medium text-slate-400">
        {activeTab === 'kasir'
          ? 'Alur kasir: pilih santri, centang tagihan yang dibayar, lalu simpan — kwitansi tersedia.'
          : activeTab === 'manual'
            ? 'Catat dan kelola pembayaran manual di luar tagihan; ekspor PDF/Excel tersedia di kanan atas.'
            : activeTab === 'transaksi'
              ? 'Rincian transaksi per tanggal + cetak kwitansi.'
              : 'Kelola tagihan dan pembayaran santri.'}
      </p>

      {activeTab === 'bills' && <SppBills />}

      {activeTab === 'iuran' && <IuranBills />}

      {activeTab === 'report' && <SppReport />}

      {activeTab === 'iuran-report' && <IuranReport />}

      {activeTab === 'kasir' && <Kasir />}

      {activeTab === 'transaksi' && <PayTransactions />}

      {activeTab === 'manual' && (
      <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="w-16 h-16 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500 shrink-0 shadow-inner">
            <Receipt size={28} />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pemasukan</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">Rp {totalRevenue.toLocaleString('id-ID')}</h3>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="w-16 h-16 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0 shadow-inner">
            <Calendar size={28} />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Transaksi Pending</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{totalPending} Transaksi</h3>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search size={20} className="text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="Cari nama santri, keterangan, atau metode bayar..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-medium"
          />
        </div>
        <div className="shrink-0 w-full md:w-56 relative">
           <select 
             value={filterStatus}
             onChange={(e) => setFilterStatus(e.target.value)}
             className="w-full pl-5 pr-10 py-4 appearance-none bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold text-slate-700 cursor-pointer"
           >
             <option value="all">Semua Status</option>
             <option value="success">Sukses / Lunas</option>
             <option value="pending">Pending</option>
             <option value="failed">Gagal</option>
           </select>
           <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
             <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="py-32 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : payments.length > 0 ? (
          <div className="ap-table-wrap overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Santri / User</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Jumlah</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Metode</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {filteredPayments.length > 0 ? filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{p.user_name || 'User #' + p.user_id}</p>
                          <p className="text-[10px] text-slate-400 font-mono tracking-tight uppercase flex items-center gap-1">
                            <Calendar size={10} /> {p.payment_date.split(' ')[0]}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-slate-600 font-medium">{p.description}</td>
                    <td className="px-8 py-6">
                      <span className="font-black text-slate-900 tracking-tight">Rp {p.amount.toLocaleString('id-ID')}</span>
                    </td>
                    <td className="px-8 py-6">
                       <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">{p.method}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        p.status === 'success' ? 'bg-sky-100 text-sky-700' : 
                        p.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                         onClick={() => {
                           setSelectedId(p.id);
                           setIsDeleteOpen(true);
                         }}
                         className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-medium">
                      Pencarian tidak menemukan hasil.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-32 text-center">
             <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Receipt className="text-slate-200" size={40} />
             </div>
             <p className="text-slate-400 font-medium">Belum ada data pembayaran yang tercatat.</p>
          </div>
        )}
      </div>
      </>
      )}

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Pembayaran?"
        message="Catatan transaksi ini akan dihapus permanen dari riwayat keuangan."
        confirmText="Hapus"
      />
    </div>
  );
}
