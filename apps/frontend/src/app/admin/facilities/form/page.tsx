'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { addFacility, Facility, getFacilities, normalizeApiAssetUrl, resolveDisplayImageUrl, updateFacility, uploadImage } from '@/lib/api';
import { ArrowLeft, Building, Image as ImageIcon, Loader2, Save, Star, Upload, X } from 'lucide-react';
import { useToast } from '@/components/Toast';
import ImageCropperModal from '@/components/ImageCropperModal';
import GallerySelectionModal from '@/components/GallerySelectionModal';

const CATEGORIES = ['Umum', 'Asrama', 'Kelas', 'Ibadah', 'Olahraga', 'Kesehatan'];

function createInitialForm(): Omit<Facility, 'id'> {
  return { name: '', description: '', image_url: '', category: 'Umum', is_highlight: false };
}

export default function FacilityFormPage() {
  return (
    <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>}>
      <FacilityFormContent />
    </Suspense>
  );
}

function FacilityFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { showToast } = useToast();

  const [form, setForm] = useState<Omit<Facility, 'id'>>(createInitialForm());
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<Blob | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadFacility = async () => {
      const items = await getFacilities({});
      const current = items.find((item) => String(item.id) === id);
      if (!current) {
        showToast('error', 'Fasilitas tidak ditemukan.');
        router.push('/admin/facilities');
        return;
      }
      setForm({
        name: current.name,
        description: current.description,
        image_url: current.image_url,
        category: current.category || 'Umum',
        is_highlight: current.is_highlight,
      });
      setCroppedImageUrl(resolveDisplayImageUrl(current.image_url));
      setIsLoading(false);
    };
    loadFacility();
  }, [id, router, showToast]);

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
    setCroppedImage(blob);
    setCroppedImageUrl(URL.createObjectURL(blob));
    setIsCropperOpen(false);
  };

  const handleGallerySelect = (url: string) => {
    const normalizedUrl = normalizeApiAssetUrl(url);
    setForm((prev) => ({ ...prev, image_url: normalizedUrl }));
    setCroppedImageUrl(normalizedUrl);
    setCroppedImage(null);
    setIsGalleryOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.description) {
      showToast('error', 'Nama dan deskripsi wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      let finalImageUrl = normalizeApiAssetUrl(form.image_url);
      if (croppedImage) {
        const uploadRes = await uploadImage(new File([croppedImage], 'facility.jpg', { type: 'image/jpeg' }));
        if (!uploadRes.url) throw new Error('Gagal upload gambar');
        finalImageUrl = normalizeApiAssetUrl(uploadRes.url);
      }

      if (!id && !finalImageUrl) {
        showToast('error', 'Foto fasilitas wajib diunggah.');
        setIsSaving(false);
        return;
      }

      if (id) {
        const res = await updateFacility(Number(id), { ...form, image_url: finalImageUrl } as Facility);
        if (res.success) {
          showToast('success', 'Fasilitas berhasil diperbarui.');
          router.push('/admin/facilities');
        } else {
          showToast('error', 'Gagal memperbarui fasilitas.');
        }
      } else {
        const res = await addFacility({ ...form, image_url: finalImageUrl });
        if (res.success) {
          showToast('success', 'Fasilitas berhasil ditambahkan.');
          router.push('/admin/facilities');
        } else {
          showToast('error', 'Gagal menambahkan fasilitas.');
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
    <>
      <div className="mx-auto max-w-5xl pb-20">
        <div className="mb-10 flex items-center gap-4">
          <button type="button" onClick={() => router.push('/admin/facilities')} className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-emerald-200 hover:text-emerald-600">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Form Fasilitas</p>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 font-outfit">{id ? 'Edit Fasilitas' : 'Tambah Fasilitas'}</h1>
            <p className="text-sm font-medium text-slate-500">Form fasilitas kini tampil penuh agar lebih enak dipreview sebelum disimpan.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
              <div>
                <div className="mb-3 flex items-center justify-between px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Foto Fasilitas</label>
                  <button type="button" onClick={() => setIsGalleryOpen(true)} className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:underline">
                    <ImageIcon size={12} /> Galeri
                  </button>
                </div>
                {!croppedImageUrl ? (
                  <label className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-emerald-300 hover:bg-emerald-50">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                    <Upload size={32} className="mb-2 text-slate-300" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unggah Foto</span>
                  </label>
                ) : (
                  <div className="relative aspect-video overflow-hidden rounded-xl border border-slate-200">
                    <img src={croppedImageUrl} alt="Preview fasilitas" className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
                      <label className="rounded-xl bg-white p-2.5 text-slate-900 shadow-sm cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                        <Upload size={16} />
                      </label>
                      <button type="button" onClick={() => { setCroppedImage(null); setCroppedImageUrl(null); setForm((prev) => ({ ...prev, image_url: '' })); }} className="rounded-xl bg-rose-500 p-2.5 text-white shadow-sm">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><Building size={12} /> Nama Fasilitas</label>
                  <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="Masjid Jami' Darussunnah" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deskripsi</label>
                  <textarea rows={5} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-medium leading-relaxed text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="Jelaskan fasilitas dan keunggulannya..." />
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kategori</label>
                    <select value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10">
                      {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button type="button" onClick={() => setForm((prev) => ({ ...prev, is_highlight: !prev.is_highlight }))} className={`flex w-full items-center gap-3 rounded-xl border px-6 py-4 text-xs font-black uppercase tracking-widest transition-all ${form.is_highlight ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                      <Star size={16} className={form.is_highlight ? 'fill-amber-500' : ''} />
                      Highlight Beranda
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-8 flex justify-end gap-4">
            <button type="button" onClick={() => router.push('/admin/facilities')} className="rounded-lg border border-slate-200 bg-white px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50">Batal</button>
            <button type="submit" disabled={isSaving} className="flex items-center gap-3 rounded-lg bg-slate-900 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-emerald-600 disabled:opacity-50">
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Simpan Fasilitas
            </button>
          </div>
        </form>
      </div>

      <ImageCropperModal isOpen={isCropperOpen} onClose={() => setIsCropperOpen(false)} imageSrc={tempImage || ''} onCropComplete={handleCropComplete} aspectRatio={16/9} />
      <GallerySelectionModal isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} onSelect={handleGallerySelect} />
    </>
  );
}
