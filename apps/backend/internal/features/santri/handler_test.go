package santri

import "testing"

// validateSantri harus menerima kategori kosong (default "reguler"),
// menormalkan ejaan/kapitalisasi, dan menolak nilai di luar daftar.
func TestValidateSantriCategory(t *testing.T) {
	cases := []struct {
		name     string
		in       string
		wantErr  bool
		wantSave string
	}{
		{"kosong jadi reguler", "", false, "reguler"},
		{"reguler", "reguler", false, "reguler"},
		{"yatim", "yatim", false, "yatim"},
		{"dhuafa", "dhuafa", false, "dhuafa"},
		{"kapital kecil", "YATIM", false, "yatim"},
		{"ada spasi", "  Dhuafa  ", false, "dhuafa"},
		{"alias duafa", "duafa", false, "dhuafa"},
		{"nilai asing ditolak", "pintar", true, ""},
		{"hanya spasi jadi reguler", "   ", false, "reguler"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			s := &Santri{NIS: "1234", Name: "Santri Uji", Class: "VII", Category: tc.in}
			errs := validateSantri(s)
			if tc.wantErr {
				if errs == nil {
					t.Fatalf("category %q seharusnya ditolak", tc.in)
				}
				if _, ok := errs["category"]; !ok {
					t.Fatalf("error harus di key \"category\", dapat %v", errs)
				}
				return
			}
			if errs != nil {
				t.Fatalf("category %q tidak seharusnya ditolak: %v", tc.in, errs)
			}
			if s.Category != tc.wantSave {
				t.Fatalf("category tersimpan = %q, harap %q", s.Category, tc.wantSave)
			}
		})
	}
}

// Kategori harus ikut terbaca di DTO tulis, kalau tidak DecodeJSON
// (DisallowUnknownFields) akan menolak payload dari form.
func TestSantriInputCarriesCategory(t *testing.T) {
	in := &SantriInput{NIS: "1234", Name: "Santri Uji", Class: "VII", Category: "yatim"}
	if got := in.toSantri().Category; got != "yatim" {
		t.Fatalf("toSantri().Category = %q, harap yatim", got)
	}
}
