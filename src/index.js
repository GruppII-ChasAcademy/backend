import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ---- Swagger (auto från JSDoc) ----
const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "Backend API Documentation", version: "1.0.0" },
    servers: [{ url: "http://localhost:3000" }, { url: "https://backend-gruppii.azurewebsites.net" }]
  },
  apis: ["./src/index.js"]
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Healthcheck
 *     responses:
 *       200: { description: OK }
 */
app.get("/health", (_req, res) => res.json({ status: "ok" }));

/**
 * @openapi
 * /api/admin/overview:
 *   get:
 *     summary: Admin-only översikt (mock)
 *     responses:
 *       200:
 *         description: Mock admin data
 */
app.get("/api/admin/overview", (_req, res) =>
  res.json({ users: 3, companies: 1, sensors: 2 })
);

/**
 * @openapi
 * /auth/signup:
 *   post:
 *     summary: Registrera (mock)
 *     responses:
 *       201: { description: Created }
 */
app.post("/auth/signup", (req, res) =>
  res.status(201).json({ id: 1, email: req.body?.email ?? "demo@example.com" })
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Logga in (mock)
 *     responses:
 *       200: { description: Token }
 */
app.post("/auth/login", (_req, res) =>
  res.json({ token: "mock-jwt-token", expiresIn: 3600 })
);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logga ut (mock)
 *     responses:
 *       200: { description: Logged out }
 */
app.post("/auth/logout", (_req, res) => res.json({ loggedOut: true }));

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Hämta aktuell användare (mock)
 *     responses:
 *       200: { description: Current user }
 */
app.get("/auth/me", (_req, res) =>
  res.json({ id: 1, email: "demo@example.com", role: "user" })
);

/**
 * @openapi
 * /auth/{id}:
 *   delete:
 *     summary: Radera användare (mock)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Deleted }
 */
app.delete("/auth/:id", (req, res) =>
  res.json({ deleted: Number(req.params.id) })
);

/**
 * @openapi
 * /api/companies:
 *   get:
 *     summary: Lista alla företag (mock)
 *     responses:
 *       200:
 *         description: Company list
 */
app.get("/api/companies", (_req, res) =>
  res.json([{ id: 1, name: "GruppII AB" }])
);

/**
 * @openapi
 * /api/iot/sensors:
 *   get:
 *     summary: Lista alla sensorer (mock)
 *     responses:
 *       200: { description: Sensor list }
 *   post:
 *     summary: Skicka in ett nytt sensorvärde (mock)
 *     requestBody:
 *       required: false
 *     responses:
 *       201: { description: Created }
 */
app.get("/api/iot/sensors", (_req, res) =>
  res.json([{ name: "temp", value: 22.5 }, { name: "humidity", value: 47 }])
);
app.post("/api/iot/sensors", (req, res) =>
  res.status(201).json({ saved: true, payload: req.body ?? {} })
);

/**
 * @openapi
 * /api/iot/sensors/{name}/{value}:
 *   get:
 *     summary: Kontrollera sensorvärde (mock)
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: value
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200: { description: OK }
 */
app.get("/api/iot/sensors/:name/:value", (req, res) =>
  res.json({ name: req.params.name, value: Number(req.params.value), ok: true })
);

/**
 * @openapi
 * /api/packages:
 *   get:
 *     summary: Lista alla paket/enheter (mock)
 *     responses:
 *       200: { description: Package list }
 */
app.get("/api/packages", (_req, res) =>
  res.json([{ id: "PKG-1", owner: "GruppII AB" }])
);

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Lista användare (safe view, mock)
 *     responses:
 *       200: { description: Users }
 * /api/users/{id}:
 *   get:
 *     summary: Hämta specifik användare (mock)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: User }
 */
app.get("/api/users", (_req, res) =>
  res.json([{ id: 1, email: "demo@example.com" }])
);
app.get("/api/users/:id", (req, res) =>
  res.json({ id: Number(req.params.id), email: "demo@example.com" })
);

// ---- start ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Mock API running on ${PORT}`));
