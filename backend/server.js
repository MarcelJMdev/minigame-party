import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

import db, {
  createUser,
  createGuestUser,
  getUserByUsername,
  getUserById,
  updateAvatar,
  addCoins,
  upgradeGuestToUser,
  saveScore,
  getLeaderboard
} from "./database.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "marcel00";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("trust proxy", 1); // Wichtig für Render

// ================= Middleware =================
const corsOptions = {
  origin: [
    "https://minigame-party.onrender.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Zu viele Anfragen, bitte später erneut versuchen" }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: { error: "Zu viele Login-Versuche, bitte später erneut versuchen" }
});

app.use("/api/", limiter);

// ================= Health Check =================
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ================= Auth Middleware =================
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Kein Token vorhanden" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Ungültiger Token" });
    req.user = user;
    next();
  });
}

// ================= AUTH ROUTES =================
app.post("/api/guest-login", authLimiter, async (req, res) => {
  try {
    const { nickname } = req.body;
    if (!nickname || nickname.trim().length < 2 || nickname.length > 20)
      return res.status(400).json({ error: "Nickname muss 2–20 Zeichen haben" });

    const guestUsername = `Gast_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 6)}`;
    const clientIp = req.ip;

    const userId = await createGuestUser(guestUsername, nickname, clientIp);

    const token = jwt.sign(
      { userId, username: guestUsername, nickname, isGuest: true },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      token,
      userId,
      username: guestUsername,
      nickname,
      isGuest: true,
      message: "Als Gast angemeldet"
    });
  } catch (err) {
    console.error("Gast-Login-Fehler:", err);
    res.status(500).json({ error: "Serverfehler beim Gast-Login" });
  }
});

app.post("/api/register", authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res
        .status(400)
        .json({ error: "Benutzername und Passwort erforderlich" });

    if (username.length < 3 || username.length > 20)
      return res
        .status(400)
        .json({ error: "Benutzername muss 3–20 Zeichen lang sein" });

    if (password.length < 6)
      return res
        .status(400)
        .json({ error: "Passwort muss mindestens 6 Zeichen lang sein" });

    const existing = await getUserByUsername(username);
    if (existing)
      return res.status(400).json({ error: "Benutzername bereits vergeben" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const clientIp = req.ip;

    const userId = await createUser(username, hashedPassword, clientIp);
    const token = jwt.sign(
      { userId, username, isGuest: false },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      userId,
      username,
      isGuest: false,
      message: "Registrierung erfolgreich"
    });
  } catch (err) {
    console.error("Registrierungsfehler:", err);
    res.status(500).json({ error: "Serverfehler bei der Registrierung" });
  }
});

app.post("/api/login", authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await getUserByUsername(username);
    if (!user) return res.status(400).json({ error: "Benutzer nicht gefunden" });
    if (user.is_guest)
      return res.status(400).json({ error: "Gast-Accounts können sich nicht einloggen" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ error: "Falscher Benutzername oder Passwort" });

    const token = jwt.sign(
      { userId: user.id, username: user.username, isGuest: false },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      userId: user.id,
      username: user.username,
      coins: user.coins || 0,
      isGuest: false
    });
  } catch (err) {
    console.error("Login-Fehler:", err);
    res.status(500).json({ error: "Serverfehler beim Login" });
  }
});

// ================= USER ROUTES =================
app.get("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const user = await getUserById(req.user.userId);
    if (!user) return res.status(404).json({ error: "Benutzer nicht gefunden" });

    res.json({
      username: user.username,
      nickname: user.nickname,
      coins: user.coins || 0,
      avatar: user.avatar,
      createdAt: user.created_at,
      isGuest: user.is_guest || false
    });
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Laden des Profils" });
  }
});

app.post("/api/user/avatar", authenticateToken, async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar || !avatar.startsWith("data:image/"))
      return res.status(400).json({ error: "Ungültiges Avatar-Format" });

    await updateAvatar(req.user.userId, avatar);
    res.json({ message: "Avatar gespeichert" });
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Speichern des Avatars" });
  }
});

app.post("/api/scores", authenticateToken, async (req, res) => {
  try {
    const { game, score } = req.body;
    if (!game || typeof score !== "number")
      return res.status(400).json({ error: "Spiel und Score erforderlich" });

    await saveScore(req.user.userId, game, score);
    const coins = Math.floor(score / 10);
    await addCoins(req.user.userId, coins);

    res.json({ message: "Score gespeichert", coins, score });
  } catch (err) {
    console.error("Score-Fehler:", err);
    res.status(500).json({ error: "Fehler beim Speichern des Scores" });
  }
});

app.get("/api/leaderboard/:game/:type", async (req, res) => {
  try {
    const { game, type } = req.params;
    const scores = await getLeaderboard(game, type);
    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Leaderboard" });
  }
});

// ================= STATIC FRONTEND =================
app.use(express.static(path.join(__dirname, "../frontend")));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api"))
    return res.status(404).json({ error: "API nicht gefunden" });
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ================= START SERVER =================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`);
  console.log(`📍 API unter: https://minigame-party.onrender.com/api`);
});
