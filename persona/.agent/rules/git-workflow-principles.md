---
trigger: model_decision
description: Saat membuat branch, melakukan commit kode, mengelola PR, atau bekerja dengan version control
---

## Prinsip Alur Kerja Git

### Pesan Commit — Conventional Commits

**Format:**
```
<tipe>(<cakupan>): <deskripsi>

[body opsional]

[footer opsional]
```

**Tipe:**
| Tipe | Tujuan |
|------|--------|
| `feat` | Fitur baru |
| `fix` | Perbaikan bug |
| `docs` | Hanya dokumentasi |
| `style` | Pemformatan, titik koma, dll. |
| `refactor` | Perubahan kode (tanpa fitur/perbaikan baru) |
| `test` | Menambah atau memperbarui test |
| `chore` | Pemeliharaan, dependensi |
| `perf` | Peningkatan performa |
| `ci` | Perubahan konfigurasi CI/CD |

**Aturan:**
- Deskripsi menggunakan kata kerja imperatif ("tambah" bukan "menambahkan", "perbaiki" bukan "memperbaiki")
- Cakupan sesuai area fitur (misalnya, `task`, `auth`, `ui`)
- Deskripsi ringkas (<72 karakter)
- Body menjelaskan **mengapa**, bukan apa (diff menunjukkan apa)

### Penamaan Branch

**Format:** `<tipe>/<tiket-atau-deskripsi-singkat>`

**Contoh:**
```
feat/task-crud-api
fix/auth-token-expiry
refactor/storage-layer
chore/update-deps
```

**Aturan:**
- Gunakan huruf kecil dengan tanda hubung (kebab-case)
- Prefix sesuai tipe commit
- Pertahankan nama branch pendek tetapi deskriptif

### Kebersihan Commit

- **Satu perubahan logis per commit** — jangan mencampur perubahan yang tidak terkait
- **Jangan pernah commit test yang rusak** — semua test harus lulus sebelum commit
- **Jangan commit kode debug** — hapus console.log, pernyataan print, hack TODO
- **Jangan commit secret** — gunakan `.gitignore` dan variabel lingkungan

### Panduan Ukuran PR

- **Ideal:** <400 baris yang diubah
- **Dapat diterima:** 400-800 baris
- **Terlalu besar:** >800 baris — bagi menjadi PR yang lebih kecil

**Mengapa:** PR besar di-approve tanpa dicek secara mendalam. PR kecil mendapat review yang lebih teliti.

### Strategi Merge

- **Branch fitur → main:** Squash merge (histori bersih)
- **Branch release:** Merge commit (pertahankan histori)
- **Hotfix:** Cherry-pick ke branch yang terpengaruh

### Daftar Periksa Alur Kerja Git

- [ ] Branch dinamai dengan prefix tipe yang benar?
- [ ] Semua commit mengikuti format konvensional?
- [ ] Tidak ada kode debug atau secret yang di-commit?
- [ ] Semua test lulus sebelum commit?
- [ ] PR <400 baris (atau dijustifikasi jika lebih besar)?
- [ ] Pesan commit menjelaskan mengapa, bukan hanya apa?

### Prinsip Terkait
- Mandat Kelengkapan Kode @code-completion-mandate.md
- Strategi Pengujian @testing-strategy.md
