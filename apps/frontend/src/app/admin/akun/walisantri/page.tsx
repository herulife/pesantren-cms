'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	getWaliAccounts,
	updateWaliAccount,
	WaliAccount,
	WaliList,
} from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/components/AuthProvider';
import {
	AlertTriangle,
	BadgeCheck,
	Pencil,
	RefreshCw,
	Search,
	TriangleAlert,
	Users,
	X,
} from 'lucide-react';

const inputClass =
	'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10';

type EditDraft = { name: string; email: string };

export default function WaliSantriAccountsPage() {
	const { showToast } = useToast();
	const { user, loading: authLoading } = useAuth();
	const allowed = user?.role === 'superadmin' || user?.role === 'bendahara';
	const [data, setData] = useState<WaliList | null>(null);
	const [loading, setLoading] = useState(true);
	const [q, setQ] = useState('');
	const [onlyPlaceholder, setOnlyPlaceholder] = useState(false);
	const [editing, setEditing] = useState<number | null>(null);
	const [draft, setDraft] = useState<EditDraft>({ name: '', email: '' });
	const [saving, setSaving] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await getWaliAccounts();
			setData(res);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (authLoading || !allowed) return;
		void load();
	}, [load, authLoading, allowed]);

	const filtered = useMemo(() => {
		if (!data) return [];
		const needle = q.trim().toLowerCase();
		return data.accounts.filter((a) => {
			if (onlyPlaceholder && !a.is_placeholder) return false;
			if (!needle) return true;
			if (a.name.toLowerCase().includes(needle)) return true;
			if (a.email.toLowerCase().includes(needle)) return true;
			return a.santri.some(
				(s) =>
					s.name.toLowerCase().includes(needle) ||
					(s.nis || '').toLowerCase().includes(needle)
			);
		});
	}, [data, q, onlyPlaceholder]);

	function startEdit(a: WaliAccount) {
		setEditing(a.user_id);
		setDraft({ name: a.name, email: a.email });
	}

	function cancelEdit() {
		setEditing(null);
		setDraft({ name: '', email: '' });
	}

	async function saveEdit(a: WaliAccount) {
		if (!draft.name.trim()) {
			showToast('error', 'Nama wali wajib diisi.');
			return;
		}
		setSaving(true);
		try {
			const res = await updateWaliAccount(a.user_id, {
				name: draft.name.trim(),
				email: draft.email.trim(),
			});
			if (!res.ok) {
				showToast('error', res.message || 'Gagal menyimpan akun wali.');
				return;
			}
			showToast('success', 'Akun wali berhasil diperbarui.');
			cancelEdit();
			await load();
		} finally {
			setSaving(false);
		}
	}

	const stats = data?.stats;

	return (
		<div className="space-y-6">
			{!authLoading && !allowed ? (
				<div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center">
					<TriangleAlert className="mx-auto h-8 w-8 text-rose-600" />
					<p className="mt-3 text-base font-black text-rose-900">Akses ditolak</p>
				</div>
			) : (
				<>
					<header className="flex flex-wrap items-start justify-between gap-4">
						<div>
							<h1 className="text-2xl font-black tracking-tight text-slate-900">Akun Wali Santri</h1>
							<p className="mt-1 text-sm text-slate-500">Kelola akun wali yang terhubung dengan santri.</p>
						</div>
						<button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
							<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
							Muat Ulang
						</button>
					</header>

					<section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
						<StatCard label="Akun Wali" value={stats?.total_accounts} icon={<Users className="h-4 w-4" />} />
						<StatCard label="Santri Tertaut" value={stats?.total_santri} />
						<StatCard label="Keluarga (≥2 anak)" value={stats?.multi_santri} />
						<StatCard label="Nama Karangan" value={stats?.placeholder} tone="warn" />
						<StatCard label="Akun Yatim" value={stats?.orphan} />
					</section>

					{stats && stats.placeholder > 0 && (
						<div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
							<TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
							<div className="text-sm text-amber-900">
								<p className="font-bold">{stats.placeholder} akun masih memakai nama karangan / perlu diperbaiki.</p>
							</div>
						</div>
					)}

					<div className="flex flex-wrap items-center gap-3">
						<div className="relative min-w-[260px] flex-1">
							<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
							<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama wali, email, atau nama Santri..." className={inputClass + ' pl-9'} />
						</div>
						<label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
							<input type="checkbox" checked={onlyPlaceholder} onChange={(e) => setOnlyPlaceholder(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
							Hanya nama karangan
						</label>
					</div>

					{loading ? (
						<div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Memuat daftar akun wali...</div>
					) : filtered.length === 0 ? (
						<div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Tidak ada akun wali yang cocok dengan filter.</div>
					) : (
						<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
							<table className="w-full text-left text-sm">
								<thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
									<tr>
										<th className="px-4 py-3 font-bold">Wali</th>
										<th className="px-4 py-3 font-bold">Email Login</th>
										<th className="px-4 py-3 font-bold">No. HP</th>
										<th className="px-4 py-3 font-bold">Santri</th>
										<th className="px-4 py-3 font-bold">Status</th>
										<th className="px-4 py-3" />
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filtered.map((a) => (
										<tr key={a.user_id} className="align-top">
											<td className="px-4 py-3">
												{editing === a.user_id ? (
													<input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputClass + ' min-w-[220px]'} />
												) : (
													<div className="flex items-center gap-2">
														<span className="font-bold text-slate-900">{a.name}</span>
														{a.name_placeholder && <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">Nama Karangan</span>}
													</div>
												)}
											</td>
											<td className="px-4 py-3">
												{editing === a.user_id ? (
													<input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className={inputClass + ' min-w-[260px]'} />
												) : (
													<span className="font-medium text-slate-700">{a.email}</span>
												)}
											</td>
											<td className="px-4 py-3 text-slate-600">{a.whatsapp || '-'}</td>
											<td className="px-4 py-3 text-slate-600">
												{a.santri.map((s) => (
													<div key={s.santri_id}>
														{s.name} ({s.nis}) {s.class ? `- ${s.class}` : ''}
													</div>
												))}
											</td>
											<td className="px-4 py-3">
												{a.needs_note && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
													<AlertTriangle className="h-3 w-3" /> Perlu perbaiki
												</span>}
											</td>
											<td className="px-4 py-3">
												{editing === a.user_id ? (
													<div className="flex items-center justify-end gap-2">
														<button onClick={() => saveEdit(a)} disabled={saving} className="rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">Simpan</button>
														<button onClick={cancelEdit} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">Batal</button>
													</div>
												) : (
													<div className="flex items-center justify-end gap-2">
														<button onClick={() => startEdit(a)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
															<Pencil className="h-3.5 w-3.5" /> Edit
														</button>
													</div>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</>
			)}
		</div>
	);
}

function StatCard({ label, value, icon, tone }: { label: string; value?: number; icon?: React.ReactNode; tone?: 'warn' }) {
	const toneClass = tone === 'warn' ? 'text-amber-600 ring-amber-200 bg-amber-50' : 'text-sky-600 ring-sky-200 bg-sky-50';
	return (
		<article className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
			<div>
				<p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
				<p className="mt-1 text-2xl font-black text-slate-900">{value ?? 0}</p>
			</div>
			{icon && (
				<span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ${toneClass}`}>
					{icon}
				</span>
			)}
		</article>
	);
}
