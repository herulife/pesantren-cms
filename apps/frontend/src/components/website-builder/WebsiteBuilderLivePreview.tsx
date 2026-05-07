'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BatteryFull,
  Camera,
  Globe2,
  Lock,
  Monitor,
  Play,
  Smartphone,
  TabletSmartphone,
  ThumbsUp,
  Wifi,
} from 'lucide-react';
import {
  Agenda,
  formatGalleryAlbumTitle,
  GalleryItem,
  getGallerySortTimestamp,
  News,
  Program,
  resolveDisplayImageUrl,
  SettingsMap,
  Video,
} from '@/lib/api';
import { PublicSiteProvider } from '@/components/PublicSiteContext';
import { ContactPageContent } from '@/app/kontak/page';
import { ProfilPageContent } from '@/app/profil/page';
import { ProgramPageContent } from '@/app/program/page';
import { PsbPageContent } from '@/app/psb/page';
import {
  BuilderPageKey,
  HomeBuilderLayout,
  WebsiteBuilderPages,
  WebsiteBuilderShell,
  WebsiteBuilderState,
  WebsiteBuilderTheme,
} from '@/lib/website-builder';
import HomePageRenderer, { HomeBuilderDataSources } from './HomePageRenderer';
import WebsiteShellRenderer from './WebsiteShellRenderer';

export type WebsiteBuilderLivePreviewTarget = 'home' | BuilderPageKey;
export type WebsiteBuilderLivePreviewViewport = 'desktop' | 'tablet' | 'mobile';

type WebsiteBuilderLivePreviewProps = {
  previewTarget: WebsiteBuilderLivePreviewTarget;
  viewport: WebsiteBuilderLivePreviewViewport;
  settings: SettingsMap;
  theme: WebsiteBuilderTheme;
  shell: WebsiteBuilderShell;
  home: HomeBuilderLayout;
  pages: WebsiteBuilderPages;
  dataSources: {
    news: News[];
    agendas: Agenda[];
    gallery: GalleryItem[];
    videos: Video[];
    programs: Program[];
  };
};

type PreviewFrameConfig = {
  label: string;
  frameWidth: number;
  frameHeight: number;
  screenWidth: number;
  screenHeight: number;
  chromeHeight: number;
  fallbackScale: number;
  frameOuterClass: string;
  screenOuterClass: string;
  canvasWrapClass: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const previewPathMap: Record<WebsiteBuilderLivePreviewTarget, string> = {
  home: '/',
  profil: '/profil',
  program: '/program',
  psb: '/psb',
  kontak: '/kontak',
};

const previewTitleMap: Record<WebsiteBuilderLivePreviewTarget, string> = {
  home: 'Homepage Public',
  profil: 'Halaman Profil',
  program: 'Halaman Program',
  psb: 'Halaman PSB',
  kontak: 'Halaman Kontak',
};

const previewFrameConfigs: Record<WebsiteBuilderLivePreviewViewport, PreviewFrameConfig> = {
  desktop: {
    label: 'Desktop',
    frameWidth: 1220,
    frameHeight: 900,
    screenWidth: 1180,
    screenHeight: 840,
    chromeHeight: 52,
    fallbackScale: 0.42,
    frameOuterClass:
      'rounded-[2rem] border border-slate-300/80 bg-[linear-gradient(180deg,#f8fafc_0%,#dbe4f3_100%)] p-[18px] shadow-[0_28px_80px_-45px_rgba(15,23,42,0.45)]',
    screenOuterClass: 'overflow-hidden rounded-[1.35rem] border border-slate-300/70 bg-white',
    canvasWrapClass: 'rounded-[1.4rem] bg-[radial-gradient(circle_at_top,#eef4ff_0%,#dce7f5_48%,#d6dfec_100%)] p-4',
    icon: Monitor,
  },
  tablet: {
    label: 'Tablet',
    frameWidth: 900,
    frameHeight: 1090,
    screenWidth: 820,
    screenHeight: 980,
    chromeHeight: 48,
    fallbackScale: 0.58,
    frameOuterClass:
      'rounded-[2.4rem] border border-slate-800/80 bg-[linear-gradient(180deg,#1f2937_0%,#0f172a_100%)] p-[20px] shadow-[0_30px_90px_-50px_rgba(15,23,42,0.7)]',
    screenOuterClass: 'overflow-hidden rounded-[1.8rem] border border-white/10 bg-white',
    canvasWrapClass: 'rounded-[1.6rem] bg-[radial-gradient(circle_at_top,#f8fafc_0%,#e5eef9_45%,#dae3ef_100%)] p-4',
    icon: TabletSmartphone,
  },
  mobile: {
    label: 'Mobile',
    frameWidth: 450,
    frameHeight: 930,
    screenWidth: 390,
    screenHeight: 844,
    chromeHeight: 42,
    fallbackScale: 0.9,
    frameOuterClass:
      'rounded-[3rem] border border-slate-900/85 bg-[linear-gradient(180deg,#111827_0%,#030712_100%)] p-[18px] shadow-[0_36px_90px_-52px_rgba(2,6,23,0.85)]',
    screenOuterClass: 'overflow-hidden rounded-[2.25rem] border border-white/10 bg-white',
    canvasWrapClass: 'rounded-[1.7rem] bg-[radial-gradient(circle_at_top,#f8fafc_0%,#e7eef7_50%,#dbe5f1_100%)] p-4',
    icon: Smartphone,
  },
};

function renderPreviewContent(
  previewTarget: WebsiteBuilderLivePreviewTarget,
  home: HomeBuilderLayout,
  dataSources: HomeBuilderDataSources
) {
  if (previewTarget === 'home') {
    return <HomePageRenderer layout={home} dataSources={dataSources} />;
  }

  if (previewTarget === 'profil') {
    return <ProfilPageContent />;
  }

  if (previewTarget === 'program') {
    return <ProgramPageContent previewPrograms={dataSources.programs} disableFetch />;
  }

  if (previewTarget === 'psb') {
    return <PsbPageContent />;
  }

  return <ContactPageContent />;
}

function renderChrome(
  viewport: WebsiteBuilderLivePreviewViewport,
  previewPath: string,
  previewTitle: string
) {
  if (viewport === 'desktop') {
    return (
      <div className="flex h-[52px] items-center gap-3 border-b border-slate-200 bg-slate-100 px-4">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500">
          <Lock size={12} className="text-emerald-500" />
          <span className="truncate">darussunnahparung.com{previewPath}</span>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
          {previewTitle}
        </span>
      </div>
    );
  }

  if (viewport === 'tablet') {
    return (
      <div className="flex h-[48px] items-center justify-between border-b border-slate-200 bg-slate-50 px-4">
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
          <Globe2 size={12} className="text-sky-500" />
          {previewPath}
        </div>
        <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{previewTitle}</span>
      </div>
    );
  }

  return (
    <div className="relative flex h-[42px] items-center justify-center bg-slate-50 px-4">
      <div className="absolute left-1/2 top-2 h-1.5 w-24 -translate-x-1/2 rounded-full bg-slate-900/80" />
      <div className="absolute left-4 flex items-center gap-1.5 text-[11px] font-black text-slate-500">
        <span>9:41</span>
      </div>
      <div className="absolute right-4 flex items-center gap-1.5 text-slate-500">
        <Wifi size={12} />
        <BatteryFull size={12} />
      </div>
      <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
        {previewPath}
      </div>
    </div>
  );
}

export default function WebsiteBuilderLivePreview({
  previewTarget,
  viewport,
  settings,
  theme,
  shell,
  home,
  pages,
  dataSources,
}: WebsiteBuilderLivePreviewProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [availableWidth, setAvailableWidth] = useState(0);

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;

    const updateWidth = () => setAvailableWidth(node.clientWidth);
    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }

    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

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
    {
      href: settings.social_instagram || 'https://instagram.com/darussunnahparung',
      label: 'Instagram',
      icon: <Camera size={18} />,
    },
    {
      href: settings.social_facebook || 'https://facebook.com/darussunnahparung',
      label: 'Facebook',
      icon: <ThumbsUp size={18} />,
    },
    {
      href: settings.social_youtube || 'https://youtube.com/@darussunnahparung',
      label: 'YouTube',
      icon: <Play size={18} />,
    },
  ].filter((item) => item.href);

  const builderState = useMemo<WebsiteBuilderState>(
    () => ({
      enabled: true,
      themeDraft: theme,
      themePublished: theme,
      shellDraft: shell,
      shellPublished: shell,
      homeDraft: home,
      homePublished: home,
      pagesDraft: pages,
      pagesPublished: pages,
      revisions: [],
    }),
    [home, pages, shell, theme]
  );

  const homeDataSources = useMemo<HomeBuilderDataSources>(() => {
    const galleryAlbums = Array.from(
      dataSources.gallery.reduce((map, item) => {
        const key = item.album_slug || item.album_name || `single-${item.id}`;
        const current = map.get(key) || [];
        current.push(item);
        map.set(key, current);
        return map;
      }, new Map<string, GalleryItem[]>()).entries()
    )
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
      .sort(
        (a, b) =>
          getGallerySortTimestamp(b.eventDate, b.cover.created_at) -
          getGallerySortTimestamp(a.eventDate, a.cover.created_at)
      );

    const videoSeries = Array.from(
      dataSources.videos.reduce((map, item) => {
        const key = item.series_slug || item.series_name || `single-${item.id}`;
        const current = map.get(key) || [];
        current.push(item);
        map.set(key, current);
        return map;
      }, new Map<string, Video[]>()).entries()
    )
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
      .sort(
        (a, b) =>
          getGallerySortTimestamp(b.eventDate, b.lead.created_at) -
          getGallerySortTimestamp(a.eventDate, a.lead.created_at)
      );

    return {
      news: dataSources.news,
      agendas: dataSources.agendas,
      programs: dataSources.programs,
      galleryAlbums,
      videoSeries,
      settings,
      isLoading: false,
    };
  }, [dataSources.agendas, dataSources.gallery, dataSources.news, dataSources.programs, dataSources.videos, settings]);

  const previewPath = previewPathMap[previewTarget];
  const previewTitle = previewTitleMap[previewTarget];
  const frameConfig = previewFrameConfigs[viewport];
  const FrameIcon = frameConfig.icon;
  const frameScale =
    availableWidth > 0
      ? Math.min((availableWidth - 24) / frameConfig.frameWidth, 1)
      : frameConfig.fallbackScale;
  const scaledFrameHeight = frameConfig.frameHeight * frameScale;
  const zoomPercent = Math.round(frameScale * 100);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_25px_70px_-40px_rgba(15,23,42,0.28)]">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Live Preview</p>
            <h4 className="mt-2 text-lg font-black text-slate-950">Preview yang lebih mirip tampilan publik</h4>
            <p className="mt-2 max-w-xl text-sm leading-7 text-slate-500">
              Preview ini auto-fit ke panel, memakai frame perangkat, dan sengaja non-interaktif supaya kamu bisa fokus menilai ritme layout, proporsi, dan visual hierarchy.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
              <FrameIcon size={13} />
              {frameConfig.label}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              {previewPath}
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
              Auto Fit {zoomPercent}%
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Context</p>
            <p className="mt-1 text-sm font-bold text-slate-700">
              {previewTitle} ditampilkan seperti halaman publik, tapi tanpa interaksi klik agar alur edit tetap aman.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Mode</p>
            <p className="mt-1 text-sm font-black text-slate-900">Draft Real-Time</p>
          </div>
        </div>

        <div ref={frameRef} className={frameConfig.canvasWrapClass}>
          <div
            className="relative mx-auto max-w-full"
            style={{ height: `${scaledFrameHeight}px` }}
          >
            <div
              className="absolute left-1/2 top-0"
              style={{
                width: `${frameConfig.frameWidth}px`,
                height: `${frameConfig.frameHeight}px`,
                transform: `translateX(-50%) scale(${frameScale})`,
                transformOrigin: 'top center',
              }}
            >
              <div className={frameConfig.frameOuterClass}>
                <div className={frameConfig.screenOuterClass}>
                  {renderChrome(viewport, previewPath, previewTitle)}
                  <div
                    className="overflow-hidden bg-white"
                    style={{
                      width: `${frameConfig.screenWidth}px`,
                      height: `${frameConfig.screenHeight - frameConfig.chromeHeight}px`,
                    }}
                  >
                    <div
                      className="pointer-events-none"
                      style={{ width: `${frameConfig.screenWidth}px`, minHeight: `${frameConfig.screenHeight - frameConfig.chromeHeight}px` }}
                    >
                      <PublicSiteProvider
                        value={{
                          settings,
                          builderState,
                          effectivePathname: previewPath,
                          isBuilderPreview: true,
                          renderMode: 'draft',
                          useBuilderContent: true,
                        }}
                      >
                        <WebsiteShellRenderer
                          shell={shell}
                          theme={theme}
                          pathname={previewPath}
                          logoUrl={logoUrl}
                          schoolName={schoolName}
                          welcomeText={welcomeText}
                          schoolAddress={schoolAddress}
                          schoolPhone={schoolPhone}
                          schoolEmail={schoolEmail}
                          schoolWebsite={schoolWebsite}
                          whatsappNumber={whatsappNumber}
                          socialLinks={socialLinks}
                          user={null}
                          loading={false}
                          logout={async () => {}}
                          showBackToTop={false}
                          scrollToTop={() => {}}
                          isPortalPage={false}
                        >
                          {renderPreviewContent(previewTarget, home, homeDataSources)}
                        </WebsiteShellRenderer>
                      </PublicSiteProvider>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-500">
          Preview tab terpisah tetap tersedia kalau kamu ingin cek area yang lebih panjang atau membandingkan draft dengan versi live penuh.
        </div>
      </div>
    </div>
  );
}
