import { Router, Response } from "express";
import pool from "../db.js";
import { authMiddleware, adminOnly, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/rooms — List all rooms
router.get("/", authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.full_name as tenant_name
       FROM rooms r
       LEFT JOIN users u ON r.tenant_id = u.id
       ORDER BY r.number`
    );
    const rooms = result.rows.map((r) => ({
      id: String(r.id),
      number: r.number,
      type: r.type,
      status: r.status,
      baseRent: Number(r.base_rent),
      tenantId: r.tenant_id ? String(r.tenant_id) : "",
      tenantName: r.tenant_name || "",
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
    return res.json(rooms);
  } catch (err) {
    console.error("List rooms error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// GET /api/rooms/:id
router.get("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.full_name as tenant_name
       FROM rooms r
       LEFT JOIN users u ON r.tenant_id = u.id
       WHERE r.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบห้องพัก" });
    }
    const r = result.rows[0];
    return res.json({
      id: String(r.id),
      number: r.number,
      type: r.type,
      status: r.status,
      baseRent: Number(r.base_rent),
      tenantId: r.tenant_id ? String(r.tenant_id) : "",
      tenantName: r.tenant_name || "",
    });
  } catch (err) {
    console.error("Get room error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// POST /api/rooms — Create room (admin only)
router.post("/", authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { number, type = "Studio", status = "available", baseRent = 0 } = req.body;

    if (!number) {
      return res.status(400).json({ error: "กรุณากรอกเลขห้อง" });
    }

    const result = await pool.query(
      `INSERT INTO rooms (number, type, status, base_rent)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [number, type, status, baseRent]
    );

    const r = result.rows[0];
    return res.status(201).json({
      id: String(r.id),
      number: r.number,
      type: r.type,
      status: r.status,
      baseRent: Number(r.base_rent),
      tenantId: r.tenant_id ? String(r.tenant_id) : "",
    });
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "เลขห้องนี้มีอยู่แล้ว" });
    }
    console.error("Create room error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// PUT /api/rooms/:id — Update room (admin only)
router.put("/:id", authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { number, type, status, baseRent, tenantId } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (number !== undefined) {
      updates.push(`number = $${paramIndex++}`);
      values.push(number);
    }
    if (type !== undefined) {
      updates.push(`type = $${paramIndex++}`);
      values.push(type);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (baseRent !== undefined) {
      updates.push(`base_rent = $${paramIndex++}`);
      values.push(baseRent);
    }
    if (tenantId !== undefined) {
      // Clear old room of tenant (if any)
      if (tenantId) {
        await pool.query("UPDATE rooms SET tenant_id = NULL, updated_at = NOW() WHERE tenant_id = $1 AND id != $2", [tenantId, id]);
        await pool.query("UPDATE users SET room_id = $1, updated_at = NOW() WHERE id = $2", [id, tenantId]);
      }
      updates.push(`tenant_id = $${paramIndex++}`);
      values.push(tenantId || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "ไม่มีข้อมูลที่จะอัปเดต" });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE rooms SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบห้องพัก" });
    }

    const r = result.rows[0];
    return res.json({
      id: String(r.id),
      number: r.number,
      type: r.type,
      status: r.status,
      baseRent: Number(r.base_rent),
      tenantId: r.tenant_id ? String(r.tenant_id) : "",
    });
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "เลขห้องนี้มีอยู่แล้ว" });
    }
    console.error("Update room error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// DELETE /api/rooms/:id — Delete room (admin only)
router.delete("/:id", authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Clear tenant assignment
    await pool.query("UPDATE users SET room_id = NULL WHERE room_id = $1", [id]);

    const result = await pool.query("DELETE FROM rooms WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบห้องพัก" });
    }

    return res.json({ message: "ลบห้องพักสำเร็จ" });
  } catch (err) {
    console.error("Delete room error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

export default router;
