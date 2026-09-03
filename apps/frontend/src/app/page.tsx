'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  getNews,
  getAgendas,
  getCampaigns,
  getGallery,
  getPublicSettingsMap,
  getPrograms,
  getVideos,
  Campaign,
  News,
  Agenda,
  GalleryItem,
  Program,
  SettingsMap,
  Video,
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
import { featuredOpenDonation, findFeaturedDonationCampaign } from '@/lib/donations';
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
  PlayCircle,
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
  { label: 'Lokasi', value: 'Parung, Bogor', icon: <Sparkles size={18} /> },
  { label: 'Lembaga', value: 'PPTQ Al-Maa', icon: <Building2 size={18} /> },
  { label: 'Jenjang', value: 'SMP - SMK', icon: <ShieldCheck size={18} /> },
  { label: 'Fokus', value: 'Tahfidz & Adab', icon: <Landmark size={18} /> },
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
    desc: 'Kenali profil pondok, visi-misi, identitas lembaga, dan arah pembinaan Al-Maa.',
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
    title: 'Akselerasi Tahfidz 30 Juz',
    subtitle: 'Target hafalan 30 juz dengan muraja\'ah yang terjadwal.',
    image: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=900&q=60',
  },
  {
    title: 'Tsaqofah Islamiyah',
    subtitle: 'Kajian kitab dan wawasan keislaman yang luas.',
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=60',
  },
  {
    title: 'Tarbiyah Aqidah & Akhlak',
    subtitle: 'Pembinaan aqidah lurus dan akhlak karimah.',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=60',
  },
  {
    title: 'Mahasantri Bahasa Arab',
    subtitle: 'Kemampuan baca kitab dan berbahasa Arab aktif.',
    image: 'https://images.unsplash.com/photo-1564121211835-e88c852648ab?auto=format&fit=crop&w=900&q=60',
  },
];

const extracurricularCards = [
  {
    title: 'Tata Boga',
    subtitle: 'Keterampilan hidup yang aplikatif dan bermanfaat.',
    image: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?auto=format&fit=crop&w=900&q=60',
  },
  {
    title: 'Teknik Otomotif',
    subtitle: 'Praktik kerja tangan dan pemahaman teknis dasar.',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=60',
  },
  {
    title: 'Futsal & Olahraga',
    subtitle: 'Melatih fisik, fokus, dan sportivitas santri.',
    image: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=900&q=60',
  },
  {
    title: 'Panahan & Beladiri',
    subtitle: 'Mengasah konsentrasi, keberanian, dan kesigapan.',
    image: 'https://images.unsplash.com/photo-1517260739337-6799d239ce83?auto=format&fit=crop&w=900&q=60',
  },
];

const institutionHighlights = [
  { value: '20 Juz', label: 'Target Hafalan', icon: <Calendar size={18} /> },
  { value: '30', label: 'Kuota Ikhwan', icon: <BookOpen size={18} /> },
  { value: '30', label: 'Kuota Akhwat', icon: <GraduationCap size={18} /> },
  { value: 'SMP - SMK', label: 'Jenjang', icon: <Building2 size={18} /> },
  { value: 'Rp200rb', label: 'Biaya Formulir', icon: <Users size={18} /> },
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
  title: 'Tahfidz, adab, dan ilmu dalam satu ritme pembinaan',
  subtitle: 'Al-Maa Parung menumbuhkan hafalan, akhlak, dan pembelajaran terpadu dalam suasana yang tertata.',
  image_url: fullHeroSlideImage('1564769625905-50e93615e769'),
  button_text: 'Lihat PSB',
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

const fullHeroSlideImage = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1920&q=80`;

const defaultHeroSlides = [
  createHeroSlide(
    {
      title: 'Menghafal Al-Quran, tumbuh dengan adab',
      subtitle:
        'Lingkungan pesantren yang menjaga hafalan, ilmu, ibadah, dan kemandirian santri dalam keseharian.',
      image_url: fullHeroSlideImage('1564769625905-50e93615e769'),
      button_text: 'Daftar PSB',
      button_url: '/psb',
    },
    'default-slide-1'
  ),
  createHeroSlide(
    {
      title: 'Tahfidz dan kurikulum yang berjalan seimbang',
      subtitle:
        'Target hafalan, diniyah, akademik, dan karakter disusun menyatu dalam ritme pembinaan harian.',
      image_url: fullHeroSlideImage('1768152859503-084ed0e5507d'),
      button_text: 'Buka Program',
      button_url: '/program',
    },
    'default-slide-2'
  ),
  createHeroSlide(
    {
      title: 'Belajar, beribadah, dan tumbuh mandiri',
      subtitle:
        'Fasilitas pondok mendukung ibadah, belajar, olahraga, dan life skill dalam satu lingkungan yang terarah.',
      image_url: fullHeroSlideImage('1566747675140-317e7484b10d'),
      button_text: 'Buka Fasilitas',
      button_url: '/facilities',
    },
    'default-slide-3'
  ),
];

function parseHeroSlides(_settings: SettingsMap): HeroSlide[] {
  return defaultHeroSlides;
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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
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
        const [newsData, agendasData, galleryData, videosData, programsData, settingsData, campaignsData] = await Promise.all([
          getNews(),
          getAgendas(),
          getGallery({ limit: 24, offset: 0 }),
          getVideos({ limit: 24, offset: 0 }),
          getPrograms(),
          getPublicSettingsMap(),
          getCampaigns({ activeOnly: true }),
        ]);

        setNews(extractListItems(newsData).slice(0, 3));
        setAgendas(extractListItems(agendasData).slice(0, 3));
        setGallery(extractListItems(galleryData));
        setVideos(extractListItems(videosData));
        setPrograms(extractListItems(programsData));
        setCampaigns(campaignsData.filter((campaign) => campaign.is_active));
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
  const isLoadingHero = isLoading;
  const renderedHeroSlides = isLoadingHero ? [] : heroSlides;
  const canSlideHero = renderedHeroSlides.length > 1;
  const builderState = useMemo(() => parseWebsiteBuilderState(settings), [settings]);
  const featuredCampaign = useMemo(() => findFeaturedDonationCampaign(campaigns), [campaigns]);
  const featuredTargetAmount = featuredCampaign?.target_amount ?? featuredOpenDonation.target;

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
            videos,
            settings,
            isLoading,
          }}
        />
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f4fbff_0%,#e6f4ff_100%)]">
        <Swiper
          modules={[Pagination, Autoplay, Navigation]}
          loop={canSlideHero}
          navigation={canSlideHero}
          allowTouchMove={canSlideHero}
          pagination={canSlideHero ? { clickable: true } : false}
          autoplay={canSlideHero ? { delay: 6500, disableOnInteraction: false, pauseOnMouseEnter: true } : false}
          speed={950}
          key={`hero-${renderedHeroSlides.length}`}
          className="hero-swiper"
        >
          {renderedHeroSlides.map((slide) => {
            const slideImage = resolveDisplayImageUrl(
              slide.image_url || fullHeroSlideImage('1564769625905-50e93615e769')
            );
            return (
              <SwiperSlide key={slide.id}>
                <div className="relative min-h-[520px] overflow-hidden sm:min-h-[620px] lg:min-h-[710px]">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${slideImage}')` }}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(248,250,252,0.74)_0%,rgba(248,250,252,0.5)_18%,rgba(248,250,252,0.18)_34%,rgba(255,255,255,0.02)_52%,rgba(255,255,255,0)_72%)] sm:bg-[linear-gradient(94deg,rgba(248,250,252,0.68)_0%,rgba(248,250,252,0.42)_20%,rgba(248,250,252,0.14)_38%,rgba(255,255,255,0)_62%)]" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(250,204,21,0.08)_0%,rgba(250,204,21,0.03)_34%,rgba(250,204,21,0.16)_100%)]" />
                  <div className="pointer-events-none absolute right-[-8%] top-[13%] hidden h-72 w-72 rounded-full border border-white/45 bg-white/8 backdrop-blur-[2px] lg:block" />
                  <div className="pointer-events-none absolute right-[12%] top-[24%] hidden h-28 w-28 rounded-full border border-sky-200/70 bg-sky-100/12 lg:block" />
                  <div className="pointer-events-none absolute bottom-[18%] right-[9%] hidden h-px w-48 bg-gradient-to-r from-transparent via-white/85 to-transparent lg:block" />
                  <div className="pointer-events-none absolute bottom-[18%] right-[9%] hidden h-48 w-px bg-gradient-to-b from-white/10 via-white/70 to-transparent lg:block" />

                  <div className="container relative z-10 mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pb-16 sm:pt-14 lg:pb-20 lg:pt-20">
                    <div className="grid items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
                      <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.75, delay: 0.08 }}
                        className="max-w-3xl"
                      >
                        <div className="lg:max-w-[42rem]">
                          <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-sky-200/90 bg-white/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-sky-700 shadow-[0_12px_30px_-20px_rgba(56,189,248,0.45)] sm:text-[11px]">
                            <Sparkles size={14} />
                            Al-Maa Parung
                          </span>
                          <h1 className="mt-4 line-clamp-3 max-w-[19ch] text-balance text-[2.1rem] font-black leading-[0.96] tracking-[-0.05em] text-slate-950 [text-shadow:0_10px_26px_rgba(255,255,255,0.28)] sm:mt-6 sm:text-5xl md:text-[3.65rem] lg:text-[4rem]">
                            {slide.title}
                          </h1>
                          <p className="mt-3 line-clamp-3 max-w-[32rem] text-[13px] font-medium leading-6 text-slate-800 sm:mt-5 sm:text-base md:line-clamp-3 md:text-lg">
                            {slide.subtitle}
                          </p>
                          <div className="mt-5 flex flex-col gap-3 sm:mt-8 sm:flex-row">
                            <Link
                              href={slide.button_url || '/psb'}
                              className="inline-flex w-full items-center justify-center gap-2 self-start rounded-full bg-gradient-to-r from-sky-500 via-sky-500 to-cyan-400 px-5 py-3 text-xs font-bold text-white shadow-[0_22px_48px_-22px_rgba(56,189,248,0.52)] ring-1 ring-white/25 transition-all hover:-translate-y-1 hover:brightness-105 sm:w-auto sm:px-8 sm:py-4 sm:text-sm"
                            >
                              {slide.button_text || 'Lihat PSB'} <ArrowRight size={16} />
                            </Link>
                            <Link
                              href="/program"
                              className="inline-flex w-full items-center justify-center gap-2 self-start rounded-full border border-sky-200 bg-white/94 px-5 py-3 text-xs font-bold text-sky-700 shadow-[0_16px_34px_-24px_rgba(250,204,21,0.18)] transition-all hover:-translate-y-0.5 hover:bg-sky-50 sm:w-auto sm:px-8 sm:py-4 sm:text-sm"
                            >
                              Buka Program
                            </Link>
                          </div>
                          <div className="mt-6 flex flex-wrap gap-2.5 sm:mt-8 sm:gap-3">
                            {learningPillars.slice(0, 2).map((pillar) => (
                              <span
                                key={pillar.title}
                                className="inline-flex items-center gap-2 rounded-full border border-sky-100/90 bg-white/88 px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-sm shadow-sky-100/60 sm:px-4 sm:text-xs"
                              >
                                <span className="text-sky-400">{pillar.icon}</span>
                                {pillar.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.16 }}
                        className="hidden lg:flex lg:justify-end"
                      >
                        <div className="mt-16 flex max-w-[240px] flex-col gap-3">
                          <div className="rounded-[1.6rem] border border-white/50 bg-white/72 p-4 shadow-[0_22px_60px_-36px_rgba(59,130,246,0.3)] backdrop-blur-sm">
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-600">Tahfidz</p>
                            <p className="mt-2 text-2xl font-black text-slate-900">20 Juz</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">Target hafalan bertahap dengan murajaah yang dijaga rutin.</p>
                          </div>
                          <div className="ml-auto rounded-[1.4rem] border border-white/45 bg-slate-950/78 px-4 py-3 text-white shadow-[0_22px_60px_-36px_rgba(250,204,21,0.55)] backdrop-blur-sm">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200/90">PSB</p>
                            <p className="mt-2 text-sm font-semibold">SMP - SMK</p>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-[#eaf6ff] via-[#eef8ff]/70 to-transparent" />

        <div className="relative z-20 -mt-16 px-4 lg:-mt-12">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-2 gap-3 rounded-[2.1rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.92)_100%)] p-4 shadow-[0_30px_70px_-35px_rgba(250,204,21,0.32)] backdrop-blur-xl md:grid-cols-4 md:gap-4 md:p-6">
              {institutionFacts.map((fact) => (
                <div key={fact.label} className="rounded-[1.35rem] border border-slate-100/90 bg-white/95 px-4 py-4 shadow-[0_16px_36px_-30px_rgba(250,204,21,0.18)] md:rounded-[1.5rem] md:px-5">
                  <div className="mb-3 inline-flex rounded-2xl bg-sky-50 p-2.5 text-sky-600 ring-1 ring-sky-100 md:p-3">
                    {fact.icon}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{fact.label}</p>
                  <p className="mt-2 text-[13px] font-bold leading-5 text-slate-800 md:text-sm">{fact.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-transparent py-4 md:py-5">
        <div className="container relative mx-auto max-w-6xl px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUpVariant}
            className="group overflow-hidden rounded-[1.4rem] border border-sky-200/80 bg-[linear-gradient(90deg,#f0f9ff_0%,#ffffff_48%,#ecfeff_100%)] shadow-[0_22px_50px_-34px_rgba(14,165,233,0.24)]"
          >
            <div className="grid items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4 lg:grid-cols-[1fr_auto] lg:px-6 lg:py-4">
              <div className="flex min-w-0 items-start gap-4">
                <div className="relative hidden h-14 w-14 shrink-0 overflow-hidden rounded-[0.9rem] border border-white/70 bg-white shadow-[0_18px_34px_-26px_rgba(250,204,21,0.28)] sm:block">
                  <Image
                    src={featuredOpenDonation.posterImage}
                    alt={`${featuredOpenDonation.title} poster`}
                    fill
                    unoptimized
                    className="object-cover object-top"
                  />
                </div>
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-sky-700">
                    <HeartHandshake size={14} />
                    Open Donasi
                  </span>
                  <h2 className="mt-2 max-w-3xl text-sm font-black leading-tight tracking-[-0.03em] text-slate-950 sm:text-base md:text-[1.15rem]">
                    {featuredOpenDonation.title}
                  </h2>
                  <p className="mt-1.5 max-w-3xl text-xs leading-5 text-slate-600 sm:text-[13px] sm:leading-5">
                    {featuredOpenDonation.summary}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-sky-100 bg-white px-3 py-2 text-xs font-bold text-slate-700">
                      Target Rp {featuredTargetAmount.toLocaleString('id-ID')}
                    </span>
                    <span className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-800">
                      {featuredOpenDonation.focus}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2.5 lg:items-end">
                <Link
                  href={`/donations/${featuredOpenDonation.slug}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-5 py-3 text-sm font-bold text-white shadow-[0_18px_40px_-24px_rgba(14,165,233,0.45)] transition-all hover:-translate-y-0.5 hover:brightness-105 lg:w-auto"
                >
                  Lihat Open Donasi <ArrowRight size={16} />
                </Link>
                <a
                  href={featuredOpenDonation.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-sky-200 bg-white px-5 py-3 text-sm font-bold text-sky-700 transition-all hover:-translate-y-0.5 hover:bg-sky-50 lg:w-auto"
                >
                  Hubungi Donasi
                </a>
                <p className="hidden max-w-xs text-xs font-medium leading-5 text-slate-500 lg:block lg:text-right">
                  Banner singkat ini mengarah ke halaman detail campaign dengan informasi dan ajakan donasi lengkap.
                </p>
              </div>
                </div>
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-slate-200/70 bg-[#f6f7f4] py-12 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.10),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.08),_transparent_28%)]" />
        <div className="container relative z-10 mx-auto max-w-6xl px-4">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-sky-700">
                <Compass size={14} />
                Profil Singkat
              </span>
              <h2 className="mt-5 text-[2.15rem] font-black leading-[1.02] tracking-[-0.03em] text-slate-900 md:mt-6 md:text-[3.1rem]">
                Al-Maa membangun iklim belajar Qurani yang hangat, tertib, dan bertumbuh.
              </h2>
              <p className="mt-5 text-[15px] leading-8 text-slate-600 md:mt-6 md:text-lg">
                Berlokasi di Parung, Bogor, Al-Maa memadukan tahfidz, adab, ilmu syar&apos;i dasar,
                dan ritme belajar yang membantu santri tumbuh mandiri sekaligus siap memberi manfaat.
              </p>
              <div className="mt-7 flex flex-wrap gap-3 md:mt-8">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-bold text-white md:px-5">
                  <MapPin size={16} className="text-sky-300" />
                  Parung, Bogor 16330
                </span>
                <a
                  href="tel:081382410582"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-sky-200 hover:text-sky-700 md:px-5"
                >
                  <PhoneCall size={16} className="text-sky-500" />
                  0857 7694 8779
                </a>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
              className="rounded-[1.8rem] border border-sky-100/80 bg-white p-6 shadow-[0_30px_70px_-35px_rgba(250,204,21,0.18)] md:rounded-[2rem] md:p-8"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-sky-600">Arah Pembinaan</p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                Pembinaan diarahkan agar santri tumbuh utuh.
              </h3>
              <div className="mt-6 space-y-4">
                {[
                  'Menjadikan Al-Quran sebagai media utama pembelajaran.',
                  'Membentuk akhlak karimah dan kemandirian santri.',
                  'Mengembangkan intelektual, kreativitas, dan jiwa kaderisasi umat.',
                ].map((point) => (
                  <div key={point} className="flex gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 px-5 py-4">
                    <div className="rounded-2xl bg-sky-50 p-3 text-sky-600">
                      <CheckCircle2 size={18} />
                    </div>
                    <p className="text-sm leading-7 text-slate-600">{point}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/profil"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-sky-600 transition-colors hover:text-sky-700"
              >
                Lihat profil dan visi-misi lengkap <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fbfcfa_0%,#f4f7f3_100%)] py-12 md:py-16">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-200 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.08),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.06),_transparent_24%)]" />
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch lg:gap-8 xl:gap-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} className="relative z-10">
              <PublicSectionIntro
                eyebrow="Program Inti"
                title="Program utama yang membentuk ritme belajar santri"
                description="Tahfidz, adab, wawasan Islam, dan kesiapan hidup disusun berjalan seimbang setiap hari."
              />
              <div className="mt-7 grid gap-4 sm:mt-8 sm:grid-cols-2">
                {featuredProgramCards.map((program) => (
                  <div
                    key={program.title}
                    className="group overflow-hidden rounded-[1.7rem] border border-white/70 bg-white/90 shadow-[0_22px_48px_-34px_rgba(250,204,21,0.22)] backdrop-blur-sm transition-all hover:-translate-y-1 md:rounded-[1.9rem]"
                  >
                    <div className="relative h-48 md:h-52">
                      <Image
                        src={program.image}
                        alt={program.title}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/92 via-slate-950/24 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4 text-white md:p-5">
                        <span className="inline-flex rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-sky-200 backdrop-blur-sm">
                          Program Unggulan
                        </span>
                        <p className="mt-3 text-lg font-black leading-tight">{program.title}</p>
                        <p className="mt-2 max-w-xs text-sm leading-6 text-slate-200">{program.subtitle}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {curriculumTracks.map((track) => (
                  <span
                    key={track}
                    className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-700"
                  >
                    {track}
                  </span>
                ))}
              </div>
              <Link
                href="/program"
                className="mt-8 inline-flex items-center gap-3 self-start rounded-full border border-sky-200 bg-white px-6 py-3 text-sm font-black text-sky-800 shadow-[0_18px_36px_-28px_rgba(250,204,21,0.18)] transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-700"
              >
                Jelajahi program <ArrowRight size={16} />
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
              className="relative z-10 rounded-[1.8rem] border border-sky-900/80 bg-[linear-gradient(180deg,#facc15_0%,#10251d_100%)] p-6 text-white shadow-[0_35px_80px_-35px_rgba(250,204,21,0.35)] md:rounded-[2rem] md:p-8"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-sky-200">Ekstrakurikuler</p>
              <h3 className="mt-3 text-[2rem] font-black leading-[1.02] tracking-[-0.03em] sm:text-[2.35rem]">
                Aktivitas penunjang yang membuat santri aktif, terampil, dan percaya diri.
              </h3>
              <div className="mt-7 grid gap-4 sm:mt-8 sm:grid-cols-2">
                {extracurricularCards.map((item, index) => (
                  <div
                    key={item.title}
                    className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-all hover:-translate-y-1 md:rounded-[1.65rem]"
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
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/22 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <p className="text-sm font-black text-white">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-200">{item.subtitle}</p>
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

      <section className="relative overflow-hidden bg-slate-950 py-12 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(250,204,21,0.10),_transparent_24%)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} className="relative z-10">
            <PublicSectionIntro
              eyebrow="Potret Kegiatan"
              title="Lihat ritme belajar dan kebersamaan santri di Al-Maa"
              description="Dokumentasi ini memberi gambaran suasana belajar, ibadah, dan keseharian pondok."
              actionHref="/galeri"
              actionLabel="Jelajahi galeri"
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
            <div className="relative z-10 mt-7 grid gap-4 md:mt-8 lg:grid-cols-[1.15fr_0.85fr]">
              <Link
                href={`/galeri/${galleryAlbums[0].slug}`}
                className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_25px_55px_-35px_rgba(0,0,0,0.45)] transition-all hover:-translate-y-1 hover:shadow-[0_30px_65px_-35px_rgba(0,0,0,0.55)]"
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
                    <p className="text-[10px] font-black uppercase tracking-[0.32em] text-sky-200">{galleryAlbums[0].category}</p>
                    <h3 className="mt-3 max-w-xl text-2xl font-black tracking-tight sm:text-3xl">{galleryAlbums[0].title}</h3>
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
                        <p className="text-[9px] font-black uppercase tracking-[0.28em] text-sky-200">{album.category}</p>
                        <h3 className="mt-2 line-clamp-2 text-sm font-black tracking-tight sm:text-base">{album.title}</h3>
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
                iconClassName="text-sky-200/70"
                titleClassName="text-white"
                descriptionClassName="text-slate-300"
              />
            </div>
          )}
        </div>
      </section>

      <section className="pb-12 md:pb-16">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUpVariant}
            className="overflow-hidden rounded-[2rem] border border-sky-200/80 bg-[linear-gradient(135deg,#f0f9ff_0%,#e0f2fe_42%,#ecfeff_100%)] px-5 py-7 text-slate-900 shadow-[0_26px_60px_-34px_rgba(14,165,233,0.24)] md:rounded-[2.25rem] md:px-8 md:py-8"
          >
            <div className="grid gap-8 lg:grid-cols-[1.1fr_1.9fr] lg:items-center">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-sky-700">Al-Maa dalam Angka</p>
                <h2 className="mt-3 text-2xl font-black tracking-tight md:text-4xl">
                  Angka-angka ringkas yang menggambarkan arah pembinaan Al-Maa.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
                  Mulai dari target hafalan, jenjang pendidikan, hingga biaya formulir yang paling sering dicari pengunjung.
                </p>
                <Link
                  href="/profil"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-900"
                >
                  Jelajahi profil <ArrowRight size={16} />
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
                {institutionHighlights.map((item, index) => (
                  <div key={item.label} className={`rounded-[1.35rem] border px-4 py-4 backdrop-blur-sm md:rounded-[1.5rem] md:py-5 ${
                    index === 0
                      ? 'border-sky-300 bg-sky-600 text-white shadow-[0_20px_42px_-30px_rgba(14,165,233,0.45)]'
                      : 'border-white/70 bg-white/78'
                  }`}>
                    <div className={`mb-3 inline-flex rounded-2xl p-3 md:mb-4 ${
                      index === 0 ? 'bg-white/16 text-white' : 'bg-sky-50 text-sky-600'
                    }`}>
                      {item.icon}
                    </div>
                    <p className={`text-2xl font-black tracking-tight ${index === 0 ? 'text-white' : 'text-slate-900'}`}>{item.value}</p>
                    <p className={`mt-1 text-xs font-bold uppercase tracking-[0.18em] ${index === 0 ? 'text-sky-100/90' : 'text-slate-500'}`}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#edf6ff_100%)] py-12 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.10),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.08),_transparent_22%)]" />
        <div className="container relative z-10 mx-auto max-w-6xl px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
            <PublicSectionIntro
              eyebrow="Video Pilihan"
              title="Video pilihan untuk melihat suasana Al-Maa dari dekat"
              description="Beberapa tayangan singkat yang memperlihatkan kegiatan, pembinaan, dan kehidupan pondok."
              actionHref="/video-youtube"
              actionLabel="Jelajahi video"
            />
          </motion.div>

          {isLoading ? (
            <PublicGridSkeleton
              count={3}
              className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3"
              itemClassName="h-56 rounded-[1.75rem]"
            />
          ) : videoSeries.length > 0 ? (
            <div className="mt-7 grid gap-4 md:mt-8 md:grid-cols-3">
              {videoSeries.map((series) => {
                const thumbnail = series.lead.thumbnail || getYouTubeThumbnailUrl(series.lead.url);
                return (
                  <Link
                    key={series.key}
                    href={`/videos/${series.slug}`}
                    className="group overflow-hidden rounded-[1.7rem] border border-sky-100/80 bg-white shadow-[0_24px_50px_-34px_rgba(250,204,21,0.18)] transition-all hover:-translate-y-1 hover:border-sky-200 md:rounded-[1.9rem]"
                  >
                    <div className="relative h-52 overflow-hidden bg-slate-900 md:h-56">
                      {thumbnail ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                          style={{ backgroundImage: `url('${thumbnail}')` }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,#facc15_0%,#10251d_100%)]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                          <PlayCircle size={34} />
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-4 text-white md:p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-200">
                          {series.count} video
                        </p>
                        <h3 className="mt-2 text-xl font-black leading-tight">{series.title}</h3>
                        {series.eventDate ? (
                          <p className="mt-2 text-sm text-slate-200">{series.eventDate}</p>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-8">
              <PublicEmptyState
                icon={PlayCircle}
                title="Belum ada dokumentasi video"
                description="Video kegiatan pondok akan tampil di bagian ini setelah dipublikasikan."
                className="bg-white shadow-[0_24px_50px_-34px_rgba(250,204,21,0.12)]"
              />
            </div>
          )}
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-slate-200/70 bg-[linear-gradient(180deg,#fcfcfa_0%,#f7f7f3_100%)] py-12 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.06),_transparent_24%)]" />
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
            <PublicSectionIntro
              eyebrow="Berita Pondok"
              title="Kabar terbaru dari lingkungan Al-Maa"
              description="Ikuti pengumuman, cerita kegiatan, dan perkembangan terbaru dari pondok."
              actionHref="/news"
              actionLabel="Jelajahi berita"
            />
          </motion.div>

          {isLoading ? (
            <PublicGridSkeleton
              count={2}
              className="mt-8 grid grid-cols-1 gap-6"
              itemClassName="h-56 rounded-[1.75rem]"
            />
          ) : news.length > 0 ? (
            <div className="mt-7 grid grid-cols-1 gap-5 md:mt-8 md:gap-6 xl:grid-cols-[minmax(0,1.14fr)_minmax(0,0.86fr)] xl:items-stretch xl:gap-8">
              <NewsCard news={news[0]} featured />
              <div className="grid gap-6 md:grid-cols-2 md:auto-rows-fr xl:grid-cols-1">
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

      <section className="relative overflow-hidden border-t border-slate-200 bg-[linear-gradient(180deg,#f6f7f3_0%,#eef4ef_100%)] py-12 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.08),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(250,204,21,0.05),_transparent_20%)]" />
        <div className="container relative z-10 mx-auto max-w-6xl px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
            <PublicSectionIntro
              eyebrow="Agenda Mendatang"
              title="Agenda terdekat yang sedang disiapkan pondok"
              description="Pantau jadwal penting dan kegiatan yang akan berlangsung dalam waktu dekat."
              actionHref="/agendas"
              actionLabel="Lihat agenda lengkap"
            />
          </motion.div>

          <div className="mt-8 grid gap-4 md:grid-cols-3 xl:gap-5">
            {isLoading ? (
              <PublicGridSkeleton count={3} className="grid gap-4 md:grid-cols-3 col-span-full" itemClassName="h-44 rounded-[1.75rem]" />
            ) : agendas.length > 0 ? (
              <>
                <article className="group overflow-hidden rounded-[1.85rem] border border-white/75 bg-white/92 shadow-[0_26px_60px_-34px_rgba(250,204,21,0.18)] backdrop-blur-sm md:col-span-2">
                  <div className="grid h-full gap-0 md:grid-cols-[0.9fr_1.1fr]">
                    <div className="relative overflow-hidden bg-[linear-gradient(135deg,#facc15_0%,#10251d_100%)] p-6 text-white md:p-7">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.24),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(250,204,21,0.12),_transparent_26%)]" />
                      <div className="relative flex h-full flex-col">
                        <span className="inline-flex w-fit rounded-full border border-white/12 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-sky-100 backdrop-blur-sm">
                          {agendas[0].category || 'Agenda Pondok'}
                        </span>
                        <div className="mt-8 flex items-end gap-4">
                          <div className="rounded-[1.6rem] border border-white/10 bg-white/10 px-5 py-4 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)] backdrop-blur-sm">
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-200">
                              {formatAgendaMonth(agendas[0].start_date)}
                            </p>
                            <p className="mt-2 text-4xl font-black leading-none">
                              {formatAgendaDay(agendas[0].start_date)}
                            </p>
                          </div>
                          <div className="pb-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-100/80">Jadwal Terdekat</p>
                            <p className="mt-2 text-sm font-semibold text-slate-200">
                              {agendas[0].time_info || '08:00 - selesai'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex h-full flex-col p-6 md:p-7">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-700">Agenda Utama</p>
                      <h3 className="mt-3 text-[1.9rem] font-black leading-[1.02] tracking-[-0.03em] text-slate-900">
                        {agendas[0].title}
                      </h3>
                      <p className="mt-4 text-sm font-medium leading-7 text-slate-600 md:text-[15px]">
                        {agendas[0].description ||
                          'Agenda ini menjadi bagian dari pembinaan rutin untuk memperkuat ilmu, adab, dan kebersamaan di lingkungan Al-Maa.'}
                      </p>
                      <div className="mt-6 grid gap-3 text-sm text-slate-600">
                        <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
                          <Calendar size={16} className="mt-0.5 shrink-0 text-sky-600" />
                          <span>{formatAgendaFullDate(agendas[0].start_date)}</span>
                        </div>
                        <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
                          <MapPin size={16} className="mt-0.5 shrink-0 text-sky-600" />
                          <span>{agendas[0].location || 'Kompleks Al-Maa Parung'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>

                <div className="grid gap-4 md:auto-rows-fr">
                  {agendas.slice(1, 3).map((agenda) => (
                    <article
                      key={agenda.id}
                      className="flex h-full flex-col rounded-[1.75rem] border border-slate-200/80 bg-white/95 p-5 shadow-[0_20px_42px_-32px_rgba(250,204,21,0.16)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-200"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-[1.35rem] bg-sky-500 text-white shadow-lg shadow-sky-200/70">
                          <span className="text-[9px] font-black uppercase tracking-[0.18em]">{formatAgendaMonth(agenda.start_date)}</span>
                          <span className="mt-1 text-xl font-black leading-none">{formatAgendaDay(agenda.start_date)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-700">
                            {agenda.category || 'Agenda'}
                          </p>
                          <h3 className="mt-2 line-clamp-2 text-lg font-black tracking-tight text-slate-900">
                            {agenda.title}
                          </h3>
                        </div>
                      </div>

                      <p className="mt-4 line-clamp-3 text-sm font-medium leading-6 text-slate-600">
                        {agenda.description ||
                          'Agenda pembinaan terjadwal yang memperkuat ilmu, adab, dan kebersamaan di lingkungan pondok.'}
                      </p>

                      <div className="mt-5 space-y-2 text-sm text-slate-500">
                        <div className="flex items-start gap-2">
                          <Calendar size={15} className="mt-0.5 shrink-0 text-sky-500" />
                          <span>{agenda.time_info || formatAgendaFullDate(agenda.start_date)}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin size={15} className="mt-0.5 shrink-0 text-sky-500" />
                          <span>{agenda.location || 'Kompleks Al-Maa Parung'}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
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

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f5f7f3_0%,#ffffff_24%,#ffffff_100%)] pb-12 pt-8 md:pb-16 md:pt-14">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sky-50/80 to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-10 h-28 w-28 -translate-x-1/2 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="container relative mx-auto max-w-6xl px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUpVariant}
            className="mb-8 border-b border-slate-200/80 pb-7 md:mb-10 md:pb-8 md:flex md:items-end md:justify-between md:gap-6"
          >
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-sky-600">Akses Cepat</p>
                  <h2 className="mt-3 max-w-3xl text-[2rem] font-black leading-[1.02] tracking-[-0.03em] text-slate-900 md:text-[3.1rem]">
                    Lanjutkan ke halaman yang paling sering dicari pengunjung.
                  </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 md:text-base">
                Profil, program, fasilitas, dan PSB kami kumpulkan di sini agar perjalanan menjelajah situs terasa lebih ringkas.
              </p>
            </div>
            <Link
              href="/psb"
              className="mt-5 inline-flex items-center gap-2 self-start rounded-full border border-sky-200 bg-white px-5 py-3 text-sm font-bold text-sky-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-800 md:mt-0"
            >
              Lihat PSB <ArrowRight size={16} />
            </Link>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4"
          >
            {focusAreas.map((item) => (
              <motion.div key={item.title} variants={fadeUpVariant}>
                <Link
                  href={item.href}
                  className="group block h-full rounded-[1.8rem] border border-sky-100/70 bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] p-6 shadow-[0_18px_44px_-34px_rgba(250,204,21,0.16)] transition-all duration-300 hover:-translate-y-2 hover:border-sky-200 hover:shadow-[0_24px_60px_-30px_rgba(14,165,233,0.18)] md:rounded-[2rem] md:p-7"
                >
                  <div className="mb-5 inline-flex rounded-2xl bg-white p-4 text-sky-600 ring-1 ring-sky-100 transition-colors group-hover:bg-sky-500 group-hover:text-white group-hover:ring-sky-500">
                    {item.icon}
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.desc}</p>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-sky-700">
                    Selengkapnya <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#0d1522_0%,#0d2f27_58%,#08231e_100%)] py-16 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(250,204,21,0.14),_transparent_22%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.18),_transparent_24%)]" />
        <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-sky-300/16 blur-[110px]" />
        <div className="absolute -bottom-36 left-0 h-72 w-72 rounded-full bg-sky-300/14 blur-[110px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/30 to-transparent" />
        <div className="container relative z-10 mx-auto max-w-6xl px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
            <div className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] shadow-[0_34px_90px_-42px_rgba(0,0,0,0.55)] backdrop-blur-sm">
              <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
                <div className="p-7 sm:p-8 lg:p-10">
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-sky-200">Langkah Berikutnya</p>
                  <h2 className="mt-4 max-w-3xl text-[2.3rem] font-black leading-[1.02] tracking-tight text-white md:text-6xl">
                    Siap melangkah lebih dekat ke Al-Maa?
                  </h2>
                  <p className="mt-6 max-w-2xl text-base leading-8 text-sky-50/88 md:text-lg">
                    Mulai dari profil, program, dan fasilitas, lalu lanjutkan ke PSB saat arah pembinaannya terasa cocok untuk keluarga Anda.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    {[
                      'Profil dan visi pondok',
                      'Program pembinaan santri',
                      'Informasi PSB terbaru',
                    ].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-semibold text-sky-50/90 backdrop-blur-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/psb"
                      className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-black text-sky-800 shadow-[0_24px_55px_-28px_rgba(255,255,255,0.42)] transition-all hover:-translate-y-1 hover:bg-sky-50 sm:w-auto"
                    >
                      Lihat PSB <ArrowRight size={18} />
                    </Link>
                    <Link
                      href="/profil"
                      className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-white/20 bg-white/10 px-8 py-4 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/15 sm:w-auto"
                    >
                      Jelajahi profil
                    </Link>
                  </div>
                </div>

                <div className="border-t border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_100%)] p-7 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
                  <div className="grid gap-4">
                    <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/28 p-5 shadow-[0_20px_40px_-28px_rgba(0,0,0,0.45)]">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-200/90">Jalur Cepat</p>
                      <p className="mt-3 text-2xl font-black leading-tight text-white">Kenali arah pondok, lalu lanjut daftar dengan lebih mantap.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                      {[
                        { step: '01', label: 'Jelajahi profil pondok', href: '/profil' },
                        { step: '02', label: 'Lihat program utama', href: '/program' },
                        { step: '03', label: 'Buka halaman PSB', href: '/psb' },
                      ].map((item) => (
                        <Link
                          key={item.step}
                          href={item.href}
                          className="group rounded-[1.35rem] border border-white/10 bg-white/6 p-4 transition-all hover:-translate-y-1 hover:bg-white/10"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-200/80">{item.step}</span>
                            <ArrowRight size={16} className="text-sky-200/80 transition-transform group-hover:translate-x-1" />
                          </div>
                          <p className="mt-3 text-sm font-bold text-white">{item.label}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}

