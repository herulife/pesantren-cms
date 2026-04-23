---
trigger: model_decision
description: Saat bekerja pada aplikasi mobile Flutter atau React Native, menyiapkan struktur proyek mobile
---

## Tata Letak Flutter/Mobile

Gunakan struktur ini untuk aplikasi mobile Flutter atau React Native. Prinsip irisan vertikal berlaku — fitur adalah modul yang mandiri.

```
  apps/
    mobile/                           # Kode sumber aplikasi mobile (Flutter)
      lib/
        core/                         # Kebutuhan dasar (bagian "Framework")
          di/                         # Pengaturan injeksi dependensi (get_it, riverpod)
            injection.dart            # Service locator / registrasi provider
          network/                    # Pengaturan klien HTTP, interceptor
            api_client.dart           # Klien Dio/http dengan konfigurasi dasar
            api_interceptor.dart      # Interceptor token auth, logging
          storage/                    # Abstraksi penyimpanan lokal
            local_storage.dart        # Wrapper SharedPreferences / Hive
          theme/                      # Tema aplikasi
            app_theme.dart            # ThemeData, skema warna
            app_typography.dart       # TextStyle, keluarga font
          router/                     # Navigasi / routing
            app_router.dart           # Konfigurasi GoRouter / auto_route
          constants/                  # Konstanta seluruh aplikasi

        features/                     # Fitur Bisnis (Irisan Vertikal)
          task/                       # Fitur manajemen tugas
            # --- Presentasi ---
            screens/
              task_list_screen.dart    # Layar penuh (target rute)
              task_detail_screen.dart
            widgets/                  # Widget spesifik fitur
              task_card.dart
              task_form.dart
              task_card_test.dart      # Widget test
            # --- Manajemen Status ---
            state/
              task_cubit.dart          # BLoC/Cubit atau provider Riverpod
              task_state.dart          # Kelas status (loading, loaded, error)
              task_cubit_test.dart     # Unit test untuk logika status
            # --- Domain (Logika Bisnis) ---
            models/
              task.dart               # Model domain (freezed/equatable)
              task.g.dart             # Kode yang dihasilkan (json_serializable)
            logic/
              task_logic.dart         # Aturan bisnis murni
              task_logic_test.dart    # Unit test (fungsi murni)
            # --- Data (Abstraksi I/O) ---
            repository/
              task_repository.dart    # Interface repositori abstrak
              task_repository_impl.dart # Implementasi (API + cache)
              task_repository_mock.dart # Mock untuk pengujian
            api/
              task_api.dart           # Panggilan REST API (Dio)
              task_api_test.dart      # Test integrasi API
          auth/                       # Fitur autentikasi
            ...
          settings/                   # Fitur pengaturan
            ...

        shared/                       # Dibagikan lintas fitur
          widgets/                    # Komponen UI yang dapat digunakan ulang (TANPA logika domain)
            app_button.dart
            app_text_field.dart
            loading_indicator.dart
          utils/                      # Fungsi utilitas murni
            date_formatter.dart
            validators.dart
          models/                     # Model data bersama
            api_response.dart
            pagination.dart

      test/                           # Direktori test (mirip lib/)
        features/
          task/
            task_cubit_test.dart
            task_logic_test.dart
        integration_test/             # Test integrasi / E2E
          task_flow_test.dart

      pubspec.yaml                    # Dependensi
      analysis_options.yaml           # Aturan lint
```

**Perbedaan utama dari frontend web:**
- `screens/` menggantikan `views/` — mobile menggunakan navigasi berbasis layar
- `widgets/` menggantikan `components/` — terminologi Flutter
- `state/` menggantikan `store/` — BLoC/Cubit/Riverpod bukan Pinia/Redux
- `repository/` menggantikan `api/` — mobile sering meng-cache data secara lokal
- `core/di/` menangani injeksi dependensi (get_it, riverpod)

### Aturan Terkait
- Struktur Proyek @project-structure.md (filosofi inti)
