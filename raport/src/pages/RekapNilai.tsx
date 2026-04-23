import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download } from "lucide-react";

const rekapData = [
  { nis: "2024001", name: "Ahmad Rizki", mtk: 85, ipa: 78, bindo: 90, bing: 72, ips: 80, pkn: 88, avg: 82.2, rank: 3 },
  { nis: "2024002", name: "Siti Nurhaliza", mtk: 92, ipa: 88, bindo: 95, bing: 85, ips: 90, pkn: 93, avg: 90.5, rank: 1 },
  { nis: "2024003", name: "Budi Santoso", mtk: 60, ipa: 55, bindo: 70, bing: 58, ips: 65, pkn: 72, avg: 63.3, rank: 6 },
  { nis: "2024004", name: "Dewi Lestari", mtk: 78, ipa: 82, bindo: 88, bing: 76, ips: 85, pkn: 80, avg: 81.5, rank: 4 },
  { nis: "2024005", name: "Farhan Maulana", mtk: 65, ipa: 60, bindo: 72, bing: 55, ips: 70, pkn: 68, avg: 65.0, rank: 5 },
  { nis: "2024006", name: "Gita Puspita", mtk: 88, ipa: 90, bindo: 85, bing: 92, ips: 87, pkn: 91, avg: 88.8, rank: 2 },
];

const chartData = [
  { mapel: "MTK", avg: 78 },
  { mapel: "IPA", avg: 75.5 },
  { mapel: "B. Indo", avg: 83.3 },
  { mapel: "B. Ing", avg: 73 },
  { mapel: "IPS", avg: 79.5 },
  { mapel: "PKN", avg: 82 },
];

const pieData = [
  { name: "Tuntas", value: 4 },
  { name: "Belum Tuntas", value: 2 },
];

const COLORS = ["hsl(145 63% 42%)", "hsl(0 84% 60%)"];

const RekapNilai = () => {
  const [kelas, setKelas] = useState("IX-A");

  return (
    <DashboardLayout title="Rekap Nilai" subtitle="Rekapitulasi nilai dan peringkat siswa">
      <div className="mb-6 flex items-end gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Kelas</label>
          <select value={kelas} onChange={(e) => setKelas(e.target.value)} className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground">
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
        <button className="flex items-center gap-2 rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
          <Download className="h-4 w-4" />
          Export Excel
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-heading text-base font-semibold text-card-foreground">Rata-rata per Mapel — {kelas}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
              <XAxis dataKey="mapel" tick={{ fontSize: 12, fill: "hsl(215 15% 50%)" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(215 15% 50%)" }} />
              <Tooltip />
              <Bar dataKey="avg" name="Rata-rata" fill="hsl(217 91% 50%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-heading text-base font-semibold text-card-foreground">Ketuntasan Belajar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h3 className="font-heading text-lg font-semibold text-card-foreground">Peringkat Siswa — {kelas}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-center font-medium text-muted-foreground">Peringkat</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Nama Siswa</th>
                <th className="px-6 py-3 text-center font-medium text-muted-foreground">MTK</th>
                <th className="px-6 py-3 text-center font-medium text-muted-foreground">IPA</th>
                <th className="px-6 py-3 text-center font-medium text-muted-foreground">B.Indo</th>
                <th className="px-6 py-3 text-center font-medium text-muted-foreground">B.Ing</th>
                <th className="px-6 py-3 text-center font-medium text-muted-foreground">IPS</th>
                <th className="px-6 py-3 text-center font-medium text-muted-foreground">PKN</th>
                <th className="px-6 py-3 text-center font-medium text-muted-foreground">Rata-rata</th>
                <th className="px-6 py-3 text-center font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {rekapData.sort((a, b) => a.rank - b.rank).map((s) => (
                <tr key={s.nis} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-3 text-center font-bold text-primary">{s.rank}</td>
                  <td className="px-6 py-3 font-medium text-card-foreground">{s.name}</td>
                  <td className="px-6 py-3 text-center">{s.mtk}</td>
                  <td className="px-6 py-3 text-center">{s.ipa}</td>
                  <td className="px-6 py-3 text-center">{s.bindo}</td>
                  <td className="px-6 py-3 text-center">{s.bing}</td>
                  <td className="px-6 py-3 text-center">{s.ips}</td>
                  <td className="px-6 py-3 text-center">{s.pkn}</td>
                  <td className="px-6 py-3 text-center font-bold">{s.avg}</td>
                  <td className="px-6 py-3 text-center">
                    <Badge variant={s.avg >= 75 ? "default" : "destructive"}>{s.avg >= 75 ? "Tuntas" : "Belum Tuntas"}</Badge>
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

export default RekapNilai;
