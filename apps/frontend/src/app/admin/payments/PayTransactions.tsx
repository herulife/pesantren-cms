"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getPayTransactions, getReceipt, PayTx, ReceiptData } from "@/lib/api";
import KwitansiModal from "@/components/KwitansiModal";
import { exportToExcel } from "@/lib/export";
import { FileSpreadsheet, Receipt, Search } from "lucide-react";

function fmtRp(n: number) { return "Rp " + (n || 0).toLocaleString("id-ID"); }
const today = () => new Date().toISOString().split("T")[0];
const firstOfMonth = () => today().slice(0, 8) + "01";

export default function PayTransactions() {
  const [rows, setRows] = useState<PayTx[]>([]);
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [search, setSearch] = useState("");
  const [kwitansi, setKwitansi] = useState<ReceiptData | null>(null);
  const load = useCallback(async () => {
    setRows(await getPayTransactions({ from, to, search: search || undefined }));
  }, [from, to, search]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4 items-end">
        <label className="text-sm">Dari<br /><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded-xl px-3 py-2 text-sm" /></label>
        <label className="text-sm">Sampai<br /><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded-xl px-3 py-2 text-sm" /></label>
        <label className="text-sm flex-1">Cari<br />
          <span className="relative block">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="NIS/nama/keterangan/kode..." className="border rounded-xl pl-9 pr-3 py-2 text-sm w-full" />
          </span>
        </label>
        <button onClick={() => exportToExcel("Lap Transaksi", ["Tanggal", "Jam", "No Induk", "Nama", "Keterangan", "Jml Bayar", "Jenis", "Petugas", "Kode"], rows.map((r) => { const [d, t] = r.date.split(" "); return [d, t || "", r.santri_nis || "-", r.santri_name || "-", r.description, r.amount, r.method, r.petugas || "-", r.code]; }), "lap_transaksi")} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1"><FileSpreadsheet size={16} /> Excel</button>
      </div>
      <p className="text-sm mb-3">Total: <b>{fmtRp(total)}</b> ({rows.length} transaksi)</p>
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead><tr className="bg-slate-50 text-left"><th className="p-3">Tanggal</th><th className="p-3">Jam</th><th className="p-3">No. Induk</th><th className="p-3">Nama</th><th className="p-3">Keterangan</th><th className="p-3">Jml Bayar</th><th className="p-3">Jenis</th><th className="p-3">Petugas</th><th className="p-3">Kode</th><th className="p-3">Kwitansi</th></tr></thead>
          <tbody>
            {rows.map((r) => {
              const [d, t] = (r.date || "").split(" ");
              return (
                <tr key={r.id} className="border-t"><td className="p-3">{d}</td><td className="p-3">{t || "-"}</td><td className="p-3 font-mono">{r.santri_nis}</td><td className="p-3 font-bold">{r.santri_name}</td><td className="p-3">{r.description}</td><td className="p-3 font-bold">{fmtRp(r.amount)}</td><td className="p-3">{r.method}</td><td className="p-3">{r.petugas || "-"}</td><td className="p-3 font-mono">{r.code}</td><td className="p-3"><button title="Kwitansi rekap bulan ini" onClick={async () => { const kw = await getReceipt(r.santri_id, (r.date || "").slice(0, 7)); if (kw) setKwitansi(kw); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-sky-600"><Receipt size={15} /></button></td></tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={10} className="p-6 text-center text-slate-400">Belum ada transaksi.</td></tr>}
          </tbody>
        </table>
        </div>
      </div>
      {kwitansi && <KwitansiModal data={kwitansi} onClose={() => setKwitansi(null)} />}
    </div>
  );
}
