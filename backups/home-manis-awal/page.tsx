'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  getNews,
  getAgendas,
  getGallery,
  getSettingsMap,
  News,
  Agenda,
  GalleryItem,
  SettingsMap,
  resolveDisplayImageUrl,
  formatGalleryAlbumTitle,
  getGallerySortTimestamp,
} from '@/lib/api';
import PublicLayout from '@/components/PublicLayout';
import { PublicEmptyState, PublicGridSkeleton } from '@/components/PublicState';
import PublicSectionIntro from '@/components/PublicSectionIntro';
import NewsCard from '@/components/NewsCard';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  Compass,
  GraduationCap,
  HeartHandshake,
  Landmark,
  MapPin,
  Newspaper,
  PhoneCall,
  School,
  ShieldCheck,
  Sparkles,
  Trees,
  Users,
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';
import { motion } from 'framer-motion';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.25, 0.4, 0.45, 1] as [number, number, number, number] },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  button_text: string;
  button_url: string;
};

type MaybeListResponse<T> = T[] | { data?: T[] | null } | null | undefined;

const institutionFacts = [
  { label: 'Berdiri', value: 'Sejak 2009', icon: <Sparkles size={18} /> },
  { label: 'Yayasan', value: 'Tunas Muda Qurani', icon: <Building2 size={18} /> },
  { label: 'NSPP', value: '510032011292', icon: <ShieldCheck size={18} /> },
  { label: 'Legalitas', value: 'AHU-038333.50.80.2014', icon: <Landmark size={18} /> },
];

const learningPillars = [
  {
    title: 'Berbasis Al-Quran',
    desc: 'Hafalan, adab, dan pembelajaran bertumpu pada Al-Quran.',
    icon: <BookOpen size={20} />,
  },
  {
    title: 'Kurikulum Terpadu',
    desc: 'Kurikulum pondok, DIKNAS, dan tahfidz berjalan seimbang.',
    icon: <GraduationCap size={20} />,
  },
  {
    title: 'Lingkungan Tertib',
    desc: 'Suasana belajar, ibadah, dan asrama dibina secara terarah.',
    icon: <Trees size={20} />,
  },
  {
    title: 'Pembinaan Menyeluruh',
    desc: 'Ilmu, akhlak, kemandirian, dan life skill tumbuh bersama.',
    icon: <HeartHandshake size={20} />,
  },
];

const focusAreas = [
  {
    title: 'Profil dan Visi',
    desc: 'Kenali sejarah pondok, visi-misi, identitas lembaga, dan arah pembinaan Darussunnah.',
    href: '/profil',
    icon: <School size={24} />,
  },
  {
    title: 'Program Pendidikan',
    desc: 'Lihat program unggulan, kurikulum terpadu, dan target pembinaan santri.',
    href: '/program',
    icon: <BookOpen size={24} />,
  },
  {
    title: 'Fasilitas Pondok',
    desc: 'Telusuri sarana belajar, asrama, ibadah, olahraga, dan ruang keterampilan santri.',
    href: '/facilities',
    icon: <Building2 size={24} />,
  },
  {
    title: 'Info Pendaftaran',
    desc: 'Masuk ke halaman PSB untuk melihat alur pendaftaran dan informasi santri baru.',
    href: '/psb',
    icon: <GraduationCap size={24} />,
  },
];

const featuredPrograms = [
  'Tarbiyah Aqidah',
  'Tsaqofah Islamiyah',
  'Akselerasi Tahfidz 30 Juz',
  'Tahfidz Hadits',
  'Mahasantri Bahasa Arab',
  'Life Skill',
];

const curriculumTracks = ['Kurikulum Pondok', 'Kurikulum DIKNAS', 'Kurikulum Tahfidz'];

const extracurriculars = ['Panahan', 'Basket', 'Futsal', 'Karate', 'Tata Boga', 'Teknik Otomotif'];

const institutionHighlights = [
  { value: '2009', label: 'Tahun Berdiri', icon: <Calendar size={18} /> },
  { value: '6', label: 'Program Unggulan', icon: <BookOpen size={18} /> },
  { value: '3', label: 'Kurikulum Inti', icon: <GraduationCap size={18} /> },
  { value: '11', label: 'Fasilitas Utama', icon: <Building2 size={18} /> },
  { value: '9', label: 'Ekskul Pilihan', icon: <Users size={18} /> },
];

const buildHeroSlideId = (overrides: Partial<HeroSlide> = {}, fallbackKey = 'slide') => {
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

const createHeroSlide = (overrides: Partial<HeroSlide> = {}, fallbackKey?: string): HeroSlide => ({
  id: buildHeroSlideId(overrides, fallbackKey),
  title: 'Pondok Tahfidz yang menumbuhkan ilmu, adab, dan kemandirian santri.',
  subtitle: 'Darussunnah Parung membina generasi muslim berkualitas dengan pendekatan Al-Quran dan manajemen terpadu.',
  image_url: '/assets/img/gedung.webp',
  button_text: 'Lihat Info PSB',
  button_url: '/psb',
  ...overrides,
});

const defaultHeroSlides = [
  createHeroSlide(
    {
      title: 'Membentuk generasi Qurani yang berilmu, berakhlak, dan siap berkarya.',
      subtitle:
        'Darussunnah Parung menghadirkan pembinaan Al-Quran, adab, akademik, dan kemandirian dalam satu lingkungan pesantren yang terarah.',
      image_url: '/assets/img/gedung.webp',
      button_text: 'Daftar Santri Baru',
      button_url: '/psb',
    },
    'default-slide-1'
  ),
  createHeroSlide(
    {
      title: 'Program tahfidz, kurikulum terpadu, dan pembinaan karakter berjalan seimbang.',
      subtitle:
        'Santri dibina melalui target hafalan, pembelajaran diniyah, pendidikan formal, serta kebiasaan hidup tertib yang konsisten.',
      image_url: '/assets/img/gedung.webp',
      button_text: 'Lihat Program',
      button_url: '/program',
    },
    'default-slide-2'
  ),
  createHeroSlide(
    {
      title: 'Lingkungan pondok yang mendukung ibadah, belajar, dan tumbuhnya life skill santri.',
      subtitle:
        'Fasilitas pondok dirancang untuk menunjang kenyamanan belajar, pembiasaan ibadah, kegiatan olahraga, dan keterampilan santri.',
      image_url: '/assets/img/gedung.webp',
      button_text: 'Lihat Fasilitas',
      button_url: '/facilities',
    },
    'default-slide-3'
  ),
];

function parseHeroSlides(settings: SettingsMap): HeroSlide[] {
  const raw = settings.hero_slides;

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const slides = parsed
          .filter((item) => item && typeof item === 'object')
          .map((item, index) =>
            createHeroSlide(
              {
                id: typeof item.id === 'string' ? item.id : undefined,
                title: typeof item.title === 'string' ? item.title : undefined,
                subtitle: typeof item.subtitle === 'string' ? item.subtitle : undefined,
                image_url: typeof item.image_url === 'string' ? item.image_url : undefined,
                button_text: typeof item.button_text === 'string' ? item.button_text : undefined,
                button_url: typeof item.button_url === 'string' ? item.button_url : undefined,
              },
              `slide-${index + 1}`
            )
          )
          .filter((slide) => slide.title || slide.subtitle || slide.image_url);

        if (slides.length > 1) {
          return slides;
        }

        if (slides.length === 1) {
          const [primarySlide] = slides;
          const supplementalSlides = defaultHeroSlides.filter((slide) => slide.id !== primarySlide.id);
          return [primarySlide, ...supplementalSlides];
        }
      }
    } catch {
      // Fallback ke banner lama jika JSON slider belum valid.
    }
  }

  const legacySlide = createHeroSlide(
    {
      title: settings.banner_title || undefined,
      subtitle: settings.banner_subtitle || undefined,
      image_url: settings.banner_image_url || undefined,
      button_text: settings.banner_button_text || undefined,
      button_url: settings.banner_button_url || undefined,
    },
    'slide-1'
  );

  const supplementalSlides = defaultHeroSlides.filter((slide) => slide.id !== legacySlide.id);
  return [legacySlide, ...supplementalSlides];
}

function extractListItems<T>(payload: MaybeListResponse<T>): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object' && Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

export default function LandingPage() {
  const [news, setNews] = useState<News[]>([]);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [settings, setSettings] = useState<SettingsMap>({});
  const [isLoading, setIsLoading] = useState(true);

  const galleryAlbums = useMemo(() => {
    const grouped = new Map<string, GalleryItem[]>();

    for (const item of gallery) {
      const key = item.album_slug || item.album_name || `single-${item.id}`;
      const current = grouped.get(key) || [];
      current.push(item);
      grouped.set(key, current);
    }

    return Array.from(grouped.entries())
      .map(([key, items]) => {
        const sorted = [...items].sort((a, b) => Number(b.is_album_cover) - Number(a.is_album_cover));
        const cover = sorted[0];
        return {
          key,
          title: formatGalleryAlbumTitle(cover.album_name || cover.title),
          slug: cover.album_slug || String(cover.id),
          category: cover.category,
          eventDate: cover.event_date,
          photoCount: items.length,
          cover,
        };
      })
      .sort((a, b) => getGallerySortTimestamp(b.eventDate, b.cover.created_at) - getGallerySortTimestamp(a.eventDate, a.cover.created_at))
      .slice(0, 3);
  }, [gallery]);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [newsData, agendasData, galleryData, settingsData] = await Promise.all([
          getNews(),
          getAgendas(),
          getGallery({ limit: 24, offset: 0 }),
          getSettingsMap({ silentUnauthorized: true }),
        ]);

        setNews(extractListItems(newsData).slice(0, 3));
        setAgendas(extractListItems(agendasData).slice(0, 3));
        setGallery(extractListItems(galleryData));
        setSettings(settingsData || {});
      } catch (error) {
        console.error('Error fetching landing page data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAll();
  }, []);

  const heroSlides = useMemo(() => parseHeroSlides(settings), [settings]);
  const canSlideHero = heroSlides.length > 1;

  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-slate-950">
        <Swiper
          modules={[Pagination, Autoplay, Navigation]}
          loop={canSlideHero}
          navigation={canSlideHero}
          allowTouchMove={canSlideHero}
          pagination={canSlideHero ? { clickable: true } : false}
          autoplay={canSlideHero ? { delay: 6500, disableOnInteraction: false, pauseOnMouseEnter: true } : false}
          speed={950}
          key={`hero-${heroSlides.length}`}
          className="hero-swiper"
        >
          {heroSlides.map((slide) => {
            const slideImage = resolveDisplayImageUrl(slide.image_url || '/assets/img/gedung.webp');
            return (
              <SwiperSlide key={slide.id}>
                <div className="relative min-h-[720px] overflow-hidden lg:min-h-[780px]">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${slideImage}')` }}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(2,6,23,0.9)_10%,rgba(2,6,23,0.58)_42%,rgba(2,6,23,0.12)_76%,rgba(2,6,23,0.02)_100%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.14),transparent_24%)]" />

                  <div className="container relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-16 lg:pb-24 lg:pt-24">
                    <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
                      <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.75, delay: 0.08 }}
                        className="max-w-3xl"
                      >
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-100 backdrop-blur-md">
                          <Sparkles size={14} />
                          Pondok Pesantren Darussunnah Parung
                        </span>
                        <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[1.02] tracking-tight text-white md:text-6xl lg:text-[4.25rem]">
                          {slide.title}
                        </h1>
                        <p className="mt-5 max-w-xl text-base leading-8 text-slate-200 md:text-lg">{slide.subtitle}</p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                          <Link
                            href={slide.button_url || '/psb'}
                            className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-[0_18px_45px_-20px_rgba(16,185,129,0.6)] transition-all hover:-translate-y-1 hover:bg-emerald-500 sm:px-8 sm:py-4 sm:text-sm"
                          >
                            {slide.button_text || 'Lihat Info PSB'} <ArrowRight size={16} />
                          </Link>
                          <Link
                            href="/program"
                            className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-white/15 bg-white/10 px-5 py-3 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-white/16 sm:px-8 sm:py-4 sm:text-sm"
                          >
                            Lihat Program
                          </Link>
                        </div>
                        <div className="mt-8 flex flex-wrap gap-3">
                          {learningPillars.slice(0, 3).map((pillar) => (
                            <span
                              key={pillar.title}
                              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/18 px-4 py-2 text-xs font-semibold text-slate-100 backdrop-blur-sm"
                            >
                              <span className="text-emerald-300">{pillar.icon}</span>
                              {pillar.title}
                            </span>
                          ))}
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.16 }}
                        className="hidden lg:block"
                      >
                        <div className="h-[420px]" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

        <div className="relative z-20 -mt-20 px-4 lg:-mt-16">
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-4 rounded-[2rem] border border-white/60 bg-white/92 p-5 shadow-[0_30px_70px_-35px_rgba(15,23,42,0.32)] backdrop-blur-xl md:grid-cols-4 md:p-6">
              {institutionFacts.map((fact) => (
                <div key={fact.label} className="rounded-[1.5rem] border border-slate-100 bg-white px-5 py-4">
                  <div className="mb-3 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                    {fact.icon}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{fact.label}</p>
                  <p className="mt-2 text-sm font-bold text-slate-800">{fact.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f5f7f3_0%,#ffffff_24%,#ffffff_100%)] pb-20 pt-10 md:pt-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-50/80 to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-10 h-28 w-28 -translate-x-1/2 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="container relative mx-auto max-w-6xl px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUpVariant}
            className="mb-10 border-b border-slate-200/80 pb-8 md:flex md:items-end md:justify-between md:gap-6"
          >
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-600">Jelajahi Darussunnah</p>
              <h2 className="mt-3 max-w-3xl text-3xl font-black leading-[1.02] tracking-[-0.03em] text-slate-900 md:text-[3.35rem]">
                Mulai dari sisi Darussunnah yang paling ingin Anda kenali lebih dulu.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 md:text-base">
                Profil, program, fasilitas, dan pendaftaran kami susun lebih ringkas agar perjalanan
                mengenal pondok terasa lebih nyaman.
              </p>
            </div>
            <Link
              href="/psb"
              className="mt-5 inline-flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-bold text-emerald-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-800 md:mt-0"
            >
              Lihat info pendaftaran <ArrowRight size={16} />
            </Link>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid gap-6 md:grid-cols-2 xl:grid-cols-4"
          >
            {focusAreas.map((item) => (
              <motion.div key={item.title} variants={fadeUpVariant}>
                <Link
                  href={item.href}
                  className="group block h-full rounded-[2rem] border border-emerald-100/70 bg-[linear-gradient(180deg,#ffffff_0%,#f4faf6_100%)] p-7 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.16)] transition-all duration-300 hover:-translate-y-2 hover:border-emerald-200 hover:shadow-[0_24px_60px_-30px_rgba(16,185,129,0.18)]"
                >
                  <div className="mb-5 inline-flex rounded-2xl bg-white p-4 text-emerald-600 ring-1 ring-emerald-100 transition-colors group-hover:bg-emerald-500 group-hover:text-white group-hover:ring-emerald-500">
                    {item.icon}
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.desc}</p>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
                    Selengkapnya <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUpVariant}
            className="overflow-hidden rounded-[2.25rem] border border-emerald-900/70 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 px-6 py-8 text-white shadow-[0_30px_80px_-35px_rgba(6,78,59,0.65)] md:px-8"
          >
            <div className="grid gap-8 lg:grid-cols-[1.1fr_1.9fr] lg:items-center">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-200">Darussunnah dalam Angka</p>
                <h2 className="mt-3 text-2xl font-black tracking-tight md:text-4xl">
                  Komitmen pembinaan yang tumbuh konsisten dan terarah.
                </h2>
                <Link
                  href="/profil"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-emerald-900 transition-all hover:-translate-y-0.5"
                >
                  Lihat profil lengkap <ArrowRight size={16} />
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {institutionHighlights.map((item) => (
                  <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-black/10 px-4 py-5 backdrop-blur-sm">
                    <div className="mb-4 inline-flex rounded-2xl bg-white/10 p-3 text-emerald-200">
                      {item.icon}
                    </div>
                    <p className="text-2xl font-black tracking-tight text-white">{item.value}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-100/80">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-slate-200/70 bg-[#f6f7f4] py-16 md:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.10),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(15,118,110,0.08),_transparent_28%)]" />
        <div className="container relative z-10 mx-auto max-w-6xl px-4">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-emerald-700">
                <Compass size={14} />
                Profil Singkat
              </span>
              <h2 className="mt-6 text-3xl font-black leading-[1.02] tracking-[-0.03em] text-slate-900 md:text-[3.1rem]">
                Darussunnah hadir sebagai ruang pembinaan Qurani yang serius, hangat, dan terarah.
              </h2>
              <p className="mt-6 text-base leading-8 text-slate-600 md:text-lg">
                Pondok Pesantren Tahfidz Al Quran Darussunnah didirikan pada tahun 2009 di Kp. Lengkong
                Barang RT.01/02, Ds. Iwul, Kec. Parung, Bogor. Saat ini pondok juga tengah membangun
                fasilitas belajar santri putra beserta masjid di Kp. Muara Jaya RT.01/05, Ciaureuten Ilir,
                Bogor sebagai penguatan pusat pembinaan generasi muslim masa depan.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white">
                  <MapPin size={16} className="text-emerald-300" />
                  Parung, Bogor 16330
                </span>
                <a
                  href="tel:081382410582"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
                >
                  <PhoneCall size={16} className="text-emerald-500" />
                  0813 8241 0582
                </a>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
              className="rounded-[2rem] border border-emerald-100/80 bg-white p-8 shadow-[0_30px_70px_-35px_rgba(15,23,42,0.18)]"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-600">Arah Pembinaan</p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                Fokus utama pondok dirancang agar santri tumbuh utuh.
              </h3>
              <div className="mt-6 space-y-4">
                {[
                  'Menjadikan Al-Quran sebagai media utama pembelajaran.',
                  'Membentuk akhlak karimah dan kemandirian santri.',
                  'Mengembangkan intelektual, kreativitas, dan jiwa kaderisasi umat.',
                ].map((point) => (
                  <div key={point} className="flex gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 px-5 py-4">
                    <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                      <CheckCircle2 size={18} />
                    </div>
                    <p className="text-sm leading-7 text-slate-600">{point}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/profil"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-emerald-600 transition-colors hover:text-emerald-700"
              >
                Lihat profil dan visi-misi lengkap <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white py-16 md:py-20">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
              <PublicSectionIntro
                eyebrow="Program Inti"
                title="Program unggulan yang menjadi fondasi pembinaan santri"
                description="Pembinaan utama Darussunnah menguatkan hafalan, adab, wawasan Islam, dan kesiapan hidup santri secara seimbang."
              />
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {featuredPrograms.slice(0, 4).map((program) => (
                  <div key={program} className="rounded-[1.5rem] border border-slate-100 bg-[#f8faf8] px-5 py-4 shadow-sm">
                    <p className="text-sm font-bold text-slate-800">{program}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {curriculumTracks.map((track) => (
                  <span
                    key={track}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-700"
                  >
                    {track}
                  </span>
                ))}
              </div>
              <Link
                href="/program"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
              >
                Buka halaman program <ArrowRight size={16} />
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
              className="rounded-[2rem] border border-emerald-900/80 bg-[linear-gradient(180deg,#0f172a_0%,#10251d_100%)] p-8 text-white shadow-[0_35px_80px_-35px_rgba(15,23,42,0.35)]"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-200">Ekstrakurikuler</p>
              <h3 className="mt-3 text-[2rem] font-black leading-[1.02] tracking-[-0.03em] sm:text-[2.35rem]">
                Aktivitas penunjang yang membuat santri aktif, terampil, dan percaya diri.
              </h3>
              <div className="mt-8 flex flex-wrap gap-3">
                {extracurriculars.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-950 py-16 md:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.10),_transparent_24%)]" />
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} className="relative z-10">
            <PublicSectionIntro
              eyebrow="Potret Kegiatan"
              title="Sekilas kehidupan belajar dan pembinaan di Darussunnah"
              description="Lihat suasana belajar, ibadah, kebersamaan, dan ritme keseharian santri melalui dokumentasi kegiatan pondok."
              actionHref="/galeri"
              actionLabel="Lihat galeri lengkap"
              theme="dark"
            />
          </motion.div>

          {isLoading ? (
            <PublicGridSkeleton
              count={3}
              className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
              itemClassName="h-52 rounded-[1.75rem]"
            />
          ) : galleryAlbums.length > 0 ? (
            <div className="relative z-10 mt-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <Link
                href={`/galeri/${galleryAlbums[0].slug}`}
                className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_25px_55px_-35px_rgba(0,0,0,0.45)] transition-all hover:-translate-y-1 hover:shadow-[0_30px_65px_-35px_rgba(0,0,0,0.55)]"
              >
                <div className="relative h-[340px] sm:h-[420px]">
                  <Image
                    src={resolveDisplayImageUrl(galleryAlbums[0].cover.image_url)}
                    alt={galleryAlbums[0].title}
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
                    <p className="text-[10px] font-black uppercase tracking-[0.32em] text-emerald-200">{galleryAlbums[0].category}</p>
                    <h3 className="mt-3 max-w-xl text-2xl font-black uppercase tracking-tight sm:text-3xl">{galleryAlbums[0].title}</h3>
                    <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-100">
                      <span className="rounded-full bg-white/10 px-3 py-2 backdrop-blur-sm">{galleryAlbums[0].photoCount} foto</span>
                      {galleryAlbums[0].eventDate ? <span className="rounded-full bg-white/10 px-3 py-2 backdrop-blur-sm">{galleryAlbums[0].eventDate}</span> : null}
                    </div>
                  </div>
                </div>
              </Link>

              <div className="grid gap-4">
                {galleryAlbums.slice(1, 3).map((album) => (
                  <Link
                    key={album.key}
                    href={`/galeri/${album.slug}`}
                    className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 shadow-[0_18px_42px_-30px_rgba(0,0,0,0.45)] transition-all hover:-translate-y-1 hover:shadow-[0_26px_50px_-28px_rgba(0,0,0,0.52)]"
                  >
                    <div className="relative h-[160px] sm:h-[200px]">
                      <Image
                        src={resolveDisplayImageUrl(album.cover.image_url)}
                        alt={album.title}
                        fill
                        unoptimized
                        sizes="(max-width: 1024px) 100vw, 40vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                        <p className="text-[9px] font-black uppercase tracking-[0.28em] text-emerald-200">{album.category}</p>
                        <h3 className="mt-2 line-clamp-2 text-sm font-black uppercase tracking-tight sm:text-base">{album.title}</h3>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-100">{album.photoCount} foto</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-8">
              <PublicEmptyState
                icon={Camera}
                title="Belum ada dokumentasi galeri"
                description="Album kegiatan terbaru akan muncul di sini setelah dipublikasikan."
                className="border-white/10 bg-white/6 shadow-[0_30px_70px_-40px_rgba(0,0,0,0.6)] backdrop-blur-sm"
                iconClassName="text-emerald-200/70"
                titleClassName="text-white"
                descriptionClassName="text-slate-300"
              />
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-slate-200/70 bg-[#fcfcfa] py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
            <PublicSectionIntro
              eyebrow="Berita Pondok"
              title="Kabar terbaru dari lingkungan Darussunnah"
              description="Informasi kegiatan, pengumuman, dan perkembangan terbaru pondok yang layak Anda ikuti."
              actionHref="/news"
              actionLabel="Semua berita"
            />
          </motion.div>

          {isLoading ? (
            <PublicGridSkeleton
              count={2}
              className="mt-8 grid grid-cols-1 gap-6"
              itemClassName="h-56 rounded-[1.75rem]"
            />
          ) : news.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-6">
              <div className="rounded-[2rem] border border-slate-100 bg-white p-4 shadow-[0_22px_50px_-35px_rgba(15,23,42,0.14)]">
                <NewsCard news={news[0]} />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {news.slice(1, 3).map((item) => (
                  <NewsCard key={item.id} news={item} />
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-8">
              <PublicEmptyState
                icon={Newspaper}
                title="Belum ada berita"
                description="Berita terbaru pondok akan tampil di bagian ini."
                className="bg-slate-50"
              />
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-[#f6f7f3] py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
            <PublicSectionIntro
              eyebrow="Agenda Mendatang"
              title="Agenda terdekat di lingkungan Darussunnah"
              description="Pantau kegiatan pondok, jadwal penting, dan informasi acara yang akan datang."
              actionHref="/agendas"
              actionLabel="Lihat semua agenda"
            />
          </motion.div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {isLoading ? (
              <PublicGridSkeleton count={3} className="grid gap-4 md:grid-cols-3 col-span-full" itemClassName="h-44 rounded-[1.75rem]" />
            ) : agendas.length > 0 ? (
              agendas.map((agenda) => {
                const date = new Date(agenda.start_date);
                return (
                  <div key={agenda.id} className="rounded-[1.75rem] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.16)] backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-200">
                        <span className="text-[9px] font-black uppercase">{date.toLocaleString('id-ID', { month: 'short' })}</span>
                        <span className="text-lg font-black">{date.getDate()}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Agenda</p>
                        <h3 className="mt-1 line-clamp-2 text-lg font-black tracking-tight text-slate-900">{agenda.title}</h3>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-slate-500">
                      {agenda.location ? (
                        <div className="flex items-center gap-2">
                          <MapPin size={15} className="text-emerald-500" />
                          {agenda.location}
                        </div>
                      ) : null}
                      {agenda.time_info ? (
                        <div className="flex items-center gap-2">
                          <Calendar size={15} className="text-emerald-500" />
                          {agenda.time_info}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="md:col-span-3">
                <PublicEmptyState
                  icon={Calendar}
                  title="Belum ada agenda terbaru"
                  description="Agenda pondok yang akan datang akan ditampilkan di sini."
                  className="bg-white"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#0f172a_0%,#0d3b2e_100%)] py-24 lg:py-28">
        <div className="absolute -top-40 right-0 h-72 w-72 rounded-full bg-emerald-300/20 blur-[100px]" />
        <div className="absolute -bottom-40 left-0 h-72 w-72 rounded-full bg-teal-300/15 blur-[100px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/30 to-transparent" />
        <div className="container relative z-10 mx-auto max-w-5xl px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-200">Langkah Berikutnya</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-6xl">
              Siap mengenal Darussunnah lebih jauh?
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-emerald-50/90 md:text-xl">
              Mulai dari profil pondok, program, dan fasilitas, lalu lanjutkan ke halaman pendaftaran
              saat Anda sudah merasa cocok dengan arah pembinaannya.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/psb"
                className="inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-black text-emerald-800 shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:-translate-y-1"
              >
                Lihat Info PSB <ArrowRight size={18} />
              </Link>
              <Link
                href="/profil"
                className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-8 py-4 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/15"
              >
                Mulai dari profil pondok
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
