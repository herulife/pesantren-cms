'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toast';
import {
  AcademicYear,
  EraporKelengkapanRow,
  EraporNilaiRow,
  EraporPokokRow,
  EraporSyncRow,
  currentSemester,
  exportErapor,
  getAcademicYears,
  getActiveAcademicYear,
  getClasses,
  getEraporKelengkapan,
  getEraporNilai,
  getEraporPokok,
  getEraporSyncStatus,
} from '@/lib/api';
import { exportToExcel } from '@/lib/export';
import {
  ArrowLeft, CheckCircle2, Download, FileSpreadsheet, GraduationCap, Info, RefreshCw, Search, Upload, XCircle,
} from 'lucide-react';

type TabKey = 'kelengkapan' | 'log';

function okBadge(ok: boolean) {
  if (ok) {
    return <CheckCircle2 size={15} className="shrink-0 text-emerald-500" aria-label="Lengkap" />;
  }
  return <XCircle size={15} className="shrink-0 text-rose-400" aria-label="Kurang" />;
}

export default function EraporPage() {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('kelengkapan');
  const [semester, setSemester] = useState('1');
  const [year, setYear] = useState('');
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<{ name: string }[]>([]);
  const [classFilter, setClassFilter] = useState('');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<EraporKelengkapanRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState('');
  const [syncRows, setSyncRows] = useState<EraporSyncRow[]>([]);
  const [hasRapor, setHasRapor] = useState(false);
  const [syncType, setSyncType] = useState<'pokok' | 'nilai'>('pokok');

  const role = authUser?.role || '';
  const total = rows.length;
  const ready = useMemo(() => rows.filter((r) => r.emis_ready).length, [rows]);
  const isAdminRole = role === 'superadmin' || role === 'admin' || role === 'pimpinan';
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (role !== '' && !isAdminRole) {
      setDenied(true);
      router.replace('/admin/raport');
    }
  }, [role, isAdminRole, router]);

  if (denied) return null;

  const loadKelengkapan = useCallback(async () => {
    setLoading(true);
    const data = await getEraporKelengkapan({ class: classFilter || undefined, q: q || undefined });
    setRows(data);
    setLoading(false);
  }, [classFilter, q]);

  const loadSync = useCallback(async () => {
    const data = await getEraporSyncStatus({ semester, academic_year: year, type: syncType });
    setSyncRows(data);
    const nilai = await getEraporNilai({ semester, academic_year: year });
    setHasRapor(nilai.length > 0);
  }, [semester, year, syncType]);

  useEffect(() => {
    (async () => {
      const [active, list, cls] = await Promise.all([getActiveAcademicYear(), getAcademicYears(), getClasses()]);
      setYear(active);
      setYears(list);
      setSemester(currentSemester());
      setClasses(cls);
    })();
  }, []);

  useEffect(() => {
    if (!year) return;
    void loadKelengkapan();
  }, [year, classFilter, q, loadKelengkapan]);

  useEffect(() => {
    if (!year) return;
    void loadSync();
  }, [year, semester, loadSync]);

  const downloadPokok = async () => {
    const pokok: EraporPokokRow[] = await getEraporPokok({ class: classFilter || undefined });
    if (pokok.length === 0) {
      showToast('error', 'Tidak ada data pokok untuk diekspor');
      return;
    }
    const cols = ['NIS', 'NISN', 'NIK', 'Nama', 'JK', 'Tempat Lahir', 'Tgl Lahir', 'Rombel', 'Jenjang', 'Angkatan', 'Status', 'Kategori', 'Nama Ayah', 'Nama Ibu'];
    const body = pokok.map((p) => [p.nis, p.nisn, p.nik, p.name, p.gender, p.birth_place, p.birth_date, p.class, p.jenjang, p.angkatan, p.status, p.category, p.father_name, p.mother_name]);
    exportToExcel(`Data Pokok Siswa ${year}`, cols, body, `data-pokok-${year.replace('/', '-')}-${semester}`);
    showToast('success', `${pokok.length} baris data pokok diunduh`);
  };

  const downloadNilai = async () => {
    const nilai: EraporNilaiRow[] = await getEraporNilai({ semester, academic_year: year });
    if (nilai.length === 0) {
      showToast('error', 'Belum ada rapor terkunci untuk semester ini');
      return;
    }
    const cols = ['NIS', 'NISN', 'Nama', 'Rombel', 'Jenjang', 'Semester', 'Tahun', 'Mapel', 'Project', 'Kesantrian', 'Nilai Akhir', 'Predikat', 'Status Rapor'];
    const body = nilai.map((n) => [n.nis, n.nisn, n.name, n.class, n.jenjang, n.semester, n.academic_year, n.mapel_score, n.project_score, n.kesantrian_score, n.final_score, n.predikat, n.raport_status]);
    exportToExcel(`Nilai ${semester === '1' ? 'Ganjil' : 'Genap'} ${year}`, cols, body, `nilai-${year.replace('/', '-')}-semester-${semester}`);
    showToast('success', `${nilai.length} baris nilai diunduh (${year} semester ${semester})`);
  };

  const doExport = async (type: 'pokok' | 'nilai') => {
    setExporting(type);
    const res = await exportErapor({ type, semester, academic_year: year });
    setExporting('');
    if (res.ok) {
      showToast('success', `${res.message} (${res.data?.count ?? 0} baris)`);
      await loadSync();
    } else {
      showToast('error', res.message);
    }
  };

  const label = semester === '1' ? 'Ganjil' : 'Genap';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/admin/raport" aria-label="Kembali ke E-Raport" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200">
            <ArrowLeft size={17} />
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
            <FileSpreadsheet size={24} className="text-sky-600" /> Sinkron E-Rapor <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black uppercase tracking-widest text-sky-700">RDM / EMIS</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5">
          <button onClick={() => setTab('kelengkapan')} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === 'kelengkapan' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Kelengkapan Identitas</button>
          <button onClick={() => setTab('log')} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === 'log' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Export & Log</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
          <span className="text-xs font-bold text-slate-400">Semester</span>
          <select value={semester} onChange={(e) => setSemester(e.target.value)} className="bg-transparent text-sm font-bold text-slate-800 outline-none">
            <option value="1">Ganjil</option>
            <option value="2">Genap</option>
          </select>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
          <span className="text-xs font-bold text-slate-400">Tahun</span>
          <select value={year} onChange={(e) => setYear(e.target.value)} className="bg-transparent text-sm font-bold text-slate-800 outline-none">
            {years.length === 0 && <option value={year}>{year || 'Memuat...'}</option>}
            {years.map((y) => <option key={y.id} value={y.name}>{y.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
          <span className="text-xs font-bold text-slate-400">Rombel</span>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="bg-transparent text-sm font-bold text-slate-800 outline-none">
            <option value="">Semua</option>
            {classes.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
          <Search size={15} className="text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama / NIS / NISN..." className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none" />
        </div>
        <button onClick={() => { void loadKelengkapan(); void loadSync(); }} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
          <RefreshCw size={15} /> Muat Ulang
        </button>
      </div>

      {tab === 'kelengkapan' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-100 bg-white p-5">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Total Santri</p>
              <p className="mt-1 text-3xl font-black text-slate-900">{total}</p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-5">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Siap EMIS <span className="normal-case tracking-normal">(data pokok lengkap)</span></p>
              <p className="mt-1 text-3xl font-black text-sky-600">{ready}</p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-5">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Perlu Dilengkapi</p>
              <p className="mt-1 text-3xl font-black text-rose-500">{total - ready}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-3">
              <p className="text-xs font-bold text-slate-500">
                Kolom inti EMIS: <span className="text-slate-800">NISN, Nama, Jenis Kelamin, Tempat &amp; Tanggal Lahir, Rombel</span>. NIK &amp; Angkatan pelengkap.
              </p>
              <button onClick={downloadPokok} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition hover:bg-sky-700">
                <Download size={14} /> Unduh Data Pokok (xlsx)
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-2 py-3">Nama</th>
                    <th className="px-2 py-3">NIS</th>
                    <th className="px-2 py-3">NISN</th>
                    <th className="px-2 py-3">NIK</th>
                    <th className="px-2 py-3">TTL</th>
                    <th className="px-2 py-3">Rombel</th>
                    <th className="px-2 py-3">Angkatan</th>
                    <th className="px-2 py-3 text-center">Siap EMIS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="px-2 py-10 text-center text-sm text-slate-400">Memuat data...</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={8} className="px-2 py-10 text-center text-sm text-slate-400">Belum ada data santri.</td></tr>
                  ) : rows.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 align-top">
                      <td className="px-2 py-3 font-bold text-slate-800">
                        {r.name}
                        {!r.emis_ready && r.missing.length > 0 && (
                          <span className="mt-0.5 block text-[10px] font-semibold text-rose-500">{r.missing.join(', ')}</span>
                        )}
                      </td>
                      <td className="px-2 py-3 font-semibold text-slate-600">{r.nis || '-'}</td>
                      <td className="px-2 py-3 font-semibold text-slate-600">{r.nisn || '-'}</td>
                      <td className="px-2 py-3 font-semibold text-slate-600">{r.nik || '-'}</td>
                      <td className="px-2 py-3 text-slate-600">{r.birth_place || '-'}, {r.birth_date || '-'}</td>
                      <td className="px-2 py-3 font-semibold text-slate-600">{r.class || '-'}</td>
                      <td className="px-2 py-3 text-slate-600">{r.angkatan || '-'}</td>
                      <td className="px-2 py-3 text-center">
                        {r.emis_ready ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600">Siap</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-rose-500">Lengkapi</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'log' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-slate-800">Catat Export ke RDM/EMIS</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  RDM Kemenag tidak punya API tulis publik — alur sinkron =
                  export file <span className="font-bold text-slate-700">{label} {year}</span> lalu import manual di aplikasi RDM,
                  atau pull data EMIS untuk dicek selisihnya.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => void doExport('pokok')} disabled={exporting !== ''} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 disabled:opacity-50">
                  {exporting === 'pokok' ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                  {exporting === 'pokok' ? 'Mencatat...' : 'Export Data Pokok'}
                </button>
                <button onClick={() => void doExport('nilai')} disabled={exporting !== ''} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-sky-700 disabled:opacity-50">
                  {exporting === 'nilai' ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                  {exporting === 'nilai' ? 'Mencatat...' : 'Export Nilai'}
                </button>
                <button onClick={downloadNilai} disabled={hasRapor === false} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-700 hover:border-sky-300 disabled:opacity-50">
                  <Download size={14} /> Unduh Nilai (xlsx)
                </button>
              </div>
            </div>
            {!hasRapor && (
              <p className="mt-3 inline-flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                <Info size={14} className="mt-0.5 shrink-0" />
                Belum ada rapor tersimpan untuk {label} {year}. Export nilai baru bisa dicatat setelah rapor dikunci di menu E-Raport.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-3">
              <p className="text-sm font-black text-slate-800">Log Sinkron E-Rapor</p>
              <div className="flex items-center gap-2">
                {role !== 'pimpinan' && (
                  <Link href="/admin/raport" className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700">
                    <GraduationCap size={14} /> Buka E-Raport
                  </Link>
                )}
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                  <button onClick={() => setSyncType('pokok')} className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${syncType === 'pokok' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Data Pokok</button>
                  <button onClick={() => setSyncType('nilai')} className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${syncType === 'nilai' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Nilai</button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-2 py-3">Nama</th>
                    <th className="px-2 py-3">NIS</th>
                    <th className="px-2 py-3">NISN</th>
                    <th className="px-2 py-3">Rombel</th>
                    <th className="px-2 py-3">Periode</th>
                    <th className="px-2 py-3">Status</th>
                    <th className="px-2 py-3">Export</th>
                    <th className="px-2 py-3">Import</th>
                  </tr>
                </thead>
                <tbody>
                  {syncRows.length === 0 ? (
                    <tr><td colSpan={8} className="px-2 py-10 text-center text-sm text-slate-400">{syncType === 'pokok' ? 'Belum ada log export data pokok untuk periode ini. Klik "Export Data Pokok" untuk mencatat.' : 'Belum ada log export nilai untuk periode ini. Klik "Export Nilai" setelah rapor terkunci.'}</td></tr>
                  ) : syncRows.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100">
                      <td className="px-2 py-3 font-bold text-slate-800">{s.name || `#${s.student_id}`}</td>
                      <td className="px-2 py-3 font-semibold text-slate-600">{s.nis || '-'}</td>
                      <td className="px-2 py-3 font-semibold text-slate-600">{s.nisn || '-'}</td>
                      <td className="px-2 py-3 text-slate-600">{s.class || '-'}</td>
                      <td className="px-2 py-3 text-slate-600">{s.academic_year} · Smt {s.semester}</td>
                      <td className="px-2 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${s.status === 'exported' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          {s.status === 'exported' ? okBadge(true) : okBadge(false)} {s.status}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-xs text-slate-500">{s.exported_at || '-'}</td>
                      <td className="px-2 py-3 text-xs text-slate-500">{s.imported_at || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}