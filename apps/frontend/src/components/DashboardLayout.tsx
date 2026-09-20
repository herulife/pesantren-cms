'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import FloatingQuickMenu from './FloatingQuickMenu';
import { useAuth } from './AuthProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="admin-panel-shell min-h-screen bg-slate-50 text-slate-800">
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:inset-y-3 lg:left-3 lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Suspense fallback={<div className="h-full w-64" aria-hidden="true" />}>
          <Sidebar onClose={() => setIsMobileSidebarOpen(false)} />
        </Suspense>
      </div>

      <div className="flex min-h-screen flex-col lg:pl-[17rem]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/85 px-4 shadow-sm backdrop-blur-md lg:mx-3 lg:mt-3 lg:rounded-xl lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Buka menu"
            >
              <Menu size={22} />
            </button>
            <div className="flex flex-col">
              <Link href="/admin" className="text-sm font-black uppercase tracking-[0.18em] text-sky-700">
                Dashboard
              </Link>
              <Link href="/" className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 transition-colors hover:text-sky-700">
                Lihat Website
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-700">{user?.name || 'Admin'}</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                {user?.role || 'staff'}
              </p>
            </div>
            <button
              type="button"
              className="rounded-full bg-sky-600 p-2 text-white lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-label="Tutup menu cepat"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <main className="ap-fade-in flex-1 p-4 lg:px-8 lg:pb-8 lg:pt-7">{children}</main>

        <FloatingQuickMenu />
      </div>
    </div>
  );
}
