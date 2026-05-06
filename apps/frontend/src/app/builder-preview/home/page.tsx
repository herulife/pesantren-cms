'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import HomePageRenderer from '@/components/website-builder/HomePageRenderer';
import WebsiteShellRenderer from '@/components/website-builder/WebsiteShellRenderer';
import {
  Agenda,
  GalleryItem,
  getAgendas,
  getGallery,
  getGallerySortTimestamp,
  getNews,
  getPrograms,
  getSettingsMap,
  getVideos,
  News,
  Program,
  resolveDisplayImageUrl,
  SettingsMap,
  Video,
  formatGalleryAlbumTitle,
} from '@/lib/api';
import { parseWebsiteBuilderState } from '@/lib/website-builder';
import { Camera, Play, ThumbsUp } from 'lucide-react';

type MaybeListResponse<T> = T[] | { data?: T[] | null } | null | undefined;

function extractListItems<T>(payload: MaybeListResponse<T>): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object' && Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

export default function BuilderPreviewHomePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [settings, setSettings] = useState<SettingsMap>({});
  const [news, setNews] = useState<News[]>([]);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!loading && (!user || user.role === 'user')) {
      router.replace(user?.role === 'user' ? '/portal' : '/login');
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!user || user.role === 'user') {
      return;
    }

    async function fetchAll() {
      setIsLoading(true);
      try {
        const [settingsData, newsData, agendasData, galleryData, videosData, programsData] = await Promise.all([
          getSettingsMap(),
          getNews(),
          getAgendas(),
          getGallery({ limit: 24, offset: 0 }),
          getVideos({ limit: 24, offset: 0 }),
          getPrograms(),
        ]);
        setSettings(settingsData || {});
        setNews(extractListItems(newsData).slice(0, 3));
        setAgendas(extractListItems(agendasData).slice(0, 3));
        setGallery(extractListItems(galleryData));
        setVideos(extractListItems(videosData));
        setPrograms(extractListItems(programsData));
      } finally {
        setIsLoading(false);
      }
    }

    void fetchAll();
  }, [user]);

  const builderState = useMemo(() => parseWebsiteBuilderState(settings), [settings]);

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

  const schoolName = settings.school_name || 'Darussunnah Parung';
  const welcomeText = settings.web_welcome_text || 'Pondok Pesantren Tahfidz';
  const logoUrl = resolveDisplayImageUrl(settings.web_logo_url || '/assets/img/logo.jpg');
  const schoolAddress =
    settings.school_address ||
    'Jl. KH. Ahmad Sugriwa, Kp. Lengkong Barang RT 01 RW 02, Desa Iwul, Kec. Parung, Kab. Bogor 16330';
  const schoolPhone = settings.school_phone || '0814 1324 1748';
  const schoolEmail = settings.school_email || '';
  const schoolWebsite = settings.school_website || '';
  const whatsappNumber = schoolPhone.replace(/\D/g, '') || '6281413241748';
  const socialLinks = [
    { href: settings.social_instagram || 'https://instagram.com/darussunnahparung', label: 'Instagram', icon: <Camera size={18} /> },
    { href: settings.social_facebook || 'https://facebook.com/darussunnahparung', label: 'Facebook', icon: <ThumbsUp size={18} /> },
    { href: settings.social_youtube || 'https://youtube.com/@darussunnahparung', label: 'YouTube', icon: <Play size={18} /> },
  ].filter((item) => item.href);
  const previewLinks = [
    { label: 'Home', href: '/builder-preview/home' },
    { label: 'Profil', href: '/builder-preview/profil' },
    { label: 'Program', href: '/builder-preview/program' },
    { label: 'PSB', href: '/builder-preview/psb' },
    { label: 'Kontak', href: '/builder-preview/kontak' },
    { label: 'Berita', href: '/builder-preview/news' },
  ];

  if (loading || (!user && !isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="animate-spin text-emerald-400" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="sticky top-0 z-[1200] border-b border-amber-300 bg-amber-50/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 text-amber-950">
              <Eye size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-700">Preview Draft Builder</p>
              <p className="text-sm font-bold text-slate-900">Tampilan ini membaca `draft`, belum live ke pengunjung.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {previewLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${
                  item.href === '/builder-preview/home' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/admin/settings" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-700">
              Kembali ke Settings
            </Link>
            <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white">
              Lihat Live <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      <WebsiteShellRenderer
        shell={builderState.shellDraft}
        theme={builderState.themeDraft}
        pathname="/"
        logoUrl={logoUrl}
        schoolName={schoolName}
        welcomeText={welcomeText}
        schoolAddress={schoolAddress}
        schoolPhone={schoolPhone}
        schoolEmail={schoolEmail}
        schoolWebsite={schoolWebsite}
        whatsappNumber={whatsappNumber}
        socialLinks={socialLinks}
        user={user}
        loading={loading}
        logout={logout}
        showBackToTop={showBackToTop}
        scrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        isPortalPage={false}
      >
        <HomePageRenderer
          layout={builderState.homeDraft}
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
      </WebsiteShellRenderer>
    </div>
  );
}
