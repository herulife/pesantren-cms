'use client';

import React, { useEffect, useState } from 'react';
import PublicLayout from '@/components/PublicLayout';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Upload, ArrowLeft, HelpCircle, LayoutDashboard, GraduationCap, Wallet, QrCode, RefreshCw, Lock, Home, Folder, MoreHorizontal, LogOut, CreditCard } from 'lucide-react';
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
  const { logout } = useAuth();
  const isRaportPage = pathname.startsWith('/portal/raport');
  const isPortalDashboard = pathname === '/portal';
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleLogout = () => {
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
      description: 'Lihat progres, status, dan langkah berikutnya.',
      icon: <LayoutDashboard size={20} />,
      docRef: 'dashboard',
    },
    {
      href: '/portal/biodata',
      label: 'Biodata Lengkap',
      description: 'Isi data calon santri dan data orang tua.',
      icon: <User size={20} />,
      docRef: 'biodata',
    },
    {
      href: '/portal/documents',
      label: 'Unggah Dokumen',
      description: 'Kirim KK, ijazah, raport, dan pas foto.',
      icon: <Upload size={20} />,
      docRef: 'documents',
    },
    {
      href: '/portal/payment',
      label: 'Bayar Pendaftaran',
      description: 'Upload bukti transfer biaya pendaftaran.',
      icon: <CreditCard size={20} />,
      docRef: 'dashboard',
    },
    {
      href: '/portal/help',
      label: 'Panduan Portal',
      description: 'Baca langkah penggunaan setiap menu portal.',
      icon: <HelpCircle size={20} />,
      docRef: 'dashboard',
    },
  ];

  const serviceItems: PortalNavItem[] = [
    {
      href: '/portal/raport',
      label: 'Raport Akademik',
      description: 'Lihat nilai, presensi, dan progres tahfidz.',
      icon: <GraduationCap size={20} />,
      docRef: 'academics',
    },
    {
      href: '/portal/wallet',
      label: 'Darussunnah Pay',
      description: 'Pantau saldo, PIN, dan mutasi transaksi.',
      icon: <Wallet size={20} />,
      docRef: 'dashboard',
    },
    {
      href: '/portal/exams',
      label: 'CBT & Ujian',
      description: 'Akses ujian online dan tes akademik.',
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
              ? 'Biodata, dokumen, dan pembayaran sudah lengkap. Pantau status review dari dasbor.'
              : biodataCompleted && documentsCompleted
                ? 'Berkas utama sudah lengkap. Lanjutkan pembayaran pendaftaran.'
              : 'Menu inti untuk melengkapi biodata dan dokumen.',
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
      <div className="bg-slate-50 min-h-screen py-8 lg:py-10">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <Home size={14} />
              Beranda
            </Link>
            <div className="flex items-center gap-2">
              <div className="bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm text-xs font-bold text-slate-600">
                 Portal Wali Santri
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white px-4 py-2 text-xs font-bold text-rose-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              >
                <LogOut size={14} />
                Keluar
              </button>
            </div>
          </div>

          {isRaportPage ? (
            <div className="space-y-6">
              <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
                <div className="border-b border-slate-100 px-5 py-5 lg:px-8">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-600">Mode Fokus</p>
                      <h2 className="mt-2 font-outfit text-2xl font-black uppercase tracking-tight text-slate-900 lg:text-3xl">
                        Raport Akademik Santri
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                        Halaman raport dibuat lebih lega agar nilai, presensi, dan progres tahfidz lebih nyaman dibaca.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:items-end">
                      <Link
                        href="/portal"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <ArrowLeft size={16} />
                        Kembali ke Dashboard Portal
                      </Link>
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                        Tampilan fokus tanpa sidebar samping
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-4 lg:px-6">
                  <div className="space-y-4">
                    {navGroups.map((group) => (
                      <div key={`focus-${group.id}`}>
                        <div className="mb-2 flex items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                            group.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {group.label}
                          </span>
                          {group.locked ? (
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
                              Terkunci
                            </span>
                          ) : null}
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-1">
                          {group.items.map((item) => {
                            const isActive = item.href === '/portal' ? pathname === item.href : pathname.startsWith(item.href);
                            return (
                              <Link
                                key={item.href}
                                href={group.locked ? '/portal' : item.href}
                                className={`inline-flex shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                                  isActive
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                } ${group.locked ? 'opacity-70' : ''}`}
                              >
                                <span className={isActive ? 'text-emerald-500' : 'text-slate-400'}>{item.icon}</span>
                                <span>{item.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/40 lg:p-6">
                {children}
              </div>
            </div>
          ) : (
          <div className="bg-white rounded-[2rem] lg:rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col md:flex-row">
            {/* Sidebar Portal */}
            <div className="hidden shrink-0 border-r border-slate-200 bg-slate-100 p-6 md:block md:w-72 md:border-b-0 lg:w-80 lg:p-8">
               <div className="mb-8">
                 <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-600">Navigasi Portal</p>
                 <h2 className="mt-2 text-2xl font-black text-slate-900 font-outfit tracking-tight">Portal Pendaftaran & Santri</h2>
                 <p className="mt-2 text-sm leading-relaxed text-slate-500">
                   Selesaikan pendaftaran, pantau status, dan buka menu yang tersedia dari satu tempat.
                 </p>
               </div>
               
               <div className="mb-6 grid gap-3">
                 {navGroups.map((group) => (
                   <div
                     key={group.id}
                     className={`rounded-[1.5rem] border px-4 py-4 transition ${
                       group.active
                         ? 'border-blue-200 bg-blue-50 text-blue-800'
                         : 'border-slate-200 bg-white text-slate-600'
                     }`}
                   >
                     <div className="flex items-center justify-between gap-3">
                       <div>
                         <p className="text-xs font-black uppercase tracking-[0.18em]">{group.label}</p>
                         <p className={`mt-1 text-xs leading-relaxed ${group.active ? 'text-blue-700/80' : 'text-slate-500'}`}>
                           {group.description}
                         </p>
                       </div>
                       {group.locked ? (
                         <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
                           <Lock size={12} />
                           Terkunci
                         </span>
                       ) : (
                         <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                           group.active ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-500'
                         }`}>
                           {group.active ? 'Aktif' : 'Tersedia'}
                         </span>
                       )}
                     </div>
                   </div>
                 ))}
               </div>

               <nav className="space-y-6">
                 {navGroups.map((group) => (
                   <div key={`sidebar-${group.id}`}>
                     <div className="mb-3 flex items-center justify-between">
                       <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{group.label}</p>
                       {group.locked ? (
                         <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">Aktif setelah diterima</span>
                       ) : null}
                     </div>
                     <div className="space-y-3">
                       {group.items.map((item) => {
                         const isActive = item.href === '/portal' ? pathname === item.href : pathname.startsWith(item.href);

                         return (
                           <div
                             key={item.href}
                             className={`flex items-center gap-2 rounded-2xl transition-all ${
                               isActive
                                 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                 : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                             } ${group.locked ? 'opacity-70' : ''}`}
                           >
                             <Link href={group.locked ? '/portal' : item.href} className="flex flex-1 items-center gap-4 p-4">
                               <span className={isActive ? 'text-blue-200' : 'text-slate-400'}>{item.icon}</span>
                               <div className="min-w-0">
                                 <div className="font-bold text-sm tracking-wide">{item.label}</div>
                                 <div className={`mt-1 text-xs leading-relaxed ${isActive ? 'text-blue-100/80' : 'text-slate-500'}`}>
                                   {item.description}
                                 </div>
                               </div>
                             </Link>
                             <Link
                               href={`/portal/help?ref=${item.docRef}`}
                               className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full transition ${
                                 isActive
                                   ? 'text-blue-100 hover:bg-white/10'
                                   : 'text-slate-400 hover:bg-slate-100 hover:text-blue-600'
                               }`}
                               title={`Buka panduan ${item.label}`}
                               aria-label={`Buka panduan ${item.label}`}
                             >
                               <HelpCircle size={16} />
                             </Link>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 ))}
               </nav>

               <div className="mt-12 p-5 bg-amber-50 rounded-3xl border border-amber-100">
                  <h4 className="font-black text-amber-900 text-xs uppercase tracking-widest mb-2">Informasi Penting</h4>
                  <p className="text-amber-800 text-xs leading-relaxed font-medium">
                    {hasStudentAccess
                      ? 'Akunmu sudah masuk tahap santri aktif. Gunakan fitur harian sesuai kebutuhan.'
                      : 'Mohon isikan data yang valid dan unggah dokumen asli hasil scan berwarna.'}
                  </p>
               </div>

               <button
                 type="button"
                 onClick={handleLogout}
                 className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm font-bold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
               >
                 <LogOut size={17} />
                 Keluar dari Portal
               </button>
            </div>

            {/* Content Area */}
            <div className="min-w-0 flex-1 p-5 pb-28 md:p-8 lg:p-10">
               {isLoading && !isPortalDashboard ? (
                 <div className="mb-6 flex items-center gap-3 rounded-[1.75rem] border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-500">
                   <RefreshCw size={16} className="animate-spin text-blue-600" />
                   Menyiapkan struktur portal sesuai status akunmu...
                 </div>
               ) : null}

               {!isLoading && !hasStudentAccess && isServicePath ? (
                 <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
                   <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-700">Menu Belum Aktif</p>
                   <h3 className="mt-2 font-outfit text-2xl font-black uppercase tracking-tight text-amber-950">
                     Selesaikan Pendaftaran Terlebih Dahulu
                   </h3>
                   <p className="mt-3 max-w-2xl text-sm leading-7 text-amber-900/80">
                     Halaman ini belum bisa dibuka dari akun pendaftaran. Lengkapi biodata, dokumen, dan pembayaran agar panitia bisa memproses statusmu.
                   </p>
                   <div className="mt-5 flex flex-wrap gap-3">
                     <Link
                       href="/portal"
                       className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-400"
                     >
                       Kembali ke Dashboard Pendaftaran
                     </Link>
                     <Link
                       href="/portal/documents"
                       className="inline-flex items-center justify-center rounded-2xl border border-amber-200 bg-white px-5 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                     >
                       Lanjutkan Kelengkapan Dokumen
                     </Link>
                   </div>
                 </div>
               ) : children}
            </div>
          </div>
          )}
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-4 z-[1000] px-4 md:hidden">
        {isLoading ? (
          <div className="mx-auto max-w-md rounded-[1.65rem] border border-slate-200 bg-white/95 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur">
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={`mobile-bottom-tab-skeleton-${index}`}
                  className="h-12 animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          </div>
        ) : (
          <nav
            aria-label="Menu portal mobile"
            className="mx-auto max-w-md rounded-[1.65rem] border border-slate-200 bg-white/95 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur"
          >
            <div className="grid grid-cols-5 gap-1">
              {mobilePortalTabs.map((item) => {
                if (item.locked) {
                  return (
                    <span
                      key={`mobile-bottom-tab-${item.href}`}
                      className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-bold text-slate-400"
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
                    className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-bold transition-all duration-300 ${
                      item.active
                        ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                    }`}
                  >
                    <span className={item.active ? 'text-emerald-700' : 'text-slate-400'}>{item.icon}</span>
                    <span className="w-full truncate text-center">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </PublicLayout>
  );
}
