'use client';

import Image from 'next/image';
import React, { useState, useEffect, useCallback } from 'react';
import { getCampaigns, getDonations, deleteCampaign, verifyDonation, Campaign, Donation } from '@/lib/api';
import { exportToPDF, exportToExcel } from '@/lib/export';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { Heart, Plus, TrendingUp, Users, DollarSign, ArrowUpRight, Trash2, Search, CheckCircle, Clock, FileDown, FileSpreadsheet, Filter, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function DonationsAdminPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI States
  const [activeTab, setActiveTab] = useState<'campaigns' | 'transactions'>('campaigns');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState<number | 'all'>('all');

  const { showToast } = useToast();

  const fetchCampaigns = useCallback(async (search = searchQuery) => {
    setIsLoading(true);
    const data = await getCampaigns({ search });
    setCampaigns(data);
    setIsLoading(false);
  }, [searchQuery]);

  const fetchDonations = useCallback(async (search = searchQuery, status = filterStatus, campaignID = campaignFilter) => {
    setIsLoading(true);
    const data = await getDonations({ 
        search, 
        status: status === 'all' ? '' : status,
        campaignID: campaignID === 'all' ? undefined : campaignID
    });
    setDonations(data);
    setIsLoading(false);
  }, [searchQuery, filterStatus, campaignFilter]);

  const fetchData = useCallback(() => {
    if (activeTab === 'campaigns') {
        fetchCampaigns(searchQuery);
    } else {
        fetchDonations(searchQuery, filterStatus, campaignFilter);
    }
  }, [activeTab, searchQuery, filterStatus, campaignFilter, fetchCampaigns, fetchDonations]);

  // Handle Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
        fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, filterStatus, campaignFilter, fetchData]);

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsDeleting(true);
    try {
      const res = await deleteCampaign(selectedId);
      if (res.success) {
        showToast('success', 'Kampanye berhasil dihapus.');
        fetchData();
        setIsDeleteOpen(false);
      } else {
        showToast('error', 'Gagal menghapus kampanye.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
      showToast('error', message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVerify = async (id: number) => {
    try {
      const res = await verifyDonation(id);
      if (res.success) {
        showToast('success', 'Donasi berhasil diverifikasi!');
        fetchData();
      } else {
        showToast('error', 'Gagal memverifikasi donasi.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
      showToast('error', message);
    }
  };

  const handleExportPDF = () => {
    const columns = ['Donatur', 'Kampanye', 'Jumlah', 'Status', 'Tanggal'];
    const rows = donations.map(d => [
      d.donor_name,
      d.campaign_title,
      `Rp ${d.amount.toLocaleString('id-ID')}`,
      d.status,
      new Date(d.created_at).toLocaleDateString('id-ID')
    ]);
    exportToPDF('Laporan Transaksi Donasi', columns, rows, 'laporan_donasi');
  };

  const handleExportExcel = () => {
    const columns = ['Donatur', 'Kampanye', 'Jumlah', 'Status', 'Tanggal'];
    const rows = donations.map(d => [
      d.donor_name,
      d.campaign_title,
      d.amount,
      d.status,
      new Date(d.created_at).toLocaleDateString('id-ID')
    ]);
    exportToExcel('Laporan Transaksi Donasi', columns, rows, 'laporan_donasi');
  };

  const totalCollected = campaigns.reduce((acc, c) => acc + c.collected_amount, 0);
  const activeCampaignsCount = campaigns.filter(c => c.is_active === 1).length;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight">Sentra Filantropi</h1>
          <p className="text-slate-500 text-sm font-medium">Kelola dana umat, verifikasi kontribusi, dan pantau dampak sosial pondok.</p>
        </div>
        <Link 
          href="/admin/donations/add"
          className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
        >
          <Plus size={20} />
          <span>Buat Kampanye</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-500">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-inner">
               <DollarSign size={28} />
            </div>
            <span className="text-emerald-600 text-[9px] font-black bg-emerald-50 px-3 py-1.5 rounded-full flex items-center gap-1 border border-emerald-100 uppercase tracking-widest">
               <ArrowUpRight size={14} /> Berkelanjutan
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 mb-1 font-outfit line-clamp-1">Rp {totalCollected.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Agregat Dana Sosial</div>
        </div>

        <div className="bg-emerald-950 p-8 rounded-xl shadow-2xl shadow-emerald-950/20 relative overflow-hidden group transition-all duration-500 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-900/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-amber-400/10 transition-colors duration-700"></div>
          <div className="w-14 h-14 bg-emerald-900 rounded-xl flex items-center justify-center text-amber-400 mb-6 border border-emerald-800 shadow-lg">
             <TrendingUp size={28} />
          </div>
          <div className="text-3xl font-black text-white mb-1 font-outfit">{activeCampaignsCount}</div>
          <div className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em]">Kampanye Berjalan</div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm group hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-500">
          <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-6 border border-emerald-100 shadow-inner">
             <Users size={28} />
          </div>
          <div className="text-3xl font-black text-slate-900 mb-1 font-outfit">{donations.length >= 10 ? donations.length : `0${donations.length}`}</div>
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Kontributor Teridentifikasi</div>
        </div>
      </div>

      {/* Tabs & Universal Filters */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6 mb-10">
         <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-100 shadow-inner shrink-0 w-full lg:w-auto">
                <button 
                  onClick={() => { setActiveTab('campaigns'); setSearchQuery(''); }}
                  className={`flex-1 lg:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'campaigns' ? 'bg-white text-emerald-600 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Daftar Kampanye
                </button>
                <button 
                  onClick={() => { setActiveTab('transactions'); setSearchQuery(''); }}
                  className={`flex-1 lg:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'transactions' ? 'bg-white text-emerald-600 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Log Transaksi
                </button>
            </div>

            <div className="flex-1 w-full relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder={activeTab === 'campaigns' ? "Cari judul kampanye atau deskripsi..." : "Cari nama donatur atau ID transaksi..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm shadow-inner"
                />
            </div>
         </div>

         {activeTab === 'transactions' && (
           <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-slate-100 animate-in fade-in duration-500">
              <div className="flex items-center gap-3 shrink-0">
                 <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <Filter size={18} />
                 </div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter Lanjutan</span>
              </div>
              
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 px-6 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-xs text-slate-600 cursor-pointer appearance-none"
              >
                <option value="all">Semua Status Verifikasi</option>
                <option value="verified">Terverifikasi (Verified)</option>
                <option value="pending">Menunggu (Pending)</option>
              </select>

              <select 
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="flex-[1.5] px-6 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-xs text-slate-600 cursor-pointer appearance-none"
              >
                <option value="all">Semua Program Kampanye</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>

              <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-100 transition-all shadow-sm"
                  >
                    <FileDown size={14} /> PDF
                  </button>
                  <button 
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-100 transition-all shadow-sm"
                  >
                    <FileSpreadsheet size={14} /> EXCEL
                  </button>
              </div>
           </div>
         )}
      </div>

      {activeTab === 'campaigns' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          {!isLoading ? (
            campaigns.length > 0 ? (
              campaigns.map((c) => (
                <div key={c.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-500 relative">
                   <div className="h-52 relative overflow-hidden bg-slate-100">
                      <Image 
                        src={c.image_url || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1470&auto=format&fit=crop'} 
                        alt={c.title} 
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                      
                      <div className={`absolute top-6 left-6 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md border ${c.is_active ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-slate-500/90 text-white border-slate-400'}`}>
                        {c.is_active ? 'Kampanye Aktif' : 'Telah Berakhir'}
                      </div>
                      
                      <button 
                        onClick={() => { setSelectedId(c.id); setIsDeleteOpen(true); }}
                        className="absolute top-6 right-6 p-2.5 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-xl hover:bg-rose-500 hover:border-rose-500 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                      >
                         <Trash2 size={18} />
                      </button>

                      <div className="absolute bottom-6 left-6 right-6">
                         <h3 className="font-black text-white text-lg tracking-tight leading-tight uppercase line-clamp-1">{c.title}</h3>
                      </div>
                   </div>
                   
                   <div className="p-8 flex-1 flex flex-col bg-white">
                      <p className="text-slate-400 text-xs font-medium mb-8 line-clamp-2 italic">&quot;{c.description || 'Program pengalangan dana untuk keberlanjutan dakwah.'}&quot;</p>
                      
                      <div className="mt-auto space-y-6">
                         <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                               <span className="text-emerald-700">TERKUMPUL: Rp {c.collected_amount.toLocaleString('id-ID')}</span>
                               <span className="text-slate-400 font-mono">{Math.round((c.collected_amount / (c.target_amount || 1)) * 100)}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-slate-100 ring-4 ring-emerald-500/5">
                               <div 
                                 className="h-full bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/30 transition-all duration-1000" 
                                 style={{ width: `${Math.min((c.collected_amount / (c.target_amount || 1)) * 100, 100)}%` }}
                               ></div>
                            </div>
                            <div className="mt-4 text-[9px] font-black text-slate-300 uppercase tracking-widest text-right">
                               Target: Rp {c.target_amount?.toLocaleString('id-ID') || '0'}
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-40 text-center bg-white rounded-xl border-2 border-dashed border-slate-100">
                <div className="w-24 h-24 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-8 text-slate-200 shadow-inner">
                  <Heart size={48} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight font-outfit">Sinergi Pemberdayaan</h3>
                <p className="text-slate-400 font-medium max-w-sm mx-auto">Mulailah inisiasi program kemanusiaan atau pembangunan sarana santri.</p>
              </div>
            )
          ) : (
            <div className="col-span-full py-32 text-center uppercase font-black text-slate-300 tracking-[0.3em] animate-pulse">
              Mengkalibrasi Basis Data Filantropi...
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] mb-10">
           {isLoading && donations.length === 0 ? (
             <div className="py-20 text-center uppercase font-black text-slate-300 tracking-[0.3em] animate-pulse">
                Menyusun Log Donatur...
             </div>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-50/50 border-b border-slate-100">
                     <th className="pl-10 pr-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Profil Donatur</th>
                     <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Destinasi Dana</th>
                     <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nominal</th>
                     <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                     <th className="pr-10 pl-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Manajemen</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 text-sm">
                   {donations.length > 0 ? donations.map((d) => (
                     <tr key={d.id} className="hover:bg-slate-50 transition-all group">
                       <td className="pl-10 pr-6 py-6">
                         <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center font-black text-emerald-600 text-base shadow-sm group-hover:scale-105 transition-transform">
                             {d.donor_name ? d.donor_name.charAt(0) : '?'}
                           </div>
                           <div>
                             <p className="font-black text-slate-900 uppercase tracking-tight">{d.donor_name}</p>
                             <div className="flex items-center gap-2 mt-1">
                                <Calendar size={12} className="text-slate-300" />
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(d.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                             </div>
                           </div>
                         </div>
                       </td>
                       <td className="px-6 py-6">
                         <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-tight shadow-inner">
                            <Heart size={12} className="text-emerald-500 fill-emerald-500" />
                            {d.campaign_title}
                         </div>
                       </td>
                       <td className="px-6 py-6">
                         <span className="font-black text-slate-900 text-base font-outfit">Rp {d.amount.toLocaleString('id-ID')}</span>
                       </td>
                       <td className="px-6 py-6">
                         {d.status === 'verified' ? (
                           <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                             <CheckCircle size={14} className="fill-emerald-600 text-white" /> TERVERIFIKASI
                           </span>
                         ) : (
                           <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100 shadow-sm animate-pulse">
                             <Clock size={14} /> MENUNGGU
                           </span>
                         )}
                       </td>
                       <td className="pr-10 pl-6 py-6 text-right">
                         {d.status !== 'verified' ? (
                           <button 
                             onClick={() => handleVerify(d.id)}
                             className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.15em] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
                           >
                             Verifikasi Dana
                           </button>
                         ) : (
                           <div className="flex justify-end gap-2 pr-2">
                              <div className="p-2 text-emerald-600 bg-emerald-50 rounded-lg"><CheckCircle size={18} /></div>
                           </div>
                         )}
                       </td>
                     </tr>
                   )) : (
                     <tr>
                       <td colSpan={5} className="py-40 text-center">
                         <div className="w-20 h-20 bg-slate-50 flex items-center justify-center rounded-xl mx-auto mb-6 text-slate-200 shadow-inner">
                           <Search size={40} />
                         </div>
                         <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Data Tidak Ditemukan</h3>
                         <div className="text-slate-400 font-medium max-w-xs mx-auto text-sm">Sesuaikan kata kunci atau filter untuk mendapati data yang dicari.</div>
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
           )}
        </div>
      )}

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Lumpuhkan Kampanye?"
        message="Data penggalangan dana ini akan dihapus dari publik. Kontribusi dana yang sudah masuk tetap tersimpan dalam laporan audit."
        confirmText="YA, LUMPUHKAN"
      />
    </>
  );
}
