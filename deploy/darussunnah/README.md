# Alma Parung VPS Deploy

This folder contains the Docker Compose and nginx snippets used to deploy the
Next.js frontend and Go backend for `almaparung.com`.

Expected persistent data paths beside `docker-compose.yml`:

- `./data/alma.db`
- `./data/alma.db-wal`
- `./data/alma.db-shm`
- `./data/uploads/`

The backend mounts the whole `./data` directory into `/data` so SQLite WAL/SHM
sidecar files stay in sync with the main database file.

Required environment file:

- `./.env`
