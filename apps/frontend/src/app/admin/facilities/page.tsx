'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getFacilities, deleteFacility, updateFacility, addFacility, uploadImage, Facility, normalizeApiAssetUrl, resolveDisplayImageUrl } from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import ImageCropperModal from '@/components/ImageCropperModal';
import GallerySelectionModal from '@/components/GallerySelectionModal';
import { useToast } from '@/components/Toast';
import { Plus, Trash2, Building, Star, Image as ImageIcon, Search, X, Save, Pencil, Upload } from 'lucide-react';

const CATEGORIES = ['Umum', 'Asrama', 'Kelas', 'Ibadah', 'Olahraga', 'Kesehatan'];

export default function FacilitiesAdminPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  
  // Data states
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  
  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Omit<Facility, 'id'>>({
    name: '',
    description: '',
    image_url: '',
    category: 'Umum',
    is_highlight: false
  });
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<Blob | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);

  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fetchFacilities = useCallback(async (search = searchQuery, category = selectedCategory) => {
    setIsLoading(true);
    const catParam = category === 'Semua' ? undefined : category;
    const data = await getFacilities({ search: search || undefined, category: catParam });
    setFacilities(data);
    setIsLoading(false);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFacilities(searchQuery, selectedCategory);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, fetchFacilities]);

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsDeleting(true);
    try {
      await deleteFacility(selectedId);
      showToast('success', 'Fasilitas berhasil dihapus.');
      fetchFacilities();
      setIsDeleteOpen(false);
    } catch {
      showToast('error', 'Gagal menghapus fasilitas.');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleHighlight = async (facility: Facility) => {
    try {
      await updateFacility(facility.id, { ...facility, is_highlight: !facility.is_highlight });
      setFacilities(prev => prev.map(f => f.id === facility.id ? { ...f, is_highlight: !f.is_highlight } : f));
      showToast('success', facility.is_highlight ? 'Highlight dihapus' : 'Berhasil dijadikan highlight');
    } catch {
      showToast('error', 'Gagal update status highlight.');
    }
  };

  const handleOpenForm = (fac?: Facility) => {
    if (fac) {
        setIsEditing(true);
        setSelectedId(fac.id);
        setForm({
            name: fac.name,
            description: fac.description,
            image_url: fac.image_url,
            category: fac.category || 'Umum',
            is_highlight: fac.is_highlight
        });
        setCroppedImageUrl(resolveDisplayImageUrl(fac.image_url));
        setCroppedImage(null);
    } else {
        setIsEditing(false);
        setSelectedId(null);
        setForm({
            name: '',
            description: '',
            image_url: '',
            category: 'Umum',
            is_highlight: false
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
    setCroppedImage(null);
    setIsGalleryOpen(false);
    showToast('success', 'Foto fasilitas dipilih dari galeri!');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description) {
      showToast('error', 'Nama dan deskripsi wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl = normalizeApiAssetUrl(form.image_url);
      
      // Upload image if newly cropped
      if (croppedImage) {
        const uploadRes = await uploadImage(new File([croppedImage], 'facility.jpg', { type: 'image/jpeg' }));
        if (!uploadRes.url) throw new Error('Gagal upload gambar');
        finalImageUrl = normalizeApiAssetUrl(uploadRes.url);
      }

      if (isEditing && selectedId) {
        const res = await updateFacility(selectedId, { ...form, image_url: finalImageUrl } as Facility);
        if (res.success) {
          showToast('success', 'Fasilitas berhasil diperbarui.');
          setIsFormOpen(false);
          fetchFacilities();
        } else {
          showToast('error', 'Gagal memperbarui fasilitas.');
        }
      } else {
        if (!finalImageUrl) {
            showToast('error', 'Foto fasilitas wajib diunggah.');
            setIsSubmitting(false);
            return;
        }
        const res = await addFacility({ ...form, image_url: finalImageUrl });
        if (res.success) {
          showToast('success', 'Fasilitas baru berhasil ditambahkan.');
          setIsFormOpen(false);
          fetchFacilities();
        } else {
          showToast('error', 'Gagal menambahkan fasilitas.');
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
          <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight">Fasilitas Pondok</h1>
          <p className="text-slate-500 text-sm font-medium">Kelola sarana dan prasarana pendukung pendidikan di Darussunnah.</p>
        </div>
        <button 
          onClick={() => router.push('/admin/facilities/form')}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-lg font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
        >
          <Plus size={20} />
          <span>Tambah Fasilitas</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-5 mb-10">
         <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama fasilitas..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm"
            />
         </div>
         <div className="flex gap-2 scrollbar-hide overflow-x-auto whitespace-nowrap bg-slate-50 p-2 rounded-xl border border-slate-100">
            {['Semua', ...CATEGORIES].map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedCategory === cat 
                    ? 'bg-white text-emerald-900 shadow-md border border-slate-100' 
                    : 'text-slate-400 hover:text-emerald-700'
                }`}
              >
                {cat}
              </button>
            ))}
         </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-10">
        {!isLoading ? (
          facilities.length > 0 ? (
            facilities.map((fac) => (
              <div key={fac.id} className={`bg-white rounded-xl border ${fac.is_highlight ? 'border-amber-300 ring-2 ring-amber-100 shadow-amber-900/10' : 'border-slate-200'} shadow-sm overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-500 group relative`}>
                <div className="h-56 relative overflow-hidden bg-slate-50">
                  {fac.image_url ? (
                    <img src={resolveDisplayImageUrl(fac.image_url)} alt={fac.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                      <Building size={48} />
                    </div>
                  )}
                  
                  <div className="absolute top-4 right-4 flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-500">
                    <button 
                      onClick={() => toggleHighlight(fac)}
                      className={`p-2.5 rounded-lg backdrop-blur-md shadow-lg transition-all ${fac.is_highlight ? 'bg-amber-400 text-white' : 'bg-white/80 text-slate-400 hover:text-amber-500'}`}
                    >
                      <Star size={18} className={fac.is_highlight ? "fill-white" : ""} />
                    </button>
                    <button 
                      onClick={() => router.push(`/admin/facilities/form?id=${fac.id}`)}
                      className="p-2.5 bg-white/80 text-slate-400 hover:text-emerald-600 rounded-lg backdrop-blur-md shadow-lg transition-all"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => { setSelectedId(fac.id); setIsDeleteOpen(true); }}
                      className="p-2.5 bg-white/80 text-slate-400 hover:text-rose-500 rounded-lg backdrop-blur-md shadow-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="absolute bottom-4 left-4">
                     <span className="px-4 py-1.5 bg-emerald-900/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-md">
                        {fac.category || 'Umum'}
                     </span>
                  </div>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="font-black text-slate-900 text-xl leading-tight mb-4 uppercase tracking-tight">{fac.name}</h3>
                  <p className="text-xs text-slate-400 font-medium line-clamp-3 leading-relaxed flex-1 italic">
                    &quot;{fac.description}&quot;
                  </p>
                  {fac.is_highlight && (
                     <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        Unggulan Beranda
                     </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-xl p-24 text-center border-2 border-dashed border-slate-100">
               <div className="w-24 h-24 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-8 text-slate-200 shadow-inner">
                 <Building size={48} />
               </div>
               <h3 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight">Data Kosong</h3>
               <p className="text-slate-400 max-w-sm mx-auto font-medium">Foto sarana dan prasarana pondok akan muncul di sini setelah ditambahkan.</p>
            </div>
          )
        ) : (
          <div className="col-span-full py-20 text-center uppercase font-black text-slate-300 tracking-[0.3em] animate-pulse">
             Sinkronisasi Fasilitas...
          </div>
        )}
      </div>

      {/* Form Modal (Add/Edit) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>
          <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl relative overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <Building size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-outfit">
                    {isEditing ? 'Edit Fasilitas' : 'Tambah Fasilitas'}
                  </h3>
                </div>
                <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X /></button>
             </div>
             
             <form onSubmit={handleFormSubmit} className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Nama Fasilitas</label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: Masjid Jami' Darussunnah"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Deskripsi Singkat</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Jelaskan spesifikasi atau keunggulan fasilitas ini..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Kategori</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-sm appearance-none"
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                     <button 
                        type="button"
                        onClick={() => setForm({ ...form, is_highlight: !form.is_highlight })}
                        className={`flex items-center gap-3 px-6 py-4 rounded-xl border transition-all font-bold text-xs ${
                          form.is_highlight 
                            ? 'bg-amber-50 border-amber-200 text-amber-600' 
                            : 'bg-slate-50 border-slate-100 text-slate-400'
                        }`}
                     >
                        <Star size={16} className={form.is_highlight ? 'fill-amber-500' : ''} />
                        Highlight Beranda
                     </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Media Foto (4:3 / Landscape)</label>
                    <button 
                      type="button"
                      onClick={() => setIsGalleryOpen(true)}
                      className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                    >
                      <ImageIcon size={12} /> Galeri
                    </button>
                  </div>
                  {!croppedImageUrl ? (
                    <label className="block w-full h-40 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer group">
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 group-hover:text-emerald-500">
                         <Upload size={32} className="mb-2" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Unggah Foto</span>
                      </div>
                    </label>
                  ) : (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video max-h-48 mx-auto">
                       <img src={croppedImageUrl} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="p-3 bg-white text-slate-900 rounded-lg cursor-pointer">
                             <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                             <Upload size={18} />
                          </label>
                          <button 
                            type="button"
                            onClick={() => { setCroppedImage(null); setCroppedImageUrl(null); }}
                            className="p-3 bg-rose-500 text-white rounded-lg"
                          >
                            <X size={18} />
                          </button>
                       </div>
                    </div>
                  )}
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
                     {isSubmitting ? 'Memproses...' : (
                        <>
                          <Save size={18} />
                          Simpan Perubahan
                        </>
                     )}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      <ImageCropperModal 
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        imageSrc={tempImage || ''}
        onCropComplete={handleCropComplete}
        aspectRatio={16/9}
      />

      {/* Delete Dialog */}
      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Hapus Fasilitas?"
        message="Fasilitas dan fotonya akan dihapus permanen dari sistem."
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
