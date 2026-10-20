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

    // 2. Camera (Tự động canh góc chuẩn tỷ lệ cho cả điện thoại màn hình dọc và máy tính)
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || (window.innerHeight - 64);
    const aspect = Math.max(0.1, width / Math.max(1, height));
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    const cameraDist = aspect < 1 ? Math.max(50, Math.round(38 / (0.8284 * aspect))) : 42;
    this.camera.position.set(0, 2.5, cameraDist);

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

    // Bảng màu bóng bay trái tim căng mọng (Puffy / Chubby 3D Balloon Heart)
    const colorDeep = new THREE.Color(0xff1853);   // Đỏ hồng nhung sâu thẳm
    const colorRose = new THREE.Color(0xff336f);   // Hồng quả mọng tươi tắn
    const colorPastel = new THREE.Color(0xff7597); // Hồng phấn cánh hoa
    const colorSoft = new THREE.Color(0xffb8cb);   // Hồng phớt kẹo ngọt
    const colorGloss = new THREE.Color(0xffffff);  // Ánh sáng trắng phản quang bóng bay
    const colorGold = new THREE.Color(0xffdf88);   // Ánh vàng lung linh

    // Hướng ánh sáng phản quang bóng bay (Gloss specular reflection)
    const lightDir = new THREE.Vector3(0.35, 0.65, 0.68).normalize();

    // Thuật toán lấy mẫu bề mặt thể tích bóng bay trái tim 3D (Taubin Balloon Implicit Manifold)
    // a = x^2 + 1.25*z^2 + y^2 - 1
    // F(x, y, z) = a^3 - x^2 * y^3 - 0.1125 * z^2 * y^3 <= 0
    // Hệ số z^2 = 1.25 giúp độ sâu (Z) phồng căng tròn đều như quả bóng bay từ mọi hướng
    let count = 0;
    let attempts = 0;

    const surfaceQuota = Math.floor(this.particleCount * 0.82);
    let surfaceCount = 0;
    let innerCount = 0;

    const scaleFactor = 13.8;

    while (count < this.particleCount && attempts < 500000) {
      attempts++;
      const x = (Math.random() - 0.5) * 2.8;
      const y = (Math.random() - 0.5) * 2.8;
      const z = (Math.random() - 0.5) * 2.8;

      const a = x * x + 1.25 * z * z + y * y - 1;
      const val = a * a * a - x * x * y * y * y - 0.1125 * z * z * y * y * y;

      if (val <= 0.02) {
        let isSurface = false;
        if (val >= -0.16 && surfaceCount < surfaceQuota) {
          isSurface = true;
          surfaceCount++;
        } else if (innerCount < (this.particleCount - surfaceQuota)) {
          isSurface = false;
          innerCount++;
        } else if (surfaceCount < surfaceQuota) {
          isSurface = true;
          surfaceCount++;
        } else {
          continue;
        }

        // Tọa độ thực tế phóng to đều 3 chiều
        const posX = x * scaleFactor;
        const posY = (y + 0.15) * scaleFactor;
        const posZ = z * scaleFactor;

        positions[count * 3] = posX;
        positions[count * 3 + 1] = posY;
        positions[count * 3 + 2] = posZ;

        this.basePositions.push({
          x: posX,
          y: posY,
          z: posZ,
          unitX: x,
          unitY: y,
          unitZ: z,
          isSurface: isSurface,
          randomOffset: Math.random() * Math.PI * 2
        });

        // Tính vector pháp tuyến để tạo hiệu ứng bóng phản chiếu (Gloss Specular Highlight)
        const aSqr = a * a;
        const ySqr = y * y;
        const yCube = ySqr * y;

        const nx = 6 * x * aSqr - 2 * x * yCube;
        const ny = 6 * y * aSqr - 3 * x * x * ySqr - 0.3375 * z * z * ySqr;
        const nz = 7.5 * z * aSqr - 0.225 * z * yCube;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;

        const normVec = new THREE.Vector3(nx / len, ny / len, nz / len);
        const spec = Math.max(0, normVec.dot(lightDir));

        // Phối màu cho từng hạt
        let c = colorDeep.clone();
        const normHeight = (y + 1.1) / 2.3; // từ đáy (0) đến đỉnh tai trái tim (1)

        if (normHeight > 0.55) {
          c.lerp(colorRose, (normHeight - 0.55) * 2.2);
        } else {
          c.lerp(colorPastel, 0.4);
        }

        // Hiệu ứng vỏ bóng bay căng bóng (Glossy Balloon Highlight)
        if (isSurface && spec > 0.58) {
          const glossFactor = Math.pow((spec - 0.58) / 0.42, 1.8);
          c.lerp(colorGloss, glossFactor * 0.95);
        } else if (isSurface && spec > 0.4) {
          c.lerp(colorGold, (spec - 0.4) * 0.5);
        }

        if (!isSurface) {
          // Lớp bụi tinh thể bên trong lõi phát sáng ấm áp
          c.lerp(colorSoft, 0.6);
        }

        colors[count * 3] = c.r;
        colors[count * 3 + 1] = c.g;
        colors[count * 3 + 2] = c.b;

        // Kích thước hạt
        if (isSurface && spec > 0.6) {
          sizes[count] = Math.random() * 1.5 + 2.2; // Điểm phản quang to lấp lánh
        } else if (isSurface) {
          sizes[count] = Math.random() * 1.4 + 1.6; // Hạt vỏ bóng
        } else {
          sizes[count] = Math.random() * 0.9 + 1.1; // Bụi lõi
        }

        count++;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleTexture = this.generateParticleTexture();

    const material = new THREE.PointsMaterial({
      size: 1.75,
      map: particleTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.94
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

    const aspect = width / height;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    // Canh chỉnh khoảng cách camera chuẩn đẹp trên màn hình mobile và desktop
    if (this.camera) {
      const targetDist = aspect < 1 ? Math.max(50, Math.round(38 / (0.8284 * aspect))) : 42;
      if (this.controls && this.controls.target) {
        this.camera.position.setLength(targetDist);
      }
    }
  }

  animate() {
    if (!this.isActive) return;
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

    this.time += 0.035;

    // Mô phỏng nhịp đập phập phồng quả bóng bay căng mọng (Chubby balloon breathing)
    const cycle = (this.time * 1.35) % (Math.PI * 2);
    let pulse = 0;
    if (cycle < 0.6) {
      pulse = Math.sin(cycle * Math.PI / 0.6) * 0.14;
    } else if (cycle > 0.8 && cycle < 1.35) {
      pulse = Math.sin((cycle - 0.8) * Math.PI / 0.55) * 0.08;
    }

    this.beatScale += (1 - this.beatScale) * 0.08;
    const currentScale = (1 + pulse) * this.beatScale;

    if (this.heartParticles && this.heartParticles.geometry) {
      const positions = this.heartParticles.geometry.attributes.position.array;
      const count = Math.min(this.particleCount, this.basePositions.length);
      for (let i = 0; i < count; i++) {
        const base = this.basePositions[i];
        if (!base) continue;

        // Hiệu ứng phập phồng nhẹ nhàng trên bề mặt bóng bay
        const wave = Math.sin(this.time * 2.2 + base.randomOffset) * 0.08;
        const s = currentScale + wave * 0.02;

        positions[i * 3] = base.x * s;
        positions[i * 3 + 1] = base.y * s;
        positions[i * 3 + 2] = base.z * s;
      }
      this.heartParticles.geometry.attributes.position.needsUpdate = true;

      this.heartParticles.rotation.y = Math.sin(this.time * 0.35) * 0.14;
      this.heartParticles.rotation.z = Math.cos(this.time * 0.25) * 0.04;
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
