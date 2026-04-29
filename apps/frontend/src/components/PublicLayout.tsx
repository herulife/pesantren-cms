'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, CircleUserRound, LogOut } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const isPortalUser = user?.role === 'user';
  const dashboardHref = isPortalUser ? '/portal' : '/admin';
  const dashboardLabel = isPortalUser ? 'Portal Wali Santri' : 'Panel Admin';
  const navLinks = [
    { href: '/', label: 'Beranda', active: true },
    { href: '/profil', label: 'Profil', withChevron: true },
    { href: '/program', label: 'Program' },
    { href: '/psb', label: 'PSB' },
    { href: '/news', label: 'Informasi', withChevron: true },
    { href: '/kontak', label: 'Kontak' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-30 border-b border-emerald-950/70 bg-[#0f4d3f] text-white shadow-[0_18px_45px_-30px_rgba(0,0,0,0.55)] backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-300/30 bg-white shadow-[0_12px_30px_-18px_rgba(255,255,255,0.55)]">
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
                  <span className="block truncate text-[11px] font-black uppercase tracking-[0.24em] text-emerald-200">
                    Darussunnah Parung
                  </span>
                  <div className="truncate text-[2rem] font-black leading-none text-white sm:text-[2.1rem]">
                    Darussunnah Parung
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/85">
                    Pondok Pesantren Tahfidz
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-2 lg:hidden">
                {loading ? (
                  <div className="h-10 w-24 animate-pulse rounded-full bg-white/15" />
                ) : user ? (
                  <Link
                    href={dashboardHref}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    <CircleUserRound size={16} />
                    Masuk
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    <CircleUserRound size={16} />
                    Masuk
                  </Link>
                )}
              </div>
            </div>

            <nav className="hidden xl:flex xl:flex-1 xl:justify-center">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#115745] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                {navLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-1 rounded-full px-5 py-3 text-sm font-semibold transition ${
                      item.active
                        ? 'bg-[#16624d] text-white shadow-[0_10px_28px_-18px_rgba(0,0,0,0.6)]'
                        : 'text-white/92 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {item.label}
                    {item.withChevron ? <ChevronDown size={14} className="opacity-70" /> : null}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              {loading ? (
                <div className="h-10 w-28 animate-pulse rounded-full bg-white/15" />
              ) : user ? (
                <>
                  <Link
                    href={dashboardHref}
                    className="inline-flex items-center gap-2 rounded-full bg-[#12d89f] px-5 py-3 text-sm font-bold text-[#08372d] transition hover:bg-[#21e3ab]"
                  >
                    <CircleUserRound size={16} />
                    {dashboardLabel}
                  </Link>
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    <LogOut size={16} />
                    Keluar
                  </button>
                </>
                ) : (
                  <>
                    <Link
                      href="/psb"
                      className="inline-flex items-center rounded-full bg-[#12d89f] px-7 py-3 text-sm font-black text-[#08372d] transition hover:bg-[#21e3ab]"
                    >
                      Daftar PSB
                    </Link>
                    <Link
                      href="/login"
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/5 text-white transition hover:bg-white/12"
                    >
                      <CircleUserRound size={18} />
                    </Link>
                  </>
                )}
            </div>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 text-sm font-medium text-white/90 xl:hidden">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full border px-4 py-2 transition ${
                  item.active
                    ? 'border-white/10 bg-white/12 text-white'
                    : 'border-white/10 bg-transparent hover:bg-white/10'
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  {item.label}
                  {item.withChevron ? <ChevronDown size={14} className="opacity-70" /> : null}
                </span>
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
