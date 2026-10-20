/**
 * Module Trái Tim 3D Điểm Hạt (Three.js 3D Pulsing Particle Heart)
 * Nền đen, tương tác xoay 3D (OrbitControls), nhịp đập chân thực, phát sáng
 */

export class Heart3DViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.heartParticles = null;
    this.starParticles = null;
    this.animationFrameId = null;
    this.isInitialized = false;
    this.isActive = false;

    this.basePositions = [];
    this.particleCount = 5200;
    this.time = 0;
    this.beatScale = 1;
  }

  init() {
    if (this.isInitialized || !this.container) return;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x05050a, 0.002);

    // 2. Camera
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || (window.innerHeight - 64);
    this.camera = new THREE.PerspectiveCamera(45, Math.max(0.1, width / Math.max(1, height)), 0.1, 1000);
    this.camera.position.set(0, 5, 45);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, Math.max(1, height));
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x050508, 1);
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    if (window.THREE && window.THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.rotateSpeed = 0.7;
      this.controls.minDistance = 15;
      this.controls.maxDistance = 90;
      this.controls.enablePan = true;
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = 0.8;
    }

    // 5. Build Heart Geometry & Dust
    this.createHeartParticleCloud();
    this.createStarlightDust();

    // 6. Handle Resize & Click
    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.container.addEventListener('click', this.onHeartClick.bind(this));

    this.isInitialized = true;
    this.isActive = true;
    this.animate();
  }

  createHeartParticleCloud() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);

    this.basePositions = [];

    const color1 = new THREE.Color(0xff2a6d); // Deep Rose
    const color2 = new THREE.Color(0xff6b8b); // Pastel Pink
    const color3 = new THREE.Color(0xffccd7); // Tender Pink
    const color4 = new THREE.Color(0xffd166); // Golden Warm Spark

    for (let i = 0; i < this.particleCount; i++) {
      // Công thức tạo hình trái tim 3D Taubin / Cardioid
      const t = Math.PI * (2 * Math.random() - 1);

      // Tham số hóa trái tim cơ bản
      let x = 16 * Math.pow(Math.sin(t), 3);
      let y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      
      // Độ sâu z để tạo thể tích khối 3D phồng đều
      const zThickness = Math.sqrt(Math.max(0, 1 - Math.pow(x / 18, 2))) * 10;
      let z = (Math.random() - 0.5) * zThickness * 1.6;

      // Thêm volume dispersion (lớp lõi và lớp vỏ)
      const spread = Math.pow(Math.random(), 0.6);
      x *= (0.7 + 0.3 * spread);
      y *= (0.7 + 0.3 * spread);
      z *= (0.7 + 0.3 * spread);

      // Tinh chỉnh tỷ lệ cho cân đối thẩm mỹ
      const scale = 0.85;
      x *= scale;
      y = (y + 2) * scale;
      z *= scale;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      this.basePositions.push({ x, y, z, originalScale: scale, randomOffset: Math.random() * Math.PI * 2 });

      // Phối màu hạt gradient theo tọa độ y và z
      let c = color1.clone();
      const normY = (y + 12) / 24;
      if (normY > 0.6) {
        c.lerp(color2, (normY - 0.6) * 2);
      } else if (normY < 0.3) {
        c.lerp(color3, (0.3 - normY) * 2);
      }

      if (Math.random() > 0.88) {
        c.lerp(color4, 0.6);
      }

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = Math.random() * 2.2 + 1.2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleTexture = this.generateParticleTexture();

    const material = new THREE.PointsMaterial({
      size: 1.8,
      map: particleTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.92
    });

    this.heartParticles = new THREE.Points(geometry, material);
    this.scene.add(this.heartParticles);
  }

  createStarlightDust() {
    const starCount = 800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 25 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const rVal = 0.8 + Math.random() * 0.2;
      const gVal = 0.7 + Math.random() * 0.2;
      const bVal = 0.85 + Math.random() * 0.15;

      colors[i * 3] = rVal;
      colors[i * 3 + 1] = gVal;
      colors[i * 3 + 2] = bVal;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 1.1,
      map: this.generateParticleTexture(),
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.65
    });

    this.starParticles = new THREE.Points(geometry, starMaterial);
    this.scene.add(this.starParticles);
  }

  generateParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.25, 'rgba(255, 180, 205, 0.9)');
    gradient.addColorStop(0.6, 'rgba(255, 80, 140, 0.35)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  onHeartClick() {
    this.beatScale = 1.35;
    if (window.confetti) {
      window.confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#ff477e', '#ff6b8b', '#ffd166', '#ffffff']
      });
    }
  }

  onWindowResize() {
    if (!this.camera || !this.renderer || !this.container) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || (window.innerHeight - 64);
    if (width <= 0 || height <= 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    if (!this.isActive) return;
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

    this.time += 0.035;

    // Mô phỏng nhịp đập sinh học (Thình-thịch)
    const cycle = (this.time * 1.4) % (Math.PI * 2);
    let pulse = 0;
    if (cycle < 0.6) {
      pulse = Math.sin(cycle * Math.PI / 0.6) * 0.16;
    } else if (cycle > 0.8 && cycle < 1.3) {
      pulse = Math.sin((cycle - 0.8) * Math.PI / 0.5) * 0.09;
    }

    this.beatScale += (1 - this.beatScale) * 0.08;
    const currentScale = (1 + pulse) * this.beatScale;

    if (this.heartParticles && this.heartParticles.geometry) {
      const positions = this.heartParticles.geometry.attributes.position.array;
      for (let i = 0; i < this.particleCount; i++) {
        const base = this.basePositions[i];
        if (!base) continue;

        const wave = Math.sin(this.time * 2 + base.randomOffset) * 0.15;
        const s = currentScale + wave * 0.03;

        positions[i * 3] = base.x * s;
        positions[i * 3 + 1] = base.y * s;
        positions[i * 3 + 2] = base.z * s;
      }
      this.heartParticles.geometry.attributes.position.needsUpdate = true;

      this.heartParticles.rotation.y = Math.sin(this.time * 0.4) * 0.12;
      this.heartParticles.rotation.z = Math.cos(this.time * 0.3) * 0.05;
    }

    if (this.starParticles) {
      this.starParticles.rotation.y = this.time * 0.04;
      this.starParticles.rotation.x = Math.sin(this.time * 0.02) * 0.05;
    }

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  start() {
    this.isActive = true;
    if (!this.isInitialized) {
      this.init();
    } else {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      requestAnimationFrame(() => {
        this.onWindowResize();
        this.animate();
      });
    }
  }

  pause() {
    this.isActive = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  destroy() {
    this.pause();
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
