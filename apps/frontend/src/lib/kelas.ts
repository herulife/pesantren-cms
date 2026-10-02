// Daftar kelas kanonik Ponytell — sumber tunggal untuk dropdown & filter kelas.
// Nilai disimpan apa adanya di `santri.class` dan `classes.name`, jadi angka
// (bukan romawi) supaya filter di /admin/kesantrian cocok dengan form tambah.

export const KELAS_OPSI = ['7', '8', '9', '10', '11', '12', 'PSB'] as const;

export function adalahKelasKanonik(value: string | null | undefined): boolean {
  const v = (value || '').trim();
  return (KELAS_OPSI as readonly string[]).includes(v);
}

export interface KelasOption {
  value: string;
  label: string;
}

/// Opsi kelas untuk form: daftar kanonik + nilai lama yang masih dipakai data
// (mis. Santri lama ber-kelas "SEMENTARA") supaya record itu tidak hilang.
export function opsiKelasForm(nilaiSaatIni: string): KelasOption[] {
  const opsi: KelasOption[] = KELAS_OPSI.map((k) => ({ value: k, label: k }));
  const lama = (nilaiSaatIni || '').trim();
  if (lama && !adalahKelasKanonik(lama)) opsi.push({ value: lama, label: `${lama} (lama)` });
  return opsi;
}

// Opsi kelas untuk filter: daftar kanonik dulu, lalu nilai non-kanonik yang
// ditemukan di data (supaya Santri berkelas lama tetap bisa difilter).
export interface KelasData {
  value: string;
  count: number;
}

const urutKelas = (a: string, b: string) => {
  const na = parseInt(a, 10);
  const nb = parseInt(b, 10);
  const ka = Number.isNaN(na);
  const kb = Number.isNaN(nb);
  if (!ka && !kb) return na - nb;
  if (!ka) return -1; // angka (kelas kanonik) dulu
  if (!kb) return 1;
  return a.localeCompare(b);
};

// Opsi kelas untuk filter: daftar kanonik dulu (supaya kelas yang belum ada
// Santrinya tetap bisa dipilih), lalu nilai non-kanonik yang benar-benar ada
// di data. Sumber `dariData` = distinct `santri.class` dari backend, BUKAN
// baris yang kebetulan termuat di halaman (dulu bug: opsi tidak lengkap).
// Label memakai jumlah Santri per kelas supaya user bisa langsung mencocokkan
// dengan data. Nilai non-kanonik ditandai "lama" — bukan dihapus, karena data
// lama (mis. romawi III/IV/V/VI, SEMENTARA) masih ada dan tidak dibuang.
export function opsiKelasFilter(dariData: KelasData[]): KelasOption[] {
  const countOf = new Map<string, number>();
  for (const d of dariData) {
    const v = (d.value || '').trim();
    if (v) countOf.set(v, d.count);
  }
  const kanonik: KelasOption[] = Array.from(KELAS_OPSI).sort(urutKelas).map((k) => ({
    value: k,
    label: `${k} · ${countOf.get(k) ?? 0}`,
  }));
  const ekstra = Array.from(countOf.keys())
    .filter((v) => !adalahKelasKanonik(v))
    .sort(urutKelas)
    .map((v) => ({ value: v, label: `${v} · ${countOf.get(v) ?? 0} (lama)` }));
  return kanonik.concat(ekstra);
}