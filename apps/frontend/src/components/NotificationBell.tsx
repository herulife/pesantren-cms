'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, X } from 'lucide-react';
import { useAuth } from './AuthProvider';
import {
	getSysNotifications,
	getSysNotificationUnread,
	markAllSysNotificationsRead,
	markSysNotificationRead,
	type SysNotificationItem
} from '@/lib/api';

function formatRelativeTime(iso: string): string {
	if (!iso) return '';
	const then = new Date(iso).getTime();
	if (Number.isNaN(then)) return '';
	const diff = Date.now() - then;
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return 'baru saja';
	if (mins < 60) return `${mins} mnt lalu`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours} jam lalu`;
	const days = Math.floor(hours / 24);
	return days === 1 ? 'kemarin' : `${days} hari lalu`;
}

const TYPE_ICON: Record<string, string> = {
	psb_pendaftar: '📝',
	pesan_kontak: '✉️',
	donasi: '💝',
	pembayaran: '💳',
	user_baru: '👤'
};

export default function NotificationBell() {
	const { user } = useAuth();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [items, setItems] = useState<SysNotificationItem[]>([]);
	const [unread, setUnread] = useState(0);
	const [loading, setLoading] = useState(false);
	const panelRef = useRef<HTMLDivElement>(null);

	const isAdmin = !!user && user.role !== 'user';

	const refreshUnread = useCallback(async () => {
		if (!isAdmin) return;
		try {
			const res = await getSysNotificationUnread();
			if (res.data && typeof res.data.count === 'number') {
				setUnread(res.data.count);
			}
		} catch {
			// abaikan; polling berikutnya akan mencoba lagi
		}
	}, [isAdmin]);

	const refreshList = useCallback(async () => {
		if (!isAdmin) return;
		setLoading(true);
		try {
			const res = await getSysNotifications();
			if (res.data) {
				setItems(res.data.items ?? []);
				setUnread(res.data.unread_count ?? 0);
			}
		} catch {
			// abaikan; dropdown menampilkan data lama bila ada
		} finally {
			setLoading(false);
		}
	}, [isAdmin]);

	useEffect(() => {
		if (!isAdmin) return;
		refreshUnread();
		const id = setInterval(refreshUnread, 30000);
		return () => clearInterval(id);
	}, [isAdmin, refreshUnread]);

	useEffect(() => {
		const onClickOutside = (e: MouseEvent) => {
			if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener('mousedown', onClickOutside);
		return () => document.removeEventListener('mousedown', onClickOutside);
	}, []);

	if (!isAdmin) return null;

	const toggle = () => {
		const next = !open;
		setOpen(next);
		if (next) refreshList();
	};

	const openItem = async (item: SysNotificationItem) => {
		if (!item.read) {
			setUnread((n) => Math.max(0, n - 1));
			setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, read: true } : it)));
			markSysNotificationRead(item.id).catch(() => {});
		}
		setOpen(false);
		if (item.link) router.push(item.link);
	};

	const markAll = async () => {
		setUnread(0);
		setItems((prev) => prev.map((it) => ({ ...it, read: true })));
		await markAllSysNotificationsRead().catch(() => {});
	};

	return (
		<div ref={panelRef} className="relative">
			<button
				type="button"
				aria-label="Notifikasi"
				title="Notifikasi"
				onClick={toggle}
				className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:text-sky-700"
			>
				<Bell size={18} />
				{unread > 0 && (
					<span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow">
						{unread > 99 ? '99+' : unread}
					</span>
				)}
			</button>

			{open && (
				<div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl focus:outline-none sm:w-96">
					<div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
						<p className="text-sm font-black uppercase tracking-[0.14em] text-sky-700">
							Notifikasi
						</p>
						<div className="flex items-center gap-1">
							{items.length > 0 && (
								<button
									type="button"
									onClick={markAll}
									className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-sky-700"
									title="Tandai semua dibaca"
								>
									<CheckCheck size={14} />
									Semua dibaca
								</button>
							)}
							<button
								type="button"
								onClick={() => setOpen(false)}
								className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
								aria-label="Tutup notifikasi"
							>
								<X size={16} />
							</button>
						</div>
					</div>

					<div className="max-h-96 overflow-y-auto">
						{loading && items.length === 0 ? (
							<p className="px-4 py-8 text-center text-sm text-slate-400">Memuat…</p>
						) : items.length === 0 ? (
							<p className="px-4 py-8 text-center text-sm text-slate-400">
								Belum ada notifikasi
							</p>
						) : (
							items.map((item) => (
								<button
									key={item.id}
									type="button"
									onClick={() => openItem(item)}
									className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-sky-50 ${
										item.read ? 'opacity-60' : ''
									}`}
								>
									<span className="mt-0.5 text-lg leading-none" aria-hidden="true">
										{TYPE_ICON[item.type] ?? '🔔'}
									</span>
									<span className="min-w-0 flex-1">
										<span className="flex items-center gap-2">
											<span className="truncate text-[13px] font-bold text-slate-800">
												{item.title}
											</span>
											{!item.read && (
												<span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />
											)}
										</span>
										<span className="mt-0.5 block truncate text-xs text-slate-500">
											{item.message}
										</span>
										<span className="mt-0.5 block text-[11px] text-slate-400">
											{formatRelativeTime(item.created_at)}
										</span>
									</span>
								</button>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
}