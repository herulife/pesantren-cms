# Modul Debugging Rust

Panduan debugging spesifik-bahasa untuk proyek Rust. Gunakan di samping [Protokol Debugging](../SKILL.md) utama.

---

## Referensi Toolchain

| Alat (Tool) | Tujuan | Kapan Digunakan |
|---|---|---|
| `cargo check` | Pengecekan tipe/peminjaman (borrow) dengan cepat (tanpa codegen) | **Selalu pertama** — 2-5× lebih cepat dari `cargo build` |
| `cargo clippy` | Linter untuk masalah idiomatik dan bug halus | Setelah `cargo check` berhasil — menangkap kesalahan logika |
| `cargo test` | Menjalankan test suite | Memvalidasi perbaikan, mereproduksi kegagalan |
| `cargo expand` | Memperluas makro untuk melihat kode yang dihasilkan | Bila error yang dihasilkan makro tidak jelas |
| `cargo tree` | Memvisualisasikan grafik dependensi | Konflik dependensi, ketidakcocokan versi |
| `cargo audit` | Memeriksa kerentanan yang diketahui | Investigasi terkait keamanan |
| `RUST_BACKTRACE=1` | Backtrace penuh saat terjadi panic | Panic saat runtime — selalu aktifkan terlebih dahulu |
| `RUST_BACKTRACE=full` | Backtrace beserta nomor baris | Bila `=1` tidak memberikan detail yang cukup |
| `miri` | Mendeteksi undefined behavior pada blok kode unsafe | Dicurigai adanya undefined behavior, masalah memori |

---

## Fase 1: Inisialisasi Sesi — Konteks Rust

Tambahkan kolom ini ke teks sesi debugging:

```markdown
### Konteks Rust
- **Versi toolchain Rust:** (output dari `rustc --version`)
- **Dependensi kunci Cargo.toml:** (daftar dengan versinya)
- **Profil build:** debug / release
- **Target:** default / cross-compile target
```

---

## Fase 3: Kategori Hipotesis

Kategori hipotesis yang umum khusus pada Rust:

| Kategori | Contoh Hipotesis |
|---|---|
| **Borrow Checker** | "Fungsi meminjam (borrows) `self` secara mutable sementara peminjaman immutable masih aktif" |
| **Lifetime** | "Referensi yang dikembalikan hidup lebih lama daripada data yang ditunjuknya" |
| **Async/Runtime** | "Pemanggilan pemblokiran (blocking call) di dalam konteks async membuat runtime Tokio kekurangan sumber daya (starved)" |
| **Type Mismatch** | "Trait bound tidak terpenuhi karena hilangnya `Send`/`Sync` pada future yang di-spawn" |
| **FFI/Unsafe** | "Raw pointer dari C FFI bernilai null tapi tidak diperiksa sebelum di-dereference" |
| **Macro Expansion** | "Procedural macro menghasilkan kode yang bentrok dengan nama tipe lokal" |
| **Dependensi** | "Dua crate bergantung pada versi mayor yang berbeda dari crate yang sama" |

---

## Fase 4: Pola Tugas Validasi

### Error Borrow Checker — Strategi Membaca

Ketika compiler mengeluarkan error borrow:

1. **Baca error dari bawah ke atas** — baris terakhir menunjukkan *di mana* konfliknya, bukan *kenapa*
2. **Temukan dua peminjaman yang berbenturan** — error-nya selalu menyebutkan keduanya
3. **Periksa lifetime setiap peminjaman** — apakah salah satu hidup lebih lama dari yang diharapkan?
4. **Perbaikan umum:**
   - Clone datanya (hanya jika murah — dokumentasikan dengan `// CLONE:`)
   - Restrukturisasi agar tidak ada peminjaman yang tumpang tindih (pisahkan struct menjadi beberapa komponen)
   - Gunakan `Cell`/`RefCell` untuk interior mutability (hanya untuk single-threaded)
   - Gunakan kurung kurawal pembatas `{ }` untuk membatasi masa peminjaman

### Debugging Async

```bash
# Aktifkan runtime tracing dari Tokio
RUSTFLAGS="--cfg tokio_unstable" cargo build
# Kemudian gunakan tokio-console untuk inspeksi runtime secara langsung (live)
tokio-console
```

Langkah validasi untuk masalah async:
1. Periksa `spawn_blocking` di sekitar I/O yang bersifat blocking
2. Verifikasi semua titik `.await` — apakah ada yang menahan lock melewati titik tersebut?
3. Cari percabangan `select!` yang tidak bersifat cancellation-safe (aman terhadap pembatalan)
4. Jalankan dengan `tokio::time::pause()` pada tes untuk pewaktuan (timing) yang deterministik

### Debugging Makro

```bash
# Perluas semua makro di sebuah file tertentu
cargo expand --lib path::to::module

# Perluas hanya makro derive
cargo expand --lib path::to::module 2>&1 | grep -A 50 "impl"
```

### Deteksi Unsafe / Undefined Behavior

```bash
# Jalankan test di bawah Miri (mendeteksi UB, use-after-free, unaligned access)
cargo +nightly miri test

# Flag Miri yang umum digunakan
MIRIFLAGS="-Zmiri-backtrace=full" cargo +nightly miri test
```

---

## Fase 6: Penyesuaian Keyakinan (Confidence)

| Bukti | Dampak Keyakinan |
|---|---|
| Error `cargo check` menunjuk langsung ke baris | Tinggi — error compiler selalu presisi |
| Peringatan `cargo clippy` cocok dengan gejala | Menengah-Tinggi — Clippy menangkap banyak bug nyata |
| `miri` melaporkan laporan Undefined Behavior (UB) | **Pasti (Definitive)** untuk blok kode unsafe paths |
| `cargo expand` menunjukan generasi kode tak terduga| Tinggi — mengonfirmasi isu terkait makro |
| Pola "sukses di debug, gagal di release" | Kemungkinan UB atau pengurutan yang sensitif terhadap optimasi |

---

## Referensi Singkat: Kode Error → Tindakan Pertama

| Tipe Error | Tindakan Pertama |
|---|---|
| `E0382` (penggunaan value yang di-move) | Cek apakah value dapat di-borrow daripada di-move |
| `E0502` (borrow berlawanan) | Identifikasi dua peminjaman (borrows) tersebut, pisahkan cakupan/scopenya|
| `E0106` (missing lifetime) | Tambahkan parameter lifetime, periksa apakah tipe owned lebih baik |
| `E0277` (trait tidak terpenuhi) | Periksa batasan `Send`/`Sync`, cari tipe non-Send di dalam async |
| `E0308` (type mismatch) | Periksa implementasi `From`/`Into`, verifikasi batasan (constraints) tipe generiknya |
| Runtime panic | `RUST_BACKTRACE=1 cargo test` — baca backtrace-nya |
| Segfault / UB | `cargo +nightly miri test` — Miri akan menemukannya |
| Macro error | `cargo expand` pada modul — baca kode yang dihasilkan makronya |

---

## Prinsip Terkait
- Idiom dan Keamanan Rust @rust-idioms-and-safety.md
- Prinsip Penanganan Error @error-handling-principles.md
- Prinsip Konkurensi dan Threading @concurrency-and-threading-principles.md
- Strategi Pengujian @testing-strategy.md
