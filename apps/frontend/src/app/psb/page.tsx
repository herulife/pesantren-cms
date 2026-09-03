'use client';

import React, { useState } from 'react';
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

export function PsbPageContent() {
  const pageContent = useWebsiteBuilderPageContent('psb', defaultWebsiteBuilderPages.psb);
  const [mapInteractive, setMapInteractive] = useState(false);

  return (
    <>
      <section className="relative overflow-hidden border-b border-sky-900/80 bg-slate-950 py-24 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url('${pageContent.hero.background_image_url}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/88 to-sky-950/78" />
        <div className="relative mx-auto max-w-6xl px-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-sky-100">
            <Sparkles size={14} />
            {pageContent.hero.eyebrow}
          </p>
          <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
            {pageContent.hero.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-sky-50/90">
            {pageContent.hero.subtitle}
          </p>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#fbfcfa_0%,#f4f7f3_100%)] py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
            <div className="relative overflow-hidden rounded-[2.3rem] border border-white/70 bg-white/92 p-8 shadow-[0_22px_50px_-35px_rgba(250,204,21,0.18)] backdrop-blur-sm">
              <div className="absolute -right-8 -top-8 rounded-full bg-sky-50 p-6 opacity-80">
                <FileText size={84} className="text-sky-200" />
              </div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-sky-600">
                {pageContent.requirements.eyebrow}
              </p>
              <h2 className="mb-8 flex items-center gap-4 text-3xl font-black tracking-tight text-slate-900">
                <ClipboardCheck className="text-sky-600" /> {pageContent.requirements.title}
              </h2>
              <ul className="relative z-10 space-y-4">
                {pageContent.requirements.items.map((req, index) => (
                  <li
                    key={`${index}-${req}`}
                    className="flex items-center gap-4 rounded-[1.35rem] border border-slate-100 bg-[#fbfcfb] p-4 shadow-sm"
                  >
                    <div className="rounded-full bg-sky-50 p-2 text-sky-600">
                      <CheckCircle2 size={16} />
                    </div>
                    <p className="font-medium text-slate-700">{req}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-8">
              <div className="rounded-[2.3rem] border border-sky-100 bg-sky-50 p-8">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-sky-600">
                  {pageContent.schedule.eyebrow}
                </p>
                <h2 className="mb-6 flex items-center gap-4 text-2xl font-black text-sky-950">
                  <Calendar className="text-sky-600" /> {pageContent.schedule.title}
                </h2>
                <div className="space-y-4">
                  {pageContent.schedule.waves.map((wave) => (
                    <div
                      key={`${wave.label}-${wave.date_text}`}
                      className={`rounded-[1.4rem] p-5 ${
                        wave.active
                          ? 'border border-sky-100 bg-white shadow-sm'
                          : 'border border-dashed border-sky-200 bg-white/50'
                      }`}
                    >
                      <p
                        className={`mb-1 text-xs font-black uppercase tracking-widest ${
                          wave.active ? 'text-sky-600' : 'text-slate-400'
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
                <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-sky-600">
                  {pageContent.location.eyebrow}
                </p>
                <h2 className="mb-6 flex items-center gap-4 text-2xl font-black text-slate-900">
                  <MapPin className="text-sky-600" /> {pageContent.location.title}
                </h2>
                <p className="mb-4 font-medium text-slate-700">{pageContent.location.address_text}</p>
                <div className="relative h-56 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 shadow-sm">
                  <iframe
                    src="https://www.google.com/maps?q=Pondok+Pesantren+Tahfidzul+Qur%27an+Al-Maa+Parung&t=&z=17&ie=UTF8&iwloc=&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0, pointerEvents: mapInteractive ? 'auto' : 'none' }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Peta ${pageContent.location.title}`}
                  />
                  {!mapInteractive ? (
                    <button
                      type="button"
                      onClick={() => setMapInteractive(true)}
                      className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-slate-50/40 backdrop-blur-[1px]"
                      aria-label="Aktifkan peta"
                    >
                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wide text-slate-700 shadow-lg ring-1 ring-slate-200 transition hover:bg-sky-600 hover:text-white">
                        <MapPin size={15} /> Ketuk untuk melihat peta
                      </span>
                    </button>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">{pageContent.location.subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-sky-800 bg-gradient-to-br from-sky-900 to-sky-900 py-24">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-200">
            {pageContent.cta.eyebrow}
          </p>
          <h2 className="mb-5 mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">
            {pageContent.cta.title}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-base leading-8 text-sky-50/88">
            {pageContent.cta.subtitle}
          </p>
          <div className="flex flex-col justify-center gap-6 sm:flex-row">
            <Link
              href={
                pageContent.cta.primary_button.url &&
                !pageContent.cta.primary_button.url.includes('wa.me') &&
                pageContent.cta.primary_button.url !== ''
                  ? pageContent.cta.primary_button.url
                  : '/portal/biodata'
              }
              className="flex items-center gap-2 rounded-full bg-white px-10 py-5 text-lg font-black text-sky-900 shadow-xl shadow-white/10 transition-all hover:-translate-y-1 hover:bg-sky-50"
            >
              {pageContent.cta.primary_button.label &&
              !pageContent.cta.primary_button.label.toLowerCase().includes('panitia')
                ? pageContent.cta.primary_button.label
                : 'Daftar Online Sekarang'}{' '}
              <ArrowRight />
            </Link>
            <a
              href={pageContent.cta.secondary_button.url || 'https://wa.me/6287784423282'}
              target={pageContent.cta.secondary_button.url?.includes('wa.me') ? '_blank' : undefined}
              rel={pageContent.cta.secondary_button.url?.includes('wa.me') ? 'noopener noreferrer' : undefined}
              className="rounded-full border border-white/20 bg-white/10 px-10 py-5 text-lg font-black text-white backdrop-blur-md transition-all hover:bg-white/20"
            >
              {pageContent.cta.secondary_button.label || 'Hubungi Panitia'}
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
