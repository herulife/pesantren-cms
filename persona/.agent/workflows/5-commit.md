---
description: Commit Git dengan format konvensional
---

# Kirim: Commit

## Tujuan
Commit pekerjaan yang telah selesai dengan format commit konvensional yang tepat.

> **Catatan:** Untuk konvensi detail (penamaan branch, tipe commit, ukuran PR, strategi merge),
> lihat `git-workflow-principles.md` di `.agent/rules/`.

## Prasyarat
- Semua pemeriksaan verifikasi lulus
- Kode siap untuk review/merge

## Langkah-langkah

### 1. Tinjau Perubahan
```bash
git status
git diff --staged
```

### 2. Stage Perubahan
```bash
# Stage semua perubahan
git add .

# Atau stage secara selektif (sesuaikan path sesuai project-structure.md)
git add apps/backend/internal/features/task/
```

### 3. Commit dengan Format Konvensional

Ikuti format dari `git-workflow-principles.md`:

```bash
git commit -m "<tipe>(<cakupan>): <deskripsi>"
```

**Contoh:**
```bash
git commit -m "feat(task): tambah endpoint API CRUD"
git commit -m "fix(auth): perbaiki validasi kedaluwarsa token"
git commit -m "refactor(storage): ekstrak interface untuk layer storage"
git commit -m "test(task): tambah test integrasi untuk adapter storage"
```

### 4. Perbarui task.md
Tandai item yang selesai sebagai `[x]` di daftar periksa tugas.

## Kriteria Penyelesaian
- [ ] Perubahan di-commit dengan format yang tepat
- [ ] task.md diperbarui untuk mencerminkan penyelesaian
