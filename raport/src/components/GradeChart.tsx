import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { mapel: "MTK", rataRata: 78 },
  { mapel: "IPA", rataRata: 75 },
  { mapel: "B. Indo", rataRata: 83 },
  { mapel: "B. Ing", rataRata: 72 },
  { mapel: "IPS", rataRata: 80 },
  { mapel: "PKN", rataRata: 85 },
  { mapel: "Seni", rataRata: 88 },
  { mapel: "PJOK", rataRata: 82 },
];

const GradeChart = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 font-heading text-lg font-semibold text-card-foreground">Rata-rata Nilai per Mata Pelajaran</h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
          <XAxis dataKey="mapel" tick={{ fontSize: 12, fill: "hsl(215 15% 50%)" }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(215 15% 50%)" }} />
          <Tooltip
            contentStyle={{
              borderRadius: "0.5rem",
              border: "1px solid hsl(214 20% 90%)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          />
          <Bar dataKey="rataRata" name="Rata-rata" fill="hsl(217 91% 50%)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GradeChart;
