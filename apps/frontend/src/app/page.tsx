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
  News,
  Agenda,
  GalleryItem,
  Program,
  SettingsMap,
  Video,
  Teacher,
  resolveDisplayImageUrl,
  formatGalleryAlbumTitle,
  getGallerySortTimestamp,
  getYouTubeThumbnailUrl,
} from '@/lib/api';
import PublicLayout from '@/components/PublicLayout';
import HomePageRenderer from '@/components/website-builder/HomePageRenderer';
import { PublicEmptyState, PublicGridSkeleton } from '@/components/PublicState';
import PublicSectionIntro from '@/components/PublicSectionIntro';
import NewsCard from '@/components/NewsCard';
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
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation, EffectFade } from 'swiper/modules';
import { motion } from 'framer-motion';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

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

const curriculumTracks = ['Kurikulum Pondok', 'Kurikulum DIKNAS', 'Kurikulum Tahfidz'];

const extracurriculars = ['Panahan', 'Basket', 'Futsal', 'Karate', 'Tata Boga', 'Teknik Otomotif'];

const featuredProgramCards = [
  {
    title: 'Tahfidz Al-Quran',
    subtitle: 'Target hafalan bertahap dan setoran harian.',
    image: '/assets/img/tahfidz.jpg',
  },
  {
    title: 'Kajian Kitab',
    subtitle: 'Pembiasaan faham diniyah dan adab belajar.',
    image: '/assets/img/belajar-kitab.jpg',
  },
  {
    title: 'Tasmi & Murajaah',
    subtitle: 'Penguatan bacaan, kelancaran, dan ketelitian.',
    image: '/assets/img/tasmi.jpg',
  },
  {
    title: 'Halaqah Pembinaan',
    subtitle: 'Ruang pembentukan karakter dan kedisiplinan.',
    image: '/assets/img/khalaqoh.jpg',
  },
];

const extracurricularCards = [
  {
    title: 'Panahan & Olahraga',
    subtitle: 'Melatih fokus, fisik, dan sportivitas.',
    image: '/assets/img/manasik.jpg',
  },
  {
    title: 'Tata Boga',
    subtitle: 'Keterampilan hidup yang aplikatif dan bermanfaat.',
    image: '/assets/img/masak.jpg',
  },
  {
    title: 'Teknik Otomotif',
    subtitle: 'Praktik kerja tangan dan pemahaman teknis dasar.',
    image: '/assets/img/bengkel.jpg',
  },
  {
    title: 'Asrama & Kebersamaan',
    subtitle: 'Belajar mandiri, tertib, dan saling menjaga.',
    image: '/assets/img/asrama.jpg',
  },
];

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
      image_url: '/assets/img/gedung.webp',
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
      image_url: '/assets/img/gedung.webp',
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
  const [videos, setVideos] = useState<Video[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
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
        const [newsData, agendasData, galleryData, videosData, programsData, teachersData, settingsData] = await Promise.all([
          getNews(),
          getAgendas(),
          getGallery({ limit: 24, offset: 0 }),
          getVideos({ limit: 24, offset: 0 }),
          getPrograms(),
          getTeachers(),
          getPublicSettingsMap(),
        ]);

        setNews(extractListItems(newsData).slice(0, 3));
        setAgendas(extractListItems(agendasData).slice(0, 3));
        setGallery(extractListItems(galleryData));
        setVideos(extractListItems(videosData));
        setPrograms(extractListItems(programsData));
        setTeachers(extractListItems(teachersData));
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

  if (builderState.enabled) {
    return (
      <PublicLayout>
        <HomePageRenderer
          layout={builderState.homePublished}
          dataSources={{
            news,
            agendas,
            programs,
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
      <section className="relative overflow-hidden bg-slate-950 h-screen">
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
            return (
              <SwiperSlide key={slide.id}>
                <div className="relative h-screen min-h-[610px] sm:min-h-[660px] lg:min-h-[780px]">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${slideImage}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-slate-950/35 to-transparent" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(5,150,105,0.15),transparent_50%)]" />

                  <div className="container relative z-10 mx-auto max-w-6xl px-4 h-full flex items-center">
                    <motion.div
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.75, delay: 0.08 }}
                      className="max-w-2xl"
                    >
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-emerald-100 backdrop-blur-md">
                        <Sparkles size={14} />
                        Darussunnah Parung
                      </span>
                      <h1 className="mt-6 text-[clamp(2.5rem,7vw,5.5rem)] font-black leading-[0.92] tracking-[-0.04em] text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                        {slide.title}
                      </h1>
                      <p className="mt-6 text-lg md:text-xl leading-relaxed text-slate-200 max-w-[36rem]">
                        {slide.subtitle}
                      </p>
                      <div className="mt-10 flex flex-col sm:flex-row gap-4">
                        <Link
                          href={slide.button_url || '/psb'}
                          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-emerald-600/20 transition-all hover:-translate-y-1 hover:bg-emerald-500"
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

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
      </section>

      <section className="bg-white py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-600">Jelajahi</span>
            <h2 className="mt-4 font-headline text-4xl md:text-5xl font-black text-slate-900">
              Mulai dari sini
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
              Profil, program, fasilitas, dan pendaftaran — pilih yang paling ingin Anda kenali.
            </p>
          </div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid gap-5 md:grid-cols-2 md:gap-6 xl:grid-cols-4"
          >
            {focusAreas.map((item) => (
              <motion.div key={item.title} variants={fadeUpVariant}>
                <Link
                  href={item.href}
                  className="group block h-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-emerald-200"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 transition-all duration-300 group-hover:bg-emerald-600 group-hover:text-white">
                    {item.icon}
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500">{item.desc}</p>
                  <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-emerald-600">
                    Selengkapnya <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="bg-slate-950 py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-6 lg:grid-cols-3">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
              className="lg:col-span-2 rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-900/40 via-slate-900 to-slate-950 p-8 md:p-10"
            >
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">Sambutan</span>
              <div className="mt-5 flex flex-col sm:flex-row gap-6 items-start">
                <div className="shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden ring-2 ring-emerald-400/50 bg-slate-800">
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
                  <h3 className="text-xl font-black text-white">{settings.welcome_speech_name || 'Ust. Rusdi'}</h3>
                  <p className="text-sm text-emerald-300 font-semibold">{settings.welcome_speech_role || 'Pimpinan Pondok'}</p>
                </div>
              </div>
              <p className="mt-5 text-base leading-8 text-slate-300 max-w-2xl">
                {settings.welcome_speech_text
                  ? settings.welcome_speech_text.split(/\n+/).map(s => s.trim()).filter(Boolean).slice(0, 2).join(' ')
                  : 'Pondok Pesantren Tahfidz Al Quran yang berkomitmen membina generasi Qurani yang berakhlak mulia, berilmu amaliah, dan mandiri sejak tahun 2009.'}
              </p>
              <Link
                href="/sambutan"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900 transition-all hover:-translate-y-0.5"
              >
                Baca sambutan lengkap <ArrowRight size={16} />
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
              className="rounded-2xl border border-white/10 bg-slate-900/50 p-8 md:p-10 flex flex-col justify-center"
            >
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">Dalam Angka</p>
              <div className="mt-6 grid gap-5">
                {institutionHighlights.map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-300 shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-2xl font-black text-white">{item.value}</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-white py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                <Compass size={14} />
                Profil Singkat
              </span>
              <h2 className="mt-6 font-headline text-4xl md:text-5xl font-black text-slate-900 leading-[1.05]">
                Darussunnah hadir sebagai ruang pembinaan Qurani yang serius, hangat, dan terarah.
              </h2>
              <p className="mt-6 text-base leading-8 text-slate-500">
                Pondok Pesantren Tahfidz Al Quran Darussunnah didirikan pada tahun 2009 di Kp. Lengkong
                Barang, Ds. Iwul, Kec. Parung, Bogor. Saat ini pondok juga tengah membangun
                fasilitas belajar santri putra beserta masjid di Kp. Muara Jaya, Ciaureuten Ilir,
                Bogor sebagai penguatan pusat pembinaan generasi muslim masa depan.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
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
              className="rounded-2xl border border-slate-200 bg-slate-50 p-8"
            >
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-600">Arah Pembinaan</p>
              <h3 className="mt-4 text-2xl font-bold text-slate-900">
                Fokus utama pondok dirancang agar santri tumbuh utuh.
              </h3>
              <div className="mt-6 space-y-4">
                {[
                  'Menjadikan Al-Quran sebagai media utama pembelajaran.',
                  'Membentuk akhlak karimah dan kemandirian santri.',
                  'Mengembangkan intelektual, kreativitas, dan jiwa kaderisasi umat.',
                ].map((point) => (
                  <div key={point} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5">
                    <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 shrink-0">
                      <CheckCircle2 size={20} />
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

      <section className="bg-emerald-50 py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-600">Program</span>
            <h2 className="mt-4 font-headline text-4xl md:text-5xl font-black text-slate-900">
              Program unggulan yang menjadi fondasi pembinaan santri
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
              Pembinaan utama Darussunnah menguatkan hafalan, adab, wawasan Islam, dan kesiapan hidup santri secara seimbang.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
            >
              <div className="grid gap-5">
                {featuredProgramCards.map((program) => (
                  <div
                    key={program.title}
                    className="group overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="relative h-48 md:h-52">
                      <Image
                        src={program.image}
                        alt={program.title}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                        <span className="inline-flex rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-emerald-200 backdrop-blur-sm">
                          Program Unggulan
                        </span>
                        <p className="mt-3 text-lg font-bold leading-tight">{program.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-200">{program.subtitle}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {curriculumTracks.map((track) => (
                  <span
                    key={track}
                    className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-emerald-700"
                  >
                    {track}
                  </span>
                ))}
              </div>
              <Link
                href="/program"
                className="mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-bold text-emerald-800 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700"
              >
                Buka halaman program <ArrowRight size={16} />
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
              className="rounded-2xl border border-slate-800 bg-slate-950 p-8 text-white"
            >
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">Ekstrakurikuler</p>
              <h3 className="mt-4 text-3xl font-black leading-[1.05]">
                Aktivitas penunjang yang membuat santri aktif, terampil, dan percaya diri.
              </h3>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {extracurricularCards.map((item, index) => (
                  <div
                    key={item.title}
                    className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:-translate-y-1"
                  >
                    <div className="relative h-36 md:h-40">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        priority={index === 0}
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 28vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <p className="text-sm font-bold text-white">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-200">{item.subtitle}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {extracurriculars.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-600">Tenaga Pengajar</span>
            <h2 className="mt-4 font-headline text-4xl md:text-5xl font-black text-slate-900">
              Guru & Asatidz
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
              Para pembina yang setia mendampingi hafalan, adab, dan akhlak santri sehari-hari.
            </p>
          </div>

          {isLoading ? (
            <PublicGridSkeleton count={4} className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4" itemClassName="h-[280px] rounded-xl" />
          ) : teachers.length > 0 ? (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="grid gap-5 sm:grid-cols-2 md:grid-cols-4"
            >
              {teachers.slice(0, 4).map((teacher, index) => (
                <motion.div key={teacher.name || index} variants={fadeUpVariant}>
                  <div className="group rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-2 hover:shadow-lg">
                    <div className="mx-auto w-24 h-24 rounded-full overflow-hidden ring-2 ring-emerald-200">
                      <Image
                        src={resolveDisplayImageUrl(teacher.image_url || '/assets/img/default-avatar.webp')}
                        alt={teacher.name || 'Guru'}
                        width={96}
                        height={96}
                        unoptimized
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-slate-900">{teacher.name || 'Ustadz'}</h3>
                    <p className="mt-1 text-sm text-emerald-600 font-semibold">{teacher.subject || 'Pengajar'}</p>
                    <p className="mt-3 text-xs leading-relaxed text-slate-400 line-clamp-2">{teacher.bio || ''}</p>
                    <div className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <Heart size={14} className="text-red-400" /> Inspiratif
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <p className="text-center text-sm text-slate-400">Belum ada data tenaga pengajar.</p>
          )}

          <div className="text-center mt-10">
            <Link
              href="/tentang"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-800"
            >
              Kenali semua asatidz <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-600">Dokumentasi</span>
            <h2 className="mt-4 font-headline text-4xl md:text-5xl font-black text-slate-900">
              Sekilas kehidupan belajar dan pembinaan di Darussunnah
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
              Lihat suasana belajar, ibadah, kebersamaan, dan ritme keseharian santri.
            </p>
          </div>

          <div className="flex justify-center gap-2 mb-10">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${
                activeTab === 'gallery'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Camera size={16} className="inline mr-2 -mt-0.5" />
              Galeri Foto
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${
                activeTab === 'video'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
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
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">{galleryAlbums[0].category}</p>
                        <h3 className="mt-3 max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">{galleryAlbums[0].title}</h3>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-100">
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
                        className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
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
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">{album.category}</p>
                            <h3 className="mt-2 line-clamp-2 text-sm font-bold tracking-tight">{album.title}</h3>
                            <p className="mt-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-100">{album.photoCount} foto</p>
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
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300"
                >
                  Lihat galeri lengkap <ArrowRight size={16} />
                </Link>
              </div>
            </>
          )}

          {activeTab === 'video' && (
            <>
              {isLoading ? (
                <PublicGridSkeleton count={3} className="grid grid-cols-1 gap-4 md:grid-cols-3" itemClassName="h-56 rounded-xl bg-slate-100" />
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
                        className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                      >
                        <div className="relative h-52 bg-slate-100 md:h-56">
                          {thumbnail ? (
                            <div
                              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                              style={{ backgroundImage: `url('${thumbnail}')` }}
                            />
                          ) : (
                            <div className="absolute inset-0 bg-slate-200" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                              <PlayCircle size={34} />
                            </div>
                          </div>
                          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">
                              {series.count} video
                            </p>
                            <h3 className="mt-2 text-lg font-bold leading-tight">{series.title}</h3>
                            {series.eventDate ? (
                              <p className="mt-2 text-sm text-slate-200">{series.eventDate}</p>
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
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300"
                >
                  Lihat semua video <ArrowRight size={16} />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="bg-emerald-50 py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-600">Berita</span>
              <h2 className="mt-4 font-headline text-4xl md:text-5xl font-black text-slate-900">
                Kabar terbaru dari lingkungan Darussunnah
              </h2>
              <p className="mt-4 text-lg text-slate-500">Pantau kegiatan pondok, jadwal penting, dan informasi acara yang akan datang.</p>

              <div className="mt-8 space-y-5">
                {isLoading ? (
                  <PublicGridSkeleton count={2} className="space-y-5" itemClassName="h-28 rounded-xl" />
                ) : news.length > 0 ? (
                  <>
                    {news.slice(0, 3).map((item) => (
                      <Link
                        key={item.id}
                        href={`/news/${item.slug}`}
                        className="flex gap-5 rounded-xl border border-emerald-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                      >
                        {item.image_url && (
                          <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0">
                            <Image
                              src={resolveDisplayImageUrl(item.image_url?.String || '')}
                              alt={item.title}
                              fill
                              unoptimized
                              sizes="96px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-600">{typeof item.category_name === 'string' ? item.category_name : item.category_name?.String || 'Berita'}</p>
                          <h3 className="mt-1 text-base font-bold text-slate-900 line-clamp-2">{item.title}</h3>
                          <p className="mt-1 text-sm text-slate-400">{item.created_at || ''}</p>
                        </div>
                      </Link>
                    ))}
                    <Link
                      href="/news"
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300"
                    >
                      Semua berita <ArrowRight size={16} />
                    </Link>
                  </>
                ) : (
                  <PublicEmptyState icon={Newspaper} title="Belum ada berita" description="Berita terbaru pondok akan tampil di sini." className="bg-white" />
                )}
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
              className="rounded-2xl border border-slate-200 bg-white p-8"
            >
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-600">Agenda Mendatang</span>
              <h3 className="mt-4 text-2xl font-bold text-slate-900">Jadwal terdekat di pondok</h3>
              <div className="mt-6 space-y-4">
                {isLoading ? (
                  <PublicGridSkeleton count={3} itemClassName="h-20 rounded-xl" />
                ) : agendas.length > 0 ? (
                  agendas.slice(0, 4).map((agenda) => (
                    <div key={agenda.id} className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-600 text-white">
                        <span className="text-xs font-bold uppercase leading-none">{formatAgendaMonth(agenda.start_date)}</span>
                        <span className="mt-1 text-xl font-black leading-none">{formatAgendaDay(agenda.start_date)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">{agenda.category || 'Agenda'}</p>
                        <h4 className="mt-1 text-sm font-bold text-slate-900 line-clamp-2">{agenda.title}</h4>
                        <p className="mt-1 text-xs text-slate-400">{agenda.time_info || ''}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <PublicEmptyState icon={Calendar} title="Belum ada agenda" description="Agenda pondok akan tampil di sini." className="bg-slate-50" />
                )}
              </div>
              <Link
                href="/agendas"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300"
              >
                Lihat semua agenda <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUpVariant}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-900/30 via-slate-900 to-slate-950 p-10 md:p-16 text-center"
          >
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">Langkah Berikutnya</span>
            <h2 className="mt-6 font-headline text-4xl md:text-5xl font-black text-white">
              Siap mengenal Darussunnah lebih jauh?
            </h2>
            <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto">
              Mulai dari profil pondok, program, dan fasilitas, lalu lanjutkan ke halaman pendaftaran
              saat Anda sudah merasa cocok dengan arah pembinaannya.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/psb"
                className="inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-bold text-slate-900 transition-all hover:-translate-y-1 hover:bg-emerald-50"
              >
                Lihat Info PSB <ArrowRight size={18} />
              </Link>
              <Link
                href="/profil"
                className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-8 py-4 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/15"
              >
                Lihat profil pondok
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
