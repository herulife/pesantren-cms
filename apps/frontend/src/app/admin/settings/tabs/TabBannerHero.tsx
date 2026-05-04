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
  const hasSingleSlide = slides.length === 1;

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
    setSlides((prev) =>
      prev.map((slide) => (slide.id === id ? { ...slide, [field]: value } : slide))
    );
  };

  const addSlide = () => {
    const nextSlide = createSlide({
      title: `Slide ${slides.length + 1}`,
      button_text: 'Lihat Selengkapnya',
      button_url: '/profil',
    }, `slide-${slides.length + 1}`);
    setSlides((prev) => [...prev, nextSlide]);
    setSelectedSlideId(nextSlide.id);
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
  };

  const moveSlide = (id: string, direction: 'left' | 'right') => {
    setSlides((prev) => {
      const index = prev.findIndex((slide) => slide.id === id);
      if (index < 0) return prev;
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedSlide) return;

    setIsUploading(true);
    try {
      const result = await uploadImage(file);
      const uploadedUrl = result?.url || result?.data?.url || '';
      if (!uploadedUrl) {
        throw new Error('URL gambar upload tidak ditemukan.');
      }

      updateSlide(selectedSlide.id, 'image_url', uploadedUrl);
      showToast('success', 'Gambar slide berhasil diunggah.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengunggah gambar slide.';
      showToast('error', message);
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
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
        <RefreshCw className="animate-spin text-emerald-600" />
      </div>
    );
  }

  const previewImage = resolveDisplayImageUrl(selectedSlide.image_url || '/assets/img/gedung.webp');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Images size={24} />
            </div>
            <div>
              <h2 className="font-outfit text-xl font-black uppercase tracking-tight text-slate-900">Slider Beranda</h2>
              <p className="text-xs font-medium text-slate-500">Atur slide utama yang tampil di bagian paling atas halaman beranda.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={addSlide}
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-sky-600 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-sky-700 sm:px-5 sm:py-3 sm:text-xs sm:tracking-widest"
          >
            <Plus size={16} />
            Tambah Slide
          </button>
        </div>

        <div className="grid gap-8 p-8 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-6">
            {hasSingleSlide ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
                Beranda saat ini baru memiliki <span className="font-bold">1 slide</span>. Tambahkan
                2-3 slide agar hero homepage terasa lebih hidup dan rotasinya lebih jelas.
              </div>
            ) : null}

            <div className="grid gap-3 rounded-xl border border-sky-100 bg-sky-50/70 p-4 sm:grid-cols-3">
              <div className="rounded-lg bg-white px-4 py-3 ring-1 ring-sky-100">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">Langkah 1</p>
                <p className="mt-1 text-sm font-bold text-slate-900">Pilih slide</p>
              </div>
              <div className="rounded-lg bg-white px-4 py-3 ring-1 ring-sky-100">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">Langkah 2</p>
                <p className="mt-1 text-sm font-bold text-slate-900">Ubah isi slide</p>
              </div>
              <div className="rounded-lg bg-white px-4 py-3 ring-1 ring-sky-100">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">Langkah 3</p>
                <p className="mt-1 text-sm font-bold text-slate-900">Simpan perubahan</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-700">1. Daftar Slide</h3>
                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 ring-1 ring-slate-200">
                    {slides.length} slide
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  Pilih slide yang ingin diedit, lalu atur urutan atau hapus jika sudah tidak dipakai.
                </p>
              </div>
              <div className="space-y-3">
                {slides.map((slide, index) => {
                  const active = slide.id === selectedSlide.id;
                  return (
                    <div
                      key={slide.id}
                      className={`rounded-xl border p-4 transition-all ${active ? 'border-sky-500 bg-white shadow-sm ring-2 ring-sky-500/10' : 'border-slate-200 bg-white/80'}`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedSlideId(slide.id)}
                          className="flex min-w-0 flex-1 items-start gap-3 text-left"
                        >
                          <img
                            src={resolveDisplayImageUrl(slide.image_url || '/assets/img/gedung.webp')}
                            alt={slide.title}
                            className="h-16 w-20 rounded-lg object-cover"
                          />
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-600">Slide {index + 1}</p>
                            <p className="mt-1 line-clamp-2 text-sm font-bold text-slate-900">{slide.title || 'Tanpa judul'}</p>
                            <p className="mt-2 text-[11px] font-semibold text-slate-500">
                              {active ? 'Sedang dipilih untuk diedit' : 'Klik untuk pilih dan edit'}
                            </p>
                          </div>
                        </button>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            title="Geser slide ke kiri"
                            onClick={() => moveSlide(slide.id, 'left')}
                            disabled={index === 0}
                            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <button
                            type="button"
                            title="Geser slide ke kanan"
                            onClick={() => moveSlide(slide.id, 'right')}
                            disabled={index === slides.length - 1}
                            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
                          >
                            <ChevronRight size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSlide(slide.id)}
                            className="rounded-xl border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-700">2. Edit Slide Aktif</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Sekarang kamu sedang mengedit <span className="font-bold text-slate-700">Slide {slides.findIndex((slide) => slide.id === selectedSlide.id) + 1}</span>. Ubah judul, teks, gambar, dan tombol di bawah ini.
                  </p>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-sky-700 ring-1 ring-sky-100">
                  Form Edit
                </span>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="space-y-4 md:col-span-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-sky-700">
                    <Type size={12} /> Judul Utama
                  </label>
                  <input
                    value={selectedSlide.title}
                    onChange={(e) => updateSlide(selectedSlide.id, 'title', e.target.value)}
                    placeholder="Contoh: Merekam Jejak Intelektual & Spiritual"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-4 md:col-span-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-sky-700">
                    <Type size={12} /> Teks Pendukung
                  </label>
                  <textarea
                    rows={3}
                    value={selectedSlide.subtitle}
                    onChange={(e) => updateSlide(selectedSlide.id, 'subtitle', e.target.value)}
                    placeholder="Tulis penjelasan singkat yang tampil di bawah judul"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-medium leading-relaxed text-slate-800"
                  />
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-sky-700">
                    <Type size={12} /> Teks Tombol
                  </label>
                  <input
                    value={selectedSlide.button_text}
                    onChange={(e) => updateSlide(selectedSlide.id, 'button_text', e.target.value)}
                    placeholder="Contoh: Daftar Sekarang"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-sky-700">
                    <LinkIcon size={12} /> Link Tujuan Tombol
                  </label>
                  <input
                    value={selectedSlide.button_url}
                    onChange={(e) => updateSlide(selectedSlide.id, 'button_url', e.target.value)}
                    placeholder="/psb"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-4 md:col-span-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-sky-700">
                    <ImageIcon size={12} /> Link Gambar
                  </label>
                  <input
                    value={selectedSlide.image_url}
                    onChange={(e) => updateSlide(selectedSlide.id, 'image_url', e.target.value)}
                    placeholder="Tempel link gambar atau pilih dari gallery di bawah"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-bold text-slate-800 transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                  />
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-dashed border-sky-200 bg-sky-50/60 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Upload gambar baru</p>
                    <p className="mt-1 text-xs text-slate-500">Kalau belum ada gambar, kamu bisa unggah langsung untuk slide ini.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-sky-600 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-sky-700 disabled:opacity-60 sm:px-5 sm:py-3 sm:text-xs sm:tracking-widest"
                  >
                    {isUploading ? <RefreshCw size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                    {isUploading ? 'Mengunggah...' : 'Upload Gambar'}
                  </button>
                </div>
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Images size={16} className="text-sky-600" />
                      Pilih gambar dari gallery
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Klik salah satu gambar di bawah untuk langsung dipakai oleh slide ini.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void fetchGalleryItems()}
                    className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600 transition hover:bg-slate-100 sm:px-4 sm:tracking-widest"
                  >
                    <RefreshCw size={12} className={isGalleryLoading ? 'animate-spin' : ''} />
                    Muat Ulang
                  </button>
                </div>

                {isGalleryLoading ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="h-24 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : galleryItems.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {galleryItems.map((item) => {
                      const imageUrl = resolveDisplayImageUrl(item.image_url);
                      const isActive = selectedSlide.image_url === item.image_url || selectedSlide.image_url === imageUrl;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => updateSlide(selectedSlide.id, 'image_url', item.image_url)}
                          className={`group overflow-hidden rounded-xl border text-left transition-all ${isActive ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-slate-200 hover:border-sky-300'}`}
                        >
                          <div className="relative h-24 w-full overflow-hidden bg-slate-100">
                            <img src={imageUrl} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          </div>
                          <div className="p-3">
                            <p className="line-clamp-2 text-xs font-bold text-slate-700">{item.title}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                    Belum ada gambar gallery yang bisa dipilih.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-700">3. Preview Slide Aktif</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Slide {slides.findIndex((slide) => slide.id === selectedSlide.id) + 1}
              </span>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-[0_30px_60px_-25px_rgba(15,23,42,0.3)]">
              <div className="relative h-[520px] w-full">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${previewImage}')` }} />
                <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(2,6,23,0.9)_10%,rgba(2,6,23,0.58)_42%,rgba(2,6,23,0.12)_76%,rgba(2,6,23,0.02)_100%)]" />
                <div className="relative z-10 flex h-full items-center px-8 text-white">
                  <div className="max-w-2xl">
                  <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200 backdrop-blur-sm">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Pondok Pesantren Darussunnah Parung
                  </span>
                  <h4 className="max-w-xl text-4xl font-black leading-tight tracking-tight md:text-5xl">
                    {selectedSlide.title || 'Tanpa Judul'}
                  </h4>
                  <p className="mt-5 max-w-xl text-base leading-8 text-slate-200 md:text-lg">
                    {selectedSlide.subtitle || 'Tambahkan subjudul untuk slide ini.'}
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <span className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-bold text-white shadow-lg">
                      {selectedSlide.button_text || 'Tombol Utama'}
                    </span>
                    <span className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white/90 backdrop-blur-sm">
                      Lihat Program
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                    Arahkan tombol utama ke {selectedSlide.button_url || '/'}
                  </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">
              Preview ini disusun mengikuti hero beranda: teks utama di kiri, gambar lebih
              terbaca, dan tombol utama menjadi fokus utama slide.
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSaveAll}
          disabled={isSaving || isUploading}
          className="flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:opacity-50 sm:gap-3 sm:px-8 sm:py-4 sm:text-xs sm:tracking-widest"
        >
          {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          Simpan Slider Beranda
        </button>
      </div>
    </div>
  );
}
