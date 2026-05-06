'use client';

import Link from 'next/link';
import { ArrowRight, Columns2, Eye } from 'lucide-react';

export type BuilderPreviewMode = 'draft' | 'compare';

type BuilderPreviewToolbarProps = {
  currentPreviewPath: string;
  effectivePathname: string;
  mode: BuilderPreviewMode;
};

const previewLinks = [
  { label: 'Home', slug: 'home' },
  { label: 'Profil', slug: 'profil' },
  { label: 'Program', slug: 'program' },
  { label: 'PSB', slug: 'psb' },
  { label: 'Kontak', slug: 'kontak' },
  { label: 'Berita', slug: 'news' },
];

function previewBase(mode: BuilderPreviewMode) {
  return mode === 'compare' ? '/builder-compare' : '/builder-preview';
}

export default function BuilderPreviewToolbar({
  currentPreviewPath,
  effectivePathname,
  mode,
}: BuilderPreviewToolbarProps) {
  const currentDraftPath = currentPreviewPath.replace('/builder-compare', '/builder-preview');
  const currentComparePath = currentPreviewPath.replace('/builder-preview', '/builder-compare');

  return (
    <div className="sticky top-0 z-[1200] border-b border-amber-300 bg-amber-50/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-700">
            {mode === 'compare' ? 'Bandingkan Draft vs Published' : 'Preview Draft Builder'}
          </p>
          <p className="mt-1 text-sm font-bold text-slate-900">
            {mode === 'compare'
              ? 'Published adalah tampilan live sekarang. Draft adalah versi kerja yang belum tayang.'
              : 'Halaman ini memakai draft builder, jadi aman dicek dulu sebelum dipublish.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {previewLinks.map((item) => (
            <Link
              key={item.slug}
              href={`${previewBase(mode)}/${item.slug}`}
              className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${
                currentPreviewPath === `${previewBase(mode)}/${item.slug}`
                  ? 'bg-slate-950 text-white'
                  : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              {item.label}
            </Link>
          ))}

          <div className="mx-1 hidden h-8 w-px bg-slate-200 lg:block" />

          <Link
            href={currentDraftPath}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${
              mode === 'draft'
                ? 'bg-sky-600 text-white'
                : 'border border-sky-200 bg-sky-50 text-sky-700'
            }`}
          >
            <Eye size={14} />
            Draft
          </Link>
          <Link
            href={currentComparePath}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${
              mode === 'compare'
                ? 'bg-amber-500 text-white'
                : 'border border-amber-200 bg-white text-amber-700'
            }`}
          >
            <Columns2 size={14} />
            Bandingkan
          </Link>
          <Link
            href="/admin/settings"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-700"
          >
            Settings
          </Link>
          <Link
            href={effectivePathname}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white"
          >
            Live <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
