import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle, ArrowRight, CheckCircle2, FileText, GitCompareArrows,
  History, ListChecks, XCircle,
} from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';
import EraporMockup from './EraporMockup';

type Kesiapan = {
  kebutuhan: string;
  alma: string;
  s: 'siap' | 'mapping' | 'belum';
  catatan: string;
};

const KESIAPAN: Kesiapan[] = [
  {
    kebutuhan: 'NISN siswa',
    alma: 'Belum ada kolom `santri.nisn`',
    s: 'belum',
    catatan: 'Ditambahkan di Jilid 90',
  },
  {
    kebutuhan: 'NPSN madrasah',
    alma: 'Belum ada di settings',
    s: 'belum',
    catatan: 'Ditambahkan di Jilid 90',
  },
  {
    kebutuhan: 'Rombel / kode kelas resmi',
    alma: 'Kelas masih string bebas (7–12, PSB)',
    s: 'mapping',
    catatan: 'Perlu pemetaan ke rombel Kemenag',
  },
  {
    kebutuhan: 'Predikat A/B/C/D per KKM',
    alma: 'Baru predikat KKM internal',
    s: 'mapping',
    catatan: 'Pemetaan di weight engine',
  },
  {
    kebutuhan: 'Semester 1/2 + tahun ajaran',
    alma: 'Sudah kanonik (`1`/`2`, `2026/2027`)',
    s: 'siap',
    catatan: 'Format sama dengan Kemenag',
  },
  {
    kebutuhan: 'Identitas lengkap (NIK, TTL, ortu)',
    alma: 'Sudah ada di tabel santri',
    s: 'siap',
    catatan: 'Tinggal lengkapi NISN-nya',
  },
  {
    kebutuhan: 'Nilai per mapel + rapor tersimpan',
    alma: 'Sudah ada (grades, raports, lock)',
    s: 'siap',
    catatan: 'Sumber untuk ekspor nilai',
  },
];

const ALUR = [
  {
    n: 1,
    title: 'Alma menyiapkan data',
    desc: 'Santri, nilai, dan rapor dihitung seperti sekarang — Alma tetap sumber operasional harian.',
  },
  {
    n: 2,
    title: 'Ekspor file resmi',
    desc: 'Tombol di /admin/erapor menghasilkan Excel/JSON sesuai template RDM Kemenag, lengkap dengan preview validasi.',
  },
  {
    n: 3,
    title: 'Impor ke RDM / EMIS',
    desc: 'Operator memasukkan file ke E-Rapor Madrasah, atau RDM menarik data siswa langsung dari EMIS.',
  },
  {
    n: 4,
    title: 'Pantau dari Alma',
    desc: 'Log sinkron, kelengkapan data, dan selisih EMIS tampil kembali di halaman /admin/erapor.',
  },
];

const JILID = [
  {
    n: 90,
    title: 'Data pokok siap EMIS',
    items: [
      'Kolom `santri.nisn` + index',
      'Settings `npsn`, `jenjang_madrasah`',
      'Field NISN di form admin & PSB',
      'Indikator kelengkapan data',
    ],
  },
  {
    n: 91,
    title: 'Ekspor data pokok & nilai',
    items: [
      'Endpoint ekspor Excel/JSON',
      'Generator ikut template RDM',
      'Preview validasi sebelum unduh',
      'Semester & tahun ajaran terpilih',
    ],
  },
  {
    n: 92,
    title: 'Monitoring sinkron',
    items: [
      'Tabel `erapor_sync`',
      'Halaman /admin/erapor (mockup di atas)',
      'Log ekspor/impor + status per baris',
      'Selisih Alma vs EMIS',
    ],
  },
];

function StatusChip({ s }: { s: Kesiapan['s'] }) {
  if (s === 'siap')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
        <CheckCircle2 size={12} /> Siap
      </span>
    );
  if (s === 'mapping')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
        <AlertTriangle size={12} /> Perlu mapping
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
      <XCircle size={12} /> Belum ada
    </span>
  );
}

export default function PrdPage() {
  return (
    <PublicLayout>
      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-10 md:pt-16">
        <header className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              Rancangan
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-500">
              Belum diimplementasi
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-outfit)] mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
            Integrasi E-Rapor Madrasah
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
            Pratinjau desain hasil akhir: halaman <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">/admin/erapor</code>{' '}
            untuk mengekspor data pokok &amp; nilai ke format resmi RDM, mencatat log sinkron,
            dan memantau selisih dengan EMIS — semuanya dari web Alma.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            8 Oktober 2026 · Rencana 3 jilid · Rujukan:{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5">docs/ERAPOR_SYNC_PLAN.md</code>
          </p>
        </header>

        <section className="mt-12" aria-labelledby="mockup-title">
          <h2 id="mockup-title" className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <ListChecks size={16} /> Hasil akhir — tampilan /admin/erapor
          </h2>
          <div className="mt-4">
            <EraporMockup />
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Data pada gambar di atas adalah contoh. Angka sebenarnya diambil dari tabel{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">santri</code>,{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">grades</code>, dan{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">raports</code>.
          </p>
        </section>

        <section className="mt-16" aria-labelledby="alur-title">
          <h2 id="alur-title" className="text-sm font-bold text-slate-500">
            Cara kerja sinkronisasi
          </h2>
          <ol className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            {ALUR.map((a) => (
              <li
                key={a.n}
                className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <span className="font-[family-name:var(--font-outfit)] text-2xl font-black text-sky-500">
                  {a.n}
                </span>
                <h3 className="mt-1 text-sm font-bold text-slate-800">{a.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{a.desc}</p>
                {a.n < 4 && (
                  <ArrowRight
                    size={18}
                    className="absolute -right-2.5 top-1/2 hidden -translate-y-1/2 rounded-full border border-slate-200 bg-white text-slate-400 md:block"
                    aria-hidden
                  />
                )}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16" aria-labelledby="kesiapan-title">
          <h2 id="kesiapan-title" className="text-sm font-bold text-slate-500">
            Kesiapan data alma saat ini
          </h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="px-5 py-3 font-semibold">Kebutuhan E-Rapor / EMIS</th>
                  <th className="px-5 py-3 font-semibold">Kondisi alma</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {KESIAPAN.map((k) => (
                  <tr key={k.kebutuhan} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{k.kebutuhan}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {k.alma.includes('`') ? (
                        <code className="text-xs">{k.alma.split('`').map((part, i) => (i % 2 ? <code key={i} className="rounded bg-slate-100 px-1">{part}</code> : part))}</code>
                      ) : (
                        k.alma
                      )}
                      <span className="mt-0.5 block text-xs text-slate-400">{k.catatan}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusChip s={k.s} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 md:flex-row md:items-start">
          <AlertTriangle size={22} className="shrink-0 text-amber-600" aria-hidden />
          <div>
            <h2 className="text-sm font-bold text-amber-900">Batasan yang harus dipahami</h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-amber-900/80">
              E-Rapor Madrasah (RDM) tidak menyediakan API tulis untuk sistem pihak ketiga,
              sehingga sinkron dua arah realtime tidak mungkin. Yang dibangun adalah{' '}
              <b>ekspor file sesuai template resmi</b>, impor manual oleh operator (atau tarik
              data dari EMIS), plus <b>monitoring lengkap di web Alma</b> supaya tidak ada data
              yang tercecer.
            </p>
          </div>
        </section>

        <section className="mt-16" aria-labelledby="roadmap-title">
          <h2 id="roadmap-title" className="text-sm font-bold text-slate-500">
            Rencana pengerjaan
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Nomor menyesuaikan jilid terakhir yang sudah live: <b>Jilid 89 = Perbaikan data tahfidz tampil</b>{' '}
            (sebelumnya: 88 = kelola semua akun, 84 = kelola akun wali santri). Rencana E-Rapor berikutnya mulai dari Jilid 90.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {JILID.map((j) => (
              <div key={j.n} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-black text-sky-700">
                    Jilid {j.n}
                  </span>
                  <h3 className="text-sm font-bold text-slate-800">{j.title}</h3>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                  {j.items.map((it) => (
                    <li key={it} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" aria-hidden />
                      {it.includes('`') ? (
                        <span>
                          {it.split('`').map((part, i) =>
                            i % 2 ? (
                              <code key={i} className="rounded bg-slate-100 px-1 text-xs">
                                {part}
                              </code>
                            ) : (
                              part
                            ),
                          )}
                        </span>
                      ) : (
                        it
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link
            href="/audit-eraport"
            className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-sky-700"
          >
            <GitCompareArrows size={16} /> Lihat Audit eRapor
          </Link>
          <Link
            href="/admin/raport"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-sky-300"
          >
            <History size={16} /> eRapor Saat Ini
          </Link>
          <span className="inline-flex items-center gap-2 px-1 py-3 text-sm text-slate-400">
            <FileText size={15} /> Detail lengkap: docs/ERAPOR_SYNC_PLAN.md
          </span>
        </div>
      </main>
    </PublicLayout>
  );
}
