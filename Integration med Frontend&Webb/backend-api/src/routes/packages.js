const { Router } = require("express");
const router = Router();

// Fake data
const packages = [
  { id: "p1", desc: "Sensorpaket i hallen", status: "OK" },
  { id: "p2", desc: "Brandvarnare på plan 2", status: "WARNING" },
];

/**
 * @openapi
 * /api/packages:
 *   get:
 *     summary: Lista alla paket/enheter
 *     tags: [Packages]
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/", (_req, res) => {
  res.json(packages);
});

module.exports = router;
