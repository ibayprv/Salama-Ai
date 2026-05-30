# Product Requirements Document (PRD)
## Salama AI — Kamus Cerdas Bahasa Daerah Ternate dan Sula

---

**Versi:** 1.0  
**Tanggal:** 31 Mei 2026  
**Penulis:** Muhamad Ikbal Wambes  
**Program:** Duta Bahasa — Program Kerja 1  
**Institusi:** Universitas Khairun Ternate  
**Status:** Draft

---

## 1. Latar Belakang

Bahasa daerah Ternate dan Sula adalah bagian dari warisan budaya Maluku Utara yang kini menghadapi ancaman kepunahan. Generasi muda semakin jarang menggunakan kedua bahasa ini dalam kehidupan sehari-hari. Tidak adanya media digital yang mudah diakses untuk belajar dan mencari kosakata bahasa daerah menjadi salah satu faktor utama.

Salama AI hadir sebagai solusi berbasis teknologi untuk melestarikan bahasa daerah Ternate dan Sula melalui platform kamus digital yang cerdas, interaktif, dan mudah digunakan oleh siapa saja.

Sebagai mahasiswa Teknik Informatika, proyek ini juga menjadi bentuk implementasi ilmu informatika dalam program Duta Bahasa — menghubungkan teknologi dengan pelestarian budaya lokal.

---

## 2. Tujuan Produk

- Menyediakan kamus digital bahasa Ternate dan Sula yang akurat dan mudah diakses
- Memberikan pengalaman belajar bahasa daerah yang interaktif melalui fitur kuis
- Membangun sistem koreksi kosakata berbasis komunitas agar data terus berkembang dan akurat
- Menyediakan data penggunaan yang dapat dilaporkan kepada pemangku kepentingan
- Menjadi media promosi pelestarian bahasa daerah Maluku Utara

---

## 3. Pengguna Sasaran

| Segmen | Deskripsi |
|--------|-----------|
| Pelajar dan mahasiswa | Generasi muda yang ingin belajar bahasa daerah |
| Masyarakat umum | Siapa saja yang ingin mencari arti kata bahasa Ternate dan Sula |
| Peneliti dan akademisi | Yang membutuhkan referensi kosakata bahasa daerah |
| Pengajar bahasa | Guru yang ingin menggunakan media digital dalam pembelajaran |
| Dewan juri Duta Bahasa | Sebagai bukti luaran program kerja yang nyata dan terukur |

---

## 4. Ruang Lingkup Produk

### 4.1 Yang Termasuk dalam Scope

- Website kamus bahasa daerah Ternate (termasuk dialek Melayu Ternate dan Tidore) dan Sula
- Fitur pencarian kata dengan hasil lengkap
- Chatbot AI yang terkoneksi dengan dataset bahasa daerah
- Kuis interaktif berbasis dataset
- Sistem rating dan ulasan pengguna
- Counter jumlah pengunjung real-time
- Fitur koreksi kosakata berbasis komunitas (Community Correction System)
- Panel admin untuk manajemen data

### 4.2 Yang Tidak Termasuk dalam Scope (Versi 1.0)

- Fitur audio pengucapan kata
- Dukungan bahasa daerah selain Ternate dan Sula
- Aplikasi mobile native (Android/iOS)
- Fitur terjemahan kalimat panjang secara otomatis

---

## 5. Fitur Produk

### 5.1 Pencarian Kata

**Deskripsi:** Pengguna dapat mencari kata dalam bahasa Indonesia untuk mendapatkan padanannya dalam bahasa Ternate atau Sula, atau sebaliknya.

**Kriteria penerimaan:**
- Kotak pencarian tersedia di halaman utama
- Hasil pencarian menampilkan: kata, bahasa (Ternate/Sula), dialek, arti, kelas kata, dan contoh kalimat
- Filter tersedia berdasarkan bahasa (Ternate/Sula) dan kelas kata
- Pencarian tidak peka huruf besar/kecil
- Jika kata tidak ditemukan, tampilkan pesan informatif dan saran kata terdekat

**Prioritas:** Tinggi

---

### 5.2 Chatbot AI Salama

**Deskripsi:** Asisten virtual berbasis AI yang dapat menjawab pertanyaan seputar bahasa Ternate dan Sula, memberikan contoh penggunaan kata, dan menjelaskan konteks budaya.

**Kriteria penerimaan:**
- Chatbot dapat menjawab pertanyaan arti kata dalam bahasa Ternate dan Sula
- Chatbot terhubung dengan dataset kosakata yang tersimpan di database
- Chatbot dapat memberikan contoh kalimat dari kata yang ditanyakan
- Riwayat percakapan tersimpan selama sesi berlangsung
- Tersedia tombol reset percakapan

**Prioritas:** Tinggi

---

### 5.3 Kuis Interaktif

**Deskripsi:** Fitur kuis pilihan ganda yang mengambil soal secara acak dari dataset kosakata untuk menguji pengetahuan pengguna.

**Kriteria penerimaan:**
- Setiap sesi kuis terdiri dari 10 soal pilihan ganda
- Setiap soal memiliki 4 pilihan jawaban
- Timer per soal: 15 detik
- Skor ditampilkan di akhir kuis dengan rincian benar/salah
- Pengguna dapat memilih kuis berdasarkan bahasa (Ternate/Sula/Campuran)
- Skor tersimpan dan ditampilkan di halaman statistik

**Prioritas:** Tinggi

---

### 5.4 Community Correction System (Fitur Koreksi Komunitas)

**Deskripsi:** Sistem yang memungkinkan pengguna untuk melaporkan kata yang salah, mengusulkan perbaikan, dan memberikan sumber referensi. Admin kemudian memvalidasi sebelum perubahan diterapkan.

**Mekanisme kerja:**
1. Pengguna melihat kata yang dianggap salah atau kurang tepat
2. Pengguna klik tombol "Laporkan Kata Ini"
3. Pengguna mengisi form: kata yang salah, usulan perbaikan, alasan, dan sumber referensi (opsional)
4. Laporan masuk ke antrian admin dengan status "Menunggu Review"
5. Admin meninjau laporan: bisa Setujui, Tolak, atau Tandai Butuh Verifikasi Ahli
6. Jika disetujui, data otomatis diperbarui di database
7. Pengguna yang melaporkan mendapat notifikasi status laporan

**Kriteria penerimaan:**
- Tombol "Laporkan" tersedia di setiap entri kata
- Form laporan memiliki validasi input
- Admin dapat melihat semua laporan masuk beserta statusnya
- Setiap perubahan tersimpan di log perubahan (change log) untuk transparansi
- Kata yang sedang dalam proses review diberi label khusus

**Prioritas:** Sedang

---

### 5.5 Rating dan Ulasan Pengguna

**Deskripsi:** Pengguna dapat memberikan penilaian terhadap aplikasi Salama AI secara keseluruhan.

**Kriteria penerimaan:**
- Form rating tersedia dengan skala bintang 1-5
- Kolom komentar singkat (maksimal 280 karakter)
- Rata-rata rating ditampilkan di halaman utama
- Semua ulasan ditampilkan di halaman statistik
- Satu perangkat hanya bisa memberikan rating satu kali dalam 24 jam

**Prioritas:** Sedang

---

### 5.6 Counter Pengunjung dan Statistik

**Deskripsi:** Halaman yang menampilkan data penggunaan aplikasi secara real-time dan historis.

**Data yang ditampilkan:**
- Total pengunjung hari ini
- Total pengunjung keseluruhan
- Total kata yang tersedia di database
- Grafik pengunjung per hari (7 hari terakhir)
- Distribusi pencarian berdasarkan bahasa
- Total kuis yang diselesaikan
- Rata-rata skor kuis
- Daftar kata yang paling sering dicari

**Prioritas:** Sedang

---

### 5.7 Panel Admin

**Deskripsi:** Halaman khusus untuk developer/admin mengelola seluruh konten aplikasi.

**Fitur panel admin:**
- Login dengan username dan password
- Tambah kata baru (satu per satu atau import CSV)
- Edit data kata yang sudah ada
- Hapus kata
- Kelola laporan koreksi dari komunitas
- Lihat statistik lengkap penggunaan
- Export data kata ke format CSV

**Prioritas:** Tinggi

---

## 6. Arsitektur Teknis

### 6.1 Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Frontend | Next.js (React) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| AI/Chatbot | Anthropic Claude API atau Google Gemini API |
| Hosting | Vercel atau platform web hosting |
| Version Control | GitHub |

### 6.2 Struktur Database

**Tabel: kata**
```
id            → Primary Key, auto-increment
kata          → text, NOT NULL
bahasa        → text (nilai: "ternate" | "sula")
dialek        → text (nilai: "melayu_ternate" | "tidore" | "sula_standar")
arti          → text, NOT NULL
kelas_kata    → text (nilai: "kata_benda" | "kata_kerja" | "kata_sifat" | "kata_ganti" | "kata_bilangan")
contoh        → text
status        → text (nilai: "aktif" | "dalam_review")
created_at    → timestamp
updated_at    → timestamp
```

**Tabel: laporan_koreksi**
```
id            → Primary Key
kata_id       → Foreign Key → kata.id
pelapor_info  → text
kata_salah    → text
usulan_perbaikan → text
alasan        → text
sumber        → text
status        → text (nilai: "menunggu" | "disetujui" | "ditolak")
created_at    → timestamp
```

**Tabel: rating**
```
id            → Primary Key
bintang       → integer (1-5)
komentar      → text
device_hash   → text (untuk cegah duplikasi)
created_at    → timestamp
```

**Tabel: pengunjung**
```
id            → Primary Key
tanggal       → date
jumlah        → integer
```

**Tabel: skor_kuis**
```
id            → Primary Key
bahasa_kuis   → text
skor          → integer
total_soal    → integer
created_at    → timestamp
```

---

## 7. Desain Antarmuka

### 7.1 Halaman dan Navigasi

```
/ (Beranda)
├── /kamus          → Pencarian dan daftar kata
├── /chatbot        → Antarmuka percakapan AI
├── /kuis           → Kuis interaktif
├── /statistik      → Data penggunaan
└── /admin          → Panel admin (protected)
```

### 7.2 Prinsip Desain

- Tampilan bersih, mudah dibaca, dan responsif di semua ukuran layar
- Mendukung tampilan di HP karena banyak pengguna mengakses lewat HP
- Gunakan warna yang mencerminkan identitas Maluku Utara (biru laut, emas)
- Bahasa antarmuka: Bahasa Indonesia

---

## 8. Keamanan

- Halaman admin dilindungi autentikasi
- API key tersimpan di environment variables, tidak di kode publik
- Input pengguna divalidasi sebelum masuk ke database untuk mencegah injeksi
- Rate limiting pada endpoint pencarian dan chatbot
- File .env tidak pernah diupload ke GitHub

---

## 9. Kriteria Keberhasilan

| Metrik | Target Versi 1.0 |
|--------|------------------|
| Jumlah kata dalam database | Minimal 300 kata (150 Ternate + 150 Sula) |
| Fitur berjalan tanpa bug kritis | 100% fitur utama berfungsi |
| Waktu loading halaman | Kurang dari 3 detik |
| Tampilan responsif | Berfungsi baik di HP dan laptop |
| Data laporan koreksi aktif | Setidaknya 1 alur pelaporan berhasil diuji |

---

## 10. Timeline Pengerjaan

| Hari | Kegiatan |
|------|----------|
| Hari 1 | Setup project Next.js, akun Supabase, struktur folder |
| Hari 2 | Buat database, input dataset kata awal, koneksi Supabase |
| Hari 3 | Halaman beranda dan fitur pencarian kata |
| Hari 4 | Fitur chatbot AI dan kuis interaktif |
| Hari 5 | Fitur rating, Community Correction System, counter pengunjung |
| Hari 6 | Panel admin, testing menyeluruh, perbaikan bug |
| Hari 7 | Build final, deploy, testing di URL live |

---

## 11. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Dataset kata tidak akurat | Tinggi | Validasi dengan penutur asli atau Balai Bahasa sebelum input |
| API AI tidak merespons | Sedang | Siapkan fallback: tampilkan hasil dari database tanpa AI |
| Waktu 1 minggu terlalu singkat | Tinggi | Prioritaskan fitur Tinggi dulu, fitur Sedang bisa ditambah setelah presentasi |
| Hosting bermasalah saat demo | Sedang | Test deploy minimal H-2 sebelum presentasi |

---

## 12. Catatan Khusus untuk Dewan Juri

Salama AI adalah bukti nyata implementasi Teknologi Informatika dalam program Duta Bahasa. Produk ini dapat diakses secara langsung oleh siapa saja melalui browser, dapat digunakan saat kegiatan Bicara Cerdas untuk sesi kuis kelompok, dan akan terus berkembang karena sistem Community Correction memungkinkan penambahan data oleh pengguna secara bertahap.

Luaran yang dapat dilihat langsung oleh juri:
- URL website yang aktif dan dapat diakses
- Demo pencarian kata secara langsung
- Demo kuis interaktif
- Data statistik pengunjung real-time
- Screenshot laporan koreksi komunitas

---

*Dokumen ini akan diperbarui seiring perkembangan pengerjaan produk.*
