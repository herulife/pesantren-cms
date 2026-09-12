'use client';

import React, { createContext, useContext } from 'react';
import { SettingsMap } from '@/lib/api';

type PublicSiteContextValue = {
  settings: SettingsMap;
  effectivePathname: string;
  isSettingsLoaded?: boolean;
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

// Builder sudah dihapus: selalu kembalikan fallback (konten default statis).
export function useWebsiteBuilderPageContent<T>(pageKey: string, fallback: T): T {
  void pageKey;
  return fallback;
}
