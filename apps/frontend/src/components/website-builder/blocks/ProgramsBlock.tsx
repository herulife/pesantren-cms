import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, HeartHandshake } from 'lucide-react';
import { HomeSection } from '@/lib/website-builder';
import { Program, resolveDisplayImageUrl } from '@/lib/api';
import { getArray, getNumber, getString } from './helpers';
import PublicSectionIntro from '@/components/PublicSectionIntro';

const programCards = [
  { title: 'Tahfidz Al-Quran', subtitle: 'Target hafalan bertahap dan setoran harian.', image: '/assets/img/tahfidz.jpg' },
  { title: 'Kajian Kitab', subtitle: 'Pembiasaan faham diniyah dan adab belajar.', image: '/assets/img/belajar-kitab.jpg' },
  { title: 'Tasmi & Murajaah', subtitle: 'Penguatan bacaan, kelancaran, dan ketelitian.', image: '/assets/img/tasmi.jpg' },
  { title: 'Halaqah Pembinaan', subtitle: 'Ruang pembentukan karakter dan kedisiplinan.', image: '/assets/img/khalaqoh.jpg' },
];

const extracurricularCards = [
  { title: 'Panahan & Olahraga', subtitle: 'Melatih fokus, fisik, dan sportivitas.', image: '/assets/img/manasik.jpg' },
  { title: 'Tata Boga', subtitle: 'Keterampilan hidup yang aplikatif dan bermanfaat.', image: '/assets/img/masak.jpg' },
  { title: 'Teknik Otomotif', subtitle: 'Praktik kerja tangan dan pemahaman teknis dasar.', image: '/assets/img/bengkel.jpg' },
  { title: 'Asrama & Kebersamaan', subtitle: 'Belajar mandiri, tertib, dan saling menjaga.', image: '/assets/img/asrama.jpg' },
];

type ProgramsBlockProps = {
  section: HomeSection;
  mode: 'programs' | 'extracurriculars';
  programs: Program[];
};

export default function ProgramsBlock({ section, mode, programs }: ProgramsBlockProps) {
  const isProgram = mode === 'programs';
  const cards = isProgram ? programCards : extracurricularCards;
  const source = getString(section, 'source', 'latest');
  const manualIds = getArray<string>(section, 'manual_ids').map((item) => String(item));
  const category = isProgram ? 'program' : 'ekskul';
  const availablePrograms = programs
    .filter((item) => item.category === category)
    .sort((a, b) => {
      const orderDiff = (a.order_index ?? 0) - (b.order_index ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return a.title.localeCompare(b.title);
    });
  const sourcePrograms =
    source === 'manual' && manualIds.length > 0
      ? manualIds
          .map((id) => availablePrograms.find((item) => String(item.id) === id))
          .filter((item): item is Program => Boolean(item))
      : availablePrograms;
  const dynamicCards = sourcePrograms.map((item) => ({
    id: String(item.id),
    title: item.title,
    subtitle:
      item.excerpt ||
      item.content ||
      (isProgram
        ? 'Program pembinaan utama untuk membentuk hafalan, adab, dan kesiapan santri.'
        : 'Kegiatan penunjang untuk melatih keterampilan, fokus, dan kemandirian santri.'),
    image: item.image_url || (isProgram ? '/assets/img/tahfidz.jpg' : '/assets/img/manasik.jpg'),
  }));
  const cardPool = dynamicCards.length > 0 ? dynamicCards : cards.map((card) => ({ id: card.title, ...card }));
  const limit = Math.max(1, Math.min(cardPool.length, getNumber(section, 'limit', 4)));
  const visibleCards = cardPool.slice(0, limit);
  const eyebrow = getString(section, 'eyebrow', isProgram ? 'Program Inti' : 'Kegiatan Penunjang');
  const title = getString(section, 'title', isProgram ? 'Program Inti' : 'Ekstrakurikuler');
  const subtitle = getString(
    section,
    'subtitle',
    isProgram
      ? 'Pembinaan utama Darussunnah menguatkan hafalan, adab, wawasan Islam, dan kesiapan hidup santri secara seimbang.'
      : 'Aktivitas penunjang yang membuat santri aktif, terampil, dan percaya diri.'
  );
  const buttonLabel = getString(section, 'button_label', isProgram ? 'Buka halaman program' : 'Lihat kegiatan santri');
  const buttonUrl = getString(section, 'button_url', isProgram ? '/program' : '/program');
  const Icon = isProgram ? BookOpen : HeartHandshake;

  return (
    <section className={`relative overflow-hidden ${isProgram ? 'bg-white' : 'bg-slate-950'} py-16 md:py-24`}>
      <div className="container mx-auto max-w-6xl px-4">
        <PublicSectionIntro
          eyebrow={eyebrow}
          title={title}
          description={subtitle}
          theme={isProgram ? 'light' : 'dark'}
          actionHref={buttonUrl}
          actionLabel={buttonLabel}
        />
        <div className={`mt-8 grid gap-4 sm:grid-cols-2 ${section.variant === 'compact-grid' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
          {visibleCards.map((card) => (
            <article
              key={card.id}
              className={`group overflow-hidden rounded-[1.8rem] border shadow-[0_26px_64px_-42px_rgba(15,23,42,0.3)] ${
                isProgram ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/8'
              }`}
            >
              <div className="relative h-56 overflow-hidden bg-slate-100">
                <Image
                  src={resolveDisplayImageUrl(card.image)}
                  alt={card.title}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/82 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="mb-3 inline-flex rounded-full bg-emerald-500/90 p-2 text-white">
                    <Icon size={16} />
                  </div>
                  <h3 className="text-xl font-black leading-tight">{card.title}</h3>
                </div>
              </div>
              <div className="p-5">
                <p className={`text-sm leading-7 ${isProgram ? 'text-slate-600' : 'text-slate-300'}`}>{card.subtitle}</p>
              </div>
            </article>
          ))}
        </div>
        <Link href={buttonUrl} className={`mt-8 inline-flex items-center gap-3 rounded-full px-6 py-3 text-sm font-black transition-all hover:-translate-y-0.5 ${isProgram ? 'border border-emerald-200 bg-white text-emerald-800' : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-100'}`}>
          {buttonLabel} <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
