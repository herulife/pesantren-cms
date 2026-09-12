'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, LogOut, Menu, Sparkles, X } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useAdminTheme } from './AdminTheme';
import { getRoleMenuPermissions } from '@/lib/api';
import { ROLE_MENU_DEFS } from '@/lib/roleMenus';

// Shell admin gaya Bootstrap/SB Admin ala SIMKS: sidebar gelap,
// topbar putih, konten di atas kartu. Dipakai saat admin_theme = bootstrap.
export default function AdminBootstrapShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();
  const { setTheme } = useAdminTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rolePerms, setRolePerms] = useState<Record<string, string[]>>({});

  useEffect(() => {
    getRoleMenuPermissions().then(setRolePerms).catch(() => {});
  }, []);

  const groups = useMemo(() => {
    const visible = ROLE_MENU_DEFS.filter((d) => {
      if (!d.roles || d.roles.length === 0) return true;
      if (user?.role === 'superadmin') return true;
      const saved = user?.role ? rolePerms[user.role] : undefined;
      if (saved && Array.isArray(saved)) return saved.includes(d.href);
      return hasRole(...d.roles);
    });
    const map = new Map<string, typeof visible>();
    visible.forEach((d) => {
      const list = map.get(d.category) || [];
      list.push(d);
      map.set(d.category, list);
    });
    return Array.from(map.entries());
  }, [user, rolePerms, hasRole]);

  return (
    <div className="admin-bs-root d-flex" id="wrapper">
      {/* Sidebar */}
      <ul
        className={`navbar-nav sidebar sidebar-dark accordion ${collapsed ? 'toggled' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
        id="accordionSidebar"
        onClick={() => setMobileOpen(false)}
      >
        <Link className="sidebar-brand d-flex align-items-center justify-content-center" href="/admin">
          <div className="sidebar-brand-icon">A</div>
          <div className="sidebar-brand-text mx-2">Al-Maa Admin</div>
        </Link>
        <hr className="sidebar-divider my-0" />
        {groups.map(([cat, items]) => (
          <React.Fragment key={cat}>
            <div className="sidebar-heading">{cat}</div>
            {items.map((item) => {
              const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <li className={`nav-item${active ? ' active' : ''}`} key={item.href}>
                  <Link className="nav-link" href={item.href}>
                    <LayoutGrid size={14} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
            <hr className="sidebar-divider" />
          </React.Fragment>
        ))}
        <div className="text-center d-none d-md-inline mt-2">
          <button
            type="button"
            className="rounded-circle border-0"
            onClick={() => setCollapsed((v) => !v)}
            aria-label="Kecilkan menu"
          />
        </div>
      </ul>

      {/* Content */}
      <div id="content-wrapper" className="d-flex flex-column">
        <div id="content">
          <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">
            <button
              type="button"
              className="btn btn-link d-md-none rounded-circle mr-3"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Buka menu"
            >
              <Menu size={20} />
            </button>
            <span className="d-none d-md-inline font-weight-bold text-primary">SIMKS Al-Maa</span>
            <ul className="navbar-nav ml-auto">
              <li className="nav-item">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary mr-2"
                  onClick={() => setTheme('modern')}
                  title="Kembali ke mode modern"
                >
                  <Sparkles size={14} /> Modern
                </button>
              </li>
              <li className="nav-item dropdown no-arrow">
                <span className="nav-link">
                  <span className="mr-2 d-none d-lg-inline text-gray-600 small">
                    {user?.name || 'Admin'} ({user?.role || 'staff'})
                  </span>
                </span>
              </li>
              <li className="nav-item">
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => logout()} aria-label="Keluar">
                  <LogOut size={14} /> Keluar
                </button>
              </li>
            </ul>
          </nav>

          <div className="container-fluid px-3 px-md-4 pb-4">
            {mobileOpen && (
              <button type="button" aria-label="Tutup menu" className="bs-backdrop d-md-none" onClick={() => setMobileOpen(false)}>
                <X size={18} />
              </button>
            )}
            {children}
          </div>
        </div>
        <footer className="sticky-footer bg-white">
          <div className="container my-auto">
            <div className="copyright text-center my-auto">
              <span>Al-Maa Parung &middot; Mode Bootstrap ala SIMKS</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

