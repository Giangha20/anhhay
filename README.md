# PHOTOWEB GALLERY — THƯ VIỆN ẢNH NGHỆ THUẬT TRỰC TUYẾN

**PhotoWeb** là website thư viện ảnh nghệ thuật trực tuyến hoàn chỉnh, hiện đại, tối ưu hiển thị mượt mà trên mọi thiết bị (máy tính, điện thoại, máy tính bảng), hỗ trợ đa mạng (WiFi, 4G, Internet toàn cầu) và sẵn sàng triển khai chỉ với 1 cú click lên **Vercel** thông qua GitHub repository:

👉 **GitHub Repository:** [https://github.com/Giangha20/anhhay.git](https://github.com/Giangha20/anhhay.git)

---

## 1. Công nghệ sử dụng

* **Next.js 14** (App Router, Server-side Rendering & Route Handlers).
* **React 18 & TypeScript**.
* **Tailwind CSS**: Thiết kế giao diện hiện đại, chuẩn thẩm mỹ, hỗ trợ Dark / Light mode.
* **Prisma ORM & SQLite**: Cơ sở dữ liệu gọn nhẹ, độc lập, không yêu cầu cài đặt phần mềm máy chủ nặng.
* **Sharp**: Xử lý và nén ảnh hiệu năng cao, tự động tạo WebP thumbnail.
* **Lucide React**: Bộ icon hiện đại, tinh gọn.

---

## 2. Các tính năng nổi bật dành cho người xem

* 🌐 **Truy cập toàn cầu:** Khách truy cập từ mọi nơi, mọi nhà mạng (WiFi khác nhau, 4G/5G) đều xem được ảnh với tốc độ cực nhanh.
* 🌓 **Chế độ Sáng / Tối (Dark / Light Theme):** Chuyển đổi giao diện dễ dàng, lưu trạng thái yêu thích.
* 🔍 **Tìm kiếm thông minh:** Tìm kiếm ảnh tức thì theo tên, mô tả hoặc từ khóa.
* 📁 **Bộ lọc danh mục:** Lọc ảnh theo từng danh mục chuyên biệt (Thiên nhiên, Kiến trúc, Chân dung...).
* 🖼️ **Trình xem ảnh Lightbox toàn màn hình:**
  - Hiển thị ảnh sắc nét, giữ đúng tỷ lệ, không vỡ hay méo hình.
  - Chuyển ảnh Trước / Sau bằng nút bấm hoặc phím mũi tên `←` `→`.
  - Phím tắt `Esc` để đóng nhanh.
  - Hỗ trợ vuốt cảm ứng trên màn hình điện thoại.
  - Phóng to / Thu nhỏ ảnh chi tiết.
  - Tải ảnh gốc độ nét cao về máy.

---

## 3. Hướng dẫn triển khai lên Vercel (Để ai cũng xem được từ khắp nơi)

Dự án đã được cấu hình tối ưu sẵn sàng cho nền tảng đám mây **Vercel**:

### Bước 1: Đăng nhập Vercel
1. Truy cập [vercel.com](https://vercel.com) và đăng nhập bằng tài khoản GitHub của bạn.

### Bước 2: Import dự án từ GitHub
1. Bấm **"Add New..."** -> Chọn **"Project"**.
2. Tìm và chọn repository **`anhhay`** (`Giangha20/anhhay`).

### Bước 3: Cấu hình biến môi trường (Environment Variables)
Tại mục **Environment Variables**, thêm 2 biến sau:
* `DATABASE_URL` = `file:/tmp/photoweb.db`
* `STORAGE_PATH` = `/tmp/photoweb_storage`

### Bước 4: Triển khai (Deploy)
* Bấm **Deploy**.
* Chờ 1 - 2 phút để Vercel tự động build.
* Sau khi hoàn tất, Vercel sẽ cấp cho bạn một tên miền miễn phí (ví dụ: `https://anhhay.vercel.app`). Bất kỳ ai trên thế giới dùng điện thoại hay máy tính đều có thể truy cập và chiêm ngưỡng ảnh!

---

## 4. Hướng dẫn chạy trên máy tính Windows (Local / Mạng LAN)

Nếu bạn muốn chạy trực tiếp trên máy tính Windows của mình:

### Bước 1: Cài đặt tự động
Nhấp đúp chuột vào tệp:
👉 **`cai-dat.bat`**

Hoặc chạy lệnh trong Terminal:
```bash
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js
```

### Bước 2: Khởi động máy chủ
Nhấp đúp chuột vào tệp:
👉 **`chay-server.bat`**

Hoặc chạy lệnh:
```bash
npm run build
npm run start
```

* Truy cập trên máy chủ: `http://localhost:3000`
* Truy cập từ điện thoại/máy khác cùng mạng WiFi: `http://[IP-MAY-CHU]:3000` *(sử dụng tệp `mo-tuong-lua.bat` để mở cổng tường lửa nếu cần)*.

---

## 5. Chạy kiểm thử tự động

```bash
npm run test:api
# hoặc
node scripts/test-api.js
```

---

## 6. Cấu trúc thư mục dự án

```
D:\PhotoWeb\
├── storage\
│   ├── images\         <-- Lưu ảnh gốc
│   ├── thumbnails\     <-- Lưu ảnh thu nhỏ WebP
│   └── photoweb.db     <-- Cơ sở dữ liệu SQLite
├── prisma\
│   ├── schema.prisma   <-- Cấu hình lược đồ dữ liệu
│   └── seed.js         <-- Khởi tạo danh mục và cài đặt mẫu
├── src\
│   ├── app\            <-- Giao diện & Public API Handlers
│   ├── components\     <-- Giao diện React (Navbar, Footer, Lightbox, PhotoCard...)
│   └── lib\            <-- Tiện ích lưu trữ, Prisma client
├── cai-dat.bat         <-- File cài đặt 1-click
├── chay-server.bat     <-- File khởi động máy chủ
└── README.md
```

© 2026 PhotoWeb Gallery.
