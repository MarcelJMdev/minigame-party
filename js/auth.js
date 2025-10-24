// Auth Helper Functions
const API_URL = 'http://localhost:3000/api';

// Check if user is authenticated
function isAuthenticated() {
  const token = localStorage.getItem('token');
  return !!token;
}

// Get current token
function getToken() {
  return localStorage.getItem('token');
}

// Get current username
function getUsername() {
  return localStorage.getItem('username');
}

// Set auth data
function setAuthData(token, username) {
  localStorage.setItem('token', token);
  localStorage.setItem('username', username);
}

// Clear auth data
function clearAuthData() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
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
      setAuthData(data.token, data.username);
      return { success: true, data };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Verbindungsfehler' };
  }
}

// Register function
async function registerUser(username, password ) {
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
      setAuthData(data.token, data.username);
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

// Show message helper
function showMessage(elementId, message, type = 'error') {
  const element = document.getElementById(elementId);
  if (element) {
    element.className = type;
    element.textContent = message;
    element.style.display = 'block';
  }
}

// Hide message helper
function hideMessage(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = 'none';
  }
}