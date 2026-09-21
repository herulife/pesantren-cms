'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Clipboard, ClipboardCheck, Plus, RefreshCw, Trash2, StickyNote, ExternalLink, Save,
  KeyRound, FolderOpen, Link2, FileText, Eye, PenLine, Check, ListVideo,
} from 'lucide-react';
import { createNote, deleteNote, getMyNotes, type CreateNoteResult, type MineNote } from '@/lib/api';
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
const KEY_STORAGE = 'alma_note_key_v1';

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

function loadKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

function saveKey(key: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY_STORAGE, key);
  } catch {
    // abaikan
  }
}

const KEY_WORDS_1 = ['mangga', 'pisang', 'durian', 'rambutan', 'sirsak', 'jambu', 'nangka', 'salak', 'kelapa', 'jeruk', 'apel', 'tomat', 'bayam', 'kangkung', 'tempe', 'nasi', 'kopi', 'teh', 'susu', 'roti'];
const KEY_WORDS_2 = ['merah', 'kuning', 'hijau', 'biru', 'pagi', 'malam', 'senja', 'bulan', 'bintang', 'gunung', 'pantai', 'sawah', 'taman', 'sekolah', 'masjid', 'senang'];

function generateNoteKey(): string {
  const w1 = KEY_WORDS_1[Math.floor(Math.random() * KEY_WORDS_1.length)];
  const w2 = KEY_WORDS_2[Math.floor(Math.random() * KEY_WORDS_2.length)];
  const digits = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${w1}-${w2}${digits}`;
}

function validCustomUrl(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (v === '') return true;
  if (v.length < 3 || v.length > 60) return false;
  if (v === 'mine' || v === 'new') return false;
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(v);
}

function formatFullDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso + (iso.includes('Z') ? '' : 'Z')).toLocaleString('id-ID');
}

function formatShortDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso + (iso.includes('Z') ? '' : 'Z')).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function NotePageContent() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CreateNoteResult | null>(null);
  const [copied, setCopied] = useState(false);

  const [ownerKey, setOwnerKey] = useState('');
  const [myNotes, setMyNotes] = useState<MineNote[]>([]);
  const [myNotesLoading, setMyNotesLoading] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyCopied, setKeyCopied] = useState(false);
  const [keyEditing, setKeyEditing] = useState(false);

  const { showToast } = useToast();

  const myNotesRef = useRef<HTMLDivElement>(null);

  const scrollToMyNotes = () => {
    myNotesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const refreshMyNotes = async (key: string) => {
    if (!key) return;
    setMyNotesLoading(true);
    try {
      const notes = await getMyNotes(key);
      setMyNotes(notes);
    } finally {
      setMyNotesLoading(false);
    }
  };

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

  useEffect(() => {
    let currentKey = loadKey();
    if (!currentKey) {
      currentKey = generateNoteKey();
      saveKey(currentKey);
    }
    setOwnerKey(currentKey);
    refreshMyNotes(currentKey);
  }, []);

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

  const handleCopyKey = async () => {
    if (!ownerKey) return;
    try {
      await navigator.clipboard.writeText(ownerKey);
      setKeyCopied(true);
      showToast('success', 'Kunci berhasil disalin!');
      setTimeout(() => setKeyCopied(false), 2000);
    } catch {
      showToast('error', 'Gagal menyalin kunci.');
    }
  };

  const handleApplyKey = () => {
    const cleaned = keyInput.trim();
    if (cleaned.length < 6 || cleaned.length > 64) {
      showToast('error', 'Kunci minimal 6 karakter.');
      return;
    }
    if (!/^[A-Za-z0-9._-]+$/.test(cleaned)) {
      showToast('error', 'Hanya huruf, angka, -, _, atau .');
      return;
    }
    saveKey(cleaned);
    setOwnerKey(cleaned);
    setKeyInput('');
    setKeyEditing(false);
    refreshMyNotes(cleaned);
    showToast('success', 'Kunci diterapkan. Catatan dari perangkat lain dimuat.');
  };

  const handleRandomizeKey = () => {
    const newKey = generateNoteKey();
    saveKey(newKey);
    setOwnerKey(newKey);
    setKeyInput('');
    setKeyEditing(false);
    refreshMyNotes(newKey);
    showToast('success', 'Kunci baru dibuat. Catatan baru masuk ke kunci ini.');
  };

  const handleDeleteNote = async (item: MineNote) => {
    const ok = window.confirm(`Hapus catatan "${item.title || '(tanpa judul)'}"?`);
    if (!ok) return;
    const res = await deleteNote(item.url_id, item.delete_token);
    if (res.success) {
      if (result && result.url_id === item.url_id) {
        clearSavedState();
        setResult(null);
        setTitle('');
        setContent('');
      }
      setMyNotes((prev) => prev.filter((n) => n.url_id !== item.url_id));
      showToast('success', 'Catatan berhasil dihapus.');
    } else {
      showToast('error', res.message || 'Gagal menghapus catatan.');
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
      setMyNotes((prev) => prev.filter((n) => n.url_id !== result!.url_id));
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
      const currentKey = ownerKey || loadKey() || generateNoteKey();
      if (!ownerKey) {
        saveKey(currentKey);
        setOwnerKey(currentKey);
      }
      const created = await createNote({
        title: title.trim(),
        content,
        expires_in_days: expiresInDays > 0 ? expiresInDays : undefined,
        owner_key: currentKey,
        custom_url: validCustomUrl(customUrl) ? customUrl.trim().toLowerCase() : undefined,
      });
      if (created) {
        setResult(created);
        showToast('success', 'Catatan berhasil disimpan!');
        refreshMyNotes(currentKey);
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

  const formattedDate = result?.created_at ? formatFullDate(result.created_at) : '';

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
            Tempel teks, simpan, lalu bagikan link-nya. Semua catatanmu tersimpan di server,
            bisa dibuka dari HP atau komputer mana pun — tanpa login.
          </p>
        </div>
      </div>

      <div className="relative z-20 mx-auto -mt-10 max-w-7xl space-y-8 px-4">
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
                  Nama Link (opsional — biar gampang diketik & diingat)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-5 flex items-center font-mono text-xs font-bold text-slate-300">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/note/
                  </span>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    maxLength={60}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-[46%] pr-6 font-mono text-sm font-bold transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 md:pl-[34%]"
                    placeholder="jadwal-rapat-guru"
                  />
                </div>
                {customUrl.trim() && !validCustomUrl(customUrl) ? (
                  <p className="text-xs font-bold text-red-500">
                    Nama link hanya boleh huruf kecil, angka, dan tanda hubung (3–60 karakter).
                  </p>
                ) : customUrl.trim() ? (
                  <p className="text-xs font-bold text-emerald-600">
                    Link jadi: {typeof window !== 'undefined' ? window.location.origin : ''}/note/{customUrl.trim().toLowerCase()}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    Kosongkan untuk link otomatis pendek (6 karakter). Contoh: jadwal-rapat-guru
                  </p>
                )}
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
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleNew}
                    className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-slate-800"
                  >
                    <Plus size={16} /> Buat Catatan Baru
                  </button>
                  <button
                    type="button"
                    onClick={scrollToMyNotes}
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-600 transition hover:border-sky-300 hover:text-sky-600"
                  >
                    <ListVideo size={16} /> Lihat Semua Catatanku ({myNotes.length})
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-6 py-3 text-xs font-black uppercase tracking-widest text-red-600 transition hover:bg-red-100"
                >
                  <Trash2 size={16} /> Hapus Catatan
                </button>
              </div>
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
                Catatan lama tidak hilang — semua catatanmu tetap tersimpan dan tetap bisa dibuka
                lewat link-nya. Pantau semuanya di "Catatan Saya" di bawah.
              </p>
            </div>
          )}

          <p className="mt-8 border-t border-slate-100 pt-5 text-center text-xs text-slate-400">
            Catatan bersifat publik — siapa pun yang punya link-nya bisa membacanya. Jangan
            tempel informasi rahasia (password, data pribadi santri, dll).
          </p>
        </div>

        <div ref={myNotesRef} id="my-notes" className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white/95 shadow-xl shadow-slate-200/50">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5 md:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <FolderOpen size={20} />
              </div>
              <div>
                <h2 className="font-outfit text-xl font-black text-slate-800">Catatan Saya</h2>
                <p className="text-xs text-slate-400">
                  Semua catatanmu tersimpan di server — tidak ada yang hilang saat kamu buat
                  catatan baru, dan bisa dibuka dari perangkat mana pun.
                </p>
              </div>
            </div>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-xs font-black text-sky-700">
              {myNotesLoading ? 'Memuat…' : `${myNotes.length} catatan`}
            </span>
          </div>

          <div className="px-6 py-6 md:px-8">
            {myNotes.length === 0 && !myNotesLoading ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm">
                  <FileText size={26} />
                </div>
                <p className="text-sm font-bold text-slate-500">
                  Belum ada catatan tersimpan.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Simpan catatan pertama di atas, nanti otomatis muncul di sini.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {myNotes.map((item) => (
                  <li
                    key={item.url_id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-sky-200 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-black text-slate-800">
                          {item.title || '(tanpa judul)'}
                        </p>
                        {result && item.url_id === result.url_id ? (
                          <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
                            Baru
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-400">{item.content}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span>{formatShortDate(item.created_at)}</span>
                        <span>
                          {item.expires_at
                            ? `Sampai ${new Date(item.expires_at).toLocaleDateString('id-ID')}`
                            : 'Selamanya'}
                        </span>
                        <span className="max-w-[30ch] truncate font-mono">{item.url_id}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Link
                        href={`/note/${item.url_id}`}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-600 transition hover:border-sky-300 hover:text-sky-600"
                      >
                        <Eye size={14} /> Buka
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(item)}
                        className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-red-500 transition hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-5">
              <p className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                <KeyRound size={14} className="text-amber-500" /> Kunci pribadi catatanmu
              </p>
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="flex flex-1 gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="min-w-0 flex-1 truncate font-mono text-xs font-bold text-slate-700">
                    {ownerKey}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white transition hover:bg-slate-800"
                  >
                    {keyCopied ? <ClipboardCheck size={13} /> : <Clipboard size={13} />}
                    {keyCopied ? 'Tersalin!' : 'Salin'}
                  </button>
                </div>
              </div>
              {!keyEditing ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setKeyEditing(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-wide text-slate-600 transition hover:border-sky-300 hover:text-sky-600"
                  >
                    <PenLine size={13} /> Ganti Kunci
                  </button>
                  <button
                    type="button"
                    onClick={handleRandomizeKey}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-wide text-slate-600 transition hover:border-sky-300 hover:text-sky-600"
                  >
                    <RefreshCw size={13} /> Kunci Baru
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="Ketuk kunci sendiri (min. 6 karakter)…"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 font-mono text-sm font-bold text-slate-700 transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                  />
                  <button
                    type="button"
                    onClick={handleApplyKey}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700"
                  >
                    <Check size={15} /> Pakai
                  </button>
                </div>
              )}
              <p className="mt-3 text-xs text-slate-400">
                Untuk membuka catatanmu di perangkat lain: salin kunci ini, lalu tempel di kotak
                di bawah pada perangkat tersebut. Pakai kunci yang gampang kamu ingat (min. 6
                karakter) supaya mudah dibawa ke mana-mana.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Tempel kunci dari perangkat lain ini…"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 font-mono text-sm font-bold text-slate-700 transition-all focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                />
                <button
                  type="button"
                  onClick={handleApplyKey}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700"
                >
                  <Link2 size={15} /> Pakai Kunci
                </button>
              </div>
            </div>
          </div>
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
