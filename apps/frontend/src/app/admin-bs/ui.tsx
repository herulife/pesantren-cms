'use client';

import React from 'react';

export function fmtRp(n: number) {
  return 'Rp ' + (n || 0).toLocaleString('id-ID');
}

export function BsTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="mb-3 fw-bold">{children}</h4>;
}

export function BsAlert({ msg, ok }: { msg: string; ok: boolean }) {
  if (!msg) return null;
  return <div className={`alert ${ok ? 'alert-success' : 'alert-danger'} py-2`}>{msg}</div>;
}
