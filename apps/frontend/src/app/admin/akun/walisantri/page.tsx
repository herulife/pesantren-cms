'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	getWaliSantriAccounts,
	updateWaliSantriAccount,
	createWaliSantriAccount,
	resetWaliSantriPassword,
	getAttendanceStudents,
	WaliAccount,
	WaliList,
	AttendanceStudent,
} from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/components/AuthProvider';
import {
	AlertTriangle,
	BadgeCheck,
	KeyRound,
	Pencil,
	Plus,
	RefreshCw,
	Search,
	TriangleAlert,
	Users,
	X,
} from 'lucide-react';

const inputClass =
	'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10';

type EditDraft = { name: string; email: string; whatsapp: string };

export default function WaliSantriAccountsPage() {
	const { showToast } = useToast();
	const { user, loading: authLoading } = useAuth();
	// Backend juga menegakkan RequireRole, jadi ini hanya pesan ramah.
	const allowed = user?.role === 'superadmin' || user?.role === 'bendahara';
	const [data, setData] = useState<WaliList | null>(null);
	const [loading, setLoading] = useState(true);
	const [q, setQ] = useState('');
	const [onlyPlaceholder, setOnlyPlaceholder] = useState(false);
	const [editing, setEditing] = useState<number | null>(null);
	const [draft, setDraft] = useState<EditDraft>({ name: '', email: '', whatsapp: '' });
	const [saving, setSaving] = useState(false);

	const [showCreate, setShowCreate] = useState(false);
	const [creating, setCreating] = useState(false);
	const [createDraft, setCreateDraft] = useState({
		name: '',
		email: '',
		whatsapp: '',
		password: '',
	});
	const [studentQ, setStudentQ] = useState('');
	const [students, setStudents] = useState<AttendanceStudent[]>([]);
	const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());

	const [resetting, setResetting] = useState<number | null>(null);
	const [resetPass, setResetPass] = useState('');
	const [resetSaving, setResetSaving] = useState(false);

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
		if (authLoading || !allowed) return;
		void load();
	}, [load, authLoading, allowed]);

	const filtered = useMemo(() => {
		if (!data) return [];
		const needle = q.trim().toLowerCase();
		return data.accounts.filter((a) => {
			if (onlyPlaceholder && !a.name_placeholder) return false;
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
		setDraft({ name: a.name, email: a.email, whatsapp: a.whatsapp || '' });
	}

	function cancelEdit() {
		setEditing(null);
		setDraft({ name: '', email: '', whatsapp: '' });
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
				whatsapp: draft.whatsapp.trim() || undefined,
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

	const linkedStudentIds = useMemo(() => {
		const ids = new Set<number>();
		(data?.accounts ?? []).forEach((a) => a.santri.forEach((s) => ids.add(s.santri_id)));
		return ids;
	}, [data]);

	const filteredStudents = useMemo(() => {
		const needle = studentQ.trim().toLowerCase();
		if (!needle) return students;
		return students.filter(
			(s) => s.name.toLowerCase().includes(needle) || (s.nis || '').toLowerCase().includes(needle)
		);
	}, [students, studentQ]);

	function toggleStudent(id: number) {
		setSelectedStudents((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	function resetCreate() {
		setCreateDraft({ name: '', email: '', whatsapp: '', password: '' });
		setSelectedStudents(new Set());
		setStudentQ('');
		setStudents([]);
	}

	function openCreate() {
		resetCreate();
		setShowCreate(true);
		void getAttendanceStudents().then((list) => setStudents(list));
	}

	async function submitCreate() {
		if (!createDraft.name.trim()) {
			showToast('error', 'Nama wali wajib diisi.');
			return;
		}
		if (!createDraft.email.trim()) {
			showToast('error', 'Email wali wajib diisi.');
			return;
		}
		if (createDraft.password.length < 8) {
			showToast('error', 'Password minimal 8 karakter.');
			return;
		}
		setCreating(true);
		try {
			const res = await createWaliSantriAccount({
				name: createDraft.name.trim(),
				email: createDraft.email.trim(),
				whatsapp: createDraft.whatsapp.trim() || undefined,
				password: createDraft.password,
				santri_ids: [...selectedStudents],
			});
			if (!res.ok) {
				showToast('error', res.message || 'Gagal membuat akun wali.');
				return;
			}
			showToast('success', `Akun wali dibuat (ID ${res.user_id}). Sampaikan password ke wali.`);
			setShowCreate(false);
			resetCreate();
			await load();
		} finally {
			setCreating(false);
		}
	}

	async function submitReset(userId: number) {
		if (resetPass.length < 8) {
			showToast('error', 'Password minimal 8 karakter.');
			return;
		}
		setResetSaving(true);
		try {
			const res = await resetWaliSantriPassword(userId, resetPass);
			if (!res.ok) {
				showToast('error', res.message || 'Gagal mereset password.');
				return;
			}
			showToast('success', 'Password akun wali direset. Sesinya ikut dicabut.');
			setResetting(null);
			setResetPass('');
		} finally {
			setResetSaving(false);
		}
	}

	const stats = data?.stats;

	return (
		<div className="space-y-6">
			{!authLoading && !allowed ? (
				<div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center">
					<TriangleAlert className="mx-auto h-8 w-8 text-rose-600" />
					<p className="mt-3 text-base font-black text-rose-900">Akses ditolak</p>
					<p className="mt-1 text-sm text-rose-700">
						Halaman ini hanya untuk Super Admin dan Bendahara.
					</p>
				</div>
			) : (
			<>
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-black tracking-tight text-slate-900">
						Akun Wali Santri
					</h1>
					<p className="mt-1 text-sm text-slate-500">
						Satu akun untuk satu keluarga. Kalau satu keluarga punya lebih dari
						satu Santri, semuanya bisa login pakai akun yang sama.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={openCreate}
						className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sky-700"
					>
						<Plus className="h-4 w-4" />
						Buat Akun Wali
					</button>
					<button
						type="button"
						onClick={() => void load()}
						disabled={loading}
						className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
					>
						<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
						Muat Ulang
					</button>
				</div>
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
						<p className="font-bold">
							{stats.placeholder} akun masih memakai nama karangan.
						</p>
						<p className="mt-1 text-amber-800">
							Data ini hasil import otomatis supaya portal wali sudah bisa dipakai.
							Semua email masih memakai domain @almaparung.local dan harus diganti
							ke email asli wali satu per satu di tabel berikut. Password awal
							wali sama untuk semua akun dan bisa diganti sendiri setelah login.
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
					Hanya nama karangan
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
									<td className="px-4 py-3">
										{editing === a.user_id ? (
											<input
												value={draft.whatsapp}
												onChange={(e) =>
													setDraft({ ...draft, whatsapp: e.target.value })
												}
												placeholder="contoh: 08xx..."
												className={inputClass + ' min-w-[150px] font-mono'}
											/>
										) : a.whatsapp ? (
											<span className="font-mono text-xs text-slate-600">{a.whatsapp}</span>
										) : (
											<span className="font-mono text-xs font-medium text-amber-600">
												belum ada
											</span>
										)}
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
										{a.name_placeholder ? (
											<span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
												<AlertTriangle className="h-3 w-3" />
												Nama karangan
											</span>
										) : (
											<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
												<BadgeCheck className="h-3 w-3" />
												Nama asli
											</span>
										)}
										{a.needs_note && (
											<span className="mt-1 block text-xs leading-4 text-amber-700">
												{a.needs_note}
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
											<div className="flex justify-end gap-2">
												<button
													type="button"
													onClick={() => {
														setResetPass('');
														setResetting(a.user_id);
													}}
													className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
												>
													<KeyRound className="h-3.5 w-3.5" />
													Reset
												</button>
												<button
													type="button"
													onClick={() => startEdit(a)}
													className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
												>
													<Pencil className="h-3.5 w-3.5" />
													Ubah
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

			{showCreate && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
					<div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
						<div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
							<h2 className="text-base font-black text-slate-900">Buat Akun Wali Santri</h2>
							<button
								type="button"
								onClick={() => setShowCreate(false)}
								disabled={creating}
								className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
						<div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-600">Nama wali *</label>
								<input
									value={createDraft.name}
									onChange={(e) => setCreateDraft({ ...createDraft, name: e.target.value })}
									placeholder="Nama lengkap wali"
									className={inputClass}
								/>
							</div>
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-600">Email login *</label>
								<input
									type="email"
									value={createDraft.email}
									onChange={(e) => setCreateDraft({ ...createDraft, email: e.target.value })}
									placeholder="nama@email.com"
									className={inputClass}
								/>
							</div>
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-600">No. HP WhatsApp (opsional)</label>
								<input
									value={createDraft.whatsapp}
									onChange={(e) => setCreateDraft({ ...createDraft, whatsapp: e.target.value })}
									placeholder="contoh: 08xx..."
									className={inputClass + ' font-mono'}
								/>
							</div>
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-600">Password awal * (min. 8 karakter)</label>
								<input
									type="password"
									value={createDraft.password}
									onChange={(e) => setCreateDraft({ ...createDraft, password: e.target.value })}
									placeholder="Password awal untuk wali"
									className={inputClass}
								/>
							</div>
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-600">
									Tautkan Santri (opsional, boleh lebih dari satu = satu keluarga)
								</label>
								<input
									value={studentQ}
									onChange={(e) => setStudentQ(e.target.value)}
									placeholder="Cari nama / NIS santri..."
									className={inputClass}
								/>
								<div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white">
									{filteredStudents.length === 0 ? (
										<p className="p-3 text-sm text-slate-400">Tidak ada santri yang cocok.</p>
									) : (
										filteredStudents.map((s) => (
											<button
												type="button"
												key={s.id}
												onClick={() => toggleStudent(s.id)}
												className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2 text-left transition last:border-0 hover:bg-sky-50"
											>
												<input
													type="checkbox"
													readOnly
													checked={selectedStudents.has(s.id)}
													className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
												/>
												<div className="min-w-0 flex-1">
													<div className="truncate text-sm font-semibold text-slate-800">{s.name}</div>
													<div className="truncate text-xs text-slate-400">
														{s.class ? `${s.class} · ` : ''}{s.nis}
													</div>
												</div>
												{linkedStudentIds.has(s.id) && (
													<span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
														sudah berakun
													</span>
												)}
											</button>
										))
									)}
								</div>
							</div>
						</div>
						<div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
							<button
								type="button"
								onClick={() => setShowCreate(false)}
								disabled={creating}
								className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
							>
								Batal
							</button>
							<button
								type="button"
								onClick={() => void submitCreate()}
								disabled={creating}
								className="inline-flex items-center gap-1 rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-700 disabled:opacity-50"
							>
								{creating ? 'Menyimpan...' : 'Simpan Akun'}
							</button>
						</div>
					</div>
				</div>
			)}

			{resetting !== null && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
					<div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
						<div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
							<h2 className="text-base font-black text-slate-900">Reset Password</h2>
							<button
								type="button"
								onClick={() => setResetting(null)}
								disabled={resetSaving}
								className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
						<div className="space-y-4 px-5 py-4">
							<p className="text-sm text-slate-600">
								Tulis password baru untuk akun ini. Sesi login wali yang masih aktif
								otomatis dicabut — wali harus login ulang.
							</p>
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-slate-600">
									Password baru * (min. 8 karakter)
								</label>
								<input
									type="password"
									value={resetPass}
									onChange={(e) => setResetPass(e.target.value)}
									placeholder="Password baru"
									autoFocus
									className={inputClass}
								/>
							</div>
						</div>
						<div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
							<button
								type="button"
								onClick={() => setResetting(null)}
								disabled={resetSaving}
								className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
							>
								Batal
							</button>
							<button
								type="button"
								onClick={() => void submitReset(resetting)}
								disabled={resetSaving}
								className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
							>
								{resetSaving ? 'Menyimpan...' : 'Reset Password'}
							</button>
						</div>
					</div>
				</div>
			)}
			</>
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