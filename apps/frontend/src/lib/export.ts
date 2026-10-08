import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

type JsPDFWithAutoTable = jsPDF & { lastAutoTable: { finalY: number } };

type ReportScoreRow = {
	subject: string;
	semester: string;
	academicYear: string;
	finalScore: string | number;
	gradeLetter: string;
};

type ReportTahfidzRow = {
	surahName: string;
	juz: string | number;
	ayatRange: string;
	status: string;
	evaluationDate: string;
};

type StudentReportPayload = {
	studentName: string;
	studentIdentity?: string;
	homeroomTeacher?: string;
	parentName?: string;
	placeDate?: string;
	printedAt?: string;
	averageScore: string | number;
	hadir: string | number;
	izinSakit: string | number;
	alpha: string | number;
	scores: ReportScoreRow[];
	tahfidz: ReportTahfidzRow[];
	filename: string;
};

type BulkStudentReportPayload = {
	title?: string;
	filename: string;
	reports: StudentReportPayload[];
};

type AutoTableDoc = jsPDF & {
	lastAutoTable?: {
		finalY?: number;
	};
};

/**
 * Kop pondok (nama/alamat/kontak/logo) dari /api/settings/public, di-cache per sesi.
 * Semua dokumen cetak WAJIB pakai helper ini supaya nama sekolah konsisten.
 */
async function kopInfo(): Promise<KopInfo> {
	if (!_kopCache) _kopCache = await loadKopInfo();
	return _kopCache;
}

async function logoDataUrl(path: string) {
	if (_logoCache[path] === undefined) {
		_logoCache[path] = await loadLogoDataUrl(path);
	}
	return _logoCache[path];
}

/**
 * Export data ke PDF dengan kop resmi pondok (dari settings, bukan hardcode).
 */
export async function exportToPDF(
	title: string,
	columns: string[],
	rows: (string | number)[][],
	filename: string
) {
	const doc = new jsPDF();
	const kop = await kopInfo();
	const logo = await logoDataUrl(kop.logoPath);
	const hasLogo = (() => {
		if (!logo) return false;
		try {
			doc.addImage(logo.dataUrl, logo.format, 14, 7, 22, 22);
			return true;
		} catch {
			return false;
		}
	})();
	const headW = hasLogo ? 150 : 182;

	// Header pondok
	doc.setTextColor(30, 41, 59);
	doc.setFontSize(16);
	doc.setFont('helvetica', 'bold');
	doc.text(kop.name, 105, 18, { align: 'center', maxWidth: headW });
	doc.setFontSize(10);
	doc.setFont('helvetica', 'normal');
	doc.setTextColor(71, 85, 105);
	doc.text(doc.splitTextToSize(kop.address, headW), 105, 25, { align: 'center' });
	doc.setFontSize(8.5);
	doc.setTextColor(100, 116, 139);
	doc.text(doc.splitTextToSize(kop.contact, headW), 105, 30, { align: 'center' });

	// Garis pemisah
	doc.setLineWidth(0.5);
	doc.line(14, 33, 196, 33);

	// Judul laporan
	doc.setTextColor(15, 118, 110);
	doc.setFontSize(13);
	doc.setFont('helvetica', 'bold');
	doc.text(title, 105, 42, { align: 'center' });

	// Tanggal cetak
	doc.setFontSize(8);
	doc.setFont('helvetica', 'normal');
	doc.setTextColor(100, 116, 139);
	doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 50);

	// Tabel
	autoTable(doc, {
		startY: 55,
		head: [columns],
		body: rows,
		theme: 'grid',
		headStyles: { fillColor: [37, 99, 235], fontSize: 9, fontStyle: 'bold' },
		bodyStyles: { fontSize: 8 },
		alternateRowStyles: { fillColor: [248, 250, 252] },
	});

	doc.save(`${filename}.pdf`);
}

async function renderStudentReport(doc: jsPDF, payload: StudentReportPayload): Promise<jsPDF> {
	const tableDoc = doc as AutoTableDoc;
	const printedAt =
		payload.printedAt ||
		new Date().toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		});

	await renderKop(doc, 210);
	doc.setTextColor(255, 255, 255);
	doc.setFontSize(11);
	doc.setFont('helvetica', 'bold');
	doc.text('e-Raport Akademik Santri', 105, 44, { align: 'center' });
	doc.setTextColor(30, 41, 59);

	doc.setFillColor(248, 250, 252);
	doc.roundedRect(14, 54, 182, 24, 3, 3, 'F');
	doc.setFontSize(10);
	doc.setFont('helvetica', 'bold');
	doc.text('Nama Santri', 18, 61);
	doc.text('Identitas', 18, 69);
	doc.setFont('helvetica', 'normal');
	doc.text(payload.studentName, 50, 61);
	doc.text(payload.studentIdentity || '-', 50, 69);
	doc.setFont('helvetica', 'bold');
	doc.text('Rata-rata', 132, 61);
	doc.text('Kehadiran', 132, 69);
	doc.setFont('helvetica', 'normal');
	doc.text(String(payload.averageScore), 165, 61, { align: 'right' });
	doc.text(`${payload.hadir} hadir / ${payload.alpha} alpha`, 190, 69, { align: 'right' });

	doc.setFillColor(236, 253, 245);
	doc.roundedRect(14, 84, 42, 16, 3, 3, 'F');
	doc.roundedRect(61, 84, 42, 16, 3, 3, 'F');
	doc.setFillColor(255, 251, 235);
	doc.roundedRect(108, 84, 42, 16, 3, 3, 'F');
	doc.setFillColor(254, 242, 242);
	doc.roundedRect(154, 84, 42, 16, 3, 3, 'F');
	doc.setFontSize(8);
	doc.setFont('helvetica', 'bold');
	doc.text('RATA-RATA NILAI', 35, 90, { align: 'center' });
	doc.text('HADIR', 82, 90, { align: 'center' });
	doc.text('IZIN / SAKIT', 129, 90, { align: 'center' });
	doc.text('ALPHA', 175, 90, { align: 'center' });
	doc.setFontSize(12);
	doc.text(String(payload.averageScore), 35, 97, { align: 'center' });
	doc.text(String(payload.hadir), 82, 97, { align: 'center' });
	doc.text(String(payload.izinSakit), 129, 97, { align: 'center' });
	doc.text(String(payload.alpha), 175, 97, { align: 'center' });

	autoTable(doc, {
		startY: 108,
		head: [['Mata Pelajaran', 'Semester', 'Tahun', 'Nilai Akhir', 'Predikat']],
		body: payload.scores.length
			? payload.scores.map((item) => [
					item.subject,
					item.semester,
					item.academicYear,
					String(item.finalScore),
					item.gradeLetter,
			  ])
			: [['Belum ada nilai', '-', '-', '-', '-']],
		theme: 'grid',
		headStyles: { fillColor: [5, 150, 105], fontSize: 9, fontStyle: 'bold' },
		bodyStyles: { fontSize: 8 },
		alternateRowStyles: { fillColor: [248, 250, 252] },
	});

	const tahfidzStartY = tableDoc.lastAutoTable?.finalY ? tableDoc.lastAutoTable.finalY + 10 : 120;
	doc.setFontSize(11);
	doc.setFont('helvetica', 'bold');
	doc.text('Progres Tahfidz', 14, tahfidzStartY);

	autoTable(doc, {
		startY: tahfidzStartY + 4,
		head: [['Surah', 'Juz', 'Ayat', 'Status', 'Evaluasi']],
		body: payload.tahfidz.length
			? payload.tahfidz.map((item) => [
					item.surahName,
					String(item.juz),
					item.ayatRange,
					item.status,
					item.evaluationDate,
			  ])
			: [['Belum ada progres tahfidz', '-', '-', '-', '-']],
		theme: 'grid',
		headStyles: { fillColor: [217, 119, 6], fontSize: 9, fontStyle: 'bold' },
		bodyStyles: { fontSize: 8 },
		alternateRowStyles: { fillColor: [255, 251, 235] },
	});

	const noteStartY = tableDoc.lastAutoTable?.finalY ? tableDoc.lastAutoTable.finalY + 12 : tahfidzStartY + 50;
	doc.setFontSize(10);
	doc.setFont('helvetica', 'bold');
	doc.text('Catatan Wali Kelas / Musyrif', 14, noteStartY);
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(9);
	const noteText =
		'Raport ini merupakan ringkasan perkembangan akademik, presensi, dan tahfidz santri. ' +
		'Gunakan sebagai bahan evaluasi dan pendampingan belajar di rumah.';
	doc.text(noteText, 14, noteStartY + 6, { maxWidth: 182, align: 'left' });

	renderSignatures(doc, noteStartY + 16, {
		homeroomTeacher: payload.homeroomTeacher,
		parentName: payload.parentName,
		placeDate: payload.placeDate,
	});

	return doc;
}

async function buildStudentReportDoc(payload: StudentReportPayload): Promise<jsPDF> {
	const doc = new jsPDF();
	await renderStudentReport(doc, payload);
	return doc;
}

export async function previewStudentReportPDF(payload: StudentReportPayload): Promise<void> {
	const doc = await buildStudentReportDoc(payload);
	window.open(doc.output('bloburl'), '_blank', 'noopener,noreferrer');
}

export async function downloadStudentReportPDF(payload: StudentReportPayload): Promise<void> {
	const doc = await buildStudentReportDoc(payload);
	doc.save(`${payload.filename}.pdf`);
}

async function buildBulkStudentReportDoc(payload: BulkStudentReportPayload): Promise<jsPDF> {
	const doc = new jsPDF();

	for (let index = 0; index < payload.reports.length; index++) {
		if (index > 0) {
			doc.addPage();
		}
		await renderStudentReport(doc, payload.reports[index]);
	}

	return doc;
}

export async function previewBulkStudentReportPDF(payload: BulkStudentReportPayload): Promise<void> {
	const doc = await buildBulkStudentReportDoc(payload);
	window.open(doc.output('bloburl'), '_blank', 'noopener,noreferrer');
}

export async function downloadBulkStudentReportPDF(payload: BulkStudentReportPayload): Promise<void> {
	const doc = await buildBulkStudentReportDoc(payload);
	doc.save(`${payload.filename}.pdf`);
}

/**
 * Export data ke Excel (.xlsx)
 */
export async function exportToExcel(
	title: string,
	columns: string[],
	rows: (string | number)[][],
	filename: string
) {
	const safeSheetName = title
		.replace(/[:\\/?*\[\]]/g, '-')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 31) || 'Sheet1';

	const kop = await kopInfo();
	const wsData = [
		[kop.name],
		[kop.address],
		[kop.contact],
		[],
		[`Laporan: ${title}`],
		[`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`],
		[],
		columns,
		...rows
	];

	const ws = XLSX.utils.aoa_to_sheet(wsData);

	// Merge header cells
	ws['!merges'] = [
		{ s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
		{ s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } },
		{ s: { r: 2, c: 0 }, e: { r: 2, c: columns.length - 1 } },
	];

	// Set column widths
	ws['!cols'] = columns.map(() => ({ wch: 20 }));

	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

	const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
	const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
	saveAs(blob, `${filename}.xlsx`);
}


/**
 * E-Raport PDF (LMS ALMAA) — prints the final raport with mapel, project, kesantrian scores.
 */
export type ERaportPDFPayload = {
	studentName: string;
	studentID: number;
	semester: string;
	academicYear: string;
	mapelScore: number;
	projectScore: number;
	kesantrianScore: number;
	finalScore: number;
	predikat: string;
	mapel: { subject: string; score: number; weight?: number }[];
	project: { name: string; score: number; weight?: number }[];
	kesantrian: { aspek: string; score: number }[];
	// Progres tahfidz (informatif — tidak dihitung ke nilai akhir, Jilid 90).
	tahfidz?: { surah: string; juz: number; ayat: string; status: string }[];
	printedAt?: string;
	homeroomTeacher?: string;
	parentName?: string;
	placeDate?: string;
};

export interface KopInfo {
	name: string;
	address: string;
	contact: string;
	logoPath: string;
}

async function loadKopInfo(): Promise<KopInfo> {
	const fallback: KopInfo = {
		name: 'PONDOK PESANTREN AL-MAA PARUNG BOGOR',
		address: 'Jl Haji Mawi Gang Omega, Desa Waru, Parung, Bogor, Jawa Barat',
		contact: '+6287784423282 · ponpesalmaaparung@gmail.com · almaparung.com',
		logoPath: '/assets/img/logo-alama.jpg',
	};
	try {
		const base = typeof window !== 'undefined' ? window.location.origin : '';
		const res = await fetch(`${base}/api/settings/public`, { cache: 'no-store' });
		const json = await res.json();
		const list: Array<{ key: string; value: string }> = json?.data || [];
		const get = (k: string) => (list.find(s => s.key === k)?.value || '').trim();
		const addr = get('school_address') || fallback.address;
		const contacts = [get('school_phone'), get('school_email'), get('school_website')].filter(Boolean).join(' · ');
		return {
			name: (get('school_name') || fallback.name).toUpperCase(),
			address: addr,
			contact: contacts || fallback.contact,
			logoPath: get('web_logo_url') || fallback.logoPath,
		};
	} catch {
		return fallback;
	}
}

async function loadLogoDataUrl(path: string): Promise<{ dataUrl: string; format: 'JPEG' | 'PNG' } | null> {
	try {
		const base = typeof window !== 'undefined' ? window.location.origin : '';
		const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : '/' + path}`;
		const res = await fetch(url, { cache: 'force-cache' });
		if (!res.ok) return null;
		const blob = await res.blob();
		const format = (blob.type || '').includes('png') ? 'PNG' : 'JPEG';
		const dataUrl = await new Promise<string>((resolve, reject) => {
			const fr = new FileReader();
			fr.onload = () => resolve(String(fr.result || ''));
			fr.onerror = () => reject(new Error('logo'));
			fr.readAsDataURL(blob);
		});
		if (!dataUrl.startsWith('data:image/')) return null;
		return { dataUrl, format };
	} catch {
		return null;
	}
}

let _kopCache: KopInfo | null = null;
const _logoCache: Record<string, { dataUrl: string; format: 'JPEG' | 'PNG' } | null | undefined> = {};

// renderKop menggambar kop resmi (logo kiri + nama & alamat sekolah).
// Dipakai semua PDF raport agar seragam.
export interface SignatureInfo {
	homeroomTeacher?: string;
	parentName?: string;
	placeDate?: string;
}

// renderSignatures menggambar blok tanda tangan: kiri Orang Tua/Wali,
// kanan Wali Kelas, lengkap tempat-tanggal di atasnya. Otomatis pindah
// halaman bila ruang tidak cukup. Mengembalikan posisi Y akhir.
function renderSignatures(
	doc: jsPDF,
	startY: number,
	info: SignatureInfo = {},
): number {
	const pageH = doc.internal.pageSize.getHeight();
	const pageW = doc.internal.pageSize.getWidth();
	let y = startY;
	if (y + 58 > pageH - 14) {
		doc.addPage();
		y = 20;
	}
	const placeDate =
		info.placeDate ||
		`Parung, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
	doc.setTextColor(30, 41, 59);
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(10);
	doc.text(placeDate, pageW - 14, y, { align: 'right' });
	y += 4;
	const colW = (pageW - 28) / 2;
	const leftX = 14;
	const rightX = 14 + colW;
	const drawCol = (x: number, title: string, name?: string) => {
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(11);
		doc.text(title, x + colW / 2, y, { align: 'center', maxWidth: colW });
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(10);
		const nameY = y + 26;
		if (name) {
			doc.setFont('helvetica', 'bold');
			doc.text(name, x + colW / 2, nameY, { align: 'center', maxWidth: colW - 8 });
			doc.setFont('helvetica', 'normal');
		}
		doc.setLineWidth(0.4);
		doc.setDrawColor(30, 41, 59);
		doc.line(x + 12, nameY + 2, x + colW - 12, nameY + 2);
		doc.setFontSize(9);
		doc.setTextColor(100, 116, 139);
		doc.text(name ? 'Nama jelas & tanda tangan' : 'Tanda tangan & nama jelas', x + colW / 2, nameY + 7, { align: 'center' });
		doc.setTextColor(30, 41, 59);
	};
	drawCol(leftX, 'Orang Tua / Wali', info.parentName);
	drawCol(rightX, 'Wali Kelas', info.homeroomTeacher);
	return y + 38;
}

async function renderKop(doc: jsPDF, pageW: number): Promise<void> {
	const kop = await kopInfo();
	const logo = await logoDataUrl(kop.logoPath);
	doc.setFillColor(16, 105, 79);
	doc.rect(0, 0, pageW, 48, 'F');
	let tx = 14;
	if (logo) {
		try {
			doc.addImage(logo.dataUrl, logo.format, 14, 9, 26, 26);
			tx = 46;
		} catch { /* tanpa logo bila gagal */ }
	}
	doc.setTextColor(255, 255, 255);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(15);
	doc.text(kop.name, tx, 16, { maxWidth: pageW - tx - 14 });
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(9);
	const addrLines = doc.splitTextToSize(kop.address, pageW - tx - 14);
	doc.text(addrLines.slice(0, 2), tx, 22);
	doc.setFontSize(8.5);
	doc.text(kop.contact, tx, 22 + addrLines.slice(0, 2).length * 4 + 1, { maxWidth: pageW - tx - 14 });
	doc.setDrawColor(255, 255, 255);
	doc.setLineWidth(0.4);
	doc.line(14, 39.4, pageW - 14, 39.4);
	doc.setDrawColor(217, 179, 106);
	doc.setLineWidth(0.7);
	doc.line(14, 41, pageW - 14, 41);
	// Kop selesai: kembalikan teks ke gelap supaya pemanggil tidak mewarisi putih
	doc.setTextColor(30, 41, 59);
}

export async function exportERaportPDF(payload: ERaportPDFPayload) {
	const doc = new jsPDF('p', 'mm', 'a4');
	const pageW = doc.internal.pageSize.getWidth();

	await renderKop(doc, pageW);
	doc.setTextColor(255, 255, 255);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(11);
	doc.text(`Laporan Hasil Belajar Santri (E-Raport)  ·  ${payload.studentName}  ·  Semester ${payload.semester}  ·  TA ${payload.academicYear}`, pageW / 2, 45, { align: 'center', maxWidth: pageW - 28 });

	// Identity + Final score
	doc.setTextColor(30, 41, 59);
	doc.setFillColor(240, 253, 244);
	doc.roundedRect(14, 50, pageW - 28, 20, 3, 3, 'F');
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(12);
	doc.text(`Nilai Akhir: ${payload.finalScore.toFixed(2)}`, 20, 58);
	doc.setFontSize(11);
	doc.text(`Predikat: ${payload.predikat}`, 20, 65);
	doc.setFont('helvetica', 'normal');

	// Components (rata-rata biasa, tanpa bobot)
	doc.setFontSize(10);
	doc.setTextColor(71, 85, 105);
	doc.text('Nilai Akhir = rata-rata Nilai Mapel, Nilai Project, dan Nilai Kesantrian', 14, 78);

	// Table: components summary
	let y = 84;
	autoTable(doc, {
		startY: y,
		head: [['Komponen', 'Nilai']],
		body: [
			['Mata Pelajaran', payload.mapelScore.toFixed(2)],
			['Project', payload.projectScore.toFixed(2)],
			['Kesantrian', payload.kesantrianScore.toFixed(2)],
		],
		styles: { fontSize: 10 },
		headStyles: { fillColor: [15, 118, 110], textColor: 255 },
	});
	y = (doc as unknown as JsPDFWithAutoTable).lastAutoTable.finalY + 6;

	// Mapel breakdown
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(11);
	doc.setTextColor(15, 118, 110);
	doc.text('Rincian Mata Pelajaran', 14, y);
	doc.setFont('helvetica', 'normal');
	y += 2;
	autoTable(doc, {
		startY: y,
		head: [['Mata Pelajaran', 'Nilai']],
		body: payload.mapel.map(m => [m.subject, m.score.toFixed(2)]),
		styles: { fontSize: 9 },
		headStyles: { fillColor: [15, 118, 110], textColor: 255 },
	});
	y = (doc as unknown as JsPDFWithAutoTable).lastAutoTable.finalY + 6;

	// Project breakdown
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(11);
	doc.text('Rincian Project', 14, y);
	doc.setFont('helvetica', 'normal');
	y += 2;
	autoTable(doc, {
		startY: y,
		head: [['Sub Project', 'Skor (1-4)']],
		body: payload.project.map(p => [p.name, p.score > 0 ? p.score.toFixed(1) : '-']),
		styles: { fontSize: 9 },
		headStyles: { fillColor: [15, 118, 110], textColor: 255 },
	});
	y = (doc as unknown as JsPDFWithAutoTable).lastAutoTable.finalY + 6;

	// Kesantrian breakdown
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(11);
	doc.text('Rincian Kesantrian', 14, y);
	doc.setFont('helvetica', 'normal');
	y += 2;
	autoTable(doc, {
		startY: y,
		head: [['Aspek', 'Skor (1-4)']],
		body: payload.kesantrian.map(k => [k.aspek, k.score.toFixed(1)]),
		styles: { fontSize: 9 },
		headStyles: { fillColor: [15, 118, 110], textColor: 255 },
	});

	const lastY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 120;

	// Progres Tahfidz — informatif, TIDAK ikut nilai akhir (Jilid 90).
	const tahfidzRows = payload.tahfidz || [];
	if (tahfidzRows.length > 0) {
		let ty = lastY + 8;
		const pageH = doc.internal.pageSize.getHeight();
		if (ty > pageH - 45) {
			doc.addPage();
			ty = 20;
		}
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(11);
		doc.text('Progres Tahfidz (informatif — tidak memengaruhi nilai akhir)', 14, ty);
		doc.setFont('helvetica', 'normal');
		ty += 2;
		autoTable(doc, {
			startY: ty,
			head: [['Surah', 'Juz', 'Ayat', 'Status']],
			body: tahfidzRows.map(t => [t.surah, String(t.juz), t.ayat, t.status]),
			styles: { fontSize: 9 },
			headStyles: { fillColor: [15, 118, 110], textColor: 255 },
		});
	}

	const finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || lastY;
	renderSignatures(doc, finalY + 12, {
		homeroomTeacher: payload.homeroomTeacher,
		parentName: payload.parentName,
		placeDate: payload.placeDate,
	});

	// Footer
	const fy = doc.internal.pageSize.getHeight() - 14;
	doc.setFontSize(9);
	doc.setTextColor(148, 163, 184);
	doc.text(`Dicetak: ${payload.printedAt || new Date().toLocaleString('id-ID')} · Sistem LMS ALMAA`, 14, fy);

	doc.save(`E-Raport-${payload.studentName.replace(/\s+/g, '-')}-${payload.semester}-${payload.academicYear.replace(/\//g, '-')}.pdf`);
}
