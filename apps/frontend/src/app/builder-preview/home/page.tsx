'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import HomePageRenderer from '@/components/website-builder/HomePageRenderer';
import BuilderPreviewToolbar, { BuilderPreviewMode } from '@/components/website-builder/BuilderPreviewToolbar';
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
  const pathname = usePathname();
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
  const previewMode: BuilderPreviewMode = pathname.startsWith('/builder-compare') ? 'compare' : 'draft';
  const socialLinks = [
    { href: settings.social_instagram || 'https://instagram.com/darussunnahparung', label: 'Instagram', icon: <Camera size={18} /> },
    { href: settings.social_facebook || 'https://facebook.com/darussunnahparung', label: 'Facebook', icon: <ThumbsUp size={18} /> },
    { href: settings.social_youtube || 'https://youtube.com/@darussunnahparung', label: 'YouTube', icon: <Play size={18} /> },
  ].filter((item) => item.href);

  if (loading || (!user && !isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="animate-spin text-emerald-400" size={28} />
      </div>
    );
  }

  const shellRendererProps = {
    pathname: '/',
    logoUrl,
    schoolName,
    welcomeText,
    schoolAddress,
    schoolPhone,
    schoolEmail,
    schoolWebsite,
    whatsappNumber,
    socialLinks,
    user,
    loading,
    logout,
    showBackToTop,
    scrollToTop: () => window.scrollTo({ top: 0, behavior: 'smooth' as ScrollBehavior }),
    isPortalPage: false,
  };

  const homeDataSources = {
    news,
    agendas,
    programs,
    galleryAlbums,
    videoSeries,
    settings,
    isLoading,
  };

  if (previewMode === 'compare') {
    return (
      <div className="min-h-screen bg-slate-100">
        <BuilderPreviewToolbar currentPreviewPath={pathname} effectivePathname="/" mode={previewMode} />

        <div className="mx-auto max-w-[1720px] px-4 py-6 md:px-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Published</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">Homepage Live Sekarang</h3>
                <p className="mt-1 text-sm font-medium text-slate-600">
                  Ini versi yang sedang aktif untuk pengunjung website.
                </p>
              </div>

              <WebsiteShellRenderer
                {...shellRendererProps}
                shell={builderState.shellPublished}
                theme={builderState.themePublished}
              >
                <HomePageRenderer layout={builderState.homePublished} dataSources={homeDataSources} />
              </WebsiteShellRenderer>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-700">Draft</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">Homepage Builder Yang Belum Live</h3>
                <p className="mt-1 text-sm font-medium text-slate-600">
                  Bandingkan perubahan hero, urutan block, navbar, dan footer sebelum publish.
                </p>
              </div>

              <WebsiteShellRenderer
                {...shellRendererProps}
                shell={builderState.shellDraft}
                theme={builderState.themeDraft}
              >
                <HomePageRenderer layout={builderState.homeDraft} dataSources={homeDataSources} />
              </WebsiteShellRenderer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <BuilderPreviewToolbar currentPreviewPath={pathname} effectivePathname="/" mode={previewMode} />

      <WebsiteShellRenderer
        {...shellRendererProps}
        shell={builderState.shellDraft}
        theme={builderState.themeDraft}
      >
        <HomePageRenderer layout={builderState.homeDraft} dataSources={homeDataSources} />
      </WebsiteShellRenderer>
    </div>
  );
}
