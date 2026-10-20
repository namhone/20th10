/**
 * SCRIPT TỰ ĐỘNG SAO LƯU (BACKUP) TOÀN BỘ WEB LÊN GOOGLE DRIVE
 * Tài khoản đích: taogay2k@gmail.com
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

const ROOT_DIR = path.join(__dirname, '..');
const BACKUPS_DIR = path.join(ROOT_DIR, 'backups');
const BACKUPS_META_FILE = path.join(ROOT_DIR, 'data', 'backups.json');

// Đảm bảo thư mục backups tồn tại
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

function getFormattedTimestamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
}

async function createZipBackup() {
  const ts = getFormattedTimestamp();
  const zipFileName = `backup_20th10_HuyenTran_${ts}.zip`;
  const zipFilePath = path.join(BACKUPS_DIR, zipFileName);

  console.log(`\n======================================================`);
  console.log(`📦 BẮT ĐẦU ĐÓNG GÓI BACKUP: ${zipFileName}`);
  console.log(`======================================================`);

  // Danh sách các mục cần nén
  const itemsToInclude = [
    '20.10.html',
    'index.html',
    'server.js',
    'package.json',
    'package-lock.json',
    '.gitignore',
    '.env.example',
    'css',
    'js',
    'data',
    'services',
    'scripts'
  ];

  const existingItems = itemsToInclude
    .filter(item => fs.existsSync(path.join(ROOT_DIR, item)))
    .map(item => `'${item}'`)
    .join(', ');

  const relativeZipPath = `.\\backups\\${zipFileName}`;
  const psCmd = `Compress-Archive -Path ${existingItems} -DestinationPath '${relativeZipPath}' -Force`;

  try {
    execSync(`powershell.exe -NoProfile -Command "${psCmd}"`, {
      cwd: ROOT_DIR,
      stdio: 'pipe'
    });

    const stats = fs.statSync(zipFilePath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`✅ Đã tạo file nén backup thành công: ${zipFileName} (${sizeKB} KB)`);

    // Lưu metadata vào data/backups.json
    let meta = [];
    if (fs.existsSync(BACKUPS_META_FILE)) {
      try {
        meta = JSON.parse(fs.readFileSync(BACKUPS_META_FILE, 'utf8'));
      } catch (e) {}
    }

    const record = {
      filename: zipFileName,
      size: `${sizeKB} KB`,
      createdAt: new Date().toISOString(),
      targetDriveUser: 'taogay2k@gmail.com',
      uploadedToCloud: false
    };

    // Kiểm tra xem có cấu hình Google Drive API hoặc rclone không
    const uploadResult = await uploadToGoogleDrive(zipFilePath, zipFileName);
    if (uploadResult && uploadResult.success) {
      record.uploadedToCloud = true;
      record.cloudId = uploadResult.id || '';
    }

    meta.unshift(record);
    fs.writeFileSync(BACKUPS_META_FILE, JSON.stringify(meta, null, 2), 'utf8');

    return { success: true, filePath: zipFilePath, fileName: zipFileName, sizeKB };
  } catch (err) {
    console.error('❌ Lỗi tạo file nén backup:', err.message);
    return { success: false, error: err.message };
  }
}

async function uploadToGoogleDrive(filePath, fileName) {
  console.log(`\n☁️ Đang chuẩn bị đồng bộ lên Google Drive của taogay2k@gmail.com...`);
  
  // 1. Kiểm tra nếu có rclone cấu hình remote 'gdrive'
  try {
    const rcloneCheck = execSync('rclone listremotes', { stdio: 'pipe', encoding: 'utf8' });
    if (rcloneCheck.includes('gdrive:') || rcloneCheck.includes('drive:')) {
      const remote = rcloneCheck.includes('gdrive:') ? 'gdrive:' : 'drive:';
      console.log(`Đang tải file ${fileName} lên ${remote}/Backups_20th10...`);
      execSync(`rclone copy "${filePath}" "${remote}/Backups_20th10"`, { stdio: 'inherit' });
      console.log(`✅ Đã tải file backup lên Google Drive qua rclone thành công!`);
      return { success: true };
    }
  } catch (e) {
    // rclone chưa có, tiếp tục fallback
  }

  // 2. Fallback ghi nhận
  console.log(`📁 File backup đã được lưu trữ an toàn tại: ${filePath}`);
  console.log(`ℹ️ Để tự động upload qua Cloud API lên taogay2k@gmail.com, bạn có thể cấp quyền qua OAuth hoặc Google Drive CLI.`);
  return { success: false, reason: 'Pending drive auth' };
}

// Chạy trực tiếp
if (require.main === module) {
  createZipBackup();
}

module.exports = {
  createZipBackup,
  uploadToGoogleDrive
};
