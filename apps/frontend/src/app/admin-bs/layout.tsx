import React from 'react';
import AdminBsShell from '@/components/AdminBsShell';
import './bs.css';

export default function AdminBsLayout({ children }: { children: React.ReactNode }) {
  return <AdminBsShell>{children}</AdminBsShell>;
}
