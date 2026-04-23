import { Users, BookOpen, Trophy, AlertTriangle } from "lucide-react";

const stats = [
  { label: "Total Siswa", value: "324", icon: Users, color: "bg-primary/10 text-primary" },
  { label: "Mata Pelajaran", value: "12", icon: BookOpen, color: "bg-success/10 text-success" },
  { label: "Rata-rata Kelas", value: "78.5", icon: Trophy, color: "bg-warning/10 text-warning" },
  { label: "Perlu Perhatian", value: "18", icon: AlertTriangle, color: "bg-destructive/10 text-destructive" },
];

const StatsCards = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-1 font-heading text-2xl font-bold text-card-foreground">{stat.value}</p>
            </div>
            <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
