# BackendGruppii – Backend API (Express + Swagger + Azure)

Den här backendkoden är den version som kör live i Azure App Service just nu.  
Syftet är att visa vår API-struktur (auth, användare, företag, IoT-sensorer osv), dokumentation via Swagger, och hur frontend/Webb kan prata med backend.

## Teknisk stack

- **Node.js / Express**
- **Swagger UI (swagger-ui-express)**
- Körs i **Azure App Service (Linux, B1-plan)**
- Dokumentationen (Swagger UI) är åtkomlig offentligt

Mappen \Integration med Frontend&Webb\ innehåller den faktiska källkoden:
- \server.js\ – Express-servern och alla endpoints
- \swagger.json\ – OpenAPI-spec som Swagger UI läser
- \package.json\ – dependencies och startscript
- \
ode_modules/\ – installerade paket (lokalt)

## Live-miljö (Azure)

Appen är deployad till Azure App Service:
- Domän: \https://backendgruppii.azurewebsites.net\
- Swagger UI (API-dokumentation): \/api-docs\  
  Exempel: \https://backendgruppii.azurewebsites.net/api-docs\

Health check (för att visa att tjänsten kör):
- \GET /health\  
  \https://backendgruppii.azurewebsites.net/health\

### Azure-konfiguration

I App Service > Konfiguration ligger:

- \PORT = 3000\
- \WEBSITES_PORT = 3000\
- \NODE_ENV = production\

I \server.js\:
\\\js
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server kör på http://localhost:" + PORT);
});
\\\

Det gör att samma kod funkar både lokalt (localhost:3000) och i Azure (App Service injicerar porten).

## Swagger

Swagger-UI hostas direkt av Express:

\\\js
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
\\\

I \swagger.json\ finns \"servers"\-listan. Den innehåller både lokal URL och Azure URL t.ex:

\\\json
"servers": [
  {
    "url": "https://backendgruppii.azurewebsites.net",
    "description": "Azure Production"
  },
  {
    "url": "http://localhost:3000",
    "description": "Lokal utveckling"
  }
]
\\\

Det gör att Swagger i molnet pekar på Azure-backenden (så \Try it out\ funkar live),
och Swagger lokalt pekar på din egen \localhost:3000\.

## Endpoints (översikt)

### System
- **GET /health**  
  Returnerar status + uptime. Används av oss för att visa att containern kör.

### Secure (placeholder)
- **GET /api/secure/ping**  
  Simulerar en “skyddad” endpoint. Just nu svarar den alltid { secure: true }.

### Admin
- **GET /api/admin/overview**  
  Returnerar fejkad översikt: antal användare, antal sensorer, antal paket osv.
  Tanken är att bli en admin dashboard-endpoint.

### Auth
Det här är mockad auth just nu (ingen riktig DB, ingen riktig JWT-verifiering).
Vi har endpoints för att visa flödet för frontend/Webb.

- **POST /auth/signup**  
  Skapar användare (demo-svar: { message: 'user created (demo)' })

- **POST /auth/login**  
  Loggar in användaren. Returnerar fejk-token:
  \\\json
  {
    "token": "fake-jwt-token",
    "user": { "id": 1, "name": "DemoUser" }
  }
  \\\

- **GET /auth/login**  
  Returnerar 405 med text som säger “denna endpoint tar bara POST”.
  Detta är bara för att folk inte ska få "Cannot GET" när de provar i webbläsaren.

- **GET /auth/me**  
  Returnerar en fejkad “inloggad” användare:
  \\\json
  { "id": 1, "name": "DemoUser", "role": "admin" }
  \\\

- **POST /auth/logout**  
  Returnerar { message: 'logged out (demo)' }.

- **DELETE /auth/:id**  
  Returnerar { deleted: <id> }. Tanken är “admin kan radera användare”.

Poängen: Auth-blocket i Swagger matchar hur frontend ska prata med backend, men logiken är mockad. Riktig auth/JWT/databas kommer senare.

### Companies
- **GET /api/companies**  
  Returnerar en lista företag, t.ex. [{ id: 1, name: 'Chas AB' }, ...].  
  Används för att visa företag / kunder / partners i UI.

### IoT
Detta är kopplat till IoT-delen (våra sensorer, klimatdata, embedded osv).

- **GET /api/iot/sensors**  
  Returnerar en lista av sensorer med värden (temp, humidity osv).

- **POST /api/iot/sensors**  
  Tar emot JSON med sensorvärde och svarar { saved: true, data: ... }.

- **GET /api/iot/sensors/:name/:value**  
  Returnerar vad du skickar in som path-param.
  Används för snabbtest av sensordata från embedded-enheter.

### Packages
- **GET /api/packages**  
  Returnerar demo-lista med paket/leveranser, t.ex. PKG-001, status “in transit”.
  Den är gjord för att frontend/Webb ska kunna bygga UI runt leveranser/spårning.

### Users
- **GET /api/users**  
  Returnerar “säker vy” av användare (utan känslig data).

- **GET /api/users/:id**  
  Returnerar en användare baserat på ID.
  Nu är det mockat.

## Hur man kör lokalt (dev / frontend-team)

1. Gå in i mappen:
   \cd "Integration med Frontend&Webb"\

2. Installera moduler (för säkerhets skull):
   \
pm install\

3. Starta:
   \
pm start\

4. Gå till:
   - Swagger: \http://localhost:3000/api-docs\
   - Health:  \http://localhost:3000/health\

Frontend kan anropa t.ex. \http://localhost:3000/auth/login\ (POST) under utveckling.

## Hur vi deployar till Azure

1. Öppna mappen \Integration med Frontend&Webb\ i VS Code.
2. Använd VS Code Azure App Service extension.
3. Högerklicka på \BackendGruppii\ i Azure-fliken → \Deploy to Web App...\
4. Välj mappen \Integration med Frontend&Webb\.
5. Bekräfta overwrite.

Azure startar om containern och koden körs live.

Swagger i Azure:
\https://backendgruppii.azurewebsites.net/api-docs\

Health live:
\https://backendgruppii.azurewebsites.net/health\

## Vad som återstår att bygga

- Riktig auth (riktiga användare, lösenord, JWT)
- Databas (persistent lagring av sensordata, användare, paket)
- Riktiga roller (admin vs user)
- Koppling till frontendens fetch-calls och dashboard-komponenter

---

**Kort sagt:**  
\Integration med Frontend&Webb\ ÄR vår nuvarande fungerande backend + swagger + Azure-deploy, och den är tänkt att vara källan som frontend/Webb-teamet integrerar mot.
