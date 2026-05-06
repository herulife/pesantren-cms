# Peta Implementasi Website Builder Darussunnah

## Tujuan

Membuat konsep Website Builder untuk website publik Darussunnah agar admin bisa mengatur tampilan dari navbar sampai footer tanpa edit kode. Builder dibuat berbasis komponen siap pakai, bukan editor bebas total seperti CSS mentah, supaya desain tetap rapi, aman, cepat, dan tidak merusak identitas visual pondok.

Cakupan akhir:
- Theme global.
- Navbar global.
- Floating action seperti WhatsApp dan back-to-top.
- Page builder untuk Home dan halaman publik lain.
- Footer global.
- Draft, preview, publish, dan fallback aman.

Target MVP:
- Admin bisa mengatur Home dari hero sampai CTA.
- Admin bisa memilih model hero, termasuk bukan slider.
- Admin bisa mengatur navbar dan footer secara terbatas.
- Website tetap fallback ke tampilan lama jika builder belum aktif atau data builder rusak.

## Prinsip Desain

- Block-based: admin memilih komponen siap pakai.
- Site shell terpisah dari page content: navbar, footer, theme, floating button dikelola global.
- Controlled customization: admin bisa memilih variant, warna tema, gambar, teks, tombol, jumlah item, dan urutan, tapi tidak menulis CSS mentah.
- Draft and publish: perubahan bisa disimpan dulu sebelum tampil live.
- Safe fallback: kalau JSON layout rusak/kosong, website tetap tampil memakai layout default.
- Mobile-first: semua komponen harus enak di HP sebelum desktop.
- Reuse data: berita, agenda, galeri, video, program, fasilitas, testimoni, FAQ tetap memakai modul data yang sudah ada.

## Arsitektur Builder

Website Builder dibagi menjadi 3 lapisan.

### 1. Site Shell Builder

Mengatur bagian global yang muncul di banyak halaman:
- Navbar.
- Mobile navigation.
- Floating WhatsApp.
- Back-to-top.
- Footer.

### 2. Page Builder

Mengatur isi per halaman:
- Home.
- Profil.
- Program.
- PSB landing.
- Kontak.
- Berita landing.
- Galeri landing.
- Video landing.
- Fasilitas.

MVP hanya Home dulu.

### 3. Theme Builder

Mengatur rasa visual global:
- Warna utama.
- Warna aksen.
- Font heading/body.
- Radius card/tombol.
- Shadow style.
- Background pattern.
- Button style.

MVP cukup theme ringan dulu.

## Peta Data

Untuk MVP, cukup memakai tabel `settings` yang sudah ada. Table baru tidak wajib dulu agar implementasi cepat dan risiko kecil.

Settings baru:

```txt
website_builder_enabled
website_builder_theme_draft
website_builder_theme_published
website_builder_shell_draft
website_builder_shell_published
website_builder_home_draft
website_builder_home_published
```

Keterangan:
- `website_builder_enabled`: toggle apakah website memakai builder.
- `website_builder_theme_draft`: theme yang sedang diedit admin.
- `website_builder_theme_published`: theme yang tampil live.
- `website_builder_shell_draft`: navbar/footer/floating yang sedang diedit admin.
- `website_builder_shell_published`: navbar/footer/floating yang tampil live.
- `website_builder_home_draft`: layout Home yang sedang diedit admin.
- `website_builder_home_published`: layout Home yang tampil live.

Whitelist public settings perlu menambahkan:

```txt
website_builder_enabled
website_builder_theme_published
website_builder_shell_published
website_builder_home_published
```

Field draft tidak boleh masuk public settings.

## Contoh JSON Utama

### Theme

```json
{
  "version": 1,
  "palette": {
    "primary": "emerald",
    "accent": "amber",
    "surface": "slate",
    "tone": "fresh"
  },
  "typography": {
    "heading": "outfit",
    "body": "plus-jakarta",
    "scale": "normal"
  },
  "shape": {
    "radius": "rounded",
    "shadow": "soft"
  },
  "background": {
    "pattern": "soft-blobs",
    "public_page": "warm-white"
  }
}
```

### Site Shell

```json
{
  "version": 1,
  "navbar": {
    "enabled": true,
    "variant": "classic",
    "position": "sticky",
    "logo_url": "",
    "show_school_name": true,
    "cta": { "label": "Daftar PSB", "url": "/psb", "style": "primary" },
    "menu_items": [
      { "label": "Beranda", "url": "/" },
      { "label": "Profil", "url": "/profil" },
      { "label": "Program", "url": "/program" },
      { "label": "Berita", "url": "/news" },
      { "label": "Kontak", "url": "/kontak" }
    ],
    "mobile": {
      "variant": "drawer",
      "show_cta": true
    }
  },
  "floating": {
    "whatsapp": { "enabled": true, "position": "bottom-right", "mobile_offset": "above-bottom-nav" },
    "back_to_top": { "enabled": true, "position": "above-whatsapp" }
  },
  "footer": {
    "enabled": true,
    "variant": "contact-columns",
    "show_logo": true,
    "show_socials": true,
    "show_map_link": true,
    "quick_links": [
      { "label": "Profil", "url": "/profil" },
      { "label": "Program", "url": "/program" },
      { "label": "PSB", "url": "/psb" }
    ]
  }
}
```

### Home Page

```json
{
  "version": 1,
  "page": "home",
  "updated_at": "2026-05-06T00:00:00Z",
  "sections": [
    {
      "id": "hero-main",
      "type": "hero",
      "enabled": true,
      "variant": "slider",
      "settings": {
        "kicker": "Darussunnah Parung",
        "title": "Tahfidz, Adab, dan Ilmu dalam Satu Pembinaan",
        "subtitle": "Darussunnah Parung membina santri melalui hafalan Al-Quran, adab, dan pembelajaran terpadu.",
        "overlay": "medium",
        "text_position": "left-top",
        "mobile_height": "compact",
        "buttons": [
          { "label": "Lihat Info PSB", "url": "/psb", "style": "primary" },
          { "label": "Lihat Program", "url": "/program", "style": "secondary" }
        ],
        "slides": [
          {
            "title": "Tahfidz, Adab, dan Ilmu dalam Satu Pembinaan",
            "subtitle": "Darussunnah Parung membina santri melalui hafalan Al-Quran, adab, dan pembelajaran terpadu.",
            "image_url": "/assets/img/gedung.webp"
          }
        ]
      }
    }
  ]
}
```

## Site Shell Builder

### Navbar

Prioritas: MVP.

Variant:
- `classic`: logo kiri, menu tengah/kanan, CTA kanan.
- `centered`: logo/menu lebih simetris.
- `compact`: tinggi navbar lebih kecil.
- `transparent-over-hero`: navbar transparan di atas hero, cocok untuk hero foto.
- `simple`: logo + tombol menu saja.

Field:
- `enabled`
- `variant`
- `position`: `sticky`, `static`, `transparent-over-hero`
- `logo_url`
- `show_school_name`
- `school_name_override`
- `menu_items`
- `cta`
- `show_login_link`
- `mobile.variant`: `drawer`, `sheet`, `bottom-menu`
- `mobile.show_cta`

Aturan aman:
- Link admin tidak masuk navbar publik.
- Kalau menu kosong, fallback ke menu default.
- Mobile menu wajib tetap mudah dipakai.

### Floating Actions

Prioritas: MVP.

Item:
- WhatsApp.
- Back-to-top.
- Optional PSB quick button.

Field:
- `enabled`
- `position`
- `mobile_offset`
- `label`
- `icon_style`
- `url`

Aturan aman:
- Di halaman portal mobile, tombol harus naik agar tidak menabrak bottom nav.
- WhatsApp memakai nomor dari settings kontak jika field kosong.

### Footer

Prioritas: MVP.

Variant:
- `simple`: logo, deskripsi, copyright.
- `columns`: beberapa kolom link.
- `contact-columns`: kontak dominan + quick links + sosmed.
- `map-contact`: kontak + tombol map.
- `minimal`: footer kecil.

Field:
- `enabled`
- `variant`
- `logo_url`
- `description`
- `quick_links`
- `contact_items`
- `show_socials`
- `show_map_link`
- `show_address`
- `copyright_text`
- `background`: `emerald-dark`, `slate-dark`, `light`

Aturan aman:
- Sosmed tetap mengambil dari settings sosmed jika tidak diisi.
- Kontak tetap fallback dari settings kontak.

## Theme Builder

Prioritas: fase 2.

Field:
- `palette.primary`: `emerald`, `teal`, `blue`, `amber`, `slate`
- `palette.accent`: `amber`, `lime`, `sky`, `rose`
- `palette.tone`: `fresh`, `formal`, `warm`, `calm`
- `typography.heading`: pilihan font yang sudah di-load aplikasi.
- `typography.body`
- `shape.radius`: `soft`, `rounded`, `pill`, `sharp`
- `shape.shadow`: `none`, `soft`, `bold`
- `background.pattern`: `none`, `soft-blobs`, `grid`, `gradient`

Aturan aman:
- Jangan izinkan input CSS bebas pada MVP.
- Gunakan CSS variables agar theme bisa diterapkan global.

## Page Builder Blocks

### 1. Hero

Prioritas: MVP utama.

Variant:
- `slider`: beberapa slide seperti sekarang.
- `photo-single`: satu foto besar, background lebih kelihatan.
- `split`: teks di kiri, visual/foto di kanan.
- `psb-campaign`: fokus pendaftaran, tahun ajaran, tombol daftar, countdown opsional.
- `minimal`: gradient/foto tipis, teks singkat.
- `video`: background video atau embed video, fase lanjutan.

Field:
- `kicker`
- `title`
- `subtitle`
- `image_url`
- `slides`
- `buttons`
- `overlay`: `none`, `soft`, `medium`, `strong`
- `text_position`: `left-top`, `left-center`, `center`, `bottom-left`
- `mobile_height`: `compact`, `normal`, `tall`
- `show_pillars`
- `pillars`

### 2. Kartu Info / Quick Facts

Prioritas: MVP.

Field:
- `items`: label, value, description, icon
- `columns`: 2, 3, 4
- `style`: `floating`, `cards`, `minimal`
- `position`: `overlap-hero`, `normal`

### 3. Profil Singkat

Prioritas: MVP.

Field:
- `kicker`
- `title`
- `body`
- `image_url`
- `highlights`
- `button_label`
- `button_url`
- `layout`: `text-left`, `image-left`, `centered`

### 4. Program Inti

Prioritas: MVP.

Sumber:
- `dynamic`: ambil dari modul `programs`.
- `manual`: admin isi kartu sendiri.

Field:
- `title`
- `subtitle`
- `source`
- `category_filter`
- `limit`
- `layout`: `image-cards`, `compact-list`, `featured-grid`
- `button_label`
- `button_url`

### 5. Ekstrakurikuler

Prioritas: MVP.

Mirip Program Inti, tapi default filter ke kategori ekstrakurikuler atau memakai item manual jika data program belum lengkap.

Field:
- `title`
- `subtitle`
- `source`
- `limit`
- `layout`
- `items`

### 6. Berita

Prioritas: MVP.

Sumber:
- Dinamis dari `news`.

Field:
- `title`
- `subtitle`
- `limit`
- `category_filter`
- `featured_first`
- `layout`: `featured-side`, `grid`, `list`
- `button_label`
- `button_url`

### 7. Agenda

Prioritas: MVP.

Sumber:
- Dinamis dari `agendas`.

Field:
- `title`
- `subtitle`
- `limit`
- `layout`: `featured-card`, `timeline`, `compact`
- `show_location`
- `show_date`

### 8. Galeri

Prioritas: MVP atau fase 2.

Sumber:
- Dinamis dari `gallery`.

Field:
- `title`
- `subtitle`
- `limit`
- `category_filter`
- `layout`: `masonry`, `featured-grid`, `carousel`
- `button_label`
- `button_url`

### 9. Video

Prioritas: fase 2.

Sumber:
- Dinamis dari `videos`.

Field:
- `title`
- `subtitle`
- `limit`
- `layout`: `cards`, `featured-video`, `carousel`
- `button_label`
- `button_url`

### 10. CTA Pendaftaran

Prioritas: MVP.

Field:
- `title`
- `subtitle`
- `button_label`
- `button_url`
- `secondary_button_label`
- `secondary_button_url`
- `background`: `emerald`, `photo`, `gradient`
- `image_url`

### 11. Sambutan

Prioritas: fase 2.

Sumber:
- Settings sambutan yang sudah ada.

Field:
- `title`
- `name`
- `role`
- `speech`
- `image_url`
- `button_label`
- `button_url`
- `layout`: `quote`, `profile-card`, `split`

### 12. Fasilitas

Prioritas: fase 2.

Sumber:
- Dinamis dari modul `facilities`.

Field:
- `title`
- `subtitle`
- `limit`
- `layout`
- `button_label`
- `button_url`

### 13. Testimoni

Prioritas: fase 2.

Sumber:
- Modul `testimonials` sudah ada di admin.

Field:
- `title`
- `subtitle`
- `limit`
- `layout`: `carousel`, `cards`

### 14. FAQ

Prioritas: fase 3.

Sumber:
- Modul `faqs`.

Field:
- `title`
- `subtitle`
- `limit`
- `category_filter`
- `layout`: `accordion`, `cards`

### 15. Donasi CTA

Prioritas: fase 3.

Sumber:
- Modul `donations`.

Field:
- `title`
- `subtitle`
- `button_label`
- `button_url`
- `background`

### 16. Custom Content

Prioritas: fase 3, jangan MVP dulu.

Field:
- `title`
- `content`
- `format`: `plain` atau `markdown`
- `alignment`
- `background`

Catatan keamanan:
- Jangan izinkan raw HTML pada MVP.
- Kalau nanti butuh HTML, harus disanitasi.

### 17. Spacer / Divider

Prioritas: fase 2.

Field:
- `height`: `small`, `medium`, `large`
- `divider_style`: `none`, `line`, `wave`, `soft-gradient`

## Peta File Frontend

File baru yang disarankan:

```txt
apps/frontend/src/lib/website-builder/types.ts
apps/frontend/src/lib/website-builder/defaultTheme.ts
apps/frontend/src/lib/website-builder/defaultShell.ts
apps/frontend/src/lib/website-builder/defaultHomeLayout.ts
apps/frontend/src/lib/website-builder/normalize.ts
apps/frontend/src/lib/website-builder/theme.ts
apps/frontend/src/components/website-builder/WebsiteBuilderProvider.tsx
apps/frontend/src/components/website-builder/SiteShellRenderer.tsx
apps/frontend/src/components/website-builder/HomePageRenderer.tsx
apps/frontend/src/components/website-builder/blocks/HeroBlock.tsx
apps/frontend/src/components/website-builder/blocks/InfoCardsBlock.tsx
apps/frontend/src/components/website-builder/blocks/ProfileBlock.tsx
apps/frontend/src/components/website-builder/blocks/ProgramsBlock.tsx
apps/frontend/src/components/website-builder/blocks/NewsBlock.tsx
apps/frontend/src/components/website-builder/blocks/AgendaBlock.tsx
apps/frontend/src/components/website-builder/blocks/GalleryBlock.tsx
apps/frontend/src/components/website-builder/blocks/CtaBlock.tsx
apps/frontend/src/app/admin/settings/tabs/TabWebsiteBuilder.tsx
apps/frontend/src/app/admin/settings/tabs/website-builder/BuilderShellPanel.tsx
apps/frontend/src/app/admin/settings/tabs/website-builder/BuilderThemePanel.tsx
apps/frontend/src/app/admin/settings/tabs/website-builder/BuilderHomePanel.tsx
```

File yang diubah:

```txt
apps/frontend/src/app/page.tsx
apps/frontend/src/components/PublicLayout.tsx
apps/frontend/src/app/admin/settings/page.tsx
apps/frontend/src/lib/api.ts
apps/backend/internal/features/settings/handler.go
```

## Peta Backend

MVP tidak perlu table baru.

Perubahan backend:
- Tambahkan public key builder yang published ke whitelist public settings.
- Field draft tetap hanya bisa dibaca admin lewat `/api/settings`.
- Endpoint update settings yang sudah ada bisa dipakai untuk simpan draft/publish.

Fase lanjutan jika builder dipakai untuk banyak halaman:

```sql
page_layouts
- id
- page_key
- title
- draft_json
- published_json
- status
- version
- created_by
- updated_by
- published_at
- created_at
- updated_at
```

Untuk sekarang jangan langsung buat table ini kecuali builder sudah dipakai lintas halaman.

## Alur Admin

Tab baru: `Admin > Settings > Website Builder`.

Subtab:
- `Theme`
- `Navbar`
- `Home`
- `Floating`
- `Footer`

Layout admin:
- Panel kiri: area/subtab builder.
- Kolom daftar: block atau item aktif.
- Kolom editor: form pengaturan item yang dipilih.
- Tombol global: `Simpan Draft`, `Preview`, `Publish`, `Reset Default`.

Fitur MVP:
- Edit theme ringan.
- Edit navbar menu dan CTA.
- Edit floating WhatsApp/back-to-top.
- Edit footer link/kontak/style.
- Tambah block Home dari daftar block.
- Aktif/nonaktif block.
- Ubah urutan dengan tombol naik/turun.
- Edit field per block.
- Hapus block.
- Simpan draft.
- Publish ke live.
- Reset ke layout default.

Fitur fase 2:
- Drag and drop.
- Duplicate block.
- Preview lebih mirip live.
- Revision history sederhana.
- Builder untuk halaman lain.

## Alur Render Website

1. Public layout fetch settings publik seperti sekarang.

2. Ambil:
   - `website_builder_enabled`
   - `website_builder_theme_published`
   - `website_builder_shell_published`

3. Jika enabled dan JSON valid:
   - `PublicLayout` memakai `SiteShellRenderer`.
   - CSS variables theme diterapkan dari published theme.

4. Jika tidak valid:
   - `PublicLayout` memakai navbar/footer lama.

5. Homepage fetch:
   - settings public
   - news
   - agendas
   - gallery
   - videos

6. Jika enabled dan `website_builder_home_published` valid:
   - render memakai `HomePageRenderer`.

7. Jika tidak valid:
   - render layout Home lama.

Contoh:

```tsx
<HomePageRenderer
  layout={layout}
  dataSources={{
    news,
    agendas,
    galleryAlbums,
    videoSeries,
    settings,
  }}
/>
```

## Tahapan Implementasi

### Fase 1 - Fondasi Aman

Tujuan: builder bisa hidup berdampingan tanpa mengubah tampilan live.

Pekerjaan:
- Buat tipe builder.
- Buat default theme, shell, dan home layout.
- Buat parser/normalizer JSON.
- Tambahkan public setting key builder.
- Siapkan fallback aman.
- Tambah tab admin `Website Builder` skeleton.

Validasi:
- Website tetap sama saat builder off.
- JSON invalid tidak membuat website blank.
- Public settings tetap tidak butuh login.

### Fase 2 - Home Builder MVP

Tujuan: admin bisa mengatur Home.

Pekerjaan:
- Buat `HomePageRenderer`.
- Buat block renderer awal: Hero, Kartu Info, Profil, Program, Ekstrakurikuler, Berita, Agenda, CTA.
- Buat editor block Home.
- Simpan draft dan publish.

Validasi:
- Draft tidak tampil live.
- Publish baru mengubah homepage.
- Homepage fallback ke default jika builder dimatikan.

### Fase 3 - Hero Variants

Tujuan: hero bisa bukan slider.

Pekerjaan:
- Implement `hero.variant`.
- Variant awal: `slider`, `photo-single`, `split`, `psb-campaign`, `minimal`.
- Editor hero menyesuaikan field berdasarkan variant.
- Tambah pilihan overlay, posisi teks, dan tinggi mobile.

Validasi:
- Semua variant enak di mobile.
- Hero tetap terbaca saat foto terang/gelap.
- Kalau gambar kosong, fallback ke default image.

### Fase 4 - Navbar, Floating, Footer Builder

Tujuan: website bisa diatur dari atas sampai bawah.

Pekerjaan:
- Buat shell renderer.
- Integrasi ke `PublicLayout`.
- Editor navbar.
- Editor floating actions.
- Editor footer.

Validasi:
- Menu mobile tetap jalan.
- Tombol WhatsApp/back-to-top tidak menabrak portal bottom nav.
- Footer tetap rapi di mobile.

### Fase 5 - Theme Builder

Tujuan: admin bisa mengatur rasa visual global tanpa CSS mentah.

Pekerjaan:
- Generate CSS variables.
- Terapkan theme ke `PublicLayout`.
- Editor palette, typography, radius, shadow, background.

Validasi:
- Semua kombinasi theme tetap readable.
- Warna tombol, link, dan heading tetap kontras.

### Fase 6 - Dynamic Blocks Lengkap

Tujuan: block dinamis lebih fleksibel.

Pekerjaan:
- Program source dynamic/manual.
- News layout featured/grid/list.
- Agenda layout featured/timeline.
- Gallery dan Video block.
- Sambutan, Fasilitas, Testimoni.

Validasi:
- Jika data kosong, block menampilkan empty state yang rapi atau otomatis hide sesuai setting.
- Limit dan filter bekerja.

### Fase 7 - Multi Page Builder

Tujuan: builder dipakai untuk halaman lain.

Pekerjaan:
- Tambah page key: profil, program, psb, kontak, news landing, gallery landing.
- Pertimbangkan table `page_layouts`.
- Preview per halaman.
- Revision history.

## Risiko dan Cara Menghindari

Risiko: website blank karena JSON rusak.
Solusi: parser aman, fallback default, validasi sebelum publish.

Risiko: desain jadi berantakan karena admin terlalu bebas.
Solusi: hanya beri pilihan variant dan design token, bukan CSS mentah.

Risiko: admin bingung karena terlalu banyak field.
Solusi: builder dibuat bertahap, field disembunyikan sesuai variant.

Risiko: navbar rusak dan user tidak bisa navigasi.
Solusi: fallback menu default jika menu builder kosong atau invalid.

Risiko: footer/kontak kehilangan data penting.
Solusi: fallback ke settings kontak dan sosmed lama.

Risiko: performa lambat karena homepage fetch semua data.
Solusi MVP tetap pakai pola sekarang. Fase lanjutan fetch data sesuai block aktif.

Risiko: data lama hilang.
Solusi: settings lama tetap dipertahankan. Builder hanya membaca/migrasi sebagai default.

## Rekomendasi Urutan Block Home MVP

Urutan default yang paling masuk akal:

```txt
1. Hero
2. Kartu Info
3. Profil Singkat
4. Program Inti
5. Ekstrakurikuler
6. Galeri
7. Video
8. Berita
9. Agenda
10. CTA Pendaftaran
```

Block MVP yang harus dibuat dulu:
- Hero
- Kartu Info
- Profil Singkat
- Program Inti
- Ekstrakurikuler
- Berita
- Agenda
- CTA Pendaftaran

Shell MVP yang harus dibuat dulu:
- Navbar.
- Floating WhatsApp.
- Back-to-top.
- Footer.

Theme MVP:
- Palette.
- Radius.
- Shadow.
- Background tone.

## Definisi Selesai MVP

MVP dianggap selesai jika:
- Admin punya tab `Website Builder`.
- Admin bisa edit navbar, floating actions, footer, dan Home.
- Admin bisa tambah, hapus, aktif/nonaktif, dan urutkan block Home.
- Admin bisa pilih hero variant minimal `slider`, `photo-single`, dan `psb-campaign`.
- Admin bisa simpan draft dan publish.
- Website live membaca published builder ketika toggle aktif.
- Website tetap aman jika builder dimatikan.
- Build frontend berhasil.
- Endpoint public settings tetap tidak membutuhkan login.

