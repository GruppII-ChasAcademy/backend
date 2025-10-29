const { Router } = require("express");
const router = Router();

// Fake sensor store i minnet
const sensors = [
  { name: "temp", value: 22 },
  { name: "smoke", value: 0 },
];

/**
 * @openapi
 * /api/iot/sensors:
 *   get:
 *     summary: Lista alla sensorer
 *     tags: [IoT]
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/sensors", (_req, res) => {
  res.json(sensors);
});

/**
 * @openapi
 * /api/iot/sensors:
 *   post:
 *     summary: Skicka in ett nytt sensorvärde
 *     tags: [IoT]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ name, value ]
 *             properties:
 *               name:
 *                 type: string
 *               value:
 *                 type: number
 *     responses:
 *       201:
 *         description: Sensorvärde tillagt
 */
router.post("/sensors", (req, res) => {
  const { name, value } = req.body || {};
  if (!name || typeof value === "undefined") {
    return res.status(400).json({ error: "invalid_body" });
  }
  const entry = { name, value };
  sensors.push(entry);
  return res.status(201).json(entry);
});

/**
 * @openapi
 * /api/iot/sensors/{name}/{value}:
 *   get:
 *     summary: Kontrollera sensorvärde
 *     tags: [IoT]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: value
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: OK eller WARNING
 */
router.get("/sensors/:name/:value", (req, res) => {
  const { name, value } = req.params;
  const numericVal = Number(value);

  const status = numericVal > 50 ? "WARNING" : "OK";

  res.json({
    sensor: name,
    value: numericVal,
    status,
    message:
      status === "WARNING"
        ? "Threshold exceeded"
        : "All good",
  });
});

module.exports = router;
