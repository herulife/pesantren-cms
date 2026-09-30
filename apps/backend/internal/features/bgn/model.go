package bgn

type Recipient struct {
	ID         int    `json:"id"`
	Identity   string `json:"identity"`    // NISN (10 digit) atau NIK (16 digit), boleh kosong
	Name       string `json:"name"`        // Nama Penerima Manfaat
	BirthDate  string `json:"birth_date"`  // format DD-MM-YYYY
	Gender     string `json:"gender"`      // L / P
	ParentName string `json:"parent_name"` // Nama Orang Tua / Pengampu
	Position   string `json:"position"`    // santri | guru | tendik
	Status     bool   `json:"status"`      // true = menerima aktif
	CreatedAt  string `json:"created_at"`
	UpdatedAt  string `json:"updated_at"`
}

type RecipientInput struct {
	Identity   string `json:"identity"`
	Name       string `json:"name"`
	BirthDate  string `json:"birth_date"`
	Gender     string `json:"gender"`
	ParentName string `json:"parent_name"`
	Position   string `json:"position"`
	Status     bool   `json:"status"`
}

type Filter struct {
	Position string
	Status   string
	Search   string
}

type RecipientStats struct {
	Total    int `json:"total"`
	Santri   int `json:"santri"`
	Guru     int `json:"guru"`
	Tendik   int `json:"tendik"`
	Active   int `json:"active"`
	Inactive int `json:"inactive"`
}

type ImportResult struct {
	Added   int `json:"added"`
	Updated int `json:"updated"`
	Skipped int `json:"skipped"`
}