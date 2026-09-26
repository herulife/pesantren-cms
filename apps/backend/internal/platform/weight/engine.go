package weight

import (
	"fmt"
	"math"
)

// ValidateWeights ensures SUM(weights) == 100 (tolerance 0.01) and each weight 0 < w <= 100, no negative.
func ValidateWeights(weights map[string]float64) error {
	if len(weights) == 0 {
		return fmt.Errorf("bobot tidak boleh kosong")
	}
	sum := 0.0
	for k, w := range weights {
		if w < 0 {
			return fmt.Errorf("bobot %s tidak boleh negatif: %.2f", k, w)
		}
		if w > 100 {
			return fmt.Errorf("bobot %s tidak boleh >100: %.2f", k, w)
		}
		if w == 0 {
			return fmt.Errorf("bobot %s tidak boleh 0", k)
		}
		sum += w
	}
	if math.Abs(sum-100) > 0.01 {
		return fmt.Errorf("Total bobot harus 100%%. Saat ini %.2f%%", sum)
	}
	return nil
}

// CalculateWeightedScore computes SUM(score * weight/100). Validates weights and score range 1-4 (or 0-100 if allow100).
// Scores are expected 1-4 for Project/Kesantrian, but we allow 0-100 for flexibility; caller should validate.
func CalculateWeightedScore(scores map[string]float64, weights map[string]float64) (float64, error) {
	if err := ValidateWeights(weights); err != nil {
		return 0, err
	}
	// Ensure every score has a weight and vice versa
	for k := range scores {
		if _, ok := weights[k]; !ok {
			return 0, fmt.Errorf("bobot untuk %s tidak ditemukan", k)
		}
	}
	for k := range weights {
		if _, ok := scores[k]; !ok {
			return 0, fmt.Errorf("nilai untuk %s tidak ditemukan", k)
		}
	}
	total := 0.0
	for k, score := range scores {
		w := weights[k]
		if score < 0 || score > 4.0001 {
			// Allow 0-100 as well for Mapel numeric, but for Project we expect 1-4
			// We allow both, but if score >4 and <=100, treat as is (for Mapel)
			// If >100, error
			if score > 100 {
				return 0, fmt.Errorf("nilai %s diluar range (0-4 atau 0-100): %.2f", k, score)
			}
		}
		total += score * (w / 100.0)
	}
	// Round to 3 decimals for E-Raport precision
	total = math.Round(total*1000) / 1000
	return total, nil
}

// CalculateProjectScore computes Nilai Project from Sub Projects
// Example: Qurani 3.80*40% + Mandiri 3.50*30% + Peduli 3.70*30% = 3.68
func CalculateProjectScore(subScores map[string]float64, subWeights map[string]float64) (float64, error) {
	return CalculateWeightedScore(subScores, subWeights)
}

// CalculateKesantrianScore computes (Disiplin+Ibadah+Kemandirian+Adab)*25%
func CalculateKesantrianScore(scores map[string]float64) (float64, error) {
	weights := map[string]float64{"disiplin": 25, "ibadah": 25, "kemandirian": 25, "adab": 25}
	// Normalize keys to lower
	normScores := map[string]float64{}
	for k, v := range scores {
		normScores[lower(k)] = v
	}
	return CalculateWeightedScore(normScores, weights)
}

func lower(s string) string {
	// simple toLower without import strings for minimal
	b := []byte(s)
	for i, c := range b {
		if c >= 'A' && c <= 'Z' {
			b[i] = c + 32
		}
	}
	return string(b)
}

// CalculateERaport computes (Mapel*X + Project*Y + Kesantrian*Z) with X+Y+Z=100
func CalculateERaport(mapel, project, kesantrian float64, weights map[string]float64) (float64, error) {
	scores := map[string]float64{"mapel": mapel, "project": project, "kesantrian": kesantrian}
	return CalculateWeightedScore(scores, weights)
}

// Predikat dari nilai 1-4
func Predikat(score float64) string {
	switch {
	case score >= 3.5:
		return "Sangat Baik"
	case score >= 2.5:
		return "Baik"
	case score >= 1.5:
		return "Cukup"
	default:
		return "Perlu Perbaikan"
	}
}

// PHASE 14 (C11): Predikat100 untuk skor skala 0-100.
//
// Batas memakai konversi skala 4 K13 (A: 3.51-4.00, B: 2.51-3.50,
// C: 1.51-2.50, D: <1.51) x25: 87.75 / 62.75 / 37.75.
// SPEC_GAP: sekolah perlu mengonfirmasi ambang ini vs KKM mapel (default 75).
// JANGAN panggil Predikat() dengan skor 0-100 (82.58 -> "Sangat Baik" salah).
// PredikatKKM memakai ambang KKM (lulus = 75):
// A (Sangat Baik) ≥ 90, B (Baik) 80-89, C (Cukup) 75-79, D < 75.
func PredikatKKM(score float64) string {
	switch {
	case score >= 90:
		return "Sangat Baik"
	case score >= 80:
		return "Baik"
	case score >= 75:
		return "Cukup"
	default:
		return "Perlu Perbaikan"
	}
}

// PredikatKKM memakai ambang KKM (lulus = 75):
// A (Sangat Baik) ≥ 90, B (Baik) 80-89, C (Cukup) 75-79, D < 75.
func PredikatKKM(score float64) string {
	switch {
	case score >= 90:
		return "Sangat Baik"
	case score >= 80:
		return "Baik"
	case score >= 75:
		return "Cukup"
	default:
		return "Perlu Perbaikan"
	}
}

func Predikat100(score float64) string {
	switch {
	case score >= 87.75:
		return "Sangat Baik"
	case score >= 62.75:
		return "Baik"
	case score >= 37.75:
		return "Cukup"
	default:
		return "Perlu Perbaikan"
	}
}
