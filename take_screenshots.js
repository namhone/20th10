const pwPath = 'C:/Users/Nam/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core';
const { chromium } = require(pwPath);
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Nam/.gemini/antigravity/brain/df48d387-be2e-45bf-b05a-119fbd32b5a9';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto('http://localhost:3000');

  // Đăng nhập tên 'Huyền Trân'
  await page.fill('#auth-name-input', 'Huyền Trân');
  await page.click('#auth-submit-btn');
  await page.waitForTimeout(1000);

  // 1. Chụp Tab 1: Trái Tim 3D
  await page.waitForTimeout(1500); // chờ Three.js render mượt mà
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'tab1_heart3d.png') });
  console.log('Saved tab1_heart3d.png');

  // 2. Chụp Tab 2: Hộp quà & 30 Phong Thư
  await page.click('.nav-tab-btn[data-tab="letters"]');
  await page.waitForTimeout(600);
  await page.click('#open-box-btn');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'tab2_letters.png') });
  console.log('Saved tab2_letters.png');

  // 3. Chụp Tab 3: Tri Ân Dành Cho Huyền Trân
  await page.click('.nav-tab-btn[data-tab="tribute"]');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'tab3_tribute.png') });
  console.log('Saved tab3_tribute.png');

  await browser.close();
  console.log('Done taking all screenshots!');
})();
