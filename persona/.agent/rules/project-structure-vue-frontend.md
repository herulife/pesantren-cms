---
trigger: model_decision
description: Saat bekerja pada proyek frontend web menggunakan Vue, React, Svelte, atau framework serupa, menyiapkan struktur proyek frontend
---

## Tata Letak Vue/React Frontend

Gunakan struktur ini untuk aplikasi frontend web. Prinsip irisan vertikal berlaku — fitur adalah modul yang mandiri, tidak tersebar di seluruh folder global.

```
  apps/
    frontend/                         # Kode sumber aplikasi frontend
      src/
        assets/                       # Font, Gambar
        features/                     # Fitur bisnis diorganisir sebagai irisan vertikal. Setiap fitur MANDIRI.
          task/                       # Manajemen tugas
            components/               # Komponen spesifik Fitur Task di SINI, JANGAN taruh komponen fitur di folder level atas
              TaskForm.vue
              TaskListItem.vue
              TaskFilters.vue
              TaskInput.vue
              TaskInput.spec.ts       # Unit test komponen
            store/
              task.store.ts           # Store Pinia
              task.store.spec.ts      # Unit test store
            api/
              task.api.ts             # interface TaskAPI
              task.api.backend.ts     # Implementasi produksi
              task.api.mock.ts        # Implementasi test
            services/
              task.service.ts         # Logika bisnis
              task.service.spec.ts    # Unit test logika
            types/                    # Interface TS untuk tugas (misalnya interface CreateTaskDTO)
            composables/              # Hook spesifik Fitur Task (misalnya useTaskFilters.ts)
            index.ts                  # Ekspor publik. Ekspor HANYA yang diperlukan oleh `views/`
          order/
        composables/                  # Logika reaktif global (useAuth, useTheme)
        components/                   # Komponen Bersama (Tombol, Input) - UI Bodoh, Tanpa Logika Domain. JANGAN taruh komponen fitur DI SINI
          ui/                         # Komponen UI (Atom & Molekul) Primitif UI murni yang dapat digunakan ulang. TANPA logika domain, TANPA pengetahuan fitur.
            BaseButton.vue
            BaseButton.spec.ts        # Unit test untuk status tombol
            types.ts                  # Tipe/interface UI bersama
            index.ts                  # Barrel export untuk impor mudah
          layout/                     # Komponen Tata Letak (Organisme) Struktur UI komposit yang menggabungkan beberapa komponen UI. Masih dapat digunakan ulang, tetapi lebih kompleks.
            AppHeader.vue             # Header aplikasi dengan nav, logo, menu pengguna
            AppSidebar.vue            # Struktur navigasi sidebar
            ErrorBoundary.vue         # Wrapper tampilan error
            EmptyState.vue            # Placeholder daftar kosong
        layouts/                      # Shell aplikasi (wrapper Sidebar, Navbar)
          MainLayout.vue              # Berisi Navbar, Sidebar, Footer
          AuthLayout.vue              # Tata letak minimal untuk Login/Register
        views/                        # Titik masuk rute ("Perekat")
          HomeView.vue                # Mengimpor dari features/analytics
          TaskView.vue                # Mengimpor dari features/task
        utils/                        # Fungsi helper murni, tanpa status. Tanpa pengetahuan domain, tanpa reaktivitas Vue, (misalnya wrapper date-fns, matematika).
        router/                       # Definisi rute
        plugins/                      # Konfigurasi pustaka (Axios, I18n)
        App.vue                       # Komponen root (menampung <router-view>)
        main.ts                       # Titik masuk (bootstrap plugin & mount app)
      ...
```

**Konvensi utama frontend:**
- `features/` untuk irisan vertikal — setiap fitur mengekspor hanya yang `views/` butuhkan melalui `index.ts`
- `components/ui/` untuk UI bodoh yang **dibagikan** (tombol, input) — TANPA logika domain, TANPA pengetahuan fitur
- `components/layout/` untuk struktur UI komposit (header, sidebar)
- `views/` adalah titik masuk rute — mereka menyusun fitur, bukan mengimplementasikannya
- Komponen fitur berada **di dalam** fitur, BUKAN di `components/` level atas
- `composables/` di root untuk logika reaktif global; hook spesifik fitur di dalam fitur

> Struktur ini berlaku sama untuk React (.tsx), Vue (.vue), dan Svelte (.svelte). Ganti ekstensi file komponen dan manajemen status (Redux/Zustand untuk React, Pinia untuk Vue) sesuai kebutuhan.

### Aturan Terkait
- Struktur Proyek @project-structure.md (filosofi inti)
