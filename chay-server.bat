@echo off
chcp 65001 >nul
echo ========================================================
echo     PHOTOWEB - KHỞI ĐỘNG MÁY CHỦ THƯ VIỆN ẢNH (PRODUCTION)
echo ========================================================
echo.
echo Website lắng nghe trên cổng 3000 (0.0.0.0:3000)
echo.
echo - Trên máy tính này: http://localhost:3000
echo - Điện thoại, iPad, máy khác cùng mạng WiFi/LAN: http://[IP-MAY-CHU]:3000
echo.

cd /d "D:\PhotoWeb"

if not exist ".next" (
    echo Chưa tìm thấy bản build, đang tiến hành biên dịch (npm run build)...
    call npm run build
)

call npm run start
pause
