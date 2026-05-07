'use client';

import React, { useMemo } from 'react';
import { Camera, Play, ThumbsUp } from 'lucide-react';
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

const previewPathMap: Record<WebsiteBuilderLivePreviewTarget, string> = {
  home: '/',
  profil: '/profil',
  program: '/program',
  psb: '/psb',
  kontak: '/kontak',
};

function viewportCanvasClass(viewport: WebsiteBuilderLivePreviewViewport) {
  if (viewport === 'mobile') return 'w-[390px]';
  if (viewport === 'tablet') return 'w-[820px]';
  return 'w-[1180px]';
}

function viewportViewportClass(viewport: WebsiteBuilderLivePreviewViewport) {
  if (viewport === 'mobile') return 'h-[780px]';
  if (viewport === 'tablet') return 'h-[820px]';
  return 'h-[860px]';
}

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
    return <ProgramPageContent />;
  }

  if (previewTarget === 'psb') {
    return <PsbPageContent />;
  }

  return <ContactPageContent />;
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

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-slate-100 p-4 shadow-inner">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Live Preview</p>
          <p className="mt-1 text-sm font-bold text-slate-600">Preview visual real-time, klik di dalam preview dinonaktifkan.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
          {previewPath}
        </span>
      </div>

      <div
        className={`overflow-auto rounded-[1.5rem] border border-slate-300 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.4)] ${viewportViewportClass(
          viewport
        )}`}
      >
        <div className={`${viewportCanvasClass(viewport)} min-h-full pointer-events-none`}>
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
              showBackToTop
              scrollToTop={() => {}}
              isPortalPage={false}
            >
              {renderPreviewContent(previewTarget, home, homeDataSources)}
            </WebsiteShellRenderer>
          </PublicSiteProvider>
        </div>
      </div>
    </div>
  );
}
