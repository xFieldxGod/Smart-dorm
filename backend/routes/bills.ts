import { Router, Response } from "express";
import pool from "../db.js";
import { authMiddleware, adminOnly, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/bills — List bills (admin: all, tenant: own only)
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let query: string;
    let params: any[] = [];

    if (req.user!.role === "admin") {
      query = `SELECT b.*, r.number as room_number, u.full_name as tenant_name
               FROM bills b
               JOIN rooms r ON b.room_id = r.id
               JOIN users u ON b.tenant_id = u.id
               ORDER BY b.month DESC, b.created_at DESC`;
    } else {
      query = `SELECT b.*, r.number as room_number, u.full_name as tenant_name
               FROM bills b
               JOIN rooms r ON b.room_id = r.id
               JOIN users u ON b.tenant_id = u.id
               WHERE b.tenant_id = $1
               ORDER BY b.month DESC, b.created_at DESC`;
      params = [req.user!.id];
    }

    const result = await pool.query(query, params);
    const bills = result.rows.map(mapBillRow);
    return res.json(bills);
  } catch (err) {
    console.error("List bills error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// GET /api/bills/:id
router.get("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT b.*, r.number as room_number, u.full_name as tenant_name
       FROM bills b
       JOIN rooms r ON b.room_id = r.id
       JOIN users u ON b.tenant_id = u.id
       WHERE b.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบบิล" });
    }

    const bill = result.rows[0];
    // Tenants can only see their own bills
    if (req.user!.role !== "admin" && bill.tenant_id !== req.user!.id) {
      return res.status(403).json({ error: "ไม่มีสิทธิ์ดูบิลนี้" });
    }

    return res.json(mapBillRow(bill));
  } catch (err) {
    console.error("Get bill error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// POST /api/bills — Create bill (admin only)
router.post("/", authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const {
      roomId,
      tenantId,
      month,
      baseRent,
      waterUnits = 0,
      electricityUnits = 0,
      total,
      dueDate,
      qrReference = "",
    } = req.body;

    if (!roomId || !tenantId || !month || !dueDate) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    const computedTotal = total ?? baseRent + waterUnits * 18 + electricityUnits * 8;

    const result = await pool.query(
      `INSERT INTO bills (room_id, tenant_id, month, base_rent, water_units, electricity_units, total, due_date, qr_reference)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [roomId, tenantId, month, baseRent, waterUnits, electricityUnits, computedTotal, dueDate, qrReference]
    );

    return res.status(201).json(mapBillRow(result.rows[0]));
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "ห้องนี้มีบิลในเดือนนี้แล้ว" });
    }
    console.error("Create bill error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// PUT /api/bills/:id — Update bill
router.put("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, slipImage } = req.body;

    // Check ownership
    const existing = await pool.query("SELECT * FROM bills WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบบิล" });
    }

    const bill = existing.rows[0];
    if (req.user!.role !== "admin" && bill.tenant_id !== req.user!.id) {
      return res.status(403).json({ error: "ไม่มีสิทธิ์แก้ไขบิลนี้" });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);

      if (status === "paid") {
        updates.push(`paid_at = NOW()`);
      }
      if (status === "submitted") {
        updates.push(`submitted_at = NOW()`);
      }
    }

    if (slipImage !== undefined) {
      updates.push(`slip_image = $${paramIndex++}`);
      values.push(slipImage);
    }

    // Admin can update additional fields
    if (req.user!.role === "admin") {
      const { waterUnits, electricityUnits, baseRent, total, dueDate } = req.body;
      if (waterUnits !== undefined) {
        updates.push(`water_units = $${paramIndex++}`);
        values.push(waterUnits);
      }
      if (electricityUnits !== undefined) {
        updates.push(`electricity_units = $${paramIndex++}`);
        values.push(electricityUnits);
      }
      if (baseRent !== undefined) {
        updates.push(`base_rent = $${paramIndex++}`);
        values.push(baseRent);
      }
      if (total !== undefined) {
        updates.push(`total = $${paramIndex++}`);
        values.push(total);
      }
      if (dueDate !== undefined) {
        updates.push(`due_date = $${paramIndex++}`);
        values.push(dueDate);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "ไม่มีข้อมูลที่จะอัปเดต" });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE bills SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return res.json(mapBillRow(result.rows[0]));
  } catch (err) {
    console.error("Update bill error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// DELETE /api/bills/:id — Delete bill (admin only)
router.delete("/:id", authMiddleware, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query("DELETE FROM bills WHERE id = $1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบบิล" });
    }
    return res.json({ message: "ลบบิลสำเร็จ" });
  } catch (err) {
    console.error("Delete bill error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
  }
});

function mapBillRow(b: any) {
  return {
    id: String(b.id),
    roomId: String(b.room_id),
    tenantId: String(b.tenant_id),
    month: b.month,
    baseRent: Number(b.base_rent),
    waterUnits: Number(b.water_units),
    electricityUnits: Number(b.electricity_units),
    total: Number(b.total),
    status: b.status,
    dueDate: b.due_date,
    qrReference: b.qr_reference || "",
    slipImage: b.slip_image || "",
    createdAt: b.created_at,
    paidAt: b.paid_at || "",
    submittedAt: b.submitted_at || "",
    roomNumber: b.room_number || "",
    tenantName: b.tenant_name || "",
  };
}

export default router;
