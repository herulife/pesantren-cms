---
trigger: model_decision
description: Saat membangun komponen UI, mengimplementasikan antarmuka yang menghadap pengguna, atau bekerja dengan aksesibilitas frontend
---

## Prinsip Aksesibilitas

### Standar Inti
Ikuti **WCAG 2.1 Level AA** sebagai baseline untuk semua antarmuka yang menghadap pengguna.

### HTML Semantik
- Gunakan elemen semantik (`<nav>`, `<main>`, `<article>`, `<section>`, `<button>`, `<form>`) daripada `<div>` dan `<span>` generik
- Setiap halaman memiliki tepat satu `<h1>`, dengan hierarki heading yang tepat (h1 → h2 → h3, tidak boleh melompati level)
- Gunakan elemen `<label>` yang dikaitkan dengan input form (melalui `for`/`id` atau pembungkusan)
- Gunakan `<table>` untuk data tabular, jangan pernah untuk tata letak

### Navigasi Keyboard
- Semua elemen interaktif harus dapat dijangkau melalui tombol Tab
- Urutan fokus mengikuti urutan baca yang logis
- Indikator fokus harus terlihat (jangan pernah `outline: none` tanpa pengganti)
- Komponen kustom mengimplementasikan pola keyboard yang tepat (tombol Panah untuk menu, Escape untuk menutup modal)
- Tidak ada jebakan keyboard — pengguna selalu dapat berpindah (Tab) dari komponen manapun

### Atribut ARIA
- **Aturan pertama ARIA:** Jangan gunakan ARIA jika elemen HTML native dapat melakukan tugasnya
- Gunakan `aria-label` atau `aria-labelledby` untuk elemen tanpa label teks yang terlihat
- Gunakan region `aria-live` untuk pembaruan konten dinamis (toast, notifikasi)
- Gunakan atribut `role` hanya untuk widget kustom yang tidak memiliki semantik native
- Gunakan `aria-expanded`, `aria-controls` untuk pola pengungkapan (dropdown, akordeon)

### Warna dan Kontras
- Rasio kontras teks: minimum **4.5:1** terhadap latar belakang (AA teks normal)
- Rasio kontras teks besar: minimum **3:1** (AA teks besar)
- **Jangan pernah menggunakan warna saja** untuk menyampaikan informasi (tambahkan ikon, teks, atau pola)
- Dukung tema terang dan gelap dengan kontras yang tepat di masing-masing

### Gambar dan Media
- Semua elemen `<img>` memiliki teks `alt` yang deskriptif (atau `alt=""` untuk gambar dekoratif)
- Video memiliki teks atau transkrip
- Kontrol audio dapat diakses dan diberi label

### Formulir
- Pesan error dikaitkan secara programatik dengan input (`aria-describedby`)
- Field wajib ditunjukkan baik secara visual maupun programatik (atribut `required`)
- Error validasi formulir diumumkan ke pembaca layar (screen reader)

### Daftar Periksa Aksesibilitas

- [ ] Semua elemen interaktif dapat dijangkau melalui keyboard?
- [ ] Indikator fokus terlihat pada semua elemen interaktif?
- [ ] Elemen HTML semantik digunakan (tidak ada tombol `<div>`)?
- [ ] Hierarki heading sudah benar (h1 → h2 → h3)?
- [ ] Kontras warna memenuhi standar AA (4.5:1)?
- [ ] Warna bukan satu-satunya indikator makna?
- [ ] Gambar memiliki teks alt yang sesuai?
- [ ] Input formulir memiliki label yang dikaitkan?
- [ ] ARIA digunakan dengan benar (native terlebih dahulu)?

### Prinsip Terkait
- Prinsip Keamanan @security-principles.md (pencegahan XSS dalam konten pengguna)
- Strategi Pengujian @testing-strategy.md (pengujian aksesibilitas)
