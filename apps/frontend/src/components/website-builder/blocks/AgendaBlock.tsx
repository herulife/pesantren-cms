import React from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { Agenda } from '@/lib/api';
import { HomeSection } from '@/lib/website-builder';
import PublicSectionIntro from '@/components/PublicSectionIntro';
import { PublicEmptyState, PublicGridSkeleton } from '@/components/PublicState';
import { getArray, getBoolean, getNumber, getString } from './helpers';

const formatDay = (dateStr: string) => new Date(dateStr).getDate();
const formatMonth = (dateStr: string) => new Date(dateStr).toLocaleDateString('id-ID', { month: 'short' });

export default function AgendaBlock({ section, agendas, isLoading }: { section: HomeSection; agendas: Agenda[]; isLoading: boolean }) {
  const eyebrow = getString(section, 'eyebrow', 'Agenda');
  const title = getString(section, 'title', 'Agenda Terdekat');
  const subtitle = getString(section, 'subtitle', 'Jadwal kegiatan dan agenda penting pondok.');
  const buttonLabel = getString(section, 'button_label', 'Lihat semua agenda');
  const buttonUrl = getString(section, 'button_url', '/agendas');
  const showDate = getBoolean(section, 'show_date', true);
  const showLocation = getBoolean(section, 'show_location', true);
  const limit = Math.max(1, getNumber(section, 'limit', 3));
  const source = getString(section, 'source', 'latest');
  const manualIds = getArray<string>(section, 'manual_ids').map((item) => String(item));
  const sourceItems =
    source === 'manual' && manualIds.length > 0
      ? manualIds
          .map((id) => agendas.find((item) => String(item.id) === id))
          .filter((item): item is Agenda => Boolean(item))
      : agendas;
  const items = sourceItems.slice(0, limit);

  return (
    <section className="bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] py-16 md:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <PublicSectionIntro eyebrow={eyebrow} title={title} description={subtitle} actionHref={buttonUrl} actionLabel={buttonLabel} />
        {isLoading ? (
          <PublicGridSkeleton count={limit} className="mt-8 grid gap-4 md:grid-cols-3" itemClassName="h-52 rounded-[1.8rem]" />
        ) : items.length > 0 ? (
          <div className={`mt-8 grid gap-4 ${section.variant === 'list' ? 'grid-cols-1' : section.variant === 'compact-grid' ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'}`}>
            {items.map((agenda) => (
              <article key={agenda.id} className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_22px_48px_-36px_rgba(15,23,42,0.2)]">
                <div className="flex items-start gap-4">
                  {showDate ? (
                    <div className="rounded-2xl bg-emerald-600 px-4 py-3 text-center text-white">
                      <div className="text-2xl font-black leading-none">{formatDay(agenda.start_date)}</div>
                      <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em]">{formatMonth(agenda.start_date)}</div>
                    </div>
                  ) : null}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">{agenda.category || 'Agenda Pondok'}</p>
                    <h3 className="mt-2 text-lg font-black leading-tight text-slate-900">{agenda.title}</h3>
                  </div>
                </div>
                <div className="mt-5 space-y-2 text-sm text-slate-500">
                  {agenda.time_info ? (
                    <div className="flex items-start gap-2">
                      <Calendar size={15} className="mt-0.5 text-emerald-500" />
                      <span>{agenda.time_info}</span>
                    </div>
                  ) : null}
                  {showLocation ? (
                    <div className="flex items-start gap-2">
                      <MapPin size={15} className="mt-0.5 text-emerald-500" />
                      <span>{agenda.location || 'Kompleks Darussunnah Parung'}</span>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <PublicEmptyState icon={Calendar} title="Belum Ada Agenda" description="Agenda yang aktif akan muncul di sini." />
          </div>
        )}
      </div>
    </section>
  );
}
