'use client';

// Employees ala pola CRUD berita (jilid 4, 2026-09-18):
// header + CTA route tambah, tab filter, search debounce, bulk bar,
// tabel checkbox + pagination, dialog hapus satuan & massal.

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getEmployees, deleteEmployee, Employee, resolveDisplayImageUrl } from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import {
  Plus, Search, Trash2, Pencil, ChevronLeft, ChevronRight,
  Users, X, Phone, Mail,
} from 'lucide-react';

type KindFilter = 'all' | 'Guru' | 'Staf';

const kindTabs: Array<{ id: KindFilter; label: string }> = [
  { id: 'all', label: 'Semua' },
  { id: 'Guru', label: 'Guru' },
  { id: 'Staf', label: 'Staf' },
];

const limit = 10;

export default function EmployeesAdminPage() {
  const [rows, setRows] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSingleDeleting, setIsSingleDeleting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const { showToast } = useToast();

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getEmployees(searchQuery.trim());
      setRows(data);
    } catch {
      showToast('error', 'Gagal memuat data pegawai.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, showToast]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setCurrentPage(1);
      fetchRows();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [fetchRows]);

  const filtered = kindFilter === 'all' ? rows : rows.filter((r) => r.kind === kindFilter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const safePage = Math.min(currentPage, totalPages);
  const pageRows = filtered.slice((safePage - 1) * limit, safePage * limit);

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedCodes(new Set(pageRows.map((r) => r.code)));
    else setSelectedCodes(new Set());
  };

  const handleSelectOne = (code: string, checked: boolean) => {
    const next = new Set(selectedCodes);
    if (checked) next.add(code);
    else next.delete(code);
    setSelectedCodes(next);
  };

  const selectedNames = (ids: string[]) =>
    rows.filter((r) => ids.includes(r.code)).map((r) => r.name);

  const handleSingleDelete = async () => {
    if (!selectedCode) return;
    setIsSingleDeleting(true);
    try {
      const res = await deleteEmployee(selectedCode);
      if (res.success) {
        showToast('success', 'Pegawai berhasil dihapus.');
        setSelectedCodes((prev) => {
          prev.delete(selectedCode);
          return new Set(prev);
        });
        fetchRows();
        setIsDeleteOpen(false);
      } else {
        showToast('error', res.message || 'Gagal menghapus pegawai.');
      }
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Gagal menghapus pegawai.');
    } finally {
      setIsSingleDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedCodes);
    let successCount = 0;
    setIsBulkDeleting(true);
    try {
      for (const code of ids) {
        const res = await deleteEmployee(code);
        if (res.success) successCount++;
      }
      if (successCount > 0) {
        showToast('success', `${successCount} pegawai berhasil dihapus.`);
        setSelectedCodes(new Set());
        fetchRows();
        setIsBulkDeleteOpen(false);
      } else {
        showToast('error', 'Gagal menghapus pegawai terpilih.');
      }
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Gagal menghapus pegawai terpilih.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const singleName = selectedCode
    ? rows.find((r) => r.code === selectedCode)?.name || selectedCode
    : '';

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight">Data Pegawai</h1>
          <p className="text-slate-500 text-sm font-medium">
            Master data SDM operasional: kode pegawai dipakai absensi fingerprint dan
            laporan. Etalase profil publik dikelola terpisah di <Link href="/admin/settings?tab=Staf%20Mengajar" className="font-bold text-sky-700 hover:underline">menu Pengajar</Link>.
          </p>
        </div>
        <Link
          href="/admin/employees/add"
          className="flex items-center justify-center gap-3 px-6 py-3 bg-sky-600 text-white rounded-lg font-black uppercase tracking-widest text-xs hover:bg-sky-700 transition-colors shadow-lg shadow-sky-600/15"
        >
          <Plus size={20} />
          <span>Tambah Pegawai</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mb-10">
        <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm shrink-0">
            {kindTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setKindFilter(tab.id); setCurrentPage(1); }}
                className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${kindFilter === tab.id ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 w-full relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Cari pegawai berdasarkan kode atau nama…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Cari pegawai berdasarkan kode atau nama"
              className="w-full pl-14 pr-6 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-bold text-sm shadow-inner"
            />
          </div>
        </div>

        {selectedCodes.size > 0 && (
          <div className="bg-sky-50 px-8 py-4 border-b border-sky-100 flex items-center justify-between animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center text-white text-xs font-black">
                {selectedCodes.size}
              </div>
              <span className="text-xs font-black text-sky-800 uppercase tracking-widest">Pegawai Terpilih</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsBulkDeleteOpen(true)}
                className="px-6 py-2.5 bg-white text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-colors border border-slate-200"
              >
                Hapus Terpilih
              </button>
              <button onClick={() => setSelectedCodes(new Set())} className="p-2.5 text-slate-400 hover:text-slate-600" aria-label="Batalkan pilihan">
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        <div className="ap-table-wrap overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                <th className="pl-10 pr-6 py-6 w-12">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={pageRows.length > 0 && selectedCodes.size === pageRows.length && pageRows.every((r) => selectedCodes.has(r.code))}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      aria-label="Pilih semua di halaman ini"
                      className="w-5 h-5 rounded-lg border-slate-200 text-sky-600 focus:ring-sky-500/20 cursor-pointer transition-all"
                    />
                  </div>
                </th>
                <th className="px-6 py-6">Pegawai</th>
                <th className="px-6 py-6 hidden lg:table-cell">Kontak</th>
                <th className="px-6 py-6 hidden md:table-cell">Jenis</th>
                <th className="pr-10 pl-6 py-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-32 text-center uppercase font-black text-slate-300 tracking-[0.3em] animate-pulse">
                    Memuat data pegawai…
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-40 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <Users className="text-slate-200" size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                      {searchQuery.trim() || kindFilter !== 'all' ? 'Tidak Ada Hasil' : 'Belum Ada Pegawai'}
                    </h3>
                    <p className="text-slate-400 max-w-xs mx-auto text-sm font-medium">
                      {searchQuery.trim() || kindFilter !== 'all'
                        ? 'Tidak ada pegawai yang cocok dengan filter. Ubah kata kunci atau filter.'
                        : 'Tambahkan pegawai baru lewat tombol Tambah Pegawai.'}
                    </p>
                  </td>
                </tr>
              ) : (
                pageRows.map((item) => {
                  const isChecked = selectedCodes.has(item.code);
                  return (
                    <tr key={item.code} className={`group hover:bg-slate-50 transition-colors ${isChecked ? 'bg-sky-50/50' : ''}`}>
                      <td className="pl-10 pr-6 py-6 text-center">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleSelectOne(item.code, e.target.checked)}
                            aria-label={`Pilih ${item.name}`}
                            className="w-5 h-5 rounded-lg border-slate-200 text-sky-600 focus:ring-sky-500/20 cursor-pointer transition-all"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-6 max-w-lg">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center font-black text-xl shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                            {item.photo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={resolveDisplayImageUrl(item.photo_url)} alt={`Foto ${item.name}`} className="h-full w-full object-cover" />
                            ) : (
                              (item.name || '?').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Link href={`/admin/employees/edit/${encodeURIComponent(item.code)}`} className="font-black text-slate-900 leading-snug uppercase tracking-tight group-hover:text-sky-600 transition-colors line-clamp-2">
                              {item.name}
                            </Link>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                              <span className="font-mono">{item.code}</span>
                              <span>•</span>
                              <span>{item.gender === 'Laki-laki' ? 'L' : item.gender === 'Perempuan' ? 'P' : item.gender || '-'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 hidden lg:table-cell">
                        <div className="flex flex-col gap-1.5 text-[11px] font-bold text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <Phone size={12} className="text-slate-300" /> {item.phone || '-'}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Mail size={12} className="text-slate-300" /> {item.email || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-6 hidden md:table-cell">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${item.kind === 'Guru' ? 'bg-sky-50 text-sky-700 border-sky-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {item.kind || '-'}
                        </span>
                      </td>
                      <td className="pr-10 pl-6 py-6 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Link href={`/admin/employees/edit/${encodeURIComponent(item.code)}`} className="p-3 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="Ubah" aria-label={`Ubah ${item.name}`}>
                            <Pencil size={20} />
                          </Link>
                          <button onClick={() => { setSelectedCode(item.code); setIsDeleteOpen(true); }} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Hapus" aria-label={`Hapus ${item.name}`}>
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > limit && (
          <div className="px-10 py-8 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-6">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
              Halaman <strong className="text-slate-900">{safePage}</strong> Dari {totalPages} • {filtered.length} pegawai
            </span>
            <div className="flex gap-2">
              <button
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-[10px] font-black text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors uppercase tracking-widest shadow-sm"
              >
                <ChevronLeft size={16} /> Sebelumnya
              </button>
              <button
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-[10px] font-black text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors uppercase tracking-widest shadow-sm"
              >
                Selanjutnya <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleSingleDelete}
        isLoading={isSingleDeleting}
        title="Hapus Pegawai"
        message={selectedCode ? `Hapus ${singleName} (${selectedCode})? Data yang dihapus tidak bisa dikembalikan.` : 'Hapus pegawai ini?'}
        confirmText="Ya, Hapus"
      />

      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        isLoading={isBulkDeleting}
        title="Hapus Pegawai Terpilih"
        message={`${selectedCodes.size} pegawai terpilih akan dihapus${selectedNames(Array.from(selectedCodes)).length > 0 ? `: ${selectedNames(Array.from(selectedCodes)).slice(0, 3).join(', ')}${selectedCodes.size > 3 ? ', …' : ''}` : ''}. Data yang dihapus tidak bisa dikembalikan.`}
        confirmText="Ya, Hapus Semua"
      />
    </>
  );
}
