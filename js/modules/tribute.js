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
      const raw = localStorage.getItem('hopqua_date_voucher');
      if (raw) {
        const data = JSON.parse(raw);
        if (data && data.activity) {
          const dateSelect = document.getElementById('date-activity-select');
          if (dateSelect) dateSelect.value = data.activity;
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
    if (!dateVoucherBtn || !dateFeedback) return;

    dateVoucherBtn.disabled = true;
    dateVoucherBtn.innerHTML = `<span>Đã gửi tín hiệu hẹn hò... ♡</span>`;

    dateFeedback.innerHTML = `
      <div class="bg-brand-50 border border-brand-200 rounded-2xl p-4 text-center mt-3 text-xs sm:text-sm text-brand-800 font-medium">
        💌 <strong>Tớ đã nhận được tín hiệu của ${this.recipientName} rồi nè!</strong><br>
        Hẹn cậu một ngày sớm nhất: <em>"${activity}"</em> nhé. Tớ nhất định sẽ chuẩn bị thật chu đáo! ♡
        <div class="mt-2.5">
          <button id="re-select-date-btn" class="px-3 py-1 rounded-full bg-white hover:bg-brand-100 text-brand-600 border border-brand-200 text-xs font-semibold transition-colors">
            🔄 Chọn lại hoạt động khác
          </button>
        </div>
      </div>
    `;

    document.getElementById('re-select-date-btn')?.addEventListener('click', () => {
      try {
        localStorage.removeItem('hopqua_date_voucher');
      } catch (e) {}
      dateVoucherBtn.disabled = false;
      dateVoucherBtn.innerHTML = `<span>Gửi lại tín hiệu 💖</span>`;
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

    // 2. Xác nhận Vé Hẹn Hò (Date Voucher)
    const dateVoucherBtn = document.getElementById('confirm-date-btn');
    const dateSelect = document.getElementById('date-activity-select');

    if (dateVoucherBtn && dateSelect) {
      dateVoucherBtn.addEventListener('click', () => {
        const chosenActivity = dateSelect.value;

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

        try {
          localStorage.setItem('hopqua_date_voucher', JSON.stringify({
            recipient: this.recipientName,
            activity: chosenActivity,
            timestamp: new Date().toISOString()
          }));
        } catch (e) {}

        this.renderConfirmedVoucher(chosenActivity, true);

        // Gửi lên backend nếu có server
        if (window.location.protocol.startsWith('http')) {
          try {
            fetch('/api/date-voucher', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipient: this.recipientName,
                activity: chosenActivity,
                timestamp: new Date().toISOString()
              })
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
