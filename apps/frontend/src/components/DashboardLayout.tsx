'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from './AuthProvider';
import { Bell, ChevronRight, Globe, HelpCircle, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getLogs, getMessages, getPayments, getRegistrations, type ActivityLog, type Message, type Payment, type Registration } from '@/lib/api';

type TopbarNotification = {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: 'danger' | 'warning' | 'info';
  createdAt?: string;
};

function formatNotificationTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<TopbarNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const { user } = useAuth();
  const notificationRef = useRef<HTMLDivElement | null>(null);

  const roleBadge: Record<string, string> = {
    superadmin: 'Super Admin',
    bendahara: 'Bendahara',
    panitia_psb: 'Panitia PSB',
    tim_media: 'Tim Media',
    admin: 'Admin',
    user: 'Pengguna',
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!notificationRef.current?.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsNotificationOpen(false);
  }, [pathname]);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user || user.role === 'user' || pathname.startsWith('/portal')) {
        setNotifications([]);
        return;
      }

      setIsLoadingNotifications(true);

      try {
        const nextNotifications: TopbarNotification[] = [];

        if (user.role === 'superadmin' || user.role === 'panitia_psb') {
          const [messages, registrations] = await Promise.all([
            getMessages({ isRead: false }),
            getRegistrations(),
          ]);

          messages.slice(0, 2).forEach((item: Message) => {
            nextNotifications.push({
              id: `message-${item.id}`,
              title: 'Pesan kontak baru',
              description: `${item.name} mengirim pesan dan belum dibaca.`,
              href: '/admin/messages',
              tone: 'info',
              createdAt: item.created_at,
            });
          });

          registrations
            .filter((item: Registration) => ['pending', 'review'].includes((item.status || '').toLowerCase()))
            .slice(0, 2)
            .forEach((item: Registration) => {
              nextNotifications.push({
                id: `psb-${item.id}`,
                title: 'Pendaftaran PSB perlu ditinjau',
                description: `${item.full_name} masih berstatus ${item.status}.`,
                href: '/admin/psb',
                tone: 'warning',
                createdAt: item.created_at,
              });
            });
        }

        if (user.role === 'superadmin' || user.role === 'bendahara') {
          const payments = await getPayments();
          payments
            .filter((item: Payment) => ['pending', 'failed'].includes((item.status || '').toLowerCase()))
            .slice(0, 2)
            .forEach((item: Payment) => {
              nextNotifications.push({
                id: `payment-${item.id}`,
                title: item.status?.toLowerCase() === 'failed' ? 'Pembayaran gagal' : 'Pembayaran menunggu verifikasi',
                description: `${item.user_name || 'Santri'} - ${item.description || 'Pembayaran'}.`,
                href: '/admin/payments',
                tone: item.status?.toLowerCase() === 'failed' ? 'danger' : 'warning',
                createdAt: item.created_at || item.payment_date,
              });
            });
        }

        if (user.role === 'superadmin') {
          const logs = await getLogs('SEND_WA');
          logs
            .filter((item: ActivityLog) => /gagal|error|failed/i.test(item.details || ''))
            .slice(0, 2)
            .forEach((item: ActivityLog) => {
              nextNotifications.push({
                id: `log-${item.id}`,
                title: 'Pengiriman WhatsApp gagal',
                description: item.details || 'Ada pengiriman WhatsApp yang perlu dicek.',
                href: '/admin/notifications',
                tone: 'danger',
                createdAt: item.created_at,
              });
            });
        }

        nextNotifications.sort((a, b) => {
          const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
          const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
          return bTime - aTime;
        });

        setNotifications(nextNotifications.slice(0, 6));
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    void loadNotifications();
  }, [pathname, user]);

  const unreadCount = notifications.length;
  const notificationTarget = useMemo(() => {
    if (user?.role === 'bendahara') return '/admin/notifications';
    if (user?.role === 'panitia_psb') return '/admin/psb';
    if (user?.role === 'tim_media') return '/admin/news';
    return '/admin/notifications';
  }, [user?.role]);

  const toneStyles: Record<TopbarNotification['tone'], string> = {
    danger: 'border-rose-100 bg-rose-50 text-rose-700',
    warning: 'border-amber-100 bg-amber-50 text-amber-700',
    info: 'border-sky-100 bg-sky-50 text-sky-700',
  };

  return (
    <div className="admin-panel-shell min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(180deg,#f8faf7_0%,#f1f5f2_100%)] flex font-sans selection:bg-emerald-600 selection:text-white relative overflow-hidden text-slate-800">
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 lg:relative lg:z-10 transform transition-all duration-300 ease-in-out shrink-0
        ${isMobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'} 
        ${isDesktopSidebarCollapsed ? 'lg:-ml-64' : 'lg:translate-x-0 lg:ml-0'}
      `}>
        <Sidebar onClose={() => setIsMobileSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-[70px] bg-white flex items-center justify-between px-6 shrink-0 z-30 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] border-b border-slate-100">
           {/* Left side actions */}
           <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={() => setIsMobileSidebarOpen(true)}
                aria-label="Buka menu mobile"
                className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors lg:hidden"
              >
                <Menu size={24} />
              </button>

              <button 
                onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
                className="hidden lg:flex p-2 -ml-2 rounded-xl text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                title="Toggle Sidebar"
              >
                <Menu size={20} />
              </button>

              <a 
                 href="/" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="flex items-center gap-2 px-4 py-2 bg-white/80 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl text-sm font-semibold transition-colors border border-slate-200"
              >
                 <Globe size={16} />
                 <span className="hidden sm:block">Lihat Website</span>
              </a>
           </div>

           {/* Right side user profile */}
           <div className="flex items-center gap-5">
               <Link 
                  href={`/admin/help?ref=${pathname.split('/')[2] || 'dashboard'}`} 
                  className="text-slate-400 hover:text-emerald-700 transition-colors relative" 
                  title="Bantuan & Panduan"
               >
                  <HelpCircle size={20} />
               </Link>

               <div className="relative" ref={notificationRef}>
                 <button
                    type="button"
                    onClick={() => setIsNotificationOpen((prev) => !prev)}
                    className="text-slate-400 hover:text-emerald-700 transition-colors relative"
                    aria-label="Buka notifikasi"
                 >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[18px] rounded-full border-2 border-white bg-rose-500 px-1 text-center text-[10px] font-black leading-4 text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                 </button>

                 {isNotificationOpen && (
                   <div className="absolute right-0 top-10 z-50 w-[360px] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                     <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Notifikasi</p>
                         <h4 className="mt-1 text-sm font-black text-slate-900">Pusat perhatian cepat</h4>
                       </div>
                       <Link href={notificationTarget} className="text-xs font-black text-emerald-700 hover:text-emerald-800">
                         Lihat semua
                       </Link>
                     </div>

                     <div className="max-h-[420px] overflow-y-auto p-3">
                       {isLoadingNotifications ? (
                         <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-500">
                           Memuat notifikasi...
                         </div>
                       ) : notifications.length === 0 ? (
                         <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                           Belum ada notifikasi penting untuk saat ini.
                         </div>
                       ) : (
                         <div className="space-y-2">
                           {notifications.map((item) => (
                             <Link
                               key={item.id}
                               href={item.href}
                               className="block rounded-2xl border border-slate-100 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"
                             >
                               <div className="flex items-start justify-between gap-3">
                                 <div className="min-w-0">
                                   <div className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${toneStyles[item.tone]}`}>
                                     {item.tone === 'danger' ? 'Penting' : item.tone === 'warning' ? 'Perlu Ditinjau' : 'Info'}
                                   </div>
                                   <p className="mt-3 text-sm font-black text-slate-900">{item.title}</p>
                                   <p className="mt-1 text-sm leading-5 text-slate-500">{item.description}</p>
                                   {item.createdAt && (
                                     <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                       {formatNotificationTime(item.createdAt)}
                                     </p>
                                   )}
                                 </div>
                                 <ChevronRight size={16} className="mt-1 shrink-0 text-slate-300" />
                               </div>
                             </Link>
                           ))}
                         </div>
                       )}
                     </div>
                   </div>
                 )}
               </div>
               
               <div className="flex items-center gap-3 pl-5 border-l border-slate-200">
                   <div className="hidden sm:block text-right">
                       <p className="text-[13px] font-semibold text-slate-600 leading-none">{user?.name || 'Admin'}</p>
                       <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5">{roleBadge[user?.role || 'admin'] || user?.role}</p>
                   </div>
                   <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-emerald-600/20">
                       {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                   </div>
               </div>
           </div>
        </header>

        {/* Area konten dashboard */}
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
