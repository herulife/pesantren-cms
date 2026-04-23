'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getPrograms, deleteProgram, updateProgram, createProgram, uploadImage, Program, normalizeApiAssetUrl, resolveDisplayImageUrl, slugifyContentKey } from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import ImageCropperModal from '@/components/ImageCropperModal';
import GallerySelectionModal from '@/components/GallerySelectionModal';
import { useToast } from '@/components/Toast';
import { Plus, Trash2, Layers, Star, Search, X, Save, Pencil, Upload, Eye, EyeOff, LayoutPanelLeft, Image as ImageIcon } from 'lucide-react';

export default function ProgramsAdminPage() {
	const router = useRouter();
	const [programs, setPrograms] = useState<Program[]>([]);
	const [activeTab, setActiveTab] = useState<'program' | 'ekskul'>('program');
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	
	// Modal states
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isCropperOpen, setIsCropperOpen] = useState(false);
	const [isGalleryOpen, setIsGalleryOpen] = useState(false);
	const [selectedId, setSelectedId] = useState<number | string | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	
	// Form states
	const [form, setForm] = useState<Omit<Program, 'id' | 'created_at' | 'updated_at'>>({
		title: '',
		slug: '',
		category: 'program',
		excerpt: '',
		content: '',
		image_url: '',
		is_featured: false,
		order_index: 0
	});
	const [tempImage, setTempImage] = useState<string | null>(null);
	const [croppedImage, setCroppedImage] = useState<Blob | null>(null);
	const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);

	const { showToast } = useToast();

	const fetchPrograms = useCallback(async (category = activeTab, search = searchQuery) => {
		setIsLoading(true);
		const data = await getPrograms({ category, search });
		setPrograms(data);
		setIsLoading(false);
	}, [searchQuery, activeTab]);

	useEffect(() => {
		const timer = setTimeout(() => {
			fetchPrograms(activeTab, searchQuery);
		}, 500);
		return () => clearTimeout(timer);
	}, [searchQuery, activeTab, fetchPrograms]);

	const handleDelete = async () => {
		if (!selectedId) return;
		setIsDeleting(true);
		try {
			const res = await deleteProgram(selectedId);
			if (res.success) {
				showToast('success', 'Program berhasil dihapus.');
				fetchPrograms();
				setIsDeleteOpen(false);
			} else {
				showToast('error', 'Gagal menghapus program.');
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
			showToast('error', message);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleOpenForm = (p?: Program) => {
		if (p) {
			setIsEditing(true);
			setSelectedId(p.id);
			setForm({
				title: p.title,
				slug: p.slug,
				category: p.category,
				excerpt: p.excerpt || '',
				content: p.content || '',
				image_url: p.image_url || '',
				is_featured: p.is_featured,
				order_index: p.order_index
			});
			setCroppedImageUrl(resolveDisplayImageUrl(p.image_url) || null);
			setCroppedImage(null);
		} else {
			setIsEditing(false);
			setSelectedId(null);
			setForm({
				title: '',
				slug: '',
				category: activeTab,
				excerpt: '',
				content: '',
				image_url: '',
				is_featured: false,
				order_index: 0
			});
			setCroppedImageUrl(null);
			setCroppedImage(null);
		}
		setIsFormOpen(true);
	};

	const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				setTempImage(reader.result as string);
				setIsCropperOpen(true);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleCropComplete = (blob: Blob) => {
		setCroppedImage(blob);
		setCroppedImageUrl(URL.createObjectURL(blob));
		setIsCropperOpen(false);
	};

	const handleGallerySelect = (url: string) => {
		const normalizedUrl = normalizeApiAssetUrl(url);
		setForm(prev => ({ ...prev, image_url: normalizedUrl }));
		setCroppedImageUrl(normalizedUrl);
		setCroppedImage(null);
		setIsGalleryOpen(false);
		showToast('success', 'Banner program dipilih dari galeri!');
	};

	const generateSlug = (title: string) => {
		return slugifyContentKey(title);
	};

	const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const title = e.target.value;
		setForm(prev => ({ 
			...prev, 
			title, 
			slug: isEditing ? prev.slug : generateSlug(title) 
		}));
	};

	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.title || !form.slug) {
			showToast('error', 'Judul dan Slug wajib diisi.');
			return;
		}

		setIsSubmitting(true);
		try {
			let finalImageUrl = normalizeApiAssetUrl(form.image_url);
			
			if (croppedImage) {
				const uploadRes = await uploadImage(new File([croppedImage], 'program.jpg', { type: 'image/jpeg' }));
				if (!uploadRes.url) throw new Error('Gagal upload gambar');
				finalImageUrl = normalizeApiAssetUrl(uploadRes.url);
			}

			if (isEditing && selectedId) {
				const res = await updateProgram(selectedId, { ...form, image_url: finalImageUrl });
				if (res.success) {
					showToast('success', 'Program berhasil diperbarui.');
					setIsFormOpen(false);
					fetchPrograms();
				} else {
					showToast('error', 'Gagal memperbarui program.');
				}
			} else {
				const res = await createProgram({ ...form, image_url: finalImageUrl });
				if (res.success) {
					showToast('success', 'Program baru berhasil ditambahkan.');
					setIsFormOpen(false);
					fetchPrograms();
				} else {
					showToast('error', 'Gagal menambahkan program.');
				}
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
			showToast('error', message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
				<div>
					<h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit uppercase tracking-tight">Eksperimen Pendidikan</h1>
					<p className="text-slate-500 text-sm font-medium">Kelola kurikulum unggulan dan kegiatan ekstrakurikuler santri.</p>
				</div>
				<button 
					onClick={() => router.push(`/admin/programs/form?category=${activeTab}`)}
					className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-lg font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95"
				>
					<Plus size={20} />
					<span>Tambah {activeTab === 'program' ? 'Program' : 'Ekskul'}</span>
				</button>
			</div>

			{/* Tabs & Search */}
			<div className="flex flex-col lg:flex-row gap-6 mb-10">
				<div className="flex gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
					<button 
						onClick={() => setActiveTab('program')}
						className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
							activeTab === 'program' 
								? 'bg-emerald-50 text-emerald-700 shadow-sm' 
								: 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
						}`}
					>
						Program Unggulan
					</button>
					<button 
						onClick={() => setActiveTab('ekskul')}
						className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
							activeTab === 'ekskul' 
								? 'bg-amber-50 text-amber-700 shadow-sm' 
								: 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
						}`}
					>
						Ekstrakurikuler
					</button>
				</div>

				<div className="flex-1 relative group bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
					<Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-700 transition-colors" size={18} />
					<input 
						type="text" 
						placeholder="Cari judul program atau materi..." 
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-16 pr-6 py-4 bg-transparent outline-none font-bold text-sm"
					/>
				</div>
			</div>

			{/* Results Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-10">
				{!isLoading ? (
					programs.length > 0 ? (
						programs.map((p) => (
							<div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-500 flex flex-col h-full relative">
								<div className="h-56 bg-slate-100 relative overflow-hidden shrink-0">
									{p.image_url ? (
										<img src={resolveDisplayImageUrl(p.image_url)} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
									) : (
										<div className="w-full h-full flex items-center justify-center text-slate-200">
											<LayoutPanelLeft size={48} />
										</div>
									)}
									<div className="absolute top-4 right-4 translate-x-12 group-hover:translate-x-0 transition-transform duration-500 flex flex-col gap-2">
										<button 
											onClick={() => router.push(`/admin/programs/form?id=${p.id}`)}
											className="p-2.5 bg-white/90 text-slate-400 hover:text-emerald-600 rounded-xl backdrop-blur-md shadow-lg transition-all"
										>
											<Pencil size={18} />
										</button>
										<button 
											onClick={() => { setSelectedId(p.id); setIsDeleteOpen(true); }}
											className="p-2.5 bg-white/90 text-slate-400 hover:text-rose-500 rounded-xl backdrop-blur-md shadow-lg transition-all"
										>
											<Trash2 size={18} />
										</button>
									</div>

									{p.is_featured && (
										<div className="absolute top-4 left-4 bg-amber-400 text-white px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] rounded-lg shadow-lg flex items-center gap-1.5">
											<Star size={10} className="fill-white" /> Unggulan
										</div>
									)}

									<div className="absolute bottom-4 left-4">
										<span className={`px-4 py-1.5 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-lg ${activeTab === 'program' ? 'bg-emerald-900/85' : 'bg-amber-700/85'}`}>
											Urutan: {p.order_index}
										</span>
									</div>
								</div>
								
								<div className="p-8 flex-1 flex flex-col">
									<h3 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight mb-4">{p.title}</h3>
									<p className="text-slate-400 text-xs font-medium leading-relaxed italic bg-slate-50 p-4 rounded-2xl flex-1 mb-0 opacity-70 group-hover:opacity-100 transition-opacity">
										&quot;{p.excerpt || 'Ing madya mangun karsa - Memberikan semangat pendidikan di tengah perkembangan zaman.'}&quot;
									</p>
								</div>
							</div>
						))
					) : (
						<div className="col-span-full bg-white rounded-xl p-32 text-center border-2 border-dashed border-slate-100">
							<div className="w-24 h-24 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-8 shadow-inner">
								<Layers className="text-slate-200" size={48} />
							</div>
							<h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Kurikulum Vakum</h3>
							<p className="text-slate-400 max-w-sm mx-auto font-medium">Data program pendidikan dan ekskul belum tersedia untuk kategori ini.</p>
						</div>
					)
				) : (
					<div className="col-span-full py-20 text-center uppercase font-black text-slate-300 tracking-[0.3em] animate-pulse">
						Mengunduh Silabus Dinamis...
					</div>
				)}
			</div>

			{/* Form Modal (Add/Edit) */}
			{isFormOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>
					<div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl relative overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 max-h-[95vh]">
						<div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
							<div className="flex items-center gap-4">
								<div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-lg ${form.category === 'program' ? 'bg-emerald-600 shadow-emerald-200' : 'bg-amber-500 shadow-amber-200'}`}>
									<Layers size={24} />
								</div>
								<div>
									<h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-outfit">
										{isEditing ? 'Revisi Program' : 'Inisiasi Program'}
									</h3>
									<p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{form.category === 'program' ? 'Kurikulum Unggulan' : 'Ekstrakurikuler'}</p>
								</div>
							</div>
							<button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X /></button>
						</div>
						
						<div className="flex-1 overflow-y-auto p-8">
							<form onSubmit={handleFormSubmit} className="space-y-8">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
									<div className="space-y-6">
										<div>
											<label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Judul Program</label>
											<input 
												type="text"
												required
												placeholder="Contoh: Tahfizh Akhwat Intensive"
												value={form.title}
												onChange={handleTitleChange}
												className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold"
											/>
										</div>
										<div>
											<label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Slug URL (Auto)</label>
											<input 
												type="text"
												required
												placeholder="tahfizh-akhwat-intensive"
												value={form.slug}
												onChange={(e) => setForm({ ...form, slug: e.target.value })}
												className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-xs text-slate-400"
											/>
										</div>
									</div>

									<div>
										<div className="flex items-center justify-between mb-3 px-1">
											<label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Banner Representatif (16:9)</label>
											<button 
												type="button"
												onClick={() => setIsGalleryOpen(true)}
												className="text-[9px] font-black text-emerald-700 uppercase tracking-widest hover:underline flex items-center gap-1"
											>
												<ImageIcon size={12} /> Galeri
											</button>
										</div>
										<div className={`w-full h-[155px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all relative ${
											croppedImageUrl ? 'border-emerald-300' : 'border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer'
										}`}>
											{croppedImageUrl ? (
												<img src={croppedImageUrl} className="w-full h-full object-cover" />
											) : (
												<label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
													<input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
													<Upload size={32} className="text-slate-200 mb-2" />
													<span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Unggah Banner</span>
												</label>
											)}
											
											{croppedImageUrl && (
												<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
													<label className="p-2.5 bg-white text-slate-900 rounded-xl cursor-pointer">
														<input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
														<Upload size={16} />
													</label>
													<button 
														type="button"
														onClick={() => { setCroppedImage(null); setCroppedImageUrl(null); }}
														className="p-2.5 bg-rose-500 text-white rounded-xl"
													>
														<X size={16} />
													</button>
												</div>
											)}
										</div>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
									<div>
										<label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Kategori</label>
										<select
											value={form.category}
											onChange={(e) => setForm({ ...form, category: e.target.value as any })}
											className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold appearance-none"
										>
											<option value="program">Program Unggulan</option>
											<option value="ekskul">Ekstrakurikuler</option>
										</select>
									</div>
									<div>
										<label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Urutan Tampilan</label>
										<input 
											type="number"
											value={form.order_index}
											onChange={(e) => setForm({ ...form, order_index: parseInt(e.target.value) || 0 })}
											className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold"
										/>
									</div>
									<div className="flex flex-col justify-end">
										<button 
											type="button"
											onClick={() => setForm({ ...form, is_featured: !form.is_featured })}
											className={`flex items-center gap-3 px-6 py-4 rounded-xl border transition-all font-black uppercase text-[10px] tracking-widest ${
												form.is_featured 
													? 'bg-amber-50 border-amber-200 text-amber-600 shadow-sm shadow-amber-200/50' 
													: 'bg-slate-50 border-slate-100 text-slate-400'
											}`}
										>
											<Star size={16} className={form.is_featured ? 'fill-amber-500' : ''} />
											Jadikan Unggulan
										</button>
									</div>
								</div>

								<div>
									<label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Ringkasan Eksekutif (Excerpt)</label>
									<textarea 
										required
										rows={2}
										placeholder="Ringkasan singkat yang menarik minat..."
										value={form.excerpt}
										onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
										className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-sm leading-relaxed"
									/>
								</div>

								<div>
									<label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Konten Detail (Markdown didukung)</label>
									<textarea 
										required
										rows={10}
										placeholder="Uraikan kurikulum, biaya, silabus, dan manfaat detail dari program ini..."
										value={form.content}
										onChange={(e) => setForm({ ...form, content: e.target.value })}
										className="w-full px-8 py-6 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700 text-sm leading-relaxed"
									/>
								</div>

								<div className="flex gap-4 pt-4 shrink-0">
									<button 
										type="button" 
										onClick={() => setIsFormOpen(false)}
										className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
									>
										Batal
									</button>
									<button 
										disabled={isSubmitting}
										type="submit"
										className="flex-[2] py-5 bg-slate-900 text-white rounded-lg font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-slate-200 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
									>
										{isSubmitting ? 'Menyimpan...' : (
											<>
												<Save size={18} />
												Simpan Program
											</>
										)}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}

			{/* Cropper Modal */}
			<ImageCropperModal 
				isOpen={isCropperOpen}
				onClose={() => setIsCropperOpen(false)}
				imageSrc={tempImage || ''}
				onCropComplete={handleCropComplete}
				aspectRatio={16/9}
			/>

			{/* Delete Dialog */}
			<ConfirmDialog 
				isOpen={isDeleteOpen}
				onClose={() => setIsDeleteOpen(false)}
				onConfirm={handleDelete}
				isLoading={isDeleting}
				title="Hapus Program?"
				message="Data kurikulum ini akan dihapus permanen dari sistem Darussunnah."
				confirmText="Hapus Permanen"
			/>

			<GallerySelectionModal 
				isOpen={isGalleryOpen}
				onClose={() => setIsGalleryOpen(false)}
				onSelect={handleGallerySelect}
			/>
		</>
	);
}
