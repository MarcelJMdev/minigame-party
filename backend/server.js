require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'marcel00';

// Wichtig: Vertraue dem Proxy (für Render.com)
app.set('trust proxy', 1);

// ================= Middleware =================
// CORS konfigurieren
const corsOptions = {
  origin: function (origin, callback) {
    // Erlaube Requests ohne Origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://minigame-party.onrender.com',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Oder false für strikte CORS
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100,
  message: { error: 'Zu viele Anfragen, bitte später erneut versuchen' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter Rate Limiting für Auth-Endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { error: 'Zu viele Login-Versuche, bitte später erneut versuchen' }
});

app.use('/api/', limiter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ================= Auth Middleware =================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Kein Token vorhanden' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token-Verifikation fehlgeschlagen:', err.message);
      return res.status(403).json({ error: 'Ungültiger Token' });
    }
    req.user = user;
    next();
  });
};

// ================= AUTH ROUTES =================
app.post('/api/register', authLimiter, async (req, res) => {
  try {
    const { username, password, ipAddress } = req.body;
    
    // Validierung
    if (!username || !password) {
      return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
    }
    
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Benutzername muss 3-20 Zeichen lang sein' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
    }

    const userCheck = await db.getUserByUsername(username);
    if (userCheck) {
      return res.status(400).json({ error: 'Benutzername bereits vergeben' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const clientIp = ipAddress || req.ip || req.connection.remoteAddress;
    const userId = await db.createUser(username, hashedPassword, clientIp);
    const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      token, 
      userId, 
      username,
      message: 'Registrierung erfolgreich'
    });
  } catch (error) {
    console.error('Registrierungsfehler:', error);
    res.status(500).json({ error: 'Serverfehler bei der Registrierung' });
  }
});

app.post('/api/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
    }

    const user = await db.getUserByUsername(username);
    if (!user) {
      return res.status(400).json({ error: 'Falscher Benutzername oder Passwort' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Falscher Benutzername oder Passwort' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token, 
      userId: user.id, 
      username: user.username, 
      hasAvatar: !!user.avatar,
      coins: user.coins || 0
    });
  } catch (error) {
    console.error('Login-Fehler:', error);
    res.status(500).json({ error: 'Serverfehler beim Login' });
  }
});

// ================= USER ROUTES =================
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    res.json({
      username: user.username,
      coins: user.coins || 0,
      avatar: user.avatar,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Profil-Fehler:', error);
    res.status(500).json({ error: 'Serverfehler beim Laden des Profils' });
  }
});

app.post('/api/user/avatar', authenticateToken, async (req, res) => {
  try {
    const { avatar } = req.body;
    
    if (!avatar) {
      return res.status(400).json({ error: 'Avatar-Daten fehlen' });
    }
    
    // Validiere Base64 Format
    if (!avatar.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Ungültiges Avatar-Format' });
    }
    
    await db.updateAvatar(req.user.userId, avatar);
    res.json({ 
      message: 'Avatar erfolgreich gespeichert',
      success: true 
    });
  } catch (error) {
    console.error('Avatar-Fehler:', error);
    res.status(500).json({ error: 'Serverfehler beim Speichern des Avatars' });
  }
});

app.get('/api/user/avatar', authenticateToken, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
    
    res.json({ 
      avatar: user.avatar,
      hasAvatar: !!user.avatar
    });
  } catch (error) {
    console.error('Avatar-Abruf-Fehler:', error);
    res.status(500).json({ error: 'Serverfehler beim Laden des Avatars' });
  }
});

app.put('/api/user/username', authenticateToken, async (req, res) => {
  try {
    const { newUsername } = req.body;
    
    if (!newUsername) {
      return res.status(400).json({ error: 'Neuer Benutzername erforderlich' });
    }
    
    if (newUsername.length < 3 || newUsername.length > 20) {
      return res.status(400).json({ error: 'Benutzername muss 3-20 Zeichen lang sein' });
    }
    
    const existing = await db.getUserByUsername(newUsername);
    if (existing) {
      return res.status(400).json({ error: 'Benutzername bereits vergeben' });
    }

    await db.updateUsername(req.user.userId, newUsername);
    
    // Neuen Token mit aktualisiertem Username
    const token = jwt.sign(
      { userId: req.user.userId, username: newUsername }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({ 
      message: 'Benutzername erfolgreich geändert',
      token,
      username: newUsername
    });
  } catch (error) {
    console.error('Username-Fehler:', error);
    res.status(500).json({ error: 'Serverfehler beim Ändern des Benutzernamens' });
  }
});

app.put('/api/user/password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Altes und neues Passwort erforderlich' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Neues Passwort muss mindestens 6 Zeichen lang sein' });
    }
    
    const user = await db.getUserById(req.user.userId);
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    
    if (!validPassword) {
      return res.status(400).json({ error: 'Altes Passwort falsch' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.updatePassword(req.user.userId, hashedPassword);
    
    res.json({ message: 'Passwort erfolgreich geändert' });
  } catch (error) {
    console.error('Passwort-Fehler:', error);
    res.status(500).json({ error: 'Serverfehler beim Ändern des Passworts' });
  }
});

// ================= GAME ROUTES =================
app.post('/api/scores', authenticateToken, async (req, res) => {
  try {
    const { game, score } = req.body;
    
    if (!game || typeof score !== 'number') {
      return res.status(400).json({ error: 'Spiel und Score erforderlich' });
    }
    
    if (score < 0 || score > 1000000) {
      return res.status(400).json({ error: 'Ungültiger Score' });
    }
    
    await db.saveScore(req.user.userId, game, score);
    const coins = Math.floor(score / 10);
    await db.addCoins(req.user.userId, coins);
    
    res.json({ 
      message: 'Score erfolgreich gespeichert', 
      coins,
      score 
    });
  } catch (error) {
    console.error('Score-Fehler:', error);
    res.status(500).json({ error: 'Serverfehler beim Speichern des Scores' });
  }
});

app.get('/api/leaderboard/:game/:type', async (req, res) => {
  try {
    const { game, type } = req.params;
    
    if (!['daily', 'weekly', 'alltime'].includes(type)) {
      return res.status(400).json({ error: 'Ungültiger Leaderboard-Typ' });
    }
    
    const scores = await db.getLeaderboard(game, type);
    res.json(scores);
  } catch (error) {
    console.error('Leaderboard-Fehler:', error);
    res.status(500).json({ error: 'Serverfehler beim Laden des Leaderboards' });
  }
});

// ================= Frontend ausliefern =================
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('*', (req, res) => {
  // API-Routes nicht zum Frontend weiterleiten
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API-Endpoint nicht gefunden' });
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ================= Error Handler =================
app.use((err, req, res, next) => {
  console.error('Unbehandelter Fehler:', err);
  res.status(500).json({ 
    error: 'Interner Serverfehler',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ================= SERVER START =================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`);
  console.log(`📍 API verfügbar unter: https://minigame-party.onrender.com/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM empfangen. Server wird heruntergefahren...');
  server.close(() => {
    console.log('Server geschlossen');
    process.exit(0);
  });
});

module.exports = app;