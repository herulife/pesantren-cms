'use client';

import React from 'react';
import jsPDF from 'jspdf';
import { Printer, Download, X } from 'lucide-react';

export interface KwitansiTx {
  code: string;
  date: string;
  santri_nis?: string;
  santri_name?: string;
  description: string;
  amount: number;
  method: string;
}

export interface KwitansiSchool {
  name: string;
  address: string;
  phone: string;
  logoUrl: string;
  city: string;
}

// Default sama dengan fallback Navbar (PublicLayout): logo + identitas lembaga.
export const DEFAULT_KWITANSI_SCHOOL: KwitansiSchool = {
  name: 'Darussunnah Parung',
  address: 'Jl. H. Mawi, Gg. Omega, Kp. Jati Waru, RT 003/RW 002, Waru, Kec. Parung, Kab. Bogor, Jawa Barat 16330',
  phone: '0857 7694 8779',
  logoUrl: '/assets/img/logo.jpg',
  city: 'Parung',
};

export function terbilang(n: number): string {
  const a = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  const t = (x: number): string => {
    if (x < 12) return a[x];
    if (x < 20) return t(x - 10) + ' belas';
    if (x < 100) return (t(Math.floor(x / 10)) + ' puluh ' + t(x % 10)).trim();
    if (x < 200) return ('seratus ' + t(x - 100)).trim();
    if (x < 1000) return (t(Math.floor(x / 100)) + ' ratus ' + t(x % 100)).trim();
    if (x < 2000) return ('seribu ' + t(x - 1000)).trim();
    if (x < 1000000) return (t(Math.floor(x / 1000)) + ' ribu ' + t(x % 1000)).trim();
    if (x < 1000000000) return (t(Math.floor(x / 1000000)) + ' juta ' + t(x % 1000000)).trim();
    return (t(Math.floor(x / 1000000000)) + ' miliar ' + t(x % 1000000000)).trim();
  };
  if (!n || n <= 0) return 'Nol rupiah';
  return t(Math.floor(n))
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ') + ' Rupiah';
}

function formatTanggalID(dateStr: string): string {
  const d = new Date((dateStr || '').slice(0, 10) + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatPeriode(period: string): string {
  const months = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const m = period.match(/^(\d{4})-(\d{2})/);
  if (!m) return period;
  const mi = parseInt(m[2], 10);
  return `${months[mi] || m[2]} ${m[1]}`;
}

export function resolveSchool(props: {
  schoolName?: string; schoolAddress?: string; schoolPhone?: string; city?: string; logoUrl?: string;
}): KwitansiSchool {
  return {
    name: (props.schoolName || '').trim() || DEFAULT_KWITANSI_SCHOOL.name,
    address: (props.schoolAddress || '').trim() || DEFAULT_KWITANSI_SCHOOL.address,
    phone: (props.schoolPhone || '').trim() || DEFAULT_KWITANSI_SCHOOL.phone,
    logoUrl: (props.logoUrl || '').trim() || DEFAULT_KWITANSI_SCHOOL.logoUrl,
    city: (props.city || '').trim() || DEFAULT_KWITANSI_SCHOOL.city,
  };
}

export function formatSchoolName(name: string): string {
	const n = (name || '').trim();
	if (!n) return 'Pondok Pesantren';
	return n.toLowerCase().startsWith('pondok pesantren') ? n : 'Pondok Pesantren ' + n;
}

const rp = (v: number) => 'Rp. ' + (v || 0).toLocaleString('id-ID');

// Dokumen kwitansi murni (dipakai preview layar + area cetak). Bukan tabel HTML:
// label kolom kiri lebar konsisten, titik dua sejajar vertikal.
export function KwitansiDocument({ data, school, petugas }: {
  data: KwitansiTx; school: KwitansiSchool; petugas?: string;
}) {
  const penerima = (petugas || '').trim() || '( ................................................ )';
  return (
    <div className="bg-white text-neutral-900">
      {/* Header: logo Navbar + identitas lembaga */}
      <div className="flex items-center gap-4">
        <img src={school.logoUrl} alt={`Logo ${school.name}`} className="h-14 w-14 shrink-0 object-contain sm:h-16 sm:w-16" />
        <div className="min-w-0">
          <p className="text-base font-bold uppercase leading-tight tracking-wide sm:text-lg">{formatSchoolName(school.name)}</p>
          <p className="mt-1 text-xs leading-snug text-neutral-700 sm:text-[13px]">{school.address}</p>
          <p className="text-xs text-neutral-700 sm:text-[13px]">Telp. {school.phone}</p>
        </div>
      </div>
      <hr className="my-4 border-t border-neutral-400" />
      {/* Judul */}
      <h3 className="text-center text-xl font-bold uppercase tracking-[0.2em] sm:text-2xl">Kwitansi</h3>
      <div className="mx-auto mt-1 h-0.5 w-16 bg-neutral-800" />
      {/* Informasi transaksi */}
      <div className="mx-auto mt-5 max-w-xl space-y-2.5 text-sm sm:text-[15px]">
        <div className="grid grid-cols-[150px_12px_1fr] gap-1 sm:grid-cols-[170px_12px_1fr]">
          <span className="text-neutral-700">Nomor Transaksi</span><span>:</span>
          <span className="font-mono font-bold">{data.code}</span>
        </div>
        <div className="grid grid-cols-[150px_12px_1fr] gap-1 sm:grid-cols-[170px_12px_1fr]">
          <span className="text-neutral-700">Sudah Diterima Dari</span><span>:</span>
          <span className="font-bold">{data.santri_nis ? `${data.santri_nis} / ` : ''}{data.santri_name || '-'}</span>
        </div>
        <div className="grid grid-cols-[150px_12px_1fr] gap-1 sm:grid-cols-[170px_12px_1fr]">
          <span className="text-neutral-700">Uang Sebesar</span><span>:</span>
          <span className="font-bold italic">{terbilang(data.amount)}</span>
        </div>
        <div className="grid grid-cols-[150px_12px_1fr] gap-1 sm:grid-cols-[170px_12px_1fr]">
          <span className="text-neutral-700">Untuk Pembayaran</span><span>:</span>
          <span className="break-words">{data.description}{data.method ? <span className="text-neutral-500"> ({data.method})</span> : null}</span>
        </div>
      </div>
      {/* Nominal + tanggal */}
      <div className="mx-auto mt-7 flex max-w-xl items-start justify-between gap-4">
        <p className="text-xl font-bold sm:text-2xl">{rp(data.amount)}</p>
        <div className="text-right text-sm sm:text-[15px]">
          <p>{school.city}, {formatTanggalID(data.date)}</p>
          <p className="mt-1">Penerima</p>
          <p className="mt-14 font-bold underline underline-offset-4">{penerima}</p>
        </div>
      </div>
    </div>
  );
}

async function loadLogoDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: 'force-cache' });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith('image/')) return null;
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(typeof fr.result === 'string' ? fr.result : null);
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Unduh PDF dengan layout yang sama seperti preview. Nama file: Kwitansi-{NomorTransaksi}.pdf
export async function downloadKwitansiPDF(data: KwitansiTx, school: KwitansiSchool, receiverName?: string): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const W = 210;
  const M = 15;
  const maxW = W - M * 2;
  let y = M;

  const logo = await loadLogoDataUrl(school.logoUrl);
  const headX = M + (logo ? 24 : 0);
  if (logo) {
    try {
      const fmt = logo.includes('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(logo, fmt, M, y, 20, 20);
    } catch { /* tanpa logo bila gagal decode */ }
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const titleLines = doc.splitTextToSize(formatSchoolName(school.name).toUpperCase(), maxW - (logo ? 24 : 0));
  doc.text(titleLines, headX, y + 6);
  y += 6 + titleLines.length * 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const addrLines = doc.splitTextToSize(school.address, maxW - (logo ? 24 : 0));
  doc.text(addrLines, headX, y);
  y += addrLines.length * 4.2;
  doc.text(`Telp. ${school.phone}`, headX, y);
  y += 6;
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(150, 150, 150);
  doc.line(M, y, W - M, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('KWITANSI', W / 2, y, { align: 'center' });
  y += 3;
  doc.setDrawColor(0, 0, 0);
  doc.line(W / 2 - 10, y, W / 2 + 10, y);
  y += 10;

  const labelX = M;
  const colonX = M + 52;
  const valueX = M + 57;
  doc.setFontSize(11);
  const row = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70, 70, 70);
    doc.text(label, labelX, y);
    doc.setTextColor(0, 0, 0);
    doc.text(':', colonX, y);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(value, W - valueX - M);
    doc.text(lines, valueX, y);
    y += Math.max(lines.length * 5.2, 7);
  };
  row('Nomor Transaksi', data.code, true);
  row('Sudah Diterima Dari', `${data.santri_nis ? `${data.santri_nis} / ` : ''}${data.santri_name || '-'}`, true);
  row('Uang Sebesar', terbilang(data.amount), true);
  row('Untuk Pembayaran', `${data.description}${data.method ? ` (${data.method})` : ''}`);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(rp(data.amount), M, y);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${school.city}, ${formatTanggalID(data.date)}`, W - M, y, { align: 'right' });
  y += 7;
  doc.text('Penerima', W - M, y, { align: 'right' });
  y += 28;
  doc.setFont('helvetica', 'bold');
  const penerima = (receiverName || '').trim() || '( ................................................ )';
  doc.text(penerima, W - M, y, { align: 'right' });

  const safeCode = (data.code || 'tanpa-nomor').replace(/[^A-Za-z0-9-]+/g, '-');
  doc.save(`Kwitansi-${safeCode}.pdf`);
}

export default function KwitansiModal({ data, schoolName, schoolAddress, schoolPhone, city, petugas, logoUrl, onClose }: {
  data: KwitansiTx;
  schoolName?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  city?: string;
  petugas?: string;
  logoUrl?: string;
  onClose: () => void;
}) {
  const school = resolveSchool({ schoolName, schoolAddress, schoolPhone, city, logoUrl });
  const [downloading, setDownloading] = React.useState(false);

  const doPrint = () => window.print();
  const doDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadKwitansiPDF(data, school, petugas);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      {/* Overlay layar: disembunyikan saat print */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 print:hidden" onClick={onClose}>
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-slate-100 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white p-6 sm:p-10">
            <KwitansiDocument data={data} school={school} petugas={petugas} />
          </div>
          <div className="flex flex-col justify-end gap-2 border-t border-slate-200 bg-white p-4 sm:flex-row">
            <button onClick={onClose} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
              <X size={16} /> Tutup
            </button>
            <button onClick={() => void doDownload()} disabled={downloading} className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60">
              <Download size={16} /> {downloading ? 'Menyiapkan PDF…' : 'Download PDF'}
            </button>
            <button onClick={doPrint} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
              <Printer size={16} /> Cetak Kwitansi
            </button>
          </div>
        </div>
      </div>
      {/* Area cetak: hanya tampil saat print (A4 portrait, margin aman) */}
      <div className="hidden print:block">
        <KwitansiDocument data={data} school={school} petugas={petugas} />
      </div>
      <style>{`@page { size: A4 portrait; margin: 12mm; } @media print { body { background: #fff !important; } }`}</style>
    </>
  );
}
