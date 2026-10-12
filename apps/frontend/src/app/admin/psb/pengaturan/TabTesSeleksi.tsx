'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  getRegistrations,
  updatePSBStatus,
  Registration,
} from '@/lib/api';
import { useToast } from '@/components/Toast';
import {
  CalendarClock,
  MapPin,
  Search,
  Loader2,
  RefreshCw,
  Save,
  UserRound,
  GraduationCap,
} from 'lucide-react';

const STATUS_FILTERS = [
  { id: '', label: 'Semua' },
  { id: 'review', label: 'Direview' },
  { id: 'tes', label: 'Tes Seleksi' },
  { id: 'accepted', label: 'Diterima' },
  { id: 'rejected', label: 'Ditolak' },
];

function statusStyle(status: string) {
  switch (status.toLowerCase()) {
    case 'accepted': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'review': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'tes': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 're_registration': return 'bg-violet-100 text-violet-700 border-violet-200';
    case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'santri': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    default: return 'bg-amber-100 text-amber-700 border-amber-200';
  }
}

function statusLabel(status: string) {
  switch (status.toLowerCase()) {
    case 'pending': return 'Menunggu';
    case 'review': return 'Direview';
    case 'tes': return 'Tes Seleksi';
    case 'accepted': return 'Diterima';
    case 're_registration': return 'Daftar Ulang';
    case 'rejected': return 'Ditolak';
    case 'santri': return 'Santri';
    default: return 'Menunggu';
  }
}

type Draft = { test_date: string; test_location: string; test_score: string; test_note: string };

const emptyDraft = (): Draft => ({ test_date: '', test_location: '', test_score: '', test_note: '' });

export default function TabTesSeleksi() {
  const { showToast } = useToast();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('tes');
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [batchSaving, setBatchSaving] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [batchDate, setBatchDate] = useState('');
  const [batchLocation, setBatchLocation] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getRegistrations();
      setRegistrations(data);
      const d: Record<number, Draft> = {};
      for (const r of data) {
        d[r.id] = {
          test_date: r.test_date || '',
          test_location: r.test_location || '',
          test_score: r.test_score != null ? String(r.test_score) : '',
          test_note: r.test_note || '',
        };
      }
      setDrafts(d);
      setSelected(new Set());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    return registrations.filter((r) => {
      const okStatus = statusFilter === '' || r.status.toLowerCase() === statusFilter;
      const q = search.trim().toLowerCase();
      const okQ = !q || r.full_name.toLowerCase().includes(q) || r.school_origin.toLowerCase().includes(q);
      return okStatus && okQ;
    });
  }, [registrations, statusFilter, search]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((r) => next.add(r.id));
        return next;
      });
    }
  };

  const setDraft = (id: number, key: keyof Draft, value: string) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] || emptyDraft()), [key]: value } }));
  };

  const saveRow = async (r: Registration) => {
    const d = drafts[r.id] || emptyDraft();
    setSavingId(r.id);
    try {
      const res = await updatePSBStatus(r.id, {
        status: r.status,
        test_date: d.test_date,
        test_location: d.test_location,
        test_score: d.test_score.trim() ? Number(d.test_score) : undefined,
        test_note: d.test_note,
      });
      if (res.success) {
        showToast('success', `Detail tes ${r.full_name} disimpan.`);
        void load();
      } else {
        showToast('error', res.message || 'Gagal menyimpan detail tes.');
      }
    } catch {
      showToast('error', 'Gagal menyimpan detail tes.');
    } finally {
      setSavingId(null);
    }
  };

  const applyBatch = async () => {
    const targets = registrations.filter((r) => selected.has(r.id));
    if (targets.length === 0) return;
    if (!batchDate.trim() && !batchLocation.trim()) {
      showToast('error', 'Isi jadwal dan/atau lokasi terlebih dahulu.');
      return;
    }
    setBatchSaving(true);
    let ok = 0;
    let fail = 0;
    for (const r of targets) {
      const res = await updatePSBStatus(r.id, {
        status: r.status,
        test_date: batchDate || r.test_date,
        test_location: batchLocation || r.test_location,
      });
      if (res.success) ok += 1;
      else fail += 1;
    }
    setBatchSaving(false);
    if (ok > 0) {
      showToast('success', `Jadwal tes diterapkan ke ${ok} calon${fail > 0 ? `, ${fail} gagal` : ''}.`);
      setBatchDate('');
      setBatchLocation('');
      await load();
    } else {
      showToast('error', 'Gagal menerapkan jadwal tes.');
    }
  };

  const selectedCount = selected.size;

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[13px] font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20';

  if (loading && registrations.length === 0) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-500">
          Atur jadwal &amp; lokasi tes seleksi. Centang banyak calon lalu terapkan secara massal, atau edit per baris.
        </p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / asal sekolah"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 md:w-64"
            />
          </div>
          <button
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Muat
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => {
          const count = s.id === '' ? registrations.length : registrations.filter((r) => r.status.toLowerCase() === s.id).length;
          return (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest border transition ${
                statusFilter === s.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 md:flex-row md:items-end">
          <div className="md:w-56">
            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Jadwal Tes (massal)</label>
            <input type="datetime-local" value={batchDate} onChange={(e) => setBatchDate(e.target.value)} className={`mt-1 ${inputClass}`} />
          </div>
          <div className="md:flex-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Lokasi Tes (massal)</label>
            <input
              value={batchLocation}
              onChange={(e) => setBatchLocation(e.target.value)}
              placeholder="Contoh: Ruang Kelas 7 / Masjid / Aula"
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <button
            onClick={() => void applyBatch()}
            disabled={batchSaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {batchSaving ? <Loader2 size={15} className="animate-spin" /> : <CalendarClock size={15} />}
            Terapkan ke {selectedCount} terpilih
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3.5">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} className="h-4 w-4 accent-emerald-600" />
                </th>
                <th className="px-4 py-3.5">Calon Santri</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Jadwal Tes</th>
                <th className="px-4 py-3.5">Lokasi Tes</th>
                <th className="px-4 py-3.5">Nilai Tes</th>
                <th className="px-4 py-3.5 text-right">Simpan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-slate-400">Tidak ada calon yang cocok.</td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const d = drafts[r.id] || emptyDraft();
                  const saving = savingId === r.id;
                  const selectedRow = selected.has(r.id);
                  return (
                    <tr key={r.id} className={`border-b border-slate-50 last:border-0 ${selectedRow ? 'bg-emerald-50/60' : 'hover:bg-slate-50/50'}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRow}
                          onChange={() =>
                            setSelected((prev) => {
                              const next = new Set(prev);
                              if (next.has(r.id)) next.delete(r.id);
                              else next.add(r.id);
                              return next;
                            })
                          }
                          className="h-4 w-4 accent-emerald-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                            <UserRound size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-800">{r.full_name}</p>
                            <p className="text-[11px] text-slate-400">Ref #PSB-{String(r.id).padStart(4, '0')} &middot; {r.school_origin}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusStyle(r.status)}`}>
                          {statusLabel(r.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="datetime-local"
                          value={d.test_date}
                          onChange={(e) => setDraft(r.id, 'test_date', e.target.value)}
                          className={inputClass}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          value={d.test_location}
                          onChange={(e) => setDraft(r.id, 'test_location', e.target.value)}
                          placeholder="Ruang / lokasi tes"
                          className={inputClass}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap size={15} className="shrink-0 text-slate-400" />
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={d.test_score}
                            onChange={(e) => setDraft(r.id, 'test_score', e.target.value)}
                            placeholder="Nilai"
                            className={inputClass}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => void saveRow(r)}
                          disabled={saving || batchSaving}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                        >
                          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
