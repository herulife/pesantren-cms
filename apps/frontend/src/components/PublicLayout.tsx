'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CircleUserRound, LogOut } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const isPortalUser = user?.role === 'user';
  const dashboardHref = isPortalUser ? '/portal' : '/admin';
  const dashboardLabel = isPortalUser ? 'Portal Wali Santri' : 'Panel Admin';
  const navLinks = [
    { href: '/', label: 'Beranda' },
    { href: '/profil', label: 'Profil' },
    { href: '/sambutan', label: 'Sambutan' },
    { href: '/program', label: 'Program' },
    { href: '/facilities', label: 'Fasilitas' },
    { href: '/teachers', label: 'Pengajar' },
    { href: '/agendas', label: 'Agenda' },
    { href: '/psb', label: 'PSB' },
    { href: '/news', label: 'Berita' },
    { href: '/galeri', label: 'Galeri' },
    { href: '/videos', label: 'Video' },
    { href: '/kontak', label: 'Kontak' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/90 shadow-sm backdrop-blur">
        <div className="border-b border-slate-200/70 bg-[linear-gradient(to_right,_rgba(16,185,129,0.08),_rgba(15,23,42,0.02),_rgba(16,185,129,0.08))]">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            <span>Pondok Pesantren Tahfidz Al-Qur&apos;an</span>
            <span className="hidden sm:inline">Parung, Bogor</span>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="flex min-w-0 items-start gap-3">
                <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
                  <Image
                    src="/assets/img/logo.jpg"
                    alt="Logo Darussunnah"
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                    priority
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-600">
                    Darussunnah Parung
                  </span>
                  <div className="truncate text-lg font-bold text-slate-900">
                    Pondok Pesantren Tahfidz Al-Qur&apos;an
                  </div>
                  <div className="text-sm text-slate-500">Pendidikan adab, hafalan, dan kemandirian santri</div>
                </div>
              </Link>

              <div className="flex items-center gap-2 lg:hidden">
                {loading ? (
                  <div className="h-10 w-24 animate-pulse rounded-full bg-slate-200" />
                ) : user ? (
                  <Link
                    href={dashboardHref}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <CircleUserRound size={16} />
                    Masuk
                  </Link>
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

            <div className="hidden items-center gap-2 lg:flex">
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

          <nav className="mt-4 hidden flex-wrap items-center gap-2 text-sm font-medium text-slate-600 md:flex">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 text-sm font-medium text-slate-600 md:hidden">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-200 bg-[linear-gradient(to_bottom,_#ffffff,_#f8fafc)]">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-600">
                Darussunnah Parung
              </div>
              <div className="mt-2 text-lg font-bold text-slate-900">
                Pondok Pesantren Tahfidz Al-Qur&apos;an
              </div>
              <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
                Ruang informasi publik untuk profil pondok, program pendidikan, kabar kegiatan, dan
                jalur komunikasi wali santri serta masyarakat.
              </p>
            </div>

            <div>
              <div className="text-sm font-bold text-slate-900">Navigasi</div>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
                <Link href="/profil" className="transition hover:text-emerald-700">Profil</Link>
                <Link href="/program" className="transition hover:text-emerald-700">Program</Link>
                <Link href="/psb" className="transition hover:text-emerald-700">Info PSB</Link>
              </div>
            </div>

            <div>
              <div className="text-sm font-bold text-slate-900">Informasi</div>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
                <Link href="/news" className="transition hover:text-emerald-700">Berita</Link>
                <Link href="/agendas" className="transition hover:text-emerald-700">Agenda</Link>
                <Link href="/kontak" className="transition hover:text-emerald-700">Kontak</Link>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
            <div>Jl. KH. Ahmad Sugriwa, Parung, Bogor</div>
            <div>Darussunnah Parung</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
