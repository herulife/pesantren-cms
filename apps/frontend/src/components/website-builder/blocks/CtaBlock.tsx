import React from 'react';
import Link from 'next/link';
import { ArrowRight, HeartHandshake, MessageCircle } from 'lucide-react';
import { HomeSection } from '@/lib/website-builder';
import { getString } from './helpers';

export default function CtaBlock({ section }: { section: HomeSection }) {
  const eyebrow = getString(section, 'eyebrow', 'Mulai Dari Sini');
  const title = getString(section, 'title', 'Siap mengenal Al-Maa lebih jauh?');
  const subtitle = getString(
    section,
    'subtitle',
    'Mulai dari profil pondok, program, dan fasilitas, lalu lanjutkan ke halaman pendaftaran saat Anda sudah siap.'
  );
  const buttonLabel = getString(section, 'button_label', 'Lihat Info PSB');
  const buttonUrl = getString(section, 'button_url', '/psb');
  const secondaryLabel = getString(section, 'secondary_button_label', 'Hubungi Admin');
  const secondaryUrl = getString(section, 'secondary_button_url', '/kontak');
  const isMinimal = section.variant === 'minimal';
  const isPanel = section.variant === 'panel';
  const isDonation = section.variant === 'donation';
  const isBanner = section.variant === 'banner';

  if (isBanner) {
    return (
      <section className="bg-white px-4 pb-2 pt-10">
        <div className="container mx-auto max-w-6xl">
          <Link
            href={buttonUrl}
            className="group flex items-center gap-4 overflow-hidden rounded-[1.4rem] border border-emerald-200/70 bg-[linear-gradient(90deg,#ecfdf5_0%,#ffffff_55%,#fffbeb_100%)] px-4 py-3.5 shadow-[0_16px_40px_-28px_rgba(16,185,129,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-26px_rgba(16,185,129,0.45)] sm:px-5"
          >
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm sm:inline-flex">
              <HeartHandshake size={22} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                {eyebrow}
              </span>
              <span className="mt-1 block text-sm font-black leading-snug text-slate-900 md:text-base">{title}</span>
              <span className="mt-0.5 hidden text-xs leading-5 text-slate-500 md:block">{subtitle}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition-all group-hover:bg-emerald-500 sm:px-5 sm:py-3 sm:text-sm">
              {buttonLabel} <ArrowRight size={15} />
            </span>
          </Link>
        </div>
      </section>
    );
  }

  if (isDonation) {
    return (
      <section className="bg-white px-4 py-16 md:py-24">
        <div className="container relative mx-auto max-w-6xl overflow-hidden rounded-[2.4rem] bg-[linear-gradient(120deg,#0b1f17_0%,#123524_55%,#175c36_100%)] p-8 text-white shadow-[0_30px_80px_-45px_rgba(20,83,45,0.65)] md:p-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-300/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[auto_1fr_auto]">
            <div className="hidden h-20 w-20 items-center justify-center rounded-[1.6rem] border border-amber-200/25 bg-amber-300/10 text-amber-300 sm:inline-flex">
              <HeartHandshake size={36} />
            </div>
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-amber-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-300" />
                {eyebrow}
              </p>
              <h2 className="mt-4 text-[2rem] font-black leading-[1.05] tracking-[-0.03em] md:text-[2.8rem]">{title}</h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-emerald-50/85 md:text-lg">{subtitle}</p>
            </div>
            <div className="flex flex-col gap-3 lg:items-stretch">
              <Link
                href={buttonUrl}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 px-7 py-3.5 text-sm font-black text-emerald-950 shadow-[0_18px_40px_-18px_rgba(252,211,77,0.6)] transition-all hover:-translate-y-0.5 hover:bg-amber-200"
              >
                {buttonLabel} <ArrowRight size={16} />
              </Link>
              <Link
                href={secondaryUrl}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-black text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/10"
              >
                <MessageCircle size={16} /> {secondaryLabel}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white px-4 py-16 md:py-24">
      <div
        className={`container mx-auto max-w-6xl overflow-hidden rounded-[2.4rem] p-8 md:p-12 ${
          isMinimal
            ? 'border border-slate-200 bg-slate-50 text-slate-900 shadow-[0_20px_55px_-35px_rgba(250,204,21,0.16)]'
            : isPanel
              ? 'border border-sky-100 bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_100%)] text-slate-900 shadow-[0_24px_70px_-40px_rgba(14,165,233,0.18)]'
              : 'bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.28),transparent_26%),linear-gradient(135deg,#0ea5e9_0%,#0ea5e9_48%,#38bdf8_100%)] text-white shadow-[0_30px_80px_-45px_rgba(14,165,233,0.55)]'
        }`}
      >
        <div className="max-w-3xl">
          <p className={`text-[10px] font-black uppercase tracking-[0.28em] ${isMinimal ? 'text-sky-600' : isPanel ? 'text-sky-700' : 'text-sky-200'}`}>{eyebrow}</p>
          <h2 className="mt-4 text-[2.4rem] font-black leading-[1.02] tracking-[-0.03em] md:text-[3.2rem]">{title}</h2>
          <p className={`mt-5 max-w-2xl text-base leading-8 md:text-lg ${isMinimal ? 'text-slate-600' : isPanel ? 'text-slate-700' : 'text-sky-50/88'}`}>{subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={buttonUrl} className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black transition-all hover:-translate-y-0.5 ${isMinimal ? 'bg-sky-600 text-white' : isPanel ? 'bg-slate-950 text-white' : 'bg-white text-sky-900'}`}>
              {buttonLabel} <ArrowRight size={16} />
            </Link>
            <Link href={secondaryUrl} className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black transition-all hover:-translate-y-0.5 ${isMinimal ? 'border border-slate-200 bg-white text-slate-800' : isPanel ? 'border border-sky-200 bg-white text-sky-800' : 'border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/16'}`}>
              <MessageCircle size={16} /> {secondaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
