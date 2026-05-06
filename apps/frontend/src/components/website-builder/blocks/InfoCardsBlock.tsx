import React from 'react';
import { Building2, Landmark, ShieldCheck, Sparkles } from 'lucide-react';
import { HomeSection } from '@/lib/website-builder';
import { getArray, getNumber } from './helpers';

type InfoItem = {
  label: string;
  value: string;
  description?: string;
};

const fallbackItems: Array<{ label: string; value: string; description?: string; icon: React.ReactNode }> = [
  { label: 'Berdiri', value: 'Sejak 2009', icon: <Sparkles size={18} /> },
  { label: 'Yayasan', value: 'Tunas Muda Qurani', icon: <Building2 size={18} /> },
  { label: 'NSPP', value: '510032011292', icon: <ShieldCheck size={18} /> },
  { label: 'Legalitas', value: 'AHU-038333.50.80.2014', icon: <Landmark size={18} /> },
];

export default function InfoCardsBlock({ section }: { section: HomeSection }) {
  const manualItems = getArray<InfoItem>(section, 'items')
    .map((item) => ({
      label: typeof item.label === 'string' ? item.label : '',
      value: typeof item.value === 'string' ? item.value : '',
      description: typeof item.description === 'string' ? item.description : '',
    }))
    .filter((item) => item.label && item.value);
  const items: Array<{ label: string; value: string; description?: string; icon: React.ReactNode }> =
    manualItems.length > 0 ? manualItems.map((item) => ({ ...item, icon: <Sparkles size={18} /> })) : fallbackItems;
  const columns = getNumber(section, 'columns', 4);

  return (
    <section className="relative z-20 -mt-16 px-4 lg:-mt-16">
      <div className="container mx-auto max-w-6xl">
        <div className={`grid gap-4 rounded-[2.1rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.92)_100%)] p-5 shadow-[0_30px_70px_-35px_rgba(15,23,42,0.32)] backdrop-blur-xl md:p-6 ${columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
          {items.map((fact) => (
            <div key={`${fact.label}-${fact.value}`} className="rounded-[1.5rem] border border-slate-100/90 bg-white/95 px-5 py-4 shadow-[0_16px_36px_-30px_rgba(15,23,42,0.18)]">
              <div className="mb-3 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600 ring-1 ring-emerald-100">
                {fact.icon}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{fact.label}</p>
              <p className="mt-2 text-sm font-bold text-slate-800">{fact.value}</p>
              {fact.description ? <p className="mt-2 text-xs leading-5 text-slate-500">{fact.description}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
