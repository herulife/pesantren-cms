'use client';

import React, { useEffect, useState } from 'react';
import PublicLayout from '@/components/PublicLayout';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Upload, ArrowLeft, HelpCircle, LayoutDashboard, GraduationCap, Wallet, QrCode, RefreshCw, Lock } from 'lucide-react';
import { getMyPSBRegistration, type Registration } from '@/lib/api';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRaportPage = pathname.startsWith('/portal/raport');
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileNavTab, setMobileNavTab] = useState<'registration' | 'services'>(pathname.startsWith('/portal/raport') || pathname.startsWith('/portal/wallet') || pathname.startsWith('/portal/exams') ? 'services' : 'registration');

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

  useEffect(() => {
    setMobileNavTab(isServicePath ? 'services' : 'registration');
  }, [isServicePath]);

  const registrationItems = [
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
      href: '/portal/help',
      label: 'Panduan Portal',
      description: 'Baca langkah penggunaan setiap menu portal.',
      icon: <HelpCircle size={20} />,
      docRef: 'dashboard',
    },
  ];

  const serviceItems = [
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

  const navGroups = [
    {
      id: 'registration',
      label: 'Pendaftaran',
      description: 'Menu inti untuk calon santri sampai proses diterima.',
      active: !isServicePath,
      items: registrationItems,
    },
    {
      id: 'services',
      label: 'Layanan Santri',
      description: hasStudentAccess
        ? 'Menu aktif setelah pendaftaran diterima.'
        : 'Aktif setelah pendaftaran kamu diterima sebagai santri.',
      active: isServicePath,
      items: serviceItems,
      locked: !hasStudentAccess,
    },
  ];

  const activeMobileGroup = navGroups.find((group) => group.id === mobileNavTab) || navGroups[0];

  return (
    <PublicLayout>
      <div className="bg-slate-50 min-h-screen py-8 lg:py-10">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-6 flex justify-end">
            <div className="bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm text-xs font-bold text-slate-600">
               Portal Wali Santri
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
            <div className="w-full md:w-72 lg:w-80 bg-slate-100 p-6 lg:p-8 border-b md:border-b-0 md:border-r border-slate-200 shrink-0">
               <div className="mb-8">
                 <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-600">Navigasi Portal</p>
                 <h2 className="mt-2 text-2xl font-black text-slate-900 font-outfit tracking-tight">Portal Pendaftaran & Santri</h2>
                 <p className="mt-2 text-sm leading-relaxed text-slate-500">
                   Portal dibagi dua tahap: pendaftaran untuk calon santri, lalu layanan santri setelah status diterima.
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
                      ? 'Akunmu sudah masuk tahap santri aktif. Gunakan menu layanan santri untuk presensi, dompet, raport, dan ujian.'
                      : 'Mohon isikan data yang valid dan unggah dokumen asli hasil scan berwarna. Menu layanan santri akan aktif setelah pendaftaran diterima.'}
                  </p>
               </div>
            </div>

            {/* Content Area */}
            <div className="min-w-0 flex-1 p-5 md:p-8 lg:p-10">
               {isLoading ? (
                 <div className="mb-6 flex items-center gap-3 rounded-[1.75rem] border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-500">
                   <RefreshCw size={16} className="animate-spin text-blue-600" />
                   Menyiapkan struktur portal sesuai status akunmu...
                 </div>
               ) : null}

               <div className="mb-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 md:hidden">
                 <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Menu Cepat</p>
                 <div className="mt-3">
                   <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-1">
                     {navGroups.map((group) => {
                       const isActive = mobileNavTab === group.id;
                       return (
                         <button
                           key={`mobile-tab-${group.id}`}
                           type="button"
                           onClick={() => setMobileNavTab(group.id as 'registration' | 'services')}
                           className={`rounded-[1rem] px-3 py-3 text-left text-xs font-black uppercase tracking-[0.18em] transition ${
                             isActive
                               ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                               : 'bg-white text-slate-500'
                           }`}
                         >
                           <div>{group.label}</div>
                           <div className={`mt-1 text-[9px] font-bold normal-case tracking-normal ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                             {group.locked ? 'Aktif setelah diterima' : 'Siap dipakai'}
                           </div>
                         </button>
                       );
                     })}
                   </div>

                   <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white p-4">
                     <div className="mb-3 flex items-start justify-between gap-3">
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{activeMobileGroup.label}</p>
                         <p className="mt-1 text-xs leading-relaxed text-slate-500">{activeMobileGroup.description}</p>
                       </div>
                       {activeMobileGroup.locked ? (
                         <span className="rounded-full bg-amber-100 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-amber-700">
                           Terkunci
                         </span>
                       ) : null}
                     </div>

                     {activeMobileGroup.locked ? (
                       <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4">
                         <div className="flex items-start gap-3">
                           <div className="rounded-2xl bg-amber-100 p-2 text-amber-700">
                             <Lock size={18} />
                           </div>
                           <div>
                             <p className="text-sm font-bold text-amber-950">Menu ini belum aktif untuk akunmu</p>
                             <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
                               Supaya tidak membingungkan, layanan santri baru dibuka setelah pendaftaran diterima. Untuk sekarang, fokuskan dulu ke biodata dan dokumen.
                             </p>
                           </div>
                         </div>

                         <div className="mt-4 flex flex-wrap gap-2">
                           {activeMobileGroup.items.map((item) => (
                             <span
                               key={`mobile-locked-${item.href}`}
                               className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-amber-800"
                             >
                               <span className="text-amber-600">{item.icon}</span>
                               <span>{item.label}</span>
                             </span>
                           ))}
                         </div>

                         <Link
                           href="/portal/documents"
                           className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-amber-500 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-amber-400"
                         >
                           Lanjutkan Pendaftaran Dulu
                         </Link>
                       </div>
                     ) : (
                       <div className="space-y-3">
                         {activeMobileGroup.items.map((item) => {
                           const isActive = item.href === '/portal' ? pathname === item.href : pathname.startsWith(item.href);
                           return (
                             <Link
                               key={`mobile-${item.href}`}
                               href={item.href}
                               className={`flex items-center gap-3 rounded-[1.25rem] border px-4 py-4 transition ${
                                 isActive
                                   ? 'border-blue-200 bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                   : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                               }`}
                             >
                               <span className={isActive ? 'text-blue-100' : 'text-slate-400'}>{item.icon}</span>
                               <div className="min-w-0">
                                 <div className="text-sm font-bold">{item.label}</div>
                                 <div className={`mt-1 text-xs leading-relaxed ${isActive ? 'text-blue-100/80' : 'text-slate-500'}`}>
                                   {item.description}
                                 </div>
                               </div>
                             </Link>
                           );
                         })}
                       </div>
                     )}
                   </div>
                 </div>
               </div>

               {!isLoading && !hasStudentAccess && isServicePath ? (
                 <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
                   <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-700">Layanan Santri Belum Aktif</p>
                   <h3 className="mt-2 font-outfit text-2xl font-black uppercase tracking-tight text-amber-950">
                     Menu Ini Baru Aktif Setelah Pendaftaran Diterima
                   </h3>
                   <p className="mt-3 max-w-2xl text-sm leading-7 text-amber-900/80">
                     Untuk saat ini, fokuskan dulu ke kelengkapan biodata, dokumen, dan status pendaftaran. Setelah statusmu diterima sebagai santri,
                     menu raport, dompet, presensi, dan ujian akan dibuka penuh.
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
    </PublicLayout>
  );
}
