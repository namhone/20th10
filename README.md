# 🌸 HỘP QUÀ 20/10 DÀNH RIÊNG CHO TRẦN THỊ HUYỀN TRÂN (11/01/2009)

Món quà công nghệ và tình cảm được chuẩn bị riêng cho bạn **Trần Thị Huyền Trân**, với:
1. **Tab 1 — Trái Tim 3D Điểm Hạt:** 5.200 hạt ánh sáng tạo hình trái tim 3D đang đập theo nhịp sinh học, tương tác xoay 360°, zoom, đổi góc nhìn (OrbitControls Three.js).
2. **Tab 2 — 30 Lời Thương & Hộp Quà 3D:** Gồm 10 bài thơ, 10 lời chúc, 10 cái ôm chữ; chú mèo bưu tá Miu Miu; bộ lọc cảm xúc và hộp quà mở nắp 3D rực rỡ.
3. **Tab 3 — Tri Ân Cho Người Con Gái Tớ Thích:** Lời xin lỗi chân thành vì đã để em chịu thiệt thòi, điều ước được gặp em ngoài đời thật, phiếu hẹn hò (Date Voucher), hũ vitamin sức khỏe và hòm thư phản hồi bí mật.

---

## ⚡ HỆ THỐNG THÔNG BÁO GMAIL TỰ ĐỘNG (ĐẾN namho03052ki9@gmail.com)

Hệ thống được thiết kế để tự động gửi thông báo đến `namho03052ki9@gmail.com` (và CC đến `namho03052k9@gmail.com`) mỗi khi bạn Huyền Trân có bất kỳ tương tác nào:
* 🔓 **Đăng nhập:** Bé Huyền Trân mở khóa cổng bí mật vào web.
* 🎟️ **Vé Hẹn Hò:** Bé Huyền Trân chọn một hoạt động đi date cùng anh.
* 💌 **Hòm Thư Bí Mật:** Bé Huyền Trân viết lời nhắn gửi lại cho anh.
* 🧸 **Cái Ôm / Vitamin:** Bé Huyền Trân bấm nút gửi lại cái ôm hoặc rút vitamin tinh thần.

### Cách Kích Hoạt Gửi Gmail (1 phút):
Mở file `.env` và điền:
```env
GMAIL_USER=taogay2k@gmail.com
GMAIL_PASS=xxxx xxxx xxxx xxxx
TARGET_EMAIL=namho03052ki9@gmail.com
CC_EMAIL=namho03052k9@gmail.com
```
> **Lưu ý về GMAIL_PASS:** Đây là *Mật khẩu ứng dụng (App Password)* gồm 16 chữ cái do Google cấp, không phải mật khẩu tài khoản Google thông thường. Bạn có thể lấy tại: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
> *(Nếu chưa điền pass, mọi tín hiệu của Huyền Trân vẫn được hệ thống ghi nhận tức thời và lưu trữ an toàn trong `data/notifications.log`)*.

---

## 🚀 TỰ ĐỘNG DEPLOY LÊN GITHUB (https://github.com/namhone/20th10)

Lệnh chạy quy trình deploy:
```bash
npm run deploy
```

Quy trình tự động thực hiện:
1. Quét và commit toàn bộ thay đổi mới vào Git.
2. Push lên nhánh `main` của repo `https://github.com/namhone/20th10`.
3. Tự động gọi script sao lưu (Backup) tạo file nén `.zip`.
4. Gửi email báo cáo trạng thái deploy về `namho03052ki9@gmail.com`.

---

## ☁️ TỰ ĐỘNG SAO LƯU (BACKUP) LÊN GOOGLE DRIVE (taogay2k@gmail.com)

Lệnh chạy tạo backup độc lập:
```bash
npm run backup
```

* File nén được đóng gói tự động dưới dạng `backups/backup_20th10_HuyenTran_YYYYMMDD_HHmmss.zip` (loại trừ `node_modules`, `.git`, file rác).
* Lịch sử sao lưu được lưu trữ tại `data/backups.json`.
* Tích hợp tự động đẩy file lên Google Drive qua công cụ `rclone` (nếu có cấu hình remote `gdrive:`) hoặc Google Drive API.

---

## 🛠️ LỆNH THƯỜNG DÙNG

```bash
# Khởi chạy máy chủ web cục bộ (cổng 3000)
npm start

# Chạy quy trình Deploy lên GitHub + Tạo Backup + Báo Gmail
npm run deploy

# Chỉ chạy sao lưu (Backup zip)
npm run backup

# Chạy bộ kiểm thử tự động (Integration Test)
npm test
```
