'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getGallery, deleteGalleryItem, GalleryItem, resolveDisplayImageUrl, formatGalleryAlbumTitle, getGallerySortTimestamp } from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { Plus, Search, Trash2, X, Eye, Calendar, Tag, ChevronLeft, ChevronRight, Copy, FolderOpen, Layers3, ImageIcon } from 'lucide-react';

const CATEGORIES = ['Umum', 'Fasilitas', 'Kegiatan', 'Santri', 'Event'];

export default function GalleryAdminPage() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [allGalleryItems, setAllGalleryItems] = useState<GalleryItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, limit: 10, offset: 0 }); // Matching limit to news style
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  // States Modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // States Data
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedAlbumFilter, setSelectedAlbumFilter] = useState('Semua Album');

  const { showToast } = useToast();

  const fetchGallery = useCallback(async (search = searchQuery, category = selectedCategory, offset = pagination.offset, albumSlug = selectedAlbumFilter) => {
    setIsLoading(true);
    const catParam = category === 'Semua' ? undefined : category;
    const [pagedRes, catalogRes] = await Promise.all([
      getGallery({
        search: search || undefined,
        category: catParam,
        limit: 10,
        offset
      }),
      getGallery({
        category: catParam,
        limit: 500,
        offset: 0
      })
    ]);

    const catalogItems = (catalogRes.data || []) as GalleryItem[];
    const filteredCatalogItems = catalogItems.filter((item) => albumSlug === 'Semua Album' || item.album_slug === albumSlug);
    const filteredPagedItems = albumSlug === 'Semua Album'
      ? ((pagedRes.data || []) as GalleryItem[])
      : filteredCatalogItems.slice(offset, offset + 10);

    setGallery(filteredPagedItems);
    setAllGalleryItems(filteredCatalogItems);
    setPagination(
      albumSlug === 'Semua Album'
        ? (pagedRes.pagination || { total: 0, limit: 10, offset })
        : { total: filteredCatalogItems.length, limit: 10, offset }
    );
    setIsLoading(false);
  }, [searchQuery, selectedCategory, pagination.offset, selectedAlbumFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGallery(searchQuery, selectedCategory, 0, selectedAlbumFilter);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedAlbumFilter]);

  const albumSummaries = useMemo(() => {
    const grouped = new Map<string, { slug: string; name: string; category: string; eventDate: string; count: number; cover: string }>();
    for (const item of allGalleryItems) {
      if (!item.album_name) {
        continue;
      }
      const key = item.album_slug || item.album_name;
      const existing = grouped.get(key);
      if (existing) {
        existing.count += 1;
        if (item.is_album_cover) {
          existing.cover = item.image_url;
        }
      } else {
        grouped.set(key, {
          slug: item.album_slug || key,
          name: item.album_name,
          category: item.category,
          eventDate: item.event_date,
          count: 1,
          cover: item.image_url,
        });
      }
    }
    return Array.from(grouped.values())
      .map((album) => ({ ...album, name: formatGalleryAlbumTitle(album.name) }))
      .sort((a, b) => getGallerySortTimestamp(b.eventDate, undefined) - getGallerySortTimestamp(a.eventDate, undefined) || a.name.localeCompare(b.name));
  }, [allGalleryItems]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(gallery.map(item => item.id)));
    else setSelectedIds(new Set());
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id); else newSet.delete(id);
    setSelectedIds(newSet);
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsDeleting(true);
    try {
      const res = await deleteGalleryItem(selectedId);
      if (res.success) {
        showToast('success', 'Foto berhasil dihapus dari galeri.');
        setSelectedIds(prev => { prev.delete(selectedId); return new Set(prev); });
        fetchGallery();
        setIsDeleteOpen(false);
      } else {
        showToast('error', 'Gagal menghapus foto.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menghapus foto.';
      showToast('error', message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    let successCount = 0;
    setIsBulkDeleting(true);
    
    try {
      for (const id of ids) {
        const res = await deleteGalleryItem(id);
        if (res.success) successCount++;
      }
      
      if (successCount > 0) {
        showToast('success', `${successCount} foto berhasil dihapus permanen.`);
        setSelectedIds(new Set());
        fetchGallery();
      } else {
        showToast('error', 'Gagal memproses penghapusan massal.');
      }
      setIsBulkDeleteOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memproses penghapusan massal.';
      showToast('error', message);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight">Galeri Foto</h1>
          <p className="text-slate-500 text-sm font-medium">Perpustakaan media untuk meninjau album, mencari foto, menyalin URL, dan mengelola arsip galeri.</p>
        </div>
        <Link
          href="/admin/gallery/form"
          className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-lg font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
        >
          <Plus size={20} />
          <span>Upload Foto</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700">Album Kegiatan</p>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Kelola Dokumentasi Per Kegiatan</h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-emerald-700">
              <FolderOpen size={14} />
              {albumSummaries.length} album
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-slate-700">
              <Layers3 size={14} />
              {allGalleryItems.length} foto
            </span>
          </div>
        </div>

        {albumSummaries.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <button
              type="button"
              onClick={() => { setSelectedAlbumFilter('Semua Album'); setPagination((prev) => ({ ...prev, offset: 0 })); }}
              className={`rounded-xl border p-5 text-left transition-all ${selectedAlbumFilter === 'Semua Album' ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100' : 'border-slate-200 bg-slate-50 hover:border-emerald-200 hover:bg-white'}`}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Semua Album</p>
              <h3 className="mt-3 text-xl font-black uppercase tracking-tight text-slate-900">Tampilkan Semua</h3>
              <p className="mt-2 text-xs font-bold text-slate-500">Lihat seluruh foto tanpa pengelompokan album.</p>
            </button>
            {albumSummaries.map((album) => (
              <Link
                key={album.slug}
                href={`/admin/gallery/album/${album.slug}`}
                className={`rounded-xl border overflow-hidden text-left transition-all ${selectedAlbumFilter === album.slug ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100' : 'border-slate-200 bg-white hover:border-emerald-200 hover:-translate-y-1'}`}
              >
                <div className="h-36 w-full bg-slate-100">
                  <img src={resolveDisplayImageUrl(album.cover)} alt={album.name} className="h-full w-full object-cover" />
                </div>
                <div className="p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">{album.category}</p>
                  <h3 className="mt-2 text-lg font-black uppercase tracking-tight text-slate-900">{album.name}</h3>
                  <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>{album.count} foto</span>
                    <span>{album.eventDate || 'Tanpa tanggal'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Belum ada album kegiatan. Upload foto pertama lalu isi nama kegiatan untuk mulai membuat album.</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mb-10">
        {/* Advanced Toolbar */}
        <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm shrink-0 overflow-x-auto scrollbar-hide max-w-full">
            {['Semua', ...CATEGORIES].map(cat => (
              <button 
                key={cat}
                onClick={() => { setSelectedCategory(cat); setPagination({ ...pagination, offset: 0 }); }}
                className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1 w-full relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Cari dokumentasi berdasarkan judul..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm shadow-inner"
            />
          </div>
        </div>

        {selectedAlbumFilter !== 'Semua Album' && (
          <div className="px-8 py-4 border-b border-emerald-100 bg-emerald-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">Filter Album Aktif</p>
              <p className="text-sm font-bold text-slate-700">{albumSummaries.find((album) => album.slug === selectedAlbumFilter)?.name || selectedAlbumFilter}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedAlbumFilter('Semua Album')}
              className="px-4 py-2 rounded-lg bg-white border border-emerald-200 text-[10px] font-black uppercase tracking-widest text-emerald-700"
            >
              Reset Album
            </button>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="bg-emerald-50 px-8 py-4 border-b border-emerald-100 flex items-center justify-between animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-xs font-black">
                {selectedIds.size}
              </div>
              <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">Item Terpilih</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsBulkDeleteOpen(true)}
                className="px-6 py-2.5 bg-white text-rose-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all"
              >
                Hapus Permanen
              </button>
              <button onClick={() => setSelectedIds(new Set())} className="p-2.5 text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
          </div>
        )}

        {/* Table Layout */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                <th className="pl-10 pr-6 py-6 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={gallery.length > 0 && selectedIds.size === gallery.length} 
                    onChange={(e) => handleSelectAll(e.target.checked)} 
                    className="w-5 h-5 rounded-lg border-slate-200 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer transition-all" 
                  />
                </th>
                <th className="px-6 py-6">Informasi Galeri</th>
                <th className="px-6 py-6 hidden lg:table-cell">Kategori</th>
                <th className="px-6 py-6 hidden md:table-cell">Pemuatan</th>
                <th className="pr-10 pl-6 py-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-32 text-center uppercase font-black text-slate-300 tracking-[0.3em] animate-pulse">
                    Sinkronisasi Galeri...
                  </td>
                </tr>
              ) : gallery.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-40 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <ImageIcon className="text-slate-200" size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Galeri Kosong</h3>
                    <p className="text-slate-400 max-w-xs mx-auto text-sm font-medium">Belum ada foto yang diunggah untuk kategori ini.</p>
                  </td>
                </tr>
              ) : (
                gallery.map((item) => {
                  const isChecked = selectedIds.has(item.id);
                  return (
                    <tr key={item.id} className={`group hover:bg-slate-50 transition-colors ${isChecked ? 'bg-emerald-50/50' : ''}`}>
                      <td className="pl-10 pr-6 py-6 text-center">
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={(e) => handleSelectOne(item.id, e.target.checked)} 
                          className="w-5 h-5 rounded-lg border-slate-200 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer transition-all" 
                        />
                      </td>
                      <td className="px-6 py-6 max-w-lg">
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100 group-hover:shadow-lg transition-all duration-500">
                            <img src={resolveDisplayImageUrl(item.image_url)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          </div>
                          <div className="flex flex-col gap-2">
                            <button 
                              onClick={() => { setSelectedItem(item); setIsPreviewOpen(true); }}
                              className="font-black text-slate-900 leading-snug uppercase tracking-tight group-hover:text-emerald-600 transition-colors text-left line-clamp-2"
                            >
                              {item.title}
                            </button>
                            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                              <div className="flex items-center gap-1.5">
                                <Calendar size={12} className="text-slate-300" />
                                {item.event_date
                                  ? new Date(item.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                  : 'Tanggal belum diisi'}
                              </div>
                              <div className="flex items-center gap-1.5">ID: {item.id}</div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 hidden lg:table-cell">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest shadow-sm">
                          <Tag size={12} className="text-emerald-500" />
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-6 hidden md:table-cell">
                        <span className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                          <Eye size={12}/> ONLINE
                        </span>
                      </td>
                      <td className="pr-10 pl-6 py-6 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button 
                            onClick={() => { setSelectedItem(item); setIsPreviewOpen(true); }}
                            className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" 
                            title="Pratinjau Foto"
                          >
                            <Eye size={20} />
                          </button>
                          <button 
                            onClick={() => { navigator.clipboard.writeText(resolveDisplayImageUrl(item.image_url)); showToast('success', 'URL Gambar berhasil disalin!'); }}
                            className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" 
                            title="Salin Link Gambar"
                          >
                            <Copy size={20} />
                          </button>
                          <button 
                            onClick={() => { setSelectedId(item.id); setIsDeleteOpen(true); }} 
                            className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" 
                            title="Hapus Foto"
                          >
                            <Trash2 size={20} />
                          </button>
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
        {pagination.total > pagination.limit && (
          <div className="px-10 py-8 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-6">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Halaman <strong className="text-slate-900">{currentPage}</strong> Dari {totalPages}</span>
            <div className="flex gap-2">
              <button 
                disabled={currentPage <= 1} 
                onClick={() => fetchGallery(searchQuery, selectedCategory, pagination.offset - pagination.limit)} 
                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-[10px] font-black text-slate-600 rounded-2xl hover:bg-slate-50 disabled:opacity-30 transition-all uppercase tracking-widest shadow-sm"
              >
                <ChevronLeft size={16} /> Sebelumnya
              </button>
              <button 
                disabled={currentPage >= totalPages} 
                onClick={() => fetchGallery(searchQuery, selectedCategory, pagination.offset + pagination.limit)} 
                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-[10px] font-black text-slate-600 rounded-2xl hover:bg-slate-50 disabled:opacity-30 transition-all uppercase tracking-widest shadow-sm"
              >
                Selanjutnya <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xl" onClick={() => setIsPreviewOpen(false)}></div>
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col items-center justify-center animate-in zoom-in duration-500">
             <img src={resolveDisplayImageUrl(selectedItem.image_url)} className="w-full h-full object-contain rounded-xl shadow-2xl border border-white/10" />
             <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={() => { navigator.clipboard.writeText(resolveDisplayImageUrl(selectedItem.image_url)); showToast('success', 'URL Gambar disalin!'); }}
                  className="p-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-lg hover:bg-emerald-600 transition-all font-bold text-xs flex items-center gap-2"
                >
                  <Copy size={20} /> Salin Link
                </button>
                <button onClick={() => setIsPreviewOpen(false)} className="p-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-lg hover:bg-rose-500 transition-all">
                  <X size={24} />
                </button>
             </div>
             <div className="absolute bottom-[-80px] left-0 right-0 text-center">
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{selectedItem.category}</p>
                <h3 className="text-white text-2xl font-black uppercase tracking-tight">{selectedItem.title}</h3>
             </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Hapus Foto?"
        message="Foto ini akan dihapus permanen dari galeri publik pondok pesantren."
        confirmText="Hapus Sekarang"
      />

      {/* Bulk Delete Dialog */}
      <ConfirmDialog 
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        isLoading={isBulkDeleting}
        title="Hapus Masal?"
        message={`Anda akan menghapus ${selectedIds.size} foto secara permanen. Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Semua"
      />
    </>
  );
}
