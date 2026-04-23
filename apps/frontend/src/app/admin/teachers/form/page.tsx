'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { addTeacher, getTeachers, normalizeApiAssetUrl, resolveDisplayImageUrl, Teacher, updateTeacher, uploadImage } from '@/lib/api';
import { ArrowLeft, BookOpen, Image as ImageIcon, Loader2, Save, Upload, UserPlus, X } from 'lucide-react';
import { useToast } from '@/components/Toast';
import ImageCropperModal from '@/components/ImageCropperModal';
import GallerySelectionModal from '@/components/GallerySelectionModal';

function createInitialForm(): Omit<Teacher, 'id'> {
  return { name: '', subject: '', bio: '', image_url: '', email: '', whatsapp: '' };
}

export default function TeacherFormPage() {
  return (
    <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>}>
      <TeacherFormContent />
    </Suspense>
  );
}

function TeacherFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { showToast } = useToast();

  const [form, setForm] = useState<Omit<Teacher, 'id'>>(createInitialForm());
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<Blob | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadTeacher = async () => {
      const teachers = await getTeachers('');
      const current = teachers.find((item) => String(item.id) === id);
      if (!current) {
        showToast('error', 'Data guru tidak ditemukan.');
        router.push('/admin/teachers');
        return;
      }
      setForm({ 
        name: current.name, 
        subject: current.subject, 
        bio: current.bio, 
        image_url: current.image_url,
        email: current.email || '',
        whatsapp: current.whatsapp || ''
      });
      setCroppedImageUrl(resolveDisplayImageUrl(current.image_url));
      setIsLoading(false);
    };
    loadTeacher();
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
    if (!form.name || !form.subject) {
      showToast('error', 'Nama dan bidang studi wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      let finalImageUrl = normalizeApiAssetUrl(form.image_url);
      if (croppedImage) {
        const uploadRes = await uploadImage(new File([croppedImage], 'teacher.jpg', { type: 'image/jpeg' }));
        if (!uploadRes.url) throw new Error('Gagal upload gambar');
        finalImageUrl = normalizeApiAssetUrl(uploadRes.url);
      }

      if (id) {
        const res = await updateTeacher(Number(id), { ...form, image_url: finalImageUrl });
        if (res.success) {
          showToast('success', 'Profil guru berhasil diperbarui.');
          router.push('/admin/teachers');
        } else {
          showToast('error', 'Gagal memperbarui profil guru.');
        }
      } else {
        const res = await addTeacher({ ...form, image_url: finalImageUrl });
        if (res.success) {
          showToast('success', 'Guru berhasil ditambahkan.');
          router.push('/admin/teachers');
        } else {
          showToast('error', 'Gagal menambahkan guru.');
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
          <button type="button" onClick={() => router.push('/admin/teachers')} className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-emerald-200 hover:text-emerald-600">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Form Pengajar</p>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 font-outfit">{id ? 'Edit Profil Guru' : 'Tambah Pengajar'}</h1>
            <p className="text-sm font-medium text-slate-500">Form pengajar sekarang tampil penuh seperti halaman tulis berita.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="md:col-span-1">
                <div className="mb-3 flex items-center justify-between px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Foto Profil</label>
                  <button type="button" onClick={() => setIsGalleryOpen(true)} className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:underline">
                    <ImageIcon size={12} /> Galeri
                  </button>
                </div>
                <div className="relative mx-auto aspect-square w-40 md:w-full">
                  <div className={`h-full w-full overflow-hidden rounded-xl border-2 border-dashed transition-all ${croppedImageUrl ? 'border-emerald-300' : 'border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50'}`}>
                    {croppedImageUrl ? (
                      <img src={croppedImageUrl} alt="Preview guru" className="h-full w-full object-cover" />
                    ) : (
                      <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center">
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                        <Upload size={32} className="mb-2 text-slate-300" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pilih Foto</span>
                      </label>
                    )}
                  </div>
                  {croppedImageUrl && (
                    <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
                      <label className="rounded-xl bg-white p-2.5 text-slate-900 shadow-sm cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                        <Upload size={16} />
                      </label>
                      <button type="button" onClick={() => { setCroppedImage(null); setCroppedImageUrl(null); setForm((prev) => ({ ...prev, image_url: '' })); }} className="rounded-xl bg-rose-500 p-2.5 text-white shadow-sm">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6 md:col-span-2">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Lengkap</label>
                  <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="Dr. KH. Ahmad Syarifuddin, MA" />
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><BookOpen size={12} /> Bidang Studi / Jabatan</label>
                  <input value={form.subject} onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="Ushul Fiqih / Kepala Madrasah" />
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email (Opsional)</label>
                    <input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="ustadz@gmail.com" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">WhatsApp (Opsional)</label>
                    <input type="text" value={form.whatsapp} onChange={(e) => setForm((prev) => ({ ...prev, whatsapp: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="08123456789" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bio Singkat</label>
                  <textarea rows={6} value={form.bio} onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-medium leading-relaxed text-slate-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="Tuliskan riwayat pendidikan atau profil singkat pengajar..." />
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-8 flex justify-end gap-4">
            <button type="button" onClick={() => router.push('/admin/teachers')} className="rounded-lg border border-slate-200 bg-white px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50">Batal</button>
            <button type="submit" disabled={isSaving} className="flex items-center gap-3 rounded-lg bg-slate-900 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-emerald-600 disabled:opacity-50">
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {id ? 'Simpan Profil' : 'Simpan Pengajar'}
            </button>
          </div>
        </form>
      </div>

      <ImageCropperModal isOpen={isCropperOpen} onClose={() => setIsCropperOpen(false)} imageSrc={tempImage || ''} onCropComplete={handleCropComplete} aspectRatio={1} />
      <GallerySelectionModal isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} onSelect={handleGallerySelect} />
    </>
  );
}
