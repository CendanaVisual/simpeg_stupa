# SIPEG STUPA - Sistem Absensi Pegawai Canggih

Aplikasi Sistem Informasi Manajemen Presensi & Kepegawaian berbasis Web/Mobile untuk **STUPA**, dirancang dengan arsitektur modern berstandar enterprise.

Aplikasi ini menggunakan **Next.js (React + Node.js)**, **Neon Database (Serverless PostgreSQL)**, dan **Cloudinary**, yang siap di-*deploy* langsung ke **Vercel** dan di-*push* ke **GitHub**.

---

## 🚀 Fitur Unggulan

1. **Multi-Portal Authentication**:
   - Single portal login cerdas yang mengenali Role **Admin** dan **Pegawai** secara otomatis.
   - Keamanan sandi dengan algoritma enkripsi **bcrypt** dan session JWT (HTTP-Only Cookie).
   - Fitur **Reset Sandi** oleh Admin jika pegawai lupa kata sandi (kembali ke default: `stupa123`).

2. **Geofencing GPS dengan Rumus Haversine**:
   - Menghitung jarak presisi antara koordinat GPS pegawai saat absen dengan koordinat kantor.
   - Absensi otomatis **ditolak** jika berada di luar batas radius maksimal kantor (default: 100 meter).
   - Mendukung fitur **Bypass Geofencing** jika pegawai memiliki status pengajuan **Dinas Luar** yang telah disetujui.

3. **Facial Snapshot Terintegrasi Cloudinary**:
   - Pengambilan foto selfie wajah secara *realtime* langsung dari kamera perangkat/HP.
   - Foto dikompres dan diunggah langsung ke Cloudinary SDK (`sipeg_stupa/absensi/`).
   - Database Neon hanya menyimpan tautan teks URL Cloudinary yang aman dan hemat penyimpanan.

4. **Sistem Pengajuan Cuti & Dinas Khusus**:
   - **Cuti Tahunan**: Otomatis mengecualikan hari Sabtu & Minggu (hanya menghitung hari kerja efektif). Kuota sisa cuti pegawai otomatis dipotong oleh *PostgreSQL Trigger Function* saat Admin menyetujui (*Approved*).
   - **Cuti Sakit**: Wajib melampirkan berkas/foto surat keterangan dokter.
   - **Dinas Luar**: Wajib melampirkan surat tugas/kegiatan. Memberikan izin bypass radius GPS saat absen.

5. **Dashboard Administrator Enterprise**:
   - **Persetujuan (Approval)**: Verifikasi pengajuan cuti & dinas luar dalam 1-klik dengan catatan admin.
   - **Manajemen Pegawai**: Tambah, ubah data, atur kuota cuti tahunan, dan reset sandi pegawai.
   - **Pengaturan Kantor**: Ubah Latitude, Longitude, Radius Geofencing, Jam Masuk (07:30), dan Jam Pulang (16:00). Dilengkapi fitur **"📍 Gunakan Lokasi GPS Saya Saat Ini"** untuk kalibrasi kantor secara instan.
   - **Rekapitulasi Absensi**: Filter periode bulan (Januari - Desember) dan tahun (2025 - 2050), statistik kehadiran, ekspor data ke format **Excel / CSV**, dan cetak dokumen laporan resmi (**Print PDF**).

---

## 🛠️ Tech Stack & Kredensial

- **Framework**: Next.js 14 (App Router, React 18, TypeScript, Tailwind CSS, Lucide Icons)
- **Database**: Neon Serverless PostgreSQL
- **Media Storage**: Cloudinary SDK (Direct Cloud Storage)
- **Deployment Target**: Vercel & GitHub

---

## ⚙️ Variabel Lingkungan (.env.local)

Buat file `.env.local` di direktori utama:

```env
DATABASE_URL=postgresql://neondb_owner:npg_M5wp6kKlSfnd@ep-silent-base-b33qyxbo-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
CLOUDINARY_CLOUD_NAME=kk5ip5eb
CLOUDINARY_API_KEY=587154839764425
CLOUDINARY_API_SECRET=pPqZ18ud9drcW8jhywAh5aGyMug
JWT_SECRET=stupa_super_secure_jwt_token_secret_key_2026_xyz
```

---

## 📦 Menjalankan Proyek Secara Lokal

1. **Instalasi Dependensi**:
   ```bash
   npm install
   ```

2. **Eksekusi Migrasi & Seeder Database Neon**:
   ```bash
   npm run migrate
   ```
   *Script ini akan membuat tabel, fungsi rumus Haversine, fungsi penghitung hari kerja, trigger pemotongan cuti, serta men-seed akun default Administrator dan Pegawai Demo.*

3. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```
   Buka peramban di: `http://localhost:3000`

---

## 🔑 Akun Default untuk Pengujian

| Role | Email / Username | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@stupa.ac.id` / `admin` | `admin123` | Akses penuh dashboard Admin, Approval, & Rekap |
| **Pegawai Demo** | `made.artha@stupa.ac.id` / `made_artha` | `stupa123` | Akses presensi selfie, pengajuan cuti & dinas |

---

## 🌐 Panduan Upload ke GitHub & Hosting di Vercel

### Langkah 1: Push ke Repository GitHub
Jalankan perintah berikut di terminal:
```bash
git init
git add .
git commit -m "feat: inisialisasi sistem absensi pegawai stupa"
git branch -M main
git remote add origin https://github.com/USERNAME_ANDA/sipeg-stupa.git
git push -u origin main
```

### Langkah 2: Deploy ke Vercel (Gratis & Cepat)
1. Buka [Vercel Dashboard](https://vercel.com).
2. Klik tombol **"Add New..."** lalu pilih **"Project"**.
3. Hubungkan akun GitHub Anda dan pilih repository `sipeg-stupa`.
4. Pada bagian **Environment Variables**, tambahkan 5 variabel berikut:
   - `DATABASE_URL`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `JWT_SECRET`
5. Klik **"Deploy"**. Vercel akan secara otomatis membangun aplikasi dalam waktu ~1 menit!
