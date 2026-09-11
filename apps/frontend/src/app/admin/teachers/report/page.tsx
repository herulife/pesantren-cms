"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getReportPerGuru, PerGuruRow } from "@/lib/api";
import { exportToPDF, exportToExcel } from "@/lib/export";
import { FileDown, FileSpreadsheet } from "lucide-react";

export default function PerGuruReportPage() {
  const [rows, setRows] = useState<PerGuruRow[]>([]);
  const [semester, setSemester] = useState("");
  const [year, setYear] = useState("");

  const load = useCallback(async () => {
    const data = await getReportPerGuru({ semester, year });
    setRows(data);
  }, [semester, year]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const exportPDF = () => {
    exportToPDF("Laporan per Guru", ["Guru", "Mapel", "Siswa", "Nilai", "Rata2"], rows.map((r) => [r.teacher_name, r.subjects, String(r.student_count), String(r.grade_count), r.avg_final.toFixed(1)]), "lap_per_guru");
  };
  const exportExcel = () => {
    exportToExcel("Laporan per Guru", ["Guru", "Mapel", "Siswa", "Nilai", "Rata2"], rows.map((r) => [r.teacher_name, r.subjects, r.student_count, r.grade_count, Number(r.avg_final.toFixed(1))]), "lap_per_guru");
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-black mb-1">Laporan per Guru</h1>
      <p className="text-sm text-slate-500 mb-4">Rekap mapel diampu, siswa dinilai, dan rata-rata nilai akhir per guru pengampu.</p>
      <div className="flex flex-wrap gap-2 mb-4">
        <input value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="Semester (cth: Ganjil)" className="border rounded-xl px-3 py-2 text-sm" />
        <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Tahun (cth: 2025/2026)" className="border rounded-xl px-3 py-2 text-sm" />
        <button onClick={exportPDF} className="ml-auto bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1"><FileDown size={16} /> PDF</button>
        <button onClick={exportExcel} className="bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1"><FileSpreadsheet size={16} /> Excel</button>
      </div>
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-left"><th className="p-3">Guru</th><th className="p-3">Mapel</th><th className="p-3">Siswa</th><th className="p-3">Nilai</th><th className="p-3">Rata2</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t"><td className="p-3 font-bold">{r.teacher_name}</td><td className="p-3">{r.subjects} ({r.subject_count})</td><td className="p-3">{r.student_count}</td><td className="p-3">{r.grade_count}</td><td className="p-3 font-bold">{Number(r.avg_final).toFixed(1)}</td></tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-400">Belum ada data.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
