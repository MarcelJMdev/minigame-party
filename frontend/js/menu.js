// Menu Helper Functions
const API_URL = "https://games.farmsucht.eu/api";

// Load user profile data
async function loadUserProfile() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    window.location.href = 'login.html';
    return null;
  }
  
  try {
    const response = await fetch(`${API_URL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      // Token invalid, logout
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = 'login.html';
      return null;
    }
  } catch (error) {
    console.error('Profile load error:', error);
    return null;
  }
}

// Update user profile display
function updateProfileDisplay(profileData) {
  // Update username
  const usernameElement = document.getElementById('username');
  if (usernameElement) {
    usernameElement.textContent = profileData.username;
  }
  
  // Update coins
  const coinsElement = document.getElementById('coins');
  if (coinsElement) {
    coinsElement.textContent = profileData.coins;
  }
  
  // Update avatar
  const avatarElement = document.getElementById('userAvatar');
  if (avatarElement && profileData.avatar) {
    avatarElement.src = profileData.avatar;
  }
}

// Change username
async function changeUsername(newUsername) {
  const token = localStorage.getItem('token');
  
  if (!newUsername || newUsername.trim() === '') {
    return { success: false, error: 'Bitte gib einen neuen Benutzernamen ein' };
  }
  
  // Validate username
  if (newUsername.length < 3 || newUsername.length > 20) {
    return { success: false, error: 'Benutzername muss 3-20 Zeichen lang sein' };
  }
  
  try {
    const response = await fetch(`${API_URL}/user/username`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ newUsername })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('username', newUsername);
      return { success: true, message: 'Benutzername erfolgreich geändert' };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Verbindungsfehler' };
  }
}

// Change password
async function changePassword(oldPassword, newPassword) {
  const token = localStorage.getItem('token');
  
  if (!oldPassword || !newPassword) {
    return { success: false, error: 'Bitte fülle beide Felder aus' };
  }
  
  if (newPassword.length < 6) {
    return { success: false, error: 'Neues Passwort muss mindestens 6 Zeichen lang sein' };
  }
  
  try {
    const response = await fetch(`${API_URL}/user/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ oldPassword, newPassword })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, message: 'Passwort erfolgreich geändert' };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Verbindungsfehler' };
  }
}

// Modal functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

// Navigate to game
function navigateToGame(gameName) {
  window.location.href = `games/${gameName}.html`;
}

// Logout function
function logoutUser() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  window.location.href = 'login.html';
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format number with thousand separators
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Show notification
function showNotification(message, type = 'success') {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    background: ${type === 'success' ? '#2ecc71' : '#e74c3c'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);