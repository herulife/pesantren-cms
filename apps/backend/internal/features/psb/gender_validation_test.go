package psb

import "testing"

func TestValidatePortalRegistrationGender(t *testing.T) {
	valid := []string{
		"", "L", "P", "l", "p",
		"Laki-laki", "Perempuan", "laki-laki", "perempuan",
		"LAKI-LAKI", "PEREMPUAN", "laki", "pria", "wanita",
	}
	for _, g := range valid {
		req := &portalRegistrationRequest{FullName: "Test", Gender: g, Jenjang: "smp", ProgramChoice: "tahfidz"}
		if errs := validatePortalRegistration(req); len(errs) != 0 {
			t.Errorf("gender %q seharusnya valid, tapi error: %v", g, errs)
		}
	}

	invalid := []string{"X", "lelaki", "banci", "L/P"}
	for _, g := range invalid {
		req := &portalRegistrationRequest{FullName: "Test", Gender: g, Jenjang: "smp", ProgramChoice: "tahfidz"}
		if errs := validatePortalRegistration(req); len(errs) == 0 {
			t.Errorf("gender %q seharusnya invalid, tapi lolos", g)
		}
	}
}

func TestValidatePortalRegistrationJenjang(t *testing.T) {
	valid := []string{"smp", "smk", "SMP", "SMK", " Smp "}
	for _, j := range valid {
		req := &portalRegistrationRequest{FullName: "Test", Gender: "L", Jenjang: j, ProgramChoice: "tahfidz"}
		if errs := validatePortalRegistration(req); len(errs) != 0 {
			t.Errorf("jenjang %q seharusnya valid, tapi error: %v", j, errs)
		}
	}

	invalid := []string{"", "sltp", "MAN", "sd"}
	for _, j := range invalid {
		req := &portalRegistrationRequest{FullName: "Test", Gender: "L", Jenjang: j, ProgramChoice: "tahfidz"}
		if errs := validatePortalRegistration(req); len(errs) == 0 {
			t.Errorf("jenjang %q seharusnya invalid, tapi lolos", j)
		}
	}
}