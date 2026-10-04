"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getKasCategories, createKasCategory, updateKasCategory, getKasTransactions, createKasTransaction, deleteKasTransaction, getKasAudit, KasCategory, KasTransaction, KasAudit } from "@/lib/api";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp } from "lucide-react";

function fmtRp(n: number) { return "Rp " + (n || 0).toLocaleString("id-ID"); }
function todayStr() { return new Date().toISOString().split("T")[0]; }
function lastMonthRange() {
  const d = new Date();
  const from = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const to = new Date(d.getFullYear(), d.getMonth(), 0);
  return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] };
}

type Tab = "papan" | "tx" | "cat";

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
  const { showToast } = useToast();

  // Periodenya ikut ke audit DAN ke daftar transaksi supaya angka di kartu
  // dan tabel di bawahnya berasal dari rentang tanggal yang sama.
  const load = useCallback(async () => {
    const [t, c, a] = await Promise.all([
      getKasTransactions(kind === "all" ? { date_from: from, date_to: to } : { kind, date_from: from, date_to: to }),
      getKasCategories(),
      getKasAudit(from, to),
    ]);
    setTxs(t); setCats(c); setAudit(a);
  }, [kind, from, to]);
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

  const formCat = cats.find((c) => String(c.id) === form.category_id);
  const formCatAuto = form.kind === "masuk" && !!formCat?.is_auto_source;

  const drillRows = drill && audit ? (audit.rows[drill] ?? []) : [];
  const drillSrc = audit?.sources.find((s) => s.key === drill);
  const periodo = from || to ? `${from || "awal"} s/d ${to || "hari ini"}` : "seluruh riwayat";
  const teksAnomali = audit?.anomalies.length ?? 0;
  const saldoMinus = audit ? audit.balance < 0 : false;

  return (
    <div className="p-6">
      <h1 className="text-xl font-black mb-4">Kas &amp; Papan Pemantau</h1>

      {/* ---------- FILTER PERIODE (memengaruhi ringkasan + tabel) ---------- */}
      <div className="bg-white border rounded-xl p-4 mb-4 flex flex-wrap items-end gap-2">
        <label className="text-xs font-bold text-slate-500">Dari
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="block border rounded-xl px-3 py-2 text-sm mt-1" />
        </label>
        <label className="text-xs font-bold text-slate-500">Sampai
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="block border rounded-xl px-3 py-2 text-sm mt-1" />
        </label>
        <button onClick={() => { const d = new Date(); setFrom(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0]); setTo(todayStr()); }} className="border rounded-xl px-3 py-2 text-xs font-bold">Bulan ini</button>
        <button onClick={() => { const r = lastMonthRange(); setFrom(r.from); setTo(r.to); }} className="border rounded-xl px-3 py-2 text-xs font-bold">Bulan lalu</button>
        <button onClick={() => { setFrom(""); setTo(""); }} className="border rounded-xl px-3 py-2 text-xs font-bold">Semua</button>
        <p className="ml-auto text-xs text-slate-500">Menampilkan: <b>{periodo}</b></p>
      </div>

      {/* ---------- PERLU PERHATIAN ---------- */}
      {(teksAnomali > 0 || saldoMinus) && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-4">
          <p className="text-sm font-black text-amber-900 mb-2">Perlu Perhatian ({teksAnomali + (saldoMinus ? 1 : 0)})</p>
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

      {/* ---------- PAPAN KAS ---------- */}
      {audit && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-xs uppercase text-emerald-700 font-bold">Pemasukan ({audit.count_in} baris)</p>
            <p className="text-2xl font-black text-emerald-700">{fmtRp(audit.total_income)}</p>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
            <p className="text-xs uppercase text-rose-700 font-bold">Pengeluaran ({audit.count_out} baris)</p>
            <p className="text-2xl font-black text-rose-700">{fmtRp(audit.expense)}</p>
          </div>
          <div className={`border rounded-xl p-4 ${audit.balance < 0 ? "bg-rose-50 border-rose-300" : "bg-sky-50 border-sky-200"}`}>
            <p className="text-xs uppercase text-slate-500 font-bold">Saldo / Laba</p>
            <p className={`text-2xl font-black ${audit.balance < 0 ? "text-rose-700" : "text-sky-700"}`}>{fmtRp(audit.balance)}</p>
            <p className="text-[11px] text-slate-500 mt-1">{fmtRp(audit.total_income)} &minus; {fmtRp(audit.expense)}</p>
          </div>
        </div>
      )}

      {/* ---------- RINCIAN + DRILL-DOWN ---------- */}
      {audit && (
        <div className="bg-white border rounded-xl p-4 mb-6">
          <p className="text-xs uppercase text-slate-400 font-bold mb-2">Dari mana pemasukan ini berasal &mdash; klik untuk melihat rinciannya</p>
          <table className="w-full text-sm">
            <tbody>
              {audit.sources.map((s) => (
                <tr key={s.key} className="border-t">
                  <td className="p-2">
                    <button onClick={() => setDrill(drill === s.key ? null : s.key)} className="flex items-center gap-1 font-bold text-sky-700">
                      {drill === s.key ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {s.label}
                    </button>
                  </td>
                  <td className="p-2 text-xs text-slate-400">{s.origin === "otomatis" ? `otomatis dari ${s.table}` : "dicatat manual"}</td>
                  <td className="p-2 text-right text-xs text-slate-500">{s.count} baris</td>
                  <td className="p-2 text-right font-black text-emerald-700">{fmtRp(s.amount)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-300">
                <td className="p-2 font-black">Total pemasukan</td>
                <td /><td />
                <td className="p-2 text-right font-black text-emerald-700">{fmtRp(audit.total_income)}</td>
              </tr>
            </tbody>
          </table>

          {drill && (
            <div className="mt-4 border-t pt-3">
              <p className="text-xs uppercase text-slate-400 font-bold mb-2">
                Rincian {drillSrc?.label} ({fmtRp(drillSrc?.amount ?? 0)} dari {drillSrc?.count ?? 0} baris)
              </p>
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 text-left"><th className="p-2">Tanggal</th><th className="p-2">Nama</th><th className="p-2">Keterangan</th><th className="p-2 text-right">Nominal</th></tr></thead>
                <tbody>
                  {drillRows.map((r) => (
                    <tr key={r.id} className="border-t"><td className="p-2">{r.date}</td><td className="p-2 font-bold">{r.label}</td>
                      <td className="p-2 text-slate-500">{r.detail || "-"}</td><td className="p-2 text-right">{fmtRp(r.amount)}</td></tr>
                  ))}
                  {drillRows.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-400">Tidak ada baris di periode ini.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {audit.excluded_count > 0 && (
            <div className="mt-4 border-t pt-3">
              <p className="text-xs uppercase text-slate-400 font-bold mb-2">
                Tidak dijumlahkan ({audit.excluded_count} baris, {fmtRp(audit.excluded_amount)}) &mdash; sudah termasuk hitungan sumber di atas
              </p>
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 text-left"><th className="p-2">Tanggal</th><th className="p-2">Kategori</th><th className="p-2">Keterangan</th><th className="p-2 text-right">Nominal</th></tr></thead>
                <tbody>
                  {audit.excluded_rows.map((r) => (
                    <tr key={r.id} className="border-t text-slate-500"><td className="p-2">{r.date}</td><td className="p-2">{r.label}</td>
                      <td className="p-2">{r.detail || "-"}</td><td className="p-2 text-right line-through">{fmtRp(r.amount)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------- TAB ---------- */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("papan")} className={`px-5 py-2 rounded-xl text-xs font-black uppercase ${tab === "papan" ? "bg-sky-600 text-white" : "bg-white border text-slate-500"}`}>Papan Kas</button>
        <button onClick={() => setTab("tx")} className={`px-5 py-2 rounded-xl text-xs font-black uppercase ${tab === "tx" ? "bg-sky-600 text-white" : "bg-white border text-slate-500"}`}>Transaksi</button>
        <button onClick={() => setTab("cat")} className={`px-5 py-2 rounded-xl text-xs font-black uppercase ${tab === "cat" ? "bg-sky-600 text-white" : "bg-white border text-slate-500"}`}>Kategori</button>
        {tab !== "papan" && (
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="ml-auto border rounded-xl px-3 py-2 text-sm">
            <option value="all">Semua</option><option value="masuk">Masuk</option><option value="keluar">Keluar</option>
          </select>
        )}
      </div>

      {tab === "tx" && (
        <>
          <form onSubmit={submit} className="bg-white border rounded-xl p-4 mb-4 grid grid-cols-2 md:grid-cols-6 gap-2">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="border rounded-xl px-3 py-2 text-sm" />
            <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value, category_id: "" })} className="border rounded-xl px-3 py-2 text-sm"><option value="masuk">Masuk</option><option value="keluar">Keluar</option></select>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="border rounded-xl px-3 py-2 text-sm">
              <option value="">- Kategori -</option>{cats.filter((c) => c.kind === form.kind).map((c) => <option key={c.id} value={c.id}>{c.name}{c.is_auto_source ? " (otomatis)" : ""}</option>)}
            </select>
            <input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Nominal" className="border rounded-xl px-3 py-2 text-sm" />
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Keterangan" className="border rounded-xl px-3 py-2 text-sm" />
            <button className="bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1"><Plus size={16} /> Catat</button>
          </form>

          {formCatAuto && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 mb-4 text-sm text-amber-900">
              <b>Perhatian:</b> "{formCat?.name}" sudah dihitung otomatis dari SPP/Iuran/Donasi. Kalau transaksi ini uang yang <b>sama</b>, tidak akan dijumlahkan lagi (aman). Kalau uang <b>lain</b>, pilih kategori biasa supaya tidak hilang dari hitungan.
            </div>
          )}

          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-left"><th className="p-3">Kode</th><th className="p-3">Tanggal</th><th className="p-3">Jenis</th><th className="p-3">Kategori</th><th className="p-3">Nominal</th><th className="p-3">Ket</th><th className="p-3">Oleh</th><th className="p-3">Aksi</th></tr></thead>
              <tbody>
                {txs.map((t) => {
                  const c = cats.find((x) => x.id === t.category_id);
                  const auto = t.kind === "masuk" && !!c?.is_auto_source;
                  return (
                    <tr key={t.id} className={`border-t ${auto ? "bg-slate-50 text-slate-400" : ""}`}>
                      <td className="p-3 font-mono">{t.code || "-"}</td><td className="p-3">{t.date}</td>
                      <td className="p-3"><span className={t.kind === "masuk" ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>{t.kind}</span></td>
                      <td className="p-3">{t.category || "-"}{auto && <span className="block text-[10px] text-slate-400">tidak dijumlahkan</span>}</td>
                      <td className="p-3 font-bold">{fmtRp(t.amount)}</td><td className="p-3">{t.notes || "-"}</td><td className="p-3">{t.creator || "-"}</td>
                      <td className="p-3"><button onClick={() => setDelId(t.id)} className="text-rose-600"><Trash2 size={16} /></button></td>
                    </tr>
                  );
                })}
                {txs.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-slate-400">Belum ada transaksi pada periode ini.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "cat" && (
        <>
          <form onSubmit={addCat} className="flex gap-2 mb-4">
            <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Nama kategori" className="border rounded-xl px-3 py-2 text-sm" />
            <select value={catKind} onChange={(e) => setCatKind(e.target.value)} className="border rounded-xl px-3 py-2 text-sm"><option value="masuk">Masuk</option><option value="keluar">Keluar</option></select>
            <button className="bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1"><Plus size={16} /> Tambah</button>
          </form>
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-left"><th className="p-3">Kode</th><th className="p-3">Nama</th><th className="p-3">Jenis</th><th className="p-3">Dibuat Oleh</th><th className="p-3">Aksi</th></tr></thead>
              <tbody>{cats.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3 font-mono">{c.code || "-"}</td>
                  <td className="p-3 font-bold">
                    {editingCat?.id === c.id
                      ? <input value={editingCat.name} onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })} className="border rounded-xl px-2 py-1 text-sm" />
                      : <>{c.name}{c.is_auto_source ? <span className="block text-[10px] font-normal text-amber-700">otomatis — tidak dijumlahkan dari transaksi</span> : null}</>}
                  </td>
                  <td className="p-3">{c.kind}</td><td className="p-3">{c.creator || "-"}</td>
                  <td className="p-3 flex gap-2">
                    {editingCat?.id === c.id ? (
                      <button onClick={async () => { const r = await updateKasCategory(c.id, { name: editingCat.name, kind: c.kind }); if (r.success) { showToast("success", "Diubah."); setEditingCat(null); load(); } else showToast("error", r.message || "Gagal."); }} className="text-emerald-600 text-sm font-bold">Simpan</button>
                    ) : (
                      <button onClick={() => setEditingCat({ id: c.id, name: c.name })} className="text-sky-600"><Pencil size={16} /></button>
                    )}
                  </td>
                </tr>))}</tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDialog isOpen={delId !== null} onClose={() => setDelId(null)} onConfirm={async () => { if (delId) { const r = await deleteKasTransaction(delId); if (r.success) { showToast("success", "Dihapus."); load(); } } setDelId(null); }} title="Hapus transaksi?" message="Data yang dihapus tidak bisa dikembalikan." />
    </div>
  );
}