import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import pool from "../db.js";
import { authMiddleware, adminOnly, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/users — List all users (admin only)
router.get("/", authMiddleware, adminOnly, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT id, username, full_name, phone, role, room_id, created_at FROM users ORDER BY created_at"
    );
    const users = result.rows.map((u) => ({
      id: String(u.id),
      username: u.username,
      fullName: u.full_name,
      phone: u.phone,
      role: u.role,
      roomId: u.room_id ? String(u.room_id) : "",
      createdAt: u.created_at,
    }));
    return res.json(users);
  } catch (err) {
    console.error("List users error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// GET /api/users/:id
router.get("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT id, username, full_name, phone, role, room_id FROM users WHERE id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    }
    const u = result.rows[0];
    return res.json({
      id: String(u.id),
      username: u.username,
      fullName: u.full_name,
      phone: u.phone,
      role: u.role,
      roomId: u.room_id ? String(u.room_id) : "",
    });
  } catch (err) {
    console.error("Get user error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// PUT /api/users/:id — Update user (admin or self)
router.put("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Only admin or the user themselves can update
    if (req.user!.role !== "admin" && req.user!.id !== id) {
      return res.status(403).json({ error: "ไม่มีสิทธิ์แก้ไขข้อมูลผู้ใช้คนนี้" });
    }

    const { fullName, phone, password, roomId } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (fullName !== undefined) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(fullName);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(hash);
    }
    if (roomId !== undefined && req.user!.role === "admin") {
      // Sync room's tenant_id column
      await pool.query("UPDATE rooms SET tenant_id = NULL WHERE tenant_id = $1", [id]);
      if (roomId) {
        await pool.query("UPDATE rooms SET tenant_id = $1 WHERE id = $2", [id, roomId]);
        
        // Fetch new room number to sync username
        const roomResult = await pool.query("SELECT number FROM rooms WHERE id = $1", [roomId]);
        if (roomResult.rows.length > 0) {
          updates.push(`username = $${paramIndex++}`);
          values.push(roomResult.rows[0].number);
        }
      }
      updates.push(`room_id = $${paramIndex++}`);
      values.push(roomId || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "ไม่มีข้อมูลที่จะอัปเดต" });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING id, username, full_name, phone, role, room_id`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    }

    const u = result.rows[0];
    return res.json({
      id: String(u.id),
      username: u.username,
      fullName: u.full_name,
      phone: u.phone,
      role: u.role,
      roomId: u.room_id ? String(u.room_id) : "",
    });
  } catch (err) {
    console.error("Update user error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// DELETE /api/users/:id — Delete user (admin only)
router.delete("/:id", authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Clear room assignment
    await pool.query("UPDATE rooms SET tenant_id = NULL WHERE tenant_id = $1", [id]);

    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    }

    return res.json({ message: "ลบผู้ใช้สำเร็จ" });
  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

export default router;
