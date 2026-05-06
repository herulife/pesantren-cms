import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Camera } from 'lucide-react';
import { HomeSection } from '@/lib/website-builder';
import { resolveDisplayImageUrl } from '@/lib/api';
import PublicSectionIntro from '@/components/PublicSectionIntro';
import { PublicEmptyState, PublicGridSkeleton } from '@/components/PublicState';
import { GalleryAlbumSummary } from '../HomePageRenderer';
import { getString } from './helpers';

export default function GalleryBlock({ section, albums, isLoading }: { section: HomeSection; albums: GalleryAlbumSummary[]; isLoading: boolean }) {
  const title = getString(section, 'title', 'Galeri Kegiatan');
  const subtitle = getString(section, 'subtitle', 'Dokumentasi kegiatan pondok, pembelajaran, dan keseharian santri.');
  const buttonLabel = getString(section, 'button_label', 'Lihat galeri');
  const buttonUrl = getString(section, 'button_url', '/galeri');

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] py-16 md:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <PublicSectionIntro eyebrow="Galeri" title={title} description={subtitle} actionHref={buttonUrl} actionLabel={buttonLabel} />
        {isLoading ? (
          <PublicGridSkeleton count={3} className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3" itemClassName="h-52 rounded-[1.75rem]" />
        ) : albums.length > 0 ? (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {albums.slice(0, 3).map((album) => (
              <Link key={album.key} href={`/galeri/${album.slug}`} className="group relative h-72 overflow-hidden rounded-[1.9rem] bg-slate-200 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.3)]">
                <Image
                  src={resolveDisplayImageUrl(album.cover.image_url)}
                  alt={album.title}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/86 via-slate-950/18 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">{album.photoCount} Foto</p>
                  <h3 className="mt-2 text-xl font-black leading-tight">{album.title}</h3>
                  <div className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-white">
                    Buka Album <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <PublicEmptyState icon={Camera} title="Belum Ada Galeri" description="Album yang sudah diunggah akan muncul di sini." />
          </div>
        )}
      </div>
    </section>
  );
}
