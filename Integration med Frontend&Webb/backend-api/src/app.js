const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const { verifyJWT, requireRole } = require("./auth.js");

// Routers
const usersRouter     = require("./routes/users.js");
const companiesRouter = require("./routes/companies.js");
const packagesRouter  = require("./routes/packages.js");
const iotRouter       = require("./routes/iot.js");
const authRouter      = require("./routes/auth.js");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Swagger/OpenAPI config
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Backend API Documentation",
      version: "1.0.0",
      description:
        "API för autentisering, användare, företag, paket, IoT och sensorsystem.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Lokal utveckling",
      },
      {
        url: "https://backend-gruppii.azurewebsites.net",
        description: "Production (Azure)",
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    "./src/**/*.js"
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Healthcheck
 *     tags: [System]
 *     responses:
 *       200:
 *         description: OK
 */
app.get("/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

/**
 * @openapi
 * /api/secure/ping:
 *   get:
 *     summary: Ping som kräver giltig JWT
 *     tags: [Secure]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK (token giltig)
 *       401:
 *         description: Ogiltig/missing token
 */
app.get("/api/secure/ping", verifyJWT, (_req, res) => {
  res.json({ ok: true });
});

/**
 * @openapi
 * /api/admin/overview:
 *   get:
 *     summary: Admin-only översikt
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin OK
 *       403:
 *         description: Ej behörig (inte admin)
 */
app.get(
  "/api/admin/overview",
  verifyJWT,
  requireRole("admin"),
  (_req, res) => {
    res.json({ ok: true, scope: "admin-only" });
  }
);

// Mount routers
app.use("/api/users", usersRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/packages", packagesRouter);
app.use("/api/iot", iotRouter);
app.use("/auth", authRouter);

// Root redirect -> swagger
app.get("/", (_req, res) => {
  res.redirect("/api-docs");
});

// Global error handler
app.use((err, _req, res, _next) => {
  if (err?.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ error: "invalid_json", message: err.message });
  }

  return res
    .status(500)
    .json({ error: "server_error", message: err?.message || "unknown" });
});

// Starta servern
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[LIVE] Server running on http://localhost:${port}`);
  console.log(`[Swagger] http://localhost:${port}/api-docs`);
});

module.exports = app;
