'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { useWebsiteBuilderPageContent } from '@/components/PublicSiteContext';
import { defaultWebsiteBuilderPages } from '@/lib/website-builder';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MapPin,
  Sparkles,
} from 'lucide-react';

function PsbPageContent() {
  const pageContent = useWebsiteBuilderPageContent('psb', defaultWebsiteBuilderPages.psb);

  return (
    <>
      <section className="relative overflow-hidden border-b border-emerald-900/80 bg-slate-950 py-24 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url('${pageContent.hero.background_image_url}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/88 to-emerald-950/78" />
        <div className="relative mx-auto max-w-6xl px-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-emerald-100">
            <Sparkles size={14} />
            {pageContent.hero.eyebrow}
          </p>
          <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
            {pageContent.hero.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-emerald-50/90">
            {pageContent.hero.subtitle}
          </p>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#fbfcfa_0%,#f4f7f3_100%)] py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
            <div className="relative overflow-hidden rounded-[2.3rem] border border-white/70 bg-white/92 p-8 shadow-[0_22px_50px_-35px_rgba(15,23,42,0.18)] backdrop-blur-sm">
              <div className="absolute -right-8 -top-8 rounded-full bg-emerald-50 p-6 opacity-80">
                <FileText size={84} className="text-emerald-200" />
              </div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
                {pageContent.requirements.eyebrow}
              </p>
              <h2 className="mb-8 flex items-center gap-4 text-3xl font-black tracking-tight text-slate-900">
                <ClipboardCheck className="text-emerald-600" /> {pageContent.requirements.title}
              </h2>
              <ul className="relative z-10 space-y-4">
                {pageContent.requirements.items.map((req, index) => (
                  <li
                    key={`${index}-${req}`}
                    className="flex items-center gap-4 rounded-[1.35rem] border border-slate-100 bg-[#fbfcfb] p-4 shadow-sm"
                  >
                    <div className="rounded-full bg-emerald-50 p-2 text-emerald-600">
                      <CheckCircle2 size={16} />
                    </div>
                    <p className="font-medium text-slate-700">{req}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-8">
              <div className="rounded-[2.3rem] border border-emerald-100 bg-emerald-50 p-8">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
                  {pageContent.schedule.eyebrow}
                </p>
                <h2 className="mb-6 flex items-center gap-4 text-2xl font-black text-emerald-950">
                  <Calendar className="text-emerald-600" /> {pageContent.schedule.title}
                </h2>
                <div className="space-y-4">
                  {pageContent.schedule.waves.map((wave) => (
                    <div
                      key={`${wave.label}-${wave.date_text}`}
                      className={`rounded-[1.4rem] p-5 ${
                        wave.active
                          ? 'border border-emerald-100 bg-white shadow-sm'
                          : 'border border-dashed border-emerald-200 bg-white/50'
                      }`}
                    >
                      <p
                        className={`mb-1 text-xs font-black uppercase tracking-widest ${
                          wave.active ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        {wave.label}
                      </p>
                      <p className={`text-lg font-bold ${wave.active ? 'text-slate-800' : 'text-slate-400'}`}>
                        {wave.date_text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2.3rem] border border-slate-200 bg-white p-8 shadow-sm">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
                  {pageContent.location.eyebrow}
                </p>
                <h2 className="mb-6 flex items-center gap-4 text-2xl font-black text-slate-900">
                  <MapPin className="text-emerald-600" /> {pageContent.location.title}
                </h2>
                <p className="mb-4 font-medium text-slate-700">{pageContent.location.address_text}</p>
                <div className="relative h-52 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 shadow-sm">
                  <Image
                    src={pageContent.location.image_url}
                    alt={pageContent.location.title}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
                      Lokasi Pondok
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-200">{pageContent.location.subtitle}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-emerald-800 bg-gradient-to-br from-emerald-900 to-teal-900 py-24">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
            {pageContent.cta.eyebrow}
          </p>
          <h2 className="mb-5 mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">
            {pageContent.cta.title}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-base leading-8 text-emerald-50/88">
            {pageContent.cta.subtitle}
          </p>
          <div className="flex flex-col justify-center gap-6 sm:flex-row">
            <Link
              href={pageContent.cta.primary_button.url}
              className="flex items-center gap-2 rounded-full bg-white px-10 py-5 text-lg font-black text-emerald-900 shadow-xl shadow-white/10 transition-all hover:-translate-y-1 hover:bg-emerald-50"
            >
              {pageContent.cta.primary_button.label} <ArrowRight />
            </Link>
            <a
              href={pageContent.cta.secondary_button.url}
              className="rounded-full border border-white/20 bg-white/10 px-10 py-5 text-lg font-black text-white backdrop-blur-md transition-all hover:bg-white/20"
            >
              {pageContent.cta.secondary_button.label}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

export default function PSBPage() {
  return (
    <PublicLayout>
      <PsbPageContent />
    </PublicLayout>
  );
}
