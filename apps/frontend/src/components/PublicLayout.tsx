'use client';

import React from 'react';
import Link from 'next/link';
import { CircleUserRound, LogOut } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const isPortalUser = user?.role === 'user';
  const dashboardHref = isPortalUser ? '/portal' : '/admin';
  const dashboardLabel = isPortalUser ? 'Portal Wali Santri' : 'Panel Admin';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex min-w-0 flex-col">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600">
              Darussunnah Parung
            </span>
            <span className="truncate text-lg font-bold text-slate-900">
              Pondok Pesantren Tahfidz Al-Qur&apos;an
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 md:flex">
            <Link href="/" className="transition hover:text-emerald-700">Beranda</Link>
            <Link href="/profil" className="transition hover:text-emerald-700">Profil</Link>
            <Link href="/program" className="transition hover:text-emerald-700">Program</Link>
            <Link href="/psb" className="transition hover:text-emerald-700">PSB</Link>
            <Link href="/news" className="transition hover:text-emerald-700">Berita</Link>
            <Link href="/kontak" className="transition hover:text-emerald-700">Kontak</Link>
          </nav>

          <div className="flex items-center gap-2">
            {loading ? (
              <div className="h-10 w-28 animate-pulse rounded-full bg-slate-200" />
            ) : user ? (
              <>
                <Link
                  href={dashboardHref}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  <CircleUserRound size={16} />
                  {dashboardLabel}
                </Link>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <LogOut size={16} />
                  Keluar
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <CircleUserRound size={16} />
                Masuk
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-semibold text-slate-900">Darussunnah Parung</div>
            <div>Jl. KH. Ahmad Sugriwa, Parung, Bogor</div>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/psb" className="transition hover:text-emerald-700">Info PSB</Link>
            <Link href="/news" className="transition hover:text-emerald-700">Berita</Link>
            <Link href="/kontak" className="transition hover:text-emerald-700">Kontak</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
