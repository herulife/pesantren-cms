package auth

import (
	"crypto/rsa"
	"database/sql"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type LicenseStatus struct {
	IsValid   bool   `json:"is_valid"`
	IsWarning bool   `json:"is_warning"`
	DaysLeft  int    `json:"days_left"`
	Message   string `json:"message"`
}

var publicKey *rsa.PublicKey

func InitLicense(pubKeyPath string) error {
	keyData, err := os.ReadFile(pubKeyPath)
	if err != nil {
		return err
	}

	publicKey, err = jwt.ParseRSAPublicKeyFromPEM(keyData)
	return err
}

func CheckLicense(db *sql.DB) (LicenseStatus, error) {
	if publicKey == nil {
		return LicenseStatus{IsValid: false, Message: "Public key missing"}, nil
	}

	var tokenString string
	err := db.QueryRow("SELECT value FROM settings WHERE key = 'app_license_key'").Scan(&tokenString)
	if err != nil {
		return LicenseStatus{IsValid: false, Message: "NO_LICENSE"}, nil
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return publicKey, nil
	})

	if err != nil || !token.Valid {
		return LicenseStatus{IsValid: false, Message: "INVALID_LICENSE"}, nil
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return LicenseStatus{IsValid: false, Message: "INVALID_CLAIMS"}, nil
	}

	exp, ok := claims["exp"].(float64)
	if !ok {
		return LicenseStatus{IsValid: false, Message: "MISSING_EXP"}, nil
	}

	daysLeft := int(time.Until(time.Unix(int64(exp), 0)).Hours() / 24)
	if daysLeft <= 0 {
		return LicenseStatus{IsValid: false, Message: "EXPIRED"}, nil
	}

	return LicenseStatus{
		IsValid:   true,
		IsWarning: daysLeft <= 14,
		DaysLeft:  daysLeft,
	}, nil
}
