'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  GalleryItem,
  getGallery,
  getSettings,
  resolveDisplayImageUrl,
  updateSetting,
  uploadImage,
} from '@/lib/api';
import { useToast } from '@/components/Toast';
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Images,
  Link as LinkIcon,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Type,
  UploadCloud,
} from 'lucide-react';

type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  button_text: string;
  button_url: string;
};

const HERO_SLIDES_KEY = 'hero_slides';

const buildSlideId = (overrides: Partial<HeroSlide> = {}, fallbackKey = 'slide') => {
  if (typeof overrides.id === 'string' && overrides.id.trim()) {
    return overrides.id;
  }
  const seed = [
    overrides.title,
    overrides.subtitle,
    overrides.image_url,
    overrides.button_text,
    overrides.button_url,
    fallbackKey,
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join('|')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return seed || fallbackKey;
};

const createSlide = (overrides: Partial<HeroSlide> = {}, fallbackKey?: string): HeroSlide => ({
  id: buildSlideId(overrides, fallbackKey),
  title: overrides.title ?? 'Merekam Jejak Intelektual & Spiritual',
  subtitle: overrides.subtitle ?? 'Pendidikan tahfidz yang menumbuhkan ilmu, adab, dan kesiapan berdakwah di tengah umat.',
  image_url: overrides.image_url ?? '/assets/img/gedung.webp',
  button_text: overrides.button_text ?? 'Daftar Sekarang',
  button_url: overrides.button_url ?? '/psb',
});

function parseSlides(raw: string | undefined) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const slides = parsed
      .filter((item) => item && typeof item === 'object')
      .map((item, index) =>
        createSlide({
          id: typeof item.id === 'string' ? item.id : undefined,
          title: typeof item.title === 'string' ? item.title : '',
          subtitle: typeof item.subtitle === 'string' ? item.subtitle : '',
          image_url: typeof item.image_url === 'string' ? item.image_url : '',
          button_text: typeof item.button_text === 'string' ? item.button_text : '',
          button_url: typeof item.button_url === 'string' ? item.button_url : '',
        }, `slide-${index + 1}`)
      );
    return slides.length > 0 ? slides : null;
  } catch {
    return null;
  }
}

export default function TabBannerHero() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [selectedSlideId, setSelectedSlideId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    void Promise.all([fetchData(), fetchGalleryItems()]);
  }, []);

  const selectedSlide = useMemo(
    () => slides.find((slide) => slide.id === selectedSlideId) || slides[0] || null,
    [selectedSlideId, slides]
  );
  const selectedIndex = useMemo(
    () => slides.findIndex((s) => s.id === selectedSlide?.id),
    [slides, selectedSlide]
  );

  const fetchData = async () => {
    setIsLoading(true);
    const settingsData = await getSettings();
    const settingsMap = settingsData.reduce<Record<string, string>>((acc, item) => {
      acc[item.key] = item.value || '';
      return acc;
    }, {});
    const parsedSlides =
      parseSlides(settingsMap[HERO_SLIDES_KEY]) ||
      [
        createSlide({
          title: settingsMap.banner_title || undefined,
          subtitle: settingsMap.banner_subtitle || undefined,
          image_url: settingsMap.banner_image_url || undefined,
          button_text: settingsMap.banner_button_text || undefined,
          button_url: settingsMap.banner_button_url || undefined,
        }, 'slide-1'),
      ];
    setSlides(parsedSlides);
    setSelectedSlideId(parsedSlides[0]?.id || '');
    setIsDirty(false);
    setIsLoading(false);
  };

  const fetchGalleryItems = async () => {
    setIsGalleryLoading(true);
    try {
      const result = await getGallery({ limit: 12, offset: 0 });
      setGalleryItems((result.data || []) as GalleryItem[]);
    } finally {
      setIsGalleryLoading(false);
    }
  };

  const updateSlide = (id: string, field: keyof HeroSlide, value: string) => {
    setSlides((prev) => prev.map((slide) => (slide.id === id ? { ...slide, [field]: value } : slide)));
    setIsDirty(true);
  };

  const addSlide = () => {
    const nextSlide = createSlide({
      title: `Slide ${slides.length + 1}`,
      button_text: 'Lihat Selengkapnya',
      button_url: '/profil',
    }, `slide-${slides.length + 1}`);
    setSlides((prev) => [...prev, nextSlide]);
    setSelectedSlideId(nextSlide.id);
    setIsDirty(true);
  };

  const deleteSlide = (id: string) => {
    if (slides.length === 1) {
      showToast('error', 'Slider minimal harus memiliki satu slide.');
      return;
    }
    const nextSlides = slides.filter((slide) => slide.id !== id);
    setSlides(nextSlides);
    if (selectedSlideId === id) {
      setSelectedSlideId(nextSlides[0]?.id || '');
    }
    setIsDirty(true);
  };

  const moveSlide = (id: string, direction: 'left' | 'right') => {
    setSlides((prev) => {
      const index = prev.findIndex((slide) => slide.id === id);
      if (index < 0) return prev;
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const tmp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = tmp;
      return next;
    });
    setIsDirty(true);
  };

  const goPrev = () => {
    if (slides.length === 0 || !selectedSlide) return;
    const idx = slides.findIndex((s) => s.id === selectedSlide.id);
    const prev = idx <= 0 ? slides.length - 1 : idx - 1;
    setSelectedSlideId(slides[prev].id);
  };
  const goNext = () => {
    if (slides.length === 0 || !selectedSlide) return;
    const idx = slides.findIndex((s) => s.id === selectedSlide.id);
    const nxt = idx >= slides.length - 1 ? 0 : idx + 1;
    setSelectedSlideId(slides[nxt].id);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedSlide) return;
    setIsUploading(true);
    try {
      const result = await uploadImage(file);
      const uploadedUrl = result?.url || result?.data?.url || '';
      if (!uploadedUrl) throw new Error('URL gambar upload tidak ditemukan.');
      updateSlide(selectedSlide.id, 'image_url', uploadedUrl);
      showToast('success', 'Gambar slide berhasil diunggah.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengunggah gambar slide.';
      showToast('error', message);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const cleanSlides = slides.map((slide) => ({
        ...slide,
        id: buildSlideId(slide, 'slide'),
        title: String(slide.title ?? '').trim(),
        subtitle: String(slide.subtitle ?? '').trim(),
        image_url: String(slide.image_url ?? '').trim(),
        button_text: String(slide.button_text ?? '').trim(),
        button_url: String(slide.button_url ?? '').trim(),
      }));
      await updateSetting(HERO_SLIDES_KEY, JSON.stringify(cleanSlides));
      const firstSlide = cleanSlides[0] || createSlide();
      await Promise.all([
        updateSetting('banner_title', firstSlide.title),
        updateSetting('banner_subtitle', firstSlide.subtitle),
        updateSetting('banner_image_url', firstSlide.image_url),
        updateSetting('banner_button_text', firstSlide.button_text),
        updateSetting('banner_button_url', firstSlide.button_url),
      ]);
      showToast('success', 'Pengaturan slider beranda berhasil disimpan');
      setIsDirty(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan slider beranda.';
      showToast('error', message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !selectedSlide) {
    return (
      <div className="flex justify-center p-10">
        <RefreshCw className="animate-spin text-blue-600" />
      </div>
    );
  }

  const previewImage = resolveDisplayImageUrl(selectedSlide.image_url || '/assets/img/gedung.webp');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Header WordPress-style */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 text-white shadow-md">
            <Images size={22} />
          </div>
          <div>
            <h2 className="font-outfit text-lg font-black uppercase tracking-tight text-slate-900">Slider Beranda</h2>
            <p className="text-xs font-medium text-slate-500">Pratinjau besar seperti WordPress — panah untuk ganti slide, form di kanan untuk edit langsung.</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {isDirty ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Belum disimpan
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Tersimpan
                </span>
              )}
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
                {slides.length} slide • Slide {selectedIndex + 1} aktif
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={addSlide} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow hover:bg-sky-700">
            <Plus size={16} /> Tambah Slide
          </button>
          <button type="button" onClick={handleSaveAll} disabled={isSaving || isUploading} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow hover:bg-blue-700 disabled:opacity-50">
            {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} Simpan
          </button>
        </div>
      </div>

      {/* WordPress-style: Preview besar kiri, Form kanan */}
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        {/* KIRI: Preview besar */}
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-lg">
            <div className="relative h-[420px] w-full sm:h-[480px]">
              <div className="absolute inset-0 bg-cover bg-center transition-all duration-500" style={{ backgroundImage: `url('${previewImage}')` }} />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/10" />
              {/* Panah navigasi WordPress-style */}
              <button type="button" onClick={goPrev} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 text-slate-700 shadow hover:bg-white">
                <ChevronLeft size={20} />
              </button>
              <button type="button" onClick={goNext} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 text-slate-700 shadow hover:bg-white">
                <ChevronRight size={20} />
              </button>
              {/* Konten overlay */}
              <div className="relative z-10 flex h-full items-center px-8 sm:px-12">
                <div className="max-w-lg">
                  <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-200 backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                    Pondok Pesantren Al-Maa Parung • Slide {selectedIndex + 1} / {slides.length}
                  </span>
                  <h3 className="text-3xl font-black leading-tight text-white sm:text-4xl">{selectedSlide.title || 'Tanpa Judul'}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-200 sm:text-base">{selectedSlide.subtitle || 'Tambahkan subjudul untuk slide ini.'}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <span className="rounded-full bg-gradient-to-r from-blue-500 to-blue-500 px-5 py-2.5 text-sm font-bold text-white shadow">{selectedSlide.button_text || 'Tombol'}</span>
                    <span className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur">Lihat Program</span>
                  </div>
                </div>
              </div>
              {/* Dots indikator */}
              <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
                {slides.map((s, i) => (
                  <button key={s.id} type="button" onClick={() => setSelectedSlideId(s.id)} className={`h-2 rounded-full transition-all ${s.id === selectedSlide.id ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`} />
                ))}
              </div>
            </div>
          </div>

          {/* Strip thumbnail + kontrol urutan */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-slate-600">Pilih slide • klik thumbnail atau panah</p>
              <span className="text-[10px] font-bold text-slate-400">{slides.length} slide</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {slides.map((slide, idx) => {
                const active = slide.id === selectedSlide.id;
                return (
                  <div key={slide.id} className={`group relative shrink-0 overflow-hidden rounded-xl border-2 ${active ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'}`}>
                    <button type="button" onClick={() => setSelectedSlideId(slide.id)} className="block">
                      <img src={resolveDisplayImageUrl(slide.image_url || '/assets/img/gedung.webp')} alt={slide.title} className="h-20 w-32 object-cover" />
                      {active && <span className="absolute left-1.5 top-1.5 rounded-full bg-blue-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">DIPILIH</span>}
                      <span className="absolute bottom-1 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">#{idx + 1}</span>
                    </button>
                    <div className="flex items-center justify-between bg-white px-1 py-1">
                      <button type="button" onClick={() => moveSlide(slide.id, 'left')} disabled={idx === 0} className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ChevronLeft size={12} /></button>
                      <button type="button" onClick={() => deleteSlide(slide.id)} className="rounded p-1 text-rose-500 hover:bg-rose-50"><Trash2 size={12} /></button>
                      <button type="button" onClick={() => moveSlide(slide.id, 'right')} disabled={idx === slides.length - 1} className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ChevronRight size={12} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* KANAN: Form edit slide aktif */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Edit Slide {selectedIndex + 1}</h3>
            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${isDirty ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{isDirty ? 'Belum disimpan' : 'Tersimpan'}</span>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-sky-700"><Type size={12} /> Judul Utama</label>
              <input value={selectedSlide.title} onChange={(e) => updateSlide(selectedSlide.id, 'title', e.target.value)} placeholder="Contoh: Merekam Jejak Intelektual & Spiritual" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10" />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-sky-700"><Type size={12} /> Teks Pendukung</label>
              <textarea rows={3} value={selectedSlide.subtitle} onChange={(e) => updateSlide(selectedSlide.id, 'subtitle', e.target.value)} placeholder="Tulis penjelasan singkat di bawah judul" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium leading-relaxed text-slate-800 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-sky-700"><Type size={12} /> Teks Tombol</label>
                <input value={selectedSlide.button_text} onChange={(e) => updateSlide(selectedSlide.id, 'button_text', e.target.value)} placeholder="Daftar Sekarang" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800" />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-sky-700"><LinkIcon size={12} /> Link Tombol</label>
                <input value={selectedSlide.button_url} onChange={(e) => updateSlide(selectedSlide.id, 'button_url', e.target.value)} placeholder="/psb" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-sky-700"><ImageIcon size={12} /> Link Gambar</label>
              <input value={selectedSlide.image_url} onChange={(e) => updateSlide(selectedSlide.id, 'image_url', e.target.value)} placeholder="Tempel URL gambar atau upload di bawah" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10" />
              <p className="mt-1.5 text-xs text-slate-400">Gambar akan tampil di preview kiri setelah Anda simpan.</p>
            </div>

            <div className="rounded-xl border border-dashed border-sky-200 bg-sky-50/60 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">Upload gambar baru</p>
                  <p className="text-xs text-slate-500">Pilih file untuk slide ini.</p>
                </div>
                <button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-sky-700 disabled:opacity-60">
                  {isUploading ? <RefreshCw size={14} className="animate-spin" /> : <UploadCloud size={14} />}{isUploading ? 'Mengunggah...' : 'Upload'}
                </button>
              </div>
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-bold text-slate-900"><Images size={14} className="text-sky-600" /> Pilih dari galeri</p>
                <button type="button" onClick={() => void fetchGalleryItems()} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100"><RefreshCw size={12} className={isGalleryLoading ? 'animate-spin' : ''} /> Muat</button>
              </div>
              {isGalleryLoading ? (
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />))}
                </div>
              ) : galleryItems.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {galleryItems.map((item) => {
                    const imageUrl = resolveDisplayImageUrl(item.image_url);
                    const isActive = selectedSlide.image_url === item.image_url || selectedSlide.image_url === imageUrl;
                    return (
                      <button key={item.id} type="button" onClick={() => updateSlide(selectedSlide.id, 'image_url', item.image_url)} className={`overflow-hidden rounded-xl border text-left ${isActive ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-slate-200 hover:border-sky-300'}`}>
                        <img src={imageUrl} alt={item.title} className="h-16 w-full object-cover" />
                        <p className="line-clamp-1 p-2 text-xs font-bold text-slate-700">{item.title}</p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl bg-slate-50 py-6 text-center text-sm text-slate-400">Belum ada gambar galeri.</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button type="button" onClick={handleSaveAll} disabled={isSaving || isUploading} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow hover:bg-blue-700 disabled:opacity-50">
              {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Simpan Slider
            </button>
            {isDirty && (
              <button type="button" onClick={() => void fetchData()} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50">Batal</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
