
## Jilid 28 — KKM dynamic (2026-09-27, live image `kkm`)
- User: "tambahkan pengaturan kkm agar bisa di edit pada menu nilai akademik".
- Backend: setting `academic_kkm` (default 75) di tabel settings; endpoint GET /academics/kkm (semua role akademik) + PUT (superadmin/admin only); `weight.SetKKM/KKM/bands/GradeLetter100`; PredikatKKM & GradeLetter100 mengikuti KKM (A>=kkm+15, B>=kkm+5, C>=kkm, D>=kkm-15, E<sisa); CreateGrade & UpdateGrade & CBT gradeLetter delegate ke weight; `main.go` loadKKMFromDB saat boot.
- Frontend: `getAcademicKKM`/`updateAcademicKKM` di api.ts; KKM card di tab Dashboard `/admin/academics` (info pita utk semua role, input+simpan utk superadmin/admin); hardcoded `>= 75` diganti state `kkm` (5 tempat).
- Verifikasi live (JWT manual): KKM 90 → final 84 = "D"; KKM 70 → "B"; KKM 75 → "B"; reset 75 tuntas; grades dihapus setelah tes; integrity ok.
- Deploy: backend image `7815d3fb1d59` tag `kkm`, frontend `a3738ef614b1` tag `kkm`; container `alma-parung-backend` + `alma-parung-frontend-kkm`; keduanya healthy.
- Pelajaran: (1) `replace(old,new,1)` hanya ganti kemunculan PERTAMA — UpdateGrade masih hardcoded (C perlu patch kedua untuk CreateGrade). (2) `pgrep -f "docker build"` false-positive; pakai `docker images` + tail log. (3) token JWT untuk uji harus pakai role DB (`superadmin`), bug "role berubah, silakan login ulang" kalau beda.
