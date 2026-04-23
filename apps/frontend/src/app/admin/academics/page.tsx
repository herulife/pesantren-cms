'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import {
  Attendance,
  CompactUser,
  Grade,
  Subject,
  TahfidzProgress,
  createSubject,
  deleteAttendance,
  deleteGrade,
  deleteSubject,
  deleteTahfidz,
  getAcademicStudents,
  getAttendance,
  getAttendanceSummary,
  getGrades,
  getGradesByStudent,
  getSubjects,
  getTahfidz,
  sendWhatsApp,
} from '@/lib/api';
import { downloadBulkStudentReportPDF, downloadStudentReportPDF, exportToExcel, exportToPDF, previewBulkStudentReportPDF, previewStudentReportPDF } from '@/lib/export';
import { AlertTriangle, BarChart3, BookOpen, Calendar, ClipboardList, Download, Eye, FileDown, FileSpreadsheet, LayoutDashboard, Layers3, MessageSquare, Pencil, Plus, Printer, RefreshCw, Search, Trash2, Trophy, Users, X } from 'lucide-react';

type TabKey = 'dashboard' | 'grades' | 'attendance' | 'tahfidz' | 'recap' | 'reports' | 'subjects';
type DeleteType = 'grade' | 'attendance' | 'tahfidz' | 'subject';

const subjectInit = { name: '', category: 'Akademik', teacher_id: '0' };

function getLetterPredicate(letter?: string | null) {
  switch ((letter || '').toUpperCase()) {
    case 'A':
      return 'Sangat Baik';
    case 'B':
      return 'Baik';
    case 'C':
      return 'Cukup';
    case 'D':
      return 'Perlu Bimbingan';
    default:
      return '-';
  }
}

function getAchievementNote(score: number) {
  if (score >= 90) return 'Menunjukkan penguasaan materi yang sangat baik dan konsisten.';
  if (score >= 80) return 'Sudah memahami materi dengan baik dan perlu dipertahankan.';
  if (score >= 70) return 'Perlu penguatan pada beberapa materi agar hasil lebih stabil.';
  return 'Perlu pendampingan dan latihan tambahan untuk mengejar ketuntasan.';
}

function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-3xl rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-xl font-black text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-slate-900"><X size={16} /></button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AcademicsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('Ganjil');
  const [selectedYear, setSelectedYear] = useState('2024/2025');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [tahfidz, setTahfidz] = useState<TahfidzProgress[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<CompactUser[]>([]);
  const [subjectForm, setSubjectForm] = useState(subjectInit);
  const [reportOpen, setReportOpen] = useState(false);
  const [recapOpen, setRecapOpen] = useState(false);
  const [bulkReportOpen, setBulkReportOpen] = useState(false);
  const [reportStudentId, setReportStudentId] = useState('');
  const [reportGrades, setReportGrades] = useState<Grade[]>([]);
  const [reportAttendanceSummary, setReportAttendanceSummary] = useState<Record<string, number>>({});
  const [reportTahfidz, setReportTahfidz] = useState<TahfidzProgress[]>([]);
  const [selectedBulkStudentIds, setSelectedBulkStudentIds] = useState<string[]>([]);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [deleteState, setDeleteState] = useState<{ type: DeleteType; id: number | null }>({ type: 'grade', id: null });

  const loadRefs = async () => {
    const [subjectData, studentData] = await Promise.all([getSubjects(), getAcademicStudents()]);
    setSubjects(subjectData);
    setStudents(studentData);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (['dashboard', 'grades', 'recap', 'reports', 'subjects'].includes(activeTab)) setGrades(await getGrades(selectedSemester, selectedYear));
      if (activeTab === 'attendance') setAttendance(await getAttendance(selectedDate));
      if (activeTab === 'tahfidz') setTahfidz(await getTahfidz());
    } catch {
      showToast('error', 'Gagal memuat data akademik.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadRefs(); }, []);
  useEffect(() => { loadData(); }, [activeTab, selectedSemester, selectedYear, selectedDate]);
  const filteredGrades = useMemo(() => grades.filter((v) => (v.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (v.subject_name || '').toLowerCase().includes(searchQuery.toLowerCase())), [grades, searchQuery]);
  const filteredAttendance = useMemo(() => attendance.filter((v) => (v.student_name || '').toLowerCase().includes(searchQuery.toLowerCase())), [attendance, searchQuery]);
  const filteredTahfidz = useMemo(() => tahfidz.filter((v) => (v.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || v.surah_name.toLowerCase().includes(searchQuery.toLowerCase())), [tahfidz, searchQuery]);
  const semesterLabel = selectedSemester === 'Genap' ? 'Semester 2' : 'Semester 1';
  const academicPeriodLabel = `${semesterLabel} — Tahun Ajaran ${selectedYear}`;
  const averageGrade = filteredGrades.length ? (filteredGrades.reduce((sum, item) => sum + item.final_score, 0) / filteredGrades.length).toFixed(1) : '0.0';
  const hadirPct = filteredAttendance.length ? `${Math.round((filteredAttendance.filter((v) => v.status === 'hadir').length / filteredAttendance.length) * 100)}%` : '0%';
  const selectedReportStudent = students.find((student) => String(student.id) === reportStudentId) || null;
  const reportAverage = reportGrades.length ? (reportGrades.reduce((sum, item) => sum + item.final_score, 0) / reportGrades.length).toFixed(1) : '0.0';
  const recapSubjectColumns = useMemo(() => {
    const map = new Map<number, string>();
    filteredGrades.forEach((item) => {
      if (item.subject_id && item.subject_name) map.set(item.subject_id, item.subject_name);
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredGrades]);
  const studentRecaps = useMemo(() => {
    const grouped = new Map<number, {
      studentId: number;
      studentName: string;
      subjectScores: Record<number, number>;
      finalScores: number[];
      subjectCount: number;
    }>();

    filteredGrades.forEach((item) => {
      const current = grouped.get(item.student_id) || {
        studentId: item.student_id,
        studentName: item.student_name || `Santri ${item.student_id}`,
        subjectScores: {},
        finalScores: [],
        subjectCount: 0,
      };

      current.subjectScores[item.subject_id] = item.final_score;
      current.finalScores.push(item.final_score);
      current.subjectCount += 1;
      grouped.set(item.student_id, current);
    });

    return Array.from(grouped.values())
      .map((item) => {
        const average = item.finalScores.length ? item.finalScores.reduce((sum, value) => sum + value, 0) / item.finalScores.length : 0;
        return {
          ...item,
          average,
          status: average >= 75 ? 'Tuntas' : 'Perlu Pendampingan',
        };
      })
      .sort((a, b) => b.average - a.average)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
  }, [filteredGrades]);
  const recapSubjectAverages = useMemo(() => recapSubjectColumns.map((subject) => {
    const scores = filteredGrades.filter((item) => item.subject_id === subject.id).map((item) => item.final_score);
    const average = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0;
    return { ...subject, average, totalStudents: scores.length };
  }), [filteredGrades, recapSubjectColumns]);
  const recapCompletionStats = useMemo(() => {
    const total = studentRecaps.length;
    const completed = studentRecaps.filter((item) => item.average >= 75).length;
    return {
      total,
      completed,
      pending: Math.max(total - completed, 0),
    };
  }, [studentRecaps]);
  const topSubjects = useMemo(() => recapSubjectAverages
    .slice()
    .sort((a, b) => b.average - a.average)
    .slice(0, 6), [recapSubjectAverages]);
  const dashboardStats = useMemo(() => ([
    { label: 'Total Santri', value: String(studentRecaps.length), icon: Users, tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'Mata Pelajaran', value: String(recapSubjectColumns.length), icon: BookOpen, tone: 'bg-sky-50 text-sky-700' },
    { label: 'Rata-rata Kelas', value: averageGrade, icon: Trophy, tone: 'bg-amber-50 text-amber-700' },
    { label: 'Perlu Perhatian', value: String(recapCompletionStats.pending), icon: AlertTriangle, tone: 'bg-rose-50 text-rose-700' },
  ]), [studentRecaps.length, recapSubjectColumns.length, averageGrade, recapCompletionStats.pending]);
  useEffect(() => {
    if (bulkReportOpen) {
      setSelectedBulkStudentIds(studentRecaps.map((item) => String(item.studentId)));
    }
  }, [bulkReportOpen, studentRecaps]);

  useEffect(() => {
    setSelectedBulkStudentIds(studentRecaps.map((item) => String(item.studentId)));
  }, [studentRecaps]);

  const buildFormHref = (
    type: 'grade' | 'attendance' | 'tahfidz' | 'bulk-grade' | 'bulk-edit',
    extra: Record<string, string | number | undefined> = {},
  ) => {
    const params = new URLSearchParams({ type });
    params.set('semester', selectedSemester);
    params.set('year', selectedYear);
    if (activeTab === 'attendance') params.set('date', selectedDate);

    Object.entries(extra).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
    });

    return `/admin/academics/form?${params.toString()}`;
  };

  const openAdd = () => {
    if (activeTab === 'grades') router.push(buildFormHref('grade'));
    if (activeTab === 'attendance') router.push(buildFormHref('attendance', { date: selectedDate }));
    if (activeTab === 'tahfidz') router.push(buildFormHref('tahfidz'));
  };

  const saveSubject = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    try {
      await createSubject({ name: subjectForm.name, category: subjectForm.category, teacher_id: Number(subjectForm.teacher_id) });
      showToast('success', 'Mapel berhasil ditambahkan.');
      setSubjectForm(subjectInit); setSubjects(await getSubjects());
    } catch (error) { showToast('error', error instanceof Error ? error.message : 'Gagal menambah mapel.'); } finally { setIsSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteState.id) return;
    setIsSaving(true);
    try {
      if (deleteState.type === 'grade') await deleteGrade(deleteState.id);
      if (deleteState.type === 'attendance') await deleteAttendance(deleteState.id);
      if (deleteState.type === 'tahfidz') await deleteTahfidz(deleteState.id);
      if (deleteState.type === 'subject') {
        await deleteSubject(deleteState.id);
        setSubjects(await getSubjects());
      }
      if (deleteState.type !== 'subject') await loadData();
      showToast('success', 'Data berhasil dihapus.');
    } catch (error) { showToast('error', error instanceof Error ? error.message : 'Gagal menghapus data.'); } finally { setDeleteState((prev) => ({ ...prev, id: null })); setIsSaving(false); }
  };

  const notifyAlpha = async (item: Attendance) => {
    if (!item.student_phone) return showToast('error', 'Nomor WA tidak tersedia.');
    try {
      await sendWhatsApp(item.student_phone, `Assalamu'alaikum Wr. Wb.\n\nYth. Wali Santri *${item.student_name}*,\nKami informasikan bahwa ananda tercatat *TIDAK HADIR (Alpha)* pada tanggal *${item.date}*.\n\nMohon perhatiannya.\n_Admin Darussunnah_`);
      showToast('success', 'Notifikasi alpha berhasil dikirim.');
    } catch { showToast('error', 'Gagal mengirim notifikasi WA.'); }
  };

  const loadStudentReport = async (studentId: string) => {
    if (!studentId) {
      setReportGrades([]);
      setReportAttendanceSummary({});
      setReportTahfidz([]);
      return;
    }

    setIsReportLoading(true);
    try {
      const numericId = Number(studentId);
      const [gradesData, attendanceSummaryData] = await Promise.all([
        getGradesByStudent(numericId),
        getAttendanceSummary(numericId),
      ]);
      const tahfidzData = tahfidz.length ? tahfidz : await getTahfidz();
      setReportGrades(gradesData);
      setReportAttendanceSummary(attendanceSummaryData || {});
      setReportTahfidz(tahfidzData.filter((item) => item.student_id === numericId));
    } catch {
      showToast('error', 'Gagal memuat raport santri.');
    } finally {
      setIsReportLoading(false);
    }
  };

  const printReport = () => {
    if (typeof window === 'undefined') return;
    window.print();
  };

  const buildReportPayload = () => ({
    studentName: selectedReportStudent?.name || 'Santri Darussunnah',
    studentIdentity: selectedReportStudent?.email || '-',
    averageScore: reportAverage,
    hadir: reportAttendanceSummary.hadir || 0,
    izinSakit: (reportAttendanceSummary.izin || 0) + (reportAttendanceSummary.sakit || 0),
    alpha: reportAttendanceSummary.alpha || 0,
    scores: reportGrades.map((item) => ({
      subject: item.subject_name || '-',
      semester: item.semester || '-',
      academicYear: item.academic_year || '-',
      finalScore: item.final_score,
      gradeLetter: item.grade_letter || '-',
    })),
    tahfidz: reportTahfidz.map((item) => ({
      surahName: item.surah_name || '-',
      juz: item.juz || '-',
      ayatRange: `${item.start_ayat || '-'}-${item.end_ayat || '-'}`,
      status: item.status || '-',
      evaluationDate: item.evaluation_date || '-',
    })),
    filename: `raport-${(selectedReportStudent?.name || 'santri').toLowerCase().replace(/\s+/g, '-')}`,
  });

  const buildBulkReportPayload = async () => {
    const selectedIds = new Set(selectedBulkStudentIds.map((value) => Number(value)));
    const selectedRecaps = studentRecaps.filter((item) => selectedIds.has(item.studentId));
    const attendanceSummaryList = await Promise.all(selectedRecaps.map(async (item) => ({
      studentId: item.studentId,
      summary: await getAttendanceSummary(item.studentId),
    })));
    const attendanceSummaryMap = new Map(attendanceSummaryList.map((item) => [item.studentId, item.summary]));
    const tahfidzData = tahfidz.length ? tahfidz : await getTahfidz();
    const reports = studentRecaps
      .filter((item) => selectedIds.has(item.studentId))
      .map((item) => {
        const student = students.find((entry) => entry.id === item.studentId);
        const studentGrades = filteredGrades.filter((grade) => grade.student_id === item.studentId);
        const studentAttendanceSummary = attendanceSummaryMap.get(item.studentId) || {};
        const studentTahfidz = tahfidzData.filter((entry) => entry.student_id === item.studentId);

        return {
          studentName: item.studentName,
          studentIdentity: student?.email || '-',
          averageScore: item.average.toFixed(1),
          hadir: studentAttendanceSummary.hadir || 0,
          izinSakit: (studentAttendanceSummary.izin || 0) + (studentAttendanceSummary.sakit || 0),
          alpha: studentAttendanceSummary.alpha || 0,
          scores: studentGrades.map((grade) => ({
            subject: grade.subject_name || '-',
            semester: grade.semester || '-',
            academicYear: grade.academic_year || '-',
            finalScore: grade.final_score,
            gradeLetter: grade.grade_letter || '-',
          })),
          tahfidz: studentTahfidz.map((entry) => ({
            surahName: entry.surah_name || '-',
            juz: entry.juz || '-',
            ayatRange: `${entry.start_ayat || '-'}-${entry.end_ayat || '-'}`,
            status: entry.status || '-',
            evaluationDate: entry.evaluation_date || '-',
          })),
          filename: `raport-${item.studentName.toLowerCase().replace(/\s+/g, '-')}`,
        };
      });

    return {
      title: `Raport Massal ${selectedSemester} ${selectedYear}`,
      filename: `raport-massal-${selectedSemester.toLowerCase()}-${selectedYear.replace('/', '-')}`,
      reports,
    };
  };

  const exportRecapExcel = () => {
    const columns = ['Peringkat', 'Santri', ...recapSubjectColumns.map((subject) => subject.name), 'Rata-rata', 'Status'];
    const rows = studentRecaps.map((item) => [
      item.rank,
      item.studentName,
      ...recapSubjectColumns.map((subject) => item.subjectScores[subject.id] ?? '-'),
      item.average.toFixed(1),
      item.status,
    ]);
    exportToExcel(`Rekap Nilai ${selectedSemester} ${selectedYear}`, columns, rows, `rekap_nilai_${selectedSemester.toLowerCase()}_${selectedYear.replace('/', '-')}`);
  };

  const toggleBulkStudent = (studentId: string) => {
    setSelectedBulkStudentIds((prev) => prev.includes(studentId) ? prev.filter((item) => item !== studentId) : [...prev, studentId]);
  };

  const handlePreviewBulkReports = async () => {
    if (!selectedBulkStudentIds.length) return;
    setIsBulkGenerating(true);
    try {
      previewBulkStudentReportPDF(await buildBulkReportPayload());
    } catch {
      showToast('error', 'Gagal menyiapkan raport massal.');
    } finally {
      setIsBulkGenerating(false);
    }
  };

  const handleDownloadBulkReports = async () => {
    if (!selectedBulkStudentIds.length) return;
    setIsBulkGenerating(true);
    try {
      downloadBulkStudentReportPDF(await buildBulkReportPayload());
    } catch {
      showToast('error', 'Gagal mengunduh raport massal.');
    } finally {
      setIsBulkGenerating(false);
    }
  };

  const exportData = (type: 'pdf' | 'excel') => {
    const title = activeTab === 'grades' ? 'Laporan Nilai Santri' : activeTab === 'attendance' ? 'Laporan Presensi Santri' : 'Laporan Tahfidz Santri';
    const filename = activeTab === 'grades' ? 'laporan_nilai' : activeTab === 'attendance' ? 'laporan_presensi' : 'laporan_tahfidz';
    const columns = activeTab === 'grades' ? ['Santri', 'Mapel', 'UTS', 'UAS', 'Tugas', 'Akhir', 'Grade'] : activeTab === 'attendance' ? ['Santri', 'Tanggal', 'Status', 'Catatan'] : ['Santri', 'Surah', 'Juz', 'Ayat', 'Status', 'Tanggal'];
    const rows = activeTab === 'grades' ? filteredGrades.map((v) => [v.student_name || '-', v.subject_name || '-', v.uts_score, v.uas_score, v.task_score, v.final_score, v.grade_letter]) : activeTab === 'attendance' ? filteredAttendance.map((v) => [v.student_name || '-', v.date, v.status, v.notes || '-']) : filteredTahfidz.map((v) => [v.student_name || '-', v.surah_name, v.juz, `${v.start_ayat}-${v.end_ayat}`, v.status, v.evaluation_date]);
    if (type === 'pdf') return exportToPDF(title, columns, rows, filename);
    return exportToExcel(title, columns, rows, filename);
  };

  return (
    <div className="pb-10 font-outfit">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">Dashboard eRapor</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-800">eRapor</h2>
          <p className="mt-1 text-sm text-slate-500">{academicPeriodLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportData('pdf')} className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100"><FileDown size={16} /> Export PDF</button>
          <button onClick={() => exportData('excel')} className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100"><FileSpreadsheet size={16} /> Export Excel</button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">{[
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'grades', label: 'Nilai', icon: BookOpen },
        { id: 'attendance', label: 'Presensi', icon: Calendar },
        { id: 'tahfidz', label: 'Tahfidz', icon: ClipboardList },
        { id: 'recap', label: 'Rekap Nilai', icon: BarChart3 },
        { id: 'reports', label: 'Cetak Raport', icon: FileDown },
        { id: 'subjects', label: 'Mata Pelajaran', icon: Layers3 },
      ].map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id as TabKey)} className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}><tab.icon size={16} /> {tab.label}</button>)}</div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[280px] flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari data akademik..." className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm outline-none focus:border-emerald-500" /></div>
          {['grades', 'recap', 'reports'].includes(activeTab) && <>
            <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm"><option>Ganjil</option><option>Genap</option></select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm"><option>2023/2024</option><option>2024/2025</option><option>2025/2026</option></select>
          </>}
          {activeTab === 'grades' && <>
            <button onClick={() => setActiveTab('subjects')} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"><Layers3 size={16} /> Mapel</button>
            <button onClick={() => router.push(buildFormHref('bulk-grade'))} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"><Plus size={16} /> Input Massal</button>
            <button onClick={() => router.push(buildFormHref('bulk-edit'))} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"><Pencil size={16} /> Edit Massal</button>
          </>}
          {activeTab === 'attendance' && <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm" />}
          {['grades', 'attendance', 'tahfidz'].includes(activeTab) && <button onClick={openAdd} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"><Plus size={16} /> Tambah Data</button>}
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardStats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                    <p className="mt-1 text-2xl font-black text-slate-900">{stat.value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${stat.tone}`}>
                    <stat.icon size={20} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-slate-900">Rekap Nilai Siswa</h3>
                <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600">{academicPeriodLabel}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <th className="px-6 py-3 text-left font-medium text-slate-500">Rank</th>
                      <th className="px-6 py-3 text-left font-medium text-slate-500">Santri</th>
                      {recapSubjectColumns.slice(0, 4).map((subject) => <th key={subject.id} className="px-6 py-3 text-center font-medium text-slate-500">{subject.name}</th>)}
                      <th className="px-6 py-3 text-center font-medium text-slate-500">Rata-rata</th>
                      <th className="px-6 py-3 text-center font-medium text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentRecaps.slice(0, 8).map((item) => (
                      <tr key={item.studentId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3 font-bold text-emerald-700">{item.rank}</td>
                        <td className="px-6 py-3 font-medium text-slate-900">{item.studentName}</td>
                        {recapSubjectColumns.slice(0, 4).map((subject) => <td key={subject.id} className="px-6 py-3 text-center text-slate-600">{item.subjectScores[subject.id] ?? '-'}</td>)}
                        <td className="px-6 py-3 text-center font-semibold text-slate-900">{item.average.toFixed(1)}</td>
                        <td className="px-6 py-3 text-center">
                          <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${item.average >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{item.status}</span>
                        </td>
                      </tr>
                    ))}
                    {!studentRecaps.length && (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">Belum ada data nilai untuk dashboard eRapor.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Rata-rata Nilai per Mata Pelajaran</h3>
              <div className="space-y-4">
                {topSubjects.map((subject) => (
                  <div key={subject.id}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{subject.name}</span>
                      <span className="font-semibold text-slate-500">{subject.average.toFixed(1)}</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100">
                      <div
                        className="h-3 rounded-full bg-emerald-600 transition-all"
                        style={{ width: `${Math.max(8, Math.min(subject.average, 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
                {!topSubjects.length && <p className="text-sm text-slate-500">Belum ada nilai yang bisa diringkas.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {['grades', 'attendance', 'tahfidz'].includes(activeTab) && <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">{[
        {
          label: 'Rata-rata Nilai',
          value: averageGrade,
          color: 'text-emerald-700',
          tone: 'border-emerald-100 bg-emerald-50/80',
          labelTone: 'text-emerald-600/80',
        },
        {
          label: 'Kehadiran',
          value: hadirPct,
          color: 'text-sky-700',
          tone: 'border-sky-100 bg-sky-50/80',
          labelTone: 'text-sky-600/80',
        },
        {
          label: 'Tahfidz Lulus',
          value: String(filteredTahfidz.filter((v) => v.status === 'lulus').length),
          color: 'text-violet-700',
          tone: 'border-violet-100 bg-violet-50/80',
          labelTone: 'text-violet-600/80',
        },
        {
          label: 'Alpha',
          value: String(filteredAttendance.filter((v) => v.status === 'alpha').length),
          color: 'text-rose-700',
          tone: 'border-rose-100 bg-rose-50/80',
          labelTone: 'text-rose-600/80',
        },
      ].map((card) => (
        <div key={card.label} className={`rounded-xl border p-5 shadow-sm ${card.tone}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest ${card.labelTone}`}>{card.label}</p>
          <p className={`mt-2 text-3xl font-black ${card.color}`}>{card.value}</p>
        </div>
      ))}</div>}

      {['grades', 'attendance', 'tahfidz'].includes(activeTab) && <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? <div className="py-24 text-center text-sm font-bold text-slate-400">Memuat data...</div> : <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400"><tr><th className="px-6 py-4">Santri</th>{activeTab === 'grades' && <><th className="px-4 py-4">Mapel</th><th className="px-4 py-4">UTS</th><th className="px-4 py-4">UAS</th><th className="px-4 py-4">Tugas</th><th className="px-4 py-4">Akhir</th><th className="px-4 py-4">Grade</th></>}{activeTab === 'attendance' && <><th className="px-4 py-4">Tanggal</th><th className="px-4 py-4">Status</th></>}{activeTab === 'tahfidz' && <><th className="px-4 py-4">Surah</th><th className="px-4 py-4">Juz</th><th className="px-4 py-4">Ayat</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Evaluasi</th></>}<th className="px-6 py-4 text-right">Aksi</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {activeTab === 'grades' && filteredGrades.map((v) => <tr key={v.id}><td className="px-6 py-4 font-bold text-slate-800">{v.student_name}</td><td className="px-4 py-4">{v.subject_name}</td><td className="px-4 py-4">{v.uts_score}</td><td className="px-4 py-4">{v.uas_score}</td><td className="px-4 py-4">{v.task_score}</td><td className="px-4 py-4 font-black text-emerald-600">{v.final_score}</td><td className="px-4 py-4">{v.grade_letter}</td><td className="px-6 py-4"><div className="flex justify-end gap-2"><button onClick={() => router.push(buildFormHref('grade', { id: v.id, semester: v.semester, year: v.academic_year }))} className="rounded-xl bg-emerald-50 p-2 text-emerald-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-sm"><Pencil size={15} /></button><button onClick={() => setDeleteState({ type: 'grade', id: v.id })} className="rounded-xl bg-rose-50 p-2 text-rose-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-100 hover:shadow-sm"><Trash2 size={15} /></button></div></td></tr>)}
              {activeTab === 'attendance' && filteredAttendance.map((v) => <tr key={v.id}><td className="px-6 py-4 font-bold text-slate-800">{v.student_name}</td><td className="px-4 py-4">{v.date}</td><td className="px-4 py-4 font-bold uppercase">{v.status}</td><td className="px-6 py-4"><div className="flex justify-end gap-2">{v.status === 'alpha' && <button onClick={() => notifyAlpha(v)} className="rounded-xl bg-amber-50 p-2 text-amber-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-100 hover:shadow-sm"><MessageSquare size={15} /></button>}<button onClick={() => router.push(buildFormHref('attendance', { id: v.id, date: v.date }))} className="rounded-xl bg-emerald-50 p-2 text-emerald-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-sm"><Pencil size={15} /></button><button onClick={() => setDeleteState({ type: 'attendance', id: v.id })} className="rounded-xl bg-rose-50 p-2 text-rose-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-100 hover:shadow-sm"><Trash2 size={15} /></button></div></td></tr>)}
              {activeTab === 'tahfidz' && filteredTahfidz.map((v) => <tr key={v.id}><td className="px-6 py-4 font-bold text-slate-800">{v.student_name}</td><td className="px-4 py-4">{v.surah_name}</td><td className="px-4 py-4">{v.juz}</td><td className="px-4 py-4">{v.start_ayat}-{v.end_ayat}</td><td className="px-4 py-4 uppercase">{v.status}</td><td className="px-4 py-4">{v.evaluation_date}</td><td className="px-6 py-4"><div className="flex justify-end gap-2"><button onClick={() => router.push(buildFormHref('tahfidz', { id: v.id }))} className="rounded-xl bg-emerald-50 p-2 text-emerald-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-sm"><Pencil size={15} /></button><button onClick={() => setDeleteState({ type: 'tahfidz', id: v.id })} className="rounded-xl bg-rose-50 p-2 text-rose-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-100 hover:shadow-sm"><Trash2 size={15} /></button></div></td></tr>)}
            </tbody>
          </table>
        </div>}
      </div>}

      {activeTab === 'recap' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700/80">Santri Terekap</p>
              <p className="mt-2 text-3xl font-black text-emerald-700">{recapCompletionStats.total}</p>
            </div>
            <div className="rounded-xl border border-sky-100 bg-sky-50/80 p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-sky-700/80">Mapel Aktif</p>
              <p className="mt-2 text-3xl font-black text-sky-700">{recapSubjectColumns.length}</p>
            </div>
            <div className="rounded-xl border border-violet-100 bg-violet-50/80 p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-violet-700/80">Ketuntasan</p>
              <p className="mt-2 text-3xl font-black text-violet-700">{recapCompletionStats.completed}</p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/80 p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-700/80">Perlu Pendampingan</p>
              <p className="mt-2 text-3xl font-black text-rose-700">{recapCompletionStats.pending}</p>
            </div>
          </div>

          <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-600">Semester Aktif</p>
                <h4 className="mt-2 text-2xl font-black text-slate-900">{academicPeriodLabel}</h4>
              </div>
              <button onClick={exportRecapExcel} className="flex items-center justify-center gap-2 rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100">
                <FileSpreadsheet size={16} />
                EXPORT REKAP
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h5 className="text-sm font-black uppercase tracking-widest text-slate-500">Rata-rata per Mata Pelajaran</h5>
            </div>
            <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
              {recapSubjectAverages.map((subject) => (
                <div key={subject.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-800">{subject.name}</p>
                  <p className="mt-2 text-2xl font-black text-emerald-600">{subject.average.toFixed(1)}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{subject.totalStudents} santri masuk rekap</p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h5 className="text-sm font-black uppercase tracking-widest text-slate-500">Peringkat Santri</h5>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-center">Rank</th>
                    <th className="px-4 py-3">Santri</th>
                    {recapSubjectColumns.map((subject) => <th key={subject.id} className="px-4 py-3 text-center">{subject.name}</th>)}
                    <th className="px-4 py-3 text-center">Rata-rata</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentRecaps.map((item) => (
                    <tr key={item.studentId}>
                      <td className="px-4 py-4 text-center font-black text-emerald-700">{item.rank}</td>
                      <td className="px-4 py-4 font-bold text-slate-800">{item.studentName}</td>
                      {recapSubjectColumns.map((subject) => <td key={subject.id} className="px-4 py-4 text-center font-semibold text-slate-600">{item.subjectScores[subject.id] ?? '-'}</td>)}
                      <td className="px-4 py-4 text-center font-black text-slate-900">{item.average.toFixed(1)}</td>
                      <td className="px-4 py-4 text-center"><span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${item.average >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-700">Cetak Raport</p>
                <h4 className="mt-2 text-2xl font-black text-slate-900">{academicPeriodLabel}</h4>
                <p className="mt-1 text-sm font-medium text-slate-500">Pilih satu santri untuk raport individual, atau beberapa santri untuk raport massal.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setSelectedBulkStudentIds(studentRecaps.map((item) => String(item.studentId)))} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">Pilih Semua</button>
                <button type="button" onClick={() => setSelectedBulkStudentIds([])} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">Kosongkan</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1.4fr]">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h5 className="text-sm font-black uppercase tracking-widest text-slate-500">Raport Individual</h5>
              <div className="mt-4 flex flex-col gap-3">
                <select value={reportStudentId} onChange={(e) => { setReportStudentId(e.target.value); loadStudentReport(e.target.value); }} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm">
                  <option value="">Pilih santri untuk lihat raport</option>
                  {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
                </select>
                <div className="flex flex-col gap-3">
                  <button type="button" onClick={printReport} disabled={!reportStudentId} className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"><Printer size={16} /> CETAK</button>
                  <button type="button" onClick={() => previewStudentReportPDF(buildReportPayload())} disabled={!reportStudentId} className="flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"><Eye size={16} /> PREVIEW PDF</button>
                  <button type="button" onClick={() => downloadStudentReportPDF(buildReportPayload())} disabled={!reportStudentId} className="flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"><Download size={16} /> DOWNLOAD PDF</button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h5 className="text-sm font-black uppercase tracking-widest text-slate-500">Raport Massal</h5>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {studentRecaps.map((item) => {
                  const checked = selectedBulkStudentIds.includes(String(item.studentId));
                  return (
                    <label key={item.studentId} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${checked ? 'border-emerald-200 bg-emerald-50/80' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleBulkStudent(String(item.studentId))} className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                      <div className="min-w-0">
                        <p className="font-black text-slate-800">{item.studentName}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">Rata-rata {item.average.toFixed(1)} · Rank {item.rank}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="mt-5 flex flex-col gap-3 md:flex-row">
                <button type="button" onClick={handlePreviewBulkReports} disabled={!selectedBulkStudentIds.length || isBulkGenerating} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50">{isBulkGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Eye size={16} />} PREVIEW RAPORT MASSAL</button>
                <button type="button" onClick={handleDownloadBulkReports} disabled={!selectedBulkStudentIds.length || isBulkGenerating} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50">{isBulkGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />} DOWNLOAD RAPORT MASSAL</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subjects' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h5 className="text-sm font-black uppercase tracking-widest text-slate-500">Kelola Mata Pelajaran</h5>
            <form onSubmit={saveSubject} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_auto]">
              <input required value={subjectForm.name} onChange={(e) => setSubjectForm((p) => ({ ...p, name: e.target.value }))} className="rounded-lg border border-slate-200 px-4 py-2.5" placeholder="Nama mapel" />
              <input value={subjectForm.category} onChange={(e) => setSubjectForm((p) => ({ ...p, category: e.target.value }))} className="rounded-lg border border-slate-200 px-4 py-2.5" placeholder="Kategori" />
              <button disabled={isSaving} className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50">{isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />} Tambah</button>
            </form>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400"><tr><th className="px-4 py-3 text-left">Nama</th><th className="px-4 py-3 text-left">Kategori</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((s) => <tr key={s.id}><td className="px-4 py-3 font-bold text-slate-800">{s.name}</td><td className="px-4 py-3 text-sm text-slate-500">{s.category}</td><td className="px-4 py-3 text-right"><button onClick={() => setDeleteState({ type: 'subject', id: s.id })} className="rounded-xl bg-rose-50 p-2 text-rose-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-100 hover:shadow-sm"><Trash2 size={15} /></button></td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={reportOpen} title="Raport Santri" onClose={() => setReportOpen(false)}>
        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row">
            <select
              value={reportStudentId}
              onChange={(e) => {
                setReportStudentId(e.target.value);
                loadStudentReport(e.target.value);
              }}
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            >
              <option value="">Pilih santri untuk lihat raport</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={printReport}
              disabled={!reportStudentId}
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-xs font-black text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-sm disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-slate-900 disabled:hover:shadow-none"
            >
              <Printer size={16} />
              CETAK
            </button>
            <button
              type="button"
              onClick={() => previewStudentReportPDF(buildReportPayload())}
              disabled={!reportStudentId}
              className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-xs font-black text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-sm disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-emerald-50 disabled:hover:shadow-none"
            >
              <Eye size={16} />
              PREVIEW PDF
            </button>
            <button
              type="button"
              onClick={() => downloadStudentReportPDF(buildReportPayload())}
              disabled={!reportStudentId}
              className="flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-xs font-black text-amber-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-100 hover:shadow-sm disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-amber-50 disabled:hover:shadow-none"
            >
              <Download size={16} />
              DOWNLOAD PDF
            </button>
          </div>

          {!reportStudentId ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm font-medium text-slate-500">
              Pilih santri terlebih dahulu untuk melihat raport.
            </div>
          ) : isReportLoading ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm font-bold text-slate-400">
              Memuat raport santri...
            </div>
          ) : (
            <div id="report-print-area" className="space-y-6 print:space-y-4">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white print:rounded-none print:border-slate-300">
                <div className="border-b-4 border-emerald-600 px-8 py-7 print:px-0">
                  <div className="text-center">
                    <p className="text-[11px] font-black uppercase tracking-[0.35em] text-emerald-700">e-Raport Santri</p>
                    <h4 className="mt-3 text-3xl font-black tracking-tight text-slate-900 print:text-2xl">Pondok Pesantren Darussunnah</h4>
                    <p className="mt-2 text-sm font-medium text-slate-500">Tahun Pelajaran {reportGrades[0]?.academic_year || '-'} - Semester {reportGrades[0]?.semester || '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 border-b border-slate-200 bg-slate-50 px-8 py-5 md:grid-cols-2 print:px-0">
                  <div className="space-y-2 text-sm">
                    <p><span className="font-black text-slate-700">Nama Santri:</span> <span className="font-semibold text-slate-600">{selectedReportStudent?.name || 'Santri'}</span></p>
                    <p><span className="font-black text-slate-700">Identitas:</span> <span className="font-semibold text-slate-600">{selectedReportStudent?.email || '-'}</span></p>
                  </div>
                  <div className="space-y-2 text-sm md:text-right">
                    <p><span className="font-black text-slate-700">Semester:</span> <span className="font-semibold text-slate-600">{reportGrades[0]?.semester || '-'}</span></p>
                    <p><span className="font-black text-slate-700">Tanggal Cetak:</span> <span className="font-semibold text-slate-600">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4 print:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 print:border-slate-300 print:bg-white">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rata-rata Nilai</p>
                  <p className="mt-2 text-3xl font-black text-emerald-600">{reportAverage}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 print:border-slate-300 print:bg-white">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hadir</p>
                  <p className="mt-2 text-3xl font-black text-emerald-600">{reportAttendanceSummary.hadir || 0}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 print:border-slate-300 print:bg-white">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Izin / Sakit</p>
                  <p className="mt-2 text-3xl font-black text-amber-600">{(reportAttendanceSummary.izin || 0) + (reportAttendanceSummary.sakit || 0)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 print:border-slate-300 print:bg-white">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alpha</p>
                  <p className="mt-2 text-3xl font-black text-rose-600">{reportAttendanceSummary.alpha || 0}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200 print:rounded-none print:border-slate-300">
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 text-sm font-black uppercase tracking-widest text-slate-500 print:border-slate-300 print:bg-white">
                  Nilai Akademik
                </div>
                <table className="w-full">
                  <thead className="bg-white text-[10px] uppercase tracking-widest text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-left">Mapel</th>
                      <th className="px-4 py-3 text-left">Semester</th>
                      <th className="px-4 py-3 text-left">Tahun</th>
                      <th className="px-4 py-3 text-left">Nilai Akhir</th>
                      <th className="px-4 py-3 text-left">Predikat</th>
                      <th className="px-4 py-3 text-left">Deskripsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white print:divide-slate-300">
                    {reportGrades.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-bold text-slate-800">{item.subject_name}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{item.semester}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{item.academic_year}</td>
                        <td className="px-4 py-3 font-black text-emerald-600">{item.final_score}</td>
                        <td className="px-4 py-3 font-black text-slate-800">{item.grade_letter} - {getLetterPredicate(item.grade_letter)}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{item.notes || 'Menunjukkan perkembangan belajar yang baik.'}</td>
                      </tr>
                    ))}
                    {reportGrades.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                          Belum ada nilai untuk santri ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200 print:rounded-none print:border-slate-300">
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 text-sm font-black uppercase tracking-widest text-slate-500 print:border-slate-300 print:bg-white">
                  Progres Tahfidz
                </div>
                <table className="w-full">
                  <thead className="bg-white text-[10px] uppercase tracking-widest text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-left">Surah</th>
                      <th className="px-4 py-3 text-left">Juz</th>
                      <th className="px-4 py-3 text-left">Ayat</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Evaluasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white print:divide-slate-300">
                    {reportTahfidz.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-bold text-slate-800">{item.surah_name}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{item.juz}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{item.start_ayat}-{item.end_ayat}</td>
                        <td className="px-4 py-3 text-sm font-black uppercase text-slate-700">{item.status}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{item.evaluation_date}</td>
                      </tr>
                    ))}
                    {reportTahfidz.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                          Belum ada progres tahfidz untuk santri ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 print:grid-cols-2">
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 print:rounded-none print:border-slate-300 print:bg-white">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Catatan Wali Kelas / Musyrif</p>
                  <div className="mt-4 min-h-[120px] rounded-lg border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-400 print:border-slate-300">
                    Secara umum santri menunjukkan perkembangan akademik dan adab yang baik. Area ini dapat digunakan untuk catatan evaluasi akhir, penguatan karakter, dan saran pembinaan.
                  </div>
                </div>
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 print:rounded-none print:border-slate-300 print:bg-white">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pengesahan</p>
                  <div className="mt-6 grid grid-cols-2 gap-6 text-center text-sm text-slate-500">
                    <div>
                      <p>Wali Kelas / Musyrif</p>
                      <div className="mt-16 border-b border-slate-300" />
                    </div>
                    <div>
                      <p>Pimpinan Pondok</p>
                      <div className="mt-16 border-b border-slate-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal open={recapOpen} title="Rekap Nilai Semester Aktif" onClose={() => setRecapOpen(false)}>
        <div className="space-y-6">
          <div className="flex flex-col gap-3 rounded-[1.5rem] border border-sky-100 bg-sky-50/70 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-600">Semester Aktif</p>
                <h4 className="mt-2 text-2xl font-black text-slate-900">{academicPeriodLabel}</h4>
              <p className="mt-1 text-sm font-medium text-slate-500">Ringkasan ini mengikuti filter nilai yang sedang aktif di halaman akademik.</p>
            </div>
            <button onClick={exportRecapExcel} className="flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white px-5 py-3 text-xs font-black text-sky-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-100 hover:shadow-sm">
              <FileSpreadsheet size={16} />
              EXPORT REKAP
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/80 p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700/80">Santri Terekap</p>
              <p className="mt-2 text-3xl font-black text-emerald-700">{recapCompletionStats.total}</p>
            </div>
            <div className="rounded-[1.5rem] border border-sky-100 bg-sky-50/80 p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-sky-700/80">Mapel Aktif</p>
              <p className="mt-2 text-3xl font-black text-sky-700">{recapSubjectColumns.length}</p>
            </div>
            <div className="rounded-[1.5rem] border border-violet-100 bg-violet-50/80 p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-violet-700/80">Ketuntasan</p>
              <p className="mt-2 text-3xl font-black text-violet-700">{recapCompletionStats.completed}</p>
            </div>
            <div className="rounded-[1.5rem] border border-rose-100 bg-rose-50/80 p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-700/80">Perlu Pendampingan</p>
              <p className="mt-2 text-3xl font-black text-rose-700">{recapCompletionStats.pending}</p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h5 className="text-sm font-black uppercase tracking-widest text-slate-500">Rata-rata per Mata Pelajaran</h5>
            </div>
            <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
              {recapSubjectAverages.map((subject) => (
                <div key={subject.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-800">{subject.name}</p>
                  <p className="mt-2 text-2xl font-black text-emerald-600">{subject.average.toFixed(1)}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{subject.totalStudents} santri masuk rekap</p>
                </div>
              ))}
              {recapSubjectAverages.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Belum ada data nilai untuk disusun menjadi rekap.
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h5 className="text-sm font-black uppercase tracking-widest text-slate-500">Peringkat Santri</h5>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-center">Rank</th>
                    <th className="px-4 py-3">Santri</th>
                    {recapSubjectColumns.map((subject) => <th key={subject.id} className="px-4 py-3 text-center">{subject.name}</th>)}
                    <th className="px-4 py-3 text-center">Rata-rata</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentRecaps.map((item) => (
                    <tr key={item.studentId}>
                      <td className="px-4 py-4 text-center font-black text-emerald-700">{item.rank}</td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-800">{item.studentName}</p>
                        <p className="text-xs font-medium text-slate-500">{item.subjectCount} mapel terekap</p>
                      </td>
                      {recapSubjectColumns.map((subject) => (
                        <td key={subject.id} className="px-4 py-4 text-center font-semibold text-slate-600">{item.subjectScores[subject.id] ?? '-'}</td>
                      ))}
                      <td className="px-4 py-4 text-center font-black text-slate-900">{item.average.toFixed(1)}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${item.average >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {studentRecaps.length === 0 && (
                    <tr>
                      <td colSpan={recapSubjectColumns.length + 4} className="px-4 py-10 text-center text-sm text-slate-500">
                        Belum ada data nilai untuk semester dan tahun ajaran ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={bulkReportOpen} title="Cetak Raport Massal" onClose={() => setBulkReportOpen(false)}>
        <div className="space-y-6">
          <div className="flex flex-col gap-3 rounded-[1.5rem] border border-amber-100 bg-amber-50/70 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-700">Cetak Raport</p>
                <h4 className="mt-2 text-2xl font-black text-slate-900">{academicPeriodLabel}</h4>
              <p className="mt-1 text-sm font-medium text-slate-500">Pilih santri yang ingin dimasukkan ke file raport massal. Alur ini mengikuti filter nilai yang aktif sekarang.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setSelectedBulkStudentIds(studentRecaps.map((item) => String(item.studentId)))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm">Pilih Semua</button>
              <button type="button" onClick={() => setSelectedBulkStudentIds([])} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm">Kosongkan</button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50/80 p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700/80">Dipilih</p>
              <p className="mt-2 text-3xl font-black text-amber-700">{selectedBulkStudentIds.length}</p>
            </div>
            <div className="rounded-[1.5rem] border border-sky-100 bg-sky-50/80 p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-sky-700/80">Total Tersedia</p>
              <p className="mt-2 text-3xl font-black text-sky-700">{studentRecaps.length}</p>
            </div>
            <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/80 p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700/80">Status</p>
              <p className="mt-2 text-sm font-black uppercase tracking-widest text-emerald-700">{selectedBulkStudentIds.length ? 'Siap Diproses' : 'Belum Ada Pilihan'}</p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h5 className="text-sm font-black uppercase tracking-widest text-slate-500">Daftar Santri</h5>
            </div>
            <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
              {studentRecaps.map((item) => {
                const checked = selectedBulkStudentIds.includes(String(item.studentId));
                return (
                  <label key={item.studentId} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${checked ? 'border-emerald-200 bg-emerald-50/80' : 'border-slate-200 bg-slate-50'}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleBulkStudent(String(item.studentId))}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="min-w-0">
                      <p className="font-black text-slate-800">{item.studentName}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">Rata-rata {item.average.toFixed(1)} · Rank {item.rank}</p>
                      <p className="mt-2 text-xs text-slate-500">{getAchievementNote(item.average)}</p>
                    </div>
                  </label>
                );
              })}
              {studentRecaps.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 md:col-span-2">
                  Belum ada santri yang bisa diproses untuk raport massal pada filter ini.
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <button
              type="button"
              onClick={handlePreviewBulkReports}
              disabled={!selectedBulkStudentIds.length || isBulkGenerating}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-xs font-black text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-sm disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-emerald-50 disabled:hover:shadow-none"
            >
              {isBulkGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Eye size={16} />}
              PREVIEW RAPORT MASSAL
            </button>
            <button
              type="button"
              onClick={handleDownloadBulkReports}
              disabled={!selectedBulkStudentIds.length || isBulkGenerating}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-xs font-black text-amber-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-100 hover:shadow-sm disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-amber-50 disabled:hover:shadow-none"
            >
              {isBulkGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
              DOWNLOAD RAPORT MASSAL
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={deleteState.id !== null} onClose={() => setDeleteState((p) => ({ ...p, id: null }))} onConfirm={confirmDelete} isLoading={isSaving} title="Hapus data?" message="Data yang dihapus tidak bisa dikembalikan lagi." confirmText="YA, HAPUS" />
    </div>
  );
}
