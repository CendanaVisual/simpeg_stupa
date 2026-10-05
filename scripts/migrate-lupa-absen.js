const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_M5wp6kKlSfnd@ep-silent-base-b33qyxbo-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Running migration for Lupa Absen...');
    await client.query('BEGIN');

    // 1. Update check constraint on pengajuan table
    await client.query(`
      ALTER TABLE pengajuan DROP CONSTRAINT IF EXISTS pengajuan_tipe_pengajuan_check;
    `);
    await client.query(`
      ALTER TABLE pengajuan ADD CONSTRAINT pengajuan_tipe_pengajuan_check 
      CHECK (tipe_pengajuan IN ('cuti_tahunan', 'cuti_sakit', 'dinas_luar', 'lupa_absen'));
    `);
    console.log('Updated pengajuan_tipe_pengajuan_check constraint.');

    // 2. Add columns for Lupa Absen to pengajuan
    await client.query(`
      ALTER TABLE pengajuan ADD COLUMN IF NOT EXISTS tipe_absen_req VARCHAR(20);
    `);
    await client.query(`
      ALTER TABLE pengajuan ADD COLUMN IF NOT EXISTS waktu_presensi_req TIME;
    `);
    await client.query(`
      ALTER TABLE pengajuan ADD COLUMN IF NOT EXISTS status_presensi_req VARCHAR(30) DEFAULT 'tepat_waktu';
    `);
    await client.query(`
      ALTER TABLE pengajuan ADD COLUMN IF NOT EXISTS jarak_meter_req NUMERIC DEFAULT 100;
    `);
    await client.query(`
      ALTER TABLE pengajuan ADD COLUMN IF NOT EXISTS url_foto_selfie TEXT;
    `);
    console.log('Added Lupa Absen columns to pengajuan table.');

    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
