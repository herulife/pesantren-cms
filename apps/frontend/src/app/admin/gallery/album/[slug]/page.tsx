'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { deleteGalleryItem, formatGalleryAlbumTitle, GalleryItem, getGallery, getGallerySortTimestamp, resolveDisplayImageUrl } from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { ArrowLeft, Calendar, Copy, FolderOpen, ImageIcon, Layers3, Trash2 } from 'lucide-react';

export default function GalleryAlbumAdminPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const slug = typeof params?.slug === 'string' ? params.slug : '';

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadAlbum = async () => {
      const res = await getGallery({ limit: 500, offset: 0 });
      const allItems = (res.data || []) as GalleryItem[];
      const albumItems = allItems
        .filter((item) => item.album_slug === slug)
        .sort((a, b) => getGallerySortTimestamp(b.event_date, b.created_at) - getGallerySortTimestamp(a.event_date, a.created_at));

      setItems(albumItems);
      setIsLoading(false);
    };

    if (slug) {
      loadAlbum();
    } else {
      setIsLoading(false);
    }
  }, [slug]);

  const albumMeta = useMemo(() => {
    if (!items.length) return null;

    const cover = items.find((item) => item.is_album_cover) || items[0];
    return {
      name: formatGalleryAlbumTitle(items[0].album_name || slug),
      slug,
      category: items[0].category,
      eventDate: items[0].event_date,
      total: items.length,
      cover,
    };
  }, [items, slug]);

  const handleDelete = async () => {
    if (!selectedId) return;

    setIsDeleting(true);
    try {
      const res = await deleteGalleryItem(selectedId);
      if (res.success) {
        const nextItems = items.filter((item) => item.id !== selectedId);
        setItems(nextItems);
        setIsDeleteOpen(false);
        showToast('success', 'Foto berhasil dihapus dari album.');

        if (nextItems.length === 0) {
          router.push('/admin/gallery');
        }
      } else {
        showToast('error', 'Gagal menghapus foto dari album.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menghapus foto dari album.';
      showToast('error', message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><ImageIcon className="animate-pulse text-emerald-500" size={40} /></div>;
  }

  if (!albumMeta) {
    return (
      <div className="mx-auto max-w-5xl py-20">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-8 py-16 text-center shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Album Tidak Ditemukan</p>
          <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-slate-900">Album ini belum punya foto</h1>
          <p className="mt-3 text-sm font-medium text-slate-500">Kembali ke perpustakaan galeri untuk memilih album lain atau menambahkan foto baru.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/admin/gallery" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:bg-slate-50">
              Kembali ke Galeri
            </Link>
            <Link href="/admin/gallery/form" className="rounded-xl bg-emerald-600 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-emerald-700">
              Tambah Foto
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl pb-20">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/gallery" className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-emerald-200 hover:text-emerald-600">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">Album Galeri</p>
              <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 font-outfit">{albumMeta.name}</h1>
              <p className="text-sm font-medium text-slate-500">Kelola semua media di album ini seperti tampilan pustaka media.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin/gallery/form" className="rounded-xl bg-emerald-600 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-emerald-700">
              Tambah Foto Baru
            </Link>
          </div>
        </div>

        <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="h-full min-h-[280px] bg-slate-100">
              <img src={resolveDisplayImageUrl(albumMeta.cover.image_url)} alt={albumMeta.name} className="h-full w-full object-cover" />
            </div>
            <div className="space-y-6 p-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">{albumMeta.category}</p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-slate-900">{albumMeta.name}</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <FolderOpen size={18} className="text-emerald-600" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Slug Album</p>
                      <p className="mt-1 text-sm font-bold text-slate-700">{albumMeta.slug}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <Layers3 size={18} className="text-emerald-600" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Foto</p>
                      <p className="mt-1 text-sm font-bold text-slate-700">{albumMeta.total} file</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-emerald-600" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tanggal</p>
                      <p className="mt-1 text-sm font-bold text-slate-700">{albumMeta.eventDate || 'Belum diisi'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm font-medium leading-relaxed text-slate-500">Foto cover ditampilkan di panel kiri. Semua item di bawah bisa dipreview, disalin URL-nya, atau dihapus langsung dari album.</p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-8 py-6">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Isi Album</p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">Daftar Media</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg">
                <div className="relative aspect-[4/5] bg-slate-100">
                  <img src={resolveDisplayImageUrl(item.image_url)} alt={item.title} className="h-full w-full object-cover" />
                  {item.is_album_cover && (
                    <span className="absolute left-4 top-4 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                      Cover
                    </span>
                  )}
                </div>
                <div className="space-y-4 p-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">{item.category}</p>
                    <h3 className="mt-2 line-clamp-2 text-lg font-black uppercase tracking-tight text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-xs font-medium text-slate-500">ID #{item.id}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => window.open(resolveDisplayImageUrl(item.image_url), '_blank', 'noopener,noreferrer')}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:border-emerald-200 hover:text-emerald-700"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(resolveDisplayImageUrl(item.image_url));
                        showToast('success', 'URL gambar berhasil disalin.');
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:border-emerald-200 hover:text-emerald-700"
                    >
                      <Copy size={14} />
                      Salin URL
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(item.id);
                        setIsDeleteOpen(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 transition-all hover:bg-rose-100"
                    >
                      <Trash2 size={14} />
                      Hapus
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Hapus Foto?"
        message="Foto ini akan dihapus permanen dari album dan galeri publik."
        confirmText="Hapus Sekarang"
      />
    </>
  );
}
