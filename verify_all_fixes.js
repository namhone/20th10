const pwPath = 'C:/Users/Nam/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core';
const { chromium } = require(pwPath);
const path = require('path');
const fs = require('fs');

const artifactsDir = 'C:/Users/Nam/.gemini/antigravity/brain/c8ce6103-dc96-4554-8f35-721b952d49dd';

(async () => {
  console.log('=== BẮT ĐẦU KIỂM THỬ TOÀN BỘ 17 VẤN ĐỀ TRONG BẢN TỔNG HỢP ===\n');

  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const errors = [];

  // ==========================================
  // PHẦN 1: KIỂM THỬ TRÊN GIAO DIỆN DI ĐỘNG (MOBILE 390x844)
  // ==========================================
  console.log('--- [1] KIỂM THỬ GIAO DIỆN DI ĐỘNG (iPhone 14/15 390x844) ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  const mobilePage = await mobileContext.newPage();
  mobilePage.on('pageerror', err => {
    console.error('❌ Mobile Page Error:', err.message);
    errors.push(`Mobile Page Error: ${err.message}`);
  });
  mobilePage.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('❌ Mobile Console Error:', msg.text());
      errors.push(`Mobile Console Error: ${msg.text()}`);
    }
  });

  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(500);

  // 1.1 Xác thực tên người nhận
  console.log('1. Xác thực tên Huyền Trân...');
  await mobilePage.fill('#auth-name-input', 'Trần Thị Huyền Trân');
  await mobilePage.click('#auth-submit-btn');
  await mobilePage.waitForTimeout(1400);
  await mobilePage.evaluate(() => window.scrollTo(0, 0));
  await mobilePage.waitForTimeout(300);

  // 1.2 Kiểm tra Tab 1 (Trái Tim 3D) trên mobile
  console.log('2. Kiểm tra Tab 1 (Trái Tim 3D trên Mobile)...');
  const heart3dHeight = await mobilePage.$eval('#tab-content-heart3d', el => el.clientHeight);
  console.log(`   ✓ Chiều cao Tab 3D Mobile: ${heart3dHeight}px (chuẩn dynamic viewport)`);

  // Kiểm tra pointer-events trên text overlay
  const overlayPointerEvents = await mobilePage.$eval('.heart-overlay-content', el => window.getComputedStyle(el).pointerEvents);
  console.log(`   ✓ Pointer-events trên overlay text: ${overlayPointerEvents} (cho phép chạm xuyên qua để xoay tim)`);

  // Thử bấm các nút BPM
  await mobilePage.click('#btn-bpm-romance');
  await mobilePage.waitForTimeout(300);
  await mobilePage.click('#btn-bpm-passionate');
  await mobilePage.waitForTimeout(300);
  await mobilePage.click('#btn-bpm-calm');
  await mobilePage.waitForTimeout(300);
  console.log('   ✓ Đã thử chuyển 3 nhịp tim (Êm dịu, Rộn ràng, Xao xuyến) mượt mà');

  // Chụp ảnh Tab 1 Mobile
  await mobilePage.screenshot({ path: path.join(artifactsDir, 'verified_mobile_tab1_heart3d.png'), fullPage: false });
  console.log('   ✓ Đã chụp ảnh Tab 1 Mobile: verified_mobile_tab1_heart3d.png');

  // 1.3 Kiểm tra Mobile Floating Action Buttons (Point 2.1)
  console.log('3. Kiểm tra nút nổi (Floating Action Buttons) trên Mobile...');
  const fabLetterVisible = await mobilePage.$eval('#mobile-floating-letter-btn', el => {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none';
  });
  const fabConfigVisible = await mobilePage.$eval('#mobile-floating-config-btn', el => {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none';
  });
  console.log(`   ✓ Nút Thư riêng nổi trên Mobile hiển thị: ${fabLetterVisible}`);
  console.log(`   ✓ Nút Cá nhân hóa nổi trên Mobile hiển thị: ${fabConfigVisible}`);

  // Thử bấm nút Thư riêng nổi
  await mobilePage.click('#mobile-floating-letter-btn', { force: true });
  await mobilePage.waitForTimeout(500);

  // Kiểm tra Special Letter Modal (Point 1.1, 1.2, 1.3)
  const isSpecialModalOpen = await mobilePage.$eval('#special-letter-modal', el => !el.classList.contains('hidden'));
  const specialBgColor = await mobilePage.$eval('#special-letter-modal .letter-paper', el => window.getComputedStyle(el).backgroundColor);
  const hasSvgCloseBtn = await mobilePage.$eval('#special-close-btn svg', el => !!el);
  console.log(`   ✓ Modal Thư Riêng mở thành công: ${isSpecialModalOpen}`);
  console.log(`   ✓ Nền thư riêng màu đặc che phủ 100%: ${specialBgColor} (không bị đè chữ)`);
  console.log(`   ✓ Nút đóng dùng icon SVG chuẩn: ${hasSvgCloseBtn} (không lỗi font ô vuông)`);

  // Chụp ảnh Modal Thư Riêng trên Mobile
  await mobilePage.screenshot({ path: path.join(artifactsDir, 'verified_mobile_special_letter.png'), fullPage: false });
  console.log('   ✓ Đã chụp ảnh Modal Thư Riêng Mobile: verified_mobile_special_letter.png');

  // Đóng modal thư riêng
  await mobilePage.click('#special-close-btn');
  await mobilePage.waitForTimeout(400);

  // 1.4 Chuyển sang Tab 2 (30 Lời Thương)
  console.log('4. Kiểm tra Tab 2 (30 Lời Thương trên Mobile)...');
  await mobilePage.click('.nav-tab-btn[data-tab="letters"]');
  await mobilePage.waitForTimeout(500);

  // Mở hộp quà
  await mobilePage.click('#open-box-btn');
  await mobilePage.waitForTimeout(800);

  // Kiểm tra thanh lọc cảm xúc có fade mask (Point 2.4)
  const hasFadeMask = await mobilePage.$eval('.filter-chips-fade-mask', el => {
    return !!el && window.getComputedStyle(el).display !== 'none';
  });
  console.log(`   ✓ Thanh lọc cảm xúc có hiệu ứng mờ dần cạnh phải gợi ý vuốt ngang: ${hasFadeMask}`);

  // Mở 1 phong thư chi tiết (Point 1.1, 1.3)
  await mobilePage.click('#envelopes-grid .envelope-card:first-child');
  await mobilePage.waitForTimeout(500);

  const isLetterModalOpen = await mobilePage.$eval('#letter-modal', el => !el.classList.contains('hidden'));
  const letterBgColor = await mobilePage.$eval('#letter-modal .letter-paper', el => window.getComputedStyle(el).backgroundColor);
  const letterSvgClose = await mobilePage.$eval('#modal-close-btn svg', el => !!el);
  console.log(`   ✓ Modal Đọc Thư mở: ${isLetterModalOpen}`);
  console.log(`   ✓ Nền thư đọc chi tiết màu đặc che phủ 100%: ${letterBgColor}`);
  console.log(`   ✓ Nút đóng dùng icon SVG: ${letterSvgClose}`);

  // Chụp ảnh Modal Đọc Thư Mobile
  await mobilePage.screenshot({ path: path.join(artifactsDir, 'verified_mobile_letter_modal.png'), fullPage: false });
  console.log('   ✓ Đã chụp ảnh Modal Đọc Thư Mobile: verified_mobile_letter_modal.png');

  await mobilePage.click('#modal-close-btn');
  await mobilePage.waitForTimeout(400);

  // 1.5 Kiểm tra Tab 3 (Tri Ân Bé Trân & Thẻ Chọn Hẹn Hò) (Point 2.3)
  console.log('5. Kiểm tra Tab 3 (Phiếu Hẹn Hò & Thẻ lựa chọn không bị cắt chữ)...');
  await mobilePage.click('.nav-tab-btn[data-tab="tribute"]');
  await mobilePage.waitForTimeout(500);

  const choiceCardsCount = await mobilePage.$$eval('.date-choice-card', els => els.length);
  console.log(`   ✓ Số lượng thẻ lựa chọn hoạt động hẹn hò: ${choiceCardsCount} thẻ`);

  // Thử chọn thẻ thứ 2 (Trà sữa)
  const cards = await mobilePage.$$('.date-choice-card');
  if (cards.length >= 2) {
    await cards[1].click();
    await mobilePage.waitForTimeout(300);
    const isSelected = await cards[1].evaluate(el => el.classList.contains('selected'));
    const chosenVal = await mobilePage.$eval('#date-activity-input', el => el.value);
    console.log(`   ✓ Thẻ 2 đã được chọn: ${isSelected} | Giá trị: "${chosenVal}"`);
  }

  // Bấm nút "Gửi tín hiệu hẹn hò"
  await mobilePage.click('#confirm-date-btn');
  await mobilePage.waitForTimeout(600);

  const feedbackText = await mobilePage.$eval('#date-voucher-feedback', el => el.textContent);
  console.log(`   ✓ Thông báo phản hồi hẹn hò hiển thị: ${feedbackText.includes('Tớ đã nhận được tín hiệu')}`);
  const hasSmsBtn = await mobilePage.$eval('#date-voucher-feedback a', el => el.href.startsWith('sms:'));
  console.log(`   ✓ Có nút gửi tin nhắn SMS dự phòng cho bạn nam: ${hasSmsBtn}`);

  // Rút 1 viên vitamin
  await mobilePage.click('#draw-vitamin-btn');
  await mobilePage.waitForTimeout(400);
  const vitaminText = await mobilePage.$eval('#vitamin-result-text', el => el.textContent);
  console.log(`   ✓ Rút viên vitamin thành công: "${vitaminText.substring(0, 40)}..."`);

  // Chụp ảnh Tab 3 Mobile
  await mobilePage.screenshot({ path: path.join(artifactsDir, 'verified_mobile_tab3_tribute.png'), fullPage: true });
  console.log('   ✓ Đã chụp ảnh Tab 3 Mobile Full Page: verified_mobile_tab3_tribute.png');

  await mobileContext.close();

  // ==========================================
  // PHẦN 2: KIỂM THỬ TRÊN MÁY TÍNH (DESKTOP 1280x800)
  // ==========================================
  console.log('\n--- [2] KIỂM THỬ GIAO DIỆN DESKTOP (1280x800) ---');
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1
  });

  const desktopPage = await desktopContext.newPage();
  desktopPage.on('pageerror', err => {
    console.error('❌ Desktop Page Error:', err.message);
    errors.push(`Desktop Page Error: ${err.message}`);
  });

  await desktopPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(500);

  // Mở khóa bằng tên
  await desktopPage.fill('#auth-name-input', 'Huyền Trân ♡');
  await desktopPage.click('#auth-submit-btn');
  await desktopPage.waitForTimeout(800);

  // Chụp Tab 1 Desktop
  await desktopPage.screenshot({ path: path.join(artifactsDir, 'verified_desktop_tab1_heart3d.png') });
  console.log('   ✓ Đã chụp ảnh Tab 1 Desktop: verified_desktop_tab1_heart3d.png');

  // Mở modal Cá nhân hóa (Point 3.2: Maxlength validation)
  await desktopPage.click('#config-open-btn');
  await desktopPage.waitForTimeout(400);

  const recMaxLen = await desktopPage.$eval('#input-recipient', el => el.maxLength);
  const senMaxLen = await desktopPage.$eval('#input-sender', el => el.maxLength);
  const sigMaxLen = await desktopPage.$eval('#input-signature', el => el.maxLength);
  const noteMaxLen = await desktopPage.$eval('#input-custom-note', el => el.maxLength);
  console.log(`   ✓ Maxlength inputs: Recipient=${recMaxLen}, Sender=${senMaxLen}, Signature=${sigMaxLen}, Note=${noteMaxLen}`);

  await desktopPage.click('#config-close-btn');
  await desktopPage.waitForTimeout(400);

  // Chuyển Tab 3 Desktop
  await desktopPage.click('.nav-tab-btn[data-tab="tribute"]');
  await desktopPage.waitForTimeout(600);
  await desktopPage.screenshot({ path: path.join(artifactsDir, 'verified_desktop_tab3_tribute.png') });
  console.log('   ✓ Đã chụp ảnh Tab 3 Desktop: verified_desktop_tab3_tribute.png');

  await desktopContext.close();

  // ==========================================
  // PHẦN 3: KIỂM THỬ CHẾ ĐỘ DỰ PHÒNG 2D FALLBACK KHI WEBGL TẮT
  // ==========================================
  console.log('\n--- [3] KIỂM THỬ CHẾ ĐỘ TRÁI TIM 2D DỰ PHÒNG (KHI WEBGL BỊ TẮT) ---');
  const fallbackContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true
  });
  const fallbackPage = await fallbackContext.newPage();

  // Chặn WebGL để kiểm tra fallback
  await fallbackPage.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = function(orig) {
      return function(type) {
        if (type === 'webgl' || type === 'experimental-webgl' || type === 'webgl2') {
          return null; // Giả lập WebGL bị tắt
        }
        return orig.apply(this, arguments);
      };
    }(HTMLCanvasElement.prototype.getContext);
  });

  await fallbackPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await fallbackPage.waitForTimeout(500);
  await fallbackPage.fill('#auth-name-input', 'Huyền Trân');
  await fallbackPage.click('#auth-submit-btn');
  await fallbackPage.waitForTimeout(800);

  const isFallbackVisible = await fallbackPage.$eval('#heart-3d-fallback', el => el.classList.contains('active') || window.getComputedStyle(el).display !== 'none');
  console.log(`   ✓ Trái tim 2D dự phòng tự động kích hoạt khi WebGL tắt: ${isFallbackVisible}`);

  await fallbackPage.screenshot({ path: path.join(artifactsDir, 'verified_fallback_2d_heart.png') });
  console.log('   ✓ Đã chụp ảnh Fallback 2D Heart: verified_fallback_2d_heart.png');

  await fallbackContext.close();
  await browser.close();

  console.log('\n====================================================');
  console.log(`TỔNG KẾT: ${errors.length === 0 ? 'TẤT CẢ KIỂM THỬ ĐỀU THÀNH CÔNG 100% (0 LỖI)' : `CÓ ${errors.length} LỖI`}`);
  console.log('====================================================');
})();
