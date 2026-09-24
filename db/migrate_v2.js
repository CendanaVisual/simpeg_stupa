const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const CONNECTION_STRING = 'postgresql://neondb_owner:npg_M5wp6kKlSfnd@ep-silent-base-b33qyxbo-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function migrateV2() {
  const client = new Client({ connectionString: CONNECTION_STRING });

  try {
    await client.connect();
    console.log('Connected to Neon PostgreSQL.');

    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await client.query(schemaSql);
    console.log('Schema DDL executed successfully.');

    // Update kantor dengan pengaturan jam kerja spesifik dari instruksi user:
    await client.query(`
      UPDATE kantor
      SET jam_masuk_mulai = '06:30:00',
          jam_masuk_akhir = '07:30:00',
          jam_pulang_senin_kamis_mulai = '15:30:00',
          jam_pulang_jumat_mulai = '13:00:00',
          jam_pulang_akhir = '18:00:00',
          jam_masuk = '07:30:00',
          jam_pulang = '15:30:00'
      WHERE id IS NOT NULL;
    `);

    const res = await client.query('SELECT * FROM kantor LIMIT 1');
    console.log('Konfigurasi Kantor Terkini:', res.rows[0]);
    console.log('Migration v2 Completed Successfully!');
  } catch (err) {
    console.error('Migration v2 failed:', err);
  } finally {
    await client.end();
  }
}

migrateV2();
