function getApiBaseUrl() {
	const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
	if (typeof window !== 'undefined') {
		return '/api';
	}
	const backendOrigin = process.env.NEXT_PUBLIC_SITE_API_ORIGIN?.trim();
	const defaultBackendOrigin =
		process.env.NODE_ENV === 'production'
			? 'https://almaparung.com'
			: 'http://localhost:8080';
	if (configured) {
		return configured;
	}
	if (backendOrigin) {
		return `${backendOrigin.replace(/\/+$/, '')}/api`;
	}
	return `${defaultBackendOrigin}/api`;
}

const API_BASE_URL = getApiBaseUrl();

// Helper to get auth headers
function getAuthHeaders() {
	return {
		'Content-Type': 'application/json'
	};
}

function withCredentials(init: RequestInit = {}): RequestInit {
	return {
		credentials: 'include',
		...init
	};
}

const rawFetch: typeof globalThis.fetch = (...args) => globalThis.fetch(...args);

function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
	const timeoutMs = init?.signal ? 0 : 30000;
	if (timeoutMs > 0) {
		const controller = new AbortController();
		const id = setTimeout(() => controller.abort(), timeoutMs);
		return rawFetch(input, { ...withCredentials(init), signal: controller.signal })
			.finally(() => clearTimeout(id));
	}
	return rawFetch(input, withCredentials(init));
}

const fetch = apiFetch;

function resolveApiOrigin() {
	if (typeof window !== 'undefined') {
		return window.location.origin;
	}

	try {
		return new URL(API_BASE_URL).origin;
	} catch {
		return process.env.NODE_ENV === 'production'
			? 'https://almaparung.com'
			: 'http://localhost:8080';
	}
}

function buildApiUrl(path: string, params?: Record<string, string | number | undefined>) {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	const url = new URL(`${API_BASE_URL}${normalizedPath}`, resolveApiOrigin());

	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== '') {
				url.searchParams.append(key, String(value));
			}
		});
	}

	return url.toString();
}

function flattenValidationErrors(errors: unknown): string[] {
	if (!errors || typeof errors !== 'object') {
		return [];
	}

	return Object.values(errors as Record<string, unknown>)
		.flatMap((value) => {
			if (Array.isArray(value)) {
				return value.map((item) => String(item).trim()).filter(Boolean);
			}
			if (typeof value === 'string') {
				return [value.trim()].filter(Boolean);
			}
			return [];
		});
}

function localizeApiMessage(message: string) {
	const normalized = message.trim();
	if (normalized.startsWith('License Error:')) {
		return normalized.replace('License Error:', 'Masalah lisensi:').trim();
	}
	const translations: Record<string, string> = {
		'Invalid request body': 'Isi permintaan tidak valid',
		'Invalid payload': 'Data yang dikirim tidak valid',
		'Invalid request': 'Permintaan tidak valid',
		'Invalid credentials': 'Email atau kata sandi tidak valid',
		'Error generating token': 'Gagal membuat token akses',
		'Credential is required': 'Credential wajib diisi',
		'Cannot parse Google Token': 'Token Google tidak dapat diproses',
		'Invalid claims': 'Data akun Google tidak valid',
		'Unauthorized': 'Akses belum diizinkan',
		'User not found': 'Pengguna tidak ditemukan',
		'Program not found': 'Program tidak ditemukan',
		'News not found': 'Berita tidak ditemukan',
		'Registration not found': 'Data pendaftaran tidak ditemukan',
		'Teacher not found': 'Data guru tidak ditemukan',
		'Donation not found': 'Data donasi tidak ditemukan',
		'Invalid user ID': 'ID pengguna tidak valid',
		'Invalid teacher ID': 'ID guru tidak valid',
		'Invalid agenda ID': 'ID agenda tidak valid',
		'Invalid gallery ID': 'ID galeri tidak valid',
		'Invalid ID': 'ID tidak valid',
		'Invalid ID format': 'Format ID tidak valid',
		'ID must be a positive integer': 'ID harus berupa angka positif',
		'AI Service Error': 'Layanan AI sedang bermasalah',
		'Failed generating article': 'Gagal membuat berita',
		'File too large. Max 5MB.': 'Ukuran file terlalu besar. Maksimal 5MB',
		'No file uploaded': 'Belum ada file yang diunggah',
		'Unable to save the file': 'File tidak dapat disimpan',
		'Error writing file': 'Terjadi kesalahan saat menulis file',
		'Campaign created': 'Campaign berhasil dibuat',
		'Campaign deleted': 'Campaign berhasil dihapus',
		'Donation verified and WA notification sent': 'Donasi berhasil diverifikasi dan notifikasi WhatsApp sudah dikirim',
		'Image added to gallery': 'Gambar berhasil ditambahkan ke galeri',
		'Item deleted': 'Item berhasil dihapus',
		'News created': 'Berita berhasil dibuat',
		'News updated': 'Berita berhasil diperbarui',
		'News moved to trash': 'Berita berhasil dipindahkan ke sampah',
		'News restored': 'Berita berhasil dipulihkan',
		'News force deleted': 'Berita berhasil dihapus permanen',
		'Payment created successfully': 'Pembayaran berhasil dibuat',
		'Payment deleted successfully': 'Pembayaran berhasil dihapus',
		'Program updated successfully': 'Program berhasil diperbarui',
		'Program deleted successfully': 'Program berhasil dihapus',
		'Setting updated': 'Pengaturan berhasil diperbarui',
		'Teacher created': 'Data guru berhasil dibuat',
		'Teacher updated': 'Data guru berhasil diperbarui',
		'Teacher deleted': 'Data guru berhasil dihapus',
		'Video added successfully': 'Video berhasil ditambahkan',
		'Video updated': 'Video berhasil diperbarui',
		'Video deleted': 'Video berhasil dihapus',
		'Authorization header is required': 'Sesi login tidak ditemukan',
		'Invalid or expired token': 'Sesi login tidak valid atau sudah berakhir',
		'Invalid token claims': 'Data sesi login tidak valid',
	};

	return translations[normalized] || normalized;
}

function extractListData<T>(payload: unknown): T[] {
	if (payload && typeof payload === 'object') {
		const p = payload as Record<string, unknown>;
		if (Array.isArray(p.data)) {
			return p.data as T[];
		}
		if (p.data && typeof p.data === 'object') {
			const pData = p.data as Record<string, unknown>;
			if (Array.isArray(pData.items)) {
				return pData.items as T[];
			}
		}
	}
	if (Array.isArray(payload)) {
		return payload as T[];
	}
	return [];
}

function extractPagination(payload: unknown, fallback: { total: number; limit: number; offset: number }): { total: number; limit: number; offset: number } {
	if (payload && typeof payload === 'object') {
		const p = payload as Record<string, unknown>;
		if (p.pagination && typeof p.pagination === 'object') {
			const pagi = p.pagination as Record<string, unknown>;
			return { total: Number(pagi.total || fallback.total), limit: Number(pagi.limit || fallback.limit), offset: Number(pagi.offset || fallback.offset) };
		}
		if (p.data && typeof p.data === 'object') {
			const pData = p.data as Record<string, unknown>;
			if (pData.pagination && typeof pData.pagination === 'object') {
				const pagi = pData.pagination as Record<string, unknown>;
				return { total: Number(pagi.total || fallback.total), limit: Number(pagi.limit || fallback.limit), offset: Number(pagi.offset || fallback.offset) };
			}
		}
	}
	return fallback;
}

export function normalizeApiAssetUrl(url?: string | null) {
	if (!url) {
		return '';
	}

	const trimmed = url.trim();
	if (!trimmed) {
		return '';
	}

	const apiOrigin = resolveApiOrigin();

	try {
		const parsed = new URL(trimmed);
		if (parsed.pathname.startsWith('/api/uploads/')) {
			return new URL(parsed.pathname.replace('/api/uploads/', '/uploads/'), apiOrigin).toString();
		}
		if (parsed.pathname.startsWith('/uploads/')) {
			return new URL(parsed.pathname, apiOrigin).toString();
		}
		if (parsed.pathname.startsWith('/assets/')) {
			return parsed.pathname;
		}
		// rewrite localhost origins to apiOrigin
		if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
			return new URL(parsed.pathname + parsed.search + parsed.hash, apiOrigin).toString();
		}
		return parsed.toString();
	} catch {
		const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
		if (normalizedPath.startsWith('/api/uploads/')) {
			return new URL(normalizedPath.replace('/api/uploads/', '/uploads/'), apiOrigin).toString();
		}
		if (normalizedPath.startsWith('/uploads/')) {
			return new URL(normalizedPath, apiOrigin).toString();
		}
		if (normalizedPath.startsWith('/assets/')) {
			return normalizedPath;
		}
		return new URL(normalizedPath, apiOrigin).toString();
	}
}

export function resolveDisplayImageUrl(url?: string | null) {
	return normalizeApiAssetUrl(url);
}

export interface ApiNullableString {
	String: string;
	Valid: boolean;
}

export interface ApiNullableInt {
	Int64: number;
	Valid: boolean;
}

function normalizeNullableStringValue(value: unknown): ApiNullableString {
	if (typeof value === 'string') {
		return { String: value, Valid: value.trim() !== '' };
	}
	if (value && typeof value === 'object' && 'String' in value) {
		const candidate = value as { String?: unknown; Valid?: unknown };
		const stringValue = typeof candidate.String === 'string' ? candidate.String : '';
		return {
			String: stringValue,
			Valid: typeof candidate.Valid === 'boolean' ? candidate.Valid : stringValue.trim() !== ''
		};
	}
	return { String: '', Valid: false };
}

function normalizeNullableIntValue(value: unknown): ApiNullableInt {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return { Int64: value, Valid: value > 0 };
	}
	if (value && typeof value === 'object' && 'Int64' in value) {
		const candidate = value as { Int64?: unknown; Valid?: unknown };
		const intValue = typeof candidate.Int64 === 'number' && Number.isFinite(candidate.Int64) ? candidate.Int64 : 0;
		return {
			Int64: intValue,
			Valid: typeof candidate.Valid === 'boolean' ? candidate.Valid : intValue > 0
		};
	}
	return { Int64: 0, Valid: false };
}

function normalizeNewsPayload(payload: unknown): News {
	const data = (payload || {}) as Record<string, unknown>;
	return {
		...data,
		id: typeof data.id === 'number' ? data.id : Number(data.id ?? 0),
		title: typeof data.title === 'string' ? data.title : '',
		slug: typeof data.slug === 'string' ? data.slug : '',
		content: typeof data.content === 'string' ? data.content : '',
		excerpt: typeof data.excerpt === 'string' ? data.excerpt : '',
		image_url: normalizeNullableStringValue(data.image_url),
		status: typeof data.status === 'string' ? data.status : 'draft',
		category_id: normalizeNullableIntValue(data.category_id),
		category_name: typeof data.category_name === 'string'
			? data.category_name
			: normalizeNullableStringValue(data.category_name),
		created_at: typeof data.created_at === 'string' ? data.created_at : ''
	};
}

export function formatGalleryAlbumTitle(value?: string | null) {
	if (!value) {
		return '';
	}

	return value
		.trim()
		.replace(/[-_]+/g, ' ')
		.replace(/\s+/g, ' ')
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function slugifyContentKey(value?: string | null) {
	if (!value) {
		return '';
	}

	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

export function extractYouTubeVideoId(url?: string | null) {
	if (!url) {
		return '';
	}

	const trimmed = url.trim();
	if (!trimmed) {
		return '';
	}

	const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
	const match = trimmed.match(regex);
	return match?.[1] || '';
}

export function getYouTubeThumbnailUrl(url?: string | null) {
	const videoId = extractYouTubeVideoId(url);
	return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
}

export function getGallerySortTimestamp(eventDate?: string | null, createdAt?: string | null) {
	const eventTs = eventDate ? Date.parse(eventDate) : Number.NaN;
	if (!Number.isNaN(eventTs)) {
		return eventTs;
	}

	const createdTs = createdAt ? Date.parse(createdAt) : Number.NaN;
	if (!Number.isNaN(createdTs)) {
		return createdTs;
	}

	return 0;
}


async function parseResponse(res: Response) {
	if (!res.ok) {
		const contentType = res.headers.get("content-type");
		let errMsg = `Permintaan gagal: ${res.status} ${res.statusText}`;
		if (contentType && contentType.includes("application/json")) {
			try {
				const errBody = await res.json();
				const validationMessages = flattenValidationErrors(errBody.errors);
				errMsg = localizeApiMessage(validationMessages[0] || errBody.message || errMsg);
			} catch {}
		} else {
			errMsg = localizeApiMessage(errMsg);
		}
		// AUDIT FIX [6.10]: URL & detail mentah tidak di-log ke console browser.
		console.error('[API] Request failed');
		throw new Error(errMsg);
	}
	
	const contentType = res.headers.get("content-type");
	if (contentType && contentType.includes("application/json")) {
		return res.json();
	}
	return res.text();
}

async function fetchJsonWithFallback<T>(
	primaryPath: string,
	fallbackPaths: string[],
	options: {
		defaultValue: T;
		silentStatuses?: number[];
		logLabel: string;
	}	
) {
	const tryPaths = [primaryPath, ...fallbackPaths];

	for (let index = 0; index < tryPaths.length; index++) {
		const path = tryPaths[index];

		try {
			const res = await fetch(`${API_BASE_URL}${path}`, {
				headers: getAuthHeaders(),
				cache: 'no-store'
			});

			if (!res.ok) {
				if (index < tryPaths.length - 1 && res.status === 404) {
					continue;
				}

				if (options.silentStatuses?.includes(res.status)) {
					return options.defaultValue;
				}
			}

			const result = await parseResponse(res);
			return (result?.data ?? options.defaultValue) as T;
		} catch (e) {
			if (index < tryPaths.length - 1) {
				continue;
			}

			console.error(`[API] ${options.logLabel} error:`, e);
			return options.defaultValue;
		}
	}

	return options.defaultValue;
}


export interface News {
  id: number;
  is_pinned?: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image_url: ApiNullableString;
  status: string;
  category_id: ApiNullableInt;
  category_name?: ApiNullableString | string | null;
  created_at: string;
}

export interface NewsPayload {
	title: string;
	slug: string;
	content: string;
	excerpt: string;
	image_url: string;
	status: string;
	category_id: number;
}

export interface Registration {
	id: number;
	user_id?: number;
	full_name: string;
	nickname: string;
	gender: string;
	nik?: string;
	birth_place: string;
	birth_date: string;
	address?: string;
	school_origin: string;
	parent_name: string;
	parent_phone: string;
	father_name?: string;
	father_job?: string;
	father_phone?: string;
	mother_name?: string;
	mother_job?: string;
	mother_phone?: string;
	program_choice: string;
	kk_url?: string;
	ijazah_url?: string;
	pasfoto_url?: string;
	payment_proof_url?: string;
	payment_amount?: number;
	payment_date?: string;
	payment_status?: string;
	payment_note?: string;
	status: string;
	created_at: string;
	updated_at?: string;
}

export interface Teacher {
	id: number;
	name: string;
	subject: string;
	bio: string;
	image_url: string;
	email: string;
	whatsapp: string;
}

export interface GalleryItem {
	id: number;
	title: string;
	category: string;
	album_name: string;
	album_slug: string;
	event_date: string;
	is_album_cover: boolean;
	image_url: string;
	created_at: string;
}

export interface Campaign {
	id: number;
	title: string;
	description: string;
	target_amount: number;
	collected_amount: number;
	image_url: string;
	is_active: number;
	end_date: string | null;
}

export interface Donation {
	id: number;
	campaign_id: number;
	campaign_title: string;
	donor_id?: number | null;
	donor_name: string;
	donor_phone: string;
	amount: number;
	type?: string;
	message: string;
	payment_method: string;
	status: string;
	donation_date: string;
	notes?: string;
	created_at: string;
}

export interface Video {
	id: number;
	title: string;
	series_name: string;
	series_slug: string;
	event_date: string;
	is_featured: boolean;
	url: string;
	thumbnail: string;
	created_at: string;
}

export interface Setting {
	key: string;
	value: string;
	description: string;
	updated_at: string;
}

export type SettingsMap = Record<string, string>;

export interface Faq {
	id: number;
	question: string;
	answer: string;
	order_num: number;
	is_active: boolean;
}

export interface Facility {
	id: number;
	name: string;
	description: string;
	image_url: string;
	category: string;
	is_highlight: boolean;
}

export interface Agenda {
	id: number;
	title: string;
	start_date: string;
	end_date: string | null;
	time_info: string | null;
	location: string | null;
	description: string | null;
	category: string;
}

export interface Program {
	id: number;
	title: string;
	slug: string;
	category: string;
	excerpt: string;
	content: string;
	image_url: string;
	is_featured: boolean;
	order_index: number;
	created_at?: string;
	updated_at?: string;
}

export interface Message {
	id: number;
	name: string;
	email: string;
	whatsapp: string;
	message: string;
	is_read: boolean;
	created_at: string;
}

export interface Payment {
	id: number;
	user_id: number;
	user_name?: string;
	user_email?: string;
	amount: number;
	description: string;
	status: string;
	method: string;
	payment_date: string;
	created_at: string;
}

export interface ActivityLog {
	id: number;
	user_id: number;
	user_name?: string;
	action: string;
	details: string;
	ip_address: string;
	user_agent: string;
	created_at: string;
}

export interface CompactUser {
	id: number;
	name: string;
	email: string;
}

export interface Subject {
	id: number;
	name: string;
	category: string;
	teacher_id: number;
}

export interface Grade {
	id: number;
	student_id: number;
	student_name?: string;
	subject_id: number;
	subject_name?: string;
	semester: string;
	academic_year: string;
	uts_score: number;
	uas_score: number;
	task_score: number;
	final_score: number;
	grade_letter: string;
	notes: string;
}

export interface Attendance {
	id: number;
	student_id: number;
	student_name?: string;
	student_phone?: string;
	date: string;
	status: string;
	notes: string;
}

export interface TahfidzProgress {
	id: number;
	student_id: number;
	student_name?: string;
	surah_name: string;
	juz: number;
	start_ayat: number;
	end_ayat: number;
	status: string;
	musyrif_notes: string;
	evaluation_date: string;
}

export interface Exam {
	id: number;
	subject_id: number;
	subject_name?: string;
	title: string;
	academic_year: string;
	semester: string;
	duration_minutes: number;
	start_time?: string;
	end_time?: string;
}

export interface Question {
	id: number;
	exam_id: number;
	question_text: string;
	options: string[];
	correct_answer_key?: number; // Omitted for students
	points: number;
}

export interface Wallet {
	id: number;
	user_id: number;
	balance: number;
	has_pin: boolean;
	is_active: boolean;
	updated_at: string;
}

export interface WalletTransaction {
	id: number;
	wallet_id: number;
	type: 'deposit' | 'withdrawal' | 'purchase' | 'transfer';
	amount: number;
	reference_id: string;
	description: string;
	created_at: string;
}

export async function getPrograms(params: { category?: string, search?: string } = {}) {
	try {
		const queryParams = new URLSearchParams();
		if (params.category) queryParams.append('category', params.category);
		if (params.search) queryParams.append('search', params.search);

		const res = await fetch(`${API_BASE_URL}/programs?${queryParams.toString()}`, withCredentials({ cache: 'no-store' }));
		if (!res.ok) return [];
		const result = await parseResponse(res);
		return (result.data || []) as Program[];
	} catch (error) {
		console.error(`[API] Fetch programs error:`, error);
		return [];
	}
}

export async function getProgramById(id: string) {
	try {
		const res = await fetch(`${API_BASE_URL}/programs/${id}`, withCredentials({ cache: 'no-store' }));
		if (!res.ok) return null;
		const result = await parseResponse(res);
		return (result.data || null) as Program;
	} catch (error) {
		console.error(`[API] Fetch program error:`, error);
		return null;
	}
}

export async function getFaqs(search: string = '') {
	try {
		const res = await fetch(`${API_BASE_URL}/faqs?search=${search}`, withCredentials({ cache: 'no-store' }));
		if (!res.ok) return [];
		const result = await parseResponse(res);
		return extractListData<Faq>(result);
	} catch (error) {
		console.error(`[API] Fetch FAQs error:`, error);
		return [];
	}
}

export async function getFacilities(params: { category?: string, search?: string } = {}) {
	try {
		const queryParams = new URLSearchParams();
		if (params.category) queryParams.append('category', params.category);
		if (params.search) queryParams.append('search', params.search);

		const res = await fetch(`${API_BASE_URL}/facilities?${queryParams.toString()}`, withCredentials({ cache: 'no-store' }));
		if (!res.ok) return [];
		const result = await parseResponse(res);
		return extractListData<Facility>(result);
	} catch (e) {
		console.error(`[API] Fetch facilities error:`, e);
		return [];
	}
}

export async function getAgendas(search: string = '') {
	try {
		const res = await fetch(`${API_BASE_URL}/agendas?search=${search}`, withCredentials({ cache: 'no-store' }));
		if (!res.ok) return [];
		const result = await parseResponse(res);
		return extractListData<Agenda>(result);
	} catch (e) {
		console.error(`[API] Fetch agendas error:`, e);
		return [];
	}
}

export async function getNews() {
  try {
    const res = await fetch(`${API_BASE_URL}/news?status=published`, withCredentials({ cache: 'no-store' }));
    if (!res.ok) return [];
    const result = await parseResponse(res);
    return extractListData<unknown>(result).map(normalizeNewsPayload);
  } catch (e) {
    console.error(`[API] Fetch news error:`, e);
    return [];
  }
}

export async function getRegistrations() {
	try {
		const res = await fetch(`${API_BASE_URL}/psb`, withCredentials({ cache: 'no-store' }));
		if (!res.ok) return [];
		const result = await parseResponse(res);
		return (result.data || []) as Registration[];
	} catch (e) {
		console.error(`[API] Fetch registrations error:`, e);
		return [];
	}
}

export async function getTeachers(search: string = '') {
	try {
		const res = await fetch(`${API_BASE_URL}/teachers?search=${search}`, withCredentials({ cache: 'no-store' }));
		if (!res.ok) return [];
		const result = await parseResponse(res);
		const items = extractListData<Teacher>(result);
		return Array.isArray(items) ? items : [];
	} catch (e) {
		console.error(`[API] Fetch teachers error:`, e);
		return [];
	}
}

export async function getGallery(params: { category?: string, search?: string, limit?: number, offset?: number } = {}) {
	try {
		const queryParams = new URLSearchParams();
		if (params.category) queryParams.append('category', params.category);
		if (params.search) queryParams.append('search', params.search);
		if (params.limit) queryParams.append('limit', params.limit.toString());
		if (params.offset) queryParams.append('offset', params.offset.toString());

		const res = await fetch(`${API_BASE_URL}/gallery?${queryParams.toString()}`, withCredentials({ cache: 'no-store' }));
		if (!res.ok) return { data: [], pagination: { total: 0, limit: params.limit || 12, offset: params.offset || 0 } };
		const result = await parseResponse(res);
		const items = extractListData<GalleryItem>(result);
		return {
			data: Array.isArray(items) ? items : [],
			pagination: extractPagination(result, {
				total: 0,
				limit: params.limit || 12,
				offset: params.offset || 0
			})
		};
	} catch (e) {
		console.error(`[API] Fetch gallery error:`, e);
		return { data: [], pagination: { total: 0, limit: params.limit || 12, offset: params.offset || 0 } };
	}
}

export async function getCampaigns(params: { activeOnly?: boolean, search?: string } = {}) {
	try {
		const queryParams = new URLSearchParams();
		if (params.activeOnly) queryParams.append('active_only', 'true');
		if (params.search) queryParams.append('search', params.search);

		const res = await fetch(`${API_BASE_URL}/donations/campaigns?${queryParams.toString()}`, withCredentials({ cache: 'no-store' }));
		if (!res.ok) return [];
		const result = await parseResponse(res);
		return (result.data || []) as Campaign[];
	} catch (e) {
		console.error(`[API] Fetch campaigns error:`, e);
		return [];
	}
}

export async function getDonations(params: { campaignID?: number, status?: string, search?: string, type?: string } = {}) {
	try {
		const queryParams = new URLSearchParams();
		if (params.campaignID) queryParams.append('campaign_id', params.campaignID.toString());
		if (params.status) queryParams.append('status', params.status);
		if (params.search) queryParams.append('search', params.search);
		if (params.type) queryParams.append('type', params.type);

		const res = await fetch(`${API_BASE_URL}/donations/list?${queryParams.toString()}`, { cache: 'no-store' });
		if (!res.ok) return [];
		const result = await parseResponse(res);
		return (result.data || []) as Donation[];
	} catch (e) {
		console.error(`[API] Fetch donations error:`, e);
		return [];
	}
}

export interface Donor {
	id: number;
	name: string;
	address: string;
	phone: string;
	notes: string;
	created_at: string;
	updated_at: string;
}

export async function getDonors(search: string = '') {
	try {
		const queryParams = new URLSearchParams();
		if (search) queryParams.append('search', search);
		const res = await fetch(`${API_BASE_URL}/donations/donors?${queryParams.toString()}`, { cache: 'no-store' });
		if (!res.ok) return [];
		const result = await parseResponse(res);
		return (result.data || []) as Donor[];
	} catch (e) {
		console.error(`[API] Fetch donors error:`, e);
		return [];
	}
}

export async function createDonor(data: Omit<Donor, 'id' | 'created_at' | 'updated_at'>) {
	const res = await fetch(`${API_BASE_URL}/donations/donors`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function updateDonor(id: number, data: Omit<Donor, 'id' | 'created_at' | 'updated_at'>) {
	const res = await fetch(`${API_BASE_URL}/donations/donors/${id}`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function deleteDonor(id: number) {
	const res = await fetch(`${API_BASE_URL}/donations/donors/${id}`, {
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function createDonation(data: { campaign_id: number; donor_id?: number; donor_name: string; donor_phone?: string; amount: number; type?: string; method?: string; proof_url?: string; notes?: string }) {
	const res = await fetch(`${API_BASE_URL}/donations/list`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function updateDonation(id: number, data: { campaign_id: number; donor_id?: number; donor_name: string; donor_phone?: string; amount: number; type?: string; method?: string; proof_url?: string; notes?: string }) {
	const res = await fetch(`${API_BASE_URL}/donations/list/${id}`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function deleteDonation(id: number) {
	const res = await fetch(`${API_BASE_URL}/donations/list/${id}`, {
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function getVideos(params: { search?: string, limit?: number, offset?: number } = {}) {
	try {
		const queryParams = new URLSearchParams();
		if (params.search) queryParams.append('search', params.search);
		if (params.limit) queryParams.append('limit', params.limit.toString());
		if (params.offset) queryParams.append('offset', params.offset.toString());

		const res = await fetch(`${API_BASE_URL}/videos?${queryParams.toString()}`, { cache: 'no-store' });
		if (!res.ok) return { data: [], pagination: { total: 0, limit: params.limit || 9, offset: params.offset || 0 } };
		const result = await parseResponse(res);
		const items = extractListData<Video>(result);
		return {
			data: Array.isArray(items) ? items : [],
			pagination: extractPagination(result, {
				total: 0,
				limit: params.limit || 9,
				offset: params.offset || 0
			})
		};
	} catch (e) {
		console.error(`[API] Fetch videos error:`, e);
		return { data: [], pagination: { total: 0, limit: params.limit || 9, offset: params.offset || 0 } };
	}
}

export async function getMessages(params: { isRead?: boolean, search?: string } = {}) {
	try {
		const queryParams = new URLSearchParams();
		if (params.isRead !== undefined) queryParams.append('is_read', params.isRead ? '1' : '0');
		if (params.search) queryParams.append('search', params.search);
		
		const res = await fetch(`${API_BASE_URL}/contact?${queryParams.toString()}`, { 
			headers: getAuthHeaders(),
			cache: 'no-store' 
		});
		if (!res.ok) return [];
		const result = await parseResponse(res);
		return (result.data || []) as Message[];
	} catch (e) {
		console.error(`[API] Fetch messages error:`, e);
		return [];
	}
}

export async function getPayments() {
	try {
		const res = await fetch(`${API_BASE_URL}/payments/all`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || []) as Payment[];
	} catch (e) {
		console.error(`[API] Fetch payments error:`, e);
		return [];
	}
}

export async function getLogs(search: string = '') {
	try {
		const res = await fetch(`${API_BASE_URL}/logs?search=${search}`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || []) as ActivityLog[];
	} catch (e) {
		console.error(`[API] Fetch logs error:`, e);
		return [];
	}
}

export async function getPaymentUsers() {
	try {
		const res = await fetch(`${API_BASE_URL}/payments/users`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || []) as CompactUser[];
	} catch (e) {
		console.error(`[API] Fetch payment users error:`, e);
		return [];
	}
}

export interface SppBill {
	id: number;
	santri_id: number;
	santri_name?: string;
	santri_nis?: string;
	santri_class?: string;
	period: string;
	amount: number;
	paid_amount: number;
	status: string;
	due_date: string;
	paid_method: string;
	paid_at?: string;
	notes: string;
	payment_proof?: string;
	pending_amount?: number;
	created_at: string;
	updated_at: string;
}

export interface IuranBill {
	id: number;
	santri_id: number;
	santri_name?: string;
	santri_nis?: string;
	santri_class?: string;
	name: string;
	period: string;
	amount: number;
	paid_amount: number;
	status: string;
	due_date: string;
	paid_method: string;
	paid_at?: string;
	notes: string;
	payment_proof?: string;
	pending_amount?: number;
	created_at: string;
	updated_at: string;
}

export interface SppSummary {
	period: string;
	billed: number;
	collected: number;
	outstanding: number;
	count_total: number;
	count_paid: number;
	count_partial: number;
	count_unpaid: number;
}

export interface IuranSummary {
	period: string;
	billed: number;
	collected: number;
	outstanding: number;
	count_total: number;
	count_paid: number;
	count_partial: number;
	count_unpaid: number;
}

export interface SppSantri {
	id: number;
	nis: string;
	name: string;
	class: string;
}

export interface IuranSantri {
	id: number;
	nis: string;
	name: string;
	class: string;
}

export async function getSppBills(params: { period?: string; status?: string; santri_id?: number } = {}) {
	try {
		const query = new URLSearchParams();
		if (params.period) query.set('period', params.period);
		if (params.status) query.set('status', params.status);
		if (params.santri_id) query.set('santri_id', String(params.santri_id));
		const res = await fetch(`${API_BASE_URL}/spp/bills?${query.toString()}`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || []) as SppBill[];
	} catch (e) {
		console.error(`[API] Fetch SPP bills error:`, e);
		return [];
	}
}

export async function getIuranBills(params: { period?: string; status?: string; santri_id?: number; name?: string } = {}) {
	try {
		const query = new URLSearchParams();
		if (params.period) query.set('period', params.period);
		if (params.status) query.set('status', params.status);
		if (params.santri_id) query.set('santri_id', String(params.santri_id));
		if (params.name) query.set('name', params.name);
		const res = await fetch(`${API_BASE_URL}/iuran/bills?${query.toString()}`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || []) as IuranBill[];
	} catch (e) {
		console.error(`[API] Fetch SPP bills error:`, e);
		return [];
	}
}

export async function getSppSummary(period: string): Promise<SppSummary | null> {
	try {
		const res = await fetch(`${API_BASE_URL}/spp/bills/summary?period=${encodeURIComponent(period)}`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || null) as SppSummary | null;
	} catch (e) {
		console.error(`[API] Fetch SPP summary error:`, e);
		return null;
	}
}

export async function getIuranSummary(period: string, name = ""): Promise<IuranSummary | null> {
	try {
		const q = `period=${encodeURIComponent(period)}${name ? `&name=${encodeURIComponent(name)}` : ""}`;
		const res = await fetch(`${API_BASE_URL}/iuran/bills/summary?${q}`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || null) as IuranSummary | null;
	} catch (e) {
		console.error(`[API] Fetch SPP summary error:`, e);
		return null;
	}
}

export async function getSppSantri() {
	try {
		const res = await fetch(`${API_BASE_URL}/spp/santri`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || []) as SppSantri[];
	} catch (e) {
		console.error(`[API] Fetch SPP santri error:`, e);
		return [];
	}
}

export async function getIuranSantri() {
	try {
		const res = await fetch(`${API_BASE_URL}/iuran/santri`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || []) as IuranSantri[];
	} catch (e) {
		console.error(`[API] Fetch SPP santri error:`, e);
		return [];
	}
}

export async function generateSppBills(data: { period: string; period_end?: string; amount: number; due_date?: string; class?: string; santri_ids?: number[] }) {
	const res = await fetch(`${API_BASE_URL}/spp/bills/generate`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function generateIuranBills(data: { name: string; period: string; amount: number; due_date?: string; class?: string; santri_ids?: number[] }) {
	const res = await fetch(`${API_BASE_URL}/iuran/bills/generate`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function createSppBill(data: { santri_id: number; period: string; amount: number; due_date?: string; notes?: string }) {
	const res = await fetch(`${API_BASE_URL}/spp/bills`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function createIuranBill(data: { santri_id: number; name: string; period: string; amount: number; due_date?: string; notes?: string }) {
	const res = await fetch(`${API_BASE_URL}/iuran/bills`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function updateSppBill(id: number, data: { amount: number; due_date?: string; notes?: string }) {
	const res = await fetch(`${API_BASE_URL}/spp/bills/${id}`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function updateIuranBill(id: number, data: { amount: number; due_date?: string; notes?: string }) {
	const res = await fetch(`${API_BASE_URL}/iuran/bills/${id}`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function paySppBill(id: number, data: { amount: number; method?: string; paid_at?: string; notes?: string }) {
	const res = await fetch(`${API_BASE_URL}/spp/bills/${id}/pay`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function payIuranBill(id: number, data: { amount: number; method?: string; paid_at?: string; notes?: string }) {
	const res = await fetch(`${API_BASE_URL}/iuran/bills/${id}/pay`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function cancelSppBill(id: number) {
	const res = await fetch(`${API_BASE_URL}/spp/bills/${id}/cancel`, {
		method: 'POST',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function cancelIuranBill(id: number) {
	const res = await fetch(`${API_BASE_URL}/iuran/bills/${id}/cancel`, {
		method: 'POST',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function deleteSppBySantri(santri_id: number, period = "") {
	const q = `santri_id=${santri_id}${period ? `&period=${encodeURIComponent(period)}` : ""}`;
	const res = await fetch(`${API_BASE_URL}/spp/bills/by-santri?${q}`, {
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function deleteSppByPeriod(period: string) {
	const res = await fetch(`${API_BASE_URL}/spp/bills/by-period?period=${encodeURIComponent(period)}`, {
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export interface CombinedRow {
	santri_id: number;
	nis: string;
	name: string;
	class: string;
	spp_billed: number;
	iuran_billed: number;
	billed: number;
	collected: number;
	outstanding: number;
	status: string;
}

export async function getCombinedReport(params: { period_start: string; period_end: string; class?: string; santri_id?: number }) {
	try {
		const query = new URLSearchParams();
		query.set('period_start', params.period_start);
		query.set('period_end', params.period_end);
		if (params.class) query.set('class', params.class);
		if (params.santri_id) query.set('santri_id', String(params.santri_id));
		const res = await fetch(`${API_BASE_URL}/spp/combined-report?${query.toString()}`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || []) as CombinedRow[];
	} catch (e) {
		console.error(`[API] Fetch combined report error:`, e);
		return [];
	}
}

export async function deleteSppBill(id: number) {
	const res = await fetch(`${API_BASE_URL}/spp/bills/${id}`, {
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function deleteIuranBySantri(santri_id: number, name = "", period = "") {
	const q = new URLSearchParams({ santri_id: String(santri_id) });
	if (name) q.set("name", name);
	if (period) q.set("period", period);
	const res = await fetch(`${API_BASE_URL}/iuran/bills/by-santri?${q.toString()}`, {
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function deleteIuranByPeriod(name: string, period: string) {
	const res = await fetch(`${API_BASE_URL}/iuran/bills/by-period?name=${encodeURIComponent(name)}&period=${encodeURIComponent(period)}`, {
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function deleteIuranBill(id: number) {
	const res = await fetch(`${API_BASE_URL}/iuran/bills/${id}`, {
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export interface SppReportRow {
	santri_id: number;
	nis: string;
	name: string;
	class: string;
	billed: number;
	collected: number;
	outstanding: number;
	count_bills: number;
	status: string;
}

export interface IuranReportRow {
	santri_id: number;
	nis: string;
	name: string;
	class: string;
	billed: number;
	collected: number;
	outstanding: number;
	count_bills: number;
	status: string;
}

export async function getSppReport(params: { period_start: string; period_end: string; class?: string; santri_id?: number }) {
	try {
		const query = new URLSearchParams();
		query.set('period_start', params.period_start);
		query.set('period_end', params.period_end);
		if (params.class) query.set('class', params.class);
		if (params.santri_id) query.set('santri_id', String(params.santri_id));
		const res = await fetch(`${API_BASE_URL}/spp/report?${query.toString()}`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || []) as SppReportRow[];
	} catch (e) {
		console.error(`[API] Fetch SPP report error:`, e);
		return [];
	}
}

export async function getIuranReport(params: { period_start: string; period_end: string; class?: string; santri_id?: number }) {
	try {
		const query = new URLSearchParams();
		query.set('period_start', params.period_start);
		query.set('period_end', params.period_end);
		if (params.class) query.set('class', params.class);
		if (params.santri_id) query.set('santri_id', String(params.santri_id));
		const res = await fetch(`${API_BASE_URL}/iuran/report?${query.toString()}`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || []) as IuranReportRow[];
	} catch (e) {
		console.error(`[API] Fetch SPP report error:`, e);
		return [];
	}
}

// Mutations
export async function createProgram(program: Omit<Program, 'id' | 'created_at' | 'updated_at'>) {
	const res = await fetch(`${API_BASE_URL}/programs`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(program)
	});
	return parseResponse(res);
}

export async function updateProgram(id: number | string, program: Partial<Program>) {
	const res = await fetch(`${API_BASE_URL}/programs/${id}`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify(program)
	});
	return parseResponse(res);
}

export async function deleteProgram(id: number | string) {
	const res = await fetch(`${API_BASE_URL}/programs/${id}`, {
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function addTeacher(teacher: Omit<Teacher, 'id'>) {
	const res = await fetch(`${API_BASE_URL}/teachers`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(teacher)
	});
	return parseResponse(res);
}

export async function addNews(news: NewsPayload) {
	const res = await fetch(`${API_BASE_URL}/news`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(news)
	});
	return parseResponse(res);
}

export async function getNewsById(id: number | string) {
	try {
		const res = await fetch(`${API_BASE_URL}/news/${id}`, { cache: 'no-store' });
		if (!res.ok) return null;
		const result = await parseResponse(res);
		return result?.data ? normalizeNewsPayload(result.data) : null;
	} catch (e) {
		console.error(`[API] Fetch news by ID error:`, e);
		return null;
	}
}

export async function getNewsBySlug(slug: string) {
	try {
		const res = await fetch(`${API_BASE_URL}/news/slug/${slug}`, { cache: 'no-store' });
		if (!res.ok) return null;
		const result = await parseResponse(res);
		return result?.data ? normalizeNewsPayload(result.data) : null;
	} catch (e) {
		console.error(`[API] Fetch news by SLUG error:`, e);
		return null;
	}
}

export async function updateNews(id: number | string, news: Partial<NewsPayload>) {
	const res = await fetch(`${API_BASE_URL}/news/${id}`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify(news)
	});
	return parseResponse(res);
}

export async function deleteNews(id: number) {
	const res = await fetch(`${API_BASE_URL}/news/${id}`, { 
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function togglePinNews(id: number, pinned: boolean) {
	const res = await fetch(`${API_BASE_URL}/news/${id}/pin`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify({ pinned })
	});
	return parseResponse(res);
}

export async function getNewsPaginated(params: { status?: string, category?: string, search?: string, limit?: number, offset?: number }) {
  try {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.category) queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const res = await fetch(`${API_BASE_URL}/news?${queryParams.toString()}`, { headers: getAuthHeaders(), cache: 'no-store' });
    if (!res.ok) return { data: [], pagination: { total: 0 } };
    const result = await parseResponse(res);
    return {
      data: extractListData<unknown>(result).map(normalizeNewsPayload),
      pagination: extractPagination(result, {
        total: 0,
        limit: params.limit || 10,
        offset: params.offset || 0
      })
    };
  } catch {
    return { data: [], pagination: { total: 0 } };
  }
}

export async function restoreNews(id: number) {
	const res = await fetch(`${API_BASE_URL}/news/${id}/restore`, { 
		method: 'PUT',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function forceDeleteNews(id: number) {
	const res = await fetch(`${API_BASE_URL}/news/${id}/force`, { 
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function deleteTeacher(id: number) {
	const res = await fetch(`${API_BASE_URL}/teachers/${id}`, { 
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function updateTeacher(id: number, teacher: Partial<Teacher>) {
	const res = await fetch(`${API_BASE_URL}/teachers/${id}`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify(teacher)
	});
	return parseResponse(res);
}

export async function deleteGalleryItem(id: number) {
	const res = await fetch(`${API_BASE_URL}/gallery/${id}`, { 
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function addFacility(data: Omit<Facility, 'id'>) {
	const res = await fetch(`${API_BASE_URL}/facilities`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function updateFacility(id: number, data: Partial<Facility>) {
	const res = await fetch(`${API_BASE_URL}/facilities/${id}`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function deleteFacility(id: number) {
	const res = await fetch(`${API_BASE_URL}/facilities/${id}`, {
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function addGalleryItem(item: Omit<GalleryItem, 'id' | 'created_at'>) {
	const res = await fetch(`${API_BASE_URL}/gallery`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(item)
	});
	return parseResponse(res);
}

export async function addVideo(video: Omit<Video, 'id' | 'created_at'>) {
	const res = await fetch(`${API_BASE_URL}/videos`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(video)
	});
	return parseResponse(res);
}

export async function updateVideo(id: number | string, video: Partial<Video>) {
	const res = await fetch(`${API_BASE_URL}/videos/${id}`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify(video)
	});
	return parseResponse(res);
}

export async function deleteVideo(id: number) {
	const res = await fetch(`${API_BASE_URL}/videos/${id}`, { 
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function addCampaign(campaign: Omit<Campaign, 'id' | 'collected_amount'>) {
	const res = await fetch(`${API_BASE_URL}/donations/campaigns`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(campaign)
	});
	return parseResponse(res);
}

export async function deleteCampaign(id: number) {
	const res = await fetch(`${API_BASE_URL}/donations/campaigns/${id}`, { 
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function getCampaign(id: number) {
	const res = await fetch(`${API_BASE_URL}/donations/campaigns/${id}`, {
		headers: getAuthHeaders(),
		cache: 'no-store'
	});
	const result = await parseResponse(res);
	return result.data as Campaign;
}

export async function updateCampaign(id: number, campaign: Partial<Campaign>) {
	const res = await fetch(`${API_BASE_URL}/donations/campaigns/${id}`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify(campaign)
	});
	return parseResponse(res);
}

export async function addFaq(faq: Omit<Faq, 'id' | 'order_num'>) {
	const res = await fetch(`${API_BASE_URL}/faqs`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(faq)
	});
	return parseResponse(res);
}

export async function updateFaq(id: number, faq: Partial<Faq>) {
	const res = await fetch(`${API_BASE_URL}/faqs/${id}`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify(faq)
	});
	return parseResponse(res);
}

export async function deleteFaq(id: number) {
	const res = await fetch(`${API_BASE_URL}/faqs/${id}`, { 
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function updateFaqOrder(id: number, direction: 'up' | 'down') {
	const res = await fetch(`${API_BASE_URL}/faqs/${id}/order`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify({ direction })
	});
	return parseResponse(res);
}

export async function addAgenda(agenda: Omit<Agenda, 'id'>) {
	const res = await fetch(`${API_BASE_URL}/agendas`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(agenda)
	});
	return parseResponse(res);
}

export async function deleteAgenda(id: number) {
	const res = await fetch(`${API_BASE_URL}/agendas/${id}`, { 
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function updateAgenda(id: number, agenda: Partial<Agenda>) {
	const res = await fetch(`${API_BASE_URL}/agendas/${id}`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify(agenda)
	});
	return parseResponse(res);
}

export async function login(credentials: { email: string; password: string }) {
	const res = await fetch(`${API_BASE_URL}/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(credentials)
	});
	return parseResponse(res);
}

export async function registerUser(credentials: { name: string; email: string; password: string }) {
	const res = await fetch(`${API_BASE_URL}/register`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(credentials)
	});
	return parseResponse(res);
}

export async function googleLogin(credential: string) {
	const res = await fetch(`${API_BASE_URL}/auth/google`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ credential })
	});
	return parseResponse(res);
}

export async function getMe() {
	try {
		const res = await fetch(`${API_BASE_URL}/me`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		return await parseResponse(res);
	} catch {
		return { success: false };
	}
}

export async function getUsers(search: string = '') {
	try {
        const url = search ? `${API_BASE_URL}/users?search=${encodeURIComponent(search)}` : `${API_BASE_URL}/users`;
		const res = await fetch(url, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || []) as { id: number; name: string; email: string; role: string; created_at: string; last_login_at?: string | null }[];
	} catch (e) {
		console.error(`[API] Fetch users error:`, e);
		return [];
	}
}

export async function createUser(payload: { name: string; email: string; password: string; role: string }) {
	const res = await fetch(`${API_BASE_URL}/users`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(payload)
	});
	return parseResponse(res);
}

export async function resetUserPassword(id: number, password: string) {
	const res = await fetch(`${API_BASE_URL}/users/${id}/password`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify({ password })
	});
	return parseResponse(res);
}

export async function deleteUser(id: number) {
	const res = await fetch(`${API_BASE_URL}/users/${id}`, {
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function updateUserRole(id: number, role: string) {
	const res = await fetch(`${API_BASE_URL}/users/${id}/role`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify({ role })
	});
	return parseResponse(res);
}

export async function updatePSBStatus(id: number, status: string) {
	const res = await fetch(`${API_BASE_URL}/psb/${id}/status`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify({ status })
	});
	return parseResponse(res);
}

export async function updatePSBPaymentStatus(id: number, payload: { payment_status: string; payment_note?: string }) {
	const res = await fetch(`${API_BASE_URL}/psb/${id}/payment-status`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify(payload)
	});
	return parseResponse(res);
}

export async function deletePSBRegistration(id: number) {
	const res = await fetch(`${API_BASE_URL}/psb/${id}`, {
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function getMyPSBRegistration() {
	try {
		const res = await fetch(`${API_BASE_URL}/psb/me`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || null) as Registration | null;
	} catch (e) {
		console.error(`[API] Fetch my PSB registration error:`, e);
		return null;
	}
}

export async function saveMyPSBRegistration(payload: Partial<Registration>) {
	const res = await fetch(`${API_BASE_URL}/psb/me`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify(payload)
	});
	return parseResponse(res);
}

export async function saveMyPSBDocuments(payload: {
	kk_url?: string;
	ijazah_url?: string;
	pasfoto_url?: string;
}) {
	const res = await fetch(`${API_BASE_URL}/psb/me/documents`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify(payload)
	});
	return parseResponse(res);
}

export async function saveMyPSBPayment(payload: {
	payment_proof_url: string;
	payment_amount: number;
	payment_date: string;
}) {
	const res = await fetch(`${API_BASE_URL}/psb/me/payment`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify(payload)
	});
	return parseResponse(res);
}

export async function generateArticleAI(topic: string, withImage: boolean = true) {
	const res = await fetch(`${API_BASE_URL}/news/generate`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify({ topic, withImage })
	});
	return parseResponse(res);
}

export async function uploadImage(file: File) {
	const formData = new FormData();
	formData.append('image', file);

	// Pakai rawFetch (tanpa timeout 30 detik apiFetch): upload foto HP
	// yang besar lewat koneksi lambat sering terputus di tengah jalan.
	const res = await rawFetch(`${API_BASE_URL}/upload`, {
		method: 'POST',
		body: formData,
		credentials: 'include'
	});
	const result = await parseResponse(res);
	if (result?.data?.url && !result.url) {
		return { ...result, url: result.data.url };
	}
	return result;
}
export async function verifyDonation(id: number) {
	const res = await fetch(`${API_BASE_URL}/donations/verify/${id}`, {
		method: 'PUT',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function markMessageAsRead(id: number) {
	const res = await fetch(`${API_BASE_URL}/contact/${id}/read`, {
		method: 'PATCH',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function deleteMessage(id: number) {
	const res = await fetch(`${API_BASE_URL}/contact/${id}`, {
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function createContactMessage(data: { name: string, email?: string, whatsapp?: string, message: string }) {
	const res = await fetch(`${API_BASE_URL}/contact`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function createPayment(data: Omit<Payment, 'id' | 'created_at' | 'user_name' | 'user_email'>) {
	const res = await fetch(`${API_BASE_URL}/payments`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function deletePayment(id: number) {
	const res = await fetch(`${API_BASE_URL}/payments/${id}`, {
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function updatePayment(id: number, data: Omit<Payment, 'id' | 'created_at' | 'user_name' | 'user_email'>) {
	const res = await fetch(`${API_BASE_URL}/payments/${id}`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

// Academics
export async function getSubjects() {
	try {
		const res = await fetch(`${API_BASE_URL}/academics/subjects`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || []) as Subject[];
	} catch (e) {
		console.error(`[API] Fetch subjects error:`, e);
		return [];
	}
}

export async function createSubject(data: Omit<Subject, 'id'>) {
	const res = await fetch(`${API_BASE_URL}/academics/subjects`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function deleteSubject(id: number) {
	const res = await fetch(`${API_BASE_URL}/academics/subjects/${id}`, {
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function getGrades(semester?: string, year?: string) {
	try {
		const res = await fetch(buildApiUrl('/academics/grades', {
			semester,
			year
		}), {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || []) as Grade[];
	} catch (e) {
		console.error(`[API] Fetch grades error:`, e);
		return [];
	}
}

export async function getGradesByStudent(id: number) {
	try {
		const res = await fetch(`${API_BASE_URL}/academics/grades/student/${id}`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || []) as Grade[];
	} catch (e) {
		console.error(`[API] Fetch student grades error:`, e);
		return [];
	}
}

export async function getMyAcademicGrades() {
	return fetchJsonWithFallback<Grade[]>(
		'/portal/academics/grades',
		['/academics/grades/me'],
		{
			defaultValue: [],
			logLabel: 'Fetch my academic grades',
		}
	);
}

export async function createGrade(data: Omit<Grade, 'id' | 'student_name' | 'subject_name' | 'final_score' | 'grade_letter'>) {
	const res = await fetch(`${API_BASE_URL}/academics/grades`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function updateGrade(id: number, data: Partial<Grade>) {
	const res = await fetch(`${API_BASE_URL}/academics/grades/${id}`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function deleteGrade(id: number) {
	const res = await fetch(`${API_BASE_URL}/academics/grades/${id}`, {
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function getAttendance(date?: string) {
	try {
		const res = await fetch(buildApiUrl('/academics/attendance', {
			date
		}), {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || []) as Attendance[];
	} catch (e) {
		console.error(`[API] Fetch attendance error:`, e);
		return [];
	}
}

export async function createAttendance(data: Omit<Attendance, 'id' | 'student_name'>) {
	const res = await fetch(`${API_BASE_URL}/academics/attendance`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function updateAttendance(id: number, data: Partial<Attendance>) {
	const res = await fetch(`${API_BASE_URL}/academics/attendance/${id}`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function deleteAttendance(id: number) {
	const res = await fetch(`${API_BASE_URL}/academics/attendance/${id}`, {
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function getAttendanceSummary(studentId: number) {
	try {
		const res = await fetch(`${API_BASE_URL}/academics/attendance/summary/${studentId}`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return result.data as Record<string, number>;
	} catch (e) {
		console.error(`[API] Fetch attendance summary error:`, e);
		return {};
	}
}

export async function getMyAttendanceSummary() {
	return fetchJsonWithFallback<Record<string, number>>(
		'/portal/academics/attendance-summary',
		['/academics/attendance/me/summary'],
		{
			defaultValue: {},
			logLabel: 'Fetch my attendance summary',
		}
	);
}

export async function getTahfidz() {
	try {
		const res = await fetch(`${API_BASE_URL}/academics/tahfidz`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || []) as TahfidzProgress[];
	} catch (e) {
		console.error(`[API] Fetch tahfidz progress error:`, e);
		return [];
	}
}

export async function getMyTahfidz() {
	return fetchJsonWithFallback<TahfidzProgress[]>(
		'/portal/academics/tahfidz',
		['/academics/tahfidz/me'],
		{
			defaultValue: [],
			silentStatuses: [401, 403],
			logLabel: 'Fetch my tahfidz progress',
		}
	);
}

export async function createTahfidz(data: Omit<TahfidzProgress, 'id' | 'student_name'>) {
	const res = await fetch(`${API_BASE_URL}/academics/tahfidz`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function updateTahfidz(id: number, data: Partial<TahfidzProgress>) {
	const res = await fetch(`${API_BASE_URL}/academics/tahfidz/${id}`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function deleteTahfidz(id: number) {
	const res = await fetch(`${API_BASE_URL}/academics/tahfidz/${id}`, {
		method: 'DELETE',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function getAcademicStudents() {
	try {
		const res = await fetch(`${API_BASE_URL}/academics/students`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || []) as CompactUser[];
	} catch (e) {
		console.error(`[API] Fetch academic students error:`, e);
		return [];
	}
}

// Notifications
export async function getNotificationStatus() {
	try {
		const res = await fetch(`${API_BASE_URL}/notifications/status`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		return await parseResponse(res);
	} catch (e) {
		console.error(`[API] Fetch notification status error:`, e);
		return { success: false, configured: false };
	}
}

export async function sendWhatsApp(target: string, message: string) {
	const res = await fetch(`${API_BASE_URL}/notifications/send-wa`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify({ target, message })
	});
	return parseResponse(res);
}

export interface WAGatewayStatus {
	connected: boolean;
	phone?: string;
	pushname?: string;
}

export async function getWAGatewayStatus(): Promise<WAGatewayStatus> {
	try {
		const res = await fetch(`${API_BASE_URL}/notifications/wa/status`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || { connected: false }) as WAGatewayStatus;
	} catch (e) {
		console.error('[API] Fetch WA status error:', e);
		return { connected: false };
	}
}

export async function getWAQRBlob(): Promise<{ ok: boolean; url?: string; message?: string }> {
	try {
		const res = await fetch(`${API_BASE_URL}/notifications/wa/qr`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		if (!res.ok) {
			let message = 'Gagal memuat QR.';
			try {
				const j = await res.json();
				message = j.message || message;
			} catch {
				// abaikan
			}
			return { ok: false, message };
		}
		const blob = await res.blob();
		return { ok: true, url: URL.createObjectURL(blob) };
	} catch (e) {
		console.error('[API] Fetch WA QR error:', e);
		return { ok: false, message: 'Gagal memuat QR.' };
	}
}

export async function requestWAPairCode(phone: string) {
	const res = await fetch(`${API_BASE_URL}/notifications/wa/pair-code`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify({ phone })
	});
	return parseResponse(res);
}

export async function disconnectWAGateway() {
	const res = await fetch(`${API_BASE_URL}/notifications/wa/disconnect`, {
		method: 'POST',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function broadcastTagihan() {
	const res = await fetch(`${API_BASE_URL}/notifications/broadcast-tagihan`, {
		method: 'POST',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function broadcastNilai() {
	const res = await fetch(`${API_BASE_URL}/notifications/broadcast-nilai`, {
		method: 'POST',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

export async function broadcastPSB() {
	const res = await fetch(`${API_BASE_URL}/notifications/broadcast-psb`, {
		method: 'POST',
		headers: getAuthHeaders()
	});
	return parseResponse(res);
}

// Settings
export async function getSettings(options: { silentUnauthorized?: boolean } = {}) {
	try {
		const res = await fetch(`${API_BASE_URL}/settings`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});

		if (options.silentUnauthorized && (res.status === 401 || res.status === 403)) {
			return [];
		}

		const result = await parseResponse(res);
		return (result.data || []) as Setting[];
	} catch (e) {
		if (!options.silentUnauthorized) {
			console.error(`[API] Fetch settings error:`, e);
		}
		return [];
	}
}

export async function getSettingsMap(options: { silentUnauthorized?: boolean } = {}) {
	const settings = await getSettings(options);
	return settings.reduce<SettingsMap>((acc, setting) => {
		acc[setting.key] = setting.value || '';
		return acc;
	}, {});
}

export async function getPublicSettings() {
	try {
		const res = await fetch(`${API_BASE_URL}/settings/public`, {
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || []) as Setting[];
	} catch (e) {
		console.error(`[API] Fetch public settings error:`, e);
		return [];
	}
}

export async function getPublicSettingsMap() {
	const settings = await getPublicSettings();
	return settings.reduce<SettingsMap>((acc, setting) => {
		acc[setting.key] = setting.value || '';
		return acc;
	}, {});
}

export async function getRoleMenuPermissions(): Promise<Record<string, string[]>> {
	try {
		const res = await fetch(`${API_BASE_URL}/settings/role-permissions`, {
			credentials: 'include',
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		const raw = result?.data?.value || '{}';
		const parsed = JSON.parse(raw);
		if (parsed && typeof parsed === 'object') return parsed as Record<string, string[]>;
		return {};
	} catch (e) {
		console.error(`[API] Fetch role permissions error:`, e);
		return {};
	}
}

export async function updateSetting(key: string, value: string) {
	const res = await fetch(`${API_BASE_URL}/settings/${key}`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify({ value })
	});
	return parseResponse(res);
}

export async function updateSettingsBatch(settings: Array<{ key: string; value: string }>) {
	const res = await fetch(`${API_BASE_URL}/settings/batch`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify({ settings })
	});
	return parseResponse(res);
}

// ── Disciplines (Kedisiplinan Santri) ──────────────────

export interface StudentDisciplinePoint {
	id: number;
	student_id: number;
	student_name: string;
	parent_phone: string;
	current_points: number;
	academic_year: string;
	updated_at: string;
}

export interface ViolationLog {
	id: number;
	student_id: number;
	student_name: string;
	parent_phone: string;
	reporter_name: string;
	violation_category: string;
	violation_detail: string;
	points_deducted: number;
	action_taken: string;
	created_at: string;
}

export interface CreateViolationPayload {
	student_id: number;
	reporter_name: string;
	violation_category: string;
	violation_detail: string;
	points_deducted: number;
	action_taken?: string;
}

export async function getDisciplinePoints(params: { limit?: number; offset?: number } = {}) {
	try {
		const queryParams = new URLSearchParams();
		if (params.limit) queryParams.append('limit', params.limit.toString());
		if (params.offset) queryParams.append('offset', params.offset.toString());

		const res = await fetch(`${API_BASE_URL}/disciplines/points?${queryParams.toString()}`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		if (!res.ok) return { data: [] as StudentDisciplinePoint[], pagination: { total: 0 } };
		const result = await parseResponse(res);
		return {
			data: extractListData<StudentDisciplinePoint>(result),
			pagination: extractPagination(result, { total: 0, limit: params.limit || 20, offset: params.offset || 0 })
		};
	} catch (e) {
		console.error('[API] Fetch discipline points error:', e);
		return { data: [] as StudentDisciplinePoint[], pagination: { total: 0 } };
	}
}

export async function getStudentDisciplinePoint(studentId: number) {
	try {
		const res = await fetch(`${API_BASE_URL}/disciplines/students/${studentId}/points`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		if (!res.ok) return null;
		const result = await parseResponse(res);
		return (result.data || null) as StudentDisciplinePoint | null;
	} catch (e) {
		console.error('[API] Fetch student point error:', e);
		return null;
	}
}

export async function getViolationLogs(params: { student_id?: number; limit?: number; offset?: number } = {}) {
	try {
		const queryParams = new URLSearchParams();
		if (params.student_id) queryParams.append('student_id', params.student_id.toString());
		if (params.limit) queryParams.append('limit', params.limit.toString());
		if (params.offset) queryParams.append('offset', params.offset.toString());

		const res = await fetch(`${API_BASE_URL}/disciplines/logs?${queryParams.toString()}`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		if (!res.ok) return { data: [] as ViolationLog[], pagination: { total: 0 } };
		const result = await parseResponse(res);
		return {
			data: extractListData<ViolationLog>(result),
			pagination: extractPagination(result, { total: 0, limit: params.limit || 20, offset: params.offset || 0 })
		};
	} catch (e) {
		console.error('[API] Fetch violation logs error:', e);
		return { data: [] as ViolationLog[], pagination: { total: 0 } };
	}
}

export async function createViolation(payload: CreateViolationPayload) {
	const res = await fetch(`${API_BASE_URL}/disciplines/violations`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(payload)
	});
	return parseResponse(res);
}
export async function getAttendanceToken() {
	try {
		const res = await fetch(`${API_BASE_URL}/attendance/token`, withCredentials({ cache: 'no-store' }));
		if (!res.ok) return null;
		const result = await parseResponse(res);
		return (result.data?.token || null) as string | null;
	} catch (e) {
		console.error(`[API] Get attendance token error:`, e);
		return null;
	}
}

export async function scanAttendanceQR(token: string) {
	try {
		const res = await fetch(`${API_BASE_URL}/attendance/scan`, withCredentials({
			method: 'POST',
			body: JSON.stringify({ token })
		}));
		const result = await parseResponse(res);
		return { success: result.success, message: result.message };
	} catch (e) {
		console.error(`[API] Scan attendance error:`, e);
		return { success: false, message: e instanceof Error ? e.message : 'Terjadi kesalahan sistem' };
	}
}

export async function getAvailableExams() {
	try {
		const res = await fetch(`${API_BASE_URL}/exams`, withCredentials({ cache: 'no-store' }));
		if (!res.ok) return [];
		const result = await parseResponse(res);
		return (result.data || []) as Exam[];
	} catch (e) {
		console.error(`[API] Fetch exams error:`, e);
		return [];
	}
}

export async function getExamQuestions(examID: number) {
	try {
		const res = await fetch(`${API_BASE_URL}/exams/${examID}/questions`, withCredentials({ cache: 'no-store' }));
		if (!res.ok) return [];
		const result = await parseResponse(res);
		return (result.data || []) as Question[];
	} catch (e) {
		console.error(`[API] Fetch questions error:`, e);
		return [];
	}
}

export async function startExamSession(examID: number) {
	try {
		const res = await fetch(`${API_BASE_URL}/exams/session/start`, withCredentials({
			method: 'POST',
			body: JSON.stringify({ exam_id: examID })
		}));
		const result = await parseResponse(res);
		return (result.data?.session_id || null) as number | null;
	} catch (e) {
		console.error(`[API] Start session error:`, e);
		return null;
	}
}

export async function submitExamAnswer(sessionID: number, questionID: number, selectedAnswer: number) {
	try {
		const res = await fetch(`${API_BASE_URL}/exams/session/answer`, withCredentials({
			method: 'POST',
			body: JSON.stringify({ session_id: sessionID, question_id: questionID, selected_answer: selectedAnswer })
		}));
		const result = await parseResponse(res);
		return result.success;
	} catch (e) {
		console.error(`[API] Submit answer error:`, e);
		return false;
	}
}

export async function finishExamSession(sessionID: number) {
	try {
		const res = await fetch(`${API_BASE_URL}/exams/session/finish`, withCredentials({
			method: 'POST',
			body: JSON.stringify({ session_id: sessionID })
		}));
		const result = await parseResponse(res);
		return { success: result.success, score: result.data?.score || 0 };
	} catch (e) {
		console.error(`[API] Finish session error:`, e);
		return { success: false, score: 0 };
	}
}

export async function getMyWallet() {
	try {
		const res = await fetch(`${API_BASE_URL}/wallet/my`, withCredentials({ cache: 'no-store' }));
		if (!res.ok) return null;
		const result = await parseResponse(res);
		return (result.data || null) as Wallet | null;
	} catch (e) {
		console.error(`[API] Fetch wallet error:`, e);
		return null;
	}
}

export async function getWalletHistory(limit: number = 20) {
	try {
		const res = await fetch(`${API_BASE_URL}/wallet/history?limit=${limit}`, withCredentials({ cache: 'no-store' }));
		if (!res.ok) return [];
		const result = await parseResponse(res);
		return (result.data || []) as WalletTransaction[];
	} catch (e) {
		console.error(`[API] Fetch wallet history error:`, e);
		return [];
	}
}

export async function setWalletPIN(pin: string) {
	try {
		const res = await fetch(`${API_BASE_URL}/wallet/pin`, withCredentials({
			method: 'POST',
			body: JSON.stringify({ pin })
		}));
		const result = await parseResponse(res);
		return result.success;
	} catch (e) {
		console.error(`[API] Set PIN error:`, e);
		return false;
	}
}

export async function spendWalletBalance(amount: number, pin: string, description: string) {
	try {
		const res = await fetch(`${API_BASE_URL}/wallet/spend`, withCredentials({
			method: 'POST',
			body: JSON.stringify({ amount, pin, description })
		}));
		const result = await parseResponse(res);
		return { success: result.success, message: result.message };
	} catch (e) {
		console.error(`[API] Spend error:`, e);
		return { success: false, message: e instanceof Error ? e.message : 'Kesalahan sistem' };
	}
}

export async function topUpWalletAdmin(userID: number, amount: number, description: string) {
	try {
		const res = await fetch(`${API_BASE_URL}/wallet/topup`, withCredentials({
			method: 'POST',
			body: JSON.stringify({ user_id: userID, amount, description })
		}));
		const result = await parseResponse(res);
		return result.success;
	} catch (e) {
		console.error(`[API] Topup error:`, e);
		return false;
	}
}

// ========== LMS ALMAA: Project & E-Raport ==========

export interface SubProject {
	id: number;
	name: string;
	code: string;
	description: string;
	weight: number;
	order_index: number;
	is_active: boolean;
	is_demo: boolean;
	created_at: string;
	updated_at: string;
}

export interface ProjectActivity {
	id: number;
	sub_project_id: number;
	name: string;
	code: string;
	description: string;
	tujuan: string;
	indikator: string;
	weight: number;
	order_index: number;
	is_active: boolean;
	periode: string;
	created_at: string;
	updated_at: string;
}

export interface ProjectIndicator {
	id: number;
	activity_id: number;
	name: string;
	weight: number;
	created_at: string;
}

export interface SubjectScoreDetail {
	subject_id: number;
	subject_name: string;
	score: number;
	weight: number;
}

export interface ProjectDetailScore {
	sub_project_id: number;
	sub_project: string;
	score: number;
	weight: number;
	contribution: number;
}

export interface ComputedRaport {
	student_id: number;
	student_name: string;
	semester: string;
	academic_year: string;
	mapel_score: number;
	project_score: number;
	kesantrian_score: number;
	final_score: number;
	predikat: string;
	weights: Record<string, number>;
	mapel_details?: SubjectScoreDetail[];
	project_details?: ProjectDetailScore[];
	kesantrian_detail?: Record<string, number>;
	status?: string;
}

export interface KesantrianAspect {
	id: number;
	student_id: number;
	student_name: string;
	aspek: string;
	semester: string;
	academic_year: string;
	score: number;
	updated_at: string;
}

export interface ExtendedSubject {
	id: number;
	name: string;
	category: string;
	teacher_id: number | null;
	weight: number;
	kkm: number;
	sort_order: number;
	is_active: boolean;
}

export interface StoredRaport {
	id: number;
	student_id: number;
	student_name: string;
	semester: string;
	academic_year: string;
	mapel_score: number;
	project_score: number;
	kesantrian_score: number;
	final_score: number;
	predikat: string;
	status: string;
	notes: string;
	updated_at: string;
}

async function lmsFetch<T>(path: string, init?: RequestInit): Promise<{ success: boolean; message: string; data: T }> {
	const res = await fetch(`${API_BASE_URL}${path}`, {
		...withCredentials(init),
		headers: { 'Content-Type': 'application/json' }
	});
	const result = await parseResponse(res);
	return result as { success: boolean; message: string; data: T };
}

export async function getSubProjects(): Promise<SubProject[]> {
	try {
		const r = await lmsFetch<SubProject[]>('/project/subprojects');
		return r.data || [];
	} catch (e) { console.error('[Project] list subprojects:', e); return []; }
}

export async function createSubProject(payload: Partial<SubProject>): Promise<SubProject | null> {
	try {
		const r = await lmsFetch<SubProject>('/project/subprojects', { method: 'POST', body: JSON.stringify(payload) });
		return r.success ? r.data : null;
	} catch (e) { console.error('[Project] create subproject:', e); return null; }
}

export async function updateSubProject(id: number, payload: Partial<SubProject>): Promise<boolean> {
	try {
		const r = await lmsFetch(`/project/subprojects/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
		return r.success;
	} catch (e) { console.error('[Project] update subproject:', e); return false; }
}

export async function deleteSubProject(id: number): Promise<boolean> {
	try {
		const r = await lmsFetch(`/project/subprojects/${id}`, { method: 'DELETE' });
		return r.success;
	} catch (e) { console.error('[Project] delete subproject:', e); return false; }
}

export async function getActivities(subProjectId?: number): Promise<ProjectActivity[]> {
	try {
		const q = subProjectId ? `?sub_project_id=${subProjectId}` : '';
		const r = await lmsFetch<ProjectActivity[]>(`/project/activities${q}`);
		return r.data || [];
	} catch (e) { console.error('[Project] list activities:', e); return []; }
}

export async function createActivity(payload: Partial<ProjectActivity>): Promise<ProjectActivity | null> {
	try {
		const r = await lmsFetch<ProjectActivity>('/project/activities', { method: 'POST', body: JSON.stringify(payload) });
		return r.success ? r.data : null;
	} catch (e) { console.error('[Project] create activity:', e); return null; }
}

export async function updateActivity(id: number, payload: Partial<ProjectActivity>): Promise<boolean> {
	try {
		const r = await lmsFetch(`/project/activities/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
		return r.success;
	} catch (e) { console.error('[Project] update activity:', e); return false; }
}

export async function deleteActivity(id: number): Promise<boolean> {
	try {
		const r = await lmsFetch(`/project/activities/${id}`, { method: 'DELETE' });
		return r.success;
	} catch (e) { console.error('[Project] delete activity:', e); return false; }
}

export async function getIndicators(activityId: number): Promise<ProjectIndicator[]> {
	try {
		const r = await lmsFetch<ProjectIndicator[]>(`/project/indicators?activity_id=${activityId}`);
		return r.data || [];
	} catch (e) { console.error('[Project] list indicators:', e); return []; }
}

export async function createIndicator(payload: Partial<ProjectIndicator>): Promise<ProjectIndicator | null> {
	try {
		const r = await lmsFetch<ProjectIndicator>('/project/indicators', { method: 'POST', body: JSON.stringify(payload) });
		return r.success ? r.data : null;
	} catch (e) { console.error('[Project] create indicator:', e); return null; }
}

export async function deleteIndicator(id: number): Promise<boolean> {
	try {
		const r = await lmsFetch(`/project/indicators/${id}`, { method: 'DELETE' });
		return r.success;
	} catch (e) { console.error('[Project] delete indicator:', e); return false; }
}

export async function validateWeights(): Promise<{ ok: boolean; weights?: Record<string, number>; message?: string }> {
	try {
		const r = await lmsFetch<Record<string, number>>('/project/weights/validate');
		return { ok: r.success, weights: r.data, message: r.message };
	} catch (e) { return { ok: false, message: 'Gagal memvalidasi bobot' }; }
}

export async function calculateRaport(params: { student_id: number; semester: string; academic_year: string; mapel_weight?: number; project_weight?: number; kesantrian_weight?: number }): Promise<ComputedRaport | null> {
	try {
		const qs = new URLSearchParams({
			student_id: String(params.student_id),
			semester: params.semester,
			academic_year: params.academic_year
		});
		if (params.mapel_weight) qs.append('mapel_weight', String(params.mapel_weight));
		if (params.project_weight) qs.append('project_weight', String(params.project_weight));
		if (params.kesantrian_weight) qs.append('kesantrian_weight', String(params.kesantrian_weight));
		const r = await lmsFetch<ComputedRaport>(`/raport/calculate?${qs.toString()}`);
		return r.success ? r.data : null;
	} catch (e) { console.error('[Raport] calculate:', e); return null; }
}

export async function getRaportScores(stuId: number): Promise<ComputedRaport | null> {
	try {
		const r = await lmsFetch<ComputedRaport>(`/raport/santri/${stuId}?semester=1&academic_year=2025%2F2026`);
		return r.success ? r.data : null;
	} catch (e) { console.error('[Raport] get:', e); return null; }
}

export async function listStoredRaports(academicYear: string, semester: string): Promise<StoredRaport[]> {
	try {
		const q = new URLSearchParams({ academic_year: academicYear, semester });
		const r = await lmsFetch<StoredRaport[]>(`/raport/list?${q.toString()}`);
		return r.data || [];
	} catch (e) { console.error('[Raport] list:', e); return []; }
}

export async function saveRaport(payload: Partial<StoredRaport>): Promise<boolean> {
	try {
		const r = await lmsFetch('/raport/save', { method: 'POST', body: JSON.stringify(payload) });
		return r.success;
	} catch (e) { console.error('[Raport] save:', e); return false; }
}

export async function getKesantrianAspects(studentId: number, semester: string, academicYear: string): Promise<KesantrianAspect[]> {
	try {
		const q = new URLSearchParams({ student_id: String(studentId), semester, academic_year: academicYear });
		const r = await lmsFetch<KesantrianAspect[]>(`/raport/kesantrian?${q.toString()}`);
		return r.data || [];
	} catch (e) { console.error('[Raport] kesantrian get:', e); return []; }
}

export async function setKesantrianAspect(payload: { student_id: number; aspek: string; semester: string; academic_year: string; score: number }): Promise<boolean> {
	try {
		const r = await lmsFetch('/raport/kesantrian', { method: 'POST', body: JSON.stringify(payload) });
		return r.success;
	} catch (e) { console.error('[Raport] kesantrian set:', e); return false; }
}

export async function getExtendedSubjects(): Promise<ExtendedSubject[]> {
	try {
		const r = await lmsFetch<ExtendedSubject[]>('/raport/subjects');
		return r.data || [];
	} catch (e) { console.error('[Raport] subjects:', e); return []; }
}

export async function updateSubjectWeights(items: { subject_id: number; weight: number }[]): Promise<{ ok: boolean; message: string }> {
	try {
		const r = await lmsFetch('/raport/subjects/weights', { method: 'PUT', body: JSON.stringify(items) });
		return { ok: r.success, message: r.message };
	} catch (e) { return { ok: false, message: e instanceof Error ? e.message : 'Gagal update bobot mapel' }; }
}

export async function getMyRaport(semester: string = '1', academicYear: string = '2025/2026'): Promise<ComputedRaport | null> {
	try {
		const q = new URLSearchParams({ semester, academic_year: academicYear });
		const r = await lmsFetch<ComputedRaport>(`/portal/raport/me?${q.toString()}`);
		return r.success ? r.data : null;
	} catch (e) { console.error('[Raport] get my:', e); return null; }
}


// ===== Kesantrian: Data Santri CRUD =====

export interface Santri {
	id: number;
	nis: string;
	name: string;
	nickname: string;
	gender: string;
	birth_place: string;
	birth_date: string;
	address: string;
	class: string;
	angkatan: string;
	status: string;
	parent_name: string;
	parent_phone: string;
	photo_url: string;
	user_id?: number | null;
	created_at: string;
	updated_at: string;
}

export interface SantriListResult {
	items: Santri[];
	total: number;
	limit: number;
	offset: number;
}

export async function getSantriList(params: {
	search?: string;
	class?: string;
	status?: string;
	limit?: number;
	offset?: number;
} = {}): Promise<SantriListResult> {
	try {
		const qs = new URLSearchParams();
		if (params.search) qs.append('search', params.search);
		if (params.class) qs.append('class', params.class);
		if (params.status) qs.append('status', params.status);
		if (params.limit !== undefined) qs.append('limit', String(params.limit));
		if (params.offset !== undefined) qs.append('offset', String(params.offset));
		const r = await lmsFetch<SantriListResult>(`/santri?${qs.toString()}`);
		return r.data || { items: [], total: 0, limit: 20, offset: 0 };
	} catch (e) { console.error('[Kesantrian] list:', e); return { items: [], total: 0, limit: 20, offset: 0 }; }
}

export async function setSantriClass(items: { id: number; class: string }[]): Promise<{ ok: boolean; message: string; updated?: number }> {
	try {
		const r = await lmsFetch<{ updated?: number }>('/santri/set-class', { method: 'POST', body: JSON.stringify({ items }) });
		return { ok: r.success, message: r.message, updated: r.data?.updated };
	} catch (e) { return { ok: false, message: e instanceof Error ? e.message : 'Gagal menyimpan kelas' }; }
}

export async function linkSantriUser(id: number, user_id: number) {
	const res = await fetch(`${API_BASE_URL}/santri/${id}/link-user`, {
		method: 'PUT',
		headers: getAuthHeaders(),
		body: JSON.stringify({ user_id })
	});
	return parseResponse(res);
}

export interface ReceiptItem {
	id: number; code: string; date: string; santri_id: number;
	santri_nis?: string; santri_name?: string; bill_type: string; bill_id: number;
	description: string; amount: number; method: string; petugas?: string;
}

export interface ReceiptData {
	receipt: {
		id: number; receipt_no: string; santri_id: number;
		santri_nis?: string; santri_name?: string; santri_class?: string; parent_name?: string;
		period: string; description: string; total: number; method: string;
		petugas?: string; created_by?: number; created_at?: string;
	};
	items: ReceiptItem[];
}

async function fetchReceipt(url: string): Promise<ReceiptData | null> {
	try {
		const res = await fetch(url, { headers: getAuthHeaders(), cache: 'no-store' });
		const result = await parseResponse(res);
		if (!result.success) return null;
		return result.data as ReceiptData;
	} catch (e) {
		console.error('[Receipt]:', e);
		return null;
	}
}

export async function getReceipt(santri_id: number, period: string): Promise<ReceiptData | null> {
	return fetchReceipt(`${API_BASE_URL}/payments/receipt?santri_id=${santri_id}&period=${encodeURIComponent(period)}`);
}

export async function getMyReceipt(santri_id: number, period: string): Promise<ReceiptData | null> {
	return fetchReceipt(`${API_BASE_URL}/my-receipt?santri_id=${santri_id}&period=${encodeURIComponent(period)}`);
}

export interface MyBill {
	bill_type: string; bill_id: number; santri_id: number; santri_name: string;
	period: string; name: string; amount: number; paid: number; remain: number;
	status: string; due_date: string; payment_proof?: string;
}

export async function getMyBills(): Promise<MyBill[]> {
	try {
		const res = await fetch(`${API_BASE_URL}/my-bills`, { headers: getAuthHeaders(), cache: 'no-store' });
		const result = await parseResponse(res);
		return (result.data || []) as MyBill[];
	} catch (e) {
		console.error('[Bills] my-bills:', e);
		return [];
	}
}

export async function getMyLedger(): Promise<PayTx[]> {
	try {
		const res = await fetch(`${API_BASE_URL}/my-ledger`, { headers: getAuthHeaders(), cache: 'no-store' });
		const result = await parseResponse(res);
		return (result.data || []) as PayTx[];
	} catch (e) {
		console.error('[Bills] my-ledger:', e);
		return [];
	}
}

export async function submitSppProof(id: number, data: { amount: number; method?: string; paid_at?: string; proof_url: string }) {
	const res = await fetch(`${API_BASE_URL}/my-bills/spp/${id}/proof`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function submitIuranProof(id: number, data: { amount: number; method?: string; paid_at?: string; proof_url: string }) {
	const res = await fetch(`${API_BASE_URL}/my-bills/iuran/${id}/proof`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(data)
	});
	return parseResponse(res);
}

export async function verifySppBill(id: number, approve: boolean, note = '') {
	const res = await fetch(`${API_BASE_URL}/spp/bills/${id}/verify`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify({ approve, note })
	});
	return parseResponse(res);
}

export async function verifyIuranBill(id: number, approve: boolean, note = '') {
	const res = await fetch(`${API_BASE_URL}/iuran/bills/${id}/verify`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify({ approve, note })
	});
	return parseResponse(res);
}

export async function getMySantri(): Promise<Santri[]> {
	try {
		const res = await fetch(`${API_BASE_URL}/my-santri`, {
			headers: getAuthHeaders(),
			cache: 'no-store'
		});
		const result = await parseResponse(res);
		return (result.data || []) as Santri[];
	} catch (e) {
		console.error('[Santri] my-santri:', e);
		return [];
	}
}

export async function getSantri(id: number): Promise<Santri | null> {
	try {
		const r = await lmsFetch<Santri>(`/santri/${id}`);
		return r.success ? r.data : null;
	} catch (e) { console.error('[Kesantrian] get:', e); return null; }
}

export async function createSantri(data: Partial<Santri>): Promise<{ ok: boolean; message: string; errors?: Record<string, string> }> {
	try {
		const r = await lmsFetch('/santri', { method: 'POST', body: JSON.stringify(data) });
		return { ok: r.success, message: r.message, errors: (r as { errors?: Record<string, string> }).errors };
	} catch (e) { return { ok: false, message: e instanceof Error ? e.message : 'Gagal menambah santri' }; }
}

export async function updateSantri(id: number, data: Partial<Santri>): Promise<{ ok: boolean; message: string; errors?: Record<string, string> }> {
	try {
		const r = await lmsFetch(`/santri/${id}`, { method: 'PUT', body: JSON.stringify(data) });
		return { ok: r.success, message: r.message, errors: (r as { errors?: Record<string, string> }).errors };
	} catch (e) { return { ok: false, message: e instanceof Error ? e.message : 'Gagal memperbarui santri' }; }
}

export async function deleteSantri(id: number): Promise<boolean> {
	try {
		const r = await lmsFetch(`/santri/${id}`, { method: 'DELETE' });
		return r.success;
	} catch (e) { console.error('[Kesantrian] delete:', e); return false; }
}

export async function bulkCreateSantri(items: Partial<Santri>[]): Promise<{ ok: boolean; message: string; inserted?: number }> {
	try {
		const r = await lmsFetch('/santri/bulk', { method: 'POST', body: JSON.stringify({ items }) });
		return { ok: r.success, message: r.message, inserted: (r.data as { inserted?: number } | undefined)?.inserted };
	} catch (e) { return { ok: false, message: e instanceof Error ? e.message : 'Gagal import santri' }; }
}

export async function bulkDeleteSantri(ids: number[]): Promise<{ ok: boolean; message: string; deleted?: number }> {
	try {
		const r = await lmsFetch('/santri/bulk', { method: 'DELETE', body: JSON.stringify({ ids }) });
		return { ok: r.success, message: r.message, deleted: (r.data as { deleted?: number } | undefined)?.deleted };
	} catch (e) { return { ok: false, message: e instanceof Error ? e.message : 'Gagal menghapus santri' }; }
}

export interface SchoolClass { id: number; code: string; name: string; jenjang: string; wali_name: string; academic_year: string; is_active: number; created_at: string; updated_at: string; }
export interface AcademicYear { id: number; name: string; start_date: string; end_date: string; is_active: number; created_at: string; updated_at: string; }

export async function getClasses(activeOnly = false) {
  try {
    const res = await fetch(`${API_BASE_URL}/school/classes${activeOnly ? "?active_only=true" : ""}`, { headers: getAuthHeaders(), cache: "no-store" });
    const result = await parseResponse(res);
    return (result.data || []) as SchoolClass[];
  } catch (e) { console.error("[API] Fetch classes error:", e); return []; }
}
export async function createClass(data: { name: string; jenjang?: string; wali_name?: string; academic_year?: string }) {
  const res = await fetch(`${API_BASE_URL}/school/classes`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(data) });
  return parseResponse(res);
}
export async function updateClass(id: number, data: { name: string; jenjang?: string; wali_name?: string; academic_year?: string; is_active: number }) {
  const res = await fetch(`${API_BASE_URL}/school/classes/${id}`, { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(data) });
  return parseResponse(res);
}
export async function deleteClass(id: number) {
  const res = await fetch(`${API_BASE_URL}/school/classes/${id}`, { method: "DELETE", headers: getAuthHeaders() });
  return parseResponse(res);
}
export async function getAcademicYears() {
  try {
    const res = await fetch(`${API_BASE_URL}/school/years`, { headers: getAuthHeaders(), cache: "no-store" });
    const result = await parseResponse(res);
    return (result.data || []) as AcademicYear[];
  } catch (e) { console.error("[API] Fetch years error:", e); return []; }
}
export async function createAcademicYear(data: { name: string; start_date?: string; end_date?: string }) {
  const res = await fetch(`${API_BASE_URL}/school/years`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(data) });
  return parseResponse(res);
}
export async function activateAcademicYear(id: number) {
  const res = await fetch(`${API_BASE_URL}/school/years/${id}/activate`, { method: "POST", headers: getAuthHeaders() });
  return parseResponse(res);
}
export async function deleteAcademicYear(id: number) {
  const res = await fetch(`${API_BASE_URL}/school/years/${id}`, { method: "DELETE", headers: getAuthHeaders() });
  return parseResponse(res);
}

export interface KasCategory { id: number; code: string; name: string; kind: string; creator?: string; updater?: string; created_at: string; }
export async function updateKasCategory(id: number, data: { name: string; kind: string }) {
  const res = await fetch(`${API_BASE_URL}/kas/categories/${id}`, { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(data) });
  return parseResponse(res);
}
export interface KasTransaction { id: number; code: string; date: string; kind: string; category_id: number; category?: string; amount: number; method: string; notes: string; created_by: number; creator?: string; created_at: string; }
export interface KasSummary { income: number; expense: number; balance: number; count_in: number; count_out: number; spp_income: number; iuran_income: number; donasi_income: number; kas_income: number; }

export async function getKasCategories(kind = "") {
  try {
    const res = await fetch(`${API_BASE_URL}/kas/categories${kind ? `?kind=${kind}` : ""}`, { headers: getAuthHeaders(), cache: "no-store" });
    const result = await parseResponse(res);
    return (result.data || []) as KasCategory[];
  } catch (e) { console.error("[API] Fetch kas categories error:", e); return []; }
}
export async function createKasCategory(data: { name: string; kind: string }) {
  const res = await fetch(`${API_BASE_URL}/kas/categories`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(data) });
  return parseResponse(res);
}
export async function getKasTransactions(params: { date_from?: string; date_to?: string; kind?: string; category_id?: number } = {}) {
  try {
    const q = new URLSearchParams();
    if (params.date_from) q.set("date_from", params.date_from);
    if (params.date_to) q.set("date_to", params.date_to);
    if (params.kind) q.set("kind", params.kind);
    if (params.category_id) q.set("category_id", String(params.category_id));
    const res = await fetch(`${API_BASE_URL}/kas/transactions?${q.toString()}`, { headers: getAuthHeaders(), cache: "no-store" });
    const result = await parseResponse(res);
    return (result.data || []) as KasTransaction[];
  } catch (e) { console.error("[API] Fetch kas transactions error:", e); return []; }
}
export async function createKasTransaction(data: { date: string; kind: string; category_id?: number; amount: number; method?: string; notes?: string }) {
  const res = await fetch(`${API_BASE_URL}/kas/transactions`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(data) });
  return parseResponse(res);
}
export async function deleteKasTransaction(id: number) {
  const res = await fetch(`${API_BASE_URL}/kas/transactions/${id}`, { method: "DELETE", headers: getAuthHeaders() });
  return parseResponse(res);
}
export async function getKasSummary(date_from = "", date_to = ""): Promise<KasSummary | null> {
  try {
    const q = new URLSearchParams();
    if (date_from) q.set("date_from", date_from);
    if (date_to) q.set("date_to", date_to);
    const res = await fetch(`${API_BASE_URL}/kas/summary?${q.toString()}`, { headers: getAuthHeaders(), cache: "no-store" });
    const result = await parseResponse(res);
    return (result.data || null) as KasSummary | null;
  } catch (e) { console.error("[API] Fetch kas summary error:", e); return null; }
}

export interface PerGuruRow { teacher_id: number; teacher_name: string; subject_count: number; subjects: string; student_count: number; grade_count: number; avg_final: number; }
export async function getReportPerGuru(params: { semester?: string; year?: string } = {}) {
  try {
    const q = new URLSearchParams();
    if (params.semester) q.set("semester", params.semester);
    if (params.year) q.set("year", params.year);
    const res = await fetch(`${API_BASE_URL}/academics/report-per-guru?${q.toString()}`, { headers: getAuthHeaders(), cache: "no-store" });
    const result = await parseResponse(res);
    return (result.data || []) as PerGuruRow[];
  } catch (e) { console.error("[API] Fetch per-guru error:", e); return []; }
}

export interface Employee { code: string; name: string; gender: string; birth_place: string; birth_date: string; phone: string; email: string; kind: string; is_active: number; created_at: string; updated_at: string; }
export interface TeacherAttendance { id: number; employee_code: string; employee_name?: string; date: string; status: string; notes: string; time_in: string; time_out: string; minutes: number; }
export interface PerGuruSummary { without_info: number; present: number; sick: number; permit: number; total_minutes: number; count: number; }
export interface RekapAbsensi { code: string; name: string; days: number; present: number; sick: number; permit: number; alpha: number; percent: number; }

export async function getEmployees(search = "") {
  try {
    const q = new URLSearchParams();
    if (search) q.set("search", search);
    const res = await fetch(`${API_BASE_URL}/hr/employees?${q.toString()}`, { headers: getAuthHeaders(), cache: "no-store" });
    const result = await parseResponse(res);
    return (result.data || []) as Employee[];
  } catch (e) { console.error("[API] Fetch employees error:", e); return []; }
}
export async function createEmployee(data: { code: string; name: string; gender?: string; birth_place?: string; birth_date?: string; phone?: string; email?: string; kind: string }) {
  const res = await fetch(`${API_BASE_URL}/hr/employees`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(data) });
  return parseResponse(res);
}
export async function deleteEmployee(code: string) {
  const res = await fetch(`${API_BASE_URL}/hr/employees/${encodeURIComponent(code)}`, { method: "DELETE", headers: getAuthHeaders() });
  return parseResponse(res);
}
export async function getTeacherAttendance(params: { code?: string; from?: string; to?: string } = {}) {
  try {
    const q = new URLSearchParams();
    if (params.code) q.set("code", params.code);
    if (params.from) q.set("from", params.from);
    if (params.to) q.set("to", params.to);
    const res = await fetch(`${API_BASE_URL}/hr/attendance?${q.toString()}`, { headers: getAuthHeaders(), cache: "no-store" });
    const result = await parseResponse(res);
    return (result.data || []) as TeacherAttendance[];
  } catch (e) { console.error("[API] Fetch attendance error:", e); return []; }
}
export async function createTeacherAttendance(data: { employee_code: string; date: string; status: string; notes?: string; time_in?: string; time_out?: string }) {
  const res = await fetch(`${API_BASE_URL}/hr/attendance`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(data) });
  return parseResponse(res);
}
export async function deleteTeacherAttendance(id: number) {
  const res = await fetch(`${API_BASE_URL}/hr/attendance/${id}`, { method: "DELETE", headers: getAuthHeaders() });
  return parseResponse(res);
}
export async function getPerGuru(code: string, from: string, to: string): Promise<{ summary: PerGuruSummary; rows: TeacherAttendance[] } | null> {
  try {
    const q = new URLSearchParams({ code, from, to });
    const res = await fetch(`${API_BASE_URL}/hr/per-guru?${q.toString()}`, { headers: getAuthHeaders(), cache: "no-store" });
    const result = await parseResponse(res);
    return (result.data || null) as { summary: PerGuruSummary; rows: TeacherAttendance[] } | null;
  } catch (e) { console.error("[API] Fetch per-guru error:", e); return null; }
}
export async function getRekapAbsensi(from: string, to: string) {
  try {
    const q = new URLSearchParams({ from, to });
    const res = await fetch(`${API_BASE_URL}/hr/rekap?${q.toString()}`, { headers: getAuthHeaders(), cache: "no-store" });
    const result = await parseResponse(res);
    return (result.data || []) as RekapAbsensi[];
  } catch (e) { console.error("[API] Fetch rekap error:", e); return []; }
}

export interface PayTx { id: number; code: string; date: string; santri_id: number; santri_nis?: string; santri_name?: string; bill_type: string; bill_id: number; description: string; amount: number; method: string; petugas?: string; }
export interface UnpaidBill { bill_type: string; bill_id: number; period: string; name: string; amount: number; paid: number; remain: number; due_date: string; }

export async function getPayTransactions(params: { from?: string; to?: string; search?: string } = {}) {
  try {
    const q = new URLSearchParams();
    if (params.from) q.set("from", params.from);
    if (params.to) q.set("to", params.to);
    if (params.search) q.set("search", params.search);
    const res = await fetch(`${API_BASE_URL}/payments/transactions?${q.toString()}`, { headers: getAuthHeaders(), cache: "no-store" });
    const result = await parseResponse(res);
    return (result.data || []) as PayTx[];
  } catch (e) { console.error("[API] Fetch pay tx error:", e); return []; }
}
export async function getUnpaidBills(santri_id: number) {
  try {
    const res = await fetch(`${API_BASE_URL}/payments/unpaid?santri_id=${santri_id}`, { headers: getAuthHeaders(), cache: "no-store" });
    const result = await parseResponse(res);
    return (result.data || []) as UnpaidBill[];
  } catch (e) { console.error("[API] Fetch unpaid error:", e); return []; }
}

export interface RawLog { id: number; fp_id: string; date: string; time: string; verify: string; machine: string; }
export async function getRawLogs(from = "", to = "") {
  try {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    const res = await fetch(`${API_BASE_URL}/hr/raw-logs?${q.toString()}`, { headers: getAuthHeaders(), cache: "no-store" });
    const result = await parseResponse(res);
    return (result.data || []) as RawLog[];
  } catch (e) { console.error("[API] Fetch rawlog error:", e); return []; }
}
export async function importRawLogs(rows: { fp_id: string; date: string; time?: string; verify?: string; machine?: string }[]) {
  const res = await fetch(`${API_BASE_URL}/hr/raw-logs/import`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ rows }) });
  return parseResponse(res);
}
export async function syncAbsen(from: string, to: string) {
  const res = await fetch(`${API_BASE_URL}/hr/sync`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify({ from, to }) });
  return parseResponse(res);
}
