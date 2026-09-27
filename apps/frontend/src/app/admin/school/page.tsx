"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getClasses, createClass, deleteClass, getAcademicYears, createAcademicYear, activateAcademicYear, deleteAcademicYear, getSantriList, setSantriClass, getUsers, SchoolClass, AcademicYear, Santri } from "@/lib/api";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { Plus, Trash2, CheckCircle } from "lucide-react";

export default function SchoolAdminPage() {
  const [tab, setTab] = useState<"classes" | "years" | "setkelas">("classes");
  const [santris, setSantris] = useState<Santri[]>([]);
  const [kelasMap, setKelasMap] = useState<Record<number, string>>({});
  const [santriSearch, setSantriSearch] = useState("");
  const [savingKelas, setSavingKelas] = useState(false);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [name, setName] = useState("");
  const [jenjang, setJenjang] = useState("");
  const [waliId, setWaliId] = useState("");
  const [waliUsers, setWaliUsers] = useState<{ id: number; name: string }[]>([]);
  const [yearName, setYearName] = useState("");
  const [delId, setDelId] = useState<number | null>(null);
  const [delKind, setDelKind] = useState<"class" | "year">("class");
  const { showToast } = useToast();

  const load = useCallback(async () => {
    const [c, y, u] = await Promise.all([getClasses(), getAcademicYears(), getUsers()]);
    setClasses(c); setYears(y);
    setWaliUsers((u || []).filter(x => x.role === 'wali_kelas').map(x => ({ id: x.id, name: x.name })));
  }, []);
  const loadSantris = useCallback(async () => {
    const r = await getSantriList({ limit: 200 });
    setSantris(r.items);
    const m: Record<number, string> = {};
    r.items.forEach((x) => { m[x.id] = x.class || ""; });
    setKelasMap(m);
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const addClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createClass({ name, jenjang, wali_user_id: waliId ? Number(waliId) : undefined });
    if (res.success) { showToast("success", "Kelas ditambahkan."); setName(""); setJenjang(""); setWaliId(""); load(); }
    else showToast("error", res.message || "Gagal menambah kelas.");
  };
  const addYear = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createAcademicYear({ name: yearName });
    if (res.success) { showToast("success", "Tahun ajaran ditambahkan."); setYearName(""); load(); }
    else showToast("error", res.message || "Gagal menambah tahun ajaran.");
  };
  const confirmDelete = async () => {
    if (!delId) return;
    const res = delKind === "class" ? await deleteClass(delId) : await deleteAcademicYear(delId);
    if (res.success) { showToast("success", "Data dihapus."); load(); }
    else showToast("error", res.message || "Gagal menghapus.");
    setDelId(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-black mb-4">Master Sekolah</h1>
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("classes")} className={`px-5 py-2 rounded-xl text-xs font-black uppercase ${tab === "classes" ? "bg-sky-600 text-white" : "bg-white border text-slate-500"}`}>Kelas</button>
        <button onClick={() => setTab("years")} className={`px-5 py-2 rounded-xl text-xs font-black uppercase ${tab === "years" ? "bg-sky-600 text-white" : "bg-white border text-slate-500"}`}>Tahun Ajaran</button>
        <button onClick={() => { setTab("setkelas"); loadSantris(); }} className={`px-5 py-2 rounded-xl text-xs font-black uppercase ${tab === "setkelas" ? "bg-sky-600 text-white" : "bg-white border text-slate-500"}`}>Set Kelas</button>
      </div>
      {tab === "classes" ? (
        <>
          <form onSubmit={addClass} className="flex gap-2 mb-4">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kelas (cth: VII-A)" className="border rounded-xl px-3 py-2 text-sm" />
            <input value={jenjang} onChange={(e) => setJenjang(e.target.value)} placeholder="Jenjang (SMP/SMK)" className="border rounded-xl px-3 py-2 text-sm" />
            <select value={waliId} onChange={(e) => setWaliId(e.target.value)} className="border rounded-xl px-3 py-2 text-sm" title="Wali kelas">
              <option value="">-- Wali kelas --</option>
              {waliUsers.map(u => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
            </select>
            <button className="bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1"><Plus size={16} /> Tambah</button>
          </form>
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-left"><th className="p-3">Nama</th><th className="p-3">Jenjang</th><th className="p-3">Wali Kelas</th><th className="p-3">Aksi</th></tr></thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c.id} className="border-t"><td className="p-3 font-bold">{c.name}</td><td className="p-3">{c.jenjang || "-"}</td><td className="p-3">{c.wali_name || waliUsers.find(w => w.id === c.wali_user_id)?.name || "-"}</td>
                    <td className="p-3"><button onClick={() => { setDelId(c.id); setDelKind("class"); }} className="text-rose-600"><Trash2 size={16} /></button></td></tr>
                ))}
                {classes.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-slate-400">Belum ada kelas. Tambahkan atau tunggu backfill otomatis dari data santri.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      ) : tab === "years" ? (
        <>
          <form onSubmit={addYear} className="flex gap-2 mb-4">
            <input value={yearName} onChange={(e) => setYearName(e.target.value)} placeholder="cth: 2025/2026" className="border rounded-xl px-3 py-2 text-sm" />
            <button className="bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1"><Plus size={16} /> Tambah</button>
          </form>
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-left"><th className="p-3">Tahun</th><th className="p-3">Status</th><th className="p-3">Aksi</th></tr></thead>
              <tbody>
                {years.map((y) => (
                  <tr key={y.id} className="border-t"><td className="p-3 font-bold">{y.name}</td>
                    <td className="p-3">{y.is_active ? <span className="text-emerald-600 font-bold">Aktif</span> : <button onClick={async () => { const r = await activateAcademicYear(y.id); if (r.success) { showToast("success", "Tahun diaktifkan."); load(); } }} className="text-sky-600 flex items-center gap-1"><CheckCircle size={16} /> Aktifkan</button>}</td>
                    <td className="p-3"><button onClick={() => { setDelId(y.id); setDelKind("year"); }} className="text-rose-600"><Trash2 size={16} /></button></td></tr>
                ))}
                {years.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-slate-400">Belum ada tahun ajaran.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            <input value={santriSearch} onChange={(e) => setSantriSearch(e.target.value)} placeholder="Cari NIS/nama..." className="border rounded-xl px-3 py-2 text-sm flex-1" />
            <button onClick={async () => {
              const items = santris.filter((x) => {
                const cur = kelasMap[x.id] ?? x.class ?? "";
                return cur !== (x.class || "");
              }).map((x) => ({ id: x.id, class: kelasMap[x.id] ?? "" }));
              if (items.length === 0) { showToast("error", "Tidak ada perubahan kelas."); return; }
              setSavingKelas(true);
              const r = await setSantriClass(items);
              setSavingKelas(false);
              if (r.ok) { showToast("success", r.message); loadSantris(); }
              else showToast("error", r.message);
            }} disabled={savingKelas} className="bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-60">
              {savingKelas ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-left"><th className="p-3">No Induk</th><th className="p-3">Nama</th><th className="p-3">Kelas Saat Ini</th></tr></thead>
              <tbody>
                {santris.filter((x) => (x.nis + x.name).toLowerCase().includes(santriSearch.toLowerCase())).map((x) => (
                  <tr key={x.id} className="border-t"><td className="p-3 font-mono">{x.nis}</td><td className="p-3 font-bold">{x.name}</td>
                    <td className="p-3">
                      <select value={kelasMap[x.id] ?? x.class ?? ""} onChange={(e) => setKelasMap({ ...kelasMap, [x.id]: e.target.value })} className="border rounded-xl px-3 py-2 text-sm">
                        <option value="">- Pilih -</option>
                        {classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </td></tr>
                ))}
                {santris.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-slate-400">Belum ada data santri.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
      <ConfirmDialog isOpen={delId !== null} onClose={() => setDelId(null)} onConfirm={confirmDelete} title="Hapus data?" message="Data yang dihapus tidak bisa dikembalikan." />
    </div>
  );
}
