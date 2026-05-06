'use client';

import React, { createContext, useContext } from 'react';
import { SettingsMap } from '@/lib/api';
import {
  BuilderPageKey,
  WebsiteBuilderPages,
  WebsiteBuilderState,
} from '@/lib/website-builder';

export type BuilderRenderMode = 'live' | 'published' | 'draft';

type PublicSiteContextValue = {
  settings: SettingsMap;
  builderState: WebsiteBuilderState;
  effectivePathname: string;
  isBuilderPreview: boolean;
  renderMode: BuilderRenderMode;
  useBuilderContent: boolean;
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

export function useWebsiteBuilderPageContent<TPageKey extends BuilderPageKey>(
  pageKey: TPageKey,
  fallback: WebsiteBuilderPages[TPageKey]
) {
  const context = usePublicSiteContext();

  if (!context || !context.useBuilderContent) {
    return fallback;
  }

  return context.renderMode === 'draft'
    ? context.builderState.pagesDraft[pageKey]
    : context.builderState.pagesPublished[pageKey];
}
