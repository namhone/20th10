/**
 * Module hiệu ứng hạt 2D lơ lửng và tim bay khi tương tác (Tối ưu hóa RAM & CPU)
 */

export class AmbientParticles {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.isRunning = false;
    this.heartSprite = null;

    this.init();
  }

  init() {
    this.createHeartSprite();
    this.resize();
    window.addEventListener('resize', this.resize.bind(this));

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const particleCount = isMobile ? 12 : 24;

    for (let i = 0; i < particleCount; i++) {
      this.particles.push(this.createParticle());
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stop();
      } else {
        // Chỉ chạy nếu đang ở tab letters hoặc tribute
        if (window.__APP__?.currentTab !== 'heart3d') {
          this.start();
        }
      }
    });
  }

  // Pre-render hình trái tim vào Offscreen Canvas để vẽ cực nhanh qua ctx.drawImage (Không tính toán Bézier curve mỗi frame)
  createHeartSprite() {
    try {
      const spriteCanvas = document.createElement('canvas');
      spriteCanvas.width = 32;
      spriteCanvas.height = 32;
      const sCtx = spriteCanvas.getContext('2d');
      sCtx.fillStyle = '#FF8FA3';
      sCtx.beginPath();
      const x = 16;
      const y = 14;
      const s = 9;
      sCtx.moveTo(x, y);
      sCtx.bezierCurveTo(x - s, y - s, x - s * 1.5, y + s / 3, x, y + s * 1.2);
      sCtx.bezierCurveTo(x + s * 1.5, y + s / 3, x + s, y - s, x, y);
      sCtx.fill();
      this.heartSprite = spriteCanvas;
    } catch (e) {
      this.heartSprite = null;
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticle() {
    return {
      x: Math.random() * (this.canvas ? this.canvas.width : window.innerWidth),
      y: Math.random() * (this.canvas ? this.canvas.height : window.innerHeight),
      size: Math.random() * 5 + 3,
      speedY: Math.random() * 0.5 + 0.2,
      speedX: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.35 + 0.1,
      isHeart: Math.random() > 0.5
    };
  }

  animate() {
    if (!this.isRunning || !this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.y -= p.speedY;
      p.x += p.speedX;

      if (p.y < -20) {
        p.y = this.canvas.height + 20;
        p.x = Math.random() * this.canvas.width;
      }

      this.ctx.globalAlpha = p.opacity;

      if (p.isHeart && this.heartSprite) {
        this.ctx.drawImage(this.heartSprite, p.x, p.y, p.size * 2, p.size * 2);
      } else {
        this.ctx.fillStyle = '#FFA3B5';
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    this.ctx.globalAlpha = 1.0;
    this.animationId = requestAnimationFrame(this.animate.bind(this));
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

// Giới hạn số lượng DOM nodes bay cùng lúc để ngăn chặn Garbage Collection spikes
let activeHeartCount = 0;
const MAX_ACTIVE_HEARTS = 12;

/**
 * Tạo chùm icon trái tim bay lên từ tọa độ nhấn (Được kiểm soát số lượng an toàn)
 */
export function spawnFloatingHearts(originX, originY, count = 6) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const actualCount = Math.min(count, isMobile ? 5 : 8);

  if (activeHeartCount >= MAX_ACTIVE_HEARTS) return;

  const emojis = ['♡', '🌸', '💖', '✨', '🧸'];

  for (let i = 0; i < actualCount; i++) {
    if (activeHeartCount >= MAX_ACTIVE_HEARTS) break;
    activeHeartCount++;

    const heart = document.createElement('div');
    heart.className = 'floating-heart text-brand-500 font-bold select-none pointer-events-none';
    heart.style.left = (originX + (Math.random() - 0.5) * 60) + 'px';
    heart.style.top = (originY + (Math.random() - 0.5) * 40) + 'px';
    heart.style.fontSize = (Math.random() * 8 + 14) + 'px';
    heart.textContent = emojis[Math.floor(Math.random() * emojis.length)];

    document.body.appendChild(heart);
    setTimeout(() => {
      if (heart.parentNode) heart.parentNode.removeChild(heart);
      activeHeartCount = Math.max(0, activeHeartCount - 1);
    }, 1100);
  }
}
