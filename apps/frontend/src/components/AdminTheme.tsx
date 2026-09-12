'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSettings, updateSetting } from '@/lib/api';

export type AdminTheme = 'modern' | 'bootstrap';

const STORAGE_KEY = 'admin-theme';
const BOOTSTRAP_CSS = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css';

type AdminThemeContextValue = {
  theme: AdminTheme;
  setTheme: (t: AdminTheme) => void;
  loaded: boolean;
};

const AdminThemeContext = createContext<AdminThemeContextValue>({
  theme: 'modern',
  setTheme: () => {},
  loaded: false,
});

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>('modern');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const local = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- muat tema tersimpan saat mount
      if (local === 'bootstrap' || local === 'modern') setThemeState(local);
    } catch {
      // abaikan
    }
    getSettings({ silentUnauthorized: true })
      .then((all) => {
        const saved = all.find((s) => s.key === 'admin_theme')?.value;
        if (saved === 'bootstrap' || saved === 'modern') {
          setThemeState(saved);
          try {
            window.localStorage.setItem(STORAGE_KEY, saved);
          } catch {
            // abaikan
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    const id = 'admin-bootstrap-css';
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (theme === 'bootstrap') {
      document.body.classList.add('admin-bs');
      if (!link) {
        link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = BOOTSTRAP_CSS;
        document.head.appendChild(link);
      }
    } else {
      document.body.classList.remove('admin-bs');
      if (link) link.remove();
    }
  }, [theme]);

  const setTheme = useCallback((t: AdminTheme) => {
    setThemeState(t);
    try {
      window.localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // abaikan
    }
    updateSetting('admin_theme', t).catch(() => {});
  }, []);

  return <AdminThemeContext.Provider value={{ theme, setTheme, loaded }}>{children}</AdminThemeContext.Provider>;
}
