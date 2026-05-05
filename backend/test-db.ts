import pool from "./db.js";

async function testConn() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ Database connected successfully:", res.rows[0]);
    
    const users = await pool.query("SELECT count(*) FROM users");
    const rooms = await pool.query("SELECT count(*) FROM rooms");
    const bills = await pool.query("SELECT count(*) FROM bills");
    const requests = await pool.query("SELECT count(*) FROM maintenance_requests");
    
    console.log("\n📊 Current Database Statistics:");
    console.log(`- 👥 Total Users: ${users.rows[0].count}`);
    console.log(`- 🏢 Total Rooms: ${rooms.rows[0].count}`);
    console.log(`- 🧾 Total Bills: ${bills.rows[0].count}`);
    console.log(`- 🧰 Maintenance Requests: ${requests.rows[0].count}`);
    
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Database test failed:", err.message);
    process.exit(1);
  }
}

testConn();
