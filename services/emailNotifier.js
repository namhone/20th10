/**
 * Module Dịch Vụ Gửi Email Thông Báo Tự Động Đến namho03052ki9@gmail.com
 * Khi nhận được bất kỳ tín hiệu nào từ bạn Trần Thị Huyền Trân (11/01/2009)
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TARGET_EMAIL = process.env.TARGET_EMAIL || 'namho03052ki9@gmail.com';
const CC_EMAIL = process.env.CC_EMAIL || 'namho03052k9@gmail.com';

const LOG_FILE = path.join(__dirname, '..', 'data', 'notifications.log');

// Đảm bảo file notifications.log tồn tại
function logNotification(event, details) {
  const line = `[${new Date().toISOString()}] [${event.toUpperCase()}] ${JSON.stringify(details)}\n`;
  try {
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch (e) {
    console.error('Không thể ghi log thông báo:', e);
  }
}

// Khởi tạo Transporter
function getTransporter() {
  const user = process.env.GMAIL_USER || process.env.EMAIL_USER;
  const pass = process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user.trim(),
      pass: pass.trim().replace(/\s+/g, '') // tự động xóa dấu cách nếu người dùng copy app password
    }
  });
}

/**
 * Gửi email thông báo
 */
async function sendNotificationEmail(subject, htmlContent, plainText = '') {
  logNotification('EMAIL_DISPATCH', { subject, text: plainText || subject });

  const transporter = getTransporter();
  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`💌 [THÔNG BÁO TÍN HIỆU TỪ HUYỀN TRÂN CẦN GỬI ĐẾN GMAIL]`);
    console.log(`👉 Người nhận: ${TARGET_EMAIL}`);
    console.log(`👉 Tiêu đề: ${subject}`);
    console.log(`👉 Nội dung: ${plainText || subject}`);
    console.log(`⚠️ (Chưa cấu hình GMAIL_USER / GMAIL_PASS trong file .env, dữ liệu đã được lưu an toàn vào data/notifications.log)`);
    console.log(`======================================================\n`);
    return { success: false, reason: 'Chưa cấu hình thông tin đăng nhập Gmail trong .env' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Hộp Quà 20/10 Bí Mật" <${process.env.GMAIL_USER}>`,
      to: TARGET_EMAIL,
      cc: CC_EMAIL,
      subject: subject,
      text: plainText || subject,
      html: htmlContent
    });

    console.log(`✅ Đã gửi email thông báo thành công đến ${TARGET_EMAIL}! MessageId:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Lỗi khi gửi email đến ${TARGET_EMAIL}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Tạo khung HTML email tông màu hoa hồng lãng mạn
 */
function createEmailTemplate(title, badge, bodyHtml, timeStr) {
  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif; background-color: #FFFDF9; border: 2px solid #FFCCD7; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(255, 71, 126, 0.1);">
      <div style="background: linear-gradient(135deg, #FF6B8B 0%, #FF477E 100%); padding: 24px 20px; text-align: center; color: white;">
        <div style="font-size: 32px; margin-bottom: 6px;">💖</div>
        <div style="background-color: rgba(255,255,255,0.25); display: inline-block; padding: 4px 14px; border-radius: 999px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
          ${badge}
        </div>
        <h1 style="margin: 10px 0 0 0; font-size: 22px; font-weight: bold; line-height: 1.3;">
          ${title}
        </h1>
      </div>
      
      <div style="padding: 28px 24px; color: #4A4242; font-size: 15px; line-height: 1.6;">
        ${bodyHtml}
        
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed #FFA3B5; font-size: 12px; color: #8C8282; text-align: center;">
          ⏰ Thời gian ghi nhận: <strong>${timeStr || new Date().toLocaleString('vi-VN')}</strong><br>
          🌸 Món quà 20/10 dành riêng cho bạn: <strong>Trần Thị Huyền Trân (11/01/2009)</strong>
        </div>
      </div>
    </div>
  `;
}

// 1. Thông báo khi bạn Huyền Trân mở khóa vào web
async function notifyAuthLogin(name, rawInput, ip, time) {
  const timeStr = time ? new Date(time).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN');
  const subject = `🎉 [20/10] Bé ${name} vừa mở khóa hộp quà bí mật!`;
  const bodyHtml = `
    <div style="background-color: #FFF5F7; border-left: 4px solid #FF477E; padding: 14px 16px; border-radius: 0 12px 12px 0; margin-bottom: 16px;">
      <p style="margin: 0; font-size: 16px; font-weight: bold; color: #E01E5A;">
        ✨ Ting ting! Bé Huyền Trân đã ghé thăm hộp quà rồi nè anh ơi!
      </p>
    </div>
    <p>Người dùng vừa mở khóa thành công:</p>
    <ul style="background: white; border: 1px solid #FFE6EC; padding: 16px 20px 16px 36px; border-radius: 12px; margin: 0 0 16px 0;">
      <li>Tên chuẩn hóa: <strong style="color: #FF477E;">${name}</strong></li>
      <li>Tên bạn ý gõ vào: <em>"${rawInput || name}"</em></li>
      <li>Địa chỉ IP: <code>${ip || 'Không xác định'}</code></li>
    </ul>
    <p style="color: #645B5B; font-size: 14px;">Bé Trân đang xem Trái tim 3D và khám phá 30 bức thư anh viết đó, chúc mừng anh nhé! ♡</p>
  `;
  return await sendNotificationEmail(subject, createEmailTemplate(subject, "Tín hiệu đăng nhập", bodyHtml, timeStr), `Bé ${name} vừa mở khóa hộp quà bí mật lúc ${timeStr}! Tên gõ vào: "${rawInput}"`);
}

// 2. Thông báo khi bạn Huyền Trân xác nhận Vé Hẹn Hò
async function notifyDateVoucher(recipient, activity, time) {
  const timeStr = time ? new Date(time).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN');
  const subject = `💌 [20/10] Bé ${recipient} đã chọn hoạt động hẹn hò cùng anh!`;
  const bodyHtml = `
    <div style="background-color: #FFF9F0; border: 2px dashed #FFA3B5; padding: 18px; border-radius: 16px; text-align: center; margin-bottom: 18px;">
      <span style="font-size: 30px;">🎟️</span>
      <h3 style="margin: 8px 0 4px 0; color: #B81446; font-size: 18px;">PHIẾU HẸN HÒ ĐÃ ĐƯỢC KÍCH HOẠT</h3>
      <p style="margin: 0; font-size: 13px; color: #8C8282;">Hạn dùng: Vô thời hạn ♡</p>
      
      <div style="background-color: #FFFDF9; border: 1px solid #FFCCD7; padding: 12px 16px; border-radius: 12px; margin-top: 14px; font-size: 16px; font-weight: bold; color: #E01E5A;">
        👉 "${activity}"
      </div>
    </div>
    <p style="font-size: 15px;">
      Bé <strong style="color: #FF477E;">${recipient}</strong> mong muốn chúng mình sẽ làm điều này cùng nhau! Anh nhớ lên kế hoạch thật chu đáo để đưa bạn ý đi date nhé! ♡
    </p>
  `;
  return await sendNotificationEmail(subject, createEmailTemplate(subject, "Tín hiệu hẹn hò (Date Voucher)", bodyHtml, timeStr), `Bé ${recipient} đã chọn hẹn hò: "${activity}" lúc ${timeStr}!`);
}

// 3. Thông báo khi bạn Huyền Trân gửi lời nhắn bí mật
async function notifySecretMessage(sender, content, time) {
  const timeStr = time ? new Date(time).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN');
  const subject = `💌 [20/10] Lời nhắn bí mật từ Bé ${sender}!`;
  const bodyHtml = `
    <div style="background-color: #FFF5F7; border: 1px solid #FFA3B5; border-radius: 16px; padding: 18px 20px; margin-bottom: 16px;">
      <div style="font-size: 13px; font-weight: bold; color: #E01E5A; margin-bottom: 8px;">
        ✉️ Lời nhắn riêng gửi từ ${sender}:
      </div>
      <div style="font-size: 16px; color: #322C2C; line-height: 1.7; font-style: italic; white-space: pre-wrap; background: white; padding: 14px 16px; border-radius: 10px; border: 1px solid #FFE6EC;">
        "${content}"
      </div>
    </div>
    <p style="color: #645B5B; font-size: 14px;">
      Hãy đọc thật kỹ và gửi lại cho bạn ý một nụ cười hoặc tin nhắn trả lời thật ấm áp nha anh! ♡
    </p>
  `;
  return await sendNotificationEmail(subject, createEmailTemplate(subject, "Hòm thư bí mật", bodyHtml, timeStr), `Lời nhắn bí mật từ ${sender}: "${content}" (Gửi lúc ${timeStr})`);
}

// 4. Thông báo khi bạn Huyền Trân tương tác (Gửi cái ôm, rút vitamin)
async function notifySignal(sender, type, detail, time) {
  const timeStr = time ? new Date(time).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN');
  let subject = `🧸 [20/10] Bé ${sender} vừa gửi một cái ôm cho anh!`;
  let titleBadge = "Cái ôm ấm áp";
  let bodyDetail = "Bé Trân vừa bấm nút gửi lại cho anh một cái ôm thật to và ấm áp đó!";

  if (type === 'vitamin') {
    subject = `💊 [20/10] Bé ${sender} vừa rút 1 viên vitamin sức khỏe!`;
    titleBadge = "Vitamin sức khỏe";
    bodyDetail = `Bé Trân vừa rút viên vitamin: <em>"${detail}"</em>`;
  }

  const bodyHtml = `
    <div style="background-color: #FFFDF9; border: 1px solid #FFCCD7; border-radius: 16px; padding: 16px; text-align: center; margin-bottom: 16px;">
      <div style="font-size: 32px; margin-bottom: 8px;">${type === 'vitamin' ? '💊' : '🧸'}</div>
      <p style="font-size: 15px; font-weight: 600; color: #B81446; margin: 0;">${bodyDetail}</p>
    </div>
  `;
  return await sendNotificationEmail(subject, createEmailTemplate(subject, titleBadge, bodyHtml, timeStr), `${sender} đã gửi tương tác (${type}): ${detail || 'Một cái ôm ấm áp'}`);
}

module.exports = {
  notifyAuthLogin,
  notifyDateVoucher,
  notifySecretMessage,
  notifySignal,
  sendNotificationEmail
};
