'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clipboard, ClipboardCheck, Calendar, Plus, RefreshCw, StickyNote, FileQuestion, ExternalLink } from 'lucide-react';
import { getNote, type Note } from '@/lib/api';
import PublicLayout from '@/components/PublicLayout';

export function NoteViewContent({ urlId }: { urlId: string }) {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await getNote(urlId);
      if (cancelled) return;
      setNote(data);
      setNotFound(!data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [urlId]);

  const handleCopy = async () => {
    if (!note) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const formattedDate = note?.created_at
    ? new Date(note.created_at + (note.created_at.includes('Z') ? '' : 'Z')).toLocaleString('id-ID')
    : '';

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="relative overflow-hidden bg-slate-950 py-16 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-sky-950/70" />
        <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-800/30 blur-[100px]" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <Link
            href="/note"
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-bold tracking-widest text-sky-200 transition hover:bg-white/20"
          >
            <StickyNote size={15} /> PASTEBIN DARUSSUNNAH
          </Link>
          <h1 className="font-outfit text-center text-3xl font-black tracking-tight md:text-4xl">
            {note?.title || 'Catatan'}
          </h1>
          {note ? (
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-sky-200/80">
              <Calendar size={15} /> Dibuat {formattedDate}
              {note.expires_at
                ? ` • Berlaku hingga ${new Date(note.expires_at).toLocaleString('id-ID')}`
                : ' • Berlaku selamanya'}
            </p>
          ) : null}
        </div>
      </div>

      <div className="relative z-20 mx-auto -mt-8 max-w-4xl px-4">
        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-[2.5rem] border border-slate-100 bg-white/95 p-16 shadow-xl shadow-slate-200/50">
            <RefreshCw size={20} className="animate-spin text-sky-600" />
            <span className="text-sm font-bold text-slate-500">Memuat catatan…</span>
          </div>
        ) : notFound || !note ? (
          <div className="rounded-[2.5rem] border border-slate-100 bg-white/95 p-16 text-center shadow-xl shadow-slate-200/50">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-500">
              <FileQuestion size={36} />
            </div>
            <h2 className="mb-2 text-2xl font-black text-slate-800">Catatan tidak ditemukan</h2>
            <p className="mx-auto mb-8 max-w-sm text-sm text-slate-500">
              Link ini tidak valid, catatan sudah dihapus, atau masa berlakunya sudah habis.
            </p>
            <Link
              href="/note"
              className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-sky-600/20 transition hover:bg-sky-700"
            >
              <Plus size={16} /> Buat Catatan Baru
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white/95 shadow-xl shadow-slate-200/50">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 md:px-8">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Isi Catatan
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white transition hover:bg-slate-800"
                >
                  {copied ? <ClipboardCheck size={15} /> : <Clipboard size={15} />}
                  {copied ? 'Tersalin!' : 'Salin Link'}
                </button>
                <Link
                  href="/note"
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 transition hover:border-sky-300 hover:text-sky-600"
                >
                  <ExternalLink size={14} /> Baru
                </Link>
              </div>
            </div>
            <pre className="max-h-[75vh] overflow-auto whitespace-pre-wrap break-words px-6 py-6 font-mono text-sm leading-relaxed text-slate-700 md:px-8">
              {note.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NoteViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return (
    <PublicLayout>
      <NoteViewContent urlId={id} />
    </PublicLayout>
  );
}
