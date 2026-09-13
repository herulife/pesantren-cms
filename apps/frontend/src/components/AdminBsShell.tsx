'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

const LTE_CSS = 'https://cdn.jsdelivr.net/npm/admin-lte@4.9.1/dist/css/adminlte.min.css';
const BS_CSS = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css';
const BS_ICONS = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css';
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';

export function LteCss() {
  useEffect(() => {
    const add = (id: string, href: string) => {
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    };
    add('admin-bs-css', BS_CSS);
    add('admin-bs-icons', BS_ICONS);
    add('admin-bs-font', FONT_CSS);
    add('admin-lte-css', LTE_CSS);
    document.body.classList.add('admin-bs', 'layout-fixed', 'sidebar-expand-lg', 'sidebar-mini', 'text-sm');
    return () => {
      document.body.classList.remove('admin-bs', 'layout-fixed', 'sidebar-expand-lg', 'sidebar-mini', 'text-sm');
    };
  }, []);
  return null;
}

type MenuItem = { label: string; href: string; icon: string; roles?: string[] };
type MenuGroup = { heading: string; items: MenuItem[] };

const MENU: MenuGroup[] = [
  { heading: 'Overview', items: [{ label: 'Dashboard', href: '/admin-bs', icon: 'bi-speedometer2' }] },
  {
    heading: 'Data Master',
    items: [
      { label: 'Data Pegawai', href: '/admin-bs/pegawai', icon: 'bi-person-badge', roles: ['superadmin', 'admin'] },
      { label: 'Data Kelas', href: '/admin-bs/kelas', icon: 'bi-collection', roles: ['superadmin', 'admin', 'panitia_psb'] },
      { label: 'Data Siswa', href: '/admin-bs/siswa', icon: 'bi-people', roles: ['superadmin', 'admin', 'panitia_psb'] },
      { label: 'Set Kelas', href: '/admin-bs/set-kelas', icon: 'bi-arrow-left-right', roles: ['superadmin', 'admin', 'panitia_psb'] },
    ],
  },
  {
    heading: 'Operasional',
    items: [
      { label: 'Generate SPP', href: '/admin-bs/tagihan-spp', icon: 'bi-receipt', roles: ['superadmin', 'bendahara'] },
      { label: 'Generate Iuran', href: '/admin-bs/tagihan-iuran', icon: 'bi-receipt-cutoff', roles: ['superadmin', 'bendahara'] },
      { label: 'Pembayaran', href: '/admin-bs/pembayaran', icon: 'bi-cash-coin', roles: ['superadmin', 'bendahara'] },
      { label: 'Data Donatur', href: '/admin-bs/donatur', icon: 'bi-heart', roles: ['superadmin', 'bendahara'] },
      { label: 'Transaksi Donasi', href: '/admin-bs/donasi', icon: 'bi-gift', roles: ['superadmin', 'bendahara'] },
      { label: 'Kas Masuk / Keluar', href: '/admin-bs/kas', icon: 'bi-wallet2', roles: ['superadmin', 'bendahara'] },
      { label: 'Kategori Kas', href: '/admin-bs/kas-kategori', icon: 'bi-tags', roles: ['superadmin', 'bendahara'] },
      { label: 'Absensi Guru', href: '/admin-bs/absensi', icon: 'bi-calendar-check', roles: ['superadmin', 'admin'] },
      { label: 'Raw Log & Sync', href: '/admin-bs/absensi?tab=rawlog', icon: 'bi-hdd-network', roles: ['superadmin', 'admin'] },
    ],
  },
  {
    heading: 'Reporting',
    items: [
      { label: 'Lap. Per Guru', href: '/admin-bs/lap-guru', icon: 'bi-person-lines-fill', roles: ['superadmin', 'admin', 'bendahara'] },
      { label: 'Lap. Rekap Absen', href: '/admin-bs/lap-guru?tab=rekap', icon: 'bi-bar-chart', roles: ['superadmin', 'admin', 'bendahara'] },
      { label: 'Lap. Transaksi', href: '/admin-bs/lap-transaksi', icon: 'bi-journal-text', roles: ['superadmin', 'bendahara'] },
      { label: 'Lap. Tagihan', href: '/admin-bs/lap-tagihan', icon: 'bi-journal-check', roles: ['superadmin', 'bendahara'] },
      { label: 'Lap. Laba / Rugi', href: '/admin-bs/lap-laba-rugi', icon: 'bi-graph-up', roles: ['superadmin', 'bendahara'] },
    ],
  },
  {
    heading: 'Tools',
    items: [
      { label: 'Manajemen User', href: '/admin-bs/users', icon: 'bi-people-fill', roles: ['superadmin'] },
      { label: 'Tahun Ajaran', href: '/admin-bs/tahun-ajaran', icon: 'bi-calendar-range', roles: ['superadmin', 'admin'] },
      { label: 'Pengaturan', href: '/admin/settings', icon: 'bi-gear' },
      { label: 'Back to Glass', href: '/admin', icon: 'bi-arrow-left-circle' },
    ],
  },
];

export default function AdminBsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      const raw = window.localStorage.getItem('adminbs-groups');
      if (raw) return JSON.parse(raw) as Record<string, boolean>;
    } catch {
      // abaikan
    }
    return {};
  });

  const toggleGroup = (heading: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [heading]: !(prev[heading] ?? true) };
      try {
        window.localStorage.setItem('adminbs-groups', JSON.stringify(next));
      } catch {
        // abaikan
      }
      return next;
    });
  };

  const can = (roles?: string[]) => {
    if (!roles || roles.length === 0) return true;
    if (user?.role === 'superadmin') return true;
    return !!user?.role && roles.includes(user.role);
  };

  return (
    <div className={`app-wrapper${collapsed ? ' sidebar-collapse' : ''}${mobileOpen ? ' sidebar-open' : ''}`}>
      <LteCss />
      <nav className="app-header navbar navbar-expand bg-body">
        <div className="container-fluid">
          <ul className="navbar-nav">
            <li className="nav-item">
              <button type="button" className="nav-link" onClick={() => setCollapsed((v) => !v)} aria-label="Toggle sidebar">
                <i className="bi bi-list" />
              </button>
            </li>
          </ul>
          <ul className="navbar-nav ms-auto">
            <li className="nav-item d-none d-md-flex align-items-center">
              <span className="navbar-text">
                {user?.name || 'Admin'} ({user?.role || '-'})
              </span>
            </li>
            <li className="nav-item ms-2">
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => logout()}>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <aside className="app-sidebar bg-body-secondary shadow" data-bs-theme="dark">
        <div className="sidebar-brand">
          <Link href="/admin-bs" className="brand-link" onClick={() => setMobileOpen(false)}>
            <span className="brand-text fw-light">SIMKS Al-Maa</span>
          </Link>
        </div>
        <div className="sidebar-wrapper">
          <nav className="mt-2">
            <ul className="nav sidebar-menu flex-column" role="menu" onClick={() => setMobileOpen(false)}>
              {MENU.map((g) => {
                const items = g.items.filter((it) => can(it.roles));
                if (items.length === 0) return null;
                const hasActive = items.some((it) => pathname === it.href);
                const isOpen = openGroups[g.heading] ?? true;
                return (
                  <React.Fragment key={g.heading}>
                    <li className="nav-header">
                      <button
                        type="button"
                        className="bs-group-toggle"
                        aria-expanded={isOpen}
                        onClick={() => toggleGroup(g.heading)}
                      >
                        <span>{g.heading.toUpperCase()}</span>
                        <i className={`bi ${isOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`} />
                      </button>
                    </li>
                    {isOpen && items.map((it) => (
                      <li className="nav-item" key={it.href}>
                        <Link href={it.href} className={`nav-link${pathname === it.href ? ' active' : ''}`}>
                          <i className={`nav-icon bi ${it.icon}`} />
                          <p>{it.label}</p>
                        </Link>
                      </li>
                    ))}
                  </React.Fragment>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      <main className="app-main">
        <div className="app-content">
          <div className="container-fluid">{children}</div>
        </div>
      </main>

      <footer className="app-footer">
        <strong>Al-Maa Parung</strong> &middot; AdminLTE ala SIMKS
      </footer>
      <button
        type="button"
        aria-label="Buka menu"
        className="lte-fab d-lg-none"
        onClick={() => setMobileOpen((v) => !v)}
      >
        <i className="bi bi-list" />
      </button>
      {mobileOpen && (
        <button type="button" aria-label="Tutup menu" className="lte-backdrop d-lg-none" onClick={() => setMobileOpen(false)} />
      )}
    </div>
  );
}
