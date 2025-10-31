# === Ensure we're in the repo and on the right branch ===
Set-Location "C:\Users\jacob\Desktop\backend-main"
git checkout feature/merge-mvp-warning-system

# === 1. Install required runtime deps ===
npm install express cors morgan swagger-jsdoc swagger-ui-express joi uuid

# === 2. Update package.json (CommonJS mode, add scripts.start/dev) ===
$packagePath = ".\package.json"
$pkg = Get-Content $packagePath -Raw | ConvertFrom-Json

# remove "type": "module" if present (Azure + Node classic prefer CommonJS)
if ($pkg.PSObject.Properties.Name -contains "type") {
    $pkg.PSObject.Properties.Remove("type")
}

# ensure scripts exists
if (-not $pkg.scripts) {
    $pkg | Add-Member -MemberType NoteProperty -Name scripts -Value (@{})
}

$pkg.scripts.start = "node ./src/app.js"
$pkg.scripts.dev   = "node ./src/app.js"

# write updated package.json back
$pkg | ConvertTo-Json -Depth 20 | Set-Content $packagePath -Encoding UTF8


# === 3. Overwrite src/app.js with CommonJS/require version ===
$appJsCommonJs = @"
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Routers
const usersRouter = require("./routes/users.js");
const companiesRouter = require("./routes/companies.js");
const packagesRouter = require("./routes/packages.js");
const iotRouter = require("./routes/iot.js");

const app = express();

// Swagger/OpenAPI config
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
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ["./src/routes/*.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Healthcheck
app.get("/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// API routes
app.use("/api/users", usersRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/packages", packagesRouter);
app.use("/api/iot", iotRouter);

// Root → redirect till swagger
app.get("/", (_req, res) => {
  res.redirect("/api-docs");
});

// Felhantering
app.use((err, _req, res, _next) => {
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "invalid_json", message: err.message });
  }
  return res
    .status(500)
    .json({ error: "server_error", message: err?.message || "unknown" });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(\`[MVP+] Server running on http://localhost:\${port}\`);
  console.log(\`[Swagger] Documentation available on http://localhost:\${port}/api-docs\`);
});

module.exports = app;
"@

Set-Content -Path ".\src\app.js" -Value $appJsCommonJs -Encoding UTF8


# === 4. Overwrite src/routes/users.js with CommonJS version (router + swagger comments) ===
$usersJsCommonJs = @"
// src/routes/users.js (CommonJS + Swagger)

const { Router } = require("express");
const Joi = require("joi");
const { v4: uuidv4 } = require("uuid");
const { users, toArrayDesc } = require("../store/memdb.js");

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

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Hämta alla användare
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista med alla användare
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   companyId:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                   updatedAt:
 *                     type: string
 */
router.get("/", (_req, res) => {
  res.json(toArrayDesc(users));
});

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Hämta specifik användare
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Användardata
 *       404:
 *         description: Användaren hittades inte
 */
router.get("/:id", (req, res) => {
  const u = users.get(req.params.id);
  if (!u) return res.status(404).json({ error: "user_not_found" });
  res.json(u);
});

/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Skapa ny användare
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               companyId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Användare skapad
 *       400:
 *         description: Ogiltig data
 */
router.post("/", (req, res) => {
  const { error, value } = userSchemaCreate.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const id = uuidv4();
  const now = new Date().toISOString();
  const user = { id, ...value, createdAt: now, updatedAt: now };

  users.set(id, user);
  res.status(201).json(user);
});

module.exports = router;
"@

Set-Content -Path ".\src\routes\users.js" -Value $usersJsCommonJs -Encoding UTF8


# === 5. Create/update .gitignore so logs and junk don't get committed ===
$gitignoreContent = @"
# Node
node_modules/
npm-debug.log*
# keep lockfile tracked in repo, so DON'T ignore package-lock.json here

# Env
.env
.env.*

# Build / deploy artifacts
deployment.zip

# Azure / runtime logs
backend-gruppii-logs/
backend-gruppii-errors-top20.txt
"@

Set-Content -Path ".\.gitignore" -Value $gitignoreContent -Encoding UTF8


# === 6. Remove already committed logs from index (but not delete locally) ===
git rm -r --cached backend-gruppii-logs 2>$null
git rm --cached deployment.zip 2>$null
git rm --cached backend-gruppii-errors-top20.txt 2>$null

# === 7. Commit & push cleaned branch ===
git add .gitignore
git add package.json
git add src/app.js
git add src/routes/users.js

git commit -m "fix: stabilize backend runtime (CommonJS), add swagger, clean logs and gitignore"
git push origin feature/merge-mvp-warning-system

Write-Host ""
Write-Host ">>> KLART. Testa nu lokalt:" -ForegroundColor Green
Write-Host "PS C:\Users\jacob\Desktop\backend-main> node .\src\app.js" -ForegroundColor Yellow
Write-Host ""
Write-Host "Öppna i browsern:" -ForegroundColor Green
Write-Host "http://localhost:3000/health" -ForegroundColor White
Write-Host "http://localhost:3000/api-docs" -ForegroundColor White
