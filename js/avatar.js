// Avatar Creator Helper Functions

class AvatarCreator {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
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
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });
    
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });
    
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const mouseEvent = new MouseEvent('mouseup', {});
      this.canvas.dispatchEvent(mouseEvent);
    });
  }
  
  startDrawing(e) {
    this.isDrawing = true;
    this.draw(e);
  }
  
  draw(e) {
    if (!this.isDrawing) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.ctx.lineWidth = this.brushSize;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    if (this.tool === 'pen') {
      this.ctx.strokeStyle = this.currentColor;
    } else if (this.tool === 'eraser') {
      this.ctx.strokeStyle = this.options.backgroundColor;
    }
    
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }
  
  stopDrawing() {
    this.isDrawing = false;
    this.ctx.beginPath();
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
    const img = new Image();
    img.onload = () => {
      this.ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  }
  
  async saveAvatar(token) {
    const avatarData = this.getImageData();
    
    try {
      const response = await fetch('http://localhost:3000/api/user/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar: avatarData })
      });
      
      if (response.ok) {
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error };
      }
    } catch (error) {
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
}

// Helper to display avatar in an img element
function displayAvatar(imgId, avatarData) {
  const img = document.getElementById(imgId);
  if (img && avatarData) {
    img.src = avatarData;
  }
}