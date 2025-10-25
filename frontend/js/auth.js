// Auth Helper Functions
const API_URL = 'https://minigame-party.onrender.com/api';

// Check if user is authenticated
function isAuthenticated() {
  const token = localStorage.getItem('token');
  return !!token;
}

// Check if user is guest
function isGuest() {
  return localStorage.getItem('isGuest') === 'true';
}

// Get current token
function getToken() {
  return localStorage.getItem('token');
}

// Get current username
function getUsername() {
  return localStorage.getItem('username');
}

// Get nickname (for guests)
function getNickname() {
  return localStorage.getItem('nickname');
}

// Get display name (nickname for guests, username for registered users)
function getDisplayName() {
  if (isGuest()) {
    return getNickname() || getUsername();
  }
  return getUsername();
}

// Set auth data
function setAuthData(token, username, isGuestUser = false, nickname = null) {
  localStorage.setItem('token', token);
  localStorage.setItem('username', username);
  localStorage.setItem('isGuest', isGuestUser.toString());
  if (nickname) {
    localStorage.setItem('nickname', nickname);
  }
}

// Clear auth data
function clearAuthData() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('isGuest');
  localStorage.removeItem('nickname');
}

// Logout function
function logout() {
  clearAuthData();
  window.location.href = '/login.html';
}

// Check authentication on protected pages
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

// Fetch with authentication
async function authenticatedFetch(endpoint, options = {}) {
  const token = getToken();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, mergedOptions);
    
    // If unauthorized, logout
    if (response.status === 401 || response.status === 403) {
      clearAuthData();
      window.location.href = '/login.html';
      return null;
    }
    
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Login function
async function loginUser(username, password) {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      setAuthData(data.token, data.username, false);
      return { success: true, data };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Verbindungsfehler' };
  }
}

// Guest Login function (NEU!)
async function guestLogin(nickname) {
  try {
    const response = await fetch(`${API_URL}/guest-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nickname })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      setAuthData(data.token, data.username, true, data.nickname);
      return { success: true, data };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Verbindungsfehler' };
  }
}

// Register function
async function registerUser(username, password) {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      setAuthData(data.token, data.username, false);
      return { success: true, data };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Verbindungsfehler' };
  }
}

// Convert guest to registered user (NEU!)
async function upgradeGuestAccount(username, password) {
  try {
    const response = await authenticatedFetch('/user/upgrade', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    if (!response) return { success: false, error: 'Nicht authentifiziert' };
    
    const data = await response.json();
    
    if (response.ok) {
      setAuthData(data.token, data.username, false);
      return { success: true, data };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Verbindungsfehler' };
  }
}

// Validate password strength
function validatePassword(password) {
  if (password.length < 6) {
    return { valid: false, message: 'Passwort muss mindestens 6 Zeichen lang sein' };
  }
  return { valid: true };
}

// Validate username
function validateUsername(username) {
  if (username.length < 3) {
    return { valid: false, message: 'Benutzername muss mindestens 3 Zeichen lang sein' };
  }
  if (username.length > 20) {
    return { valid: false, message: 'Benutzername darf maximal 20 Zeichen lang sein' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, message: 'Benutzername darf nur Buchstaben, Zahlen, _ und - enthalten' };
  }
  return { valid: true };
}

// Validate nickname (for guests)
function validateNickname(nickname) {
  if (nickname.length < 2) {
    return { valid: false, message: 'Nickname muss mindestens 2 Zeichen lang sein' };
  }
  if (nickname.length > 20) {
    return { valid: false, message: 'Nickname darf maximal 20 Zeichen lang sein' };
  }
  return { valid: true };
}

// Show message helper
function showMessage(elementId, message, type = 'error') {
  const element = document.getElementById(elementId);
  if (element) {
    element.className = type;
    element.textContent = message;
    element.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideMessage(elementId);
    }, 5000);
  }
}

// Hide message helper
function hideMessage(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = 'none';
  }
}

// Show guest banner/notification
function showGuestBanner() {
  if (!isGuest()) return;
  
  const banner = document.createElement('div');
  banner.id = 'guest-banner';
  banner.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 20px;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      font-family: Arial, sans-serif;
    ">
      <strong>🎮 Du spielst als Gast!</strong>
      <span style="margin: 0 15px;">Dein Fortschritt wird nach 24h gelöscht.</span>
      <button onclick="showUpgradeModal()" style="
        background: white;
        color: #667eea;
        border: none;
        padding: 8px 16px;
        border-radius: 5px;
        font-weight: bold;
        cursor: pointer;
        margin-left: 10px;
      ">Account erstellen</button>
      <button onclick="closeGuestBanner()" style="
        background: transparent;
        color: white;
        border: 2px solid white;
        padding: 8px 16px;
        border-radius: 5px;
        font-weight: bold;
        cursor: pointer;
        margin-left: 10px;
      ">Schließen</button>
    </div>
  `;
  
  if (!document.getElementById('guest-banner')) {
    document.body.insertBefore(banner, document.body.firstChild);
    
    // Add margin to body to prevent content overlap
    document.body.style.paddingTop = '70px';
  }
}

// Close guest banner
function closeGuestBanner() {
  const banner = document.getElementById('guest-banner');
  if (banner) {
    banner.remove();
    document.body.style.paddingTop = '0';
  }
}

// Show upgrade modal
function showUpgradeModal() {
  const existingModal = document.getElementById('upgrade-modal');
  if (existingModal) existingModal.remove();
  
  const modal = document.createElement('div');
  modal.id = 'upgrade-modal';
  modal.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
    ">
      <div style="
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      ">
        <h2 style="margin-top: 0; color: #333;">🎯 Account erstellen</h2>
        <p style="color: #666;">Sichere deinen Fortschritt permanent!</p>
        
        <div id="upgrade-message" style="display: none; padding: 10px; border-radius: 5px; margin-bottom: 15px;"></div>
        
        <form id="upgradeForm">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; color: #333; font-weight: bold;">Benutzername</label>
            <input type="text" id="upgrade-username" required style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 8px;
              font-size: 16px;
              box-sizing: border-box;
            ">
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; color: #333; font-weight: bold;">Passwort</label>
            <input type="password" id="upgrade-password" required style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 8px;
              font-size: 16px;
              box-sizing: border-box;
            ">
          </div>
          
          <div style="display: flex; gap: 10px;">
            <button type="submit" style="
              flex: 1;
              padding: 12px;
              background: #27ae60;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
            ">Erstellen</button>
            <button type="button" onclick="closeUpgradeModal()" style="
              flex: 1;
              padding: 12px;
              background: #95a5a6;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
            ">Abbrechen</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Handle form submission
  document.getElementById('upgradeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('upgrade-username').value.trim();
    const password = document.getElementById('upgrade-password').value.trim();
    
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      showUpgradeMessage(usernameValidation.message, 'error');
      return;
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      showUpgradeMessage(passwordValidation.message, 'error');
      return;
    }
    
    const result = await upgradeGuestAccount(username, password);
    
    if (result.success) {
      showUpgradeMessage('Account erfolgreich erstellt! 🎉', 'success');
      setTimeout(() => {
        closeUpgradeModal();
        closeGuestBanner();
        window.location.reload();
      }, 1500);
    } else {
      showUpgradeMessage(result.error, 'error');
    }
  });
}

// Close upgrade modal
function closeUpgradeModal() {
  const modal = document.getElementById('upgrade-modal');
  if (modal) modal.remove();
}

// Show message in upgrade modal
function showUpgradeMessage(message, type) {
  const msgEl = document.getElementById('upgrade-message');
  if (msgEl) {
    msgEl.textContent = message;
    msgEl.style.display = 'block';
    msgEl.style.background = type === 'error' ? '#f8d7da' : '#d4edda';
    msgEl.style.color = type === 'error' ? '#721c24' : '#155724';
    msgEl.style.border = type === 'error' ? '1px solid #f5c6cb' : '1px solid #c3e6cb';
  }
}

// Auto-show guest banner on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (isGuest()) showGuestBanner();
  });
} else {
  if (isGuest()) showGuestBanner();
}