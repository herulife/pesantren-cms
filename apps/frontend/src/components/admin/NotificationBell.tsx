'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';

type SummaryItem = { id: number; title: string; time: string };
type Section = { type: string; label: string; count: number; items: SummaryItem[] };
type Summary = { total: number; sections: Section[] };

const SECTION_LINKS: Record<string, string> = {
  psb: '/admin/psb',
  message: '/admin/messages',
  donation: '/admin/donations',
};

const POLL_INTERVAL_MS = 30_000;

export default function NotificationBell() {
  const [summary, setSummary] = useState<Summary>({ total: 0, sections: [] });
  const [open, setOpen] = useState(false);
  const activeRef = useRef(true);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications/summary', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.success) {
        setSummary({
          total: data.data?.total ?? 0,
          sections: data.data?.sections ?? [],
        });
      }
    } catch (err) {
      console.error('NotificationBell: gagal memuat notifikasi', err);
      setSummary({ total: 0, sections: [] });
    }
  }, []);

  useEffect(() => {
    activeRef.current = true;
    void load();
    const timer = window.setInterval(() => {
      if (activeRef.current) void load();
    }, POLL_INTERVAL_MS);
    const onFocus = () => {
      if (activeRef.current) void load();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      activeRef.current = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const total = summary.total;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={total > 0 ? `Notifikasi belum diproses: ${total}` : 'Notifikasi'}
        aria-expanded={open}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <Bell size={19} />
        {total > 0 && (
          <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white shadow">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-700">Notifikasi</p>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {summary.sections.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-400">Tidak ada notifikasi baru</p>
            ) : (
              summary.sections.map((section) => (
                <div key={section.type} className="py-1">
                  <div className="flex items-center justify-between px-3 py-1.5">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">{section.label}</p>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">{section.count}</span>
                  </div>
                  <div className="rounded-xl bg-slate-50/80 p-1">
                    {section.items.map((item) => (
                      <Link
                        key={`${section.type}-${item.id}`}
                        href={SECTION_LINKS[section.type] ?? '/admin'}
                        onClick={() => setOpen(false)}
                        className="flex items-start justify-between gap-3 rounded-lg px-3 py-2.5 transition hover:bg-white"
                      >
                        <span className="text-sm font-medium text-slate-700">{item.title}</span>
                        <span className="shrink-0 pt-0.5 text-xs text-slate-400">{item.time}</span>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href={SECTION_LINKS[section.type] ?? '/admin'}
                    onClick={() => setOpen(false)}
                    className="block px-3 pb-1 pt-2 text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    Lihat semua →
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}