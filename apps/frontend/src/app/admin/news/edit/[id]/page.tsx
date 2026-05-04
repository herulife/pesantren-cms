'use client';

import React, { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { updateNews, getNewsById, uploadImage, generateArticleAI, normalizeApiAssetUrl, resolveDisplayImageUrl, type NewsPayload } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useEffect } from 'react';
import { Sparkles, Image as ImageIcon, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ImageCropperModal from '@/components/ImageCropperModal';
import 'suneditor/dist/css/suneditor.min.css'; // Import Sun Editor's CSS File

const SunEditor = dynamic(() => import('suneditor-react'), {
  ssr: false,
});

import GallerySelectionModal from '@/components/GallerySelectionModal';

type NullableString = { String: string; Valid: boolean };
type NullableInt = { Int64: number; Valid: boolean };
type NewsFormData = {
  title: string;
  content: string;
  excerpt: string;
  image_url: NullableString;
  status: string;
  slug: string;
  category_id: NullableInt;
};
type AiDraftResponse = {
  data?: {
    result?: string;
    suggestedImage?: string;
  };
  result?: string;
  suggestedImage?: string;
};
type EditorInstance = {
  insertHTML: (html: string) => void;
};
type UploadErrorHandler = (message: string) => void;
type UploadSuccessHandler = (result: {
  result: Array<{
    url: string;
    name: string;
    size: number;
  }>;
}) => void;
type SunEditorUploadHandler = UploadErrorHandler & UploadSuccessHandler;

function normalizeNullableString(value: unknown) {
  if (typeof value === 'string') {
    return { String: value, Valid: value.trim() !== '' };
  }
  if (value && typeof value === 'object' && 'String' in value) {
    const candidate = value as { String?: unknown; Valid?: unknown };
    const stringValue = typeof candidate.String === 'string' ? candidate.String : '';
    return {
      String: stringValue,
      Valid: typeof candidate.Valid === 'boolean' ? candidate.Valid : stringValue.trim() !== ''
    };
  }
  return { String: '', Valid: false };
}

function normalizeNullableInt(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return { Int64: value, Valid: value > 0 };
  }
  if (value && typeof value === 'object' && 'Int64' in value) {
    const candidate = value as { Int64?: unknown; Valid?: unknown };
    const intValue = typeof candidate.Int64 === 'number' && Number.isFinite(candidate.Int64) ? candidate.Int64 : 0;
    return {
      Int64: intValue,
      Valid: typeof candidate.Valid === 'boolean' ? candidate.Valid : intValue > 0
    };
  }
  return { Int64: 0, Valid: false };
}

function normalizeNewsFormData(data: unknown): NewsFormData {
  const candidate = data && typeof data === 'object' ? data as Partial<NewsFormData> : {};
  return {
    title: typeof candidate.title === 'string' ? candidate.title : '',
    content: typeof candidate.content === 'string' ? candidate.content : '',
    excerpt: typeof candidate.excerpt === 'string' ? candidate.excerpt : '',
    image_url: normalizeNullableString(candidate.image_url),
    status: typeof candidate.status === 'string' ? candidate.status : 'published',
    slug: typeof candidate.slug === 'string' ? candidate.slug : '',
    category_id: normalizeNullableInt(candidate.category_id)
  };
}

function extractAiDraft(response: AiDraftResponse) {
  const payload = response?.data ?? response;
  return {
    result: typeof payload?.result === 'string' ? payload.result : '',
    suggestedImage: typeof payload?.suggestedImage === 'string' ? payload.suggestedImage : ''
  };
}

function buildNewsPayload(formData: NewsFormData): NewsPayload {
  return {
    title: formData.title,
    content: formData.content,
    excerpt: formData.excerpt,
    image_url: formData.image_url.String,
    status: formData.status,
    slug: formData.slug,
    category_id: formData.category_id.Valid ? formData.category_id.Int64 : 0
  };
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

export default function EditNewsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    image_url: { String: '', Valid: true },
    status: 'published',
    slug: '',
    category_id: { Int64: 0, Valid: false }
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getNewsById(id).then(data => {
        console.log('[NEWS DEBUG][EDIT][LOAD]', { id, data });
        if (data) {
          setFormData(normalizeNewsFormData(data));
        } else {
          showToast('error', 'Berita tidak ditemukan!');
          router.push('/admin/news');
        }
        setIsLoading(false);
      });
    }
  }, [id, router, showToast]);

  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isEditorGalleryOpen, setIsEditorGalleryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<EditorInstance | null>(null);

  // States untuk Cropper Model
  const [cropperModalOpen, setCropperModalOpen] = useState(false);
  const [selectedImageStr, setSelectedImageStr] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState('image');

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
       showToast('error', 'Judul berita tidak boleh kosong!');
       return;
    }
    const plainContent = stripHtml(formData.content);
    if (formData.title.trim().length < 5) {
      showToast('error', 'Judul minimal 5 karakter.');
      return;
    }
    if (plainContent.length < 20) {
      showToast('error', 'Konten minimal 20 karakter.');
      return;
    }
    const slug = formData.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const excerpt = formData.excerpt.trim() || `${plainContent.substring(0, 120)}${plainContent.length > 120 ? '...' : ''}`;
    const debugId = `news-edit-${id}-${Date.now()}`;
    const payload = { ...buildNewsPayload({ ...formData, excerpt }), slug };
    console.log('[NEWS DEBUG][EDIT][SUBMIT]', {
      debugId,
      id,
      formData,
      payload,
    });
    try {
      const res = await updateNews(id, payload);
      console.log('[NEWS DEBUG][EDIT][RESPONSE]', { debugId, id, res });
      if (res.success) {
        showToast('success', 'Berita berhasil diperbarui!');
        router.push('/admin/news');
      } else {
        showToast('error', 'Gagal memperbarui berita.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memperbarui berita.';
      showToast('error', message);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingFileName(file.name.replace(/\.[^/.]+$/, ""));
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageStr(reader.result as string);
      setCropperModalOpen(true);
    };
    reader.readAsDataURL(file);
    
    // Clear input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropSave = async (croppedBlob: Blob) => {
    setCropperModalOpen(false);
    setIsUploading(true);
    
    try {
      const webpFile = new File([croppedBlob], pendingFileName + ".webp", { type: 'image/webp' });
      const upRes = await uploadImage(webpFile);
      
      if (upRes.success) {
        setFormData(prev => ({ ...prev, image_url: { String: normalizeApiAssetUrl(upRes.url), Valid: true } }));
        showToast('success', 'Gambar berhasil dipotong & diunggah!');
      } else {
        showToast('error', 'Gagal mengunggah gambar hasil crop.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Terjadi kesalahan saat mengunggah foto.');
    } finally {
      setIsUploading(false);
      setSelectedImageStr(null);
    }
  };

  const handleGallerySelect = (url: string) => {
    const normalizedUrl = normalizeApiAssetUrl(url);
    console.log('[NEWS DEBUG][EDIT][GALLERY_SELECT]', {
      id,
      selectedUrl: url,
      normalizedUrl,
      currentImageUrl: formData.image_url.String,
    });
    if (normalizeApiAssetUrl(formData.image_url.String) === normalizedUrl) {
      showToast('info', 'Foto galeri yang dipilih sama dengan gambar unggulan yang sedang dipakai.');
      setIsGalleryOpen(false);
      return;
    }
    setFormData(prev => ({ ...prev, image_url: { String: normalizedUrl, Valid: true } }));
    setIsGalleryOpen(false);
    showToast('success', 'Gambar galeri berhasil dipilih.');
  };

  const handleEditorGallerySelect = (url: string) => {
    if (editorRef.current) {
        const normalizedUrl = normalizeApiAssetUrl(url);
        editorRef.current.insertHTML(`<img src="${normalizedUrl}" alt="Gallery Image" style="max-width:100%; border-radius: 1rem; margin: 1rem 0;" />`);
        setIsEditorGalleryOpen(false);
        showToast('success', 'Gambar galeri disisipkan ke dalam konten.');
    }
  };

  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) {
      showToast('error', 'Masukkan topik berita terlebih dahulu!');
      return;
    }
    setIsGenerating(true);
    showToast('success', 'Sedang menugaskan AI Gemini menyiapkan draft berita...');
    try {
      const res = await generateArticleAI(aiTopic, formData.image_url.String === '');
      const aiDraft = extractAiDraft(res);
      if (res.success && aiDraft.result) {
        setFormData(prev => ({
          ...prev,
          title: aiTopic,
          excerpt: aiDraft.result.substring(0, 120).replace(/<[^>]*>?/gm, '') + '...', 
          content: aiDraft.result,
          image_url: aiDraft.suggestedImage ? { String: aiDraft.suggestedImage, Valid: true } : prev.image_url
        }));
        showToast('success', 'Draft berita AI berhasil dibuat!');
      } else {
        showToast('error', 'Gagal menghasilkan konten AI.');
      }
    } catch (e) {
      showToast('error', 'Terjadi kesalahan sistem AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
         <Link href="/admin/news" className="flex items-center gap-2 text-slate-500 hover:text-emerald-700 transition-colors font-bold uppercase tracking-widest text-xs">
            <ArrowLeft size={16} /> Kembali ke Daftar
         </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight">Sunting Berita</h1>
      </div>

      <form onSubmit={handleEditSubmit} className={`relative ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
           
           {/* KOLOM UTAMA (KIRI - 70%) */}
           <div className="lg:col-span-2 space-y-6">
              
              {/* Title Input */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all">
                <input 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-6 py-4 bg-white border-none focus:ring-0 font-bold text-2xl text-slate-800 placeholder-slate-400 outline-none"
                  placeholder="Tambahkan judul berita..."
                />
              </div>

              {/* Asisten AI Box */}
              <div className="bg-emerald-50 p-6 border border-emerald-100 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
                 <div className="flex items-start gap-4 z-10">
                    <div className="w-12 h-12 bg-emerald-500 text-white rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                       <Sparkles size={24} />
                    </div>
                    <div>
                       <h3 className="font-bold text-slate-900 mb-1 leading-tight">Asisten Penulis AI (Beta)</h3>
                       <p className="text-xs text-slate-600 leading-relaxed max-w-lg mb-2">Ketik ide atau topik Anda, dan biarkan AI cerdas kami menyusun draft berita yang menarik dan tetap bernuansa Islami secara otomatis.</p>
                       
                       <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={aiTopic}
                            onChange={(e) => setAiTopic(e.target.value)}
                            placeholder="Ketik topik berita di sini..." 
                            className="flex-1 px-4 py-2 bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm"
                            disabled={isGenerating}
                          />
                       </div>
                    </div>
                 </div>
                 <button 
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={isGenerating}
                    className="shrink-0 z-10 px-5 py-2.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg font-bold hover:bg-emerald-50 transition-all disabled:opacity-50 flex items-center gap-2 text-sm shadow-sm"
                 >
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-emerald-500" />}
                    {isGenerating ? 'Menyusun...' : 'Coba Sekarang'}
                 </button>
              </div>

              {/* Editor Visual Box (SunEditor) */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all min-h-[500px] suneditor-wrapper relative">
                 <div className="absolute top-2 right-4 z-10">
                    <button 
                      type="button"
                      onClick={() => setIsEditorGalleryOpen(true)}
                      className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest hover:border-emerald-300 hover:text-emerald-600 transition-all shadow-sm active:scale-95"
                    >
                      <ImageIcon size={14} /> Sisipkan dari Galeri
                    </button>
                 </div>
                 <style dangerouslySetInnerHTML={{__html: `
                    .suneditor-wrapper .sun-editor { border: none !important; }
                    .suneditor-wrapper .se-toolbar { outline: 1px solid #f1f5f9; background: #f8fafc; padding: 4px 8px; }
                    .suneditor-wrapper .se-resizing-bar { display: none !important; }
                    .suneditor-wrapper .se-wrapper .se-wrapper-inner { min-height: 400px; padding: 10px; font-family: inherit; color: #475569; }
                 `}} />
                 <SunEditor
                    getSunEditorInstance={(instance) => { editorRef.current = instance; }}
                    setContents={formData.content}
                    onChange={(content) => setFormData((prev) => ({ ...prev, content }))}
                    setOptions={{
                        height: '100%',
                        minHeight: '400px',
                        buttonList: [
                            ['undo', 'redo'],
                            ['font', 'fontSize', 'formatBlock'],
                            ['paragraphStyle', 'blockquote'],
                            ['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'],
                            ['fontColor', 'hiliteColor', 'textStyle'],
                            ['removeFormat'],
                            ['outdent', 'indent'],
                            ['align', 'horizontalRule', 'list', 'lineHeight'],
                            ['table', 'link', 'image', 'video', 'audio'],
                            ['fullScreen', 'showBlocks', 'codeView'],
                            ['preview', 'print']
                        ]
                    }}
                    onImageUploadBefore={(files: File[], _info: object, uploadHandler: SunEditorUploadHandler) => {
                        try {
                            const file = files[0];
                            const reader = new FileReader();
                            reader.onload = () => {
                                const img = new Image();
                                img.onload = () => {
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
                                    if (!ctx) return uploadHandler('Canvas not supported');
                                    
                                    ctx.drawImage(img, 0, 0, width, height);

                                    canvas.toBlob(async (blob) => {
                                        if (!blob) return uploadHandler('Conversion failed');
                                        const dotIndex = file.name.lastIndexOf('.');
                                        const baseName = dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name;
                                        const webpFile = new File([blob], baseName + '.webp', {
                                            type: 'image/webp',
                                            lastModified: Date.now()
                                        });

                                        try {
                                            const response = await uploadImage(webpFile);
                                            if (response.success) {
                                                uploadHandler({
                                                    "result": [{
                                                        "url": response.url,
                                                        "name": webpFile.name,
                                                        "size": webpFile.size
                                                    }]
                                                });
                                            } else {
                                                uploadHandler('Upload API failed');
                                            }
                                        } catch {
                                            uploadHandler('Upload catch error');
                                        }
                                    }, 'image/webp', 0.85);
                                };
                                img.onerror = () => uploadHandler('Image load error');
                                img.src = typeof reader.result === 'string' ? reader.result : '';
                            };
                            reader.onerror = () => uploadHandler('File read error');
                            reader.readAsDataURL(file);
                        } catch {
                            uploadHandler('Outer try catch error');
                        }
                        return undefined;
                    }}
                 />
              </div>
           </div>

           {/* KOLOM SIDEBAR (KANAN - 30%) */}
           <div className="lg:col-span-1 space-y-6">
              
              {/* META BOX 1: Terbitkan */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                 <div className="px-5 py-4 border-b border-slate-100 bg-white">
                    <h3 className="font-bold text-slate-800 text-[13px]">Terbitkan</h3>
                 </div>
                 <div className="p-5 space-y-5">
                    
                    <div className="grid grid-cols-2 gap-3">
                       <div 
                         onClick={() => setFormData((prev) => ({ ...prev, status: 'published' }))}
                         className={`border rounded-lg p-3 flex flex-col gap-1 cursor-pointer transition-all ${formData.status === 'published' ? 'border-emerald-300 shadow-sm bg-emerald-50/20' : 'border-slate-200 hover:border-slate-300'}`}>
                          <div className={`flex items-center gap-1.5 font-bold text-[13px] ${formData.status === 'published' ? 'text-emerald-700' : 'text-slate-700'}`}>
                             <div className={formData.status === 'published' ? 'text-emerald-500' : 'text-slate-400'}>✓</div> Langsung
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">Tayang ke web</div>
                       </div>
                       <div 
                         onClick={() => setFormData((prev) => ({ ...prev, status: 'draft' }))}
                         className={`border rounded-lg p-3 flex flex-col gap-1 cursor-pointer transition-colors ${formData.status === 'draft' ? 'border-slate-400 shadow-sm bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}>
                          <div className="flex items-center gap-1.5 font-bold text-[13px] text-slate-700">
                             <div className={formData.status === 'draft' ? 'text-slate-600' : 'text-slate-400'}>📄</div> Draf
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">Simpan sebagai draf</div>
                       </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                       <div className="flex items-center gap-2">
                          <div className="text-amber-400 text-lg">⏱️</div>
                          <div>
                             <div className="text-xs font-bold text-slate-800">Jadwalkan Posting</div>
                             <div className="text-[10px] text-slate-400">Pilih rilis waktu otomatis</div>
                          </div>
                       </div>
                       {/* Toggle Switch */}
                       <div className="w-10 h-5 bg-slate-200 hover:bg-slate-300 rounded-full relative cursor-pointer transition-colors shadow-inner">
                          <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                       </div>
                    </div>

                 </div>
                 <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
                    <Link href="/admin/news" className="text-xs font-bold text-rose-500 hover:text-rose-600 px-2 transition-colors">
                       Batal
                    </Link>
                    <button 
                      type="submit"
                      disabled={isUploading || isGenerating}
                      className="px-8 py-2.5 bg-emerald-600 text-white rounded-lg text-[13px] font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                    >
                      Simpan
                    </button>
                 </div>
              </div>

              {/* META BOX 2: Kategori */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                 <div className="px-5 py-4 border-b border-slate-100 bg-white">
                    <h3 className="font-bold text-slate-800 text-[13px]">Kategori</h3>
                 </div>
                 <div className="p-5 flex flex-col gap-2">
                     <select 
                       value={formData.category_id.Int64}
                       onChange={(e) => {
                         const val = parseInt(e.target.value);
                         setFormData((prev) => ({ ...prev, category_id: { Int64: val, Valid: val > 0 } }));
                       }}
                       className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-bold text-slate-600 outline-none appearance-none shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
                       <option value={0}>Pilih Kategori</option>
                       <option value={1}>Akademik</option>
                       <option value={2}>Kajian</option>
                       <option value={3}>Pengumuman</option>
                     </select>
                 </div>
              </div>

              {/* META BOX 3: Gambar Unggulan */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                 <div className="px-5 py-4 border-b border-slate-100 bg-white flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-[13px]">Gambar Unggulan</h3>
                    <span 
                      onClick={() => setIsGalleryOpen(true)}
                      className="text-emerald-600 text-[10px] font-bold cursor-pointer hover:underline flex items-center gap-1"
                    >
                       <ImageIcon size={12} /> Buka Galeri
                    </span>
                 </div>
                 <div className="p-5 flex-1 flex flex-col">
                    <div 
                      className={`w-full flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center relative overflow-hidden transition-all min-h-[12rem] bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-300 ${
                        formData.image_url.String ? 'border-emerald-300' : 'border-slate-200'
                      }`}
                      onClick={() => !isUploading && fileInputRef.current?.click()}
                      style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}
                    >
                      {formData.image_url.String && !isUploading ? (
                        <>
                          <img src={resolveDisplayImageUrl(formData.image_url.String)} className="w-full h-full object-cover relative z-0" alt="Preview" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm z-10">
                            <span className="text-white font-bold text-[11px] bg-black/50 px-4 py-2 rounded-lg shadow-lg">Klik untuk mengganti</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 p-6 text-emerald-400 text-center">
                          {isUploading ? (
                             <Loader2 size={24} className="animate-spin text-emerald-500 mb-1" />
                          ) : (
                             <span className="text-3xl text-slate-300 font-light mb-1">+</span>
                          )}
                          <span className="text-[11px] font-bold text-slate-500 px-2 mt-1">
                             {isUploading ? 'Mengunggah...' : 'Klik untuk Unggah Gambar Baru'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 my-5">
                       <div className="h-px bg-slate-100 flex-1"></div>
                       <span className="text-[9px] font-black tracking-widest text-slate-300 uppercase">A T A U   U R L</span>
                       <div className="h-px bg-slate-100 flex-1"></div>
                    </div>

                    <div className="flex gap-2 relative">
                       <input 
                         type="text"
                         value={formData.image_url.String}
                         onChange={(e) => setFormData((prev) => ({ ...prev, image_url: { String: e.target.value, Valid: true } }))}
                         placeholder="Tempel link gambar di sini..."
                         className="flex-1 pl-4 pr-12 py-3 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700 shadow-sm"
                       />
                       <button 
                         type="button" 
                         onClick={() => showToast('success', 'URL Gambar berhasil disetel!')}
                         className="absolute right-1 top-1 bottom-1 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] rounded-lg transition-colors shadow-md">
                          Ok
                       </button>
                    </div>

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
      
      {/* Cropper Modal Overlay */}
      <ImageCropperModal
        isOpen={cropperModalOpen}
        onClose={() => { setCropperModalOpen(false); setSelectedImageStr(null); }}
        imageSrc={selectedImageStr}
        onCropComplete={handleCropSave}
        aspectRatio={16 / 9}
      />

      <GallerySelectionModal 
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelect={handleGallerySelect}
      />

      <GallerySelectionModal 
        isOpen={isEditorGalleryOpen}
        onClose={() => setIsEditorGalleryOpen(false)}
        onSelect={handleEditorGallerySelect}
      />
    </>
  );
}
