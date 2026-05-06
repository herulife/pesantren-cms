'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Sparkles } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { HomeSection } from '@/lib/website-builder';
import { resolveDisplayImageUrl, SettingsMap } from '@/lib/api';
import { asRecord, getButtons, getString } from './helpers';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

type HeroBlockProps = {
  section: HomeSection;
  settings: SettingsMap;
};

type BuilderHeroSlide = {
  title: string;
  subtitle: string;
  image_url: string;
};

const defaultSlide: BuilderHeroSlide = {
  title: 'Tahfidz, Adab, dan Ilmu dalam Satu Pembinaan',
  subtitle: 'Darussunnah Parung membina santri melalui hafalan Al-Quran, adab, dan pembelajaran terpadu.',
  image_url: '/assets/img/gedung.webp',
};

function getSlides(section: HomeSection) {
  const rawSlides = Array.isArray(asRecord(section.settings).slides) ? (asRecord(section.settings).slides as unknown[]) : [];
  const slides = rawSlides
    .filter((slide) => slide && typeof slide === 'object')
    .map((slide) => {
      const record = slide as Record<string, unknown>;
      return {
        title: typeof record.title === 'string' && record.title.trim() ? record.title : defaultSlide.title,
        subtitle: typeof record.subtitle === 'string' && record.subtitle.trim() ? record.subtitle : defaultSlide.subtitle,
        image_url: typeof record.image_url === 'string' && record.image_url.trim() ? record.image_url : defaultSlide.image_url,
      };
    });

  if (slides.length > 0) return slides;

  return [
    {
      title: getString(section, 'title', defaultSlide.title),
      subtitle: getString(section, 'subtitle', defaultSlide.subtitle),
      image_url: getString(section, 'image_url', defaultSlide.image_url),
    },
  ];
}

function overlayClass(overlay: string) {
  switch (overlay) {
    case 'none':
      return 'bg-slate-950/10';
    case 'soft':
      return 'bg-[linear-gradient(100deg,rgba(2,6,23,0.70)_8%,rgba(2,6,23,0.34)_44%,rgba(2,6,23,0.08)_100%)]';
    case 'strong':
      return 'bg-[linear-gradient(100deg,rgba(2,6,23,0.94)_8%,rgba(2,6,23,0.70)_48%,rgba(2,6,23,0.20)_100%)]';
    default:
      return 'bg-[linear-gradient(100deg,rgba(2,6,23,0.86)_8%,rgba(2,6,23,0.54)_44%,rgba(2,6,23,0.12)_100%)]';
  }
}

function heroHeightClass(mobileHeight: string) {
  switch (mobileHeight) {
    case 'tall':
      return 'min-h-[720px] lg:min-h-[820px]';
    case 'normal':
      return 'min-h-[660px] lg:min-h-[780px]';
    default:
      return 'min-h-[610px] sm:min-h-[660px] lg:min-h-[780px]';
  }
}

function buttonClass(style: string) {
  if (style === 'secondary') {
    return 'border border-white/15 bg-white/10 text-white backdrop-blur-md hover:bg-white/16';
  }
  if (style === 'ghost') {
    return 'border border-white/20 bg-transparent text-white hover:bg-white/10';
  }
  if (style === 'light') {
    return 'bg-white text-emerald-900 hover:bg-emerald-50';
  }
  return 'bg-emerald-600 text-white shadow-[0_18px_45px_-20px_rgba(16,185,129,0.6)] hover:bg-emerald-500';
}

function HeroContent({ section, slide, variant }: { section: HomeSection; slide: BuilderHeroSlide; variant: string }) {
  const buttons = getButtons(section);
  const kicker = getString(section, 'kicker', 'Darussunnah Parung');

  return (
    <div className={`max-w-3xl ${variant === 'minimal' ? 'mx-auto text-center' : ''}`}>
      <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-100 backdrop-blur-md sm:text-[11px]">
        <Sparkles size={14} />
        {kicker}
      </span>
      <h1 className="mt-4 max-w-[19ch] text-balance text-[2.45rem] font-black leading-[0.96] tracking-[-0.045em] text-white drop-shadow-[0_4px_18px_rgba(2,6,23,0.48)] sm:mt-6 sm:text-5xl md:text-[3.65rem] lg:text-[4rem]">
        {slide.title}
      </h1>
      <p className="mt-4 max-w-[34rem] text-sm font-medium leading-7 text-slate-200 drop-shadow-[0_2px_10px_rgba(2,6,23,0.46)] sm:mt-5 sm:text-base md:text-lg">
        {slide.subtitle}
      </p>
      <div className={`mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row ${variant === 'minimal' ? 'sm:justify-center' : ''}`}>
        {buttons.map((button) => (
          <Link
            key={`${button.label}-${button.url}`}
            href={button.url}
            className={`inline-flex items-center justify-center gap-2 self-start rounded-full px-5 py-3 text-xs font-bold transition-all hover:-translate-y-1 sm:px-8 sm:py-4 sm:text-sm ${buttonClass(button.style)} ${variant === 'minimal' ? 'sm:self-center' : ''}`}
          >
            {button.label} <ArrowRight size={16} />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function HeroBlock({ section, settings }: HeroBlockProps) {
  const variant = section.variant || 'slider';
  const parsedSlides = getSlides(section);
  const slides =
    variant === 'slider'
      ? parsedSlides
      : [
          {
            title: getString(section, 'title', parsedSlides[0]?.title || defaultSlide.title),
            subtitle: getString(section, 'subtitle', parsedSlides[0]?.subtitle || defaultSlide.subtitle),
            image_url: getString(section, 'image_url', parsedSlides[0]?.image_url || defaultSlide.image_url),
          },
        ];
  const overlay = getString(section, 'overlay', 'medium');
  const mobileHeight = getString(section, 'mobile_height', 'compact');
  const canSlide = variant === 'slider' && slides.length > 1;

  if (variant === 'psb-campaign') {
    const slide = slides[0] || defaultSlide;
    return (
      <section className={`relative overflow-hidden bg-slate-950 ${heroHeightClass(mobileHeight)}`}>
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${resolveDisplayImageUrl(slide.image_url)}')` }} />
        <div className={`absolute inset-0 ${overlayClass(overlay)}`} />
        <div className="container relative z-10 mx-auto grid min-h-[inherit] max-w-6xl items-center gap-8 px-4 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <HeroContent section={section} slide={slide} variant={variant} />
          <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 text-white shadow-[0_30px_80px_-45px_rgba(0,0,0,0.65)] backdrop-blur-md">
            <div className="inline-flex rounded-2xl bg-amber-400 p-3 text-amber-950">
              <CalendarDays size={24} />
            </div>
            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.28em] text-amber-200">Penerimaan Santri Baru</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">PSB Darussunnah</h2>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              {settings.psb_registration_note || 'Lengkapi biodata, dokumen, dan pembayaran pendaftaran melalui portal.'}
            </p>
            <Link href="/psb" className="mt-7 inline-flex rounded-full bg-amber-400 px-6 py-3 text-sm font-black text-amber-950 transition hover:bg-amber-300">
              Mulai Pendaftaran
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const renderSlide = (slide: BuilderHeroSlide) => (
    <div className={`relative overflow-hidden ${heroHeightClass(mobileHeight)}`}>
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${resolveDisplayImageUrl(slide.image_url)}')` }} />
      <div className={`absolute inset-0 ${overlayClass(overlay)}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.14),transparent_24%)]" />
      <div className={`container relative z-10 mx-auto grid min-h-[inherit] max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-24 ${variant === 'split' ? 'lg:grid-cols-[1fr_0.9fr]' : ''}`}>
        <HeroContent section={section} slide={slide} variant={variant} />
        {variant === 'split' ? (
          <div className="hidden overflow-hidden rounded-[2.2rem] border border-white/15 bg-white/10 p-3 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.72)] backdrop-blur-sm lg:block">
            <div className="relative h-[420px] overflow-hidden rounded-[1.7rem]">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${resolveDisplayImageUrl(slide.image_url)}')` }} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  if (canSlide) {
    return (
      <section className="relative overflow-hidden bg-slate-950">
        <Swiper
          modules={[Pagination, Autoplay, Navigation]}
          loop
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 6500, disableOnInteraction: false, pauseOnMouseEnter: true }}
          speed={950}
          className="hero-swiper"
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={`${slide.title}-${index}`}>{renderSlide(slide)}</SwiperSlide>
          ))}
        </Swiper>
      </section>
    );
  }

  return <section className="relative overflow-hidden bg-slate-950">{renderSlide(slides[0] || defaultSlide)}</section>;
}
