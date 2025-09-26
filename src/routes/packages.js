import { Router } from "express";
import Joi from "joi";
import { v4 as uuidv4 } from "uuid";
import { packages, companies, toArrayDesc } from "../store/memdb.js";

const router = Router();

const PackageStatus = ["created", "in_transit", "delivered", "cancelled"];

const pkgSchemaCreate = Joi.object({
  trackingId: Joi.string().min(1).required(),
  companyId: Joi.string().required(),
  recipientName: Joi.string().allow("").optional(),
  status: Joi.string().valid(...PackageStatus).default("created"),
  sensors: Joi.array()
    .items(
      Joi.object({
        time: Joi.string().isoDate().default(() => new Date().toISOString()),
        payload: Joi.object().unknown(true).required(),
      })
    )
    .default([]),
});

const pkgSchemaPatch = Joi.object({
  trackingId: Joi.string().min(1),
  companyId: Joi.string(),
  recipientName: Joi.string().allow(""),
  status: Joi.string().valid(...PackageStatus),
}).min(1);

const pkgStatusSchema = Joi.object({
  status: Joi.string().valid(...PackageStatus).required(),
});

const pkgSensorSchema = Joi.object({
  payload: Joi.object().unknown(true).required(),
  time: Joi.string().isoDate().optional(),
});

router.get("/", (_req, res) => {
  res.json(toArrayDesc(packages));
});

router.get("/:id", (req, res) => {
  const p = packages.get(req.params.id);
  if (!p) return res.status(404).json({ error: "package_not_found" });
  res.json(p);
});

router.post("/", (req, res) => {
  const { error, value } = pkgSchemaCreate.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  if (!companies.has(value.companyId)) {
    return res.status(400).json({ error: "invalid_companyId" });
  }

  const id = uuidv4();
  const now = new Date().toISOString();
  const pkg = { id, ...value, createdAt: now, updatedAt: now };
  packages.set(id, pkg);
  res.status(201).json(pkg);
});

router.patch("/:id", (req, res) => {
  const { error, value } = pkgSchemaPatch.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const old = packages.get(req.params.id);
  if (!old) return res.status(404).json({ error: "package_not_found" });

  if (value.companyId && !companies.has(value.companyId)) {
    return res.status(400).json({ error: "invalid_companyId" });
  }

  const updated = { ...old, ...value, updatedAt: new Date().toISOString() };
  packages.set(updated.id, updated);
  res.json(updated);
});

router.delete("/:id", (req, res) => {
  if (!packages.has(req.params.id))
    return res.status(404).json({ error: "package_not_found" });
  packages.delete(req.params.id);
  res.status(204).send();
});

router.patch("/:id/status", (req, res) => {
  const { error, value } = pkgStatusSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const old = packages.get(req.params.id);
  if (!old) return res.status(404).json({ error: "package_not_found" });

  const updated = { ...old, status: value.status, updatedAt: new Date().toISOString() };
  packages.set(updated.id, updated);
  res.json(updated);
});

router.post("/:id/sensor", (req, res) => {
  const { error, value } = pkgSensorSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const old = packages.get(req.params.id);
  if (!old) return res.status(404).json({ error: "package_not_found" });

  const reading = {
    time: value.time || new Date().toISOString(),
    payload: value.payload,
  };
  const sensors = Array.isArray(old.sensors) ? old.sensors.slice(0) : [];
  sensors.push(reading);

  const updated = { ...old, sensors, updatedAt: new Date().toISOString() };
  packages.set(updated.id, updated);
  res.status(201).json(reading);
});

export default router;
