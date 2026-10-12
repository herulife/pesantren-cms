'use client';

import React, { createContext, useContext } from 'react';
import { SettingsMap } from '@/lib/api';
import { BuilderPageKey, WebsiteBuilderState } from '@/lib/website-builder';

export type BuilderRenderMode = 'live' | 'published' | 'draft';

type PublicSiteContextValue = {
  settings: SettingsMap;
  effectivePathname: string;
  isSettingsLoaded?: boolean;
  builderState?: WebsiteBuilderState;
  isBuilderPreview?: boolean;
  renderMode?: BuilderRenderMode;
  useBuilderContent?: boolean;
};

const PublicSiteContext = createContext<PublicSiteContextValue | null>(null);

export function PublicSiteProvider({
  value,
  children,
}: {
  value: PublicSiteContextValue;
  children: React.ReactNode;
}) {
  return <PublicSiteContext.Provider value={value}>{children}</PublicSiteContext.Provider>;
}

export function usePublicSiteContext() {
  return useContext(PublicSiteContext);
}

export function useWebsiteBuilderPageContent<T>(pageKey: BuilderPageKey, fallback: T): T {
  const context = usePublicSiteContext();

  if (!context || !context.useBuilderContent || !context.builderState) {
    return fallback;
  }

  const pages =
    context.renderMode === 'draft'
      ? context.builderState.pagesDraft
      : context.builderState.pagesPublished;
  const content = (pages as Record<string, unknown>)[pageKey];

  return (content as T) ?? fallback;
}
