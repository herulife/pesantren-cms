# DEPLOYMENT_CURRENT.md — ALMAPARUNG (aktual)

- Container UP: `alma-parung-frontend` (host 3002 -> 3000), `alma-parung-backend`
  (host 8090 -> 8080), restart unless-stopped. Image: BE golang:1.26->alpine
  (EXPOSE 8080, tanpa .dockerignore efektif -> risiko menelan *.db/debug/.env);
  FE node:20 (tanpa output:standalone/HEALTHCHECK). `.dockerignore` baru di root
  (untracked, belum diverifikasi isinya di image).
- Compose: hanya `deploy/darussunnah/docker-compose.yml`. Mapping :3002 tak ada
  di repo. `alma-backend.service` pakai `go run` (butuh toolchain, cold-start
  lambat). Inkonsistensi DB_PATH: compose `/data/alma.db` vs runtime
  `/data/alma-parung.db` (risiko DB ganda — pastikan satu source of truth).
- nginx: belum terverifikasi dari discovery ini (perlu sudo) — dari audit:
  conf darussunnah full-site + benuatech API-only -> 127.0.0.1:8080; tanpa
  limit_req tepercaya, header/CSP belum konsisten.
- Env/secrets: root `.env` (294B); JWT_SECRET wajib (fail-closed ok); prod guard
  COOKIE_SECURE=true, DEV_MODE=false, ALLOWED_ORIGINS tanpa localhost (ok).
  Risiko secret masuk image bila .dockerignore bocor.
- Health: `/health` statis OK tanpa sentuh DB (perlu liveness vs readiness).
  Tanpa graceful shutdown (SIGTERM/SIGINT), tanpa worker WA yang aman dihentikan.
- Backup: manual `cp *.db *.bak-*` (6 file, tidak WAL-safe, tanpa jadwal/retensi/
  off-host/drill). Uploads `data/uploads`, WA session `data/wagate/` belum tentu
  ikut backup. Belum ada BACKUP_RUNBOOK/RESTORE_RUNBOOK.
- TZ: campur Asia/Bangkok vs CURRENT_TIMESTAMP UTC (keputusan: simpan UTC,
  bisnis WIB — SG-03).
- Target (PHASE 1+22): backup `.backup` terjadwal + off-host + drill + runbook;
  satu DB path; secrets luar image; .dockerignore final; standalone+HEALTHCHECK;
  readiness sentuh DB; graceful shutdown; limit_req+XFF tepercaya; header+CSP+TLS;
  log JSON ber-request_id.
