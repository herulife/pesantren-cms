'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ConfirmDialog';
import SelectField from '@/components/SelectField';
import { useToast } from '@/components/Toast';
import {
  getSantriList,
  getSantriClasses,
  deleteSantri,
  bulkDeleteSantri,
  purgeSantri,
  exportSantri,
  setSantriClass,
  getSchoolClasses,
  createSchoolClass,
  updateSchoolClass,
  deleteSchoolClass,
  getSchoolYears,
  createSchoolYear,
  updateSchoolYear,
  activateSchoolYear,
  deleteSchoolYear,
  Santri,
} from '@/lib/api';
import { exportToPDF, exportToExcel } from '@/lib/export';
import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Import,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'lulus', label: 'Lulus' },
  { value: 'pindah', label: 'Pindah' },
  { value: 'cuti', label: 'Cuti' },
];

const PAGE_SIZE = 20;

const filterCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-400/10';

function genderLabel(g: string) {
  if (g === 'l') return 'Laki-laki';
  if (g === 'p') return 'Perempuan';
  return g || '-';
}

type TabKey = 'santri' | 'classes' | 'years';

export default function KesantrianPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { hasRole } = useAuth();

  // Check if user has access
  const canAccess = hasRole('superadmin', 'panitia_psb', 'wali_kelas', 'pimpinan');
  const canManageMaster = hasRole('superadmin');

  const [activeTab, setActiveTab] = useState<TabKey>('santri');
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classOptionsFromApi, setClassOptionsFromApi] = useState<string[]>([]);
  const [items, setItems] = useState<Santri[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<null | { mode: 'single' | 'bulk'; id?: number }>(null);
  const [confirmPurge, setConfirmPurge] = useState<Santri | null>(null);
  const [purging, setPurging] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Master classes
  const [schoolClasses, setSchoolClasses] = useState<any[]>([]);
  const [className, setClassName] = useState('');
  const [classJenjang, setClassJenjang] = useState('');
  const [editingClass, setEditingClass] = useState<any | null>(null);
  const [savingClass, setSavingClass] = useState(false);
  const [deletingClass, setDeletingClass] = useState(false);

  // Master years
  const [schoolYears, setSchoolYears] = useState<any[]>([]);
  const [yearName, setYearName] = useState('');
  const [yearStart, setYearStart] = useState('');
  const [yearEnd, setYearEnd] = useState('');
  const [editingYear, setEditingYear] = useState<any | null>(null);
  const [savingYear, setSavingYear] = useState(false);

  const classOptions: any[] = [{ value: "", label: "Semua Kelas" }, ...classOptionsFromApi.map((c: string) => ({ value: c, label: c }))];

  const loadClasses = useCallback(async () => {
    try {
      const classes = await getSantriClasses();
      setClassOptionsFromApi(classes as string[]);
    } catch (e) {
      // ignore
    }
  }, []);

  const load = useCallback(async (opts?: { search?: string; class?: string; status?: string; offset?: number }) => {
    setLoading(true);
    const res = await getSantriList({
      search: opts?.search !== undefined ? opts.search : search,
      class: opts?.class !== undefined ? opts.class : classFilter,
      status: opts?.status !== undefined ? opts.status : statusFilter,
      limit: PAGE_SIZE,
      offset: opts?.offset !== undefined ? opts.offset : offset,
    });
    setItems(res.data);
    setTotal(res.total);
    setOffset(opts?.offset ?? offset);
    setSelected(new Set());
    setLoading(false);
  }, [search, classFilter, statusFilter, offset]);

  const applyQuery = useCallback(() => {
    const searchText = search.trim();
    load({ search: searchText, offset: 0 });
  }, [load, search]);

  useEffect(() => {
    if (!canAccess) return;
    loadClasses();
  }, [loadClasses, canAccess]);

  useEffect(() => {
    if (!canAccess) return;
    load({ offset });
  }, [offset, load, canAccess]);

  useEffect(() => {
    if (!canAccess) return;
    const t = setTimeout(() => {
      applyQuery();
    }, 300);
    return () => clearTimeout(t);
  }, [search, applyQuery, canAccess]);

  useEffect(() => {
    if (!canAccess) return;
    load({ class: classFilter, status: statusFilter, offset: 0 });
  }, [classFilter, statusFilter, load, canAccess]);

  const handleExport = async (format: 'pdf' | 'excel', mode: 'all' | 'selected') => {
    setExporting(true);
    try {
      const all = await exportSantri();
      const sumber = mode === 'selected' ? all.filter((s) => selected.has(s.id)) : all;
      if (sumber.length === 0) {
        showToast('error', 'Tidak ada data untuk diexport.');
        return;
      }
      const rows = sumber.map((s) => [
        s.nis,
        s.name,
        s.nickname || '-',
        genderLabel(s.gender),
        s.class,
        s.angkatan || '-',
        s.status,
        s.parent_name || '-',
        s.parent_phone || '-',
      ]);
      const columns = ['NIS', 'Nama', 'Panggilan', 'Kelamin', 'Kelas', 'Angkatan', 'Status', 'Nama Wali', 'No. HP Wali'];
      const scope = mode === 'selected' ? ` (${sumber.length} dipilih)` : '';
      if (format === 'pdf') {
        await exportToPDF(`Data Santri${scope}`, columns, rows, `Data-Santri-${Date.now()}`);
      } else {
        await exportToExcel(`Data Santri${scope}`, columns, rows, `Data-Santri-${Date.now()}`);
      }
      showToast('success', `${sumber.length} data santri berhasil diexport ke ${format.toUpperCase()}`);
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Gagal menyiapkan data export.');
    } finally {
      setExporting(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (selected.size === items.length && items.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.id)));
    }
  };

  const deleteSingle = async (id: number) => {
    setDeleting(true);
    try {
      const res = await deleteSantri(id);
      if (res.ok) {
        showToast('success', 'Santri berhasil dihapus.');
        load();
      } else {
        showToast('error', res.message || 'Gagal menghapus santri.');
      }
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Gagal menghapus santri.');
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  const deleteBulk = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    setDeleting(true);
    try {
      const res = await bulkDeleteSantri(ids);
      if (res.ok) {
        showToast('success', `${ids.length} santri berhasil dihapus.`);
        setSelected(new Set());
        load();
      } else {
        showToast('error', res.message || 'Gagal menghapus santri.');
      }
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Gagal menghapus santri.');
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  const purgeSingle = async () => {
    if (!confirmPurge) return;
    setPurging(true);
    try {
      const res = await purgeSantri(confirmPurge.id);
      if (res.ok) {
        showToast('success', 'Santri berhasil dihapus permanen.');
        setConfirmPurge(null);
        load();
      } else {
        showToast('error', res.message || 'Gagal menghapus permanen.');
      }
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Gagal menghapus permanen.');
    } finally {
      setPurging(false);
    }
  };

  const loadMasterClasses = async () => {
    const data = await getSchoolClasses();
    setSchoolClasses(data);
  };

  const loadMasterYears = async () => {
    const data = await getSchoolYears();
    setSchoolYears(data);
  };

  useEffect(() => {
    if (activeTab === 'classes' && canManageMaster) loadMasterClasses();
    if (activeTab === 'years' && canManageMaster) loadMasterYears();
  }, [activeTab]);

  if (!canAccess) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center">
          <p className="text-base font-black text-rose-900">Akses ditolak</p>
        </div>
      </div>
    );
  }

  const pageCount = Math.ceil(total / PAGE_SIZE) || 1;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Data Santri</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola data santri, kelas dan tahun ajaran.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => router.push('/admin/kesantrian/import')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
            <Import size={16} /> Import Excel
          </button>
          <button onClick={() => handleExport('excel', 'all')} disabled={exporting} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
            <FileSpreadsheet size={16} /> Export Excel
          </button>
          <button onClick={() => handleExport('pdf', 'all')} disabled={exporting} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
            <FileText size={16} /> Export PDF
          </button>
          <button onClick={() => router.push('/admin/kesantrian/form')} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700">
            <Plus size={16} /> Tambah Santri
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setActiveTab('santri')} className={`px-5 py-2 text-xs font-black uppercase ${activeTab === 'santri' ? 'border-b-2 border-sky-600 text-sky-600' : 'text-slate-500'}`}>
          <Users size={14} className="inline mr-1" /> Data Santri
        </button>
        {canManageMaster && (
          <button onClick={() => setActiveTab('classes')} className={`px-5 py-2 text-xs font-black uppercase ${activeTab === 'classes' ? 'border-b-2 border-sky-600 text-sky-600' : 'text-slate-500'}`}>
            <BookOpen size={14} className="inline mr-1" /> Kelas
          </button>
        )}
        {canManageMaster && (
          <button onClick={() => setActiveTab('years')} className={`px-5 py-2 text-xs font-black uppercase ${activeTab === 'years' ? 'border-b-2 border-sky-600 text-sky-600' : 'text-slate-500'}`}>
            <Calendar size={14} className="inline mr-1" /> Tahun Ajaran
          </button>
        )}
      </div>

      {activeTab === 'santri' && (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, NIS, wali atau panggilan..." className={filterCls + ' pl-9'} />
            </div>
            <div className="w-full md:w-56">
              <SelectField id="class-filter" label="" className="" value={classFilter} onChange={(v: any) => setClassFilter(v)} options={classOptions} placeholder="Semua Kelas" />
            </div>
            <div className="w-full md:w-56">
              <SelectField id="status-filter" label="" className="" value={statusFilter} onChange={(v: any) => setStatusFilter(v)} options={statusOptions as any} placeholder="Semua Status" />
            </div>
            <button onClick={() => load({ offset: 0 })} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
              <RefreshCw size={16} /> Muat Ulang
            </button>
          </div>

          {selected.size > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
              <p className="text-sm font-bold text-sky-900">{selected.size} santri dipilih</p>
              <div className="flex items-center gap-2">
                <button onClick={() => handleExport('excel', 'selected')} disabled={exporting} className="rounded-xl border border-sky-200 bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wider text-sky-700 hover:bg-sky-100">Export Excel</button>
                <button onClick={() => handleExport('pdf', 'selected')} disabled={exporting} className="rounded-xl border border-sky-200 bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wider text-sky-700 hover:bg-sky-100">Export PDF</button>
                <button onClick={() => setConfirmDelete({ mode: 'bulk' })} className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white hover:bg-rose-700">Hapus Terpilih</button>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">
                    <input type="checkbox" checked={items.length > 0 && selected.size === items.length} onChange={toggleAll} className="h-4 w-4 rounded border-slate-300 text-sky-600" />
                  </th>
                  <th className="px-4 py-3 font-bold">NIS</th>
                  <th className="px-4 py-3 font-bold">Nama</th>
                  <th className="px-4 py-3 font-bold">Kelas</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Wali</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="p-10 text-center text-slate-500">Memuat...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={7} className="p-10 text-center text-slate-500">Tidak ada data santri.</td></tr>
                ) : (
                  items.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3"><input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} className="h-4 w-4 rounded border-slate-300 text-sky-600" /></td>
                      <td className="px-4 py-3 font-semibold">{s.nis}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{s.name}</div>
                        <div className="text-xs text-slate-500">{s.nickname || '-'}</div>
                      </td>
                      <td className="px-4 py-3">{s.class || '-'}</td>
                      <td className="px-4 py-3">{s.status}</td>
                      <td className="px-4 py-3">
                        <div>{s.parent_name || '-'}</div>
                        <div className="text-xs text-slate-500">{s.parent_phone || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => router.push(`/admin/kesantrian/form?id=${s.id}`)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-sky-600"><Pencil size={16} /></button>
                          <button onClick={() => setConfirmDelete({ mode: 'single', id: s.id })} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">Menampilkan {items.length} dari {total} santri</p>
            <div className="flex items-center gap-2">
              <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-50">
                <ChevronLeft size={16} /> Sebelumnya
              </button>
              <span className="text-sm font-bold text-slate-700">Halaman {currentPage} / {pageCount}</span>
              <button disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-50">
                Berikutnya <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'classes' && canManageMaster && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <form onSubmit={async (e) => { e.preventDefault(); setSavingClass(true); try { await createSchoolClass({ name: className, jenjang: classJenjang }); showToast('success','Kelas ditambahkan'); setClassName(''); setClassJenjang(''); loadMasterClasses(); } catch (e: any) { showToast('error',e.message||'Gagal'); } finally { setSavingClass(false); }}} className="flex gap-2">
              <input value={className} onChange={(e)=>setClassName(e.target.value)} placeholder="Nama kelas (cth: VII-A)" className="border rounded-xl px-3 py-2 text-sm" />
              <input value={classJenjang} onChange={(e)=>setClassJenjang(e.target.value)} placeholder="Jenjang" className="border rounded-xl px-3 py-2 text-sm" />
              <button disabled={savingClass} className="bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-bold"><Plus size={16} className="inline mr-1" /> Tambah</button>
            </form>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50"><tr><th className="p-3 text-left">Nama</th><th className="p-3 text-left">Jenjang</th><th className="p-3 text-left">Aksi</th></tr></thead>
              <tbody>
                {schoolClasses.map((c: any) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-3">{c.name}</td>
                    <td className="p-3">{c.jenjang || '-'}</td>
                    <td className="p-3">
                      <button onClick={async () => { if(!confirm('Hapus kelas ini?')) return; await deleteSchoolClass(c.id); loadMasterClasses(); }} className="text-rose-600"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'years' && canManageMaster && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <form onSubmit={async (e) => { e.preventDefault(); setSavingYear(true); try { await createSchoolYear({ name: yearName, start_date: yearStart, end_date: yearEnd }); showToast('success','Tahun ajaran ditambahkan'); setYearName(''); setYearStart(''); setYearEnd(''); loadMasterYears(); } catch (e: any) { showToast('error',e.message||'Gagal'); } finally { setSavingYear(false); }}} className="flex gap-2 flex-wrap">
              <input value={yearName} onChange={(e)=>setYearName(e.target.value)} placeholder="cth: 2025/2026" className="border rounded-xl px-3 py-2 text-sm" />
              <input type="date" value={yearStart} onChange={(e)=>setYearStart(e.target.value)} className="border rounded-xl px-3 py-2 text-sm" />
              <input type="date" value={yearEnd} onChange={(e)=>setYearEnd(e.target.value)} className="border rounded-xl px-3 py-2 text-sm" />
              <button disabled={savingYear} className="bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-bold"><Plus size={16} className="inline mr-1" /> Tambah</button>
            </form>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50"><tr><th className="p-3 text-left">Tahun</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Aksi</th></tr></thead>
              <tbody>
                {schoolYears.map((y: any) => (
                  <tr key={y.id} className="border-t">
                    <td className="p-3">{y.name}</td>
                    <td className="p-3">{y.is_active ? <span className="text-emerald-600 font-bold">Aktif</span> : 'Tidak aktif'}</td>
                    <td className="p-3 flex gap-2">
                      {!y.is_active && <button onClick={async () => { await activateSchoolYear(y.id); loadMasterYears(); showToast('success','Diaktifkan'); }} className="text-sky-600 text-xs font-bold">Aktifkan</button>}
                      <button onClick={async () => { if(!confirm('Hapus tahun ajaran?')) return; await deleteSchoolYear(y.id); loadMasterYears(); }} className="text-rose-600"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => confirmDelete?.mode === 'single' && confirmDelete.id ? deleteSingle(confirmDelete.id) : deleteBulk()} title={confirmDelete?.mode === 'bulk' ? 'Hapus Santri Terpilih' : 'Hapus Santri'} message={confirmDelete?.mode === 'bulk' ? `Hapus ${selected.size} santri terpilih? Tindakan ini bisa dibatalkan dengan restore jika tersedia.` : 'Hapus santri ini?'} confirmText="Hapus" type="danger" isLoading={deleting} />
    </div>
  );
}
