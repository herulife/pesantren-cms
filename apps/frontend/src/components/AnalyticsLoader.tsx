'use client';

import React, { useEffect } from 'react';
import { getPublicSettingsMap } from '@/lib/api';
import { readConsent } from './CookieBanner';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function loadGA(measurementId: string) {
  if (document.querySelector('script[data-alma-ga]')) return;
  const s = document.createElement('script');
  s.async = true;
  s.setAttribute('data-alma-ga', '1');
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  const gtag = (...args: unknown[]) => {
    window.dataLayer!.push(args);
  };
  gtag('js', new Date());
  gtag('config', measurementId);
}

export default function AnalyticsLoader() {
  useEffect(() => {
    let cancelled = false;

    const maybeLoad = async () => {
      if (readConsent() !== 'accepted') return;
      try {
        const settings = await getPublicSettingsMap();
        const id = (settings?.seo_google_analytics || '').trim();
        if (!cancelled && id) loadGA(id);
      } catch {}
    };

    void maybeLoad();
    const onChange = () => void maybeLoad();
    window.addEventListener('alma-consent-changed', onChange);
    return () => {
      cancelled = true;
      window.removeEventListener('alma-consent-changed', onChange);
    };
  }, []);

  return null;
}
