// Avatar Creator Helper Functions

class AvatarCreator {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }
    this.ctx = this.canvas.getContext('2d');
    
    // Default options
    this.options = {
      width: options.width || 300,
      height: options.height || 300,
      backgroundColor: options.backgroundColor || '#ffffff',
      defaultColor: options.defaultColor || '#000000',
      defaultBrushSize: options.defaultBrushSize || 5,
      minBrushSize: options.minBrushSize || 1,
      maxBrushSize: options.maxBrushSize || 20
    };
    
    // Set canvas size
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
    
    // State
    this.isDrawing = false;
    this.currentColor = this.options.defaultColor;
    this.brushSize = this.options.defaultBrushSize;
    this.tool = 'pen'; // 'pen' or 'eraser'
    this.lastX = 0;
    this.lastY = 0;
    
    // Initialize
    this.clearCanvas();
    this.attachEventListeners();
  }
  
  attachEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseout', () => this.stopDrawing());
    
    // Touch events
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.startDrawing(mouseEvent);
    }, { passive: false });
    
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.draw(mouseEvent);
    }, { passive: false });
    
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.stopDrawing();
    }, { passive: false });
  }
  
  startDrawing(e) {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.lastX = e.clientX - rect.left;
    this.lastY = e.clientY - rect.top;
    
    // Draw a single point for clicks without movement
    this.ctx.beginPath();
    this.ctx.arc(this.lastX, this.lastY, this.brushSize / 2, 0, Math.PI * 2);
    this.ctx.fillStyle = this.tool === 'pen' ? this.currentColor : this.options.backgroundColor;
    this.ctx.fill();
  }
  
  draw(e) {
    if (!this.isDrawing) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.lineWidth = this.brushSize;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = this.tool === 'pen' ? this.currentColor : this.options.backgroundColor;
    this.ctx.stroke();
    
    this.lastX = x;
    this.lastY = y;
  }
  
  stopDrawing() {
    this.isDrawing = false;
  }
  
  clearCanvas() {
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  setColor(color) {
    this.currentColor = color;
    this.tool = 'pen';
  }
  
  setBrushSize(size) {
    this.brushSize = Math.max(this.options.minBrushSize, Math.min(this.options.maxBrushSize, size));
  }
  
  usePen() {
    this.tool = 'pen';
  }
  
  useEraser() {
    this.tool = 'eraser';
  }
  
  getImageData() {
    return this.canvas.toDataURL('image/png');
  }
  
  loadImageData(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.clearCanvas();
        this.ctx.drawImage(img, 0, 0);
        resolve();
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = dataUrl;
    });
  }
  
  async saveAvatar(token) {
    if (!token) {
      return { success: false, error: 'Kein Token vorhanden' };
    }

    const avatarData = this.getImageData();
    const API_URL = "https://games.farmsucht.eu/api";

    try {
      const response = await fetch(`${API_URL}/user/avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar: avatarData })
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const data = await response.json().catch(() => ({}));
        return { success: false, error: data.error || `HTTP ${response.status}` };
      }
    } catch (error) {
      console.error('Avatar save error:', error);
      return { success: false, error: 'Verbindungsfehler' };
    }
  }
}

// Helper function to initialize avatar creator
function initAvatarCreator(canvasId, options = {}) {
  return new AvatarCreator(canvasId, options);
}

// Helper to setup color picker
function setupColorPicker(pickerId, avatarCreator) {
  const picker = document.getElementById(pickerId);
  if (picker) {
    picker.addEventListener('change', (e) => {
      avatarCreator.setColor(e.target.value);
    });
  }
  return picker;
}

// Helper to setup brush size slider
function setupBrushSize(sliderId, valueId, avatarCreator) {
  const slider = document.getElementById(sliderId);
  const valueDisplay = document.getElementById(valueId);
  
  if (slider) {
    slider.addEventListener('input', (e) => {
      const size = parseInt(e.target.value);
      avatarCreator.setBrushSize(size);
      if (valueDisplay) {
        valueDisplay.textContent = size;
      }
    });
  }
  return slider;
}

// Helper to display avatar in an img element
function displayAvatar(imgId, avatarData) {
  const img = document.getElementById(imgId);
  if (img && avatarData) {
    img.src = avatarData;
    img.alt = 'Avatar';
  }
  return img;
}