'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getStorageStatus, getStorageOverview, getStorageFolders, beginStorageOAuth,
  createStorageSource, updateStorageSource, deleteStorageSource, testStorageSource,
  startStorageSync, getStorageSyncStatus, deleteStorageAccount,
  StorageStatus, StorageOverview, StorageSource, StorageAccountRich, StorageFolder, StorageTotals, SyncRun,
} from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import {
  Cloud, Plus, RefreshCw, FolderOpen, ChevronRight, ChevronLeft, Trash2, CheckCircle2,
  XCircle, AlertTriangle, Loader2, Play, PlugZap, Pencil, FolderTree, Database, Images, ShieldCheck, Layers3, Wifi, Ban,
} from 'lucide-react';

const CATEGORIES = ['Umum', 'Fasilitas', 'Kegiatan', 'Santri', 'Event'];

function fmtTime(s: string | undefined | null) {
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return s;
  const d = new Date(s.replace(' ', 'T'));
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function statusBadge(status: string, extra?: string) {
  const base = 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border';
  switch (status) {
    case 'syncing':
      return <span className={`${base} bg-sky-50 text-sky-700 border-sky-200`}><Loader2 size={11} className="animate-spin" />{extra || 'Menyinkron'}</span>;
    case 'success':
      return <span className={`${base} bg-emerald-50 text-emerald-700 border-emerald-200`}><CheckCircle2 size={11} />{extra || 'Berhasil'}</span>;
    case 'error':
      return <span className={`${base} bg-rose-50 text-rose-700 border-rose-200`}><XCircle size={11} />{extra || 'Gagal'}</span>;
    case 'connected':
      return <span className={`${base} bg-emerald-50 text-emerald-700 border-emerald-200`}><Wifi size={11} />{extra || 'Terhubung'}</span>;
    case 'disabled':
      return <span className={`${base} bg-slate-100 text-slate-500 border-slate-200`}><Ban size={11} />{extra || 'Nonaktif'}</span>;
    case 'idle':
      return <span className={`${base} bg-slate-100 text-slate-500 border-slate-200`}>{extra || 'Belum disinkron'}</span>;
    default:
      return <span className={`${base} bg-slate-100 text-slate-500 border-slate-200`}>{extra || status}</span>;
  }
}

function StorageAdminPageContent() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [overview, setOverview] = useState<StorageOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actAccount, setActAccount] = useState<number | null>(null);

  // Wizard
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<'folder' | 'form'>('folder');
  const [browserAccount, setBrowserAccount] = useState<StorageAccountRich | null>(null);
  const [folders, setFolders] = useState<StorageFolder[]>([]);
  const [crumb, setCrumb] = useState<StorageFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<StorageFolder | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Kegiatan');
  const [wizardBusy, setWizardBusy] = useState(false);

  // source actions
  const [syncingIds, setSyncingIds] = useState<Set<number>>(new Set());
  const [syncProgress, setSyncProgress] = useState<Record<number, { files: number; added: number; errors: number; running: boolean }>>({});
  const [editSource, setEditSource] = useState<StorageSource | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editBusy, setEditBusy] = useState(false);
  const [deleteSource, setDeleteSource] = useState<StorageSource | null>(null);
  const [deleteKeepMedia, setDeleteKeepMedia] = useState(false);
  const [deleteAccount, setDeleteAccount] = useState<StorageAccountRich | null>(null);
  const [busyAccount, setBusyAccount] = useState<number | null>(null);
  const pollRef = useRef<number | null>(null);

  const fetchAll = useCallback(async () => {
    const [st, ov] = await Promise.all([
      getStorageStatus().catch(() => null),
      getStorageOverview().catch(() => null),
    ]);
    setStatus(st);
    setOverview(ov);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const refreshSyncStates = useCallback(async () => {
    if (syncingIds.size === 0) return;
    const running: number[] = [];
    const prog: Record<number, { files: number; added: number; errors: number; running: boolean }> = {};
    for (const id of Array.from(syncingIds)) {
      try {
        const res = await getStorageSyncStatus(id);
        if (res.job?.running) {
          running.push(id);
          prog[id] = { files: res.job.files_total || 0, added: res.job.added || 0, errors: res.job.errors || 0, running: true };
        } else {
          prog[id] = { files: res.job?.files_total || 0, added: res.job?.added || 0, errors: res.job?.errors || 0, running: false };
        }
      } catch { running.push(id); }
    }
    setSyncingIds(new Set(running));
    setSyncProgress(prog);
    if (running.length === 0) {
      fetchAll();
      return;
    }
  }, [syncingIds, fetchAll]);

  useEffect(() => {
    refreshSyncStates();
    if (syncingIds.size > 0) {
      pollRef.current = window.setInterval(refreshSyncStates, 3000);
      return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
    }
  }, [syncingIds, refreshSyncStates]);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const err = searchParams.get('error');
    if (connected) {
      showToast('success', 'Akun Google berhasil dihubungkan.');
      window.history.replaceState({}, '', '/admin/gallery/storage');
    }
    if (err) {
      showToast('error', decodeURIComponent(err));
      window.history.replaceState({}, '', '/admin/gallery/storage');
    }
  }, [searchParams, showToast]);

  const handleConnect = async () => {
    try {
      const res = await beginStorageOAuth();
      if (res?.auth_url) {
        window.open(res.auth_url, '_blank', 'noopener,noreferrer');
      } else {
        showToast('error', 'Tidak dapat membuat tautan OAuth.');
      }
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Gagal memulai OAuth.');
    }
  };

  const openWizard = async (acc: StorageAccountRich) => {
    setBrowserAccount(acc);
    setWizardStep('folder');
    setSelectedFolder(null);
    setCrumb([]);
    setWizardOpen(true);
    await loadFolders(acc.id, null);
  };

  const loadFolders = async (accID: number, parent: string | null) => {
    setActAccount(accID);
    try {
      const list = await getStorageFolders(accID, parent || undefined);
      setFolders(list || []);
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Gagal memuat folder.');
    } finally {
      setActAccount(null);
    }
  };

  const openFolder = (accID: number, parent: string | null, folder?: StorageFolder) => {
    if (folder) {
      loadFolders(accID, folder.id);
    } else {
      loadFolders(accID, null);
    }
    setCrumb((prev) => {
      if (!folder) return [];
      return [...prev, folder];
    });
    setSelectedFolder(folder || null);
  };

  const goToRoot = () => {
    setCrumb([]);
    setSelectedFolder(null);
    loadFolders(browserAccount!.id, null);
  };

  const goBackCrumb = (index: number) => {
    const path = crumb.slice(0, index);
    setCrumb(path);
    const last = path.length ? path[path.length - 1] : null;
    setSelectedFolder(last?.id ? last : null);
    loadFolders(browserAccount!.id, last ? last.id : null);
  };

  const saveSource = async (testFirst: boolean) => {
    if (!browserAccount || !selectedFolder) return;
    if (!formName.trim()) { showToast('error', 'Nama sumber wajib diisi.'); return; }
    setWizardBusy(true);
    try {
      await createStorageSource(browserAccount.id, {
        name: formName.trim(),
        root_folder_id: selectedFolder.id,
        category: formCategory,
        test_first: testFirst,
      });
      showToast('success', testFirst ? 'Sumber dibuat dan koneksi terverifikasi.' : 'Sumber data berhasil dibuat.');
      setWizardOpen(false);
      setFormName('');
      const ov = await getStorageOverview();
      setOverview(ov);
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Gagal menyimpan sumber.');
    } finally {
      setWizardBusy(false);
    }
  };

  const handleSync = async (src: StorageSource) => {
    try {
      await startStorageSync(src.id);
      setSyncingIds((prev) => new Set(prev).add(src.id));
      setSyncProgress((prev) => ({ ...prev, [src.id]: { files: 0, added: 0, errors: 0, running: true } }));
      showToast('success', 'Sinkronisasi dimulai. Foto dari Google Drive akan disalin ke galeri.');
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Gagal memulai sinkronisasi.');
      fetchAll();
    }
  };

  const handleTest = async (src: StorageSource) => {
    setBusyAccount(src.id);
    try {
      await testStorageSource(src.id);
      showToast('success', 'Koneksi Google Drive berhasil.');
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Tes koneksi gagal.');
    } finally {
      setBusyAccount(null);
      fetchAll();
    }
  };

  const toggleEnable = async (src: StorageSource) => {
    try {
      await updateStorageSource(src.id, { sync_enabled: !src.sync_enabled });
      fetchAll();
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Gagal memperbarui sumber.');
    }
  };

  const openEdit = (src: StorageSource) => {
    setEditSource(src);
    setEditName(src.name);
    setEditCategory(src.category);
  };

  const saveEdit = async () => {
    if (!editSource) return;
    setEditBusy(true);
    try {
      await updateStorageSource(editSource.id, { name: editName.trim(), category: editCategory });
      showToast('success', 'Sumber data diperbarui.');
      setEditSource(null);
      fetchAll();
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Gagal memperbarui sumber.');
    } finally {
      setEditBusy(false);
    }
  };

  const confirmDeleteSource = async () => {
    if (!deleteSource) return;
    setBusyAccount(deleteSource.id);
    try {
      await deleteStorageSource(deleteSource.id, deleteKeepMedia);
      showToast('success', deleteKeepMedia ? 'Sumber dihapus. Foto galeri dipertahankan.' : 'Sumber dan fotonya dihapus dari galeri.');
      setDeleteSource(null);
      fetchAll();
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Gagal menghapus sumber.');
    } finally {
      setBusyAccount(null);
    }
  };

  const confirmDeleteAccount = async () => {
    if (!deleteAccount) return;
    setBusyAccount(deleteAccount.id);
    try {
      await deleteStorageAccount(deleteAccount.id);
      showToast('success', 'Akun Google dan semua sumbernya dihapus.');
      setDeleteAccount(null);
      fetchAll();
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Gagal menghapus akun.');
    } finally {
      setBusyAccount(null);
    }
  };

  const totals: StorageTotals | undefined = overview?.totals;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight">Galeri Google Drive</h1>
          <p className="text-slate-500 text-sm font-medium max-w-2xl">
            Hubungkan akun Google, pilih folder galeri, lalu sinkronkan foto ke situs secara otomatis. Data tersimpan di server — token tidak pernah tampil di layar.
          </p>
        </div>
        <button
          onClick={handleConnect}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-lg font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
        >
          <PlugZap size={20} />
          <span>Hubungkan Akun Google</span>
        </button>
      </div>

      {/* OAuth not configured banner */}
      {status && !status.configured && (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-6 flex flex-col md:flex-row gap-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-black text-amber-900 uppercase tracking-tight text-sm">Google OAuth belum dikonfigurasi</h3>
            <p className="text-amber-800/80 text-sm font-medium mt-1 leading-relaxed">
              Atur variabel lingkungan backend <code className="px-1.5 py-0.5 bg-amber-100 rounded">GOOGLE_CLIENT_ID</code> dan{' '}
              <code className="px-1.5 py-0.5 bg-amber-100 rounded">GOOGLE_CLIENT_SECRET</code> (Google Cloud Console → OAuth 2.0 Client ID), tambahkan
              redirect URI <code className="px-1.5 py-0.5 bg-amber-100 rounded">{status.redirect_uri}</code>, aktifkan Google Drive API, lalu restart backend.
            </p>
          </div>
        </div>
      )}

      {/* Totals */}
      {totals && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Cloud size={20} />, label: 'Akun Terhubung', value: totals.accounts, tint: 'bg-sky-50 text-sky-700 border-sky-100' },
            { icon: <FolderTree size={20} />, label: 'Sumber Data', value: totals.sources, tint: 'bg-violet-50 text-violet-700 border-violet-100' },
            { icon: <Images size={20} />, label: 'Foto Tersinkron', value: totals.synced_media, tint: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
            { icon: <Database size={20} />, label: 'Total Galeri', value: totals.media, tint: 'bg-slate-100 text-slate-700 border-slate-200' },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${c.tint}`}>{c.icon}</div>
              <div>
                <p className="text-2xl font-black text-slate-900">{c.value}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{c.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Accounts */}
      {isLoading ? (
        <div className="py-32 text-center uppercase font-black text-slate-300 tracking-[0.3em] animate-pulse">Memuat Storage...</div>
      ) : !overview || (overview.accounts?.length || 0) === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-8 py-20 text-center">
          <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Cloud className="text-emerald-400" size={48} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tight">Belum Ada Akun Google</h3>
          <p className="text-slate-400 max-w-md mx-auto text-sm font-medium leading-relaxed">
            Hubungkan akun Google Drive untuk mulai mengelola galeri foto. Anda dapat menambahkan beberapa akun dan memilih folder berbeda untuk tiap album.
          </p>
          <button
            onClick={handleConnect}
            className="mt-8 inline-flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
          >
            <PlugZap size={20} />
            Hubungkan Akun Google
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {overview.accounts.map((acc) => (
            <div key={acc.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/60">
                <div className="flex items-center gap-4">
                  {acc.avatar_url ? (
                    <img src={acc.avatar_url} alt="" className="w-12 h-12 rounded-full border border-emerald-100" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black">
                      {(acc.name || 'G').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">{acc.name || 'Akun Google'}</h3>
                      {statusBadge(acc.status === 'active' ? 'connected' : 'disabled', acc.status === 'active' ? 'Aktif' : 'Nonaktif')}
                    </div>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">{acc.account_email}</p>
                    {acc.error_message && <p className="text-[11px] font-medium text-rose-500 mt-1 max-w-xl truncate">{acc.error_message}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openWizard(acc)}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                  >
                    <Plus size={16} /> Tambah Sumber
                  </button>
                  <button
                    onClick={() => setDeleteAccount(acc)}
                    className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    title="Hapus Akun"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {acc.sources.length === 0 ? (
                <div className="px-8 py-10 text-center">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Belum ada sumber data. Klik "Tambah Sumber" untuk memilih folder galeri.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {acc.sources.map((src) => {
                    const progress = syncProgress[src.id];
                    const syncing = syncingIds.has(src.id) || (progress?.running ?? false);
                    return (
                      <div key={src.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:bg-slate-50/50 transition-colors">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h4 className="font-black text-slate-900 uppercase tracking-tight truncate">{src.name}</h4>
                            {syncing ? statusBadge('syncing', 'Menyinkron') : statusBadge(src.status === 'success' ? 'success' : src.status === 'connected' ? 'connected' : src.status === 'error' ? 'error' : (src.sync_enabled ? 'idle' : 'disabled'))}
                            {!src.sync_enabled && <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sinkronisasi dimatikan</span>}
                          </div>
                          <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                            <FolderOpen size={12} className="text-emerald-500" /> Folder: {src.root_folder_id}
                          </p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            <span className="inline-flex items-center gap-1.5"><Layers3 size={12} className="text-violet-400" />{src.category}</span>
                            <span className="inline-flex items-center gap-1.5"><Images size={12} className="text-emerald-400" />{src.media_count ?? 0} foto</span>
                            {src.last_sync_at && <span className="inline-flex items-center gap-1.5"><RefreshCw size={12} /> Sync {fmtTime(src.last_sync_at)}</span>}
                          </div>
                          {progress && (syncing || progress.files > 0 || progress.added > 0) && (
                            <div className="mt-3 flex items-center gap-4 text-[11px] font-black text-slate-600">
                              <span className="inline-flex items-center gap-1.5"><RefreshCw size={13} className={syncing ? 'animate-spin text-sky-500' : 'text-slate-300'} />{progress.files || 0} file</span>
                              <span className="inline-flex items-center gap-1.5 text-emerald-600">+{progress.added || 0} baru</span>
                              {progress.errors ? <span className="inline-flex items-center gap-1.5 text-rose-500">! {progress.errors} gagal</span> : null}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <button
                            onClick={() => handleSync(src)}
                            disabled={syncing || !src.sync_enabled}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-600/10"
                          >
                            <Play size={14} /> Sync Sekarang
                          </button>
                          <button
                            onClick={() => handleTest(src)}
                            disabled={busyAccount === src.id}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-[10px] font-black text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-40 uppercase tracking-widest transition-all"
                          >
                            {busyAccount === src.id ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Tes
                          </button>
                          <button
                            onClick={() => toggleEnable(src)}
                            disabled={syncing}
                            className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title={src.sync_enabled ? 'Nonaktifkan Sinkronisasi' : 'Aktifkan Sinkronisasi'}
                          >
                            <Ban size={16} className={!src.sync_enabled ? 'text-amber-500' : ''} />
                          </button>
                          <button
                            onClick={() => openEdit(src)}
                            className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Edit Sumber"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => { setDeleteSource(src); setDeleteKeepMedia(true); }}
                            className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            title="Hapus Sumber"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Folder picker wizard */}
      {wizardOpen && browserAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xl" onClick={() => !wizardBusy && setWizardOpen(false)}></div>
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 px-7 py-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200">Tambah Sumber Baru</p>
                <h3 className="text-white font-black uppercase tracking-tight text-lg mt-1">
                  {wizardStep === 'folder' ? 'Pilih Folder Google Drive' : 'Nama Album & Kategori'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {wizardStep === 'form' && (
                  <button onClick={() => setWizardStep('folder')} className="p-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all">
                    <ChevronLeft size={18} />
                  </button>
                )}
                <button onClick={() => !wizardBusy && setWizardOpen(false)} className="p-2.5 bg-white/10 text-white rounded-lg hover:bg-rose-500 transition-all">
                  <XCircle size={18} />
                </button>
              </div>
            </div>

            {wizardStep === 'folder' ? (
              <div className="p-7">
                <div className="flex items-center gap-2 text-xs font-black text-slate-500 flex-wrap mb-5">
                  <button onClick={goToRoot} className="inline-flex items-center gap-1 hover:text-emerald-600">
                    <FolderTree size={14} /> Drive Saya
                  </button>
                  {crumb.map((c, i) => (
                    <React.Fragment key={c.id}>
                      <ChevronRight size={14} className="text-slate-300" />
                      <button onClick={() => goBackCrumb(i + 1)} className="hover:text-emerald-600 truncate max-w-[180px]">{c.name}</button>
                    </React.Fragment>
                  ))}
                </div>

                {selectedFolder && (
                  <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <FolderOpen size={18} className="text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-black text-emerald-900 truncate">{selectedFolder.name}</p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{selectedFolder.id}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedFolder(null)} className="p-2 text-emerald-500 hover:text-rose-500"><XCircle size={16} /></button>
                  </div>
                )}

                <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {actAccount === browserAccount.id ? (
                    <div className="py-16 text-center text-xs font-black uppercase tracking-widest text-slate-300 animate-pulse">Memuat Folder...</div>
                  ) : folders.length === 0 ? (
                    <div className="py-16 text-center text-xs font-black uppercase tracking-widest text-slate-300">Tidak ada subfolder.</div>
                  ) : (
                    folders.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => openFolder(browserAccount!.id, null, f)}
                        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-emerald-50/60 transition-colors text-left group"
                      >
                        <FolderOpen size={18} className="text-amber-500 shrink-0" />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-black text-slate-800 truncate">{f.name}</span>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{f.id}</span>
                        </span>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                      </button>
                    ))
                  )}
                </div>

                <button
                  onClick={() => setWizardStep('form')}
                  disabled={!selectedFolder}
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-lg shadow-emerald-600/20"
                >
                  <ChevronRight size={18} /> Lanjut ke Detail Album
                </button>
              </div>
            ) : (
              <div className="p-7 space-y-5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Nama Album</label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Wisuda 2026"
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Kategori</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFormCategory(cat)}
                        className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${formCategory === cat ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-200'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                  Folder <span className="font-black text-emerald-700">{selectedFolder?.name}</span> akan disalin ke galeri situs.
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => saveSource(true)}
                    disabled={wizardBusy}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/20"
                  >
                    {wizardBusy ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} Simpan & Verifikasi
                  </button>
                  <button
                    onClick={() => saveSource(false)}
                    disabled={wizardBusy}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50 transition-all"
                  >
                    Simpan Saja
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit source modal */}
      {editSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xl" onClick={() => !editBusy && setEditSource(null)}></div>
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 px-7 py-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200">Edit Sumber</p>
                <h3 className="text-white font-black uppercase tracking-tight mt-1">Perbarui Album</h3>
              </div>
              <button onClick={() => !editBusy && setEditSource(null)} className="p-2.5 bg-white/10 text-white rounded-lg hover:bg-rose-500 transition-all"><XCircle size={18} /></button>
            </div>
            <div className="p-7 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Nama Album</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Kategori</label>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button
                onClick={saveEdit}
                disabled={editBusy}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/20"
              >
                {editBusy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete source dialog */}
      {deleteSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xl" onClick={() => !(busyAccount === deleteSource.id) && setDeleteSource(null)}></div>
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-rose-600 to-rose-800 px-7 py-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-200">Hapus Sumber</p>
                <h3 className="text-white font-black uppercase tracking-tight mt-1">Hapus "{deleteSource.name}"?</h3>
              </div>
              <button onClick={() => busyAccount !== deleteSource.id && setDeleteSource(null)} className="p-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all">
                <XCircle size={18} />
              </button>
            </div>
            <div className="p-7 space-y-5">
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                {deleteKeepMedia
                  ? `Sumber "${deleteSource.name}" akan dihapus dari daftar. Foto yang sudah tersinkron tetap ada di galeri.`
                  : `Seluruh foto album "${deleteSource.name}" akan ikut dihapus dari galeri publik. Tindakan ini permanen.`}
              </p>
              <label className="flex items-center gap-3 text-sm font-bold text-slate-600 cursor-pointer bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={deleteKeepMedia}
                  onChange={(e) => setDeleteKeepMedia(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-slate-200 text-emerald-600 focus:ring-emerald-500/20"
                />
                Pertahankan foto yang sudah tersinkron di galeri
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteSource(null)}
                  disabled={busyAccount === deleteSource.id}
                  className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDeleteSource}
                  disabled={busyAccount === deleteSource.id}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 disabled:opacity-50 transition-all shadow-lg shadow-rose-600/20"
                >
                  {busyAccount === deleteSource.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete account dialog */}
      <ConfirmDialog
        isOpen={!!deleteAccount}
        onClose={() => setDeleteAccount(null)}
        onConfirm={confirmDeleteAccount}
        isLoading={busyAccount === deleteAccount?.id}
        title="Hapus Akun Google?"
        message={`Akun "${deleteAccount?.account_email}" beserta ${deleteAccount?.sources?.length || 0} sumber data akan dihapus. Semua foto hasil sinkronisasi dari akun ini akan dihapus dari galeri.`}
        confirmText="Ya, Hapus Akun"
      />
    </>
  );
}

export default function StorageAdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <StorageAdminPageContent />
    </Suspense>
  );
}