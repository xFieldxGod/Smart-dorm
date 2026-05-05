import pg from "pg";

const { Pool } = pg;

const connStr =
  process.env.DATABASE_URL ||
  "postgresql://smartdorm:smartdorm123@localhost:5433/smartdorm";

const isRemote = connStr.includes("neon.tech") || connStr.includes("supabase");

const pool = new Pool({
  connectionString: connStr,
  ssl: isRemote ? { rejectUnauthorized: false } : false,
});

export default pool;
