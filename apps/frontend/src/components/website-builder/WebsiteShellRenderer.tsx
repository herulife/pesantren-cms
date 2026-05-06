'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronUp,
  CircleUserRound,
  LogOut,
  Menu,
  MessageCircle,
  X,
} from 'lucide-react';
import { WebsiteBuilderShell, WebsiteBuilderTheme } from '@/lib/website-builder';

type PublicUser = {
  name: string;
  role: string;
} | null;

type SocialLink = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

type WebsiteShellRendererProps = {
  children: React.ReactNode;
  hideNavbar?: boolean;
  shell: WebsiteBuilderShell;
  theme: WebsiteBuilderTheme;
  pathname: string;
  logoUrl: string;
  schoolName: string;
  welcomeText: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  schoolWebsite: string;
  whatsappNumber: string;
  socialLinks: SocialLink[];
  user: PublicUser;
  loading: boolean;
  logout: () => Promise<void>;
  showBackToTop: boolean;
  scrollToTop: () => void;
  isPortalPage: boolean;
};

function primaryClasses(theme: WebsiteBuilderTheme) {
  if (theme.palette.primary === 'blue') return 'from-blue-600 to-sky-500';
  if (theme.palette.primary === 'teal') return 'from-teal-600 to-cyan-500';
  if (theme.palette.primary === 'amber') return 'from-amber-500 to-orange-500';
  if (theme.palette.primary === 'slate') return 'from-slate-800 to-slate-600';
  return 'from-emerald-600 to-emerald-400';
}

function navbarClass(shell: WebsiteBuilderShell) {
  const base = 'z-[1000] border-b shadow-[0_10px_30px_rgba(2,6,23,0.18)] backdrop-blur-md';
  const position = shell.navbar.position === 'static' ? 'relative' : 'sticky top-0';
  if (shell.navbar.variant === 'transparent-over-hero' || shell.navbar.position === 'transparent-over-hero') {
    return `${position} ${base} border-white/10 bg-slate-950/50`;
  }
  if (shell.navbar.variant === 'simple') {
    return `${position} ${base} border-emerald-900/70 bg-emerald-950/92`;
  }
  return `${position} ${base} border-emerald-900/80 bg-emerald-950/95`;
}

function footerClass(background: WebsiteBuilderShell['footer']['background']) {
  if (background === 'light') return 'border-slate-200 bg-white text-slate-700';
  if (background === 'slate-dark') return 'border-slate-800 bg-slate-950 text-slate-200';
  return 'border-emerald-900/70 bg-[linear-gradient(180deg,#082f28_0%,#041b18_100%)] text-emerald-100';
}

export default function WebsiteShellRenderer({
  children,
  hideNavbar = false,
  shell,
  theme,
  pathname,
  logoUrl,
  schoolName,
  welcomeText,
  schoolAddress,
  schoolPhone,
  schoolEmail,
  schoolWebsite,
  whatsappNumber,
  socialLinks,
  user,
  loading,
  logout,
  showBackToTop,
  scrollToTop,
  isPortalPage,
}: WebsiteShellRendererProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Pengguna';
  const isPortalUser = user?.role === 'user';
  const dashboardHref = isPortalUser ? '/portal' : '/admin';
  const dashboardLabel = user ? (isPortalUser ? 'Portal Wali Santri' : 'Panel Admin') : 'Masuk Admin';
  const cta = shell.navbar.cta;
  const menuItems = shell.navbar.menu_items.length > 0 ? shell.navbar.menu_items : [{ label: 'Beranda', url: '/' }];
  const footerLinks = shell.footer.quick_links.length > 0 ? shell.footer.quick_links : menuItems;
  const whatsappHref = shell.floating.whatsapp.url || `https://wa.me/${whatsappNumber}`;
  const showNavbar = !hideNavbar && shell.navbar.enabled;
  const showFooter = shell.footer.enabled;
  const showWhatsApp = shell.floating.whatsapp.enabled;
  const showBackButton = shell.floating.back_to_top.enabled && showBackToTop;

  return (
    <div className="public-site-shell min-h-screen bg-white font-sans antialiased">
      {showNavbar ? (
        <nav className={navbarClass(shell)}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className={`flex items-center justify-between ${shell.navbar.variant === 'compact' ? 'h-16' : 'h-[4.25rem] md:h-20'}`}>
              <Link href="/" className="group flex min-w-0 items-center gap-3 text-white transition-opacity hover:opacity-95">
                {shell.navbar.logo_url || logoUrl ? (
                  <Image
                    src={shell.navbar.logo_url || logoUrl}
                    alt={`Logo ${schoolName}`}
                    width={48}
                    height={48}
                    unoptimized
                    className="h-9 w-9 rounded-full border border-emerald-400/80 object-cover shadow-[0_10px_25px_rgba(16,185,129,0.18)] transition-transform duration-300 group-hover:scale-105 md:h-12 md:w-12"
                  />
                ) : null}
                {shell.navbar.show_school_name ? (
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[15px] font-extrabold leading-none tracking-tight md:text-xl">
                      {shell.navbar.school_name_override || schoolName}
                    </span>
                    <span className="mt-1 truncate text-[9px] font-medium uppercase tracking-[0.22em] text-emerald-200/75 md:text-[11px]">
                      {welcomeText}
                    </span>
                  </div>
                ) : null}
              </Link>

              <ul className={`hidden items-center gap-2 rounded-full border border-emerald-900/70 bg-emerald-900/30 px-3 py-2 lg:flex ${shell.navbar.variant === 'centered' ? 'mx-auto' : ''}`}>
                {menuItems.map((item) => {
                  const active = item.url === '/' ? pathname === '/' : pathname.startsWith(item.url);
                  return (
                    <li key={`${item.label}-${item.url}`}>
                      <Link
                        href={item.url}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                          active ? 'bg-emerald-400/12 text-emerald-200 shadow-inner shadow-emerald-400/10' : 'text-emerald-50 hover:bg-emerald-400/10 hover:text-emerald-200'
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="hidden items-center gap-3 lg:flex">
                {cta.label && cta.url ? (
                  <Link href={cta.url} className={`inline-flex items-center rounded-full bg-gradient-to-r ${primaryClasses(theme)} px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition-all hover:brightness-105`}>
                    {cta.label}
                  </Link>
                ) : null}
                {loading ? (
                  <div className="h-11 w-11 animate-pulse rounded-full bg-emerald-900/60" />
                ) : (
                  <div className="relative">
                    <button
                      type="button"
                      aria-label={dashboardLabel}
                      onClick={() => setAccountOpen((prev) => !prev)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-700/90 bg-emerald-900/35 text-emerald-50 transition-all hover:border-emerald-500 hover:bg-emerald-900/60 hover:text-emerald-200"
                    >
                      <CircleUserRound size={20} />
                    </button>
                    <div className={`absolute right-0 top-full mt-3 w-64 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] transition-all duration-200 ${accountOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'}`}>
                      <div className="border-b border-slate-100 px-4 py-4 text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">{user ? dashboardLabel : 'Menu Akun'}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{user ? user.name : 'Masuk untuk mengakses portal.'}</p>
                      </div>
                      <div className="p-2">
                        <Link
                          href={user ? dashboardHref : '/login'}
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <span>{user ? `Buka ${dashboardLabel}` : 'Masuk'}</span>
                          <ArrowRight size={16} />
                        </Link>
                        {user ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAccountOpen(false);
                              void logout();
                            }}
                            className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                          >
                            <span>Keluar</span>
                            <LogOut size={16} />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-800 bg-emerald-900/55 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.6)] transition-colors hover:bg-emerald-800 lg:hidden"
              >
                {mobileMenuOpen ? <X size={20} className="text-emerald-50" /> : <Menu size={20} className="text-emerald-50" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen ? (
            <div className="absolute left-0 top-full z-[999] w-full border-t border-emerald-900 bg-emerald-950/98 shadow-2xl lg:hidden">
              <div className="px-4 pb-5 pt-3">
                <div className="rounded-[1.6rem] border border-emerald-900/60 bg-emerald-950/80 p-3">
                  <div className="grid gap-2">
                    {menuItems.map((item) => (
                      <Link key={`${item.label}-${item.url}-mobile`} href={item.url} onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-emerald-50 hover:bg-emerald-900">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  {shell.navbar.mobile.show_cta && cta.label && cta.url ? (
                    <Link href={cta.url} onClick={() => setMobileMenuOpen(false)} className={`mt-4 block rounded-[1.15rem] bg-gradient-to-r ${primaryClasses(theme)} px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-emerald-950/30`}>
                      {cta.label}
                    </Link>
                  ) : null}
                  <div className="mt-3 grid gap-2">
                    {user ? (
                      <>
                        <div className="rounded-[1.15rem] border border-emerald-800 bg-emerald-900/40 px-4 py-3 text-sm text-emerald-100">
                          Assalamu&apos;alaikum, <b>{firstName}</b>
                        </div>
                        <Link href={dashboardHref} onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-emerald-50 hover:bg-emerald-900">
                          Buka {dashboardLabel}
                        </Link>
                      </>
                    ) : (
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-emerald-50 hover:bg-emerald-900">
                        Masuk
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </nav>
      ) : null}

      <main>{children}</main>

      {showFooter ? (
        <footer className={`relative overflow-hidden border-t pb-8 pt-14 md:pt-16 ${footerClass(shell.footer.background)}`}>
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
              <div>
                {shell.footer.show_logo ? (
                  <Image src={shell.footer.logo_url || logoUrl} alt={`Logo ${schoolName}`} width={70} height={70} unoptimized className="h-16 w-16 rounded-full border border-emerald-400 object-cover" />
                ) : null}
                <h2 className="mt-5 text-2xl font-black tracking-tight text-white">{schoolName}</h2>
                <p className="mt-3 max-w-xl text-sm leading-7 opacity-80">{shell.footer.description}</p>
                {shell.footer.show_socials ? (
                  <div className="mt-5 flex gap-3">
                    {socialLinks.map((item) => (
                      <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/8 text-emerald-100 transition hover:bg-white/14" aria-label={item.label}>
                        {item.icon}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
              <div>
                <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">Tautan</p>
                <div className="grid gap-2">
                  {footerLinks.map((link) => (
                    <Link key={`${link.label}-${link.url}-footer`} href={link.url} className="rounded-xl px-3 py-2 text-sm opacity-82 transition hover:bg-white/8 hover:opacity-100">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">Kontak</p>
                <div className="space-y-3 text-sm leading-7 opacity-82">
                  {shell.footer.show_address ? <p>{schoolAddress}</p> : null}
                  <p>{schoolPhone}</p>
                  {schoolEmail ? <p>{schoolEmail}</p> : null}
                  {schoolWebsite ? <p>{schoolWebsite}</p> : null}
                  {shell.footer.show_map_link ? (
                    <a href="https://maps.google.com/?q=Pondok%20Pesantren%20Darussunnah%20Parung" target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full border border-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition hover:bg-white/8">
                      Buka Maps
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="mt-10 border-t border-white/10 pt-6 text-sm opacity-70">
              {shell.footer.copyright_text || `© 2026 ${schoolName}.`}
            </div>
          </div>
        </footer>
      ) : null}

      {showWhatsApp ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`fixed z-[9995] flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-4 ring-white/25 transition-all duration-300 hover:scale-110 md:h-14 md:w-14 ${
            shell.floating.whatsapp.position === 'bottom-left' ? 'left-4 md:left-6' : 'right-4 md:right-6'
          } ${isPortalPage || shell.floating.whatsapp.mobile_offset === 'above-bottom-nav' ? 'bottom-28 md:bottom-6' : 'bottom-4 md:bottom-6'}`}
          aria-label={shell.floating.whatsapp.label || 'Chat via WhatsApp'}
        >
          <MessageCircle size={24} className="md:h-7 md:w-7" />
        </a>
      ) : null}

      {showBackButton ? (
        <button
          onClick={scrollToTop}
          className={`fixed z-[9990] flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-emerald-600 shadow-lg transition-all hover:scale-110 hover:text-emerald-500 md:h-10 md:w-10 ${
            shell.floating.back_to_top.position === 'bottom-left' ? 'left-4 md:left-6' : 'right-4 md:right-6'
          } ${isPortalPage ? 'bottom-[11.5rem] md:bottom-24' : 'bottom-[4.5rem] md:bottom-24'}`}
          aria-label="Kembali ke atas"
        >
          <ChevronUp size={20} />
        </button>
      ) : null}
    </div>
  );
}
