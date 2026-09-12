'use client';

import React, { useEffect, useState } from 'react';
import { getEmployees, createEmployee, deleteEmployee, Employee } from '@/lib/api';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Plus, Trash2 } from 'lucide-react';

export default function EmployeesPage() {
  const [rows, setRows] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ code: '', name: '', gender: 'Laki-laki', phone: '', email: '', kind: 'Guru' });
  const [delCode, setDelCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const load = async (q: string) => setRows(await getEmployees(q));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- muat awal saat mount
    load('');
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const r = await createEmployee(form);
    setSaving(false);
    if (r.success) {
      showToast('success', 'Pegawai ditambahkan.');
      setForm({ code: '', name: '', gender: 'Laki-laki', phone: '', email: '', kind: 'Guru' });
      load(search);
    } else {
      showToast('error', r.message || 'Gagal menambah pegawai.');
    }
  };

  const confirmDelete = async () => {
    if (!delCode) return;
    const r = await deleteEmployee(delCode);
    if (r.success) {
      showToast('success', 'Pegawai dihapus.');
      load(search);
    } else {
      showToast('error', r.message || 'Gagal menghapus.');
    }
    setDelCode(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-black mb-4">Data Pegawai</h1>
      <form onSubmit={submit} className="bg-white border rounded-xl p-4 mb-4 grid grid-cols-2 md:grid-cols-7 gap-2">
        <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="ID/Kode" className="border rounded-xl px-3 py-2 text-sm" required />
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama" className="border rounded-xl px-3 py-2 text-sm" required />
        <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="border rounded-xl px-3 py-2 text-sm">
          <option>Laki-laki</option><option>Perempuan</option>
        </select>
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Telp" className="border rounded-xl px-3 py-2 text-sm" />
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="border rounded-xl px-3 py-2 text-sm" />
        <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className="border rounded-xl px-3 py-2 text-sm">
          <option>Guru</option><option>Staf</option>
        </select>
        <button disabled={saving} className="bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1 disabled:opacity-60">
          <Plus size={16} /> {saving ? 'Menyimpan…' : 'Tambah'}
        </button>
      </form>
      <div className="flex gap-2 mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load(search); }} placeholder="Cari kode/nama..." className="border rounded-xl px-3 py-2 text-sm flex-1" />
        <button onClick={() => load(search)} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold">Cari</button>
      </div>
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead><tr className="bg-slate-50 text-left"><th className="p-3">ID</th><th className="p-3">Nama</th><th className="p-3">L/P</th><th className="p-3">Telp</th><th className="p-3">Email</th><th className="p-3">Jenis</th><th className="p-3">Aksi</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code} className="border-t">
                  <td className="p-3 font-mono">{r.code}</td><td className="p-3 font-bold">{r.name}</td>
                  <td className="p-3">{r.gender === 'Laki-laki' ? 'L' : r.gender === 'Perempuan' ? 'P' : r.gender || '-'}</td>
                  <td className="p-3">{r.phone || '-'}</td><td className="p-3">{r.email || '-'}</td><td className="p-3">{r.kind}</td>
                  <td className="p-3"><button onClick={() => setDelCode(r.code)} className="text-rose-600" aria-label={`Hapus ${r.name}`}><Trash2 size={16} /></button></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-slate-400">Belum ada pegawai.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmDialog
        isOpen={delCode !== null}
        onClose={() => setDelCode(null)}
        onConfirm={confirmDelete}
        title="Hapus pegawai?"
        message="Data yang dihapus tidak bisa dikembalikan."
        confirmText="Hapus"
      />
    </div>
  );
}
