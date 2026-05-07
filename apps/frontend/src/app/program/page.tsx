'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PublicLayout from '@/components/PublicLayout';
import { useWebsiteBuilderPageContent } from '@/components/PublicSiteContext';
import { defaultWebsiteBuilderPages } from '@/lib/website-builder';
import { getPrograms, Program, resolveDisplayImageUrl } from '@/lib/api';
import {
  ArrowRight,
  Award,
  BookOpen,
  Compass,
  GraduationCap,
  Heart,
  Target,
} from 'lucide-react';

const featuredCardIcons = [
  <Heart key="heart" size={22} />,
  <Compass key="compass" size={22} />,
  <BookOpen key="book" size={22} />,
  <Award key="award" size={22} />,
  <GraduationCap key="graduation" size={22} />,
  <Target key="target" size={22} />,
];

export function ProgramPageContent({
  previewPrograms,
  disableFetch = false,
}: {
  previewPrograms?: Program[];
  disableFetch?: boolean;
} = {}) {
  const pageContent = useWebsiteBuilderPageContent('program', defaultWebsiteBuilderPages.program);
  const [programs, setPrograms] = useState<Program[]>(previewPrograms || []);
  const [isLoading, setIsLoading] = useState(!disableFetch && !(previewPrograms && previewPrograms.length > 0));

  useEffect(() => {
    if (disableFetch) {
      setPrograms(previewPrograms || []);
      setIsLoading(false);
      return;
    }

    let isActive = true;

    async function fetchPrograms() {
      try {
        const data = await getPrograms();
        if (!isActive) {
          return;
        }

        const sorted = [...data].sort((a, b) => {
          const orderA = a.order_index ?? 0;
          const orderB = b.order_index ?? 0;
          if (orderA !== orderB) {
            return orderA - orderB;
          }
          return a.title.localeCompare(b.title);
        });

        setPrograms(sorted);
      } catch (error) {
        console.error('Error fetching programs:', error);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void fetchPrograms();

    return () => {
      isActive = false;
    };
  }, [disableFetch, previewPrograms]);

  return (
    <>
      <section className="relative overflow-hidden border-b border-emerald-900/80 bg-slate-950 py-24 text-white lg:py-28">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url('${pageContent.hero.background_image_url}')` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(2,6,23,0.96)_10%,rgba(2,6,23,0.84)_44%,rgba(6,78,59,0.66)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_24%)]" />
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-emerald-100 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                {pageContent.hero.eyebrow}
              </p>
              <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
                {pageContent.hero.title}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-emerald-50/90">
                {pageContent.hero.subtitle}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {pageContent.hero.tags.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/12 bg-black/18 px-4 py-2 text-xs font-semibold text-emerald-50/90 backdrop-blur-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {pageContent.hero.highlights.map((item) => (
                <div
                  key={`${item.label}-${item.value}`}
                  className="rounded-[1.65rem] border border-white/10 bg-white/8 px-5 py-5 shadow-[0_20px_45px_-30px_rgba(0,0,0,0.45)] backdrop-blur-sm"
                >
                  <p className="text-3xl font-black leading-none text-white">{item.value}</p>
                  <p className="mt-3 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/85">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fbfcfa_0%,#f3f7f3_100%)] py-16 md:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.08),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(15,118,110,0.05),_transparent_22%)]" />
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
              {pageContent.featured.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
              {pageContent.featured.title}
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-slate-600">
              {pageContent.featured.subtitle}
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pageContent.featured.cards.map((program, index) => (
              <div
                key={`${program.title}-${index}`}
                className="group overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.2)] backdrop-blur-sm"
              >
                <div className="relative h-52 overflow-hidden bg-slate-100">
                  {program.image_url ? (
                    <Image
                      src={program.image_url}
                      alt={program.title}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/16 to-transparent" />
                  <div className="absolute left-5 top-5 inline-flex rounded-2xl bg-white/12 p-4 text-emerald-100 backdrop-blur-sm">
                    {featuredCardIcons[index % featuredCardIcons.length]}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <h3 className="text-xl font-black tracking-tight">{program.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-200">{program.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-slate-200 bg-[#f7f8f4] py-16 md:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.10),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(15,118,110,0.08),_transparent_28%)]" />
        <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
          <div className="rounded-[2rem] border border-white/80 bg-white/92 p-8 shadow-[0_24px_55px_-36px_rgba(15,23,42,0.18)] backdrop-blur-sm">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
              {pageContent.curriculum.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              {pageContent.curriculum.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{pageContent.curriculum.subtitle}</p>
            <div className="mt-8 space-y-4">
              {pageContent.curriculum.tracks.map((track, index) => (
                <div key={track} className="rounded-[1.5rem] border border-slate-100 bg-slate-50/90 px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">
                    0{index + 1}
                  </p>
                  <p className="mt-2 font-bold text-slate-800">{track}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-900 bg-[linear-gradient(180deg,#0f172a_0%,#10251d_100%)] p-8 text-white shadow-[0_30px_70px_-35px_rgba(15,23,42,0.35)]">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
              {pageContent.extracurricular.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              {pageContent.extracurricular.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">{pageContent.extracurricular.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {pageContent.extracurricular.tags.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white py-16 md:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.05),_transparent_24%)]" />
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
              {pageContent.listing.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
              {pageContent.listing.title}
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">{pageContent.listing.subtitle}</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
              {[1, 2].map((index) => (
                <div key={index} className="h-[320px] animate-pulse rounded-[2.5rem] bg-slate-50" />
              ))}
            </div>
          ) : programs.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {programs.map((program) => {
                const imageUrl = resolveDisplayImageUrl(program.image_url);
                const description =
                  program.excerpt ||
                  program.content ||
                  'Program unggulan yang membantu santri tumbuh dalam ilmu, adab, dan kedisiplinan.';

                return (
                  <div
                    key={program.id}
                    className="group overflow-hidden rounded-[2.2rem] border border-slate-100 bg-white shadow-[0_20px_50px_-35px_rgba(15,23,42,0.22)] transition-all hover:-translate-y-1 hover:border-emerald-200"
                  >
                    <div className="relative h-56 overflow-hidden bg-slate-50">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={program.title}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-emerald-300">
                          <BookOpen size={48} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/78 via-slate-950/8 to-transparent" />
                      <div className="absolute left-5 top-5 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white backdrop-blur-sm">
                        {pageContent.listing.card_badge}
                      </div>
                    </div>
                    <div className="p-7">
                      <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{program.title}</h3>
                      <p className="mt-4 line-clamp-3 text-base leading-7 text-slate-600">{description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50 py-20 text-center">
              <BookOpen className="mx-auto mb-5 text-slate-300" size={42} />
              <p className="text-sm font-bold text-slate-500">{pageContent.listing.empty_state}</p>
            </div>
          )}
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-50 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.08),_transparent_28%)]" />
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/92 p-8 shadow-[0_28px_65px_-38px_rgba(15,23,42,0.18)] backdrop-blur-sm md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
              {pageContent.cta.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
              {pageContent.cta.title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600">
              {pageContent.cta.subtitle}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={pageContent.cta.primary_button.url}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
              >
                {pageContent.cta.primary_button.label} <ArrowRight size={16} />
              </Link>
              <Link
                href={pageContent.cta.secondary_button.url}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
              >
                {pageContent.cta.secondary_button.label} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function ProgramPage() {
  return (
    <PublicLayout>
      <ProgramPageContent />
    </PublicLayout>
  );
}
