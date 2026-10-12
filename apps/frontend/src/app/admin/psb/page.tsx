'use client';

import React, { useState, useEffect } from 'react';
import { deletePSBRegistration, getRegistrations, Registration } from '@/lib/api';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { 
  Search, 
  Filter, 
  Eye,
  FileDown,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';
import { exportToPDF, exportToExcel } from '@/lib/export';
import Link from 'next/link';

export default function PSBAdminPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeJenjang, setActiveJenjang] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Registration | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  const categories = Array.from(new Set(registrations.map(r => r.program_choice).filter(Boolean)));
  const smpCount = registrations.filter(r => (r.jenjang || '').toLowerCase() === 'smp').length;
  const smkCount = registrations.filter(r => (r.jenjang || '').toLowerCase() === 'smk').length;

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    const data = await getRegistrations();
    setRegistrations(data);
    setIsLoading(false);
  };

  const handleExportPDF = () => {
    const columns = ['Nama Santri', 'Gender', 'Jenjang', 'Sekolah Asal', 'Status'];
    const rows = filteredRegistrations.map(r => [
      r.full_name,
      r.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      r.jenjang?.toUpperCase(),
      r.school_origin,
      r.status.toUpperCase()
    ]);
    exportToPDF('Laporan Pendaftaran Santri Baru', columns, rows, 'laporan_psb');
  };

  const handleExportExcel = () => {
    const columns = ['Nama Santri', 'Gender', 'Jenjang', 'Sekolah Asal', 'Status'];
    const rows = filteredRegistrations.map(r => [
      r.full_name,
      r.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      r.jenjang?.toUpperCase(),
      r.school_origin,
      r.status
    ]);
    exportToExcel('Laporan Pendaftaran Santri Baru', columns, rows, 'laporan_psb');
  };

  const filteredRegistrations = registrations.filter(r =>
    (!activeCategory || r.program_choice === activeCategory) &&
    (!activeJenjang || (r.jenjang || '').toLowerCase() === activeJenjang) &&
    (r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.school_origin.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deletePSBRegistration(deleteTarget.id);
      showToast('success', `Data santri ${deleteTarget.full_name} berhasil dihapus.`);
      setDeleteTarget(null);
      await fetchRegistrations();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Gagal menghapus data santri.';
      showToast('error', message);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'review': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'tes': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 're_registration': return 'bg-violet-100 text-violet-700 border-violet-200';
      case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'santri': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'Menunggu';
      case 'review': return 'Direview';
      case 'tes': return 'Tes Seleksi';
      case 'accepted': return 'Diterima';
      case 're_registration': return 'Daftar Ulang';
      case 'rejected': return 'Ditolak';
      case 'santri': return 'Santri';
      default: return 'Menunggu';
    }
  };

  return (
    <>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight">Penerimaan Santri Baru</h1>
          <p className="text-slate-500 text-sm">Validasi data calon santri dan kelola status seleksi pendaftaran di layar penuh.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100"
          >
            <FileDown size={18} />
            <span>PDF</span>
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-6 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100"
          >
            <FileSpreadsheet size={18} />
            <span>Excel</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-6 mb-10">
         {[
         { label: 'Total Pendaftar', count: registrations.length, color: 'bg-emerald-500' },
          { label: 'Menunggu', count: registrations.filter(r => r.status === 'pending').length, color: 'bg-amber-500' },
          { label: 'Direview', count: registrations.filter(r => r.status === 'review').length, color: 'bg-emerald-500' },
          { label: 'Tes Seleksi', count: registrations.filter(r => r.status === 'tes').length, color: 'bg-indigo-500' },
          { label: 'Diterima', count: registrations.filter(r => r.status === 'accepted').length, color: 'bg-emerald-500' },
          { label: 'Daftar Ulang', count: registrations.filter(r => r.status === 're_registration').length, color: 'bg-violet-500' },
          { label: 'Ditolak', count: registrations.filter(r => r.status === 'rejected').length, color: 'bg-rose-500' },
          { label: 'Santri', count: registrations.filter(r => r.status === 'santri').length, color: 'bg-emerald-500' },
         ].map((stat, i) => (
           <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</div>
              <div className="text-4xl font-black text-slate-900">{stat.count}</div>
              <div className={`h-1.5 w-12 ${stat.color} rounded-full mt-6 opacity-80`}></div>
           </div>
         ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-6">
            <div className="relative flex-1 max-w-md group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
               <input 
                 type="text" 
                 placeholder="Cari nama santri atau asal sekolah..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm" 
               />
            </div>
            <div className="flex gap-3">
               <button className="flex items-center gap-2 px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200 hover:bg-slate-100 transition-all">
                  <Filter size={18} />
                  Saring Data
               </button>
            </div>
         </div>

         <div className="overflow-x-auto">
            <div className="flex items-center gap-2 px-8 pt-6 pb-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveCategory('')}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-widest border transition-all ${
                  activeCategory === ''
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                Semua
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${activeCategory === '' ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                  {registrations.length}
                </span>
              </button>
              {categories.map(cat => {
                const count = registrations.filter(r => r.program_choice === cat).length;
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(active ? '' : cat)}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-widest border transition-all ${
                      active
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                    }`}
                  >
                    {cat}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

         <div className="flex items-center gap-2 px-8 pt-2 pb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jenjang:</span>
              <button onClick={() => setActiveJenjang('')} className={activeJenjang === '' ? 'rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest border bg-slate-900 text-white border-slate-900' : 'rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest border bg-white text-slate-500 border-slate-200'}>Semua ({registrations.length})</button>
              <button onClick={() => setActiveJenjang('smp')} className={activeJenjang === 'smp' ? 'rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest border bg-slate-900 text-white border-slate-900' : 'rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest border bg-white text-slate-500 border-slate-200'}>SMP ({smpCount})</button>
              <button onClick={() => setActiveJenjang('smk')} className={activeJenjang === 'smk' ? 'rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest border bg-slate-900 text-white border-slate-900' : 'rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest border bg-white text-slate-500 border-slate-200'}>SMK ({smkCount})</button>
            </div>

         <div className="ap-table-wrap overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50 block md:table-row">
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest block md:table-cell">Calon Santri</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest block md:table-cell">Jenis Kelamin</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest block md:table-cell">Jenjang</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest block md:table-cell">Asal Sekolah Dasar</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest block md:table-cell">Status Administrasi</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right block md:table-cell">Tinjau</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {!isLoading ? (
                    filteredRegistrations.length > 0 ? (
                      filteredRegistrations.map((reg) => (
                        <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors group block md:table-row mb-4 md:mb-0">
                           <td className="px-8 py-6 block md:table-cell">
                              <div className="flex items-center gap-5">
                                 <div className="w-12 h-12 bg-emerald-50 rounded-[1rem] flex items-center justify-center font-black text-emerald-600 text-lg border border-emerald-100">
                                    {reg.full_name.charAt(0)}
                                 </div>
                                 <div className="min-w-0">
                                    <div className="font-black text-slate-900 text-[15px] truncate">{reg.full_name}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ref: #PSB-{reg.id.toString().padStart(4, '0')}</div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-6 block md:table-cell">
                              <span className="text-sm font-bold text-slate-600">{reg.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                           </td>
                           <td className="px-8 py-6 block md:table-cell">
                              <span className="rounded-lg bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">{(reg.jenjang || '-').toUpperCase()}</span>
                              <div className="text-sm font-bold text-slate-900">{reg.school_origin}</div>
                           </td>
                           <td className="px-8 py-6 block md:table-cell">
                              <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(reg.status)}`}>
                                 {getStatusLabel(reg.status)}
                              </span>
                           </td>
                           <td className="px-8 py-6 text-right block md:table-cell">
                              <div className="flex flex-col justify-end gap-2 md:flex-row">
                                <Link 
                                  href={`/admin/psb/detail/${reg.id}`}
                                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
                                >
                                   <Eye size={16} />
                                   Periksa Berkas
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(reg)}
                                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-rose-50 text-rose-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                                >
                                  <Trash2 size={16} />
                                  Hapus
                                </button>
                              </div>
                           </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic">
                          {registrations.length > 0 ? 'Data yang dicari tidak ditemukan.' : 'Belum ada data pendaftar.'}
                        </td>
                      </tr>
                    )
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
                      </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={handleDelete}
        title="Hapus Data Santri"
        message={deleteTarget ? `Data pendaftar ${deleteTarget.full_name} akan dihapus permanen dari daftar PSB. Tindakan ini tidak bisa dibatalkan.` : ''}
        confirmText="Ya, Hapus"
        type="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
