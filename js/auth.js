// frontend/js/auth.js

// ================= API URL =================
const API_URL = "https://minigame-party.onrender.com/api";

// ================= Auth Helper Functions =================
function isAuthenticated() {
  return !!localStorage.getItem('token');
}

function getToken() {
  return localStorage.getItem('token');
}

function getUsername() {
  return localStorage.getItem('username');
}

function setAuthData(token, username) {
  localStorage.setItem('token', token);
  localStorage.setItem('username', username);
}

function clearAuthData() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
}

function logout() {
  clearAuthData();
  window.location.href = '/login.html';
}

function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

// ================= Fetch with Auth =================
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

// ================= Login Function =================
async function loginUser(username, password) {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      setAuthData(data.token, data.username);
      return { success: true, data };
    } else {
      console.error('Login-Fehler vom Backend:', data);
      return { success: false, error: data.error || 'Unbekannter Fehler' };
    }
  } catch (error) {
    console.error('Fetch-Fehler beim Login:', error);
    return { success: false, error: error.message || 'Verbindungsfehler' };
  }
}

// ================= Register Function =================
async function registerUser(username, password) {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      setAuthData(data.token, data.username);
      return { success: true, data };
    } else {
      console.error('Registrierungsfehler vom Backend:', data);
      return { success: false, error: data.error || 'Unbekannter Fehler' };
    }
  } catch (error) {
    console.error('Fetch-Fehler bei Registrierung:', error);
    return { success: false, error: error.message || 'Verbindungsfehler' };
  }
}

// ================= Validation =================
function validatePassword(password) {
  if (password.length < 6) return { valid: false, message: 'Passwort muss mindestens 6 Zeichen lang sein' };
  return { valid: true };
}

function validateUsername(username) {
  if (username.length < 3) return { valid: false, message: 'Benutzername muss mindestens 3 Zeichen lang sein' };
  if (username.length > 20) return { valid: false, message: 'Benutzername darf maximal 20 Zeichen lang sein' };
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) return { valid: false, message: 'Benutzername darf nur Buchstaben, Zahlen, _ und - enthalten' };
  return { valid: true };
}

// ================= Message Helpers =================
function showMessage(elementId, message, type = 'error') {
  const element = document.getElementById(elementId);
  if (element) {
    element.className = type;
    element.textContent = message;
    element.style.display = 'block';
  }
}

function hideMessage(elementId) {
  const element = document.getElementById(elementId);
  if (element) element.style.display = 'none';
}
