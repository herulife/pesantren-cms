'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { adminDocSections, getAdminDocById, roleAccessMatrix } from '@/lib/adminDocs';

function HelpContent() {
  const ref = useSearchParams().get('ref');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState(adminDocSections[0].id);

  const list = useMemo(() => {
    const k = query.trim().toLowerCase();
    if (!k) return adminDocSections;
    return adminDocSections.filter((s) =>
      [s.title, s.category, s.summary, ...s.workflows.flatMap((w) => [w.title, ...w.steps]), ...s.tips]
        .join(' ')
        .toLowerCase()
        .includes(k),
    );
  }, [query]);

  const current = getAdminDocById(ref ?? (list.some((s) => s.id === activeId) ? activeId : list[0]?.id));

  return (
    <div className="mx-auto max-w-2xl px-4 pb-12">
      <h1 className="mt-6 text-2xl font-bold text-slate-900">Panduan Admin</h1>
      <p className="mt-1 text-sm text-slate-600">Pilih yang mau dikerjakan, ikuti langkah 1, 2, 3.</p>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari… misal: berita, bayar, nilai"
        className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-sky-500"
      />

      <div className="mt-3 space-y-2">
        {list.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveId(s.id)}
            className={`w-full rounded-lg border px-4 py-2.5 text-left ${
              current.id === s.id
                ? 'border-sky-600 bg-sky-50'
                : 'border-slate-200 bg-white'
            }`}
          >
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">{s.category}</span>
            <span className={`block text-sm font-semibold ${current.id === s.id ? 'text-sky-800' : 'text-slate-700'}`}>{s.title}</span>
          </button>
        ))}
        {list.length === 0 && (
          <p className="rounded-lg bg-slate-50 px-4 py-4 text-center text-sm text-slate-500">
            Tidak ketemu. Coba kata lain.
          </p>
        )}
      </div>

      <article className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{current.category}</p>
        <h2 className="mt-1 text-lg font-bold text-slate-900">{current.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{current.summary}</p>
        <p className="mt-2 text-xs text-slate-500">Untuk: {current.audience.join(', ')}</p>

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

        {current.visualSteps && current.visualSteps.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-bold text-slate-900">Contoh gambar</h3>
            <div className="mt-2 space-y-4">
              {current.visualSteps.map((vs, i) => (
                <figure key={vs.title}>
                  <figcaption className="text-sm font-semibold text-slate-700">
                    {i + 1}. {vs.title}
                  </figcaption>
                  <p className="mt-0.5 text-sm text-slate-600">{vs.description}</p>
                  <Image
                    src={vs.image}
                    alt={vs.alt}
                    width={1200}
                    height={900}
                    unoptimized
                    className="mt-2 h-auto w-full rounded-lg border border-slate-200"
                  />
                </figure>
              ))}
            </div>
          </div>
        )}

        <Link
          href={current.href}
          className="mt-5 block rounded-lg bg-sky-600 px-4 py-2.5 text-center text-sm font-bold text-white"
        >
          Buka halaman {current.title} →
        </Link>
      </article>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-slate-900">Siapa boleh buka apa</h2>
        <p className="mt-1 text-xs text-slate-500">✓ = boleh dibuka, ✕ = tidak bisa.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-2">Menu</th>
                <th className="py-2 pr-2">Pimpinan</th>
                <th className="py-2 pr-2">Media</th>
                <th className="py-2 pr-2">Bendahara</th>
                <th className="py-2">PSB</th>
              </tr>
            </thead>
            <tbody>
              {roleAccessMatrix.map((row) => (
                <tr key={row.module} className="border-b border-slate-100">
                  <td className="py-2 pr-2 font-semibold text-slate-700">{row.module}</td>
                  {[row.superadmin, row.tim_media, row.bendahara, row.panitia_psb].map((v, i) => (
                    <td key={i} className={`py-2 pr-2 font-bold ${v === 'Ya' ? 'text-emerald-600' : 'text-slate-300'}`}>
                      {v === 'Ya' ? '✓' : '✕'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
        Di tiap menu ada ikon tanda tanya (?) — klik untuk langsung membuka panduan menu itu.
      </p>
      <Link href="/admin" className="mt-4 block text-center text-sm font-semibold text-sky-700">
        ← Kembali ke admin
      </Link>
    </div>
  );
}

export default function HelpPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Memuat…</div>}>
      <HelpContent />
    </Suspense>
  );
}
