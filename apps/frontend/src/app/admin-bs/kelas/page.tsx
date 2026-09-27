'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getClasses, createClass, updateClass, deleteClass, getAcademicYears, getUsers, SchoolClass, AcademicYear } from '@/lib/api';
import { exportToExcel } from '@/lib/export';
import { PageHeader, Pagination, EmptyState, ConfirmModal, ActionMenu, ImportModal, Toast, useToastState } from '../ui';

const PER_PAGE = 8;

type FormState = { name: string; jenjang: string; wali_name: string; wali_user_id: string; academic_year: string };

const emptyForm: FormState = { name: '', jenjang: '', wali_name: '', wali_user_id: '', academic_year: '' };

export default function BsKelas() {
  const [rows, setRows] = useState<SchoolClass[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [yearFilter, setYearFilter] = useState('');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [waliUsers, setWaliUsers] = useState<{ id: number; name: string }[]>([]);
  const [formErr, setFormErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [delTarget, setDelTarget] = useState<SchoolClass | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast, show } = useToastState();

  const load = async () => {
    const [c, y, u] = await Promise.all([getClasses(), getAcademicYears(), getUsers()]);
    setRows(c);
    setYears(y);
    setWaliUsers((u || []).filter(x => x.role === 'wali_kelas').map(x => ({ id: x.id, name: x.name })));
    if (!yearFilter) {
      const active = y.find((x) => x.is_active);
      if (active) setYearFilter(active.name);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = appliedSearch.toLowerCase();
    return rows.filter(
      (r) =>
        (!yearFilter || (r.academic_year || '') === yearFilter) &&
        (!q || r.name.toLowerCase().includes(q) || (r.jenjang || '').toLowerCase().includes(q) || (r.code || '').toLowerCase().includes(q))
    );
  }, [rows, yearFilter, appliedSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PER_PAGE + 1;
  const to = Math.min(safePage * PER_PAGE, filtered.length);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, academic_year: yearFilter });
    setFormErr('');
    setModalOpen(true);
  };

  const openEdit = (r: SchoolClass) => {
    setEditing(r);
    setForm({ name: r.name, jenjang: r.jenjang || '', wali_name: r.wali_name || '', wali_user_id: r.wali_user_id ? String(r.wali_user_id) : '', academic_year: r.academic_year || '' });
    setFormErr('');
    setModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormErr('Nama kelas wajib diisi.');
      return;
    }
    setSaving(true);
    const payload = { ...form, wali_user_id: form.wali_user_id ? Number(form.wali_user_id) : 0 };
    const r = editing
      ? await updateClass(editing.id, { ...payload, is_active: editing.is_active })
      : await createClass(payload);
    setSaving(false);
    if (r.success) {
      show(true, editing ? 'Kelas berhasil diubah.' : 'Kelas berhasil ditambahkan.');
      setModalOpen(false);
      setPage(1);
      load();
    } else {
      setFormErr(r.message || 'Gagal menyimpan.');
    }
  };

  const confirmDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    const r = await deleteClass(delTarget.id);
    setDeleting(false);
    if (r.success) {
      show(true, 'Kelas berhasil dihapus.');
      setDelTarget(null);
      load();
    } else {
      show(false, r.message || 'Gagal menghapus.');
    }
  };

  const doImport = async (list: Record<string, string>[]) => {
    const items = list.filter((x) => (x.nama || x.name || ''));
    if (items.length === 0) {
      show(false, 'Tidak ada baris valid (wajib nama).');
      return;
    }
    setImporting(true);
    let okCount = 0;
    for (const x of items) {
      const r = await createClass({
        name: x.nama || x.name || '',
        jenjang: x.jenjang || '',
        wali_name: x.wali || '',
        academic_year: x.tahun || x.ajarn || '',
      });
      if (r.success) okCount++;
    }
    setImporting(false);
    show(okCount === items.length, `${okCount} dari ${items.length} kelas diimport.`);
    if (okCount > 0) {
      setImportOpen(false);
      setPage(1);
      load();
    }
  };

  const exportExcel = () => {
    exportToExcel(
      'Data Kelas',
      ['#', 'Kode', 'Kelas', 'Jenjang', 'Wali Kelas', 'Ajaran', 'Status'],
      filtered.map((r, i) => [i + 1, r.code || '-', r.name, r.jenjang || '-', r.wali_name || '-', r.academic_year || '-', r.is_active ? 'Aktif' : 'Nonaktif']),
      'data_kelas'
    );
  };

  return (
    <div>
      <PageHeader
        title="Data Kelas"
        breadcrumb="Data Master / Kelas"
        actions={
          <>
            <button type="button" className="alma-btn alma-btn-success" onClick={exportExcel}>Export Excel</button>
            <button type="button" className="alma-btn alma-btn-secondary" onClick={() => setImportOpen(true)}>Import Massal</button>
            <button type="button" className="alma-btn alma-btn-primary" onClick={openAdd}>+ Tambah Kelas</button>
          </>
        }
      />

      <div className="alma-card mb-3">
        <div className="alma-card-bd alma-filter">
          <div className="alma-field">
            <label htmlFor="kelas-year">Tahun Ajaran</label>
            <select id="kelas-year" className="alma-select" value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}>
              <option value="">Semua</option>
              {years.map((y) => <option key={y.id} value={y.name}>{y.name}</option>)}
            </select>
          </div>
          <div className="alma-field" style={{ flex: 1, minWidth: 200 }}>
            <label htmlFor="kelas-search">Pencarian</label>
            <input
              id="kelas-search"
              className="alma-input"
              placeholder="Cari kelas / jurusan…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setAppliedSearch(search); setPage(1); } }}
            />
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="alma-btn alma-btn-secondary" onClick={() => { setSearch(''); setAppliedSearch(''); setYearFilter(''); setPage(1); }}>Reset</button>
            <button type="button" className="alma-btn alma-btn-success" onClick={() => { setAppliedSearch(search); setPage(1); }}>Cari</button>
          </div>
        </div>
      </div>

      <div className="alma-table-wrap">
        <table className="alma-table">
          <thead>
            <tr><th>#</th><th>Kode</th><th>Kelas</th><th>Jenjang</th><th>Wali Kelas</th><th>Ajaran</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => (
              <tr key={r.id}>
                <td className="alma-num">{from + i}</td>
                <td><span className="alma-code">{r.code || '-'}</span></td>
                <td><strong>{r.name}</strong></td>
                <td>{r.jenjang || '-'}</td>
                <td>{r.wali_name ? (<><span className="fw-semibold">{r.wali_name}</span><br /><small className="text-muted">Wali Kelas</small></>) : '-'}</td>
                <td>{r.academic_year || '-'}</td>
                <td>
                  <ActionMenu label={`Aksi ${r.name}`}>
                    <button type="button" onClick={() => openEdit(r)}>Edit Kelas</button>
                    <Link href="/admin-bs/siswa">Lihat Siswa</Link>
                    <button type="button" onClick={() => openEdit(r)}>Kelola Wali Kelas</button>
                    <button type="button" className="danger" onClick={() => setDelTarget(r)}>Hapus</button>
                  </ActionMenu>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr><td colSpan={7}>
                <EmptyState
                  title="Belum ada data kelas"
                  desc="Belum ada kelas yang terdaftar pada tahun ajaran ini."
                  action={<button type="button" className="alma-btn alma-btn-primary" onClick={openAdd}>+ Tambah Kelas</button>}
                />
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={safePage} totalPages={totalPages} total={filtered.length} from={from} to={to} onPage={setPage} />

      {modalOpen && (
        <div className="alma-modal-backdrop" onClick={() => setModalOpen(false)} role="presentation">
          <div className="alma-modal" role="dialog" aria-modal="true" aria-label={editing ? 'Edit Kelas' : 'Tambah Kelas'} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={submit}>
              <div className="alma-modal-hd">{editing ? 'Edit Kelas' : 'Tambah Kelas'}</div>
              <div className="alma-modal-bd d-flex flex-column gap-3">
                <div className="alma-field">
                  <label htmlFor="kelas-name">Nama Kelas</label>
                  <input id="kelas-name" className="alma-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="cth: VII-A" autoFocus />
                </div>
                <div className="alma-field">
                  <label htmlFor="kelas-jenjang">Jenjang / Jurusan</label>
                  <input id="kelas-jenjang" className="alma-input" value={form.jenjang} onChange={(e) => setForm({ ...form, jenjang: e.target.value })} placeholder="cth: SMP" />
                </div>
                <div className="alma-field">
                  <label htmlFor="kelas-wali">Wali Kelas</label>
                  <input id="kelas-wali" className="alma-input" value={form.wali_name} onChange={(e) => setForm({ ...form, wali_name: e.target.value })} placeholder="Nama wali kelas" />
                  <select id="kelas-wali-user" className="alma-select mt-2" value={form.wali_user_id} onChange={(e) => setForm({ ...form, wali_user_id: e.target.value })} title="Akun wali kelas (untuk hak akses)">
                    <option value="">-- Akun wali (opsional) --</option>
                    {waliUsers.map((u) => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
                  </select>
                </div>
                <div className="alma-field">
                  <label htmlFor="kelas-year-form">Tahun Ajaran</label>
                  <select id="kelas-year-form" className="alma-select" value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })}>
                    <option value="">- Pilih -</option>
                    {years.map((y) => <option key={y.id} value={y.name}>{y.name}</option>)}
                  </select>
                </div>
                {formErr && <p className="alma-err" role="alert">{formErr}</p>}
              </div>
              <div className="alma-modal-ft">
                <button type="button" className="alma-btn alma-btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
                <button type="submit" className="alma-btn alma-btn-primary" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={delTarget !== null}
        title="Hapus Kelas?"
        message={`Hapus kelas "${delTarget?.name}"? Data yang dihapus tidak bisa dikembalikan.`}
        onClose={() => setDelTarget(null)}
        onConfirm={confirmDelete}
        busy={deleting}
      />
      <ImportModal
        open={importOpen}
        title="Import Massal Kelas"
        templateName="template_kelas.csv"
        templateHeaders={['nama', 'jenjang', 'wali', 'tahun']}
        sampleRow={['VII-A', 'SMP', 'Ahmad Fauzi', '2025/2026']}
        onClose={() => setImportOpen(false)}
        onImport={doImport}
        busy={importing}
      />
      <Toast toast={toast} />
    </div>
  );
}
