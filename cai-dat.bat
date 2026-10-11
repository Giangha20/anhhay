@echo off
chcp 65001 >nul
echo ========================================================
echo     PHOTOWEB - CÀI ĐẶT HỆ THỐNG MÁY CHỦ TRÊN Ổ D
echo ========================================================
echo.

cd /d "D:\PhotoWeb"

echo [1/4] Đang cài đặt các thư viện Node.js (npm install)...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [LỖI] Không thể cài đặt dependencies. Vui lòng kiểm tra Node.js và mạng Internet.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/4] Đang khởi tạo Prisma Client...
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo [LỖI] Không thể sinh Prisma client.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/4] Đang đồng bộ cơ sở dữ liệu SQLite vào D:\PhotoWeb\storage\photoweb.db...
call npx prisma db push
if %ERRORLEVEL% NEQ 0 (
    echo [LỖI] Không thể tạo cơ sở dữ liệu SQLite.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [4/4] Đang khởi tạo tài khoản quản trị và dữ liệu mẫu ban đầu...
call node prisma/seed.js
if %ERRORLEVEL% NEQ 0 (
    echo [LỖI] Không thể chạy seed script.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================================
echo     CÀI ĐẶT HOÀN TẤT THÀNH CÔNG!
echo     Tài khoản admin ban đầu: giangtptq
echo     Mật khẩu ban đầu: Giangha@2k5
echo     Bạn có thể chạy 'chay-server.bat' để khởi động máy chủ.
echo ========================================================
pause
