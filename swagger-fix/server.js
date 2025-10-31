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
