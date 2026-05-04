'use client';

import React, { useCallback, useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getProgramById, createProgram, updateProgram, Program } from '@/lib/api';
import { Save, ArrowLeft, Loader2, Image as ImageIcon, AlignLeft, LayoutList, Fingerprint, Star, ListOrdered } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ProgramFormPage() {
	return (
		<Suspense fallback={<div className="h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>}>
			<ProgramFormContent />
		</Suspense>
	);
}

function ProgramFormContent() {
	type ProgramMutationPayload = Omit<Program, 'id' | 'created_at' | 'updated_at'>;
	const router = useRouter();
	const searchParams = useSearchParams();
	const id = searchParams.get('id');
	const initCategory = searchParams.get('category') || 'program';
	
	const { showToast } = useToast();
	const [isLoading, setIsLoading] = useState(!!id);
	const [isSaving, setIsSaving] = useState(false);

	const [formData, setFormData] = useState<Partial<Program>>({
		title: '',
		slug: '',
		category: initCategory,
		excerpt: '',
		content: '',
		image_url: '',
		is_featured: false,
		order_index: 0
	});

	const fetchProgram = useCallback(async () => {
		const data = await getProgramById(id!);
		if (data) {
			setFormData(data);
		} else {
			showToast('error', 'Program tidak ditemukan');
			router.push('/admin/programs');
		}
		setIsLoading(false);
	}, [id, router, showToast]);

	useEffect(() => {
		if (!id) {
			return;
		}

		const timeout = window.setTimeout(() => {
			void fetchProgram();
		}, 0);

		return () => window.clearTimeout(timeout);
	}, [id, fetchProgram]);

	const generateSlug = (val: string) => {
		return val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
	};

	const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const title = e.target.value;
		setFormData(prev => ({
			...prev,
			title,
			slug: !id ? generateSlug(title) : prev.slug
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.title || !formData.slug || !formData.category) {
			showToast('error', 'Harap lengkapi field mandatory (Judul, Slug, Kategori)');
			return;
		}

		setIsSaving(true);
		try {
			if (id) {
				const res = await updateProgram(id, formData);
				if (res.success) {
					showToast('success', 'Program berhasil diperbarui');
					router.push('/admin/programs');
				} else {
					showToast('error', res.message || 'Gagal memperbarui');
				}
			} else {
				const res = await createProgram(formData as ProgramMutationPayload);
				if (res.success) {
					showToast('success', 'Program berhasil ditambahkan');
					router.push('/admin/programs');
				} else {
					showToast('error', res.message || 'Gagal menambahkan');
				}
			}
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem';
			showToast('error', message);
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="h-[60vh] flex items-center justify-center">
				<Loader2 className="animate-spin text-emerald-500" size={40} />
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto pb-20">
			<div className="flex items-center gap-4 mb-10">
				<button 
					type="button" 
					onClick={() => router.back()}
					className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
				>
					<ArrowLeft size={20} />
				</button>
				<div>
					<h1 className="text-3xl font-black text-slate-900 font-outfit uppercase tracking-tight">
						{id ? 'Edit Data' : 'Tambah Data Baru'}
					</h1>
					<p className="text-slate-500 text-sm font-medium">Lengkapi rincian program yayasan di bawah ini.</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-8">
				<div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-8">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						{/* Judul */}
						<div className="space-y-3">
							<label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
								<AlignLeft size={12} /> Judul Program <span className="text-rose-500">*</span>
							</label>
							<input 
								type="text" 
								required
								value={formData.title}
								onChange={handleTitleChange}
								className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-slate-800"
								placeholder="Misal: Tahfidz Reguler"
							/>
						</div>

						{/* Slug */}
						<div className="space-y-3">
							<label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
								<Fingerprint size={12} /> URL Slug <span className="text-rose-500">*</span>
							</label>
							<input 
								type="text" 
								required
								value={formData.slug}
								onChange={(e) => setFormData({...formData, slug: e.target.value})}
								className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-mono text-sm text-slate-600"
							/>
						</div>

						{/* Kategori */}
						<div className="space-y-3">
							<label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
								<LayoutList size={12} /> Kategori <span className="text-rose-500">*</span>
							</label>
							<select 
								required
								value={formData.category}
								onChange={(e) => setFormData({...formData, category: e.target.value})}
								className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-slate-800"
							>
								<option value="program">Program Unggulan</option>
								<option value="ekskul">Ekstrakurikuler</option>
							</select>
						</div>

						{/* Urutan */}
						<div className="space-y-3">
							<label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
								<ListOrdered size={12} /> Nomor Urut Tampil
							</label>
							<input 
								type="number" 
								value={formData.order_index}
								onChange={(e) => setFormData({...formData, order_index: parseInt(e.target.value) || 0})}
								className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-slate-800"
							/>
						</div>
					</div>

					{/* Image URL */}
					<div className="space-y-3">
						<label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
							<ImageIcon size={12} /> Tautan Gambar Utama (URL)
						</label>
						<input 
							type="text" 
							value={formData.image_url}
							onChange={(e) => setFormData({...formData, image_url: e.target.value})}
							className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-600"
							placeholder="https://..."
						/>
						{formData.image_url && (
							<div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-40 max-w-sm">
								<img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
							</div>
						)}
					</div>

					{/* Excerpt */}
					<div className="space-y-3">
						<label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
							<AlignLeft size={12} /> Ringkasan / Excerpt
						</label>
						<textarea 
							rows={3}
							value={formData.excerpt}
							onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
							className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-600"
							placeholder="Tulis deskripsi singkat yang akan muncul di daftar kartu..."
						/>
					</div>

					{/* Content */}
					<div className="space-y-3">
						<label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
							<AlignLeft size={12} /> Konten Detail (Bisa format HTML)
						</label>
						<textarea 
							rows={8}
							value={formData.content}
							onChange={(e) => setFormData({...formData, content: e.target.value})}
							className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-mono text-sm leading-relaxed text-slate-700"
						/>
					</div>

					{/* Featured */}
					<div className="flex items-center gap-4 bg-amber-50 p-6 rounded-2xl border border-amber-200/50">
						<div className="w-12 h-12 bg-amber-100 text-amber-500 rounded-xl flex items-center justify-center">
							<Star size={24} className={formData.is_featured ? "fill-amber-500" : ""} />
						</div>
						<div className="flex-1">
							<h4 className="font-bold text-amber-900">Jadikan Program Unggulan</h4>
							<p className="text-amber-700/80 text-sm">Program unggulan akan mendapatkan badge khusus dan prioritas tampil.</p>
						</div>
						<label className="relative inline-flex items-center cursor-pointer">
							<input 
								type="checkbox" 
								className="sr-only peer"
								checked={formData.is_featured}
								onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
							/>
							<div className="w-14 h-7 bg-amber-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
						</label>
					</div>
				</div>

				<div className="sticky bottom-10 z-10 flex justify-end">
					<button 
						type="submit"
						disabled={isSaving}
						className="px-8 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-3 disabled:opacity-50"
					>
						{isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
						<span>Simpan Program</span>
					</button>
				</div>
			</form>
		</div>
	);
}
