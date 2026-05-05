import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import roomRoutes from "./routes/rooms.js";
import billRoutes from "./routes/bills.js";
import maintenanceRoutes from "./routes/maintenance.js";
import announcementRoutes from "./routes/announcements.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/announcements", announcementRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "ไม่พบ endpoint นี้" });
});

export default app;
