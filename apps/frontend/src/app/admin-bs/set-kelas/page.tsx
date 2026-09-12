'use client';

import React, { useEffect, useState } from 'react';
import { getSantriList, getClasses, setSantriClass, Santri, SchoolClass } from '@/lib/api';
import { BsTitle, BsAlert } from '../ui';

export default function BsSetKelas() {
  const [rows, setRows] = useState<Santri[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [map, setMap] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [s, c] = await Promise.all([getSantriList({ limit: 200 }), getClasses()]);
    setRows(s.items);
    setClasses(c);
    const m: Record<number, string> = {};
    s.items.forEach((x) => { m[x.id] = x.class || ''; });
    setMap(m);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const simpan = async () => {
    const items = rows
      .filter((x) => (map[x.id] ?? x.class ?? '') !== (x.class || ''))
      .map((x) => ({ id: x.id, class: map[x.id] ?? '' }));
    if (items.length === 0) {
      setOk(false);
      setMsg('Tidak ada perubahan.');
      return;
    }
    setSaving(true);
    const r = await setSantriClass(items);
    setSaving(false);
    setOk(r.ok);
    setMsg(r.message);
    if (r.ok) load();
  };

  return (
    <div>
      <BsTitle>Set Kelas</BsTitle>
      <BsAlert msg={msg} ok={ok} />
      <div className="card">
        <div className="card-header">
          <button className="btn btn-sm btn-success" onClick={simpan} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
        <div className="card-body table-responsive p-0">
          <table className="table table-bordered table-striped table-sm text-sm mb-0">
            <thead><tr><th>#</th><th>No Induk</th><th>Nama</th><th>Kelas Saat Ini</th></tr></thead>
            <tbody>
              {rows.map((x, i) => (
                <tr key={x.id}>
                  <td>{i + 1}</td><td>{x.nis}</td><td className="fw-bold">{x.name}</td>
                  <td>
                    <select className="form-select form-select-sm" value={map[x.id] ?? x.class ?? ''} onChange={(e) => setMap({ ...map, [x.id]: e.target.value })}>
                      <option value="">- Pilih -</option>
                      {classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={4} className="text-center text-muted p-3">Belum ada data.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
