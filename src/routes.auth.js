// src/routes.auth.js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Users } from './db.js';
import { signToken, verifyJWT } from './auth.js';

const r = Router();

/**
 * POST /auth/register
 * body: { email, password, role }  role: 'sender' | 'carrier' | 'receiver' | 'admin'
 */
r.post('/register', async (req, res) => {
  const { email, password, role = 'sender' } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'EMAIL_PASSWORD_REQUIRED' });
  if (!['sender','carrier','receiver','admin'].includes(role)) return res.status(400).json({ error: 'INVALID_ROLE' });

  const existed = Users.findByEmail(email);
  if (existed) return res.status(409).json({ error: 'EMAIL_EXISTS' });

  const password_hash = await bcrypt.hash(password, 10);
  const user = Users.create({ email, password_hash, role });
  const token = signToken(user);
  res.status(201).json({ user, token });
});

/**
 * POST /auth/login
 * body: { email, password }
 */
r.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'EMAIL_PASSWORD_REQUIRED' });

  const user = Users.findByEmail(email);
  if (!user) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

  const token = signToken(user);
  res.json({ user: { id: user.id, email: user.email, role: user.role }, token });
});

/**
 * GET /auth/me  
 * header: Authorization: Bearer <token>
 */
r.get('/me', verifyJWT, (req, res) => {
  res.json({ user: req.user });
});

export default r;
