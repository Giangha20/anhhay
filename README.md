# PHOTOWEB GALLERY — HỆ THỐNG MÁY CHỦ THƯ VIỆN ẢNH CHUYÊN NGHIỆP TRÊN WINDOWS (Ổ D)

Chào mừng bạn đến với **PhotoWeb** — Website thư viện ảnh hoàn chỉnh, hiện đại, vận hành thực tế trên máy tính Windows, lưu trữ toàn bộ dữ liệu bền vững trên ổ `D:\PhotoWeb`.

Dự án được xây dựng theo kiến trúc full-stack chuẩn mực với **Next.js App Router, TypeScript, Tailwind CSS, SQLite, Prisma ORM, Sharp và bảo mật phiên HttpOnly Bcrypt**.

---

## 1. Cấu trúc lưu trữ dữ liệu trên ổ D

Toàn bộ dữ liệu của website được tổ chức độc lập, an toàn tại `D:\PhotoWeb`:

```
D:\PhotoWeb\
├── storage\
│   ├── images\         <-- Lưu ảnh gốc độ phân giải cao do Admin tải lên
│   ├── thumbnails\     <-- Lưu ảnh thu nhỏ nén WebP tối ưu tải nhanh
│   ├── backups\        <-- Lưu các bản sao lưu cơ sở dữ liệu (.zip)
│   └── photoweb.db     <-- Cơ sở dữ liệu SQLite chính
├── prisma\
│   ├── schema.prisma   <-- Cấu hình cấu trúc bảng dữ liệu Prisma
│   └── seed.js         <-- Script khởi tạo admin và dữ liệu ban đầu
├── src\
│   ├── app\            <-- Giao diện & Route Handlers (Next.js App Router)
│   ├── components\     <-- Các thành phần React (Navbar, Lightbox, PhotoCard...)
│   └── lib\            <-- Thư viện quản lý ổ D, Auth, Prisma, Audit log, Zod
├── scripts\
│   └── test-api.js     <-- Bộ kiểm thử tự động toàn diện
├── cai-dat.bat         <-- Script tự động cài đặt và khởi tạo DB
├── chay-dev.bat        <-- Script chạy server phát triển
├── chay-server.bat     <-- Script chạy server chính thức (Production)
├── mo-tuong-lua.bat    <-- Script mở tường lửa Windows cho mạng LAN
├── sao-luu.bat         <-- Script tạo bản sao lưu nhanh
├── .env                <-- Biến môi trường hệ thống
└── package.json        <-- Danh sách thư viện và scripts
```

> **Ghi chú an toàn:** Khi khởi động lại máy tính hoặc cập nhật mã nguồn, toàn bộ ảnh trong `storage/images` và dữ liệu trong `storage/photoweb.db` được bảo toàn nguyên vẹn 100%.

---

## 2. Thông tin tài khoản quản trị khởi tạo

* **Trang đăng nhập Admin:** `http://localhost:3000/admin/login`
* **Tên đăng nhập:** `giangtptq`
* **Mật khẩu khởi tạo ban đầu:** `Giangha@2k5`

> **Lưu ý bảo mật:** Mật khẩu được mã hóa an toàn bằng thuật toán Bcrypt (12 salt rounds). Khi đăng nhập lần đầu, thanh cảnh báo màu vàng sẽ xuất hiện nhắc nhở bạn vào mục **"Tài khoản admin"** để đổi mật khẩu quản trị riêng của mình.

---

## 3. Hướng dẫn cài đặt từ đầu (Cho người dùng VS Code)

### Bước 1: Yêu cầu môi trường
* Máy tính đã cài đặt **Node.js** (phiên bản 18, 20 hoặc 22 LTS). Bạn có thể tải tại [nodejs.org](https://nodejs.org).
* Có phân vùng ổ đĩa `D:\` trên máy tính.

### Bước 2: Mở dự án trong Visual Studio Code
1. Khởi động **Visual Studio Code**.
2. Chọn menu **File** -> **Open Folder...** -> Chọn thư mục `D:\PhotoWeb`.
3. Mở terminal trong VS Code bằng phím tắt `Ctrl + ` ` ` (hoặc menu **Terminal** -> **New Terminal**).

### Bước 3: Cài đặt tự động bằng 1 cú nhấp chuột
Tại thư mục `D:\PhotoWeb`, nhấp đúp vào tệp:
👉 **`cai-dat.bat`**

Hoặc chạy lệnh trong Terminal:
```bash
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js
```

---

## 4. Hướng dẫn khởi chạy máy chủ

### Cách 1: Chạy chế độ Production (Khuyên dùng khi sử dụng thực tế)
Nhấp đúp chuột vào tệp:
👉 **`chay-server.bat`**

Hoặc qua Terminal:
```bash
npm run build
npm run start
```
* Máy chủ sẽ lắng nghe trên cổng `3000` tại địa chỉ `0.0.0.0:3000`.

### Cách 2: Chạy chế độ Phát triển (Development)
Nhấp đúp chuột vào tệp:
👉 **`chay-dev.bat`**

Hoặc qua Terminal:
```bash
npm run dev
```

---

## 5. Hướng dẫn để điện thoại, iPad và máy khác cùng mạng WiFi/LAN xem được ảnh

Khi máy tính của bạn đóng vai trò làm máy chủ, mọi thiết bị kết nối vào cùng mạng WiFi gia đình hoặc mạng nội bộ (LAN) đều có thể xem ảnh và đồng bộ tức thì.

### Bước 1: Lấy địa chỉ IP của máy chủ Windows
1. Nhấn phím `Windows + R`, gõ `cmd` rồi nhấn `Enter`.
2. Gõ lệnh:
   ```cmd
   ipconfig
   ```
3. Tìm dòng **IPv4 Address** của cổng mạng bạn đang dùng (ví dụ: `192.168.1.15`).

### Bước 2: Mở tường lửa Windows (Chỉ cần làm 1 lần)
Nhấp chuột phải vào tệp **`mo-tuong-lua.bat`** và chọn **Run as administrator** (Chạy với quyền Quản trị viên).

*(Hoặc mở Command Prompt với quyền Admin và chạy lệnh):*
```cmd
netsh advfirewall firewall add rule name="PhotoWeb Server Port 3000" dir=in action=allow protocol=TCP localport=3000
```

### Bước 3: Truy cập từ thiết bị khác
Trên trình duyệt của điện thoại (Safari, Chrome), máy tính bảng hoặc laptop khác cùng mạng:
Truy cập vào:
👉 **`http://192.168.1.15:3000`** *(thay bằng IP máy của bạn)*

* Khi Admin tải ảnh mới hoặc đổi tên website trên máy tính, người xem trên điện thoại sẽ nhìn thấy thay đổi ngay khi làm mới trang!

### Bước 4: Triển khai lên Vercel để ai cũng truy cập được từ mọi nơi (Khác WiFi, 4G, Toàn cầu)

Dự án đã được cấu hình sẵn sàng tương thích 100% với nền tảng đám mây **Vercel**:
* **GitHub Repository:** `https://github.com/Giangha20/anhhay.git`

**Cách kết nối Vercel chỉ với 3 bước:**
1. Truy cập [vercel.com](https://vercel.com) và đăng nhập bằng tài khoản GitHub của bạn.
2. Bấm **"Add New..."** -> **"Project"** -> Chọn repository **`anhhay`**.
3. Tại phần **Environment Variables**, thêm 2 biến:
   * `DATABASE_URL`: `file:/tmp/photoweb.db`
   * `STORAGE_PATH`: `/tmp/photoweb_storage`
4. Bấm **Deploy**. Sau 1-2 phút, bạn sẽ nhận được đường link website chính thức (ví dụ: `https://anhhay.vercel.app`) hoạt động toàn cầu, bất kỳ ai dùng mạng WiFi hay 4G ở bất kỳ đâu cũng truy cập mượt mà!

---


## 6. Các tính năng nổi bật của website

### 📸 Giao diện khách xem ảnh
* **Thanh điều hướng nổi bật:** Tên website đọc động từ cơ sở dữ liệu (Admin đổi tên là web đổi ngay), ô tìm kiếm ảnh theo tên/mô tả, nút chuyển đổi giao diện Sáng / Tối (Dark mode).
* **Lưới ảnh chuẩn nghệ thuật:** Bố cục Grid hoặc Masonry, giữ đúng tỷ lệ ảnh, hiệu ứng hover mượt mà, phân trang tải thêm (Load more) mượt mà.
* **Bộ lọc danh mục:** Lọc ảnh theo chủ đề trực quan.
* **Trình xem ảnh toàn màn hình (Lightbox):**
  - Xem ảnh phóng lớn, giữ đúng tỷ lệ.
  - Nút chuyển ảnh Trước / Sau.
  - Phím tắt máy tính: `Esc` để đóng, mũi tên trái/phải `←` `→` để chuyển ảnh.
  - Cảm ứng vuốt tay (Swipe) trên điện thoại và máy tính bảng.
  - Nút phóng to chi tiết (Zoom in / Zoom out) và nút tải ảnh gốc.

### 🛡️ Khu vực Quản trị Admin (`/admin`)
1. **Tổng quan (Dashboard):** Thống kê số lượng ảnh, danh mục, dung lượng sử dụng trên ổ D (ảnh gốc, thumbnail, database), nhật ký hoạt động.
2. **Quản lý ảnh:** Tải lên một hoặc nhiều ảnh cùng lúc, kéo thả tệp, kiểm tra định dạng an toàn bằng Sharp, nhập tiêu đề, mô tả, phân loại danh mục, sửa thông tin, xóa ảnh (xóa sạch tệp trên ổ D).
3. **Quản lý danh mục:** Thêm, sửa, đổi tên, slug, thứ tự, ẩn/hiện, hỗ trợ danh mục phân cấp cha - con không giới hạn (có thuật toán chống vòng lặp đệ quy). Khi xóa danh mục có ảnh, hệ thống bảo toàn ảnh và cho phép chuyển ảnh sang danh mục khác hoặc chuyển về trạng thái Chưa phân loại.
4. **Nội dung trang chủ:** Quản lý các khối Banner, Giới thiệu, Lời ngỏ.
5. **Cài đặt website:** Đổi tên website, đổi logo, tiêu đề SEO, màu chủ đạo (Primary color), màu nền, số lượng ảnh mỗi trang, kiểu lưới hiển thị.
6. **Tài khoản admin:** Đổi mật khẩu với mã hóa Bcrypt 12 rounds, đổi tên đăng nhập, tự động hủy các phiên đăng nhập cũ khi đổi thông tin.
7. **Sao lưu & Phục hồi:** Tạo bản sao lưu `.zip` cơ sở dữ liệu chỉ bằng 1 nút bấm, tải tệp sao lưu về máy, danh sách sao lưu trong `D:\PhotoWeb\storage\backups`.
8. **Nhật ký hoạt động (Audit Log):** Ghi nhận chi tiết từng thao tác của Admin (đăng nhập, tải ảnh, xóa ảnh, đổi cấu hình) cùng địa chỉ IP và thời gian thực hiện.

---

## 7. Chạy bộ kiểm thử tự động

Hệ thống đi kèm bộ kiểm thử tự động 29 tiêu chí độc lập kiểm tra sâu từ phân vùng ổ D, thao tác database, Sharp thumbnail, bảo mật Session, và phòng chống Path Traversal:

```bash
npm run test:api
# hoặc
node scripts/test-api.js
```

---

## 8. Hướng dẫn sao lưu & Phục hồi thủ công

* **Sao lưu nhanh:** Nhấp đúp vào tệp `sao-luu.bat` hoặc vào trang Quản trị -> **Sao lưu & Phục hồi** -> bấm **Tạo bản sao lưu ngay**.
* **Sao lưu thủ công toàn bộ:** Copy toàn bộ thư mục `D:\PhotoWeb\storage` sang USB hoặc ổ cứng di động.
* **Phục hồi:** Chép tệp `photoweb.db` và các thư mục `images`, `thumbnails` vào `D:\PhotoWeb\storage\` rồi chạy lại server.

---
**PhotoWeb** được tối ưu hóa cho Windows 10/11, sẵn sàng vận hành thực tế và ổn định lâu dài.
