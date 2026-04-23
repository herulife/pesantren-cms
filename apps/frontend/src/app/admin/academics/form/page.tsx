'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import {
  CompactUser,
  Subject,
  createAttendance,
  createGrade,
  createTahfidz,
  getAcademicStudents,
  getAttendance,
  getGrades,
  getSubjects,
  getTahfidz,
  updateAttendance,
  updateGrade,
  updateTahfidz,
} from '@/lib/api';
import { ArrowLeft, BookOpen, Calendar, ClipboardList, Loader2, Pencil, Save, Users } from 'lucide-react';

type FormType = 'grade' | 'attendance' | 'tahfidz' | 'bulk-grade' | 'bulk-edit';

const gradeInit = { id: 0, student_id: '', subject_id: '', semester: 'Ganjil', academic_year: '2024/2025', uts_score: '', uas_score: '', task_score: '', notes: '' };
const attendanceInit = { id: 0, student_id: '', date: new Date().toISOString().split('T')[0], status: 'hadir', notes: '' };
const tahfidzInit = { id: 0, student_id: '', surah_name: '', juz: '', start_ayat: '', end_ayat: '', status: 'proses', musyrif_notes: '', evaluation_date: new Date().toISOString().split('T')[0] };

function titleByType(type: FormType, hasId: boolean) {
  if (type === 'grade') return hasId ? 'Edit Nilai Santri' : 'Tambah Nilai Santri';
  if (type === 'attendance') return hasId ? 'Edit Presensi Santri' : 'Tambah Presensi Santri';
  if (type === 'tahfidz') return hasId ? 'Edit Progres Tahfidz' : 'Tambah Progres Tahfidz';
  if (type === 'bulk-grade') return 'Input Nilai Massal';
  return 'Edit Nilai Massal';
}

function descriptionByType(type: FormType) {
  if (type === 'grade') return 'Isi nilai UTS, UAS, tugas, dan catatan santri dalam halaman penuh yang lebih lega.';
  if (type === 'attendance') return 'Kelola presensi santri tanpa popup agar input tanggal dan status lebih nyaman.';
  if (type === 'tahfidz') return 'Catat progres hafalan, juz, ayat, dan evaluasi tahfidz dalam form penuh.';
  if (type === 'bulk-grade') return 'Masukkan nilai banyak santri sekaligus seperti workflow eRapor, tanpa modal.';
  return 'Perbarui nilai banyak santri untuk satu mata pelajaran aktif dalam satu halaman.';
}

export default function AcademicsFormPage() {
  return (
    <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>}>
      <AcademicsFormContent />
    </Suspense>
  );
}

function AcademicsFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const type = (searchParams.get('type') || 'grade') as FormType;
  const id = searchParams.get('id');
  const selectedSemester = searchParams.get('semester') || 'Ganjil';
  const selectedYear = searchParams.get('year') || '2024/2025';
  const selectedDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [students, setStudents] = useState<CompactUser[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [gradeForm, setGradeForm] = useState({ ...gradeInit, semester: selectedSemester, academic_year: selectedYear });
  const [attendanceForm, setAttendanceForm] = useState({ ...attendanceInit, date: selectedDate });
  const [tahfidzForm, setTahfidzForm] = useState(tahfidzInit);
  const [bulkGradeMeta, setBulkGradeMeta] = useState({ subject_id: '', semester: selectedSemester, academic_year: selectedYear });
  const [bulkGradeRows, setBulkGradeRows] = useState<Array<{ student_id: string; student_name: string; uts_score: string; uas_score: string; task_score: string; notes: string }>>([]);
  const [bulkEditSubjectId, setBulkEditSubjectId] = useState(searchParams.get('subject_id') || '');
  const [bulkEditRows, setBulkEditRows] = useState<Array<{ id: number; student_id: string; student_name: string; uts_score: string; uas_score: string; task_score: string; notes: string }>>([]);

  const academicPeriodLabel = `${selectedSemester === 'Genap' ? 'Semester 2' : 'Semester 1'} - Tahun Ajaran ${selectedYear}`;

  useEffect(() => {
    const load = async () => {
      try {
        const [subjectData, studentData] = await Promise.all([getSubjects(), getAcademicStudents()]);
        setSubjects(subjectData);
        setStudents(studentData);

        if (type === 'grade' && id) {
          const allGrades = await getGrades(selectedSemester, selectedYear);
          const current = allGrades.find((item) => String(item.id) === id);
          if (!current) throw new Error('Data nilai tidak ditemukan.');
          setGradeForm({
            id: current.id,
            student_id: String(current.student_id),
            subject_id: String(current.subject_id),
            semester: current.semester,
            academic_year: current.academic_year,
            uts_score: String(current.uts_score),
            uas_score: String(current.uas_score),
            task_score: String(current.task_score),
            notes: current.notes || '',
          });
        }

        if (type === 'attendance' && id) {
          const allAttendance = await getAttendance(selectedDate);
          const current = allAttendance.find((item) => String(item.id) === id);
          if (!current) throw new Error('Data presensi tidak ditemukan.');
          setAttendanceForm({
            id: current.id,
            student_id: String(current.student_id),
            date: current.date,
            status: current.status,
            notes: current.notes || '',
          });
        }

        if (type === 'tahfidz' && id) {
          const allTahfidz = await getTahfidz();
          const current = allTahfidz.find((item) => String(item.id) === id);
          if (!current) throw new Error('Data tahfidz tidak ditemukan.');
          setTahfidzForm({
            id: current.id,
            student_id: String(current.student_id),
            surah_name: current.surah_name,
            juz: String(current.juz),
            start_ayat: String(current.start_ayat),
            end_ayat: String(current.end_ayat),
            status: current.status,
            musyrif_notes: current.musyrif_notes || '',
            evaluation_date: current.evaluation_date,
          });
        }

        if (type === 'bulk-grade') {
          setBulkGradeRows(studentData.map((student) => ({
            student_id: String(student.id),
            student_name: student.name,
            uts_score: '',
            uas_score: '',
            task_score: '',
            notes: '',
          })));
        }

        if (type === 'bulk-edit') {
          const allGrades = await getGrades(selectedSemester, selectedYear);
          const candidateSubjectId = searchParams.get('subject_id') || String(allGrades[0]?.subject_id || '');
          setBulkEditSubjectId(candidateSubjectId);
          setBulkEditRows(
            allGrades
              .filter((item) => String(item.subject_id) === candidateSubjectId)
              .map((item) => ({
                id: item.id,
                student_id: String(item.student_id),
                student_name: item.student_name || `Santri ${item.student_id}`,
                uts_score: String(item.uts_score),
                uas_score: String(item.uas_score),
                task_score: String(item.task_score),
                notes: item.notes || '',
              }))
              .sort((a, b) => a.student_name.localeCompare(b.student_name)),
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Form eRapor tidak dapat dimuat.';
        showToast('error', message);
        router.push('/admin/academics');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [id, router, searchParams, selectedDate, selectedSemester, selectedYear, showToast, type]);

  const selectedSubjectName = useMemo(
    () => subjects.find((subject) => String(subject.id) === bulkEditSubjectId)?.name || 'Belum dipilih',
    [bulkEditSubjectId, subjects],
  );
  const formStats = useMemo(() => {
    if (type === 'bulk-grade') {
      return [
        { label: 'Total Santri', value: String(students.length) },
        { label: 'Siap Diisi', value: String(bulkGradeRows.length) },
        { label: 'Periode', value: selectedSemester },
      ];
    }

    if (type === 'bulk-edit') {
      return [
        { label: 'Mapel Aktif', value: selectedSubjectName },
        { label: 'Baris Nilai', value: String(bulkEditRows.length) },
        { label: 'Periode', value: selectedSemester },
      ];
    }

    return [
      { label: 'Mode', value: id ? 'Edit Data' : 'Tambah Data' },
      { label: 'Periode', value: selectedSemester },
      { label: 'Tahun', value: selectedYear },
    ];
  }, [bulkEditRows.length, bulkGradeRows.length, id, selectedSemester, selectedSubjectName, selectedYear, students.length, type]);
  const controlClass = 'block w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all duration-200 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100';
  const textAreaClass = `${controlClass} min-h-[160px] resize-y leading-6 font-medium`;

  const updateBulkGradeRow = (studentId: string, field: 'uts_score' | 'uas_score' | 'task_score' | 'notes', value: string) => {
    setBulkGradeRows((prev) => prev.map((row) => row.student_id === studentId ? { ...row, [field]: value } : row));
  };

  const updateBulkEditRow = (gradeId: number, field: 'uts_score' | 'uas_score' | 'task_score' | 'notes', value: string) => {
    setBulkEditRows((prev) => prev.map((row) => row.id === gradeId ? { ...row, [field]: value } : row));
  };

  const handleBulkSubjectChange = async (subjectId: string) => {
    setBulkEditSubjectId(subjectId);
    const allGrades = await getGrades(selectedSemester, selectedYear);
    setBulkEditRows(
      allGrades
        .filter((item) => String(item.subject_id) === subjectId)
        .map((item) => ({
          id: item.id,
          student_id: String(item.student_id),
          student_name: item.student_name || `Santri ${item.student_id}`,
          uts_score: String(item.uts_score),
          uas_score: String(item.uas_score),
          task_score: String(item.task_score),
          notes: item.notes || '',
        }))
        .sort((a, b) => a.student_name.localeCompare(b.student_name)),
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      if (type === 'grade') {
        const payload = {
          student_id: Number(gradeForm.student_id),
          subject_id: Number(gradeForm.subject_id),
          semester: gradeForm.semester,
          academic_year: gradeForm.academic_year,
          uts_score: Number(gradeForm.uts_score),
          uas_score: Number(gradeForm.uas_score),
          task_score: Number(gradeForm.task_score),
          notes: gradeForm.notes,
        };
        if (gradeForm.id) await updateGrade(gradeForm.id, payload);
        else await createGrade(payload);
        showToast('success', gradeForm.id ? 'Nilai berhasil diperbarui.' : 'Nilai berhasil ditambahkan.');
      }

      if (type === 'attendance') {
        const payload = {
          student_id: Number(attendanceForm.student_id),
          date: attendanceForm.date,
          status: attendanceForm.status,
          notes: attendanceForm.notes,
        };
        if (attendanceForm.id) await updateAttendance(attendanceForm.id, payload);
        else await createAttendance(payload);
        showToast('success', attendanceForm.id ? 'Presensi berhasil diperbarui.' : 'Presensi berhasil ditambahkan.');
      }

      if (type === 'tahfidz') {
        const payload = {
          student_id: Number(tahfidzForm.student_id),
          surah_name: tahfidzForm.surah_name,
          juz: Number(tahfidzForm.juz),
          start_ayat: Number(tahfidzForm.start_ayat),
          end_ayat: Number(tahfidzForm.end_ayat),
          status: tahfidzForm.status,
          musyrif_notes: tahfidzForm.musyrif_notes,
          evaluation_date: tahfidzForm.evaluation_date,
        };
        if (tahfidzForm.id) await updateTahfidz(tahfidzForm.id, payload);
        else await createTahfidz(payload);
        showToast('success', tahfidzForm.id ? 'Tahfidz berhasil diperbarui.' : 'Tahfidz berhasil ditambahkan.');
      }

      if (type === 'bulk-grade') {
        if (!bulkGradeMeta.subject_id) throw new Error('Pilih mata pelajaran terlebih dahulu.');
        const rowsToSave = bulkGradeRows.filter((row) => row.uts_score || row.uas_score || row.task_score);
        if (!rowsToSave.length) throw new Error('Isi minimal satu nilai untuk diproses.');
        await Promise.all(rowsToSave.map((row) => createGrade({
          student_id: Number(row.student_id),
          subject_id: Number(bulkGradeMeta.subject_id),
          semester: bulkGradeMeta.semester,
          academic_year: bulkGradeMeta.academic_year,
          uts_score: Number(row.uts_score || 0),
          uas_score: Number(row.uas_score || 0),
          task_score: Number(row.task_score || 0),
          notes: row.notes,
        })));
        showToast('success', `${rowsToSave.length} nilai berhasil ditambahkan.`);
      }

      if (type === 'bulk-edit') {
        if (!bulkEditRows.length) throw new Error('Belum ada data nilai untuk mapel ini.');
        await Promise.all(bulkEditRows.map((row) => updateGrade(row.id, {
          uts_score: Number(row.uts_score || 0),
          uas_score: Number(row.uas_score || 0),
          task_score: Number(row.task_score || 0),
          notes: row.notes,
        })));
        showToast('success', `${bulkEditRows.length} nilai berhasil diperbarui.`);
      }

      router.push('/admin/academics');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Form eRapor gagal disimpan.';
      showToast('error', message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;
  }

  return (
    <div className="mx-auto max-w-6xl pb-16">
      <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_42%),linear-gradient(135deg,_#ffffff,_#f8fafc)] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => router.push('/admin/academics')}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-emerald-200 hover:text-emerald-600"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Form eRapor</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 font-outfit">{titleByType(type, Boolean(id))}</h1>
              <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">{descriptionByType(type)}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{academicPeriodLabel}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[360px]">
            {formStats.map((item) => (
              <div key={item.label} className="rounded-xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                <p className="mt-2 truncate text-sm font-black text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {(type === 'grade' || type === 'attendance' || type === 'tahfidz') && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-8 flex items-center gap-3">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                  {type === 'grade' ? <BookOpen size={20} /> : type === 'attendance' ? <Calendar size={20} /> : <ClipboardList size={20} />}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">{titleByType(type, Boolean(id))}</p>
                  <p className="text-xs font-medium text-slate-500">Silakan lengkapi data berikut dengan teliti.</p>
                </div>
              </div>

              {type === 'grade' && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Field label="Santri">
                    <select required value={gradeForm.student_id} onChange={(event) => setGradeForm((prev) => ({ ...prev, student_id: event.target.value }))} className={controlClass}>
                      <option value="">Pilih santri</option>
                      {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Mata Pelajaran">
                    <select required value={gradeForm.subject_id} onChange={(event) => setGradeForm((prev) => ({ ...prev, subject_id: event.target.value }))} className={controlClass}>
                      <option value="">Pilih mata pelajaran</option>
                      {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Semester">
                    <select value={gradeForm.semester} onChange={(event) => setGradeForm((prev) => ({ ...prev, semester: event.target.value }))} className={controlClass}>
                      <option value="Ganjil">Ganjil</option>
                      <option value="Genap">Genap</option>
                    </select>
                  </Field>
                  <Field label="Tahun Ajaran">
                    <input value={gradeForm.academic_year} onChange={(event) => setGradeForm((prev) => ({ ...prev, academic_year: event.target.value }))} className={controlClass} />
                  </Field>
                  <Field label="Nilai UTS">
                    <input required type="number" min="0" max="100" value={gradeForm.uts_score} onChange={(event) => setGradeForm((prev) => ({ ...prev, uts_score: event.target.value }))} className={controlClass} />
                  </Field>
                  <Field label="Nilai UAS">
                    <input required type="number" min="0" max="100" value={gradeForm.uas_score} onChange={(event) => setGradeForm((prev) => ({ ...prev, uas_score: event.target.value }))} className={controlClass} />
                  </Field>
                  <Field label="Nilai Tugas" className="md:col-span-2">
                    <input required type="number" min="0" max="100" value={gradeForm.task_score} onChange={(event) => setGradeForm((prev) => ({ ...prev, task_score: event.target.value }))} className={controlClass} />
                  </Field>
                  <Field label="Catatan" className="md:col-span-2">
                    <textarea rows={5} value={gradeForm.notes} onChange={(event) => setGradeForm((prev) => ({ ...prev, notes: event.target.value }))} className={textAreaClass} placeholder="Catatan guru, deskripsi capaian, atau arahan tindak lanjut..." />
                  </Field>
                </div>
              )}

              {type === 'attendance' && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Field label="Santri">
                    <select required value={attendanceForm.student_id} onChange={(event) => setAttendanceForm((prev) => ({ ...prev, student_id: event.target.value }))} className={controlClass}>
                      <option value="">Pilih santri</option>
                      {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Tanggal">
                    <input required type="date" value={attendanceForm.date} onChange={(event) => setAttendanceForm((prev) => ({ ...prev, date: event.target.value }))} className={controlClass} />
                  </Field>
                  <Field label="Status" className="md:col-span-2">
                    <select value={attendanceForm.status} onChange={(event) => setAttendanceForm((prev) => ({ ...prev, status: event.target.value }))} className={controlClass}>
                      <option value="hadir">Hadir</option>
                      <option value="izin">Izin</option>
                      <option value="sakit">Sakit</option>
                      <option value="alpha">Alpha</option>
                    </select>
                  </Field>
                  <Field label="Catatan" className="md:col-span-2">
                    <textarea rows={5} value={attendanceForm.notes} onChange={(event) => setAttendanceForm((prev) => ({ ...prev, notes: event.target.value }))} className={textAreaClass} placeholder="Catatan tambahan, alasan izin, atau keterangan musyrif..." />
                  </Field>
                </div>
              )}

              {type === 'tahfidz' && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Field label="Santri">
                    <select required value={tahfidzForm.student_id} onChange={(event) => setTahfidzForm((prev) => ({ ...prev, student_id: event.target.value }))} className={controlClass}>
                      <option value="">Pilih santri</option>
                      {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Nama Surah">
                    <input required value={tahfidzForm.surah_name} onChange={(event) => setTahfidzForm((prev) => ({ ...prev, surah_name: event.target.value }))} className={controlClass} placeholder="Contoh: Al-Baqarah" />
                  </Field>
                  <Field label="Juz">
                    <input required type="number" min="1" max="30" value={tahfidzForm.juz} onChange={(event) => setTahfidzForm((prev) => ({ ...prev, juz: event.target.value }))} className={controlClass} />
                  </Field>
                  <Field label="Tanggal Evaluasi">
                    <input required type="date" value={tahfidzForm.evaluation_date} onChange={(event) => setTahfidzForm((prev) => ({ ...prev, evaluation_date: event.target.value }))} className={controlClass} />
                  </Field>
                  <Field label="Ayat Mulai">
                    <input required type="number" min="1" value={tahfidzForm.start_ayat} onChange={(event) => setTahfidzForm((prev) => ({ ...prev, start_ayat: event.target.value }))} className={controlClass} />
                  </Field>
                  <Field label="Ayat Selesai">
                    <input required type="number" min="1" value={tahfidzForm.end_ayat} onChange={(event) => setTahfidzForm((prev) => ({ ...prev, end_ayat: event.target.value }))} className={controlClass} />
                  </Field>
                  <Field label="Status" className="md:col-span-2">
                    <select value={tahfidzForm.status} onChange={(event) => setTahfidzForm((prev) => ({ ...prev, status: event.target.value }))} className={controlClass}>
                      <option value="proses">Proses</option>
                      <option value="lulus">Lulus</option>
                      <option value="ulang">Ulang</option>
                    </select>
                  </Field>
                  <Field label="Catatan Musyrif" className="md:col-span-2">
                    <textarea rows={5} value={tahfidzForm.musyrif_notes} onChange={(event) => setTahfidzForm((prev) => ({ ...prev, musyrif_notes: event.target.value }))} className={textAreaClass} placeholder="Tulis catatan evaluasi, kualitas hafalan, atau arahan murojaah..." />
                  </Field>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Panduan Singkat</p>
                <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                  <p>Pastikan santri dan periode akademik sudah sesuai sebelum menyimpan.</p>
                  <p>Gunakan catatan untuk deskripsi capaian, tindak lanjut, atau evaluasi musyrif.</p>
                  <p>Setelah disimpan, data akan langsung kembali ke halaman utama `eRapor`.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700/80">Ringkasan Form</p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {formStats.map((item) => (
                    <div key={item.label} className="rounded-xl border border-emerald-100 bg-white/70 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700/70">{item.label}</p>
                      <p className="mt-2 text-sm font-black text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {type === 'bulk-grade' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-sky-50 p-3 text-sky-600">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">Metadata Input Massal</p>
                  <p className="text-xs font-medium text-slate-500">Tentukan mapel dan periode aktif sebelum mengisi nilai seluruh santri.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Field label="Mata Pelajaran">
                  <select required value={bulkGradeMeta.subject_id} onChange={(event) => setBulkGradeMeta((prev) => ({ ...prev, subject_id: event.target.value }))} className={controlClass}>
                    <option value="">Pilih mata pelajaran</option>
                    {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                  </select>
                </Field>
                <Field label="Semester">
                  <select value={bulkGradeMeta.semester} onChange={(event) => setBulkGradeMeta((prev) => ({ ...prev, semester: event.target.value }))} className={controlClass}>
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </Field>
                <Field label="Tahun Ajaran">
                  <input value={bulkGradeMeta.academic_year} onChange={(event) => setBulkGradeMeta((prev) => ({ ...prev, academic_year: event.target.value }))} className={controlClass} />
                </Field>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <p className="text-sm font-black text-slate-900">Daftar Nilai Santri</p>
                <p className="text-xs font-medium text-slate-500">Kosongkan baris yang belum ingin diproses.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[860px] w-full text-sm">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-left">Santri</th>
                      <th className="px-4 py-3 text-center">UTS</th>
                      <th className="px-4 py-3 text-center">UAS</th>
                      <th className="px-4 py-3 text-center">Tugas</th>
                      <th className="px-4 py-3 text-left">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bulkGradeRows.map((row) => (
                      <tr key={row.student_id}>
                        <td className="px-4 py-4 font-bold text-slate-800">{row.student_name}</td>
                        <td className="px-4 py-4"><input type="number" min="0" max="100" value={row.uts_score} onChange={(event) => updateBulkGradeRow(row.student_id, 'uts_score', event.target.value)} className={`${controlClass} min-w-[110px]`} /></td>
                        <td className="px-4 py-4"><input type="number" min="0" max="100" value={row.uas_score} onChange={(event) => updateBulkGradeRow(row.student_id, 'uas_score', event.target.value)} className={`${controlClass} min-w-[110px]`} /></td>
                        <td className="px-4 py-4"><input type="number" min="0" max="100" value={row.task_score} onChange={(event) => updateBulkGradeRow(row.student_id, 'task_score', event.target.value)} className={`${controlClass} min-w-[110px]`} /></td>
                        <td className="px-4 py-4"><input value={row.notes} onChange={(event) => updateBulkGradeRow(row.student_id, 'notes', event.target.value)} className={`${controlClass} min-w-[220px]`} placeholder="Catatan singkat..." /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {type === 'bulk-edit' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                  <Pencil size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">Pilih Mata Pelajaran</p>
                  <p className="text-xs font-medium text-slate-500">Semua nilai pada mapel aktif akan tampil di bawah untuk diedit sekaligus.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.2fr_1fr]">
                <Field label="Mata Pelajaran Aktif">
                  <select value={bulkEditSubjectId} onChange={(event) => void handleBulkSubjectChange(event.target.value)} className={controlClass}>
                    <option value="">Pilih mata pelajaran</option>
                    {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                  </select>
                </Field>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mapel Dipilih</p>
                  <p className="mt-2 text-lg font-black text-slate-900">{selectedSubjectName}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{academicPeriodLabel}</p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <p className="text-sm font-black text-slate-900">Daftar Nilai Mapel Aktif</p>
                <p className="text-xs font-medium text-slate-500">Perubahan akan disimpan serentak saat kamu klik tombol simpan.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[860px] w-full text-sm">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-left">Santri</th>
                      <th className="px-4 py-3 text-center">UTS</th>
                      <th className="px-4 py-3 text-center">UAS</th>
                      <th className="px-4 py-3 text-center">Tugas</th>
                      <th className="px-4 py-3 text-left">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bulkEditRows.map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-4 font-bold text-slate-800">{row.student_name}</td>
                        <td className="px-4 py-4"><input type="number" min="0" max="100" value={row.uts_score} onChange={(event) => updateBulkEditRow(row.id, 'uts_score', event.target.value)} className={`${controlClass} min-w-[110px]`} /></td>
                        <td className="px-4 py-4"><input type="number" min="0" max="100" value={row.uas_score} onChange={(event) => updateBulkEditRow(row.id, 'uas_score', event.target.value)} className={`${controlClass} min-w-[110px]`} /></td>
                        <td className="px-4 py-4"><input type="number" min="0" max="100" value={row.task_score} onChange={(event) => updateBulkEditRow(row.id, 'task_score', event.target.value)} className={`${controlClass} min-w-[110px]`} /></td>
                        <td className="px-4 py-4"><input value={row.notes} onChange={(event) => updateBulkEditRow(row.id, 'notes', event.target.value)} className={`${controlClass} min-w-[220px]`} placeholder="Catatan singkat..." /></td>
                      </tr>
                    ))}
                    {bulkEditRows.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                          Belum ada data nilai untuk mata pelajaran ini pada periode aktif.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="sticky bottom-4 z-10 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => router.push('/admin/academics')}
            className="rounded-lg border border-slate-200 bg-white px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-3 rounded-lg bg-slate-900 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {type === 'bulk-grade' ? 'Simpan Nilai Massal' : type === 'bulk-edit' ? 'Simpan Edit Massal' : 'Simpan Form'}
          </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</label>
      {children}
    </div>
  );
}
