"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getSppSantri, getUnpaidBills, paySppBill, payIuranBill, getPayTransactions, getPublicSettingsMap, SppSantri, UnpaidBill, PayTx, SettingsMap } from "@/lib/api";
import KwitansiModal, { KwitansiTx } from "@/components/KwitansiModal";
import { Receipt } from "lucide-react";
import { useToast } from "@/components/Toast";
import { Search } from "lucide-react";

function fmtRp(n: number) { return "Rp " + (n || 0).toLocaleString("id-ID"); }

export default function Kasir() {
  const [santris, setSantris] = useState<SppSantri[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SppSantri | null>(null);
  const [bills, setBills] = useState<UnpaidBill[]>([]);
  const [paying, setPaying] = useState<UnpaidBill | null>(null);
  const [kwitansi, setKwitansi] = useState<KwitansiTx | null>(null);
  const [kwLoading, setKwLoading] = useState(false);
  const [settings, setSettings] = useState<SettingsMap>({});
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Tunai");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const loadSantri = useCallback(async () => {
    const [ss, st] = await Promise.all([getSppSantri(), getPublicSettingsMap()]);
    setSantris(ss);
    setSettings(st);
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadSantri(); }, [loadSantri]);

  const pick = async (s: SppSantri) => {
    setSelected(s);
    setPaying(null);
    setBills(await getUnpaidBills(s.id));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paying) return;
    const nominal = parseInt(amount, 10);
    if (!nominal || nominal <= 0 || nominal > paying.remain) {
      showToast("error", `Nominal 1 s/d ${fmtRp(paying.remain)}.`);
      return;
    }
    setSaving(true);
    const res = paying.bill_type === "SPP"
      ? await paySppBill(paying.bill_id, { amount: nominal, method })
      : await payIuranBill(paying.bill_id, { amount: nominal, method });
    setSaving(false);
    if (res.success) {
      showToast("success", "Pembayaran tersimpan.");
      setPaying(null); setAmount("");
      if (selected) {
        setBills(await getUnpaidBills(selected.id));
        setKwLoading(true);
        const txs = await getPayTransactions({ search: selected.nis });
        setKwLoading(false);
        const latest = txs.find((t) => t.santri_id === selected.id) || txs[0];
        if (latest) setKwitansi(toKwitansiTx(latest));
      }
    } else {
      showToast("error", res.message || "Gagal menyimpan.");
    }
  };

  const toKwitansiTx = (t: PayTx): KwitansiTx => ({
    code: t.code,
    date: t.date,
    santri_nis: t.santri_nis,
    santri_name: t.santri_name,
    description: t.description,
    amount: t.amount,
    method: t.method,
  });

  const list = santris.filter((s) => (s.nis + s.name).toLowerCase().includes(search.toLowerCase())).slice(0, 50);

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="bg-white border rounded-xl p-4">
        <h3 className="font-black mb-3">Pilih Santri</h3>
        <span className="relative block mb-3">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari NIS/nama..." className="border rounded-xl pl-9 pr-3 py-2 text-sm w-full" />
        </span>
        <div className="max-h-96 overflow-y-auto divide-y">
          {list.map((s) => (
            <button key={s.id} onClick={() => pick(s)} className={`w-full text-left p-3 hover:bg-slate-50 ${selected?.id === s.id ? "bg-sky-50" : ""}`}>
              <p className="font-bold text-sm">{s.name}</p>
              <p className="text-xs text-slate-500 font-mono">{s.nis} • {s.class}</p>
            </button>
          ))}
          {list.length === 0 && <p className="p-4 text-sm text-slate-400 text-center">Tidak ada santri.</p>}
        </div>
      </div>
      <div className="bg-white border rounded-xl p-4">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-black">Rincian Tagihan {selected ? `- ${selected.name}` : ""}</h3>
          {selected && (
            <button
              onClick={async () => {
                setKwLoading(true);
                const txs = await getPayTransactions({ search: selected.nis });
                setKwLoading(false);
                const latest = txs.find((t) => t.santri_id === selected.id) || txs[0];
                if (latest) setKwitansi(toKwitansiTx(latest));
                else showToast("error", "Belum ada pembayaran.");
              }}
              disabled={kwLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Receipt size={14} /> {kwLoading ? "Memuat…" : "Kwitansi Bulan Ini"}
            </button>
          )}
        </div>
        {!selected && <p className="text-sm text-slate-400">Silakan pilih siswa terlebih dahulu.</p>}
        {selected && bills.length === 0 && <p className="text-sm text-emerald-600 font-bold">Tidak ada tagihan belum lunas. Lunas semua.</p>}
        {bills.map((b) => (
          <div key={`${b.bill_type}-${b.bill_id}`} className="border rounded-xl p-3 mb-2 flex items-center gap-3">
            <div className="flex-1">
              <p className="font-bold text-sm">{b.bill_type === "SPP" ? `SPP ${b.period}` : b.name} <span className="text-xs font-normal text-slate-500">({b.period})</span></p>
              <p className="text-xs text-slate-500">Sisa: <b className="text-rose-600">{fmtRp(b.remain)}</b> dari {fmtRp(b.amount)}</p>
            </div>
            <button onClick={() => { setPaying(b); setAmount(String(b.remain)); }} className="bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-bold">Bayar</button>
          </div>
        ))}
        {paying && (
          <form onSubmit={submit} className="border-t mt-3 pt-3 grid grid-cols-2 gap-2">
            <input type="number" min="1" max={paying.remain} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Nominal" className="border rounded-xl px-3 py-2 text-sm" />
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="border rounded-xl px-3 py-2 text-sm">
              <option>Tunai</option><option>Transfer</option>
            </select>
            <button disabled={saving} className="col-span-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-60">
              {saving ? "Menyimpan..." : `Simpan Pembayaran ${fmtRp(parseInt(amount || "0", 10))}`}
            </button>
          </form>
        )}
      </div>
      {kwitansi && (
        <KwitansiModal
          data={kwitansi}
          schoolName={settings.school_name}
          schoolAddress={settings.school_address}
          schoolPhone={settings.school_phone}
          onClose={() => setKwitansi(null)}
        />
      )}
    </div>
  );
}
