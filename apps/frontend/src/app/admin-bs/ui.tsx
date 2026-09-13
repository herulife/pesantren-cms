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

/* ---------- ALMAA Design System components ---------- */

export function PageHeader({ title, breadcrumb, actions }: { title: string; breadcrumb: string; actions?: React.ReactNode }) {
  return (
    <div className="alma-page-head">
      <div>
        <h1 className="alma-page-title">{title}</h1>
        <p className="alma-breadcrumb">{breadcrumb}</p>
      </div>
      {actions && <div className="alma-page-actions">{actions}</div>}
    </div>
  );
}

export function Pagination({ page, totalPages, total, from, to, onPage }: { page: number; totalPages: number; total: number; from: number; to: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) {
    return <p className="alma-pager-info">Menampilkan {total === 0 ? 0 : from}-{to} dari {total} data</p>;
  }
  const nums: number[] = [];
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  for (let i = start; i <= Math.min(totalPages, start + 4); i++) nums.push(i);
  return (
    <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
      <div className="alma-pager" role="navigation" aria-label="Pagination">
        <button onClick={() => onPage(1)} disabled={page === 1}>First</button>
        <button onClick={() => onPage(page - 1)} disabled={page === 1}>Prev</button>
        {nums.map((n) => (
          <button key={n} onClick={() => onPage(n)} className={n === page ? 'active' : ''} aria-current={n === page ? 'page' : undefined}>{n}</button>
        ))}
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages}>Next</button>
        <button onClick={() => onPage(totalPages)} disabled={page === totalPages}>Last</button>
      </div>
      <p className="alma-pager-info">Menampilkan {from}-{to} dari {total} data</p>
    </div>
  );
}

export function EmptyState({ title, desc, action }: { title: string; desc: string; action?: React.ReactNode }) {
  return (
    <div className="alma-empty">
      <h3>{title}</h3>
      <p>{desc}</p>
      {action}
    </div>
  );
}

export function ConfirmModal({ open, title, message, confirmLabel, onClose, onConfirm, busy }: { open: boolean; title: string; message: string; confirmLabel?: string; onClose: () => void; onConfirm: () => void; busy?: boolean }) {
  const [labelledBy] = React.useState(() => `alma-modal-${Math.random().toString(36).slice(2)}`);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="alma-modal-backdrop" onClick={onClose} role="presentation">
      <div className="alma-modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy} onClick={(e) => e.stopPropagation()}>
        <div className="alma-modal-hd" id={labelledBy}>{title}</div>
        <div className="alma-modal-bd">{message}</div>
        <div className="alma-modal-ft">
          <button type="button" className="alma-btn alma-btn-secondary" onClick={onClose}>Batal</button>
          <button type="button" className="alma-btn alma-btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Menghapus…' : (confirmLabel || 'Hapus')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ActionMenu({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);
  return (
    <div className="alma-actions" ref={ref}>
      <button type="button" className="alma-btn alma-btn-secondary alma-btn-sm" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        &#8942;
      </button>
      {open && <div className="alma-actions-menu" role="menu" onClick={() => setOpen(false)}>{children}</div>}
    </div>
  );
}

export function Toast({ toast }: { toast: { id: number; ok: boolean; msg: string } | null }) {
  if (!toast) return null;
  return (
    <div className="alma-toast-wrap" role="status" aria-live="polite">
      <div key={toast.id} className={`alma-toast${toast.ok ? ' ok' : ' err'}`}>{toast.msg}</div>
    </div>
  );
}

export function useToastState() {
  const [toast, setToast] = React.useState<{ id: number; ok: boolean; msg: string } | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = React.useCallback((ok: boolean, msg: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), ok, msg });
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);
  return { toast, show };
}
