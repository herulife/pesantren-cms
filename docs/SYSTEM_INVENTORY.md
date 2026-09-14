# SYSTEM_INVENTORY.md — ALMAPARUNG (actual, 2026-09-14)

## Backend (`apps/backend`, module `almaparung-api`, Go 1.26, chi/v5)

Entry: `cmd/api/main.go` (522 baris). Tools: `cmd/drop_testimonials`,
`cmd/licensectl`, `cmd/adminctl`. File debug root (`check_schema.go`,
`debug_db.go`, `inspect_psb.go`, `populate_test_data.go`, `reset_password.go`...)
= kandidat cleanup PHASE 22 (DEPRECATE sesudah dipakai).

Fitur (`internal/features`, 30 paket): academics, agendas, attendance, auth,
disciplines, donations, exams, facilities, faqs, gallery, hr, iuran, kas, logs,
messages, news, notifications, programs, project, psb, raport, santri, school,
settings, spp, teachers, upload, videos, wallet. (+ `payments` legacy.)

Platform (`internal/platform`): ai (Gemini-2.5/Xkiro generate berita), database
(single `db.go`, createTables + ~60 addColumnIfNotExists + runMigrations +
rewrite admin->superadmin tiap boot), logger, middleware (ratelimit, security;
auth middleware di features/auth), telegram (webhook fail-closed + allowlist),
wagate + whatsapp (whatsmeow mandiri: gateway/pair/queue 1000, pacing 3 dtk,
timeout 30 dtk, QR 50 dtk, pair-code 8 digit), weight (grading engine + test).
Validators: auth/content/donations/messages/news/psb/videos (+ test).

Middleware chain: RequestID -> Logger -> Recoverer -> SecurityHeaders -> CORS
-> RateLimiter (login/register/google/webhook/contact/upload terpisah) ->
AuthMiddleware -> RequireRole (superadmin bypass).

## Frontend (`apps/frontend`, Next.js 16.2.2 + React 19, 108 page.tsx)

Route grup: `admin/` (+`admin-bs/`), `portal/`, `psb/`+`psb-daftar/`,
`donations/`, `news/`, `galeri/`, `videos/`+`video-youtube/`, `teachers/`,
`facilities/`, `program/`, `agendas/`, `profil/`, `sambutan/`, `syarat/`,
`kontak/`, `login/`, `register/`, `privasi/`, `audit-full/` + `audit-gpt/` (baru,
uncommitted). Guard: `src/middleware.ts` (cookie alma_token|token -> /admin &
/portal). API client: `api.ts` ~1800 baris, credentials:include, pola fetch
manual per-page (belum abstraksi tunggal).

## Database (SQLite modernc, raw SQL, `data/alma-parung.db` ~1.1MB + WAL ~4MB)

50 tabel: academic_years, activity_logs, agendas, attendance, categories,
classes, donation_campaigns, donations, donors, employees, exam_answers,
exam_questions, exam_sessions, exams, facilities, faqs, gallery, grades,
iuran_bills, kas_categories, kas_transactions, kesantrian_aspek, messages,
news, payment_transactions, payments (legacy), programs, project_activities,
project_indicators, project_subprojects, raports, raw_logs, receipts,
registrations, santri, schema_migrations, settings, spp_bills, student_points,
subjects, tahfidz_progress, teacher_attendance, teachers, user_qr_tokens,
user_wallets, users, videos, violation_logs, wallet_transactions
(+ sqlite_sequence). 6 backup `.bak-*` manual di `data/` (cp, tidak WAL-safe).
WA session terpisah `data/wagate/wa_session.db` (~4.5MB). Data live kecil:
users 4, santri 3 (user_id NULL semua), registrations 0, teachers 1,
spp_bills 2 (unpaid), grades 8, raports 1 (locked, 82.58 "Sangat Baik" = bukti
bug C11), academic_years KOSONG, settings 42, activity_logs 161.

## Infrastruktur

- Container: `alma-parung-frontend` (3002->3000), `alma-parung-backend`
  (8090->8080), restart unless-stopped. Satu compose:
  `deploy/darussunnah/docker-compose.yml`. `.dockerignore` baru (untracked).
- Uploads: `data/uploads` (serve /uploads/* tanpa auth). Env: root `.env`
  (294B) + `.env.example`. DB path inkonsisten: compose darussunnah
  `/data/alma.db` vs runtime `/data/alma-parung.db` (risiko DB ganda).
- Eksternal: Telegram bot, Google SSO (idtoken, mock fail-closed), Gemini/Xkiro,
  YouTube thumbnails, whatsmeow mandiri. Tanpa payment gateway, cron, redis,
  cache, queue eksternal, monitoring/healthcheck berarti. TZ campur
  (Asia/Bangkok vs CURRENT_TIMESTAMP UTC).
- Test existing (10 file): ratelimit, weight/engine, validators, repository
  auth/spp/wallet/donations/payments/news. Tanpa concurrency/security/E2E.
