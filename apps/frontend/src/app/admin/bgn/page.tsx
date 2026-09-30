'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getBgnRecipients,
  getBgnAllForExport,
  getBgnStats,
  getBgnSantriOptions,
  createBgnRecipient,
  updateBgnRecipient,
  deleteBgnRecipient,
  importBgnRecipients,
  linkBgnSantri,
  BgnRecipient,
  BgnRecipientInput,
  BgnSantriOption,
  BgnStats
} from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { exportToExcel, exportToPDF } from '@/lib/export';
import {
  Plus, Search, X, Pencil, Trash2, Upload, RefreshCw, Apple,
  Users, GraduationCap, UserCog, UserCheck, UserX,
  FileSpreadsheet, FileText, Link2, Unlink, ChevronLeft, ChevronRight
} from 'lucide-react';

const PAGE_SIZE = 25;

const POSITION_LABEL: Record<string, string> = {
  santri: 'Santri',
  guru: 'Guru',
  tendik: 'Tendik'
};

const POSITION_BADGE: Record<string, string> = {
  santri: 'bg-sky-50 text-sky-700 border-sky-100',
  guru: 'bg-violet-50 text-violet-700 border-violet-100',
  tendik: 'bg-amber-50 text-amber-700 border-amber-100'
};

interface BgnForm {
  identity: string;
  name: string;
  birth_date: string;
  gender: string;
  parent_name: string;
  position: string;
  status: boolean;
}

const EMPTY_FORM: BgnForm = {
  identity: '',
  name: '',
  birth_date: '',
  gender: 'L',
  parent_name: '',
  position: 'santri',
  status: true
};

function StatsCard({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: string }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${tone}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-slate-900 font-outfit leading-tight">{value}</p>
      </div>
    </div>
  );
}

function BgnAdminPageContent() {
  const [items, setItems] = useState<BgnRecipient[]>([]);
  const [stats, setStats] = useState<BgnStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Filter & search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // Link ke data Santri
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState<BgnRecipient | null>(null);
  const [linkQuery, setLinkQuery] = useState('');
  const [linkOptions, setLinkOptions] = useState<BgnSantriOption[]>([]);
  const [isLinking, setIsLinking] = useState(false);

  // Modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<BgnForm>(EMPTY_FORM);
  const [importText, setImportText] = useState('');

  const { showToast } = useToast();
  const router = useRouter();

  const fetchStats = useCallback(async () => {
    const s = await getBgnStats();
    if (s) setStats(s);
  }, []);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    const res = await getBgnRecipients({
      search: searchQuery || undefined,
      position: filterPosition,
      status: filterStatus,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE
    });
    setItems(res.items);
    setTotal(res.total);
    setIsLoading(false);
  }, [searchQuery, filterPosition, filterStatus, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Reset ke halaman 1 whenever filter berubah agar tidak nyangkut di halaman kosong.
  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterPosition, filterStatus]);

  // Jaga agar page tidak melewati batas setelah total berubah.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const openEdit = (it: BgnRecipient) => {
    setForm({
      identity: it.identity || '',
      name: it.name,
      birth_date: it.birth_date || '',
      gender: it.gender || 'L',
      parent_name: it.parent_name || '',
      position: it.position,
      status: it.status
    });
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('error', 'Nama penerima wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = { ...form, position: form.position === '' ? 'santri' : form.position };
      const res = isEditing && selectedId
        ? await updateBgnRecipient(selectedId, payload)
        : await createBgnRecipient(payload);
      if (res.success) {
        showToast('success', isEditing ? 'Data BGN berhasil diperbarui.' : 'Data BGN berhasil ditambahkan.');
        setIsFormOpen(false);
        fetchItems();
        fetchStats();
      } else {
        const msg = res.errors?.length ? res.errors[0] : res.message;
        showToast('error', msg || 'Gagal menyimpan data BGN.');
      }
    } catch (error) {
      showToast('error', 'Gagal menyimpan data BGN.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsDeleting(true);
    try {
      const res = await deleteBgnRecipient(selectedId);
      if (res.success) {
        showToast('success', 'Data BGN berhasil dihapus.');
        setItems((prev) => prev.filter((it) => it.id !== selectedId));
        fetchStats();
      } else {
        showToast('error', res.message || 'Gagal menghapus data BGN.');
      }
    } catch (error) {
      showToast('error', 'Gagal menghapus data BGN.');
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  const handleImport = async () => {
    const lines = importText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
    if (lines.length === 0) {
      showToast('error', 'Tempel dulu baris data, atau kosongkan.');
      return;
    }

    const parsed: BgnRecipientInput[] = [];
    let badLine = -1;
    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(';').map((p) => p.trim());
      if (parts.length < 4) {
        badLine = i + 1;
        break;
      }
      const [identity, name, birth_date, ...rest] = parts;
      let gender = (parts[3] || '').toUpperCase();
      let parent_name = (parts[4] || '').replace(/^[\s,;]+|[\s,;]+$/g, '');
      let position = (parts[5] || '').toLowerCase();
      let statusText = (parts[6] || 'true').toLowerCase();
      if (gender === '392') gender = 'L';
      if (gender === '64') gender = 'P';
      if (position === '1' || position === 'penerima' || position === 'santri') position = 'santri';
      else if (position === '2' || position === 'guru') position = 'guru';
      else if (position === '3' || position === 'tendik') position = 'tendik';

      parsed.push({
        identity: identity || '',
        name: name || '',
        birth_date,
        gender,
        parent_name,
        position,
        status: statusText === 'true' || statusText === '1' || statusText === 'aktif'
      });
    }
    if (badLine !== -1) {
      showToast('error', `Baris ke-${badLine} tidak valid. Pastikan format diisi lengkap.`);
      return;
    }

    setIsImporting(true);
    try {
      const res = await importBgnRecipients(parsed);
      if (res.success) {
        showToast('success', res.message || 'Import berhasil.');
        setIsImportOpen(false);
        setImportText('');
        fetchItems();
        fetchStats();
      } else {
        showToast('error', res.message || 'Gagal mengimport data BGN.');
      }
    } catch (error) {
      showToast('error', 'Gagal mengimport data BGN.');
    } finally {
      setIsImporting(false);
    }
  };

  const genderLabel = (g: string) =>
    g === 'P' ? 'Perempuan' : g === 'L' ? 'Laki-laki' : '-';

  const POSITION_EXPORT_LABEL: Record<string, string> = {
    santri: 'Santri', guru: 'Guru', tendik: 'Tendik'
  };

  const exportTitle = (() => {
    const parts: string[] = [];
    if (filterPosition !== 'all') parts.push(`Posisi ${POSITION_EXPORT_LABEL[filterPosition] || filterPosition}`);
    if (filterStatus !== 'all') parts.push(`Status ${filterStatus === 'aktif' ? 'Aktif' : 'Nonaktif'}`);
    if (searchQuery) parts.push(`Cari "${searchQuery}"`);
    return parts.length ? `Penerima BGN${parts.length ? ' (' + parts.join(', ') + ')' : ''}` : 'Penerima BGN';
  })();

  const buildExportRows = (rows: BgnRecipient[]): (string | number)[][] =>
    rows.map((r, i) => [
      i + 1,
      r.name,
      r.identity || '-',
      r.birth_date || '-',
      genderLabel(r.gender),
      r.parent_name || '-',
      POSITION_EXPORT_LABEL[r.position] || r.position,
      r.status ? 'Aktif' : 'Nonaktif',
      r.santri_id ? `${r.santri_name} (${r.santri_class || '-'})` : '-'
    ]);

  const EXPORT_COLUMNS = ['No', 'Nama', 'NISN/NIK', 'Tgl Lahir', 'JK', 'Orang Tua', 'Posisi', 'Status', 'Data Santri'];

  const handleExport = async (format: 'excel' | 'pdf') => {
    setIsExporting(true);
    try {
      const rows = await getBgnAllForExport({
        search: searchQuery || undefined,
        position: filterPosition,
        status: filterStatus
      });
      if (rows.length === 0) {
        showToast('error', 'Tidak ada data untuk diekspor.');
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === 'excel') {
        await exportToExcel(exportTitle, EXPORT_COLUMNS, buildExportRows(rows), `Penerima-BGN-${stamp}`);
      } else {
        await exportToPDF(exportTitle, EXPORT_COLUMNS, buildExportRows(rows), `Penerima-BGN-${stamp}`);
      }
      showToast('success', `${rows.length} baris berhasil diekspor ke ${format.toUpperCase()}.`);
    } catch {
      showToast('error', 'Gagal mengekspor data BGN.');
    } finally {
      setIsExporting(false);
    }
  };

  const openLink = (it: BgnRecipient) => {
    setLinkTarget(it);
    setLinkQuery('');
    setLinkOptions([]);
    setIsLinkOpen(true);
  };

  useEffect(() => {
    if (!isLinkOpen) return;
    const timer = setTimeout(async () => {
      const opts = await getBgnSantriOptions(linkQuery);
      setLinkOptions(opts);
    }, 350);
    return () => clearTimeout(timer);
  }, [isLinkOpen, linkQuery]);

  const handleLink = async (santriId: number) => {
    if (!linkTarget) return;
    setIsLinking(true);
    try {
      const res = await linkBgnSantri(linkTarget.id, santriId);
      if (res.success) {
        showToast('success', res.message || 'Tautan berhasil disimpan.');
        setIsLinkOpen(false);
        fetchItems();
        fetchStats();
      } else {
        showToast('error', res.message || 'Gagal menautkan data BGN.');
      }
    } catch {
      showToast('error', 'Gagal menautkan data BGN.');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Apple size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight font-outfit">Penerima BGN</h1>
            <p className="text-slate-400 text-sm font-bold">Beras Bergizi Nasional — Penerima Manfaat Pondok Pesantren Al-Maa Parung</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleExport('excel')}
            disabled={isExporting || total === 0}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Export daftar penerima ke Excel"
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting || total === 0}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Export daftar penerima ke PDF"
          >
            <FileText size={16} /> PDF
          </button>
          <button
            onClick={() => { setImportText(''); setIsImportOpen(true); }}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
          >
            <Upload size={16} /> Import
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-sky-600 transition-all"
          >
            <Plus size={16} /> Tambah Penerima
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <StatsCard label="Total" value={stats.total} tone="bg-emerald-100 text-emerald-600" icon={<Apple size={22} />} />
          <StatsCard label="Santri" value={stats.santri} tone="bg-sky-100 text-sky-600" icon={<Users size={22} />} />
          <StatsCard label="Guru" value={stats.guru} tone="bg-violet-100 text-violet-600" icon={<GraduationCap size={22} />} />
          <StatsCard label="Tendik" value={stats.tendik} tone="bg-amber-100 text-amber-600" icon={<UserCog size={22} />} />
          <StatsCard label="Aktif" value={stats.active} tone="bg-green-100 text-green-600" icon={<UserCheck size={22} />} />
          <StatsCard label="Nonaktif" value={stats.inactive} tone="bg-rose-100 text-rose-600" icon={<UserX size={22} />} />
          <StatsCard label="Tertaut" value={stats.linked ?? 0} tone="bg-indigo-100 text-indigo-600" icon={<Link2 size={22} />} />
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            type="text"
            placeholder="Cari nama, NISN/NIK, atau orang tua..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
              <X size={16} />
            </button>
          )}
        </div>
        <select
          value={filterPosition}
          onChange={(e) => setFilterPosition(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
        >
          <option value="all">Semua Posisi</option>
          <option value="santri">Santri</option>
          <option value="guru">Guru</option>
          <option value="tendik">Tendik</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
        >
          <option value="all">Semua Status</option>
          <option value="aktif">Aktif Menerima</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
        <button
          onClick={() => { setSearchQuery(''); setFilterPosition('all'); setFilterStatus('all'); setPage(1); }}
          className="p-3 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:text-emerald-600 hover:border-emerald-200 transition-all"
          title="Reset filter"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400 font-black">
                <th className="text-left px-6 py-4">Nama</th>
                <th className="text-left px-6 py-4">NISN/NIK</th>
                <th className="text-left px-6 py-4">Tgl Lahir</th>
                <th className="text-left px-6 py-4">JK</th>
                <th className="text-left px-6 py-4">Orang Tua</th>
                <th className="text-left px-6 py-4">Posisi</th>
                <th className="text-left px-6 py-4">Status</th>
                <th className="text-right px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-bold">Memuat data...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <Apple className="text-slate-200" size={40} />
                  </div>
                  <p className="text-slate-400 font-bold">Belum ada data penerima BGN.</p>
                </td></tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id} className="border-t border-slate-50 hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-900">{it.name}</div>
                      {it.santri_id ? (
                        <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                          <Link2 size={10} /> {it.santri_class || 'Santri'} — {it.santri_name}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-500">{it.identity || '-'}</td>
                    <td className="px-6 py-4 text-slate-500 font-semibold">{it.birth_date || '-'}</td>
                    <td className="px-6 py-4 text-slate-500 font-semibold">{genderLabel(it.gender)}</td>
                    <td className="px-6 py-4 text-slate-500">{it.parent_name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border ${POSITION_BADGE[it.position] || POSITION_BADGE.santri}`}>
                        {POSITION_LABEL[it.position] || it.position}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border ${it.status ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        {it.status ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {it.position === 'santri' && (
                        <button
                          onClick={() => openLink(it)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title={it.santri_id ? `Taut ke: ${it.santri_name}` : 'Tautkan ke data Santri'}
                        >
                          {it.santri_id ? <Unlink size={16} /> : <Link2 size={16} />}
                        </button>
                        )}
                        <button
                          onClick={() => openEdit(it)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => { setSelectedId(it.id); setIsDeleteOpen(true); }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {total > PAGE_SIZE && (
          <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
              Menampilkan <strong className="text-slate-900">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)}</strong> Dari {total} DATA
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-[10px] font-black text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors uppercase tracking-widest shadow-sm"
              >
                <ChevronLeft size={16} /> Sebelumnya
              </button>
              <button
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-[10px] font-black text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors uppercase tracking-widest shadow-sm"
              >
                Selanjutnya <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Link ke data Santri Modal */}
      {isLinkOpen && linkTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsLinkOpen(false)}></div>
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <Link2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight font-outfit">Tautkan ke Santri</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{linkTarget.name}</p>
                </div>
              </div>
              <button onClick={() => setIsLinkOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-5">
              {linkTarget.santri_id ? (
                <div className="flex items-center justify-between gap-4 p-5 rounded-3xl bg-indigo-50 border border-indigo-100">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Saat ini tertaut ke</p>
                    <p className="font-black text-slate-900 truncate">{linkTarget.santri_name} <span className="text-slate-400 font-bold">({linkTarget.santri_class || '-'})</span></p>
                  </div>
                  <button
                    onClick={() => handleLink(0)}
                    disabled={isLinking}
                    className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-50 disabled:opacity-40 transition-all"
                  >
                    <Unlink size={14} /> Lepas Tautan
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 font-bold">
                  Belum tertaut ke data Santri. Tautan bersifat opsional — berguna agar penerima BGN bisa dicocokkan dengan data Santri di aplikasi.
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Cari Data Santri</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ketik nama atau NIK..."
                    value={linkQuery}
                    onChange={(e) => setLinkQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {linkOptions.length === 0 ? (
                  <p className="text-center text-slate-400 font-bold text-sm py-8">Data Santri tidak ditemukan.</p>
                ) : (
                  linkOptions.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => handleLink(o.id)}
                      disabled={isLinking}
                      className="w-full flex items-center justify-between gap-4 p-4 text-left rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 disabled:opacity-40 transition-all"
                    >
                      <span className="min-w-0">
                        <span className="block font-black text-slate-900 truncate">{o.name}</span>
                        <span className="block text-[10px] text-slate-400 font-black uppercase tracking-widest">
                          Kelas {o.class || '-'} {o.nik ? `• NIK ${o.nik}` : ''}
                        </span>
                      </span>
                      <Link2 size={16} className="shrink-0 text-indigo-500" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal (Add/Edit) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <Apple size={24} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-outfit">
                  {isEditing ? 'Edit Penerima' : 'Tambah Penerima BGN'}
                </h3>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama penerima manfaat"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-8 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">NISN / NIK</label>
                    <input
                      type="text"
                      maxLength={20}
                      placeholder="0123456789"
                      value={form.identity}
                      onChange={(e) => setForm({ ...form, identity: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Tanggal Lahir</label>
                    <input
                      type="text"
                      placeholder="DD-MM-YYYY"
                      value={form.birth_date}
                      onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Jenis Kelamin</label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                    >
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Posisi</label>
                    <select
                      value={form.position}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                    >
                      <option value="santri">Santri / Penerima</option>
                      <option value="guru">Guru</option>
                      <option value="tendik">Tendik</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Nama Orang Tua / Pengampu</label>
                  <input
                    type="text"
                    placeholder="Nama ayah/ibu/wali"
                    value={form.parent_name}
                    onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
                    className="w-full px-8 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold"
                  />
                </div>

                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${form.status ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                      {form.status ? <UserCheck size={18} /> : <UserX size={18} />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Status Menerima</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{form.status ? 'Aktif menerima' : 'Nonaktif / berhenti'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, status: !form.status })}
                    className={`w-14 h-8 rounded-full transition-all relative flex items-center px-1 ${form.status ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-all transform ${form.status ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex gap-4 pt-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    disabled={isSubmitting}
                    type="submit"
                    className="flex-[2] py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-emerald-100 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
                  >
                    {isSubmitting ? 'Sedang Memproses...' : (isEditing ? 'Simpan Perubahan' : 'Simpan Data')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsImportOpen(false)}></div>
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <Upload size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-outfit">Import Penerima BGN</h3>
                  <p className="text-slate-400 text-xs font-bold mt-1">NISN/NIK;Nama;Tgl Lahir (DD-MM-YYYY);JK (L/P);Orang Tua;Posisi (santri/guru/tendik);Status (true/false)</p>
                </div>
              </div>
              <button onClick={() => setIsImportOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <textarea
                rows={12}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={'3144900276;Aisyah Zahra;12-05-2012;P;Muhammad Yusuf;santri;true\n# baris contoh — hapus sebelum import'}
                className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-mono font-medium text-sm leading-relaxed"
              />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-3 px-1">
                Baris duplikat (NISN/NIK sama) akan diperbarui otomatis, baris kosong/berkomentar (#) dilewati.
              </p>
              <div className="flex gap-4 pt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  disabled={isImporting}
                  onClick={handleImport}
                  className="flex-[2] py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-emerald-100 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
                >
                  {isImporting ? 'Mengimport...' : 'Import Sekarang'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => !isDeleting && setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Data Penerima"
        message="Data penerima BGN akan dihapus permanen. Lanjutkan?"
        confirmText={isDeleting ? 'Menghapus...' : 'Hapus'}
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default function BgnAdminPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 font-bold">Memuat...</div>}>
      <BgnAdminPageContent />
    </Suspense>
  );
}