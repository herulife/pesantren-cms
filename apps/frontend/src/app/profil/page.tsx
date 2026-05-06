'use client';

import React from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { useWebsiteBuilderPageContent } from '@/components/PublicSiteContext';
import { defaultWebsiteBuilderPages } from '@/lib/website-builder';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Landmark,
  MapPin,
  PhoneCall,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const institutionFactIcons = [
  <Building2 key="building" size={18} />,
  <ShieldCheck key="shield" size={18} />,
  <Landmark key="landmark" size={18} />,
  <CheckCircle2 key="check" size={18} />,
];

function ProfilPageContent() {
  const pageContent = useWebsiteBuilderPageContent('profil', defaultWebsiteBuilderPages.profil);
  const phoneHref = `tel:${pageContent.about.phone_chip.replace(/\D/g, '')}`;

  return (
    <>
      <section className="relative overflow-hidden border-b border-emerald-900/80 bg-slate-950 py-24 text-white lg:py-28">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url('${pageContent.hero.background_image_url}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-emerald-950/75" />
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div>
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
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {pageContent.hero.highlights.map((item) => (
                <div
                  key={`${item.label}-${item.value}`}
                  className="rounded-[1.6rem] border border-white/10 bg-white/8 px-5 py-5 shadow-[0_20px_45px_-30px_rgba(0,0,0,0.45)] backdrop-blur-sm"
                >
                  <p className="text-3xl font-black text-white">{item.value}</p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/82">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fbfcfa_0%,#f6f7f4_100%)] py-16 md:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.08),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(15,118,110,0.06),_transparent_24%)]" />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
              {pageContent.about.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
              {pageContent.about.title}
            </h2>
            {pageContent.about.paragraphs.map((paragraph, index) => (
              <p
                key={`${index}-${paragraph.slice(0, 16)}`}
                className={`text-base leading-8 text-slate-600 md:text-lg ${index === 0 ? 'mt-6' : 'mt-4'}`}
              >
                {paragraph}
              </p>
            ))}
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white">
                <MapPin size={16} className="text-emerald-300" />
                {pageContent.about.location_chip}
              </span>
              <a
                href={phoneHref}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
              >
                <PhoneCall size={16} className="text-emerald-500" />
                {pageContent.about.phone_chip}
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-emerald-100 bg-white/90 p-8 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.18)] backdrop-blur-sm">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">Identitas Lembaga</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {pageContent.about.institution_facts.map((fact, index) => (
                <div key={`${fact.label}-${fact.value}`} className="rounded-[1.5rem] border border-white bg-white p-5">
                  <div className="mb-3 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                    {institutionFactIcons[index % institutionFactIcons.length]}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                    {fact.label}
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-800">{fact.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[1.5rem] bg-slate-900 p-5 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">
                {pageContent.about.address_title}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-200">{pageContent.about.address_text}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#0f172a_0%,#10251d_100%)] py-16 text-white md:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
              {pageContent.vision.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
              {pageContent.vision.title}
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-100">{pageContent.vision.description}</p>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
              {pageContent.mission.eyebrow}
            </p>
            <div className="mt-6 grid gap-4">
              {pageContent.mission.items.map((mission) => (
                <div key={mission} className="flex gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-300">
                    <CheckCircle2 size={18} />
                  </div>
                  <p className="text-sm leading-7 text-slate-200">{mission}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white py-16 md:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.05),_transparent_24%)]" />
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-8 shadow-[0_28px_65px_-38px_rgba(15,23,42,0.18)] backdrop-blur-sm md:p-10">
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

export default function ProfilPage() {
  return (
    <PublicLayout>
      <ProfilPageContent />
    </PublicLayout>
  );
}
