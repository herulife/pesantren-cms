'use client';

import Image from 'next/image';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getVideos, deleteVideo, updateVideo, addVideo, Video, formatGalleryAlbumTitle, getGallerySortTimestamp, getYouTubeThumbnailUrl, slugifyContentKey } from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { Video as VideoIcon, Plus, Play, Trash2, ExternalLink, Search, X, Save, Pencil, FolderOpen, CalendarDays, Star } from 'lucide-react';

export default function VideosAdminPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [pagination, setPagination] = useState({ total: 0, limit: 9, offset: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states
  const [form, setForm] = useState({ title: '', url: '', series_name: '', event_date: '', is_featured: false });
  const [isEditing, setIsEditing] = useState(false);

  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fetchVideos = useCallback(async (search = searchQuery, offset = 0) => {
    setIsLoading(true);
    const res = await getVideos({ 
      search: search || undefined, 
      limit: 9, 
      offset 
    });
    setVideos(res.data || []);
    setPagination(res.pagination || { total: 0, limit: 9, offset: 0 });
    setIsLoading(false);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVideos(searchQuery, 0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchVideos]);

  const videoSeries = useMemo(() => {
    const grouped = new Map<string, { key: string; title: string; count: number; eventDate: string }>();
    for (const video of videos) {
      if (!video.series_name) continue;
      const key = video.series_slug || video.series_name;
      const current = grouped.get(key);
      if (current) {
        current.count += 1;
      } else {
        grouped.set(key, {
          key,
          title: formatGalleryAlbumTitle(video.series_name),
          count: 1,
          eventDate: video.event_date || '',
        });
      }
    }
    return Array.from(grouped.values()).sort((a, b) => getGallerySortTimestamp(b.eventDate, undefined) - getGallerySortTimestamp(a.eventDate, undefined));
  }, [videos]);

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsDeleting(true);
    try {
      const res = await deleteVideo(selectedId);
      if (res.success) {
        showToast('success', 'Video berhasil dihapus.');
        fetchVideos();
        setIsDeleteOpen(false);
      } else {
        showToast('error', 'Gagal menghapus video.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menghapus video.';
      showToast('error', message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenForm = (video?: Video) => {
    if (video) {
        setIsEditing(true);
        setSelectedId(video.id);
        setForm({ title: video.title, url: video.url, series_name: video.series_name || '', event_date: video.event_date || '', is_featured: video.is_featured || false });
    } else {
        setIsEditing(false);
        setSelectedId(null);
        setForm({ title: '', url: '', series_name: '', event_date: '', is_featured: false });
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
    if (!form.title || !form.url) {
      showToast('error', 'Semua data wajib diisi.');
      return;
    }

    const thumbnail = getYouTubeThumbnailUrl(form.url);

    if (!thumbnail) {
        showToast('error', 'URL YouTube tidak valid.');
        return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        series_slug: slugifyContentKey(form.series_name),
        thumbnail
      };

      if (isEditing && selectedId) {
        const res = await updateVideo(selectedId, payload);
        if (res.success) {
          showToast('success', 'Video berhasil diperbarui.');
          setIsFormOpen(false);
          fetchVideos();
        } else {
          showToast('error', 'Gagal memperbarui video.');
        }
      } else {
        const res = await addVideo(payload);
        if (res.success) {
          showToast('success', 'Video baru berhasil ditambahkan.');
          setIsFormOpen(false);
          fetchVideos();
        } else {
          showToast('error', 'Gagal menambahkan video.');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
      showToast('error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight">Pustaka Video</h1>
          <p className="text-slate-500 text-sm font-medium">Kelola video kajian dan dokumentasi pondok dari YouTube.</p>
        </div>
        <button 
          onClick={() => router.push('/admin/videos/form')}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-lg font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95"
        >
          <Plus size={20} />
          <span>Tautkan Video</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-5 mb-10">
         <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Cari judul kajian..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm"
            />
         </div>
      </div>

      {videoSeries.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-10">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700">Seri Video</p>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Kegiatan & Kajian Terekam</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">
              <FolderOpen size={14} />
              {videoSeries.length} seri
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {videoSeries.map((series) => (
              <div key={series.key} className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-5 transition-all hover:border-emerald-200 hover:bg-white">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">Seri</p>
                <h3 className="mt-2 text-lg font-black uppercase tracking-tight text-slate-900">{series.title}</h3>
                <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="inline-flex items-center gap-2"><Play size={12} /> {series.count} video</span>
                  <span className="inline-flex items-center gap-2"><CalendarDays size={12} /> {series.eventDate || 'Tanpa tanggal'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-10">
        {!isLoading ? (
          videos.length > 0 ? (
            videos.map((v) => (
              <div key={v.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col">
                 <div className="aspect-video relative overflow-hidden bg-slate-950 shrink-0">
                    <Image 
                      src={v.thumbnail || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1472&auto=format&fit=crop'} 
                      alt={v.title} 
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700 group-hover:opacity-80" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-all duration-500 border border-white/30 shadow-2xl">
                          <Play fill="white" size={32} />
                       </div>
                    </div>
                 </div>
                 <div className="p-8 flex-1 flex flex-col justify-between">
                    <div className="mb-8">
                      {v.series_name && <p className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">{formatGalleryAlbumTitle(v.series_name)}</p>}
                      <h3 className="font-black text-slate-900 line-clamp-2 leading-relaxed tracking-tight text-lg uppercase">{v.title}</h3>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 mt-auto">
                       <div className="flex gap-2">
                          <button 
                            onClick={() => router.push(`/admin/videos/form?id=${v.id}`)}
                            className="p-3 bg-white text-slate-400 hover:text-emerald-600 hover:border-emerald-100 border border-slate-100 rounded-xl transition-all shadow-sm"
                          >
                             <Pencil size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedId(v.id);
                              setIsDeleteOpen(true);
                            }}
                            className="p-3 bg-white text-slate-400 hover:text-rose-500 hover:border-rose-100 border border-slate-100 rounded-xl transition-all shadow-sm"
                          >
                             <Trash2 size={18} />
                          </button>
                       </div>
                       <div className="flex items-center gap-2">
                         {v.is_featured && (
                           <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-amber-700">
                             <Star size={12} className="fill-amber-500" />
                             Unggulan
                           </span>
                         )}
                         <a 
                         href={v.url} 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.1em] rounded-xl hover:bg-emerald-600 transition-all"
                       >
                          YOUTUBE <ExternalLink size={12} />
                        </a>
                       </div>
                    </div>
                 </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-xl p-24 border-2 border-slate-100 border-dashed text-center">
               <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-8 text-slate-200">
                 <VideoIcon size={40} />
               </div>
               <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Kajian Visual Kosong</h3>
               <p className="text-slate-400 max-w-sm mx-auto font-medium">Video kajian dari YouTube pondok pesantren akan tampil di sini setelah ditambahkan.</p>
            </div>
          )
        ) : (
          <div className="col-span-full py-20 text-center uppercase font-black text-slate-300 tracking-[0.3em] animate-pulse">
             Memuat Pustaka Video...
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex justify-center gap-2 mb-10">
           {Array.from({ length: Math.ceil(pagination.total / pagination.limit) }).map((_, i) => (
             <button
               key={i}
               onClick={() => fetchVideos(searchQuery, i * pagination.limit)}
               className={`w-10 h-10 rounded-xl font-bold transition-all ${
                 pagination.offset === i * pagination.limit 
                   ? 'bg-emerald-600 text-white shadow-lg' 
                   : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'
               }`}
             >
               {i + 1}
             </button>
           ))}
        </div>
      )}

      {/* Form Modal (Add/Edit) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>
          <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl relative overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <Play size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-outfit">
                    {isEditing ? 'Edit Video' : 'Tautkan Video'}
                  </h3>
                </div>
                <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X /></button>
             </div>
             
             <form onSubmit={handleFormSubmit} className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Judul Video</label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: Kajian Fiqih - Kitab Safinatun Najah"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Seri / Kegiatan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Wisuda Tahfidz 2026"
                      value={form.series_name}
                      onChange={(e) => setForm({ ...form, series_name: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Tanggal Kegiatan</label>
                    <input
                      type="date"
                      value={form.event_date}
                      onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_featured: !form.is_featured })}
                  className={`w-full rounded-xl border px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                    form.is_featured
                      ? 'border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-200'
                      : 'border-slate-200 bg-white text-slate-500'
                  }`}
                >
                  {form.is_featured ? 'Video Unggulan Aktif' : 'Tandai Sebagai Video Unggulan'}
                </button>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Tautan YouTube</label>
                  <div className="relative group">
                    <Play className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors" size={20} />
                    <input 
                      type="url"
                      required
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={form.url}
                      onChange={(e) => setForm({ ...form, url: e.target.value })}
                      className="w-full pl-16 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-3 px-1 italic">Thumbnail akan ditarik secara otomatis dari YouTube.</p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    disabled={isSubmitting}
                    type="submit"
                    className="flex-[2] py-4 bg-slate-900 text-white rounded-lg font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-slate-200 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
                  >
                     {isSubmitting ? 'Sedang Memproses...' : (
                        <>
                          <Save size={18} />
                          Simpan Video
                        </>
                     )}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Hapus Video?"
        message="Video ini akan dihapus dari portal kajian dan dokumentasi pondok."
        confirmText="Hapus Video"
      />
    </>
  );
}
