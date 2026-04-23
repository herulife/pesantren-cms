import DashboardLayout from "@/components/DashboardLayout";
import StatsCards from "@/components/StatsCards";
import StudentTable from "@/components/StudentTable";
import GradeChart from "@/components/GradeChart";

const Index = () => {
  return (
    <DashboardLayout title="Dashboard eRapor" subtitle="Semester 1 — Tahun Ajaran 2024/2025">
      <StatsCards />
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <StudentTable />
        </div>
        <div>
          <GradeChart />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
