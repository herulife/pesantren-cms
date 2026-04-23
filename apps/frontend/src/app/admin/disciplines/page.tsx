'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/Toast';
import {
  CreateViolationPayload,
  StudentDisciplinePoint,
  ViolationLog,
  createViolation,
  getDisciplinePoints,
  getSettings,
  getViolationLogs,
} from '@/lib/api';
import { AlertTriangle, ClipboardList, FileWarning, MessageCircle, MessageSquare, Phone, Plus, RefreshCw, Search, Shield, ShieldAlert, ShieldCheck, Users, X } from 'lucide-react';

const VIOLATION_CATEGORIES = [
  { value: 'Aqidah', label: 'Aqidah' },
  { value: 'Ibadah', label: 'Ibadah' },
  { value: 'Akhlaq - Berpakaian', label: 'Akhlaq — Berpakaian' },
  { value: 'Akhlaq - Makan Minum', label: 'Akhlaq — Makan Minum' },
  { value: 'Akhlaq - Tidur', label: 'Akhlaq — Tidur' },
  { value: 'Akhlaq - Berbicara', label: 'Akhlaq — Berbicara' },
  { value: 'Akhlaq - Bergaul', label: 'Akhlaq — Bergaul' },
  { value: 'Akhlaq - Kunjungan Orang Tua', label: 'Akhlaq — Kunjungan Orang Tua' },
  { value: 'Akhlaq - Keluar Komplek', label: 'Akhlaq — Keluar Komplek' },
  { value: 'Halaqah Quran & Mapel', label: 'Halaqah Qur\'an & Mapel' },
  { value: 'Kebersihan & Keindahan', label: 'Kebersihan & Keindahan' },
  { value: 'Olahraga & Kesehatan', label: 'Olahraga & Kesehatan' },
  { value: 'Keamanan', label: 'Keamanan' },
  { value: 'Pinjam Meminjam', label: 'Pinjam Meminjam' },
  { value: 'Menelepon', label: 'Menelepon' },
  { value: 'Pencurian', label: 'Pencurian' },
  { value: 'Keorganisasian', label: 'Keorganisasian' },
];

type TabKey = 'overview' | 'logs';

function getSanctionLevel(points: number) {
  if (points <= 1) return { label: 'SP 3 — Dikembalikan', color: 'text-rose-700', bg: 'bg-rose-100', border: 'border-rose-200' };
  if (points <= 25) return { label: 'SP 2 & Skorsing', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' };
  if (points <= 55) return { label: 'SP 1', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
  if (points <= 75) return { label: 'Pemanggilan Ortu', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
  if (points <= 85) return { label: 'Teguran & Pembinaan', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
  return { label: 'Aman', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
}

function getPointsColor(points: number) {
  if (points <= 25) return 'text-rose-600';
  if (points <= 55) return 'text-orange-600';
  if (points <= 75) return 'text-amber-600';
  if (points <= 85) return 'text-yellow-700';
  return 'text-emerald-600';
}

function getPointsBarColor(points: number) {
  if (points <= 25) return 'bg-gradient-to-r from-rose-500 to-rose-400';
  if (points <= 55) return 'bg-gradient-to-r from-orange-500 to-orange-400';
  if (points <= 75) return 'bg-gradient-to-r from-amber-500 to-amber-400';
  if (points <= 85) return 'bg-gradient-to-r from-yellow-500 to-yellow-400';
  return 'bg-gradient-to-r from-emerald-500 to-emerald-400';
}

function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-xl font-black text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"><X size={16} /></button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

const formInit: CreateViolationPayload = {
  student_id: 0,
  reporter_name: '',
  violation_category: '',
  violation_detail: '',
  points_deducted: 10,
  action_taken: '',
};

export default function DisciplinesPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [points, setPoints] = useState<StudentDisciplinePoint[]>([]);
  const [violationLogs, setViolationLogs] = useState<ViolationLog[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CreateViolationPayload>(formInit);
  const [templates, setTemplates] = useState<Record<string, string>>({});

  const loadTemplates = async () => {
    try {
      const sData = await getSettings();
      const mapped: Record<string, string> = {};
      sData.forEach(s => { mapped[s.key] = s.value; });
      setTemplates(mapped);
    } catch (e) {
      console.error('Failed to load WA templates', e);
    }
  };

  const loadPoints = async () => {
    setIsLoading(true);
    try {
      const result = await getDisciplinePoints({ limit: 200 });
      setPoints(result.data);
    } catch {
      showToast('error', 'Gagal memuat data poin santri.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const result = await getViolationLogs({ limit: 200 });
      setViolationLogs(result.data);
    } catch {
      showToast('error', 'Gagal memuat riwayat pelanggaran.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') loadPoints();
    if (activeTab === 'logs') loadLogs();
    loadTemplates();
  }, [activeTab]);

  const filteredPoints = useMemo(
    () => points.filter((p) => (p.student_name || '').toLowerCase().includes(searchQuery.toLowerCase())),
    [points, searchQuery]
  );

  const filteredLogs = useMemo(
    () => violationLogs.filter((l) =>
      (l.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.violation_category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.reporter_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [violationLogs, searchQuery]
  );

  const stats = useMemo(() => {
    const total = points.length;
    const safe = points.filter((p) => p.current_points > 85).length;
    const warning = points.filter((p) => p.current_points > 55 && p.current_points <= 85).length;
    const danger = points.filter((p) => p.current_points <= 55).length;
    return { total, safe, warning, danger };
  }, [points]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id || !form.reporter_name || !form.violation_category || !form.points_deducted) {
      showToast('error', 'Mohon lengkapi semua kolom wajib.');
      return;
    }
    setIsSaving(true);
    try {
      await createViolation(form);
      showToast('success', 'Pelanggaran berhasil dicatat dan poin dikurangi.');
      setForm(formInit);
      setModalOpen(false);
      loadPoints();
      loadLogs();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal mencatat pelanggaran.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendWA = (log: ViolationLog) => {
    if (!log.parent_phone) {
      showToast('error', 'Nomor HP orang tua tidak ditemukan di data pendaftaran.');
      return;
    }

    const customTemplate = templates['wa_discipline_violation_template'];
    let message = "";

    if (customTemplate) {
      message = customTemplate
        .replace(/{{nama}}/g, `*${log.student_name}*`)
        .replace(/{{kategori}}/g, `*${log.violation_category}*`)
        .replace(/{{detail}}/g, log.violation_detail || '-')
        .replace(/{{poin}}/g, `*${log.points_deducted}*`)
        .replace(/{{sanksi}}/g, log.action_taken || '-');
    } else {
      message = `Assalamualaikum Warahmatullah.
Menginformasikan catatan kedisiplinan santri atas nama: *${log.student_name}*
Pelanggaran: *${log.violation_category}*
Detail: ${log.violation_detail || '-'}
Poin Berkurang: *-${log.points_deducted}*
Tindakan: ${log.action_taken || '-'}

Mohon kerja samanya untuk pembinaan santri yang lebih baik. Syukran.`;
    }

    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${log.parent_phone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    window.open(waUrl, '_blank');
  };

  const handleSendWARekap = (p: StudentDisciplinePoint) => {
    if (!p.parent_phone) {
      showToast('error', 'Nomor HP orang tua tidak ditemukan di data pendaftaran.');
      return;
    }

    const customTemplate = templates['wa_discipline_summary_template'];
    let message = "";

    if (customTemplate) {
      message = customTemplate
        .replace(/{{nama}}/g, `*${p.student_name}*`)
        .replace(/{{sisa}}/g, `*${p.current_points}*`)
        .replace(/{{status}}/g, `*${getSanctionLevel(p.current_points).label}*`);
    } else {
      message = `Assalamualaikum Warahmatullah.
Menginformasikan rekapitulasi poin kedisiplinan santri atas nama: *${p.student_name}*
Sisa Poin Saat Ini: *${p.current_points}*
Status: *${getSanctionLevel(p.current_points).label}*

Mohon pantau terus perkembangan kedisiplinan santri. Syukran.`;
    }

    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${p.parent_phone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="pb-10 font-outfit">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-600">Manajemen Kedisiplinan</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-800">Kedisiplinan Santri</h2>
          <p className="mt-1 text-sm text-slate-500">Pantau sisa poin dan catat pelanggaran santri berdasarkan tata tertib pesantren.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-xl"
        >
          <Plus size={16} /> Catat Pelanggaran
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-3">
        {[
          { id: 'overview', label: 'Rekapitulasi Poin', icon: Shield },
          { id: 'logs', label: 'Riwayat Pelanggaran', icon: ClipboardList },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabKey)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-rose-600 text-white shadow-md' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[280px] flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari santri, kategori, atau pelapor..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-200 transition-all"
            />
          </div>
          <button onClick={() => { loadPoints(); loadLogs(); }} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
            <RefreshCw size={16} /> Muat Ulang
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {activeTab === 'overview' && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Santri Terpantau', value: stats.total, icon: Users, tone: 'border-slate-100 bg-slate-50 text-slate-700', iconTone: 'bg-slate-100 text-slate-600' },
            { label: 'Aman (> 85 Poin)', value: stats.safe, icon: ShieldCheck, tone: 'border-emerald-100 bg-emerald-50 text-emerald-700', iconTone: 'bg-emerald-100 text-emerald-600' },
            { label: 'Perlu Perhatian (56-85)', value: stats.warning, icon: ShieldAlert, tone: 'border-amber-100 bg-amber-50 text-amber-700', iconTone: 'bg-amber-100 text-amber-600' },
            { label: 'Kritis (≤ 55 Poin)', value: stats.danger, icon: AlertTriangle, tone: 'border-rose-100 bg-rose-50 text-rose-700', iconTone: 'bg-rose-100 text-rose-600' },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl border p-5 shadow-sm ${stat.tone}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-70">{stat.label}</p>
                  <p className="mt-2 text-3xl font-black">{stat.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${stat.iconTone}`}>
                  <stat.icon size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overview Table */}
      {activeTab === 'overview' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="py-24 text-center text-sm font-bold text-slate-400">Memuat data poin santri...</div>
          ) : filteredPoints.length === 0 ? (
            <div className="flex flex-col items-center py-24 text-slate-400">
              <FileWarning size={48} strokeWidth={1.5} />
              <p className="mt-4 text-sm font-bold">Belum ada data poin kedisiplinan.</p>
              <p className="mt-1 text-xs text-slate-400">Data akan muncul setelah Anda mencatat pelanggaran pertama.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Santri</th>
                    <th className="px-4 py-4">Tahun Ajaran</th>
                    <th className="px-4 py-4">Sisa Poin</th>
                    <th className="px-4 py-4">Indikator</th>
                    <th className="px-4 py-4">Status Sanksi</th>
                    <th className="px-4 py-4">Terakhir Diperbarui</th>
                    <th className="px-4 py-4 text-center">Kontak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPoints.map((p) => {
                    const sanction = getSanctionLevel(p.current_points);
                    return (
                      <tr key={p.id} className="transition-colors hover:bg-slate-50/80">
                        <td className="px-6 py-4 font-bold text-slate-800">{p.student_name}</td>
                        <td className="px-4 py-4 text-sm text-slate-500">{p.academic_year}</td>
                        <td className={`px-4 py-4 text-2xl font-black ${getPointsColor(p.current_points)}`}>
                          {p.current_points}
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-3 w-28 rounded-full bg-slate-100">
                            <div
                              className={`h-3 rounded-full transition-all duration-500 ${getPointsBarColor(p.current_points)}`}
                              style={{ width: `${Math.max(4, p.current_points)}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-bold ${sanction.bg} ${sanction.color} ${sanction.border} border`}>
                            {sanction.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-400">
                          {p.updated_at ? new Date(p.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button 
                            onClick={() => handleSendWARekap(p)}
                            className={`p-2 rounded-lg transition-all ${p.parent_phone ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-300 cursor-not-allowed'}`}
                            title={p.parent_phone ? 'Kirim Rekap WA ke Ortu' : 'Nomor WA Ortu Tidak Ada'}
                          >
                            <MessageCircle size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Violation Logs Table */}
      {activeTab === 'logs' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="py-24 text-center text-sm font-bold text-slate-400">Memuat riwayat pelanggaran...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center py-24 text-slate-400">
              <FileWarning size={48} strokeWidth={1.5} />
              <p className="mt-4 text-sm font-bold">Belum ada riwayat pelanggaran.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Santri</th>
                    <th className="px-4 py-4">Kategori</th>
                    <th className="px-4 py-4">Detail Pelanggaran</th>
                    <th className="px-4 py-4">Poin</th>
                    <th className="px-4 py-4">Sanksi</th>
                    <th className="px-4 py-4">Pelapor</th>
                    <th className="px-4 py-4">Tanggal</th>
                    <th className="px-4 py-4 text-center">Notifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-6 py-4 font-bold text-slate-800">{log.student_name}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600">
                          {log.violation_category}
                        </span>
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-4 text-sm text-slate-600">{log.violation_detail || '-'}</td>
                      <td className="px-4 py-4 text-lg font-black text-rose-600">-{log.points_deducted}</td>
                      <td className="px-4 py-4 text-sm text-slate-500">{log.action_taken || '-'}</td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-700">{log.reporter_name}</td>
                      <td className="px-4 py-4 text-xs text-slate-400">
                        {log.created_at ? new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button 
                          onClick={() => handleSendWA(log)}
                          className={`p-2 rounded-lg transition-all ${log.parent_phone ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-300 cursor-not-allowed'}`}
                          title={log.parent_phone ? 'Kirim Notifikasi WA ke Ortu' : 'Nomor WA Ortu Tidak Ada'}
                        >
                          <MessageSquare size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Violation Modal */}
      <Modal open={modalOpen} title="Catat Pelanggaran Baru" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-500">ID Santri *</label>
            <input
              type="number"
              required
              min={1}
              value={form.student_id || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, student_id: Number(e.target.value) }))}
              placeholder="Masukkan ID santri"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-200 transition-all"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-500">Kategori Pelanggaran *</label>
            <select
              required
              value={form.violation_category}
              onChange={(e) => setForm((prev) => ({ ...prev, violation_category: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-200 transition-all"
            >
              <option value="">Pilih Kategori Pelanggaran</option>
              {VIOLATION_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-500">Detail Pelanggaran</label>
            <textarea
              value={form.violation_detail}
              onChange={(e) => setForm((prev) => ({ ...prev, violation_detail: e.target.value }))}
              placeholder="Deskripsi pelanggaran yang dilakukan..."
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-200 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-500">Pengurangan Poin *</label>
              <input
                type="number"
                required
                min={1}
                max={100}
                value={form.points_deducted}
                onChange={(e) => setForm((prev) => ({ ...prev, points_deducted: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-200 transition-all"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-500">Nama Pelapor *</label>
              <input
                type="text"
                required
                value={form.reporter_name}
                onChange={(e) => setForm((prev) => ({ ...prev, reporter_name: e.target.value }))}
                placeholder="Nama ustadz/musyrif"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-200 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-500">Tindakan / Sanksi</label>
            <input
              type="text"
              value={form.action_taken || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, action_taken: e.target.value }))}
              placeholder="Contoh: Push up 20x, Teguran lisan, dll."
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-200 transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-700 disabled:opacity-50"
            >
              {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
              Simpan Pelanggaran
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
