/**
 * BACKEND SERVER CHO HỘP QUÀ 20/10 — TRẦN THỊ HUYỀN TRÂN
 * Chức năng:
 * 1. Phục vụ static frontend (HTML, CSS, JS, Modules)
 * 2. API xác thực tên người nhận
 * 3. API lưu trữ & đồng bộ tiến trình (state)
 * 4. API nhận phản hồi hẹn hò (Date Voucher)
 * 5. API nhận tin nhắn bí mật từ Huyền Trân
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const emailNotifier = require('./services/emailNotifier');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// File lưu trữ dữ liệu (Database JSON đơn giản, bền bỉ)
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

// Đảm bảo thư mục data và file db.json tồn tại
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadDatabase() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Lỗi đọc database:', e);
  }
  return {
    verifiedUsers: [],
    savedState: {},
    dateVouchers: [],
    messages: []
  };
}

function saveDatabase(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Lỗi lưu database:', e);
  }
}

let db = loadDatabase();

/**
 * Chuẩn hóa tên tiếng Việt (loại bỏ dấu, ký tự đặc biệt, emoji)
 */
function normalizeName(str) {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^\p{L}\s]/gu, '') // xóa emoji, số, ký tự đặc biệt, dấu câu
    .replace(/\s+/g, ' ')
    .trim();
}

function isValidRecipient(inputName) {
  const norm = normalizeName(inputName);
  if (!norm) return false;

  if (norm.includes('khong phai') || norm.includes('ko phai') || norm.includes('chua phai')) {
    return false;
  }

  return norm.includes('huyen tran') || 
         norm.includes('huyentran') || 
         norm === 'tran' || 
         norm === 'be tran' || 
         norm === 'em tran' || 
         norm === 'tran tran';
}

// ==========================================
// API ROUTES
// ==========================================

// 1. Xác thực tên người nhận
app.post('/api/auth/verify', (req, res) => {
  const { name, rawInput } = req.body;
  const input = rawInput || name || '';

  if (isValidRecipient(input)) {
    const norm = normalizeName(input);
    const canonicalName = (norm.includes('tran thi') || norm.includes('tran huyen tran')) 
      ? 'Trần Thị Huyền Trân' 
      : 'Huyền Trân';
    const record = {
      name: canonicalName,
      rawInput: input,
      verifiedAt: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress
    };
    db.verifiedUsers.push(record);
    saveDatabase(db);

    // Gửi thông báo đến Gmail namho03052ki9@gmail.com
    emailNotifier.notifyAuthLogin(canonicalName, input, record.ip, record.verifiedAt).catch(() => {});

    return res.json({
      success: true,
      name: canonicalName,
      birthday: '11/01/2009',
      message: `Chào mừng ${canonicalName} đến với hộp quà 20/10 ♡`
    });
  } else {
    return res.status(403).json({
      success: false,
      message: 'Tên không khớp với người nhận món quà này.'
    });
  }
});

// 2. Lấy & Lưu trạng thái tiến trình (State)
app.get('/api/state', (req, res) => {
  res.json(db.savedState || {});
});

app.post('/api/state', (req, res) => {
  db.savedState = {
    ...db.savedState,
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  saveDatabase(db);
  res.json({ success: true });
});

// 3. Nhận phản hồi Hẹn Hò (Date Voucher)
app.post('/api/date-voucher', (req, res) => {
  const { recipient, activity, timestamp } = req.body;
  const voucher = {
    recipient: recipient || 'Huyền Trân',
    activity: activity || 'Hẹn hò ngắm hoàng hôn',
    timestamp: timestamp || new Date().toISOString()
  };
  db.dateVouchers.push(voucher);
  saveDatabase(db);
  console.log('🎉 Tín hiệu hẹn hò mới từ Huyền Trân:', voucher);

  // Gửi thông báo đến Gmail namho03052ki9@gmail.com
  emailNotifier.notifyDateVoucher(voucher.recipient, voucher.activity, voucher.timestamp).catch(() => {});

  res.json({ success: true, voucher });
});

app.get('/api/date-voucher', (req, res) => {
  res.json(db.dateVouchers || []);
});

// 4. Nhận tin nhắn bí mật gửi ngược lại cho bạn nam
app.post('/api/messages', (req, res) => {
  const { sender, content, time } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Nội dung tin nhắn không được rỗng.' });
  }

  const message = {
    id: Date.now(),
    sender: sender || 'Huyền Trân',
    content: content.trim(),
    time: time || new Date().toISOString()
  };

  db.messages.push(message);
  saveDatabase(db);
  console.log('💌 Tin nhắn mới từ Huyền Trân:', message);

  // Gửi thông báo đến Gmail namho03052ki9@gmail.com
  emailNotifier.notifySecretMessage(message.sender, message.content, message.time).catch(() => {});

  res.json({ success: true, message });
});

app.get('/api/messages', (req, res) => {
  res.json(db.messages || []);
});

// 5. Nhận tương tác (Gửi cái ôm, Rút vitamin)
app.post('/api/signal', (req, res) => {
  const { type, sender, detail, timestamp } = req.body;
  const time = timestamp || new Date().toISOString();
  const name = sender || 'Huyền Trân';

  const signalRecord = {
    id: Date.now(),
    type: type || 'hug',
    sender: name,
    detail: detail || (type === 'hug' ? 'Gửi một cái ôm ấm áp' : 'Rút vitamin'),
    time: time
  };

  db.messages.push(signalRecord);
  saveDatabase(db);
  console.log('✨ Tương tác mới từ Huyền Trân:', signalRecord);

  // Gửi thông báo đến Gmail namho03052ki9@gmail.com
  emailNotifier.notifySignal(name, type, detail, time).catch(() => {});

  res.json({ success: true, signal: signalRecord });
});
  res.json(db.messages || []);
});

// 5. Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Route mặc định đưa về index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Khởi chạy server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🌸 HỘP QUÀ 20/10 CHO HUYỀN TRÂN ĐANG CHẠY TẠI:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`====================================================`);
});
