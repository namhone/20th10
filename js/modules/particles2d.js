/**
 * Module hiệu ứng hạt 2D lơ lửng và tim bay khi tương tác
 */

export class AmbientParticles {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.isRunning = false;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', this.resize.bind(this));

    for (let i = 0; i < 30; i++) {
      this.particles.push(this.createParticle());
    }

    this.start();
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
      speedY: Math.random() * 0.6 + 0.2,
      speedX: (Math.random() - 0.5) * 0.35,
      opacity: Math.random() * 0.4 + 0.1,
      isHeart: Math.random() > 0.55,
      color: Math.random() > 0.5 ? 'rgba(255, 179, 193, ' : 'rgba(255, 214, 224, '
    };
  }

  animate() {
    if (!this.isRunning || !this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach(p => {
      p.y -= p.speedY;
      p.x += p.speedX;

      if (p.y < -20) {
        p.y = this.canvas.height + 20;
        p.x = Math.random() * this.canvas.width;
      }

      this.ctx.fillStyle = p.color + p.opacity + ')';
      this.ctx.beginPath();

      if (p.isHeart) {
        const x = p.x;
        const y = p.y;
        const s = p.size * 0.6;
        this.ctx.moveTo(x, y);
        this.ctx.bezierCurveTo(x - s, y - s, x - s * 1.5, y + s / 3, x, y + s * 1.2);
        this.ctx.bezierCurveTo(x + s * 1.5, y + s / 3, x + s, y - s, x, y);
        this.ctx.fill();
      } else {
        this.ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

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
  }
}

/**
 * Tạo chùm icon trái tim bay lên từ tọa độ nhấn
 */
export function spawnFloatingHearts(originX, originY, count = 8) {
  const emojis = ['♡', '🌸', '💖', '✨', '🧸'];

  for (let i = 0; i < count; i++) {
    const heart = document.createElement('div');
    heart.className = 'floating-heart text-brand-500 font-bold select-none pointer-events-none';
    heart.style.left = (originX + (Math.random() - 0.5) * 70) + 'px';
    heart.style.top = (originY + (Math.random() - 0.5) * 50) + 'px';
    heart.style.fontSize = (Math.random() * 12 + 14) + 'px';
    heart.textContent = emojis[Math.floor(Math.random() * emojis.length)];

    document.body.appendChild(heart);
    setTimeout(() => {
      if (heart.parentNode) heart.parentNode.removeChild(heart);
    }, 1200);
  }
}
