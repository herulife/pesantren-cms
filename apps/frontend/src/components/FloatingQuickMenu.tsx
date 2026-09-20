'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, LayoutDashboard, LogIn, LogOut, UserPlus } from 'lucide-react';
import { useAuth } from './AuthProvider';

type Props = {
  anchor?: 'left' | 'right';
};

export default function FloatingQuickMenu({ anchor = 'right' }: Props) {
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

  const initial = (user?.name || 'A').trim().charAt(0).toUpperCase();
  const dashboardHref = user?.role === 'user' ? '/portal' : '/admin';
  const dashboardLabel = user?.role === 'user' ? 'Ke Portal' : 'Ke Admin';
  const pos = anchor === 'left' ? 'bottom-4 left-4 md:left-6' : 'bottom-4 right-4 md:right-6';

  return (
    <div
      ref={ref}
      className={`fixed z-40 flex flex-col lg:hidden ${pos} ${anchor === 'left' ? 'items-start' : 'items-end'} gap-3 transition-all duration-300 ${
        hidden && !open ? 'pointer-events-none translate-y-24 opacity-0' : ''
      }`}
    >
      {open && (
        <div className="w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-700 text-sm font-bold text-white">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800">{user?.name || 'Belum login'}</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {user?.role || 'pengunjung'}
              </p>
            </div>
          </div>
          <div className="flex flex-col p-1.5">
            {user ? (
              <>
                <Link
                  href={dashboardHref}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <LayoutDashboard size={17} />
                  {dashboardLabel}
                </Link>
                <Link
                  href="/"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <ExternalLink size={17} />
                  Lihat Website
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <LogOut size={17} />
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-50"
                >
                  <LogIn size={17} />
                  Login
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <UserPlus size={17} />
                  Daftar Akun
                </Link>
              </>
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
        {user ? <span className="text-base font-bold">{initial}</span> : <LogIn size={24} />}
      </button>
    </div>
  );
}