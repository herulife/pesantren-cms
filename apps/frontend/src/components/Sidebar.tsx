'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { getRoleMenuPermissions } from '@/lib/api';
import { ROLE_MENU_DEFS } from '@/lib/roleMenus';
import { Newspaper, LayoutDashboard, Settings, Bell, Users, Image as ImageIcon, Heart, Video, X, LogOut, Calendar, UserCheck, Building, MessageSquare, HelpCircle, GraduationCap, Layers, CreditCard, ScrollText, UserCog, Shield, FolderTree, ClipboardList, BookOpen, FileText, ChevronDown, Apple } from 'lucide-react';

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
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const { logout, hasRole, user } = useAuth();
  const [rolePerms, setRolePerms] = useState<Record<string, string[]>>({});

  useEffect(() => {
    getRoleMenuPermissions().then((parsed) => {
      setRolePerms(parsed);
    }).catch(()=>{});
  }, []);

  const ICONS: Record<string, React.ReactNode> = {
    '/admin': <LayoutDashboard size={18} />,
    '/admin/programs': <Layers size={18} />,
    '/admin/news': <Newspaper size={18} />,
    '/admin/agendas': <Calendar size={18} />,
    '/admin/gallery': <ImageIcon size={18} />,
    '/admin/videos': <Video size={18} />,
    '/admin/psb': <Users size={18} />,
    '/admin/raport': <GraduationCap size={18} />,
    '/admin/academics': <BookOpen size={18} />,
    '/admin/project': <FolderTree size={18} />,
    '/admin/teachers': <UserCheck size={18} />,
    '/admin/disciplines': <Shield size={18} />,
    '/admin/kesantrian': <ClipboardList size={18} />,
    '/admin/donations': <Heart size={18} />,
    '/admin/payments': <CreditCard size={18} />,
    '/admin/facilities': <Building size={18} />,
    '/admin/messages': <MessageSquare size={18} />,
    '/admin/notifications': <Bell size={18} />,
    '/admin/bgn': <Apple size={18} />,
    '/admin/users': <UserCog size={18} />,
    '/admin/logs': <ScrollText size={18} />,
    '/admin/settings': <Settings size={18} />,
    '/admin/help': <HelpCircle size={18} />,
  };

  // Daftar menu dari katalog bersama (lib/roleMenus) agar tidak drift
  // dengan checkbox Hak Akses di Manajemen Pengguna.
  const menuItems: MenuItem[] = ROLE_MENU_DEFS.map((d) => ({
    category: d.category,
    icon: ICONS[d.href] ?? <FileText size={18} />,
    label: d.label,
    href: d.href,
    roles: d.roles,
    docRef: d.docRef,
  }));

  // Filter menu: daftar tersimpan mengatur penuh per role (bisa tambah
  // maupun kurang dari standar). Tanpa simpanan -> pakai standar role.
  // Catatan: backend tetap menegakkan RequireRole, jadi menu yang diberi
  // di luar jatah role-nya akan tampil tapi API-nya menolak (403).
  const groupNames = Array.from(new Set(menuItems.map((item) => item.category)));
  const groups: Array<[string, typeof menuItems]> = groupNames.map((cat) => [
    cat,
    menuItems.filter((item) => item.category === cat),
  ]);

  const groupOfPath = (path: string) => {
    for (const [cat, items] of groups) {
      if (items.some((item) => {
      const base = item.href.split('?')[0];
      return item.href === '/admin' ? path === base : path.startsWith(base);
    })) {
        return cat;
      }
    }
    return null;
  };

  const [openCats, setOpenCats] = React.useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = window.localStorage.getItem('sidebar-cats');
      if (raw) return JSON.parse(raw) as Record<string, boolean>;
    } catch {
      // abaikan
    }
    const active = typeof window === 'undefined' ? null : groupOfPath(window.location.pathname);
    return active ? { [active]: true } : {};
  });

  React.useEffect(() => {
    const active = groupOfPath(pathname);
    if (active) {
      setOpenCats((prev) => (prev[active] ? prev : { ...prev, [active]: true }));
    }
  }, [pathname]);

  const toggleCat = (cat: string) => {
    setOpenCats((prev) => {
      const next = { ...prev, [cat]: !(prev[cat] ?? true) };
      try {
        window.localStorage.setItem('sidebar-cats', JSON.stringify(next));
      } catch {
        // abaikan
      }
      return next;
    });
  };

  const visibleItems = menuItems.filter(item => {
    if (!item.roles || item.roles.length === 0) return true;
    const role = user?.role;
    if (role === 'superadmin') return true;
    const saved = role ? rolePerms[role] : undefined;
    if (saved && Array.isArray(saved)) return saved.includes(item.href);
    return hasRole(...item.roles);
  });

  return (
    <aside className="flex h-full w-64 flex-col overflow-hidden rounded-[1.35rem] bg-gradient-to-b from-sky-950 via-slate-950 to-slate-950 text-slate-300 shadow-[0_24px_60px_rgba(2,6,23,0.45)] ring-1 ring-white/5">
      {/* Header */}
      <div className="h-[70px] flex items-center px-6 border-b border-sky-900/40 shrink-0">
         <div className="flex items-center gap-3 w-full">
            <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-black shadow-lg shadow-sky-950/30">A</div>
            <div className="min-w-0">
              <span className="block font-semibold text-[15px] text-white tracking-wide uppercase">Al-Maa</span>
              <span className="block text-[10px] uppercase tracking-[0.24em] text-sky-200/70">Panel Admin</span>
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
        {groups.map(([cat, items]) => {
          const shown = items.filter((item) => visibleItems.includes(item));
          if (shown.length === 0) return null;
          const isOpen = openCats[cat] ?? false;
          return (
            <div key={cat}>
              <button
                type="button"
                onClick={() => toggleCat(cat)}
                aria-expanded={isOpen}
                className="flex w-full cursor-pointer items-center justify-between px-3 pt-3 pb-1 text-left"
              >
                <p className="text-[9.5px] font-bold uppercase tracking-widest text-sky-200/40">
                  {cat}
                </p>
                <ChevronDown size={14} className={`text-sky-200/40 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
              </button>
              <div className={`sb-group-items${isOpen ? ' open' : ''}`}>
                <div className="sb-group-inner">
              {shown.map((item) => {
                const full = search ? `${pathname}?${search}` : pathname;
                const isActive = item.href === '/admin'
                  ? full === '/admin'
                  : item.href.includes('?')
                    ? full === item.href || full.startsWith(`${item.href}&`)
                    : pathname.startsWith(item.href);
                return (
              <div key={item.href} className={`flex items-center gap-2 rounded-lg transition-colors ${
                isActive ? 'bg-gradient-to-r from-sky-500/18 via-sky-400/8 to-transparent text-white relative shadow-inner' : 'hover:bg-white/5 hover:text-white'
              }`}>
                <Link href={item.href} onClick={onClose} aria-current={isActive ? 'page' : undefined} aria-label={item.label} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-1.5">
                  <div className={isActive ? 'text-sky-300' : 'text-slate-500'}>
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
                        ? 'text-sky-100 hover:bg-white/10 hover:text-white'
                        : 'text-slate-500 hover:bg-white/10 hover:text-sky-200'
                    }`}
                    title={`Buka tutorial ${item.label}`}
                    aria-label={`Buka tutorial ${item.label}`}
                >
                  <HelpCircle size={15} />
                </Link>
              )}

                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-400 rounded-r-md"></div>}
              </div>
                );
              })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-sky-900/35">
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
