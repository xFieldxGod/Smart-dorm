import bcrypt from "bcryptjs";
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://smartdorm:smartdorm123@localhost:5433/smartdorm",
  ssl: process.env.DATABASE_URL?.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : false,
});

async function setupDatabase() {
  console.log("🔧 Setting up Smart Dorm database...\n");

  // Run schema
  console.log("📐 Creating tables...");
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
  await pool.query(schema);
  console.log("✅ Tables created\n");

  // Hash passwords
  const adminHash = await bcrypt.hash("admin123", 10);
  const tenantHash = await bcrypt.hash("tenant123", 10);

  console.log("👤 Seeding users...");
  const users = [
    [1, "admin", adminHash, "ฝ่ายบริหารอาคาร Smart Dorm", "02-000-0000", "admin", null],
    [2, "6605094", tenantHash, "นายสุภทัต ตรีสมุทร", "081-245-7781", "tenant", null],
    [3, "6605875", tenantHash, "นางสาวพิณลดา แจ้งจิตร์", "081-245-7782", "tenant", null],
    [4, "6605974", tenantHash, "นางสาวชัญญา เขียวภักดี", "081-245-7783", "tenant", null],
  ];

  for (const u of users) {
    await pool.query(
      `INSERT INTO users (id, username, password_hash, full_name, phone, role, room_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET password_hash = $3, username = $2`,
      u
    );
  }
  console.log("✅ Users seeded\n");

  // Run seed
  console.log("🌱 Seeding data...");
  const seed = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf-8");
  await pool.query(seed);
  console.log("✅ Data seeded\n");



  console.log("🎉 Database setup complete!");
  console.log("─".repeat(40));
  console.log("Admin login:   admin / admin123");
  console.log("Tenant login:  6605094 / tenant123");
  console.log("─".repeat(40));

  await pool.end();
}

setupDatabase().catch((err) => {
  console.error("❌ Setup failed:", err);
  process.exit(1);
});
