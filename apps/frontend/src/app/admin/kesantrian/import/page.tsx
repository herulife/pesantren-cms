'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { bulkCreateSantri } from '@/lib/api';
import { ArrowLeft, Download, FileText, Import, Users } from 'lucide-react';

const TEMPLATE_HEADER = 'NIS,Nama,Panggilan,Kelamin,TempatLahir,TanggalLahir,Alamat,Kelas,Angkatan,Status,NamaWali,NoHPWali';
const TEMPLATE_ROW = '20261001,Ahmad Fauzi,Ahmad,L,Bogor,2010-01-01,Jl. Merdeka No.1,VII,2026,aktif,Bpk. Fauzi,081234567890';

interface RowError { row: number; field: string; message: string; }
interface ParsedRow {
  nis: string; name: string; nickname: string; gender: string; birth_place: string;
  birth_date: string; address: string; class: string; angkatan: string; status: string;
  parent_name: string; parent_phone: string;
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur = '';
  let inQuotes = false;
  const line = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      line.push(cur); cur = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      line.push(cur); cur = '';
      if (line.some((c) => c.trim() !== '')) rows.push(line);
      line.length = 0;
    } else {
      cur += ch;
    }
  }
  line.push(cur);
  if (line.some((c) => c.trim() !== '')) rows.push(line);
  return rows;
}

export default function SantriImportPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [rawText, setRawText] = useState('');
  const [importing, setImporting] = useState(false);

  const { rows, header, errors } = useMemo(() => {
    const trimmed = rawText.trim();
    if (!trimmed) return { rows: [] as ParsedRow[], header: [] as string[], errors: [] as RowError[] };

    const csv = parseCSV(trimmed);
    if (csv.length === 0) return { rows: [], header: [], errors: [] };

    const head = csv[0].map((h) => h.trim().toLowerCase());
    const idx = {
      nis: head.indexOf('nis'),
      name: head.indexOf('nama'),
      nickname: head.indexOf('panggilan'),
      gender: head.indexOf('kelamin'),
      birth_place: head.indexOf('tempatlahir'),
      birth_date: head.indexOf('tanggallahir'),
      address: head.indexOf('alamat'),
      class: head.indexOf('kelas'),
      angkatan: head.indexOf('angkatan'),
      status: head.indexOf('status'),
      parent_name: head.indexOf('namawali'),
      parent_phone: head.indexOf('nohpwali'),
    };

    const parsedHeader = ['NIS', 'Nama', 'Panggilan', 'Kelamin', 'Kelas', 'Angkatan', 'Status', 'Nama Wali', 'No. HP Wali'];
    const parsed: ParsedRow[] = [];
    const errs: RowError[] = [];

    if (idx.nis < 0 || idx.name < 0) {
      errs.push({ row: 1, field: 'header', message: 'Kolom NIS dan Nama wajib ada di baris pertama.' });
      return { rows: parsed, header: parsedHeader, errors: errs };
    }

    for (let r = 1; r < csv.length; r++) {
      const c = csv[r];
      const val = (i: number) => (i >= 0 ? (c[i] || '').trim() : '');
      const row: ParsedRow = {
        nis: val(idx.nis),
        name: val(idx.name),
        nickname: val(idx.nickname),
        gender: val(idx.gender),
        birth_place: val(idx.birth_place),
        birth_date: val(idx.birth_date),
        address: val(idx.address),
        class: val(idx.class),
        angkatan: val(idx.angkatan),
        status: val(idx.status) || 'aktif',
        parent_name: val(idx.parent_name),
        parent_phone: val(idx.parent_phone),
      };
      if (!row.nis) errs.push({ row: r + 1, field: 'NIS', message: 'NIS kosong' });
      if (!row.name) errs.push({ row: r + 1, field: 'Nama', message: 'Nama kosong' });
      const g = row.gender.toLowerCase();
      if (row.gender && g !== 'l' && g !== 'p' && g !== 'laki-laki' && g !== 'perempuan') {
        errs.push({ row: r + 1, field: 'Kelamin', message: 'Harus L/P' });
      }
      parsed.push(row);
    }
    return { rows: parsed, header: parsedHeader, errors: errs };
  }, [rawText]);

  const setFromFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setRawText(String(reader.result || ''));
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const content = TEMPLATE_HEADER + '\n' + TEMPLATE_ROW;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-import-santri.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (errors.length > 0) {
      showToast('error', 'Perbaiki error pada data sebelum import.');
      return;
    }
    if (rows.length === 0) {
      showToast('error', 'Tidak ada data untuk diimpor.');
      return;
    }
    setImporting(true);
    const res = await bulkCreateSantri(rows);
    if (res.ok) {
      showToast('success', res.message || 'Santri berhasil diimpor');
      router.push('/admin/kesantrian');
    } else {
      showToast('error', res.message || 'Gagal mengimpor santri');
    }
    setImporting(false);
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/admin/kesantrian')}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-sky-600"
      >
        <ArrowLeft size={16} /> Kembali ke Data Santri
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Import Massal Santri</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tambahkan banyak santri sekaligus dengan format CSV. Kolom minimal: NIS dan Nama.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Input */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Data CSV</label>
              <div className="flex gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  <FileText size={14} /> Pilih File
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setFromFile(f);
                    }}
                  />
                </label>
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100"
                >
                  <Download size={14} /> Template
                </button>
              </div>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={12}
              placeholder={TEMPLATE_HEADER + '\n' + TEMPLATE_ROW}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-400/10"
            />
            <p className="mt-2 text-xs text-slate-400">
              Format kolom: NIS,Nama,Panggilan,Kelamin,TempatLahir,TanggalLahir,Alamat,Kelas,Angkatan,Status,NamaWali,NoHPWali
            </p>
          </div>

          {/* Preview */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Pratinjau</label>
              {rows.length > 0 && (
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
                  {rows.length} baris
                </span>
              )}
            </div>

            {errors.length > 0 ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-red-600">
                  {errors.length} error ditemukan
                </p>
                <ul className="max-h-64 space-y-1 overflow-y-auto">
                  {errors.map((e, i) => (
                    <li key={i} className="text-xs text-red-600">
                      Baris {e.row} — {e.field}: {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : rows.length > 0 ? (
              <div className="ap-table-wrap overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                      {['NIS', 'Nama', 'Panggilan', 'Kelamin', 'Kelas', 'Angkatan', 'Status', 'Nama Wali', 'No. HP Wali'].map((h) => (
                        <th key={h} className="px-3 py-2 font-bold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="px-3 py-2 font-mono font-semibold text-slate-700">{r.nis}</td>
                        <td className="px-3 py-2 font-bold text-slate-900">{r.name}</td>
                        <td className="px-3 py-2 text-slate-500">{r.nickname}</td>
                        <td className="px-3 py-2 text-slate-500">{r.gender === 'l' || r.gender === 'laki-laki' ? 'L' : r.gender === 'p' || r.gender === 'perempuan' ? 'P' : r.gender}</td>
                        <td className="px-3 py-2 text-slate-600">{r.class}</td>
                        <td className="px-3 py-2 text-slate-500">{r.angkatan}</td>
                        <td className="px-3 py-2 capitalize text-slate-600">{r.status}</td>
                        <td className="px-3 py-2 text-slate-500">{r.parent_name}</td>
                        <td className="px-3 py-2 text-slate-500">{r.parent_phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-full min-h-[16rem] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <Users className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm font-bold text-slate-500">Belum ada data</p>
                <p className="text-xs text-slate-400">Tempel data CSV atau pilih file untuk memulai.</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/kesantrian')}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            onClick={handleImport}
            disabled={importing || rows.length === 0 || errors.length > 0}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-600/25 transition hover:bg-sky-700 disabled:opacity-50"
          >
            <Import size={16} /> {importing ? 'Mengimpor...' : `Import ${rows.length} Santri`}
          </button>
        </div>
      </div>
    </div>
  );
}
