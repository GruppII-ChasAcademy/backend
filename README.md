# Backend MVP

A minimal, runnable backend (**Express + in-memory storage**) exposing health check, IoT ingest, and recent data endpoints.  
Great for quick FE/IoT integration and demos.

---

## ✨ Features
- **No database**: stores latest messages in memory (max 100)
- **Instant start**: `npm run dev` (with logging)
- **Endpoints**: `/health`, `/api/iot/ingest`, `/api/iot/recent`
- **Docker-ready**: includes `Dockerfile`

---

## 🧰 Tech Stack
- Node.js (ESM) + Express
- Middleware: `cors`, `morgan`, `joi`
- Dev tools: `nodemon`, `cross-env`

---

## 📦 Project Structure
backend/
├─ src/
│ └─ app.js # main (single) source file
├─ package.json
├─ .gitignore
├─ Dockerfile # optional: container build
└─ README.md


---

## ✅ Prerequisites
- Node.js 20+ (with npm)
- (Optional) Docker Desktop

> Windows tips: if `npm` isn’t recognized, install Node.js or fix PATH then restart the terminal.  
> `NODE_ENV=development` uses `cross-env` (already configured).

---

## 🚀 Quick Start

- 1) Install dependencies
bash
npm i

- 2) Start in dev mode
bash
npm run 

- Expected log:
[MVP] http://localhost:3000

- 3) Basic checks
Health check
Browser: http://localhost:3000/health
Or CLI:
Windows (PowerShell):
curl.exe http://localhost:3000/health
macOS/Linux:
curl http://localhost:3000/health

- Post one IoT record

Windows (PowerShell – pick one):
$body = @{ deviceId = "dev-1"; payload = @{ temp = 22.3 } } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/iot/ingest" -ContentType "application/json" -Body $body

macOS/Linux:
curl -X POST "http://localhost:3000/api/iot/ingest" \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"dev-1","payload":{"temp":22.3}}'

- Query recent data:
# Windows
curl.exe http://localhost:3000/api/iot/recent
# macOS/Linux
curl http://localhost:3000/api/iot/recent

## 🧪 VS Code Quick Tests (optional)

- Create requests.http (install VS Code extension REST Client):
### Health
GET http://localhost:3000/health

### Ingest one IoT record
POST http://localhost:3000/api/iot/ingest
Content-Type: application/json

{"deviceId":"dev-1","payload":{"temp":22.3}}

### Recent data
GET http://localhost:3000/api/iot/recent


## 🧭 Troubleshooting (Windows)

- npm not recognized: install Node.js or fix PATH; restart terminal.

- EJSONPARSE: package.json is invalid JSON (no comments/trailing commas).

- 'NODE_ENV' is not recognized: use cross-env (already configured).

- Multi-line curl fails: don’t use ^ (CMD only). In PowerShell, use backtick `, single-line, or Invoke-RestMethod.

## 🔭 Next Steps (optional)

- Switch to MongoDB (replace in-memory queue)

- Add MQTT (device message bus)

- Add GitHub Actions (deps + basic health check)

- Deploy via containers/orchestrators/cloud