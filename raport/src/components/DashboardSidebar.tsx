import { LayoutDashboard, Users, BookOpen, ClipboardList, Settings, GraduationCap, BarChart3, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Data Siswa", path: "/data-siswa" },
  { icon: BookOpen, label: "Mata Pelajaran", path: "/mata-pelajaran" },
  { icon: ClipboardList, label: "Input Nilai", path: "/input-nilai" },
  { icon: BarChart3, label: "Rekap Nilai", path: "/rekap-nilai" },
  { icon: FileText, label: "Cetak Rapor", path: "/cetak-rapor" },
  { icon: Settings, label: "Pengaturan", path: "/pengaturan" },
];

const DashboardSidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
          <GraduationCap className="h-6 w-6 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="font-heading text-lg font-bold text-sidebar-primary-foreground">eRapor</h1>
          <p className="text-xs text-sidebar-foreground/60">Sistem Penilaian Digital</p>
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-1 px-3">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
            AG
          </div>
          <div>
            <p className="text-sm font-medium text-sidebar-accent-foreground">Andi Gunawan</p>
            <p className="text-xs text-sidebar-foreground/60">Wali Kelas IX-A</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
