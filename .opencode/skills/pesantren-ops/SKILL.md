---
name: pesantren-ops
description: "Pesantren operations audit skill — PSB, santri, akademik, tahfidz, keuangan, asrama, CMS pesantren. Use when auditing or building pesantren management systems (santri lifecycle, hafalan, SPP, donasi, PPDB/PSB)."
---

# Pesantren Ops — CMS & Boarding School Operations

Skill khusus untuk audit dan pembangunan sistem manajemen pondok pesantren modern.

## Domain Scope

- **PSB / PPSB**: alur pendaftaran online (biodata → dokumen → pembayaran → verifikasi), kuota ikhwan/akhwat, validasi NIK/akte, status pendaftaran
- **Santri lifecycle**: biodata, wali, mutasi, alumni, pelanggaran/tahfidz
- **Akademik & Tahfidz**: kurikulum pondok + DIKNAS + tahfidz, target hafalan 30 juz, murojaah, kelas, nilai/rapor, presensi QR, munaqosah
- **Keuangan pesantren**: SPP syahriah, formulir PSB, donasi/infaq, buku kas, wallet santri, rekonsiliasi
- **Asrama & fasilitas**: plotting kamar, inventaris, mapping fasilitas + review
- **CMS konten publik**: hero builder, program, berita, galeri, agenda, profil lembaga, SEO
- **Portal wali/santri**: raport, presensi, pembayaran, dokumen

## Audit Checklist (Pesantren-Specific)

### 1. Data Integrity & Validasi
- [ ] NIK 16 digit, KK, akte wajib konsisten frontend↔backend (validators/psb.go vs portal/biodata)
- [ ] Gender enum konsisten (L/P saja) — tidak ada dead branch low==g
- [ ] ParentName vs father_name/mother_name dual field di-normalisasi
- [ ] Status pendaftaran state machine tertest (pending → verified → accepted → santri)
- [ ] N+1 fetch getMyPSBRegistration tidak terjadi di portal/layout

### 2. Keuangan & Donasi
- [ ] Payment gateway tidak replayable (idempotency key, webhook HMAC)
- [ ] SPP & donasi tidak double-count, laporan `buku kas` konsisten dengan transaksi
- [ ] Upload bukti bayar punya normalisasi URL tunggal (api.ts), bukan duplikat di tiap page

### 3. Hafalan & Rapor
- [ ] Weight engine / target juz teruji (weight/engine_test.go)
- [ ] Rapor kesantrian (adab, ibadah) terpisah dari akademik, tidak campur validator
- [ ] Import kesantrian pakai template valid, rollback atomik

### 4. CMS & Website Builder
- [ ] Page builder state `website-builder` punya preview ↔ publish yang konsisten
- [ ] Hero slides, CTA, program card tidak hardcode image (pakai /uploads)
- [ ] Draft vs published tidak bocor ke public (authorization di handler)
- [ ] Media library size limit & mime validation ada di upload/handler.go

### 5. UX Pesantren
- [ ] Wizard PSB 3 langkah punya progress persistence, back tidak hilang data
- [ ] Error message bahasa Indonesia santri-friendly, bukan error code
- [ ] Kuota & biaya tampil jelas di /psb, sinkron dengan settings
- [ ] Mobile-first untuk wali (44px touch target, form 1 kolom)

### 6. Kepatuhan & Keamanan Santri
- [ ] Data santri (NIK, KK) tidak exposed di public API
- [ ] Role RBAC: santri/wali hanya lihat data sendiri, panitia_psb tidak akses keuangan
- [ ] Log aktivitas tercatat untuk mutasi & pembayaran

## Patterns Referensi (dari pesantren-cms open source)
- Dibaliqaja/pesantren-cms (Laravel): role Administrator/Pengurus/Santri + buku kas + SPP
- Annasabdurrahman354/ppmrjska (Filament): PPSB panel terpisah, jadwal/munaqosah, QR presensi
- BizStillLearning/SantriConnect (Vue+Native): geofencing absensi, Midtrans, Google Maps fasilitas
- cakgup/ppsa_ms (Cloudflare D1): portal publik statis + dashboard internal terpisah

## Fix Strategy
- Sentralisasi `lib/psb/completeness.ts` + `PortalRegistrationContext` untuk PSB
- Constants `lib/constants/contact.ts` untuk ADDRESS/MAP
- `lib/donations.ts` untuk featured donation single source
- Validasi terpusat Zod/OpenAPI schema shared frontend-backend
