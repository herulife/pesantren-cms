/**
 * Konfigurasi SunEditor untuk halaman admin berita.
 *
 * SunEditor belum punya rilis yang menutup advisory XSS-nya (npm audit: critical,
 * "no fix available"), jadi sanitizer miliknya tidak boleh dipercaya. Yang kita
 * lakukan di sini adalah memperkecil attack surface-nya, bukan menganggap
 * masalah selesai:
 *
 * 1. Tag dan atribut dibatasi ke formatting yang benar-benar dipakai di halaman
 *    berita. Sisanya dibuang backend.
 * 2. Plugin yang bisa menyisipkan konten dari luar dimatikan, terutama `embed`,
 *    sumber advisory "DOM XSS via External Script Element After Iframe Embed".
 *
 * Lapisan yang sesungguhnya yang halaman tetap ada di backend: setiap berita
 * di-sanitasi ulang dengan allowlist sendiri saat dibaca
 * (internal/features/news/sanitize.go), sehingga HTML yang sampai ke pengunjung
 * tidak pernah bergantung pada sanitizer SunEditor. Verifikasi perilaku itu ada
 * di internal/features/news/sanitize_xss_test.go.
 *
 * Ekspor ini sengaja berada di modul terpisah supaya kedua halaman admin
 * (tambah dan edit) memakai konfigurasi yang identik dan tidak bisa berbeda
 * diam-diam.
 */
export const SUNEDITOR_OPTIONS = {
	// Tag dasar SunEditor sudah aktif (p, div, span, h1..h6, strong, em, ul, ...).
	// Yang ditambahkan di sini adalah sisa tag yang diizinkan.
	addTags: ['span'],
	addAttributes: ['style', 'class'],

	// Plugin yang bisa menarik sumber eksternal atau mengeksekusi skrip.
	embed: false,
	videoTag: false,
	audioTag: false,
	math: false,
	codeBlock: false,
	importWord: false,

	buttonList: [
		['undo', 'redo'],
		['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'],
		['removeFormat', 'outdent', 'indent'],
		['align', 'horizontalRule', 'list', 'table'],
		['link', 'image', 'preview', 'print'],
	],
} as const;