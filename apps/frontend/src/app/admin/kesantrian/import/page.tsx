'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { useToast } from '@/components/Toast';
import { bulkCreateSantri } from '@/lib/api';
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
  nis: ['nis', 'nomorinduk', 'noinduk', 'noinduk', 'nomorinduk', 'id', 'nisn'],
  name: ['nama', 'namasantri', 'namalengkap', 'namapenerima', 'namalms'],
  nickname: ['panggilan', 'namapanggilan', 'nickname'],
  gender: ['kelamin', 'jk', 'jeniskelamin', 'gender', 'lp'],
  birth_place: ['tempatlahir', 'tempat'],
  birth_date: ['tanggallahir', 'tgllahir', 'tglahir', 'tgl lahir', 'tanggallahir', 'lahir'],
  address: ['alamat', 'alamatsantri', 'alamatdomisili'],
  class: ['kelas', 'kelassiswa', 'kelasnya'],
  angkatan: ['angkatan', 'tahunmasuk', 'tahun'],
  status: ['status', 'statusantri', 'statussantri'],
  nik: ['nik', 'nomorktp', 'ktp'],
  parent_name: ['namawali', 'orangtua', 'namawali', 'namapak', 'ayah', 'wali'],
  parent_phone: ['nohpwali', 'nohp', 'hp', 'hpsiswa', 'nohporangtua', 'telp', 'telepon', 'telpon', 'hpp'],
};

function normalizeHeader(v: unknown): string {
  return String(v ?? '')
    .toLowerCase()
    .replace(/[_\-./\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

function headerIndex(head: string[], field: keyof ParsedRow): number {
  const aliases = HEADER_ALIASES[field].map(normalizeHeader);
  let idx = head.findIndex((h) => aliases.includes(h));
  if (idx >= 0) return idx;
  // fallback: prefix match, mis. "nisn/ nik" atau "nama penerima utama"
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
  // format Indonesia: dd-mm-yyyy atau dd/mm/yyyy
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

function parseGrid(grid: unknown[][]): { rows: ParsedRow[]; header: { key: keyof ParsedRow; title: string }[]; errors: RowError[] } {
  const empty = { rows: [] as ParsedRow[], header: PREVIEW_COLS, errors: [] as RowError[] };
  const clean = (grid ?? []).filter((r) => Array.isArray(r) && r.some((c) => String(c ?? '').trim() !== ''));
  if (clean.length === 0) return empty;

  const head = clean[0].map(normalizeHeader);
  const idx: Record<keyof ParsedRow, number> = {
    nis: headerIndex(head, 'nis'),
    name: headerIndex(head, 'name'),
    nickname: headerIndex(head, 'nickname'),
    gender: headerIndex(head, 'gender'),
    birth_place: headerIndex(head, 'birth_place'),
    birth_date: headerIndex(head, 'birth_date'),
    address: headerIndex(head, 'address'),
    class: headerIndex(head, 'class'),
    angkatan: headerIndex(head, 'angkatan'),
    status: headerIndex(head, 'status'),
    nik: headerIndex(head, 'nik'),
    parent_name: headerIndex(head, 'parent_name'),
    parent_phone: headerIndex(head, 'parent_phone'),
  };

  const parsed: ParsedRow[] = [];
  const errs: RowError[] = [];

  if (idx.nis < 0 || idx.name < 0) {
    const missing = [
      idx.nis < 0 ? 'NIS' : null,
      idx.name < 0 ? 'Nama' : null,
    ].filter(Boolean).join(' dan ');
    errs.push({ row: 1, field: 'header', message: `Kolom ${missing} wajib ada di baris pertama.` });
    return { rows: parsed, header: PREVIEW_COLS, errors: errs };
  }

  for (let r = 1; r < clean.length; r++) {
    const c = clean[r];
    const val = (i: number) => (i >= 0 ? String(c[i] ?? '').trim() : '');
    const row: ParsedRow = {
      nis: val(idx.nis),
      name: val(idx.name),
      nickname: val(idx.nickname),
      gender: normalizeGender(c[idx.gender]),
      birth_place: val(idx.birth_place),
      birth_date: normalizeDate(c[idx.birth_date]),
      address: val(idx.address),
      class: val(idx.class),
      angkatan: val(idx.angkatan),
      status: (val(idx.status) || 'aktif').toLowerCase(),
      nik: val(idx.nik).replace(/\D/g, ''),
      parent_name: val(idx.parent_name),
      parent_phone: normalizePhone(c[idx.parent_phone]),
    };
    if (!row.nis && !row.nik) errs.push({ row: r + 1, field: 'NIS', message: 'NIS/NIK kosong' });
    if (!row.name) errs.push({ row: r + 1, field: 'Nama', message: 'Nama kosong' });
    if (row.gender && row.gender !== 'l' && row.gender !== 'p') {
      errs.push({ row: r + 1, field: 'Kelamin', message: 'Harus L atau P' });
    }
    if (row.nis && (row.nis.length < 4 || row.nis.length > 20)) {
      errs.push({ row: r + 1, field: 'NIS', message: 'NIS harus 4-20 karakter' });
    }
    if (row.nik && row.nik.length !== 16) {
      errs.push({ row: r + 1, field: 'NIK', message: 'NIK harus 16 digit' });
    }
    if (!row.class) errs.push({ row: r + 1, field: 'Kelas', message: 'Kelas wajib diisi' });
    if (row.birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(row.birth_date)) {
      errs.push({ row: r + 1, field: 'Tanggal Lahir', message: 'Format harus YYYY-MM-DD' });
    }
    parsed.push(row);
  }
  return { rows: parsed, header: PREVIEW_COLS, errors: errs };
}

export default function SantriImportPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [fileName, setFileName] = useState('');
  const [grid, setGrid] = useState<unknown[][]>([]);
  const [importing, setImporting] = useState(false);

  const { rows, header, errors } = useMemo(() => parseGrid(grid), [grid]);

  const downloadTemplate = () => {
    const head = COLUMNS.map((c) => c.title);
    const sample = COLUMNS.map((c) => TEMPLATE_ROW[c.key]);
const aoa = [
      head,
      sample,
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = COLUMNS.map((c) => ({ wch: c.width }));
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Santri');
    XLSX.writeFile(wb, TEMPLATE_FILE);
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onerror = () => showToast('error', 'Gagal membaca file.');
    reader.onload = () => {
      try {
        const wb = XLSX.read(new Uint8Array(reader.result as ArrayBuffer), { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws) { showToast('error', 'File tidak berisi data.'); return; }
        const data = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: '', blankrows: false });
        setGrid(data);
        setFileName(file.name);
      } catch {
        showToast('error', 'File tidak bisa dibaca. Gunakan .xlsx hasil template.');
      }
    };
    reader.readAsArrayBuffer(file);
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
          Tambahkan banyak santri sekaligus dari file Excel (.xlsx). Unduh template, isi, lalu unggah kembali. Hanya format .xlsx yang diterima.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Input */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">File Excel</label>
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100"
              >
                <Download size={14} /> Unduh Template
              </button>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center transition hover:border-sky-400 hover:bg-sky-50/40">
              <FileSpreadsheet className="mb-3 h-10 w-10 text-emerald-600" />
              <span className="text-sm font-bold text-slate-700">
                {fileName || 'Klik untuk pilih file .xlsx'}
              </span>
              <span className="mt-1 text-xs text-slate-400">
                Hanya baris pertama sheet yang dipakai sebagai header kolom. Baris kosong dilewati.
              </span>
              <input
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) readFile(f);
                }}
              />
            </label>

            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Kolom yang dibaca</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {COLUMNS.map((c) => c.title).join(' · ')}
              </p>
              <p className="mt-2 text-[11px] text-slate-400">
                Nama kolom tidak harus persis sama (mis. &quot;No HP Wali&quot; tetap dikenali). Kolom <b>NO HP Wali</b>, <b>Tempat/Tanggal Lahir</b>, dan <b>NIK</b> boleh diisi atau dikosongkan. Kelas wajib diisi.
              </p>
            </div>
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
              <div className="ap-table-wrap max-h-[26rem] overflow-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0">
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                      {header.map((h) => (
                        <th key={h.key} className="whitespace-nowrap px-3 py-2 font-bold">{h.title}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        {header.map((h) => (
                          <td
                            key={h.key}
                            className={`whitespace-nowrap px-3 py-2 ${
                              h.key === 'name' ? 'font-bold text-slate-900'
                                : h.key === 'nis' ? 'font-mono font-semibold text-slate-700'
                                  : 'text-slate-500'
                            }`}
                          >
                            {h.key === 'gender'
                              ? (r.gender === 'l' ? 'L' : r.gender === 'p' ? 'P' : r.gender)
                              : r[h.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-full min-h-[16rem] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <Users className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm font-bold text-slate-500">Belum ada data</p>
                <p className="text-xs text-slate-400">Unduh template Excel lalu unggah file-nya di sini.</p>
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