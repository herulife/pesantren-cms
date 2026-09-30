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

	// Relasi opsional ke dataSantri di aplikasi (0 = belum ditautkan).
	// Hanya-baca: tidak pernah dikirim balik lewat RecipientInput.
	SantriID    int    `json:"santri_id"`
	SantriName  string `json:"santri_name"`
	SantriClass string `json:"santri_class"`
}

// SantriOption adalah kandidat/dataatri dari tabel `santri` untuk dialog tautan.
type SantriOption struct {
	ID    int    `json:"id"`
	NIK   string `json:"nik"`
	Name  string `json:"name"`
	Class string `json:"class"`
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
	Limit    int // <=0 berarti tanpa paginasi
	Offset   int
}

type RecipientStats struct {
	Total    int `json:"total"`
	Santri   int `json:"santri"`
	Guru     int `json:"guru"`
	Tendik   int `json:"tendik"`
	Active   int `json:"active"`
	Inactive int `json:"inactive"`
	Linked   int `json:"linked"` // penerima yang sudah ditautkan ke data Santri
}

type ImportResult struct {
	Added   int `json:"added"`
	Updated int `json:"updated"`
	Skipped int `json:"skipped"`
}
