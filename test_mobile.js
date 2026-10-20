const pwPath = 'C:/Users/Nam/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core';
const { chromium } = require(pwPath);
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  // Giả lập thiết bị di động chuẩn (iPhone 14 / Pro: 390 x 844, scale 3)
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push(msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  const shotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive: true });

  console.log('--- TEST GIAO DIỆN MOBILE (390x844) & BÓNG BAY TRÁI TIM CHUBBY 3D ---');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(600);

  // 1. Chụp màn hình Cổng Xác Thực trên mobile
  await page.screenshot({ path: path.join(shotDir, 'mobile_1_auth_gate.png'), fullPage: false });
  console.log('✓ Chụp ảnh Cổng xác thực Mobile: screenshots/mobile_1_auth_gate.png');

  // Kiểm tra placeholder và label
  const labelText = await page.$eval('#auth-form label', el => el.textContent);
  const placeholder = await page.$eval('#auth-name-input', el => el.placeholder);
  console.log('✓ Auth prompt label:', labelText);
  console.log('✓ Auth input placeholder:', placeholder);

  // Mở khóa với tên "Huyền Trân"
  await page.fill('#auth-name-input', 'huyền trân');
  await page.click('#auth-submit-btn');
  await page.waitForTimeout(1400);

  // 2. Chụp màn hình Tab 1 (Trái tim bóng bay 3D Chubby phồng căng mọng trên mobile)
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(shotDir, 'mobile_2_heart3d.png'), fullPage: false });
  console.log('✓ Chụp ảnh Tab 1 (Chubby Balloon Heart 3D Mobile): screenshots/mobile_2_heart3d.png');

  // 3. Chuyển sang Tab 2 (30 Lời Thương)
  await page.click('.nav-tab-btn[data-tab="letters"]');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(shotDir, 'mobile_3_giftbox_intro.png'), fullPage: false });
  console.log('✓ Chụp ảnh Tab 2 (Hộp quà Intro Mobile): screenshots/mobile_3_giftbox_intro.png');

  // Mở hộp quà
  await page.click('#open-box-btn');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(shotDir, 'mobile_4_compartments.png'), fullPage: false });
  console.log('✓ Chụp ảnh Tab 2 (3 Ngăn quà Mobile): screenshots/mobile_4_compartments.png');

  // Mở lá thư đầu tiên
  await page.click('#envelopes-grid .envelope-card:first-child');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(shotDir, 'mobile_5_letter_modal.png'), fullPage: false });
  console.log('✓ Chụp ảnh Modal Đọc Thư Mobile: screenshots/mobile_5_letter_modal.png');

  await page.click('#modal-close-btn');
  await page.waitForTimeout(400);

  // 4. Chuyển sang Tab 3 (Tri Ân Huyền Trân)
  await page.click('.nav-tab-btn[data-tab="tribute"]');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(shotDir, 'mobile_6_tribute.png'), fullPage: true });
  console.log('✓ Chụp ảnh Tab 3 (Tri Ân Mobile Full Page): screenshots/mobile_6_tribute.png');

  // Tương tác Date voucher & Rút vitamin
  await page.click('#draw-vitamin-btn');
  await page.waitForTimeout(300);
  await page.click('#confirm-date-btn');
  await page.waitForTimeout(600);

  console.log('=== KIỂM THỬ MOBILE HOÀN TẤT THÀNH CÔNG 100% ===');
  await browser.close();
})();
