---
trigger: model_decision
description: Saat bekerja pada proyek Rust atau Cargo, menyiapkan struktur proyek Rust, atau mengorganisir crate dan workspace Rust
---

## Tata Letak Rust/Cargo

Gunakan struktur-struktur ini untuk proyek Rust. Prinsip irisan vertikal berlaku — fitur adalah modul, bukan layer.

### Crate Binary Tunggal

Untuk alat CLI, server mandiri, dan aplikasi bertujuan tunggal.

```
  project-root/
    Cargo.toml                        # Manifes paket + dependensi
    build.rs                          # Skrip build (opsional — untuk FFI, codegen)
    src/
      main.rs                        # Titik masuk: parsing CLI, startup server, menghubungkan dependensi
      lib.rs                         # Root pustaka — mengekspor ulang modul publik (memungkinkan test integrasi)

      # --- Kebutuhan Dasar (bagian "Platform") ---
      config.rs                      # Pemuatan konfigurasi (env var, file konfigurasi)
      error.rs                       # Tipe error seluruh aplikasi (enum thiserror)
      telemetry.rs                   # Pengaturan tracing/logging (tracing, tracing-subscriber)

      # --- Fitur Bisnis (Irisan Vertikal) ---
      features/
        mod.rs                       # Mengekspor ulang modul fitur
        task/
          mod.rs                     # API publik fitur ini — mengekspor ulang tipe + service
          service.rs                 # Service fitur (orkestrasi logika bisnis)
          logic.rs                   # Aturan bisnis murni (tanpa I/O, mudah diuji)
          models.rs                  # Struct domain (Task, NewTaskRequest)
          error.rs                   # Tipe error spesifik fitur
          repository.rs              # Definisi trait storage
          postgres.rs                # Implementasi Postgres dari trait repositori
        auth/
          mod.rs
          service.rs
          logic.rs
          models.rs
          ...

      # --- Layer Delivery (HTTP/gRPC) ---
      handlers/
        mod.rs
        task_handler.rs              # Handler HTTP untuk fitur task (extractor axum/actix)
        auth_handler.rs
      router.rs                      # Definisi rute, stack middleware

    tests/                           # Test integrasi (dikompilasi sebagai crate terpisah, akses hanya API publik)
      common/
        mod.rs                       # Fixture test bersama, helper, pengaturan database test
      task_api_test.rs               # Test integrasi API penuh
      auth_flow_test.rs

    benches/                         # Benchmark (criterion)
      task_benchmark.rs
```

**Konvensi utama Rust:**
- `src/lib.rs` + `src/main.rs` — memungkinkan test integrasi terhadap API publik `lib.rs`
- `mod.rs` mengekspor ulang — setiap `mod.rs` fitur adalah batas publiknya
- `error.rs` per fitur — error bertipe dengan `thiserror`, dikomposisi di level aplikasi dengan `#[from]`
- Direktori `tests/` — test integrasi hanya melihat API publik, menegakkan enkapsulasi
- Tidak ada `controllers/` atau `services/` di level teratas — fitur adalah organisasi level teratas

---

### Crate Library

Untuk pustaka yang dapat dipublikasikan, SDK, dan komponen yang dapat digunakan ulang.

```
  project-root/
    Cargo.toml                        # Manifes paket (target lib)
    src/
      lib.rs                         # Root crate — permukaan API publik, ekspor ulang modul
      parser.rs                      # Modul publik
      ast.rs                         # Modul publik
      error.rs                       # Tipe error publik (thiserror)
      internal/                      # Detail implementasi privat
        mod.rs
        optimizer.rs
        cache.rs

    examples/                        # Contoh yang dapat dijalankan (cargo run --example)
      basic_usage.rs
      advanced_config.rs

    tests/                           # Test integrasi
      parsing_test.rs

    benches/                         # Benchmark
      parser_benchmark.rs
```

---

### Cargo Workspace (Multi-Crate)

Untuk proyek kompleks dengan beberapa crate internal. Ini adalah struktur yang direkomendasikan untuk **proyek tipe Pathfinder** di mana subsistem yang berbeda mendapat manfaat dari unit kompilasi terpisah dan batasan dependensi yang eksplisit.

```
  project-root/
    Cargo.toml                        # Manifes [workspace] — mendaftar semua anggota
    Cargo.lock                        # Versi dependensi yang dikunci (di-commit untuk binary)

    crates/
      pathfinder/                     # Crate binary utama (titik masuk, penghubungan)
        Cargo.toml                    # Bergantung pada crate workspace lain
        src/
          main.rs                    # Parsing CLI, pengaturan transport MCP
          lib.rs
          config.rs
          error.rs
          mcp/                       # Penanganan protokol MCP
            mod.rs
            transport.rs             # Transport stdio
            tools.rs                 # Registrasi + dispatch alat

      pathfinder-treesitter/          # Crate engine Tree-sitter
        Cargo.toml
        build.rs                     # Mengompilasi grammar C melalui crate cc
        src/
          lib.rs
          parser.rs                  # Parsing yang sadar bahasa
          queries.rs                 # Pemuatan + eksekusi query .scm
          semantic_path.rs           # Resolusi path semantik
          repo_map.rs                # Implementasi get_repo_map
          cache.rs                   # Cache AST dengan re-parse inkremental
        queries/                     # File query .scm yang dibundel
          highlights-go.scm
          highlights-typescript.scm
          highlights-python.scm

      pathfinder-lsp/                 # Crate klien LSP
        Cargo.toml
        src/
          lib.rs
          client.rs                  # Klien JSON-RPC melalui stdio
          lifecycle.rs               # Spawn, idle timeout, pemulihan crash
          capabilities.rs            # Deteksi kemampuan + degradasi
          definition.rs              # Implementasi get_definition
          call_hierarchy.rs          # Implementasi analyze_impact

      pathfinder-search/              # Crate integrasi Ripgrep
        Cargo.toml
        src/
          lib.rs
          search.rs                  # Implementasi search_codebase
          filter.rs                  # Filtering sadar-AST (code_only, comments_only)

      pathfinder-edit/                # Crate Shadow Editor
        Cargo.toml
        src/
          lib.rs
          surgical_edit.rs           # Implementasi pipeline edit
          occ.rs                     # Hash versi + logika OCC
          diagnostic_diff.rs         # Perbandingan diagnostik sebelum/sesudah

      pathfinder-common/              # Tipe bersama dan utilitas
        Cargo.toml
        src/
          lib.rs
          types.rs                   # Tipe bersama (SemanticPath, VersionHash, dll.)
          sandbox.rs                 # Penegakan sandbox tiga tingkat
          file_watcher.rs            # Pemantauan file + log penulisan yang diharapkan
          error.rs                   # Tipe error umum

    tests/                           # Test integrasi tingkat workspace
      integration/
        full_pipeline_test.rs        # Test panggilan alat MCP end-to-end

    config/                          # Konfigurasi default
      pathfinder.config.default.json
```

**Perbedaan utama dari tata letak Go/Node:**
- `crates/` menggantikan `apps/` — Workspace Cargo dengan dependensi antar-crate yang eksplisit di `Cargo.toml`
- Setiap crate memiliki `Cargo.toml` sendiri — dependensi tercakup, dikompilasi terpisah, menegakkan batasan
- `build.rs` — Skrip build spesifik Rust untuk kompilasi FFI (grammar C untuk tree-sitter)
- `Cargo.lock` di-commit — praktik standar untuk proyek binary (bukan untuk crate library)
- Tidak ada `node_modules/`, `vendor/` — dependensi dikelola oleh Cargo secara global di `~/.cargo/`
- Flag fitur di `Cargo.toml` — gunakan `[features]` untuk fungsionalitas opsional daripada env var waktu build

### Aturan Terkait
- Struktur Proyek @project-structure.md (filosofi inti)
- Idiom dan Keamanan Rust @rust-idioms-and-safety.md
