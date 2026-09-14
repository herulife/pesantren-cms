# ROUTE_INVENTORY.md — ALMAPARUNG (sumber: `cmd/api/main.go:181-421`)

Legenda Risk: P0 kritis, P1 tinggi, P2 sedang. Ownership: JWT-scoped / staff-only / any-auth / public.

| Method | Route | Auth | Role | Ownership | Handler | Risk | Target |
|---|---|---|---|---|---|---|---|
| GET | /api/health | tidak | - | - | inline statis | P1 | liveness+readiness (readiness sentuh DB) |
| POST | /api/login | limiter | - | - | auth.Login | P0 | + token_version+jti, audit, err generik |
| POST | /api/register | limiter | - | - | auth.Register | P1 | role=user tetap, validasi, audit |
| POST | /api/auth/google | limiter | - | - | auth.GoogleLogin | P1 | mock fail-closed, audit |
| POST | /api/logout | tidak | - | - | auth.Logout | P0 | revokasi token_version |
| POST | /api/telegram/webhook | secret+allowlist | - | - | notif.TelegramWebhook | P1 | fail-closed, audit |
| POST | /api/contact | limiter | - | - | message.Create | P2 | spam guard, audit |
| GET | /api/faqs | tidak | - | - | faq.List | P2 | ok publik |
| POST/PUT/DELETE | /api/faqs/* | auth | **SEMUA login** | - | faq.* | **P0** | RequireRole media/superadmin |
| GET | /api/agendas | tidak | - | - | agenda.List | P2 | ok publik |
| POST/PUT/DELETE | /api/agendas/* | auth | **SEMUA login** | - | agenda.* | **P0** | RequireRole |
| GET | /api/gallery,/videos,/news,/facilities,/teachers,/programs | tidak | - | - | masing2 List/Get | P0/P1 | DTO publik (PII teachers/donatur di-mask) |
| TULIS | /api/gallery,/videos,/news,/facilities,/teachers,/programs | auth | tim_media | - | masing2 Create/Upd/Del | P1 | ok + audit + rate-limit generate-AI |
| GET | /api/donations/campaigns,/donations | tidak | - | - | donation.* | **P0** | PII donatur publik -> DTO+auth |
| GET | /api/settings/public | tidak | - | - | setting.GetPublic | P1 | pastikan tanpa secret |
| GET | /api/me, /api/settings/role-permissions | auth | semua | JWT-scoped | auth/setting | P2 | ok |
| POST | /api/upload (30/jam) | auth | semua | - | upload.Handle | **P0** | MIME+magic+ext, re-encode webp, nama acak, proofs private |
| CRUD | /api/users* | auth | superadmin | - | auth.* | P0 | + revokasi saat role/password/hapus, audit |
| /api/settings,/api/logs | mount | auth | superadmin | - | setting/log | P1 | audit permission-changes |
| POST | /api/exams,/exams/questions | auth | superadmin | - | exam.* | P1 | ok + audit |
| POST | /api/wallet/topup | auth | superadmin | arbitrary user_id+amount | wallet.TopUp | P0 | cap+validasi+audit+idempoten |
| MOUNT | /api/payments,/spp,/iuran,/donations,/kas | auth | bendahara | staff | masing2 Routes() | **P0** | engine atomik+idempoten+audit (PHASE 6/10/11/12) |
| MOUNT | /api/school,/api/hr | auth | superadmin,bendahara?,panitia_psb,admin(zombie) | staff | school/hr | P1 | panitia_psb kelola pegawai = over-broad -> batasi |
| MOUNT | /api/psb,/api/contact | auth | panitia_psb(+superadmin/bendahara/admin?) | staff | psb/message | P1 | state machine, hapus duplikat /psb/me |
| MOUNT | /api/santri | auth | superadmin,panitia_psb | staff | santri | P1 | ownership per-rekod, link-user |
| MOUNT | /api/project,/api/raport | auth | superadmin,bendahara,tim_media | staff | project/raport | P1 | lock enforce, engine tunggal |
| PORTAL | /api/psb/me*,/my-santri,/my-bills,/my-ledger,/my-receipt,/portal/**,/attendance/token,/exams**,/wallet/my|history|pin|spend,proof spp/iuran | auth | user | **JWT-scoped** | berbagai | P0/P1 | enrollment check exams, PIN-lama, proof ownership pre-check handler |
| MOUNT | /api/disciplines | auth | superadmin,panitia_psb | staff | discipline | P2 | ok + audit |
| MOUNT | /api/academics,/api/notifications + POST /api/attendance/scan | auth | superadmin,bendahara | staff | academic/notif/attend | P1 | broadcast agregat+rate-limit+audit |
| HANDLE | /uploads/* | **TIDAK** | - | - | FileServer | **P0** | authed serve / signed-URL untuk proofs |

Dead `Routes()` tak ter-mount (drift): news/gallery/videos/teachers/programs/
facilities/agendas/faqs + auth.Routes (versi users TANPA RequireRole — privesc
laten bila di-mount). Tindakan: KEEP sambil tak ter-mount, hapus hanya via
DEPRECATE tercatat (PHASE 19/22).
