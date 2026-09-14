'use client';
import PublicLayout from '@/components/PublicLayout';
import { Shield, AlertTriangle, Copy, Check, Search, Database, Zap, Eye } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

const report = `# MASTER AUDIT ULANG — ALMAPARUNG LIVE PRODUCTION — 2026-09-14
Sifat: READ-ONLY. Tanpa ubah kode/DB/config/migration, tanpa restart service, tanpa fix. Agregasi SELECT-only ke DB live + static analysis 6 agen paralel + verifikasi ulang temuan 2026-09-13 (±95). Bukti file:line aktual, bukan perkiraan.

## A. EXECUTIVE SUMMARY
- Stack: Go 1.26 + chi/v5 (BE), Next.js 16.2.2 + React 19 (FE), SQLite modernc (tanpa ORM, raw SQL), JWT HS256 cookie alma_token 24 jam, upload image-only 5MB, WA mandiri whatsmeow (tanpa gateway eksternal), TANPA payment gateway (manual proof), deploy Docker (frontend :3002→3000, backend :8090→8080) + nginx.
- DB live kecil: users 4 (superadmin/bendahara/tim_media/user masing-masing 1), santri 3 (SEMUA user_id NULL → portal wali tak bisa lihat santri asli), registrations 0, teachers 1, employees 0, spp_bills 2 (unpaid), iuran/paytx/receipts/kas_tx/payments/donations/donors 0, grades 8, raports 1 (locked, "Sangat Baik", 82.58 — BUKTI HIDUP bug predikat C11), academic_years KOSONG, settings 42, activity_logs 161, classes 8, news 12, gallery 22, videos 19. Orphan 0, duplikat 0 (data terlalu kecil untuk menyembunyikan apa pun — risiko bersifat struktural, bukan data).
- Verifikasi temuan lama: C1–C11 SEMUA MASIH TERBUKA (11/11 STILL OPEN). HIGH lama mayoritas STILL OPEN; yang FIXED hanya: accepted-tanpa-paid di handler (PARTIAL, TOCTOU tersisa), /psb/status mock (hilang, tapi error-swallowing tersisa), grade-weight 50/25/25 di level mapel (tidak terbukti). Klaim "±95 temuan" terkonfirmasi ulang per file:line.
- Temuan BARU (di luar 95 lama): 15 security (S-N1..N15) + 14 money (M-N1..N14) + 6 race (R1..R6) + 7 PPDB/santri (P-N1..N7) + donasi/akademik/absensi/WA/upload (D/A/B/W/U) — total ±60 butir baru. Sorotan: FAQ/agenda bisa ditulis user mana pun (any-auth write), atribusi actor NOL di semua tulis kas/SPP (bug type-assertion), verifikasi uang TANPA audit log, rate limiter salah IP di belakang nginx, PIN wallet in-memory, logout tanpa revokasi, CBT→grades sync gagal diam-diam (ON CONFLICT tanpa unique index).
- TOP 10 RISIKO PRODUCTION: (1) duplikasi uang via race Pay/verify/cancel; (2) drift ledger-receipt-bill permanen tiap cancel; (3) PII donatur + bukti bayar publik; (4) deface FAQ/agenda oleh pendaftar anonim; (5) verifikasi uang tanpa jejak siapa; (6) atribusi actor=0 di semua kas; (7) lockout login massal akibat rate-limit IP proxy; (8) predikat rapor salah massal ("Sangat Baik" untuk semua); (9) backup SQLite manual berisiko korup (WAL); (10) academic_years kosong + auto-migrasi admin→superadmin tiap boot tanpa audit.

## B. CURRENT ARCHITECTURE
- BE entry cmd/api/main.go:51 (loadEnv→validateEnv→logger→database.Connect→go wagate.Start→chi→:API_PORT). Chain: RequestID→Logger→Recoverer→SecurityHeaders→CORS→RateLimiter→AuthMiddleware→RequireRole (superadmin bypass). Semua route /api di main.go:181-421; sub-router Routes() per fitur (sebagian tak ter-mount = drift).
- FE entry app/layout.tsx+page.tsx; guard src/middleware.ts (cookie alma_token|token → /admin & /portal). api.ts ~1800 baris credentials:include.
- DB: database/sql + modernc.org/sqlite v1.48.0, var DB global, WAL+NORMAL+FK ON+busy 5s, MaxOpenConns(1). File live /home/heru/alma-parung/data/alma-parung.db (~1.1MB +wal/shm) + 5 bak manual; WA session terpisah /data/wagate/wa_session.db (~4.5MB). Migrasi: createTables + ~60 addColumnIfNotExists + runMigrations + rewrite admin→superadmin TIAP BOOT (db.go:778-782, tanpa audit, irreversible).
- Auth: JWT HS256 {id,email,role,exp+24h}, cookie alma_token HttpOnly SameSiteLax, RequireRole + superadmin bypass (middleware.go:94-109). Role: superadmin/bendahara/panitia_psb/tim_media/admin/user (admin = zombie, dimigrasi tiap boot tapi CHECK+route+menu masih menyebutnya).
- Upload: POST /api/upload (auth, 30/jam), 5MB, image-only, re-encode 1600px q85 (kecuali webp mentah), nama UnixNano, serve /uploads/* TANPA AUTH (FileServer).
- WA: whatsmeow mandiri (gateway.go/pair.go/queue.go: antre 1000, pacing 3 dtk, timeout 30 dtk, QR 50 dtk + pair-code 8 digit). Fonnte dihapus (sisa nama env di compose darussunnah). Tanpa cron/redis/queue eksternal; hanya goroutine antrean in-process.
- Payment: NOL gateway (grep midtrans/xendit/tripay/doku/stripe = 0). Manual: proof upload → verify → ledger+receipt+kas manual.
- Deploy: Dockerfile BE (golang:1.26→alpine, EXPOSE 8080, tanpa .dockerignore → image menelan *.db + debug script + .env lokal bila ada) & FE (node:20, tanpa output:standalone/HEALTHCHECK). Runtime: docker (alma-parung-frontend/backend, restart unless-stopped) + nginx (darussunnah conf full-site; benuatech conf API-only → 127.0.0.1:8080). Inkonsistensi: compose darussunnah DB_PATH=/data/alma.db vs runtime /data/alma-parung.db (risiko DB ganda); :3002 tak ada di repo (mapping host); alma-backend.service pakai "go run" (butuh toolchain, cold-start lambat); TZ Asia/Bangkok vs CURRENT_TIMESTAMP UTC.
- Integrasi eksternal: Telegram Bot (webhook fail-closed + allowlist), Google SSO (idtoken, fail-closed bila mock), AI Gemini-2.5/Xkiro (generate berita), YouTube thumbnails. Tanpa cache, tanpa worker, tanpa monitoring/healthcheck berarti (health statis OK tanpa sentuh DB; tanpa graceful shutdown).
- Diagram ASCII: USER→(https almaparung.com)→NGINX(/ →frontend:3000; /api/,/uploads/ →backend:8080)→FRONTEND(Next, rewrite /api/*,/uploads/* →BACKEND_ORIGIN, cookie alma_token)→API(Go chi, middleware chain, JWT, RequireRole)→HANDLER per fitur→REPOSITORY(raw SQL)→SQLITE(/data/alma-parung.db; WA /data/wagate/wa_session.db; uploads data/uploads). Samping: WA whatsmeow | Telegram | Google SSO | Gemini/Xkiro | YouTube. Tidak ada: payment gateway, cron, redis, cache, queue eksternal.

## C. DATABASE FORENSIC (aktual, bukan skema)
- 49 tabel (verifikasi SELECT): academic_years, activity_logs, agendas, attendance, categories, classes, donation_campaigns, donations, donors, employees, exam_answers/questions/sessions, exams, facilities, faqs, gallery, grades, iuran_bills, kas_categories, kas_transactions, kesantrian_aspek, messages, news, payment_transactions, payments, programs, project_activities/indicators/subprojects, raports, raw_logs, receipts, registrations, santri, schema_migrations, settings, spp_bills, student_points, subjects, tahfidz_progress, teacher_attendance, teachers, user_qr_tokens, user_wallets, users, videos, violation_logs, wallet_transactions.
- Isi: lihat ringkasan A. Tabel uang & akademik nyaris kosong kecuali 2 tagihan SPP unpaid + 8 nilai + 1 raport.
- Index aktual: 37 (bukan 40). Hilang di path panas: spp/iuran(santri_id),(status),(paid_at); paytx(bill_type,bill_id),(bill_period); kas_tx(category_id); santri(user_id); receipts year-expression untuk MAX().
- FK aktual 30 entri, mayoritas NO ACTION tanpa ON DELETE; hanya santri.user_id→SET NULL & donations.campaign→SET NULL (+CASCADE di project). Split identitas: akademik (grades/attendance/tahfidz/raports/points/violations/exams)→users.id; keuangan (spp/iuran/receipts/paytx)→santri.id; jembatan satu-satunya santri.user_id yang di live NULL semua.
- Anomali data: (1) academic_years KOSONG → validasi tahun ajaran mustahil; (2) santri.class berisi 'v' kecil & 'VII-A' — cocok dengan master classes ('v','VII-A',IX/VII/VIII Putra/Putri) tapi free-text tanpa FK; (3) raport id=1 locked predikat "Sangat Baik" final 82.58 = bukti bug skala C11 di data produksi; (4) 0 orphan, 0 duplikat NIS/NIK/email/receipt/code (data kecil); (5) status spp 2×unpaid; roles 4×1; santri tanpa user 3/3; WA number format semua valid.
- Kolom: santri TANPA kolom nik (query gagal) — NIK hanya di registrations; grades TANPA kolom uts/uas/tugas (nama kolom berbeda — formula di kode tetap 30/40/30).

## D. API INVENTORY (ringkas, lengkap per grup)
- Publik (tanpa auth): GET /health; POST /login /register (role=user tetap) /auth/google (mock DEV fail-closed) /logout (hapus cookie saja); POST /telegram/webhook (secret+allowlist); POST /contact; GET faqs/agendas/gallery/videos/news(fasilitas/teachers/programs/donations/campaigns/settings-public; ⚠️ GET /donations = PII donatur publik; GET /teachers = email+WA staf publik; GET /uploads/* statis tanpa auth.
- Auth-only: GET /me, /settings/role-permissions, POST /upload. ⚠️ KRITIS: POST/PUT/DELETE /faqs/* & /agendas/* hanya butuh login (user mana pun bisa deface — main.go:200-215).
- tim_media: tulis gallery/videos/news(+restore/pin/force/generate AI tanpa rate-limit)/facilities/teachers/programs.
- superadmin-only: /users CRUD + password/role, /settings, /logs, POST /exams(+questions), POST /wallet/topup (user_id+amount arbitrary, cap 1e9).
- bendahara: /payments (all/transactions/receipt/unpaid/users + CRUD), /spp & /iuran (bills/summary/report/santri/combined-report, generate, CRUD, pay/cancel/verify, delete by-period/by-santri), /donations (CRUD + verify + donors), /kas (categories CRUD, transactions GET/POST/DELETE tanpa update, summary).
- superadmin,bendahara,panitia_psb,admin(zombie): /school (classes+years CRUD + activate), /hr (employees CRUD, attendance CRUD, per-guru, raw-logs, import, sync) — panitia_psb bisa kelola pegawai = over-broad.
- panitia_psb: /psb full router (termasuk /me duplikat — C8), /contact inbox.
- superadmin,panitia_psb: /santri (CRUD/bulk/set-class/link-user) + /disciplines; GET /santri/{id} tanpa ownership per-rekod (staf saja).
- bendahara,tim_media: /project + /raport (save paksa lock+hitung ulang; GET /santri/{id} tanpa ownership).
- user (portal): /psb/me* (JWT-scoped ✓), /my-santri /my-bills /my-ledger /my-receipt, /portal/raport/me, tahfidz, /attendance/token, exams (list + questions TANPA enrollment check + start sesi arbitrary exam_id; answer/finish cek ownership ✓), wallet my/history/pin (tanpa verifikasi PIN lama!) /spend (PIN + lockout 5/15 mnt ✓), proof SPP/iuran (ownership di repo, tanpa pre-check handler).
- superadmin,bendahara: /academics full (grades/attendance/tahfidz CRUD + reads arbitrary id tanpa ownership), /notifications (WA status/QR/pair/disconnect, send-wa/telegram arbitrary, broadcast tagihan/nilai/PSB tanpa rate-limit), POST /attendance/scan (frontline roles tak bisa scan).
- Dead Routes() tak ter-mount (drift): news/gallery/videos/teachers/programs/facilities/agendas/faqs + auth.Routes (⚠️ versi users tanpa RequireRole — privesc laten bila kelak di-mount).

## E. AUTHENTICATION & AUTHORIZATION
- Login/register/Google ok; JWT HS256 24 jam; cookie alma_token; middleware cookie→Bearer; RequireRole + superadmin bypass. validateEnv fail-closed (JWT_SECRET wajib, DEV_MODE tolak di prod, origins tolak localhost).
- Hardcoded identity: SATU temuan — donations/handler.go:228 adminID:=1 (C2, masih ada). Klaim JWT id bertipe float64; kas/spp/payments assert ke map[string]interface{} padahal middleware simpan jwt.MapClaims → SEMUA atribusi actor=0 (S-N15, kritis forensik).
- Tanpa revokasi: logout/password-reset/hapus-user/ganti-role tidak membatalkan JWT ≤24 jam (S-N5); role basi ≤24 jam (S-N6); PIN wallet in-memory reset saat restart (S-N11); DEV mock login fail-closed (ok).
- Matriks ROLE×MODUL: publik semua; FAQ/agenda tulis = SEMUA role terautentikasi (cacat); media tulis = tim_media; users/settings/logs/exams-create/topup = superadmin; keuangan = bendahara; school/HR = +panitia_psb+admin(zombie); PSB = panitia_psb; santri = +panitia_psb; raport/project = +tim_media; academics/notif/scan = bendahara; portal = user (+superadmin via bypass; staf-wali tak bisa dual-role).
- Menu FE vs BE: 'admin' mati di kedua shell + main.go:348 (C3); tim_media tak dapat menu raport/project yang ia boleh akses; bendahara dikunci dari Notifikasi classic; HR disembunyikan dari bendahara/panitia yang boleh akses; classic tanpa menu Disciplines/Messages; MANAGEABLE_ROLES vs validator bisa bikin 'admin'; Sidebar izinkan drift via role_menu_permissions DB; portal asumsi single-role.

## F. PPDB (state machine aktual)
- REGISTER→SaveMine(upsert, pending)→dokumen(partial)→payment(pending, hapus note)→verify payment(unpaid/pending/paid/rejected+note, TANPA cek bukti/nominal/matriks)→status(pending/review/accepted/rejected, accepted wajib paid — guard handler, TAPI TOCTOU)→TIDAK ADA jembatan ke santri (nol call-site; entri manual ulang, NIK tak terbawa).
- BE biodata wajibkan hanya full_name vs FE 14 field → bypass curl; NIK opsional & tak unik; gender 4+ kosakata; dokumen opsional + tak bisa dihapus (empty=keep); FE klaim PDF tapi uploader image-only; nominal tanpa batas bawah & tanpa cek vs settings.psb_payment_amount; tolak status tanpa alasan; hapus = hard delete + bisa hapus accepted+paid; hotlink URL apa pun + serve tanpa auth; error FE getMyPSBRegistration → null (sesi kedaluwarsa terbaca "belum daftar").
- Temuan baru P-N: route shadow /santri/{id} (LOW), UpdateEmployee nol validasi (HIGH), amount=1 bisa paid (MED, fee evasion), ValidateMediaURL terima host jahat (MED), error conflation (MED), filename enumerable (LOW), search PSB FE-only (LOW).

## G. SANTRI (CRUD)
- NIS+nama+kelas wajib; bulk ≤500 skip-UNIQUE diam-diam (laporan sukses palsu); update full-overwrite; link-user tanpa cek role/unik/tanpa unlink; set-class string bebas termasuk ""; hapus hard tanpa guard (FK enforced → 500 mentah); hapus-user orphan-kan santri (SET NULL diam-diam); paginasi 4 bentuk berbeda; export client-side (PII keluar tanpa watermark/audit); teachers paginasi in-memory; employees tanpa paginasi + update tanpa validasi.

## H. GURU & PEGAWAI
- 3 master tumpang tindih TERKONFIRMASI: users↔santri (satu-satunya FK), teachers isolasi (tanpa user_id), employees PK code teks (tanpa user_id), teachers↔employees tanpa kunci bersama. Satu manusia = hingga 4 baris tanpa dedup (hanya users.email unik). Guru/pegawai tanpa identitas portal. Live: teachers 1, employees 0.

## I. SPP & IURAN + J. PAYMENT (mendalam)
- Generate: tanpa tx, parsial mungkin, INSERT OR IGNORE (duplikat idempoten tapi amount/due tak ter-update; konkuren beda amount = siapa cepat dia dapat).
- PayBill: BEGIN DEFERRED → SELECT → guard → UPDATE bill → INSERT ledger (code=KTR+lastID, aman) → upsertRekap(MAX()+1, TAK ADA retry) → COMMIT. Atomic lawan crash, TIDAK race-safe: R1 dobel-bayar konkuren (ledger ganda + receipt ganda); R2 verify-vs-pay; R3 cancel-vs-pay (salah satu orphan); R4 retry tanpa idempotency (klik ganda = efek ganda); R5 MAX()+1 (500/duit ganda); R6 proof-vs-proof & pay-di-bawah-pending. Tanpa BEGIN IMMEDIATE/FOR UPDATE/kunci/Idempotency-Key di mana pun.
- Verify: SELECT pending DI LUAR tx → PayBill (jendela basi); approve tak validasi pending≤sisa (M-N2 overpay via verify); tolak benar (belum tulis apa pun). Cancel: single UPDATE tanpa tx, ledger+receipt+kas TAK tersentuh = drift permanen (C6); tak bisa parsial.
- SubmitProof: SELECT+UPDATE non-atomik, tanpa cek-vs-Pay; paid_at string bebas dari jam klien (M-N3 merusak bucket laporan); proof_url string bebas (S-N1 XSS potensial); after-approve nilai basi tak dibersihkan.
- UpdateBill: tak hitung ulang status (M-N8), abaikan pending (SPP #7), due_date lolos di repo; DeleteBill cegah paid tapi telan pending (#9); DeleteBy* hapus pending (#10); filter admin sembunyikan pending (#8).
- Receipt: dua penulis (upsertRekap dalam tx Pay + GetOrCreateReceipt dengan retry rekursi TAK BERBATAS #5); total tak pernah diperbaiki (#14); kwitansi per-bill = agregat bulan (salah bill #13/#19); MyLedger cap 50 → kwitansi salah (M-N5); paytx(bill_type,bill_id) tanpa index/unique (M-N12 UNIQUE('') berisiko); pad6 potong 6 digit (M-N13 tabrakan >1 jt).
- WA kwitansi: fire-and-forget, tangkap *http.Request di goroutine (M-N11 race), total gabungan bulan.
- Donasi verify: BEGIN DEFERRED, idempoten-DB diam + WA ganda tiap re-PUT (D3), atribusi▶user 1.

## K. LEDGER & KEUANGAN (rekonsiliasi)
- 4 kebenaran divergen by-design: bill.paid_amount (mutable, bisa nol via cancel), paytx.amount (append-only), receipts.total (increment-only), kas manual-only. Tanpa job/view rekonsiliasi. Live semua NOL kecuali 2 tagihan → rekonsiliasi trivial hari ini, bom waktu esok.
- Summary kas: Income = SPP+Iuran+Donasi+KasMasuk → double-count bila operator bukukan kas manual ikut seed kategori SPP/Iuran; under-count saldo kas bila tidak (saldo campur sum-bill dengan kas-expense). Kategori/hapus/ubah-kind: tanpa FK/check di update (orphan via LEFT JOIN senyap). payments legacy user-keyed di luar semua summary + GetAll in-memory. Normalisasi method bercabang; tanggal caller-supplied merusak bucket; bill_id NULL/orphan surface ada.

## L. DONASI
- C1 PII publik TERBUKA (handler 70-90 + repo SELECT nama/HP/nominal + main 305; search LIKE nama/HP → enumerasi). C2 adminID=1 (227-230). D3 WA ganda re-verify; D4 hapus campaign yatimkan donasi (SET NULL, judul NULL di join, route selalu 200); D5 campaign fiktif tanpa created_by/moderasi; D6 amount>0 cap 1e12 tapi tanpa cek eksistensi campaign, type/method bebas, float truncation; D7 lock verified hanya handler-level; D8 UpdateCampaignAmount dead code.

## M. AKADEMIK
- C11 TERBUKTI DI DATA: Predikat skala 1-4 (3.5/2.5/1.5) dipanggil dengan final 0-100 → raport live "Sangat Baik" 82.58; komentar kode mengakui. Bobot mapel seragam 30/40/30 (klaim 50/25/25 di level mapel TIDAK terbukti); 50/25/25 adalah level E-Raport dan preview-vs-save DIVERGEN (preview terima bobot custom sum=100, save paksa 50/25/25 — A3). Locked tak dienforce (Upsert overwrite, tanpa generated_by — A4). A2: grades & attendance TANPA UNIQUE → duplikat; sync CBT exams ON CONFLICT kolom non-unik → error ditelan (blank identifier) → nilai CBT gagal diam-diam + FinishSession tetap sukses. A5 IDOR akademik (reads/writes arbitrary id); A6 semester ganjil/1 campur + academic_year tanpa validasi (tabelnya kosong); A7 KKM disimpan tak dipakai; A8 skor project placeholder 3.0 → semua final project 75.0; A9 sesi ujian (tanpa window, injeksi jawaban lintas-ujian, re-finish); A10 points aman-matematika validasi tipis; A11 evaluation_date mentah.

## N. ABSENSI
- QR: CSPRNG+SHA256+5 mnt+single-use+invalidate = baik; TAPI guard duplikat tanpa UNIQUE (dead branch) → dobel-scan konkuren lolos (B1). C10 TERBUKA: WA ke users.whatsapp (nomor santri) bukan parent_phone; pola benar ada di spp/iuran/notifications tapi tak dipakai; kosong = diam. B3 token plaintext legacy diterima; B4 timezone implisit + tanggal manual bebas/masa depan; B5 raw fingerprint percaya fp_id=employee_code tanpa cek employees (ghost rows), tanpa in/out; B6 teacher UNIQUE baik + update/delete lemah. Absensi manual & guru: TANPA WA otomatis (FormatAbsensiAlert tanpa call-site).

## O. WHATSAPP
- 10 event: donasi verified (go), QR absensi (go, nomor salah), SPP/Iuran kwitansi (go, gated setting), kirim manual arbitrary (admin, tanpa allowlist), broadcast tagihan (sumber payments LEGACY + users.whatsapp basi — W1), broadcast nilai (satu pesan per baris nilai — spam), broadcast PSB (tanpa dedup, termasuk pending), PERUBAHAN STATUS PSB = TANPA WA (gap), absensi manual/alpha/guru = TANPA WA.
- W2 stale-context + fire-and-forget (donasi/QR pakai Background dengan benar); W3 kirim sinkron tahan caller ~30 dtk, antre 1000×3 dtk = drain ~50 mnt, timeout massal → duplikat saat retry; W4 IsConfigured bohong + NormalizePhone ganda. Session SQLite + QR 50 dtk + anti-spam reset 45 dtk + mutex pairing = baik.

## P. UPLOAD
- U1 HIGH: bukti bayar/KK/ijazah/foto = privat-niat tapi publik-fakta (FileServer tanpa auth, nama timestamp enumerable). U2 proof_url/dokumen = string bebas (bypass sanitizeImage, dorong hotlink eksternal karena PDF tak bisa diunggah). U3 webp mentah tanpa re-encode. U4 image-only + floor 100px menolak struk sah. U5 gallery URL eksternal. Positif: 5MB, magic-byte+decode, nama server-side, tanpa traversal, auth+rate-limit saat upload.

## Q. SECURITY (ringkas)
- SQLi: AMAN (semua placeholder; 2 Sprintf internal-only). XSS: sanitizer berita baik + render plain (aman); bahaya = proof_url tak tervalidasi (S-N1 HIGH). CSRF: Lax tanpa token + header X-CSRF-Token mati (MED). IDOR: exam questions enumerable (MED), proof/receipt scoping di repo (verifikasi), reads akademik arbitrary-id (staf). SSRF: nihil. Traversal: aman. Secrets: .env tak terlacak (baik); placeholder change_me/mock_client_id (LOW); public.key (ok). CORS baik (tanpa validasi skema, LOW). Header: BE ok (tanpa HSTS), Next tanpa CSP, nginx NOL header + NOL limit_req (MED). Rate-limit: login/register/google/contact/upload/webhook ada; PIN lock ada; TAPI clientIP = RemoteAddr → bucket global bersama di belakang nginx (S-N9 MED-HIGH: lockout massal + akuntansi rusak) + endpoint bernilai tanpa throttle (S-N10). Password bcrypt DefaultCost baik; batas 72-byte truncation + min 8 saja (LOW). JWT baik-bentuk, buruk-siklus (tanpa jti/revokasi/version — S-N5/N6).

## R. CONCURRENCY (R1-R6 + pola)
- Pola check→act di Pay/verify/cancel/proof/receipt/grades-sync/QR-scan; MAX()+1 di 3 jalur; INSERT OR IGNORE; GetOrCreate rekursi; antrean WA. R1 dobel-Pay (Critical), R2 verify-vs-pay (High), R3 cancel-vs-pay (Critical drift), R4 retry tanpa kunci (High), R5 MAX()+1 (High), R6 proof-vs-proof/pay-di-bawah-pending (High). Pool=1 mempersempit, tak menutup (antar-proses/host tetap terbuka; SQLite DEFERRED tanpa IMMEDIATE).

## S. ERROR HANDLING
- 4 dialek envelope (auth+correlation_id; psb tanpa correlation; spp/dll lokal; raport arg-order beda + bocorkan err mentah). 200-untuk-create (payments:288), kode numerik mentah (kas), 400-vs-422 acak, GetMine 200-null vs GetByID 404, 500-untuk-konflik (kas duplikat; banding santri 409 benar), BOCORAN INTERNAL: raport+wallet kembalikan err.Error() (S-N12 MED, oracle+skema).

## T. AUDIT LOGGING (before/after TAK PERNAH ada)
- Tercatat: auth (login/register/user CRUD), SPP/iuran generate/pay/cancel/delete + SEND_WA_KWITANSI, payments CRUD, news, ERAPORT_LOCK, project generik — semua prose bebas.
- LUBANG: verifikasi pembayaran (aksi uang TERKRITIS) TAK tercatat di spp/iuran/PSB/donasi; hapus-user MENGHAPUS jejaknya sendiri (DELETE activity_logs — bukti ikut hilang); tanpa log: PSB status/delete, santri CRUD/link, HR, kas, settings (perubahan role_menu_permissions TAK KELIHATAN), akademik, wallet, scan, exams-admin. Kualitas: actor 0 massal (S-N15), fire-and-forget di luar tx bisnis (audit bisa hilang/nyasar).

## U. FRONTEND vs BACKEND
- Proof: konsisten nominal/konflik/ownership; gap: method bebas, paid_at bebas, proof_url bebas. PPDB: konsisten format; BE superset permisif (draft-save, ok). Kas: BE & FE sama-sama longgar (amount tanpa cap, category/kind bebas, tanggal regex '2026-13-99' lolos). Nilai: konsisten skala; gap: tanpa audit + tanpa lock periode.

## V. LEGACY (KEEP/DEPRECATE/REMOVE LATER)
- payments legacy: DEPRECATE-writes (jangan drop; backfill dulu). admin role: DEPRECATE-se Gerakan (selesaikan migrasi ATAU hapus dari CHECK/route/menu — jangan auto-rewrite diam). DEV mock: KEEP gated. Gemini fallback: KEEP. Token plaintext: DEPRECATE. TODO Phase 9-10: KEEP. sender apiKey params: KEEP. api.ts /psb/status: VERIFY. check_*.go/debug_*.go/populate/reset di root BE: REMOVE LATER dari image (ikut ke-COPY). .bat/smoke: KEEP (bukan strategi backup).

## W. DEPLOYMENT (risiko)
- Image BE tanpa .dockerignore (telan db/debug/.env); FE berat tanpa standalone/HEALTHCHECK; service systemd "go run" (toolchain+slow); upload split-brain (relatif + 2 target); backup MANUAL .bak (WAL tak ikut = korup; tanpa jadwal/off-host/drill/PITR); migrasi-on-boot + rewrite RBAC ireversibel (rollback = restore); health statis (DB macet tetap OK); tanpa graceful shutdown (SIGTERM di tengah WAL); nginx tanpa TLS block/limit_req/header (asumsi ACME luar); .env.example basi; TZ Bangkok vs UTC.

## X. BACKWARD COMPATIBILITY
- SAFE: klaim JWT aditif + /refresh + TokenVersion; kolom bill aditif; settings keys; QR plaintext (pasca-cek); XFF (hati-hati). NEEDS MIGRATION: retry spp/iuran (seperti payments), UPLOAD_DIR + alias path, token plaintext, admin-role (pilihan semantik). NEEDS DOWNTIME: finalisasi admin-role (BE+FE atomik). NEEDS BACKFILL: payments→ledger. DUAL-READ/WRITE: tak perlu kecuali payments-freeze & kas-policy.

## Y. OLD FINDINGS VERIFICATION (ringkas putusan)
- C1 PII donasi publik: STILL OPEN (donations/handler.go:70-90, repo:99-162, main.go:305). C2 adminID=1: STILL OPEN (:227-230). C3 admin zombie: STILL OPEN (main.go:348, db.go:82+778-781, validator+repo+menu). C4 race Pay: STILL OPEN (spp:353-395, iuran:275-317). C5 MAX()+1: STILL OPEN (spp:648-654, iuran:574-582; retry hanya payments:335-338). C6 cancel drift: STILL OPEN (spp:471-483, iuran:393-405). C7 re-upload reset paid: STILL OPEN (psb repo:278). C8 route /psb/me ganda: STILL OPEN (main.go:356 + 376-379). C9 hapus tanpa guard: STILL OPEN (santri repo:147-150/214-231, hr:98-101; FK 500 mentah). C10 WA ke nomor santri: STILL OPEN (attendance/handler.go:75-88, repo:123-127). C11 predikat: STILL OPEN + TERBUKTI DI DATA (engine.go:101-112, raport repo:112-117, raport live #1 "Sangat Baik" 82.58).
- HIGH lama: PPDB #1/#2/#3/#4/#7/#8/#10/#11/#13/#17/#18/#19/#20 OPEN; #6 FIXED-caveat (guard handler:435-438 + FE, TOCTOU sisa); #12 mock HILANG tapi error-null PARTIAL; #16 PARTIAL (batas atas ada, tanpa cek fee). Santri #1 PARTIAL (single 409 vs bulk silent), #2/#4/#10/#11/#12/#13/#15/#16/#17/#18/#22/#23/#24 OPEN, #25 ok-by-design. SPP #3/#4/#5/#7/#8/#10/#11/#12/#13/#14/#15/#16/#17/#18/#19/#21 OPEN; #20 PARTIAL (JWT ada tapi risiko 0 + C2); #1/#9 UNVERIFIABLE-DEF (definisi tak ada di repo; kelas masalahnya ada). Donasi #10-#17 PARTIAL (verify-DB idempoten tapi WA ganda dkk). Akademik #18-#23 OPEN kecuali bobot-mapel 50/25/25 = NOT-REPRO (seragam 30/40/30).

## Z. NEW FINDINGS (di luar 95 lama; ID unik)
- S-N1 HIGH proof_url tanpa validasi (spp/handler.go:464-476, iuran mirror) — XSS/phishing tersimpan. S-N2 MED exam enumerable (exams/handler.go:31-46). S-N3 HIGH bukti publik (main.go:424-425 + upload:131-165). S-N4 MED webp mentah (upload:221-223). S-N5 HIGH tanpa revokasi (middleware:29-77, handler:305-312). S-N6 MED role basi 24 jam. S-N7 MED cookie token legacy (middleware.ts:5-9). S-N8 MED mass assignment (santri:173-195, exams, academics, project). S-N9 MED-HIGH rate-limit IP salah (ratelimit.go:96-102). S-N10 MED throttle hilang endpoint bernilai. S-N11 MED PIN in-memory (wallet:23-68). S-N12 MED err mentah ke klien (raport:103-108, wallet:219/300). S-N13 HIGH verify-tanpa-log + adminID=1. S-N14 LOW-MED 3 lubang kecil (news //evil sanitize.go:167; tanggal regex kas:17/spp; float64 wallet + ReferenceID deterministik). S-N15 MED actor=0 massal (kas:25-32, spp:68-75, payments:279-284 — assert map vs MapClaims).
- M-N1 CRIT oracle+leak SubmitProof (spp:429-438). M-N2 CRIT approve tanpa cek sisa (spp:451-468). M-N3 HIGH paid_at klien (handler:330). M-N4 HIGH verify-vs-paid (butuh guard RowsAffected). M-N5 HIGH MyLedger cap 50 (payments:397-403). M-N6 HIGH ListPayTx tanpa COUNT + GetAll in-memory. M-N7 HIGH kind bypass kategori (kas handler:81-100). M-N8 MED status basi UpdateBill. M-N9 MED DeleteBill telan pending. M-N10 MED CombinedReport N+2. M-N11 MED goroutine tangkap *Request (spp:435-449). M-N12 LOW UNIQUE('') ledger (spp:608-617). M-N13 LOW pad6 tabrakan. M-N14 LOW periode iuran bebas.
- R1 CRIT dobel-Pay; R2 HIGH verify-vs-pay; R3 CRIT cancel-vs-pay; R4 HIGH retry; R5 HIGH MAX()+1; R6 HIGH proof-vs-pay.
- P-N1 LOW shadow route santri; P-N2 HIGH UpdateEmployee nol validasi (hr:87-99); P-N3 MED amount=1; P-N4 MED host jahat; P-N5 MED error-null; P-N6 LOW filename enumerable; P-N7 LOW search FE-only.
- D1 HIGH PII (=C1 sisi baru: LIKE enumerasi); D2 MED verified_by (=C2); D3 MED WA ganda; D4 MED yatim campaign; D5 MED fiktif; D6 LOW amount; D7 LOW lock-handler; D8 INFO dead code. A1 HIGH predikat (=C11); A2 HIGH UNIQUE hilang + CBT gagal diam; A3 HIGH preview-save; A4 HIGH lock; A5 MED IDOR; A6 MED semester; A7 MED KKM; A8 INFO placeholder; A9 LOW sesi; A10 LOW points; A11 LOW tanggal. B1 HIGH QR-dedup; B2 HIGH nomor salah (=C10); B3 MED plaintext; B4 MED TZ; B5 MED ghost fingerprint; B6 LOW teacher. W1 HIGH broadcast salah-sumber/spam; W2 MED stale-context; W3 MED blocking; W4 LOW signature. U1 HIGH serve publik (=S-N3 sisi upload); U2 MED URL bebas; U3 MED webp (=S-N4); U4 LOW tanpa PDF; U5 LOW gallery eksternal; U6 INFO kontrol baik.
- API #1 HIGH FAQ/agenda any-auth (main.go:200-215); #2 HIGH PII (=C1); #3 MED direktori staf; #4 MED uploads (=U1); #5 MED logout (=S-N5); #6 MED exam (=S-N2); #7 MED PIN reset (=S-N10/11); #8 MED ownership-di-repo; #9 LOW-MED role validator; #10 LOW-MED zombie; #11 LOW-MED HR over-grant; #12 LOW privesc laten auth.Routes:583-589; #13 LOW AI+broadcast tanpa limit; #14 INFO dead Routes; #15 INFO mock DEV.

## MASTER FINDINGS TABLE (ID | Sev | Domain | Finding | RootCause | File:Line | DB | API | DataRisk | FixRisk | Migr | Down)
- C1 | CRIT | Donasi | PII donatur publik | route tanpa auth + DTO penuh | donations/handler.go:70, main.go:305 | donations | GET /donations | TINGGI | rendah | tidak | tidak
- C4/R1 | CRIT | SPP | Dobel-Pay konkuren | DEFERRED check-then-act | spp/repo:353-395 | spp_bills/paytx/receipts | POST pay | TINGGI | sedang | tidak | tidak
- R3/C6 | CRIT | Ledger | Cancel orphan-kan ledger | tanpa reversal | spp/repo:471-483 | paytx/receipts | POST cancel | TINGGI | sedang | tidak | tidak
- M-N2 | CRIT | SPP | Approve tanpa cek sisa | validasi amount<=0 saja | spp/repo:451-468 | spp_bills | POST verify | TINGGI | rendah | tidak | tidak
- API#1 | HIGH | CMS | FAQ/agenda tulis any-auth | tanpa RequireRole | main.go:200-215 | faqs/agendas | POST/PUT/DEL | SEDANG | rendah | tidak | tidak
- S-N3/U1 | HIGH | Upload | Bukti privat serve publik | FileServer tanpa auth | main.go:424-425 | - | GET /uploads/* | TINGGI | sedang | YA(alias) | tidak
- S-N15 | HIGH | Audit | Actor=0 massal | assert map vs MapClaims | kas:25-32 spp:68-75 | kas/paytx | semua tulis | TINGGI(forensik) | rendah | tidak | tidak
- S-N13 | HIGH | Audit | Verify uang tanpa log + by=1 | tanpa RecordActivity + hardcode | donations:227-252 spp:492-518 | activity_logs | verify* | TINGGI | rendah | tidak | tidak
- A1/C11 | HIGH | Akademik | Predikat salah massal | skala 1-4 utk 0-100 | weight/engine.go:101-112 raport/repo:112-117 | raports#1 live | GET raport | SEDANG | rendah | YA(koreksi label) | tidak
- A2 | HIGH | Akademik | Tanpa UNIQUE + CBT gagal diam | skema + _,_= | db.go:314-339 exams/repo:226-230 | grades/attendance | exams finish | SEDANG | sedang | YA | tidak
- B1 | HIGH | Absensi | QR dobel tanpa UNIQUE | guard tanpa backing | attendance/repo:59-121 | attendance | POST scan | SEDANG | sedang | YA | tidak
- S-N9 | MED-HIGH | Infra | Rate-limit IP global | RemoteAddr di blk nginx | ratelimit.go:96-102 | - | /login dkk | SEDANG(av) | sedang | YA | tidak
- C2 | MED | Donasi | verified_by=1 | hardcode | donations:227-230 | donations | PUT verify | SEDANG | rendah | tidak | tidak
- C3 | MED | Auth | Role admin zombie | migrasi vs CHECK/route/menu | db.go:778-781 main.go:348 | users | - | SEDANG | sedang | YA | YA(atomik)
- C5/R5 | HIGH | Receipt | MAX()+1 tanpa retry | read-then-insert | spp:648-654 | receipts | pay | SEDANG | sedang | YA(seq) | tidak
- C7 | MED | PPDB | Re-upload reset paid | unconditional | psb/repo:278 | registrations | PUT payment | SEDANG | rendah | tidak | tidak
- C8 | MED | PPDB | Route /psb/me ganda | dua grup role | main.go:356+376-379 | registrations | /psb/me | SEDANG | rendah | tidak | tidak
- C9 | MED | Data | Hapus tanpa guard | tanpa pre-check | santri:147-150 hr:98-101 | spp/iuran/att | DELETE | SEDANG | rendah | tidak | tidak
- C10/B2 | HIGH | Absensi | WA ke nomor santri | users.whatsapp | attendance:75-88 | users/santri | POST scan | SEDANG | rendah | tidak | tidak
- S-N1 | HIGH | SPP | proof_url bebas | tanpa ValidateMediaURL | spp/handler:464-476 | spp_bills | proof | SEDANG | rendah | tidak | tidak
- S-N5 | HIGH | Auth | Tanpa revokasi | sig+exp saja | middleware:29-77 | users | /logout | SEDANG | sedang | YA(ver) | tidak
- S-N8 | MED | Data | Mass assignment | decode ke model | santri:173-195 | santri | POST/PUT | SEDANG | rendah | tidak | tidak
- A3 | HIGH | Raport | Preview vs save | bobot diabaikan | raport/handler:50-108 | raports | POST save | SEDANG | rendah | tidak | tidak
- A4 | HIGH | Raport | Lock tak dienforce | Upsert tanpa cek | raport/repo:255-272 | raports | POST save | SEDANG | rendah | tidak | tidak
- D4 | MED | Donasi | Hapus campaign yatim | tanpa guard | donations repo:382-385 | donations | DELETE | SEDANG | rendah | tidak | tidak
- W1 | HIGH | WA | Broadcast salah/spam | sumber legacy + tanpa agregat | notifications/repo:43-119 | payments/users | broadcast* | RENDAH | sedang | tidak | tidak
- (MED/LOW lain: S-N2/N4/N6/N7/N10/N11/N12/N14, M-N3..N14, P-N1..N7, A5..A11, B3..B6, W2..W4, U2..U5, API#3..#15 — detail di seksi masing-masing.)

## MASTER REMEDIATION PLAN (tanpa implementasi; pola per finding)
- PII/serve: CURRENT publik → TARGET auth+mask/signed-URL → CHANGE guard + proyeksi + serve authed → FILES donations/handler+main, upload serve → TEST skrap anonim 403 + pemilik 200 → MIGRASI alias path → ROLLBACK revert.
- Uang: CURRENT DEFERRED check-act → TARGET IMMEDIATE + UPDATE-bersyarat + RowsAffected + idempotency_key UNIQUE + sequence receipt + reversal-cancel → FILES spp/iuran/payments repos+handlers → TEST sekuens ganda (non-prod) → MIGRASI kolom kunci/sequence → ROLLBACK restore.
- Auth: CURRENT 24h tanpa revokasi → TARGET version+refresh → FILES auth handler/middleware + users.token_version → TEST token lama ditolak → MIGRASI kolom default 0 → ROLLBACK dual-accept.
- Akademik: CURRENT skala-salah/tanpa-UNIQUE/lock-semu → TARGET Predikat100 + UNIQUE + lock-enforce + bobot-disimpan → FILES engine/raport/academics/migrasi → TEST raport live terkoreksi label → MIGRASI label+index (backfill label lama ditandai).
- Identitas: CURRENT 3 master + userless → TARGET link-user wajib saat santri-aktif + unlink + NIK unik → FILES santri/psb/db → TEST portal wali → MIGRASI backfill user_id (manual, hati-hati).
- Operasional: backup sqlite3 .backup terjadwal + off-host + drill; .dockerignore; UPLOAD_DIR absolut; health-vs-DB; graceful shutdown; header+CSP+limit_req nginx; XFF tepercaya; PIN persisten; err generik; audit VERIFY_* + jangan hapus activity.

## TOP 10 RISIKO PRODUCTION
1. Uang ganda via race (R1-R4,M-N2). 2. Drift cancel permanen (C6/R3). 3. PII + bukti publik (C1,S-N3). 4. Deface anonim (API#1). 5. Verify tanpa jejak (S-N13). 6. Actor=0 (S-N15). 7. Lockout login massal (S-N9). 8. Predikat salah massal (C11 live). 9. Backup korup (WAL). 10. academic_years kosong + rewrite role tiap boot.

## TOP 20 FIX PRIORITY
1 FAQ/agenda RequireRole. 2 Mask/auth /donations. 3 Serve /uploads proofs authed. 4 CurrentUserID donasi + VERIFY_* logs. 5 Perbaiki assert actor (S-N15). 6 BEGIN IMMEDIATE + guard RowsAffected + idempotency. 7 Cancel reversal rows. 8 Retry/sequence receipt spp/iuran. 9 Validasi proof/method/date + allowlist /uploads. 10 Re-validasi pending≤sisa di approve. 11 Urutan route /psb/me + guard hapus 409. 12 Tolak upload-bila-paid (BE) + state machine PSB + NIK unik. 13 Predikat100 + UNIQUE grades/attendance + lock-enforce + bobot-save. 14 WA parent + sumber broadcast + agregat. 15 WebP re-encode + nama acak. 16 XFF tepercaya + limit_req + throttle endpoint bernilai. 17 Revokasi/version + PIN persisten + PIN-lama. 18 Err generik + CSP/header. 19 .dockerignore + backup .backup + health-DB + shutdown. 20 Finalisasi admin-role + link-user + backfill payments.

## SAFE REMEDIATION ORDER
- PHASE 0 Backup & prep: .backup + off-host + drill restore; kunci DEV_MODE=false; catat BUILD_ID/image; DEPENDENSI: semua phase.
- PHASE 1 Security P0: #1-5 di atas (role-guard, PII, serve, actor, verify-log). DEPENDENSI: hanya backup.
- PHASE 2 Financial integrity: #6-10 (IMMEDIATE, reversal, sequence, proof-validation). DEPENDENSI: PHASE 0; bareng audit-log agar uang terpantau.
- PHASE 3 PPDB integrity: #11-12. DEPENDENSI: PHASE 1 (auth jelas dulu).
- PHASE 4 Identity/data: #finalisasi admin-role, link-user/unlink/NIK-unik, guard hapus, backfill payments→ledger (dual-read dulu). DEPENDENSI: PHASE 1-2.
- PHASE 5 Academic: #13 + KKM/semester/year-kanonik (academic_years diisi dulu). DEPENDENSI: PHASE 4 (ownership jelas).
- PHASE 6 Operational/WA: #14-18 (WA parent/sumber, upload, XFF/limit, revokasi, header). DEPENDENSI: PHASE 1.
- PHASE 7 Cleanup: #19-20 + dead Routes/scripts + docs settings keys. DEPENDENSI: semua; tanpa downtime kecuali finalisasi role.`;

export default function AuditGptPage() {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = report;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <PublicLayout>
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950 py-12 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-sky-950 to-slate-950" />
        <div className="relative mx-auto max-w-6xl px-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-sky-200">
            <Shield size={14} /> Master Audit Ulang
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">MASTER AUDIT ULANG PRODUCTION</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Read-only 2026-09-14: 49 tabel live + seluruh endpoint + 6 audit paralel. C1–C11 semua masih terbuka. ±60 temuan baru.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-900">C1–C11: 11/11 open</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black text-white">Baru ±60</span>
            <button onClick={handleCopy} className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-black text-white hover:bg-emerald-600">
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Tersalin!' : 'Copy Audit'}
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rose-700"><AlertTriangle size={14} /> Kritis ±8</p>
              <p className="mt-1 text-xs text-rose-700">Race uang, PII, deface, actor-0</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-700"><Shield size={14} /> High ±40</p>
              <p className="mt-1 text-xs text-amber-700">Verify tanpa log, lock, receipt</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700"><Search size={14} /> Med/Low ±100</p>
              <p className="mt-1 text-xs text-slate-600">Validasi, enum, drift, legacy</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700"><Eye size={14} /> Data live</p>
              <p className="mt-1 text-xs text-emerald-700">0 orphan, 0 duplikat, 37 index</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/" className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-bold text-white">Beranda</Link>
            <Link href="/audit-full" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700">Audit 2026-09-13</Link>
            <button onClick={handleCopy} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700">
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />} Copy Full Report
            </button>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-700"><Database size={16} /> Laporan Lengkap A–Z</h2>
              <button onClick={handleCopy} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-black text-white">
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Tersalin' : 'Copy'}
              </button>
            </div>
            <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-6 text-xs leading-6 text-slate-100">{report}</pre>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700"><Shield size={14} /> Metode</p>
              <p className="mt-2 text-xs leading-6 text-slate-600">6 audit paralel + SELECT-only DB live. Tanpa ubah kode, data, config, migration, restart.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700"><Database size={14} /> Verifikasi lama</p>
              <p className="mt-2 text-xs leading-6 text-slate-600">C1–C11: 11/11 masih terbuka dengan bukti file:line + bukti data (raport #1).</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700"><Zap size={14} /> Tanpa fix</p>
              <p className="mt-2 text-xs leading-6 text-slate-600">Laporan dulu, remediasi bertahap PHASE 0–7. Tidak ada kode yang diubah.</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
