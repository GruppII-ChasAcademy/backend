// src/routes/iot.js
import { Router } from "express";
import Joi from "joi";

const router = Router();

const recent = [];
const MAX_ITEMS = 100;

const ingestSchema = Joi.object({
  deviceId: Joi.string().required(),
  payload: Joi.object().unknown(true).required(),
});

router.post("/ingest", (req, res) => {
  const { error, value } = ingestSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const doc = { ...value, time: new Date().toISOString() };
  recent.unshift(doc);
  if (recent.length > MAX_ITEMS) recent.pop();

  res.status(202).json({ accepted: true });
});

router.get("/recent", (req, res) => {
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 20, MAX_ITEMS));
  res.json(recent.slice(0, limit));
});

export default router;
