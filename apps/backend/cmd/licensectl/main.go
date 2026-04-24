package main

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func main() {
	if len(os.Args) < 2 {
		usage()
		os.Exit(1)
	}

	switch os.Args[1] {
	case "genkeypair":
		if err := runGenKeyPair(os.Args[2:]); err != nil {
			fmt.Fprintln(os.Stderr, "error:", err)
			os.Exit(1)
		}
	case "issue":
		if err := runIssue(os.Args[2:]); err != nil {
			fmt.Fprintln(os.Stderr, "error:", err)
			os.Exit(1)
		}
	case "inspect":
		if err := runInspect(os.Args[2:]); err != nil {
			fmt.Fprintln(os.Stderr, "error:", err)
			os.Exit(1)
		}
	default:
		usage()
		os.Exit(1)
	}
}

func usage() {
	fmt.Println("licensectl - Darussunnah license utility")
	fmt.Println()
	fmt.Println("Usage:")
	fmt.Println("  licensectl genkeypair --private-out license-private.pem --public-out public.key")
	fmt.Println("  licensectl issue --private-key license-private.pem --days 365 --customer \"Darussunnah\" --domain darussunnahparung.com")
	fmt.Println("  licensectl inspect --token <jwt>")
}

func runGenKeyPair(args []string) error {
	fs := flag.NewFlagSet("genkeypair", flag.ContinueOnError)
	privateOut := fs.String("private-out", "license-private.pem", "path to RSA private key PEM output")
	publicOut := fs.String("public-out", "public.key", "path to RSA public key PEM output")
	bits := fs.Int("bits", 2048, "RSA key size")
	if err := fs.Parse(args); err != nil {
		return err
	}

	key, err := rsa.GenerateKey(rand.Reader, *bits)
	if err != nil {
		return err
	}

	privatePEM := pem.EncodeToMemory(&pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(key),
	})

	publicDER, err := x509.MarshalPKIXPublicKey(&key.PublicKey)
	if err != nil {
		return err
	}
	publicPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "PUBLIC KEY",
		Bytes: publicDER,
	})

	if err := writeFile(*privateOut, privatePEM, 0o600); err != nil {
		return err
	}
	if err := writeFile(*publicOut, publicPEM, 0o644); err != nil {
		return err
	}

	fmt.Printf("Private key written to %s\n", *privateOut)
	fmt.Printf("Public key written to %s\n", *publicOut)
	fmt.Println("Keep the private key outside the repository.")
	return nil
}

func runIssue(args []string) error {
	fs := flag.NewFlagSet("issue", flag.ContinueOnError)
	privateKeyPath := fs.String("private-key", "", "path to RSA private key PEM")
	days := fs.Int("days", 365, "license duration in days")
	customer := fs.String("customer", "", "customer or organization name")
	domain := fs.String("domain", "", "primary licensed domain")
	plan := fs.String("plan", "annual", "license plan label")
	issuer := fs.String("issuer", "darussunnah-licensectl", "issuer claim")
	notBeforeHours := fs.Int("not-before-hours", 0, "delay activation by N hours")
	if err := fs.Parse(args); err != nil {
		return err
	}

	if strings.TrimSpace(*privateKeyPath) == "" {
		return fmt.Errorf("--private-key is required")
	}
	if *days <= 0 {
		return fmt.Errorf("--days must be greater than 0")
	}

	privateKey, err := readPrivateKey(*privateKeyPath)
	if err != nil {
		return err
	}

	now := time.Now().UTC()
	nbf := now.Add(time.Duration(*notBeforeHours) * time.Hour)
	exp := nbf.Add(time.Duration(*days) * 24 * time.Hour)

	claims := jwt.MapClaims{
		"iss":      *issuer,
		"iat":      now.Unix(),
		"nbf":      nbf.Unix(),
		"exp":      exp.Unix(),
		"plan":     strings.TrimSpace(*plan),
		"customer": strings.TrimSpace(*customer),
		"domain":   strings.TrimSpace(*domain),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	signed, err := token.SignedString(privateKey)
	if err != nil {
		return err
	}

	fmt.Println(signed)
	return nil
}

func runInspect(args []string) error {
	fs := flag.NewFlagSet("inspect", flag.ContinueOnError)
	tokenString := fs.String("token", "", "JWT token to inspect")
	if err := fs.Parse(args); err != nil {
		return err
	}
	if strings.TrimSpace(*tokenString) == "" {
		return fmt.Errorf("--token is required")
	}

	parser := jwt.Parser{}
	token, _, err := parser.ParseUnverified(*tokenString, jwt.MapClaims{})
	if err != nil {
		return err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return fmt.Errorf("invalid token claims")
	}

	output, err := json.MarshalIndent(claims, "", "  ")
	if err != nil {
		return err
	}
	fmt.Println(string(output))
	return nil
}

func readPrivateKey(path string) (*rsa.PrivateKey, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	block, _ := pem.Decode(data)
	if block == nil {
		return nil, fmt.Errorf("invalid PEM in %s", path)
	}

	if key, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		return key, nil
	}

	pkcs8Key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("unsupported private key format in %s", path)
	}

	key, ok := pkcs8Key.(*rsa.PrivateKey)
	if !ok {
		return nil, fmt.Errorf("private key in %s is not RSA", path)
	}
	return key, nil
}

func writeFile(path string, contents []byte, mode os.FileMode) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	return os.WriteFile(path, contents, mode)
}
