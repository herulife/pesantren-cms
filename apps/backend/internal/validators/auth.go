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

type RoleUpdateRequest struct {
	Role string `json:"role"`
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

func ValidateRoleUpdateRequest(req *RoleUpdateRequest) ValidationErrors {
	errs := ValidationErrors{}
	req.Role = strings.TrimSpace(req.Role)
	if req.Role == "" {
		errs.Add("role", "Role wajib diisi")
	}
	return errs
}
