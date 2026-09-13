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

/* ---------- Import CSV massal ---------- */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur = '';
  let row: string[] = [];
  let inQ = false;
  const push = () => {
    row.push(cur);
    cur = '';
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQ = true;
    } else if (c === ',') {
      push();
    } else if (c === '\n') {
      push();
      rows.push(row);
      row = [];
    } else if (c !== '\r') {
      cur += c;
    }
  }
  push();
  rows.push(row);
  return rows.filter((r) => r.some((x) => x.trim() !== ''));
}

export function ImportModal({ open, title, templateName, templateHeaders, sampleRow, onClose, onImport, busy }: {
  open: boolean;
  title: string;
  templateName: string;
  templateHeaders: string[];
  sampleRow: string[];
  onClose: () => void;
  onImport: (rows: Record<string, string>[]) => void;
  busy?: boolean;
}) {
  const [text, setText] = React.useState('');
  const [fileName, setFileName] = React.useState('');
  const parsed = React.useMemo(() => {
    if (!text.trim()) return [];
    const grid = parseCsv(text.trim());
    if (grid.length < 2) return [];
    const head = grid[0].map((h) => h.trim().toLowerCase());
    return grid.slice(1).map((line) => {
      const o: Record<string, string> = {};
      head.forEach((h, i) => {
        o[h] = (line[i] || '').trim();
      });
      return o;
    });
  }, [text]);

  const pickFile = (f: File | undefined) => {
    if (!f) return;
    setFileName(f.name);
    const rd = new FileReader();
    rd.onload = () => setText(String(rd.result || ''));
    rd.readAsText(f);
  };

  const downloadTemplate = () => {
    const q = (v: string) => (v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v);
    const csv = [templateHeaders.join(','), sampleRow.map(q).join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = templateName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!open) return null;
  return (
    <div className="alma-modal-backdrop" onClick={onClose} role="presentation">
      <div className="alma-modal" style={{ maxWidth: 640 }} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="alma-modal-hd">{title}</div>
        <div className="alma-modal-bd d-flex flex-column gap-3">
          <div className="d-flex gap-2 flex-wrap">
            <button type="button" className="alma-btn alma-btn-secondary alma-btn-sm" onClick={downloadTemplate}>Unduh Template</button>
            <label className="alma-btn alma-btn-secondary alma-btn-sm" style={{ cursor: 'pointer' }}>
              Pilih File CSV
              <input type="file" accept=".csv,.txt" hidden onChange={(e) => pickFile(e.target.files?.[0])} />
            </label>
            {fileName && <small className="text-muted align-self-center">{fileName}</small>}
          </div>
          <div className="alma-field">
            <label>Atau tempel isi CSV (baris pertama = header: {templateHeaders.join(', ')})</label>
            <textarea className="alma-input" style={{ height: 110 }} value={text} onChange={(e) => setText(e.target.value)} placeholder={templateHeaders.join(',')} />
          </div>
          <p className="small text-muted mb-0">Pratinjau: {parsed.length} baris valid.</p>
          {parsed.length > 0 && (
            <div style={{ maxHeight: 180, overflow: 'auto', border: '1px solid var(--almaa-border)', borderRadius: 8 }}>
              <table className="alma-table">
                <thead><tr>{Object.keys(parsed[0]).map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {parsed.slice(0, 5).map((r, i) => (
                    <tr key={i}>{Object.values(r).map((v, j) => <td key={j}>{v || '-'}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="alma-modal-ft">
          <button type="button" className="alma-btn alma-btn-secondary" onClick={onClose}>Batal</button>
          <button type="button" className="alma-btn alma-btn-primary" disabled={busy || parsed.length === 0} onClick={() => onImport(parsed)}>
            {busy ? 'Mengimpor…' : `Import ${parsed.length} Baris`}
          </button>
        </div>
      </div>
    </div>
  );
}
