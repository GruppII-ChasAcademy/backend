console.log('>>> booting app.js');   // 临时定位用
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import Joi from 'joi';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Store the most recent messages in memory (up to 100 entries)
const recent = [];
const MAX_ITEMS = 100;

const schema = Joi.object({
  deviceId: Joi.string().required(),
  payload: Joi.object().unknown(true).required()
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// IoT ingestion (HTTP POST)
app.post('/api/iot/ingest', (req, res) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const doc = { ...value, time: new Date().toISOString() };
  recent.unshift(doc);
  if (recent.length > MAX_ITEMS) recent.pop();

  res.status(202).json({ accepted: true });
});

// Query recent data
app.get('/api/iot/recent', (_req, res) => {
  res.json(recent);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`[MVP] http://localhost:${port}`));
