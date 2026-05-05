import { Router, Response } from "express";
import pool from "../db.js";
import { authMiddleware, adminOnly, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/announcements — List announcements
router.get("/", authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.full_name as creator_name
       FROM announcements a
       JOIN users u ON a.created_by = u.id
       ORDER BY a.created_at DESC
       LIMIT 50`
    );

    const announcements = result.rows.map((a) => ({
      id: String(a.id),
      title: a.title,
      message: a.message,
      priority: a.priority,
      createdAt: a.created_at,
      createdBy: a.creator_name || "",
    }));

    return res.json(announcements);
  } catch (err) {
    console.error("List announcements error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// GET /api/announcements/:id
router.get("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.full_name as creator_name
       FROM announcements a
       JOIN users u ON a.created_by = u.id
       WHERE a.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบประกาศ" });
    }

    const a = result.rows[0];
    return res.json({
      id: String(a.id),
      title: a.title,
      message: a.message,
      priority: a.priority,
      createdBy: String(a.created_by),
      createdAt: a.created_at,
    });
  } catch (err) {
    console.error("Get announcement error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// POST /api/announcements — Create (admin only)
router.post("/", authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { title, message, priority = "low" } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: "กรุณากรอกหัวข้อและเนื้อหา" });
    }

    const result = await pool.query(
      `INSERT INTO announcements (title, message, priority, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, message, priority, req.user!.id]
    );

    const a = result.rows[0];
    // Get creator name
    const userResult = await pool.query("SELECT full_name FROM users WHERE id = $1", [req.user!.id]);

    return res.status(201).json({
      id: String(a.id),
      title: a.title,
      message: a.message,
      priority: a.priority,
      createdAt: a.created_at,
      createdBy: userResult.rows[0]?.full_name || "",
    });
  } catch (err) {
    console.error("Create announcement error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// PUT /api/announcements/:id — Update (admin only)
router.put("/:id", authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, message, priority } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (message !== undefined) {
      updates.push(`message = $${paramIndex++}`);
      values.push(message);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      values.push(priority);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "ไม่มีข้อมูลที่จะอัปเดต" });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE announcements SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบประกาศ" });
    }

    const a = result.rows[0];
    const userResult = await pool.query("SELECT full_name FROM users WHERE id = $1", [a.created_by]);

    return res.json({
      id: a.id,
      title: a.title,
      message: a.message,
      priority: a.priority,
      createdAt: a.created_at,
      createdBy: userResult.rows[0]?.full_name || "",
    });
  } catch (err) {
    console.error("Update announcement error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// DELETE /api/announcements/:id — Delete (admin only)
router.delete("/:id", authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query("DELETE FROM announcements WHERE id = $1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบประกาศ" });
    }
    return res.json({ message: "ลบประกาศสำเร็จ" });
  } catch (err) {
    console.error("Delete announcement error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

export default router;
