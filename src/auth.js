// src/auth.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES = '7d'; 

export function signToken(user) {
  return jwt.sign({ uid: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyJWT(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'NO_TOKEN' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'INVALID_TOKEN' });
  }
}


export function requireRole(roles) {
  const allow = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'NO_AUTH' });
    if (!allow.includes(req.user.role)) return res.status(403).json({ error: 'FORBIDDEN' });
    next();
  };
}
