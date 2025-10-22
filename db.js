const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const defaultDb =
  process.env.DB_FILE ||
  (process.env.WEBSITE_SITE_NAME ? "/home/data/app.db" : path.join(__dirname, "data", "app.db"));

fs.mkdirSync(path.dirname(defaultDb), { recursive: true });

const db = new sqlite3.Database(defaultDb);
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts DATETIME DEFAULT CURRENT_TIMESTAMP,
    key TEXT,
    value TEXT
  )`);
});

module.exports = { db, defaultDb };

