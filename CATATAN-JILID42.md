> **DOCUMENTASI USANG — jangan pakai sebagai acuan status (per 28 Sep 2026).**
>
> File ini hanya berisi 1 entri lama (KKM dynamic, image `kkm`) dan **tidak** mencakup
> pekerjaan setelahnya: bobot nilai/UH (jilid43), dropdown Kelas Kesantrian (jilid43),
> tutorial eRapor + custom field (jilid44/jilid45), sampai fix Kedisiplinan (jilid `disiplinfix`).
> Nama file juga menyesatkan: isinya entri **"Jilid 28 — KKM dynamic"**, bukan jilid42.
> Nilai container yang disebut di bawah (`alma-parung-frontend-kkm`, image `jilid43`) sudah
> tidak berlaku.
>
> **Acuan yang benar:**
> - Status live saat ini: `RINGKASAN.md` §2
> - Riwayat kerja lengkap: `RINGKASAN.md` §4
> - Pekerjaan terbuka: `HANDOFF.md` §4
> - Pelajaran teknis: `RINGKASAN.md` §6
>
> `-- Diparsing ulang 28 Sep 2026; isi asli di bawah tidak diubah. --`

## Jilid 28 — KKM dynamic (2026-09-27, live image `kkm`)
- User: "tambahkan pengaturan kkm agar bisa di edit pada menu nilai akademik".
- Backend: setting `academic_kkm` (default 75) di tabel settings; endpoint GET /academics/kkm (semua role akademik) + PUT (superadmin/admin only); `weight.SetKKM/KKM/bands/GradeLetter100`; PredikatKKM & GradeLetter100 mengikuti KKM (A>=kkm+15, B>=kkm+5, C>=kkm, D>=kkm-15, E<sisa); CreateGrade & UpdateGrade & CBT gradeLetter delegate ke weight; `main.go` loadKKMFromDB saat boot.
- Frontend: `getAcademicKKM`/`updateAcademicKKM` di api.ts; KKM card di tab Dashboard `/admin/academics` (info pita utk semua role, input+simpan utk superadmin/admin); hardcoded `>= 75` diganti state `kkm` (5 tempat).
- Verifikasi live (JWT manual): KKM 90 → final 84 = "D"; KKM 70 → "B"; KKM 75 → "B"; reset 75 tuntas; grades dihapus setelah tes; integrity ok.
- Deploy: backend image `7815d3fb1d59` tag `kkm`, frontend `a3738ef614b1` tag `kkm`; container `alma-parung-backend` + `alma-parung-frontend-kkm`; keduanya healthy.
- Pelajaran: (1) `replace(old,new,1)` hanya ganti kemunculan PERTAMA — UpdateGrade masih hardcoded (C perlu patch kedua untuk CreateGrade). (2) `pgrep -f "docker build"` false-positive; pakai `docker images` + tail log. (3) token JWT untuk uji harus pakai role DB (`superadmin`), bug "role berubah, silakan login ulang" kalau beda.
