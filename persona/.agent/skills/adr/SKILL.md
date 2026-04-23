---
name: adr
description: Keahlian Architecture Decision Record (ADR) untuk mendokumentasikan keputusan arsitektural yang signifikan beserta konteks, opsi, dan konsekuensinya. Gunakan selama fase Riset ketika memilih di antara beberapa pendekatan, atau kapan pun pengguna meminta untuk mendokumentasikan keputusan arsitektural.
---

# Keahlian Architecture Decision Record (ADR)

## Tujuan
Mendokumentasikan keputusan arsitektural yang signifikan agar pengetahuan institusional tetap tersimpan lintas percakapan dan anggota tim. ADR mencatat **mengapa** keputusan dibuat, bukan hanya **apa** keputusannya.

## Kapan Harus Dipanggil
- Selama fase Riset (`/1-research`) ketika keputusan arsitektur yang signifikan diidentifikasi
- Ketika pengguna secara eksplisit meminta untuk mendokumentasikan sebuah keputusan
- Ketika memilih antara 2+ pendekatan yang layak
- Ketika memperkenalkan dependensi atau pola baru
- Ketika mengubah arsitektur yang ada

## Penyimpanan ADR
ADR disimpan di dalam `docs/decisions/` sebagai file bernomor:
```
docs/decisions/
├── 0001-use-postgresql-for-storage.md
├── 0002-adopt-feature-based-structure.md
├── 0003-use-testcontainers-for-integration.md
└── NNNN-judul-singkat.md
```

## Template ADR

Buat file ADR di `docs/decisions/NNNN-judul-singkat.md`:

```markdown
# NNNN. Judul Singkat

**Tanggal:** YYYY-MM-DD
**Status:** Diajukan (Proposed) | Diterima (Accepted) | Usang (Deprecated) | Digantikan oleh NNNN (Superseded)

## Konteks
Apa masalah yang sedang kita hadapi yang memotivasi keputusan ini?
Sertakan batasan teknis, kebutuhan bisnis, dan konteks yang relevan.

## Opsi yang Dipertimbangkan

### Opsi A: {nama}
- **Kelebihan (Pros):** ...
- **Kekurangan (Cons):** ...
- **Usaha (Effort):** Rendah/Sedang/Tinggi

### Opsi B: {nama}
- **Kelebihan (Pros):** ...
- **Kekurangan (Cons):** ...
- **Usaha (Effort):** Rendah/Sedang/Tinggi

### Opsi C: {nama} (jika ada)
- **Kelebihan (Pros):** ...
- **Kekurangan (Cons):** ...
- **Usaha (Effort):** Rendah/Sedang/Tinggi

## Keputusan
Kami memilih **Opsi X** karena...

## Konsekuensi

### Positif
- Apa yang menjadi lebih mudah atau mungkin dilakukan sebagai hasilnya

### Negatif
- Apa yang menjadi lebih sulit sebagai hasilnya
- Technical debt yang ditimbulkan (jika ada)

### Risiko
- Apa yang bisa salah dengan keputusan ini
- Strategi mitigasi

## Terkait
- Tautan ke aturan yang relevan, ADR sebelumnya, atau sumber eksternal
```

## Panduan Proses

1. **Beri nomor secara berurutan** — periksa ADR yang ada di `docs/decisions/` untuk nomor berikutnya
2. **Gunakan judul singkat** — cukup deskriptif untuk mengidentifikasi keputusan secara sekilas
3. **Siklus hidup status:** `Proposed` → `Accepted` (setelah disetujui) → opsional `Deprecated` atau `Superseded`
4. **Jangan pernah menghapus ADR** — jika keputusan dibatalkan, tandai sebagai `Superseded by NNNN` dan buat ADR baru
5. **Gunakan keahlian Sequential Thinking** jika analisis trade-off dirasa kompleks

## Kepatuhan Aturan
ADR harus merujuk pada aturan yang sesuai:
- Pola Arsitektur @architectural-pattern.md
- Prinsip Desain Inti @core-design-principles.md
- Struktur Proyek @project-structure.md
