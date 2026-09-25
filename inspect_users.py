import sqlite3
db = sqlite3.connect("alma-parung.db")
print("audit cols:", [c[1] for c in db.execute("PRAGMA table_info(audit_logs)")])
print()
print("=== audit logs mentioning DELETE / users 36/44 ===")
rows = db.execute(
    "SELECT * FROM audit_logs WHERE action LIKE '%DELETE%' OR entity_id IN ('36','44') ORDER BY id DESC LIMIT 20"
).fetchall()
for r in rows:
    print(r)
print()
print("=== rows referencing user 36/44 ===")
tables = [
    "payments", "registrations", "activity_logs", "notifications", "otp_codes",
    "messages", "wa_notifications", "spp_bills", "iuran_bills", "invoices",
    "receipts", "psb_payments", "user_wallets", "user_qr_tokens",
    "student_points", "violation_logs", "grades", "attendance",
    "tahfidz_progress", "kesantrian_aspek", "raports", "exam_sessions",
]
for t in tables:
    try:
        cols = [c[1] for c in db.execute(f"PRAGMA table_info({t})")]
        uid = [c for c in cols if "user" in c.lower() and "id" in c.lower()]
        for c in uid:
            n = db.execute(f"SELECT count(*) FROM {t} WHERE {c} IN (36,44)").fetchone()[0]
            if n:
                print(f"{t}.{c}: {n}")
    except Exception as e:
        print(t, "err", e)