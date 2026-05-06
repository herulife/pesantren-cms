import React from 'react';
import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { HomeSection } from '@/lib/website-builder';
import { getString } from './helpers';

export default function CtaBlock({ section }: { section: HomeSection }) {
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

  return (
    <section className="bg-white px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-6xl overflow-hidden rounded-[2.4rem] bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.28),transparent_26%),linear-gradient(135deg,#065f46_0%,#047857_48%,#0f766e_100%)] p-8 text-white shadow-[0_30px_80px_-45px_rgba(6,95,70,0.55)] md:p-12">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200">Mulai Dari Sini</p>
          <h2 className="mt-4 text-[2.4rem] font-black leading-[1.02] tracking-[-0.03em] md:text-[3.2rem]">{title}</h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-50/88 md:text-lg">{subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={buttonUrl} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-emerald-900 transition-all hover:-translate-y-0.5">
              {buttonLabel} <ArrowRight size={16} />
            </Link>
            <Link href={secondaryUrl} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-black text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/16">
              <MessageCircle size={16} /> {secondaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
