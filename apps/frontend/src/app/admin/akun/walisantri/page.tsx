'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	getWaliSantriAccounts,
	updateWaliSantriAccount,
	WaliAccount,
	WaliList,
} from '@/lib/api';
import { useToast } from '@/components/Toast';
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
			const res = await getWaliSantriAccounts();
			if (!res) {
				showToast('error', 'Gagal memuat daftar akun wali.');
				return;
			}
			setData(res);
		} finally {
			setLoading(false);
		}
	}, [showToast]);

	// eslint-disable-next-line react-hooks/set-state-in-effect
	useEffect(() => {
		void load();
	}, [load]);

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
			const res = await updateWaliSantriAccount(a.user_id, {
				name: draft.name.trim(),
				email: draft.email.trim(),
			});
			if (!res.ok) {
				showToast('error', res.message || 'Gagal menyimpan akun wali.');
				return;
			}
			showToast('success', `Akun wali ${a.email} berhasil diperbarui.`);
			cancelEdit();
			await load();
		} finally {
			setSaving(false);
		}
	}

	const stats = data?.stats;

	return (
		<div className="space-y-6">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-black tracking-tight text-slate-900">
						Akun Wali Santri
					</h1>
					<p className="mt-1 text-sm text-slate-500">
						Satu akun untuk satu keluarga. Kalau anakicarbonльных_seorang brotherhood punya
						lebih dari satu Santri, semuanya bisa login pakai akun yang sama.
					</p>
				</div>
				<button
					type="button"
					onClick={() => void load()}
					disabled={loading}
					className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
				>
					<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
					Muat Ulang
				</button>
			</header>

			<section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
				<StatCard label="Akun Wali" value={stats?.total_accounts} icon={<Users className="h-4 w-4" />} />
				<StatCard label="Santri Tertaut" value={stats?.total_santri} />
				<StatCard label="Keluarga (≥2 anak)" value={stats?.multi_santri} />
				<StatCard label="Perlu Dilengkapi" value={stats?.placeholder} tone="warn" />
				<StatCard label="Akun Yatim" value={stats?.orphan} />
			</section>

			{stats && stats.placeholder > 0 && (
				<div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
					<TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
					<div className="text-sm text-amber-900">
						<p className="font-bold">
							{stats.placeholder} akun masih memakai nama/email sementara.
						</p>
						<p className="mt-1 text-amber-800">
							Data ini hasilAgreed placeholder supaya portal wali sudah bisa dipakai.
							Silakan ganti nama asli dan email asli wali satu per satu di tabel
							berikut. Password awal wali sama untuk semua akun dan bisa
							diganti sendiri setelah login.
						</p>
					</div>
				</div>
			)}

			<div className="flex flex-wrap items-center gap-3">
				<div className="relative min-w-[260px] flex-1">
					<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<input
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="Cari nama wali, email, atau nama Santri..."
						className={inputClass + ' pl-9'}
					/>
				</div>
				<label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
					<input
						type="checkbox"
						checked={onlyPlaceholder}
						onChange={(e) => setOnlyPlaceholder(e.target.checked)}
						className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
					/>
					Hanya yang perlu dilengkapi
				</label>
			</div>

			{loading ? (
				<div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
					Memuat daftar akun wali...
				</div>
			) : filtered.length === 0 ? (
				<div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
					Tidak ada akun wali yang cocok dengan filter.
				</div>
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
											<input
												value={draft.name}
												onChange={(e) => setDraft({ ...draft, name: e.target.value })}
												className={inputClass + ' min-w-[220px]'}
											/>
										) : (
											<span className="font-semibold text-slate-800">{a.name || '(kosong)'}</span>
										)}
										<span className="mt-0.5 block text-xs text-slate-400">ID akun {a.user_id}</span>
									</td>
									<td className="px-4 py-3">
										{editing === a.user_id ? (
											<input
												value={draft.email}
												onChange={(e) => setDraft({ ...draft, email: e.target.value })}
												className={inputClass + ' min-w-[260px]'}
											/>
										) : (
											<span className="font-mono text-xs text-slate-600">{a.email}</span>
										)}
									</td>
									<td className="px-4 py-3 font-mono text-xs text-slate-600">
										{a.whatsapp || <span className="text-amber-600">belum ada</span>}
									</td>
									<td className="px-4 py-3">
										<ul className="space-y-0.5">
											{a.santri.map((s) => (
												<li key={s.santri_id} className="text-slate-700">
													<span className="font-medium">{s.name}</span>
													<span className="ml-1.5 text-xs text-slate-400">
														{s.class ? `(${s.class})` : ''} {s.nis}
													</span>
												</li>
											))}
										</ul>
									</td>
									<td className="px-4 py-3">
										{a.is_placeholder ? (
											<span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
												<AlertTriangle className="h-3 w-3" />
												Perlu dilengkapi
											</span>
										) : (
											<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
												<BadgeCheck className="h-3 w-3" />
												Lengkap
											</span>
										)}
										{a.last_login_at && (
											<span className="mt-1 block text-xs text-slate-400">
												Login terakhir: {a.last_login_at}
											</span>
										)}
									</td>
									<td className="px-4 py-3">
										{editing === a.user_id ? (
											<div className="flex justify-end gap-2">
												<button
													type="button"
													onClick={cancelEdit}
													disabled={saving}
													className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
												>
													<X className="h-3.5 w-3.5" />
													Batal
												</button>
												<button
													type="button"
													onClick={() => void saveEdit(a)}
													disabled={saving}
													className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-sky-700 disabled:opacity-50"
												>
													{editing === a.user_id && saving ? 'Menyimpan...' : 'Simpan'}
												</button>
											</div>
										) : (
											<button
												type="button"
												onClick={() => startEdit(a)}
												className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
											>
												<Pencil className="h-3.5 w-3.5" />
												Ubah
											</button>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{data && data.orphans.length > 0 && (
				<section className="rounded-2xl border border-slate-200 bg-white p-5">
					<h2 className="text-base font-black text-slate-900">
						Akun yatim ({data.orphans.length})
					</h2>
					<p className="mt-1 text-sm text-slate-500">
						Akun portal yang tidak punya Santri tertaut. Akun ini sengaja tidak
						dihapus. Sebagian berasal dari import wali: saat saudara digabung ke satu
						akun keluarga, akun lamanya menjadi tidak terpakai.
					</p>
					<div className="mt-3 flex flex-wrap gap-2">
						{data.orphans.map((o) => (
							<span
								key={o.user_id}
								className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600"
							>
								#{o.user_id} {o.name} · <span className="font-mono">{o.email}</span>
							</span>
						))}
					</div>
				</section>
			)}
		</div>
	);
}

function StatCard({
	label,
	value,
	icon,
	tone,
}: {
	label: string;
	value?: number;
	icon?: React.ReactNode;
	tone?: 'warn';
}) {
	return (
		<div
			className={
				'rounded-2xl border p-4 ' +
				(tone === 'warn'
					? 'border-amber-200 bg-amber-50'
					: 'border-slate-200 bg-white')
			}
		>
			<p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
				{icon}
				{label}
			</p>
			<p
				className={
					'mt-1 text-2xl font-black ' +
					(tone === 'warn' ? 'text-amber-700' : 'text-slate-900')
				}
			>
				{value ?? 0}
			</p>
		</div>
	);
}