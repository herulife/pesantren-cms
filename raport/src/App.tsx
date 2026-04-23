import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import DataSiswa from "./pages/DataSiswa.tsx";
import MataPelajaran from "./pages/MataPelajaran.tsx";
import InputNilai from "./pages/InputNilai.tsx";
import RekapNilai from "./pages/RekapNilai.tsx";
import CetakRapor from "./pages/CetakRapor.tsx";
import Pengaturan from "./pages/Pengaturan.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/data-siswa" element={<DataSiswa />} />
          <Route path="/mata-pelajaran" element={<MataPelajaran />} />
          <Route path="/input-nilai" element={<InputNilai />} />
          <Route path="/rekap-nilai" element={<RekapNilai />} />
          <Route path="/cetak-rapor" element={<CetakRapor />} />
          <Route path="/pengaturan" element={<Pengaturan />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
