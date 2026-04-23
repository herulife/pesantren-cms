import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Save, CheckCircle2 } from "lucide-react";

const students = [
  { nis: "2024001", name: "Ahmad Rizki" },
  { nis: "2024002", name: "Siti Nurhaliza" },
  { nis: "2024003", name: "Budi Santoso" },
  { nis: "2024004", name: "Dewi Lestari" },
  { nis: "2024005", name: "Farhan Maulana" },
  { nis: "2024006", name: "Gita Puspita" },
];

const InputNilai = () => {
  const [kelas, setKelas] = useState("IX-A");
  const [mapel, setMapel] = useState("MTK");
  const [saved, setSaved] = useState(false);

  const [grades, setGrades] = useState(
    students.map((s) => ({
      ...s,
      tugas: "",
      uts: "",
      uas: "",
      sikap: "B",
    }))
  );

  const handleChange = (index: number, field: string, value: string) => {
    const updated = [...grades];
    updated[index] = { ...updated[index], [field]: value };
    setGrades(updated);
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <DashboardLayout title="Input Nilai" subtitle="Masukkan nilai siswa per mata pelajaran">
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Kelas</label>
          <select
            value={kelas}
            onChange={(e) => setKelas(e.target.value)}
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground"
          >
            <option>IX-A</option>
            <option>IX-B</option>
            <option>IX-C</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Mata Pelajaran</label>
          <select
            value={mapel}
            onChange={(e) => setMapel(e.target.value)}
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground"
          >
            <option value="MTK">Matematika</option>
            <option value="IPA">IPA</option>
            <option value="BIND">Bahasa Indonesia</option>
            <option value="BING">Bahasa Inggris</option>
            <option value="IPS">IPS</option>
            <option value="PKN">PKN</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Semester</label>
          <select className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground">
            <option>Semester 1</option>
            <option>Semester 2</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">No</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">NIS</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Nama Siswa</th>
                <th className="px-6 py-3 text-center font-medium text-muted-foreground">Tugas</th>
                <th className="px-6 py-3 text-center font-medium text-muted-foreground">UTS</th>
                <th className="px-6 py-3 text-center font-medium text-muted-foreground">UAS</th>
                <th className="px-6 py-3 text-center font-medium text-muted-foreground">Sikap</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((s, i) => (
                <tr key={s.nis} className="border-b border-border last:border-0">
                  <td className="px-6 py-3 text-muted-foreground">{i + 1}</td>
                  <td className="px-6 py-3 text-muted-foreground">{s.nis}</td>
                  <td className="px-6 py-3 font-medium text-card-foreground">{s.name}</td>
                  <td className="px-6 py-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={s.tugas}
                      onChange={(e) => handleChange(i, "tugas", e.target.value)}
                      className="h-9 w-20 rounded-lg border border-input bg-background px-2 text-center text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </td>
                  <td className="px-6 py-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={s.uts}
                      onChange={(e) => handleChange(i, "uts", e.target.value)}
                      className="h-9 w-20 rounded-lg border border-input bg-background px-2 text-center text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </td>
                  <td className="px-6 py-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={s.uas}
                      onChange={(e) => handleChange(i, "uas", e.target.value)}
                      className="h-9 w-20 rounded-lg border border-input bg-background px-2 text-center text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </td>
                  <td className="px-6 py-2 text-center">
                    <select
                      value={s.sikap}
                      onChange={(e) => handleChange(i, "sikap", e.target.value)}
                      className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-foreground"
                    >
                      <option>A</option>
                      <option>B</option>
                      <option>C</option>
                      <option>D</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <p className="text-sm text-muted-foreground">
            Kelas: {kelas} • Mapel: {mapel} • {grades.length} siswa
          </p>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Tersimpan!" : "Simpan Nilai"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InputNilai;
