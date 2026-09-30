package main

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func main() {
	secret := []byte("909a7ccbf9aedd465248838c13133cf9cb78758954b18f2c55148a1653d7b46aca7691f466aa9787f4ab473511c8da9b")
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id": 1, "email": "superadmin@local", "role": "superadmin",
		"token_version": 0, "iat": time.Now().Unix(),
		"jti": "verify-token", "exp": time.Now().Add(time.Hour).Unix(),
	})
	s, err := t.SignedString(secret)
	if err != nil {
		panic(err)
	}
	fmt.Print(s)
}
