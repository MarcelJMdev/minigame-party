<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>⚡ Reaktionstest - Minigame Party</title>
  <link rel="stylesheet" href="../css/style.css">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
    }

    h1 {
      text-align: center;
      font-size: 3em;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    .game-info {
      background: rgba(0, 0, 0, 0.3);
      padding: 20px;
      border-radius: 15px;
      margin-bottom: 20px;
      backdrop-filter: blur(10px);
    }

    .game-info h2 {
      font-size: 1.8em;
      margin-bottom: 10px;
      text-align: center;
    }

    .game-info p {
      text-align: center;
      font-size: 1.1em;
      opacity: 0.9;
    }

    .stats-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }

    .stat-box {
      background: rgba(255, 255, 255, 0.15);
      padding: 15px;
      border-radius: 10px;
      text-align: center;
      border: 2px solid rgba(255, 255, 255, 0.2);
    }

    .stat-label {
      font-size: 0.9em;
      opacity: 0.8;
      margin-bottom: 5px;
    }

    .stat-value {
      font-size: 2em;
      font-weight: bold;
      color: #ffd700;
    }

    #reactionBox {
      width: 100%;
      min-height: 350px;
      background: #e74c3c;
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 2.5em;
      font-weight: bold;
      color: white;
      cursor: pointer;
      margin: 20px 0;
      transition: all 0.3s ease;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      user-select: none;
    }

    #reactionBox:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(0,0,0,0.4);
    }

    #reactionBox.waiting {
      background: linear-gradient(135deg, #e74c3c, #c0392b);
    }

    #reactionBox.ready {
      background: linear-gradient(135deg, #2ecc71, #27ae60);
    }

    #reactionBox.success {
      background: linear-gradient(135deg, #3498db, #2980b9);
    }

    #reactionBox.finished {
      background: linear-gradient(135deg, #9b59b6, #8e44ad);
    }

    #reactionBox.too-early {
      background: linear-gradient(135deg, #e67e22, #d35400);
      animation: shake 0.5s ease-in-out;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
      20%, 40%, 60%, 80% { transform: translateX(10px); }
    }

    .box-subtitle {
      font-size: 0.4em;
      opacity: 0.9;
      margin-top: 10px;
    }

    .attempts-display {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin: 15px 0;
      flex-wrap: wrap;
    }

    .attempt-dot {
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      border: 2px solid rgba(255, 255, 255, 0.5);
      transition: all 0.3s ease;
    }

    .attempt-dot.completed {
      background: #2ecc71;
      border-color: #27ae60;
    }

    .attempt-dot.active {
      background: #ffd700;
      border-color: #f39c12;
      animation: dot-pulse 1s ease-in-out infinite;
    }

    @keyframes dot-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.3); }
    }

    .button-group {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin: 20px 0;
      flex-wrap: wrap;
    }

    button {
      padding: 15px 40px;
      font-size: 1.2em;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.3s ease;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      color: white;
    }

    button:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.3);
    }

    .btn-start {
      background: linear-gradient(135deg, #2ecc71, #27ae60);
    }

    .btn-back {
      background: linear-gradient(135deg, #95a5a6, #7f8c8d);
    }

    .leaderboard {
      background: rgba(0, 0, 0, 0.3);
      padding: 25px;
      border-radius: 15px;
      margin-top: 30px;
      backdrop-filter: blur(10px);
    }

    .leaderboard h3 {
      text-align: center;
      font-size: 2em;
      margin-bottom: 20px;
      color: #ffd700;
    }

    .leaderboard-tabs {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .tab {
      padding: 10px 25px;
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      color: white;
      font-size: 1em;
      cursor: pointer;
    }

    .tab.active {
      background: linear-gradient(135deg, #3498db, #2980b9);
      border-color: #3498db;
    }

    .leaderboard-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      background: rgba(255, 255, 255, 0.1);
      margin-bottom: 10px;
      border-radius: 10px;
      border: 2px solid rgba(255, 255, 255, 0.1);
    }

    .leaderboard-item:nth-child(1) { border-color: #ffd700; }
    .leaderboard-item:nth-child(2) { border-color: #c0c0c0; }
    .leaderboard-item:nth-child(3) { border-color: #cd7f32; }

    .rank {
      font-size: 1.5em;
      font-weight: bold;
      min-width: 50px;
      text-align: center;
      color: #ffd700;
    }

    .leaderboard-item img {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      border: 3px solid rgba(255, 255, 255, 0.3);
      object-fit: cover;
    }

    .username {
      flex: 1;
      font-size: 1.2em;
      font-weight: 600;
    }

    .score {
      font-size: 1.3em;
      font-weight: bold;
      color: #2ecc71;
    }

    .no-data {
      text-align: center;
      padding: 30px;
      opacity: 0.7;
    }

    @media (max-width: 768px) {
      h1 { font-size: 2em; }
      #reactionBox { font-size: 1.5em; min-height: 250px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚡ Reaktionstest</h1>
    
    <div class="game-info">
      <h2 id="instruction">Klicke auf START</h2>
      <p>Klicke so schnell wie möglich, wenn die Farbe auf GRÜN wechselt!</p>
      
      <div class="stats-container">
        <div class="stat-box">
          <div class="stat-label">Reaktionszeit</div>
          <div class="stat-value" id="reactionTime">---</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Durchschnitt</div>
          <div class="stat-value" id="avgTime">---</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Beste Zeit</div>
          <div class="stat-value" id="bestTime">---</div>
        </div>
      </div>
    </div>
    
    <div class="attempts-display" id="attemptsDisplay"></div>
    
    <div id="reactionBox" class="waiting">
      <div>Warte...</div>
      <div class="box-subtitle">Klicke auf START</div>
    </div>
    
    <div class="button-group">
      <button class="btn-start" onclick="startReactionTest()">🎮 START</button>
      <button class="btn-back" onclick="window.location.href='../menu.html'">⬅️ Zurück</button>
    </div>
    
    <div class="leaderboard">
      <h3>🏆 Rangliste (Schnellste Reaktionen)</h3>
      <div class="leaderboard-tabs">
        <button class="tab active" onclick="loadLeaderboard('daily', this)">📅 Heute</button>
        <button class="tab" onclick="loadLeaderboard('weekly', this)">📊 Woche</button>
        <button class="tab" onclick="loadLeaderboard('alltime', this)">🌟 All-Time</button>
      </div>
      <div id="leaderboardContent">
        <div class="no-data">Lade Rangliste...</div>
      </div>
    </div>
  </div>

  <script>
    const API_URL = "https://games.farmsucht.eu/api";
    const token = localStorage.getItem('token');
    
    // Auth Check
    if (!token) {
      alert('Bitte melde dich an!');
      window.location.href = '../login.html';
    }
    
    let startTime = 0;
    let timeout = null;
    let gameActive = false;
    let gameStarted = false;
    let attempts = [];
    let currentAttempt = 0;
    const maxAttempts = 5;
    
    const reactionBox = document.getElementById('reactionBox');
    
    function initAttemptsDisplay() {
      const display = document.getElementById('attemptsDisplay');
      display.innerHTML = '';
      for (let i = 0; i < maxAttempts; i++) {
        const dot = document.createElement('div');
        dot.className = 'attempt-dot';
        dot.id = `dot-${i}`;
        display.appendChild(dot);
      }
    }
    
    function startReactionTest() {
      if (gameStarted) return;
      
      attempts = [];
      currentAttempt = 0;
      gameStarted = true;
      
      document.getElementById('reactionTime').textContent = '---';
      document.getElementById('avgTime').textContent = '---';
      document.getElementById('bestTime').textContent = '---';
      
      initAttemptsDisplay();
      runAttempt();
    }
    
    function runAttempt() {
      if (currentAttempt >= maxAttempts) {
        finishTest();
        return;
      }
      
      gameActive = false;
      
      if (currentAttempt > 0) {
        document.getElementById(`dot-${currentAttempt - 1}`).classList.remove('active');
        document.getElementById(`dot-${currentAttempt - 1}`).classList.add('completed');
      }
      document.getElementById(`dot-${currentAttempt}`).classList.add('active');
      
      reactionBox.className = 'waiting';
      reactionBox.innerHTML = `
        <div>Runde ${currentAttempt + 1}/${maxAttempts}</div>
        <div class="box-subtitle">Warte auf GRÜN...</div>
      `;
      document.getElementById('instruction').textContent = 'Warte auf GRÜN!';
      
      currentAttempt++;
      
      const waitTime = 2000 + Math.random() * 3000;
      
      timeout = setTimeout(() => {
        if (!gameStarted) return;
        
        reactionBox.className = 'ready';
        reactionBox.innerHTML = `<div>⚡ JETZT KLICKEN! ⚡</div>`;
        document.getElementById('instruction').textContent = '⚡ KLICK JETZT! ⚡';
        startTime = Date.now();
        gameActive = true;
      }, waitTime);
    }
    
    reactionBox.addEventListener('click', () => {
      if (!gameStarted) return;
      
      if (!gameActive) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        
        reactionBox.className = 'too-early';
        reactionBox.innerHTML = `
          <div>❌ Zu früh!</div>
          <div class="box-subtitle">Warte auf GRÜN</div>
        `;
        document.getElementById('instruction').textContent = 'Zu früh geklickt!';
        
        currentAttempt--;
        
        setTimeout(() => {
          if (gameStarted) runAttempt();
        }, 1500);
        return;
      }
      
      const reactionTime = Date.now() - startTime;
      attempts.push(reactionTime);
      
      document.getElementById('reactionTime').textContent = reactionTime + 'ms';
      
      const avgTime = Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length);
      document.getElementById('avgTime').textContent = avgTime + 'ms';
      
      const bestTime = Math.min(...attempts);
      document.getElementById('bestTime').textContent = bestTime + 'ms';
      
      reactionBox.className = 'success';
      reactionBox.innerHTML = `
        <div>${reactionTime}ms</div>
        <div class="box-subtitle">Gut gemacht! 🎯</div>
      `;
      
      gameActive = false;
      
      setTimeout(() => {
        if (gameStarted) runAttempt();
      }, 1500);
    });
    
    function finishTest() {
      gameStarted = false;
      
      document.getElementById(`dot-${maxAttempts - 1}`).classList.remove('active');
      document.getElementById(`dot-${maxAttempts - 1}`).classList.add('completed');
      
      const avgTime = Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length);
      const bestTime = Math.min(...attempts);
      const score = Math.max(Math.round(10000 - (avgTime * 10)), 100);
      
      reactionBox.className = 'finished';
      reactionBox.innerHTML = `
        <div>🎉 Test Abgeschlossen!</div>
        <div class="box-subtitle">Durchschnitt: ${avgTime}ms | Beste: ${bestTime}ms</div>
      `;
      document.getElementById('instruction').textContent = `Fertig! Durchschnitt: ${avgTime}ms`;
      
      saveScore(score, avgTime, bestTime);
    }
    
    async function saveScore(score, avgTime, bestTime) {
      try {
        const response = await fetch(`${API_URL}/scores`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ game: 'reaction', score })
        });
        
        if (response.ok) {
          const data = await response.json();
          alert(`🎯 Durchschnitt: ${avgTime}ms\n⚡ Beste Zeit: ${bestTime}ms\n🎮 Score: ${score}\n🪙 +${data.coins} Münzen!`);
          loadLeaderboard('daily');
        }
      } catch (error) {
        console.error('Fehler:', error);
        alert('Fehler beim Speichern des Scores');
      }
    }
    
    async function loadLeaderboard(type, element) {
      try {
        const response = await fetch(`${API_URL}/leaderboard/reaction/${type}`);
        const data = await response.json();
        
        const content = document.getElementById('leaderboardContent');
        
        if (!data || data.length === 0) {
          content.innerHTML = '<div class="no-data">Noch keine Einträge 🎮</div>';
          return;
        }
        
        content.innerHTML = data.slice(0, 10).map((entry, i) => {
          const displayName = entry.displayName || entry.username;
          const medals = ['🥇', '🥈', '🥉'];
          const medal = i < 3 ? medals[i] : '';
          
          return `
            <div class="leaderboard-item">
              <span class="rank">${medal || '#' + (i + 1)}</span>
              ${entry.avatar ? `<img src="${entry.avatar}" alt="${displayName}">` : `<div style="width:50px;height:50px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.5em;font-weight:bold;">${displayName.charAt(0).toUpperCase()}</div>`}
              <span class="username">${displayName}</span>
              <span class="score">${entry.score.toLocaleString()}</span>
            </div>
          `;
        }).join('');
        
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        if (element) element.classList.add('active');
      } catch (error) {
        console.error('Fehler:', error);
        document.getElementById('leaderboardContent').innerHTML = '<div class="no-data">Fehler beim Laden 😢</div>';
      }
    }
    
    loadLeaderboard('daily');
  </script>
</body>
</html>