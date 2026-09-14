package weight

import "testing"

func TestCalculateProjectScore(t *testing.T) {
	scores := map[string]float64{"qurani": 3.80, "mandiri": 3.60, "peduli": 3.70}
	weights := map[string]float64{"qurani": 40, "mandiri": 30, "peduli": 30}
	got, err := CalculateProjectScore(scores, weights)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// Expected 3.71 (3.80*0.4 + 3.60*0.3 + 3.70*0.3 = 3.71)
	if got < 3.69 || got > 3.72 {
		t.Errorf("expected ~3.71, got %.3f", got)
	}
}

func TestCalculateProjectScoreAlt(t *testing.T) {
	scores := map[string]float64{"qurani": 3.80, "mandiri": 3.50, "peduli": 3.70}
	weights := map[string]float64{"qurani": 40, "mandiri": 30, "peduli": 30}
	got, err := CalculateProjectScore(scores, weights)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got < 3.67 || got > 3.69 {
		t.Errorf("expected 3.68, got %.3f", got)
	}
}

func TestCalculateKesantrianScore(t *testing.T) {
	scores := map[string]float64{"disiplin": 4, "ibadah": 3, "kemandirian": 4, "adab": 3}
	got, err := CalculateKesantrianScore(scores)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != 3.5 {
		t.Errorf("expected 3.5, got %.3f", got)
	}
}

func TestCalculateERaport(t *testing.T) {
	got, err := CalculateERaport(3.60, 3.70, 3.80, map[string]float64{"mapel": 50, "project": 25, "kesantrian": 25})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got < 3.674 || got > 3.676 {
		t.Errorf("expected 3.675, got %.3f", got)
	}
}

func TestInvalidWeight(t *testing.T) {
	weights := map[string]float64{"qurani": 40, "mandiri": 35, "peduli": 35}
	_, err := CalculateProjectScore(map[string]float64{"qurani": 3, "mandiri": 3, "peduli": 3}, weights)
	if err == nil {
		t.Fatal("expected error for total 110%")
	}
	if err.Error() != "Total bobot harus 100%. Saat ini 110.00%" {
		// allow contains
		if len(err.Error()) < 10 || err.Error()[:5] != "Total" {
			t.Errorf("unexpected error msg: %v", err)
		}
	}
}

func TestNegativeWeight(t *testing.T) {
	_, err := CalculateWeightedScore(map[string]float64{"a": 3}, map[string]float64{"a": -10})
	if err == nil {
		t.Fatal("expected error for negative weight")
	}
}

func TestWeightOver100(t *testing.T) {
	_, err := CalculateWeightedScore(map[string]float64{"a": 3}, map[string]float64{"a": 150})
	if err == nil {
		t.Fatal("expected error for weight >100")
	}
}

func TestPredikat100(t *testing.T) {
	cases := []struct {
		score float64
		want  string
	}{
		{0, "Perlu Perbaikan"},
		{25, "Perlu Perbaikan"},
		{37.74, "Perlu Perbaikan"},
		{37.75, "Cukup"},
		{50, "Cukup"},
		{62.74, "Cukup"},
		{62.75, "Baik"},
		{75, "Baik"},
		{82.58, "Baik"},
		{87.74, "Baik"},
		{87.75, "Sangat Baik"},
		{100, "Sangat Baik"},
	}
	for _, c := range cases {
		if got := Predikat100(c.score); got != c.want {
			t.Errorf("Predikat100(%v) = %q, want %q", c.score, got, c.want)
		}
	}
}
