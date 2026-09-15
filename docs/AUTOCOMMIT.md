# Auto-Commit Otomatis ke GitHub

Setiap perubahan kode di working tree **otomatis di-commit dan di-push** ke
branch `codex/pesantren-cms-import-2026-05-04` (remote `origin`) tanpa perlu
aksi manual. Tujuan: semua agentic lain selalu melihat state terbaru di GitHub.

## Cara kerja
- Skrip: `scripts/autocommit.sh`
- Dijalankan via PM2 dengan nama proses **`alma-autocommit`** (interval cek 20 detik).
- Deteksi perubahan: `git status --porcelain` (mencakup file baru tanpa melacak
  isi file `.next`, node_modules, db, log, data/, backups/, dll — sudah di .gitignore).
- Commit message: `auto: <daftar file>` + timestamp. Push ke branch aktif.
- Auto-restart setelah server reboot via `pm2 startup systemd`.

## Perintah
- Cek status:  `pm2 list`
- Lihat log:   `tail -f ~/alma-parung/scripts/autocommit.log`
- Stop sementara: `pm2 stop alma-autocommit`
- Jalankan lagi: `pm2 start alma-autocommit`

## Catatan untuk agent lain
1. Jangan melakukan `git commit` manual yang berkonflik dengan auto-commit —
   cukup tulis perubahan, biarkan skrip ini yang commit & push.
2. File DB `/ log / build / env` sengaja tidak pernah di-commit.
3. Beberapa commit ber-prefix `auto:` adalah produk skrip ini, bukan hasil edit manual.
