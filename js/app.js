/**
 * Ứng dụng chính (Main Application Controller)
 * Điều phối 3 Tab, Xác thực tên người nhận, Trái tim 3D, Hộp quà và Lời tri ân
 */

import { initAuthGate, getStoredAuth, updateStoredAuthName } from './modules/auth.js';
import { Heart3DViewer } from './modules/heart3d.js';
import { LettersManager } from './modules/letters.js';
import { GiftBox } from './modules/giftbox.js';
import { TributeManager } from './modules/tribute.js';
import { audioPlayer } from './modules/audio.js';
import { AmbientParticles } from './modules/particles2d.js';

class AppController {
  constructor() {
    this.currentTab = null; // Mặc định chưa chọn để switchTab('heart3d') chạy hoàn chỉnh khi init
    this.heartViewer = null;
    this.lettersManager = null;
    this.giftBox = null;
    this.tributeManager = null;
    this.ambientParticles = null;
    this.recipientName = 'Huyền Trân';
  }

  init() {
    // 1. Khởi tạo Ambient Particles 2D
    this.ambientParticles = new AmbientParticles('particles-canvas');

    // 2. Khởi tạo Trái tim 3D (Tab 1)
    this.heartViewer = new Heart3DViewer('heart-3d-canvas-container');

    // 3. Khởi tạo Quản lý 30 lá thư (Tab 2)
    this.lettersManager = new LettersManager({
      recipientName: this.recipientName
    });
    this.lettersManager.init();

    // 4. Khởi tạo Hộp quà 3D
    this.giftBox = new GiftBox(this.lettersManager);
    this.giftBox.init();

    // 5. Khởi tạo Tri ân (Tab 3)
    this.tributeManager = new TributeManager();
    this.tributeManager.init(this.recipientName);

    // 6. Lắng nghe sự kiện thay đổi tên toàn cục
    window.addEventListener('recipientNameChanged', (e) => {
      const newName = e.detail?.name || 'Huyền Trân';
      this.recipientName = newName;
      updateStoredAuthName(newName);
      this.lettersManager.setRecipientName(newName);
      this.tributeManager.setRecipientName(newName);
      document.querySelectorAll('.recipient-display').forEach(el => {
        el.textContent = newName;
      });
    });

    // 7. Thiết lập chuyển đổi 3 Tab
    this.setupTabNavigation();

    // 8. Thiết lập nút Âm thanh và Header
    this.setupHeaderActions();

    // 9. Khởi chạy Cổng xác thực tên người nhận (Entrance Gate)
    initAuthGate((authProfile) => {
      this.onUserAuthenticated(authProfile);
    });

    // Kiểm tra xem đã có auth sẵn chưa
    const existingAuth = getStoredAuth();
    if (existingAuth) {
      this.onUserAuthenticated(existingAuth);
    }

    // Kích hoạt tab mặc định
    this.switchTab('heart3d');
  }

  onUserAuthenticated(profile) {
    this.recipientName = profile.name || 'Huyền Trân';
    updateStoredAuthName(this.recipientName);

    // Cập nhật tên người nhận xuyên suốt các module
    this.lettersManager.setRecipientName(this.recipientName);
    this.tributeManager.setRecipientName(this.recipientName);

    document.querySelectorAll('.recipient-display').forEach(el => {
      el.textContent = this.recipientName;
    });

    // Thông báo chào mừng
    // Kích hoạt ngay Trái tim 3D nếu đang ở Tab 1
    if (this.currentTab === 'heart3d' && this.heartViewer) {
      this.heartViewer.start();
    }

    this.lettersManager.showToast(`Chào mừng ${this.recipientName} đến với không gian yêu thương! ♡`, '🌸');
  }

  setupTabNavigation() {
    const tabBtns = document.querySelectorAll('.nav-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });
  }

  switchTab(tabId) {
    if (this.currentTab === tabId) {
      if (tabId === 'heart3d' && this.heartViewer && !this.heartViewer.isActive) {
        this.heartViewer.start();
      }
      return;
    }
    this.currentTab = tabId;

    // Cập nhật trạng thái active chỉ của nút Tab trên Header Nav (tránh ảnh hưởng các nút CTA trong trang)
    document.querySelectorAll('header nav .nav-tab-btn').forEach(btn => {
      const isTarget = btn.getAttribute('data-tab') === tabId;
      if (isTarget) {
        btn.classList.add('active', 'border-brand-500', 'text-brand-600', 'bg-white', 'shadow-xs');
        btn.classList.remove('text-warmgray-500', 'border-transparent', 'hover:bg-brand-50');
      } else {
        btn.classList.remove('active', 'border-brand-500', 'text-brand-600', 'bg-white', 'shadow-xs');
        btn.classList.add('text-warmgray-500', 'border-transparent', 'hover:bg-brand-50');
      }
    });

    // Ẩn/Hiện nội dung các Tab
    const tabSections = {
      heart3d: document.getElementById('tab-content-heart3d'),
      letters: document.getElementById('tab-content-letters'),
      tribute: document.getElementById('tab-content-tribute')
    };

    Object.keys(tabSections).forEach(key => {
      const sec = tabSections[key];
      if (!sec) return;
      if (key === tabId) {
        sec.classList.remove('hidden');
        if (window.gsap) {
          gsap.fromTo(sec, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
        }
      } else {
        sec.classList.add('hidden');
      }
    });

    // Điều khiển Three.js Loop và AmbientParticles 2D để tiết kiệm pin/GPU (Point 4.1 & 4.5)
    if (tabId === 'heart3d') {
      document.body.classList.add('theme-dark-heart');
      if (this.ambientParticles) {
        this.ambientParticles.stop(); // Tắt hạt 2D vì tab 3D đã có bụi sao 3D
      }
      requestAnimationFrame(() => {
        if (this.heartViewer) {
          this.heartViewer.start();
        }
      });
    } else {
      document.body.classList.remove('theme-dark-heart');
      if (this.heartViewer) {
        this.heartViewer.pause(); // Đóng băng 3D khi sang tab 2 hoặc tab 3
      }
      if (this.ambientParticles) {
        this.ambientParticles.start(); // Chỉ bật hạt 2D ở tab 2 và tab 3
      }
    }

    // Cuộn mượt lên đầu trang khi đổi tab
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setupHeaderActions() {
    const audioBtn = document.getElementById('audio-toggle-btn');
    const audioNextBtn = document.getElementById('audio-next-btn');
    const audioIcon = document.getElementById('audio-icon');
    const audioText = document.getElementById('audio-text');

    const removeGestureListeners = () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };

    // Tự động phát nhạc ngay khi người dùng chạm tay lần đầu vào bất kỳ đâu trên màn hình (Point 3.4)
    const handleFirstGesture = (e) => {
      // Nếu chạm trực tiếp vào nút điều khiển nhạc, nhường quyền xử lý hoàn toàn cho nút đó
      if (e && e.target && e.target.closest('#audio-toggle-btn, #audio-next-btn')) {
        return;
      }
      removeGestureListeners();
      if (!audioPlayer.isPlaying && !audioPlayer.userExplicitlyPaused) {
        audioPlayer.play();
      }
    };
    window.addEventListener('pointerdown', handleFirstGesture, { passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true });

    const audioContainer = document.getElementById('audio-player-container');
    audioPlayer.onStateChange = (isPlaying, track) => {
      const current = track || audioPlayer.getCurrentTrack();
      if (isPlaying) {
        if (audioIcon) {
          audioIcon.textContent = '🎶';
          audioIcon.classList.add('animate-bounce-subtle');
        }
        if (audioText) audioText.textContent = current.title;
        if (audioContainer) audioContainer.classList.add('is-playing');
        if (audioBtn) {
          audioBtn.classList.remove('bg-brand-200');
          audioBtn.classList.add('is-playing', 'text-brand-700', 'font-bold');
        }
      } else {
        if (audioIcon) {
          audioIcon.textContent = '🎵';
          audioIcon.classList.remove('animate-bounce-subtle');
        }
        if (audioText) audioText.textContent = 'Nhạc tình yêu';
        if (audioContainer) audioContainer.classList.remove('is-playing');
        if (audioBtn) {
          audioBtn.classList.remove('bg-brand-200', 'is-playing', 'text-brand-700', 'font-bold');
        }
      }
    };

    audioPlayer.onTrackChange = (track) => {
      if (audioText && audioPlayer.isPlaying) {
        audioText.textContent = track.title;
      }
    };

    audioPlayer.onAutoAdvance = (track) => {
      this.lettersManager?.showToast(
        `Bài tiếp theo: ${track.title} — ${track.composer} ♡`,
        track.icon || '🎶'
      );
    };

    if (audioBtn) {
      audioBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        removeGestureListeners();
        const isNowPlaying = await audioPlayer.toggle();
        const current = audioPlayer.getCurrentTrack();
        this.lettersManager?.showToast(
          isNowPlaying ? `Đang phát: ${current.title} — ${current.composer} ♡` : 'Đã tạm dừng nhạc ♡',
          isNowPlaying ? (current.icon || '🎶') : '🔇'
        );
      });
    }

    if (audioNextBtn) {
      audioNextBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        removeGestureListeners();
        const nextTrack = await audioPlayer.next(true);
        this.lettersManager?.showToast(
          `Đổi bài: ${nextTrack.title} — ${nextTrack.composer} ♡`,
          nextTrack.icon || '⏭️'
        );
      });
    }

    // Nút Logo Thương hiệu (Click để về lại Tab 1 Trái tim 3D)
    document.getElementById('nav-brand-btn')?.addEventListener('click', () => {
      this.switchTab('heart3d');
    });

    // Nút chuyển trực tiếp đến Tab 3 (Tri ân)
    document.getElementById('nav-to-tribute-btn')?.addEventListener('click', () => {
      this.switchTab('tribute');
    });
  }
}

// Khởi tạo ứng dụng khi DOM tải xong
document.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
  window.__APP__ = app;
});
