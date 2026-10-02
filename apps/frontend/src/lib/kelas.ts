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
export function opsiKelasFilter(nilaiLama: string[]): KelasOption[] {
  const opsi: KelasOption[] = KELAS_OPSI.map((k) => ({ value: k, label: k }));
  const ekstra = Array.from(
    new Set(nilaiLama.map((v) => (v || '').trim()).filter((v) => v && !adalahKelasKanonik(v)))
  ).sort();
  return opsi.concat(ekstra.map((v) => ({ value: v, label: `${v} (lama)` })));
}