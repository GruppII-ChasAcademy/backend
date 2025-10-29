const { Router } = require("express");
const Joi = require("joi");
const {
  verifyJWT,
  createUser,
  loginUser,
  getUserById,
  deleteUserById,
} = require("../auth.js");

const router = Router();

const signupSchema = Joi.object({
  name: Joi.string().min(1).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(4).required(),
  role: Joi.string().valid("user", "admin").optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(4).required(),
});

/**
 * @openapi
 * /auth/signup:
 *   post:
 *     summary: Registrera en ny användare
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ name, email, password ]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       201:
 *         description: Ny användare skapad
 */
router.post("/signup", (req, res) => {
  try {
    const { error, value } = signupSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const newUser = createUser(value);
    return res.status(201).json(newUser);
  } catch (err) {
    if (err.message === "email_already_exists") {
      return res.status(409).json({ error: "email_already_exists" });
    }
    return res
      .status(500)
      .json({ error: "server_error", message: err.message });
  }
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Logga in användare
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ email, password ]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inloggad, JWT returneras
 *       401:
 *         description: Ogiltiga inloggningsuppgifter
 */
router.post("/login", (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const result = loginUser(value);
    return res.json(result);
  } catch (err) {
    if (err.message === "invalid_credentials") {
      return res.status(401).json({ error: "invalid_credentials" });
    }
    return res
      .status(500)
      .json({ error: "server_error", message: err.message });
  }
});

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logga ut aktuell användare
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Utloggad
 */
router.post("/logout", verifyJWT, (_req, res) => {
  // Ingen server-side blacklist i MVP. Klienten slänger sin token.
  return res.status(204).send();
});

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Hämta info om aktuell användare
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Info om användaren
 *       401:
 *         description: Saknar/ogiltig token
 */
router.get("/me", verifyJWT, (req, res) => {
  const me = getUserById(req.user.sub);
  if (!me) return res.status(404).json({ error: "not_found" });
  return res.json(me);
});

/**
 * @openapi
 * /auth/{id}:
 *   delete:
 *     summary: Radera användare (admin eller sig själv)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Raderad
 *       403:
 *         description: Saknar behörighet
 *       404:
 *         description: Användare hittades inte
 */
router.delete("/:id", verifyJWT, (req, res) => {
  const result = deleteUserById(req.user, req.params.id);

  if (!result.ok && result.error === "not_found") {
    return res.status(404).json({ error: "not_found" });
  }
  if (!result.ok && result.error === "forbidden") {
    return res.status(403).json({ error: "forbidden" });
  }

  return res.status(204).send();
});

module.exports = router;
