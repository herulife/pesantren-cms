'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type PublicSectionIntroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  actionHref?: string;
  actionLabel?: string;
  theme?: 'light' | 'dark';
};

export default function PublicSectionIntro({
  eyebrow,
  title,
  description,
  align = 'left',
  actionHref,
  actionLabel,
  theme = 'light',
}: PublicSectionIntroProps) {
  const isCenter = align === 'center';
  const isDark = theme === 'dark';

  return (
    <div className={`flex flex-col gap-6 ${isCenter ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between md:gap-8 lg:gap-10'}`}>
      <div className={isCenter ? 'max-w-3xl' : 'max-w-3xl'}>
        {eyebrow ? (
          <p className={`mb-3 text-[10px] font-black uppercase tracking-[0.32em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={`text-[2rem] font-black leading-[0.98] tracking-[-0.03em] md:text-[2.8rem] lg:text-[3.35rem] ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={`mt-4 max-w-2xl text-sm font-medium leading-relaxed md:text-base ${
              isDark ? 'text-slate-300/95' : 'text-slate-500'
            }`}
          >
            {description}
          </p>
        ) : null}
      </div>

      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className={`inline-flex self-start items-center gap-2 rounded-full px-6 py-3 text-sm font-black tracking-[0.06em] transition-all md:shrink-0 md:self-end ${
            isDark
              ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20'
              : 'border border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:text-emerald-700'
          }`}
        >
          {actionLabel}
          <ArrowRight size={16} />
        </Link>
      ) : null}
    </div>
  );
}
