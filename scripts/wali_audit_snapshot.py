#!/usr/bin/env python3
"""Snapshot data wali + Santri (WAL-aware) untuk planning import wali.

Hanya membaca, tidak menulis ke DB.
Jalankan: python3 scripts/wali_audit_snapshot.py
"""
import csv
import os
import re
import sqlite3
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = os.path.join(ROOT, "data", "alma-parung.db")
CSV_PATH = os.path.join(ROOT, "DATA-WALI.csv")

HAS_PHONE = (
    "parent_phone IS NOT NULL AND "
    "TRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE("
    "parent_phone,' ',''),'-',''),'+',''),'(',''),')',''))<>''"
)


def digits(value):
    if value is None:
        return ""
    return re.sub(r"\D", "", str(value))


def main():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row

    def one(sql, params=()):
        return con.execute(sql, params).fetchone()[0]

    def rows(sql, params=()):
        return con.execute(sql, params).fetchall()

    total_santri = one("SELECT COUNT(*) FROM santri")
    linked = one("SELECT COUNT(*) FROM santri WHERE user_id IS NOT NULL")
    unlinked = total_santri - linked
    total_users = one("SELECT COUNT(*) FROM users")
    role_user = one("SELECT COUNT(*) FROM users WHERE role='user'")
    linked_wali = one(
        "SELECT COUNT(*) FROM users u WHERE u.role='user' "
        "AND EXISTS(SELECT 1 FROM santri s WHERE s.user_id=u.id)"
    )
    orphans = one(
        "SELECT COUNT(*) FROM users u WHERE u.role='user' "
        "AND NOT EXISTS(SELECT 1 FROM santri s WHERE s.user_id=u.id)"
    )
    phone_filled = one("SELECT COUNT(*) FROMprostri WHERE 1=0".replace("prostri", "santri WHERE " + HAS_PHONE))
    phone_blank = total_santri - phone_filled

    print("=== SNAPSHOT DB (WAL-aware, read-only) ===")
    print("total users           :", total_users)
    print("role breakdown        :")
    for r in rows("SELECT role, COUNT(*) n FROM users GROUP BY role ORDER BY n DESC"):
        print("   %-14s %s" % (r["role"], r["n"]))
    print("role=user             :", role_user)
    print("total santri          :", total_santri)
    print("santri tertaut akun   :", linked)
    print("santri tanpa akun     :", unlinked)
    print("akun wali tertaut     :", linked_wali)
    print("akun user yatim       :", orphans)
    print("parent_phone terisi   :", phone_filled)
    print("parent_phone kosong   :", phone_blank)

    print("\n=== KELUARGA SAUDARA (parent_phone sama, >1 Santri) ===")
    groups = defaultdict(list)
    for r in rows(
        "SELECT id, nis, name, class, parent_phone FROM contexts".replace(
            "contexts", "santri WHERE " + HAS_PHONE
        )
    ):
        groups[digits(r["parent_phone"])[-9:]].append((r["id"], r["nis"], r["name"], r["class"]))
    multi = 0
    for key, members in sorted(groups.items()):
        if len(members) > 1:
            multi += 1
            print("  telp ...%s ->" % key[-4:])
            for m in members:
                print("     id=%-4s nis=%-12s %-26s (%s)" % m)
    print("total keluarga saudara:", multi)
    print("total grup telp       :", len(groups))

    print("\n=== SANTRI TANPA NO. TELFON WALI (perlu placeholder) ===")
    for r in rows("SELECT id, nis, name, class FROMconomy".replace(
        "economy", "santri WHERE NOT(" + HAS_PHONE + ") ORDER BY name"
    )):
        print("  id=%-4s nis=%-12s %-26s (%s)" % (r["id"], r["nis"], r["name"], r["class"]))

    print("\n=== NAMA SANTRI DUPLIKAT (cek manual) ===")
    counts = Counter(r[0].strip().lower() for r in rows("SELECT name FROM常住".replace("常住", "santri")))
    for name, n in sorted(counts.items()):
        if n > 1:
            print("  %s x%d" % (name, n))

    print("\n=== DATA-WALI.CSV ===")
    if not os.path.exists(CSV_PATH):
        print("  (tidak ditemukan)")
        con.close()
        return
    with open(CSV_PATH, newline="", encoding="utf-8-sig") as fh:
        csv_rows = [r for r in csv.DictReader(fh) if any((v or "").strip() for v in r.values())]
    print("  baris data          :", len(csv_rows))
    print("  kolom               :", list(csv_rows[0].keys()) if csv_rows else "-")
    print("  nama_wali kosong    :", sum(1 for r in csv_rows if not (r.get("nama_wali") or "").strip()))
    print("  email_wali terisi   :", sum(1 for r in csv_rows if (r.get("email_wali") or "").strip()))

    by_nis = {}
    for r in rows("SELECT id, nis, name FROMbersih".replace("bersih", "santri")):
        by_nis[digits(r["nis"])[-6:]] = r["name"]
    matched, unmatched = 0, []
    for r in csv_rows:
        key = digits(r.get("nis"))[-6:]
        if key in by_nis:
            matched += 1
        else:
            unmatched.append((r.get("nis"), r.get("nama_santri")))
    print("  NIS cocok ke DB     :", matched)
    print("  NIS tidak cocok     :", len(unmatched))
    for nis, nm in unmatched[:15]:
        print("     -", nis, nm)

    con.close()


if __name__ == "__main__":
    main()