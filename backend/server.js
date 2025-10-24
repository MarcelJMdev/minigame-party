require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dein-super-geheimer-key-hier';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100
});
app.use(limiter);

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Kein Token vorhanden' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Ungültiger Token' });
    req.user = user;
    next();
  });
};

// ============= AUTH ROUTES =============

// Registrierung
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, ipAddress } = req.body;

    // Username Check
    const userCheck = await db.getUserByUsername(username);
    if (userCheck) {
      return res.status(400).json({ error: 'Benutzername bereits vergeben' });
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);

    // User erstellen
    const userId = await db.createUser(username, hashedPassword, ipAddress);
    const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, userId, username });
  } catch (error) {
    console.error('Registrierungsfehler:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await db.getUserByUsername(username);
    if (!user) {
      return res.status(400).json({ error: 'Falscher Benutzername oder Passwort' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Falscher Benutzername oder Passwort' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      token, 
      userId: user.id, 
      username: user.username,
      hasAvatar: !!user.avatar
    });
  } catch (error) {
    console.error('Login-Fehler:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ============= USER ROUTES =============

// Profil abrufen
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    res.json({
      username: user.username,
      coins: user.coins,
      avatar: user.avatar,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Profil-Fehler:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Avatar speichern
app.post('/api/user/avatar', authenticateToken, async (req, res) => {
  try {
    const { avatar } = req.body;
    await db.updateAvatar(req.user.userId, avatar);
    res.json({ message: 'Avatar gespeichert' });
  } catch (error) {
    console.error('Avatar-Fehler:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Username ändern
app.put('/api/user/username', authenticateToken, async (req, res) => {
  try {
    const { newUsername } = req.body;
    
    const existing = await db.getUserByUsername(newUsername);
    if (existing) {
      return res.status(400).json({ error: 'Benutzername bereits vergeben' });
    }

    await db.updateUsername(req.user.userId, newUsername);
    res.json({ message: 'Benutzername geändert' });
  } catch (error) {
    console.error('Username-Fehler:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Passwort ändern
app.put('/api/user/password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    const user = await db.getUserById(req.user.userId);
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    
    if (!validPassword) {
      return res.status(400).json({ error: 'Altes Passwort falsch' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.updatePassword(req.user.userId, hashedPassword);
    
    res.json({ message: 'Passwort geändert' });
  } catch (error) {
    console.error('Passwort-Fehler:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ============= GAME ROUTES =============

// Score speichern
app.post('/api/scores', authenticateToken, async (req, res) => {
  try {
    const { game, score } = req.body;
    await db.saveScore(req.user.userId, game, score);
    
    // Münzen hinzufügen (z.B. score / 10)
    const coins = Math.floor(score / 10);
    await db.addCoins(req.user.userId, coins);
    
    res.json({ message: 'Score gespeichert', coins });
  } catch (error) {
    console.error('Score-Fehler:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Ranglisten abrufen
app.get('/api/leaderboard/:game/:type', async (req, res) => {
  try {
    const { game, type } = req.params;
    const scores = await db.getLeaderboard(game, type);
    res.json(scores);
  } catch (error) {
    console.error('Leaderboard-Fehler:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Server starten
app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});