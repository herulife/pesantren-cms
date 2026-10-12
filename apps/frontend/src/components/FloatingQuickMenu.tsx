'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ExternalLink, LayoutDashboard, LogIn, LogOut, UserPlus } from 'lucide-react';
import { useAuth } from './AuthProvider';
import UserAvatar from './UserAvatar'; // j70: foto profil, bukan inisial manual

export type FloatingQuickMenuItem = {
  href?: string;
  label: string;
  icon: ReactNode;
  className?: string;
  onClick?: () => void;
};

type Props = {
  anchor?: 'left' | 'right';
  desktop?: boolean;
  items?: FloatingQuickMenuItem[];
};

export default function FloatingQuickMenu({ anchor = 'right', desktop = false, items }: Props) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const lastY = useRef(0);
  const { user, logout } = useAuth();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function onScroll() {
      const y = window.scrollY;
      if (open) {
        lastY.current = y;
        return;
      }
      if (window.innerWidth >= 1024) {
        lastY.current = y;
        return;
      }
      if (y <= 60) {
        setHidden(false);
      } else if (y > lastY.current + 8) {
        setHidden(true);
      } else if (y < lastY.current - 8) {
        setHidden(false);
      }
      lastY.current = y;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [open]);

  const dashboardHref = user?.role === 'user' ? '/portal' : '/admin';
  const dashboardLabel = user?.role === 'user' ? 'Ke Portal' : 'Ke Admin';
  const pos = anchor === 'left' ? 'bottom-4 left-4 md:left-6' : 'bottom-4 right-4 md:right-6';

  const defaultItems: FloatingQuickMenuItem[] = user
    ? [
        {
          href: dashboardHref,
          label: dashboardLabel,
          icon: <LayoutDashboard size={17} />,
          className: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        },
        {
          href: '/',
          label: 'Lihat Website',
          icon: <ExternalLink size={17} />,
          className: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        },
        {
          label: 'Keluar',
          icon: <LogOut size={17} />,
          className: 'text-rose-600 hover:bg-rose-50',
          onClick: () => {
            setOpen(false);
            logout();
          },
        },
      ]
    : [
        {
          href: '/login',
          label: 'Login',
          icon: <LogIn size={17} />,
          className: 'text-sky-700 hover:bg-sky-50',
        },
        {
          href: '/register',
          label: 'Daftar Akun',
          icon: <UserPlus size={17} />,
          className: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        },
      ];

  const navItems = items && items.length > 0 ? items : defaultItems;

  return (
    <div
      ref={ref}
      className={`fixed z-40 flex flex-col ${desktop ? '' : 'lg:hidden'} ${pos} ${anchor === 'left' ? 'items-start' : 'items-end'} gap-3 transition-all duration-300 ${
        hidden && !open ? 'pointer-events-none translate-y-24 opacity-0' : ''
      }`}
    >
      {open && (
        <div className="w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
            <UserAvatar name={user?.name} photoUrl={user?.photo_url} size="h10" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800">{user?.name || 'Belum login'}</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {user?.role || 'pengunjung'}
              </p>
            </div>
          </div>
          <div className="flex flex-col p-1.5">
            {navItems.map((item) =>
              item.onClick ? (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => item.onClick?.()}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${item.className ?? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.label}
                  href={item.href ?? '#'}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${item.className ?? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ),
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label={user ? `Menu cepat ${user.name}` : 'Masuk'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-lg shadow-sky-700/30 ring-4 ring-white/40 transition-all duration-200 hover:scale-105 hover:shadow-sky-700/50 active:scale-95"
      >
        {user ? <UserAvatar name={user?.name} photoUrl={user?.photo_url} size="h14" /> : <LogIn size={24} />}
      </button>
    </div>
  );
}