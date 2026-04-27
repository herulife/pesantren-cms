'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { getSettingsMap, resolveDisplayImageUrl, SettingsMap } from '@/lib/api';
import HomeHeroSlider from '@/components/HomeHeroSlider';

type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  button_text: string;
  button_url: string;
};

const HERO_SLIDES_KEY = 'hero_slides';

const createSlide = (overrides: Partial<HeroSlide> = {}, fallbackKey = 'slide-1'): HeroSlide => ({
  id: overrides.id || fallbackKey,
  title: overrides.title || 'Merekam Jejak Intelektual & Spiritual',
  subtitle:
    overrides.subtitle ||
    'Pendidikan tahfidz yang menumbuhkan ilmu, adab, dan kesiapan berdakwah di tengah umat.',
  image_url: overrides.image_url || '/assets/img/gedung.webp',
  button_text: overrides.button_text || 'Daftar Sekarang',
  button_url: overrides.button_url || '/psb',
});

function parseSlides(raw: string | undefined, settings: SettingsMap): HeroSlide[] {
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, index) =>
          createSlide(
            {
              id: typeof item?.id === 'string' ? item.id : `slide-${index + 1}`,
              title: typeof item?.title === 'string' ? item.title : '',
              subtitle: typeof item?.subtitle === 'string' ? item.subtitle : '',
              image_url: typeof item?.image_url === 'string' ? item.image_url : '',
              button_text: typeof item?.button_text === 'string' ? item.button_text : '',
              button_url: typeof item?.button_url === 'string' ? item.button_url : '',
            },
            `slide-${index + 1}`
          )
        );
      }
    } catch {
      // Fallback to banner fields below.
    }
  }

  return [
    createSlide({
      title: settings.banner_title || undefined,
      subtitle: settings.banner_subtitle || undefined,
      image_url: settings.banner_image_url || undefined,
      button_text: settings.banner_button_text || undefined,
      button_url: settings.banner_button_url || undefined,
    }),
  ];
}

export default function HomepageHero() {
  const [settings, setSettings] = useState<SettingsMap>({});

  useEffect(() => {
    async function fetchSettings() {
      const data = await getSettingsMap({ silentUnauthorized: true });
      setSettings(data || {});
    }

    void fetchSettings();
  }, []);

  const slides = useMemo(
    () => parseSlides(settings[HERO_SLIDES_KEY], settings),
    [settings]
  );

  const primarySlide = slides[0] || createSlide();
  const heroImage = resolveDisplayImageUrl(primarySlide.image_url || '/assets/img/gedung.webp');

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url('${heroImage}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-emerald-950/70" />
      <div className="absolute inset-0 opacity-25">
        <div className="absolute -left-10 top-12 h-40 w-40 rounded-full bg-emerald-300 blur-3xl" />
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-cyan-300 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-yellow-200 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-24 lg:min-h-[680px] lg:py-28">
        <div className="max-w-4xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            Pondok Pesantren Tahfidz
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            {primarySlide.title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-emerald-50/90 sm:text-lg">
            {primarySlide.subtitle}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={primarySlide.button_url}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50"
            >
              {primarySlide.button_text}
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/profil"
              className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Profil Pondok
            </Link>
          </div>
        </div>

        <div className="mt-12">
          <HomeHeroSlider slides={slides} />
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
              Fokus Utama
            </p>
            <p className="mt-3 text-lg font-bold text-white">Tahfidz, Adab, dan Kemandirian</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
              Lingkungan
            </p>
            <p className="mt-3 text-lg font-bold text-white">Pembinaan disiplin dalam suasana pesantren</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
              Akses Cepat
            </p>
            <p className="mt-3 text-lg font-bold text-white">Info PSB, program, dan berita terbaru</p>
          </div>
        </div>
      </div>
    </section>
  );
}
