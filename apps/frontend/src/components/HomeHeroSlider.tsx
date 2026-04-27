'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

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

  return (
    <div className="rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-[0_25px_80px_-30px_rgba(15,23,42,0.9)] backdrop-blur-sm">
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
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-white/10 bg-slate-950/90 px-4 py-4">
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
      </div>
    </div>
  );
}
