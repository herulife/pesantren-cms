'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getAgendas, deleteAgenda, updateAgenda, addAgenda, Agenda } from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { Plus, Trash2, Calendar, MapPin, Clock, Search, X, Save, Pencil, Filter, Info } from 'lucide-react';

const CATEGORIES = ['Akademik', 'PSB', 'Libur', 'Event', 'Umum'];

export default function AgendasAdminPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form states
  const [form, setForm] = useState<Omit<Agenda, 'id'>>({
    title: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    time_info: '',
    location: '',
    description: '',
    category: 'Umum'
  });

  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fetchAgendas = useCallback(async (search = searchQuery) => {
    setIsLoading(true);
    const data = await getAgendas(search);
    setAgendas(data);
    setIsLoading(false);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAgendas(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchAgendas]);

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsDeleting(true);
    try {
      const res = await deleteAgenda(selectedId);
      if (res.success) {
        showToast('success', 'Agenda berhasil dihapus.');
        fetchAgendas();
        setIsDeleteOpen(false);
      } else {
        showToast('error', 'Gagal menghapus agenda.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
      showToast('error', message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenForm = (agenda?: Agenda) => {
    if (agenda) {
        setIsEditing(true);
        setSelectedId(agenda.id);
        setForm({
            title: agenda.title,
            start_date: agenda.start_date.split('T')[0],
            end_date: agenda.end_date ? agenda.end_date.split('T')[0] : '',
            time_info: agenda.time_info || '',
            location: agenda.location || '',
            description: agenda.description || '',
            category: agenda.category || 'Umum'
        });
    } else {
        setIsEditing(false);
        setSelectedId(null);
        setForm({
            title: '',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            time_info: '',
            location: '',
            description: '',
            category: 'Umum'
        });
    }
    setIsFormOpen(true);
  };

  useEffect(() => {
    if (searchParams.get('mode') === 'create') {
      handleOpenForm();
      router.replace(pathname);
    }
  }, [searchParams, router, pathname]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.start_date) {
      showToast('error', 'Judul dan tanggal mulai wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        end_date: form.end_date || null,
        time_info: form.time_info || null,
        location: form.location || null,
        description: form.description || null
      };

      if (isEditing && selectedId) {
        const res = await updateAgenda(selectedId, payload as any);
        if (res.success) {
          showToast('success', 'Agenda berhasil diperbarui.');
          setIsFormOpen(false);
          fetchAgendas();
        } else {
          showToast('error', 'Gagal memperbarui agenda.');
        }
      } else {
        const res = await addAgenda(payload as any);
        if (res.success) {
          showToast('success', 'Agenda baru berhasil ditambahkan.');
          setIsFormOpen(false);
          fetchAgendas();
        } else {
          showToast('error', 'Gagal menambahkan agenda.');
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      showToast('error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'psb': return 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/10';
      case 'akademik': return 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/10';
      case 'libur': return 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-500/10';
      case 'event': return 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-500/10';
      default: return 'bg-slate-50 text-slate-600 border-slate-100 shadow-slate-500/10';
    }
  };

  const formatTanggal = (startDate: string, endDate: string | null) => {
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      const start = new Date(startDate).toLocaleDateString('id-ID', options);
      if (endDate && endDate !== startDate) {
          const end = new Date(endDate).toLocaleDateString('id-ID', options);
          return `${start} - ${end}`;
      }
      return start;
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight">Agenda Kedatangan</h1>
          <p className="text-slate-500 text-sm font-medium">Atur kalender kegiatan, masa pendaftaran santri, dan hari libur pondok.</p>
        </div>
        <button 
          onClick={() => router.push('/admin/agendas/form')}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-lg font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95"
        >
          <Plus size={20} />
          <span>Buat Jadwal</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-5 mb-10">
         <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Cari judul kegiatan atau lokasi..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm"
            />
         </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-10 mb-10">
        {isLoading && !agendas.length ? (
           <div className="py-20 text-center uppercase font-black text-slate-300 tracking-[0.3em] animate-pulse">
             Sinkronisasi Kalender...
           </div>
        ) : agendas.length > 0 ? (
          <div className="relative border-l-4 border-slate-100 ml-6 space-y-12 py-4">
            {agendas.map((agenda) => (
              <div key={agenda.id} className="relative pl-12 group">
                <div className="absolute w-6 h-6 rounded-full bg-white border-4 border-slate-100 -left-[14px] top-2 group-hover:bg-emerald-600 group-hover:border-emerald-100 transition-all duration-500 shadow-sm z-10"></div>
                
                <div className="bg-white border border-slate-200 rounded-xl p-8 hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-500 group-hover:border-emerald-100 relative overflow-hidden group/card shadow-sm">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/30 rounded-full blur-3xl transform -translate-y-1/2 translate-x-1/2 group-hover/card:bg-emerald-500/5 transition-colors duration-700"></div>

                   <div className="flex justify-between items-start gap-6 relative z-10 mb-6">
                     <h3 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight">{agenda.title}</h3>
                     <div className="flex items-center gap-2 shrink-0">
                         <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] border shadow-sm ${getCategoryColor(agenda.category)}`}>
                          {agenda.category}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity translate-x-4 group-hover/card:translate-x-0 transition-transform">
                      <button 
                        onClick={() => router.push(`/admin/agendas/form?id=${agenda.id}`)}
                            className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-emerald-600 rounded-lg shadow-sm transition-all"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={() => { setSelectedId(agenda.id); setIsDeleteOpen(true); }}
                            className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-rose-500 rounded-lg shadow-sm transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                     </div>
                   </div>
                   
                   <div className="flex flex-wrap gap-4 mb-6">
                      <div className="flex items-center gap-3 bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-100 shadow-inner">
                         <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <Calendar size={18} />
                         </div>
                         <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{formatTanggal(agenda.start_date, agenda.end_date)}</span>
                      </div>
                      {agenda.time_info && (
                         <div className="flex items-center gap-3 bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-100 shadow-inner">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                               <Clock size={18} />
                            </div>
                            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{agenda.time_info}</span>
                         </div>
                      )}
                      {agenda.location && (
                         <div className="flex items-center gap-3 bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-100 shadow-inner">
                            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                               <MapPin size={18} />
                            </div>
                            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{agenda.location}</span>
                         </div>
                      )}
                   </div>

                   {agenda.description && (
                      <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100/50 text-slate-500 text-sm leading-relaxed font-medium italic relative">
                         <Info size={16} className="absolute top-2 right-2 text-slate-200" />
                         &quot;{agenda.description}&quot;
                      </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center">
             <div className="w-24 h-24 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-8 shadow-inner">
               <Calendar className="text-slate-200" size={48} />
             </div>
             <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight font-outfit">Kalender Kosong</h3>
             <p className="text-slate-400 max-w-sm mx-auto font-medium">Jadwal kegiatan atau kalender akademik pondok akan tampil di sini.</p>
          </div>
        )}
      </div>

      {/* Form Modal (Add/Edit) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl relative overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 max-h-[90vh]">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <Calendar size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-outfit">
                    {isEditing ? 'Edit Agenda' : 'Jadwalkan Agenda'}
                  </h3>
                </div>
                <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X /></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-8">
               <form onSubmit={handleFormSubmit} className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Judul Kegiatan</label>
                    <input 
                      type="text"
                      required
                      placeholder="Contoh: Kedatangan Santri Semester Ganjil"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-lg"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Tanggal Mulai</label>
                      <input 
                        type="date"
                        required
                        value={form.start_date}
                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Tanggal Selesai (Opsional)</label>
                      <input 
                        type="date"
                        value={form.end_date || ''}
                        onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Kategori</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-sm appearance-none"
                      >
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Status Waktu (Pukul)</label>
                      <div className="relative group">
                         <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors" size={18} />
                         <input 
                           type="text"
                           placeholder="Cth: 08:00 - Selesai"
                           value={form.time_info || ''}
                           onChange={(e) => setForm({ ...form, time_info: e.target.value })}
                           className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-sm"
                         />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Lokasi Kegiatan</label>
                    <div className="relative group">
                       <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors" size={18} />
                       <input 
                         type="text"
                         placeholder="Cth: Aula Utama Pondok"
                         value={form.location || ''}
                         onChange={(e) => setForm({ ...form, location: e.target.value })}
                         className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-sm"
                       />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Keterangan Tambahan</label>
                    <textarea 
                      rows={3}
                      placeholder="Info tambahan untuk wali santri..."
                      value={form.description || ''}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-slate-600 text-sm"
                    />
                  </div>

                  <div className="flex gap-4 pt-4 shrink-0">
                    <button 
                      type="button" 
                      onClick={() => setIsFormOpen(false)}
                      className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
                    >
                      Batal
                    </button>
                    <button 
                      disabled={isSubmitting}
                      type="submit"
                      className="flex-[2] py-5 bg-slate-900 text-white rounded-lg font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-slate-200 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
                    >
                       {isSubmitting ? 'Menyimpan...' : (
                          <>
                            <Save size={18} />
                            Simpan Agenda
                          </>
                       )}
                    </button>
                  </div>
               </form>
             </div>
          </div>
        </div>
      )}

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Batalkan Agenda?"
        message="Agenda ini akan dihapus permanen dari kalender akademik pondok."
        confirmText="Batalkan Agenda"
      />
    </>
  );
}
