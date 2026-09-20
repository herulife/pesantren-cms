#!/usr/bin/env python3
"""Smoke NIK duplikat (PRD 55) - jalan DI DALAM VPS terhadap 127.0.0.1:8090.
register 2 user -> login -> PUT biodata nik SAMA -> A=200, B=409 -> DB count==1 -> cleanup.
Rute: POST /api/register, POST /api/login, PUT /api/psb/me (Bearer krn cookie alma_token Secure).
"""
import http.cookiejar, json, random, re, sqlite3, sys, urllib.request, urllib.error

B = "http://127.0.0.1:8090"
DBPATH = "/home/heru/alma-parung/data/alma-parung.db"
PASS = "Tes123456"
R = random.randint(100000, 999999)
NIK = "3203121010990001"
EA, EB = "nikx.a%d@test.local" % R, "nikx.b%d@test.local" % R

class Client:
    def __init__(self):
        self.cj = http.cookiejar.CookieJar()
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cj))
        self.token = None
    def req(self, method, path, payload=None):
        data = json.dumps(payload).encode() if payload is not None else None
        r = urllib.request.Request(B + path, data=data, method=method)
        r.add_header("Content-Type", "application/json")
        if self.token:
            r.add_header("Authorization", "Bearer " + self.token)
        try:
            with self.op.open(r, timeout=20) as resp:
                st, body, hdrs = resp.status, resp.read().decode(), resp.headers
        except urllib.error.HTTPError as e:
            st, body, hdrs = e.code, e.read().decode(), e.headers
        for c in (hdrs.get_all("Set-Cookie") or []):
            m = re.search(r"alma_token=([^;]+)", c)
            if m:
                self.token = m.group(1)
        return st, body

def register(c, email):
    return c.req("POST", "/api/register",
                 {"name": "Tes Nik %d" % R, "email": email, "password": PASS})

def login(c, email):
    return c.req("POST", "/api/login", {"email": email, "password": PASS})

def biodata(c):
    return c.req("PUT", "/api/psb/me", {
        "full_name": "Tes Nik %d" % R, "nickname": "nik", "gender": "L",
        "nik": NIK, "birth_place": "Jakarta", "birth_date": "2011-09-01",
        "address": "Jl Uji 1", "father_name": "Ayah Uji", "father_job": "Wiraswasta",
        "father_phone": "081234567890", "mother_name": "Ibu Uji", "mother_job": "IRT",
        "mother_phone": "081234567891", "school_origin": "SDN 01",
        "program_choice": "tahfidz", "jenjang": "smp", "category": "reguler"})

A, Bc = Client(), Client()
ra, _ = register(A, EA)
rb, _ = register(Bc, EB)
la, _ = login(A, EA)
lb, _ = login(Bc, EB)
sta, bodyA = biodata(A)
stb, bodyB = biodata(Bc)

c = sqlite3.connect(DBPATH)
count = c.execute("SELECT COUNT(*) FROM registrations WHERE TRIM(nik)=?", (NIK,)).fetchone()[0]

ok = (sta == 200 and stb == 409 and count == 1)
print("register A=%d B=%d | login A=%d B=%d | tokenA=%s tokenB=%s" % (
    ra, rb, la, lb, bool(A.token), bool(Bc.token)))
print("PUT biodata A nik=%s -> %d (harap 200)" % (NIK, sta))
print("PUT biodata B nik SAMA -> %d (harap 409)" % stb)
print("bodyA:", bodyA[:160])
print("bodyB:", bodyB[:200])
print("count_nik_in_db=%d (harap 1)" % count)

for e in (EA, EB):
    row = c.execute("SELECT id FROM users WHERE email=?", (e,)).fetchone()
    if row:
        uid = row[0]
        for (rid,) in c.execute("SELECT id FROM registrations WHERE user_id=?", (uid,)).fetchall():
            c.execute("DELETE FROM psb_payments WHERE registration_id=?", (rid,))
            c.execute("DELETE FROM registrations WHERE id=?", (rid,))
        for tbl in ("audit_logs", "activity_logs"):
            try: c.execute("DELETE FROM %s WHERE actor_id=?" % tbl, (uid,))
            except sqlite3.OperationalError: pass
        c.execute("DELETE FROM users WHERE id=?", (uid,))
c.commit(); c.close()

print("RESULT:", "PASS NIK unik" if ok else "FAIL")
sys.exit(0 if ok else 1)
