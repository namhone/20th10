/**
 * Module xác thực tên người nhận (Gate Modal)
 * Chỉ cho phép người dùng có tên "Huyền Trân" hoặc "Trần Thị Huyền Trân" vào web
 */

const STORAGE_KEY = 'hopqua_auth_profile';

/**
 * Loại bỏ dấu tiếng Việt, ký tự đặc biệt, emoji để chuẩn hóa chuỗi
 */
export function normalizeVietnamese(str) {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^\p{L}\s]/gu, '') // xóa emoji, số, ký tự đặc biệt, dấu câu
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Kiểm tra xem tên có khớp với "Huyền Trân" hoặc "Trần Thị Huyền Trân" hay không
 */
export function isValidRecipient(inputName) {
  const norm = normalizeVietnamese(inputName);
  if (!norm) return false;

  // Loại trừ các trường hợp phủ định
  if (norm.includes('khong phai') || norm.includes('ko phai') || norm.includes('chua phai')) {
    return false;
  }

  // Chấp nhận mọi biến thể chứa 'huyen tran', viết liền 'huyentran', biệt danh thân mật hoặc 'tran'
  return norm.includes('huyen tran') || 
         norm.includes('huyentran') || 
         norm === 'tran' || 
         norm === 'be tran' || 
         norm === 'em tran' || 
         norm === 'tran tran';
}

/**
 * Chuẩn hóa tên hiển thị đẹp đẽ
 */
export function formatCanonicalName(inputName) {
  const norm = normalizeVietnamese(inputName);
  if (norm.includes('tran thi') || norm.includes('tran huyen tran')) {
    return 'Trần Thị Huyền Trân';
  }
  return 'Huyền Trân';
}

/**
 * Lấy profile đã lưu trong localStorage hoặc Cookie
 */
export function getStoredAuth() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const cookieVal = document.cookie.split('; ').find(row => row.startsWith(`${STORAGE_KEY}=`));
      if (cookieVal) raw = decodeURIComponent(cookieVal.split('=')[1]);
    }
    if (!raw) return null;
    const profile = JSON.parse(raw);
    if (profile && profile.verified && profile.name) {
      return profile;
    }
  } catch (e) {
    console.warn('Lỗi đọc auth profile:', e);
  }
  return null;
}

/**
 * Lưu profile vào localStorage, Cookie và đồng bộ với backend
 */
export function saveAuthProfile(name, rawInput = '') {
  const profile = {
    verified: true,
    name: name,
    rawInput: rawInput,
    birthday: '11/01/2009',
    verifiedAt: new Date().toISOString()
  };

  try {
    const profileStr = JSON.stringify(profile);
    localStorage.setItem(STORAGE_KEY, profileStr);
    
    // Lưu dự phòng Cookie 365 ngày cho in-app browser
    const expires = new Date(Date.now() + 365 * 864e5).toUTCString();
    document.cookie = `${STORAGE_KEY}=${encodeURIComponent(profileStr)}; expires=${expires}; path=/; SameSite=Lax`;

    // Đồng bộ cả sang hopqua_config cho tên người nhận
    const savedConfig = localStorage.getItem('hopqua_config');
    let cfg = savedConfig ? JSON.parse(savedConfig) : {};
    cfg.recipientName = name;
    const cfgStr = JSON.stringify(cfg);
    localStorage.setItem('hopqua_config', cfgStr);
    document.cookie = `hopqua_config=${encodeURIComponent(cfgStr)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    console.warn('Lỗi lưu auth profile:', e);
  }

  // Bắn sự kiện toàn cục để các tab khác đồng bộ ngay lập tức
  window.dispatchEvent(new CustomEvent('recipientNameChanged', { detail: { name: name } }));

  // Chỉ gọi API backend nếu chạy qua HTTP/HTTPS
  if (window.location.protocol.startsWith('http')) {
    try {
      fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      }).catch(() => {});
    } catch (e) {}
  }

  return profile;
}

/**
 * Cập nhật tên đã xác thực khi người dùng đổi tên trong cấu hình cá nhân hóa
 */
export function updateStoredAuthName(newName) {
  if (!newName) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      p.name = newName;
      p.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    }
  } catch (e) {
    console.warn('Lỗi cập nhật tên auth profile:', e);
  }
}

/**
 * Khởi tạo modal xác thực tên và callback khi đăng nhập thành công
 */
export function initAuthGate(onSuccessCallback) {
  const modal = document.getElementById('auth-modal');
  const form = document.getElementById('auth-form');
  const input = document.getElementById('auth-name-input');
  const errorMsg = document.getElementById('auth-error-msg');
  const submitBtn = document.getElementById('auth-submit-btn');

  const existingAuth = getStoredAuth();
  if (existingAuth) {
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    if (typeof onSuccessCallback === 'function') {
      onSuccessCallback(existingAuth);
    }
    return;
  }

  // Chưa xác thực -> hiển thị modal và khóa cuộn trang
  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    requestAnimationFrame(() => {
      modal.classList.remove('opacity-0');
      const dialog = document.getElementById('auth-modal-dialog');
      if (dialog) dialog.classList.remove('scale-95');
    });
  }

  if (input) {
    setTimeout(() => input.focus(), 300);
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const rawVal = input.value;
      if (!rawVal || !rawVal.trim()) {
        showError('Nhập Tên của Baby nhé ♡');
        return;
      }

      if (isValidRecipient(rawVal)) {
        const canonicalName = formatCanonicalName(rawVal);
        const profile = saveAuthProfile(canonicalName, rawVal);

        // Hiệu ứng mở khóa thành công
        if (errorMsg) {
          errorMsg.textContent = `Tuyệt vời! Chào mừng baby đến với không gian bí mật ♡`;
          errorMsg.className = 'text-xs text-brand-600 font-bold block mt-2 animate-bounce-subtle';
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `<span>Đang mở quà cho baby...</span> <span>🌸</span>`;
        }

        setTimeout(() => {
          if (modal) {
            modal.classList.add('opacity-0');
            const dialog = document.getElementById('auth-modal-dialog');
            if (dialog) dialog.classList.add('scale-95');
            setTimeout(() => {
              modal.classList.add('hidden');
              document.body.classList.remove('overflow-hidden');
              window.scrollTo(0, 0);
            }, 400);
          }

          if (typeof onSuccessCallback === 'function') {
            onSuccessCallback(profile);
          }
        }, 800);

      } else {
        showError('Ủa hình như chưa đúng tên của baby rồi nè... Thử lại nha baby ♡');
        input.classList.add('border-red-400', 'animate-shake');
        setTimeout(() => input.classList.remove('animate-shake'), 600);
      }
    });
  }

  function showError(msg) {
    if (errorMsg) {
      errorMsg.textContent = msg;
      errorMsg.className = 'text-xs text-red-500 font-semibold block mt-2';
    }
  }
}
