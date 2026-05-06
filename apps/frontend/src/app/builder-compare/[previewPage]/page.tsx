import React from 'react';
import { notFound } from 'next/navigation';
import ProfilPage from '@/app/profil/page';
import ProgramPage from '@/app/program/page';
import PsbPage from '@/app/psb/page';
import ContactPage from '@/app/kontak/page';
import NewsPage from '@/app/news/page';
import GalleryPage from '@/app/galeri/page';
import VideosPage from '@/app/videos/page';
import SambutanPage from '@/app/sambutan/page';
import TeachersPage from '@/app/teachers/page';
import FacilitiesPage from '@/app/facilities/page';
import AgendasPage from '@/app/agendas/page';

const previewPageMap: Record<string, React.ComponentType> = {
  profil: ProfilPage,
  program: ProgramPage,
  psb: PsbPage,
  kontak: ContactPage,
  news: NewsPage,
  galeri: GalleryPage,
  videos: VideosPage,
  sambutan: SambutanPage,
  teachers: TeachersPage,
  facilities: FacilitiesPage,
  agendas: AgendasPage,
};

export default async function BuilderComparePage({
  params,
}: {
  params: Promise<{ previewPage: string }>;
}) {
  const { previewPage } = await params;
  const PageComponent = previewPageMap[previewPage];

  if (!PageComponent) {
    notFound();
  }

  return <PageComponent />;
}
