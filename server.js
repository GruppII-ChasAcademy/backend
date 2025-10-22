const express = require("express");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const { defaultDb } = require("./db");

const app = express();
app.use(express.json());

// Swagger
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "GruppII API", version: "1.0.0" },
  },
  apis: [path.join(__dirname, "routes", "*.js"), __filename],
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Healthcheck
 *     responses:
 *       200:
 *         description: OK
 */
app.get("/health", (req, res) => res.json({ ok: true, db: defaultDb }));

// API routes
app.use("/api", require("./routes/readings"));

// Start
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => console.log(`API up on ${PORT}`));
