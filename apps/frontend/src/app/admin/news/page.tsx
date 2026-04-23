'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { deleteNews, restoreNews, forceDeleteNews, getNewsPaginated, News, resolveDisplayImageUrl } from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { Plus, Search, Trash2, Pencil, RotateCcw, Calendar, User, Tag, Eye, EyeOff, MoreVertical, ExternalLink, ChevronLeft, ChevronRight, Newspaper, X } from 'lucide-react';
import Link from 'next/link';

export default function NewsAdminPage() {
  const [news, setNews] = useState<News[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [trashCount, setTrashCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSingleDeleting, setIsSingleDeleting] = useState(false);
  const [isSingleRestoring, setIsSingleRestoring] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkRestoring, setIsBulkRestoring] = useState(false);
  
  const [currentStatus, setCurrentStatus] = useState<'published' | 'draft' | 'trash'>('published');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkRestoreOpen, setIsBulkRestoreOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  const { showToast } = useToast();

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    const offset = (currentPage - 1) * limit;
    const res = await getNewsPaginated({
        status: currentStatus === 'published' ? 'published' : currentStatus,
        search: searchQuery,
        limit,
        offset
    });
    console.log('[NEWS DEBUG][ADMIN_LIST][FETCH]', {
      currentStatus,
      searchQuery,
      currentPage,
      offset,
      response: res,
    });
    setNews(res.data || []);
    setTotalItems(res.pagination?.total || 0);
    
    // Background trash count update
    if (currentStatus !== 'trash') {
       const trashRes = await getNewsPaginated({ status: 'trash', limit: 1, offset: 0 });
       setTrashCount(trashRes.pagination?.total || 0);
    } else {
       setTrashCount(res.pagination?.total || 0);
    }
    setIsLoading(false);
  }, [currentStatus, searchQuery, currentPage]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
        fetchNews();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [fetchNews]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(news.map(n => n.id)));
    else setSelectedIds(new Set());
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id); else newSet.delete(id);
    setSelectedIds(newSet);
  };

  const handleSingleDelete = async () => {
    if (!selectedId) return;
    const isTrash = currentStatus === 'trash';
    setIsSingleDeleting(true);
    try {
      const res = isTrash ? await forceDeleteNews(selectedId) : await deleteNews(selectedId);
      if (res.success) {
        showToast('success', isTrash ? 'Berita dihapus permanen.' : 'Berita dipindahkan ke sampah.');
        setSelectedIds(prev => { prev.delete(selectedId); return new Set(prev); });
        fetchNews();
        setIsDeleteOpen(false);
      } else {
        showToast('error', 'Gagal memproses permintaan.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memproses permintaan.';
      showToast('error', message);
    } finally {
      setIsSingleDeleting(false);
    }
  };
  
  const handleSingleRestore = async () => {
    if (!selectedId) return;
    setIsSingleRestoring(true);
    try {
      const res = await restoreNews(selectedId);
      if (res.success) {
        showToast('success', 'Berita berhasil dipulihkan.');
        setSelectedIds(prev => { prev.delete(selectedId!); return new Set(prev); });
        fetchNews();
        setIsRestoreOpen(false);
      } else {
        showToast('error', 'Gagal memulihkan berita.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memulihkan berita.';
      showToast('error', message);
    } finally {
      setIsSingleRestoring(false);
    }
  };

  const handleBulkDelete = async () => {
    const isTrash = currentStatus === 'trash';
    const ids = Array.from(selectedIds);
    let successCount = 0;
    setIsBulkDeleting(true);
    
    try {
      for (const id of ids) {
        const res = isTrash ? await forceDeleteNews(id) : await deleteNews(id);
        if (res.success) successCount++;
      }
      
      if (successCount > 0) {
        showToast('success', `${successCount} berita berhasil ${isTrash ? 'dihapus permanen' : 'dipindahkan ke sampah'}.`);
        setSelectedIds(new Set());
        fetchNews();
        setIsBulkDeleteOpen(false);
      } else {
        showToast('error', 'Gagal memproses penghapusan massal.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memproses penghapusan massal.';
      showToast('error', message);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkRestore = async () => {
    const ids = Array.from(selectedIds);
    let successCount = 0;
    setIsBulkRestoring(true);
    
    try {
      for (const id of ids) {
        const res = await restoreNews(id);
        if (res.success) successCount++;
      }
      
      if (successCount > 0) {
        showToast('success', `${successCount} berita berhasil dipulihkan.`);
        setSelectedIds(new Set());
        fetchNews();
        setIsBulkRestoreOpen(false);
      } else {
        showToast('error', 'Gagal memulihkan berita.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memulihkan berita.';
      showToast('error', message);
    } finally {
      setIsBulkRestoring(false);
    }
  };

  const getCategoryName = (item: any) => {
    if (item.category_name) {
      if (typeof item.category_name === 'object' && item.category_name.Valid) {
        return item.category_name.String;
      } else if (typeof item.category_name === 'string') {
        return item.category_name;
      }
    }
    return 'Berita';
  };

  const totalPages = Math.ceil(totalItems / limit) || 1;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight">Kelola Berita</h1>
          <p className="text-slate-500 text-sm font-medium">Publikasikan informasi terkini dan berita resmi pondok.</p>
        </div>
        <Link 
          href="/admin/news/add"
          className="flex items-center justify-center gap-3 px-6 py-3 bg-emerald-600 text-white rounded-lg font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/15"
        >
          <Plus size={20} />
          <span>Tulis Berita</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mb-10">
         {/* Advanced Tabs */}
         <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm shrink-0">
                  <button 
                    onClick={() => { setCurrentStatus('published'); setCurrentPage(1); }}
                    className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${currentStatus === 'published' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Terbit
                  </button>
                  <button 
                    onClick={() => { setCurrentStatus('trash'); setCurrentPage(1); }}
                    className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors relative ${currentStatus === 'trash' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Sampah
                    {trashCount > 0 && <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[8px] ${currentStatus === 'trash' ? 'bg-white text-rose-600' : 'bg-rose-100 text-rose-600'}`}>{trashCount}</span>}
                  </button>
             </div>

             <div className="flex-1 w-full relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Cari berita berdasarkan judul..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm shadow-inner"
                />
             </div>
         </div>

         {/* Bulk Actions Bar */}
         {selectedIds.size > 0 && (
           <div className="bg-emerald-50 px-8 py-4 border-b border-emerald-100 flex items-center justify-between animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-4">
                 <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-xs font-black">
                   {selectedIds.size}
                 </div>
                 <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">Berita Terpilih</span>
              </div>
              <div className="flex items-center gap-3">
                 {currentStatus === 'trash' && (
                    <button 
                      onClick={() => setIsBulkRestoreOpen(true)}
                      className="px-6 py-2.5 bg-white text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors border border-emerald-200"
                    >
                      Pulihkan Semua
                    </button>
                 )}
                 <button 
                   onClick={() => setIsBulkDeleteOpen(true)}
                   className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${currentStatus === 'trash' ? 'bg-rose-600 text-white shadow-sm border border-rose-700' : 'bg-white text-rose-600 border border-slate-200 hover:bg-rose-50'}`}
                 >
                   {currentStatus === 'trash' ? 'Hapus Permanen' : 'Pindahkan ke Sampah'}
                 </button>
                 <button onClick={() => setSelectedIds(new Set())} className="p-2.5 text-slate-400 hover:text-slate-600"><X size={18} /></button>
              </div>
           </div>
         )}

         {/* Modern Table Layout */}
         <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                     <th className="pl-10 pr-6 py-6 w-12">
                         <div className="flex items-center justify-center">
                            <input type="checkbox" checked={news.length > 0 && selectedIds.size === news.length} onChange={(e) => handleSelectAll(e.target.checked)} className="w-5 h-5 rounded-lg border-slate-200 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer transition-all" />
                         </div>
                     </th>
                     <th className="px-6 py-6">Informasi Berita</th>
                     <th className="px-6 py-6 hidden lg:table-cell">Kategori</th>
                     <th className="px-6 py-6 hidden md:table-cell">Status</th>
                     <th className="pr-10 pl-6 py-6 text-right">Aksi</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                      <tr>
                        <td colSpan={5} className="py-32 text-center uppercase font-black text-slate-300 tracking-[0.3em] animate-pulse">
                           Sinkronisasi Konten...
                        </td>
                      </tr>
                  ) : news.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-40 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                              <Newspaper className="text-slate-200" size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Daftar Berita Kosong</h3>
                            <p className="text-slate-400 max-w-xs mx-auto text-sm font-medium">Belum ada berita yang dipublikasikan atau berada di status ini.</p>
                        </td>
                      </tr>
                  ) : (
                      news.map((item) => {
                        const isChecked = selectedIds.has(item.id);
                        return (
                          <tr key={item.id} className={`group hover:bg-slate-50 transition-colors ${isChecked ? 'bg-emerald-50/50' : ''}`}>
                             <td className="pl-10 pr-6 py-6 text-center">
                                 <div className="flex items-center justify-center">
                                    <input type="checkbox" checked={isChecked} onChange={(e) => handleSelectOne(item.id, e.target.checked)} className="w-5 h-5 rounded-lg border-slate-200 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer transition-all" />
                                 </div>
                             </td>
                             <td className="px-6 py-6 max-w-lg">
                                <div className="flex items-center gap-6">
                                   <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-100 group-hover:shadow-lg transition-all duration-500">
                                      {item.image_url?.Valid && item.image_url.String ? (
                                        <img src={resolveDisplayImageUrl(item.image_url.String)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-200"><Newspaper size={24} /></div>
                                      )}
                                   </div>
                                   <div className="flex flex-col gap-2">
                                      <Link href={`/admin/news/edit/${item.id}`} className="font-black text-slate-900 leading-snug uppercase tracking-tight group-hover:text-emerald-600 transition-colors line-clamp-2">{item.title}</Link>
                                      <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                         <div className="flex items-center gap-1.5"><Calendar size={12} className="text-slate-300" /> {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                         <div className="flex items-center gap-1.5"><User size={12} className="text-slate-300" /> Admin Redaksi</div>
                                      </div>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-6 hidden lg:table-cell">
                                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-widest shadow-sm">
                                  <Tag size={12} className="text-emerald-500" />
                                  {getCategoryName(item)}
                                </span>
                             </td>
                             <td className="px-6 py-6 hidden md:table-cell">
                                <div className="flex items-center gap-2">
                                   {item.status === 'published' ? (
                                     <span className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                                        <Eye size={12}/> PUBLISHED
                                     </span>
                                   ) : (
                                     <span className="flex items-center gap-2 text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                                        <EyeOff size={12}/> {item.status.toUpperCase()}
                                     </span>
                                   )}
                                </div>
                             </td>
                             <td className="pr-10 pl-6 py-6 text-right">
                                <div className="flex justify-end items-center gap-2">
                                   {currentStatus === 'trash' ? (
                                       <>
                                         <button onClick={() => { setSelectedId(item.id); setIsRestoreOpen(true); }} className="p-3 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="Pulihkan Berita"><RotateCcw size={20} /></button>
                                         <button onClick={() => { setSelectedId(item.id); setIsDeleteOpen(true); }} className="p-3 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Hapus Permanen"><Trash2 size={20} /></button>
                                       </>
                                   ) : (
                                       <>
                                         <Link href={`/news/${item.slug}`} target="_blank" className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Lihat di Web"><ExternalLink size={20} /></Link>
                                         <Link href={`/admin/news/edit/${item.id}`} className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Ubah Konten"><Pencil size={20} /></Link>
                                         <button onClick={() => { setSelectedId(item.id); setIsDeleteOpen(true); }} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Masukan Sampah"><Trash2 size={20} /></button>
                                       </>
                                   )}
                                </div>
                             </td>
                          </tr>
                        );
                      })
                  )}
               </tbody>
            </table>
         </div>

         {/* Pagination Footer */}
         {totalItems > limit && (
           <div className="px-10 py-8 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-6">
               <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Halaman <strong className="text-slate-900">{currentPage}</strong> Dari {totalPages}</span>
               <div className="flex gap-2">
                  <button 
                    disabled={currentPage <= 1} 
                    onClick={() => setCurrentPage(p => p - 1)} 
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-[10px] font-black text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors uppercase tracking-widest shadow-sm"
                  >
                     <ChevronLeft size={16} /> Sebelumnya
                  </button>
                  <button 
                    disabled={currentPage >= totalPages} 
                    onClick={() => setCurrentPage(p => p + 1)} 
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-[10px] font-black text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors uppercase tracking-widest shadow-sm"
                  >
                     Selanjutnya <ChevronRight size={16} />
                  </button>
               </div>
           </div>
         )}
      </div>

      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleSingleDelete}
        isLoading={isSingleDeleting}
        title={currentStatus === 'trash' ? "Musnahkan Permanen?" : "Arsipkan Berita?"}
        message={currentStatus === 'trash' ? "Data yang dimusnahkan TIDAK DAPAT dipulihkan kembali." : "Berita akan dipindahkan ke kategori Sampah."}
        confirmText={currentStatus === 'trash' ? "Ya, Musnahkan" : "Berikan ke Sampah"}
      />

      <ConfirmDialog 
        isOpen={isRestoreOpen}
        onClose={() => setIsRestoreOpen(false)}
        onConfirm={handleSingleRestore}
        isLoading={isSingleRestoring}
        title="Pulihkan Berita?"
        message="Berita yang dipulihkan akan kembali muncul di daftar tayang utama."
        confirmText="Ya, Pulihkan Sekarang"
      />

      <ConfirmDialog 
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        isLoading={isBulkDeleting}
        title={currentStatus === 'trash' ? "Musnahkan Massal?" : "Copot Berita Masal?"}
        message={`Anda akan memproses ${selectedIds.size} data sekaligus. Tindakan ini bersifat krusial.`}
        confirmText="Ya, Proses Massal"
      />

      <ConfirmDialog 
        isOpen={isBulkRestoreOpen}
        onClose={() => setIsBulkRestoreOpen(false)}
        onConfirm={handleBulkRestore}
        isLoading={isBulkRestoring}
        title="Pulihkan Massal?"
        message={`Pulihkan ${selectedIds.size} berita terpilih ke daftar tayang?`}
        confirmText="Ya, Pulihkan Semua"
      />
    </>
  );
}
