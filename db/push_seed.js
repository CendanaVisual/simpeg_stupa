const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const CONNECTION_STRING = 'postgresql://neondb_owner:npg_M5wp6kKlSfnd@ep-silent-base-b33qyxbo-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function pushSeedData() {
  const client = new Client({ connectionString: CONNECTION_STRING });

  try {
    await client.connect();
    console.log('✅ Terhubung ke Neon Database PostgreSQL...');

    // 1. Jalankan Skema DDL
    console.log('📦 Memverifikasi dan memperbarui skema tabel, fungsi, & trigger...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await client.query(schemaSql);
    console.log('✅ Skema DDL sukses diperbarui!');

    // 2. Seed / Update KANTOR
    console.log('🏢 Memasukkan data Kantor Pusat STUPA...');
    await client.query('DELETE FROM kantor;'); // refresh kantor
    const kantorRes = await client.query(`
      INSERT INTO kantor (nama, latitude, longitude, radius_meter, jam_masuk, jam_pulang)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, nama, radius_meter, jam_masuk, jam_pulang;
    `, [
      'Kantor Pusat STUPA',
      -8.6811234,
      115.2145678,
      100,
      '07:30:00',
      '16:00:00'
    ]);
    console.log('✅ Kantor berhasil disimpan:', kantorRes.rows[0]);

    // 3. Hash Passwords
    const adminHash = await bcrypt.hash('admin123', 10);
    const pegawaiHash = await bcrypt.hash('stupa123', 10);

    // 4. Seed PEGAWAI (Admin & Multi Pegawai Demo)
    console.log('👥 Memasukkan akun Administrator dan Pegawai Demo...');
    
    // Hapus data lama agar bersih untuk pengujian
    await client.query('DELETE FROM absensi;');
    await client.query('DELETE FROM pengajuan;');
    await client.query('DELETE FROM pegawai;');

    // Akun Administrator
    const adminRes = await client.query(`
      INSERT INTO pegawai (nip, nama, email, username, password_hash, role, jabatan, sisa_cuti_tahunan)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, nama, email, role;
    `, [
      '198501012010011001',
      'Administrator STUPA',
      'admin@stupa.ac.id',
      'admin',
      adminHash,
      'admin',
      'Kepala Bagian Kepegawaian',
      12
    ]);

    // Pegawai 1: Made Artha
    const p1 = await client.query(`
      INSERT INTO pegawai (nip, nama, email, username, password_hash, role, jabatan, sisa_cuti_tahunan)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, nama, email;
    `, [
      '199205122018011002',
      'Made Artha Wijaya, S.Kom',
      'made.artha@stupa.ac.id',
      'made_artha',
      pegawaiHash,
      'pegawai',
      'Staf IT & Operator SIM',
      12
    ]);

    // Pegawai 2: Ni Putu Ayu
    const p2 = await client.query(`
      INSERT INTO pegawai (nip, nama, email, username, password_hash, role, jabatan, sisa_cuti_tahunan)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, nama, email;
    `, [
      '199408202020122003',
      'Ni Putu Ayu Saraswati, S.Pd',
      'putu.ayu@stupa.ac.id',
      'putu_ayu',
      pegawaiHash,
      'pegawai',
      'Guru / Tenaga Pendidik',
      10
    ]);

    // Pegawai 3: I Wayan Gede
    const p3 = await client.query(`
      INSERT INTO pegawai (nip, nama, email, username, password_hash, role, jabatan, sisa_cuti_tahunan)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, nama, email;
    `, [
      '198903152016031004',
      'I Wayan Gede Dharma, M.Pd',
      'wayan.dharma@stupa.ac.id',
      'wayan_dharma',
      pegawaiHash,
      'pegawai',
      'Wakil Kepala Bagian Kurikulum',
      8
    ]);

    // Pegawai 4: Kadek Dwi
    const p4 = await client.query(`
      INSERT INTO pegawai (nip, nama, email, username, password_hash, role, jabatan, sisa_cuti_tahunan)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, nama, email;
    `, [
      '199611052022012005',
      'Kadek Dwi Lestari, S.E',
      'kadek.dwi@stupa.ac.id',
      'kadek_dwi',
      pegawaiHash,
      'pegawai',
      'Staf Administrasi Keuangan',
      12
    ]);

    const adminId = adminRes.rows[0].id;
    const p1Id = p1.rows[0].id;
    const p2Id = p2.rows[0].id;
    const p3Id = p3.rows[0].id;
    const p4Id = p4.rows[0].id;

    console.log('✅ 5 Akun Pegawai (Admin + 4 Staf) berhasil disimpan.');

    // 5. Seed PENGAJUAN CUTI & DINAS (Untuk Uji Coba Approval Admin)
    console.log('📄 Memasukkan sampel pengajuan cuti & dinas luar...');
    
    // Sample 1: Cuti Tahunan Made Artha (Status: PENDING)
    await client.query(`
      INSERT INTO pengajuan (pegawai_id, tipe_pengajuan, tanggal_mulai, tanggal_selesai, jumlah_hari_kerja, alasan, status_approval)
      VALUES ($1, 'cuti_tahunan', '2026-09-28', '2026-09-30', 3, 'Keperluan upacara adat keluarga di Tabanan', 'pending');
    `, [p1Id]);

    // Sample 2: Cuti Sakit Ni Putu Ayu (Status: PENDING) dengan dokumen dokter
    await client.query(`
      INSERT INTO pengajuan (pegawai_id, tipe_pengajuan, tanggal_mulai, tanggal_selesai, jumlah_hari_kerja, alasan, url_dokumen_pendukung_cloudinary, status_approval)
      VALUES ($1, 'cuti_sakit', '2026-09-24', '2026-09-25', 2, 'Demam berdarah dan flu (istirahat dokter)', 'https://res.cloudinary.com/kk5ip5eb/image/upload/v1727160000/sipeg_stupa/dokumen/surat_dokter_sample.png', 'pending');
    `, [p2Id]);

    // Sample 3: Dinas Luar I Wayan Gede (Status: APPROVED)
    await client.query(`
      INSERT INTO pengajuan (pegawai_id, tipe_pengajuan, tanggal_mulai, tanggal_selesai, jumlah_hari_kerja, alasan, url_dokumen_pendukung_cloudinary, status_approval, approved_by, catatan_admin)
      VALUES ($1, 'dinas_luar', '2026-09-21', '2026-09-24', 4, 'Bimbingan Teknis Kurikulum Tingkat Provinsi', 'https://res.cloudinary.com/kk5ip5eb/image/upload/v1727160000/sipeg_stupa/dokumen/surat_tugas_sample.png', 'approved', $2, 'Disetujui. Harap kumpulkan LPJ setelah kegiatan.');
    `, [p3Id, adminId]);

    console.log('✅ Sampel Pengajuan Cuti & Dinas berhasil disimpan.');

    // 6. Seed LOG ABSENSI (Untuk Uji Coba Rekapitulasi Presensi & Grafik)
    console.log('🕒 Memasukkan sampel log presensi pegawai...');

    // Log Hari Ini: Made Artha (Masuk Tepat Waktu)
    await client.query(`
      INSERT INTO absensi (pegawai_id, waktu_absen, tipe_absen, status, waktu_terlambat, waktu_mendahului, latitude, longitude, jarak_dari_kantor, url_foto_cloudinary, device_id_used)
      VALUES ($1, NOW() - INTERVAL '7 hours', 'masuk', 'tepat_waktu', 0, 0, -8.6811200, 115.2145700, 15.2, 'https://res.cloudinary.com/kk5ip5eb/image/upload/v1727160000/sipeg_stupa/absensi/sample_face1.jpg', 'Mozilla/5.0 Android');
    `, [p1Id]);

    // Log Hari Ini: Kadek Dwi (Masuk Terlambat 18 Menit)
    await client.query(`
      INSERT INTO absensi (pegawai_id, waktu_absen, tipe_absen, status, waktu_terlambat, waktu_mendahului, latitude, longitude, jarak_dari_kantor, url_foto_cloudinary, device_id_used)
      VALUES ($1, NOW() - INTERVAL '6 hours 42 minutes', 'masuk', 'terlambat', 18, 0, -8.6811100, 115.2145600, 22.4, 'https://res.cloudinary.com/kk5ip5eb/image/upload/v1727160000/sipeg_stupa/absensi/sample_face2.jpg', 'Mozilla/5.0 Windows');
    `, [p4Id]);

    // Log Kemarin: Made Artha (Masuk & Pulang Lengkap)
    await client.query(`
      INSERT INTO absensi (pegawai_id, waktu_absen, tipe_absen, status, waktu_terlambat, waktu_mendahului, latitude, longitude, jarak_dari_kantor, url_foto_cloudinary, device_id_used)
      VALUES 
      ($1, NOW() - INTERVAL '1 day 7 hours', 'masuk', 'tepat_waktu', 0, 0, -8.6811200, 115.2145700, 14.5, 'https://res.cloudinary.com/kk5ip5eb/image/upload/v1727160000/sipeg_stupa/absensi/sample_face1.jpg', 'Mozilla/5.0 Android'),
      ($1, NOW() - INTERVAL '1 day', 'pulang', 'tepat_waktu', 0, 0, -8.6811200, 115.2145700, 16.0, 'https://res.cloudinary.com/kk5ip5eb/image/upload/v1727160000/sipeg_stupa/absensi/sample_face1.jpg', 'Mozilla/5.0 Android');
    `, [p1Id]);

    console.log('✅ Sampel Log Absensi berhasil disimpan.');

    // 7. Ringkasan Akhir
    const finalCounts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM kantor) as total_kantor,
        (SELECT COUNT(*) FROM pegawai) as total_pegawai,
        (SELECT COUNT(*) FROM pengajuan) as total_pengajuan,
        (SELECT COUNT(*) FROM absensi) as total_absensi;
    `);

    console.log('========================================================');
    console.log('🎉 SEEDING DATA KE NEON DATABASE BERHASIL 100%!');
    console.log(finalCounts.rows[0]);
    console.log('========================================================');
    console.log('Akun Admin:');
    console.log('  Email: admin@stupa.ac.id | Password: admin123');
    console.log('Akun Pegawai:');
    console.log('  1. made.artha@stupa.ac.id | Password: stupa123');
    console.log('  2. putu.ayu@stupa.ac.id   | Password: stupa123');
    console.log('  3. wayan.dharma@stupa.ac.id | Password: stupa123');
    console.log('  4. kadek.dwi@stupa.ac.id  | Password: stupa123');
    console.log('========================================================');

  } catch (err) {
    console.error('❌ Gagal seeding ke Neon Database:', err);
  } finally {
    await client.end();
  }
}

pushSeedData();
