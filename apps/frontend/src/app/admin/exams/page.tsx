'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ArrowLeft, 
  Save, 
  Trash2, 
  PlusCircle, 
  FileText, 
  GraduationCap,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { getAvailableExams, type Exam, type Question } from '@/lib/api';

export default function AdminExamManagement() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [showAddExam, setShowAddExam] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  // Form State
  const [newExam, setNewExam] = useState<Partial<Exam>>({
    title: '',
    subject_id: 1,
    duration_minutes: 60,
    academic_year: '2023/2024',
    semester: 'Ganjil'
  });

  useEffect(() => {
    let cancelled = false;

    const loadExams = async () => {
      setIsLoading(true);
      const data = await getAvailableExams();
      if (cancelled) {
        return;
      }
      setExams(data);
      setIsLoading(false);
    };

    void loadExams();

    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const API_BASE_URL = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api')
      : '/api';
    
    try {
      const res = await fetch(`${API_BASE_URL}/exams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExam),
        credentials: 'include'
      });
      if (res.ok) {
        setShowAddExam(false);
        setRefreshTick((value) => value + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mx-auto max-w-5xl pb-20">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900">
          <ArrowLeft size={16} /> Dashboard Admin
        </Link>
        <button 
          onClick={() => setShowAddExam(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
        >
          <Plus size={18} /> Paket Ujian Baru
        </button>
      </div>

      <div className="mb-10">
        <h1 className="font-outfit text-4xl font-black uppercase tracking-tight text-slate-900 text-center md:text-left">Manajemen CBT</h1>
        <p className="mt-2 text-lg text-slate-500 text-center md:text-left">Kelola bank soal, jadwal ujian, dan pantau hasil pengerjaan santri.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-20">
          <RefreshCw className="animate-spin text-blue-600" size={40} />
        </div>
      ) : exams.length === 0 ? (
        <div className="rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white p-20 text-center">
            <GraduationCap className="mx-auto mb-4 text-slate-200" size={48} />
            <p className="font-bold text-slate-400 uppercase tracking-widest">Belum Ada Paket Ujian</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {exams.map(exam => (
            <div key={exam.id} className="group flex items-center justify-between rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
              <div className="flex items-center gap-6">
                <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 md:flex">
                  <FileText size={28} />
                </div>
                <div>
                  <h4 className="font-outfit text-lg font-black uppercase tracking-tight text-slate-900">{exam.title}</h4>
                  <p className="text-xs font-bold text-slate-400">{exam.subject_name || 'Mata Pelajaran #'+exam.subject_id} • {exam.duration_minutes} Menit</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-xl border border-slate-100 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-blue-200 hover:text-blue-600">Edit Soal</button>
                <button className="rounded-xl border border-slate-100 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-rose-100 hover:text-rose-600">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add Exam */}
      {showAddExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2.5rem] bg-white p-10 shadow-2xl">
            <h2 className="mb-6 font-outfit text-2xl font-black uppercase tracking-tight text-slate-900">Buat Paket Ujian</h2>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Judul Ujian</label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: UAS Tahfidz Ganjil"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none"
                  onChange={e => setNewExam({...newExam, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Tahun Akademik</label>
                  <input 
                    type="text"
                    defaultValue="2023/2024"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none"
                    onChange={e => setNewExam({...newExam, academic_year: e.target.value})}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Durasi (Menit)</label>
                  <input 
                    type="number"
                    defaultValue={60}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none"
                    onChange={e => setNewExam({...newExam, duration_minutes: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="mt-8 flex gap-4">
                <button type="button" onClick={() => setShowAddExam(false)} className="flex-1 rounded-2xl py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900">Batal</button>
                <button type="submit" className="flex-1 rounded-2xl bg-slate-900 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-blue-600 transition-all">Simpan Paket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
