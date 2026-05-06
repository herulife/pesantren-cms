'use client';

import React from 'react';
import {
  Agenda,
  GalleryItem,
  News,
  SettingsMap,
  Video,
} from '@/lib/api';
import { HomeBuilderLayout, HomeSection } from '@/lib/website-builder';
import HeroBlock from './blocks/HeroBlock';
import InfoCardsBlock from './blocks/InfoCardsBlock';
import ProfileBlock from './blocks/ProfileBlock';
import ProgramsBlock from './blocks/ProgramsBlock';
import NewsBlock from './blocks/NewsBlock';
import AgendaBlock from './blocks/AgendaBlock';
import GalleryBlock from './blocks/GalleryBlock';
import VideoBlock from './blocks/VideoBlock';
import CtaBlock from './blocks/CtaBlock';

export type GalleryAlbumSummary = {
  key: string;
  title: string;
  slug: string;
  category: string;
  eventDate: string;
  photoCount: number;
  cover: GalleryItem;
};

export type VideoSeriesSummary = {
  key: string;
  title: string;
  slug: string;
  eventDate: string;
  count: number;
  lead: Video;
};

export type HomeBuilderDataSources = {
  news: News[];
  agendas: Agenda[];
  galleryAlbums: GalleryAlbumSummary[];
  videoSeries: VideoSeriesSummary[];
  settings: SettingsMap;
  isLoading: boolean;
};

type HomePageRendererProps = {
  layout: HomeBuilderLayout;
  dataSources: HomeBuilderDataSources;
};

function renderSection(section: HomeSection, dataSources: HomeBuilderDataSources) {
  switch (section.type) {
    case 'hero':
      return <HeroBlock section={section} settings={dataSources.settings} />;
    case 'info-cards':
      return <InfoCardsBlock section={section} />;
    case 'profile':
      return <ProfileBlock section={section} />;
    case 'programs':
      return <ProgramsBlock section={section} mode="programs" />;
    case 'extracurriculars':
      return <ProgramsBlock section={section} mode="extracurriculars" />;
    case 'gallery':
      return <GalleryBlock section={section} albums={dataSources.galleryAlbums} isLoading={dataSources.isLoading} />;
    case 'videos':
      return <VideoBlock section={section} series={dataSources.videoSeries} isLoading={dataSources.isLoading} />;
    case 'news':
      return <NewsBlock section={section} news={dataSources.news} isLoading={dataSources.isLoading} />;
    case 'agendas':
      return <AgendaBlock section={section} agendas={dataSources.agendas} isLoading={dataSources.isLoading} />;
    case 'cta':
      return <CtaBlock section={section} />;
    case 'spacer':
      return <div className="h-10 md:h-16" />;
    default:
      return null;
  }
}

export default function HomePageRenderer({ layout, dataSources }: HomePageRendererProps) {
  const sections = layout.sections.filter((section) => section.enabled);

  return (
    <>
      {sections.map((section) => (
        <React.Fragment key={section.id}>{renderSection(section, dataSources)}</React.Fragment>
      ))}
    </>
  );
}
