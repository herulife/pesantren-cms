'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPayments, createPayment, deletePayment, getPaymentUsers, Payment, CompactUser } from '@/lib/api';
import { exportToPDF, exportToExcel } from '@/lib/export';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { Plus, Trash2, CreditCard, User, Calendar, Receipt, Search, X, FileDown, FileSpreadsheet } from 'lucide-react';

export default function PaymentsAdminPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<CompactUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { showToast } = useToast();

  // Form State
  const [formData, setFormData] = useState({
    user_id: '',
    amount: '',
    description: '',
    method: 'manual',
    status: 'success',
    payment_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [pData, uData] = await Promise.all([getPayments(), getPaymentUsers()]);
    setPayments(pData);
    setUsers(uData);
    setIsLoading(false);
  };

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
    } catch (e: any) {
      showToast('error', e.message || 'Terjadi kesalahan sistem.');
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_id || !formData.amount || !formData.description) {
      showToast('error', 'Harap isi semua field wajib.');
      return;
    }

    try {
      const res = await createPayment({
        user_id: parseInt(formData.user_id),
        amount: parseInt(formData.amount),
        description: formData.description,
        method: formData.method,
        status: formData.status,
        payment_date: formData.payment_date + " 00:00:00"
      });

      if (res.success) {
        showToast('success', 'Pembayaran berhasil dicatat.');
        setIsAddModalOpen(false);
        setFormData({
            user_id: '',
            amount: '',
            description: '',
            method: 'manual',
            status: 'success',
            payment_date: new Date().toISOString().split('T')[0]
        });
        fetchData();
      } else {
        showToast('error', res.message || 'Gagal menyimpan data.');
      }
    } catch (e: any) {
      showToast('error', e.message || 'Terjadi kesalahan sistem.');
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
             <CreditCard className="text-emerald-600" size={32} />
             Manajemen Pembayaran
          </h1>
          <p className="text-slate-500 text-sm">Catat dan kelola transaksi pembayaran SPP atau administrasi santri.</p>
        </div>
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
            className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl font-bold hover:bg-emerald-100 transition-all shadow-sm"
          >
            <FileSpreadsheet size={18} />
            <span className="hidden sm:block">Excel</span>
          </button>
          <Link 
            href="/admin/payments/form"
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <Plus size={20} />
            <span>Tambah Pembayaran</span>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center gap-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="w-16 h-16 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 shadow-inner">
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
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
          />
        </div>
        <div className="shrink-0 w-full md:w-56 relative">
           <select 
             value={filterStatus}
             onChange={(e) => setFilterStatus(e.target.value)}
             className="w-full pl-5 pr-10 py-4 appearance-none bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 cursor-pointer"
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
            <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : payments.length > 0 ? (
          <div className="overflow-x-auto">
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
                        p.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 
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

      {/* MODAL TAMBAH */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:px-0">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl relative shrink-0 overflow-hidden animate-in fade-in zoom-in duration-300">
             <form onSubmit={handleAddPayment}>
               <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-2xl font-black text-slate-900 uppercase font-outfit tracking-tight">Catat Pembayaran</h3>
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
               </div>
               
               <div className="p-10 space-y-6">
                 <div>
                   <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Pilih Santri / User</label>
                   <select 
                      value={formData.user_id} 
                      onChange={(e) => setFormData({...formData, user_id: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-800"
                    >
                      <option value="">-- Pilih User --</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                   </select>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                   <div>
                     <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Jumlah (Rp)</label>
                     <input 
                        type="number"
                        placeholder="Contoh: 500000"
                        value={formData.amount} 
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold"
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tanggal</label>
                     <input 
                        type="date"
                        value={formData.payment_date} 
                        onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold"
                     />
                   </div>
                 </div>

                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Keterangan</label>
                    <textarea 
                        rows={3}
                        placeholder="Contoh: Pembayaran SPP Bulan Januari 2025"
                        value={formData.description} 
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold"
                    ></textarea>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                   <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Metode</label>
                      <select 
                          value={formData.method} 
                          onChange={(e) => setFormData({...formData, method: e.target.value})}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold"
                      >
                        <option value="manual">Tunai / Manual</option>
                        <option value="transfer">Transfer Bank</option>
                        <option value="other">Lainnya</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                      <select 
                          value={formData.status} 
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold"
                      >
                        <option value="success">Sukses (Lunas)</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Gagal</option>
                      </select>
                   </div>
                 </div>
               </div>

               <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                  <button 
                     type="button" 
                     onClick={() => setIsAddModalOpen(false)}
                     className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                     type="submit"
                     className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20"
                  >
                    Simpan Transaksi
                  </button>
               </div>
             </form>
          </div>
        </div>
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
