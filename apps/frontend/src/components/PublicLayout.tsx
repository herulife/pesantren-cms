'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Menu, X, MessageCircle, CircleUserRound, LogOut, ArrowRight, Camera, ThumbsUp, Play } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { getPublicSettingsMap, getSettingsMap, resolveDisplayImageUrl, SettingsMap } from '@/lib/api';
import { parseWebsiteBuilderState } from '@/lib/website-builder';
import BuilderPreviewToolbar, { BuilderPreviewMode } from '@/components/website-builder/BuilderPreviewToolbar';
import WebsiteShellRenderer from '@/components/website-builder/WebsiteShellRenderer';
import { BuilderRenderMode, PublicSiteProvider } from '@/components/PublicSiteContext';

type PublicLayoutProps = {
  children: React.ReactNode;
  hideNavbar?: boolean;
};

export default function PublicLayout({ children, hideNavbar = false }: PublicLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [settings, setSettings] = useState<SettingsMap>({});
  const [openDesktopDropdown, setOpenDesktopDropdown] = useState<'profil' | 'informasi' | null>(null);
  const [openAccountMenu, setOpenAccountMenu] = useState(false);
  const desktopDropdownRef = useRef<HTMLUListElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const isBuilderCompare = pathname.startsWith('/builder-compare');
  const isBuilderPreview = pathname.startsWith('/builder-preview') || isBuilderCompare;
  const effectivePathname = isBuilderPreview ? (pathname.replace(/^\/builder-(preview|compare)/, '') || '/') : pathname;

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isBuilderPreview && loading) {
      return;
    }

    if (isBuilderPreview && (!user || user.role === 'user')) {
      return;
    }

    async function fetchSettings() {
      const data = isBuilderPreview ? await getSettingsMap() : await getPublicSettingsMap();
      setSettings(data || {});
    }

    fetchSettings();
  }, [isBuilderPreview, loading, user]);

  useEffect(() => {
    if (!isBuilderPreview || loading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (user.role === 'user') {
      router.replace('/portal');
    }
  }, [isBuilderPreview, loading, router, user]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMobileMenuOpen(false);
      setOpenDesktopDropdown(null);
      setOpenAccountMenu(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(event.target as Node)) {
        setOpenDesktopDropdown(null);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setOpenAccountMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Pengguna';
  const isPortalUser = user?.role === 'user';
  const dashboardHref = isPortalUser ? '/portal' : '/admin';
  const dashboardLabel = user ? (isPortalUser ? 'Portal Wali Santri' : 'Panel Admin') : 'Masuk Admin';
  const schoolName = settings.school_name || 'Al-Maa Parung';
  const welcomeText = settings.web_welcome_text || 'Pondok Pesantren Tahfidzul Qur’an';
  const logoUrl = resolveDisplayImageUrl(settings.web_logo_url || '/assets/img/logo-alama.jpg');
  const schoolAddress =
    settings.school_address ||
    'Jl. H. Mawi, Gg. Omega, Kp. Jati Waru, RT 003/RW 002, Waru, Kec. Parung, Kab. Bogor, Jawa Barat 16330';
  const schoolPhone = settings.school_phone || '0857 7694 8779';
  const schoolEmail = settings.school_email || '';
  const schoolWebsite = settings.school_website || '';
  const whatsappNumber = schoolPhone.replace(/\D/g, '') || '6285776948779';
  const socialLinks = [
    { href: settings.social_instagram || 'https://instagram.com/yayasanalmaa', label: 'Instagram', icon: <Camera size={18} /> },
    { href: settings.social_facebook || '', label: 'Facebook', icon: <ThumbsUp size={18} /> },
    { href: settings.social_youtube || '', label: 'YouTube', icon: <Play size={18} /> },
  ].filter((item) => item.href);
  const isProfileActive = effectivePathname === '/profil' || effectivePathname.startsWith('/teachers') || effectivePathname.startsWith('/facilities');
  const isProgramActive = effectivePathname.startsWith('/program');
  const isPsbActive = effectivePathname.startsWith('/psb');
  const isInformationActive =
    effectivePathname.startsWith('/galeri') ||
    effectivePathname.startsWith('/videos') ||
    effectivePathname.startsWith('/news') ||
    effectivePathname.startsWith('/donations');
  const isContactActive = effectivePathname.startsWith('/kontak');
  const isPortalPage = effectivePathname.startsWith('/portal');
  const builderState = useMemo(() => parseWebsiteBuilderState(settings), [settings]);
  const useBuilderShell = builderState.enabled || isBuilderPreview;
  const previewMode: BuilderPreviewMode = isBuilderCompare ? 'compare' : 'draft';
  const toggleDesktopDropdown = (menu: 'profil' | 'informasi') => {
    setOpenDesktopDropdown((current) => (current === menu ? null : menu));
  };

  const createContextValue = (renderMode: BuilderRenderMode) => ({
    settings,
    builderState,
    effectivePathname,
    isBuilderPreview,
    renderMode,
    useBuilderContent: renderMode !== 'live',
  });

  if (isBuilderPreview && (loading || !user || user.role === 'user')) {
    return (
      <PublicSiteProvider value={createContextValue('draft')}>
        <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f4fbff_0%,#e7f4ff_100%)] text-slate-900">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
            <p className="mt-4 text-sm font-bold text-sky-700">Menyiapkan preview builder...</p>
          </div>
        </div>
      </PublicSiteProvider>
    );
  }

  const shellRendererProps = {
    hideNavbar,
    pathname: effectivePathname,
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
  };

  if (useBuilderShell) {
    if (isBuilderPreview && previewMode === 'compare') {
      return (
        <div className="min-h-screen bg-slate-100">
          <BuilderPreviewToolbar currentPreviewPath={pathname} effectivePathname={effectivePathname} mode={previewMode} />

          <div className="mx-auto max-w-[1720px] px-4 py-6 md:px-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Published</p>
                  <h3 className="mt-2 text-lg font-black text-slate-950">Versi Live Sekarang</h3>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    Ini yang sedang dilihat pengunjung di website publik.
                  </p>
                </div>

                <PublicSiteProvider value={createContextValue('published')}>
                  <WebsiteShellRenderer
                    {...shellRendererProps}
                    shell={builderState.shellPublished}
                    theme={builderState.themePublished}
                  >
                    {children}
                  </WebsiteShellRenderer>
                </PublicSiteProvider>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-700">Draft</p>
                  <h3 className="mt-2 text-lg font-black text-slate-950">Versi Builder Yang Belum Live</h3>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    Cek perubahan shell dan halaman di sini sebelum dipublish.
                  </p>
                </div>

                <PublicSiteProvider value={createContextValue('draft')}>
                  <WebsiteShellRenderer
                    {...shellRendererProps}
                    shell={builderState.shellDraft}
                    theme={builderState.themeDraft}
                  >
                    {children}
                  </WebsiteShellRenderer>
                </PublicSiteProvider>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <PublicSiteProvider
        value={createContextValue(isBuilderPreview ? 'draft' : 'published')}
      >
        <WebsiteShellRenderer
          {...shellRendererProps}
          shell={isBuilderPreview ? builderState.shellDraft : builderState.shellPublished}
          theme={isBuilderPreview ? builderState.themeDraft : builderState.themePublished}
        >
          {isBuilderPreview ? (
            <BuilderPreviewToolbar currentPreviewPath={pathname} effectivePathname={effectivePathname} mode={previewMode} />
          ) : null}
          {children}
        </WebsiteShellRenderer>
      </PublicSiteProvider>
    );
  }

  return (
    <PublicSiteProvider value={createContextValue('live')}>
      <div className="public-site-shell min-h-screen bg-[linear-gradient(180deg,#f8fcff_0%,#eef7ff_100%)] font-sans antialiased">
      {/* ═══════════════════ NAVBAR ═══════════════════ */}
      {!hideNavbar ? (
      <nav className="sticky top-0 z-[1000] border-b border-sky-200/80 bg-white/90 shadow-[0_12px_30px_rgba(59,130,246,0.08)] backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[4.25rem] items-center justify-between md:h-20">
            {/* Logo */}
            <Link href="/" className="group flex min-w-0 items-center gap-3 text-slate-900 transition-opacity hover:opacity-95">
              <div className="relative">
                <Image
                  src={logoUrl}
                  alt={`Logo ${schoolName}`}
                  width={48}
                  height={48}
                  unoptimized
                  className="h-9 w-9 rounded-full border border-sky-300 bg-white object-contain p-1 shadow-[0_10px_24px_rgba(59,130,246,0.14)] transition-transform duration-300 group-hover:scale-105 md:h-12 md:w-12"
                />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[15px] font-extrabold leading-none tracking-tight md:text-xl">
                  {schoolName}
                </span>
                <span className="mt-1 truncate text-[9px] font-medium uppercase tracking-[0.22em] text-sky-600/80 md:text-[11px]">
                  {welcomeText}
                </span>
              </div>
            </Link>

            {/* Desktop Menu */}
            <ul ref={desktopDropdownRef} className="hidden items-center gap-2 rounded-full border border-sky-200 bg-sky-50/90 px-3 py-2 lg:flex">
              <li>
                <Link href="/" className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${pathname === '/' ? 'bg-sky-500/12 text-sky-700 shadow-inner shadow-sky-300/20' : 'text-slate-700 hover:bg-sky-100 hover:text-sky-700'}`}>
                  Beranda
                </Link>
              </li>
              <li className="relative">
                <button
                  type="button"
                  onClick={() => toggleDesktopDropdown('profil')}
                  aria-expanded={openDesktopDropdown === 'profil'}
                  className={`flex cursor-pointer items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    isProfileActive || openDesktopDropdown === 'profil'
                      ? 'bg-sky-500/12 text-sky-700 shadow-inner shadow-sky-300/20'
                      : 'text-slate-700 hover:bg-sky-100 hover:text-sky-700'
                  }`}
                >
                  Profil <ChevronDown size={12} className={`transition-transform ${openDesktopDropdown === 'profil' ? 'rotate-180' : ''}`} />
                </button>
                <div className={`absolute left-0 top-full pt-4 w-52 z-50 ${openDesktopDropdown === 'profil' ? 'block' : 'hidden'}`}>
                  <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white py-2 shadow-[0_20px_50px_rgba(59,130,246,0.12)]">
                    <div className="border-b border-slate-100 px-4 pb-2 pt-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-600">Profil</p>
                      <p className="mt-1 text-xs text-slate-500">Kenali pondok dan para asatidz lebih dekat.</p>
                    </div>
                    <Link href="/profil" className="block px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700">
                      Profil Pesantren
                    </Link>
                    <Link href="/sambutan" className="block px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700">
                      Sambutan Pimpinan
                    </Link>
                    <Link href="/teachers" className="block px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700">
                      Profil Asatidz
                    </Link>
                    <Link href="/facilities" className="block px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700">
                      Fasilitas Pondok
                    </Link>
                  </div>
                </div>
              </li>
              <li>
                <Link href="/program" className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${isProgramActive ? 'bg-sky-500/12 text-sky-700 shadow-inner shadow-sky-300/20' : 'text-slate-700 hover:bg-sky-100 hover:text-sky-700'}`}>
                  Program
                </Link>
              </li>
              <li>
                <Link href="/psb" className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${isPsbActive ? 'bg-sky-500/12 text-sky-700 shadow-inner shadow-sky-300/20' : 'text-slate-700 hover:bg-sky-100 hover:text-sky-700'}`}>
                  PSB
                </Link>
              </li>
              <li className="relative">
                <button
                  type="button"
                  onClick={() => toggleDesktopDropdown('informasi')}
                  aria-expanded={openDesktopDropdown === 'informasi'}
                  className={`flex cursor-pointer items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    isInformationActive || openDesktopDropdown === 'informasi'
                      ? 'bg-sky-500/12 text-sky-700 shadow-inner shadow-sky-300/20'
                      : 'text-slate-700 hover:bg-sky-100 hover:text-sky-700'
                  }`}
                >
                  Informasi <ChevronDown size={12} className={`transition-transform ${openDesktopDropdown === 'informasi' ? 'rotate-180' : ''}`} />
                </button>
                <div className={`absolute left-0 top-full pt-4 w-52 z-50 ${openDesktopDropdown === 'informasi' ? 'block' : 'hidden'}`}>
                  <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white py-2 shadow-[0_20px_50px_rgba(59,130,246,0.12)]">
                    <div className="border-b border-slate-100 px-4 pb-2 pt-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-600">Informasi</p>
                      <p className="mt-1 text-xs text-slate-500">Ikuti berita, video, dan dokumentasi kegiatan pondok.</p>
                    </div>
                    <Link href="/galeri" className="block px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700">
                      Galeri
                    </Link>
                    <Link href="/videos" className="block px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700">
                      Video
                    </Link>
                    <Link href="/news" className="block px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700">
                      Berita
                    </Link>
                    <Link href="/donations/wakaf-cat-tembok" className="block px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700">
                      Open Donasi
                    </Link>
                  </div>
                </div>
              </li>
              <li className="relative">
                <Link href="/kontak" className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${isContactActive ? 'bg-sky-500/12 text-sky-700 shadow-inner shadow-sky-300/20' : 'text-slate-700 hover:bg-sky-100 hover:text-sky-700'}`}>
                  Kontak
                </Link>
              </li>
            </ul>

            {/* Desktop Auth */}
            <div className="hidden items-center gap-3 lg:flex">
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="h-11 w-32 animate-pulse rounded-full bg-sky-100" />
                  <div className="h-11 w-11 animate-pulse rounded-full bg-sky-100" />
                </div>
              ) : user ? (
                <>
                  <div className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-slate-700">
                    <span className="text-sky-600/80">Assalamu&apos;alaikum, </span>
                    <span className="font-semibold text-slate-900">{firstName}</span>
                  </div>
                  <div className="group relative">
                    <div ref={accountMenuRef} className="relative">
                      <button
                        type="button"
                        aria-label={dashboardLabel}
                        onClick={() => setOpenAccountMenu((prev) => !prev)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-lg shadow-sky-200/70 transition-all hover:brightness-105"
                      >
                        <CircleUserRound size={20} />
                      </button>
                      <div className={`absolute right-0 top-full mt-3 w-64 overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_20px_50px_rgba(59,130,246,0.12)] transition-all duration-200 ${openAccountMenu ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'}`}>
                        <div className="border-b border-slate-100 px-4 py-4 text-right">
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-600">{dashboardLabel}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{user.name}</p>
                        </div>
                        <div className="p-2">
                          <Link
                            href={dashboardHref}
                            onClick={() => setOpenAccountMenu(false)}
                            className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
                          >
                            <span>Buka {dashboardLabel}</span>
                            <ArrowRight size={16} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenAccountMenu(false);
                              void logout();
                            }}
                            className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                          >
                            <span>Keluar</span>
                            <LogOut size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/psb" className="inline-flex items-center rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-200/70 transition-all hover:brightness-105">
                    Daftar PSB
                  </Link>
                  <div ref={accountMenuRef} className="relative">
                    <button
                      type="button"
                      aria-label="Menu akun"
                      onClick={() => setOpenAccountMenu((prev) => !prev)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-700 transition-all hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800"
                    >
                      <CircleUserRound size={20} />
                    </button>
                    <div className={`absolute right-0 top-full mt-3 w-56 overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-[0_20px_50px_rgba(59,130,246,0.12)] transition-all duration-200 ${openAccountMenu ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'}`}>
                      <div className="border-b border-slate-100 px-4 py-4 text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-600">Menu Akun</p>
                        <p className="mt-1 text-sm font-medium text-slate-500">Masuk untuk mengakses portal atau panel admin.</p>
                      </div>
                      <div className="p-2">
                        <Link
                          href="/login"
                          onClick={() => setOpenAccountMenu(false)}
                          className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
                        >
                          <span>Masuk</span>
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-200 bg-white shadow-[0_12px_30px_-18px_rgba(59,130,246,0.16)] transition-colors hover:bg-sky-50">
              {mobileMenuOpen ? <X size={20} className="text-sky-700" /> : <Menu size={20} className="text-sky-700" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute left-0 top-full z-[999] w-full border-t border-sky-200 bg-white/98 shadow-2xl lg:hidden">
            <div className="px-4 pb-4 pt-3">
              <div className="rounded-[1.5rem] border border-sky-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.96)_100%)] p-3 shadow-[0_24px_50px_-34px_rgba(59,130,246,0.18)] backdrop-blur-sm">
                <div className="mb-3 flex items-center justify-between rounded-[1.2rem] border border-sky-100 bg-white/90 px-4 py-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-600/80">Navigasi</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">Menu Utama Al-Maa</p>
                  </div>
                  <div className="rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">
                    Mobile
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-[1.35rem] border border-sky-100 bg-sky-50/75 p-2">
                  <Link href="/" onClick={() => setMobileMenuOpen(false)} className="rounded-[1rem] bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-sky-100">Beranda</Link>
                  <Link href="/program" onClick={() => setMobileMenuOpen(false)} className="rounded-[1rem] bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-sky-100">Program</Link>
                  <Link href="/psb" onClick={() => setMobileMenuOpen(false)} className="rounded-[1rem] bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-sky-100">PSB</Link>
                  <Link href="/kontak" onClick={() => setMobileMenuOpen(false)} className="rounded-[1rem] bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-sky-100">Kontak</Link>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-[1.25rem] border border-slate-100 bg-white/88 p-3">
                    <p className="px-1 text-[10px] font-black uppercase tracking-[0.25em] text-sky-500/80">Profil</p>
                    <div className="mt-2 grid grid-cols-1 gap-2">
                      <Link href="/profil" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-sky-100">Profil Pesantren</Link>
                      <Link href="/sambutan" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-sky-100">Sambutan Pimpinan</Link>
                      <Link href="/teachers" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-sky-100">Profil Asatidz</Link>
                      <Link href="/facilities" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-sky-100">Fasilitas Pondok</Link>
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-slate-100 bg-white/88 p-3">
                    <p className="px-1 text-[10px] font-black uppercase tracking-[0.25em] text-sky-500/80">Informasi</p>
                    <div className="mt-2 grid grid-cols-1 gap-2">
                      <Link href="/galeri" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-sky-100">Galeri</Link>
                      <Link href="/videos" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-sky-100">Video</Link>
                      <Link href="/news" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-sky-100">Berita</Link>
                      <Link href="/donations/wakaf-cat-tembok" onClick={() => setMobileMenuOpen(false)} className="rounded-xl bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-800 transition-colors hover:bg-cyan-100">Open Donasi</Link>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3">
                  {loading ? (
                    <div className="h-24 animate-pulse rounded-2xl bg-blue-900/40" />
                  ) : user ? (
                    <>
                      <div className="rounded-[1.25rem] border border-sky-200 bg-sky-50 px-5 py-4 text-center text-slate-700">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600/70">Sudah Masuk</p>
                        <p className="mt-2 text-base font-semibold text-slate-900">{user.name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {isPortalUser ? 'Lanjutkan proses melalui Portal Wali Santri.' : 'Lanjutkan pengelolaan melalui panel admin.'}
                        </p>
                      </div>
                      <Link href={dashboardHref} onClick={() => setMobileMenuOpen(false)} className="block rounded-[1.1rem] bg-sky-500 px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-sky-200/80">
                        {isPortalUser ? 'Buka Portal Wali Santri' : 'Buka Panel Admin'}
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/psb" onClick={() => setMobileMenuOpen(false)} className="block rounded-[1.1rem] bg-sky-500 px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-sky-200/80">
                        Daftar Sekarang
                      </Link>
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-3 rounded-[1.1rem] border border-sky-200 bg-white px-6 py-3 text-center text-sm font-bold text-sky-700"
                      >
                        <CircleUserRound size={18} />
                        Masuk Admin
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
      ) : null}

      {/* ═══════════════════ MAIN CONTENT ═══════════════════ */}
      <main>{children}</main>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="relative overflow-hidden border-t border-sky-200 bg-[linear-gradient(180deg,#f8fbff_0%,#eaf5ff_100%)] pb-8 pt-12 md:pt-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(125,211,252,0.12),transparent_18%)]" />
        <div className="mx-auto max-w-6xl px-4 relative z-10">
          {/* Top: Brand + Social */}
          <div className="flex flex-col gap-5 rounded-[1.7rem] border border-sky-100 bg-white/88 p-5 shadow-[0_28px_70px_-42px_rgba(59,130,246,0.14)] backdrop-blur-sm md:flex-row md:items-center md:justify-between md:rounded-[2rem] md:p-7">
            <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-center md:text-left">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-sky-300/30 blur-xl" />
                <Image
                  src={logoUrl}
                  alt={`Logo ${schoolName}`}
                  width={72}
                  height={72}
                  unoptimized
                  className="relative h-16 w-16 rounded-full border-2 border-sky-300 bg-white object-contain p-1.5 shadow-[0_18px_42px_-20px_rgba(59,130,246,0.2)] md:h-[4.5rem] md:w-[4.5rem]"
                />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-sky-600/85">Pondok Pesantren Tahfidz</p>
                <div className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 md:text-[1.6rem]">{schoolName}</div>
                <div className="mt-1 text-xs font-medium tracking-[0.16em] text-sky-600/80 md:text-sm">{welcomeText}</div>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Lingkungan belajar Qurani yang menumbuhkan ilmu, adab, dan kemandirian santri secara terarah.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 md:items-end">
              <div className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-bold text-sky-700">
                Kontak utama: {schoolPhone}
              </div>
              <div className="flex items-center justify-center gap-3 md:max-w-sm md:justify-end">
                {socialLinks.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-700 transition-all hover:-translate-y-1 hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800" aria-label={s.label}>
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Grid Footer */}
          <div className="grid gap-4 py-8 md:grid-cols-2 md:gap-5 md:py-10 lg:grid-cols-[1.05fr_1.2fr_0.95fr_0.8fr]">
            <div className="rounded-[1.45rem] border border-sky-100 bg-white/82 p-5 shadow-[0_22px_50px_-36px_rgba(59,130,246,0.12)] backdrop-blur-sm md:rounded-[1.65rem] md:p-6">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-sky-600/85">Tentang Al-Maa</p>
              <p className="text-sm leading-7 text-slate-600">
                Al-Maa Parung menekankan pembinaan tahfidz, adab, ilmu syar&apos;i, dan suasana belajar yang tertib untuk membantu santri tumbuh lebih mandiri.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-2 text-[11px] font-bold text-sky-700">Tahfidz</span>
                <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-2 text-[11px] font-bold text-sky-700">Adab</span>
                <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-2 text-[11px] font-bold text-sky-700">SMP - SMK</span>
              </div>
            </div>
            <div className="rounded-[1.45rem] border border-sky-100 bg-white/82 p-5 shadow-[0_22px_50px_-36px_rgba(59,130,246,0.12)] backdrop-blur-sm md:rounded-[1.65rem] md:p-6">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-sky-600/85">Kontak Pondok</p>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-sky-500">Alamat</div>
                  <div className="leading-7 text-slate-600">{schoolAddress}</div>
                </div>
                <div className="grid gap-2">
                  <div className="rounded-[1rem] border border-sky-100 bg-sky-50/75 px-4 py-3 text-slate-600">
                    Kontak utama: {schoolPhone}
                  </div>
                  {schoolEmail ? (
                    <div className="rounded-[1rem] border border-sky-100 bg-sky-50/75 px-4 py-3 text-slate-600">
                      Email: {schoolEmail}
                    </div>
                  ) : null}
                  {schoolWebsite ? (
                    <div className="rounded-[1rem] border border-sky-100 bg-sky-50/75 px-4 py-3 text-slate-600">
                      Website: {schoolWebsite}
                    </div>
                  ) : null}
                </div>
                <a
                  href="https://maps.google.com/?q=Jl.%20H.%20Mawi%20Gg.%20Omega%20Kp.%20Jati%20Waru%20Parung%20Bogor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-sky-700 transition-colors hover:text-sky-800"
                >
                  Buka lokasi di Google Maps <ArrowRight size={14} />
                </a>
              </div>
            </div>
            <div className="rounded-[1.45rem] border border-sky-100 bg-white/82 p-5 shadow-[0_22px_50px_-36px_rgba(59,130,246,0.12)] backdrop-blur-sm md:rounded-[1.65rem] md:p-6">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-sky-600/85">Tautan Utama</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {[
                  { name: 'Beranda', href: '/' },
                  { name: 'Sambutan Pimpinan', href: '/sambutan' },
                  { name: 'Profil Pondok', href: '/profil' },
                  { name: 'Program Pondok', href: '/program' },
                  { name: 'Berita', href: '/news' },
                  { name: 'Video Kegiatan', href: '/videos' },
                  { name: 'Galeri Kegiatan', href: '/galeri' },
                  { name: 'Kontak Pondok', href: '/kontak' },
                ].map((link) => (
                  <Link key={link.href} href={link.href} className="block rounded-xl px-3 py-2 text-sm text-slate-600 transition-all hover:bg-sky-50 hover:text-sky-700">
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="rounded-[1.45rem] border border-sky-100 bg-white/82 p-5 shadow-[0_22px_50px_-36px_rgba(59,130,246,0.12)] backdrop-blur-sm md:rounded-[1.65rem] md:p-6">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-sky-600/85">Waktu Layanan</p>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3">
                  Senin - Sabtu: 08:00 - 16:00 WIB
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3">
                  Ahad &amp; Hari Libur: Tutup
                </div>
                <p className="pt-2 font-medium text-sky-600">Kunjungan wali santri setiap Ahad terakhir bulan.</p>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="flex flex-col items-center justify-between gap-3 border-t border-sky-100 pt-7 text-center text-sm text-slate-500 md:flex-row md:gap-4 md:pt-8 md:text-left">
            <div>&copy; 2026 {schoolName}. Seluruh hak cipta dilindungi.</div>
            <div>Dikembangkan oleh <a href="https://herufidiyanto.netlify.app/" className="font-medium text-sky-600 transition-colors hover:text-sky-700">Heru F</a></div>
          </div>
        </div>
      </footer>

      {/* ═══════════════════ WHATSAPP FLOAT ═══════════════════ */}
      <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer"
        className={`fixed right-4 z-[9995] flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-600/30 ring-4 ring-white/25 transition-all duration-300 hover:scale-110 hover:shadow-blue-600/50 md:right-6 md:h-14 md:w-14 md:ring-white/30 ${
          isPortalPage ? 'bottom-28 md:bottom-6' : 'bottom-4 md:bottom-6'
        }`}
        aria-label="Chat via WhatsApp">
        <MessageCircle size={24} className="md:h-7 md:w-7" />
        <span className="absolute w-full h-full rounded-full bg-blue-400 opacity-20 animate-ping -z-10" />
      </a>

      {/* ═══════════════════ BACK TO TOP ═══════════════════ */}
      {showBackToTop && (
        <button onClick={scrollToTop}
          className={`fixed right-4 z-[9990] flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-blue-600 shadow-lg transition-all hover:scale-110 hover:text-blue-500 md:right-6 md:h-10 md:w-10 ${
            isPortalPage ? 'bottom-[11.5rem] md:bottom-24' : 'bottom-[4.5rem] md:bottom-24'
          }`}
          aria-label="Kembali ke atas">
          <ChevronUp size={20} className="md:h-6 md:w-6" />
        </button>
      )}
      </div>
    </PublicSiteProvider>
  );
}

