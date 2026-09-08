'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Eye, Save, Rocket, ExternalLink, Columns2, Check, AlertTriangle } from 'lucide-react';
import PageBuilderEditor from '@/components/website-builder/PageBuilderEditor';
import { getSettings, updateSetting } from '@/lib/api';
import { useToast } from '@/components/Toast';
import {
  defaultWebsiteBuilderPages,
  WebsiteBuilderPages,
  serializeBuilderJson,
  WEBSITE_BUILDER_KEYS,
  parseWebsiteBuilderState,
} from '@/lib/website-builder';

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export default function BuilderProgramPage() {
  const { showToast } = useToast();
  const [pagesDraft, setPagesDraft] = useState<WebsiteBuilderPages>(defaultWebsiteBuilderPages);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const settings = await getSettings();
    const state = parseWebsiteBuilderState(Object.fromEntries(settings.map((s) => [s.key, s.value])));
    setPagesDraft(state.pagesDraft);
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const uploadBuilderAsset = async (target: string, file: File) => {
    setUploadingTarget(target);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
      const j = await res.json();
      return j.data?.url || j.url || '';
    } finally {
      setUploadingTarget(null);
    }
  };

  const persist = async (entries: Array<[string, string]>) => {
    await Promise.all(entries.map(([k, v]) => updateSetting(k, v)));
  };

  const getProgramError = (): string | null => {
    const p = pagesDraft.program;
    if (!p.extracurricular.title.trim()) return 'Judul Ekstrakurikuler wajib diisi.';
    if (p.extracurricular.tags.length === 0) return 'Minimal 1 Tag Ekstrakurikuler.';
    if (!p.featured.title.trim()) return 'Judul Program Unggulan wajib diisi.';
    return null;
  };

  const handleSave = async () => {
    const err = getProgramError();
    if (err) {
      showToast('error', err);
      return;
    }
    setIsSaving(true);
    try {
      const nextPages = cloneValue(pagesDraft);
      await persist([[WEBSITE_BUILDER_KEYS.pagesDraft, serializeBuilderJson(nextPages)]]);
      showToast('success', 'Draft Program tersimpan — preview di sebelah kanan sudah update.');
      await fetchData();
    } catch {
      showToast('error', 'Gagal menyimpan draft.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    const err = getProgramError();
    if (err) {
      showToast('error', err);
      return;
    }
    setIsPublishing(true);
    try {
      const nextPages = cloneValue(pagesDraft);
      await persist([
        [WEBSITE_BUILDER_KEYS.pagesPublished, serializeBuilderJson(nextPages)],
        [WEBSITE_BUILDER_KEYS.pagesDraft, serializeBuilderJson(nextPages)],
      ]);
      showToast('success', 'Program dipublish — pengunjung sekarang melihat versi baru.');
      await fetchData();
    } catch {
      showToast('error', 'Gagal publish.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Builder • Program</p>
          <h1 className="mt-1 font-outfit text-2xl font-black tracking-tight text-slate-900">Program & Ekstrakurikuler</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Kelola ekstrakurikuler (pill) dan program inti. Font halus Outfit untuk judul, Plus Jakarta untuk form. Card putih radius 12px.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/builder-preview/program" target="_blank" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
            <Eye size={14} /> Preview Draft
          </Link>
          <Link href="/program" target="_blank" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
            <ExternalLink size={14} /> Lihat Published
          </Link>
          <Link href="/builder-compare/program" target="_blank" className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-100">
            <Columns2 size={14} /> Bandingkan
          </Link>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Auto-save tidak aktif — klik Simpan Draft
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {isSaving ? <Check size={14} className="animate-spin" /> : <Save size={14} />} Simpan Draft
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow hover:bg-emerald-700 disabled:opacity-50"
          >
            <Rocket size={14} /> Publish
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-600">
        Kelola daftar ekstrakurikuler (pill) — untuk data ekskul dinamis buka <Link href="/admin/programs?category=ekskul" className="font-bold text-slate-900 underline">Admin → Program (ekskul)</Link>.
      </div>

      <div className="mt-6">
        <PageBuilderEditor
          pageKey="program"
          pagesDraft={pagesDraft}
          onChange={setPagesDraft}
          onUploadImage={uploadBuilderAsset}
          uploadingTarget={uploadingTarget}
        />
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">Preview link jelas di atas — Simpan Draft (putih) vs Publish (hijau) — font halus Outfit/Plus Jakarta — WP-like tapi estetik</p>
    </div>
  );
}
