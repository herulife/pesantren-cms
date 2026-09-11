'use client';

import Image from 'next/image';
import React, { useState, useEffect, useCallback } from 'react';
import { getCampaigns, getDonations, deleteCampaign, verifyDonation, Campaign, Donation, getDonors, createDonor, updateDonor, deleteDonor, Donor, createDonation, updateDonation, deleteDonation } from '@/lib/api';
import { exportToPDF, exportToExcel } from '@/lib/export';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { Heart, Plus, TrendingUp, Users, DollarSign, ArrowUpRight, Trash2, Pencil, Search, CheckCircle, Clock, FileDown, FileSpreadsheet, Filter, Calendar, X } from 'lucide-react';
import Link from 'next/link';

export default function DonationsAdminPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI States
  const [activeTab, setActiveTab] = useState<'campaigns' | 'transactions' | 'donors'>('campaigns');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<'campaign' | 'donor' | 'donation'>('campaign');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState<number | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Donatur States
  const [donors, setDonors] = useState<Donor[]>([]);
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);
  const [donorForm, setDonorForm] = useState({ name: '', address: '', phone: '', notes: '' });

  // Transaction Form States
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Donation | null>(null);
  const [txForm, setTxForm] = useState({ campaign_id: '', donor_id: '', donor_name: '', donor_phone: '', amount: '', type: '', method: 'transfer', notes: '' });

  const DONATION_TYPES = ['Infak', 'Sedekah', 'Wakaf', 'Zakat'];

  const { showToast } = useToast();

  const fetchCampaigns = useCallback(async (search = searchQuery) => {
    setIsLoading(true);
    const data = await getCampaigns({ search });
    setCampaigns(data);
    setIsLoading(false);
  }, [searchQuery]);

  const fetchDonations = useCallback(async (search = searchQuery, status = filterStatus, campaignID = campaignFilter, type = typeFilter) => {
    setIsLoading(true);
    const data = await getDonations({
        search,
        status: status === 'all' ? '' : status,
        campaignID: campaignID === 'all' ? undefined : campaignID,
        type: type === 'all' ? '' : type
    });
    setDonations(data);
    setIsLoading(false);
  }, [searchQuery, filterStatus, campaignFilter, typeFilter]);

  const fetchDonors = useCallback(async (search = searchQuery) => {
    setIsLoading(true);
    const data = await getDonors(search);
    setDonors(data);
    setIsLoading(false);
  }, [searchQuery]);

  const fetchData = useCallback(() => {
    if (activeTab === 'campaigns') {
        fetchCampaigns(searchQuery);
    } else if (activeTab === 'donors') {
        fetchDonors(searchQuery);
    } else {
        fetchDonations(searchQuery, filterStatus, campaignFilter, typeFilter);
    }
  }, [activeTab, searchQuery, filterStatus, campaignFilter, typeFilter, fetchCampaigns, fetchDonations, fetchDonors]);

  // Handle Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
        fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, filterStatus, campaignFilter, typeFilter, fetchData]);

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsDeleting(true);
    try {
      const res = deleteTarget === 'donor'
        ? await deleteDonor(selectedId)
        : deleteTarget === 'donation'
          ? await deleteDonation(selectedId)
          : await deleteCampaign(selectedId);
      if (res.success) {
        showToast('success', deleteTarget === 'donor' ? 'Donatur berhasil dihapus.' : deleteTarget === 'donation' ? 'Transaksi berhasil dihapus.' : 'Kampanye berhasil dihapus.');
        fetchData();
        setIsDeleteOpen(false);
      } else {
        showToast('error', res.message || 'Gagal menghapus data.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
      showToast('error', message);
    } finally {
      setIsDeleting(false);
    }
  };

  const openDonorModal = (d?: Donor) => {
    if (d) {
      setEditingDonor(d);
      setDonorForm({ name: d.name, address: d.address || '', phone: d.phone || '', notes: d.notes || '' });
    } else {
      setEditingDonor(null);
      setDonorForm({ name: '', address: '', phone: '', notes: '' });
    }
    setIsDonorModalOpen(true);
  };

  const handleSaveDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (donorForm.name.trim().length < 3) {
      showToast('error', 'Nama donatur minimal 3 karakter.');
      return;
    }
    try {
      const res = editingDonor
        ? await updateDonor(editingDonor.id, donorForm)
        : await createDonor(donorForm);
      if (res.success) {
        showToast('success', editingDonor ? 'Donatur berhasil diperbarui.' : 'Donatur berhasil ditambahkan.');
        setIsDonorModalOpen(false);
        fetchData();
      } else {
        showToast('error', res.message || 'Gagal menyimpan donatur.');
      }
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Terjadi kesalahan sistem.');
    }
  };

  const openTxModal = async (d?: Donation) => {
    if (donors.length === 0) {
      const list = await getDonors('');
      setDonors(list);
    }
    if (campaigns.length === 0) {
      const list = await getCampaigns({});
      setCampaigns(list);
    }
    if (d) {
      setEditingTx(d);
      setTxForm({
        campaign_id: String(d.campaign_id),
        donor_id: d.donor_id ? String(d.donor_id) : '',
        donor_name: d.donor_name,
        donor_phone: d.donor_phone || '',
        amount: String(d.amount),
        type: d.type || '',
        method: d.payment_method || 'transfer',
        notes: d.notes || '',
      });
    } else {
      setEditingTx(null);
      setTxForm({ campaign_id: '', donor_id: '', donor_name: '', donor_phone: '', amount: '', type: '', method: 'transfer', notes: '' });
    }
    setIsTxModalOpen(true);
  };

  const handleSaveTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(txForm.amount);
    if (!txForm.campaign_id || (!txForm.donor_id && !txForm.donor_name.trim()) || !amount || amount <= 0) {
      showToast('error', 'Pilih kampanye, donatur, dan isi nominal yang valid.');
      return;
    }
    const payload = {
      campaign_id: parseInt(txForm.campaign_id),
      donor_id: txForm.donor_id ? parseInt(txForm.donor_id) : undefined,
      donor_name: txForm.donor_name.trim(),
      donor_phone: txForm.donor_phone.trim(),
      amount,
      type: txForm.type,
      method: txForm.method,
      notes: txForm.notes,
    };
    try {
      const res = editingTx ? await updateDonation(editingTx.id, payload) : await createDonation(payload);
      if (res.success) {
        showToast('success', editingTx ? 'Transaksi berhasil diperbarui.' : 'Transaksi berhasil dicatat.');
        setIsTxModalOpen(false);
        fetchData();
      } else {
        showToast('error', res.message || 'Gagal menyimpan transaksi.');
      }
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Terjadi kesalahan sistem.');
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
    const columns = ['Donatur', 'Kampanye', 'Jenis', 'Jumlah', 'Status', 'Tanggal'];
    const rows = donations.map(d => [
      d.donor_name,
      d.campaign_title,
      d.type || '-',
      `Rp ${d.amount.toLocaleString('id-ID')}`,
      d.status,
      new Date(d.created_at).toLocaleDateString('id-ID')
    ]);
    exportToPDF('Laporan Transaksi Donasi', columns, rows, 'laporan_donasi');
  };

  const handleExportExcel = () => {
    const columns = ['Donatur', 'Kampanye', 'Jenis', 'Jumlah', 'Status', 'Tanggal'];
    const rows = donations.map(d => [
      d.donor_name,
      d.campaign_title,
      d.type || '-',
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
        <div className="flex flex-wrap gap-3">
          {activeTab === 'transactions' && (
            <button
              onClick={() => openTxModal()}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
            >
              <Plus size={20} />
              <span>Catat Transaksi</span>
            </button>
          )}
          {activeTab === 'donors' && (
            <button
              onClick={() => openDonorModal()}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-sky-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-sky-700 transition-all shadow-xl shadow-sky-600/20 active:scale-95"
            >
              <Plus size={20} />
              <span>Tambah Donatur</span>
            </button>
          )}
          <Link
            href="/admin/donations/add"
            className="flex items-center justify-center gap-3 px-8 py-4 bg-sky-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-sky-700 transition-all shadow-xl shadow-sky-600/20 active:scale-95"
          >
            <Plus size={20} />
            <span>Buat Kampanye</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-sky-900/10 transition-all duration-500">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 border border-sky-100 shadow-inner">
               <DollarSign size={28} />
            </div>
            <span className="text-sky-600 text-[9px] font-black bg-sky-50 px-3 py-1.5 rounded-full flex items-center gap-1 border border-sky-100 uppercase tracking-widest">
               <ArrowUpRight size={14} /> Berkelanjutan
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 mb-1 font-outfit line-clamp-1">Rp {totalCollected.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Agregat Dana Sosial</div>
        </div>

        <div className="bg-sky-950 p-8 rounded-xl shadow-2xl shadow-sky-950/20 relative overflow-hidden group transition-all duration-500 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-900/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-amber-400/10 transition-colors duration-700"></div>
          <div className="w-14 h-14 bg-sky-900 rounded-xl flex items-center justify-center text-amber-400 mb-6 border border-sky-800 shadow-lg">
             <TrendingUp size={28} />
          </div>
          <div className="text-3xl font-black text-white mb-1 font-outfit">{activeCampaignsCount}</div>
          <div className="text-[10px] text-sky-400 font-black uppercase tracking-[0.2em]">Kampanye Berjalan</div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm group hover:shadow-2xl hover:shadow-sky-900/10 transition-all duration-500">
          <div className="w-14 h-14 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 mb-6 border border-sky-100 shadow-inner">
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
                  className={`flex-1 lg:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'campaigns' ? 'bg-white text-sky-600 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Daftar Kampanye
                </button>
                <button
                  onClick={() => { setActiveTab('transactions'); setSearchQuery(''); }}
                  className={`flex-1 lg:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'transactions' ? 'bg-white text-sky-600 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Log Transaksi
                </button>
                <button
                  onClick={() => { setActiveTab('donors'); setSearchQuery(''); }}
                  className={`flex-1 lg:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'donors' ? 'bg-white text-sky-600 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Donatur
                </button>
             </div>

            <div className="flex-1 w-full relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder={activeTab === 'campaigns' ? "Cari judul kampanye atau deskripsi..." : activeTab === 'donors' ? "Cari nama, alamat, atau HP donatur..." : "Cari nama donatur atau ID transaksi..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-bold text-sm shadow-inner"
                />
            </div>
         </div>

         {activeTab === 'transactions' && (
           <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-slate-100 animate-in fade-in duration-500">
              <div className="flex items-center gap-3 shrink-0">
                 <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600">
                    <Filter size={18} />
                 </div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter Lanjutan</span>
              </div>
              
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 px-6 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold text-xs text-slate-600 cursor-pointer appearance-none"
              >
                <option value="all">Semua Status Verifikasi</option>
                <option value="verified">Terverifikasi (Verified)</option>
                <option value="pending">Menunggu (Pending)</option>
              </select>

              <select
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="flex-[1.5] px-6 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold text-xs text-slate-600 cursor-pointer appearance-none"
              >
                <option value="all">Semua Program Kampanye</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="flex-1 px-6 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold text-xs text-slate-600 cursor-pointer appearance-none"
              >
                <option value="all">Semua Jenis Donasi</option>
                {DONATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
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
                    className="flex items-center gap-2 px-6 py-3 bg-sky-50 text-sky-600 border border-sky-100 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-sky-100 transition-all shadow-sm"
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
                <div key={c.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-2xl hover:shadow-sky-900/10 transition-all duration-500 relative">
                   <div className="h-52 relative overflow-hidden bg-slate-100">
                      <Image 
                        src={c.image_url || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1470&auto=format&fit=crop'} 
                        alt={c.title} 
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-sky-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                      
                      <div className={`absolute top-6 left-6 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md border ${c.is_active ? 'bg-sky-500/90 text-white border-sky-400' : 'bg-slate-500/90 text-white border-slate-400'}`}>
                        {c.is_active ? 'Kampanye Aktif' : 'Telah Berakhir'}
                      </div>
                      
                      <div className="absolute top-6 right-6 flex gap-2">
                        <Link
                          href={`/admin/donations/add?id=${c.id}`}
                          aria-label="Edit kampanye"
                          className="p-2.5 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-xl hover:bg-sky-500 hover:border-sky-500 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                        >
                          <Pencil size={18} />
                        </Link>
                        <button
                          onClick={() => { setSelectedId(c.id); setDeleteTarget('campaign'); setIsDeleteOpen(true); }}
                          aria-label="Hapus kampanye"
                          className="p-2.5 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-xl hover:bg-rose-500 hover:border-rose-500 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                        >
                           <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="absolute bottom-6 left-6 right-6">
                         <h3 className="font-black text-white text-lg tracking-tight leading-tight uppercase line-clamp-1">{c.title}</h3>
                      </div>
                   </div>
                   
                   <div className="p-8 flex-1 flex flex-col bg-white">
                      <p className="text-slate-400 text-xs font-medium mb-8 line-clamp-2 italic">&quot;{c.description || 'Program pengalangan dana untuk keberlanjutan dakwah.'}&quot;</p>
                      
                      <div className="mt-auto space-y-6">
                         <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                               <span className="text-sky-700">TERKUMPUL: Rp {c.collected_amount.toLocaleString('id-ID')}</span>
                               <span className="text-slate-400 font-mono">{Math.round((c.collected_amount / (c.target_amount || 1)) * 100)}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-slate-100 ring-4 ring-sky-500/5">
                               <div 
                                 className="h-full bg-sky-500 rounded-full shadow-lg shadow-sky-500/30 transition-all duration-1000" 
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
      ) : activeTab === 'donors' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px] mb-10">
          {isLoading && donors.length === 0 ? (
            <div className="py-20 text-center uppercase font-black text-slate-300 tracking-[0.3em] animate-pulse">
              Memuat Data Donatur...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="pl-10 pr-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nama Donatur</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Alamat</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No. HP</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Catatan</th>
                    <th className="pr-10 pl-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {donors.length > 0 ? donors.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition-all group">
                      <td className="pl-10 pr-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center font-black text-sky-600 text-base shadow-sm group-hover:scale-105 transition-transform">
                            {d.name ? d.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <p className="font-black text-slate-900 uppercase tracking-tight">{d.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-slate-600 font-medium">{d.address || '-'}</td>
                      <td className="px-6 py-6 text-slate-600 font-medium font-mono">{d.phone || '-'}</td>
                      <td className="px-6 py-6 text-slate-600 font-medium">{d.notes || '-'}</td>
                      <td className="pr-10 pl-6 py-6 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => openDonorModal(d)}
                            aria-label="Ubah donatur"
                            className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => { setSelectedId(d.id); setDeleteTarget('donor'); setIsDeleteOpen(true); }}
                            aria-label="Hapus donatur"
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        <p className="text-slate-400 font-medium">Belum ada data donatur. Klik “Tambah Donatur”.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                      <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Jenis</th>
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
                           <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center font-black text-sky-600 text-base shadow-sm group-hover:scale-105 transition-transform">
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
                            <Heart size={12} className="text-sky-500 fill-sky-500" />
                            {d.campaign_title}
                         </div>
                       </td>
                        <td className="px-6 py-6">
                          <span className="inline-flex items-center px-4 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-black text-emerald-700 uppercase tracking-tight">
                            {d.type || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-6">
                          <span className="font-black text-slate-900 text-base font-outfit">Rp {d.amount.toLocaleString('id-ID')}</span>
                        </td>
                       <td className="px-6 py-6">
                         {d.status === 'verified' ? (
                           <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-sky-50 text-sky-600 border border-sky-100 shadow-sm">
                             <CheckCircle size={14} className="fill-sky-600 text-white" /> TERVERIFIKASI
                           </span>
                         ) : (
                           <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100 shadow-sm animate-pulse">
                             <Clock size={14} /> MENUNGGU
                           </span>
                         )}
                       </td>
                        <td className="pr-10 pl-6 py-6 text-right">
                          <div className="flex justify-end items-center gap-2">
                            {d.status !== 'verified' ? (
                              <>
                                <button
                                  onClick={() => openTxModal(d)}
                                  aria-label="Ubah transaksi"
                                  className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all"
                                >
                                  <Pencil size={18} />
                                </button>
                                <button
                                  onClick={() => { setSelectedId(d.id); setDeleteTarget('donation'); setIsDeleteOpen(true); }}
                                  aria-label="Hapus transaksi"
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                  <Trash2 size={18} />
                                </button>
                                <button
                                  onClick={() => handleVerify(d.id)}
                                  className="px-6 py-2.5 bg-sky-600 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.15em] hover:bg-sky-700 transition-all shadow-lg shadow-sky-200 active:scale-95"
                                >
                                  Verifikasi Dana
                                </button>
                              </>
                            ) : (
                              <div className="p-2 text-sky-600 bg-sky-50 rounded-lg"><CheckCircle size={18} /></div>
                            )}
                          </div>
                        </td>
                     </tr>
                   )) : (
                      <tr>
                        <td colSpan={6} className="py-40 text-center">
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
        title={deleteTarget === 'donor' ? 'Hapus Donatur?' : deleteTarget === 'donation' ? 'Hapus Transaksi?' : 'Lumpuhkan Kampanye?'}
        message={deleteTarget === 'donor'
          ? 'Data donatur ini akan dihapus. Riwayat transaksinya tetap tersimpan.'
          : deleteTarget === 'donation'
            ? 'Transaksi yang belum terverifikasi ini akan dihapus permanen.'
            : 'Data penggalangan dana ini akan dihapus dari publik. Kontribusi dana yang sudah masuk tetap tersimpan dalam laporan audit.'}
        confirmText={deleteTarget === 'campaign' ? 'YA, LUMPUHKAN' : 'YA, HAPUS'}
      />

      {isDonorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:px-0">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsDonorModalOpen(false)}></div>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl relative shrink-0 overflow-hidden">
            <form onSubmit={handleSaveDonor}>
              <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-900 uppercase font-outfit tracking-tight">{editingDonor ? 'Ubah Donatur' : 'Tambah Donatur'}</h3>
                <button type="button" onClick={() => setIsDonorModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
              </div>
              <div className="p-10 space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nama Donatur *</label>
                  <input
                    value={donorForm.name}
                    onChange={(e) => setDonorForm({ ...donorForm, name: e.target.value })}
                    placeholder="Contoh: Hamba Allah"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Alamat</label>
                    <input
                      value={donorForm.address}
                      onChange={(e) => setDonorForm({ ...donorForm, address: e.target.value })}
                      placeholder="Contoh: Parung, Bogor"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">No. HP</label>
                    <input
                      value={donorForm.phone}
                      onChange={(e) => setDonorForm({ ...donorForm, phone: e.target.value })}
                      placeholder="Contoh: 0812..."
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Catatan</label>
                  <textarea
                    rows={2}
                    value={donorForm.notes}
                    onChange={(e) => setDonorForm({ ...donorForm, notes: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold"
                  ></textarea>
                </div>
              </div>
              <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsDonorModalOpen(false)}
                  className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-sky-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-sky-700 transition-all shadow-xl shadow-sky-600/20"
                >
                  Simpan Donatur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:px-0">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsTxModalOpen(false)}></div>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl relative shrink-0 overflow-hidden">
            <form onSubmit={handleSaveTx}>
              <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-900 uppercase font-outfit tracking-tight">{editingTx ? 'Ubah Transaksi' : 'Catat Transaksi'}</h3>
                <button type="button" onClick={() => setIsTxModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
              </div>
              <div className="p-10 space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Program Kampanye *</label>
                  <select
                    value={txForm.campaign_id}
                    onChange={(e) => setTxForm({ ...txForm, campaign_id: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold text-slate-800"
                  >
                    <option value="">-- Pilih Kampanye --</option>
                    {campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Donatur (Master)</label>
                  <select
                    value={txForm.donor_id}
                    onChange={(e) => {
                      const id = e.target.value;
                      const d = donors.find((x) => String(x.id) === id);
                      setTxForm({
                        ...txForm,
                        donor_id: id,
                        donor_name: d ? d.name : txForm.donor_name,
                        donor_phone: d ? d.phone : txForm.donor_phone,
                      });
                    }}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold text-slate-800"
                  >
                    <option value="">-- Donatur baru (isi manual) --</option>
                    {donors.map((d) => <option key={d.id} value={d.id}>{d.name}{d.phone ? ` (${d.phone})` : ''}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nama Donatur *</label>
                    <input
                      value={txForm.donor_name}
                      onChange={(e) => setTxForm({ ...txForm, donor_name: e.target.value })}
                      placeholder="Contoh: Hamba Allah"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">No. HP</label>
                    <input
                      value={txForm.donor_phone}
                      onChange={(e) => setTxForm({ ...txForm, donor_phone: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nominal (Rp) *</label>
                    <input
                      type="number"
                      min="1"
                      value={txForm.amount}
                      onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                      placeholder="Contoh: 500000"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Jenis Donasi</label>
                    <select
                      value={txForm.type}
                      onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold text-slate-800"
                    >
                      <option value="">-- Pilih Jenis --</option>
                      {DONATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Metode</label>
                    <select
                      value={txForm.method}
                      onChange={(e) => setTxForm({ ...txForm, method: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold text-slate-800"
                    >
                      <option value="transfer">Transfer Bank</option>
                      <option value="manual">Tunai / Manual</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Catatan</label>
                    <input
                      value={txForm.notes}
                      onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                      placeholder="Keterangan tambahan"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all font-bold"
                    />
                  </div>
                </div>
              </div>
              <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-sky-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-sky-700 transition-all shadow-xl shadow-sky-600/20"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
