import { Badge } from "@/components/ui/badge";

const students = [
  { nis: "2024001", name: "Ahmad Rizki", kelas: "IX-A", mtk: 85, ipa: 78, bindo: 90, bing: 72, avg: 81.3, status: "Tuntas" },
  { nis: "2024002", name: "Siti Nurhaliza", kelas: "IX-A", mtk: 92, ipa: 88, bindo: 95, bing: 85, avg: 90.0, status: "Tuntas" },
  { nis: "2024003", name: "Budi Santoso", kelas: "IX-A", mtk: 60, ipa: 55, bindo: 70, bing: 58, avg: 60.8, status: "Belum Tuntas" },
  { nis: "2024004", name: "Dewi Lestari", kelas: "IX-A", mtk: 78, ipa: 82, bindo: 88, bing: 76, avg: 81.0, status: "Tuntas" },
  { nis: "2024005", name: "Farhan Maulana", kelas: "IX-A", mtk: 65, ipa: 60, bindo: 72, bing: 55, avg: 63.0, status: "Belum Tuntas" },
  { nis: "2024006", name: "Gita Puspita", kelas: "IX-A", mtk: 88, ipa: 90, bindo: 85, bing: 92, avg: 88.8, status: "Tuntas" },
];

const StudentTable = () => {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="font-heading text-lg font-semibold text-card-foreground">Rekap Nilai Siswa — Kelas IX-A</h2>
        <select className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground">
          <option>Semester 1 — 2024/2025</option>
          <option>Semester 2 — 2024/2025</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">NIS</th>
              <th className="px-6 py-3 text-left font-medium text-muted-foreground">Nama Siswa</th>
              <th className="px-6 py-3 text-center font-medium text-muted-foreground">MTK</th>
              <th className="px-6 py-3 text-center font-medium text-muted-foreground">IPA</th>
              <th className="px-6 py-3 text-center font-medium text-muted-foreground">B. Indo</th>
              <th className="px-6 py-3 text-center font-medium text-muted-foreground">B. Ing</th>
              <th className="px-6 py-3 text-center font-medium text-muted-foreground">Rata-rata</th>
              <th className="px-6 py-3 text-center font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.nis} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-6 py-3 text-muted-foreground">{s.nis}</td>
                <td className="px-6 py-3 font-medium text-card-foreground">{s.name}</td>
                <td className="px-6 py-3 text-center">{s.mtk}</td>
                <td className="px-6 py-3 text-center">{s.ipa}</td>
                <td className="px-6 py-3 text-center">{s.bindo}</td>
                <td className="px-6 py-3 text-center">{s.bing}</td>
                <td className="px-6 py-3 text-center font-semibold">{s.avg}</td>
                <td className="px-6 py-3 text-center">
                  <Badge variant={s.status === "Tuntas" ? "default" : "destructive"} className="text-xs">
                    {s.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentTable;
