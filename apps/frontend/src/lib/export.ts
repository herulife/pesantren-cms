import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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

/**
 * Export data ke PDF dengan header Darussunnah
 */
export function exportToPDF(
	title: string,
	columns: string[],
	rows: (string | number)[][],
	filename: string
) {
	const doc = new jsPDF();

	// Header pondok
	doc.setFontSize(16);
	doc.setFont('helvetica', 'bold');
	doc.text('PONDOK PESANTREN DARUSSUNNAH', 105, 20, { align: 'center' });
	doc.setFontSize(10);
	doc.setFont('helvetica', 'normal');
	doc.text('Jl. Raya Parung - Bogor, Jawa Barat', 105, 28, { align: 'center' });

	// Garis pemisah
	doc.setLineWidth(0.5);
	doc.line(14, 33, 196, 33);

	// Judul laporan
	doc.setFontSize(13);
	doc.setFont('helvetica', 'bold');
	doc.text(title, 105, 42, { align: 'center' });

	// Tanggal cetak
	doc.setFontSize(8);
	doc.setFont('helvetica', 'normal');
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

function renderStudentReport(doc: jsPDF, payload: StudentReportPayload) {
	const printedAt =
		payload.printedAt ||
		new Date().toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		});

	doc.setFillColor(5, 150, 105);
	doc.rect(14, 12, 182, 8, 'F');

	doc.setFontSize(18);
	doc.setFont('helvetica', 'bold');
	doc.text('PONDOK PESANTREN DARUSSUNNAH', 105, 30, { align: 'center' });
	doc.setFontSize(11);
	doc.setFont('helvetica', 'normal');
	doc.text('e-Raport Akademik Santri', 105, 37, { align: 'center' });
	doc.setFontSize(9);
	doc.text(`Dicetak pada ${printedAt}`, 105, 43, { align: 'center' });

	doc.setLineWidth(0.6);
	doc.line(14, 48, 196, 48);

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

	const tahfidzStartY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : 120;
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

	const noteStartY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 12 : tahfidzStartY + 50;
	doc.setFontSize(10);
	doc.setFont('helvetica', 'bold');
	doc.text('Catatan Wali Kelas / Musyrif', 14, noteStartY);
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(9);
	const noteText =
		'Raport ini merupakan ringkasan perkembangan akademik, presensi, dan tahfidz santri. ' +
		'Gunakan sebagai bahan evaluasi dan pendampingan belajar di rumah.';
	doc.text(noteText, 14, noteStartY + 6, { maxWidth: 182, align: 'left' });

	return doc;
}

function buildStudentReportDoc(payload: StudentReportPayload) {
	const doc = new jsPDF();
	return renderStudentReport(doc, payload);
}

export function previewStudentReportPDF(payload: StudentReportPayload) {
	const doc = buildStudentReportDoc(payload);
	window.open(doc.output('bloburl'), '_blank', 'noopener,noreferrer');
}

export function downloadStudentReportPDF(payload: StudentReportPayload) {
	const doc = buildStudentReportDoc(payload);
	doc.save(`${payload.filename}.pdf`);
}

function buildBulkStudentReportDoc(payload: BulkStudentReportPayload) {
	const doc = new jsPDF();

	payload.reports.forEach((report, index) => {
		if (index > 0) {
			doc.addPage();
		}
		renderStudentReport(doc, report);
	});

	return doc;
}

export function previewBulkStudentReportPDF(payload: BulkStudentReportPayload) {
	const doc = buildBulkStudentReportDoc(payload);
	window.open(doc.output('bloburl'), '_blank', 'noopener,noreferrer');
}

export function downloadBulkStudentReportPDF(payload: BulkStudentReportPayload) {
	const doc = buildBulkStudentReportDoc(payload);
	doc.save(`${payload.filename}.pdf`);
}

/**
 * Export data ke Excel (.xlsx)
 */
export function exportToExcel(
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

	const wsData = [
		['PONDOK PESANTREN DARUSSUNNAH'],
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
