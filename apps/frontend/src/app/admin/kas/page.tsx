"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getKasCategories, createKasCategory, updateKasCategory, getKasTransactions, createKasTransaction, deleteKasTransaction, getKasAudit, KasCategory, KasTransaction, KasAudit } from "@/lib/api";
import { exportToPDF, exportToExcel } from "@/lib/export";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp, FileDown, FileSpreadsheet } from "lucide-react";

function fmtRp(n: number) { return "Rp " + (n || 0).toLocaleString("id-ID"); }
function todayStr() { return new Date().toISOString().split("T")[0]; }
function lastMonthRange() {
  const d = new Date();
  const from = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const to = new Date(d.getFullYear(), d.getMonth(), 0);
  return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] };
}

// Batas keras endpoint /kas/transactions (handler menolak limit > 200).
const TX_LIMIT = 200;

type Tab = "papan" | "tx" | "cat" | "lr";

const TABS: { key: Tab; label: string }[] = [
  { key: "papan", label: "Papan Kas" },
  { key: "tx", label: "Transaksi" },
  { key: "cat", label: "Kategori" },
  { key: "lr", label: "Laba Rugi" },
];

// ── Gaya tabel mengikuti halaman Data Santri (/admin/kesantrian) ─────────────
const TH = "px-4 py-3 font-bold";
const TD = "px-4 py-3.5";
const THEAD_TR = "border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500";
const CARD = "rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden";
const BTN_GHOST =
  "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50";
const BTN_SOFT =
  "inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50";
const BTN_MAIN =
  "inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-50";
const INPUT = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

/**
 * Laba Rugi disusun dari angka audit, BUKAN dari dijumlahkan ulang di frontend.
 * expense_groups sengaja dipakai supaya penjumlahannya tidak pernah meleset dari
 * audit.expense (backend yang mengunci kedua angka itu).
 */
type LRKind = "section" | "income" | "expense" | "total" | "result";
type LRLine = { kind: LRKind; label: string; count: number; amount: number };

function EmptyRow({ col, children }: { col: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={col} className="px-4 py-12 text-center text-sm text-slate-400">
        {children}
      </td>
    </tr>
  );
}

export default function KasAdminPage() {
  const [tab, setTab] = useState<Tab>("papan");
  const [txs, setTxs] = useState<KasTransaction[]>([]);
  const [cats, setCats] = useState<KasCategory[]>([]);
  const [audit, setAudit] = useState<KasAudit | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [drill, setDrill] = useState<string | null>(null);
  const [kind, setKind] = useState("all");
  const [form, setForm] = useState({ date: todayStr(), kind: "masuk", category_id: "", amount: "", method: "manual", notes: "" });
  const [catName, setCatName] = useState("");
  const [editingCat, setEditingCat] = useState<{ id: number; name: string } | null>(null);
  const [catKind, setCatKind] = useState("masuk");
  const [delId, setDelId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    const [t, c, a] = await Promise.all([
      getKasTransactions({ date_from: from, date_to: to, limit: TX_LIMIT }),
      getKasCategories(),
      getKasAudit(from, to),
    ]);
    setTxs(t);
    setCats(c);
    setAudit(a);
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createKasTransaction({ date: form.date, kind: form.kind, category_id: form.category_id ? Number(form.category_id) : 0, amount: Number(form.amount), method: form.method, notes: form.notes });
    if (res.success) { showToast("success", "Transaksi dicatat."); setForm({ ...form, amount: "", notes: "" }); load(); }
    else showToast("error", res.message || "Gagal.");
  };

  const addCat = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createKasCategory({ name: catName, kind: catKind });
    if (res.success) { showToast("success", "Kategori ditambah."); setCatName(""); load(); }
    else showToast("error", res.message || "Gagal.");
  };

  // Filter "Jenis" diterapkan di sisi klien supaya tidak menambah request dan
  // supaya dropdown kategori pada form tetap memuat seluruh kategori.
  const txsView = useMemo(() => (kind === "all" ? txs : txs.filter((t) => t.kind === kind)), [txs, kind]);
  const catsView = useMemo(() => (kind === "all" ? cats : cats.filter((c) => c.kind === kind)), [cats, kind]);

  const formCat = cats.find((c) => String(c.id) === form.category_id);
  const formCatAuto = form.kind === "masuk" && !!formCat?.is_auto_source;

  const drillRows = drill && audit ? (audit.rows[drill] ?? []) : [];
  const drillSrc = audit?.sources.find((s) => s.key === drill);
  const periodo = from || to ? `${from || "awal"} s/d ${to || "hari ini"}` : "seluruh riwayat";
  const teksAnomali = audit?.anomalies.length ?? 0;
  const saldoMinus = audit ? audit.balance < 0 : false;

  // ── Laba Rugi: seluruh angka diambil dari audit, tidak ada penjumlahan ulang ──
  const lrLines = useMemo<LRLine[]>(() => {
    if (!audit) return [];
    const l: LRLine[] = [
      { kind: "section", label: "PENDAPATAN", count: audit.count_in, amount: 0 },
      ...audit.sources.map((s) => ({ kind: "income" as LRKind, label: s.label, count: s.count, amount: s.amount })),
      { kind: "total", label: "Total Pendapatan", count: audit.count_in, amount: audit.total_income },
      { kind: "section", label: "BIAYA / PENGELUARAN", count: audit.count_out, amount: 0 },
      ...audit.expense_groups.map((g) => ({ kind: "expense" as LRKind, label: g.label, count: g.count, amount: g.amount })),
      { kind: "total", label: "Total Biaya", count: audit.count_out, amount: audit.expense },
    ];
    l.push({
      kind: "result",
      label: audit.balance >= 0 ? "LABA BERSIH" : "RUGI BERSIH",
      count: audit.count_in + audit.count_out,
      amount: audit.balance,
    });
    return l;
  }, [audit]);

  // ── Export PDF / Excel, isi mengikuti tab yang sedang aktif ──────────────────
  const exportPayload = useCallback(() => {
    const stamp = todayStr();
    if (tab === "tx") {
      return {
        title: "Log Transaksi Kas",
        columns: ["Kode", "Tanggal", "Jenis", "Kategori", "Nominal", "Keterangan", "Dicatat Oleh"],
        rows: txsView.map((t) => [t.code || "-", t.date, t.kind, t.category || "-", fmtRp(t.amount), t.notes || "-", t.creator || "-"]),
        filename: `log-transaksi-kas-${stamp}`,
      };
    }
    if (tab === "cat") {
      return {
        title: "Kategori Kas",
        columns: ["Kode", "Nama", "Jenis", "Sumber", "Dibuat Oleh"],
        rows: catsView.map((c) => [c.code || "-", c.name, c.kind, c.is_auto_source ? "otomatis" : "manual", c.creator || "-"]),
        filename: `kategori-kas-${stamp}`,
      };
    }
    if (tab === "lr") {
      return {
        title: "Laporan Laba Rugi",
        columns: ["Keterangan", "Jumlah Baris", "Nominal"],
        rows: lrLines.filter((l) => l.kind !== "section").map((l) => [l.label, l.count, fmtRp(l.amount)]),
        filename: `laba-rugi-${stamp}`,
      };
    }
    return {
      title: "Papan Kas",
      columns: ["Sumber Pemasukan", "Asal", "Jumlah Baris", "Nominal"],
      rows: [
        ...(audit?.sources ?? []).map((s) => [s.label, s.origin === "otomatis" ? `otomatis dari ${s.table}` : "manual", s.count, fmtRp(s.amount)]),
        ["TOTAL PEMASUKAN", "", audit?.count_in ?? 0, fmtRp(audit?.total_income ?? 0)],
        ["TOTAL PENGELUARAN", "", audit?.count_out ?? 0, fmtRp(audit?.expense ?? 0)],
        [audit && audit.balance >= 0 ? "LABA BERSIH" : "RUGI BERSIH", "", "", fmtRp(audit?.balance ?? 0)],
      ],
      filename: `papan-kas-${stamp}`,
    };
  }, [tab, txsView, catsView, audit, lrLines]);

  const runExport = async (as: "pdf" | "xlsx") => {
    setExporting(true);
    try {
      const p = exportPayload();
      if (as === "pdf") await exportToPDF(p.title, p.columns, p.rows, p.filename);
      else await exportToExcel(p.title, p.columns, p.rows, p.filename);
    } catch {
      showToast("error", "Export gagal. Coba lagi.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900">Kas &amp; Laba Rugi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Semua angka berasal dari satu sumber hitungan (audit), jadi Papan Kas, Transaksi, dan Laba Rugi tidak mungkin berbeda sendiri.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => runExport("pdf")} disabled={exporting} className={BTN_SOFT}>
            <FileDown size={16} /> PDF
          </button>
          <button onClick={() => runExport("xlsx")} disabled={exporting} className={BTN_GHOST}>
            <FileSpreadsheet size={16} /> Excel
          </button>
        </div>
      </div>

      {/* ---------- FILTER PERIODE (memengaruhi ringkasan + tabel + export) ---------- */}
      <div className="mb-5 flex flex-wrap items-end gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-xs font-bold text-slate-500">
          Dari
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`${INPUT} mt-1`} />
        </label>
        <label className="text-xs font-bold text-slate-500">
          Sampai
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`${INPUT} mt-1`} />
        </label>
        <button onClick={() => { const d = new Date(); setFrom(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0]); setTo(todayStr()); }} className={BTN_GHOST}>
          Bulan ini
        </button>
        <button onClick={() => { const r = lastMonthRange(); setFrom(r.from); setTo(r.to); }} className={BTN_GHOST}>
          Bulan lalu
        </button>
        <button onClick={() => { setFrom(""); setTo(""); }} className={BTN_GHOST}>
          Semua
        </button>
        <p className="ml-auto text-xs text-slate-500">
          Menampilkan: <b className="text-slate-700">{periodo}</b>
        </p>
      </div>

      {/* ---------- PERLU PERHATIAN ---------- */}
      {(teksAnomali > 0 || saldoMinus) && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 text-sm font-black text-amber-900">
            Perlu Perhatian ({teksAnomali + (saldoMinus ? 1 : 0)})
          </p>
          <ul className="space-y-2">
            {saldoMinus && audit && (
              <li className="text-sm text-rose-800">
                <b>Saldo kas minus {fmtRp(Math.abs(audit.balance))}.</b> Pengeluaran lebih besar daripada pemasukan pada periode ini.{" "}
                <span className="text-xs text-slate-500">(seluruh riwayat)</span>
              </li>
            )}
            {audit?.anomalies.map((a, i) => (
              <li key={i} className="text-sm text-amber-900">
                <b>{a.title}.</b> {a.detail}{" "}
                <span className="text-xs text-slate-500">({a.scope}{a.amount ? ` · ${fmtRp(a.amount)}` : a.count ? ` · ${a.count} baris` : ""})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---------- RINGKASAN ---------- */}
      {audit && (
        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Pemasukan ({audit.count_in} baris)</p>
            <p className="mt-1 text-2xl font-black text-emerald-700">{fmtRp(audit.total_income)}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-700">Pengeluaran ({audit.count_out} baris)</p>
            <p className="mt-1 text-2xl font-black text-rose-700">{fmtRp(audit.expense)}</p>
          </div>
          <div className={`rounded-2xl border p-4 ${audit.balance < 0 ? "border-rose-300 bg-rose-50" : "border-emerald-200 bg-emerald-50"}`}>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Saldo / Laba</p>
            <p className={`mt-1 text-2xl font-black ${audit.balance < 0 ? "text-rose-700" : "text-emerald-700"}`}>{fmtRp(audit.balance)}</p>
            <p className="mt-1 text-[11px] text-slate-500">
              {fmtRp(audit.total_income)} &minus; {fmtRp(audit.expense)}
            </p>
          </div>
        </div>
      )}

      {/* ---------- TAB ---------- */}
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider transition ${
              tab === t.key ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25" : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
        {tab !== "papan" && tab !== "lr" && (
          <select value={kind} onChange={(e) => setKind(e.target.value)} className={`${INPUT} ml-auto w-auto`}>
            <option value="all">Semua jenis</option>
            <option value="masuk">Masuk</option>
            <option value="keluar">Keluar</option>
          </select>
        )}
      </div>

      {/* ---------- TAB: PAPAN KAS ---------- */}
      {tab === "papan" && (
        <div className={CARD}>
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Dari mana pemasukan ini berasal &mdash; klik untuk melihat rinciannya
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className={THEAD_TR}>
                <tr>
                  <th className={TH}>Sumber</th>
                  <th className={TH}>Asal</th>
                  <th className={`${TH} text-right`}>Jumlah Baris</th>
                  <th className={`${TH} text-right`}>Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {audit?.sources.map((s) => (
                  <tr key={s.key} className="transition hover:bg-slate-50">
                    <td className={TD}>
                      <button onClick={() => setDrill(drill === s.key ? null : s.key)} className="flex items-center gap-1 font-bold text-emerald-700 transition hover:text-emerald-800">
                        {drill === s.key ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {s.label}
                      </button>
                    </td>
                    <td className={`${TD} text-xs text-slate-500`}>{s.origin === "otomatis" ? `otomatis dari ${s.table}` : "dicatat manual"}</td>
                    <td className={`${TD} text-right text-xs text-slate-500`}>{s.count} baris</td>
                    <td className={`${TD} text-right font-black text-emerald-700`}>{fmtRp(s.amount)}</td>
                  </tr>
                ))}
                {!audit && <EmptyRow col={4}>Memuat data kas...</EmptyRow>}
                <tr className="bg-slate-50 font-black">
                  <td className={TD}>Total pemasukan</td>
                  <td className={TD} />
                  <td className={`${TD} text-right text-xs text-slate-500`}>{audit?.count_in ?? 0} baris</td>
                  <td className={`${TD} text-right text-emerald-700`}>{fmtRp(audit?.total_income ?? 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {drill && (
            <div className="border-t border-slate-200 px-4 py-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                Rincian {drillSrc?.label} ({fmtRp(drillSrc?.amount ?? 0)} dari {drillSrc?.count ?? 0} baris)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className={THEAD_TR}>
                    <tr>
                      <th className={TH}>Tanggal</th>
                      <th className={TH}>Nama</th>
                      <th className={TH}>Keterangan</th>
                      <th className={`${TH} text-right`}>Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {drillRows.map((r) => (
                      <tr key={r.id} className="transition hover:bg-slate-50">
                        <td className={TD}>{r.date}</td>
                        <td className={`${TD} font-bold`}>{r.label}</td>
                        <td className={`${TD} text-slate-500`}>{r.detail || "-"}</td>
                        <td className={`${TD} text-right`}>{fmtRp(r.amount)}</td>
                      </tr>
                    ))}
                    {drillRows.length === 0 && <EmptyRow col={4}>Tidak ada baris di periode ini.</EmptyRow>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(audit?.excluded_count ?? 0) > 0 && (
            <div className="border-t border-slate-200 px-4 py-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                Tidak dijumlahkan ({audit?.excluded_count} baris, {fmtRp(audit?.excluded_amount ?? 0)}) &mdash; sudah termasuk hitungan sumber di atas
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className={THEAD_TR}>
                    <tr>
                      <th className={TH}>Tanggal</th>
                      <th className={TH}>Kategori</th>
                      <th className={TH}>Keterangan</th>
                      <th className={`${TH} text-right`}>Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {audit?.excluded_rows.map((r) => (
                      <tr key={r.id} className="text-slate-400 transition hover:bg-slate-50">
                        <td className={TD}>{r.date}</td>
                        <td className={TD}>{r.label}</td>
                        <td className={TD}>{r.detail || "-"}</td>
                        <td className={`${TD} text-right line-through`}>{fmtRp(r.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------- TAB: LABA RUGI ---------- */}
      {tab === "lr" && (
        <div className={CARD}>
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Periode {periodo} &mdash; disusun dari angka audit, tidak dijumlahkan ulang di halaman ini
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className={THEAD_TR}>
                <tr>
                  <th className={TH}>Keterangan</th>
                  <th className={`${TH} text-right`}>Jumlah Baris</th>
                  <th className={`${TH} text-right`}>Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lrLines.map((l, i) => {
                  if (l.kind === "section") {
                    return (
                      <tr key={`s-${i}`} className="bg-slate-50">
                        <td className={`${TD} text-xs font-black uppercase tracking-wider text-slate-500`} colSpan={3}>
                          {l.label} <span className="font-bold normal-case tracking-normal text-slate-400">({l.count} baris)</span>
                        </td>
                      </tr>
                    );
                  }
                  if (l.kind === "total") {
                    return (
                      <tr key={`t-${i}`} className="bg-white font-black">
                        <td className={TD}>{l.label}</td>
                        <td className={`${TD} text-right text-xs text-slate-500`}>{l.count}</td>
                        <td className={`${TD} text-right text-slate-900`}>{fmtRp(l.amount)}</td>
                      </tr>
                    );
                  }
                  if (l.kind === "result") {
                    const pos = l.amount >= 0;
                    return (
                      <tr key={`r-${i}`} className={`border-t-2 ${pos ? "border-emerald-300 bg-emerald-50" : "border-rose-300 bg-rose-50"}`}>
                        <td className={`${TD} text-sm font-black uppercase tracking-wider ${pos ? "text-emerald-700" : "text-rose-700"}`}>{l.label}</td>
                        <td className={`${TD} text-right text-xs text-slate-500`}>{l.count}</td>
                        <td className={`${TD} text-right text-lg font-black ${pos ? "text-emerald-700" : "text-rose-700"}`}>{fmtRp(l.amount)}</td>
                      </tr>
                    );
                  }
                  const isIn = l.kind === "income";
                  return (
                    <tr key={`l-${i}`} className="transition hover:bg-slate-50">
                      <td className={`${TD} pl-8 ${isIn ? "text-emerald-700" : "text-rose-700"}`}>{l.label}</td>
                      <td className={`${TD} text-right text-xs text-slate-500`}>{l.count}</td>
                      <td className={`${TD} text-right font-bold ${isIn ? "text-emerald-700" : "text-rose-700"}`}>{fmtRp(l.amount)}</td>
                    </tr>
                  );
                })}
                {!audit && <EmptyRow col={3}>Memuat data laba rugi...</EmptyRow>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------- TAB: TRANSAKSI ---------- */}
      {tab === "tx" && (
        <>
          <form onSubmit={submit} className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-6">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={INPUT} />
            <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value, category_id: "" })} className={INPUT}>
              <option value="masuk">Masuk</option>
              <option value="keluar">Keluar</option>
            </select>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={INPUT}>
              <option value="">- Kategori -</option>
              {cats.filter((c) => c.kind === form.kind).map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.is_auto_source ? " (otomatis)" : ""}</option>
              ))}
            </select>
            <input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Nominal" className={INPUT} />
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Keterangan" className={INPUT} />
            <button className={BTN_MAIN}>
              <Plus size={16} /> Catat
            </button>
          </form>

          {formCatAuto && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <b>Perhatian:</b> "{formCat?.name}" sudah dihitung otomatis dari SPP/Iuran/Donasi/Pendaftaran PSB. Kalau transaksi ini uang yang{" "}
              <b>sama</b>, tidak akan dijumlahkan lagi (aman). Kalau uang <b>lain</b>, pilih kategori biasa supaya tidak hilang dari hitungan.
            </div>
          )}

          <div className={CARD}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className={THEAD_TR}>
                  <tr>
                    <th className={TH}>Kode</th>
                    <th className={TH}>Tanggal</th>
                    <th className={TH}>Jenis</th>
                    <th className={TH}>Kategori</th>
                    <th className={`${TH} text-right`}>Nominal</th>
                    <th className={TH}>Keterangan</th>
                    <th className={TH}>Oleh</th>
                    <th className={`${TH} text-right`}>Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {txsView.map((t) => {
                    const c = cats.find((x) => x.id === t.category_id);
                    const auto = t.kind === "masuk" && !!c?.is_auto_source;
                    return (
                      <tr key={t.id} className={`transition hover:bg-slate-50 ${auto ? "bg-slate-50 text-slate-400" : ""}`}>
                        <td className={`${TD} font-mono text-xs`}>{t.code || "-"}</td>
                        <td className={TD}>{t.date}</td>
                        <td className={TD}>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${t.kind === "masuk" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                            {t.kind}
                          </span>
                        </td>
                        <td className={TD}>
                          {t.category || "-"}
                          {auto && <span className="mt-0.5 block text-[10px] text-slate-400">tidak dijumlahkan</span>}
                        </td>
                        <td className={`${TD} text-right font-bold`}>{fmtRp(t.amount)}</td>
                        <td className={`${TD} text-slate-500`}>{t.notes || "-"}</td>
                        <td className={TD}>{t.creator || "-"}</td>
                        <td className={`${TD} text-right`}>
                          <button onClick={() => setDelId(t.id)} aria-label="Hapus transaksi" className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {txsView.length === 0 && <EmptyRow col={8}>Belum ada transaksi pada periode ini.</EmptyRow>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ---------- TAB: KATEGORI ---------- */}
      {tab === "cat" && (
        <>
          <form onSubmit={addCat} className="mb-4 flex flex-wrap gap-2">
            <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Nama kategori" className={`${INPUT} max-w-xs`} />
            <select value={catKind} onChange={(e) => setCatKind(e.target.value)} className={`${INPUT} w-auto`}>
              <option value="masuk">Masuk</option>
              <option value="keluar">Keluar</option>
            </select>
            <button className={BTN_MAIN}>
              <Plus size={16} /> Tambah
            </button>
          </form>
          <div className={CARD}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className={THEAD_TR}>
                  <tr>
                    <th className={TH}>Kode</th>
                    <th className={TH}>Nama</th>
                    <th className={TH}>Jenis</th>
                    <th className={TH}>Dibuat Oleh</th>
                    <th className={`${TH} text-right`}>Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {catsView.map((c) => (
                    <tr key={c.id} className="transition hover:bg-slate-50">
                      <td className={`${TD} font-mono text-xs`}>{c.code || "-"}</td>
                      <td className={`${TD} font-bold`}>
                        {editingCat?.id === c.id ? (
                          <input value={editingCat.name} onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })} className={`${INPUT} max-w-xs`} />
                        ) : (
                          <>
                            {c.name}
                            {c.is_auto_source && <span className="mt-0.5 block text-[10px] font-normal text-amber-700">otomatis — tidak dijumlahkan dari transaksi</span>}
                          </>
                        )}
                      </td>
                      <td className={TD}>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${c.kind === "masuk" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                          {c.kind}
                        </span>
                      </td>
                      <td className={TD}>{c.creator || "-"}</td>
                      <td className={`${TD} text-right`}>
                        {editingCat?.id === c.id ? (
                          <button
                            onClick={async () => {
                              const r = await updateKasCategory(c.id, { name: editingCat.name, kind: c.kind });
                              if (r.success) { showToast("success", "Diubah."); setEditingCat(null); load(); }
                              else showToast("error", r.message || "Gagal.");
                            }}
                            className="text-sm font-bold text-emerald-600 transition hover:text-emerald-700"
                          >
                            Simpan
                          </button>
                        ) : (
                          <button onClick={() => setEditingCat({ id: c.id, name: c.name })} aria-label="Ubah kategori" className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50">
                            <Pencil size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {catsView.length === 0 && <EmptyRow col={5}>Belum ada kategori kas.</EmptyRow>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={delId !== null}
        onClose={() => setDelId(null)}
        onConfirm={async () => {
          if (delId) {
            const r = await deleteKasTransaction(delId);
            if (r.success) { showToast("success", "Dihapus."); load(); }
            else showToast("error", r.message || "Gagal.");
          }
          setDelId(null);
        }}
        title="Hapus transaksi?"
        message="Data yang dihapus tidak bisa dikembalikan."
      />
    </div>
  );
}