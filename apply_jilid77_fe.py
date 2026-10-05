#!/usr/bin/env python3
"""apply_jilid77_fe.py - sambungkan form presensi ke daftar Santri (Jilid 77)."""

import argparse
import io
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PAGE = "apps/frontend/src/app/admin/academics/form/page.tsx"

PATCHES = [
    (
        """import {
  ArbainProgress,
  CompactUser,""",
        """import {
  ArbainProgress,
  AttendanceStudent,
  CompactUser,""",
        "import tipe AttendanceStudent",
    ),
    (
        """  getAttendance,
  getGrades,""",
        """  getAttendance,
  getAttendanceStudents,
  getGrades,""",
        "import getAttendanceStudents",
    ),
    (
        """  const [students, setStudents] = useState<CompactUser[]>([]);""",
        """  const [students, setStudents] = useState<CompactUser[]>([]);
  // Modul presensi memakai Santri.id (bukan akun portal) supaya dua saudara
  // dari satu akun wali tetap bisa dipilih terpisah.
  const [attendanceStudents, setAttendanceStudents] = useState<AttendanceStudent[]>([]);""",
        "state attendanceStudents",
    ),
    (
        """        const [subjectData, studentData, refData] = await Promise.all([getSubjects(), getAcademicStudents(), getArbainReference()]);
        setSubjects(subjectData);
        setStudents(studentData);
        setArbainRef(refData);""",
        """        const [subjectData, studentData, refData] = await Promise.all([getSubjects(), getAcademicStudents(), getArbainReference()]);
        setSubjects(subjectData);
        setStudents(studentData);
        setArbainRef(refData);

        if (type === 'attendance') {
          setAttendanceStudents(await getAttendanceStudents());
        }""",
        "muat daftar Santri saat form attendance dibuka",
    ),
    (
        """                      {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Tanggal">""",
        """                      {attendanceStudents.map((student) => <option key={student.id} value={student.id}>{student.name} ({student.class})</option>)}
                    </select>
                  </Field>
                  <Field label="Tanggal">""",
        "dropdown presensi memakai attendanceStudents",
    ),
]


def apply(dry_run):
    path = os.path.join(ROOT, PAGE)
    src = io.open(path, encoding="utf-8").read()
    failed = 0
    for old, new, note in PATCHES:
        if old in src:
            hits = src.count(old)
            if hits > 1:
                print("  [AMBIGU] %s (%d kemunculan)" % (note, hits))
                failed += 1
                continue
            print("  [OK] %s" % note)
            if not dry_run:
                src = src.replace(old, new, 1)
        elif new in src:
            print("  [SUDAH] %s" % note)
        else:
            print("  [GAGAL] %s (tidak cocok)" % note)
            failed += 1
    if not dry_run and not failed:
        io.open(path, "w", encoding="utf-8").write(src)
        print("  -> %s ditulis" % PAGE)
    print("")
    print("ringkasan: %d bermasalah" % failed)
    return failed


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    sys.exit(1 if apply(a.dry_run) else 0)