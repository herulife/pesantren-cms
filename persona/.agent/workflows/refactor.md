---
description: Alur kerja refaktor untuk merestrukturisasi kode yang ada dengan aman
---

# Alur Kerja Refaktor

## Tujuan
Merestrukturisasi kode yang ada dengan aman sambil mempertahankan perilaku. Menggunakan pola pikir yang berbeda dari pengembangan fitur baru: pahami dulu, kemudian ubah struktur.

## Kapan Digunakan
- Restrukturisasi kode (memindahkan, mengganti nama, memisahkan modul)
- Migrasi pola (misalnya, beralih dari callback ke async/await)
- Upgrade dependensi dengan perubahan yang merusak
- Menangani utang teknis atau peningkatan arsitektural

**Memerlukan tujuan spesifik.** Aktifkan dengan target yang jelas, bukan direktori terbuka:
- ✅ `/refactor ekstrak interface storage di fitur task`
- ✅ `/refactor pisahkan handler user menjadi handler auth terpisah`
- ❌ `/refactor apps/backend` (terlalu samar — gunakan `/audit` dulu untuk menemukan masalah spesifik)

## Kapan TIDAK Digunakan
- Fitur baru (gunakan `/orchestrator`)
- Perbaikan bug kecil (gunakan `/quick-fix`)
- "Temukan apa yang perlu ditingkatkan" (gunakan `/audit` dulu, kemudian `/refactor` untuk temuan struktural)

## Daftar Periksa Pra-Implementasi
Sebelum memulai, Anda HARUS:
1. Pindai direktori `.agent/rules/` untuk aturan yang berlaku
2. Baca `architectural-pattern.md` dan `project-structure.md`
3. Baca `rule-priority.md` untuk resolusi konflik

## Fase-fase

### Fase 1: Analisis Dampak
**Atur Mode:** Gunakan `task_boundary` untuk mengatur mode ke **PLANNING**

1. **Petakan radius ledakan** — file, modul, dan test apa yang terpengaruh?
2. **Dokumentasikan perilaku yang ada** — test apa yang saat ini lulus? kontrak apa yang ada?
3. **Identifikasi risiko** — bisakah ini dilakukan secara inkremental atau diperlukan big-bang?
4. **Buat rencana refactoring** di `task.md` dengan langkah-langkah inkremental
5. Jika keputusan melibatkan trade-off, buat ADR menggunakan **Skill ADR**

**Skill yang dipertimbangkan:**
- **Sequential Thinking** — untuk refactoring multi-langkah dengan saling ketergantungan

### Fase 2: Perubahan Inkremental (TDD)
**Atur Mode:** Gunakan `task_boundary` untuk mengatur mode ke **EXECUTION**

Untuk setiap langkah dalam rencana refactoring:
1. **Pastikan test yang ada lulus** sebelum membuat perubahan apapun
2. **Buat satu perubahan inkremental** — pindahkan, ganti nama, atau restrukturisasi
3. **Jalankan test setelah setiap perubahan** — perilaku harus dipertahankan
4. **Tambahkan test baru** jika refactoring mengekspos perilaku yang belum diuji
5. Ikuti aturan yang berlaku:
   - Pola Arsitektur @architectural-pattern.md
   - Prinsip Organisasi Kode @code-organization-principles.md
   - Hindari Dependensi Melingkar @avoid-circular-dependencies.md

**Prinsip kunci:** Jangan pernah merusak build lebih dari satu langkah pada satu waktu.

### Fase 3: Verifikasi Paritas
**Atur Mode:** Gunakan `task_boundary` untuk mengatur mode ke **VERIFICATION**

1. Jalankan rangkaian validasi lengkap (sama seperti `/4-verify`)
2. **Bandingkan cakupan test** — cakupan harus sama atau lebih baik dari sebelumnya
3. **Verifikasi tidak ada perubahan perilaku** — input yang sama menghasilkan output yang sama
4. Jika berlaku, jalankan test E2E (`/e2e-test`)

### Fase 4: Kirim
Ikuti `/5-commit` dengan tipe commit `refactor(<cakupan>): <deskripsi>`

## Kriteria Penyelesaian
- [ ] Analisis dampak didokumentasikan
- [ ] Semua perubahan dilakukan secara inkremental dengan test lulus di setiap langkah
- [ ] Rangkaian verifikasi lengkap lulus
- [ ] Cakupan test sama atau lebih baik dari sebelumnya
- [ ] Di-commit dengan tipe `refactor`
