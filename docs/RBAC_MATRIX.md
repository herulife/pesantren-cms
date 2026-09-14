# RBAC_MATRIX.md — ALMAPARUNG (actual)

Role existing: superadmin, bendahara, panitia_psb, tim_media, admin (ZOMBIE —
dimigrasi ke superadmin tiap boot tapi CHECK+route+menu masih menyebut),
user (wali/portal). JANGAN buat role baru tanpa alasan (keputusan: finalisasi
`admin` = SG-02).

| Modul | superadmin | bendahara | panitia_psb | tim_media | admin(zombie) | user |
|---|---|---|---|---|---|---|
| users/settings/logs | FULL | - | - | - | disebut route | - |
| exams create/questions | FULL | - | - | - | - | ikut ujian saja |
| wallet topup | FULL | - | - | - | - | my/history/pin/spend |
| payments/spp/iuran/donations/kas | FULL (bypass) | FULL | - | - | - | proof + my-bills/ledger/receipt |
| school/hr | FULL | YA (over-broad?) | YA (over-broad) | - | disebut | - |
| psb/contact | FULL | - | FULL | - | disebut | psb/me milik sendiri |
| santri/disciplines | FULL | - | FULL | - | - | my-santri |
| project/raport | FULL | FULL | - | FULL | - | raport/me |
| academics/notif/scan | FULL | FULL | - | - | - | grades/attendance/tahfidz milik sendiri |
| gallery/videos/news/facilities/teachers/programs | FULL | - | - | TULIS | - | baca publik |
| faqs/agendas tulis | **SEMUA LOGIN (CACAT)** | sama | sama | sama | sama | sama -> TARGET: tim_media/superadmin saja |

Aturan: otorisasi di backend (RequireRole + ownership per-rekod + JWT-scoped
portal). Frontend (menu `role_menu_permissions` + Sidebar) hanya UX, backend
authority. Perbaikan: hapus bypass implisit di mana ownership wajib (portal),
finalisasi `admin`, batasi panitia_psb di HR, sinkron menu FE vs BE.
