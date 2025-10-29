// src/app.js med Swagger support
console.log(">>> booting app.js with Swagger");

import express from "express";
import cors from "cors";
import morgan from "morgan";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import usersRouter from "./routes/users.js";
import companiesRouter from "./routes/companies.js";
import packagesRouter from "./routes/packages.js";
import iotRouter from "./routes/iot.js";

const app = express();

// Swagger konfiguration
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Backend API Documentation",
            version: "1.0.0",
            description: "API för sensorer, paket, företag och användare"
        },
        servers: [
            {
                url: "https://backend-gruppii.azurewebsites.net",
                description: "Production server"
            },
            {
                url: "http://localhost:3000",
                description: "Local development"
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: ["./src/routes/*.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health endpoint
app.get("/health", (_req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
});

// API Routes
app.use("/api/users", usersRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/packages", packagesRouter);
app.use("/api/iot", iotRouter);

// Root redirect till Swagger
app.get("/", (_req, res) => {
    res.redirect("/api-docs");
});

const port = process.env.PORT || 3000;

app.use((err, _req, res, _next) => {
    if (err?.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'invalid_json', message: err.message });
    }
    return res.status(500).json({ error: 'server_error', message: err?.message || 'unknown' });
});

app.listen(port, () => {
    console.log([MVP+] Server running on http://localhost:);
    console.log([Swagger] Documentation available on http://localhost:/api-docs);
});
