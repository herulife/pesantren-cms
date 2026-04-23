'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  addGalleryItem,
  formatGalleryAlbumTitle,
  GalleryItem,
  getGallery,
  getGallerySortTimestamp,
  normalizeApiAssetUrl,
  resolveDisplayImageUrl,
  slugifyContentKey,
  uploadImage,
} from '@/lib/api';
import { ArrowLeft, Calendar, Check, FolderOpen, ImageIcon, Images, Loader2, Save, Upload, X } from 'lucide-react';
import { useToast } from '@/components/Toast';
import ImageCropperModal from '@/components/ImageCropperModal';

const CATEGORIES = ['Umum', 'Fasilitas', 'Kegiatan', 'Santri', 'Event'];

function createInitialForm() {
  return {
    title: '',
    category: 'Umum',
    album_name: '',
    event_date: '',
    is_album_cover: false,
  };
}

export default function GalleryFormPage() {
  return (
    <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>}>
      <GalleryFormContent />
    </Suspense>
  );
}

function GalleryFormContent() {
  const router = useRouter();
  const { showToast } = useToast();

  const [allGalleryItems, setAllGalleryItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [form, setForm] = useState(createInitialForm());
  const [albumMode, setAlbumMode] = useState<'existing' | 'new'>('new');
  const [selectedAlbumSlug, setSelectedAlbumSlug] = useState('');
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<Blob | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  useEffect(() => {
    const loadGallery = async () => {
      const res = await getGallery({ limit: 500, offset: 0 });
      setAllGalleryItems((res.data || []) as GalleryItem[]);
      setIsLoading(false);
    };
    loadGallery();
  }, []);

  const albumSummaries = useMemo(() => {
    const grouped = new Map<string, { slug: string; name: string; category: string; eventDate: string; count: number; cover: string }>();

    for (const item of allGalleryItems) {
      if (!item.album_name) continue;

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

  const selectedAlbum = useMemo(
    () => albumSummaries.find((item) => item.slug === selectedAlbumSlug) || null,
    [albumSummaries, selectedAlbumSlug]
  );

  const applyAlbumSelection = (albumSlug: string) => {
    setSelectedAlbumSlug(albumSlug);
    const album = albumSummaries.find((item) => item.slug === albumSlug);

    if (!album) {
      setForm((prev) => ({ ...prev, album_name: '', event_date: '', is_album_cover: false }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      category: album.category || prev.category,
      album_name: album.name,
      event_date: album.eventDate || '',
      is_album_cover: false,
    }));
  };

  const resetSingleForm = () => {
    setForm(createInitialForm());
    setAlbumMode('new');
    setSelectedAlbumSlug('');
    setTempImage(null);
    setCroppedImage(null);
    setCroppedImageUrl(null);
  };

  const resetBulkForm = () => {
    setBulkFiles([]);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setTempImage(reader.result as string);
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (blob: Blob) => {
    if (croppedImageUrl) {
      URL.revokeObjectURL(croppedImageUrl);
    }
    setCroppedImage(blob);
    setCroppedImageUrl(URL.createObjectURL(blob));
    setIsCropperOpen(false);
  };

  const handleBulkSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBulkFiles(Array.from(event.target.files || []));
  };

  const validateAlbumSettings = () => {
    if (!form.album_name.trim()) {
      showToast('error', 'Nama album atau kegiatan wajib diisi.');
      return false;
    }
    return true;
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!croppedImage) {
      showToast('error', 'Pilih foto utama terlebih dahulu.');
      return;
    }
    if (!form.title.trim()) {
      showToast('error', 'Judul foto wajib diisi.');
      return;
    }
    if (!validateAlbumSettings()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadRes = await uploadImage(new File([croppedImage], 'gallery.webp', { type: 'image/webp' }));
      if (!uploadRes.url) throw new Error('Gagal upload gambar');

      const res = await addGalleryItem({
        title: form.title.trim(),
        category: form.category,
        album_name: form.album_name.trim(),
        album_slug: slugifyContentKey(form.album_name),
        event_date: form.event_date,
        is_album_cover: form.is_album_cover,
        image_url: normalizeApiAssetUrl(uploadRes.url),
      });

      if (res.success) {
        showToast('success', 'Foto berhasil ditambahkan ke galeri.');
        router.push('/admin/gallery');
        return;
      }

      showToast('error', res.message || 'Gagal menyimpan foto ke galeri.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat mengunggah foto.';
      showToast('error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFiles.length) {
      showToast('error', 'Pilih foto untuk upload massal.');
      return;
    }
    if (!validateAlbumSettings()) {
      return;
    }

    setIsBulkSubmitting(true);
    let successCount = 0;

    try {
      for (const file of bulkFiles) {
        const uploadRes = await uploadImage(file);
        if (!uploadRes.url) continue;

        const title = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Foto Galeri';
        const res = await addGalleryItem({
          title,
          category: form.category,
          album_name: form.album_name.trim(),
          album_slug: slugifyContentKey(form.album_name),
          event_date: form.event_date,
          is_album_cover: successCount === 0 ? form.is_album_cover : false,
          image_url: normalizeApiAssetUrl(uploadRes.url),
        });

        if (res.success) {
          successCount += 1;
        }
      }

      if (successCount > 0) {
        showToast('success', `${successCount} foto berhasil ditambahkan ke galeri.`);
        router.push('/admin/gallery');
        return;
      }

      showToast('error', 'Tidak ada foto yang berhasil diunggah.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat upload massal.';
      showToast('error', message);
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;
  }

  return (
    <>
      <div className="mx-auto max-w-7xl pb-20">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push('/admin/gallery')}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-emerald-200 hover:text-emerald-600"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">Galeri Media</p>
              <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 font-outfit">Tambah Foto Baru</h1>
              <p className="text-sm font-medium text-slate-500">Alur dibuat lebih sederhana seperti WordPress: media di kiri, pengaturan di kanan.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <form id="gallery-single-upload-form" onSubmit={handleUpload} className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Media</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">Foto Utama</h2>
              </div>

              <div className="p-6">
                {!croppedImageUrl ? (
                  <label className="flex min-h-[28rem] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center transition-all hover:border-emerald-300 hover:bg-emerald-50">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                    <ImageIcon size={54} className="mb-4 text-slate-300" />
                    <span className="text-sm font-black uppercase tracking-[0.3em] text-slate-500">Pilih atau Upload Foto</span>
                    <span className="mt-3 max-w-md text-sm font-medium text-slate-400">Klik area ini untuk memilih foto. Setelah itu gambar akan dipotong dulu supaya tampilan galeri rapi.</span>
                  </label>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      <img src={croppedImageUrl} alt="Preview galeri" className="max-h-[38rem] w-full object-contain" />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:border-emerald-300 hover:text-emerald-700">
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                        <Upload size={16} />
                        Ganti Foto
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (croppedImageUrl) {
                            URL.revokeObjectURL(croppedImageUrl);
                          }
                          setTempImage(null);
                          setCroppedImage(null);
                          setCroppedImageUrl(null);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-rose-600 transition-all hover:bg-rose-100"
                      >
                        <X size={16} />
                        Hapus Preview
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Keterangan</p>
                <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-slate-900">Detail Foto</h2>
              </div>

              <div className="space-y-5 p-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Judul Foto</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="Contoh: Santri mengikuti kajian ba'da Maghrib"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kategori</label>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {CATEGORIES.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, category }))}
                        className={`rounded-xl border px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${form.category === category ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-200'}`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
              <div className="border-b border-emerald-100 px-6 py-5">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">Upload Massal</p>
                <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-slate-900">Tambahkan Banyak Foto Sekaligus</h2>
              </div>

              <div className="space-y-5 p-6">
                <p className="text-sm font-medium text-slate-500">Gunakan pengaturan album di sidebar kanan, lalu pilih banyak file. Judul tiap foto otomatis diambil dari nama file.</p>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-200 bg-white px-6 py-10 text-center transition-all hover:border-emerald-400">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleBulkSelect} />
                  <Images size={32} className="text-emerald-500" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">Pilih Banyak Foto</span>
                  <span className="text-sm text-slate-500">{bulkFiles.length > 0 ? `${bulkFiles.length} file dipilih` : 'Belum ada file dipilih'}</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleBulkUpload}
                    disabled={isBulkSubmitting || bulkFiles.length === 0}
                    className="inline-flex items-center gap-3 rounded-xl bg-emerald-600 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-emerald-200 transition-all hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isBulkSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {isBulkSubmitting ? 'Mengunggah...' : `Upload ${bulkFiles.length || ''} Foto`}
                  </button>
                  <button
                    type="button"
                    onClick={resetBulkForm}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:bg-slate-50"
                  >
                    Reset File
                  </button>
                </div>
              </div>
            </section>
          </form>

          <aside className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Publikasi</p>
              </div>
              <div className="space-y-4 p-5">
                <button
                  type="submit"
                  form="gallery-single-upload-form"
                  disabled={isSubmitting || !croppedImage}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-slate-900 px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Foto'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetSingleForm();
                    router.push('/admin/gallery');
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 transition-all hover:bg-slate-50"
                >
                  Batal
                </button>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Album</p>
              </div>
              <div className="space-y-5 p-5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAlbumMode('new');
                      setSelectedAlbumSlug('');
                      setForm((prev) => ({ ...prev, album_name: '', event_date: '', is_album_cover: false }));
                    }}
                    className={`rounded-xl border px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${albumMode === 'new' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-500'}`}
                  >
                    Album Baru
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAlbumMode('existing');
                      if (albumSummaries[0]) {
                        applyAlbumSelection(albumSummaries[0].slug);
                      }
                    }}
                    className={`rounded-xl border px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${albumMode === 'existing' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-500'}`}
                  >
                    Album Lama
                  </button>
                </div>

                {albumMode === 'existing' && albumSummaries.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pilih Album</label>
                    <select
                      value={selectedAlbumSlug}
                      onChange={(e) => applyAlbumSelection(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    >
                      <option value="">Pilih album...</option>
                      {albumSummaries.map((album) => (
                        <option key={album.slug} value={album.slug}>
                          {album.name} - {album.count} foto
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Album / Kegiatan</label>
                  <input
                    value={form.album_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, album_name: e.target.value }))}
                    disabled={albumMode === 'existing'}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-70"
                    placeholder="Contoh: Dauroh Ramadhan 2026"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal Kegiatan</label>
                  <div className="relative">
                    <Calendar size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={form.event_date}
                      onChange={(e) => setForm((prev) => ({ ...prev, event_date: e.target.value }))}
                      disabled={albumMode === 'existing'}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-70"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, is_album_cover: !prev.is_album_cover }))}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-4 text-left transition-all ${form.is_album_cover ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'}`}
                >
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Cover Album</p>
                    <p className="mt-1 text-xs font-medium">{form.is_album_cover ? 'Foto ini akan jadi cover album.' : 'Aktifkan jika foto ini ingin dipakai sebagai cover.'}</p>
                  </div>
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${form.is_album_cover ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Check size={14} />
                  </span>
                </button>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Ringkasan</p>
              </div>
              <div className="space-y-4 p-5 text-sm">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Album Aktif</p>
                  <p className="mt-2 font-black uppercase tracking-tight text-slate-900">{form.album_name || 'Belum dipilih'}</p>
                  {selectedAlbum && albumMode === 'existing' && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-200">
                        <img src={resolveDisplayImageUrl(selectedAlbum.cover)} alt={selectedAlbum.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="text-xs font-medium text-slate-500">
                        <p className="font-bold text-slate-700">{selectedAlbum.count} foto</p>
                        <p>{selectedAlbum.eventDate || 'Tanggal belum diisi'}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Petunjuk Cepat</p>
                  <ul className="mt-3 space-y-2 text-xs font-medium text-slate-500">
                    <li>Upload satu foto: pilih media di kiri lalu isi pengaturan di kanan.</li>
                    <li>Upload massal: atur album dulu, lalu pilih banyak file.</li>
                    <li>Album lama: nama dan tanggal mengikuti album yang dipilih.</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-dashed border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <FolderOpen size={18} className="text-emerald-600" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Total Album</p>
                      <p className="mt-1 text-sm font-bold text-slate-700">{albumSummaries.length} album tersedia</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      <ImageCropperModal
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        imageSrc={tempImage || ''}
        onCropComplete={handleCropComplete}
        aspectRatio={4 / 5}
      />
    </>
  );
}
