const express = require("express");
const { db } = require("../db");
const router = express.Router();

/**
 * @openapi
 * /api/readings:
 *   get:
 *     summary: Lista senaste mätvärden
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/readings", (req, res) => {
  db.all("SELECT * FROM readings ORDER BY id DESC LIMIT 50", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * @openapi
 * /api/readings:
 *   post:
 *     summary: Skapa ett nytt mätvärde
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key: { type: string }
 *               value: { type: string }
 *     responses:
 *       201:
 *         description: Skapat
 */
router.post("/readings", (req, res) => {
  const { key, value } = req.body || {};
  if (!key) return res.status(400).json({ error: "key is required" });
  db.run("INSERT INTO readings(key, value) VALUES(?, ?)", [key, value], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

module.exports = router;
