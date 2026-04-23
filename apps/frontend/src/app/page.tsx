'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getNews, getAgendas, getVideos, getGallery, getSettingsMap, News, Agenda, Video, GalleryItem, resolveDisplayImageUrl, formatGalleryAlbumTitle, getGallerySortTimestamp, getYouTubeThumbnailUrl, SettingsMap } from '@/lib/api';
import PublicLayout from '@/components/PublicLayout';
import { PublicEmptyState, PublicGridSkeleton } from '@/components/PublicState';
import PublicSectionIntro from '@/components/PublicSectionIntro';
import NewsCard from '@/components/NewsCard';
import {
  ArrowRight, Shield, BookOpen, Heart,
  Newspaper, MapPin, Clock,
  GraduationCap, Award, School, PlayCircle, Calendar
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';
import { motion } from 'framer-motion';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.4, 0.45, 1] as [number, number, number, number] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  button_text: string;
  button_url: string;
};

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
  title: 'Merekam Jejak Intelektual & Spiritual',
  subtitle: 'Pendidikan tahfidz yang menumbuhkan ilmu, adab, dan kesiapan berdakwah di tengah umat.',
  image_url: '/assets/img/gedung.webp',
  button_text: 'Daftar Sekarang',
  button_url: '/psb',
  ...overrides,
});

function parseHeroSlides(settings: SettingsMap): HeroSlide[] {
  const raw = settings.hero_slides;

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const slides = parsed
          .filter((item) => item && typeof item === 'object')
          .map((item, index) =>
            createHeroSlide({
              id: typeof item.id === 'string' ? item.id : undefined,
              title: typeof item.title === 'string' ? item.title : undefined,
              subtitle: typeof item.subtitle === 'string' ? item.subtitle : undefined,
              image_url: typeof item.image_url === 'string' ? item.image_url : undefined,
              button_text: typeof item.button_text === 'string' ? item.button_text : undefined,
              button_url: typeof item.button_url === 'string' ? item.button_url : undefined,
            }, `slide-${index + 1}`)
          )
          .filter((slide) => slide.title || slide.subtitle || slide.image_url);

        if (slides.length > 0) {
          return slides;
        }
      }
    } catch {
      // Fallback ke pengaturan banner lama bila JSON slider belum valid.
    }
  }

  return [
    createHeroSlide({
      title: settings.banner_title || undefined,
      subtitle: settings.banner_subtitle || undefined,
      image_url: settings.banner_image_url || undefined,
      button_text: settings.banner_button_text || undefined,
      button_url: settings.banner_button_url || undefined,
    }, 'slide-1'),
  ];
}

export default function LandingPage() {
  const [news, setNews] = useState<News[]>([]);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
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
      .slice(0, 5);
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
        const [newsData, agendasData, videosData, galleryData, settingsData] = await Promise.all([
          getNews(), getAgendas(), getVideos({ limit: 50, offset: 0 }), getGallery({ limit: 24, offset: 0 }), getSettingsMap({ silentUnauthorized: true })
        ]);
        const newsPayload = newsData as any;
        const agendaPayload = agendasData as any;
        const videoPayload = videosData as any;
        const galleryPayload = galleryData as any;
        setNews(Array.isArray(newsPayload) ? newsPayload.slice(0, 6) : (newsPayload?.data || []).slice(0, 6));
        setAgendas(Array.isArray(agendaPayload) ? agendaPayload : (agendaPayload?.data || []));
        setVideos(Array.isArray(videoPayload) ? videoPayload : (videoPayload?.data || []));
        setGallery(galleryPayload?.data || []);
        setSettings(settingsData || {});
      } catch (e) {
        console.error('Error fetching data:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAll();
  }, []);

  const heroSlides = useMemo(() => parseHeroSlides(settings), [settings]);
  const canSlideHero = heroSlides.length > 1;

  const infoCards = [
    {
      label: 'Pendaftaran',
      title: settings.card_info_1_title || 'PSB Tahun Ajaran 2026/2027',
      desc: settings.card_info_1_desc || 'Informasi pendaftaran dan alur bergabung sebagai santri baru.',
      href: '/psb',
      icon: <GraduationCap size={32} />,
    },
    {
      label: 'Pembinaan',
      title: settings.card_info_2_title || 'Tahfidz & Adab Harian',
      desc: settings.card_info_2_desc || 'Pembinaan hafalan, ibadah harian, dan pembentukan karakter santri.',
      href: '/program',
      icon: <Award size={32} />,
    },
    {
      label: 'Tentang Pondok',
      title: settings.card_info_3_title || 'Sambutan & Profil Lembaga',
      desc: settings.card_info_3_desc || 'Baca pesan pimpinan dan pelajari visi misi yang dibangun di Darussunnah.',
      href: '/sambutan',
      icon: <School size={32} />,
    },
  ];

  const welcomeSpeechName = settings.welcome_speech_name || 'Ust. Rusdi';
  const welcomeSpeechRole = settings.welcome_speech_role || 'Pimpinan';
  const welcomeSpeechText = settings.welcome_speech_text || 'Assalamu\'alaikum warahmatullahi wabarakatuh. Alhamdulillah, segala puji bagi Allah SWT atas nikmat-Nya, sehingga kita dapat terus berkontribusi dalam mencetak generasi penghafal Al-Qur\'an. Kami berkomitmen tidak hanya melahirkan hafizh, namun membentuk pribadi berasas tauhid, berakhlak mulia, dan mandiri. Proses pendidikan di sini diramu secara komprehensif memadukan Tahfidz, kajian Kitab Kuning, serta keterampilan hidup sesungguhnya. Wassalamu\'alaikum warahmatullahi wabarakatuh.';
  const welcomeSpeechImage = settings.welcome_speech_image || '/assets/img/kepsek.png';
  const welcomeSpeechParagraphs = welcomeSpeechText
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <PublicLayout>
      {/* ═══════════════════ 1. HERO SECTION ═══════════════════ */}
      <section className="relative h-[580px] overflow-hidden sm:h-[650px] lg:h-[750px]">
        <Swiper
          modules={[Pagination, Autoplay, Navigation]}
          loop={canSlideHero}
          navigation={canSlideHero}
          allowTouchMove={canSlideHero}
          pagination={canSlideHero ? { clickable: true } : false}
          autoplay={canSlideHero ? { delay: 6000, disableOnInteraction: false, pauseOnMouseEnter: true } : false}
          speed={1000}
          watchOverflow
          observer
          observeParents
          key={`hero-${heroSlides.length}`}
          className="w-full h-full hero-swiper"
        >
          {heroSlides.map((slide, index) => {
            const isEven = index % 2 === 0;
            const slideImage = resolveDisplayImageUrl(slide.image_url || '/assets/img/gedung.webp');
            return (
              <SwiperSlide key={slide.id}>
                <div className="relative w-full h-full group">
                  <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url('${slideImage}')` }}
                  />
                  <div className={isEven ? 'absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-emerald-900/40' : 'absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-transparent'} />
                  <div className={`container mx-auto px-4 h-full flex flex-col justify-center relative z-10 ${isEven ? 'items-center text-center' : 'items-start text-left'}`}>
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.2)] backdrop-blur-md"
                    >
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      Pondok Pesantren Tahfidz
                    </motion.span>
                    <motion.h1
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className={`mb-6 font-black leading-[1.1] tracking-tight text-white drop-shadow-2xl ${isEven ? 'max-w-5xl text-5xl md:text-7xl lg:text-8xl' : 'max-w-4xl text-5xl md:text-7xl'}`}
                    >
                      {slide.title}
                    </motion.h1>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.8 }}
                      className={`mb-12 text-lg font-light leading-relaxed text-slate-200 drop-shadow-md md:text-2xl ${isEven ? 'max-w-3xl' : 'max-w-xl border-l-4 border-emerald-500 pl-6'}`}
                    >
                      {slide.subtitle}
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1, duration: 0.5 }}
                      className={`flex flex-col gap-4 sm:gap-6 ${isEven ? 'sm:flex-row sm:justify-center' : 'sm:flex-row'}`}
                    >
                      <Link href={slide.button_url || '/psb'} className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 text-sm font-bold text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-300 hover:-translate-y-1 hover:from-emerald-400 hover:to-teal-400 hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] sm:w-auto">
                        {slide.button_text || 'Daftar Sekarang'} <ArrowRight size={16} />
                      </Link>
                      <Link href="/profil" className="flex w-full items-center justify-center gap-3 rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-white/20 sm:w-auto">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/30 text-white backdrop-blur-md">
                          <PlayCircle size={16} />
                        </span>
                        Lihat Profil Pondok
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </section>

      {/* ═══════════════════ 2. FLOATING INFO CARDS ═══════════════════ */}
      <motion.div 
        variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
        className="relative z-20 -mt-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {infoCards.map((card, i) => (
              <motion.div variants={fadeUpVariant} key={i}>
                <Link href={card.href} className="block group relative bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1)] border border-white/50 flex items-center gap-6 hover:-translate-y-2 hover:shadow-[0_20px_50px_-15px_rgba(16,185,129,0.3)] transition-all duration-500 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-sm">
                    {card.icon}
                  </div>
                  <div className="relative">
                    <div className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest mb-1.5 opacity-80">{card.label}</div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors tracking-tight">{card.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{card.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="h-16 lg:h-24" />

      {/* ═══════════════════ 3. BERITA & INFO PENDAFTARAN ═══════════════════ */}
      <div className="container mx-auto px-4 mb-20 lg:mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT: Berita Terkini */}
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUpVariant}
            className="lg:col-span-8">
            <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <PublicSectionIntro
                eyebrow="Kabar Pesantren"
                title="Warta Darussunnah"
                description="Aktivitas, pengumuman, dan artikel terbaru dari lingkungan pesantren."
              />
              <Link href="/news" className="inline-flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest hover:text-emerald-700 transition-colors bg-emerald-50 px-5 py-2.5 rounded-full shrink-0">
                Semua Berita <ArrowRight size={14} />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2].map(i => <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-3xl" />)}
              </div>
            ) : news.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {news.slice(0, 4).map((item) => (
                  <NewsCard key={item.id} news={item} />
                ))}
              </div>
            ) : (
              <PublicEmptyState icon={Newspaper} title="Belum ada berita" description="Berita terbaru akan segera hadir." />
            )}
          </motion.div>

          {/* RIGHT: Sidebar Widget */}
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUpVariant}
            className="lg:col-span-4 flex flex-col gap-8">
            
            {/* Widget PSB */}
            <div className="relative overflow-hidden rounded-[2.5rem] p-8 border-2 border-emerald-100 bg-white shadow-[0_20px_50px_-15px_rgba(16,185,129,0.15)] group hover:-translate-y-1 transition-all duration-500">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-50 rounded-full blur-3xl opacity-60 group-hover:bg-teal-100 transition-colors" />
              <div className="relative z-10">
                <div className="mb-6 flex justify-between items-start">
                   <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                      <GraduationCap size={28} />
                   </div>
                   <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest border border-emerald-600/20 bg-emerald-50/80 text-emerald-800 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Dibuka
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight mb-4 font-outfit uppercase tracking-tight">Pendaftaran Santri Baru</h2>
                <p className="text-slate-500 mb-8 leading-relaxed font-medium">Buka kesempatan putra-putri Anda untuk menjadi penghafal Al-Qur&apos;an di TA 2026/2027.</p>
                <Link href="/psb" className="w-full inline-flex justify-center items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-200 hover:shadow-emerald-300 hover:scale-[1.02] transition-all">
                  Informasi Lengkap <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Widget Agenda Kecil */}
            <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-8">
               <h3 className="text-lg font-black text-slate-900 mb-6 font-outfit uppercase tracking-tight">Agenda Terdekat</h3>
               <div className="space-y-4">
                  {agendas.slice(0, 2).map(ev => (
                    <div key={ev.id} className="flex gap-4">
                       <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center border border-slate-100 shrink-0 shadow-sm leading-none">
                          <span className="text-[10px] font-black text-emerald-600 uppercase mb-0.5">{new Date(ev.start_date).toLocaleString('id-ID', { month: 'short' })}</span>
                          <span className="text-lg font-black text-slate-900">{new Date(ev.start_date).getDate()}</span>
                       </div>
                       <div className="pt-1">
                          <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{ev.title}</h4>
                          <p className="text-xs text-slate-500 font-medium mt-1">{ev.location || 'Kampus Darussunnah'}</p>
                       </div>
                    </div>
                  ))}
               </div>
               <Link href="/agenda" className="mt-8 block text-center text-xs font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors">Lihat Semua Agenda</Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════ 4. PROGRAM UNGGULAN ═══════════════════ */}
      <section className="py-24 bg-slate-50/50 border-y border-slate-200/60 relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUpVariant} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">Program Pendidikan Pondok</h2>
            <div className="h-1.5 w-24 mx-auto rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Tahfidz Al-Qur'an", desc: "Program intensif menghafal Al-Qur'an dengan target 30 juz mutqin.", icon: <BookOpen className="text-emerald-500" />, href: "/program#tahfidz" },
              { title: "Kajian Kitab Kuning", desc: "Mendalami literatur klasik Islam dengan bimbingan asatidz kompeten.", icon: <School className="text-emerald-500" />, href: "/program#kitab-kuning" },
              { title: "Kader Dakwah", desc: "Pembinaan keberanian, tanggung jawab, dan keterampilan menyampaikan ilmu.", icon: <Heart className="text-emerald-500" />, href: "/program#kader-dakwah" },
              { title: "Kemandirian Santri", desc: "Pembiasaan hidup tertib, mandiri, dan disiplin dalam aktivitas harian.", icon: <Award className="text-emerald-500" />, href: "/program#kemandirian" },
            ].map((p, i) => (
              <motion.div variants={fadeUpVariant} key={i}>
                <Link href={p.href} className="block h-full bg-white p-8 rounded-3xl shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] border border-slate-100 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)] hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                  <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-gradient-to-br group-hover:from-emerald-500 group-hover:to-teal-500 group-hover:text-white group-hover:border-transparent transition-all shadow-sm shrink-0">
                    {p.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">{p.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">{p.desc}</p>
                  
                  <div className="mt-auto flex items-center gap-2 text-sm font-bold text-emerald-600 group-hover:text-emerald-700 transition-colors">
                    Pelajari Selengkapnya <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ GALERI VIDEO (NEW) ═══════════════════ */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/assets/img/pattern.svg')] opacity-5" />
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUpVariant} className="mb-12">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <PublicSectionIntro
                  eyebrow="Dokumentasi & Kajian"
                  title="Video Kegiatan Pondok"
                  description="Rekaman kegiatan, kajian, dan momen penting santri yang dapat disimak kembali kapan saja."
                  theme="dark"
                />
                <div className="flex flex-row flex-wrap gap-2 md:gap-3 mt-4 lg:mt-0">
                <Link href="/videos"
                  className="inline-flex justify-center items-center gap-1.5 px-4 py-2 md:px-6 md:py-3 text-xs md:text-sm rounded-full border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-100 font-bold transition-all shadow-md hover:-translate-y-1">
                  Semua Video <ArrowRight size={14} className="md:w-4 md:h-4 text-emerald-300" />
                </Link>
                <a href="https://youtube.com/@darussunnahparung" target="_blank" rel="noopener noreferrer"
                  className="inline-flex justify-center items-center gap-1.5 px-4 py-2 md:px-6 md:py-3 text-xs md:text-sm rounded-full border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200 font-bold transition-all shadow-md hover:-translate-y-1">
                  YouTube <ArrowRight size={14} className="md:w-4 md:h-4 text-emerald-400" />
                </a>
                </div>
              </div>
            </motion.div>

          {isLoading ? (
            <PublicGridSkeleton count={3} className="grid grid-cols-1 gap-6 md:grid-cols-3" itemClassName="h-56 rounded-2xl md:rounded-3xl bg-slate-800" />
          ) : videoSeries.length > 0 ? (
            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex overflow-x-auto pb-6 snap-x gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:pb-0" style={{ scrollbarWidth: 'none' }}>
              {videoSeries.map((series) => {
                const thumbnail = series.lead.thumbnail || getYouTubeThumbnailUrl(series.lead.url);
                return (
                <motion.a variants={fadeUpVariant} href={series.lead.url} target="_blank" rel="noopener noreferrer" key={series.key} className="group block shrink-0 snap-start w-[85vw] max-w-[320px] md:w-auto md:max-w-none relative overflow-hidden rounded-2xl md:rounded-3xl bg-slate-800 border border-slate-700 hover:border-emerald-500/50 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] transition-all">
                  <div className="relative aspect-video overflow-hidden">
                    {thumbnail ? (
                      <Image fill unoptimized sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" src={thumbnail} alt={series.title} className="object-cover group-hover:scale-105 transition-transform duration-700" onError={(e) => { e.currentTarget.srcset = ''; e.currentTarget.src = 'https://via.placeholder.com/640x360?text=Video+Thumbnail' }} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-500">
                        <PlayCircle size={40} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/20 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-emerald-500/90 backdrop-blur-md text-white flex items-center justify-center scale-90 group-hover:scale-110 shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300">
                        <PlayCircle size={24} className="md:w-8 md:h-8" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 md:p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400 mb-1.5 md:mb-2">{series.count} video</p>
                    <h3 className="font-bold text-base md:text-lg text-slate-100 line-clamp-2 group-hover:text-emerald-400 transition-colors">{series.title}</h3>
                    {series.eventDate && <p className="mt-2 md:mt-3 text-xs font-bold text-slate-400">{series.eventDate}</p>}
                  </div>
                </motion.a>
              )})}
            </motion.div>
          ) : (
            <PublicEmptyState
              icon={PlayCircle}
              title="Belum ada dokumentasi video"
              description="Video kegiatan dan kajian terbaru akan tampil di sini setelah diunggah."
              className="border-slate-700/50 bg-slate-800/30 text-white"
              iconClassName="text-slate-600"
              titleClassName="text-white"
              descriptionClassName="text-slate-400"
            />
          )}
        </div>
      </section>



      {/* ═══════════════════ 6. AGENDA MENDATANG ═══════════════════ */}
      <section className="py-24 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/assets/img/pattern-light.svg')] opacity-30" />
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} className="mb-12">
            <PublicSectionIntro
              eyebrow="Jadwal Kegiatan"
              title="Agenda Mendatang"
              description="Pantau kegiatan pondok, agenda akademik, dan informasi penting yang akan datang."
              align="center"
            />
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex gap-6 overflow-x-auto pb-8 snap-x pr-4 md:pr-0" style={{ scrollbarWidth: 'none' }}>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-[220px] w-[85vw] max-w-[300px] shrink-0 animate-pulse rounded-3xl bg-white/80" />
              ))
            ) : agendas.length > 0 ? agendas.map((ev) => {
              const date = new Date(ev.start_date);
              return (
                <motion.div variants={fadeUpVariant} key={ev.id} className="snap-start shrink-0 w-[85vw] max-w-[300px] bg-white rounded-3xl border border-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] p-6 group hover:-translate-y-2 hover:shadow-[0_20px_50px_-15px_rgba(16,185,129,0.2)] transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                  <div className="flex items-center gap-4 mb-6 relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/30">
                      {date.getDate()}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">{date.toLocaleString('id-ID', { month: 'long' })}</span>
                      <span className="block text-sm font-bold text-slate-700">{date.getFullYear()}</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-xl text-slate-800 mb-4 line-clamp-2 group-hover:text-emerald-600 transition-colors relative">{ev.title}</h3>
                  <div className="space-y-2 relative">
                    {ev.location && <div className="text-sm text-slate-500 flex items-center gap-2.5"><MapPin size={16} className="text-emerald-500" />{ev.location}</div>}
                    {ev.time_info && <div className="text-sm text-slate-500 flex items-center gap-2.5"><Clock size={16} className="text-emerald-500" />{ev.time_info}</div>}
                  </div>
                </motion.div>
              );
            }) : <div className="w-full"><PublicEmptyState icon={Calendar} title="Belum ada agenda terbaru" description="Agenda pondok yang akan datang akan ditampilkan di bagian ini." className="bg-white/80 py-12" /></div>}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ GALERI PONDOK (MOSAIC) ═══════════════════ */}
      <section className="py-24 bg-white relative">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} className="mb-12">
            <PublicSectionIntro
              eyebrow="Dokumentasi Visual"
              title="Potret Pesantren"
              description="Album kegiatan terbaru yang memperlihatkan ritme belajar, ibadah, dan kehidupan santri di Darussunnah."
              actionHref="/galeri"
              actionLabel="Lihat Galeri Lengkap"
            />
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <PublicGridSkeleton count={1} className="lg:col-span-7" itemClassName="h-[420px] rounded-[2.75rem]" />
              <PublicGridSkeleton count={3} className="grid gap-6 sm:grid-cols-2 lg:col-span-5" itemClassName="h-[196px] rounded-[2rem]" />
            </div>
          ) : galleryAlbums.length > 0 ? (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-12">
              <Link href={`/galeri/${galleryAlbums[0].slug}`} className="group relative overflow-hidden rounded-[2rem] lg:rounded-[2.75rem] border border-slate-100 bg-slate-50 shadow-[0_30px_70px_-35px_rgba(15,23,42,0.25)] lg:col-span-7">
                <div className="relative h-[240px] sm:h-[320px] md:h-[420px]">
                  <Image src={resolveDisplayImageUrl(galleryAlbums[0].cover.image_url)} alt={galleryAlbums[0].title} fill unoptimized sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 md:p-8 text-white">
                    <p className="mb-2 md:mb-3 text-[9px] md:text-[10px] font-black uppercase tracking-[0.35em] text-emerald-200">{galleryAlbums[0].category}</p>
                    <h3 className="max-w-xl text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight">{galleryAlbums[0].title}</h3>
                    <div className="mt-3 md:mt-4 flex flex-wrap items-center gap-2 md:gap-3 text-[10px] md:text-xs font-bold text-slate-100">
                      <span className="rounded-full bg-white/10 px-3 py-1.5 md:px-4 md:py-2 backdrop-blur-sm">{galleryAlbums[0].photoCount} foto</span>
                      {galleryAlbums[0].eventDate ? <span className="rounded-full bg-white/10 px-3 py-1.5 md:px-4 md:py-2 backdrop-blur-sm">{galleryAlbums[0].eventDate}</span> : null}
                    </div>
                  </div>
                </div>
              </Link>

              <div className="grid gap-4 md:gap-6 grid-cols-2 sm:grid-cols-2 lg:col-span-5">
                {galleryAlbums.slice(1).map((album) => (
                  <Link key={album.key} href={`/galeri/${album.slug}`} className="group relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 bg-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.2)]">
                    <div className="relative h-[130px] sm:h-[150px] md:h-[196px]">
                      <Image src={resolveDisplayImageUrl(album.cover.image_url)} alt={album.title} fill unoptimized sizes="(max-width: 1024px) 50vw, 30vw" className="object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-3 md:p-5 text-white">
                        <p className="mb-1 md:mb-2 text-[8px] md:text-[9px] font-black uppercase tracking-[0.28em] text-emerald-200">{album.category}</p>
                        <h3 className="line-clamp-2 text-xs sm:text-sm md:text-lg font-black uppercase tracking-tight">{album.title}</h3>
                        <p className="mt-1 md:mt-2 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-slate-200">{album.photoCount} foto</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          ) : (
            <PublicEmptyState
              icon={School}
              title="Belum ada album galeri terbaru"
              description="Album kegiatan terbaru akan muncul di sini setelah dokumentasi dipublikasikan."
              className="bg-slate-50"
            />
          )}
        </div>
      </section>

      {/* ═══════════════════ 7. FAQ ═══════════════════ */}
      {/* ═══════════════════ 8. CALL TO ACTION ═══════════════════ */}
      <section className="py-24 lg:py-32 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[30rem] h-[30rem] bg-emerald-400 rounded-full blur-[100px] opacity-40 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-[30rem] h-[30rem] bg-teal-400 rounded-full blur-[100px] opacity-30 animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('/assets/img/pattern.svg')] opacity-10" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant}>
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-emerald-100 mb-8 tracking-tight">
              Siap Bergabung Bersama Kami?
            </h2>
            <p className="text-emerald-50 text-lg md:text-2xl max-w-3xl mx-auto mb-14 leading-relaxed font-light">
              Kenali lebih dekat sistem pendidikan Darussunnah dan lanjutkan ke proses pendaftaran santri baru.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
              <Link href="/psb" className="px-10 py-5 bg-white text-emerald-800 font-extrabold text-lg rounded-full hover:bg-slate-50 hover:-translate-y-1 hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center gap-3">
                Lihat Info PSB <ArrowRight size={20} />
              </Link>
              <a href="https://wa.me/6281413241748" target="_blank" rel="noopener noreferrer"
                className="px-10 py-5 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-lg rounded-full hover:bg-white/20 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3">
                Hubungi via WhatsApp
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
