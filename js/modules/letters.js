/**
 * Module Quản lý 30 Lời Thương (Tab 2)
 * Bao gồm mở thư, đọc thư, lọc cảm xúc, đếm tiến trình và cá nhân hóa
 */

import { poems, wishes, comforts, allLetters, lettersMap } from '../data/lettersData.js';
import { audioPlayer } from './audio.js';
import { spawnFloatingHearts } from './particles2d.js';

export function syncBodyScrollLock() {
  const visibleModals = document.querySelectorAll(
    '#auth-modal:not(.hidden), #letter-modal:not(.hidden), #special-letter-modal:not(.hidden), #config-modal:not(.hidden)'
  );
  if (visibleModals.length > 0) {
    document.body.classList.add('overflow-hidden');
    // Đóng băng hiệu ứng 3D khi đang mở bất kỳ cửa sổ nào (Point 4.1)
    window.__APP__?.heartViewer?.pause();
  } else {
    document.body.classList.remove('overflow-hidden');
    // Nếu đóng hết modal và đang ở Tab 1, bật lại render 3D
    if (window.__APP__?.currentTab === 'heart3d') {
      window.__APP__?.heartViewer?.start();
    }
  }
}

function getCookie(name) {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
  } catch (e) {}
  return null;
}

function setCookie(name, value, days = 365) {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (e) {}
}

export class LettersManager {
  constructor(options = {}) {
    this.userConfig = {
      recipientName: options.recipientName || "Huyền Trân",
      senderName: "Cậu bạn 17 tuổi của Trân",
      signature: "Cậu bạn 17 tuổi của Huyền Trân ♡",
      customNote: ""
    };

    this.openedLetters = new Set();
    this.activeCompartment = 'poems';
    this.activeFilter = 'all';
    this.currentModalLetterId = null;

    this.toastTimer = null;
  }

  init() {
    this.loadSavedState();
    this.applyPersonalization();
    this.updateProgressCounts();
    this.updateCompartmentTabs();
    this.updateFilterChips();
    this.renderEnvelopes();
    this.setupEvents();
  }

  loadSavedState() {
    try {
      let savedConfig = localStorage.getItem('hopqua_config');
      if (!savedConfig) {
        savedConfig = getCookie('hopqua_config');
      }
      if (savedConfig) {
        this.userConfig = Object.assign({}, this.userConfig, JSON.parse(savedConfig));
      }

      let savedOpened = localStorage.getItem('hopqua_opened_ids');
      if (!savedOpened) {
        savedOpened = getCookie('hopqua_opened_ids');
      }
      if (savedOpened) {
        const arr = JSON.parse(savedOpened);
        if (Array.isArray(arr)) this.openedLetters = new Set(arr);
      }
    } catch (e) {
      console.warn('Lỗi đọc dữ liệu thư:', e);
    }
  }

  saveState() {
    try {
      const openedArrStr = JSON.stringify(Array.from(this.openedLetters));
      const configStr = JSON.stringify(this.userConfig);

      localStorage.setItem('hopqua_opened_ids', openedArrStr);
      localStorage.setItem('hopqua_config', configStr);

      // Lưu dự phòng vào Cookie cho các trình duyệt webview tích hợp (Messenger, Zalo)
      setCookie('hopqua_opened_ids', openedArrStr, 365);
      setCookie('hopqua_config', configStr, 365);
    } catch (e) {
      console.warn('Lỗi lưu dữ liệu thư:', e);
    }

    // Chỉ đồng bộ lên backend nếu đang chạy qua HTTP/HTTPS
    if (window.location.protocol.startsWith('http')) {
      try {
        fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            openedCount: this.openedLetters.size,
            openedIds: Array.from(this.openedLetters),
            userConfig: this.userConfig
          })
        }).catch(() => {});
      } catch (e) {}
    }
  }

  setRecipientName(name) {
    if (!name) return;
    this.userConfig.recipientName = name;
    this.applyPersonalization();
    this.saveState();
  }

  applyPersonalization() {
    const name = this.userConfig.recipientName || "Huyền Trân";
    document.querySelectorAll('.recipient-display').forEach(el => {
      el.textContent = name;
    });
    document.querySelectorAll('.sender-display').forEach(el => {
      el.textContent = this.userConfig.senderName || "Chiếc bot của em";
    });
    document.querySelectorAll('.signature-display').forEach(el => {
      el.textContent = this.userConfig.signature || "Anh người yêu ngốc nghếch ♡";
    });

    const customNoteEl = document.getElementById('custom-note-container');
    const customNoteText = document.getElementById('custom-note-text');
    if (customNoteEl && customNoteText) {
      if (this.userConfig.customNote && this.userConfig.customNote.trim()) {
        customNoteEl.classList.remove('hidden');
        customNoteText.textContent = this.userConfig.customNote.trim();
      } else {
        customNoteEl.classList.add('hidden');
        customNoteText.textContent = "";
      }
    }

    // Cập nhật lại câu thoại của Miu Miu theo tên mới
    this.updateProgressCounts();
  }

  updateProgressCounts() {
    const total = allLetters.length;
    const totalOpened = this.openedLetters.size;

    const totalCountEl = document.getElementById('total-opened-count');
    const fillEl = document.getElementById('total-progress-fill');
    if (totalCountEl) totalCountEl.textContent = totalOpened;
    if (fillEl) {
      const pct = Math.round((totalOpened / total) * 100);
      fillEl.style.width = pct + '%';
    }

    let pCount = 0, wCount = 0, cCount = 0;
    this.openedLetters.forEach(id => {
      if (id.startsWith('poem-')) pCount++;
      else if (id.startsWith('wish-')) wCount++;
      else if (id.startsWith('comfort-')) cCount++;
    });

    const pEl = document.getElementById('count-poems-opened');
    const wEl = document.getElementById('count-wishes-opened');
    const cEl = document.getElementById('count-comforts-opened');
    if (pEl) pEl.textContent = pCount;
    if (wEl) wEl.textContent = wCount;
    if (cEl) cEl.textContent = cCount;

    const bubble = document.getElementById('mascot-bubble');
    if (bubble) {
      const name = this.userConfig.recipientName || "Huyền Trân";
      if (totalOpened === 0) {
        bubble.textContent = `“Chào ${name}! Hôm nay em muốn chọn đọc một bài thơ, một lời chúc hay cần một cái ôm ấm áp nè?”`;
      } else if (totalOpened < 10) {
        bubble.textContent = `“Oa, ${name} đã mở được ${totalOpened} phong thư rồi đó! Thư nào cũng đong đầy tình cảm luôn.”`;
      } else if (totalOpened < 25) {
        bubble.textContent = `“Đã mở được ${totalOpened}/30 bức thư rồi nè! Em nhớ đọc chậm lại để cảm nhận sự ấm áp nha.”`;
      } else if (totalOpened === 30) {
        bubble.textContent = `“Tuyệt vời quá! ${name} đã mở trọn vẹn 30 lời thương rồi! Em có thấy một cái ôm thật lớn chưa? ♡”`;
      }
    }
  }

  renderEnvelopes() {
    const grid = document.getElementById('envelopes-grid');
    if (!grid) return;
    grid.innerHTML = '';

    let currentList = [];
    if (this.activeCompartment === 'poems') currentList = poems;
    else if (this.activeCompartment === 'wishes') currentList = wishes;
    else if (this.activeCompartment === 'comforts') currentList = comforts;

    const filtered = currentList.filter(item => {
      if (this.activeFilter === 'all') return true;
      if (this.activeFilter === '20/10') return item.mood === '20/10' || item.tag.includes('20/10');
      if (this.activeFilter === 'tired') return item.mood === 'tired';
      if (this.activeFilter === 'sad') return item.mood === 'sad';
      if (this.activeFilter === 'happy') return item.mood === 'happy';
      if (this.activeFilter === 'care') return item.mood === 'care' || item.mood === 'calm';
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-12 text-center text-warmgray-500 bg-white/70 rounded-2xl border border-brand-200">
          <span class="text-3xl block mb-2">🌸</span>
          <p class="text-sm font-medium">Không có phong thư nào khớp với bộ lọc này.</p>
          <button id="reset-filter-btn" class="mt-3 px-3.5 py-1.5 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">Xem tất cả</button>
        </div>
      `;
      const resetBtn = document.getElementById('reset-filter-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.activeFilter = 'all';
          this.updateFilterChips();
          this.renderEnvelopes();
        });
      }
      return;
    }

    filtered.forEach(item => {
      const isOpened = this.openedLetters.has(item.id);
      const card = document.createElement('div');
      card.className = `envelope-card cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
        isOpened 
          ? 'bg-white/95 border-brand-200 shadow-xs' 
          : 'bg-gradient-to-br from-cream-50 via-white to-brand-50/60 border-brand-300/80 shadow-sm hover:border-brand-400'
      }`;

      let snippet = "";
      if (item.type === 'poem') {
        snippet = item.lines ? item.lines.slice(0, 2).join(' ') + '...' : '';
      } else {
        snippet = item.content ? item.content.slice(0, 65) + '...' : '';
      }

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="text-xs font-bold px-2.5 py-0.5 rounded-full ${
              isOpened ? 'bg-cream-100 text-warmgray-600' : 'bg-brand-100 text-brand-600'
            }">${item.tag}</span>
            
            <span class="text-xs font-semibold flex items-center gap-1 ${isOpened ? 'text-brand-500' : 'text-warmgray-400'}">
              ${isOpened ? '<span>Đã mở ✓</span>' : '<span class="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span> Mới'}
            </span>
          </div>

          <h4 class="font-display font-bold text-sm sm:text-base text-warmgray-800 mb-1 flex items-center gap-1.5">
            <span>${item.icon}</span>
            <span>${item.title}</span>
          </h4>

          <p class="text-xs text-warmgray-500 line-clamp-2 leading-relaxed">
            ${snippet}
          </p>
        </div>

        <div class="mt-4 pt-3 border-t border-brand-100 flex items-center justify-between text-[11px] text-warmgray-500">
          <span class="font-medium text-brand-600">Chạm để mở thư</span>
          <div class="w-6 h-6 rounded-full flex items-center justify-center ${
            isOpened ? 'bg-brand-50 text-brand-500' : 'bg-brand-500 text-white shadow-xs'
          }">
            ${isOpened ? '✓' : '✉'}
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.openLetterModal(item.id);
      });

      grid.appendChild(card);
    });
  }

  updateFilterChips() {
    document.querySelectorAll('.filter-chip').forEach(btn => {
      if (btn.getAttribute('data-filter') === this.activeFilter) {
        btn.className = 'filter-chip active flex-shrink-0 px-3 py-1 rounded-full bg-brand-500 text-white font-medium shadow-xs';
      } else {
        btn.className = 'filter-chip flex-shrink-0 px-3 py-1 rounded-full bg-white hover:bg-brand-50 border border-brand-200 text-warmgray-600 font-medium transition-colors';
      }
    });
  }

  updateCompartmentTabs() {
    const tabs = [
      { id: 'tab-poems-btn', key: 'poems' },
      { id: 'tab-wishes-btn', key: 'wishes' },
      { id: 'tab-comforts-btn', key: 'comforts' }
    ];

    tabs.forEach(t => {
      const btn = document.getElementById(t.id);
      if (!btn) return;
      if (this.activeCompartment === t.key) {
        btn.className = 'compartment-tab active py-3 px-2 sm:px-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 text-center bg-white border-brand-400 shadow-sm text-brand-600 font-bold';
      } else {
        btn.className = 'compartment-tab py-3 px-2 sm:px-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 text-center bg-cream-50 border-transparent hover:border-brand-200 text-warmgray-600 font-medium';
      }
    });
  }

  openLetterModal(letterId) {
    const item = lettersMap[letterId];
    if (!item) return;

    this.currentModalLetterId = letterId;
    this.openedLetters.add(letterId);
    this.saveState();
    this.updateProgressCounts();
    this.renderEnvelopes();

    const iconEl = document.getElementById('modal-letter-icon');
    const badgeEl = document.getElementById('modal-letter-type-badge');
    const tagEl = document.getElementById('modal-letter-tag');
    const titleEl = document.getElementById('modal-letter-title');
    const bodyEl = document.getElementById('modal-letter-body');
    const catCommentEl = document.getElementById('modal-cat-comment');

    if (iconEl) iconEl.textContent = item.icon || '💌';

    let typeLabel = "Phong Thư";
    if (item.type === 'poem') typeLabel = "Bài Thơ";
    else if (item.type === 'wish') typeLabel = "Lời Chúc";
    else if (item.type === 'comfort') typeLabel = "Chiếc Ôm Chữ";
    if (badgeEl) badgeEl.textContent = typeLabel;

    if (tagEl) tagEl.textContent = item.tag;
    if (titleEl) titleEl.textContent = item.title;

    if (bodyEl) {
      bodyEl.innerHTML = '';
      if (item.type === 'poem' && Array.isArray(item.lines)) {
        const p = document.createElement('div');
        p.className = 'font-display text-base sm:text-lg text-brand-800 leading-relaxed text-center py-2 sm:py-4 bg-brand-50/40 rounded-2xl border border-brand-100/60 my-2';
        p.innerHTML = item.lines.map(line => `<div class="py-0.5">${line}</div>`).join('');
        if (item.author) {
          const authDiv = document.createElement('div');
          authDiv.className = 'text-xs text-brand-600 font-semibold italic mt-3 pt-2 border-t border-brand-200/60 text-center';
          authDiv.textContent = `— ${item.author}`;
          p.appendChild(authDiv);
        }
        bodyEl.appendChild(p);
      } else {
        const p = document.createElement('p');
        p.className = 'text-sm sm:text-base text-warmgray-700 leading-relaxed sm:leading-loose';
        p.textContent = item.content;
        bodyEl.appendChild(p);
      }
    }

    if (catCommentEl) {
      catCommentEl.textContent = `“${item.catComment || 'Meow~ Hãy luôn vui vẻ em nha!'}”`;
    }

    let currentList = [];
    if (item.type === 'poem') currentList = poems;
    else if (item.type === 'wish') currentList = wishes;
    else if (item.type === 'comfort') currentList = comforts;

    const currentIndex = currentList.findIndex(x => x.id === item.id);
    const prevBtn = document.getElementById('modal-prev-btn');
    const nextBtn = document.getElementById('modal-next-btn');
    const indexIndicator = document.getElementById('modal-letter-index');

    if (indexIndicator) indexIndicator.textContent = `${currentIndex + 1} / ${currentList.length}`;
    if (prevBtn) prevBtn.disabled = currentIndex <= 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= currentList.length - 1;

    const modal = document.getElementById('letter-modal');
    if (modal) {
      modal.classList.remove('hidden');
      syncBodyScrollLock();
      requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        const dialog = document.getElementById('letter-modal-dialog');
        if (dialog) dialog.classList.remove('scale-95');
      });
    }

    spawnFloatingHearts(window.innerWidth / 2, window.innerHeight / 2, 8);
    audioPlayer.playChime();
  }

  closeLetterModal() {
    const modal = document.getElementById('letter-modal');
    if (!modal) return;
    modal.classList.add('opacity-0');
    const dialog = document.getElementById('letter-modal-dialog');
    if (dialog) dialog.classList.add('scale-95');
    setTimeout(() => {
      modal.classList.add('hidden');
      syncBodyScrollLock();
    }, 300);
  }

  navigateModal(direction) {
    if (!this.currentModalLetterId) return;
    const currentItem = lettersMap[this.currentModalLetterId];
    if (!currentItem) return;

    let currentList = [];
    if (currentItem.type === 'poem') currentList = poems;
    else if (currentItem.type === 'wish') currentList = wishes;
    else if (currentItem.type === 'comfort') currentList = comforts;

    const currentIndex = currentList.findIndex(x => x.id === currentItem.id);
    const newIndex = currentIndex + direction;

    if (newIndex >= 0 && newIndex < currentList.length) {
      this.openLetterModal(currentList[newIndex].id);
    }
  }

  showToast(msg, icon = '✨') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    const msgEl = document.getElementById('toast-msg');
    const iconEl = document.getElementById('toast-icon');
    if (msgEl) msgEl.textContent = msg;
    if (iconEl) iconEl.textContent = icon;

    toast.classList.remove('opacity-0', 'pointer-events-none');
    toast.classList.add('opacity-100');

    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('opacity-100');
      toast.classList.add('opacity-0', 'pointer-events-none');
    }, 2200);
  }

  copyCurrentLetter() {
    if (!this.currentModalLetterId) return;
    const item = lettersMap[this.currentModalLetterId];
    if (!item) return;

    let text = `${item.title}\n\n`;
    if (item.type === 'poem' && Array.isArray(item.lines)) {
      text += item.lines.join('\n');
    } else {
      text += item.content;
    }
    const name = this.userConfig.recipientName || "Huyền Trân";
    text += `\n\n— Gửi tặng ${name} nhân ngày 20/10 ♡`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast("Đã sao chép lời thương vào bộ nhớ tạm! ♡", "📋");
      }).catch(() => {
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  }

  fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      this.showToast("Đã sao chép lời thương! ♡", "📋");
    } catch (e) {
      this.showToast("Không thể sao chép tự động", "⚠️");
    }
    document.body.removeChild(ta);
  }

  openSpecialLetter() {
    const modal = document.getElementById('special-letter-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    syncBodyScrollLock();
    requestAnimationFrame(() => {
      modal.classList.remove('opacity-0');
    });
    spawnFloatingHearts(window.innerWidth / 2, window.innerHeight / 2, 12);
    audioPlayer.playChime();
  }

  closeSpecialLetter() {
    const modal = document.getElementById('special-letter-modal');
    if (!modal) return;
    modal.classList.add('opacity-0');
    setTimeout(() => {
      modal.classList.add('hidden');
      syncBodyScrollLock();
    }, 300);
  }

  setupEvents() {
    // Tab filters
    document.getElementById('tab-poems-btn')?.addEventListener('click', () => {
      this.activeCompartment = 'poems';
      this.updateCompartmentTabs();
      this.renderEnvelopes();
    });
    document.getElementById('tab-wishes-btn')?.addEventListener('click', () => {
      this.activeCompartment = 'wishes';
      this.updateCompartmentTabs();
      this.renderEnvelopes();
    });
    document.getElementById('tab-comforts-btn')?.addEventListener('click', () => {
      this.activeCompartment = 'comforts';
      this.updateCompartmentTabs();
      this.renderEnvelopes();
    });

    // Mood filter chips
    document.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeFilter = btn.getAttribute('data-filter') || 'all';
        this.updateFilterChips();
        this.renderEnvelopes();
      });
    });

    // Modal navigation
    document.getElementById('modal-close-btn')?.addEventListener('click', () => this.closeLetterModal());
    document.getElementById('modal-prev-btn')?.addEventListener('click', () => this.navigateModal(-1));
    document.getElementById('modal-next-btn')?.addEventListener('click', () => this.navigateModal(1));
    document.getElementById('modal-copy-btn')?.addEventListener('click', () => this.copyCurrentLetter());

    document.getElementById('letter-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'letter-modal') this.closeLetterModal();
    });

    // Special letter
    document.getElementById('open-special-letter-btn')?.addEventListener('click', () => this.openSpecialLetter());
    document.getElementById('banner-open-special-btn')?.addEventListener('click', () => this.openSpecialLetter());
    document.getElementById('special-close-btn')?.addEventListener('click', () => this.closeSpecialLetter());
    document.getElementById('special-letter-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'special-letter-modal') this.closeSpecialLetter();
    });

    // Hug button
    document.getElementById('send-hug-btn')?.addEventListener('click', () => {
      spawnFloatingHearts(window.innerWidth / 2, window.innerHeight / 2, 16);
      audioPlayer.playChime();
      const fb = document.getElementById('hug-feedback');
      if (fb) {
        fb.textContent = "Anh đã nhận được cái ôm ấm áp của em rồi! Yêu em nhiều lắm! ♡";
        setTimeout(() => { fb.textContent = ""; }, 3200);
      }

      // Gửi tín hiệu về server & báo qua Gmail
      if (window.location.protocol.startsWith('http')) {
        try {
          fetch('/api/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'hug',
              sender: this.userConfig.recipientName || 'Huyền Trân',
              timestamp: new Date().toISOString()
            })
          }).catch(() => {});
        } catch (e) {}
      }
    });

    // Personalization modal
    const configModal = document.getElementById('config-modal');
    document.getElementById('config-open-btn')?.addEventListener('click', () => {
      const rec = document.getElementById('input-recipient');
      const sen = document.getElementById('input-sender');
      const sig = document.getElementById('input-signature');
      const note = document.getElementById('input-custom-note');

      if (rec) rec.value = this.userConfig.recipientName;
      if (sen) sen.value = this.userConfig.senderName;
      if (sig) sig.value = this.userConfig.signature;
      if (note) note.value = this.userConfig.customNote || "";

      if (configModal) {
        configModal.classList.remove('hidden');
        syncBodyScrollLock();
        requestAnimationFrame(() => configModal.classList.remove('opacity-0'));
      }
    });

    // Mobile Floating Action Buttons (Point 2.1)
    document.getElementById('mobile-floating-letter-btn')?.addEventListener('click', () => {
      this.openSpecialLetter();
    });
    document.getElementById('mobile-floating-config-btn')?.addEventListener('click', () => {
      document.getElementById('config-open-btn')?.click();
    });

    const closeConfigModal = () => {
      if (configModal) {
        configModal.classList.add('opacity-0');
        setTimeout(() => {
          configModal.classList.add('hidden');
          syncBodyScrollLock();
        }, 300);
      }
    };

    document.getElementById('config-close-btn')?.addEventListener('click', closeConfigModal);
    configModal?.addEventListener('click', (e) => {
      if (e.target.id === 'config-modal') closeConfigModal();
    });

    document.getElementById('config-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const rec = document.getElementById('input-recipient');
      const sen = document.getElementById('input-sender');
      const sig = document.getElementById('input-signature');
      const note = document.getElementById('input-custom-note');

      if (rec) this.userConfig.recipientName = rec.value.trim() || "Huyền Trân";
      if (sen) this.userConfig.senderName = sen.value.trim() || "Chiếc bot của em";
      if (sig) this.userConfig.signature = sig.value.trim() || "Anh người yêu ngốc nghếch ♡";
      if (note) this.userConfig.customNote = note.value.trim();

      this.saveState();
      this.applyPersonalization();

      // Bắn sự kiện đồng bộ tên sang Tab 3
      window.dispatchEvent(new CustomEvent('recipientNameChanged', { detail: { name: this.userConfig.recipientName } }));

      closeConfigModal();
      this.showToast("Đã cập nhật thông tin cá nhân hóa! ♡", "✨");
    });

    // Reset default
    document.getElementById('config-reset-btn')?.addEventListener('click', () => {
      this.userConfig.senderName = "Chiếc bot của em";
      this.userConfig.signature = "Anh người yêu ngốc nghếch ♡";
      this.userConfig.customNote = "";
      this.saveState();
      this.applyPersonalization();
      closeConfigModal();
      this.showToast("Đã khôi phục thiết lập mặc định", "🔄");
    });

    // Keyboard shortcuts (Chặn phím mũi tên khi người dùng đang nhập văn bản)
    window.addEventListener('keydown', (e) => {
      const isInputFocused = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');

      if (e.key === 'Escape') {
        this.closeLetterModal();
        this.closeSpecialLetter();
        closeConfigModal();
      } else if (!isInputFocused && e.key === 'ArrowLeft') {
        this.navigateModal(-1);
      } else if (!isInputFocused && e.key === 'ArrowRight') {
        this.navigateModal(1);
      }
    });
  }
}
