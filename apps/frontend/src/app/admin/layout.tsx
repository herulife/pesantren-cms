import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { AdminThemeProvider } from '@/components/AdminTheme';
import './admin-bootstrap.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminThemeProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </AdminThemeProvider>
  );
}
