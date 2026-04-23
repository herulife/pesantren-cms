import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

const initialStudents = [
  { nis: "2024001", name: "Ahmad Rizki", kelas: "IX-A", jk: "L", tempatLahir: "Jakarta", tglLahir: "2009-05-12", alamat: "Jl. Merdeka No. 10" },
  { nis: "2024002", name: "Siti Nurhaliza", kelas: "IX-A", jk: "P", tempatLahir: "Bandung", tglLahir: "2009-08-22", alamat: "Jl. Anggrek No. 5" },
  { nis: "2024003", name: "Budi Santoso", kelas: "IX-A", jk: "L", tempatLahir: "Surabaya", tglLahir: "2009-03-15", alamat: "Jl. Kenanga No. 8" },
  { nis: "2024004", name: "Dewi Lestari", kelas: "IX-A", jk: "P", tempatLahir: "Yogyakarta", tglLahir: "2009-11-03", alamat: "Jl. Mawar No. 12" },
  { nis: "2024005", name: "Farhan Maulana", kelas: "IX-B", jk: "L", tempatLahir: "Semarang", tglLahir: "2009-07-28", alamat: "Jl. Melati No. 3" },
  { nis: "2024006", name: "Gita Puspita", kelas: "IX-B", jk: "P", tempatLahir: "Malang", tglLahir: "2009-01-17", alamat: "Jl. Dahlia No. 7" },
  { nis: "2024007", name: "Hendra Wijaya", kelas: "IX-B", jk: "L", tempatLahir: "Medan", tglLahir: "2009-09-09", alamat: "Jl. Flamboyan No. 15" },
  { nis: "2024008", name: "Indah Permata", kelas: "IX-C", jk: "P", tempatLahir: "Makassar", tglLahir: "2009-04-20", alamat: "Jl. Cempaka No. 22" },
];

const DataSiswa = () => {
  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState("Semua");

  const filtered = initialStudents.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.nis.includes(search);
    const matchKelas = filterKelas === "Semua" || s.kelas === filterKelas;
    return matchSearch && matchKelas;
  });

  return (
    <DashboardLayout title="Data Siswa" subtitle="Kelola data siswa sekolah">
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari nama atau NIS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
            >
              <option>Semua</option>
              <option>IX-A</option>
              <option>IX-B</option>
              <option>IX-C</option>
            </select>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Tambah Siswa
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">NIS</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Nama Siswa</th>
                <th className="px-6 py-3 text-center font-medium text-muted-foreground">Kelas</th>
                <th className="px-6 py-3 text-center font-medium text-muted-foreground">L/P</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Tempat, Tgl Lahir</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Alamat</th>
                <th className="px-6 py-3 text-center font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.nis} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-3 text-muted-foreground">{s.nis}</td>
                  <td className="px-6 py-3 font-medium text-card-foreground">{s.name}</td>
                  <td className="px-6 py-3 text-center">
                    <Badge variant="secondary">{s.kelas}</Badge>
                  </td>
                  <td className="px-6 py-3 text-center">{s.jk}</td>
                  <td className="px-6 py-3 text-muted-foreground">{s.tempatLahir}, {s.tglLahir}</td>
                  <td className="px-6 py-3 text-muted-foreground">{s.alamat}</td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-6 py-3 text-sm text-muted-foreground">
          Menampilkan {filtered.length} dari {initialStudents.length} siswa
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DataSiswa;
