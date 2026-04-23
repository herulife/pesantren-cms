'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { Newspaper, LayoutDashboard, Settings, Bell, Users, Image as ImageIcon, Heart, Video, X, LogOut, Calendar, UserCheck, Building, MessageSquare, HelpCircle, GraduationCap, Layers, CreditCard, ScrollText, UserCog, Shield } from 'lucide-react';

interface MenuItem {
  category: string;
  icon: React.ReactNode;
  label: string;
  href: string;
  roles?: string[]; // if empty, accessible by all staff
  docRef?: string;
}

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { logout, hasRole } = useAuth();

  const menuItems: MenuItem[] = [
    { category: 'Utama', icon: <LayoutDashboard size={18} />, label: "Dashboard Utama", href: "/admin", docRef: 'dashboard' },
    
    // Publikasi
    { category: 'Konten & Publikasi', icon: <Newspaper size={18} />, label: "Berita", href: "/admin/news", roles: ["tim_media"], docRef: 'news' },
    { category: 'Konten & Publikasi', icon: <Layers size={18} />, label: "Program Pondok", href: "/admin/programs", roles: ["tim_media"], docRef: 'programs' },
    { category: 'Konten & Publikasi', icon: <Calendar size={18} />, label: "Agenda Kegiatan", href: "/admin/agendas", docRef: 'agendas' },
    { category: 'Konten & Publikasi', icon: <ImageIcon size={18} />, label: "Galeri Foto", href: "/admin/gallery", roles: ["tim_media"], docRef: 'gallery' },
    { category: 'Konten & Publikasi', icon: <Video size={18} />, label: "Video Kegiatan", href: "/admin/videos", roles: ["tim_media"], docRef: 'videos' },
    
    // Akademik & Kesantrian
    { category: 'Kesantrian', icon: <Users size={18} />, label: "Data Santri (PSB)", href: "/admin/psb", roles: ["panitia_psb"], docRef: 'psb' },
    { category: 'Kesantrian', icon: <GraduationCap size={18} />, label: "eRapor", href: "/admin/academics", roles: ["bendahara"], docRef: 'academics' },
    { category: 'Kesantrian', icon: <UserCheck size={18} />, label: "Staf Pengajar", href: "/admin/teachers", roles: ["tim_media"], docRef: 'teachers' },
    { category: 'Kesantrian', icon: <Shield size={18} />, label: "Kedisiplinan", href: "/admin/disciplines", roles: ["panitia_psb"], docRef: 'disciplines' },
    
    // Keuangan & Donasi
    { category: 'Keuangan', icon: <Heart size={18} />, label: "Program Donasi", href: "/admin/donations", roles: ["bendahara"], docRef: 'donations' },
    { category: 'Keuangan', icon: <CreditCard size={18} />, label: "Pembayaran SPP", href: "/admin/payments", roles: ["bendahara"], docRef: 'payments' },
    
    // Institusi & Layanan
    { category: 'Layanan', icon: <Building size={18} />, label: "Fasilitas Publik", href: "/admin/facilities", roles: ["tim_media"], docRef: 'facilities' },
    { category: 'Layanan', icon: <MessageSquare size={18} />, label: "Pesan & Inbox", href: "/admin/messages", roles: ["panitia_psb"], docRef: 'messages' },
    
    // Sistem
    { category: 'Sistem', icon: <Bell size={18} />, label: "Notifikasi WA", href: "/admin/notifications", roles: ["bendahara"], docRef: 'notifications' },
    { category: 'Sistem', icon: <UserCog size={18} />, label: "Manajemen Pengguna", href: "/admin/users", roles: ["superadmin"], docRef: 'users' },
    { category: 'Sistem', icon: <ScrollText size={18} />, label: "Log Sistem", href: "/admin/logs", roles: ["superadmin"], docRef: 'logs' },
    { category: 'Sistem', icon: <Settings size={18} />, label: "Pengaturan Utama", href: "/admin/settings", roles: ["superadmin"], docRef: 'settings' },
    { category: 'Sistem', icon: <HelpCircle size={18} />, label: "Bantuan", href: "/admin/help" },
  ];

  // Filter by role
  const visibleItems = menuItems.filter(item => {
    if (!item.roles || item.roles.length === 0) return true; // accessible by all
    return hasRole(...item.roles);
  });

  return (
    <aside className="w-64 bg-gradient-to-b from-emerald-950 via-slate-950 to-slate-950 text-slate-300 flex flex-col h-screen sticky top-0 shadow-[0_24px_60px_rgba(2,6,23,0.45)] z-50">
      {/* Header */}
      <div className="h-[70px] flex items-center px-6 border-b border-emerald-900/40 shrink-0">
         <div className="flex items-center gap-3 w-full">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-950/30">D</div>
            <div className="min-w-0">
              <span className="block font-semibold text-[15px] text-white tracking-wide uppercase">Darussunnah</span>
              <span className="block text-[10px] uppercase tracking-[0.24em] text-emerald-200/70">Panel Pondok</span>
            </div>
            
            <button 
              onClick={onClose}
              className="lg:hidden ml-auto p-1.5 bg-white/5 rounded-md text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
         </div>
      </div>

      {/* Navigation */}
      <nav 
        className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style dangerouslySetInnerHTML={{__html: `nav::-webkit-scrollbar { display: none; }`}} />
        {visibleItems.map((item, index) => {
          const isActive = item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href);
          const showCategory = index === 0 || visibleItems[index - 1].category !== item.category;

          return (
            <React.Fragment key={item.href}>
              {showCategory && item.category !== 'Utama' && (
                <div className="px-3 pt-3 pb-1">
                  <p className="text-[9.5px] font-bold uppercase tracking-widest text-emerald-200/40">
                    {item.category}
                  </p>
                </div>
              )}
              <div className={`flex items-center gap-2 rounded-lg transition-colors ${
                isActive ? 'bg-gradient-to-r from-emerald-500/18 via-emerald-400/8 to-transparent text-white relative shadow-inner' : 'hover:bg-white/5 hover:text-white'
              }`}>
                <Link href={item.href} onClick={onClose} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-1.5">
                  <div className={isActive ? 'text-emerald-300' : 'text-slate-500'}>
                    {item.icon}
                  </div>
                  <span className={`truncate text-[12.5px] ${isActive ? 'font-medium' : ''}`}>{item.label}</span>
                </Link>

                {item.docRef && (
                  <Link
                    href={`/admin/help?ref=${item.docRef}`}
                    onClick={onClose}
                    className={`mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition ${
                      isActive
                        ? 'text-emerald-100 hover:bg-white/10 hover:text-white'
                        : 'text-slate-500 hover:bg-white/10 hover:text-emerald-200'
                    }`}
                    title={`Buka dokumentasi ${item.label}`}
                    aria-label={`Buka dokumentasi ${item.label}`}
                >
                  <HelpCircle size={15} />
                </Link>
              )}

                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 rounded-r-md"></div>}
              </div>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-emerald-900/35">
         <button 
           onClick={() => {
             logout();
             onClose?.();
           }}
           className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-rose-300 transition-colors"
         >
            <LogOut size={20} />
            <span className="text-[13.5px]">Keluar</span>
         </button>
      </div>
    </aside>
  );
}
