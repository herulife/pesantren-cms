'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  getNews,
  getAgendas,
  getGallery,
  getPublicSettingsMap,
  getPrograms,
  getVideos,
  getTeachers,
  getFacilities,
  News,
  Agenda,
  GalleryItem,
  Program,
  SettingsMap,
  Video,
  Teacher,
  Facility,
  resolveDisplayImageUrl,
  formatGalleryAlbumTitle,
  getGallerySortTimestamp,
  getYouTubeThumbnailUrl,
  extractYouTubeVideoId,
} from '@/lib/api';
import PublicLayout from '@/components/PublicLayout';
import HomePageRenderer from '@/components/website-builder/HomePageRenderer';
import { PublicEmptyState, PublicGridSkeleton } from '@/components/PublicState';
import NewsCard from '@/components/NewsCard';


import TimelineSantri from '@/components/TimelineSantri';
import AccordionFAQ from '@/components/AccordionFAQ';
import VideoEmbed from '@/components/VideoEmbed';
import FasilitasGallery from '@/components/FasilitasGallery';
import { parseWebsiteBuilderState } from '@/lib/website-builder';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  GraduationCap,
  Heart,
  Landmark,
  MapPin,
  Newspaper,
  PhoneCall,
  PlayCircle,
  School,
  ShieldCheck,
  Sparkles,

  Users,
  Trophy,
  Award,
  Target,
  Quote,
  BookCopy,
  Clock,
  Library,
  Monitor,
  Dumbbell,
  Shield,
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation, EffectFade } from 'swiper/modules';
import { motion } from 'framer-motion';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

// HIDDEN SECTION TOGGLE: ganti ke true untuk menampilkan section "Kehidupan Santri / Rutinitas Harian"
const SHOW_RUTINITAS_SECTION = false;

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

const faqData = [
  { q: 'Bagaimana cara mendaftar di Darussunnah?', a: 'Pendaftaran dilakukan secara online melalui halaman PSB. Isi formulir, unggah dokumen, dan lakukan pembayaran biaya pendaftaran.' },
  { q: 'Apa saja program unggulan yang ditawarkan?', a: 'Darussunnah memiliki program Tahfidz Al-Quran, Kajian Kitab Kuning, Tasmi\' & Murajaah, dan Halaqah Pembinaan, dengan kurikulum terpadu Pondok, DIKNAS, dan Tahfidz.' },
  { q: 'Berapa biaya pendaftaran dan SPP?', a: 'Informasi biaya pendaftaran dan SPP dapat dilihat di halaman PSB. Kami berusaha memberikan biaya pendidikan yang terjangkau.' },
  { q: 'Apakah ada asrama untuk santri?', a: 'Ya, Darussunnah menyediakan asrama putra dan putri dengan pengawasan 24 jam oleh pengasuh pondok.' },
  { q: 'Bagaimana perkembangan hafalan santri dipantau?', a: 'Setiap santri memiliki target hafalan harian dengan setoran kepada ustadz pembimbing, dipantau melalui buku murojaah dan evaluasi pekanan.' },
  { q: 'Apakah Darussunnah menerima santri dari luar kota?', a: 'Tentu. Santri berasal dari berbagai daerah. Tersedia asrama bagi santri yang tinggal di pondok.' },
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
  title: 'Tahfidz, Adab, dan Ilmu dalam Satu Pembinaan',
  subtitle: 'Darussunnah Parung membina santri melalui hafalan Al-Quran, adab, dan pembelajaran terpadu.',
  image_url: '/assets/img/gedung.webp',
  button_text: 'Lihat Info PSB',
  button_url: '/psb',
  ...overrides,
});

const formatAgendaDay = (dateStr: string) => new Date(dateStr).getDate();

const formatAgendaMonth = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', { month: 'short' });

const formatAgendaFullDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const defaultHeroSlides = [
  createHeroSlide(
    {
      title: 'Menghafal Al-Quran, Tumbuh dengan Adab',
      subtitle:
        'Lingkungan pesantren yang menata hafalan, ilmu, ibadah, dan kemandirian santri.',
      image_url: '/assets/img/tahfidz.jpg',
      button_text: 'Daftar Santri Baru',
      button_url: '/psb',
    },
    'default-slide-1'
  ),
  createHeroSlide(
    {
      title: 'Tahfidz dan Kurikulum yang Seimbang',
      subtitle:
        'Target hafalan, diniyah, akademik, dan karakter berjalan dalam ritme pembinaan harian.',
      image_url: '/assets/img/belajar-kitab.jpg',
      button_text: 'Lihat Program',
      button_url: '/program',
    },
    'default-slide-2'
  ),
  createHeroSlide(
    {
      title: 'Belajar, Beribadah, dan Mandiri',
      subtitle:
        'Fasilitas pondok mendukung kegiatan ibadah, belajar, olahraga, dan life skill santri.',
      image_url: '/assets/img/asrama.jpg',
      button_text: 'Lihat Fasilitas',
      button_url: '/facilities',
    },
    'default-slide-3'
  ),
  createHeroSlide(
    {
      title: 'Pondok Pesantren Tahfidz Darussunnah Parung',
      subtitle:
        'Membangun generasi Qurani yang berakhlak mulia, berilmu, dan mandiri.',
      image_url: '/assets/img/khalaqoh.jpg',
      button_text: 'Tentang Kami',
      button_url: '/profil',
    },
    'default-slide-4'
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

  const bannerValues = [
    settings.banner_title,
    settings.banner_subtitle,
    settings.banner_image_url,
    settings.banner_button_text,
    settings.banner_button_url,
  ];
  const hasBannerContent = bannerValues.some(
    (value) => typeof value === 'string' && value.trim().length > 0
  );

  if (!hasBannerContent) {
    return defaultHeroSlides;
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

const fallbackPrograms: Program[] = [
  { id: 1, title: 'Tahfidz Al-Quran', slug: 'tahfidz', category: 'Unggulan', excerpt: 'Target hafalan 5 juz per tahun dengan setoran harian dan murojaah berkala.', content: '', image_url: '/assets/img/tahfidz.jpg', is_featured: true, order_index: 1 },
  { id: 2, title: 'Kajian Kitab Kuning', slug: 'kajian-kitab', category: 'Unggulan', excerpt: 'Pembiasaan membaca, memahami, dan mengkaji kitab kuning sebagai fondasi diniyah.', content: '', image_url: '/assets/img/belajar-kitab.jpg', is_featured: true, order_index: 2 },
  { id: 3, title: 'Tasmi\' & Murajaah', slug: 'tasmi-murajaah', category: 'Unggulan', excerpt: 'Penguatan bacaan, kelancaran hafalan, dan ketelitian melalui tasmi\' bergilir.', content: '', image_url: '/assets/img/tasmi.jpg', is_featured: true, order_index: 3 },
  { id: 4, title: 'Halaqah Pembinaan', slug: 'halaqah', category: 'Karakter', excerpt: 'Ruang pembentukan karakter, kedisiplinan, dan adab santri dalam lingkaran halaqah.', content: '', image_url: '/assets/img/khalaqoh.jpg', is_featured: true, order_index: 4 },
  { id: 5, title: 'Olahraga & Keterampilan', slug: 'olahraga', category: 'Ekskul', excerpt: 'Panahan, basket, futsal, karate, dan keterampilan hidup seperti tata boga dan otomotif.', content: '', image_url: '/assets/img/manasik.jpg', is_featured: false, order_index: 5 },
  { id: 6, title: 'Kemandirian Santri', slug: 'kemandirian', category: 'Karakter', excerpt: 'Pembiasaan hidup mandiri, tertib, dan saling menjaga dalam lingkungan asrama.', content: '', image_url: '/assets/img/asrama.jpg', is_featured: false, order_index: 6 },
];

const programIcons: Record<string, React.ReactNode> = {
  'Tahfidz Al-Quran': <BookCopy size={28} />,
  'Kajian Kitab Kuning': <BookOpen size={28} />,
  'Tasmi\' & Murajaah': <BookOpen size={28} />,
  'Halaqah Pembinaan': <Users size={28} />,
  'Olahraga & Keterampilan': <Dumbbell size={28} />,
  'Kemandirian Santri': <Target size={28} />,
};

const categoryColors: Record<string, string> = {
  Unggulan: 'bg-primary/10 text-primary',
  Karakter: 'bg-secondary/10 text-secondary',
  Ekskul: 'bg-accent/10 text-accent-dark',
};

export default function LandingPage() {
  const [news, setNews] = useState<News[]>([]);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [settings, setSettings] = useState<SettingsMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'gallery' | 'video'>('gallery');

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

  const videoSeries = useMemo(() => {
    const grouped = new Map<string, Video[]>();

    for (const video of videos) {
      const key = video.series_slug || video.series_name || `single-${video.id}`;
      const current = grouped.get(key) || [];
      current.push(video);
      grouped.set(key, current);
    }

    return Array.from(grouped.entries())
      .map(([key, items]) => {
        const sorted = [...items].sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
        const lead = sorted[0];
        return {
          key,
          title: formatGalleryAlbumTitle(lead.series_name || lead.title),
          slug: lead.series_slug || String(lead.id),
          eventDate: lead.event_date,
          count: items.length,
          lead,
        };
      })
      .sort((a, b) => getGallerySortTimestamp(b.eventDate, b.lead.created_at) - getGallerySortTimestamp(a.eventDate, a.lead.created_at))
      .slice(0, 3);
  }, [videos]);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [newsData, agendasData, galleryData, videosData, programsData, teachersData, facilitiesData, settingsData] = await Promise.all([
          getNews(),
          getAgendas(),
          getGallery({ limit: 24, offset: 0 }),
          getVideos({ limit: 24, offset: 0 }),
          getPrograms(),
          getTeachers(),
          getFacilities(),
          getPublicSettingsMap(),
        ]);

        setNews(extractListItems(newsData).slice(0, 3));
        setAgendas(extractListItems(agendasData).slice(0, 3));
        setGallery(extractListItems(galleryData));
        setVideos(extractListItems(videosData));
        setPrograms(extractListItems(programsData));
        setTeachers(extractListItems(teachersData));
        setFacilities(extractListItems(facilitiesData));
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
  const builderState = useMemo(() => parseWebsiteBuilderState(settings), [settings]);

  const displayPrograms = useMemo(() => {
    if (programs.length > 0) {
      return [...programs]
        .sort((a, b) => a.order_index - b.order_index)
        .slice(0, 6);
    }
    return fallbackPrograms;
  }, [programs]);

  const profileVideoUrl = settings.profile_video_url || '';
  const profileVideoId = extractYouTubeVideoId(profileVideoUrl);

  if (builderState.enabled) {
    return (
      <PublicLayout>
        <HomePageRenderer
          layout={builderState.homePublished}
          dataSources={{
            news,
            agendas,
            programs: displayPrograms,
            galleryAlbums,
            videoSeries,
            settings,
            isLoading,
          }}
        />
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* ===== 1. HERO ===== */}
      <section className="relative overflow-hidden bg-primary-dark h-screen">
        <Swiper
          modules={[Pagination, Autoplay, Navigation, EffectFade]}
          loop={canSlideHero}
          navigation={{
            nextEl: '.hero-next',
            prevEl: '.hero-prev',
          }}
          allowTouchMove={canSlideHero}
          pagination={canSlideHero ? { type: 'progressbar' } : false}
          autoplay={canSlideHero ? { delay: 7000, disableOnInteraction: false, pauseOnMouseEnter: true } : false}
          effect="fade"
          speed={1200}
          key={`hero-${heroSlides.length}`}
          className="hero-swiper h-full"
        >
          {heroSlides.map((slide) => {
            const slideImage = resolveDisplayImageUrl(slide.image_url || '/assets/img/gedung.webp');
            const isPoster = !slide.title;
            return (
              <SwiperSlide key={slide.id}>
                <div className={`relative h-screen min-h-[610px] sm:min-h-[660px] lg:min-h-[780px] ${isPoster ? 'bg-primary-dark' : ''}`}>
                  <div
                    className="absolute inset-0 bg-no-repeat bg-cover bg-center"
                    style={{ backgroundImage: `url('${slideImage}')` }}
                  />
                  {!isPoster && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/40 via-primary/20 to-transparent" />
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(15,109,63,0.1),transparent_50%)]" />
                    </>
                  )}

                  {slide.title ? (
                    <div className="container relative z-10 mx-auto max-w-6xl px-4 h-full flex items-center">
                      <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.75, delay: 0.08 }}
                        className="max-w-2xl"
                      >
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-white backdrop-blur-md">
                          <Sparkles size={14} />
                          Darussunnah Parung
                        </span>
                        <h1 className="mt-6 text-[clamp(2.5rem,7vw,5.5rem)] font-black leading-[0.92] tracking-[-0.04em] text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                          {slide.title}
                        </h1>
                        <p className="mt-6 text-lg md:text-xl leading-relaxed text-white/80 max-w-[36rem]">
                          {slide.subtitle}
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row gap-4">
                          <Link
                            href={slide.button_url || '/psb'}
                            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-primary-dark transition-all hover:-translate-y-1 hover:bg-white/90"
                          >
                            {slide.button_text || 'Lihat Info PSB'} <ArrowRight size={18} />
                          </Link>
                          <Link
                            href="/program"
                            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-8 py-4 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/15"
                          >
                            Lihat Program
                          </Link>
                        </div>
                      </motion.div>
                    </div>
                  ) : isPoster && slide.button_url ? (
                    <div className="absolute inset-x-0 bottom-10 z-10 flex justify-center">
                      <Link
                        href={slide.button_url}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-primary-dark shadow-xl shadow-black/30 transition-all hover:-translate-y-1 hover:bg-white/90"
                      >
                        {slide.button_text || 'Daftar PSB'} <ArrowRight size={18} />
                      </Link>
                    </div>
                  ) : null}
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>

        {canSlideHero && (
          <>
            <button className="hero-prev absolute left-6 top-1/2 -translate-y-1/2 z-20 hidden lg:flex items-center justify-center w-12 h-12 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all">
              <ChevronLeft size={24} />
            </button>
            <button className="hero-next absolute right-6 top-1/2 -translate-y-1/2 z-20 hidden lg:flex items-center justify-center w-12 h-12 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all">
              <ChevronRight size={24} />
            </button>
          </>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-primary-dark via-primary-dark/60 to-transparent" />
      </section>

      {/* ===== 2. TENTANG ===== */}
      <section className="bg-white py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                <Compass size={14} />
                Tentang Darussunnah
              </span>
              <h2 className="mt-6 font-headline text-4xl md:text-5xl font-black text-foreground leading-[1.05]">
                Pondok Pesantren Tahfidz Al-Quran yang membina generasi Qurani sejak 2009.
              </h2>
              <p className="mt-6 text-base leading-8 text-foreground/60">
                Pondok Pesantren Tahfidz Al Quran Darussunnah didirikan pada tahun 2009 di Kp. Lengkong
                Barang, Ds. Iwul, Kec. Parung, Bogor. Berkomitmen membina generasi Qurani yang berakhlak mulia,
                berilmu amaliah, dan mandiri.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary-dark px-5 py-3 text-sm font-bold text-white">
                  <MapPin size={16} className="text-primary/60" />
                  Parung, Bogor 16330
                </span>
                <a
                  href="tel:081382410582"
                  className="inline-flex items-center gap-2 rounded-full border border-surface-200 bg-white px-5 py-3 text-sm font-bold text-foreground/70 transition-colors hover:border-primary/30 hover:text-primary"
                >
                  <PhoneCall size={16} className="text-primary" />
                  0813 8241 0582
                </a>
              </div>
              <div className="mt-8 space-y-4">
                {[
                  'Menjadikan Al-Quran sebagai media utama pembelajaran',
                  'Membentuk akhlak karimah dan kemandirian santri',
                  'Mengembangkan intelektual, kreativitas, dan jiwa kaderisasi umat',
                ].map((point) => (
                  <div key={point} className="flex gap-4">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-primary" />
                    <p className="text-sm leading-7 text-foreground/60">{point}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/profil"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-primary-dark"
              >
                Profil Lengkap <ArrowRight size={16} />
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
              className="relative"
            >
              <div className="rounded-2xl border border-surface-200 bg-surface-50 p-8">
                <div className="flex items-start gap-5">
                  <div className="shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden ring-2 ring-primary/20 bg-surface-100">
                    <Image
                      src={resolveDisplayImageUrl(settings.welcome_speech_image || '/assets/img/kepsek.png')}
                      alt={settings.welcome_speech_name || 'Pimpinan Pondok'}
                      width={96}
                      height={96}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground">{settings.welcome_speech_name || 'Ust. Rusdi'}</h3>
                    <p className="text-sm text-primary font-semibold">{settings.welcome_speech_role || 'Pimpinan Pondok'}</p>
                  </div>
                </div>
                <p className="mt-5 text-base leading-8 text-foreground/60">
                  {settings.welcome_speech_text
                    ? settings.welcome_speech_text.split(/\n+/).map(s => s.trim()).filter(Boolean).slice(0, 2).join(' ')
                    : 'Pondok Pesantren Tahfidz Al Quran yang berkomitmen membina generasi Qurani yang berakhlak mulia, berilmu amaliah, dan mandiri sejak tahun 2009.'}
                </p>
                <Link
                  href="/sambutan"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-primary-dark"
                >
                  Baca Sambutan <ArrowRight size={16} />
                </Link>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                {[
                  { label: 'Kurikulum Terpadu', value: 'Pondok + DIKNAS + Tahfidz', icon: BookOpen },
                  { label: 'Tenaga Pengajar', value: 'Ustadz berpengalaman', icon: Users },
                  { label: 'Kegiatan Harian', value: 'Terjadwal & terstruktur', icon: Clock },
                  { label: 'Prestasi', value: 'Tingkat Kab. s.d Provinsi', icon: Trophy },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-xl border border-surface-200 bg-white p-4">
                      <Icon size={18} className="text-primary" />
                      <p className="mt-2 text-sm font-bold text-foreground">{item.label}</p>
                      <p className="mt-0.5 text-xs text-foreground/50">{item.value}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== 3. PROGRAM ===== */}
      <section className="bg-surface-50 py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Program</span>
            <h2 className="mt-4 font-headline text-4xl md:text-5xl font-black text-foreground">
              Program Unggulan Pondok
            </h2>
            <p className="mt-4 text-lg text-foreground/60 max-w-xl mx-auto">
              Pembinaan utama Darussunnah menguatkan hafalan, adab, wawasan Islam, dan kesiapan hidup santri.
            </p>
          </div>

          {isLoading ? (
            <PublicGridSkeleton count={6} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" itemClassName="h-64 rounded-2xl" />
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {displayPrograms.map((program) => (
                <motion.div key={program.id || program.slug} variants={fadeUpVariant}>
                  <Link
                    href={`/program`}
                    className="group block h-full rounded-2xl border border-surface-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-primary/30 overflow-hidden"
                  >
                    <div className="relative h-44 overflow-hidden">
                      {program.image_url ? (
                        <Image
                          src={resolveDisplayImageUrl(program.image_url)}
                          alt={program.title}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                          {programIcons[program.title] || <BookOpen size={40} className="text-primary/30" />}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${categoryColors[program.category] || 'bg-surface-100 text-foreground/60'}`}>
                          {program.category || 'Program'}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{program.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/60 line-clamp-2">{program.excerpt}</p>
                      <div className="mt-4 flex items-center gap-2 text-xs font-bold text-primary">
                        Selengkapnya <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}

          <div className="text-center mt-10">
            <Link
              href="/program"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-primary-dark"
            >
              Lihat Semua Program <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {SHOW_RUTINITAS_SECTION && (
        <>
          {/* ===== 4. KEHIDUPAN SANTRI (TIMELINE) - HIDDEN ===== */}
          <section className="bg-white py-24">
            <div className="container mx-auto max-w-6xl px-4">
              <div className="text-center mb-14">
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Kehidupan Santri</span>
                <h2 className="mt-4 font-headline text-4xl md:text-5xl font-black text-foreground">
                  Rutinitas Harian Santri
                </h2>
                <p className="mt-4 text-lg text-foreground/60 max-w-xl mx-auto">
                  Dari qiyamul lail hingga istirahat, setiap waktu menjadi momen pembinaan.
                </p>
              </div>
              <TimelineSantri />
            </div>
          </section>
        </>
      )}

      {/* ===== 5. FASILITAS ===== */}
      <section className="bg-gradient-to-b from-white to-emerald-50/40 py-12">
        <div className="mx-auto w-full max-w-[1400px] px-4 md:px-8">
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/70 px-4 py-1.5 text-xs font-black uppercase tracking-[0.25em] text-primary">
              Fasilitas
            </span>
          </div>

          {isLoading ? (
            <PublicGridSkeleton count={5} className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5" itemClassName="h-48 rounded-2xl" />
          ) : (
            <FasilitasGallery facilities={facilities} />
          )}
        </div>
      </section>

      {/* ===== 6. VIDEO PROFIL ===== */}
      {(profileVideoUrl || profileVideoId) && (
        <section className="bg-surface-50 py-24">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-14">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Video</span>
              <h2 className="mt-4 font-headline text-4xl md:text-5xl font-black text-foreground">
                Video Profil Pondok
              </h2>
              <p className="mt-4 text-lg text-foreground/60 max-w-xl mx-auto">
                Tonton perjalanan dan suasana Darussunnah dalam video berikut.
              </p>
            </div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
              className="max-w-3xl mx-auto"
            >
              <VideoEmbed
                url={profileVideoUrl}
                thumbnail={getYouTubeThumbnailUrl(profileVideoUrl)}
                title="Video Profil Darussunnah Parung"
              />
            </motion.div>
          </div>
        </section>
      )}

      {/* ===== 7. BERITA ===== */}
      <section className="bg-surface-50 py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Berita</span>
            <h2 className="mt-4 font-headline text-4xl md:text-5xl font-black text-foreground">
              Kabar Terbaru dari Pondok
            </h2>
            <p className="mt-4 text-lg text-foreground/60 max-w-xl mx-auto">
              Informasi kegiatan, jadwal penting, dan acara mendatang.
            </p>
          </div>

          {isLoading ? (
            <PublicGridSkeleton count={3} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" itemClassName="h-72 rounded-2xl" />
          ) : news.length > 0 ? (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {news.map((item, i) => (
                <motion.div key={item.id} variants={fadeUpVariant}>
                  <NewsCard news={item} featured={i === 0} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <PublicEmptyState icon={Newspaper} title="Belum ada berita" description="Berita terbaru pondok akan tampil di sini." />
          )}

          <div className="text-center mt-10">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-primary-dark"
            >
              Semua Berita <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== VIDEO SLIDER ===== */}
      <section className="bg-white py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Video</span>
            <h2 className="mt-4 font-headline text-4xl md:text-5xl font-black text-foreground">
              Dokumentasi Kegiatan Pondok
            </h2>
            <p className="mt-4 text-lg text-foreground/60 max-w-xl mx-auto">
              Momen haru, sambutan, dan kebersamaan di lingkungan pondok.
            </p>
          </div>

          <div className="relative">
            <Swiper
              modules={[Navigation]}
              navigation
              spaceBetween={24}
              slidesPerView={1}
              className="!pb-2"
            >
              <SwiperSlide>
                <div className="relative rounded-2xl overflow-hidden bg-black shadow-lg aspect-video">
                  <div className="absolute top-3 left-3 z-10 rounded-full bg-primary/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                    Tasmi' Akhir
                  </div>
                  <iframe
                    src="https://drive.google.com/file/d/1vH5SA9aDPCgeGCPimc1d1MV-x1yh7ukJ/preview"
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay"
                    allowFullScreen
                  />
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <div className="relative rounded-2xl overflow-hidden bg-black shadow-lg aspect-video">
                  <div className="absolute top-3 left-3 z-10 rounded-full bg-primary/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                    Sambutan Santriwan
                  </div>
                  <iframe
                    src="https://drive.google.com/file/d/1qlqlxmsSdPZi_NOfDwNsTBDBnbAUTvqm/preview"
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay"
                    allowFullScreen
                  />
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <div className="relative rounded-2xl overflow-hidden bg-black shadow-lg aspect-video">
                  <div className="absolute top-3 left-3 z-10 rounded-full bg-primary/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                    Sambutan Santriwati
                  </div>
                  <iframe
                    src="https://drive.google.com/file/d/1trKJ2BKSl8UDeuTF7m07Av2JZOI4oyzM/preview"
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay"
                    allowFullScreen
                  />
                </div>
              </SwiperSlide>
            </Swiper>
          </div>
        </div>
      </section>

      {/* ===== 8. DOKUMENTASI ===== */}
      <section className="bg-white py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Dokumentasi</span>
            <h2 className="mt-4 font-headline text-4xl md:text-5xl font-black text-foreground">
              Sekilas kegiatan dan pembinaan di Darussunnah
            </h2>
            <p className="mt-4 text-lg text-foreground/60 max-w-xl mx-auto">
              Lihat suasana belajar, ibadah, kebersamaan, dan ritme keseharian santri.
            </p>
          </div>

          <div className="flex justify-center gap-2 mb-10">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${
                activeTab === 'gallery'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-surface-100 text-foreground/60 hover:bg-surface-200'
              }`}
            >
              <Camera size={16} className="inline mr-2 -mt-0.5" />
              Galeri Foto
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${
                activeTab === 'video'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-surface-100 text-foreground/60 hover:bg-surface-200'
              }`}
            >
              <PlayCircle size={16} className="inline mr-2 -mt-0.5" />
              Video
            </button>
          </div>

          {activeTab === 'gallery' && (
            <>
              {isLoading ? (
                <PublicGridSkeleton count={3} className="grid grid-cols-1 gap-4 sm:grid-cols-3" itemClassName="h-52 rounded-xl" />
              ) : galleryAlbums.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]"
                >
                  <Link
                    href={`/galeri/${galleryAlbums[0].slug}`}
                    className="group overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="relative h-[300px] sm:h-[420px]">
                      <Image
                        src={resolveDisplayImageUrl(galleryAlbums[0].cover.image_url)}
                        alt={galleryAlbums[0].title}
                        fill
                        unoptimized
                        sizes="(max-width: 1024px) 100vw, 60vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-7">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80">{galleryAlbums[0].category}</p>
                        <h3 className="mt-3 max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">{galleryAlbums[0].title}</h3>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.15em] text-white">
                          <span className="rounded-full bg-white/15 px-3 py-2 backdrop-blur-sm">{galleryAlbums[0].photoCount} foto</span>
                          {galleryAlbums[0].eventDate ? <span className="rounded-full bg-white/15 px-3 py-2 backdrop-blur-sm">{galleryAlbums[0].eventDate}</span> : null}
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="grid gap-4">
                    {galleryAlbums.slice(1, 3).map((album) => (
                      <Link
                        key={album.key}
                        href={`/galeri/${album.slug}`}
                        className="group overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                      >
                        <div className="relative h-[150px] sm:h-[200px]">
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
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80">{album.category}</p>
                            <h3 className="mt-2 line-clamp-2 text-sm font-bold tracking-tight">{album.title}</h3>
                            <p className="mt-2 text-xs font-bold uppercase tracking-[0.15em] text-white/80">{album.photoCount} foto</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <PublicEmptyState icon={Camera} title="Belum ada dokumentasi galeri" description="Album kegiatan terbaru akan muncul di sini setelah dipublikasikan." />
              )}
              <div className="text-center mt-10">
                <Link
                  href="/galeri"
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-6 py-3 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-white"
                >
                  Lihat galeri lengkap <ArrowRight size={16} />
                </Link>
              </div>
            </>
          )}

          {activeTab === 'video' && (
            <>
              {isLoading ? (
                <PublicGridSkeleton count={3} className="grid grid-cols-1 gap-4 md:grid-cols-3" itemClassName="h-56 rounded-xl bg-surface-100" />
              ) : videoSeries.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="grid gap-4 md:grid-cols-3"
                >
                  {videoSeries.map((series) => {
                    const thumbnail = series.lead.thumbnail || getYouTubeThumbnailUrl(series.lead.url);
                    return (
                      <Link
                        key={series.key}
                        href={`/videos/${series.slug}`}
                        className="group overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                      >
                        <div className="relative h-52 bg-surface-100 md:h-56">
                          {thumbnail ? (
                            <div
                              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                              style={{ backgroundImage: `url('${thumbnail}')` }}
                            />
                          ) : (
                            <div className="absolute inset-0 bg-surface-200" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                              <PlayCircle size={34} />
                            </div>
                          </div>
                          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80">
                              {series.count} video
                            </p>
                            <h3 className="mt-2 text-lg font-bold leading-tight">{series.title}</h3>
                            {series.eventDate ? (
                              <p className="mt-2 text-sm text-white/70">{series.eventDate}</p>
                            ) : null}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </motion.div>
              ) : (
                <PublicEmptyState icon={PlayCircle} title="Belum ada dokumentasi video" description="Video kegiatan pondok akan tampil di sini setelah dipublikasikan." />
              )}
              <div className="text-center mt-10">
                <Link
                  href="/videos"
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-6 py-3 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-white"
                >
                  Lihat semua video <ArrowRight size={16} />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ===== 9. FAQ ===== */}
      <section className="bg-white py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary">FAQ</span>
            <h2 className="mt-4 font-headline text-4xl md:text-5xl font-black text-foreground">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="mt-4 text-lg text-foreground/60 max-w-xl mx-auto">
              Butuh bantuan? Mungkin jawaban Anda ada di sini.
            </p>
          </div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUpVariant}
            className="max-w-2xl mx-auto"
          >
            <AccordionFAQ items={faqData} />
          </motion.div>
        </div>
      </section>

      {/* ===== 10. CTA ===== */}
      <section className="relative overflow-hidden bg-primary-dark py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="container relative z-10 mx-auto max-w-6xl px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUpVariant}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-white/80 backdrop-blur-sm">
              <Sparkles size={14} />
              Langkah Berikutnya
            </span>
            <h2 className="mt-6 font-headline text-4xl md:text-5xl font-black text-white">
              Siap Bergabung dengan Darussunnah?
            </h2>
            <p className="mt-6 text-lg text-white/70 max-w-2xl mx-auto">
              Mulai dari mengenal profil, program, dan fasilitas. Lanjutkan ke pendaftaran ketika Anda
              sudah merasa cocok dengan visi pembinaan kami.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/psb"
                className="inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-bold text-primary-dark transition-all hover:-translate-y-1 hover:bg-white/90"
              >
                Daftar Santri Baru <ArrowRight size={18} />
              </Link>
              <Link
                href="/profil"
                className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-8 py-4 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/15"
              >
                Kenali Profil Pondok
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
