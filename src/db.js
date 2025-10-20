// src/db.js
import Database from 'better-sqlite3';

const db = new Database('data.sqlite'); 

// --- Migrations ---
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('sender','carrier','receiver','admin')),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tracking_id TEXT UNIQUE NOT NULL,
  company_id INTEGER REFERENCES companies(id),
  recipient_name TEXT,
  status TEXT DEFAULT 'created',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS telemetry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_id INTEGER REFERENCES packages(id),
  payload TEXT NOT NULL,     
  ts INTEGER NOT NULL,      
  created_at INTEGER NOT NULL
);
`);

export default db;


export const Users = {
  create({ email, password_hash, role }) {
    const stmt = db.prepare(`INSERT INTO users (email, password_hash, role, created_at)
                             VALUES (@email,@password_hash,@role,@created_at)`);
    const info = stmt.run({ email, password_hash, role, created_at: Date.now() });
    return db.prepare(`SELECT id,email,role,created_at FROM users WHERE id=?`).get(info.lastInsertRowid);
  },
  findByEmail(email) {
    return db.prepare(`SELECT * FROM users WHERE email=?`).get(email);
  }
};
