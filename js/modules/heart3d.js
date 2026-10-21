/**
 * =========================================================================
 * CHUBBY HEART 3D PARTICLE SYSTEM (MODULE js/modules/heart3d.js)
 * Ported directly from chubby_heart_3d.html
 * =========================================================================
 * 1. Hình học Cơ sở Giải tích (Analytical Chubby Heart Surface):
 *    - Sử dụng hàm tham số 3D trơn nhẵn liên tục S(theta, phi) với tính đối xứng qua trục X và Z.
 *    - Hai múi tim phía trên tròn căng đầy đặn, rãnh giữa mềm mại tự nhiên.
 *    - Chóp đáy thuôn gọn thành hình trái tim tròn mọng (Chubby / Puffy Balloon 3D).
 * 2. Phân bố Hạt Thực tế (Physical Surface & Core Sampling):
 *    - 15,000 hạt Vỏ (Shell - 68%): Lấy mẫu diện tích đều đặn trực tiếp trên bề mặt 3D thực tế.
 *    - 7,000 hạt Lõi (Core - 32%): Lấy mẫu thể tích co về trục thẳng đứng trung tâm (Vertical Spine).
 *    - 2,500 hạt Bụi sao (Ambient Stardust): Xoáy lượn lung linh trong không gian 3D.
 * 3. Nhịp tim Sinh học Đồng bộ (Proportion-Preserving Biological Heartbeat):
 *    - Mô phỏng nhịp Lub-Dub thực tế với 2 pha co bóp tâm thất và tâm nhĩ.
 *    - Tương tác chạm/click kích hoạt nhịp rộn ràng (Heart Thrill) và pháo hoa rực rỡ.
 * 4. Shaders & Additive Blending Cân bằng:
 *    - Gradient màu sắc 3D: Đỏ tươi Ruby -> Hồng cánh sen -> Tím huỳnh quang.
 *    - Tự động bù đắp Point Scale để hạt giữ độ căng mọng đồng nhất trên cả Mobile & Desktop.
 * =========================================================================
 */

// --- CẤU HÌNH THÔNG SỐ (PARAMETERS) ---
export const HEART_CONFIG = {
  shellParticles: 15000,     // Số lượng hạt lớp vỏ bề mặt
  coreParticles: 7000,       // Số lượng hạt lớp ruột lõi
  stardustParticles: 2500,   // Bụi sao bay lượn xung quanh
  bpm: 65,                   // Nhịp tim mặc định (nhịp/phút)
  glowMultiplier: 1.30,      // Cường độ phát quang cân bằng
  heartScale: 1.18,          // Tỷ lệ phóng đại tổng thể cân đối viewport giữa header và footer
  autoRotateSpeed: 0.85      // Tốc độ tự động xoay
};

// --- SHADER GLSL CHO KHỐI TRÁI TIM CHUBBY ---
const HeartShader = {
  vertexShader: `
    uniform float uTime;
    uniform float uBPM;
    uniform float uExcitement;
    uniform float uGlow;
    uniform float uPixelRatio;
    uniform float uPointScale;

    attribute vec3 aBaseColor;
    attribute float aLayerType; // 0.0 = core, 1.0 = shell
    attribute float aBaseSize;

    varying vec3 vColor;
    varying float vPulse;
    varying float vLayer;

    // Mô phỏng chu kỳ nhịp tim sinh học Lub-Dub (2 pha co bóp thực tế)
    float computeHeartbeat(float phase) {
      // Pha 1: Co bóp tâm thất cực mạnh (Systole 1 - "Lub")
      float p1 = phase - 0.06;
      float b1 = exp(-(p1 * p1) / 0.0032);

      // Pha 2: Co bóp phụ đóng van (Systole 2 - "Dub")
      float p2 = phase - 0.23;
      float b2 = 0.45 * exp(-(p2 * p2) / 0.0042);

      // Nhả chậm đàn hồi (Elastic relaxation)
      float p3 = phase - 0.13;
      float recoil = -0.08 * exp(-(p3 * p3) / 0.0028);

      return max(0.0, b1 + b2 + recoil);
    }

    void main() {
      vLayer = aLayerType;
      
      float period = 60.0 / uBPM;
      float globalPhase = mod(uTime, period) / period;
      
      // Nhịp đập đồng bộ bảo toàn hình dạng silhouette
      float beat = computeHeartbeat(globalPhase);
      beat += uExcitement * 0.75; // Xung kích hoạt tức thì khi click/chạm

      vPulse = beat;

      // Co giãn đồng bộ giữ nguyên tỷ lệ hình học giữa hai múi tim
      float pulseScale = 1.0 + beat * 0.095;

      // Nhịp thở tĩnh tại rất khẽ (đồng bộ, không làm méo viền)
      float breath = sin(uTime * 1.6) * 0.012;
      
      vec3 deformedPos = position * (pulseScale + breath);

      // Chuyển sang không gian camera
      vec4 mvPosition = modelViewMatrix * vec4(deformedPos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Kích thước hạt theo cự ly phối cảnh kèm uPointScale giữ độ dày đồng nhất
      float pSize = aBaseSize * (1.0 + beat * 0.28) * uGlow;
      gl_PointSize = pSize * (280.0 / -mvPosition.z) * uPointScale * uPixelRatio;

      // Màu sắc hạt: Tăng độ rực sáng khi tim đập
      vec3 pulseHighlight = vec3(1.0, 0.45, 0.75);
      vColor = mix(aBaseColor, pulseHighlight, beat * (aLayerType < 0.5 ? 0.35 : 0.22));
    }
  `,
  fragmentShader: `
    uniform float uGlow;
    varying vec3 vColor;
    varying float vPulse;
    varying float vLayer;

    void main() {
      // Tính bán kính từ tâm hạt (gl_PointCoord: [0, 1])
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);

      // Cắt bỏ phần ngoài rìa tròn
      if (dist > 0.5) {
        discard;
      }

      // Hiệu ứng phát sáng mờ viền mềm mại (Smooth radial falloff)
      float alpha = smoothstep(0.5, 0.06, dist);
      alpha = pow(alpha, 1.35);

      // Điểm sáng nhẹ ở lõi hạt
      float centerSpecular = pow(clamp(1.0 - dist * 4.2, 0.0, 1.0), 3.0);
      
      vec3 finalColor = vColor;
      finalColor += vec3(1.0, 0.90, 0.96) * centerSpecular * (0.45 + vPulse * 0.35);
      finalColor *= (uGlow + vPulse * 0.35);

      // Cân bằng quang học: Vỏ rõ nét, lõi tạo chiều sâu không làm đục bề mặt
      float baseAlpha = (vLayer > 0.5) ? 0.55 : 0.35;
      gl_FragColor = vec4(finalColor, alpha * (baseAlpha + vPulse * 0.16));
    }
  `
};

// --- SHADER GLSL CHO BỤI SAO BAY BỔNG (AMBIENT STARDUST) ---
const StardustShader = {
  vertexShader: `
    uniform float uTime;
    uniform float uPixelRatio;
    uniform float uGlow;
    uniform float uPointScale;

    attribute vec3 aColor;
    attribute float aSize;
    attribute float aOrbitSpeed;
    attribute float aPhase;

    varying vec3 vColor;

    void main() {
      vColor = aColor;

      // Chuyển động xoáy lượn nhẹ nhàng xung quanh trái tim
      vec3 pos = position;
      float angle = uTime * aOrbitSpeed * 0.22 + aPhase;
      
      float cosA = cos(angle);
      float sinA = sin(angle);
      float nx = pos.x * cosA - pos.z * sinA;
      float nz = pos.x * sinA + pos.z * cosA;
      pos.x = nx;
      pos.z = nz;

      // Lượn sóng nhẹ nhàng trục Y
      pos.y += sin(uTime * 0.75 + aPhase) * 0.12;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Nhấp nháy nhẹ (twinkling)
      float twinkle = sin(uTime * 2.2 + aPhase * 6.28) * 0.35 + 0.65;
      gl_PointSize = aSize * twinkle * (250.0 / -mvPosition.z) * uPointScale * uPixelRatio * uGlow;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;

      float alpha = smoothstep(0.5, 0.08, dist);
      alpha = pow(alpha, 1.6);

      gl_FragColor = vec4(vColor * 1.15, alpha * 0.6);
    }
  `
};

/**
 * HÀM TOÁN HỌC TÍNH TỌA ĐỘ BỀ MẶT TRÁI TIM 3D CHUBBY
 * Tham số: theta in [0, PI], phi in [-PI, PI]
 * Đảm bảo tính liên tục C-infinity, đối xứng tuyệt đối qua trục X và Z
 */
export function evaluateHeartSurface(theta, phi) {
  const sinT = Math.sin(theta);
  const cosT = Math.cos(theta);
  const sinP = Math.sin(phi);
  const cosP = Math.cos(phi);

  // Chiều ngang X
  let x = sinT * sinP;

  // Độ cong nâng hai múi tim (Smooth Lobe Elevation):
  const upperWeight = Math.max(0.0, cosT + 0.25);
  const lobeLift = 0.44 * Math.pow(Math.abs(sinP), 1.2) * Math.pow(sinT, 0.7) * Math.pow(upperWeight, 1.1);
  const y = cosT * 1.05 + lobeLift - 0.08;

  // Chiều sâu Z: tạo độ dày căng múp (Chubby Volume)
  let z = sinT * cosP * 0.75;

  // Rãnh khuyết ở đỉnh trên (chỉ tác động vùng đỉnh cosT > 0.2)
  if (cosT > 0.2) {
    const pinch = 0.18 * Math.exp(-Math.pow(sinP / 0.32, 2)) * Math.pow((cosT - 0.2) / 0.8, 1.2);
    z *= (1.0 - pinch);
  }

  // Độ đầy đặn phần thân trên (Upper Fullness) - thon gọn, tự nhiên
  const fullness = 1.0 + 0.22 * Math.max(0.0, cosT);
  x *= 1.215 * fullness;
  z *= (1.0 + 0.12 * Math.max(0.0, cosT));

  // Vuốt thon mượt mà về chóp đáy (Smooth Lower Body Taper)
  if (cosT < 0.0) {
    const t = -cosT; // 0 ở xích đạo, 1 ở chóp đáy
    const taper = 1.0 - 0.72 * Math.pow(t, 1.35);
    x *= Math.max(0.02, taper);
    z *= Math.max(0.02, taper);
  }

  return { x, y, z };
}

/**
 * Trình Quản lý & Kết xuất Trái Tim 3D Điểm Hạt (Three.js Chubby 3D Particle Heart)
 */
export class Heart3DViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = null;

    this.heartPointsMesh = null;
    this.stardustPointsMesh = null;
    this.heartMaterial = null;
    this.stardustMaterial = null;

    this.bgGlowElement = null;
    this.currentBPM = HEART_CONFIG.bpm;
    this.targetBPM = HEART_CONFIG.bpm;
    this.extraExcitement = 0.0;
    this.pointScale = 1.0;

    this.animationFrameId = null;
    this.isInitialized = false;
    this.isActive = false;
    this.isFallbackMode = false;

    this._onResizeBound = this.onWindowResize.bind(this);
    this._onPointerDownBound = this.onPointerDown.bind(this);
    this._onVisibilityChangeBound = this.onVisibilityChange.bind(this);
  }

  isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  activateFallbackMode() {
    this.isFallbackMode = true;
    const fallbackEl = document.getElementById('heart-3d-fallback');
    if (fallbackEl) {
      fallbackEl.classList.add('active');
      fallbackEl.style.display = 'flex';
    }
    this.setupBpmButtons();
    console.info('Thiết bị không hỗ trợ 3D WebGL, đã tự động chuyển sang chế độ Trái tim 2D phát quang dự phòng.');
  }

  init() {
    if (this.isInitialized || !this.container) return;

    // Kiểm tra khả năng hỗ trợ WebGL của thiết bị (Tránh màn hình đen khi tắt Hardware Acceleration)
    if (!this.isWebGLAvailable()) {
      this.activateFallbackMode();
      return;
    }

    try {
      this.clock = new THREE.Clock();
      this.bgGlowElement = document.getElementById('heart-bg-glow');

      // 1. Khởi tạo Scene
      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.FogExp2(0x030007, 0.04);

      // 2. Camera phối cảnh 3D với auto-framing responsive cho mobile và desktop
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || (window.innerHeight - 56);
      const aspect = Math.max(0.1, width / Math.max(1, height));

      this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);

      // Tính cự ly và độ bù điểm sáng tối ưu:
      const defaultDist = aspect < 1 ? Math.max(5.0, 4.4 / (0.85 * aspect)) : 5.4;
      this.pointScale = defaultDist / 4.8;

      // Căn chỉnh trục Y hạ xuống nhẹ để tim nằm chính xác giữa tiêu đề trên và nút bấm dưới
      const targetY = aspect < 1 ? -0.15 : -0.25;
      this.camera.position.set(0, 0.0, defaultDist);

      // 3. WebGL Renderer tối ưu hiệu năng (Tắt antialias không cần thiết trên point particle để giảm tải GPU)
      this.renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, Math.max(1, height));
      // Giới hạn mật độ điểm ảnh ở mức tối đa 1.75 để máy mát và mượt mà
      const pRatio = Math.min(window.devicePixelRatio || 1, 1.75);
      this.renderer.setPixelRatio(pRatio);
      if (THREE.ACESFilmicToneMapping) {
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.05;
      }
      this.renderer.setClearColor(0x030007, 1);

      // Xóa bỏ nội dung cũ (nếu có) và thêm canvas mới
      while (this.container.firstChild) {
        this.container.removeChild(this.container.firstChild);
      }
      this.container.appendChild(this.renderer.domElement);

      // 4. OrbitControls điều khiển góc nhìn tương tác
      if (window.THREE && window.THREE.OrbitControls) {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.06;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = HEART_CONFIG.autoRotateSpeed;
        this.controls.enableZoom = true;
        this.controls.minDistance = 2.0;
        this.controls.maxDistance = Math.max(14.0, defaultDist * 1.7);
        this.controls.target.set(0, targetY, 0);
      }

      // 5. Khởi tạo hình học hạt Trái tim và Bụi sao
      this.createChubbyHeartMesh();
      this.createStardustMesh();

      // 6. Gán sự kiện tương tác
      window.addEventListener('resize', this._onResizeBound, false);
      this.container.addEventListener('pointerdown', this._onPointerDownBound, false);
      document.addEventListener('visibilitychange', this._onVisibilityChangeBound, false);

      // Gán nút preset BPM nếu có trên giao diện
      this.setupBpmButtons();

      this.isInitialized = true;
      this.isActive = true;
      this.animate();
    } catch (err) {
      console.warn('Lỗi khởi tạo WebGL, kích hoạt chế độ Fallback 2D:', err);
      this.activateFallbackMode();
    }
  }

  createChubbyHeartMesh() {
    const shellCount = HEART_CONFIG.shellParticles;
    const coreCount = HEART_CONFIG.coreParticles;
    const totalCount = shellCount + coreCount;

    const positions = new Float32Array(totalCount * 3);
    const colors = new Float32Array(totalCount * 3);
    const layerTypes = new Float32Array(totalCount);
    const baseSizes = new Float32Array(totalCount);

    const scale = HEART_CONFIG.heartScale;

    // Bảng màu nghệ thuật độ bão hòa cao (Rich Saturated Chromatic Palette)
    const colorCrimson  = new THREE.Color('#ff0a36'); // Đỏ tươi ruby ấm nồng
    const colorHotPink  = new THREE.Color('#ff2282'); // Hồng cánh sen rực rỡ
    const colorRosePink = new THREE.Color('#ff4d9e'); // Hồng phấn dạ quang
    const colorPurple   = new THREE.Color('#8518cf'); // Tím huỳnh quang kiêu sa
    const colorDeepDark = new THREE.Color('#480970'); // Tím thẫm huyền bí

    let pIdx = 0;

    // --- 1. SINH LỚP VỎ BỀ MẶT (SHELL PARTICLES - 15,000 HẠT) ---
    for (let i = 0; i < shellCount; i++) {
      const u = Math.random();
      const theta = Math.acos(1.0 - 2.0 * u);
      const phi = (Math.random() * 2.0 - 1.0) * Math.PI;

      const pt = evaluateHeartSurface(theta, phi);

      // Tạo độ dày vỏ siêu mỏng nhung mịn tự nhiên
      const shellJitter = 1.0 - Math.random() * 0.025;
      const px = pt.x * scale * shellJitter;
      const py = pt.y * scale * shellJitter;
      const pz = pt.z * scale * shellJitter;

      const idx = pIdx * 3;
      positions[idx]     = px;
      positions[idx + 1] = py;
      positions[idx + 2] = pz;

      layerTypes[pIdx] = 1.0; // Shell
      baseSizes[pIdx] = 0.046 + Math.random() * 0.026;

      // Gradient màu sắc 3D lớp vỏ
      const normY = THREE.MathUtils.clamp((pt.y + 1.25) / 2.5, 0.0, 1.0);
      const dist = Math.sqrt(px * px + py * py + pz * pz);
      const normR = THREE.MathUtils.clamp(dist / (1.5 * scale), 0.0, 1.0);
      const pColor = new THREE.Color();

      if (normY < 0.28) {
        // Vùng chóp nhọn phía đáy: Tím thẫm -> Đỏ ruby
        const t = normY / 0.28;
        pColor.copy(colorDeepDark).lerp(colorCrimson, t);
      } else if (normY < 0.72) {
        // Vùng thân và hai múi tim: Hồng cánh sen -> Hồng phấn
        const t = (normY - 0.28) / 0.44;
        pColor.copy(colorHotPink).lerp(colorRosePink, t);
      } else {
        // Vùng đỉnh hai tai tim: Hồng phấn -> Tím huỳnh quang
        const t = (normY - 0.72) / 0.28;
        pColor.copy(colorRosePink).lerp(colorPurple, t);
      }

      if (normR > 0.65) {
        pColor.lerp(colorPurple, (normR - 0.65) * 1.2);
      }

      colors[idx]     = pColor.r;
      colors[idx + 1] = pColor.g;
      colors[idx + 2] = pColor.b;

      pIdx++;
    }

    // --- 2. SINH LỚP LÕI THỂ TÍCH BÊN TRONG (VOLUMETRIC CORE - 7,000 HẠT) ---
    for (let i = 0; i < coreCount; i++) {
      const u = Math.random();
      const theta = Math.acos(1.0 - 2.0 * u);
      const phi = (Math.random() * 2.0 - 1.0) * Math.PI;

      const pt = evaluateHeartSurface(theta, phi);

      // Hệ số thể tích r nằm gọn trong ruột [0, 0.88]
      const r = Math.pow(Math.random(), 0.5) * 0.88;

      const px = pt.x * scale * r;
      const py = pt.y * scale * (0.97 + (Math.random() - 0.5) * 0.06);
      const pz = pt.z * scale * r;

      const idx = pIdx * 3;
      positions[idx]     = px;
      positions[idx + 1] = py;
      positions[idx + 2] = pz;

      layerTypes[pIdx] = 0.0; // Core
      baseSizes[pIdx] = 0.040 + Math.random() * 0.028;

      // Màu lõi: Đỏ ruby ấm áp phát quang từ trong tim
      const normY = THREE.MathUtils.clamp((pt.y + 1.25) / 2.5, 0.0, 1.0);
      const pColor = new THREE.Color();
      pColor.copy(colorCrimson).lerp(colorHotPink, normY * 0.5 + r * 0.5);

      colors[idx]     = pColor.r;
      colors[idx + 1] = pColor.g;
      colors[idx + 2] = pColor.b;

      pIdx++;
    }

    // Đóng gói vào BufferGeometry tối ưu GPU
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aBaseColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aLayerType', new THREE.BufferAttribute(layerTypes, 1));
    geometry.setAttribute('aBaseSize', new THREE.BufferAttribute(baseSizes, 1));

    // Shader Material với Additive Blending
    this.heartMaterial = new THREE.ShaderMaterial({
      vertexShader: HeartShader.vertexShader,
      fragmentShader: HeartShader.fragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uBPM: { value: this.currentBPM },
        uExcitement: { value: 0.0 },
        uGlow: { value: HEART_CONFIG.glowMultiplier },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.75) },
        uPointScale: { value: this.pointScale }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.heartPointsMesh = new THREE.Points(geometry, this.heartMaterial);
    this.scene.add(this.heartPointsMesh);
  }

  createStardustMesh() {
    const count = HEART_CONFIG.stardustParticles;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const orbitSpeeds = new Float32Array(count);
    const phases = new Float32Array(count);

    const colorPink = new THREE.Color('#ff6ba7');
    const colorPurple = new THREE.Color('#b5179e');
    const colorViolet = new THREE.Color('#7209b7');

    for (let i = 0; i < count; i++) {
      const radius = 1.6 + Math.pow(Math.random(), 1.5) * 2.7;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      positions[i * 3]     = radius * Math.cos(phi) * Math.sin(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * 1.1 + 0.08;
      positions[i * 3 + 2] = radius * Math.cos(phi) * Math.cos(theta);

      const mixedColor = colorPink.clone().lerp(
        Math.random() > 0.5 ? colorPurple : colorViolet,
        Math.random()
      );

      colors[i * 3]     = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;

      sizes[i] = 0.028 + Math.random() * 0.034;
      orbitSpeeds[i] = (Math.random() * 0.6 + 0.4) * (Math.random() > 0.5 ? 1 : -1);
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aOrbitSpeed', new THREE.BufferAttribute(orbitSpeeds, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    this.stardustMaterial = new THREE.ShaderMaterial({
      vertexShader: StardustShader.vertexShader,
      fragmentShader: StardustShader.fragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.75) },
        uGlow: { value: HEART_CONFIG.glowMultiplier },
        uPointScale: { value: this.pointScale }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.stardustPointsMesh = new THREE.Points(geometry, this.stardustMaterial);
    this.scene.add(this.stardustPointsMesh);
  }

  setupBpmButtons() {
    const bpmSelectors = [
      { id: 'btn-bpm-calm', bpm: 65 },
      { id: 'btn-bpm-romance', bpm: 82 },
      { id: 'btn-bpm-passionate', bpm: 105 }
    ];

    bpmSelectors.forEach(({ id, bpm }) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          bpmSelectors.forEach(item => {
            const btn = document.getElementById(item.id);
            if (btn) {
              btn.classList.remove('bg-pink-600', 'text-white', 'shadow-sm');
              btn.classList.add('text-pink-200');
            }
          });
          el.classList.add('bg-pink-600', 'text-white', 'shadow-sm');
          el.classList.remove('text-pink-200');
          this.setBPM(bpm);
          this.triggerHeartThrill();
        });
      }
    });
  }

  setBPM(bpm) {
    this.targetBPM = bpm;
    // Đồng bộ tốc độ đập cho cả Trái tim 2D dự phòng nếu đang ở chế độ Fallback
    const fallbackSvg = document.querySelector('.fallback-heart-svg');
    if (fallbackSvg) {
      const dur = (60.0 / Math.max(30, bpm)).toFixed(2);
      fallbackSvg.style.animationDuration = `${dur}s`;
    }
  }

  onVisibilityChange() {
    if (document.hidden) {
      this.pause();
    } else {
      const isHeartTab = window.__APP__?.currentTab === 'heart3d';
      const hasOpenModal = document.querySelector('#letter-modal:not(.hidden), #special-letter-modal:not(.hidden), #config-modal:not(.hidden), #auth-modal:not(.hidden)');
      if (isHeartTab && !hasOpenModal) {
        this.start();
      }
    }
  }

  onPointerDown(e) {
    this.triggerHeartThrill();
  }

  triggerHeartThrill() {
    this.extraExcitement = 1.0;

    // Hiệu ứng đèn nền nhịp đập rực rỡ
    if (this.bgGlowElement) {
      this.bgGlowElement.style.transform = 'translate(-50%, -50%) scale(1.3)';
      this.bgGlowElement.style.opacity = '0.95';
      setTimeout(() => {
        if (this.bgGlowElement) {
          this.bgGlowElement.style.transform = 'translate(-50%, -50%) scale(1.0)';
          this.bgGlowElement.style.opacity = '0.65';
        }
      }, 320);
    }

    // Hiệu ứng cánh hoa / confetti lấp lánh
    if (window.confetti) {
      window.confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#ff0a36', '#ff2282', '#ff4d9e', '#8518cf', '#ffffff']
      });
    }
  }

  onWindowResize() {
    if (!this.camera || !this.renderer || !this.container) return;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || (window.innerHeight - 56);
    if (width <= 0 || height <= 0) return;

    const aspect = width / height;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    const pRatio = Math.min(window.devicePixelRatio || 1, 1.75);
    this.renderer.setPixelRatio(pRatio);

    const targetDist = aspect < 1 ? Math.max(5.0, 4.4 / (0.85 * aspect)) : 5.4;
    this.pointScale = targetDist / 4.8;

    if (this.heartMaterial) {
      this.heartMaterial.uniforms.uPixelRatio.value = pRatio;
      this.heartMaterial.uniforms.uPointScale.value = this.pointScale;
    }
    if (this.stardustMaterial) {
      this.stardustMaterial.uniforms.uPixelRatio.value = pRatio;
      this.stardustMaterial.uniforms.uPointScale.value = this.pointScale;
    }

    const targetY = aspect < 1 ? -0.15 : -0.25;
    if (this.controls) {
      this.controls.maxDistance = Math.max(14.0, targetDist * 1.7);
      this.controls.target.set(0, targetY, 0);
      const currentLen = this.camera.position.length();
      if (Math.abs(currentLen - targetDist) > 2.5) {
        this.camera.position.setLength(targetDist);
      }
    }
  }

  animate() {
    if (!this.isActive) return;
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

    const elapsedTime = this.clock ? this.clock.getElapsedTime() : 0.0;

    // Chuyển đổi nhịp tim mượt mà
    this.currentBPM += (this.targetBPM - this.currentBPM) * 0.08;

    // Giảm dần xung kích hoạt click
    this.extraExcitement *= 0.92;
    if (this.extraExcitement < 0.001) this.extraExcitement = 0.0;

    // Cập nhật Uniforms cho Shaders
    if (this.heartMaterial) {
      this.heartMaterial.uniforms.uTime.value = elapsedTime;
      this.heartMaterial.uniforms.uBPM.value = this.currentBPM;
      this.heartMaterial.uniforms.uExcitement.value = this.extraExcitement;
    }

    if (this.stardustMaterial) {
      this.stardustMaterial.uniforms.uTime.value = elapsedTime;
    }

    // Cập nhật hiệu ứng đèn nền nhấp nháy theo nhịp tim sinh học
    if (this.bgGlowElement) {
      const period = 60.0 / this.currentBPM;
      const phase = (elapsedTime % period) / period;
      const b1 = Math.exp(-Math.pow(phase - 0.06, 2) / 0.0045);
      const b2 = 0.45 * Math.exp(-Math.pow(phase - 0.23, 2) / 0.0055);
      const pulseVal = Math.max(0.0, b1 + b2) + this.extraExcitement * 0.5;

      const scaleVal = 1.0 + pulseVal * 0.12;
      const opacityVal = 0.55 + pulseVal * 0.35;
      this.bgGlowElement.style.transform = `translate(-50%, -50%) scale(${scaleVal})`;
      this.bgGlowElement.style.opacity = opacityVal;
    }

    // Cập nhật OrbitControls
    if (this.controls) {
      this.controls.update();
    }

    // Render Frame
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
    window.removeEventListener('resize', this._onResizeBound, false);
    document.removeEventListener('visibilitychange', this._onVisibilityChangeBound, false);
    if (this.container) {
      this.container.removeEventListener('pointerdown', this._onPointerDownBound, false);
    }

    if (this.heartPointsMesh) {
      if (this.heartPointsMesh.geometry) this.heartPointsMesh.geometry.dispose();
      if (this.heartMaterial) this.heartMaterial.dispose();
      this.scene?.remove(this.heartPointsMesh);
    }

    if (this.stardustPointsMesh) {
      if (this.stardustPointsMesh.geometry) this.stardustPointsMesh.geometry.dispose();
      if (this.stardustMaterial) this.stardustMaterial.dispose();
      this.scene?.remove(this.stardustPointsMesh);
    }

    if (this.controls) {
      this.controls.dispose();
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }

    this.isInitialized = false;
  }
}
