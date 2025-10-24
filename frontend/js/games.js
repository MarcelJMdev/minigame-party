// Games Helper Functions
const API_URL = 'http://localhost:3000/api';

// Save game score
async function saveGameScore(gameName, score) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    window.location.href = '../login.html';
    return null;
  }
  
  try {
    const response = await fetch(`${API_URL}/scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ game: gameName, score })
    });
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, coins: data.coins };
    } else {
      const data = await response.json();
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Save score error:', error);
    return { success: false, error: 'Verbindungsfehler' };
  }
}

// Load leaderboard
async function loadLeaderboard(gameName, type = 'daily') {
  try {
    const response = await fetch(`${API_URL}/leaderboard/${gameName}/${type}`);
    
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      console.error('Leaderboard load error');
      return [];
    }
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return [];
  }
}

// Display leaderboard in HTML
function displayLeaderboard(containerId, leaderboardData) {
  const container = document.getElementById(containerId);
  
  if (!container) return;
  
  if (leaderboardData.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 20px; opacity: 0.7;">Noch keine Einträge</p>';
    return;
  }
  
  container.innerHTML = leaderboardData.slice(0, 10).map((entry, index) => {
    const rank = index + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
    
    return `
      <div class="leaderboard-item">
        <span class="rank">${medal}</span>
        ${entry.avatar ? `<img src="${entry.avatar}" alt="Avatar">` : '<div style="width: 40px; height: 40px; background: #ccc; border-radius: 50%;"></div>'}
        <span class="username">${escapeHtml(entry.username)}</span>
        <span class="score">${formatScore(entry.score)}</span>
      </div>
    `;
  }).join('');
}

// Format score for display
function formatScore(score) {
  if (score >= 1000000) {
    return (score / 1000000).toFixed(1) + 'M';
  } else if (score >= 1000) {
    return (score / 1000).toFixed(1) + 'K';
  }
  return score.toString();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Switch leaderboard tabs
function switchLeaderboardTab(tabElement, type, gameName, containerId) {
  // Remove active class from all tabs
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => tab.classList.remove('active'));
  
  // Add active class to clicked tab
  tabElement.classList.add('active');
  
  // Load and display new leaderboard
  loadLeaderboard(gameName, type).then(data => {
    displayLeaderboard(containerId, data);
  });
}

// Game Timer
class GameTimer {
  constructor(displayElementId) {
    this.displayElement = document.getElementById(displayElementId);
    this.startTime = 0;
    this.interval = null;
    this.isRunning = false;
  }
  
  start() {
    this.startTime = Date.now();
    this.isRunning = true;
    this.interval = setInterval(() => this.update(), 100);
  }
  
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
  }
  
  reset() {
    this.stop();
    this.startTime = 0;
    if (this.displayElement) {
      this.displayElement.textContent = '0.0';
    }
  }
  
  update() {
    if (!this.isRunning) return;
    
    const elapsed = (Date.now() - this.startTime) / 1000;
    if (this.displayElement) {
      this.displayElement.textContent = elapsed.toFixed(1);
    }
  }
  
  getElapsedTime() {
    return (Date.now() - this.startTime) / 1000;
  }
}

// Score Calculator
class ScoreCalculator {
  static calculateTimeScore(timeInSeconds, baseScore = 10000) {
    // Less time = higher score
    return Math.max(0, Math.round(baseScore / timeInSeconds));
  }
  
  static calculateAccuracyScore(accuracy, baseScore = 10000) {
    // Accuracy is 0-100
    return Math.round((accuracy / 100) * baseScore);
  }
  
  static calculateComboScore(basePoints, multiplier) {
    return Math.round(basePoints * multiplier);
  }
  
  static penalizeErrors(score, errorCount, penaltyPerError = 100) {
    return Math.max(0, score - (errorCount * penaltyPerError));
  }
}

// Sound Effects (optional - uses Web Audio API)
class SoundEffects {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log('Web Audio API not supported');
      this.enabled = false;
    }
  }
  
  playTone(frequency = 440, duration = 100, volume = 0.3) {
    if (!this.enabled || !this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration / 1000);
  }
  
  playSuccess() {
    this.playTone(523.25, 100, 0.2); // C5
    setTimeout(() => this.playTone(659.25, 100, 0.2), 100); // E5
    setTimeout(() => this.playTone(783.99, 150, 0.2), 200); // G5
  }
  
  playError() {
    this.playTone(200, 200, 0.3);
  }
  
  playClick() {
    this.playTone(800, 50, 0.1);
  }
}

// Canvas Helper
class CanvasHelper {
  static clearCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  
  static drawText(canvas, text, x, y, options = {}) {
    const ctx = canvas.getContext('2d');
    ctx.font = options.font || '20px Arial';
    ctx.fillStyle = options.color || '#000000';
    ctx.textAlign = options.align || 'left';
    ctx.textBaseline = options.baseline || 'top';
    ctx.fillText(text, x, y);
  }
  
  static drawRect(canvas, x, y, width, height, color = '#000000') {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  }
  
  static drawCircle(canvas, x, y, radius, color = '#000000', fill = true) {
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    if (fill) {
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      ctx.strokeStyle = color;
      ctx.stroke();
    }
  }
}

// Utility Functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}