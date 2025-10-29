const { Router } = require("express");
const router = Router();

// Fake data
const companies = [
  { id: "c1", name: "Acme AB",  orgnr: "556000-0001" },
  { id: "c2", name: "SkadaFix", orgnr: "556000-0002" },
];

/**
 * @openapi
 * /api/companies:
 *   get:
 *     summary: Lista alla företag
 *     tags: [Companies]
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/", (_req, res) => {
  res.json(companies);
});

module.exports = router;
