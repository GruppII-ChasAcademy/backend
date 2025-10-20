// src/app.js
console.log(">>> booting app.js");

import authRoutes from './routes.auth.js';
import { verifyJWT, requireRole } from './auth.js';

import express from "express";
import cors from "cors";
import morgan from "morgan";

import usersRouter from "./routes/users.js";
import companiesRouter from "./routes/companies.js";
import packagesRouter from "./routes/packages.js";
import iotRouter from "./routes/iot.js";


const app = express();
app.use(cors()); 
app.use(express.json());
app.use(morgan("dev"));


// Health
app.get("/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.get('/api/secure/ping', verifyJWT, (_req, res) => res.json({ ok: true }));

app.get('/api/admin/overview', verifyJWT, requireRole('admin'), (_req, res) => {
  res.json({ ok: true, scope: 'admin-only' });
});

// Mount routers
app.use("/api/users", usersRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/packages", packagesRouter);
app.use("/api/iot", iotRouter);
app.use('/auth', authRoutes);

const port = process.env.PORT || 3000;

app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'invalid_json', message: err.message });
  }
  return res.status(500).json({ error: 'server_error', message: err?.message || 'unknown' });
});


app.listen(port, () => console.log(`[MVP+] http://localhost:${port}`));
