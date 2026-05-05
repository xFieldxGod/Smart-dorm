import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import pool from "../db.js";
import { generateToken, authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

// POST /api/auth/login
router.post("/login", async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "กรุณากรอก username และ password" });
    }

    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    return res.json({
      token,
      user: {
        id: String(user.id),
        username: user.username,
        fullName: user.full_name,
        phone: user.phone,
        role: user.role,
        roomId: user.room_id ? String(user.room_id) : "",
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// POST /api/auth/register
router.post("/register", async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, fullName, phone, role = "tenant", roomId } = req.body;

    if (!username || !password || !fullName) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    // Check duplicate username
    const exists = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: "ชื่อผู้ใช้นี้ถูกใช้แล้ว" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, phone, role, room_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, full_name, phone, role, room_id`,
      [username, passwordHash, fullName, phone || "", role, roomId || null]
    );

    const newUser = result.rows[0];

    // Map tenant to room
    if (roomId) {
      await pool.query("UPDATE rooms SET tenant_id = $1 WHERE id = $2", [newUser.id, roomId]);
    }
    const token = generateToken({
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
    });

    return res.status(201).json({
      token,
      user: {
        id: String(newUser.id),
        username: newUser.username,
        fullName: newUser.full_name,
        phone: newUser.phone,
        role: newUser.role,
        roomId: newUser.room_id ? String(newUser.room_id) : "",
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// GET /api/auth/me — Get current user info
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT id, username, full_name, phone, role, room_id FROM users WHERE id = $1",
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้" });
    }

    const user = result.rows[0];
    return res.json({
      id: String(user.id),
      username: user.username,
      fullName: user.full_name,
      phone: user.phone,
      role: user.role,
      roomId: user.room_id ? String(user.room_id) : "",
    });
  } catch (err) {
    console.error("Get me error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// POST /api/auth/change-password — Allow user to change their own password
router.post(
  "/change-password",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user!.id;

      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ error: "กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่" });
      }

      // Get user from DB
      const result = await pool.query(
        "SELECT password_hash FROM users WHERE id = $1",
        [userId],
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้" });
      }

      const user = result.rows[0];

      // Check current password
      const validPassword = await bcrypt.compare(
        currentPassword,
        user.password_hash,
      );
      if (!validPassword) {
        return res.status(401).json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password in DB
      await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
        newPasswordHash,
        userId,
      ]);

      return res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
    } catch (err) {
      console.error("Change password error:", err);
      return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
    }
  },
);

export default router;
