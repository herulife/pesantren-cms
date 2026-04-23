import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Save, CheckCircle2, School, User, Calendar, Shield } from "lucide-react";

const Pengaturan = () => {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <DashboardLayout title="Pengaturan" subtitle="Konfigurasi sistem eRapor">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profil Sekolah */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <School className="h-5 w-5 text-primary" />
            <h3 className="font-heading text-base font-semibold text-card-foreground">Profil Sekolah</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Nama Sekolah</label>
              <input defaultValue="SMP Negeri 1 Jakarta" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">NPSN</label>
              <input defaultValue="20100001" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Alamat</label>
              <input defaultValue="Jl. Pendidikan No. 1, Jakarta Pusat" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Telepon</label>
                <input defaultValue="(021) 12345678" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
                <input defaultValue="info@smpn1jkt.sch.id" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          </div>
        </div>

        {/* Tahun Ajaran */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-heading text-base font-semibold text-card-foreground">Tahun Ajaran</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Tahun Ajaran Aktif</label>
              <select className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground">
                <option>2024/2025</option>
                <option>2023/2024</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Semester Aktif</label>
              <select className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground">
                <option>Semester 1 (Ganjil)</option>
                <option>Semester 2 (Genap)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Kepala Sekolah</label>
              <input defaultValue="Dr. Surya Darma, M.Pd." className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">NIP Kepala Sekolah</label>
              <input defaultValue="196505121990031002" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        </div>

        {/* Profil Pengguna */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-heading text-base font-semibold text-card-foreground">Profil Pengguna</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Nama Lengkap</label>
              <input defaultValue="Andi Gunawan, S.Pd." className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">NIP</label>
              <input defaultValue="198803152012041001" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Wali Kelas</label>
              <input defaultValue="IX-A" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        </div>

        {/* Keamanan */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-heading text-base font-semibold text-card-foreground">Keamanan</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Password Lama</label>
              <input type="password" placeholder="••••••••" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Password Baru</label>
              <input type="password" placeholder="••••••••" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Konfirmasi Password</label>
              <input type="password" placeholder="••••••••" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Tersimpan!" : "Simpan Pengaturan"}
        </button>
      </div>
    </DashboardLayout>
  );
};

export default Pengaturan;
