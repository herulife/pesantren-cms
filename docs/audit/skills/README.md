# Skill Audit UI/UX — ringkasan untuk proyek Alma Parung

Sumber asli (MIT License):
- https://github.com/mistyhx/frontend-design-audit (SKILL.md)
- https://github.com/DNM03/frontend-code-review (SKILL.md)
- https://github.com/thedaviddias/front-end-checklist

File lengkap tersimpan di folder ini (`SKILL-frontend-design-audit.md`,
`SKILL-frontend-code-review.md`). Di bawah ini saripati yang dipakai untuk audit.

## 15 prinsip usability (Nielsen-style, dipakai sebagai lensa audit)

1. Status sistem selalu terlihat (loading, feedback, status aktif)
2. Bahasa sesuai dunia nyata (bukan jargon teknis)
3. Pengguna bisa kembali/batal/keluar (kontrol & kebebasan)
4. Konsisten antar halaman (warna, jarak, huruf, pola)
5. Cegah salah sejak awal (validasi, konfirmasi hapus)
6. Pilihan terlihat, bukan dihafal (label jelas, breadcrumb)
7. Cepat untuk yang sudah biasa (pintasan, operasi massal)
8. Indah & ringkas (hirarki huruf, jarak, bobot visual, warna)
9. Salah pun ada jalan keluar (pesan error + cara betulkan)
10. Ada bantuan (panduan, tooltip, tutorial kontekstual)
11. Kelihatan mana yang bisa diklik (hirarki tombol, area sentuh)
12. Struktur jelas (pengelompokan, layout, navigasi HP)
13. Aksesibel (alt, kontras, keyboard, semantik, ARIA)
14. Mudah dipindai mata (status terlihat, hirarki visual)
15. Pemaaf (toleransi input, data tidak hilang, undo)

## Skala severity 0-4

4 = pengguna tidak bisa menyelesaikan tugas / salah fatal (wajib betulkan).
3 = pengguna kesulitan berat (prioritas tinggi).
2 = sadar tapi bisa mengakali (prioritas rendah).
1 = kosmetik saja.

## Aturan main review kode (frontend)

- Dahulukan yang bisa merusak produksi: bug runtime, batas client/server,
  keamanan (XSS, secret bocor), SEO, aksesibilitas serius.
- Missing loading/empty/error/disabled state = bug produk, bukan poles.
- Hati-hati useEffect (sinkronisasi, bukan tempat state turunan).
- Hormati pola proyek yang ada; perbaikan minimal yang aman produksi.
- Setiap temuan: lokasi file:baris, masalah, dampak ke user, cara betulkan.
