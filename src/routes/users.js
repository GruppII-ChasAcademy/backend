// src/routes/users.js
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

router.get("/", (_req, res) => {
  res.json(toArrayDesc(users));
});

router.get("/:id", (req, res) => {
  const u = users.get(req.params.id);
  if (!u) return res.status(404).json({ error: "user_not_found" });
  res.json(u);
});

router.post("/", (req, res) => {
  const { error, value } = userSchemaCreate.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const id = uuidv4();
  const now = new Date().toISOString();
  const user = { id, ...value, createdAt: now, updatedAt: now };
  users.set(id, user);
  res.status(201).json(user);
});

router.patch("/:id", (req, res) => {
  const { error, value } = userSchemaPatch.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const old = users.get(req.params.id);
  if (!old) return res.status(404).json({ error: "user_not_found" });

  const updated = { ...old, ...value, updatedAt: new Date().toISOString() };
  users.set(updated.id, updated);
  res.json(updated);
});

router.delete("/:id", (req, res) => {
  if (!users.has(req.params.id)) return res.status(404).json({ error: "user_not_found" });
  users.delete(req.params.id);
  res.status(204).send();
});

export default router;
