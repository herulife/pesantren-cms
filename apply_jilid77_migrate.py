#!/usr/bin/env python3
"""
apply_jilid77_migrate.py
Migrasi attendance.student_id dari users.id (akun wali) -> santri.id.

Alasan
------
Sejak Jilid 76 satu akun portal (wali) bisa memiliki beberapa Santri, sehingga
menyimpan presensi di level akun wali membuat dua saudara memakai ID yang sama.
Tabel `attendance` karena itu dibangun ulang dengan FK ke `santri(id)` dan
UNIQUE(student_id, date) agar satu Santri punya satu baris per tanggal.

Cara pakai
----------
  python3 apply_jilid77_migrate.py --dry-run     # simulasi, tanpa menulis
  python3 apply_jilid77_migrate.py --apply       # eksekusi + backup otomatis

Idempoten: dicatat di schema_migrations sebagai `attendance_student_santri_v1`.
"""

import argparse
import os
import sqlite3
import sys
import time

FLAG = "attendance_student_santri_v1"


def default_db():
    """Cari data/alma-parung.db di lokasi skrip lalu di direktori kerja."""
    here = os.path.dirname(os.path.abspath(__file__))
    for base in (here, os.getcwd()):
        candidate = os.path.join(base, "data", "alma-parung.db")
        if os.path.exists(candidate):
            return candidate
    return os.path.join(os.getcwd(), "data", "alma-parung.db")


def log(msg):
    print(msg, flush=True)


def build_map(conn):
    """users.id -> Santri.id untuk setiap akun yang punya presensi.

    Presensi lama disimpan per akun portal, padahal satu akun bisa punya
    beberapa Santri (sejak Jilid 76). Karena tiap akun punya tepat satu record
    per tanggal, dan tiap Santri harus terpetakkan ke tepat satu akun,
    pencarian dilakukan bertahap:

      1. akun dengan tepat 1 Santri  -> langsung dipakai
      2. akun tanpa Santri tertaut  -> dicocokkan lewat nama akun = nama Santri
      3. sisa akun                 -> Assignment lewat eliminasi: anak yang sudah
                                      dipakai akun lain dikeluarkan; bila
                                      tinggal 1 kandidat, itu pasti jawabannya.
      4. masih >1 kandidat         -> ambil id terkecil dan tandai ambigu.

    Mengembalikan (mapping, ambiguous, unmapped, notes).
    """
    mapping = {}
    ambiguous = []
    unmapped = []
    notes = []
    claimed = set()

    legacy_ids = [r[0] for r in conn.execute(
        "SELECT DISTINCT a.student_id FROM attendance a ORDER BY a.student_id"
    ).fetchall()]

    # Tahap 1: akun dengan tepat satu Santri.
    multi = []
    for legacy in legacy_ids:
        kids = [r[0] for r in conn.execute(
            "SELECT id FROM Buffer WHERE user_id = ? ORDER BY id".replace("Buffer", "santri"),
            (legacy,),
        ).fetchall()]
        if len(kids) == 1:
            mapping[legacy] = kids[0]
            claimed.add(kids[0])
        elif len(kids) > 1:
            multi.append((legacy, kids))
        else:
            multi.append((legacy, []))

    # Tahap 2: akun tanpa anak tertaut -> cocokkan lewat nama.
    pending = []
    for legacy, kids in multi:
        if kids:
            pending.append((legacy, kids))
            continue
        byname = [r[0] for r in conn.execute(
            "SELECT s.id FROM Buffer s JOIN users u ON u.name = s.name "
            "WHERE u.id = ? ORDER BY s.id".replace("Buffer", "santri"),
            (legacy,),
        ).fetchall()]
        if len(byname) == 1:
            mapping[legacy] = byname[0]
            claimed.add(byname[0])
            notes.append("akun %s -> Santri %s (dicocokkan lewat nama)" % (legacy, byname[0]))
        elif len(byname) > 1:
            mapping[legacy] = byname[0]
            claimed.add(byname[0])
            notes.append("akun %s -> Santri %s (nama ambigu, dipakai yang terkecil)"
                         % (legacy, byname[0]))
        else:
            unmapped.append(legacy)

    # Tahap 3: eliminasi untuk akun yang masih punya lebih dari satu anak.
    for legacy, kids in pending:
        free = [k for k in kids if k not in claimed]
        if len(free) == 1:
            mapping[legacy] = free[0]
            claimed.add(free[0])
            notes.append(
                "akun %s -> Santri %s (eliminasi: anak %s sudah dipakai akun lain)"
                % (legacy, free[0], [k for k in kids if k in claimed and k != free[0]])
            )
        elif len(free) > 1:
            mapping[legacy] = free[0]
            claimed.add(free[0])
            ambiguous.append((legacy, kids, free[0]))
        else:
            mapping[legacy] = kids[0]
            claimed.add(kids[0])
            ambiguous.append((legacy, kids, kids[0]))

    return mapping, ambiguous, unmapped, notes


def already_migrated(conn):
    try:
        row = conn.execute(
            "SELECT COUNT(*) FROM schema_migrations WHERE name = ?", (FLAG,)
        ).fetchone()
        if row and row[0] > 0:
            return True
    except sqlite3.OperationalError:
        pass
    sql = conn.execute(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='attendance'"
    ).fetchone()
    if sql and "santri(id)" in sql[0]:
        return True
    return False


def inspect(conn):
    total = conn.execute("SELECT COUNT(*) FROM attendance").fetchone()[0]
    distinct = conn.execute(
        "SELECT COUNT(DISTINCT student_id) FROM attendance"
    ).fetchone()[0]
    mapping, ambigu, unmapped, notes = build_map(conn)

    mapped_rows = 0
    seen = set()
    cur = conn.execute(
        "SELECT id, student_id, date FROM attendance ORDER BY id"
    )
    conflicts = []
    for rid, legacy, date in cur.fetchall():
        new = mapping.get(legacy)
        if new is None:
            continue
        key = (new, date)
        if key in seen:
            conflicts.append((rid, legacy, new, date))
            continue
        seen.add(key)
        mapped_rows += 1

    log("  total record          : %d" % total)
    log("  legacy user_id unik   : %d" % distinct)
    log("  terpetakan            : %d akun -> %d Santri"
        % (len(mapping), len(set(mapping.values()))))
    log("  record terpetakan     : %d" % mapped_rows)
    log("  record tak terpetakan : %d" % (total - mapped_rows))
    log("  konflik (santri,date) : %d" % len(conflicts))
    log("")
    log("  AMBIGU (pilih anak terkecil, mohon verifikasi manual):")
    for legacy, kids, chosen in ambigu:
        log("    users.id=%s punya %d anak %s -> dipilih Santri.id=%s"
            % (legacy, len(kids), kids, chosen))
    if notes:
        log("")
        log("  CATATAN PEMETAAN:")
        for n in notes:
            log("    %s" % n)
    injectivity = len(set(mapping.values())) == len(mapping)
    log("")
    log("  pemetaan 1-1 (tak ada Santri dipakai 2x): %s" % ("YA" if injectivity else "TIDAK"))
    if unmapped:
        log("  TIDAK TERPETAKAN:")
        for legacy in unmapped:
            name = conn.execute(
                "SELECT name FROM users WHERE id = ?", (legacy,)
            ).fetchone()
            log("    users.id=%s (%s)" % (legacy, name[0] if name else "?"))
    return total, mapped_rows, len(conflicts)


def migrate(conn):
    total = conn.execute("SELECT COUNT(*) FROM attendance").fetchone()[0]
    mapping, ambigu, unmapped, _notes = build_map(conn)

    conn.execute("PRAGMA foreign_keys=OFF")
    conn.execute("DROP TABLE IF EXISTS attendance_j77_tmp")
    conn.execute(
        """
        CREATE TABLE attendance_j77_tmp (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'hadir',
            notes TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES santri(id)
        )
        """
    )

    inserted = 0
    skipped = 0
    cur = conn.execute("SELECT id, student_id, date, status, notes, created_at FROM attendance ORDER BY id")
    for rid, legacy, date, status, notes, created in cur.fetchall():
        new = mapping.get(legacy)
        if new is None:
            skipped += 1
            continue
        try:
            conn.execute(
                "INSERT INTO attendance_j77_tmp (id, student_id, date, status, notes, created_at) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (rid, new, date, status, notes if notes is not None else "", created),
            )
            inserted += 1
        except sqlite3.IntegrityError:
            skipped += 1

    conn.execute("DROP TABLE attendance")
    conn.execute("ALTER TABLE attendance_j77_tmp RENAME TO attendance")
    conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_date "
        "ON attendance(student_id, date)"
    )
    conn.execute(
        "INSERT OR IGNORE INTO schema_migrations (name) VALUES (?)", (FLAG,)
    )
    conn.commit()
    conn.execute("PRAGMA foreign_keys=ON")

    log("  record lama   : %d" % total)
    log("  tersalin      : %d" % inserted)
    log("  dilewati      : %d (tak terpetakan / duplikat)" % skipped)
    return inserted, skipped


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--db", default=None)
    args = ap.parse_args()

    args.db = args.db or default_db()
    if not (args.dry_run or args.apply):
        ap.error("pilih --dry-run atau --apply")
    if not os.path.exists(args.db):
        sys.exit("DB tidak ditemukan: %s" % args.db)

    log("DB  : %s" % args.db)
    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row

    if already_migrated(conn):
        log("SUDAH dimigrasi (flag %s ada). Tidak ada yang dilakukan." % FLAG)
        conn.close()
        return

    log("")
    log("=== RENCANA ===")
    inspect(conn)
    log("")

    if args.dry_run:
        log("DRY RUN - tidak ada perubahan ditulis.")
        conn.close()
        return

    stamp = time.strftime("%Y%m%d-%H%M%S")
    backup = "%s.bak-jilid77-%s" % (args.db, stamp)
    # PENTING: DB jalan dalam mode WAL, jadi shutil.copy2 saja TIDAK cukup -
    # data terbaru masih ada di file -wal. Pakai API backup() agar snapshot
    # konsisten (setara VACUUM INTO).
    snap = sqlite3.connect(backup)
    conn.backup(snap)
    snap.close()
    check = sqlite3.connect(backup)
    integrity = check.execute("PRAGMA integrity_check").fetchone()[0]
    check.close()
    if integrity != "ok":
        sys.exit("Backup TIDAK sehat (integrity_check=%s). Batal." % integrity)
    log("Backup : %s (%d byte, integrity ok)"
        % (backup, os.path.getsize(backup)))
    log("")

    log("=== EKSEKUSI ===")
    inserted, skipped = migrate(conn)

    bad = conn.execute("PRAGMA foreign_key_check").fetchall()
    log("")
    log("=== VERIFIKASI ===")
    log("  baris sekarang        : %d"
        % conn.execute("SELECT COUNT(*) FROM attendance").fetchone()[0])
    log("  sample                 :")
    for r in conn.execute(
        "SELECT a.id, a.student_id, s.name, a.date, a.status "
        "FROM attendance a JOIN santri s ON s.id = a.student_id "
        "ORDER BY a.id LIMIT 5"
    ):
        log("    #%s Santri.id=%s %s %s %s" % (r[0], r[1], r[2], r[3], r[4]))
    orphan = conn.execute(
        "SELECT COUNT(*) FROM attendance a "
        "LEFT JOIN santri s ON s.id = a.student_id WHERE s.id IS NULL"
    ).fetchone()[0]
    log("  orphan (tanpa Santri)  : %d" % orphan)
    log("  pelanggaran FK          : %d" % len(bad))
    conn.close()
    log("")
    log("SELESAI. inserted=%d skipped=%d" % (inserted, skipped))


if __name__ == "__main__":
    main()