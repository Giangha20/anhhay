@echo off
chcp 65001 >nul
echo ========================================================
echo     PHOTOWEB - KHỞI ĐỘNG MÁY CHỦ PHÁT TRIỂN (DEVELOPMENT)
echo ========================================================
echo.
echo Địa chỉ truy cập tại máy chủ: http://localhost:3000
echo Địa chỉ truy cập trong mạng LAN: http://[IP-MAY-CHU]:3000
echo.

cd /d "D:\PhotoWeb"
call npm run dev
pause
