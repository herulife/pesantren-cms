'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getFaqs, deleteFaq, updateFaqOrder, updateFaq, addFaq, Faq } from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { Plus, Trash2, ArrowUp, ArrowDown, HelpCircle, Search, X, Save, Pencil, Eye, EyeOff } from 'lucide-react';

export default function FaqsAdminPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form states
  const [form, setForm] = useState<Omit<Faq, 'id' | 'order_num'>>({
    question: '',
    answer: '',
    is_active: true
  });

  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fetchFaqs = useCallback(async (search = searchQuery) => {
    setIsLoading(true);
    const data = await getFaqs(search);
    setFaqs(data);
    setIsLoading(false);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFaqs(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchFaqs]);

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsDeleting(true);
    try {
      const res = await deleteFaq(selectedId);
      if (res.success) {
        showToast('success', 'FAQ berhasil dihapus.');
        fetchFaqs();
        setIsDeleteOpen(false);
      } else {
        showToast('error', 'Gagal menghapus FAQ.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
      showToast('error', message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOrder = async (id: number, direction: 'up' | 'down') => {
    try {
      await updateFaqOrder(id, direction);
      fetchFaqs();
    } catch {
      showToast('error', 'Gagal merubah urutan FAQ.');
    }
  };

  const handleOpenForm = (faq?: Faq) => {
    if (faq) {
        setIsEditing(true);
        setSelectedId(faq.id);
        setForm({
            question: faq.question,
            answer: faq.answer,
            is_active: faq.is_active
        });
    } else {
        setIsEditing(false);
        setSelectedId(null);
        setForm({
            question: '',
            answer: '',
            is_active: true
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
    if (!form.question || !form.answer) {
      showToast('error', 'Pertanyaan dan jawaban wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && selectedId) {
        const res = await updateFaq(selectedId, form);
        if (res.success) {
          showToast('success', 'FAQ berhasil diperbarui.');
          setIsFormOpen(false);
          fetchFaqs();
        } else {
          showToast('error', 'Gagal memperbarui FAQ.');
        }
      } else {
        const res = await addFaq(form);
        if (res.success) {
          showToast('success', 'FAQ baru berhasil ditambahkan.');
          setIsFormOpen(false);
          fetchFaqs();
        } else {
          showToast('error', 'Gagal menambahkan FAQ.');
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      showToast('error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight">Pusat Bantuan (FAQ)</h1>
          <p className="text-slate-500 text-sm font-medium">Kelola daftar pertanyaan yang sering diajukan untuk memudahkan calon wali santri.</p>
        </div>
        <button 
          onClick={() => router.push('/admin/faqs/form')}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
        >
          <Plus size={20} />
          <span>Tambah Jawaban</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-5 mb-10">
         <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Cari kata kunci pertanyaan atau jawaban..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm"
            />
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mb-10">
        {isLoading && !faqs.length ? (
           <div className="p-20 text-center uppercase font-black text-slate-300 tracking-[0.3em] animate-pulse">
             Sinkronisasi Basis Data...
           </div>
        ) : faqs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {faqs.map((faq, index) => (
              <div key={faq.id} className="p-8 flex items-start gap-8 hover:bg-slate-50/50 transition-colors group">
                <div className="flex flex-col gap-2 items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity translate-y-1">
                  <button 
                    disabled={index === 0}
                    onClick={() => handleOrder(faq.id, 'up')}
                    className="p-1.5 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-emerald-600 hover:border-emerald-100 shadow-sm disabled:opacity-30 disabled:hover:text-slate-400"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                    {faq.order_num}
                  </div>
                  <button 
                    disabled={index === faqs.length - 1}
                    onClick={() => handleOrder(faq.id, 'down')}
                    className="p-1.5 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-emerald-600 hover:border-emerald-100 shadow-sm disabled:opacity-30 disabled:hover:text-slate-400"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight leading-relaxed">{faq.question}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                       <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full border ${faq.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                         {faq.is_active ? 'Publik' : 'Draft'}
                       </span>
                       <button 
                         onClick={() => router.push(`/admin/faqs/form?id=${faq.id}`)}
                         className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                       >
                         <Pencil size={18} />
                       </button>
                       <button 
                         onClick={() => { setSelectedId(faq.id); setIsDeleteOpen(true); }}
                         className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                       >
                         <Trash2 size={18} />
                       </button>
                    </div>
                  </div>
                  <div className="mt-4 text-slate-500 text-sm leading-relaxed font-medium bg-slate-50/50 p-6 rounded-2xl border border-slate-100/50" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-32 text-center">
             <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
               <HelpCircle className="text-slate-200" size={48} />
             </div>
             <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight font-outfit">Basis Data Kosong</h3>
             <p className="text-slate-400 max-w-sm mx-auto font-medium">Pertanyaan dan jawaban untuk calon santri akan tampil di sini.</p>
          </div>
        )}
      </div>

      {/* Form Modal (Add/Edit) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 max-h-[90vh]">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <HelpCircle size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-outfit">
                    {isEditing ? 'Edit Jawaban' : 'Tambah FAQ'}
                  </h3>
                </div>
                <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X /></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-8">
               <form onSubmit={handleFormSubmit} className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Pertanyaan</label>
                    <input 
                      type="text"
                      required
                      placeholder="Apa saja syarat pendaftaran santri baru?"
                      value={form.question}
                      onChange={(e) => setForm({ ...form, question: e.target.value })}
                      className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Jawaban Lengkap</label>
                    <textarea 
                      required
                      rows={6}
                      placeholder="Jelaskan secara detail di sini..."
                      value={form.answer}
                      onChange={(e) => setForm({ ...form, answer: e.target.value })}
                      className="w-full px-8 py-6 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700 leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-xl ${form.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                            {form.is_active ? <Eye size={18}/> : <EyeOff size={18}/>}
                         </div>
                         <div>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Status Publikasi</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{form.is_active ? 'Terlihat oleh publik' : 'Hanya draf admin'}</p>
                         </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setForm({ ...form, is_active: !form.is_active })}
                        className={`w-14 h-8 rounded-full transition-all relative flex items-center px-1 ${form.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                         <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-all transform ${form.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                  </div>

                  <div className="flex gap-4 pt-4 shrink-0">
                    <button 
                      type="button" 
                      onClick={() => setIsFormOpen(false)}
                      className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
                    >
                      Batal
                    </button>
                    <button 
                      disabled={isSubmitting}
                      type="submit"
                      className="flex-[2] py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-slate-200 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
                    >
                       {isSubmitting ? 'Sedang Memproses...' : (
                          <>
                            <Save size={18} />
                            Simpan FAQ
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
        title="Hapus FAQ?"
        message="Pertanyaan ini akan dihapus permanen dari basis data bantuan santri."
        confirmText="Hapus Permanen"
      />
    </>
  );
}
