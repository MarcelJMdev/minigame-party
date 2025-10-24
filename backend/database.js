const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./minigame.db');

// Datenbank initialisieren
db.serialize(() => {
  // Users Tabelle
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      avatar TEXT,
      coins INTEGER DEFAULT 0,
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
  db.run(`CREATE INDEX IF NOT EXISTS idx_scores_game ON scores(game, score DESC)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_scores_date ON scores(created_at)`);
});

// Helper Funktionen
const promisify = (fn) => {
  return (...args) => {
    return new Promise((resolve, reject) => {
      fn(...args, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
};

const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));
const dbRun = promisify(db.run.bind(db));

// User Funktionen
const getUserByUsername = (username) => {
  return dbGet('SELECT * FROM users WHERE username = ?', [username]);
};

const getUserById = (id) => {
  return dbGet('SELECT * FROM users WHERE id = ?', [id]);
};

const createUser = async (username, password, ip) => {
  const result = await dbRun(
    'INSERT INTO users (username, password, ip_address) VALUES (?, ?, ?)',
    [username, password, ip]
  );
  return result.lastID;
};

const updateAvatar = (userId, avatar) => {
  return dbRun('UPDATE users SET avatar = ? WHERE id = ?', [avatar, userId]);
};

const updateUsername = (userId, username) => {
  return dbRun('UPDATE users SET username = ? WHERE id = ?', [username, userId]);
};

const updatePassword = (userId, password) => {
  return dbRun('UPDATE users SET password = ? WHERE id = ?', [password, userId]);
};

const addCoins = async (userId, amount) => {
  return dbRun('UPDATE users SET coins = coins + ? WHERE id = ?', [amount, userId]);
};

// Score Funktionen
const saveScore = (userId, game, score) => {
  return dbRun(
    'INSERT INTO scores (user_id, game, score) VALUES (?, ?, ?)',
    [userId, game, score]
  );
};

const getLeaderboard = async (game, type) => {
  let query = `
    SELECT 
      u.username,
      u.avatar,
      s.score,
      s.created_at
    FROM scores s
    JOIN users u ON s.user_id = u.id
    WHERE s.game = ?
  `;

  if (type === 'daily') {
    query += ` AND DATE(s.created_at) = DATE('now')`;
  }

  query += ` ORDER BY s.score DESC LIMIT 100`;

  return dbAll(query, [game]);
};

module.exports = {
  getUserByUsername,
  getUserById,
  createUser,
  updateAvatar,
  updateUsername,
  updatePassword,
  addCoins,
  saveScore,
  getLeaderboard
};