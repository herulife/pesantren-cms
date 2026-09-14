'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getPortalDocById, portalDocSections } from '@/lib/portalDocs';

function PortalHelpContent() {
  const ref = useSearchParams().get('ref');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState(portalDocSections[0].id);

  const list = useMemo(() => {
    const k = query.trim().toLowerCase();
    if (!k) return portalDocSections;
    return portalDocSections.filter((s) =>
      [s.title, s.summary, ...s.workflows.flatMap((w) => [w.title, ...w.steps]), ...s.tips]
        .join(' ')
        .toLowerCase()
        .includes(k),
    );
  }, [query]);

  const current = getPortalDocById(ref ?? (list.some((s) => s.id === activeId) ? activeId : list[0]?.id));

  return (
    <div className="mx-auto max-w-2xl px-4 pb-12">
      <h1 className="mt-6 text-2xl font-bold text-slate-900">Panduan Wali</h1>
      <p className="mt-1 text-sm text-slate-600">Pilih topik di bawah, lalu ikuti langkah 1, 2, 3.</p>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari… misal: foto, nilai, bayar"
        className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-sky-500"
      />

      <div className="mt-3 space-y-2">
        {list.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveId(s.id)}
            className={`w-full rounded-lg border px-4 py-2.5 text-left text-sm font-semibold ${
              current.id === s.id
                ? 'border-sky-600 bg-sky-50 text-sky-800'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            {s.title}
          </button>
        ))}
        {list.length === 0 && (
          <p className="rounded-lg bg-slate-50 px-4 py-4 text-center text-sm text-slate-500">
            Tidak ketemu. Coba kata lain.
          </p>
        )}
      </div>

      <article className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">{current.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{current.summary}</p>

        {current.workflows.map((w) => (
          <div key={w.title} className="mt-5">
            <h3 className="text-sm font-bold text-slate-900">{w.title}</h3>
            <ol className="mt-2 space-y-2">
              {w.steps.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}

        {current.tips.length > 0 && (
          <div className="mt-5 rounded-lg bg-amber-50 p-4">
            <h3 className="text-sm font-bold text-amber-900">Tips</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
              {current.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        )}

        <Link
          href={current.href}
          className="mt-5 block rounded-lg bg-sky-600 px-4 py-2.5 text-center text-sm font-bold text-white"
        >
          Buka halaman {current.title} →
        </Link>
      </article>

      <Link href="/portal" className="mt-4 block text-center text-sm font-semibold text-sky-700">
        ← Kembali ke portal
      </Link>
    </div>
  );
}

export default function PortalHelpPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Memuat…</div>}>
      <PortalHelpContent />
    </Suspense>
  );
}
