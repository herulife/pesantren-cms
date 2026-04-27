'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Slide = {
  title: string;
  description: string;
  image: string;
  href: string;
  cta: string;
  eyebrow: string;
};

const defaultSlides: Slide[] = [
  {
    eyebrow: 'Pendaftaran Santri',
    title: 'PSB Darussunnah Parung',
    description:
      'Lihat alur pendaftaran, persyaratan, dan informasi penting untuk calon wali santri.',
    image: '/assets/img/info-pendaftaran.jpg',
    href: '/psb',
    cta: 'Lihat PSB',
  },
  {
    eyebrow: 'Pembinaan Harian',
    title: 'Tahfidz, adab, dan ritme pondok yang terarah',
    description:
      'Kenali suasana belajar dan pembinaan santri melalui program unggulan Darussunnah.',
    image: '/assets/img/tahfidz.jpg',
    href: '/program',
    cta: 'Lihat Program',
  },
  {
    eyebrow: 'Kabar Pesantren',
    title: 'Agenda dan berita pondok yang terus diperbarui',
    description:
      'Pantau kegiatan, dokumentasi, dan perkembangan terbaru dari lingkungan pesantren.',
    image: '/assets/img/khalaqoh.jpg',
    href: '/news',
    cta: 'Baca Berita',
  },
];

type HeroSlideInput = {
  id?: string;
  title?: string;
  subtitle?: string;
  image_url?: string;
  button_text?: string;
  button_url?: string;
};

export default function HomeHeroSlider({ slides: externalSlides }: { slides?: HeroSlideInput[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const slides = (externalSlides?.length
    ? externalSlides.map((slide, index) => ({
        eyebrow: `Slide ${index + 1}`,
        title: slide.title || defaultSlides[index]?.title || 'Darussunnah Parung',
        description:
          slide.subtitle || defaultSlides[index]?.description || 'Informasi terbaru Darussunnah.',
        image: slide.image_url || defaultSlides[index]?.image || '/assets/img/gedung.webp',
        href: slide.button_url || defaultSlides[index]?.href || '/profil',
        cta: slide.button_text || defaultSlides[index]?.cta || 'Lihat Selengkapnya',
      }))
    : defaultSlides) as Slide[];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  const activeSlide = slides[activeIndex];
  const goPrev = () => setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  const goNext = () => setActiveIndex((current) => (current + 1) % slides.length);

  return (
    <div className="rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-[0_25px_80px_-30px_rgba(15,23,42,0.9)] backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-slate-950/70 px-4 py-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Slider Utama</p>
          <p className="mt-1 text-sm font-semibold text-white">Sorotan informasi Darussunnah</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Slide sebelumnya"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Slide berikutnya"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950">
        <div
          className="relative min-h-[280px] bg-cover bg-center"
          style={{ backgroundImage: `url('${activeSlide.image}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/30" />
          <div className="relative flex min-h-[280px] flex-col justify-end p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-200">
              {activeSlide.eyebrow}
            </p>
            <h3 className="mt-3 max-w-md text-2xl font-black leading-tight text-white">
              {activeSlide.title}
            </h3>
            <p className="mt-3 max-w-md text-sm leading-7 text-white/80">
              {activeSlide.description}
            </p>
            <div className="mt-5">
              <Link
                href={activeSlide.href}
                className="inline-flex items-center rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-emerald-900 transition hover:bg-emerald-50"
              >
                {activeSlide.cta}
              </Link>
            </div>
            <div className="mt-6 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${((activeIndex + 1) / slides.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-slate-950/90 px-4 py-4">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="mr-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
              Slide {activeIndex + 1}/{slides.length}
            </span>
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`rounded-full px-4 py-2 text-left text-[11px] font-black uppercase tracking-[0.18em] transition ${
                  index === activeIndex
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/5 text-white/65 hover:bg-white/10 hover:text-white'
                }`}
              >
                {slide.eyebrow}
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {slides.map((slide, index) => (
              <button
                key={`${slide.title}-preview`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`group overflow-hidden rounded-[1.25rem] border text-left transition ${
                  index === activeIndex
                    ? 'border-emerald-400 bg-white/10 shadow-[0_20px_40px_-25px_rgba(16,185,129,0.8)]'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div
                  className="h-20 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url('${slide.image}')` }}
                >
                  <div className="h-full w-full bg-gradient-to-t from-slate-950/80 to-slate-900/10" />
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
                    {slide.eyebrow}
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-white transition group-hover:text-emerald-100">
                    {slide.title}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
