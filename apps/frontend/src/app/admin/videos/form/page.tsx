'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { addVideo, formatGalleryAlbumTitle, getVideos, getYouTubeThumbnailUrl, slugifyContentKey, updateVideo, Video } from '@/lib/api';
import { ArrowLeft, CalendarDays, ExternalLink, FolderOpen, Loader2, Play, Save, Star, Video as VideoIcon } from 'lucide-react';
import { useToast } from '@/components/Toast';

function createInitialForm() {
  return { title: '', url: '', series_name: '', event_date: '', is_featured: false };
}

export default function VideoFormPage() {
  return (
    <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>}>
      <VideoFormContent />
    </Suspense>
  );
}

function VideoFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { showToast } = useToast();

  const [form, setForm] = useState(createInitialForm());
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadVideo = async () => {
      const res = await getVideos({ limit: 200, offset: 0 });
      const current = (res.data || []).find((item: Video) => String(item.id) === id);
      if (!current) {
        showToast('error', 'Video tidak ditemukan.');
        router.push('/admin/videos');
        return;
      }
      setForm({
        title: current.title,
        url: current.url,
        series_name: current.series_name || '',
        event_date: current.event_date || '',
        is_featured: current.is_featured || false,
      });
      setIsLoading(false);
    };
    loadVideo();
  }, [id, router, showToast]);

  const thumbnail = getYouTubeThumbnailUrl(form.url);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title || !form.url) {
      showToast('error', 'Judul dan URL video wajib diisi.');
      return;
    }
    if (!thumbnail) {
      showToast('error', 'URL YouTube tidak valid.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = { ...form, series_slug: slugifyContentKey(form.series_name), thumbnail };
      if (id) {
        const res = await updateVideo(Number(id), payload);
        if (res.success) {
          showToast('success', 'Video berhasil diperbarui.');
          router.push('/admin/videos');
        } else {
          showToast('error', 'Gagal memperbarui video.');
        }
      } else {
        const res = await addVideo(payload);
        if (res.success) {
          showToast('success', 'Video berhasil ditambahkan.');
          router.push('/admin/videos');
        } else {
          showToast('error', 'Gagal menambahkan video.');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
      showToast('error', message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;

  return (
    <div className="mx-auto max-w-5xl pb-20">
      <div className="mb-10 flex items-center gap-4">
        <button type="button" onClick={() => router.push('/admin/videos')} className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-emerald-200 hover:text-emerald-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Form Video</p>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 font-outfit">{id ? 'Edit Video' : 'Tautkan Video Baru'}</h1>
          <p className="text-sm font-medium text-slate-500">Sekarang video dikelola di halaman penuh, bukan popup.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><VideoIcon size={12} /> Judul Video</label>
              <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="Kajian Tafsir Surat Al-Mulk" />
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><ExternalLink size={12} /> URL YouTube</label>
              <input value={form.url} onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-medium text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="https://www.youtube.com/watch?v=..." />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><FolderOpen size={12} /> Seri / Kegiatan</label>
                <input value={form.series_name} onChange={(e) => setForm((prev) => ({ ...prev, series_name: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="Kajian Ahad Pagi" />
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><CalendarDays size={12} /> Tanggal Kegiatan</label>
                <input type="date" value={form.event_date} onChange={(e) => setForm((prev) => ({ ...prev, event_date: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" />
              </div>
            </div>
            <button type="button" onClick={() => setForm((prev) => ({ ...prev, is_featured: !prev.is_featured }))} className={`flex w-full items-center gap-3 rounded-xl border px-6 py-4 text-xs font-black uppercase tracking-widest transition-all ${form.is_featured ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
              <Star size={16} className={form.is_featured ? 'fill-amber-500' : ''} />
              Jadikan Video Unggulan
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">Preview</p>
            <div className="mt-4 aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
              {thumbnail ? <img src={thumbnail} alt="Thumbnail preview" className="h-full w-full object-cover opacity-80" /> : <div className="flex h-full items-center justify-center text-slate-500"><Play size={40} /></div>}
            </div>
            <div className="mt-5 space-y-2">
              {form.series_name && <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">{formatGalleryAlbumTitle(form.series_name)}</p>}
              <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">{form.title || 'Judul video akan tampil di sini'}</h3>
              <p className="text-sm font-medium text-slate-500">{form.event_date || 'Tanggal kegiatan belum diisi'}</p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-8 flex justify-end gap-4">
          <button type="button" onClick={() => router.push('/admin/videos')} className="rounded-lg border border-slate-200 bg-white px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50">Batal</button>
          <button type="submit" disabled={isSaving} className="flex items-center gap-3 rounded-lg bg-slate-900 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-emerald-600 disabled:opacity-50">
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {id ? 'Simpan Video' : 'Tautkan Video'}
          </button>
        </div>
      </form>
    </div>
  );
}
