// src/routes/users.js med Swagger documentation
import { Router } from "express";
import Joi from "joi";
import { v4 as uuidv4 } from "uuid";
import { users, toArrayDesc } from "../store/memdb.js";

const router = Router();

const userSchemaCreate = Joi.object({
  name: Joi.string().min(1).required(),
  email: Joi.string().email().required(),
  companyId: Joi.string().optional(),
});

const userSchemaPatch = Joi.object({
  name: Joi.string().min(1),
  email: Joi.string().email(),
  companyId: Joi.string(),
}).min(1);

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Hämta alla användare
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista med alla användare
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   companyId:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                   updatedAt:
 *                     type: string
 */
router.get("/", (_req, res) => {
  res.json(toArrayDesc(users));
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
 *         description: Användardata
 *       404:
 *         description: Användaren hittades inte
 */
router.get("/:id", (req, res) => {
  const u = users.get(req.params.id);
  if (!u) return res.status(404).json({ error: "user_not_found" });
  res.json(u);
});

/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Skapa ny användare
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               companyId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Användare skapad
 *       400:
 *         description: Ogiltig data
 */
router.post("/", (req, res) => {
  const { error, value } = userSchemaCreate.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const id = uuidv4();
  const now = new Date().toISOString();
  const user = { id, ...value, createdAt: now, updatedAt: now };
  users.set(id, user);
  res.status(201).json(user);
});

// ... resten av din befintliga users.js kod för PATCH och DELETE

export default router;
