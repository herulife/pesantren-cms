import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";

const subjects = [
  { kode: "MTK", nama: "Matematika", guru: "Pak Hasan", kkm: 75, kelas: "IX-A, IX-B, IX-C", jam: 5 },
  { kode: "IPA", nama: "Ilmu Pengetahuan Alam", guru: "Bu Ratna", kkm: 75, kelas: "IX-A, IX-B, IX-C", jam: 5 },
  { kode: "BIND", nama: "Bahasa Indonesia", guru: "Bu Sari", kkm: 75, kelas: "IX-A, IX-B, IX-C", jam: 4 },
  { kode: "BING", nama: "Bahasa Inggris", guru: "Pak David", kkm: 72, kelas: "IX-A, IX-B, IX-C", jam: 4 },
  { kode: "IPS", nama: "Ilmu Pengetahuan Sosial", guru: "Pak Eko", kkm: 73, kelas: "IX-A, IX-B", jam: 4 },
  { kode: "PKN", nama: "Pendidikan Kewarganegaraan", guru: "Bu Ani", kkm: 75, kelas: "IX-A, IX-B, IX-C", jam: 3 },
  { kode: "SENI", nama: "Seni Budaya", guru: "Pak Bagus", kkm: 70, kelas: "IX-A, IX-B, IX-C", jam: 2 },
  { kode: "PJOK", nama: "Pendidikan Jasmani", guru: "Pak Joko", kkm: 75, kelas: "IX-A, IX-B, IX-C", jam: 3 },
  { kode: "PRAKARYA", nama: "Prakarya", guru: "Bu Dina", kkm: 70, kelas: "IX-A, IX-C", jam: 2 },
  { kode: "PAI", nama: "Pendidikan Agama Islam", guru: "Pak Usman", kkm: 75, kelas: "IX-A, IX-B, IX-C", jam: 3 },
  { kode: "INFO", nama: "Informatika", guru: "Pak Reza", kkm: 72, kelas: "IX-A, IX-B", jam: 2 },
  { kode: "BMUL", nama: "Bahasa Daerah (Muatan Lokal)", guru: "Bu Lastri", kkm: 70, kelas: "IX-A, IX-B, IX-C", jam: 2 },
];

const MataPelajaran = () => {
  return (
    <DashboardLayout title="Mata Pelajaran" subtitle="Kelola data mata pelajaran dan KKM">
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <p className="text-sm text-muted-foreground">Total: {subjects.length} mata pelajaran</p>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Tambah Mapel
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Kode</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Nama Mata Pelajaran</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Guru Pengampu</th>
                <th className="px-6 py-3 text-center font-medium text-muted-foreground">KKM</th>
                <th className="px-6 py-3 text-center font-medium text-muted-foreground">Jam/Minggu</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Kelas</th>
                <th className="px-6 py-3 text-center font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.kode} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-3">
                    <Badge variant="outline" className="font-mono">{s.kode}</Badge>
                  </td>
                  <td className="px-6 py-3 font-medium text-card-foreground">{s.nama}</td>
                  <td className="px-6 py-3 text-muted-foreground">{s.guru}</td>
                  <td className="px-6 py-3 text-center font-semibold">{s.kkm}</td>
                  <td className="px-6 py-3 text-center">{s.jam}</td>
                  <td className="px-6 py-3 text-muted-foreground text-xs">{s.kelas}</td>
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
      </div>
    </DashboardLayout>
  );
};

export default MataPelajaran;
