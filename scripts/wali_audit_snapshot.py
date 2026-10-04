#!/usr/bin/env python3
"""Snapshot data wali + Santri (WAL-aware) untuk planning import wali.

Hanya membaca. Tidak menulis ke DB.
Jalankan: python3 scripts/wali_audit_snapshot.py
"""
import csv
import os
import re
import sqlite3
import sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = os.path.join(ROOT, "data", "alma-parung.db")
CSV_PATH = os.path.join(ROOT, "DATA-WALI.csv")


def digits(value):
    if value is None:
        return ""
    return re.sub(r"\D", "", str(value))


def main():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row

    def one(sql, params=()):
        return con.execute(sql, params).fetchone()[0]

    def allrows(sql, params=()):
        return con.execute(sql, params).fetchall()

    total_santri = one("SELECT COUNT(*) FROM santri")
    linked = one("SELECT COUNT(*) FROM santri WHERE user_id IS NOT NULL")
    unlinked = one("SELECT COUNT(*) FROM(cid dummy)".replace("cid dummy", "santri WHERE user_id IS NULL"))
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

    def has_phone(expr):
        return (
            "parent_phone IS NOT NULL AND "
            "TRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(parent_phone,' ',''),'-',''),'+',''),'(',''),')',''))<>''"
        )

    phone_filled = one("SELECT COUNT(*) FROM santri WHERE " + has_phone(""))
    phone_blank = total_santri - phone_filled
    phone_distinct = one(
        "SELECT COUNT(DISTINCT parent_phone) FROM santri WHERE " + has_phone("")
    )

    print("=== SNAPSHOT DB (WAL-aware, read-only) ===")
    print("total users           :", total_users)
    print("role=user             :", role_user)
    print("role breakdown        :", dict(
        (r[0], r[1]) for r in allrows("SELECT role,COUNT(*) FROM users GROUP BY role ORDER BY 2 DESC")
    ))
    print("total santri          :", total_santri)
    print("santri tertaut akun   :", linked)
    print("santri tanpa akun     :", unlinked)
    print("akun wali tertaut     :", linked_wali)
    print("akun user yatim       :", orphans)
    print("parent_phone terisi   :", phone_filled)
    print("parent_phone kosong   :", phone_blank)
    print("no. telp unik         :", phone_distinct)

    print("\n=== KELUARGA SAUDARA (parent_phone sama, >1 Santri) ===")
    groups = defaultdict(list)
    for r in allrows(
        "SELECT id, nis, name, class, parent_phone FROMérable ORDER BY name".replace("érable", "santri WHERE " + has_phone("") + " ORDER BY name")
    ):
        groups["".join(digits(r["parent_phone"])[-9:])].append(
            (r["id"], r["nis"], r["name"], r["class"])
        )
    multi = 0
    for key, members in groups.items():
        if len(members) > 1:
            multi += 1
            print("  telp ...%s ->" % key[-4:])
            for m in members:
                print("     id=%s nis=%s %s (%s)" % m)
    print("total keluarga saudara:", multi)
    print("total akun keluarga  :", len(groups))

    print("\n=== SANTRI TANPA NO. TELFON WALI (perlu placeholder) ===")
    for r in allrows(
        "SELECT id, nis, name, class FROM wali_kosong ORDER BY name".replace(
            "wali_kosong", "santri WHERE NOT(" + has_phone("") + ") ORDER BY name"
        )
    ):
        print("  id=%-4s nis=%-12s %-28s %s" % (r["id"], r["nis"], r["name"], r["class"]))

    print("\n=== NAMA SANTRI DUPLIKAT (cek manual) ===")
    for name, n in Counter(
        r[0].strip().lower() for r in allrows("SELECT name FROM santri")
    ).items():
        if n > 1:
            print("  %s x%d" % (name, n))

    print("\n=== DATA-WALI.CSV ===")
    if not os.path.exists(CSV_PATH):
        print("  (tidak ditemukan)")
    else:
        with open(CSV_PATH, newline="", encoding="utf-8-sig") as fh:
            rows = [r for r in csv.DictReader(fh) if any((v or "").strip() for v in r.values())]
        print("  baris data          :", len(rows))
        print("  kolom               :", list(rows[0].keys()) if rows else "-")
        blank_name = sum(1 for r in rows if not (r.get("nama_wali") or "").strip())
        print("  nama_wali kosong     :", blank_name)
        print("  email_wali terisi    :", sum(1 for r in rows if (r.get("email_wali") or "").strip()))

        by_nis = {}
        for r in allrows("SELECT id, nis, name FROM santri"):
            by_nis[digits(r["nis"])[-6:]] = r
        matched = unmatched = 0
        nis_sample = []
        for r in rows:
            key = digits(r.get("nis"))[-6:]
            if key in by_nis:
                matched += 1
            else:
                unmatched += 1
                nis_sample.append((r.get("nis"), r.get("nama_santri")))
        print("  NIS cocok ke DB      :", matched)
        print("  NIS tidak cocok      :", unmatched)
        if nis_sample:
            for nis, nm in nis_sample[:10]:
                print("     -", nis, nm)

    con.close()


if __name__ == "__main__":
    sys.exit(main())