# RBAC_MATRIX.md — ALMAPARUNG (actual)

Role aktif: `superadmin`, `bendahara`, `panitia_psb`, `tim_media`, dan `user` (wali/portal). `admin` hanya role legacy; dimigrasikan ke `superadmin` saat boot, tidak dapat dibuat atau dikelola melalui Manajemen Pengguna.

| Modul | superadmin | bendahara | panitia_psb | tim_media | user |
|---|---|---|---|---|---|
| users | FULL | kelola staf; tanpa delete | - | - | - |
| settings/logs | FULL | - | - | - | - |
| exams create/questions; wallet topup | FULL | - | - | - | my/history/pin/spend |
| payments/spp/iuran/donations/kas | FULL (bypass) | FULL | - | - | proof + my-bills/ledger/receipt |
| school | FULL | read/write | read/write | - | - |
| hr | FULL | FULL | - | - | - |
| psb/contact | FULL | - | FULL | - | psb/me milik sendiri |
| santri/disciplines | FULL | - | FULL | - | my-santri |
| project | FULL | FULL | - | FULL | - |
| raport | FULL | FULL | - | route saja; halaman eRapor memerlukan akses academics/school | raport/me |
| academics/notifications/scan | FULL | FULL | - | - | grades/attendance/tahfidz milik sendiri |
| gallery/videos/news/facilities/teachers/programs | FULL | - | - | TULIS | baca publik |
| faqs/agendas tulis | FULL | - | - | FULL | - |

Aturan: otorisasi di backend (`RequireRole` + ownership per-rekod + JWT-scoped portal). Frontend (`role_menu_permissions` + Sidebar) hanya UX, backend tetap authority. Manajemen staf menolak target `user`/`admin`; aksi role/password/delete terhadap akun sendiri ditolak; superadmin terakhir dilindungi dari demosi atau penghapusan.

