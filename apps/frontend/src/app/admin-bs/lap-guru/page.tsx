'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { getEmployees, getPerGuru, getRekapAbsensi, Employee, TeacherAttendance, PerGuruSummary, RekapAbsensi } from '@/lib/api';
import { BsTitle, BsAlert } from '../ui';

function today() { return new Date().toISOString().split('T')[0]; }
function firstOfMonth() { return today().slice(0, 8) + '01'; }
function fmtDur(min: number) {
  return `${Math.floor(min / 60)} Jam ${min % 60} Menit`;
}

function LapGuruInner() {
  const params = useSearchParams();
  const initialTab = params.get('tab') === 'rekap' ? 'rekap' : 'perguru';
  const [tab, setTab] = useState<'perguru' | 'rekap'>(initialTab);
  const [emps, setEmps] = useState<Employee[]>([]);
  const [code, setCode] = useState('');
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [summary, setSummary] = useState<PerGuruSummary | null>(null);
  const [rows, setRows] = useState<TeacherAttendance[]>([]);
  const [rekap, setRekap] = useState<RekapAbsensi[]>([]);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(true);

  useEffect(() => {
    getEmployees().then(setEmps).catch(() => {});
  }, []);

  const tampilkan = async () => {
    if (!code) {
      setOk(false);
      setMsg('Pilih guru terlebih dahulu.');
      return;
    }
    const d = await getPerGuru(code, from, to);
    if (d) {
      setSummary(d.summary);
      setRows(d.rows);
      setMsg('');
    }
  };

  const tampilRekap = async () => {
    setRekap(await getRekapAbsensi(from, to));
  };

  return (
    <div>
      <BsTitle>{tab === 'perguru' ? 'Lap. Per Guru' : 'Lap. Rekap Absen'}</BsTitle>
      <BsAlert msg={msg} ok={ok} />
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item"><button type="button" className={`nav-link${tab === 'perguru' ? ' active' : ''}`} onClick={() => setTab('perguru')}>Per Guru</button></li>
        <li className="nav-item"><button type="button" className={`nav-link${tab === 'rekap' ? ' active' : ''}`} onClick={() => setTab('rekap')}>Rekap</button></li>
      </ul>
      <div className="card">
        <div className="card-body row g-2">
          {tab === 'perguru' && (
            <div className="col-md-4"><label className="form-label">Pilih Guru</label>
              <select className="form-select" value={code} onChange={(e) => setCode(e.target.value)}>
                <option value="">-- Pilih Guru --</option>
                {emps.map((e) => <option key={e.code} value={e.code}>{e.code} - {e.name}</option>)}
              </select>
            </div>
          )}
          <div className="col-md-2"><label className="form-label">Dari Tanggal</label><input type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="col-md-2"><label className="form-label">Sampai Tanggal</label><input type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <div className="col-md-2 d-flex align-items-end">
            <button className="btn btn-primary btn-sm" onClick={tab === 'perguru' ? tampilkan : tampilRekap}>Tampilkan</button>
          </div>
        </div>
      </div>
      {tab === 'perguru' ? (
        <>
          {summary && (
            <p className="small">Tanpa Ket.: <b>{summary.without_info}</b> Masuk: <b>{summary.present}</b> Sakit: <b>{summary.sick}</b> Ijin: <b>{summary.permit}</b> TOTAL JAM: <b>{fmtDur(summary.total_minutes)}</b> | Jumlah Data: <b>{summary.count}</b></p>
          )}
          <div className="card">
            <div className="card-body table-responsive p-0">
              <table className="table table-bordered table-striped table-sm text-sm mb-0">
                <thead><tr><th>Tanggal</th><th>Status</th><th>Keterangan</th><th>Jam Masuk</th><th>Jam Pulang</th><th>Jumlah Jam</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}><td>{r.date}</td><td className="fw-bold">{r.status}</td><td>{r.notes || '-'}</td><td>{r.time_in || '-'}</td><td>{r.time_out || '-'}</td><td>{fmtDur(r.minutes)}</td></tr>
                  ))}
                  {rows.length === 0 && <tr><td colSpan={6} className="text-center text-muted p-3">Silakan pilih guru dan range tanggal terlebih dahulu.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card">
          <div className="card-body table-responsive p-0">
            <table className="table table-bordered table-striped table-sm text-sm mb-0">
              <thead><tr><th>Kode Guru</th><th>Nama Guru</th><th>Jml Hari</th><th>Masuk</th><th>Sakit</th><th>Ijin</th><th>Alfa</th><th>Kehadiran</th></tr></thead>
              <tbody>
                {rekap.map((r) => (
                  <tr key={r.code}><td>{r.code}</td><td className="fw-bold">{r.name}</td><td>{r.days}</td><td>{r.present}</td><td>{r.sick}</td><td>{r.permit}</td><td>{r.alpha}</td><td className="fw-bold">{r.percent.toFixed(1)}%</td></tr>
                ))}
                {rekap.length === 0 && <tr><td colSpan={8} className="text-center text-muted p-3">Pilih range tanggal lalu Tampilkan.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BsLapGuru() {
  return (
    <Suspense fallback={<p className="text-muted">Memuat...</p>}>
      <LapGuruInner />
    </Suspense>
  );
}
