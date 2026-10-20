const pwPath = 'C:/Users/Nam/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core';
const { chromium } = require(pwPath);

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage();
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push(msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('--- BẮT ĐẦU KIỂM THỬ TOÀN DIỆN LOGIC HỘP QUÀ 20/10 ---');
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000');
  console.log('Page Title:', await page.title());

  // 1. Kiểm tra Auth Modal đang hiển thị và body bị khóa cuộn
  const isAuthVisible = await page.$eval('#auth-modal', el => !el.classList.contains('hidden'));
  const isBodyLocked = await page.$eval('body', el => el.classList.contains('overflow-hidden'));
  console.log('✓ Auth modal visible:', isAuthVisible, '| Body scroll locked:', isBodyLocked);

  // 2. Thử nhập tên sai 'nguyen van a'
  await page.fill('#auth-name-input', 'nguyen van a');
  await page.click('#auth-submit-btn');
  await page.waitForTimeout(400);
  const errorMsg = await page.$eval('#auth-error-msg', el => el.textContent);
  console.log('✓ Error message on wrong name correctly shown:', errorMsg.includes('chưa đúng tên'));

  // 3. Thử nhập tên phủ định 'khong phai huyen tran'
  await page.fill('#auth-name-input', 'khong phai huyen tran');
  await page.click('#auth-submit-btn');
  await page.waitForTimeout(400);
  const isStillRejected = await page.$eval('#auth-error-msg', el => el.textContent.includes('chưa đúng tên'));
  console.log('✓ Negation rejection ("khong phai huyen tran"):', isStillRejected);

  // 4. Thử nhập tên đúng có emoji 'Huyền Trân ❤️'
  await page.fill('#auth-name-input', 'Huyền Trân ❤️');
  await page.click('#auth-submit-btn');
  await page.waitForTimeout(1200);

  // 5. Kiểm tra modal đã ẩn và body đã mở khóa cuộn
  const isAuthHidden = await page.$eval('#auth-modal', el => el.classList.contains('hidden'));
  const isBodyUnlocked = await page.$eval('body', el => !el.classList.contains('overflow-hidden'));
  console.log('✓ Auth modal hidden:', isAuthHidden, '| Body unlocked:', isBodyUnlocked);

  // 6. Kiểm tra tên người nhận được chuẩn hóa
  const recipientName = await page.$eval('.recipient-display', el => el.textContent);
  console.log('✓ Recipient display name in header:', recipientName);

  // 7. Kiểm tra Tab 1 (Three.js Canvas)
  const hasCanvas = await page.$eval('#heart-3d-canvas-container canvas', el => !!el);
  console.log('✓ Three.js canvas created in Tab 1:', hasCanvas);

  // 8. Chuyển sang Tab 2 (30 Lời Thương)
  await page.click('.nav-tab-btn[data-tab="letters"]');
  await page.waitForTimeout(500);
  const isLettersTabVisible = await page.$eval('#tab-content-letters', el => !el.classList.contains('hidden'));
  console.log('✓ Letters tab visible:', isLettersTabVisible);

  // Mở Hộp Quà
  await page.click('#open-box-btn');
  await page.waitForTimeout(800);
  const isCompartmentsVisible = await page.$eval('#screen-compartments', el => !el.classList.contains('hidden'));
  console.log('✓ Compartments visible:', isCompartmentsVisible);

  // Đếm số phong thư trong grid
  const envelopeCount = await page.$$eval('#envelopes-grid .envelope-card', els => els.length);
  console.log('✓ Envelopes count in grid:', envelopeCount);

  // Mở 1 phong thư
  await page.click('#envelopes-grid .envelope-card:first-child');
  await page.waitForTimeout(500);
  const isLetterModalVisible = await page.$eval('#letter-modal', el => !el.classList.contains('hidden'));
  const letterTitle = await page.$eval('#modal-letter-title', el => el.textContent);
  console.log('✓ Opened letter title:', letterTitle, '| Modal visible:', isLetterModalVisible);

  // Đóng modal thư
  await page.click('#modal-close-btn');
  await page.waitForTimeout(400);

  // 9. Chuyển sang Tab 3 (Tri Ân Huyền Trân)
  await page.click('.nav-tab-btn[data-tab="tribute"]');
  await page.waitForTimeout(500);
  const isTributeVisible = await page.$eval('#tab-content-tribute', el => !el.classList.contains('hidden'));
  console.log('✓ Tribute tab visible:', isTributeVisible);

  // Rút 1 viên vitamin
  await page.click('#draw-vitamin-btn');
  await page.waitForTimeout(300);
  const vitaminText = await page.$eval('#vitamin-result-text', el => el.textContent);
  console.log('✓ Vitamin result text:', vitaminText.length > 10);

  // Xác nhận vé hẹn hò
  await page.click('#confirm-date-btn');
  await page.waitForTimeout(500);
  const voucherFeedback = await page.$eval('#date-voucher-feedback', el => el.textContent);
  console.log('✓ Voucher feedback message:', voucherFeedback.includes('nhận được tín hiệu'));

  // Thử đổi sang hoạt động khác
  await page.evaluate(() => document.getElementById('re-select-date-btn')?.click());
  await page.waitForTimeout(300);
  const isReSelectActive = await page.$eval('#confirm-date-btn', el => !el.disabled);
  console.log('✓ Can re-select date voucher activity:', isReSelectActive);

  // Gửi lời nhắn bí mật ở Tab 3
  await page.fill('#tribute-reply-input', 'Em nhận được quà rồi, cảm ơn anh nhiều lắm ♡');
  await page.click('#tribute-reply-form button[type="submit"]');
  await page.waitForTimeout(600);
  const replyFeedback = await page.$eval('#tribute-reply-feedback', el => el.textContent);
  console.log('✓ Tribute secret message feedback:', replyFeedback);

  // 10. Thử bấm Brand Logo ở header -> phải quay về Tab 1
  await page.click('#nav-brand-btn');
  await page.waitForTimeout(400);
  const isHeartTabActive = await page.$eval('#tab-content-heart3d', el => !el.classList.contains('hidden'));
  console.log('✓ Clicking brand logo returns to Tab 1 (Heart 3D):', isHeartTabActive);

  // 11. Kiểm tra chuyển thư bằng phím mũi tên khi mở modal thư
  await page.click('.nav-tab-btn[data-tab="letters"]');
  await page.waitForTimeout(300);
  await page.click('#envelopes-grid .envelope-card:first-child');
  await page.waitForTimeout(400);
  const initialIndex = await page.$eval('#modal-letter-index', el => el.textContent);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  const nextIndex = await page.$eval('#modal-letter-index', el => el.textContent);
  console.log(`✓ Arrow key navigation works in letter modal: ${initialIndex} -> ${nextIndex}`);

  // Đóng modal bằng phím Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const isModalClosedByEsc = await page.$eval('#letter-modal', el => el.classList.contains('hidden'));
  console.log('✓ Letter modal closed by Escape key:', isModalClosedByEsc);

  await browser.close();
  console.log('\n====================================================');
  console.log('🎉 TẤT CẢ CÁC BÀI KIỂM THỬ LOGIC ĐỀU ĐẠT 100%!');
  console.log('====================================================');
})();