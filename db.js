import pkg from 'pg';
const { Pool } = pkg;

// Create a new pool using DATABASE_URL from Railway environment variables
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // needed for Railway Postgres
});

// Helper function to run queries safely
export async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

// Optional: Test the connection when the module is loaded
(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected:', res.rows[0]);
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err);
  }
})();