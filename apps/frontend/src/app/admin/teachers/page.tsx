'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getTeachers, deleteTeacher, updateTeacher, addTeacher, uploadImage, Teacher, normalizeApiAssetUrl, resolveDisplayImageUrl } from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import ImageCropperModal from '@/components/ImageCropperModal';
import GallerySelectionModal from '@/components/GallerySelectionModal';
import { useToast } from '@/components/Toast';
import { UserPlus, Mail, Phone, Trash2, Pencil, Users, Search, X, Save, Upload, BookOpen, Quote, Image as ImageIcon } from 'lucide-react';

export default function TeachersAdminPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  
  // Data states
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form states
  const [form, setForm] = useState<Omit<Teacher, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    subject: '',
    bio: '',
    image_url: '',
    email: '',
    whatsapp: ''
  });
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<Blob | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);

  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fetchTeachers = useCallback(async (search = searchQuery) => {
    setIsLoading(true);
    const data = await getTeachers(search);
    setTeachers(data);
    setIsLoading(false);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeachers(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchTeachers]);

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsDeleting(true);
    try {
      const res = await deleteTeacher(selectedId);
      if (res.success) {
        showToast('success', 'Data guru berhasil dihapus.');
        fetchTeachers();
        setIsDeleteOpen(false);
      } else {
        showToast('error', 'Gagal menghapus data.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
      showToast('error', message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenForm = (teacher?: Teacher) => {
    if (teacher) {
        setIsEditing(true);
        setSelectedId(teacher.id);
        setForm({
            name: teacher.name,
            subject: teacher.subject,
            bio: teacher.bio,
            image_url: teacher.image_url,
            email: teacher.email || '',
            whatsapp: teacher.whatsapp || ''
        });
        setCroppedImageUrl(resolveDisplayImageUrl(teacher.image_url));
        setCroppedImage(null);
    } else {
        setIsEditing(false);
        setSelectedId(null);
        setForm({
            name: '',
            subject: '',
            bio: '',
            image_url: '',
            email: '',
            whatsapp: ''
        });
        setCroppedImageUrl(null);
        setCroppedImage(null);
    }
    setIsFormOpen(true);
  };

  useEffect(() => {
    if (searchParams.get('mode') === 'create') {
      handleOpenForm();
      router.replace(pathname);
    }
  }, [searchParams, router, pathname]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTempImage(reader.result as string);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (blob: Blob) => {
    setCroppedImage(blob);
    setCroppedImageUrl(URL.createObjectURL(blob));
    setIsCropperOpen(false);
  };

  const handleGallerySelect = (url: string) => {
    const normalizedUrl = normalizeApiAssetUrl(url);
    setForm(prev => ({ ...prev, image_url: normalizedUrl }));
    setCroppedImageUrl(normalizedUrl);
    setCroppedImage(null); // Clear pending crop if gallery is selected
    setIsGalleryOpen(false);
    showToast('success', 'Foto profil ustadz dipilih dari galeri!');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.subject) {
      showToast('error', 'Nama dan jabatan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl = normalizeApiAssetUrl(form.image_url);
      
      if (croppedImage) {
        const uploadRes = await uploadImage(new File([croppedImage], 'teacher.jpg', { type: 'image/jpeg' }));
        if (!uploadRes.url) throw new Error('Gagal upload gambar');
        finalImageUrl = normalizeApiAssetUrl(uploadRes.url);
      }

      if (isEditing && selectedId) {
        const res = await updateTeacher(selectedId, { ...form, image_url: finalImageUrl });
        if (res.success) {
          showToast('success', 'Data guru berhasil diperbarui.');
          setIsFormOpen(false);
          fetchTeachers();
        } else {
          showToast('error', 'Gagal memperbarui data.');
        }
      } else {
        const res = await addTeacher({ ...form, image_url: finalImageUrl });
        if (res.success) {
          showToast('success', 'Ustadz baru berhasil ditambahkan.');
          setIsFormOpen(false);
          fetchTeachers();
        } else {
          showToast('error', 'Gagal menambahkan data.');
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
          <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight">SDM & Staf Pengajar</h1>
          <p className="text-slate-500 text-sm font-medium">Kelola profil ustadz dan ustadzah yang berkhidmah di Darussunnah.</p>
        </div>
        <button 
          onClick={() => router.push('/admin/teachers/form')}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
        >
          <UserPlus size={20} />
          <span>Tambah Pengajar</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-5 mb-10">
         <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama atau pelajaran..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm"
            />
         </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {!isLoading ? (
          teachers.length > 0 ? (
            teachers.map((teacher) => (
              <div key={teacher.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-500 flex flex-col h-full">
                 <div className="h-64 bg-slate-50 relative overflow-hidden shrink-0">
                    {teacher.image_url ? (
                      <img 
                        src={resolveDisplayImageUrl(teacher.image_url)} 
                        alt={teacher.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200 font-black text-6xl bg-gradient-to-br from-slate-50 to-slate-100 uppercase">
                         {teacher.name.charAt(0)}
                      </div>
                    )}
                    <div className="absolute top-4 right-4 translate-x-12 group-hover:translate-x-0 transition-transform duration-500 flex flex-col gap-2">
                      <button 
                        onClick={() => router.push(`/admin/teachers/form?id=${teacher.id}`)}
                        className="p-2.5 bg-white/90 text-slate-400 hover:text-emerald-600 rounded-xl backdrop-blur-md shadow-lg transition-all"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => { setSelectedId(teacher.id); setIsDeleteOpen(true); }}
                        className="p-2.5 bg-white/90 text-slate-400 hover:text-rose-500 rounded-xl backdrop-blur-md shadow-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="absolute bottom-4 left-4">
                       <span className="px-4 py-1.5 bg-emerald-900/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-lg">
                          {teacher.subject}
                       </span>
                    </div>
                 </div>
                 
                 <div className="p-8 flex-1 flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight uppercase mb-1">{teacher.name}</h3>
                      <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                         Staf Pengajar
                      </div>
                    </div>

                    <div className="relative mb-8 flex-1">
                       <Quote className="absolute -left-2 -top-2 text-slate-100 fill-slate-50" size={32} />
                       <p className="text-slate-400 text-xs italic font-medium line-clamp-4 leading-relaxed relative z-10 pt-2 pl-4">
                         {teacher.bio || 'Pengabdian ilmu tanpa batas di Darussunnah.'}
                       </p>
                    </div>

                    <div className="flex gap-3 mt-auto">
                       <button 
                         onClick={() => teacher.email && window.open(`mailto:${teacher.email}`, '_blank')}
                         disabled={!teacher.email}
                         className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                           teacher.email 
                            ? 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border-slate-100 hover:border-emerald-100' 
                            : 'bg-slate-50 text-slate-300 border-slate-50 cursor-not-allowed'
                         }`}
                       >
                          <Mail size={14} />
                          Email
                       </button>
                       <button 
                         onClick={() => teacher.whatsapp && window.open(`https://wa.me/${teacher.whatsapp}`, '_blank')}
                         disabled={!teacher.whatsapp}
                         className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                           teacher.whatsapp 
                            ? 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border-slate-100 hover:border-emerald-100' 
                            : 'bg-slate-50 text-slate-300 border-slate-50 cursor-not-allowed'
                         }`}
                       >
                          <Phone size={14} />
                          WhatsApp
                       </button>
                    </div>
                 </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-xl p-24 border-2 border-slate-100 border-dashed text-center">
               <div className="w-24 h-24 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                 <Users className="text-slate-200" size={48} />
               </div>
               <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Khadimul Ilmi Kosong</h3>
               <p className="text-slate-400 max-w-sm mx-auto font-medium">Daftar ustadz yang berkhidmah di Darussunnah akan tampil di sini setelah ditambahkan.</p>
            </div>
          )
        ) : (
          <div className="col-span-full py-20 text-center uppercase font-black text-slate-300 tracking-[0.3em] animate-pulse">
             Sinkronisasi Data Pengajar...
          </div>
        )}
      </div>

      {/* Form Modal (Add/Edit) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl relative overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 max-h-[90vh]">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <UserPlus size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-outfit">
                    {isEditing ? 'Edit Profil Guru' : 'Tambah Guru Baru'}
                  </h3>
                </div>
                <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X /></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-8">
               <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Photo upload column */}
                    <div className="md:col-span-1">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Foto Profil</label>
                        <button 
                          type="button"
                          onClick={() => setIsGalleryOpen(true)}
                          className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                        >
                          <ImageIcon size={12} /> Galeri
                        </button>
                      </div>
                      <div className="relative group mx-auto w-32 h-32 md:w-full md:h-auto md:aspect-square">
                        <div className={`w-full h-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all relative ${
                          croppedImageUrl ? 'border-emerald-300' : 'border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer'
                        }`}>
                          {croppedImageUrl ? (
                            <img src={croppedImageUrl} className="w-full h-full object-cover" />
                          ) : (
                            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                              <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                              <Upload size={32} className="text-slate-200 mb-2" />
                              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest text-center px-4">Pilih Foto</span>
                            </label>
                          )}
                          
                          {croppedImageUrl && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                               <label className="p-2.5 bg-white text-slate-900 rounded-xl cursor-pointer">
                                  <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                                  <Upload size={16} />
                               </label>
                               <button 
                                 type="button"
                                 onClick={() => { setCroppedImage(null); setCroppedImageUrl(null); }}
                                 className="p-2.5 bg-rose-500 text-white rounded-xl"
                               >
                                 <X size={16} />
                               </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Basic info column */}
                    <div className="md:col-span-2 space-y-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nama Lengkap & Gelar</label>
                          <input 
                            type="text"
                            required
                            placeholder="Contoh: Dr. KH. Ahmad Syarifuddin, MA"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Bidang Studi / Jabatan</label>
                          <div className="relative group">
                            <BookOpen className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors" size={18} />
                            <input 
                              type="text"
                              required
                              placeholder="Contoh: Ushul Fiqih / Kepala Madrasah"
                              value={form.subject}
                              onChange={(e) => setForm({ ...form, subject: e.target.value })}
                              className="w-full pl-14 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Email (Opsional)</label>
                            <div className="relative group">
                              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors" size={16} />
                              <input 
                                type="email"
                                placeholder="ustadz@gmail.com"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full pl-14 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">WhatsApp (Opsional)</label>
                            <div className="relative group">
                              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors" size={16} />
                              <input 
                                type="text"
                                placeholder="08123456789"
                                value={form.whatsapp}
                                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                                className="w-full pl-14 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-sm"
                              />
                            </div>
                          </div>
                        </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Riwayat Hidup & Bio</label>
                    <textarea 
                      rows={5}
                      placeholder="Tuliskan sedikit profil, riwayat pendidikan, atau pesan hikmah dari beliau..."
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-sm leading-relaxed"
                    />
                  </div>

                  <div className="flex gap-4 pt-4 shrink-0">
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
                       {isSubmitting ? 'Memproses...' : (
                          <>
                            <Save size={18} />
                            Simpan Profil
                          </>
                       )}
                    </button>
                  </div>
               </form>
             </div>
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      <ImageCropperModal 
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        imageSrc={tempImage || ''}
        onCropComplete={handleCropComplete}
        aspectRatio={1} // Square for profile pics
      />

      {/* Delete Dialog */}
      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Hapus Profil Guru?"
        message="Data pengajar ini akan dihapus permanen dari sistem Darussunnah."
        confirmText="Hapus Permanen"
      />

      <GallerySelectionModal 
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelect={handleGallerySelect}
      />
    </>
  );
}
