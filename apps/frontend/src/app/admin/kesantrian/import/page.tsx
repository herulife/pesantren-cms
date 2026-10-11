'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { useToast } from '@/components/Toast';
import { createSantri } from '@/lib/api';
import { ArrowLeft, Download, FileSpreadsheet, Import, Users } from 'lucide-react';

const TEMPLATE_FILE = 'template-import-santri.xlsx';

const COLUMNS: { key: keyof ParsedRow; title: string; width: number }[] = [
  { key: 'nis', title: 'NIS', width: 12 },
  { key: 'name', title: 'Nama', width: 26 },
  { key: 'nickname', title: 'Panggilan', width: 14 },
  { key: 'gender', title: 'Kelamin', width: 10 },
  { key: 'birth_place', title: 'Tempat Lahir', width: 16 },
  { key: 'birth_date', title: 'Tanggal Lahir', width: 16 },
  { key: 'address', title: 'Alamat', width: 30 },
  { key: 'class', title: 'Kelas', width: 10 },
  { key: 'angkatan', title: 'Angkatan', width: 10 },
  { key: 'status', title: 'Status', width: 10 },
  { key: 'nik', title: 'NIK', width: 20 },
  { key: 'parent_name', title: 'Nama Wali', width: 22 },
  { key: 'parent_phone', title: 'No. HP Wali', width: 16 },
];

const PREVIEW_COLS: { key: keyof ParsedRow; title: string }[] = [
  { key: 'nis', title: 'NIS' },
  { key: 'name', title: 'Nama' },
  { key: 'nickname', title: 'Panggilan' },
  { key: 'gender', title: 'L/P' },
  { key: 'birth_place', title: 'Tempat Lahir' },
  { key: 'birth_date', title: 'Tanggal Lahir' },
  { key: 'class', title: 'Kelas' },
  { key: 'angkatan', title: 'Angkatan' },
  { key: 'status', title: 'Status' },
  { key: 'parent_name', title: 'Nama Wali' },
  { key: 'parent_phone', title: 'No. HP Wali' },
];

const TEMPLATE_ROW = {
  nis: '20261001',
  name: 'Ahmad Fauzi',
  nickname: 'Ahmad',
  gender: 'L',
  birth_place: 'Bogor',
  birth_date: '2010-01-01',
  address: 'Jl. Merdeka No.1',
  class: 'VII',
  angkatan: '2026',
  status: 'aktif',
  nik: '',
  parent_name: 'Bpk. Fauzi',
  parent_phone: '081234567890',
};

interface RowError { row: number; field: string; message: string; }
interface ParsedRow {
  nis: string; name: string; nickname: string; gender: string; birth_place: string;
  birth_date: string; address: string; class: string; angkatan: string; status: string;
  nik: string; parent_name: string; parent_phone: string;
}

const HEADER_ALIASES: Record<keyof ParsedRow, string[]> = {
  nis: ['nis', 'nomorinduk', 'noinduk', 'nomor induk', 'nisn'],
  name: ['nama', 'namasantri', 'namalengkap', 'namalms'],
  nickname: ['panggilan', 'namapanggilan', 'nickname'],
  gender: ['kelamin', 'jk', 'jeniskelamin', 'gender', 'lp'],
  birth_place: ['tempatlahir', 'tempat lahir', 'tempat'],
  birth_date: ['tanggallahir', 'tgllahir', 'tgl lahir', 'lahir'],
  address: ['alamat', 'alamatsantri', 'alamatdomisili'],
  class: ['kelas', 'kelassiswa', 'kelasnya'],
  angkatan: ['angkatan', 'tahunmasuk', 'tahun'],
  status: ['status', 'statusantri'],
  nik: ['nik', 'nomorktp', 'ktp'],
  parent_name: ['namawali', 'orangtua', 'namapak', 'ayah', 'wali', 'namawaliortu'],
  parent_phone: ['nohpwali', 'nohp', 'hp', 'nohporangtua', 'telp', 'telepon', 'hpp'],
};

function normalizeHeader(v: unknown): string {
  return String(v ?? '').toLowerCase().replace(/[_\-./\\]+/g, ' ').replace(/\s+/g, ' ').replace(/[^a-z0-9 ]/g, '').trim();
}

function headerIndex(head: string[], field: keyof ParsedRow): number {
  const aliases = HEADER_ALIASES[field].map(normalizeHeader);
  let idx = head.findIndex((h) => aliases.includes(h));
  if (idx >= 0) return idx;
  idx = head.findIndex((h) => h && aliases.some((a) => h.startsWith(a) || a.startsWith(h)));
  return idx;
}

function toExcelSerialDate(v: unknown): string {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${v.getUTCFullYear()}-${p(v.getUTCMonth() + 1)}-${p(v.getUTCDate())}`;
  }
  return String(v ?? '').trim();
}

function normalizeDate(v: unknown): string {
  const s = toExcelSerialDate(v);
  if (!s) return '';
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  const d = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (d) return `${d[3]}-${d[2].padStart(2, '0')}-${d[1].padStart(2, '0')}`;
  return s;
}

function normalizeGender(v: unknown): string {
  const s = String(v ?? '').trim().toLowerCase();
  if (!s) return '';
  if (['l', 'laki', 'laki-laki', 'pria', 'male', 'm', '1', '392'].includes(s)) return 'l';
  if (['p', 'perempuan', 'wanita', 'female', 'f', '2', '64'].includes(s)) return 'p';
  return s;
}

function normalizePhone(v: unknown): string {
  const s = String(v ?? '').trim();
  const digits = s.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return '0' + digits.slice(2);
  if (digits.startsWith('8')) return '0' + digits;
  if (digits.startsWith('0')) return digits;
  return digits;
}

export default function SantriImportPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<RowError[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleDownloadTemplate = () => {
    const headers = COLUMNS.map((c) => c.title);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, Object.values(TEMPLATE_ROW)]);
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, TEMPLATE_FILE);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const grid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][];
      const clean = (grid ?? []).filter((r) => Array.isArray(r) && r.some((c) => String(c ?? '').trim() !== ''));
      if (clean.length === 0) { showToast('error', 'File kosong atau tidak terbaca.'); return; }
      const headRow = clean[0].map(normalizeHeader);
      const idx = (k: keyof ParsedRow) => headerIndex(headRow, k);
      const parsed: ParsedRow[] = [];
      const errs: RowError[] = [];
      for (let i = 1; i < clean.length; i++) {
        const r = clean[i];
        const rowNum = i + 1;
        const get = (col: number) => (col >= 0 && col < r.length ? r[col] : '');
        const nis = String(get(idx('nis'))).trim();
        const name = String(get(idx('name'))).trim();
        if (!nis) errs.push({ row: rowNum, field: 'nis', message: 'NIS wajib diisi' });
        if (!name) errs.push({ row: rowNum, field: 'name', message: 'Nama wajib diisi' });
        parsed.push({
          nis,
          name,
          nickname: String(get(idx('nickname'))).trim(),
          gender: normalizeGender(get(idx('gender'))),
          birth_place: String(get(idx('birth_place'))).trim(),
          birth_date: normalizeDate(get(idx('birth_date'))),
          address: String(get(idx('address'))).trim(),
          class: String(get(idx('class'))).trim(),
          angkatan: String(get(idx('angkatan'))).trim(),
          status: String(get(idx('status'))).trim() || 'aktif',
          nik: String(get(idx('nik'))).trim(),
          parent_name: String(get(idx('parent_name'))).trim(),
          parent_phone: normalizePhone(get(idx('parent_phone'))),
        });
      }
      setRows(parsed);
      setErrors(errs);
      if (errs.length > 0) showToast('error', `${errs.length} baris memiliki error. Perbaiki sebelum import.`);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (rows.length === 0) { showToast('error', 'Tidak ada data untuk diimpor.'); return; }
    if (errors.length > 0) { showToast('error', 'Perbaiki error terlebih dahulu.'); return; }
    setUploading(true);
    try {
      const payload = rows.map(r => ({ ...r, category: 'reguler' } as any));
      let successCount = 0;
      let failed = 0;
      for (const p of payload) {
        try {
          const res = await createSantri(p);
          if (res.ok) successCount++;
          else failed++;
        } catch (e) { failed++; }
      }
      if (successCount > 0) {
        showToast('success', `${successCount} santri berhasil diimpor.${failed > 0 ? ' ' + failed + ' gagal.' : ''}`);
        router.push('/admin/kesantrian');
      } else {
        showToast('error', 'Gagal mengimpor santri.');
      }
    } catch (e: any) {
      showToast('error', e.message || 'Gagal mengimpor santri.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => router.push('/admin/kesantrian')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-sky-600">
        <ArrowLeft size={16} /> Kembali ke Data Santri
      </button>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Import Data Santri</h1>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={handleDownloadTemplate} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <Download size={16} /> Download Template
          </button>
          <label className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm cursor-pointer hover:bg-sky-700">
            <FileSpreadsheet size={16} /> Pilih File Excel
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
        {rows.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-slate-700">{rows.length} baris siap diimpor</p>
              <button onClick={handleImport} disabled={uploading || errors.length > 0} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                <Import size={16} /> {uploading ? 'Mengimpor...' : 'Mulai Import'}
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-max text-sm">
                <thead className="bg-slate-50">
                  <tr>{PREVIEW_COLS.map(c => <th key={c.key} className="px-3 py-2 text-left text-xs font-bold uppercase">{c.title}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.slice(0, 20).map((r, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">{r.nis}</td>
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2">{r.nickname}</td>
                      <td className="px-3 py-2">{r.gender}</td>
                      <td className="px-3 py-2">{r.birth_place}</td>
                      <td className="px-3 py-2">{r.birth_date}</td>
                      <td className="px-3 py-2">{r.class}</td>
                      <td className="px-3 py-2">{r.angkatan}</td>
                      <td className="px-3 py-2">{r.status}</td>
                      <td className="px-3 py-2">{r.parent_name}</td>
                      <td className="px-3 py-2">{r.parent_phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 20 && <p className="mt-2 text-xs text-slate-500">Menampilkan 20 baris pertama.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
