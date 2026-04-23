'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

type PublicEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  iconClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export function PublicEmptyState({
  icon: Icon,
  title,
  description,
  className = '',
  iconClassName = 'text-slate-300',
  titleClassName = 'text-slate-900',
  descriptionClassName = 'text-slate-400',
}: PublicEmptyStateProps) {
  return (
    <div className={`rounded-[2.5rem] border border-dashed border-slate-200 bg-white px-6 py-20 text-center shadow-sm ${className}`}>
      <Icon size={44} className={`mx-auto mb-5 ${iconClassName}`} />
      <h3 className={`text-xl font-black uppercase tracking-tight ${titleClassName}`}>{title}</h3>
      {description ? (
        <p className={`mx-auto mt-3 max-w-xl text-sm font-medium leading-relaxed ${descriptionClassName}`}>{description}</p>
      ) : null}
    </div>
  );
}

type PublicGridSkeletonProps = {
  count?: number;
  className?: string;
  itemClassName?: string;
};

export function PublicGridSkeleton({ count = 3, className = '', itemClassName = 'h-[280px] rounded-[2rem]' }: PublicGridSkeletonProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`animate-pulse bg-slate-200/70 ${itemClassName}`} />
      ))}
    </div>
  );
}
