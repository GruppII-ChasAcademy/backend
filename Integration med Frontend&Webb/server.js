const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger.json');

const app = express();
app.use(express.json());

// ================== System ==================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ================== Secure ==================
app.get('/api/secure/ping', (req, res) => {
  res.json({ secure: true, msg: 'pong (låtsas att du är auktoriserad)' });
});

// ================== Admin ===================
app.get('/api/admin/overview', (req, res) => {
  res.json({ users: 10, sensors: 3, packages: 5, note: 'admin only demo' });
});

// ================== Auth ====================
app.post('/auth/signup', (req, res) => {
  res.status(201).json({ message: 'user created (demo)' });
});

app.post('/auth/login', (req, res) => {
  res.json({ token: 'fake-jwt-token', user: { id: 1, name: 'DemoUser' } });
});

app.post('/auth/logout', (req, res) => {
  res.json({ message: 'logged out (demo)' });
});

app.get('/auth/me', (req, res) => {
  res.json({ id: 1, name: 'DemoUser', role: 'admin' });
});

app.delete('/auth/:id', (req, res) => {
  res.json({ deleted: req.params.id });
});

// ================== Companies ===============
app.get('/api/companies', (req, res) => {
  res.json([
    { id: 1, name: 'Chas AB' },
    { id: 2, name: 'GruppII IoT' }
  ]);
});

// ================== IoT =====================
app.get('/api/iot/sensors', (req, res) => {
  res.json([
    { name: 'temp', value: 22.5 },
    { name: 'humidity', value: 55 }
  ]);
});

app.post('/api/iot/sensors', (req, res) => {
  const body = req.body;
  res.status(201).json({ saved: true, data: body });
});

app.get('/api/iot/sensors/:name/:value', (req, res) => {
  res.json({
    name: req.params.name,
    value: req.params.value,
    ok: true
  });
});

// ================== Packages =================
app.get('/api/packages', (req, res) => {
  res.json([
    { id: 'PKG-001', status: 'in transit' },
    { id: 'PKG-002', status: 'delivered' }
  ]);
});

// ================== Users ====================
app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: 'Alice', safe: true },
    { id: 2, name: 'Bob', safe: true }
  ]);
});

app.get('/api/users/:id', (req, res) => {
  res.json({ id: req.params.id, name: 'Alice', safe: true });
});

// ================== Swagger ==================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ================== Start server =============
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server kör på http://localhost:' + PORT);
  console.log('Swagger:        http://localhost:' + PORT + '/api-docs');
});

/**
 * ================= IoT Telemetry (FAKE LIVE DATA) =================
 * Detta simulerar 100 Arduino Uno R4-enheter.
 * Enhet 55 => deviceId "arduino_uno_r4_055".
 * Temperatur och luftfuktighet slumpas varje gång du anropar.
 */

// Helper: bygg deviceId-sträng av ett nummer
function makeDeviceId(n) {
  // 55 -> "arduino_uno_r4_055"
  return `arduino_uno_r4_${n.toString().padStart(3, '0')}`;
}

// Helper: generera ett "telemetry reading" för EN enhet
function randomReading(n) {
  const deviceId = makeDeviceId(n);
  return {
    deviceId,
    ts: Date.now(),                                        // timestamp i ms
    temperature: +(20 + Math.random() * 15).toFixed(1),    // 20.0 - 35.0 °C
    humidity: +(40 + Math.random() * 20).toFixed(1),       // 40.0 - 60.0 %
    packet: n,
    label: `Paket ${n} (${deviceId})`
  };
}

// GET /api/iot/telemetry
// Returnerar en lista med de senaste fejkade värdena för ALLA 100 enheter
app.get('/api/iot/telemetry', (req, res) => {
  const allReadings = [];
  for (let i = 1; i <= 100; i++) {
    allReadings.push(randomReading(i));
  }
  res.json(allReadings);
});

// GET /api/iot/telemetry/:deviceNum
// Returnerar ett objekt för en specifik enhet, t.ex. 55 => arduino_uno_r4_055
app.get('/api/iot/telemetry/:deviceNum', (req, res) => {
  const numRaw = req.params.deviceNum;
  const num = parseInt(numRaw, 10);

  if (isNaN(num) || num < 1 || num > 100) {
    return res.status(400).json({
      error: 'deviceNum must be 1-100'
    });
  }

  res.json(randomReading(num));
});

// ================= Slut på Telemetry-blocket =================


/**
 * ================= IoT Telemetry (ADVANCED QUERY) =================
 * Simulerar 100 IoT-enheter: "uno-r4-001" ... "uno-r4-100"
 *
 * Query-exempel:
 *
 *  Alla enheter (stigande):
 *    /api/telemetry?limit=100&sort=asc
 *
 *  Alla enheter (fallande):
 *    /api/telemetry?limit=100&sort=desc
 *
 *  Bara “Arduino”-enheter (prefix):
 *    /api/telemetry?devicePrefix=uno-r4-&limit=50&sort=asc
 *
 *  Exakt en enhet:
 *    /api/telemetry?deviceId=uno-r4-002&limit=10&sort=asc
 *
 *  Specifikt paket (alla enheter):
 *    /api/telemetry?packet=3&sort=asc
 *
 *  Specifikt paket för en enhet:
 *    /api/telemetry?deviceId=uno-r4-003&packet=3&sort=asc
 *
 *  Paketintervall (t.ex. 2–5) för alla enheter med prefix:
 *    /api/telemetry?devicePrefix=uno-r4-&packetFrom=2&packetTo=5&sort=asc
 */

// Skapar deviceId som "uno-r4-055"
function makeSimpleDeviceId(n) {
  return `uno-r4-${n.toString().padStart(3, '0')}`;
}

// Skapar en fejkad mätning för en device
function randomTelemetryRow(n) {
  const deviceId = makeSimpleDeviceId(n);
  return {
    deviceId,
    ts: Date.now(),                                     // timestamp i ms
    temperature: +(20 + Math.random() * 15).toFixed(1), // 20.0 - 35.0 °C
    humidity: +(40 + Math.random() * 20).toFixed(1),    // 40.0 - 60.0 %
    packet: n,                                          // vi låtsas paketindex == n
    label: `Paket ${n} (${deviceId})`
  };
}

// Bygger en lista med ALLA 100 enheter varje gång endpointen anropas
function generateAllTelemetry() {
  const out = [];
  for (let i = 1; i <= 100; i++) {
    out.push(randomTelemetryRow(i));
  }
  return out;
}

// GET /api/telemetry
app.get('/api/telemetry', (req, res) => {
  let {
    devicePrefix,
    deviceId,
    packet,
    packetFrom,
    packetTo,
    limit,
    sort
  } = req.query;

  // 1. Startdata: 100 fejkade devices
  let data = generateAllTelemetry();

  // 2. Exakt enhet (deviceId = "uno-r4-055")
  if (deviceId) {
    data = data.filter(row => row.deviceId === deviceId);
  }

  // 3. Prefixfilter (devicePrefix="uno-r4-")
  if (devicePrefix) {
    data = data.filter(row => row.deviceId.startsWith(devicePrefix));
  }

  // 4. Filtrera på visst paketnummer (packet=3)
  if (packet !== undefined) {
    const pNum = parseInt(packet, 10);
    if (!Number.isNaN(pNum)) {
      data = data.filter(row => row.packet === pNum);
    }
  }

  // 5. Filtrera på paketintervall, t.ex. packetFrom=2 & packetTo=5
  if (packetFrom !== undefined || packetTo !== undefined) {
    const fromNum = parseInt(packetFrom, 10);
    const toNum   = parseInt(packetTo, 10);

    data = data.filter(row => {
      const pkt = row.packet;
      if (!Number.isNaN(fromNum) && pkt < fromNum) return false;
      if (!Number.isNaN(toNum)   && pkt > toNum)   return false;
      return true;
    });
  }

  // 6. Sortera
  // sort=desc => högst packet först
  if (sort === 'desc') {
    data.sort((a, b) => b.packet - a.packet);
  } else {
    // default eller sort=asc
    data.sort((a, b) => a.packet - b.packet);
  }

  // 7. Limit (hur många rader som returneras)
  if (limit !== undefined) {
    const lim = parseInt(limit, 10);
    if (!Number.isNaN(lim) && lim > 0) {
      data = data.slice(0, lim);
    }
  }

  // Skicka svaret
  res.json(data);
});
// ================= Slut på ADVANCED QUERY =================
