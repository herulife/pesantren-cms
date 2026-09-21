'use client';

import React, { useEffect, useState } from 'react';
import { Clipboard, ClipboardCheck, Plus, RefreshCw, Trash2, StickyNote, ExternalLink, Save } from 'lucide-react';
import { createNote, deleteNote, type CreateNoteResult } from '@/lib/api';
import { useToast } from '@/components/Toast';
import PublicLayout from '@/components/PublicLayout';

const EXPIRY_OPTIONS = [
  { label: 'Selamanya', value: 0 },
  { label: '1 Hari', value: 1 },
  { label: '7 Hari', value: 7 },
  { label: '30 Hari', value: 30 },
  { label: '90 Hari', value: 90 },
  { label: '1 Tahun', value: 365 },
];

const STORAGE_KEY = 'alma_note_state_v1';

type SavedState = {
  title: string;
  content: string;
  expiresInDays: number;
  result: CreateNoteResult | null;
};

function loadSavedState(): SavedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      title: typeof parsed.title === 'string' ? parsed.title : '',
      content: typeof parsed.content === 'string' ? parsed.content : '',
      expiresInDays: typeof parsed.expiresInDays === 'number' ? parsed.expiresInDays : 30,
      result: parsed.result || null,
    };
  } catch {
    return null;
  }
}

function clearSavedState() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // abaikan
  }
}

export function NotePageContent() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CreateNoteResult | null>(null);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const saved = loadSavedState();
    if (saved) {
      setTitle(saved.title || '');
      setContent(saved.content || '');
      if (saved.expiresInDays) setExpiresInDays(saved.expiresInDays);
      if (saved.result) setResult(saved.result);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ title, content, expiresInDays, result })
      );
    } catch {
      // abaikan (mis. private mode)
    }
  }, [title, content, expiresInDays, result]);

  const shareUrl = result ? `${window.location.origin}/note/${result.url_id}` : '';

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('success', 'Link berhasil disalin!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('error', 'Gagal menyalin link.');
    }
  };

  const handleDelete = async () => {
    if (!result) return;
    const ok = window.confirm('Hapus catatan ini? Link-nya tidak akan bisa diakses lagi.');
    if (!ok) return;
    const res = await deleteNote(result.url_id, result.delete_token);
    if (res.success) {
      clearSavedState();
      setResult(null);
      setTitle('');
      setContent('');
      showToast('success', 'Catatan berhasil dihapus.');
    } else {
      showToast('error', res.message || 'Gagal menghapus catatan.');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!content.trim()) {
      showToast('error', 'Isi catatan dulu sebelum menyimpan.');
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await createNote({
        title: title.trim(),
        content,
        expires_in_days: expiresInDays > 0 ? expiresInDays : undefined,
      });
      if (created) {
        setResult(created);
        showToast('success', 'Catatan berhasil disimpan!');
      } else {
        showToast('error', 'Gagal menyimpan catatan.');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNew = () => {
    clearSavedState();
    setResult(null);
    setTitle('');
    setContent('');
    setCopied(false);
  };

  const formattedDate = result?.created_at
    ? new Date(result.created_at + (result.created_at.includes('Z') ? '' : 'Z')).toLocaleString('id-ID')
    : '';

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="relative overflow-hidden bg-slate-950 py-20 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-sky-950/70" />
        <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-800/30 blur-[100px]" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-bold tracking-widest text-sky-200">
            <StickyNote size={15} /> PASTEBIN ALMA
          </div>
          <h1 className="font-outfit mb-4 text-4xl font-black tracking-tight md:text-5xl">
            Tempel Catatan, Bagikan Link
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-sky-100/80">
            Tempel teks di bawah ini, simpan, lalu bagikan link-nya. Bisa dibuka di mana saja
            dari HP atau komputer — tanpa login.
          </p>
        </div>
      </div>

      <div className="relative z-20 mx-auto -mt-10 max-w-7xl px-4">
        <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white/95 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-sm md:p-10">
          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Judul (opsional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-bold transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                  placeholder="Cth: Jadwal rapat guru"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Isi Catatan *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={14}
                  className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 font-mono text-sm leading-relaxed transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                  placeholder="Tempel teks Anda di sini…"
                />
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Masa berlaku
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EXPIRY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setExpiresInDays(opt.value)}
                        className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wide transition ${
                          expiresInDays === opt.value
                            ? 'border-sky-600 bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-sky-300 hover:text-sky-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-3 rounded-2xl bg-sky-600 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-sky-600/20 transition hover:bg-sky-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" /> Menyimpan…
                    </>
                  ) : (
                    <>
                      <Clipboard size={18} /> Simpan Catatan
                    </>
                  )}
                </button>
              </div>
              <p className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <Save size={14} className="text-emerald-500" />
                Draft tersimpan otomatis di perangkat ini — tidak hilang saat halaman di-refresh.
              </p>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="rounded-3xl border border-sky-200 bg-sky-50 p-6 text-center">
                <p className="mb-3 text-sm font-bold text-sky-800">
                  Catatan berhasil disimpan. Bagikan link ini:
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    readOnly
                    value={shareUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="w-full rounded-2xl border border-sky-200 bg-white px-5 py-4 font-mono text-sm font-bold text-slate-800 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 sm:flex-none"
                    >
                      {copied ? <ClipboardCheck size={16} /> : <Clipboard size={16} />}
                      {copied ? 'Tersalin!' : 'Salin'}
                    </button>
                    <a
                      href={`/note/${result.url_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-xs font-black uppercase tracking-widest text-white transition hover:bg-slate-800 sm:flex-none"
                    >
                      <ExternalLink size={16} /> Buka
                    </a>
                  </div>
                </div>
                {result.title ? (
                  <p className="mt-4 text-xs font-bold text-sky-700">Judul: {result.title}</p>
                ) : null}
                <p className="mt-1 text-xs text-sky-600/80">
                  Dibuat {formattedDate}
                  {result.expires_at
                    ? ` • Berlaku hingga ${new Date(result.expires_at).toLocaleString('id-ID')}`
                    : ' • Berlaku selamanya'}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Pratinjau
                </p>
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-50 p-4 font-mono text-sm leading-relaxed text-slate-700">
                  {result.content}
                </pre>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleNew}
                  className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-slate-800"
                >
                  <Plus size={16} /> Buat Catatan Baru
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-6 py-3 text-xs font-black uppercase tracking-widest text-red-600 transition hover:bg-red-100"
                >
                  <Trash2 size={16} /> Hapus Catatan
                </button>
              </div>
            </div>
          )}

          <p className="mt-8 border-t border-slate-100 pt-5 text-center text-xs text-slate-400">
            Catatan bersifat publik — siapa pun yang punya link-nya bisa membacanya. Jangan
            tempel informasi rahasia (password, data pribadi santri, dll).
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NotePage() {
  return (
    <PublicLayout>
      <NotePageContent />
    </PublicLayout>
  );
}
