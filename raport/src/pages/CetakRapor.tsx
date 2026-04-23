import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Printer, Eye, FileText } from "lucide-react";

const students = [
  { nis: "2024001", name: "Ahmad Rizki", kelas: "IX-A" },
  { nis: "2024002", name: "Siti Nurhaliza", kelas: "IX-A" },
  { nis: "2024003", name: "Budi Santoso", kelas: "IX-A" },
  { nis: "2024004", name: "Dewi Lestari", kelas: "IX-A" },
  { nis: "2024005", name: "Farhan Maulana", kelas: "IX-B" },
  { nis: "2024006", name: "Gita Puspita", kelas: "IX-B" },
];

const CetakRapor = () => {
  const [kelas, setKelas] = useState("IX-A");
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = students.filter((s) => s.kelas === kelas);

  const toggleSelect = (nis: string) => {
    setSelected((prev) => prev.includes(nis) ? prev.filter((n) => n !== nis) : [...prev, nis]);
  };

  const toggleAll = () => {
    if (selected.length === filtered.length) {
      setSelected([]);
    } else {
      setSelected(filtered.map((s) => s.nis));
    }
  };

  return (
    <DashboardLayout title="Cetak Rapor" subtitle="Cetak rapor siswa per kelas">
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Kelas</label>
          <select value={kelas} onChange={(e) => { setKelas(e.target.value); setSelected([]); }} className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground">
            <option>IX-A</option>
            <option>IX-B</option>
            <option>IX-C</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Semester</label>
          <select className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground">
            <option>Semester 1 — 2024/2025</option>
            <option>Semester 2 — 2024/2025</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <p className="text-sm text-muted-foreground">{selected.length} dari {filtered.length} siswa dipilih</p>
          <div className="flex gap-2">
            <button
              disabled={selected.length === 0}
              className="flex items-center gap-2 rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
            <button
              disabled={selected.length === 0}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              <Printer className="h-4 w-4" />
              Cetak Rapor
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left">
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} className="h-4 w-4 rounded border-input" />
                </th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">No</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">NIS</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Nama Siswa</th>
                <th className="px-6 py-3 text-center font-medium text-muted-foreground">Kelas</th>
                <th className="px-6 py-3 text-center font-medium text-muted-foreground">Status Rapor</th>
                <th className="px-6 py-3 text-center font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.nis} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-3">
                    <input type="checkbox" checked={selected.includes(s.nis)} onChange={() => toggleSelect(s.nis)} className="h-4 w-4 rounded border-input" />
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{i + 1}</td>
                  <td className="px-6 py-3 text-muted-foreground">{s.nis}</td>
                  <td className="px-6 py-3 font-medium text-card-foreground">{s.name}</td>
                  <td className="px-6 py-3 text-center">{s.kelas}</td>
                  <td className="px-6 py-3 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                      <FileText className="h-3 w-3" /> Lengkap
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button className="rounded-md px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors">
                      Preview
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CetakRapor;
