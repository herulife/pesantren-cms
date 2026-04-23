---
trigger: model_decision
description: Saat bekerja pada proyek Rust atau Cargo, menulis kode Rust, atau mereview idiom dan praktik keamanan Rust
---

## Idiom dan Keamanan Rust

### Filosofi Inti

Sistem tipe dan model kepemilikan Rust adalah alat utama Anda untuk kebenaran. Andalkan kompiler — itu adalah sekutu terkuat Anda. Tulis kode yang idiomatis, aman, dan ekspresif.

### Kepemilikan dan Peminjaman

1. **Utamakan peminjaman (`&T`, `&mut T`) daripada kloning**
   - Jangan pernah `.clone()` untuk membungkam borrow checker tanpa komentar `// CLONE:` yang menjelaskan alasannya
   - Gunakan `Cow<'_, T>` saat fungsi mungkin atau mungkin tidak memerlukan kepemilikan
   - Utamakan `&str` daripada `String` dalam parameter fungsi, `&[T]` daripada `Vec<T>`

2. **Minimalkan data yang dimiliki dalam struct**
   - Gunakan referensi dengan lifetime eksplisit saat struct berumur pendek
   - Gunakan tipe yang dimiliki (`String`, `Vec<T>`) saat struct harus hidup lebih lama dari inputnya

3. **Hindari `Arc<Mutex<T>>` yang tidak perlu**
   - Jika data mengalir satu arah, gunakan channel (`tokio::sync::mpsc`)
   - Jika data banyak dibaca, pertimbangkan `RwLock` daripada `Mutex`
   - Jika data tidak dapat diubah setelah inisialisasi, gunakan `Arc<T>` tanpa lock

### Penanganan Error

1. **Gunakan operator `?` untuk propagasi — jangan pernah `unwrap()` di kode produksi**
   - `unwrap()` dan `expect()` hanya dapat diterima di:
     - Test (`#[test]`, `#[tokio::test]`)
     - Operasi yang tidak mungkin gagal di mana invarian terbukti (dokumentasikan dengan komentar `// SAFETY:`)
     - Fungsi `main()` CLI dengan pesan error yang jelas melalui `expect("alasan")`

2. **Pilih crate error berdasarkan konteks:**
   - Kode library: `thiserror` — definisikan enum error bertipe
   - Kode aplikasi: `anyhow` — rangkaian error yang ergonomis
   - Jangan pernah mencampur: crate library tidak boleh bergantung pada `anyhow`

3. **Desain tipe error:**

```rust
// ✅ Bagus — bertipe, dapat di-match
#[derive(Debug, thiserror::Error)]
pub enum PathfinderError {
    #[error("file tidak ditemukan: {path}")]
    FileNotFound { path: PathBuf },
    #[error("parsing AST gagal: {0}")]
    ParseError(String),
    #[error(transparent)]
    Io(#[from] std::io::Error),
}

// ❌ Buruk — bertipe string, tidak dapat di-match
fn do_thing() -> Result<(), String> { ... }
```

### Async dan Konkurensi

1. **Gunakan `tokio` sebagai runtime async**
   - Tandai titik masuk async dengan `#[tokio::main]` atau `#[tokio::test]`
   - Utamakan `tokio::spawn` untuk tugas bersamaan, bukan `std::thread::spawn`
   - Gunakan `tokio::select!` untuk berlomba future, bukan polling manual

2. **Keamanan pembatalan (cancellation safety):**
   - Utamakan `tokio::sync::mpsc` daripada `tokio::sync::broadcast` kecuali fan-out diperlukan
   - Dokumentasikan perilaku pembatalan pada `async fn` apapun yang memegang sumber daya melintas `.await`
   - Gunakan `tokio_util::sync::CancellationToken` untuk shutdown yang halus

3. **Operasi yang memblokir:**
   - Jangan pernah memanggil I/O yang memblokir di dalam konteks async
   - Gunakan `tokio::task::spawn_blocking` untuk pekerjaan yang berat CPU atau memblokir
   - Gunakan `tokio::fs` daripada `std::fs` di dalam fungsi async

### Kode Unsafe

1. **Nol blok `unsafe` kecuali di batasan FFI**
   - Binding C Tree-sitter dan FFI serupa adalah satu-satunya kasus penggunaan yang valid
   - Setiap blok `unsafe` harus memiliki komentar `// SAFETY:` yang menjelaskan invariannya

2. **Minimalkan permukaan unsafe:**
   - Enkapsulasi `unsafe` dalam fungsi wrapper yang aman
   - API publik wrapper harus aman untuk dipanggil dari konteks manapun
   - Tulis test yang menguji kondisi batas wrapper `unsafe`

3. **Jangan pernah gunakan `unsafe` untuk melewati borrow checker** — restrukturisasi kode sebagai gantinya

### Lifetime dan Generik

1. **Utamakan elisi lifetime `'_` jika memungkinkan**
   - Hanya perkenalkan lifetime bernama saat kompiler memerlukannya atau saat memperjelas maksud
   - Gunakan `'a` untuk parameter lifetime tunggal, nama deskriptif (`'input`, `'query`) untuk beberapa

2. **Pertahankan bound generik tetap sederhana:**
   - Utamakan tipe konkret untuk prototyping, perkenalkan generik saat pola stabil
   - Gunakan `impl Trait` di posisi argumen untuk kasus sederhana
   - Gunakan klausa `where` untuk bound yang kompleks — jangan pernah inline bound yang kompleks di `<...>`

3. **Hindari akrobat lifetime:**
   - Jika anotasi lifetime menjadi kompleks, restrukturisasi untuk menggunakan data yang dimiliki atau `Arc`
   - Pertimbangkan pola "split borrow" untuk menghindari masalah borrow checker dalam metode struct

### Pola Idiomatis

1. **Pola builder** untuk tipe dengan banyak field opsional:
   - Kembalikan `Self` dari metode builder untuk chaining
   - `build()` mengembalikan `Result<T, BuildError>`, bukan `T`

2. **Pola newtype** untuk tipe domain:
   - Bungkus primitif: `struct UserId(u64)`, bukan `u64` telanjang
   - Implementasikan `Deref` hanya saat newtype benar-benar "adalah" tipe dalamnya

3. **Pola typestate** untuk mesin status:
   - Status berbeda = tipe berbeda — transisi yang tidak valid adalah error kompilasi
   - Gunakan ini untuk implementasi protokol dan manajemen siklus hidup

4. **Konversi `From`/`Into`:**
   - Implementasikan `From<A> for B` (jangan pernah `Into` secara langsung)
   - Gunakan `impl From<X> for Error` dengan atribut `#[from]` dari `thiserror`

### Pengujian

1. **Organisasi test:**
   - Unit test: `#[cfg(test)] mod tests` di bagian bawah setiap modul
   - Test integrasi: direktori `tests/` di root crate
   - Gunakan `#[tokio::test]` untuk test async

2. **Penamaan test:** `fn test_<fungsi>_<skenario>_<yang_diharapkan>()` (snake_case)

3. **Assertion:**
   - Gunakan `assert_eq!` / `assert_ne!` daripada `assert!(a == b)` — pesan error lebih baik
   - Gunakan `assert!(matches!(result, Ok(_)))` untuk pemeriksaan varian enum

4. **Property testing:** Gunakan `proptest` atau `quickcheck` untuk fungsi dengan ruang input yang luas

### Clippy dan Formatting

1. **`cargo clippy` harus lulus dengan nol peringatan** sebelum commit apapun
   - Gunakan `#[allow(clippy::...)]` hanya dengan komentar `// ALLOW:` yang menjelaskan alasannya
   - Utamakan memperbaiki lint daripada menekannya

2. **`cargo fmt` tidak bisa ditawar** — semua kode harus diformat

3. **Konfigurasi Clippy tingkat proyek yang direkomendasikan (`.clippy.toml` atau `Cargo.toml`):**

```toml
[lints.clippy]
pedantic = "warn"
unwrap_used = "deny"
expect_used = "warn"
```

### Manajemen Dependensi

1. **Minimalkan jumlah dependensi** — setiap dependensi adalah permukaan serangan dan biaya waktu kompilasi
2. **Kunci versi major** di `Cargo.toml` — gunakan `dep = "1"` bukan `dep = "*"`
3. **Audit secara teratur** — jalankan `cargo audit` untuk memeriksa kerentanan yang diketahui
4. **Utamakan crate yang terpelihara dengan baik** — periksa jumlah unduhan, tanggal commit terakhir, dan issue tracker

### Prinsip Terkait
- Prinsip Penanganan Error @error-handling-principles.md
- Prinsip Konkurensi dan Threading @concurrency-and-threading-principles.md
- Mandat Konkurensi dan Threading @concurrency-and-threading-mandate.md
- Prinsip Optimasi Performa @performance-optimization-principles.md
- Prinsip Manajemen Sumber Daya dan Memori @resources-and-memory-management-principles.md
- Mandat Keamanan @security-mandate.md
- Idiom dan Konvensi Kode @code-idioms-and-conventions.md
- Strategi Pengujian @testing-strategy.md
- Prinsip Manajemen Dependensi @dependency-management-principles.md