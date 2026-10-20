/**
 * SCRIPT TỰ ĐỘNG DEPLOY LÊN GITHUB & SAO LƯU LÊN GOOGLE DRIVE
 * - GitHub Repo: https://github.com/taogay2k-creator/20th10
 * - Google Drive: taogay2k@gmail.com
 * - Email thông báo: namho03052ki9@gmail.com
 */

const { execSync } = require('child_process');
const path = require('path');
const { createZipBackup } = require('./backup_drive');
const emailNotifier = require('../services/emailNotifier');
require('dotenv').config();

const ROOT_DIR = path.join(__dirname, '..');
const REPO_URL = 'https://github.com/taogay2k-creator/20th10.git';

async function runDeploy(customCommitMsg) {
  console.log(`\n======================================================`);
  console.log(`🚀 BẮT ĐẦU QUY TRÌNH DEPLOY VÀ BACKUP HỘP QUÀ 20/10`);
  console.log(`👉 GitHub: https://github.com/taogay2k-creator/20th10`);
  console.log(`👉 Backup Drive: taogay2k@gmail.com`);
  console.log(`👉 Thông báo: namho03052ki9@gmail.com`);
  console.log(`======================================================\n`);

  // 1. Kiểm tra & Chuẩn bị Git Commit
  let commitCreated = false;
  try {
    const status = execSync('git status --porcelain', { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
    if (status) {
      console.log('📌 Phát hiện thay đổi trong mã nguồn, đang tạo commit...');
      execSync('git add -A', { cwd: ROOT_DIR, stdio: 'pipe' });
      const commitMsg = customCommitMsg || `feat: Cập nhật web 20/10 cho Huyền Trân [${new Date().toLocaleString('vi-VN')}]`;
      execSync(`git commit -m "${commitMsg}"`, { cwd: ROOT_DIR, stdio: 'inherit' });
      commitCreated = true;
    } else {
      console.log('ℹ️ Không có thay đổi mới cần commit.');
    }
  } catch (err) {
    console.warn('⚠️ Ghi chú commit:', err.message);
  }

  // 2. Push lên GitHub Repo
  let pushSuccess = false;
  console.log('\n📤 Đang đẩy mã nguồn lên GitHub (https://github.com/taogay2k-creator/20th10)...');

  // Kiểm tra nếu có token trong .env để push trực tiếp
  const ghToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (ghToken) {
    try {
      const authUrl = `https://${ghToken.trim()}@github.com/taogay2k-creator/20th10.git`;
      execSync(`git push "${authUrl}" main:main --force`, { cwd: ROOT_DIR, stdio: 'inherit' });
      pushSuccess = true;
      console.log('✅ Đã deploy lên GitHub thành công qua token cá nhân!');
    } catch (e) {
      console.error('❌ Lỗi khi push qua GITHUB_TOKEN:', e.message);
    }
  }

  if (!pushSuccess) {
    try {
      execSync('git push -u origin main', { cwd: ROOT_DIR, stdio: 'inherit' });
      pushSuccess = true;
      console.log('✅ Đã deploy lên GitHub thành công!');
    } catch (err) {
      console.error('\n⚠️ CHÚ Ý VỀ QUYỀN PUSH GITHUB:');
      console.error('Tài khoản Git hiện tại trong máy là namhone, nhưng repo thuộc taogay2k-creator.');
      console.error('Để tự động push trơn tru 100%, bạn có thể:');
      console.error('1. Thêm "namhone" làm Collaborator tại: https://github.com/taogay2k-creator/20th10/settings/access');
      console.error('   HOẶC');
      console.error('2. Tạo Personal Access Token (classic hoặc fine-grained với quyền repo) tại https://github.com/settings/tokens rồi điền GITHUB_TOKEN=ghp_xxx vào file .env');
    }
  }

  // 3. Thực hiện tạo gói Backup Zip và đồng bộ Google Drive
  console.log('\n📦 Đang tạo gói Backup và chuẩn bị gửi lên Google Drive...');
  const backupResult = await createZipBackup();

  // 4. Gửi email thông báo tình trạng Deploy & Backup đến namho03052ki9@gmail.com
  const statusMsg = `
    Quy trình Deploy & Backup hộp quà 20/10 vừa hoàn tất:
    - Trạng thái GitHub: ${pushSuccess ? '✅ Đã cập nhật lên repo https://github.com/taogay2k-creator/20th10' : '⚠️ Cần xác thực quyền push của taogay2k-creator (xem hướng dẫn trong log)'}
    - Trạng thái Backup: ✅ File nén ${backupResult.fileName || 'backup.zip'} (${backupResult.sizeKB || 0} KB) đã được lưu vào thư mục backups/
    - Tài khoản Google Drive: taogay2k@gmail.com
    - Thời gian: ${new Date().toLocaleString('vi-VN')}
  `;

  try {
    await emailNotifier.sendNotificationEmail(
      `🚀 [Deploy & Backup] Hoàn tất cập nhật web 20/10 cho Huyền Trân`,
      `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #FF6B8B; border-radius: 16px; background-color: #FFFDF9;">
          <h2 style="color: #E01E5A; margin-top: 0;">🚀 Thông Báo Deploy & Backup Tự Động</h2>
          <p>Chào bạn Nam, hệ thống vừa thực hiện xong chu kỳ deploy và sao lưu cho web 20/10 của <strong>Trần Thị Huyền Trân</strong>:</p>
          <ul style="background: white; border: 1px solid #FFCCD7; padding: 15px 20px 15px 35px; border-radius: 10px;">
            <li><strong>GitHub Repo:</strong> <a href="https://github.com/taogay2k-creator/20th10">https://github.com/taogay2k-creator/20th10</a> (${pushSuccess ? 'Thành công' : 'Đang chờ cấp token'})</li>
            <li><strong>File Backup:</strong> <code>${backupResult.fileName || 'backup.zip'}</code> (${backupResult.sizeKB || 0} KB)</li>
            <li><strong>Drive Đích:</strong> taogay2k@gmail.com</li>
            <li><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</li>
          </ul>
          <p style="color: #8C8282; font-size: 13px;">Chúc bạn và bạn Huyền Trân có một ngày 20/10 thật tuyệt vời! ♡</p>
        </div>
      `,
      statusMsg
    );
  } catch (e) {}

  console.log(`\n======================================================`);
  console.log(`🎉 QUY TRÌNH DEPLOY & BACKUP ĐÃ HOÀN TẤT!`);
  console.log(`======================================================\n`);
}

if (require.main === module) {
  runDeploy();
}

module.exports = { runDeploy };
