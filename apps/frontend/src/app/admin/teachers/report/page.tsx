"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getEmployees, createEmployee, deleteEmployee, getTeacherAttendance, createTeacherAttendance, deleteTeacherAttendance, getPerGuru, getRekapAbsensi, getRawLogs, importRawLogs, syncAbsen, Employee, TeacherAttendance, PerGuruSummary, RekapAbsensi, RawLog } from "@/lib/api";
import { exportToExcel } from "@/lib/export";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { Plus, Trash2, FileSpreadsheet } from "lucide-react";

function fmtDur(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h} Jam ${m} Menit`;
}
function fmtRow(min: number) {
  const h = Math.floor(min / 60);
  const m = String(min % 60).padStart(2, "0");
  return `${h}:${m}`;
}
const today = () => new Date().toISOString().split("T")[0];
const firstOfMonth = () => today().slice(0, 8) + "01";

export default function TeacherAttendancePage() {
  const [tab, setTab] = useState<"absen" | "perguru" | "rekap" | "pegawai" | "rawlog">("perguru");
  const [rawLogs, setRawLogs] = useState<RawLog[]>([]);
  const [rawText, setRawText] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [emps, setEmps] = useState<Employee[]>([]);
  const [code, setCode] = useState("");
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const loadRawLogs = useCallback(async () => {
    setRawLogs(await getRawLogs(from, to));
  }, [from, to]);
  const [summary, setSummary] = useState<PerGuruSummary | null>(null);
  const [rows, setRows] = useState<TeacherAttendance[]>([]);
  const [rekap, setRekap] = useState<RekapAbsensi[]>([]);
  const [form, setForm] = useState({ employee_code: "", date: today(), status: "Masuk", notes: "", time_in: "", time_out: "" });
  const [peg, setPeg] = useState({ code: "", name: "", gender: "Laki-laki", phone: "", email: "", kind: "Guru" });
  const [delId, setDelId] = useState<number | null>(null);
  const [delCode, setDelCode] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadEmps = useCallback(async () => {
    setEmps(await getEmployees());
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadEmps(); }, [loadEmps]);

  const show = async () => {
    if (!code) { showToast("error", "Pilih guru terlebih dahulu."); return; }
    const data = await getPerGuru(code, from, to);
    if (data) { setSummary(data.summary); setRows(data.rows); }
  };
  const loadRekap = async () => {
    setRekap(await getRekapAbsensi(from, to));
  };
  const submitAbsen = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createTeacherAttendance(form);
    if (res.success) { showToast("success", "Absensi dicatat."); setForm({ ...form, notes: "", time_in: "", time_out: "" }); }
    else showToast("error", res.message || "Gagal menyimpan.");
  };
  const submitPegawai = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createEmployee(peg);
    if (res.success) { showToast("success", "Pegawai ditambahkan."); setPeg({ code: "", name: "", gender: "Laki-laki", phone: "", email: "", kind: "Guru" }); loadEmps(); }
    else showToast("error", res.message || "Gagal menambah pegawai.");
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-black mb-1">Absensi Guru &amp; Lap. Per Guru</h1>
      <p className="text-sm text-slate-500 mb-4">Rekap absensi per guru: Masuk, Sakit, Ijin, Tanpa Keterangan + total jam.</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {(["perguru", "rekap", "absen", "pegawai", "rawlog"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-xl text-xs font-black uppercase ${tab === t ? "bg-emerald-600 text-white" : "bg-white border text-slate-500"}`}>
            {t === "perguru" ? "Lap. Per Guru" : t === "rekap" ? "Rekap Absen" : t === "absen" ? "Data Absen" : t === "pegawai" ? "Pegawai" : "Raw Log"}
          </button>
        ))}
      </div>

      {tab === "perguru" && (
        <>
          <div className="flex flex-wrap gap-2 mb-4 items-end">
            <label className="text-sm">Pilih Guru<br /><select value={code} onChange={(e) => setCode(e.target.value)} className="border rounded-xl px-3 py-2 text-sm min-w-52">
              <option value="">-- Pilih Guru --</option>{emps.map((e) => <option key={e.code} value={e.code}>{e.code} - {e.name}</option>)}
            </select></label>
            <label className="text-sm">Dari Tanggal<br /><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded-xl px-3 py-2 text-sm" /></label>
            <label className="text-sm">Sampai Tanggal<br /><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded-xl px-3 py-2 text-sm" /></label>
            <button onClick={show} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold">Tampilkan</button>
            <button onClick={() => exportToExcel("Lap Per Guru", ["Tanggal", "Status", "Keterangan", "Jam Masuk", "Jam Pulang", "Jumlah Jam"], rows.map((r) => [r.date, r.status, r.notes, r.time_in, r.time_out, fmtRow(r.minutes)]), "lap_per_guru")} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1"><FileSpreadsheet size={16} /> Excel</button>
          </div>
          {summary && (
            <p className="text-sm mb-3">Tanpa Ket.: <b>{summary.without_info}</b> Masuk: <b>{summary.present}</b> Sakit: <b>{summary.sick}</b> Ijin: <b>{summary.permit}</b> TOTAL JAM: <b>{fmtDur(summary.total_minutes)}</b> | Jumlah Data: <b>{summary.count}</b></p>
          )}
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-left"><th className="p-3">Tanggal</th><th className="p-3">Status</th><th className="p-3">Keterangan</th><th className="p-3">Jam Masuk</th><th className="p-3">Jam Pulang</th><th className="p-3">Jumlah Jam</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t"><td className="p-3">{r.date}</td><td className="p-3 font-bold">{r.status}</td><td className="p-3">{r.notes || "-"}</td><td className="p-3">{r.time_in || "-"}</td><td className="p-3">{r.time_out || "-"}</td><td className="p-3">{fmtRow(r.minutes)}</td></tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-400">Silakan pilih guru dan range tanggal terlebih dahulu.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "rekap" && (
        <>
          <div className="flex flex-wrap gap-2 mb-4 items-end">
            <label className="text-sm">Dari<br /><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded-xl px-3 py-2 text-sm" /></label>
            <label className="text-sm">Sampai<br /><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded-xl px-3 py-2 text-sm" /></label>
            <button onClick={loadRekap} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold">Tampilkan</button>
            <button onClick={() => exportToExcel("Rekap Absen", ["Kode", "Nama", "Jml Hari", "Masuk", "Sakit", "Ijin", "Alfa", "Kehadiran"], rekap.map((r) => [r.code, r.name, r.days, r.present, r.sick, r.permit, r.alpha, r.percent.toFixed(1) + "%"]), "rekap_absen")} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1"><FileSpreadsheet size={16} /> Excel</button>
          </div>
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-left"><th className="p-3">Kode</th><th className="p-3">Nama</th><th className="p-3">Jml Hari</th><th className="p-3">Masuk</th><th className="p-3">Sakit</th><th className="p-3">Ijin</th><th className="p-3">Alfa</th><th className="p-3">Kehadiran</th></tr></thead>
              <tbody>
                {rekap.map((r) => (
                  <tr key={r.code} className="border-t"><td className="p-3">{r.code}</td><td className="p-3 font-bold">{r.name}</td><td className="p-3">{r.days}</td><td className="p-3">{r.present}</td><td className="p-3">{r.sick}</td><td className="p-3">{r.permit}</td><td className="p-3">{r.alpha}</td><td className="p-3 font-bold">{r.percent.toFixed(1)}%</td></tr>
                ))}
                {rekap.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-slate-400">Pilih range tanggal lalu Tampilkan.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "absen" && (
        <>
          <form onSubmit={submitAbsen} className="bg-white border rounded-xl p-4 mb-4 grid grid-cols-2 md:grid-cols-7 gap-2">
            <select value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} className="border rounded-xl px-3 py-2 text-sm">
              <option value="">- Guru -</option>{emps.map((e) => <option key={e.code} value={e.code}>{e.name}</option>)}
            </select>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="border rounded-xl px-3 py-2 text-sm" />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="border rounded-xl px-3 py-2 text-sm">
              <option>Masuk</option><option>Sakit</option><option>Ijin</option><option>Tanpa Keterangan</option>
            </select>
            <input value={form.time_in} onChange={(e) => setForm({ ...form, time_in: e.target.value })} placeholder="Masuk HH:MM" className="border rounded-xl px-3 py-2 text-sm" />
            <input value={form.time_out} onChange={(e) => setForm({ ...form, time_out: e.target.value })} placeholder="Pulang HH:MM" className="border rounded-xl px-3 py-2 text-sm" />
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Keterangan" className="border rounded-xl px-3 py-2 text-sm" />
            <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1"><Plus size={16} /> Catat</button>
          </form>
          <AbsenTable code={code} from={from} to={to} onDelete={(id) => setDelId(id)} />
        </>
      )}

      {tab === "pegawai" && (
        <>
          <form onSubmit={submitPegawai} className="bg-white border rounded-xl p-4 mb-4 grid grid-cols-2 md:grid-cols-7 gap-2">
            <input value={peg.code} onChange={(e) => setPeg({ ...peg, code: e.target.value })} placeholder="ID/Kode" className="border rounded-xl px-3 py-2 text-sm" />
            <input value={peg.name} onChange={(e) => setPeg({ ...peg, name: e.target.value })} placeholder="Nama" className="border rounded-xl px-3 py-2 text-sm" />
            <select value={peg.gender} onChange={(e) => setPeg({ ...peg, gender: e.target.value })} className="border rounded-xl px-3 py-2 text-sm"><option>Laki-laki</option><option>Perempuan</option></select>
            <input value={peg.phone} onChange={(e) => setPeg({ ...peg, phone: e.target.value })} placeholder="Telp" className="border rounded-xl px-3 py-2 text-sm" />
            <input value={peg.email} onChange={(e) => setPeg({ ...peg, email: e.target.value })} placeholder="Email" className="border rounded-xl px-3 py-2 text-sm" />
            <select value={peg.kind} onChange={(e) => setPeg({ ...peg, kind: e.target.value })} className="border rounded-xl px-3 py-2 text-sm"><option>Guru</option><option>Staf</option></select>
            <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1"><Plus size={16} /> Tambah</button>
          </form>
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-left"><th className="p-3">ID</th><th className="p-3">Nama</th><th className="p-3">JK</th><th className="p-3">Telp</th><th className="p-3">Jenis</th><th className="p-3">Aksi</th></tr></thead>
              <tbody>
                {emps.map((e) => (
                  <tr key={e.code} className="border-t"><td className="p-3">{e.code}</td><td className="p-3 font-bold">{e.name}</td><td className="p-3">{e.gender}</td><td className="p-3">{e.phone || "-"}</td><td className="p-3">{e.kind}</td>
                    <td className="p-3"><button onClick={() => setDelCode(e.code)} className="text-rose-600"><Trash2 size={16} /></button></td></tr>
                ))}
                {emps.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-400">Belum ada pegawai.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "rawlog" && (
        <>
          <p className="text-sm text-slate-500 mb-3">Data diambil langsung dari file log fingerprint yang sudah di-import. Format paste per baris: <code>ID_FP,Tanggal(YYYY-MM-DD),Jam,Verifikasi,Mesin</code></p>
          <div className="flex flex-wrap gap-2 mb-4 items-end">
            <button onClick={loadRawLogs} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold">Tampilkan</button>
            <button onClick={async () => {
              setSyncing(true);
              const r = await syncAbsen(from, to);
              setSyncing(false);
              if (r.success) { showToast("success", "Sync selesai."); loadRawLogs(); }
              else showToast("error", r.message || "Gagal sync.");
            }} disabled={syncing} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-60">
              {syncing ? "Sync..." : "Sync Data Absen"}
            </button>
          </div>
          <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} rows={4} placeholder="19980430004,2026-09-11,07:00:01,1,1" className="border rounded-xl px-3 py-2 text-sm w-full font-mono mb-2" />
          <button onClick={async () => {
            const rows = rawText.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
              const p = l.split(/[;,]/).map((x) => x.trim());
              return { fp_id: p[0] || "", date: p[1] || "", time: p[2] || "", verify: p[3] || "", machine: p[4] || "" };
            }).filter((r) => r.fp_id && r.date);
            if (rows.length === 0) { showToast("error", "Tidak ada baris valid."); return; }
            const r = await importRawLogs(rows);
            if (r.success) { showToast("success", "Import selesai."); setRawText(""); loadRawLogs(); }
            else showToast("error", r.message || "Gagal import.");
          }} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold mb-4">Import Log</button>
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-left"><th className="p-3">No</th><th className="p-3">ID FP</th><th className="p-3">Tgl Transaksi</th><th className="p-3">Jam</th><th className="p-3">Verifikasi</th><th className="p-3">Mesin</th></tr></thead>
              <tbody>
                {rawLogs.map((l, i) => (
                  <tr key={l.id} className="border-t"><td className="p-3">{i + 1}</td><td className="p-3 font-mono">{l.fp_id}</td><td className="p-3">{l.date}</td><td className="p-3">{l.time || "-"}</td><td className="p-3">{l.verify || "-"}</td><td className="p-3">{l.machine || "-"}</td></tr>
                ))}
                {rawLogs.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-400">Belum ada data. Import dulu lalu Sync.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
      <ConfirmDialog isOpen={delId !== null} onClose={() => setDelId(null)} onConfirm={async () => { if (delId) { const r = await deleteTeacherAttendance(delId); if (r.success) showToast("success", "Dihapus."); } setDelId(null); }} title="Hapus absensi?" message="Data yang dihapus tidak bisa dikembalikan." />
      <ConfirmDialog isOpen={delCode !== null} onClose={() => setDelCode(null)} onConfirm={async () => { if (delCode) { const r = await deleteEmployee(delCode); if (r.success) { showToast("success", "Dihapus."); loadEmps(); } } setDelCode(null); }} title="Hapus pegawai?" message="Data yang dihapus tidak bisa dikembalikan." />
    </div>
  );
}

function AbsenTable({ code, from, to, onDelete }: { code: string; from: string; to: string; onDelete: (id: number) => void }) {
  const [list, setList] = useState<TeacherAttendance[]>([]);
  const load = useCallback(async () => {
    setList(await getTeacherAttendance({ code: code || undefined, from, to }));
  }, [code, from, to]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead><tr className="bg-slate-50 text-left"><th className="p-3">Tanggal</th><th className="p-3">Guru</th><th className="p-3">Status</th><th className="p-3">Masuk</th><th className="p-3">Pulang</th><th className="p-3">Aksi</th></tr></thead>
        <tbody>
          {list.map((a) => (
            <tr key={a.id} className="border-t"><td className="p-3">{a.date}</td><td className="p-3">{a.employee_name || a.employee_code}</td><td className="p-3 font-bold">{a.status}</td><td className="p-3">{a.time_in || "-"}</td><td className="p-3">{a.time_out || "-"}</td>
              <td className="p-3"><button onClick={() => onDelete(a.id)} className="text-rose-600"><Trash2 size={16} /></button></td></tr>
          ))}
          {list.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-400">Belum ada data absensi.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
