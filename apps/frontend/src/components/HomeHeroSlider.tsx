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

const slides: Slide[] = [
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

export default function HomeHeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);

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
    <div className="overflow-hidden rounded-[2.25rem] border border-white/70 bg-white/88 p-3 shadow-[0_35px_80px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between rounded-[1.5rem] border border-slate-200/80 bg-white/90 px-4 py-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">Sorotan Utama</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">Suasana dan informasi Pondok Darussunnah</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            aria-label="Slide sebelumnya"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            aria-label="Slide berikutnya"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white">
        <div
          className="relative min-h-[320px] bg-cover bg-center"
          style={{ backgroundImage: `url('${activeSlide.image}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/88 to-slate-950/20" />
          <div className="absolute inset-y-0 left-0 w-full max-w-[70%] bg-gradient-to-r from-white/98 via-white/86 to-white/0" />
          <div className="relative flex min-h-[320px] flex-col justify-end p-7 md:p-8">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700">
              {activeSlide.eyebrow}
            </p>
            <h3 className="mt-3 max-w-xl text-2xl font-black leading-tight text-slate-950 md:text-3xl">
              {activeSlide.title}
            </h3>
            <p className="mt-3 max-w-lg text-sm leading-7 text-slate-600">
              {activeSlide.description}
            </p>
            <div className="mt-5">
              <Link
                href={activeSlide.href}
                className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-emerald-700"
              >
                {activeSlide.cta}
              </Link>
            </div>
            <div className="mt-6 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${((activeIndex + 1) / slides.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-[linear-gradient(to_bottom,_#ffffff,_#f8fafc)] px-4 py-4">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="mr-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
              Slide {activeIndex + 1}/{slides.length}
            </span>
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`rounded-full px-4 py-2 text-left text-[11px] font-black uppercase tracking-[0.18em] transition ${
                  index === activeIndex
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
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
                    ? 'border-emerald-300 bg-white shadow-[0_20px_40px_-25px_rgba(16,185,129,0.35)]'
                    : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40'
                }`}
              >
                <div
                  className="h-20 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url('${slide.image}')` }}
                >
                  <div className="h-full w-full bg-gradient-to-t from-slate-950/45 to-transparent" />
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
                    {slide.eyebrow}
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-900 transition group-hover:text-emerald-800">
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
