import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Datenbankpfad
const dbPath = path.join(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("❌ Konnte Datenbank nicht öffnen:", err);
  else console.log("✅ SQLite verbunden:", dbPath);
});

// ======================= INITIALISIERUNG =======================
db.serialize(() => {
  // Users-Tabelle mit allen Spalten
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      nickname TEXT,
      password TEXT,
      avatar TEXT,
      coins INTEGER DEFAULT 0,
      ip_address TEXT,
      is_guest INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Scores-Tabelle
  db.run(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Indexe
  db.run(`CREATE INDEX IF NOT EXISTS idx_scores_game ON scores(game)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_guest ON users(is_guest)`);
});

// ======================= USER-FUNKTIONEN =======================
export function createUser(username, password, ipAddress) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO users (username, password, ip_address, is_guest) VALUES (?, ?, ?, 0)`,
      [username, password, ipAddress],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

export function createGuestUser(username, nickname, ipAddress) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO users (username, nickname, password, ip_address, is_guest) VALUES (?, ?, NULL, ?, 1)`,
      [username, nickname, ipAddress],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

export function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function updateAvatar(userId, avatar) {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE users SET avatar = ? WHERE id = ?`, [avatar, userId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function addCoins(userId, coins) {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE users SET coins = coins + ? WHERE id = ?`, [coins, userId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function upgradeGuestToUser(userId, newUsername, hashedPassword) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE users SET username = ?, password = ?, is_guest = 0, nickname = NULL WHERE id = ?`,
      [newUsername, hashedPassword, userId],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

// ======================= SCORE-FUNKTIONEN =======================
export function saveScore(userId, game, score) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO scores (user_id, game, score) VALUES (?, ?, ?)`,
      [userId, game, score],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

export function getLeaderboard(game, type) {
  return new Promise((resolve, reject) => {
    let timeFilter = "";
    if (type === "daily") timeFilter = "AND DATE(scores.created_at) = DATE('now')";
    else if (type === "weekly") timeFilter = "AND DATE(scores.created_at) >= DATE('now', '-7 days')";

    const query = `
      SELECT 
        users.username,
        users.nickname,
        users.avatar,
        users.is_guest,
        MAX(scores.score) as score,
        scores.created_at
      FROM scores
      JOIN users ON scores.user_id = users.id
      WHERE scores.game = ? ${timeFilter}
      GROUP BY scores.user_id
      ORDER BY score DESC
      LIMIT 100
    `;

    db.all(query, [game], (err, rows) => {
      if (err) reject(err);
      else {
        const formatted = rows.map(r => ({
          ...r,
          displayName: r.is_guest && r.nickname ? r.nickname : r.username,
        }));
        resolve(formatted);
      }
    });
  });
}

// ======================= AUTO-CLEANUP =======================
function cleanupOldGuests() {
  db.run(`DELETE FROM users WHERE is_guest = 1 AND created_at < DATE('now', '-7 days')`);
}
setInterval(cleanupOldGuests, 24 * 60 * 60 * 1000);

export default db;
