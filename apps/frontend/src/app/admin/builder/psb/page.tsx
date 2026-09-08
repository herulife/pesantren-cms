'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Eye, Save, Rocket, ExternalLink, Columns2 } from 'lucide-react';
import PageBuilderEditor from '@/components/website-builder/PageBuilderEditor';
import { getSettings, updateSetting } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { defaultWebsiteBuilderPages, WebsiteBuilderPages, serializeBuilderJson, WEBSITE_BUILDER_KEYS, parseWebsiteBuilderState } from '@/lib/website-builder';
function cloneValue<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
export default function BuilderPsbPage() {
  const { showToast } = useToast();
  const [pagesDraft, setPagesDraft] = useState<WebsiteBuilderPages>(defaultWebsiteBuilderPages);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const fetchData = useCallback(async () => {
    const s = await getSettings();
    const st = parseWebsiteBuilderState(Object.fromEntries(s.map(x => [x.key, x.value])));
    setPagesDraft(st.pagesDraft);
  }, []);
  useEffect(() => { void fetchData(); }, [fetchData]);
  const upload = async (t: string, f: File) => {
    setUploadingTarget(t);
    try { const fd=new FormData(); fd.append('image', f); const r=await fetch('/api/upload',{method:'POST',body:fd,credentials:'include'}); const j=await r.json(); return j.data?.url||j.url||''; } finally { setUploadingTarget(null); }
  };
  const persist = async (e: Array<[string,string]>) => { await Promise.all(e.map(([k,v])=>updateSetting(k,v))); };
  const handleSave = async () => {
    setIsSaving(true);
    try { const n=cloneValue(pagesDraft); await persist([[WEBSITE_BUILDER_KEYS.pagesDraft, serializeBuilderJson(n)]]); showToast('success','Draft psb tersimpan'); await fetchData(); } catch { showToast('error','Gagal simpan'); } finally { setIsSaving(false); }
  };
  const handlePublish = async () => {
    setIsPublishing(true);
    try { const n=cloneValue(pagesDraft); await persist([[WEBSITE_BUILDER_KEYS.pagesPublished, serializeBuilderJson(n)],[WEBSITE_BUILDER_KEYS.pagesDraft, serializeBuilderJson(n)]]); showToast('success','psb dipublish'); await fetchData(); } catch { showToast('error','Gagal publish'); } finally { setIsPublishing(false); }
  };
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Builder • PSB</p>
          <h1 className="mt-1 font-outfit text-2xl font-black capitalize">PSB — Halaman PSB</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola PSB via PageBuilderEditor — preview & save jelas, font Outfit halus.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/builder-preview/psb" target="_blank" className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-4 py-2.5 text-xs font-bold hover:bg-slate-50"><Eye size={14}/> Preview Draft</Link>
          <Link href="/psb" target="_blank" className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-4 py-2.5 text-xs font-bold hover:bg-slate-50"><ExternalLink size={14}/> Lihat Published</Link>
        </div>
      </div>
      <div className="mb-6 flex gap-2 rounded-xl bg-slate-50 p-4">
        <button onClick={handleSave} disabled={isSaving} className="rounded-lg border bg-white px-5 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50">Simpan Draft</button>
        <button onClick={handlePublish} disabled={isPublishing} className="rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-700 disabled:opacity-50">Publish</button>
      </div>
      <PageBuilderEditor pageKey="psb" pagesDraft={pagesDraft} onChange={setPagesDraft} onUploadImage={upload} uploadingTarget={uploadingTarget} />
    </div>
  );
}
