import { Pool, PoolClient } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_M5wp6kKlSfnd@ep-silent-base-b33qyxbo-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

// Gunakan singleton pool untuk serverless Next.js
declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

let pool: Pool;

if (!global.pgPool) {
  global.pgPool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}
pool = global.pgPool;

export default pool;

/**
 * Helper untuk query PostgreSQL dengan penanganan parameter aman (Mencegah SQL Injection)
 */
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // console.log('executed query', { text, duration, rows: res.rowCount });
    return res.rows as T[];
  } catch (error) {
    console.error('Database query error:', error, { text, params });
    throw error;
  }
}

/**
 * Helper transaksi atomik (BEGIN ... COMMIT / ROLLBACK)
 */
export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
