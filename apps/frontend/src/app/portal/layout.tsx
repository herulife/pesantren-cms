'use client';

import React, { useEffect, useState } from 'react';
import PublicLayout from '@/components/PublicLayout';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Upload, ArrowLeft, HelpCircle, LayoutDashboard, GraduationCap, Wallet, QrCode, RefreshCw, Lock, Home, Folder, MoreHorizontal, LogOut, CreditCard, Menu, X } from 'lucide-react';
import { getMyPSBRegistration, type Registration } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

function isFilled(value?: string | null) {
  return Boolean(value && value.trim());
}

type MobilePortalTab = {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  locked?: boolean;
};

type PortalNavItem = {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  docRef: string;
};

type PortalNavGroup = {
  id: string;
  label: string;
  description: string;
  active: boolean;
  items: PortalNavItem[];
  locked?: boolean;
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const isRaportPage = pathname.startsWith('/portal/raport');
  const isPortalDashboard = pathname === '/portal';
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    setSidebarOpen(false);
    void logout();
  };

  useEffect(() => {
    let cancelled = false;

    const loadRegistration = async () => {
      setIsLoading(true);
      try {
        const data = await getMyPSBRegistration();
        if (!cancelled) {
          setRegistration(data);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadRegistration();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sidebarOpen]);

  const registrationStatus = registration?.status || 'pending';
  const hasStudentAccess = registrationStatus === 'accepted';
  const isServicePath = pathname.startsWith('/portal/raport') || pathname.startsWith('/portal/wallet') || pathname.startsWith('/portal/exams');
  const biodataCompleted = [
    registration?.full_name,
    registration?.gender,
    registration?.nik,
    registration?.birth_place,
    registration?.birth_date,
    registration?.address,
    registration?.school_origin,
    registration?.program_choice,
    registration?.father_name,
    registration?.father_job,
    registration?.father_phone,
    registration?.mother_name,
    registration?.mother_job,
    registration?.mother_phone,
  ].every(isFilled);
  const documentsCompleted = [registration?.kk_url, registration?.ijazah_url, registration?.pasfoto_url].every(isFilled);
  const paymentCompleted = registration?.payment_status === 'paid';

  const registrationItems: PortalNavItem[] = [
    {
      href: '/portal',
      label: 'Dashboard Pendaftaran',
      description: 'Progres, status, dan langkah berikutnya.',
      icon: <LayoutDashboard size={20} />,
      docRef: 'dashboard',
    },
    {
      href: '/portal/biodata',
      label: 'Biodata Lengkap',
      description: 'Data calon santri dan orang tua.',
      icon: <User size={20} />,
      docRef: 'biodata',
    },
    {
      href: '/portal/documents',
      label: 'Unggah Dokumen',
      description: 'Kirim KK, ijazah, raport, pas foto.',
      icon: <Upload size={20} />,
      docRef: 'documents',
    },
    {
      href: '/portal/payment',
      label: 'Bayar Pendaftaran',
      description: 'Upload bukti transfer biaya daftar.',
      icon: <CreditCard size={20} />,
      docRef: 'dashboard',
    },
    {
      href: '/portal/help',
      label: 'Panduan Portal',
      description: 'Baca langkah tiap menu portal.',
      icon: <HelpCircle size={20} />,
      docRef: 'dashboard',
    },
  ];

  const serviceItems: PortalNavItem[] = [
    {
      href: '/portal/raport',
      label: 'Raport Akademik',
      description: 'Nilai, presensi, progres tahfidz.',
      icon: <GraduationCap size={20} />,
      docRef: 'academics',
    },
    {
      href: '/portal/wallet',
      label: 'Darussunnah Pay',
      description: 'Saldo, PIN, mutasi transaksi.',
      icon: <Wallet size={20} />,
      docRef: 'dashboard',
    },
    {
      href: '/portal/exams',
      label: 'CBT & Ujian',
      description: 'Ujian online dan tes akademik.',
      icon: <QrCode size={20} />,
      docRef: 'academics',
    },
  ];

  const dashboardItem = registrationItems[0];
  const helpItem = registrationItems[4];
  const studentItems = [dashboardItem, ...serviceItems, helpItem];
  const navGroups: PortalNavGroup[] = hasStudentAccess
    ? [
        {
          id: 'services',
          label: 'Akses Santri',
          description: 'Menu utama untuk santri aktif.',
          active: true,
          items: studentItems,
        },
      ]
    : [
        {
          id: 'registration',
          label: 'Pendaftaran',
          description:
            biodataCompleted && documentsCompleted && paymentCompleted
              ? 'Biodata, dokumen, dan pembayaran sudah lengkap.'
              : biodataCompleted && documentsCompleted
                ? 'Berkas utama lengkap. Lanjutkan pembayaran.'
              : 'Menu melengkapi biodata dan dokumen.',
          active: !isServicePath,
          items: registrationItems,
        },
      ];

  const mobilePortalTabs: MobilePortalTab[] = hasStudentAccess
    ? [
        {
          href: '/portal',
          label: 'Dasbor',
          icon: <LayoutDashboard size={18} />,
          active: pathname === '/portal',
        },
        {
          href: '/portal/raport',
          label: 'Raport',
          icon: <GraduationCap size={18} />,
          active: pathname.startsWith('/portal/raport'),
        },
        {
          href: '/portal/wallet',
          label: 'Wallet',
          icon: <Wallet size={18} />,
          active: pathname.startsWith('/portal/wallet'),
        },
        {
          href: '/portal/exams',
          label: 'CBT',
          icon: <QrCode size={18} />,
          active: pathname.startsWith('/portal/exams'),
        },
        {
          href: '/portal/help',
          label: 'Lainnya',
          icon: <MoreHorizontal size={18} />,
          active: pathname.startsWith('/portal/help'),
        },
      ]
    : [
        {
          href: '/portal',
          label: 'Dasbor',
          icon: <LayoutDashboard size={18} />,
          active: pathname === '/portal',
        },
        {
          href: '/portal/biodata',
          label: 'Biodata',
          icon: <User size={18} />,
          active: pathname.startsWith('/portal/biodata'),
        },
        {
          href: '/portal/documents',
          label: 'Dokumen',
          icon: <Folder size={18} />,
          active: pathname.startsWith('/portal/documents'),
        },
        {
          href: '/portal/payment',
          label: 'Bayar',
          icon: <CreditCard size={18} />,
          active: pathname.startsWith('/portal/payment'),
        },
        {
          href: '/portal/help',
          label: 'Lainnya',
          icon: <MoreHorizontal size={18} />,
          active: pathname.startsWith('/portal/help'),
        },
      ];

  return (
    <PublicLayout hideNavbar>
      <div className="lte-page">
        <div className="flex min-h-screen">
          {/* Sidebar desktop + off-canvas mobile */}
          <aside
            id="portal-sidebar"
            aria-label="Sidebar navigasi portal"
            className={`lte-sidebar ${sidebarOpen ? 'open' : ''}`}
          >
            <div className="lte-brand">
              <Link href="/">
                <span className="lte-brand-logo">D</span>
                <span className="truncate">Portal Darussunnah</span>
              </Link>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="lte-sidebar-close"
                aria-label="Tutup menu navigasi"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1">
              {navGroups.map((group) => (
                <div key={`sidebar-${group.id}`} className="lte-nav-group">
                  <div className="lte-nav-group-label flex items-center justify-between">
                    {group.label}
                    {group.locked ? (
                      <span className="lte-badge lte-badge-warning">
                        <Lock size={11} /> Terkunci
                      </span>
                    ) : null}
                  </div>
                  {group.items.map((item) => {
                    const isActive = item.href === '/portal' ? pathname === item.href : pathname.startsWith(item.href);
                    return (
                      <div
                        key={item.href}
                        className={`lte-nav-link ${isActive ? 'active' : ''} ${group.locked ? 'lte-nav-link-locked' : ''}`}
                      >
                        <Link
                          href={group.locked ? '/portal' : item.href}
                          onClick={() => setSidebarOpen(false)}
                          className="flex flex-1 items-center gap-3 min-w-0"
                        >
                          <span className="lte-nav-icon shrink-0">{item.icon}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate">{item.label}</span>
                            <span className={`mt-0.5 block truncate text-[11px] font-normal ${isActive ? 'text-blue-200/90' : 'text-gray-500'}`}>
                              {item.description}
                            </span>
                          </span>
                        </Link>
                        <Link
                          href={`/portal/help?ref=${item.docRef}`}
                          onClick={() => setSidebarOpen(false)}
                          className={`ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
                            isActive ? 'text-blue-200 hover:bg-white/10' : 'text-gray-500 hover:bg-white/10 hover:text-white'
                          }`}
                          title={`Buka panduan ${item.label}`}
                          aria-label={`Buka panduan ${item.label}`}
                        >
                          <HelpCircle size={15} />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ))}
            </nav>

            <div className="mt-auto">
              <div className="lte-sidebar-note">
                <p className="mb-1 font-bold uppercase tracking-widest text-[10px]">Informasi Penting</p>
                {hasStudentAccess
                  ? 'Akunmu sudah masuk tahap santri aktif. Gunakan fitur harian sesuai kebutuhan.'
                  : 'Mohon isikan data valid dan unggah dokumen asli hasil scan berwarna.'}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="lte-btn lte-btn-light mx-3 mb-4 w-[calc(100%-1.5rem)]"
              >
                <LogOut size={15} /> Keluar dari Portal
              </button>
            </div>
          </aside>

          {/* Backdrop for off-canvas sidebar */}
          {sidebarOpen ? (
            <div
              className="lte-sidebar-backdrop"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          ) : null}

          {/* Main area */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Topbar */}
            <header className="lte-topbar">
              <div className="flex min-w-0 items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setSidebarOpen((value) => !value)}
                  className="lte-btn lte-btn-outline-secondary lte-btn-sm lte-topbar-toggle"
                  aria-controls="portal-sidebar"
                  aria-expanded={sidebarOpen}
                  aria-label={sidebarOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
                >
                  <Menu size={15} /> Menu
                </button>
                <ul className="lte-breadcrumb list-none">
                  <li>
                    <Link href="/" className="inline-flex items-center gap-1">
                      <Home size={13} /> Beranda
                    </Link>
                  </li>
                  <li>Portal Wali Santri</li>
                  {isRaportPage ? <li>Raport Akademik</li> : null}
                </ul>
              </div>
              <div className="flex items-center gap-2">
                <span className="lte-topbar-user hidden sm:inline-flex">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                    {(user?.name || 'W').charAt(0)}
                  </span>
                  {user?.name || 'Santri'}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="lte-btn lte-btn-outline-danger lte-btn-sm"
                >
                  <LogOut size={14} /> Keluar
                </button>
              </div>
            </header>

            <main className="lte-content flex-1">
              {isRaportPage ? (
                <div className="space-y-4">
                  <div className="lte-card lte-card-outline">
                    <div className="lte-card-header">
                      <div className="flex items-center gap-3">
                        <GraduationCap className="text-emerald-600" size={22} />
                        <div>
                          <p className="lte-card-subtitle">Mode Fokus Raport Santri</p>
                          <h2 className="lte-card-title text-xl">Raport Akademik Santri</h2>
                        </div>
                      </div>
                      <Link href="/portal" className="lte-btn lte-btn-outline-secondary lte-btn-sm">
                        <ArrowLeft size={15} /> Kembali ke Dashboard
                      </Link>
                    </div>
                    <div className="lte-card-body">
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {navGroups.map((group) =>
                          group.items.map((item) => {
                            const isActive = item.href === '/portal' ? pathname === item.href : pathname.startsWith(item.href);
                            return (
                              <Link
                                key={item.href}
                                href={group.locked ? '/portal' : item.href}
                                className={`lte-btn lte-btn-sm ${isActive ? 'lte-btn-success' : 'lte-btn-outline-secondary'} ${group.locked ? 'opacity-60' : ''}`}
                              >
                                <span>{item.icon}</span>
                                {item.label}
                              </Link>
                            );
                          }),
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="lte-focus-box p-4 sm:p-6">{children}</div>
                </div>
              ) : (
                <>
                  {isLoading && !isPortalDashboard ? (
                    <div className="lte-alert lte-alert-info mb-4 flex items-center gap-3">
                      <RefreshCw size={16} className="animate-spin" />
                      Menyiapkan struktur portal sesuai status akunmu...
                    </div>
                  ) : null}

                  {!isLoading && !hasStudentAccess && isServicePath ? (
                    <div className="lte-alert lte-alert-warning">
                      <p className="lte-alert-title">Menu Belum Aktif</p>
                      <p className="mt-1">
                        Halaman ini belum bisa dibuka dari akun pendaftaran. Lengkapi biodata, dokumen, dan pembayaran
                        agar panitia bisa memproses statusmu.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link href="/portal" className="lte-btn lte-btn-warning lte-btn-sm">
                          Kembali ke Dashboard
                        </Link>
                        <Link href="/portal/documents" className="lte-btn lte-btn-outline-secondary lte-btn-sm">
                          Lanjutkan Kelengkapan Dokumen
                        </Link>
                      </div>
                    </div>
                  ) : (
                    children
                  )}
                </>
              )}
            </main>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <div className="fixed inset-x-0 bottom-4 z-[1000] px-4 md:hidden">
          {isLoading ? (
            <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur">
              <div className="grid grid-cols-5 gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={`mobile-bottom-tab-skeleton-${index}`} className="h-12 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            </div>
          ) : (
            <nav aria-label="Menu portal mobile" className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur">
              <div className="grid grid-cols-5 gap-1">
                {mobilePortalTabs.map((item) => {
                  if (item.locked) {
                    return (
                      <span
                        key={`mobile-bottom-tab-${item.href}`}
                        className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold text-slate-400"
                        title="Aktif setelah pendaftaran diterima"
                      >
                        <span className="text-slate-400">{item.icon}</span>
                        <span className="w-full truncate text-center">{item.label}</span>
                      </span>
                    );
                  }

                  return (
                    <Link
                      key={`mobile-bottom-tab-${item.href}`}
                      href={item.href}
                      className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold transition-colors ${
                        item.active ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                      }`}
                    >
                      <span className={item.active ? 'text-blue-700' : 'text-slate-400'}>{item.icon}</span>
                      <span className="w-full truncate text-center">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}