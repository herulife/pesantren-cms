'use client';

import React from 'react';
import PublicLayout from '@/components/PublicLayout';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Upload, ArrowLeft, HelpCircle, LayoutDashboard, GraduationCap } from 'lucide-react';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRaportPage = pathname.startsWith('/portal/raport');

  const navItems = [
    {
      href: '/portal',
      label: 'Dashboard Portal',
      description: 'Lihat progres, tugas, QR, dan dompet santri.',
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
      href: '/portal/raport',
      label: 'Raport Akademik',
      description: 'Lihat nilai, presensi, dan progres tahfidz.',
      icon: <GraduationCap size={20} />,
      docRef: 'academics',
    },
    {
      href: '/portal/help',
      label: 'Panduan Portal',
      description: 'Baca langkah penggunaan setiap menu portal.',
      icon: <HelpCircle size={20} />,
      docRef: 'dashboard',
    },
  ];

  return (
    <PublicLayout>
      <div className="bg-slate-50 min-h-screen py-8 lg:py-10">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-500 font-bold hover:text-blue-600 transition-colors text-sm">
              <ArrowLeft size={16} /> Kembali ke Beranda
            </Link>
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
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {navItems.map((item) => {
                      const isActive = item.href === '/portal' ? pathname === item.href : pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`inline-flex shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                            isActive
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span className={isActive ? 'text-emerald-500' : 'text-slate-400'}>{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
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
                 <h2 className="mt-2 text-2xl font-black text-slate-900 font-outfit tracking-tight">Menu Portal Santri</h2>
                 <p className="mt-2 text-sm leading-relaxed text-slate-500">
                   Pilih menu sesuai kebutuhanmu. Mulai dari dashboard untuk melihat progres dan arah langkah berikutnya.
                 </p>
               </div>
               
               <nav className="space-y-3">
                 {navItems.map((item) => {
                   const isActive = item.href === '/portal' ? pathname === item.href : pathname.startsWith(item.href);

                   return (
                     <div
                       key={item.href}
                       className={`flex items-center gap-2 rounded-2xl transition-all ${
                         isActive
                           ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                           : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                       }`}
                     >
                       <Link href={item.href} className="flex flex-1 items-center gap-4 p-4">
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
               </nav>

               <div className="mt-12 p-5 bg-amber-50 rounded-3xl border border-amber-100">
                  <h4 className="font-black text-amber-900 text-xs uppercase tracking-widest mb-2">Informasi Penting</h4>
                  <p className="text-amber-800 text-xs leading-relaxed font-medium">Mohon isikan data yang valid dan unggah dokumen asli hasil scan berwarna. Berkas yang tidak sesuai dapat menggugurkan pendaftaran.</p>
               </div>
            </div>

            {/* Content Area */}
            <div className="min-w-0 flex-1 p-5 md:p-8 lg:p-10">
               <div className="mb-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 md:hidden">
                 <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Menu Cepat</p>
                 <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                   {navItems.map((item) => {
                     const isActive = item.href === '/portal' ? pathname === item.href : pathname.startsWith(item.href);
                     return (
                       <Link
                         key={`mobile-${item.href}`}
                         href={item.href}
                         className={`inline-flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                           isActive
                             ? 'border-blue-200 bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                             : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                         }`}
                       >
                         <span className={isActive ? 'text-blue-100' : 'text-slate-400'}>{item.icon}</span>
                         <span>{item.label}</span>
                       </Link>
                     );
                   })}
                 </div>
               </div>
               {children}
            </div>
          </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
