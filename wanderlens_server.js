/**
 * WanderLens – Node.js Backend
 * Runs on EC2, connects to RDS MySQL
 * Handles journey CRUD and community feed
 *
 * Setup:
 *   npm install express mysql2 cors dotenv
 *   node wanderlens_server.js
 */

require("dotenv").config();
const express = require("express");
const mysql   = require("mysql2/promise");
const cors    = require("cors");
const path    = require("path");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "20mb" })); // thumbnails are base64
app.use(express.static(path.join(__dirname, "public"))); // serve HTML from /public

// ── DB pool ───────────────────────────────────────────────────────────────────
const db = mysql.createPool({
  host:     process.env.DB_HOST,     // RDS endpoint
  user:     process.env.DB_USER,     // admin
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,     // wanderlens
  waitForConnections: true,
  connectionLimit: 10
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ ok: true }));

// ── GET /api/journey/:userName  — load a user's journey ──────────────────────
app.get("/api/journey/:userName", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, city, country, lat, lng, fun_fact AS funFact,
              user_date AS userDate, thumbnail, is_public AS isPublic,
              uploaded_at AS uploadedAt, sort_order AS sortOrder
       FROM journey
       WHERE user_name = ?
       ORDER BY sort_order ASC, uploaded_at ASC`,
      [req.params.userName]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/journey  — save a new journey entry ─────────────────────────────
app.post("/api/journey", async (req, res) => {
  const { userName, city, country, lat, lng, funFact,
          userDate, thumbnail, isPublic, sortOrder } = req.body;
  if (!userName || !city) return res.status(400).json({ error: "userName and city required" });
  try {
    const [result] = await db.query(
      `INSERT INTO journey
         (user_name, city, country, lat, lng, fun_fact, user_date, thumbnail, is_public, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userName, city, country, lat || null, lng || null, funFact || null,
       userDate || null, thumbnail || null, isPublic ? 1 : 0, sortOrder || 0]
    );
    res.json({ id: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ── PATCH /api/journey/:id  — update isPublic or sortOrder ───────────────────
app.patch("/api/journey/:id", async (req, res) => {
  const { isPublic, sortOrder } = req.body;
  const fields = [];
  const values = [];
  if (isPublic !== undefined) { fields.push("is_public = ?"); values.push(isPublic ? 1 : 0); }
  if (sortOrder !== undefined) { fields.push("sort_order = ?"); values.push(sortOrder); }
  if (!fields.length) return res.status(400).json({ error: "nothing to update" });
  values.push(req.params.id);
  try {
    await db.query(`UPDATE journey SET ${fields.join(", ")} WHERE id = ?`, values);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── PUT /api/journey/reorder  — save new sort order for all entries ───────────
app.put("/api/journey/reorder", async (req, res) => {
  const { userName, order } = req.body; // order: [{id, sortOrder}]
  if (!order?.length) return res.status(400).json({ error: "order required" });
  try {
    await Promise.all(order.map(({ id, sortOrder }) =>
      db.query("UPDATE journey SET sort_order = ? WHERE id = ? AND user_name = ?",
               [sortOrder, id, userName])
    ));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/community?exclude=userName  — public photos from others ──────────
app.get("/api/community", async (req, res) => {
  const exclude = req.query.exclude || "";
  try {
    const [rows] = await db.query(
      `SELECT city, country, thumbnail, fun_fact AS funFact
       FROM journey
       WHERE is_public = 1
         AND thumbnail IS NOT NULL
         AND user_name != ?
       ORDER BY uploaded_at DESC
       LIMIT 50`,
      [exclude]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`WanderLens server running on port ${PORT}`));
