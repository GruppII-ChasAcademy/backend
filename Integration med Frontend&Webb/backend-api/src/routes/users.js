const { Router } = require("express");
const { listUsers, getUserById } = require("../auth.js");

const router = Router();

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Lista alla användare (safe view)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/", (_req, res) => {
  res.json(listUsers());
});

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Hämta specifik användare
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Inte hittad
 */
router.get("/:id", (req, res) => {
  const u = getUserById(req.params.id);
  if (!u) {
    return res.status(404).json({ error: "user_not_found" });
  }
  res.json(u);
});

module.exports = router;
