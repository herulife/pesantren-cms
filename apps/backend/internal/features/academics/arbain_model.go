package academics

// ArbainCategory adalah daftar kategori hadis Arbain.
var ArbainCategories = []string{
	"Iman & Ibadah",
	"Akhlak",
	"Dzikir & Doa",
	"Ilmu",
	"Muamalah",
	"Tahfidz & Al-Qur'an",
}

// ArbainStudentProgressStatus adalah status setoran hadis satu Buffer Santri.
const (
	ArbainStatusProses = "proses"
	ArbainStatusSetor  = "setor"
	ArbainStatusLulus  = "lulus"
)

// ArbainProgressSet = daftar status yang valid.
var ArbainProgressSet = []string{ArbainStatusProses, ArbainStatusSetor, ArbainStatusLulus}

// ArbainProgress adalah catatan setoran satu butir hadis Arbain oleh satu Buffer Santri.
// Mirip tahfidz_progress: dipakai ustadz untuk mencatat setoran, lalu Buffer Santri
// melihat progresnya sendiri lewat portal.
type ArbainProgress struct {
	ID             int    `json:"id"`
	StudentID      int    `json:"student_id"`
	StudentName    string `json:"student_name,omitempty"`
	HadithNumber   int    `json:"hadith_number"`
	HadithTitle    string `json:"hadith_title,omitempty"`
	Category       string `json:"category,omitempty"`
	Translation    string `json:"translation,omitempty"`
	Source         string `json:"source,omitempty"`
	Status         string `json:"status"`
	Nilai          int    `json:"nilai"`
	Notes          string `json:"notes"`
	EvaluationDate string `json:"evaluation_date"`
}

// ArbainSummary = rekap jumlah setoran per status untuk satu Buffer Santri.
type ArbainSummary struct {
	Total  int            `json:"total"`
	Status map[string]int `json:"status"`
}
