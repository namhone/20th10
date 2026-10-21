/**
 * Module Tri Ân Người Con Gái Tớ Thích (Tab 3)
 * Dành riêng cho Trần Thị Huyền Trân (11/01/2009)
 * Lời xin lỗi chân thành, mong ước được gặp gỡ, hẹn hò và lời chúc sức khỏe dồi dào
 */

import { audioPlayer } from './audio.js';
import { spawnFloatingHearts } from './particles2d.js';

export class TributeManager {
  constructor() {
    this.recipientName = 'Huyền Trân';
    this.healthPills = [
      "🌡️ [Liều hạ sốt & dưỡng sức]: Nếu hôm nay nghe người hâm hấp nóng hay mệt mỏi, Trân nhớ đo nhiệt độ, uống nhiều nước ấm và đắp chăn nằm nghỉ nhé. Đừng ráng ngồi học khi đang sốt, tớ lo cho cậu lắm đó! ♡",
      "🕊️ [Liều chữa lành tâm hồn]: Ở nhà nếu lỡ phải nghe những lời nặng nề làm cậu tủi thân, hãy nhớ rằng cậu không làm gì sai cả. Cậu luôn là cô gái ngoan ngoãn và quý giá nhất đối với tớ.",
      "🛡️ [Liều lá chắn bình yên]: Mấy trò đùa lố lăng, vô duyên của đám con trai ở trường không đáng để Trân bận tâm một giây nào. Tớ luôn đứng về phía cậu và bảo vệ nụ cười của cậu!",
      "🍲 [Liều ấm bụng]: Dù mệt mỏi hay đắng miệng đến đâu, Trân cũng nhớ ăn chút cháo ấm hoặc một chén súp nhé. Cái bụng nhỏ phải có năng lượng thì cơ thể mới mau khỏe được nè.",
      "🌙 [Liều ngủ ngoan không âu lo]: Gác lại sách vở bài tập thôi nào cô bé 17 tuổi. Đêm nay hãy thả lỏng bờ vai, nhắm mắt lại và ngủ một giấc thật êm. Mọi muộn phiền cứ để tớ gánh thay cậu.",
      "🧋 [Liều sạc pin ngọt ngào]: Gửi cho Trân một ly trà sữa ngọt ngào qua tâm trí! Cố lên nhé, rồi tớ sẽ sớm dắt cậu đi date ngoài đời thực để bù đắp hết những ngày mệt mỏi này nha."
    ];
  }

  init(name) {
    if (name) this.recipientName = name;
    this.setupEvents();
    this.loadSavedVoucher();
  }

  loadSavedVoucher() {
    try {
      let raw = localStorage.getItem('hopqua_date_voucher');
      if (!raw) {
        const cookieVal = document.cookie.split('; ').find(row => row.startsWith('hopqua_date_voucher='));
        if (cookieVal) raw = decodeURIComponent(cookieVal.split('=')[1]);
      }
      if (raw) {
        const data = JSON.parse(raw);
        if (data && data.activity) {
          const activityInput = document.getElementById('date-activity-input');
          if (activityInput) activityInput.value = data.activity;

          document.querySelectorAll('.date-choice-card').forEach(c => {
            const isMatch = c.getAttribute('data-value') === data.activity;
            c.classList.toggle('selected', isMatch);
            const ind = c.querySelector('.choice-indicator');
            if (ind) {
              ind.classList.toggle('text-brand-600', isMatch);
              ind.classList.toggle('text-transparent', !isMatch);
            }
          });
          this.renderConfirmedVoucher(data.activity, false);
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc saved date voucher:', e);
    }
  }

  renderConfirmedVoucher(activity, shouldAnimate = true) {
    const dateVoucherBtn = document.getElementById('confirm-date-btn');
    const dateFeedback = document.getElementById('date-voucher-feedback');
    if (!dateFeedback) return;

    if (dateVoucherBtn) {
      dateVoucherBtn.disabled = true;
      dateVoucherBtn.innerHTML = `<span>Đã gửi tín hiệu hẹn hò... ♡</span>`;
    }

    const shareMsg = `Tớ đã chọn buổi hẹn: "${activity}" rồi nè! Hẹn sớm gặp cậu nhé ♡`;
    const encodedMsg = encodeURIComponent(shareMsg);

    dateFeedback.innerHTML = `
      <div class="bg-brand-50 border border-brand-200 rounded-2xl p-4 text-center mt-3 text-xs sm:text-sm text-brand-800 font-medium shadow-xs">
        💌 <strong>Tớ đã nhận được tín hiệu của ${this.recipientName} rồi nè!</strong><br>
        Hẹn cậu một ngày sớm nhất: <em>"${activity}"</em> nhé. Tớ nhất định sẽ chuẩn bị thật chu đáo! ♡
        <div class="mt-3 flex flex-wrap items-center justify-center gap-2">
          <a href="sms:?&body=${encodedMsg}" class="px-3 py-1.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1">
            <span>💬 Báo cho cậu ấy qua tin nhắn</span>
          </a>
          <button id="re-select-date-btn" class="px-3 py-1.5 rounded-full bg-white hover:bg-brand-100 text-brand-600 border border-brand-200 text-xs font-semibold transition-colors">
            🔄 Chọn lại hoạt động khác
          </button>
        </div>
      </div>
    `;

    document.getElementById('re-select-date-btn')?.addEventListener('click', () => {
      try {
        localStorage.removeItem('hopqua_date_voucher');
        document.cookie = 'hopqua_date_voucher=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      } catch (e) {}
      if (dateVoucherBtn) {
        dateVoucherBtn.disabled = false;
        dateVoucherBtn.innerHTML = `<span>Gửi lại tín hiệu 💖</span>`;
      }
      dateFeedback.innerHTML = '';
    });
  }

  setRecipientName(name) {
    if (!name) return;
    this.recipientName = name;
    document.querySelectorAll('.tribute-recipient-name').forEach(el => {
      el.textContent = name;
    });
  }

  setupEvents() {
    // 1. Tương tác rút Vitamin Sức Khỏe
    const pillBtn = document.getElementById('draw-vitamin-btn');
    const pillContent = document.getElementById('vitamin-result-box');
    const pillText = document.getElementById('vitamin-result-text');

    if (pillBtn && pillContent && pillText) {
      pillBtn.addEventListener('click', () => {
        const randomPill = this.healthPills[Math.floor(Math.random() * this.healthPills.length)];
        pillText.textContent = randomPill;
        pillContent.classList.remove('hidden');

        audioPlayer.playChime();
        spawnFloatingHearts(window.innerWidth / 2, window.innerHeight / 2, 12);

        if (window.confetti) {
          window.confetti({
            particleCount: 25,
            spread: 50,
            origin: { y: 0.7 },
            colors: ['#ffa3b5', '#ffd166', '#ffffff']
          });
        }

        // Gửi tín hiệu về server & báo qua Gmail
        if (window.location.protocol.startsWith('http')) {
          try {
            fetch('/api/signal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'vitamin',
                detail: randomPill,
                sender: this.recipientName || 'Huyền Trân',
                timestamp: new Date().toISOString()
              })
            }).catch(() => {});
          } catch (e) {}
        }
      });
    }

    // 2. Xác nhận Vé Hẹn Hò (Date Voucher - Chọn thẻ tương tác không bị cắt câu chữ)
    const choiceCards = document.querySelectorAll('.date-choice-card');
    const activityInput = document.getElementById('date-activity-input');

    choiceCards.forEach(card => {
      card.addEventListener('click', () => {
        choiceCards.forEach(c => {
          c.classList.remove('selected');
          const ind = c.querySelector('.choice-indicator');
          if (ind) {
            ind.classList.remove('text-brand-600');
            ind.classList.add('text-transparent');
          }
        });
        card.classList.add('selected');
        const ind = card.querySelector('.choice-indicator');
        if (ind) {
          ind.classList.remove('text-transparent');
          ind.classList.add('text-brand-600');
        }
        const val = card.getAttribute('data-value');
        if (activityInput) activityInput.value = val;
      });
    });

    const dateVoucherBtn = document.getElementById('confirm-date-btn');

    if (dateVoucherBtn) {
      dateVoucherBtn.addEventListener('click', () => {
        const chosenActivity = activityInput?.value ||
          document.querySelector('.date-choice-card.selected')?.getAttribute('data-value') ||
          "Cùng đi dạo hóng gió, nghe Trân trút hết mọi ấm ức trong lòng";

        audioPlayer.playChime();
        spawnFloatingHearts(window.innerWidth / 2, window.innerHeight / 2, 20);

        if (window.confetti) {
          window.confetti({
            particleCount: 60,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#ff477e', '#ffd166', '#ffCCD7']
          });
        }

        const voucherData = {
          recipient: this.recipientName,
          activity: chosenActivity,
          timestamp: new Date().toISOString()
        };

        try {
          const voucherStr = JSON.stringify(voucherData);
          localStorage.setItem('hopqua_date_voucher', voucherStr);
          // Lưu vào Cookie hỗ trợ trình duyệt webview tích hợp (Zalo/Messenger)
          const expires = new Date(Date.now() + 365 * 864e5).toUTCString();
          document.cookie = `hopqua_date_voucher=${encodeURIComponent(voucherStr)}; expires=${expires}; path=/; SameSite=Lax`;
        } catch (e) {}

        this.renderConfirmedVoucher(chosenActivity, true);

        // Gửi lên backend nếu có server
        if (window.location.protocol.startsWith('http')) {
          try {
            fetch('/api/date-voucher', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(voucherData)
            }).catch(() => {});
          } catch (e) {}
        }
      });
    }

    // 3. Hộp gửi lời nhắn bí mật
    const replyForm = document.getElementById('tribute-reply-form');
    const replyInput = document.getElementById('tribute-reply-input');
    const replyFeedback = document.getElementById('tribute-reply-feedback');

    if (replyForm && replyInput && replyFeedback) {
      replyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = replyInput.value.trim();
        if (!msg) return;

        replyFeedback.textContent = "Đang gửi lời nhắn về hòm thư của anh...";
        replyFeedback.className = "text-xs text-brand-600 font-semibold mt-2";

        const saveLocally = () => {
          const savedReplies = JSON.parse(localStorage.getItem('hopqua_replies') || '[]');
          savedReplies.push({ message: msg, time: new Date().toISOString() });
          localStorage.setItem('hopqua_replies', JSON.stringify(savedReplies));

          replyFeedback.textContent = "Đã lưu lời nhắn của Trân rồi nè! Tớ sẽ đọc thật kỹ! ♡";
          replyInput.value = '';
          audioPlayer.playChime();
          spawnFloatingHearts(window.innerWidth / 2, window.innerHeight / 2, 12);
        };

        if (window.location.protocol.startsWith('http')) {
          fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sender: this.recipientName,
              content: msg,
              time: new Date().toISOString()
            })
          }).then(res => res.json()).then(() => {
            replyFeedback.textContent = "Lời nhắn của Trân đã được gửi tận tay tớ rồi! Cảm ơn cậu nhiều lắm ♡";
            replyInput.value = '';
            audioPlayer.playChime();
            spawnFloatingHearts(window.innerWidth / 2, window.innerHeight / 2, 12);
          }).catch(saveLocally);
        } else {
          saveLocally();
        }
      });
    }
  }
}
