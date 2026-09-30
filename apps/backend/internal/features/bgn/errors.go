package bgn

import "errors"

// Sentinel error untuk tautan BGN <-> Santri. Dipetakan handler ke HTTP 4xx
// supaya pengguna mendapat pesan yang jelas, bukan 500.
var (
	ErrNotFound       = errors.New("penerima BGN tidak ditemukan")
	ErrSantriNotFound = errors.New("data Santri tidak ditemukan")
	ErrSantriTaken    = errors.New("data Santri sudah ditautkan ke penerima BGN lain")
	ErrLinkNotSantri  = errors.New("hanya penerima BGN dengan posisi Santri yang dapat ditautkan")
)
