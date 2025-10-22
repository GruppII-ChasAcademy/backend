import { Router } from "express";
import Joi from "joi";
import { v4 as uuidv4 } from "uuid";
import { companies, toArrayDesc } from "../store/memdb.js";

const router = Router();

const companySchemaCreate = Joi.object({
  name: Joi.string().min(1).required(),
});
const companySchemaPatch = Joi.object({
  name: Joi.string().min(1),
}).min(1);

router.get("/", (_req, res) => {
  res.json(toArrayDesc(companies));
});

router.get("/:id", (req, res) => {
  const c = companies.get(req.params.id);
  if (!c) return res.status(404).json({ error: "company_not_found" });
  res.json(c);
});

router.post("/", (req, res) => {
  const { error, value } = companySchemaCreate.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const id = uuidv4();
  const now = new Date().toISOString();
  const company = { id, ...value, createdAt: now, updatedAt: now };
  companies.set(id, company);
  res.status(201).json(company);
});

router.patch("/:id", (req, res) => {
  const { error, value } = companySchemaPatch.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const old = companies.get(req.params.id);
  if (!old) return res.status(404).json({ error: "company_not_found" });

  const updated = { ...old, ...value, updatedAt: new Date().toISOString() };
  companies.set(updated.id, updated);
  res.json(updated);
});

router.delete("/:id", (req, res) => {
  if (!companies.has(req.params.id))
    return res.status(404).json({ error: "company_not_found" });
  companies.delete(req.params.id);
  res.status(204).send();
});

export default router;
