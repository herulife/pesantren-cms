'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import {
  getSantriList,
  deleteSantri,
  bulkDeleteSantri,
  purgeSantri,
  getSantriPortalUsers,
  linkSantriUser,
  getAvailableSantriAccounts,
  linkSantriAccount,
  resetSantriPassword,
  Santri,
  normalizeApiAssetUrl,
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
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'lulus', label: 'Lulus' },
  { value: 'pindah', label: 'Pindah' },
  { value: 'cuti', label: 'Cuti' },
];

const PAGE_SIZE = 20;

export default function KesantrianPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [items, setItems] = useState<Santri[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<null | { mode: 'single' | 'bulk'; id?: number }>(null);
  const [confirmPurge, setConfirmPurge] = useState<Santri | null>(null);
  const [purging, setPurging] = useState(false);
  const [linkTarget, setLinkTarget] = useState<Santri | null>(null);
  const [userOptions, setUserOptions] = useState<{ id: number; name: string; email: string; role: string }[]>([]);
  const [linkUserId, setLinkUserId] = useState('');
  const [linking, setLinking] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (opts?: { search?: string; class?: string; status?: string; offset?: number }) => {
    setLoading(true);
    const res = await getSantriList({
      search: opts?.search !== undefined ? opts.search : search,
      class: opts?.class !== undefined ? opts.class : classFilter,
      status: opts?.status !== undefined ? opts.status : statusFilter,
      limit: PAGE_SIZE,
      offset: opts?.offset !== undefined ? opts.offset : offset,
    });
    setItems(res.items);
    setTotal(res.total);
    setOffset(opts?.offset ?? offset);
    setSelected(new Set());
    if (res.items.length > 0) {
      const classes = Array.from(new Set(res.items.map((i) => i.class).filter(Boolean))) as string[];
      setClassOptions((prev) => Array.from(new Set([...prev, ...classes])));
    }
    setLoading(false);
  }, [search, classFilter, statusFilter, offset]);

  const applyQuery = useCallback(() => {
    const searchText = search.trim();
    getSantriList({
      search: searchText,
      class: classFilter,
      status: statusFilter,
      limit: PAGE_SIZE,
      offset: 0,
    }).then((res) => {
      setItems(res.items);
      setTotal(res.total);
      setOffset(0);
      setSelected(new Set());
      if (res.items.length > 0) {
        const classes = Array.from(new Set(res.items.map((i) => i.class).filter(Boolean))) as string[];
        setClassOptions((prev) => Array.from(new Set([...prev, ...classes])));
      }
      setLoading(false);
    });
  }, [search, classFilter, statusFilter]);

  const applySearch = useCallback(() => {
    setLoading(true);
    applyQuery();
  }, [applyQuery]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const genderLabel = (g: string) => {
    if (g === 'l' || g === 'laki-laki') return 'L';
    if (g === 'p' || g === 'perempuan') return 'P';
    return g;
  };

  const getInitials = (name: string) => {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'aktif': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'lulus': return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'pindah': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'cuti': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const allSelected = items.length > 0 && items.every((i) => prev.has(i.id));
      if (allSelected) return new Set();
      return new Set(items.map((i) => i.id));
    });
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    if (confirmDelete.mode === 'single' && confirmDelete.id) {
      const ok = await deleteSantri(confirmDelete.id);
      if (ok) showToast('success', 'Santri berhasil dihapus');
      else showToast('error', 'Gagal menghapus santri');
    } else {
      const ids = Array.from(selected);
      const res = await bulkDeleteSantri(ids);
      if (res.ok) showToast('success', res.message || 'Santri terpilih berhasil dihapus');
      else showToast('error', res.message || 'Gagal menghapus santri terpilih');
    }
    setDeleting(false);
    setConfirmDelete(null);
    setSelected(new Set());
    load();
  };

  const openLinkModal = async (s: Santri) => {
    setLinkTarget(s);
    setLinkUserId(s.user_id ? String(s.user_id) : '');
    setNewPassword('');
    try {
      const users = await getAvailableSantriAccounts('', s.user_id || 0);
      setUserOptions(users);
    } catch {
      showToast('error', 'Gagal memuat daftar akun.');
    }
  };

  const submitLink = async () => {
    if (!linkTarget || !linkUserId) return;
    setLinking(true);
    try {
      const res = await linkSantriAccount(linkTarget.id, Number(linkUserId));
      if (res.ok) {
        showToast('success', res.message || 'Akun santri berhasil ditautkan.');
        setLinkTarget(null);
        load({ offset });
      } else {
        showToast('error', res.message || 'Gagal menghubungkan akun.');
      }
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Terjadi kesalahan.');
    } finally {
      setLinking(false);
    }
  };

  const exportData = (format: 'pdf' | 'excel') => {
    const columns = ['NIS', 'Nama', 'Panggilan', 'Kelamin', 'Kelas', 'Angkatan', 'Status', 'Nama Wali', 'No. HP Wali'];
    const rows = items.map((s) => [
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
    const suffix = search || classFilter || statusFilter ? ' (filtered)' : '';
    if (format === 'pdf') {
      exportToPDF(`Data Santri${suffix}`, columns, rows, `Data-Santri-AlMaa-${Date.now()}`);
    } else {
      exportToExcel(`Data Santri${suffix}`, columns, rows, `Data-Santri-AlMaa-${Date.now()}`);
    }
    showToast('success', `Data santri berhasil diexport ke ${format.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Data Santri</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola data santri Pondok Pesantren Al Maa Parung
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => router.push('/admin/kesantrian/import')}
            className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-700 transition hover:bg-sky-100"
          >
            <Import size={16} /> Import Massal
          </button>
          <button
            onClick={() => router.push('/admin/kesantrian/form')}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-600/25 transition hover:bg-sky-700"
          >
            <Plus size={16} /> Tambah Santri
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              placeholder="Cari NIS, nama, atau panggilan..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-400/10"
            />
          </div>
          <select
            value={classFilter}
            onChange={(e) => { setClassFilter(e.target.value); setLoading(true); }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-sky-400 lg:w-44"
          >
            <option value="">Semua Kelas</option>
            {classOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setLoading(true); }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-sky-400 lg:w-40"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={applySearch}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sky-700"
          >
            <RefreshCw size={15} /> Terapkan Filter
          </button>
        </div>
      </div>

      {/* Bulk actions toolbar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
          <span className="text-sm font-bold text-sky-800">
            {selected.size} santri dipilih
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportData('pdf')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100"
            >
              <FileText size={14} /> Export PDF
            </button>
            <button
              onClick={() => exportData('excel')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100"
            >
              <FileSpreadsheet size={14} /> Export Excel
            </button>
            <button
              onClick={() => setConfirmDelete({ mode: 'bulk' })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
            >
              <Trash2 size={14} /> Hapus Terpilih
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Kosongkan
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="ap-table-wrap overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={items.length > 0 && items.every((i) => selected.has(i.id))}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                </th>
                <th className="px-4 py-3 font-bold">Foto</th>
                <th className="px-4 py-3 font-bold">NIS</th>
                <th className="px-4 py-3 font-bold">Nama</th>
                <th className="px-4 py-3 font-bold">Kelamin</th>
                <th className="px-4 py-3 font-bold">Kelas</th>
                <th className="px-4 py-3 font-bold">Angkatan</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Nama Wali</th>
                <th className="px-4 py-3 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw size={22} className="animate-spin text-sky-500" />
                      Memuat data santri...
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-14 text-center">
                    <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-sm font-bold text-slate-500">Belum ada data santri</p>
                    <p className="text-xs text-slate-400">Tambahkan santri baru atau lakukan import massal.</p>
                  </td>
                </tr>
              ) : (
                items.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 transition hover:bg-sky-50/40">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggleSelect(s.id)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {s.photo_url ? (
                        <img
                          src={normalizeApiAssetUrl(s.photo_url)}
                          alt={`Foto ${s.name}`}
                          loading="lazy"
                          className="h-10 w-10 rounded-xl object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-xs font-black text-sky-600 ring-1 ring-sky-100">
                          {getInitials(s.name) || <User size={16} />}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{s.nis}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{s.name}</p>
                      {s.nickname && (
                        <p className="text-xs text-slate-400">({s.nickname})</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{genderLabel(s.gender)}</td>
                    <td className="px-4 py-3 text-slate-700">{s.class}</td>
                    <td className="px-4 py-3 text-slate-600">{s.angkatan || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${statusColor(s.status)}`}>
                        {s.status || 'aktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.parent_name || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => router.push(`/admin/kesantrian/form?id=${s.id}`)}
                          className="rounded-lg p-2 text-sky-600 transition hover:bg-sky-100"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ mode: 'single', id: s.id })}
                          className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmPurge(s)}
                          className="rounded-lg p-2 font-black text-red-700 transition hover:bg-red-100"
                          title="Hapus TOTAL: santri + seluruh tagihan (termasuk lunas), nilai, rapor, akun portal"
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => openLinkModal(s)}
                          className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50"
                          title={s.user_id ? 'Akun santri tertaut — klik untuk kelola' : 'Tautkan akun santri (untuk login wali)'}
                        >
                          <UserPlus size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {linkTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setLinkTarget(null)}>
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900">Akun Santri</h3>
                <button onClick={() => setLinkTarget(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Tutup">
                  <X size={18} />
                </button>
              </div>
              <p className="mb-1 text-sm text-slate-600">
                Santri: <span className="font-bold text-slate-900">{linkTarget.name}</span> <span className="font-mono text-xs text-slate-400">({linkTarget.nis})</span>
              </p>
              {linkTarget.user_id ? (
                <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                  Santri ini login memakai akun di bawah. Wali memakai akun yang sama untuk masuk portal.
                  Memilih akun lain akan menggantikannya. Satu akun hanya untuk satu santri.
                </p>
              ) : (
                <p className="mb-3 text-xs text-slate-500">Pilih satu akun login untuk santri ini. Akun inilah yang dipakai wali untuk masuk portal.</p>
              )}
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="link-user-select">
                Akun santri
              </label>
              <select
                id="link-user-select"
                value={linkUserId}
                onChange={(e) => setLinkUserId(e.target.value)}
                className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-sky-500"
              >
                <option value="">-- Pilih akun --</option>
                {userOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button onClick={() => setLinkTarget(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
                  Batal
                </button>
                <button onClick={submitLink} disabled={!linkUserId || linking} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                  {linking ? 'Menyimpan…' : 'Tautkan'}
                </button>
              </div>
              {linkTarget.user_id ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Reset password akun ini</p>
                  <p className="mb-2 text-xs text-slate-500">Buat password baru untuk wali (minimal 6 karakter), lalu sampaikan ke wali.</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Password baru"
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                    />
                    <button
                      onClick={async () => {
                        if (newPassword.length < 6) { showToast('error', 'Password minimal 6 karakter'); return; }
                        setResetting(true);
                        const r = await resetSantriPassword(linkTarget.id, newPassword);
                        setResetting(false);
                        if (r.ok) { showToast('success', r.message); setNewPassword(''); }
                        else showToast('error', r.message);
                      }}
                      disabled={resetting || newPassword.length < 6}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50"
                    >
                      {resetting ? '…' : 'Reset'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row">
          <p className="text-xs font-medium text-slate-500">
            Menampilkan <span className="font-bold text-slate-700">{items.length}</span> dari{' '}
            <span className="font-bold text-slate-700">{total}</span> santri
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={offset === 0}
              onClick={() => { setLoading(true); load({ offset: Math.max(0, offset - PAGE_SIZE) }); }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Sebelumnya
            </button>
            <span className="px-3 text-xs font-bold text-slate-700">
              Hal {page} / {pageCount}
            </span>
            <button
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => { setLoading(true); load({ offset: offset + PAGE_SIZE }); }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
            >
              Berikutnya <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmPurge}
        onClose={() => setConfirmPurge(null)}
        onConfirm={async () => {
          if (!confirmPurge) return;
          setPurging(true);
          const res = await purgeSantri(confirmPurge.id);
          setPurging(false);
          if (res.ok) showToast('success', res.message || 'Santri dihapus total');
          else showToast('error', res.message || 'Gagal menghapus total santri');
          setConfirmPurge(null);
          load({ offset: 0 });
          setOffset(0);
        }}
        title="Hapus TOTAL Santri"
        message={
          `HAPUS TOTAL ${confirmPurge?.name || ''} (NIS ${confirmPurge?.nis || '-'})? ` +
          'Seluruh data ikut terhapus permanen: tagihan SPP/iuran (TERMASUK yang sudah dibayar/lunas), ' +
          'kwitansi, nilai, rapor, presensi, tahfidz, wallet, dan akun portal. Tindakan ini TIDAK dapat dibatalkan.'
        }
        confirmText="Ya, Hapus Total"
        isLoading={purging}
      />
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title={confirmDelete?.mode === 'bulk' ? 'Hapus Santri Terpilih' : 'Hapus Santri'}
        message={
          confirmDelete?.mode === 'bulk'
            ? `Yakin ingin menghapus ${selected.size} santri terpilih? Tindakan ini tidak dapat dibatalkan.`
            : 'Yakin ingin menghapus santri ini? Tindakan ini tidak dapat dibatalkan.'
        }
        confirmText="Hapus"
        isLoading={deleting}
      />
    </div>
  );
}
