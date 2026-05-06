import React from 'react';
import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { HomeSection } from '@/lib/website-builder';
import { getString } from './helpers';

export default function CtaBlock({ section }: { section: HomeSection }) {
  const eyebrow = getString(section, 'eyebrow', 'Mulai Dari Sini');
  const title = getString(section, 'title', 'Siap mengenal Darussunnah lebih jauh?');
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

  return (
    <section className="bg-white px-4 py-16 md:py-24">
      <div
        className={`container mx-auto max-w-6xl overflow-hidden rounded-[2.4rem] p-8 md:p-12 ${
          isMinimal
            ? 'border border-slate-200 bg-slate-50 text-slate-900 shadow-[0_20px_55px_-35px_rgba(15,23,42,0.16)]'
            : isPanel
              ? 'border border-emerald-100 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_100%)] text-slate-900 shadow-[0_24px_70px_-40px_rgba(16,185,129,0.18)]'
              : 'bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.28),transparent_26%),linear-gradient(135deg,#065f46_0%,#047857_48%,#0f766e_100%)] text-white shadow-[0_30px_80px_-45px_rgba(6,95,70,0.55)]'
        }`}
      >
        <div className="max-w-3xl">
          <p className={`text-[10px] font-black uppercase tracking-[0.28em] ${isMinimal ? 'text-emerald-600' : isPanel ? 'text-emerald-700' : 'text-emerald-200'}`}>{eyebrow}</p>
          <h2 className="mt-4 text-[2.4rem] font-black leading-[1.02] tracking-[-0.03em] md:text-[3.2rem]">{title}</h2>
          <p className={`mt-5 max-w-2xl text-base leading-8 md:text-lg ${isMinimal ? 'text-slate-600' : isPanel ? 'text-slate-700' : 'text-emerald-50/88'}`}>{subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={buttonUrl} className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black transition-all hover:-translate-y-0.5 ${isMinimal ? 'bg-emerald-600 text-white' : isPanel ? 'bg-slate-950 text-white' : 'bg-white text-emerald-900'}`}>
              {buttonLabel} <ArrowRight size={16} />
            </Link>
            <Link href={secondaryUrl} className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black transition-all hover:-translate-y-0.5 ${isMinimal ? 'border border-slate-200 bg-white text-slate-800' : isPanel ? 'border border-emerald-200 bg-white text-emerald-800' : 'border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/16'}`}>
              <MessageCircle size={16} /> {secondaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
