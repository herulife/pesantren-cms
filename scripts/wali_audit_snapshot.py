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


def digits(value):
    if value is None:
        return ""
    return re.sub(r"\D", "", str(value))


def main():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row

    def one(sql):
        return con.execute(sql).fetchone()[0]

    def rows(sql):
        return con.execute(sql).fetchall()

    total_santri = one("SELECT COUNT(*) FROM santri")
    linked = one("SELECT COUNT(*) FROMiba WHERE user_id IS NOT NULL".replace("iba", "santri"))
    total_users = one("SELECT COUNT(*) FROM users")
    role_user = one("SELECT COUNT(*) FROM users WHERE role='user'")
    linked_wali = one(
        "SELECT COUNT(*) FROM users u WHERE u.role='user' "
        "AND EXISTS (SELECT 1 FROMOG s WHERE s.user_id = u.id)".replace("OG", "santri")
    )
    orphans = one(
        "SELECT COUNT(*) FROM users u WHERE u.role='user' "
        "AND NOT EXISTS (SELECT 1 FROMOG s WHERE s.user_id = u.id)".replace("OG", "santri")
    )
    phone_rows = rows(
        "SELECT id, nis, name, class, COALESCE(parent_phone,'') AS pp FROMBridge ORDER BY name".replace(
            "Bridge", "santri"
        )
    )

    print("=== SNAPSHOT DB (WAL-aware, read-only) ===")
    print("total users          :", total_users)
    print("role=user            :", role_user)
    for r in rows("SELECT role, COUNT(*) n FROM users GROUP BY role ORDER BY n DESC"):
        print("   role %-14s %s" % (r["role"], r["n"]))
    print("total Santri         :", total_santri)
    print("santri tertaut akun  :", linked)
    print("santri tanpa akun    :", total_santri - linked)
    print("akun wali tertaut    :", linked_wali)
    print("akun user yatim      :", orphans)

    groups = defaultdict(list)
    no_phone = []
    for r in phone_rows:
        key = digits(r["pp"])
        if key:
            groups[key].append((r["id"], r["nis"], r["name"], r["class"]))
        else:
            no_phone.append((r["id"], r["nis"], r["name"], r["class"]))

    print("parent_phone terisi  :", sum(len(v) for v in groups.values()))
    print("parent_phone kosong  :", len(no_phone))
    print("no. telp unik        :", len(groups))

    print("")
    print("=== KELUARGA SAUDARA (>1 Santri per nomor) ===")
    multi = 0
    for key, members in sorted(groups.items()):
        if len(members) > 1:
            multi += 1
            print("  telp ...%s ->" % key[-4:])
            for m in members:
                print("     id=%-4s nis=%-12s %-26s (%s)" % m)
    print("total keluarga saudara:", multi)
    print("ESTIMASI AKUN WALI    :", len(groups) + len(no_phone), "(keluarga + satuan tanpa telp)")

    print("")
    print("=== SANTRI TANPA NO. TELFON WALI ===")
    for m in sorted(no_phone, key=lambda x: x[2]):
        print("  id=%-4s nis=%-12s %-26s (%s)" % m)

    print("")
    print("=== NAMA SANTRI DUPLIKAT (cek manual) ===")
    counts = Counter(r["name"].strip().lower() for r in phone_rows)
    for name, n in sorted(counts.items()):
        if n > 1:
            print("  %s x%d" % (name, n))

    print("")
    print("=== DATA-WALI.CSV ===")
    if not os.path.exists(CSV_PATH):
        print("  (tidak ditemukan)")
    else:
        with open(CSV_PATH, newline="", encoding="utf-8-sig") as fh:
            crows = [r for r in csv.DictReader(fh) if any((v or "").strip() for v in r.values())]
        print("  baris data         :", len(crows))
        print("  kolom              :", list(crows[0].keys()) if crows else "-")
        print("  nama_wali kosong   :", sum(1 for r in crows if not (r.get("nama_wali") or "").strip()))
        print("  email_wali terisi  :", sum(1 for r in crows if (r.get("email_wali") or "").strip()))
        db_nis = set()
        for r in phone_rows:
            db_nis.add(digits(r["nis"])[-6:])
        matched = 0
        unmatched = []
        for r in crows:
            if digits(r.get("nis"))[-6:] in db_nis:
                matched += 1
            else:
                unmatched.append((r.get("nis"), r.get("nama_santri")))
        print("  NIS cocok ke DB    :", matched)
        print("  NIS tidak cocok    :", len(unmatched))
        for nis, nm in unmatched[:15]:
            print("     -", nis, nm)

    con.close()


if __name__ == "__main__":
    main()