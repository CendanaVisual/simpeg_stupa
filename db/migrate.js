const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const CONNECTION_STRING = 'postgresql://neondb_owner:npg_M5wp6kKlSfnd@ep-silent-base-b33qyxbo-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function runMigration() {
  const client = new Client({ connectionString: CONNECTION_STRING });

  try {
    await client.connect();
    console.log('Connected to Neon PostgreSQL.');

    // 1. Eksekusi Schema DDL
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    console.log('Executing schema.sql...');
    await client.query(schemaSql);
    console.log('Schema DDL executed successfully!');

    // 2. Cek dan Seed Kantor Default
    const kantorRes = await client.query('SELECT COUNT(*) FROM kantor');
    if (parseInt(kantorRes.rows[0].count) === 0) {
      console.log('Seeding default Kantor STUPA...');
      await client.query(`
        INSERT INTO kantor (nama, latitude, longitude, radius_meter, jam_masuk, jam_pulang)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        'Kantor Pusat STUPA',
        -8.6811234,  // Default Latitude (bisa diubah di Dashboard Admin)
        115.2145678, // Default Longitude
        100,         // Radius 100 meter
        '07:30:00',
        '16:00:00'
      ]);
      console.log('Default Kantor created.');
    }

    // 3. Cek dan Seed Akun Admin Default & Pegawai Demo
    const pegawaiRes = await client.query('SELECT COUNT(*) FROM pegawai');
    if (parseInt(pegawaiRes.rows[0].count) === 0) {
      console.log('Seeding initial Admin & Pegawai accounts...');
      
      const adminHash = await bcrypt.hash('admin123', 10);
      const pegawaiHash = await bcrypt.hash('stupa123', 10);

      // Admin Account
      await client.query(`
        INSERT INTO pegawai (nip, nama, email, username, password_hash, role, jabatan, sisa_cuti_tahunan)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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

      // Pegawai Demo Account
      await client.query(`
        INSERT INTO pegawai (nip, nama, email, username, password_hash, role, jabatan, sisa_cuti_tahunan)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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

      console.log('Admin and Demo Pegawai seeded successfully!');
      console.log('Akun Admin: email = admin@stupa.ac.id | password = admin123');
      console.log('Akun Pegawai: email = made.artha@stupa.ac.id | password = stupa123');
    }

    console.log('Migration and seeding completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

runMigration();
