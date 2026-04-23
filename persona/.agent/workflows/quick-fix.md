---
description: Alur kerja perbaikan cepat untuk hotfix dan perbaikan bug kecil - lewati riset, verifikasi minimal
---

# Alur Kerja Perbaikan Cepat

## Tujuan
Jalur cepat untuk perbaikan bug dan perubahan kecil yang tidak memerlukan fase riset atau integrasi lengkap.

## Kapan Digunakan
- Perbaikan bug dengan penyebab akar yang diketahui
- Perubahan kecil dan terisolasi (< 50 baris)
- Hotfix untuk masalah produksi
- Menangani temuan review dari `/audit`

## Kapan TIDAK Digunakan
- Fitur baru (gunakan `/orchestrator`)
- Refactoring (gunakan `/refactor`)
- Perubahan yang menyentuh beberapa fitur atau modul

## Daftar Periksa Pra-Implementasi
Sebelum memulai, Anda HARUS:
1. Pindai direktori `.agent/rules/` untuk aturan yang berlaku
2. Baca `rule-priority.md` untuk resolusi konflik
3. Konfirmasi cakupan perbaikan benar-benar kecil dan terisolasi

## Fase-fase

### Fase 1: Diagnosa
**Atur Mode:** Gunakan `task_boundary` untuk mengatur mode ke **PLANNING**

1. Identifikasi bug atau masalah
2. Lokasikan kode yang terpengaruh
3. Jika penyebabnya tidak langsung jelas, aktifkan skill **Protokol Debugging**
4. Definisikan perbaikan di `task.md` (maksimal 1-3 item)

### Fase 2: Perbaiki + Test (TDD)
**Atur Mode:** Gunakan `task_boundary` untuk mengatur mode ke **EXECUTION**

1. **Tulis test yang gagal** yang mereproduksi bug
2. **Terapkan perbaikan minimal** agar test lulus
3. **Verifikasi test yang ada** masih lulus
4. Ikuti aturan yang berlaku:
   - Prinsip Penanganan Error @error-handling-principles.md
   - Mandat Logging dan Observabilitas @logging-and-observability-mandate.md

### Fase 3: Verifikasi + Kirim
**Atur Mode:** Gunakan `task_boundary` untuk mengatur mode ke **VERIFICATION**

1. Jalankan rangkaian validasi lengkap (sama seperti `/4-verify`)
2. Jika semua pemeriksaan lulus, commit dengan format konvensional (sama seperti `/5-commit`)
3. Gunakan tipe commit `fix(<cakupan>): <deskripsi>`

## Kriteria Penyelesaian
- [ ] Bug direproduksi dengan test
- [ ] Perbaikan diterapkan dan test lulus
- [ ] Rangkaian verifikasi lengkap lulus
- [ ] Di-commit dengan tipe `fix`
