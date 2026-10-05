package santri

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"

	"almaparung-api/internal/features/auth"
	"almaparung-api/internal/platform/database"
	"almaparung-api/internal/platform/logger"
	"almaparung-api/internal/platform/scope"
)

// ExportRow adalah satu baris untuk export Excel "Data Santri". Isinya seluruh
// kolom tabel `santri` PLUS data akun portal yang tertaut lewat
// `santri.user_id` -> `users.id`.
//
// Kolom akun portal diambil lewat LEFT JOIN, bukan query per Santri, supaya
// export ratusan baris tetap satu round-trip ke database.
type ExportRow struct {
	ID               int    `json:"id"`
	NIS              string `json:"nis"`
	Name             string `json:"name"`
	Nickname         string `json:"nickname"`
	Gender           string `json:"gender"`
	Class            string `json:"class"`
	Jenjang          string `json:"jenjang"`
	Angkatan         string `json:"angkatan"`
	Status           string `json:"status"`
	Category         string `json:"category"`
	NIK              string `json:"nik"`
	BirthPlace       string `json:"birth_place"`
	BirthDate        string `json:"birth_date"`
	Address          string `json:"address"`
	ParentName       string `json:"parent_name"`
	ParentPhone      string `json:"parent_phone"`
	FatherName       string `json:"father_name"`
	FatherPhone      string `json:"father_phone"`
	MotherName       string `json:"mother_name"`
	MotherPhone      string `json:"mother_phone"`
	FatherOccupation string `json:"father_occupation"`
	MotherOccupation string `json:"mother_occupation"`
	RegistrationID   int    `json:"registration_id"`
	PhotoURL         string `json:"photo_url"`
	CreatedAt        string `json:"created_at"`
	UpdatedAt        string `json:"updated_at"`

	// Akun portal. Kosong kalau Santri belum punya akun tertaut.
	HasAccount      bool   `json:"has_account"`
	UserID          int    `json:"user_id"`
	AccountName     string `json:"account_name"`
	AccountEmail    string `json:"account_email"`
	AccountRole     string `json:"account_role"`
	AccountWhatsapp string `json:"account_whatsapp"`
	LastLoginAt     string `json:"last_login_at"`
}

// ExportAll mengembalikan SEMUA data santri tanpa paginasi, supaya Excel di
// sisi frontend tidak perlu mengambil halaman demi halaman.
//
// `classes` membatasi hasil untuk role wali_kelas. Slice kosong berarti semua
// kelas, dipakai role yang memang berhak melihat semua data.
//
// Catatan: `password_hash` tidak pernah ikut dan tidak boleh ditambahkan.
func (r *Repository) ExportAll(classes []string) ([]ExportRow, error) {
	// Pemanggil yang membatasi kelas (wali_kelas) mengirim daftar kelasnya.
	// Kalau daftarnya kosong, hasilnya harus kosong juga - bukan semua data.
	// Slice kosong berarti "semua kelas", hanya untuk role yang memang berhak.
	where := []string{"1=1"}
	var args []interface{}
	if classes != nil {
		if len(classes) == 0 {
			return []ExportRow{}, nil
		}
		where = []string{"s.class IN (" + placeholders(len(classes)) + ")"}
		for _, c := range classes {
			args = append(args, c)
		}
	}
	whereStr := strings.Join(where, " AND ")

	query := fmt.Sprintf(`SELECT
		s.id,
		COALESCE(s.nis,''), COALESCE(s.name,''), COALESCE(s.nickname,''),
		COALESCE(s.gender,''), COALESCE(s.class,''), COALESCE(s.jenjang,''),
		COALESCE(s.angkatan,''), COALESCE(s.status,''), COALESCE(s.category,''),
		COALESCE(s.nik,''), COALESCE(s.birth_place,''), COALESCE(s.birth_date,''),
		COALESCE(s.address,''), COALESCE(s.parent_name,''), COALESCE(s.parent_phone,''),
		COALESCE(s.father_name,''), COALESCE(s.father_phone,''),
		COALESCE(s.mother_name,''), COALESCE(s.mother_phone,''),
		COALESCE(s.father_occupation,''), COALESCE(s.mother_occupation,''),
		COALESCE(s.registration_id,0), COALESCE(s.photo_url,''),
		COALESCE(s.created_at,''), COALESCE(s.updated_at,''),
		u.id, COALESCE(u.name,''), COALESCE(u.email,''), COALESCE(u.role,''),
		COALESCE(u.whatsapp,''), COALESCE(u.last_login_at,'')
	FROM santri s
	LEFT JOIN users u ON u.id = s.user_id
	WHERE %s
	ORDER BY s.class, s.name`, whereStr)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []ExportRow{}
	for rows.Next() {
		var e ExportRow
		var userID sql.NullInt64
		if err := rows.Scan(
			&e.ID, &e.NIS, &e.Name, &e.Nickname, &e.Gender, &e.Class, &e.Jenjang,
			&e.Angkatan, &e.Status, &e.Category, &e.NIK, &e.BirthPlace, &e.BirthDate,
			&e.Address, &e.ParentName, &e.ParentPhone, &e.FatherName, &e.FatherPhone,
			&e.MotherName, &e.MotherPhone, &e.FatherOccupation, &e.MotherOccupation,
			&e.RegistrationID, &e.PhotoURL, &e.CreatedAt, &e.UpdatedAt,
			&userID, &e.AccountName, &e.AccountEmail, &e.AccountRole,
			&e.AccountWhatsapp, &e.LastLoginAt,
		); err != nil {
			return nil, err
		}
		if userID.Valid {
			e.HasAccount = true
			e.UserID = int(userID.Int64)
		}
		list = append(list, e)
	}
	return list, rows.Err()
}

// ExportAll menyediakan data untuk Excel. Endpoint ini sengaja TANPA paginasi dan
// TANPA filter search/status, karena permintaannya adalah seluruh data.
//
// Pembatasan kelas tetap berlaku: role wali_kelas hanya boleh mengunduh kelas
// miliknya, sama seperti saat membuka daftar.
func (h *Handler) ExportAll(w http.ResponseWriter, r *http.Request) {
	role, _ := auth.GetAuthenticatedRole(r.Context())
	uid, _ := auth.GetAuthenticatedUserID(r.Context())

	var classes []string
	if role == "wali_kelas" {
		sc, err := scope.Resolve(database.DB, uid, role)
		if err != nil {
			logger.Error(r.Context(), "santri export scope failed",
				logger.Field{"error": err.Error()})
			sendJSONResponse(w, http.StatusInternalServerError, false,
				"Gagal memuat data", nil)
			return
		}
		classes = sc.Classes
	}

	list, err := h.repo.ExportAll(classes)
	if err != nil {
		logger.Error(r.Context(), "santri export failed", logger.Field{"error": err.Error()})
		sendJSONResponse(w, http.StatusInternalServerError, false, "Gagal memuat data", nil)
		return
	}
	sendJSONResponse(w, http.StatusOK, true, "Data berhasil dimuat",
		map[string]interface{}{"items": list, "total": len(list)})
}
