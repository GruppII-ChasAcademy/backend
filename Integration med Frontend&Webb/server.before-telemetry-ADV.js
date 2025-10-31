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
 * Detta simulerar 100 IoT-enheter ("uno-r4-001" ... "uno-r4-100").
 * Vi kan filtrera med query params:
 *
 *   ?limit=100&sort=asc
 *   ?sort=desc
 *   ?devicePrefix=uno-r4-&limit=50
 *   ?deviceId=uno-r4-002&limit=10
 *   ?packet=3
 *   ?deviceId=uno-r4-003&packet=3
 *   ?devicePrefix=uno-r4-&packetFrom=2&packetTo=5&sort=asc
 *
 * /api/telemetry
 */

function makeSimpleDeviceId(n) {
  // 55 -> "uno-r4-055"
  return `uno-r4-${n.toString().padStart(3,'0')}`;
}

// Genererar ett enda mätobjekt för en enhet
function randomTelemetryRow(n) {
  const deviceId = makeSimpleDeviceId(n);
  return {
    deviceId,
    ts: Date.now(),                                     // timestamp (ms)
    temperature: +(20 + Math.random() * 15).toFixed(1), // 20.0 - 35.0 °C
    humidity: +(40 + Math.random() * 20).toFixed(1),    // 40.0 - 60.0 %
    packet: n,                                          // t.ex. paketnummer
    label: `Paket ${n} (${deviceId})`
  };
}

// Bygg upp en full "databas" (100 devices)
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

  // 1. generera grunddata
  let data = generateAllTelemetry();

  // 2. filtrera på exakt deviceId (om satt)
  if (deviceId) {
    data = data.filter(row => row.deviceId === deviceId);
  }

  // 3. filtrera på prefix t.ex. "uno-r4-" (om satt och om inte deviceId redan styr allt)
  if (devicePrefix) {
    data = data.filter(row => row.deviceId.startsWith(devicePrefix));
  }

  // 4. filtrera på packet (om satt)
  if (packet) {
    const pNum = parseInt(packet, 10);
    if (!isNaN(pNum)) {
      data = data.filter(row => row.packet === pNum);
    }
  }

  // 5. filtrera på packetFrom/packetTo intervall (om satta)
  if (packetFrom -ne $null -or packetTo -ne $null) {
    const fromNum = parseInt(packetFrom, 10);
    const toNum   = parseInt(packetTo, 10);

    data = data.filter(row => {
      const pkt = row.packet;
      if (!isNaN(fromNum) -and pkt -lt fromNum) { return false; }
      if (!isNaN(toNum)   -and pkt -gt toNum)   { return false; }
      return true;
    });
  }

  // 6. sortera
  // vi sorterar på packet som "proxy" för tidsordning / ordning
  // asc = lägsta packet först, desc = högsta först
  if (sort -eq 'desc') {
    data.sort((a,b) => b.packet - a.packet);
  } else {
    // default asc
    data.sort((a,b) => a.packet - b.packet);
  }

  // 7. limit
  if (limit) {
    const lim = parseInt(limit, 10);
    if (!isNaN(lim) && lim > 0) {
      data = data.slice(0, lim);
    }
  }

  res.json(data);
});
// ================= Slut på ADVANCED QUERY =================

