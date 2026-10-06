import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Camera, ExternalLink, FolderOpen, Image as ImageIcon } from 'lucide-react';
import { HomeSection } from '@/lib/website-builder';
import { resolveDisplayImageUrl } from '@/lib/api';
import PublicSectionIntro from '@/components/PublicSectionIntro';
import { PublicEmptyState, PublicGridSkeleton } from '@/components/PublicState';
import { GalleryAlbumSummary } from '../HomePageRenderer';
import { getArray, getNumber, getString } from './helpers';

export default function GalleryBlock({ section, albums, isLoading }: { section: HomeSection; albums: GalleryAlbumSummary[]; isLoading: boolean }) {
  const eyebrow = getString(section, 'eyebrow', 'Galeri');
  const title = getString(section, 'title', 'Galeri Kegiatan');
  const subtitle = getString(section, 'subtitle', 'Dokumentasi kegiatan pondok, pembelajaran, dan keseharian santri.');
  const buttonLabel = getString(section, 'button_label', 'Lihat galeri');
  const buttonUrl = getString(section, 'button_url', '/galeri');
  const limit = Math.max(1, getNumber(section, 'limit', 3));
  const source = getString(section, 'source', 'latest');
  const manualIds = getArray<string>(section, 'manual_ids').map((item) => String(item));
  const sourceItems =
    source === 'manual' && manualIds.length > 0
      ? manualIds
          .map((id) => albums.find((item) => item.slug === id || item.key === id))
          .filter((item): item is GalleryAlbumSummary => Boolean(item))
      : albums;
  const items = sourceItems.slice(0, limit);

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] py-16 md:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <PublicSectionIntro eyebrow={eyebrow} title={title} description={subtitle} actionHref={buttonUrl} actionLabel={buttonLabel} />
        {isLoading ? (
          <PublicGridSkeleton count={limit} className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3" itemClassName="h-52 rounded-[1.75rem]" />
        ) : items.length > 0 ? (
          <div className={`mt-8 grid gap-4 ${section.variant === 'cards' ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'}`}>
            {items.map((album) => {
              const isDriveAlbum = Boolean(album.driveUrl);
              return (
                <Link
                  key={album.key}
                  href={isDriveAlbum ? album.driveUrl! : `/galeri/${album.slug}`}
                  target={isDriveAlbum ? '_blank' : undefined}
                  rel={isDriveAlbum ? 'noopener noreferrer' : undefined}
                  className={`group relative overflow-hidden rounded-[1.9rem] shadow-[0_28px_70px_-42px_rgba(15,23,42,0.3)] transition-all duration-500 hover:shadow-[0_32px_80px_-42px_rgba(15,23,42,0.4)] hover:-translate-y-1 ${
                    isDriveAlbum
                      ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ring-1 ring-emerald-500/20 hover:ring-emerald-500/50'
                      : `bg-slate-200 ${section.variant === 'cards' ? 'h-60' : 'h-72'}`
                  } ${!isDriveAlbum && section.variant !== 'cards' ? 'h-72' : ''}`}
                >
                  {isDriveAlbum ? (
                    <>
                      <div className="absolute inset-x-0 top-0 h-20 rounded-t-[1.9rem] bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 py-6">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 shadow-lg shadow-emerald-500/20">
                          <FolderOpen size={32} className="text-emerald-400" />
                        </div>
                        <h3 className="mt-4 text-center text-lg font-black leading-tight text-white">{album.title}</h3>
                        {album.description && (
                          <p className="mt-1 line-clamp-2 text-center text-xs text-slate-400 leading-relaxed">{album.description}</p>
                        )}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between rounded-b-[1.9rem] bg-gradient-to-t from-black/40 via-black/20 to-transparent px-5 pb-5 pt-12">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <ImageIcon size={12} className="text-emerald-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">{album.photoCount} Foto</span>
                          </div>
                          {album.eventDate && (
                            <span className="text-[10px] text-slate-400">{album.eventDate}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1.5">
                          <span className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-300">Google Drive</span>
                          <ExternalLink size={10} className="text-emerald-400" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </Link>
              );
            })}
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
