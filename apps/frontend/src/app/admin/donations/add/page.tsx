'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { addCampaign, uploadImage } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { DollarSign, Calendar, Image as ImageIcon, Loader2, ArrowLeft, Save, Send } from 'lucide-react';
import GallerySelectionModal from '@/components/GallerySelectionModal';
import Link from 'next/link';

export default function AddDonationCampaignPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_amount: 0,
    image_url: '',
    is_active: 1,
    end_date: ''
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
       showToast('error', 'Judul kampanye tidak boleh kosong!');
       return;
    }
    const res = await addCampaign({
      ...formData,
      target_amount: Number(formData.target_amount),
      end_date: formData.end_date || null
    });
    
    if (res.success) {
      showToast('success', 'Kampanye donasi berhasil dibuat!');
      router.push('/admin/donations');
    } else {
      showToast('error', 'Gagal membuat kampanye.');
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = async () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_DIMENSION = 1000;
        
        if (width > height && width > MAX_DIMENSION) {
          height *= MAX_DIMENSION / width;
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width *= MAX_DIMENSION / height;
          height = MAX_DIMENSION;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Canvas tidak didukung");
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(async (blob) => {
           if (!blob) throw new Error("Gagal konversi WebP");
           const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' });
           
           const upRes = await uploadImage(webpFile);
           if (upRes.success) {
             setFormData(prev => ({ ...prev, image_url: upRes.url }));
             showToast('success', 'Gambar kampanye diunggah berformat WebP!');
           } else {
             showToast('error', 'Gagal mengunggah gambar kampanye.');
           }
           setIsUploading(false);
        }, 'image/webp', 0.85); 
      };
      img.src = objectUrl;
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal mengompres gambar.');
      setIsUploading(false);
    }
  };

  const handleGallerySelect = (url: string) => {
    setFormData(prev => ({ ...prev, image_url: url }));
    setIsGalleryOpen(false);
    showToast('success', 'Poster kampanye dipilih dari galeri!');
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
         <Link href="/admin/donations" className="flex items-center gap-2 text-slate-500 hover:text-emerald-700 transition-colors font-bold uppercase tracking-widest text-xs">
            <ArrowLeft size={16} /> Kembali ke Sistem Donasi
         </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight">Buat Kampanye Baru</h1>
      </div>

      <form onSubmit={handleAddSubmit} className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
           
           {/* KOLOM UTAMA (KIRI - 70%) */}
           <div className="lg:col-span-2 space-y-8">
              
              {/* Title Input WP Style */}
              <div className="bg-white border text-transparent border-slate-200 rounded-2xl shadow-sm overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all">
                <input 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-8 py-6 bg-white border-none focus:ring-0 font-black text-3xl text-slate-900 placeholder-slate-300 outline-none"
                  placeholder="Tambahkan judul kampanye..."
                />
              </div>

              {/* Content Textarea WP Style */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all min-h-[400px]">
                <div className="h-12 border-b border-slate-100 bg-slate-50 flex items-center px-4 gap-2">
                   <div className="text-xs font-bold text-slate-400 px-2 uppercase tracking-widest cursor-default">Deskripsi Detail Kampanye</div>
                </div>
                <textarea 
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full flex-1 p-8 bg-white border-none outline-none resize-y font-medium text-slate-800 text-lg leading-relaxed placeholder-slate-300"
                  placeholder="Ceritakan tujuan dan rincian alokasi dana secara komprehensif di sini..."
                />
              </div>
           </div>

           {/* KOLOM SIDEBAR (KANAN - 30%) - Meta Boxes */}
           <div className="lg:col-span-1 space-y-6">
              
              {/* META BOX 1: Publish Box */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                 <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800 text-sm">Terbitkan Kampanye</h3>
                 </div>
                 <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                       <span className="flex items-center gap-2"><Save size={16} className="text-slate-400"/> Status:</span>
                       <span className="font-bold">Baru</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                       <span className="flex items-center gap-2"><ImageIcon size={16} className="text-slate-400"/> Tipe:</span>
                       <span className="font-bold text-emerald-600">Terbuka (Publik)</span>
                    </div>
                 </div>
                 <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                    <Link href="/admin/donations" className="text-sm font-bold text-rose-600 hover:text-rose-700 hover:underline px-2">
                       Batal
                    </Link>
                    <button 
                      type="submit"
                      disabled={isUploading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                    >
                      <Send size={16} />
                      Sebarkan
                    </button>
                 </div>
              </div>

              {/* META BOX 2: Target & Waktu */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                 <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800 text-sm">Target & Waktu</h3>
                 </div>
                 <div className="p-5 space-y-5">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Target Dana (Rp)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          required
                          type="number"
                          value={formData.target_amount || ''}
                          onChange={(e) => setFormData({...formData, target_amount: Number(e.target.value)})}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-sm text-slate-800 outline-none"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Tenggat Waktu</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-sm text-slate-800 outline-none"
                        />
                      </div>
                    </div>
                 </div>
              </div>

              {/* META BOX 3: Poster Gambar */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                 <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800 text-sm">Poster Kampanye</h3>
                    <button 
                      type="button"
                      onClick={() => setIsGalleryOpen(true)}
                      className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <ImageIcon size={12} /> Galeri
                    </button>
                 </div>
                 <div className="p-5 flex-1 flex flex-col">
                    <div 
                      className={`w-full flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center relative overflow-hidden transition-all min-h-[14rem] bg-slate-50 hover:bg-slate-100 ${
                        formData.image_url ? 'border-emerald-300' : 'border-slate-300'
                      }`}
                      onClick={() => !isUploading && fileInputRef.current?.click()}
                      style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}
                    >
                      {formData.image_url && !isUploading ? (
                        <>
                          <img src={formData.image_url} className="w-full h-full object-cover relative z-0" alt="Preview" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-sm z-10">
                            <span className="text-white font-bold text-xs bg-black/50 px-3 py-1 rounded">Klik area ini untuk ubah</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 p-6 text-slate-400 text-center">
                          {isUploading ? (
                             <Loader2 size={32} className="animate-spin text-emerald-500 mb-2" />
                          ) : (
                             <ImageIcon size={32} className="text-slate-300 mb-2" />
                          )}
                          <span className="text-xs font-medium px-2">
                             {isUploading ? 'Generasi WebP...' : 'Lampirkan Jpg/Png'}
                          </span>
                        </div>
                      )}
                    </div>
                    <input type="hidden" value={formData.image_url} required />
                    <input 
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/jpeg, image/png, image/webp"
                      onChange={handleImageSelect}
                    />
                 </div>
              </div>

           </div>
        </div>
      </form>

      <GallerySelectionModal 
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelect={handleGallerySelect}
      />
    </>
  );
}
