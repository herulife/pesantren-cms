---
trigger: always_on
---

## Prinsip Desain Inti

### Prinsip SOLID

**Prinsip Tanggung Jawab Tunggal (Single Responsibility Principle/SRP):**

- Setiap kelas, modul, atau fungsi harus memiliki SATU dan HANYA SATU alasan untuk berubah
- Hasilkan unit fungsionalitas yang terfokus dan kohesif
- Jika menjelaskan apa yang dilakukan sesuatu memerlukan kata "dan", kemungkinan besar melanggar SRP

**Prinsip Terbuka/Tertutup (Open/Closed Principle/OCP):**

- Entitas perangkat lunak harus terbuka untuk perluasan tetapi tertutup untuk modifikasi
- Rancang abstraksi (interface, port) yang memungkinkan perubahan perilaku tanpa memodifikasi kode yang ada
- Gunakan komposisi dan injeksi dependensi untuk memungkinkan perluasan

**Prinsip Substitusi Liskov (Liskov Substitution Principle/LSP):**

- Subtipe harus dapat menggantikan tipe dasarnya tanpa mengubah kebenaran program
- Hierarki pewarisan harus mempertahankan konsistensi perilaku
- Jika mengganti subclass merusak fungsionalitas, LSP dilanggar

**Prinsip Segregasi Interface (Interface Segregation Principle/ISP):**

- Klien tidak boleh dipaksa bergantung pada interface yang tidak mereka gunakan
- Buat interface yang terfokus dan spesifik peran daripada yang monolitik
- Banyak interface kecil dan kohesif > satu interface besar dan serbaguna

**Prinsip Inversi Dependensi (Dependency Inversion Principle/DIP):**

- Bergantung pada abstraksi (interface/port), bukan konkresi (implementasi/adapter)
- Modul tingkat tinggi tidak boleh bergantung pada modul tingkat rendah; keduanya harus bergantung pada abstraksi
- Prinsip inti yang memungkinkan arsitektur yang Mengutamakan Testabilitas

### Praktik Desain Esensial

**DRY (Don't Repeat Yourself / Jangan Ulangi Diri Sendiri):**

- Hilangkan duplikasi kode melalui abstraksi yang tepat, utilitas bersama, fungsi yang dapat dikomposisi
- Setiap bagian pengetahuan harus memiliki representasi tunggal yang otoritatif
- Jangan duplikasi logika, algoritma, atau aturan bisnis

**YAGNI (You Aren't Gonna Need It / Anda Tidak Akan Membutuhkannya):**

**KRITIS:** Pemeliharaan kode selalu diutamakan

- Hindari mengimplementasikan fungsionalitas sebelum benar-benar diperlukan
- Jangan menambah fitur berdasarkan spekulasi tentang kebutuhan masa depan
- Bangun untuk kebutuhan hari ini, refaktor ketika kebutuhan berubah

**KISS (Keep It Simple, Stupid / Buat Tetap Sederhana):**

**KRITIS:** Pemeliharaan kode selalu diutamakan

- Utamakan solusi yang sederhana (mudah dipelihara) dan lugas daripada yang kompleks dan pintar
- Kompleksitas harus dijustifikasi oleh kebutuhan aktual, bukan fleksibilitas teoretis
- Kode sederhana lebih mudah diuji, dipelihara, dan di-debug

**Pemisahan Tanggung Jawab (Separation of Concerns):**

- Bagi fungsionalitas program menjadi bagian-bagian terpisah dengan tumpang tindih minimal
- Setiap tanggung jawab harus diisolasi dalam modul atau layer-nya sendiri

**Komposisi Lebih Baik dari Pewarisan (Composition Over Inheritance):**

- Utamakan komposisi objek dan delegasi daripada pewarisan kelas untuk penggunaan ulang kode
- Komposisi lebih fleksibel dan lebih mudah diuji
- Gunakan interface/trait untuk polimorfisme daripada hierarki pewarisan yang dalam

**Prinsip Kejutan Minimum (Principle of Least Astonishment):**

- Kode harus berperilaku sesuai yang secara alami diharapkan oleh pengguna dan pemelihara
- Hindari perilaku yang mengejutkan atau kontra-intuitif
- Ikuti konvensi dan pola yang sudah mapan

**Pengalaman Pengguna vs Pemeliharaan:**

- Baik pengalaman pengguna DAN pemeliharaan kode sama-sama penting
- Ketika bertentangan, **utamakan kode yang dapat dipelihara** yang dapat berkembang
- UX yang buruk dari kode yang bersih dapat diperbaiki; kode yang buruk dari tekanan UX menjadi utang teknis
- Pemeliharaan memungkinkan peningkatan UX di masa depan
- Jangan pernah mengorbankan kualitas kode untuk keuntungan UX jangka pendek