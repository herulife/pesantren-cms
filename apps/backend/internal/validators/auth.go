package validators

import "strings"

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type CreateUserRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

type ResetUserPasswordRequest struct {
	Password string `json:"password"`
}

// ChangePasswordRequest dipakai user untuk mengganti password-nya sendiri.
// Password lama wajib dikirim supaya sesi yang tertinggal tidak bisa langsung
// mengambil alih akun; ini berbeda dari ResetUserPasswordRequest yang dipakai
// admin (reset paksa, tanpa password lama).
type ChangePasswordRequest struct {
	OldPassword     string `json:"old_password"`
	NewPassword     string `json:"new_password"`
	ConfirmPassword string `json:"confirm_password"`
}

type RoleUpdateRequest struct {
	Role string `json:"role"`
}

var manageableRoles = map[string]bool{
	"superadmin":  true,
	"bendahara":   true,
	"panitia_psb": true,
	"tim_media":   true,
	"pimpinan":    true,
	"wali_kelas":  true,
	"guru":        true,
	"ustadz":      true,
}

func IsManageableRole(role string) bool {
	return manageableRoles[role]
}

func ValidateLoginRequest(req *LoginRequest) ValidationErrors {
	errs := ValidationErrors{}
	req.Email = NormalizeEmail(req.Email)
	req.Password = strings.TrimSpace(req.Password)

	if !ValidateEmail(req.Email) {
		errs.Add("email", "Format email tidak valid")
	}
	if len(req.Password) < 8 {
		errs.Add("password", "Password minimal 8 karakter")
	}
	return errs
}

func ValidateRegisterRequest(req *RegisterRequest) ValidationErrors {
	errs := ValidationErrors{}
	req.Name = NormalizeText(req.Name)
	req.Email = NormalizeEmail(req.Email)
	req.Password = strings.TrimSpace(req.Password)

	if len(req.Name) < 3 {
		errs.Add("name", "Nama minimal 3 karakter")
	}
	if !ValidateEmail(req.Email) {
		errs.Add("email", "Format email tidak valid")
	}
	if len(req.Password) < 8 {
		errs.Add("password", "Password minimal 8 karakter")
	}
	return errs
}

func ValidateCreateUserRequest(req *CreateUserRequest) ValidationErrors {
	errs := ValidationErrors{}
	req.Name = NormalizeText(req.Name)
	req.Email = NormalizeEmail(req.Email)
	req.Password = strings.TrimSpace(req.Password)
	req.Role = strings.TrimSpace(req.Role)

	if len(req.Name) < 3 {
		errs.Add("name", "Nama minimal 3 karakter")
	}
	if !ValidateEmail(req.Email) {
		errs.Add("email", "Format email tidak valid")
	}
	if len(req.Password) < 8 {
		errs.Add("password", "Password minimal 8 karakter")
	}

	if !IsManageableRole(req.Role) {
		errs.Add("role", "Role tidak valid")
	}

	return errs
}

func ValidateResetUserPasswordRequest(req *ResetUserPasswordRequest) ValidationErrors {
	errs := ValidationErrors{}
	req.Password = strings.TrimSpace(req.Password)

	if len(req.Password) < 8 {
		errs.Add("password", "Password minimal 8 karakter")
	}

	return errs
}

// ValidateChangePasswordRequest memvalidasi penggantian password sendiri.
// Password TIDAK di-trim: spasi bisa jadi bagian password yang sah, dan
// password lama dengan spasi pun harus tetap bisa dicocokkan.
func ValidateChangePasswordRequest(req *ChangePasswordRequest) ValidationErrors {
	errs := ValidationErrors{}

	if req.OldPassword == "" {
		errs.Add("old_password", "Password lama wajib diisi")
	}
	if len(req.NewPassword) < 8 {
		errs.Add("new_password", "Password baru minimal 8 karakter")
	} else if req.NewPassword == req.OldPassword {
		errs.Add("new_password", "Password baru harus berbeda dari password lama")
	}
	if req.ConfirmPassword != req.NewPassword {
		errs.Add("confirm_password", "Konfirmasi password tidak cocok")
	}

	return errs
}

func ValidateRoleUpdateRequest(req *RoleUpdateRequest) ValidationErrors {
	errs := ValidationErrors{}
	req.Role = strings.TrimSpace(req.Role)
	if req.Role == "" {
		errs.Add("role", "Role wajib diisi")
	} else if !IsManageableRole(req.Role) {
		errs.Add("role", "Role tidak valid")
	}
	return errs
}
