'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export const COOKIE_KEY = 'alma-cookie-consent';

export function readConsent(): string | null {
  try {
    const raw = localStorage.getItem(COOKIE_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as { choice?: string }).choice || null;
  } catch {
    return null;
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!readConsent()) {
      const t = window.setTimeout(() => setVisible(true), 1200);
      return () => window.clearTimeout(t);
    }
  }, []);

  const choose = (choice: 'accepted' | 'rejected') => {
    try {
      localStorage.setItem(COOKIE_KEY, JSON.stringify({ choice, ts: new Date().toISOString() }));
    } catch {}
    setVisible(false);
    window.dispatchEvent(new Event('alma-consent-changed'));
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[9999] md:inset-x-auto md:bottom-6 md:right-6 md:max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur">
        <p className="text-sm font-black text-slate-900">Izin cookie & layanan luar</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Website memakai cookie dan layanan luar (peta, video, statistik) agar berjalan baik.
          Boleh kami pakai? Pilihan bisa diubah kapan saja lewat halaman Privasi.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => choose('rejected')}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            Tolak
          </button>
          <button
            type="button"
            onClick={() => choose('accepted')}
            className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-black text-white transition hover:bg-sky-700"
          >
            Setuju
          </button>
        </div>
        <Link href="/privasi" className="mt-3 block text-center text-xs font-bold text-sky-700 hover:underline">
          Baca Kebijakan Privasi
        </Link>
      </div>
    </div>
  );
}
