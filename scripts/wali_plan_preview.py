#!/usr/bin/env python3
"""Dry-run plan import akun wali: cek collision email sebelum dieksekusi.

Tidak menulis ke DB. Jalankan:
  python3 scripts/wali_plan_preview.py
"""
import os
import re
import sqlite3
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = os.path.join(ROOT, "data", "alma-parung.db")
TBL = "santri"


def digits(value):
    if value is None:
        return ""
    return re.sub(r"\D", "", str(value))


def main():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    sql = (
        "SELECT id, nis, name, class, user_id, "
        "COALESCE(parent_phone, '') AS pp, COALESCE(parent_name, '') AS pn "
        + "FROM " + TBL + " ORDER BY pp, id"
    )
    rows = list(con.execute(sql))

    existing = {}
    for r in con.execute("SELECT email, id FROM users"):
        existing[(r[0] or "").strip().lower()] = r[1]

    groups = defaultdict(list)
    for r in rows:
        groups[digits(r["pp"])].append(r)

    plan = []
    for key, members in groups.items():
        if key:
            email = "wali%s@almaparung.local" % key[-9:]
        else:
            email = "wali-santri%d@almaparung.local" % min(x["id"] for x in members)
        plan.append((key, email, members))

    emails = [p[1] for p in plan]
    print("planned accounts      :", len(plan))
    print("unique emails         :", len(set(emails)))
    print("internal dupes        :", [e for e, c in Counter(emails).items() if c > 1])
    clash = [(e, existing[e]) for e in emails if e in existing]
    print("clash with existing   :", clash[:12], "count =", len(clash))
    print("all .local domain     :", all(e.endswith("@almaparung.local") for e in emails))

    merged = 0
    no_name = 0
    for key, email, members in plan:
        if len(members) > 1:
            merged += len(members) - 1
        if not any((m["pn"] or "").strip() for m in members):
            no_name += 1
    print("akun jadi yatim       :", merged)
    print("akun tanpa nama wali  :", no_name)

    print("")
    print("=== 5 KELUARGA SAUDARA (hasil import) ===")
    for key, email, members in sorted(plan, key=lambda p: -len(p[2])):
        if len(members) < 2:
            continue
        print("%s" % email)
        for m in members:
            print(
                "   id=%-4s nis=%-12s %-26s (%-10s) wali=%r uid=%s"
                % (m["id"], m["nis"], m["name"], m["class"], m["pn"], m["user_id"])
            )

    print("")
    print("=== 7 AKUN TANPA NO. HP (placeholder) ===")
    for key, email, members in plan:
        if key:
            continue
        m = members[0]
        print(
            "%-42s %-26s wali=%r" % (email, m["name"], m["pn"])
        )

    con.close()


if __name__ == "__main__":
    main()