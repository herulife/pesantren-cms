'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getGallery, GalleryItem, resolveDisplayImageUrl } from '@/lib/api';
import { Search, X, ImageIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface GallerySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

const CATEGORIES = ['Umum', 'Fasilitas', 'Kegiatan', 'Santri', 'Event'];

export default function GallerySelectionModal({ isOpen, onClose, onSelect }: GallerySelectionModalProps) {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, limit: 12, offset: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  const fetchGallery = useCallback(async (search = searchQuery, category = selectedCategory, offset = 0) => {
    setIsLoading(true);
    const catParam = category === 'Semua' ? undefined : category;
    const res = await getGallery({ 
      search: search || undefined, 
      category: catParam, 
      limit: 12, 
      offset 
    });
    setGallery(res.data || []);
    setPagination(res.pagination || { total: 0, limit: 12, offset });
    setIsLoading(false);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    if (isOpen) {
      setSelectedUrl(null); // Reset selection when opened
      const timer = setTimeout(() => {
        fetchGallery(searchQuery, selectedCategory, 0);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchQuery, selectedCategory, fetchGallery]);

  const handleConfirm = () => {
    if (selectedUrl) {
      onSelect(selectedUrl);
    }
  };

  if (!isOpen) return null;

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <ImageIcon size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight font-outfit">Pilih dari Galeri</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Gunakan foto yang sudah diunggah sebelumnya</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-white">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Cari foto..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto scrollbar-hide bg-slate-50 p-1.5 rounded-xl border border-slate-100">
            {['Semua', ...CATEGORIES].map(cat => (
              <button 
                key={cat}
                onClick={() => { setSelectedCategory(cat); setPagination(p => ({...p, offset: 0})); }}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  selectedCategory === cat 
                    ? 'bg-white text-emerald-900 shadow-sm border border-slate-100' 
                    : 'text-slate-400 hover:text-emerald-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center py-20">
              <Loader2 size={40} className="text-emerald-500 animate-spin mb-4" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Memuat koleksi...</span>
            </div>
          ) : gallery.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                <ImageIcon size={32} />
              </div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-tight">Tidak ada foto ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {gallery.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedUrl(item.image_url)}
                  className={`group relative aspect-square bg-white rounded-2xl border-4 overflow-hidden cursor-pointer transition-all duration-300 ${
                    selectedUrl === item.image_url 
                      ? 'border-emerald-500 shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-500/10' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img 
                    src={resolveDisplayImageUrl(item.image_url)} 
                    alt={item.title} 
                    className={`w-full h-full object-cover transition-transform duration-500 ${selectedUrl === item.image_url ? 'scale-110' : 'group-hover:scale-110'}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/f1f5f9/94a3b8?text=Image+Not+Found';
                    }}
                  />
                  <div className={`absolute inset-0 bg-emerald-900/40 transition-opacity flex items-center justify-center p-4 ${selectedUrl === item.image_url ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <div className={`transform transition-all duration-300 ${selectedUrl === item.image_url ? 'scale-100' : 'scale-75 group-hover:scale-100'}`}>
                      <span className="text-[10px] font-black text-white uppercase tracking-widest text-center block mb-1">{item.title}</span>
                      {selectedUrl === item.image_url && (
                        <div className="mx-auto w-6 h-6 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-lg">
                          <ImageIcon size={14} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / Controls */}
        <div className="p-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-6">
            {pagination.total > pagination.limit && !isLoading && (
              <div className="flex items-center gap-2">
                <button 
                  disabled={currentPage <= 1}
                  onClick={() => fetchGallery(searchQuery, selectedCategory, pagination.offset - pagination.limit)}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mx-2">
                  {currentPage} / {totalPages}
                </span>
                <button 
                  disabled={currentPage >= totalPages}
                  onClick={() => fetchGallery(searchQuery, selectedCategory, pagination.offset + pagination.limit)}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
              Total: {pagination.total} Foto
            </span>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-3 border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
            >
              Batal
            </button>
            <button 
              disabled={!selectedUrl}
              onClick={handleConfirm}
              className="flex-1 sm:flex-none px-8 py-3 bg-emerald-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
            >
              Gunakan Foto Ini
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
