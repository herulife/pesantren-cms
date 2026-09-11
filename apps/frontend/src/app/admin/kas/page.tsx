"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getKasCategories, createKasCategory, getKasTransactions, createKasTransaction, deleteKasTransaction, getKasSummary, KasCategory, KasTransaction, KasSummary } from "@/lib/api";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { Plus, Trash2 } from "lucide-react";

function fmtRp(n: number) { return "Rp " + (n || 0).toLocaleString("id-ID"); }

export default function KasAdminPage() {
  const [tab, setTab] = useState<"tx" | "cat">("tx");
  const [txs, setTxs] = useState<KasTransaction[]>([]);
  const [cats, setCats] = useState<KasCategory[]>([]);
  const [summary, setSummary] = useState<KasSummary | null>(null);
  const [kind, setKind] = useState("all");
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], kind: "masuk", category_id: "", amount: "", method: "manual", notes: "" });
  const [catName, setCatName] = useState("");
  const [catKind, setCatKind] = useState("masuk");
  const [delId, setDelId] = useState<number | null>(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    const [t, c, s] = await Promise.all([getKasTransactions(kind === "all" ? {} : { kind }), getKasCategories(), getKasSummary()]);
    setTxs(t); setCats(c); setSummary(s);
  }, [kind]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createKasTransaction({ date: form.date, kind: form.kind, category_id: form.category_id ? Number(form.category_id) : 0, amount: Number(form.amount), method: form.method, notes: form.notes });
    if (res.success) { showToast("success", "Transaksi dicatat."); setForm({ ...form, amount: "", notes: "" }); load(); }
    else showToast("error", res.message || "Gagal menyimpan.");
  };
  const addCat = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createKasCategory({ name: catName, kind: catKind });
    if (res.success) { showToast("success", "Kategori ditambahkan."); setCatName(""); load(); }
    else showToast("error", res.message || "Gagal menambah kategori.");
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-black mb-4">Kas &amp; Laba Rugi</h1>
      {summary && (
        <>
        <div className="bg-white border rounded-xl p-4 mb-4">
          <p className="text-xs uppercase text-slate-400 font-bold mb-2">Rincian Pemasukan</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>SPP: <b className="text-emerald-600">{summary ? fmtRp(summary.spp_income) : "-"}</b></div>
            <div>Iuran: <b className="text-emerald-600">{summary ? fmtRp(summary.iuran_income) : "-"}</b></div>
            <div>Donasi: <b className="text-emerald-600">{summary ? fmtRp(summary.donasi_income) : "-"}</b></div>
            <div>Kas lain: <b className="text-emerald-600">{summary ? fmtRp(summary.kas_income) : "-"}</b></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border rounded-xl p-4"><p className="text-xs uppercase text-slate-400 font-bold">Pemasukan ({summary.count_in})</p><p className="text-lg font-black text-emerald-600">{fmtRp(summary.income)}</p></div>
          <div className="bg-white border rounded-xl p-4"><p className="text-xs uppercase text-slate-400 font-bold">Pengeluaran ({summary.count_out})</p><p className="text-lg font-black text-rose-600">{fmtRp(summary.expense)}</p></div>
          <div className="bg-white border rounded-xl p-4"><p className="text-xs uppercase text-slate-400 font-bold">Saldo / Laba</p><p className={`text-lg font-black ${summary.balance >= 0 ? "text-sky-600" : "text-rose-600"}`}>{fmtRp(summary.balance)}</p></div>
        </div>
        </>
      )}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("tx")} className={`px-5 py-2 rounded-xl text-xs font-black uppercase ${tab === "tx" ? "bg-sky-600 text-white" : "bg-white border text-slate-500"}`}>Transaksi</button>
        <button onClick={() => setTab("cat")} className={`px-5 py-2 rounded-xl text-xs font-black uppercase ${tab === "cat" ? "bg-sky-600 text-white" : "bg-white border text-slate-500"}`}>Kategori</button>
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="ml-auto border rounded-xl px-3 py-2 text-sm">
          <option value="all">Semua</option><option value="masuk">Masuk</option><option value="keluar">Keluar</option>
        </select>
      </div>
      {tab === "tx" ? (
        <>
          <form onSubmit={submit} className="bg-white border rounded-xl p-4 mb-4 grid grid-cols-2 md:grid-cols-6 gap-2">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="border rounded-xl px-3 py-2 text-sm" />
            <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className="border rounded-xl px-3 py-2 text-sm"><option value="masuk">Masuk</option><option value="keluar">Keluar</option></select>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="border rounded-xl px-3 py-2 text-sm">
              <option value="">- Kategori -</option>{cats.filter((c) => c.kind === form.kind).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Nominal" className="border rounded-xl px-3 py-2 text-sm" />
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Keterangan" className="border rounded-xl px-3 py-2 text-sm" />
            <button className="bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1"><Plus size={16} /> Catat</button>
          </form>
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-left"><th className="p-3">Kode</th><th className="p-3">Tanggal</th><th className="p-3">Jenis</th><th className="p-3">Kategori</th><th className="p-3">Nominal</th><th className="p-3">Ket</th><th className="p-3">Oleh</th><th className="p-3">Aksi</th></tr></thead>
              <tbody>
                {txs.map((t) => (
                  <tr key={t.id} className="border-t"><td className="p-3 font-mono">{t.code || "-"}</td><td className="p-3">{t.date}</td>
                    <td className="p-3"><span className={t.kind === "masuk" ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>{t.kind}</span></td>
                    <td className="p-3">{t.category || "-"}</td><td className="p-3 font-bold">{fmtRp(t.amount)}</td><td className="p-3">{t.notes || "-"}</td><td className="p-3">{t.creator || "-"}</td>
                    <td className="p-3"><button onClick={() => setDelId(t.id)} className="text-rose-600"><Trash2 size={16} /></button></td></tr>
                ))}
                {txs.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-slate-400">Belum ada transaksi.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <form onSubmit={addCat} className="flex gap-2 mb-4">
            <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Nama kategori" className="border rounded-xl px-3 py-2 text-sm" />
            <select value={catKind} onChange={(e) => setCatKind(e.target.value)} className="border rounded-xl px-3 py-2 text-sm"><option value="masuk">Masuk</option><option value="keluar">Keluar</option></select>
            <button className="bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1"><Plus size={16} /> Tambah</button>
          </form>
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-left"><th className="p-3">Nama</th><th className="p-3">Jenis</th></tr></thead>
              <tbody>{cats.map((c) => <tr key={c.id} className="border-t"><td className="p-3 font-bold">{c.name}</td><td className="p-3">{c.kind}</td></tr>)}</tbody>
            </table>
          </div>
        </>
      )}
      <ConfirmDialog open={delId !== null} onClose={() => setDelId(null)} onConfirm={async () => { if (delId) { const r = await deleteKasTransaction(delId); if (r.success) { showToast("success", "Dihapus."); load(); } } setDelId(null); }} title="Hapus transaksi?" message="Data yang dihapus tidak bisa dikembalikan." />
    </div>
  );
}
