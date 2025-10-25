const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'minigame.db');
const db = new sqlite3.Database(dbPath);

// Datenbank initialisieren
db.serialize(() => {
  // Users Tabelle - MIT is_guest und nickname Spalten
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

  // Scores Tabelle
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

  // Index für schnellere Abfragen
  db.run('CREATE INDEX IF NOT EXISTS idx_scores_game ON scores(game)');
  db.run('CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at)');
  db.run('CREATE INDEX IF NOT EXISTS idx_users_guest ON users(is_guest)');
});

// ================= USER FUNCTIONS =================

// Normalen User erstellen
function createUser(username, password, ipAddress) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (username, password, ip_address, is_guest) VALUES (?, ?, ?, 0)',
      [username, password, ipAddress],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

// GAST-USER ERSTELLEN (NEU!)
function createGuestUser(username, nickname, ipAddress) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (username, nickname, password, ip_address, is_guest) VALUES (?, ?, NULL, ?, 1)',
      [username, nickname, ipAddress],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE username = ?',
      [username],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

function getUserById(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE id = ?',
      [userId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

function updateAvatar(userId, avatar) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatar, userId],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function updateUsername(userId, newUsername) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET username = ? WHERE id = ?',
      [newUsername, userId],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function updatePassword(userId, hashedPassword) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function addCoins(userId, coins) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET coins = coins + ? WHERE id = ?',
      [coins, userId],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

// Gast-Account zu registriertem Account upgraden (NEU!)
function upgradeGuestToUser(userId, newUsername, hashedPassword) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET username = ?, password = ?, is_guest = 0, nickname = NULL WHERE id = ?',
      [newUsername, hashedPassword, userId],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

// ================= SCORE FUNCTIONS =================

function saveScore(userId, game, score) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO scores (user_id, game, score) VALUES (?, ?, ?)',
      [userId, game, score],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

function getLeaderboard(game, type) {
  return new Promise((resolve, reject) => {
    let timeFilter = '';
    
    if (type === 'daily') {
      timeFilter = "AND DATE(scores.created_at) = DATE('now')";
    } else if (type === 'weekly') {
      timeFilter = "AND DATE(scores.created_at) >= DATE('now', '-7 days')";
    }

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
        // Verwende Nickname für Gäste, sonst Username
        const formattedRows = rows.map(row => ({
          ...row,
          displayName: row.is_guest && row.nickname ? row.nickname : row.username
        }));
        resolve(formattedRows);
      }
    });
  });
}

// ================= CLEANUP FUNCTIONS =================

// Alte Gast-Accounts löschen (älter als 7 Tage)
function cleanupOldGuests() {
  return new Promise((resolve, reject) => {
    db.run(
      "DELETE FROM users WHERE is_guest = 1 AND created_at < DATE('now', '-7 days')",
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

// Cleanup Job alle 24 Stunden
setInterval(() => {
  cleanupOldGuests()
    .then(() => console.log('✓ Alte Gast-Accounts bereinigt'))
    .catch(err => console.error('Fehler beim Bereinigen:', err));
}, 24 * 60 * 60 * 1000);

module.exports = {
  createUser,
  createGuestUser,
  getUserByUsername,
  getUserById,
  updateAvatar,
  updateUsername,
  updatePassword,
  addCoins,
  saveScore,
  getLeaderboard,
  cleanupOldGuests
};