'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/Toast';
import {
	SubProject,
	ProjectActivity,
	ProjectIndicator,
	getSubProjects,
	createSubProject,
	updateSubProject,
	deleteSubProject,
	getActivities,
	createActivity,
	updateActivity,
	deleteActivity,
	getIndicators,
	createIndicator,
	deleteIndicator,
	validateWeights,
} from '@/lib/api';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, FolderTree, Layers, Pencil, Plus, Save, Trash2, X } from 'lucide-react';

const blockLabels = {
	dashboard: 'Dashboard',
	subprojects: 'Sub Project',
	activities: 'Kegiatan',
	indicators: 'Indikator',
	weights: 'Bobot',
};

type TabKey = 'subprojects' | 'activities' | 'indicators' | 'weights';

const DEFAULT_COLORS = ['from-sky-500 to-blue-600', 'from-blue-500 to-blue-600', 'from-amber-500 to-orange-600'];

function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4">
			<div className="w-full max-w-lg rounded-[1.6rem] bg-white shadow-2xl">
				<div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
					<h3 className="text-lg font-black text-slate-900">{title}</h3>
					<button onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-slate-900"><X size={16} /></button>
				</div>
				<div className="max-h-[80vh] overflow-y-auto p-6">{children}</div>
			</div>
		</div>
	);
}

function Scorebar({ score }: { score: number }) {
	const pct = Math.round(score);
	return (
		<div className="flex items-center gap-2">
			<div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
				<div className={`h-full rounded-full ${pct >= 100 ? 'bg-blue-500' : pct >= 50 ? 'bg-sky-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
			</div>
			<span className="w-14 text-right text-sm font-bold text-slate-700">{pct}%</span>
		</div>
	);
}

export default function ProjectPage() {
	const { showToast } = useToast();
	const [tab, setTab] = useState<TabKey>('subprojects');
	const [subs, setSubs] = useState<SubProject[]>([]);
	const [acts, setActs] = useState<ProjectActivity[]>([]);
	const [inds, setInds] = useState<ProjectIndicator[]>([]);
	const [selectedSub, setSelectedSub] = useState<number | null>(null);
	const [selectedAct, setSelectedAct] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);
	const [weightMsg, setWeightMsg] = useState<{ ok: boolean; text: string } | null>(null);

	const [subModal, setSubModal] = useState(false);
	const [subForm, setSubForm] = useState<{ id: number | null; name: string; code: string; description: string; weight: string }>({ id: null, name: '', code: '', description: '', weight: '' });
	const [actModal, setActModal] = useState(false);
	const [actForm, setActForm] = useState<{ id: number | null; sub_project_id: number | null; name: string; weight: string; tujuan: string; indikator: string }>({ id: null, sub_project_id: null, name: '', weight: '', tujuan: '', indikator: '' });
	const [indModal, setIndModal] = useState(false);
	const [indForm, setIndForm] = useState<{ activity_id: number | null; name: string; weight: string }>({ activity_id: null, name: '', weight: '' });
	const [deleteTarget, setDeleteTarget] = useState<{ type: 'sub' | 'act' | 'ind'; id: number } | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		const [s, a, i, vw] = await Promise.all([
			getSubProjects(),
			getActivities(),
			getIndicators(0).catch(() => []),
			validateWeights(),
		]);
		setSubs(s);
		setActs(a);
		setWeightMsg(vw.ok ? { ok: true, text: 'Total bobot sub project valid 100%' } : { ok: false, text: vw.message || 'Bobot invalid' });
		setLoading(false);
	}, []);

	useEffect(() => { load(); }, [load]);

	const activitiesFor = useMemo(() => (sub: number) => acts.filter(a => a.sub_project_id === sub), [acts]);
	const indicatorsFor = useMemo(() => (act: number) => inds.filter(i => i.activity_id === act), [inds]);

	const totalWeight = useMemo(() => subs.reduce((sum, s) => sum + s.weight, 0), [subs]);

	const openSubCreate = () => { setSubForm({ id: null, name: '', code: '', description: '', weight: '' }); setSubModal(true); };
	const openSubEdit = (s: SubProject) => { setSubForm({ id: s.id, name: s.name, code: s.code, description: s.description, weight: String(s.weight) }); setSubModal(true); };

	const openActCreate = (subId: number) => { setActForm({ id: null, sub_project_id: subId, name: '', weight: '', tujuan: '', indikator: '' }); setActModal(true); };
	const openActEdit = (a: ProjectActivity) => { setActForm({ id: a.id, sub_project_id: a.sub_project_id, name: a.name, weight: String(a.weight), tujuan: a.tujuan, indikator: a.indikator }); setActModal(true); };

	const openIndCreate = (actId: number) => {
		setIndForm({ activity_id: actId, name: '', weight: '' });
		if (selectedAct !== actId) setSelectedAct(actId);
		setIndForm({ activity_id: actId, name: '', weight: '' });
		setIndModal(true);
	};

	const saveSub = async () => {
		const w = parseFloat(subForm.weight);
		if (!subForm.name.trim() || !w) { showToast('error', 'Nama & bobot wajib diisi'); return; }
		const payload = { name: subForm.name.trim(), code: subForm.code.trim(), description: subForm.description, weight: w, is_active: true };
		const ok = subForm.id ? await updateSubProject(subForm.id, payload) : !!(await createSubProject(payload));
		if (ok) { showToast('success', 'Sub project disimpan'); setSubModal(false); load(); }
		else showToast('error', 'Gagal menyimpan (cek total bobot = 100%)');
	};

	const saveAct = async () => {
		const w = parseFloat(actForm.weight);
		if (!actForm.name.trim() || !w || !actForm.sub_project_id) { showToast('error', 'Nama & bobot wajib diisi'); return; }
		const payload = { sub_project_id: actForm.sub_project_id, name: actForm.name.trim(), weight: w, tujuan: actForm.tujuan, indikator: actForm.indikator, is_active: true };
		const ok = actForm.id ? await updateActivity(actForm.id, payload) : !!(await createActivity(payload));
		if (ok) { showToast('success', 'Kegiatan disimpan'); setActModal(false); load(); }
		else showToast('error', 'Gagal menyimpan (total bobot kegiatan sub project ≤ 100%)');
	};

	const saveInd = async () => {
		const w = parseFloat(indForm.weight);
		if (!indForm.name.trim() || !w || !indForm.activity_id) { showToast('error', 'Nama & bobot wajib diisi'); return; }
		const ok = !!(await createIndicator({ activity_id: indForm.activity_id, name: indForm.name.trim(), weight: w }));
		if (ok) { showToast('success', 'Indikator dibuat'); setIndModal(false); load(); }
		else showToast('error', 'Gagal menyimpan indikator');
	};

	const doDelete = async () => {
		if (!deleteTarget) return;
		const ok = deleteTarget.type === 'sub' ? await deleteSubProject(deleteTarget.id) : deleteTarget.type === 'act' ? await deleteActivity(deleteTarget.id) : await deleteIndicator(deleteTarget.id);
		if (ok) { showToast('success', 'Dihapus'); load(); } else showToast('error', 'Gagal menghapus');
		setDeleteTarget(null);
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-black text-slate-900">Project &amp; Kegiatan</h1>
					<p className="mt-1 text-sm text-slate-500">Kelola profil Projek Penguatan (Qur&apos;ani · Mandiri · Peduli), kegiatan, dan indikator.</p>
				</div>
				<button onClick={openSubCreate} className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/25 hover:bg-sky-700">
					<Plus size={18} /> Tambah Sub Project
				</button>
			</div>

			{/* Weight status banner */}
			<div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 ${weightMsg?.ok ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
				{weightMsg?.ok ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
				<div className="flex-1">
					<p className="text-sm font-bold">{weightMsg?.text || 'Memvalidasi bobot...'}</p>
					<p className="text-xs opacity-80">Total saat ini: <b>{totalWeight.toFixed(1)}%</b> — sistem mewajibkan 100% untuk publish rapor.</p>
				</div>
				<button onClick={load} className="rounded-xl border border-current px-3 py-1.5 text-xs font-bold hover:bg-white/50">Muat ulang</button>
			</div>

			{/* Tabs */}
			<div className="flex flex-wrap gap-2">
				{(['subprojects', 'activities', 'indicators', 'weights'] as TabKey[]).map(t => (
					<button key={t} onClick={() => setTab(t)} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === t ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>
						{blockLabels[t]}
					</button>
				))}
			</div>

			{tab === 'subprojects' && (
				<div className="grid gap-5 md:grid-cols-3">
					{subs.map((s, i) => (
						<div key={s.id} className={`rounded-3xl bg-gradient-to-br ${DEFAULT_COLORS[i % 3]} p-[1px]`}>
							<div className="flex h-full flex-col rounded-[calc(1.5rem-1px)] bg-white p-5">
								<div className="flex items-start justify-between">
									<div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${DEFAULT_COLORS[i % 3]} text-white shadow-lg`}>
										<FolderTree size={20} />
									</div>
									<div className="flex gap-1">
										<button onClick={() => openSubEdit(s)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-sky-600"><Pencil size={15} /></button>
										<button onClick={() => setDeleteTarget({ type: 'sub', id: s.id })} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-rose-600"><Trash2 size={15} /></button>
									</div>
								</div>
								<h3 className="mt-4 text-lg font-black text-slate-900">{s.name}</h3>
								<p className="mt-1 line-clamp-2 text-sm text-slate-500">{s.description || 'Tanpa deskripsi'}</p>
								<div className="mt-4"><Scorebar score={s.weight} /></div>
								<div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
									<span className="text-xs font-semibold text-slate-400">{activitiesFor(s.id).length} kegiatan</span>
									<button onClick={() => openActCreate(s.id)} className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800"><Plus size={14} /> Kegiatan</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{tab === 'activities' && (
				<div className="space-y-4">
					{subs.map(s => (
						<div key={s.id} className="rounded-3xl border border-slate-200 bg-white p-5">
							<div className="flex items-center justify-between">
								<h3 className="flex items-center gap-2 text-base font-black text-slate-900"><FolderTree size={17} className="text-sky-600" /> {s.name} <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{s.weight}%</span></h3>
								<button onClick={() => openActCreate(s.id)} className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100"><Plus size={14} /> Kegiatan</button>
							</div>
							<div className="mt-3 space-y-2">
								{activitiesFor(s.id).length === 0 && <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-400">Belum ada kegiatan. Tambahkan agar bobot sub project terisi penuh (total 100%).</p>}
								{activitiesFor(s.id).map(a => {
									const open = selectedSub === a.id;
									return (
										<div key={a.id} className="overflow-hidden rounded-2xl border border-slate-100">
											<div className="flex items-center gap-3 px-4 py-3">
												<button onClick={() => setSelectedSub(open ? null : a.id)} className="text-slate-400 hover:text-sky-600">{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
												<div className="min-w-0 flex-1">
													<p className="truncate text-sm font-bold text-slate-800">{a.name}</p>
													<div className="mt-1 w-48"><Scorebar score={a.weight} /></div>
												</div>
												<div className="flex gap-1">
													<button onClick={() => openIndCreate(a.id)} className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:text-sky-600" title="Tambah indikator"><Plus size={14} /></button>
													<button onClick={() => openActEdit(a)} className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:text-sky-600"><Pencil size={14} /></button>
													<button onClick={() => setDeleteTarget({ type: 'act', id: a.id })} className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:text-rose-600"><Trash2 size={14} /></button>
												</div>
											</div>
											{open && (
												<div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
													<p className="flex items-center gap-2 text-sm font-semibold text-slate-600"><Layers size={14} /> Indikator ({indicatorsFor(a.id).length})</p>
													{indicatorsFor(a.id).length === 0 && <p className="mt-1 text-xs text-slate-400">Tidak ada indikator.</p>}
													{indicatorsFor(a.id).map(i => (
														<div key={i.id} className="mt-2 flex items-center gap-3 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-100">
															<p className="min-w-0 flex-1 text-sm text-slate-700">{i.name}</p>
															<span className="text-xs font-bold text-slate-500">{i.weight}%</span>
															<button onClick={() => setDeleteTarget({ type: 'ind', id: i.id })} className="text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
														</div>
													))}
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>
					))}
				</div>
			)}

			{tab === 'indicators' && (
				<div className="space-y-4">
					{subs.map(s => (
						<div key={s.id} className="rounded-3xl border border-slate-200 bg-white p-5">
							<h3 className="flex items-center gap-2 text-base font-black text-slate-900"><FolderTree size={17} className="text-sky-600" /> {s.name}</h3>
							{activitiesFor(s.id).map(a => (
								<div key={a.id} className="mt-3 rounded-2xl bg-slate-50 p-4">
									<div className="flex items-center justify-between">
										<p className="text-sm font-bold text-slate-800">{a.name} <span className="ml-1 text-xs font-semibold text-slate-400">{a.weight}%</span></p>
										<button onClick={() => { setIndForm({ activity_id: a.id, name: '', weight: '' }); setIndModal(true); }} className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800"><Plus size={14} /> Indikator</button>
									</div>
									<div className="mt-2 space-y-1.5">
										{indicatorsFor(a.id).map(i => (
											<div key={i.id} className="flex items-center gap-3 rounded-xl border border-white bg-white px-3 py-2 shadow-sm">
												<p className="min-w-0 flex-1 text-sm text-slate-700">{i.name}</p>
												<span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-700">{i.weight}%</span>
												<button onClick={() => setDeleteTarget({ type: 'ind', id: i.id })} className="text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					))}
				</div>
			)}

			{tab === 'weights' && (
				<div className="rounded-3xl border border-slate-200 bg-white p-6">
					<h3 className="flex items-center gap-2 text-lg font-black text-slate-900"><Save size={18} className="text-sky-600" /> Ringkasan Bobot</h3>
					<p className="mt-1 text-sm text-slate-500">Bobot sub project wajib total 100%. E-Raport = (Mapel×50%) + (Project×25%) + (Kesantrian×25%).</p>
					<div className="mt-5 space-y-3">
						{subs.map(s => (
							<div key={s.id} className="flex items-center gap-4">
								<span className="w-40 truncate text-sm font-semibold text-slate-700">{s.name}</span>
								<div className="flex-1"><Scorebar score={s.weight} /></div>
							</div>
						))}
						<div className="border-t border-slate-100 pt-3">
							<div className="flex items-center gap-4">
								<span className="w-40 text-sm font-black text-slate-900">Total</span>
								<span className={`text-base font-black ${totalWeight === 100 ? 'text-blue-600' : 'text-rose-600'}`}>{totalWeight.toFixed(1)}%</span>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Modals */}
			<Modal open={subModal} title={subForm.id ? 'Edit Sub Project' : 'Tambah Sub Project'} onClose={() => setSubModal(false)}>
				<div className="space-y-4">
					<div><label className="text-xs font-bold text-slate-500">Nama *</label><input className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-500" value={subForm.name} onChange={e => setSubForm({ ...subForm, name: e.target.value })} /></div>
					<div><label className="text-xs font-bold text-slate-500">Kode</label><input className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-500" value={subForm.code} onChange={e => setSubForm({ ...subForm, code: e.target.value })} /></div>
					<div><label className="text-xs font-bold text-slate-500">Bobot (%) *</label><input type="number" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-500" value={subForm.weight} onChange={e => setSubForm({ ...subForm, weight: e.target.value })} /></div>
					<div><label className="text-xs font-bold text-slate-500">Deskripsi</label><textarea className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-500" rows={3} value={subForm.description} onChange={e => setSubForm({ ...subForm, description: e.target.value })} /></div>
					<button onClick={saveSub} className="w-full rounded-2xl bg-sky-600 py-3 text-sm font-bold text-white hover:bg-sky-700">Simpan</button>
				</div>
			</Modal>

			<Modal open={actModal} title={actForm.id ? 'Edit Kegiatan' : 'Tambah Kegiatan'} onClose={() => setActModal(false)}>
				<div className="space-y-4">
					<div><label className="text-xs font-bold text-slate-500">Nama *</label><input className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-500" value={actForm.name} onChange={e => setActForm({ ...actForm, name: e.target.value })} /></div>
					<div><label className="text-xs font-bold text-slate-500">Bobot (%) *</label><input type="number" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-500" value={actForm.weight} onChange={e => setActForm({ ...actForm, weight: e.target.value })} /></div>
					<div><label className="text-xs font-bold text-slate-500">Tujuan</label><textarea className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-500" rows={2} value={actForm.tujuan} onChange={e => setActForm({ ...actForm, tujuan: e.target.value })} /></div>
					<div><label className="text-xs font-bold text-slate-500">Indikator (deskripsi)</label><textarea className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-500" rows={2} value={actForm.indikator} onChange={e => setActForm({ ...actForm, indikator: e.target.value })} /></div>
					<button onClick={saveAct} className="w-full rounded-2xl bg-sky-600 py-3 text-sm font-bold text-white hover:bg-sky-700">Simpan</button>
				</div>
			</Modal>

			<Modal open={indModal} title="Tambah Indikator" onClose={() => setIndModal(false)}>
				<div className="space-y-4">
					<div><label className="text-xs font-bold text-slate-500">Indikator *</label><input className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-500" value={indForm.name} onChange={e => setIndForm({ ...indForm, name: e.target.value })} placeholder="cth: Kelancaran hafalan juz 30" /></div>
					<div><label className="text-xs font-bold text-slate-500">Bobot (%) *</label><input type="number" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-500" value={indForm.weight} onChange={e => setIndForm({ ...indForm, weight: e.target.value })} /></div>
					<button onClick={saveInd} className="w-full rounded-2xl bg-sky-600 py-3 text-sm font-bold text-white hover:bg-sky-700">Simpan</button>
				</div>
			</Modal>

			{/* Delete confirm */}
			{deleteTarget && (
				<div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/50 p-4">
					<div className="w-full max-w-sm rounded-[1.6rem] bg-white p-6 shadow-2xl">
						<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><AlertTriangle size={24} /></div>
						<h3 className="mt-4 text-lg font-black text-slate-900">Hapus data?</h3>
						<p className="mt-1 text-sm text-slate-500">Tindakan ini tidak dapat dibatalkan. Kegiatan/indikator terkait akan ikut terhapus.</p>
						<div className="mt-5 flex gap-3">
							<button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600">Batal</button>
							<button onClick={doDelete} className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-bold text-white hover:bg-rose-700">Hapus</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}