'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getMessages, markMessageAsRead, deleteMessage, Message } from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';
import { 
  Mail, 
  MessageSquare, 
  Trash2, 
  CheckCircle, 
  RefreshCw, 
  Phone, 
  User, 
  Clock, 
  Search,
  Inbox,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  MessageCircle
} from 'lucide-react';

export default function MessagesAdminPage() {
	const buildWhatsAppLink = (name: string, whatsapp?: string) => {
		const cleanPhone = (whatsapp || '').replace(/\D/g, '');
		if (!cleanPhone) return '';
		const text = `Assalamualaikum Bapak/Ibu ${name}, kami dari Pondok Pesantren Darussunnah ingin merespon pesan Anda.`;
		return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
	};

	const filterTabs: Array<{ id: 'all' | 'unread' | 'read'; label: string }> = [
		{ id: 'all', label: 'Semua' },
		{ id: 'unread', label: 'Baru' },
		{ id: 'read', label: 'Terbaca' },
	];

	const [messages, setMessages] = useState<Message[]>([]);
	const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'read'>('all');
	const [searchQuery, setSearchQuery] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [isDeleting, setIsDeleting] = useState(false);
	const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
	
	// Confirmation states
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [idToDelete, setIdToDelete] = useState<number | null>(null);

	const { showToast } = useToast();

	const fetchMessages = useCallback(async (search = searchQuery, filter = activeFilter) => {
		setIsLoading(true);
		try {
			const isRead = filter === 'all' ? undefined : (filter === 'read');
			const data = await getMessages({ isRead, search });
			setMessages(data);
		} catch {
			showToast('error', 'Gagal memuat pesan masuk.');
		} finally {
			setIsLoading(false);
		}
	}, [searchQuery, activeFilter, showToast]);

	useEffect(() => {
		const timer = setTimeout(() => {
			fetchMessages();
		}, 500);
		return () => clearTimeout(timer);
	}, [searchQuery, activeFilter, fetchMessages]);

	const handleMarkRead = async (id: number) => {
		const res = await markMessageAsRead(id);
		if (res.success) {
			showToast('success', 'Pesan ditandai sebagai dibaca');
			fetchMessages();
			if (selectedMessage?.id === id) {
				setSelectedMessage({ ...selectedMessage, is_read: true });
			}
		} else {
			showToast('error', 'Gagal memperbarui status pesan');
		}
	};

	const handleDelete = async () => {
		if (!idToDelete) return;
		setIsDeleting(true);
		try {
			const res = await deleteMessage(idToDelete);
			if (res.success) {
				showToast('success', 'Pesan berhasil dihapus secara permanen.');
				setSelectedMessage(null);
				fetchMessages();
				setIsDeleteOpen(false);
			} else {
				showToast('error', 'Gagal menghapus pesan.');
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
			showToast('error', message);
		} finally {
			setIsDeleting(false);
		}
	};

	const openModal = (msg: Message) => {
		setSelectedMessage(msg);
		if (!msg.is_read) {
			handleMarkRead(msg.id);
		}
	};

	const unreadCount = messages.filter(m => !m.is_read).length;

	return (
		<div className="pb-10 font-outfit">
			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
				<div>
					<h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight">Kotak Masuk Publik</h1>
					<p className="text-slate-500 text-sm font-medium">Layanan komunikasi satu pintu untuk manajemen pesan pengunjung.</p>
				</div>
				<button 
					onClick={() => fetchMessages()}
					className="flex items-center justify-center p-4 bg-white text-slate-400 rounded-lg border border-slate-200 hover:text-emerald-700 hover:border-emerald-200 transition-all shadow-sm group active:scale-95"
					title="Segarkan Kotak Masuk"
				>
					<RefreshCw size={22} className={isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'} />
				</button>
			</div>

			{/* Stats & Filters Row */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
				<div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm group hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-500 flex items-center gap-6">
					<div className="w-16 h-16 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-inner">
						<Inbox size={28} />
					</div>
					<div>
						<p className="text-3xl font-black text-slate-900">{messages.length >= 10 ? messages.length : `0${messages.length}`}</p>
						<p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Komunikasi</p>
					</div>
				</div>

				<div className="bg-white p-8 rounded-xl border border-emerald-100 shadow-sm group hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-500 flex items-center gap-6">
					<div className="w-16 h-16 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-inner">
						<CheckCircle2 size={28} />
					</div>
					<div>
						<p className="text-3xl font-black text-slate-900">{messages.filter(m => m.is_read).length}</p>
						<p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pesan Terarsip</p>
					</div>
				</div>

				<div className="bg-rose-950 p-8 rounded-xl shadow-2xl shadow-rose-900/20 group hover:scale-[1.02] transition-all duration-500 flex items-center gap-6 relative overflow-hidden">
					<div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
					<div className="w-16 h-16 bg-rose-900 rounded-lg flex items-center justify-center text-rose-300 border border-rose-800 shadow-lg relative z-10">
						<AlertCircle size={28} className={unreadCount > 0 ? 'animate-bounce' : ''} />
					</div>
					<div className="relative z-10">
						<p className="text-3xl font-black text-white">{unreadCount >= 10 ? unreadCount : `0${unreadCount}`}</p>
						<p className="text-[10px] font-black uppercase tracking-widest text-rose-300">Menunggu Respon</p>
					</div>
				</div>
			</div>

			{/* Filter Tabs & Search */}
			<div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-10">
				<div className="flex flex-col lg:flex-row items-center gap-6">
					<div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-100 shadow-inner w-full lg:w-auto">
						{filterTabs.map((tab) => (
							<button 
								key={tab.id}
								onClick={() => setActiveFilter(tab.id)}
							className={`flex-1 lg:flex-none px-8 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
									activeFilter === tab.id 
										? 'bg-white text-emerald-700 shadow-md border border-slate-100' 
										: 'text-slate-400 hover:text-slate-600'
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>

					<div className="flex-1 relative group w-full">
						<Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-700 transition-colors" size={20} />
						<input 
							type="text"
							placeholder="Cari pesan berdasarkan nama pengirim, email, atau isi pesan..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-16 pr-8 py-4 bg-slate-50 border border-slate-100 focus:bg-white focus:border-emerald-500 rounded-xl text-sm font-bold transition-all outline-none shadow-inner"
						/>
						{searchQuery && (
							<button onClick={() => setSearchQuery('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 transition-colors">
								<X size={18} />
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Messages Listing */}
			<div className="bg-white rounded-xl border border-slate-200 shadow-2xl shadow-slate-200/40 overflow-hidden mb-12">
				{isLoading && messages.length === 0 ? (
					<div className="py-40 flex flex-col items-center justify-center animate-pulse">
						<div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mb-6">
							<Inbox className="text-slate-200" size={40} />
						</div>
						<p className="text-slate-300 font-black uppercase tracking-[0.3em] text-xs">Menyinkronkan Kotak Masuk...</p>
					</div>
				) : messages.length === 0 ? (
					<div className="py-40 text-center">
						<div className="w-24 h-24 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-8 shadow-inner">
							<Mail className="text-slate-200" size={48} />
						</div>
						<h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight font-outfit">Kotak Masuk Steril</h3>
						<p className="text-slate-400 max-w-xs mx-auto text-sm font-medium">Tidak ada pesan yang masuk untuk saat ini atau hasil pencarian nihil.</p>
					</div>
				) : (
					<div className="overflow-x-auto min-h-[400px]">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
									<th className="pl-10 pr-6 py-8">Identitas Pengirim</th>
									<th className="px-6 py-8">Pratinjau Pesan</th>
									<th className="px-6 py-8">Kronologi</th>
									<th className="pr-10 pl-6 py-8 text-right">Opsi Manajemen</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{messages.map((msg) => (
									<tr 
										key={msg.id} 
										className={`group hover:bg-emerald-50/40 transition-all duration-500 cursor-pointer ${!msg.is_read ? 'bg-emerald-50/40' : ''}`}
										onClick={() => openModal(msg)}
									>
										<td className="pl-10 pr-6 py-8">
											<div className="flex items-center gap-4">
												<div className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-500 ${!msg.is_read ? 'bg-emerald-600 text-white shadow-emerald-100 ring-4 ring-emerald-200/50' : 'bg-slate-100 text-slate-400 ring-4 ring-slate-50'}`}>
													{msg.is_read ? <Mail size={20} /> : <MessageSquare size={20} />}
												</div>
												<div>
													<div className={`text-base font-black uppercase tracking-tight ${!msg.is_read ? 'text-slate-900' : 'text-slate-600'}`}>{msg.name}</div>
													<div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">{msg.whatsapp || msg.email || 'Tanpa Kontak'}</div>
												</div>
											</div>
										</td>
										<td className="px-6 py-8">
											<p className={`text-sm line-clamp-1 max-w-md ${!msg.is_read ? 'text-slate-800 font-bold italic' : 'text-slate-500'}`}>
												&quot;{msg.message}&quot;
											</p>
										</td>
										<td className="px-6 py-8">
											<div className="flex flex-col gap-1 text-[10px] font-black text-slate-300 uppercase tracking-widest">
												<div className="flex items-center gap-2">
													<Clock size={12} className="text-slate-200" />
													{new Date(msg.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
												</div>
												{!msg.is_read && (
													<span className="text-emerald-500 animate-pulse flex items-center gap-1.5 mt-1">
														<div className="w-1.5 h-1.5 rounded-full bg-current"></div>
														Menunggu Tindak Lanjut
													</span>
												)}
											</div>
										</td>
										<td className="pr-10 pl-6 py-8 text-right">
											<div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
												{msg.whatsapp && buildWhatsAppLink(msg.name, msg.whatsapp) && (
													<a
														href={buildWhatsAppLink(msg.name, msg.whatsapp)}
														target="_blank"
														rel="noreferrer"
														onClick={(e) => e.stopPropagation()}
														className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-100 transition-all"
													>
														<MessageCircle size={15} />
														Kirim WA
													</a>
												)}
												<button 
													onClick={(e) => { e.stopPropagation(); setIdToDelete(msg.id); setIsDeleteOpen(true); }}
													className="p-3.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
												>
													<Trash2 size={20} />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Message Detail Modal (Slide-in Style) */}
			{selectedMessage && (
				<div className="fixed inset-0 z-[100] flex items-center justify-end p-0 sm:p-6 backdrop-blur-sm">
					<div className="absolute inset-0 bg-slate-900/40" onClick={() => setSelectedMessage(null)}></div>
					<div className="bg-white w-full max-w-2xl h-full sm:h-auto sm:max-h-[95vh] sm:rounded-xl shadow-2xl relative overflow-hidden flex flex-col animate-in slide-in-from-right duration-500">
						
						{/* Modal Header */}
						<div className="px-10 py-12 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center relative overflow-hidden">
							<div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full -ml-16 -mt-16"></div>
							<div className="flex gap-6 relative z-10">
								<div className="w-16 h-16 bg-emerald-600 shadow-2xl shadow-emerald-200 rounded-lg flex items-center justify-center text-white ring-4 ring-emerald-50">
									<Send size={32} />
								</div>
								<div>
									<h2 className="text-2xl font-black text-slate-900 font-outfit uppercase tracking-tight mb-1">Korespondensi Publik</h2>
									<div className="flex items-center gap-2">
										<Clock size={12} className="text-slate-400" />
										<p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{new Date(selectedMessage.created_at).toLocaleString('id-ID')}</p>
									</div>
								</div>
							</div>
							<button onClick={() => setSelectedMessage(null)} className="p-4 bg-white text-slate-400 hover:text-slate-600 rounded-lg border border-slate-200 transition-all font-black uppercase text-[10px] tracking-widest shadow-sm hover:shadow-md active:scale-95">
								Tutup
							</button>
						</div>

						{/* Modal Content */}
						<div className="p-10 space-y-12 overflow-y-auto flex-1 custom-scrollbar">
							<div className="flex flex-col md:flex-row gap-10">
								<div className="flex-1 space-y-4">
									<div className="flex items-center gap-3">
										<div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
											<User size={18} />
										</div>
										<label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pengirim</label>
									</div>
									<p className="text-2xl font-black text-slate-900 font-outfit uppercase tracking-tight">{selectedMessage.name}</p>
								</div>
								
								<div className="flex-1 space-y-4">
									<div className="flex items-center gap-3">
										<div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
											<ShieldAlert size={18} />
										</div>
										<label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status Verifikasi</label>
									</div>
									<div className={`flex items-center gap-3 font-black text-xs uppercase tracking-widest ${selectedMessage.is_read ? 'text-emerald-600' : 'text-amber-600'}`}>
										{selectedMessage.is_read ? (
											<><CheckCircle size={20} className="fill-emerald-50" /> Pesan Terarsip</>
										) : (
											<><div className="w-3 h-3 rounded-full bg-amber-500 animate-ping" /> Menunggu Respon</>
										)}
									</div>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-8 rounded-xl border border-slate-100 shadow-inner">
								<div className="space-y-2">
									<label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Saluran WhatsApp</label>
									<a href={selectedMessage.whatsapp ? `tel:${selectedMessage.whatsapp}` : '#'} className="flex items-center gap-3 text-slate-800 font-black hover:text-emerald-700 transition-colors">
										<Phone size={14} className="text-emerald-500" />
										{selectedMessage.whatsapp || 'Tidak Tersedia'}
									</a>
								</div>
								<div className="space-y-2">
									<label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Alamat Email</label>
									<a href={`mailto:${selectedMessage.email}`} className="flex items-center gap-3 text-slate-800 font-black hover:text-emerald-700 transition-colors">
										<Mail size={14} className="text-emerald-500" />
										{selectedMessage.email || 'Tidak Tersedia'}
									</a>
								</div>
							</div>

							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
										<MessageSquare size={18} />
									</div>
									<label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Substansi Komunikasi</label>
								</div>
								<div className="p-10 bg-white border-2 border-slate-100 rounded-xl text-slate-700 leading-relaxed font-bold italic shadow-xl shadow-slate-100/50 whitespace-pre-wrap text-lg">
									&quot;{selectedMessage.message}&quot;
								</div>
							</div>
						</div>

						{/* Modal Actions */}
						<div className="p-10 bg-white border-t border-slate-100 flex flex-col sm:flex-row gap-5">
							{buildWhatsAppLink(selectedMessage.name, selectedMessage.whatsapp) && (
								<a 
									href={buildWhatsAppLink(selectedMessage.name, selectedMessage.whatsapp)}
									target="_blank"
									rel="noreferrer"
									className="flex-[2] py-5 bg-slate-900 text-white rounded-lg font-black uppercase tracking-[0.15em] text-xs hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/10 flex items-center justify-center gap-4 group"
								>
									<Phone size={18} className="group-hover:rotate-12 transition-transform" /> Balas via WhatsApp
								</a>
							)}
							<button 
								onClick={() => { setIdToDelete(selectedMessage.id); setIsDeleteOpen(true); }}
								className="flex-1 py-5 bg-white text-rose-600 border border-rose-100 rounded-lg font-black uppercase tracking-[0.15em] text-xs hover:bg-rose-50 transition-all flex items-center justify-center gap-3 active:scale-95"
							>
								<Trash2 size={18} /> Lumpuhkan
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Confirm Delete */}
			<ConfirmDialog 
				isOpen={isDeleteOpen}
				onClose={() => { setIsDeleteOpen(false); setIdToDelete(null); }}
				onConfirm={handleDelete}
				isLoading={isDeleting}
				title="Musnahkan Pesan?"
				message="Tindakan ini akan menghapus jejak komunikasi ini secara permanen dari server Darussunnah. Data tidak dapat dipulihkan kembali."
				confirmText="YA, HAPUS PERMANEN"
			/>
		</div>
	);
}
