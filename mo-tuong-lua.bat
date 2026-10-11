@echo off
chcp 65001 >nul
echo ========================================================
echo   PHOTOWEB - CẤU HÌNH TƯỜNG LỬA WINDOWS CHO MẠNG LAN
echo ========================================================
echo.
echo LƯU Ý: Vui lòng chạy tệp này bằng quyền Administrator (Run as administrator)
echo để thêm luật cho phép cổng 3000 qua Windows Firewall.
echo.

netsh advfirewall firewall add rule name="PhotoWeb Server Port 3000" dir=in action=allow protocol=TCP localport=3000

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [THÀNH CÔNG] Đã mở cổng 3000 trên Windows Defender Firewall!
    echo Các thiết bị khác trong mạng WiFi/LAN đã có thể truy cập http://IP-MAY-CHU:3000
) else (
    echo.
    echo [THẤT BẠI] Không thể thêm luật tường lửa. Bạn cần nhấp chuột phải vào tệp này và chọn 'Run as administrator'.
)

echo.
pause
