import { Router, Response } from "express";
import pool from "../db.js";
import { authMiddleware, adminOnly, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/maintenance — List maintenance requests
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let query: string;
    let params: any[] = [];

    if (req.user!.role === "admin") {
      query = `SELECT m.*, r.number as room_number, u.full_name as tenant_name
               FROM maintenance_requests m
               JOIN rooms r ON m.room_id = r.id
               JOIN users u ON m.tenant_id = u.id
               ORDER BY m.updated_at DESC`;
    } else {
      query = `SELECT m.*, r.number as room_number, u.full_name as tenant_name
               FROM maintenance_requests m
               JOIN rooms r ON m.room_id = r.id
               JOIN users u ON m.tenant_id = u.id
               WHERE m.tenant_id = $1
               ORDER BY m.updated_at DESC`;
      params = [req.user!.id];
    }

    const result = await pool.query(query, params);
    const requests = result.rows.map(mapMaintenanceRow);
    return res.json(requests);
  } catch (err) {
    console.error("List maintenance error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// GET /api/maintenance/:id
router.get("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT m.*, r.number as room_number, u.full_name as tenant_name
       FROM maintenance_requests m
       JOIN rooms r ON m.room_id = r.id
       JOIN users u ON m.tenant_id = u.id
       WHERE m.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบรายการแจ้งซ่อม" });
    }

    const m = result.rows[0];
    if (req.user!.role !== "admin" && m.tenant_id !== req.user!.id) {
      return res.status(403).json({ error: "ไม่มีสิทธิ์ดูรายการนี้" });
    }

    return res.json(mapMaintenanceRow(m));
  } catch (err) {
    console.error("Get maintenance error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// POST /api/maintenance — Create request (tenant)
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, category = "ทั่วไป", description = "", residentImage = "" } = req.body;

    if (!title) {
      return res.status(400).json({ error: "กรุณากรอกหัวข้อ" });
    }

    // Get tenant's room
    const userResult = await pool.query("SELECT room_id FROM users WHERE id = $1", [req.user!.id]);
    const roomId = userResult.rows[0]?.room_id;

    if (!roomId) {
      return res.status(400).json({ error: "ผู้เช่ายังไม่ได้จัดห้องพัก" });
    }

    const result = await pool.query(
      `INSERT INTO maintenance_requests (tenant_id, room_id, title, category, description, resident_image)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user!.id, roomId, title, category, description, residentImage]
    );

    return res.status(201).json(mapMaintenanceRow(result.rows[0]));
  } catch (err) {
    console.error("Create maintenance error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// PUT /api/maintenance/:id — Update request
router.put("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await pool.query("SELECT * FROM maintenance_requests WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบรายการแจ้งซ่อม" });
    }

    const m = existing.rows[0];
    if (req.user!.role !== "admin" && m.tenant_id !== req.user!.id) {
      return res.status(403).json({ error: "ไม่มีสิทธิ์แก้ไขรายการนี้" });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const { status, assignee, adminNote, completionImage, title, description, residentImage, category } = req.body;

    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (assignee !== undefined) {
      updates.push(`assignee = $${paramIndex++}`);
      values.push(assignee);
    }
    if (adminNote !== undefined) {
      updates.push(`admin_note = $${paramIndex++}`);
      values.push(adminNote);
    }
    if (completionImage !== undefined) {
      updates.push(`completion_image = $${paramIndex++}`);
      values.push(completionImage);
    }
    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (residentImage !== undefined) {
      updates.push(`resident_image = $${paramIndex++}`);
      values.push(residentImage);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(category);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "ไม่มีข้อมูลที่จะอัปเดต" });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE maintenance_requests SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return res.json(mapMaintenanceRow(result.rows[0]));
  } catch (err) {
    console.error("Update maintenance error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// DELETE /api/maintenance/:id — Delete (admin only)
router.delete("/:id", authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query("DELETE FROM maintenance_requests WHERE id = $1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบรายการแจ้งซ่อม" });
    }
    return res.json({ message: "ลบรายการแจ้งซ่อมสำเร็จ" });
  } catch (err) {
    console.error("Delete maintenance error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

function mapMaintenanceRow(m: any) {
  return {
    id: String(m.id),
    tenantId: String(m.tenant_id),
    roomId: String(m.room_id),
    title: m.title,
    category: m.category,
    description: m.description,
    status: m.status,
    assignee: m.assignee || "",
    adminNote: m.admin_note || "",
    residentImage: m.resident_image || "",
    completionImage: m.completion_image || "",
    createdAt: m.created_at,
    updatedAt: m.updated_at,
    roomNumber: m.room_number || "",
    tenantName: m.tenant_name || "",
  };
}

export default router;
