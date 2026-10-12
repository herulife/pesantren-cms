'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { currentSemester } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toast';
import {
	CompactUser,
	ComputedRaport,
	KesantrianAspect,
	getAcademicStudents,
	getActiveAcademicYear,
	getAcademicYears,
	AcademicYear,
	calculateRaport,
	getRaportScores,
	listStoredRaports,
	saveRaport,
	getKesantrianAspects,
	setKesantrianAspect,
	getSubProjects,
	getActivities,
	listProjectAssessments,
	setProjectAssessment,
	ProjectActivity,
} from '@/lib/api';
import { exportERaportPDF } from '@/lib/export';
import {
	BookOpen, CheckCircle2, ClipboardList, Download, GraduationCap, HeartHandshake, Info, Layers, Printer, RefreshCw, Save, Search, X,
} from 'lucide-react';

type TabKey = 'rekapitulasi' | 'project' | 'kesantrian';

const ASPEK_OPTS = [
	{ key: 'disiplin', label: 'Disiplin' },
	{ key: 'ibadah', label: 'Ibadah' },
	{ key: 'kemandirian', label: 'Kemandirian' },
	{ key: 'adab', label: 'Adab' },
];

function predikatColor(p: string) {
	if (p === 'Sangat Baik') return 'bg-sky-50 text-sky-700 ring-sky-200';
	if (p === 'Baik') return 'bg-sky-50 text-sky-700 ring-sky-200';
	if (p === 'Cukup') return 'bg-amber-50 text-amber-700 ring-amber-200';
	return 'bg-rose-50 text-rose-700 ring-rose-200';
}

function GradePill({ label, value, sub }: { label: string; value: number | null; sub?: string }) {
	return (
		<div className="rounded-2xl border border-slate-100 bg-white p-4">
			<p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
			<p className="mt-1 text-2xl font-black text-slate-900">{value === null ? '\u2013' : value.toFixed(2)}</p>
			{sub && <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{sub}</p>}
		</div>
	);
}

function isMissing(raport: { is_complete?: boolean; missing?: string[] } | null, key: string): boolean {
	if (!raport) return true;
	if (raport.is_complete) return false;
	return (raport.missing || []).some(m => m.toLowerCase().includes(key));
}

export default function ERaportPage() {
	const { showToast } = useToast();
	const [tab, setTab] = useState<TabKey>('rekapitulasi');
	const { user: authUser } = useAuth();
	const canSeeTab = (t: TabKey) => {
		const r = authUser?.role;
		if (!r || r === 'superadmin' || r === 'admin') return true;
		if (r === 'ustadz') return t === 'kesantrian';
		if (r === 'pimpinan') return t === 'rekapitulasi';
		return true;
	};
	const showLock = authUser?.role !== 'pimpinan';
	useEffect(() => {
		if (authUser?.role === 'ustadz') setTab('kesantrian');
	}, [authUser?.role]);
	const [students, setStudents] = useState<CompactUser[]>([]);
	const [selected, setSelected] = useState<number>(0);
	const [raport, setRaport] = useState<ComputedRaport | null>(null);
	const [loading, setLoading] = useState(false);
	const [semester, setSemester] = useState('1');
	const [year, setYear] = useState('');
	const [years, setYears] = useState<AcademicYear[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [stored, setStored] = useState<Map<number, { score: number; predikat: string }>>(new Map());
	const [activities, setActivities] = useState<ProjectActivity[]>([]);
	const [projScores, setProjScores] = useState<Record<number, string>>({});
	const [projSaving, setProjSaving] = useState<Record<number, boolean>>({});
	const [kesValues, setKesValues] = useState<Record<string, string>>({});
	const [kesSaved, setKesSaved] = useState<Record<string, boolean>>({});
	const [subProjects, setSubProjects] = useState<{ id: number; name: string; weight: number }[]>([]);
	const [showFormula, setShowFormula] = useState(false);

	useEffect(() => {
		if (!showFormula) return;
		const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowFormula(false); };
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [showFormula]);

	useEffect(() => {
		(async () => {
			const [active, list] = await Promise.all([getActiveAcademicYear(), getAcademicYears()]);
			setYear(active);
			setYears(list);
			setSemester(currentSemester());
		})();
	}, []);

	const loadStudents = useCallback(async () => {
		const s = await getAcademicStudents();
		setStudents(s);
		if (s.length > 0 && !selected) {
			setSelected(s[0].id);
		}
	}, [selected]);

	const loadRaport = useCallback(async (sid: number) => {
		setLoading(true);
		const r = await calculateRaport({ student_id: sid, semester, academic_year: year });
		setRaport(r);
		setLoading(false);
	}, [semester, year]);

	const loadProjectScores = useCallback(async (sid: number) => {
		const m = await listProjectAssessments(sid, semester, year);
		const rec: Record<string, string> = {};
		Object.entries(m).forEach(([aid, sc]) => { rec[aid] = String(sc); });
		setProjScores(rec);
	}, [semester, year]);

	const handleProjectSave = async (activityId: number) => {
		const val = Number(projScores[activityId]);
		if (!selected || isNaN(val) || val < 1 || val > 4) { showToast('error', 'Nilai project harus 1-4'); return; }
		const ok = await setProjectAssessment({ student_id: selected, activity_id: activityId, semester, academic_year: year, score: val });
		if (ok) { showToast('success', 'Nilai project tersimpan'); loadRaport(selected); loadProjectScores(selected); }
		else showToast('error', 'Gagal simpan nilai project');
	};

	const loadKes = useCallback(async (sid: number) => {
		const list = await getKesantrianAspects(sid, semester, year);
		const m: Record<string, string> = {};
		list.forEach(k => { m[k.aspek] = String(k.score); });
		setKesValues(m);
	}, [semester, year]);

	const loadSubProjects = useCallback(async () => {
		const teacher = await getSubProjects();
		const sp: { id: number; name: string; weight: number }[] = [];
		teacher.forEach(t => sp.push({ id: t.id, name: t.name, weight: t.weight }));
		setSubProjects(sp);
		const acts = await getActivities();
		setActivities(acts.filter(a => a.is_active));
	}, []);

	const loadAll = useCallback(async () => {
		loadStudents();
		loadSubProjects();
		if (selected) {
			loadRaport(selected);
			loadKes(selected);
			loadProjectScores(selected);
		}
		const storedList = await listStoredRaports(year, semester);
		const m = new Map<number, { score: number; predikat: string }>();
		storedList.forEach(r => m.set(r.student_id, { score: r.final_score, predikat: r.predikat }));
		setStored(m);
	}, [loadStudents, loadSubProjects, loadRaport, loadKes, loadProjectScores, selected, semester, year]);

	// eslint-disable-next-line react-hooks/set-state-in-effect -- fetch awal saat mount
	useEffect(() => { loadAll(); }, [loadAll]);

	useEffect(() => {
		if (selected) {
			// eslint-disable-next-line react-hooks/set-state-in-effect -- refetch saat santri dipilih
			loadRaport(selected);
			loadKes(selected);
		}
	}, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

	const filteredStudents = useMemo(() => {
		const q = searchQuery.toLowerCase();
		return students.filter(s => (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q));
	}, [students, searchQuery]);

	const pickStudent = async (id: number) => {
		setSelected(id);
		await loadRaport(id);
		await loadKes(id);
		await loadProjectScores(id);
	};

	const handleKesantrianSave = async (aspek: string) => {
		const val = Number(kesValues[aspek]);
		if (!selected || isNaN(val) || val < 1 || val > 4) { showToast('error', 'Nilai aspek harus 1-4'); return; }
		const ok = await setKesantrianAspect({ student_id: selected, aspek, semester, academic_year: year, score: val });
		if (ok) { showToast('success', `${ASPEK_OPTS.find(a => a.key === aspek)?.label} tersimpan`); setKesSaved(prev => ({ ...prev, [aspek]: true })); loadRaport(selected); }
		else showToast('error', 'Gagal simpan aspek');
	};

	const handleLockRaport = async () => {
		if (!raport) return;
		const res = await saveRaport({
			student_id: raport.student_id,
			semester: raport.semester,
			academic_year: raport.academic_year,
			mapel_score: raport.mapel_score,
			project_score: raport.project_score,
			kesantrian_score: raport.kesantrian_score,
			final_score: raport.final_score,
			predikat: raport.predikat,
			notes: '',
		});
		if (res.ok) { showToast('success', 'Rapor dikunci (locked)'); loadAll(); }
		else showToast('error', res.message || 'Gagal mengunci rapor');
	};

	const handlePDF = async () => {
		if (!raport) return;
		await exportERaportPDF({
			studentName: raport.student_name,
			studentID: raport.student_id,
			semester: raport.semester,
			academicYear: raport.academic_year,
			mapelScore: raport.mapel_score,
			projectScore: raport.project_score,
			kesantrianScore: raport.kesantrian_score,
			finalScore: raport.final_score,
			predikat: raport.predikat,
			mapel: (raport.mapel_details || []).map(d => ({ subject: d.subject_name, score: d.score })),
			project: (raport.project_details || []).map(d => ({ name: d.sub_project, score: d.score })),
			kesantrian: ASPEK_OPTS.map(a => {
				const v = raport.kesantrian_detail?.[a.key] ?? raport.kesantrian_detail?.[a.label];
				return { aspek: a.label, score: v === undefined ? 0 : Number(v) };
			}),
			tahfidz: (raport.tahfidz?.entries || []).map(e => ({ surah: e.surah_name, juz: e.juz, ayat: `${e.start_ayat}-${e.end_ayat}`, status: e.status })),
			printedAt: new Date().toLocaleString('id-ID'),
		});
	};

	const handlePrint = () => {
		window.print();
	};


	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="flex items-center gap-2 text-2xl font-black text-slate-900"><GraduationCap size={24} className="text-sky-600" /> E-Raport Santri
						<button
							type="button"
							onClick={() => setShowFormula(true)}
							aria-label="Lihat cara hitung Nilai Akhir"
							aria-haspopup="dialog"
							title="Cara hitung Nilai Akhir"
							className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-600 transition hover:bg-sky-100 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
						>
							<Info size={17} />
						</button>
					</h1>
				</div>
				<div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5">
					{canSeeTab('rekapitulasi') && (<button onClick={() => setTab('rekapitulasi')} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === 'rekapitulasi' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Rekap</button>)}
					{canSeeTab('project') && (<button onClick={() => setTab('project')} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === 'project' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Project</button>)}
					{canSeeTab('kesantrian') && (<button onClick={() => setTab('kesantrian')} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === 'kesantrian' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Kesantrian</button>)}
				</div>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4">
				<div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
					<span className="text-xs font-bold text-slate-400">Semester</span>
					<select value={semester} onChange={e => setSemester(e.target.value)} className="bg-transparent text-sm font-bold text-slate-800 outline-none">
						<option value="1">Ganjil</option>
						<option value="2">Genap</option>
					</select>
				</div>
				<div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
					<span className="text-xs font-bold text-slate-400">Tahun</span>
					<select value={year} onChange={e => setYear(e.target.value)} className="bg-transparent text-sm font-bold text-slate-800 outline-none">
						{years.length === 0 && <option value={year}>{year || 'Memuat...'}</option>}
						{years.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
					</select>
				</div>
				<button onClick={loadAll} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"><RefreshCw size={15} /> Muat Ulang</button>

			</div>

			{tab === 'rekapitulasi' && (
				<div className="grid gap-6 lg:grid-cols-[340px_1fr]">
					{/* Student list */}
					<div className="rounded-3xl border border-slate-200 bg-white p-4">
						<div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2.5">
							<Search size={16} className="text-slate-400" />
							<input
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								placeholder="Cari santri..."
								className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
							/>
						</div>
						<div className="mt-3 max-h-[60vh] space-y-1.5 overflow-y-auto">
							{filteredStudents.length === 0 && <p className="px-3 py-4 text-center text-sm text-slate-400">Tidak ada santri. Import/pendaftaran PSB terlebih dahulu.</p>}
							{filteredStudents.map(s => {
								const st = stored.get(s.id);
								const active = s.id === selected;
								return (
									<button key={s.id} onClick={() => pickStudent(s.id)} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${active ? 'bg-sky-50 ring-1 ring-sky-200' : 'hover:bg-slate-50'}`}>
										<div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${active ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{(s.name || '?').charAt(0).toUpperCase()}</div>
										<div className="min-w-0 flex-1">
											<p className={`truncate text-sm font-bold ${active ? 'text-sky-900' : 'text-slate-800'}`}>{s.name}</p>
											<p className="truncate text-[11px] text-slate-400">{s.email}</p>
										</div>
										{st && <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ring-1 ${predikatColor(st.predikat)}`}>{st.score.toFixed(2)}</span>}
									</button>
								);
							})}
						</div>
					</div>

					{/* Detail */}
					<div className="space-y-5">
						{loading && <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-16 text-sm font-semibold text-slate-400">Menghitung rapor...</div>}
						{!loading && raport && (
							<>
								<div className="rounded-3xl bg-gradient-to-br from-sky-600 via-sky-700 to-sky-800 p-6 text-white shadow-xl shadow-sky-700/20">
									<div className="flex flex-wrap items-center justify-between gap-4">
										<div>
											<p className="text-xs font-bold uppercase tracking-widest text-sky-200">Raport Santri</p>
											<h2 className="mt-1 text-2xl font-black">{raport.student_name}</h2>
											<p className="mt-0.5 text-sm text-sky-100">Semester {raport.semester === '1' ? 'Ganjil' : 'Genap'} · TA {raport.academic_year}</p>
										</div>
										<div className="rounded-3xl bg-white/10 px-6 py-4 text-center ring-1 ring-white/20">
											<p className="text-[11px] font-bold uppercase tracking-widest text-sky-100">Nilai Akhir</p>
											<p className="text-4xl font-black">{raport.final_score.toFixed(2)}</p>
											<span className={`mt-1 inline-block rounded-full px-3 py-0.5 text-[11px] font-black ring-1 ${predikatColor(raport.predikat)}`}>{raport.predikat}</span>
										</div>
									</div>
								</div>

								{!loading && raport && !raport.is_complete && (
									<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
										Rapor belum lengkap — kurang: {(raport.missing || []).join(', ')}. Nilai akhir & predikat baru muncul setelah semua dinilai. Rapor belum lengkap tidak dapat dikunci.
									</div>
								)}
								<div className="grid gap-3 sm:grid-cols-3">
									<GradePill label="Mata Pelajaran" value={isMissing(raport, 'mapel') ? null : raport.mapel_score} sub="rata-rata semua mapel" />
									<GradePill label="Project" value={isMissing(raport, 'project') ? null : raport.project_score} sub="rata-rata kegiatan" />
									<GradePill label="Kesantrian" value={isMissing(raport, 'kesantrian') ? null : raport.kesantrian_score} sub="rata-rata 4 aspek" />
								</div>

								<div className="rounded-3xl border border-slate-200 bg-white p-5">
									<div className="flex items-center justify-between">
										<h3 className="flex items-center gap-2 text-sm font-black text-slate-900"><BookOpen size={16} className="text-sky-600" /> Rincian Mata Pelajaran</h3>
									</div>
									<div className="ap-table-wrap mt-3 overflow-x-auto">
										<table className="w-full text-left text-sm">
											<thead>
												<tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
													<th className="pb-2 font-bold">Mapel</th>
													<th className="pb-2 font-bold">Nilai</th>
												</tr>
											</thead>
											<tbody>
												{(raport.mapel_details || []).map(d => (
													<tr key={d.subject_id} className="border-b border-slate-50">
														<td className="py-2 font-semibold text-slate-700">{d.subject_name}</td>
														<td className="py-2 font-bold text-slate-900">{d.score.toFixed(2)}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>

								<div className="grid gap-5 md:grid-cols-2">
									<div className="rounded-3xl border border-slate-200 bg-white p-5">
										<h3 className="flex items-center gap-2 text-sm font-black text-slate-900"><Layers size={16} className="text-sky-600" /> Project (QNS)</h3>
										<div className="mt-3 space-y-3">
											{(raport.project_details || []).map(d => {
												const sp = subProjects.find(x => x.id === d.sub_project_id);
												const scored = (d.score || 0) > 0;
												return (
													<div key={d.sub_project_id}>
														<div className="flex items-center justify-between text-sm">
															<span className="font-semibold text-slate-700">{sp?.name || d.sub_project}</span>
															<span className="font-bold text-slate-900">{scored ? ((d.score || 0) / 4 * 100).toFixed(1) : '\u2013'}</span>
														</div>
														<div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
															<div className="h-full rounded-full bg-sky-500" style={{ width: `${scored ? Math.min((d.score || 0) / 4 * 100, 100) : 0}%` }} />
														</div>
													</div>
												);
											})}
											{(raport.project_details || []).length === 0 && (
												<p className="text-sm text-slate-400">Belum ada kegiatan project. Tambah di tab Project, lalu isi nilainya per santri.</p>
											)}
										</div>
									</div>
									<div className="rounded-3xl border border-slate-200 bg-white p-5">
										<h3 className="flex items-center gap-2 text-sm font-black text-slate-900"><HeartHandshake size={16} className="text-sky-600" /> Kesantrian</h3>
										<div className="mt-3 space-y-3">
											{ASPEK_OPTS.map(a => {
												const scRaw = raport.kesantrian_detail?.[a.key] ?? raport.kesantrian_detail?.[a.label];
												return (
													<div key={a.key} className="flex items-center justify-between text-sm">
														<span className="font-semibold text-slate-700">{a.label}</span>
														<span className="rounded-full bg-sky-50 px-2.5 py-0.5 font-black text-sky-700">{scRaw === undefined ? '\u2013' : (((Number(scRaw) || 0) / 4 * 100).toFixed(1))}</span>
													</div>
												);
											})}
										</div>
									</div>
								</div>

								<div className="rounded-3xl border border-slate-200 bg-white p-5">
									<div className="flex flex-wrap items-center justify-between gap-3">
										<h3 className="flex items-center gap-2 text-sm font-black text-slate-900"><BookOpen size={16} className="text-sky-600" /> Progres Tahfidz</h3>
										<span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-violet-700">Informatif — tidak memengaruhi nilai akhir</span>
									</div>
									{!raport.tahfidz?.has_data ? (
										<p className="mt-3 text-sm text-slate-400">Belum ada progres tahfidz pada semester dan tahun ajaran ini.</p>
									) : (
										<>
											<div className="mt-3 flex flex-wrap gap-2">
												{[
													{ label: 'Total setoran', value: String(raport.tahfidz.total) },
													{ label: 'Lulus', value: String(raport.tahfidz.lulus) },
													{ label: 'Setor', value: String(raport.tahfidz.setor) },
													{ label: 'Proses', value: String(raport.tahfidz.proses) },
													{ label: 'Persentase lulus', value: `${raport.tahfidz.score.toFixed(1)}%` },
												].map(s => (
													<span key={s.label} className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">{s.label}: <span className="font-black text-slate-900">{s.value}</span></span>
												))}
											</div>
											<div className="ap-table-wrap mt-3 overflow-x-auto">
												<table className="w-full text-left text-sm">
													<thead>
														<tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
															<th className="pb-2 font-bold">Surah</th>
															<th className="pb-2 font-bold">Juz</th>
															<th className="pb-2 font-bold">Ayat</th>
															<th className="pb-2 font-bold">Status</th>
															<th className="pb-2 font-bold">Evaluasi</th>
														</tr>
													</thead>
													<tbody>
														{raport.tahfidz.entries.map((e, i) => (
															<tr key={`${e.surah_name}-${i}`} className="border-b border-slate-50">
																<td className="py-2 font-semibold text-slate-700">{e.surah_name}</td>
																<td className="py-2 text-slate-700">{e.juz}</td>
																<td className="py-2 text-slate-700">{e.start_ayat}-{e.end_ayat}</td>
																<td className="py-2 font-bold uppercase text-slate-900">{e.status}</td>
																<td className="py-2 text-slate-700">{e.evaluation_date}</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										</>
									)}
								</div>

								<div className="flex flex-wrap gap-3">
									{showLock && (<button onClick={handleLockRaport} disabled={!raport.is_complete} title={!raport.is_complete ? 'Lengkapi dulu: ' + (raport.missing || []).join(', ') : 'Kunci rapor'} className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/25 hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40">
										<Save size={17} /> Kunci Rapor
									</button>)}
									<button onClick={handlePDF} className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
										<Download size={17} /> Unduh PDF
									</button>
									<button onClick={handlePrint} className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
										<Printer size={17} /> Cetak
									</button>
								</div>
							</>
						)}
					</div>
				</div>
			)}

			{tab === 'project' && (
				<div className="rounded-3xl border border-slate-200 bg-white p-6">
					<div>
						<h3 className="flex items-center gap-2 text-lg font-black text-slate-900"><Layers size={19} className="text-sky-600" /> Penilaian Project</h3>
						<p className="mt-1 text-sm text-slate-500">Tiap kegiatan dinilai 1-4 (1=Perlu Perbaikan, 4=Sangat Baik). Nilai project = rata-rata kegiatan yang sudah dinilai. Pilih santri dulu di tab Rekap.</p>
					</div>

					<div className="mt-4 grid gap-3 sm:grid-cols-2">
						<div className="rounded-2xl bg-sky-50 p-4 text-sm">
							<p className="text-[11px] font-black uppercase tracking-widest text-sky-600">Skala nilai</p>
							<p className="mt-1 text-slate-600">Tiap kegiatan dinilai <strong>1-4</strong> (1=Perlu Perbaikan, 4=Sangat Baik). Nilai project = rata-rata kegiatan yang sudah dinilai.</p>
						</div>
						<div className="rounded-2xl bg-amber-50 p-4 text-sm">
							<p className="text-[11px] font-black uppercase tracking-widest text-amber-600">Predikat (KKM 75)</p>
							<p className="mt-1 text-slate-600">A ≥ 90, B 80-89, C 75-79 (tuntas), D &lt; 75.</p>
						</div>
					</div>
						{subProjects.length === 0 && (
						<p className="mt-4 text-sm text-slate-400">Belum ada sub-project. Tambah dulu di halaman Project.</p>
					)}
					{!selected && subProjects.length > 0 && (
						<p className="mt-4 text-sm text-slate-400">Pilih santri di tab Rekap untuk mengisi nilai.</p>
					)}
					{selected > 0 && subProjects.map(sp => {
						const acts = activities.filter(a => a.sub_project_id === sp.id);
						if (acts.length === 0) return null;
						return (
							<div key={sp.id} className="mt-5">
								<p className="text-sm font-black text-slate-800">{sp.name}</p>
								<div className="mt-2 space-y-3">
									{acts.map(a => (
										<div key={a.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
											<div className="min-w-0 flex-1">
												<p className="text-sm font-bold text-slate-800">{a.name}</p>
												<p className="text-[11px] text-slate-400">{students.find(s => s.id === selected)?.name}</p>
											</div>
											<select value={projScores[a.id] ?? ''} onChange={e => setProjScores(prev => ({ ...prev, [a.id]: e.target.value }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-sky-500">
												<option value="">Pilih nilai</option>
												<option value="4">4 - Sangat Baik</option>
												<option value="3">3 - Baik</option>
												<option value="2">2 - Cukup</option>
												<option value="1">1 - Perlu Perbaikan</option>
											</select>
											<button onClick={() => handleProjectSave(a.id)} className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700">Simpan</button>
										</div>
									))}
								</div>
							</div>
						);
					})}
				</div>
			)}

			{tab === 'kesantrian' && (
				<div className="rounded-3xl border border-slate-200 bg-white p-6">
					<h3 className="flex items-center gap-2 text-lg font-black text-slate-900"><ClipboardList size={19} className="text-sky-600" /> Penilaian Kesantrian</h3>
					<p className="mt-1 text-sm text-slate-500">Tiap aspek dinilai 1-4 (1=Perlu Perbaikan, 4=Sangat Baik). Nilai kesantrian = rata-rata aspek yang sudah dinilai.</p>
					<div className="mt-5 space-y-4">
						{ASPEK_OPTS.map(a => (
							<div key={a.key} className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
								<div className="min-w-0 flex-1">
									<p className="text-sm font-bold text-slate-800">{a.label}</p>
									<p className="text-[11px] text-slate-400">{selected ? students.find(s => s.id === selected)?.name : 'Pilih santri'}</p>
								</div>
								<select value={kesValues[a.key] ?? ''} onChange={e => setKesValues(prev => ({ ...prev, [a.key]: e.target.value }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-sky-500">
									<option value="">Pilih nilai</option>
									<option value="4">4 - Sangat Baik</option>
									<option value="3">3 - Baik</option>
									<option value="2">2 - Cukup</option>
									<option value="1">1 - Perlu Perbaikan</option>
								</select>
								{kesSaved[a.key] && <CheckCircle2 size={18} className="text-sky-500" />}
								<button onClick={() => handleKesantrianSave(a.key)} className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700">Simpan</button>
							</div>
						))}
					</div>
				</div>
			)}
			{showFormula && (
				<div
					className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-6"
					onClick={() => setShowFormula(false)}
					role="presentation"
				>
					<div
						role="dialog"
						aria-modal="true"
						aria-labelledby="admin-formula-title"
						onClick={(e) => e.stopPropagation()}
						className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
					>
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600">Cara Hitung</p>
								<h3 id="admin-formula-title" className="mt-1 font-outfit text-xl font-black tracking-tight text-slate-900">
									Nilai Akhir E-Raport
								</h3>
							</div>
							<button
								type="button"
								onClick={() => setShowFormula(false)}
								aria-label="Tutup penjelasan"
								className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
							>
								<X size={18} />
							</button>
						</div>
						<p className="mt-3 text-sm leading-6 text-slate-600">
							Nilai Akhir adalah <strong className="text-slate-900">rata-rata biasa</strong> dari 3 komponen yang sudah dinilai:
						</p>
						<ul className="mt-4 space-y-3">
							{[
								{ name: 'Nilai Mapel', desc: 'Rata-rata nilai semua mapel semester ini.', tint: 'bg-sky-50 text-sky-700' },
								{ name: 'Nilai Project', desc: 'Rata-rata nilai kegiatan yang sudah dinilai di tab Project.', tint: 'bg-emerald-50 text-emerald-700' },
								{ name: 'Nilai Kesantrian', desc: 'Rata-rata 4 aspek (disiplin, ibadah, kemandirian, adab) skala 1-4. Predikat ikut KKM 75: A ≥ 90, B 80-89, C 75-79, D < 75.', tint: 'bg-amber-50 text-amber-700' },
							].map((row) => (
								<li key={row.name} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5">
									<span className={`inline-block rounded-full px-2.5 py-1 text-xs font-black ${row.tint}`}>{row.name}</span>
									<span className="mt-1.5 block text-xs leading-5 text-slate-500">{row.desc}</span>
								</li>
							))}
						</ul>
						<div className="mt-4 rounded-2xl bg-sky-50 p-4">
							<p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sky-600">Contoh hitung</p>
							<p className="mt-2 text-sm font-semibold leading-6 text-slate-800">
								(80 + 90 + 85) ÷ 3 = 85. Komponen yang belum dinilai tidak ikut dihitung dan rapor belum bisa dikunci.
							</p>
						</div>
						<button
							type="button"
							onClick={() => setShowFormula(false)}
							className="mt-5 min-h-[44px] w-full rounded-2xl bg-sky-600 py-3 text-sm font-bold text-white transition hover:bg-sky-700"
						>
							Mengerti
						</button>
					</div>
				</div>
			)}
		</div>
	);
}